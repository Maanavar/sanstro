/**
 * Where to send someone after they sign in.
 *
 * The middleware turns a signed-out hit on a protected URL into
 * `/login?next=<that URL>`; `/login` reads the param back and lands there
 * instead of on the bare dashboard. That round trip is the only reason a
 * shared link to `/dashboard/tools/porutham`, or a "change your notification
 * time" link, survives the sign-in wall.
 *
 * Pure and edge-safe — the middleware imports it, so no `next/*` imports and
 * no Node APIs here.
 */

/** The query param carrying the post-sign-in destination. */
export const NEXT_PARAM = "next";

/** The prefixes a `?next=` may name. Everything the middleware guards, and
 *  nothing else: `/login?next=/` is pointless and `?next=/api/...` would hand
 *  an attacker a way to bounce someone into a machine path. */
const ALLOWED_PREFIXES = ["/dashboard", "/admin"] as const;

/** Where sign-in lands when the URL asks for nothing. */
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

/**
 * Validates a `?next=` value into a path we are willing to navigate to, or
 * null.
 *
 * Refused, and why — each of these is a real open-redirect shape, not a
 * hypothetical:
 * - anything not starting with `/`: an absolute `https://evil.example` URL.
 * - `//host/path`: protocol-relative, which browsers resolve off-origin even
 *   though it starts with a slash.
 * - `/\evil.example` and any backslash: some parsers fold `\` to `/`, so a
 *   leading `/\` is protocol-relative again.
 * - a path outside `ALLOWED_PREFIXES`, so the param cannot be used to point
 *   sign-in at an arbitrary page of ours either.
 *
 * Control characters are stripped first, because a `%0A` or a tab inside the
 * scheme is the classic way to smuggle `java\nscript:` past a prefix check.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, "");
  if (!cleaned.startsWith("/")) return null;
  if (cleaned.startsWith("//")) return null;
  if (cleaned.includes("\\")) return null;
  const path = cleaned.split(/[?#]/)[0] ?? "";
  const allowed = ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  return allowed ? cleaned : null;
}

/** Appends a destination to a sign-in URL, skipping the default (a
 *  `?next=/dashboard` on every CTA is noise in the address bar). */
export function withNextPath(loginPath: string, next: string | null | undefined): string {
  const safe = safeNextPath(next);
  if (!safe || safe === DEFAULT_SIGNED_IN_PATH) return loginPath;
  const join = loginPath.includes("?") ? "&" : "?";
  return `${loginPath}${join}${NEXT_PARAM}=${encodeURIComponent(safe)}`;
}
