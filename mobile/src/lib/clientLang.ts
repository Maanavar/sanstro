import type { Lang } from "@vinaadi/shared";

/**
 * A module-scope mirror of the chosen language, for code that is not a
 * component.
 *
 * `useLanguage()` is a hook and `AsyncStorage` is async, so the API client —
 * plain functions called from anywhere — can read neither when it builds a
 * request's headers. `LanguageProvider` is the single writer and keeps this in
 * step with its own state; everything else reads.
 *
 * The default matches the provider's own initial state ("ta"), so a request
 * sent before the stored value has loaded reports the language the UI is
 * actually showing rather than guessing English.
 */
let _lang: Lang = "ta";

export function setCurrentLang(lang: Lang): void {
  _lang = lang;
}

export function currentLang(): Lang {
  return _lang;
}
