import { describe, expect, it } from "vitest";

import {
  analyticsOrigin,
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  createNonce,
  isEmbeddablePath,
  type SecurityHeaderOptions,
} from "./security-headers";

const base: SecurityHeaderOptions = {
  nonce: "TEST_NONCE",
  isProduction: true,
  isSecure: true,
  embeddable: false,
  analyticsOrigin: null,
};

/** Pull one directive out of a policy string, as a list of sources. */
function directive(csp: string, name: string): string[] | null {
  const found = csp
    .split(";")
    .map((part) => part.trim())
    .find((part) => part === name || part.startsWith(`${name} `));
  if (found === undefined) return null;
  return found.slice(name.length).trim().split(/\s+/).filter(Boolean);
}

describe("content security policy", () => {
  it("nonces scripts and never allows inline script in production", () => {
    const csp = buildContentSecurityPolicy(base);

    expect(directive(csp, "script-src")).toContain("'nonce-TEST_NONCE'");
    expect(directive(csp, "script-src")).not.toContain("'unsafe-inline'");
    expect(directive(csp, "script-src")).not.toContain("'unsafe-eval'");
  });

  it("carries strict-dynamic so Next's own chunk tags load", () => {
    // Next stamps the nonce onto its bootstrap script; strict-dynamic is what
    // then lets that script pull in the chunks without naming each one.
    expect(directive(buildContentSecurityPolicy(base), "script-src")).toContain(
      "'strict-dynamic'",
    );
  });

  it("allows unsafe-eval only outside production", () => {
    // webpack's dev runtime and React Fast Refresh need it; shipping it would
    // undo the nonce.
    const dev = directive(buildContentSecurityPolicy({ ...base, isProduction: false }), "script-src");
    expect(dev).toContain("'unsafe-eval'");
  });

  it("blocks the quiet half of injection: base, form target and objects", () => {
    const csp = buildContentSecurityPolicy(base);

    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
  });

  it("keeps unsafe-inline for styles, deliberately", () => {
    // framer-motion writes inline styles per frame and next/font emits an
    // inline <style>. This is the documented trade, not an oversight — pinned
    // so removing it is a decision rather than an accident.
    expect(directive(buildContentSecurityPolicy(base), "style-src")).toContain("'unsafe-inline'");
  });

  it("frames nothing by default and anything on the widget", () => {
    expect(directive(buildContentSecurityPolicy(base), "frame-ancestors")).toEqual(["'none'"]);
    expect(
      directive(buildContentSecurityPolicy({ ...base, embeddable: true }), "frame-ancestors"),
    ).toEqual(["*"]);
  });

  it("only widens connect-src when analytics is actually configured", () => {
    expect(directive(buildContentSecurityPolicy(base), "connect-src")).toEqual(["'self'"]);
    expect(
      directive(
        buildContentSecurityPolicy({ ...base, analyticsOrigin: "https://eu.i.posthog.com" }),
        "connect-src",
      ),
    ).toContain("https://eu.i.posthog.com");
  });

  it("allows blob: images for the client-generated downloads", () => {
    expect(directive(buildContentSecurityPolicy(base), "img-src")).toContain("blob:");
  });
});

describe("security headers", () => {
  it("omits X-Frame-Options on the widget so the embed survives", () => {
    // X-Frame-Options has no "any origin" value, so DENY there would override
    // the frame-ancestors * that makes the widget embeddable at all.
    expect(buildSecurityHeaders({ ...base, embeddable: true })).not.toHaveProperty(
      "X-Frame-Options",
    );
    expect(buildSecurityHeaders(base)["X-Frame-Options"]).toBe("DENY");
  });

  it("asserts HSTS only over https", () => {
    expect(buildSecurityHeaders(base)["Strict-Transport-Security"]).toContain("max-age=31536000");
    expect(buildSecurityHeaders({ ...base, isSecure: false })).not.toHaveProperty(
      "Strict-Transport-Security",
    );
  });

  it("keeps geolocation available to the panchangam planner and denies the rest", () => {
    const policy = buildSecurityHeaders(base)["Permissions-Policy"];

    expect(policy).toContain("geolocation=(self)");
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
  });

  it("sets exactly one CSP header", () => {
    // The widget rule that used to live in next.config.mjs was removed for this
    // reason: two policies on one response are enforced as their intersection.
    const names = Object.keys(buildSecurityHeaders(base)).filter(
      (name) => name.toLowerCase() === "content-security-policy",
    );
    expect(names).toHaveLength(1);
  });
});

describe("analyticsOrigin", () => {
  it("is null without a key, because analytics no-ops without one", () => {
    expect(analyticsOrigin({})).toBeNull();
    expect(analyticsOrigin({ NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com" })).toBeNull();
  });

  it("reduces a configured host to its origin", () => {
    // CSP matches origins; a trailing path would never match and would be a
    // policy that looks configured and silently blocks every request.
    expect(
      analyticsOrigin({ NEXT_PUBLIC_POSTHOG_KEY: "phc_x", NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com/ingest" }),
    ).toBe("https://eu.i.posthog.com");
  });

  it("defaults to the EU host and survives a malformed one", () => {
    expect(analyticsOrigin({ NEXT_PUBLIC_POSTHOG_KEY: "phc_x" })).toBe("https://eu.i.posthog.com");
    expect(
      analyticsOrigin({ NEXT_PUBLIC_POSTHOG_KEY: "phc_x", NEXT_PUBLIC_POSTHOG_HOST: "not a url" }),
    ).toBeNull();
  });
});

describe("isEmbeddablePath", () => {
  it("covers the widget route and nothing that merely looks like it", () => {
    expect(isEmbeddablePath("/widget")).toBe(true);
    expect(isEmbeddablePath("/widget/panchangam")).toBe(true);
    expect(isEmbeddablePath("/widgets")).toBe(false);
    expect(isEmbeddablePath("/dashboard/widget")).toBe(false);
  });
});

describe("createNonce", () => {
  it("is unique per call", () => {
    // A reused nonce is the same as no nonce: an injected script can simply
    // quote the one it can read in the page.
    const nonces = new Set(Array.from({ length: 100 }, () => createNonce()));
    expect(nonces.size).toBe(100);
  });
});
