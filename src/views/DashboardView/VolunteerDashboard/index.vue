<template>
  <div class="volunteer-dashboard">
    <dashboard-banner />

    <!-- TODO: Make notices into a reusable component. -->
    <div v-if="downtimeBannerMessage" class="dashboard-notice">
      <a href="https://upchieve.statuspage.io" target="_blank">{{
        downtimeBannerMessage
      }}</a>
    </div>

    <div class="volunteer-dashboard__body">
      <template v-if="user.isApproved && user.isOnboarded">
        <ListSessionsCard
          :notificationsCardWasDismissed="notificationsCardWasDismissed"
        />
        <TaskCard title="Your Impact Summary">
          <template v-slot:heading-content>
            <div v-if="isVerifyHoursButtonEnabled" class="verify-hours">
              <LargeButton
                target="_blank"
                routeTo="https://forms.gle/ocSvom8GcdudzuBJA"
                @click="trackVerifyHoursClick"
              >
                Verify hours
              </LargeButton>
            </div>
          </template>
          <template v-slot:content>
            <loader v-if="isLoadingImpactSummary" class="loader--center" />
            <div v-else class="impact-summary-content">
              <div class="impact-summary">
                <div class="coaching-activity">
                  <div class="impact-summary__heading">
                    <chat-icon />
                    <h2 class="impact-summary__title">Coaching Activity</h2>
                  </div>

                  <div class="coaching-activity__hours-this-week-title">
                    <h3>Hours this week</h3>
                    <span
                      class="stat-tooltip"
                      v-tooltip="{
                        text: 'Monday to Sunday UTC time',
                        color: 'black',
                        position: 'top',
                      }"
                    >
                      <InformationIcon />
                    </span>
                  </div>
                  <h4 class="coaching-activity__hours-this-week">
                    {{ impactStats.timeTutoredThisWeek }}
                  </h4>
                  <div class="coaching-activity__divider"></div>
                  <div class="impact-summary__stats">
                    <span class="stat-name">Hours all time</span
                    ><span class="stat">{{ impactStats.numHoursTutored }}</span>
                  </div>
                  <div class="impact-summary__stats">
                    <span class="stat-name">Requests filled</span
                    ><span class="stat">{{
                      impactStats.numRequestsFilled
                    }}</span>
                  </div>
                  <div class="impact-summary__stats">
                    <span class="stat-name">Certifications</span
                    ><span class="stat">{{
                      impactStats.totalQuizzesPassed
                    }}</span>
                  </div>
                </div>
                <div class="impact-summary-right">
                  <div class="community-impact">
                    <div class="impact-summary__heading">
                      <notes-icon />
                      <h2 class="impact-summary__title">Community Impact</h2>
                    </div>
                    <div class="impact-summary__stats">
                      <span class="stat-name">Students helped</span
                      ><span class="stat">{{
                        impactStats.totalStudentsHelped
                      }}</span>
                    </div>
                    <div class="impact-summary__stats">
                      <span class="stat-name">Referral Hours</span
                      ><span class="stat">{{
                        impactStats.numReferralHours
                      }}</span>
                    </div>
                  </div>
                  <div class="availability">
                    <div class="impact-summary__heading">
                      <clock-icon />
                      <h2 class="impact-summary__title">Availability</h2>
                    </div>
                    <div class="impact-summary__stats">
                      <span class="stat-name">Hours selected</span
                      ><span class="stat">{{
                        impactStats.numHoursSelected
                      }}</span>
                    </div>
                    <div class="impact-summary__stats">
                      <span class="stat-name">Hours elapsed</span
                      ><span class="stat">{{
                        impactStats.numElapsedAvailabilityHours
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="dashboard-card-link">
                <HyperlinkButton
                  bold
                  :routeTo="hourTrackingGuide"
                  rel="noopener noreferrer"
                  >How to track your volunteer hours</HyperlinkButton
                >
              </div>
            </div>
          </template>
        </TaskCard>
      </template>
      <template v-else-if="isCombinedOnboardingChecklistEnabled">
        <ListSessionsCard
          :notificationsCardWasDismissed="notificationsCardWasDismissed"
          :sessionClickOverride="sessionClickDialog"
        />
        <TaskCard
          title="New Volunteer Checklist"
          :show-estimated-time="true"
          :subtitle="combinedCardSubheader"
          :actions="combinedActions"
        >
          <template v-slot:icon>
            <OnboardingIcon v-if="user.isApproved" />
            <VerificationIcon v-else />
          </template>
        </TaskCard>
      </template>
      <template v-else>
        <TaskCard
          v-if="!user.isApproved"
          data-testid="safety-screening"
          title="Safety Screening"
          :subtitle="approvalCardSubheader"
          :actions="safetyScreeningActions"
        >
          <template v-slot:icon>
            <VerificationIcon />
          </template>
        </TaskCard>
        <TaskCard
          title="New Volunteer Checklist"
          subtitle="While waiting for your safety screening to process, complete our quick onboarding so you're ready to start helping students as soon as possible"
          :actions="onboardingAccountActions"
        >
          <template v-slot:icon>
            <OnboardingIcon />
          </template>
        </TaskCard>
      </template>
      <TaskCard
        v-if="shouldShowNotificationsCard"
        id="dashboard-notifications-card"
        title="Get Notified About Student Requests"
        subtitle="Never miss an opportunity to help students by enabling browser notifications and opting-in to text messages."
        :actions="notificationActions"
        :dismissOptions="{ onDismiss: toggleDidDismissNotificationsCard }"
      >
        <template v-slot:icon>
          <RingingNotificationBellIcon />
        </template>
        <template v-slot:content>
          <div class="video-wrapper">
            <iframe
              class="video"
              src="https://player.vimeo.com/video/797113791?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
              title="Vimeo video player"
              allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
                web-share;
              "
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
        </template>
      </TaskCard>
    </div>

    <joined-team-modal
      v-if="joinedTeamCode && group?.groupInfo?.name"
      @close-modal="() => (joinedTeamCode = '')"
      :teamCode="joinedTeamCode"
      :teamName="group.groupInfo?.groupName"
    />

    <photo-upload-modal
      v-if="showPhotoUploadModal"
      :closeModal="togglePhotoUploadModal"
    />

    <volunteer-welcome-modal
      v-if="showWelcomeModal"
      :closeModal="toggleWelcomeModal"
    />

    <share-milestone-modal
      v-if="showMilestoneModal"
      :closeModal="handleMilestoneModalClose"
      :typeOfMilestone="typeOfMilestone"
    />
    <next-task-modal
      v-if="showNextTaskModal"
      :closeModal="toggleNextTaskModal"
      :nextTask="nextTask"
    />
  </div>
</template>

<script>
import { flow, reduce, get, isBoolean } from 'lodash-es'
import { mapState, mapGetters } from 'vuex'
import DashboardBanner from '../DashboardBanner.vue'
import PhotoUploadModal from './PhotoUploadModal.vue'
import NextTaskModal from './NextTaskModal.vue'
import VolunteerWelcomeModal from '@/views/DashboardView/VolunteerDashboard/VolunteerWelcomeModal.vue'
import SquareTextIcon from '@/assets/square-text-icon.svg'
import PersonCardIcon from '@/assets/person-card.svg'
import PersonIcon from '@/assets/person.svg'
import CertificationIcon from '@/assets/certification.svg'
import VerificationIcon from '@/assets/verification.svg'
import OnboardingIcon from '@/assets/onboarding.svg'
import TrainingIcon from '@/assets/training_icon.svg'
import RingingNotificationBellIcon from '@/assets/icons/ringing-notification-bell.svg'
import SimpleRingingBellIcon from '@/assets/icons/simple-ringing-notification-bell.svg'
import NetworkService from '../../../services/NetworkService'
import config from '../../../config'
import Loader from '@/components/Loader.vue'
import { hoursToHoursAndMinutes } from '@/utils/time-utils'
import InformationIcon from '@/assets/information.svg'
import { vTooltip } from 'maz-ui'
import ShareMilestoneModal from '@/views/DashboardView/VolunteerDashboard/ShareMilestoneModal.vue'
import ClockIcon from '@/assets/icons/clock_icon.svg'
import ChatIcon from '@/assets/icons/chat-outline-rounded.svg'
import NotesIcon from '@/assets/icons/notes-checkmark.svg'
import setNotificationPermission from '@/utils/set-notification-permission'
import getNotificationPermission from '@/utils/get-notification-permission'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import TaskCard from '@/components/TaskCard.vue'
import LargeButton from '@/components/LargeButton.vue'
import ListSessionsCard from '@/views/DashboardView/VolunteerDashboard/ListSessions/ListSessionsCard.vue'
import JoinedTeamModal from './JoinedTeamModal.vue'
import HyperlinkButton from '@/components/HyperlinkButton.vue'
import { quizRoute } from '@/utils/quiz-route'

// (1) Hours selected
const userHasSchedule = flow([get, isBoolean])

const ETA = {
  BACKGROUND_INFO: 1,
  INTRO_TO_UPC: 20,
  UNLOCK_SUBJECT: 20,
  PROOF_OF_ID: 2,
}

export default {
  name: 'volunteer-dashboard',
  components: {
    HyperlinkButton,
    ListSessionsCard,
    TaskCard,
    DashboardBanner,
    PhotoUploadModal,
    // eslint-disable-next-line vue/no-unused-components
    SquareTextIcon,
    VerificationIcon,
    RingingNotificationBellIcon,
    // eslint-disable-next-line vue/no-unused-components
    SimpleRingingBellIcon,
    OnboardingIcon,
    VolunteerWelcomeModal,
    Loader,
    InformationIcon,
    ShareMilestoneModal,
    ClockIcon,
    ChatIcon,
    NotesIcon,
    LargeButton,
    JoinedTeamModal,
    NextTaskModal,
  },
  directives: {
    tooltip: vTooltip,
  },

  watch: {
    allSubjectNames: {
      handler(currValue, prevValue) {
        const isNowLoaded = currValue.length && !prevValue?.length
        if (isNowLoaded) this.initImpactSummary()
      },
      immediate: true,
      deep: true,
    },
  },
  async created() {
    if (this.isFirstDashboardVisit) {
      this.toggleWelcomeModal()
    }
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission
    } else {
      this.notificationPermission = 'denied'
    }

    this.notificationsCardWasDismissed =
      localStorage.getItem('DISMISSED_NOTIFICATIONS_CARD') === this.user.id

    if (localStorage.getItem('isSSOSignUpRedirect')) {
      AnalyticsService.registerVolunteer(this.user)
      AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED, {
        verificationMethod: VERIFICATION_METHOD.EMAIL,
      })

      localStorage.removeItem('isSSOSignUpRedirect')
      store.dispatch('user/firstDashboardVisit', true)
    }

    const joinedTeamCode = localStorage.getItem('joinedTeamCode')
    if (joinedTeamCode) {
      this.joinedTeamCode = joinedTeamCode
      localStorage.removeItem('joinedTeamCode')
    }
  },
  data() {
    return {
      showPhotoUploadModal: false,
      showWelcomeModal: false,
      showNextTaskModal: false,
      lastUpdated: '',
      isLoadingImpactSummary: true,
      hasSeenMilestoneModal: localStorage.getItem('hasSharedMilestone'),
      notificationPermission: 'default',
      notificationsCardWasDismissed: false,
      joinedTeamCode: '',
      nextTask: {},
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      isFirstDashboardVisit: (state) => state.user.isFirstDashboardVisit,
      hasSharedMilestone: (state) => state.user.hasSharedMilestone,
      availabilityLastModifiedAt: (state) =>
        state.user.user?.availabilityLastModifiedAt,
      group: (state) => state.nths.NTHSGroups?.[0],
    }),
    ...mapGetters({
      isSessionAlive: 'user/isSessionAlive',
      sessionPath: 'user/sessionPath',
      hasSelectedAvailability: 'user/hasSelectedAvailability',
      downtimeBannerMessage: 'featureFlags/downtimeBannerMessage',
      allSubjectNames: 'subjects/allSubtopicNames',
      getVolunteerMilestoneSharingStudyVariant:
        'featureFlags/getVolunteerMilestoneSharingStudyVariant',
      isVerifyHoursButtonEnabled: 'featureFlags/isVerifyHoursButtonEnabled',
      hasCompletedVolunteerTraining: 'user/hasCompletedVolunteerTraining',
      isComputedUnlockSubject: 'subjects/isComputedUnlockSubject',
      quizSubjectToUnlock: 'subjects/quizSubjectToUnlock',
      isCombinedOnboardingChecklistEnabled:
        'featureFlags/isCombinedOnboardingChecklistEnabled',
      hasASubjectCertification: 'user/hasASubjectCertification',
    }),
    shouldShowNotificationsCard() {
      return (
        !this.notificationsCardWasDismissed &&
        !this.didCompleteAllNotificationActions
      )
    },
    isCustomVolunteerPartner() {
      return config.customVolunteerPartnerOrgs.some(
        (org) => org === this.user.volunteerPartnerOrg
      )
    },

    photoIdAction() {
      switch (this.user.photoIdStatus) {
        case 'EMPTY':
          return {
            subtitle: 'Upload a photo ID',
            status: 'not-started',
          }
        case 'SUBMITTED':
          return {
            subtitle: 'Waiting for review (1-2 business days)',
            status: 'in-progress',
          }
        case 'APPROVED':
          return {
            subtitle: 'Completed',
            status: 'complete',
          }
        case 'REJECTED':
          return {
            subtitle: 'Please upload a different photo',
            status: 'error',
          }
        default:
          return {
            subtitle: 'Upload a photo ID',
            status: 'not-started',
          }
      }
    },

    availabilityAction() {
      if (this.hasSelectedAvailability)
        return {
          subtitle: 'Completed',
          status: 'complete',
        }

      return {
        subtitle: 'Select at least one hour',
        status: 'not-started',
      }
    },

    certificationAction() {
      return this.hasASubjectCertification
        ? {
            subtitle: 'Completed',
            status: 'complete',
          }
        : {
            subtitle: 'Pass at least one quiz',
            status: 'not-started',
          }
    },

    trainingAction() {
      const passedQuiz = this.hasCompletedVolunteerTraining
      if (passedQuiz)
        return {
          subtitle: 'Completed',
          status: 'complete',
        }

      const startedCourse = this.user.trainingCourses.upchieve101.progress > 0
      if (startedCourse)
        return {
          subtitle: 'In progress',
          status: 'in-progress',
        }

      return {
        subtitle: 'Go through our training',
        status: 'not-started',
      }
    },

    hasCompletedBackgroundInfo() {
      return (
        Object.hasOwn(this.user, 'occupation') &&
        this.user.occupation.length > 0 &&
        Object.hasOwn(this.user, 'country') &&
        this.user.country.length > 0
      )
    },

    approvalCardSubheader() {
      if (this.user.volunteerPartnerOrg)
        return 'Just one step left to get approved to volunteer with UPchieve!'

      return 'Student safety is our top priority! Please complete our screening process before you can start working with students.'
    },

    combinedCardSubheader() {
      return 'Please complete our screening process before you can start working with students.'
    },

    combinedActions() {
      return [
        {
          title: 'Background information',
          subtitle: this.hasCompletedBackgroundInfo
            ? 'Completed'
            : 'Fill out form',
          status: this.hasCompletedBackgroundInfo ? 'complete' : 'not-started',
          onClick: this.goToBackgroundInfo,
          icon: PersonIcon,
          priority: 0,
          estimatedTimeToCompleteInMinutes: ETA.BACKGROUND_INFO,
        },
        {
          title: 'Complete Intro to UPchieve',
          subtitle: this.trainingAction.subtitle,
          status: this.trainingAction.status,
          onClick: this.clickUpchieve101Action,
          icon: TrainingIcon,
          priority: 1,
          estimatedTimeToCompleteInMinutes: ETA.INTRO_TO_UPC,
        },
        {
          title: 'Unlock a subject',
          subtitle: this.certificationAction.subtitle,
          status: this.certificationAction.status,
          onClick: this.clickCertificationAction,
          icon: CertificationIcon,
          priority: 2,
          estimatedTimeToCompleteInMinutes: ETA.UNLOCK_SUBJECT,
        },
        {
          title: 'Proof of identity',
          subtitle: this.photoIdAction.subtitle,
          status: this.photoIdAction.status,
          onClick: this.togglePhotoUploadModal,
          icon: PersonCardIcon,
          priority: 3,
          estimatedTimeToCompleteInMinutes: ETA.PROOF_OF_ID,
        },
      ]
    },

    partnerKeysThatRequirePhotoId() {
      return config.partnerKeysThatRequirePhotoId
    },

    safetyScreeningActions() {
      return !this.user.volunteerPartnerOrg ||
        this.partnerKeysThatRequirePhotoId.includes(
          this.user.volunteerPartnerOrg
        )
        ? this.openVolunteerApprovalAccountActions
        : this.partnerVolunteerApprovalAccountActions
    },

    openVolunteerApprovalAccountActions() {
      const accountActions = [
        {
          title: 'Background information',
          subtitle: this.hasCompletedBackgroundInfo
            ? 'Completed'
            : 'Fill out form',
          status: this.hasCompletedBackgroundInfo ? 'complete' : 'not-started',
          onClick: this.goToBackgroundInfo,
          icon: PersonIcon,
          priority: this.hasCompletedBackgroundInfo ? 0 : 1,
        },
        {
          title: 'Proof of identity',
          subtitle: this.photoIdAction.subtitle,
          status: this.photoIdAction.status,
          onClick: this.togglePhotoUploadModal,
          icon: PersonCardIcon,
          priority: this.addSortPriorityNum(this.photoIdAction.status),
        },
      ]

      return accountActions.sort((a, b) => a.priority - b.priority)
    },

    partnerVolunteerApprovalAccountActions() {
      const accountActions = [
        {
          title: 'Background information',
          subtitle: this.hasCompletedBackgroundInfo
            ? 'Completed'
            : 'Fill out form',
          status: this.hasCompletedBackgroundInfo ? 'complete' : 'not-started',
          onClick: this.goToBackgroundInfo,
          icon: PersonIcon,
          priority: this.hasCompletedBackgroundInfo ? 0 : 1,
        },
        {
          title: 'Proof of identity',
          subtitle: 'Completed',
          status: 'complete',
          onClick: () => {},
          icon: PersonCardIcon,
          priority: 0,
        },
      ]

      return accountActions.sort((a, b) => a.priority - b.priority)
    },

    onboardingAccountActions() {
      const onboardingActions = [
        {
          title: 'Complete Intro to UPchieve',
          subtitle: this.trainingAction.subtitle,
          status: this.trainingAction.status,
          onClick: this.clickUpchieve101Action,
          icon: TrainingIcon,
          priority: this.addSortPriorityNum(this.trainingAction.status),
        },
        {
          title: 'Unlock a subject',
          subtitle: this.certificationAction.subtitle,
          status: this.certificationAction.status,
          onClick: this.clickCertificationAction,
          icon: CertificationIcon,
          priority: this.addSortPriorityNum(this.certificationAction.status),
        },
      ]
      return onboardingActions.sort((a, b) => a.priority - b.priority)
    },

    webNotificationsStatus() {
      return this.notificationPermission === 'granted'
        ? 'complete'
        : 'not-started'
    },
    didSetAvailability() {
      return this.availabilityLastModifiedAt ? 'complete' : 'not-started'
    },
    didCompleteAllNotificationActions() {
      return (
        this.webNotificationsStatus === 'complete' &&
        this.didSetAvailability === 'complete'
      )
    },

    notificationActions() {
      return [
        {
          title: 'Enable Browser Notifications',
          subtitle:
            this.notificationPermission === 'default'
              ? 'Optional'
              : this.notificationPermission === 'denied'
                ? 'Please edit your browser settings to enable notifications'
                : 'Completed',
          status: this.webNotificationsStatus,
          onClick: this.onClickBrowserNotifications,
          icon: SimpleRingingBellIcon,
          estimatedTimeToCompleteInMinutes: 1,
        },
        {
          title: 'Sign Up for Texts',
          subtitle: this.availabilityLastModifiedAt ? 'Completed' : 'Optional',
          status: this.didSetAvailability,
          onClick: this.onClickSignupForTextNotifications,
          icon: SquareTextIcon,
          estimatedTimeToCompleteInMinutes: 1,
        },
      ]
    },

    hourTrackingGuide() {
      if (this.isCustomVolunteerPartner)
        return 'https://cdn.upchieve.org/docs/Verizon-Volunteer-Hour-Tracking-Resource.pdf'
      return 'https://cdn.upchieve.org/docs/volunteer-hour-tracking-guide.pdf'
    },

    impactStats() {
      if (this.isCustomVolunteerPartner) {
        return this.getCustomImpactStats({
          availability: this.user.availability,
          totalVolunteerHours: this.user.totalVolunteerHours,
          pastSessions: this.user.pastSessions,
          totalQuizzesPassed: this.user.totalQuizzesPassed,
        })
      }

      return this.getImpactStats({
        availability: this.user.availability,
        pastSessions: this.user.pastSessions,
        hoursTutored: this.user.hoursTutored,
        hoursTutoredThisWeek: this.user.hoursTutoredThisWeek,
        elapsedAvailability: this.user.elapsedAvailability,
        totalQuizzesPassed: this.user.totalQuizzesPassed,
        totalStudentsHelped: this.user.uniqueStudentsHelpedCount,
        numReferredVolunteers: this.user.numReferredVolunteers,
      })
    },
    typeOfMilestone() {
      if (
        this.getVolunteerMilestoneSharingStudyVariant ===
        'completed-first-hour-of-tutoring'
      )
        return 'hour'
      else if (
        this.getVolunteerMilestoneSharingStudyVariant ===
        'tutored-first-three-students'
      )
        return 'students'
      return ''
    },
    hasCompletedFirstHourOfTutoring() {
      return (
        this.getVolunteerMilestoneSharingStudyVariant ===
          'completed-first-hour-of-tutoring' && this.user.hoursTutored >= 1
      )
    },
    hasTutoredFirstThreeStudents() {
      return (
        this.getVolunteerMilestoneSharingStudyVariant ===
          'tutored-first-three-students' &&
        this.user.uniqueStudentsHelpedCount >= 3
      )
    },
    showMilestoneModal() {
      return (
        !this.hasSeenMilestoneModal &&
        !this.hasSharedMilestone &&
        ((this.hasTutoredFirstThreeStudents &&
          this.typeOfMilestone === 'students') ||
          (this.typeOfMilestone === 'hour' &&
            this.hasCompletedFirstHourOfTutoring))
      )
    },
  },
  methods: {
    sessionClickDialog(session) {
      if (!this.hasCompletedBackgroundInfo) {
        AnalyticsService.captureEvent(
          EVENTS.LOCKED_SESSIONS_CLICKED_UNLOCK_SUBJECT,
          {
            subject: session.subTopic,
            step: 'complete-background-info',
          }
        )
        return this.toggleNextTaskModal({
          title: 'Background Information',
          action: () => this.goToBackgroundInfo(),
          actionText: 'Fill out form',
          actionTime: `Filling out your <b>Background Information</b> takes about <b>${ETA.BACKGROUND_INFO}
          ${ETA.BACKGROUND_INFO === 1 ? 'minute' : 'minutes'}</b>.`,
        })
      }

      if (!this.hasCompletedVolunteerTraining) {
        AnalyticsService.captureEvent(
          EVENTS.LOCKED_SESSIONS_CLICKED_UNLOCK_SUBJECT,
          {
            subject: session.subTopic,
            step: 'complete-volunteer-training',
          }
        )
        return this.toggleNextTaskModal({
          title: 'Complete Intro to UPchieve',
          action: () => this.clickUpchieve101Action(),
          actionText: 'Go through our training',
          actionTime: `Completeing <b>Intro to UPchieve</b> training takes about <b>${ETA.INTRO_TO_UPC} ${ETA.INTRO_TO_UPC === 1 ? 'minute' : 'minutes'}</b>.`,
        })
      }

      if (!this.user.certifications[session.subTopic].passed) {
        AnalyticsService.captureEvent(
          EVENTS.LOCKED_SESSIONS_CLICKED_UNLOCK_SUBJECT,
          {
            subject: session.subTopic,
            step: 'subject-certification',
          }
        )
        return this.toggleNextTaskModal({
          title: 'Unlock a Subject',
          action: () => this.goToSubjectCert(session),
          actionText: `Unlock ${session.subjectDisplayName}`,
          actionTime: `Unlocking <b>${session.subjectDisplayName}</b> takes about <b>${ETA.UNLOCK_SUBJECT} ${ETA.UNLOCK_SUBJECT === 1 ? 'minute' : 'minutes'}</b>.`,
        })
      }

      if (!this.user.photoIdStatus || this.user.photoIdStatus === 'EMPTY') {
        AnalyticsService.captureEvent(
          EVENTS.LOCKED_SESSIONS_CLICKED_UNLOCK_SUBJECT,
          {
            subject: session.subTopic,
            step: `upload-photo-${this.user.photoIdStatus}`,
          }
        )
        return this.togglePhotoUploadModal()
      }

      if (this.user.photoIdStatus !== 'APPROVED') {
        AnalyticsService.captureEvent(
          EVENTS.LOCKED_SESSIONS_CLICKED_UNLOCK_SUBJECT,
          {
            subject: session.subTopic,
            step: `upload-photo-${this.user.photoIdStatus}`,
          }
        )
        return this.togglePhotoUploadModal()
      }
    },
    goToSubjectCert(session) {
      if (this.isComputedUnlockSubject(session.subTopic)) {
        // These subjects require you to take multiple quizzes to unlock them.
        // Send the user to the Training page
        const route = `/training?openTo=${session.subTopic}`
        this.$router.push(route)
      } else {
        const quizSubject = this.quizSubjectToUnlock(session.subTopic)
        const route = quizRoute(quizSubject)
        this.$router.push(route)
      }
    },
    trackVerifyHoursClick() {
      AnalyticsService.captureEvent(EVENTS.VERIFY_HOURS_BUTTON_CLICKED)
    },
    toggleDidDismissNotificationsCard() {
      AnalyticsService.captureEvent(
        EVENTS.SKIP_AVAILABILITY_REQT_CARD_DISMISSED
      )
      localStorage.setItem('DISMISSED_NOTIFICATIONS_CARD', this.user.id)
      this.notificationsCardWasDismissed = !this.notificationsCardWasDismissed
    },
    showOnboardingModal() {
      this.$store.dispatch('app/modal/show', {
        component: 'VolunteerOnboardingModal',
        data: { alertModal: true, acceptText: 'Get started' },
      })
    },
    toggleWelcomeModal() {
      this.showWelcomeModal = !this.showWelcomeModal
    },
    handleMilestoneModalClose() {
      localStorage.setItem('hasSharedMilestone', 'true')
      this.$store.commit('user/sharedMilestone', true)
      this.hasSeenMilestoneModal = true
    },
    togglePhotoUploadModal() {
      this.showPhotoUploadModal = !this.showPhotoUploadModal
    },
    toggleNextTaskModal(nextTask) {
      this.nextTask = nextTask ? nextTask : {}
      this.showNextTaskModal = !this.showNextTaskModal
    },
    clickCertificationAction() {
      this.$router.push('/training')
    },
    clickUpchieve101Action() {
      this.$router.push('/training/course/upchieve101')
    },
    onClickBrowserNotifications() {
      AnalyticsService.captureEvent(
        EVENTS.SKIP_AVAILABILITY_REQT_CLICKED_ENABLE_BROWSER_NOTIFICATIONS
      )
      const initialPermission = getNotificationPermission()
      if (['default', 'denied'].includes(initialPermission)) {
        Notification.requestPermission((permission) => {
          setNotificationPermission(permission)
          this.notificationPermission = permission
        })
      }
    },
    onClickSignupForTextNotifications() {
      AnalyticsService.captureEvent(
        EVENTS.SKIP_AVAILABILITY_REQT_CLICKED_SIGN_UP_FOR_TEXT_NOTIFICATIONS
      )
      this.$router.push('/calendar')
    },
    goToBackgroundInfo() {
      this.$router.push('/background-information')
    },
    addSortPriorityNum(status) {
      if (status === 'complete') return 0
      if (status === 'error') return 1
      if (status === 'in-progress') return 2
    },
    async getLastUpdated() {
      const res = await NetworkService.getVolunteerLastUpdated()
      if (res.data.err) {
        return 'Error retriving last update time'
      }
      const lastUpdated = res.data.lastUpdated
      return `Last updated on ${lastUpdated}`
    },
    getImpactStats({
      availability,
      pastSessions,
      hoursTutored,
      hoursTutoredThisWeek,
      totalQuizzesPassed,
      elapsedAvailability,
      totalStudentsHelped,
      numReferredVolunteers,
    }) {
      let numHoursSelected = 0

      if (userHasSchedule(availability, 'Thursday.5p')) {
        numHoursSelected = reduce(
          availability,
          (weeklyHourCount, dayHours) => {
            // Tally up num hours for each day
            const hoursSelectedForDay = reduce(
              dayHours,
              (dailyHourCount, hourVal) => {
                // Add 1 if hour val is true
                return dailyHourCount + (hourVal ? 1 : 0)
              },
              0
            )

            return weeklyHourCount + hoursSelectedForDay
          },
          0
        )
      }

      // (3) Requests filled
      const numRequestsFilled = get(pastSessions, 'length', 0)

      const formatFn = ({ hours, minutes }) => `${hours}h ${minutes}m`

      // (4) Hours tutored
      const numHoursTutored = hoursToHoursAndMinutes(
        Number(hoursTutored ?? 0),
        formatFn
      )

      // (5) Hours tutored this week
      const timeTutoredThisWeek = hoursToHoursAndMinutes(
        hoursTutoredThisWeek ? Number(hoursTutoredThisWeek) : 0,
        formatFn
      )

      // (6) Elapsed availability
      const numElapsedAvailabilityHours = `${elapsedAvailability} h`

      const numReferralHours = hoursToHoursAndMinutes(
        (numReferredVolunteers * 12) / 60,
        formatFn
      )

      numHoursSelected = `${numHoursSelected} h`

      return {
        numHoursSelected,
        totalQuizzesPassed,
        numRequestsFilled,
        numHoursTutored,
        timeTutoredThisWeek,
        numElapsedAvailabilityHours,
        totalStudentsHelped,
        numReferralHours,
      }
    },
    getCustomImpactStats({
      availability,
      totalVolunteerHours,
      pastSessions,
      totalQuizzesPassed,
    }) {
      let numHoursSelected = 0

      if (userHasSchedule(user, 'availability.Thursday.5p')) {
        numHoursSelected = reduce(
          availability,
          (weeklyHourCount, dayHours) => {
            // Tally up num hours for each day
            const hoursSelectedForDay = reduce(
              dayHours,
              (dailyHourCount, hourVal) => {
                // Add 1 if hour val is true
                return dailyHourCount + (hourVal ? 1 : 0)
              },
              0
            )

            return weeklyHourCount + hoursSelectedForDay
          },
          0
        )
      }

      // (3) Requests filled
      const numRequestsFilled = get(pastSessions, 'length', '--')

      // (4) Hours volunteered
      const numHoursVolunteered = Number(totalVolunteerHours) || '--'

      return [
        {
          label: 'Hours of availability selected',
          value: `${numHoursSelected} hours selected`,
        },
        {
          label: 'Number of quizzes passed',
          value: `${totalQuizzesPassed} quizzes passed`,
        },
        {
          label: 'Number of requests filled',
          value: `${numRequestsFilled} requests filled`,
        },
        {
          label: 'Total hours of volunteering completed',
          value: `${numHoursVolunteered} hours volunteered`,
        },
      ]
    },
    async initImpactSummary() {
      try {
        if (this.isCustomVolunteerPartner) {
          this.lastUpdated = await this.getLastUpdated()
        }
        if (this.isVerifyHoursButtonEnabled) {
          AnalyticsService.captureEvent(EVENTS.VERIFY_HOURS_BUTTON_SEEN)
        }
      } finally {
        this.isLoadingImpactSummary = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.video-wrapper {
  margin-bottom: 24px;
  width: 80%;
  aspect-ratio: 16 / 9;

  .video {
    width: 100%;
    height: 100%;
  }
}

.btn {
  height: 60px;
  background-color: #16d2aa;
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: white;
  line-height: 40px;

  &:hover {
    background-color: #16d2aa;
  }

  &:disabled {
    color: white;
  }

  &.rejoinSessionBtn {
    border-radius: 30px;
    width: 300px;
    margin-top: 25px;
  }
}

.volunteer-dashboard {
  @include flex-container(column);
  padding: 40px 15px;

  @include breakpoint-above('medium') {
    display: inline-flex;
    min-width: 100%;
    padding: 40px;
  }

  &__body {
    @include child-spacing(top, 16px);
    @include child-spacing(right, 0);
    margin-top: 40px;

    @include breakpoint-above('huge') {
      @include child-spacing(top, 0);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
  }
}

.notifications-button-container {
  display: flex;
  flex-direction: row;
  align-self: flex-end;
}

.notifications-button {
  @include flex-container(row, flex-end);
  margin-bottom: 1.4em;
}

.dashboard-card-link {
  text-align: center;
}

.dashboard-notice {
  background: $c-warning-orange;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  margin: 20px 0 -20px;
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
}

.rejoin-session-container {
  text-align: center;
}

.loader--center {
  text-align: center;
}

.stat-tooltip:before {
  transition-duration: 0ms;
}

.impact-summary-content {
  width: 100%;
}

.impact-summary {
  @include flex-container(row, center, stretch);
  gap: 12px;
  padding: 16px 30px;

  @include breakpoint-below('small') {
    @include flex-container(column, center, center);
  }

  &__title {
    font-size: 20px;
    font-weight: 500;
    text-wrap: nowrap;
    margin: 0;
  }

  &__stats {
    @include flex-container(row, space-between, center);
    margin: 6px 0;

    .stat-name {
      font-size: 15px;
      font-weight: 500;
      line-height: 150%;
      margin-right: 16px;
    }

    .stat {
      font-size: 16px;
      font-weight: 700;
      line-height: 150%;
    }
  }

  &__heading {
    @include flex-container(row, flex-start, center);
    gap: 5px;
    margin: 8px 0;
  }
}

.coaching-activity {
  @include flex-container(column, center, space-evenly);
  flex: 1;
  border: lightgray 1px solid;
  border-radius: 12px;
  padding: 6px 12px;
  border-top: 10px solid rgba(22, 210, 170, 0.2);
  width: 100%;
  height: auto;
  margin-right: 14px;

  &__hours-this-week-title {
    @include flex-container(row, flex-start, flex-end);
    gap: 6px;

    h3 {
      font-size: 15px;
      margin: 0;
    }

    svg {
      width: 12px;
      height: 12px;
      margin-top: 2px;
    }
  }

  &__hours-this-week {
    font-size: 28px;
    font-weight: 600;
  }

  &__divider {
    background-color: #d8dee5;
    height: 1px;
    margin: 20px 0;
    justify-self: center;
  }
}

.community-impact,
.availability {
  @include flex-container(column, center, space-between);
  border: lightgray 1px solid;
  border-radius: 12px;
  padding: 8px;
  width: 100%;
}

.community-impact {
  border-top: 10px solid #e3f2fd;
  margin-bottom: 14px;
}

.availability {
  border-top: 10px solid #feefc2;
}

.impact-summary-right {
  gap: 8px;
  flex: 1;
  @include flex-container(column, stretch, flex-start);

  @include breakpoint-below('small') {
    flex: 0;
    width: 100%;
    gap: 12px;
  }
}
.verify-hours {
  width: 100%;
  display: flex;
  flex-direction: column-reverse;
  align-items: end;
}
</style>
