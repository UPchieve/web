import config from '../config'
import { EVENTS } from '@/consts'

const GLEAP_TRACK_EVENTS = new Set([
  EVENTS.STUDENT_SHOWN_ONBOARDING_MODAL,
  EVENTS.STUDENT_FINISHED_ONBOARDING_MODAL,
  EVENTS.VOICE_MESSAGE_PLAYED_PARTNER_MESSAGE_IN_CHAT,
])

type GA4_EVENTS = 'student_sign_up'

type UserProperties = {
  userType: string
  partner?: string
}

let Gleap: typeof import('gleap').default | null = null
let posthog: typeof import('posthog-js').default | null = null

// shared promise so the dynamic imports only happen once
let _loadPromise: Promise<void> | null = null

function loadLibraries(): Promise<void> {
  if (!_loadPromise) {
    _loadPromise = Promise.all([
      import('gleap').then((m) => {
        Gleap = m.default
      }),
      import('posthog-js').then((m) => {
        posthog = m.default
      }),
    ]).then(() => {})
  }
  return _loadPromise
}

class AnalyticsService {
  static async init() {
    await loadLibraries()

    if (config.gleapSdkKey && Gleap) {
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
        if (Gleap) {
          Gleap.identify(state.user.user.id, {
            customData: posthogFeatureFlags,
          })
        }
      }
    })
  }

  static async identify(userId, properties) {
    await loadLibraries()
    if (posthog && Gleap) {
      posthog.identify(userId, properties)
      Gleap.identify(userId, properties)
      // Attaches custom data to the feedback submission
      Gleap.setCustomData('userType', properties.userType)
    }
  }

  static async updateUser(update) {
    await loadLibraries()
    if (posthog) {
      posthog.setPersonProperties(update)
    }
  }

  static async captureEvent(name: string, properties = {}) {
    await loadLibraries()
    if (posthog) {
      posthog.capture(name, properties)
    }
    if (GLEAP_TRACK_EVENTS.has(name) && Gleap) {
      Gleap.trackEvent(name, properties)
    }
  }

  static captureGoogleAnalyticsEvent(eventName: GA4_EVENTS, properties = {}) {
    if (window.gtag) {
      window.gtag('event', eventName, properties)
    }
  }

  // unset any of the user's distinctive ids
  static async reset() {
    await loadLibraries()
    if (posthog && Gleap) {
      posthog.reset()
      Gleap.clearIdentity()
    }
  }

  static async registerVolunteer(volunteer) {
    await loadLibraries()
    const userProperties: UserProperties = {
      userType: 'volunteer',
    }
    if (volunteer.volunteerPartnerOrg)
      userProperties.partner = volunteer.volunteerPartnerOrg
    await this.updateUser(userProperties)
    await this.captureEvent(EVENTS.ACCOUNT_CREATED, {
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

  static captureGoogleAnalyticsEvent(eventName: GA4_EVENTS, properties = {}) {
    // eslint-disable-next-line no-console
    console.info(
      'AnalyticsService.captureGoogleAnalyticsEvent',
      eventName,
      properties
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
