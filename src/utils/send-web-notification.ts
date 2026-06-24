import LogoIcon from '@/assets/logos/logo-02.png'
import getNotificationPermission from '@/utils/get-notification-permission'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

type NotificationData = {
  body: string
}

type AnalyticsMetadata = {
  [key: string]: any
}

const sendWebNotification = (
  title: string,
  data: NotificationData,
  analyticsMetadata: AnalyticsMetadata = {}
) => {
  // Check browser support
  if (!('Notification' in window)) return

  if (getNotificationPermission() === 'granted') {
    const notification = new Notification(title, { icon: LogoIcon, ...data })
    const payload = {
      title,
      ...data,
      ...analyticsMetadata,
    }

    notification.onclick = () => {
      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_WEB_NOTIFICATION,
        payload
      )
    }
    AnalyticsService.captureEvent(EVENTS.USER_SENT_WEB_NOTIFICATION, payload)
  }
}

export default sendWebNotification
