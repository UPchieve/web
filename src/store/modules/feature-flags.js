import { FEATURE_FLAGS } from '@/consts'
import config from '@/config'
import { UnleashClient } from 'unleash-proxy-client'
import * as Sentry from '@sentry/browser'

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
      [FEATURE_FLAGS.REFER_FRIENDS]: false,
      [FEATURE_FLAGS.STUDENT_BANNED_STATE]: true,
      [FEATURE_FLAGS.DASHBOARD_REDESIGN]: false,
      [FEATURE_FLAGS.GATES_STUDY]: true,
      [FEATURE_FLAGS.DOWNTIME_BANNER]: false,
      [FEATURE_FLAGS.CHATBOT]: false,
      [FEATURE_FLAGS.COACH_FAVORITING]: true,
      [FEATURE_FLAGS.SESSION_HISTORY]: true,
      [FEATURE_FLAGS.DASHBOARD_BANNER]: true,
      [FEATURE_FLAGS.ZIP_CODE_CHECK]: true,
      [FEATURE_FLAGS.DISCOVERY_SOURCE]: false,
      [FEATURE_FLAGS.UPCHIEVE_101_GRACE_PERIOD_BANNER]: true,
      [FEATURE_FLAGS.SUMMER_PREP_BANNER]: true,
      [FEATURE_FLAGS.US_HISTORY_LAUNCH_VOLUNTEER]: true,
      [FEATURE_FLAGS.US_HISTORY_LAUNCH_STUDENT]: false,
      [FEATURE_FLAGS.CONTEXT_SHARING_WITH_VOLUNTEER]: true,
      [FEATURE_FLAGS.ENVIRONMENTAL_SCIENCE_LAUNCH_STUDENT]: false,
    },
  },
  mutations: {
    setFeatureFlags: (state) => {
      Object.keys(FEATURE_FLAGS).forEach((key) => {
        state.flags[FEATURE_FLAGS[key]] = unleash.isEnabled(FEATURE_FLAGS[key])
      })
    },
  },
  actions: {
    async initUnleash({ commit }) {
      try {
        unleash = await createClient()
        unleash.on('update', () => {
          commit('setFeatureFlags')
        })
        await unleash.start()
      } catch (err) {
        Sentry.captureException(err)
      }
    },
  },
  getters: {
    isReferFriendsActive: (state) => state.flags[FEATURE_FLAGS.REFER_FRIENDS],
    isStudentBannedStateActive: (state) =>
      state.flags[FEATURE_FLAGS.STUDENT_BANNED_STATE],
    isDashboardRedesignActive: (state) =>
      state.flags[FEATURE_FLAGS.DASHBOARD_REDESIGN],
    isGatesStudyActive: (state) => state.flags[FEATURE_FLAGS.GATES_STUDY],
    isDowntimeBannerActive: (state) =>
      state.flags[FEATURE_FLAGS.DOWNTIME_BANNER],
    isChatbotActive: (state) => state.flags[FEATURE_FLAGS.CHATBOT],
    isCoachFavoritingActive: (state) =>
      state.flags[FEATURE_FLAGS.COACH_FAVORITING],
    isSessionHistoryActive: (state) =>
      state.flags[FEATURE_FLAGS.SESSION_HISTORY],
    isDashboardBannerActive: (state) =>
      state.flags[FEATURE_FLAGS.DASHBOARD_BANNER],
    isZipCodeCheckActive: (state) => state.flags[FEATURE_FLAGS.ZIP_CODE_CHECK],
    isDiscoverySourceActive: (state) =>
      state.flags[FEATURE_FLAGS.DISCOVERY_SOURCE],
    isUpchieve101GracePeriodBannerActive: (state) =>
      state.flags[FEATURE_FLAGS.UPCHIEVE_101_GRACE_PERIOD_BANNER],
    isSummerPrepActive: (state) =>
      state.flags[FEATURE_FLAGS.SUMMER_PREP_BANNER],
    isUsHistroyLaunchVolunteerActive: (state) =>
      state.flags[FEATURE_FLAGS.US_HISTORY_LAUNCH_VOLUNTEER],
    isUsHistroyLaunchStudentActive: (state) =>
      state.flags[FEATURE_FLAGS.US_HISTORY_LAUNCH_STUDENT],
    isContextSharingWithVolunteerActive: (state) =>
      state.flags[FEATURE_FLAGS.CONTEXT_SHARING_WITH_VOLUNTEER],
    isEnvironmentalScienceLaunchStudentActive: (state) =>
      state.flags[FEATURE_FLAGS.ENVIRONMENTAL_SCIENCE_LAUNCH_STUDENT],
  },
}
