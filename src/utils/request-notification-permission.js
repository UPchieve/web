const requestNotificationPermission = () => {
  // Check browser support
  if (!("Notification" in window)) return;
  if (Notification.permission == "default") Notification.requestPermission();
};

export default requestNotificationPermission;
