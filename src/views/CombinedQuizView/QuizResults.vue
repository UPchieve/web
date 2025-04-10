<template>
  <div>
    <!--    Passed everything-->
    <div v-if="props.passedSubject && props.passedUPchieve101" class="passed">
      What a rockstar!
      <div class="quiz-failures">
        <div class="quiz-result">
          <div class="passed-emphasis half-width">You passed UPchieve 101!</div>
          <CheckCircledIcon class="half-width" />
        </div>
        <div class="quiz-result">
          <div class="passed-emphasis half-width">
            You passed {{ props.subjectDisplayName }}!
          </div>
          <CheckCircledIcon class="half-width" />
        </div>
      </div>
      <LargeButton variant="primary" :showArrow="false" @click="goToDashboard"
        >Dashboard</LargeButton
      >
    </div>

    <!--      Failed at least one-->
    <div v-else class="quiz-failures">
      <div>
        <span class="light-emphasis"
          >You failed this time, but don't give up!</span
        ><br /><br />
        You need 10 correct answers in each category to pass:
      </div>
      <div v-if="props.hadUpchieve101Questions">
        <div v-if="!props.passedUPchieve101" class="quiz-result">
          <div class="half-width">
            You got
            <span class="failure-emphasis light-emphasis">{{
              props.numCorrectUPchieve101
            }}</span>
            UPchieve 101 questions correct.
          </div>
          <LargeButton
            class="uc-form-button-secondary half-width"
            variant="secondary"
            @click="() => emit('clickedReviewUPchieve101')"
          >
            Review UPchieve 101
          </LargeButton>
        </div>
        <div v-else class="quiz-result">
          <div class="passed-emphasis half-width">You passed UPchieve 101!</div>
          <CheckCircledIcon class="half-width" />
        </div>
      </div>

      <div v-if="props.hadSubjectQuestions">
        <div v-if="!props.passedSubject" class="quiz-result">
          <div class="half-width">
            You got
            <span class="failure-emphasis light-emphasis">{{
              props.numCorrectSubject
            }}</span>
            {{ props.subjectDisplayName }}
            questions correct
          </div>
          <LargeButton
            class="uc-form-button-secondary half-width"
            variant="secondary"
            @click="() => emit('clickedReviewSubject')"
          >
            Review {{ props.subjectDisplayName }}
          </LargeButton>
        </div>
        <div v-else class="quiz-result">
          <div class="passed-emphasis half-width">
            You passed {{ props.subjectDisplayName }}!
          </div>
          <CheckCircledIcon class="half-width" />
        </div>
      </div>
      <div class="mt-2">
        <LargeButton
          class="uc-form-button"
          variant="primary"
          @click="() => emit('clickedRetakeQuiz')"
          :showArrow="false"
          >Retake quiz</LargeButton
        >
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import CheckCircledIcon from '@/assets/check-circled.svg'
import { useRouter } from 'vue-router'
import { onBeforeMount } from 'vue'
import type { AnswerMap } from '@/services/TrainingService'
import NetworkService from '@/services/NetworkService'
import { useStore } from 'vuex'

const UPCHIEVE_101_CATEGORY = 'upchieve101'

const props = defineProps<{
  passedUPchieve101: boolean
  hadUpchieve101Questions: boolean
  passedSubject: boolean
  hadSubjectQuestions: boolean
  numCorrectUPchieve101: number
  numCorrectSubject: number
  subjectDisplayName: string
  subjectCategory: string
  upchieveAnswerMap: AnswerMap
  subjectAnswerMap: AnswerMap
}>()

const emit = defineEmits([
  'clickedReviewUPchieve101',
  'clickedReviewSubject',
  'clickedRetakeQuiz',
])

const router = useRouter()
const store = useStore()

const goToDashboard = () => {
  router.push('/dashboard')
}

onBeforeMount(async () => {
  const newCertifications = {
    ...store.state.user.user.certifications,
  }
  if (props.passedUPchieve101) {
    const result = await NetworkService.getQuizScore({
      idAnswerMap: props.upchieveAnswerMap,
      category: UPCHIEVE_101_CATEGORY,
    })
    if (result.data.passed) {
      newCertifications[UPCHIEVE_101_CATEGORY] = {
        passed: true,
        tries: result.data.tries, // @TODO this won't be accurate unless we send quiz failures to backend.
      }
    }
  }
  if (props.passedSubject) {
    const result = await NetworkService.getQuizScore({
      idAnswerMap: props.subjectAnswerMap,
      category: props.subjectCategory,
    })
    if (result.data.passed) {
      newCertifications[props.subjectCategory] = {
        passed: true,
        tries: result.data.tries, // @TODO this won't be accurate unless we send quiz failures to backend.
      }
    }
  }

  await store.dispatch('user/addToUser', {
    certifications: newCertifications,
  })
})
</script>

<style lang="scss" scoped>
.passed {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.half-width {
  width: 50%;
}

.quiz-failures {
  display: flex;
  flex-direction: column;
  gap: 24px;

  .quiz-result {
    display: flex;
    flex-direction: row;
    padding-bottom: 8px;
    padding-top: 24px;
    margin-left: 2em;
    justify-content: space-between;
    align-items: center;
  }

  .quiz-passed {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
  }
}

.failure-emphasis {
  color: $c-error-red;
}

.passed-emphasis {
  color: $c-success-green;
}

.light-emphasis {
  font-weight: 500;
}
</style>
