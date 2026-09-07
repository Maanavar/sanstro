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
    // Real limb shapes, not just `{number, paksha}` — the hero header promotes
    // the star and tithi actually running through `limbNow`, which reads
    // `spans` / `endsAtIso`. Both boundaries sit after the frozen 08:30 clock,
    // so nothing has rolled over in these fixtures.
    tithi: {
      number: 11, name: "EKADASI", paksha: "SHUKLA",
      endsAt: "18:40", endsAtIso: "2026-08-23T13:10:00Z",
      nextNumber: 12, nextName: "DWADASI", nextPaksha: "SHUKLA",
    },
    nakshatra: {
      name: "SWATHI", pada: 2,
      endsAt: "14:20", endsAtIso: "2026-08-23T08:50:00Z", nextName: "VISAKAM",
    },
    tamilDate: { en: "Aavani 6", ta: "ஆவணி 6" },
    festivals: [],
    hora: [],
    abhijit: { start: "11:55", end: "12:44", isRestrictedByWeekday: false },
    kalam: {
      rahuKalam: { start: "09:00", end: "10:30", slot: 2 },
      yamagandam: { start: "13:30", end: "15:00", slot: 5 },
      kuligai: { start: "06:00", end: "07:30", slot: 1 },
      nallaNeram: [
        { start: "07:30", end: "08:18", slot: 2 },
        { start: "11:00", end: "11:48", slot: 5 },
      ],
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

  /**
   * T8 / A-013 shipped these as a collapsed "Other traditional timings"
   * disclosure. The owner removed that panel on 2026-09-04: it had become a
   * second, longer copy of the Key timings card in the same rail.
   *
   * What T8 actually ruled still has to hold, and it is the half that fails
   * silently — one promoted window, with every other system named and *demoted*
   * rather than deleted. A reader who knows only Rahu Kalam must still be able
   * to find Nalla Neram and Abhijit by name, and must still not be able to
   * mistake either for the recommendation. So these moved to the card that
   * replaced the panel instead of being deleted with it.
   */
  function keyTimingsCard() {
    return screen.getByText(/^Key timings for today$/i).closest(".ui-card")!;
  }

  it("no longer hides them behind a disclosure", async () => {
    await renderWithWindows([
      { type: "ABHIJIT", start: "12:02", end: "12:50", kala: "SUGAM" },
      { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "UTHI" },
    ]);

    expect(screen.queryByRole("button", { name: /Other traditional timings/i })).toBeNull();
  });

  it("still names every system, with the day's times, at the same demoted weight", async () => {
    await renderWithWindows([
      { type: "ABHIJIT", start: "12:02", end: "12:50", kala: "SUGAM" },
      { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "UTHI" },
    ]);

    const card = keyTimingsCard();
    for (const name of ["Nalla Neram", "Yamagandam", "Kuligai", "Abhijit muhurtham"]) {
      expect(card).toHaveTextContent(name);
    }
    // The Nalla Neram spans from the fixture, and Abhijit's own window.
    expect(card).toHaveTextContent("7:30 am");
    expect(card).toHaveTextContent("12:02 pm");
  });

  it("keeps Rahu Kalam out of the quiet list, because it is the loud card above", async () => {
    await renderWithWindows([{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" }]);

    expect(keyTimingsCard()).not.toHaveTextContent(/Rahu Kalam/);
    expect(screen.getByText(/^Avoid window$/i)).toBeInTheDocument();
  });

  it("keeps the avoid window promoted beside the recommendation, not buried", async () => {
    // Safety text precedes dense tables — the avoid card is the other axis,
    // not a competing recommendation, so it leads the rail.
    await renderWithWindows([
      { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" },
    ]);

    expect(screen.getByText(/^Avoid window$/i)).toBeInTheDocument();
  });
});

describe("Today tab — best-window conflict is a disclosure (redesign 2026-09-07)", () => {
  // The card used to render the competing window's caveat open, permanently,
  // as its own bordered row — a sixth stacked block under kicker/time/
  // countdown/reason. It names a *different, non-promoted* window, not a
  // caution on the one already recommended, so it collapses behind a toggle.
  it("stays collapsed by default and reveals the clash on click", async () => {
    freezeMorning();
    await renderTab({
      personalDailyGuidance: {
        ...guidanceFixture(),
        bestWindows: [{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "UTHI" }],
        bestWindowConflicts: [{
          start: "15:20", end: "16:13",
          text: {
            en: "The Jupiter hora suits your chart, but this stretch falls in Soram kala.",
            ta: "வியாழன் ஹோரை உங்கள் ஜாதகத்திற்குப் பொருந்தும், ஆனால் இந்த நேரம் சோரம் காலத்தில் விழுகிறது.",
          },
        }],
      } as unknown as DailyGuidanceData,
      panchangam: panchangamFixture() as unknown as TabProps["panchangam"],
    });

    // The label names the losing window's own start time, so it teaches
    // something before it is opened.
    expect(screen.queryByText(/Jupiter hora/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Why not 3:20 pm\?/i }));
    expect(screen.getByText(/Jupiter hora/i)).toBeInTheDocument();
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

/* ────────────────────────────────────────────────────────────────────────────
   Hero review 2026-09-04 — the findings that were fixed.

   Nine of the fifteen findings were in code the backend had already computed a
   correct answer for, which is exactly the failure mode no test catches by
   accident: nothing throws, nothing looks broken, and the screen quietly says
   the wrong thing. Each block below pins one of them at the point it would
   silently come back.
   ──────────────────────────────────────────────────────────────────────────── */

/** The default `_TONE_MAP` profile — the one whose `bestUseOfDay` token
 *  (`balanced_routine`) was rendering raw on screen. `*Text` carries the
 *  reviewed bilingual sentence the backend already ships for each field. */
function weatherFixture() {
  return {
    tone: "calm",
    physicalTendency: "steady",
    bestUseOfDay: "balanced_routine",
    avoidBefore: {
      en: "Delay emotionally heavy conversations until the evening if possible.",
      ta: "உணர்வுபூர்வமான முக்கிய பேச்சுகளை முடிந்தால் மாலை வரை தள்ளி வைக்கலாம்.",
    },
    toneText: { en: "Emotional tone is likely steady and calm.", ta: "இன்று மனநிலை பொதுவாக அமைதியாக இருக்கலாம்." },
    physicalTendencyText: { en: "Physical tendency should remain fairly steady.", ta: "உடல் நிலை வழக்கமான நடையில் இருக்கும்." },
    bestUseOfDayText: {
      en: "Well suited for routine progress and practical step-by-step decisions.",
      ta: "நிதானமான வழக்கமான வேலைகள், சிறு முடிவுகள், படிப்படியான முன்னேற்றம் — இவற்றுக்கு இன்று நல்ல நாள்.",
    },
  };
}

async function renderWithWeather(lang: "en" | "ta" = "en") {
  return renderTab({
    lang,
    personalDailyGuidance: {
      ...guidanceFixture(),
      emotionalWeather: weatherFixture(),
    } as unknown as DailyGuidanceData,
    panchangam: panchangamFixture() as unknown as TabProps["panchangam"],
  });
}

describe("Today tab — emotional weather (findings 1-3)", () => {
  beforeEach(freezeMorning);
  afterEach(() => vi.useRealTimers());

  it("never prints a database token as user copy", async () => {
    const { container } = await renderWithWeather();
    // The token that made the leak visible. `calm` and `steady` hid it by being
    // readable English words by luck.
    expect(container.textContent).not.toContain("balanced_routine");
    expect(screen.getByText("Routine progress")).toBeInTheDocument();
  });

  it("prints the reviewed sentence the backend already sent, not just a label", async () => {
    await renderWithWeather();
    expect(screen.getByText(/Well suited for routine progress/i)).toBeInTheDocument();
  });

  it("gives a Tamil reader Tamil, not English enums", async () => {
    const { container } = await renderWithWeather("ta");
    expect(container.textContent).not.toContain("balanced_routine");
    expect(container.textContent).not.toContain("steady");
    expect(screen.getByText("வழக்கமான பணிகள்")).toBeInTheDocument();
    expect(screen.getByText(/நிதானமான வழக்கமான வேலைகள்/)).toBeInTheDocument();
  });

  it("shows avoidBefore — the day's only real caution — instead of withholding it", async () => {
    await renderWithWeather();
    expect(screen.getByText(/Delay emotionally heavy conversations/i)).toBeInTheDocument();
  });

  it("does not paint the day's most positive field as a warning", async () => {
    // Tone used to be hard-coded by slot index, so `bestUseOfDay` wore
    // AlertTriangle in --color-low while `tone` wore a green leaf. The caution
    // colour now belongs to the caution, and to nothing else.
    await renderWithWeather();
    const bestUseChip = screen.getByText("Routine progress").closest("span")!;
    expect(bestUseChip.getAttribute("style") ?? "").not.toContain("--color-low");
  });
});

describe("Today tab — the avoid window's now-state (finding 4)", () => {
  afterEach(() => vi.useRealTimers());

  function avoidCard() {
    return screen.getByText(/^Avoid window$/i).closest("div")!.parentElement!;
  }

  it("says so while the reader is standing inside it", async () => {
    // 09:45 IST — inside the fixture's Rahu Kalam (09:00-10:30). The card used
    // to render exactly what it renders at 4pm.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-23T04:15:00Z"));
    await renderWithWindows([{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" }]);

    expect(avoidCard().textContent).toMatch(/inside it now/i);
    expect(avoidCard().textContent).toMatch(/ends in/);
  });

  it("counts down to it before it starts", async () => {
    freezeMorning(); // 08:30 IST, Rahu Kalam starts 09:00
    await renderWithWindows([{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" }]);

    expect(avoidCard().textContent).toMatch(/starts in/);
  });

  it("hides the card once it is over, rather than leaving a stale warning up", async () => {
    // Owner ask (2026-09-07): a caution that already happened is not
    // actionable, and kept eating hero space long after Rahu Kalam ended.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-23T09:00:00Z")); // 14:30 IST
    await renderWithWindows([{ type: "PERSONAL_HORA", start: "16:00", end: "16:48", kala: "AMIRTHAM" }]);

    expect(screen.queryByText(/^Avoid window$/i)).not.toBeInTheDocument();
  });
});

describe("Today tab — one score, one axis (finding 5)", () => {
  beforeEach(freezeMorning);
  afterEach(() => vi.useRealTimers());

  async function renderWithBand() {
    return renderWithWindows([{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" }], {
      personalDailyGuidance: {
        ...guidanceFixture(),
        band: "WEAK",
        bestWindows: [{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" }],
      } as unknown as DailyGuidanceData,
    });
  }

  it("drops the star row that re-encoded the dial's own number", async () => {
    await renderWithBand();
    expect(screen.queryByRole("img", { name: /\/ 5$/ })).toBeNull();
  });

  it("moves the band out of the hero and names the axis it measures", async () => {
    // "needs attention" beside "Balanced day", 6px apart, was two ladders on one
    // value reading as the app contradicting itself.
    const { container } = await renderWithBand();
    const pill = screen.getByText(/Chart support/i);
    expect(pill).toHaveTextContent(/needs attention/i);
    expect(container.querySelector("#nova-deep-dive")!.contains(pill)).toBe(true);
  });

  it("names the score link after the section it lands on", async () => {
    await renderWithBand();
    expect(screen.getAllByRole("link", { name: /Why this prediction/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /Why this score/i })).toBeNull();
  });

  it("moves focus to the explanation after following its hash link", async () => {
    const { container } = await renderWithBand();
    const target = container.querySelector("#nova-deep-dive")!;
    expect(target).toHaveAttribute("tabindex", "-1");

    fireEvent.click(screen.getAllByRole("link", { name: /Why this prediction/i })[0]);
    vi.advanceTimersByTime(0);

    expect(document.activeElement).toBe(target);
  });
});

describe("Today tab — the day's other named timings (findings 6-8)", () => {
  beforeEach(freezeMorning);
  afterEach(() => vi.useRealTimers());

  it("prints the day's Nalla Neram times, which no surface in the hero carried", async () => {
    await renderWithWindows([{ type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" }]);

    // The one system a Tamil almanac reader looks for by name used to render
    // with `value: null` — a definition and no times, under a count badge
    // promising four answers. The data was in hand the whole time.
    expect(screen.getByText(/^Key timings for today$/i).closest(".ui-card")).toHaveTextContent("7:30 am");
  });

  it("says when Abhijit runs into an avoid period", async () => {
    // Abhijit is ~48 min fixed around solar noon while the kalas move by
    // weekday, so the collision is structural, not rare. Listing it as a plain
    // good time one card under "clear of Rahu Kalam, Yamagandam and Kuligai"
    // gives the reader two contradictory instructions.
    await renderWithWindows([
      { type: "ABHIJIT", start: "09:50", end: "10:40", kala: "SUGAM" },
      { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" },
    ]);

    // Overlaps the fixture's Rahu Kalam 09:00-10:30, so the clear part is
    // 10:30-10:40 — the app's already-ruled position, not a new doctrine call.
    expect(screen.getByText(/clear part is 10:30/i)).toBeInTheDocument();
  });

  it("stays quiet on the days Abhijit is clear of all three kalas", async () => {
    // The note is a fact about today, not a standing caption. A note that
    // rendered every day would be back to being a definition.
    await renderWithWindows([
      { type: "ABHIJIT", start: "11:55", end: "12:44", kala: "SUGAM" },
      { type: "PERSONAL_HORA", start: "11:00", end: "11:48", kala: "AMIRTHAM" },
    ]);

    expect(screen.queryByText(/clear part is/i)).toBeNull();
  });
});
describe("Today tab — hero chrome (findings 10, 12, 13)", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps the evening-preview setting out of the morning hero", async () => {
    freezeMorning();
    await renderWithWindows([]);
    expect(screen.queryByRole("switch", { name: /Evening preview/i })).toBeNull();
  });

  it("exposes it as a real switch, with state, in the evening it applies to", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-23T14:00:00Z")); // 19:30 IST
    await renderWithWindows([]);

    expect(screen.getByRole("switch", { name: /Evening preview/i })).toHaveAttribute("aria-checked", "true");
  });

  it("drops the static 'what this screen contains' lede once there is a briefing", async () => {
    freezeMorning();
    await renderWithWindows([]);
    expect(screen.queryByText(/at a glance/i)).toBeNull();
  });

  it("keeps it on a screen with no guidance to lead with", async () => {
    freezeMorning();
    await renderTab({ personalDailyGuidance: null });
    expect(screen.getByText(/at a glance/i)).toBeInTheDocument();
  });

  it("answers a thirukanitham reader's first two questions in the header", async () => {
    freezeMorning();
    await renderWithWindows([]);
    // Star and tithi, ahead of paksha — and promoted by the same `limbNow` the
    // ribbon uses, so the two surfaces cannot name different stars.
    expect(screen.getByText("Swathi")).toBeInTheDocument();
    expect(screen.getByText("Ekadasi")).toBeInTheDocument();
  });
});
