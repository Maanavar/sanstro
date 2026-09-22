import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AlmanacMuhurthamBadge,
  clampWindowToToday,
  gregorianMonthOptions,
  groupSlotsByTamilMonth,
  monthEndIso,
  windowDayCount,
  withWeddingParams,
} from "./dashboard-plan-muhurta-picker-nova";
import type { MuhurtaSlot } from "@/lib/types";

/** What leaves the picker for a wedding. The failure being guarded is silent — a
 *  one-chart request renders exactly like a two-chart one — so this watches the
 *  query, not the pixels. */
describe("withWeddingParams", () => {
  const couple = { partnerChartId: "chart-partner", subjectRole: "BRIDE" as const };

  it("sends the partner and the role for a wedding couple", () => {
    const params = withWeddingParams(new URLSearchParams(), "MARRIAGE", { couple, subjectRole: "BRIDE", partnerName: "Synthetic" });
    expect(params.get("partnerChartId")).toBe("chart-partner");
    expect(params.get("subjectRole")).toBe("BRIDE");
  });

  it("never sends a partner for any other activity", () => {
    // The couple ruling was made for a wedding; a partner chosen for the wedding
    // must not quietly re-score a house-warming.
    const params = withWeddingParams(new URLSearchParams(), "SPIRITUAL", { couple, subjectRole: "BRIDE", partnerName: null });
    expect(params.has("partnerChartId")).toBe(false);
    expect(params.has("subjectRole")).toBe(false);
  });

  it("still names a one-chart bride, and names nobody when the role was not given", () => {
    const named = withWeddingParams(new URLSearchParams(), "MARRIAGE", { couple: null, subjectRole: "BRIDE", partnerName: null });
    expect(named.has("partnerChartId")).toBe(false);
    expect(named.get("subjectRole")).toBe("BRIDE");
    const unnamed = withWeddingParams(new URLSearchParams(), "MARRIAGE", { couple: null, subjectRole: "PERSON", partnerName: null });
    expect(unnamed.has("subjectRole")).toBe(false);
  });
});

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

/* §3 of docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md. The almanac wedding
   list and this computed search never mentioned each other, which is the first
   thing a Tamil family asks. Astrologer: membership is a **gate**, not a bonus
   point — so it is reported beside the score and never inside it. */
describe("AlmanacMuhurthamBadge", () => {
  function withAlmanac(almanac: MuhurtaSlot["almanacMuhurtham"]): MuhurtaSlot {
    return { ...slot("2026-05-14", null), almanacMuhurtham: almanac };
  }

  it("earns a pill for a day the almanac lists, naming its pirai", () => {
    render(<AlmanacMuhurthamBadge slot={withAlmanac({ status: "ON_LIST", pirai: "VALARPIRAI" })} lang="en" />);

    const pill = screen.getByText(/Almanac muhurtham day/);
    expect(pill).toBeInTheDocument();
    expect(pill.closest("[data-almanac]")).toHaveAttribute("data-almanac", "ON_LIST");
    expect(screen.getByText("Valarpirai")).toBeInTheDocument();
  });

  it("names the pirai the Tamil almanac's way, never Shukla or Krishna", () => {
    // Owner ruling: Tamil almanac naming over Sanskrit. And the whole card is a
    // Tamil-family surface, so an en-only pass proves nothing here.
    render(<AlmanacMuhurthamBadge slot={withAlmanac({ status: "ON_LIST", pirai: "THEIPIRAI" })} lang="ta" />);

    expect(screen.getByText(/பஞ்சாங்க முகூர்த்த நாள்/)).toBeInTheDocument();
    expect(screen.getByText("தேய்பிறை")).toBeInTheDocument();
    expect(screen.queryByText(/Krishna|Shukla/i)).not.toBeInTheDocument();
  });

  it("says an unlisted day is unlisted, quietly and without a pill", () => {
    const { container } = render(<AlmanacMuhurthamBadge slot={withAlmanac({ status: "NOT_ON_LIST" })} lang="en" />);

    expect(screen.getByText("Not on the almanac muhurtham list")).toBeInTheDocument();
    // A 30-row list of well-scored dates must not read as a wall of faults: the
    // almanac's silence is a fact for the family to weigh, not an alert.
    expect(container.querySelector("[data-almanac=\"ON_LIST\"]")).toBeNull();
  });

  it("does not report an unpublished year as a rejection", () => {
    // The state that made three states necessary. Telling a family their date
    // failed a list nobody has published is worse than saying nothing.
    render(<AlmanacMuhurthamBadge slot={withAlmanac({ status: "NO_SHEET" })} lang="en" />);

    const line = screen.getByText(/No almanac muhurtham list sourced/);
    expect(line).toBeInTheDocument();
    expect(screen.queryByText(/Not on the almanac/)).not.toBeInTheDocument();
  });

  it("renders nothing at all for an activity that carries no almanac verdict", () => {
    // Every non-wedding activity. The sheets are wedding sheets.
    const { container } = render(<AlmanacMuhurthamBadge slot={slot("2026-05-14", null)} lang="en" />);
    expect(container).toBeEmptyDOMElement();
  });
});
