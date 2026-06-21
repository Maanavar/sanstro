import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import type { Lang } from "@vinaadi/shared";

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
  const deviceId = Device.osInternalBuildId ?? Device.modelId ?? "";
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `anon_${deviceId.slice(0, 8)}_${ts}_${rand}`;
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

export async function loadGuestPrefs(): Promise<GuestPrefs> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as GuestPrefs;
    } catch {
      // corrupt entry — reset
    }
  }
  const fresh: GuestPrefs = { ...DEFAULT_PREFS, anonymousId: makeAnonymousId() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

export async function saveGuestPrefs(patch: Partial<GuestPrefs>): Promise<GuestPrefs> {
  const current = await loadGuestPrefs();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearGuestPrefs(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
