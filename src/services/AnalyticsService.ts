import Gleap from 'gleap'
import posthog from 'posthog-js'
import config from '../config'
import { EVENTS } from '@/consts'

const GLEAP_TRACK_EVENTS = new Set([
  EVENTS.STUDENT_SHOWN_ONBOARDING_MODAL,
  EVENTS.STUDENT_FINISHED_ONBOARDING_MODAL,
  EVENTS.VOICE_MESSAGE_START_RECORDING,
  EVENTS.VOICE_MESSAGE_PLAYED_PARTNER_MESSAGE_IN_CHAT,
])

type UserProperties = {
  userType: string
  partner?: string
}

class AnalyticsService {
  static async init() {
    if (config.gleapSdkKey) {
      Gleap.initialize(config.gleapSdkKey)
      Gleap.getInstance().softReInitialize()
      Gleap.on('close', () => {
        this.captureEvent(EVENTS.GLEAP_CLOSED)
      })
    }

    // Update the Gleap posthogFeatureFlags person property as feature flags are updated
    const { default: store } = await import('@/store')
    store.subscribe((mutation, state) => {
      if (mutation.type === 'featureFlags/updateFlags') {
        const keyPrefix = 'ph-ff-'
        const posthogFeatureFlags: Record<string, string | boolean> = {}
        for (const key in state.featureFlags.toggleFlags) {
          posthogFeatureFlags[`${keyPrefix}${key}`] =
            state.featureFlags.toggleFlags[key]
        }
        for (const key in state.featureFlags.multivariantFlags) {
          posthogFeatureFlags[`${keyPrefix}${key}`] =
            state.featureFlags.multivariantFlags[key]
        }
        Gleap.identify(state.user.user.id, { customData: posthogFeatureFlags })
      }
    })
  }

  static identify(userId, properties) {
    posthog.identify(userId, properties)
    Gleap.identify(userId, properties)
    // Attaches custom data to the feedback submission
    Gleap.setCustomData('userType', properties.userType)
    window.orbital('identify', userId)
  }

  static updateUser(update) {
    posthog.setPersonProperties(update)
  }

  static captureEvent(name: string, properties = {}) {
    posthog.capture(name, properties)
    if (GLEAP_TRACK_EVENTS.has(name)) {
      Gleap.trackEvent(name, properties)
    }
  }

  // unset any of the user's distinctive ids
  static reset() {
    posthog.reset()
    Gleap.clearIdentity()
  }

  static registerVolunteer(volunteer) {
    const userProperties: UserProperties = {
      userType: 'volunteer',
    }
    if (volunteer.volunteerPartnerOrg)
      userProperties.partner = volunteer.volunteerPartnerOrg
    this.updateUser(userProperties)
    this.captureEvent(EVENTS.ACCOUNT_CREATED, {
      event: EVENTS.ACCOUNT_CREATED,
    })
  }
}

class DevAnalyticsService {
  static init() {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.init')
  }

  static identify(userId, properties) {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.identify', userId, properties)
  }

  static updateUser(update) {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.updateUser', update)
  }

  static captureEvent(name: string, properties = {}) {
    // eslint-disable-next-line no-console
    console.info(
      'AnalyticsService.captureEvent',
      name,
      properties,
      GLEAP_TRACK_EVENTS.has(name)
    )
  }

  static reset() {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.reset')
  }

  static registerVolunteer() {
    // eslint-disable-next-line no-console
    console.info('AnalyticsService.registerVolunteer')
  }
}

function getAnalyticsService() {
  switch (config.nodeEnv) {
    case 'development':
    case 'test':
      return DevAnalyticsService
    default:
      return AnalyticsService
  }
}

const service = getAnalyticsService()
export default service
