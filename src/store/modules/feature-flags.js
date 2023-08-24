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
      [UNLEASH_FEATURE_FLAGS.REFER_FRIENDS]: false,
      [UNLEASH_FEATURE_FLAGS.DASHBOARD_REDESIGN]: false,
      [UNLEASH_FEATURE_FLAGS.CHATBOT]: false,
      [UNLEASH_FEATURE_FLAGS.DASHBOARD_BANNER]: false,
      [POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS]: false,
      [POSTHOG_FEATURE_FLAGS.IMAGES_IN_DOCUMENTS]: false,
      [POSTHOG_FEATURE_FLAGS.AUTO_FLOW_PROGRESS_BAR]: false,
      [POSTHOG_FEATURE_FLAGS.NEW_SCHOOLS_ELIGIBILITY]: false,
      [POSTHOG_FEATURE_FLAGS.FLAG_PERSON_PROPERTIES]: false,
      [POSTHOG_FEATURE_FLAGS.POLL_FLAGS]: false,
      [POSTHOG_FEATURE_FLAGS.QUIZ_STUDY_MATERIALS]: false,
      [POSTHOG_FEATURE_FLAGS.ZIP_FIRST]: false,
      [POSTHOG_FEATURE_FLAGS.UPDATED_AUTO_FLOW_QUIZ_UX]: false,
      [POSTHOG_FEATURE_FLAGS.ORBITAL]: false,
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: false,
      [POSTHOG_FEATURE_FLAGS.GLEAP_BOT_EXPERIMENT]: false,
      [POSTHOG_FEATURE_FLAGS.STUDENT_COACH_REACH_OUT]: false,
      // This is an experiment, using multivariant feature flag values
      [POSTHOG_FEATURE_FLAGS.EARN_CERTIFICATIONS_AND_LEVEL_SYSTEM]: '',
      [POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO]: false,
      [POSTHOG_FEATURE_FLAGS.ELIGIBILITY_FORM_HEADLINE]: 'control',
      [POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER]: 'control',
    },
    flagPayloads: {
      [POSTHOG_FEATURE_FLAGS.ELIGIBILITY_FORM_HEADLINE]:
        'Check if you are eligible for UPchieve',
      [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: [],
      [POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER]: '',
      [POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER]: null,
      [POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT]: [],
      [POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT]: [],
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
    async setPersonPropertiesForFlags({ getters }, props) {
      if (getters.isFlagPersonPropertiesActive)
        posthog.setPersonPropertiesForFlags(props)
    },
  },
  getters: {
    isReferFriendsActive: state =>
      state.flags[UNLEASH_FEATURE_FLAGS.REFER_FRIENDS],
    isDashboardRedesignActive: state =>
      state.flags[UNLEASH_FEATURE_FLAGS.DASHBOARD_REDESIGN],
    isChatbotActive: state => state.flags[UNLEASH_FEATURE_FLAGS.CHATBOT],
    isDashboardBannerActive: state =>
      state.flags[UNLEASH_FEATURE_FLAGS.DASHBOARD_BANNER],
    isFilterActiveSubjectsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS],
    isImagesInDocumentsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.IMAGES_IN_DOCUMENTS],
    isOptionalMiddleSchoolActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.OPTIONAL_MIDDLE_SCHOOL],
    isAutoFlowProgressBarActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.AUTO_FLOW_PROGRESS_BAR],
    useNewSchoolsEligibility: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.NEW_SCHOOLS_ELIGIBILITY],
    isFlagPersonPropertiesActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.FLAG_PERSON_PROPERTIES],
    isPollingFlagsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.POLL_FLAGS],
    isAutoFlowAvailabilityStepActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.AUTO_FLOW_TWO_STEP_AVAILABILITY],
    isQuizStudyMaterialsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.QUIZ_STUDY_MATERIALS],
    isZipFirst: state => state.flags[POSTHOG_FEATURE_FLAGS.ZIP_FIRST],
    isUpdatedAutoFlowQuizUxActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.UPDATED_AUTO_FLOW_QUIZ_UX],
    isEarnCertificationsActive: state =>
      state.flags[
        POSTHOG_FEATURE_FLAGS.EARN_CERTIFICATIONS_AND_LEVEL_SYSTEM
      ] === POSTHOG_FEATURE_FLAGS.EARN_CERTIFICATIONS,
    isLevelSystemActive: state =>
      state.flags[
        POSTHOG_FEATURE_FLAGS.EARN_CERTIFICATIONS_AND_LEVEL_SYSTEM
      ] === POSTHOG_FEATURE_FLAGS.LEVEL_SYSTEM,
    offerGoogleSSO: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO],
    eligibilityFormHeadline: state =>
      state.flagPayloads[POSTHOG_FEATURE_FLAGS.ELIGIBILITY_FORM_HEADLINE],
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
    isGleapBotExperimentActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.GLEAP_BOT_EXPERIMENT],
    isStudentCoachReachOutActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.STUDENT_COACH_REACH_OUT],
  },
}
