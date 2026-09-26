/**
 * Regression test for the Nova-only migration Yoga/Dosham parity fix
 * (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3). ChartExplanationPanel is a
 * shared component mounted by both Classic and Nova surfaces. It used to
 * hard-render the Classic-token `YogaDoshamPanel` in its Yogas section, so
 * Nova's chart deep-dive showed Classic styling there. The fix adds an
 * optional `renderYogaDoshamPanel` prop that Nova passes to substitute its
 * own Nova-token panel. This guards that contract: when the prop is provided
 * the Yogas section renders the override (with the correct yogas/doshams),
 * and when omitted it falls back to the default panel.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import type { ChartCalculateResponseData, ChartYogaInsight } from "@/lib/types";

function makeGajaKesari(overrides: Partial<ChartYogaInsight> = {}): ChartYogaInsight {
  return {
    name: "GAJA_KESARI_YOGA",
    isPresent: true,
    strength: "STRONG",
    conditionsMet: ["jupiter_in_kendra_from_moon"],
    cancellationFactors: [],
    dashaActivated: false,
    activationScore: 0,
    isCurrentlyActive: false,
    descriptionTa: "",
    descriptionEn: "",
    ...overrides,
  };
}

// Minimal chart — `.planets`/`.yogas`/`.doshams` feed the Yogas section + the
// on-mount derived memo; `.lagna` is read by the default "basics" tab that
// renders before we switch to Yogas. Cast to satisfy the full type.
function makeChart(yogas: ChartYogaInsight[]): ChartCalculateResponseData {
  return {
    planets: [],
    yogas,
    doshams: [],
    lagna: { rasi: 1, nakshatraName: "ASWINI", pada: 1 },
  } as unknown as ChartCalculateResponseData;
}

const baseProps = {
  lang: "en" as const,
  explanation: null,
  summary: null,
  transit: null,
  sani: null,
  peyarchiUpcoming: [],
  dasha: null,
  dashaAntar: [],
};

describe("ChartExplanationPanel — Lagna sign-edge note", () => {
  const note = {
    ta: "லக்னம் மீனம் ராசியின் விளிம்பில் (0.50°) உள்ளது.",
    en: "The Lagna sits at the edge of Meenam (0.50°).",
  };
  function explanationWith(lagnaEdgeNote: typeof note | null) {
    return {
      coreIdentity: {
        lagnaRasi: "MEENAM",
        moonRasi: "MESHAM",
        janmaNakshatra: "ASWINI",
        janmaPada: 1,
        currentMahadasha: "SATURN",
        currentAntardasha: "MERCURY",
        currentPratyantardasha: "KETU",
        explanation: { ta: "அடிப்படை", en: "Basics" },
        lagnaEdgeNote,
      },
      planets: [],
      houseGroups: [],
      summary: { strongestPlanet: null, positives: [], cautions: [] },
    } as unknown as React.ComponentProps<typeof ChartExplanationPanel>["explanation"];
  }

  it.each([
    ["en", note.en],
    ["ta", note.ta],
  ] as const)("renders the note in the active language (%s)", (lang, expected) => {
    render(
      <ChartExplanationPanel
        {...baseProps}
        lang={lang}
        explanation={explanationWith(note)}
        chart={makeChart([])}
      />,
    );
    fireEvent.click(screen.getByText(lang === "ta" ? "ஜாதக விளக்கம் திற" : "Open chart explanation"));
    expect(screen.getByRole("note")).toHaveTextContent(expected);
  });

  it("renders nothing when the Lagna is safely inside its sign", () => {
    render(<ChartExplanationPanel {...baseProps} explanation={explanationWith(null)} chart={makeChart([])} />);
    fireEvent.click(screen.getByText("Open chart explanation"));
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});

describe("ChartExplanationPanel — Yogas section renderYogaDoshamPanel override", () => {
  it("invokes the override renderer with the chart's yogas/doshams", () => {
    const renderYogaDoshamPanel = vi.fn(() => <div>NOVA_YOGA_OVERRIDE</div>);
    render(
      <ChartExplanationPanel
        {...baseProps}
        chart={makeChart([makeGajaKesari()])}
        renderYogaDoshamPanel={renderYogaDoshamPanel}
      />,
    );

    fireEvent.click(screen.getByText("Open chart explanation"));
    fireEvent.click(screen.getByText("Chart patterns and difficult placements"));

    expect(screen.getByText("NOVA_YOGA_OVERRIDE")).toBeInTheDocument();
    expect(renderYogaDoshamPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        lang: "en",
        yogas: expect.arrayContaining([expect.objectContaining({ name: "GAJA_KESARI_YOGA" })]),
        doshams: [],
      }),
    );
  });

  it("falls back to the default panel when no override is provided", () => {
    render(<ChartExplanationPanel {...baseProps} chart={makeChart([makeGajaKesari()])} />);

    fireEvent.click(screen.getByText("Open chart explanation"));
    fireEvent.click(screen.getByText("Chart patterns and difficult placements"));

    // Default YogaDoshamPanel renders the yoga's display name as a clickable row.
    expect(screen.getByText("Gaja Kesari Yoga")).toBeInTheDocument();
    expect(screen.queryByText("NOVA_YOGA_OVERRIDE")).not.toBeInTheDocument();
  });
});
