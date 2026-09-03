/**
 * Unit tests for guestStore.ts — guards against regressions in guest pref
 * persistence that could silently unlock premium features for guests.
 */

// --- AsyncStorage mock (in-memory) ------------------------------------------
const _store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => Promise.resolve(_store[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    _store[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete _store[key];
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(_store))),
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach((key) => delete _store[key]);
    return Promise.resolve();
  }),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

import { clearGuestPrefs, loadGuestPrefs, saveGuestPrefs } from "@/features/guest/guestStore";

// Reset in-memory store + module state before each test.
beforeEach(() => {
  Object.keys(_store).forEach((k) => delete _store[k]);
  // Reset the cached _initPromise so each test starts fresh.
  jest.resetModules();
});

describe("loadGuestPrefs — fresh store", () => {
  it("returns default lang=ta", async () => {
    const prefs = await loadGuestPrefs();
    expect(prefs.lang).toBe("ta");
  });

  it("returns default rasi=null", async () => {
    const prefs = await loadGuestPrefs();
    expect(prefs.rasi).toBeNull();
  });

  it("generates a non-empty anonymousId", async () => {
    const prefs = await loadGuestPrefs();
    expect(prefs.anonymousId).toMatch(/^anon_/);
  });

  it("persists the prefs to storage on first load", async () => {
    await loadGuestPrefs();
    expect(Object.keys(_store).length).toBe(1);
  });

  it("does not leave new guest location or rasi data as plaintext in AsyncStorage", async () => {
    await saveGuestPrefs({ city: "Example City", rasi: "mesham", lat: 12.34, lon: 56.78 });

    expect(_store.vinaadi_guest_prefs).toBeUndefined();
    const encrypted = _store["vinaadi_encrypted:vinaadi_guest_prefs"];
    expect(encrypted).toMatch(/^v3:/);
    expect(encrypted).not.toContain("Example City");
    expect(encrypted).not.toContain("mesham");
  });

  it("returns pushOptedIn=false by default", async () => {
    const prefs = await loadGuestPrefs();
    expect(prefs.pushOptedIn).toBe(false);
  });
});

describe("loadGuestPrefs — existing stored prefs", () => {
  it("migrates released plaintext prefs to encrypted storage", async () => {
    _store["vinaadi_guest_prefs"] = JSON.stringify({
      rasi: "mesham",
      nakshatra: "ashwini",
      city: "Chennai",
      lat: 13.08,
      lon: 80.27,
      lang: "en",
      anonymousId: "anon_existing",
      pushOptedIn: true,
      pushTime: "07:00",
    });
    const prefs = await loadGuestPrefs();
    expect(prefs.lang).toBe("en");
    expect(prefs.anonymousId).toBe("anon_existing");
    expect(_store.vinaadi_guest_prefs).toBeUndefined();
    expect(_store["vinaadi_encrypted:vinaadi_guest_prefs"]).toMatch(/^v3:/);
    expect(_store["vinaadi_encrypted:vinaadi_guest_prefs"]).not.toContain("Example City");
  });

  it("resets to defaults when stored JSON is corrupt", async () => {
    _store["vinaadi_guest_prefs"] = "NOT_JSON{{{";
    const prefs = await loadGuestPrefs();
    expect(prefs.lang).toBe("ta");
    expect(prefs.rasi).toBeNull();
  });
});

describe("saveGuestPrefs", () => {
  it("updates a single field and returns the merged prefs", async () => {
    const saved = await saveGuestPrefs({ rasi: "rishabam" });
    expect(saved.rasi).toBe("rishabam");
    expect(saved.lang).toBe("ta"); // other fields unchanged
  });

  it("persists the updated prefs so subsequent load sees them", async () => {
    await saveGuestPrefs({ lang: "en" });
    const reloaded = await loadGuestPrefs();
    expect(reloaded.lang).toBe("en");
  });
});

describe("clearGuestPrefs", () => {
  it("removes the key from storage", async () => {
    await loadGuestPrefs(); // populate storage
    expect(Object.keys(_store).length).toBe(1);
    await clearGuestPrefs();
    expect(Object.keys(_store).length).toBe(0);
  });

  it("next loadGuestPrefs returns fresh defaults after clear", async () => {
    await saveGuestPrefs({ lang: "en", rasi: "mesham" });
    await clearGuestPrefs();
    // Simulate module re-init by clearing the promise cache:
    // (since resetModules is called in beforeEach, this exercises the code path)
    const prefs = await loadGuestPrefs();
    expect(prefs.lang).toBe("ta");
    expect(prefs.rasi).toBeNull();
  });
});
