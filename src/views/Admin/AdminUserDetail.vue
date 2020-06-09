<template>
  <div v-if="user._id" class="user-detail">
    <div class="user-detail__body">
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
      <div v-if="schoolName" class="user-detail__section">
        <div class="user-detail__section-title">School</div>
        <router-link
          v-if="schoolName"
          :to="`/admin/school/${user.approvedHighschool._id}`"
          class="user-detail__section"
        >
          {{ schoolName }}
        </router-link>
      </div>
      <div v-if="user.zipCode" class="user-detail__section">
        <div class="user-detail__section-title">Zip code</div>
        <div>{{ user.zipCode }}</div>
      </div>
    </div>
    <sessions-list
      v-if="user.pastSessions.length"
      :sessions="user.pastSessions"
    />
  </div>
</template>

<script>
import moment from "moment";
import NetworkService from "@/services/NetworkService";
import SessionsList from "@/components/Admin/SessionsList";

const getUser = async userId => {
  const {
    body: { user }
  } = await NetworkService.adminGetUser(userId);

  return user;
};

export default {
  name: "AdminUserDetail",

  components: { SessionsList },

  data() {
    return {
      user: {}
    };
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
    }
  },

  async created() {
    this.user = await getUser(this.$route.params.userId);
  }
};
</script>

<style lang="scss" scoped>
.user-detail {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;

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
</style>
