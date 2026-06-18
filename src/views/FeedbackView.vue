<template>
  <div class="feedback" ref="feedbackMainContainer">
    <div class="feedback__container">
      <header
        class="feedback__header-container"
        v-if="!showCoachNominationForm"
      >
        <h1 class="feedback__header">Session Feedback</h1>
        <template v-if="session.createdAt">
          <p class="feedback__subheader">
            {{ sessionSubject }} session with {{ sessionPartnerFirstName }}
          </p>
          <p class="feedback__subheader">
            {{ sessionDate }} at {{ sessionTime }}
          </p>
        </template>
      </header>

      <div v-if="showCoachNominationForm" id="coach-nomination-form">
        <h2 class="feedback__header">
          Nominate {{ session.studentFirstName }} as a Coach
        </h2>
        <h3 class="feedback__subheader">Help grow our community of coaches</h3>

        <div class="nomination-content">
          <p class="nomination-subtext">
            Based on your session with {{ session.studentFirstName }}, do you
            think they'd make a great UPchieve Academic Coach? Coaches like you
            help thousands of students every year — and a quick nomination from
            you could be the nudge they need.
          </p>
          <p class="nomination-text">
            Choose the behaviors you actually observed in this session. These
            will be shared with the student!
          </p>

          <div class="nomination-coaching-skills-container">
            <FormCheckBox
              v-for="skill in coachingSkills"
              :label="skill.coachFacingValue"
              :name="skill.coachFacingValue"
              :key="skill.coachFacingValue"
              @update:modelValue="() => toggleCoachingSkill(skill)"
              class="coaching-skill"
              :class="{
                'coaching-skill-checked': skill.checked,
              }"
            />
          </div>
          <div class="nomination-buttons">
            <Spinner v-if="isSubmitting" />
            <LargeButton
              v-else
              variant="primary-blue"
              @click="submitNomination"
              :showArrow="true"
              :disabled="!hasSelectedCoachingSkills"
            >
              Submit nomination
            </LargeButton>
            <button
              type="button"
              @click="optOutOfNomination"
              class="tertiary-button"
            >
              No thanks, go to dashboard
            </button>
          </div>
        </div>
      </div>

      <template v-else-if="completedFeedback">
        <h2 class="feedback__header" v-if="completedFeedback">
          Thank you for your feedback!
        </h2>
        <large-button primary routeTo="/" class="feedback__dashboard-button">
          Take me to the dashboard
        </large-button>
      </template>

      <template v-else>
        <ul class="feedback__questions-list">
          <div>
            <li
              v-for="questionInfo in filteredQuestions"
              :key="questionInfo.questionId"
              :class="{
                'feedback__questions-item': !(
                  questionInfo.questionType === 'radio'
                ),
              }"
            >
              <div v-if="questionInfo.headerText">
                <hr />
                <div class="question__section-header">
                  {{ questionInfo.headerText }}
                </div>
              </div>
              <div class="question__title">
                {{ questionInfo.question.questionText }}
              </div>
              <div
                :class="{
                  'question__responses-images': isRowOfImages(
                    questionInfo.question
                  ),
                  'question__responses-rating':
                    questionInfo.questionType === 'number-rating',
                  'question__responses-radio':
                    questionInfo.questionType === 'radio',
                  'question__responses-vertical':
                    isHighRatingQuestion(questionInfo.question) ||
                    isGuidelineIssueListQuestion(questionInfo.question),
                  'question__responses-postsession': !(
                    isHighRatingQuestion(questionInfo.question) ||
                    isGuidelineIssueListQuestion(questionInfo.question)
                  ),
                }"
              >
                <template
                  v-for="(response, index) in questionInfo.question.responses"
                >
                  <survey-image
                    v-if="questionInfo.questionType === 'emoji'"
                    class="question__response question__response-image"
                    :key="`${response.responseId}-image`"
                    :src="response.responseDisplayImage"
                    :label="response.responseText"
                    :questionId="questionInfo.questionId"
                    :responseId="response.responseId"
                    :isSelected="
                      userResponse[questionInfo.questionId].responseId ===
                      response.responseId
                    "
                    @survey-image-click="updateUserResponse"
                  />
                  <survey-chip-option
                    v-else-if="questionInfo.questionType === 'chip'"
                    :key="`${response.responseId}-chip`"
                    :label="response.responseText"
                    :questionId="questionInfo.questionId"
                    :responseId="response.responseId"
                    :isSelected="
                      userResponse[questionInfo.questionId].responseId &&
                      !!userResponse[questionInfo.questionId].responseId.find(
                        (r) => r === response.responseId
                      )
                    "
                    @chip-click="updateUserResponseMultiselect"
                    class="issue-reason-chip"
                  />
                  <survey-image
                    v-else-if="questionInfo.questionType === 'star'"
                    class="question__response question__response-star"
                    :key="`${response.responseId}-star`"
                    :src="response.responseDisplayImage"
                    :questionId="questionInfo.questionId"
                    :responseId="response.responseId"
                    :isSelected="
                      shouldStarShowSelected(questionInfo.question, response)
                    "
                    @survey-image-click="updateUserResponse"
                  />
                  <survey-radio
                    v-else-if="questionInfo.questionType === 'radio'"
                    class="question__response question__response-boxed question__response-radio"
                    :class="{
                      'question__response-boxed-selected':
                        userResponse[questionInfo.questionId].responseId ===
                        response.responseId,
                    }"
                    :key="`${response.responseId}-radio`"
                    :id="`${questionInfo.questionId}_${response.responseId}`"
                    :radioValue="response.responseId"
                    :name="questionInfo.questionId"
                    :checked="
                      userResponse[questionInfo.questionId].responseId ===
                      response.responseId
                    "
                    :questionId="questionInfo.questionId"
                    :responseId="response.responseId"
                    :label="response.responseText"
                    :isOpenResponseDisabled="true"
                    @survey-radio-input="updateUserResponse"
                  />
                  <survey-checkbox
                    v-else-if="questionInfo.questionType === 'checkbox'"
                    class="question__response question__response-boxed"
                    :class="{
                      'question__response-boxed-selected':
                        userResponse[questionInfo.questionId].responseId &&
                        userResponse[questionInfo.questionId].responseId.find(
                          (r) => r === response.responseId
                        ),
                    }"
                    :key="`${response.responseId}-checkbox`"
                    :id="`${questionInfo.questionId}_${response.responseId}`"
                    :checkboxValue="response.responseId"
                    :name="questionInfo.questionId"
                    :checked="
                      userResponse[questionInfo.questionId].responseId ===
                      response.responseId
                    "
                    :questionId="questionInfo.questionId"
                    :responseId="response.responseId"
                    :label="response.responseText"
                    @survey-checkbox-input="updateUserResponseMultiselect"
                  />
                  <survey-rate-number
                    v-else-if="questionInfo.questionType === 'number-rating'"
                    class="question__response question__response-numbers"
                    :key="`${response.responseId}-rating`"
                    :src="response.responseDisplayImage"
                    :rating="(index + 1).toString()"
                    :label="index % 2 === 0 ? response.responseText : ''"
                    :questionId="questionInfo.questionId"
                    :responseId="response.responseId"
                    :isSelected="
                      userResponse[questionInfo.questionId].responseId ===
                      response.responseId
                    "
                    @survey-rate-click="updateUserResponse"
                  />
                  <div
                    v-else-if="questionInfo.questionType === 'free response'"
                    :key="`${response.responseId}-free-response`"
                    class="question__free-response"
                  >
                    <div
                      v-if="isOpenFeedbackQuestion(questionInfo.question)"
                      class="question__subtext"
                    >
                      Tell us about your experience. This could be about the
                      app, the session you had, or anything else you want to
                      share. We read every comment and use your ideas to make
                      UPchieve better.
                    </div>
                    <div
                      v-if="isHowFarInSchoolQuestion(questionInfo.question)"
                      class="question__subtext"
                    >
                      There's no right or wrong answer. Just share what feels
                      most true for you right now.
                    </div>
                    <feedback-textarea
                      :id="`${questionInfo.questionId}_${response.responseId}`"
                      @input="
                        (responseText) =>
                          updateUserResponse(
                            questionInfo.questionId,
                            response.responseId,
                            responseText
                          )
                      "
                    >
                    </feedback-textarea>
                  </div>
                </template>
              </div>
              <div
                class="response-answer-text"
                v-if="
                  questionInfo.questionType === 'star' &&
                  userResponse[questionInfo.questionId].responseId
                "
              >
                {{ getAnswerToQuestion(questionInfo.question) }}
              </div>
            </li>
          </div>
          <li v-if="volunteerFeedbackForStudentFlag && isSessionVolunteer">
            <div class="question__section-header">
              {{ volunteerFeedbackForStudentFlag.heading }}
            </div>
            <div class="question__title">
              {{ volunteerFeedbackForStudentFlag.question }}
            </div>
            <p class="question__subtext">
              {{ volunteerFeedbackForStudentFlag.subtext }}
            </p>
            <feedback-textarea
              id="volunteer-feedback-for-student"
              class="mt-4"
              @input="(response) => (volunteerFeedbackForStudent = response)"
            />
          </li>
        </ul>

        <p v-if="error" class="feedback__error">{{ error }}</p>

        <large-button
          class="feedback__submit-button"
          :disabled="!hasAnsweredAtLeastOneQuestion() ? true : null"
          primary
          @click="submitFeedback"
        >
          Submit
        </large-button>
        <loader v-if="isSubmitting || isLoading" :overlay="true" />
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import NetworkService from '@/services/NetworkService'
import LargeButton from '@/components/LargeButton.vue'
import { dayjs } from '@/utils/time-utils'
import FeedbackTextarea from '@/components/FeedbackTextarea.vue'
import Loader from '@/components/Loader.vue'
import SurveyRadio from '@/components/Surveys/SurveyRadio.vue'
import SurveyImage from '@/components/Surveys/SurveyImage.vue'
import SurveyRateNumber from '../components/Surveys/SurveyRateNumber.vue'
import SurveyChipOption from '../components/Surveys/SurveyChipOption.vue'
import SurveyCheckbox from '../components/Surveys/SurveyCheckbox.vue'
import { map, remove, orderBy, find, forEach, isEmpty } from 'lodash-es'
import { COACHING_SKILLS, EVENTS, POSTHOG_FEATURE_FLAGS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import FormCheckBox from '@/components/FormCheckBox.vue'
import LoggerService from '@/services/LoggerService'
import Spinner from '@/components/Spinner.vue'
import FeatureFlagService from '@/services/FeatureFlagService'

export default {
  name: 'FeedbackView',
  components: {
    Spinner,
    FormCheckBox,
    LargeButton,
    Loader,
    SurveyImage,
    SurveyRadio,
    SurveyRateNumber,
    SurveyChipOption,
    SurveyCheckbox,
    FeedbackTextarea,
  },
  data() {
    return {
      session: {},
      isLoading: true,
      isSubmitting: false,
      completedFeedback: false,
      surveySubmitted: false,
      isFavoriteCoach: false,
      isFavoriteCoachLimitReached: false,
      allQuestions: [],
      error: '',
      userResponse: {},
      volunteerFeedbackForStudent: '',
      coachingSkills: COACHING_SKILLS.map((skill) => ({
        ...skill,
        checked: false,
      })),
      isInvitationToCoachEnabledForStudent: false,
    }
  },
  computed: {
    ...mapGetters({
      userType: 'user/userType',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      volunteerFeedbackForStudentFlag:
        'featureFlags/volunteerFeedbackForStudentFlag',
      getStudentPostSessionSurveyNameVariant:
        'featureFlags/getStudentPostSessionSurveyNameVariant',
    }),
    ...mapState({
      subjects: (state) => state.subjects.subjects,
      userId: (state) => state.user.user.id,
    }),
    hasSelectedCoachingSkills() {
      return this.coachingSkills.some((skill) => skill.checked)
    },
    isEligibleToNominateCoach() {
      return (
        this.isSessionVolunteer && this.isInvitationToCoachEnabledForStudent
      )
    },
    showCoachNominationForm() {
      return this.surveySubmitted && this.isEligibleToNominateCoach
    },
    isSessionVolunteer() {
      return this.session.volunteerId === this.userId
    },
    sessionPartnerFirstName() {
      return this.isVolunteer
        ? this.session.student.firstName
        : this.session.volunteer.firstName
    },
    sessionSubject() {
      const subject = this.session.subTopic
      return this.subjects[subject]?.displayName
    },
    sessionTime() {
      return dayjs(this.session.createdAt).format('LT')
    },
    sessionDate() {
      return dayjs(this.session.createdAt).format('MMMM Do, YYYY')
    },
    questions() {
      return this.allQuestions.map((q) => q.question)
    },
    filteredQuestions() {
      return this.allQuestions.filter((q) => q.isVisible)
    },
    hasVolunteerFeedbackForStudent() {
      return !isEmpty(this.volunteerFeedbackForStudent)
    },
  },
  async beforeMount() {
    this.$store.dispatch('app/sidebar/hide')
    this.$store.dispatch('app/header/show', {
      component: 'SessionHeader',
    })
    const sessionId = this.$route.params.sessionId
    const [sessionResponse, postsessionAlreadySavedResponse] =
      await Promise.all([
        NetworkService.getSession(sessionId),
        NetworkService.getPostsessionSurveyResponse(sessionId, this.userType),
      ])

    const {
      data: { session },
    } = sessionResponse

    this.session = session
    const postsessionSurveyDefinitionResponse =
      await NetworkService.getPostsessionSurvey(
        this.session.subTopic,
        this.session.id,
        this.userType
      )
    this.surveyDefinition = postsessionSurveyDefinitionResponse.data.survey
    this.allQuestions = map(this.surveyDefinition.survey, (q) => {
      const isHiddenOnStart =
        this.isLowRatingQuestion(q) ||
        this.isHighRatingQuestion(q) ||
        this.isGuidelineIssueListQuestion(q)
      q.responses = orderBy(q.responses, (r) => r.displayPriority)
      return {
        questionId: q.questionId,
        question: q,
        isVisible: !isHiddenOnStart,
        questionType: this.getQuestionDisplayType(q),
        headerText: this.getQuestionSectionHeader(q),
      }
    })
    this.allQuestions = orderBy(
      this.allQuestions,
      (q) => q.question.displayPriority
    )
    this.buildUserResponse()

    if (postsessionAlreadySavedResponse.data.length > 0) {
      this.loading = false
      this.completedFeedback = true
      return
    }

    if (this.isStudent) {
      const response = await NetworkService.checkIsFavoriteVolunteer(
        this.session.volunteer._id
      )
      this.isFavoriteCoach = response.data.isFavorite
      if (!this.isFavoriteCoach) {
        const response = await NetworkService.getRemainingFavoriteVolunteers()
        this.isFavoriteCoachLimitReached = response.data.remaining === 0
      }
    }

    if (this.volunteerFeedbackForStudentFlag)
      AnalyticsService.captureEvent(
        EVENTS.VOLUNTEER_SHOWN_STUDENT_FEEDBACK_QUESTION
      )

    this.isLoading = false
  },
  async mounted() {
    AnalyticsService.captureEvent(EVENTS.POST_SESSION_SURVEY_SHOWN, {
      sessionId: this.session.id,
      surveyNameVariant: this.getStudentPostSessionSurveyNameVariant,
    })
  },
  watch: {
    async isSessionVolunteer(current) {
      if (current) {
        try {
          // The feature where the coach can nominate the student to become a coach
          // is driven by a feature flag which targets the *student*, not the coach.
          const flagResponse = await FeatureFlagService.isFeatureEnabledForUser(
            POSTHOG_FEATURE_FLAGS.INVITATION_TO_COACH,
            this.session.studentId
          )
          this.isInvitationToCoachEnabledForStudent = flagResponse.isEnabled
        } catch (err) {
          LoggerService.noticeError(
            err,
            'Failed to check if student is eligible for coach nomination form'
          )
        }
      }
    },
  },
  methods: {
    scrollToTop() {
      this.$refs.feedbackMainContainer.scrollIntoView({ behavior: 'smooth' })
    },
    optOutOfNomination() {
      AnalyticsService.captureEvent(EVENTS.COACH_SKIPPED_NOMINATION, {
        sessionId: this.session.id,
      })
      this.$router.push('/dashboard')
    },
    async submitNomination() {
      const selectedCoachingSkills = this.coachingSkills.filter(
        (s) => s.checked
      )
      const studentFacingCoachingSkills = selectedCoachingSkills.map(
        (s) => s.studentFacingValue
      )
      try {
        const requestBody = {
          sessionId: this.session.id,
          invitedUserId: this.session.studentId,
          coachingSkills: studentFacingCoachingSkills,
        }
        this.isSubmitting = true
        await NetworkService.createInvitationToCoach(requestBody)
        this.$store.commit('volunteer/setLastCoachNomination', {
          coachingSkills: selectedCoachingSkills,
        })
        AnalyticsService.captureEvent(EVENTS.COACH_SUBMITTED_NOMINATION, {
          sessionId: this.session.id,
        })
      } catch (err) {
        AnalyticsService.captureEvent(
          EVENTS.ERROR_SUBMITTING_COACH_NOMINATION,
          {
            sessionId: this.session.id,
          }
        )
        LoggerService.noticeError(
          err,
          'Error while attempting to create invitation to coach'
        )
        this.error = 'We could not submit your coach nomination due to an error'
      } finally {
        this.isSubmitting = false
        this.$router.push('/dashboard')
      }
    },
    toggleCoachingSkill(skill) {
      const existingSkillIndex = this.coachingSkills.findIndex(
        (s) => s.coachFacingValue === skill.coachFacingValue
      )
      const existingSkill = this.coachingSkills[existingSkillIndex]
      const newSkill = {
        ...existingSkill,
        checked: !existingSkill.checked,
      }
      this.coachingSkills[existingSkillIndex] = newSkill
      if (newSkill.checked) {
        AnalyticsService.captureEvent(
          EVENTS.COACH_CLICKED_COACHING_SKILLS_CHECKBOX,
          {
            skill: skill.coachFacingValue,
          }
        )
      }
    },
    getQuestionDisplayType(question) {
      if (question.questionType === 'multiple choice') {
        if (question.questionText.startsWith('How do you think')) {
          return 'emoji'
        } else if (this.isLowRatingQuestion(question)) {
          return 'chip'
        } else if (this.isStarRankingQuestion(question)) {
          return 'star'
        } else if (
          this.isHighRatingQuestion(question) ||
          this.isIssuePresentQuestion(question)
        ) {
          return 'radio'
        } else if (this.isGuidelineIssueListQuestion(question)) {
          return 'checkbox'
        } else if (this.isNumericalRatingQuestion(question)) {
          return 'number-rating'
        }
      }
      return question.questionType
    },
    getQuestionSectionHeader(question) {
      if (question.questionType === 'multiple choice') {
        if (question.questionText.startsWith('How do you think')) {
          return "Student's Feelings"
        } else if (this.isStarRankingQuestion(question)) {
          return this.isVolunteer ? "Student's Progress" : 'Your Goal'
        } else if (this.isIssuePresentQuestion(question)) {
          return 'Your Concerns'
        } else if (this.isHowSupportiveQuestion(question)) {
          return 'Your Coach'
        } else if (this.isConfidenceQuestion(question)) {
          return 'Your Progress'
        }
      }
      if (question.questionType === 'free response') {
        if (this.isOpenFeedbackQuestion(question)) {
          return 'Your Thoughts'
        }
      }
      return undefined
    },

    isRowOfImages(question) {
      return (
        question.questionType === 'emoji' || question.questionType === 'star'
      )
    },
    isStarRankingQuestion(question) {
      return (
        question.questionText.startsWith('Your goal for this session') ||
        question.questionText.endsWith('achieve their goal?')
      )
    },
    isGuidelineIssueListQuestion(question) {
      return question.questionText.startsWith('Please select all that apply')
    },
    isIssuePresentQuestion(question) {
      return question.questionText.startsWith('Were there any student safety')
    },
    isHowSupportiveQuestion(question) {
      return question.questionText.startsWith('Overall, how supportive')
    },
    isOpenFeedbackQuestion(question) {
      return (
        question.questionText.startsWith(
          'This can be about the web app, the student you helped, technical issues, etc.'
        ) ||
        question.questionText.startsWith(
          'This can be about the web app, the Academic Coach who helped you, the services UPchieve offers, etc.'
        )
      )
    },
    isConfidenceQuestion(question) {
      return question.questionText.startsWith(
        'How confident are you right now that you can solve problems like the one you worked on today - on your own?'
      )
    },
    isHowFarInSchoolQuestion(question) {
      return question.questionText.startsWith(
        'How far in school do you think you will get?'
      )
    },
    isNumericalRatingQuestion(question) {
      return (
        this.isHowSupportiveQuestion(question) ||
        question.questionText.startsWith('Overall, how much did your coach') ||
        question.questionText.startsWith(
          `During today's session, I felt like someone who can succeed in`
        ) ||
        question.questionText.startsWith(
          `After this session, I want to keep working on`
        ) ||
        question.questionText.startsWith(
          `How confident are you right now that you can solve problems like the one you worked on today - on your own?`
        )
      )
    },

    isHighRatingQuestion(question) {
      return question.questionText.startsWith(
        'Would you like to favorite your coach'
      )
    },
    isHighRatingResponse(responseText) {
      return (
        responseText === "I'm def closer to my goal" ||
        responseText === 'GOAL ACHIEVED' ||
        responseText === 'Mostly' ||
        responseText === 'A lot'
      )
    },
    isLowRatingQuestion(question) {
      return question.questionText.startsWith('Sorry to hear that')
    },
    isLowRatingResponse(responseText) {
      return (
        responseText === 'Not at all' || responseText === 'Sorta but not really'
      )
    },

    shouldStarShowSelected(question, response) {
      if (!this.userResponse[question.questionId]) {
        return false
      }
      const currentDisplayPriority = response.responseDisplayPriority

      const selectedResponseId =
        this.userResponse[question.questionId].responseId
      const responseForSelectedResponseId = question.responses.find(
        (r) => r.responseId === selectedResponseId
      )
      if (currentDisplayPriority && responseForSelectedResponseId) {
        return (
          responseForSelectedResponseId.responseDisplayPriority >=
          currentDisplayPriority
        )
      }
      return false
    },
    hasAnsweredAtLeastOneQuestion() {
      for (const questionInfo of this.filteredQuestions) {
        const question = questionInfo.question
        const response = this.userResponse[question.questionId]
        if (response.openResponse || response.responseId) {
          return true
        }
      }
      return false
    },
    getAnswerToQuestion(question) {
      const questionResponseId =
        this.userResponse[question.questionId].responseId
      if (!questionResponseId) {
        return null
      }
      const selectedResponse = question.responses.find(
        (r) => r.responseId === questionResponseId
      )
      return selectedResponse.responseText
    },
    isFavoritingCoach() {
      if (this.isStudent) {
        const coachFavoritingQuestion = this.filteredQuestions.find((q) =>
          this.isHighRatingQuestion(q.question)
        )
        if (!coachFavoritingQuestion) {
          return false
        }
        const coachFavoritingAnswer = this.getAnswerToQuestion(
          coachFavoritingQuestion.question
        )
        return coachFavoritingAnswer && coachFavoritingAnswer === 'Yes'
      }
      return false
    },
    async submitFeedback() {
      if (this.isSubmitting) return
      this.isSubmitting = true
      this.error = ''
      const submissions = []
      let hasGivenHighRating = false
      for (const questionInfo of this.filteredQuestions) {
        const question = questionInfo.question
        const response = this.userResponse[question.questionId]
        if (this.isHighRatingQuestion(question)) {
          hasGivenHighRating = true
          // the answer to the coach-favoriting question is not included in the feedback submission
          continue
        } else if (
          (this.isLowRatingQuestion(question) ||
            this.isGuidelineIssueListQuestion(question)) &&
          response.responseId
        ) {
          // the answers to the what-went-wrong questions are multiselect; convert to several single-response answers for saving
          response.responseId.forEach((resp) => {
            submissions.push({
              questionId: Number(question.questionId),
              responseChoiceId: resp,
              openResponse: response.openResponse,
            })
          })
        } else {
          if (response.responseId) {
            submissions.push({
              questionId: Number(question.questionId),
              responseChoiceId: response.responseId,
              openResponse: response.openResponse,
            })
          }
        }
      }
      const surveyResponse = {
        surveyId: this.surveyDefinition.surveyId,
        surveyTypeId: this.surveyDefinition.surveyTypeId,
        sessionId: this.session._id,
        submissions,
        volunteerFeedbackForStudent: this.hasVolunteerFeedbackForStudent
          ? this.volunteerFeedbackForStudent
          : null,
      }
      const requests = []
      requests.push(NetworkService.submitSurvey(surveyResponse))
      if (this.isFavoritingCoach()) {
        requests.push(
          NetworkService.updateFavoriteVolunteerStatus(
            this.session.volunteer._id,
            { isFavorite: true, sessionId: this.session._id }
          )
        )
      }

      if (this.hasVolunteerFeedbackForStudent)
        AnalyticsService.captureEvent(
          EVENTS.VOLUNTEER_SUBMITTED_STUDENT_FEEDBACK_QUESTION,
          {
            response: this.volunteerFeedbackForStudent,
            sessionId: this.session.id,
          }
        )

      const responses = await Promise.allSettled(requests)
      // if there is an error in saving, display it; don't block progression if the error is in favoriting
      const rejectedSave = responses
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason)
        .find((res) => res.url.endsWith('api/survey/save'))

      if (rejectedSave) {
        this.error = 'There was an error sending your feedback'
        if (rejectedSave.status === 422) {
          this.error = rejectedSave.body.statusText
        }
      } else {
        AnalyticsService.captureEvent(EVENTS.POST_SESSION_SURVEY_SUBMITTED, {
          sessionId: this.session.id,
          surveyNameVariant: this.getStudentPostSessionSurveyNameVariant,
        })
        localStorage.setItem('high-session-rating', hasGivenHighRating)
      }
      this.isSubmitting = false
      if (!this.isEligibleToNominateCoach) {
        this.$router.push('/dashboard')
      } else {
        this.surveySubmitted = true
      }

      this.scrollToTop()
    },
    // builds a default user response to be stored in state that maps a survey question ID to a response map
    buildUserResponse() {
      const userResponse = Object.assign({}, this.userResponse)
      for (const question of this.surveyDefinition.survey) {
        const questionResponse = {
          responseId: null,
          openResponse: '',
        }
        userResponse[question.questionId] = questionResponse
      }

      this.userResponse = userResponse
    },
    updateUserResponseMultiselect(questionId, responseId) {
      let currentSelected = this.userResponse[questionId].responseId
      if (!currentSelected) {
        // list is currently empty, create it
        currentSelected = [responseId]
      } else if (currentSelected.find((r) => r === responseId)) {
        // clicked item is already in list; deselect it
        remove(currentSelected, (r) => r === responseId)
      } else {
        // clicked item is not in list yet; select it
        currentSelected.push(responseId)
      }

      const responseAnswer = {
        [questionId]: Object.assign({}, this.userResponse[questionId], {
          responseId: currentSelected,
        }),
      }
      this.userResponse = Object.assign({}, this.userResponse, responseAnswer)
    },

    // if question changed is ratings question, show/hide conditional questions that depend on it
    ratingQuestionShowHide(questionId, responseId) {
      const ratingQuestion = find(this.questions, (q) =>
        this.isStarRankingQuestion(q)
      )
      if (ratingQuestion && questionId === ratingQuestion.questionId) {
        const ratingResponse = find(
          ratingQuestion.responses,
          (r) => r.responseId === responseId
        )
        const showHighRatingQuestion =
          this.isHighRatingResponse(ratingResponse.responseText) &&
          !this.isFavoriteCoachLimitReached
        const showLowRatingQuestion = this.isLowRatingResponse(
          ratingResponse.responseText
        )

        map(this.allQuestions, (q) => {
          if (this.isHighRatingQuestion(q.question)) {
            q.isVisible = showHighRatingQuestion
            return q
          } else if (this.isLowRatingQuestion(q.question)) {
            q.isVisible = showLowRatingQuestion
            return q
          }
        })
      }
    },
    // if question changed is student safety & guideline violation question, show/hide conditional question that depends on it
    guidelineQuestionShowHide(questionId, responseId) {
      const guidelineQuestion = find(this.questions, (q) =>
        q.questionText.startsWith('Were there any student safety')
      )
      if (guidelineQuestion && questionId === guidelineQuestion.questionId) {
        const guidelineResponse = find(
          guidelineQuestion.responses,
          (r) => r.responseId === responseId
        )
        this.allQuestions = map(this.allQuestions, (q) => {
          const shouldToggleQuestionVisibility =
            this.isGuidelineIssueListQuestion(q.question)
          q.isVisible = shouldToggleQuestionVisibility
            ? guidelineResponse.responseText === 'Yes'
            : q.isVisible
          return q
        })
      }
    },

    updateUserResponse(questionId, responseId, openResponseText = '') {
      this.ratingQuestionShowHide(questionId, responseId)
      this.guidelineQuestionShowHide(questionId, responseId)

      // clear out responses for all hidden questions so we don't save junk data (change to actually-selected answer will handle re-render)
      const questionIdsToClear = this.allQuestions
        .filter((item) => !item.isVisible)
        .map((item) => item.question.questionId)
      forEach(questionIdsToClear, (q) => {
        this.userResponse[q] = { responseId: null, openResponse: '' }
      })

      const responseAnswer = {
        [questionId]: Object.assign({}, this.userResponse[questionId], {
          responseId,
          openResponse: openResponseText,
        }),
      }
      this.userResponse = Object.assign({}, this.userResponse, responseAnswer)
    },
  },
}
</script>

<style lang="scss">
// @note: There are questions above that output html content
//        from a string using v-html.
//        Scoped styles will not apply to content inside v-html,
//        because that HTML is not processed by Vue’s template compiler.
//        All styles here are namespaced under "feedback" to avoid
//        collision/overrides with any global styling
.feedback {
  min-height: 100%;
  width: 100%;
  position: relative;
  vertical-align: middle;
  text-align: center;
  padding: 4em 0;
  background-color: $c-background-grey;

  &__container {
    width: 90%;
    margin: auto;
    background-color: white;
    padding: 2.8em;
    border-radius: 5px;
    text-align: left;

    @include breakpoint-above('medium') {
      max-width: 800px;
    }
  }

  &__header-container {
    margin-bottom: 3em;
  }

  &__header {
    @include font-category('display-small');
  }

  &__subheader {
    font-size: 22px;
    color: $c-secondary-grey;
    margin: 0;
    font-weight: 500;
  }

  &__questions-list {
    list-style-type: none;
    padding-inline-start: 0;
  }

  &__questions-item {
    margin-bottom: 3em;
  }

  &__question {
    text-align: left;
    @include font-category('heading');

    &-number {
      margin-right: 5px;
    }
  }
  &__subtext {
    text-align: left;
    @include font-category('helper-text');
    color: $c-secondary-grey;
  }

  &__submit-button {
    margin: 0 auto;
  }

  &__dashboard-button {
    margin: 1em 0;
  }

  &__session-goal {
    font-weight: 600;
    color: $c-success-green;
  }

  &__error {
    color: $c-error-red;
  }
}

.question {
  &__section-header {
    font-weight: 600;
    font-size: 22pt;
    margin-top: 30px;
    margin-bottom: 10px;
  }

  &__responses-postsession {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }

  &__responses-vertical {
    width: 100%;
  }

  &__responses-radio {
    padding: 20px;
  }

  &__response-radio {
    width: 45%;
  }

  &__response-boxed {
    border: solid 1px $c-border-grey;
    border-radius: 5px;
    margin: 15px;
    padding: 15px;
    display: flex;
  }

  &__response-boxed-selected {
    background-color: $selected-green;
    border-color: $c-accent;
  }

  &__subtext {
    font-weight: 400;
    font-size: 12px;
    color: $c-secondary-grey;
    margin-top: 10px;
    margin-bottom: 14px;
  }

  &__free-response {
    width: 100%;
  }
}

.response-answer-text {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  color: $c-secondary-grey;
}

.issue-reason-chip {
  margin-top: 1em;
  margin-right: 1em;
}

// remove below in student-reach-out feature flag cleanup
.italic {
  font-style: italic;
}

.primary-button {
  &:disabled {
    border: 1px solid $c-border-grey !important;
  }
}

.student-reach-out-container {
  background-color: $c-background-grey;
  border-radius: 5px;
  padding: 1em 0.5em;
}

.student-coach-message {
  margin: 1em 0;
}

.student-coach-message {
  width: 100%;
  height: 120px;
  border: 1px solid $c-border-grey;
  border-radius: 5px;
  padding: 1em;
  resize: none;
  &:focus {
    outline: none;
    border-color: $c-success-green;
  }
}

.nomination-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.nomination-subtext {
  color: $c-secondary-grey;
  padding-top: 48px;
}

.nomination-text {
  @include font-category('heading');
}

.nomination-coaching-skills-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coaching-skill {
  border: 1px solid $c-border-grey;
  border-radius: 4px;
  padding: 16px;

  &:hover {
    cursor: pointer;
    background-color: darken($c-background-grey, 5%);
  }
}

.coaching-skill-checked {
  background-color: $c-background-blue;

  &:hover {
    background-color: darken($c-background-blue, 5%);
  }
}

.nomination-buttons {
  display: flex;
  flex-direction: column;
  padding-top: 32px;
  gap: 16px;
  width: 50%;
  align-items: center;
}

.tertiary-button {
  text-decoration: underline;
  color: $c-secondary-grey;
}
</style>
