import LogoIcon from '@/assets/logo-02.png'
import getNotificationPermission from '@/utils/get-notification-permission'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const sendWebNotification = (title: string, data: { body: string }) => {
  // Check browser support
  if (!('Notification' in window)) return

  if (getNotificationPermission() === 'granted') {
    const notification = new Notification(title, { icon: LogoIcon, ...data })

    notification.onclick = () => {
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_WEB_NOTIFICATION, {
        title,
      })
    }

    AnalyticsService.captureEvent(EVENTS.USER_SENT_WEB_NOTIFICATION, {
      title,
    })
  }
}

export default sendWebNotification
