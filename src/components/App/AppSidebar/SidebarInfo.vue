<template>
  <div class="SidebarInfo">
    <template v-if="authenticated">
      <img class="SidebarInfo-avatar" :src="avatarUrl" alt="" />
      <div class="SidebarInfo-name">{{ name }}</div>
      <div class="SidebarInfo-type">{{ type }}</div>
      <div class="SidebarInfo-status">
        <div class="SidebarInfo-status-circle" :class="sessionStatus.class" />
        <div class="SidebarInfo-status-text">{{ sessionStatus.text }}</div>
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import StudentAvatarUrl from "@/assets/defaultavatar3.png";
import VolunteerAvatarUrl from "@/assets/defaultavatar4.png";

export default {
  props: {
    authenticated: Boolean,
    isVolunteer: Boolean,
    name: String
  },
  data() {
    return {
      avatarUrl: this.isVolunteer ? VolunteerAvatarUrl : StudentAvatarUrl
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      isSessionAlive: "user/isSessionAlive"
    }),
    type() {
      return this.isVolunteer ? "Volunteer" : "Student";
    },
    sessionStatus() {
      const inSession = this.isSessionAlive;

      const status = {
        text: "Ready to chat"
      };

      if (this.isVolunteer) {
        status.text = "Ready to help";
      }

      if (inSession) {
        status.class = "SidebarInfo-status-circle--session";
        status.text = "Chat in session";
      }

      if (this.isVolunteer && !this.user.isOnboarded) {
        status.class = "SidebarInfo-status-circle--onboarding";
        status.text = "Onboarding";
      }

      if (
        this.isVolunteer &&
        (this.user.isOnboarded && !this.user.isApproved)
      ) {
        status.class = "SidebarInfo-status-circle--onboarding";
        status.text = "Pending approval";
      }

      return status;
    }
  }
};
</script>

<style lang="scss" scoped>
.SidebarInfo {
  $spacing: 8px;
  @include flex-container(column, $align-items: flex-start);
  @include child-spacing(top, $spacing);

  &-avatar {
    $size: 80px;
    border-radius: 50%;
    width: $size;
    height: $size;
  }

  &-name {
    @include font-category("display-small");
    margin-top: $spacing * 2;
  }

  &-type {
    @include font-category("body");
    color: $c-secondary-grey;
  }

  &-status {
    @include flex-container(row, center, baseline);
    @include child-spacing(left, 8px);
    @include font-category("body");

    &-circle {
      $size: 8px;

      border-radius: 50%;
      background: $c-success-green;
      width: $size;
      height: $size;

      &--session,
      &--onboarding {
        background: $c-warning-orange;
      }
    }
  }
}
</style>
