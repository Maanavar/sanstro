import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashaTimeline } from "./dashboard-dasha";
import type { DashaTimelineResponseData } from "@/lib/types";

/**
 * T12 (UX_BLINDSPOT_HANDOFF_2026-08-23.md): BALANCED mode promises "some
 * terms, with tooltips" (mode_balanced_desc) but the dasha lord's name used
 * to render as bare text in that mode — no gloss, no tap target, nothing.
 * These pin that a BALANCED reader can now tap the active lord's name and
 * get the same plain-language role BEGINNER mode prints inline, and that
 * BEGINNER/TRADITIONAL are unaffected.
 */

function buildDasha(): DashaTimelineResponseData {
  return {
    chartId: "chart-1",
    openingDasha: { lord: "SATURN", balanceYearsAtBirth: 3 },
    current: {
      mahadasha: { lord: "SATURN", startDate: "2020-01-01", endDate: "2039-01-01" },
      antardasha: { lord: "VENUS", startDate: "2024-01-01", endDate: "2026-06-01" },
      pratyantardasha: { lord: "SUN", startDate: "2026-01-01", endDate: "2026-03-01" },
    },
    timeline: [
      { level: "maha", lord: "SATURN", startDate: "2020-01-01", endDate: "2039-01-01" },
    ],
  };
}

function renderTimeline(mode: "BEGINNER" | "BALANCED" | "TRADITIONAL") {
  return render(
    <DashaTimeline
      dasha={buildDasha()}
      dashaAntar={[{ level: "antar", lord: "VENUS", startDate: "2024-01-01", endDate: "2026-06-01" }]}
      today="2026-02-01"
      dashaSupport={62}
      lang="en"
      birthDateLocal="1990-05-15"
      mode={mode}
    />,
  );
}

describe("DashaTimeline — lord name per mode (T12)", () => {
  it("prints the friendly gloss inline in BEGINNER mode, no tap target", () => {
    renderTimeline("BEGINNER");

    // Two occurrences: the bar segment and the active-period badge both read
    // the current mahadasha lord.
    expect(screen.getAllByText(/Saturn \(discipline planet\)/).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Saturn/i })).toBeNull();
  });

  it("prints the bare name with no gloss in TRADITIONAL mode", () => {
    renderTimeline("TRADITIONAL");

    expect(screen.getAllByText(/Saturn/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/discipline planet/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Saturn/i })).toBeNull();
  });

  it("prints the bare name as a tappable gloss in BALANCED mode", () => {
    renderTimeline("BALANCED");

    // Bare canonical name on screen — BALANCED does not inline the gloss.
    expect(screen.queryByText(/Saturn \(discipline planet\)/)).toBeNull();
    const trigger = screen.getByRole("button", { name: "Saturn" });
    expect(trigger).toBeInTheDocument();

    // Tapping it surfaces the same role BEGINNER prints inline.
    fireEvent.click(trigger);
    expect(document.querySelector("[data-glossary-panel]")).toHaveTextContent("discipline planet");
  });

  it("does not turn a graha with no real plain-lang gloss into a dead tap target", () => {
    // PLAIN_LANG's full-name keys leave six of nine grahas bare (graha() with
    // no gloss arg returns the canonical name as its own BiText) — Venus
    // among them, and it's the active bhukti in this fixture. A tooltip that
    // just repeats its own trigger text is worse than no tooltip.
    renderTimeline("BALANCED");

    expect(screen.queryByRole("button", { name: "Venus" })).toBeNull();
    expect(screen.getAllByText("Venus").length).toBeGreaterThan(0);
  });

  it("falls back to the bare name in BALANCED mode for a lord with no plain-lang entry", () => {
    // openingDasha/current use real graha codes; a defensive case for any lord
    // string plainLangBiText doesn't recognize should just render plainly
    // rather than a dead tap target with an empty panel.
    render(
      <DashaTimeline
        dasha={{
          ...buildDasha(),
          current: {
            mahadasha: { lord: "UNKNOWN_LORD", startDate: "2020-01-01", endDate: "2039-01-01" },
            antardasha: { lord: "VENUS", startDate: "2024-01-01", endDate: "2026-06-01" },
            pratyantardasha: { lord: "SUN", startDate: "2026-01-01", endDate: "2026-03-01" },
          },
          timeline: [{ level: "maha", lord: "UNKNOWN_LORD", startDate: "2020-01-01", endDate: "2039-01-01" }],
        }}
        dashaAntar={[]}
        today="2026-02-01"
        dashaSupport={62}
        lang="en"
        mode="BALANCED"
      />,
    );

    expect(screen.queryByRole("button", { name: "UNKNOWN_LORD" })).toBeNull();
    expect(screen.getByText("UNKNOWN_LORD")).toBeInTheDocument();
  });
});
