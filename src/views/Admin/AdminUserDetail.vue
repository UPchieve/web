<template>
  <div v-if="user._id" class="user-detail">
    <admin-edit-user
      v-if="isEditMode"
      :user="user"
      :toggleEditMode="toggleEditMode"
      :getUser="getUser"
    />
    <admin-pending-volunteer-detail
      v-else-if="user.isVolunteer && !user.isApproved"
      :toggleEditMode="toggleEditMode"
      :volunteer="user"
    />
    <template v-else>
      <div class="user-detail__body">
        <button class="edit-btn btn" @click="toggleEditMode()">
          Edit
        </button>
        <div>
          <span
            v-if="user.isAdmin"
            class="user-detail__account-notice user-detail__account-notice--admin"
            >Admin</span
          >
          <span
            v-if="user.isBanned"
            class="user-detail__account-notice user-detail__account-notice--ban"
            >Banned</span
          >
          <span
            v-if="user.isDeactivated"
            class="user-detail__account-notice user-detail__account-notice--deactivated"
            >Deactivated</span
          >
          <span
            v-if="user.isTestUser"
            class="user-detail__account-notice user-detail__account-notice--test"
            >Test account</span
          >
          <span
            v-if="user.isFakeUser"
            class="user-detail__account-notice user-detail__account-notice--fake"
            >Fake account</span
          >
        </div>
        <div class="user-detail__title">
          {{ user.firstname }} {{ user.lastname }}
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
        <div v-if="user.zipCode" class="user-detail__section">
          <div class="user-detail__section-title">Zip code</div>
          <div>{{ user.zipCode }}</div>
        </div>
        <div v-if="user.isVolunteer" class="user-detail__section">
          <div class="user-detail__section-title">Background Information</div>
          <div v-if="!user.background">--</div>
          <background-info v-else :user="user" />
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
import moment from "moment";
import NetworkService from "@/services/NetworkService";
import SessionsList from "@/components/Admin/SessionsList";
import BackgroundInfo from "@/components/Admin/BackgroundInfo";
import AdminPendingVolunteerDetail from "@/views/Admin/AdminPendingVolunteerDetail";
import AdminEditUser from "@/views/Admin/AdminEditUser";
import PageControl from "@/components/Admin/PageControl";

const getUser = async (userId, page) => {
  const {
    body: { user }
  } = await NetworkService.adminGetUser(userId, page);

  return user;
};

export default {
  name: "AdminUserDetail",

  components: {
    AdminPendingVolunteerDetail,
    SessionsList,
    BackgroundInfo,
    AdminEditUser,
    PageControl
  },

  data() {
    return {
      user: {},
      isEditMode: false,
      page: 1
    };
  },

  async created() {
    window.addEventListener("keyup", this.goBack);
    const { page } = this.$route.query;
    this.page = parseInt(page) || this.page;
    this.getUser();
  },

  beforeDestroy() {
    window.removeEventListener("keyup", this.goBack);
  },

  computed: {
    createdAt() {
      return moment(this.user.createdAt).format("l, h:mm a");
    },

    partnerOrg() {
      if (this.user.isVolunteer) return this.user.volunteerPartnerOrg;
      else return this.user.studentPartnerOrg;
    },

    schoolName() {
      const school = this.user.approvedHighschool;
      if (!school) return null;

      return school.nameStored ? school.nameStored : school.SCH_NAME;
    },
    isFirstPage() {
      return this.page === 1;
    },
    sortedPastSessions() {
      const descendingPastSessions = [];
      for (let i = this.user.pastSessions.length - 1; i >= 0; i--) {
        const session = this.user.pastSessions[i];
        descendingPastSessions.push(session);
      }

      return descendingPastSessions;
    }
  },
  methods: {
    toggleEditMode() {
      this.isEditMode = !this.isEditMode;
    },
    setPage(page) {
      this.page = page;
      this.getUser();
    },
    nextPage() {
      this.setPage(this.page + 1);
    },
    previousPage() {
      this.setPage(this.page - 1);
    },
    goBack(event) {
      // If backspace button is pressed go back
      if (event.keyCode === 8) this.$router.go(-1);
    },
    async getUser() {
      const pageLimit = 10;
      this.user = await getUser(this.$route.params.userId, this.page);
      this.isLastPage = pageLimit * this.page >= this.user.numPastSessions;

      // show page query in the url if the user has had past sessions
      if (this.user.numPastSessions > 0)
        this.$router.push({
          path: `/admin/users/${this.user._id}`,
          query: { page: this.page }
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.user-detail {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
  max-width: 800px;

  @include breakpoint-above("medium") {
    margin: 40px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 15px;

    @include breakpoint-above("medium") {
      padding: 40px;
    }
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

.edit-btn {
  @include font-category("body");
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
