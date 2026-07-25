/**
 * Render tests for the redesigned dasha timeline (HyBhuktiTimeline). No
 * authenticated dev session is available for a browser pass, so this
 * exercises the actual date-math + rendering path against a synthetic
 * (non-real) Vimshottari fixture reconstructed from the approved mockup:
 * Moon mahadasha (2026-03-13 → 2036-03-13) → Moon bhukti (2026-03-13 →
 * 2027-01-11, 304 days) → Saturn antaram (2026-07-20 → 2026-09-06, 48
 * days), "today" = 2026-07-25 (5 days into Saturn's antaram, 43 left) —
 * the same numbers the mockup itself shows, so a passing test also cross-
 * checks the component against the design reference.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HyBhuktiTimeline } from "./dashboard-hybrid-parts";
import type { DashaTimelineItem, DashaTimelineResponseData } from "@/lib/types";

function addMonths(iso: string, months: number): string {
  // Format back via local getters, not toISOString() (which converts to
  // UTC and drifts a day off local-midnight dates in a +offset timezone).
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MAHA_SEQUENCE: Array<[string, number]> = [
  ["KETU", 7], ["VENUS", 20], ["SUN", 6], ["MOON", 10], ["MARS", 7],
  ["RAHU", 18], ["JUPITER", 16], ["SATURN", 19], ["MERCURY", 17],
];
const BIRTH = "1993-03-13";

function buildMahas(): DashaTimelineItem[] {
  let cursor = BIRTH;
  return MAHA_SEQUENCE.map(([lord, years]) => {
    const start = cursor;
    const end = addMonths(start, years * 12);
    cursor = end;
    return { level: "maha" as const, lord, startDate: start, endDate: end };
  });
}

const BHUKTI_SEQUENCE: Array<[string, number]> = [
  ["MOON", 10], ["MARS", 7], ["RAHU", 18], ["JUPITER", 16], ["SATURN", 19],
  ["MERCURY", 17], ["KETU", 7], ["VENUS", 20], ["SUN", 6],
];

function buildBhuktis(): DashaTimelineItem[] {
  // Moon bhukti's own span is pinned to the exact 304-day window the nested
  // antaram fixture below relies on; the rest just chain by month so every
  // period is a valid, non-overlapping range.
  const items: DashaTimelineItem[] = [
    { level: "antar", lord: "MOON", startDate: "2026-03-13", endDate: "2027-01-11" },
  ];
  let cursor = "2027-01-11";
  for (const [lord, months] of BHUKTI_SEQUENCE.slice(1)) {
    const start = cursor;
    const end = addMonths(start, months);
    cursor = end;
    items.push({ level: "antar", lord, startDate: start, endDate: end });
  }
  return items;
}

// Exact day-precision chain within the running Moon bhukti (2026-03-13 →
// 2027-01-11), matching the mockup's antaram row (25+18+46+40+48+43+18+51+15
// = 304 days).
const ANTARAM_SEQUENCE: Array<[string, string, string]> = [
  ["MOON", "2026-03-13", "2026-04-07"],
  ["MARS", "2026-04-07", "2026-04-25"],
  ["RAHU", "2026-04-25", "2026-06-10"],
  ["JUPITER", "2026-06-10", "2026-07-20"],
  ["SATURN", "2026-07-20", "2026-09-06"],
  ["MERCURY", "2026-09-06", "2026-10-19"],
  ["KETU", "2026-10-19", "2026-11-06"],
  ["VENUS", "2026-11-06", "2026-12-27"],
  ["SUN", "2026-12-27", "2027-01-11"],
];

function buildAntarams(): DashaTimelineItem[] {
  return ANTARAM_SEQUENCE.map(([lord, startDate, endDate]) => ({
    level: "pratyantar" as const,
    lord,
    startDate,
    endDate,
  }));
}

const TODAY = "2026-07-25";

const dashaAntar = buildBhuktis();
const antaramTimeline = buildAntarams();

const dasha: DashaTimelineResponseData = {
  chartId: "test-chart",
  openingDasha: { lord: "KETU", balanceYearsAtBirth: 2.5 },
  current: {
    mahadasha: { lord: "MOON", startDate: "2026-03-13", endDate: "2036-03-13" },
    antardasha: { lord: "MOON", startDate: "2026-03-13", endDate: "2027-01-11" },
    pratyantardasha: { lord: "SATURN", startDate: "2026-07-20", endDate: "2026-09-06" },
  },
  timeline: antaramTimeline,
};

const dashaMaha: DashaTimelineResponseData = {
  chartId: "test-chart",
  openingDasha: dasha.openingDasha,
  current: dasha.current,
  timeline: buildMahas(),
};

describe("HyBhuktiTimeline", () => {
  it("renders nothing when dasha is null", () => {
    const { container } = render(
      <HyBhuktiTimeline lang="en" dasha={null} dashaAntar={[]} today={TODAY} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("computes the exact days-left countdown for the running antaram", () => {
    const { container } = render(
      <HyBhuktiTimeline
        lang="en"
        dasha={dasha}
        dashaMaha={dashaMaha}
        dashaAntar={dashaAntar}
        today={TODAY}
        birthDateLocal={BIRTH}
      />,
    );
    // Saturn antaram: 2026-07-20 -> 2026-09-06 = 48 days, today is 5 days in.
    expect(screen.getByText("43")).toBeInTheDocument();
    expect(screen.getByText("days left")).toBeInTheDocument();
    expect(screen.getByText(/5 of 48 days/)).toBeInTheDocument();
    // en-IN's Intl formatting abbreviates September as "Sept", not "Sep".
    expect(container.textContent).toContain("ends");
    expect(container.textContent).toMatch(/6 Sept?\.? 2026/);
  });

  it("renders the running stack headline with the antaram picked out", () => {
    // Each {expr} in the JSX becomes its own text node, so the words land in
    // separate siblings ("Moon", " ", "Mahadasha") — assert on the combined
    // text content rather than a single-node match.
    const { container } = render(
      <HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} />,
    );
    expect(container.textContent).toContain("Moon Mahadasha");
    expect(container.textContent).toContain("Moon Bhukti");
    expect(container.textContent).toContain("Saturn Antaram");
  });

  it("renders one bar segment per period across all three levels", () => {
    const { container } = render(
      <HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} />,
    );
    // 9 mahadashas + 9 bhuktis + 9 antarams, each a titled segment div.
    expect(container.querySelectorAll("[title]").length).toBe(27);
  });

  // Regression: the first cut hid a segment's label whenever it was under 6%
  // of the row, which blanked the six shortest periods (Ketu/Sun/Mars at every
  // level) into unlabelled boxes. Every segment must name its lord, always.
  it("labels every segment, including the shortest periods", () => {
    const { container } = render(
      <HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} />,
    );
    const segments = Array.from(container.querySelectorAll("[title]"));
    expect(segments).toHaveLength(27);
    for (const seg of segments) {
      expect(seg.textContent?.trim(), `segment "${seg.getAttribute("title")}" is blank`).not.toBe("");
    }
    // Ketu is 7/120 of the mahadasha row (5.8%) — under the old threshold.
    const ketuMaha = segments.find((s) => s.getAttribute("title")?.startsWith("Ketu · 1993"));
    expect(ketuMaha?.textContent).toContain("Ketu");
  });

  it("marks today's position on the mahadasha row", () => {
    const { container } = render(
      <HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} />,
    );
    expect(container.textContent).toMatch(/Today · 25 Jul,? 2026/);
  });

  it("never echoes both languages for the same label (Tamil mode)", () => {
    const { container } = render(
      <HyBhuktiTimeline lang="ta" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} />,
    );
    expect(container.textContent).toContain("இப்போது");
    expect(container.textContent).not.toContain("Right now");
    expect(container.textContent).not.toContain("Mahadasha");
    expect(container.textContent).not.toContain("Bhukti");
    expect(container.textContent).not.toContain("Antaram");
  });

  it("wires the forecast CTA through onOpenForecast", () => {
    let clicked = false;
    render(
      <HyBhuktiTimeline
        lang="en"
        dasha={dasha}
        dashaMaha={dashaMaha}
        dashaAntar={dashaAntar}
        today={TODAY}
        onOpenForecast={() => { clicked = true; }}
      />,
    );
    screen.getByText(/year-ahead forecast/).click();
    expect(clicked).toBe(true);
  });
});
