import AnalyticsService from './AnalyticsService'
import LoggerService from './LoggerService'
import FeatureFlagService from './FeatureFlagService'
import Gleap from 'gleap'
import { EVENTS } from '@/consts'
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

function isValidUserForSegment(user, properties) {
  const { minSessions, maxSessions, userType, flagFilters } = properties
  const hasAValidFlag = flagFilters?.some((flag) =>
    FeatureFlagService.isFeatureEnabled(flag)
  )

  return (
    user.pastSessions.length >= minSessions &&
    user.pastSessions.length <= maxSessions &&
    userType === user.type &&
    hasAValidFlag
  )
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

  triggerDynamicSegment(user, segmentProperties = []) {
    if (!segmentProperties.length) return

    try {
      for (const properties of segmentProperties) {
        if (isValidUserForSegment(user, properties)) {
          const { discoveryId } = properties
          orbital('trigger', discoveryId)
        }
      }
    } catch (error) {
      LoggerService.noticeError(error)
    }
  },

  triggerDynamicGleapWidget(user, segmentProperties = []) {
    if (!segmentProperties.length) return

    try {
      for (const properties of segmentProperties) {
        if (isValidUserForSegment(user, properties)) {
          const { botId, surveyId, articleId } = properties
          if (botId) handleGleapWidget(botId, GLEAP_WIDGET_CONFIGS.bot)
          if (surveyId) handleGleapWidget(surveyId, GLEAP_WIDGET_CONFIGS.survey)
          if (articleId)
            handleGleapWidget(articleId, GLEAP_WIDGET_CONFIGS.newsArticle)
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
