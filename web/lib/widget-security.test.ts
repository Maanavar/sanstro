/**
 * Widget security assertions (Phase 4.3).
 *
 * /widget/* pages are embedded in third-party iframes under frame-ancestors *.
 * They must NEVER import the authenticated API client or the session hook,
 * because the vinaadi_token cookie is SameSite=Lax and won't be sent in a
 * cross-site iframe anyway — but an accidental import would be a code smell
 * that could silently break when cookie policies tighten.
 *
 * These tests scan the widget source files at build time so a future
 * contributor gets a failing test instead of a silent security regression.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";
import { describe, expect, it } from "vitest";

function widgetSources(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...widgetSources(full));
    } else if ([".ts", ".tsx"].includes(extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Locate the widget route wherever it sits under app/. Hardcoding app/widget
 * meant that moving the public routes into the app/(marketing) route group made
 * readdirSync throw — which reads as a broken test, not as the security scan
 * silently covering zero files, but only because it threw. A route group is
 * invisible in the URL, so this has to resolve by name.
 */
function findWidgetDir(root: string): string {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "widget") return join(root, entry.name);
    if (entry.name.startsWith("(") || entry.name === "api") {
      const nested = join(root, entry.name, "widget");
      try {
        if (readdirSync(nested).length) return nested;
      } catch {
        /* not here */
      }
    }
  }
  throw new Error(`no widget route found under ${root}`);
}

// Resolve from the repo root (this file lives in web/lib/).
const WIDGET_DIR = findWidgetDir(join(import.meta.dirname, "..", "app"));
const AUTHED_PATTERNS = [
  /apiFetchJson/,
  /from\s+["']@\/lib\/api["']/,
  /useSession/,
  /vinaadi_token/,
];

describe("widget pages — no authed API surface", () => {
  const sources = widgetSources(WIDGET_DIR);

  it("widget directory contains at least one source file", () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  for (const file of sources) {
    const rel = file.replace(/.*[/\\]widget[/\\]/, "widget/");
    it(`${rel} does not import authed API client or session hook`, () => {
      const src = readFileSync(file, "utf-8");
      for (const pattern of AUTHED_PATTERNS) {
        expect(src).not.toMatch(pattern);
      }
    });
  }
});

describe("widget pages — call only public endpoints", () => {
  const sources = widgetSources(WIDGET_DIR);

  for (const file of sources) {
    const rel = file.replace(/.*[/\\]widget[/\\]/, "widget/");
    it(`${rel} fetch() calls target /public/ paths only`, () => {
      const src = readFileSync(file, "utf-8");
      // Find all fetch() URL string arguments.
      const fetchUrls = [...src.matchAll(/fetch\(`([^`]+)`\)/g)].map(m => m[1]);
      for (const url of fetchUrls) {
        expect(url).toMatch(/\/public\//);
      }
    });
  }
});
