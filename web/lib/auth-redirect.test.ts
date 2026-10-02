import { describe, expect, it } from "vitest";

import { DEFAULT_SIGNED_IN_PATH, safeNextPath, withNextPath } from "./auth-redirect";

describe("safeNextPath", () => {
  it("keeps a real dashboard destination, query and hash included", () => {
    expect(safeNextPath("/dashboard/tools/porutham")).toBe("/dashboard/tools/porutham");
    expect(safeNextPath("/dashboard/settings/notifications")).toBe("/dashboard/settings/notifications");
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/dashboard/calendar?d=2026-10-01")).toBe("/dashboard/calendar?d=2026-10-01");
    expect(safeNextPath("/admin")).toBe("/admin");
  });

  it("refuses every open-redirect shape", () => {
    expect(safeNextPath("https://evil.example/dashboard")).toBeNull();
    expect(safeNextPath("//evil.example/dashboard")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("/dashboard\\@evil.example")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
    // A control character inside the scheme is how `java\nscript:` gets past a
    // naive prefix check, so it is stripped before anything else is decided.
    expect(safeNextPath("java\nscript:alert(1)")).toBeNull();
  });

  it("refuses a path outside the guarded prefixes", () => {
    // `/dashboardish` must not pass on the strength of a shared prefix.
    expect(safeNextPath("/dashboardish")).toBeNull();
    expect(safeNextPath("/login")).toBeNull();
    expect(safeNextPath("/api/v1/auth/me")).toBeNull();
    expect(safeNextPath("/")).toBeNull();
  });

  it("refuses absent and non-string values", () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath("")).toBeNull();
  });
});

describe("withNextPath", () => {
  it("appends an encoded destination", () => {
    expect(withNextPath("/login", "/dashboard/tools/porutham"))
      .toBe("/login?next=%2Fdashboard%2Ftools%2Fporutham");
    expect(withNextPath("/login?mode=signup", "/dashboard/calendar"))
      .toBe("/login?mode=signup&next=%2Fdashboard%2Fcalendar");
  });

  it("leaves the URL alone when the destination is the default or unsafe", () => {
    expect(withNextPath("/login", DEFAULT_SIGNED_IN_PATH)).toBe("/login");
    expect(withNextPath("/login", "https://evil.example")).toBe("/login");
    expect(withNextPath("/login", null)).toBe("/login");
  });
});
