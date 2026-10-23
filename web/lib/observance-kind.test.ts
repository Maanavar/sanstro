import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { observanceKindFor } from "./observance-kind";

describe("observanceKindFor", () => {
  it.each([
    ["Sankatahara Chathurthi", "chathurthi"],
    ["Vinayagar Chaturthi", "chathurthi"],
    ["Sashti Viratham", "sashti"],
    ["Ekadasi", "ekadashi"],
    ["Vaikunta Ekadashi", "ekadashi"],
    ["Pradhosam", "pradosham"], // the backend's own spelling (festivals.py)
    ["Pournami", "pournami"],
    ["Thai Amavasai", "amavasai"],
  ] as const)("%s → %s", (name, kind) => {
    expect(observanceKindFor(name)).toBe(kind);
  });

  it("returns null for a festival without its own emblem", () => {
    expect(observanceKindFor("Pongal")).toBeNull();
  });
});

describe("monthly calendar draws emblems, not pictures or emoji", () => {
  // IMG-02/04: the grid mixed 40 px white-boxed PNGs with OS emoji, and the
  // legend declared icons it never drew. Pin the replacement in place.
  const src = readFileSync(join(__dirname, "..", "components", "dashboard-calendar-monthly-nova.tsx"), "utf8");
  it("references no /calendar/*.png icon", () => {
    expect(src).not.toMatch(/\/calendar\/[\w-]+\.(png|jpe?g)/);
  });
  it("renders the legend's emblem", () => {
    expect(src).toMatch(/<ObservanceGlyph kind=\{item\.kind\}/);
  });
});
