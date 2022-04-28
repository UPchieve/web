<template>
  <div class="SidebarInfo">
    <template v-if="authenticated">
      <component class="SidebarInfo-avatar" :is="avatar" />
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
import { mapGetters, mapState } from 'vuex'
import StudentIcon from '@/assets/student-icon.svg'
import VolunteerIcon from '@/assets/volunteer-icon.svg'

export default {
  props: {
    authenticated: Boolean,
    isVolunteer: Boolean,
    name: String
  },
  components: {
    StudentIcon,
    VolunteerIcon
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      isSessionAlive: 'user/isSessionAlive'
    }),
    type() {
      return this.isVolunteer ? 'Volunteer' : 'Student'
    },
    sessionStatus() {
      const inSession = this.isSessionAlive

      const status = {
        text: 'Ready to chat',
        class: 'SidebarInfo-status-circle'
      }

      if (this.isVolunteer) {
        status.text = 'Ready to help'
      }

      if (this.user.isBanned) {
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
    avatar(){
      return this.isVolunteer ? VolunteerIcon : StudentIcon
    }
  }
}
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
</style>
