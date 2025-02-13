<template>
  <header-template>
    <div v-if="mobileMode" class="menu-container">
      <!-- TOOD: Also show notification if has assignment? -->
      <activity-dot
        v-if="
          hasUnreadProgressOverviewReports &&
          isProgressReportsActive &&
          isStudent
        "
        class="menu-notification"
      />
      <hamburger-button
        :class="{ white: headerComponent !== 'DefaultHeader' }"
        data-testid="mobile-header-hamburger"
      />
    </div>
    <component v-bind:is="headerComponent" :header-data="headerData" />
  </header-template>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ActivityDot from '@/components/ActivityDot.vue'
import BannedHeader from '@/components/App/AppHeader/BannedHeader.vue'
import DefaultHeader from '@/components/App/AppHeader/DefaultHeader.vue'
import FallIncentiveHeader from '@/components/App/AppHeader/FallIncentiveHeader.vue'
import HamburgerButton from '@/components/App/AppHeader/HamburgerButton.vue'
import HeaderTemplate from '@/components/App/AppHeader/HeaderTemplate.vue'
import RejoinSessionHeader from '@/components/App/AppHeader/RejoinSessionHeader.vue'
import SessionHeader from '@/components/App/AppHeader/SessionHeader.vue'
import VerificationHeader from '@/components/App/AppHeader/VerificationHeader.vue'
import WaitingPeriodHeader from '@/components/App/AppHeader/WaitingPeriodHeader.vue'

export default {
  name: 'app-header',
  components: {
    ActivityDot,
    BannedHeader,
    DefaultHeader,
    FallIncentiveHeader,
    HamburgerButton,
    HeaderTemplate,
    RejoinSessionHeader,
    SessionHeader,
    VerificationHeader,
    WaitingPeriodHeader,
  },
  computed: {
    ...mapState({
      headerComponent: (state) => state.app.header.component || 'DefaultHeader',
      headerData: (state) => state.app.header.data,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
  },
}
</script>

<style lang="scss" scoped>
.menu-container {
  left: 15px;
  position: absolute;

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
