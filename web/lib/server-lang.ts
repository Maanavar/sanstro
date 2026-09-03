import { cookies } from "next/headers";
import { LANG_COOKIE_NAME, resolveLang, type Lang } from "./i18n";

/**
 * The active language, resolved on the server from the request cookie.
 *
 * F7 part two — the language of a page is a request-scoped fact, not component
 * state. Reading it here is what lets a marketing page be a Server Component:
 * `useLang()` is a context hook, so every page that called it had to be
 * `"use client"` even when it used no other hook, and that shipped both
 * languages' copy plus the page's own JSX to the browser.
 *
 * **The cookie is authoritative.** `LangProvider` also keeps a localStorage
 * copy under the same key, and localStorage does not expire while the cookie
 * does (max-age 1y), so the two can drift apart on a visitor who returns after
 * a long gap or clears cookies only. When they disagree the provider writes the
 * cookie back and calls `router.refresh()` — see `components/lang-toggle.tsx`.
 * Nothing else may resolve the language on the server: use this helper, so
 * there is one answer per request.
 *
 * Note this does not make a route dynamic that was static before — the root
 * layout already awaits `cookies()` for `<html lang>`, so 46 of 52 route rows
 * were already `ƒ` Dynamic before F7.
 */
export async function getServerLang(): Promise<Lang> {
  const store = await cookies();
  return resolveLang(store.get(LANG_COOKIE_NAME)?.value);
}
