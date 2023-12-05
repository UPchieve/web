import { UNLEASH_FEATURE_FLAGS, POSTHOG_FEATURE_FLAGS } from '@/consts'
import config from '@/config'
import { UnleashClient } from 'unleash-proxy-client'
import LoggerService from '@/services/LoggerService'
import posthog from 'posthog-js'

/**
 * featureFlagRoot is just localhost:3002 locally, but
 * in k8s environments, Ambassador translates /unleash-proxy path
 * to port 3002
 */
function createClient() {
  return new Promise((resolve, reject) => {
    try {
      const unleash = new UnleashClient({
        url: `${config.featureFlagRoot}`,
        appName: config.unleashName,
        environment: config.unleashName,
        refreshInterval: 30,
        clientKey: config.featureFlagClientKey,
        bootstrap: [],
        bootstrapOverride: false,
      })
      resolve(unleash)
    } catch (err) {
      reject(`error creating unleash client: ${err}`)
    }
  })
}

/**
 * We hit a race condition in the initUnleash store
 * action below. So we create a global variable here.
 * Then initUnleash calls createClient with await,
 * to make sure that the unleash client exists before
 * we call unleash.on or unleash.start
 */
let unleash

/**
 *
 * This is to ensure reactivity for our feature flags by intercepting
 * unleash's polling response and saving the flags as application state
 *
 * Feature flags that have a default state of `true` and do not need to be toggled
 * again can likely be removed once cleanup of the related feature flag code has taken place.
 *
 */
export default {
  namespaced: true,
  state: {
    flags: {
      [UNLEASH_FEATURE_FLAGS.CHATBOT]: false,
      [POSTHOG_FEATURE_FLAGS.DASHBOARD_BANNER]: false,
      [POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS]: false,
      [POSTHOG_FEATURE_FLAGS.POLL_FLAGS]: false,
      [POSTHOG_FEATURE_FLAGS.QUIZ_STUDY_MATERIALS]: false,
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: false,
      [POSTHOG_FEATURE_FLAGS.STUDENT_COACH_REACH_OUT]: false,
      [POSTHOG_FEATURE_FLAGS.PROCRASTINATION_PREVENTION]: false,
      [POSTHOG_FEATURE_FLAGS.MUTED_SUBJECT_ALERTS]: false,
      [POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_ENROLLMENT]: false,
      [POSTHOG_FEATURE_FLAGS.TUTOR_SESSION_HISTORY]: false,
      [POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS]: false,
      [POSTHOG_FEATURE_FLAGS.RECAP_SOCKET_UPDATES]: false,
      [POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY]: false,
      [POSTHOG_FEATURE_FLAGS.SCORECASTER_WOZ]: false,
      [POSTHOG_FEATURE_FLAGS.SCORECASTER_MODAL]: false,
      // This is an experiment, using multivariant feature flag values
      [POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO]: true,
      [POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER]: 'control',
      [POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY]: 'baseline',
      [POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN]: false,
      [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: false,
    },
    flagPayloads: {
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: [],
      [POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS]: [],
      [POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER]: '',
      [POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER]: null,
      [POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT]: [],
      [POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT]: [],
      [POSTHOG_FEATURE_FLAGS.FORCE_DASHBOARD_REDESIGN_ORG]: 'none',
      [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: '',
    },
  },
  mutations: {
    setFeatureFlags: (state, isPostHog) => {
      // Use of an arrow function to implicitly bind the 3rd party module to the var
      const isFlagEnabled = isPostHog
        ? flag => posthog.getFeatureFlag(flag)
        : flag => unleash.isEnabled(flag)
      const flags = isPostHog ? POSTHOG_FEATURE_FLAGS : UNLEASH_FEATURE_FLAGS
      Object.keys(flags).forEach(key => {
        state.flags[flags[key]] = isFlagEnabled(flags[key])
      })

      if (isPostHog) {
        const getFlagPayload = flag => posthog.getFeatureFlagPayload(flag)
        Object.keys(state.flagPayloads).forEach(key => {
          state.flagPayloads[key] = getFlagPayload(key)
        })
      }
    },
  },
  actions: {
    async initUnleash({ commit }) {
      try {
        unleash = await createClient()
        unleash.on('update', () => {
          commit('setFeatureFlags', false)
        })
        await unleash.start()
      } catch (err) {
        LoggerService.noticeError(err)
      }
    },
    async initPostHogFlags({ commit, getters }) {
      return await new Promise((resolve, reject) => {
        try {
          // Retrieve feature flags from PostHog every 5 minutes
          const featureFlagInterval = 1000 * 60 * 5
          setInterval(() => {
            if (getters.isPollingFlagsActive) posthog.reloadFeatureFlags()
          }, featureFlagInterval)
          posthog.onFeatureFlags(() => {
            commit('setFeatureFlags', true)
            resolve()
          })
        } catch (err) {
          LoggerService.noticeError(err)
          reject(err)
        }
      })
    },
    async setPersonPropertiesForFlags(actionData, props) {
      posthog.setPersonPropertiesForFlags(props)
    },
  },
  getters: {
    isDashboardRedesignActive: state =>
      state.flags[UNLEASH_FEATURE_FLAGS.DASHBOARD_REDESIGN],
    isChatbotActive: state => state.flags[UNLEASH_FEATURE_FLAGS.CHATBOT],
    isDashboardBannerActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.DASHBOARD_BANNER],
    isFilterActiveSubjectsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS],
    isOptionalMiddleSchoolActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.OPTIONAL_MIDDLE_SCHOOL],
    isPollingFlagsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.POLL_FLAGS],
    isQuizStudyMaterialsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.QUIZ_STUDY_MATERIALS],
    offerGoogleSSO: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO],
    orbitalSegments: state =>
      state.flagPayloads[POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS],
    isOrbitalSegmentsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS],
    downtimeBannerMessage: state =>
      state.flagPayloads[POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER],
    topicCardDashboardReorder: state =>
      state.flagPayloads[POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER],
    isJustTellThemActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER] ===
      'tell-them',
    isTopicDashboardReorderActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER] ===
      'dashboard-reorder',
    subjectRequestRollout: state =>
      state.flagPayloads[POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT] ?? [],
    quizRollout: state =>
      state.flagPayloads[POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT] ?? [],
    gleapSegmentExperiments: state =>
      state.flagPayloads[POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS] ?? [],
    isGleapSegmentExperimentsActive: (state, getters) =>
      getters.gleapSegmentExperiments.length > 0,
    ccIntroCopy: state => state.flags[POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY],
    bfIntroCopy: state => state.flags[POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY],
    isProcrastinationPreventionActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.PROCRASTINATION_PREVENTION],
    isMutedSubjectAlertsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.MUTED_SUBJECT_ALERTS],
    isFallIncentiveEnrollmentActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_ENROLLMENT],
    isTutorSessionHistoryActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.TUTOR_SESSION_HISTORY],
    isSessionRecapDmsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS],
    showDashboardRedesign: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN],
    forceShowDashboardRedesignOrg: state =>
      state.flagPayloads[POSTHOG_FEATURE_FLAGS.FORCE_DASHBOARD_REDESIGN_ORG],
    isRecapSocketUpdatesActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.RECAP_SOCKET_UPDATES],
    isAutoStartCollegeSessionActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION],
    autoStartCollegeSession: state =>
      state.flagPayloads[POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION],
    isScorecasterModalActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.SCORECASTER_MODAL],
  },
}
