import { describe, expect, it } from "vitest";
import { counterpartPath, isTaReady, localizePath, splitLangPrefix } from "./ta-routes";

describe("isTaReady", () => {
  it("matches exact and single-segment wildcard routes", () => {
    expect(isTaReady("/tools/indraiya-rasipalan")).toBe(true);
    expect(isTaReady("/natchathiram/ashwini")).toBe(true);
    expect(isTaReady("/natchathiram/ashwini/visual")).toBe(true);
    expect(isTaReady("/muhurtham-naal/2027")).toBe(true);
  });

  it("does not let a wildcard swallow deeper paths", () => {
    expect(isTaReady("/natchathiram/ashwini/visual/extra")).toBe(false);
    expect(isTaReady("/tamil-calendar/a/b")).toBe(false);
  });

  it("ignores query, hash and trailing slash", () => {
    expect(isTaReady("/tamil-calendar/?x=1")).toBe(true);
    expect(isTaReady("/tamil-calendar#top")).toBe(true);
  });

  it("never localises app surfaces or the prefix itself", () => {
    for (const p of ["/dashboard", "/dashboard/today", "/login", "/admin", "/api/v1/x", "/ta/tamil-calendar"]) {
      expect(isTaReady(p)).toBe(false);
    }
  });

  it("leaves pages that are not Tamil-ready alone", () => {
    expect(isTaReady("/pricing")).toBe(false);
    expect(isTaReady("/privacy")).toBe(false);
  });
});

describe("splitLangPrefix", () => {
  it("reads the language off the prefix", () => {
    expect(splitLangPrefix("/ta")).toEqual({ lang: "ta", path: "/" });
    expect(splitLangPrefix("/ta/tamil-calendar")).toEqual({ lang: "ta", path: "/tamil-calendar" });
  });

  it("does not mistake a path that merely starts with 'ta'", () => {
    expect(splitLangPrefix("/tamil-calendar")).toEqual({ lang: null, path: "/tamil-calendar" });
    expect(splitLangPrefix("/tag")).toEqual({ lang: null, path: "/tag" });
  });
});

describe("localizePath", () => {
  it("prefixes a Tamil-ready path in Tamil and keeps query and hash", () => {
    expect(localizePath("/tamil-calendar", "ta")).toBe("/ta/tamil-calendar");
    expect(localizePath("/tamil-calendar?year=2027#top", "ta")).toBe("/ta/tamil-calendar?year=2027#top");
  });

  it("returns English hrefs, non-ready paths, externals and anchors untouched", () => {
    expect(localizePath("/tamil-calendar", "en")).toBe("/tamil-calendar");
    expect(localizePath("/pricing", "ta")).toBe("/pricing");
    expect(localizePath("/dashboard", "ta")).toBe("/dashboard");
    expect(localizePath("https://example.com/tamil-calendar", "ta")).toBe("https://example.com/tamil-calendar");
    expect(localizePath("//example.com/tamil-calendar", "ta")).toBe("//example.com/tamil-calendar");
    expect(localizePath("#top", "ta")).toBe("#top");
  });

  it("maps the homepage to /ta, not /ta/", () => {
    expect(localizePath("/", "ta")).toBe("/ta");
    expect(localizePath("/?ref=x", "ta")).toBe("/ta?ref=x");
    expect(counterpartPath("/", "ta")).toBe("/ta");
    expect(counterpartPath("/ta", "en")).toBe("/");
  });
});

describe("counterpartPath", () => {
  it("maps between the two languages", () => {
    expect(counterpartPath("/tamil-calendar", "ta")).toBe("/ta/tamil-calendar");
    expect(counterpartPath("/ta/tamil-calendar", "en")).toBe("/tamil-calendar");
  });

  it("is null when the page has no twin", () => {
    expect(counterpartPath("/pricing", "ta")).toBeNull();
    expect(counterpartPath("/ta/pricing", "en")).toBeNull();
  });
});
