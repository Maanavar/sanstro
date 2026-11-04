/**
 * The DPDP data export (audit Part 3) ships its own UTF-8 base64 encoder — the
 * app bundles no base64 dependency and the export carries Tamil, which the
 * Latin1-only `btoa` would corrupt. These vectors pin the ASCII padding cases
 * and, most importantly, a multi-byte Tamil code point.
 */
// The module imports `react-native` for Platform; the encoder under test does
// not touch it, so a bare stub keeps jest from transforming all of RN.
jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));

import { utf8ToBase64 } from "@/lib/dataExport";

describe("utf8ToBase64", () => {
  it("matches known ASCII vectors, including both padding lengths", () => {
    expect(utf8ToBase64("")).toBe("");
    expect(utf8ToBase64("f")).toBe("Zg==");
    expect(utf8ToBase64("fo")).toBe("Zm8=");
    expect(utf8ToBase64("foo")).toBe("Zm9v");
    expect(utf8ToBase64("hi")).toBe("aGk=");
  });

  it("encodes a 3-byte Tamil code point as its UTF-8 bytes", () => {
    // U+0B85 (அ) → UTF-8 E0 AE 85 → base64 "4K6F".
    expect(utf8ToBase64("அ")).toBe("4K6F");
  });

  it("round-trips through the platform decoder", () => {
    const text = 'வணக்கம் {"name":"Priya"} 🌙';
    const decoded = Buffer.from(utf8ToBase64(text), "base64").toString("utf8");
    expect(decoded).toBe(text);
  });
});
