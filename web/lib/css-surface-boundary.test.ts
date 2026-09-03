/**
 * The CSS surface boundary (F4 / F5 of docs/EFFICIENCY_FIX_PLAN_2026-08-07.md).
 *
 * globals.css used to be one 215 KB file in the root layout, so every signed-in
 * page downloaded the marketing design system and every marketing page
 * downloaded stale dashboard rules. It is now three files, each loaded by one
 * layout:
 *
 *   app/globals.css                     root layout      — every route
 *   app/marketing.css                   app/(marketing)  — public routes
 *   app/dashboard/dashboard-globals.css app/dashboard    — signed-in routes
 *
 * Nothing in the type system knows about that split. A rule filed under the
 * wrong surface does not fail to compile — it renders unstyled, on one surface
 * only, usually one nobody opens during review. So the boundary is asserted here
 * instead.
 *
 * The second test is the one that earns its keep. Doing this split by hand put
 * `.input--error` / `.select--error` / `.input--valid` into the dashboard file
 * because they read as "signed-in" classes. They are used by the shared
 * ValidatedField that /login renders, and /login is not under app/dashboard/, so
 * it never loads that stylesheet. Login's field validation would have silently
 * lost its styling. The rule is not "which surface does this feel like" but
 * "which stylesheets does this route actually load".
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WEB = join(import.meta.dirname, "..");

type Boundary = {
  used: { marketing: string[]; dashboard: string[]; root: string[] };
  definedIn: Record<string, string[]>;
};

const boundary: Boundary = JSON.parse(
  execFileSync(process.execPath, [join(WEB, "scripts/css-inventory.mjs"), "--emit-boundary"], {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  }),
);

/**
 * Which route-level stylesheets each load context gets. Component-scoped CSS
 * (components/*.css, login.css, admin.css) travels with its own importer, so it
 * is always available and is allowed everywhere.
 */
const ALWAYS_AVAILABLE = (f: string) => !f.startsWith("app/") || /^app\/(login|admin|beta)/.test(f);

const LOADS: Record<keyof Boundary["used"], string[]> = {
  root: ["app/globals.css"],
  marketing: ["app/globals.css", "app/marketing.css"],
  dashboard: ["app/globals.css", "app/dashboard/dashboard-globals.css", "app/dashboard/dashboard.css", "app/dashboard/dashboard-nova.css"],
};

/** Classes a selector actually styles — `:not()` names who it is *not* for. */
function styledClasses(selector: string): string[] {
  if (/^(html|:root|body)\b/.test(selector.trim())) return [];
  const positive = selector.replace(/:not\(([^()]|\([^()]*\))*\)/g, "");
  return [...positive.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]);
}

function selectorsOf(file: string): string[] {
  const css = readFileSync(join(WEB, file), "utf-8").replace(/\/\*[\s\S]*?\*\//g, " ");
  return [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim()).filter((s) => s && !s.startsWith("@"));
}

/**
 * Note on what is deliberately NOT asserted here: that each file contains only
 * its own namespace. That reads like the obvious guard and it is wrong for this
 * codebase — several rules group families in one selector list
 * (`.cl-mobile-form-grid-3, .cd-responsive-grid-3 { … }`), so a handful of
 * `.cd-*` names legitimately sit in marketing.css and vice versa. A rule has to
 * live where the classes it styles are *used*, and prefixes do not always say
 * that. The reachability tests below assert the property that actually matters.
 */
describe("CSS surface boundary — each stylesheet has exactly one loader", () => {
  const importersOf = (css: string) => {
    const out: string[] = [];
    for (const f of ["app/layout.tsx", "app/(marketing)/layout.tsx", "app/dashboard/layout.tsx"]) {
      const src = readFileSync(join(WEB, f), "utf-8");
      if (new RegExp(`import\\s+"[^"]*${css.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(src)) out.push(f);
    }
    return out;
  };

  it("marketing.css is loaded by the marketing route group only", () => {
    expect(importersOf("marketing.css")).toEqual(["app/(marketing)/layout.tsx"]);
  });

  it("dashboard-globals.css is loaded by the dashboard layout only", () => {
    expect(importersOf("dashboard-globals.css")).toEqual(["app/dashboard/layout.tsx"]);
  });

  it("globals.css is loaded by the root layout only", () => {
    expect(importersOf("./globals.css")).toEqual(["app/layout.tsx"]);
  });
});

describe("CSS surface boundary — the split stays split", () => {
  const sizeOf = (f: string) => readFileSync(join(WEB, f), "utf-8").length;

  // globals.css was 215 KB in the root layout, so every dashboard page paid for
  // the marketing design system. These are ratchets, not targets: they exist so
  // that quietly moving a marketing block back into the shared file shows up as
  // a failing number rather than as a slightly slower page nobody measures.
  it("globals.css stays small enough to be a genuine base layer", () => {
    expect(sizeOf("app/globals.css")).toBeLessThan(75_000);
  });

  it("the marketing design system really lives in marketing.css", () => {
    expect(sizeOf("app/marketing.css")).toBeGreaterThan(100_000);
  });

  it("dashboard-globals.css holds only the hoisted dashboard rules", () => {
    expect(sizeOf("app/dashboard/dashboard-globals.css")).toBeLessThan(45_000);
  });
});

describe("CSS surface boundary — every route can reach the CSS it uses", () => {
  for (const surface of ["root", "marketing", "dashboard"] as const) {
    it(`${surface} routes only use classes defined in a stylesheet they load`, () => {
      const loadable = LOADS[surface];
      const unreachable = boundary.used[surface].filter((cls) => {
        const where = boundary.definedIn[cls] ?? [];
        if (where.some(ALWAYS_AVAILABLE)) return false;
        return !where.some((f) => loadable.includes(f));
      });
      expect(unreachable.map((c) => `.${c} -> ${(boundary.definedIn[c] ?? []).join(", ")}`)).toEqual([]);
    });
  }

  it("the analysis actually saw each surface (a zero-class surface would pass vacuously)", () => {
    expect(boundary.used.marketing.length).toBeGreaterThan(200);
    expect(boundary.used.dashboard.length).toBeGreaterThan(100);
    expect(boundary.used.root.length).toBeGreaterThan(10);
  });
});
