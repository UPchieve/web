import posthog from 'posthog-js'
import config from '../config'
import LoggerService from './LoggerService'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'

const FIVE_MINUTES_IN_MS = 1000 * 60 * 5
/*
 * Feature flags that have a default state of `true` and do not need to be toggled
 * again can likely be removed once cleanup of the related feature flag code has taken place.
 */
const FLAG_DEFAULTS = {
  [POSTHOG_FEATURE_FLAGS.DASHBOARD_BANNER]: false,
  [POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS]: false,
  [POSTHOG_FEATURE_FLAGS.POLL_FLAGS]: false,
  [POSTHOG_FEATURE_FLAGS.QUIZ_STUDY_MATERIALS]: false,
  [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: false,
  [POSTHOG_FEATURE_FLAGS.PROCRASTINATION_PREVENTION]: false,
  [POSTHOG_FEATURE_FLAGS.MUTED_SUBJECT_ALERTS]: false,
  [POSTHOG_FEATURE_FLAGS.FALL_INCENTIVE_ENROLLMENT]: false,
  [POSTHOG_FEATURE_FLAGS.TUTOR_SESSION_HISTORY]: false,
  [POSTHOG_FEATURE_FLAGS.SESSION_RECAP_DMS]: false,
  [POSTHOG_FEATURE_FLAGS.RECAP_SOCKET_UPDATES]: false,
  [POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY]: false,
  [POSTHOG_FEATURE_FLAGS.NEW_ELIGIBILITY_FORM_DESIGN]: false,
  [POSTHOG_FEATURE_FLAGS.OFFER_GOOGLE_SSO]: true,
  [POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER]: 'control',
  [POSTHOG_FEATURE_FLAGS.CC_INTRO_COPY]: 'baseline',
  [POSTHOG_FEATURE_FLAGS.DASHBOARD_REDESIGN]: false,
  [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: false,
  [POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION]: false,
  [POSTHOG_FEATURE_FLAGS.ELIGIBILITY_EMAIL]: false,
  [POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS]: false,
  [POSTHOG_FEATURE_FLAGS.PROGRESS_REPORTS_MODAL]: false,
  [POSTHOG_FEATURE_FLAGS.QUILL_V2]: false,
}
const FLAG_PAYLOAD_DEFAULTS = {
  [POSTHOG_FEATURE_FLAGS.ORBITAL_SEGMENTS]: [],
  [POSTHOG_FEATURE_FLAGS.DOWNTIME_BANNER]: '',
  [POSTHOG_FEATURE_FLAGS.TOPIC_CARD_DASHBOARD_REORDER]: null,
  [POSTHOG_FEATURE_FLAGS.SUBJECT_REQUEST_ROLLOUT]: [],
  [POSTHOG_FEATURE_FLAGS.QUIZ_ROLLOUT]: [],
  [POSTHOG_FEATURE_FLAGS.GLEAP_SEGMENT_EXPERIMENTS]: [],
  [POSTHOG_FEATURE_FLAGS.BF_INTRO_COPY]: '',
  [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: '',
}

class FeatureFlagService {
  static async init(
    id,
    featureFlags = FLAG_DEFAULTS,
    featureFlagPayloads = FLAG_PAYLOAD_DEFAULTS
  ) {
    return new Promise((resolve) => {
      posthog.init(config.posthogToken, {
        api_host: 'https://p.upchieve.org',
        persistence: 'localStorage+cookie',
        loaded() {
          FeatureFlagService.pollFlags()
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

  static pollFlags() {
    if (!posthog.isFeatureEnabled(POSTHOG_FEATURE_FLAGS.POLL_FLAGS)) return
    setTimeout(() => {
      posthog.reloadFeatureFlags()
    }, FIVE_MINUTES_IN_MS)
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

    // Override the defaults if we do get them from server
    // for local development.
    for (const k of Object.keys(featureFlags)) {
      FLAG_DEFAULTS[k] = featureFlags[k]
    }
    for (const k of Object.keys(featureFlagPayloads)) {
      FLAG_DEFAULTS[k] = featureFlagPayloads[k]
    }
    DevFeatureFlagService.pollFlags()
  }

  static pollFlags() {
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.info('Polling PostHog Flags.')
    }, FIVE_MINUTES_IN_MS)
  }

  static isFeatureEnabled(featureFlagKey) {
    return !!FLAG_DEFAULTS[featureFlagKey] ?? false
  }

  static getFeatureFlag(featureFlagKey) {
    return FLAG_DEFAULTS[featureFlagKey]
  }

  static getFeatureFlagPayload(featureFlagKey) {
    return FLAG_PAYLOAD_DEFAULTS[featureFlagKey]
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
