<script lang="ts" setup>
import StepCompleteIcon from '@/assets/check-circled.svg'
import StepNotStartedIcon from '@/assets/whiteboard_icons/circle.svg'
import StepInProgressIcon from '@/assets/filled_circle.svg'
import CaretIcon from '@/assets/right-caret.svg'
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import ContinuousProgressBar from '@/views/UpchieveTrainingView/ContinuousProgressBar.vue'

export type NavigationStep = {
  name: string
  status: 'complete' | 'in-progress' | 'not-started'
}

const props = defineProps<{
  steps: NavigationStep[] | null // @TODO: Show loader while null.
  overallProgress: number // 0-100 please
}>()

const store = useStore()
const isMobile = computed(() => store.getters['app/mobileMode'])

function toggleExpand() {
  didClickToExpand.value = !didClickToExpand.value
}

// Mobile mode: drawer logic
const didClickToExpand = ref<boolean>(false)
const isExpanded = computed(() => {
  // On mobile views only, the SideNavigation is a bottom drawer that shows overall progress
  // and can be expanded to show each step.
  if (!isMobile.value) return false
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
        v-if="isMobile"
        @click="toggleExpand"
        class="expand-collapse-button"
      >
        <CaretIcon
          :class="{
            'expand-icon': true,
            'expand-icon-collapsed': !isExpanded,
            'expand-icon-expanded': isExpanded,
          }"
        />
      </button>
    </div>

    <!--    Individual steps' progress-->
    <div v-show="!isMobile || isExpanded">
      <div class="step-container" v-for="step in props.steps" :key="step.name">
        <div class="step-name-container">
          {{ step.name }}
        </div>
        <div class="status-icon-container">
          <StepInProgressIcon
            v-if="step.status === 'in-progress'"
            class="status-icon status-icon-in-progress"
          />
          <StepCompleteIcon
            v-else-if="step.status === 'complete'"
            class="status-icon status-icon-complete"
          />
          <StepNotStartedIcon
            v-else
            class="status-icon status-icon-not-started"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.overall-progress-container {
  border-top: 1px solid $c-border-grey;
  border-left: 1px solid $c-border-grey;
  border-right: 1px solid $c-border-grey;
  width: 100%;
  padding-left: 5%;
  padding-right: 5%;
  @include breakpoint-above('medium') {
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 0 8px 0 0;
  }

  @include breakpoint-below('medium') {
    display: flex;
    flex-direction: row;
    align-items: center;
    &:hover {
      cursor: pointer;
    }
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

  @include breakpoint-above('medium') {
    max-width: 277px;
    position: static;
    border-radius: 0 8px 0 0;
    background-color: $c-background-grey;
  }

  @include breakpoint-below('medium') {
    background-color: white;
    box-shadow: 0 -4px 8px 0 rgba(0, 0, 0, 0.08);
    height: 80%;
    bottom: 0;
    left: 0;
    position: fixed;
    z-index: 2;

    &.collapsed {
      transform: translateY(calc(100% - 93px));
      height: 93px;
    }

    &.expanded {
      transform: translateY(0%);
    }
  }
}

.step-container {
  border-top: 1px solid $c-border-grey;
  border-left: 1px solid $c-border-grey;
  border-right: 1px solid $c-border-grey;
  &:last-child {
    border-bottom: 1px solid $c-border-grey;
  }
  padding: 12px;
  display: inline-grid;
  grid-template-rows: 1fr;
  grid-template-columns: [step-name] 4fr [status-icon] 1fr;
  width: 100%;
  align-items: center;

  @include breakpoint-above('medium') {
    background-color: $c-background-grey;
  }
  @include breakpoint-below('medium') {
    background-color: white;
  }
}

.step-name-container {
  margin-right: auto;
  padding-left: 5%;
  padding-right: 5%;
  grid-row: 1;
  grid-column: step-name;
}

.step-icon-container {
  grid-row: 1;
  grid-column: status-icon;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
</style>
