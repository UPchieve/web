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
      v-if="isJustTellThemActive && showTellThemCollegePrepModal"
      :closeModal="toggleTellThemCollegePrepModal"
    />
    <procrastination-prevention-modal
      v-if="showThemProcrastinationPreventionModal"
      :closeModal="toggleProcrastinationPreventionModal"
    />
    <fall-incentive-enrollment-modal
      v-if="showFallIncentiveEnrollmentModal"
      :closeModal="toggleFallIncentiveEnrollmentModal"
    />
    <scorecaster-modal
      v-if="showScorecasterModal"
      :closeModal="toggleShowScorecasterModal"
    />
    <subject-selection />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import DashboardBanner from '../DashboardBanner'
import SubjectSelection from './SubjectSelection/index.vue'
import TellThemCollegePrepModal from './TellThemCollegePrepModal.vue'
import ProcrastinationPreventionModal from './ProcrastinationPreventionModal.vue'
import FallIncentiveEnrollmentModal from './FallIncentiveEnrollmentModal.vue'
import StudentOnboardingModal from './StudentOnboardingModal.vue'
import ScorecasterModal from './ScorecasterModal.vue'
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

// TODO: abstract this banner out more to allow for dynamic targeting
const dashboardBannerData = {
  component: 'DashboardBannerHeader',
}

export default {
  name: 'student-dashboard',
  components: {
    DashboardBanner,
    SubjectSelection,
    TellThemCollegePrepModal,
    ProcrastinationPreventionModal,
    FallIncentiveEnrollmentModal,
    ScorecasterModal,
  },
  async created() {
    if (this.isSessionAlive) {
      this.$store.dispatch('app/header/show', activeHeaderData)
    } else if (
      !this.user.emailVerified &&
      this.isSmsVerificationEnabledOnSignupFlow
    ) {
      this.$store.dispatch('app/header/show', {
        component: 'VerificationHeader',
        data: {
          verificationMethod: VERIFICATION_METHOD.EMAIL,
          phoneOrEmailToVerify: this.user.email,
        },
      })
    } else if (this.isDashboardBannerActive) {
      this.triggerIncentiveProgram()
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
      this.isCollegePrepAdActive[0] &&
      this.isCollegePrepAdActive[1] &&
      !getCookie('hasSeenTellThemCollegePrepModal') &&
      this.user.pastSessions.length >= 1
    )
      this.showTellThemCollegePrepModal = true

    if (
      this.isProcrastinationPreventionReminderActive[0] &&
      this.isProcrastinationPreventionReminderActive[1] &&
      !localStorage.getItem('hasSeenProcrastinationPreventionModal')
    )
      this.showThemProcrastinationPreventionModal = true

    if (this.isEnrollmentForFallIncentiveModalActive)
      this.showFallIncentiveEnrollmentModal = true

    if (this.isScorecasterUserSegment) this.showScorecasterModal = true

    // TODO: move globally to show banner in all pages
    if (this.user && this.user.isBanned) {
      this.$store.dispatch('app/header/show', bannedHeaderData)
    }
  },
  data() {
    return {
      showTellThemCollegePrepModal: false,
      showThemProcrastinationPreventionModal: false,
      showFallIncentiveEnrollmentModal: false,
      showScorecasterModal: false,
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      hadASession: state => state.user.hadASession,
      prevSessionSubject: state => state.user.prevSessionSubject,
      isFirstDashboardVisit: state => state.user.isFirstDashboardVisit,
      productFlags: state => state.productFlags.flags,
    }),
    ...mapGetters({
      isSessionAlive: 'user/isSessionAlive',
      downtimeBannerMessage: 'featureFlags/downtimeBannerMessage',
      orbitalSegments: 'featureFlags/orbitalSegments',
      isOrbitalSegmentsActive: 'featureFlags/isOrbitalSegmentsActive',
      isJustTellThemActive: 'featureFlags/isJustTellThemActive',
      isProcrastinationPreventionActive:
        'featureFlags/isProcrastinationPreventionActive',
      isDashboardBannerActive: 'featureFlags/isDashboardBannerActive',
      isFallIncentiveEnrollmentActive:
        'featureFlags/isFallIncentiveEnrollmentActive',
      showDashboardRedesign: 'user/showDashboardRedesign',
      isScorecasterModalActive: 'featureFlags/isScorecasterModalActive',
      isAutoStartCollegeSessionActive:
        'featureFlags/isAutoStartCollegeSessionActive',
      autoStartCollegeSession: 'featureFlags/autoStartCollegeSession',
      isSmsVerificationEnabledOnSignupFlow:
        'featureFlags/isSmsVerificationEnabledOnSignupFlow',
    }),
    userAndOrbitalSegment() {
      return [this.user, this.orbitalSegments, this.isOrbitalSegmentsActive]
    },
    isCollegePrepAdActive() {
      return [this.isJustTellThemActive, this.hadASession]
    },
    isFallIncentiveProgramActive() {
      return [this.user, this.productFlags, this.isDashboardBannerActive]
    },
    isProcrastinationPreventionReminderActive() {
      return [this.isProcrastinationPreventionActive, this.hadASession]
    },
    isEnrollmentForFallIncentiveActive() {
      return [this.isFallIncentiveEnrollmentActive, this.hadASession]
    },
    isEnrollmentForFallIncentiveModalActive() {
      return (
        this.isEnrollmentForFallIncentiveActive[0] &&
        this.isEnrollmentForFallIncentiveActive[1] &&
        !localStorage.getItem('hasSeenFallIncentiveEnrollmentModal') &&
        this.user.pastSessions.length === 1 &&
        !this.user.phone
      )
    },
    isScorecasterUserSegment() {
      const hadAReadingSession = this.prevSessionSubject === 'reading'
      return (
        this.isScorecasterModalActive &&
        hadAReadingSession &&
        !localStorage.getItem('hasSeenScorecasterModal')
      )
    },
  },
  methods: {
    toggleTellThemCollegePrepModal() {
      this.showTellThemCollegePrepModal = !this.showTellThemCollegePrepModal
    },
    toggleProcrastinationPreventionModal() {
      this.showThemProcrastinationPreventionModal = !this
        .showThemProcrastinationPreventionModal
    },
    toggleFallIncentiveEnrollmentModal() {
      this.showFallIncentiveEnrollmentModal = !this
        .showFallIncentiveEnrollmentModal
    },
    toggleShowScorecasterModal() {
      this.showScorecasterModal = !this.showScorecasterModal
    },
    showGleapBot() {
      AnalyticsService.captureEvent(EVENTS.GLEAP_BOT_SHOWN)
      Gleap.startBot('64b555f1e8dd226df869b2e7')
      AnalyticsService.updateUser({ hasMessages: false })
    },
    // Only show the banner to those who have >= 1 sessions and < 10 session or in the incentive program
    triggerIncentiveProgram() {
      if (
        !this.productFlags.fallIncentiveProgram &&
        (this.user.pastSessions.length < 1 || this.user.pastSessions.length > 9)
      )
        return

      this.$store.dispatch('app/header/show', dashboardBannerData)
      Gleap.trackEvent('fall-incentive-program')
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
    isCollegePrepAdActive(currentValue, prevValue) {
      if (
        currentValue[0] &&
        currentValue[1] &&
        (!prevValue[0] || !prevValue[1]) &&
        !getCookie('hasSeenTellThemCollegePrepModal') &&
        this.user.pastSessions.length >= 1
      ) {
        this.showTellThemCollegePrepModal = true
      }
    },
    isProcrastinationPreventionReminderActive(currentValue, prevValue) {
      if (
        currentValue[0] &&
        currentValue[1] &&
        (!prevValue[0] || !prevValue[1]) &&
        !localStorage.getItem('hasSeenProcrastinationPreventionModal') &&
        this.user.pastSessions.length >= 1
      ) {
        this.showThemProcrastinationPreventionModal = true
      }
    },
    userAndOrbitalSegment: {
      handler: function(currentValue, prevValue) {
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
    isFallIncentiveProgramActive: {
      handler: function(currentValue, prevValue) {
        if (
          Object.keys(currentValue[0]).length &&
          Object.keys(currentValue[1]).length &&
          currentValue[2] &&
          !this.isSessionAlive &&
          (!Object.keys(prevValue[0]).length ||
            !Object.keys(prevValue[1]).length ||
            !prevValue[2])
        )
          this.triggerIncentiveProgram()
      },
      deep: true,
    },
    isEnrollmentForFallIncentiveActive: {
      handler: function(currentValue, prevValue) {
        if (
          (currentValue[0] && currentValue[1] && !prevValue[0]) ||
          !prevValue[1]
        )
          if (this.isEnrollmentForFallIncentiveModalActive)
            this.showFallIncentiveEnrollmentModal = true
      },
      deep: true,
    },
    isScorecasterUserSegment(currentValue, prevValue) {
      if (currentValue && !prevValue) this.showScorecasterModal = true
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
