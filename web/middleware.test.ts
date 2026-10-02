import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

/**
 * GRW-06 — the URL is the language. The rewrite and its request headers are the
 * only thing that lets a crawler with no cookie reach the Tamil page, and the
 * redirect is the only thing that keeps an English URL English.
 *
 * The request headers a rewrite/next carries are readable on the response as
 * `x-middleware-request-<name>` — that is how Next hands them to the page.
 */

function req(pathname: string, init: { cookie?: string; headers?: Record<string, string> } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set("cookie", init.cookie);
  return new NextRequest(`https://vinaadi.com${pathname}`, { headers });
}

const requestHeader = (res: Response, name: string) => res.headers.get(`x-middleware-request-${name}`);
const rewriteTarget = (res: Response) => res.headers.get("x-middleware-rewrite");

describe("middleware — Tamil URLs", () => {
  it("rewrites /ta/<ready page> to the bare page and says the language is Tamil", async () => {
    const res = await middleware(req("/ta/tamil-calendar"));
    expect(rewriteTarget(res)).toBe("https://vinaadi.com/tamil-calendar");
    expect(requestHeader(res, "x-lang")).toBe("ta");
    expect(requestHeader(res, "x-pathname")).toBe("/tamil-calendar");
  });

  it("needs no cookie — a crawler sends none", async () => {
    const res = await middleware(req("/ta/natchathiram/ashwini"));
    expect(requestHeader(res, "x-lang")).toBe("ta");
  });

  it("keeps the query string on the rewrite", async () => {
    const res = await middleware(req("/ta/tamil-calendar?year=2027"));
    expect(rewriteTarget(res)).toBe("https://vinaadi.com/tamil-calendar?year=2027");
  });

  it("wins over an English cookie", async () => {
    const res = await middleware(req("/ta/tamil-calendar", { cookie: "jothidam-lang=en" }));
    expect(requestHeader(res, "x-lang")).toBe("ta");
  });

  it("redirects /ta/<page with no Tamil twin> to the English page rather than index an English body as Tamil", async () => {
    const res = await middleware(req("/ta/share/panchangam"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://vinaadi.com/share/panchangam");
  });

  it("does not let /ta reach the dashboard", async () => {
    const res = await middleware(req("/ta/dashboard"));
    expect(res.headers.get("location")).toBe("https://vinaadi.com/dashboard");
  });

  it("still sets the CSP on a rewritten response", async () => {
    const res = await middleware(req("/ta/tamil-calendar"));
    expect(res.headers.get("Content-Security-Policy")).toBeTruthy();
    expect(requestHeader(res, "x-nonce")).toBeTruthy();
  });
});

describe("middleware — English URLs", () => {
  it("serves an English URL as-is with no cookie", async () => {
    const res = await middleware(req("/tamil-calendar"));
    expect(res.status).toBe(200);
    expect(rewriteTarget(res)).toBeNull();
    expect(requestHeader(res, "x-lang")).toBeNull();
    expect(requestHeader(res, "x-pathname")).toBe("/tamil-calendar");
  });

  it("sends a Tamil-cookie visitor on a Tamil-ready English URL to /ta/", async () => {
    const res = await middleware(req("/tamil-calendar?year=2027", { cookie: "jothidam-lang=ta" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://vinaadi.com/ta/tamil-calendar?year=2027");
  });

  it("leaves a Tamil-cookie visitor alone on pages with no Tamil twin, and on the app", async () => {
    for (const p of ["/share/panchangam", "/login"]) {
      const res = await middleware(req(p, { cookie: "jothidam-lang=ta" }));
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("sends a Tamil-cookie visitor on the homepage to /ta", async () => {
    const res = await middleware(req("/", { cookie: "jothidam-lang=ta" }));
    expect(res.headers.get("location")).toBe("https://vinaadi.com/ta");
  });

  it("serves /ta as the Tamil homepage", async () => {
    const res = await middleware(req("/ta"));
    expect(rewriteTarget(res)).toBe("https://vinaadi.com/");
    expect(requestHeader(res, "x-lang")).toBe("ta");
  });

  it("does not trust an x-lang the client sent", async () => {
    const res = await middleware(req("/tamil-calendar", { headers: { "x-lang": "ta" } }));
    expect(requestHeader(res, "x-lang")).toBeNull();
  });
});
