<template>
  <div class="training">
    <template v-if="!isLargeDevice">
      <h3 class="training__header" v-for="header in headers" :key="header">
        {{ header }}
      </h3>
    </template>

    <div class="training__cert">
      <check-mark :checked="isComplete" />
      <div class="training__cert-title">
        <span>{{ trainingCourseData.name }}</span>
        <span
          class="training__status"
          :class="{
            'training__status--progress': progressStatus === 'In progress',
            'training__status--completed': progressStatus === 'Completed',
          }"
          >{{ progressStatus }}</span
        >
      </div>
    </div>

    <div class="training__progress-bar">
      <div
        class="training__progress-bar--bg"
        :style="{ width: progressBarNumber + '%' }"
      >
        <span
          class="training__progress-bar--number"
          :class="{
            'training__progress-bar--number-center': progressBarNumber < 30,
          }"
          >{{ progressBarNumber }}%</span
        >
      </div>
    </div>

    <div class="action-btns">
      <router-link
        :to="`/training/course/${trainingCourseData.courseKey}`"
        class="action-btns__review-link"
        v-if="isComplete"
      >
        <span class="action-btns__review-link--text">Review</span>
        <arrow-icon class="action-btns__review-link--arrow-icon" />
      </router-link>

      <large-button
        primary
        :showArrow="false"
        :routeTo="
          !isComplete
            ? `/training/course/${trainingCourseData.courseKey}`
            : null
        "
        class="action-btns__quiz-btn"
        :disabled="isComplete"
      >
        <span>{{ actionButtonText }}</span>
      </large-button>
    </div>

    <div class="training__row-border" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import CheckMark from '@/components/CheckMark.vue'
import LargeButton from '@/components/LargeButton.vue'
import { getTrainingProgress } from '@/utils/get-training-progress'

export default {
  name: 'TrainingDropDown',
  components: {
    CheckMark,
    LargeButton,
  },
  props: {
    headers: {
      type: Array,
      required: true,
    },
    trainingCourseData: {
      type: Object,
      required: true,
    },
  },

  computed: {
    ...mapState({
      user: (state) => state.user.user,
      windowWidth: (state) => state.app.windowWidth,
    }),
    progressStatus() {
      const progress = getTrainingProgress(
        this.trainingCourseData,
        this.trainingCourseData.completedMaterials ?? []
      )
      if (progress === 0) return 'Not started'
      if (this.isComplete) return 'Completed'
      return 'In progress'
    },
    progressBarNumber() {
      return getTrainingProgress(
        this.trainingCourseData,
        this.trainingCourseData.completedMaterials
      )
    },
    isComplete() {
      return this.trainingCourseData.isComplete
    },
    isLargeDevice() {
      const largeScreenBreakpoint = 992

      return this.windowWidth <= largeScreenBreakpoint
    },
    actionButtonText() {
      if (this.progressStatus === 'Not started') return 'Start course'
      if (this.progressStatus === 'In progress') return 'Resume course'
      return 'Completed'
    },
  },
}
</script>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.alert-icon {
  margin-left: 0.5em;
}
</style>
