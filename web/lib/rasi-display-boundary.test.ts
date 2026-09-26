/**
 * Rasi names must reach the screen through the display boundary, not straight
 * off the response.
 *
 * The backend sends one sign three ways: `rasi` (a number), `rasiName` (the
 * Latin name from `RASI_NAMES` — "Mithunam") and `rasiCode` (the raw enum —
 * "MITHUNAM"). Only the number carries no language. A component that renders
 * `rasiName` prints English at a Tamil reader; one that renders `rasiCode`
 * prints an enum at everybody.
 *
 * DXA-08 fixed the enum half and was recorded PASS, because the browser gate
 * greps for UPPER_CASE and `Mithunam` is not upper case. Nine sites were still
 * live behind that green: the Explain overlay, the Jadhagam report, Porutham,
 * the synastry panel, Kalachakra, the Calendar lagnam row, both solar-return
 * tiles, Varshaphala and the rectification wizard. This guard is the check the
 * regex could not be: it keys on the field being read, so the correctly-cased
 * half is as visible as the shouting half.
 *
 * TWO DIRECTIONS, as in lib/field-style-guard.test.ts. A new read fails until
 * it is declared here with a reason, and a declared file that no longer reads
 * one ALSO fails — a list that only ever grows becomes a record of a past that
 * was cleaned up, which is how a stale conclusion outlives its check.
 *
 * See docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md DXA-08.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** What still reads a name field, and why that read is not a leak. */
const DECLARED: Record<string, string> = {
  // Passes BOTH halves to `formatRasi(number, fallback, lang)`, which prefers
  // its own localised table and uses the name only when the number is absent.
  // The name is an argument to a localiser here, never a render.
  "app/(marketing)/tools/daily-panchangam-planner/PanchangamTool.tsx":
    "name is the fallback argument to formatRasi(number, fallback, lang), not a render",
};

const ROOTS = ["app", "components"];

/**
 * A read of a server-supplied rasi *name*: `.rasiName`, `.rasiCode`,
 * `.lagnaRasiName`, `.srLagnaRasiName`, `.solarReturnLagnaName`, …
 *
 * Keyed on the leading dot so the shapes that are NOT the defect stay quiet:
 * an import (`import { rasiName }`), a declaration (`function rasiName(`), a
 * prop (`rasiName={…}`), an object key (`rasiName:`) and a local const all
 * lack it. Those are how a correct surface names its own localised helper —
 * `dashboard-calendar-shared` exports one — and flagging them is how a guard
 * earns an allowlist entry instead of a fix.
 */
const NAME_FIELD = /\.\s*(?:[A-Za-z]*[Rr]asi(?:Name|Code)|solarReturnLagnaName)\b/g;

export function rasiNameReads(source: string): string[] {
  return [...source.matchAll(NAME_FIELD)].map((m) => m[0].replace(/^\.\s*/, "."));
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
    if (statSync(full).isDirectory()) {
      return entry === "node_modules" || entry === ".next" ? [] : listFiles(full);
    }
    return path.extname(full) === ".tsx" ? [full] : [];
  });
}

function scan(): Map<string, string[]> {
  const hits = new Map<string, string[]>();
  for (const root of ROOTS) {
    for (const file of listFiles(root)) {
      const reads = rasiNameReads(readFileSync(file, "utf8"));
      if (reads.length > 0) hits.set(file.split(path.sep).join("/"), [...new Set(reads)]);
    }
  }
  return hits;
}

describe("rasi display boundary (DXA-08)", () => {
  it("declares every surface that still reads a rasi name off the response", () => {
    const undeclared = [...scan().keys()].filter((f) => !(f in DECLARED)).sort();
    expect(
      undeclared,
      "Render the numeric `rasi` through rasiDisplayName(rasi, lang) from " +
        "lib/chart-utils. `rasiName` is English-only and `rasiCode` is the raw " +
        "enum — both print the wrong thing to a Tamil reader.",
    ).toEqual([]);
  });

  it("has no stale entries — a declared file that stopped reading one must be removed here", () => {
    const present = new Set(scan().keys());
    const stale = Object.keys(DECLARED).filter((f) => !present.has(f)).sort();
    expect(stale, "This file no longer reads a rasi name. Delete the entry.").toEqual([]);
  });

  it("detects the exact shapes that shipped, and stays quiet on a localised helper", () => {
    // Verbatim from the five files this pass fixed.
    expect(rasiNameReads("{moon.rasiName}{\" \"}")).toEqual([".rasiName"]);
    expect(rasiNameReads("{identity.lagnaRasiName} {en ? \"Lagnam\" : \"லக்னம்\"}")).toEqual([".lagnaRasiName"]);
    expect(rasiNameReads("name: period.rasiName ?? period.rasiCode,")).toEqual([".rasiName", ".rasiCode"]);
    expect(rasiNameReads("value={solarReturn.srLagnaRasiName}")).toEqual([".srLagnaRasiName"]);
    expect(rasiNameReads("value={data.solarReturnLagnaName}")).toEqual([".solarReturnLagnaName"]);

    // The end state: the number, read through the boundary.
    expect(rasiNameReads("{rasiDisplayName(moon.rasi, lang)}")).toEqual([]);

    // A surface's own localised helper — imported, declared, called, passed as
    // a prop, or used as an object key — is not a read of the response field.
    expect(rasiNameReads("import { rasiName } from \"./dashboard-calendar-shared\";")).toEqual([]);
    expect(rasiNameReads("export function rasiName(rasi: number, lang: Lang): string {")).toEqual([]);
    expect(rasiNameReads("value: rasiName(panchangam.lagnam.rasiNumber, lang),")).toEqual([]);
    expect(rasiNameReads("<Card rasiName={ta ? result.targetRasiTa : result.targetRasiEn} />")).toEqual([]);
    expect(rasiNameReads("const rasiName = rasiLabel(rasi, lang);")).toEqual([]);
  });
});
