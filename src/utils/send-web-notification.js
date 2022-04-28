import LogoIcon from '@/assets/logo-02.png'
import getNotificationPermission from '@/utils/get-notification-permission.js'

const sendWebNotification = (title, data) => {
  // Check browser support
  if (!('Notification' in window)) return

  if (getNotificationPermission() === 'granted')
    new Notification(title, { icon: LogoIcon, ...data })
}

export default sendWebNotification
