import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { GemstoneAdviceItem } from "@/lib/types";
import { NovaRemediesPanel } from "./dashboard-life-areas-remedies-nova";

/**
 * A-038 / T18. The gemstone panel used to group its rows under "Prescribed —
 * wear these" and explain itself with "'Prescribed' means…". That is medical
 * register applied to something this same panel's own disclaimer calls a
 * traditional belief system — the app telling a reader, in its own voice, that
 * a stone is indicated for them.
 *
 * These pin the *rendered* strings rather than the data, because the register
 * is the whole finding: the grouping logic was always correct and would have
 * passed a data-shape test in either wording.
 */

function gem(partial: Partial<GemstoneAdviceItem>): GemstoneAdviceItem {
  return {
    planet: "JUPITER",
    functionalNature: "Functional benefic",
    isGemstonePrescribed: true,
    gemstoneNameTa: null,
    gemstoneNameEn: "Yellow sapphire",
    reasonTa: "",
    reasonEn: "Jupiter is a functional benefic and needs strengthening.",
    cautionTa: null,
    cautionEn: null,
    ...partial,
  };
}

function renderGemstoneTab(advice: GemstoneAdviceItem[]) {
  render(
    <NovaRemediesPanel
      lang="en"
      chartId="chart-1"
      remedyPlan={null}
      gemstoneAdvice={advice}
      loading={false}
      onLoad={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Gemstone/i }));
}

describe("Remedies — gemstone register (A-038)", () => {
  it("groups stones by what the tradition does, not by what the reader is instructed to do", () => {
    renderGemstoneTab([
      gem({ planet: "JUPITER", isGemstonePrescribed: true }),
      gem({ planet: "VENUS", isGemstonePrescribed: false, gemstoneNameEn: "Diamond" }),
      gem({ planet: "SATURN", isGemstonePrescribed: false, gemstoneNameEn: null }),
    ]);

    expect(screen.getByText("Traditionally worn for your chart")).toBeInTheDocument();
    expect(screen.getByText("Traditional reference — consult an astrologer first")).toBeInTheDocument();
    expect(screen.getByText("No gemstone suggested")).toBeInTheDocument();
  });

  it("shows a named stone as a reference only — the backend never prescribes (ruling 2026-10-01)", () => {
    // What /gemstone-advice now returns for a benefic Jupiter and for Saturn.
    renderGemstoneTab([
      gem({ planet: "JUPITER", isGemstonePrescribed: false, gemstoneNameEn: "Yellow sapphire" }),
      gem({ planet: "SATURN", isGemstonePrescribed: false, gemstoneNameEn: null }),
    ]);

    expect(screen.queryByText("Traditionally worn for your chart")).not.toBeInTheDocument();
    expect(screen.getByText("Yellow sapphire")).toBeInTheDocument();
    expect(screen.getByText(/never tells you to wear a gemstone/i)).toBeInTheDocument();
  });

  it("never uses prescription register anywhere on the panel", () => {
    renderGemstoneTab([
      gem({ planet: "JUPITER", isGemstonePrescribed: true }),
      gem({ planet: "SATURN", isGemstonePrescribed: false, gemstoneNameEn: null }),
    ]);

    // Covers the group headings *and* the explanation paragraph above them,
    // which carried "'Prescribed' means…" long after the headings were fixed
    // in an earlier pass.
    expect(document.body.textContent).not.toMatch(/prescrib/i);
  });

  it("says a stone is not required, since the recommendation implies a purchase", () => {
    renderGemstoneTab([gem({ planet: "JUPITER", isGemstonePrescribed: true })]);

    expect(screen.getByText(/traditional recommendations, not requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing here depends on buying one/i)).toBeInTheDocument();
  });
});
