/**
 * How a dosham is *reckoned* — counted from where, graded before and after its
 * protections, and what remains. Shared by web and mobile (DD-17, 2026-10-06).
 *
 * Why this exists: a practitioner reviewing a real chart found the cards said
 * "Mitigated · Low intensity" for a Rahu–Ketu axis that classical judgement
 * reads as reduced, *not* erased, and could not see that Sevvai was counted
 * from the Moon and Venus but not from the Lagna — the single most important
 * fact about that dosham. The engine now sends `residual`, `formationStrength`,
 * `referenceHouses` and `contextNotes`; this module is the one place that turns
 * them into words, so the two apps cannot word them differently.
 *
 * Every reader of an older payload (no `residual`) falls back to MILD for a
 * mitigated dosham, never to NONE: a mitigated dosham always leaves a residual,
 * so the fallback errs toward the doctrine (see feedback: fail-safe defaults).
 *
 * Tamil strings added here are pending native review.
 */
import type { ChartDoshamInsight, DoshamReferenceHouse, DoshamResidual } from "./types";
import { rasiName } from "./reading";

export type DoshamLang = "ta" | "en";
type Text = { ta: string; en: string };
const pick = (t: Text, lang: DoshamLang) => (lang === "ta" ? t.ta : t.en);

type ReckoningInput = Pick<ChartDoshamInsight, "isPresent" | "isCancelled" | "strength"> &
  Partial<Pick<ChartDoshamInsight, "residual" | "formationStrength" | "referenceHouses" | "contextNotes" | "name">>;

const RESIDUAL_OF_STRENGTH: Record<string, DoshamResidual> = { STRONG: "STRONG", PARTIAL: "MODERATE", WEAK: "MILD" };

/** The residual, with a doctrine-safe fallback for payloads that predate it. */
export function doshamResidual(d: ReckoningInput): DoshamResidual {
  if (!d.isPresent) return "NONE";
  if (d.residual && d.residual !== "NONE") return d.residual;
  if (d.isCancelled) return "MILD";
  return RESIDUAL_OF_STRENGTH[d.strength] ?? "MILD";
}

const RESIDUAL_ADJ: Record<Exclude<DoshamResidual, "NONE">, Text> = {
  // லேசான for Mild, per the 2026-09-23 native review of natalStrengthWord.
  MILD: { ta: "லேசான", en: "mild" },
  MODERATE: { ta: "மிதமான", en: "moderate" },
  STRONG: { ta: "வலுவான", en: "strong" },
};

/**
 * The one-chip standing of a mitigated dosham: "Mitigated · mild residual".
 * Replaces the bare "Mitigated", which read as "dosham-free".
 */
export function mitigatedStandingLabel(d: ReckoningInput, lang: DoshamLang): string {
  const residual = doshamResidual(d);
  const adj = RESIDUAL_ADJ[residual === "NONE" ? "MILD" : residual];
  return lang === "ta" ? `நிவர்த்தி · ${adj.ta} மீதத் தாக்கம்` : `Mitigated · ${adj.en} residual`;
}

/**
 * The severity chip beside the presence chip. Active doshams name their
 * intensity; mitigated ones name what remains — never "Low intensity", which
 * told a barely-offset strong placement and a comfortably-offset mild one the
 * same thing. Null when the dosham did not form.
 */
export function doshamSeverityChip(d: ReckoningInput, lang: DoshamLang): string | null {
  const residual = doshamResidual(d);
  if (residual === "NONE") return null;
  if (d.isCancelled) {
    const word: Text = residual === "MODERATE"
      ? { ta: "மீதத் தாக்கம்: மிதமானது", en: "Residual: moderate" }
      : { ta: "மீதத் தாக்கம்: லேசானது", en: "Residual: mild" };
    return pick(word, lang);
  }
  if (residual === "STRONG") return lang === "ta" ? "தீவிரம்: அதிகம்" : "High intensity";
  if (residual === "MODERATE") return lang === "ta" ? "தீவிரம்: மிதமானது" : "Moderate intensity";
  return lang === "ta" ? "தீவிரம்: லேசானது" : "Mild intensity";
}

const FORMATION_WORD: Record<string, Text> = {
  STRONG: { ta: "வலுவானது", en: "strong" },
  PARTIAL: { ta: "மிதமானது", en: "moderate" },
  WEAK: { ta: "லேசானது", en: "mild" },
};

/**
 * Before and after the protections, in one line — only for a mitigated dosham
 * whose payload carries the formation grade. "" otherwise.
 */
export function doshamBeforeAfterLine(d: ReckoningInput, lang: DoshamLang): string {
  if (!d.isPresent || !d.isCancelled || !d.formationStrength) return "";
  const before = FORMATION_WORD[d.formationStrength];
  if (!before) return "";
  const residual = doshamResidual(d);
  const after = RESIDUAL_ADJ[residual === "NONE" ? "MILD" : residual];
  return lang === "ta"
    ? `நிவர்த்திக்கு முன் இந்த அமைப்பு ${before.ta}. நிவர்த்திக்குப் பின் ${after.ta} மீதத் தாக்கம் உள்ளது — குறைந்துள்ளது, முழுமையாக நீங்கவில்லை.`
    : `Before its protections this placement grades ${before.en}. After them a ${after.en} residual influence remains — reduced, not erased.`;
}

const REFERENCE_NAME: Record<DoshamReferenceHouse["reference"], Text> = {
  LAGNA: { ta: "லக்னம்", en: "Lagna" },
  MOON: { ta: "சந்திரன்", en: "Moon" },
  VENUS: { ta: "சுக்கிரன்", en: "Venus" },
  D9_LAGNA: { ta: "நவாம்ச லக்னம்", en: "Navamsa Lagna" },
};

function ordinalEn(n: number): string {
  const tail = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${tail}`;
}

export type DoshamReferenceRow = {
  /** "Moon (Dhanusu)" — the reference point and its rasi, localised. */
  reference: string;
  /** "Mars in the 7th — a dosha house". */
  detail: string;
  /** True when this reference makes (or, for D9, repeats) the dosham. */
  counts: boolean;
};

/**
 * "Counted from" rows for a dosham card. Sevvai rows carry Mars's one house;
 * Rahu–Ketu rows carry the Rahu house then the Ketu house. Empty for doshams
 * the engine does not reckon from reference points.
 */
export function doshamReferenceRows(d: ReckoningInput, lang: DoshamLang): DoshamReferenceRow[] {
  const rows = d.referenceHouses ?? [];
  const isNodes = (d.name ?? "").toUpperCase() === "RAHU_KETU_DOSHAM";
  return rows.map((row) => {
    const reference = `${pick(REFERENCE_NAME[row.reference] ?? { ta: row.reference, en: row.reference }, lang)} (${rasiName(row.referenceRasi, lang)})`;
    let detail: string;
    if (isNodes && row.houses.length >= 2) {
      const [rahu, ketu] = row.houses;
      detail = lang === "ta"
        ? `ராகு ${rahu}-ஆம் வீட்டில், கேது ${ketu}-ஆம் வீட்டில் — ${row.counts ? "1, 2, 7, 8 வீடுகளில்" : "1, 2, 7, 8 வீடுகளுக்கு வெளியே"}`
        : `Rahu in the ${ordinalEn(rahu)}, Ketu in the ${ordinalEn(ketu)} — ${row.counts ? "on houses 1, 2, 7, 8" : "off houses 1, 2, 7, 8"}`;
    } else {
      const house = row.houses[0];
      detail = lang === "ta"
        ? `செவ்வாய் ${house}-ஆம் வீட்டில் — ${row.counts ? "தோஷ வீடு" : "தோஷ வீடு அல்ல"}`
        : `Mars in the ${ordinalEn(house)} — ${row.counts ? "a dosha house" : "not a dosha house"}`;
    }
    return { reference, detail, counts: row.counts };
  });
}

/**
 * Context notes the engine attaches without counting them (DD-17). Every key
 * the engine emits must be here — tests/test_marker_label_coverage.py reads
 * this table alongside the web panel's MARKER_LABELS.
 */
export const DOSHAM_CONTEXT_LABELS: Record<string, Text> = {
  sevvai_not_from_lagna: {
    ta: "லக்னத்திலிருந்து செவ்வாய் தோஷ வீட்டில் இல்லை; சந்திரன் அல்லது சுக்கிரனிலிருந்து மட்டுமே தோஷம் கணக்கிடப்படுகிறது. லக்னத்திலிருந்து வரும் தோஷத்தை விட இதன் எடை குறைவு.",
    en: "Mars is not in a dosha house from your Lagna. The dosham is counted only from the Moon or Venus, which weighs less than a Lagna placement.",
  },
  rk_axis_not_repeated_from_moon_venus: {
    ta: "சந்திரனிலிருந்தும் சுக்கிரனிலிருந்தும் எண்ணும்போது ராகு-கேது 1, 2, 7, 8-ஆம் வீடுகளில் இல்லை. அச்சு மீண்டும் வராதது லேசான நிலையைக் காட்டுகிறது.",
    en: "Counted from your Moon and from Venus, the nodes do not fall on houses 1, 2, 7 or 8. The axis is not repeated, which is the lighter reading.",
  },
  rk_axis_repeated_in_navamsa: {
    ta: "நவாம்சத்திலும் (D9) ராகு-கேது அதன் லக்னத்திலிருந்து 1, 2, 7 அல்லது 8-ஆம் வீடுகளில் உள்ளன — அமைப்பு அங்கும் மீண்டும் வருகிறது.",
    en: "In the Navamsa (D9) the nodes again fall on houses 1, 2, 7 or 8 from its Lagna — the pattern repeats there.",
  },
  rk_axis_not_repeated_in_navamsa: {
    ta: "நவாம்சத்தில் (D9) ராகு-கேது 1, 2, 7, 8-ஆம் வீடுகளுக்கு வெளியே உள்ளன — அமைப்பு அங்கு மீண்டும் வரவில்லை.",
    en: "In the Navamsa (D9) the nodes fall outside houses 1, 2, 7 and 8 — the pattern does not repeat there.",
  },
};

/** Context lines for a card, in payload order; unknown keys are skipped, never printed raw. */
export function doshamContextLines(d: ReckoningInput, lang: DoshamLang): string[] {
  return (d.contextNotes ?? [])
    .map((key) => DOSHAM_CONTEXT_LABELS[key])
    .filter((t): t is Text => Boolean(t))
    .map((t) => pick(t, lang));
}

// ── L2: the one-line verdict (plan 2026-10-06, docs/DOSHAM_EXPLANATION_SURFACES_PLAN) ──
//
// Composed from the engine's structured fields, never stored as engine prose,
// so a doctrine change reaches the sentence on the next response. Each
// mitigation phrase is looked up by the marker the engine actually emitted —
// a phrase can never name a protection that took no part in the verdict.
//
// Semantics of `cancellationFactors` for a dosham: every entry lowers a grade;
// none erases a placement. `isCancelled` means the nivarthi threshold was
// reached and is shown as "Mitigated" (DD-17).

/** The doshams that get an L2 line on every surface: the two marriage doshams. */
export const VERDICT_DOSHAMS = new Set(["SEVVAI_DOSHAM", "RAHU_KETU_DOSHAM"]);

/** The two markers that classically cancel rather than soften (Sevvai). */
export const MAJOR_CANCELLATION_MARKERS = new Set(["jupiter_conjunct_mars", "both_partners_have_sevvai"]);

/**
 * Short noun phrases for every mitigation the Sevvai and Rahu–Ketu detectors
 * can emit. web/components/dosham-reckoning-block.test.tsx holds this table to
 * the detectors' marker list.
 */
export const MITIGATION_PHRASE: Record<string, Text> = {
  // Sevvai
  mars_own_sign: { ta: "செவ்வாய் ஆட்சி பெற்றிருப்பது", en: "Mars in its own sign" },
  mars_exaltation: { ta: "செவ்வாய் உச்சம் பெற்றிருப்பது", en: "Mars exalted" },
  tamil_sevvai_exception_cancer_leo: { ta: "கடகம்/சிம்ம லக்ன விதிவிலக்கு", en: "the Kadagam/Simmam lagna exception" },
  mars_lagna_lord_mitigation: { ta: "செவ்வாய் லக்னாதிபதியாக இருப்பது", en: "Mars as your lagna lord" },
  house_sign_nivarthi: { ta: "இட-ராசி நிவர்த்தி", en: "the house-sign nivarthi" },
  jupiter_aspect_on_mars: { ta: "செவ்வாய் மீது குருவின் பார்வை", en: "Jupiter's aspect on Mars" },
  jupiter_conjunct_mars: { ta: "குரு செவ்வாயுடன் சேர்ந்திருப்பது", en: "Jupiter joining Mars" },
  benefic_association_mars: { ta: "செவ்வாயுடன் சுப கிரகம் சேர்ந்திருப்பது", en: "a benefic beside Mars" },
  mars_dispositor_kendra_trikona: { ta: "செவ்வாயிலிருந்து அதன் ராசி அதிபதியின் நல்ல நிலை", en: "Mars's sign lord well placed from Mars" },
  benefic_strong_seventh_lord: { ta: "வலுவான 7-ஆம் அதிபதி", en: "a strong 7th lord" },
  seventh_lord_strong_d9: { ta: "நவாம்சத்தில் வலுவான 7-ஆம் அதிபதி", en: "the 7th lord strong in the Navamsa" },
  jupiter_aspects_seventh_lord: { ta: "7-ஆம் அதிபதி மீது குருவின் பார்வை", en: "Jupiter's aspect on the 7th lord" },
  both_partners_have_sevvai: { ta: "துணையின் ஜாதகத்திலும் ஒத்த செவ்வாய் நிலை", en: "a matching Sevvai in the partner's chart" },
  // Rahu–Ketu
  guru_joins_or_aspects_node: { ta: "ராகு/கேது மீது குருவின் தொடர்பு", en: "Jupiter's influence on the nodes" },
  guru_aspects_seventh_or_its_lord: { ta: "7-ஆம் வீடு அல்லது அதன் அதிபதி மீது குருவின் பார்வை", en: "Jupiter's aspect on the 7th house or its lord" },
  strong_seventh_lord: { ta: "வலுவான 7-ஆம் அதிபதி", en: "a strong 7th lord" },
  strong_eighth_lord_or_benefic_on_eighth: { ta: "8-ஆம் வீட்டிற்கான ஆதரவு", en: "support for the 8th house" },
  second_lord_dignified: { ta: "ஆட்சி அல்லது உச்சம் பெற்ற 2-ஆம் அதிபதி", en: "a dignified 2nd lord" },
  strong_second_lord_or_benefic_on_second: { ta: "2-ஆம் வீட்டிற்கான ஆதரவு", en: "support for the 2nd house" },
  node_in_favourable_sign_lineage: { ta: "தேர்ந்த மரபுப்படி ராகு/கேது இருக்கும் ராசி", en: "the node's sign, by the selected lineage" },
};

/** Ablative ("from the …") forms, with and without the Tamil -உம் for lists. */
const FROM_REF: Record<"LAGNA" | "MOON" | "VENUS", { en: string; ta: string; taAlso: string }> = {
  LAGNA: { en: "Lagna", ta: "லக்னத்திலிருந்து", taAlso: "லக்னத்திலிருந்தும்" },
  MOON: { en: "Moon", ta: "சந்திரனிலிருந்து", taAlso: "சந்திரனிலிருந்தும்" },
  VENUS: { en: "Venus", ta: "சுக்கிரனிலிருந்து", taAlso: "சுக்கிரனிலிருந்தும்" },
};

function joinEn(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** At most two named protections, then a count, so the line stays one line. */
function mitigationList(
  d: ReckoningInput & Partial<Pick<ChartDoshamInsight, "cancellationFactors">>,
  lang: DoshamLang,
): { text: string; count: number; truncated: boolean } {
  const named = (d.cancellationFactors ?? []).filter((m) => MITIGATION_PHRASE[m]);
  const shown = named.slice(0, 2).map((m) => pick(MITIGATION_PHRASE[m], lang));
  const rest = named.length - shown.length;
  const truncated = rest > 0;
  if (lang === "ta") {
    const base = shown.join(", ");
    return { text: truncated ? `${base} உட்பட ${named.length} காரணங்கள்` : base, count: named.length, truncated };
  }
  return { text: truncated ? `${shown.join(", ")} and ${rest} more` : joinEn(shown), count: named.length, truncated };
}

/** Tamil plural agreement: one phrase, a listed pair (ஆகியவை), or a counted group. */
function taVerb(count: number, truncated: boolean, singular: string, plural: string): string {
  if (count === 1) return singular;
  return truncated ? plural : `ஆகியவை ${plural}`;
}

const INTENSITY_WORD: Record<Exclude<DoshamResidual, "NONE">, Text> = {
  MILD: { ta: "லேசானது", en: "mild" },
  MODERATE: { ta: "மிதமானது", en: "moderate" },
  STRONG: { ta: "அதிகம்", en: "strong" },
};

function sevvaiReferenceSentence(d: ReckoningInput, lang: DoshamLang): string {
  const rows = (d.referenceHouses ?? []).filter((r) => r.reference in FROM_REF);
  const counted = rows.filter((r) => r.counts).map((r) => r.reference as keyof typeof FROM_REF);
  if (counted.length === 0) return "";
  const lagnaChecked = rows.some((r) => r.reference === "LAGNA");
  const notLagna = lagnaChecked && !counted.includes("LAGNA");
  if (lang === "ta") {
    const from = counted.length === 1 ? FROM_REF[counted[0]].ta : counted.map((r) => FROM_REF[r].taAlso).join(" ");
    return `${from} செவ்வாய் தோஷ வீட்டில் உள்ளது${notLagna ? "; லக்னத்திலிருந்து இல்லை" : ""}.`;
  }
  return `Mars is in a dosha house from your ${joinEn(counted.map((r) => FROM_REF[r].en))}${notLagna ? ", not from your Lagna" : ""}.`;
}

function nodeReferenceSentence(d: ReckoningInput, lang: DoshamLang): string {
  const lagna = (d.referenceHouses ?? []).find((r) => r.reference === "LAGNA");
  if (!lagna || lagna.houses.length < 2) return "";
  const [rahu, ketu] = lagna.houses;
  const axis = [rahu, ketu].sort((a, b) => a - b).join("/");
  return lang === "ta"
    ? `லக்னத்திலிருந்து ராகு ${rahu}-ஆம் வீட்டிலும் கேது ${ketu}-ஆம் வீட்டிலும் உள்ளன — ${axis} அச்சு.`
    : `Rahu is in the ${ordinalEn(rahu)} and Ketu in the ${ordinalEn(ketu)} from your Lagna — the ${axis} axis.`;
}

function outcomeSentence(
  d: ReckoningInput & Partial<Pick<ChartDoshamInsight, "cancellationFactors">>,
  lang: DoshamLang,
  nodes: boolean,
): string {
  const residual = doshamResidual(d);
  if (residual === "NONE") return "";
  const { text, count, truncated } = mitigationList(d, lang);
  const intensity = pick(INTENSITY_WORD[residual], lang);
  const adj = pick(RESIDUAL_ADJ[residual], lang);
  if (d.isCancelled) {
    if (lang === "ta") {
      const verb = taVerb(count, truncated, "இதைக் குறைக்கிறது", "இதைக் குறைக்கின்றன");
      const tail = nodes ? `; ஆனால் அமைப்பு அப்படியே உள்ளது — ${adj} மீதத் தாக்கம்.` : `; ${adj} மீதத் தாக்கம் உள்ளது.`;
      return count > 0 ? `${text} ${verb}${tail}` : `நிவர்த்தி காரணங்கள் இதைக் குறைக்கின்றன${tail}`;
    }
    const lead = count > 0 ? `${text.charAt(0).toUpperCase()}${text.slice(1)} ${count === 1 ? "softens" : "soften"} it` : "Protective factors soften it";
    return nodes
      ? `${lead}, but the placement itself remains: a ${adj} residual.`
      : `${lead}; a ${adj} residual remains.`;
  }
  if (count > 0) {
    return lang === "ta"
      ? `${text} ${taVerb(count, truncated, "சற்று மென்மையாக்குகிறது", "சற்று மென்மையாக்குகின்றன")}, ஆனால் ஈடுசெய்யவில்லை — தீவிரம்: ${intensity}.`
      : `${text.charAt(0).toUpperCase()}${text.slice(1)} ${count === 1 ? "softens" : "soften"} it, but not enough to offset it: ${intensity} intensity.`;
  }
  return lang === "ta"
    ? `இந்த ஜாதகத்தில் இதை ஈடுசெய்யும் பாதுகாப்பு இல்லை — தீவிரம்: ${intensity}.`
    : `No protection in this chart offsets it: ${intensity} intensity.`;
}

/**
 * L2: what was detected, what softened it, what remains — one or two short
 * sentences for Sevvai and Rahu–Ketu; "" for any other dosham, for one that
 * did not form, and for a payload that predates the reference rows.
 */
export function doshamVerdictLine(
  d: ReckoningInput & Partial<Pick<ChartDoshamInsight, "cancellationFactors">>,
  lang: DoshamLang,
): string {
  const name = (d.name ?? "").toUpperCase();
  if (!d.isPresent || !VERDICT_DOSHAMS.has(name)) return "";
  const nodes = name === "RAHU_KETU_DOSHAM";
  const reference = nodes ? nodeReferenceSentence(d, lang) : sevvaiReferenceSentence(d, lang);
  if (!reference) return "";
  return `${reference} ${outcomeSentence(d, lang, nodes)}`.trim();
}

/** The chart-specific meaning line, or "" when the engine sent none. */
export function doshamMeaning(d: Partial<Pick<ChartDoshamInsight, "meaningTa" | "meaningEn">>, lang: DoshamLang): string {
  return (lang === "ta" ? d.meaningTa : d.meaningEn)?.trim() ?? "";
}
