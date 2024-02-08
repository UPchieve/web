<template>
  <div class="progress-reports">
    <section>
      <div class="progress-reports__header">
        <div class="progress-reports__header-container">
          <h1 class="progress-reports__header-title">Your Progress</h1>
          <div class="progress-reports__header-information">
            <information-icon
              v-if="!summaries.length || !hasPageError"
              class="progress-reports__header-information--icon"
              @mouseover="showMoreInfo = true"
              @mouseleave="showMoreInfo = false"
              @click="showMoreInfo = true"
            />
            <div
              v-if="showMoreInfo"
              class="progress-reports__header-information--text"
            >
              We used AI to analyze the content of your
              {{ subjectDisplayName }} tutoring sessions. Your data was kept
              entirely private; no other company saw the content of your
              sessions, and the only people who viewed them were our existing
              moderators.
            </div>
          </div>
        </div>
        <large-button
          class="progress-reports__start-session-btn"
          @click.native="routeToSessionRequest"
          :showArrow="false"
          v-if="!isLoadingPage"
        >
          Start a {{ subjectDisplayName }} session
        </large-button>
      </div>
    </section>
    <loader v-if="isLoadingPage" class="page-loader" />
    <template v-else-if="hasPageError">
      <div class="progress-reports__no-results">
        <updog-construction class="updog" />
        <p class="progress-reports__no-results-content">
          Hey there! 👋 It looks like we something went wrong while trying to
          get your progress. Please try refreshing.
        </p>
      </div>
    </template>
    <template v-else-if="!summaries.length">
      <div class="progress-reports__no-results">
        <upbot-icon />
        <p class="progress-reports__no-results-content">
          Looks like we need a bit more data from your
          {{ subjectDisplayName }} tutoring sessions before we can start
          analyzing your sessions. The more sessions you dive into, the better
          we can predict your future success!
        </p>
      </div>
    </template>
    <template v-else>
      <section class="progress-reports__overview">
        <h1
          class="progress-reports__overview-title progress-reports__overview-title--header"
        >
          Overview of your {{ subjectDisplayName }} Progress
        </h1>
        <separator class="separator" />

        <section>
          <div>
            <p class="progress-reports__overview-score spacing--padding">
              Overall {{ subjectDisplayName }} Score
            </p>
            <div class="spacing--padding">
              <h2
                class="progress-reports__overview-content--big progress-reports__overview-grade-label"
              >
                {{ gradeLevelLabel }}
              </h2>

              <p>
                {{
                  gradeDescription(latestProgressReport.summary.overallGrade)
                }}
              </p>

              <grade-bars
                :grade="latestProgressReport.summary.overallGrade"
                class="grade-bars"
              />

              <p class="progress-reports__overview-summary">
                {{ latestProgressReport.summary.summary }}
              </p>
            </div>
          </div>
        </section>

        <separator class="separator" />

        <section class="progress-reports__overview-graphics">
          <div
            v-if="topConcept"
            class="progress-reports__overview-top-concept progress-reports__overview-graphics-stat"
          >
            <p class="progress-reports__overview-subtitle">Strongest Concept</p>
            <p class="progress-reports__overview-content--big">
              {{ topConcept.name }}
            </p>
          </div>

          <div
            class="progress-reports__overview-practice progress-reports__overview-graphics-stat progress-reports__overview-graphics-stat--col-2"
          >
            <p class="progress-reports__overview-subtitle">
              Concepts to Practice
            </p>
            <ol class="progress-reports__overview-practice-list">
              <li
                v-for="(practice, index) in practiceAreas"
                :key="practice.name"
              >
                <span
                  v-if="index < 5"
                  class="progress-reports__concepts-practice-name"
                  >{{ practice.name }}</span
                >
              </li>
            </ol>
          </div>

          <div class="progress-reports__overview-graphics-chart">
            <canvas ref="chart"></canvas>
          </div>
        </section>

        <section class="progress-reports__concepts-practice">
          <h2 class="progress-reports__concepts-practice-header">
            Recommendations for Improvement:
          </h2>
          <div class="progress-reports__concepts-practice-items">
            <p v-for="practice in practiceAreas" :key="practice.name">
              <span class="progress-reports__concepts-practice-name"
                >{{ practice.name }}:</span
              >
              <span class="progress-reports__concepts-practice-content">{{
                practice.content
              }}</span>
            </p>
          </div>
        </section>
      </section>

      <div v-if="!mobileMode" class="container">
        <section>
          <div class="spacing--grid spacing--grid-3 session-list__headers">
            <span>Subject</span>
            <span>Date</span>
            <span>Review</span>
          </div>
          <div v-if="error">
            <h1 class="title title--body">
              {{ error }}
            </h1>
          </div>
          <loader
            v-else-if="isFetchingSessions"
            message="Retrieving your analyzed sessions"
            class="progress-reports__loader"
          />
          <template v-else-if="!sessions.length && page === 1">
            <div class="progress-reports__no-results">
              <upbot-icon />
              <p class="progress-reports__no-results-content">
                Looks like we haven't been able to generate any specialized
                reports for your individual {{ subjectDisplayName }} tutoring
                sessions. The more sessions you dive into, the better we can
                predict your future success!
              </p>
            </div>
          </template>
          <ul class="session-list" v-else>
            <li v-for="(session, index) in sessions" :key="session._id">
              <div class="session-list__session session-list__session--grid-3">
                <div class="session-list__subject-container">
                  <img
                    :src="session.topicIconLink"
                    :alt="`${session.topic} icon`"
                    class="subject-icon"
                  />
                  <div class="subject subject-name-container">
                    {{ session.subject }}
                  </div>
                </div>
                <div class="session-list__created-at">
                  {{ getSessionTime(session.createdAt) }}
                </div>
                <div class="session-list__session-recap">
                  <large-button
                    primary
                    class="session-list__session-recap session-list__session-recap__button"
                    @click.native="routeToSessionRecap(session.id)"
                    >See review</large-button
                  >
                </div>
              </div>
              <div class="border--thin" v-if="index !== 5"></div>
            </li>
          </ul>
          <footer class="page-actions-container">
            <div class="page-actions">
              <div
                @click="() => getProgressReportsForSubject(page - 1)"
                :class="isFirstPage && 'page-actions__stepper--disabled'"
                class="page-actions__stepper"
              >
                <caret-icon class="caret caret--previous" /><span
                  >Previous</span
                >
              </div>
              <div class="page-numbers">
                <span class="page-num page-num--active">
                  {{ page }}
                </span>
              </div>
              <div
                @click="() => getProgressReportsForSubject(page + 1)"
                :class="isLastPage && 'page-actions__stepper--disabled'"
                class="page-actions__stepper"
              >
                <span>Next</span><caret-icon class="caret caret--next" />
              </div>
            </div>
          </footer>
        </section>
      </div>
      <div v-if="mobileMode">
        <div class="mobile-container">
          <section>
            <div v-if="error">
              <h1 class="title title--body">
                {{ error }}
              </h1>
            </div>
            <loader
              v-else-if="isFetchingSessions"
              message="Retrieving your session history"
              class="progress-reports__loader"
            />
            <ul v-else class="mobile-session-list">
              <li v-for="(session, index) in sessions" :key="session._id">
                <div class="mobile-session-list__session">
                  <div class="mobile-session-list__subject-container">
                    <img
                      :src="session.topicIconLink"
                      :alt="`${session.topic} icon`"
                      class="mobile-subject-icon"
                    />
                    <div class="mobile-subject-name-container">
                      <div class="mobile-subject">{{ session.subject }}</div>
                    </div>
                  </div>
                  <div class="mobile-session-list__createdAt-container">
                    <span class="mobile-session-list__created-at">
                      {{ getSessionTimeForMobile(session.createdAt) }}</span
                    >
                  </div>
                  <caret-icon
                    class="caret--next"
                    @click="routeToSessionRecap(session.id)"
                  />
                </div>
                <div class="border--thin" v-if="index !== 5"></div>
              </li>
            </ul>
            <footer class="page-actions-container">
              <div class="page-actions">
                <div
                  @click="() => getProgressReportsForSubject(page - 1)"
                  :class="isFirstPage && 'page-actions__stepper--disabled'"
                  class="page-actions__stepper"
                >
                  <caret-icon class="caret caret--previous" />
                </div>
                <div class="page-numbers">
                  <span class="page-num page-num--active">
                    {{ page }}
                  </span>
                </div>
                <div
                  @click="() => getProgressReportsForSubject(page + 1)"
                  :class="isLastPage && 'page-actions__stepper--disabled'"
                  class="page-actions__stepper"
                >
                  <caret-icon class="caret caret--next" />
                </div>
              </div>
            </footer>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import 'chartjs-adapter-moment'
import Chart from 'chart.js/auto'
import moment from 'moment'
import LargeButton from '@/components/LargeButton.vue'
import Separator from '@/components/Separator.vue'
import Loader from '@/components/Loader.vue'
import GradeBars from '@/components/GradeBars.vue'
import { backOff } from 'exponential-backoff'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import CaretIcon from '@/assets/caret.svg'
import InformationIcon from '@/assets/information.svg'
import UpdogConstruction from '@/assets/updog-construction.svg'
import UpbotIcon from '@/assets/upbot.svg'
import { gradeLabel, gradeDescription } from '@/utils/grades'

export default {
  name: 'progress-reports-view',
  components: {
    CaretIcon,
    LargeButton,
    Loader,
    Separator,
    InformationIcon,
    UpbotIcon,
    UpdogConstruction,
    GradeBars,
  },
  data() {
    return {
      sessions: [],
      summaries: [],
      latestProgressReport: {},
      chart: null,
      showMoreInfo: false,
      isLoadingPage: false,
      isFetchingSessions: false,
      page: 1,
      hasNext: false,
      isLastPage: false,
      hasPageError: false,
      error: '',
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      subjects: (state) => state.subjects.subjects,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    isFirstPage() {
      return this.page === 1
    },
    subject() {
      return this.$route.params.subject
    },
    topConcept() {
      const strengths = this.filteredConceptsToFocusArea('strength') ?? []
      return strengths[0]
    },
    practiceAreas() {
      const practiceAreas =
        this.filteredConceptsToFocusArea('practiceArea') ?? []
      const endResult = []
      for (const practiceArea of practiceAreas) {
        const name = practiceArea.name
        let content = ''
        for (const detail of practiceArea.details) {
          if (
            detail.infoType === 'recommendation' &&
            detail.focusArea === 'practiceArea'
          )
            content += detail.content
        }
        endResult.push({ name, content })
      }

      return endResult
    },
    gradeLevelLabel() {
      return this.gradeLabel(this.latestProgressReport.summary.overallGrade)
    },
    subjectDisplayName() {
      if (!this.subjects[this.subject]) return this.subject
      return this.subjects[this.subject].displayName
    },
    topic() {
      return this.subjects[this.subject].topicName
    },
  },
  async mounted() {
    AnalyticsService.captureEvent(EVENTS.PROGRESS_REPORT_OVERVIEW_OPENED)

    try {
      this.isLoadingPage = true
      const responses = await Promise.all([
        NetworkService.getProgressReportSummariesForSubject(this.subject),
        NetworkService.getLatestProgressReportOverviewForSubject(this.subject),
        this.getProgressReportsForSubject(this.page),
      ])
      this.summaries = responses[0].data
      this.latestProgressReport = responses[1].data

      // We remove the loading page so that the chart can render on the DOM
      // We must wait for the next tick for the chart to successfully render
      this.isLoadingPage = false
      await this.$nextTick()
      this.createChart()
      this.sendReadReceiptsToUnreadReports()
      window.addEventListener('resize', () => {
        this.reloadChart()
      })
    } catch (error) {
      LoggerService.noticeError(error)
      this.hasPageError = true
    } finally {
      this.isLoadingPage = false
    }
  },
  beforeDestroy() {
    this.destroyChart()
    window.removeEventListener('resize', this.reloadChart)
  },
  methods: {
    async getProgressReportsForSubject(page) {
      this.isFetchingSessions = true
      if (page > this.page)
        AnalyticsService.captureEvent(
          EVENTS.PROGRESS_REPORT_OVERVIEW_STUDENT_CLICKED_NEXT_PAGE,
          {
            page,
          }
        )
      if (page < this.page)
        AnalyticsService.captureEvent(
          EVENTS.PROGRESS_REPORT_OVERVIEW_STUDENT_CLICKED_PREVIOUS_PAGE,
          {
            page,
          }
        )

      try {
        const response = await backOff(() =>
          NetworkService.getProgressReportsForSubject(this.subject, page)
        )
        this.sessions = response.data.sessions
        this.isLastPage = response.data.isLastPage
        this.page = page
      } catch (error) {
        this.handleError(error)
      } finally {
        this.isFetchingSessions = false
      }
    },
    filteredConceptsToFocusArea(focusArea) {
      const includedConceptNames = new Set()
      const filteredConcepts = this.latestProgressReport.concepts.filter(
        (concept) => {
          if (
            !includedConceptNames.has(concept.name) &&
            concept.details.some((detail) => detail.focusArea === focusArea)
          ) {
            includedConceptNames.add(concept.name)
            return true
          }
          return false
        }
      )
      filteredConcepts.sort((a, b) => b.grade - a.grade)
      return filteredConcepts
    },
    handleError(error) {
      LoggerService.noticeError(error.response.data.err)
      this.error =
        'We were unable to load your analyzed sessions. Please try again later.'
    },
    getSessionTime(sessionCreatedAt) {
      return moment(sessionCreatedAt).format('l @ h:mm A')
    },
    getSessionTimeForMobile(sessionCreatedAt) {
      return moment(sessionCreatedAt).format('l h:mm A')
    },
    routeToSessionRecap(sessionId) {
      AnalyticsService.captureEvent(
        EVENTS.PROGRESS_REPORT_OVERVIEW_STUDENT_CLICKED_RECAP,
        {
          sessionId,
        }
      )
      this.$router.push(`/sessions/${sessionId}/recap`)
    },
    routeToSessionRequest() {
      AnalyticsService.captureEvent(
        EVENTS.PROGRESS_REPORT_OVERVIEW_STUDENT_REQUESTED_SESSION,
        {
          subject: this.subject,
        }
      )
      this.$router.push(`/session/${this.topic}/${this.subject}/`)
    },
    async sendReadReceiptsToUnreadReports() {
      const reportIds = this.summaries
        .filter((summary) => !summary.reportReadAt)
        .map((summary) => summary.reportId)

      this.$store.dispatch('user/updateProgressReportsReadStatus', reportIds)
    },
    gradeLabel(grade) {
      return gradeLabel(grade)
    },
    gradeDescription(grade) {
      return gradeDescription(grade)
    },
    createChart() {
      const chartRef = this.$refs.chart
      const sortedData = [
        ...this.summaries.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        ),
      ]
      const currentDate = moment()

      // Get the previous three months and the next one month
      const months = []
      for (let i = 2; i >= -1; i--) {
        months.push(
          currentDate.clone().subtract(i, 'months').format('MMMM YYYY')
        )
      }

      const labels = months
      const mobileMode = this.mobileMode
      const dataset = sortedData.map((entry) => ({
        x: moment(entry.createdAt).local(),
        y: entry.overallGrade,
        label: this.gradeLabel(entry.overallGrade),
      }))
      const gradeRanges = {
        60: 'Almost there',
        70: 'Passing Grade',
        80: 'Satisfactory',
        90: 'Awesome',
        100: 'Superb',
      }

      this.chart = new Chart(chartRef, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Score',
              data: dataset,
              borderColor: 'rgba(0, 123, 255, 1)',
              borderWidth: 2,
              tension: 0.4,
              // Set pointRadius to 5 if there's only one datum in the dataset to ensure visibility.
              // Hide point radii (set to 0) for multiple data points
              pointRadius: dataset.length === 1 ? 5 : 0,
              pointBackgroundColor: '#ffffff',
            },
          ],
        },
        options: {
          maintainAspectRatio: !mobileMode,
          responsive: true,
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                padding: 20,
                // Show all labels on the Y-axis
                callback: function (value) {
                  // Display the label for the range starting at this value
                  return gradeRanges[value] || ''
                },
              },
              suggestedMin: 50,
              max: 110,

              border: {
                display: false,
              },
            },
            x: {
              type: 'time',
              time: {
                unit: 'month',
                displayFormats: {
                  month: 'MMM YYYY',
                },
              },
              grid: {
                // Removes the x-axis grid lines
                display: false,
              },
              ticks: {
                minRotation: mobileMode ? 50 : 0,
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Score Progress',
              position: 'top',
              align: 'center',
            },
            legend: {
              display: false,
            },
            customCanvasBackgroundColor: {
              backgroundColor: 'lightGreen',
            },
          },
        },
      })
    },
    destroyChart() {
      if (this.chart) this.chart.destroy()
    },
    reloadChart() {
      this.destroyChart()
      this.createChart()
    },
  },
}
</script>

<style lang="scss" scoped>
a {
  text-decoration: none;
}

ul {
  padding: 0px;
  height: 100%;
  margin: auto;
  list-style-type: none;
}

p {
  margin-bottom: 0;
}

.title {
  font-weight: 500;
  font-size: 18px;
  margin: 1em;

  @include breakpoint-above('small') {
    margin: 0;
    font-size: 22px;
  }

  &--body {
    text-align: center;
    margin: 3em 1em 0 1em;
  }
}

.page-loader {
  @include flex-container(row, center);
}

.progress-reports {
  max-width: 1200px;
  padding: 3em;

  @include breakpoint-below('large') {
    padding: 1em;
  }

  @include breakpoint-below('small') {
    padding: 0;
  }

  &__loader {
    margin: 1em 0;
    @include flex-container(column, center, center);
  }

  &__start-session-btn {
    background-color: $c-information-blue;
    color: $upchieve-white;

    &:hover {
      background: darken($c-information-blue, 5%);
    }
  }

  &__header {
    @include flex-container(column, space-between, flex-start);
    margin: 1em 0;
    padding-left: 2em;

    @include breakpoint-above('small') {
      @include flex-container(row, space-between, center);
    }

    &-container {
      @include flex-container(row, center);
      margin-bottom: 1em;

      @include breakpoint-above('small') {
        margin-bottom: 0;
      }
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

  &__overview {
    background-color: $upchieve-white;
    padding: 2em;
    border-radius: 8px;
    margin: 2em 0;

    &-title {
      font-size: 20px;
      font-weight: 600;

      &--header {
        margin-bottom: 0.6em;
      }
    }

    &-score {
      font-size: 14px;
      margin: 0.4em 0;
      padding-top: 0.5em;
      padding-bottom: 0.5em;
      background-color: lighten($upchieve-green, $amount: 24%);
    }

    &-grade-label {
      font-size: 28px;
      font-weight: 500;
      margin: 0.2em 0;
    }

    &-summary {
      margin-bottom: 1em;
    }

    &-graphics {
      position: relative;
      margin: 1em 0;

      @include breakpoint-above('large') {
        display: grid;
        grid-template-rows: auto;
        grid-template-columns: minmax(auto, 250px) auto auto;
        gap: 0 20px;
      }

      @include breakpoint-between('992px', '1200px') {
        grid-template-columns: 50% 50%;
        grid-template-rows: auto;
      }

      @include breakpoint-above('huge') {
        grid-template-columns: 20% 20% 1fr;
        grid-template-rows: 1fr;
      }

      &-stat {
        grid-column: 1;
        padding: 1em;
        border-radius: 12px;
        margin-bottom: 1em;

        @include breakpoint-between('992px', '1200px') {
          grid-column: auto;
        }

        @include breakpoint-above('huge') {
          grid-column: 1;
        }

        &--col-2 {
          @include breakpoint-above('huge') {
            grid-column: 2;
            grid-row: 1 / span 2;
          }
        }
      }
      &-chart {
        // For chart.js responsiveness
        position: relative;
        border: 2px solid $c-border-grey;
        padding: 20px;
        background-color: rgba(239, 248, 254, 1);
        border-radius: 18px;
        margin-bottom: 1em;
        height: 300px;

        @include breakpoint-above('large') {
          height: initial;
        }

        @include breakpoint-between('992px', '1200px') {
          grid-column: 1 / span 2;
          grid-row: 2;
        }

        @include breakpoint-above('huge') {
          grid-column: 3;
          width: 100%;
        }
      }
    }

    &-subtitle {
      font-size: 14px;
    }

    &-content--big {
      font-size: 22px;
      font-weight: 600;
    }

    &-level {
      background-color: #fbebfb;
    }

    &-top-concept {
      background-color: #d1f6fe;
    }

    &-practice {
      background-color: #feedbd;
      &-list {
        padding-left: 1.4em;
      }
    }
  }

  &__concepts-practice {
    border-radius: 18px;
    margin: 1em 0;

    &-header {
      @include font-category('body');
      background-color: lighten($c-warning-orange, $amount: 25%);
      padding: 0.4em 1em;
      font-weight: 600;
    }

    &-name {
      font-weight: 600;
    }

    &-content {
      padding-left: 0.6em;
    }

    &-items {
      padding: 0.4em 1em;
    }
  }

  &__no-results {
    @include flex-container(column, center, center);
    background-color: $upchieve-white;
    border-radius: 12px;
    padding: 2em;
    margin: 0 auto;

    &-content {
      margin-top: 1em;
    }
  }
}

.separator {
  background-color: $c-background-grey;
}

.container {
  padding: 0;
  margin: 0;
  background-color: white;
  border: 1px solid $c-border-grey;
  border-radius: 8px 8px 16px 16px;
  min-width: 100%;
}

.spacing--grid {
  display: grid;
  text-align: center;

  &-3 {
    @include breakpoint-above('small') {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  &-4 {
    @include breakpoint-above('small') {
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }
  }
}

.session-list {
  padding: 0 2em;
  min-height: 600px;

  @include breakpoint-below('large') {
    padding-right: 1.5em;
  }

  &__headers {
    @include font-category('subheading');
    background-color: $c-background-blue;
    width: 100%;
    padding: 1em 2em;
  }

  &__partner-name {
    @include font-category('subheading');
    margin: 0.8em;
    @include breakpoint-below('large') {
      font-size: 14px;
    }

    &-container {
      @include flex-container(row, center, center);

      @include breakpoint-below('medium') {
        width: 100px;
      }
    }
  }

  &__session {
    @include flex-container(row, space-around, center);
    display: grid;

    &--grid-3 {
      @include breakpoint-above('tiny') {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
    &--grid-4 {
      @include breakpoint-above('tiny') {
        grid-template-columns: 1fr 1fr 1fr 1fr;
      }
    }
    padding: 1em 0;
  }

  &__subject-container {
    @include flex-container(row, center, center);
  }

  &__created-at {
    text-align: center;
    @include font-category('subheading');
    color: $c-secondary-grey;
    @include breakpoint-below('large') {
      font-size: 14px;
      margin: 0.7em;
    }
  }

  &__session-recap {
    @include flex-container(row, center, center);

    &__button {
      border-color: $c-information-blue;
      background: #fff;
      color: $c-information-blue;
      fill: $c-information-blue;

      &:hover {
        background-color: rgba(24, 85, 209, 0.1);
        color: $c-information-blue;
        fill: $c-information-blue;
      }

      &:active {
        background-color: $c-information-blue;
        color: #fff;
        fill: #fff;
      }

      @include breakpoint-below('large') {
        transform: scale(0.8, 0.8);
      }
    }
  }
}

.subject {
  text-align: left;

  @include font-category('heading');
  @include breakpoint-below('large') {
    font-size: 16px;
  }

  &-icon {
    height: 50px;
    min-width: 50px;
    width: 50px;

    @include breakpoint-below('large') {
      min-width: initial;
      width: 30px;
    }
  }

  &-name-container {
    @include flex-container(column, center, flex-start);
    margin: 1.375em 0 1.375em 1em;
    width: 100px;

    @include breakpoint-below('large') {
      margin-left: 0.4em;
    }
  }

  &-time-tutored {
    @include font-category('helper-text');
    color: $c-secondary-grey;
    text-align: left;
  }
}

.border--thin {
  width: 100%;
  border-bottom: 2px solid $c-background-grey;
  margin: 0 auto;
}

.page-actions {
  @include flex-container(row, space-around);
  padding: 1em 0;

  @include breakpoint-above('large') {
    justify-content: flex-end;
  }
}

.page-actions-container {
  padding: 0 2em;
}

.page-numbers {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.page-actions {
  &__stepper {
    display: flex;
    align-items: center;

    margin-right: 1em;
    color: $c-information-blue;

    & .caret path {
      fill: $c-information-blue;
    }

    &:hover {
      cursor: pointer;
    }

    @include breakpoint-above('medium') {
      margin-right: 2em;
    }

    &--disabled {
      margin-right: 1em;
      color: $c-disabled-grey;

      &:hover {
        cursor: default;
      }

      & .caret path {
        fill: $c-disabled-grey;
      }

      @include breakpoint-above('medium') {
        margin-right: 2em;
      }
    }
  }
}

.page-num {
  margin-right: 1em;
  @include breakpoint-above('medium') {
    margin-right: 2em;
  }
  &:hover {
    color: $c-information-blue;
    cursor: pointer;
  }

  &--active {
    color: $c-information-blue;

    &:hover {
      cursor: default;
    }
  }
}

.caret {
  &--previous {
    transform: rotate(90deg);
    margin-right: 0.4em;
  }

  &--next {
    transform: rotate(-90deg);
    margin-left: 0.4em;
  }
}

// mobile css styling
.mobile-container {
  padding: 0.5em 1.5em 0.5em 1.5em;
  margin: 0;
  background-color: white;
  border: 1px solid $c-border-grey;
  border-radius: 8px 8px 16px 16px;
  min-width: 100%;
}

.mobile-session-list {
  padding: 0;
  min-height: 500px;
  &__partner-name {
    font-weight: 500;
    font-size: 14px;
    margin: 0.4em;
    &-container {
      @include flex-container(row, center, center);
    }
  }

  &__session {
    @include flex-container(row, space-between, center);
  }

  &__subject-container {
    @include flex-container(row, initial, center);
  }

  &__created-at {
    color: $c-secondary-grey;
    font-size: 12px;
    font-weight: 400;
  }

  &__createdAt-container {
    @include flex-container(column, center, flex-end);
    margin-left: auto;
  }
}

.mobile-subject {
  text-align: left;
  font-weight: 600;
  font-size: 16px;

  &-icon {
    height: 30px;
    width: 30px;
  }

  &-name-container {
    @include flex-container(column, center, flex-start);
    margin: 1.375em;
  }

  &-time-tutored {
    color: $c-secondary-grey;
    font-size: 12px;
    font-weight: 400;
  }
}

.updog {
  height: 200px;
}

.spacing--padding {
  padding-left: 1em;
  padding-right: 1em;
}

.grade-bars {
  margin: 1em 0;
}
</style>
