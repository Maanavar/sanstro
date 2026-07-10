/**
 * Coverage for the personalised Yogam Explore screens — before this file
 * existed, the Yogam hub tile only opened the chart-independent library
 * viewer with no "present in your chart" framing, unlike Nakshatram/Dosham.
 * Mirrors dashboard-explore-dosham-nova.test.tsx's coverage: the list shows
 * real per-yoga status, the detail screen shows real "present in your
 * chart" framing and family comparison, and the "Full yogam guide" card
 * renders real marketing-grade text for a yoga that has one (Gaja Kesari)
 * and stays absent for one that doesn't (Parivartana).
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardExploreYogamNova, DashboardExploreYogamListNova } from "./dashboard-explore-yogam-nova";
import type { ChartYogaInsight } from "@/lib/types";
import type { MemberChart } from "@/hooks/useFamilyData";

function makeYoga(overrides: Partial<ChartYogaInsight>): ChartYogaInsight {
  return {
    name: "GAJA_KESARI_YOGA",
    isPresent: true,
    strength: "STRONG",
    conditionsMet: ["jupiter_in_kendra_from_moon"],
    cancellationFactors: [],
    dashaActivated: false,
    activationScore: 62,
    isCurrentlyActive: false,
    descriptionTa: "",
    descriptionEn: "",
    ...overrides,
  };
}

function makeMember(overrides: Partial<MemberChart>): MemberChart {
  return {
    memberId: "member-1",
    displayName: "Amma",
    chart: { yogas: [], doshams: [] } as unknown as MemberChart["chart"],
    explanation: null,
    summary: null,
    transit: null,
    sani: null,
    peyarchiUpcoming: [],
    dailyGuidance: null,
    weekAhead: null,
    dasha: null,
    dashaMaha: null,
    dashaAntar: [],
    nakshatraCard: null,
    ...overrides,
  };
}

const noop = () => {};

describe("DashboardExploreYogamListNova", () => {
  it("shows every yoga with real present/absent and strength badges", () => {
    const yogas = [
      makeYoga({ name: "GAJA_KESARI_YOGA", isPresent: true, strength: "STRONG" }),
      makeYoga({ name: "PARIVARTANA_YOGA", isPresent: false, strength: "WEAK" }),
    ];
    render(<DashboardExploreYogamListNova lang="en" yogas={yogas} onSelect={noop} onBack={noop} />);

    expect(screen.getByText("All yogas")).toBeInTheDocument();
    expect(screen.getByText("Gaja Kesari Yoga")).toBeInTheDocument();
    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.getByText("Parivartana Yoga")).toBeInTheDocument();
    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.getByText("Absent")).toBeInTheDocument();
  });
});

describe("DashboardExploreYogamNova — personalised detail + Full yogam guide", () => {
  it("renders 'present in your chart' framing, real why-text, and the full guide with real section text for Gaja Kesari", () => {
    const gajaKesari = makeYoga({ name: "GAJA_KESARI_YOGA", isPresent: true, strength: "STRONG" });
    render(
      <DashboardExploreYogamNova
        lang="en"
        yogas={[gajaKesari]}
        initialIndex={0}
        memberCharts={[]}
        onBack={noop}
        onOpenAskVinaadi={noop}
        onNavigateToday={noop}
      />,
    );

    expect(screen.getByText(/Present in your chart · Strong/)).toBeInTheDocument();
    expect(screen.getByText(/Triggered because: Jupiter is in a kendra from the Moon/)).toBeInTheDocument();

    expect(screen.getByText("Full yogam guide")).toBeInTheDocument();
    expect(screen.getByText(/Gaja Kesari Yogam forms when Jupiter sits in a kendra/)).toBeInTheDocument();

    // "What it can bring" is both a guide section heading and the separate
    // categorised bringCards toggle — the categorised one is rendered last.
    const bringToggles = screen.getAllByText("What it can bring");
    fireEvent.click(bringToggles[bringToggles.length - 1]);
    expect(screen.getByText("A lasting, trusted reputation in the community")).toBeInTheDocument();

    expect(screen.getByText("How to strengthen this")).toBeInTheDocument();
    expect(screen.getByText(/Jupiter worship on Thursdays/)).toBeInTheDocument();
  });

  it("renders 'not present' framing and no Full yogam guide card for an absent yoga with no rich guide (Parivartana)", () => {
    const parivartana = makeYoga({ name: "PARIVARTANA_YOGA", isPresent: false, strength: "WEAK", conditionsMet: [], activationScore: 0 });
    render(
      <DashboardExploreYogamNova
        lang="en"
        yogas={[parivartana]}
        initialIndex={0}
        memberCharts={[]}
        onBack={noop}
        onOpenAskVinaadi={noop}
        onNavigateToday={noop}
      />,
    );

    expect(screen.getByText("Not present in your chart")).toBeInTheDocument();
    expect(screen.queryByText("Full yogam guide")).not.toBeInTheDocument();
    expect(screen.queryByText("How to strengthen this")).not.toBeInTheDocument();
  });

  it("shows family comparison rows from memberCharts.chart.yogas", () => {
    const gajaKesari = makeYoga({ name: "GAJA_KESARI_YOGA", isPresent: true, strength: "STRONG" });
    const member = makeMember({
      memberId: "m1",
      displayName: "Amma",
      chart: { yogas: [makeYoga({ name: "GAJA_KESARI_YOGA", isPresent: false, strength: "WEAK" })], doshams: [] } as unknown as MemberChart["chart"],
    });
    render(
      <DashboardExploreYogamNova
        lang="en"
        yogas={[gajaKesari]}
        initialIndex={0}
        memberCharts={[member]}
        onBack={noop}
        onOpenAskVinaadi={noop}
        onNavigateToday={noop}
      />,
    );

    expect(screen.getByText("Check your family")).toBeInTheDocument();
    expect(screen.getByText("Amma")).toBeInTheDocument();
    // "You" row shows Present; Amma's row shows Absent — both real values, not placeholder text.
    expect(screen.getAllByText("Present").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Absent").length).toBeGreaterThan(0);
  });

  it("renders the guide in Tamil when lang=ta", () => {
    const gajaKesari = makeYoga({ name: "GAJA_KESARI_YOGA", isPresent: true, strength: "STRONG" });
    render(
      <DashboardExploreYogamNova
        lang="ta"
        yogas={[gajaKesari]}
        initialIndex={0}
        memberCharts={[]}
        onBack={noop}
        onOpenAskVinaadi={noop}
        onNavigateToday={noop}
      />,
    );

    expect(screen.getByText("முழுமையான யோக வழிகாட்டி")).toBeInTheDocument();
    // Unique to the full guide's own body text, not the hero's short blurb.
    expect(screen.getByText(/யானையும் சிங்கமும்/)).toBeInTheDocument();
  });
});
