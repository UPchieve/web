<script lang="ts" setup>
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

const store = useStore()
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

type StepType = 'viewMaterials' | 'takeQuiz' | 'viewQuizResults'
const currentStepType = ref<StepType>('viewMaterials')

onBeforeMount(async () => {
  try {
    const trainingCourseResponse =
      await NetworkService.getTrainingCourse(COURSE_KEY)
    trainingCourseDefinition.value = trainingCourseResponse.data.course
    completedMaterials.value =
      trainingCourseDefinition.value?.completedMaterials ?? []
    // Open to last incomplete step
    const lastIncompleteStep = navigationSteps.value.findIndex(
      (step) => step.status !== 'complete'
    )
    currentModuleIndex.value = lastIncompleteStep
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

async function goToNextStep() {
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
    currentStepType.value = 'viewQuizResults'
  } else if (currentStepType.value === 'viewQuizResults') {
    currentStepType.value = 'viewMaterials'
    if (hasPassedModuleQuiz.value) {
      proceedToNextModule()
    }
  }
  await scrollToTop()
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
  currentStepType.value = 'viewQuizResults'
  await goToNextStep()
  await scrollToTop()
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
      await scrollToTop()
    } catch {
      // still navigate even if recording fails
      currentModuleIndex.value = index
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
</script>

<template>
  <div class="main-container">
    <div class="main-grid-container">
      <div class="banner" ref="trainingBanner">
        <TrainingBanner
          :moduleName="currentModule?.name ?? ''"
          :title="currentModule?.name ?? ''"
          subtitle="TRAINING"
        />
      </div>
      <SideNavigation
        class="side-navigation"
        :steps="navigationSteps"
        :overallProgress="overallProgress"
        :currentStepIndex="currentModuleIndex"
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
        v-else-if="currentStepType === 'takeQuiz'"
        :quizCategory="currentModule?.quizKey ?? ''"
        @exitQuiz="onBackOutOfQuiz"
        @resetQuiz="incrementQuizComponentKey"
        @passedQuiz="onPassedQuiz"
        @error="handleError"
        :key="quizComponentKey"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-container {
  @include breakpoint-below('medium') {
    padding: 10px;
  }
  width: 100%;
}

.main-grid-container {
  display: grid;

  @include breakpoint-above('medium') {
    overflow-y: auto;
    grid-template-columns: [main] fit-content(768px) [stepper] 1fr;
    grid-template-rows: [banner] 169px [main-content] auto [navigation-buttons] auto;
  }

  @include breakpoint-below('medium') {
    grid-template-columns: [main] 1fr;
    grid-template-rows: [banner] auto [main-content] auto [navigation-buttons] auto auto;
  }

  border-radius: 8px;
  background-color: white;
  padding: 3%;

  .banner {
    grid-column: main;
    grid-row: banner;
    background-size: cover;
    width: 100%;
    height: 100%;
    max-width: 833px;
    max-height: 169px;

    @include breakpoint-below('medium') {
      max-height: 280px;
    }
  }

  .side-navigation {
    @include breakpoint-above('medium') {
      grid-row: banner / -banner;
      align-self: stretch;
    }

    @include breakpoint-below('medium') {
      // Move SideNavigation into bottom drawer position on small layouts
      bottom: 0;
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
</style>
