/**
 * dashaSentiment doctrine test (F2 fix) — the "Dasa chapter" glance tile must
 * read the current antardasha lord's sentiment off the chart's Lagna-dependent
 * functionalNature map, matching the doctrine used everywhere else (dasha
 * service, daily-guidance modifiers, remedies, adhipathi report), not a
 * hardcoded natural benefic/malefic split.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChartSummaryData, FamilyAggregateData, FamilyAggregateMember, LifeAreaData, RemedyFocus } from "@/lib/types";

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

/**
 * The Life Areas tiles sit directly beside the "Is today okay for…?" muhurtam
 * board, and the two answer different questions on different clocks — this
 * tile is a standing outlook over the running dasha and slow transits
 * (measured: it moves on ~9% of days), the board is about today alone. These
 * tests hold the three things that keep the pair from reading as one
 * contradictory verdict.
 */
function lifeArea(overrides: Partial<LifeAreaData>): LifeAreaData {
  return {
    area: "HEALTH",
    label: { ta: "உடல்நலம்", en: "Health" },
    score: 45,
    trend: "STABLE",
    score6mo: 45,
    confidence: "MEDIUM",
    confidenceReason: { ta: "", en: "" },
    primaryHouseStrength: "NEUTRAL",
    karakaStatus: "MODERATE",
    dashaActivation: false,
    transitSupport: 50,
    supportingFactors: [],
    blockingFactors: [],
    driver: { planet: "SUN", reason: { ta: "", en: "" } },
    narrative: { ta: "", en: "" },
    remedy: { ta: "", en: "" },
    next30DayOutlook: { ta: "", en: "" },
    caution: null,
    isGoalFocus: false,
    ...overrides,
  } as LifeAreaData;
}

function renderLifeAreas(areas: LifeAreaData[], lang: "ta" | "en" = "en") {
  return render(
    <DashboardTodayLifeAreasDasaRowNova
      lang={lang}
      personalChartSummary={null}
      dasha={null}
      dashaAntar={[]}
      selectedDate="2026-08-13"
      lifeAreas={{ chartId: "chart-1", dateLocal: "2026-08-13", areas }}
    />,
  );
}

describe("Life Areas tiles — a period outlook, not a verdict on today", () => {
  it("never captions a life-area score with a day word", () => {
    renderLifeAreas([
      lifeArea({ area: "CAREER", label: { ta: "தொழில்", en: "Career" }, score: 54 }),
      lifeArea({ area: "MONEY", label: { ta: "பணம்", en: "Money" }, score: 16 }),
      lifeArea({ area: "SPIRITUAL", label: { ta: "ஆன்மீகம்", en: "Spiritual" }, score: 82 }),
    ]);
    // "An okay day" / "Good day" / "Take care" belong to the DAILY ladder and
    // put today's clock on a months-long number.
    for (const daily of ["An okay day", "Good day", "Take care", "strong day"]) {
      expect(screen.queryByText(daily)).not.toBeInTheDocument();
    }
    expect(screen.getByText("Mixed period")).toBeInTheDocument();
    expect(screen.getByText("Needs care")).toBeInTheDocument();
    expect(screen.getByText("Excellent period")).toBeInTheDocument();
  });

  it("reads 45 the way the engine's own detail text does", () => {
    // The engine bands at 45 ("moderate and steady"); the daily palette bands
    // at 50. Borrowing the daily one made this tile say "Take care" while the
    // area's own detail text said "moderate and steady (45/100)".
    renderLifeAreas([lifeArea({ score: 45 })]);
    expect(screen.getByText("Mixed period")).toBeInTheDocument();
  });

  it("names Chandrashtamam on the tile it is docking", () => {
    // Otherwise this tile silently drops 8 points for ~2 days and can cross a
    // verdict boundary overnight with nothing on screen accounting for it.
    renderLifeAreas([
      lifeArea({ area: "HEALTH", score: 45, chandrashtamaApplied: true }),
      lifeArea({ area: "CAREER", label: { ta: "தொழில்", en: "Career" }, score: 54 }),
    ]);
    expect(screen.getByText(/Chandrashtama/)).toBeInTheDocument();
    // Only the docked area is marked — Career never takes the penalty.
    expect(screen.getAllByText(/Chandrashtama/)).toHaveLength(1);
  });

  it("leaves the tile unmarked when Chandrashtamam is not applied", () => {
    renderLifeAreas([lifeArea({ score: 53, chandrashtamaApplied: false })]);
    expect(screen.queryByText(/Chandrashtama/)).not.toBeInTheDocument();
  });

  it("gives the trend arrow an accessible name stating its horizon", () => {
    // The arrow was aria-hidden with no text anywhere, so it said nothing at
    // all to a screen reader — and what it did say visually was wrong.
    renderLifeAreas([lifeArea({ score: 54, trend: "UP", score6mo: 66 })]);
    expect(screen.getByLabelText("improving over the next 6 months")).toBeInTheDocument();
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
      onOpenNumerology: vi.fn(),
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
      "Best Days This Month", "Numerology", "Journal", "Explore & Learn",
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

  it("disables the chart-dependent tiles (Compatibility, Activity Timing, Numerology) when needsProfile is true", () => {
    const callbacks = renderLinks({ needsProfile: true });
    fireEvent.click(screen.getByText("Compatibility"));
    fireEvent.click(screen.getByText("Best Days This Month"));
    fireEvent.click(screen.getByText("Numerology"));
    expect(callbacks.onOpenCompatibility).not.toHaveBeenCalled();
    expect(callbacks.onOpenActivityTiming).not.toHaveBeenCalled();
    expect(callbacks.onOpenNumerology).not.toHaveBeenCalled();
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

  it("switches the member rail to another family member's chart-specific remedy", () => {
    const saturnFocus: RemedyFocus = {
      ...sampleFocus,
      planet: "SATURN",
      weekday: "SATURDAY",
      lead: { en: "Saturn rules Appa's running dasa and calls for steadiness.", ta: "சனி அப்பாவின் தசையை ஆள்கிறது." },
      why: { en: "Appa is in Saturn mahadasa.", ta: "அப்பாவுக்கு சனி மகாதசை." },
      actions: [
        { text: { en: "Light a sesame oil lamp on Saturday.", ta: "சனிக்கிழமை எள் எண்ணெய் தீபம் ஏற்றுங்கள்." }, kind: "TEMPLE", cadence: "RITUAL_ON_DAY" },
      ],
    };

    renderRemedy({
      remedyMembers: [
        { memberId: "owner", displayName: "You", remedy: { en: "Owner fallback.", ta: "உங்கள் பரிகாரம்." }, remedyFocus: sampleFocus },
        { memberId: "appa", displayName: "Appa", remedy: { en: "Appa fallback.", ta: "அப்பா பரிகாரம்." }, remedyFocus: saturnFocus },
      ],
    });

    // One control, not three: the range input and its ‹ › arrows are gone.
    expect(screen.queryByLabelText("Family member remedy slider")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Appa/ }));

    expect(screen.getByRole("tab", { name: /Appa/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Saturn Dasa")).toBeInTheDocument();
    expect(screen.getByText(saturnFocus.lead.en)).toBeInTheDocument();
    expect(screen.getByText("Light a sesame oil lamp on Saturday.")).toBeInTheDocument();
    expect(screen.queryByText(sampleFocus.lead.en)).not.toBeInTheDocument();
  });

  it("keeps the rail on the arrow-key contract its role promises", () => {
    renderRemedy({
      remedyMembers: [
        { memberId: "owner", displayName: "You", remedy: null, remedyFocus: sampleFocus },
        { memberId: "appa", displayName: "Appa", remedy: null, remedyFocus: sampleFocus },
      ],
    });

    fireEvent.keyDown(screen.getByRole("tab", { name: /You/ }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: /Appa/ })).toHaveAttribute("aria-selected", "true");
    // Roving tabindex: only the selected chip is in the tab order.
    expect(screen.getByRole("tab", { name: /Appa/ })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: /You/ })).toHaveAttribute("tabindex", "-1");
  });

  it("stops claiming 'for you' while another member's remedy is on screen", () => {
    renderRemedy({
      remedyMembers: [
        { memberId: "owner", displayName: "Priya Kumar", remedy: null, remedyFocus: sampleFocus },
        { memberId: "appa", displayName: "Raja Kumar", remedy: null, remedyFocus: sampleFocus },
      ],
    });

    expect(screen.getByText("Remedy for you")).toBeInTheDocument();
    // Chips carry the called name only — the full name is never re-spelt, it
    // just moves to the heading and the chip's title.
    expect(screen.getByRole("tab", { name: /Priya/ })).toHaveAttribute("title", "Priya Kumar");

    fireEvent.click(screen.getByRole("tab", { name: /Raja/ }));

    expect(screen.getByText("Raja Kumar · Remedy")).toBeInTheDocument();
    expect(screen.queryByText("Remedy for you")).not.toBeInTheDocument();
    // The morning-alert toggle is the account owner's; it does not ride along
    // under a sibling's remedy.
    expect(screen.queryByText("Turn on reminders")).not.toBeInTheDocument();
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

/**
 * Family Today card — a member's Chandrashtama must be named on the tile, the
 * way the owner's own is named on the Today hero. Before this, the tile showed
 * only a score ring and a verdict word, so the one member in Chandrashtama was
 * indistinguishable from anyone else on a similar score.
 */
describe("Family Today card — member Chandrashtama", () => {
  function member(overrides: Partial<FamilyAggregateMember> & { familyMemberId: string }): FamilyAggregateMember {
    return {
      displayName: "Member",
      birthProfileId: `bp-${overrides.familyMemberId}`,
      chartId: `chart-${overrides.familyMemberId}`,
      individualScore: 62,
      label: "NORMAL_DAY",
      memberWeight: 1,
      birthTimeConfidenceMinutes: 0,
      activeCycleTags: [],
      bestWindows: [],
      cautionWindows: [],
      ...overrides,
    };
  }

  function renderFamily(members: FamilyAggregateMember[], lang: "en" | "ta" = "en") {
    const aggregate = {
      familyVaultId: "v-1",
      dateLocal: "2026-08-13",
      timezone: "Asia/Kolkata",
      familyScore: 58,
      familyLabel: "SUPPORTIVE_MIXED",
      members,
      aggregateBreakdown: {
        weightedMean: 58, meanScore: 58, lowestScore: 40, highestScore: 70, totalWeight: 2,
        lowScoreCount: 0, chandrashtamaCount: 1, majorSaniCount: 0, healthPreventiveNudgeCount: 0,
        supportNeedIndex: 0, decisionReadinessIndex: 0, commonGoodWindowBonus: 0,
        rahuYamaOverlapPenalty: 0, keyMemberLowScorePenalty: 0,
      },
      bestFamilyWindows: [],
      avoidForFamilyDecisions: [],
      summary: { en: "A mixed day.", ta: "கலப்பான நாள்." },
    } satisfies FamilyAggregateData;

    render(
      <DashboardTodayFamilyRemedyRowNova
        lang={lang}
        familyAggregate={aggregate}
        remedy={null}
        remedyFocus={null}
        savingReminder={false}
        reminderMessage={null}
        onSaveReminder={vi.fn()}
      />,
    );
  }

  // The owner row is the one whose familyMemberId === birthProfileId; it is
  // dropped from the tiles, so every fixture below needs a distinct pair.
  const owner = member({ familyMemberId: "owner", birthProfileId: "owner", displayName: "Owner" });

  it("names Chandrashtama on the tile of the member who has it, and only that member", () => {
    renderFamily([
      owner,
      member({ familyMemberId: "m1", displayName: "Amma", activeCycleTags: ["NORMAL_DAY", "CHANDRASHTAMA"] }),
      member({ familyMemberId: "m2", displayName: "Appa", activeCycleTags: ["NORMAL_DAY"] }),
    ]);
    // Exactly one tile carries the chip — the callout line below the tiles
    // names Amma too, which is why this matches the chip's own text exactly.
    expect(screen.getAllByText(/^🌘 Chandrashtama$/)).toHaveLength(1);
    expect(screen.getByRole("group", { name: /Amma.*Chandrashtama/ })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Appa.*Chandrashtama/ })).not.toBeInTheDocument();
  });

  it("says nothing about Chandrashtama when no member has the tag", () => {
    renderFamily([
      owner,
      member({ familyMemberId: "m1", displayName: "Amma", activeCycleTags: ["NORMAL_DAY"] }),
    ]);
    expect(screen.queryByText(/Chandrashtama/)).not.toBeInTheDocument();
  });

  it("calls out a Chandrashtama member whose score is too healthy for the low-band search", () => {
    // The regression this guards: the callout line only ever looked for a
    // low-score member, so a mid-score member in Chandrashtama went unnamed.
    renderFamily([
      owner,
      member({ familyMemberId: "m1", displayName: "Amma", individualScore: 68, activeCycleTags: ["CHANDRASHTAMA"] }),
    ]);
    expect(screen.getByText(/Chandrashtama today/)).toBeInTheDocument();
    expect(screen.queryByText(/gentle day/)).not.toBeInTheDocument();
  });

  it("keeps the plain 'gentle day' wording for a low score with no Chandrashtama", () => {
    renderFamily([
      owner,
      member({ familyMemberId: "m1", displayName: "Amma", individualScore: 31, activeCycleTags: ["AVOID_NEW_START_DAY"] }),
    ]);
    expect(screen.getByText(/gentle day/)).toBeInTheDocument();
    expect(screen.queryByText(/Chandrashtama/)).not.toBeInTheDocument();
  });

  it("names it in Tamil only (no English echo) when lang='ta'", () => {
    renderFamily([
      owner,
      member({ familyMemberId: "m1", displayName: "அம்மா", activeCycleTags: ["CHANDRASHTAMA"] }),
    ], "ta");
    expect(screen.getAllByText(/சந்திராஷ்டமம்/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Chandrashtama/)).not.toBeInTheDocument();
  });
});
