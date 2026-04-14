<template>
  <div class="admin-reports">
    <div class="filter-panel">
      <div class="col">
        <div class="filter-panel__row">
          <FormDateInput
            label="Joined after"
            v-model="joinedAfter"
            placeholder="mm/dd/yyyy"
          />
          <FormDateInput
            label="Joined before"
            v-model="joinedBefore"
            placeholder="mm/dd/yyyy"
          />
        </div>
      </div>

      <div class="col">
        <div class="filter-panel__row">
          <FormDateInput
            id="session-range-from"
            label="Session From"
            v-model="sessionRangeFrom"
            placeholder="mm/dd/yyyy"
          />
          <FormDateInput
            id="session-range-to"
            label="Session to"
            v-model="sessionRangeTo"
            placeholder="mm/dd/yyyy"
          />
        </div>
      </div>

      <div class="col">
        <div>
          <FormSelect
            id="student-partner-org"
            class="filter-panel__partner-select"
            :options="studentPartnerOrgs"
            label="Student partner org"
            v-model="studentPartnerOrg"
            option-text-field="name"
          />
        </div>
        <div class="col" v-if="studentPartnerOrg && studentPartnerOrg.sites">
          <FormSelect
            id="partner-sites"
            label="Partner Site"
            class="filter-panel__partner-select"
            :options="partnerSites"
            v-model="studentPartnerSite"
          />
        </div>
      </div>
      <div class="col">
        <div>
          <FormSelect
            id="sponsor-org"
            class="filter-panel__partner-select"
            option-text-field="name"
            :options="sponsorOrgs"
            label="Sponsor org"
            v-model="sponsorOrg"
          />
        </div>
      </div>
      <div class="col">
        <div>
          <label for="high-school" class="col">
            High school
            <school-list
              class="filter-panel__high-school-list"
              :setHighSchool="setHighSchool"
              placeholder="Search for a school"
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
      @click="generateSessionReport"
      :disabled="isGeneratingReport ? true : null"
    >
      Generate Session Report
    </button>
    <button
      type="button"
      class="report-btn"
      @click="generateUsageReport"
      :disabled="isGeneratingReport ? true : null"
    >
      Generate Usage Report
    </button>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import SchoolList from '@/components/SchoolList.vue'
import Loader from '@/components/Loader.vue'
import { dayjs } from '@/utils/time-utils'
import exportToCsv from '@/utils/export-to-csv'
import FormDateInput from '@/components/FormInputs/FormDateInput.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'

export default {
  name: 'AdminReports',
  components: { SchoolList, Loader, FormDateInput, FormSelect },

  data() {
    return {
      joinedBefore: '',
      joinedAfter: '',
      sessionRangeFrom: '',
      sessionRangeTo: '',
      highSchool: '',
      studentPartnerOrg: {},
      studentPartnerSite: '',
      error: '',
      isGeneratingReport: false,
      studentPartnerOrgs: [],
      sponsorOrgs: [],
      sponsorOrg: '',
    }
  },
  async mounted() {
    const [partnerOrgResponse, sponsorOrgResponse] = await Promise.all([
      await NetworkService.adminGetStudentPartners(),
      await NetworkService.adminGetSponsorOrgs(),
    ])

    const {
      data: { partnerOrgs: studentPartnerOrgs },
    } = partnerOrgResponse
    const {
      data: { sponsorOrgs },
    } = sponsorOrgResponse

    this.studentPartnerOrgs = studentPartnerOrgs
    this.sponsorOrgs = sponsorOrgs
  },
  methods: {
    async generateSessionReport() {
      if (this.isGeneratingReport) return
      this.isGeneratingReport = true
      this.error = ''

      let query
      try {
        query = this.sessionReportQuery()
      } catch (error) {
        this.errorHandler(error.message)
        return
      }

      try {
        const {
          data: { sessions },
        } = await NetworkService.adminGetSessionReport(query)
        if (sessions.length === 0) this.error = 'No sessions meet the criteria'
        else
          exportToCsv(
            `${this.fileTitle}_Session_Report_${this.todaysDate}.csv`,
            sessions
          )

        this.isGeneratingReport = false
      } catch (error) {
        if (error.status === 422) this.errorHandler(error.response.data.err)
        else this.errorHandler()
      }
    },

    async generateUsageReport() {
      if (this.isGeneratingReport) return
      this.isGeneratingReport = true
      this.error = ''

      let query
      try {
        query = this.usageReportQuery()
      } catch (error) {
        this.errorHandler(error.message)
        return
      }

      try {
        const {
          data: { students },
        } = await NetworkService.adminGetUsageReport(query)
        if (students.length === 0) this.error = 'No students meet the criteria'
        else
          exportToCsv(
            `${this.fileTitle}_Usage_Report_${this.todaysDate}.csv`,
            students
          )

        this.isGeneratingReport = false
      } catch (error) {
        if (error.status === 422) this.errorHandler(error.response.data.err)
        else this.errorHandler()
      }
    },
    setHighSchool(highSchool) {
      this.highSchool = highSchool
    },
    formatDate(date) {
      return dayjs(date).utc().startOf('day').format('MM-DD-YYYY')
    },
    isValidDateFormat(date) {
      return dayjs(date, 'MM-DD-YYYY', undefined, true).isValid()
    },
    getQuery() {
      return {
        joinedBefore: this.formatDate(this.joinedBefore),
        joinedAfter: this.formatDate(this.joinedAfter),
        sessionRangeFrom: this.formatDate(this.sessionRangeFrom),
        sessionRangeTo: this.formatDate(this.sessionRangeTo),
        highSchoolId: this.highSchool.id ? this.highSchool.id : '',
        studentPartnerOrg: this.isValidStudentPartnerOrg
          ? this.studentPartnerOrg.key
          : '',
        studentPartnerSite: this.isValidPartnerSite
          ? this.studentPartnerSite
          : '',
        sponsorOrg: this.isValidSponsorOrg ? this.sponsorOrg.key : '',
      }
    },
    validSessionDateRanges(query) {
      if (!this.isValidDateFormat(query.sessionRangeFrom))
        throw new Error('Please enter a date for "Session from"')
      if (!this.isValidDateFormat(query.sessionRangeTo))
        throw new Error('Please enter a date for "Session to"')
    },
    validJoinedDateRanges(query) {
      if (!this.isValidDateFormat(query.joinedAfter))
        throw new Error('Please enter a date for "Joined after"')
      if (!this.isValidDateFormat(query.joinedBefore))
        throw new Error('Please enter a date for "Joined before"')
    },
    sessionReportQuery() {
      const query = this.getQuery()
      this.validSessionDateRanges(query)
      return query
    },
    usageReportQuery() {
      const query = this.getQuery()
      this.validJoinedDateRanges(query)
      this.validSessionDateRanges(query)
      return query
    },
    errorHandler(errorMessage = '') {
      this.isGeneratingReport = false
      this.error = errorMessage
        ? errorMessage
        : 'There was a problem with retrieving the report'
    },
  },
  computed: {
    todaysDate() {
      return dayjs().format('MMMM_D')
    },
    fileTitle() {
      let title = ''
      if (this.highSchool.name) title = this.highSchool.name
      if (this.studentPartnerOrg && this.studentPartnerOrg.name)
        title = this.studentPartnerOrg.name
      if (this.sponsorOrg && this.sponsorOrg.name) title = this.sponsorOrg.name
      if (this.isValidPartnerSite) title = this.studentPartnerSite

      return title
    },
    partnerSites() {
      if (this.studentPartnerOrg && this.studentPartnerOrg.sites)
        return ['All sites', ...this.studentPartnerOrg.sites]
      return []
    },
    isValidPartnerSite() {
      return (
        this.studentPartnerOrg &&
        this.studentPartnerOrg.sites &&
        this.studentPartnerOrg.sites.includes(this.studentPartnerSite)
      )
    },
    isValidStudentPartnerOrg() {
      return this.studentPartnerOrg && this.studentPartnerOrg.key
    },
    isValidSponsorOrg() {
      return this.sponsorOrg && this.sponsorOrg.key
    },
  },
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
    gap: 16px;
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
  margin: 64px 0;
  font-size: 16px;
}
</style>
