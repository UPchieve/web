<template>
  <div>
    <!--    Passed everything-->
    <div class="passed">
      What a rockstar!
      <div class="quiz-results">
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
        >Continue Onboarding</LargeButton
      >
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
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const UPCHIEVE_101_CATEGORY = 'upchieve101'

const props = defineProps<{
  subjectDisplayName: string
  subjectCategory: string
  upchieveAnswerMap: AnswerMap
  subjectAnswerMap: AnswerMap
}>()

const router = useRouter()
const store = useStore()

const goToDashboard = () => {
  router.push('/dashboard')
}

onBeforeMount(async () => {
  AnalyticsService.captureEvent(EVENTS.COMBINED_QUIZ_PASSED_QUIZ, {
    category: props.subjectCategory,
  })

  const newCertifications = {
    ...store.state.user.user.certifications,
  }
  const upchieve101Result = await NetworkService.getQuizScore({
    idAnswerMap: props.upchieveAnswerMap,
    category: UPCHIEVE_101_CATEGORY,
  })
  if (upchieve101Result.data.passed) {
    newCertifications[UPCHIEVE_101_CATEGORY] = {
      passed: true,
      tries: upchieve101Result.data.tries, // @TODO this won't be accurate unless we send quiz failures to backend.
    }
  }
  const subjectResult = await NetworkService.getQuizScore({
    idAnswerMap: props.subjectAnswerMap,
    category: props.subjectCategory,
  })
  if (subjectResult.data.passed) {
    newCertifications[props.subjectCategory] = {
      passed: true,
      tries: subjectResult.data.tries, // @TODO this won't be accurate unless we send quiz failures to backend.
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

.quiz-results {
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
}

.passed-emphasis {
  color: $c-success-green;
}
</style>
