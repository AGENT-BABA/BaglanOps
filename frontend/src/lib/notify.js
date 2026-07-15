/* Browser notification helper.
 * - Registers /sw.js so the app is installable as a PWA and can show OS-level notifications.
 * - notify({title, body, tag}) forwards to the SW (which uses registration.showNotification),
 *   so the toast appears in the system tray even if the browser tab is in the background.
 * - Fallback: if the SW isn't ready yet, use the plain Notification constructor.
 */
export const NOTIF_ENABLED_KEY = "netops_notif_enabled";

let swReg = null;

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    swReg = await navigator.serviceWorker.register("/sw.js");
    return swReg;
  } catch (err) {
    console.error("SW registration failed", err);
    return null;
  }
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "default") {
    try { return await Notification.requestPermission(); } catch { return Notification.permission; }
  }
  return Notification.permission;
}

export async function notify({ title, body, tag, data }) {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;
  if (localStorage.getItem(NOTIF_ENABLED_KEY) === "off") return;
  try {
    const reg = swReg || (await navigator.serviceWorker?.ready);
    if (reg && reg.showNotification) {
      await reg.showNotification(title || "BaglanOps", {
        body: body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: tag || undefined,
        data: data || {},
        renotify: true,
      });
      return;
    }
  } catch (err) {
    console.warn("SW notify failed, falling back", err);
  }
  try { new Notification(title || "BaglanOps", { body: body || "", icon: "/icon-192.png", tag }); } catch (err) {
    console.warn("Notification fallback failed", err);
  }
}
