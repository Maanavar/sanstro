import { getApiClient } from "./client";
import type { BiText, MuhurtaSlot } from "../types";

/*
 * Chaldean numerology (Phases 1-4).
 *
 * Public, unauthenticated (app/api/public_tools.py, router prefix "/public"):
 *   POST /public/numerology/profile       -> public_numerology_profile
 *   POST /public/numerology/number        -> public_numerology_number
 *   POST /public/numerology/personal-year -> public_personal_year
 *
 * Authenticated and chart-aware (app/api/numerology.py):
 *   POST /charts/{id}/numerology/alignment          -> get_fortune_alignment
 *   POST /charts/{id}/numerology/name-correction    -> get_name_correction
 *   GET  /charts/{id}/numerology/favourable-numbers -> get_favourable_numbers
 *   GET  /charts/{id}/numerology/personal-cycle     -> get_personal_cycle
 *   GET  /charts/{id}/numerology/lucky-dates        -> get_lucky_dates
 *   GET  /charts/{id}/numerology/marriage-dates     -> get_marriage_dates
 *   POST /numerology/compatibility                  -> get_numerology_compatibility
 *   POST   /charts/{id}/numerology/name-sessions      -> save_numerology_name_session
 *   GET    /charts/{id}/numerology/name-sessions      -> get_numerology_name_sessions
 *   DELETE /charts/{id}/numerology/name-sessions/{id} -> delete_numerology_name_session
 *
 * The last one is not chart-scoped because it reads two charts and neither is
 * subordinate to the other — both ids go in the body.
 *
 * The public routes need only a date of birth and a name — never a birth time
 * or location — which is why they can be unauthenticated at all. The chart
 * routes are the differentiator: they read the number against the native's own
 * jadhagam, which is the one thing a standalone numerology app cannot do.
 *
 * EVERY route here 404s while the `numerology_engine` feature flag is off (its
 * default). Callers must treat that as "not launched yet", not as an error, and
 * must not read a 404 on a chart route as "chart not found" — the flag is
 * checked before the chart is, deliberately.
 *
 * All responses are FLAT — no { success, data } envelope. Do not unwrap `.data`.
 *
 * Verbs and paths were read off the running FastAPI route table when this file
 * was written; tests/test_api_wrapper_route_contract.py fails if they drift.
 */

/** One scored character and the value it contributed. */
export interface LetterValue {
  char: string;
  value: number;
}

/**
 * Cheiro's register for a compound. A token, rendered by each client in its own
 * reviewed vocabulary — never printed raw.
 */
export type CompoundTone = "favourable" | "mixed" | "cautionary";

/** A number kept with its full derivation. */
export interface NumberReading {
  /** Raw sum before any reduction. */
  total: number;
  /**
   * The compound within the encoded 10-52 series. Never collapse this into
   * `root` for display — 43 and 34 both reduce to 7 and are read differently.
   * The compound outranks the root.
   *
   * Null for a single-digit total AND for a long name whose total reduces past
   * the series entirely (e.g. 63 → 9). Check `compoundBeyondSeries` to tell
   * those two apart — they are opposite findings.
   */
  compound: number | null;
  /** Final single digit, 1-9. */
  root: number;
  /** Full reduction path, e.g. [87, 15, 6]. */
  reductionChain: number[];
  /** Graha enum key, e.g. "SATURN". Use grahaTa/grahaEn for display. */
  graha: string;
  grahaTa: string;
  grahaEn: string;
  /** Characters skipped while scoring (spaces, punctuation), for transparency. */
  ignoredCharacters: string[];
  /**
   * Doctrine D6. The name's own total when it exceeds the encoded 10-52 series,
   * meaning `compound` above is a *reduced surrogate* — the meaning of a
   * different number than this name actually makes. Null when `compound` is the
   * real thing.
   *
   * Common for document names: of twelve realistic three-part Indian names
   * measured, ten totalled above 52. Cheiro's series stops there; Pandit
   * Sethuraman extended it to 108 for exactly this reason, and that corpus is
   * not yet in hand. A surface rendering a compound reading while this is
   * non-null must say which number it is describing.
   */
  compoundBeyondSeries: number | null;
  /**
   * Every scored character and what it contributed, in order. Empty for a
   * reading built from a date — psychic and destiny numbers have no letters.
   *
   * This is what makes `total` checkable. Render it rather than recomputing:
   * the Chaldean table is *data*, not an `A=1..Z=26 mod 9` formula (no letter
   * carries 9), so a client-side copy would be a second table to get wrong.
   */
  letterValues: LetterValue[];

  /* ── The compound's citation. Always present when `compound` is set. ──────
   *
   * These four are a reference to Cheiro, Book of Numbers (1935), not copy
   * written about the reader — so unlike everything else interpretive in this
   * feature they are NOT withheld behind `readingsAvailable`. See
   * `numerology_content.CompoundCitation` for why the two are different kinds
   * of text.
   */
  /**
   * Cheiro's classical title, e.g. "The Recluse" for 31. Null when the total is
   * single-digit or falls outside the encoded 10-52 series — a truthful "not
   * encoded", never a withheld value.
   *
   * **English-only, in both languages.** A Tamil rendering would be a new
   * translation, which is exactly what the review gate holds. Render it as-is
   * and let the surrounding chrome carry the Tamil.
   */
  compoundTitle: string | null;
  /**
   * **Must be rendered wherever `compoundTitle` is.** Several of Cheiro's
   * titles are alarming standing alone ("The Shattered Citadel" for 16, "The
   * Good Man Blinded" for 22); printing one without its register hands the
   * reader his fatalism and withholds our reframing of it. That is the banned
   * fear trade (standing ruling 3) breached by omission, not by commission.
   */
  compoundTone: CompoundTone | null;
  /** The earlier compound this one repeats, in Cheiro's own structure. */
  compoundEchoes: number | null;
  /** The page-level citation. Show it wherever a title is shown. */
  compoundSource: string | null;

  /**
   * What the compound *means* — ours, not Cheiro's, and therefore gated like
   * all other prose. Null while the Tamil corpus is unreviewed; the title above
   * still ships. Check `readingsAvailable` on the enclosing response to tell
   * "withheld" from "no such number".
   */
  compoundReadingEn: string | null;
  compoundReadingTa: string | null;
}

export interface NumerologyProfileRequest {
  /** ISO date, YYYY-MM-DD. */
  birthDate: string;
  /** Spelling on official records — the name "name correction" targets. */
  documentName?: string;
  /** The name actually used day to day; often differs. */
  calledName?: string;
}

export interface NumerologyProfileResponse {
  psychic: NumberReading;
  destiny: NumberReading;
  name: NumberReading | null;
  namesake: NumberReading | null;
  /** The exact strings scored. Always render these alongside the numbers. */
  scoredName: string | null;
  scoredNamesake: string | null;
  traditionEn: string;
  traditionTa: string;
}

export type NumerologyObjectKind = "mobile" | "vehicle" | "house";

export interface ObjectNumberRequest {
  value: string;
  kind: NumerologyObjectKind;
}

export interface ObjectNumberResponse {
  kind: NumerologyObjectKind;
  raw: string;
  /** What was actually scored after normalisation (mobile strips separators). */
  scored: string;
  reading: NumberReading;
  /** e.g. "last 4" for the mobile tail reading. */
  secondaryLabel: string | null;
  secondary: NumberReading | null;
  traditionEn: string;
  traditionTa: string;
}

/** Four core numbers from a date of birth and optional name(s). */
export async function getNumerologyProfile(
  payload: NumerologyProfileRequest,
): Promise<NumerologyProfileResponse> {
  return getApiClient().post(
    "/public/numerology/profile",
    payload,
  ) as Promise<NumerologyProfileResponse>;
}

/** Analyse a mobile, vehicle or house number. */
export async function analyzeNumerologyNumber(
  payload: ObjectNumberRequest,
): Promise<ObjectNumberResponse> {
  return getApiClient().post(
    "/public/numerology/number",
    payload,
  ) as Promise<ObjectNumberResponse>;
}

/* ── Time numerology (Phase 4) ─────────────────────────────────────────────
 *
 * Shared by the public and the chart-aware routes: the personal *month* and
 * *day* steps are universal, and only the year boundary is doctrinal, so the
 * chart adds nothing to the shape. What it adds is provenance — the birth date
 * comes from the jadhagam, and Puthandu resolves at the native's own longitude
 * instead of the Chennai reference the public tool has to assume.
 */

/** When the personal year rolls over (doctrine D1, server-configured). */
export type PersonalYearEpoch = "birthday" | "january" | "chithirai";

export interface PersonalYear {
  reading: NumberReading;
  /**
   * Which rollover convention produced this number. Not decoration: the year
   * turns on a different day under each, so always show it with the window.
   */
  epoch: PersonalYearEpoch;
  /** Calendar year summed into the number — the previous one before rollover. */
  governingYear: number;
  /** ISO date, YYYY-MM-DD. */
  cycleStart: string;
  /** ISO date. Inclusive last day of the cycle. */
  cycleEnd: string;
}

export interface PersonalCycleRequest {
  /** ISO date, YYYY-MM-DD. */
  birthDate: string;
  /** ISO date. Defaults to the server's today when omitted. */
  onDate?: string;
}

export interface PersonalCycleResponse {
  onDate: string;
  year: PersonalYear;
  month: NumberReading;
  day: NumberReading;
  /** False while the interpretive corpus is unreviewed. Render the withheld
   *  note from it — on this surface especially, three bare digits with no
   *  explanation of the silence read as a broken screen. */
  readingsAvailable: boolean;
  traditionEn: string;
  traditionTa: string;
}

/** Personal year/month/day from a date of birth alone. */
export async function getPublicPersonalYear(
  payload: PersonalCycleRequest,
): Promise<PersonalCycleResponse> {
  return getApiClient().post(
    "/public/numerology/personal-year",
    payload,
  ) as Promise<PersonalCycleResponse>;
}

/* ── Chart-aware: Fortune Alignment (Phase 3) ───────────────────────────── */

/**
 * Functional nature of a graha *in this chart* — the same enum the transit and
 * dasha engines use. Render it from your own vocabulary; the backend sends the
 * key, not a sentence.
 */
export type FunctionalNature =
  | "YOGAKARAKA"
  | "LAGNA_LORD"
  | "TRIKONA"
  | "KENDRA"
  | "MARAKA"
  | "DUSTHANA"
  | "UPACHAYA"
  | "NEUTRAL";

export type AlignmentVerdict =
  | "strongly_aligned"
  | "aligned"
  | "neutral"
  | "misaligned"
  | "strongly_misaligned";

/**
 * How this graha's natal strength was allowed to move the score.
 *
 * `inverted` is the one a client must actually render rather than swallow: for
 * a malefic lordship a *stronger* graha scores **lower**, because strength
 * governs how fully a graha delivers what it rules, not whether what it rules
 * is welcome. A screen showing "Strength 71" beside a fallen score with no rule
 * named has shown the reader what looks like an arithmetic error.
 */
export type StrengthRule = "amplifies" | "inverted" | "damped" | "none";

/** Which branch of the node rule fired — nodes own no sign to explain them. */
export type NodeBasisKind = "occupied_house" | "dispositor" | "no_position";

export interface NodeBasis {
  kind: NodeBasisKind;
  /** House the node occupies, from lagna. Null when position is unknown. */
  occupiedHouse: number | null;
  /** The sign lord it borrows from — `dispositor` branch only. */
  dispositor: string | null;
  dispositorTa: string | null;
  dispositorEn: string | null;
  /** Houses that dispositor rules, so the borrowing explains in turn. */
  dispositorHouses: number[];
}

/**
 * The score's own working — what makes a verdict explainable instead of
 * asserted.
 *
 * **Not gated by `readingsAvailable`.** These are facts about the calculation
 * (lordship and arithmetic), not readings of a person: a sentence built from
 * them changes only if the chart changes, never if the native does. Same
 * standing as `compoundTitle`/`compoundTone`, which cite Cheiro.
 *
 * `baseScore + strengthDelta === score`, always — `strengthDelta` is the
 * realised difference, so the parts can be printed without ever showing a sum
 * that fails to add up at the 0/100 rails.
 */
export interface AlignmentBasis {
  /** Houses this graha rules from this lagna. Empty for Rahu/Ketu. */
  ownedHouses: number[];
  /** Populated for Rahu/Ketu only — numbers 4 and 7, so this is common. */
  nodeBasis: NodeBasis | null;
  /** What the graha's office alone is worth, before strength. */
  baseScore: number;
  strengthDelta: number;
  strengthRule: StrengthRule;
}

/** One rung of the 0-100 ladder, inclusive at both ends. */
export interface VerdictBand {
  verdict: AlignmentVerdict;
  minScore: number;
  maxScore: number;
}

export interface NumberAlignment {
  /** Root digit 1-9. The compound lives on the matching NumberReading. */
  number: number;
  graha: string;
  grahaTa: string;
  grahaEn: string;
  functionalNature: FunctionalNature;
  /** 0-100 natal strength of the graha, when the chart carried one. */
  natalStrength: number | null;
  score: number;
  verdict: AlignmentVerdict;
  /** How the score was arrived at. Never null — every alignment has one. */
  basis: AlignmentBasis;
  /** Null while the interpretive corpus is unreviewed — see readingsAvailable. */
  reasonEn: string | null;
  reasonTa: string | null;
}

/** The four core numbers with the exact strings they were scored from. */
export interface NumerologyReadings {
  psychic: NumberReading;
  destiny: NumberReading;
  name: NumberReading | null;
  namesake: NumberReading | null;
  scoredName: string | null;
  scoredNamesake: string | null;
}

export interface FortuneAlignmentRequest {
  /** Spelling on official records. Omit both to align the chart numbers alone. */
  documentName?: string;
  /** The name actually used day to day. */
  calledName?: string;
}

export interface FortuneAlignmentResponse {
  /**
   * The numbers themselves. The alignments below score *root* digits; the
   * compound only appears here, and it outranks the root for display.
   */
  readings: NumerologyReadings;
  psychic: NumberAlignment;
  destiny: NumberAlignment;
  name: NumberAlignment | null;
  namesake: NumberAlignment | null;
  overallScore: number;
  verdict: AlignmentVerdict;
  /**
   * False for any functionally benefic graha, whatever the number's popular
   * reputation. This is the field that lets the product say "your name is
   * fine" — surface that outcome as prominently as the other one.
   */
  nameChangeAdvised: boolean;
  /** 1-9 ranked best-first for this chart. */
  favourableNumbers: number[];
  /**
   * The 0-100 ladder these scores are bucketed by, best band first. Draw the
   * legend from this rather than hard-coding cutoffs — the thresholds live in
   * one place server-side and a TS copy would be a second copy to get wrong.
   */
  verdictScale: VerdictBand[];
  lagnaRasi: number;
  recommendationEn: string | null;
  recommendationTa: string | null;
  /**
   * False until the Tamil corpus clears native review. While false, every
   * `reason*`/`recommendation*` field above is null by design — say so rather
   * than rendering an empty space.
   */
  readingsAvailable: boolean;
  calculationVersion: string;
  traditionEn: string;
  traditionTa: string;
}

export interface FavourableNumbersResponse {
  lagnaRasi: number;
  /** All nine, ranked best-first. Same order as `favourableNumbers`. */
  numbers: NumberAlignment[];
  favourableNumbers: number[];
  /** The 0-100 ladder, best band first — see `FortuneAlignmentResponse`. */
  verdictScale: VerdictBand[];
  readingsAvailable: boolean;
  calculationVersion: string;
  traditionEn: string;
  traditionTa: string;
}

/* ── Chart-aware: date scoring (Phase 4) ────────────────────────────────── */

export interface DateNumerology {
  /** ISO date. */
  date: string;
  reading: NumberReading;
  personalDay: NumberReading | null;
  /** 1-9 position of this date's number in the chart's ranking, best = 1. */
  favourabilityRank: number | null;
  /** Signed points added to the astrological score, bounded to ±8. */
  adjustment: number;
  /**
   * True when a positive adjustment was withheld because the panchangam
   * flagged the date. Numerology may lower a flagged date, never lift it.
   */
  clampedByAstrology: boolean;
  noteEn: string | null;
  noteTa: string | null;
}

export interface LuckyDate {
  /** The muhurta engine's own verdict. `slot.score` is never overwritten. */
  slot: MuhurtaSlot;
  numerology: DateNumerology;
  /** slot.score + numerology.adjustment — what the ranking actually used. */
  adjustedScore: number;
}

export interface LuckyDatesResponse {
  activity: string;
  timezone: string;
  epoch: PersonalYearEpoch;
  favourableNumbers: number[];
  /** Best-first. Never more or fewer slots than /charts/{id}/muhurta returned. */
  dates: LuckyDate[];
  readingsAvailable: boolean;
  calculationVersion: string;
  traditionEn: string;
  traditionTa: string;
}

export interface NallaNeramWindow {
  start: string;
  end: string;
  /** "AM" | "PM" */
  period: string;
}

export interface MuhurthamNaal {
  /** ISO date. */
  date: string;
  weekday: BiText;
  pirai: BiText;
  tamilMonth: BiText;
  tamilDay: number;
  nakshatra: BiText;
  tithiNumber: number;
  paksha: string;
  nallaNeram: NallaNeramWindow[];
}

export interface MuhurthamNaalMatch {
  naal: MuhurthamNaal;
  taraNumber: number;
  taraName: BiText;
  taraQuality: "GOOD" | "NEUTRAL" | "AVOID";
  isChandrashtama: boolean;
  /** The almanac's verdict. Numerology reads this; it can never set it. */
  isRecommended: boolean;
  matchScore: number;
  reasons: BiText[];
}

export interface MuhurthamNaalContext {
  janmaNakshatra: BiText;
  janmaRasiNumber: number;
  chandrashtamaRasiNumber: number;
  recommendedCount: number;
  totalCount: number;
  source: string;
}

export interface NumerologyNaalMatch {
  match: MuhurthamNaalMatch;
  numerology: DateNumerology;
  adjustedScore: number;
}

export interface MarriageDatesResponse {
  year: number;
  epoch: PersonalYearEpoch;
  favourableNumbers: number[];
  context: MuhurthamNaalContext;
  /** Best-first, but recommended dates always sort ahead of the rest. */
  matches: NumerologyNaalMatch[];
  readingsAvailable: boolean;
  calculationVersion: string;
  traditionEn: string;
  traditionTa: string;
}

/**
 * Fortune Alignment: this native's numbers read against this native's chart.
 *
 * POST, and the body is optional — the date of birth comes from the chart, and
 * with no names supplied the psychic and destiny numbers still align. Names go
 * in the body rather than a query string so they stay out of access logs.
 */
export async function getFortuneAlignment(
  chartId: string,
  payload: FortuneAlignmentRequest = {},
): Promise<FortuneAlignmentResponse> {
  return getApiClient().post(
    `/charts/${encodeURIComponent(chartId)}/numerology/alignment`,
    payload,
  ) as Promise<FortuneAlignmentResponse>;
}

/* ── Chart-aware: name correction (Phase 5) ─────────────────────────────── */

/** The orthographic moves TN name correction uses. Show these, not just the spelling. */
export type SpellingOperation =
  | "lengthen_vowel"
  | "shorten_vowel"
  | "double_consonant"
  | "add_aspirate"
  | "drop_aspirate"
  | "append_vowel"
  | "swap_final_glide";

export interface NameCorrectionRequest {
  /** The spelling on the user's documents — the one correction targets. */
  name: string;
  /** 1 or 2. The backend refuses more: past two edits it is a different name. */
  maxEdits?: 1 | 2;
}

export interface NameVariant {
  spelling: string;
  reading: NumberReading;
  /**
   * How this spelling was derived. Render it — "the second 'a' was lengthened"
   * is a reason a user can weigh; "ranked first" is not.
   */
  operations: SpellingOperation[];
  /** Signed change in Chaldean total against the current spelling. */
  delta: number;
  alignment: NumberAlignment;
  /** Alignment points gained. Always positive — worse spellings are not offered. */
  improvement: number;
}

/** Why `alternatives` is empty when it is. Never render one as the other. */
export type NoChangeReason =
  /** The name's graha is benefic in this chart. The strongest possible answer. */
  | "benefic_lordship"
  | "not_misaligned"
  | "no_better_spelling";

export type AlternativesWithheldReason =
  /**
   * The engine DID find alternatives and the backend removed them: the
   * legal-consequence warning that must accompany any recommendation has not
   * cleared Tamil review. Say "not available yet" — never "your name is fine".
   */
  | "pending_content_review"
  | "alignment_unavailable";

export interface NameCorrectionResponse {
  original: string;
  originalReading: NumberReading;
  originalAlignment: NumberAlignment;
  /** Best-first, capped at 6. Read alongside the two reason fields below. */
  alternatives: NameVariant[];
  changeAdvised: boolean;
  noChangeReason: NoChangeReason | null;
  alternativesWithheldReason: AlternativesWithheldReason | null;
  /** Spellings examined before ranking — three of ninety reads very differently to three of six. */
  variantsConsidered: number;
  lagnaRasi: number;
  /**
   * Non-null whenever `alternatives` is non-empty; the backend refuses to
   * serialise one without the other. Display it with the list, not behind a
   * disclosure — users change legal names and then Aadhaar, KYC, passport and
   * certificates disagree for years.
   */
  legalWarningEn: string | null;
  legalWarningTa: string | null;
  readingsAvailable: boolean;
  calculationVersion: string;
  traditionEn: string;
  traditionTa: string;
}

/**
 * Name correction: score a name against this chart, and offer corrected
 * spellings only when the chart actually warrants a change.
 *
 * Both outcomes need a UI. "No change needed" is not an empty state — it is
 * the reading, and the one a standalone numerology app cannot produce.
 */
export async function getNameCorrection(
  chartId: string,
  payload: NameCorrectionRequest,
): Promise<NameCorrectionResponse> {
  return getApiClient().post(
    `/charts/${encodeURIComponent(chartId)}/numerology/name-correction`,
    payload,
  ) as Promise<NameCorrectionResponse>;
}

/* ── Two charts: Jathagam Porutham + Peyar Porutham (Phase 3, NUM-34) ───────
 *
 * Tamil practice ranks two instruments and so does this route:
 *
 *   Jathagam Porutham (ஜாதகப் பொருத்தம்) — the ten poruthams read from both
 *     horoscopes. DECIDES the match. Arrives as `astrology`.
 *   Peyar Porutham (பெயர் பொருத்தம்) — names and birth dates. The numerology
 *     instrument, valued because it needs no birth time. Read ALONGSIDE the
 *     astrology, never over it. Arrives as `peyarPorutham`.
 *
 * `authority` names the deciding instrument as a token, so the ranking is
 * machine-readable and does not depend on your layout. Lead your UI with
 * `astrology` and `overallLabel`; `peyarPorutham.score` is a second opinion.
 *
 * Peyar Porutham may move `combinedScore` by at most eight points, cannot move
 * it upward at all when the match carries a dosha or CAUTION, and under the
 * default basis cannot move it downward at all — every negative verdict in this
 * response comes from the poruthams.
 */

export type CompatibilityContext =
  | "MARRIAGE"
  | "FRIENDSHIP"
  | "BUSINESS"
  | "FAMILY"
  | "GENERAL";

/** How one graha regards the other. Asymmetric — read both directions. */
export type GrahaRegard = "friend" | "neutral" | "enemy";

/**
 * Which doctrine grades the number pair (server-configured, doctrine D4).
 *
 * `cheiro_series` (default) is Cheiro's own person-to-person doctrine — the
 * sympathetic groups {1,2,4,7} and {3,6,9}, 5 friendly with almost anyone. He
 * names sympathies and never enmities, so under this basis no pairing is graded
 * negative. `graha_maitri` reads Parashari natural friendship instead and does
 * produce negative grades.
 */
export type CompatibilityBasis = "cheiro_series" | "graha_maitri";

export type NumberRelation =
  /** Same sympathetic series, or friends both ways. */
  | "harmonious"
  /** Cheiro's 5 with anyone; or friend one way and neutral the other. */
  | "supportive"
  /** Nothing is claimed either way. NOT a negative verdict. */
  | "neutral"
  /**
   * Friend one way, enemy the other — `graha_maitri` only. Not a milder
   * "strained": the effort falls on one partner. Show `grahaRegardAToB` /
   * `grahaRegardBToA` so the reader can see which.
   */
  | "one_sided"
  /** Enemy one way, neutral the other. `graha_maitri` only. */
  | "strained"
  /** Enemies both ways. `graha_maitri` only. */
  | "difficult";

/**
 * Where the aggregate score landed. Deliberately NOT `NumberRelation` — a
 * relation is a fact about one pair, a band is where an average fell.
 */
export type CompatibilityBand =
  | "strong"
  | "supportive"
  | "neutral"
  | "guarded"
  | "difficult";

/**
 * Jathagam Porutham's verdict. Structured facts only — the engine's bilingual
 * summary and the ten-kuta breakdown live on POST /relationships/compare, which
 * is the route to call for the full reading.
 */
export interface PoruthamVerdict {
  /** Not always out of 10: `compatibilityContext` masks which kutas are scored. */
  totalScore: number;
  maxScore: number;
  percentage: number;
  /** Authoritative. Numerology never recomputes this. */
  label: "EXCELLENT" | "GOOD" | "AVERAGE" | "CAUTION";
  rajjuDosha: boolean;
  vedhaDosha: boolean;
  nadiDosha: boolean;
  nadiSeverity: string;
}

export interface NumberPair {
  /** "psychic" | "destiny" | "name" */
  kind: string;
  /** A's number aligned against A's OWN chart. Reported, not scored into pairScore. */
  a: NumberAlignment;
  /** B's number aligned against B's OWN chart. */
  b: NumberAlignment;
  /** Which doctrine produced `relation` and `pairScore`. */
  basis: CompatibilityBasis;
  relation: NumberRelation;
  /** 0-100 for this pair alone. */
  pairScore: number;
  /** Share of the aggregate, before renormalisation over the pairs present. */
  weight: number;
  /**
   * The graha (naisargika) view, sent under BOTH bases. Permanent friendship is
   * asymmetric — Rahu counts Venus a friend while Venus counts Rahu an enemy —
   * and which partner is on which side of that is the reading.
   */
  grahaRegardAToB: GrahaRegard;
  grahaRegardBToA: GrahaRegard;
  grahaRelation: NumberRelation;
  /** False when the two doctrines disagree on this pair. Not an error. */
  basesAgree: boolean;
  reasonEn: string | null;
  reasonTa: string | null;
}

/**
 * One partner's own name against their own birth date and chart — Pandit
 * Sethuraman's core doctrine, and what Tamil families actually act on when they
 * add or drop a letter.
 *
 * Null when that partner sent no name: "not asked", not "scored badly". Kept
 * out of `peyarPorutham.score` on purpose — it is a finding about one person.
 */
export interface NameHarmony {
  score: number;
  verdict: AlignmentVerdict;
  /** False for a functionally benefic graha — "your name already suits you". */
  changeAdvised: boolean;
}

/** பெயர் பொருத்தம் — the numerology half, beneath Jathagam Porutham. */
export interface PeyarPorutham {
  /** Destiny and psychic always; name only when BOTH names were supplied. */
  pairs: NumberPair[];
  score: number;
  band: CompatibilityBand;
  basis: CompatibilityBasis;
  nameHarmonyA: NameHarmony | null;
  nameHarmonyB: NameHarmony | null;
  /** Token, always present: "peyar_porutham". Render your own label from it. */
  method: string;
  /** Null while the Tamil corpus is unreviewed — see `readingsAvailable`. */
  methodEn: string | null;
  methodTa: string | null;
}

export interface NumerologyCompatibilityRequest {
  chartIdA: string;
  /** Must differ from chartIdA — the backend 422s a chart compared with itself. */
  chartIdB: string;
  /** Spelling on official records. The name pair is scored only if BOTH are given. */
  documentNameA?: string;
  documentNameB?: string;
  /** Masks which kutas the porutham evaluates. Defaults to "GENERAL". */
  compatibilityContext?: CompatibilityContext;
}

export interface NumerologyCompatibilityResponse {
  chartIdA: string;
  chartIdB: string;
  compatibilityContext: CompatibilityContext;
  /** Jathagam Porutham. Authoritative — everything below layers over it. */
  astrology: PoruthamVerdict;
  /** பெயர் பொருத்தம். Read alongside the astrology, never over it. */
  peyarPorutham: PeyarPorutham;
  /**
   * Which instrument decides, as a token: "jathagam_porutham". Ships even while
   * the Tamil corpus is dark, because the ranking is safety information — the
   * sentences saying the same thing (`precedence*`) are gated.
   */
  authority: string;
  /** Signed, bounded to ±8 — the same bound the date-scoring layer uses. */
  adjustment: number;
  /** True when a positive adjustment was withheld because the match is flagged. */
  clampedByAstrology: boolean;
  /** astrology.percentage + adjustment, clamped to 0-100. */
  combinedScore: number;
  /** Always identical to `astrology.label`. Render the verdict, not your own. */
  overallLabel: PoruthamVerdict["label"];
  lagnaRasiA: number;
  lagnaRasiB: number;
  readingsA: NumerologyReadings;
  readingsB: NumerologyReadings;
  precedenceEn: string | null;
  precedenceTa: string | null;
  summaryEn: string | null;
  summaryTa: string | null;
  readingsAvailable: boolean;
  calculationVersion: string;
  traditionEn: string;
  traditionTa: string;
}

/**
 * Jathagam Porutham for two charts, with Peyar Porutham read alongside it.
 *
 * Both charts must belong to the signed-in user and must be different. Dates of
 * birth come from the charts, never from the caller — pass only the names, and
 * only if you want the name pair scored.
 */
export async function getNumerologyCompatibility(
  payload: NumerologyCompatibilityRequest,
): Promise<NumerologyCompatibilityResponse> {
  return getApiClient().post(
    "/numerology/compatibility",
    payload,
  ) as Promise<NumerologyCompatibilityResponse>;
}

/** All nine numbers ranked for this chart, best first. Needs no user input. */
export async function getFavourableNumbers(
  chartId: string,
): Promise<FavourableNumbersResponse> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/numerology/favourable-numbers`,
  ) as Promise<FavourableNumbersResponse>;
}

/** Personal year/month/day for the native behind a chart. */
export async function getChartPersonalCycle(
  chartId: string,
  onDate?: string,
): Promise<PersonalCycleResponse> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/numerology/personal-cycle`,
    { onDate },
  ) as Promise<PersonalCycleResponse>;
}

/**
 * Muhurta slots re-ranked by numerology. Same parameters as the muhurta route
 * and the same slots — this layer adds and removes nothing, it only reorders.
 */
export async function getNumerologyLuckyDates(
  chartId: string,
  activity: string,
  dateFrom: string,
  dateTo: string,
): Promise<LuckyDatesResponse> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/numerology/lucky-dates`,
    { activity, dateFrom, dateTo },
  ) as Promise<LuckyDatesResponse>;
}

/** Curated almanac muhurtham naals for a year, re-ranked by numerology. */
export async function getNumerologyMarriageDates(
  chartId: string,
  year = 2027,
  recommendedOnly = false,
): Promise<MarriageDatesResponse> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/numerology/marriage-dates`,
    { year, recommendedOnly },
  ) as Promise<MarriageDatesResponse>;
}

/* ------------------------------------------------------------------------- *
 * Saved name sessions (NUM-58)
 * ------------------------------------------------------------------------- */

export interface NameSessionRequest {
  /** The spelling under consideration. Latin only (doctrine D3) — 422 otherwise. */
  name: string;
  /** The user's own note. Never interpretive copy, so never withheld. */
  label?: string | null;
  maxEdits?: number;
}

/**
 * One saved spelling, recomputed on every read.
 *
 * There is no stored score in this object and no field for one. `reading` and
 * `alignment` are computed on the request that returned it, so a saved session
 * follows the engine and the doctrine flags instead of freezing them.
 */
export interface SavedNameSession {
  nameSessionId: string;
  name: string;
  label: string | null;
  maxEdits: number;
  reading: NumberReading;
  alignment: NumberAlignment;
  savedAt: string;
  /** The engine version moved since this was saved; the numbers may differ. */
  recalculatedSinceSaved: boolean;
}

export interface NameSessionsResponse {
  sessions: SavedNameSession[];
  /** How many more spellings may be saved before the server refuses with 409. */
  remainingSlots: number;
  readingsAvailable: boolean;
  calculationVersion: string;
  traditionEn: string;
  traditionTa: string;
}

/**
 * Save a spelling to a chart's shortlist, and get the whole shortlist back.
 *
 * Returns the full list rather than the single new row, because a client that
 * has just saved a name always wants the list it now belongs to — the
 * alternative is a POST followed immediately by a GET recomputing the same
 * readings a second time.
 *
 * Saving a spelling already on the list updates it in place rather than adding
 * a duplicate. 409 once the chart holds its maximum.
 */
export async function saveNumerologyNameSession(
  chartId: string,
  payload: NameSessionRequest,
): Promise<NameSessionsResponse> {
  return getApiClient().post(
    `/charts/${encodeURIComponent(chartId)}/numerology/name-sessions`,
    payload,
  ) as Promise<NameSessionsResponse>;
}

/** A chart's saved-name shortlist, recomputed against the current engine. */
export async function getNumerologyNameSessions(
  chartId: string,
): Promise<NameSessionsResponse> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/numerology/name-sessions`,
  ) as Promise<NameSessionsResponse>;
}

/** Remove one saved spelling. Soft delete server-side. */
export async function deleteNumerologyNameSession(
  chartId: string,
  nameSessionId: string,
): Promise<void> {
  return getApiClient().delete(
    `/charts/${encodeURIComponent(chartId)}/numerology/name-sessions/${encodeURIComponent(nameSessionId)}`,
  ) as Promise<void>;
}
