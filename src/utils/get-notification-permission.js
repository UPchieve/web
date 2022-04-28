const getNotificationPermission = () => {
  // Check browser support
  if (!('Notification' in window)) return 'denied'

  if (Notification.permission === 'granted') {
    return localStorage.getItem('notification-permission')
  } else {
    return Notification.permission
  }
}

export default getNotificationPermission
