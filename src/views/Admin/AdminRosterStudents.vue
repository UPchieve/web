<template>
  <div class="card">
    <h1>Roster Students</h1>
    <div
      v-if="msg"
      class="alert alert-success"
      :class="{
        'alert-danger': isError,
        'alert-warning': isWarning,
      }"
      role="alert"
    >
      {{ msg }}
    </div>
    <p>Create, update, or deactivate student profiles for a partner school.</p>
    <p>
      Rows with an email unassociated with any existing account will create a
      new account. Rows with an email associated with an existing account will
      update the associated account with values from the CSV. Rows with a value
      in <code>deactivatedOn</code> will first update the account with values
      from the CSV and then deactivate the student's partner org instance for
      this school as of that timestamp.
    </p>
    <p>
      Before submitting, please make sure the CSV file with the list of students
      has the proper fields, and the columns are labeled correctly.
    </p>
    <ul>
      <li><code>firstName</code> - required</li>
      <li><code>lastName</code> - required</li>
      <li>
        <code>gradeLevel</code> - required. Format as just the grade number, for
        e.g. <code>6</code> for 6th grade.
      </li>
      <li><code>email</code> - required</li>
      <li>
        <code>proxyEmail</code> - optional, but required if students are NOT
        able to receive emails from us.
        <ul>
          <li>
            The owner of the proxy email address will only receive
            password-related emails, i.e. password reset, or the initial "Set
            Password" email (if no password is provided for students).
          </li>
        </ul>
      </li>
      <li>
        <code>password</code> - optional, but required if students can't receive
        our emails and the <code>proxyEmail</code> is not willing to forward
        "Set Password" emails to students.
      </li>
      <li>
        <code>deactivatedOn</code> - optional. If set to a timestamp (e.g.
        <code>2026-05-12</code> or a full ISO date like
        <code>2026-05-12T00:00:00Z</code>), the student's partner org instance
        for the selected school is deactivated as of that timestamp. The student
        must already exist; the row will fail otherwise.
      </li>
    </ul>

    <form @submit.prevent="submit()" autocomplete="off">
      <div class="uc-form-element">
        <FormSelect
          id="partnerSchool"
          class="uc-form-select-input"
          label="School"
          placeholder="Select the partner school"
          v-model="partnerSchool"
          :options="partnerSchools"
          :is-required="true"
          option-text-field="schoolName"
        />
      </div>

      <div v-if="showPartnerSiteSelection()" class="uc-form-element">
        <FormSelect
          id="partnerSite"
          class="uc-form-select-input"
          placeholder="Select the partner site"
          v-model="partnerSite"
          label="Site"
          :options="getPartnerSites()"
          option-text-field="name"
          :is-required="true"
        />
      </div>

      <div class="uc-form-element">
        <label for="students">CSV File</label>
        <input
          id="students"
          type="file"
          accept=".csv"
          @change="updateFile"
          name="studentsFile"
          required
        />
      </div>

      <button
        class="uc-form-button"
        type="submit"
        :disabled="disableSubmit() ? true : null"
      >
        Submit
      </button>
    </form>

    <loader v-if="isSubmitting" overlay />
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'AdminRosterStudents',
  components: {
    Loader,
    FormSelect,
  },
  data() {
    return {
      isSubmitting: false,
      msg: '',
      isError: false,
      isWarning: false,
      partnerSchools: [],
      partnerSchool: null,
      partnerSite: null,
      studentDataFile: null,
    }
  },
  async mounted() {
    const { data } = await NetworkService.adminGetPartnerSchools()
    this.partnerSchools = data.sort((a, b) => a.schoolName > b.schoolName)
  },
  methods: {
    clearData() {
      this.partnerSchool = null
      this.partnerSite = null
      this.studentDataFile = null
    },
    getPartnerSites() {
      return this.partnerSchool?.partnerSites ?? []
    },
    showPartnerSiteSelection() {
      return this.getPartnerSites().length > 0
    },
    disableSubmit() {
      return !this.partnerSchool || !this.studentDataFile || this.isSubmitting
    },
    updateFile(event) {
      if (event.target.files.length) {
        this.studentDataFile = event.target.files[0]
      }
    },
    async submit() {
      this.isSubmitting = true
      this.msg = ''
      this.isError = false
      this.isWarning = false

      const formData = new FormData()
      formData.append('studentsFile', this.studentDataFile)
      formData.append('schoolId', this.partnerSchool.schoolId)
      formData.append('partnerKey', this.partnerSchool.partnerKey)
      if (this.partnerSite) {
        formData.append('partnerSite', this.partnerSite)
      }

      try {
        const { data } =
          await NetworkService.adminUploadRosterStudents(formData)

        const segments = []
        if (data.created?.length) {
          segments.push(
            `Created: ${data.created.map((u) => u.email).join(', ')}`
          )
        }
        if (data.updated?.length) {
          segments.push(
            `Updated: ${data.updated.map((u) => u.email).join(', ')}`
          )
        }
        if (data.deactivated?.length) {
          segments.push(
            `Deactivated: ${data.deactivated.map((u) => u.email).join(', ')}`
          )
        }
        if (data.failed?.length) {
          this.isWarning = true
          const entries = data.failed
            .map((u) => (u.reason ? `${u.email} (${u.reason})` : u.email))
            .join(', ')
          segments.push(`Failed: ${entries}`)
        }

        this.msg = [this.isWarning ? 'Warning!' : 'Success!', ...segments].join(
          '\n'
        )
      } catch (error) {
        this.msg = error.response.data.err
        this.isError = true
      } finally {
        this.clearData()
        this.isSubmitting = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.card {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
}

.alert {
  margin: 25px 0;
  white-space: pre-line;
}
</style>
