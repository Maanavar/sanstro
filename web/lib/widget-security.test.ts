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

// Resolve from the repo root (this file lives in web/lib/).
const WIDGET_DIR = join(import.meta.dirname, "..", "app", "widget");
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
    const rel = file.replace(/.*[/\\]app[/\\]widget[/\\]/, "widget/");
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
    const rel = file.replace(/.*[/\\]app[/\\]widget[/\\]/, "widget/");
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
