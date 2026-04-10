<template>
  <div class="edit-container">
    <button class="back-button" @click="goBack" type="button">← Back</button>

    <loader v-if="isLoading" />
    <form v-else autocomplete="off" class="col" @submit="submitUpdate">
      <div class="row">
        <label for="first-name" class="uc-form-label">First name</label>
        <input
          id="first-name"
          type="text"
          autocomplete="off"
          v-model="firstName"
        />
      </div>
      <div class="row">
        <label for="last-name" class="uc-form-label">Last name</label>
        <input
          id="last-name"
          type="text"
          autocomplete="off"
          v-model="lastName"
        />
      </div>
      <div class="row">
        <label for="email" class="uc-form-label">Email</label>
        <input id="email" type="text" autocomplete="off" v-model="email" />
      </div>
      <div class="row" v-if="hasStudentRole || hasVolunteerRole">
        <FormSelect
          label="Partner org"
          id="partner-org"
          :options="listedPartnerOrgs"
          v-model="partnerOrg"
          option-text-field="displayName"
        />
        <div class="clear-button-container">
          <button type="button" class="clear-button" @click="clearPartnerOrg">
            Clear
          </button>
        </div>
      </div>
      <div class="row" v-if="hasStudentRole && partnerOrg && partnerOrg.sites">
        <FormSelect
          label="Partner Site"
          id="partner-sites"
          :options="partnerOrg.sites"
          v-model="partnerSite"
        />
      </div>

      <div class="row" v-if="hasStudentRole">
        <FormSelect
          label="Partner School"
          id="partner-school"
          :options="listedPartnerSchools"
          option-text-field="displayName"
          v-model="partnerSchool"
        />
      </div>

      <div class="row" v-if="isTeacher">
        <FormSchoolSearch
          v-model="school.id"
          :defaultValue="school.name"
          :hasDefaultValue="true"
          :isRequired="false"
          startSearchEvent=""
          cannotFindSchoolEvent=""
          selectedEvent=""
        />
      </div>

      <div class="row">
        <FormSelect
          label="Verified"
          id="verified"
          name="verified"
          :options="options"
          option-text-field="text"
          v-model="isVerified"
          :reduce="(option) => option.value"
        />
      </div>
      <div class="row">
        <FormSelect
          label="Banned"
          id="banned"
          name="banned"
          v-model="banType"
          :options="banOptions"
          option-text-field="text"
          data-testid="admin-edit-user-banned"
          :reduce="(option) => option.value"
        />
      </div>
      <div class="row">
        <FormSelect
          label="Deactivated"
          id="deactivated"
          name="deactivated"
          v-model="isDeactivated"
          :options="options"
          option-text-field="text"
          :reduce="(option) => option.value"
        />
      </div>
      <div class="row" v-if="hasVolunteerRole">
        <FormSelect
          id="approved"
          name="approved"
          label="Approved"
          v-model="isApproved"
          :options="options"
          option-text-field="text"
          :reduce="(option) => option.value"
        />
      </div>
      <p class="error" v-if="error">{{ error }}</p>
      <button class="uc-form-button" type="submit">Update</button>
    </form>
  </div>
</template>

<script>
import { isEmpty } from 'lodash-es'
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import Loader from '@/components/Loader.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import NetworkService from '@/services/NetworkService'
import {
  isTeacherUserType,
  hasStudentRole,
  hasVolunteerRole,
  isStudentVolunteer,
} from '@/utils/user-type'

export default {
  name: 'AdminEditUser',
  components: { FormSchoolSearch, Loader, FormSelect },

  props: {
    user: { type: Object, required: true },
    toggleEditMode: { type: Function, required: true },
    getUser: { type: Function, required: true },
  },

  data() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      partnerOrg: {},
      partnerSchool: {},
      partnerSite: '',
      isVerified: false,
      banType: null,
      isDeactivated: false,
      isApproved: false,
      options: [
        { text: 'False', value: false },
        { text: 'True', value: true },
      ],
      banOptions: [],
      listedPartnerOrgs: [],
      listedPartnerSchools: [],
      school: {
        id: '',
        name: '',
      },
      isLoading: false,
      error: '',
    }
  },

  computed: {
    isTeacher() {
      return isTeacherUserType(this.user.userType)
    },
    hasStudentRole() {
      return hasStudentRole(this.user?.roles ?? [])
    },
    hasVolunteerRole() {
      return hasVolunteerRole(this.user?.roles ?? [])
    },
    isStudentVolunteer() {
      return isStudentVolunteer(this.user?.roles ?? [])
    },
  },

  async created() {
    this.isLoading = true
    try {
      this.banOptions =
        (this.hasVolunteerRole && !this.isStudentVolunteer) || this.isTeacher
          ? [
              { text: 'None', value: null },
              { text: 'Complete Ban', value: 'complete' },
              { text: 'Live Media Ban', value: 'live_media' },
            ]
          : [
              { text: 'None', value: null },
              { text: 'Complete Ban', value: 'complete' },
              { text: 'Shadow Ban', value: 'shadow' },
              { text: 'Live Media Ban', value: 'live_media' },
            ]

      let activeSchoolPartnerName = ''

      if (this.hasVolunteerRole && !this.hasStudentRole) {
        const response = await NetworkService.adminGetVolunteerPartners()
        const {
          data: { partnerOrgs },
        } = response
        this.listedPartnerOrgs = partnerOrgs
      } else if (this.hasStudentRole) {
        const response = await NetworkService.adminGetStudentPartners()
        const {
          data: { partnerOrgs },
        } = response
        const activeSchoolPartnerResponse =
          await NetworkService.adminGetActivePartnersForStudent(this.user.id)
        const {
          data: { activePartners },
        } = activeSchoolPartnerResponse

        const listedPartnerOrgs = []
        const listedPartnerSchools = []

        for (const org of partnerOrgs) {
          if (org.isSchool) listedPartnerSchools.push(org)
          else listedPartnerOrgs.push(org)
        }

        this.listedPartnerOrgs = listedPartnerOrgs
        this.listedPartnerSchools = listedPartnerSchools

        for (const partner of activePartners) {
          if (partner.schoolId) activeSchoolPartnerName = partner.name
        }
      } else if (this.isTeacher) {
        const {
          data: { school },
        } = await NetworkService.adminGetSchool(this.user.schoolId)
        this.school = school
      }

      this.firstName = this.user.firstName
      this.lastName = this.user.lastName
      this.email = this.user.email
      this.partnerSite = this.user.partnerSite || ''
      this.isVerified = this.user.verified
      this.banType = this.user.banType ?? null
      this.isDeactivated = this.user.isDeactivated
      this.isApproved = this.user.isApproved
      this.partnerOrg = {}

      for (const org of this.listedPartnerOrgs) {
        if (
          org.name === this.user.studentPartnerOrg ||
          org.name === this.user.volunteerPartnerOrg
        ) {
          this.partnerOrg = org
          break
        }
      }

      for (const org of this.listedPartnerSchools) {
        if (activeSchoolPartnerName === org.name) {
          this.partnerSchool = org
          break
        }
      }
    } catch {
      this.error = 'Failed to set up component. Please refresh and try again.'
    } finally {
      this.isLoading = false
    }
  },

  methods: {
    async submitUpdate(event) {
      this.isLoading = true
      event.preventDefault()
      const data = {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        partnerOrg: isEmpty(this.partnerOrg) ? '' : this.partnerOrg.key,
        partnerSite: '',
        isVerified: this.isVerified,
        banType: this.banType,
        isDeactivated: this.isDeactivated,
        isApproved: this.isApproved,
        partnerSchool: isEmpty(this.partnerSchool)
          ? ''
          : this.partnerSchool.key,
        schoolId: this.school.id,
      }

      if (
        !isEmpty(this.partnerOrg) &&
        this.partnerOrg.sites &&
        this.partnerOrg.sites.includes(this.partnerSite)
      ) {
        data.partnerSite = this.partnerSite
      }

      try {
        await NetworkService.adminUpdateUser(this.user.id, data)
        this.getUser()
        this.toggleEditMode()
      } catch {
        this.error = 'There was a problem updating the user.'
      } finally {
        this.isLoading = false
      }
    },
    goBack() {
      this.toggleEditMode()
    },
    clearPartnerOrg(event) {
      event.preventDefault()
      this.partnerOrg = {}
    },
  },
}
</script>

<style lang="scss" scoped>
input,
select {
  width: 400px;
  padding: 0.4em 0;
  padding-left: 0.5em;
  border: 1px solid #d6e0ef;
}

.edit-container {
  text-align: left;
  margin: 40px;
}
.row {
  margin-bottom: 1em;
  margin-left: 0;
}
.uc-form-label {
  width: 100px;
  text-align: left;
}
.uc-form-button {
  margin-top: 2em;
  padding: 1em 1.6em;
  border: 1px solid $c-border-grey;
}

.back-button {
  border: none;
  background-color: transparent;
  color: #417db1;
  padding: 0.4em 1em;
  margin-bottom: 2em;
  cursor: pointer;

  &:hover {
    border-radius: 20px;
    background: #f7fcfe;
  }
}

.error {
  color: $c-error-red;
  margin: 2em 0;
}

.clear-button-container {
  margin-top: 6px;
  width: 100%;
  text-align: right;
}

.clear-button {
  font-size: 14px;
  color: $c-information-blue;
}
</style>
