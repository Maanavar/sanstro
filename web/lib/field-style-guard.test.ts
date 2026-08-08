/**
 * Hand-rolled form-control styling, held to a declared list.
 *
 * The reason this guard exists is NOT that nine copies of `fieldStyle` looked
 * slightly different. It is that every one of them was applied to a raw
 * `<input style={fieldStyle}>`, and a raw input carries no `aria-invalid`, no
 * `aria-describedby`, no `role="alert"` — and in the dashboard's case, no
 * accessible name at all, because the captions beside those inputs were
 * `<span>`s, or `<label>`s with neither `htmlFor` nor the control nested inside.
 * `components/ui/field.tsx` provides all of that. The visual drift is what
 * people noticed; the missing wiring is what actually mattered.
 *
 * So the pattern being banned is the *declaration* — a `CSSProperties` constant
 * that paints a control box (a border AND padding) outside `components/ui/`.
 * That is the shape a tenth copy would take, and catching the declaration
 * catches it before it is applied to anything.
 *
 * TWO DIRECTIONS, as with lib/orphan-scan.test.ts. A new copy fails until it is
 * declared here with a reason, and a declared entry that no longer exists ALSO
 * fails — otherwise this list silently becomes a record of a past that has been
 * cleaned up, which is how the comment in dashboard-yoga-dosham-panel came to
 * insist no shared planet-name helper existed while `tPlanetLord` served ten
 * surfaces (F2).
 *
 * See docs/EFFICIENCY_FIX_PLAN_2026-08-07.md F10.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * What is left, and why each is left rather than migrated.
 *
 * Both survivors are unreachable code, so migrating them would have meant
 * restyling something no user can load. Neither is an exemption for new work.
 */
const DECLARED: Record<string, string> = {
  // One of F11's 13 orphaned files. Superseded by dashboard-tools-porutham-nova.
  // Deleting it is F11 step 2 and needs per-file approval; restyling a file
  // queued for deletion would be waste.
  "components/porutham-panel.tsx":
    "orphan (F11) — not imported anywhere; superseded by dashboard-tools-porutham-nova",

  // A dead COMPONENT inside a live module. The file is imported, but only for
  // its five helpers (ACTIVITY_OPTIONS, currentMonthIso, formatShortDate,
  // formatWeekday, alignmentTone) by dashboard-today-deepdive-extras-nova.
  // `DashboardActivityTimingCard` — the only thing that reads this constant —
  // has no consumers; NovaActivityTimingCard superseded it. The orphan scan
  // works at file granularity and cannot see this, which is worth knowing.
  "components/dashboard-activity-timing-card.tsx":
    "live module, dead component — only DashboardActivityTimingCard reads it, and nothing renders that",

  // The four [M] marketing tools. These are NOT a simple swap: `.ui-input` and
  // friends are defined only as `[data-ui="nova"] .cd-shell .ui-*` in
  // dashboard-nova.css, which marketing does not load at all after the F4
  // split, and no marketing page renders `.cd-shell`. Migrating these would
  // render browser-default controls on SEO-indexed pages. They also already
  // nest their inputs inside their `<label>`, so unlike the dashboard copies
  // they do have accessible names — the a11y gap was concentrated in [D].
  "app/(marketing)/tools/muhurta-calculator/MuhurtaTool.tsx":
    "[M] — kit CSS is scoped to the Nova dashboard shell; needs its own pass",
  "app/(marketing)/tools/jadhagam-generator/JadhagamTool.tsx":
    "[M] — kit CSS is scoped to the Nova dashboard shell; needs its own pass",
  "app/(marketing)/tools/daily-panchangam-planner/PanchangamTool.tsx":
    "[M] — kit CSS is scoped to the Nova dashboard shell; needs its own pass",
  "app/(marketing)/tools/friendship-compatibility/FriendshipTool.tsx":
    "[M] — kit CSS is scoped to the Nova dashboard shell; needs its own pass",
};

const ROOTS = ["app", "components"];
/** The kit itself, plus the Classic stack it is replacing, may define these. */
const EXEMPT_DIRS = [path.join("components", "ui"), path.join("components", "form")];
/** dashboard-ui.tsx is the Classic Field/TextInput/Select the kit supersedes. */
const EXEMPT_FILES = [path.join("components", "dashboard-ui.tsx")];

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

/**
 * Find `const <name> ... = { ... }` object literals that paint a control box.
 *
 * Brace-counted per declaration, so a nested object cannot leak its `padding`
 * into an unrelated constant. Both a `border` shorthand and a `padding` are
 * required — a card, tile or print-table cell typically sets one, not both.
 */
function controlBoxDeclarations(source: string): string[] {
  const found: string[] = [];
  const declRe = /const\s+([A-Za-z0-9_$]*(?:Style|STYLE))\s*(?::[^=]+)?=\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = declRe.exec(source)) !== null) {
    let depth = 1;
    let i = declRe.lastIndex;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") depth -= 1;
      i += 1;
    }
    const body = source.slice(declRe.lastIndex, i - 1);
    const hasBorder = /(^|[\s,{])border\s*:/.test(body);
    const hasPadding = /(^|[\s,{])padding\s*:/.test(body);
    if (hasBorder && hasPadding) found.push(match[1]);
  }
  return found;
}

/**
 * Names used as the `style` of a raw `<input>` / `<select>` / `<textarea>`.
 *
 * The declaration alone is not the defect — `nova-select.tsx`'s `triggerStyle`
 * is the same shape and is correct, because it styles a `<button>` inside a
 * shared component that supplies its own `aria-*`. What makes it F10's defect is
 * a control box landing on a RAW form control, which is precisely the element
 * that then carries no `aria-invalid`, no `aria-describedby` and, in every
 * dashboard case found here, no accessible name.
 *
 * Keying on both halves is also what stops this guard rotting into noise: the
 * first version flagged a print-table cell, two card surfaces and a tile, and a
 * guard that cries wolf gets an allowlist entry rather than a fix.
 */
function rawControlStyleNames(source: string): Set<string> {
  const names = new Set<string>();
  const tagRe = /<(input|select|textarea)\b/g;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(source)) !== null) {
    // Walk to the tag's real end. A naive `[^>]*` stops at the first `>`, which
    // in this codebase is almost always the arrow in `onChange={(e) => …}` — so
    // any `style` written AFTER the handler went unseen. That is how the first
    // version of this scan reported MuhurtaTool and FriendshipTool as already
    // clean while both still carried a live `inputStyle`.
    let depth = 0;
    let i = match.index + match[0].length;
    for (; i < source.length; i += 1) {
      const ch = source[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      else if (ch === ">" && depth === 0) break;
    }
    const attrs = source.slice(match.index + match[0].length, i);
    const styleAt = attrs.indexOf("style={");
    if (styleAt === -1) continue;
    let d = 0;
    let j = styleAt + "style=".length;
    for (; j < attrs.length; j += 1) {
      if (attrs[j] === "{") d += 1;
      else if (attrs[j] === "}") {
        d -= 1;
        if (d === 0) break;
      }
    }
    for (const ident of attrs.slice(styleAt, j).matchAll(/[A-Za-z0-9_$]*(?:Style|STYLE)\b/g)) {
      if (ident[0] !== "style") names.add(ident[0]);
    }
  }
  return names;
}

function scan(): Map<string, string[]> {
  const hits = new Map<string, string[]>();
  for (const root of ROOTS) {
    for (const file of listFiles(root)) {
      const rel = file.split(path.sep).join("/");
      const native = file;
      if (EXEMPT_DIRS.some((d) => native.startsWith(d + path.sep))) continue;
      if (EXEMPT_FILES.includes(native)) continue;
      const source = readFileSync(file, "utf8");
      const applied = rawControlStyleNames(source);
      const names = controlBoxDeclarations(source).filter((n) => applied.has(n));
      if (names.length > 0) hits.set(rel, names);
    }
  }
  return hits;
}

describe("hand-rolled form-control styling (F10)", () => {
  it("declares every file that still paints its own control box", () => {
    const undeclared = [...scan().keys()].filter((f) => !(f in DECLARED)).sort();
    expect(
      undeclared,
      "New hand-rolled field styling. Use Field/FieldShell/Input/Select/Textarea " +
        "from components/ui/field.tsx — a raw <input style={...}> carries no " +
        "aria-invalid, no aria-describedby, and usually no accessible name.",
    ).toEqual([]);
  });

  it("has no stale entries — a declared file that was cleaned up must be removed here", () => {
    const present = new Set(scan().keys());
    const stale = Object.keys(DECLARED).filter((f) => !present.has(f)).sort();
    expect(
      stale,
      "These files no longer define a control box, so their entry above is now " +
        "a false record. Delete the entry.",
    ).toEqual([]);
  });

  it("detects the exact shape that shipped, and does not fire on a card", () => {
    // Verbatim from dashboard-plan-whatif-nova.tsx before this pass.
    const shipped = `const fieldStyle: React.CSSProperties = {
      borderRadius: "var(--radius-md)",
      border: "1.5px solid var(--color-border)",
      background: "var(--color-surface-soft)",
      padding: "var(--space-2) var(--space-3)",
    };`;
    expect(controlBoxDeclarations(shipped)).toEqual(["fieldStyle"]);

    // A rounded surface with padding but no border is not a control box.
    const card = `const cardStyle: React.CSSProperties = {
      borderRadius: "var(--radius-md)",
      padding: "var(--space-4)",
    };`;
    expect(controlBoxDeclarations(card)).toEqual([]);

    // A nested object must not leak its padding into the outer declaration.
    const nested = `const wrapStyle: React.CSSProperties = {
      border: "1px solid red",
    };
    const otherStyle = { inner: { padding: "4px" } };`;
    expect(controlBoxDeclarations(nested)).toEqual([]);
  });

  it("only counts a control box that reaches a raw form control", () => {
    // Both real forms the deleted copies were applied in, including the spread.
    expect(rawControlStyleNames(`<input style={fieldStyle} type="date" />`)).toEqual(
      new Set(["fieldStyle"]),
    );
    expect(
      rawControlStyleNames(`<input style={{ ...novaFieldStyle, minWidth: "140px" }} type="month" />`),
    ).toEqual(new Set(["novaFieldStyle"]));
    expect(rawControlStyleNames(`<textarea style={{ ...fieldStyle, resize: "vertical" }} />`)).toEqual(
      new Set(["fieldStyle"]),
    );

    // nova-select.tsx's triggerStyle is the same declaration shape on a <button>
    // — a shared control that supplies its own aria-*. Not this rule's business.
    expect(rawControlStyleNames(`<button style={triggerStyle} aria-haspopup="listbox" />`)).toEqual(
      new Set(),
    );

    // The regression that made this scan lie: `style` after an arrow handler.
    // The `>` in `=>` is not the end of the tag.
    expect(
      rawControlStyleNames(`<input value={p.name} onChange={(e) => set(e.target.value)} style={inputStyle} />`),
    ).toEqual(new Set(["inputStyle"]));
  });

  it("recognises the kit's own controls as not raw", () => {
    // The migration's end state: no style prop, aria wiring from <Field>.
    expect(rawControlStyleNames(`<Input type="date" value={d} onChange={f} />`)).toEqual(new Set());
  });

  it("keeps the kit itself reachable — field.tsx still exports the replacements", () => {
    const kit = readFileSync(path.join("components", "ui", "field.tsx"), "utf8");
    for (const name of ["Field", "FieldShell", "Input", "Select", "Textarea"]) {
      expect(kit).toContain(`export function ${name}(`);
    }
  });
});
