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

// Life focus, Phase 0 (docs/LIFE_FOCUS_PLAN_2026-09-22.md).
// New Tamil, pending native review (CLAUDE.md new-Tamil rule).
/**
 * §2 of docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md — the location
 * check-in, in the same one-line strip the life focus uses (§2.2).
 *
 * Place names arrive from the place database in English and are printed as
 * they come, in both languages: they are proper nouns from a source we do not
 * translate, and inventing a Tamil spelling for "Singapore" here would be
 * worse than leaving the source's own name alone.
 */
export const LOCATION_CHECK = {
  eyebrow: s("Your location", "உங்கள் இடம்"),
  /** The mismatch prompt (§2.1). `%1$s` is the device's zone city. */
  mismatchQuestion: s(
    "Your phone is on %1$s time. Show today's timings for %1$s?",
    "உங்கள் ஃபோன் %1$s நேரத்தில் உள்ளது. இன்றைய நேரங்களை %1$s க்குக் காட்டவா?",
  ),
  /** Opens the place picker, prefilled — never saves a zone's city directly. */
  mismatchUse: s("Use %1$s", "%1$s பயன்படுத்து"),
  /** `%1$s` is the place the timings are currently for. */
  mismatchKeep: s("Keep %1$s", "%1$s தொடரட்டும்"),
  /** The 45-day backstop (§2.2 / R2). `%1$s` is the saved place. */
  backstopQuestion: s("Still in %1$s?", "இன்னும் %1$s இல் இருக்கிறீர்களா?"),
  backstopQuestionNoPlace: s("Where are you right now?", "இப்போது நீங்கள் எங்கே இருக்கிறீர்கள்?"),
  keep: s("Yes, keep", "ஆம், தொடரட்டும்"),
  change: s("Change city", "நகரத்தை மாற்று"),
  dismiss: s("Dismiss", "மூடு"),
  /** The picker opened from the strip. */
  pickerTitle: s("Current city for daily timings", "தினசரி நேரங்களுக்கான தற்போதைய நகரம்"),
  pickerHelp: s(
    "Sunrise moves with the place, and every timing on Today is cut from sunrise — so the city has to be the one you are in, not the nearest big one.",
    "இடத்திற்கேற்ப சூரிய உதயம் மாறும்; இன்று பக்கத்தின் எல்லா நேரங்களும் சூரிய உதயத்திலிருந்தே கணக்கிடப்படுகின்றன. எனவே நீங்கள் இருக்கும் நகரமே வேண்டும், அருகிலுள்ள பெரிய நகரம் அல்ல.",
  ),
  save: s("Save", "சேமி"),
  cancel: s("Cancel", "ரத்து"),
  saveFailed: s("Couldn't save. Please try again.", "சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்."),
} as const;

export const LIFE_FOCUS = {
  eyebrow: s("Your focus", "உங்கள் கவனம்"),
  question: s("What are you focused on right now?", "இப்போது எதில் கவனம்?"),
  /** Says only what the focus drives: Today's order (Phase 2), the Ask chips
   *  and the daily tip (Phase 1). Nothing broader until it is built. */
  subtitle: s(
    "We'll put this first on Today and tailor your quick questions and daily tips to it. Change it anytime from the chip on Today or in Settings.",
    "இதை இன்று பக்கத்தில் முதலில் காட்டி, உங்கள் விரைவுக் கேள்விகளையும் தினசரி குறிப்புகளையும் இதற்கேற்ப அமைப்போம். இன்று பக்கத்தின் சிப் அல்லது அமைப்புகளில் எப்போது வேண்டுமானாலும் மாற்றலாம்.",
  ),
  skip: s("Skip for now", "இப்போது தவிர்க்கவும்"),
  close: s("Close", "மூடு"),
  saveFailed: s("Couldn't save. Please try again.", "சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்."),
  chipPrefix: s("Focus", "கவனம்"),
  /** aria-label for the Today chip. `%s` is the chip's visible text
   *  ("Focus Career"), kept first and whole so the name contains the visible
   *  label (WCAG 2.5.3, Label in Name). */
  chipAria: s("%s. Change focus", "%s. கவனத்தை மாற்று"),
  /** The 60-day strip. `%s` is the focus label. */
  nudgeQuestion: s("Still focused on %s?", "இன்னும் %s மீது கவனமா?"),
  nudgeKeep: s("Yes, keep", "ஆம், தொடரட்டும்"),
  nudgeChange: s("Change", "மாற்று"),
  nudgeDismiss: s("Dismiss", "மூடு"),
  settingsDesc: s(
    "Pick what matters right now. Today puts it first, and your quick questions and daily tips lean toward it; your scores never change.",
    "இப்போது முக்கியமானதைத் தேர்வுசெய்யுங்கள். இன்று பக்கம் அதை முதலில் காட்டும்; விரைவுக் கேள்விகளும் தினசரி குறிப்புகளும் அதை நோக்கிச் சாயும்; உங்கள் மதிப்பெண்கள் மாறாது.",
  ),
  saved: s("Focus saved", "கவனம் சேமிக்கப்பட்டது"),
  // Phase 2 (Today responds). New Tamil, pending native review.
  /** Small label on the pinned life-area tile, the lifted activity cards and
   *  the Life areas tab card. Same words as the eyebrow, kept separate so the
   *  two can diverge. */
  pinnedLabel: s("Your focus", "உங்கள் கவனம்"),
  /** T1 hero line. `%1` is the life-area label, `%2` the period verdict
   *  ("Mixed period"). The verdict is the life-area ladder, never the daily one. */
  heroArea: s("Your focus, %1: %2.", "உங்கள் கவனம், %1: %2."),
  /** T1 hero line, second half. `%s` is "10:30 am – 12:00 pm". */
  heroWindowToday: s("Today's best window %s.", "இன்றைய சிறந்த நேரம் %s."),
  heroWindowOther: s("Best window %s.", "சிறந்த நேரம் %s."),
  /** T3: the focus activities have nothing to say today. `%s` is the activity label. */
  boardQuiet: s("%s: nothing specific today.", "%s: இன்று குறிப்பாக எதுவும் இல்லை."),
  /** T3, second sentence. `%s` is a short date ("Thu 25"). */
  boardNextGood: s("Next good day: %s.", "அடுத்த நல்ல நாள்: %s."),
  // Phase 3 (reach). New Tamil, pending native review.
  /** Calendar month filter chip, off by default. `%s` is the focus label. */
  calendarChip: s("Good days: %s", "நல்ல நாட்கள்: %s"),
  /** Appended to a marked day's accessible name. `%s` is the focus label. */
  calendarCell: s("Good day for %s", "%s: நல்ல நாள்"),
  calendarNote: s(
    "Marked: this month's strongest supportive days for your focus, read on your own chart.",
    "குறிக்கப்பட்டவை: உங்கள் சொந்த ஜாதகத்தின்படி, இந்த மாதம் உங்கள் கவனத்துக்கு மிக ஆதரவான நாட்கள்.",
  ),
  calendarNone: s(
    "No strongly supportive days for your focus this month.",
    "இந்த மாதம் உங்கள் கவனத்துக்கு வலுவான ஆதரவு நாட்கள் இல்லை.",
  ),
  calendarLoading: s("Finding your good days…", "நல்ல நாட்களைத் தேடுகிறோம்…"),
  calendarFailed: s("Couldn't load your good days. Try again later.", "நல்ல நாட்களை ஏற்ற முடியவில்லை. பின்னர் முயற்சிக்கவும்."),
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
  // T15: the summary names one clock window so the line is usable without the
  // vocabulary below it. Rahu Kalam only — it is the strongest of the three
  // avoid-kalas (painted avoid-strong on the timeline); the Avoid card below
  // still lists all three.
  // Tamil, native-reviewed 2026-09-17: no em-dash (an English import), advisory
  // தவிர்ப்பது நல்லது to match the counselling voice of the verdict before it,
  // and the ranges are built per language (Tamil period-words, not "pm").
  // The panchangam planner's subha-day sentence uses this same string.
  avoidRahu: (rangeEn: string, rangeTa: string) =>
    s(
      `Avoid Rahu Kalam, ${rangeEn}.`,
      `ராகு காலம் ${rangeTa} நேரத்தில் புதிய செயல்களைத் தவிர்ப்பது நல்லது.`,
    ),
};

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
// Kalam / Yamagandam (see lib/today-windows.ts); these strings carry the
// one-line "what this system is" for each of the systems it was chosen from.
// New Tamil, pending native review.
//
// Kuligai is NOT in that clearance list, and this sentence must keep saying so
// (owner ruling R7, 2026-09-22): Kuligai has no polarity of its own, the
// activity resolves it, and this window is chosen with no activity in hand. It
// is named separately by `windowInKuligai` when the two overlap.
export const TODAY_TIMINGS = {
  clearOfKalas: s(
    "Clear of Rahu Kalam and Yamagandam.",
    "ராகு காலம், யமகண்டம் ஆகியவற்றில் படாத நேரம்.",
  ),
  skippedForCollision: s(
    "An earlier, higher-ranked window today runs into one of those, so this is the next one clear of them.",
    "இன்று முன்னதாக வரும் சிறந்த நேரம் அவற்றில் ஒன்றில் படுவதால், அதற்கு அடுத்ததாக வரும் தெளிவான நேரம் இது.",
  ),
  allCollide: s(
    "Every good window today runs into Rahu Kalam or Yamagandam. This is the best of them — many families would simply wait for tomorrow.",
    "இன்று உள்ள எல்லா நல்ல நேரங்களும் ராகு காலம் அல்லது யமகண்டத்தில் படுகின்றன. அவற்றுள் சிறந்தது இது; பல குடும்பங்கள் நாளை வரை காத்திருப்பார்கள்.",
  ),
  hasPassed: s(
    "Today's clear windows have already passed.",
    "இன்றைய தெளிவான நேரங்கள் ஏற்கனவே கடந்துவிட்டன.",
  ),
  // The "Other traditional timings" disclosure this block served was removed
  // 2026-09-04 (owner call) — its title, its group headings and the Nalla Neram
  // "(recommended)" tag went with it. Finding 8's correction (the panel claimed
  // all four systems were "the systems it was chosen from", when
  // `pickRecommendedWindow` reads only the Gowri ranking and the three kalas)
  // no longer needs copy: there is no panel left to overclaim.
  // Finding 7. The kala-overlap disclosure states the app's *existing*
  // implemented position (owner ruling 2026-08-23: a window overlapping Rahu
  // Kalam / Yamagandam / Kuligai is never promoted) rather than picking new
  // doctrine — whether Abhijit overrides the kalas is queued in
  // docs/ASTROLOGER_REVIEW_QUEUE.md.
  abhijitOverlap: s(
    "Overlaps %1$s here, and this app treats the avoid periods as binding — so the clear part is %2$s.",
    "இது %1$s உடன் மேற்பொருந்துகிறது; இந்த ஆப் தவிர்க்க வேண்டிய நேரங்களைக் கட்டுப்பாடாகவே கொள்வதால், தெளிவான பகுதி %2$s.",
  ),
  abhijitFullyCovered: s(
    "Overlaps %1$s for its whole span today, and this app treats the avoid periods as binding.",
    "இன்று முழு நேரமும் %1$s உடன் மேற்பொருந்துகிறது; இந்த ஆப் தவிர்க்க வேண்டிய நேரங்களைக் கட்டுப்பாடாகவே கொள்கிறது.",
  ),
  // Window phase copy, shared by the promoted window and the avoid window so
  // the safety axis reads in the same tense as the opportunity axis
  // (finding 4).
  startsIn: s("starts in %s", "%s இல் தொடங்குகிறது"),
  endsIn: s("ends in %s", "%s இல் முடிகிறது"),
  avoidRunningNow: s("You are inside it now", "இப்போது இந்த நேரத்தில் இருக்கிறீர்கள்"),
  avoidWindowLabel: s("Avoid window", "தவிர்க்க வேண்டிய நேரம்"),
  kuligaiPeriodLabel: s("Kuligai period", "குளிகை நேரம்"),
  // Advisory register (தவிர்ப்பது நல்லது), not the imperative தவிர்க்கவும் —
  // owner ruling 2026-09-17, same voice as `avoidRahu` above.
  liveAvoidLine: s(
    "Now: %1$s until %2$s · avoid new starts.",
    "இப்போது: %1$s · %2$s வரை · புதிய தொடக்கங்களைத் தவிர்ப்பது நல்லது.",
  ),
  // R7 (2026-09-22): lead with the repetition principle, not with "Kuligai is
  // good". Kuligai has no polarity of its own — what is begun in it tends to
  // recur, and whether that is wanted is the activity's question, not
  // Kuligai's. R5's gold/property/marriage/surgery examples stay, as examples.
  liveKuligaiLine: s(
    "Now: Kuligai until %1$s · suits what you mean to repeat, continue or grow (gold, property); not for a wedding or surgery.",
    "இப்போது: குளிகை · %1$s வரை · மீண்டும் நிகழ வேண்டிய, தொடர வேண்டியவற்றுக்கு ஏற்றது (தங்கம், சொத்துப் பதிவு); திருமணம், அறுவை சிகிச்சை வேண்டாம்.",
  ),
  kuligaiMeaning: s(
    "Suitable for activities intended to repeat, continue or grow, such as gold or property; not for a wedding or surgery.",
    "மீண்டும் நிகழ வேண்டிய, தொடர வேண்டிய அல்லது வளர வேண்டிய செயல்களுக்கு ஏற்றது; தங்கம், சொத்துப் பதிவு போன்றவை. திருமணம், அறுவை சிகிச்சைக்கு அல்ல.",
  ),
  // The promoted window is picked with no activity in hand, so a Kuligai
  // overlap can neither disqualify it (R7.4) nor be folded silently into
  // "clear of the kalas" — it is named, as its own conditional line (R7.7).
  windowInKuligai: s(
    "This window also falls in Kuligai — suitable for what you mean to repeat, continue or grow; not for a wedding or surgery.",
    "இந்த நேரம் குளிகையிலும் படுகிறது; மீண்டும் நிகழ வேண்டிய, தொடர வேண்டிய செயல்களுக்கு ஏற்றது. திருமணம், அறுவை சிகிச்சைக்கு அல்ல.",
  ),
  // R7.6: informational, never the avoid register.
  abhijitInKuligai: s(
    "It also falls in Kuligai, which depends on what you are doing rather than being an avoid period — it suits what you mean to repeat, continue or grow.",
    "இது குளிகையிலும் படுகிறது; குளிகை தவிர்க்க வேண்டிய நேரம் அல்ல, செய்யும் செயலைப் பொறுத்தது. மீண்டும் நிகழ வேண்டிய, தொடர வேண்டிய செயல்களுக்கு ஏற்றது.",
  ),
  // Redesign 2026-09-07 — the best-window card's conflict line used to render
  // open, permanently, as a fifth stacked row under the reason text. It is a
  // note about a *different, non-promoted* window (a competing method's pick),
  // not a caution on the one already recommended, so it is collapsed behind a
  // toggle rather than always taking hero space — same information, on demand.
  //
  // Phrased as a question naming the losing window's own start time, so the
  // label teaches something before it is tapped and reads as a sibling of the
  // score card's "Why this prediction?" rather than as an error count. Tamil
  // puts the interrogative last, matching `TODAY_HERO.whyLink`.
  conflictToggle: s("Why not %s?", "%s ஏன் இல்லை?"),
} as const;

// ─── Emotional weather (hero review 2026-09-04, findings 1–3) ────────────────
// `emotionalWeather.tone` / `.physicalTendency` / `.bestUseOfDay` are database
// enums, not copy — `balanced_routine`, `low_energy`, `single_task_routine`.
// The hero rendered them raw, which was invisible only while the selected
// profile happened to yield single readable English words (`calm`, `steady`),
// and which handed a Tamil reader English tokens in Tamil mode.
//
// The backend already ships a reviewed bilingual *sentence* per field
// (`toneText`, `physicalTendencyText`, `bestUseOfDayText`); the hero now prints
// the sentence. These are the compact chip labels that sit above it, so a pill
// never has to carry a full clause. A token must never reach the screen:
// `weatherLabel` below falls back to a humanised form for any profile added to
// `_TONE_MAP` after this map. New Tamil, pending native review.
const EMOTIONAL_WEATHER_LABELS: Record<string, BiStr> = {
  // tone
  confident: s("Confident", "தன்னம்பிக்கை"),
  heavy: s("Heavy", "கனமான மனநிலை"),
  expansive: s("Expansive", "விரிந்த மனநிலை"),
  restless: s("Restless", "அமைதியின்மை"),
  calm: s("Calm", "அமைதி"),
  scattered: s("Scattered", "சிதறல்"),
  // physical tendency
  energised: s("Energised", "உற்சாகம்"),
  low_energy: s("Low energy", "மந்தமான சக்தி"),
  focused: s("Focused", "கவனம்"),
  hyperactive: s("Restless energy", "அதிக வேகம்"),
  balanced: s("Balanced", "சமநிலை"),
  anxious: s("Anxious", "பதற்றம்"),
  steady: s("Steady", "நிலையான நடை"),
  // best use of day
  leadership: s("Leadership", "தலைமை"),
  deep_work: s("Deep work", "ஆழ்ந்த வேலை"),
  people_facing: s("People-facing work", "மக்களுடன் பணி"),
  execution_sprints: s("Short sprints", "வேகமாக முடிக்க"),
  creative: s("Creative work", "படைப்பு வேலை"),
  single_task_routine: s("One task at a time", "ஒரு வேலை மட்டும்"),
  balanced_routine: s("Routine progress", "வழக்கமான பணிகள்"),
};

/** Human label for one `emotionalWeather` enum. Unknown tokens are humanised
 *  rather than printed raw — a snake_case token on screen is the bug this
 *  exists to make impossible, not a case to fail loudly on. */
export function weatherLabel(token: string, lang: Lang): string {
  const known = EMOTIONAL_WEATHER_LABELS[token];
  if (known) return dt(known, lang);
  const words = token.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ─── Today hero chrome (hero review 2026-09-04, findings 9–14) ───────────────
export const TODAY_HERO = {
  /** Finding 12: the static "here is what this screen contains" lede is
   *  onboarding copy in a surface a daily user opens every morning. It now
   *  renders only when there is no briefing to lead with. */
  ledeNoGuidance: s(
    "Today's guidance, your chart score, and the best windows — at a glance.",
    "இன்றைய வழிகாட்டுதல், ஜாதக மதிப்பெண் மற்றும் சிறந்த நேரங்கள் — ஒரே பார்வையில்.",
  ),
  /** Finding 9: the hero link and the section it lands on had two different
   *  names. The destination's heading wins. */
  whyLink: s("Why this prediction", "இந்த கணிப்பு ஏன்?"),
  eveningPreviewLabel: s("Evening preview", "மாலை முன்னோட்டம்"),
  eveningPreviewHint: s(
    "After 8pm, preview tomorrow here instead of today",
    "இரவு 8 மணிக்குப் பின் நாளையை முன்னோட்டமாகக் காட்டு",
  ),
  readMore: s("Read more", "மேலும் படிக்க"),
  readLess: s("Show less", "சுருக்கு"),
  todayScore: s("Today's score", "இன்றைய மதிப்பெண்"),
  tomorrowScore: s("Tomorrow's score", "நாளைய மதிப்பெண்"),
  /** Finding 5: the band is evidence strength, a different axis from the day's
   *  verdict, and stacking the two 6px apart on the score card read as the app
   *  contradicting itself. It moves to the evidence section and is labelled
   *  there. */
  chartSupport: s("Chart support", "ஜாதக ஆதரவு"),
  /* Hero redesign 2026-09-04 — the three strings below are new to the surface.
     New Tamil, pending native review (docs/ASTROLOGER_REVIEW_QUEUE.md). */
  quote: s(
    "Right timing turns ordinary days into meaningful progress.",
    "சரியான நேரம் சாதாரண நாட்களை அர்த்தமுள்ள முன்னேற்றமாக மாற்றுகிறது.",
  ),
  quoteAttribution: s("Vinaadi", "விநாடி"),
  keyTimings: s("Key timings for today", "இன்றைய முக்கிய நேரங்கள்"),
  viewFullAlmanac: s("View full almanac", "முழு பஞ்சாங்கம் பார்க்க"),
} as const;

export const EMOTIONAL_WEATHER = {
  toneLabel: s("Mood", "மனநிலை"),
  bodyLabel: s("Body", "உடல்"),
  bestUseLabel: s("Best used for", "எதற்கு ஏற்ற நாள்"),
  /** The one genuine caution in the payload (`avoidBefore`), which no web
   *  surface rendered at all before this pass (finding 3). */
  cautionLabel: s("One thing to hold back on", "ஒன்றை மட்டும் தள்ளி வைக்கவும்"),
} as const;
