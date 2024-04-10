<template>
  <div class="progress-reports">
    <section class="progress-reports__header">
      <h1 class="progress-reports__header-title">My Progress</h1>
      <div class="progress-reports__header-information">
        <information-icon
          class="progress-reports__header-information--icon"
          @mouseover="showMoreInfo = true"
          @mouseleave="showMoreInfo = false"
          @click="showMoreInfo = true"
        />
        <div
          v-if="showMoreInfo"
          class="progress-reports__header-information--text"
        >
          Our
          <span class="progress-reports__header-information--text-bold"
            >UPbot (AI Bot)</span
          >
          can analyze what you're doing well and what you can improve on in your
          sessions! You will also be able to see how you are progressing after
          each session! Start a session and check it out!
        </div>
      </div>
    </section>

    <section class="progress-reports__no-results-container">
      <updog-open-arms class="progress-reports__no-results-icon" />
      <h1 class="progress-reports__no-results-title">
        No Progress Report Yet!
      </h1>

      <p class="progress-reports__no-results-text">
        Begin your first Reading session to unlock progress report.
      </p>

      <large-button
        class="progress-reports__no-results-start-session-btn"
        @click.native="routeToSessionRequest"
        :showArrow="false"
      >
        Start a new Reading session
      </large-button>
    </section>

    <section class="progress-reports__faq">
      <h2 class="progress-reports__faq-header">FAQs</h2>
      <h3 class="progress-reports__faq-question">What is "My Progress"?</h3>
      <p class="progress-reports__faq-answer">
        Our UPbot (AI-bot) can analyze what you're doing well and what you can
        improve on in your sessions! You will also be able to see how you are
        progressing after each session! Start a session and check it out!
      </p>

      <h3 class="progress-reports__faq-question">
        What about the other subjects?
      </h3>
      <p class="progress-reports__faq-answer">
        We are currently working hard to expand our coverage, some subjects
        might not have progress reports yet but doesn't mean that it won't be
        available soon!
      </p>
    </section>
  </div>
</template>

<script>
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import InformationIcon from '@/assets/information.svg'
import UpdogOpenArms from '@/assets/updog-open-arms.svg'
import { EVENTS } from '@/consts'

export default {
  name: 'progress-reports-overview',
  components: {
    InformationIcon,
    UpdogOpenArms,
    LargeButton,
  },
  data() {
    return {
      showMoreInfo: false,
    }
  },
  async mounted() {
    AnalyticsService.captureEvent(EVENTS.PROGRESS_REPORT_OVERVIEW_OPENED)
  },
  methods: {
    routeToSessionRequest() {
      AnalyticsService.captureEvent(
        EVENTS.PROGRESS_REPORT_OVERVIEW_STUDENT_REQUESTED_SESSION
      )
      this.$router.push(`/session/readingWriting/reading/`)
    },
  },
}
</script>

<style lang="scss" scoped>
.progress-reports {
  max-width: 1800px;
  padding: 1em;
  width: 100%;

  &__header {
    padding-left: 2em;
    @include flex-container(row, initial, center);

    @include breakpoint-above('small') {
      @include flex-container(row, initial, center);
    }

    &-title {
      @include font-category('display-small');
      margin-bottom: 0;
    }

    &-information {
      position: relative;
      @include flex-container(column, center);

      &--text {
        position: absolute;
        background-color: $upchieve-white;
        padding: 1.6em;
        width: 260px;
        z-index: 10;
        border-radius: 18px;
        font-size: 14px;
        left: -180px;
        top: 30px;
        border: 1px solid $c-border-grey;

        @include breakpoint-above('small') {
          width: 300px;
          left: -20px;
          top: 30px;
        }

        @include breakpoint-above('small') {
          width: 400px;
        }

        &-bold {
          font-weight: 600;
        }
      }

      &--icon {
        margin-left: 1em;
        height: 20px;
        width: 20px;

        &:hover {
          cursor: pointer;
        }
      }
    }
  }

  &__no-results {
    &-container {
      margin-top: 4em;
      @include flex-container(column, center, center);
    }

    &-icon {
      width: 200px;
    }

    &-title {
      font-size: 32px;
      margin-top: 1em;
      margin-left: 1em;
      margin-right: 1em;
    }

    &-text {
      font-size: 20px;
      margin: 0.4em 1em;
    }

    &-start-session-btn {
      background-color: $c-information-blue;
      color: $upchieve-white;
      font-size: 14px;
      margin-top: 1em;
      margin-bottom: 4em;

      &:hover {
        background: darken($c-information-blue, 5%);
      }
    }
  }

  &__faq {
    background-color: $upchieve-white;
    border-radius: 12px;
    padding: 2em;
    margin: 0 auto;
    width: 100%;

    @include breakpoint-above('small') {
      width: 90%;
    }

    &-content {
      margin-top: 1em;
    }

    &-header {
      font-size: 20px;
      font-weight: 600;
    }

    &-question {
      margin-top: 1em;
      font-size: 20px;
    }

    &-answer {
      @include font-category('body');
      padding-left: 2.5em;
    }
  }
}

.updog {
  height: 200px;
}
</style>
