<template>
  <div>
    <modal :backText="''">
      <div v-if="isSubmitting" class="prm">
        <section class="prm__section prm__section--center">
          <upbot class="updog" />
          <loading-message
            class="loading-message"
            :message="'UPbot is analyzing your Reading session'"
          />
          <p class="loading-message-subtitle">
            Please wait, it might take a minute or so.
          </p>
          <p class="prm__body--spacing prm__body--center">
            If you are tired of waiting, you can always access them later in
            "Your Progress" tab when it's ready.
          </p>
          <large-button
            class="prm__buttons-button"
            @click.native="handleCloseModal"
            >View later</large-button
          >
        </section>
      </div>
      <div v-else-if="hasError" class="prm">
        <section class="prm__section prm__section--center">
          <updog-construction class="updog" />
          <p class="prm__body">
            Hey there! 👋 This feature is experimental, and it looks like we
            don't have everything working as we expected quite yet. We're on it
            and making it awesome as we speak!
          </p>
        </section>
        <footer class="prm__footer">
          <div class="prm__buttons prm__buttons--center">
            <large-button @click.native="handleCloseModal">Close</large-button>
          </div>
        </footer>
      </div>
      <div v-else-if="showHaveMoreSessions" class="prm">
        <header class="prm__section--center">
          <cross-icon class="cross-icon" @click="handleCloseModal" />
          <upbot-sad />
          <h1 class="prm__title prm__body--center">
            Sorry, we didn't have enough information to analyze this session.
          </h1>
        </header>
        <section class="prm__section">
          <p class="prm__body--center">
            Try providing more details or extending the session for a more
            thorough review.
          </p>
        </section>
        <footer class="prm__footer">
          <div class="prm__buttons">
            <large-button
              class="prm__buttons-button prm__buttons-button--primary"
              @click.native="handleSessionRequest"
              :showArrow="false"
              primary
            >
              Start a new Reading session
            </large-button>
          </div>
        </footer>
      </div>
      <div v-else-if="showStillGeneratingReport" class="prm">
        <header>
          <updog-construction class="updog--large" />
          <h1 class="prm__title">It's taking longer than usual</h1>
        </header>
        <section class="prm__section prm__section--center">
          <p class="prm__body">
            Hey there! 👋 We're going to continue to try to generate a report
            for you. If we're able to generate a new report, you'll be able to
            find it in the "Your Progress" tab in the sidebar.
          </p>
        </section>
        <footer class="prm__footer">
          <div class="prm__buttons">
            <large-button
              class="prm__buttons-button prm__buttons-button--primary"
              @click.native="handleSessionRequest"
              :showArrow="false"
              primary
            >
              Start a new Reading session
            </large-button>
            <large-button
              class="prm__buttons-button"
              @click.native="handleCloseModal"
              :showArrow="false"
            >
              Close
            </large-button>
          </div>
        </footer>
      </div>
      <div v-else-if="step === 1" class="prm">
        <header>
          <mobile-banner-image v-if="mobileMode" class="prm-banner" />
          <desktop-banner-image v-else class="prm-banner" />
          <h1 class="prm__title">Want to see how you are doing in Reading?</h1>
          <p class="prm__body">
            Our <span class="bolded-text">Reading UPbot (AI Bot)</span> can
            analyze what you're doing well and what you can improve on in your
            reading sessions! You will also be able to see how you are
            progressing after each session!
          </p>
        </header>

        <footer class="prm__footer">
          <div class="prm__buttons">
            <large-button
              class="prm__buttons-button prm__buttons-button--primary"
              @click.native="analyzeSessions"
              primary
              :showArrow="false"
              >Analyze my session</large-button
            >
            <span class="prm__buttons-span" @click="handleCloseModal"
              >Maybe later</span
            >
          </div>
        </footer>
      </div>
      <div v-else-if="step === 2" class="prm prm--flex">
        <div>
          <div class="prm__title--row">
            <p>Session Overview:</p>
            <cross-icon class="cross-icon" @click="handleCloseModal" />
          </div>
          <p class="prm__title prm__title--grade">
            {{ gradeLabel(summary.overallGrade) }}
          </p>
        </div>
        <grade-bars :minimumGrade="0" :grade="summary.overallGrade" />

        <separator v-if="!mobileMode" class="separator" />

        <section class="prm__section">
          <div class="prm__section-bot">
            <upbot v-if="!mobileMode" class="upbot--medium" />
            <div class="prm__overview--strength">
              <p>Great job on finishing your Reading session!</p>
              <p v-if="filteredConceptsToFocusArea('strength').length">
                You did a phenomenal job on tackling
                <span class="bolded-text--light">{{
                  filteredConceptsToFocusArea('strength')[0].name
                }}</span
                >!
              </p>
            </div>
          </div>
          <div>
            <div
              v-if="filteredConceptsToFocusArea('practiceArea').length"
              class="prm__overview"
            >
              <header class="prm__overview-header">
                <h2
                  class="prm__overview-title prm__overview-title--practice prm__overview--bold"
                >
                  Concepts to Practice
                </h2>
              </header>
              <ul
                v-for="concept of filteredConceptsToFocusArea('practiceArea')"
                :key="concept.name"
                class="prm__concept"
              >
                <li class="prm__overview-concept">{{ concept.name }}</li>
              </ul>
              <span
                v-if="!mobileMode"
                class="prm__overview-link"
                @click="showDetailedReport"
              >
                Review my practice areas
              </span>
            </div>
          </div>

          <separator class="separator" />

          <p
            class="prm__overview--subtext prm__overview--subtext-more-sessions"
          >
            <span class="bolded-text">*Tip: </span>The more sessions you have
            the more accurate your report will be.
            <span class="bolded-text--light"
              >Make sure to ask your coach to help you with your practice
              areas.</span
            >
          </p>
        </section>
        <footer class="prm__footer">
          <div class="prm__buttons">
            <large-button
              class="prm__buttons-button prm__buttons-button--primary"
              @click.native="handleSessionRequest()"
              :showArrow="false"
              primary
            >
              Start a new Reading session
            </large-button>
            <span
              v-if="mobileMode"
              class="prm__overview-link"
              @click="showDetailedReport"
            >
              Review my practice areas
            </span>
          </div>
        </footer>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { EVENTS } from '@/consts'
import DesktopBannerImage from '@/assets/progress-report-banner-desktop.svg'
import MobileBannerImage from '@/assets/progress-report-banner-mobile.svg'
import Upbot from '@/assets/upbot.svg'
import UpbotSad from '@/assets/upbot-sad.svg'
import UpdogConstruction from '@/assets/updog-construction.svg'
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import CrossIcon from '@/assets/cross.svg'
import GradeBars from '@/components/GradeBars.vue'
import Separator from '@/components/Separator.vue'
import { gradeLabel } from '@/utils/grades'
import LoadingMessage from '@/components/LoadingMessage.vue'

export default {
  name: 'ProgressReportModal',
  components: {
    Modal,
    LargeButton,
    DesktopBannerImage,
    MobileBannerImage,
    Upbot,
    UpbotSad,
    UpdogConstruction,
    CrossIcon,
    GradeBars,
    Separator,
    LoadingMessage,
  },
  data() {
    return {
      step: 1,
      isSubmitting: false,
      hasError: false,
      showHaveMoreSessions: false,
      showStillGeneratingReport: false,
      report: null,
      timeOutInterval: null,
    }
  },
  mounted() {
    AnalyticsService.captureEvent(EVENTS.PROGRESS_REPORT_MODAL_SHOWN)
    this.$store.dispatch('user/updateHasSeenProgressReportModal', true)
  },
  beforeDestroy() {
    clearInterval(this.timeOutInterval)
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      requestedProgressReportOverview: (state) =>
        state.user.requestedProgressReportOverview,
      latestSession: (state) => state.user.latestSession,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    concepts() {
      return this.report.concepts
    },
    summary() {
      return this.report.summary
    },
  },
  props: {
    closeModal: { required: true, type: Function },
  },
  methods: {
    handleCloseModal() {
      AnalyticsService.captureEvent(EVENTS.PROGRESS_REPORT_MODAL_CLOSED)
      this.closeModal()
    },
    handleSessionRequest() {
      AnalyticsService.captureEvent(
        EVENTS.PROGRESS_REPORT_STUDENT_REQUESTED_HELP
      )
      // Close the modal so that we can have a clear start
      // and end point for our user journey in PostHog from the
      // PROGRESS_REPORT_MODAL_CLOSED event
      this.handleCloseModal()
      this.$router.push('/session/readingWriting/reading/')
    },
    showDetailedReport() {
      AnalyticsService.captureEvent(
        EVENTS.PROGRESS_REPORT_STUDENT_CLICKED_DETAILED_REPORT
      )
      this.$router.push(`/sessions/${this.latestSession.id}/recap`)
    },
    async analyzeSessions() {
      this.isSubmitting = true
      AnalyticsService.captureEvent(
        EVENTS.PROGRESS_REPORT_STUDENT_CLICKED_START_ANALYSIS
      )
      this.$store.dispatch('user/updateRequestedProgressReportOverview', true)

      // This handles the case where a user verifies they want to see the analysis
      // after the socket event is received
      if (this.report) this.handleReport()

      this.timeOutInterval = setTimeout(async () => {
        const response = await NetworkService.getProgressReportForSession(
          this.latestSession.id
        )
        if (response.data.id) {
          this.report = response.data
          this.handleReport()
        } else if (!this.report) {
          this.handleModalTimeout()
        }
      }, 1000 * 60)
    },
    async handleReport() {
      if (this.report.status === 'error') {
        this.hasError = true
        AnalyticsService.captureEvent(EVENTS.PROGRESS_REPORT_ANALYSIS_ERROR)
        this.$store.dispatch(
          'user/updateRequestedProgressReportOverview',
          false
        )
      } else if (
        this.report.status === 'pending' ||
        this.report.status === 'processing'
      ) {
        this.handleModalTimeout()
      } else if (!Object.keys(this.summary).length || !this.concepts.length) {
        this.showHaveMoreSessions = true
        AnalyticsService.captureEvent(EVENTS.PROGRESS_REPORT_NO_ANALYSIS)
        this.$store.dispatch(
          'user/updateRequestedProgressReportOverview',
          false
        )
      } else {
        AnalyticsService.captureEvent(EVENTS.PROGRESS_REPORT_ANALYSIS_SHOWN)
        this.step = 2
        this.$store.dispatch('user/updateProgressReportsReadStatus', [
          this.report.id,
        ])
      }

      this.isSubmitting = false
    },
    getGrade(grade) {
      if (grade < 65) return 1
      return Math.floor((grade - 65) / 10) + 1
    },
    displayGrade(gradeNumber) {
      const grade = this.getGrade(gradeNumber)
      return `${grade}/5`
    },
    filteredConceptsToFocusArea(focusArea) {
      const includedConceptNames = new Set()
      return this.concepts.filter((concept) => {
        if (
          !includedConceptNames.has(concept.name) &&
          concept.details.some((detail) => detail.focusArea === focusArea)
        ) {
          includedConceptNames.add(concept.name)
          return true
        }
        return false
      })
    },
    filteredFocusAreasToInfoType(concept, infoType) {
      return concept.details.filter((detail) => detail.infoType === infoType)
    },
    gradeLabel(grade) {
      return gradeLabel(grade)
    },
    handleModalTimeout() {
      this.showStillGeneratingReport = true
      this.isSubmitting = false
      AnalyticsService.captureEvent(
        EVENTS.PROGRESS_REPORT_STUDENT_MODAL_TIMED_OUT
      )
    },
  },
  sockets: {
    'progress-report:processed:session'(data) {
      this.report = data.report
      if (this.requestedProgressReportOverview) this.handleReport()
    },
  },
}
</script>

<style lang="scss">
.upc-modal-form {
  border-radius: 1.5em;
}
</style>

<style lang="scss" scoped>
p {
  margin-bottom: 0;
}

.separator {
  margin-top: 1em;
}
.prm {
  text-align: initial;

  &__title {
    font-size: 22px;
    font-weight: 600;
    margin-top: 1em;
    margin-bottom: 0.8em;

    &-header {
      @include flex-container(row, space-between, center);
    }

    &--center {
      text-align: center;
    }

    &--row {
      @include flex-container(row, space-between, center);
    }

    &--grade {
      margin-top: initial;
      margin-bottom: 0.25em;
    }
  }

  &__subtitle {
    @include font-category('display-small');
    margin-bottom: 0.5em;
    margin-top: 1em;
  }

  &__section--center {
    @include flex-container(column, center, center);
  }

  &__section {
    &-bot {
      @include flex-container(row, space-between, center);
    }
  }

  &__body {
    @include font-category('heading');
    margin-bottom: 0.5em;
    margin-top: 1em;

    &--bold {
      font-weight: 600;
    }

    &--center {
      text-align: center;
    }

    &--spacing {
      margin-bottom: 1em;
    }
  }

  &__buttons {
    @include flex-container(column, center, center);
    margin: 1.6em 0 0.4em 0;

    &-span {
      text-align: center;
      font-weight: 500;
      &:hover {
        cursor: pointer;
      }
    }

    &-button {
      width: 100%;
      margin-bottom: 0.8em;

      @include breakpoint-above('small') {
        min-width: 50%;
        max-width: 60%;
      }

      &--wide {
        width: 300px;
      }

      &--primary,
      &--single {
        background-color: $c-information-blue;
        &:hover {
          background: darken($c-information-blue, 5%);

          &:disabled {
            background: $c-background-grey;
          }
        }
      }

      &--single {
        margin-right: auto !important;
      }
    }

    &--secondary {
      @include flex-container(row, flex-end, center);
      & button {
        margin: initial;
      }
    }

    &--center {
      @include flex-container(row, center);
    }
  }

  &__overview-container {
    width: 90%;
    margin: 0 auto;

    @include breakpoint-above('small') {
      width: 90%;
      margin-top: 1em;
    }
  }

  &__overview {
    &-header {
      @include flex-container(row, space-between, center);
      margin-top: 1em;

      @include breakpoint-above('tiny') {
        margin-top: initial;
      }
    }

    &-title {
      @include font-category('subheading');
    }

    &-title--practice {
      @include font-category('subheading');
      background-color: lighten($upchieve-green, $amount: 17%);
      width: 100%;
      padding: 0.4em;
    }

    &--bold {
      font-weight: 600;
    }

    &-concept {
      @include font-category('body');
      margin: 0;
      font-weight: 500;
    }

    &-link {
      @include font-category('body');
      margin: 0;
      font-weight: 500;
      &:hover {
        cursor: pointer;
      }

      @include breakpoint-above('medium') {
        margin-left: 2.5em;
        color: $c-information-blue;
        border-bottom: 1px solid $c-information-blue;
      }
    }

    &--subtext {
      @include font-category('helper-text');
      margin-top: 1em;

      &-more-sessions {
        padding: 0em 2em;
      }
    }

    &--strength {
      margin-left: 1em;
      margin-top: 1em;
      margin-bottom: 1em;

      @include breakpoint-above('medium') {
        margin-top: initial;
        margin-bottom: initial;
      }
    }
  }

  &__practice-area {
    &-header {
      @include flex-container(row, space-between, center);
    }

    &-grade {
      font-size: 22px;
    }
  }

  &__concept {
    margin: 0.5em 0;

    &-header {
      @include flex-container(column, center, initial);
      @include breakpoint-above('small') {
        @include flex-container(row, space-between, center);
      }
    }

    &-name {
      font-weight: 600;
    }

    &-scores {
      @include flex-container(row, initial, center);
      &--score {
        margin-right: 0.2em;
        font-weight: 600;
      }
    }

    &-recommendations {
      margin-top: 0.4em;
      @include breakpoint-above('medium') {
        margin-top: initial;
      }

      &--recommendation {
        color: $c-secondary-grey;
      }
    }
  }

  &--flex {
    @include flex-container(column);
  }
}

.prm-banner {
  width: 100%;
  height: 100%;
}
.error {
  color: $c-error-red;
  margin: 1em 0;
}

.updog {
  width: 120px;
  height: 120px;

  &--large {
    display: block;
    width: 200px;
    height: 200px;
    margin: 0 auto;
  }
}

.loading-message {
  font-size: 22px;
  text-align: center;
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0;

  &-subtitle {
    margin-bottom: 0.8em;
  }
}

.cross-icon {
  width: 18px;
  margin-right: 1em;
  margin-left: auto;

  &:hover {
    cursor: pointer;
  }

  @include breakpoint-above('medium') {
    margin-bottom: initial;
    margin-right: initial;
    margin-left: auto;
  }
}

.upbot--medium {
  width: 75px;
}

.bolded-text {
  font-weight: 600;

  &--light {
    font-weight: 500;
  }
}
</style>
