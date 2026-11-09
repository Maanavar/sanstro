import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { LifeAreaData } from "@/lib/types";
import { LifeAreaCard } from "./life-area-card";

/**
 * Owner rulings 2026-10-01, as the Life areas card shows them: the score's own
 * band sentence, and a well-supported area's light practice headed "Keep it
 * steady" rather than "Remedy / Worship".
 */

function area(partial: Partial<LifeAreaData>): LifeAreaData {
  return {
    area: "CAREER",
    label: { ta: "தொழில்", en: "Career" },
    score: 72,
    trend: "STABLE",
    confidence: "MEDIUM",
    confidenceReason: { ta: "", en: "" },
    primaryHouseStrength: "NEUTRAL",
    karakaStatus: "MODERATE",
    dashaActivation: false,
    transitSupport: 50,
    supportingFactors: [],
    blockingFactors: [],
    driver: { planet: "SATURN", reason: { ta: "", en: "" } },
    narrative: { ta: "", en: "Career support is strong." },
    remedy: {
      ta: "இந்தப் பகுதி நன்றாக உள்ளது.",
      en: "This area is well supported. Continue your effort; a visit to your kula deivam or a simple act of gratitude keeps it steady.",
    },
    next30DayOutlook: { ta: "", en: "" },
    caution: null,
    isGoalFocus: false,
    remedyKind: "MAINTAIN",
    scoreBand: "GOOD",
    scoreBandText: { ta: "நல்ல காலம் — தொடர்ந்த முயற்சியுடன் பலன் கிடைக்கும்", en: "Good — results come with sustained effort" },
    ...partial,
  };
}

describe("LifeAreaCard — band sentence and remedy kind (2026-10-01)", () => {
  it("prints the score's band sentence under the score", () => {
    render(<LifeAreaCard area={area({})} lang="en" ageRelevant />);
    expect(screen.getByTestId("life-area-score-band")).toHaveTextContent("Good — results come with sustained effort");
  });

  it("heads a well-supported area's practice 'Keep it steady', never 'Remedy'", () => {
    render(<LifeAreaCard area={area({})} lang="en" ageRelevant />);
    expect(screen.getByText("Keep it steady")).toBeInTheDocument();
    expect(screen.queryByText("Remedy / Worship")).not.toBeInTheDocument();
  });

  it("keeps the Remedy heading for an area that needs care", () => {
    render(
      <LifeAreaCard
        area={area({ score: 38, remedyKind: "REMEDY", scoreBand: "DIFFICULT", scoreBandText: { ta: "கவனம் தேவை", en: "Needs care — prepare before big commitments" }, remedy: { ta: "", en: "Light a sesame oil lamp on Saturdays." } })}
        lang="en"
        ageRelevant
      />,
    );
    expect(screen.getByText("Remedy / Worship")).toBeInTheDocument();
    expect(screen.getByTestId("life-area-score-band")).toHaveTextContent("Needs care");
  });

  it("renders a cached payload without the new fields exactly as before", () => {
    render(<LifeAreaCard area={area({ remedyKind: undefined, scoreBand: undefined, scoreBandText: undefined })} lang="en" ageRelevant />);
    expect(screen.queryByTestId("life-area-score-band")).not.toBeInTheDocument();
    expect(screen.getByText("Remedy / Worship")).toBeInTheDocument();
  });
});

/** Every text node in the card, one by one. Joining textContent would run
 *  adjacent nodes together and hide a tag between two words. */
function textNodes(root: HTMLElement): string[] {
  const out: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim();
    if (text) out.push(text);
  }
  return out;
}

describe("LifeAreaCard — Tamil mode renders no server tag (2026-11-09)", () => {
  // Blind spot: catches upper-case Latin tags (SATURN, NEUTRAL, FLAT). A
  // mixed-case English sentence from the server would pass; the prose fields
  // are tLang pairs and are not what this guards.
  const leaked = (texts: string[]) => texts.filter((t) => /[A-Z]{3,}/.test(t));

  it("names the karaka planet, chip strengths, trend and factors in Tamil", () => {
    const { container } = render(
      <LifeAreaCard
        area={area({
          trend: "STABLE",
          primaryHouseStrength: "WEAK",
          karakaStatus: "MODERATE",
          driver: { planet: "SATURN", reason: { ta: "", en: "" } },
          supportingFactors: ["JUPITER_transit_supportive"],
          blockingFactors: ["MOON_lord_weak"],
          narrative: { ta: "தொழிலில் ஆதரவு உண்டு.", en: "Career support is strong." },
        })}
        lang="ta"
        ageRelevant
      />,
    );
    const texts = textNodes(container);
    expect(leaked(texts)).toEqual([]);
    expect(texts).toContain("சனி");
    expect(texts.join(" ")).toContain("குரு: கோச்சார ஆதரவு");
    expect(texts.join(" ")).toContain("சந்திரன்: அதிபதி பலவீனம்");
  });

  it("reads the same tags in plain English case in English mode", () => {
    const { container } = render(
      <LifeAreaCard area={area({ trend: "STABLE", driver: { planet: "SATURN", reason: { ta: "", en: "" } } })} lang="en" ageRelevant />,
    );
    const texts = textNodes(container);
    expect(texts).toContain("Saturn");
    expect(texts.join(" ")).toContain("Neutral");
  });
});
