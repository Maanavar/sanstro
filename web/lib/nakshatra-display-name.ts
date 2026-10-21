import { NAKSHATRA_NAMES, NAKSHATRA_SANSKRIT_NAMES } from "@vinaadi/shared";
import { tNakshatra, type Lang } from "@/lib/i18n";

/**
 * A nakshatra page's title and H1 name (§8.4, owner ruling 2026-10-21,
 * Option A): the Tamil name first, in the page's own script, with the
 * Sanskrit name in brackets in that same script.
 *
 *   en  Anusham Nakshathiram (Anuradha)
 *   ta  அனுஷம் நட்சத்திரம் (அனுராதா)
 *
 * The Tamil name comes from `tNakshatra`, so the 108 titles and H1s are never
 * typed by hand. No bracket where the Sanskrit name is the Tamil one
 * (Rohini, Bharani…). URLs are unchanged: they stay Sanskrit.
 */
const KEYS = Object.keys(NAKSHATRA_NAMES);

export function nakshatraDisplayName(nakshatra: number, lang: Lang): string {
  const key = KEYS[nakshatra - 1];
  if (!key) throw new RangeError(`nakshatra must be 1-27, received ${nakshatra}`);
  const name = `${tNakshatra(key, lang)} ${lang === "ta" ? "நட்சத்திரம்" : "Nakshathiram"}`;
  const sanskrit = NAKSHATRA_SANSKRIT_NAMES[key];
  return sanskrit ? `${name} (${sanskrit[lang]})` : name;
}
