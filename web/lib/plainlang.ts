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

/**
 * The plain-language role of each graha — the *only* thing this layer writes.
 *
 * Each is the graha's natural kāraka stated for a first-time reader: Sun the
 * ātma-kāraka, Moon the mano-kāraka, Mars parākrama, Mercury speech/intellect,
 * Guru the jñāna-kāraka, Venus kalatra. Rahu and Ketu read "force", not
 * "planet", because they are chāyā grahas — shadow points, not bodies.
 *
 * OWNER RULING 2026-08-24 on Guru: the identity gloss is **wisdom**, not
 * growth. Guru does signify expansion, prosperity, children and dharma, so
 * "growth planet" was not wrong — but for a one-line identity the defining
 * Tamil-Jyotisha karakatva is ஞானம், and every *detail* surface in this app
 * already said so ("Wisdom & growth" in `dashboard-hybrid-parts.tsx`;
 * "wisdom, wealth, children, teachers/guru" in `dashboard-chart-explanation`).
 * This row was the one place that led with growth. Expansion keeps its place
 * among Guru's secondary significations on those screens.
 *
 * Written ONCE per graha and expanded below into both key forms. Until
 * 2026-08-24 the two forms were separate literal rows and had already drifted:
 * Saturn's role was "ஒழுக்க கிரகம்" (moral conduct) under `SA` and
 * "கட்டுப்பாடு கிரகம்" (restraint) under `SATURN`, one English gloss with two
 * Tamil readings, and only the second was reachable. Restraint is the better
 * reading of Sani and it is the one that shipped, so it is the one kept.
 */
const GRAHA_ROLE: Record<string, { ta: string; en: string }> = {
  SUN:      { ta: "ஆன்மா கிரகம்",      en: "soul planet" },
  MOON:     { ta: "மனம் கிரகம்",        en: "mind planet" },
  MARS:     { ta: "செயல் கிரகம்",       en: "action planet" },
  MERCURY:  { ta: "தகவல் கிரகம்",       en: "communication planet" },
  // The one row whose Tamil is a classical karaka title rather than the
  // "X கிரகம்" pattern, and deliberately so: ஞானகாரகன் is the standard almanac
  // label for Guru. Note it means *significator of* wisdom — the English
  // "wisdom planet" is the beginner rendering, not a translation of it.
  JUPITER:  { ta: "ஞானகாரகன்",          en: "wisdom planet" },
  VENUS:    { ta: "அன்பு கிரகம்",       en: "love planet" },
  SATURN:   { ta: "கட்டுப்பாடு கிரகம்", en: "discipline planet" },
  RAHU:     { ta: "மாற்றம்",            en: "change force" },
  KETU:     { ta: "வைராக்கியம்",        en: "detachment force" },
};

/** Two-letter code for each graha. Both key forms resolve to the same row. */
const GRAHA_SHORT_CODE: Record<string, string> = {
  SUN: "SU", MOON: "MO", MARS: "MA", MERCURY: "ME", JUPITER: "JU",
  VENUS: "VE", SATURN: "SA", RAHU: "RA", KETU: "KE",
};

/**
 * Both key forms of all nine grahas, each carrying its role.
 *
 * The full-name rows used to be bare — `graha()` with no gloss returns the
 * canonical name as its own "definition" — on the recorded grounds that the
 * narrative engine embeds those keys mid-sentence, where a parenthetical reads
 * worse than on a standalone label. That reason no longer describes the code:
 * `plainLang()`, the sentence-level entry point, has no callers anywhere in the
 * tree. The live readers are `plainLangDashaLord` and `plainLangBiText`, and
 * both serve standalone dasha-lord labels — exactly the case the gloss is for.
 *
 * Leaving it uneven meant BEGINNER's inline gloss and BALANCED's tap-to-explain
 * fired for Saturn/Rahu/Ketu only: whichever of nine grahas is running, so most
 * readers most of the time saw neither mode keep its promise. No new copy was
 * written to close that — the roles above are the strings the two-letter rows
 * already carried. If a sentence-embedding caller ever appears, it wants a
 * bare-name accessor, not nine deliberately half-filled dictionary rows.
 */
const GRAHA_ROWS: Record<string, BiText> = Object.fromEntries(
  Object.entries(GRAHA_ROLE).flatMap(([name, role]) => {
    const row = graha(name, role.ta, role.en);
    return [
      [name, row],
      [GRAHA_SHORT_CODE[name], row],
    ];
  }),
);

const PLAIN_LANG: Record<string, BiText> = {
  ...GRAHA_ROWS,

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
