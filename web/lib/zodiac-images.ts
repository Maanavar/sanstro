/**
 * Filename map for the gold line-art zodiac artwork under
 * `web/public/zodiac-signs/` (one AVIF per rasi, 621×626, ~70KB, cohesive
 * gold-on-cosmic set). Keyed by the canonical rasi *number* 1..12 (Mesham=1 …
 * Meenam=12) rather than by name, because the artwork filenames use different
 * romanisations than the app's rasi labels (e.g. "Rishabham" vs "Rishabam",
 * "Midhunam" vs "Mithunam", "Virichigam" vs "Viruchigam"). Number is the stable
 * key across surfaces, so callers pass the rasi number and never a name.
 *
 * These files are already web-appropriate (AVIF, small), so they are served
 * directly via a plain <img> rather than through the next/image optimizer.
 */
import { D1_RASI_NAMES } from "./chart-utils";

const ZODIAC_IMAGE_FILES: Record<number, string> = {
  1: "1Mesham.avif",
  2: "2Rishabham.avif",
  3: "3Midhunam.avif",
  4: "4Kadagam.avif",
  5: "5Simmam.avif",
  6: "6Kanni.avif",
  7: "7Thulam.avif",
  8: "8Virichigam.avif",
  9: "9Dhanusu.avif",
  10: "10Magharam.avif",
  11: "11Kumbham.avif",
  12: "12Meenam.avif",
};

/** Public URL for a rasi's gold artwork, or null if the number is out of range. */
export function zodiacImageSrc(rasiNumber: number): string | null {
  const file = ZODIAC_IMAGE_FILES[rasiNumber];
  return file ? `/zodiac-signs/${file}` : null;
}

// Reverse lookup so surfaces that only carry the rasi *name* (e.g. the
// dashboard identity strip's ChartSummaryData.moonRasi = "Mesham") can still
// resolve the artwork. Built from the canonical D1_RASI_NAMES so the spelling
// always matches whatever the rest of the app renders. Case-insensitive and
// trimmed to tolerate incidental whitespace/casing from upstream strings.
const RASI_NUMBER_BY_NAME: Record<string, number> = D1_RASI_NAMES.reduce(
  (acc, name, idx) => {
    if (name) acc[name.trim().toLowerCase()] = idx;
    return acc;
  },
  {} as Record<string, number>,
);

/** Rasi number (1..12) for a classical rasi name, or null if unrecognised. */
export function rasiNumberFromName(name: string | null | undefined): number | null {
  if (!name) return null;
  return RASI_NUMBER_BY_NAME[name.trim().toLowerCase()] ?? null;
}
