/**
 * Smoke test for the "Full dosham guide" card added to the signed-in
 * Dosham detail screen — verifies it actually renders real marketing-grade
 * text (not blank/undefined) for a dosham that has one (Sevvai), and stays
 * absent for a dosham type with no rich guide yet (Rahu-Ketu), rather than
 * rendering an empty or broken card.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardExploreDoshamNova } from "./dashboard-explore-dosham-nova";
import type { ChartDoshamInsight } from "@/lib/types";

function makeDosham(overrides: Partial<ChartDoshamInsight>): ChartDoshamInsight {
  return {
    name: "SEVVAI_DOSHAM",
    isPresent: true,
    isCancelled: false,
    strength: "PARTIAL",
    label: "Sevvai Dosham",
    category: "MARRIAGE",
    conditionsMet: ["from_lagna"],
    cancellationFactors: [],
    missingData: [],
    dashaActivated: false,
    descriptionTa: "",
    descriptionEn: "",
    explanationWhatTa: "",
    explanationWhatEn: "Mars sits in a marriage-sensitive house.",
    explanationWhyTa: "",
    explanationWhyEn: "",
    explanationHowTa: "",
    explanationHowEn: "",
    ...overrides,
  };
}

const noop = () => {};

describe("DashboardExploreDoshamNova — Full dosham guide", () => {
  it("renders the full guide with real section text for Sevvai Dosham", () => {
    const sevvai = makeDosham({ name: "SEVVAI_DOSHAM" });
    render(
      <DashboardExploreDoshamNova
        lang="en"
        doshams={[sevvai]}
        initialIndex={0}
        memberCharts={[]}
        onBack={noop}
        onOpenAskVinaadi={noop}
        onNavigateToday={noop}
      />,
    );

    expect(screen.getByText("Full dosham guide")).toBeInTheDocument();

    // First section is defaultOpen — its real marketing copy should be visible immediately.
    expect(screen.getByText("What Sevvai dosham means")).toBeInTheDocument();
    expect(screen.getByText(/Mars \(Chevvai \/ Mangal\) is the planet of energy/)).toBeInTheDocument();

    // Later sections start collapsed — expand one and check its real content appears.
    fireEvent.click(screen.getByText("How Sevvai dosham is calculated"));
    expect(screen.getByText(/Sevvai dosham is present when Mars occupies/)).toBeInTheDocument();

    // "What it can bring" categories and FAQ are nested collapsibles too.
    fireEvent.click(screen.getByText("What it can bring"));
    expect(screen.getByText("Psychological & Emotional")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Frequently asked questions"));
    expect(screen.getByText("Can two people who both have Sevvai dosham marry each other?")).toBeInTheDocument();
  });

  it("renders the full guide with real section text for Rahu-Ketu Dosham (added as a draft, 2026-07)", () => {
    const rahuKetu = makeDosham({ name: "RAHU_KETU_DOSHAM", category: "NODES" });
    render(
      <DashboardExploreDoshamNova
        lang="en"
        doshams={[rahuKetu]}
        initialIndex={0}
        memberCharts={[]}
        onBack={noop}
        onOpenAskVinaadi={noop}
        onNavigateToday={noop}
      />,
    );

    expect(screen.getByText("Full dosham guide")).toBeInTheDocument();
    expect(screen.getByText(/Rahu or Ketu occupies a marriage-sensitive house/)).toBeInTheDocument();
  });

  it("renders the guide in Tamil when lang=ta", () => {
    const sevvai = makeDosham({ name: "SEVVAI_DOSHAM" });
    render(
      <DashboardExploreDoshamNova
        lang="ta"
        doshams={[sevvai]}
        initialIndex={0}
        memberCharts={[]}
        onBack={noop}
        onOpenAskVinaadi={noop}
        onNavigateToday={noop}
      />,
    );

    expect(screen.getByText("முழுமையான தோஷ வழிகாட்டி")).toBeInTheDocument();
    expect(screen.getByText("செவ்வாய் தோஷம் என்றால் என்ன")).toBeInTheDocument();
  });
});
