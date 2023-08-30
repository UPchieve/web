import LoggerService from './LoggerService'
import AnalyticsService from './AnalyticsService'
import Gleap from 'gleap'
import { EVENTS } from '@/consts'
const orbital = window.orbital

function isValidUserForSegment(user, properties) {
  const { minSessions, maxSessions, userType } = properties
  return (
    user.pastSessions.length >= minSessions &&
    user.pastSessions.length <= maxSessions &&
    userType === user.type
  )
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

  triggerDynamicGleapBot(user, segmentProperties = []) {
    if (!segmentProperties.length) return

    try {
      for (const properties of segmentProperties) {
        if (isValidUserForSegment(user, properties)) {
          const { botId } = properties
          const key = 'gleapBotsShown'
          const gleapBotsShown = JSON.parse(localStorage.getItem(key)) ?? []
          if (!gleapBotsShown.includes(botId)) {
            Gleap.startBot(botId)
            AnalyticsService.captureEvent(EVENTS.GLEAP_BOT_SHOWN, { botId })
            localStorage.setItem(
              key,
              JSON.stringify([...gleapBotsShown, botId])
            )
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
