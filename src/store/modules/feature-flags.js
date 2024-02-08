import posthog from 'posthog-js'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import FeatureFlagService from '@/services/FeatureFlagService'

/**
 * TODO: Move into FeatureFlagService.
 */
export default {
  namespaced: true,
  actions: {
    async setPersonPropertiesForFlags(actionData, props) {
      posthog.setPersonPropertiesForFlags(props)
    },
  },
  getters: {
    isDashboardBannerActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.DASHBOARD_BANNER
      ),
    isFilterActiveSubjectsActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS
      ),
    isPollingFlagsActive: () =>
      FeatureFlagService.isFeatureEnabled(POSTHOG_FEATURE_FLAGS.POLL_FLAGS),
    isQuizStudyMaterialsActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.QUIZ_STUDY_MATERIALS
      ),
    offerGoogleSSO: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO
      ),
    orbitalSegments: () =>
      FeatureFlagService.getFeatureFlagPayload(
        POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS
      ),
    isOrbitalSegmentsActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS
      ),
    downtimeBannerMessage: () =>
      FeatureFlagService.getFeatureFlagPayload(
        POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER
      ),
    topicCardDashboardReorder: () =>
      FeatureFlagService.getFeatureFlagPayload(
        POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER
      ),
    isTopicDashboardReorderActive: () =>
      FeatureFlagService.getFeatureFlag(
        POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER
      ) === 'dashboard-reorder',
    isJustTellThemActive: () =>
      FeatureFlagService.getFeatureFlag(
        POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER
      ) === 'tell-them',
    subjectRequestRollout: () =>
      FeatureFlagService.getFeatureFlagPayload(
        POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT
      ) ?? [],
    quizRollout: () =>
      FeatureFlagService.getFeatureFlagPayload(
        POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT
      ) ?? [],
    gleapSegmentExperiments: () =>
      FeatureFlagService.getFeatureFlagPayload(
        POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS
      ) ?? [],
    isGleapSegmentExperimentsActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS
      ),
    ccIntroCopy: () =>
      FeatureFlagService.getFeatureFlag(POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY),
    isBfIntroCopyEnabled: () =>
      FeatureFlagService.isFeatureEnabled(POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY),
    bfIntroCopy: () =>
      FeatureFlagService.getFeatureFlagPayload(
        POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY
      ),
    isProcrastinationPreventionActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.PROCRASTINATION_PREVENTION
      ),
    isMutedSubjectAlertsActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.MUTED_SUBJECT_ALERTS
      ),
    isFallIncentiveEnrollmentActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_ENROLLMENT
      ),
    isTutorSessionHistoryActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.TUTOR_SESSION_HISTORY
      ),
    isSessionRecapDmsActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS
      ),
    showDashboardRedesign: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN
      ),
    isRecapSocketUpdatesActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.RECAP_SOCKET_UPDATES
      ),
    isAutoStartCollegeSessionActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION
      ),
    autoStartCollegeSession: () =>
      FeatureFlagService.getFeatureFlagPayload(
        POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION
      ),
    isSmsVerificationEnabled: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION
      ),
    isSmsVerificationEnabledOnSignupFlow: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION_ENABLED_ON_SIGNUP_FLOW
      ),
    eligibilityEmail: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.ELIGIBILITY_EMAIL
      ),
    isNewEligibilityFormDesignEnabled: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.NEW_ELIGIBILITY_FORM_DESIGN
      ),
    isProgressReportsActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS
      ),
    isProgressReportsModalActive: () =>
      FeatureFlagService.isFeatureEnabled(
        POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS_MODAL
      ),
    shouldUseQuillV2: () =>
      FeatureFlagService.isFeatureEnabled(POSTHOG_FEATURE_FLAGS.QUILL_V2),
  },
}
