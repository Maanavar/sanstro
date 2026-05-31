import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";

type FirebaseMessagingConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function readConfig(): FirebaseMessagingConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "";
  const projectId = process.env.NEXT_PUBLIC_FCM_PROJECT_ID ?? "";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "";
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "";

  if (!apiKey || !projectId || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

function getOrCreateFirebaseApp(config: FirebaseMessagingConfig): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(config);
}

export function hasFirebaseMessagingConfig(): boolean {
  return Boolean(readConfig() && process.env.NEXT_PUBLIC_FCM_VAPID_KEY);
}

export async function fetchFcmToken(swRegistration: ServiceWorkerRegistration): Promise<string> {
  const config = readConfig();
  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY ?? "";
  if (!config || !vapidKey) {
    throw new Error("FCM config missing");
  }
  const supported = await isSupported();
  if (!supported) {
    throw new Error("FCM not supported in this browser");
  }
  const app = getOrCreateFirebaseApp(config);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: swRegistration,
  });
  if (!token) {
    throw new Error("FCM token unavailable");
  }
  return token;
}

export async function clearFcmTokenLocal(): Promise<void> {
  const config = readConfig();
  if (!config) return;
  const supported = await isSupported();
  if (!supported) return;
  const app = getOrCreateFirebaseApp(config);
  const messaging = getMessaging(app);
  await deleteToken(messaging);
}
