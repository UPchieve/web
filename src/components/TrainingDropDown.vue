<template>
  <div class="training">
    <template v-if="!isLargeDevice">
      <h3 class="training__header" v-for="header in headers" :key="header">
        {{ header }}
      </h3>
    </template>

    <template v-for="(cert, index) in certData">
      <div
        class="training__cert"
        :key="`cert-title-${cert.displayName}-${index}`"
      >
        <check-mark :checked="isComplete(cert.key)" />
        <div class="training__cert-title">
          <span>{{ cert.displayName }}</span>
          <span
            class="training__status"
            :class="{
              'training__status--progress':
                progressStatus(cert.key) === 'In progress',
              'training__status--completed':
                progressStatus(cert.key) === 'Completed'
            }"
            >{{ progressStatus(cert.key) }}</span
          >
        </div>
      </div>

      <div class="training__progress-bar" :key="`bar-${index}`">
        <div
          class="training__progress-bar--bg"
          :style="{ width: progressBarNumber(cert.key) + '%' }"
        >
          <span
            class="training__progress-bar--number"
            :class="{
              'training__progress-bar--number-center':
                progressBarNumber(cert.key) < 30
            }"
            >{{ progressBarNumber(cert.key) }}%</span
          >
        </div>
      </div>

      <div class="action-btns" :key="`action-btns-${index}`">
        <router-link
          :to="`/training/course/${cert.key}`"
          class="action-btns__review-link"
          v-if="isComplete(cert.key)"
        >
          <span class="action-btns__review-link--text">Review</span>
          <arrow-icon class="action-btns__review-link--arrow-icon" />
        </router-link>

        <large-button
          primary
          :showArrow="false"
          :routeTo="
            !isComplete(cert.key) ? `/training/course/${cert.key}` : null
          "
          class="action-btns__quiz-btn"
          :disabled="isComplete(cert.key)"
        >
          <span>{{ actionButtonText(cert.key) }}</span>
        </large-button>
      </div>

      <div
        :key="`border-${cert.displayName}-${index}`"
        class="training__row-border"
      />
    </template>
  </div>
</template>

<script>
import { mapState } from "vuex";
import CheckMark from "@/components/CheckMark";
import LargeButton from "@/components/LargeButton";
import ArrowIcon from "@/assets/arrow.svg";

export default {
  name: "TrainingDropDown",
  components: {
    CheckMark,
    LargeButton,
    ArrowIcon
  },
  props: {
    headers: {
      type: Array,
      required: true
    },
    certData: {
      type: Array,
      required: true
    },
    trainingCourse: {
      type: Boolean
    }
  },

  computed: {
    ...mapState({
      user: state => state.user.user,
      windowWidth: state => state.app.windowWidth
    }),
    isLargeDevice() {
      const largeScreenBreakpoint = 992;

      return this.windowWidth <= largeScreenBreakpoint;
    }
  },

  methods: {
    isComplete(cert) {
      return this.user.certifications[cert].passed;
    },
    progressStatus(cert) {
      const { progress } = this.user.trainingCourses[cert];
      if (progress === 0) return "Not started";
      if (this.isComplete(cert)) return "Completed";
      return "In progress";
    },
    progressBarNumber(cert) {
      const { progress, isComplete } = this.user.trainingCourses[cert];
      // If user has not completed the course quiz show 99% in the progress bar
      if (isComplete && !this.isComplete(cert)) return 99;
      else return progress;
    },
    actionButtonText(cert) {
      const { progress } = this.user.trainingCourses[cert];
      if (progress === 0) return "Start course";
      if (this.isComplete(cert)) return "Completed";
      return "Resume course";
    }
  }
};
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
