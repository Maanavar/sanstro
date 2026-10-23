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
import { getMasterEncryptionKey, setTokens } from "@/lib/secureStore";

const mockGetRandomBytesAsync = jest.mocked(getRandomBytesAsync);

beforeEach(() => {
  Object.keys(secureValues).forEach((key) => delete secureValues[key]);
  mockGetRandomBytesAsync.mockClear();
  mockGetRandomBytesAsync.mockImplementation(async (byteCount: number) =>
    Uint8Array.from({ length: byteCount }, (_, index) => index),
  );
});

describe("setTokens refuses a malformed pair (A14 step 8)", () => {
  // Login, register and refresh all write server-supplied tokens here, and the
  // two keys are written separately. A pair with one bad half would store the
  // good half and leave a stale other half beside it — for refresh, a token the
  // server has already revoked, which it treats as theft (A03). The sink checks
  // both before writing either.
  it.each([
    ["missing refresh token", { accessToken: "access-2" }],
    ["empty access token", { accessToken: "", refreshToken: "refresh-2" }],
    ["non-string access token", { accessToken: 42, refreshToken: "refresh-2" }],
  ])("%s: rejects and writes neither key", async (_label, pair) => {
    secureValues.vinaadi_access_token = "access-1";
    secureValues.vinaadi_refresh_token = "refresh-1";
    const { setItemAsync } = jest.requireMock("expo-secure-store") as { setItemAsync: jest.Mock };
    setItemAsync.mockClear();

    await expect(setTokens(pair as never)).rejects.toThrow(/malformed token pair/);
    expect(setItemAsync).not.toHaveBeenCalled();
  });

  it("stores a well-formed pair", async () => {
    await setTokens({ accessToken: "access-2", refreshToken: "refresh-2" });
    expect(Object.values(secureValues)).toEqual(expect.arrayContaining(["access-2", "refresh-2"]));
  });
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
