/* BaglanOps Service Worker · v4
 * Minimal SW — handles FCM push notifications only.
 * No caching, no fetch interception, no clients.claim().
 * Caching is handled by the browser natively.
 */

// FCM push notifications — fired when app is closed/backgrounded
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: "BaglanOps", body: event.data.text() } };
  }

  const title = payload.notification?.title || payload.data?.title || "BaglanOps";
  const body = payload.notification?.body || payload.data?.body || "";
  const tag = payload.notification?.tag || payload.data?.tag || "netops-push";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag,
      data: payload.data || {},
      renotify: true,
    })
  );
});

// Receive messages from the page: { type: "notify", title, body, tag, data }
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "notify") {
    self.registration.showNotification(msg.title || "BaglanOps", {
      body: msg.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: msg.tag || undefined,
      data: msg.data || {},
      renotify: true,
    });
  }
});

// Click a notification → focus the app window (or open it)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) return w.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
