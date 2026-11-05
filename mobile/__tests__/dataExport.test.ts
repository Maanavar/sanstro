/**
 * The DPDP data export (audit Part 3) ships its own UTF-8 base64 encoder — the
 * app bundles no base64 dependency and the export carries Tamil, which the
 * Latin1-only `btoa` would corrupt. These vectors pin the ASCII padding cases
 * and, most importantly, a multi-byte Tamil code point.
 */
// The module imports `react-native` for Platform; the encoder under test does
// not touch it, so a bare stub keeps jest from transforming all of RN.
jest.mock("react-native", () => ({ Platform: { OS: "ios" } }));

import { bytesToBase64, utf8ToBase64 } from "@/lib/dataExport";

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

describe("bytesToBase64", () => {
  it("matches known vectors, including both padding lengths", () => {
    const ascii = (text: string) => new Uint8Array([...text].map((c) => c.charCodeAt(0)));
    expect(bytesToBase64(new Uint8Array([]))).toBe("");
    expect(bytesToBase64(ascii("f"))).toBe("Zg==");
    expect(bytesToBase64(ascii("fo"))).toBe("Zm8=");
    expect(bytesToBase64(ascii("foo"))).toBe("Zm9v");
  });

  it("encodes bytes above 0x7f unchanged -- which is why it is not utf8ToBase64", () => {
    // A PDF is bytes, not text. Every byte here is >= 0x80, so pushing them
    // through the UTF-8 encoder would expand each one into two and corrupt the
    // file; this is the whole reason the two functions are separate.
    const bytes = new Uint8Array([0x80, 0xff, 0xfe, 0xa0, 0x00, 0x7f]);
    expect(Buffer.from(bytesToBase64(bytes), "base64").equals(Buffer.from(bytes))).toBe(true);
    // The UTF-8 path really does differ, so the separation is load-bearing and
    // not a stylistic duplicate.
    const viaText = utf8ToBase64(String.fromCharCode(...bytes));
    expect(viaText).not.toBe(bytesToBase64(bytes));
  });

  it("round-trips a PDF header byte for byte", () => {
    const pdf = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a,
    ]);
    const decoded = Buffer.from(bytesToBase64(pdf), "base64");
    expect(decoded.equals(Buffer.from(pdf))).toBe(true);
    expect(decoded.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
