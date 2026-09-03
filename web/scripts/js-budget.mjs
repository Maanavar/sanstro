#!/usr/bin/env node
/**
 * Transferred JS per route, and which module is responsible — the sibling of
 * css-budget.mjs, and for the same reason.
 *
 * `next build`'s "First Load JS" column is rounded to three significant figures
 * and is a per-route total, so it answers "is this page heavy" and not "did the
 * thing I moved actually leave". Two different bundles both print as 273 kB.
 * This reads app-build-manifest.json directly, unions the whole layout chain
 * the way css-budget.mjs does, and can also say which chunks contain a given
 * package — so "posthog-js is no longer in what / downloads" is checkable
 * rather than inferred from a number that did not move.
 *
 * Usage:
 *   node scripts/js-budget.mjs                     per-route totals
 *   node scripts/js-budget.mjs --find posthog      which routes ship a module
 *   node scripts/js-budget.mjs --json out.json     machine-readable snapshot
 */
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NEXT = resolve(WEB, ".next");

let manifest;
try {
  manifest = JSON.parse(readFileSync(resolve(NEXT, "app-build-manifest.json"), "utf8"));
} catch {
  console.error("no .next/app-build-manifest.json — run `npm run build` first");
  process.exit(2);
}

const size = (f) => {
  try {
    return statSync(resolve(NEXT, f)).size;
  } catch {
    return 0;
  }
};

/** Layout entries that wrap a page entry, outermost first. Same rule as
 *  css-budget.mjs: reading a page's own row shows only what the leaf adds. */
function chainFor(pageKey) {
  const parts = pageKey.replace(/\/page$/, "").split("/").filter(Boolean);
  const keys = ["/layout"];
  let acc = "";
  for (const p of parts) {
    acc += "/" + p;
    keys.push(acc + "/layout");
  }
  keys.push(pageKey);
  return keys.filter((k) => manifest.pages[k]);
}

function jsFor(pageKey) {
  const files = new Set();
  for (const k of chainFor(pageKey)) for (const f of manifest.pages[k]) if (f.endsWith(".js")) files.add(f);
  return [...files];
}

const pages = Object.keys(manifest.pages).filter((k) => k.endsWith("/page"));
const rows = pages
  .map((p) => {
    const files = jsFor(p);
    return { route: p, bytes: files.reduce((a, f) => a + size(f), 0), files };
  })
  .sort((a, b) => b.bytes - a.bytes);

const kb = (n) => (n / 1024).toFixed(1) + "K";

const findAt = process.argv.indexOf("--find");
if (findAt >= 0) {
  const needle = process.argv[findAt + 1];
  if (!needle) {
    console.error("--find needs a string");
    process.exit(2);
  }
  // Read each chunk once and ask whether the module's code is in it. Crude and
  // exactly right for the question: if the string is in a file a route loads
  // eagerly, that route downloads it.
  const chunkCache = new Map();
  const contains = (f) => {
    if (!chunkCache.has(f)) {
      try {
        chunkCache.set(f, readFileSync(resolve(NEXT, f), "utf8").includes(needle));
      } catch {
        chunkCache.set(f, false);
      }
    }
    return chunkCache.get(f);
  };

  const hits = rows.map((r) => ({ route: r.route, chunks: r.files.filter(contains) })).filter((r) => r.chunks.length);
  console.log(`Routes whose eagerly-loaded JS contains "${needle}": ${hits.length} of ${rows.length}\n`);
  const byChunk = new Map();
  for (const h of hits) for (const c of h.chunks) byChunk.set(c, (byChunk.get(c) ?? 0) + 1);
  for (const [c, n] of [...byChunk].sort((a, b) => b[1] - a[1]))
    console.log(`  ${c}  (${kb(size(c))}, on ${n} route(s))`);
  console.log("");
  for (const h of hits.slice(0, 15)) console.log(`  ${h.route}`);
  if (hits.length > 15) console.log(`  … ${hits.length - 15} more`);
  process.exit(0);
}

const jsonAt = process.argv.indexOf("--json");
if (jsonAt >= 0) {
  writeFileSync(
    resolve(process.argv[jsonAt + 1]),
    JSON.stringify(Object.fromEntries(rows.map((r) => [r.route, r.bytes])), null, 1),
    "utf8",
  );
  console.log(`wrote ${process.argv[jsonAt + 1]} (${rows.length} routes)`);
  process.exit(0);
}

console.log("JS transferred per route (union over the layout chain, uncompressed)\n");
console.log("  " + "route".padEnd(56) + "JS");
for (const r of rows.slice(0, 25)) console.log("  " + r.route.padEnd(56) + kb(r.bytes));

const surface = (r) =>
  r.route.startsWith("/dashboard")
    ? "dashboard"
    : r.route.startsWith("/login") || r.route.startsWith("/admin")
      ? "root-only"
      : "marketing";
const agg = {};
for (const r of rows) {
  const s = surface(r);
  agg[s] ??= { min: Infinity, max: 0, n: 0 };
  agg[s].min = Math.min(agg[s].min, r.bytes);
  agg[s].max = Math.max(agg[s].max, r.bytes);
  agg[s].n++;
}
console.log("\n  surface        routes   min      max");
for (const [s, a] of Object.entries(agg))
  console.log("  " + s.padEnd(15) + String(a.n).padEnd(9) + kb(a.min).padEnd(9) + kb(a.max));
