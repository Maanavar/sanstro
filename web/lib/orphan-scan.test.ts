/**
 * Components nothing imports, held to a declared list.
 *
 * Tree-shaking means an orphan costs no bytes, so the cost is entirely human: a
 * file that does not ship still reads as though it does. `dashboard-charts-panel-nova.tsx`
 * is the proof — two live files cite it in comments as the place where "the dasha
 * story lives in exactly one place", and three of the thirteen orphans wear a
 * `-nova` suffix, which in this codebase reads as *current generation*.
 *
 * TWO DIRECTIONS, AND THE SECOND ONE IS THE POINT. A new orphan fails until it is
 * declared and banner'd, and a declared file that gains an importer ALSO fails —
 * because its ORPHANED banner is now a lie, and a stale warning is worse than
 * none. That is the failure this repo has paid for repeatedly: a comment nobody
 * re-checks outliving the thing it described.
 *
 * See docs/EFFICIENCY_FIX_PLAN_2026-08-07.md F11. This test does not delete
 * anything; deletion stays a separate, per-file decision.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Verified 2026-08-08 by the sweep below, and each carries an ORPHANED banner.
const DECLARED_ORPHANS = [
  "advanced-lens-note",
  "alert-banner",
  "dashboard-charts-panel-nova",
  "dashboard-numerology-baby-names-nova",
  "dashboard-numerology-dates-nova",
  "dashboard-today-decide-nova",
  "day-strip",
  "member-chip",
  "morning-guidance-card",
  "peyarchi-banner",
  "porutham-panel",
  "sub-nav",
  "tools-grid",
].sort();

// Where importers can live. `mobile/` is included because a component moving
// cross-platform is exactly the case where a web-only grep would be wrong.
const IMPORTER_ROOTS = ["app", "components", "hooks", "lib", "../packages", "../mobile"];
const CODE = new Set([".ts", ".tsx"]);

function listFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return []; // an optional root (e.g. mobile/) simply not being present
  }
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === "ios" || entry === "android") {
        return [];
      }
      return listFiles(full);
    }
    return CODE.has(path.extname(full)) ? [full] : [];
  });
}

/**
 * Every module specifier mentioned anywhere, reduced to its basename.
 *
 * Covers static `from "..."`, bare `import "..."`, `export ... from "..."` and the
 * dynamic `import("...")` that `next/dynamic` uses — dashboard-workspace.tsx alone
 * has 16 of those, so missing that form would report most of the dashboard as
 * orphaned.
 */
function importedBasenames(files: string[]): Set<string> {
  const seen = new Set<string>();
  const SPECIFIER = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
  for (const file of files) {
    for (const m of readFileSync(file, "utf8").matchAll(SPECIFIER)) {
      seen.add(path.basename(m[1]).replace(/\.(tsx?|jsx?)$/, ""));
    }
  }
  return seen;
}

describe("orphan scan", () => {
  const root = process.cwd();
  // Barrels are excluded because they are imported by their DIRECTORY name
  // (`from "@/components/ui"`), so the specifier never contains "index" and every
  // barrel would look orphaned. Both extensions: `ui/index.ts` and
  // `skeleton/index.tsx` exist.
  const componentFiles = listFiles(path.join(root, "components")).filter(
    (f) => !/\.test\.tsx?$/.test(f) && !/^index\.tsx?$/.test(path.basename(f)),
  );
  const allCode = IMPORTER_ROOTS.flatMap((r) => listFiles(path.join(root, r)));

  it("scans a real tree, so an empty result cannot pass", () => {
    expect(componentFiles.length).toBeGreaterThan(100);
    expect(allCode.length).toBeGreaterThan(200);
  });

  it("finds exactly the declared orphans — no more, no fewer", () => {
    const imported = importedBasenames(allCode);
    const found = componentFiles
      .map((f) => path.basename(f, path.extname(f)))
      .filter((name) => !imported.has(name))
      .sort();

    const undeclared = found.filter((n) => !DECLARED_ORPHANS.includes(n));
    expect(
      undeclared,
      "New orphaned component(s). Either wire them up, or add an ORPHANED banner " +
        "(see any of the 13) and list them in DECLARED_ORPHANS here.",
    ).toEqual([]);

    const revived = DECLARED_ORPHANS.filter((n) => !found.includes(n));
    expect(
      revived,
      "These are declared orphaned but now HAVE an importer. Remove the ORPHANED " +
        "banner from each and drop it from DECLARED_ORPHANS — the banner is now false, " +
        "which is worse than no banner.",
    ).toEqual([]);
  });

  it("each declared orphan actually carries its banner", () => {
    const missing = DECLARED_ORPHANS.filter((name) => {
      const file = path.join(root, "components", `${name}.tsx`);
      return !readFileSync(file, "utf8").includes("ORPHANED 2026-08-08");
    });
    expect(missing, "declared orphan without an ORPHANED banner").toEqual([]);
  });
});
