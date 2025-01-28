<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import SurveyQuestion from '@/components/Surveys/SurveyQuestion.vue'
import Loader from '@/components/Loader.vue'
import { useSurvey } from '@/composables/useSurvey'
import { SURVEY_TYPES } from '@/services/SurveyService'
import type { SurveyDefinition } from '@/services/SurveyService'

const props = defineProps<{ surveryDefiniton: SurveyDefinition }>()

const store = useStore()
const {
  survey,
  userResponses,
  isSurveyComplete,
  hasUpdatedUserResponse,
  initializeSurvey,
  handleSurveySubmit,
  updateUserResponse,
} = useSurvey({
  surveyType: SURVEY_TYPES.IMPACT_STUDY,
  initialSurvey: props.surveryDefiniton,
})

const error = ref('')
const onMountError = ref('')
const isSubmitting = ref(false)
const loadingMessage = ref('')

const mobileMode = computed(() => store.getters['app/mobileMode'])

async function handleSurveySubmission() {
  error.value = ''
  if (!isSurveyComplete.value || isSubmitting.value) return

  isSubmitting.value = true
  loadingMessage.value = 'Updating your answers...'

  try {
    await handleSurveySubmit()
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    isSubmitting.value = false
    loadingMessage.value = ''
  }
}

onMounted(async () => {
  try {
    await initializeSurvey()
  } catch (err) {
    onMountError.value = (err as Error).message
  }
})
</script>

<template>
  <div>
    <p v-if="onMountError" class="error">
      {{ onMountError }}
    </p>

    <loader
      v-if="isSubmitting"
      :message="loadingMessage"
      class="impact-survey__loader"
      :overlay="true"
    />

    <section v-if="survey?.length" class="impact-survey-questions">
      <div class="impact-survey__title">Your School Journey!</div>

      <SurveyQuestion
        v-for="currentQuestion of survey"
        :key="currentQuestion.questionId"
        :question="currentQuestion"
        :userResponse="userResponses[currentQuestion?.questionId]"
        :updateUserResponse="updateUserResponse"
      />
      <p v-if="error" class="error">
        {{ error || 'We were unable to submit your survey. Please try again.' }}
      </p>

      <div v-if="!mobileMode" class="impact-survey__separator" />
      <div class="impact-survey-buttons">
        <LargeButton
          primary
          @click="handleSurveySubmission"
          :disabled="!isSurveyComplete || !hasUpdatedUserResponse ? true : null"
        >
          Update
        </LargeButton>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.impact-survey {
  width: 100%;
  display: flex;
  flex-direction: column;
  text-align: left;

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
}

.impact-survey-question {
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

.impact-survey-buttons {
  width: 100%;
  @include flex-container(row, flex-end, center);
  margin: 1.5em 0;

  button {
    margin-right: 1em;

    &:last-child {
      margin-right: initial;
    }
  }

  &--secondary {
    @include flex-container(row, space-between, center);

    &-button {
      margin: 0 auto;
      width: 100%;
      margin-bottom: 1.3em;

      @include breakpoint-above('small') {
        width: 250px;
        margin-bottom: initial;
      }

      &--primary {
        background-color: $c-information-blue;

        &:hover {
          background: darken($c-information-blue, 5%);
        }
      }

      &--verify {
        margin-left: auto;
      }
    }
  }
}

.cross-icon-container {
  cursor: pointer;
  align-self: flex-end;
}

.cross-icon {
  fill: $icon-grey;
  width: 15px;
  height: 15px;
}

.error {
  color: $c-error-red;
}
</style>
