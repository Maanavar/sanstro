import { describe, expect, it } from "vitest";
import { lunarSpecialTithiMeta, moonPhaseFromTithi } from "./lunar";

describe("lunarSpecialTithiMeta", () => {
  it("returns new-moon meta for AMAVASAI in English", () => {
    const meta = lunarSpecialTithiMeta("AMAVASAI", "en");
    expect(meta).not.toBeNull();
    expect(meta!.kind).toBe("new");
    expect(meta!.phaseLabel).toBe("No moon");
  });

  it("returns new-moon meta for AMAVASAI in Tamil", () => {
    const meta = lunarSpecialTithiMeta("AMAVASAI", "ta");
    expect(meta).not.toBeNull();
    expect(meta!.phaseLabel).toContain("நிலா");
  });

  it("returns full-moon meta for POURNAMI in English", () => {
    const meta = lunarSpecialTithiMeta("POURNAMI", "en");
    expect(meta).not.toBeNull();
    expect(meta!.kind).toBe("full");
    expect(meta!.phaseLabel).toBe("Full moon");
  });

  it("returns full-moon meta for POURNAMI in Tamil", () => {
    const meta = lunarSpecialTithiMeta("POURNAMI", "ta");
    expect(meta).not.toBeNull();
    expect(meta!.phaseLabel).toContain("முழுநிலா");
  });

  it("returns null for regular tithi", () => {
    expect(lunarSpecialTithiMeta("PRATHAMA", "en")).toBeNull();
    expect(lunarSpecialTithiMeta(null, "en")).toBeNull();
    expect(lunarSpecialTithiMeta(undefined, "en")).toBeNull();
  });
});

describe("moonPhaseFromTithi", () => {
  it("is full and near fully lit on Shukla Pournami (15)", () => {
    const p = moonPhaseFromTithi(15, "SHUKLA");
    expect(p.fraction).toBeCloseTo(1, 5);
    expect(p.waxing).toBe(true);
    expect(p.cyclePosition).toBeCloseTo(0.5, 5);
  });

  it("is new and dark on Krishna Amavasai (15)", () => {
    const p = moonPhaseFromTithi(15, "KRISHNA");
    expect(p.fraction).toBeCloseTo(0, 5);
    expect(p.cyclePosition).toBeCloseTo(1, 5);
  });

  it("is a thin waxing crescent on Shukla Prathamai (1)", () => {
    const p = moonPhaseFromTithi(1, "SHUKLA");
    expect(p.waxing).toBe(true);
    expect(p.fraction).toBeGreaterThan(0);
    expect(p.fraction).toBeLessThan(0.15);
  });

  it("is a waning gibbous the day after full (Krishna 1)", () => {
    const p = moonPhaseFromTithi(1, "KRISHNA");
    expect(p.waxing).toBe(false);
    expect(p.fraction).toBeGreaterThan(0.9);
  });

  it("is roughly half-lit around Ashtami (8)", () => {
    const p = moonPhaseFromTithi(8, "SHUKLA");
    expect(p.fraction).toBeGreaterThan(0.4);
    expect(p.fraction).toBeLessThan(0.65);
  });

  it("clamps out-of-range tithi indices", () => {
    expect(() => moonPhaseFromTithi(0, "SHUKLA")).not.toThrow();
    expect(() => moonPhaseFromTithi(99, "KRISHNA")).not.toThrow();
    expect(moonPhaseFromTithi(0, "SHUKLA").fraction).toBeGreaterThanOrEqual(0);
  });
});

// The API sends tithi.number as the ABSOLUTE 1-30 index, not the per-paksha
// 1-15 one every test above uses (app/calculations/panchangam.py: "tithi_number
// is 1-30 across both pakshas"). The old Math.min(15, …) clamp silently pinned
// every real Krishna tithi to 15, so the whole waning fortnight rendered as an
// identical dark new moon. These lock the real wire values.
describe("moonPhaseFromTithi — absolute 1-30 tithi numbers (what the API sends)", () => {
  it("does not freeze the waning fortnight at one shape", () => {
    const fractions = Array.from({ length: 15 }, (_, i) => moonPhaseFromTithi(16 + i, "KRISHNA").fraction);
    expect(new Set(fractions.map((f) => f.toFixed(3))).size).toBe(15);
  });

  it("wanes monotonically from just-past-full (16) to dark Amavasai (30)", () => {
    const fractions = Array.from({ length: 15 }, (_, i) => moonPhaseFromTithi(16 + i, "KRISHNA").fraction);
    for (let i = 1; i < fractions.length; i++) {
      expect(fractions[i]).toBeLessThan(fractions[i - 1]);
    }
    expect(fractions[0]).toBeGreaterThan(0.9); // day after Pournami is still nearly full
    expect(fractions[14]).toBeCloseTo(0, 5); // absolute 30 = Amavasai = dark
  });

  it("waxes monotonically from Prathamai (1) to Pournami (15)", () => {
    const fractions = Array.from({ length: 15 }, (_, i) => moonPhaseFromTithi(1 + i, "SHUKLA").fraction);
    for (let i = 1; i < fractions.length; i++) {
      expect(fractions[i]).toBeGreaterThan(fractions[i - 1]);
    }
    expect(fractions[14]).toBeCloseTo(1, 5);
  });

  it("reads an absolute Krishna number the same as its per-paksha twin", () => {
    // absolute 23 and per-paksha 8 are the same day; both must agree.
    expect(moonPhaseFromTithi(23, "KRISHNA").fraction).toBeCloseTo(
      moonPhaseFromTithi(8, "KRISHNA").fraction,
      10,
    );
  });

  it("keeps waxing/waning limb orientation from the paksha, not the index", () => {
    expect(moonPhaseFromTithi(20, "KRISHNA").waxing).toBe(false);
    expect(moonPhaseFromTithi(10, "SHUKLA").waxing).toBe(true);
  });
});
