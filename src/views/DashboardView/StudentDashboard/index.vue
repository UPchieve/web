<template>
  <div class="student-dashboard">
    <dashboard-banner />
    <div class="dashboard-notices">
      <div
        v-if="!downtimeBannerMessage && noticeMessage"
        class="dashboard-notice"
        :class="isLowCoachHour && 'dashboard-notice--warn'"
      >
        {{ noticeMessage }}
      </div>

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

    <level-system-removal-modal
      v-if="isLevelSystemRemovalModalActive"
      class="level-system"
    />
    <tell-them-college-prep-modal
      v-if="isJustTellThemActive && showTellThemCollegePrepModal"
      :closeModal="toggleTellThemCollegePrepModal"
    />
    <procrastination-prevention-modal
      v-if="showThemProcrastinationPreventionModal"
      :closeModal="toggleProcrastinationPreventionModal"
    />
    <phone-number-submission-modal
      v-if="showPhoneNumberSubmissionModal"
      :closeModal="togglePhoneNumberSubmissionModal"
    />
    <fall-incentive-enrollment-modal
      v-if="showFallIncentiveEnrollmentModal"
      :closeModal="toggleFallIncentiveEnrollmentModal"
    />
    <subject-selection />
    <first-session-congrats-modal
      v-if="showFirstSessionCongratsModal"
      :closeModal="toggleFirstSessionCongratsModal"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import DashboardBanner from '../DashboardBanner'
import SubjectSelection from './SubjectSelection/index.vue'
import FirstSessionCongratsModal from './FirstSessionCongratsModal.vue'
import TellThemCollegePrepModal from './TellThemCollegePrepModal.vue'
import ProcrastinationPreventionModal from './ProcrastinationPreventionModal.vue'
import PhoneNumberSubmissionModal from './PhoneNumberSubmissionModal.vue'
import FallIncentiveEnrollmentModal from './FallIncentiveEnrollmentModal.vue'
import moment from 'moment-timezone'
import LevelSystemRemovalModal from './LevelSystemRemovalModal.vue'
import AnalyticsService from '@/services/AnalyticsService'
import ProductDiscoveryService from '@/services/ProductDiscoveryService'
import { EVENTS } from '@/consts'
import getCookie from '@/utils/get-cookie'
import Gleap from 'gleap'

const defaultHeaderData = {
  component: 'DefaultHeader',
}

const activeHeaderData = {
  component: 'RejoinSessionHeader',
}

const bannedHeaderData = {
  component: 'BannedStudentHeader',
}

const earnCertificationsHeaderData = {
  component: 'EarnCertificationsHeader',
}

const dashboardBannerData = {
  component: 'DashboardBannerHeader',
}

export default {
  name: 'student-dashboard',
  components: {
    DashboardBanner,
    SubjectSelection,
    FirstSessionCongratsModal,
    LevelSystemRemovalModal,
    TellThemCollegePrepModal,
    ProcrastinationPreventionModal,
    PhoneNumberSubmissionModal,
    FallIncentiveEnrollmentModal,
  },
  async created() {
    if (this.isEarnCertificationsActive)
      this.$store.dispatch('app/header/show', earnCertificationsHeaderData)

    if (this.user && this.user.isBanned) {
      this.$store.dispatch('app/header/show', bannedHeaderData)
    }

    if (this.isSessionAlive) {
      this.$store.dispatch('app/header/show', activeHeaderData)
    } else if (this.isDashboardBannerActive) this.triggerIncentiveProgram()

    if (this.isFirstDashboardVisit) {
      this.$store.dispatch('app/modal/show', {
        component: 'StudentOnboardingModal',
        data: {
          showTemplateButtons: false,
        },
      })
    }

    if (localStorage.getItem('isSSOSignUpRedirect')) {
      AnalyticsService.captureEvent(EVENTS.ACCOUNT_CREATED)
      AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED)
      localStorage.removeItem('isSSOSignUpRedirect')
      this.$store.dispatch('app/modal/show', {
        component: 'StudentOnboardingModal',
        data: {
          showTemplateButtons: false,
        },
      })
    }

    if (this.isReferFriendsActive && this.hasSeenFirstSessionCongratsModal)
      this.toggleFirstSessionCongratsModal()

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

    if (this.isPhoneNumberSubmissionModalActive)
      this.showPhoneNumberSubmissionModal = true

    if (this.isEnrollmentForFallIncentiveModalActive)
      this.showFallIncentiveEnrollmentModal = true

    this.currentHour = moment()
      .tz('America/New_York')
      .hour()

    if (this.isGleapBotExperimentActive) this.showGleapBot()
  },
  data() {
    return {
      currentHour: 0,
      showFirstSessionCongratsModal: false,
      showTellThemCollegePrepModal: false,
      showThemProcrastinationPreventionModal: false,
      showPhoneNumberSubmissionModal: false,
      showFallIncentiveEnrollmentModal: false,
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      hadASession: state => state.user.hadASession,
      isFirstDashboardVisit: state => state.user.isFirstDashboardVisit,
      productFlags: state => state.productFlags.flags,
    }),
    ...mapGetters({
      isSessionAlive: 'user/isSessionAlive',
      isReferFriendsActive: 'featureFlags/isReferFriendsActive',
      downtimeBannerMessage: 'featureFlags/downtimeBannerMessage',
      isEarnCertificationsActive: 'featureFlags/isEarnCertificationsActive',
      isLevelSystemActive: 'featureFlags/isLevelSystemActive',
      isOrbitalActive: 'featureFlags/isOrbitalActive',
      orbitalSegments: 'featureFlags/orbitalSegments',
      isOrbitalSegmentsActive: 'featureFlags/isOrbitalSegmentsActive',
      isJustTellThemActive: 'featureFlags/isJustTellThemActive',
      isProcrastinationPreventionActive:
        'featureFlags/isProcrastinationPreventionActive',
      isGleapBotExperimentActive: 'featureFlags/isGleapBotExperimentActive',
      isDashboardBannerActive: 'featureFlags/isDashboardBannerActive',
      isFallIncentiveEnrollmentActive:
        'featureFlags/isFallIncentiveEnrollmentActive',
    }),
    isLowCoachHour() {
      return this.currentHour < 12
    },
    noticeMessage() {
      if (this.currentHour >= 12 && this.currentHour <= 23)
        return 'Heads up: this is a great time to make a request! We have plenty of coaches available between 12pm - 12 am ET.'
      if (this.currentHour >= 3 && this.currentHour <= 9)
        return 'Heads up: we have very few coaches available right now. Try making requests between 12pm-12am ET when possible'
      if (
        (this.currentHour >= 0 && this.currentHour < 3) ||
        (this.currentHour >= 9 && this.currentHour < 12)
      )
        return 'Heads up: we have fewer coaches available than normal right now. Try making requests between 12pm-12am ET when possible!'

      return ''
    },
    hasSeenFirstSessionCongratsModal() {
      return (
        this.user &&
        this.user.pastSessions.length === 1 &&
        !localStorage.getItem('viewedFirstSessionCongratsModal')
      )
    },
    isLevelSystemRemovalModalActive() {
      const seenLevelSystemRemovalModal = getCookie(
        'hasSeenLevelSystemRemovalModal'
      )
      return this.isLevelSystemActive && !seenLevelSystemRemovalModal
    },
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
    isPhoneNumberSubmissionModalActive() {
      return (
        this.isFallIncentiveProgramActive[0] &&
        this.isFallIncentiveProgramActive[1].fallIncentiveProgram &&
        this.isFallIncentiveProgramActive[2] &&
        !localStorage.getItem('hasSeenPhoneNumberSubmissionModal') &&
        !this.user.phone
      )
    },
  },
  methods: {
    toggleFirstSessionCongratsModal() {
      this.showFirstSessionCongratsModal = !this.showFirstSessionCongratsModal
    },
    toggleTellThemCollegePrepModal() {
      this.showTellThemCollegePrepModal = !this.showTellThemCollegePrepModal
    },
    toggleProcrastinationPreventionModal() {
      this.showThemProcrastinationPreventionModal = !this
        .showThemProcrastinationPreventionModal
    },
    togglePhoneNumberSubmissionModal() {
      this.showPhoneNumberSubmissionModal = !this.showPhoneNumberSubmissionModal
    },
    toggleFallIncentiveEnrollmentModal() {
      this.showFallIncentiveEnrollmentModal = !this
        .showFallIncentiveEnrollmentModal
    },
    showGleapBot() {
      AnalyticsService.captureEvent(EVENTS.GLEAP_BOT_SHOWN)
      Gleap.startBot('64b555f1e8dd226df869b2e7')
      AnalyticsService.updateUser({ hasMessages: false })
    },
    triggerIncentiveProgram() {
      if (!this.productFlags.fallIncentiveProgram) return

      this.$store.dispatch('app/header/show', dashboardBannerData)
      Gleap.trackEvent('fall-incentive-program')
    },
  },
  watch: {
    isSessionAlive(isAlive, prevIsAlive) {
      if (!isAlive) {
        this.$store.dispatch('app/header/show', defaultHeaderData)
        if (
          this.isReferFriendsActive &&
          prevIsAlive &&
          this.hasSeenFirstSessionCongratsModal
        )
          this.toggleFirstSessionCongratsModal()
      } else {
        this.$store.dispatch('app/header/show', activeHeaderData)
      }
    },
    isEarnCertificationsActive(currentValue, prevValue) {
      if (
        currentValue &&
        !prevValue &&
        // ensure no other dashboard headers are shown
        ((this.user && !this.user.isBanned) || !this.sessionAlive)
      ) {
        this.$store.dispatch('app/header/show', earnCertificationsHeaderData)
        AnalyticsService.captureEvent(
          EVENTS.FLAGGED_AS_EARN_CERTIFICATIONS_STUDENT
        )
      }
    },
    isLevelSystemActive(currentValue, prevValue) {
      if (currentValue && !prevValue) {
        AnalyticsService.captureEvent(EVENTS.FLAGGED_AS_LEVEL_SYSTEM_STUDENT)
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
    isGleapBotExperimentActive(currentValue, prevValue) {
      if (currentValue && !prevValue) this.showGleapBot()
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
        if (this.isPhoneNumberSubmissionModalActive)
          this.showPhoneNumberSubmissionModal = true
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

.level-system {
  // Add 20px because of the margin-bottom from the dashboard banner
  margin-top: calc(1em + 20px);
  // margin-bottom here for the same reason it's on the dashboard banner
  margin-bottom: -20px;
  width: 100%;

  @include breakpoint-between(1050px, 1430px) {
    width: 48%;
  }

  @include breakpoint-between(1430px, 1809px) {
    width: 31.5%;
  }

  @include breakpoint-between(1430px, 1809px) {
    width: 31.5%;
  }

  @include breakpoint-above('massive') {
    width: 400px;
  }
}

.share-upchieve-notice {
  @include flex-container(column);
  background-color: #fff;
  border-radius: 8px;
  color: #000;
  font-size: 18px;
  padding: 20px;
  margin-top: 15px;
  text-align: center;

  a {
    color: $c-information-blue;
    font-weight: 500;
    margin-top: 10px;

    &:hover {
      cursor: pointer;
      color: #103a90;
      text-decoration: none;
    }
  }
}
</style>
