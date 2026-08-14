/**
 * Panchangam view layout contract.
 *
 * These four facts are all about *arrangement* — which label sits next to which
 * value, in what order, in which container — and arrangement is exactly what
 * type-checking and lint cannot see. Each one regressed or was reported as
 * unreadable at least once:
 *
 *  1. The Nalla Neram and Gowri Nalla Neram cards printed bare clock times, so
 *     when the two windows coincided the second card was indistinguishable
 *     noise. Each window now names the Gowri kala it was cut from.
 *  2. The three inauspicious kalams were three stacked cards; they are one
 *     three-up row.
 *  3. Five Limbs row order (and "Naamyogam", not "Yoga", for the 27 nithya
 *     yogas — "Yoga" sat directly above "Amirdhadhi Yogam" and read as a repeat).
 *  4. A festival is a headline fact and belongs in the day-header chip row
 *     beside Valarpirai, not eight sections down under the kalams.
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PanchangamDailyResponseData } from "@/lib/types";

vi.mock("@/hooks/useMonthlyPanchangam", () => ({
  useMonthlyPanchangam: () => ({
    monthlyPanchangam: null,
    isMonthlyPanchangamLoading: false,
    monthlyPanchangamError: null,
    fetchMonthlyPanchangam: vi.fn(),
  }),
}));

import { DashboardCalendarTabNova } from "./dashboard-calendar-tab-nova";

// Synthetic Thursday: Yamagandam sits on the first good day kala (Dhanam), so
// Nalla Neram opens at Sugam and the Gowri summary lands on the ranked-best
// Amirtham — the case where the two cards must not print the same window.
function panchangamFixture(
  overrides: Partial<PanchangamDailyResponseData> = {},
): PanchangamDailyResponseData {
  return {
    dateLocal: "2026-06-04",
    location: { lat: 13.0827, lng: 80.2707, timezone: "Asia/Kolkata" },
    sunrise: "05:45",
    sunset: "18:29",
    solarNoon: "12:07",
    vara: { weekday: "THURSDAY", lord: "GURU" },
    tithi: {
      number: 4, name: "CHATURTHI", paksha: "SHUKLA", endsAt: "21:10", endsAtIso: "2026-06-04T21:10",
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
      nallaNeram: [
        { start: "07:20", end: "08:56", slot: 1, name: "SUGAM", period: "AM", isGood: true },
        { start: "16:53", end: "18:29", slot: 2, name: "LABHAM", period: "PM", isGood: true },
      ],
      gowriNallaNeram: [
        { start: "12:07", end: "13:42", slot: 1, name: "AMIRTHAM", period: "DAY", isGood: true },
        { start: "18:29", end: "19:53", slot: 2, name: "AMIRTHAM", period: "NIGHT", isGood: true },
      ],
    },
    abhijit: { start: "11:52", end: "12:22", isRestrictedByWeekday: false },
    subhaMuhurtham: { isSubha: true, reason: "", isSubhaStrict: false, strictReason: "" },
    festivals: [],
    hora: [],
    moonPhaseLabel: "WAXING",
    soolam: { direction: "SOUTH", parigaram: "CURD" },
    lagnam: { rasiNumber: 3, rasiName: "Mithunam", endsAt: "07:30", endsAtIso: "2026-06-04T07:30", nazhigai: 2, vinadi: 30 },
    nethiram: "OPEN",
    jeevan: "SUKKILAN",
    amirdhadhiYogam: { name: "AMIRTHA", endsAt: "14:20", endsAtIso: "2026-06-04T14:20", nextName: "SIDDHA" },
    chandrashtamamToday: {
      moonRasiNumber: 2, moonRasiName: "Rishabam",
      affectedJanmaRasiNumber: 7, affectedJanmaRasiName: "Thulam",
      nakshatras: [], janmaNakshatraWindows: [],
    },
    ...overrides,
  };
}

function renderPanchangam(overrides: Partial<PanchangamDailyResponseData> = {}) {
  return render(
    <DashboardCalendarTabNova
      selectedDate="2026-06-04"
      todayDate="2026-06-04"
      panchangam={panchangamFixture(overrides)}
      panchangamTimings={null}
      lang="en"
    />,
  );
}

/** The title text also appears on the DayTimeline band, so pick the card. */
function auspiciousCard(title: string): HTMLElement {
  const card = screen
    .getAllByText(title)
    .map((el) => el.parentElement)
    .find((el) => el?.className.includes("ui-card--high"));
  if (!card) throw new Error(`No auspicious card titled "${title}"`);
  return card as HTMLElement;
}

describe("Panchangam view — auspicious windows name their kala", () => {
  it("labels each recommended Nalla Neram window with its Gowri kala and quality", () => {
    renderPanchangam();
    const card = auspiciousCard("Today's recommended Nalla Neram");
    expect(within(card).getByText(/Sugam/)).toBeInTheDocument();
    expect(within(card).getByText(/Labham/)).toBeInTheDocument();
    expect(within(card).getAllByText(/Good/).length).toBeGreaterThan(0);
    expect(within(card).getByText("7:20 am – 8:56 am")).toBeInTheDocument();
  });

  it("labels the additional Gowri good-time windows, and Amirtham reads as Best rather than Good", () => {
    renderPanchangam();
    const card = auspiciousCard("Additional Gowri good times");
    expect(within(card).getAllByText(/Amirtham/).length).toBe(2);
    expect(within(card).getAllByText(/Best/).length).toBe(2);
  });

  it("keeps the Auspicious cards to name + verdict + window, with no purpose prose", () => {
    renderPanchangam();
    // Four windows across the two cards, each a kala the reader can look up in
    // the Gowri detail grid below. Repeating "good for X" under every one of
    // them turned a list of times into a paragraph, so the cards carry none.
    for (const title of ["Today's recommended Nalla Neram", "Additional Gowri good times"]) {
      const card = auspiciousCard(title);
      expect(within(card).queryByText(/any important activity/)).toBeNull();
      expect(within(card).queryByText(/comfort, health/)).toBeNull();
      expect(within(card).queryByText(/profit, business/)).toBeNull();
    }
  });

  it("still says what each kala is good for, in the Gowri detail grid", () => {
    // The cards can drop the purpose line only because this grid keeps it: the
    // two facts move together, so assert them in the same file.
    renderPanchangam({
      kalam: {
        ...panchangamFixture().kalam,
        gowriPanchangam: [
          { start: "12:07", end: "13:42", slot: 4, name: "AMIRTHAM", period: "DAY", isGood: true },
          { start: "18:29", end: "19:53", slot: 1, name: "SUGAM", period: "NIGHT", isGood: true },
        ],
      },
    });
    expect(screen.getByText(/any important activity/)).toBeInTheDocument();
    expect(screen.getByText(/comfort, health/)).toBeInTheDocument();
  });

  it("does not print the same window on both cards", () => {
    renderPanchangam();
    const nalla = auspiciousCard("Today's recommended Nalla Neram");
    const gowri = auspiciousCard("Additional Gowri good times");
    const times = (el: HTMLElement) =>
      Array.from(el.querySelectorAll("span")).map((s) => s.textContent).filter((s) => s?.includes("–"));
    expect(times(nalla).some((t) => times(gowri).includes(t))).toBe(false);
  });
});

describe("Panchangam view — the three kalams to avoid", () => {
  it("puts all three in one row, not three stacked cards", () => {
    renderPanchangam();
    const heading = screen.getByText("Avoid");
    const strip = heading.parentElement?.querySelector("div[style*='grid']") as HTMLElement;
    expect(strip).toBeTruthy();
    expect(within(strip).getByText("Rahu Kalam")).toBeInTheDocument();
    expect(within(strip).getByText("Yamagandam")).toBeInTheDocument();
    expect(within(strip).getByText("Kuligai")).toBeInTheDocument();
    expect(strip.children).toHaveLength(3);
  });

  it("marks the kalam running right now, and only that one", () => {
    // Yamagandam 05:45-07:20 on the fixture; freeze the clock inside it.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T06:30:00"));
    try {
      renderPanchangam();
      expect(screen.getAllByText("Running now")).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("never claims a kalam is running while browsing another date", () => {
    render(
      <DashboardCalendarTabNova
        selectedDate="2026-06-04"
        todayDate="2026-06-05"
        panchangam={panchangamFixture()}
        panchangamTimings={null}
        lang="en"
      />,
    );
    expect(screen.queryByText("Running now")).not.toBeInTheDocument();
  });
});

describe("Panchangam view — Five Limbs table", () => {
  it("lists the rows in the astrologer's reading order", () => {
    renderPanchangam();
    const table = screen.getByText("Panchangam · Five Limbs").parentElement as HTMLElement;
    const labels = Array.from(table.querySelectorAll(".cd-detail-spec-row__label")).map((el) => el.textContent);
    expect(labels).toEqual([
      "Vara", "Moon", "Lagnam", "Nakshatra", "Tithi",
      "Naamyogam", "Amirdhadhi Yogam", "Karana", "Soolam", "Nethiram", "Jeevan",
    ]);
  });

  it("calls the 27 nithya yogas Naamyogam so they do not read as Amirdhadhi Yogam repeated", () => {
    renderPanchangam();
    const table = screen.getByText("Panchangam · Five Limbs").parentElement as HTMLElement;
    const labels = Array.from(table.querySelectorAll(".cd-detail-spec-row__label")).map((el) => el.textContent);
    expect(labels).toContain("Naamyogam");
    expect(labels).not.toContain("Yoga");
  });
});

describe("Panchangam view — festivals", () => {
  const festivals = [
    { name: "Vaikasi Visakam", category: "HINDU", tags: ["hindu"] },
    { name: "World Environment Day", category: "OBSERVANCE", tags: ["observance"] },
  ];

  it("shows a festival as a chip in the day-header row, beside the fortnight", () => {
    renderPanchangam({ festivals });
    const chipRow = screen.getByText("Valarpirai").parentElement?.parentElement as HTMLElement;
    expect(within(chipRow).getByText("Vaikasi Visakam")).toBeInTheDocument();
    expect(within(chipRow).getByText("World Environment Day")).toBeInTheDocument();
  });

  it("no longer repeats them in a separate Today's Events section", () => {
    renderPanchangam({ festivals });
    expect(screen.queryByText("Today's Events")).not.toBeInTheDocument();
    expect(screen.getAllByText("Vaikasi Visakam")).toHaveLength(1);
  });

  it("prints nothing at all on a day with no festivals", () => {
    renderPanchangam();
    expect(screen.queryByText("Today's Events")).not.toBeInTheDocument();
    expect(screen.queryByText("No festivals today")).not.toBeInTheDocument();
  });
});
