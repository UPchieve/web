<template>
  <div v-if="school._id" class="school-detail">
    <admin-edit-school
      v-if="isEditMode"
      :school="school"
      :toggleEditMode="toggleEditMode"
      :getSchool="getSchool"
    />
    <template v-else>
      <div class="school-detail__body">
        <div class="page-control">
          <div class="page-control__back-button" @click="goBack">
            <span>← Back</span>
          </div>
          <button
            type="button"
            class="page-control__edit-button btn"
            @click="toggleEditMode()"
          >
            Edit
          </button>
        </div>
        <div class="school-detail__title">
          {{ school.name }}
        </div>
        <div class="school-detail__subtitle">ID: {{ school._id }}</div>
        <div class="school-detail__section">
          <div class="school-detail__section-title">City</div>
          <div>{{ school.city }}</div>
        </div>
        <div class="school-detail__section">
          <div class="school-detail__section-title">State</div>
          <div>{{ school.state }}</div>
        </div>
        <div class="school-detail__section">
          <div class="school-detail__section-title">Zip code</div>
          <div>{{ school.zip }}</div>
        </div>
        <div class="school-detail__section">
          <div class="school-detail__section-title">Status</div>
          <div class="uc-row">
            <label for="toggleSchoolApproved"
              >Admin Approved:
              <input
                type="checkbox"
                id="toggleSchoolApproved"
                class="checkbox"
                :checked="school.isAdminApproved"
                @change="toggleSchoolApproved"
              />
              <span class="switch"></span>
            </label>
          </div>
          <div class="uc-row">
            <label for="togglePartnerSchool"
              >Partner School:
              <input
                type="checkbox"
                id="togglePartnerSchool"
                class="checkbox"
                :checked="school.isPartner"
                @change="toggleSchoolPartner"
              />
              <span class="switch"></span>
            </label>
          </div>
          <div v-if="toggleSchoolPartnerError" class="error">
            {{ toggleSchoolPartnerError }}
          </div>
        </div>
        <div class="school-detail__section">
          <div class="school-detail__section-title">School Properties</div>
          <div>
            Title1 or Title1 Eligible:
            {{ school.isSchoolWideTitle1 || school.isTitle1Eligible }}
          </div>
          <div>
            National School Lunch Program:
            {{ school.nationalSchoolLunchProgram }}
          </div>
          <div>Total Students: {{ school.totalStudents }}</div>
          <div>
            Free/Reduced Lunch Eligible Students: {{ school.frlEligible }}
          </div>
          <div>
            NSLP Direct Certification Students:
            {{ school.nslpDirectCertification }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import AdminEditSchool from '@/views/Admin/AdminEditSchool'

export default {
  name: 'AdminSchoolDetail',

  components: { AdminEditSchool },

  data() {
    return {
      school: {},
      toggleSchoolApprovedError: '',
      toggleSchoolPartnerError: '',
      isEditMode: false,
    }
  },

  async created() {
    this.getSchool()
  },

  methods: {
    goBack() {
      this.$router.go(-1)
    },
    async toggleSchoolApproved(event) {
      this.toggleSchoolApprovedError = ''

      const {
        target: { checked },
      } = event

      const data = {
        schoolId: this.school._id,
        isApproved: checked,
      }

      try {
        await NetworkService.adminUpdateSchoolApproval(data)
        this.school.isAdminApproved = checked
      } catch (error) {
        this.toggleSchoolApprovedError =
          "There was an error updating the school's approval status"
      }
    },
    async toggleSchoolPartner(event) {
      this.toggleSchoolPartnerError = ''

      const {
        target: { checked },
      } = event

      const data = {
        schoolId: this.school._id,
        isPartner: checked,
      }

      try {
        await NetworkService.adminUpdateSchoolPartnerStatus(data)
        this.school.isPartner = checked
      } catch (error) {
        this.toggleSchoolPartnerError =
          "There was an error updating the school's partner status"
      }
    },

    toggleEditMode() {
      this.isEditMode = !this.isEditMode
    },

    async getSchool() {
      const schoolId = this.$route.params.schoolId

      const {
        data: { school },
      } = await NetworkService.adminGetSchool(schoolId)

      this.school = school
    },
  },
}
</script>

<style lang="scss" scoped>
.school-detail {
  background: #fff;
  margin-top: 10px;
  border-radius: 8px;
  padding: 10px;
  max-width: 800px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  &__title {
    text-transform: capitalize;
    font-size: 24px;
    margin-top: 20px;
  }

  &__subtitle {
    color: $c-secondary-grey;
    font-size: 18px;
  }

  &__section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 10px 0;
    font-size: 18px;
  }

  &__section-title {
    color: $c-secondary-grey;
    font-size: 16px;
  }
}

.page-control {
  @include flex-container(row, space-between, center);
  width: 100%;

  &__back-button {
    display: inline-flex;
    align-items: center;
    color: #417db1;
    border-radius: 20px;
    padding: 5px 15px;
    cursor: pointer;

    &:hover {
      background: #f7fcfe;
    }
  }

  &__edit-button {
    @include font-category('body');
    background-color: $c-success-green;
    border-radius: 30px;
    width: 120px;
    height: 40px;
    font-weight: 600;
    color: white;
    &:hover {
      color: #2c3e50;
    }
  }
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  margin-left: 5px;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 20px;
  transition: all 0.3s;

  &::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: white;
    top: 1px;
    left: 1px;
    transition: all 0.3s;
  }
}

.checkbox:checked + .switch::after {
  left: 20px;
}
.checkbox:checked + .switch {
  background-color: $c-success-green;
}
.checkbox {
  display: none;
}

.error {
  @include font-category('helper-text');
  color: $c-error-red;
  text-align: left;
}

label {
  margin-bottom: 0;
}
</style>
