import { describe, expect, it } from "vitest";

import { buildTamilMonthHeader, formatGridDay } from "./dashboard-calendar-monthly-nova";
import type { PanchangamMonthDayEntry } from "@/lib/types";

/**
 * B-027 — the Tamil month line under the grid heading.
 *
 * The first pass printed the GREGORIAN month's own span — "Aadi & Aavani ·
 * 1 Aug–31 Aug 2026" — directly beneath a heading already reading "August
 * 2026". It restated the line above it and answered the wrong question: a Tamil
 * month runs ingress-to-ingress, so what a reader needs is where the seam
 * falls, and "1 Aug" additionally claimed a start Aadi did not have.
 */
function day(dateLocal: string, tamilMonth: string, tamilDay: number): PanchangamMonthDayEntry {
  return {
    dateLocal,
    tamilDate: { en: `${tamilMonth} ${tamilDay}`, ta: `${tamilMonth} ${tamilDay}` },
  } as unknown as PanchangamMonthDayEntry;
}

/** A August-shaped month: Aadi through the 16th, Aavani from the 17th. */
function august(): PanchangamMonthDayEntry[] {
  const out: PanchangamMonthDayEntry[] = [];
  for (let d = 1; d <= 31; d += 1) {
    const iso = `2026-08-${String(d).padStart(2, "0")}`;
    out.push(d <= 16 ? day(iso, "Aadi", d + 15) : day(iso, "Aavani", d - 16));
  }
  return out;
}

describe("buildTamilMonthHeader", () => {
  it("dates the changeover, not the Gregorian month", () => {
    expect(buildTamilMonthHeader(august(), "en")).toBe("Aadi → Aavani · 17 Aug");
  });

  it("never restates the Gregorian span the heading above already gives", () => {
    const header = buildTamilMonthHeader(august(), "en");
    expect(header).not.toContain("1 Aug");
    expect(header).not.toContain("31 Aug");
  });

  it("does not date the first month, which was already running", () => {
    // Aadi began in mid-July. Printing a start for it would date it to the 1st.
    const header = buildTamilMonthHeader(august(), "en");
    expect(header.match(/Aug/g)?.length).toBe(1);
  });

  it("prints a lone Tamil month with no date at all", () => {
    const entries = [day("2026-08-01", "Aavani", 1), day("2026-08-02", "Aavani", 2)];
    expect(buildTamilMonthHeader(entries, "en")).toBe("Aavani");
  });

  it("finds the seam even if the feed arrives out of order", () => {
    // The seam is derived from adjacency, so an unsorted feed would invent one.
    const shuffled = [...august()].reverse();
    expect(buildTamilMonthHeader(shuffled, "en")).toBe("Aadi → Aavani · 17 Aug");
  });

  it("returns nothing when no day carries a Tamil date", () => {
    const bare = [{ dateLocal: "2026-08-01" } as unknown as PanchangamMonthDayEntry];
    expect(buildTamilMonthHeader(bare, "en")).toBe("");
  });

  it("skips undated days without breaking the run of a month", () => {
    const entries = [
      day("2026-08-01", "Aadi", 16),
      { dateLocal: "2026-08-02" } as unknown as PanchangamMonthDayEntry,
      day("2026-08-03", "Aadi", 18),
    ];
    expect(buildTamilMonthHeader(entries, "en")).toBe("Aadi");
  });
});

describe("formatGridDay", () => {
  it("reads the ISO date as written, with no timezone hop", () => {
    // `new Date("2026-08-17")` is parsed as UTC and lands on the 16th west of
    // Greenwich, which would misdate the changeover by a day.
    expect(formatGridDay("2026-08-17", "en")).toBe("17 Aug");
    expect(formatGridDay("2026-01-01", "en")).toBe("1 Jan");
  });

  it("abbreviates Tamil months without cutting a grapheme cluster", () => {
    // "ஆகஸ்ட்".slice(0, 3) is "ஆகஸ" — a consonant severed from its pulli.
    const out = formatGridDay("2026-08-17", "ta");
    expect(out).toBe("17 ஆக");
    expect(out).not.toContain("ஸ");
  });

  it("falls back to the raw value rather than printing a wrong date", () => {
    expect(formatGridDay("not-a-date", "en")).toBe("not-a-date");
    expect(formatGridDay("2026-99-01", "en")).toBe("2026-99-01");
  });
});
