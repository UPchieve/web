import posthog from 'posthog-js'
import config from '@/config'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import LoggerService from '@/services/LoggerService'
import axios from 'axios'

const FIVE_MINUTES_IN_MS = 1000 * 60 * 5

class FeatureFlagService {
  static async init(id, featureFlags, featureFlagPayloads, personProperties) {
    return new Promise((resolve) => {
      posthog.init(config.posthogToken, {
        api_host: 'https://p.upchieve.org',
        ui_host: 'https://app.posthog.com',
        persistence: 'localStorage+cookie',
        async loaded() {
          await FeatureFlagService.preloadPersonPropertiesToStore(
            personProperties
          )
          FeatureFlagService.setPersonProperties(personProperties)

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

  static setPersonPropertiesForFlags(props: any) {
    posthog.setPersonPropertiesForFlags(props)
  }

  static setPersonProperties(props: any) {
    posthog.setPersonProperties(props)
  }

  static isFeatureEnabled(featureFlagKey: string) {
    return posthog.isFeatureEnabled(featureFlagKey)
  }

  static async isFeatureEnabledForUser(featureFlagKey: string, userId: string) {
    try {
      if (!userId) throw new Error('Missing user ID')
      const axiosInstance = axios.create()
      const res = await axiosInstance.post(
        'https://p.upchieve.org/decide?v=3',
        {
          distinct_id: userId,
          api_key: config.posthogToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )

      const featureFlags = res.data.featureFlags

      return {
        isEnabled: featureFlags[featureFlagKey] ?? false,
      }
    } catch (err) {
      LoggerService.noticeError(
        err,
        `Failed to check if feature ${featureFlagKey} is enabled for user ${userId}.`
      )
      return {
        isEnabled: false,
      }
    }
  }

  static getFeatureFlag(featureFlagKey: string) {
    return posthog.getFeatureFlag(featureFlagKey)
  }

  static getFeatureFlagPayload(featureFlagKey: string) {
    return posthog.getFeatureFlagPayload(featureFlagKey)
  }

  static async preloadPersonPropertiesToStore(props: any) {
    const { default: store } = await import('@/store')
    await store.dispatch('productFlags/addToProductFlags', {
      fallIncentiveEnrollmentAt: props?.fallIncentiveEnrollmentAt,
    })
  }
}

class DevFeatureFlagService {
  static async init(id: string, featureFlags: any, featureFlagPayloads: any) {
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

  static setPersonPropertiesForFlags(props: any) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.setPersonPropertiesForFlags', props)
  }

  static setPersonProperties(props: any) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.setPersonProperties', props)
  }

  static isFeatureEnabled(featureFlagKey: string) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.isFeatureEnabled', featureFlagKey)
  }

  static async isFeatureEnabledForUser(featureFlagKey: string, userId: string) {
    const { default: store } = await import('@/store')
    // eslint-disable-next-line no-console
    console.info(
      'FeatureFlagService.isFeatureEnabledForUser',
      featureFlagKey,
      userId
    )

    const toggleFlags = store.state.featureFlags.toggleFlags
    const multivariantFlags = store.state.featureFlags.multivariantFlags
    const flag = Object.hasOwn(toggleFlags, featureFlagKey)
      ? toggleFlags[featureFlagKey]
      : multivariantFlags[featureFlagKey]
    return {
      isEnabled: flag,
    }
  }

  static getFeatureFlag(featureFlagKey: string) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.getFeatureFlag', featureFlagKey)
  }

  static getFeatureFlagPayload(featureFlagKey: string) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.getFeatureFlagPayload', featureFlagKey)
  }

  static async preloadPersonPropertiesToStore(props: any) {
    // eslint-disable-next-line no-console
    console.info('FeatureFlagService.preloadPersonPropertiesToStore', props)
  }
}

function getFeatureFlagService(): DevFeatureFlagService | FeatureFlagService {
  switch (config.nodeEnv) {
    case 'development':
    case 'test':
      return DevFeatureFlagService
    case 'test_e2e':
    default:
      return FeatureFlagService
  }
}

const service = getFeatureFlagService()
export default service
