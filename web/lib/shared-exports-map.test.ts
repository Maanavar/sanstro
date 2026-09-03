import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `packages/shared/package.json` declares an `exports` map, and once a package
 * has one, every subpath a consumer imports must be listed in it — anything
 * else is a resolution error, not a fallback to the file on disk.
 *
 * Today nothing enforces that. Next resolves these through the workspace and
 * tsconfig `paths`, and Metro through its own resolver, so nine subpaths
 * (`api/charaDasha`, `api/shadbala`, `api/snapshot`, `api/streak`,
 * `api/propensities`, `api/kalachakraDasha`, `api/oneMinuteReading`,
 * `api/fiveMinuteReading`, `constants/tiers`) were imported by live web and
 * mobile code for months while being undeclared. They would all have broken at
 * once, in both apps, the first time anything resolved this package the way
 * Node does — a tsconfig `moduleResolution` bump, a bundler upgrade, or
 * publishing the package.
 *
 * The failure mode is what makes it worth a guard: adding a wrapper file and
 * importing it works perfectly on every machine, so the omission is invisible
 * until it is everywhere. This asserts the three directions that can drift.
 */

const REPO_ROOT = path.resolve(process.cwd(), "..");
const SHARED_ROOT = path.join(REPO_ROOT, "packages", "shared");
const CONSUMER_ROOTS = [
  path.join(REPO_ROOT, "web", "app"),
  path.join(REPO_ROOT, "web", "components"),
  path.join(REPO_ROOT, "web", "hooks"),
  path.join(REPO_ROOT, "web", "lib"),
  path.join(REPO_ROOT, "mobile", "src"),
];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

type ExportsMap = Record<string, string>;

function readExportsMap(): ExportsMap {
  const manifest = JSON.parse(readFileSync(path.join(SHARED_ROOT, "package.json"), "utf8"));
  return manifest.exports as ExportsMap;
}

function listSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (entry === "node_modules" || entry === ".next") return [];
      return listSourceFiles(fullPath);
    }
    return SOURCE_EXTENSIONS.has(path.extname(fullPath)) ? [fullPath] : [];
  });
}

/** Every `@vinaadi/shared[/subpath]` specifier anywhere a consumer imports it. */
function importedSpecifiers(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const file of CONSUMER_ROOTS.flatMap(listSourceFiles)) {
    const source = readFileSync(file, "utf8");
    // Matches import, export-from, dynamic import and vi.mock alike — the
    // specifier is always inside the quotes.
    for (const match of source.matchAll(/["'](@vinaadi\/shared(?:\/[^"']*)?)["']/g)) {
      const specifier = match[1];
      found.set(specifier, [...(found.get(specifier) ?? []), path.relative(REPO_ROOT, file)]);
    }
  }
  return found;
}

describe("@vinaadi/shared exports map", () => {
  it("declares every subpath the web and mobile apps actually import", () => {
    const declared = new Set(Object.keys(readExportsMap()));
    const undeclared = [...importedSpecifiers()]
      .map(([specifier, files]) => {
        const subpath = specifier === "@vinaadi/shared"
          ? "."
          : `.${specifier.slice("@vinaadi/shared".length)}`;
        return declared.has(subpath) ? null : `${subpath} (imported by ${files[0]})`;
      })
      .filter((entry): entry is string => entry !== null)
      .sort();

    expect(undeclared).toEqual([]);
  });

  it("points every declared subpath at a file that exists", () => {
    const missing = Object.entries(readExportsMap())
      .filter(([, target]) => !existsSync(path.join(SHARED_ROOT, target)))
      .map(([subpath, target]) => `${subpath} → ${target}`)
      .sort();

    expect(missing).toEqual([]);
  });

  it("gives every API wrapper both a subpath and a place in the barrel", () => {
    const apiDir = path.join(SHARED_ROOT, "src", "api");
    const modules = readdirSync(apiDir)
      .filter((entry) => entry.endsWith(".ts") && entry !== "index.ts")
      .map((entry) => entry.replace(/\.ts$/, ""));

    const declared = new Set(Object.keys(readExportsMap()));
    const barrel = readFileSync(path.join(apiDir, "index.ts"), "utf8");

    // A wrapper reachable by neither route is a wrapper nobody can import —
    // which is how a fresh direct-fetch call site gets written instead.
    expect(modules.filter((name) => !declared.has(`./api/${name}`))).toEqual([]);
    expect(modules.filter((name) => !barrel.includes(`"./${name}"`))).toEqual([]);
  });
});
