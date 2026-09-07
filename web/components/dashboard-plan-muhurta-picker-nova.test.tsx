import { describe, expect, it } from "vitest";

import {
  clampWindowToToday,
  gregorianMonthOptions,
  groupSlotsByTamilMonth,
  monthEndIso,
  windowDayCount,
} from "./dashboard-plan-muhurta-picker-nova";
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

/** The three "search by" modes all collapse to one Gregorian window before the
 *  request is built, so these are the functions that decide what is actually
 *  searched — a named month is only as good as the dates it resolves to. */
describe("search window resolution", () => {
  it("ends a month on its real last day, leap years included", () => {
    expect(monthEndIso("2026-09")).toBe("2026-09-30");
    expect(monthEndIso("2026-02")).toBe("2026-02-28");
    expect(monthEndIso("2028-02")).toBe("2028-02-29");
    expect(monthEndIso("2026-12")).toBe("2026-12-31");
  });

  it("returns nothing for an unparseable month rather than a half-built window", () => {
    expect(monthEndIso("")).toBe("");
    expect(monthEndIso("2026")).toBe("");
  });

  it("starts a part-elapsed month at today, not at its first day", () => {
    // Muhurta is only elected forward; the date inputs have always carried
    // min={today}, and a month picked mid-way must respect the same rule.
    expect(clampWindowToToday("2026-09-01", "2026-09-30", "2026-09-04")).toEqual({
      from: "2026-09-04",
      to: "2026-09-30",
    });
  });

  it("leaves a wholly future month alone", () => {
    expect(clampWindowToToday("2026-10-01", "2026-10-31", "2026-09-04")).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("rejects a window that has entirely passed", () => {
    // Null is what disables the search button, so an unsearchable selection
    // cannot reach the API and come back empty for a reason nobody can see.
    expect(clampWindowToToday("2026-08-01", "2026-08-31", "2026-09-04")).toBeNull();
    expect(clampWindowToToday("", "2026-09-30", "2026-09-04")).toBeNull();
  });

  it("counts both endpoints, because the window is closed at both ends", () => {
    expect(windowDayCount({ from: "2026-09-04", to: "2026-09-04" })).toBe(1);
    expect(windowDayCount({ from: "2026-09-04", to: "2026-09-30" })).toBe(27);
    // Across a DST-free IST year the arithmetic must still not drift.
    expect(windowDayCount({ from: "2026-09-18", to: "2026-10-17" })).toBe(30);
  });

  it("offers this month first and rolls the year over", () => {
    const options = gregorianMonthOptions("2026-11-20", "en");
    expect(options).toHaveLength(12);
    expect(options[0].value).toBe("2026-11");
    expect(options[2].value).toBe("2027-01");
    expect(options[11].value).toBe("2027-10");
  });
});
