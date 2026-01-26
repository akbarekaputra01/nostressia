import LogoImage from "../assets/images/Logo-Nostressia.png";

const REMINDER_TAG = "nostressia-daily-reminder";
const STORAGE_KEY = "nostressia_notification_settings";
let fallbackTimeoutId = null;

const supportsNotifications = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator;

const isSecureNotificationContext = () =>
  typeof window !== "undefined" && window.isSecureContext;

const getRegistration = async () => {
  if (!supportsNotifications()) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  try {
    await navigator.serviceWorker.register("/notification-sw.js");
  } catch (error) {
    console.warn("Failed to register notification service worker:", error);
    return null;
  }
  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn("Failed to wait for service worker readiness:", error);
    return null;
  }
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

const sendServiceWorkerMessage = async (payload) => {
  const registration = await getRegistration();
  if (!registration) {
    return { ok: false, reason: "unavailable" };
  }

  let activeRegistration = registration;
  if (!activeRegistration.active && "serviceWorker" in navigator) {
    try {
      activeRegistration = await navigator.serviceWorker.ready;
    } catch (error) {
      console.warn("Failed to wait for service worker readiness:", error);
    }
  }

  if (!activeRegistration?.active) {
    return { ok: false, reason: "inactive" };
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeoutId = window.setTimeout(() => {
      resolve({ ok: false, reason: "timeout" });
    }, 2000);

    channel.port1.onmessage = (event) => {
      clearTimeout(timeoutId);
      resolve(event.data || { ok: false, reason: "no-response" });
    };

    activeRegistration.active.postMessage(payload, [channel.port2]);
  });
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
  if (fallbackTimeoutId) {
    clearTimeout(fallbackTimeoutId);
    fallbackTimeoutId = null;
  }
  const registration = await getRegistration();
  if (!registration) return false;
  const notifications = await registration.getNotifications({ tag: REMINDER_TAG });
  notifications.forEach((notification) => notification.close());
  return true;
};

export const scheduleDailyReminder = async (
  timeValue,
  { skipPermissionPrompt = false } = {}
) => {
  if (!supportsNotifications()) {
    return {
      ok: false,
      reason: "unsupported",
      message: "Notifications are not supported in this browser.",
    };
  }
  if (!isSecureNotificationContext()) {
    return {
      ok: false,
      reason: "insecure",
      message: "Notifications require a secure (HTTPS) connection.",
    };
  }

  if (skipPermissionPrompt && Notification.permission !== "granted") {
    return {
      ok: false,
      reason: "denied",
      message: "Notification permission is not granted.",
    };
  }

  if (Notification.permission === "denied") {
    return {
      ok: false,
      reason: "denied",
      message:
        "Notification permission is blocked. Enable it in your browser settings to continue.",
    };
  }

  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      reason: "denied",
      message:
        permission === "default"
          ? "Notification permission prompt was dismissed."
          : "Notification permission was denied.",
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
  let triggerScheduled = false;

  if (trigger) {
    const swResult = await sendServiceWorkerMessage({
      type: "schedule-reminder",
      title: "Nostressia Daily Reminder",
      options: notificationOptions,
    });
    if (swResult?.ok) {
      triggerScheduled = true;
    }

    if (!triggerScheduled) {
      try {
        await registration.showNotification("Nostressia Daily Reminder", {
          ...notificationOptions,
          showTrigger: trigger,
        });
        triggerScheduled = true;
      } catch (error) {
        console.warn("Failed to schedule reminder with trigger:", error);
      }
    }
  } else {
    const swResult = await sendServiceWorkerMessage({
      type: "schedule-reminder",
      title: "Nostressia Daily Reminder",
      options: notificationOptions,
    });
    if (swResult?.ok) {
      triggerScheduled = true;
    }
  }

  if (!triggerScheduled) {
    const delayMs = Math.max(scheduled.getTime() - Date.now(), 0);
    fallbackTimeoutId = window.setTimeout(async () => {
      const activeRegistration = await getRegistration();
      if (!activeRegistration) return;
      await activeRegistration.showNotification(
        "Nostressia Daily Reminder",
        notificationOptions
      );
      if (notificationOptions.data?.repeat === "daily") {
        await scheduleDailyReminder(timeValue);
      }
    }, delayMs);
  }

  return {
    ok: true,
    message: triggerScheduled
      ? "Daily reminder scheduled even when the app is closed."
      : "Reminder scheduled while this tab is open (background scheduling is limited on this browser).",
    triggerSupported: triggerScheduled,
  };
};

export const restoreScheduledReminder = async () => {
  if (!supportsNotifications()) {
    return { ok: false, reason: "unsupported" };
  }
  const settings = getSavedNotificationSettings();
  if (!settings?.dailyReminder || !settings?.reminderTime) {
    return { ok: false, reason: "disabled" };
  }
  if (Notification.permission !== "granted") {
    return { ok: false, reason: "permission" };
  }
  return scheduleDailyReminder(settings.reminderTime, {
    skipPermissionPrompt: true,
  });
};
