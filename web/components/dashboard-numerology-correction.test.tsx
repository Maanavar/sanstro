/**
 * Coverage for name correction — the screen that proposes changing a legal name.
 *
 * Two classes of failure here are silent, and both are worse than a crash
 * because the screen keeps looking correct while saying something false.
 *
 * 1. **The three empty states are three different findings.** `alternatives: []`
 *    means "your name already suits your chart" (a result), or "the search found
 *    nothing better" (a report), or "corrections exist and are being withheld"
 *    (the opposite of the first). A UI that renders any two of them alike tells
 *    the user the wrong thing about their own name, and nothing type-checks it.
 *
 * 2. **The legal warning must ride with any recommendation** (doctrine §9.4).
 *    The backend's response model refuses to serialise alternatives without it,
 *    so the wire is guarded — but nothing forces the *client* to render what it
 *    received, and this is the one harm in the numerology feature that is
 *    administrative and real rather than interpretive.
 *
 * The letter diff gets its own block: it is the only view in which a correction
 * is legible at all, and it runs over `letterValues` rather than the spelling
 * strings, which is a correctness decision worth pinning.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  LetterValue,
  NameCorrectionResponse,
  NameVariant,
  NumberAlignment,
  NumberReading,
} from "@vinaadi/shared/api/numerology";

import {
  CorrectionResult,
  markChangedLetters,
  operationLabel,
} from "./dashboard-numerology-correction-nova";

/* ── Fixtures ────────────────────────────────────────────────────────────── */

function letters(pairs: Array<[string, number]>): LetterValue[] {
  return pairs.map(([char, value]) => ({ char, value }));
}

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
    compoundTitle: "The Sceptre",
    compoundTone: "favourable",
    compoundEchoes: null,
    compoundSource: "Cheiro, Book of Numbers (1935 ed.), pp. 126-133",
    compoundReadingEn: null,
    compoundReadingTa: null,
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
    basis: {
      ownedHouses: [5, 10],
      nodeBasis: null,
      baseScore: 92,
      strengthDelta: 5,
      strengthRule: "amplifies",
    },
    reasonEn: null,
    reasonTa: null,
    ...overrides,
  };
}

function makeVariant(overrides: Partial<NameVariant> = {}): NameVariant {
  return {
    spelling: "Raajesh",
    reading: makeReading({ total: 72, root: 9 }),
    operations: ["lengthen_vowel"],
    delta: 5,
    alignment: makeAlignment({ score: 81 }),
    improvement: 14,
    ...overrides,
  };
}

function makeResponse(overrides: Partial<NameCorrectionResponse> = {}): NameCorrectionResponse {
  return {
    original: "Rajesh",
    originalReading: makeReading({ total: 67, root: 4 }),
    originalAlignment: makeAlignment({ score: 38, verdict: "misaligned" }),
    alternatives: [],
    changeAdvised: false,
    noChangeReason: null,
    alternativesWithheldReason: null,
    variantsConsidered: 0,
    lagnaRasi: 1,
    legalWarningEn: null,
    legalWarningTa: null,
    readingsAvailable: false,
    calculationVersion: "numerology-correction-v1",
    traditionEn: "Chaldean",
    traditionTa: "கல்தேயம்",
    ...overrides,
  };
}

/* ── The letter diff ─────────────────────────────────────────────────────── */

describe("markChangedLetters", () => {
  it("marks nothing when the two spellings score identically", () => {
    const same = letters([["R", 2], ["A", 1], ["J", 1]]);
    expect(markChangedLetters(same, same).every((m) => !m.changed)).toBe(true);
  });

  it("marks only the lengthened vowel, not the whole name", () => {
    // Rajesh -> Raajesh: one 'A' inserted at index 1.
    const original = letters([["R", 2], ["A", 1], ["J", 1], ["E", 5], ["S", 3], ["H", 5]]);
    const variant = letters([["R", 2], ["A", 1], ["A", 1], ["J", 1], ["E", 5], ["S", 3], ["H", 5]]);

    const marks = markChangedLetters(original, variant);
    expect(marks.filter((m) => m.changed)).toHaveLength(1);
    // The prefix and suffix either side must be left alone — a diff that marks
    // the whole tail is useless as a "look here" highlight.
    expect(marks[0].changed).toBe(false);
    expect(marks[marks.length - 1].changed).toBe(false);
  });

  it("marks an appended vowel at the end", () => {
    const original = letters([["V", 6], ["I", 1], ["J", 1], ["A", 1], ["Y", 1]]);
    const variant = letters([["V", 6], ["I", 1], ["J", 1], ["A", 1], ["Y", 1], ["A", 1]]);

    const marks = markChangedLetters(original, variant);
    expect(marks.filter((m) => m.changed)).toHaveLength(1);
    expect(marks[marks.length - 1].changed).toBe(true);
  });

  it("runs over scored letters, so spaces in the spelling cannot shift it", () => {
    // `score_text` drops spaces and uppercases, so a two-word name arrives as
    // one unbroken letter sequence. Diffing raw spellings would misalign every
    // index after the space; this pins that the function is fed the right thing.
    const original = letters([["R", 2], ["A", 1], ["M", 4], ["K", 2], ["U", 6]]);
    const variant = letters([["R", 2], ["A", 1], ["M", 4], ["K", 2], ["K", 2], ["U", 6]]);

    const marks = markChangedLetters(original, variant);
    expect(marks.filter((m) => m.changed)).toHaveLength(1);
    expect(marks.map((m) => m.letter.char).join("")).toBe("RAMKKU");
  });
});

/* ── The operation vocabulary ────────────────────────────────────────────── */

describe("operationLabel", () => {
  it("never leaks a raw enum key to a user, in either language", () => {
    const ops = [
      "lengthen_vowel",
      "shorten_vowel",
      "double_consonant",
      "add_aspirate",
      "drop_aspirate",
      "append_vowel",
      "swap_final_glide",
    ] as const;

    for (const op of ops) {
      for (const lang of ["en", "ta"] as const) {
        const label = operationLabel(op, lang);
        expect(label).toBeTruthy();
        expect(label).not.toContain("_");
      }
    }
  });
});

/* ── The three empty states ──────────────────────────────────────────────── */

/**
 * Rendered through the section is not possible without mocking the fetch, so
 * these assert the copy maps directly. That is the layer where the three
 * findings could be conflated — the branch logic below them is a plain ternary.
 */
describe("the three no-alternatives findings stay distinct", () => {
  it("a benefic-lordship result never reads like a withheld one", () => {
    const benefic = makeResponse({ noChangeReason: "benefic_lordship" });
    const withheld = makeResponse({ alternativesWithheldReason: "pending_content_review" });

    const { container: a } = render(<CorrectionResult data={benefic} lang="en" />);
    const beneficText = a.textContent ?? "";

    const { container: b } = render(<CorrectionResult data={withheld} lang="en" />);
    const withheldText = b.textContent ?? "";

    expect(beneficText).toContain("already suits your chart");
    expect(withheldText).toContain("not available yet");
    // The specific inversion this test exists to catch.
    expect(withheldText).not.toContain("already suits your chart");
    expect(withheldText).not.toContain("nothing here to correct");
  });

  it("a searched-and-found-nothing result says the search ran", () => {
    const { container } = render(
      <CorrectionResult
        data={makeResponse({ noChangeReason: "no_better_spelling", variantsConsidered: 90 })}
        lang="en"
      />,
    );
    expect(container.textContent).toContain("examined");
  });
});

/* ── Doctrine §9.4 at the render layer ───────────────────────────────────── */

describe("the legal warning ships with any recommendation", () => {
  it("renders the warning whenever alternatives are on screen", () => {
    render(
      <CorrectionResult
        data={makeResponse({
          alternatives: [makeVariant()],
          changeAdvised: true,
          variantsConsidered: 90,
          legalWarningEn: "Changing the spelling of a legal name is an administrative act… Aadhaar, PAN, bank KYC…",
          legalWarningTa: "சட்டப்பூர்வப் பெயரின் எழுத்தை மாற்றுவது…",
        })}
        lang="en"
      />,
    );

    expect(screen.getByText(/Aadhaar/)).toBeTruthy();
    expect(screen.getByText("Raajesh")).toBeTruthy();
    // The denominator: three of ninety reads very differently to three of six.
    expect(screen.getByText(/of 90 spellings examined/)).toBeTruthy();
  });

  it("renders the Tamil warning in Tamil, not the English one", () => {
    const { container } = render(
      <CorrectionResult
        data={makeResponse({
          alternatives: [makeVariant()],
          changeAdvised: true,
          variantsConsidered: 90,
          legalWarningEn: "English warning mentioning Aadhaar",
          legalWarningTa: "தமிழ் எச்சரிக்கை",
        })}
        lang="ta"
      />,
    );
    expect(container.textContent).toContain("தமிழ் எச்சரிக்கை");
    expect(container.textContent).not.toContain("English warning mentioning Aadhaar");
  });
});
