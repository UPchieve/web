<template>
  <div class="student-dashboard">
    <dashboard-banner
      v-if="!user.studentAssignments.length"
      :subheader="
        showDashboardRedesign ? `What can we help you with today?` : ``
      "
    />
    <div v-else>
      <StudentAssignments :assignments="user.studentAssignments" />
    </div>
    <!-- TODO: Make notices into a reusable component. -->
    <div class="dashboard-notices">
      <div
        v-if="downtimeBannerMessage"
        class="dashboard-notice dashboard-notice--warn"
      >
        <a href="https://upchieve.statuspage.io" target="_blank">{{
          downtimeBannerMessage
        }}</a>
      </div>
      <large-button
        v-if="isStandaloneAiTutorEnabled && aiBotMessage"
        class="dashboard-notice ai-bot"
        :class="'dashboard-notice--info'"
        routeTo="/ai-tutor-conversations"
        >{{ aiBotMessage }}<arrow-icon></arrow-icon
      ></large-button>

      <large-button
        v-if="impactStudySurveyCache"
        class="dashboard-notice"
        :class="'dashboard-notice--info'"
        routeTo="/surveys/impact-study"
        >You almost earned ${{ impactStudySurveyCache.rewardAmount }}! Finish up
        your survey <arrow-icon></arrow-icon
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
    <impact-study-survey-modal
      v-if="showImpactStudySurvey"
      :closeModal="toggleImpactStudySurvey"
    />
    <subject-selection />

    <onboarding-modal
      v-if="this.isFirstDashboardVisit"
      :pages="onboardingFrames"
      :closeModal="() => $store.dispatch('user/firstDashboardVisit', false)"
      nextButtonText="Next"
      acceptButtonText="Get started!"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import DashboardBanner from '../DashboardBanner.vue'
import SubjectSelection from './SubjectSelection/index.vue'
import TellThemCollegePrepModal from './TellThemCollegePrepModal.vue'
import JoinedClassModal from './JoinedClassModal.vue'
import FallIncentiveEnrollmentModal from './FallIncentiveEnrollmentModal.vue'
import ImpactStudySurveyModal from './ImpactStudySurveyModal.vue'
import AnalyticsService from '@/services/AnalyticsService'
import ProductDiscoveryService from '@/services/ProductDiscoveryService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import FeatureFlagService from '@/services/FeatureFlagService'
import { EVENTS } from '@/consts'
import Gleap from 'gleap'
import ArrowIcon from '@/assets/arrow.svg'
import LargeButton from '@/components/LargeButton.vue'
import StudentAssignments from '@/components/StudentAssignments.vue'
import OnboardingModal from '@/components/OnboardingModal.vue'
import Student_Onboarding_Frame1 from '@/assets/student_onboarding_frames/Student_Onboarding_Frame1.svg'
import Student_Onboarding_Frame2 from '@/assets/student_onboarding_frames/Student_Onboarding_Frame2.svg'
import Student_Onboarding_Frame3 from '@/assets/student_onboarding_frames/Student_Onboarding_Frame3.svg'
import Student_Onboarding_Frame4 from '@/assets/student_onboarding_frames/Student_Onboarding_Frame4.svg'
import { getImpactStudyCacheKey } from '@/utils/cache-keys'

export default {
  name: 'student-dashboard',
  components: {
    DashboardBanner,
    SubjectSelection,
    TellThemCollegePrepModal,
    JoinedClassModal,
    FallIncentiveEnrollmentModal,
    ImpactStudySurveyModal,
    ArrowIcon,
    LargeButton,
    StudentAssignments,
    OnboardingModal,
  },
  async created() {
    if (
      this.shouldSeeIncentiveModalForFirstTime ||
      this.shouldSeeIncentiveModalForSecondTime
    )
      this.triggerIncentiveEnrollmentModal()

    if (localStorage.getItem('isSSOSignUpRedirect')) {
      AnalyticsService.captureEvent(EVENTS.ACCOUNT_CREATED)
      AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED)
      localStorage.removeItem('isSSOSignUpRedirect')
      this.$store.dispatch('user/firstDashboardVisit', true)
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
      !this.productFlags.tellThemCollegePrepModalSeenAt &&
      this.user.pastSessions.length >= 1 &&
      this.isCollegePrepAdEnabled
    )
      this.showTellThemCollegePrepModal = true

    const classCode = localStorage.getItem('joinedClassCode')
    if (classCode) {
      this.joinedClassCode = classCode
      localStorage.removeItem('joinedClassCode')
    }
    this.onboardingFrames = [
      {
        step: 1,
        heading: 'Welcome to UPchieve!',
        text: "You're almost ready to get started! We just need to lay down some ground rules.",
        image: Student_Onboarding_Frame1,
      },
      {
        step: 2,
        heading: 'Rule #1: Play Nice with Your Coach',
        text: "All UPchieve coaches are unpaid volunteers who want to help you succeed. Make sure to be friendly and respectful, and don't forget to say thank you and goodbye before ending your session!",
        image: Student_Onboarding_Frame2,
      },
      {
        step: 3,
        heading: 'Rule #2: Engage in Learning',
        text: "You're on UPchieve to learn! Our coaches are only there to guide you, so be sure to actively participate in your session. Coaches are not allowed to give you the answers or do the work for you.",
        image: Student_Onboarding_Frame3,
      },
      {
        step: 4,
        heading: 'Rule #3: Stay Safe Out There',
        text: "You came to UPchieve for homework help, not the tea. Keep conversations on-topic and don't share personal information like your phone number, IG handle, or email. Never connect with a coach offline.",
        image: Student_Onboarding_Frame4,
      },
    ]
  },
  data() {
    return {
      showTellThemCollegePrepModal: false,
      joinedClassCode: '',
      showFallIncentiveEnrollmentModal: false,
      assignments: [],
      onboardingFrames: [],
      showImpactStudySurvey: false,
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
      isImpactStudySurveyEnabled: 'featureFlags/isImpactStudySurveyEnabled',
      isMobileMode: 'app/mobileMode',
    }),

    aiBotMessage() {
      return this.isStandaloneAiTutorEnabled && this.isMobileMode
        ? 'Try out our new AI Tutor'
        : null
    },

    isStandaloneAiTutorEnabled() {
      return this.aiTutor && this.aiTutor.includes('stand-alone')
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
    impactStudySurveyCache() {
      const cacheHit = localStorage.getItem(
        getImpactStudyCacheKey(this.user.id)
      )
      if (cacheHit) return JSON.parse(cacheHit)
      return undefined
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
    toggleImpactStudySurvey() {
      this.showImpactStudySurvey = !this.showImpactStudySurvey
    },
    triggerIncentiveEnrollmentModal() {
      if (this.showFallIncentiveEnrollmentModal) return
      localStorage.setItem(
        'fallIncentiveEnrollmentViewCount',
        this.fallIncentiveProgramModalViewCount + 1
      )
      this.showFallIncentiveEnrollmentModal = true
    },
    async processImpactStudySurvey() {
      let didResetForNewSurvey = false
      if (this.productFlags.impactStudyEnrollmentAt) {
        try {
          const [{ data: currentSurveyData }, { data: surveyResponseData }] =
            await Promise.all([
              NetworkService.getImpactStudySurvey(),
              NetworkService.getImpactStudySurveyResponses(),
            ])
          // User has already filled out the survey
          if (currentSurveyData.surveyId === surveyResponseData.surveyId) return

          const isNewImpactStudySurveyForUser =
            currentSurveyData.surveyId !== surveyResponseData.surveyId
          if (surveyResponseData && isNewImpactStudySurveyForUser) {
            const currentSurveyId = currentSurveyData.surveyId
            const lastResetSurveyId =
              Number(localStorage.getItem('lastImpactStudySurveyId')) || 0

            // If this is the first time seeing the new survey, reset view count
            if (currentSurveyId !== lastResetSurveyId) {
              localStorage.setItem('lastImpactStudySurveyId', currentSurveyId)
              localStorage.removeItem('impactStudySurveyModalViewCount')
              AnalyticsService.captureEvent(
                EVENTS.STUDENT_IMPACT_STUDY_NEW_SURVEY_RECEIVED,
                {
                  $set: { impactStudySurveyModalViewCount: 0 },
                }
              )
              FeatureFlagService.setPersonPropertiesForFlags({
                impactStudySurveyModalViewCount: 0,
              })
              didResetForNewSurvey = true
            }
          }
        } catch (error) {
          LoggerService.noticeError(error)
        }
      }

      if (this.isImpactStudySurveyEnabled || didResetForNewSurvey)
        this.showImpactStudySurvey = true
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
    hadASession: {
      async handler(currentValue, prevValue) {
        if (
          currentValue &&
          !prevValue &&
          !this.productFlags.tellThemCollegePrepModalSeenAt &&
          this.user.pastSessions.length >= 1 &&
          this.isCollegePrepAdEnabled
        ) {
          this.showTellThemCollegePrepModal = true
        }

        if (currentValue && !prevValue) await this.processImpactStudySurvey()
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
        this.showFallIncentiveEnrollmentModal = false
        AnalyticsService.captureEvent(
          EVENTS.STUDENT_FALL_INCENTIVE_PROGRAM_ACCESS_REVOKED
        )
      }

      if (currentValue && !prevValue) {
        Gleap.trackEvent('fall-incentive-program')
      }
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
  background-color: $c-success-green;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  margin-top: 20px;
  font-weight: 500;
  padding: 15px;
  text-align: center;

  a {
    color: #fff;
    white-space: pre-line;

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
    color: #fff;
    width: 100%;

    svg {
      fill: #fff;
    }
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
