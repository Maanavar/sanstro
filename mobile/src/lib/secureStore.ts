import * as SecureStore from "expo-secure-store";

const KEYS = {
  ACCESS_TOKEN:  "vinaadi_access_token",
  REFRESH_TOKEN: "vinaadi_refresh_token",
  ENCRYPTION_KEY: "vinaadi_master_encryption_key",
} as const;

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function getTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function setTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, tokens.accessToken),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
  ]);
}

function generateRandomKey(): string {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

export async function getMasterEncryptionKey(): Promise<string> {
  const stored = await SecureStore.getItemAsync(KEYS.ENCRYPTION_KEY);
  if (stored) return stored;
  const newKey = generateRandomKey();
  try {
    await SecureStore.setItemAsync(KEYS.ENCRYPTION_KEY, newKey);
  } catch {
    console.warn("Failed to persist encryption key to SecureStore");
  }
  return newKey;
}

export { SecureStore };
