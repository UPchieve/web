import { UNLEASH_FEATURE_FLAGS, POSTHOG_FEATURE_FLAGS } from '@/consts'
import config from '@/config'
import { UnleashClient } from 'unleash-proxy-client'
import * as Sentry from '@sentry/browser'
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
      [UNLEASH_FEATURE_FLAGS.DOWNTIME_BANNER]: false,
      [UNLEASH_FEATURE_FLAGS.CHATBOT]: false,
      [UNLEASH_FEATURE_FLAGS.DASHBOARD_BANNER]: false,
      [POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS]: false,
    },
  },
  mutations: {
    setFeatureFlags: state => {
      Object.keys(UNLEASH_FEATURE_FLAGS).forEach(key => {
        state.flags[UNLEASH_FEATURE_FLAGS[key]] = unleash.isEnabled(
          UNLEASH_FEATURE_FLAGS[key]
        )
      })
    },
    setPostHogFlags: (state, flags) => {
      state.flags = Object.assign(state.flags, flags)
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
    async initPostHogFlags({ commit }) {
      try {
        posthog.onFeatureFlags(() => {
          const flags = posthog.featureFlags.getFlagVariants()
          commit('setPostHogFlags', flags)
        })
      } catch (err) {
        Sentry.captureException(err)
      }
    },
  },
  getters: {
    isImagesInDocumentsActive: state =>
      state.flags[UNLEASH_FEATURE_FLAGS.IMAGES_IN_DOCUMENTS],
    isReferFriendsActive: state =>
      state.flags[UNLEASH_FEATURE_FLAGS.REFER_FRIENDS],
    isDashboardRedesignActive: state =>
      state.flags[UNLEASH_FEATURE_FLAGS.DASHBOARD_REDESIGN],
    isDowntimeBannerActive: state =>
      state.flags[UNLEASH_FEATURE_FLAGS.DOWNTIME_BANNER],
    isChatbotActive: state => state.flags[UNLEASH_FEATURE_FLAGS.CHATBOT],
    isDashboardBannerActive: state =>
      state.flags[UNLEASH_FEATURE_FLAGS.DASHBOARD_BANNER],
    isFilterActiveSubjectsActive: state =>
      state.flags[POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS],
  },
}
