import LogoIcon from "@/assets/logo.png";

const sendWebNotification = (title, data) => {
  // Check browser support
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted")
    new Notification(title, { icon: LogoIcon, ...data });
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      // If the user accepts, create a notification
      if (permission === "granted")
        new Notification(title, { icon: LogoIcon, ...data });
    });
  }
};

export default sendWebNotification;
