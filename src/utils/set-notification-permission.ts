import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

const setNotificationPermission = (
  permissionStatus: NotificationPermission
) => {
  if (Notification.permission === 'granted')
    localStorage.setItem('notification-permission', permissionStatus)
  else if (Notification.permission === 'denied')
    localStorage.setItem('notification-permission', 'denied')
  else if (Notification.permission === 'default')
    localStorage.setItem('notification-permission', permissionStatus)

  AnalyticsService.captureEvent(EVENTS.USER_SET_WEB_NOTIFICATION_PERMISSION, {
    status: permissionStatus,
  })
}

export default setNotificationPermission
