/* NetOps Service Worker · v1
 * Enables install as PWA + basic offline support.
 * Push notifications from the app itself are triggered via the Notification API
 * (see src/lib/notify.js). This SW receives forwarded messages from the page
 * (via postMessage) and shows them via registration.showNotification so that
 * they appear in the OS notification tray even if the tab is inactive.
 */
const CACHE = "netops-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL).catch(() => null)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Simple network-first for API, cache-first for shell
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req)
        .then((r) => {
          if (r && r.ok && url.origin === location.origin) {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return r;
        })
        .catch(() => cached)
    )
  );
});

// Receive messages from the page: { type: "notify", title, body, tag, data }
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "notify") {
    self.registration.showNotification(msg.title || "NetOps", {
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
