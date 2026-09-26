/**
 * No accent left-border stripe on a dashboard surface (owner ruling).
 *
 * The ruling is old — "anyone can easily tell this work is done by Claude
 * Code" — and it keeps coming back, because the two checks that were supposed
 * to hold it both have a blind spot:
 *
 *  - a source grep for `borderLeft` / `border-left` cannot see the logical
 *    property. DXA-09's live stripe was written `borderInlineStart: 3px solid
 *    ${accent}` and sat on Family & Charts for months;
 *  - the browser probe in `web/scripts/ux-audit-core.mjs` CAN see it, but only
 *    where it looks: it switches top-level tab panes and nothing else, so an
 *    overlay, a sub-tool or a generated report is outside it by construction.
 *
 * So this is the check neither of those is: every spelling, every dashboard
 * file, regardless of whether anything renders it.
 *
 * TWO DIRECTIONS, as with lib/field-style-guard.test.ts. A new stripe fails
 * until it is declared here with a reason, and a declared entry that no longer
 * exists ALSO fails — otherwise the list quietly becomes a record of a past
 * that has already been cleaned up.
 *
 * Scope is the dashboard: `components/dashboard-*.tsx` and `app/dashboard/`.
 * The marketing print tools keep their own sheets and are a separate pass.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * What is left, and why each is a rule rather than an accent stripe.
 *
 * The ruling is about a *card* wearing a coloured edge as decoration. A rule
 * that marks an indent level, or that sets a line of prose apart the way a
 * blockquote does, is a different thing and reads as one.
 */
const DECLARED: Record<string, string> = {
  "components/dashboard-dasha.tsx":
    "timeline spine — an indent rule down a nested dasha/bhukti list, tinted per graha; it marks the level, it is not a card edge",
  "app/dashboard/dashboard-nova.css":
    ".om__rewritten — a blockquote-style rule beside one line of prose ('back after an antardasha turn'), on a <p>, not a boxed surface",
};

const TSX_GLOB = /^dashboard-.*\.tsx$/;

function listFiles(dir: string, keep: (name: string) => boolean): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === "node_modules" || entry === ".next" ? [] : listFiles(full, keep);
    }
    return keep(entry) ? [full] : [];
  });
}

function dashboardSources(): string[] {
  return [
    ...listFiles("components", (n) => TSX_GLOB.test(n)),
    ...listFiles(path.join("app", "dashboard"), (n) => n.endsWith(".tsx") || n.endsWith(".css")),
  ].filter((f) => !f.endsWith(".test.tsx") && !f.endsWith(".test.ts"));
}

/**
 * A coloured inline-start edge of 2 px or more.
 *
 * Both spellings, both syntaxes — `borderLeft: "3px solid X"` and
 * `border-inline-start: 3px solid X` — plus the interpolated form, which is
 * how the DXA-09 stripe was written and why a literal-string search for
 * `var(--color-` missed it.
 *
 * `transparent` is skipped: a 0×0 box with transparent left/right borders is
 * the CSS triangle idiom (an arrow head), not an edge anybody sees.
 */
function accentStripes(source: string): string[] {
  const re = /(borderLeft|borderInlineStart|border-left|border-inline-start)\s*:\s*[`"']?\s*(\d+(?:\.\d+)?)px\s+(solid|dashed|dotted)\s+([^;"'`,}\n]+)/g;
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const [, property, width, , color] = match;
    if (parseFloat(width) < 2) continue;
    if (/transparent/.test(color)) continue;
    found.push(`${property}: ${width}px … ${color.trim()}`);
  }
  return found;
}

describe("no accent left-border stripe on a dashboard surface", () => {
  const offenders = new Map<string, string[]>();
  for (const file of dashboardSources()) {
    const stripes = accentStripes(readFileSync(file, "utf8"));
    if (stripes.length > 0) offenders.set(file.split(path.sep).join("/"), stripes);
  }

  it("finds no undeclared stripe", () => {
    const undeclared = [...offenders.entries()]
      .filter(([file]) => !(file in DECLARED))
      .map(([file, stripes]) => `${file}: ${stripes.join(" | ")}`);

    expect(undeclared).toEqual([]);
  });

  it("keeps the declared list honest", () => {
    const stale = Object.keys(DECLARED).filter((file) => !offenders.has(file));

    expect(stale).toEqual([]);
  });
});
