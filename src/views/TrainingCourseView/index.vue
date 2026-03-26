<script lang="ts" setup>
import Loader from '@/components/Loader.vue'
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue'
import NetworkService from '@/services/NetworkService'
import type {
  UpchieveTrainingCourse,
  UpchieveTrainingCourseModule,
} from '@/views/TrainingCourseView/types'
import TrainingModule from '@/views/TrainingCourseView/TrainingModule.vue'
import SideNavigation from '@/views/TrainingCourseView/SideNavigation.vue'
import type {
  NavigationStep,
  StepStatus,
} from '@/views/TrainingCourseView/SideNavigation.vue'
import TrainingBanner from '@/views/TrainingCourseView/TrainingBanner.vue'
import { useStore } from 'vuex'
import TrainingQuiz from '@/views/TrainingCourseView/Quizzes/TrainingQuiz.vue'
import LoggerService from '@/services/LoggerService'
import TrainingPage from '@/views/TrainingCourseView/Quizzes/TrainingPage.vue'
import NationallyCertifiedTutorBanner from '@/assets/Training/nationally_certified_tutor_banner.svg'
import LargeButton from '@/components/LargeButton.vue'
import { useRouter } from 'vue-router'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { getTrainingProgress } from '@/utils/get-training-progress'
import { UpchieveTrainingCourseKeyEnum } from '@/views/TrainingCourseView/types'

const store = useStore()
const router = useRouter()
const trainingCourseDefinition = ref<UpchieveTrainingCourse | null>(null)

const currentModuleIndex = ref<number>(0)
const currentModule = computed(
  () => trainingCourseDefinition.value?.modules[currentModuleIndex.value]
)
const currentMaterialKey = computed(
  () => currentModule.value?.materials[0].materialKey
)
const isRecordingProgress = ref<boolean>(false)

watch(currentModule, (curr, prev) => {
  if (curr && curr.key !== prev?.key) {
    AnalyticsService.captureEvent(EVENTS.TRAINING_VIEWED_MODULE, {
      moduleKey: curr.key,
      moduleName: curr.name,
    })
  }
})

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
    const trainingCourseResponse = await NetworkService.getTrainingCourse(
      UpchieveTrainingCourseKeyEnum.CURRENT
    )
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
      `Failed to get training course definition for course ${UpchieveTrainingCourseKeyEnum.CURRENT}`
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

watch(currentModule, async (curr) => {
  if (!curr) return
  const hasCompletedThisMaterial =
    completedMaterials.value &&
    completedMaterials.value.includes(curr.materials[0].materialKey)
  if (!hasCompletedThisMaterial) {
    await recordTrainingProgress()
  }
})
async function recordTrainingProgress() {
  isRecordingProgress.value = true
  try {
    if (
      currentMaterialKey.value &&
      !completedMaterials.value.includes(currentMaterialKey.value)
    ) {
      const response = await NetworkService.recordTrainingCourseProgress(
        UpchieveTrainingCourseKeyEnum.CURRENT,
        currentMaterialKey.value
      )
      AnalyticsService.captureEvent(EVENTS.TRAINING_COMPLETED_MATERIAL, {
        materialKey: currentMaterialKey.value,
      })
      completedMaterials.value = response.data.completedMaterialKeys
    }
  } catch (err) {
    handleError(
      err,
      `Failed to record training course progress for course ${UpchieveTrainingCourseKeyEnum.CURRENT} and material ${currentMaterialKey.value}`
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
    AnalyticsService.captureEvent(EVENTS.TRAINING_VIEWED_FINISHED_PAGE)
    currentStepType.value = 'finishedPage'
    doForceGoToFinishedPageOnNext.value = false
    return
  }
  const proceedToNextModule = () => {
    currentModuleIndex.value = currentModuleIndex.value + 1
    currentStepType.value = 'viewMaterials'
  }

  if (currentStepType.value === 'viewMaterials') {
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
  currentStepType.value = 'takeQuiz'
}

async function navigateToStep(index: number) {
  currentModuleIndex.value = index
  currentStepType.value = 'viewMaterials'
  await scrollToTop()
}

const navigationSteps = computed((): NavigationStep[] => {
  if (!trainingCourseDefinition.value) return []
  function getStepStatus(module: UpchieveTrainingCourseModule): StepStatus {
    if (module.key === 'introduction') {
      // The intro module has no quiz so it is technically completed as soon as the user views the material.
      // However, if they are just starting the training, we want to wait until they move past the intro module to show
      // it as complete.
      const introModuleMaterialKey = module.materials[0].materialKey
      const hasProgressedPastIntro = completedMaterials.value?.filter(
        (matKey) => matKey !== introModuleMaterialKey
      ).length
      const hasCompletedIntroModule = completedMaterials.value?.includes(
        introModuleMaterialKey
      )
      return hasProgressedPastIntro
        ? 'complete'
        : hasCompletedIntroModule
          ? 'started'
          : 'not-started'
    }
    const isQuizComplete =
      !module.quizKey ||
      (module.quizKey && store.getters['user/hasCertification'](module.quizKey))
    const isMaterialComplete = completedMaterials.value?.includes(
      module.materials[0].materialKey
    )

    return isQuizComplete && isMaterialComplete
      ? 'complete'
      : isMaterialComplete
        ? 'started'
        : 'not-started'
  }
  return trainingCourseDefinition.value?.modules.map((module, index) => {
    return {
      status: getStepStatus(module),
      name: module.name,
      currentStepIndex: index,
      hasKnowledgeCheck: !!module.quizKey,
    }
  })
})

const overallProgress = computed(() => {
  return getTrainingProgress(
    trainingCourseDefinition.value,
    completedMaterials.value
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
    <div class="main-content">
      <TrainingModule
        v-if="simplifiedTrainingModule && currentStepType === 'viewMaterials'"
        :module="simplifiedTrainingModule"
        :hasPreviousModule="hasPreviousModule"
        :onPrevious="goToPreviousStep"
        :onNext="goToNextStep"
      />
      <TrainingQuiz
        v-else-if="
          [
            'takeQuiz',
            'viewQuizResultsPassed',
            'viewQuizResultsFailed',
          ].includes(currentStepType)
        "
        :quizCategory="currentModule?.quizKey ?? ''"
        @exitQuiz="onBackOutOfQuiz"
        @resetQuiz="incrementQuizComponentKey"
        @finishedQuiz="submitQuiz"
        @error="handleError"
        @passedQuizAndExit="onPassedQuiz"
        @clickedNextOrPrevious="scrollToTop"
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
            Welcome to the UPchieve Coach Community. You're now equipped with
            the proven coaching tools and strategies to support learners from
            all backgrounds.
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
  </div>
</template>

<style lang="scss" scoped>
.main-grid-container {
  max-width: calc(833px + 300px); // maximum size of banner and side navigation
  background-color: white;
  display: grid;
  justify-content: center;
  grid-template-columns: [main] minmax(0, 833px) [stepper] auto;
  grid-template-rows: [banner] auto [main-content] auto [navigation-buttons] auto;
  border-radius: 8px;
  box-sizing: border-box;
  width: 100%;

  @media screen and (max-width: 1372px) {
    display: grid;
    justify-content: center;
    grid-template-columns: [main] 1fr;
    grid-template-rows: [banner] auto [main-content] auto [navigation-buttons] auto [stepper] auto;
    padding: 0;
  }

  .main-content {
    grid-row: main-content;
    grid-column: main;
    max-width: 833px;

    #loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 30vh;
    }
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
      width: 100%;
      height: auto;
    }
  }

  .side-navigation {
    grid-row: -1 / 1;
    grid-column: stepper;
    align-self: start;
    max-width: 300px;
    border: 1px solid $c-border-grey;
    position: sticky;
    top: 64px; // height of the app banner
    max-height: 100vh;
    box-sizing: border-box;

    @media screen and (max-width: 1372px) {
      grid-row: stepper;
      grid-column: main;
      bottom: 0;
      top: 0;
      width: 100%;
      height: auto;
      max-width: 833px;
      overflow-y: auto;
      position: sticky;
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
