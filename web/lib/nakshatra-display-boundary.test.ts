/**
 * The birth star must reach the screen through tNakshatra, not straight off
 * the response.
 *
 * `janmaNakshatra` on a chart summary is the server's key ("UTHIRADAM"). Read
 * raw it prints an enum at everybody and English-script at a Tamil reader. The
 * dashboard's sticky identity bar did exactly that on every signed-in page
 * ("தனுசு - UTHIRADAM - மிதுனம் லக்னம்"), and so did the family card, the
 * family member line and Settings' chart line, while five other surfaces two
 * files away localised the same field correctly. CLAUDE.md "Display boundary"
 * notes that only the rasi half was ratcheted (rasi-display-boundary.test.ts);
 * this is the nakshatra half.
 *
 * A read is fine when it is an argument to a localiser. Anything else must be
 * declared below with a reason, in both directions: a stale entry also fails.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** What still reads the field bare, and why that read is not a render. */
const DECLARED: Record<string, string> = {
  "components/dashboard-workspace.tsx":
    "prop hand-off to the Settings tab, which renders it through tNakshatra",
  "components/dashboard-family-charts-hybrid.tsx":
    "prop hand-off (memberNakshatraName) to HyTodayFacts, which renders it through tNakshatra",
  // Not the server key: JadhagamTool composes this field as a display string
  // ("Uthiradam P2"). That tool's Tamil share card also passes English rasi
  // names; logged in docs/LIFE_FOCUS_PLAN_2026-09-22.md, not fixed here.
  "components/public-share-card.tsx":
    "field is a caller-composed display string, not the server's nakshatra key",
};

const ROOTS = ["app", "components"];

const LOCALISERS = "tNakshatra|astroText|tamilizeAstroEnglish|nakshatraNumberFromName";

/**
 * `.janmaNakshatra` not inside a localiser call. The lookbehind allows the
 * receiver chain between the call and the field (`tNakshatra(coreIdentity.`).
 * Not renders, so not flagged: `janmaNakshatraWindows` (a list of spans), a
 * guard (`x.janmaNakshatra &&`, `x.janmaNakshatra ? … :`, `if (x.janmaNakshatra)`)
 * and an already-localised pair (`context.janmaNakshatra.ta`). A bare `)` is
 * NOT a guard on its own: `push(summary.janmaNakshatra)` is the leak that shipped.
 */
const BARE_READ = new RegExp(
  `(?<!(?:${LOCALISERS})\\(\\s*[\\w?.]*)(?<!\\bif\\s*\\(\\s*[\\w?.]*)` +
    `\\.\\s*janmaNakshatra\\b(?!Windows|\\s*&&|\\s*\\?(?![?.])|\\.(?:en|ta)\\b)`,
  "g",
);

export function bareNakshatraReads(source: string): string[] {
  return [...source.matchAll(BARE_READ)].map(() => ".janmaNakshatra");
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
    return path.extname(full) === ".tsx" && !full.endsWith(".test.tsx") ? [full] : [];
  });
}

function scan(): Map<string, number> {
  const hits = new Map<string, number>();
  for (const root of ROOTS) {
    for (const file of listFiles(root)) {
      const n = bareNakshatraReads(readFileSync(file, "utf8")).length;
      if (n > 0) hits.set(file.split(path.sep).join("/"), n);
    }
  }
  return hits;
}

describe("nakshatra display boundary", () => {
  it("declares every surface that still reads janmaNakshatra outside a localiser", () => {
    const undeclared = [...scan().keys()].filter((f) => !(f in DECLARED)).sort();
    expect(
      undeclared,
      "Render the birth star through tNakshatra(key, lang) from lib/i18n. The " +
        "raw field is the server's key and prints UTHIRADAM to a Tamil reader. " +
        "A read that is not a render (a truthiness check, a prop) goes in DECLARED with its reason.",
    ).toEqual([]);
  });

  it("has no stale entries", () => {
    const present = new Set(scan().keys());
    const stale = Object.keys(DECLARED).filter((f) => !present.has(f)).sort();
    expect(stale, "This file no longer reads the field bare. Delete the entry.").toEqual([]);
  });

  it("detects the shapes that shipped, and stays quiet inside a localiser", () => {
    // Verbatim from the four sites fixed with this guard.
    expect(bareNakshatraReads("{chartSummary.janmaNakshatra}")).toHaveLength(1);
    expect(bareNakshatraReads("identityParts.push(summary.janmaNakshatra);")).toHaveLength(1);
    expect(bareNakshatraReads("` · ${summary.janmaNakshatra}`")).toHaveLength(1);

    expect(bareNakshatraReads("{tNakshatra(chartSummary.janmaNakshatra, lang)}")).toEqual([]);
    expect(bareNakshatraReads("tNakshatra(coreIdentity.janmaNakshatra, lang)")).toEqual([]);
    expect(bareNakshatraReads("${astroText(personalChartSummary.janmaNakshatra)}")).toEqual([]);
    expect(bareNakshatraReads("tamilizeAstroEnglish(d.janmaNakshatra)")).toEqual([]);
    expect(bareNakshatraReads("panchangam.chandrashtamamToday.janmaNakshatraWindows")).toEqual([]);

    // Guards and pre-localised pairs are reads, not renders.
    expect(bareNakshatraReads("if (summary?.janmaNakshatra) identityParts.push(x);")).toEqual([]);
    expect(bareNakshatraReads("{personalChartSummary?.janmaNakshatra && nakshatraCard && (")).toEqual([]);
    expect(bareNakshatraReads("${summary.janmaNakshatra ? ` · ${y}` : \"\"}")).toEqual([]);
    expect(bareNakshatraReads("${context.janmaNakshatra.ta}")).toEqual([]);
    // …but a nullish fallback is still a render of the raw field.
    expect(bareNakshatraReads("{summary.janmaNakshatra ?? \"\"}")).toHaveLength(1);
  });
});
