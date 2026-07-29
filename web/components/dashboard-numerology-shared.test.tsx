/**
 * Coverage for the two numerology display rules that are *silent* when broken —
 * neither shows up as a crash, a type error, or a failed request.
 *
 * 1. **Doctrine D6 — the compound surrogate.** When `compoundBeyondSeries` is
 *    non-null, `compound` is a reduced stand-in for a number Cheiro's 10–52
 *    series never reaches. Printing it bare attributes one number's meaning to a
 *    different number, and it looks completely normal on screen. Ten of twelve
 *    realistic three-part Indian document names measured past 52, so this is the
 *    ordinary case for a full legal name, not a corner.
 *
 * 2. **The prose gate.** `readingsAvailable: false` means the server computed a
 *    reading and withheld the sentences pending Tamil native review. A UI that
 *    renders nothing looks identical to a UI that has nothing to say, and the
 *    difference is the whole point of the field existing.
 *
 * Both are asserted on the shared primitives rather than on each screen, because
 * every screen renders numbers through these.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  AlignmentBasis,
  NumberAlignment,
  NumberReading,
  VerdictBand,
} from "@vinaadi/shared/api/numerology";

import {
  AlignmentRow,
  CompoundLine,
  CompoundSurrogateNote,
  NumberReadingCard,
  ReadingsWithheldNote,
  VerdictScaleStrip,
  WhyThisRating,
  formatReductionChain,
  housesPhrase,
  isNumerologyUnavailable,
  natureGloss,
  natureGlossFor,
  natureLabel,
  overallPlain,
  verdictLabel,
  verdictPlain,
} from "./dashboard-numerology-shared";

function makeReading(overrides: Partial<NumberReading> = {}): NumberReading {
  return {
    total: 27,
    compound: 27,
    root: 9,
    reductionChain: [27, 9],
    graha: "MARS",
    grahaTa: "செவ்வாய்",
    grahaEn: "Mars",
    ignoredCharacters: [],
    compoundBeyondSeries: null,
    letterValues: [],
    // Bibliography — ungated, so the default fixture carries it. Our *meaning*
    // for the same number is gated and therefore defaults to null.
    compoundTitle: "The Sceptre",
    compoundTone: "favourable",
    compoundEchoes: null,
    compoundSource: "Cheiro, Book of Numbers (London: Herbert Jenkins Ltd, 1935 ed.), pp. 126-133",
    compoundReadingEn: null,
    compoundReadingTa: null,
    ...overrides,
  };
}

/**
 * Arithmetically true to the engine, deliberately: yogakaraka bases at 92, and
 * a strength of 71.4 is +5 under the benefic rule, giving 97. The invariant
 * `baseScore + strengthDelta === score` is the one the chain renders, so a
 * fixture that broke it would let a genuinely broken chain pass.
 */
function makeBasis(overrides: Partial<AlignmentBasis> = {}): AlignmentBasis {
  return {
    ownedHouses: [5, 10],
    nodeBasis: null,
    baseScore: 92,
    strengthDelta: 5,
    strengthRule: "amplifies",
    ...overrides,
  };
}

function makeAlignment(overrides: Partial<NumberAlignment> = {}): NumberAlignment {
  return {
    number: 9,
    graha: "MARS",
    grahaTa: "செவ்வாய்",
    grahaEn: "Mars",
    functionalNature: "YOGAKARAKA",
    natalStrength: 71.4,
    score: 97,
    verdict: "strongly_aligned",
    basis: makeBasis(),
    reasonEn: null,
    reasonTa: null,
    ...overrides,
  };
}

/** The ladder as the server derives it from `_VERDICT_CUTOFFS`. */
const SCALE: VerdictBand[] = [
  { verdict: "strongly_aligned", minScore: 78, maxScore: 100 },
  { verdict: "aligned", minScore: 62, maxScore: 77 },
  { verdict: "neutral", minScore: 45, maxScore: 61 },
  { verdict: "misaligned", minScore: 32, maxScore: 44 },
  { verdict: "strongly_misaligned", minScore: 0, maxScore: 31 },
];

describe("CompoundLine — doctrine D6", () => {
  it("prints a real in-series compound with the title and register that cite it", () => {
    render(<CompoundLine reading={makeReading({ compound: 27, compoundBeyondSeries: null })} lang="en" />);
    const text = document.body.textContent ?? "";
    expect(text).toContain("27");
    expect(text).toContain("The Sceptre");
    expect(text).toContain("Favourable");
    expect(text).toContain("Cheiro");
  });

  it("names BOTH numbers when the name ran past the encoded series", () => {
    // 63 reduces to 9; the engine hands back 27 as the encoded surrogate.
    render(
      <CompoundLine
        reading={makeReading({ total: 63, compound: 27, root: 9, compoundBeyondSeries: 63 })}
        lang="en"
      />,
    );
    const text = document.body.textContent ?? "";
    // The name's own total must be present — it is the number being described.
    expect(text).toContain("63");
    // And the stand-in must be named as one, not shown as this name's compound.
    expect(text).toContain("27");
    expect(text.toLowerCase()).toContain("stand-in");
  });

  it("says nothing at all for a single-digit total", () => {
    const { container } = render(
      <CompoundLine reading={makeReading({ total: 7, compound: null, root: 7, reductionChain: [7] })} lang="en" />,
    );
    expect(container.textContent).toBe("");
  });

  it("carries the D6 warning in Tamil too — the gate is not English-only", () => {
    render(
      <CompoundLine
        reading={makeReading({ total: 63, compound: 27, compoundBeyondSeries: 63 })}
        lang="ta"
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("63");
    expect(text).toContain("27");
    // The Tamil word used for "surrogate/substitute" in this copy.
    expect(text).toContain("மாற்று");
  });

  /*
   * Regression — the beyond-series warning used to be swallowed entirely.
   *
   * `compound` is null in TWO opposite situations (app/calculations/numerology.py
   * says so outright): a genuinely single-digit total, and a name whose total
   * runs past 52 with nothing landing in 10..52 on the way down. A name
   * totalling 60 reduces [60, 6] — no compound, but 60 *is* the compound and
   * Sethuraman's series reads it. The old guard `if (compound === null) return
   * null` treated the second case as the first and printed nothing at all, on
   * the very names D6 exists for: ten of twelve realistic three-part Indian
   * document names measure past 52.
   */
  it("still warns when the total ran past the series with NO compound to show", () => {
    render(
      <CompoundLine
        reading={makeReading({ total: 60, compound: null, root: 6, reductionChain: [60, 6], compoundBeyondSeries: 60 })}
        lang="en"
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("60");
    expect(text.toLowerCase()).toContain("up to 52");
    // And it must NOT invent a stand-in that was never sent.
    expect(text.toLowerCase()).not.toContain("stand-in");
  });

  it("warns in Tamil for the no-compound-past-the-series case too", () => {
    render(
      <CompoundSurrogateNote
        reading={makeReading({ total: 60, compound: null, root: 6, reductionChain: [60, 6], compoundBeyondSeries: 60 })}
        lang="ta"
      />,
    );
    expect(document.body.textContent ?? "").toContain("60");
  });

  /*
   * The D6 caveat is the most-read sentence on the panel for a full legal name
   * (ten of twelve realistic three-part Indian names trip it), and it was
   * shipping in the vocabulary of this repo's own doctrine notes: "past the
   * encoded 10–52 series". "Encoded" is an implementation word — it describes
   * our content tables, not anything in Chaldean practice — and a reader who has
   * never seen the codebase cannot parse it. The caveat has to survive contact
   * with a parent reading about their child's name.
   */
  it("states the D6 caveat without implementation vocabulary", () => {
    for (const lang of ["en", "ta"] as const) {
      const { container } = render(
        <CompoundSurrogateNote
          reading={makeReading({ total: 60, compound: null, root: 6, reductionChain: [60, 6], compoundBeyondSeries: 60 })}
          lang={lang}
        />,
      );
      const text = (container.textContent ?? "").toLowerCase();
      expect(text).not.toMatch(/encoded|series|surrogate|doctrine/);
      // It must still carry the fact, not merely avoid the jargon: the ceiling
      // is what explains why this name has no two-digit meaning.
      expect(text).toContain("52");
    }
  });

  it("separates the two null-compound cases — a real single digit stays silent", () => {
    const { container } = render(
      <CompoundLine
        reading={makeReading({ total: 7, compound: null, root: 7, reductionChain: [7], compoundBeyondSeries: null })}
        lang="en"
      />,
    );
    expect(container.textContent).toBe("");
  });
});

/*
 * The citation / prose split (2026-07-29).
 *
 * Two kinds of text were behind one review gate, and only one of them is ours.
 * Cheiro's title for a number cites a printed book; our sentence about what
 * that number means for a person is an unreviewed reading. Conflating them left
 * the compound rendering as a bare integer inside the collapsed working — the
 * senior number in the system, presented as a discarded step of arithmetic.
 */
describe("the compound's citation", () => {
  it("renders the title while our reading of the number stays withheld", () => {
    render(
      <NumberReadingCard
        reading={makeReading({ compoundReadingEn: null })}
        label="Name"
        lang="en"
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("The Sceptre");
    // Nothing has been invented to fill the withheld slot.
    expect(text).not.toMatch(/authority earned by intellect/i);
  });

  it("renders our reading once it clears review, with no further code change", () => {
    render(
      <NumberReadingCard
        reading={makeReading({ compoundReadingEn: "Authority earned by intellect." })}
        label="Name"
        lang="en"
      />,
    );
    expect(screen.getByText("Authority earned by intellect.")).toBeTruthy();
  });

  /*
   * Standing ruling 3, in its breached-by-omission form. Several of Cheiro's
   * titles are alarming read alone — 16 is "The Shattered Citadel", 22 "The
   * Good Man Blinded". A title with no register beside it hands the reader his
   * fatalism and withholds the reframing that makes shipping it defensible.
   */
  it("never shows an alarming classical title without its register", () => {
    render(
      <NumberReadingCard
        reading={makeReading({
          total: 16, compound: 16, root: 7, reductionChain: [16, 7],
          compoundTitle: "The Shattered Citadel", compoundTone: "cautionary",
        })}
        label="Called name"
        lang="en"
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("The Shattered Citadel");
    expect(text).toContain("Cautionary");
  });

  /*
   * The compound must not go back inside `<details>`. It outranks the root —
   * 43 and 34 both reduce to 7 and are read differently — so filing it under
   * "how this was worked out" states the opposite of the doctrine. `<details>`
   * keeps its children in the DOM when closed, so presence is not the check;
   * ancestry is.
   */
  it("keeps the compound OUT of the collapsed working", () => {
    const { container } = render(
      <NumberReadingCard reading={makeReading()} label="Name" lang="en" />,
    );
    const title = screen.getByText("The Sceptre");
    expect(title.closest("details")).toBeNull();
    // …and the disclosure still exists, so this is not passing by its absence.
    expect(container.querySelector("details")).not.toBeNull();
  });

  it("shows no citation for a name past Cheiro's 52 — absent means unencoded", () => {
    render(
      <NumberReadingCard
        reading={makeReading({
          total: 54, compound: null, root: 9, reductionChain: [54, 9],
          compoundBeyondSeries: 54,
          compoundTitle: null, compoundTone: null, compoundEchoes: null,
          compoundSource: null,
        })}
        label="Name"
        lang="en"
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("54");
    expect(text).not.toContain("The Sceptre");
  });
});

describe("the letter-by-letter working", () => {
  it("shows what each letter was worth, from the response and not recomputed", () => {
    render(
      <NumberReadingCard
        reading={makeReading({
          total: 23, compound: 23, root: 5, reductionChain: [23, 5],
          letterValues: [
            { char: "Z", value: 7 }, { char: "O", value: 7 },
            { char: "R", value: 2 }, { char: "O", value: 7 },
          ],
        })}
        label="Name"
        lang="en"
        scoredFrom="Zoro"
      />,
    );
    const text = document.body.textContent ?? "";
    for (const token of ["Z", "O", "R", "7", "2", "23"]) {
      expect(text).toContain(token);
    }
  });

  /*
   * A repeated letter must render once per occurrence. "ZORO" has two O's and
   * each contributes 7; de-duplicating (the obvious `key={lv.char}` mistake)
   * would show a breakdown that visibly fails to add up to the total printed
   * beside it — in the one view whose entire purpose is being checkable.
   */
  it("repeats a letter as many times as it was scored", () => {
    const { container } = render(
      <NumberReadingCard
        reading={makeReading({
          total: 23, compound: 23, root: 5, reductionChain: [23, 5],
          letterValues: [
            { char: "Z", value: 7 }, { char: "O", value: 7 },
            { char: "R", value: 2 }, { char: "O", value: 7 },
          ],
        })}
        label="Name"
        lang="en"
      />,
    );
    const chars = Array.from(container.querySelectorAll("span"))
      .map((node) => node.textContent)
      .filter((value) => value === "O");
    expect(chars.length).toBe(2);
  });

  it("shows nothing for a date-derived number, which has no letters", () => {
    render(
      <NumberReadingCard
        reading={makeReading({ letterValues: [] })}
        label="Psychic"
        lang="en"
      />,
    );
    expect(document.body.textContent ?? "").not.toContain("What each letter is worth");
  });
});

describe("NumberReadingCard", () => {
  it("echoes the exact string that was scored (doctrine D3)", () => {
    render(
      <NumberReadingCard reading={makeReading()} label="Name" lang="en" scoredFrom="Anbarasi Kalyanaraman" />,
    );
    expect(screen.getByText("Anbarasi Kalyanaraman")).toBeTruthy();
  });

  it("shows the graha, not only the digit", () => {
    render(<NumberReadingCard reading={makeReading()} label="Name" lang="en" />);
    expect(screen.getByText("Mars")).toBeTruthy();
  });

  it("inherits the D6 guard rather than reimplementing it", () => {
    render(
      <NumberReadingCard
        reading={makeReading({ total: 63, compound: 27, compoundBeyondSeries: 63 })}
        label="Name"
        lang="en"
      />,
    );
    expect((document.body.textContent ?? "").toLowerCase()).toContain("stand-in");
  });
});

/*
 * The plain-language layer.
 *
 * These assert the *register*, which is the thing that was broken: the panel
 * shipped only expert vocabulary ("Trikona lord · Strength 63") and a reader
 * without jyotisha had no way in. They also guard the boundary that layer walks
 * — it may restate a token the server sent, and may not author meaning the
 * token does not contain, because that corpus is withheld pending Tamil review.
 */
describe("plain-language layer", () => {
  it("leads the card with the verdict in plain words, not the arithmetic", () => {
    render(
      <NumberReadingCard
        reading={makeReading()}
        alignment={makeAlignment({
          verdict: "strongly_aligned",
          functionalNature: "LAGNA_LORD",
          // Mesha lagna Mars: 1st + 8th, lagna lordship overriding the 8th.
          basis: makeBasis({ ownedHouses: [1, 8] }),
        })}
        label="Destiny"
        lang="en"
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("sits well with your chart");
    /* And the reason names the graha's office in this chart — as the *houses*,
       which used to read "rules your rising sign". Both are true; only one can
       be checked against the jadhagam on the next tab, and the untestable
       version is what made the rating feel asserted. */
    expect(text).toContain("Mars rules the 1st and 8th");
    expect(text).toContain("Lagna lord");
  });

  it("keeps the expert term beside the plain one — both readers are served", () => {
    render(<AlignmentRow alignment={makeAlignment({ functionalNature: "TRIKONA" })} lang="en" rank={1} />);
    const text = document.body.textContent ?? "";
    expect(text).toContain("rules one of your fortune houses");
    expect(text).toContain("Trikona lord");
  });

  /*
   * The headline is a weighted average, and before this the parts were invisible
   * — the card showed a verdict chip but never the number behind it. A reader
   * who added a name and watched the total fall had nothing on screen that
   * accounted for the fall. The per-number score is already on the response;
   * withholding it was what made the average look arbitrary.
   */
  it("shows each number's own score so the average is accountable", () => {
    render(
      <NumberReadingCard
        reading={makeReading()}
        alignment={makeAlignment({
          score: 38,
          verdict: "misaligned",
          functionalNature: "MARAKA",
          basis: makeBasis({ baseScore: 38, strengthDelta: 0, strengthRule: "none" }),
          natalStrength: null,
        })}
        label="Name"
        lang="en"
      />,
    );
    expect(document.body.textContent ?? "").toContain("38 / 100");
  });

  it("shows no score where there is no chart to score against", () => {
    // The public calculator renders these cards with no alignment at all.
    render(<NumberReadingCard reading={makeReading()} label="Name" lang="en" />);
    expect(document.body.textContent ?? "").not.toContain("/ 100");
  });

  it("says where each core number came from", () => {
    render(
      <NumberReadingCard reading={makeReading()} label="Psychic" lang="en" hint="from the day of the month you were born" />,
    );
    expect(document.body.textContent ?? "").toContain("from the day of the month you were born");
  });

  it("folds the derivation away but never the caveats", () => {
    render(
      <NumberReadingCard
        reading={makeReading({ total: 60, compound: null, root: 6, reductionChain: [60, 6], compoundBeyondSeries: 60 })}
        label="Name"
        lang="en"
        scoredFrom="Anbarasi Kalyanaraman"
      />,
    );
    // The disclosure exists and starts closed.
    const details = document.querySelector("details");
    expect(details).toBeTruthy();
    expect(details?.hasAttribute("open")).toBe(false);
    // D3 spelling and the D6 warning must sit OUTSIDE it.
    const summaryless = document.querySelector("details")?.textContent ?? "";
    expect(summaryless).not.toContain("Anbarasi Kalyanaraman");
    expect(summaryless).not.toContain("up to 52");
  });

  it("renders every nature and verdict token in both languages", () => {
    const natures = [
      "YOGAKARAKA",
      "LAGNA_LORD",
      "TRIKONA",
      "KENDRA",
      "MARAKA",
      "DUSTHANA",
      "UPACHAYA",
      "NEUTRAL",
    ] as const;
    for (const n of natures) {
      expect(natureGloss(n, "en").length).toBeGreaterThan(0);
      expect(natureGloss(n, "ta").length).toBeGreaterThan(0);
    }
    const verdicts = ["strongly_aligned", "aligned", "neutral", "misaligned", "strongly_misaligned"] as const;
    for (const v of verdicts) {
      expect(verdictPlain(v, "en").length).toBeGreaterThan(0);
      expect(verdictPlain(v, "ta").length).toBeGreaterThan(0);
      expect(overallPlain(v, "en").length).toBeGreaterThan(0);
      expect(overallPlain(v, "ta").length).toBeGreaterThan(0);
    }
  });

  it("never reaches for the fear register — standing ruling 3", () => {
    // Plainer words are exactly where dread would creep in: "maraka" reads as
    // jargon, "a house of death" reads as a threat. The gloss for the two
    // difficult offices must stay descriptive.
    const banned = /unlucky|cursed|doomed|danger|evil|disaster|ruin|destroy|death|misfortune|bad luck/;
    const natures = ["MARAKA", "DUSTHANA", "NEUTRAL"] as const;
    for (const n of natures) {
      expect(natureGloss(n, "en").toLowerCase()).not.toMatch(banned);
    }
    for (const v of ["misaligned", "strongly_misaligned"] as const) {
      expect(verdictPlain(v, "en").toLowerCase()).not.toMatch(banned);
      expect(overallPlain(v, "en").toLowerCase()).not.toMatch(banned);
    }
  });

  it("keeps the aggregate verdict distinct from the single-number one", () => {
    // An average over four numbers is a different claim from one number
    // fitting, and reusing the singular copy would overstate it.
    expect(overallPlain("aligned", "en")).not.toBe(verdictPlain("aligned", "en"));
    expect(overallPlain("aligned", "en").toLowerCase()).toContain("taken together");
  });
});

/*
 * "Why this rating" — the chain.
 *
 * The panel used to show a chip reading *Out of step* and a bare `38 / 100`
 * with nothing joining them. Naming the office ("rules a house of limits") was
 * half a reason; it never said why that office produced *that* rating, what the
 * bands of the scale were, or what the strength printed beside it had done.
 *
 * These assert the link, and the boundary the link walks: every step restates
 * something the server sent (houses, base, delta, band) and none of them reads
 * what a number means for a life, which is the corpus still in review.
 */
describe("WhyThisRating — the five-step chain", () => {
  it("names the actual houses, not 'a house'", () => {
    render(
      <WhyThisRating
        alignment={makeAlignment({
          functionalNature: "MARAKA",
          graha: "VENUS",
          grahaEn: "Venus",
          score: 38,
          verdict: "misaligned",
          basis: makeBasis({ ownedHouses: [2, 7], baseScore: 38, strengthDelta: 0, strengthRule: "none" }),
          natalStrength: null,
        })}
        lang="en"
        scale={SCALE}
      />,
    );
    const text = document.body.textContent ?? "";
    // The claim a reader can check against their own jadhagam.
    expect(text).toContain("Venus rules the 2nd and 7th");
    // The expert term survives — an astrologer must find their own word.
    expect(text).toContain("Maraka lord");
  });

  it("closes the gap the old panel left: office → base → band", () => {
    render(
      <WhyThisRating
        alignment={makeAlignment({
          functionalNature: "KENDRA",
          score: 60,
          verdict: "neutral",
          natalStrength: null,
          basis: makeBasis({ ownedHouses: [4], baseScore: 60, strengthDelta: 0, strengthRule: "none" }),
        })}
        lang="en"
        scale={SCALE}
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("starts a number at 60 out of 100");
    // The step that was entirely missing: which band the score landed in.
    expect(text).toContain("45–61");
    expect(text).toContain("Neutral");
  });

  it("shows a sum that adds up", () => {
    render(
      <WhyThisRating
        alignment={makeAlignment({
          score: 97,
          basis: makeBasis({ baseScore: 92, strengthDelta: 5 }),
        })}
        lang="en"
        scale={SCALE}
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("92");
    expect(text).toContain("+5");
    expect(text).toContain("97");
  });

  /*
   * The single most likely thing on this panel to be reported as a bug.
   *
   * For a malefic lordship a *stronger* graha scores LOWER — strength governs
   * how fully a graha delivers what it rules, not whether what it rules is
   * welcome. "Strength 71" printed beside a fallen score with no rule named is
   * indistinguishable from an arithmetic error, so the rule must be stated.
   */
  it("explains the inverted case rather than leaving it looking like a bug", () => {
    for (const lang of ["en", "ta"] as const) {
      const { container } = render(
        <WhyThisRating
          alignment={makeAlignment({
            functionalNature: "DUSTHANA",
            natalStrength: 71,
            score: 20,
            verdict: "strongly_misaligned",
            basis: makeBasis({ ownedHouses: [6, 11], baseScore: 25, strengthDelta: -5, strengthRule: "inverted" }),
          })}
          lang={lang}
          scale={SCALE}
        />,
      );
      const text = container.textContent ?? "";
      expect(text).toContain("71");
      expect(text).toContain("−5");
      // Not merely the number — the rule that makes the number make sense.
      if (lang === "en") {
        expect(text.toLowerCase()).toContain("not whether what it holds is easy");
      } else {
        expect(text).toContain("எளிதானதா");
      }
    }
  });

  it("says so plainly when the chart carried no strength at all", () => {
    render(
      <WhyThisRating
        alignment={makeAlignment({
          natalStrength: null,
          score: 92,
          basis: makeBasis({ strengthDelta: 0, strengthRule: "none" }),
        })}
        lang="en"
        scale={SCALE}
      />,
    );
    expect(document.body.textContent ?? "").toContain("no strength reading");
  });

  /*
   * Numbers 4 and 7 are Rahu and Ketu, so two of the nine take this path — the
   * ordinary case for a name, not a corner. Neither owns a sign, so "rules the
   * 2nd and 7th" is unavailable and a different sentence is required.
   */
  it("explains a node by its dispositor, naming the host's own houses", () => {
    render(
      <WhyThisRating
        alignment={makeAlignment({
          number: 4,
          graha: "RAHU",
          grahaEn: "Rahu",
          functionalNature: "LAGNA_LORD",
          basis: makeBasis({
            ownedHouses: [],
            nodeBasis: {
              kind: "dispositor",
              occupiedHouse: 9,
              dispositor: "JUPITER",
              dispositorTa: "குரு",
              dispositorEn: "Jupiter",
              dispositorHouses: [1, 4],
            },
          }),
        })}
        lang="en"
        scale={SCALE}
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("rules no sign of its own");
    expect(text).toContain("the 9th");
    expect(text).toContain("Jupiter, which rules the 1st and 4th");
  });

  it("explains a node in a demanding house by the seat, not the host", () => {
    render(
      <WhyThisRating
        alignment={makeAlignment({
          number: 7,
          graha: "KETU",
          grahaEn: "Ketu",
          functionalNature: "DUSTHANA",
          basis: makeBasis({
            ownedHouses: [],
            nodeBasis: {
              kind: "occupied_house",
              occupiedHouse: 8,
              dispositor: null,
              dispositorTa: null,
              dispositorEn: null,
              dispositorHouses: [],
            },
          }),
        })}
        lang="en"
        scale={SCALE}
      />,
    );
    const text = document.body.textContent ?? "";
    expect(text).toContain("the 8th");
    expect(text).toContain("outweighs whose sign it is sitting in");
  });

  it("renders the whole chain in Tamil too — the explanation is not English-only", () => {
    const { container } = render(
      <WhyThisRating
        alignment={makeAlignment({ functionalNature: "TRIKONA", basis: makeBasis({ ownedHouses: [5, 9] }) })}
        lang="ta"
        scale={SCALE}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("இந்த மதிப்பீடு ஏன்");
    // Accusative — the graha *rules* the houses. `இடங்கள் ஆள்கிறது` is not
    // clumsy Tamil, it is ungrammatical, and this is the one screen whose whole
    // job is to sound like a person explaining something.
    expect(text).toContain("5, 9ஆம் இடங்களை ஆள்கிறது");
    expect(text).toContain("திரிகோண அதிபதி");
  });

  it("puts a node's seat in the locative, not the bare nominative", () => {
    const { container } = render(
      <WhyThisRating
        alignment={makeAlignment({
          number: 7,
          graha: "KETU",
          grahaTa: "கேது",
          functionalNature: "DUSTHANA",
          basis: makeBasis({
            ownedHouses: [],
            nodeBasis: {
              kind: "occupied_house",
              occupiedHouse: 8,
              dispositor: null,
              dispositorTa: null,
              dispositorEn: null,
              dispositorHouses: [],
            },
          }),
        })}
        lang="ta"
        scale={SCALE}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("8ஆம் இடத்தில் அமர்ந்துள்ளது");
    // The broken concatenation this replaced.
    expect(text).not.toContain("இடம்த்தில்");
  });

  /*
   * Rolling deploy. `basis` is required by the TS type, but that type is a
   * hand-written claim about the wire and not a proof of it — a web bundle
   * shipped ahead of the backend would read `baseScore` off undefined and blank
   * the whole panel.
   */
  it("degrades to the old one-line why rather than crashing without a basis", () => {
    const alignment = { ...makeAlignment() } as NumberAlignment;
    // @ts-expect-error — simulating a server that predates this field.
    delete alignment.basis;
    const { container } = render(<WhyThisRating alignment={alignment} lang="en" scale={SCALE} />);
    const text = container.textContent ?? "";
    expect(text).toContain("Why");
    expect(text).toContain("most supportive graha");
  });

  it("never reaches for the fear register — standing ruling 3", () => {
    const banned = /unlucky|cursed|doomed|danger|evil|disaster|ruin|destroy|death|misfortune|bad luck/;
    const natures = ["MARAKA", "DUSTHANA", "NEUTRAL", "UPACHAYA"] as const;
    for (const nature of natures) {
      const { container } = render(
        <WhyThisRating
          alignment={makeAlignment({
            functionalNature: nature,
            verdict: "strongly_misaligned",
            score: 20,
            basis: makeBasis({ ownedHouses: [6, 8], baseScore: 25, strengthDelta: -5, strengthRule: "inverted" }),
          })}
          lang="en"
          scale={SCALE}
        />,
      );
      expect((container.textContent ?? "").toLowerCase()).not.toMatch(banned);
    }
  });
});

describe("the scale legend", () => {
  it("draws every band and marks where this score fell", () => {
    render(<VerdictScaleStrip scale={SCALE} score={38} lang="en" />);
    const text = document.body.textContent ?? "";
    expect(text).toContain("38");
    // Both ends labelled, so the direction of the axis is never ambiguous.
    expect(text).toContain("Well out of step");
    expect(text).toContain("Strongly aligned");
  });

  it("renders nothing when the server sent no ladder", () => {
    const { container } = render(<VerdictScaleStrip scale={[]} score={38} lang="en" />);
    expect(container.textContent).toBe("");
  });
});

/*
 * The NEUTRAL contradiction, which only became visible once houses were on
 * screen. `NATURE_GLOSS.NEUTRAL` says "holds no special office in your chart" —
 * true only for a graha that rules nothing. NEUTRAL is reached far more often
 * by *mixed* ownership: Saturn at Mesha lagna rules the 10th and 11th and is
 * NEUTRAL, as is every trikona-plus-dusthana {5,8}/{6,9} cell. Printed beside
 * those houses, the old gloss calls the line above it a liar.
 */
describe("natureGlossFor — NEUTRAL is two different situations", () => {
  it("keeps 'no special office' for a graha that really rules nothing", () => {
    for (const lang of ["en", "ta"] as const) {
      expect(natureGlossFor("NEUTRAL", [], lang)).toBe(natureGloss("NEUTRAL", lang));
    }
  });

  it("stops claiming 'no office' once the houses are known", () => {
    const gloss = natureGlossFor("NEUTRAL", [10, 11], "en");
    expect(gloss).toContain("10th and 11th");
    expect(gloss).not.toContain("no special office");
    expect(natureGlossFor("NEUTRAL", [10, 11], "ta")).toContain("10, 11ஆம் இடங்களை ஆள்கிறது");
  });

  it("leaves every other nature exactly as it was", () => {
    const others = ["LAGNA_LORD", "YOGAKARAKA", "TRIKONA", "KENDRA", "UPACHAYA", "MARAKA", "DUSTHANA"] as const;
    for (const nature of others) {
      expect(natureGlossFor(nature, [2, 7], "en")).toBe(natureGloss(nature, "en"));
    }
  });
});

describe("housesPhrase", () => {
  it("reads as English for one, two and three houses", () => {
    expect(housesPhrase([1], "en")).toBe("the 1st");
    expect(housesPhrase([2, 7], "en")).toBe("the 2nd and 7th");
    expect(housesPhrase([3, 5, 11], "en")).toBe("the 3rd, 5th and 11th");
  });

  it("follows the almanac usage already in this repo for Tamil", () => {
    expect(housesPhrase([9], "ta")).toBe("9ஆம் இடம்");
    expect(housesPhrase([2, 7], "ta")).toBe("2, 7ஆம் இடங்கள்");
  });

  /*
   * Tamil inflects and English does not, so a single phrase reused across "X
   * rules the 2nd" and "it sits in the 9th" is correct in one language and
   * broken in the other. Singular and plural take different stems too.
   */
  it("declines the Tamil noun for the case it is used in", () => {
    expect(housesPhrase([9], "ta", "accusative")).toBe("9ஆம் இடத்தை");
    expect(housesPhrase([2, 7], "ta", "accusative")).toBe("2, 7ஆம் இடங்களை");
    expect(housesPhrase([9], "ta", "locative")).toBe("9ஆம் இடத்தில்");
    expect(housesPhrase([2, 7], "ta", "locative")).toBe("2, 7ஆம் இடங்களில்");
  });

  it("leaves English alone — the preposition belongs to the caller", () => {
    for (const form of ["nominative", "accusative", "locative"] as const) {
      expect(housesPhrase([2, 7], "en", form)).toBe("the 2nd and 7th");
    }
  });

  it("says nothing for a graha that owns nothing", () => {
    expect(housesPhrase([], "en")).toBe("");
    expect(housesPhrase([], "ta")).toBe("");
  });
});

describe("ReadingsWithheldNote — the prose gate", () => {
  it("states the absence when readings are withheld", () => {
    render(<ReadingsWithheldNote lang="en" readingsAvailable={false} />);
    expect((document.body.textContent ?? "").toLowerCase()).toContain("review");
  });

  it("renders nothing once the corpus is available", () => {
    const { container } = render(<ReadingsWithheldNote lang="en" readingsAvailable />);
    expect(container.textContent).toBe("");
  });

  it("states the absence in Tamil as well", () => {
    render(<ReadingsWithheldNote lang="ta" readingsAvailable={false} />);
    expect(document.body.textContent ?? "").toContain("மறுஆய்வில்");
  });
});

describe("AlignmentRow", () => {
  it("leads with the graha and its role in this chart, not the bare number", () => {
    render(<AlignmentRow alignment={makeAlignment()} lang="en" rank={1} />);
    expect(screen.getByText("Mars")).toBeTruthy();
    expect((document.body.textContent ?? "")).toContain("Yogakaraka");
  });

  it("omits the strength clause when the chart carried no natal strength", () => {
    render(<AlignmentRow alignment={makeAlignment({ natalStrength: null })} lang="en" />);
    expect(document.body.textContent ?? "").not.toContain("Strength");
  });
});

describe("vocabulary", () => {
  it("renders every verdict token in both languages", () => {
    const verdicts = [
      "strongly_aligned",
      "aligned",
      "neutral",
      "misaligned",
      "strongly_misaligned",
    ] as const;
    for (const v of verdicts) {
      expect(verdictLabel(v, "en").length).toBeGreaterThan(0);
      expect(verdictLabel(v, "ta").length).toBeGreaterThan(0);
      // Standing ruling 3: a number is never rendered as a warning about a
      // person. None of these labels may reach for the fear register.
      expect(verdictLabel(v, "en").toLowerCase()).not.toMatch(
        /unlucky|cursed|doomed|danger|evil|disaster|ruin|destroy|bad/,
      );
    }
  });

  it("labels UPACHAYA — the nature key the older chart maps predate", () => {
    expect(natureLabel("UPACHAYA", "en")).toBe("Upachaya lord");
    expect(natureLabel("UPACHAYA", "ta").length).toBeGreaterThan(0);
  });

  it("formats a reduction chain, falling back to the root for an empty one", () => {
    expect(formatReductionChain(makeReading({ reductionChain: [87, 15, 6], root: 6 }))).toBe("87 → 15 → 6");
    expect(formatReductionChain(makeReading({ reductionChain: [], root: 4 }))).toBe("4");
  });
});

describe("isNumerologyUnavailable", () => {
  // The flag is checked BEFORE the chart, deliberately, so a flag-off
  // deployment answers 404 identically for a real chart and a made-up one.
  // Reading that 404 as "chart not found" would be a lie about the user's data.
  it("treats a 404 on a numerology route as not-launched", () => {
    expect(
      isNumerologyUnavailable(new Error("404: /charts/abc/numerology/alignment: Not Found")),
    ).toBe(true);
  });

  it("does not swallow a 404 from some other route", () => {
    expect(isNumerologyUnavailable(new Error("404: /charts/abc/remedy-plan: Not Found"))).toBe(false);
  });

  it("does not swallow a real server error on a numerology route", () => {
    expect(
      isNumerologyUnavailable(new Error("500: /charts/abc/numerology/alignment: boom")),
    ).toBe(false);
  });
});
