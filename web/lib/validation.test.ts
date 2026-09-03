import { describe, expect, it } from "vitest";

import { parseCoordinate, parseLatitude, parseLongitude } from "./validation";

describe("parseCoordinate (DASH-03)", () => {
  it("accepts 0 — the equator/prime meridian are valid places", () => {
    expect(parseLatitude("0")).toBe(0);
    expect(parseLongitude("0")).toBe(0);
    expect(parseLatitude("0.0")).toBe(0);
  });

  it("accepts ordinary coordinates", () => {
    expect(parseLatitude("13.0827")).toBeCloseTo(13.0827);
    expect(parseLongitude("-79.38")).toBeCloseTo(-79.38);
  });

  it("rejects empty and non-numeric input", () => {
    expect(parseLatitude("")).toBeNull();
    expect(parseLatitude("   ")).toBeNull();
    expect(parseLatitude("abc")).toBeNull();
    expect(parseLongitude("abc")).toBeNull();
  });

  it("rejects out-of-range values", () => {
    expect(parseLatitude("91")).toBeNull();
    expect(parseLatitude("-90.5")).toBeNull();
    expect(parseLongitude("181")).toBeNull();
    expect(parseCoordinate("100", 90)).toBeNull();
  });

  it("accepts the exact bounds", () => {
    expect(parseLatitude("90")).toBe(90);
    expect(parseLatitude("-90")).toBe(-90);
    expect(parseLongitude("180")).toBe(180);
  });
});
