/**
 * Filename map for the gold line-art nakshatra artwork under
 * `web/public/nakshatra-signs/` (one self-contained SVG per nakshatra, gold
 * symbol on a dark cosmic gem — the same visual family as the rasi artwork in
 * `zodiac-images.ts`). Keyed by the canonical nakshatra *number* 1..27
 * (Aswini=1 … Revathi=27), which is the stable key across surfaces
 * (`NakshatraCardData.number`), so callers pass the number and never a name.
 *
 * Each traditional symbol matches what the app already declares for that
 * nakshatra in `app/services/nakshatra_content.py` (e.g. 1=horse head,
 * 9=coiled serpent, 27=fish), so the artwork and the text stay in agreement.
 *
 * The files are tiny static SVGs, so they are served directly via a plain
 * <img> rather than through the next/image optimizer.
 */

/** Public URL for a nakshatra's gold artwork, or null if out of range (1..27). */
export function nakshatraImageSrc(nakshatraNumber: number): string | null {
  return nakshatraNumber >= 1 && nakshatraNumber <= 27
    ? `/nakshatra-signs/${nakshatraNumber}.svg`
    : null;
}
