import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import FeatureFlagService from '@/services/FeatureFlagService'

export default {
  namespaced: true,
  state: {
    toggleFlags: {
      [POSTHOG_FEATURE_FLAGS.DASHBOARD_BANNER]: false,
      [POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS]: false,
      [POSTHOG_FEATURE_FLAGS.POLL_FLAGS]: false,
      [POSTHOG_FEATURE_FLAGS.QUIZ_STUDY_MATERIALS]: false,
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: false,
      [POSTHOG_FEATURE_FLAGS.PROCRASTINATION_PREVENTION]: false,
      [POSTHOG_FEATURE_FLAGS.MUTED_SUBJECT_ALERTS]: false,
      [POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_ENROLLMENT]: false,
      [POSTHOG_FEATURE_FLAGS.TUTOR_SESSION_HISTORY]: false,
      [POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS]: false,
      [POSTHOG_FEATURE_FLAGS.RECAP_SOCKET_UPDATES]: false,
      [POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY]: false,
      [POSTHOG_FEATURE_FLAGS.NEW_ELIGIBILITY_FORM_DESIGN]: false,
      [POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO]: true,
      [POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN]: false,
      [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: false,
      [POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION]: false,
      [POSTHOG_FEATURE_FLAGS.ELIGIBILITY_EMAIL]: false,
      [POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS]: false,
      [POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS_MODAL]: false,
      [POSTHOG_FEATURE_FLAGS.QUILL_V2]: false,
      [POSTHOG_FEATURE_FLAGS.PAID_TUTOR]: false,
      [POSTHOG_FEATURE_FLAGS.PAID_TUTORS_PILOT]: false,
      [POSTHOG_FEATURE_FLAGS.PROGRESS_REPORT_SURVEY]: false,
    },
    multivariantFlags: {
      [POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER]: 'control',
      [POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY]: 'baseline',
    },
    payloadFlags: {
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: [],
      [POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER]: '',
      [POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER]: null,
      [POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT]: [],
      [POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT]: [],
      [POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS]: [],
      [POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY]: '',
      [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: '',
    },
  },
  mutations: {
    updateFlags(state) {
      for (const flag of Object.keys(state.toggleFlags)) {
        state.toggleFlags[flag] =
          FeatureFlagService.isFeatureEnabled(flag) ?? state.toggleFlags[flag]
      }

      for (const flag of Object.keys(state.multivariantFlags)) {
        state.multivariantFlags[flag] =
          FeatureFlagService.getFeatureFlag(flag) ??
          state.multivariantFlags[flag]
      }

      for (const flag of Object.keys(state.payloadFlags)) {
        state.payloadFlags[flag] =
          FeatureFlagService.getFeatureFlagPayload(flag) ??
          state.payloadFlags[flag]
      }

      FeatureFlagService.configureFlagPolling()
    },
  },
  getters: {
    isDashboardBannerActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.DASHBOARD_BANNER],
    isFilterActiveSubjectsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS],
    isPollingFlagsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.POLL_FLAGS],
    isQuizStudyMaterialsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.QUIZ_STUDY_MATERIALS],
    offerGoogleSSO: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO],
    orbitalSegments: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS],
    isOrbitalSegmentsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS],
    downtimeBannerMessage: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER],
    topicCardDashboardReorder: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER],
    isTopicDashboardReorderActive: (state) =>
      state.multivariantFlags[
        POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER
      ] === 'dashboard-reorder',
    isJustTellThemActive: (state) =>
      state.multivariantFlags[
        POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER
      ] === 'tell-them',
    subjectRequestRollout: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT] ?? [],
    quizRollout: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT] ?? [],
    gleapSegmentExperiments: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS] ?? [],
    isGleapSegmentExperimentsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS],
    ccIntroCopy: (state) =>
      state.multivariantFlags[POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY],
    isBfIntroCopyEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY],
    bfIntroCopy: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY],
    isProcrastinationPreventionActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PROCRASTINATION_PREVENTION],
    isMutedSubjectAlertsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.MUTED_SUBJECT_ALERTS],
    isFallIncentiveEnrollmentActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_ENROLLMENT],
    isTutorSessionHistoryActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.TUTOR_SESSION_HISTORY],
    isSessionRecapDmsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS],
    showDashboardRedesign: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN],
    isRecapSocketUpdatesActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.RECAP_SOCKET_UPDATES],
    isAutoStartCollegeSessionActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION],
    autoStartCollegeSession: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION],
    isSmsVerificationEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION],
    eligibilityEmail: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.ELIGIBILITY_EMAIL],
    isProgressReportsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS],
    isProgressReportsModalActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS_MODAL],
    shouldUseQuillV2: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.QUILL_V2],
    isPaidTutor: (state) => state.toggleFlags[POSTHOG_FEATURE_FLAGS.PAID_TUTOR],
    isPaidTutorsPilotRunning: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PAID_TUTORS_PILOT],
    isProgressReportsSurveyActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PROGRESS_REPORT_SURVEY],
  },
}
