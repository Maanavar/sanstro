import { normalizeTamilAstroText } from "./tamil-astro";
import type { Lang } from "./i18n";

/**
 * Central bilingual catalog for the signed-in dashboard (UXD-04) — the mirror of
 * `marketing-i18n.ts` for the Nova surface, which historically had no catalog and
 * instead scattered ~1,900 inline `lang === "ta" ? … : …` ternaries across 150
 * files (unauditable Tamil coverage).
 *
 * Go-forward policy: new dashboard strings are defined here with `s(en, ta)` and
 * read with `dt(entry, lang)`; touched files migrate their inline ternaries into
 * this catalog rather than adding more. `node scripts/extract-dashboard-i18n.mjs`
 * enumerates the remaining inline strings (and emits docs/dashboard-i18n-catalog.json)
 * to seed that migration and make a native-Tamil review possible.
 */

export type BiStr = { en: string; ta: string };

/** Define a bilingual dashboard string. */
export function s(en: string, ta: string): BiStr {
  return { en, ta };
}

/** Resolve a bilingual string for the active language (Tamil normalized to match
 *  the marketing surface's `mt`). */
export function dt(str: BiStr, lang: Lang): string {
  return lang === "ta" ? normalizeTamilAstroText(str.ta) : str.en;
}

// ─── Streak surface (UXD-18) — first strings to live in the catalog ──────────
export const STREAK = {
  restDayKept: s("Rest day counted — streak safe", "ஓய்வு நாள் கணக்கிடப்பட்டது — தொடர்ச்சி பாதுகாப்பானது"),
  milestone: s("milestone", "மைல்கல்"),
} as const;

// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const ONBOARDING_DETAIL_LEVEL = {
  eyebrow: s("Detail level", "விளக்க நிலை"),
  title: s("How much astrology do you already know?", "ஜோதிடம் பற்றி உங்களுக்கு ஏற்கனவே எவ்வளவு தெரியும்?"),
  body: s(
    "This only changes how much vocabulary we show. You can change it later in Settings.",
    "இது எவ்வளவு ஜோதிடச் சொற்களை காட்டுகிறோம் என்பதையே மாற்றும். பின்னர் அமைப்புகளில் மாற்றலாம்.",
  ),
  beginnerLabel: s("I've heard the words but never studied it", "சொற்களை கேட்டிருக்கிறேன்; ஆனால் படித்ததில்லை"),
  beginnerDesc: s("Plain language first", "முதலில் எளிய மொழி"),
  balancedLabel: s("I know the basics", "அடிப்படை தெரியும்"),
  balancedDesc: s("Plain meaning plus key terms", "எளிய பொருளுடன் முக்கிய சொற்கள்"),
  traditionalLabel: s("Use the traditional terms", "பாரம்பரிய சொற்களைப் பயன்படுத்தவும்"),
  traditionalDesc: s("Full Jyothidam vocabulary", "முழு ஜோதிடச் சொற்களஞ்சியம்"),
  saved: s("Detail level saved.", "விளக்க நிலை சேமிக்கப்பட்டது."),
  saveFailed: s("Detail level will stay balanced until Settings can save.", "அமைப்புகள் சேமிக்கும்வரை விளக்க நிலை சமநிலையாக இருக்கும்."),
} as const;

// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const FIRST_RESULT_GUIDE = {
  heading: s("How to read your first result", "முதல் முடிவை எப்படி படிப்பது"),
  scoreTitle: s("The score is a weather report", "மதிப்பெண் ஒரு நாளின் நிலை"),
  scoreBody: s(
    "It summarizes support for new actions today; it is not a verdict on you.",
    "இன்று புதிய செயல்களுக்கு ஆதரவு எப்படி உள்ளது என்பதைக் காட்டும் சுருக்கம்; அது உங்களைப் பற்றிய தீர்ப்பு அல்ல.",
  ),
  avoidTitle: s("Avoid means new beginnings", "தவிர்க்க வேண்டும் என்பது புதிய தொடக்கங்களுக்கு"),
  avoidBody: s(
    "Keep routine work moving. Use caution windows for launches, signatures, purchases, and first attempts.",
    "வழக்கமான பணிகளை தொடரலாம். தொடக்கம், கையெழுத்து, வாங்குதல், முதல் முயற்சி போன்றவற்றில் கவன நேரங்களைப் பயன்படுத்தவும்.",
  ),
  actionTitle: s("Do one useful thing", "ஒரு பயனுள்ள செயலை செய்யவும்"),
  actionFallback: s(
    "Use the best window for one focused task, then come back to the Why trail if you want the astrology.",
    "சிறந்த நேரத்தில் ஒரு கவனமான செயலை செய்யுங்கள்; ஜோதிட அடிப்படை வேண்டுமெனில் பின்னர் ஏன் என்ற பகுதியைப் பாருங்கள்.",
  ),
  whyTrail: s("Why trail", "ஏன் பகுதி"),
  learnLink: s("Vedic vs Western basics", "வேத ஜோதிடம் மற்றும் மேலை ஜோதிடத்தின் அடிப்படை"),
} as const;

// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const CALENDAR_DAY_SUMMARY = {
  favourable: s(
    "A generally favourable day. Use a recommended window for a new start.",
    "பொதுவாக நல்ல நாள். புதிய தொடக்கத்திற்கு பரிந்துரைக்கப்பட்ட நேரத்தைப் பயன்படுத்துங்கள்.",
  ),
  care: s(
    "A day to take care with new starts. Plan around the periods to avoid below.",
    "புதிய தொடக்கங்களில் கவனம் தேவைப்படும் நாள். கீழே உள்ள தவிர்க்க வேண்டிய நேரங்களைப் பார்த்துத் திட்டமிடுங்கள்.",
  ),
  ordinary: s(
    "An ordinary day. Keep routine work moving and use a recommended window for a new start.",
    "வழக்கமான நாள். தினசரி பணிகளைத் தொடருங்கள்; புதிய தொடக்கத்திற்கு பரிந்துரைக்கப்பட்ட நேரத்தைப் பயன்படுத்துங்கள்.",
  ),
} as const;

// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const EXPLORE_VOCABULARY = {
  yoga: s(
    "Here, Yoga means a chart combination — not exercise yoga.",
    "இங்கே யோகம் என்பது ஜாதக அமைப்பு; உடற்பயிற்சி யோகம் அல்ல.",
  ),
} as const;

// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const REMEDIES_CONTEXT = {
  body: s(
    "These are optional traditional practices that some people find supportive, not prescriptions. Choose secular actions for practical, non-religious alternatives.",
    "இவை கட்டாயம் அல்லாத பாரம்பரிய நடைமுறைகள்; சிலருக்கு ஆதரவாக இருப்பவை. நடைமுறை, மதச்சார்பற்ற மாற்றுகளுக்கு மதச்சார்பற்ற செயல்களைத் தேர்ந்தெடுக்கவும்.",
  ),
} as const;

// A-038. "Prescribed" / "Not prescribed" is medical register for something this
// same panel's disclaimer calls a traditional belief system — and a reader who
// takes it as a prescription is being told, in the app's own voice, that a
// stone is medically indicated. Descriptive register throughout: what the
// tradition does with the stone, not what the reader is instructed to do.
// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const GEMSTONE_GROUPS = {
  worn: s("Traditionally worn for your chart", "உங்கள் ஜாதகத்திற்கு பாரம்பரியமாக அணியப்படுபவை"),
  optional: s("Traditionally optional — with care", "பாரம்பரியமாக விருப்பத் தேர்வு — கவனத்துடன்"),
  avoided: s("Traditionally avoided", "பாரம்பரியமாக தவிர்க்கப்படுபவை"),
  note: s(
    "These are traditional recommendations, not requirements. Gemstones vary widely in cost and quality, and nothing here depends on buying one.",
    "இவை பாரம்பரிய பரிந்துரைகள்; கட்டாயம் அல்ல. கற்களின் விலையும் தரமும் பெரிதும் வேறுபடும்; இங்குள்ள எதுவும் ஒரு கல் வாங்குவதைச் சார்ந்தது அல்ல.",
  ),
} as const;

// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const CULTURAL_CONTEXT = {
  porutham: s(
    "Porutham is a traditional Tamil marriage-matching practice. Treat this as one input for a family conversation, alongside the people involved and both full charts.",
    "பொருத்தம் என்பது பாரம்பரிய தமிழ் திருமணப் பொருத்தப் பார்வை. இருவரின் விருப்பங்கள் மற்றும் முழு ஜாதகங்களுடன் சேர்த்து, குடும்ப உரையாடலுக்கான ஒரு வழிகாட்டியாக இதைப் பயன்படுத்துங்கள்.",
  ),
  poruthamLearnMore: s("What is porutham?", "பொருத்தம் என்றால் என்ன?"),
  muhurta: s(
    "Muhurta is a traditional way of choosing a supportive time for an important beginning. It is optional guidance, not a guarantee or a requirement.",
    "முகூர்த்தம் என்பது முக்கியமான தொடக்கத்திற்கு ஏற்ற நேரத்தைத் தேர்ந்தெடுக்கும் பாரம்பரிய வழிமுறை. இது விருப்பமான வழிகாட்டுதல்; உத்தரவாதமோ கட்டாயமோ அல்ல.",
  ),
} as const;

// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const FAMILY_ONBOARDING = {
  firstMember: s(
    "Add a spouse, parent, child, or another relative. We create your family automatically when you add the first person.",
    "துணைவர், பெற்றோர், குழந்தை அல்லது மற்றொரு உறவினரைச் சேர்க்கவும். முதல் நபரைச் சேர்க்கும்போது உங்கள் குடும்பம் தானாக உருவாக்கப்படும்.",
  ),
} as const;

// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const DASHA_PANEL = {
  title: s(
    "Your life periods (Vimshottari system)",
    "உங்கள் வாழ்க்கைக் காலங்கள் (விம்சோத்தரி முறை)",
  ),
  subtitle: s(
    "Major, sub, and minor periods active in your chart.",
    "உங்கள் ஜாதகத்தில் செயலிலுள்ள பெரிய, துணை, மற்றும் சிறு காலங்கள்.",
  ),
} as const;

// B-020. The full definition of a pada lives in the `pada` glossary entry, one
// tap from the label. This is only the compact rendering that sits beside the
// number, so the fact row stays a fact row next to "D9 sign · Meena".
// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const PLANET_ROW_DETAILS = {
  pada: s("quarter of the birth star", "பிறப்பு நட்சத்திரத்தின் கால் பகுதி"),
} as const;

// A-021. The dignity chips sit inside the planet row's own <button>, so they
// cannot carry a GlossaryTerm — a button nested in a button is invalid markup
// and fails this repo's permanent axe gate. The explanation lives in the
// expanded detail instead, and names ONLY the marks actually on this planet: a
// paragraph that also explains two marks the reader cannot see on this row
// reads as though those applied too.
//
// Cazimi is not a softer combustion — it is its rare opposite. `birth_conditions
// .py` scores it BOOST ("Heart of the Sun (a strengthening condition)") while
// combustion is a penalty, and the chip tones here follow that (success vs
// warning). Copy must not blur the two.
// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const PLANET_STATUS_MARKS = {
  heading: s("What the marks on this row mean", "இந்த வரிசையின் அடையாளங்களின் பொருள்"),
  marks: {
    vakra: s(
      "Retrograde — seen from Earth the planet appears to move backwards, which turns its themes inward and slows them down.",
      "வக்ரம் — பூமியிலிருந்து பார்க்கும்போது கிரகம் பின்னோக்கி நகர்வது போல் தோன்றும்; அதன் கருப்பொருள்கள் உள்நோக்கித் திரும்பி மெதுவாகும்.",
    ),
    astam: s(
      "Combust — the planet sits close enough to the Sun to be burnt by it, which weakens how visibly it can act.",
      "அஸ்தம் — கிரகம் சூரியனுக்கு மிக அருகில் இருந்து எரியும் நிலை; அதன் வெளிப்படையான செயல்பாடு பலவீனமாகும்.",
    ),
    cazimi: s(
      "Cazimi — the planet sits at the exact centre of the Sun. This is the rare opposite of combust: it strengthens the planet instead of burning it.",
      "கசிமி — கிரகம் சூரியனின் சரியான மையத்தில் அமர்வது. இது அஸ்தத்தின் அரிய எதிர்நிலை: கிரகத்தை எரிக்காமல் பலப்படுத்துகிறது.",
    ),
    varga: s(
      "Vargottama — the planet holds the same sign in the D9 chart as in the birth chart, which steadies how it behaves.",
      "வர்கோத்தமம் — ஜாதகத்திலும் D9 ஜாதகத்திலும் கிரகம் ஒரே ராசியில் இருப்பது; இது அதன் செயல்பாட்டை உறுதிப்படுத்துகிறது.",
    ),
  },
} as const;

/** The dignity marks a planet row can carry — keyed to `PLANET_STATUS_MARKS.marks`
 *  so a new chip cannot be added without its explanation. */
export type PlanetStatusMarkKey = keyof typeof PLANET_STATUS_MARKS.marks;

// ─── Jathagam kattam legend (UX blindspot audit 2026-08-22, B-017/A-019) ─────
//
// The twelve boxes are filled with two-letter graha abbreviations and four
// superscript flags, and the grid shipped with no key to any of them. A reader
// who has never been taught the notation — which includes most people who have
// never opened their own jathagam — cannot recover a single fact from it.
//
// `nodesNote` is the one line that is doing real teaching rather than labelling:
// Rahu and Ketu are not bodies, so a reader coming from any other astrological
// tradition has no prior for them at all and will read the grid as if two
// planets are missing.
//
// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const CHART_LEGEND = {
  heading: s("What the letters mean", "எழுத்துகளின் பொருள்"),
  nodesNote: s(
    "Rahu and Ketu are the two points where the Moon's path crosses the Sun's, not physical planets. This system reads them as grahas.",
    "ராகுவும் கேதுவும் சந்திரனின் பாதை சூரியனின் பாதையைக் கடக்கும் இரு புள்ளிகள் — உண்மையான கோள்கள் அல்ல. இம்முறையில் இவை கிரகங்களாகவே கணிக்கப்படுகின்றன.",
  ),
  flagsHeading: s("Marks", "குறியீடுகள்"),
} as const;

// ─── Porutham verdict de-escalation (UX blindspot audit, A-029/A-031/B-024) ──
//
// The highest-stakes strings in the product: a real couple reads this about
// themselves. The verdict itself is untouched doctrine — what these add is the
// scale the number sits on, and, when a critical check fails, the named cause
// and the reminder of what a porutham is FOR, in the same viewport as the chip
// rather than three scroll-lengths below it.
//
// `blockerTail` is concatenated onto whichever blocker line applies, so both
// halves must end/begin with the spacing they need.
//
// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const PORUTHAM_VERDICT = {
  baseline: s(
    "Most families proceed at 5–8 out of 10.",
    "பெரும்பாலான குடும்பங்கள் 10-ல் 5-8 பொருத்தத்துடன் முன்செல்கின்றன.",
  ),
  blockerRajju: s(
    "Rajju does not match — a traditional check on the durability of the marriage. Classical sources differ on how much weight it carries. ",
    "ரஜ்ஜு பொருந்தவில்லை — திருமண நீட்சி குறித்த பாரம்பரியச் சோதனை. இதன் எடை குறித்து நூல்கள் வேறுபடுகின்றன. ",
  ),
  blockerVedha: s(
    "Vedha does not match — a traditional obstruction check. ",
    "வேதை பொருந்தவில்லை — பாரம்பரியத் தடுப்புச் சோதனை. ",
  ),
  blockerTail: s(
    "It is one of ten checks, and this result is guidance for the conversation between families — not a gate. An astrologer would read it alongside both full charts before concluding anything.",
    "இது பத்துச் சோதனைகளில் ஒன்று; குடும்பங்களுக்கிடையேயான உரையாடலுக்கான வழிகாட்டி — கட்டாய நிபந்தனை அல்ல. ஜோதிடர் இரு ஜாதகங்களையும் முழுமையாகப் பார்த்தே முடிவு சொல்வார்.",
  ),
} as const;

// ─── Guest chart preview (UX blindspot audit 2026-08-22, B-008) ─────────────
//
// The guest form pre-filled 12:00 and submitted it as though the reader had
// entered it. The backend REQUIRES a birth time — `_birth_datetime_utc` in
// `app/services/_chart_build.py` raises without one — so the preview cannot
// simply pass the blank through; what it can do is stop presenting an assumed
// noon as a stated fact. The field now starts empty, a blank submission still
// computes (against a declared noon assumption), and the result says so.
//
// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const GUEST_CHART = {
  assumedTimeTitle: s("Approximate — birth time not provided", "தோராயமானது — பிறந்த நேரம் தரப்படவில்லை"),
  assumedTimeBody: s(
    "This chart was calculated against 12:00 noon. The Rasi and the planets are close to right, but the Lagna and every house placement depend on the exact minute and are estimates here. Add the birth time for a chart you can rely on.",
    "இந்த ஜாதகம் நண்பகல் 12:00 மணியை அடிப்படையாகக் கொண்டு கணிக்கப்பட்டது. ராசியும் கிரக நிலைகளும் ஏறத்தாழ சரியாக இருக்கும்; ஆனால் லக்னமும் ஒவ்வொரு வீட்டு நிலையும் சரியான நிமிடத்தைச் சார்ந்தவை — இங்கு அவை மதிப்பீடுகளே. நம்பகமான ஜாதகத்திற்குப் பிறந்த நேரத்தைச் சேர்க்கவும்.",
  ),
} as const;

// The card's three pre-existing labels, moved here verbatim from the inline
// ternaries in `dashboard-family-charts-hybrid.tsx`. This Tamil is NOT new — it
// shipped and has been read — so it carries no pending-review marker. It is
// listed apart from the block below for exactly that reason: a reviewer must be
// able to tell at a glance which strings are awaiting a native read.
export const SANI_CYCLE_LABELS = {
  heading: s("Sade Sati / Ashtama Sani", "ஏழரை / அஷ்டம சனி"),
  fromMoon: s("Sani · from Moon", "சனி · சந்திரனிலிருந்து"),
  fromLagna: s("Sani · from Lagna", "சனி · லக்னத்திலிருந்து"),
} as const;

// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
export const SANI_CYCLE_CARD = {
  primary: s("Primary reckoning", "முதன்மை கணிப்பு"),
  crossCheck: s("Cross-check", "துணை சரிபார்ப்பு"),
  normal: s("Normal", "இயல்பு"),
  noActive: s("No active Saturn-pressure cycle.", "செயலில் சனி அழுத்தக் காலம் இல்லை."),
  scope: s("Scope", "வரம்பு"),
  phase: s("Current phase", "தற்போதைய கட்டம்"),
  phaseEnds: s("Phase ends", "கட்டம் முடியும் நாள்"),
  cycleEnds: s("Cycle ends", "காலம் முடியும் நாள்"),
  refreshForDate: s("Refresh to calculate the end date", "முடியும் நாளைக் கணிக்க புதுப்பிக்கவும்"),
  action: s("What helps", "உதவும் நடைமுறை"),
  scopeSade: s("7.5-year Saturn cycle around the birth Moon", "ஜென்ம சந்திரனைச் சுற்றிய 7½ ஆண்டு சனி காலம்"),
  scopeAshtama: s("Saturn's transit through the 8th sign from the birth Moon", "ஜென்ம சந்திரனிலிருந்து 8-ஆம் ராசியில் சனி நகரும் காலம்"),
  scopeArdhashtama: s("Saturn's transit through the 4th sign from the birth Moon", "ஜென்ம சந்திரனிலிருந்து 4-ஆம் ராசியில் சனி நகரும் காலம்"),
  scopeCrossCheck: s("Secondary Lagna cross-check", "லக்ன அடிப்படையிலான துணை சரிபார்ப்பு"),
  phaseOpening: s("Opening phase", "தொடக்க கட்டம்"),
  phasePeak: s("Peak phase", "உச்ச கட்டம்"),
  phaseClosing: s("Closing phase", "முடிவு கட்டம்"),
  phaseHome: s("Home and inner-stability phase", "வீடு மற்றும் உள்ளமைதி கட்டம்"),
  phaseDeep: s("Deep-change phase", "ஆழமான மாற்றக் கட்டம்"),
  phaseCrossCheck: s("Secondary pressure check", "துணை அழுத்தச் சரிபார்ப்பு"),
  prevalenceSade: s("This reaches almost everyone about three times in a lifetime.", "இது வாழ்நாளில் கிட்டத்தட்ட அனைவரையும் சுமார் மூன்று முறை வந்தடையும்."),
  prevalenceTransit: s("This is a temporary Saturn transit, not a permanent verdict.", "இது தற்காலிக சனி நகர்வு; நிரந்தர தீர்ப்பு அல்ல."),
  actionSade: s("Keep decisions paced, reduce unnecessary commitments, and use Saturday Saturn remedies as optional support.", "முடிவுகளை நிதானமாக எடுக்கவும், தேவையற்ற பொறுப்புகளை குறைக்கவும்; சனிக்கிழமை சனி பரிகாரங்களை விருப்ப ஆதரவாகப் பயன்படுத்தலாம்."),
  actionAshtama: s("Prefer routine, rest, and careful commitments; optional Saturn remedies can support steadiness.", "வழக்கமான பணிகள், ஓய்வு, கவனமான பொறுப்புகள் சிறப்பு; சனி பரிகாரம் விருப்ப ஆதரவாக நிலைத்தன்மை தரலாம்."),
  actionArdhashtama: s("Stabilise home, health routines, and family responsibilities before adding new pressure.", "புதிய அழுத்தம் சேர்ப்பதற்கு முன் வீடு, உடல்நல பழக்கம், குடும்பப் பொறுப்புகளை நிலைப்படுத்துங்கள்."),
  actionCrossCheck: s("Use this as a secondary caution check, not the main verdict.", "இதைக் துணை கவனச் சரிபார்ப்பாக மட்டும் பார்க்கவும்; முதன்மை தீர்ப்பாக அல்ல."),
} as const;

// ─── T8 / A-013 — one promoted window, the rest named and demoted ────────────
// Today used to show four "good time" systems at the same weight as the three
// avoid-kalas, with nothing telling the reader which to obey. The window above
// is now chosen by the almanac's own Gowri ranking and guaranteed clear of Rahu
// Kalam / Yamagandam / Kuligai (see lib/today-windows.ts); these strings carry
// the one-line "what this system is" for each of the systems it was chosen from.
// New Tamil, pending native review.
export const TODAY_TIMINGS = {
  clearOfKalas: s(
    "Clear of Rahu Kalam, Yamagandam and Kuligai.",
    "ராகு காலம், யமகண்டம், குளிகை ஆகியவற்றில் படாத நேரம்.",
  ),
  skippedForCollision: s(
    "An earlier, higher-ranked window today runs into one of those, so this is the next one clear of them.",
    "இன்று முன்னதாக வரும் சிறந்த நேரம் அவற்றில் ஒன்றில் படுவதால், அதற்கு அடுத்ததாக வரும் தெளிவான நேரம் இது.",
  ),
  allCollide: s(
    "Every good window today runs into Rahu Kalam, Yamagandam or Kuligai. This is the best of them — many families would simply wait for tomorrow.",
    "இன்று உள்ள எல்லா நல்ல நேரங்களும் ராகு காலம், யமகண்டம் அல்லது குளிகையில் படுகின்றன. அவற்றுள் சிறந்தது இது — பல குடும்பங்கள் நாளை வரை காத்திருப்பார்கள்.",
  ),
  hasPassed: s(
    "Today's clear windows have already passed.",
    "இன்றைய தெளிவான நேரங்கள் ஏற்கனவே கடந்துவிட்டன.",
  ),
  otherSystemsTitle: s("Other traditional timings", "பிற பாரம்பரிய நேரக் கணக்குகள்"),
  otherSystemsIntro: s(
    "Use the window above. These are the systems it was chosen from — shown so you can check it, not so you have to choose between them.",
    "மேலே உள்ள நேரத்தைப் பயன்படுத்துங்கள். அது எந்தக் கணக்குகளிலிருந்து தேர்ந்தெடுக்கப்பட்டது என்பதைச் சரிபார்க்க இவை காட்டப்படுகின்றன; இவற்றுள் ஒன்றைத் தேர்வு செய்ய அல்ல.",
  ),
  whatIsNallaNeram: s(
    "Nalla Neram — the almanac's good windows for the day, cut from the Gowri table and always chosen clear of the avoid periods.",
    "நல்ல நேரம் — கௌரி பஞ்சாங்க அட்டவணையிலிருந்து எடுக்கப்பட்ட, தவிர்க்க வேண்டிய நேரங்களில் படாத, அன்றைய நல்ல நேரங்கள்.",
  ),
  whatIsAbhijit: s(
    "Abhijit — a fixed slot of about 48 minutes around midday, counted auspicious for anyone, whatever their chart.",
    "அபிஜித் — நண்பகலைச் சுற்றி வரும் சுமார் 48 நிமிட நிலையான நேரம்; ஜாதகம் எதுவாயினும் அனைவருக்கும் நல்லதாகக் கருதப்படுகிறது.",
  ),
  // The row label now leads with "Planetary hour" and carries "Horai" beside it
  // (A-017), so this line no longer restates the name it sits under.
  whatIsHorai: s(
    "Every hour of the day is ruled by one planet, in a fixed weekly cycle — a finer layer of timing under the day's own ruler.",
    "நாளின் ஒவ்வொரு மணி நேரமும் ஒரு கிரகத்தின் ஆட்சியில், நிலையான வாராந்திர சுழற்சியில் அமைகிறது.",
  ),
  whatIsAvoidKalas: s(
    "Rahu Kalam, Yamagandam, Kuligai — three stretches of every day traditionally kept free of new beginnings. Work already under way is not affected.",
    "ராகு காலம், யமகண்டம், குளிகை — ஒவ்வொரு நாளிலும் புதிய தொடக்கங்களுக்குத் தவிர்க்கப்படும் மூன்று நேரங்கள். ஏற்கனவே நடந்துகொண்டிருக்கும் வேலைகளுக்கு இது பொருந்தாது.",
  ),
} as const;
