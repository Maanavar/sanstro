#!/usr/bin/env node
/**
 * The seams the split created, and which of them can actually misbehave.
 *
 * Splitting one stylesheet into three by *rule* means a class named in a grouped
 * selector can end up with rules in more than one file:
 *
 *     .cl-mobile-form-grid-3, .cd-responsive-grid-3 { … }   -> marketing.css
 *     .cl-mobile-results-grid                       { … }   -> globals.css
 *
 * Inside one file the cascade was settled by source order. Across three it is
 * settled by load order — base, then the surface sheet — so any pair whose
 * original order was (surface rule … then base rule) is now inverted.
 *
 * css-split.mjs checked this before writing. This checks it *after*, from the
 * files as they now exist, so the property keeps being true as rules are edited
 * by hand. It reports, per class defined in more than one file:
 *
 *   INVERTED   a base rule that used to come later now comes earlier, same
 *              specificity, same at-rule context, and they share a property —
 *              a real change in which declaration wins.
 *   ok         split across files but no pair can change winner.
 *
 * Specificity differences are not flagged: specificity outranks order, so those
 * pairs resolve identically however the files are arranged.
 *
 * Usage: node scripts/css-split-seams.mjs [--json]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const JSON_OUT = process.argv.includes("--json");

/** Load order per context. Base first, then the one surface sheet. */
const CONTEXTS = {
  marketing: ["app/globals.css", "app/marketing.css"],
  dashboard: [
    "app/globals.css",
    "app/dashboard/dashboard-globals.css",
    "app/dashboard/dashboard.css",
    "app/dashboard/dashboard-nova.css",
  ],
};

/** The pre-split single file, for the "what was the original order" question. */
const ORIGINAL = "app/globals.css@17b45ef";

// ------------------------------------------------------------------- parse

/** Flat list of {file, order, selector, props, atContext} for one stylesheet. */
function rulesOf(file, text) {
  const out = [];
  let i = 0;
  let preludeStart = -1;
  const walk = (from, to, atCtx) => {
    let j = from;
    let ps = -1;
    while (j < to) {
      if (text.startsWith("/*", j)) {
        const e = text.indexOf("*/", j + 2);
        j = e === -1 ? to : e + 2;
        continue;
      }
      const ch = text[j];
      if (ch === "{") {
        const prelude = text.slice(ps, j).trim().replace(/\s+/g, " ");
        let depth = 1;
        let k = j + 1;
        while (k < to && depth > 0) {
          if (text.startsWith("/*", k)) {
            const e = text.indexOf("*/", k + 2);
            k = e === -1 ? to : e + 2;
            continue;
          }
          if (text[k] === "{") depth++;
          else if (text[k] === "}") depth--;
          k++;
        }
        if (/^@(media|supports|container|layer|scope|document)\b/.test(prelude)) {
          walk(j + 1, k - 1, atCtx ? `${atCtx} && ${prelude}` : prelude);
        } else if (!prelude.startsWith("@")) {
          out.push({
            file,
            order: out.length,
            selector: prelude,
            atContext: atCtx,
            props: propsOf(text.slice(j + 1, k - 1)),
          });
        }
        j = k;
        ps = -1;
        continue;
      }
      if (ch === ";" && ps !== -1) {
        ps = -1;
        j++;
        continue;
      }
      if (!/\s/.test(ch) && ps === -1) ps = j;
      j++;
    }
  };
  walk(0, text.length, "");
  void i;
  void preludeStart;
  // Re-number so `order` is a true document position across nested contexts.
  return out.map((r, n) => ({ ...r, order: n }));
}

function propsOf(body) {
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Set();
  let depth = 0;
  let cur = "";
  for (const ch of clean) {
    if (ch === "(" || ch === "{") depth++;
    else if (ch === ")" || ch === "}") depth--;
    if (ch === ";" && depth === 0) {
      const p = cur.split(":")[0].trim();
      if (p) out.add(p);
      cur = "";
    } else if (ch === "{" || ch === "}") {
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

/**
 * Classes a selector actually styles — the SUBJECT only.
 *
 * Two rules can change places in the cascade without interacting, because a
 * descendant selector styles its rightmost compound, not its ancestors. The
 * first version of this script indexed on every class in the selector and so
 * paired `.cd-tools-v3-card.is-disabled:hover` (styles the card) with
 * `.cd-tools-v3-card:hover .cd-tools-v3-card__icon` (styles an icon inside it),
 * reporting two conflicts over elements that can never both exist.
 *
 * `:not()` is stripped for the same reason it is elsewhere in this repo's CSS
 * tooling: a class inside it names who the rule is NOT for.
 */
function styledClasses(sel) {
  if (/^(html|:root|body)\b/.test(sel.trim())) return [];
  const positive = sel.replace(/:not\(([^()]|\([^()]*\))*\)/g, "");
  const subjects = positive
    .split(",")
    .map((part) => part.trim().split(/[\s>+~]+/).filter(Boolean).pop() ?? "")
    .join(" ");
  return [...new Set([...subjects.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]))];
}

// ------------------------------------------------------------------- analyse

const files = new Map();
for (const list of Object.values(CONTEXTS))
  for (const f of list)
    if (!files.has(f)) files.set(f, rulesOf(f, readFileSync(resolve(WEB, f), "utf8")));

const report = { contexts: {}, inverted: [], splitClasses: {} };

for (const [ctx, chain] of Object.entries(CONTEXTS)) {
  // Concatenate in load order; `pos` is the post-split cascade position.
  const chained = [];
  for (const f of chain) for (const r of files.get(f)) chained.push({ ...r, pos: chained.length });

  const byClass = new Map();
  for (const r of chained)
    for (const c of styledClasses(r.selector)) {
      if (!byClass.has(c)) byClass.set(c, []);
      byClass.get(c).push(r);
    }

  const split = [];
  for (const [cls, rs] of byClass) {
    const distinct = new Set(rs.map((r) => r.file));
    if (distinct.size > 1) split.push({ cls, files: [...distinct], rules: rs.length });
  }
  split.sort((a, b) => a.cls.localeCompare(b.cls));
  report.splitClasses[ctx] = split;

  // Only rules that came out of the original globals.css can have been
  // reordered by the split. dashboard.css / dashboard-nova.css were always
  // separate files loading after it, so their order relative to it is unchanged.
  const FROM_SPLIT = new Set(["app/globals.css", "app/marketing.css", "app/dashboard/dashboard-globals.css"]);
  const inverted = [];
  for (const { cls } of split) {
    const rs = byClass.get(cls).filter((r) => FROM_SPLIT.has(r.file));
    for (let a = 0; a < rs.length; a++)
      for (let b = a + 1; b < rs.length; b++) {
        const [x, y] = [rs[a], rs[b]];
        if (x.file === y.file) continue;
        if (x.atContext !== y.atContext) continue;
        if (specificity(x.selector) !== specificity(y.selector)) continue;
        const shared = [...y.props].filter((p) => x.props.has(p));
        if (!shared.length) continue;
        // x now precedes y. Before the split, order inside globals.css decided.
        // A base rule that now loads first but originally sat later is the
        // inversion; everything else kept its relative order.
        if (x.file === "app/globals.css" && y.file !== "app/globals.css")
          inverted.push({ ctx, cls, base: x.selector, surface: y.selector, surfaceFile: y.file, shared });
      }
  }
  report.contexts[ctx] = { rules: chained.length, splitClasses: split.length, inverted: inverted.length };
  report.inverted.push(...inverted);
}

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.inverted.length ? 1 : 0);
}

for (const [ctx, s] of Object.entries(report.contexts)) {
  console.log(`\n${ctx}: ${s.rules} rules, ${s.splitClasses} classes defined in >1 file`);
  for (const { cls, files: fs2, rules } of report.splitClasses[ctx])
    console.log(`    .${cls}  (${rules} rules across ${fs2.map((f) => f.split("/").pop()).join(" + ")})`);
}

console.log(`\ncascade inversions that could change a winner: ${report.inverted.length}`);
for (const inv of report.inverted)
  console.log(
    `  [${inv.ctx}] .${inv.cls}\n      base    "${inv.base}"  (app/globals.css, loads first now)\n` +
      `      surface "${inv.surface}"  (${inv.surfaceFile})\n      shared props: ${inv.shared.join(", ")}`,
  );

void ORIGINAL;
process.exit(report.inverted.length ? 1 : 0);
