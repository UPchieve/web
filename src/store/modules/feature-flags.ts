import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import FeatureFlagService from '@/services/FeatureFlagService'
import type { RootState } from '..'
import type { ActionContext } from 'vuex'

export type FeatureFlagState = {
  toggleFlags: Record<POSTHOG_FEATURE_FLAGS, boolean>
  multivariantFlags: Record<POSTHOG_FEATURE_FLAGS, boolean | string>
  payloadFlags: Record<POSTHOG_FEATURE_FLAGS, any>
  eligibleForChooseTutorType: boolean
}

export default {
  namespaced: true,
  state: {
    toggleFlags: {
      [POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS]: false,
      [POSTHOG_FEATURE_FLAGS.POLL_FLAGS]: false,
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: false,
      [POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS]: false,
      [POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY]: false,
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
      [POSTHOG_FEATURE_FLAGS.SECONDARY_EMAIL_ON_PROFILE_PAGE]: false,
      [POSTHOG_FEATURE_FLAGS.CONFETTI_CELEBRATION]: false,
      [POSTHOG_FEATURE_FLAGS.SHOW_AMBASSADOR_TITLE]: false,
      [POSTHOG_FEATURE_FLAGS.STUDENT_PREFERRED_LANGUAGE]: false,
      [POSTHOG_FEATURE_FLAGS.BECOME_AN_AMBASSADOR_CTA]: false,
      [POSTHOG_FEATURE_FLAGS.SHOW_NEW_INTERNATIONAL_MESSAGE]: false,
      [POSTHOG_FEATURE_FLAGS.UPCHIEVE_101_LMS_FORMAT]: false,
      [POSTHOG_FEATURE_FLAGS.TEXT_REFERRAL_LINKS]: false,
      [POSTHOG_FEATURE_FLAGS.PENDING_MESSAGES]: false,
      [POSTHOG_FEATURE_FLAGS.CLASSLINK_SSO]: false,
      [POSTHOG_FEATURE_FLAGS.STUDENTS_INITIATE_DMS]: false,
      [POSTHOG_FEATURE_FLAGS.INCENTIVE_BANNER]: false,
      [POSTHOG_FEATURE_FLAGS.UPCHIEVE_101_V3]: false,
      [POSTHOG_FEATURE_FLAGS.FORCE_SMS_VERIFICATION]: true,
      [POSTHOG_FEATURE_FLAGS.DISABLE_STUDENT_CREATION]: false,
      [POSTHOG_FEATURE_FLAGS.GUIDED_JOURNEYS]: false,
      [POSTHOG_FEATURE_FLAGS.REFERRAL_MODAL_REDESIGN]: false,
      [POSTHOG_FEATURE_FLAGS.UPDATED_DOC_EDITOR_IMAGE_STORAGE]: false,
      [POSTHOG_FEATURE_FLAGS.SKIP_AVAILABILITY_ONBOARDING_REQUIREMENT]: false,
      [POSTHOG_FEATURE_FLAGS.IMAGE_UPLOAD_UX]: false,
      [POSTHOG_FEATURE_FLAGS.SLACK_COMMUNITY_ENABLED]: false,
      [POSTHOG_FEATURE_FLAGS.PRESENTATION_SCHEDULE_SHIFTS]: false,
      [POSTHOG_FEATURE_FLAGS.VERIFY_HOURS_BUTTON]: false,
      [POSTHOG_FEATURE_FLAGS.SHOW_LOCKED_SESSIONS]: false,
      [POSTHOG_FEATURE_FLAGS.GOOGLE_SIGNUP_FOR_VOLUNTEERS]: false,
    },
    multivariantFlags: {
      [POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY]: 'baseline',
      [POSTHOG_FEATURE_FLAGS.AI_TUTOR]: '', // stand-alone | stand-alone-in-session | stand-alone-in-session-handoff
      [POSTHOG_FEATURE_FLAGS.VOLUNTEER_SUBJECT_PRESENCE]: '', // tutor-count-shown | tutor-count-hidden
      [POSTHOG_FEATURE_FLAGS.VOLUNTEER_MILESTONE_SHARING_STUDY]: '', // completed-first-hour-of-tutoring | tutored-first-three-students
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
      [POSTHOG_FEATURE_FLAGS.UPDATE_SCHOOL_MODAL]: null,
      [POSTHOG_FEATURE_FLAGS.IMPACT_STUDY_SURVEY]: {},
      [POSTHOG_FEATURE_FLAGS.STUDENTS_BECOME_VOLUNTEERS]:
        'Interested in becoming a volunteer tutor on UPchieve?',
      [POSTHOG_FEATURE_FLAGS.INCENTIVE_BANNER]: '',
      [POSTHOG_FEATURE_FLAGS.VOLUNTEER_FEEDBACK_FOR_STUDENT]: null,
    },
    eligibleForChooseTutorType: false,
  },
  mutations: {
    updateEligibleForChooseTutorType(state: FeatureFlagState, value: boolean) {
      state.eligibleForChooseTutorType = value
    },
    updateFlags(state: FeatureFlagState) {
      for (const flag of Object.keys(state.toggleFlags)) {
        state.toggleFlags[flag as POSTHOG_FEATURE_FLAGS] =
          FeatureFlagService.isFeatureEnabled(flag) ??
          state.toggleFlags[flag as POSTHOG_FEATURE_FLAGS]
      }

      for (const flag of Object.keys(state.multivariantFlags)) {
        state.multivariantFlags[flag as POSTHOG_FEATURE_FLAGS] =
          FeatureFlagService.getFeatureFlag(flag) ??
          state.multivariantFlags[flag as POSTHOG_FEATURE_FLAGS]
      }

      for (const flag of Object.keys(state.payloadFlags)) {
        state.payloadFlags[flag as POSTHOG_FEATURE_FLAGS] =
          FeatureFlagService.getFeatureFlagPayload(flag) ??
          state.payloadFlags[flag as POSTHOG_FEATURE_FLAGS]
      }

      FeatureFlagService.configureFlagPolling()
    },
  },
  getters: {
    isFilterActiveSubjectsActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS],
    isPollingFlagsActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.POLL_FLAGS],
    orbitalSegments: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS],
    isOrbitalSegmentsActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS],
    downtimeBannerMessage: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER],
    subjectRequestRollout: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT] ?? [],
    quizRollout: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT] ?? [],
    gleapSegmentExperiments: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS] ?? [],
    isGleapSegmentExperimentsActive: (_state: FeatureFlagState, getters: any) =>
      getters.gleapSegmentExperiments.length > 0,
    ccIntroCopy: (state: FeatureFlagState) =>
      state.multivariantFlags[POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY],
    isBfIntroCopyEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY],
    bfIntroCopy: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY],
    isSessionRecapDmsActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS],
    showDashboardRedesign: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN],
    isAutoStartCollegeSessionActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION],
    autoStartCollegeSession: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION],
    isSmsVerificationEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION],
    eligibilityEmail: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.ELIGIBILITY_EMAIL],
    isProgressReportsActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS],
    isProgressReportsSurveyActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PROGRESS_REPORT_SURVEY],
    useNewSignUpFlow: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.USE_NEW_SIGN_UP_FLOW],
    showInAppSessionNotifications: (state: FeatureFlagState) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.SHOW_IN_APP_SESSION_NOTIFICATIONS
      ],
    isSessionPresenceActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SESSION_PRESENCE],
    isMostRecentSubjectsActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.MOST_RECENT_SUBJECTS],
    isAboutThisSessionSurveyActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.ABOUT_THIS_SESSION_SURVEY],
    isBigFutureEmailFirstFlowActive: (state: FeatureFlagState) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.BIG_FUTURE_EMAIL_ELIGIBILITY_FLOW
      ],
    isBigFutureTwoQuestionEligiblityFlowActive: (state: FeatureFlagState) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.BIG_FUTURE_TWO_QUESTION_ELIGIBILITY_FLOW
      ],
    isCollegePrepAdEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.COLLEGE_PREP_AD],
    isTutorBotChatEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.TUTOR_BOT_CHAT],
    tutorBotChatType: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.TUTOR_BOT_CHAT],
    getUpdateSchoolConfig: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.UPDATE_SCHOOL_MODAL],
    isFallIncentiveProgramEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_PROGRAM],
    getFallIncentiveProgramPayload: (state: FeatureFlagState) => {
      const payload =
        state.payloadFlags[POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_PROGRAM]
      if (!payload?.maxQualifiedSessionsPerWeek)
        payload.maxQualifiedSessionsPerWeek = 1
      return payload
    },
    isFallIncentiveParentalConsentEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_PROGRAM_PARENTAL_CONSENT
      ],
    isNationalStudentPhoneEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.NATIONAL_STUDENT_PHONE],
    aiTutor: (state: FeatureFlagState) =>
      state.multivariantFlags[POSTHOG_FEATURE_FLAGS.AI_TUTOR],
    showChooseTutorType: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.CHOOSE_TUTOR_TYPE] ||
      state.eligibleForChooseTutorType,
    isSessionAudioCallEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SESSION_AUDIO_CALL],
    isScreenshareEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SCREENSHARE],
    videoModerationSampleInterval: (state: FeatureFlagState) =>
      state.payloadFlags[
        POSTHOG_FEATURE_FLAGS.VIDEO_MODERATION_SAMPLE_INTERVAL
      ],
    isVideoModerationEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.VIDEO_MODERATION_ENABLED],
    isImpactStudySurveyEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.IMPACT_STUDY_SURVEY],
    getImpactStudySurveyPayload: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.IMPACT_STUDY_SURVEY],
    isStudentsBecomeVolunteersEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.STUDENTS_BECOME_VOLUNTEERS],
    studentsBecomeVolunteersCopy: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.STUDENTS_BECOME_VOLUNTEERS],
    volunteerFeedbackForStudentFlag: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.VOLUNTEER_FEEDBACK_FOR_STUDENT],
    isTeacherGuidanceExperimentActive: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.TEACHER_GUIDANCE_EXPERIMENT],
    isCombinedOnboardingQuizEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.COMBINED_ONBOARDING_QUIZ],
    isDisplayVolunteerLanguagesEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.DISPLAY_VOLUNTEER_LANGUAGES],
    isSecondaryEmailOnProfilePageEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SECONDARY_EMAIL_ON_PROFILE_PAGE],
    isConfettiCelebrationEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.CONFETTI_CELEBRATION],
    isShowAmbassadorTitleEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SHOW_AMBASSADOR_TITLE],
    volunteerSubjectPresenceVariant: (state: FeatureFlagState) =>
      state.multivariantFlags[POSTHOG_FEATURE_FLAGS.VOLUNTEER_SUBJECT_PRESENCE],
    isSelectingPreferredLanguageEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.STUDENT_PREFERRED_LANGUAGE],
    isBecomeAnAmbassadorCtaEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.BECOME_AN_AMBASSADOR_CTA],
    showNewInternationalMessage: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SHOW_NEW_INTERNATIONAL_MESSAGE],
    isUpchieve101LMSFormatEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.UPCHIEVE_101_LMS_FORMAT],
    isTextReferralLinksEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.TEXT_REFERRAL_LINKS],
    isPendingMessagesEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.PENDING_MESSAGES],
    isClassLinkSsoEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.CLASSLINK_SSO],
    isStudentsInitiateDmsEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.STUDENTS_INITIATE_DMS],
    getVolunteerMilestoneSharingStudyVariant: (state: FeatureFlagState) =>
      state.multivariantFlags[
        POSTHOG_FEATURE_FLAGS.VOLUNTEER_MILESTONE_SHARING_STUDY
      ],
    isIncentiveBannerEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.INCENTIVE_BANNER],
    getIncentiveBannerPayload: (state: FeatureFlagState) =>
      state.payloadFlags[POSTHOG_FEATURE_FLAGS.INCENTIVE_BANNER],
    isUpchieve101V3Enabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.UPCHIEVE_101_V3],
    isForceSmsVerificationEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.FORCE_SMS_VERIFICATION],
    isDisableStudentSignupsEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.DISABLE_STUDENT_CREATION],
    isGuidedJourneysEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.GUIDED_JOURNEYS],
    isReferralModalRedesignEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.REFERRAL_MODAL_REDESIGN],
    isUpdatedDocEditorImageStorageEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.UPDATED_DOC_EDITOR_IMAGE_STORAGE],
    isSkipAvailabilityOnboardingRequirementEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[
        POSTHOG_FEATURE_FLAGS.SKIP_AVAILABILITY_ONBOARDING_REQUIREMENT
      ],
    isImageUploadUxEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.IMAGE_UPLOAD_UX],
    isSlackCommunityEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SLACK_COMMUNITY_ENABLED],
    isVerifyHoursButtonEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.VERIFY_HOURS_BUTTON],
    isShowLockedSessionsEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.SHOW_LOCKED_SESSIONS],
    isGoogleSignupForVolunteersEnabled: (state: FeatureFlagState) =>
      state.toggleFlags[POSTHOG_FEATURE_FLAGS.GOOGLE_SIGNUP_FOR_VOLUNTEERS],
  },
  actions: {
    isSessionAudioCallEnabled: async (
      { getters, dispatch }: ActionContext<FeatureFlagState, RootState>,
      partnerUserId: string
    ) => {
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
    isScreenshareEnabled: async (
      { getters }: ActionContext<FeatureFlagState, RootState>,
      partnerUserId: string
    ) => {
      const isEnabledForPartner =
        await FeatureFlagService.isFeatureEnabledForUser(
          POSTHOG_FEATURE_FLAGS.SCREENSHARE,
          partnerUserId
        )
      return isEnabledForPartner.isEnabled || getters.isScreenshareEnabled
    },
    isImageUploadUxEnabled: async (
      { getters }: ActionContext<FeatureFlagState, RootState>,
      partnerUserId: string
    ) => {
      const isEnabledForPartner =
        await FeatureFlagService.isFeatureEnabledForUser(
          POSTHOG_FEATURE_FLAGS.IMAGE_UPLOAD_UX,
          partnerUserId
        )
      return isEnabledForPartner.isEnabled || getters.isImageUploadUxEnabled
    },
  },
}
