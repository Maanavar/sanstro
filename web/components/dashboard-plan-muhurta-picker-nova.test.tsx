import { describe, expect, it } from "vitest";

import { groupSlotsByTamilMonth } from "./dashboard-plan-muhurta-picker-nova";
import type { MuhurtaSlot } from "@/lib/types";

/** Only the fields the grouping reads; the rest of a slot is irrelevant here. */
function slot(date: string, tamil: string | null, score = 70): MuhurtaSlot {
  const [en, ta] = tamil ? tamil.split("|") : [null, null];
  return {
    date,
    tamilDate: en && ta ? { en, ta } : null,
    timeStart: "06:00",
    timeEnd: "07:30",
    score,
    panchangamSupport: { en: "", ta: "" },
    cautions: [],
  };
}

describe("groupSlotsByTamilMonth", () => {
  it("splits a range into its Tamil months in date order, whatever order the slots arrive in", () => {
    // The picker hands over a score-ranked list, not a date-sorted one.
    const groups = groupSlotsByTamilMonth([
      slot("2026-08-25", "Aavani 8|ஆவணி 8", 91),
      slot("2026-08-14", "Aadi 29|ஆடி 29", 62),
      slot("2026-08-20", "Aavani 3|ஆவணி 3", 77),
    ]);

    expect(groups.map((g) => g.en)).toEqual(["Aadi", "Aavani"]);
    expect(groups[0].slots.map((s) => s.date)).toEqual(["2026-08-14"]);
    expect(groups[1].firstDate).toBe("2026-08-20");
    expect(groups[1].lastDate).toBe("2026-08-25");
  });

  it("keeps two visits to the same month name apart", () => {
    // A wedding search over more than a Tamil year comes back through Aadi
    // twice. Bucketing by name would file dates a year apart under one heading.
    const groups = groupSlotsByTamilMonth([
      slot("2026-07-20", "Aadi 4|ஆடி 4"),
      slot("2026-09-05", "Purattasi 19|புரட்டாசி 19"),
      slot("2027-07-22", "Aadi 6|ஆடி 6"),
    ]);

    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.en)).toEqual(["Aadi", "Purattasi", "Aadi"]);
    expect(groups[0].key).not.toBe(groups[2].key);
  });

  it("keeps a slot with no Tamil date in the list instead of dropping it", () => {
    const groups = groupSlotsByTamilMonth([slot("2026-07-20", "Aadi 4|ஆடி 4"), slot("2026-07-21", null)]);

    expect(groups).toHaveLength(2);
    expect(groups[1].en).toBe("");
    expect(groups[1].slots.map((s) => s.date)).toEqual(["2026-07-21"]);
  });

  it("returns nothing for an empty result", () => {
    expect(groupSlotsByTamilMonth([])).toEqual([]);
  });
});
