import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import FeatureFlagService from '@/services/FeatureFlagService'

export default {
  namespaced: true,
  state: {
    toggleFlags: {
      [POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS]: false,
      [POSTHOG_FEATURE_FLAGS.POLL_FLAGS]: false,
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: false,
      [POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS]: false,
      [POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY]: false,
      [POSTHOG_FEATURE_FLAGS.NEW_ELIGIBILITY_FORM_DESIGN]: false,
      [POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN]: false,
      [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: false,
      [POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION]: false,
      [POSTHOG_FEATURE_FLAGS.ELIGIBILITY_EMAIL]: false,
      [POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS]: false,
      [POSTHOG_FEATURE_FLAGS.PROGRESS_REPORT_SURVEY]: false,
      [POSTHOG_FEATURE_FLAGS.USE_NEW_SIGN_UP_FLOW]: false,
      [POSTHOG_FEATURE_FLAGS.SHOW_IN_APP_SESSION_NOTIFICATIONS]: false,
      [POSTHOG_FEATURE_FLAGS.SESSION_PRESENCE]: false,
      [POSTHOG_FEATURE_FLAGS.MOST_RECENT_SUBJECTS]: false,
      [POSTHOG_FEATURE_FLAGS.ABOUT_THIS_SESSION_SURVEY]: false,
      [POSTHOG_FEATURE_FLAGS.BIG_FUTURE_EMAIL_ELIGIBILITY_FLOW]: false,
      [POSTHOG_FEATURE_FLAGS.BIG_FUTURE_TWO_QUESTION_ELIGIBILITY_FLOW]: false,
      [POSTHOG_FEATURE_FLAGS.VOICE_MESSAGE]: false,
      [POSTHOG_FEATURE_FLAGS.COLLEGE_PREP_AD]: false,
      [POSTHOG_FEATURE_FLAGS.TUTOR_BOT_CHAT]: false,
      [POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_PROGRAM]: false,
      [POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_PROGRAM_PARENTAL_CONSENT]: false,
      [POSTHOG_FEATURE_FLAGS.NATIONAL_STUDENT_PHONE]: false,
      [POSTHOG_FEATURE_FLAGS.AI_OTHER_SUBJECT_SURVEY]: false,
      [POSTHOG_FEATURE_FLAGS.CHOOSE_TUTOR_TYPE]: false,
      [POSTHOG_FEATURE_FLAGS.SESSION_AUDIO_CALL]: false,
      [POSTHOG_FEATURE_FLAGS.SCREENSHARE]: false,
      [POSTHOG_FEATURE_FLAGS.VIDEO_MODERATION_ENABLED]: false,
      [POSTHOG_FEATURE_FLAGS.IMPACT_STUDY_SURVEY]: false,
      [POSTHOG_FEATURE_FLAGS.STUDENTS_BECOME_VOLUNTEERS]: false,
      [POSTHOG_FEATURE_FLAGS.TEACHER_GUIDANCE_EXPERIMENT]: false,
      [POSTHOG_FEATURE_FLAGS.COMBINED_ONBOARDING_QUIZ]: false,
      [POSTHOG_FEATURE_FLAGS.DISPLAY_VOLUNTEER_LANGUAGES]: false,
      [POSTHOG_FEATURE_FLAGS.INFINITE_WHITEBOARD]: false,
      [POSTHOG_FEATURE_FLAGS.SECONDARY_EMAIL_ON_PROFILE_PAGE]: false,
      [POSTHOG_FEATURE_FLAGS.CONFETTI_CELEBRATION]: false,
      [POSTHOG_FEATURE_FLAGS.SHOW_AMBASSADOR_TITLE]: false,
      [POSTHOG_FEATURE_FLAGS.STUDENT_PREFERRED_LANGUAGE]: false,
      [POSTHOG_FEATURE_FLAGS.BECOME_AN_AMBASSADOR_CTA]: false,
      [POSTHOG_FEATURE_FLAGS.SHOW_NEW_INTERNATIONAL_MESSAGE]: false,
      [POSTHOG_FEATURE_FLAGS.UPCHIEVE_101_LMS_FORMAT]: false,
      [POSTHOG_FEATURE_FLAGS.TEXT_REFERRAL_LINKS]: false,
    },
    multivariantFlags: {
      [POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY]: 'baseline',
      [POSTHOG_FEATURE_FLAGS.AI_TUTOR]: '', // stand-alone | stand-alone-in-session | stand-alone-in-session-handoff
      [POSTHOG_FEATURE_FLAGS.VOLUNTEER_SUBJECT_PRESENCE]: '', // tutor-count-shown | tutor-count-hidden
    },
    payloadFlags: {
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: [],
      [POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER]: '',
      [POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT]: [],
      [POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT]: [],
      [POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS]: [],
      [POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY]: '',
      [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: '',
      [POSTHOG_FEATURE_FLAGS.TUTOR_BOT_CHAT]: { type: 'unified' },
      [POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_PROGRAM]: {},
      [POSTHOG_FEATURE_FLAGS.VIDEO_MODERATION_SAMPLE_INTERVAL]: 2000,
      [POSTHOG_FEATURE_FLAGS.TUTOR_FEEDBACK_TO_TEACHER_QUESTION]: '',
      [POSTHOG_FEATURE_FLAGS.IMPACT_STUDY_SURVEY]: {},
      [POSTHOG_FEATURE_FLAGS.STUDENTS_BECOME_VOLUNTEERS]:
        'Interested in becoming a volunteer tutor on UPchieve?',
    },
    eligibleForChooseTutorType: false,
  },
  mutations: {
    updateEligibleForChooseTutorType(state, value) {
      state.eligibleForChooseTutorType = value
    },
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
    isProgressReportsSurveyActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PROGRESS_REPORT_SURVEY],
    useNewSignUpFlow: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.USE_NEW_SIGN_UP_FLOW],
    showInAppSessionNotifications: (state) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.SHOW_IN_APP_SESSION_NOTIFICATIONS
      ],
    isSessionPresenceActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SESSION_PRESENCE],
    isMostRecentSubjectsActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.MOST_RECENT_SUBJECTS],
    isAboutThisSessionSurveyActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.ABOUT_THIS_SESSION_SURVEY],
    isBigFutureEmailFirstFlowActive: (state) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.BIG_FUTURE_EMAIL_ELIGIBILITY_FLOW
      ],
    isBigFutureTwoQuestionEligiblityFlowActive: (state) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.BIG_FUTURE_TWO_QUESTION_ELIGIBILITY_FLOW
      ],
    eligibleForVoiceMessaging: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.VOICE_MESSAGE],
    isCollegePrepAdEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.COLLEGE_PREP_AD],
    isTutorBotChatEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.TUTOR_BOT_CHAT],
    tutorBotChatType: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.TUTOR_BOT_CHAT],
    isFallIncentiveProgramEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_PROGRAM],
    getFallIncentiveProgramPayload: (state) => {
      const payload =
        state.payloadFlags[POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_PROGRAM]
      if (!payload?.maxQualifiedSessionsPerWeek)
        payload.maxQualifiedSessionsPerWeek = 1
      return payload
    },
    isFallIncentiveParentalConsentEnabled: (state) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_PROGRAM_PARENTAL_CONSENT
      ],
    isNationalStudentPhoneEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.NATIONAL_STUDENT_PHONE],
    aiTutor: (state) => state.multivariantFlags[POSTHOG_FEATURE_FLAGS.AI_TUTOR],
    showChooseTutorType: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.CHOOSE_TUTOR_TYPE] ||
      state.eligibleForChooseTutorType,
    isSessionAudioCallEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SESSION_AUDIO_CALL],
    isScreenshareEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SCREENSHARE],
    videoModerationSampleInterval: (state) =>
      state.payloadFlags[
        POSTHOG_FEATURE_FLAGS.VIDEO_MODERATION_SAMPLE_INTERVAL
      ],
    isVideoModerationEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.VIDEO_MODERATION_ENABLED],
    isImpactStudySurveyEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.IMPACT_STUDY_SURVEY],
    getImpactStudySurveyPayload: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.IMPACT_STUDY_SURVEY],
    isStudentsBecomeVolunteersEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.STUDENTS_BECOME_VOLUNTEERS],
    studentsBecomeVolunteersCopy: (state) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.STUDENTS_BECOME_VOLUNTEERS],
    tutorFeedbackToTeacherQuestion: (state) =>
      state.payloadFlags[
        POSTHOG_FEATURE_FLAGS.TUTOR_FEEDBACK_TO_TEACHER_QUESTION
      ],
    isTeacherGuidanceExperimentActive: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.TEACHER_GUIDANCE_EXPERIMENT],
    isCombinedOnboardingQuizEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.COMBINED_ONBOARDING_QUIZ],
    isDisplayVolunteerLanguagesEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.DISPLAY_VOLUNTEER_LANGUAGES],
    isInfiniteWhiteboardEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.INFINITE_WHITEBOARD],
    isSecondaryEmailOnProfilePageEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SECONDARY_EMAIL_ON_PROFILE_PAGE],
    isConfettiCelebrationEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.CONFETTI_CELEBRATION],
    isShowAmbassadorTitleEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SHOW_AMBASSADOR_TITLE],
    volunteerSubjectPresenceVariant: (state) =>
      state.multivariantFlags[POSTHOG_FEATURE_FLAGS.VOLUNTEER_SUBJECT_PRESENCE],
    isSelectingPreferredLanguageEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.STUDENT_PREFERRED_LANGUAGE],
    isBecomeAnAmbassadorCtaEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.BECOME_AN_AMBASSADOR_CTA],
    showNewInternationalMessage: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SHOW_NEW_INTERNATIONAL_MESSAGE],
    isUpchieve101LMSFormatEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.UPCHIEVE_101_LMS_FORMAT],
    isTextReferralLinksEnabled: (state) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.TEXT_REFERRAL_LINKS],
  },
  actions: {
    isSessionAudioCallEnabled: async ({ getters, dispatch }, partnerUserId) => {
      const isEnabledForPartner =
        await FeatureFlagService.isFeatureEnabledForUser(
          POSTHOG_FEATURE_FLAGS.SESSION_AUDIO_CALL,
          partnerUserId
        )
      const isScreenshareEnabled = await dispatch(
        'isScreenshareEnabled',
        partnerUserId
      )

      return (
        isEnabledForPartner.isEnabled ||
        getters.isSessionAudioCallEnabled ||
        isScreenshareEnabled
      )
    },
    isScreenshareEnabled: async ({ getters }, partnerUserId) => {
      const isEnabledForPartner =
        await FeatureFlagService.isFeatureEnabledForUser(
          POSTHOG_FEATURE_FLAGS.SCREENSHARE,
          partnerUserId
        )
      return isEnabledForPartner.isEnabled || getters.isScreenshareEnabled
    },
  },
}
