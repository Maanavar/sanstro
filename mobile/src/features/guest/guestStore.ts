import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import type { Lang } from "@vinaadi/shared";
import { encryptedStorage } from "@/lib/encryptedStorage";

const STORAGE_KEY = "vinaadi_guest_prefs";

export interface GuestPrefs {
  rasi: string | null;
  nakshatra: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  lang: Lang;
  anonymousId: string;
  pushOptedIn: boolean;
  pushTime: string;
}

function makeAnonymousId(): string {
  // A random opaque ID supports anonymous local state without creating a
  // device-linkable identifier from operating-system build metadata.
  return `anon_${randomUUID()}`;
}

const DEFAULT_PREFS: Omit<GuestPrefs, "anonymousId"> = {
  rasi: null,
  nakshatra: null,
  city: null,
  lat: null,
  lon: null,
  lang: "ta",
  pushOptedIn: false,
  pushTime: "06:30",
};

let _initPromise: Promise<GuestPrefs> | null = null;

async function _doLoad(): Promise<GuestPrefs> {
  let raw = await encryptedStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // One-time migration from the released plaintext key. Remove it only after
    // the authenticated encrypted write succeeds, preserving an interrupted
    // migration for the next launch.
    const legacyRaw = await AsyncStorage.getItem(STORAGE_KEY);
    if (legacyRaw) {
      try {
        JSON.parse(legacyRaw) as GuestPrefs;
        await encryptedStorage.setItem(STORAGE_KEY, legacyRaw);
        await AsyncStorage.removeItem(STORAGE_KEY);
        raw = legacyRaw;
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    }
  }
  if (raw) {
    try {
      return JSON.parse(raw) as GuestPrefs;
    } catch {
      // corrupt entry — reset
    }
  }
  const fresh: GuestPrefs = { ...DEFAULT_PREFS, anonymousId: makeAnonymousId() };
  await encryptedStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

export function loadGuestPrefs(): Promise<GuestPrefs> {
  if (!_initPromise) {
    _initPromise = _doLoad().finally(() => {
      _initPromise = null;
    });
  }
  return _initPromise;
}

export async function saveGuestPrefs(patch: Partial<GuestPrefs>): Promise<GuestPrefs> {
  const current = await loadGuestPrefs();
  const next = { ...current, ...patch };
  await encryptedStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearGuestPrefs(): Promise<void> {
  await Promise.all([
    encryptedStorage.removeItem(STORAGE_KEY),
    AsyncStorage.removeItem(STORAGE_KEY),
  ]);
}
