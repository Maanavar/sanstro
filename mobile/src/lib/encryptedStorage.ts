import AsyncStorage from "@react-native-async-storage/async-storage";
import { gcm } from "@noble/ciphers/aes";
import CryptoJS from "crypto-js";
import { getRandomBytesAsync } from "expo-crypto";
import { getMasterEncryptionKey } from "./secureStore";

const STORAGE_KEY_PREFIX = "vinaadi_encrypted:";
const V2_PREFIX = "v2:";
const V3_PREFIX = "v3:";
const AES_GCM_NONCE_BYTES = 12;
const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function hexToBytes(value: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null;
  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    output += BASE64_ALPHABET[first >>> 2];
    output += BASE64_ALPHABET[((first & 0x03) << 4) | ((second ?? 0) >>> 4)];
    output += second === undefined ? "=" : BASE64_ALPHABET[((second & 0x0f) << 2) | ((third ?? 0) >>> 6)];
    output += third === undefined ? "=" : BASE64_ALPHABET[third & 0x3f];
  }
  return output;
}

function base64ToBytes(value: string): Uint8Array | null {
  if (!value || value.length % 4 !== 0) return null;
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 4) {
    const first = BASE64_ALPHABET.indexOf(value[index]);
    const second = BASE64_ALPHABET.indexOf(value[index + 1]);
    const thirdChar = value[index + 2];
    const fourthChar = value[index + 3];
    const third = thirdChar === "=" ? 0 : BASE64_ALPHABET.indexOf(thirdChar);
    const fourth = fourthChar === "=" ? 0 : BASE64_ALPHABET.indexOf(fourthChar);
    if (first < 0 || second < 0 || third < 0 || fourth < 0) return null;
    if ((thirdChar === "=" || fourthChar === "=") && index + 4 !== value.length) return null;

    bytes.push((first << 2) | (second >>> 4));
    if (thirdChar !== "=") bytes.push(((second & 0x0f) << 4) | (third >>> 2));
    if (fourthChar !== "=") bytes.push(((third & 0x03) << 6) | fourth);
  }
  return new Uint8Array(bytes);
}

function decryptV2(ciphertext: string, key: string): string | null {
  try {
    if (!ciphertext.startsWith(V2_PREFIX)) return null;
    const encrypted = ciphertext.slice(V2_PREFIX.length);
    const decrypted = CryptoJS.AES.decrypt(encrypted, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plaintext) return null;
    return plaintext;
  } catch {
    return null;
  }
}

async function encryptV3(plaintext: string, key: string): Promise<string> {
  const keyBytes = hexToBytes(key);
  if (!keyBytes) throw new Error("Encryption key is not a 256-bit hexadecimal value.");

  const nonce = await getRandomBytesAsync(AES_GCM_NONCE_BYTES);
  const sealed = gcm(keyBytes, nonce).encrypt(new TextEncoder().encode(plaintext));
  const combined = new Uint8Array(nonce.length + sealed.length);
  combined.set(nonce);
  combined.set(sealed, nonce.length);
  return `${V3_PREFIX}${bytesToBase64(combined)}`;
}

function decryptV3(ciphertext: string, key: string): string | null {
  try {
    if (!ciphertext.startsWith(V3_PREFIX)) return null;
    const keyBytes = hexToBytes(key);
    const combined = base64ToBytes(ciphertext.slice(V3_PREFIX.length));
    if (!keyBytes || !combined || combined.length <= AES_GCM_NONCE_BYTES) return null;

    const nonce = combined.slice(0, AES_GCM_NONCE_BYTES);
    const sealed = combined.slice(AES_GCM_NONCE_BYTES);
    return new TextDecoder().decode(gcm(keyBytes, nonce).decrypt(sealed));
  } catch {
    // AES-GCM rejects a changed nonce, ciphertext, or authentication tag.
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
      if (ciphertext.startsWith(V3_PREFIX)) {
        return decryptV3(ciphertext, encryptionKey);
      }

      const plaintext = decryptV2(ciphertext, encryptionKey);
      if (plaintext === null) return null;

      // Preserve data from released v2 installs, then upgrade it in place. A
      // transient write failure must not make a successfully decrypted value
      // disappear from the caller.
      try {
        await AsyncStorage.setItem(storageKey, await encryptV3(plaintext, encryptionKey));
      } catch (migrationError) {
        console.warn(`EncryptedStorage v2 migration failed for key ${key}:`, migrationError);
      }
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
      const ciphertext = await encryptV3(value, encryptionKey);
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
