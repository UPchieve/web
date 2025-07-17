import AnalyticsService from './AnalyticsService'
import LoggerService from './LoggerService'
import FeatureFlagService from './FeatureFlagService'
import Gleap from 'gleap'
import { EVENTS } from '@/consts'

/*
  This service is used to dynamically target users in specific segments.

  How it works
    1. Create a payload (a.k.a segmentProperties in this service) in the `orbital-segments` feature flag
    2. Change release conditions if desired
    3. Various places in high-line are watching the `oribtal-segments` or `gleap-segment-experiments` feature flag status and payload.
    4. If it is active for the current user, it calls one of the `trigger` methods below
    5. If the payload set in the `orbital-segements` flags matches the state of the user (e.g. maxSessions >= 2)
       We then trigger an `orbital` (specified by the `discoveryId` set in the payload) or `gleap` action (set by the `idName` in `GLEAP_WIDGET_CONFIGS`)
*/

const orbital = window.orbital
const GLEAP_WIDGET_CONFIGS = {
  bot: {
    idName: 'botId',
    localStorageKey: 'gleapBotsShown',
    showWidget: Gleap.startBot,
    event: EVENTS.GLEAP_BOT_SHOWN,
    widgetParam: undefined,
  },
  survey: {
    idName: 'surveyId',
    localStorageKey: 'gleapSurveysShown',
    showWidget: Gleap.showSurvey,
    event: EVENTS.GLEAP_SURVEY_SHOWN,
    widgetParam: 'survey',
  },
  newsArticle: {
    idName: 'articleId',
    localStorageKey: 'gleapNewsArticlesShown',
    showWidget: Gleap.openNewsArticle,
    event: EVENTS.GLEAP_NEWS_ARTICLE_SHOWN,
    widgetParam: true,
  },
}

type User = Partial<{
  sessionStats: Record<string, any>[]
  userType: 'student' | 'volunteer'
  createdAt: string
  roles?: string[]
  occupation?: string
  signupSource?: string
}>
type SegmentProperties = {
  minSessions?: number
  maxSessions?: number
  userType?: 'volunteer' | 'student'
  flagFilters?: string[]
  accountCreatedAfter?: string
  accountCreatedBefore?: string
  averageSessionRatingLessThan?: number
  hasStudentRole?: boolean
  hasVolunteerRole?: boolean
  occupation?: string
  signupSource?: string
}
type CheckArgs = {
  user: User
  properties: SegmentProperties
}
const validationFns = {
  maxSessions: ({ user, properties }: CheckArgs) => {
    if (properties.maxSessions !== undefined && user.sessionStats) {
      const totalSessions = Object.values(user.sessionStats).reduce(
        (sum, { totalHelped }) => sum + totalHelped,
        0
      )
      return totalSessions <= properties.maxSessions
    } else {
      return true
    }
  },
  minSessions: ({ user, properties }: CheckArgs) => {
    if (properties.minSessions !== undefined && user.sessionStats) {
      const totalSessions = Object.values(user.sessionStats).reduce(
        (sum, { totalHelped }) => sum + totalHelped,
        0
      )
      return totalSessions >= properties.minSessions
    } else {
      return true
    }
  },
  userType: ({ user, properties }: CheckArgs) =>
    properties.userType !== undefined
      ? properties.userType === user.userType
      : true,
  hasAValidFlag: ({ properties }: CheckArgs) =>
    properties.flagFilters?.some((flag) =>
      FeatureFlagService.isFeatureEnabled(flag)
    ) ?? true, // if there are no filters, it's valid
  accountCreatedAfter: ({ user, properties }: CheckArgs) => {
    return properties.accountCreatedAfter !== undefined
      ? Date.parse(properties.accountCreatedAfter) < Date.parse(user.createdAt)
      : true
  },
  accountCreatedBefore: ({ user, properties }: CheckArgs) =>
    properties.accountCreatedBefore !== undefined
      ? Date.parse(properties.accountCreatedBefore) > Date.parse(user.createdAt)
      : true,
  hasAStudentRole: ({ user, properties }: CheckArgs) =>
    !!properties.hasStudentRole && (user.roles ?? []).includes('student'),
  hasVolunteerRole: ({ user, properties }: CheckArgs) =>
    !!properties.hasVolunteerRole && (user.roles ?? []).includes('volunteer'),
  occupation: ({ user, properties }: CheckArgs) =>
    properties.occupation !== undefined
      ? properties.occupation === user.occupation
      : true,
  signupSource: ({ user, properties }: CheckArgs) =>
    properties.signupSource !== undefined
      ? properties.signupSource === user.signupSource
      : true,
}

async function isValidUserForSegment(user, properties): Promise<boolean> {
  const results = []
  for (const fn of Object.values(validationFns)) {
    const result = await fn({ user, properties })
    results.push(result)
  }
  return results.every((r) => r === true)
}

function handleGleapWidget(widgetId, config) {
  const widgetsShown =
    JSON.parse(localStorage.getItem(config.localStorageKey)) ?? []

  if (!widgetsShown.includes(widgetId)) {
    config.showWidget(widgetId, config.widgetParam)

    AnalyticsService.captureEvent(config.event, { [config.idName]: widgetId })
    localStorage.setItem(
      config.localStorageKey,
      JSON.stringify([...widgetsShown, widgetId])
    )
  }
}

export default {
  trigger(discoveryId) {
    orbital('trigger', discoveryId)
  },

  async triggerOrbitalSegment(context, user, segmentProperties = []) {
    if (!segmentProperties.length) return

    try {
      for (const properties of segmentProperties) {
        if (await isValidUserForSegment(user, properties)) {
          const { discoveryId, delay } = properties
          setTimeout(async () => {
            // do not trigger if user is in a session
            if (context.$store.state.user.session.createdAt) return
            orbital('trigger', discoveryId)
          }, delay ?? 3000)
        }
      }
    } catch (error) {
      LoggerService.noticeError(error)
    }
  },

  async triggerDynamicGleapWidget(context, user, segmentProperties = []) {
    if (!segmentProperties.length) return
    // do not trigger if user is in a session
    if (context.$store.state.user.session.createdAt) return

    try {
      for (const properties of segmentProperties) {
        if (await isValidUserForSegment(user, properties)) {
          const { botId, surveyId, articleId } = properties
          /* NOTE: There are 2 implicit priorities here:
            1. the ordering of array segmentProperties i.e. the first segment that matches this student has priority
            2. the ordering of the if/else below: 1. bot, 2. survey, 3. article.
          */
          if (botId) {
            handleGleapWidget(botId, GLEAP_WIDGET_CONFIGS.bot)
            break
          } else if (surveyId) {
            handleGleapWidget(surveyId, GLEAP_WIDGET_CONFIGS.survey)
            break
          } else if (articleId) {
            handleGleapWidget(articleId, GLEAP_WIDGET_CONFIGS.newsArticle)
            break
          }
        }
      }
    } catch (error) {
      LoggerService.noticeError(error)
    }
  },

  reset() {
    orbital('reset')
  },
}
