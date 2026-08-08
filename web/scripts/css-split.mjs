#!/usr/bin/env node
/**
 * F4 steps 2-3 — partition app/globals.css into three stylesheets by surface.
 *
 *   app/globals.css                    root layout      — ships on every route
 *   app/marketing.css                  (marketing) group — the Clarity system
 *   app/dashboard/dashboard-globals.css dashboard layout — dashboard-only rules
 *
 * Three things make this more than a text move.
 *
 * 1. ORDER. globals.css is one file, so its cascade is settled by source order.
 *    Three files load base -> surface, so a base rule that originally sat after
 *    a surface rule now sits before it. Where those two have equal specificity
 *    and share a property, that is a silent visual change. This refuses to write
 *    until it has listed every such pair — including pairs found via the class
 *    combinations that actually occur in the source, not just identical
 *    selectors.
 *
 * 2. AT-RULES. One @media block can hold rules bound for different files, so it
 *    is reproduced in each destination carrying only its own children.
 *
 * 3. REVIEWABILITY. The moved text is copied verbatim and spliced out of the
 *    original rather than regenerated from the parse tree, so globals.css's diff
 *    is deletions only and the new files are byte-for-byte slices of what was
 *    already reviewed. A pretty-printer here would produce a 7,900-line diff
 *    that no one can check.
 *
 * Run with --check to analyse without writing.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(WEB, "app/globals.css");
const CHECK = process.argv.includes("--check");

const inv = JSON.parse(
  execFileSync(process.execPath, [resolve(WEB, "scripts/css-inventory.mjs"), "--emit-classes"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }),
);
// Every destination here is decided by reachability, so the graph has to be
// whole. One unresolved local import makes whatever it pointed at invisible to
// that surface, and the classes below it get filed where that surface cannot
// load them — silently, and only on the surface nobody opens during review.
if (inv.unresolved?.length) {
  console.error(`refusing to split: ${inv.unresolved.length} unresolved local import(s) — the module graph is incomplete\n`);
  for (const u of inv.unresolved) console.error("  " + u);
  process.exit(1);
}

const CLASS_SURFACE = new Map(Object.entries(inv.classSurface));
const src = readFileSync(SRC, "utf8");

// ------------------------------------------------------------------- parse

/**
 * Nodes carry absolute offsets into `src`:
 *   {kind, start, end, selector?, bodyStart?, bodyEnd?, children?}
 * `start` is the first character of the node's own text (its prelude), not of
 * the whitespace before it.
 */
function parse(from, to) {
  const nodes = [];
  let i = from;
  let preludeStart = -1;

  const startPrelude = (k) => {
    if (preludeStart === -1) preludeStart = k;
  };

  while (i < to) {
    if (src.startsWith("/*", i)) {
      const e = src.indexOf("*/", i + 2);
      const stop = e === -1 ? to : e + 2;
      if (preludeStart === -1) nodes.push({ kind: "comment", start: i, end: stop });
      i = stop;
      continue;
    }
    const ch = src[i];
    if (ch === "{") {
      const prelude = src.slice(preludeStart, i);
      let depth = 1;
      let j = i + 1;
      while (j < to && depth > 0) {
        if (src.startsWith("/*", j)) {
          const e = src.indexOf("*/", j + 2);
          j = e === -1 ? to : e + 2;
          continue;
        }
        if (src[j] === "{") depth++;
        else if (src[j] === "}") depth--;
        j++;
      }
      const sel = prelude.trim().replace(/\s+/g, " ");
      const node = { start: preludeStart, end: j, selector: sel, bodyStart: i + 1, bodyEnd: j - 1 };
      if (/^@(media|supports|container|layer|scope|document)\b/.test(sel)) {
        node.kind = "at";
        node.children = parse(i + 1, j - 1);
      } else {
        node.kind = "rule";
      }
      nodes.push(node);
      i = j;
      preludeStart = -1;
      continue;
    }
    if (ch === ";" && preludeStart !== -1) {
      nodes.push({ kind: "stmt", start: preludeStart, end: i + 1 });
      i++;
      preludeStart = -1;
      continue;
    }
    if (!/\s/.test(ch)) startPrelude(i);
    i++;
  }
  return nodes;
}

// -------------------------------------------------------------- destination

const MARKETING_NS = /^(cl|clf|mk|site|as)-/;
const DASHBOARD_NS = /^cd-/;

const classesIn = (sel) => [...sel.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]);

/**
 * Where a rule belongs. Measured usage decides; namespace is only the
 * tie-breaker for rules no source file references, so unused Clarity CSS still
 * stops shipping to the dashboard even though nothing proves who owned it.
 */
function destOf(sel) {
  // A root-anchored rule is global however it is written. The live example is
  // `html:not(:has(.cd-shell)) { color-scheme: light }` — a rule that exists
  // *for* marketing, expressed by naming the dashboard's class. Reading
  // ownership off that class name would move it into the dashboard file and
  // hand dark-OS visitors dark form controls on the cream pages again (MKT-19).
  if (/^(html|:root|body)\b/.test(sel.trim())) return "base";
  if (/^@/.test(sel)) return "base"; // @font-face, @keyframes, @property — global
  // Classes inside :not() say who a rule is NOT for, so they cannot own it.
  const positive = sel.replace(/:not\(([^()]|\([^()]*\))*\)/g, "");
  const cls = classesIn(positive);
  if (cls.length === 0) return "base";
  let m = false,
    d = false,
    seen = false;
  for (const c of cls) {
    const s = CLASS_SURFACE.get(c);
    if (s === "both") return "base";
    if (s === "marketing") ((m = true), (seen = true));
    else if (s === "dashboard") ((d = true), (seen = true));
  }
  if (m && d) return "base";
  if (m) return "marketing";
  if (d) return "dashboard";
  if (!seen) {
    const ns = cls.map((c) => (MARKETING_NS.test(c) ? "marketing" : DASHBOARD_NS.test(c) ? "dashboard" : "base"));
    if (ns.every((x) => x === "marketing")) return "marketing";
    if (ns.every((x) => x === "dashboard")) return "dashboard";
  }
  return "base";
}

const tree = parse(0, src.length);

/** An @media block's destination set = the destinations of its children. */
function destsOf(node) {
  if (node.kind === "rule") return new Set([destOf(node.selector)]);
  if (node.kind === "at") {
    const out = new Set();
    for (const c of node.children) for (const d of destsOf(c)) out.add(d);
    return out.size ? out : new Set(["base"]);
  }
  return new Set(["base"]);
}

const flat = [];
(function collect(list, ctx) {
  for (const nd of list) {
    if (nd.kind === "rule") flat.push({ node: nd, ctx, dest: destOf(nd.selector) });
    else if (nd.kind === "at") collect(nd.children, ctx ? ctx + " && " + nd.selector : nd.selector);
  }
})(tree, "");

// --------------------------------------------------------- order-inversion

const targetsOf = (sel) => sel.split(",").map((s) => s.trim().replace(/\s+/g, " ")).filter(Boolean);

function propsOf(node) {
  const body = src.slice(node.bodyStart, node.bodyEnd).replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Set();
  let depth = 0,
    cur = "";
  for (const ch of body) {
    if (ch === "(" || ch === "{") depth++;
    else if (ch === ")" || ch === "}") depth--;
    if (ch === ";" && depth === 0) {
      const p = cur.split(":")[0].trim();
      if (p) out.add(p);
      cur = "";
    } else cur += ch;
  }
  const p = cur.split(":")[0].trim();
  if (p) out.add(p);
  return out;
}

function specificity(sel) {
  const s = sel.replace(/::[\w-]+/g, "");
  const ids = (s.match(/#[\w-]+/g) || []).length;
  const cls = (s.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+(\([^)]*\))?/g) || []).length;
  const els = (s.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) || []).length;
  return ids * 10000 + cls * 100 + els;
}

const conflicts = [];
function comparePair(early, late, why, elem) {
  if (early.dest === late.dest || late.dest !== "base") return;
  if (early.ctx !== late.ctx) return;
  if (specificity(early.node.selector) !== specificity(late.node.selector)) return;
  const lp = propsOf(late.node),
    ep = propsOf(early.node);
  const shared = [...lp].filter((p) => ep.has(p));
  if (shared.length) conflicts.push({ why, elem, early, late, shared });
}

// (a) same selector text
{
  const byTarget = new Map();
  for (const f of flat)
    for (const t of targetsOf(f.node.selector)) {
      if (!byTarget.has(t)) byTarget.set(t, []);
      byTarget.get(t).push(f);
    }
  for (const [t, list] of byTarget)
    for (let a = 0; a < list.length; a++)
      for (let b = a + 1; b < list.length; b++) comparePair(list[a], list[b], "same-selector", t);
}

// (b) different selectors that match one real element
const classSets = [...new Set((inv.sourceClassSets ?? []).map((s) => s.join(" ")))].map((s) => new Set(s.split(" ")));
{
  const keys = flat.map((f) => ({
    f,
    keys: targetsOf(f.node.selector).map((t) => classesIn(t.split(/[\s>+~]+/).filter(Boolean).pop() ?? "")),
  }));
  for (const S of classSets) {
    const hit = keys.filter(({ keys: k }) => k.some((kk) => kk.length && kk.every((c) => S.has(c))));
    for (let a = 0; a < hit.length; a++)
      for (let b = a + 1; b < hit.length; b++)
        comparePair(hit[a].f, hit[b].f, "co-occurring", [...S].join("."));
  }
}

const counts = {},
  bytes = {};
for (const f of flat) {
  counts[f.dest] = (counts[f.dest] ?? 0) + 1;
  bytes[f.dest] = (bytes[f.dest] ?? 0) + (f.node.end - f.node.start);
}
console.log(`rules: ${flat.length}`);
console.log("by destination:", counts);
console.log("rule bytes:", Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, (v / 1024).toFixed(1) + "K"])));
console.log(`\ncascade conflicts: ${conflicts.length} (over ${classSets.length} real class combinations)`);
const seenPair = new Set();
for (const c of conflicts) {
  const k = c.early.node.selector + "|" + c.late.node.selector;
  if (seenPair.has(k)) continue;
  seenPair.add(k);
  console.log(`  [${c.why}] on ${c.elem}\n      "${c.early.node.selector}" (${c.early.dest}, wins today)\n      "${c.late.node.selector}" (base, would win after split)\n      props: ${c.shared.join(", ")}`);
}

if (CHECK) process.exit(conflicts.length ? 1 : 0);
if (conflicts.length) {
  console.error("\nrefusing to write: resolve the conflicts above first");
  process.exit(1);
}

// ------------------------------------------------------------------- emit

/**
 * A comment sitting immediately above a rule (only whitespace between) documents
 * that rule, so it travels with it. Everything else stays where it is.
 */
function attachedCommentStart(list, idx) {
  let start = list[idx].start;
  for (let k = idx - 1; k >= 0; k--) {
    const prev = list[k];
    if (prev.kind !== "comment") break;
    if (src.slice(prev.end, start).trim() !== "") break;
    start = prev.start;
  }
  return start;
}

/** Verbatim text for one destination, plus the spans to remove from base. */
function extract(list, dest, indent = "") {
  let out = "";
  const cuts = [];
  for (let i = 0; i < list.length; i++) {
    const nd = list[i];
    if (nd.kind === "rule") {
      if (destOf(nd.selector) !== dest) continue;
      const from = attachedCommentStart(list, i);
      out += src.slice(from, nd.end).replace(/^/gm, indent).trimStart() + "\n\n";
      cuts.push([from, nd.end]);
    } else if (nd.kind === "at") {
      const ds = destsOf(nd);
      if (!ds.has(dest)) continue;
      const inner = extract(nd.children, dest, indent + "  ");
      if (!inner.text.trim()) continue;
      const from = attachedCommentStart(list, i);
      if (ds.size === 1) {
        // whole block belongs to this destination
        out += src.slice(from, nd.end).replace(/^/gm, indent).trimStart() + "\n\n";
        cuts.push([from, nd.end]);
      } else {
        const prelude = src.slice(nd.start, nd.bodyStart - 1).trim();
        out += indent + prelude + " {\n" + inner.text.trimEnd() + "\n" + indent + "}\n\n";
        cuts.push(...inner.cuts);
      }
    }
  }
  return { text: out, cuts };
}

const HEADER = (title, note) =>
  `/* ═══════════════════════════════════════════════════════════════════════════
   ${title}
   ${note}

   Split out of app/globals.css — see docs/EFFICIENCY_FIX_PLAN_2026-08-07.md F4.
   Re-derive which surface uses a class with:
       node scripts/css-inventory.mjs
   ═══════════════════════════════════════════════════════════════════════════ */

`;

const marketing = extract(tree, "marketing");
const dashboard = extract(tree, "dashboard");

// Splice the moved spans out of globals.css, back to front.
const allCuts = [...marketing.cuts, ...dashboard.cuts].sort((a, b) => b[0] - a[0]);
let base = src;
let prevStart = Infinity;
for (const [a, b] of allCuts) {
  if (b > prevStart) throw new Error(`overlapping cut ${a}-${b}`);
  base = base.slice(0, a) + base.slice(b);
  prevStart = a;
}
base = base.replace(/\n{4,}/g, "\n\n\n");

const outputs = [
  [resolve(WEB, "app/globals.css"), base],
  [
    resolve(WEB, "app/marketing.css"),
    HEADER(
      "MARKETING — loaded by app/(marketing)/layout.tsx only",
      'The "Clarity" system (.cl-* / .clf-*) plus .mk-*, .site-* and .as-*.\n   No dashboard route downloads any of this.',
    ) + marketing.text,
  ],
  [
    resolve(WEB, "app/dashboard/dashboard-globals.css"),
    HEADER(
      "DASHBOARD COMPONENT CSS — hoisted out of globals.css",
      "Rules only signed-in routes render. Imported by app/dashboard/layout.tsx\n   before dashboard.css, so the Nova theme layers still win.",
    ) + dashboard.text,
  ],
];

for (const [p, text] of outputs) {
  writeFileSync(p, text, "utf8");
  console.log(`wrote ${p.replace(WEB, "web")} — ${(text.length / 1024).toFixed(1)}K`);
}
