self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const buildNextTriggerDate = (timeValue) => {
  const [hours, minutes] = timeValue.split(":").map((value) => Number(value));
  const scheduled = new Date();
  scheduled.setHours(hours, minutes || 0, 0, 0);
  if (scheduled <= new Date()) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled;
};

const scheduleNotificationWithTrigger = async (title, options) => {
  if (!("TimestampTrigger" in self)) {
    return { ok: false, reason: "unsupported" };
  }
  if (!options?.data?.time) {
    return { ok: false, reason: "missing-time" };
  }
  const scheduled = buildNextTriggerDate(options.data.time);
  await self.registration.showNotification(title, {
    ...options,
    showTrigger: new self.TimestampTrigger(scheduled.getTime()),
  });
  return { ok: true };
};

self.addEventListener("message", (event) => {
  const { data } = event;
  if (data?.type !== "schedule-reminder") return;
  event.waitUntil(
    (async () => {
      const result = await scheduleNotificationWithTrigger(data.title, data.options);
      event.ports?.[0]?.postMessage(result);
    })()
  );
});

self.addEventListener("notificationclose", (event) => {
  const { data } = event.notification;
  if (data?.repeat !== "daily" || !data?.time) return;
  event.waitUntil(
    scheduleNotificationWithTrigger(event.notification.title, {
      body: event.notification.body,
      tag: event.notification.tag,
      icon: event.notification.icon,
      badge: event.notification.badge,
      data,
    })
  );
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
      if (data?.repeat === "daily" && data?.time) {
        await scheduleNotificationWithTrigger(event.notification.title, {
          body: event.notification.body,
          tag: event.notification.tag,
          icon: event.notification.icon,
          badge: event.notification.badge,
          data,
        });
      }
    })()
  );
});
