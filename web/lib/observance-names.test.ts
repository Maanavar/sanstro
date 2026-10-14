/**
 * Every world observance the backend can send has an English name here.
 *
 * `_WORLD_OBSERVANCES` (app/calculations/festivals.py) carries Tamil-only
 * names. The web maps them to English by that exact name
 * (lib/observance-names.ts), so a name added or re-spelled on the backend
 * would otherwise fall back to the generic "Observance" chip in English mode —
 * silently, and only on that one day a year. This test reads the Python source
 * and fails naming the missing entry instead (E-3, 2026-09-21).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { OBSERVANCE_ENGLISH_NAMES, observanceEnglishName } from "./observance-names";

const FESTIVALS_PY = path.join(import.meta.dirname, "..", "..", "app", "calculations", "festivals.py");

/** The `(MM-DD, name)` pairs inside the `_WORLD_OBSERVANCES = [...]` literal only. */
export function worldObservances(source: string): { date: string; name: string }[] {
  const block = source.match(/^_WORLD_OBSERVANCES\b[^=]*=\s*\[([\s\S]*?)^\]/m);
  if (!block) return [];
  return [...block[1].matchAll(/\(\s*"(\d{2}-\d{2})"\s*,\s*"([^"]+)"\s*\)/g)].map((m) => ({ date: m[1], name: m[2] }));
}

describe("world observance names (E-3 / OD-5)", () => {
  const observances = worldObservances(readFileSync(FESTIVALS_PY, "utf8"));

  it("the extractor saw the backend table (an empty read would pass vacuously)", () => {
    // 24 on 2026-09-21. A floor, not an exact count: adding one must reach the
    // next test and fail there by name, not here as a number.
    expect(observances.length).toBeGreaterThanOrEqual(24);
  });

  it("has an English name for every Tamil name the backend sends", () => {
    const missing = observances.filter((o) => !(o.name in OBSERVANCE_ENGLISH_NAMES)).map((o) => `${o.date} ${o.name}`);
    expect(
      missing,
      "Add each to OBSERVANCE_ENGLISH_NAMES in lib/observance-names.ts, keyed by the exact Tamil string.",
    ).toEqual([]);
  });

  it("gives the two observances that share 06-08 their own names", () => {
    const june8 = observances.filter((o) => o.date === "06-08").map((o) => observanceEnglishName(o.name));
    expect(june8).toEqual(["World Oceans Day", "World Brain Tumour Day"]);
  });

  it("extracts only the observance list, in the exact shape festivals.py uses", () => {
    const sample = [
      "_WORLD_OBSERVANCES: list[tuple[str, str]] = [",
      '    ("01-04", "உலக பிரெய்லி தினம்"),',
      '    ("06-08", "உலக பெருங்கடல் தினம்"),',
      "]",
      "",
      "_FIXED_FESTIVALS: list[FestivalEntry] = [",
      '    ("01-26", "Republic Day", "indian_govt"),',
      "]",
    ].join("\n");
    expect(worldObservances(sample)).toEqual([
      { date: "01-04", name: "உலக பிரெய்லி தினம்" },
      { date: "06-08", name: "உலக பெருங்கடல் தினம்" },
    ]);
    expect(worldObservances("no table here")).toEqual([]);
    expect(observanceEnglishName("Diwali")).toBeNull();
  });
});
