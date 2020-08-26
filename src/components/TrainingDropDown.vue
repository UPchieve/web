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
        <alert-icon
          v-if="trainingCourse && !isComplete(cert.key)"
          class="alert-icon"
        />
      </div>

      <div
        v-if="trainingCourse"
        class="training__progress-bar"
        :key="`bar-${index}`"
      >
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

      <div
        v-else
        :key="`subjects-${cert.displayName}-${index}`"
        class="training__subjects-included"
      >
        <span v-if="isLargeDevice" class="training__subjects-included--mobile"
          >Included subjects:</span
        >
        <span
          v-for="subject in cert.subjectsIncluded"
          :key="subject.displayName"
          class="training__subjects-included--subject"
          :class="{
            'training__subjects-included--completed': isComplete(subject.key)
          }"
          >{{ subject.displayName }}</span
        >
      </div>

      <div
        class="action-btns"
        :key="`action-btns-${index}`"
        v-if="headers[2] !== ''"
      >
        <router-link
          :to="getCertReviewLink(cert.key)"
          class="action-btns__review-link"
          v-if="showReviewLink(cert.key)"
        >
          <span class="action-btns__review-link--text">Review</span>
          <arrow-icon class="action-btns__review-link--arrow-icon" />
        </router-link>

        <large-button
          primary
          :showArrow="false"
          :routeTo="!isComplete(cert.key) ? getQuizLink(cert.key) : null"
          class="action-btns__quiz-btn"
          :disabled="isComplete(cert.key)"
        >
          <span>{{ actionButtonText(cert.key) }}</span>
        </large-button>
      </div>

      <div v-else :key="`empty-${index}`" />
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
import AlertIcon from "@/assets/alert.svg";

export default {
  name: "TrainingDropDown",
  components: {
    CheckMark,
    LargeButton,
    ArrowIcon,
    AlertIcon
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
    getQuizLink(cert) {
      if (this.trainingCourse) return `/training/course/${cert}`;
      return `/training/${cert}/quiz`;
    },
    getCertReviewLink(cert) {
      if (this.trainingCourse) return `/training/course/${cert}`;
      return `/training/review/${cert}`;
    },
    getTrainingCourseLink(cert) {
      return `/training/course/${cert}`;
    },
    showReviewLink(cert) {
      if (this.trainingCourse) {
        return this.user.certifications[cert].passed;
      }
      return true;
    },
    isComplete(cert) {
      if (this.trainingCourse) {
        return this.user.certifications[cert].passed;
      }
      return this.user.subjects.includes(cert);
    },
    progressStatus(cert) {
      if (this.trainingCourse) {
        const { progress } = this.user.trainingCourses[cert];
        if (progress === 0) return "Not started";
        if (this.user.certifications[cert].passed) return "Completed";
        return "In progress";
      }

      if (this.user.subjects.includes(cert)) return "Completed";
      else return "Not started";
    },
    actionButtonText(cert) {
      if (this.trainingCourse) {
        const { progress } = this.user.trainingCourses[cert];
        if (progress === 0) return "Start course";
        if (this.user.certifications[cert].passed) return "Complete";
        return "Resume course";
      }

      if (this.user.subjects.includes(cert)) return "Complete";
      else return "Start quiz";
    },
    progressBarNumber(cert) {
      const { progress, isComplete } = this.user.trainingCourses[cert];
      // If user has not completed the course quiz show 99% in the progress bar
      if (isComplete && !this.user.certifications[cert].passed) return 99;
      else return progress;
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

.training {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-row-gap: 2ch;

  @include breakpoint-above("large") {
    grid-template-columns: 0.6fr 1fr 0.8fr;
    overflow-y: scroll;
  }

  @include breakpoint-above("huge") {
    grid-template-columns: 1fr 1fr 1fr;
    overflow-y: auto;
  }

  &__header {
    @include font-category("subheading");
    text-transform: uppercase;
    background-color: $c-backdrop;
    padding: 0.4em;

    &:first-child {
      text-align: left;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
      padding-left: 3em;
    }

    &:last-child {
      padding-right: 2em;
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }
  }

  &__progress-bar {
    width: 100%;
    border: none;
    border-radius: 10rem;
    height: 20px;
    grid-column-start: span 3;
    position: relative;
    background-color: $c-background-grey;

    &--bg {
      width: 100%;
      background-color: $c-success-green;
      height: 100%;
      border-radius: 10rem;
    }

    &--number {
      color: white;
    }

    &--number-center {
      position: absolute;
      left: 0;
      right: 0;
      color: $c-soft-black;
    }

    @include breakpoint-above("small") {
      width: 50%;
    }

    @include breakpoint-above("large") {
      width: 90%;
      align-self: center;
      justify-self: center;
      grid-column-start: auto;
    }

    @include breakpoint-above("huge") {
      width: 70%;
    }
  }

  &__cert {
    @include flex-container(row, flex-start, center);
    align-self: center;
    text-align: left;
    grid-column-start: span 3;

    @include breakpoint-above("large") {
      grid-column-start: auto;
    }
    @include breakpoint-above("large") {
      padding-left: 3em;
    }

    &-title {
      @include flex-container(column, flex-start, flex-start);
      margin-left: 2em;

      @include breakpoint-above("large") {
        width: 100px;
      }
      @include breakpoint-above("huge") {
        min-width: 120px;
      }
    }
  }

  &__row-border {
    grid-column-start: span 3;
    background-color: $c-background-grey;
    height: 2px;

    &:last-child {
      display: none;
    }
  }

  &__subjects-included {
    @include flex-container(row, flex-start, center);
    grid-column-start: span 3;
    flex-flow: row wrap;

    @include breakpoint-above("large") {
      @include flex-container(column, center, center);
      height: auto;
      flex-flow: column wrap;
      margin: 0 auto;
      width: 80%;
      grid-column-start: auto;
    }

    @include breakpoint-above("huge") {
      @include flex-container(column, center, center);
      height: 70px;
    }

    &--subject {
      font-size: 12px;
      color: $c-secondary-grey;
      display: inline-block;
      margin-right: 1em;
    }

    &--completed {
      color: $c-soft-black;
    }

    &--mobile {
      display: inline-block;
      margin-right: 1em;
      font-size: 12px;
    }
  }

  &__status {
    color: $c-secondary-grey;

    &--progress {
      color: $c-warning-orange;
    }

    &--completed {
      color: $c-success-green;
    }

    &--error {
      color: $c-error-red;
    }
  }
}

.action-btns {
  @include flex-container(row, flex-start, center);
  grid-column-start: span 3;

  @include breakpoint-above("large") {
    justify-content: center;
    align-items: center;
    align-self: center;
    justify-self: center;
    grid-column-start: auto;
  }

  @media only screen and (min-width: 992px) and (max-width: 1280px) {
    display: initial;
  }

  &__quiz-btn {
    width: 180px;
  }

  &__review-link {
    @include flex-container(row, flex-start, center);
    color: $c-success-green;
    margin-right: 1.5em;
    align-self: start;

    &--text {
      margin-right: 0.4em;
    }

    &--arrow-icon {
      width: 20px;
      fill: $c-success-green;
    }
    &:hover {
      color: $c-secondary-grey;
    }

    &:hover &--arrow-icon {
      fill: $c-secondary-grey;
    }
  }
}

.alert-icon {
  margin-left: 0.5em;
}
</style>
