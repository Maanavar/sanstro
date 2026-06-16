// Single source of truth for astrological glyphs/symbols used across the app
// (calendar, panchangam tiles, member cards). Keep all symbol lookups here so
// rasi / nakshatra / festival marks stay consistent everywhere.

// ── Rasi (zodiac sign) glyphs ────────────────────────────────────────────────
// Indexed 1–12 (Mesham=1 … Meenam=12). Index 0 is an empty placeholder so the
// 1-based rasi numbers from the engine map directly.
export const RASI_GLYPHS: string[] = [
  "", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓",
];

// Accept either the 1-based rasi number, the Tamil-English name (Mesham…), or
// the western name (Aries…) and return the exact zodiac glyph.
const RASI_NAME_TO_INDEX: Record<string, number> = {
  mesham: 1, aries: 1,
  rishabam: 2, rishaba: 2, taurus: 2,
  mithunam: 3, gemini: 3,
  kadagam: 4, kataka: 4, cancer: 4,
  simmam: 5, simha: 5, leo: 5,
  kanni: 6, kanya: 6, virgo: 6,
  thulam: 7, thula: 7, libra: 7,
  viruchigam: 8, vrischika: 8, scorpio: 8,
  dhanusu: 9, dhanus: 9, sagittarius: 9,
  magaram: 10, makara: 10, capricorn: 10,
  kumbam: 11, kumbha: 11, aquarius: 11,
  meenam: 12, meena: 12, pisces: 12,
};

export function rasiGlyph(rasi: number | string | null | undefined): string {
  if (rasi == null) return "";
  if (typeof rasi === "number") return RASI_GLYPHS[rasi] ?? "";
  const trimmed = rasi.trim();
  const asNum = Number(trimmed);
  if (Number.isFinite(asNum) && asNum >= 1 && asNum <= 12) return RASI_GLYPHS[asNum] ?? "";
  const idx = RASI_NAME_TO_INDEX[trimmed.toLowerCase()];
  return idx ? (RASI_GLYPHS[idx] ?? "") : "";
}

// ── Nakshatra emblems ────────────────────────────────────────────────────────
// Traditional emblem for each of the 27 nakshatras, keyed by the engine's
// uppercase Tamil name. Approximated with the closest widely-rendered glyph.
export const NAKSHATRA_SYMBOLS: Record<string, string> = {
  ASWINI: "🐎",        // horse's head
  BHARANI: "🌺",       // yoni
  KARTHIGAI: "🔪",     // knife / flame
  ROHINI: "🛺",        // cart
  MIRUGASEERIDAM: "🦌",// deer's head
  THIRUVATHIRAI: "💧", // teardrop
  PUNARPOOSAM: "🏹",   // bow
  POOSAM: "🏵️",        // flower / udder
  AYILYAM: "🐍",       // serpent
  MAGAM: "👑",         // throne
  POORAM: "🛏️",        // front legs of a cot
  UTHIRAM: "🛏️",       // back legs of a cot
  HASTHAM: "✋",        // hand
  CHITHIRAI: "💎",     // pearl / gem
  SWATHI: "🌬️",        // shoot of plant / wind
  VISAKAM: "🏛️",       // triumphal arch
  ANUSHAM: "🪷",       // lotus
  KETTAI: "☂️",        // umbrella / earring
  MOOLAM: "🌿",        // bunch of roots
  POORADAM: "🪭",      // fan / tusk
  UTHIRADAM: "🐘",     // elephant tusk
  THIRUVONAM: "👣",    // three footprints
  AVITTAM: "🥁",       // drum
  SADAYAM: "⭕",       // circle
  POORATTATHI: "🗡️",   // sword / front of a cot
  UTHIRATTATHI: "🐉",  // back of a cot / serpent
  REVATHI: "🐟",       // fish / drum
};

export function nakshatraSymbol(name: string | null | undefined): string {
  if (!name) return "";
  return NAKSHATRA_SYMBOLS[name.trim().toUpperCase()] ?? "✦";
}

// ── Festival / observance / special-tithi glyphs ─────────────────────────────
// Keyed by a pattern found in the (English or transliterated) festival name.
const FESTIVAL_ICON_RULES: Array<[RegExp, string]> = [
  [/pournami|pournima|purnima|full\s*moon/i, "🌕"],
  [/amavasai|amavasya|new\s*moon/i, "🌑"],
  [/ekadasi|ekadashi/i, "🪷"],
  [/pradhosam|pradosham/i, "🪔"],
  [/sivarath|shivarath/i, "🔱"],
  [/chathurthi|chaturthi/i, "🐘"],
  [/sashti|shashti/i, "🦚"],
  [/ashtami/i, "🗡️"],
  [/karthigai|krittika/i, "🪔"],
  [/pongal|sankranti/i, "🌾"],
  [/deepavali|diwali/i, "🪔"],
  [/visakam|magam|uthiram|nakshatra/i, "⭐"],
];

export function festivalGlyph(name: string): string {
  for (const [pattern, icon] of FESTIVAL_ICON_RULES) {
    if (pattern.test(name)) return icon;
  }
  return "✨";
}

// Special-tithi glyph: 🌕 for Pournami (full moon), 🌑 for Amavasai (new moon).
export function specialTithiGlyph(kind: "new" | "full"): string {
  return kind === "new" ? "🌑" : "🌕";
}
