/**
 * dashaSentiment doctrine test (F2 fix) — the "Dasa chapter" glance tile must
 * read the current antardasha lord's sentiment off the chart's Lagna-dependent
 * functionalNature map, matching the doctrine used everywhere else (dasha
 * service, daily-guidance modifiers, remedies, adhipathi report), not a
 * hardcoded natural benefic/malefic split.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChartSummaryData, RemedyFocus } from "@/lib/types";

import { DashboardTodayFamilyRemedyRowNova, DashboardTodayLifeAreasDasaRowNova, DashboardTodayQuickLinksNova } from "./dashboard-today-glance-nova";

function baseChartSummary(overrides: Partial<ChartSummaryData>): ChartSummaryData {
  return {
    chartId: "chart-1",
    displayName: "Test User",
    currentAge: 30,
    lagnaRasi: "Thulam",
    moonRasi: "Simmam",
    janmaNakshatra: "Chitra",
    janmaPada: 2,
    currentMahadasha: "SATURN",
    currentAntardasha: "SATURN",
    primaryLanguageText: { ta: "", en: "" },
    ...overrides,
  };
}

function renderGlance(personalChartSummary: ChartSummaryData | null) {
  return render(
    <DashboardTodayLifeAreasDasaRowNova
      lang="en"
      personalChartSummary={personalChartSummary}
      dasha={null}
      dashaAntar={[]}
      selectedDate="2026-07-11"
    />,
  );
}

describe("DashboardTodayLifeAreasDasaRowNova — dasha sentiment doctrine", () => {
  it("shows supportive for a Thula-lagna native in Saturn antardasha (Saturn is Yogakaraka for Thulam)", () => {
    renderGlance(
      baseChartSummary({
        currentMahadasha: "SATURN",
        currentAntardasha: "SATURN",
        functionalNature: { SATURN: "YOGAKARAKA" },
      }),
    );
    expect(screen.getByText("supportive period")).toBeInTheDocument();
  });

  it("shows testing for a Mesha-lagna native in Venus antardasha (Venus is Maraka for Mesha)", () => {
    renderGlance(
      baseChartSummary({
        currentMahadasha: "VENUS",
        currentAntardasha: "VENUS",
        functionalNature: { VENUS: "MARAKA" },
      }),
    );
    expect(screen.getByText("testing period · go gently")).toBeInTheDocument();
  });

  it("falls back to the natural benefic split when functionalNature is missing (Jupiter -> supportive)", () => {
    renderGlance(
      baseChartSummary({
        currentMahadasha: "JUPITER",
        currentAntardasha: "JUPITER",
        functionalNature: undefined,
      }),
    );
    expect(screen.getByText("supportive period")).toBeInTheDocument();
  });

  it("shows 'grows with effort' (not 'testing period') for Upachaya — DASH-10.2 ruling", () => {
    renderGlance(
      baseChartSummary({
        currentMahadasha: "MARS",
        currentAntardasha: "MARS",
        functionalNature: { MARS: "UPACHAYA" },
      }),
    );
    expect(screen.getByText("grows with effort")).toBeInTheDocument();
    expect(screen.queryByText("testing period · go gently")).not.toBeInTheDocument();
  });

  it("still shows testing for Dusthana (Upachaya split-out doesn't affect it)", () => {
    renderGlance(
      baseChartSummary({
        currentMahadasha: "MARS",
        currentAntardasha: "MARS",
        functionalNature: { MARS: "DUSTHANA" },
      }),
    );
    expect(screen.getByText("testing period · go gently")).toBeInTheDocument();
  });
});

describe("DashboardTodayQuickLinksNova", () => {
  function renderLinks(overrides: Partial<Parameters<typeof DashboardTodayQuickLinksNova>[0]> = {}) {
    const callbacks = {
      onOpenChartGen: vi.fn(),
      onOpenMuhurta: vi.fn(),
      onOpenCompatibility: vi.fn(),
      onOpenActivityTiming: vi.fn(),
      onOpenRasipalan: vi.fn(),
      onOpenVarshaphala: vi.fn(),
      onGoToJournal: vi.fn(),
      onGoToExplore: vi.fn(),
      onGoToAllTools: vi.fn(),
    };
    render(
      <DashboardTodayQuickLinksNova
        lang="en"
        needsProfile={false}
        {...callbacks}
        {...overrides}
      />,
    );
    return callbacks;
  }

  it("renders all 8 tiles and the trailing 'All tools' link", () => {
    renderLinks();
    for (const label of [
      "Today's Rasipalan", "Muhurta Finder", "Compatibility", "Generate Jadhagam",
      "Best Days This Month", "Annual Chart", "Journal", "Explore & Learn",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("All tools")).toBeInTheDocument();
  });

  it("fires the matching callback when a tile is clicked", () => {
    const callbacks = renderLinks();
    fireEvent.click(screen.getByText("Muhurta Finder"));
    expect(callbacks.onOpenMuhurta).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Journal"));
    expect(callbacks.onGoToJournal).toHaveBeenCalledTimes(1);
  });

  it("disables the chart-dependent tiles (Compatibility, Activity Timing, Varshaphala) when needsProfile is true", () => {
    const callbacks = renderLinks({ needsProfile: true });
    fireEvent.click(screen.getByText("Compatibility"));
    fireEvent.click(screen.getByText("Best Days This Month"));
    fireEvent.click(screen.getByText("Annual Chart"));
    expect(callbacks.onOpenCompatibility).not.toHaveBeenCalled();
    expect(callbacks.onOpenActivityTiming).not.toHaveBeenCalled();
    expect(callbacks.onOpenVarshaphala).not.toHaveBeenCalled();
    // Unaffected tiles stay enabled.
    fireEvent.click(screen.getByText("Today's Rasipalan"));
    expect(callbacks.onOpenRasipalan).toHaveBeenCalledTimes(1);
  });

  it("renders Tamil labels only (no English/Tamil title echo) when lang='ta'", () => {
    renderLinks({ lang: "ta" });
    expect(screen.getByText("இன்றைய ராசிபலன்")).toBeInTheDocument();
    expect(screen.queryByText("Today's Rasipalan")).not.toBeInTheDocument();
  });
});

describe("Remedy For You card (chart-driven)", () => {
  const sampleFocus: RemedyFocus = {
    planet: "MOON",
    role: "DASHA_LORD",
    isWeak: true,
    weekday: "MONDAY",
    lead: {
      en: "Moon rules your running dasa and sits weak. Any one of these three steadies it.",
      ta: "சந்திரன் உங்கள் நடப்பு தசையை ஆள்கிறது.",
    },
    why: { en: "Your current mahadasa is ruled by Moon.", ta: "உங்கள் மகாதசை சந்திரன்." },
    actions: [
      { text: { en: "At Thingaloor temple, offer rice, milk.", ta: "கோவிலில் படையுங்கள்." }, kind: "TEMPLE", cadence: "RITUAL_ON_DAY" },
      { text: { en: "Feed a young mother and her child.", ta: "தாய்க்கு உணவளியுங்கள்." }, kind: "SEVA", cadence: "ANY_DAY" },
      { text: { en: "Sponsor a girl child's schooling.", ta: "கல்விக்கு உதவுங்கள்." }, kind: "SEVA", cadence: "ANY_DAY" },
    ],
    japa: 11000,
  };

  function renderRemedy(overrides: Partial<Parameters<typeof DashboardTodayFamilyRemedyRowNova>[0]> = {}) {
    const onSaveReminder = vi.fn();
    const onGoToLifeAreas = vi.fn();
    render(
      <DashboardTodayFamilyRemedyRowNova
        lang="en"
        familyAggregate={null}
        remedy={{ en: "Flat fallback remedy.", ta: "பின்னடைப்பு." }}
        remedyFocus={sampleFocus}
        savingReminder={false}
        reminderMessage={null}
        onSaveReminder={onSaveReminder}
        onGoToLifeAreas={onGoToLifeAreas}
        {...overrides}
      />,
    );
    return { onSaveReminder, onGoToLifeAreas };
  }

  it("leads with the anchor planet (glyph + '<Lord> Dasa' eyebrow) and its three catalog acts", () => {
    renderRemedy();
    expect(screen.getByText("Moon Dasa")).toBeInTheDocument();
    expect(screen.getByText("☾")).toBeInTheDocument(); // Moon glyph, chart-driven (not a fixed icon)
    expect(screen.getByText(sampleFocus.lead.en)).toBeInTheDocument();
    expect(screen.getByText("At Thingaloor temple, offer rice, milk.")).toBeInTheDocument();
    expect(screen.getByText("Feed a young mother and her child.")).toBeInTheDocument();
    expect(screen.getByText("Sponsor a girl child's schooling.")).toBeInTheDocument();
    // Weekday chip is chart-driven, not hardcoded.
    expect(screen.getByText(/Best on/)).toHaveTextContent("Monday");
  });

  it("hides the 'Why this?' explanation until the toggle is clicked", () => {
    renderRemedy();
    expect(screen.queryByText(sampleFocus.why.en)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Why this\?/));
    expect(screen.getByText(sampleFocus.why.en)).toBeInTheDocument();
  });

  it("fires the reminder and more-remedies callbacks", () => {
    const { onSaveReminder, onGoToLifeAreas } = renderRemedy();
    fireEvent.click(screen.getByText("Turn on reminders"));
    expect(onSaveReminder).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("More remedies"));
    expect(onGoToLifeAreas).toHaveBeenCalledTimes(1);
  });

  it("falls back to the flat remedy string when no structured focus is present", () => {
    renderRemedy({ remedyFocus: null });
    expect(screen.getByText("Flat fallback remedy.")).toBeInTheDocument();
    // No structured chrome without a focus.
    expect(screen.queryByText("Moon Dasa")).not.toBeInTheDocument();
    expect(screen.queryByText(/Why this\?/)).not.toBeInTheDocument();
  });

  it("renders the Tamil lead only (no English echo) when lang='ta'", () => {
    renderRemedy({ lang: "ta" });
    expect(screen.getByText(sampleFocus.lead.ta)).toBeInTheDocument();
    expect(screen.queryByText(sampleFocus.lead.en)).not.toBeInTheDocument();
  });
});
