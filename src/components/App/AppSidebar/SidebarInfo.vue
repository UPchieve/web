<template>
  <div v-if="isAuthenticated">
    <div class="SidebarInfo" :class="{ mobile: mobileMode }">
      <component class="SidebarInfo-avatar" :is="avatar" />
      <div class="SidebarInfo-name">{{ firstName }}</div>
      <div v-if="!mobileMode" class="SidebarInfo-type">{{ type }}</div>
      <div v-if="!isTeacher && !mobileMode" class="SidebarInfo-status">
        <div class="SidebarInfo-status-circle" :class="sessionStatus.class" />
        <div class="SidebarInfo-status-text">{{ sessionStatus.text }}</div>
      </div>
    </div>
    <hr v-if="mobileMode" />
  </div>
</template>

<script>
import Case from 'case'
import { mapGetters, mapState } from 'vuex'

export default {
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      firstName: 'user/firstName',
      isAuthenticated: 'user/isAuthenticated',
      isSessionAlive: 'user/isSessionAlive',
      userType: 'user/userType',
      avatar: 'user/avatar',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isTeacher: 'user/isTeacher',
      mobileMode: 'app/mobileMode',
    }),
    type() {
      return Case.capital(this.userType ?? 'User')
    },
    sessionStatus() {
      const inSession = this.isSessionAlive

      const status = {
        text: 'Ready to chat',
        class: 'SidebarInfo-status-circle',
      }

      if (this.isVolunteer) {
        status.text = 'Ready to help'
      }

      if (this.user.banType === 'complete') {
        status.class += '--banned'
        status.text = 'Paused'
      }

      if (inSession) {
        status.class += '--session'
        status.text = 'Chat in session'
      }

      if (this.isVolunteer && !this.user.isOnboarded) {
        status.class += '--onboarding'
        status.text = 'Onboarding'
      }

      if (this.isVolunteer && this.user.isOnboarded && !this.user.isApproved) {
        status.class += '--onboarding'
        status.text = 'Pending approval'
      }

      return status
    },
  },
}
</script>

<style lang="scss" scoped>
.SidebarInfo {
  $spacing: 8px;
  @include flex-container(column, $align-items: flex-start);
  @include child-spacing(top, $spacing);

  &.mobile {
    @include flex-container(row, start, center);

    .SidebarInfo-avatar {
      $mobile-size: 60px;
      height: $mobile-size;
      width: $mobile-size;
    }

    .SidebarInfo-name {
      margin-top: 0;
      margin-left: 10px;
    }
  }

  &-avatar {
    $size: 80px;
    border-radius: 50%;
    width: $size;
    height: $size;
  }

  &-name {
    @include font-category('display-small');
    margin-top: $spacing * 2;
    text-align: left;
  }

  &-type {
    @include font-category('body');
    color: $c-secondary-grey;
  }

  &-status {
    @include flex-container(row, center, baseline);
    @include child-spacing(left, 8px);
    @include font-category('body');

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

      &--banned {
        background-color: $c-banned-grey;
      }
    }
  }
}

hr {
  margin-top: 2rem;
  margin-bottom: 2rem;
  border: 2px solid $c-background-grey;
}
</style>
