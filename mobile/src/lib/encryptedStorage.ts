import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMasterEncryptionKey } from "./secureStore";

const STORAGE_KEY_PREFIX = "vinaadi_encrypted:";

function stringToCharCodes(str: string): number[] {
  const codes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    codes.push(str.charCodeAt(i));
  }
  return codes;
}

function charCodesToString(codes: number[]): string {
  return String.fromCharCode(...codes);
}

function bytesToBase64(bytes: number[]): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): number[] {
  const binary = atob(base64);
  const bytes: number[] = [];
  for (let i = 0; i < binary.length; i++) {
    bytes.push(binary.charCodeAt(i));
  }
  return bytes;
}

function simpleEncrypt(plaintext: string, key: string): string {
  const keyBytes = stringToCharCodes(key);
  const plaintextBytes = stringToCharCodes(plaintext);

  const encrypted: number[] = [];
  for (let i = 0; i < plaintextBytes.length; i++) {
    encrypted.push(plaintextBytes[i] ^ keyBytes[i % keyBytes.length]);
  }

  const withVersion = [118, 49, 58, ...encrypted]; // "v1:" + encrypted
  return bytesToBase64(withVersion);
}

function simpleDecrypt(ciphertext: string, key: string): string | null {
  try {
    const buffer = base64ToBytes(ciphertext);
    const version = charCodesToString(buffer.slice(0, 3));
    if (version !== "v1:") return null;

    const encrypted = buffer.slice(3);
    const keyBytes = stringToCharCodes(key);
    const decrypted: number[] = [];
    for (let i = 0; i < encrypted.length; i++) {
      decrypted.push(encrypted[i] ^ keyBytes[i % keyBytes.length]);
    }

    return charCodesToString(decrypted);
  } catch {
    return null;
  }
}

export class EncryptedStorage {
  private keyPromise: Promise<string> | null = null;

  private async getKey(): Promise<string> {
    if (!this.keyPromise) {
      this.keyPromise = getMasterEncryptionKey();
    }
    return this.keyPromise;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const encryptionKey = await this.getKey();
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
      const ciphertext = await AsyncStorage.getItem(storageKey);

      if (!ciphertext) return null;
      const plaintext = simpleDecrypt(ciphertext, encryptionKey);
      return plaintext;
    } catch (error) {
      console.warn(`EncryptedStorage.getItem failed for key ${key}:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptionKey = await this.getKey();
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
      const ciphertext = simpleEncrypt(value, encryptionKey);
      await AsyncStorage.setItem(storageKey, ciphertext);
    } catch (error) {
      console.warn(`EncryptedStorage.setItem failed for key ${key}:`, error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`EncryptedStorage.removeItem failed for key ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const encryptedKeys = allKeys.filter((k) => k.startsWith(STORAGE_KEY_PREFIX));
      await AsyncStorage.multiRemove(encryptedKeys);
    } catch (error) {
      console.warn("EncryptedStorage.clear failed:", error);
      throw error;
    }
  }
}

export const encryptedStorage = new EncryptedStorage();
