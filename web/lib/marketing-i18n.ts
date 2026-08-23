import { normalizeTamilAstroText } from "./tamil-astro";
import { LANG_STORAGE_KEY, type Lang } from "./i18n";

export type { Lang };
export { LANG_STORAGE_KEY };

import { s, type BiStr } from "./marketing-i18n/_s";

export function mt(str: BiStr, lang: Lang): string {
  return lang === "ta" ? normalizeTamilAstroText(str.ta) : str.en;
}

// ── Domain modules ─────────────────────────────────────────────────────────
//
// One module per page. Re-exported here so the ~63 existing
// `from "@/lib/marketing-i18n"` import sites are unchanged — but because
// package.json declares `sideEffects`, webpack can now drop the ones a given
// route does not use. Before this split every route downloaded all 63.
// See scripts/i18n-split.mjs for the measurement; both halves are required.
export * from "./marketing-i18n/beta";
export * from "./marketing-i18n/chrome";
export * from "./marketing-i18n/devotional";
export * from "./marketing-i18n/dosham-index";
export * from "./marketing-i18n/dosham-kala-sarpa";
export * from "./marketing-i18n/dosham-kalathra";
export * from "./marketing-i18n/dosham-naga";
export * from "./marketing-i18n/dosham-pithru";
export * from "./marketing-i18n/dosham-sevvai";
export * from "./marketing-i18n/family-page";
export * from "./marketing-i18n/feat-chart";
export * from "./marketing-i18n/feat-daily";
export * from "./marketing-i18n/feat-family";
export * from "./marketing-i18n/feat-timing";
export * from "./marketing-i18n/home";
export * from "./marketing-i18n/learn-birth-time";
export * from "./marketing-i18n/learn-chandrashtama";
export * from "./marketing-i18n/learn-jadhagam";
export * from "./marketing-i18n/learn-porutham";
export * from "./marketing-i18n/learn-thirukanitham";
export * from "./marketing-i18n/learn-vedic-western";
export * from "./marketing-i18n/legal";
export * from "./marketing-i18n/natchathiram-detail";
export * from "./marketing-i18n/natchathiram-index";
export * from "./marketing-i18n/natchathiram-visual";
export * from "./marketing-i18n/pariharam-ayul";
export * from "./marketing-i18n/pariharam-index";
export * from "./marketing-i18n/pariharam-kadan";
export * from "./marketing-i18n/pariharam-marriage";
export * from "./marketing-i18n/pariharam-naga";
export * from "./marketing-i18n/pariharam-puthra";
export * from "./marketing-i18n/pariharam-rahu-ketu";
export * from "./marketing-i18n/pariharam-sevvai";
export * from "./marketing-i18n/temple-arupadai-veedu";
export * from "./marketing-i18n/temple-index";
export * from "./marketing-i18n/temple-pancha-bhoota";
export * from "./marketing-i18n/temple-thirumananjeri";
export * from "./marketing-i18n/temple-thirunallar";
export * from "./marketing-i18n/tool-btr";
export * from "./marketing-i18n/tool-jadhagam";
export * from "./marketing-i18n/tool-numerology";
export * from "./marketing-i18n/tool-panchangam";
export * from "./marketing-i18n/tool-porutham";
export * from "./marketing-i18n/trust-about";
export * from "./marketing-i18n/trust-methodology";
export * from "./marketing-i18n/yogam-index";
