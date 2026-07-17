/**
 * Regression test for the `/public/` prefix-bypass bug (parity audit 2026-07-17 §2b).
 *
 * `buildApiUrl` used to treat `/public/...` as already-versioned and send it
 * unprefixed, but the backend mounts public_tools only at /api/v1/public/*
 * (app/main.py — no unversioned mount, no redirect). Every shared wrapper with a
 * `/public/...` path therefore 404'd on mobile only; web was unaffected because
 * web/lib/api.ts normalizeApiPath adds the prefix.
 *
 * The mock-based contract tests can't catch this class: they assert the wrapper's
 * own path and never exercise buildApiUrl.
 */

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("@/lib/secureStore", () => ({
  getTokens: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
}));
jest.mock("@/lib/env", () => ({ ENV: { API_BASE_URL: "https://api.test" } }));

import { buildApiUrl } from "@/api/client";

describe("buildApiUrl", () => {
  it("prefixes /public/* paths with /api/v1 (they are not unversioned routes)", () => {
    expect(buildApiUrl("/public/porutham/by-star")).toBe(
      "https://api.test/api/v1/public/porutham/by-star",
    );
    expect(buildApiUrl("/public/muhurtham-naals")).toBe(
      "https://api.test/api/v1/public/muhurtham-naals",
    );
    expect(buildApiUrl("/public/rasi-palan")).toBe(
      "https://api.test/api/v1/public/rasi-palan",
    );
  });

  it("prefixes ordinary relative paths with /api/v1", () => {
    expect(buildApiUrl("/prasna")).toBe("https://api.test/api/v1/prasna");
    expect(buildApiUrl("/charts/abc/muhurta")).toBe(
      "https://api.test/api/v1/charts/abc/muhurta",
    );
  });

  it("leaves already-versioned /api/... paths untouched", () => {
    expect(buildApiUrl("/api/v1/birth-profiles")).toBe(
      "https://api.test/api/v1/birth-profiles",
    );
    expect(buildApiUrl("/api/v1/retrospective")).toBe(
      "https://api.test/api/v1/retrospective",
    );
  });

  it("never produces a doubled or missing version prefix", () => {
    const paths = [
      "/public/porutham/by-star",
      "/prasna",
      "/api/v1/birth-profiles",
    ];
    for (const p of paths) {
      const url = buildApiUrl(p);
      expect(url.startsWith("https://api.test/api/v1/")).toBe(true);
      expect(url).not.toContain("/api/v1/api/v1");
    }
  });
});
