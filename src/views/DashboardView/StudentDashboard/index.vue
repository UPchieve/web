<template>
  <div class="student-dashboard">
    <dashboard-banner
      :subheader="
        showDashboardRedesign ? `What can we help you with today?` : ``
      "
    />
    <div class="dashboard-notices">
      <div
        v-if="downtimeBannerMessage"
        class="dashboard-notice"
        :class="'dashboard-notice--downtime'"
      >
        <a href="https://upchieve.statuspage.io" target="_blank">{{
          downtimeBannerMessage
        }}</a>
      </div>
    </div>

    <tell-them-college-prep-modal
      v-if="showTellThemCollegePrepModal"
      :closeModal="toggleTellThemCollegePrepModal"
    />
    <subject-selection />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import DashboardBanner from '../DashboardBanner.vue'
import SubjectSelection from './SubjectSelection/index.vue'
import TellThemCollegePrepModal from './TellThemCollegePrepModal.vue'
import StudentOnboardingModal from './StudentOnboardingModal.vue'
import AnalyticsService from '@/services/AnalyticsService'
import ProductDiscoveryService from '@/services/ProductDiscoveryService'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'
import getCookie from '@/utils/get-cookie'
import Gleap from 'gleap'

const defaultHeaderData = {
  component: 'DefaultHeader',
}

const activeHeaderData = {
  component: 'RejoinSessionHeader',
}

const bannedHeaderData = {
  component: 'BannedHeader',
}

export default {
  name: 'student-dashboard',
  components: {
    DashboardBanner,
    SubjectSelection,
    TellThemCollegePrepModal,
  },
  async created() {
    if (this.isSessionAlive) {
      this.$store.dispatch('app/header/show', activeHeaderData)
    } else if (!this.user.emailVerified) {
      this.$store.dispatch('app/header/show', {
        component: 'VerificationHeader',
        data: {
          verificationMethod: VERIFICATION_METHOD.EMAIL,
          phoneOrEmailToVerify: this.user.email,
        },
      })
    }

    if (this.isFirstDashboardVisit) {
      this.$store.dispatch('app/modal/show', {
        component: StudentOnboardingModal,
        data: {
          showTemplateButtons: false,
        },
      })
    }

    if (localStorage.getItem('isSSOSignUpRedirect')) {
      AnalyticsService.captureEvent(EVENTS.ACCOUNT_CREATED)
      AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED)
      localStorage.removeItem('isSSOSignUpRedirect')
      this.$store.dispatch('user/firstDashboardVisit', true)
      this.$store.dispatch('app/modal/show', {
        component: StudentOnboardingModal,
        data: {
          showTemplateButtons: false,
        },
      })
    }

    if (this.isOrbitalSegmentsActive)
      ProductDiscoveryService.triggerDynamicSegment(
        this.user,
        this.orbitalSegments
      )

    if (
      this.hadASession &&
      !getCookie('hasSeenTellThemCollegePrepModal') &&
      this.user.pastSessions.length >= 1
    )
      this.showTellThemCollegePrepModal = true

    // TODO: move globally to show banner in all pages
    if (this.user && this.user.isBanned) {
      this.$store.dispatch('app/header/show', bannedHeaderData)
    }
  },
  data() {
    return {
      showTellThemCollegePrepModal: false,
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      hadASession: (state) => state.user.hadASession,
      prevSessionSubject: (state) => state.user.prevSessionSubject,
      isFirstDashboardVisit: (state) => state.user.isFirstDashboardVisit,
      latestSession: (state) => state.user.latestSession,
    }),
    ...mapGetters({
      isSessionAlive: 'user/isSessionAlive',
      downtimeBannerMessage: 'featureFlags/downtimeBannerMessage',
      orbitalSegments: 'featureFlags/orbitalSegments',
      isOrbitalSegmentsActive: 'featureFlags/isOrbitalSegmentsActive',
      showDashboardRedesign: 'user/showDashboardRedesign',
      isProgressReportsActive: 'featureFlags/isProgressReportsActive',
      isAutoStartCollegeSessionActive:
        'featureFlags/isAutoStartCollegeSessionActive',
      autoStartCollegeSession: 'featureFlags/autoStartCollegeSession',
    }),
    userAndOrbitalSegment() {
      return [this.user, this.orbitalSegments, this.isOrbitalSegmentsActive]
    },
  },
  methods: {
    toggleTellThemCollegePrepModal() {
      this.showTellThemCollegePrepModal = !this.showTellThemCollegePrepModal
    },
    showGleapBot() {
      AnalyticsService.captureEvent(EVENTS.GLEAP_BOT_SHOWN)
      Gleap.startBot('64b555f1e8dd226df869b2e7')
      AnalyticsService.updateUser({ hasMessages: false })
    },
  },
  watch: {
    isFirstDashboardVisit(currValue, prevValue) {
      const hasJustDismissedWelcomeModal = !currValue && prevValue
      if (
        hasJustDismissedWelcomeModal &&
        !this.hadASession &&
        this.isAutoStartCollegeSessionActive &&
        this.autoStartCollegeSession
      ) {
        this.$store.dispatch('app/modal/show', {
          component: 'StartCollegeSessionModal',
          data: {
            showTemplateButtons: false,
            sessionTopic: this.autoStartCollegeSession,
          },
        })
      }
    },
    isSessionAlive(isAlive) {
      if (!isAlive) {
        this.$store.dispatch('app/header/show', defaultHeaderData)
      } else {
        this.$store.dispatch('app/header/show', activeHeaderData)
      }
    },
    hadASession: {
      handler(currentValue, prevValue) {
        if (
          currentValue &&
          !prevValue &&
          !getCookie('hasSeenTellThemCollegePrepModal') &&
          this.user.pastSessions.length >= 1
        ) {
          this.showTellThemCollegePrepModal = true
        }
      },
      deep: true,
    },
    userAndOrbitalSegment: {
      handler: function (currentValue, prevValue) {
        if (
          this.isOrbitalSegmentsActive &&
          Object.keys(currentValue[0]).length &&
          currentValue[1].length &&
          currentValue[2] &&
          (!Object.keys(prevValue[0]).length ||
            !prevValue[1].length ||
            !prevValue[2])
        )
          ProductDiscoveryService.triggerDynamicSegment(
            this.user,
            this.orbitalSegments
          )
      },
      deep: true,
    },
  },
}
</script>

<style lang="scss" scoped>
.student-dashboard {
  @include flex-container(column);
  padding: 40px 20px;

  @include breakpoint-above('medium') {
    display: inline-flex;
    min-width: 100%;
    padding: 40px;
  }
}

.dashboard-notice {
  padding: 15px;
  background-color: $c-success-green;
  border-radius: 8px;
  margin-top: 20px;
  font-weight: 500;
  font-size: 16px;
  color: #fff;
  text-align: center;

  a {
    color: #fff;

    &:hover {
      color: #f3f3f3;
      text-decoration: none;
    }
  }

  &:last-child {
    // TODO: a cleaner way to handle spacing issues with class SubjectSelection
    margin-bottom: -20px;
  }

  &--warn {
    background-color: $c-warning-orange;
  }

  &--info {
    background-color: $c-information-blue;
  }

  &--downtime {
    color: #fff;
    background-color: $c-information-blue;
  }

  &--summer-prep {
    color: #fff;
    background-color: $c-information-blue;
    a {
      text-decoration: underline;
      font-weight: bold;
    }
  }
}
</style>
