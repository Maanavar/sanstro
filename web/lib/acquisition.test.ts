import { describe, expect, it } from "vitest";
import { firstTouchChannel, firstTouchFrom } from "./acquisition";

const loc = (search: string, pathname = "/tools/marriage-porutham-calculator", host = "vinaadi.com") => ({
  search,
  pathname,
  host,
});

describe("firstTouchFrom", () => {
  it("records utm tags, a ref code, the landing path and the referring host", () => {
    expect(
      firstTouchFrom(loc("?utm_source=instagram&utm_medium=reel&utm_campaign=porutham-oct&ref=ab23cd45"), "https://l.instagram.com/x?y=z"),
    ).toEqual({ s: "instagram", m: "reel", c: "porutham-oct", r: "ab23cd45", h: "l.instagram.com", p: "/tools/marriage-porutham-calculator" });
  });

  it("keeps only the referrer's host — never its path or query", () => {
    const t = firstTouchFrom(loc(""), "https://www.google.com/search?q=porutham+calculator");
    expect(t.h).toBe("www.google.com");
    expect(JSON.stringify(t)).not.toContain("porutham+calculator");
  });

  it("does not count the site itself as a referrer", () => {
    expect(firstTouchFrom(loc(""), "https://vinaadi.com/learn/what-is-porutham").h).toBeUndefined();
  });

  it("drops the landing page's query string", () => {
    expect(firstTouchFrom(loc("?date=2026-10-01", "/panchangam/today"), "").p).toBe("/panchangam/today");
  });

  it("omits what is not there instead of recording empty strings", () => {
    expect(firstTouchFrom(loc("", "/"), "")).toEqual({ p: "/" });
  });
});

describe("firstTouchChannel — same buckets as the admin report", () => {
  it("prefers a tagged source, then a referral, then the referring site", () => {
    expect(firstTouchChannel({ s: "Instagram", r: "ab23cd45" })).toBe("instagram");
    expect(firstTouchChannel({ r: "ab23cd45", h: "wa.me" })).toBe("referral");
    expect(firstTouchChannel({ h: "www.google.com" })).toBe("google.com");
  });

  it("calls an unattributed visit 'unknown', not 'direct'", () => {
    expect(firstTouchChannel(null)).toBe("unknown");
    expect(firstTouchChannel({ p: "/" })).toBe("unknown");
  });
});
