import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

/**
 * How many reverse-proxy hops sit in FRONT OF THIS NEXT SERVER (a CDN, an
 * ingress, a load balancer). 0 means the browser reaches Next directly.
 *
 * This must EQUAL the backend's JOTHIDAM_TRUSTED_PROXY_COUNT. Not "this plus
 * one" — an earlier version of this comment said that, and it was wrong.
 * `trustedForwardedFor` below forwards the rightmost N entries, so the backend
 * receives exactly N and must step back exactly N to reach the address the
 * outermost trusted hop observed. Change one and you must change the other;
 * `app/core/config.py` refuses to boot in production on a mismatch.
 */
const TRUSTED_HOPS_BEFORE_WEB = Number.parseInt(
  process.env.TRUSTED_PROXY_HOPS_BEFORE_WEB ?? "0",
  10,
);

/**
 * Headers a client must never be able to set on the backend's behalf.
 *
 * The proxy used to copy every inbound header verbatim, `x-forwarded-for`
 * included. The backend reads the rightmost entries of that header to decide
 * who a request came from, so the moment JOTHIDAM_TRUSTED_PROXY_COUNT is raised
 * above 0 for a real edge — which is exactly what the production-edge task
 * involves — a caller could name any IP it liked and walk around every IP-keyed
 * rate limit. It was not exploitable at count 0; it was one config change away.
 */
const CLIENT_SPOOFABLE_HEADERS = [
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "x-real-ip",
  "forwarded",
];

/**
 * The forwarded-for value we are willing to vouch for.
 *
 * Only the rightmost `TRUSTED_HOPS_BEFORE_WEB` entries were written by a hop we
 * control; everything to the left of them is whatever the caller typed. With no
 * edge in front of Next (the default) that is nothing at all, and we forward no
 * header rather than an unverifiable one.
 */
function trustedForwardedFor(request: NextRequest): string | null {
  if (TRUSTED_HOPS_BEFORE_WEB <= 0) return null;
  const inbound = request.headers.get("x-forwarded-for");
  if (!inbound) return null;
  const hops = inbound.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (hops.length === 0) return null;
  return hops.slice(-TRUSTED_HOPS_BEFORE_WEB).join(", ");
}

async function proxyRequest(request: NextRequest, method: string, path: string[]) {
  const url = new URL(request.url);
  const target = new URL(`${BACKEND_URL}/${path.join("/")}`);
  target.search = url.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  // Strip first, then re-add only what we can vouch for. Deleting
  // unconditionally is what makes this safe: a client that sends the header
  // gets it dropped whatever the deployment looks like.
  for (const header of CLIENT_SPOOFABLE_HEADERS) {
    headers.delete(header);
  }
  const forwardedFor = trustedForwardedFor(request);
  if (forwardedFor) {
    headers.set("x-forwarded-for", forwardedFor);
  }

  const init: RequestInit = {
    method,
    headers,
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.text();
  }

  let response: Response;
  try {
    response = await fetch(target, init);
  } catch {
    return new NextResponse(JSON.stringify({ detail: "Backend unreachable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  if (response.status === 204) {
    const responseHeaders = new Headers(response.headers);
    return new NextResponse(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers(response.headers);

  // Ensure Tamil/Unicode text is never mis-decoded as Latin-1 by the browser
  const ct = responseHeaders.get("content-type") ?? "";
  if (ct.includes("application/json") && !ct.includes("charset")) {
    responseHeaders.set("content-type", "application/json; charset=utf-8");
  }

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

async function resolvePath(context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return params.path;
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "GET", await resolvePath(context));
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "POST", await resolvePath(context));
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "PUT", await resolvePath(context));
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "PATCH", await resolvePath(context));
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, "DELETE", await resolvePath(context));
}
