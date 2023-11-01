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
import AnalyticsService from '@/services/AnalyticsService'
import ProductDiscoveryService from '@/services/ProductDiscoveryService'
import { EVENTS } from '@/consts'
import getCookie from '@/utils/get-cookie'
import ReferralSVG from '@/assets/dashboard_icons/student/referral.svg'
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
    FirstSessionCongratsModal,
    TellThemCollegePrepModal,
    ProcrastinationPreventionModal,
    PhoneNumberSubmissionModal,
    FallIncentiveEnrollmentModal,
  },
  async created() {
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

    if (
      !this.showTellThemCollegePrepModal &&
      !this.showThemProcrastinationPreventionModal &&
      !this.showFallIncentiveEnrollmentModal &&
      !!this.referralCopy &&
      (!localStorage.getItem('last-seen-referral-modal') ||
        moment(localStorage.getItem('last-seen-referral-modal')).isSameOrBefore(
          moment().subtract(1, 'week')
        )) &&
      localStorage.getItem('high-session-rating') === 'true'
    ) {
      let header
      let subcopy
      if (this.referralCopy === 'baseline') {
        header =
          'Know a friend or classmate who would benefit from free 24/7 tutoring?'
        subcopy = 'Invite them to UPchieve!'
      } else if (this.referralCopy === 'small-gift-card') {
        header =
          'UPchieve can help your friends succeed! Refer 5 friends to UPchieve and get a $25 gift card when they sign up.'
        subcopy = 'Refer your friends now'
      } else if (this.referralCopy === 'emotional-appeal-struggling') {
        header =
          'Do you have friends, siblings, or classmates struggling in a class? When you share UPchieve, you can help a struggling friend succeed!'
        subcopy = 'Invite them to UPchieve!'
      }

      AnalyticsService.captureEvent(EVENTS.STUDENT_SHOWN_REFERRAL_MODAL)

      this.$store.dispatch('app/modal/show', {
        component: 'ReferralModal',
        data: {
          svg: ReferralSVG,
          showAccept: false,
          header,
          subcopy,
        },
      })

      localStorage.setItem('last-seen-referral-modal', new Date())
    }

    // TODO: move globally to show banner in all pages
    if (this.user && this.user.isBanned) {
      this.$store.dispatch('app/header/show', bannedHeaderData)
    }
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
      orbitalSegments: 'featureFlags/orbitalSegments',
      isOrbitalSegmentsActive: 'featureFlags/isOrbitalSegmentsActive',
      isJustTellThemActive: 'featureFlags/isJustTellThemActive',
      isProcrastinationPreventionActive:
        'featureFlags/isProcrastinationPreventionActive',
      isDashboardBannerActive: 'featureFlags/isDashboardBannerActive',
      isFallIncentiveEnrollmentActive:
        'featureFlags/isFallIncentiveEnrollmentActive',
      referralCopy: 'featureFlags/referralCopy',
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
        this.isFallIncentiveProgramActive[1] &&
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
