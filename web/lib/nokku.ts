import { nakshatraNumberFromName } from "./i18n";
import type { Lang } from "./i18n";

/**
 * Nokku (நோக்கு) — the "facing" of the day's nakshatra.
 *
 * Classical Muhurta classifies all 27 nakshatras into three groups by which way
 * the star is said to look, and Tamil almanacs print this as மேல்/கீழ்/சம நோக்கு
 * நாள். It decides which *direction of effort* the day supports: work that rises
 * (building upward, hoisting, study, promotion) on a mel nokku day, work that
 * descends (foundations, wells, ploughing, mining) on a keel nokku day, and work
 * that runs level (travel, trade, laying a road) on a sama nokku day.
 *
 * Derived on the client from the nakshatra already on the wire — no API change,
 * same approach as `lunar.ts` deriving the moon's shape from tithi + paksha.
 *
 * ── SOURCE NOTE ─────────────────────────────────────────────────────────────
 * The table below is the standard classical partition (ūrdhvamukha /
 * adhomukha / tiryaṅmukha, 9 nakshatras each). Published Tamil almanacs are
 * known to differ from it in a small number of placements. This has NOT been
 * checked against the reference almanac this project follows — treat it as
 * preliminary until an astrologer signs it off.
 */

/** Enum keys stay Sanskrit (project convention); display names follow almanac Tamil. */
export type NokkuClass = "URDHVAMUKHA" | "ADHOMUKHA" | "TIRYANGMUKHA";

/**
 * Nakshatra numbers (1 = Aswini … 27 = Revathi, the canonical order in
 * `NAKSHATRA_NAMES`) grouped by facing.
 *
 * Sanity rule worth remembering when editing: every *Uthira-* (Uttara) star
 * faces up and every *Poora-* (Purva) star faces down. If an edit breaks that
 * pairing it is almost certainly wrong.
 */
const URDHVAMUKHA_NUMBERS = [4, 6, 8, 12, 21, 22, 23, 24, 26];  // Rohini, Thiruvathirai, Poosam, Uthiram, Uthiradam, Thiruvonam, Avittam, Sadayam, Uthirattathi
const ADHOMUKHA_NUMBERS   = [2, 3, 9, 10, 11, 16, 19, 20, 25];  // Bharani, Karthigai, Ayilyam, Magam, Pooram, Visakam, Moolam, Pooradam, Poorattathi
const TIRYANGMUKHA_NUMBERS = [1, 5, 7, 13, 14, 15, 17, 18, 27]; // Aswini, Mirugaseeridam, Punarpoosam, Hastham, Chithirai, Swathi, Anusham, Kettai, Revathi

const NOKKU_BY_NUMBER: Record<number, NokkuClass> = {
  ...Object.fromEntries(URDHVAMUKHA_NUMBERS.map((n) => [n, "URDHVAMUKHA" as const])),
  ...Object.fromEntries(ADHOMUKHA_NUMBERS.map((n) => [n, "ADHOMUKHA" as const])),
  ...Object.fromEntries(TIRYANGMUKHA_NUMBERS.map((n) => [n, "TIRYANGMUKHA" as const])),
};

/** Exported for the completeness test — a partition gap must fail loudly, not
 *  silently classify a real day as "unknown". */
export const NOKKU_GROUPS = {
  URDHVAMUKHA: URDHVAMUKHA_NUMBERS,
  ADHOMUKHA: ADHOMUKHA_NUMBERS,
  TIRYANGMUKHA: TIRYANGMUKHA_NUMBERS,
} as const;

type NokkuLabels = { label: string; meaning: string };

const LABELS_TA: Record<NokkuClass, NokkuLabels> = {
  URDHVAMUKHA:  { label: "மேல் நோக்கு நாள்", meaning: "உயரும் வேலைகளுக்கு உகந்தது — கட்டிடம், கல்வி, உயர்வு" },
  ADHOMUKHA:    { label: "கீழ் நோக்கு நாள்", meaning: "ஆழமான வேலைகளுக்கு உகந்தது — அடித்தளம், கிணறு, உழவு" },
  TIRYANGMUKHA: { label: "சம நோக்கு நாள்",   meaning: "சமமான வேலைகளுக்கு உகந்தது — பயணம், வியாபாரம், ஒப்பந்தம்" },
};

// English romanises the Tamil rather than translating it (project naming rule) —
// the meaning rides along separately as a tooltip, never as a parenthetical echo
// beside the label.
const LABELS_EN: Record<NokkuClass, NokkuLabels> = {
  URDHVAMUKHA:  { label: "Mel Nokku Naal",  meaning: "Favours work that rises — building, study, advancement" },
  ADHOMUKHA:    { label: "Keel Nokku Naal", meaning: "Favours work that goes deep — foundations, wells, ploughing" },
  TIRYANGMUKHA: { label: "Sama Nokku Naal", meaning: "Favours work that runs level — travel, trade, agreements" },
};

export function nokkuClassForNakshatra(name: string | null | undefined): NokkuClass | null {
  const number = nakshatraNumberFromName(name);
  if (number === null) return null;
  return NOKKU_BY_NUMBER[number] ?? null;
}

/**
 * Label + meaning for the day's nokku, or null when the nakshatra can't be
 * resolved. Callers should pass the day's (sunrise) nakshatra, not the
 * *active* post-rollover one — nokku is fixed for the whole civil day and
 * does not change when the star rolls over mid-day (confirmed 2026-08-10:
 * a Thiruvathirai-sunrise day stayed Mel Nokku Naal after rolling to
 * Punarpoosam at 12:27pm, which would otherwise wrongly read as Sama Nokku).
 */
export function nokkuMeta(name: string | null | undefined, lang: Lang): (NokkuLabels & { nokku: NokkuClass }) | null {
  const nokku = nokkuClassForNakshatra(name);
  if (!nokku) return null;
  const labels = lang === "ta" ? LABELS_TA[nokku] : LABELS_EN[nokku];
  return { nokku, ...labels };
}
