import { cookies, headers } from "next/headers";
import { LANG_COOKIE_NAME, resolveLang, type Lang } from "./i18n";
import { LANG_HEADER } from "./ta-routes";

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
 * **A Tamil URL outranks the cookie** (GRW-06): `/ta/...` is Tamil whatever the
 * cookie says, and the English URL of a Tamil-ready page redirects a Tamil
 * cookie to `/ta/...` in the middleware, so the two never disagree.
 *
 * Note this does not make a route dynamic that was static before — the root
 * layout already awaits `cookies()` for `<html lang>`, so 46 of 52 route rows
 * were already `ƒ` Dynamic before F7.
 */
export async function getServerLang(): Promise<Lang> {
  // GRW-06 — a Tamil URL (`/ta/...`) outranks the cookie. The middleware sets
  // `x-lang` from the path and clears any the client sent, so this header is
  // only ever present when the URL itself asked for Tamil. A crawler sends no
  // cookie; the URL is how it reaches the Tamil page.
  const fromUrl = (await headers()).get(LANG_HEADER);
  if (fromUrl === "ta") return "ta";
  const store = await cookies();
  return resolveLang(store.get(LANG_COOKIE_NAME)?.value);
}
