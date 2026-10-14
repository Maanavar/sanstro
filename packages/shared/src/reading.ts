/**
 * The chart reading's fixed copy and lookups, shared by web and mobile (FTR-20).
 *
 * The Story view's *selections* are computed server-side (`story` on the
 * explanation payload, app/services/reading_story.py). What remains client-side
 * is fixed text and fixed classical tables, and those live here so the two
 * surfaces cannot word a chapter or a house differently.
 *
 * `HOUSE_MEANING` is also copied server-side for the headline template;
 * tests/test_reading_story.py fails when the two differ.
 *
 * Tamil strings added for the Story view are pending native review.
 */

export type ReadingLang = "ta" | "en";
export type ReadingText = { ta: string; en: string };

const pick = (text: ReadingText, lang: ReadingLang) => (lang === "ta" ? text.ta : text.en);

/** Classical, fixed sign lordship: rasi number → ruling graha. */
export const SIGN_LORD: Record<number, string> = {
  1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON", 5: "SUN", 6: "MERCURY",
  7: "VENUS", 8: "MARS", 9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER",
};

/** What each house governs, in a few plain words. */
export const HOUSE_MEANING: Record<number, ReadingText> = {
  1: { ta: "உடல், தன்மை, வாழ்க்கை திசை", en: "self, body, life direction" },
  2: { ta: "குடும்பம், பேச்சு, பண அடித்தளம்", en: "family, speech, money base" },
  3: { ta: "முயற்சி, துணிவு, தொடர்பு", en: "effort, courage, communication" },
  4: { ta: "வீடு, மன அமைதி, சொத்து", en: "home, inner peace, property" },
  5: { ta: "கல்வி, புத்தி, குழந்தைகள்", en: "learning, intelligence, children" },
  6: { ta: "சேவை, பழக்கங்கள், ஒழுங்கு", en: "service, habits, discipline" },
  7: { ta: "உறவுகள், கூட்டாண்மை", en: "relationships, partnership" },
  8: { ta: "ஆழமான மாற்றம், ஆராய்ச்சி, கவனம்", en: "deep change, research, careful renewal" },
  9: { ta: "தர்மம், ஆசீர்வாதம், உயர்கல்வி", en: "dharma, grace, higher learning" },
  10: { ta: "தொழில், பொறுப்பு, வெளிப்படை செயல்", en: "career, responsibility, public work" },
  11: { ta: "லாபம், நண்பர்கள், வலையமைப்பு", en: "gains, friends, networks" },
  12: { ta: "ஓய்வு, வெளிநாடு, ஆன்மீக விடுவிப்பு", en: "rest, foreign links, spiritual release" },
};

export function houseTheme(house: number, lang: ReadingLang): string {
  const meaning = HOUSE_MEANING[house];
  return meaning ? pick(meaning, lang) : "";
}

export type ChapterId = "who" | "planets" | "now" | "gifts" | "coming";

export const CHAPTER_ORDER: ChapterId[] = ["who", "planets", "now", "gifts", "coming"];

export const CHAPTER_TITLES: Record<ChapterId, ReadingText> = {
  who: { en: "Who you are", ta: "நீங்கள் யார்" },
  planets: { en: "Your nine planets", ta: "உங்கள் ஒன்பது கிரகங்கள்" },
  now: { en: "Running now", ta: "இப்போது நடப்பது" },
  gifts: { en: "Gifts & care", ta: "பலமும் கவனமும்" },
  coming: { en: "What's coming", ta: "வரவிருப்பவை" },
};

/**
 * What each anchor *is* — the classical meaning of the term, true for everyone.
 * The chart-specific part is which rasi and star fill it.
 */
export const PILLAR_MEANING: Record<"lagna" | "rasi" | "star", ReadingText> = {
  lagna: {
    en: "How you meet the world — body, temperament and direction.",
    ta: "நீங்கள் உலகை எதிர்கொள்ளும் விதம் — உடல், இயல்பு, வாழ்க்கைத் திசை.",
  },
  rasi: {
    en: "Your mind and moods. Transits are counted from here.",
    ta: "உங்கள் மனமும் உணர்வுகளும். கோச்சாரம் இதிலிருந்தே கணிக்கப்படும்.",
  },
  star: {
    en: "Your birth star. It sets the order of your dasa periods.",
    ta: "உங்கள் ஜென்ம நட்சத்திரம். உங்கள் தசைகளின் வரிசையை இதுவே தீர்மானிக்கும்.",
  },
};

/**
 * Where the Lagna's own lord sits (ruling D1, 2026-10-04: confirmed). It says
 * where life's attention tends to go — not that the house is strong.
 */
export function lagnaLordPlacement(
  lagnaRasi: number,
  planets: { graha: string; houseFromLagna: number }[],
): { lord: string; house: number } | null {
  const lord = SIGN_LORD[lagnaRasi];
  if (!lord) return null;
  const planet = planets.find((p) => p.graha === lord);
  return planet ? { lord, house: planet.houseFromLagna } : null;
}

// ── Strength bands (moved from web/components/dashboard-hybrid-parts.tsx) ──

export function strengthVerdict(score: number, lang: ReadingLang): string {
  if (score >= 70) return lang === "ta" ? "வலிமையானது" : "Strong";
  if (score >= 50) return lang === "ta" ? "நிலையானது" : "Steady";
  if (score >= 35) return lang === "ta" ? "மிதமானது" : "Moderate";
  return lang === "ta" ? "மென்மையானது" : "Gentle";
}

// Phase-0 humanization (docs/family-charts-humanization-audit.md): a plain-
// language reassurance line per strength band, so a bare "25/100" never leaves
// the reader wondering "should I worry?". Reads the engine's strengthScore — it
// invents nothing and recomputes no strength.
export function strengthReassurance(score: number, lang: ReadingLang): string {
  if (score >= 70)
    return lang === "ta"
      ? "உங்கள் ஜாதகத்தில் வலிமையான சக்திகளில் ஒன்று — இயல்பாகவே ஆதரவாக இருக்கும்."
      : "One of the stronger forces in your chart — it tends to support you naturally.";
  if (score >= 50)
    return lang === "ta"
      ? "நிலையான, சாதகமான இடத்தில் — பெரும்பாலும் நம்பகமானது."
      : "Sits in a steady, workable place — dependable more often than not.";
  if (score >= 35)
    return lang === "ta"
      ? "மிதமான தாக்கம் — சிறிது முயற்சியுடன் சிறப்பாக செயல்படும்."
      : "A moderate influence — it works best with a little conscious effort.";
  return lang === "ta"
    ? "மென்மையானது, ஆதரவு தேவை. இது கெட்டதல்ல — அதன் விஷயங்கள் கூடுதல் கவனமும் பொறுமையும் கேட்கின்றன."
    : "Gentle, and it needs support. That isn't bad — its matters simply ask for more care and patience.";
}

// ── Rasi names ───────────────────────────────────────────────────────────────
//
// English follows Tamil almanac usage (Mesham, Rishabam…), the owner ruling the
// web chart and the backend (`display_names.RASI_EN`) already follow;
// tests/test_reading_story.py holds this table to the backend's. Tamil is the
// almanac spelling. `RASI_LIST` (constants) keeps its Western English names
// for the screens that already use them.
export const RASI_NAME: Record<number, ReadingText> = {
  1: { ta: "மேஷம்", en: "Mesham" },
  2: { ta: "ரிஷபம்", en: "Rishabam" },
  3: { ta: "மிதுனம்", en: "Mithunam" },
  4: { ta: "கடகம்", en: "Kadagam" },
  5: { ta: "சிம்மம்", en: "Simmam" },
  6: { ta: "கன்னி", en: "Kanni" },
  7: { ta: "துலாம்", en: "Thulam" },
  8: { ta: "விருச்சிகம்", en: "Viruchigam" },
  9: { ta: "தனுசு", en: "Dhanusu" },
  10: { ta: "மகரம்", en: "Magaram" },
  11: { ta: "கும்பம்", en: "Kumbam" },
  12: { ta: "மீனம்", en: "Meenam" },
};

/** The reader's-language name for a rasi number ("" when unknown). */
export function rasiName(rasi: number | null | undefined, lang: ReadingLang): string {
  const entry = rasi ? RASI_NAME[rasi] : undefined;
  return entry ? pick(entry, lang) : "";
}

/** A rasi code or name from the payload ("KADAGAM", "Kadagam") → 1..12. */
export function rasiNumberFromCode(code: string | null | undefined): number | null {
  const wanted = code?.trim().toLowerCase();
  if (!wanted) return null;
  for (const [number, name] of Object.entries(RASI_NAME)) {
    if (name.en.toLowerCase() === wanted || name.ta === code?.trim()) return Number(number);
  }
  return null;
}
