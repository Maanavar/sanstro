"use client";

import type { CSSProperties, ReactNode } from "react";
import { Info } from "lucide-react";

import type { Lang } from "@/lib/i18n";
import type {
  AlignmentVerdict,
  CompoundTone,
  FunctionalNature,
  NodeBasis,
  NumberAlignment,
  NumberReading,
  VerdictBand,
} from "@vinaadi/shared/api/numerology";

import { Card } from "./ui/card";
import { Chip } from "./ui/chip";
import { Kicker } from "./ui/kicker";

/**
 * Shared vocabulary and primitives for the numerology surfaces (Phase 7).
 *
 * ## Why this file is mostly a dictionary
 *
 * The backend deliberately ships numerology as **numbers and enum tokens, with
 * every interpretive sentence withheld** — `numerology_content.CONTENT_REVIEWED`
 * is `False` until the Tamil corpus clears a native review, so `reasonEn`,
 * `reasonTa`, `recommendationEn`, `noteEn` and friends all arrive `null`. Every
 * response carries `readingsAvailable` so a client can tell *"withheld pending
 * review"* apart from *"there is no note for this row"*.
 *
 * That gate only holds if the frontend respects it. The rule for anything added
 * here: **render tokens, never author meaning.** Turning `"strongly_aligned"`
 * into "Strongly aligned" is rendering a token in the client's own vocabulary.
 * Writing "your name number suits Saturn, so expect steady progress" would be
 * smuggling the withheld corpus past the gate that the backend enforces — do not
 * do it, in either language, however small the sentence looks.
 *
 * What *is* legitimate copy here: labels for enum values, names of fields, and
 * statements about the data itself ("the name totals 63, which is past the
 * encoded series"). Those are facts about the calculation, not readings of a
 * person.
 *
 * ## Two doctrine rules this file exists to enforce
 *
 * 1. **A number never overrides a graha.** Alignment is scored from the graha's
 *    *functional nature in this chart*, so the graha and its role are rendered
 *    with equal or greater weight than the number everywhere below.
 * 2. **Doctrine D6 — `compoundBeyondSeries`.** When it is non-null the
 *    `compound` on the same reading is a *reduced surrogate*: the meaning of a
 *    different number than the name actually makes. Ten of twelve realistic
 *    three-part Indian document names measured past Cheiro's 52. `CompoundLine`
 *    below refuses to print a bare compound in that case — it names both
 *    numbers and says which one is being described.
 *
 * ## What changed 2026-07-29, and why it was a correctness fix
 *
 * The compound used to render as a faint `Compound 31` **inside** the collapsed
 * *How this was worked out* disclosure, between "Adds up to 31" and "Reduced to
 * a single digit". That is the presentation of an intermediate arithmetic step
 * — and the engine's own docstring opens by saying the compound *outranks* the
 * root and that collapsing to a single digit is the tell of a bad
 * implementation. The UI was doing, visually, the exact thing the engine
 * refuses to do numerically.
 *
 * It now renders as a peer of the root, outside the disclosure, carrying
 * Cheiro's classical title and register. Those arrive on the wire ungated
 * (`compoundTitle`, `compoundTone`) because they cite a printed book rather
 * than assert anything about the reader — the rule at the top of this file is
 * unchanged, and `compoundReadingEn`/`Ta`, which *are* our sentences about a
 * person, remain null until the corpus clears review.
 */

/* ── Verdict + functional-nature vocabulary ─────────────────────────────────
 *
 * `AlignmentVerdict` and `FunctionalNature` cross the wire as enum keys
 * precisely so each client renders them in its own words. These are ours.
 *
 * Standing ruling 3 (the banned fear trade) applies to every string in this
 * file: a number is never rendered as a warning about a person. A low alignment
 * says the number is *out of step with this chart* — a statement about a fit
 * between two things — not that the number, or its owner, is unlucky.
 */

type Tone = "high" | "mid" | "low" | "neutral" | "accent";

type VerdictSpec = { en: string; ta: string; tone: Tone };

export const VERDICT_LABEL: Record<AlignmentVerdict, VerdictSpec> = {
  strongly_aligned: { en: "Strongly aligned", ta: "மிகவும் இணக்கம்", tone: "high" },
  aligned: { en: "Aligned", ta: "இணக்கம்", tone: "high" },
  neutral: { en: "Neutral", ta: "நடுநிலை", tone: "neutral" },
  misaligned: { en: "Out of step", ta: "ஒத்துவரவில்லை", tone: "mid" },
  strongly_misaligned: { en: "Well out of step", ta: "மிகவும் ஒத்துவரவில்லை", tone: "low" },
};

/**
 * Kept deliberately consistent with the labels already used by the chart
 * explanation and jadhagam report panels — the same enum must not read as two
 * different vocabularies in two tabs. `UPACHAYA` is the one key those maps
 * predate; the alignment engine emits it, so it is labelled here.
 */
export const NATURE_LABEL: Record<FunctionalNature, { en: string; ta: string }> = {
  LAGNA_LORD: { en: "Lagna lord", ta: "லக்னாதிபதி" },
  YOGAKARAKA: { en: "Yogakaraka", ta: "யோககாரகன்" },
  TRIKONA: { en: "Trikona lord", ta: "திரிகோண அதிபதி" },
  KENDRA: { en: "Kendra lord", ta: "கேந்திர அதிபதி" },
  UPACHAYA: { en: "Upachaya lord", ta: "உபசய அதிபதி" },
  MARAKA: { en: "Maraka lord", ta: "மாரகாதிபதி" },
  DUSTHANA: { en: "Dusthana lord", ta: "துஷ்டானாதிபதி" },
  NEUTRAL: { en: "Neutral", ta: "நடுநிலை" },
};

export function verdictLabel(verdict: AlignmentVerdict, lang: Lang): string {
  const spec = VERDICT_LABEL[verdict];
  if (!spec) return verdict.replaceAll("_", " ");
  return lang === "ta" ? spec.ta : spec.en;
}

export function verdictTone(verdict: AlignmentVerdict): Tone {
  return VERDICT_LABEL[verdict]?.tone ?? "neutral";
}

export function natureLabel(nature: FunctionalNature, lang: Lang): string {
  const spec = NATURE_LABEL[nature];
  if (!spec) return nature.replaceAll("_", " ");
  return lang === "ta" ? spec.ta : spec.en;
}

/* ── The plain-language layer ───────────────────────────────────────────────
 *
 * `NATURE_LABEL` above is the *expert* vocabulary: "Trikona lord" means
 * something exact to a reader who already has jyotisha, and nothing at all to
 * everyone else. The screens were shipping only that register, so a first-time
 * reader met "Trikona lord · Strength 63" and had no way in.
 *
 * These two maps are the other register. Read the rule in this file's header
 * before adding to them, because the line they walk is narrow:
 *
 *   ALLOWED — restating a token the server sent, in plainer words. `TRIKONA`
 *   means this graha rules a trikona house *in this chart*; saying so in
 *   English is the same act as writing "Trikona lord", just legible. Likewise
 *   `strongly_aligned` → "sits well with your chart" is the enum, spelled out.
 *
 *   NOT ALLOWED — anything the token does not already contain. "Ketu rules a
 *   fortune house" is a render. "Ketu rules a fortune house, so expect travel
 *   and sudden gains" is the withheld corpus, smuggled. The tell is whether the
 *   sentence would change if the person changed: a gloss would not, a reading
 *   would.
 *
 * Neither map replaces the expert label — every surface renders both, the plain
 * clause leading and the technical term kept beside it. An astrologer reading
 * over a client's shoulder must still find their own word on the screen.
 */

/**
 * What each office *is*, as a clause that completes "<Graha> …".
 *
 * Standing ruling 3 (the banned fear trade) binds hardest here. MARAKA and
 * DUSTHANA are the two offices a numerology product would be tempted to sell
 * dread with; they are stated as what they are — houses of limit and of effort
 * — and not as omens. A misfitting number is a statement about fit, never a
 * warning about the person holding it.
 */
export const NATURE_GLOSS: Record<FunctionalNature, { en: string; ta: string }> = {
  LAGNA_LORD: { en: "rules your rising sign", ta: "உங்கள் லக்னத்தை ஆள்கிறது" },
  YOGAKARAKA: { en: "is the most supportive graha in your chart", ta: "உங்கள் ஜாதகத்தின் மிக ஆதரவான கிரகம்" },
  TRIKONA: { en: "rules one of your fortune houses", ta: "உங்கள் அதிர்ஷ்ட ஸ்தானம் ஒன்றை ஆள்கிறது" },
  KENDRA: { en: "rules one of your pillar houses", ta: "உங்கள் மையஸ்தானம் ஒன்றை ஆள்கிறது" },
  UPACHAYA: { en: "rules a house that grows with effort", ta: "முயற்சியால் வளரும் ஸ்தானத்தை ஆள்கிறது" },
  MARAKA: { en: "rules a house of limits and endings", ta: "எல்லைகள், முடிவுகளின் ஸ்தானத்தை ஆள்கிறது" },
  DUSTHANA: { en: "rules one of your most demanding houses", ta: "அதிக உழைப்புக் கேட்கும் ஸ்தானம் ஒன்றை ஆள்கிறது" },
  NEUTRAL: { en: "holds no special office in your chart", ta: "இந்த ஜாதகத்தில் தனிப்பட்ட பொறுப்பு இல்லை" },
};

export function natureGloss(nature: FunctionalNature, lang: Lang): string {
  const spec = NATURE_GLOSS[nature];
  if (!spec) return "";
  return lang === "ta" ? spec.ta : spec.en;
}

/**
 * The same gloss, corrected once the actual houses are known.
 *
 * `NATURE_GLOSS.NEUTRAL` says *"holds no special office in your chart"*, and
 * that is only true for a graha that rules nothing — a node with no recorded
 * position. NEUTRAL is reached far more often by **mixed** ownership: Saturn at
 * Mesha lagna rules the 10th and the 11th and is NEUTRAL, and every
 * trikona-plus-dusthana `{5,8}`/`{6,9}` cell in `functional_nature.py` lands
 * here too. Once `ownedHouses` is on screen beside it, "no special office"
 * contradicts the houses printed one line above — the two lines call each other
 * liars, and the reader is right to believe the houses.
 *
 * Every other nature is unaffected; only NEUTRAL is ambiguous between "rules
 * nothing" and "rules things that cancel out".
 */
export function natureGlossFor(
  nature: FunctionalNature,
  ownedHouses: number[] | undefined,
  lang: Lang,
): string {
  if (nature === "NEUTRAL" && ownedHouses?.length) {
    return lang === "ta"
      ? `${housesPhrase(ownedHouses, lang, "accusative")} ஆள்கிறது — இரு பக்கமும் இழுக்கும் கலவை, அதனால் இங்கே நடுநிலை`
      : `rules ${housesPhrase(ownedHouses, lang)} — a mix that pulls both ways, so it reads as neutral here`;
  }
  return natureGloss(nature, lang);
}

/** The verdict ladder, said in words a first-time reader already owns. */
export const VERDICT_PLAIN: Record<AlignmentVerdict, { en: string; ta: string }> = {
  strongly_aligned: {
    en: "This number sits well with your chart.",
    ta: "இந்த எண் உங்கள் ஜாதகத்துடன் நன்றாகப் பொருந்துகிறது.",
  },
  aligned: { en: "This number sits comfortably with your chart.", ta: "இந்த எண் உங்கள் ஜாதகத்துடன் பொருந்துகிறது." },
  neutral: {
    en: "This number neither helps nor hinders in your chart.",
    ta: "இந்த எண் உங்கள் ஜாதகத்தில் உதவவும் இல்லை, தடுக்கவும் இல்லை.",
  },
  misaligned: { en: "This number pulls against your chart.", ta: "இந்த எண் உங்கள் ஜாதகத்திற்கு எதிராக இழுக்கிறது." },
  strongly_misaligned: {
    en: "This number pulls strongly against your chart.",
    ta: "இந்த எண் உங்கள் ஜாதகத்திற்கு வலுவாக எதிராக இழுக்கிறது.",
  },
};

export function verdictPlain(verdict: AlignmentVerdict, lang: Lang): string {
  const spec = VERDICT_PLAIN[verdict];
  if (!spec) return "";
  return lang === "ta" ? spec.ta : spec.en;
}

/**
 * The same ladder for the *aggregate* verdict. Separate from `VERDICT_PLAIN`
 * because the subject differs — one number sitting well with a chart and a
 * whole set of numbers averaging out to "aligned" are different claims, and
 * reusing the singular copy would quietly overstate the second. "Taken
 * together" is doing real work: it marks the number as an average, which is
 * what `overallScore` is.
 *
 * **Currently rendered by nothing**, and kept deliberately. The alignment panel
 * dropped its blended headline (see `dashboard-numerology-alignment-nova.tsx`
 * for why: an average across the fixed/changeable boundary buried the one
 * actionable number). `overallScore` is still on the response, so the vocabulary
 * for it stays here rather than being re-derived by whoever renders a blend
 * next — but if a headline returns, it belongs inside one section, not across
 * both.
 */
export const OVERALL_PLAIN: Record<AlignmentVerdict, { en: string; ta: string }> = {
  strongly_aligned: {
    en: "Taken together, your numbers sit well with your chart.",
    ta: "மொத்தத்தில், உங்கள் எண்கள் ஜாதகத்துடன் நன்றாகப் பொருந்துகின்றன.",
  },
  aligned: {
    en: "Taken together, your numbers sit comfortably with your chart.",
    ta: "மொத்தத்தில், உங்கள் எண்கள் ஜாதகத்துடன் பொருந்துகின்றன.",
  },
  neutral: {
    en: "Taken together, your numbers neither help nor hinder.",
    ta: "மொத்தத்தில், உங்கள் எண்கள் உதவவும் இல்லை, தடுக்கவும் இல்லை.",
  },
  misaligned: {
    en: "Taken together, your numbers pull against your chart.",
    ta: "மொத்தத்தில், உங்கள் எண்கள் ஜாதகத்திற்கு எதிராக இழுக்கின்றன.",
  },
  strongly_misaligned: {
    en: "Taken together, your numbers pull strongly against your chart.",
    ta: "மொத்தத்தில், உங்கள் எண்கள் ஜாதகத்திற்கு வலுவாக எதிராக இழுக்கின்றன.",
  },
};

export function overallPlain(verdict: AlignmentVerdict, lang: Lang): string {
  const spec = OVERALL_PLAIN[verdict];
  if (!spec) return "";
  return lang === "ta" ? spec.ta : spec.en;
}

/* ── "Why this rating" — the chain, not a restatement ───────────────────────
 *
 * The panel used to stop one step short. It said *"Venus rules a house of
 * limits and endings (Maraka lord)"* and then showed a chip reading *Out of
 * step* and a bare `38 / 100`, with nothing joining the two. A reader could not
 * tell why a kendra lord lands on Neutral while a trikona lord lands on
 * Aligned, what the bands of the 0-100 scale even are, or what the `Strength
 * 63` beside it had done to the number. That is not a missing sentence, it is a
 * missing *link*, and the whole rating reads as arbitrary without it.
 *
 * Every step below is a fact about the calculation and is therefore ours to
 * state — see this file's header. `basis` arrives ungated for exactly this
 * reason: houses ruled, base score, strength adjustment and band are arithmetic
 * and lordship. They would change if the chart changed; they would not change
 * if the person did. Nothing here reads what a number *means* for a life, which
 * is the corpus still in review.
 *
 * The five steps, and why each earns its line:
 *
 *   1. number → graha        the link the reader is asked to accept up front
 *   2. graha  → office       named with the ACTUAL houses, not "a house"
 *   3. office → base score   the step that was entirely missing
 *   4. strength → adjustment including the inverted case, which looks like a
 *                            bug if it is shown without its rule
 *   5. score  → band         the number placed on a scale that is drawn
 */

/** 1st … 12th. Houses only, so the irregular teens never arise. */
function ordinalEn(house: number): string {
  if (house === 1) return "1st";
  if (house === 2) return "2nd";
  if (house === 3) return "3rd";
  return `${house}th`;
}

/**
 * The grammatical case the phrase is being used in.
 *
 * English does not inflect and ignores this — the preposition comes from the
 * caller ("sits in the 9th"). **Tamil does**, and getting it wrong is not a
 * stylistic quibble: `இடம் ஆள்கிறது` and `இடம்த்தில்` are not clumsy Tamil,
 * they are ungrammatical, and this copy sits on the one screen whose whole
 * purpose is to sound like a person explaining something.
 */
type HouseCase = "nominative" | "accusative" | "locative";

/** `இடம்` declined. Singular and plural take different stems. */
const TA_HOUSE_SUFFIX: Record<HouseCase, { one: string; many: string }> = {
  nominative: { one: "ஆம் இடம்", many: "ஆம் இடங்கள்" },
  accusative: { one: "ஆம் இடத்தை", many: "ஆம் இடங்களை" },
  locative: { one: "ஆம் இடத்தில்", many: "ஆம் இடங்களில்" },
};

/**
 * "the 2nd and 7th" / "2, 7ஆம் இடங்கள்".
 *
 * Tamil follows the almanac usage already in this repo — `இடம்` for house (see
 * `web/lib/i18n.ts`) — with the ordinal suffix carried once by the last number,
 * which is how it is written and said.
 */
export function housesPhrase(
  houses: number[],
  lang: Lang,
  form: HouseCase = "nominative",
): string {
  if (!houses.length) return "";
  if (lang === "ta") {
    const suffix = TA_HOUSE_SUFFIX[form];
    return `${houses.join(", ")}${houses.length > 1 ? suffix.many : suffix.one}`;
  }
  const parts = houses.map(ordinalEn);
  if (parts.length === 1) return `the ${parts[0]}`;
  return `the ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Whose chart this card is explaining.
 *
 * Every numerology surface but one is reading the signed-in user's own chart,
 * so "your chart" was hardcoded throughout. Baby Name Finder breaks that: the
 * birth details in its form are the **child's**, so every "your chart" /
 * "your paadham" on that surface named the wrong person — and a reader who
 * notices reasonably concludes no chart is being used at all, which is exactly
 * the doubt it produced. Never infer the subject from the copy; pass it.
 */
export type ChartSubject = "self" | "child";

/** "In your chart" / "In this child's chart" — the sentence opener. */
function inChartPhrase(subject: ChartSubject, lang: Lang): string {
  if (lang === "ta") {
    return subject === "child" ? "இந்தக் குழந்தையின் ஜாதகத்தில்" : "உங்கள் ஜாதகத்தில்";
  }
  return subject === "child" ? "In this child's chart" : "In your chart";
}

/**
 * What each role *is*, as a clause completing "That makes it a <term> — …".
 *
 * Distinct from `NATURE_GLOSS`, which is a clause completing "<Graha> …" and
 * describes the houses. This one describes the **role**, so it stays correct
 * however many houses are listed in front of it — the reason the sentence is
 * built this way rather than by pluralising a noun phrase. `LAGNA_LORD` owning
 * the 1st *and* the 8th, and `YOGAKARAKA` owning a kendra *and* a trikona, both
 * break any single description of "the houses" and neither breaks this.
 *
 * Says "role", not "office": "office" is a translator's word for அதிபதி that
 * no first-time reader owns, and the expert term (`natureLabel`) is already on
 * screen immediately before this clause, so nothing is lost by making the
 * gloss beside it plain.
 *
 * `{self}` in `LAGNA_LORD` is filled from `ChartSubject` — it is the one role
 * whose description names a person, so it is the one that goes wrong when the
 * chart belongs to someone other than the reader.
 *
 * Standing ruling 3 binds as hard here as in `NATURE_GLOSS`: MARAKA and
 * DUSTHANA are roles of limit and of effort, never omens.
 */
export const NATURE_OFFICE: Record<FunctionalNature, { en: string; ta: string }> = {
  LAGNA_LORD: {
    en: "the role that stands for {self}",
    ta: "{self}யே குறிக்கும் பொறுப்பு",
  },
  YOGAKARAKA: {
    en: "a pillar house and a fortune house at once, which is the most supportive thing a graha can hold",
    ta: "கேந்திரமும் திரிகோணமும் சேர்ந்த பொறுப்பு — ஒரு கிரகம் பெறக்கூடிய மிக ஆதரவான நிலை",
  },
  TRIKONA: { en: "a role of fortune", ta: "அதிர்ஷ்டத்தின் பொறுப்பு" },
  KENDRA: { en: "a role that holds the chart up", ta: "ஜாதகத்தைத் தாங்கும் பொறுப்பு" },
  UPACHAYA: { en: "a role that grows with effort", ta: "முயற்சியால் வளரும் பொறுப்பு" },
  MARAKA: { en: "the role of limits and endings", ta: "எல்லைகள், முடிவுகளின் பொறுப்பு" },
  DUSTHANA: {
    en: "the most demanding role in a chart",
    ta: "ஜாதகத்தில் அதிக உழைப்புக் கேட்கும் பொறுப்பு",
  },
  NEUTRAL: {
    en: "a mixed role that pulls both ways, so it settles at neutral",
    ta: "இரு பக்கமும் இழுக்கும் கலப்புப் பொறுப்பு — அதனால் நடுநிலை",
  },
};

/** `NATURE_OFFICE` with `{self}` resolved for whoever owns this chart. */
function natureOfficeClause(
  nature: FunctionalNature,
  subject: ChartSubject,
  lang: Lang,
): string | undefined {
  const office = NATURE_OFFICE[nature];
  if (!office) return undefined;
  const self =
    lang === "ta"
      ? subject === "child"
        ? "குழந்தையை"
        : "உங்களை"
      : subject === "child"
        ? "the child"
        : "you yourself";
  return (lang === "ta" ? office.ta : office.en).replace("{self}", self);
}

/**
 * Step 2 for a node, which owns no sign and so cannot be explained the way the
 * seven can.
 *
 * Numbers 4 and 7 are Rahu and Ketu, so two of the nine take this path — the
 * ordinary case for a name, not a corner. The two branches are the classical
 * rule and they are genuinely different reasons, so they get different
 * sentences: a node in a 6/8/12 reads as demanding *whatever* sign it sits in,
 * and otherwise it borrows its host's office outright.
 */
function nodeOwnershipLine(
  alignment: NumberAlignment,
  basis: NodeBasis,
  lang: Lang,
  subject: ChartSubject,
): string {
  const isTamil = lang === "ta";
  const graha = grahaLabel(alignment, lang);
  const inChart = inChartPhrase(subject, lang);
  const owns = isTamil
    ? `${graha} தனக்கென எந்த ராசியையும் ஆள்வதில்லை.`
    : `${graha} rules no sign of its own.`;

  if (basis.kind === "no_position") {
    return isTamil
      ? `${owns} இந்த ஜாதகத்தில் அது எங்கு அமர்ந்துள்ளது என்ற பதிவு இல்லை, எனவே நடுநிலையாகப் படிக்கப்படுகிறது.`
      : `${owns} This chart did not record where it sits, so it is read as neutral — neither helping nor hindering.`;
  }

  const seatHouses = basis.occupiedHouse ? [basis.occupiedHouse] : [];
  // Locative in Tamil — the node *sits in* the house. English gets the bare
  // ordinal and supplies its own preposition; the word "house" is spelled out
  // because "sits in the 8th" leaves a first-time reader to guess the noun.
  const seatTa = housesPhrase(seatHouses, "ta", "locative");
  const seatEn = `${housesPhrase(seatHouses, "en")} house`;

  if (basis.kind === "occupied_house") {
    return isTamil
      ? `${owns} ${inChart} அது ${seatTa} அமர்ந்துள்ளது — அதிக உழைப்புக் கேட்கும் இடங்களில் ஒன்று. இது எந்த ராசியில் அமர்ந்துள்ளது என்பதையும் மீறி நிற்கும்.`
      : `${owns} ${inChart} it sits in ${seatEn} — one of the demanding houses — and that outweighs whose sign it is sitting in.`;
  }

  const host = isTamil ? basis.dispositorTa : basis.dispositorEn;
  const hostClause = basis.dispositorHouses.length
    ? isTamil
      ? `${host} — ${housesPhrase(basis.dispositorHouses, "ta", "accusative")} ஆள்பவர்`
      : `${host}, which rules ${housesPhrase(basis.dispositorHouses, "en")} ${basis.dispositorHouses.length > 1 ? "houses" : "house"}`
    : `${host}`;
  return isTamil
    ? `${owns} ${inChart} அது ${seatTa} அமர்ந்து, அந்த ராசியின் அதிபதியான ${hostClause} — அவரது தன்மையையே எடுத்துக்கொள்கிறது.`
    : `${owns} ${inChart} it sits in ${seatEn}, so it takes its character from the lord of that sign: ${hostClause}.`;
}

/** Step 2 for the seven grahas that do own signs. */
function ownershipLine(alignment: NumberAlignment, lang: Lang, subject: ChartSubject): string {
  const houses = alignment.basis.ownedHouses;
  if (!houses.length) {
    // No houses and not a node: fall back to the vaguer gloss rather than
    // printing a sentence with a hole in it.
    return `${grahaLabel(alignment, lang)} ${natureGloss(alignment.functionalNature, lang)}.`;
  }
  // English spells out "house(s)" — "rules the 1st and 8th" reads as an
  // unfinished phrase to anyone who does not already know the noun. Tamil
  // does not need it: `TA_HOUSE_SUFFIX` already carries இடம்.
  return lang === "ta"
    ? `${inChartPhrase(subject, lang)} ${grahaLabel(alignment, lang)} ${housesPhrase(houses, lang, "accusative")} ஆள்கிறது.`
    : `${inChartPhrase(subject, lang)}, ${grahaLabel(alignment, lang)} rules ${housesPhrase(houses, lang)} ${houses.length > 1 ? "houses" : "house"}.`;
}

/**
 * Step 4 — what natal strength did, and the rule it did it under.
 *
 * `inverted` is why `strengthRule` is on the wire at all. For a malefic
 * lordship a *stronger* graha scores **lower**, because strength governs how
 * fully a graha delivers what it rules and not whether what it rules is
 * welcome. Printing "Strength 71" beside a score that fell, with no rule named,
 * shows the reader what looks exactly like an arithmetic mistake — and it is
 * the single most likely thing on this panel to be reported as a bug.
 */
function strengthLine(alignment: NumberAlignment, lang: Lang): string {
  const { strengthRule, strengthDelta } = alignment.basis;
  const isTamil = lang === "ta";
  const graha = grahaLabel(alignment, lang);
  if (strengthRule === "none" || alignment.natalStrength === null) {
    return isTamil
      ? `இந்த ஜாதகத்தில் ${graha}-க்கான பலம் பதிவாகவில்லை, எனவே பொறுப்பு மட்டுமே மதிப்பெண்ணை முடிவு செய்கிறது.`
      : `This chart carried no strength reading for ${graha}, so the role alone sets the score.`;
  }
  const strength = Math.round(alignment.natalStrength);

  // Branch on the REALISED delta — the very number printed beside this
  // sentence — not on the rule alone. The rule-only version asserted "a
  // supportive role held by a STRONG graha delivers MORE of that support"
  // while the adjustment printed next to it read ±0, because 50 is the
  // midpoint and a graha at 49 is not strong. A sentence that describes a
  // mechanism the adjacent number shows doing nothing reads as broken, and it
  // was the single most confusing line on the card.
  if (strengthDelta === 0) {
    return isTamil
      ? `${graha}-இன் பலம் ${strength} — சராசரிக்கு அருகில். எனவே பலம் இந்த மதிப்பெண்ணைக் கூட்டவும் இல்லை, குறைக்கவும் இல்லை.`
      : `${graha}'s strength here is ${strength}, which is about average — so strength neither adds to nor takes from this score.`;
  }

  const rose = strengthDelta > 0;
  if (strengthRule === "inverted") {
    // The genuinely surprising one: a STRONGER malefic lord scores LOWER.
    return isTamil
      ? `${graha}-இன் பலம் ${strength}. பலம் என்பது ஒரு கிரகம் தன் பொறுப்பை எவ்வளவு முழுமையாக நிறைவேற்றும் என்பதைச் சொல்கிறதே தவிர, அந்தப் பொறுப்பு எளிதானதா என்பதை அல்ல — எனவே கடினமான பொறுப்பில் உள்ள ${rose ? "வலுக்குறைந்த கிரகம் அதைக் குறைவாகவே உணர்த்தும்" : "வலுவான கிரகம் அதை இன்னும் அதிகமாக உணர்த்தும்"}.`
      : `${graha}'s strength here is ${strength}. Strength decides how fully a graha delivers what it holds, not whether what it holds is easy — so a ${rose ? "weaker graha in a demanding role makes that role felt less" : "stronger graha in a demanding role makes that role felt more, not less"}.`;
  }
  if (strengthRule === "damped") {
    return isTamil
      ? `${graha}-இன் பலம் ${strength} — சராசரியை விட ${rose ? "அதிகம்" : "குறைவு"}. இந்தப் பொறுப்பு ஆதரவானதும் அல்ல, கடினமானதும் அல்ல — எனவே பலம் பாதி அளவே கணக்கில் கொள்ளப்படுகிறது.`
      : `${graha}'s strength here is ${strength}, ${rose ? "above" : "below"} the average of 50. This role is neither supportive nor demanding, so strength counts for half.`;
  }
  return isTamil
    ? `${graha}-இன் பலம் ${strength} — சராசரியை விட ${rose ? "அதிகம்" : "குறைவு"}. ஆதரவான பொறுப்பில் உள்ள கிரகம் வலுவாக இருந்தால் அந்த ஆதரவை ${rose ? "முழுமையாகத் தருகிறது" : "அவ்வளவு முழுமையாகத் தருவதில்லை"}.`
    : `${graha}'s strength here is ${strength}, ${rose ? "above" : "below"} the average of 50 — so it delivers ${rose ? "more" : "less"} of that support.`;
}

/**
 * What the panel said before `basis` existed — kept solely as the rolling-deploy
 * fallback for `WhyThisRating`. Correct as far as it goes; it simply stops one
 * step short of joining the office to the rating, which is the gap the five-step
 * chain exists to close.
 */
function WhyLineFallback({ alignment, lang }: { alignment: NumberAlignment; lang: Lang }) {
  const gloss = natureGloss(alignment.functionalNature, lang);
  if (!gloss) return null;
  return (
    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
      <span style={{ color: "var(--color-faint)" }}>{lang === "ta" ? "ஏன்" : "Why"} · </span>
      <span style={{ color: "var(--color-text)" }}>{grahaLabel(alignment, lang)}</span> {gloss}
      <span style={{ color: "var(--color-faint)" }}>
        {" "}
        ({natureLabel(alignment.functionalNature, lang)})
      </span>
    </div>
  );
}

/** A signed integer, so "+5" and "−4" both read as an adjustment. */
function signed(delta: number): string {
  if (delta === 0) return "±0";
  return delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`;
}

/**
 * The five-step chain collapsed into one sentence a first-time reader owns.
 *
 * Written from the same three facts the steps use — the graha, its functional
 * role, and the verdict band — so it can never claim something the working
 * below contradicts. It deliberately does NOT restate the score: the number is
 * already three lines up at display size, and repeating it is what made the
 * card feel like it was arguing with itself.
 *
 * The direction verb comes off `verdict`, not off the raw score, because the
 * band is what step 5 names — a summary saying "works with" beside a step
 * saying "Out of step" is the same defect this whole pass is fixing.
 */
function plainSummary(alignment: NumberAlignment, subject: ChartSubject, lang: Lang): string {
  const isTamil = lang === "ta";
  const graha = grahaLabel(alignment, lang);
  const term = natureLabel(alignment.functionalNature, lang);
  const whose = isTamil
    ? subject === "child"
      ? "இந்தக் குழந்தையின் ஜாதகத்தில்"
      : "உங்கள் ஜாதகத்தில்"
    : subject === "child"
      ? "this child's chart"
      : "your chart";

  const supportive =
    alignment.verdict === "strongly_aligned" || alignment.verdict === "aligned";
  const against =
    alignment.verdict === "misaligned" || alignment.verdict === "strongly_misaligned";

  if (isTamil) {
    const lead = `${alignment.number} என்ற எண் ${graha}-க்குரியது; ${whose} ${graha} ${term}.`;
    if (supportive) return `${lead} அதனால் இந்தப் பெயரின் எண்ணும் ஜாதகமும் ஒரே திசையில் இழுக்கின்றன.`;
    if (against) return `${lead} அதனால் இந்தப் பெயரின் எண் ஜாதகத்துக்கு எதிர்த் திசையில் இழுக்கிறது.`;
    return `${lead} அதனால் இந்தப் பெயரின் எண் ஜாதகத்துக்கு உதவவும் இல்லை, தடையாகவும் இல்லை.`;
  }

  const lead = `${alignment.number} is ${graha}'s number, and in ${whose} ${graha} is ${term}.`;
  if (supportive) return `${lead} So this name's number and the chart pull the same way.`;
  if (against) return `${lead} So this name's number pulls against the chart.`;
  return `${lead} So this name's number neither helps nor hinders the chart.`;
}

/**
 * `plainSummary` compressed to a single scannable clause for a collapsed row.
 *
 * "Mars · Lagna lord · works with the chart" — the graha, its role, and the
 * direction, in that order, because a reader skimming a list of names wants to
 * know *which way this one points* before anything else. Direction comes off
 * `verdict`, never the raw score, so the row and the expanded step 5 can never
 * disagree.
 */
export function oneLineWhy(alignment: NumberAlignment, lang: Lang): string {
  const isTamil = lang === "ta";
  const graha = grahaLabel(alignment, lang);
  const term = natureLabel(alignment.functionalNature, lang);
  const supportive =
    alignment.verdict === "strongly_aligned" || alignment.verdict === "aligned";
  const against =
    alignment.verdict === "misaligned" || alignment.verdict === "strongly_misaligned";
  const direction = isTamil
    ? supportive
      ? "ஜாதகத்தோடு ஒத்துப்போகிறது"
      : against
        ? "ஜாதகத்துக்கு எதிராக இழுக்கிறது"
        : "உதவவும் இல்லை, தடையும் இல்லை"
    : supportive
      ? "works with the chart"
      : against
        ? "pulls against the chart"
        : "neither helps nor hinders";
  return `${graha} · ${term} · ${direction}`;
}

function StepRow({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "var(--space-2)", alignItems: "flex-start" }}>
      <span
        style={{
          flex: "none",
          width: "18px",
          fontSize: "var(--text-xs)",
          color: "var(--color-faint)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.55,
        }}
        aria-hidden="true"
      >
        {index}
      </span>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {children}
      </span>
    </div>
  );
}

/**
 * The full derivation of one number's rating, in words a first-time reader owns.
 *
 * Deliberately NOT inside `CalculationDetails`. The complaint this answers is
 * that the rating appears unexplained, and an explanation a reader has to know
 * to go looking for is, for that reader, still missing. The collapsed
 * disclosure keeps what it already had: the letter-by-letter arithmetic.
 */
export function WhyThisRating({
  alignment,
  lang,
  scale,
  subject = "self",
}: {
  alignment: NumberAlignment;
  lang: Lang;
  /** The ladder off the response. Omit and step 5 states the band it knows. */
  scale?: VerdictBand[] | null;
  /** Whose chart this is. See `ChartSubject` — Baby Name Finder is "child". */
  subject?: ChartSubject;
}) {
  const isTamil = lang === "ta";
  const { basis } = alignment;
  // `basis` is required by the type, but the type is a hand-written claim about
  // the wire and not a proof of it — a web bundle deployed ahead of the backend
  // would read `baseScore` off undefined and blank the panel. Fall back to the
  // one-line why this replaced rather than crash on a rolling deploy.
  if (!basis) return <WhyLineFallback alignment={alignment} lang={lang} />;
  const band = scale?.find((b) => b.verdict === alignment.verdict);
  const officeClause = natureOfficeClause(alignment.functionalNature, subject, lang);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        paddingTop: "var(--space-2)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {/* The whole chain in one sentence, ABOVE the numbered steps.
          The five steps are a correct derivation and were still failing the
          reader they were written for: a first-time reader does not assemble
          five clauses into a claim, they read the first line and stop. This
          says the finding; the steps below remain the working, for anyone who
          wants to check it or argue with it. */}
      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.55 }}>
        {plainSummary(alignment, subject, lang)}
      </div>

      <div
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 700,
          color: "var(--color-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          paddingTop: "var(--space-1)",
        }}
      >
        {isTamil ? "இது எப்படிக் கணக்கிடப்பட்டது" : "How that was worked out"}
      </div>

      <StepRow index={1}>
        {isTamil
          ? `${alignment.number} — ${grahaLabel(alignment, lang)}-இன் எண்.`
          : `${alignment.number} is ${grahaLabel(alignment, lang)}'s number.`}
      </StepRow>

      <StepRow index={2}>
        {basis.nodeBasis
          ? nodeOwnershipLine(alignment, basis.nodeBasis, lang, subject)
          : ownershipLine(alignment, lang, subject)}{" "}
        {officeClause ? (
          <>
            {isTamil ? "அது " : "That makes it "}
            {/* The expert term stays on screen, deliberately: an astrologer
                reading over the user's shoulder must find their own word. The
                plain gloss after the dash is what the reader gets. */}
            <span style={{ color: "var(--color-text)" }}>
              {natureLabel(alignment.functionalNature, lang)}
            </span>
            {isTamil ? " — " : " — "}
            {officeClause}.
          </>
        ) : null}
      </StepRow>

      <StepRow index={3}>
        {isTamil
          ? `இந்தப் பொறுப்பு ஒரு எண்ணை 100-க்கு ${basis.baseScore} என்ற அளவில் தொடங்கி வைக்கிறது.`
          : `That role sets this number's starting score at ${basis.baseScore} out of 100.`}
      </StepRow>

      <StepRow index={4}>
        {strengthLine(alignment, lang)}{" "}
        <span style={{ color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>
          {signed(basis.strengthDelta)}
        </span>
      </StepRow>

      <StepRow index={5}>
        {band
          ? isTamil
            ? `${alignment.score} என்பது ${band.minScore}–${band.maxScore} வரம்பில் விழுகிறது — அதை நாங்கள் "${verdictLabel(alignment.verdict, lang)}" என்கிறோம்.`
            : `${alignment.score} falls in the ${band.minScore}–${band.maxScore} band, which we call "${verdictLabel(alignment.verdict, lang)}".`
          : isTamil
            ? `மொத்தம் ${alignment.score} — அதை நாங்கள் "${verdictLabel(alignment.verdict, lang)}" என்கிறோம்.`
            : `That totals ${alignment.score}, which we call "${verdictLabel(alignment.verdict, lang)}".`}
      </StepRow>

      {scale?.length ? <VerdictScaleStrip scale={scale} score={alignment.score} lang={lang} /> : null}
    </div>
  );
}

/**
 * The ladder, drawn — the legend that was missing entirely.
 *
 * A `38 / 100` is unreadable without it: nothing on the old panel said where
 * the cuts fell, so the same score could have been anywhere from poor to
 * middling as far as a reader could tell. Bands come off the response
 * (`verdictScale`) rather than a TypeScript copy of the cutoffs, so the legend
 * and the scoring cannot drift apart.
 *
 * Rendered left-to-right worst-to-best, which is the direction a 0-100 axis is
 * read in, while the response ships best-first.
 */
export function VerdictScaleStrip({
  scale,
  score,
  lang,
}: {
  scale: VerdictBand[];
  score: number;
  lang: Lang;
}) {
  if (!scale.length) return null;
  const ascending = [...scale].sort((a, b) => a.minScore - b.minScore);
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "var(--space-2)" }}>
      <div
        style={{ display: "flex", flexDirection: "row", height: "6px", borderRadius: "var(--radius-pill)", overflow: "hidden" }}
        role="img"
        aria-label={
          lang === "ta"
            ? `100-க்கு ${Math.round(score)} — ${verdictLabel(scale.find((b) => score >= b.minScore && score <= b.maxScore)?.verdict ?? "neutral", lang)}`
            : `${Math.round(score)} out of 100 — ${verdictLabel(scale.find((b) => score >= b.minScore && score <= b.maxScore)?.verdict ?? "neutral", lang)}`
        }
      >
        {ascending.map((b) => (
          <span
            key={b.verdict}
            style={{
              flex: `${b.maxScore - b.minScore + 1} 1 0`,
              background: SCALE_TONE_BG[verdictTone(b.verdict)],
            }}
          />
        ))}
      </div>
      {/* The marker is a separate row so it can sit anywhere along the axis
          without the bar itself needing a positioning context per band. */}
      <div style={{ position: "relative", height: "14px" }}>
        <span
          style={{
            position: "absolute",
            left: `${clamped}%`,
            transform: "translateX(-50%)",
            fontSize: "var(--text-xs)",
            color: "var(--color-text)",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ▲ {Math.round(score)}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
        <span>{verdictLabel(ascending[0].verdict, lang)}</span>
        <span>{verdictLabel(ascending[ascending.length - 1].verdict, lang)}</span>
      </div>
    </div>
  );
}

/**
 * Band fills for the scale bar.
 *
 * The `--color-*-border` tokens, not the `--color-*` inks: those are the
 * ~0.32-alpha tints the kit defines for exactly this (a tone-carrying surface
 * that is not text), and they are declared in both the dark and light blocks of
 * `dashboard-nova.css`, so the strip themes for free. Full-strength `--color-low`
 * on a 6px bar would put the kit's loudest red on a legend, which ruling 3 does
 * not allow anything in this feature to reach for.
 */
const SCALE_TONE_BG: Record<Tone, string> = {
  high: "var(--color-high-border)",
  accent: "var(--color-accent-muted)",
  neutral: "var(--color-neutral-border)",
  mid: "var(--color-mid-border)",
  low: "var(--color-low-border)",
};

/** Text-colour equivalent, for tone carried by a word rather than a chip —
 *  see `CompoundInSeries`, where Cheiro's register reads as attributed text,
 *  not a competing verdict chip. */
const TONE_TEXT: Record<Tone, string> = {
  high: "var(--color-high)",
  accent: "var(--color-accent)",
  neutral: "var(--color-muted)",
  mid: "var(--color-mid)",
  low: "var(--color-low)",
};

/**
 * The derivation, folded away.
 *
 * Native `<details>` rather than React state: it is keyboard- and
 * screen-reader-correct for free, it prints expanded, and the contents stay in
 * the DOM for find-in-page. Nothing *load-bearing* may be hidden in here —
 * doctrine D3's scored-from string and doctrine D6's surrogate warning both
 * stay outside it, because a reader must not have to opt in to a caveat.
 */
export function CalculationDetails({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <details className="num-calc-details">
      <summary
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-faint)",
          cursor: "pointer",
          listStyle: "revert",
        }}
      >
        {lang === "ta" ? "இது எப்படிக் கணக்கிடப்பட்டது" : "How this was worked out"}
      </summary>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingTop: "var(--space-2)" }}>
        {children}
      </div>
    </details>
  );
}

/** Graha display name straight off the response — never re-derived client-side. */
export function grahaLabel(reading: { grahaTa: string; grahaEn: string }, lang: Lang): string {
  return lang === "ta" ? reading.grahaTa : reading.grahaEn;
}

/** The four core numbers, named. Field labels, not readings. */
export const CORE_NUMBER_LABEL = {
  psychic: { en: "Psychic", ta: "ஆன்ம எண்" },
  destiny: { en: "Destiny", ta: "விதி எண்" },
  name: { en: "Name", ta: "பெயர் எண்" },
  namesake: { en: "Called name", ta: "அழைக்கும் பெயர்" },
} as const;

export type CoreNumberKind = keyof typeof CORE_NUMBER_LABEL;

export function coreNumberLabel(kind: CoreNumberKind, lang: Lang): string {
  return lang === "ta" ? CORE_NUMBER_LABEL[kind].ta : CORE_NUMBER_LABEL[kind].en;
}

/**
 * Where each core number comes from. "Psychic" and "Destiny" are terms of art
 * that tell a newcomer nothing, and the difference between the two is entirely
 * a difference of *input* — so state the input. Facts about the calculation,
 * not about the person.
 */
export const CORE_NUMBER_GLOSS: Record<CoreNumberKind, { en: string; ta: string }> = {
  psychic: { en: "from the day of the month you were born", ta: "நீங்கள் பிறந்த தேதியிலிருந்து" },
  destiny: { en: "from your full date of birth", ta: "உங்கள் முழுப் பிறந்த தேதியிலிருந்து" },
  name: { en: "from the spelling on your documents", ta: "ஆவணங்களில் உள்ள எழுத்துக்கூட்டலிலிருந்து" },
  namesake: { en: "from the name people actually call you", ta: "மக்கள் உங்களை அழைக்கும் பெயரிலிருந்து" },
};

export function coreNumberGloss(kind: CoreNumberKind, lang: Lang): string {
  return lang === "ta" ? CORE_NUMBER_GLOSS[kind].ta : CORE_NUMBER_GLOSS[kind].en;
}

/* ── The honest-absence notice ───────────────────────────────────────────── */

/**
 * The one place the UI says "the words are missing on purpose".
 *
 * `readingsAvailable: false` means the engine computed a reading and the server
 * withheld the prose; it does not mean the numbers are provisional. Saying
 * nothing would read as "this number has no meaning", and inventing a sentence
 * would defeat the review gate — so the absence gets its own line.
 */
export function ReadingsWithheldNote({
  lang,
  readingsAvailable,
  style,
}: {
  lang: Lang;
  readingsAvailable: boolean;
  style?: CSSProperties;
}) {
  if (readingsAvailable) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-2)",
        alignItems: "flex-start",
        fontSize: "var(--text-xs)",
        color: "var(--color-faint)",
        lineHeight: 1.5,
        ...style,
      }}
    >
      <Info size={14} strokeWidth={1.5} aria-hidden="true" style={{ flex: "none", marginTop: "2px" }} />
      <span>
        {lang === "ta"
          ? "எழுத்து விளக்கங்கள் தமிழ் மறுஆய்வில் உள்ளன. அதுவரை எண்கள், கிரகங்கள் மற்றும் மதிப்பெண்கள் மட்டும் காட்டப்படுகின்றன."
          : "Written readings are still in Tamil review. Until they clear it, these surfaces show the numbers, grahas and scores only."}
      </span>
    </div>
  );
}

/** The provenance line every response carries. Rendered in the active language only. */
export function TraditionNote({
  lang,
  traditionEn,
  traditionTa,
}: {
  lang: Lang;
  traditionEn: string;
  traditionTa: string;
}) {
  return (
    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
      {lang === "ta" ? traditionTa : traditionEn}
    </div>
  );
}

/* ── Baby naming ─────────────────────────────────────────────────────────── */

/**
 * The paadham's opening letter, as the headline of a baby-name result.
 *
 * Ported from the public `/tools/baby-name-finder` page so the signed-in
 * surfaces read the same. The public page expresses this in `cl-num-*`
 * marketing CSS, which the dashboard has no access to — the *structure* is what
 * carries over, not the classes:
 *
 *   1. a context line — natchathiram, paadham, lagnam
 *   2. the letter itself at display size, in a tile
 *   3. the sentence that says what to do with it
 *
 * ## Why this is an accent Card and not a plain block
 *
 * The first port rendered it as body text inside the surrounding card: a faint
 * `--text-xs` context line and a `--text-lg` sentence, sitting flush with the
 * notes and the results under it. It was *present* and invisible — the two
 * lines a parent actually came for read as chrome.
 *
 * `variant="accent"` is the dashboard's existing emphasis affordance (gold
 * tint + stronger border, `.ui-card--accent`). Deliberately NOT a coloured
 * left-border stripe.
 *
 * Both dashboard baby-name surfaces render this, so they cannot drift the way
 * their label maps did before `web/lib/baby-name-copy.ts` existed.
 */
export function BabyNamePaadhamHeader({
  lang,
  contextLine,
  aksharaTa,
  aksharaEn,
  subLine,
}: {
  lang: Lang;
  /** "Uthiradam · Paadham 3 · Lagnam: Mesham" */
  contextLine: string;
  aksharaTa: string;
  aksharaEn: string;
  subLine?: string | null;
}) {
  const isTamil = lang === "ta";
  return (
    <Card variant="accent" style={{ gap: "var(--space-3)" }}>
      <Kicker as="div">{isTamil ? "தொடக்க எழுத்து" : "Opening letter"}</Kicker>

      {/* Whose paadham this is. Was `--text-xs` + `--color-faint`, i.e. the
          quietest pair in the system, for the line that identifies the whole
          result. */}
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-sm)",
          color: "var(--color-text-strong)",
          lineHeight: 1.45,
        }}
      >
        {contextLine}
      </p>

      {/* `flexDirection: "row"` is explicit: a <Card> is already a column
          flexbox, so a horizontal child that does not say so gets its HEIGHT
          sized by flex-basis instead of its width. */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "var(--space-4)",
          minWidth: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flex: "none",
            display: "grid",
            placeItems: "center",
            minWidth: "84px",
            minHeight: "84px",
            padding: "var(--space-2) var(--space-3)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            fontFamily: "var(--font-display)",
            fontSize: "2.9rem",
            lineHeight: 1.05,
            // The tint carries the emphasis; the glyph stays a text colour.
            // Gold at body weight is decoration, not legible text.
            color: "var(--color-text-strong)",
          }}
        >
          {aksharaTa}
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", minWidth: 0 }}>
          <strong
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 400,
              lineHeight: 1.25,
              color: "var(--color-text-strong)",
            }}
          >
            {isTamil
              ? `பெயர் ${aksharaTa} என்ற எழுத்தில் தொடங்க வேண்டும்`
              : `Names should begin with ${aksharaTa} (${aksharaEn})`}
          </strong>
          {subLine ? (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
              {subLine}
            </span>
          ) : null}
        </span>
      </div>
    </Card>
  );
}

/* ── Number rendering ────────────────────────────────────────────────────── */

/** e.g. [87, 15, 6] → "87 → 15 → 6". Empty chain falls back to the root. */
export function formatReductionChain(reading: NumberReading): string {
  const chain = reading.reductionChain?.length ? reading.reductionChain : [reading.root];
  return chain.join(" → ");
}

/**
 * The compound, rendered under doctrine D6.
 *
 * Three distinct states, and conflating any two of them is a factual error:
 *
 * - `compound` set, `compoundBeyondSeries` null — a real compound in Cheiro's
 *   encoded 10–52 series. Print it plainly.
 * - `compound` set, `compoundBeyondSeries` set — the name's own total ran past
 *   52, so `compound` is a *reduced surrogate*. Both numbers are printed and the
 *   surrogate is named as such, because the encoded meaning belongs to a
 *   different number than this name makes.
 * - `compound` null — a single-digit total. Nothing to show.
 */
export function CompoundLine({ reading, lang }: { reading: NumberReading; lang: Lang }) {
  if (reading.compoundBeyondSeries !== null) {
    return <CompoundSurrogateNote reading={reading} lang={lang} />;
  }
  return <CompoundInSeries reading={reading} lang={lang} />;
}

/* ── Cheiro's register ──────────────────────────────────────────────────────
 *
 * `compoundTone` crosses the wire as a token so each client says it in its own
 * reviewed words. These are ours, and they are deliberately *descriptive of the
 * classical source* rather than of the reader: "Cheiro reads this as a
 * cautionary number" is a fact about a 1935 book; "you should be careful" is a
 * reading of a person, which is the withheld corpus.
 *
 * Standing ruling 3 binds here. `cautionary` takes the `mid` chip, not `low` —
 * the strongest negative tone in the kit belongs to nothing in this feature.
 */
const COMPOUND_TONE_LABEL: Record<CompoundTone, { en: string; ta: string; tone: Tone }> = {
  favourable: { en: "Favourable", ta: "சாதகம்", tone: "high" },
  mixed: { en: "Mixed", ta: "கலப்பு", tone: "neutral" },
  cautionary: { en: "Cautionary", ta: "எச்சரிக்கை", tone: "mid" },
};

export function compoundToneLabel(tone: CompoundTone, lang: Lang): string {
  const spec = COMPOUND_TONE_LABEL[tone];
  if (!spec) return tone;
  return lang === "ta" ? spec.ta : spec.en;
}

export function compoundToneChip(tone: CompoundTone): Tone {
  return COMPOUND_TONE_LABEL[tone]?.tone ?? "neutral";
}

/**
 * The in-series compound, as a peer of the root rather than a step of working.
 *
 * Renders the number, Cheiro's title for it, and his register. All three are
 * bibliography — see this file's header. The title is **English in both
 * languages** by design: translating "The Shattered Citadel" would be authoring
 * new Tamil, which is what the review gate exists to hold, so the Tamil is
 * carried by the chrome around it instead.
 *
 * The tone chip is not decoration and must not be dropped to save space. Of the
 * 43 titles in the series several are alarming read alone — 16 is "The
 * Shattered Citadel", 22 "The Good Man Blinded" — and a title with no register
 * beside it delivers Cheiro's fatalism while withholding the reframing that
 * makes shipping it defensible at all.
 */
export function CompoundInSeries({ reading, lang }: { reading: NumberReading; lang: Lang }) {
  if (reading.compound === null || reading.compoundBeyondSeries !== null) return null;
  const isTamil = lang === "ta";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-text-strong)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {reading.compound}
        </span>
        {reading.compoundTitle ? (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
            {reading.compoundTitle}
          </span>
        ) : null}
      </div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
        {isTamil ? "கூட்டு எண் · சீரோவின் வரிசை" : "Compound number · Cheiro's series"}
        {/* Cheiro's own structure: 17 of the 43 repeat an earlier number's
            meaning. Saying so is the difference between a citation and an
            assertion that 34 has its own entry. */}
        {reading.compoundEchoes !== null && reading.compoundEchoes !== undefined
          ? isTamil
            ? ` · ${reading.compoundEchoes}-ஐ மீண்டும் சொல்கிறது`
            : ` · repeats ${reading.compoundEchoes}`
          : null}
        {/* Cheiro's own register for THIS number — attributed text, not a
            chip. A chip here reads as a verdict on the candidate; it is a
            citation about the compound number alone and never affects
            ranking (see `ORDER_EXPLAINER`). */}
        {reading.compoundTone ? (
          <>
            {" · "}
            {isTamil ? "சீரோவின் பதிவு: " : "Cheiro's register: "}
            <span style={{ color: TONE_TEXT[compoundToneChip(reading.compoundTone)], fontWeight: 600 }}>
              {compoundToneLabel(reading.compoundTone, lang)}
            </span>
          </>
        ) : null}
      </div>
      {/* Our meaning for the number, when it clears review. Null today; the
          title above ships regardless, which is the whole point of the split. */}
      {(isTamil ? reading.compoundReadingTa : reading.compoundReadingEn) ? (
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.5 }}>
          {isTamil ? reading.compoundReadingTa : reading.compoundReadingEn}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The letter-by-letter working.
 *
 * "Adds up to 65" is an assertion; `S·3 E·5 N·5 …` is a claim the reader can
 * check. It is also the only view in which a *name correction* is legible —
 * changing a spelling moves specific letters, and without this the user sees
 * only that some total changed.
 *
 * Straight off `letterValues`; never recomputed here. The Chaldean table is
 * data, not an `A=1..Z=26 mod 9` formula (no letter carries 9), so a second
 * copy in TypeScript would be a second copy to get wrong.
 */
export function LetterBreakdown({ reading, lang }: { reading: NumberReading; lang: Lang }) {
  if (!reading.letterValues?.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
        {lang === "ta" ? "ஒவ்வொரு எழுத்தின் மதிப்பு" : "What each letter is worth"}
      </div>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "var(--space-1)" }}>
        {reading.letterValues.map((lv, index) => (
          <span
            key={`${lv.char}-${index}`}
            style={{
              display: "inline-flex",
              flexDirection: "row",
              alignItems: "baseline",
              gap: "3px",
              padding: "2px 6px",
              borderRadius: "var(--radius-xs)",
              /* --color-surface-soft, not a `sunken` variant: the latter is
                 defined nowhere in the tree, and an undefined custom property
                 makes the whole declaration invalid at computed-value time
                 rather than falling back — a silent no-background chip. */
              background: "var(--color-surface-soft)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-xs)",
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{lv.char}</span>
            <span style={{ color: "var(--color-faint)", fontVariantNumeric: "tabular-nums" }}>
              {lv.value}
            </span>
          </span>
        ))}
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text)",
            alignSelf: "center",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          = {reading.total}
        </span>
      </div>
    </div>
  );
}

/**
 * The full citation, with page numbers. Belongs in the disclosure — the inline
 * attribution ("Cheiro's series") is what a reader needs at a glance, and this
 * is what they need to go and check.
 */
export function CompoundSourceNote({ reading, lang }: { reading: NumberReading; lang: Lang }) {
  if (!reading.compoundSource) return null;
  return (
    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
      {lang === "ta" ? "ஆதாரம்" : "Source"} · {reading.compoundSource}
    </div>
  );
}

/**
 * Doctrine D6, and the one part of a reading that must never be behind a
 * disclosure — it is the caveat that stops a number being misread.
 *
 * Two distinct shapes, and the second was being dropped entirely before this
 * was split out. `compound` is null *both* for a genuinely single-digit total
 * and for a name whose total sails past 52 with nothing landing in 10–52 on the
 * way down (60 → 6; 63 → 9). A guard of `if (compound === null) return null`
 * therefore silenced the warning on exactly the names it exists for — and per
 * the D6 measurement, ten of twelve realistic three-part Indian document names
 * total past 52, so that was the common case, not the corner.
 *
 *   compound set     — a reduced surrogate is on screen; name both numbers and
 *                      say which one the meaning belongs to.
 *   compound null    — nothing is on screen to mislead, but the total is still
 *                      unencoded, and silence would read as "no compound".
 */
export function CompoundSurrogateNote({ reading, lang }: { reading: NumberReading; lang: Lang }) {
  const beyond = reading.compoundBeyondSeries;
  if (beyond === null) return null;

  const body =
    reading.compound !== null
      ? lang === "ta"
        ? `இப்பெயரின் எழுத்துக்கள் ${beyond} ஆகக் கூடுகின்றன. கல்தேய முறையில் இரட்டை இலக்கத் தொகைகளுக்கான பொருள் 52 வரை மட்டுமே எழுதப்பட்டுள்ளது. எனவே இங்குக் காட்டப்படும் ${reading.compound} என்பது வேறோர் எண்ணிடமிருந்து எடுத்த மாற்று — இப்பெயரின் சொந்தப் பொருள் அல்ல.`
        : `This name's letters add up to ${beyond}. Chaldean practice only writes down meanings for two-digit totals up to 52, so the ${reading.compound} shown here is a stand-in borrowed from a different number — not this name's own meaning.`
      : lang === "ta"
        ? `இப்பெயரின் எழுத்துக்கள் ${beyond} ஆகக் கூடுகின்றன. கல்தேய முறையில் இரட்டை இலக்கத் தொகைகளுக்கான பொருள் 52 வரை மட்டுமே எழுதப்பட்டுள்ளது; எனவே ${beyond}-க்கு அத்தகைய பொருள் எதுவும் இல்லை. கீழே உள்ள ஒற்றை இலக்கம் மட்டுமே படிக்கப்படுகிறது.`
        : `This name's letters add up to ${beyond}. Chaldean practice only writes down meanings for two-digit totals up to 52, so there is none for ${beyond}. Only the single digit below is being read.`;

  return (
    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>{body}</div>
  );
}

/**
 * The single-digit case: `compound === null` and `compoundBeyondSeries ===
 * null` together mean the total never reached two digits in the first place —
 * Cheiro's series only names 10-52, so there is nothing to cite. Distinct from
 * `CompoundSurrogateNote` above, which explains a *different* silence (a total
 * that overshot 52). Conflating the two would tell a reader the wrong story
 * about why no title appears.
 */
export function NoCompoundNote({ reading, lang }: { reading: NumberReading; lang: Lang }) {
  if (reading.compound !== null || reading.compoundBeyondSeries !== null) return null;
  const isTamil = lang === "ta";
  return (
    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>
      {isTamil
        ? `இது ${reading.total} ஆகக் கூடி நேரடியாக ஒற்றை இலக்கமாக (${reading.root}) உள்ளது. கல்தேய கூட்டு எண்கள் இரட்டை இலக்கத் தொகைகளுக்கு (10–52) மட்டுமே பெயர் பெற்றவை, எனவே இங்கே ஒரு கூட்டு எண் இல்லை — இது குறையல்ல.`
        : `This adds up to ${reading.total}, already a single digit (${reading.root}). Chaldean compound numbers are only named for two-digit totals (10-52), so there is no compound to show here — that is expected, not a missing reading.`}
    </div>
  );
}

/**
 * One number with its full derivation. `scoredFrom` echoes the exact string the
 * backend scored (`scoredName` / `scoredNamesake`) — a name reading must never
 * be readable without knowing which spelling produced it (doctrine D3).
 */
export function NumberReadingCard({
  reading,
  label,
  lang,
  scoredFrom,
  trailing,
  scoredFromBadge,
  leadTag,
  alignment,
  hint,
  scale,
  subject = "self",
  showCompound = true,
  collapsedSummary,
  footer,
}: {
  reading: NumberReading;
  label: string;
  lang: Lang;
  scoredFrom?: string | null;
  trailing?: ReactNode;
  /**
   * Chip(s) that qualify the *spelling* (script confidence, which paadham
   * relation admitted this name) — rendered next to "Scored from", not in the
   * header's `trailing` corner. That corner sits directly above the
   * numerology alignment score below it; a spelling-confidence chip up there
   * reads as a verdict on the score ("Strong match" next to "30 / 100") when
   * the two are unrelated axes.
   */
  scoredFromBadge?: ReactNode;
  /**
   * The card's own leading badge, rendered above the header row at full
   * visual weight — for baby names this is the relation chip (which rule
   * admitted this name: your paadham, your star, your rasi, …), the *actual*
   * primary sort key (see `numerology_naming_service.py`). It leads because
   * everything below it — confidence, alignment score, compound tone — only
   * ever breaks ties within this tier or is decorative, never overrides it.
   */
  leadTag?: ReactNode;
  /**
   * The chart-scored verdict for this number, when the surface has one. Supply
   * it and the card leads with what the number *means for this chart*; omit it
   * (the public calculator, the personal-cycle panel) and the card stays a
   * plain derivation, because without a chart there is no verdict to lead with.
   */
  alignment?: NumberAlignment | null;
  /** Where the number came from — see `CORE_NUMBER_GLOSS`. */
  hint?: string | null;
  /** The 0-100 ladder off the response, so step 5 can name the band. */
  scale?: VerdictBand[] | null;
  /** Whose chart the alignment is scored against. See `ChartSubject`. */
  subject?: ChartSubject;
  /**
   * Cheiro's compound-number block (the number, his title for it, and his
   * register), plus the two notes that exist only to explain its absence.
   *
   * Off on Baby Name Finder. That block is a citation about a NUMBER in a 1935
   * book — it cannot move the alignment score and never affects ranking (see
   * `ORDER_EXPLAINER`) — but it renders directly under a 0-100 chart score, so
   * a card reading "85 / 100 · Strongly aligned" also carried "Cheiro's
   * register: Cautionary" for compound 18, and was read as self-contradictory.
   * On a page where a parent is choosing their child's name, the safest
   * reading of a stray "Cautionary" is the damaging one. Stays on for the
   * numerology calculator, where the reader came for the number itself.
   */
  showCompound?: boolean;
  /**
   * Turns the card into one collapsed row that opens on click.
   *
   * Baby Name Finder returns up to ~116 names, and every one of them was
   * rendering its full five-step derivation inline — a wall no reader can
   * scan, in which the one fact they came to compare (the score) was buried
   * under a paragraph per name. Supply the compact row here (name, score,
   * rank, one-line why) and everything below becomes the disclosure.
   *
   * Native `<details>`, like `CalculationDetails`: keyboard- and
   * screen-reader-correct for free, prints expanded, and stays in the DOM for
   * find-in-page — which matters here, because a parent scanning 116 names
   * will use Ctrl-F.
   *
   * The `label`/`trailing` header row is suppressed when this is set: the
   * summary already carries the name, and repeating it two lines apart is how
   * an accordion starts looking like a bug.
   */
  collapsedSummary?: ReactNode;
  /**
   * Rendered last, below the collapsed working — for Baby Name Finder this is
   * `<FullNameReadingLine>`, the "with family name" second reading.
   *
   * Below, not above: the called name leads because it is the one the paadham
   * rule governs and the one the child is addressed by, and a full reading
   * stacked directly on the card's own numeral is the adjacent-scores fusion
   * this card has already hit three times.
   */
  footer?: ReactNode;
}) {
  const isTamil = lang === "ta";
  const body = (
    <>
      {collapsedSummary ? null : (
        <>
          {leadTag ? <div>{leadTag}</div> : null}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {label}
            </span>
            {trailing ? <span style={{ marginLeft: "auto" }}>{trailing}</span> : null}
          </div>
        </>
      )}

      {hint ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "-4px" }}>{hint}</div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--display-sm)",
            fontWeight: 600,
            lineHeight: 1,
            color: "var(--color-text-strong)",
          }}
        >
          {reading.root}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{grahaLabel(reading, lang)}</span>
        {/* This number's own 0-100 score. Without it the headline average was
            unaccountable: a reader watching the total move when a name was added
            had no way to see which number moved it. Straight off the response —
            never recomputed here, because the weighting is the server's. */}
        {alignment ? (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "var(--text-xs)",
              color: "var(--color-faint)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(alignment.score)} / 100
          </span>
        ) : null}
      </div>

      {/* The plain reading leads. Everything below it is evidence for this. */}
      {alignment ? (
        <>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-strong)", lineHeight: 1.5 }}>
            {verdictPlain(alignment.verdict, lang)}
          </div>
          <WhyThisRating alignment={alignment} lang={lang} scale={scale} subject={subject} />
        </>
      ) : null}

      {/* Cheiro's compound block and the two notes that exist ONLY to account
          for its absence. All three are one switch: with the compound hidden,
          "there is no entry for 60" and "this total has no compound step" are
          answers to a question the card is no longer asking. See
          `showCompound`. */}
      {showCompound ? (
        <>
          {/* The compound, as a peer of the root — NOT inside the disclosure.
              It outranks the root in this system (43 and 34 both reduce to 7 and
              are read differently), so filing it under "how this was worked out"
              presented the senior number as a discarded intermediate. */}
          <CompoundInSeries reading={reading} lang={lang} />

          {/* Doctrine D6 — a caveat, so it stays outside the disclosure. */}
          <CompoundSurrogateNote reading={reading} lang={lang} />

          {/* The third state `CompoundLine`'s own docstring names but used to
              render as nothing: `compound === null` (a single-digit total, no
              two-digit step to name). Personal Month/Day roots most often land
              here, and a card with no compound and no explanation reads as broken
              rather than as the ordinary case it is. */}
          <NoCompoundNote reading={reading} lang={lang} />
        </>
      ) : null}

      {/* Doctrine D3 — a name reading must never be readable without the
          spelling that produced it, so this stays outside the disclosure too. */}
      {scoredFrom ? (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
          <span>
            {isTamil ? "கணக்கிடப்பட்டது" : "Scored from"} · <span style={{ color: "var(--color-text)" }}>{scoredFrom}</span>
          </span>
          {scoredFromBadge}
        </div>
      ) : null}

      <CalculationDetails lang={lang}>
        <LetterBreakdown reading={reading} lang={lang} />
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
          {isTamil ? "எழுத்துக்களின் கூட்டுத்தொகை" : "Letters add up to"} · {reading.total}
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
          {isTamil ? "ஒற்றை இலக்கமாகச் சுருக்கியது" : "Reduced to a single digit"} · {formatReductionChain(reading)}
        </div>
        {reading.ignoredCharacters.length > 0 ? (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
            {isTamil ? "கணக்கில் சேர்க்கப்படாதவை" : "Not scored"} ·{" "}
            {reading.ignoredCharacters.map((ch) => (ch === " " ? "␣" : ch)).join(" ")}
          </div>
        ) : null}
        {/* Cheiro's bibliographic citation. Follows `showCompound` — a source
            note for a block that is not on the card cites nothing. */}
        {showCompound ? <CompoundSourceNote reading={reading} lang={lang} /> : null}
      </CalculationDetails>

      {footer}
    </>
  );

  if (!collapsedSummary) {
    return (
      <Card compact style={{ gap: "var(--space-2)" }}>
        {body}
      </Card>
    );
  }

  return (
    <Card compact style={{ gap: 0 }}>
      <details className="num-name-details">
        <summary className="num-name-details__summary">{collapsedSummary}</summary>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
            paddingTop: "var(--space-3)",
          }}
        >
          {body}
        </div>
      </details>
    </Card>
  );
}

/**
 * The collapsed row for one baby-name candidate.
 *
 * Feeds `NumberReadingCard`'s `collapsedSummary`. Four facts and nothing else:
 * the name, what admitted it, its chart-fit score, and its position — the
 * things a parent compares *across* names. Everything that explains a single
 * name lives behind the disclosure.
 *
 * Score and rank sit together at the end on purpose, and the rank carries its
 * denominator: "#18" alone invites the reading "18th best", when the list is
 * ordered by the letter rule first (see `ORDER_EXPLAINER`) and a lower row can
 * legitimately outscore a higher one.
 */
export function BabyNameRowSummary({
  name,
  lang,
  chips,
  score,
  rank,
  total,
  oneLine,
}: {
  name: string;
  lang: Lang;
  chips?: ReactNode;
  /** Chart fit, 0-100. Null on the chart-less path — then no score is shown. */
  score?: number | null;
  /** 1-based position in the full ranked pool. */
  rank?: number | null;
  total?: number | null;
  /** `oneLineWhy(alignment, lang)`. */
  oneLine?: string | null;
}) {
  const isTamil = lang === "ta";
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          gap: "var(--space-2)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-strong)" }}>
          {name}
        </span>
        {chips}
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            gap: "var(--space-2)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {typeof score === "number" ? (
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
              {score}
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", fontWeight: 400 }}>
                {isTamil ? " /100 பொருத்தம்" : " /100 fit"}
              </span>
            </span>
          ) : null}
          {typeof rank === "number" && rank > 0 ? (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              #{rank}
              {typeof total === "number" && total > 0 ? (isTamil ? ` / ${total}` : ` of ${total}`) : null}
            </span>
          ) : null}
        </span>
      </div>
      {oneLine ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {oneLine}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The full-name reading, as a second row under the called name's.
 *
 * Deliberately quieter than the card's own numeral: the called name leads
 * because it is the only one the paadham rule governs and the one the child
 * is addressed by. This answers the other real question — what the name reads
 * as on documents — without competing for the verdict.
 *
 * Rendered as ONE line (spelling · number · graha · score), not a second
 * card. Two full readings stacked is precisely the adjacent-scores fusion
 * this card has hit three times.
 */
export function FullNameReadingLine({
  spelling,
  reading,
  alignment,
  lang,
  note,
}: {
  spelling: string;
  reading: NumberReading;
  alignment?: NumberAlignment | null;
  lang: Lang;
  /** `fullNameGapNote(...)` — only when the two readings diverge materially. */
  note?: string | null;
}) {
  const isTamil = lang === "ta";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        paddingTop: "var(--space-2)",
        borderTop: "1px dashed var(--color-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          gap: "var(--space-2)",
          flexWrap: "wrap",
          fontSize: "var(--text-xs)",
          color: "var(--color-muted)",
        }}
      >
        <span style={{ color: "var(--color-faint)" }}>
          {isTamil ? "குடும்பப் பெயருடன்" : "With family name"}
        </span>
        <span style={{ color: "var(--color-text)" }}>{spelling}</span>
        <span style={{ color: "var(--color-text-strong)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {reading.root}
        </span>
        <span>{grahaLabel(reading, lang)}</span>
        {alignment ? (
          <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(alignment.score)} / 100
          </span>
        ) : null}
      </div>
      {note ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {note}
        </div>
      ) : null}
    </div>
  );
}

/**
 * One alignment row: the number, the graha, its functional role in *this*
 * chart, and the score.
 *
 * The graha and its role lead. That ordering is the doctrine — the alignment
 * score is a property of the graha's lordship in this chart, and a reader who
 * takes away only "7 scored 82" has read a number where a graha was meant.
 */
export function AlignmentRow({
  alignment,
  lang,
  rank,
}: {
  alignment: NumberAlignment;
  lang: Lang;
  rank?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-2) 0",
        borderBottom: "1px solid var(--color-border)",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          flex: "none",
          width: "34px",
          height: "34px",
          borderRadius: "var(--radius-pill)",
          background: "var(--color-accent-muted)",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-base)",
          fontWeight: 600,
          color: "var(--color-text-strong)",
        }}
      >
        {alignment.number}
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "180px", flex: "1 1 220px" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
          {grahaLabel(alignment, lang)}
        </span>
        {/* Plain clause first, expert term kept beside it — the row has to work
            for a reader who has never met the word "trikona" and for one who
            reads charts for a living.

            Nine of these render at once, so the full five-step chain belongs on
            the cards above, not here. What the row gains instead is the one
            thing that turns its gloss from a category into a checkable claim:
            the actual houses. "rules your 2nd and 7th" can be verified against
            the jadhagam on the next tab; "rules a house of limits" cannot. */}
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {natureGlossFor(alignment.functionalNature, alignment.basis?.ownedHouses, lang)}
          {alignment.basis?.ownedHouses?.length && alignment.functionalNature !== "NEUTRAL"
            ? ` · ${housesPhrase(alignment.basis.ownedHouses, lang)}`
            : ""}
          <span style={{ color: "var(--color-faint)" }}>
            {" "}
            · {natureLabel(alignment.functionalNature, lang)}
            {alignment.natalStrength !== null
              ? ` · ${lang === "ta" ? "பலம்" : "Strength"} ${Math.round(alignment.natalStrength)}`
              : ""}
          </span>
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-2)", marginLeft: "auto" }}>
        {rank !== undefined ? (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
            {lang === "ta" ? `வரிசை ${rank}` : `Rank ${rank}`}
          </span>
        ) : null}
        <Chip tone={verdictTone(alignment.verdict)}>{verdictLabel(alignment.verdict, lang)}</Chip>
        <span style={{ fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", color: "var(--color-text)", minWidth: "2.5ch", textAlign: "right" }}>
          {Math.round(alignment.score)}
        </span>
      </div>
    </div>
  );
}

/* ── Shared states ───────────────────────────────────────────────────────── */

/**
 * `numerology_engine` is checked before the chart is, deliberately, so a
 * flag-off deployment (or environment where it's been rolled back) answers 404
 * identically for a real chart and a made-up one. A 404 from any numerology
 * route therefore means "not launched here" and must never be shown as
 * "chart not found".
 */
export function isNumerologyUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.startsWith("404:") && message.includes("/numerology");
}

export function NumerologyUnavailable({ lang }: { lang: Lang }) {
  return (
    <Card variant="dashed" style={{ gap: "var(--space-2)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
        {lang === "ta" ? "எண் கணிதம் இன்னும் திறக்கப்படவில்லை" : "Numerology isn't switched on yet"}
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {lang === "ta"
          ? "இந்தப் பகுதி தயாராகும்போது இங்கேயே தோன்றும்."
          : "This section will appear here once it goes live."}
      </p>
    </Card>
  );
}

export function NumerologyError({ lang, message }: { lang: Lang; message: string }) {
  return (
    <Card variant="low" style={{ gap: "var(--space-1)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
        {lang === "ta" ? "ஏற்ற முடியவில்லை" : "Couldn't load this"}
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>{message}</p>
    </Card>
  );
}

export function NumerologyLoading({ lang }: { lang: Lang }) {
  return (
    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", padding: "var(--space-4) 0" }}>
      {lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…"}
    </div>
  );
}
