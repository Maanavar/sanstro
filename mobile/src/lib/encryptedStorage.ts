import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import { getMasterEncryptionKey } from "./secureStore";

const STORAGE_KEY_PREFIX = "vinaadi_encrypted:";

function aesEncrypt(plaintext: string, key: string): string {
  const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
  const withVersion = `v2:${encrypted}`;
  return withVersion;
}

function aesDecrypt(ciphertext: string, key: string): string | null {
  try {
    if (!ciphertext.startsWith("v2:")) return null;
    const encrypted = ciphertext.slice(3);
    const decrypted = CryptoJS.AES.decrypt(encrypted, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plaintext) return null;
    return plaintext;
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
      const plaintext = aesDecrypt(ciphertext, encryptionKey);
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
      const ciphertext = aesEncrypt(value, encryptionKey);
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
