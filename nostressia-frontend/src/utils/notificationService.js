import client from "../api/client";
import { apiResponseSchema, parseApiResponse } from "../api/contracts/apiResponse";
import { notificationStatusSchema } from "../api/contracts/notificationSchemas";
import { createLogger } from "./logger";
import { storage } from "./storage";

const logger = createLogger("NOTIFICATIONS");
const notificationStatusResponseSchema = apiResponseSchema(notificationStatusSchema);

const STORAGE_KEY = "nostressia_notification_settings";
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

const supportsPushNotifications = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

const isSecureNotificationContext = () =>
  typeof window !== "undefined" && window.isSecureContext;

const getRegistration = async () => {
  if (!supportsPushNotifications()) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  try {
    await navigator.serviceWorker.register("/notification-sw.js");
  } catch (error) {
    logger.warn("Failed to register the notification service worker:", error);
    return null;
  }
  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    logger.warn("Service worker is not ready yet:", error);
    return null;
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const getTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";

const ensurePushSubscription = async (registration) => {
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  if (!VAPID_PUBLIC_KEY) {
    throw new Error("The VAPID public key is not configured.");
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
};

export const saveNotificationSettings = (settings) => {
  if (typeof window === "undefined") return;
  storage.setJson(STORAGE_KEY, settings);
};

export const getSavedNotificationSettings = () => {
  if (typeof window === "undefined") return null;
  const parsed = storage.getJson(STORAGE_KEY, null);
  if (!parsed) return null;
  return parsed;
};

export const subscribeDailyReminder = async (
  timeValue,
  { skipPermissionPrompt = false } = {}
) => {
  if (!supportsPushNotifications()) {
    return {
      ok: false,
      reason: "unsupported",
      message: "This browser does not support push notifications.",
    };
  }
  if (!isSecureNotificationContext()) {
    return {
      ok: false,
      reason: "insecure",
      message: "Notifications require a secure HTTPS context.",
    };
  }

  if (skipPermissionPrompt && Notification.permission !== "granted") {
    return {
      ok: false,
      reason: "denied",
      message: "Notification permission has not been granted.",
    };
  }

  if (Notification.permission === "denied") {
    return {
      ok: false,
      reason: "denied",
      message:
        "Notifications are blocked. Enable permission in your browser settings.",
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
          ? "Notification permission request was dismissed."
          : "Notification permission was denied.",
    };
  }

  const registration = await getRegistration();
  if (!registration) {
    return {
      ok: false,
      reason: "unavailable",
      message: "The service worker is not ready.",
    };
  }

  try {
    const subscription = await ensurePushSubscription(registration);
    const response = await client.post("/notifications/subscribe", {
      subscription,
      reminderTime: timeValue,
      timezone: getTimezone(),
    });
    parseApiResponse(notificationStatusResponseSchema, response.data);

    return {
      ok: true,
      message: "You’ll receive a reminder at your scheduled time.",
    };
  } catch (error) {
    return {
      ok: false,
      reason: "subscribe-failed",
      message: error?.message || "Failed to enable push reminders.",
    };
  }
};

export const unsubscribeDailyReminder = async () => {
  if (!supportsPushNotifications()) {
    return { ok: false, reason: "unsupported" };
  }

  const registration = await getRegistration();
  if (registration) {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (error) {
        logger.warn("Failed to unsubscribe from push notifications:", error);
      }
    }
  }

  try {
    const response = await client.delete("/notifications/unsubscribe");
    parseApiResponse(notificationStatusResponseSchema, response.data);
  } catch (error) {
    logger.warn("Failed to remove the subscription on the backend:", error);
    return { ok: false, reason: "backend-failed" };
  }

  return { ok: true };
};

export const restoreDailyReminderSubscription = async () => {
  if (!supportsPushNotifications()) {
    return { ok: false, reason: "unsupported" };
  }
  const settings = getSavedNotificationSettings();
  if (!settings?.dailyReminder || !settings?.reminderTime) {
    return { ok: false, reason: "disabled" };
  }
  if (Notification.permission !== "granted") {
    return { ok: false, reason: "permission" };
  }
  return subscribeDailyReminder(settings.reminderTime, {
    skipPermissionPrompt: true,
  });
};
