import client from "../api/client";

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
    console.warn("Gagal mendaftarkan service worker notifikasi:", error);
    return null;
  }
  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn("Service worker belum siap:", error);
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
    throw new Error("VAPID public key belum dikonfigurasi.");
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
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

export const subscribeDailyReminder = async (
  timeValue,
  { skipPermissionPrompt = false } = {}
) => {
  if (!supportsPushNotifications()) {
    return {
      ok: false,
      reason: "unsupported",
      message: "Browser belum mendukung notifikasi push.",
    };
  }
  if (!isSecureNotificationContext()) {
    return {
      ok: false,
      reason: "insecure",
      message: "Notifikasi butuh koneksi HTTPS.",
    };
  }

  if (skipPermissionPrompt && Notification.permission !== "granted") {
    return {
      ok: false,
      reason: "denied",
      message: "Izin notifikasi belum diberikan.",
    };
  }

  if (Notification.permission === "denied") {
    return {
      ok: false,
      reason: "denied",
      message:
        "Notifikasi diblokir. Aktifkan izin di pengaturan browser terlebih dahulu.",
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
          ? "Permintaan izin notifikasi dibatalkan."
          : "Izin notifikasi ditolak.",
    };
  }

  const registration = await getRegistration();
  if (!registration) {
    return {
      ok: false,
      reason: "unavailable",
      message: "Service worker belum siap.",
    };
  }

  try {
    const subscription = await ensurePushSubscription(registration);
    await client.post("/notifications/subscribe", {
      subscription,
      reminderTime: timeValue,
      timezone: getTimezone(),
    });

    return {
      ok: true,
      message: "Scheduled reminder menggunakan push (jika device/browser mendukung).",
    };
  } catch (error) {
    return {
      ok: false,
      reason: "subscribe-failed",
      message: error?.message || "Gagal mengaktifkan push reminder.",
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
        console.warn("Gagal unsubscribe push:", error);
      }
    }
  }

  try {
    await client.delete("/notifications/unsubscribe");
  } catch (error) {
    console.warn("Gagal menghapus subscription di backend:", error);
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
