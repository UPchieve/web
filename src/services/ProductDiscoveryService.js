import LoggerService from './LoggerService'
const orbital = window.orbital

export default {
  trigger(discoveryId) {
    orbital('trigger', discoveryId)
  },

  triggerDynamicSegment(user, segmentProperties = []) {
    if (!segmentProperties.length) return

    try {
      for (const properties of segmentProperties) {
        const { discoveryId, minSessions, maxSessions, userType } = properties
        if (
          user.pastSessions.length >= minSessions &&
          user.pastSessions.length <= maxSessions &&
          userType === user.type &&
          !user.isBanned &&
          !user.isTestUser
        )
          orbital('trigger', discoveryId)
      }
    } catch (error) {
      LoggerService.noticeError(error)
    }
  },

  reset() {
    orbital('reset')
  },
}
