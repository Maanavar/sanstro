#!/usr/bin/env node
/**
 * Transferred CSS per route, read off a real `next build`.
 *
 * A route's cost is the union of the stylesheets its whole layout chain pulls
 * in, not the row the build manifest prints against its page entry — that row
 * shows only what the leaf adds. Reading the leaf alone makes the dashboard look
 * like it downloads 0 KB of CSS.
 *
 * Usage: npm run build && node scripts/css-budget.mjs
 */
import { readFileSync, statSync } from "node:fs";
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

/** Layout entries that wrap a given page entry, outermost first. */
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

export function cssFor(pageKey) {
  const files = new Set();
  for (const k of chainFor(pageKey)) for (const f of manifest.pages[k]) if (f.endsWith(".css")) files.add(f);
  return [...files];
}

const pages = Object.keys(manifest.pages).filter((k) => k.endsWith("/page"));
const rows = pages
  .map((p) => {
    const files = cssFor(p);
    return { route: p, bytes: files.reduce((a, f) => a + size(f), 0), files };
  })
  .sort((a, b) => b.bytes - a.bytes);

const kb = (n) => (n / 1024).toFixed(1) + "K";
console.log("CSS transferred per route (union over the layout chain)\n");
console.log("  " + "route".padEnd(56) + "CSS");
for (const r of rows) console.log("  " + r.route.padEnd(56) + kb(r.bytes));

const surface = (r) =>
  r.route.startsWith("/dashboard") ? "dashboard" : r.route.startsWith("/login") || r.route.startsWith("/admin") ? "root-only" : "marketing";
const agg = {};
for (const r of rows) {
  const s = surface(r);
  agg[s] ??= { min: Infinity, max: 0, n: 0 };
  agg[s].min = Math.min(agg[s].min, r.bytes);
  agg[s].max = Math.max(agg[s].max, r.bytes);
  agg[s].n++;
}
console.log("\n  surface        routes   min      max");
for (const [s, a] of Object.entries(agg)) console.log("  " + s.padEnd(15) + String(a.n).padEnd(9) + kb(a.min).padEnd(9) + kb(a.max));
