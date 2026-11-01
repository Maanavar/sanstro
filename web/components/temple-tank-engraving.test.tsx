import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SkyPhase } from "@/lib/sky-phase";
import { CELESTIAL, ENGRAVING_VIEWBOX, TempleTankEngraving, skyReach } from "./temple-tank-engraving";

const PHASES: SkyPhase[] = ["dawn", "day", "dusk", "night"];

describe("TempleTankEngraving draws the reader's hour", () => {
  it("leaves the sky empty until the hour is known (server render, before mount)", () => {
    const { container } = render(<TempleTankEngraving phase={null} />);
    expect(container.querySelector(".tte-sky")).toBeNull();
    expect(container.querySelector(".tte-lamps")).toBeNull();
  });

  it.each(PHASES)("draws the %s sky", (phase) => {
    const { container } = render(<TempleTankEngraving phase={phase} />);
    expect(container.querySelector(".tte-sky")?.getAttribute("data-phase")).toBe(phase);
  });

  it("lights the mandapam lamps only at night", () => {
    for (const phase of PHASES) {
      const { container, unmount } = render(<TempleTankEngraving phase={phase} />);
      expect(container.querySelector(".tte-lamps") !== null).toBe(phase === "night");
      unmount();
    }
  });

  it("is decorative: hidden from assistive tech, no colour of its own", () => {
    const { container } = render(<TempleTankEngraving phase="day" />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });

  it("keeps two instances' masks apart (header and closing share a page)", () => {
    const { container } = render(<><TempleTankEngraving phase="day" /><TempleTankEngraving phase="day" /></>);
    const ids = [...container.querySelectorAll("mask")].map((m) => m.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("the header's sky scene keeps the gopuram out from under the view switch", () => {
  // 2026-10-28: with the full plate behind the header, the switch stood on the
  // gopuram's crown. The header renders scene="sky"; only the closing has the temple.
  it("plate has the gopuram, sky does not", () => {
    expect(render(<TempleTankEngraving phase="day" />).container.querySelector(".tte-gopuram")).not.toBeNull();
    expect(render(<TempleTankEngraving phase="day" scene="sky" />).container.querySelector(".tte-gopuram")).toBeNull();
  });
});

describe("every hour's sun or moon fits the band crop", () => {
  // The band crop is what both placements show. A body whose glow or rays cross
  // the crop's top edge is cut by a hard line (seen 2026-10-28 with the band at
  // y=110). The left 30% is the closing's copy column, so no body may reach it.
  const [, top] = ENGRAVING_VIEWBOX.band.split(" ").map(Number);
  it.each(PHASES)("%s stays inside the crop and clear of the copy", (phase) => {
    const { cx, cy } = CELESTIAL[phase];
    const reach = skyReach(phase);
    expect(cy - reach).toBeGreaterThanOrEqual(top);
    expect(cx - reach).toBeGreaterThan(1200 * 0.3);
  });
});
