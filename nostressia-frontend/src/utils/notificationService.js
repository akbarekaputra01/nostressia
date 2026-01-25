import LogoImage from "../assets/images/Logo-Nostressia.png";

const REMINDER_TAG = "nostressia-daily-reminder";
const STORAGE_KEY = "nostressia_notification_settings";

const supportsNotifications = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator;

const getRegistration = async () => {
  if (!supportsNotifications()) return null;
  return navigator.serviceWorker.ready;
};

const buildNextTriggerDate = (timeValue) => {
  const [hours, minutes] = timeValue.split(":").map((value) => Number(value));
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hours, minutes || 0, 0, 0);
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled;
};

const getTimestampTrigger = (timestamp) => {
  if (typeof window === "undefined") return null;
  if ("TimestampTrigger" in window) {
    return new window.TimestampTrigger(timestamp);
  }
  return null;
};

export const saveNotificationSettings = (settings) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const getSavedNotificationSettings = () => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Failed to parse notification settings:", error);
    return null;
  }
};

export const clearScheduledReminder = async () => {
  const registration = await getRegistration();
  if (!registration) return false;
  const notifications = await registration.getNotifications({ tag: REMINDER_TAG });
  notifications.forEach((notification) => notification.close());
  return true;
};

export const scheduleDailyReminder = async (timeValue) => {
  if (!supportsNotifications()) {
    return {
      ok: false,
      reason: "unsupported",
      message: "Notifications are not supported in this browser.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      reason: "denied",
      message: "Notification permission was denied.",
    };
  }

  const registration = await getRegistration();
  if (!registration) {
    return {
      ok: false,
      reason: "unavailable",
      message: "Notification service is not ready yet.",
    };
  }

  await clearScheduledReminder();

  const scheduled = buildNextTriggerDate(timeValue);
  const trigger = getTimestampTrigger(scheduled.getTime());

  const notificationOptions = {
    body: "Time to check-in and log your stress level.",
    tag: REMINDER_TAG,
    icon: LogoImage,
    badge: LogoImage,
    data: {
      repeat: "daily",
      time: timeValue,
    },
  };

  if (trigger) {
    notificationOptions.showTrigger = trigger;
  }

  await registration.showNotification("Nostressia Daily Reminder", notificationOptions);

  return {
    ok: true,
    message: trigger
      ? "Daily reminder scheduled even when the app is closed."
      : "Reminder scheduled, but background scheduling is limited on this browser.",
    triggerSupported: Boolean(trigger),
  };
};
