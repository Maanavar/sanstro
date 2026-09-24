/**
 * The Yogakaraka weakness lines render as sentences, never as the engine code.
 *
 * `YOG-RY-04` (ruling 2026-09-23) files a weakened yogakaraka's afflictions in
 * `conditionsMet` as f-string codes (`saturn_yogakaraka_in_dusthana_12`), and
 * the strength gate files its own note in `cancellationFactors`
 * (`weak_key_planet_saturn_32`). Neither can be a fixed dictionary key, so a
 * missing pattern falls through `markerLabel` to "saturn yogakaraka in dusthana
 * 12" and no type check notices. These tests pin every code the detector can
 * emit, in both languages, on the three surfaces that render a yoga's factors.
 *
 * They also pin the heading. A yogakaraka's weakeners sat under "Cancellation
 * factors" (and "Protective factors present" in the why sentence), which told
 * the reader a combust yogakaraka was a protection.
 *
 * What this cannot see: mobile, which renders the yoga name and strength but
 * not these factor lines at all (grep `conditionsMet` in mobile/ — no hits).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardExploreYogamNova } from "./dashboard-explore-yogam-nova";
import { NovaYogaDoshamPanel } from "./dashboard-life-areas-yogas-doshams-nova";
import {
  YogaDoshamPanel,
  buildWhyText,
  isWeakeningMarker,
  markerLabel,
  yogaFactorHeading,
} from "./dashboard-yoga-dosham-panel";
import type { ChartYogaInsight } from "@/lib/types";

// Every code `detect_raja_yogakaraka` can emit, for all three yogakarakas and
// every dusthana, plus the gate's notes. Houses are the real pairs per lagna.
const YK_CODES = [
  "saturn_yogakaraka_owns_9_10", "saturn_yogakaraka_owns_4_5",
  "mars_yogakaraka_owns_5_10", "mars_yogakaraka_owns_4_9",
  "venus_yogakaraka_owns_5_10", "venus_yogakaraka_owns_4_9",
  ...["saturn", "mars", "venus"].flatMap((g) => [
    `${g}_yogakaraka_debilitated`,
    `${g}_yogakaraka_combust`,
    `${g}_yogakaraka_in_dusthana_6`,
    `${g}_yogakaraka_in_dusthana_8`,
    `${g}_yogakaraka_in_dusthana_12`,
  ]),
  "weak_key_planet_saturn_32",
  "combust_key_planet_venus",
];

const LATIN = /[A-Za-z]/;

// The `yogakaraka_neecha` reference chart in tests/test_drishti_yoga_golden.py:
// Rishabha lagna, Sani neecha in Mesham (the 12th). The gate note is added so
// the cancellationFactors path is exercised too.
function weakenedYogakaraka(): ChartYogaInsight {
  return {
    name: "YOGAKARAKA_RAJA_YOGA",
    isPresent: true,
    strength: "PARTIAL",
    conditionsMet: [
      "saturn_yogakaraka_owns_9_10",
      "saturn_yogakaraka_debilitated",
      "saturn_yogakaraka_in_dusthana_12",
    ],
    cancellationFactors: ["weak_key_planet_saturn_32"],
    dashaActivated: false,
    activationScore: 40,
    isCurrentlyActive: false,
    descriptionTa: "",
    descriptionEn: "",
  };
}

/** Text *and* attributes: `title=`/`aria-label=` render too, and innerText
 *  cannot see them. */
function renderedSurface(container: HTMLElement): string {
  const attrs = Array.from(container.querySelectorAll("*")).flatMap((el) =>
    Array.from(el.attributes).map((a) => a.value),
  );
  return [container.textContent ?? "", ...attrs].join("\n");
}

function expectNoRawCode(surface: string) {
  expect(surface).not.toMatch(/yogakaraka_/);
  expect(surface).not.toMatch(/key_planet/);
  expect(surface).not.toMatch(/yogakaraka (owns|debilitated|combust|in dusthana)/i);
  expect(surface).not.toMatch(/weak key planet/i);
}

describe("markerLabel — every yogakaraka code", () => {
  it.each(YK_CODES)("%s reads as a sentence in English", (code) => {
    const en = markerLabel(code, "en");
    expect(en).not.toBe(code.replaceAll("_", " "));
    expect(en).not.toContain("_");
    expect(en).toMatch(/Saturn|Mars|Venus/);
  });

  it.each(YK_CODES)("%s reads in Tamil script only", (code) => {
    const ta = markerLabel(code, "ta");
    expect(ta).not.toMatch(LATIN);
    expect(ta).toMatch(/சனி|செவ்வாய்|சுக்கிரன்/);
  });

  it("names the dusthana as one", () => {
    expect(markerLabel("saturn_yogakaraka_in_dusthana_8", "en")).toContain("8th house (a dusthana)");
    expect(markerLabel("saturn_yogakaraka_in_dusthana_8", "ta")).toContain("மறைவு ஸ்தானம்");
  });

  it("says the yoga is weakened, not removed", () => {
    expect(markerLabel("mars_yogakaraka_debilitated", "en")).toMatch(/without removing it/);
    expect(markerLabel("mars_yogakaraka_debilitated", "ta")).toMatch(/யோகம் நீங்காது/);
  });
});

describe("weakeners are neither triggers nor protections", () => {
  it("classifies weakeners and leaves formers and bhangas alone", () => {
    expect(isWeakeningMarker("saturn_yogakaraka_combust")).toBe(true);
    expect(isWeakeningMarker("weak_key_planet_mars_20")).toBe(true);
    expect(isWeakeningMarker("malefic_aspect_on_10th_saturn")).toBe(true);
    expect(isWeakeningMarker("saturn_yogakaraka_owns_9_10")).toBe(false);
    expect(isWeakeningMarker("planet_kendra_from_moon")).toBe(false);
  });

  it("heads a weakener-only list as such, and a real bhanga as a cancellation", () => {
    expect(yogaFactorHeading(["weak_key_planet_saturn_32"], "en")).toBe("What lowers its strength");
    expect(yogaFactorHeading(["weak_key_planet_saturn_32"], "ta")).toBe("பலம் குறைக்கும் காரணிகள்");
    expect(yogaFactorHeading(["planet_kendra_from_moon"], "en")).toBe("Cancellation factors");
  });

  it.each(["en", "ta"] as const)("the why sentence files them apart (%s)", (lang) => {
    const y = weakenedYogakaraka();
    const why = buildWhyText(y.conditionsMet, y.cancellationFactors, true, false, false, lang);
    if (lang === "en") {
      expect(why).toMatch(/^Triggered because: Saturn rules both the 9th and 10th houses/);
      expect(why).toMatch(/What lowers its strength: Saturn is debilitated/);
      expect(why).not.toMatch(/Protective factors/);
      // A debility is not why the yoga formed.
      expect(why.split("What lowers")[0]).not.toMatch(/debilitated/);
    } else {
      expect(why).toMatch(/பலம் குறைக்கும் காரணிகள்: சனி நீசம் பெற்றுள்ளது/);
      expect(why).not.toMatch(/நிவர்த்தி\/பாதுகாப்பு/);
    }
    expectNoRawCode(why);
  });
});

describe.each(["en", "ta"] as const)("rendered surfaces (%s)", (lang) => {
  const heading = lang === "ta" ? "பலம் குறைக்கும் காரணிகள்" : "What lowers its strength";
  const cancelHeading = lang === "ta" ? "நிவர்த்தி காரணங்கள்" : "Cancellation factors";
  const name = lang === "ta" ? "யோககாரக ராஜயோகம்" : "Yogakaraka Raja Yoga";

  it("Charts — YogaDoshamPanel", () => {
    const { container } = render(<YogaDoshamPanel lang={lang} yogas={[weakenedYogakaraka()]} doshams={[]} />);
    fireEvent.click(screen.getByText(name));
    expect(screen.getByText(heading)).toBeInTheDocument();
    expect(screen.queryByText(cancelHeading)).not.toBeInTheDocument();
    expectNoRawCode(renderedSurface(container));
  });

  it("Life Areas — NovaYogaDoshamPanel", () => {
    const { container } = render(<NovaYogaDoshamPanel lang={lang} yogas={[weakenedYogakaraka()]} doshams={[]} />);
    fireEvent.click(screen.getByText(name));
    expect(screen.getByText(heading)).toBeInTheDocument();
    expect(screen.queryByText(cancelHeading)).not.toBeInTheDocument();
    expectNoRawCode(renderedSurface(container));
  });

  it("Explore — DashboardExploreYogamNova", () => {
    const noop = () => {};
    const { container } = render(
      <DashboardExploreYogamNova
        lang={lang}
        yogas={[weakenedYogakaraka()]}
        initialIndex={0}
        memberCharts={[]}
        onBack={noop}
        onOpenAskVinaadi={noop}
        onNavigateToday={noop}
      />,
    );
    expect(screen.getByText(heading)).toBeInTheDocument();
    expect(screen.queryByText(cancelHeading)).not.toBeInTheDocument();
    expectNoRawCode(renderedSurface(container));
  });

  it("fills What This Brings / How to Strengthen / Remedies for the yoga", () => {
    render(<YogaDoshamPanel lang={lang} yogas={[weakenedYogakaraka()]} doshams={[]} />);
    fireEvent.click(screen.getByText(name));
    expect(screen.getByText(lang === "ta" ? "வாழ்க்கையில் என்ன தரும்" : "What This Brings")).toBeInTheDocument();
    expect(screen.getByText(lang === "ta" ? /திருநள்ளாறு/ : /Thirunallar/)).toBeInTheDocument();
  });
});
