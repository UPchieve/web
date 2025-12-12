<script lang="ts" setup>
import Loader from '@/components/Loader.vue'
import { computed, nextTick, onBeforeMount, ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import type { UpchieveTrainingCourse } from '@/views/UpchieveTrainingView/types'
import TrainingModule from '@/views/UpchieveTrainingView/TrainingModule.vue'
import SideNavigation from '@/views/UpchieveTrainingView/SideNavigation.vue'
import type {
  NavigationStep,
  StepStatus,
} from '@/views/UpchieveTrainingView/SideNavigation.vue'
import TrainingBanner from '@/views/UpchieveTrainingView/TrainingBanner.vue'
import { useStore } from 'vuex'
import TrainingQuiz from '@/views/UpchieveTrainingView/Quizzes/TrainingQuiz.vue'
import LoggerService from '@/services/LoggerService'
import TrainingPage from '@/views/UpchieveTrainingView/Quizzes/TrainingPage.vue'
import NationallyCertifiedTutorBanner from '@/assets/Training/nationally_certified_tutor_banner.svg'
import LargeButton from '@/components/LargeButton.vue'
import { useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const COURSE_KEY = 'upchieveTraining'
const trainingCourseDefinition = ref<UpchieveTrainingCourse | null>(null)

const currentModuleIndex = ref<number>(0)
const currentModule = computed(
  () => trainingCourseDefinition.value?.modules[currentModuleIndex.value]
)
const currentMaterialKey = computed(
  () => currentModule.value?.materials[0].materialKey
)
const isRecordingProgress = ref<boolean>(false)

// This is while we deal with some of the legacy stuff for training courses.
// Legacy training course had multiple materials per module
// Now we just have one material.
// @TODO Eventually drop this altogether once we update the backend to no longer require us to record per-material progress.
const simplifiedTrainingModule = computed(() => {
  if (!currentModule.value) return
  return {
    name: currentModule.value?.name,
    key: currentModule.value?.key,
    material: currentModule.value?.materials[0],
    quizKey: currentModule.value?.quizKey,
  }
})

const hasPassedModuleQuiz = computed(
  () =>
    currentModule.value && hasModuleCertification(currentModule.value?.quizKey)
)

function hasModuleCertification(module: string): boolean {
  return store.getters['user/hasCertification'](module)
}

export type StepType =
  | 'viewMaterials'
  | 'takeQuiz'
  | 'viewQuizResultsPassed'
  | 'viewQuizResultsFailed'
  | 'finishedPage'
const currentStepType = ref<StepType>('viewMaterials')

onBeforeMount(async () => {
  try {
    const trainingCourseResponse =
      await NetworkService.getTrainingCourse(COURSE_KEY)
    trainingCourseDefinition.value = trainingCourseResponse.data.course
    completedMaterials.value =
      trainingCourseDefinition.value?.completedMaterials ?? []
    const lastIncompleteStep = navigationSteps.value.findIndex(
      (step) => step.status !== 'complete'
    )
    currentModuleIndex.value = Math.max(lastIncompleteStep, 0)
  } catch (err) {
    handleError(
      err,
      `Failed to get training course definition for course ${COURSE_KEY}`
    )
  }
})
const hasPreviousModule = computed(() => currentModuleIndex.value > 0)

const trainingBanner = ref()
async function scrollToTop() {
  await nextTick()
  if (trainingBanner.value) {
    trainingBanner.value.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }
}

const completedMaterials = ref<string[]>([])
async function recordTrainingProgress() {
  isRecordingProgress.value = true
  try {
    if (
      currentMaterialKey.value &&
      !completedMaterials.value.includes(currentMaterialKey.value)
    ) {
      const response = await NetworkService.recordTrainingCourseProgress(
        COURSE_KEY,
        currentMaterialKey.value
      )
      completedMaterials.value = response.data.completedMaterialKeys
    }
  } catch (err) {
    handleError(
      err,
      `Failed to record training course progress for course ${COURSE_KEY} and material ${currentMaterialKey.value}`
    )
  } finally {
    isRecordingProgress.value = false
  }
}

const isTrainingComplete = computed(() => {
  if (!trainingCourseDefinition.value) return false
  const requiredCerts =
    trainingCourseDefinition.value.requiredCertifications ?? []
  const unlockedCerts = requiredCerts.filter((cert) =>
    store.getters['user/hasCertification'](cert)
  )
  return requiredCerts.length === unlockedCerts.length
})
const doForceGoToFinishedPageOnNext = ref<boolean>(false)

async function goToNextStep() {
  const isLastStep =
    isTrainingComplete.value &&
    trainingCourseDefinition.value &&
    currentModuleIndex.value ===
      trainingCourseDefinition.value.modules.length - 1
  if (
    doForceGoToFinishedPageOnNext.value ||
    (isLastStep && isTrainingComplete.value)
  ) {
    currentStepType.value = 'finishedPage'
    doForceGoToFinishedPageOnNext.value = false
    return
  }
  const proceedToNextModule = () => {
    currentModuleIndex.value = currentModuleIndex.value + 1
    currentStepType.value = 'viewMaterials'
  }

  if (currentStepType.value === 'viewMaterials') {
    await recordTrainingProgress()
    if (!currentModule.value?.quizKey || hasPassedModuleQuiz.value) {
      proceedToNextModule()
    } else {
      currentStepType.value = 'takeQuiz'
    }
  } else if (currentStepType.value === 'takeQuiz') {
    currentStepType.value = 'viewQuizResultsPassed'
  } else if (currentStepType.value === 'viewQuizResultsPassed') {
    currentStepType.value = 'viewMaterials'
    if (hasPassedModuleQuiz.value) {
      proceedToNextModule()
    }
  }
  await scrollToTop()
}

async function submitQuiz() {
  if (hasPassedModuleQuiz.value) {
    currentStepType.value = 'viewQuizResultsPassed'
  } else {
    currentStepType.value = 'viewQuizResultsFailed'
  }
}

async function goToPreviousStep() {
  currentModuleIndex.value = currentModuleIndex.value - 1
  currentStepType.value = 'viewMaterials'
  await scrollToTop()
}

async function onBackOutOfQuiz() {
  currentStepType.value = 'viewMaterials'
  await scrollToTop()
}

async function onPassedQuiz() {
  if (isTrainingComplete.value) {
    doForceGoToFinishedPageOnNext.value = true
  }
  await goToNextStep()
}

const quizComponentKey = ref<number>(0) // Change this key to force a rerender
function incrementQuizComponentKey() {
  quizComponentKey.value = quizComponentKey.value + 1
}

async function navigateToStep(index: number) {
  if (currentMaterialKey.value) {
    try {
      await NetworkService.recordTrainingCourseProgress(
        COURSE_KEY,
        currentMaterialKey.value
      )
      currentModuleIndex.value = index
    } catch {
      // still navigate even if recording fails
      currentModuleIndex.value = index
    } finally {
      await scrollToTop()
    }
  }
}

const navigationSteps = computed((): NavigationStep[] => {
  if (!trainingCourseDefinition.value) return []
  const quizNames = trainingCourseDefinition.value?.modules.map(
    (m) => m.quizKey
  )
  const hasPassedSomeQuiz = quizNames.filter((quiz) =>
    store.getters['user/hasCertification'](quiz)
  ).length
  // @TODO Update me when adding new Knowledge Checks step into the stepper.
  return trainingCourseDefinition.value?.modules.map((module, index) => {
    const status: StepStatus =
      module.key === 'introduction'
        ? hasPassedSomeQuiz || currentModuleIndex.value > 0
          ? 'complete'
          : 'in-progress'
        : hasModuleCertification(module.quizKey)
          ? 'complete'
          : index === currentModuleIndex.value
            ? 'in-progress'
            : 'not-started'
    return {
      status,
      name: module.name,
      currentStepIndex: index,
      hasKnowledgeCheck: !!module.quizKey,
    }
  })
})

const overallProgress = computed(() => {
  if (!trainingCourseDefinition.value) return 0
  const requiredCerts: string[] =
    trainingCourseDefinition.value?.requiredCertifications ?? []
  const requiredMaterials: string[] =
    trainingCourseDefinition.value?.modules.reduce((acc, module) => {
      acc.push(
        module.materials
          .filter((mat) => mat.isRequired)
          .map((mat) => mat.materialKey)
      )
      return acc
    }, [] as string[])
  const totalSteps = requiredCerts.length + requiredMaterials.length

  const completedCerts = requiredCerts.filter((cert) =>
    store.getters['user/hasCertification'](cert)
  )
  return Math.floor(
    ((completedCerts.length + (completedMaterials.value?.length ?? 0)) /
      totalSteps) *
      100.0
  )
})

const errorMessage = ref<string>('')
function handleError(error: any, message: string) {
  LoggerService.noticeError({ error }, { message })
  errorMessage.value =
    'Something went wrong. Please refresh the page and try again'
}

function onClickReviewTraining() {
  currentModuleIndex.value = 0
  currentStepType.value = 'viewMaterials'
}

function onClickGoToDashboard() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="main-grid-container">
    <div
      class="banner"
      ref="trainingBanner"
      v-if="currentStepType !== 'finishedPage'"
    >
      <TrainingBanner
        :moduleName="currentModule?.name ?? ''"
        :title="currentModule?.name ?? 'Intro to UPchieve'"
        subtitle="TRAINING"
      />
    </div>
    <SideNavigation
      class="side-navigation"
      :steps="navigationSteps"
      :overallProgress="overallProgress"
      :currentStepIndex="currentModuleIndex"
      :currentStepType="currentStepType"
      :drawerMode="store.getters['app/widthLessThanPx'](1372)"
      @navigate-to-step="navigateToStep"
    />
    <div v-if="errorMessage" class="error-callout">
      {{ errorMessage }}
    </div>
    <TrainingModule
      v-if="simplifiedTrainingModule && currentStepType === 'viewMaterials'"
      :module="simplifiedTrainingModule"
      :hasPreviousModule="hasPreviousModule"
      :onPrevious="goToPreviousStep"
      :onNext="goToNextStep"
    />
    <TrainingQuiz
      v-else-if="
        ['takeQuiz', 'viewQuizResultsPassed', 'viewQuizResultsFailed'].includes(
          currentStepType
        )
      "
      :quizCategory="currentModule?.quizKey ?? ''"
      @exitQuiz="onBackOutOfQuiz"
      @resetQuiz="incrementQuizComponentKey"
      @finishedQuiz="submitQuiz"
      @error="handleError"
      @passedQuizAndExit="onPassedQuiz"
      :key="quizComponentKey"
    />
    <TrainingPage
      v-else-if="isTrainingComplete && currentStepType === 'finishedPage'"
      class="congrats-page"
    >
      <template v-slot:main-content>
        <NationallyCertifiedTutorBanner class="banner banner--congrats" />
        <div class="congrats-content">
          <span class="congrats-heading">
            Congratulations on completing the Intro to UPchieve Course!
          </span>
          Welcome to the UPchieve Coach Community. You're now equipped with the
          proven coaching tools and strategies to support learners from all
          backgrounds.
        </div>
      </template>
      <template v-slot:previous-button>
        <LargeButton
          class="previous-button"
          variant="secondary"
          :showArrow="true"
          arrowDirection="left"
          @click="onClickReviewTraining"
          >Review Training</LargeButton
        >
      </template>
      <template v-slot:next-button>
        <LargeButton
          variant="primary-blue"
          :showArrow="false"
          class="next-button"
          @click="onClickGoToDashboard"
          >Go to Dashboard</LargeButton
        >
      </template>
    </TrainingPage>
    <Loader id="loader" v-else />
  </div>
</template>

<style lang="scss" scoped>
.main-grid-container {
  background-color: white;
  display: grid;
  justify-content: center;
  grid-template-columns: [main] auto [stepper] auto;
  grid-template-rows: [banner] auto [main-content] auto [navigation-buttons] auto;
  border-radius: 8px;
  box-sizing: border-box;

  @media screen and (max-width: 1372px) {
    display: grid;
    justify-content: center;
    grid-template-columns: [main] auto;
    grid-template-rows: [banner] auto [main-content] auto [navigation-buttons] auto [stepper] auto;
    padding: 0;
  }

  #loader {
    grid-row: main-content;
    grid-column: main;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  #loader {
    grid-row: main-content;
    grid-column: main;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  #loader {
    grid-row: main-content;
    grid-column: main;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .banner {
    grid-column: main;
    grid-row: banner;
    background-size: cover;
    max-width: 833px;
    max-height: 169px;
    padding: 0;

    @media screen and (max-width: 1372px) {
      max-height: 280px;
    }

    &--congrats {
      max-height: none;
    }
  }

  .side-navigation {
    grid-row: -1 / 1;
    grid-column: stepper;
    align-self: stretch;
    max-width: 300px;
    border: 1px solid $c-border-grey;
    position: sticky;
    top: 64px; // height of the app banner
    height: calc(100vh - 64px);
    box-sizing: border-box;

    @media screen and (max-width: 1372px) {
      display: flex;
      flex-direction: column;
      bottom: 0;
      top: 0;
      width: 100%;
      height: 50vh;
      grid-row: stepper;
      grid-column: main;
      max-width: inherit;
      overflow-y: auto;
    }
  }
}

.error-callout {
  background-color: lighten($c-error-red, $amount: 30%);
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0px;
  text-align: center;
  grid-row: main-content;
  justify-self: center;
  padding: 3%;
  border-radius: 5px;
  border: 1px solid $c-error-red;
}

:deep(.main-content-area) {
  overflow-x: auto;
}

.congrats-page {
  :deep(.main-content-area) {
    padding: 0px;
  }
}

.congrats-heading {
  font-weight: 500;
  font-size: 20px;
  color: $c-hover-green;
  padding-bottom: 8px;
  padding-top: 24px;
}

.congrats-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 24px;
}
</style>
