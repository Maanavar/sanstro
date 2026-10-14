import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FESTIVAL_NAME_TA, FESTIVAL_NAME_TA_CURATED, tFestival, tFestivalCategory } from "./festival-names";

const BACKEND = path.resolve(__dirname, "../../app");
const FESTIVALS_PY = path.join(BACKEND, "calculations/festivals.py");
const CATEGORIES_PY = path.join(BACKEND, "data/calendar_categories_2026.py");
// The web image builds without the backend tree; the parity checks need it.
const haveBackend = existsSync(FESTIVALS_PY) && existsSync(CATEGORIES_PY);
const TAMIL = /[஀-௿]/u;

/** Every English name `get_festivals_for_date` can return, read from the source
 *  so a festival added there cannot reach a Tamil page unnoticed. */
function backendFestivalNames(): string[] {
  const src = readFileSync(FESTIVALS_PY, "utf8");
  const names = new Set<string>();
  // ("MM-DD", "Name", "category") rows: fixed and per-year gazetted lists.
  for (const m of src.matchAll(/\(\s*"\d{2}-\d{2}"\s*,\s*"([^"]+)"\s*,\s*"[a-z_]+"\s*\)/g)) names.add(m[1]);
  // {"name": "Name", ...} rows from the recurring rules.
  for (const m of src.matchAll(/"name":\s*"([^"]+)"/g)) names.add(m[1]);
  // _NAKSHATRA_FESTIVALS values.
  const nk = src.match(/_NAKSHATRA_FESTIVALS[^{]*\{([\s\S]*?)\n\}/);
  for (const m of (nk?.[1] ?? "").matchAll(/:\s*"([^"]+)"/g)) names.add(m[1]);
  // The two Ekadashi labels are built into a variable, not a dict literal.
  for (const m of src.matchAll(/"(Ekadashi \((?:Shukla|Krishna)\))"/g)) names.add(m[1]);
  // The curated calendar rows are merged in by `category_events_for_date`.
  for (const [en] of curatedRows()) names.add(en);
  return [...names];
}

/** (name_en, name_ta) of every curated calendar row. */
function curatedRows(): [string, string][] {
  const src = readFileSync(CATEGORIES_PY, "utf8");
  return [...src.matchAll(/CalendarCategoryEvent\(\s*"[^"]+"\s*,\s*date\([^)]*\)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/g)].map(
    (m) => [m[1], m[2]],
  );
}

describe("tFestival", () => {
  it("leaves English alone", () => {
    expect(tFestival("Thai Pongal", "en")).toBe("Thai Pongal");
  });

  it("translates a known name and leaves an unknown one visible", () => {
    expect(tFestival("Karthigai Deepam", "ta")).toBe("திருக்கார்த்திகை");
    expect(tFestival("Karthigai Vratam", "ta")).toBe("கார்த்திகை விரதம்");
    expect(tFestival("A Festival Nobody Mapped", "ta")).toBe("A Festival Nobody Mapped");
  });

  it("passes through a name the backend already sent in Tamil", () => {
    expect(tFestival("உலக நீர் தினம்", "ta")).toBe("உலக நீர் தினம்");
  });

  it("never maps a name to itself or to an empty string", () => {
    for (const [en, ta] of Object.entries(FESTIVAL_NAME_TA)) {
      expect(ta.trim(), en).not.toBe("");
      expect(TAMIL.test(ta), `${en} -> ${ta}`).toBe(true);
    }
  });
});

describe("tFestivalCategory", () => {
  it("names each category in Tamil and de-snakes it in English", () => {
    expect(tFestivalCategory("tamilnadu_govt", "en")).toBe("tamilnadu govt");
    expect(tFestivalCategory("hindu", "ta")).toBe("இந்துப் பண்டிகை");
    expect(tFestivalCategory("mystery_kind", "ta")).toBe("mystery kind");
  });
});

describe.skipIf(!haveBackend)("festival names against the backend", () => {
  it("has a Tamil form for every name the backend can emit", () => {
    const unmapped = backendFestivalNames().filter((n) => !TAMIL.test(n) && !FESTIVAL_NAME_TA[n]);
    expect(unmapped).toEqual([]);
  });

  it("reads a non-trivial number of backend names (the extraction is alive)", () => {
    // A regex that silently matches nothing would make the coverage test pass.
    expect(backendFestivalNames().length).toBeGreaterThan(90);
    expect(curatedRows().length).toBeGreaterThan(70);
  });

  it("copies a Tamil form the backend actually holds, for every curated name", () => {
    // One English name can sit in two category rows with two spellings (Deepavali
    // is both "தீபாவளி" and "தீபாவளி பண்டிகை"), so any of the backend's own
    // forms is correct; one it does not hold is drift.
    const held = new Map<string, Set<string>>();
    for (const [en, ta] of curatedRows()) held.set(en, (held.get(en) ?? new Set()).add(ta));
    const drifted = [...held].filter(([en, forms]) => !forms.has(FESTIVAL_NAME_TA_CURATED[en]!)).map(([en]) => en);
    const missing = [...held.keys()].filter((en) => FESTIVAL_NAME_TA_CURATED[en] === undefined);
    expect({ drifted, missing }).toEqual({ drifted: [], missing: [] });
  });
});
