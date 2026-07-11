/**
 * dashaSentiment doctrine test (F2 fix) — the "Dasa chapter" glance tile must
 * read the current antardasha lord's sentiment off the chart's Lagna-dependent
 * functionalNature map, matching the doctrine used everywhere else (dasha
 * service, daily-guidance modifiers, remedies, adhipathi report), not a
 * hardcoded natural benefic/malefic split.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChartSummaryData } from "@/lib/types";

import { DashboardTodayGlanceRowNova } from "./dashboard-today-glance-nova";

function baseChartSummary(overrides: Partial<ChartSummaryData>): ChartSummaryData {
  return {
    chartId: "chart-1",
    displayName: "Test User",
    currentAge: 30,
    lagnaRasi: "Thulam",
    moonRasi: "Simmam",
    janmaNakshatra: "Chitra",
    janmaPada: 2,
    currentMahadasha: "SATURN",
    currentAntardasha: "SATURN",
    primaryLanguageText: { ta: "", en: "" },
    ...overrides,
  };
}

function renderGlance(personalChartSummary: ChartSummaryData | null) {
  return render(
    <DashboardTodayGlanceRowNova
      lang="en"
      familyAggregate={null}
      personalChartSummary={personalChartSummary}
      dasha={null}
      dashaAntar={[]}
      selectedDate="2026-07-11"
    />,
  );
}

describe("DashboardTodayGlanceRowNova — dasha sentiment doctrine", () => {
  it("shows supportive for a Thula-lagna native in Saturn antardasha (Saturn is Yogakaraka for Thulam)", () => {
    renderGlance(
      baseChartSummary({
        currentMahadasha: "SATURN",
        currentAntardasha: "SATURN",
        functionalNature: { SATURN: "YOGAKARAKA" },
      }),
    );
    expect(screen.getByText("supportive period")).toBeInTheDocument();
  });

  it("shows testing for a Mesha-lagna native in Venus antardasha (Venus is Maraka for Mesha)", () => {
    renderGlance(
      baseChartSummary({
        currentMahadasha: "VENUS",
        currentAntardasha: "VENUS",
        functionalNature: { VENUS: "MARAKA" },
      }),
    );
    expect(screen.getByText("testing period · go gently")).toBeInTheDocument();
  });

  it("falls back to the natural benefic split when functionalNature is missing (Jupiter -> supportive)", () => {
    renderGlance(
      baseChartSummary({
        currentMahadasha: "JUPITER",
        currentAntardasha: "JUPITER",
        functionalNature: undefined,
      }),
    );
    expect(screen.getByText("supportive period")).toBeInTheDocument();
  });
});
