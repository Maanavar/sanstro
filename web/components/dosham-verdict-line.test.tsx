import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { ChartDoshamInsight } from "@/lib/types";
import { MITIGATION_PHRASE, doshamVerdictLine } from "@vinaadi/shared/doshamReckoning";
import { DoshamVerdictLine } from "./dosham-verdict-line";
import { NovaYogaDoshamPanel } from "./dashboard-life-areas-yogas-doshams-nova";

// Synthetic payloads (plan 2026-10-06, item 8). No birth behind any of them.
function dosham(overrides: Partial<ChartDoshamInsight>): ChartDoshamInsight {
  return {
    name: "SEVVAI_DOSHAM", isPresent: true, isCancelled: true, strength: "WEAK", label: "SEVVAI_DOSHAM_WITH_NIVARTHI",
    category: "MARRIAGE", conditionsMet: ["from_moon", "from_venus"], cancellationFactors: ["mars_own_sign", "benefic_strong_seventh_lord"],
    missingData: [], dashaActivated: false, descriptionTa: "", descriptionEn: "",
    explanationWhatTa: "", explanationWhatEn: "", explanationWhyTa: "", explanationWhyEn: "", explanationHowTa: "", explanationHowEn: "",
    formationStrength: "STRONG", residual: "MILD", contextNotes: ["sevvai_not_from_lagna"],
    referenceHouses: [
      { reference: "LAGNA", referenceRasi: 11, houses: [3], counts: false },
      { reference: "MOON", referenceRasi: 7, houses: [7], counts: true },
      { reference: "VENUS", referenceRasi: 10, houses: [4], counts: true },
    ],
    ...overrides,
  };
}

const rahuKetu = (overrides: Partial<ChartDoshamInsight> = {}) => dosham({
  name: "RAHU_KETU_DOSHAM", conditionsMet: ["rahu_ketu_axis_2_8"],
  cancellationFactors: ["guru_joins_or_aspects_node", "guru_aspects_seventh_or_its_lord"],
  referenceHouses: [{ reference: "LAGNA", referenceRasi: 2, houses: [8, 2], counts: true }],
  contextNotes: [], formationStrength: "PARTIAL",
  ...overrides,
});

describe("doshamVerdictLine — invariants", () => {
  it("Sevvai: prints exactly the references the engine counted", () => {
    const en = doshamVerdictLine(dosham({}), "en");
    expect(en).toContain("Mars is in a dosha house from your Moon and Venus, not from your Lagna.");
    const fromLagna = doshamVerdictLine(dosham({
      referenceHouses: [
        { reference: "LAGNA", referenceRasi: 1, houses: [7], counts: true },
        { reference: "MOON", referenceRasi: 5, houses: [3], counts: false },
      ],
    }), "en");
    expect(fromLagna).toContain("from your Lagna.");
    expect(fromLagna).not.toMatch(/Moon|not from your Lagna/);
  });

  it("names no protection that took no part in the verdict", () => {
    const d = dosham({ cancellationFactors: ["jupiter_aspects_seventh_lord"] });
    const en = doshamVerdictLine(d, "en");
    for (const [marker, phrase] of Object.entries(MITIGATION_PHRASE)) {
      if (marker === "jupiter_aspects_seventh_lord") expect(en).toContain(phrase.en);
      // "a strong 7th lord" is a substring of nothing else, so absence is checkable.
      else if (marker === "benefic_strong_seventh_lord" || marker === "mars_own_sign") expect(en).not.toContain(phrase.en);
    }
  });

  it("a mitigated dosham always says what remains; an active one says it is not offset", () => {
    expect(doshamVerdictLine(dosham({}), "en")).toMatch(/a mild residual remains\.$/);
    expect(doshamVerdictLine(dosham({ residual: "MODERATE" }), "en")).toMatch(/a moderate residual remains\.$/);
    const active = doshamVerdictLine(dosham({ isCancelled: false, strength: "STRONG", residual: "STRONG", cancellationFactors: [] }), "en");
    expect(active).toContain("No protection in this chart offsets it: strong intensity.");
    expect(active).not.toMatch(/residual|Mitigated/);
  });

  it("Rahu–Ketu: names the actual axis and never reads as erased", () => {
    const en = doshamVerdictLine(rahuKetu(), "en");
    expect(en).toContain("Rahu is in the 8th and Ketu in the 2nd from your Lagna — the 2/8 axis.");
    expect(en).toContain("but the placement itself remains: a mild residual.");
    expect(en).not.toMatch(/dosha house|Moon and Venus/);
  });

  it("is empty for an absent dosham, another dosham, or a pre-DD-17 payload", () => {
    expect(doshamVerdictLine(dosham({ isPresent: false }), "en")).toBe("");
    expect(doshamVerdictLine(dosham({ name: "PITRU_DOSHAM" }), "en")).toBe("");
    expect(doshamVerdictLine(dosham({ referenceHouses: undefined }), "en")).toBe("");
  });

  it("Tamil carries no English words", () => {
    for (const d of [dosham({}), rahuKetu(), dosham({ isCancelled: false, residual: "MODERATE", cancellationFactors: ["mars_own_sign", "house_sign_nivarthi", "jupiter_aspect_on_mars"] })]) {
      const ta = doshamVerdictLine(d, "ta");
      expect(ta.length).toBeGreaterThan(0);
      expect(ta).not.toMatch(/[A-Za-z]/);
    }
  });

  it("caps the list at two named protections", () => {
    const en = doshamVerdictLine(dosham({ cancellationFactors: ["mars_own_sign", "house_sign_nivarthi", "jupiter_aspect_on_mars"] }), "en");
    expect(en).toContain("Mars in its own sign, the house-sign nivarthi and 1 more soften it");
  });
});

describe("See how this was calculated", () => {
  afterEach(() => { window.location.hash = ""; });

  it("requests the exact card, and the card opens itself", async () => {
    const sevvai = dosham({});
    render(
      <>
        <DoshamVerdictLine dosham={sevvai} lang="en" />
        <NovaYogaDoshamPanel lang="en" yogas={[]} doshams={[sevvai]} />
      </>,
    );
    expect(screen.queryByTestId("dosham-reckoning")).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "See how this was calculated" }));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(window.location.hash).toBe("#dosham-SEVVAI_DOSHAM");
    expect(await screen.findByTestId("dosham-reckoning")).toBeTruthy();
  });
});
