#!/usr/bin/env node
/**
 * CSS surface inventory — F4 step 1 of docs/EFFICIENCY_FIX_PLAN_2026-08-07.md.
 *
 * Answers one question per CSS rule: *which surface's rendered tree actually
 * references this selector* — marketing, dashboard, both, or nothing.
 *
 * It does NOT guess from filenames. `components/foo.tsx` tells you nothing about
 * which routes render it, and the plan's step 1 exists precisely because a first
 * pass suggested the dashboard reaches into globals.css through components that
 * are not named `dashboard-*`. So we build the real import graph from the route
 * entry points and take reachability as the answer.
 *
 * Usage:
 *   node scripts/css-inventory.mjs            # summary tables
 *   node scripts/css-inventory.mjs --json out.json
 *   node scripts/css-inventory.mjs --class cd-shell   # explain one class
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rel = (p) => relative(WEB, p).split(sep).join("/");

// ---------------------------------------------------------------- file walk

const SKIP_DIR = new Set(["node_modules", ".next", "test-results", "playwright-report", ".turbo"]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name)) continue;
      walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

const ALL_FILES = walk(WEB);
const CODE_EXT = /\.(tsx|ts|jsx|js|mjs)$/;
const IS_TEST = /\.(test|spec)\.(tsx|ts|jsx|js)$/;

const CODE_FILES = ALL_FILES.filter(
  (p) =>
    CODE_EXT.test(p) &&
    !IS_TEST.test(p) &&
    !rel(p).startsWith("e2e/") &&
    !rel(p).startsWith("tests/") &&
    !rel(p).startsWith("scripts/"),
);

const TEXT = new Map();
const read = (p) => {
  if (!TEXT.has(p)) TEXT.set(p, readFileSync(p, "utf8"));
  return TEXT.get(p);
};

/**
 * Blank out comments, preserving length. This is not optional: this codebase
 * documents its CSS decisions *in prose that names the classes*, so a naive scan
 * reports `.cd-shell` as live on two marketing pages that only mention it in a
 * comment. That error runs in the unsafe direction for a CSS split — a dead
 * class looks used, and gets carried forward forever.
 */
function stripComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      let j = i;
      while (j < n && src[j] !== "\n") j++;
      out += " ".repeat(j - i);
      i = j;
    } else if (c === "/" && d === "*") {
      let j = src.indexOf("*/", i + 2);
      j = j === -1 ? n : j + 2;
      out += src.slice(i, j).replace(/[^\n]/g, " ");
      i = j;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") j += 2;
        else if (src[j] === c) break;
        else j++;
      }
      j = Math.min(j + 1, n);
      out += src.slice(i, j);
      i = j;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

const CODE = new Map();
const readCode = (p) => {
  if (!CODE.has(p)) CODE.set(p, stripComments(read(p)));
  return CODE.get(p);
};

// ------------------------------------------------------------ import graph

const RESOLVE_EXT = ["", ".tsx", ".ts", ".jsx", ".js", ".mjs"];
const INDEXES = ["/index.tsx", "/index.ts", "/index.jsx", "/index.js"];

const CODE_SET = new Set(CODE_FILES.map((p) => p));

function resolveSpecifier(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = join(WEB, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null; // bare package — outside the tree
  for (const ext of RESOLVE_EXT) {
    const cand = base + ext;
    if (CODE_SET.has(cand)) return cand;
  }
  for (const idx of INDEXES) {
    const cand = base + idx;
    if (CODE_SET.has(cand)) return cand;
  }
  return null;
}

// Static `from "x"`, side-effect `import "x"`, dynamic `import("x")`, `require("x")`.
const SPEC_RE = /(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)["'`]([^"'`]+)["'`]/g;

const IMPORTS = new Map(); // file -> Set<file>
const CSS_IMPORTS = new Map(); // file -> Set<cssFile>

for (const f of CODE_FILES) {
  const src = readCode(f);
  const deps = new Set();
  const css = new Set();
  for (const m of src.matchAll(SPEC_RE)) {
    const spec = m[1];
    if (spec.endsWith(".css")) {
      const p = spec.startsWith("@/")
        ? join(WEB, spec.slice(2))
        : spec.startsWith(".")
          ? resolve(dirname(f), spec)
          : null;
      if (p) css.add(p);
      continue;
    }
    const target = resolveSpecifier(spec, f);
    if (target) deps.add(target);
  }
  IMPORTS.set(f, deps);
  CSS_IMPORTS.set(f, css);
}

// ------------------------------------------------------------- route entries

const ROUTE_FILE = /\/(page|layout|template|loading|error|not-found|default|global-error)\.(tsx|ts|jsx|js)$/;

const ROOT_LAYOUT = join(WEB, "app", "layout.tsx");

/** Which surface owns a route file. `app/api/*` is server-only, no CSS. */
function surfaceOf(relPath) {
  if (!relPath.startsWith("app/")) return null;
  if (relPath.startsWith("app/api/")) return null;
  if (relPath === "app/layout.tsx") return "root";
  if (
    relPath.startsWith("app/dashboard/") ||
    relPath.startsWith("app/login/") ||
    relPath.startsWith("app/admin/")
  )
    return "dashboard";
  return "marketing";
}

const entries = { marketing: [], dashboard: [], root: [ROOT_LAYOUT] };
for (const f of CODE_FILES) {
  const r = rel(f);
  if (!ROUTE_FILE.test("/" + r)) continue;
  const s = surfaceOf(r);
  if (!s || s === "root") continue;
  entries[s].push(f);
}

function reachable(roots) {
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const d of IMPORTS.get(f) ?? []) if (!seen.has(d)) stack.push(d);
  }
  return seen;
}

const REACH = {
  marketing: reachable(entries.marketing),
  dashboard: reachable(entries.dashboard),
  root: reachable(entries.root),
};

// The root layout is an ancestor of both surfaces, so anything it pulls in is
// genuinely global and must be counted on both sides.
for (const f of REACH.root) {
  REACH.marketing.add(f);
  REACH.dashboard.add(f);
}

const UNREACHED = CODE_FILES.filter((f) => !REACH.marketing.has(f) && !REACH.dashboard.has(f));

// -------------------------------------------------------------- CSS parsing

/** Strip comments but keep byte offsets stable by blanking them out. */
function blankComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length));
}

const AT_NESTED = /^@(media|supports|container|layer|scope|document)\b/;

/**
 * Flatten to leaf rules. Each carries its own byte length plus a share of any
 * wrapping at-rule's overhead, so the byte columns sum back to the file size.
 */
function parseRules(css, file) {
  const clean = blankComments(css);
  const rules = [];
  const lineAt = (() => {
    const starts = [0];
    for (let i = 0; i < clean.length; i++) if (clean[i] === "\n") starts.push(i + 1);
    return (off) => {
      let lo = 0,
        hi = starts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= off) lo = mid;
        else hi = mid - 1;
      }
      return lo + 1;
    };
  })();

  function scan(start, end, context) {
    let i = start;
    let preludeStart = i;
    while (i < end) {
      const ch = clean[i];
      if (ch === ";" ) {
        // at-rule without a block (@import, @charset)
        const prelude = clean.slice(preludeStart, i).trim();
        if (prelude) {
          rules.push({
            file,
            selector: prelude,
            context,
            bytes: i - preludeStart + 1,
            line: lineAt(preludeStart),
            atOnly: true,
          });
        }
        i++;
        preludeStart = i;
        continue;
      }
      if (ch === "{") {
        const prelude = clean.slice(preludeStart, i).trim();
        // find matching close
        let depth = 1;
        let j = i + 1;
        while (j < end && depth > 0) {
          if (clean[j] === "{") depth++;
          else if (clean[j] === "}") depth--;
          j++;
        }
        const blockEnd = j; // one past the closing brace
        if (AT_NESTED.test(prelude)) {
          rules.push({
            file,
            selector: prelude,
            context,
            bytes: prelude.length + 2, // the wrapper itself
            line: lineAt(preludeStart),
            wrapper: true,
          });
          scan(i + 1, blockEnd - 1, context ? `${context} ${prelude}` : prelude);
        } else {
          rules.push({
            file,
            selector: prelude,
            context,
            bytes: blockEnd - preludeStart,
            line: lineAt(preludeStart),
            body: css.slice(i + 1, blockEnd - 1),
          });
        }
        i = blockEnd;
        preludeStart = i;
        continue;
      }
      i++;
    }
  }

  scan(0, clean.length, "");
  return rules;
}

const CSS_FILES = ALL_FILES.filter((p) => p.endsWith(".css") && !rel(p).startsWith("node_modules"));
const RULES = [];
for (const f of CSS_FILES) RULES.push(...parseRules(read(f), rel(f)));

const CLASS_RE = /\.(-?[A-Za-z_][\w-]*)/g;

function classesIn(selector) {
  const out = new Set();
  // ignore the inside of :not(...) etc.? No — a class named there still must exist.
  for (const m of selector.matchAll(CLASS_RE)) out.add(m[1]);
  return out;
}

for (const r of RULES) r.classes = r.wrapper || r.atOnly ? new Set() : classesIn(r.selector);

/** class -> Set<css file> that define it */
const DEFINED_IN = new Map();
for (const r of RULES) {
  for (const c of r.classes) {
    if (!DEFINED_IN.has(c)) DEFINED_IN.set(c, new Set());
    DEFINED_IN.get(c).add(r.file);
  }
}

const ALL_CLASSES = [...DEFINED_IN.keys()];

// --------------------------------------------------------------- usage scan

// A class token in source is bounded by anything that is not [\w-].
const BOUND = (names) =>
  new RegExp(`(?<![\\w-])(?:${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\w-])`, "g");

const CHUNK = 400;
const USED_BY = new Map(); // class -> Set<file>
for (const c of ALL_CLASSES) USED_BY.set(c, new Set());

const regexes = [];
for (let i = 0; i < ALL_CLASSES.length; i += CHUNK) {
  regexes.push({ names: ALL_CLASSES.slice(i, i + CHUNK), re: BOUND(ALL_CLASSES.slice(i, i + CHUNK)) });
}

// Scan code files, plus any .html/.md that could carry markup.
const SCAN_FILES = [
  ...CODE_FILES,
  ...ALL_FILES.filter((p) => /\.(html|mdx)$/.test(p) && !rel(p).startsWith("node_modules")),
];

for (const f of SCAN_FILES) {
  const src = CODE_EXT.test(f) ? readCode(f) : read(f);
  for (const { re } of regexes) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) USED_BY.get(m[0]).add(f);
  }
}

// Dynamically composed class names — `cl-${x}`, "cd-" + x — defeat the scan above.
const DYNAMIC_RE = /["'`]([a-z][\w]*-)(?:\$\{|"\s*\+|'\s*\+)/g;
const DYNAMIC = new Map(); // prefix -> Set<file>
for (const f of CODE_FILES) {
  for (const m of readCode(f).matchAll(DYNAMIC_RE)) {
    if (!DYNAMIC.has(m[1])) DYNAMIC.set(m[1], new Set());
    DYNAMIC.get(m[1]).add(f);
  }
}

// ------------------------------------------------------- surface attribution

function surfacesFor(files) {
  let m = false,
    d = false;
  for (const f of files) {
    if (REACH.marketing.has(f)) m = true;
    if (REACH.dashboard.has(f)) d = true;
    if (m && d) break;
  }
  if (m && d) return "both";
  if (m) return "marketing";
  if (d) return "dashboard";
  return files.size ? "orphan-only" : "unused";
}

const CLASS_SURFACE = new Map();
for (const c of ALL_CLASSES) CLASS_SURFACE.set(c, surfacesFor(USED_BY.get(c)));

/** A rule is needed by a surface if ANY of its classes is used there (safe direction). */
function ruleSurface(r) {
  if (r.wrapper || r.atOnly) return "wrapper";
  if (r.classes.size === 0) return "element"; // element/attribute/:root selectors — global
  let m = false,
    d = false,
    orphan = false;
  for (const c of r.classes) {
    const s = CLASS_SURFACE.get(c);
    if (s === "both") return "both";
    if (s === "marketing") m = true;
    else if (s === "dashboard") d = true;
    else if (s === "orphan-only") orphan = true;
  }
  if (m && d) return "both";
  if (m) return "marketing";
  if (d) return "dashboard";
  if (orphan) return "orphan-only";
  return "unused";
}

for (const r of RULES) r.surface = ruleSurface(r);

// --------------------------------------------------------------- namespaces

function nsOf(cls) {
  const m = /^(cl|clf|cd|mk|site|as|ui|nv)-/.exec(cls);
  return m ? m[1] + "-*" : "(other)";
}

function ruleNs(r) {
  if (r.classes.size === 0) return "(no class)";
  const seen = new Set([...r.classes].map(nsOf));
  return seen.size === 1 ? [...seen][0] : "(mixed)";
}

// ------------------------------------------------------------------ reports

const args = process.argv.slice(2);
const jsonAt = args.indexOf("--json");
const classAt = args.indexOf("--class");
const fileArg = args.indexOf("--file");
const TARGET_CSS = fileArg >= 0 ? args[fileArg + 1] : "app/globals.css";

/**
 * Class tokens that appear together on one element. `className="card cl-tile"`
 * means both `.card` and `.cl-tile` style that element, so any split has to keep
 * their relative cascade order — and that pairing is invisible in the CSS.
 * Template-literal chunks are split on `${...}` so the static tokens around an
 * interpolation still count.
 */
function sourceClassSets() {
  const sets = [];
  const known = new Set(ALL_CLASSES);
  const ATTR = /\bclass(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\})/g;
  const TPL = /`([^`]*)`/g;
  for (const f of CODE_FILES) {
    const src = readCode(f);
    const push = (raw) => {
      const toks = raw
        .split(/\$\{[^}]*\}/)
        .join(" ")
        .split(/\s+/)
        .filter((t) => known.has(t));
      if (toks.length > 1) sets.push([...new Set(toks)].sort());
    };
    for (const m of src.matchAll(ATTR)) push(m[1] ?? m[2] ?? m[3] ?? m[4] ?? "");
    // className={`a ${x} b`} and cn("a", "b") style helpers land here too.
    for (const m of src.matchAll(TPL)) push(m[1]);
  }
  return sets;
}

if (args.includes("--emit-classes")) {
  // Machine-readable surface verdict per class, consumed by css-split.mjs so the
  // split and the inventory can never disagree about who owns a class.
  process.stdout.write(
    JSON.stringify({
      classSurface: Object.fromEntries(CLASS_SURFACE),
      definedIn: Object.fromEntries([...DEFINED_IN].map(([c, s]) => [c, [...s]])),
      sourceClassSets: sourceClassSets(),
    }),
  );
  process.exit(0);
}

const pad = (s, n) => String(s).padEnd(n);
const num = (n) => String(n).padStart(9);
const kb = (n) => (n / 1024).toFixed(1) + "K";

if (classAt >= 0) {
  const c = args[classAt + 1].replace(/^\./, "");
  const defs = [...(DEFINED_IN.get(c) ?? [])];
  console.log(`\n.${c}`);
  console.log(`  defined in : ${defs.join(", ") || "(nowhere)"}`);
  console.log(`  surface    : ${CLASS_SURFACE.get(c) ?? "(unknown class)"}`);
  const users = [...(USED_BY.get(c) ?? [])];
  console.log(`  used by    : ${users.length} file(s)`);
  for (const f of users.slice(0, 40)) {
    const tags = [];
    if (REACH.marketing.has(f)) tags.push("M");
    if (REACH.dashboard.has(f)) tags.push("D");
    if (!tags.length) tags.push("orphan");
    console.log(`      [${tags.join("+")}] ${rel(f)}`);
  }
  const rules = RULES.filter((r) => r.classes.has(c));
  console.log(`  rules      : ${rules.length}`);
  for (const r of rules.slice(0, 30))
    console.log(`      ${pad(r.file + ":" + r.line, 34)} ${pad(r.surface, 12)} ${r.selector.slice(0, 70)}`);
  process.exit(0);
}

const target = RULES.filter((r) => r.file === TARGET_CSS);
const total = target.reduce((a, r) => a + r.bytes, 0);

console.log(`\n═══ ${TARGET_CSS} — ${target.length} rules, ${total} bytes accounted\n`);

console.log(`── Entry points ──`);
console.log(`  marketing routes : ${entries.marketing.length}  →  ${REACH.marketing.size} modules reachable`);
console.log(`  dashboard routes : ${entries.dashboard.length}  →  ${REACH.dashboard.size} modules reachable`);
console.log(`  root layout pulls: ${REACH.root.size} modules (counted on both surfaces)`);
console.log(`  reachable from neither: ${UNREACHED.length} modules`);

const byNs = new Map();
for (const r of target) {
  const ns = ruleNs(r);
  if (!byNs.has(ns)) byNs.set(ns, {});
  const b = byNs.get(ns);
  b[r.surface] = (b[r.surface] ?? 0) + r.bytes;
  b.total = (b.total ?? 0) + r.bytes;
}

console.log(`\n── Bytes by namespace × surface ──`);
console.log(
  `  ${pad("namespace", 12)}${num("total")}${num("both")}${num("marketing")}${num("dashboard")}${num("global")}${num("unused")}`,
);
const nsRows = [...byNs.entries()].sort((a, b) => b[1].total - a[1].total);
for (const [ns, b] of nsRows) {
  console.log(
    `  ${pad(ns, 12)}${num(b.total)}${num(b.both ?? 0)}${num(b.marketing ?? 0)}${num(b.dashboard ?? 0)}${num((b.element ?? 0) + (b.wrapper ?? 0))}${num((b.unused ?? 0) + (b["orphan-only"] ?? 0))}`,
  );
}

const bySurface = new Map();
for (const r of target) bySurface.set(r.surface, (bySurface.get(r.surface) ?? 0) + r.bytes);
console.log(`\n── Bytes by surface ──`);
for (const [s, b] of [...bySurface.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`  ${pad(s, 14)} ${num(b)}  ${kb(b)}  ${((b / total) * 100).toFixed(1)}%`);

// The number F4 step 1 exists to produce.
const dashNeeds = [...new Set(target.filter((r) => r.surface === "dashboard" || r.surface === "both").flatMap((r) => [...r.classes]))]
  .filter((c) => CLASS_SURFACE.get(c) === "dashboard" || CLASS_SURFACE.get(c) === "both")
  .sort();

console.log(`\n── Classes defined in ${TARGET_CSS} that DASHBOARD-reachable code uses: ${dashNeeds.length} ──`);
for (const c of dashNeeds) {
  const alsoIn = [...DEFINED_IN.get(c)].filter((f) => f !== TARGET_CSS);
  const users = [...USED_BY.get(c)].filter((f) => REACH.dashboard.has(f));
  const onlyDash = CLASS_SURFACE.get(c) === "dashboard";
  console.log(
    `  ${pad("." + c, 34)} ${pad(onlyDash ? "D-only" : "both", 8)} ${pad(users.length + " user(s)", 12)}${alsoIn.length ? " ALSO IN " + alsoIn.join(",") : ""}`,
  );
}

const collisions = ALL_CLASSES.filter((c) => {
  const d = DEFINED_IN.get(c);
  return d.has(TARGET_CSS) && [...d].some((f) => f.startsWith("app/dashboard/"));
}).sort();
console.log(`\n── Name collisions: defined in BOTH ${TARGET_CSS} and a dashboard stylesheet: ${collisions.length} ──`);
for (const c of collisions) console.log(`  .${c}   ${[...DEFINED_IN.get(c)].join("  ")}`);

const dead = [...new Set(target.flatMap((r) => [...r.classes]))]
  .filter((c) => USED_BY.get(c).size === 0)
  .sort();
console.log(`\n── Classes defined in ${TARGET_CSS} referenced by NO source file: ${dead.length} ──`);
const deadBytes = target
  .filter((r) => r.classes.size > 0 && [...r.classes].every((c) => USED_BY.get(c).size === 0))
  .reduce((a, r) => a + r.bytes, 0);
console.log(`  (${deadBytes} bytes / ${kb(deadBytes)} in rules where EVERY class is unreferenced)`);
const deadByNs = new Map();
for (const c of dead) deadByNs.set(nsOf(c), (deadByNs.get(nsOf(c)) ?? 0) + 1);
for (const [ns, n] of [...deadByNs.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${pad(ns, 12)} ${n}`);

console.log(`\n── Dynamically composed class prefixes (the scan above cannot see these) ──`);
for (const [prefix, files] of [...DYNAMIC.entries()].sort()) {
  const surf = surfacesFor(files);
  console.log(`  ${pad(prefix + "${…}", 16)} ${pad(surf, 12)} ${[...files].map(rel).slice(0, 4).join(", ")}`);
}

if (jsonAt >= 0) {
  const out = {
    generated: new Date().toISOString(),
    target: TARGET_CSS,
    totals: Object.fromEntries(bySurface),
    namespaces: Object.fromEntries(nsRows),
    dashboardNeedsFromTarget: dashNeeds.map((c) => ({
      class: c,
      surface: CLASS_SURFACE.get(c),
      definedIn: [...DEFINED_IN.get(c)],
      users: [...USED_BY.get(c)].map(rel),
    })),
    collisions: collisions.map((c) => ({ class: c, definedIn: [...DEFINED_IN.get(c)] })),
    dead,
    deadBytes,
    unreachedModules: UNREACHED.map(rel),
  };
  writeFileSync(args[jsonAt + 1], JSON.stringify(out, null, 2));
  console.log(`\nwrote ${args[jsonAt + 1]}`);
}
console.log();
