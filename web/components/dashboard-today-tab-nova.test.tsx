import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
vi.mock("./dashboard-today-ribbon-nova", () => ({
  DashboardTodayRibbonNova: () => null,
  findHorai: () => null,
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
