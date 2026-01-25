self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });
      if (allClients.length > 0) {
        allClients[0].focus();
      } else {
        await self.clients.openWindow("/");
      }

      const { data } = event.notification;
      if (data?.repeat === "daily" && data?.time && "TimestampTrigger" in self) {
        const now = new Date();
        const [hours, minutes] = data.time
          .split(":")
          .map((value) => Number(value));
        const nextTrigger = new Date(now);
        nextTrigger.setDate(nextTrigger.getDate() + 1);
        nextTrigger.setHours(hours, minutes || 0, 0, 0);

        await self.registration.showNotification(
          event.notification.title,
          {
            body: event.notification.body,
            tag: event.notification.tag,
            icon: event.notification.icon,
            badge: event.notification.badge,
            data,
            showTrigger: new self.TimestampTrigger(nextTrigger.getTime()),
          }
        );
      }
    })()
  );
});
