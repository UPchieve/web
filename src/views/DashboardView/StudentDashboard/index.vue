<template>
  <div class="student-dashboard" data-testid="student-dashboard">
    <div v-if="showAssignments">
      <StudentAssignments :assignments="user.studentAssignments" />
    </div>
    <div v-else-if="showGradeLevelSelect">
      <GradeLevelTask
        data-testid="grade-level-select"
        @dismissed="setGradeLevelTaskDismissed"
      />
    </div>
    <dashboard-banner
      v-else
      :subheader="
        showDashboardRedesign ? `What can we help you with today?` : ``
      "
    />
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
        v-if="impactStudySurveyCache"
        class="dashboard-notice"
        :class="'dashboard-notice--info'"
        :routeTo="`/surveys/impact-study/${impactStudySurveyCache.surveyId}`"
        :showArrow="false"
        >{{
          impactStudySurveyCache.rewardAmount
            ? `You almost earned $${impactStudySurveyCache.rewardAmount}!`
            : ''
        }}
        Finish up your survey <arrow-icon
      /></large-button>
    </div>

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
      v-if="showImpactStudySurveyModal"
      :closeModal="toggleImpactStudySurveyModal"
      :impactStudyCampaignId="impactStudySurveyCampaignId"
    />

    <journey-modal v-if="showJourneyModal" :closeModal="toggleJourneyModal" />

    <update-school-modal />

    <secondary-email-modal
      v-if="showSecondaryEmailModal"
      :showPermanentDismissOption="true"
      @dismissed="onSecondaryEmailDismissed"
      @completed="updateSecondaryEmail"
      @permanentlyDismissed="setPermanentlyDismissedSecondaryEmailModal"
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
import JoinedClassModal from './JoinedClassModal.vue'
import UpdateSchoolModal from './UpdateSchoolModal.vue'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import * as BrowserStorageService from '@/services/BrowserStorageService'
import { EVENTS, POSTHOG_FEATURE_FLAGS } from '@/consts'
import Gleap from 'gleap'
import ArrowIcon from '@/assets/arrow.svg'
import LargeButton from '@/components/LargeButton.vue'
import StudentAssignments from '@/components/StudentAssignments.vue'
import OnboardingModal from '@/components/OnboardingModal.vue'
import JourneyModal from './JourneyModal.vue'
import Student_Onboarding_Frame1 from '@/assets/student_onboarding_frames/Student_Onboarding_Frame1.avif?url'
import Student_Onboarding_Frame2 from '@/assets/student_onboarding_frames/Student_Onboarding_Frame2.avif?url'
import Student_Onboarding_Frame3 from '@/assets/student_onboarding_frames/Student_Onboarding_Frame3.avif?url'
import Student_Onboarding_Frame4 from '@/assets/student_onboarding_frames/Student_Onboarding_Frame4.avif?url'
import Student_Onboarding_Frame1Fallback from '@/assets/student_onboarding_frames/Student_Onboarding_Frame1.png?url'
import Student_Onboarding_Frame2Fallback from '@/assets/student_onboarding_frames/Student_Onboarding_Frame2.png?url'
import Student_Onboarding_Frame3Fallback from '@/assets/student_onboarding_frames/Student_Onboarding_Frame3.png?url'
import Student_Onboarding_Frame4Fallback from '@/assets/student_onboarding_frames/Student_Onboarding_Frame4.png?url'
import { getImpactStudyCacheKey } from '@/utils/cache-keys'
import SecondaryEmailModal from '@/views/SecondaryEmailModal.vue'
import { isEmpty } from 'lodash-es'
import getNotificationPermission from '@/utils/get-notification-permission'
import sendWebNotification from '@/utils/send-web-notification'
import {
  hasPermanentlyDismissedSecondaryEmailModal,
  hasTemporarilyDismissedSecondaryEmailModal,
  setTemporarilyDismissSecondaryEmailModal,
  setPermanentlyDismissSecondaryEmailModal,
  isTargetEmailDomain,
} from '@/utils/secondary-email-modal-utils'
import { defineAsyncComponent } from 'vue'
import GradeLevelTask from '@/views/GradeLevelTask.vue'

const ImpactStudySurveyModal = defineAsyncComponent(
  () => import('./ImpactStudySurveyModal.vue')
)
const FallIncentiveEnrollmentModal = defineAsyncComponent(
  () => import('./FallIncentiveEnrollmentModal.vue')
)

export default {
  name: 'student-dashboard',
  components: {
    GradeLevelTask,
    SecondaryEmailModal,
    DashboardBanner,
    SubjectSelection,
    JoinedClassModal,
    FallIncentiveEnrollmentModal,
    ImpactStudySurveyModal,
    UpdateSchoolModal,
    ArrowIcon,
    LargeButton,
    StudentAssignments,
    OnboardingModal,
    JourneyModal,
  },
  beforeMount() {
    if (BrowserStorageService.getGradeLevelTaskFromStorage()) {
      BrowserStorageService.setGradeLevelTaskInStorage()
      this.dismissedGradeLevelTask = true
    }
  },
  async created() {
    if (
      this.shouldSeeIncentiveModalForFirstTime ||
      this.shouldSeeIncentiveModalForSecondTime
    )
      this.triggerIncentiveEnrollmentModal()

    this.hasGradeLevel = !!this.user.gradeLevel

    // TODO: Do this better.
    // Dashboard page view ends up coming before account created/verified.
    if (localStorage.getItem('isSSOSignUpRedirect')) {
      AnalyticsService.captureEvent(EVENTS.ACCOUNT_CREATED)
      AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED)
      AnalyticsService.captureGoogleAnalyticsEvent('student_sign_up')
      localStorage.removeItem('isSSOSignUpRedirect')
      this.$store.dispatch('user/firstDashboardVisit', true)
    }

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
        image: {
          url: Student_Onboarding_Frame1,
          type: 'image/avif',
          fallback: {
            url: Student_Onboarding_Frame1Fallback,
            type: 'image/png',
          },
        },
      },
      {
        step: 2,
        heading: 'Rule #1: Play Nice with Your Coach',
        text: "All UPchieve coaches are unpaid volunteers who want to help you succeed. Make sure to be friendly and respectful, and don't forget to say thank you and goodbye before ending your session!",
        image: {
          url: Student_Onboarding_Frame2,
          type: 'image/avif',
          fallback: {
            url: Student_Onboarding_Frame2Fallback,
            type: 'image/png',
          },
        },
      },
      {
        step: 3,
        heading: 'Rule #2: Engage in Learning',
        text: "You're on UPchieve to learn! Our coaches are only there to guide you, so be sure to actively participate in your session. Coaches are not allowed to give you the answers or do the work for you.",
        image: {
          url: Student_Onboarding_Frame3,
          type: 'image/avif',
          fallback: {
            url: Student_Onboarding_Frame3Fallback,
            type: 'image/png',
          },
        },
      },
      {
        step: 4,
        heading: 'Rule #3: Stay Safe Out There',
        text: "You came to UPchieve for homework help, not the tea. Keep conversations on-topic and don't share personal information like your phone number, IG handle, or email. Never connect with a coach offline.",
        image: {
          url: Student_Onboarding_Frame4,
          type: 'image/avif',
          fallback: {
            url: Student_Onboarding_Frame4Fallback,
            type: 'image/png',
          },
        },
      },
    ]

    if (this.volunteerSubjectPresenceVariant)
      this.scheduleVolunteerPresenceNotification()

    if (this.hadASession) {
      await this.processImpactStudySurvey()
      // TODO: Replace `hadASession` with a more reliable session check (e.g. comparing session IDs),
      // since it's currently used more like `justHadASession` to trigger side effects when the user
      // finishes a session and returns to the dashboard
      // We have to reset here so that this isn't triggered on every dashboard view
      this.$store.dispatch('user/updateHadASession', false)
    }

    if (this.shouldSeeJourneyModal) this.showJourneyModal = true
  },
  data() {
    return {
      joinedClassCode: '',
      showFallIncentiveEnrollmentModal: false,
      assignments: [],
      onboardingFrames: [],
      showImpactStudySurveyModal: false,
      showJourneyModal: false,
      dismissedSecondaryEmailModal: false,
      impactStudySurveyCampaignId: '',
      hasGradeLevel: false,
      dismissedGradeLevelTask: false,
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
      currentSession: (state) => state.user.session,
      subjects: (state) => state.subjects.subjects,
    }),
    ...mapGetters({
      isSessionAlive: 'user/isSessionAlive',
      downtimeBannerMessage: 'featureFlags/downtimeBannerMessage',
      showDashboardRedesign: 'user/showDashboardRedesign',
      isFallIncentiveProgramEnabled:
        'featureFlags/isFallIncentiveProgramEnabled',
      isImpactStudySurveyEnabled: 'featureFlags/isImpactStudySurveyEnabled',
      getImpactStudySurveyPayload: 'featureFlags/getImpactStudySurveyPayload',
      isMobileMode: 'app/mobileMode',
      isSecondaryEmailOnProfilePageEnabled:
        'featureFlags/isSecondaryEmailOnProfilePageEnabled',
      volunteerSubjectPresenceVariant:
        'featureFlags/volunteerSubjectPresenceVariant',
      isStudent: 'user/isStudent',
      hasVolunteerRole: 'user/hasVolunteerRole',
    }),
    showGradeLevelSelect() {
      return !this.hasGradeLevel && !this.dismissedGradeLevelTask
    },
    showAssignments() {
      return this.user.studentAssignments?.length
    },
    hasPermanentlyDismissedSecondaryEmailModal() {
      return hasPermanentlyDismissedSecondaryEmailModal(this.user.id)
    },
    hasTemporarilyDismissedSecondaryEmailModal() {
      return hasTemporarilyDismissedSecondaryEmailModal(this.user.id)
    },
    isTargetEmailDomainForSecondaryEmailModal() {
      return isTargetEmailDomain(this.user.email)
    },
    showSecondaryEmailModal() {
      return (
        this.isSecondaryEmailOnProfilePageEnabled &&
        !this.dismissedSecondaryEmailModal &&
        !this.user.proxyEmail &&
        !this.hasPermanentlyDismissedSecondaryEmailModal &&
        !this.hasTemporarilyDismissedSecondaryEmailModal &&
        this.isTargetEmailDomainForSecondaryEmailModal
      )
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
      if (cacheHit && this.isImpactStudySurveyEnabled)
        return JSON.parse(cacheHit)
      return undefined
    },
    shouldSeeJourneyModal() {
      const hasSeen = localStorage.getItem('seenJourneyModal')
      return !hasSeen
    },
  },
  methods: {
    setGradeLevelTaskDismissed() {
      this.dismissedGradeLevelTask = true
      BrowserStorageService.setGradeLevelTaskInStorage()
    },
    setPermanentlyDismissedSecondaryEmailModal() {
      setPermanentlyDismissSecondaryEmailModal(this.user.id, new Date())
    },
    onSecondaryEmailDismissed() {
      this.toggleSecondaryEmailModal()
      setTemporarilyDismissSecondaryEmailModal(this.user.id)
    },
    async updateSecondaryEmail(email) {
      await this.$store.dispatch('user/addToUser', {
        proxyEmail: email,
      })
    },
    toggleSecondaryEmailModal() {
      this.dismissedSecondaryEmailModal = true
    },
    toggleFallIncentiveEnrollmentModal() {
      this.showFallIncentiveEnrollmentModal =
        !this.showFallIncentiveEnrollmentModal
    },
    toggleImpactStudySurveyModal() {
      this.showImpactStudySurveyModal = !this.showImpactStudySurveyModal
    },
    toggleJourneyModal() {
      this.showJourneyModal = !this.showJourneyModal
    },
    triggerIncentiveEnrollmentModal() {
      if (this.showFallIncentiveEnrollmentModal) return
      localStorage.setItem(
        'fallIncentiveEnrollmentViewCount',
        this.fallIncentiveProgramModalViewCount + 1
      )
      this.showFallIncentiveEnrollmentModal = true
    },
    async maybeTriggerVolunteerPresenceNotification() {
      const now = Date.now()
      const presenceKey = 'lastVolunteerPresenceNotificationAt'
      const lastNotifiedAt = localStorage.getItem(presenceKey)
      const sixHoursInMs = 1000 * 60 * 60 * 6
      const fiveMinutesInMs = 1000 * 60 * 5
      const hasRecentNotification =
        lastNotifiedAt &&
        now - new Date(lastNotifiedAt).getTime() < sixHoursInMs

      const hasNoCurrentOrRecentSession =
        isEmpty(this.currentSession) &&
        this.latestSession?.createdAt &&
        new Date(this.latestSession.createdAt).getTime() < now - fiveMinutesInMs

      const hasRequestedSubjects = this.user?.latestRequestedSubjects.length > 0
      const hasPermissionGranted = getNotificationPermission() === 'granted'

      if (
        hasNoCurrentOrRecentSession &&
        hasRequestedSubjects &&
        hasPermissionGranted &&
        !hasRecentNotification
      ) {
        try {
          const {
            data: { presenceBySubject },
          } = await NetworkService.getVolunteerPresence()
          const mostRecentSubject = this.user.latestRequestedSubjects[0]
          const subject = this.subjects[mostRecentSubject]
          const totalOnlineForSubject = presenceBySubject[mostRecentSubject]
          if (!subject)
            throw new Error(
              `No subject ${mostRecentSubject} found in subjects store`
            )
          if (!totalOnlineForSubject) return

          const body =
            this.volunteerSubjectPresenceVariant === 'tutor-count-shown'
              ? `There ${totalOnlineForSubject === 1 ? 'is' : 'are'} ${totalOnlineForSubject} tutor${totalOnlineForSubject === 1 ? '' : 's'} online for ${subject.displayName} right now!`
              : `There are tutors online ready to help in ${subject.displayName}!`

          sendWebNotification(
            `Get help in ${subject.displayName}!`,
            {
              body,
            },
            {
              totalVolunteersAvailable: totalOnlineForSubject,
              pageVisibility: document.visibilityState,
              subject: subject.name,
              experiment: POSTHOG_FEATURE_FLAGS.VOLUNTEER_SUBJECT_PRESENCE,
              type: POSTHOG_FEATURE_FLAGS.VOLUNTEER_SUBJECT_PRESENCE,
              variant: this.volunteerSubjectPresenceVariant,
            }
          )
          localStorage.setItem(presenceKey, new Date().toISOString())
        } catch (error) {
          LoggerService.noticeError(error)
        }
      }
    },
    scheduleVolunteerPresenceNotification() {
      // Trigger notification after student has spent some time on the dashboard
      const twoMinutesInMS = 1000 * 60 * 2
      setTimeout(() => {
        this.maybeTriggerVolunteerPresenceNotification()
      }, twoMinutesInMS)
    },
    async processImpactStudySurvey() {
      try {
        const payload = this.getImpactStudySurveyPayload
        if (!payload || !Object.keys(payload).length) return

        const { campaignId, surveyId, maxViewCount, rewardAmount, launchedAt } =
          payload
        if (!campaignId) return
        const campaigns = this.productFlags.impactStudyCampaigns
        let campaign = campaigns[campaignId]
        if (!campaign) {
          localStorage.removeItem(getImpactStudyCacheKey(this.user.id))
          campaign = {
            id: campaignId,
            surveyId,
            viewCount: 0,
            maxViewCount,
            rewardAmount,
            createdAt: new Date(),
            launchedAt,
          }

          await NetworkService.upsertImpactStudyCampaign(campaign)
          campaigns[campaignId] = campaign
          this.$store.commit('productFlags/setImpactStudyCampaigns', campaigns)
        }

        if (campaign.submittedAt || campaign.viewCount >= maxViewCount) return
        this.impactStudySurveyCampaignId = campaignId
        this.showImpactStudySurveyModal = true
      } catch (error) {
        LoggerService.noticeError(error)
      }
    },
  },
  watch: {
    hadASession: {
      async handler(currentValue, prevValue) {
        if (currentValue && !prevValue) {
          await this.processImpactStudySurvey()
          this.$store.dispatch('user/updateHadASession', false)
        }
      },
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
    volunteerSubjectPresenceVariant(currentValue, prevValue) {
      if (currentValue && !prevValue)
        this.scheduleVolunteerPresenceNotification()
    },
    shouldSeeJourneyModal(currentValue, prevValue) {
      if (currentValue && !prevValue) this.showJourneyModal = true
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
.volunteer-ad {
  padding-top: 40px;
}
</style>
