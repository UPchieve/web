<template>
  <div class="HeaderTemplate">
    <div v-if="mobileMode" class="menu-container">
      <!-- TOOD: Also show notification if has assignment? -->
      <activity-dot
        v-if="hasUnreadProgressOverviewReports && isStudent"
        class="menu-notification"
      />
      <hamburger-button
        :class="{ white: headerComponent !== 'default-header' }"
        data-testid="mobile-header-hamburger"
        id="mobile-hamburger-btn"
      />
    </div>
    <component :is="headerComponent" />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ActivityDot from '@/components/ActivityDot.vue'
import BannedHeader from '@/components/App/AppHeader/BannedHeader.vue'
import DefaultHeader from '@/components/App/AppHeader/DefaultHeader.vue'
import FallIncentiveHeader from '@/components/App/AppHeader/FallIncentiveHeader.vue'
import HamburgerButton from '@/components/App/AppHeader/HamburgerButton.vue'
import RejoinSessionHeader from '@/components/App/AppHeader/RejoinSessionHeader.vue'
import SessionHeader from '@/components/App/AppHeader/SessionHeader.vue'
import VerificationHeader from '@/components/App/AppHeader/VerificationHeader.vue'
import WaitingPeriodHeader from '@/components/App/AppHeader/WaitingPeriodHeader.vue'
import BecomeAVolunteerHeader from '@/components/App/AppHeader/BecomeAVolunteerHeader.vue'

export default {
  name: 'app-header',
  components: {
    ActivityDot,
    BannedHeader,
    DefaultHeader,
    FallIncentiveHeader,
    HamburgerButton,
    RejoinSessionHeader,
    SessionHeader,
    VerificationHeader,
    WaitingPeriodHeader,
    BecomeAVolunteerHeader,
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      showHeader: (state) => state.app.header.isShown,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isSessionAlive: 'user/isSessionAlive',
      isStudent: 'user/isStudent',
      hasCooldown: 'session/hasCooldown',
      isFallIncentiveProgramEnabled:
        'featureFlags/isFallIncentiveProgramEnabled',
      isIncentiveBannerEnabled: 'featureFlags/isIncentiveBannerEnabled',
      isStudentsBecomeVolunteersEnabled:
        'featureFlags/isStudentsBecomeVolunteersEnabled',
      hasVolunteerRole: 'user/hasVolunteerRole',
      hasUnreadProgressOverviewReports: 'user/hasUnreadProgressOverviewReports',
    }),

    headerComponent() {
      if (this.showBannedHeader) {
        return 'banned-header'
      }

      if (this.showInSessionHeader) {
        this.$store.commit(
          'app/header/setIsShown',
          this.isSessionView ? !this.mobileMode : true
        )
        return 'session-header'
      }

      if (this.showRejoinSessionHeader) {
        return 'rejoin-session-header'
      }

      if (this.showWaitingPeriodHeader) {
        return 'waiting-period-header'
      }

      if (this.showFallIncentiveHeader) {
        return 'fall-incentive-header'
      }

      if (this.showBecomeAVolunteerHeader) {
        return 'become-a-volunteer-header'
      }

      if (this.showVerificationHeader) {
        return 'verification-header'
      }

      return 'default-header'
    },

    showBannedHeader() {
      return this.user && this.user.banType === 'complete'
    },

    showInSessionHeader() {
      return this.isSessionView || this.isFeedbackView
    },

    isSessionView() {
      return this.$route.name === 'SessionView'
    },

    isFeedbackView() {
      return this.$route.name === 'FeedbackView'
    },

    showRejoinSessionHeader() {
      return this.isSessionAlive
    },

    showWaitingPeriodHeader() {
      return this.hasCooldown
    },

    showFallIncentiveHeader() {
      return (
        this.isStudent &&
        (this.isFallIncentiveProgramEnabled || this.isIncentiveBannerEnabled)
      )
    },

    showBecomeAVolunteerHeader() {
      return (
        this.user.userType === 'student' &&
        !this.hasVolunteerRole &&
        this.isStudentsBecomeVolunteersEnabled &&
        !this.user.isSchoolPartner
      )
    },

    showVerificationHeader() {
      return !this.user.emailVerified
    },
  },
}
</script>

<style lang="scss" scoped>
.HeaderTemplate {
  @include bind-app-header-height(height);
  @include flex-container(row, space-between, center);

  background-color: white;
  border-radius: 0px 0px 20px 20px;
  width: 100%;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z('header');

  overflow: hidden;

  @include breakpoint-above('medium') {
    border-radius: 0;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
  }
}

.menu-container {
  left: 15px;
  position: absolute;
  fill: var(--text-color);

  .menu-notification {
    height: 10px;
    position: absolute;
    right: -5px;
    top: 0;
    width: 10px;
  }

  .white {
    fill: white;
  }
}
</style>
