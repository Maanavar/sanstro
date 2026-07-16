import { normalizeTamilAstroText } from "./tamil-astro";
import type { Lang } from "./i18n";

/**
 * Central bilingual catalog for the signed-in dashboard (UXD-04) — the mirror of
 * `marketing-i18n.ts` for the Nova surface, which historically had no catalog and
 * instead scattered ~1,900 inline `lang === "ta" ? … : …` ternaries across 150
 * files (unauditable Tamil coverage).
 *
 * Go-forward policy: new dashboard strings are defined here with `s(en, ta)` and
 * read with `dt(entry, lang)`; touched files migrate their inline ternaries into
 * this catalog rather than adding more. `node scripts/extract-dashboard-i18n.mjs`
 * enumerates the remaining inline strings (and emits docs/dashboard-i18n-catalog.json)
 * to seed that migration and make a native-Tamil review possible.
 */

export type BiStr = { en: string; ta: string };

/** Define a bilingual dashboard string. */
export function s(en: string, ta: string): BiStr {
  return { en, ta };
}

/** Resolve a bilingual string for the active language (Tamil normalized to match
 *  the marketing surface's `mt`). */
export function dt(str: BiStr, lang: Lang): string {
  return lang === "ta" ? normalizeTamilAstroText(str.ta) : str.en;
}

// ─── Streak surface (UXD-18) — first strings to live in the catalog ──────────
export const STREAK = {
  restDayKept: s("Rest day counted — streak safe", "ஓய்வு நாள் கணக்கிடப்பட்டது — தொடர்ச்சி பாதுகாப்பானது"),
  milestone: s("milestone", "மைல்கல்"),
} as const;
