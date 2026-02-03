import { storage } from "../utils/storage";

vi.mock("../api/client", () => ({
  default: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../api/contracts/apiResponse", () => ({
  apiResponseSchema: vi.fn(() => ({})),
  parseApiResponse: vi.fn(() => ({})),
}));

vi.mock("../api/contracts/notificationSchemas", () => ({
  notificationStatusSchema: {},
}));

const setupPushSupport = () => {
  const registration = {
    pushManager: {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue({ endpoint: "test" }),
    },
  };

  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: vi.fn().mockResolvedValue(null),
      register: vi.fn().mockResolvedValue(undefined),
      ready: Promise.resolve(registration),
    },
  });

  window.PushManager = function PushManager() {};
  window.Notification = {
    permission: "granted",
    requestPermission: vi.fn().mockResolvedValue("granted"),
  };
  window.isSecureContext = true;

  return { registration };
};

describe("notificationService", () => {
  const originalNotification = window.Notification;
  const originalServiceWorker = navigator.serviceWorker;
  const originalPushManager = window.PushManager;
  const originalSecureContext = window.isSecureContext;
  const originalVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  const loadModule = async () => {
    vi.resetModules();
    return import("../utils/notificationService");
  };

  afterEach(() => {
    window.Notification = originalNotification;
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: originalServiceWorker,
    });
    window.PushManager = originalPushManager;
    window.isSecureContext = originalSecureContext;
    import.meta.env.VITE_VAPID_PUBLIC_KEY = originalVapidKey;
  });

  it("stores and reads notification settings", async () => {
    const { saveNotificationSettings, getSavedNotificationSettings } =
      await loadModule();
    const settings = { dailyReminder: true, reminderTime: "08:30" };

    saveNotificationSettings(settings);
    expect(storage.getJson("nostressia_notification_settings")).toEqual(settings);
    expect(getSavedNotificationSettings()).toEqual(settings);
  });

  it("returns unsupported when push notifications are unavailable", async () => {
    try {
      delete window.Notification;
      delete window.PushManager;
      delete navigator.serviceWorker;
    } catch {
      window.Notification = undefined;
      window.PushManager = undefined;
      Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: undefined,
      });
    }

    const { subscribeDailyReminder } = await loadModule();
    await expect(subscribeDailyReminder("08:00")).resolves.toMatchObject({
      ok: false,
      reason: "unsupported",
    });
  });

  it("blocks reminders in insecure contexts", async () => {
    setupPushSupport();
    window.isSecureContext = false;

    const { subscribeDailyReminder } = await loadModule();
    await expect(subscribeDailyReminder("08:00")).resolves.toMatchObject({
      ok: false,
      reason: "insecure",
    });
  });

  it("respects denied notification permissions", async () => {
    setupPushSupport();
    window.Notification.permission = "denied";

    const { subscribeDailyReminder } = await loadModule();
    await expect(subscribeDailyReminder("08:00")).resolves.toMatchObject({
      ok: false,
      reason: "denied",
    });
  });

  it("subscribes when all prerequisites are met", async () => {
    setupPushSupport();
    import.meta.env.VITE_VAPID_PUBLIC_KEY = "test-key";

    const { subscribeDailyReminder } = await loadModule();
    const client = (await import("../api/client")).default;

    client.post.mockResolvedValueOnce({ data: { success: true, data: {} } });

    await expect(subscribeDailyReminder("08:00")).resolves.toMatchObject({
      ok: true,
    });
  });

  it("reports backend failures on unsubscribe", async () => {
    setupPushSupport();

    const { unsubscribeDailyReminder } = await loadModule();
    const client = (await import("../api/client")).default;
    client.delete.mockRejectedValueOnce(new Error("Backend failed"));

    await expect(unsubscribeDailyReminder()).resolves.toMatchObject({
      ok: false,
      reason: "backend-failed",
    });
  });
});
