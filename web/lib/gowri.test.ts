import { describe, expect, it } from "vitest";
import {
  gowriCategoryRank,
  gowriCategoryLabel,
  gowriCautionLabel,
  gowriPurposeLabel,
  gowriPeriodLabel,
  gowriQualityLabel,
  gowriSlotDayOffsets,
  bestGowriSlot,
} from "./gowri";

describe("gowriCategoryRank", () => {
  it("ranks AMIRTHAM as 1 (best)", () => {
    expect(gowriCategoryRank("AMIRTHAM")).toBe(1);
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
    expect(gowriCategoryRank("amirtham")).toBe(1);
    expect(gowriCategoryRank("Labham")).toBe(3);
  });
});

describe("gowriCategoryLabel", () => {
  it("returns English label", () => {
    expect(gowriCategoryLabel("UTHI", "en")).toBe("Uthi");
  });
  it("returns Tamil label", () => {
    expect(gowriCategoryLabel("LABHAM", "ta")).toContain("லாபம்");
  });
  it("returns raw name for unknown category", () => {
    expect(gowriCategoryLabel("CUSTOM", "en")).toBe("CUSTOM");
    expect(gowriCategoryLabel(null, "en")).toBe("");
  });
  it("labels inauspicious kalas (Rogam/Soram/Visham) instead of raw uppercase", () => {
    expect(gowriCategoryLabel("ROGAM", "en")).toBe("Rogam");
    expect(gowriCategoryLabel("SORAM", "ta")).toBe("சோரம்");
    expect(gowriCategoryLabel("visham", "en")).toBe("Visham");
  });
});

describe("gowriCautionLabel", () => {
  it("explains why an inauspicious kala is avoided", () => {
    expect(gowriCautionLabel("ROGAM", "en")).toContain("illness");
    expect(gowriCautionLabel("SORAM", "en")).toContain("loss");
    expect(gowriCautionLabel("VISHAM", "ta")).toContain("விஷம்");
  });
  it("is empty for good kalas and unknown names", () => {
    expect(gowriCautionLabel("AMIRTHAM", "en")).toBe("");
    expect(gowriCautionLabel("CUSTOM", "en")).toBe("");
    expect(gowriCautionLabel(null, "en")).toBe("");
  });
});

describe("gowriPurposeLabel", () => {
  it("describes LABHAM purpose in English", () => {
    expect(gowriPurposeLabel("LABHAM", "en")).toContain("profit");
  });
  it("describes LABHAM purpose in Tamil", () => {
    expect(gowriPurposeLabel("LABHAM", "ta")).toContain("லாபம்");
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

describe("gowriQualityLabel", () => {
  it("singles out AMIRTHAM as the best kala", () => {
    expect(gowriQualityLabel("AMIRTHAM", "en")).toBe("Best");
    expect(gowriQualityLabel("amirtham", "ta")).toBe("மிகச் சிறந்தது");
  });
  it("calls the other good kalas simply good", () => {
    expect(gowriQualityLabel("UTHI", "en")).toBe("Good");
    expect(gowriQualityLabel("LABHAM", "en")).toBe("Good");
    expect(gowriQualityLabel("SUGAM", "ta")).toBe("நல்லது");
  });
  it("marks the inauspicious kalas as avoid", () => {
    expect(gowriQualityLabel("ROGAM", "en")).toBe("Avoid");
    expect(gowriQualityLabel("SORAM", "en")).toBe("Avoid");
    expect(gowriQualityLabel("VISHAM", "ta")).toBe("தவிர்க்கவும்");
  });
  it("returns empty string for unknown names", () => {
    expect(gowriQualityLabel("CUSTOM", "en")).toBe("");
    expect(gowriQualityLabel(null, "en")).toBe("");
  });
});

describe("gowriSlotDayOffsets", () => {
  // Real engine output for 2026-07-17 at ~11.1°N / 77.3°E (sunrise 06:09,
  // sunset 18:44), so the wrap points below are the ones users actually see.
  const nightSlots = [
    { start: "18:44", end: "20:09" },
    { start: "20:09", end: "21:35" },
    { start: "21:35", end: "23:01" },
    { start: "23:01", end: "00:26" },
    { start: "00:26", end: "01:52" },
    { start: "01:52", end: "03:18" },
    { start: "03:18", end: "04:43" },
    { start: "04:43", end: "06:09" },
  ];

  it("keeps day kalas on the panchangam date", () => {
    const daySlots = [
      { start: "06:09", end: "07:43" },
      { start: "12:26", end: "14:01" },
      { start: "17:09", end: "18:44" },
    ];
    expect(gowriSlotDayOffsets(daySlots, "06:09")).toEqual([
      { startOffset: 0, endOffset: 0 },
      { startOffset: 0, endOffset: 0 },
      { startOffset: 0, endOffset: 0 },
    ]);
  });

  it("rolls night kalas onto the next day once the clock passes midnight", () => {
    expect(gowriSlotDayOffsets(nightSlots, "18:44")).toEqual([
      { startOffset: 0, endOffset: 0 },
      { startOffset: 0, endOffset: 0 },
      { startOffset: 0, endOffset: 0 },
      // Starts before midnight, ends after it.
      { startOffset: 0, endOffset: 1 },
      { startOffset: 1, endOffset: 1 },
      { startOffset: 1, endOffset: 1 },
      { startOffset: 1, endOffset: 1 },
      // Last night kala ends at the next sunrise — still the next day, not a second roll.
      { startOffset: 1, endOffset: 1 },
    ]);
  });

  it("never rolls a night that ends before midnight (far-northern summer)", () => {
    const shortNight = [
      { start: "22:30", end: "22:52" },
      { start: "22:52", end: "23:15" },
    ];
    expect(gowriSlotDayOffsets(shortNight, "22:30")).toEqual([
      { startOffset: 0, endOffset: 0 },
      { startOffset: 0, endOffset: 0 },
    ]);
  });

  it("returns an empty list for no slots", () => {
    expect(gowriSlotDayOffsets([], "18:48")).toEqual([]);
  });
});

describe("bestGowriSlot", () => {
  it("picks the highest-ranked slot", () => {
    const slots = [
      { name: "SUGAM", start: "08:00", end: "09:00" },
      { name: "AMIRTHAM", start: "10:00", end: "11:00" },
      { name: "LABHAM", start: "14:00", end: "15:00" },
    ];
    expect(bestGowriSlot(slots)?.name).toBe("AMIRTHAM");
  });
  it("breaks ties by start time", () => {
    const slots = [
      { name: "LABHAM", start: "14:00", end: "15:00" },
      { name: "LABHAM", start: "08:00", end: "09:00" },
    ];
    expect(bestGowriSlot(slots)?.start).toBe("08:00");
  });
  it("returns undefined for empty array", () => {
    expect(bestGowriSlot([])).toBeUndefined();
    expect(bestGowriSlot(null)).toBeUndefined();
  });
});
