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
