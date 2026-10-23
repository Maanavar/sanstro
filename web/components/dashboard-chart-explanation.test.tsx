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
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import { READING_VIEW_STORAGE_KEY } from "./chart-reading/use-reading-view";

// The lens is remembered per device; without this one test's choice leaks
// into the next.
beforeEach(() => window.localStorage.clear());
import type { ChartCalculateResponseData, ChartYogaInsight } from "@/lib/types";

function makeGajaKesari(overrides: Partial<ChartYogaInsight> = {}): ChartYogaInsight {
  return {
    name: "GAJA_KESARI_PARASHARA",
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

// The Astrologer view is a lazy chunk. Its first import is transformed on
// demand, which measured 1.06 s under load: past findBy's 1 s default.
const LAZY = { timeout: 5000 };

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

  it("renders the note in the Astrologer view's basics tab as well", async () => {
    render(<ChartExplanationPanel {...baseProps} mode="TRADITIONAL" explanation={explanationWith(note)} chart={makeChart([])} />);
    fireEvent.click(screen.getByText("Open chart explanation"));
    expect(screen.getByRole("tab", { name: "Astrologer view" })).toHaveAttribute("aria-selected", "true");
    // The Astrologer view is a lazy chunk; wait for it.
    expect(await screen.findByRole("note", undefined, LAZY)).toHaveTextContent(note.en);
  });

  it("renders nothing when the Lagna is safely inside its sign", () => {
    render(<ChartExplanationPanel {...baseProps} explanation={explanationWith(null)} chart={makeChart([])} />);
    fireEvent.click(screen.getByText("Open chart explanation"));
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});

describe("ChartExplanationPanel — Yogas section renderYogaDoshamPanel override", () => {
  it("invokes the override renderer with the chart's yogas/doshams", async () => {
    const renderYogaDoshamPanel = vi.fn(() => <div>NOVA_YOGA_OVERRIDE</div>);
    render(
      <ChartExplanationPanel
        {...baseProps}
        chart={makeChart([makeGajaKesari()])}
        renderYogaDoshamPanel={renderYogaDoshamPanel}
      />,
    );

    fireEvent.click(screen.getByText("Open chart explanation"));
    fireEvent.click(screen.getByRole("tab", { name: "Astrologer view" }));
    fireEvent.click(await screen.findByText("Chart patterns and difficult placements", undefined, LAZY));

    expect(screen.getByText("NOVA_YOGA_OVERRIDE")).toBeInTheDocument();
    expect(renderYogaDoshamPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        lang: "en",
        yogas: expect.arrayContaining([expect.objectContaining({ name: "GAJA_KESARI_PARASHARA" })]),
        doshams: [],
      }),
    );
  });

  it("falls back to the default panel when no override is provided", async () => {
    render(<ChartExplanationPanel {...baseProps} chart={makeChart([makeGajaKesari()])} />);

    fireEvent.click(screen.getByText("Open chart explanation"));
    fireEvent.click(screen.getByRole("tab", { name: "Astrologer view" }));
    fireEvent.click(await screen.findByText("Chart patterns and difficult placements", undefined, LAZY));

    // Default YogaDoshamPanel renders the yoga's display name as a clickable row.
    expect(screen.getByText("Gaja Kesari Yoga")).toBeInTheDocument();
    expect(screen.queryByText("NOVA_YOGA_OVERRIDE")).not.toBeInTheDocument();
  });
});

describe("ChartExplanationPanel — Story / Astrologer lens (FTR-07)", () => {
  const open = () => fireEvent.click(screen.getByText("Open chart explanation"));
  const lens = (name: string) => screen.getByRole("tab", { name });

  it.each([
    [undefined, "Story"],
    ["BEGINNER", "Story"],
    ["BALANCED", "Story"],
    ["TRADITIONAL", "Astrologer view"],
  ] as const)("mode %s opens in the %s lens", (mode, expected) => {
    render(<ChartExplanationPanel {...baseProps} mode={mode} chart={makeChart([])} />);
    open();
    expect(lens(expected)).toHaveAttribute("aria-selected", "true");
  });

  it("remembers a switch on this device, and a remembered choice beats the mode default", () => {
    const { unmount } = render(<ChartExplanationPanel {...baseProps} chart={makeChart([])} />);
    open();
    fireEvent.click(lens("Astrologer view"));
    expect(window.localStorage.getItem(READING_VIEW_STORAGE_KEY)).toBe("astrologer");
    unmount();

    render(<ChartExplanationPanel {...baseProps} mode="BEGINNER" chart={makeChart([])} />);
    open();
    expect(lens("Astrologer view")).toHaveAttribute("aria-selected", "true");
  });

  it("still renders and switches when storage throws (private windows, blocked site data)", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<ChartExplanationPanel {...baseProps} chart={makeChart([])} />);
    open();
    fireEvent.click(lens("Astrologer view"));
    expect(lens("Astrologer view")).toHaveAttribute("aria-selected", "true");
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it("the Story view opens on chapter 1 and walks forward with Next", () => {
    render(<ChartExplanationPanel {...baseProps} chart={makeChart([])} />);
    open();
    expect(screen.getByRole("tab", { name: /Who you are/ })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: /Next: Your nine planets/ }));
    expect(screen.getByRole("tab", { name: /Your nine planets/ })).toHaveAttribute("aria-selected", "true");
  });

  it("a controlled host drives the lens and hears the switch", () => {
    const onViewChange = vi.fn();
    render(<ChartExplanationPanel {...baseProps} chart={makeChart([])} view="story" onViewChange={onViewChange} />);
    open();
    fireEvent.click(lens("Astrologer view"));
    expect(onViewChange).toHaveBeenCalledWith("astrologer");
    // Controlled: the host has not changed `view`, so the panel stays put.
    expect(lens("Story")).toHaveAttribute("aria-selected", "true");
  });
});
