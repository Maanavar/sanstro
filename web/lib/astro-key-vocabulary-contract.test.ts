/**
 * The localisers must know every key the backend can send.
 *
 * The display-boundary ratchets (rasi-, nakshatra-, astro-name- and
 * astrology-render-boundary) prove a component *calls* `tNakshatra` /
 * `tPlanetLord`. They cannot prove the call localises anything: `_lookupName`
 * returns the raw key when it has no entry, so a key missing from the map
 * prints `KARTHIGAI` at a Tamil reader through a perfectly "correct" call.
 *
 * This reads the backend's own vocabulary (`app/constants/astrology.py`), so a
 * renamed or added key fails here instead of on a Tamil screen. It is the
 * rendered-output check behind Phase 4 A's Jadhagam lead: the backend sends
 * the uppercase key, and both languages must come out localised.
 *
 * Blind spots: it checks the map, not prose quality — a wrong Tamil spelling
 * passes as long as it is Tamil script. Planet keys are listed by hand because
 * the backend has no single tuple for the nine grahas.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { tNakshatra, tPlanetLord } from "./i18n";

const TAMIL_SCRIPT = /[஀-௿]/;

function backendNakshatraKeys(): string[] {
  const source = readFileSync(path.resolve(__dirname, "../../app/constants/astrology.py"), "utf8");
  const block = /NAKSHATRA_NAMES[^=]*=\s*\(([\s\S]*?)\)/.exec(source);
  if (!block) throw new Error("NAKSHATRA_NAMES tuple not found in app/constants/astrology.py");
  return [...block[1].matchAll(/"([A-Z]+)"/g)].map((m) => m[1]);
}

const GRAHA_KEYS = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"];

describe("astrology key vocabulary contract", () => {
  const nakshatras = backendNakshatraKeys();

  it("reads all 27 nakshatra keys from the backend", () => {
    expect(nakshatras).toHaveLength(27);
  });

  it.each(nakshatras)("localises nakshatra %s in both languages", (key) => {
    const ta = tNakshatra(key, "ta");
    const en = tNakshatra(key, "en");
    expect(ta, `${key} has no Tamil entry`).toMatch(TAMIL_SCRIPT);
    expect(en, `${key} has no English entry`).not.toBe(key);
    expect(en).not.toMatch(TAMIL_SCRIPT);
  });

  it.each(GRAHA_KEYS)("localises graha %s in both languages", (key) => {
    expect(tPlanetLord(key, "ta"), `${key} has no Tamil entry`).toMatch(TAMIL_SCRIPT);
    expect(tPlanetLord(key, "en"), `${key} has no English entry`).not.toBe(key);
  });
});
