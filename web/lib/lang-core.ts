/**
 * The language primitives with no dependencies, so the edge middleware can use
 * them without pulling in `lib/i18n`'s string tables. `lib/i18n` re-exports
 * everything here; import from there everywhere else.
 */
export type Lang = "ta" | "en";

export const LANG_STORAGE_KEY = "jothidam-lang";
export const LANG_COOKIE_NAME = "jothidam-lang";

// F7 — one coercion rule for "is this stored value a language?". Before this
// there were two, and they disagreed on shape: the root layout wrote
// `v === "ta" ? "ta" : "en"` (only Tamil recognised, English the sink) while
// LangProvider wrote `v === "ta" || v === "en" ? v : initialLang` (a different
// fallback). Both are correct for their own call site and neither is reusable,
// which is how a language ends up resolved differently depending on who asks.
export function resolveLang(value: string | null | undefined, fallback: Lang = "en"): Lang {
  return value === "ta" || value === "en" ? value : fallback;
}
