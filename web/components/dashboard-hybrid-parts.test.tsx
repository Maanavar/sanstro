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
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HyBhuktiTimeline, HyPlanetOrbs } from "./dashboard-hybrid-parts";
import type { ChartCalculateResponseData, DashaTimelineItem, DashaTimelineResponseData } from "@/lib/types";

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

  // T12 (UX_BLINDSPOT_HANDOFF_2026-08-23.md): mode_balanced_desc promises
  // "some terms, with tooltips" for BALANCED mode. This is the panel that
  // promise was silently not kept on — dashboard-dasha.tsx's own
  // DashaLordLabel (BEGINNER's inline gloss / BALANCED's tap-to-explain) was
  // wired into `DashaTimeline`, a component nothing in the app renders;
  // `HyBhuktiTimeline`, the one Family & Charts actually mounts, called
  // tPlanetLord directly with no mode awareness at all. Default mode is
  // BALANCED (no `mode` prop passed) on purpose below — that's what a fresh
  // account actually gets.
  describe("dasha lord name — BALANCED mode (T12)", () => {
    it("makes the running Saturn antaram a tap-to-explain term", () => {
      render(<HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} />);

      // "Right now" hero only — the bar segments stay bare (ellipsis + native
      // title tooltip; see dashboard-hybrid-parts.tsx's own comment).
      const trigger = screen.getByRole("button", { name: "Saturn" });
      fireEvent.click(trigger);
      expect(document.querySelector("[data-glossary-panel]")).toHaveTextContent("discipline planet");
    });

    it("glosses the running Moon mahadasha and bhukti too", () => {
      // Moon had no role of its own in PLAIN_LANG's full-name rows until
      // 2026-08-24, so this hero — the first place a reader meets the running
      // stack — went silent for six of the nine grahas. Both levels are Moon
      // in this fixture, so both get their own trigger.
      render(<HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} />);

      const triggers = screen.getAllByRole("button", { name: "Moon" });
      expect(triggers).toHaveLength(2);
      fireEvent.click(triggers[0]);
      expect(document.querySelector("[data-glossary-panel]")).toHaveTextContent("mind planet");
    });

    // Owner ruling 2026-08-24. The first bhukti of every mahadasha carries its
    // own lord, so one running stack in nine names the same graha twice — and
    // BEGINNER printed the parenthetical on both. Both PERIOD names stay
    // ("Moon Bhukti" is correct and meaningful); only the second gloss goes.
    it("glosses a repeated lord once in BEGINNER mode, keeping both period names", () => {
      const { container } = render(
        <HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} mode="BEGINNER" />,
      );

      expect(container.textContent).toContain("Moon (mind planet) Mahadasha");
      expect(container.textContent).toContain("Moon Bhukti");
      expect(container.textContent).not.toContain("Moon (mind planet) Bhukti");
      // The antaram is a different lord, so it keeps its own gloss.
      expect(container.textContent).toContain("Saturn (discipline planet) Antaram");
    });

    it("keeps BOTH repeated lords tappable in BALANCED mode", () => {
      // The suppression is BEGINNER-only on purpose: here the gloss is a tap
      // target, not inline text. Dropping the second would leave one dotted
      // word and one plain word for the same term, and a reader tapping the
      // one in front of them would get nothing.
      render(<HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} mode="BALANCED" />);

      expect(screen.getAllByRole("button", { name: "Moon" })).toHaveLength(2);
    });

    it("leaves BEGINNER and TRADITIONAL modes as they were", () => {
      const balanced = render(<HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} mode="BALANCED" />);
      expect(screen.getByRole("button", { name: "Saturn" })).toBeInTheDocument();
      balanced.unmount();

      render(<HyBhuktiTimeline lang="en" dasha={dasha} dashaMaha={dashaMaha} dashaAntar={dashaAntar} today={TODAY} mode="TRADITIONAL" />);
      expect(screen.queryByRole("button", { name: "Saturn" })).toBeNull();
      expect(screen.getByText(/Saturn Antaram/)).toBeInTheDocument();
    });
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

/**
 * A-021 / B-020 — the planet row's dignity marks and pada.
 *
 * WHY RENDERED, NOT DATA. The chips were always computed correctly; the finding
 * was that nothing on screen said what they meant. A data-shape test passes in
 * either wording, which is exactly how the gap survived — so these assert what
 * a reader can actually see.
 *
 * The marks cannot be glossed in place: they sit inside the row's own <button>,
 * and a GlossaryTerm is itself a button. Nesting them is invalid markup and
 * fails this repo's permanent axe gate, so the explanation lives in the
 * expanded detail instead. That constraint is load-bearing — if someone
 * "improves" this by wrapping the chips, CI should stop them, not this file.
 */

type OrbPlanet = ChartCalculateResponseData["planets"][number];

function planet(partial: Partial<OrbPlanet> = {}): OrbPlanet {
  return {
    graha: "JUPITER",
    rasiName: "Meena",
    absoluteLongitude: 345.5,
    rasi: 12,
    degreeInRasi: 15.5,
    nakshatra: 26,
    nakshatraName: "Uthirattadhi",
    pada: 3,
    houseFromLagna: 5,
    speedDegPerDay: 0.1,
    isRetrograde: false,
    isCombust: false,
    isCazimi: false,
    d9Rasi: 12,
    isVargottama: false,
    showRetrogradeBadge: false,
    ...partial,
  } as OrbPlanet;
}

/** Render the orbs and open one planet's detail row. */
function openPlanet(pl: OrbPlanet) {
  render(<HyPlanetOrbs lang="en" planets={[pl]} animate={false} />);
  fireEvent.click(screen.getAllByRole("button", { name: /Jupiter/i })[0]!);
}

describe("Planet row — dignity marks (A-021)", () => {
  it("explains a mark the planet actually carries", () => {
    openPlanet(planet({ isCombust: true }));

    const marks = screen.getByTestId("status-marks-JUPITER");
    expect(within(marks).getByText(/close enough to the Sun to be burnt/i)).toBeInTheDocument();
  });

  it("explains Cazimi, and does not describe it as a weakening", () => {
    // The one the first pass missed. Cazimi is combustion's rare OPPOSITE —
    // `birth_conditions.py` scores it BOOST while combustion is a penalty, and
    // the chip tone here is success vs warning. Copy that blurred the two would
    // contradict the engine on the same screen.
    openPlanet(planet({ isCazimi: true }));

    const marks = screen.getByTestId("status-marks-JUPITER");
    expect(within(marks).getByText(/exact centre of the Sun/i)).toBeInTheDocument();
    expect(within(marks).getByText(/strengthens the planet instead of burning it/i)).toBeInTheDocument();
  });

  it("names only the marks on this row, not every mark that exists", () => {
    // A single paragraph that also explained combust and vargottama on a merely
    // retrograde planet read as though those applied to it too.
    openPlanet(planet({ isRetrograde: true, showRetrogradeBadge: true }));

    const marks = screen.getByTestId("status-marks-JUPITER");
    expect(within(marks).getByText(/appears to move backwards/i)).toBeInTheDocument();
    expect(within(marks).queryByText(/burnt by it/i)).toBeNull();
    expect(within(marks).queryByText(/same sign in the D9 chart/i)).toBeNull();
  });

  it("says nothing at all when the planet carries no marks", () => {
    openPlanet(planet());

    expect(screen.queryByTestId("status-marks-JUPITER")).toBeNull();
  });

  it("explains each of several marks when a planet carries more than one", () => {
    openPlanet(planet({ isCombust: true, isVargottama: true }));

    const marks = screen.getByTestId("status-marks-JUPITER");
    expect(within(marks).getByText(/burnt by it/i)).toBeInTheDocument();
    expect(within(marks).getByText(/same sign in the D9 chart/i)).toBeInTheDocument();
  });
});

describe("Planet row — pada (B-020)", () => {
  it("renders the pada as a plain quantity, not a bare number", () => {
    openPlanet(planet({ pada: 3 }));
    fireEvent.click(screen.getByRole("button", { name: /Technical details/i }));

    expect(screen.getByText("3 / 4 · quarter of the birth star")).toBeInTheDocument();
  });

  it("keeps the definition one tap away instead of inline in the fact row", () => {
    // The fact sits in a wrap row beside "D9 sign · Meena". A two-sentence
    // definition as its VALUE makes that row lopsided, so the definition
    // belongs to the glossary entry the label opens.
    openPlanet(planet({ pada: 3 }));
    fireEvent.click(screen.getByRole("button", { name: /Technical details/i }));

    expect(screen.getByRole("button", { name: /^Pada$/i })).toHaveStyle({ cursor: "help" });
    expect(screen.queryByText(/four equal parts of a birth star/i)).toBeNull();
  });
});
