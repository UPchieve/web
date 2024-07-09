import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import FeatureFlagService from '@/services/FeatureFlagService'

export default {
  namespaced: true,
  state: {
    toggleFlags: {
      [POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS]: false,
      [POSTHOG_FEATURE_FLAGS.POLL_FLAGS]: false,
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: false,
      [POSTHOG_FEATURE_FLAGS.MUTED_SUBJECT_ALERTS]: false,
      [POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS]: false,
      [POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY]: false,
      [POSTHOG_FEATURE_FLAGS.NEW_ELIGIBILITY_FORM_DESIGN]: false,
      [POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO]: true,
      [POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN]: false,
      [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: false,
      [POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION]: false,
      [POSTHOG_FEATURE_FLAGS.ELIGIBILITY_EMAIL]: false,
      [POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS]: false,
      [POSTHOG_FEATURE_FLAGS.QUILL_V2]: false,
      [POSTHOG_FEATURE_FLAGS.PROGRESS_REPORT_SURVEY]: false,
      [POSTHOG_FEATURE_FLAGS.USE_NEW_SIGN_UP_FLOW]: false,
      [POSTHOG_FEATURE_FLAGS.SHOW_IN_APP_SESSION_NOTIFICATIONS]: false,
      [POSTHOG_FEATURE_FLAGS.TEACHER_SIGN_UP]: false,
      [POSTHOG_FEATURE_FLAGS.WHITEBOARD_ERASER_TOOL]: false,
      [POSTHOG_FEATURE_FLAGS.SESSION_PRESENCE]: false,
      [POSTHOG_FEATURE_FLAGS.MOST_RECENT_SUBJECTS]: false,
    },
    multivariantFlags: {
      [POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY]: 'baseline',
    },
    payloadFlags: {
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: [],
      [POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER]: '',
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
    isFilterActiveSubjectsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS],
    isPollingFlagsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.POLL_FLAGS],
    offerGoogleSSO: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO],
    orbitalSegments: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS],
    isOrbitalSegmentsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS],
    downtimeBannerMessage: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER],
    subjectRequestRollout: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT] ?? [],
    quizRollout: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT] ?? [],
    gleapSegmentExperiments: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS] ?? [],
    isGleapSegmentExperimentsActive: (_state, getters) =>
      getters.gleapSegmentExperiments.length > 0,
    ccIntroCopy: (state) =>
      state.multivariantFlags[POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY],
    isBfIntroCopyEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY],
    bfIntroCopy: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY],
    isMutedSubjectAlertsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.MUTED_SUBJECT_ALERTS],
    isSessionRecapDmsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS],
    showDashboardRedesign: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN],
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
    shouldUseQuillV2: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.QUILL_V2],
    isProgressReportsSurveyActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PROGRESS_REPORT_SURVEY],
    useNewSignUpFlow: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.USE_NEW_SIGN_UP_FLOW],
    showInAppSessionNotifications: (state) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.SHOW_IN_APP_SESSION_NOTIFICATIONS
      ],
    isTeacherSignUpEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.TEACHER_SIGN_UP],
    isWhiteboardEraserToolActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.WHITEBOARD_ERASER_TOOL],
    isSessionPresenceActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SESSION_PRESENCE],
    isMostRecentSubjectsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.MOST_RECENT_SUBJECTS],
  },
}
