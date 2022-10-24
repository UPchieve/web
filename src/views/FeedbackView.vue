<template>
  <div class="feedback">
    <div class="feedback__container">
      <header class="feedback__header-container">
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

      <template v-if="completedFeedback">
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
              :key="questionInfo.question.id"
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
                          r => r === response.responseId
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
                          r => r === response.responseId
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
                  >
                    <div class="question__subtext">
                      We read every single comment, but if you need to connect
                      with UPchieve staff about a question or concern please
                      email us directly:
                      <a href="mailto:support@upchieve.org"
                        >support@upchieve.org</a
                      >
                    </div>
                    <feedback-textarea
                      :id="`${questionInfo.questionId}_${response.responseId}`"
                      @change="
                        responseText =>
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
        </ul>

        <p v-if="error" class="feedback__error">{{ error }}</p>

        <large-button
          class="feedback__submit-button"
          :disabled="!hasAnsweredAtLeastOneQuestion()"
          primary
          @click.native="submitFeedback"
        >
          Submit
        </large-button>
        <loader v-if="isSubmittingFeedback || isLoading" :overlay="true" />
      </template>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import NetworkService from '@/services/NetworkService'
import LargeButton from '@/components/LargeButton'
import { topics } from '@/utils/topics'
import moment from 'moment'
import FeedbackTextarea from '@/components/FeedbackTextarea'
import Loader from '@/components/Loader'
import SurveyRadio from '@/components/Surveys/SurveyRadio'
import SurveyImage from '@/components/Surveys/SurveyImage'
import SurveyRateNumber from '../components/Surveys/SurveyRateNumber'
import SurveyChipOption from '../components/Surveys/SurveyChipOption'
import SurveyCheckbox from '../components/Surveys/SurveyCheckbox'
import _ from 'lodash'

export default {
  name: 'FeedbackView',
  components: {
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
      isSubmittingFeedback: false,
      completedFeedback: false,
      isFavoriteCoach: false,
      isFavoriteCoachLimitReached: false,
      allQuestions: [],
      error: '',
      userResponse: {},
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    sessionPartnerFirstName() {
      return this.user.isVolunteer
        ? this.session.student.firstName
        : this.session.volunteer.firstName
    },
    sessionSubject() {
      const { type, subTopic } = this.session
      return topics[type].subtopics[subTopic].displayName
    },
    sessionTime() {
      return moment(this.session.createdAt)
        .local()
        .format('LT')
    },
    sessionDate() {
      return moment(this.session.createdAt)
        .local()
        .format('MMMM Do, YYYY')
    },
    userType() {
      return this.user.isVolunteer ? 'volunteer' : 'student'
    },
    questions() {
      return this.allQuestions.map(q => q.question)
    },
    filteredQuestions() {
      return this.allQuestions.filter(q => q.isVisible)
    },
  },
  async beforeMount() {
    this.$store.dispatch('app/sidebar/hide')
    this.$store.dispatch('app/header/show', {
      component: 'SessionHeader',
    })
    const sessionId = this.$route.params.sessionId
    const [
      feedbackResponse,
      sessionResponse,
      postsessionAlreadySavedResponse,
    ] = await Promise.all([
      NetworkService.getFeedback({
        sessionId,
        userType: this.userType,
      }),
      NetworkService.getSession(sessionId),
      NetworkService.getPostsessionSurveyResponse(sessionId, this.userType),
    ])

    const {
      body: { feedback },
    } = feedbackResponse
    const {
      body: { session },
    } = sessionResponse

    this.session = session
    const postsessionSurveyDefinitionResponse = await NetworkService.getPostsessionSurvey(
      this.session.subTopic,
      this.session.id,
      this.userType
    )
    this.surveyDefinition = postsessionSurveyDefinitionResponse.body.survey
    this.allQuestions = _.map(this.surveyDefinition.survey, q => {
      const isHiddenOnStart =
        this.isLowRatingQuestion(q) ||
        this.isHighRatingQuestion(q) ||
        this.isGuidelineIssueListQuestion(q)
      q.responses = _.orderBy(q.responses, r => r.displayPriority)
      return {
        questionId: q.questionId,
        question: q,
        isVisible: !isHiddenOnStart,
        questionType: this.getQuestionDisplayType(q),
        headerText: this.getQuestionSectionHeader(q),
      }
    })
    this.allQuestions = _.orderBy(
      this.allQuestions,
      q => q.question.displayPriority
    )
    this.buildUserResponse()

    if (feedback || postsessionAlreadySavedResponse.body.length > 0) {
      this.loading = false
      this.completedFeedback = true
      return
    }

    if (!this.user.isVolunteer) {
      const response = await NetworkService.checkIsFavoriteVolunteer(
        this.session.volunteer._id
      )
      this.isFavoriteCoach = response.body.isFavorite
      if (!this.isFavoriteCoach) {
        const response = await NetworkService.getRemainingFavoriteVolunteers()
        this.isFavoriteCoachLimitReached = response.body.remaining === 0
      }
    }
    this.isLoading = false
  },
  methods: {
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
          return this.user.isVolunteer ? "Student's Progress" : 'Your Goal'
        } else if (this.isIssuePresentQuestion(question)) {
          return 'Your Concerns'
        } else if (this.isHowSupportiveQuestion(question)) {
          return 'Your Coach'
        }
      } else if (question.questionType === 'free response') {
        return 'Your Thoughts'
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
    isNumericalRatingQuestion(question) {
      return (
        this.isHowSupportiveQuestion(question) ||
        question.questionText.startsWith('Overall, how much did your coach')
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

      const selectedResponseId = this.userResponse[question.questionId]
        .responseId
      const responseForSelectedResponseId = question.responses.find(
        r => r.responseId === selectedResponseId
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
      const questionResponseId = this.userResponse[question.questionId]
        .responseId
      const selectedResponse = question.responses.find(
        r => r.responseId === questionResponseId
      )
      return selectedResponse.responseText
    },
    isFavoritingCoach() {
      if (!this.user.isVolunteer) {
        const coachFavoritingQuestion = this.filteredQuestions.find(q =>
          this.isHighRatingQuestion(q)
        )
        const coachFavoritingAnswer = this.getAnswerToQuestion(
          coachFavoritingQuestion
        )
        return coachFavoritingAnswer && coachFavoritingAnswer === 'Yes'
      }
      return false
    },
    async submitFeedback() {
      if (this.isSubmittingFeedback) return
      this.isSubmittingFeedback = true
      this.error = ''
      const submissions = []
      for (const questionInfo of this.filteredQuestions) {
        const question = questionInfo.question
        const response = this.userResponse[question.questionId]
        if (this.isHighRatingQuestion(question)) {
          // the answer to the coach-favoriting question is not included in the feedback submission
          continue
        } else if (
          (this.isLowRatingQuestion(question) ||
            this.isGuidelineIssueListQuestion(question)) &&
          response.responseId
        ) {
          // the answers to the what-went-wrong questions are multiselect; convert to several single-response answers for saving
          response.responseId.forEach(resp => {
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
      }
      try {
        const requests = []
        requests.push(NetworkService.submitSurvey(surveyResponse))
        if (!this.user.isVolunteer && this.isFavoritingCoach) {
          requests.push(
            NetworkService.updateFavoriteVolunteerStatus(
              this.session.volunteer._id,
              { isFavorite: true, sessionId: this.session._id }
            )
          )
        }
        await Promise.all(requests)
        this.$router.push('/dashboard')
      } catch (error) {
        if (error.body.success === false) this.error = error.body.message
        else if (error.status === 422) this.error = error.body.err
        else this.error = 'There was an error sending your feedback'
      } finally {
        this.isSubmittingFeedback = false
      }
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
      } else if (currentSelected.find(r => r === responseId)) {
        // clicked item is already in list; deselect it
        _.remove(currentSelected, r => r === responseId)
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
      const ratingQuestion = _.find(this.questions, q =>
        this.isStarRankingQuestion(q)
      )
      if (ratingQuestion && questionId === ratingQuestion.questionId) {
        const ratingResponse = _.find(
          ratingQuestion.responses,
          r => r.responseId === responseId
        )
        const showHighRatingQuestion = this.isHighRatingResponse(
          ratingResponse.responseText
        ) && !this.isFavoriteCoachLimitReached
        const showLowRatingQuestion = this.isLowRatingResponse(
          ratingResponse.responseText
        )

        _.map(this.allQuestions, q => {
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
      const guidelineQuestion = _.find(this.questions, q =>
        q.questionText.startsWith('Were there any student safety')
      )
      if (guidelineQuestion && questionId === guidelineQuestion.questionId) {
        const guidelineResponse = _.find(
          guidelineQuestion.responses,
          r => r.responseId === responseId
        )
        this.allQuestions = _.map(this.allQuestions, q => {
          const shouldToggleQuestionVisibility = this.isGuidelineIssueListQuestion(
            q.question
          )
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
        .filter(item => !item.isVisible)
        .map(item => item.question.questionId)
      _.forEach(questionIdsToClear, q => {
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
</style>
