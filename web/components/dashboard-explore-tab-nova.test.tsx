/**
 * Coverage for the Explore hub's list-first navigation — hub tiles used to
 * jump straight into ONE item's detail screen (own star / own active
 * dosham / a hardcoded slug) with no way to scan the full set first. Now
 * every kind (Nakshatram/Dosham/Yogam) shows an index "list" screen between
 * the hub and the existing detail screen, and "back" from detail returns to
 * that list rather than all the way to the hub. Verifies real rendered text
 * at each step, not just that a handler fired.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type {
  ChartCalculateResponseData,
  ChartDoshamInsight,
  ChartSummaryData,
  ChartYogaInsight,
  NakshatraCardData,
} from "@/lib/types";
import { NATCHATHIRAM_LIST } from "@/lib/natchathiram-data";

vi.mock("@/lib/api", () => ({
  apiFetchJson: vi.fn(async (path: string) => {
    const match = path.match(/\/content\/nakshatra\/(\d+)/);
    const number = match ? Number(match[1]) : 1;
    const entry = NATCHATHIRAM_LIST.find((n) => n.number === number)!;
    const card: NakshatraCardData = {
      number,
      nameTa: entry.name_ta,
      nameEn: entry.name_en,
      deityTa: "", deityEn: "",
      symbolTa: "", symbolEn: "",
      rulingPlanet: "KETU",
      profile: { ta: "சுருக்கம்.", en: "A short profile." },
      strengths: [],
      cautions: [],
      compatibleGroups: [],
      ganam: { ta: "", en: "" },
      yoni: { ta: "", en: "" },
    };
    return { success: true, data: card };
  }),
}));

import { DashboardExploreTabNova } from "./dashboard-explore-tab-nova";

function renderWithQueryClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const noop = () => {};

function makeDosham(overrides: Partial<ChartDoshamInsight>): ChartDoshamInsight {
  return {
    name: "SEVVAI_DOSHAM",
    isPresent: true,
    isCancelled: false,
    strength: "PARTIAL",
    label: "Sevvai Dosham",
    category: "MARRIAGE",
    conditionsMet: [],
    cancellationFactors: [],
    missingData: [],
    dashaActivated: false,
    descriptionTa: "",
    descriptionEn: "Mars sits in a marriage-sensitive house.",
    explanationWhatTa: "",
    explanationWhatEn: "",
    explanationWhyTa: "",
    explanationWhyEn: "",
    explanationHowTa: "",
    explanationHowEn: "",
    ...overrides,
  };
}

function makeYoga(overrides: Partial<ChartYogaInsight>): ChartYogaInsight {
  return {
    name: "GAJA_KESARI_YOGA",
    isPresent: true,
    strength: "STRONG",
    conditionsMet: [],
    cancellationFactors: [],
    dashaActivated: false,
    activationScore: 0,
    isCurrentlyActive: false,
    descriptionTa: "",
    descriptionEn: "",
    ...overrides,
  };
}

const personalChartSummary: ChartSummaryData = {
  chartId: "test-chart-1",
  displayName: "Test User",
  currentAge: 30,
  lagnaRasi: "Mesham",
  moonRasi: "Mesham",
  janmaNakshatra: "Aswini",
  janmaPada: 2,
  currentMahadasha: "KETU",
  currentAntardasha: "KETU",
  primaryLanguageText: { ta: "", en: "" },
};

const ownNakshatraCard: NakshatraCardData = {
  number: 1,
  nameTa: NATCHATHIRAM_LIST[0].name_ta,
  nameEn: NATCHATHIRAM_LIST[0].name_en,
  deityTa: "", deityEn: "",
  symbolTa: "", symbolEn: "",
  rulingPlanet: "KETU",
  profile: { ta: "சுருக்கம்.", en: "A short profile." },
  strengths: [],
  cautions: [],
  compatibleGroups: [],
  ganam: { ta: "", en: "" },
  yoni: { ta: "", en: "" },
};

function baseProps() {
  return {
    lang: "en" as const,
    personalChartSummary,
    personalChart: { doshams: [] } as unknown as ChartCalculateResponseData,
    personalDailyGuidance: null,
    nakshatraCard: ownNakshatraCard,
    memberCharts: [],
    onNavigate: noop,
    onOpenAskVinaadi: noop,
  };
}

describe("DashboardExploreTabNova — Nakshatram list-first navigation", () => {
  it("hub tile opens the list (not the detail), selecting a star opens its detail, and back returns to the list", async () => {
    renderWithQueryClient(<DashboardExploreTabNova {...baseProps()} />);

    fireEvent.click(screen.getByText("Natchathiram"));

    // List screen: shows the "all stars" index label, not a single star's detail.
    expect(screen.getByText("All 27 stars")).toBeInTheDocument();
    expect(screen.getByText(NATCHATHIRAM_LIST[1].name_en)).toBeInTheDocument();

    // Pick a star other than the user's own (Bharani, number 2).
    fireEvent.click(screen.getByText(NATCHATHIRAM_LIST[1].name_en));

    // List is gone immediately (subview switched synchronously); the detail
    // screen's own data fetch resolves a tick later.
    expect(screen.queryByText("All 27 stars")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(NATCHATHIRAM_LIST[1].name_en).length).toBeGreaterThan(0);
    });

    // Back from detail returns to the list, not the Explore hub.
    fireEvent.click(screen.getByText("Explore"));
    expect(screen.getByText("All 27 stars")).toBeInTheDocument();
  });

  it("the 'Start from your chart' shortcut jumps straight to the detail screen, and back still returns to the list", async () => {
    renderWithQueryClient(<DashboardExploreTabNova {...baseProps()} />);

    fireEvent.click(screen.getByText("Read your full star profile →"));

    expect(screen.queryByText("All 27 stars")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(NATCHATHIRAM_LIST[0].name_en).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByText("Explore"));
    expect(screen.getByText("All 27 stars")).toBeInTheDocument();
  });
});

describe("DashboardExploreTabNova — Dosham list-first navigation", () => {
  function propsWithDoshams() {
    const doshams = [
      makeDosham({ name: "SEVVAI_DOSHAM", isPresent: true, isCancelled: false }),
      makeDosham({ name: "RAHU_KETU_DOSHAM", category: "NODES", isPresent: false }),
    ];
    return {
      ...baseProps(),
      personalChart: { doshams } as unknown as ChartCalculateResponseData,
    };
  }

  it("hub tile opens the list (not the detail) with real status badges, selecting a dosham opens its detail, and back returns to the list", () => {
    renderWithQueryClient(<DashboardExploreTabNova {...propsWithDoshams()} />);

    fireEvent.click(screen.getByText("Dosham"));

    expect(screen.getByText("All doshams")).toBeInTheDocument();
    expect(screen.getByText("Sevvai Dosham")).toBeInTheDocument();
    expect(screen.getByText("Rahu-Ketu Dosham")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Absent")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Rahu-Ketu Dosham"));

    expect(screen.queryByText("All doshams")).not.toBeInTheDocument();
    expect(screen.getByText("Not present in your chart")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Explore"));
    expect(screen.getByText("All doshams")).toBeInTheDocument();
  });
});

describe("DashboardExploreTabNova — Yogam list-first navigation", () => {
  function propsWithYogas() {
    const yogas = [
      makeYoga({ name: "GAJA_KESARI_YOGA", isPresent: true, strength: "STRONG" }),
      makeYoga({ name: "PARIVARTANA_YOGA", isPresent: false, strength: "WEAK" }),
    ];
    return {
      ...baseProps(),
      personalChart: { doshams: [], yogas } as unknown as ChartCalculateResponseData,
    };
  }

  it("hub tile opens the list (not the detail) with real status badges, selecting a yoga opens its personalised detail, and back returns to the list", () => {
    renderWithQueryClient(<DashboardExploreTabNova {...propsWithYogas()} />);

    fireEvent.click(screen.getByText("Yogam"));

    expect(screen.getByText("All yogas")).toBeInTheDocument();
    expect(screen.getByText("Gaja Kesari Yoga")).toBeInTheDocument();
    expect(screen.getByText("Parivartana Yoga")).toBeInTheDocument();
    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.getByText("Absent")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Parivartana Yoga"));

    expect(screen.queryByText("All yogas")).not.toBeInTheDocument();
    expect(screen.getByText("Not present in your chart")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Explore"));
    expect(screen.getByText("All yogas")).toBeInTheDocument();
  });

  it("the 'Start from your chart' Yogam shortcut jumps straight to the strongest present yoga's detail", () => {
    renderWithQueryClient(<DashboardExploreTabNova {...propsWithYogas()} />);

    fireEvent.click(screen.getByText("Present in your chart"));

    expect(screen.queryByText("All yogas")).not.toBeInTheDocument();
    expect(screen.getAllByText("Gaja Kesari Yoga").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Explore"));
    expect(screen.getByText("All yogas")).toBeInTheDocument();
  });
});
