import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ChartDoshamInsight } from "@/lib/types";
import { buildWhyText, doshamPresenceLabel, getDoshamPowerContext, getDoshamRemedies, getWhat, markerLabel } from "./dashboard-yoga-dosham-panel";
import { NovaYogaDoshamPanel } from "./dashboard-life-areas-yogas-doshams-nova";

/**
 * Putra Sarpa and Marana Karaka Sthana cards say what *this chart* has
 * (owner report, 2026-10-06). Synthetic payloads only.
 */
function dosham(over: Partial<ChartDoshamInsight>): ChartDoshamInsight {
  return {
    name: "PUTRA_SARPA_DOSHAM",
    label: "DOSHAM_WITH_NIVARTHI",
    isPresent: true,
    isCancelled: true,
    strength: "WEAK",
    conditionsMet: [],
    cancellationFactors: [],
    dashaActivated: false,
    ...over,
  } as ChartDoshamInsight;
}

const LATIN = /[A-Za-z]/;

describe("Putra Sarpa names one side per fact", () => {
  it("labels each trigger and protection with its own planet or house", () => {
    expect(markerLabel("fifth_house_has_rahu", "en")).toBe("Rahu sits in your 5th house, the house of children and creativity");
    expect(markerLabel("fifth_lord_sun_joined_by_saturn", "en")).toBe("Saturn shares a sign with your 5th lord, Sun");
    expect(markerLabel("jupiter_in_kendra_house_10", "en")).toBe("Jupiter, the karaka for children, stands in a kendra (your 10th house) and protects");
    expect(markerLabel("fifth_lord_mars_strong", "en")).toBe("Your 5th lord, Mars, is strong; the house's own lord protects it");
    for (const m of ["fifth_house_has_ketu", "jupiter_joined_by_rahu", "fifth_lord_sun_strong", "jupiter_in_kendra_house_4"]) {
      expect(markerLabel(m, "ta")).not.toMatch(LATIN);
    }
  });

  it("does not claim a strong 5th lord when only Jupiter protects", () => {
    const d = dosham({ conditionsMet: ["fifth_house_has_rahu"], cancellationFactors: ["jupiter_in_kendra_house_10"] });
    const now = getDoshamPowerContext(d, "en");
    expect(now).not.toMatch(/5th lord/);
    // The chip and "What remains" say "reduced, not erased"; this line does not repeat it.
    expect(now).not.toMatch(/reduced|not removed/);
    expect(now).toBe("Read it as delay, not denial: with the house guarded, time and steady effort tend to bring results.");
  });

  it("explains the two sides once in the general line", () => {
    const what = getWhat("PUTRA_SARPA_DOSHAM", false, "en");
    expect(what).toMatch(/what disturbs the house/);
    expect(what).toMatch(/what guards it/);
    expect(what).not.toMatch(/malefics\b(?! in it)/);
  });
});

describe("Marana Karaka Sthana says which planet and when", () => {
  const mks = (over: Partial<ChartDoshamInsight>) =>
    dosham({ name: "MARANA_KARAKA_STHANA", label: "MARANA_KARAKA_STHANA_CANDIDATE", isCancelled: false, strength: "PARTIAL", conditionsMet: ["mercury_in_marana_karaka_sthana"], ...over });

  it("renders the marker as a sentence, never the raw token", () => {
    expect(markerLabel("mercury_in_marana_karaka_sthana", "en")).toBe("Mercury is in your 7th house, its Marana Karaka Sthana");
    expect(markerLabel("sun_in_marana_karaka_sthana", "ta")).toBe("சூரியன் உங்கள் 12-ஆம் வீட்டில் உள்ளது; இது அதன் மரண காரக ஸ்தானம்");
    expect(markerLabel("jupiter_aspects_venus_in_mks", "en")).toBe("Jupiter aspects Venus there, a protective influence");
  });

  it("names whose dasha the reading waits on", () => {
    expect(getDoshamPowerContext(mks({}), "en")).toBe(
      "Mercury's dasha or bhukti is not running now, so this stays in the background until it does.",
    );
    expect(getDoshamPowerContext(mks({ dashaActivated: true, label: "ACTIVE_MARANA_KARAKA_STHANA" }), "en")).toMatch(/^Mercury's dasha or bhukti is running now/);
    expect(getDoshamPowerContext(mks({}), "en")).not.toMatch(/varies with your current Dasha/);
    expect(getDoshamPowerContext(mks({}), "ta")).not.toMatch(LATIN);
  });

  it("gives the planet's own day and temple as the remedy", () => {
    expect(getDoshamRemedies(mks({}), "en")).toMatch(/^Mercury: Wednesday worship, a visit to Thiruvenkadu/);
    expect(getDoshamRemedies(mks({}), "ta")).toMatch(/திருவெண்காடு/);
  });

  it("has a general line that says it is not a life-span prediction", () => {
    expect(getWhat("MARANA_KARAKA_STHANA", false, "en")).toMatch(/not a prediction about life span/);
  });
});

describe("O-32: a neutralized Putra Sarpa", () => {
  const neutral = dosham({
    isPresent: false,
    isCancelled: false,
    label: "NO_DOSHAM",
    conditionsMet: ["fifth_house_has_saturn"],
    cancellationFactors: ["saturn_yogakaraka_own_fifth"],
  });

  it("reads Neutralized, not Absent, and asks for no remedy", () => {
    expect(doshamPresenceLabel(neutral, "en")).toBe("Neutralized");
    expect(doshamPresenceLabel(neutral, "ta")).not.toMatch(LATIN);
    expect(getDoshamPowerContext(neutral, "en")).toBe("No remedy is needed for this placement.");
    expect(markerLabel("saturn_yogakaraka_own_fifth", "en")).toMatch(/^For Thulam lagna Saturn is the 5th lord and the yogakaraka/);
  });

  it("an unformed dosham with no recorded reason still reads Absent", () => {
    expect(doshamPresenceLabel({ isPresent: false, isCancelled: false, cancellationFactors: [] }, "en")).toBe("Absent");
  });
});

describe("a fact is said once per card", () => {
  it("the why sentence does not restate the bullets printed under it", () => {
    const opts = { listsShown: true, kind: "dosham" as const };
    expect(buildWhyText(["fifth_house_has_rahu"], ["jupiter_in_kendra_house_10"], true, true, false, "en", opts)).toBe("");
    expect(buildWhyText(["fifth_house_has_rahu"], [], true, false, true, "en", opts)).toMatch(/^Your current Dasha period activates/);
    expect(buildWhyText(["fifth_house_has_saturn"], ["saturn_yogakaraka_own_fifth"], false, false, false, "en", opts)).toBe(
      "The placement is in your chart, but the factor below neutralizes it, so it does not act as a dosham.",
    );
    // A yoga annulled by bhanga keeps its character line (2026-09-11 ruling).
    expect(buildWhyText([], ["planet_kendra_from_moon"], false, false, false, "en", { listsShown: true })).toMatch(/The pattern's character is part of you/);
  });

  it("the open Putra Sarpa card prints each fact once", () => {
    const d = dosham({
      conditionsMet: ["fifth_house_has_rahu"],
      cancellationFactors: ["jupiter_in_kendra_house_10"],
      formationStrength: "PARTIAL",
      residual: "MILD",
      meaningEn: "What disturbs your 5th house (Simmam): Rahu in the house itself. What guards it: Jupiter, the karaka for children, in your 10th house (a kendra). Most noticeable in the dasha or bhukti of Rahu.",
      meaningTa: "x",
    });
    render(<NovaYogaDoshamPanel lang="en" yogas={[]} doshams={[d]} />);
    fireEvent.click(screen.getByRole("button", { name: /Putra Sarpa/ }));
    const body = document.body.textContent ?? "";
    // The trigger and the protection are said in "In your chart" only.
    expect(body).not.toMatch(/Rahu sits in your 5th house/);
    expect(body).not.toMatch(/stands in a kendra \(your 10th house\)/);
    expect(body).not.toMatch(/Triggered because|Protective factors present/);
    expect(screen.queryByText("Planet Positions")).toBeNull();
    expect(screen.queryByText("Protective Factors")).toBeNull();
    // "Reduced, not erased" is said by "What remains" only.
    expect(body.match(/not erased|not removed/g)?.length ?? 0).toBe(1);
    // Medical guidance is said under "How to reduce impact" only.
    expect(body.match(/medical guidance/gi)?.length ?? 0).toBe(1);
  });
});
