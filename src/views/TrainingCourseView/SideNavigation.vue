<script lang="ts" setup>
import StepCompleteIcon from '@/assets/check-circled.svg'
import StepNotStartedIcon from '@/assets/whiteboard_icons/circle.svg'
import StepHalfInProgressIcon from '@/assets/half_filled_circle.svg'
import LockedKnowledgeCheck from '@/assets/lock_circle.svg'
import CaretIcon from '@/assets/right-caret.svg'
import { computed, ref, watch } from 'vue'
import ContinuousProgressBar from '@/views/TrainingCourseView/ContinuousProgressBar.vue'
import type { StepType } from './index.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export type StepStatus = 'complete' | 'started' | 'not-started'
export type NavigationStep = {
  name: string
  status: StepStatus
  currentStepIndex: number
  hasKnowledgeCheck: boolean
}

const emit = defineEmits<{
  'navigate-to-step': [index: number]
}>()

const {
  steps,
  drawerMode = false,
  overallProgress,
  currentStepIndex,
} = defineProps<{
  steps: NavigationStep[]
  drawerMode: boolean
  overallProgress: number // 0-100 please
  currentStepType: StepType
  currentStepIndex: number
}>()

function toggleExpand() {
  didClickToExpand.value = !didClickToExpand.value
}

function clickStep(index: number) {
  AnalyticsService.captureEvent(EVENTS.TRAINING_JUMPED_TO_MODULE, {
    currentModule: steps[currentStepIndex].name,
    targetModule: steps[index].name,
  })
  emit('navigate-to-step', index)
  if (drawerMode) {
    didClickToExpand.value = false
  }
}

// Drawer logic
const didClickToExpand = ref<boolean>(false)
const isExpanded = computed(() => {
  // When the prop drawerMode is true, the SideNavigation is a bottom drawer that shows overall progress
  // and can be expanded to show each step.
  if (!drawerMode) return false
  return didClickToExpand.value
})

watch(isExpanded, (value) => {
  if (!value) {
    // Lock scrolling when not expanded
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <div
    class="main-navigation-container"
    :class="{
      expanded: isExpanded,
      collapsed: !isExpanded,
    }"
  >
    <!--    Overall progress-->
    <div class="overall-progress-container">
      <div class="progress-info-container">
        <span class="training-title">UPCHIEVE TRAINING</span>
        <ContinuousProgressBar
          :percentProgress="overallProgress"
          :showPercentLabel="true"
        />
      </div>
      <button
        v-if="drawerMode"
        @click="toggleExpand"
        class="expand-collapse-button"
        type="button"
      >
        <CaretIcon
          class="expand-icon"
          :class="{
            'expand-icon-collapsed': !isExpanded,
            'expand-icon-expanded': isExpanded,
          }"
        />
      </button>
    </div>

    <!--    Individual steps' progress-->
    <div v-show="!drawerMode || isExpanded">
      <button
        class="step-container"
        :class="{ 'current-step': index === currentStepIndex }"
        v-for="(step, index) in steps"
        :key="step.name"
        @click="clickStep(index)"
        type="button"
      >
        <div class="step-name-container">
          {{ step.name }}
        </div>
        <div class="status-icon-container">
          <StepHalfInProgressIcon
            v-if="step.status === 'started'"
            class="status-icon"
          />
          <StepCompleteIcon
            v-else-if="step.status === 'complete'"
            class="status-icon"
          />
          <StepNotStartedIcon v-else class="status-icon" />
        </div>

        <div
          v-if="step.hasKnowledgeCheck && index === currentStepIndex"
          class="knowledge-check-container"
        >
          <span
            :class="
              currentStepType === 'viewMaterials'
                ? 'disabled-knowledge-check'
                : 'knowledge-check'
            "
          >
            Knowledge check
          </span>
        </div>
        <div
          v-if="step.hasKnowledgeCheck && index === currentStepIndex"
          class="status-icon-container"
        >
          <StepCompleteIcon
            class="status-icon"
            v-if="
              currentStepType === 'viewQuizResultsPassed' ||
              step.status === 'complete'
            "
          />
          <LockedKnowledgeCheck
            v-if="
              (currentStepType === 'viewMaterials' &&
                step.status !== 'complete') ||
              currentStepType === 'viewQuizResultsFailed'
            "
          />
          <StepHalfInProgressIcon
            class="status-icon"
            v-if="currentStepType === 'takeQuiz'"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.overall-progress-container {
  border-bottom: 1px solid $c-border-grey;
  padding-left: 12px;
  padding-right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 0 8px 0 0;
  width: 100%;

  @media screen and (max-width: 1372px) {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
  }
}

.progress-info-container {
  width: 100%;
  padding: 24px 22px;

  .training-title {
    color: $c-hover-green;
    font-size: 14px;
    font-weight: 500;
  }
}

.expand-collapse-button {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-navigation-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
  position: static;
  border-radius: 0 8px 0 0;
  background-color: $c-background-grey;
  max-width: 100%;

  @media screen and (max-width: 1372px) {
    background-color: white;
    box-shadow: 0 -4px 8px 0 rgba(0, 0, 0, 0.08);
    height: 80%;
    position: fixed;
    z-index: 2;
    width: 100%;

    &.collapsed {
      transform: translateY(calc(100% - 93px));
      height: 93px;
    }

    &.expanded {
      transform: translateY(0%);
      overflow-y: scroll;
    }
  }
}

.step-container {
  border-top: 1px solid $c-border-grey;
  &:first-child {
    border-top: none;
  }
  &:last-child {
    border-bottom: 1px solid $c-border-grey;
  }
  padding: 12px;
  display: inline-grid;
  grid-template-rows: 1fr;
  grid-template-columns: [step-name] 4fr [status-icon] 1fr;
  width: 100%;
  align-items: center;
  background-color: $c-background-grey;

  @media screen and (max-width: 1372px) {
    background-color: white;
  }
}

.step-name-container {
  margin-right: 12px;
  padding-left: 12px;
  padding-right: 12px;
  grid-row: 1;
  grid-column: step-name;
  text-align: left;
}

.step-icon {
  width: 20px;
  height: 20px;
}

.expand-icon {
  height: 16px;
  width: 16px;
}

.expand-icon-collapsed {
  transform: rotate(-90deg);
}

.expand-icon-expanded {
  transform: rotate(90deg);
  transition: 200ms linear;
}

.status-icon-container {
  display: flex;
  justify-content: center;
  grid-column: status-icon;
  height: 100%;
  align-items: center;
}

.status-icon {
  height: 16px;
  width: 16px;
}

.knowledge-check-container {
  padding: 0 20px;
  width: 100%;
  align-items: center;
  text-align: left;
  margin: 16px 0;
}

.disabled-knowledge-check {
  color: $c-secondary-grey;
}

.knowledge-check,
.disabled-knowledge-check {
  font-size: 14px;
  grid-column: step-name;
}

.current-step {
  font-weight: 500;
  background-color: darken($c-background-grey, 5%);
}
</style>
