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
          <li
            v-for="(question, index) in filteredQuestions"
            :key="question.id"
            class="feedback__questions-item"
          >
            <h2
              class="feedback__question"
              v-html="
                question.question
                  ? question.question
                  : question.dynamicQuestion()
              "
            >
              {{ index + 1 }}.
              {{
                question.question
                  ? question.question
                  : question.dynamicQuestion()
              }}
            </h2>
            <p class="feedback__subtext">
              {{ question.subtext }}
            </p>
            <component
              :is="question.component"
              :id="question.id"
              :position="index"
              :options="question.options"
              :direction="question.direction"
              v-model="question.answer"
            />
          </li>
        </ul>

        <p v-if="error" class="feedback__error">{{ error }}</p>

        <large-button
          class="feedback__submit-button"
          primary
          @click.native="submitFeedback"
        >
          Submit
        </large-button>
        <loader v-if="isSubmittingFeedback" :overlay="true" />
      </template>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import NetworkService from '@/services/NetworkService'
import LargeButton from '@/components/LargeButton'
import { topics } from '@/utils/topics'
import moment from 'moment'
import { formatSurveyAnswers } from '@/utils/survey'
import FeedbackRadio from '@/components/FeedbackRadio'
import FeedbackTextarea from '@/components/FeedbackTextarea'
import FeedbackCheckbox from '@/components/FeedbackCheckbox'
import Loader from '@/components/Loader'

export default {
  name: 'FeedbackView',
  components: {
    LargeButton,
    Loader
  },
  data() {
    return {
      session: {},
      presessionSurvey: {},
      isSubmittingFeedback: false,
      completedFeedback: false,
      isFavoriteCoach: false,
      isFavoriteCoachLimitReached: false,
      studentQuestions: [
        {
          id: 'session-goal',
          /**
           *
           * @note: This dynamic question output html content. Scoped
           *        styles are not applied to content inside v-html,
           *        because that HTML is not processed by Vue’s template compiler
           **/
          dynamicQuestion: () =>
            `Your goal for this session was to <span class="feedback__session-goal">${this.sessionGoal}</span>. On a scale of 1 to 5, did UPchieve help you achieve your goal?`,
          options: ['Not at all', '', 'Kind of', '', 'Yes, completely!'],
          component: FeedbackRadio,
          direction: 'row',
          answer: null
        },
        {
          id: 'subject-understanding',
          question:
            'What is your level of understanding now that you’ve completed your session?',
          component: FeedbackRadio,
          options: [
            "I don't know how to do this at all.",
            'I think I know how to do it, but I need help.',
            "I can do this on my own, but I don't fully understand it.",
            'I am very comfortable with this topic.'
          ],
          answer: null
        },
        {
          id: 'coach-rating',
          question: 'Please rate the Academic Coach who helped you.',
          component: FeedbackRadio,
          options: ['Terrible', '', 'Decent', '', 'Amazing'],
          direction: 'row',
          answer: null
        },
        {
          id: 'coach-favoriting',
          dynamicQuestion: () =>
            `Would you like to favorite your Coach, ${this.sessionPartnerFirstName}?`,
          subtext:
            'Favoriting a coach will increase your chances of being paired with them in the future. You can also favorite or unfavorite coaches from the Session History page.',
          component: FeedbackRadio,
          options: [
            'Yes, I’d love to work with them again!',
            'No thanks, not right now.',
          ],
          direction: 'column',
          answer: null,
          show: () => {
            if (
              this.isFavoriteCoach ||
              this.isFavoriteCoachLimitReached ||
              !this.isCoachFavoritingActive
            )
              return false

            const question = this.questions.find((q) => q.id === 'coach-rating')
            return question.answer && question.answer >= 4
          },
        },
        {
          id: 'coach-feedback',
          question: 'What could your coach have done better?',
          subtext: 'This feedback will be anonymous! You can be honest. :)',
          component: FeedbackTextarea,
          answer: null,
          show: () => {
            const question = this.questions.find(q => q.id === 'coach-rating')
            return question.answer && question.answer <= 3
          }
        },
        {
          id: 'other-feedback',
          question:
            '(Optional) Do you have any other feedback you’d like to share with UPchieve?',
          subtext:
            'This can be about the website, about your coach, about the services/features UPchieve provides, about any technical issues you encountered, etc. We read every single comment, every day!',
          component: FeedbackTextarea,
          answer: null
        }
      ],
      volunteerQuestions: [
        {
          id: 'session-enjoyable',
          question: 'Was this session enjoyable and/or rewarding?',
          component: FeedbackRadio,
          direction: 'row',
          options: ['Not at all', '', 'Somewhat', '', 'Yes, absolutely!'],
          answer: ''
        },
        {
          id: 'session-improvements',
          question:
            "We're sorry to hear that! What could have made this session more enjoyable and/or rewarding?",
          component: FeedbackTextarea,
          answer: null,
          show: () => {
            const question = this.volunteerQuestions.find(
              q => q.id === 'session-enjoyable'
            )
            return question.answer && question.answer <= 3
          }
        },
        {
          id: 'student-understanding',
          question:
            "How would you rate the student's understanding of the topic they asked help with by the end of the session?",
          component: FeedbackRadio,
          options: [
            "They don't know how to do this at all",
            'They have a sense of how to do it, but they still need some help.',
            'They can do this on their own, but they don’t fully understand it.',
            'They are very comfortable with the topic.',
            'N/A - I couldn’t tell.'
          ],
          answer: null
        },
        {
          id: 'session-obstacles',
          question:
            'Did any of the following get in the way of your ability to help the student? Please select all that apply!',
          component: FeedbackCheckbox,
          options: [
            'Website/app didn’t fully work',
            'We ran out of time',
            'The student was too far behind',
            'The student didn’t want to participate',
            'The student requested the wrong subject',
            'There was a gap in my own knowledge',
            'The student was rude or inappropriate',
            'The student was only looking for answers'
          ],
          answer: []
        },
        {
          id: 'other-feedback',
          question:
            '(Optional) Do you have any other feedback you’d like to share with UPchieve?',
          subtext:
            'This can be about the website, about your coach, about the services/features UPchieve provides, about any technical issues you encountered, etc. We read every single comment, but if you need to connect with UPchieve staff about a question or concern please email us directly.',
          component: FeedbackTextarea,
          answer: null
        }
      ],
      error: ''
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      isCoachFavoritingActive: 'featureFlags/isCoachFavoritingActive',
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
    sessionGoal() {
      if (this.presessionSurvey && this.presessionSurvey.createdAt) {
        if (
          this.presessionSurvey.responseData['primary-goal'].answer === 'other'
        ) {
          if (this.presessionSurvey.responseData['primary-goal'].other)
            return this.presessionSurvey.responseData[
              'primary-goal'
            ].other.toLowerCase()
          else return 'get help'
        }
        return formatSurveyAnswers(
          this.presessionSurvey.responseData['primary-goal'].answer
        ).toLowerCase()
      }

      return 'get help'
    },
    userType() {
      return this.user.isVolunteer ? 'volunteer' : 'student'
    },
    questions() {
      return this.user.isVolunteer
        ? this.volunteerQuestions
        : this.studentQuestions
    },
    filteredQuestions() {
      return this.questions.filter(item => !item.show || item.show())
    },
    isFavoritingCoach() {
      if (!this.isVolunteer) {
        const coachFavoritingQuestion = this.filteredQuestions.find(
          (q) => q.id === 'coach-favoriting'
        )
        // `1` is the first answer option when asking the student if they would like
        // to favorite the coach. That means the student wants to favorite them
        return coachFavoritingQuestion && coachFavoritingQuestion.answer === 1
      }
      return false
    }
  },
  async beforeMount() {
    this.$store.dispatch('app/sidebar/hide')
    this.$store.dispatch('app/header/show', {
      component: 'SessionHeader'
    })
    const sessionId = this.$route.params.sessionId
    const [
      feedbackResponse,
      sessionResponse,
      presessionResponse
    ] = await Promise.all([
      NetworkService.getFeedback({
        sessionId,
        userType: this.userType
      }),
      NetworkService.getSession(sessionId),
      NetworkService.getPresessionSurvey(sessionId)
    ])

    const {
      body: { feedback }
    } = feedbackResponse
    const {
      body: { session }
    } = sessionResponse
    const {
      body: { survey }
    } = presessionResponse

    this.session = session
    this.presessionSurvey = survey
    if (feedback) {
      this.completedFeedback = true
      return
    }

    if (!this.user.isVolunteer && this.isCoachFavoritingActive) {
      const response = await NetworkService.checkIsFavoriteVolunteer(
        this.session.volunteer._id
      )
      this.isFavoriteCoach = response.body.isFavorite

      if (!this.isFavoriteCoach) {
        const response =
          await NetworkService.getRemainingFavoriteVolunteers()
        this.isFavoriteCoachLimitReached = response.body.remaining === 0
      }
    }
  },
  methods: {
    async submitFeedback() {
      if (this.isSubmittingFeedback) return
      this.isSubmittingFeedback = true
      this.error = ''
      const data = {
        sessionId: this.session._id,
        topic: this.session.type,
        subTopic: this.session.subTopic,
        userType: this.userType,
        studentId: this.session.student._id,
        volunteerId: this.session.volunteer._id
      }

      const feedbackPath = this.user.isVolunteer
        ? 'volunteerFeedback'
        : 'studentTutoringFeedback'
      data[feedbackPath] = {}

      for (const option of this.filteredQuestions) {
        const { id, answer } = option
        // the answer to the coach-favoriting question is not included in the feedback submission
        if (id === 'coach-favoriting') continue

        if (answer && !Array.isArray(answer)) data[feedbackPath][id] = answer
        // sort answers with multiple selections
        if (answer && Array.isArray(answer) && answer.length > 0)
          data[feedbackPath][id] = answer.sort((a, b) => a - b)
      }

      try {
        const requests = []
        requests.push(NetworkService.feedback(this, data))
        if (
          !this.isVolunteer &&
          this.isFavoritingCoach &&
          this.isCoachFavoritingActive
        )
          requests.push(
            NetworkService.updateFavoriteVolunteerStatus(
              this.session.volunteer._id,
              { isFavorite: true, sessionId: this.session._id }
            )
          )
        await Promise.all(requests)
        this.$router.push('/')
      } catch (error) {
        if (error.body.success === false) this.error = error.body.message
        else if (error.status === 422) this.error = error.body.err
        else this.error = 'There was an error sending your feedback'
      } finally {
        this.isSubmittingFeedback = false
      }
    },
  }
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
</style>
