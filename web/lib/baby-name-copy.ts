import type {
  AksharaRelation,
  BabyNameCandidate,
  BabyNameEmptyReason,
  BabyNameGender,
  BabyNameMode,
  BabyNameRelaxation,
  MatchConfidence,
} from "@vinaadi/shared/api/numerology";

/**
 * Every user-visible string the Baby Name Finder needs, in one place.
 *
 * ## Why this module exists
 *
 * Three surfaces render the same result object — the marketing page
 * (`app/tools/baby-name-finder`), the dashboard Tools card
 * (`components/dashboard-tools-baby-names-nova.tsx`) and the Numerology panel
 * (`components/dashboard-numerology-baby-names-nova.tsx`) — and each had its
 * own copy of the labels. They drifted, and all three ended up printing
 * backend internals: `emptyReason` verbatim ("pada gated on unresolved
 * tamil_collapse rule"), `relaxationsApplied.join(", ")` as raw enum values,
 * and `Lagna 12` as a bare integer.
 *
 * ## Terminology
 *
 * Display follows Tamil almanac usage, not Sanskrit, on both the star names
 * (the backend now sends "Uthiradam", not "Uttara Ashadha") and the vocabulary
 * around them:
 *
 *   nakshatra  -> natchathiram / நட்சத்திரம்
 *   pada       -> paadham / பாதம்
 *   akshara    -> "opening letter" / தொடக்க எழுத்து
 *   lagna      -> lagnam / லக்னம், and always with its rasi NAME
 *
 * "Latin" is likewise not a word a Tamil parent uses about their own name —
 * the two scripts are Tamil and English spelling, and the confidence labels
 * say so.
 */

type BiText = { en: string; ta: string };

export const TERM = {
  natchathiram: { en: "Natchathiram", ta: "நட்சத்திரம்" },
  paadham: { en: "Paadham", ta: "பாதம்" },
  lagnam: { en: "Lagnam", ta: "லக்னம்" },
  openingLetter: { en: "Opening letter", ta: "தொடக்க எழுத்து" },
} satisfies Record<string, BiText>;

export function pick(text: BiText, ta: boolean): string {
  return ta ? text.ta : text.en;
}

/** "Uthiradam · 3rd paadham" / "உத்திராடம் · 3-ஆம் பாதம்" */
export function paadhamLabel(nakshatra: string, pada: number, ta: boolean): string {
  return ta ? `${nakshatra} · ${pada}-ஆம் பாதம்` : `${nakshatra} · Paadham ${pada}`;
}

/** "Lagnam: Dhanusu" — never the bare rasi number the API also sends. */
export function lagnamLabel(rasiName: string | null, ta: boolean): string | null {
  if (!rasiName) return null;
  return ta ? `லக்னம்: ${rasiName}` : `Lagnam: ${rasiName}`;
}

/**
 * "Uthiradam · Paadham 3 · Lagnam: Mesham" — the one context line above a
 * result, identical on the public page and both dashboard surfaces.
 */
export function contextLine(
  nakshatra: string,
  pada: number,
  rasiName: string | null,
  ta: boolean,
): string {
  const lagnam = lagnamLabel(rasiName, ta);
  return [paadhamLabel(nakshatra, pada, ta), lagnam].filter(Boolean).join(" · ");
}

/** Says where the opening letter came from, under the letter itself. */
export function aksharaSubLine(nakshatra: string, pada: number, ta: boolean): string {
  return ta
    ? `${nakshatra} நட்சத்திரத்தின் ${pada}-ஆம் பாதம் இந்த எழுத்தைக் குறிக்கிறது.`
    : `This is the letter ${nakshatra} paadham ${pada} calls for.`;
}

/* ==========================================================================
 * Scope — how far past this paadham's own letter a parent may look
 *
 * Until 2026-07-31 the tool offered the strict paadham rule and one unlabelled
 * "Allow other paadhams" toggle, with no explanation attached to either. That
 * is a stronger claim than it looks: it tells a parent, by omission, that a
 * name not opening with this paadham's letter is a mistake. It is not. A
 * working astrologer-numerologist regularly settles on a letter the paadham
 * rule would never have reached, having weighed the whole chart and the
 * numbers — and the family typically keeps the paadham letter as a separate
 * star name for the ceremony.
 *
 * So each rung gets a name, a one-line summary for the control, and a real
 * paragraph saying what the practice is and what it trades away. A widening
 * offered without its reasoning is either a trap or a shrug.
 * ========================================================================== */

/** Ladder order, narrowest first — also the order the control renders in. */
export const SCOPE_ORDER: BabyNameMode[] = [
  "pada_first",
  "pada_weighted",
  "rasi_wide",
  "open",
];

export const SCOPE_LABEL: Record<BabyNameMode, BiText> = {
  pada_first: { en: "This paadham only", ta: "இந்தப் பாதம் மட்டும்" },
  pada_weighted: { en: "Any paadham of this star", ta: "இந்த நட்சத்திரத்தின் எந்தப் பாதமும்" },
  rasi_wide: { en: "Any letter of this rasi", ta: "இந்த ராசியின் எந்த எழுத்தும்" },
  open: { en: "Any letter — chart and numbers decide", ta: "எந்த எழுத்தும் — ஜாதகமும் எண்ணும்" },
};

/** One line under the control, before anyone opens the explanation. */
export const SCOPE_SUMMARY: Record<BabyNameMode, BiText> = {
  pada_first: {
    en: "The strict almanac rule.",
    ta: "கறாரான பஞ்சாங்க விதி.",
  },
  pada_weighted: {
    en: "All four letters of the natchathiram.",
    ta: "நட்சத்திரத்தின் நான்கு எழுத்துக்களும்.",
  },
  rasi_wide: {
    en: "The nine paadhams inside the Moon rasi.",
    ta: "சந்திர ராசியில் உள்ள ஒன்பது பாதங்கள்.",
  },
  open: {
    en: "The letter rule set aside, on purpose.",
    ta: "எழுத்து விதியை வேண்டுமென்றே ஒதுக்கி.",
  },
};

/**
 * The actual explanation — what the practice is, and what it costs.
 *
 * `{rasi}` is interpolated with the Moon rasi's name where it appears; a
 * scope described as "your rasi" without naming the rasi is not an
 * explanation.
 */
export const SCOPE_EXPLAINER: Record<BabyNameMode, BiText> = {
  pada_first: {
    en: "The traditional rule, and the strictest reading of it: only names that open with the letter this exact paadham calls for. Choose this when you want the naming to follow the almanac without qualification.",
    ta: "மரபான விதி, அதன் மிகக் கறாரான வடிவில்: இந்தப் பாதம் குறிக்கும் எழுத்தில் தொடங்கும் பெயர்கள் மட்டுமே. பஞ்சாங்க வழக்கை அப்படியே பின்பற்ற விரும்பினால் இதைத் தேர்ந்தெடுங்கள்.",
  },
  pada_weighted: {
    en: "All four letters of the natchathiram, not only this paadham's. Widely accepted, and worth knowing why: the paadham depends on the birth time to the minute, so a birth close to a paadham boundary can fall either side of it depending on the time recorded and the ayanamsa used. The natchathiram itself is far harder to shift. Many almanacs print all four letters and leave the choice to the family.",
    ta: "இந்தப் பாதத்தின் எழுத்து மட்டுமல்ல, நட்சத்திரத்தின் நான்கு எழுத்துக்களும். இது பரவலாக ஏற்கப்பட்ட வழக்கம் — காரணமும் உண்டு: பாதம் பிறந்த நேரத்தை நிமிடம் வரை சார்ந்தது; பாத எல்லைக்கு அருகில் பிறந்தால், குறித்து வைத்த நேரத்தையும் பயன்படுத்திய அயனாம்சத்தையும் பொறுத்து பாதம் மாறிவிடும். நட்சத்திரம் அவ்வளவு எளிதில் மாறாது. பல பஞ்சாங்கங்கள் நான்கு எழுத்துக்களையும் அச்சிட்டு, தேர்வைக் குடும்பத்திடமே விடுகின்றன.",
  },
  rasi_wide: {
    en: "The nine paadhams that fall inside the Moon rasi ({rasi}) — a South Indian practice in its own right, where the child is named from the rasi letter rather than the paadham letter. Note this is not simply a wider version of the star scope: a natchathiram can straddle a rasi boundary, so this brings in letters belonging to neighbouring stars. Your own star's four letters stay included.",
    ta: "சந்திர ராசியில் ({rasi}) அடங்கும் ஒன்பது பாதங்கள் — இது தனியொரு தென்னிந்திய வழக்கம்; பாத எழுத்துக்குப் பதிலாக ராசி எழுத்தில் பெயர் வைப்பது. இது நட்சத்திர வட்டத்தின் வெறும் விரிவாக்கம் அல்ல என்பதைக் கவனியுங்கள்: ஒரு நட்சத்திரம் ராசி எல்லையைத் தாண்டி நிற்கக்கூடும், எனவே அடுத்த நட்சத்திரங்களுக்குரிய எழுத்துக்களும் இதில் சேரும். உங்கள் நட்சத்திரத்தின் நான்கு எழுத்துக்களும் இதிலும் இருக்கும்.",
  },
  open: {
    en: "The letter rule set aside: every name in the list, ordered by how its number sits with this chart. This is what an astrologer-numerologist does when the chart and the numbers point to a name the paadham letter would never have reached — a long-standing practice, and usually one where the paadham letter is still kept as a separate star name for the ceremony. Names that do open with your paadham letter still come first here, and every card says which paadham its own letter belongs to.",
    ta: "எழுத்து விதியை ஒதுக்கி வைத்து, பட்டியலில் உள்ள எல்லாப் பெயர்களும் — ஒவ்வொரு பெயரின் எண் இந்த ஜாதகத்தோடு எப்படிப் பொருந்துகிறது என்பதை வைத்து வரிசைப்படுத்தப்படும். ஜாதகமும் எண்களும் பாத எழுத்து எட்டாத ஒரு பெயரைச் சுட்டும்போது ஜோதிட-எண் கணிதர் செய்வது இதுதான் — இது நெடுங்கால வழக்கம்; பொதுவாகச் சடங்குக்கான நட்சத்திரப் பெயர் தனியே வைத்துக்கொள்ளப்படும். உங்கள் பாத எழுத்தில் தொடங்கும் பெயர்கள் இங்கும் முதலில் வரும்; ஒவ்வொரு பெயரும் தன் எழுத்து எந்தப் பாதத்துக்குரியது என்பதைச் சொல்லும்.",
  },
};

/** Fills `{rasi}` in `SCOPE_EXPLAINER`; harmless on the rungs without it. */
export function scopeExplainer(
  mode: BabyNameMode,
  rasiName: string | null,
  ta: boolean,
): string {
  const fallback = ta ? "சந்திர ராசி" : "the Moon rasi";
  return pick(SCOPE_EXPLAINER[mode], ta).replace("{rasi}", rasiName || fallback);
}

/**
 * The standing answer to "must the name start with this letter?" — shown
 * whatever scope is selected, because it is the question a parent arrives
 * with and the strict list alone answers it wrongly.
 *
 * The concrete case this was written for: a child born Uthiradam paadham 3
 * (ஜா) whose astrologer-numerologist named her from the chart and the
 * numbers, on a letter no paadham of her rasi carries. Nothing in this tool
 * should imply that name is a mistake, and before this note the strict list
 * implied exactly that by saying nothing at all.
 */
export const MUST_IT_BEGIN_Q: BiText = {
  en: "Must the name begin with this letter?",
  ta: "பெயர் இந்த எழுத்தில்தான் தொடங்க வேண்டுமா?",
};

export const MUST_IT_BEGIN_A: BiText = {
  en: "The paadham letter is the tradition's own answer, and it is what a naming ceremony uses — but it is not the only accepted practice. Many families keep two names: the star name taken from this letter, said at the ceremony and in temple sankalpam, and the everyday name chosen for its meaning, for family custom, or by an astrologer weighing the whole chart and the numbers together. A name that does not begin with this letter is not a mistake; it is a different choice inside the same tradition. Use the scope control above to search the way your own astrologer does.",
  ta: "பாத எழுத்து மரபு தரும் பதில்; நாமகரணச் சடங்கில் பயன்படுத்தப்படுவதும் அதுவே — ஆனால் அது ஒன்று மட்டுமே வழக்கம் அல்ல. பல குடும்பங்கள் இரு பெயர்களை வைத்துக்கொள்கின்றன: சடங்கிலும் கோயில் சங்கல்பத்திலும் சொல்லப்படும் நட்சத்திரப் பெயர் ஒன்று, அன்றாடம் அழைக்கப்படும் பெயர் இன்னொன்று. அன்றாடப் பெயர் பொருளை வைத்தோ, குடும்ப வழக்கத்தை வைத்தோ, ஜாதகத்தையும் எண்களையும் சேர்த்துப் பார்த்து ஜோதிடர் சொல்வதை வைத்தோ அமையலாம். இந்த எழுத்தில் தொடங்காத பெயர் தவறு அல்ல — அதே மரபுக்குள் இருக்கும் வேறொரு தேர்வு. உங்கள் ஜோதிடர் பார்க்கும் விதத்திலேயே தேட, மேலே உள்ள வரம்புத் தேர்வைப் பயன்படுத்துங்கள்.",
};

/**
 * These practice notes are claims about naming custom, not table lookups, and
 * they have not been through the astrologer either. Said once, next to
 * `TWO_NAMES_NOTE`, rather than hedged into every paragraph above.
 */
export const SCOPE_REVIEW_NOTE: BiText = {
  en: "These notes on naming practice are awaiting the same astrologer review as the letter table.",
  ta: "பெயர் வைக்கும் வழக்கம் குறித்த இந்தக் குறிப்புகளும், எழுத்து அட்டவணையைப் போலவே, ஜோதிடர் மதிப்பாய்வுக்குக் காத்திருக்கின்றன.",
};

/**
 * States the ranking rule once, above the list. Without it, a reader sees a
 * relation chip, a confidence note, a chart-fit score, and Cheiro's compound
 * register all on one card and has no way to tell which of those actually
 * decides where the card sits — only the first two do (see
 * `numerology_naming_service.py`'s `sort_key`), the chart-fit score only
 * breaks ties within that, and the compound register is bibliography that
 * never affects order at all.
 *
 * Awaiting the same astrologer / native-speaker review as the rest of this
 * file's practice notes (see `SCOPE_REVIEW_NOTE`).
 */
export const ORDER_EXPLAINER: BiText = {
  en: "The top of this list is the name that follows the letter rule most closely — not the one that fits the chart best. Order is decided in this priority: (1) which letter rule admitted the name — this paadham, then this natchathiram, then this rasi, then wider; (2) how firmly its spelling pins it to that letter; (3) chart fit, which only breaks ties inside the two above. So a name further down can carry a higher score than the one at the top.",
  ta: "இந்தப் பட்டியலின் முதல் பெயர் என்பது எழுத்து விதியை மிக நெருக்கமாகப் பின்பற்றும் பெயர் — ஜாதகத்தோடு அதிகம் பொருந்தும் பெயர் அல்ல. வரிசை இந்த முன்னுரிமையில் முடிவாகிறது: (1) எந்த எழுத்து விதி அந்தப் பெயரை அனுமதித்தது — இந்தப் பாதம், பின் இந்த நட்சத்திரம், பின் இந்த ராசி, பின் விரிவானது; (2) அதன் எழுத்து அந்த ஒலியை எவ்வளவு உறுதியாகக் குறிக்கிறது; (3) ஜாதகப் பொருத்தம் — மேற்சொன்ன இரண்டுக்குள் மட்டுமே இது வரிசையை முடிவு செய்யும். எனவே கீழே உள்ள ஒரு பெயருக்கு, மேலே உள்ள பெயரைவிட அதிக மதிப்பெண் இருக்கலாம்.",
};

/* ==========================================================================
 * Group headings — the recommendation order, made structural
 *
 * A flat list numbered #1..#6 asserts one ranking by merit. It is not one:
 * a 59 that opens this paadham's own letter outranks an 85 that does not,
 * because the akshara decides who is eligible and the number only orders
 * within that (doctrine D2). A parent read that list twice and twice asked
 * why 59 beat 85 — and they were right to, because no paragraph above a
 * numbered list survives the list. Structure beats prose, so the sort key
 * becomes the structure: one heading per letter rule, in D2 order, each
 * saying what this group IS FOR rather than where it placed.
 * ========================================================================== */

export const GROUP_HEADING: Record<AksharaRelation, BiText> = {
  on_paadham: {
    en: "Opens this paadham's own letter",
    ta: "இந்தப் பாதத்தின் சொந்த எழுத்தில் தொடங்குபவை",
  },
  same_natchathiram: {
    en: "Another paadham of the same natchathiram",
    ta: "இதே நட்சத்திரத்தின் இன்னொரு பாதம்",
  },
  same_rasi: {
    en: "Another paadham inside the same rasi",
    ta: "இதே ராசிக்குள் வரும் இன்னொரு பாதம்",
  },
  other_paadham: {
    en: "Opens a different letter",
    ta: "வேறு எழுத்தில் தொடங்குபவை",
  },
  no_paadham: {
    en: "Outside the paadham letter table",
    ta: "பாத எழுத்து அட்டவணைக்கு வெளியே",
  },
};

/** What this group is *for* — the practitioner's actual advice, one line. */
export const GROUP_ADVICE: Record<AksharaRelation, BiText> = {
  on_paadham: {
    // Must not read as a blanket endorsement of every name under it. Live
    // check, Kettai paadham 1: the ONLY on-paadham name was "Noel", which is
    // flagged `adviseAgainst` — so unconditional "take it from here" sat
    // directly above a name this tool advises setting aside.
    en: "The tradition's own answer — the name used at the naming ceremony and in temple sankalpam. Choose from here where you can; where a spelling below is flagged, another spelling of the same name usually clears it.",
    ta: "மரபு தரும் பதில் — நாமகரணச் சடங்கிலும் கோயில் சங்கல்பத்திலும் சொல்லப்படுவது இதுவே. முடிந்தவரை இதிலிருந்தே தேர்ந்தெடுங்கள்; கீழே ஒரு எழுத்துக்கோர்வை குறிக்கப்பட்டிருந்தால், அதே பெயரின் வேறு எழுத்துக்கோர்வை பொதுவாகச் சரியாக அமையும்.",
  },
  same_natchathiram: {
    en: "Widely accepted: the paadham depends on the birth time to the minute, so many almanacs print all four letters of the star and leave the choice to the family.",
    ta: "பரவலாக ஏற்கப்பட்டது: பாதம் பிறந்த நேரத்தை நிமிடம் வரை சார்ந்தது; எனவே பல பஞ்சாங்கங்கள் நட்சத்திரத்தின் நான்கு எழுத்துக்களையும் அச்சிட்டு, தேர்வைக் குடும்பத்திடமே விடுகின்றன.",
  },
  same_rasi: {
    en: "A South Indian practice in its own right — naming from the rasi letter rather than the paadham letter.",
    ta: "தனியொரு தென்னிந்திய வழக்கம் — பாத எழுத்துக்குப் பதிலாக ராசி எழுத்தில் பெயர் வைப்பது.",
  },
  other_paadham: {
    en: "Here because you widened the scope. Sound as an everyday name when the chart supports the number — and families commonly keep a paadham-letter star name alongside it.",
    ta: "நீங்கள் வரம்பை விரிவாக்கியதால் இங்கு வந்தவை. ஜாதகம் அந்த எண்ணை ஆதரித்தால் அன்றாடப் பெயராக இவை சரியே — பொதுவாகக் குடும்பங்கள் பாத எழுத்துப் பெயரையும் சேர்த்தே வைத்துக்கொள்கின்றன.",
  },
  no_paadham: {
    en: "Chosen on meaning and number alone — the akshara rule set aside on purpose.",
    ta: "பொருளையும் எண்ணையும் மட்டும் வைத்துத் தேர்ந்தவை — எழுத்து விதி வேண்டுமென்றே ஒதுக்கப்பட்டது.",
  },
};

/** Says how names are ordered *inside* a group, where it really is by score. */
export const WITHIN_GROUP_ORDER: BiText = {
  en: "Best chart fit first.",
  ta: "ஜாதகப் பொருத்தம் அதிகமுள்ளவை முதலில்.",
};

/** Declaration order IS doctrine D2's order — most on-target first. */
export const RELATION_ORDER: AksharaRelation[] = [
  "on_paadham",
  "same_natchathiram",
  "same_rasi",
  "other_paadham",
  "no_paadham",
];

/**
 * Split an already-ranked candidate list into its letter-rule groups.
 *
 * Preserves the server's order inside each group — it is authoritative (see
 * `_sort_key`) and must never be re-sorted here. Empty groups are dropped, so
 * a strict search still renders exactly one heading.
 */
export function groupByRelation<T extends { relation: AksharaRelation }>(
  candidates: T[],
): { relation: AksharaRelation; items: T[] }[] {
  return RELATION_ORDER.map((relation) => ({
    relation,
    items: candidates.filter((c) => c.relation === relation),
  })).filter((group) => group.items.length > 0);
}

/* ==========================================================================
 * The one negative call this tool makes
 * ========================================================================== */

/**
 * `adviseAgainst` — from `should_advise_name_change`, the same guard Fortune
 * Alignment uses. What it REFUSES to flag is the point: a functionally benefic
 * graha is never a reason to reject a name, so "8 is unlucky" can never
 * surface here. Only a non-benefic lordship that is also misaligned trips it.
 *
 * Worded as advice about a *spelling*, never about the child or the name's
 * worth — a different spelling of the same name usually clears it, which is
 * what the name-correction tool is for.
 */
export const ADVISE_AGAINST_CHIP: BiText = {
  en: "I'd set this spelling aside",
  ta: "இந்த எழுத்துக்கோர்வையை ஒதுக்கலாம்",
};

export function adviseAgainstNote(
  grahaName: string,
  natureLabel: string,
  ta: boolean,
): string {
  return ta
    ? `இந்தச் சொற்பொருள் எண் ${grahaName}-க்குரியது; இந்த ஜாதகத்தில் ${grahaName} ${natureLabel} — ஆதரவான பொறுப்பு அல்ல — மேலும் பொருத்தமும் குறைவு. பெயரை அல்ல, இந்த எழுத்துக்கோர்வையை மாற்றிப் பாருங்கள்.`
    : `This spelling's number belongs to ${grahaName}, which is ${natureLabel} in this chart — not a supportive role — and the fit is low as well. It is the spelling to reconsider, not the name.`;
}

/**
 * Why the parent's own name can sit lower than its score suggests.
 *
 * Shown only on a shortlist card whose relation is not `on_paadham`. The
 * spelling tier no longer costs it a place (see `_confidence_rank` in
 * `numerology_naming_service.py`), but the LETTER RULE still does, by
 * doctrine — and a parent looking at "85 / 100" three rows below a name
 * scoring 60 is owed the reason.
 */
export const WHY_YOUR_NAME_SITS_HERE: BiText = {
  en: "Its position follows the letter rule, not its score — names opening with this paadham's own letter come first however they score.",
  ta: "இதன் இடம் மதிப்பெண்ணை அல்ல, எழுத்து விதியைப் பின்பற்றுகிறது — இந்தப் பாதத்தின் சொந்த எழுத்தில் தொடங்கும் பெயர்கள், மதிப்பெண் எதுவாயினும், முதலில் வரும்.",
};

/* ==========================================================================
 * Relation — which rule admitted THIS name
 * ========================================================================== */

/**
 * A widened list must never read like a strict one.
 *
 * Once the scope opens, a name from a neighbouring star sits on the same page
 * as one the paadham actually calls for. Without a per-card label the parent
 * cannot tell them apart, and the tool would be passing off a name it reached
 * for as one the tradition chose.
 */
export const RELATION_CHIP: Record<AksharaRelation, BiText> = {
  on_paadham: { en: "Your paadham letter", ta: "உங்கள் பாத எழுத்து" },
  same_natchathiram: { en: "Your natchathiram", ta: "உங்கள் நட்சத்திரம்" },
  same_rasi: { en: "Your rasi", ta: "உங்கள் ராசி" },
  other_paadham: { en: "Another paadham", ta: "வேறு பாதம்" },
  no_paadham: { en: "Outside the letter table", ta: "எழுத்து அட்டவணைக்கு வெளியே" },
};

export const RELATION_TONE: Record<AksharaRelation, "high" | "mid" | "neutral"> = {
  on_paadham: "high",
  same_natchathiram: "mid",
  same_rasi: "mid",
  other_paadham: "neutral",
  no_paadham: "neutral",
};

/**
 * Per-card sentence for a name the strict rule would not have offered.
 *
 * Null for an on-paadham name — that one needs no accounting for, and a note
 * on every card would drown the ones that do.
 *
 * Naming the paadham a letter DOES open is the point: "ஆ opens Kaarthigai
 * paadham 1" is an answer a parent can take to their astrologer, where "not
 * your paadham" is only a verdict.
 */
export function relationNote(
  candidate: Pick<BabyNameCandidate, "relation" | "aksharaTa" | "nakshatraTa" | "nakshatraEn" | "pada">,
  rasiName: string | null,
  ta: boolean,
): string | null {
  const star = ta ? candidate.nakshatraTa : candidate.nakshatraEn;
  const opens =
    candidate.aksharaTa && star && candidate.pada
      ? ta
        ? `${candidate.aksharaTa} — ${star} ${candidate.pada}-ஆம் பாதம்`
        : `${candidate.aksharaTa} — ${star} paadham ${candidate.pada}`
      : null;

  switch (candidate.relation) {
    case "on_paadham":
      return null;
    case "same_natchathiram":
      return ta
        ? `${opens}. குழந்தையின் நட்சத்திரத்தின் இன்னொரு பாதம்.`
        : `Opens ${opens} — another paadham of the child's own natchathiram.`;
    case "same_rasi":
      return ta
        ? `${opens}. குழந்தையின் ${rasiName || "ராசி"} ராசிக்குள் வரும் பாதம்.`
        : `Opens ${opens} — inside the child's rasi${rasiName ? `, ${rasiName}` : ""}.`;
    case "other_paadham":
      return ta
        ? `${opens}. இது குழந்தையின் பாதமோ ராசியோ அல்ல — எழுத்து வரம்பைத் திறந்ததால் வந்தது.`
        : `Opens ${opens} — neither the child's paadham nor their rasi. It is here because you opened the letter scope.`;
    case "no_paadham":
    default:
      return ta
        ? "இதன் தொடக்க எழுத்து 108 பாத எழுத்துக்களில் இல்லை — பொருளையும் எண்ணையும் வைத்துத் தேர்ந்தெடுக்கப்படும் பெயர்."
        : "Its opening letter is not one of the 108 paadham letters — a name chosen on meaning and number alone.";
  }
}

/**
 * How firmly a name's opening is pinned to this paadham.
 *
 * Reworded away from the engine's own vocabulary: "Latin match" told a parent
 * nothing, and "Ambiguous" reads as a fault in the name rather than a limit of
 * what one script can prove.
 */
export const CONFIDENCE_LABEL: Record<MatchConfidence, BiText> = {
  confirmed: { en: "Tamil + English agree", ta: "தமிழ், ஆங்கிலம் இரண்டிலும் பொருந்துகிறது" },
  tamil_only: { en: "Tamil spelling matches", ta: "தமிழ் எழுத்தில் பொருந்துகிறது" },
  latin_only: { en: "English spelling matches", ta: "ஆங்கில எழுத்தில் பொருந்துகிறது" },
  ambiguous: { en: "Close match", ta: "ஏறத்தாழப் பொருந்துகிறது" },
};

/**
 * Short form for a chip, where the full sentence above will not fit.
 *
 * Deliberately avoids the word "match" — this chip sits on the same card as
 * the chart-numerology alignment score (0-100). "Strong match" next to a
 * 30/100 score read as a contradiction, but the two describe unrelated
 * things: this chip is pure spelling confidence (does Tamil + English both
 * confirm the paadham letter), never the numerology score.
 */
export const CONFIDENCE_CHIP: Record<MatchConfidence, BiText> = {
  confirmed: { en: "Spelling confirmed", ta: "எழுத்து உறுதி" },
  tamil_only: { en: "Tamil spelling only", ta: "தமிழ் எழுத்தில் மட்டும்" },
  latin_only: { en: "English spelling only", ta: "ஆங்கில எழுத்தில் மட்டும்" },
  ambiguous: { en: "Approx. spelling", ta: "தோராயமான எழுத்து" },
};

export const CONFIDENCE_TONE: Record<MatchConfidence, "high" | "mid" | "neutral"> = {
  confirmed: "high",
  tamil_only: "mid",
  latin_only: "mid",
  ambiguous: "neutral",
};

export const GENDER_LABEL: Record<BabyNameGender, BiText> = {
  m: { en: "Boy", ta: "ஆண்" },
  f: { en: "Girl", ta: "பெண்" },
  n: { en: "Any", ta: "பொது" },
};

/**
 * What the backend widened, in words a parent can act on.
 *
 * These were previously printed as raw enum values, joined by commas —
 * "allow_single_script, drop_gender" under the heading "Search was widened".
 */
export const RELAXATION_LABEL: Record<BabyNameRelaxation, BiText> = {
  allow_tamil_collapse: {
    en: "this paadham's Tamil letter stands for several sounds, so English spellings were weighed too",
    ta: "இந்தப் பாதத்தின் தமிழ் எழுத்து பல ஒலிகளைக் குறிப்பதால், ஆங்கில எழுத்துக்களும் கணக்கில் எடுக்கப்பட்டன",
  },
  allow_single_script: {
    en: "names confirmed by one spelling rather than both",
    ta: "இரண்டிலும் அல்லாமல் ஒரு எழுத்து முறையில் மட்டும் உறுதியான பெயர்கள்",
  },
  allow_ambiguous: {
    en: "close matches included",
    ta: "ஏறத்தாழப் பொருந்தும் பெயர்களும் சேர்க்கப்பட்டன",
  },
  sibling_padas: {
    en: "names from this natchathiram's other paadhams",
    ta: "இதே நட்சத்திரத்தின் மற்ற பாதங்களின் பெயர்கள்",
  },
  rasi_padas: {
    en: "names from the other paadhams of this rasi",
    ta: "இந்த ராசியின் மற்ற பாதங்களின் பெயர்கள்",
  },
  any_akshara: {
    en: "names whose opening letter belongs to another paadham entirely",
    ta: "வேறு பாதங்களுக்குரிய எழுத்தில் தொடங்கும் பெயர்கள்",
  },
  drop_gender: {
    en: "boys' and girls' names together",
    ta: "ஆண், பெண் பெயர்கள் இரண்டும்",
  },
};

export function relaxationSentence(
  applied: BabyNameRelaxation[],
  ta: boolean,
): string | null {
  const parts = applied
    .map((step) => RELAXATION_LABEL[step])
    .filter(Boolean)
    .map((text) => pick(text, ta));
  if (parts.length === 0) return null;
  const lead = ta ? "தேடல் விரிவாக்கப்பட்டது" : "Search was widened";
  return `${lead}: ${parts.join(ta ? "; " : "; ")}.`;
}

/**
 * Why nothing came back — and, where the user can do something about it, what.
 *
 * `akshara` is interpolated because "no name begins with ஜா" is a complete,
 * checkable answer, where "no names matched" is not.
 */
export function emptyMessage(
  code: BabyNameEmptyReason | null,
  aksharaTa: string,
  aksharaEn: string,
  ta: boolean,
): string {
  const letter = ta ? aksharaTa : `${aksharaTa} (${aksharaEn})`;
  switch (code) {
    case "collapse_gated":
      // Until 2026-08-02 this pointed at a "More options" checkbox that let
      // the parent override the gate. That checkbox is gone (it asked them to
      // rule on NU-8a, an open practitioner question), so the remedy offered
      // here has to be one they can actually act on. Measured over the
      // shipping corpus: of the 9 collapse-gated empty searches, ALL 9 return
      // names one rung out at natchathiram scope — so naming that rung is a
      // real instruction, not a shrug.
      return ta
        ? `இந்தப் பாதத்தின் தொடக்க எழுத்து ${letter}. இந்தத் தமிழ் எழுத்து பல வடமொழி ஒலிகளைக் குறிப்பதால், தமிழ் மற்றும் ஆங்கிலம் இரண்டிலும் உறுதிப்படும் பெயர்கள் மட்டுமே இங்கு காட்டப்படுகின்றன — அப்படி எதுவும் எங்கள் பட்டியலில் இல்லை. வரம்பை "இந்த நட்சத்திரத்தின் எந்தப் பாதமும்" என விரிவாக்கினால் பெயர்கள் கிடைக்கும்.`
        : `This paadham opens with ${letter}. That Tamil letter stands for several different sounds, so only names confirmed by both the Tamil and the English spelling are offered here — and our list has none. Widen the scope to “any paadham of this star” and names will appear.`;
    case "no_candidate_fits":
      // A few paadham letters (ங, ணா, ட-initials) genuinely cannot begin a
      // Tamil personal name, so for those births the strict rule has no
      // answer to give at all. That is exactly the case the wider scopes
      // exist for, and the message has to say so or it reads as a dead end.
      return ta
        ? `இந்தப் பாதத்தின் தொடக்க எழுத்து ${letter}. இந்த எழுத்தில் தொடங்கும் பெயர் எங்கள் பட்டியலில் இல்லை — சில பாத எழுத்துக்களில் தமிழ்ப் பெயர்களே தொடங்குவதில்லை. வரம்பை நட்சத்திரம், ராசி என விரிவாக்கிப் பாருங்கள்; பல குடும்பங்கள் இப்படித்தான் செய்கின்றன.`
        : `This paadham opens with ${letter}. No name in our list begins with it — and a few paadham letters cannot begin a Tamil name at all. Widen the scope to your natchathiram or your rasi; for these births that is what families do.`;
    case "pool_empty":
    default:
      return ta
        ? "இப்போது பெயர் பட்டியல் ஏதும் கிடைக்கவில்லை. சிறிது நேரம் கழித்து முயலவும்."
        : "The name list is unavailable right now. Please try again shortly.";
  }
}

/**
 * Shown when `readingsAvailable` is false — which is the state today.
 *
 * Each candidate's meaning goes through the same `reviewed_prose` gate as the
 * rest of numerology, so with the flag off a card carries a name, a number and
 * a graha and nothing that says what the name means. An unexplained absence is
 * most of why a full result still reads as empty.
 *
 * The dashboard surfaces use the shared `<ReadingsWithheldNote>` instead; this
 * exists because the marketing page cannot pull in dashboard chrome.
 */
export const MEANINGS_WITHHELD: BiText = {
  en: "Name meanings are still in review, so the cards below show the name, its number and its graha only.",
  ta: "பெயர்களின் பொருள் விளக்கங்கள் மறுஆய்வில் உள்ளன. அதுவரை பெயர், அதன் எண், கிரகம் மட்டுமே காட்டப்படுகின்றன.",
};

/** The permanent draft banner. Both the paadham table and the name list are
 *  unreviewed, so this is unconditional rather than gated on `usable` — a
 *  banner that only shows on a technicality never shows. */
export const DRAFT_BANNER: BiText = {
  en: "These are draft suggestions. The paadham letter table and this name list are both still awaiting review by an astrologer and a native speaker — treat them as a starting point for discussion, not a final choice.",
  ta: "இவை வரைவுப் பரிந்துரைகள். பாத எழுத்து அட்டவணையும் இந்தப் பெயர் பட்டியலும் ஜோதிடர் மற்றும் தமிழ் அறிஞர் மதிப்பாய்வுக்குக் காத்திருக்கின்றன — இறுதி முடிவாக அல்லாமல், பேசித் தீர்மானிக்கத் தொடக்கமாகக் கொள்ளுங்கள்.",
};

/* ==========================================================================
 * A parent's own shortlist — checked against the same rule, shown at its
 * true rank alongside the recommendations, never a second list off to the
 * side. English spelling only (no Tamil-script input for this feature), so
 * a shortlist name can reach at most "English spelling matches" confidence —
 * it is never eligible for "Tamil + English agree".
 * ========================================================================== */

export const SHORTLIST_HEADING: BiText = {
  en: "Already have names in mind?",
  ta: "ஏற்கனவே சில பெயர்கள் மனதில் உள்ளதா?",
};

export const SHORTLIST_INTRO: BiText = {
  en: "Add up to 5 names you're considering — English spelling. Each is checked against the same paadham rule and chart fit as the list below, and shown at its true place in it, not as a separate list.",
  ta: "நீங்கள் யோசிக்கும் 5 பெயர்கள் வரை சேர்க்கலாம் — ஆங்கில எழுத்தில். ஒவ்வொன்றும் கீழே உள்ள பட்டியலின் அதே பாத விதி மற்றும் ஜாதகப் பொருத்தத்தை வைத்துச் சரிபார்க்கப்பட்டு, அதற்குரிய சரியான இடத்தில் காட்டப்படும் — தனிப் பட்டியலாக அல்ல.",
};

export function shortlistPlaceholder(index: number, ta: boolean): string {
  return ta ? `பெயர் ${index + 1} (விருப்பம்)` : `Name ${index + 1} (optional)`;
}

/** The badge that marks a card as the parent's own pick — "user" or "both". */
export const YOUR_PICK_CHIP: BiText = { en: "Your pick", ta: "உங்கள் தேர்வு" };

/** Only for `source === "both"` — the parent's pick already IS a recommendation. */
export const YOUR_PICK_ALSO_RECOMMENDED: BiText = {
  en: "Your pick — also one we'd have suggested",
  ta: "உங்கள் தேர்வு — நாங்களும் பரிந்துரைக்கும் பெயர்",
};

/**
 * "Ranks #47 of 132 matches." — shown under a shortlist card so a parent can
 * see where their own choice stands even when it falls outside the
 * recommended names shown above it (a card is never dropped for this).
 */
export function shortlistRankNote(overallRank: number, totalMatches: number, ta: boolean): string {
  return ta
    ? `மொத்தம் பொருந்திய ${totalMatches} பெயர்களில் ${overallRank}-ஆவது இடம்.`
    : `Ranks #${overallRank} of ${totalMatches} matches.`;
}
