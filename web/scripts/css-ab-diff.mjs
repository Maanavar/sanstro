#!/usr/bin/env node
/**
 * Diffs two css-ab.spec.ts capture directories.
 *
 *   node scripts/css-ab-diff.mjs <before-dir> <after-dir>
 *
 * A capture is keyed by `tagName + sorted class list`, holding the computed
 * styles of the first element with that combination. So a difference here means
 * the browser resolved a different declaration for that combination — which is
 * the only thing the split could have changed.
 *
 * Three outcomes are reported separately, because they mean different things:
 *
 *   STYLE CHANGE   a key present on both sides whose computed values differ.
 *                  This is the finding. Everything else is context.
 *   DOM DRIFT      a key on one side only. Content moved (a different "today",
 *                  a list one item longer), not styling. Reported so the run
 *                  can be judged, never counted as a regression.
 *   DOC METRICS    scrollWidth vs innerWidth, element count. A page that lost
 *                  its stylesheet overflows horizontally, which shows here even
 *                  when every individual key still matches.
 *
 * Expected non-empty result: F5 deliberately changed the scrollbar colours, so
 * the `probes` values SHOULD differ. A run reporting zero probe changes means
 * the capture did not reach a themed shell, not that F5 was a no-op.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const [beforeDir, afterDir] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!beforeDir || !afterDir) {
  console.error("usage: node scripts/css-ab-diff.mjs <before-dir> <after-dir>");
  process.exit(2);
}
const VERBOSE = process.argv.includes("--verbose");

const load = (dir) => {
  const out = new Map();
  for (const f of readdirSync(resolve(dir)).filter((f) => f.endsWith(".json")))
    out.set(f.replace(/\.json$/, ""), JSON.parse(readFileSync(join(resolve(dir), f), "utf8")));
  return out;
};

const before = load(beforeDir);
const after = load(afterDir);

const onlyBefore = [...before.keys()].filter((k) => !after.has(k));
const onlyAfter = [...after.keys()].filter((k) => !before.has(k));
if (onlyBefore.length || onlyAfter.length) {
  console.log("captures present on one side only:");
  for (const k of onlyBefore) console.log(`  before only: ${k}`);
  for (const k of onlyAfter) console.log(`  after only : ${k}`);
  console.log("");
}

let totalStyleChanges = 0;
let totalUnstable = 0;
let totalKeys = 0;
const summary = [];

/** A key naming at least one class — the stable kind. See the note below. */
const KEYED = /\./;

for (const name of [...before.keys()].filter((k) => after.has(k)).sort()) {
  const b = before.get(name);
  const a = after.get(name);

  const shared = Object.keys(b.styles).filter((k) => k in a.styles);
  totalKeys += shared.length;
  const changes = [];
  const unstable = [];
  for (const key of shared) {
    const diffs = [];
    for (const [prop, val] of Object.entries(b.styles[key])) {
      const av = a.styles[key][prop];
      if (av !== val) diffs.push({ prop, before: val, after: av });
    }
    if (!diffs.length) continue;
    // A tag-only key ("p", "button", "section") is the first element of that tag
    // carrying no class at all — and which element that is moves whenever the
    // page renders different content. On /tools/indraiya-rasipalan one run had
    // the results loaded and the other did not, so "p" was a paragraph of body
    // copy on one side and a 10.88px uppercase label on the other: 9 property
    // differences describing two unrelated elements. Class combinations do not
    // have this problem, which is why they are the real key. These are split out
    // rather than dropped, because a genuine change to an element-selector rule
    // (`body`, `a`, `h2`) would also land here and still deserves a look.
    if (KEYED.test(key)) changes.push({ key, diffs });
    else unstable.push({ key, diffs });
  }
  totalStyleChanges += changes.length;
  totalUnstable += unstable.length;

  const driftB = Object.keys(b.styles).filter((k) => !(k in a.styles)).length;
  const driftA = Object.keys(a.styles).filter((k) => !(k in b.styles)).length;

  const probeDiffs = Object.entries(b.probes ?? {})
    .filter(([p, v]) => (a.probes ?? {})[p] !== v)
    .map(([p, v]) => `${p}: ${v} -> ${(a.probes ?? {})[p]}`);
  const varDiffs = Object.entries(b.vars ?? {})
    .filter(([p, v]) => (a.vars ?? {})[p] !== v)
    .map(([p, v]) => `${p}: ${v} -> ${(a.vars ?? {})[p]}`);

  const overflowB = b.docScrollWidth > b.innerWidth + 1;
  const overflowA = a.docScrollWidth > a.innerWidth + 1;

  summary.push({ name, shared: shared.length, changed: changes.length, driftB, driftA, overflowB, overflowA });

  const interesting = changes.length || probeDiffs.length || varDiffs.length || overflowB !== overflowA;
  if (!interesting && !VERBOSE) continue;

  console.log(`\n=== ${name} ===`);
  console.log(
    `    keys compared ${shared.length}  ·  changed ${changes.length}  ·  ` +
      `dom-drift ${driftB} before-only / ${driftA} after-only`,
  );
  if (overflowB !== overflowA)
    console.log(
      `    HORIZONTAL OVERFLOW CHANGED: before ${b.docScrollWidth}/${b.innerWidth} -> after ${a.docScrollWidth}/${a.innerWidth}`,
    );
  for (const d of varDiffs) console.log(`    var   ${d}`);
  for (const d of probeDiffs) console.log(`    probe ${d}   (F5 scrollbars — a change here is expected)`);
  for (const { key, diffs } of changes.slice(0, VERBOSE ? changes.length : 25)) {
    console.log(`    ${key}`);
    for (const d of diffs) console.log(`        ${d.prop}: ${d.before}  ->  ${d.after}`);
  }
  if (!VERBOSE && changes.length > 25) console.log(`    … ${changes.length - 25} more (pass --verbose)`);
}

console.log("\n────────────────────────────────────────────────────────");
console.log(`captures compared : ${summary.length}`);
console.log(`class combinations: ${totalKeys}`);
console.log(`style changes     : ${totalStyleChanges}`);
console.log("");
for (const s of summary)
  console.log(
    `  ${s.changed === 0 ? "ok  " : "DIFF"}  ${s.name.padEnd(46)} ${String(s.shared).padStart(5)} keys` +
      `  ${String(s.changed).padStart(4)} changed  drift ${s.driftB}/${s.driftA}`,
  );

process.exit(totalStyleChanges ? 1 : 0);
