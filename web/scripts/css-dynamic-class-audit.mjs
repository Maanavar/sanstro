#!/usr/bin/env node
/**
 * Classes a usage scan cannot see, because the source builds their names.
 *
 *     className={`as-topic__mark as-topic__mark--${index}`}
 *
 * A scanner that splits template literals on `${…}` — which is what
 * css-inventory.mjs does, deliberately, so the static tokens around an
 * interpolation still count — sees `as-topic__mark` and never sees
 * `as-topic__mark--0`. The class is live in the browser and dead on paper.
 *
 * That is not a hypothetical. F4 step 5 pruned "unreferenced" rules and deleted
 * `.as-topic__mark--0` … `--3`, which position, size and colour the four marks
 * `<AstroTopic>` renders. They lost their offsets too, so all four collapse to
 * the same spot. It shipped in 623ad59 and no test saw it; it was found by
 * diffing computed styles on a rendered page.
 *
 * Two modes:
 *
 *   node scripts/css-dynamic-class-audit.mjs
 *       Lists every interpolation prefix found in source and every class
 *       currently defined that only a prefix could have produced. These are the
 *       rules a future prune must not delete.
 *
 *   node scripts/css-dynamic-class-audit.mjs --since <ref>
 *       Additionally reports classes that existed in <ref> and are gone now,
 *       which some prefix could have constructed — i.e. deletions that were
 *       probably wrong. Exits non-zero if any are found.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { stripComments } from "./lib/strip-comments.mjs";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(WEB, "..");
const sinceAt = process.argv.indexOf("--since");
const SINCE = sinceAt >= 0 ? process.argv[sinceAt + 1] : null;

const SKIP = /node_modules|\.next|\.git|test-results|playwright-report|\.artifacts/;
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (SKIP.test(p)) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const FILES = walk(WEB);
const relWeb = (f) => relative(WEB, f).replace(/\\/g, "/");

/**
 * Only the *application* builds class names that reach a browser. Tooling and
 * specs merely name them, and counting those inverts what this audit is for.
 *
 * Two concrete false positives this excludes, both of which made the audit
 * useless for the job it was written to protect — F4 step 5's remaining prune:
 *
 *   - `scripts/css-inventory.mjs:413` explains its DYNAMIC_RE with the example
 *     `cl-${x}` **in a comment**. That invented a bare `cl-` prefix, so all ~400
 *     `.cl-*` classes reported "invisible to a usage scan, do not delete" — the
 *     entire marketing namespace, including every rule the prune is meant to
 *     consider. A guard that flags everything answers nothing, and this repo's
 *     own record (F10) is that a guard which cries wolf earns an allowlist entry
 *     rather than a fix.
 *   - `e2e/css-ab.spec.ts` names `as-rasi--${…}` because it *asserts* on those
 *     classes. Asserting on a class does not render it.
 *
 * The real interpolations survive on their own merit: `as-rasi--`, `as-nak--`
 * and `as-topic__mark--` all come from `components/astro-symbols.tsx`, and the
 * three genuine `cl-` families from the marketing pages that build them.
 *
 * Same predicate as css-inventory.mjs's CODE_FILES, deliberately — the two
 * instruments answer opposite halves of one question and must scan one corpus.
 */
const CODE = FILES.filter(
  (f) =>
    /\.(tsx?|jsx?|mjs)$/.test(f) &&
    !/\.test\.[tj]sx?$/.test(f) &&
    !/\.spec\.[tj]sx?$/.test(f) &&
    !relWeb(f).startsWith("scripts/") &&
    !relWeb(f).startsWith("e2e/") &&
    !relWeb(f).startsWith("tests/"),
);
const CSS_NOW = ["app/globals.css", "app/marketing.css", "app/dashboard/dashboard-globals.css", "app/dashboard/dashboard.css", "app/dashboard/dashboard-nova.css"];

const classesInCss = (text) =>
  new Set([...text.replace(/\/\*[\s\S]*?\*\//g, " ").matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]));

/**
 * Static text that immediately precedes an interpolation, reduced to the
 * trailing class-name fragment. `as-topic__mark--${index}` yields
 * "as-topic__mark--"; `cd-tab ${active ? …}` yields "" and is dropped, because
 * a prefix ending at a space builds a whole separate token, not a longer name.
 */
function interpolationPrefixes() {
  const prefixes = new Map(); // prefix -> Set(file)
  for (const f of CODE) {
    // Comments stripped: this file's own header documents the bug it guards
    // against using a real interpolation, and so does css-inventory.mjs. Prose
    // that names a class is not a class.
    const src = stripComments(readFileSync(f, "utf8"));
    for (const m of src.matchAll(/`([^`]*)`/g)) {
      const tpl = m[1];
      for (const seg of tpl.matchAll(/([A-Za-z_][\w-]*)\$\{/g)) {
        const prefix = seg[1];
        // Require the fragment to look like a modifier stem: a bare word before
        // `${}` is usually a whole class or unrelated string interpolation, so
        // demand a BEM-ish separator to keep the signal honest.
        if (!/[-_]$/.test(prefix) && !/--$/.test(prefix)) continue;
        if (!prefixes.has(prefix)) prefixes.set(prefix, new Set());
        prefixes.get(prefix).add(relative(WEB, f).replace(/\\/g, "/"));
      }
    }
  }
  return prefixes;
}

const PREFIXES = interpolationPrefixes();

const nowClasses = new Set();
for (const f of CSS_NOW) {
  try {
    for (const c of classesInCss(readFileSync(resolve(WEB, f), "utf8"))) nowClasses.add(c);
  } catch {
    /* file may not exist in every checkout */
  }
}

const matchable = (cls) => [...PREFIXES.keys()].filter((p) => cls.startsWith(p) && cls.length > p.length);

if (process.argv.includes("--json")) {
  // Consumed by lib/css-dynamic-class.test.ts. `byPrefix` is the useful shape:
  // a prefix whose list empties out is a family a prune has just removed.
  const byPrefix = {};
  for (const p of PREFIXES.keys())
    byPrefix[p] = [...nowClasses].filter((c) => c.startsWith(p) && c.length > p.length).sort();
  process.stdout.write(
    JSON.stringify({
      prefixes: Object.fromEntries([...PREFIXES].map(([p, f]) => [p, [...f].sort()])),
      byPrefix,
      atRisk: [...nowClasses].filter((c) => matchable(c).length).sort(),
    }),
  );
  process.exit(0);
}

console.log("Interpolation prefixes found in source (a usage scan cannot expand these):\n");
for (const [p, files] of [...PREFIXES].sort()) {
  const hits = [...nowClasses].filter((c) => c.startsWith(p) && c.length > p.length).sort();
  console.log(`  ${p}\${…}   from ${[...files].join(", ")}`);
  console.log(`      currently defined and only reachable this way: ${hits.length ? hits.map((h) => "." + h).join(" ") : "(none)"}`);
}

if (!SINCE) {
  const atRisk = [...nowClasses].filter((c) => matchable(c).length).sort();
  console.log(`\n${atRisk.length} class(es) are defined but invisible to a usage scan. A prune must not delete these.`);
  process.exit(0);
}

// --- deletions since <ref> that an interpolation could have constructed ---
const show = (ref, path) => {
  try {
    return execFileSync("git", ["show", `${ref}:${path}`], { cwd: REPO, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return "";
  }
};

const thenClasses = new Set();
for (const f of ["web/app/globals.css", "web/app/marketing.css", "web/app/dashboard/dashboard-globals.css", "web/app/dashboard/dashboard.css", "web/app/dashboard/dashboard-nova.css"]) {
  const t = show(SINCE, f);
  if (t) for (const c of classesInCss(t)) thenClasses.add(c);
}

const deleted = [...thenClasses].filter((c) => !nowClasses.has(c)).sort();
const suspect = deleted.filter((c) => matchable(c).length);

console.log(`\n────────────────────────────────────────────────────────`);
console.log(`classes defined at ${SINCE}: ${thenClasses.size}   now: ${nowClasses.size}   deleted: ${deleted.length}`);
console.log(`\nDeleted classes that an interpolation in source can still construct — these were live:\n`);
if (!suspect.length) console.log("  (none)");
for (const c of suspect) console.log(`  .${c}      built by  ${matchable(c).map((p) => p + "${…}").join(", ")}`);

process.exit(suspect.length ? 1 : 0);
