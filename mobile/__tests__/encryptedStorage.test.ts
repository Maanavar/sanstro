const store: Record<string, string> = {};
const masterKey = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete store[key];
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach((key) => delete store[key]);
    return Promise.resolve();
  }),
}));

jest.mock("@/lib/secureStore", () => ({
  getMasterEncryptionKey: jest.fn(() => Promise.resolve(masterKey)),
}));

import { getRandomBytesAsync } from "expo-crypto";
import { EncryptedStorage } from "@/lib/encryptedStorage";

const mockGetRandomBytesAsync = jest.mocked(getRandomBytesAsync);

beforeEach(() => {
  Object.keys(store).forEach((key) => delete store[key]);
  mockGetRandomBytesAsync.mockClear();
});

describe("EncryptedStorage v3", () => {
  it("round-trips Tamil text and values containing colons through v3 AES-GCM", async () => {
    const storage = new EncryptedStorage();
    const value = "தமிழ் வழிகாட்டல்: காலை 06:30";

    await storage.setItem("guidance", value);

    expect(store["vinaadi_encrypted:guidance"]).toMatch(/^v3:/);
    expect(store["vinaadi_encrypted:guidance"]).not.toContain(value);
    await expect(storage.getItem("guidance")).resolves.toBe(value);
  });

  it("returns null when a v3 ciphertext or authentication tag is tampered with", async () => {
    const storage = new EncryptedStorage();
    await storage.setItem("tampered", "sensitive value");
    const ciphertext = store["vinaadi_encrypted:tampered"];
    const changedIndex = ciphertext.length - 3;
    const replacement = ciphertext[changedIndex] === "A" ? "B" : "A";
    store["vinaadi_encrypted:tampered"] = `${ciphertext.slice(0, changedIndex)}${replacement}${ciphertext.slice(changedIndex + 1)}`;

    await expect(storage.getItem("tampered")).resolves.toBeNull();
  });

  it("reads released v2 data and lazily rewrites it as v3", async () => {
    const storage = new EncryptedStorage();
    const CryptoJS = require("crypto-js") as {
      AES: { encrypt: (value: string, key: string) => { toString(): string } };
    };
    store["vinaadi_encrypted:legacy"] = `v2:${CryptoJS.AES.encrypt("legacy Tamil: தமிழ்", masterKey).toString()}`;

    await expect(storage.getItem("legacy")).resolves.toBe("legacy Tamil: தமிழ்");
    expect(store["vinaadi_encrypted:legacy"]).toMatch(/^v3:/);
  });
});
