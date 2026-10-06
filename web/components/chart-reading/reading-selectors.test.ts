import { describe, expect, it } from "vitest";

import type { ChartExplanationFacet, ChartYogaInsight, ChartDoshamInsight } from "@/lib/types";

import { housesRuled } from "./astrologer-ledgers";
import {
  aspectLinesFor,
  carePatterns,
  daysUntil,
  giftPatterns,
  lagnaLordPlacement,
  nextChapter,
  periodProgress,
  guruTone,
  saniTone,
  storyHeadline,
  topActiveYogas,
  topNatalYogas,
  touchedByTransit,
  upcomingMoves,
  whyFacets,
} from "./reading-selectors";

const facet = (key: ChartExplanationFacet["key"], tone: ChartExplanationFacet["tone"]): ChartExplanationFacet => ({
  key,
  tone,
  label: { en: key, ta: key },
  value: { en: `${key} value`, ta: `${key} value` },
});

const yoga = (name: string, strength: ChartYogaInsight["strength"], extra: Partial<ChartYogaInsight> = {}): ChartYogaInsight => ({
  name,
  isPresent: true,
  strength,
  conditionsMet: [],
  cancellationFactors: [],
  dashaActivated: false,
  activationScore: 0,
  isCurrentlyActive: false,
  descriptionTa: "",
  descriptionEn: "",
  ...extra,
});

describe("whyFacets — the at-most-two lines under a planet's verdict", () => {
  it("leads with the engine's synthesis, then CAUTION before BOOST, never NEUTRAL", () => {
    const why = whyFacets({
      facets: [
        facet("navamsa", "BOOST"),
        facet("strength", "NEUTRAL"),
        facet("condition", "CAUTION"),
        facet("synthesis", "NEUTRAL"),
      ],
    });
    expect(why.map((f) => f.key)).toEqual(["synthesis", "condition"]);
  });

  it("keeps placement, activation, transit, remedy and mechanics out of the why", () => {
    const why = whyFacets({
      facets: [
        facet("placement", "CAUTION"),
        facet("activation", "BOOST"),
        facet("transit", "CAUTION"),
        facet("remedy", "BOOST"),
        facet("avastha", "CAUTION"),
        facet("lordship", "CAUTION"),
      ],
    });
    expect(why).toEqual([]);
  });

  it("never returns more than two", () => {
    const why = whyFacets({ facets: [facet("condition", "CAUTION"), facet("navamsa", "CAUTION"), facet("role", "CAUTION")] });
    expect(why).toHaveLength(2);
  });
});

describe("chapter 1", () => {
  it("finds where the Lagna's own lord sits (Kadagam → Moon)", () => {
    expect(lagnaLordPlacement(4, [{ graha: "MOON", houseFromLagna: 5 }])).toEqual({ lord: "MOON", house: 5 });
    expect(lagnaLordPlacement(4, [])).toBeNull();
  });

  it("chapters run in order and the last has no next", () => {
    expect(nextChapter("who")).toBe("planets");
    expect(nextChapter("coming")).toBeNull();
  });
});

describe("storyHeadline", () => {
  it("names the running mahadasa lord and its natal house, so it differs per chart", () => {
    const make = (lord: string, house: number) =>
      ({ currentActivation: { activeLords: [{ level: "MAHADASHA", lord, natalHouseFromLagna: house }] } }) as never;
    const venus2 = storyHeadline(make("VENUS", 2), "en");
    const saturn6 = storyHeadline(make("SATURN", 6), "en");
    expect(venus2).toContain("Venus");
    expect(venus2).toContain("2nd house");
    expect(saturn6).not.toBe(venus2);
    expect(storyHeadline(make("VENUS", 2), "ta")).toContain("சுக்கிரன்");
    expect(storyHeadline(null, "en")).toBeNull();
  });
});

describe("chapter 2 — aspect lines", () => {
  it("draws only the selected planet's aspects, both directions, never a same-sign line", () => {
    const planets = [
      { graha: "MARS", rasi: 1 },
      { graha: "SATURN", rasi: 4 },
      { graha: "MOON", rasi: 7 },
      { graha: "SUN", rasi: 7 },
    ];
    const aspects = [
      { sourcePlanet: "MARS", targetPlanet: "SATURN" },
      { sourcePlanet: "MOON", targetPlanet: "MARS" },
      { sourcePlanet: "SUN", targetPlanet: "MOON" },
    ] as never;
    const lines = aspectLinesFor("MARS", aspects, planets);
    expect(lines.map((l) => `${l.from}>${l.to}`)).toEqual(["MARS>SATURN", "MOON>MARS"]);
    expect(aspectLinesFor("SUN", aspects, planets)).toEqual([]);
    expect(aspectLinesFor(null, aspects, planets)).toEqual([]);
  });

  it("draws a two-way aspect once, marked mutual (found on the fixture: Sun ↔ Saturn)", () => {
    const planets = [{ graha: "SUN", rasi: 4 }, { graha: "SATURN", rasi: 10 }];
    const aspects = [
      { sourcePlanet: "SUN", targetPlanet: "SATURN" },
      { sourcePlanet: "SATURN", targetPlanet: "SUN" },
    ] as never;
    expect(aspectLinesFor("SUN", aspects, planets)).toEqual([
      { from: "SUN", to: "SATURN", fromRasi: 4, toRasi: 10, mutual: true },
    ]);
  });
});

describe("chapter 3", () => {
  it("measures elapsed share of a period and clamps it", () => {
    const today = new Date("2026-10-04T12:00:00");
    expect(periodProgress("2026-01-01", "2027-01-01", today)).toBeGreaterThan(0.7);
    expect(periodProgress("2026-01-01", "2027-01-01", today)).toBeLessThan(0.8);
    expect(periodProgress("2027-01-01", "2028-01-01", today)).toBe(0);
    expect(periodProgress("2020-01-01", "2021-01-01", today)).toBe(1);
    expect(periodProgress("bad", "2021-01-01", today)).toBe(0);
  });

  it("D2: Sani is supportive only in 3/6/11 from the Janma Rasi; every other house needs care", () => {
    expect([3, 6, 11].map(saniTone)).toEqual(["good", "good", "good"]);
    // Not only the named-cycle houses: Phaladeepika 26 names 5/7/9/10 too.
    expect([1, 2, 4, 5, 7, 8, 9, 10, 12].every((h) => saniTone(h) === "care")).toBe(true);
  });

  it("D3: Guru supportive in 2/5/7/9/11, Vinaadi-graded 'Mixed' in 1/3/4/10, care in 6/8/12", () => {
    expect([2, 5, 7, 9, 11].every((h) => guruTone(h) === "good")).toBe(true);
    expect([1, 3, 4, 10].every((h) => guruTone(h) === "steady")).toBe(true);
    expect([6, 8, 12].every((h) => guruTone(h) === "care")).toBe(true);
  });

  it("finds natal planets under Guru's 5/7/9 drishti from its transit house", () => {
    // Guru transiting the 1st aspects the 5th, 7th and 9th.
    const touched = touchedByTransit("JUPITER", 1, [
      { graha: "VENUS", houseFromLagna: 5 },
      { graha: "MARS", houseFromLagna: 7 },
      { graha: "SUN", houseFromLagna: 2 },
    ]);
    expect(touched).toEqual(["MARS", "VENUS"]);
  });

  it("counts days to an event", () => {
    expect(daysUntil("2026-10-14", new Date(2026, 9, 4, 18))).toBe(10);
  });
});

describe("chapter 4 — patterns", () => {
  it("shows at most three benefic yogas, strong first, and never an adverse one as a gift", () => {
    const gifts = giftPatterns(
      [
        yoga("BUDHA_ADITYA_YOGA", "WEAK"),
        yoga("GAJA_KESARI_PARASHARA", "STRONG"),
        yoga("KEMADRUMA_YOGA", "STRONG"),
        yoga("HAMSA_YOGA", "PARTIAL"),
        yoga("AMALA_YOGA", "STRONG"),
        yoga("ABSENT_YOGA", "STRONG", { isPresent: false }),
      ],
      "en",
    );
    expect(gifts).toHaveLength(3);
    expect(gifts.map((g) => g.label)).toEqual(["Strong", "Strong", "Moderate"]);
    expect(gifts.some((g) => /kemadruma/i.test(g.name))).toBe(false);
  });

  it("leaves mitigated doshams out of the care column — that is good news", () => {
    const dosham = (name: string, isCancelled: boolean) =>
      ({ name, isPresent: true, isCancelled, strength: "STRONG", dashaActivated: false }) as unknown as ChartDoshamInsight;
    const care = carePatterns([dosham("MANGAL_DOSHAM", true), dosham("KALA_SARPA_DOSHAM", false)], [], "en");
    expect(care).toHaveLength(1);
  });

  it("does not list a formed-and-cancelled adverse yoga under 'watch' (found on the fixture chart)", () => {
    const cancelledKemadruma = yoga("KEMADRUMA_YOGA", "WEAK", { isPresent: false, cancellationFactors: ["moon_aspected_by_jupiter"] });
    const liveKemadruma = yoga("KEMADRUMA_YOGA", "STRONG");
    expect(carePatterns([], [cancelledKemadruma], "en")).toEqual([]);
    expect(carePatterns([], [liveKemadruma], "en")).toHaveLength(1);
  });
});

describe("D4 / O-25 — top yogas are computed per chart, never a name hierarchy", () => {
  const names = (ys: ChartYogaInsight[]) => ys.map((y) => y.name);

  it("lasting gifts rank by validity, then natal strength, then fewer cancellations, then reach", () => {
    const ranked = topNatalYogas([
      yoga("GAJA_KESARI_PARASHARA", "PARTIAL", { structuralReach: 900 }),
      yoga("AMALA_YOGA", "STRONG", { cancellationFactors: ["malefic_aspect"] }),
      yoga("HAMSA_YOGA", "STRONG", { structuralReach: 210 }),
      yoga("BUDHA_ADITYA_YOGA", "STRONG", { structuralReach: 311 }),
      yoga("LAKSHMI_YOGA", "WEAK", { isPresent: false }),
    ]);
    // Hamsa and Budha-Aditya tie on strength and cancellations; reach breaks
    // the tie. The famous Gaja Kesari loses on strength, whatever its reach.
    expect(names(ranked)).toEqual(["BUDHA_ADITYA_YOGA", "HAMSA_YOGA", "AMALA_YOGA"]);
  });

  it("lasting gifts ignore the running dasa (O-25: activation is a badge there, not a key)", () => {
    // The review's A/B/C case: A is a strong 9th–10th Raja Yoga, dormant now.
    const set = [
      yoga("DHANA_YOGA", "STRONG", { activationTier: "STRONG", activationScore: 90, structuralReach: 320 }),
      yoga("BUDHA_ADITYA_YOGA", "STRONG", { activationTier: "MODERATE", activationScore: 70, structuralReach: 310 }),
      yoga("RAJA_YOGA", "STRONG", { activationTier: "NONE", activationScore: 34, structuralReach: 421 }),
    ];
    expect(names(topNatalYogas(set))).toEqual(["RAJA_YOGA", "DHANA_YOGA", "BUDHA_ADITYA_YOGA"]);
    // …and Running now leaves A out until a dasa activates it.
    expect(names(topActiveYogas(set))).toEqual(["DHANA_YOGA", "BUDHA_ADITYA_YOGA"]);
  });

  it("is independent of input order (no hidden name ordering)", () => {
    const set = [
      yoga("RAJA_YOGA", "PARTIAL", { structuralReach: 110 }),
      yoga("DHANA_YOGA", "PARTIAL", { structuralReach: 420 }),
      yoga("HAMSA_YOGA", "PARTIAL", { structuralReach: 210 }),
    ];
    expect(names(topNatalYogas(set))).toEqual(names(topNatalYogas([...set].reverse())));
    expect(names(topNatalYogas(set))).toEqual(["DHANA_YOGA", "HAMSA_YOGA", "RAJA_YOGA"]);
  });

  it("top_active keeps only what the running dasa activates, strongest activation first", () => {
    const active = topActiveYogas([
      yoga("RAJA_YOGA", "STRONG", { activationTier: "NONE" }),
      yoga("DHANA_YOGA", "PARTIAL", { activationTier: "MODERATE" }),
      yoga("HAMSA_YOGA", "WEAK", { activationTier: "STRONG" }),
    ]);
    expect(names(active)).toEqual(["HAMSA_YOGA", "DHANA_YOGA"]);
  });

  it("keeps ADHI_RAJA_GRADE out of both lists until Saravali is verified in print", () => {
    const set = [
      yoga("ADHI_RAJA_GRADE", "STRONG", { activationTier: "STRONG", structuralReach: 999 }),
      yoga("HAMSA_YOGA", "WEAK", { activationTier: "MODERATE" }),
    ];
    expect(names(topNatalYogas(set))).toEqual(["HAMSA_YOGA"]);
    expect(names(topActiveYogas(set))).toEqual(["HAMSA_YOGA"]);
  });
});

describe("chapter 5 — upcoming moves", () => {
  it("resolves rasi codes to numbers and sorts by date (FTR-02)", () => {
    const moves = upcomingMoves(
      {
        peyarchi: {
          events: [
            { planet: "SATURN", eventDate: "2027-06-01", fromRasi: "MEENAM", toRasi: "MESHAM", houseFromMoon: 7, houseFromLagna: 10, saniCycleAfter: null, explanation: { en: "x", ta: "x" } },
            { planet: "RAHU", eventDate: "2026-12-05", fromRasi: "KUMBAM", toRasi: "MAGARAM", houseFromMoon: 3, houseFromLagna: 7, saniCycleAfter: null, explanation: { en: "y", ta: "y" } },
          ],
        },
      } as never,
      [],
    );
    expect(moves.map((m) => m.planet)).toEqual(["RAHU", "SATURN"]);
    expect(moves[0]).toMatchObject({ fromRasi: 11, toRasi: 10 });
  });
});

describe("lordship ledger", () => {
  it("lists the houses a graha rules from the Lagna, and none for the nodes", () => {
    // Kadagam Lagna: Mars rules Mesham (10th) and Viruchigam (5th).
    expect(housesRuled("MARS", 4)).toEqual([5, 10]);
    expect(housesRuled("MOON", 4)).toEqual([1]);
    expect(housesRuled("RAHU", 4)).toEqual([]);
  });
});
