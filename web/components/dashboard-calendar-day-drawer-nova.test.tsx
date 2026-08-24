/**
 * Month-grid day drawer layout contract.
 *
 * Everything asserted here is *arrangement* — which fact sits in which slot of
 * the sheet — which is exactly what tsc and lint cannot see. Each item is a
 * defect the 2026-08-22 redesign closed:
 *
 *  1. Three calendar systems were concatenated into the `<h2>` with " · ", so a
 *     480px panel clipped the heading. The date is the heading; the Tamil and
 *     Hijri dates are subtitle.
 *  2. "Today's recommended Nalla Neram" was printed on every date the sheet
 *     could show, including one months away.
 *  3. The five limbs were one run-on line of names with no boundary times — the
 *     thing a reader opens a specific day to find.
 *  4. Muhurtham status and Karinaal are independent markings; fusing them into
 *     one verdict would silently pick a winner.
 *  5. Comparing two days meant closing the sheet and hunting the grid.
 *  6. The primary action was the last thing in the scroll, and vanished
 *     entirely while the day was still loading.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PanchangamDailyResponseData } from "@/lib/types";

import { DayDetailDrawerNova } from "./dashboard-calendar-tab-nova";

// Synthetic Thursday in Chennai — no real birth profile or personal data.
function dayFixture(overrides: Partial<PanchangamDailyResponseData> = {}): PanchangamDailyResponseData {
  return {
    dateLocal: "2026-06-04",
    location: { lat: 13.0827, lng: 80.2707, timezone: "Asia/Kolkata" },
    sunrise: "05:45",
    sunset: "18:29",
    solarNoon: "12:07",
    vara: { weekday: "THURSDAY", lord: "GURU" },
    // Backend enum spellings, not guesses: tithi/yoga/karana arrive as the
    // uppercase keys in packages/shared/src/i18n/panchangam-names.ts, while
    // soolam/parigaram/amirdhadhi arrive already in Tamil and are mapped in
    // web/lib/i18n.ts. A fixture that invents a key renders the raw enum and
    // the test still passes, which is how a missing name map hides.
    tithi: {
      number: 4, name: "CHATHURTHI", paksha: "SHUKLA", endsAt: "21:10", endsAtIso: "2026-06-04T21:10",
      nextNumber: 5, nextName: "PANCHAMI", nextPaksha: "SHUKLA",
    },
    nakshatra: { name: "ROHINI", pada: 2, endsAt: "14:20", endsAtIso: "2026-06-04T14:20", nextName: "MRIGASHIRA" },
    yoga: { number: 7, name: "SUKARMA", endsAt: "16:40", endsAtIso: "2026-06-04T16:40", nextName: "DHRITI" },
    karana: { name: "VANIJA", endsAt: "10:05", endsAtIso: "2026-06-04T10:05", nextName: "VISHTI" },
    kalam: {
      rahuKalam: { start: "13:42", end: "15:18", slot: 6 },
      yamagandam: { start: "05:45", end: "07:20", slot: 1 },
      kuligai: { start: "08:56", end: "10:31", slot: 3 },
      gowriPanchangam: [],
      nallaNeram: [{ start: "07:20", end: "08:56", slot: 1, name: "SUGAM", period: "AM", isGood: true }],
      gowriNallaNeram: [],
    },
    abhijit: { start: "11:52", end: "12:22", isRestrictedByWeekday: false },
    subhaMuhurtham: { isSubha: true, reason: "", isSubhaStrict: false, strictReason: "" },
    festivals: [],
    hora: [],
    moonPhaseLabel: "WAXING",
    soolam: { direction: "தெற்கு", parigaram: "வெல்லம்" },
    lagnam: { rasiNumber: 3, rasiName: "Mithunam", endsAt: "07:30", endsAtIso: "2026-06-04T07:30", nazhigai: 2, vinadi: 30 },
    nethiram: "OPEN",
    jeevan: "SUKKILAN",
    amirdhadhiYogam: { name: "அமிர்தயோகம்", endsAt: "14:20", endsAtIso: "2026-06-04T14:20", nextName: "சித்தயோகம்" },
    chandrashtamamToday: {
      moonRasiNumber: 2, moonRasiName: "Rishabam",
      affectedJanmaRasiNumber: 7, affectedJanmaRasiName: "Thulam",
      nakshatras: [], janmaNakshatraWindows: [],
    },
    ...overrides,
  };
}

type RenderOptions = {
  data?: PanchangamDailyResponseData | null;
  loading?: boolean;
  error?: string | null;
  /** Defaults to a date that is NOT the sheet's date, the ordinary case. */
  todayDate?: string;
  onStepDay?: (delta: number) => void;
  onOpenFull?: () => void;
  onClose?: () => void;
};

function renderDrawer(options: RenderOptions = {}) {
  // `vi.fn(impl)` rather than `options.onStepDay ?? vi.fn()`: the `??` form has
  // the union type `((delta: number) => void) | Mock`, so `.mock.calls` below
  // does not typecheck (tsc caught it; vitest, which never typechecks the file,
  // did not). Wrapping keeps any caller-supplied implementation AND the spy.
  const onStepDay = vi.fn(options.onStepDay);
  const onOpenFull = options.onOpenFull ?? vi.fn();
  const onClose = options.onClose ?? vi.fn();
  render(
    <DayDetailDrawerNova
      date="2026-06-04"
      todayDate={options.todayDate ?? "2026-09-01"}
      data={options.data === undefined ? dayFixture() : options.data}
      loading={options.loading ?? false}
      error={options.error ?? null}
      lang="en"
      onClose={onClose}
      onOpenFull={onOpenFull}
      onStepDay={onStepDay}
    />,
  );
  return { onStepDay, onOpenFull, onClose };
}

/** The spec row for one panchangam limb, found by its uppercase label.
 *
 *  Anchored on the row's own `data-spec-row` rather than on
 *  `getByText(label).parentElement`: the label is wrapped in a <GlossaryTerm>
 *  button on the terms that have a definition, so walking up one level from the
 *  text lands inside the tooltip trigger instead of on the row. */
function specRow(label: string): HTMLElement {
  const row = document.querySelector<HTMLElement>(`[data-spec-row="${label}"]`);
  if (!row) throw new Error(`No spec row for "${label}"`);
  return row;
}

describe("Day drawer — the heading is the date, and nothing else", () => {
  it("puts only the Gregorian date in the dialog heading", () => {
    renderDrawer();
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("4 Jun 2026");
    // The Tamil and Hijri dates used to be appended here with " · " and clipped.
    expect(heading.textContent).not.toContain("·");
  });

  it("names the dialog by that heading rather than a duplicated aria-label", () => {
    renderDrawer();
    expect(screen.getByRole("dialog")).toHaveAccessibleName("4 Jun 2026");
  });

  it("carries the weekday and the Tamil date in the subtitle, where they can wrap", () => {
    renderDrawer();
    const heading = screen.getByRole("heading", { level: 2 });
    const headingBlock = heading.parentElement as HTMLElement;
    expect(within(headingBlock).getByText("Thursday")).toBeInTheDocument();
  });

  it("marks the sheet as today only when it is today", () => {
    const { unmount } = render(<div />);
    unmount();
    renderDrawer({ todayDate: "2026-06-04" });
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("does not claim today on any other date", () => {
    renderDrawer();
    expect(screen.queryByText("Today")).toBeNull();
  });
});

describe("Day drawer — copy is scoped to the date it is showing", () => {
  it("titles the Nalla Neram card without 'Today's'", () => {
    renderDrawer();
    expect(screen.getByText("Recommended Nalla Neram")).toBeInTheDocument();
    expect(screen.queryByText(/Today's/)).toBeNull();
  });
});

describe("Day drawer — each limb prints when it ends", () => {
  it("gives the tithi its paksha and its boundary time", () => {
    renderDrawer();
    const row = specRow("Tithi");
    expect(within(row).getByText("Chathurthi")).toBeInTheDocument();
    expect(within(row).getByText(/Valarpirai 4 · until 9:10 pm/)).toBeInTheDocument();
  });

  it("gives the nakshatra its pada and its boundary time", () => {
    renderDrawer();
    const row = specRow("Nakshatra");
    expect(within(row).getByText("Rohini")).toBeInTheDocument();
    expect(within(row).getByText(/Pada 2 · until 2:20 pm/)).toBeInTheDocument();
  });

  it("carries yogam, karanam and amirdhadhi yogam with their own boundaries", () => {
    renderDrawer();
    const yogam = specRow("Naamyogam");
    expect(within(yogam).getByText("Sukarma")).toBeInTheDocument();
    expect(within(yogam).getByText("until 4:40 pm")).toBeInTheDocument();

    const karanam = specRow("Karana");
    // Almanac spelling, not the Sanskrit VANIJA the API sends.
    expect(within(karanam).getByText("Vanisai")).toBeInTheDocument();
    expect(within(karanam).getByText("until 10:05 am")).toBeInTheDocument();

    const amirdhadhi = specRow("Amirdhadhi");
    expect(within(amirdhadhi).getByText("Amirdha Yogam")).toBeInTheDocument();
    expect(within(amirdhadhi).getByText("until 2:20 pm")).toBeInTheDocument();
  });

  it("carries soolam with its parigaram, both through the name maps", () => {
    renderDrawer();
    const row = specRow("Soolam");
    expect(within(row).getByText("South")).toBeInTheDocument();
    expect(within(row).getByText("Parigaram: Jaggery")).toBeInTheDocument();
  });
});

describe("Day drawer — one marking, one row", () => {
  it("states muhurtham status on its own", () => {
    renderDrawer();
    expect(screen.getByText("Subha Muhurtham day")).toBeInTheDocument();
    expect(screen.queryByText("Karinaal")).toBeNull();
  });

  it("says plainly when a day carries no muhurtham marking", () => {
    renderDrawer({ data: dayFixture({ subhaMuhurtham: { isSubha: false, reason: "", isSubhaStrict: false, strictReason: "" } }) });
    expect(screen.getByText("Not a muhurtham day")).toBeInTheDocument();
  });

  it("keeps Karinaal as a second row rather than overwriting the muhurtham verdict", () => {
    // A day can be marked both. Fusing them into one rating would have to pick a
    // winner silently, and the reader could not tell which fact produced it.
    renderDrawer({ data: dayFixture({ isKarinaal: true }) });
    expect(screen.getByText("Subha Muhurtham day")).toBeInTheDocument();
    expect(screen.getByText("Karinaal")).toBeInTheDocument();
  });
});

describe("Day drawer — the next day is one click away", () => {
  it("steps forward and back without closing the sheet", () => {
    const { onStepDay, onClose } = renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Next day" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(onStepDay.mock.calls).toEqual([[1], [-1]]);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("Day drawer — the primary action is pinned, not buried", () => {
  it("opens the full day view from the footer", () => {
    const { onOpenFull } = renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Open full day view" }));
    expect(onOpenFull).toHaveBeenCalledTimes(1);
  });

  it("keeps the action and the day steppers available while the day is still loading", () => {
    renderDrawer({ loading: true, data: null });
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open full day view" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next day" })).toBeInTheDocument();
  });
});
