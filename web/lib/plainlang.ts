/**
 * Plain language display layer — translates astrological keys into
 * user-friendly text based on depth mode.
 *
 * This is a DISPLAY-ONLY layer. All underlying calculations remain unchanged.
 * Never pass plain-lang output to backend endpoints.
 */

import { tPlanetLord, type Lang } from "./i18n";

export type Mode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

interface BiText {
  ta: string;
  en: string;
}

/**
 * A planet's canonical name, optionally with this layer's plain-language gloss.
 *
 * THE NAME IS NEVER TYPED HERE. Eighteen of the rows below re-typed the nine
 * graha names that `tPlanetLord` already owns, which is how four dashboard
 * panels came to spell Venus "சுக்ரன்" while the rest of the app said
 * "சுக்கிரன்" — every copy internally consistent, so no test could see it.
 *
 * What this layer legitimately adds is the parenthetical role ("soul planet",
 * "மனம் கிரகம்"), and that is now the only thing written out. Rows with no gloss
 * are exactly the canonical name, by construction rather than by coincidence.
 */
function graha(code: string, taGloss?: string, enGloss?: string): BiText {
  const ta = tPlanetLord(code, "ta");
  const en = tPlanetLord(code, "en");
  return {
    ta: taGloss ? `${ta} (${taGloss})` : ta,
    en: enGloss ? `${en} (${enGloss})` : en,
  };
}

const PLAIN_LANG: Record<string, BiText> = {
  // ── Planets. Two-letter keys are the glossed BEGINNER-mode forms.
  SU:       graha("SUN", "ஆன்மா கிரகம்", "soul planet"),
  MO:       graha("MOON", "மனம் கிரகம்", "mind planet"),
  MA:       graha("MARS", "செயல் கிரகம்", "action planet"),
  ME:       graha("MERCURY", "தகவல் கிரகம்", "communication planet"),
  JU:       graha("JUPITER", "வளர்ச்சி கிரகம்", "growth planet"),
  VE:       graha("VENUS", "அன்பு கிரகம்", "love planet"),
  SA:       graha("SATURN", "ஒழுக்க கிரகம்", "discipline planet"),
  RA:       graha("RAHU", "மாற்றம்", "change force"),
  KE:       graha("KETU", "வைராக்கியம்", "detachment force"),

  // Common string-key variants used in narrative engine. The gloss pattern is
  // deliberately uneven here and was before this change — the first six are
  // bare, the last three carry the same glosses as their two-letter twins.
  // Preserved rather than "made consistent": these strings are what the
  // narrative engine's output already reads as, and levelling them is a copy
  // decision, not a refactor.
  SUN:      graha("SUN"),
  MOON:     graha("MOON"),
  MARS:     graha("MARS"),
  MERCURY:  graha("MERCURY"),
  JUPITER:  graha("JUPITER"),
  VENUS:    graha("VENUS"),
  SATURN:   graha("SATURN", "கட்டுப்பாடு கிரகம்", "discipline planet"),
  RAHU:     graha("RAHU", "மாற்றம்", "change force"),
  KETU:     graha("KETU", "வைராக்கியம்", "detachment force"),

  // ── Rasis (Zodiac signs)
  MESHA:        { ta: "மேஷம் (ஆட்டுக்கிடா)", en: "Aries (Ram)" },
  RISHABHA:     { ta: "ரிஷபம் (காளை)", en: "Taurus (Bull)" },
  MITHUNA:      { ta: "மிதுனம் (இரட்டையர்)", en: "Gemini (Twins)" },
  KATAKA:       { ta: "கடகம் (நண்டு)", en: "Cancer (Crab)" },
  SIMHA:        { ta: "சிம்மம் (சிங்கம்)", en: "Leo (Lion)" },
  KANYA:        { ta: "கன்னி (கன்னிகை)", en: "Virgo (Maiden)" },
  TULA:         { ta: "துலாம் (தராசு)", en: "Libra (Scales)" },
  VRISCHIKA:    { ta: "விருச்சிகம் (தேள்)", en: "Scorpio (Scorpion)" },
  DHANUS:       { ta: "தனுசு (வில்)", en: "Sagittarius (Archer)" },
  MAKARA:       { ta: "மகரம் (முதலை)", en: "Capricorn (Sea-goat)" },
  KUMBHA:       { ta: "கும்பம் (குடம்)", en: "Aquarius (Water-bearer)" },
  MEENA:        { ta: "மீனம் (மீன்)", en: "Pisces (Fish)" },

  // ── Special states
  CHANDRASHTAMA:  { ta: "சந்திர அஷ்டமம் — ஓய்வு எடு", en: "Rest day — go easy" },
  MAHADASHA:      { ta: "முக்கிய கால கட்டம்", en: "Major life phase" },
  ANTARDASHA:     { ta: "உள் கால கட்டம்", en: "Sub-phase" },
  PRATYANTAR:     { ta: "மூன்றாம் நிலை கட்டம்", en: "Minor phase" },
  KANDAKA_SANI:   { ta: "சனி தடை நிலை", en: "Saturn challenge period" },
  ASHTAMA_SANI:   { ta: "சனி எட்டாம் நிலை", en: "Saturn 8th-house period" },
  RETROGRADE:     { ta: "உள்நோக்கு நிலை", en: "Reflective phase" },
  COMBUST:        { ta: "சூரிய அடக்கம்", en: "Sun-suppressed" },
  VARGOTTAMA:     { ta: "இரட்டை வலிமை", en: "Double strength" },
};

/**
 * Returns a plain-language label for a given astrological key.
 * In BEGINNER mode: returns friendly BiText label.
 * In BALANCED/TRADITIONAL mode: returns the original key as-is.
 */
export function plainLang(key: string, mode: Mode, lang: Lang): string {
  if (mode === "BEGINNER") {
    const entry = PLAIN_LANG[key.toUpperCase()];
    if (entry) return lang === "ta" ? entry.ta : entry.en;
  }
  return key;
}

/**
 * Returns a plain-language BiText for a given key, regardless of mode.
 * Used when you always want the friendly label (e.g. tooltips in BALANCED mode).
 */
export function plainLangBiText(key: string): BiText | null {
  return PLAIN_LANG[key.toUpperCase()] ?? null;
}

/**
 * Returns a plain-language dasha lord name.
 * In BEGINNER: "Saturn (discipline planet)" instead of "Sani".
 * In TRADITIONAL: original Tamil transliteration.
 */
export function plainLangDashaLord(lord: string, mode: Mode, lang: Lang): string {
  if (mode === "BEGINNER") {
    const upper = lord.toUpperCase();
    const entry = PLAIN_LANG[upper] ?? PLAIN_LANG[`${upper}AN`] ?? null;
    if (entry) return lang === "ta" ? entry.ta : entry.en;
  }
  return lord;
}
