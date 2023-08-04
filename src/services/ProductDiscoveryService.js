import LoggerService from './LoggerService'
const orbital = window.orbital

export default {
  trigger(discoveryId) {
    orbital('trigger', discoveryId)
  },

  triggerDynamicSegment(user, segmentProperties = {}) {
    if (!Object.entries(segmentProperties).length) return

    try {
      const {
        discoveryId,
        minSessions,
        maxSessions,
        userType,
      } = segmentProperties
      if (
        minSessions >= user.pastSessions.length &&
        user.pastSessions.length <= maxSessions &&
        userType === user.type &&
        !user.isBanned &&
        !user.isTestUser
      )
        orbital('trigger', discoveryId)
    } catch (error) {
      LoggerService.noticeError(error)
    }
  },

  reset() {
    orbital('reset')
  },
}
