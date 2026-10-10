import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ChartDoshamInsight } from "@/lib/types";
import { doshamSeverityChip, doshamReferenceRows } from "@vinaadi/shared/doshamReckoning";
import { DoshamReckoningBlock } from "./dosham-reckoning-block";

// Synthetic payload (DD-17): Kumbam lagna, Mars in Mesham — 3rd from the
// Lagna, 7th from a Thulam Moon, 4th from a Magaram Venus. No birth behind it.
function sevvai(overrides: Partial<ChartDoshamInsight> = {}): ChartDoshamInsight {
  return {
    name: "SEVVAI_DOSHAM",
    isPresent: true,
    isCancelled: true,
    strength: "WEAK",
    label: "SEVVAI_DOSHAM_WITH_NIVARTHI",
    category: "MARRIAGE",
    conditionsMet: ["from_moon", "from_venus"],
    cancellationFactors: ["mars_own_sign", "benefic_strong_seventh_lord"],
    missingData: [],
    dashaActivated: false,
    descriptionTa: "",
    descriptionEn: "",
    explanationWhatTa: "",
    explanationWhatEn: "",
    explanationWhyTa: "",
    explanationWhyEn: "",
    explanationHowTa: "",
    explanationHowEn: "",
    formationStrength: "STRONG",
    residual: "MILD",
    contextNotes: ["sevvai_not_from_lagna"],
    referenceHouses: [
      { reference: "LAGNA", referenceRasi: 11, houses: [3], counts: false },
      { reference: "MOON", referenceRasi: 7, houses: [7], counts: true },
      { reference: "VENUS", referenceRasi: 10, houses: [4], counts: true },
    ],
    ...overrides,
  };
}

describe("DoshamReckoningBlock", () => {
  it("shows where the dosham is counted from, what remains, and why it weighs less", () => {
    render(<DoshamReckoningBlock dosham={sevvai()} lang="en" />);
    expect(screen.getByText("Lagna (Kumbam)")).toBeTruthy();
    expect(screen.getByText("Mars in the 3rd — not a dosha house")).toBeTruthy();
    expect(screen.getByText("Mars in the 7th — a dosha house")).toBeTruthy();
    expect(screen.getByText(/Before its protections this placement grades strong\. After them a mild residual influence remains — reduced, not erased\./)).toBeTruthy();
    expect(screen.getByText(/Mars is not in a dosha house from your Lagna/)).toBeTruthy();
  });

  it("speaks Tamil in Tamil mode — rasi names through the localiser, no English leaks", () => {
    const { container } = render(<DoshamReckoningBlock dosham={sevvai()} lang="ta" />);
    expect(screen.getByText("லக்னம் (கும்பம்)")).toBeTruthy();
    expect(screen.getByText("செவ்வாய் 7-ஆம் வீட்டில் — தோஷ வீடு")).toBeTruthy();
    expect(container.textContent).not.toMatch(/Kumbam|Mars|residual|LAGNA/);
  });

  it("renders the node axis rows and the chart-specific meaning", () => {
    const rk = sevvai({
      name: "RAHU_KETU_DOSHAM",
      contextNotes: ["rk_axis_not_repeated_from_moon_venus"],
      referenceHouses: [{ reference: "LAGNA", referenceRasi: 2, houses: [2, 8], counts: true }],
      meaningEn: "Rahu in the 2nd (family, speech, savings): a strong drive to accumulate.",
      meaningTa: "2-ஆம் வீட்டில் ராகு.",
    });
    render(<DoshamReckoningBlock dosham={rk} lang="en" />);
    expect(screen.getByText("Rahu in the 2nd, Ketu in the 8th — on houses 1, 2, 7, 8")).toBeTruthy();
    expect(screen.getByText(/a strong drive to accumulate/)).toBeTruthy();
    expect(screen.getByText(/the nodes do not fall on houses 1, 2, 7 or 8/)).toBeTruthy();
  });

  it("renders nothing for an absent dosham or a payload that predates DD-17", () => {
    const { container: absent } = render(<DoshamReckoningBlock dosham={sevvai({ isPresent: false })} lang="en" />);
    expect(absent.innerHTML).toBe("");
    const legacy = sevvai({ formationStrength: undefined, residual: undefined, contextNotes: undefined, referenceHouses: undefined });
    const { container } = render(<DoshamReckoningBlock dosham={legacy} lang="en" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("doshamSeverityChip", () => {
  it("names the residual for a mitigated dosham instead of 'Low intensity'", () => {
    expect(doshamSeverityChip(sevvai(), "en")).toBe("Residual: mild");
    expect(doshamSeverityChip(sevvai({ residual: "MODERATE" }), "ta")).toBe("மீதத் தாக்கம்: மிதமானது");
    expect(doshamSeverityChip(sevvai({ residual: undefined }), "en")).toBe("Residual: mild");
    expect(doshamSeverityChip(sevvai({ isCancelled: false, strength: "STRONG", residual: "STRONG" }), "en")).toBe("High intensity");
    expect(doshamSeverityChip(sevvai({ isPresent: false }), "en")).toBeNull();
  });

  it("ordinals read naturally", () => {
    const rows = doshamReferenceRows(sevvai({
      referenceHouses: [
        { reference: "MOON", referenceRasi: 1, houses: [11], counts: false },
        { reference: "VENUS", referenceRasi: 1, houses: [12], counts: true },
      ],
    }), "en");
    expect(rows.map((r) => r.detail)).toEqual(["Mars in the 11th — not a dosha house", "Mars in the 12th — a dosha house"]);
  });
});
