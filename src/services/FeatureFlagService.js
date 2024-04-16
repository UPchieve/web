import posthog from 'posthog-js'
import config from '@/config'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import LoggerService from '@/services/LoggerService'

const FIVE_MINUTES_IN_MS = 1000 * 60 * 5

class FeatureFlagService {
  static async init(id, featureFlags, featureFlagPayloads) {
    return new Promise((resolve) => {
      posthog.init(config.posthogToken, {
        api_host: 'https://p.upchieve.org',
        ui_host: 'app.posthog.com',
        persistence: 'localStorage+cookie',
        loaded() {
          FeatureFlagService.listenForFlagReload()
          resolve()
        },
        bootstrap: {
          distinctID: id,
          featureFlags,
          featureFlagPayloads,
        },
        on_xhr_error: (req) => {
          LoggerService.noticeError(
            new Error(
              `PostHog - Bad HTTP status: ${req?.status} ${req?.statusText}`
            )
          )
        },
        session_recording: {
          maskTextSelector: '#ph-no-capture',
        },
      })
    })
  }

  static async listenForFlagReload() {
    const { default: store } = await import('@/store')
    posthog.onFeatureFlags(() => {
      store.commit('featureFlags/updateFlags')
    })
  }

  static pollInterval
  static configureFlagPolling() {
    const isPollingEnabled = posthog.isFeatureEnabled(
      POSTHOG_FEATURE_FLAGS.POLL_FLAGS
    )
    if (isPollingEnabled && !this.pollInterval) {
      this.pollInterval = setInterval(() => {
        posthog.reloadFeatureFlags()
      }, FIVE_MINUTES_IN_MS)
    } else if (!isPollingEnabled && this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  static setPersonPropertiesForFlags(props) {
    posthog.setPersonPropertiesForFlags(props)
  }

  static isFeatureEnabled(featureFlagKey) {
    return posthog.isFeatureEnabled(featureFlagKey)
  }

  static getFeatureFlag(featureFlagKey) {
    return posthog.getFeatureFlag(featureFlagKey)
  }

  static getFeatureFlagPayload(featureFlagKey) {
    return posthog.getFeatureFlagPayload(featureFlagKey)
  }
}

class DevFeatureFlagService {
  static async init(id, featureFlags, featureFlagPayloads) {
    // eslint-disable-next-line no-console
    console.info(
      'FeatureFlagService.init',
      id,
      featureFlags,
      featureFlagPayloads
    )
    DevFeatureFlagService.configureFlagPolling()
  }

  static pollInterval
  static configureFlagPolling() {
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => {
        // eslint-disable-next-line no-console
        console.info('Polling PostHog Flags.')
      }, FIVE_MINUTES_IN_MS)
    }
  }

  static setPersonPropertiesForFlags(props) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.setPersonPropertiesForFlags', props)
  }

  static isFeatureEnabled(featureFlagKey) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.isFeatureEnabled', featureFlagKey)
  }

  static getFeatureFlag(featureFlagKey) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.getFeatureFlag', featureFlagKey)
  }

  static getFeatureFlagPayload(featureFlagKey) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.getFeatureFlagPayload', featureFlagKey)
  }
}

function getFeatureFlagService() {
  switch (config.nodeEnv) {
    case 'development':
    case 'test':
      return DevFeatureFlagService
    default:
      return FeatureFlagService
  }
}

const service = getFeatureFlagService()
export default service
