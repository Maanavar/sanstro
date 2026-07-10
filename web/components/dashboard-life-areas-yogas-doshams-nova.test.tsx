/**
 * Smoke test for the nested "Full dosham guide"/"Full yogam guide"
 * collapsibles added inside the Life Areas Yoga/Dosham accordion — verifies
 * expanding a row that has a rich guide (Sevvai, Badhaka, Gaja Kesari)
 * reveals real marketing-grade text once both the row and the nested guide
 * toggle are opened, and that a yoga type with no guide yet (Parivartana)
 * shows no such toggle at all.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NovaYogaDoshamPanel } from "./dashboard-life-areas-yogas-doshams-nova";
import type { ChartDoshamInsight, ChartYogaInsight } from "@/lib/types";

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

describe("NovaYogaDoshamPanel — nested Full dosham guide", () => {
  it("reveals real guide text for Sevvai Dosham once the row and the nested guide are both expanded", () => {
    const sevvai = makeDosham({ name: "SEVVAI_DOSHAM" });
    render(<NovaYogaDoshamPanel lang="en" yogas={[]} doshams={[sevvai]} />);

    // Row starts collapsed — nested guide toggle shouldn't exist yet.
    expect(screen.queryByText("Full dosham guide")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Sevvai Dosham"));
    expect(screen.getByText("Full dosham guide")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Full dosham guide"));
    expect(screen.getByText(/Mars \(Chevvai \/ Mangal\) is the planet of energy/)).toBeInTheDocument();
    expect(screen.getByText("What it can bring")).toBeInTheDocument();
  });

  it("reveals real guide text for Badhaka Dosham once the row and the nested guide are both expanded (added as a draft, 2026-07)", () => {
    const badhaka = makeDosham({ name: "BADHAKA_DOSHAM", category: "OBSTACLES" });
    render(<NovaYogaDoshamPanel lang="en" yogas={[]} doshams={[badhaka]} />);

    fireEvent.click(screen.getByText("Badhaka Dosham"));
    expect(screen.getByText("Full dosham guide")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Full dosham guide"));
    expect(screen.getByText(/every Lagna has one 'badhaka' \(obstruction\) house/)).toBeInTheDocument();
  });
});

describe("NovaYogaDoshamPanel — nested Full yogam guide", () => {
  it("reveals real guide text for Gaja Kesari Yogam once the row and the nested guide are both expanded", () => {
    const gajaKesari = makeYoga({ name: "GAJA_KESARI_YOGA" });
    render(<NovaYogaDoshamPanel lang="en" yogas={[gajaKesari]} doshams={[]} />);

    // Row starts collapsed — nested guide toggle shouldn't exist yet.
    expect(screen.queryByText("Full yogam guide")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Gaja Kesari Yoga"));
    expect(screen.getByText("Full yogam guide")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Full yogam guide"));
    expect(screen.getByText(/Gaja Kesari Yogam forms when Jupiter sits in a kendra/)).toBeInTheDocument();
    expect(screen.getByText("A lasting, trusted reputation in the community")).toBeInTheDocument();
  });

  it("shows no nested guide toggle for a yoga type with no rich guide (Parivartana)", () => {
    const parivartana = makeYoga({ name: "PARIVARTANA_YOGA" });
    render(<NovaYogaDoshamPanel lang="en" yogas={[parivartana]} doshams={[]} />);

    fireEvent.click(screen.getByText("Parivartana Yoga"));
    expect(screen.queryByText("Full yogam guide")).not.toBeInTheDocument();
  });

  it("renders the yogam guide in Tamil when lang=ta", () => {
    const gajaKesari = makeYoga({ name: "GAJA_KESARI_YOGA" });
    render(<NovaYogaDoshamPanel lang="ta" yogas={[gajaKesari]} doshams={[]} />);

    fireEvent.click(screen.getByText("Gaja Kesari Yoga"));
    fireEvent.click(screen.getByText("முழுமையான யோக வழிகாட்டி"));
    expect(screen.getByText(/சந்திரனிலிருந்து கேந்திரத்தில்/)).toBeInTheDocument();
  });
});
