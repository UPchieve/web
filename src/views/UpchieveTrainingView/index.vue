<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import { computed, nextTick, onBeforeMount, ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import type { UpchieveTrainingCourse } from '@/views/UpchieveTrainingView/types'
import TrainingModule from '@/views/UpchieveTrainingView/TrainingModule.vue'
import SideNavigation from '@/views/UpchieveTrainingView/SideNavigation.vue'
import type { NavigationStep } from '@/views/UpchieveTrainingView/SideNavigation.vue'
import Loader from '@/components/Loader.vue'
import TrainingBanner from '@/views/UpchieveTrainingView/TrainingBanner.vue'
import { useStore } from 'vuex'

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
const isModuleComplete = computed(() => {
  if (
    !currentModule.value ||
    !trainingCourseDefinition.value ||
    !currentMaterialKey.value
  )
    return true
  return trainingCourseDefinition.value.completedMaterials.includes(
    currentMaterialKey.value
  )
})
const isRecordingProgress = ref<boolean>(false)

const simplifiedTrainingModule = computed(() => {
  if (!currentModule.value) return
  return {
    name: currentModule.value?.name,
    key: currentModule.value?.key,
    material: currentModule.value?.materials[0],
  }
})

const isMobile = computed(() => store.getters['app/mobileMode'])

onBeforeMount(async () => {
  try {
    const trainingCourseResponse =
      await NetworkService.getTrainingCourse(COURSE_KEY)
    trainingCourseDefinition.value = trainingCourseResponse.data.course
  } catch (err) {
    // @TODO
  }
})

const hasNextModule = computed(
  () =>
    currentModuleIndex.value + 1 <
    trainingCourseDefinition.value!.modules.length
)
const hasPreviousModule = computed(() => currentModuleIndex.value > 0)

const trainingBanner = ref()
async function scrollToTop() {
  await nextTick()
  if (trainingBanner.value) {
    trainingBanner.value.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }
}

async function next() {
  isRecordingProgress.value = true
  try {
    if (!isModuleComplete.value) {
      // @TODO uncomment me when ready.
      // await NetworkService.recordTrainingCourseProgress(
      //   COURSE_KEY,
      //   currentMaterialKey.value
      // )
    }
    currentModuleIndex.value = currentModuleIndex.value + 1
    await scrollToTop()
  } catch (err) {
    // @TODO
  } finally {
    isRecordingProgress.value = false
  }
}

async function previous() {
  currentModuleIndex.value = currentModuleIndex.value - 1
  await scrollToTop()
}

const navigationSteps = computed(() => {
  if (!trainingCourseDefinition.value) return null

  const completedMaterials =
    trainingCourseDefinition.value?.completedMaterials ?? []

  return trainingCourseDefinition.value?.modules.map((module, index) => {
    const materialKey = module.materials[0].materialKey
    const isModuleComplete = completedMaterials.includes(materialKey)
    return {
      name: module.name,
      status: isModuleComplete
        ? 'complete'
        : index === currentModuleIndex.value
          ? 'in-progress'
          : 'not-started',
    } as NavigationStep
  })
})

const overallProgress = computed(() => {
  if (!trainingCourseDefinition.value) {
    return 0
  }
  return Math.floor(
    (trainingCourseDefinition.value.completedMaterials.length /
      trainingCourseDefinition.value.modules.length) *
      100.0
  )
})
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
      />
      <div class="main-content-area">
        <Loader v-if="isRecordingProgress" overlay />
        <TrainingModule
          v-if="simplifiedTrainingModule"
          :module="simplifiedTrainingModule"
        />
      </div>
      <div class="navigation-buttons">
        <LargeButton
          class="previous-button"
          v-if="hasPreviousModule"
          variant="secondary"
          @click="previous"
          :showArrow="true"
          arrowDirection="left"
          >{{ isMobile ? ' ' : 'Previous' }}</LargeButton
        >
        <LargeButton
          :disabled="!hasNextModule"
          variant="primary-blue"
          :showArrow="true"
          @click="next"
          class="next-button"
          >Next</LargeButton
        >
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-container {
  padding: 40px;
  @include breakpoint-below('medium') {
    padding: 10px;
  }
}

.main-grid-container {
  display: grid;

  @include breakpoint-above('medium') {
    grid-template-columns: [main] fit-content(768px) [stepper] 1fr;
    grid-template-rows: [banner] 169px [main-content] auto [navigation-buttons] auto;
  }

  @include breakpoint-below('medium') {
    grid-template-columns: [main] 1fr;
    grid-template-rows: [banner] auto [main-content] auto [navigation-buttons] auto auto;
  }

  grid-row-gap: 2%;
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

  .main-content-area {
    grid-column: main;
    grid-row: main-content;
    display: flex;
    flex-direction: column;
    max-width: 833px;
  }
  .navigation-buttons {
    grid-column: main;
    margin: 16px 5%;
    max-height: 40px;
    justify-content: space-between;

    @include breakpoint-below('medium') {
      grid-row: navigation-buttons;
      column-gap: 10%;
      padding-bottom: 140px;
    }
    display: inline-grid;
    grid-template-rows: 1fr;
    grid-template-columns: [previous-btn] 1fr [next-btn] 1fr;
    column-gap: 20%;

    .previous-button {
      grid-row: 1;
      grid-column: previous-btn;
    }

    .next-button {
      grid-row: 1;
      grid-column: next-btn;
    }
  }
}
</style>
