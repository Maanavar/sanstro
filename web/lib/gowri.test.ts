import { describe, expect, it } from "vitest";
import {
  gowriCategoryRank,
  gowriCategoryLabel,
  gowriPurposeLabel,
  gowriPeriodLabel,
  bestGowriSlot,
} from "./gowri";

describe("gowriCategoryRank", () => {
  it("ranks AMIRDHA as 1 (best)", () => {
    expect(gowriCategoryRank("AMIRDHA")).toBe(1);
  });
  it("ranks SUGAM as 5 (last good)", () => {
    expect(gowriCategoryRank("SUGAM")).toBe(5);
  });
  it("returns 999 for unknown category", () => {
    expect(gowriCategoryRank("UNKNOWN")).toBe(999);
    expect(gowriCategoryRank(null)).toBe(999);
    expect(gowriCategoryRank(undefined)).toBe(999);
  });
  it("is case-insensitive", () => {
    expect(gowriCategoryRank("amirdha")).toBe(1);
    expect(gowriCategoryRank("Laabam")).toBe(3);
  });
});

describe("gowriCategoryLabel", () => {
  it("returns English label", () => {
    expect(gowriCategoryLabel("UTHI", "en")).toBe("Uthi / Uthiyogam");
  });
  it("returns Tamil label", () => {
    expect(gowriCategoryLabel("LAABAM", "ta")).toContain("லாபம்");
  });
  it("returns raw name for unknown category", () => {
    expect(gowriCategoryLabel("CUSTOM", "en")).toBe("CUSTOM");
    expect(gowriCategoryLabel(null, "en")).toBe("");
  });
});

describe("gowriPurposeLabel", () => {
  it("describes DHANAM purpose in English", () => {
    expect(gowriPurposeLabel("DHANAM", "en")).toContain("finance");
  });
  it("describes DHANAM purpose in Tamil", () => {
    expect(gowriPurposeLabel("DHANAM", "ta")).toContain("நிதி");
  });
  it("returns empty string for unknown", () => {
    expect(gowriPurposeLabel("UNKNOWN", "en")).toBe("");
  });
});

describe("gowriPeriodLabel", () => {
  it("maps AM/PM/DAY/NIGHT for English", () => {
    expect(gowriPeriodLabel("AM", "en")).toBe("AM");
    expect(gowriPeriodLabel("PM", "en")).toBe("PM");
    expect(gowriPeriodLabel("DAY", "en")).toBe("Day");
    expect(gowriPeriodLabel("NIGHT", "en")).toBe("Night");
  });
  it("maps AM/PM/DAY/NIGHT for Tamil", () => {
    expect(gowriPeriodLabel("AM", "ta")).toBe("காலை");
    expect(gowriPeriodLabel("PM", "ta")).toBe("மாலை");
    expect(gowriPeriodLabel("DAY", "ta")).toBe("பகல்");
    expect(gowriPeriodLabel("NIGHT", "ta")).toBe("இரவு");
  });
  it("returns empty string for unrecognised period", () => {
    expect(gowriPeriodLabel("NOON", "en")).toBe("");
  });
});

describe("bestGowriSlot", () => {
  it("picks the highest-ranked slot", () => {
    const slots = [
      { name: "SUGAM", start: "08:00", end: "09:00" },
      { name: "AMIRDHA", start: "10:00", end: "11:00" },
      { name: "LAABAM", start: "14:00", end: "15:00" },
    ];
    expect(bestGowriSlot(slots)?.name).toBe("AMIRDHA");
  });
  it("breaks ties by start time", () => {
    const slots = [
      { name: "LAABAM", start: "14:00", end: "15:00" },
      { name: "LAABAM", start: "08:00", end: "09:00" },
    ];
    expect(bestGowriSlot(slots)?.start).toBe("08:00");
  });
  it("returns undefined for empty array", () => {
    expect(bestGowriSlot([])).toBeUndefined();
    expect(bestGowriSlot(null)).toBeUndefined();
  });
});
