/**
 * Plain language display layer — translates astrological keys into
 * user-friendly text based on depth mode.
 *
 * This is a DISPLAY-ONLY layer. All underlying calculations remain unchanged.
 * Never pass plain-lang output to backend endpoints.
 */

import type { Lang } from "./i18n";

export type Mode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

interface BiText {
  ta: string;
  en: string;
}

const PLAIN_LANG: Record<string, BiText> = {
  // ── Planets
  SU:       { ta: "சூரியன் (ஆன்மா கிரகம்)", en: "Sun (soul planet)" },
  MO:       { ta: "சந்திரன் (மனம் கிரகம்)", en: "Moon (mind planet)" },
  MA:       { ta: "செவ்வாய் (செயல் கிரகம்)", en: "Mars (action planet)" },
  ME:       { ta: "புதன் (தகவல் கிரகம்)", en: "Mercury (communication planet)" },
  JU:       { ta: "குரு (வளர்ச்சி கிரகம்)", en: "Jupiter (growth planet)" },
  VE:       { ta: "சுக்கிரன் (அன்பு கிரகம்)", en: "Venus (love planet)" },
  SA:       { ta: "சனி (ஒழுக்க கிரகம்)", en: "Saturn (discipline planet)" },
  RA:       { ta: "ராகு (மாற்றம்)", en: "Rahu (change force)" },
  KE:       { ta: "கேது (வைராக்கியம்)", en: "Ketu (detachment force)" },

  // Common string-key variants used in narrative engine
  SUN:      { ta: "சூரியன்", en: "Sun" },
  MOON:     { ta: "சந்திரன்", en: "Moon" },
  MARS:     { ta: "செவ்வாய்", en: "Mars" },
  MERCURY:  { ta: "புதன்", en: "Mercury" },
  JUPITER:  { ta: "குரு", en: "Jupiter" },
  VENUS:    { ta: "சுக்கிரன்", en: "Venus" },
  SATURN:   { ta: "சனி (கட்டுப்பாடு கிரகம்)", en: "Saturn (discipline planet)" },
  RAHU:     { ta: "ராகு (மாற்றம்)", en: "Rahu (change force)" },
  KETU:     { ta: "கேது (வைராக்கியம்)", en: "Ketu (detachment force)" },

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
