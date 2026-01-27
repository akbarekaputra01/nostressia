self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const buildNotificationPayload = (payload) => {
  const title = payload?.title || "Nostressia Daily Reminder";
  const body = payload?.body || "Time to check-in dan log stress level kamu.";
  const url = payload?.url || "/";

  return {
    title,
    options: {
      body,
      icon: "/Logo-Nostressia.png",
      badge: "/Logo-Nostressia.png",
      data: { url },
    },
  };
};

self.addEventListener("push", (event) => {
  const payload = (() => {
    if (!event?.data) return {};
    try {
      return event.data.json();
    } catch (error) {
      return { body: event.data.text() };
    }
  })();

  const notification = buildNotificationPayload(payload);
  event.waitUntil(
    self.registration.showNotification(notification.title, notification.options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const url = event.notification?.data?.url || "/";
      const allClients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });
      const matchingClient = allClients.find((client) => client.url.includes(url));
      if (matchingClient) {
        await matchingClient.focus();
      } else {
        await self.clients.openWindow(url);
      }
    })()
  );
});
