import { describe, expect, it } from "vitest";

import { NOKKU_GROUPS, nokkuClassForNakshatra, nokkuMeta } from "./nokku";

describe("nokku classification table", () => {
  const all = [...NOKKU_GROUPS.URDHVAMUKHA, ...NOKKU_GROUPS.ADHOMUKHA, ...NOKKU_GROUPS.TIRYANGMUKHA];

  it("partitions all 27 nakshatras exactly once", () => {
    // The load-bearing test. A dropped or duplicated number would otherwise
    // surface as one real day a month quietly showing the wrong facing.
    expect([...all].sort((a, b) => a - b)).toEqual(Array.from({ length: 27 }, (_, i) => i + 1));
    expect(new Set(all).size).toBe(27);
  });

  it("splits 9 / 9 / 9", () => {
    expect(NOKKU_GROUPS.URDHVAMUKHA).toHaveLength(9);
    expect(NOKKU_GROUPS.ADHOMUKHA).toHaveLength(9);
    expect(NOKKU_GROUPS.TIRYANGMUKHA).toHaveLength(9);
  });

  it("keeps every Uthira- star facing up and every Poora- star facing down", () => {
    // The classical pairing, and the cheapest way to catch a transcription slip:
    // Uthiram/Uthiradam/Uthirattathi are 12/21/26, Pooram/Pooradam/Poorattathi 11/20/25.
    for (const n of [12, 21, 26]) expect(NOKKU_GROUPS.URDHVAMUKHA).toContain(n);
    for (const n of [11, 20, 25]) expect(NOKKU_GROUPS.ADHOMUKHA).toContain(n);
  });
});

describe("nokkuClassForNakshatra", () => {
  it("resolves the enum key, the romanised name, and the Tamil name alike", () => {
    expect(nokkuClassForNakshatra("ROHINI")).toBe("URDHVAMUKHA");
    expect(nokkuClassForNakshatra("Rohini")).toBe("URDHVAMUKHA");
    expect(nokkuClassForNakshatra("ரோகிணி")).toBe("URDHVAMUKHA");
  });

  it("classifies one star from each group", () => {
    expect(nokkuClassForNakshatra("UTHIRADAM")).toBe("URDHVAMUKHA");
    expect(nokkuClassForNakshatra("POORADAM")).toBe("ADHOMUKHA");
    expect(nokkuClassForNakshatra("VISAKAM")).toBe("ADHOMUKHA");
    expect(nokkuClassForNakshatra("REVATHI")).toBe("TIRYANGMUKHA");
  });

  it("returns null for an unresolvable nakshatra rather than guessing", () => {
    expect(nokkuClassForNakshatra("NOT_A_STAR")).toBeNull();
    expect(nokkuClassForNakshatra("")).toBeNull();
    expect(nokkuClassForNakshatra(null)).toBeNull();
    expect(nokkuClassForNakshatra(undefined)).toBeNull();
  });
});

describe("nokkuMeta", () => {
  it("romanises the Tamil in English rather than translating the label", () => {
    expect(nokkuMeta("ROHINI", "en")?.label).toBe("Mel Nokku Naal");
    expect(nokkuMeta("ROHINI", "ta")?.label).toBe("மேல் நோக்கு நாள்");
  });

  it("keeps the meaning out of the label in both languages", () => {
    // Guards the no-bilingual-echo rule: the label must not carry a
    // parenthetical gloss in either language.
    for (const lang of ["en", "ta"] as const) {
      const meta = nokkuMeta("POORADAM", lang);
      expect(meta?.label).not.toMatch(/[()]/);
      expect(meta?.meaning).toBeTruthy();
    }
  });

  it("is null when the nakshatra is unknown", () => {
    expect(nokkuMeta("NOT_A_STAR", "en")).toBeNull();
  });
});
