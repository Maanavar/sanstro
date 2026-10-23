/**
 * Rasi, nakshatra and graha names reach a mobile screen through their
 * localiser, never raw off the response (CLAUDE.md "Display boundary").
 *
 * Mobile had no ratchet at all, and FCA-05 (docs/FULL_CODEBASE_AUDIT_2026-10-22.md)
 * found the result: a Tamil reader saw `SATURN` on the insights screen, and
 * `Mithunam` plus an English star name on the first chart a new user sees.
 *
 * Web's two guards (web/lib/rasi-display-boundary.test.ts and
 * web/lib/astro-name-display-boundary.test.ts) do not transfer verbatim — the
 * shapes that leaked here were ones neither looks for:
 *
 *   {isTamil ? x.mahadasha.lord : x.mahadasha.lord}   both branches the raw key
 *   { label: "Lagna", value: chart.lagna.rasiName }    an object-literal value
 *
 * So this guard has two rules.
 *
 * NAME FIELDS — any read of `.rasiName` / `.rasiCode` / `.lagnaRasiName` /
 * `.nakshatraName` & co. is a leak unless it is the argument of a resolver that
 * turns it back into a key (`tNakshatra(`, `nakshatraNumberFromName(`). Keyed
 * on the leading dot, as on web, so a style named `styles.rasiName` is the only
 * false shape and is excluded by name; a bilingual `{ ta, en }` object
 * (`x.rasiName.ta`) is not a server English name and is excluded too.
 *
 * KEYS — `.lord` and `.graha` are read constantly as keys (`tPlanetLord(p.graha,
 * lang)`, `key={p.graha}`), so for them the guard keys on a RENDER: the field as
 * the whole JSX child `{p.graha}`, or as a whole branch of a ternary in one.
 *
 * TWO DIRECTIONS: an undeclared read fails, and a declared file that stopped
 * reading one also fails.
 *
 * KNOWN GAPS: `.tsx` only; a name built by string `+` or split across lines is
 * not matched; a key rendered through a helper that does not localise is
 * invisible. And 26 `isTamil ? "English" : "English"` UI strings are a
 * different defect (copy, not a server name) — see the audit's FCA-05 note.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const SCAN_DIRS = ["app", "src"];

/** What still reads one of these, and why that read is not a leak. */
const DECLARED: Record<string, string> = {};

const CHAIN = String.raw`[\w$]+(?:\??\.[\w$]+|\[[^\]\n]+\])*?\??\.`;

const NAME_FIELD =
  /(?<!\bstyles)\.\s*((?:[A-Za-z]*[Rr]asi(?:Name|Code))|[A-Za-z]*[Nn]akshatraName)\b(?!\s*\??\.(?:ta|en)\b)/g;
const RESOLVED_NAME = new RegExp(
  String.raw`\b(?:tNakshatra|nakshatraNumberFromName)\(\s*(?:\([^()]*\)\s*\??\.|${CHAIN})[A-Za-z]*[Nn]akshatraName\b`,
  "g",
);

export function nameFieldReads(source: string): string[] {
  const stripped = source.replace(RESOLVED_NAME, "");
  return [...stripped.matchAll(NAME_FIELD)].map((m) => `.${m[1]}`);
}

const KEY_FIELD = String.raw`[A-Za-z]*[Ll]ord|graha`;
/** `{p.graha}` — the key as the whole JSX child. Not after `=` (a prop). */
const KEY_CHILD = new RegExp(String.raw`(?<![=\w$])\{\s*${CHAIN}(?:${KEY_FIELD})\b\s*\}`, "g");
/** `{cond ? x.lord : …}` / `{cond ? … : x.lord}` — the key as a whole ternary branch. */
const KEY_BRANCH = new RegExp(
  String.raw`(?<![=\w$])\{[^{}\n]*?\?\s*(?:${CHAIN}(?:${KEY_FIELD})\b\s*:|[^{}\n]*?:\s*${CHAIN}(?:${KEY_FIELD})\b\s*\})`,
  "g",
);

export function keyRenders(source: string): string[] {
  return [...source.matchAll(KEY_CHILD), ...source.matchAll(KEY_BRANCH)].map((m) => m[0]);
}

function listFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return entry === "node_modules" ? [] : listFiles(full);
    return full.endsWith(".tsx") && !full.endsWith(".test.tsx") ? [full] : [];
  });
}

export function scanSources(files: Array<[string, string]>): Map<string, string[]> {
  const hits = new Map<string, string[]>();
  for (const [file, source] of files) {
    const found = [...nameFieldReads(source), ...keyRenders(source)];
    if (found.length > 0) hits.set(file, [...new Set(found)]);
  }
  return hits;
}

function scan(): Map<string, string[]> {
  const files = SCAN_DIRS.flatMap((d) => listFiles(path.join(ROOT, d))).map(
    (full) => [path.relative(ROOT, full).split(path.sep).join("/"), readFileSync(full, "utf8")] as [string, string],
  );
  return scanSources(files);
}

describe("mobile astro name display boundary (FCA-05)", () => {
  it("declares every screen that still renders a server-chosen name", () => {
    const undeclared = [...scan().entries()]
      .filter(([f]) => !(f in DECLARED))
      .map(([f, h]) => `${f} → ${h.join(" | ")}`)
      .sort();
    expect(undeclared).toEqual([]);
  });

  it("has no stale entries — a declared file that stopped reading one must be removed here", () => {
    const present = new Set(scan().keys());
    expect(Object.keys(DECLARED).filter((f) => !present.has(f)).sort()).toEqual([]);
  });

  it("detects the shapes that shipped, and stays quiet on keys and localised reads", () => {
    // Verbatim from the screens FCA-05 fixed.
    expect(keyRenders("{isTamil ? currentDasha.current.mahadasha.lord : currentDasha.current.mahadasha.lord}")).toHaveLength(1);
    expect(keyRenders("                      {p.graha}\n")).toEqual(["{p.graha}"]);
    expect(nameFieldReads('{ label: isTamil ? "லக்னம்" : "Lagna", value: chart.lagna.rasiName },')).toEqual([".rasiName"]);
    expect(nameFieldReads("value: chart.lagna.nakshatraName }")).toEqual([".nakshatraName"]);
    expect(nameFieldReads("{kd.current.mahadasha.rasiName ?? kd.current.mahadasha.rasiCode}")).toEqual([".rasiName", ".rasiCode"]);
    expect(nameFieldReads("Lagna: {candidate.lagnaRasiName}")).toEqual([".lagnaRasiName"]);

    // Keys, lookups, bilingual objects and localised reads are not leaks.
    expect(keyRenders("{tPlanetLord(currentDasha.current.mahadasha.lord, lang)}")).toEqual([]);
    expect(keyRenders("<View key={p.graha} style={s}>")).toEqual([]);
    expect(keyRenders("{PLANET_SHORT_TA[p.graha] ?? p.graha.slice(0, 2)}")).toEqual([]);
    expect(nameFieldReads("{rasiDisplayName(chart.lagna.rasi, lang)}")).toEqual([]);
    expect(nameFieldReads("{tNakshatra(moon.nakshatraName, lang)}")).toEqual([]);
    expect(nameFieldReads('nakshatraNumberFromName((person1 as any).nakshatraName ?? "")')).toEqual([]);
    expect(nameFieldReads("isTamil ? rasiPalanData.rasiName.ta : rasiPalanData.rasiName.en")).toEqual([]);
    expect(nameFieldReads("<Text style={[styles.rasiName, x]}>")).toEqual([]);
  });
});
