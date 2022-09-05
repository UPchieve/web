const setNotificationPermission = permissionStatus => {
  if (Notification.permission === 'granted')
    localStorage.setItem('notification-permission', permissionStatus)
  else if (Notification.permission === 'denied')
    localStorage.setItem('notification-permission', 'denied')
  else if (Notification.permission === 'default')
    localStorage.setItem('notification-permission', permissionStatus)
}

export default setNotificationPermission
