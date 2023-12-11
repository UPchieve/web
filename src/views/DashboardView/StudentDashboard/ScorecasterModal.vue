<template>
  <div>
    <modal :backText="''">
      <div v-if="isSubmitting" class="scorecaster">
        <section class="scorecaster__section scorecaster__section--center">
          <updog-loader class="updog" />
          <p class="loading-message">This might take a minute or so...</p>
        </section>
      </div>
      <div v-else-if="hasError" class="scorecaster">
        <section class="scorecaster__section scorecaster__section--center">
          <updog-construction class="updog" />
          <p class="scorecaster__body">
            Hey there! 👋 This feature is experimental, and it looks like we
            don't have everything working as we expected quite yet. We're on it
            and making it awesome as we speak!
          </p>
        </section>
        <footer class="scorecaster__footer">
          <div class="scorecaster__buttons scorecaster__buttons--center">
            <large-button @click.native="handleCloseModal">Close</large-button>
          </div>
        </footer>
      </div>
      <div v-else-if="showHaveMoreSessions" class="scorecaster">
        <header>
          <scorecaster-banner class="scorecaster-banner" />
          <h1 class="scorecaster__title">
            We're almost there for your report
          </h1>
        </header>
        <section class="scorecaster__section scorecaster__section--center">
          <p class="scorecaster__body">
            Looks like we need a bit more data from your Reading tutoring
            sessions to whip up a solid report. The more sessions you dive into,
            the better we can predict your future success!
          </p>
        </section>
        <footer class="scorecaster__footer">
          <div class="scorecaster__buttons scorecaster__buttons--center">
            <large-button
              class="scorecaster__buttons-button"
              @click.native="handleCloseModal"
              :showArrow="false"
            >
              Close
            </large-button>
            <large-button
              class="scorecaster__buttons-button  scorecaster__buttons-button--single"
              @click.native="handleSessionRequest"
              :showArrow="false"
              primary
            >
              Start a new Reading session
            </large-button>
          </div>
        </footer>
      </div>
      <div v-else-if="step === 1" class="scorecaster">
        <header>
          <scorecaster-banner class="scorecaster-banner" />
          <h1 class="scorecaster__title">
            Want a forecast of your reading scores?
          </h1>
          <p class="scorecaster__body">
            Based on your reading tutoring sessions, we'll make a report for
            you. It guesses how well you'll do on future English quizzes or
            tests, and shows what you're doing well and what to improve.
          </p>
          <p class="scorecaster__body--helper">
            This is a new experimental feature. We might not get it right the
            first time!
          </p>
        </header>

        <footer class="scorecaster__footer">
          <div class="scorecaster__buttons">
            <large-button
              class="scorecaster__buttons-button"
              @click.native="handleCloseModal"
              >No, thanks</large-button
            >
            <large-button
              class="scorecaster__buttons-button scorecaster__buttons-button--primary"
              @click.native="analyzeSessions"
              primary
              :showArrow="false"
              >Analyze my sessions</large-button
            >
          </div>
        </footer>
      </div>
      <div v-else-if="step === 2" class="scorecaster scorecaster--flex">
        <cross-icon class="cross-icon" @click="handleCloseModal" />
        <header>
          <h1 class="scorecaster__title scorecaster__title-header">
            <span>Test Score Forecast</span>
            <span>{{ overview.grade }}%</span>
          </h1>
        </header>

        <section class="scorecaster__section">
          <p class="scorecaster__body">
            Based on your Reading tutoring sessions, our UPbot created a special
            report for you.
          </p>
          <div class="scorecaster__overview-container">
            <div class="scorecaster__overview">
              <header class="scorecaster__overview-header">
                <h2
                  class="scorecaster__overview-title scorecaster__overview--bold"
                >
                  Strengths
                </h2>
              </header>
              <p
                v-for="strength of displayTopicsByType('strength')"
                :key="strength.topic"
                class="scorecaster__overview-topic"
              >
                {{ strength.topic }}
              </p>
            </div>
            <div class="scorecaster__overview">
              <header class="scorecaster__overview-header">
                <h2
                  class="scorecaster__overview-title scorecaster__overview--bold"
                >
                  Practice Areas
                </h2>
              </header>
              <p
                v-for="practiceArea of displayTopicsByType('practiceArea')"
                :key="practiceArea.topic"
                class="scorecaster__overview-topic"
              >
                {{ practiceArea.topic }}
              </p>
              <span
                class="scorecaster__overview-link"
                @click="showDetailedReport"
              >
                See more practice areas
              </span>
            </div>
            <p class="scorecaster__overview--subtext">
              The more sessions you have the more accurate your report will be.
              Make sure to ask your coach to help you with your practice areas.
            </p>
          </div>
        </section>
        <footer class="scorecaster__footer">
          <div class="scorecaster__buttons">
            <large-button
              class="scorecaster__buttons-button  scorecaster__buttons-button--primary scorecaster__buttons-button--single scorecaster__buttons-button--wide"
              @click.native="handleSessionRequest"
              :showArrow="false"
              primary
            >
              Start a new Reading session
            </large-button>
          </div>
        </footer>
      </div>
      <div v-else-if="step === 3" class="scorecaster">
        <header class="scorecaster__practice-area-header">
          <h1 class="scorecaster__title scorecaster__title--center">
            Practice Areas
          </h1>
        </header>

        <section class="scorecaster__section--center">
          <div
            v-for="topic of displayTopicsByType('practiceArea')"
            :key="topic.topic"
            class="scorecaster__topic"
          >
            <div class="scorecaster__topic-header">
              <span class="scorecaster__topic-name">{{ topic.topic }} </span>
              <div class="scorecaster__topic-scores">
                <span class="scorecaster__topic-scores--score"
                  >Score: {{ topic.grade }}</span
                >
              </div>
            </div>
            <div class="scorecaster__topic-recommendations">
              Recommendations for improvement:
              <ul>
                <li
                  v-for="recommendation of topic.recommendations"
                  :key="recommendation"
                  class="scorecaster__topic-recommendations--recommendation"
                >
                  {{ recommendation }}
                </li>
              </ul>
            </div>
          </div>
        </section>
        <footer class="scorecaster__footer">
          <div class="scorecaster__buttons">
            <large-button
              class="scorecaster__buttons-button"
              @click.native="handleCloseModal"
              :showArrow="false"
            >
              Close
            </large-button>
            <large-button
              class="scorecaster__buttons-button  scorecaster__buttons-button--single"
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
import ScorecasterBanner from '@/assets/scorecaster-banner.svg'
import UpdogConstruction from '@/assets/updog-construction.svg'
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import UpdogLoader from '@/components/UpdogLoader.vue'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import CrossIcon from '@/assets/cross.svg'

export default {
  name: 'ScorecasterModal',
  components: {
    Modal,
    LargeButton,
    ScorecasterBanner,
    UpdogLoader,
    UpdogConstruction,
    CrossIcon,
  },
  data() {
    return {
      step: 1,
      isSubmitting: false,
      hasError: false,
      showHaveMoreSessions: false,
      overview: {},
      topics: [],
    }
  },
  mounted() {
    localStorage.setItem('hasSeenScorecasterModal', true)
    AnalyticsService.captureEvent(EVENTS.SCORECASTER_MODAL_SHOWN)
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
  },
  props: {
    closeModal: { required: true, type: Function },
  },
  methods: {
    handleCloseModal() {
      AnalyticsService.captureEvent(EVENTS.SCORECASTER_MODAL_CLOSED)
      this.closeModal()
    },
    handleSessionRequest() {
      AnalyticsService.captureEvent(EVENTS.SCORECASTER_STUDENT_REQUESTED_HELP)
      // There's a SCORECASTER_MODAL_CLOSED event here so that we can
      // have a clear start and end point for our user journey in PostHog
      AnalyticsService.captureEvent(EVENTS.SCORECASTER_MODAL_CLOSED)
      this.$router.push('/session/readingWriting/reading/')
    },
    showDetailedReport() {
      AnalyticsService.captureEvent(
        EVENTS.SCORECASTER_STUDENT_CLICKED_DETAILED_REPORT
      )
      this.step++
    },
    async analyzeSessions() {
      if (this.isSubmitting) return
      this.isSubmitting = true

      try {
        AnalyticsService.captureEvent(EVENTS.SCORECASTER_ANALYSIS_STARTED)
        const { data } = await NetworkService.getScorecasterAnalysis()
        AnalyticsService.captureEvent(EVENTS.SCORECASTER_ANALYSIS_RECEIVED)
        this.overview = data.overview
        this.topics = data.topics

        // We're going to expect that the AI couldn't come up with a solution
        // based on the student's sessions. The student may need to do more sessions
        // for an analysis
        if (!Object.keys(this.overview).length || !this.topics.length) {
          this.showHaveMoreSessions = true
          localStorage.removeItem('hasSeenScoreCasterModal')
          AnalyticsService.captureEvent(EVENTS.SCORECASTER_NO_ANALYSIS)
        } else this.step++
      } catch (error) {
        this.hasError = true
        const err = error.response.data.err
        LoggerService.noticeError(err)
        AnalyticsService.captureEvent(EVENTS.SCORECASTER_ANALYSIS_ERROR, {
          error: err,
        })
      } finally {
        this.isSubmitting = false
      }
    },
    getGrade(grade) {
      if (grade < 65) return 1
      return Math.floor((grade - 65) / 10) + 1
    },
    displayGrade(gradeNumber) {
      const grade = this.getGrade(gradeNumber)
      return `${grade}/5`
    },
    displayTopicsByType(type) {
      const topics = this.topics.filter(topic => topic.type === type)
      return topics.sort((a, b) => a.grade - b.grade)
    },
  },
}
</script>

<style lang="scss" scoped>
.scorecaster {
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

    &-topic {
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

  &__topic {
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

.scorecaster-banner {
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
