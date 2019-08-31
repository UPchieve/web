<template>
  <div class="SidebarInfo">
    <template v-if="authenticated">
      <img class="SidebarInfo-avatar" :src="avatarUrl" />
      <div class="SidebarInfo-name">{{ name }}</div>
      <div class="SidebarInfo-type">{{ type }}</div>
      <div class="SidebarInfo-status">
        <div class="SidebarInfo-status-circle" :class="sessionStatus.class" />
        <div class="SidebarInfo-status-text">{{ sessionStatus.text }}</div>
      </div>
    </template>

    <template v-else>
      <p class="SidebarInfo-description">
        UPchieve is a volunteer-run ed-tech initiative with the goal of
        providing free, online, and on-demand educational and guidance services
        to disadvantaged students.
      </p>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
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
    ...mapGetters({
      isSessionAlive: "user/isSessionAlive"
    }),
    type() {
      return this.isVolunteer ? "Volunteer" : "Student";
    },
    sessionStatus() {
      const inSession = this.isSessionAlive;

      return {
        class: inSession ? "SidebarInfo-status-circle--session" : null,
        text: inSession ? "Chat in session" : "Ready to chat"
      };
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

      &--session {
        background: $c-warning-orange;
      }
    }
  }
}
</style>
