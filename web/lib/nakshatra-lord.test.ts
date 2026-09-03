import { describe, expect, it } from "vitest";
import {
  VIMSHOTTARI_SEQUENCE,
  nakshatraLord,
  nakshatraLordShort,
} from "@vinaadi/shared/nakshatraLord";

/**
 * The 27-row Tamil lord table that used to be transcribed by hand in BOTH
 * JadhagamTool and chart-generate-inline-panel. Kept here verbatim as the
 * expected output so the derivation is pinned against the data it replaced —
 * if the cycle were ever mis-ordered, this catches it.
 */
const LEGACY_TABLE_TA: Record<number, string> = {
  1: "கேது", 2: "சுக்", 3: "சூரி", 4: "சந்", 5: "செவ்", 6: "ராகு", 7: "குரு",
  8: "சனி", 9: "புத", 10: "கேது", 11: "சுக்", 12: "சூரி", 13: "சந்", 14: "செவ்",
  15: "ராகு", 16: "குரு", 17: "சனி", 18: "புத", 19: "கேது", 20: "சுக்", 21: "சூரி",
  22: "சந்", 23: "செவ்", 24: "ராகு", 25: "குரு", 26: "சனி", 27: "புத",
};

describe("nakshatra lord derivation", () => {
  it("reproduces the hand-written table it replaced, for all 27 nakshatras", () => {
    for (let n = 1; n <= 27; n += 1) {
      expect(nakshatraLordShort(n, "ta")).toBe(LEGACY_TABLE_TA[n]);
    }
  });

  it("uses the 9-graha Vimshottari cycle in order", () => {
    expect(VIMSHOTTARI_SEQUENCE).toHaveLength(9);
    for (let n = 1; n <= 9; n += 1) {
      expect(nakshatraLord(n)).toBe(VIMSHOTTARI_SEQUENCE[n - 1]);
    }
  });

  it("repeats the cycle three times across the 27 nakshatras", () => {
    for (let n = 1; n <= 9; n += 1) {
      expect(nakshatraLord(n)).toBe(nakshatraLord(n + 9));
      expect(nakshatraLord(n)).toBe(nakshatraLord(n + 18));
    }
  });

  it("agrees with the known Sadayam/Shatabhisha correspondence", () => {
    expect(nakshatraLord(24)).toBe("RAHU");
  });

  it("throws rather than returning a wrong lord for an out-of-range number", () => {
    expect(() => nakshatraLord(0)).toThrow(RangeError);
    expect(() => nakshatraLord(28)).toThrow(RangeError);
    expect(() => nakshatraLord(3.5)).toThrow(RangeError);
  });

  it("has a short label in both languages for every nakshatra", () => {
    for (let n = 1; n <= 27; n += 1) {
      expect(nakshatraLordShort(n, "ta").trim()).not.toBe("");
      expect(nakshatraLordShort(n, "en").trim()).not.toBe("");
    }
  });
});
