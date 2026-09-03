import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { DailyGuidanceData } from "@/lib/types";

/**
 * T9 — the first-result comprehension layer. A reader who has never practised
 * lands on a number, a caution window and a wall of vocabulary; the guide is
 * the three sentences that say what the score is, what "avoid" actually scopes
 * to, and one thing to do.
 *
 * It is deliberately BEGINNER-only, which is the fragile part: `userMode`
 * defaults to "BALANCED" on this component, so the card disappears the moment
 * the prop stops arriving — a workspace refactor, a new prop inserted, a
 * renamed session field. Nothing throws, nothing looks broken, and the card is
 * simply gone for exactly the readers it was built for. So the default is
 * pinned as hard as the BEGINNER case is.
 */

vi.mock("@/lib/api", () => ({
  apiFetchJson: vi.fn().mockRejectedValue(new Error("no network in tests")),
  readErrorMessage: (err: unknown) => String(err),
}));

// Heavy siblings that fetch or draw — none of them are what these tests are
// about, and the guide renders at the top level of the tab regardless.
// The tab destructures `findHorai`'s result, so the stub returns the real
// shape. `horaStub` lets a single test hand it a running hora without a second
// module mock.
let horaStub: { current: { lord: string } | null; next: { lord: string; start: string } | null } = {
  current: null,
  next: null,
};
vi.mock("./dashboard-today-ribbon-nova", () => ({
  DashboardTodayRibbonNova: () => null,
  findHorai: () => horaStub,
}));
vi.mock("./dashboard-today-activity-board-nova", () => ({
  DashboardTodayActivityBoardNova: () => null,
}));
vi.mock("./dashboard-today-glance-nova", () => ({
  DashboardTodayQuickLinksNova: () => null,
  DashboardTodayFamilyRemedyRowNova: () => null,
  DashboardTodayLifeAreasDasaRowNova: () => null,
}));
vi.mock("./dashboard-one-minute-reading", () => ({
  DashboardOneMinuteReading: () => null,
}));
vi.mock("@/hooks/useStreak", () => ({
  useStreak: () => ({ days: 0, best: 0, forgiven: false }),
}));

function guidanceFixture(): DailyGuidanceData {
  return {
    chartId: "chart-1",
    dateLocal: "2026-08-23",
    score: 64,
    label: "MODERATE",
    scoreBreakdown: {
      moonTransit: 10, dashaSupport: 10, panchangam: 10,
      gocharSupport: 10, personalCautions: 0, remedialActionSupport: 0,
    },
    bestWindows: [],
    cautionWindows: [],
    text: { en: "A steady day.", ta: "சீரான நாள்." },
    actionSuggestion: {
      en: "Send the one message you have been putting off.",
      ta: "தள்ளிப்போட்ட ஒரு செய்தியை இன்று அனுப்புங்கள்.",
    },
    cautionSuggestion: { en: "", ta: "" },
    reasons: {
      moonTransit: { en: "", ta: "" }, dashaSupport: { en: "", ta: "" },
      panchangam: { en: "", ta: "" }, gochar: { en: "", ta: "" },
      personalCaution: { en: "", ta: "" },
    },
    remedy: { en: "", ta: "" },
    nakshatraPerspective: null,
    emotionalWeather: null,
    contextInsight: null,
    journalInsight: null,
  } as unknown as DailyGuidanceData;
}

type TabProps = Parameters<
  typeof import("./dashboard-today-tab-nova").DashboardTodayTabNova
>[0];

async function renderTab(overrides: Partial<TabProps> = {}) {
  const { DashboardTodayTabNova } = await import("./dashboard-today-tab-nova");
  return render(
    <DashboardTodayTabNova
      lang="en"
      birthDisplayName="Test Reader"
      selectedDate="2026-08-23"
      todayDate="2026-08-23"
      personalMemberChart={null}
      personalChartSummary={null}
      personalDailyGuidance={guidanceFixture()}
      personalSani={null}
      peyarchiUpcoming={[]}
      panchangam={null}
      panchangamTimings={null}
      weekAhead={null}
      familyAggregate={null}
      dasha={null}
      dashaAntar={[]}
      onOpenAskVinaadi={() => {}}
      {...overrides}
    />,
  );
}

const HEADING = /How to read your first result/i;

describe("Today tab — first-result guide gating", () => {
  it("shows the guide to a reader who said they are a beginner", async () => {
    await renderTab({ userMode: "BEGINNER" });

    expect(screen.getByRole("heading", { name: HEADING })).toBeInTheDocument();
    // All three explanations, not just the heading — the card is the content.
    expect(screen.getByText(/The score is a weather report/i)).toBeInTheDocument();
    expect(screen.getByText(/Avoid means new beginnings/i)).toBeInTheDocument();
    expect(screen.getByText(/Do one useful thing/i)).toBeInTheDocument();
  });

  it("uses the day's own action rather than the generic fallback", async () => {
    await renderTab({ userMode: "BEGINNER" });

    expect(
      screen.getByText(/Send the one message you have been putting off/i),
    ).toBeInTheDocument();
  });

  it("falls back to a usable action when the day carries none", async () => {
    // `actionSuggestion` is typed non-null, but the guide takes it as
    // `| null | undefined` and branches on it — because rows cached before a
    // field exists arrive without it, and the wire is not the type. The cast
    // is the point of the test, not a way around it.
    await renderTab({
      userMode: "BEGINNER",
      personalDailyGuidance: {
        ...guidanceFixture(),
        actionSuggestion: null,
      } as unknown as DailyGuidanceData,
    });

    expect(screen.getByText(/Use the best window for one focused task/i)).toBeInTheDocument();
  });

  it("does not render the guide before guidance has loaded", async () => {
    // An empty card headed "How to read your first result" with nothing under
    // the third column is worse than no card.
    await renderTab({ userMode: "BEGINNER", personalDailyGuidance: null });

    expect(screen.queryByRole("heading", { name: HEADING })).toBeNull();
  });

  it("hides the guide from the balanced and traditional modes", async () => {
    for (const userMode of ["BALANCED", "TRADITIONAL"] as const) {
      const { unmount } = await renderTab({ userMode });
      expect(screen.queryByRole("heading", { name: HEADING })).toBeNull();
      unmount();
    }
  });

  it("renders the guide in Tamil for a Tamil-reading beginner", async () => {
    await renderTab({ lang: "ta", userMode: "BEGINNER" });

    expect(screen.getByRole("heading", { name: "முதல் முடிவை எப்படி படிப்பது" })).toBeInTheDocument();
  });

  it("links onward to the vedic-vs-western explainer and the why trail", async () => {
    const { container } = await renderTab({ userMode: "BEGINNER" });

    expect(container.querySelector('a[href="/learn/vedic-vs-western"]')).toBeTruthy();
    // Layer 3 is one more tap away, never hidden: the guide has to point at it.
    expect(container.querySelector('a[href="#nova-deep-dive"]')).toBeTruthy();
  });
});

/**
 * T8 / A-013. Nalla Neram, Gowri, Abhijit and Horai used to render beside Rahu
 * Kalam / Yamagandam / Kuligai at the same weight, so a reader who knows only
 * Rahu Kalam could not tell which of the four to obey.
 *
 * The owner ruled (2026-08-23) that the promoted window is the one in the best
 * Gowri kala, and that a window overlapping an avoid-kala is never promoted.
 * `today-windows.test.ts` pins that arithmetic; these pin that the *screen*
 * carries it — that the chosen window is the one rendered, that it says why,
 * and that the other systems are named and demoted rather than deleted. Both
 * halves fail silently: a hero that recommends acting inside Rahu Kalam looks
 * completely normal, and so does one whose reason line has quietly stopped
 * rendering.
 */
function panchangamFixture() {
  return {
    sunrise: "06:02",
    vara: { weekday: "SUNDAY", lord: "SUN" },
    tithi: { number: 11, paksha: "SHUKLA" },
    tamilDate: { en: "Aavani 6", ta: "ஆவணி 6" },
    festivals: [],
    hora: [],
    kalam: {
      rahuKalam: { start: "09:00", end: "10:30", slot: 2 },
      yamagandam: { start: "13:30", end: "15:00", slot: 5 },
      kuligai: { start: "06:00", end: "07:30", slot: 1 },
      nallaNeram: [],
      gowriNallaNeram: [],
    },
  };
}

async function renderWithWindows(windows: unknown[], overrides: Partial<TabProps> = {}) {
  return renderTab({
    personalDailyGuidance: {
      ...guidanceFixture(),
      bestWindows: windows,
    } as unknown as DailyGuidanceData,
    panchangam: panchangamFixture() as unknown as TabProps["panchangam"],
    ...overrides,
  });
}

/** 08:30 in Asia/Kolkata on the fixture's date, so every window below is still
 *  ahead of "now". Without pinning the clock these cases pass or fail by the
 *  hour of day the suite happens to run at — the "has passed" branch would take
 *  over every afternoon. */
function freezeMorning() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-08-23T03:00:00Z"));
}

describe("Today tab — one recommended window (T8)", () => {
  beforeEach(freezeMorning);
  afterEach(() => vi.useRealTimers());

  it("promotes the window in the best Gowri kala, not the personal hora", async () => {
    await renderWithWindows([
      { type: "PERSONAL_HORA", start: "16:00", end: "16:45", kala: "SUGAM", isPersonal: true },
      { type: "BENEFIC_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM", isPersonal: false },
    ]);

    expect(screen.getByText(/Best window/).closest("div")).toHaveTextContent("11:00");
    expect(screen.getByText(/Amirtham/)).toBeInTheDocument();
  });

  it("never promotes a window that runs into Rahu Kalam", async () => {
    await renderWithWindows([
      { type: "BENEFIC_HORA", start: "09:12", end: "10:36", kala: "AMIRTHAM" },
      { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "LABHAM" },
    ]);

    const headline = screen.getByText(/Best window/).closest("div")!;
    expect(headline).toHaveTextContent("11:00");
    expect(headline.textContent).not.toContain("9:12");
    expect(screen.getByText(/next one clear of them/i)).toBeInTheDocument();
  });

  it("says the window is clear of the avoid periods, so the reader can check it", async () => {
    await renderWithWindows([
      { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" },
    ]);

    expect(screen.getByText(/Clear of Rahu Kalam, Yamagandam and Kuligai/i)).toBeInTheDocument();
  });

  it("says so plainly when every window of the day collides", async () => {
    await renderWithWindows([
      { type: "PERSONAL_HORA", start: "09:12", end: "10:36", kala: "SUGAM" },
      { type: "BENEFIC_HORA", start: "14:00", end: "14:40", kala: "AMIRTHAM" },
    ]);

    expect(screen.getByText(/Every good window today runs into/i)).toBeInTheDocument();
  });
});

describe("Today tab — the other timing systems (T8)", () => {
  beforeEach(freezeMorning);
  afterEach(() => vi.useRealTimers());

  it("folds them behind one closed disclosure instead of peer cards", async () => {
    // Abhijit deliberately ranks below the promoted window here — it only
    // appears in "other timings" when something else won the recommendation.
    await renderWithWindows([
      { type: "ABHIJIT", start: "12:02", end: "12:50", kala: "SUGAM" },
      { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "UTHI" },
    ]);

    const toggle = screen.getByRole("button", { name: /Other traditional timings/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Closed means closed: Abhijit must not still be sitting in the rail.
    expect(screen.queryByText(/48 minutes around midday/i)).toBeNull();
  });

  it("names what each system is, in words that need no vocabulary", async () => {
    horaStub = { current: { lord: "JUPITER" }, next: { lord: "MARS", start: "13:00" } };
    try {
      await renderWithWindows([
        { type: "ABHIJIT", start: "12:02", end: "12:50", kala: "SUGAM" },
        { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "UTHI" },
      ]);

      const { fireEvent } = await import("@testing-library/react");
      fireEvent.click(screen.getByRole("button", { name: /Other traditional timings/i }));

      expect(screen.getByText(/almanac's good windows for the day/i)).toBeInTheDocument();
      expect(screen.getByText(/48 minutes around midday/i)).toBeInTheDocument();
      expect(screen.getByText(/planetary hour/i)).toBeInTheDocument();
      // The scope line the audit asked for: avoid does not mean "stop working".
      expect(screen.getByText(/Work already under way is not affected/i)).toBeInTheDocument();
    } finally {
      horaStub = { current: null, next: null };
    }
  });

  it("leads the hora row with 'Planetary hour' and keeps Horai beside it (A-017)", async () => {
    // The feature underneath this row is genuinely usable hour-by-hour timing,
    // and "Horai" is the reason a reader without the tradition never opens it.
    // Plain meaning is the label; the almanac name stays visible as Layer 2.
    horaStub = { current: { lord: "JUPITER" }, next: { lord: "MARS", start: "13:00" } };
    try {
      await renderWithWindows([
        { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "UTHI" },
      ]);

      fireEvent.click(screen.getByRole("button", { name: /Other traditional timings/i }));

      // The glossed control is the plain-language phrase, not the proper noun.
      expect(screen.getByRole("button", { name: /^Planetary hour$/i })).toHaveStyle({
        cursor: "help",
      });
      // …and the traditional name did not simply disappear.
      expect(screen.getByText(/Horai/)).toBeInTheDocument();
    } finally {
      horaStub = { current: null, next: null };
    }
  });

  it("keeps the avoid window promoted beside the recommendation, not buried", async () => {
    // Safety text precedes dense tables — the avoid card is the other axis,
    // not a competing recommendation, so it does not go into the disclosure.
    await renderWithWindows([
      { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" },
    ]);

    expect(screen.getByText(/^Avoid window$/i)).toBeInTheDocument();
  });
});

describe("Today tab — glossary coverage (T11)", () => {
  beforeEach(freezeMorning);
  afterEach(() => vi.useRealTimers());

  it("glosses the main timing and score-reason terms in the Today tab itself", async () => {
    await renderWithWindows(
      [{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" }],
      {
        personalDailyGuidance: {
          ...guidanceFixture(),
          bestWindows: [{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" }],
          cautionWindows: [{
            type: "RAHU_KALAM",
            start: "09:00",
            end: "10:30",
            text: { en: "Avoid new starts.", ta: "" },
          }],
          reasons: {
            ...guidanceFixture().reasons,
            dashaSupport: { en: "Dasha support is mixed.", ta: "" },
            panchangam: { en: "Panchangam support is steady.", ta: "" },
            gochar: { en: "Transit support is steady.", ta: "" },
          },
        } as unknown as DailyGuidanceData,
      },
    );

    expect(screen.getByRole("button", { name: /Best window/i })).toHaveStyle({ cursor: "help" });
    expect(screen.getByRole("button", { name: /Rahu Kalam/i })).toHaveStyle({ cursor: "help" });
    expect(screen.getByRole("button", { name: /Dasa layer/i })).toHaveStyle({ cursor: "help" });
    expect(screen.getByRole("button", { name: /Panchangam/i })).toHaveStyle({ cursor: "help" });
    expect(screen.getByRole("button", { name: /Transit/i })).toHaveStyle({ cursor: "help" });
  });

  it("points opened Today glosses to the full glossary index", async () => {
    await renderWithWindows([{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" }]);

    fireEvent.click(screen.getByRole("button", { name: /Best window/i }));

    // Deep-linked to the term's own card, not the top of a 42-card index —
    // `GlossaryIndex` gives every article `id={key}`, and landing a reader at
    // the top of an alphabet-less wall is barely better than not linking.
    expect(screen.getByRole("link", { name: /See all terms/i })).toHaveAttribute(
      "href",
      "/dashboard/glossary#nallaNeram",
    );
  });

  it("glosses the Chandrashtama hero alert when that day needs extra care", async () => {
    await renderWithWindows([], {
      personalDailyGuidance: {
        ...guidanceFixture(),
        isChandrashtama: true,
      } as unknown as DailyGuidanceData,
    });

    expect(screen.getByRole("button", { name: /Chandrashtama today/i })).toHaveStyle({
      cursor: "help",
    });
  });
});

describe("Today tab — userMode wiring", () => {
  it("keeps the workspace passing userMode through to the tab", async () => {
    // The gating above is only as good as the prop reaching it, and that call
    // site is in a component far too heavy to render here. This is the cheap
    // guard against the exact regression the gate invites: the prop being
    // dropped in a refactor, the default silently taking over, and no test
    // anywhere noticing.
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("components/dashboard-workspace.tsx", "utf8");
    const call = source.slice(source.indexOf("<DashboardTodayTabNova"));
    expect(call.slice(0, call.indexOf("/>"))).toMatch(/userMode=\{session\.userMode\}/);
  });
});
