<template>
  <div class="progress-survey">
    <div class="progress-survey__container">
      <h1 class="progress-survey__rating-header">Rate your analysis</h1>
      <information-icon
        class="progress-survey__information-icon"
        @mouseover="showMoreInfo = true"
        @mouseleave="showMoreInfo = false"
        @click="showMoreInfo = true"
      />
      <div v-if="showMoreInfo" class="progress-survey__information-text">
        This helps UPbot improve future reviews. If you think your review was
        not accurate or helpful, make sure you leave feedback telling us what we
        can do to improve your experience.
      </div>
    </div>

    <!-- First question -->
    <div class="progress-survey__responses-images">
      <template v-for="response in ratingQuestion?.question.responses">
        <img
          v-if="ratingQuestion.questionType === 'rating' && response.disabled"
          :key="`${response.responseId}-image`"
          :src="response.responseDisplayImage"
          class="progress-survey__responses-image--selected"
          :alt="
            previousSurveyResponse.response === 'Like' ? 'Liked' : 'Disliked'
          "
        />
        <survey-image
          v-else-if="
            ratingQuestion.questionType === 'rating' && !response.disabled
          "
          class="progress-survey__responses-image"
          :key="`${response.responseId}-image`"
          :src="response.responseDisplayImage"
          :questionId="ratingQuestion.questionId"
          :responseId="response.responseId"
          :isSelected="
            userResponse[ratingQuestion.questionId].responseId ===
            response.responseId
          "
          @survey-image-click="updateUserResponse"
        />
      </template>
    </div>

    <modal :backText="''" v-if="showModal">
      <div v-if="step === 1" class="progress-survey__modal">
        <cross-icon class="cross-icon" @click="handleCloseModal" />

        <!-- Second question -->
        <h2 class="progress-survey__chips-header">What was the problem?</h2>
        <div class="progress-survey__chips">
          <survey-chip-option
            v-for="response in whatProblemsQuestion?.question.responses"
            :key="`${response.responseId}-chip`"
            :label="response.responseText"
            :questionId="whatProblemsQuestion.questionId"
            :responseId="response.responseId"
            :isSelected="
              userResponse[whatProblemsQuestion.questionId].responseId &&
              !!userResponse[whatProblemsQuestion.questionId].responseId.find(
                (r) => r === response.responseId
              )
            "
            @chip-click="updateUserResponseMultiselect"
            class="progress-survey__chips-chip"
          />
        </div>

        <!-- Third question -->
        <p class="progress-survey__improve-header">
          {{ tellUsMoreTextQuestion.question.questionText }}
        </p>
        <div
          v-for="response in tellUsMoreTextQuestion?.question.responses"
          :key="`${response.responseId}-free-response`"
        >
          <feedback-textarea
            :id="`${tellUsMoreTextQuestion.questionId}_${response.responseId}`"
            @input="
              (responseText) =>
                updateUserResponse(
                  tellUsMoreTextQuestion.questionId,
                  response.responseId,
                  responseText
                )
            "
          >
          </feedback-textarea>
        </div>
        <footer>
          <large-button
            class="progress-survey__button--center progress-survey__button--submit"
            :disabled="!hasAnsweredAtLeastOneQuestion() ? true : null"
            primary
            :showArrow="false"
            @click="submitFeedback"
          >
            Submit
          </large-button>
        </footer>
        <p v-if="error" class="progress-survey__error">{{ error }}</p>
      </div>
      <div
        v-else-if="step === 2"
        class="progress-survey__modal progress-survey__modal--center"
      >
        <updog-hooray class="updog" />
        <p class="progress-survey__thanks-header">
          Thank you for your feedback!
        </p>

        <footer>
          <large-button
            @click="handleCloseModal"
            class="progress-survey__button--center"
            >Close</large-button
          >
        </footer>
      </div>
    </modal>

    <loader v-if="isSubmittingFeedback || isLoading" :overlay="true" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import FeedbackTextarea from '@/components/FeedbackTextarea.vue'
import Loader from '@/components/Loader.vue'
import SurveyImage from '@/components/Surveys/SurveyImage.vue'
import SurveyChipOption from '../components/Surveys/SurveyChipOption.vue'
import { map, remove, orderBy, find, forEach } from 'lodash-es'
import Modal from '@/components/Modal.vue'
import CrossIcon from '@/assets/cross.svg'
import InformationIcon from '@/assets/information-question-icon.svg'
import UpdogHooray from '@/assets/updog-hooray.svg'
import { EVENTS } from '@/consts'

export default {
  name: 'ProgressReportSurvey',
  components: {
    LargeButton,
    Loader,
    SurveyImage,
    SurveyChipOption,
    FeedbackTextarea,
    Modal,
    CrossIcon,
    InformationIcon,
    UpdogHooray,
  },
  props: {
    progressReportId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isLoading: true,
      isSubmittingFeedback: false,
      allQuestions: [],
      error: '',
      userResponse: {},
      previousSurveyResponse: {},
      showModal: false,
      step: 1,
      showMoreInfo: false,
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    questions() {
      return this.allQuestions.map((q) => q.question)
    },
    filteredQuestions() {
      return this.allQuestions.filter((q) => q.isVisible)
    },
    getSelectedRatingImageUrl() {
      if (this.previousSurveyResponse.response === 'Like')
        return 'https://cdn.upchieve.org/site-images/thumbs-up-selected.svg'
      return 'https://cdn.upchieve.org/site-images/thumbs-down-selected.svg'
    },
    ratingQuestion() {
      return this.filteredQuestions[0]
    },
    whatProblemsQuestion() {
      return this.filteredQuestions[1]
    },
    tellUsMoreTextQuestion() {
      return this.filteredQuestions[2]
    },
  },
  async beforeMount() {
    this.generateSurvey()
  },

  methods: {
    getQuestionDisplayType(question) {
      if (question.questionType === 'multiple choice') {
        if (this.isRatingReviewQuestion(question)) {
          return 'rating'
        } else if (this.isWhatProblemsQuestion(question)) {
          return 'chip'
        }
      }
      return question.questionType
    },
    isRatingReviewQuestion(question) {
      return question.questionText.startsWith('Rate your')
    },
    isWhatProblemsQuestion(question) {
      return question.questionText.startsWith('What was the problem')
    },
    isTellUsMoreQuestion(question) {
      return question.questionText.startsWith('Tell us more about the issue')
    },
    isLowRatingResponse(responseText) {
      return responseText === 'Dislike'
    },
    hasAnsweredAtLeastOneQuestion() {
      return (
        this.userResponse[this.whatProblemsQuestion.questionId]?.responseId
          ?.length ||
        this.userResponse[this.tellUsMoreTextQuestion.questionId]?.openResponse
      )
    },
    async submitFeedback() {
      if (this.isSubmittingFeedback) return
      this.isSubmittingFeedback = true
      this.error = ''
      const submissions = []

      for (const questionInfo of this.filteredQuestions) {
        const question = questionInfo.question
        const response = this.userResponse[question.questionId]
        if (this.isWhatProblemsQuestion(question) && response.responseId) {
          // the answers to what was the problem are multiselect; convert to several single-response answers for saving
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

      try {
        const surveyResponse = {
          surveyId: this.surveyDefinition.surveyId,
          surveyTypeId: this.surveyDefinition.surveyTypeId,
          progressReportId: this.progressReportId,
          submissions,
        }
        await NetworkService.submitSurvey(surveyResponse)
        if (this.showModal && this.step === 1) this.step = 2
        this.generateSurvey()
        AnalyticsService.captureEvent(EVENTS.PROGRESS_REPORT_SURVEY_SUBMITTED)
      } catch (error) {
        this.error = 'There was an error sending your feedback'
        if (error.status === 422) {
          this.error = error.body.statusText
        }
      }

      this.isSubmittingFeedback = false
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
    processShouldShowLowRatingQuestions(questionId, responseId) {
      const ratingQuestion = find(this.questions, (q) =>
        this.isRatingReviewQuestion(q)
      )
      if (ratingQuestion && questionId === ratingQuestion.questionId) {
        const ratingResponse = find(
          ratingQuestion.responses,
          (r) => r.responseId === responseId
        )

        const showLowRatingQuestion = this.isLowRatingResponse(
          ratingResponse.responseText
        )
        map(this.allQuestions, (q) => {
          if (this.isWhatProblemsQuestion(q.question)) {
            q.isVisible = showLowRatingQuestion
            return q
          }
          if (this.isTellUsMoreQuestion(q.question)) {
            q.isVisible = showLowRatingQuestion
            return q
          }
        })
      }
    },

    async updateUserResponse(questionId, responseId, openResponseText = '') {
      this.processShouldShowLowRatingQuestions(questionId, responseId)

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

      for (const questionInfo of this.filteredQuestions) {
        const question = questionInfo.question
        if (this.isRatingReviewQuestion(question)) {
          const response = question.responses.find(
            (response) => response.responseId === responseId
          )
          if (!response) return

          if (response.responseText === 'Like') await this.submitFeedback()
          else if (response.responseText === 'Dislike')
            this.showModal = !this.showModal
        }
      }
    },
    async generateSurvey() {
      const replied = await NetworkService.getProgressReportSurveyResponses(
        this.progressReportId
      )
      this.previousSurveyResponse = replied.data.survey.find(
        (survey) => survey.response === 'Like' || survey.response === 'Dislike'
      )

      const response = await NetworkService.getProgressReportSurvey(
        this.user.id
      )
      this.survey = response.data.survey.survey

      this.surveyDefinition = response.data.survey
      this.allQuestions = map(this.surveyDefinition.survey, (q) => {
        const isHiddenOnStart =
          this.isWhatProblemsQuestion(q) || this.isTellUsMoreQuestion(q)

        if (
          this.isRatingReviewQuestion(q) &&
          this.previousSurveyResponse &&
          this.previousSurveyResponse.response
        ) {
          q.responses = q.responses.map((response) => {
            if (response.responseText === this.previousSurveyResponse.response)
              return {
                ...response,
                responseDisplayImage: this.getSelectedRatingImageUrl,
                disabled: true,
              }
            else return response
          })
        }

        q.responses = orderBy(q.responses, (r) => r.displayPriority)

        return {
          questionId: q.questionId,
          question: q,
          isVisible: !isHiddenOnStart,
          questionType: this.getQuestionDisplayType(q),
        }
      })
      this.allQuestions = orderBy(
        this.allQuestions,
        (q) => q.question.displayPriority
      )
      this.buildUserResponse()
      this.isLoading = false
    },
    handleCloseModal() {
      // Reset responses when closed
      this.buildUserResponse()
      this.showModal = false
      this.step = 1
    },
  },
}
</script>

<style lang="scss">
.progress-survey__responses-image {
  & img {
    margin: 0 !important;
    height: 50px !important;
    width: 50px !important;
  }
}
</style>

<style lang="scss" scoped>
.progress-survey {
  &__container {
    @include flex-container(row, initial, center);
    position: relative;
  }

  &__information-icon {
    margin-left: 0.4em;
    height: 20px;
    width: 20px;

    &:hover {
      cursor: pointer;
    }
  }

  &__information-text {
    position: absolute;
    background-color: $upchieve-white;
    padding: 1.6em;
    width: 260px;
    z-index: 10;
    border-radius: 18px;
    font-size: 14px;
    left: 0px;
    top: -200px;
    border: 1px solid $c-border-grey;

    @include breakpoint-above('small') {
      width: 300px;
      right: -20px;
      top: -140px;
    }

    @include breakpoint-above('small') {
      width: 400px;
    }

    &-bold {
      font-weight: 600;
    }
  }

  &__rating-header {
    font-size: 14px;
    margin-bottom: 0;
  }

  &__responses-images {
    margin-top: 0.4em;
    @include flex-container(row, flex-start, center);

    @include breakpoint-above('huge') {
      @include flex-container(row, center, center);
    }
  }

  &__responses-image--selected {
    height: 50px;
    width: 50px;
  }

  &__chips {
    &-header {
      font-size: 18px;
      font-weight: 600;
      text-align: left;
    }

    @include flex-container(row, initial, center);
    flex-wrap: wrap;

    &-chip {
      margin-top: 1em;
      margin-right: 1em;
    }
  }

  &__improve-header {
    text-align: left;
    margin-top: 1.4em;
    margin-bottom: 0;
  }

  &__button {
    &--center {
      margin: 1em auto;
    }

    &--submit {
      width: 60%;
      background-color: $c-information-blue;
      &:hover {
        background: darken($c-information-blue, 5%);

        &:disabled {
          background: $c-background-grey;
        }
      }
    }
  }

  &__modal {
    @include flex-container(column);
    &--center {
      @include flex-container(column, center, center);
    }
  }

  &__thanks-header {
    font-weight: 500;
  }

  &__error {
    color: $c-error-red;
  }
}

.updog {
  width: 160px;
  height: 160px;
}

.cross-icon {
  width: 18px;
  margin-right: 1em;
  margin-left: auto;

  &:hover {
    cursor: pointer;
  }

  @include breakpoint-above('medium') {
    margin-bottom: initial;
    margin-right: initial;
    margin-left: auto;
  }
}
</style>
