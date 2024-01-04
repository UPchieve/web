<template>
  <div>
    <modal :backText="''">
      <div v-if="isSubmitting" class="prm">
        <section class="prm__section prm__section--center">
          <upbot class="updog" />
          <p class="loading-message">
            UPbot is analyzing your reading score, it might take a minute or
            so....
          </p>
          <large-button @click.native="handleCloseModal">Dismiss</large-button>
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
        <header>
          <banner-image class="prm-banner" />
          <h1 class="prm__title">
            We're almost there for your report
          </h1>
        </header>
        <section class="prm__section prm__section--center">
          <p class="prm__body">
            Looks like we need a bit more data from your Reading tutoring
            sessions to whip up a solid report. The more sessions you dive into,
            the better we can predict your future success!
          </p>
        </section>
        <footer class="prm__footer">
          <div class="prm__buttons prm__buttons--center">
            <large-button
              class="prm__buttons-button"
              @click.native="handleCloseModal"
              :showArrow="false"
            >
              Close
            </large-button>
            <large-button
              class="prm__buttons-button  prm__buttons-button--single"
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
          <banner-image class="prm-banner" />
          <h1 class="prm__title">
            It's taking longer than usual
          </h1>
        </header>
        <section class="prm__section prm__section--center">
          <p class="prm__body">
            Hey there! 👋 We're going to continue to try to generate a report
            for you. If we're able to generate a new report, you'll be able to
            find it in the "Your Progress" tab in the sidebar.
          </p>
        </section>
        <footer class="prm__footer">
          <div class="prm__buttons prm__buttons--center">
            <large-button
              class="prm__buttons-button"
              @click.native="handleCloseModal"
              :showArrow="false"
            >
              Close
            </large-button>
            <large-button
              class="prm__buttons-button  prm__buttons-button--single"
              @click.native="handleSessionRequest"
              :showArrow="false"
              primary
            >
              Start a new Reading session
            </large-button>
          </div>
        </footer>
      </div>
      <div v-else-if="step === 1" class="prm">
        <header>
          <banner-image class="prm-banner" />
          <h1 class="prm__title">
            Want a forecast of your reading scores?
          </h1>
          <p class="prm__body">
            Based on your reading tutoring sessions, we'll make a report for
            you. It guesses how well you'll do on future English quizzes or
            tests, and shows what you're doing well and what to improve.
          </p>
          <p class="prm__body--helper">
            This is a new experimental feature. We might not get it right the
            first time!
          </p>
        </header>

        <footer class="prm__footer">
          <div class="prm__buttons">
            <large-button
              class="prm__buttons-button"
              @click.native="handleCloseModal"
              >No, thanks</large-button
            >
            <large-button
              class="prm__buttons-button prm__buttons-button--primary"
              @click.native="analyzeSessions"
              primary
              :showArrow="false"
              >Analyze my sessions</large-button
            >
          </div>
        </footer>
      </div>
      <div v-else-if="step === 2" class="prm prm--flex">
        <cross-icon class="cross-icon" @click="handleCloseModal" />
        <header>
          <h1 class="prm__title prm__title-header">
            <span>Test Score Forecast</span>
            <span>{{ summary.overallGrade }}%</span>
          </h1>
        </header>

        <section class="prm__section">
          <p class="prm__body">
            Based on your Reading tutoring sessions, our UPbot created a special
            report for you.
          </p>
          <div class="prm__overview-container">
            <div
              v-if="filteredConceptsToFocusArea('strength').length"
              class="prm__overview"
            >
              <header class="prm__overview-header">
                <h2 class="prm__overview-title prm__overview--bold">
                  Strengths
                </h2>
              </header>
              <div
                v-for="concept of filteredConceptsToFocusArea('strength')"
                :key="concept.name"
                class="prm__concept"
              >
                <p class="prm__overview-concept">{{ concept.name }}</p>
              </div>
            </div>
            <div
              v-if="filteredConceptsToFocusArea('practiceArea').length"
              class="prm__overview"
            >
              <header class="prm__overview-header">
                <h2 class="prm__overview-title prm__overview--bold">
                  Practice Areas
                </h2>
              </header>
              <div
                v-for="concept of filteredConceptsToFocusArea('practiceArea')"
                :key="concept.name"
                class="prm__concept"
              >
                <p class="prm__overview-concept">{{ concept.name }}</p>
              </div>
              <span class="prm__overview-link" @click="showDetailedReport">
                See more practice areas
              </span>
            </div>
            <p class="prm__overview--subtext">
              The more sessions you have the more accurate your report will be.
              Make sure to ask your coach to help you with your practice areas.
            </p>
          </div>
        </section>
        <footer class="prm__footer">
          <div class="prm__buttons">
            <large-button
              class="prm__buttons-button  prm__buttons-button--primary prm__buttons-button--single prm__buttons-button--wide"
              @click.native="handleSessionRequest()"
              :showArrow="false"
              primary
            >
              Start a new Reading session
            </large-button>
          </div>
        </footer>
      </div>
      <div v-else-if="step === 3" class="prm">
        <header class="prm__practice-area-header">
          <h1 class="prm__title prm__title--center">
            Practice Areas
          </h1>
        </header>

        <section class="prm__section--center">
          <div
            v-for="concept of filteredConceptsToFocusArea('practiceArea')"
            :key="concept.name"
          >
            <div class="prm__concept">
              <div class="prm__concept-header">
                <span class="prm__concept-name">{{ concept.name }} </span>
                <div class="prm__concept-scores">
                  <span class="prm__concept-scores--score"
                    >Score: {{ concept.grade }}</span
                  >
                </div>
              </div>
              <div class="prm__concept-recommendations">
                Recommendations for improvement:
                <ul>
                  <li
                    v-for="detail of filteredFocusAreasToInfoType(
                      concept,
                      'recommendation'
                    )"
                    :key="detail.content"
                    class="prm__concept-recommendations--recommendation"
                  >
                    {{ detail.content }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <footer class="prm__footer">
          <div class="prm__buttons">
            <large-button
              class="prm__buttons-button"
              @click.native="handleCloseModal"
              :showArrow="false"
            >
              Close
            </large-button>
            <large-button
              class="prm__buttons-button  prm__buttons-button--single"
              @click.native="handleSessionRequest"
              :showArrow="false"
              primary
            >
              Start a Reading session
            </large-button>
          </div>
        </footer>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EVENTS } from '@/consts'
import BannerImage from '@/assets/scorecaster-banner.svg'
import Upbot from '@/assets/upbot.svg'
import UpdogConstruction from '@/assets/updog-construction.svg'
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import AnalyticsService from '@/services/AnalyticsService'
import CrossIcon from '@/assets/cross.svg'

export default {
  name: 'ProgressReportModal',
  components: {
    Modal,
    LargeButton,
    BannerImage,
    Upbot,
    UpdogConstruction,
    CrossIcon,
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
      user: state => state.user.user,
      requestedProgressReportOverview: state =>
        state.user.requestedProgressReportOverview,
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
      this.step++
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

      this.timeOutInterval = setTimeout(() => {
        if (!this.report) {
          this.showStillGeneratingReport = true
          this.isSubmitting = false
          AnalyticsService.captureEvent(
            EVENTS.PROGRESS_REPORT_STUDENT_MODAL_TIMED_OUT
          )
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
      return this.concepts.filter(concept => {
        if (
          !includedConceptNames.has(concept.name) &&
          concept.details.some(detail => detail.focusArea === focusArea)
        ) {
          includedConceptNames.add(concept.name)
          return true
        }
        return false
      })
    },
    filteredFocusAreasToInfoType(concept, infoType) {
      return concept.details.filter(detail => detail.infoType === infoType)
    },
  },
  sockets: {
    'progress-report:processed:overview'(data) {
      this.report = data.report
      if (this.requestedProgressReportOverview) this.handleReport()
    },
  },
}
</script>

<style lang="scss" scoped>
.prm {
  text-align: initial;

  &__title {
    @include font-category('display-small');
    font-weight: 500;
    margin-top: 1em;
    margin-bottom: 1em;

    &-header {
      @include flex-container(row, space-between, center);
    }

    &--center {
      text-align: center;
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

  &__body {
    @include font-category('heading');
    margin-bottom: 0.5em;
    margin-top: 1em;

    &--bold {
      font-weight: 600;
    }

    &--helper {
      color: $c-secondary-grey;
    }
  }

  &__buttons {
    @include flex-container(column, space-between, center);
    margin: 1.6em 0 0.4em 0;
    & span:first-child,
    & button:first-child {
      margin-right: 1em;
    }

    @include breakpoint-above('small') {
      @include flex-container(row, space-between, center);
    }

    &-button {
      margin: 0 auto;
      width: 100%;
      margin-bottom: 1.3em;

      @include breakpoint-above('small') {
        width: 250px;
        margin-bottom: initial;
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
    padding: 1em;
    border: 1px solid $c-border-grey;
    border-collapse: collapse;

    &-header {
      @include flex-container(row, space-between, center);
    }

    &-title {
      @include font-category('subheading');
    }

    &--bold {
      font-weight: 600;
    }

    &-concept {
      @include font-category('body');
      margin: 0;
    }

    &-link {
      @include font-category('body');
      color: $c-information-blue;
      margin: 0;
      font-weight: 600;
      &:hover {
        cursor: pointer;
      }
    }

    &--subtext {
      @include font-category('helper-text');
      margin-top: 1em;
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
  height: 300px;
}
.error {
  color: $c-error-red;
  margin: 1em 0;
}

.updog {
  width: 120px;
  height: 120px;
}

.loading-message {
  font-size: 22px;
  text-align: center;
  font-weight: 600;
  margin-top: 1em;
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
</style>
