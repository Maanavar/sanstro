/**
 * UXD-04 — enumerate the dashboard's inline `lang === "ta" ? … : …` bilingual
 * strings into a single reviewable catalog, so a native-Tamil reviewer can audit
 * every user-facing string in one place (the dashboard has no central i18n
 * catalog, unlike marketing's marketing-i18n.ts).
 *
 * This is the enumeration half of UXD-04's acceptance ("a script/lint can
 * enumerate every user-facing string and its Tamil counterpart"). It does NOT
 * migrate anything — the catalog it emits is the input to the migration + review.
 *
 * Usage:  node scripts/extract-dashboard-i18n.mjs
 *         node scripts/extract-dashboard-i18n.mjs --json > docs/dashboard-i18n-catalog.json
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const JSON_OUT = process.argv.includes("--json");
const SCAN_DIRS = ["web/components", "web/app"];
const SKIP_DIRS = new Set([".next", "node_modules", "coverage"]);

// A string literal operand: "…", '…', or `…` (templates without ${} only).
const STR = String.raw`"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\`(?:[^\`\\$]|\\.)*\``;
// lang === "ta" ? <a> : <b>   (also the "en"-first spelling)
const TERNARY = new RegExp(
  String.raw`lang\s*===\s*"(ta|en)"\s*\?\s*(${STR})\s*:\s*(${STR})`,
  "g",
);
// Every lang-conditional site, so we can report extraction coverage.
const ANY_SITE = /lang\s*===\s*"(?:ta|en)"/g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && /\.(t|j)sx?$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function unquote(lit) {
  const q = lit[0];
  let inner = lit.slice(1, -1);
  if (q === "`") inner = inner.replace(/\\`/g, "`");
  else inner = inner.replace(new RegExp(`\\\\${q}`, "g"), q);
  return inner.replace(/\\n/g, " ").trim();
}

function lineOf(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

const entries = [];
let anySites = 0;
let extractedSites = 0;
const perFile = {};

for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, file).replaceAll(path.sep, "/");
    const text = fs.readFileSync(file, "utf8");
    const sites = (text.match(ANY_SITE) || []).length;
    if (!sites) continue;
    anySites += sites;

    let m;
    let fileExtracted = 0;
    TERNARY.lastIndex = 0;
    while ((m = TERNARY.exec(text)) !== null) {
      const [, cond, aLit, bLit] = m;
      const a = unquote(aLit);
      const b = unquote(bLit);
      const ta = cond === "ta" ? a : b;
      const en = cond === "ta" ? b : a;
      entries.push({ file: rel, line: lineOf(text, m.index), en, ta });
      fileExtracted += 1;
    }
    extractedSites += fileExtracted;
    perFile[rel] = { sites, extracted: fileExtracted };
  }
}

// Potential problems worth a reviewer's eye.
const gaps = entries.filter((e) => !e.ta || !e.en || e.ta === e.en);

if (JSON_OUT) {
  process.stdout.write(
    JSON.stringify({ generatedAt: new Date().toISOString(), total: entries.length, entries, gaps }, null, 2) + "\n",
  );
} else {
  console.log(`Dashboard i18n catalog (UXD-04)`);
  console.log(`  files with lang-conditionals : ${Object.keys(perFile).length}`);
  console.log(`  lang-conditional sites       : ${anySites}`);
  console.log(`  simple string pairs extracted: ${extractedSites}`);
  console.log(`  complex/among-JSX (not string literals, need manual review): ${anySites - extractedSites}`);
  console.log(`  potential gaps (empty side or ta === en): ${gaps.length}`);
  console.log(`\nTop files by extractable string count:`);
  Object.entries(perFile)
    .sort((a, b) => b[1].extracted - a[1].extracted)
    .slice(0, 12)
    .forEach(([f, s]) => console.log(`  ${String(s.extracted).padStart(4)}  ${f}  (${s.sites} sites)`));
  if (gaps.length) {
    console.log(`\nGaps (first 20):`);
    gaps.slice(0, 20).forEach((g) => console.log(`  ${g.file}:${g.line}  en=${JSON.stringify(g.en)}  ta=${JSON.stringify(g.ta)}`));
  }
  console.log(`\nRe-run with --json to emit the full catalog (e.g. > docs/dashboard-i18n-catalog.json).`);
}
