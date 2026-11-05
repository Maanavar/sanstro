import { Platform } from "react-native";

/**
 * Share an object as a downloadable JSON file (DPDP right of access, audit
 * Part 3). We hand `react-native-share` a `data:` URL rather than writing to
 * disk: the app bundles no file-system module, and the share sheet turns a
 * base64 data URL with a `filename` into a real file on both platforms.
 *
 * The base64 is computed from UTF-8 bytes by hand — the export carries Tamil
 * (names, places), which the Latin1-only `btoa` would corrupt, and the app
 * ships no base64 dependency.
 */

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** UTF-8 encode, then base64. Kept free of `btoa`/`TextEncoder` so it does not
 *  depend on which of those a given Hermes build exposes. */
export function utf8ToBase64(input: string): string {
  const bytes: number[] = [];
  for (const char of input) {
    let code = char.codePointAt(0) as number;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }

  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 0x0f) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[b2 & 0x3f] : "=";
  }
  return out;
}

type ShareModule = {
  default: { open: (opts: Record<string, unknown>) => Promise<unknown> };
};

/** Open the share sheet on a JSON file built from `data`. Resolves `false` when
 *  the user dismisses the sheet (not an error), `true` once it is handed off. */
export async function shareJsonFile(filename: string, data: unknown): Promise<boolean> {
  const json = JSON.stringify(data, null, 2);
  const url = `data:application/json;base64,${utf8ToBase64(json)}`;
  // Lazy require matches the app's other share call site (ShareCaptureView),
  // keeping react-native-share off the startup path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Share = (require("react-native-share") as ShareModule).default;
  try {
    await Share.open({
      url,
      filename,
      type: "application/json",
      // iOS reads the extension from `filename`; Android needs it on the type.
      failOnCancel: false,
      saveToFiles: Platform.OS === "ios" ? true : undefined,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("cancel")) return false;
    throw error;
  }
}

/** base64 of raw bytes. Separate from `utf8ToBase64` because a PDF is bytes,
 *  not text: running it through the UTF-8 encoder above would corrupt every
 *  byte above 0x7f. The same pure-JS loop, kept free of `btoa` for the same
 *  reason — which Hermes build exposes it is not something to depend on. */
export function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 0x0f) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[b2 & 0x3f] : "=";
  }
  return out;
}

/**
 * Open the share sheet on a PDF built from `bytes`. Resolves `false` when the
 * user dismisses the sheet (not an error), `true` once it is handed off.
 *
 * Same `data:` URL route as the JSON export: the app bundles no file-system
 * module, and the share sheet turns a base64 data URL with a `filename` into a
 * real file on both platforms. The lazy require is load-bearing — a static
 * import runs at module load and crashes Expo Go, where the native bridge does
 * not exist.
 */
export async function sharePdfFile(
  filename: string,
  bytes: Uint8Array,
  title?: string,
): Promise<boolean> {
  const url = `data:application/pdf;base64,${bytesToBase64(bytes)}`;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Share = (require("react-native-share") as ShareModule).default;
  try {
    await Share.open({
      ...(title ? { title } : {}),
      url,
      filename,
      type: "application/pdf",
      failOnCancel: false,
      saveToFiles: Platform.OS === "ios" ? true : undefined,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("cancel")) return false;
    throw error;
  }
}
