<script lang="ts">
import type {
  TrainingCourse,
  TrainingModule as TrainingModuleType,
} from '@/services/TrainingService'
export enum CustomModules {
  welcome = 'UPchieve 101',
  quiz = 'Quiz',
}
</script>

<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import { computed, onMounted, ref, watch } from 'vue'
import NetworkService from '@/services/NetworkService'
import { useRouter } from 'vue-router'
import Stepper from '@/components/Stepper.vue'
import { useStore } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import TrainingModule from '@/views/Training/TrainingModule.vue'

const router = useRouter()
const store = useStore()

// These modules are for the FE only / do not come from the backend
const welcomeModule: TrainingModuleType = {
  name: CustomModules.welcome,
  materials: [],
}
const quizModule: TrainingModuleType = {
  name: CustomModules.quiz,
  materials: [],
}

const trainingCourse = ref<TrainingCourse | null>(null)
const error = ref<string | null>(null)

const courseKey = computed(() => router.currentRoute.value.params.courseKey)
const currentModule = ref<TrainingModuleType | undefined>(undefined)

const currentModuleIndex = computed(() => {
  const currentIndex = trainingCourse.value?.modules.indexOf(
    currentModule.value!
  )
  if (!currentIndex || (currentIndex && currentIndex < 0)) return 0
  else return currentIndex
})

const viewingFirstModule = computed(() => currentModuleIndex.value === 0)
const viewingLastModule = computed(
  () => currentModuleIndex.value === trainingCourse.value?.modules.length! - 1
)

const hasPassedQuiz = computed(() => store.getters['user/passedUpchieve101'])

const nextButtonLabel = computed(() => {
  if (currentModule.value?.name === CustomModules.quiz) {
    return 'Start Quiz'
  }
  return viewingLastModule.value ? 'Complete' : 'Next'
})

const videoWidth = computed(() => (store.getters['app/mobileMode'] ? 300 : 560))
const videoHeight = computed(() =>
  store.getters['app/mobileMode'] ? 150 : 315
)

const showStepper = computed(() => currentModuleIndex.value !== 0) // Don't show stepper on the intro page.
const stepperNumSteps = computed(
  () => trainingCourse.value!.modules.length - 2 ?? 0
) // Don't count intro page or quiz as steps
const stepperStepNames = computed(() =>
  trainingCourse.value?.modules.map((module) => module.name)
)
const isReadyForQuiz = computed(() => trainingCourse.value?.isComplete)

onMounted(async () => {
  const course: TrainingCourse = (
    await NetworkService.getTrainingCourse(courseKey.value)
  ).data.course

  const coachingOnUPchieveModule = course.modules.find(
    (module) => module.name === 'Coaching on UPchieve'
  )!
  // Separate some of the modules from the BE into their own modules, just for the test.
  const communitySafetySuccessModule = course.modules.find(
    (module) => module.name === 'Community Safety & Success'
  )!
  const safetyModule: TrainingModuleType = {
    name: 'Community Safety',
    materials: communitySafetySuccessModule.materials.filter((material) =>
      ['Community Safety & Success', 'Review Safety Policy'].includes(
        material.name
      )
    ),
  }
  const academicIntegrityModule: TrainingModuleType = {
    name: 'Academic Integrity',
    materials: communitySafetySuccessModule.materials.filter(
      (material) => material.name === 'Review Academic Integrity Policy'
    ),
  }
  const deiPolicyModule: TrainingModuleType = {
    name: 'Diversity, Equity, and Inclusion Policy',
    materials: communitySafetySuccessModule.materials.filter(
      (material) =>
        material.name === 'Review Diversity, Equity, and Inclusion Policy'
    ),
  }

  const modifiedModules: TrainingModuleType[] = [
    welcomeModule,
    coachingOnUPchieveModule,
    safetyModule,
    academicIntegrityModule,
    deiPolicyModule,
  ]
  if (!hasPassedQuiz.value) {
    modifiedModules.push(quizModule)
  }
  trainingCourse.value = {
    ...course,
    modules: modifiedModules,
  }
  currentModule.value = trainingCourse.value?.modules[0]

  AnalyticsService.captureEvent(EVENTS.LMS_USER_SAW_TRAINING_COURSE, {
    trainingCourseKey: trainingCourse.value?.courseKey,
  })
})

const onClickNext = async () => {
  error.value = null
  AnalyticsService.captureEvent(EVENTS.LMS_USER_CLICKED_NEXT_BUTTON)

  // Record progress
  try {
    for (const material of currentModule?.value?.materials ?? []) {
      // TODO: Update backend to accept multiple materials in a single request.
      await NetworkService.recordTrainingCourseProgress(
        courseKey.value,
        material.materialKey
      )
      AnalyticsService.captureEvent(
        EVENTS.LMS_USER_COMPLETED_MODULE_MATERIALS,
        {
          moduleName: currentModule.value?.name,
        }
      )
    }
  } catch (err) {
    error.value =
      'Oops! Something went wrong. Please refresh the page and try again.'
  }
  if (!error.value) {
    if (!viewingLastModule.value) {
      const nextIndex = currentModuleIndex.value! + 1
      currentModule.value = trainingCourse.value?.modules[nextIndex]
    } else {
      goToQuiz()
    }
  }
}

const onClickBack = () => {
  error.value = null
  AnalyticsService.captureEvent(EVENTS.LMS_USER_CLICKED_BACK_BUTTON)
  const nextIndex = Math.max(currentModuleIndex.value - 1, 0)
  currentModule.value = trainingCourse.value?.modules[nextIndex]
}

const goToQuiz = () => {
  AnalyticsService.captureEvent(EVENTS.LMS_USER_CLICKED_START_QUIZ, {
    trainingCourseKey: trainingCourse.value?.courseKey,
  })
  router.push(`/training/${courseKey.value}/quiz`)
}

watch(currentModule, (current) => {
  if (current)
    AnalyticsService.captureEvent(EVENTS.LMS_USER_VIEWED_MODULE, {
      moduleName: currentModule.value?.name,
    })
})
</script>

<template>
  <div class="main-training-container">
    <div class="navigation-buttons-container">
      <LargeButton
        class="navigation-button"
        variant="secondary"
        @click="onClickBack"
        :disabled="viewingFirstModule"
        >Back</LargeButton
      >
      <div class="continue-buttons">
        <LargeButton
          class="navigation-button"
          variant="primary"
          :showArrow="false"
          @click="onClickNext"
          :disabled="!!error"
          >{{ nextButtonLabel }}</LargeButton
        >
        <LargeButton
          v-if="isReadyForQuiz"
          class="navigation-button"
          variant="primary"
          :showArrow="false"
          @click="goToQuiz"
          >Take the Quiz</LargeButton
        >
      </div>
    </div>
    <div v-if="error" class="error-message-container alert alert-danger">
      {{ error }}
    </div>
    <div class="header-area">
      <h1 v-if="currentModule?.name" class="center">
        {{ currentModule?.name }}
      </h1>
      <h2 v-if="currentModule?.name === CustomModules.welcome">
        Getting started on UPchieve
      </h2>
      <div class="training-stepper-container">
        <Stepper
          v-if="showStepper"
          class="training-stepper"
          :currentStep="currentModuleIndex"
          :totalSteps="stepperNumSteps"
          :stepNames="stepperStepNames"
        />
      </div>
    </div>
    <TrainingModule v-if="currentModule" :module="currentModule">
      <template v-slot:heading>
        <h3>Getting started on UPchieve</h3>
      </template>
      <template
        v-slot:customModule
        v-if="currentModule?.name === CustomModules.welcome"
      >
        <div class="training-body">
          <p>
            In this training, you'll learn what how to be a successful academic
            coach on UPchieve, including:
          </p>
          <ul>
            <li>Implementing Effective Coach Strategies</li>
            <li>Building a Safe Learning Environment for Students</li>
            <li>Maintaining Academic Integrity</li>
            <li>Supporting Students from Diverse Backgrounds</li>
          </ul>
          <p>
            Once you've completed this training, you'll meet students like
            Aaron, an UPchieve student alumni who was recently admitted to Yale
            University. Hear Aaron's story in the video below!
          </p>

          <iframe
            :width="videoWidth"
            :height="videoHeight"
            src="https://www.youtube.com/embed/zlxwGBg4fqU?si=Pf6jGYEU30TaipU8"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      </template>
      <template
        v-slot:customModule
        v-else-if="currentModule?.name === CustomModules.quiz"
      >
        <div class="training-body">
          <h2 class="material-title">Let's take a short quiz</h2>
          <p>
            This will test your knowledge about what you've learned about our
            platform. Don't worry, there's no time limit, and you have unlimited
            attempts!
          </p>
          <LargeButton variant="primary" :showArrow="false" @click="goToQuiz"
            >Start Quiz</LargeButton
          >
        </div>
      </template>
    </TrainingModule>
  </div>
</template>

<style lang="scss" scoped>
.continue-buttons {
  display: flex;
  flex-direction: row;
  gap: 4px;
}
.error-message-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80%;
}

.main-training-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @include breakpoint-above('medium') {
    padding: 40px;
  }
}

.navigation-buttons-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: normal;
  width: 100%;
}

.training-stepper {
  width: 100%;

  @include breakpoint-below('small') {
    width: 80%;
  }
}

.training-stepper-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.header-area {
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 100%;
  max-width: 500px;
  padding-bottom: 16px;
  &.h2 {
    @include font-category('subheading');
  }
}

.training-body {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 700px;
  text-align: center;
  align-items: center;

  ul {
    text-align: left;
  }
}

.material-title {
  @include font-category('display-small');
}
</style>
