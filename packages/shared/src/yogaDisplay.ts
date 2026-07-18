/**
 * Display names for yoga/dosham engine codes.
 *
 * The chart payload carries engine codes (`SEVVAI_DOSHAM`) and a status *label*
 * (`ACTIVE_SEVVAI_DOSHAM`, `NO_SEVVAI_DOSHAM`) — neither is a display name. This
 * map is the single place that turns a code into something a reader sees.
 *
 * It lives in `packages/shared` because both web and mobile render these cards;
 * keeping a second copy per surface is exactly how the naming forks (see
 * docs/WEB_MOBILE_PARITY_AUDIT_2026-07-17.md §5).
 */

export type YogaDisplayLang = "ta" | "en";

export const YOGA_DISPLAY: Record<string, { ta: string; en: string }> = {
  GAJA_KESARI_YOGA: { ta: "Gaja Kesari Yoga", en: "Gaja Kesari Yoga" },
  GAJA_KESARI:      { ta: "Gaja Kesari Yoga", en: "Gaja Kesari Yoga" },
  RAJA_YOGA:        { ta: "Raja Yoga",         en: "Raja Yoga" },
  DHANA_YOGA:       { ta: "Dhana Yoga",        en: "Dhana Yoga" },
  NEECHA_BHANGA_RAJA_YOGA: { ta: "Neecha Bhanga Raja Yoga", en: "Neecha Bhanga Raja Yoga" },
  KALASARPA:        { ta: "காலசர்ப்ப யோகம்",   en: "Kala Sarpa Yoga" },
  BUDHA_ADITYA_YOGA:   { ta: "Budha-Aditya Yoga",    en: "Budha-Aditya Yoga" },
  VIPAREETHA_RAJA_YOGA:{ ta: "Vipareetha Raja Yoga", en: "Vipareetha Raja Yoga" },
  PARIVARTANA_YOGA:    { ta: "Parivartana Yoga",     en: "Parivartana Yoga" },
  CHANDRA_MANGALA_YOGA:{ ta: "Chandra-Mangala Yoga", en: "Chandra-Mangala Yoga" },
  SAKATA_YOGA:         { ta: "Sakata Yoga",          en: "Sakata Yoga" },
  KEMADRUMA_YOGA:      { ta: "Kemadruma Yoga",       en: "Kemadruma Yoga" },
  CHANDALA_YOGA:       { ta: "Guru-Chandala Yoga",   en: "Guru-Chandala Yoga" },
  AMALA_YOGA:          { ta: "Amala Yoga",           en: "Amala Yoga" },
  ADHI_YOGA:           { ta: "Adhi Yoga",            en: "Adhi Yoga" },
  DARIDRA_YOGA:        { ta: "Daridra Yoga",         en: "Daridra Yoga" },
  LAKSHMI_YOGA:        { ta: "Lakshmi Yoga",         en: "Lakshmi Yoga" },
  VASUMATI_YOGA:       { ta: "Vasumati Yoga",        en: "Vasumati Yoga" },
  RUCHAKA_YOGA:        { ta: "Ruchaka Yoga",         en: "Ruchaka Yoga" },
  BHADRA_YOGA:         { ta: "Bhadra Yoga",          en: "Bhadra Yoga" },
  HAMSA_YOGA:          { ta: "Hamsa Yoga",           en: "Hamsa Yoga" },
  MALAVYA_YOGA:        { ta: "Malavya Yoga",         en: "Malavya Yoga" },
  SASA_YOGA:           { ta: "Sasa Yoga",            en: "Sasa Yoga" },
  SUNAPHA_YOGA:        { ta: "Sunapha Yoga",         en: "Sunapha Yoga" },
  PAPA_KARTARI_YOGA:   { ta: "Papa Kartari Yoga",    en: "Papa Kartari Yoga" },
  SEVVAI_DOSHAM:    { ta: "செவ்வாய் தோஷம்",      en: "Sevvai Dosham" },
  RAHU_KETU_DOSHAM: { ta: "ராகு-கேது தோஷம்",  en: "Rahu-Ketu Dosham" },
  PITRU_DOSHAM:     { ta: "பித்ரு தோஷம்",       en: "Pitru Dosham" },
  KALATHRA_DOSHAM:  { ta: "களத்திர தோஷம்",    en: "Kalathra Dosham" },
  PUTRA_SARPA_DOSHAM: { ta: "புத்ர சர்ப்ப தோஷம்", en: "Putra Sarpa Dosham" },
  BADHAKA_DOSHAM:   { ta: "பாதக தோஷம்",     en: "Badhaka Dosham" },
  MARANA_KARAKA_STHANA: { ta: "மரண காரக ஸ்தானம்", en: "Marana Karaka Sthana" },
};

/**
 * Looks up a yoga engine name (e.g. "GAJA_KESARI_YOGA") in a per-yoga
 * dictionary. Tries the name directly first, and only falls back to a
 * defensive "GAJA_KESARI" -> "GAJA_KESARI_YOGA" rewrite for a hypothetical
 * bare "GAJA_KESARI" input the engine has never actually emitted. Applying
 * that rewrite unconditionally (as every call site here used to) corrupts
 * the real value "GAJA_KESARI_YOGA" into "GAJA_KESARI_YOGA_YOGA" — the
 * string "GAJA_KESARI" matches the leading substring of "GAJA_KESARI_YOGA"
 * and gets replaced, leaving the original "_YOGA" suffix still appended
 * after it — which silently missed every dictionary lookup for the one
 * yoga name that's actually ever emitted (Gaja Kesari Yoga's own outcomes/
 * how-to/remedies/power-context never rendered as a result).
 */
export function resolveYogaKey<T>(dict: Record<string, T>, name: string): T | undefined {
  const key = name.toUpperCase();
  return dict[key] ?? dict[key.replace("GAJA_KESARI", "GAJA_KESARI_YOGA")];
}

/**
 * Tri-state reading status for a yoga.
 *
 * `isPresent` alone is NOT a display status. It answers "did the defining
 * geometry form?", which is a different question from "does this yoga operate
 * in the reading?". A yoga whose geometry formed but which classical bhanga
 * rules then annul must read as CANCELLED, not PRESENT.
 *
 * Rendering `isPresent ? "Present" : "Absent"` (the previous behaviour) threw
 * the engine's own cancellation away and produced readings no jyotishi would
 * sign: Gaja Kesari and Kemadruma both "Present" on one chart, when Jupiter in
 * a kendra from the Moon is simultaneously what forms the first and what
 * destroys the second.
 *
 * Kept in `packages/shared` so web and mobile resolve status identically.
 */
export type YogaReadingStatus = "PRESENT" | "CANCELLED" | "ABSENT";

export function yogaReadingStatus(y: {
  isPresent: boolean;
  strength: string;
  cancellationFactors?: string[] | null;
}): YogaReadingStatus {
  if (!y.isPresent) return "ABSENT";
  const cancelled = (y.cancellationFactors?.length ?? 0) > 0;
  // WEAK *with* bhanga factors means the annulment carried; WEAK on its own
  // just means a formed-but-feeble yoga, which still reads as present.
  if (cancelled && y.strength === "WEAK") return "CANCELLED";
  return "PRESENT";
}

export function yogaReadingStatusLabel(
  status: YogaReadingStatus,
  lang: YogaDisplayLang,
): string {
  if (status === "ABSENT") return lang === "ta" ? "இல்லை" : "Absent";
  if (status === "CANCELLED") return lang === "ta" ? "நிவர்த்தி" : "Cancelled";
  // "உண்டு" over "உள்ளது" for the standalone chip — native-Tamil review,
  // 2026-07-18 (T-01). The longer sentence form elsewhere keeps "உள்ளது",
  // where it reads naturally as part of a clause.
  return lang === "ta" ? "உண்டு" : "Present";
}

export function displayName(name: string, lang: YogaDisplayLang): string {
  const entry = resolveYogaKey(YOGA_DISPLAY, name);
  if (!entry) return name;
  return lang === "ta" ? entry.ta : entry.en;
}
