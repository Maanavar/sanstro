#!/usr/bin/env node
/**
 * Delete CSS rules whose every class is referenced by nothing — F4 step 5's
 * remaining ~13 KB in marketing.css.
 *
 * F4 step 5 already did this once, by hand, and deleted 13 live rules. This
 * exists so the second attempt cannot repeat that, and so the decision is
 * reviewable rather than a 300-line diff someone has to take on trust.
 *
 * ── The three nets, and which one was missing ──────────────────────────────
 *
 * 1. Every class in the selector must be unreferenced. 623ad59's pruner had
 *    this net and its commit message describes it correctly: it "refuses any
 *    grouped selector in which a single class is still referenced".
 *
 * 2. No class in the selector may be interpolation-constructible. **This is the
 *    net that was missing.** Net 1 guards *grouped* selectors, and every rule
 *    that broke was a standalone rule for a single modifier class:
 *
 *        cx("as-rasi", `as-rasi--${item.tone}`)
 *
 *    No literal `as-rasi--fire` exists in the tree, so "is this class used?"
 *    answers no — correctly, and uselessly. scripts/css-dynamic-class-audit.mjs
 *    answers the other question, and this refuses to delete anything it names.
 *
 * 3. The rule must have at least one class. Element selectors, `:root`, and
 *    at-rule wrappers are never candidates — "no classes" is not "no classes
 *    used".
 *
 * ── Why it refuses rather than warns ───────────────────────────────────────
 *
 * Both instruments answer "is this used?" by searching source, which is a
 * narrower question than it appears (see the caution at the end of the plan
 * doc — four separate searches in this repo have returned a confident, wrong,
 * *smaller* number). So a clean run here is a necessary condition for a prune,
 * never a sufficient one: the rendered A/B is what actually licenses it.
 *
 *   node scripts/css-prune.mjs --file app/marketing.css            # dry run
 *   node scripts/css-prune.mjs --file app/marketing.css --write
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const fileAt = args.indexOf("--file");
const TARGET = fileAt >= 0 ? args[fileAt + 1] : "app/marketing.css";
const WRITE = args.includes("--write");

// ------------------------------------------------------------- instruments

const tmp = mkdtempSync(join(tmpdir(), "css-prune-"));
const invPath = join(tmp, "inv.json");

execFileSync(process.execPath, [join(WEB, "scripts/css-inventory.mjs"), "--file", TARGET, "--json", invPath], {
  cwd: WEB,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const inv = JSON.parse(readFileSync(invPath, "utf8"));

const auditRaw = execFileSync(process.execPath, [join(WEB, "scripts/css-dynamic-class-audit.mjs"), "--json"], {
  cwd: WEB,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
const audit = JSON.parse(auditRaw.replace(/^﻿/, ""));

const DEAD = new Set(inv.dead);
const AT_RISK = new Set(audit.atRisk);

// A broken audit reports nothing, and "nothing is at risk" is indistinguishable
// from "the scan found no interpolations". Refuse rather than prune on silence.
if (AT_RISK.size < 50) {
  console.error(
    `REFUSING: the dynamic-class audit reports only ${AT_RISK.size} at-risk classes. ` +
      `That is the shape of a broken scan, and it is the exact net F4 step 5 lacked.`,
  );
  process.exit(2);
}

// --------------------------------------------------------------- rule parse

/** Blank comments, preserving offsets, so slices index the original text. */
function blankComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

const AT_NESTED = /^@(media|supports|container|layer|scope|document)\b/;
const CLASS_RE = /\.(-?[A-Za-z_][\w-]*)/g;

/**
 * Leaf rules with explicit offsets into the ORIGINAL text, so a deletion is a
 * verbatim splice rather than a re-serialisation. css-inventory.mjs parses the
 * same way but records only line and byte-length; the offsets are what let this
 * produce a deletions-only diff.
 */
function parseRules(css) {
  const clean = blankComments(css);
  const rules = [];

  function scan(start, end) {
    let i = start;
    let preludeStart = i;
    while (i < end) {
      const ch = clean[i];
      if (ch === ";") {
        i++;
        preludeStart = i;
        continue;
      }
      if (ch === "{") {
        const prelude = clean.slice(preludeStart, i).trim();
        let depth = 1;
        let j = i + 1;
        while (j < end && depth > 0) {
          if (clean[j] === "{") depth++;
          else if (clean[j] === "}") depth--;
          j++;
        }
        const blockEnd = j;
        if (AT_NESTED.test(prelude)) {
          scan(i + 1, blockEnd - 1);
        } else {
          rules.push({
            selector: prelude,
            start: preludeStart,
            end: blockEnd,
            classes: new Set([...prelude.matchAll(CLASS_RE)].map((m) => m[1])),
          });
        }
        i = blockEnd;
        preludeStart = i;
        continue;
      }
      i++;
    }
  }

  scan(0, clean.length);
  return rules;
}

const path = resolve(WEB, TARGET);
const original = readFileSync(path, "utf8");
const rules = parseRules(original);

// ------------------------------------------------------------- the decision

const doomed = [];
const skipped = [];

for (const r of rules) {
  if (r.classes.size === 0) continue; // net 3

  const live = [...r.classes].filter((c) => !DEAD.has(c));
  const risky = [...r.classes].filter((c) => AT_RISK.has(c));

  if (risky.length) {
    skipped.push({ r, why: `interpolation builds ${risky.map((c) => "." + c).join(" ")}` });
    continue; // net 2
  }
  if (live.length) {
    skipped.push({ r, why: `still referenced: ${live.map((c) => "." + c).join(" ")}` });
    continue; // net 1
  }
  doomed.push(r);
}

// ------------------------------------------------------------------ report

const bytes = doomed.reduce((a, r) => a + (r.end - r.start), 0);
console.log(`target: ${TARGET}  (${original.length} bytes, ${rules.length} leaf rules)`);
console.log(`dead classes: ${DEAD.size}   at-risk (interpolation-built): ${AT_RISK.size}\n`);

console.log(`── WOULD DELETE: ${doomed.length} rules, ${bytes} bytes (${(bytes / 1024).toFixed(1)}K) ──`);
for (const r of doomed) console.log(`  ${r.selector.replace(/\s+/g, " ")}`);

const risky = skipped.filter((s) => s.why.startsWith("interpolation"));
console.log(`\n── SKIPPED because an interpolation can build them: ${risky.length} ──`);
for (const s of risky) console.log(`  ${s.r.selector.replace(/\s+/g, " ")}   <- ${s.why}`);

const jsonAt = args.indexOf("--json");
if (jsonAt >= 0) {
  writeFileSync(
    resolve(args[jsonAt + 1]),
    JSON.stringify(
      {
        target: TARGET,
        bytes,
        rules: doomed.map((r) => ({ selector: r.selector.replace(/\s+/g, " "), classes: [...r.classes] })),
        classes: [...new Set(doomed.flatMap((r) => [...r.classes]))].sort(),
        skippedAsRisky: risky.map((s) => s.r.selector.replace(/\s+/g, " ")),
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`\nwrote ${args[jsonAt + 1]}`);
}

if (!WRITE) {
  console.log(`\n(dry run — pass --write to apply)`);
  process.exit(0);
}

// ------------------------------------------------------------------- splice

let out = "";
let cursor = 0;
for (const r of [...doomed].sort((a, b) => a.start - b.start)) {
  out += original.slice(cursor, r.start);
  cursor = r.end;
  // Swallow the newline the rule occupied so deletions do not leave blank gaps.
  if (original[cursor] === "\n") cursor++;
}
out += original.slice(cursor);

// Deletions only: every character of the result must appear, in order, in the
// original. Cheap to assert and it rules out an accidental re-serialisation.
let k = 0;
for (const ch of out) {
  k = original.indexOf(ch, k);
  if (k === -1) throw new Error("result is not a subsequence of the input — refusing to write");
  k++;
}

writeFileSync(path, out, "utf8");
console.log(`\nwrote ${TARGET}: ${original.length} -> ${out.length} bytes (-${original.length - out.length})`);
