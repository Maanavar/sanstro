import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { RasiChart, NavamsaChart } from "./dashboard-charts";
import type { ChartCalculateResponseData } from "@/lib/types";

/**
 * The kattam used to resolve every occupant through `GRAHA_ABBR`, which is
 * Tamil, no matter what language the reader had chosen — so an English-language
 * reader was handed a twelve-box grid of சூ/சந்/செ/… with no legend and no other
 * rendering of which graha sits where. `GRAHA_ABBR_EN` existed the whole time
 * and only the marketing share card used it.
 *
 * Nothing asserted the rendered script, which is exactly why it survived: the
 * data builders are language-free by design and their tests pass either way.
 * These tests pin the RENDERED output, which is where the defect lived.
 */
function sampleChart(): ChartCalculateResponseData {
  return {
    chartId: "chart-1",
    birthProfile: {
      birthProfileId: "profile-1",
      displayName: "Test User",
      birthDateLocal: "1990-01-01",
      birthTimeLocal: "10:30:00",
      birthPlace: "Chennai",
      birthTimezone: "Asia/Kolkata",
      calculationStatus: "completed",
      warnings: [],
    },
    birthDateTimeUTC: "1990-01-01T05:00:00Z",
    julianDay: 2447892.5,
    ayanamsa: { type: "LAHIRI", valueDegrees: 23.5 },
    lagna: {
      rasi: 1, rasiName: "Mesham", absoluteLongitude: 10, degreeInRasi: 10,
      nakshatra: 1, nakshatraName: "Aswini", pada: 4,
    },
    planets: [
      {
        graha: "SUN", rasiName: "Mesham", absoluteLongitude: 20, rasi: 1, degreeInRasi: 20,
        nakshatra: 2, nakshatraName: "Bharani", pada: 2, houseFromLagna: 1, speedDegPerDay: 1,
        isRetrograde: false, isCombust: false, d9Rasi: 2, isVargottama: false, showRetrogradeBadge: false,
      },
      {
        graha: "SATURN", rasiName: "Kanni", absoluteLongitude: 170, rasi: 6, degreeInRasi: 20,
        nakshatra: 14, nakshatraName: "Chitra", pada: 1, houseFromLagna: 6, speedDegPerDay: 0.1,
        isRetrograde: true, isCombust: false, d9Rasi: 6, isVargottama: true, showRetrogradeBadge: true,
      },
      {
        graha: "RAHU", rasiName: "Kadagam", absoluteLongitude: 100, rasi: 4, degreeInRasi: 10,
        nakshatra: 9, nakshatraName: "Ayilyam", pada: 1, houseFromLagna: 4, speedDegPerDay: -0.05,
        isRetrograde: true, isCombust: false, d9Rasi: 4, isVargottama: false, showRetrogradeBadge: false,
      },
    ],
    yogas: [],
    doshams: [],
    calculationVersion: "v1",
    calculationStatus: "completed",
    warnings: [],
    ephemerisBackend: "swisseph",
  } as unknown as ChartCalculateResponseData;
}

const TAMIL = /[஀-௿]/;

describe("RasiChart occupant abbreviations", () => {
  it("prints Latin graha abbreviations in English mode", () => {
    const { container } = render(<RasiChart chart={sampleChart()} lang="en" />);
    const grid = container.querySelector("div[style*='grid-template-columns']")!;
    expect(within(grid as HTMLElement).getAllByText("Su").length).toBeGreaterThan(0);
    expect(within(grid as HTMLElement).getAllByText("Sa").length).toBeGreaterThan(0);
    expect(within(grid as HTMLElement).getAllByText("Ra").length).toBeGreaterThan(0);
  });

  it("puts no Tamil script in the English-mode grid cells", () => {
    const { container } = render(<RasiChart chart={sampleChart()} lang="en" />);
    const grid = container.querySelector("div[style*='grid-template-columns']") as HTMLElement;
    expect(grid.textContent ?? "").not.toMatch(TAMIL);
  });

  it("still prints Tamil graha abbreviations in Tamil mode", () => {
    const { container } = render(<RasiChart chart={sampleChart()} lang="ta" />);
    const grid = container.querySelector("div[style*='grid-template-columns']") as HTMLElement;
    expect(within(grid).getAllByText("சூ").length).toBeGreaterThan(0);
    expect(within(grid).getAllByText("ச").length).toBeGreaterThan(0);
  });

  it("marks the lagna in the reader's script, both ways", () => {
    const en = render(<RasiChart chart={sampleChart()} lang="en" />);
    expect(en.container.textContent).toContain("La");
    en.unmount();
    const ta = render(<RasiChart chart={sampleChart()} lang="ta" />);
    expect(ta.container.textContent).toContain("ல");
  });
});

describe("chart legend", () => {
  it("names every graha on the grid", () => {
    render(<RasiChart chart={sampleChart()} lang="en" />);
    expect(screen.getByText("Sun")).toBeTruthy();
    expect(screen.getByText("Saturn")).toBeTruthy();
    expect(screen.getByText("Rahu")).toBeTruthy();
  });

  it("explains the nodes when they are on the grid", () => {
    render(<RasiChart chart={sampleChart()} lang="en" />);
    expect(screen.getByText(/Moon's path crosses the Sun's/)).toBeTruthy();
  });

  it("omits the nodes note when neither node is present", () => {
    const chart = sampleChart();
    chart.planets = chart.planets.filter((p) => p.graha !== "RAHU" && p.graha !== "KETU");
    render(<RasiChart chart={chart} lang="en" />);
    expect(screen.queryByText(/Moon's path crosses the Sun's/)).toBeNull();
  });

  it("explains only the marks this chart actually shows", () => {
    render(<RasiChart chart={sampleChart()} lang="en" />);
    // Saturn is retrograde and vargottama here; nothing is combust or cazimi.
    expect(screen.getByText("Retrograde")).toBeTruthy();
    expect(screen.getByText("Vargottama")).toBeTruthy();
    expect(screen.queryByText("Combust")).toBeNull();
    expect(screen.queryByText("Cazimi")).toBeNull();
  });

  it("does not offer combustion on the D9 legend, which cannot show it", () => {
    const chart = sampleChart();
    chart.planets[0].isCombust = true;
    render(<NavamsaChart chart={chart} lang="en" />);
    expect(screen.queryByText("Combust")).toBeNull();
  });
});

/**
 * A-025 — the tap-to-explain affordance, and what a screen reader gets.
 *
 * The affordance used to be four `title=` attributes, which no touch user can
 * reach. Replacing them with `aria-label` fixed the wrong half and broke the
 * other: `aria-label` on the cell <button> REPLACES its content, so the planets
 * in the box vanished from the accessible name; and `aria-label` on the
 * occupant <span> is prohibited by ARIA (role=generic) and exposed by nothing.
 * The repo's axe gate runs `color-contrast` only, so neither would have failed
 * CI. These assert the accessible name a reader actually receives.
 */
describe("kattam cell — accessible name (A-025)", () => {
  it("names the rasi AND every graha standing in it", () => {
    render(<RasiChart chart={sampleChart()} lang="en" />);
    const cell = screen.getByRole("button", { name: /Kanni/ });
    expect(cell.getAttribute("aria-label")).toContain("Saturn");
  });

  it("spells out each occupant's conditions instead of leaving them as glyphs", () => {
    // Saturn is retrograde AND vargottama; the grid shows that as a superscript
    // "R" and "V", which read aloud as stray letters or not at all.
    render(<RasiChart chart={sampleChart()} lang="en" />);
    const label = screen.getByRole("button", { name: /Kanni/ }).getAttribute("aria-label")!;
    expect(label).toContain("Retrograde");
    expect(label).toContain("Vargottama");
  });

  it("says a box is empty rather than naming it and stopping", () => {
    render(<RasiChart chart={sampleChart()} lang="en" />);
    const label = screen.getByRole("button", { name: /Kumbam/ }).getAttribute("aria-label")!;
    expect(label).toMatch(/No grahas in this rasi/i);
  });

  it("leads with the visible label, so the name contains what the eye reads", () => {
    // WCAG 2.5.3 Label in Name — voice control users say what they can see.
    render(<RasiChart chart={sampleChart()} lang="en" />);
    const label = screen.getByRole("button", { name: /Kanni/ }).getAttribute("aria-label")!;
    expect(label.startsWith("Kanni")).toBe(true);
  });

  it("puts no aria-label on the occupant chips, where ARIA prohibits naming", () => {
    const { container } = render(<RasiChart chart={sampleChart()} lang="en" />);
    expect(container.querySelectorAll("span[aria-label]").length).toBe(0);
  });
});

describe("tap-to-explain chip (A-025)", () => {
  it("is shown when there is a panel to receive the tap", () => {
    render(<RasiChart chart={sampleChart()} lang="en" />);
    expect(screen.getByText("Tap to explain")).toBeTruthy();
  });

  it("is NOT shown when the chart renders without an explain panel", () => {
    // 10 of the 14 call sites pass showExplain={false}. A permanent "Tap to
    // explain" line on those promised something that could not happen.
    render(<RasiChart chart={sampleChart()} lang="en" showExplain={false} />);
    expect(screen.queryByText("Tap to explain")).toBeNull();
  });

  it("does not print the affordance twice on one chart", () => {
    // The panel below the grid used to carry the same four words as its own
    // heading, so both read "Tap to explain".
    render(<RasiChart chart={sampleChart()} lang="en" />);
    expect(screen.getAllByText("Tap to explain").length).toBe(1);
    expect(screen.getByText("Selected box")).toBeTruthy();
  });

  it("applies to the D9 grid on the same terms", () => {
    render(<NavamsaChart chart={sampleChart()} lang="en" showExplain={false} />);
    expect(screen.queryByText("Tap to explain")).toBeNull();
  });
});

describe("kattam cell — accessible name in Tamil", () => {
  it("voices graha names in Tamil, not as Latin enum codes", () => {
    // `occupantName` returns the raw "SATURN" enum. Fine on screen (it never
    // renders), fatal in an aria-label a Tamil reader hears spelled out.
    render(<RasiChart chart={sampleChart()} lang="ta" />);
    const label = screen.getByRole("button", { name: /^கன்னி/ }).getAttribute("aria-label")!;
    expect(label).not.toContain("SATURN");
    expect(label).toContain("சனி"); // Sani
    expect(TAMIL.test(label)).toBe(true);
  });
});
