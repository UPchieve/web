<template>
  <div class="card">
    <h1>Roster Students</h1>
    <div
      v-if="msg"
      class="alert alert-success"
      :class="{
        'alert-danger': isError,
      }"
      role="alert"
    >
      {{ msg }}
    </div>
    <p>Create student profiles for a partner school.</p>
    <p>
      Before submitting, please make sure the CSV file with the list of students
      has the proper fields, and the columns are labeled correctly.
    </p>
    <ul>
      <li><code>firstName</code> - required</li>
      <li><code>lastName</code> - required</li>
      <li>
        <code>gradeLevel</code> - required. Format as e.g. <code>6th</code>
      </li>
      <li><code>email</code> - required</li>
      <li>
        <code>proxyEmail</code> - required if students are NOT able to receive
        emails from us.
        <ul>
          <li>
            The owner of the proxy email address will only receive
            password-related emails, i.e. password reset, or the initial "Set
            Password" email (if no password is provided for students).
          </li>
        </ul>
      </li>
      <li>
        <code>password</code> - required if students can't receive our emails
        and the <code>proxyEmail</code> is not willing to forward "Set Password"
        emails to students.
      </li>
    </ul>

    <form @submit.prevent="submit()">
      <div class="uc-form-element">
        <label for="partnerSchool">School</label>
        <v-select
          id="partnerSchool"
          class="uc-form-select-input"
          placeholder="Select the partner school"
          v-model="partnerSchool"
          label="schoolName"
          :options="partnerSchools"
          :searchable="false"
          :clearable="false"
          required
        ></v-select>
      </div>

      <div v-if="showPartnerSiteSelection()" class="uc-form-element">
        <label for="partnerSite">Site</label>
        <v-select
          id="partnerSite"
          class="uc-form-select-input"
          placeholder="Select the partner site"
          v-model="partnerSite"
          label="name"
          :options="getPartnerSites()"
          :searchable="false"
          :clearable="false"
          required
        ></v-select>
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

      <button class="uc-form-button" type="submit" :disabled="disableSubmit()">
        Submit
      </button>
    </form>

    <loader v-if="isSubmitting" overlay />
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import Loader from '@/components/Loader'

export default {
  name: 'AdminRosterStudents',
  components: {
    Loader,
  },
  data() {
    return {
      isSubmitting: false,
      msg: '',
      isError: true,
      partnerSchools: [],
      partnerSchool: null,
      partnerSite: null,
      studentDataFile: null,
    }
  },
  async mounted() {
    const { body } = await NetworkService.adminGetPartnerSchools()
    this.partnerSchools = body
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

      const formData = new FormData()
      formData.append('studentsFile', this.studentDataFile)
      formData.append('schoolId', this.partnerSchool.schoolId)
      formData.append('partnerKey', this.partnerSchool.partnerKey)
      formData.append('partnerSite', this.partnerSite)

      try {
        await NetworkService.adminUploadRosterStudents(formData)
        this.msg = 'Success!'
        this.clearData()
      } catch (error) {
        this.msg = error.body.err
        this.isError = true
      } finally {
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
}
</style>
