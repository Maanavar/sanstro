/**
 * Response security headers and the Content-Security-Policy for the web app.
 *
 * P1-5. The backend has had a full header set since Sprint 10
 * (`app/middleware.py`), but that only ever covered JSON API responses. The
 * Next app — the origin that actually holds the session cookie, renders the
 * admin console and displays a user's journal — sent no CSP, no
 * `X-Frame-Options`, no `Referrer-Policy` and no HSTS at all. The single
 * `frame-ancestors *` rule in `next.config.mjs` was for the embeddable widget
 * and applied to nothing else.
 *
 * ## Why a nonce, and why that turned out to be affordable
 *
 * `script-src 'unsafe-inline'` is a CSP that does not stop script injection,
 * which is most of what a CSP is for. The usual reason to settle for it in an
 * App Router codebase is that reading the nonce needs `headers()`, and that opts
 * the route out of static rendering. That cost is already paid here: the root
 * layout awaits `cookies()` for `<html lang>`, so 46 of 52 routes were already
 * dynamic before this change (see `lib/server-lang.ts`).
 *
 * The other reason to expect pain is inline scripts, and the codebase has
 * exactly **one** executable one — the pre-paint theme resolver in
 * `app/layout.tsx`. The other 119 `dangerouslySetInnerHTML` sites are all
 * `type="application/ld+json"`, which browsers never execute and CSP therefore
 * never blocks. Next injects the nonce into its own bootstrap and chunk tags on
 * its own, provided the CSP is visible on the *request* headers — which is why
 * `middleware.ts` sets it in both directions.
 *
 * ## What this deliberately does not lock down
 *
 * `style-src` keeps `'unsafe-inline'`. framer-motion animates by writing inline
 * styles on every frame, and Next emits inline `<style>` for `next/font`.
 * Nonced styles would break both. Inline style injection is a far weaker
 * primitive than script execution, so this is the honest trade rather than a
 * CSP that looks strict and is switched off two days later.
 */

export type SecurityHeaderOptions = {
  /** Per-request nonce, base64. Must be unique per response — see `createNonce`. */
  nonce: string;
  /** Production tightens the policy and adds `upgrade-insecure-requests`. */
  isProduction: boolean;
  /** HTTPS request. HSTS on a plaintext origin is ignored by browsers anyway,
   *  and asserting it there only misleads whoever reads the response. */
  isSecure: boolean;
  /** `/widget/*` — embedded in third-party iframes, so it must stay framable. */
  embeddable: boolean;
  /** PostHog ingest origin, or null when analytics is not configured. */
  analyticsOrigin: string | null;
};

/** `/widget/*` pages are the one surface meant to be framed by anyone. */
export function isEmbeddablePath(pathname: string): boolean {
  return pathname === "/widget" || pathname.startsWith("/widget/");
}

/**
 * The PostHog ingest origin to allow in `connect-src`, or null.
 *
 * Keyed off the *key*, not the host: `lib/analytics.ts` no-ops entirely without
 * `NEXT_PUBLIC_POSTHOG_KEY`, so with no key there is no traffic to allow and
 * widening the policy would buy nothing. Only the origin is taken from the host
 * URL — CSP matches origins, and carrying a path would silently never match.
 */
export function analyticsOrigin(env: Record<string, string | undefined>): string | null {
  if (!env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  const raw = env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(options: SecurityHeaderOptions): string {
  const { nonce, isProduction, embeddable, analyticsOrigin } = options;

  // 'strict-dynamic' lets the nonced bootstrap load Next's chunks without
  // naming every one of them, and makes the host-source fallbacks below
  // inert in browsers that support it. 'self' stays for the browsers that
  // do not, where it is the whole policy.
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // webpack's dev runtime and React Fast Refresh evaluate code at runtime.
    // Never in production, where it would undo the point of the nonce.
    ...(isProduction ? [] : ["'unsafe-eval'"]),
  ];

  const connectSrc = [
    "'self'",
    ...(analyticsOrigin ? [analyticsOrigin] : []),
    // HMR websocket. Dev only.
    ...(isProduction ? [] : ["ws:", "wss:"]),
  ];

  const directives: Array<[string, string[]] | [string]> = [
    ["default-src", ["'self'"]],
    ["script-src", scriptSrc],
    // See the module docstring: framer-motion and next/font both need this.
    ["style-src", ["'self'", "'unsafe-inline'"]],
    // blob: covers the client-generated PDF/PNG downloads in the dashboard.
    ["img-src", ["'self'", "data:", "blob:"]],
    // next/font/google self-hosts the font files at build time; nothing is
    // fetched from fonts.gstatic.com at runtime.
    ["font-src", ["'self'"]],
    ["connect-src", connectSrc],
    ["worker-src", ["'self'", "blob:"]],
    ["manifest-src", ["'self'"]],
    ["media-src", ["'self'"]],
    // The three that block the quiet half of injection: rewriting relative URLs,
    // retargeting a form post, and reviving <object>/<embed>.
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["object-src", ["'none'"]],
    ["frame-ancestors", [embeddable ? "*" : "'none'"]],
  ];

  if (isProduction) {
    directives.push(["upgrade-insecure-requests"]);
  }

  return directives
    .map(([name, values]) => (values ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

export function buildSecurityHeaders(options: SecurityHeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Security-Policy": buildContentSecurityPolicy(options),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // geolocation is (self) because the panchangam planner asks for the
    // visitor's position. Everything else the app never uses is denied, so a
    // future dependency cannot quietly start using it.
    "Permissions-Policy": "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
    // Google SSO here is a redirect flow, not a popup, so isolating the browsing
    // context costs nothing. COOP is ignored inside an iframe, so the widget is
    // unaffected either way.
    "Cross-Origin-Opener-Policy": "same-origin",
  };

  // X-Frame-Options cannot express "any origin", so setting it at all would
  // block the widget that frame-ancestors is deliberately opening up. It is
  // only a fallback for browsers predating frame-ancestors; those browsers get
  // the same answer everywhere else.
  if (!options.embeddable) {
    headers["X-Frame-Options"] = "DENY";
  }

  if (options.isSecure) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }

  return headers;
}

/** 128 bits of randomness, base64. Web Crypto — the Edge runtime has no Node `crypto`. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
