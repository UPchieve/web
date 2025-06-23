<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import useVuelidate from '@vuelidate/core'
import SurveyQuestion from '@/components/Surveys/SurveyQuestion.vue'
import Loader from '@/components/Loader.vue'
import { useSurvey } from '@/composables/useSurvey'
import LargeButton from '@/components/LargeButton.vue'
import { useRoute } from 'vue-router'
import UpdogOpenArms from '@/assets/updog-open-arms.svg'
import UpdogStarIcon from '@/assets/updog-star.svg'
import type { SURVEY_TYPES } from '@/services/SurveyService'

const route = useRoute()
const surveyType = route.params.surveyType as SURVEY_TYPES
const surveyId = route.params.surveyId
  ? Number(route.params.surveyId)
  : undefined
const {
  survey,
  userResponses,
  isSurveyComplete,
  initializeSurvey,
  handleSurveySubmit,
  updateUserResponse,
  updateUserResponseMultiselect,
  isImpactStudySurvey,
  impactStudySurveyRewardAmount,
} = useSurvey({
  surveyType,
  surveyId,
})
const v$ = useVuelidate()

const error = ref('')
const onMountError = ref('')
const isLoading = ref(false)
const loadingMessage = ref('')
const isSurveySuccessfullySubmitted = ref(false)

const isSurveyCompleteAndValid = computed(() => {
  return isSurveyComplete.value && !v$.value.$invalid
})

async function handleSurveySubmission() {
  error.value = ''
  if (!isSurveyCompleteAndValid.value || isLoading.value) return

  isLoading.value = true
  loadingMessage.value = 'Saving your submission...'

  try {
    await handleSurveySubmit()
    isSurveySuccessfullySubmitted.value = true
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

onBeforeMount(async () => {
  try {
    isLoading.value = true
    await initializeSurvey()
  } catch (err) {
    onMountError.value = (err as Error).message
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="survey">
    <loader
      v-if="isLoading"
      :message="loadingMessage"
      class="survey__loader"
      :overlay="true"
    />

    <section
      class="survey__submitted"
      v-else-if="isSurveySuccessfullySubmitted"
    >
      <updog-star-icon class="updog--small" />

      <div
        class="survey__submitted"
        v-if="isImpactStudySurvey && impactStudySurveyRewardAmount"
      >
        <h2>You have earned ${{ impactStudySurveyRewardAmount }}</h2>
        <div class="impact-study-modal__separator" />

        <large-button
          variant="primary"
          class="survey__button"
          routeTo="/rewards"
        >
          See my rewards
        </large-button>
      </div>
      <div class="survey__submitted" v-else>
        <h2>Thanks for your submission!</h2>
        <div class="impact-study-modal__separator" />

        <large-button
          variant="primary"
          class="survey__button"
          routeTo="/dashboard"
        >
          Dashboard
        </large-button>
      </div>
    </section>

    <section v-else-if="survey?.length" class="survey-questions">
      <header v-if="isImpactStudySurvey" class="survey__header">
        <div class="survey__title">UPchieve Impact Survey</div>
        <p>
          Thank you for participating in our 5 minute survey!
          {{
            impactStudySurveyRewardAmount
              ? `We'll thank you for your time with a digital Amazon gift
          card for $${impactStudySurveyRewardAmount} sent to your email.`
              : ''
          }}
        </p>
        <p>
          Your answers help us share anonymous insights with our funders so we
          can keep UPchieve 100% free for students. We'll never share your name
          with your answers.
        </p>
        <p>
          For each question below, please put "N/A" if you didn't take the
          course or don't want to share the requested info.
        </p>

        <div class="survey__separator" />
      </header>

      <survey-question
        v-for="currentQuestion of survey"
        :key="currentQuestion.questionId"
        :question="currentQuestion"
        :userResponse="userResponses[currentQuestion?.questionId]"
        :updateUserResponse="updateUserResponse"
        :updateUserResponseMultiselect="updateUserResponseMultiselect"
      />
      <div class="survey__buttons">
        <large-button
          primary
          @click="handleSurveySubmission"
          :disabled="!isSurveyCompleteAndValid ? true : null"
          class="survey__button--submit"
        >
          Submit
        </large-button>
      </div>

      <p v-if="error" class="error">
        {{ error || 'We were unable to submit your survey. Please try again.' }}
      </p>
    </section>

    <section class="survey__no-results" v-else>
      <updog-open-arms class="updog" />
      <p>
        Seems like there are no surveys to load at the moment. Please try again
        later!
      </p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.survey {
  width: 90%;
  margin: 2em auto;
  background-color: white;
  padding: 2.8em;
  border-radius: 5px;
  text-align: left;

  @include breakpoint-above('medium') {
    max-width: 800px;
  }

  &__header {
    margin-bottom: 2em;
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
    margin-top: 1em;
  }

  &__buttons {
    @include flex-container(row, flex-end, center);

    &--submit {
      margin: 1.5em 0;
    }
  }

  &__no-results {
    @include flex-container(column, initial, center);
  }

  &__submitted {
    @include flex-container(column, center, center);
  }

  &__button {
    margin-top: 1em;
    background-color: $c-information-blue;

    &:hover {
      background: darken($c-information-blue, 5%);
    }
  }
}

.survey-question {
  &__title {
    margin-bottom: 5px;
    text-align: left;
    font-weight: 500;
    color: $c-soft-black;
    @include font-category('heading');
  }

  &__responses {
    text-align: left;
    margin-bottom: 1.5em;

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

.error {
  color: $c-error-red;
}

.updog--small {
  height: 200px;
  width: 200px;
}
</style>
