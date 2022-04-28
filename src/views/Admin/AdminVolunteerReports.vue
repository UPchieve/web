<template>
  <div class="admin-reports">
    <div class="filter-panel">
      <div class="col">
        <div class="filter-panel__row">
          <label for="volunteer-report-from" class="col">
            From
            <input id="volunteer-report-from" type="date" v-model="startDate" />
          </label>

          <label for="volunteer-report-to" class="col">
            To
            <input id="volunteer-report-to" type="date" v-model="endDate" />
          </label>
        </div>
      </div>

      <div class="col">
        <div>
          <label for="volunteer-partner-org" class="col">
            Volunteer partner org
            <v-select
              id="volunteer-partner-org"
              class="filter-panel__partner-select"
              :options="volunteerPartnerOrgs"
              label="name"
              v-model="volunteerPartnerOrg"
            />
          </label>
        </div>
      </div>
    </div>

    <p class="error">{{ error }}</p>
    <Loader v-if="isGeneratingReport" />

    <button
      type="button"
      class="report-btn"
      @click="generatePartnerAnalyticsReport"
      :disabled="isGeneratingReport"
    >
      Generate Corporate Partner Analytics Report
    </button>

    <button
      type="button"
      class="report-btn"
      @click="generateTelecomReport"
      :disabled="isGeneratingReport"
    >
      Generate Telecom Report
    </button>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import Loader from '@/components/Loader'
import moment from 'moment'
import exportToCsv from '@/utils/export-to-csv'
import { ANALYTICS_REPORT_ROW, ANALYTICS_REPORT_SUMMARY } from '@/consts'
import fileDownload from '@/utils/file-download'

export default {
  name: 'AdminReports',
  components: { Loader },

  data() {
    return {
      error: '',
      isGeneratingReport: false,
      volunteerPartnerOrgs: [],
      volunteerPartnerOrg: {},
      startDate: '',
      endDate: ''
    }
  },
  async mounted() {
    const {
      body: { partnerOrgs: volunteerPartnerOrgs }
    } = await NetworkService.adminGetVolunteerPartners()
    this.volunteerPartnerOrgs = volunteerPartnerOrgs
  },
  methods: {
    async generatePartnerAnalyticsReport() {
      if (this.isGeneratingReport) return
      this.isGeneratingReport = true
      this.error = ''

      const query = this.getQuery()

      try {
        const response = await NetworkService.adminGetPartnerAnalyticsReport(
          query
        )
        fileDownload(
          response.data,
          `${this.volunteerPartnerOrg.name}-analytics-report.xlsx`
        )
        this.isGeneratingReport = false
      } catch (error) {
        const data = this.convertBufferToObject(error.body)
        if (error.status === 422) this.errorHandler(data.err)
        else this.errorHandler()
      }
    },
    async generateTelecomReport() {
      if (this.isGeneratingReport) return
      this.isGeneratingReport = true
      this.error = ''

      const query = this.getQuery()
      try {
        const {
          body: { data }
        } = await NetworkService.adminGetVolunteerTelecomReport(query)

        if (data.length === 0)
          this.error = 'Unable to find any data that meets your request'
        else {
          exportToCsv(
            `${this.volunteerPartnerOrg.name}_Telecom_Report_${this.todaysDate}`,
            data
          )
        }
        this.isGeneratingReport = false
      } catch (error) {
        this.errorHandler()
      }
    },
    getQuery() {
      return {
        startDate: moment(this.startDate)
          .utc()
          .startOf('day')
          .format('MM-DD-YYYY'),
        endDate: moment(this.endDate)
          .utc()
          .startOf('day')
          .format('MM-DD-YYYY'),
        partnerOrg: this.isValidVolunteerPartnerOrg
          ? this.volunteerPartnerOrg.key
          : ''
      }
    },
    errorHandler(errorMessage = '') {
      this.isGeneratingReport = false
      this.error = errorMessage
        ? errorMessage
        : 'There was a problem with retrieving the report'
    },
    convertBufferToObject(buffer) {
      const decoder = new TextDecoder('utf8')
      return JSON.parse(decoder.decode(buffer))
    },
    mapAnalyticsReportHeaders(report) {
      return report.map(row => {
        // Use a Map to preserve key insertion order
        return new Map([
          [ANALYTICS_REPORT_ROW.FIRST_NAME, row.firstName],
          [ANALYTICS_REPORT_ROW.LAST_NAME, row.lastName],
          [ANALYTICS_REPORT_ROW.EMAIL, row.email],
          [ANALYTICS_REPORT_ROW.STATE, row.state],
          [ANALYTICS_REPORT_ROW.ONBOARDING_STATUS, row.onboardingStatus],
          [ANALYTICS_REPORT_ROW.DATE_ACCOUNT_CREATED, row.dateAccountCreated],
          [ANALYTICS_REPORT_ROW.DATE_ONBOARDED, row.dateOnboarded],
          [ANALYTICS_REPORT_ROW.DATE_FIRST_SESSION, row.dateFirstSession],
          [
            ANALYTICS_REPORT_ROW.CERTIFICATIONS_RECEIVED,
            row.certificationsReceived
          ],
          [ANALYTICS_REPORT_ROW.MATH_CERTS_RECEIVED, row.mathCertsReceived],
          [
            ANALYTICS_REPORT_ROW.SCIENCE_CERTS_RECEIVED,
            row.scienceCertsReceived
          ],
          [
            ANALYTICS_REPORT_ROW.COLLEGE_CERTS_RECEIVED,
            row.collegeCertsReceived
          ],
          [ANALYTICS_REPORT_ROW.TOTAL_TEXTS_RECEIVED, row.totalTextsReceived],
          [
            ANALYTICS_REPORT_ROW.TOTAL_SESSIONS_COMPLETED,
            row.totalSessionsCompleted
          ],
          [
            ANALYTICS_REPORT_ROW.TOTAL_UNIQUE_STUDENTS_HELPED,
            row.totalUniqueStudentsHelped
          ],
          [ANALYTICS_REPORT_ROW.TOTAL_TUTORING_HOURS, row.totalTutoringHours],
          [ANALYTICS_REPORT_ROW.TOTAL_TRAINING_HOURS, row.totalTrainingHours],
          [
            ANALYTICS_REPORT_ROW.TOTAL_ELAPSED_AVAILABILITY_HOURS,
            row.totalElapsedAvailabilityHours
          ],
          [ANALYTICS_REPORT_ROW.TOTAL_VOLUNTEER_HOURS, row.totalVolunteerHours],
          [
            ANALYTICS_REPORT_ROW.DATE_RANGE_TEXTS_RECEIVED,
            row.dateRangeTextsReceived
          ],
          [
            ANALYTICS_REPORT_ROW.DATE_RANGE_SESSIONS_COMPLETED,
            row.dateRangeSessionsCompleted
          ],
          [
            ANALYTICS_REPORT_ROW.DATE_RANGE_UNIQUE_STUDENTS_HELPED,
            row.dateRangeUniqueStudentsHelped
          ],
          [
            ANALYTICS_REPORT_ROW.DATE_RANGE_TUTORING_HOURS,
            row.dateRangeTutoringHours
          ],
          [
            ANALYTICS_REPORT_ROW.DATE_RANGE_TRAINING_HOURS,
            row.dateRangeTrainingHours
          ],
          [
            ANALYTICS_REPORT_ROW.DATE_RANGE_ELAPSED_AVAILABILITY_HOURS,
            row.dateRangeElapsedAvailabilityHours
          ],
          [
            ANALYTICS_REPORT_ROW.DATE_RANGE_VOLUNTEER_HOURS,
            row.dateRangeVolunteerHours
          ]
        ])
      })
    },
    mapAnalyticsSummaryHeaders(summary) {
      // Use a Map to preserve key insertion order
      return summary.map(row => {
        return new Map([
          [ANALYTICS_REPORT_SUMMARY.DATE_RANGE_SIGN_UPS, row.dateRangeSignUps],
          [
            ANALYTICS_REPORT_SUMMARY.DATE_RANGE_VOLUNTEERS_ONBOARDED,
            row.dateRangeVolunteersOnboarded
          ],
          [
            ANALYTICS_REPORT_SUMMARY.DATE_RANGE_TEXT_RECEIVED,
            row.dateRangeTextsReceived
          ],
          [
            ANALYTICS_REPORT_SUMMARY.DATE_RANGE_SESSIONS_COMPLETED,
            row.dateRangeSessionsCompleted
          ],
          [
            ANALYTICS_REPORT_SUMMARY.DATE_RANGE_VOLUNTEER_HOURS,
            row.dateRangeVolunteerHours
          ],
          [
            ANALYTICS_REPORT_SUMMARY.DATE_RANGE_UNIQUE_STUDENTS_HELPED,
            row.dateRangeUniqueStudentsHelped
          ],
          [ANALYTICS_REPORT_SUMMARY.TOTAL_SIGN_UPS, row.totalSignUps],
          [
            ANALYTICS_REPORT_SUMMARY.TOTAL_VOLUNTEERS_ONBORDED,
            row.totalVolunteersOnboarded
          ],
          [
            ANALYTICS_REPORT_SUMMARY.TOTAL_TEXTS_RECEIVED,
            row.totalTextsReceived
          ],
          [
            ANALYTICS_REPORT_SUMMARY.TOTAL_SESSIONS_COMPLETED,
            row.totalSessionsCompleted
          ],
          [
            ANALYTICS_REPORT_SUMMARY.TOTAL_VOLUNTEER_HOURS,
            row.totalVolunteerHours
          ],
          [
            ANALYTICS_REPORT_SUMMARY.TOTAL_UNIQUE_STUDENTS_HELPED,
            row.totalUniqueStudentsHelped
          ]
        ])
      })
    }
  },
  computed: {
    todaysDate() {
      return moment().format('MMMM_D')
    },
    isValidVolunteerPartnerOrg() {
      return this.volunteerPartnerOrg && this.volunteerPartnerOrg.key
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-reports {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
}

input {
  min-width: 180px;
}

.filter-panel {
  @include flex-container(column, space-between, flex-start);
  flex-wrap: wrap;
  border-radius: 8px;

  &__row {
    @include flex-container(row);
  }

  &__session-range {
    @include flex-container(row);
  }

  &__partner-select,
  &__high-school-list {
    width: 400px;
  }
}

.col {
  @include flex-container(column, flex-start, flex-start);
  margin: 0.4em 0;
  padding-left: 0;
  @include breakpoint-above('medium') {
    margin-right: 10px;
  }
}

.report-btn {
  height: 60px;
  background-color: white;
  border: 1px solid $c-border-grey;
  font-size: 16px;
  font-weight: 600;
  color: $c-success-green;
  width: 250px;
  margin-bottom: 1em;
  display: block;

  &:hover {
    background-color: $c-success-green;
    color: white;
  }

  &:disabled {
    color: $c-background-grey;
    background-color: $c-secondary-grey;
  }
}

.error {
  color: $c-error-red;
  text-align: left;
  margin: 2em 0;
  font-size: 16px;
}
</style>
