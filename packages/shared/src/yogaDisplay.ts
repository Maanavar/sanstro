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

// Tamil mode shows every yoga name in Tamil script (native-Tamil review,
// 2026-09-23): the familiar Sanskrit terms transliterated, not translated.
// English names inside an otherwise Tamil screen "feel unfinished". Names match
// the rule registry's `name_ta` (`app/calculations/yoga_rules.py`), with
// ராஜயோகம் written as one word per the same review.
export const YOGA_DISPLAY: Record<string, { ta: string; en: string }> = {
  GAJA_KESARI_YOGA: { ta: "கஜகேசரி யோகம்", en: "Gaja Kesari Yoga" },
  GAJA_KESARI:      { ta: "கஜகேசரி யோகம்", en: "Gaja Kesari Yoga" },
  RAJA_YOGA:        { ta: "ராஜயோகம்",       en: "Raja Yoga" },
  YOGAKARAKA_RAJA_YOGA:  { ta: "யோககாரக ராஜயோகம்", en: "Yogakaraka Raja Yoga" },
  DHANA_YOGA:       { ta: "தன யோகம்",        en: "Dhana Yoga" },
  DHANA_SUPPORTIVE_YOGA: { ta: "தன யோகம் (துணை)", en: "Dhana Yoga (supportive)" },
  NEECHA_BHANGA_RAJA_YOGA: { ta: "நீசபங்க ராஜயோகம்", en: "Neecha Bhanga Raja Yoga" },
  KALASARPA:        { ta: "காலசர்ப்ப யோகம்",   en: "Kala Sarpa Yoga" },
  BUDHA_ADITYA_YOGA:   { ta: "புத ஆதித்ய யோகம்",   en: "Budha-Aditya Yoga" },
  VIPAREETHA_RAJA_YOGA:{ ta: "விபரீத ராஜயோகம்",    en: "Vipareetha Raja Yoga" },
  PARIVARTANA_YOGA:    { ta: "பரிவர்தன யோகம்",en: "Parivartana Yoga" },
  CHANDRA_MANGALA_YOGA:{ ta: "சந்திர மங்கள யோகம்", en: "Chandra-Mangala Yoga" },
  SAKATA_YOGA:         { ta: "சகட யோகம்",          en: "Sakata Yoga" },
  KEMADRUMA_YOGA:      { ta: "கேமத்ரும யோகம்",      en: "Kemadruma Yoga" },
  CHANDALA_YOGA:       { ta: "குரு சண்டாள யோகம்",   en: "Guru-Chandala Yoga" },
  CHANDALA_KETU_YOGA:  { ta: "குரு சண்டாள யோகம் (குரு-கேது)", en: "Guru-Chandala Yoga (Ketu variant)" },
  AMALA_YOGA:          { ta: "அமல யோகம்",          en: "Amala Yoga" },
  ADHI_YOGA:           { ta: "அதி யோகம்",           en: "Adhi Yoga" },
  DARIDRA_YOGA:        { ta: "தரித்ர யோகம்",        en: "Daridra Yoga" },
  // NOT "(supportive)" — that wording was copy-pasted from DHANA_SUPPORTIVE_YOGA
  // above, where "supportive" means a supportive *variant of a wealth yoga*.
  // Daridra-proxy is an adverse income-pressure indicator, so the same word told
  // a reader their poverty-pressure signal was a blessing. The backend row
  // (`yoga_rules.py` YOG-DR-02) names it "வினாடி அளவுகோல்" / "Vinaadi measure"
  // precisely because the 2026-08-28 ruling required the proxy to be labelled as
  // ours; keep the attribution.
  DARIDRA_PROXY_YOGA:  { ta: "தரித்ர யோகம் (வினாடி அளவுகோல்)", en: "Daridra Yoga (Vinaadi measure)" },
  LAKSHMI_YOGA:        { ta: "லக்ஷ்மி யோகம்",       en: "Lakshmi Yoga" },
  VASUMATI_YOGA:       { ta: "வசுமதி யோகம்",        en: "Vasumati Yoga" },
  RUCHAKA_YOGA:        { ta: "ருசக யோகம்",          en: "Ruchaka Yoga" },
  BHADRA_YOGA:         { ta: "பத்ர யோகம்",          en: "Bhadra Yoga" },
  HAMSA_YOGA:          { ta: "ஹம்ச யோகம்",          en: "Hamsa Yoga" },
  MALAVYA_YOGA:        { ta: "மாளவ்ய யோகம்",        en: "Malavya Yoga" },
  SASA_YOGA:           { ta: "சஸ யோகம்",           en: "Sasa Yoga" },
  SUNAPHA_YOGA:        { ta: "சுனபா யோகம்",         en: "Sunapha Yoga" },
  PAPA_KARTARI_YOGA:   { ta: "பாப கர்த்தரி யோகம்",   en: "Papa Kartari Yoga" },
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
  const cancelled = (y.cancellationFactors?.length ?? 0) > 0;
  // `!isPresent` is NOT the same as "never formed". Since the YOG-KD-01 ruling a
  // full Kemadruma-bhanga sets `is_present=false` on the backend while leaving
  // `cancellationFactors` populated — the Moon *was* isolated and the bhanga
  // then annulled it. Returning ABSENT on `!isPresent` alone (the previous
  // behaviour) made this the dead branch it was written for, and told such a
  // native their chart never had the geometry at all.
  //
  // Astrologer ruling, 2026-09-11: formed-and-cancelled is a reading in its own
  // right — the native carries the yoga's signature together with the resource
  // to transcend it — and deleting it deletes something valuable. Check the
  // bhanga factors before presence, not after.
  if (!y.isPresent) return cancelled ? "CANCELLED" : "ABSENT";
  // WEAK *with* bhanga factors means the annulment carried; WEAK on its own
  // just means a formed-but-feeble yoga, which still reads as present.
  if (cancelled && y.strength === "WEAK") return "CANCELLED";
  return "PRESENT";
}

/**
 * Yogas that read as a demand rather than a gift.
 *
 * Presentation keys off `strength` alone almost everywhere, which is correct for
 * a benefic and wrong for these: a STRONG Kemadruma was rendered with the ★ glyph
 * and the `--color-high` tokens, and mobile's `Key Yogas` top-3 ranked "emotional
 * isolation" at position 1 behind a gold medallion. Valence is not derivable from
 * strength, and the backend registry already knows it — every row below is called
 * "an adverse yoga" in its own `yoga_rules.py` note — so it is mirrored here, in
 * the one module both surfaces already import.
 *
 * This is a *presentation* signal only. It must never suppress a card: an adverse
 * yoga the chart has is still the reader's to see.
 */
export const ADVERSE_YOGAS: ReadonlySet<string> = new Set([
  "SAKATA_YOGA",
  "KEMADRUMA_YOGA",
  "DARIDRA_YOGA",
  "DARIDRA_PROXY_YOGA",
  "PAPA_KARTARI_YOGA",
  "CHANDALA_YOGA",
  "CHANDALA_KETU_YOGA",
]);

export function isAdverseYoga(name: string): boolean {
  return ADVERSE_YOGAS.has(name.toUpperCase());
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

/**
 * Two questions, two answers — never one chip for both.
 *
 * 1. **Standing** — how a yoga or dosham stands in the *birth chart*. Lifelong.
 *    Strong / Moderate / Mild, or Mitigated (dosham) / Cancelled (yoga).
 * 2. **Running** — is the current Mahadasha or Antardasha lord lighting it?
 *    Changes every bhukti. Only `isRunningInDasha` answers this.
 *
 * Before 2026-09-23 each surface picked its own word for the chip. The Charts
 * card printed a dosham's natal strength ("Partial"), Life Areas printed
 * "Active" for anything not cancelled under an "Active right now" heading, and
 * the Charts card used the same "Active" for a *yoga's* dasha timing. One chart
 * showed Marana Karaka Sthana as "Partial" on one tab and "Active" on the next,
 * and the engine said neither: PARTIAL in the chart, not running in the dasha.
 * Every surface resolves through these two functions so they cannot drift.
 */
export type StandingTone = "good" | "caution" | "mid" | "muted";
export type Standing = { label: string; tone: StandingTone };

/** The natal-strength word. Same scale for yogas and doshams. */
export function natalStrengthWord(strength: string, lang: YogaDisplayLang): string {
  if (strength === "STRONG") return lang === "ta" ? "வலுவான" : "Strong";
  if (strength === "PARTIAL") return lang === "ta" ? "மிதமான" : "Moderate";
  // லேசான, not மென்மையான: "மென்மையான தோஷம்" reads as a *gentle* dosham
  // (native-Tamil review, 2026-09-23).
  return lang === "ta" ? "லேசான" : "Mild";
}

/**
 * Presence only — for a slot that sits beside a separate strength and a
 * separate dasha line (Explore, the full dosham cards). "Active" is not a
 * presence word: it is reserved for dasha timing.
 */
export function doshamPresenceLabel(
  d: { isPresent: boolean; isCancelled: boolean },
  lang: YogaDisplayLang,
): string {
  if (!d.isPresent) return lang === "ta" ? "இல்லை" : "Absent";
  if (d.isCancelled) return lang === "ta" ? "நிவர்த்தி" : "Mitigated";
  return lang === "ta" ? "உண்டு" : "Present";
}

/** Presence and strength in one word — for a surface with room for one chip. */
export function doshamStanding(
  d: { isPresent: boolean; isCancelled: boolean; strength: string },
  lang: YogaDisplayLang,
): Standing {
  if (!d.isPresent || d.isCancelled) {
    return { label: doshamPresenceLabel(d, lang), tone: d.isPresent ? "good" : "muted" };
  }
  return { label: natalStrengthWord(d.strength, lang), tone: d.strength === "STRONG" ? "caution" : "mid" };
}

export function yogaStanding(
  y: { name: string; isPresent: boolean; strength: string; cancellationFactors?: string[] | null },
  lang: YogaDisplayLang,
): Standing {
  const status = yogaReadingStatus(y);
  if (status !== "PRESENT") return { label: yogaReadingStatusLabel(status, lang), tone: status === "CANCELLED" ? "mid" : "muted" };
  const label = natalStrengthWord(y.strength, lang);
  // Valence before strength — a strong Kemadruma is a demand, not a prize.
  if (isAdverseYoga(y.name)) return { label, tone: y.strength === "STRONG" ? "caution" : "mid" };
  return { label, tone: "good" };
}

/**
 * Is the running Mahadasha/Antardasha lighting this now? A mitigated dosham is
 * never "running" as a concern — the engine's own power text drops its dasha
 * clause once nivarthi applies.
 */
export function isRunningInDasha(item: {
  isPresent: boolean;
  isCancelled?: boolean;
  dashaActivated: boolean;
  isCurrentlyActive?: boolean;
}): boolean {
  if (!item.isPresent || item.isCancelled) return false;
  return item.isCurrentlyActive ?? item.dashaActivated;
}

export function displayName(name: string, lang: YogaDisplayLang): string {
  const entry = resolveYogaKey(YOGA_DISPLAY, name);
  if (!entry) return name;
  return lang === "ta" ? entry.ta : entry.en;
}
