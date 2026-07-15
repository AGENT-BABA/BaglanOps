/* Firebase Cloud Messaging (FCM) initialization.
 * Gets FCM token after user grants permission, sends it to backend.
 * Enables real push notifications even when the app/browser is closed.
 */
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { NOTIF_ENABLED_KEY } from "@/lib/notify";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;
const API_BASE = process.env.REACT_APP_BACKEND_URL + "/api";

let messaging = null;

function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && VAPID_KEY);
}

export async function initFCM() {
  try {
    if (!isFirebaseConfigured()) return null;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
    if (Notification.permission !== "granted") return null;
    if (localStorage.getItem(NOTIF_ENABLED_KEY) === "off") return null;

    const token = localStorage.getItem("netops_token");
    if (!token) return null;

    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    const registration = await navigator.serviceWorker.ready;
    const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });

    if (fcmToken) {
      await saveFCMToken(fcmToken, token);
    }

    return fcmToken;
  } catch (err) {
    console.error("FCM init failed:", err);
    return null;
  }
}

async function saveFCMToken(fcmToken, authToken) {
  try {
    await fetch(`${API_BASE}/user/fcm-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken }),
    });
  } catch (err) {
    console.error("Failed to save FCM token:", err);
  }
}

export function getFCMToken() {
  if (!messaging) return Promise.resolve(null);
  return getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null);
}
