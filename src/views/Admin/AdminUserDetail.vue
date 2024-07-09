<template>
  <div v-if="user._id" class="user-detail">
    <admin-edit-user
      v-if="isEditMode"
      :user="user"
      :toggleEditMode="toggleEditMode"
      :getUser="getUser"
    />
    <admin-pending-volunteer-detail
      v-else-if="isVolunteer && !user.isApproved"
      :toggleEditMode="toggleEditMode"
      :volunteer="user"
    />
    <template v-else>
      <div class="user-detail__body">
        <div class="user-detail__buttons-section">
          <button class="back-button" @click="goBack()" type="button">
            ← Back
          </button>
          <button type="button" class="edit-btn btn" @click="toggleEditMode()">
            Edit
          </button>
        </div>
        <div>
          <span
            v-if="user.isAdmin"
            class="user-detail__account-notice user-detail__account-notice--admin"
            data-testid="user-detail-label-admin"
            >Admin</span
          >
          <span
            v-if="user.banType === 'complete'"
            class="user-detail__account-notice user-detail__account-notice--ban"
            data-testid="user-detail-label-banned"
            >Banned</span
          >
          <span
            v-if="user.banType === 'shadow'"
            class="user-detail__account-notice user-detail__account-notice--shadowban"
            data-testid="user-detail-label-shadowbanned"
            >Shadow Banned</span
          >
          <span
            v-if="user.isDeactivated"
            class="user-detail__account-notice user-detail__account-notice--deactivated"
            data-testid="user-detail-label-deactivated"
            >Deactivated</span
          >
          <span
            v-if="user.isTestUser"
            class="user-detail__account-notice user-detail__account-notice--test"
            data-testid="user-detail-label-test"
            >Test account</span
          >
          <span
            v-if="user.isFakeUser"
            class="user-detail__account-notice user-detail__account-notice--fake"
            data-testid="user-detail-label-fake"
            >Fake account</span
          >
        </div>
        <div class="user-detail__title">
          {{ user.firstName }} {{ user.lastName }}
        </div>
        <div class="user-detail__subtitle">ID: {{ user._id }}</div>
        <div class="user-detail__section">
          <div class="user-detail__section-title">Joined</div>
          <div>{{ createdAt }}</div>
        </div>
        <div class="user-detail__section">
          <div class="user-detail__section-title">Email</div>
          <div>{{ user.email }}</div>
        </div>
        <div v-if="partnerOrg" class="user-detail__section">
          <div class="user-detail__section-title">Partner organization</div>
          <div>{{ partnerOrg }}</div>
        </div>
        <div v-if="user.partnerSite" class="user-detail__section">
          <div class="user-detail__section-title">Partner site</div>
          <div>{{ user.partnerSite }}</div>
        </div>
        <div v-if="schoolName" class="user-detail__section">
          <div class="user-detail__section-title">School</div>
          <div>{{ schoolName }}</div>
        </div>
        <div v-if="user.currentGrade" class="user-detail__section">
          <div class="user-detail__section-title">Grade level</div>
          <div>{{ user.currentGrade }}</div>
        </div>
        <div v-if="user.zipCode" class="user-detail__section">
          <div class="user-detail__section-title">Zip code</div>
          <div>{{ user.zipCode }}</div>
        </div>
        <div v-if="isVolunteer" class="user-detail__section">
          <div class="user-detail__section-title">Background Information</div>
          <div v-if="user.background.occupation">
            <div class="user-detail__subtitle">
              Occupation: {{ user.background.occupation.toString() }}
            </div>
          </div>
          <div v-if="user.background.college">
            <div class="user-detail__subtitle">
              College/University: {{ user.background.college }}
            </div>
          </div>
          <div v-if="user.background.company">
            <div class="user-detail__subtitle">
              Company: {{ user.background.company }}
            </div>
          </div>
          <div v-if="user.background.linkedInUrl">
            <div class="user-detail__subtitle">
              LinkedIn Url: {{ user.background.linkedInUrl }}
            </div>
          </div>
          <div v-if="user.background.country">
            <div class="user-detail__subtitle">
              Country: {{ user.background.country }}
            </div>
          </div>
          <div v-if="user.background.state">
            <div class="user-detail__subtitle">
              State: {{ user.background.state }}
            </div>
          </div>
          <div v-if="user.background.city">
            <div class="user-detail__subtitle">
              City: {{ user.background.city }}
            </div>
          </div>
          <div v-if="user.background.experience">
            <div class="user-detail__subtitle">
              Experience: Tutoring: {{ user.background.experience.tutoring }},
              College Counseling:
              {{ user.background.experience.collegeCounseling }}, Mentoring:
              {{ user.background.experience.mentoring }}
            </div>
          </div>
          <div v-if="user.background.languages">
            <div class="user-detail__subtitle">
              Languages: {{ user.background.languages.toString() }}
            </div>
          </div>
        </div>
      </div>
      <page-control
        :page="page"
        :isFirstPage="isFirstPage"
        :isLastPage="isLastPage"
        @nextPage="nextPage"
        @previousPage="previousPage"
        :showPageNumber="user.pastSessions.length > 0"
      />
      <sessions-list
        v-if="user.pastSessions.length"
        :sessions="sortedPastSessions"
      />
    </template>
  </div>
</template>

<script>
import moment from 'moment'
import NetworkService from '@/services/NetworkService'
import SessionsList from '@/components/Admin/SessionsList.vue'
import AdminPendingVolunteerDetail from '@/views/Admin/AdminPendingVolunteerDetail.vue'
import AdminEditUser from '@/views/Admin/AdminEditUser.vue'
import PageControl from '@/components/Admin/PageControl.vue'
import { isVolunteerUserType, isStudentUserType } from '@/utils/user-type'

const getUser = async (userId, page) => {
  const { data } = await NetworkService.adminGetUser(userId, page)
  return data
}

export default {
  name: 'AdminUserDetail',

  components: {
    AdminPendingVolunteerDetail,
    SessionsList,
    AdminEditUser,
    PageControl,
  },

  data() {
    return {
      user: {},
      isEditMode: false,
      page: 1,
    }
  },

  async created() {
    const { page } = this.$route.query
    this.page = parseInt(page) || this.page
    this.getUser()
  },

  computed: {
    isVolunteer() {
      return isVolunteerUserType(this.user.userType)
    },
    isStudent() {
      return isStudentUserType(this.user.userType)
    },

    createdAt() {
      return moment(this.user.createdAt).format('l, h:mm a')
    },

    partnerOrg() {
      if (this.isVolunteer) return this.user.volunteerPartnerOrg
      else if (this.isStudent) return this.user.studentPartnerOrg

      return ''
    },

    schoolName() {
      const school = this.user.approvedHighSchool
      if (!school) return null

      return school.nameStored ? school.nameStored : school.SCH_NAME
    },
    isFirstPage() {
      return this.page === 1
    },
    sortedPastSessions() {
      const descendingPastSessions = []
      for (let i = this.user.pastSessions.length - 1; i >= 0; i--) {
        const session = this.user.pastSessions[i]
        descendingPastSessions.push(session)
      }

      return descendingPastSessions
    },
  },
  methods: {
    toggleEditMode() {
      this.isEditMode = !this.isEditMode
    },
    setPage(page) {
      this.page = page
      this.getUser()
    },
    nextPage() {
      this.setPage(this.page + 1)
    },
    previousPage() {
      this.setPage(this.page - 1)
    },
    goBack() {
      this.$router.go(-1)
    },
    async getUser() {
      const pageLimit = 10
      this.user = await getUser(this.$route.params.userId, this.page)
      this.isLastPage = pageLimit * this.page >= this.user.numPastSessions

      // show page query in the url if the user has had past sessions
      if (this.user.numPastSessions > 0)
        this.$router.push({
          path: `/admin/users/${this.user._id}`,
          query: { page: this.page },
        })
    },
  },
}
</script>

<style lang="scss" scoped>
.user-detail {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
  max-width: 800px;

  @include breakpoint-above('medium') {
    margin: 40px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 15px;

    @include breakpoint-above('medium') {
      padding: 40px;
    }
  }

  &__buttons-section {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  &__title {
    text-transform: capitalize;
    font-size: 24px;
    margin-top: 20px;
  }

  &__subtitle {
    color: $c-secondary-grey;
    font-size: 18px;
    margin-bottom: 20px;
  }

  &__account-notice {
    margin-right: 8px;
    font-size: 14px;
    border-radius: 3px;
    background: #000;
    color: #fff;
    padding: 5px 7px;
    font-weight: 500;

    &--ban {
      background: $c-error-red;
    }

    &--shadowban {
      background: $c-warning-orange;
    }

    &--deactivated {
      background: $c-error-red;
    }

    &--test {
      background: $c-warning-orange;
    }

    &--fake {
      background: #9e5fff;
    }

    &--admin {
      background: $c-success-green;
    }
  }

  &__section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 10px 0;
    font-size: 20px;
  }

  &__section-title {
    color: $c-secondary-grey;
    font-size: 16px;
  }
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

.edit-btn {
  @include font-category('body');
  background-color: $c-success-green;
  border-radius: 30px;
  width: 120px;
  height: 40px;
  font-weight: 600;
  color: white;
  margin-left: auto;

  &:hover {
    color: #2c3e50;
  }
}
</style>
