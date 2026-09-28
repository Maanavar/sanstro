/**
 * Tamil at its own URLs (GRW-06).
 *
 * A page that is Tamil-ready is reachable at `/ta/<path>` as well as `<path>`.
 * The prefix is the language: the middleware rewrites `/ta/x` to `/x` and states
 * the language on the request, so a crawler that sends no cookie still gets the
 * Tamil page (see `middleware.ts` and `lib/server-lang.ts`).
 *
 * Pure and edge-safe on purpose: the middleware imports it, so no `next/*`
 * imports and no Node APIs here.
 */
import { SITE_URL } from "@vinaadi/shared/constants";
import type { Lang } from "./lang-core";

export const TA_PREFIX = "/ta";

/** Request header the middleware sets: the language the URL asked for. */
export const LANG_HEADER = "x-lang";
/** Request header the middleware sets: the path with any `/ta` prefix removed. */
export const PATHNAME_HEADER = "x-pathname";

/**
 * Routes whose body renders in Tamil, and so may be indexed at `/ta/...`.
 *
 * `*` matches exactly one segment. A route belongs here only when its Tamil
 * body has been read on a real render, not when it merely imports `useLang` —
 * `scripts/ta-route-audit.mjs` measures the Tamil-script share of each page's
 * text. An English body under a Tamil URL would be indexed as Tamil, which is
 * worse than no Tamil URL at all.
 */
export const TA_READY_ROUTES: readonly string[] = [
  "/",
  "/beta",
  "/family",
  "/features/*",
  "/learn/*",
  "/dosham",
  "/dosham/*",
  "/yogam",
  "/yogam/*",
  "/pariharam",
  "/pariharam/*",
  "/temples",
  "/temples/*",
  "/trust/methodology",
  "/trust/about-vinaadi",
  "/pricing",
  "/privacy",
  "/terms",
  "/tools/baby-name-finder",
  "/tools/birth-time-rectification",
  "/tools/chandrashtama",
  "/tools/daily-panchangam-planner",
  "/tools/friendship-compatibility",
  "/tools/jadhagam-generator",
  "/tools/muhurta-calculator",
  "/tools/numerology-calculator",
  "/tools/indraiya-rasipalan",
  "/tools/marriage-porutham-calculator",
  "/muhurtham-naal",
  "/panchangam/*",
  "/muhurtham-naal/*",
  "/natchathiram",
  "/natchathiram/*",
  "/natchathiram/*/visual",
  "/tamil-calendar",
  "/tamil-calendar/*",
];

/** Never localised, whatever the registry says: app surfaces and machine paths. */
const NEVER_LOCALISED = ["/dashboard", "/admin", "/login", "/api", "/_next", TA_PREFIX];

function matchesPattern(pathname: string, pattern: string): boolean {
  const path = pathname.split("/").filter(Boolean);
  const pat = pattern.split("/").filter(Boolean);
  return path.length === pat.length && pat.every((seg, i) => seg === "*" || seg === path[i]);
}

/** Drop a query string / hash and a trailing slash, keep the leading one. */
function cleanPath(input: string): string {
  const bare = input.split(/[?#]/)[0] ?? "";
  const trimmed = bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
  return trimmed || "/";
}

/** The Tamil twin's address for an absolute site URL (`https://vinaadi.com/x` -> `.../ta/x`). */
export function taUrl(url: string): string {
  if (!url.startsWith(SITE_URL)) return url;
  const path = url.slice(SITE_URL.length);
  return `${SITE_URL}${TA_PREFIX}${path === "/" ? "" : path}`;
}

/** True when `pathname` (unprefixed) has a Tamil twin. */
export function isTaReady(pathname: string): boolean {
  const path = cleanPath(pathname);
  if (NEVER_LOCALISED.some((p) => path === p || path.startsWith(`${p}/`))) return false;
  return TA_READY_ROUTES.some((pattern) => matchesPattern(path, pattern));
}

/** Split a request path into the language its prefix asks for and the bare path. */
export function splitLangPrefix(pathname: string): { lang: Lang | null; path: string } {
  if (pathname === TA_PREFIX) return { lang: "ta", path: "/" };
  if (pathname.startsWith(`${TA_PREFIX}/`)) return { lang: "ta", path: pathname.slice(TA_PREFIX.length) };
  return { lang: null, path: pathname };
}

/**
 * The URL for `href` in `lang`. Only a Tamil-ready internal path gets the
 * prefix; anything else (external, anchor, dashboard, English) comes back
 * untouched. Query string and hash are preserved.
 */
export function localizePath(href: string, lang: Lang): string {
  if (lang !== "ta" || !href.startsWith("/") || href.startsWith("//")) return href;
  const tail = href.slice((href.split(/[?#]/)[0] ?? "").length);
  const path = cleanPath(href);
  if (!isTaReady(path)) return href;
  return `${TA_PREFIX}${path === "/" ? "" : path}${tail}`;
}

/** The same page in the other language, or null when it has no twin. */
export function counterpartPath(pathname: string, target: Lang): string | null {
  const { path } = splitLangPrefix(pathname);
  if (!isTaReady(path)) return null;
  return target === "ta" ? `${TA_PREFIX}${path === "/" ? "" : path}` : path;
}
