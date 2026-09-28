import { NextResponse, type NextRequest } from "next/server";

import {
  analyticsOrigin,
  buildSecurityHeaders,
  createNonce,
  isEmbeddablePath,
} from "@/lib/security-headers";
import { LANG_COOKIE_NAME } from "@/lib/lang-core";
import { LANG_HEADER, PATHNAME_HEADER, TA_PREFIX, isTaReady, splitLangPrefix } from "@/lib/ta-routes";

const NONCE_HEADER = "x-nonce";
const CSP_HEADER = "Content-Security-Policy";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = createNonce();
  const headers = buildSecurityHeaders({
    nonce,
    isProduction: process.env.NODE_ENV === "production",
    // Behind the TLS ingress the connection Next sees is plaintext; the edge
    // states the real scheme. See docs/PRODUCTION_EDGE.md — the ingress
    // overwrites x-forwarded-proto rather than passing the client's through.
    isSecure:
      request.headers.get("x-forwarded-proto") === "https" ||
      request.nextUrl.protocol === "https:",
    embeddable: isEmbeddablePath(pathname),
    analyticsOrigin: analyticsOrigin(process.env),
  });

  const token = request.cookies.get("vinaadi_token")?.value;
  const protectedPath = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  // Next reads the nonce out of the CSP on the *request* headers to stamp its
  // own bootstrap and chunk <script> tags. Without this half, every Next-emitted
  // script is unnonced and 'strict-dynamic' blocks the entire app.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set(CSP_HEADER, headers[CSP_HEADER]);

  // GRW-06 — the URL is the language. `/ta/x` is the Tamil page at `/x`; both
  // headers are set (or cleared) on every request because they are trusted
  // downstream and a client could otherwise send its own.
  const { lang: urlLang, path: barePath } = splitLangPrefix(pathname);
  requestHeaders.delete(LANG_HEADER);
  requestHeaders.set(PATHNAME_HEADER, barePath);

  let langRedirect: URL | null = null;
  let langRewrite: URL | null = null;
  if (urlLang === "ta") {
    if (isTaReady(barePath)) {
      requestHeaders.set(LANG_HEADER, "ta");
      langRewrite = request.nextUrl.clone();
      langRewrite.pathname = barePath;
    } else {
      // No Tamil twin: an English body under a Tamil URL would be indexed as
      // Tamil, so send the visitor to the page that exists.
      langRedirect = request.nextUrl.clone();
      langRedirect.pathname = barePath;
    }
  } else if (request.cookies.get(LANG_COOKIE_NAME)?.value === "ta" && isTaReady(barePath)) {
    // A returning Tamil reader on an English URL. Crawlers send no cookie, so
    // they always see the English page here; the redirect is for people.
    langRedirect = request.nextUrl.clone();
    langRedirect.pathname = `${TA_PREFIX}${barePath === "/" ? "" : barePath}`;
  }

  const response =
    !token && protectedPath
      ? NextResponse.redirect(new URL("/login", request.url))
      : langRedirect
        ? NextResponse.redirect(langRedirect)
        : langRewrite
          ? NextResponse.rewrite(langRewrite, { request: { headers: requestHeaders } })
          : NextResponse.next({ request: { headers: requestHeaders } });

  // The redirect is a document response too, and gets the same treatment.
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }

  return response;
}

export const config = {
  /**
   * Every document request, which is what the matcher below spells out the long
   * way round. It used to be the three authenticated prefixes, because the only
   * job here was the login redirect; a CSP that covers three routes out of
   * fifty-two is not a CSP.
   *
   * Excluded, and why:
   * - `api/*` — the Next proxy returns the backend's JSON *and its headers*,
   *   the backend already sets its own CSP, and two CSP headers on one response
   *   are enforced as their intersection. Not documents; not our business here.
   * - `_next/static`, `_next/image` — immutable build output and the image
   *   optimiser. No script execution, no framing, and running middleware on
   *   them would put an Edge invocation in front of every asset.
   * - anything with a file extension — public/ assets, sitemap.xml, robots.txt.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.[^/]+$).*)",
  ],
};
