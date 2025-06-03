const getNotificationPermission = () => {
  // Check browser support
  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

export default getNotificationPermission
