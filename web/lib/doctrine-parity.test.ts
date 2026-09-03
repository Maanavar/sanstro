/**
 * The web's dignity doctrine, pinned against the Python that computes from it.
 *
 * These tables are classical constants, so the web copy and the backend copy are
 * two hand-typed statements of the same fact with **no compile-time check between
 * them** — the same unguarded boundary as the API contract, one layer down.
 *
 * That boundary has already been crossed once. `JadhagamTool.tsx` carried a
 * `NATURAL_ENEMIES` that omitted RAHU/KETU as enemies for SUN, MARS, JUPITER,
 * VENUS and KETU, against both the dashboard's copy and the backend's
 * `chart_strength._NATURAL_ENEMIES`. It never surfaced, because its only reader
 * compares against a SIGN LORD and a sign lord is never Rahu or Ketu — so the
 * wrong rows were unreachable rather than correct.
 *
 * The web tables are now single-sourced in `lib/chart-utils.ts`. This test guards
 * the remaining seam: that the one web copy still agrees with Python.
 *
 * It reads the Python as TEXT rather than executing it. A Node test cannot import
 * a module that pulls in the ephemeris, and shelling out to `python` would make a
 * fast unit suite depend on the venv. Parsing the literal is enough for the
 * failure that actually happens: somebody edits one side's table.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEBILITATION_RASI,
  EXALTATION_RASI,
  NATURAL_ENEMIES,
  NATURAL_FRIENDS,
  RASI_LORDS,
} from "./chart-utils";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const CHART_STRENGTH = path.join(REPO_ROOT, "app", "calculations", "chart_strength.py");
const CONSTANTS = path.join(REPO_ROOT, "app", "constants", "astrology.py");

function read(file: string): string {
  return readFileSync(file, "utf8");
}

/** The `{...}` body of a top-level assignment, e.g. `SIGN_LORD: dict[...] = {…}`. */
function literalBody(source: string, name: string): string {
  const start = source.indexOf(`\n${name}`);
  expect(start, `${name} not found — has it been renamed or moved?`).toBeGreaterThan(-1);
  const open = source.indexOf("{", start);
  const close = source.indexOf("\n}", open);
  expect(close, `${name} literal is not a top-level brace block`).toBeGreaterThan(open);
  return source.slice(open, close);
}

/** `1: "MARS"` rows → `{ 1: "MARS" }`. */
function parseIntToStr(body: string): Record<number, string> {
  const out: Record<number, string> = {};
  for (const m of body.matchAll(/(\d+)\s*:\s*"([A-Z]+)"/g)) out[Number(m[1])] = m[2];
  return out;
}

/** `"SUN": 1` rows → `{ SUN: 1 }`. */
function parseStrToInt(body: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of body.matchAll(/"([A-Z]+)"\s*:\s*(\d+)/g)) out[m[1]] = Number(m[2]);
  return out;
}

/** `"SUN": frozenset({"MOON", "MARS"})` rows → `{ SUN: ["MARS","MOON"] }`, sorted. */
function parseStrToSet(body: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const m of body.matchAll(/"([A-Z]+)"\s*:\s*frozenset\(\{([^}]*)\}\)/g)) {
    out[m[1]] = [...m[2].matchAll(/"([A-Z]+)"/g)].map((x) => x[1]).sort();
  }
  // `frozenset()` with no members is a legitimate row and the regex above skips
  // it, so pick those up separately rather than silently dropping a planet.
  for (const m of body.matchAll(/"([A-Z]+)"\s*:\s*frozenset\(\)/g)) out[m[1]] = [];
  return out;
}

function sortValues(table: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(table).map(([k, v]) => [k, [...v].sort()]));
}

describe("web dignity doctrine matches the backend", () => {
  it("sign lords", () => {
    const python = parseIntToStr(literalBody(read(CONSTANTS), "SIGN_LORD"));
    expect(Object.keys(python)).toHaveLength(12);
    // Keys are numbers in Python and strings on a JS object, so compare entries.
    expect(python).toEqual({ ...RASI_LORDS });
  });

  it("exaltation and debilitation rasis", () => {
    const source = read(CHART_STRENGTH);
    const exaltation = parseStrToInt(literalBody(source, "EXALTATION_RASI"));
    const debilitation = parseStrToInt(literalBody(source, "DEBILITATION_RASI"));
    // Seven, not nine: Rahu and Ketu have no exaltation sign in this doctrine.
    expect(Object.keys(exaltation)).toHaveLength(7);
    expect(Object.keys(debilitation)).toHaveLength(7);
    expect(exaltation).toEqual(EXALTATION_RASI);
    expect(debilitation).toEqual(DEBILITATION_RASI);
  });

  it("natural friends and enemies — the pair that has drifted three times", () => {
    const source = read(CHART_STRENGTH);
    const friends = parseStrToSet(literalBody(source, "_NATURAL_FRIENDS"));
    const enemies = parseStrToSet(literalBody(source, "_NATURAL_ENEMIES"));

    // Nine grahas on both sides. Asserted separately so a table that parsed to
    // {} cannot make the comparison below pass by being empty on both sides.
    expect(Object.keys(friends)).toHaveLength(9);
    expect(Object.keys(enemies)).toHaveLength(9);

    // SOFT, so both tables report. When this went red on `dad309b` the hard
    // form stopped at friends and never ran the enemies comparison — which was
    // also drifted (RAHU was missing KETU). A drift report that shows half the
    // drift invites a half fix.
    expect.soft(friends).toEqual(sortValues(NATURAL_FRIENDS));
    expect.soft(enemies).toEqual(sortValues(NATURAL_ENEMIES));
  });

  it("catches the exact drift that shipped, so this file is not decoration", () => {
    // JadhagamTool's real (wrong) SUN row, checked against the real Python one.
    const shipped = ["VENUS", "SATURN"].sort();
    const python = parseStrToSet(literalBody(read(CHART_STRENGTH), "_NATURAL_ENEMIES"));
    expect(python.SUN).not.toEqual(shipped);
    expect(python.SUN).toEqual(["KETU", "RAHU", "SATURN", "VENUS"]);
  });
});
