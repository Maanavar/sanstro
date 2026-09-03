const secureValues: Record<string, string> = {};

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(secureValues[key] ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    secureValues[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete secureValues[key];
    return Promise.resolve();
  }),
}));

import { getRandomBytesAsync } from "expo-crypto";
import { getMasterEncryptionKey } from "@/lib/secureStore";

const mockGetRandomBytesAsync = jest.mocked(getRandomBytesAsync);

beforeEach(() => {
  Object.keys(secureValues).forEach((key) => delete secureValues[key]);
  mockGetRandomBytesAsync.mockClear();
  mockGetRandomBytesAsync.mockImplementation(async (byteCount: number) =>
    Uint8Array.from({ length: byteCount }, (_, index) => index),
  );
});

describe("getMasterEncryptionKey", () => {
  it("generates and persists 256 bits from Expo's CSPRNG for a fresh install", async () => {
    const key = await getMasterEncryptionKey();

    expect(mockGetRandomBytesAsync).toHaveBeenCalledWith(32);
    expect(key).toHaveLength(64);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(secureValues.vinaadi_master_encryption_key).toBe(key);
  });

  it("retains an existing key without generating a replacement", async () => {
    secureValues.vinaadi_master_encryption_key = "f".repeat(64);

    await expect(getMasterEncryptionKey()).resolves.toBe("f".repeat(64));
    expect(mockGetRandomBytesAsync).not.toHaveBeenCalled();
  });
});
