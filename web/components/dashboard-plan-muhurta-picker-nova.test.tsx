import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AlmanacMuhurthamBadge,
  clampWindowToToday,
  gregorianMonthOptions,
  groupSlotsByTamilMonth,
  monthEndIso,
  MuhurtaDayDetailDrawer,
  windowDayCount,
  withWeddingParams,
} from "./dashboard-plan-muhurta-picker-nova";
import type { MuhurtaDayDrawerComponentProps } from "./dashboard-plan-muhurta-picker-nova";
import type { MuhurtaSlot } from "@/lib/types";

// Partial, not wholesale: `lib/api` calls `initApiClient` at import time, so
// replacing the module outright breaks the picker's own import chain.
vi.mock("@vinaadi/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vinaadi/shared/api")>()),
  getPanchangamDay: vi.fn(() => Promise.resolve({ data: null })),
  getPanchangamMonth: vi.fn(() => Promise.resolve({ data: null })),
}));

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

/**
 * `MuhurtaDayDetailDrawer` is the seam three different ranking contexts share —
 * the detailed election, the quick month scan and the published wedding naal —
 * and the rule is that each one brings its own score and its own list of dates.
 * The drawer tests in `dashboard-calendar-day-drawer-nova.test.tsx` render the
 * drawer directly, so they prove that a `lead` prop reaches the DOM and nothing
 * about this composition. These cover the composition.
 *
 * The step list is the part that has already been wrong twice: once counting
 * ranked slots rather than days, and once treating "not in the list" as
 * position 1, which turned the forward arrow into a jump to somebody else's
 * result.
 */
describe("MuhurtaDayDetailDrawer step context", () => {
  const location = { latitude: 13.08, longitude: 80.27, timezone: "Asia/Kolkata" };

  /** Stands in for `DayDetailDrawerNova`: this suite is about which props the
   *  composition computes, not about how the drawer paints them. */
  function StubDrawer({ date, lead, stepContext, onStepDay }: MuhurtaDayDrawerComponentProps) {
    return (
      <div>
        <span data-testid="date">{date}</span>
        <span data-testid="position">{stepContext ? `${stepContext.position}/${stepContext.total}` : "none"}</span>
        <div data-testid="lead">{lead}</div>
        <button type="button" onClick={() => onStepDay(-1)}>prev</button>
        <button type="button" onClick={() => onStepDay(1)}>next</button>
      </div>
    );
  }

  function renderDrawer(date: string, resultDates: string[]) {
    const onDateChange = vi.fn();
    render(
      <MuhurtaDayDetailDrawer
        date={date}
        location={location}
        resultDates={resultDates}
        lang="en"
        lead={<p>Detailed election · 93.8</p>}
        onDateChange={onDateChange}
        onClose={vi.fn()}
        DayDrawer={StubDrawer}
      />,
    );
    return { onDateChange };
  }

  it("counts distinct days, not ranked slots, so a day with two windows steps once", async () => {
    // A ranked list can carry the same date twice. Stepping by slot would land
    // on the date it started from and the drawer would look frozen.
    const { onDateChange } = renderDrawer("2026-10-12", ["2026-10-12", "2026-10-12", "2026-10-15"]);

    expect(screen.getByTestId("position")).toHaveTextContent("1/2");
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    expect(onDateChange).toHaveBeenCalledWith("2026-10-15");
    await waitFor(() => expect(screen.getByTestId("date")).toHaveTextContent("2026-10-12"));
  });

  it("reports no position for a day outside the list instead of claiming to be its first result", async () => {
    // This is the "check a specific date" case: one typed day that the ranked
    // search never returned. Position 0 is what disables both arrows.
    const { onDateChange } = renderDrawer("2026-11-03", ["2026-10-12", "2026-10-15"]);

    expect(screen.getByTestId("position")).toHaveTextContent("0/2");
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    fireEvent.click(screen.getByRole("button", { name: "prev" }));
    expect(onDateChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId("lead")).toHaveTextContent("Detailed election · 93.8"));
  });

  it("shows only the lead its caller supplied, so two engines never share a screen", async () => {
    renderDrawer("2026-10-12", ["2026-10-12"]);

    expect(screen.getByTestId("lead")).toHaveTextContent("Detailed election · 93.8");
    // One checked day is both endpoints.
    expect(screen.getByTestId("position")).toHaveTextContent("1/1");
    await waitFor(() => expect(screen.getByTestId("date")).toHaveTextContent("2026-10-12"));
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
