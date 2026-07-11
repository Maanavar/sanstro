import { tTithi } from "./i18n";
import type { Lang } from "./i18n";

export type LunarSpecialTithi = "AMAVASAI" | "POURNAMI";

export function lunarSpecialTithiMeta(value: string | null | undefined, lang: Lang) {
  if (value === "AMAVASAI") {
    return {
      kind: "new" as const,
      label: tTithi("AMAVASAI", lang),
      phaseLabel: lang === "ta" ? "நிலா இல்லை" : "No moon",
    };
  }
  if (value === "POURNAMI") {
    return {
      kind: "full" as const,
      label: tTithi("POURNAMI", lang),
      phaseLabel: lang === "ta" ? "முழுநிலா" : "Full moon",
    };
  }
  return null;
}

/**
 * The moon's illuminated fraction and orientation for a given Tamil tithi,
 * derived purely from the tithi index + paksha we already ship to the client
 * (no ephemeris call). A tithi spans 12° of Moon–Sun elongation, so the middle
 * of tithi `n` sits at an elongation that maps cleanly onto a synodic phase:
 *
 *   Shukla (waxing):  Prathamai → new-ish crescent … Pournami (15) → full
 *   Krishna (waning): day after full … Amavasai (15) → new (dark)
 *
 * `fraction` is 0 at new moon, 1 at full moon; `waxing` picks which limb is lit
 * (right while waxing, left while waning) so a glyph can render the real shape.
 */
export type MoonPhase = {
  /** Illuminated fraction, 0 (new) … 1 (full). */
  fraction: number;
  /** True while the moon is growing (Shukla paksha up to Pournami). */
  waxing: boolean;
  /** Position through the synodic cycle, 0 (new) … 0.5 (full) … 1 (new again). */
  cyclePosition: number;
};

export function moonPhaseFromTithi(
  tithiNumber: number,
  paksha: "SHUKLA" | "KRISHNA",
): MoonPhase {
  const n = Math.min(15, Math.max(1, Math.round(tithiNumber || 1)));
  // Use the tithi's own index (its completed count) as the synodic position:
  // Shukla 1..15 → 1/30..15/30 (=full), Krishna 1..15 → 16/30..30/30 (=new).
  const cyclePosition = paksha === "SHUKLA" ? n / 30 : (15 + n) / 30;
  const angle = cyclePosition * 2 * Math.PI;
  const fraction = (1 - Math.cos(angle)) / 2;
  // Shukla is the bright/growing fortnight by definition — taking waxing from the
  // paksha (rather than the cyclePosition) keeps Pournami itself on the waxing
  // side instead of tipping at the exact 0.5 boundary.
  const waxing = paksha === "SHUKLA";
  return { fraction, waxing, cyclePosition };
}
