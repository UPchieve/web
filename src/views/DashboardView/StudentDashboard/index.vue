<template>
  <div class="student-dashboard">
    <dashboard-banner
      v-if="!assignments.length"
      :subheader="
        showDashboardRedesign ? `What can we help you with today?` : ``
      "
    />
    <div v-else>
      <StudentAssignments :assignments="assignments" />
    </div>
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
      <large-button
        v-if="aiBotMessage"
        class="dashboard-notice ai-bot"
        :class="'dashboard-notice--downtime'"
        routeTo="/ai-tutor-conversations"
        >{{ aiBotMessage }}<arrow-icon></arrow-icon
      ></large-button>
    </div>

    <tell-them-college-prep-modal
      v-if="showTellThemCollegePrepModal"
      :closeModal="toggleTellThemCollegePrepModal"
    />
    <joined-class-modal
      v-if="joinedClassCode"
      @close-modal="() => (joinedClassCode = '')"
      :classCode="joinedClassCode"
    />
    <fall-incentive-enrollment-modal
      v-if="showFallIncentiveEnrollmentModal"
      :closeModal="toggleFallIncentiveEnrollmentModal"
      :isFirstModalView="fallIncentiveProgramModalViewCount === 0"
    />
    <subject-selection />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import DashboardBanner from '../DashboardBanner.vue'
import SubjectSelection from './SubjectSelection/index.vue'
import TellThemCollegePrepModal from './TellThemCollegePrepModal.vue'
import JoinedClassModal from './JoinedClassModal.vue'
import StudentOnboardingModal from './StudentOnboardingModal.vue'
import FallIncentiveEnrollmentModal from './FallIncentiveEnrollmentModal.vue'
import AnalyticsService from '@/services/AnalyticsService'
import ProductDiscoveryService from '@/services/ProductDiscoveryService'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'
import getCookie from '@/utils/get-cookie'
import Gleap from 'gleap'
import ArrowIcon from '@/assets/arrow.svg'
import LargeButton from '@/components/LargeButton.vue'
import StudentAssignments from '@/components/StudentAssignments.vue'
import * as StudentAssignmentUtils from '@/utils/student-assignments-utils'

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
    JoinedClassModal,
    FallIncentiveEnrollmentModal,
    ArrowIcon,
    LargeButton,
    StudentAssignments,
  },
  async created() {
    if (this.isSessionAlive) {
      this.$store.dispatch('app/header/show', activeHeaderData)
    } else if (
      !this.user.emailVerified &&
      !this.isFallIncentiveProgramEnabled
    ) {
      this.$store.dispatch('app/header/show', {
        component: 'VerificationHeader',
        data: {
          verificationMethod: VERIFICATION_METHOD.EMAIL,
          phoneOrEmailToVerify: this.user.email,
        },
      })
    } else if (this.isFallIncentiveProgramEnabled)
      this.triggerIncentiveProgramBanner()
    else if (this.assignments.length) {
      this.$store.dispatch('app/header/show')
    }

    if (
      this.shouldSeeIncentiveModalForFirstTime ||
      this.shouldSeeIncentiveModalForSecondTime
    )
      this.triggerIncentiveEnrollmentModal()

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

    if (this.isOrbitalSegmentsActive) {
      ProductDiscoveryService.triggerOrbitalSegment(
        this,
        this.user,
        this.orbitalSegments
      )
    }

    if (
      this.hadASession &&
      !getCookie('hasSeenTellThemCollegePrepModal') &&
      this.user.pastSessions.length >= 1 &&
      this.isCollegePrepAdEnabled
    )
      this.showTellThemCollegePrepModal = true

    // TODO: move globally to show banner in all pages
    if (this.user && this.user.banType === 'complete') {
      this.$store.dispatch('app/header/show', bannedHeaderData)
    }

    const classCode = localStorage.getItem('joinedClassCode')
    if (classCode) {
      this.joinedClassCode = classCode
      localStorage.removeItem('joinedClassCode')
    }
    this.assignments = this.filterStudentAssignments(
      this.user.studentAssignments
    )
  },
  data() {
    return {
      showTellThemCollegePrepModal: false,
      joinedClassCode: '',
      showFallIncentiveEnrollmentModal: false,
      assignments: [],
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      hadASession: (state) => state.user.hadASession,
      prevSessionSubject: (state) => state.user.prevSessionSubject,
      isFirstDashboardVisit: (state) => state.user.isFirstDashboardVisit,
      latestSession: (state) => state.session.latestSession,
      productFlags: (state) => state.productFlags.flags,
    }),
    ...mapGetters({
      isSessionAlive: 'user/isSessionAlive',
      downtimeBannerMessage: 'featureFlags/downtimeBannerMessage',
      aiTutor: 'featureFlags/aiTutor',
      orbitalSegments: 'featureFlags/orbitalSegments',
      isOrbitalSegmentsActive: 'featureFlags/isOrbitalSegmentsActive',
      showDashboardRedesign: 'user/showDashboardRedesign',
      isProgressReportsActive: 'featureFlags/isProgressReportsActive',
      isAutoStartCollegeSessionActive:
        'featureFlags/isAutoStartCollegeSessionActive',
      autoStartCollegeSession: 'featureFlags/autoStartCollegeSession',
      isCollegePrepAdEnabled: 'featureFlags/isCollegePrepAdEnabled',
      isFallIncentiveProgramEnabled:
        'featureFlags/isFallIncentiveProgramEnabled',
      isMobileMode: 'app/mobileMode',
    }),

    aiBotMessage() {
      return this.aiTutor && this.isMobileMode
        ? 'Try out our new AI Tutor'
        : null
    },

    userAndOrbitalSegment() {
      return [this.user, this.orbitalSegments, this.isOrbitalSegmentsActive]
    },
    shouldSeeIncentiveModalForFirstTime() {
      return (
        this.isFallIncentiveProgramEnabled &&
        Object.entries(this.productFlags).length &&
        !this.productFlags.fallIncentiveEnrollmentAt &&
        this.fallIncentiveProgramModalViewCount === 0
      )
    },
    shouldSeeIncentiveModalForSecondTime() {
      return (
        this.isFallIncentiveProgramEnabled &&
        Object.entries(this.productFlags).length &&
        !this.productFlags.fallIncentiveEnrollmentAt &&
        this.fallIncentiveProgramModalViewCount === 1 &&
        this.hadASession
      )
    },
    fallIncentiveProgramModalViewCount() {
      const viewCount = parseInt(
        localStorage.getItem('fallIncentiveEnrollmentViewCount') ?? ''
      )
      if (!isNaN(viewCount)) return viewCount
      else return 0
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
    toggleFallIncentiveEnrollmentModal() {
      this.showFallIncentiveEnrollmentModal =
        !this.showFallIncentiveEnrollmentModal
    },
    triggerIncentiveProgramBanner() {
      // Prioritize showing the in-session banner if there is a current session
      if (this.isSessionAlive) return
      this.$store.dispatch('app/header/show', {
        component: 'FallIncentiveHeader',
      })
      Gleap.trackEvent('fall-incentive-program')
    },
    triggerIncentiveEnrollmentModal() {
      if (this.showFallIncentiveEnrollmentModal) return
      localStorage.setItem(
        'fallIncentiveEnrollmentViewCount',
        this.fallIncentiveProgramModalViewCount + 1
      )
      this.showFallIncentiveEnrollmentModal = true
    },
    filterStudentAssignments(assignments) {
      //Only show the first 3 incomplete assignments
      return StudentAssignmentUtils.getIncompleteAssignments(assignments).slice(
        0,
        3
      )
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
        if (
          this.isFallIncentiveProgramEnabled &&
          this.user.banType !== 'complete'
        )
          this.triggerIncentiveProgramBanner()
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
          this.user.pastSessions.length >= 1 &&
          this.isCollegePrepAdEnabled
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
          ProductDiscoveryService.triggerOrbitalSegment(
            this,
            this.user,
            this.orbitalSegments
          )
      },
      deep: true,
    },
    isFallIncentiveProgramEnabled(currentValue, prevValue) {
      if (!currentValue && prevValue) {
        this.$store.dispatch('app/header/show', {
          component: 'DefaultHeader',
        })
        this.showFallIncentiveEnrollmentModal = false
        AnalyticsService.captureEvent(
          EVENTS.STUDENT_FALL_INCENTIVE_PROGRAM_ACCESS_REVOKED
        )
      }
      if (currentValue && !prevValue) this.triggerIncentiveProgramBanner()
    },
    shouldSeeIncentiveModalForFirstTime(currentValue, prevValue) {
      if (currentValue && !prevValue) this.triggerIncentiveEnrollmentModal()
    },
    shouldSeeIncentiveModalForSecondTime(currentValue, prevValue) {
      if (currentValue && !prevValue) this.triggerIncentiveEnrollmentModal()
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
.ai-bot {
  color: white;
  display: block;
  svg {
    fill: white;
    transform: scale(0.6);
  }
}
</style>
