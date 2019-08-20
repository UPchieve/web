<template>
  <div class="AppSidebarInfo">
    <template v-if="authenticated">
      <img class="AppSidebarInfo-avatar" :src="avatarUrl" />
      <div class="AppSidebarInfo-name">{{ name }}</div>
      <div class="AppSidebarInfo-type">{{ type }}</div>
      <div class="AppSidebarInfo-status">
        <div class="AppSidebarInfo-status-circle" :class="status.class" />
        <div class="AppSidebarInfo-status-text">{{ status.text }}</div>
      </div>
    </template>

    <template v-else>
      <p class="AppSidebarInfo-description">
        UPchieve is a volunteer-run ed-tech initiative with the goal of
        providing free, online, and on-demand educational and guidance services
        to disadvantaged students.
      </p>
    </template>
  </div>
</template>

<script>
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
    type() {
      return this.isVolunteer ? "Volunteer" : "Student";
    },
    status() {
      return {
        class: null,
        text: "Ready to chat"
      };
    }
  }
};
</script>

<style lang="scss" scoped>
.AppSidebarInfo {
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

      &--warn {
        background: $c-warning-orange;
      }

      &--error {
        background: $c-error-red;
      }
    }
  }
}
</style>
