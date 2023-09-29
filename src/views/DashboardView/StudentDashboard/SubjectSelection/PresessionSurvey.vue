<template>
  <div class="survey-container">
    <cross-icon @click="cancel()" class="cross-icon" />
    <div class="presession-survey">
      <template>
        <div class="presession-survey__title">Tell us about your request</div>
        <div class="presession-survey__subtitle">
          This will give your coach the info they need to help you.
        </div>
        <stepper
          :totalSteps="survey.length"
          :currentStep="currentStep"
          class="stepper"
        />
        <div v-if="survey.length">
          <div class="question__title">
            {{ currentQuestion.questionText }}
          </div>
          <div
            class="question__responses"
            :class="{
              'question__responses-images': isRowOfImages,
            }"
          >
            <template v-for="response in currentQuestion.responses">
              <survey-image
                v-if="isRowOfImages"
                class="question__response question__response-image"
                :key="`${response.responseId}-image`"
                :src="response.responseDisplayImage"
                :label="response.responseText"
                :questionId="currentQuestion.questionId"
                :responseId="response.responseId"
                :isSelected="
                  userResponse[currentQuestion.questionId].responseId ===
                    response.responseId
                "
                @survey-image-click="updateUserResponse"
              />

              <survey-radio
                v-else-if="
                  currentQuestion.questionType === questionTypes.multipleChoice
                "
                class="question__response"
                :key="`${response.responseId}-radio`"
                :id="`${currentQuestion.questionId}_${response.responseId}`"
                :radioValue="response.responseId"
                :name="currentQuestion.questionId"
                :checked="
                  userResponse[currentQuestion.questionId].responseId ===
                    response.responseId
                "
                :questionId="currentQuestion.questionId"
                :responseId="response.responseId"
                :label="response.responseText"
                :isOpenResponseDisabled="
                  userResponse[currentQuestion.questionId].responseId !==
                    response.responseId
                "
                :openResponseValue="
                  userResponse[currentQuestion.questionId].openResponse
                "
                @survey-radio-input="updateUserResponse"
              />
            </template>
          </div>
        </div>

        <div v-if="!mobileMode" class="presession-survey__separator" />
        <div class="presession-survey__buttons">
          <large-button @click.native="prevStep" v-if="currentStep > 1"
            >Back</large-button
          >

          <large-button
            primary
            @click.native="nextStep"
            v-if="currentStep !== survey.length"
            :disabled="isNextButtonDisabled"
            >Next</large-button
          >

          <large-button
            primary
            v-if="currentStep === survey.length"
            @click.native="submitSurvey"
            :disabled="!isSurveyComplete"
            >Start a chat</large-button
          >
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import Stepper from '@/components/Stepper.vue'
import NetworkService from '@/services/NetworkService'
import CrossIcon from '@/assets/cross.svg'
import { QUESTION_TYPES } from '@/consts'
import SurveyRadio from '@/components/Surveys/SurveyRadio.vue'
import SurveyImage from '@/components/Surveys/SurveyImage.vue'

export default {
  components: {
    LargeButton,
    Stepper,
    CrossIcon,
    SurveyRadio,
    SurveyImage,
  },

  props: {
    subject: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      currentStep: 1,
      userResponse: {},
      survey: [],
      surveyId: null,
      surveyTypeId: null,
    }
  },

  async mounted() {
    const response = await NetworkService.getPresessionSurvey(this.subject)
    this.survey = response.data.survey
    this.surveyId = response.data.surveyId
    this.surveyTypeId = response.data.surveyTypeId
    this.buildUserResponse()
    /**
     *
     *
     * The Presession survey component is rendered within the SubjectSelectionModal,
     * which is uses the ModalTemplate. Since the ModalTemplate has styles that are
     * not desired for this design, and to avoid a refactor of multiple components,
     * we are overriding styles of the ModalTemplate within this component and only
     * for the lifecycle of this component.
     *
     *
     */
    this.overrideModalTemplateStyles()
  },

  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    isSurveyComplete() {
      for (const question of this.survey) {
        const questionId = question.questionId
        const userResponse = this.userResponse[questionId]
        if (!userResponse.responseId) return false

        // check if a response that should have an open response was entered
        const response = question.responses.find(
          response => response.responseText === 'Other'
        )
        if (
          response &&
          response.responseId === userResponse.responseId &&
          !userResponse.openResponse
        )
          return false
      }
      return true
    },
    currentQuestion() {
      // In order to access the 0-based array of `this.survey` we must take one from the currentStep
      return this.survey[this.currentStep - 1]
    },
    // checks if the current question has a row of responses that require to show a display image
    isRowOfImages() {
      return this.currentQuestion.responses.every(a => a.responseDisplayImage)
    },
    questionTypes() {
      return QUESTION_TYPES
    },
    isNextButtonDisabled() {
      return (
        this.currentQuestion &&
        this.userResponse[this.currentQuestion.questionId] &&
        !this.userResponse[this.currentQuestion.questionId].responseId
      )
    },
  },

  methods: {
    submitSurvey() {
      let surveyResponses = this.responses

      if (!this.isSurveyComplete) return

      const submissions = []
      for (const question of this.survey) {
        const questionId = question.questionId
        const response = this.userResponse[questionId]
        submissions.push({
          questionId: Number(questionId),
          responseChoiceId: response.responseId,
          openResponse: response.openResponse,
        })
      }

      surveyResponses = {
        surveyId: this.surveyId,
        surveyTypeId: this.surveyTypeId,
        submissions,
      }
      this.$store.dispatch('user/updatePresessionSurvey', surveyResponses)
      this.$emit('survey-completed')
    },
    cancel() {
      this.$store.dispatch('app/modal/hide')
    },
    nextStep() {
      this.currentStep++
    },
    prevStep() {
      this.currentStep--
    },
    // builds a default user response to be stored in state that maps a survey question ID to a response map
    buildUserResponse() {
      const userResponse = Object.assign({}, this.userResponse)

      for (const question of this.survey) {
        const questionResponse = {
          responseId: null,
          openResponse: '',
        }
        userResponse[question.questionId] = questionResponse
      }

      this.userResponse = userResponse
    },
    updateUserResponse(questionId, responseId, openResponseText = '') {
      // Vue cannot detect property addition or deletion on objects. A new object
      // must be created for Vue to recognize changes on said object
      const responseAnswer = {
        [questionId]: Object.assign({}, this.userResponse[questionId], {
          responseId,
          openResponse: openResponseText,
        }),
      }
      this.userResponse = Object.assign({}, this.userResponse, responseAnswer)
    },
    overrideModalTemplateStyles() {
      const formElem = document.querySelector('.ModalTemplate-form')
      if (!this.mobileMode) {
        formElem.style.overflow = 'initial'
        formElem.style.borderRadius = '22px'
      }
      formElem.style.padding = 'initial'

      const selectionModal = document.querySelector('.SubjectSelectionModal')
      selectionModal.style.minHeight = 'initial'

      const modalTemplateSeparator = document.querySelector(
        '.ModalTemplate-seperator'
      )
      modalTemplateSeparator.style.display = 'none'

      const modalTemplateButtons = document.querySelector(
        '.ModalTemplate-buttons'
      )
      modalTemplateButtons.style.display = 'none'

      const modalTemplatePaddingElem = document.querySelector(
        '.ModalTemplate-form--bottom-padding'
      )
      modalTemplatePaddingElem.style.paddingTop = 'initial'
    },
  },
}
</script>

<style lang="scss" scoped>
.survey-container {
  @include flex-container(column);
}

.presession-survey {
  width: 100%;
  padding: 1em;
  display: flex;
  flex-direction: column;
  text-align: left;

  @include breakpoint-above('medium') {
    padding: 0 4em;
  }

  &__title {
    font-weight: 500;
    @include font-category('display-small');
    margin: 0.5em 0;
    color: $c-soft-black;
  }

  &__subtitle {
    @include font-category('helper-text');
  }

  &__separator {
    border: 1px solid $c-border-grey;
    width: 100%;
    height: 1px;
  }

  &__buttons {
    width: 100%;
    @include flex-container(row, flex-end, center);
    margin: 1.5em 0;

    button {
      margin-right: 1em;

      &:last-child {
        margin-right: initial;
      }
    }
  }
}

.question {
  &__title {
    margin-bottom: 5px;
    text-align: left;
    font-weight: 500;
    color: $c-soft-black;
    @include font-category('heading');
  }

  &__responses {
    text-align: left;
    margin: 1.5em 0;

    &-images {
      @include flex-container(row, center);
      flex-wrap: wrap;
      margin-top: 2em;
    }
  }

  &__response {
    margin: 0.75em 0;

    &-image {
      flex-basis: 30%;

      @include breakpoint-above('medium') {
        flex-basis: 20%;
      }
    }
  }
}

.stepper {
  width: 200px;
  margin: 1em 0 1.5em 0;
}

.cross-icon {
  cursor: pointer;
  align-self: flex-end;
  fill: $icon-grey;
  width: 15px;
  height: 15px;
  margin: 1.5em;
}
</style>
