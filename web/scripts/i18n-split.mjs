#!/usr/bin/env node
/**
 * Split `lib/marketing-i18n.ts` into one module per page, keeping the original
 * path as a re-export barrel so no import site changes.
 *
 * WHY, measured (docs/EFFICIENCY_FIX_PLAN_2026-08-07.md F7): all 63 exports of
 * this 524 KB module land in ONE webpack commons chunk that 117 of 121 marketing
 * routes download eagerly. `/learn/what-is-chandrashtama` — a 55-line page —
 * ships the Thirunallar temple's full English description. The import map is
 * already clean (every page imports exactly its own slice); what is missing is
 * module granularity for webpack to act on.
 *
 * TWO THINGS ARE REQUIRED AND NEITHER WORKS ALONE. Probed before writing this:
 *
 *   - `sideEffects` in package.json, alone: inline exports stay on all 117
 *     routes. No change whatsoever.
 *   - this split, alone (no `sideEffects`): the extracted module STILL ships to
 *     all 117. Without the flag webpack must assume importing any module has
 *     side effects, so an unused `export *` cannot be dropped.
 *   - both: 117 -> 1.
 *
 * So if someone ever removes `"sideEffects"` from package.json, this split
 * silently stops paying and the tree just looks more fragmented. That is what
 * `lib/marketing-i18n-split.test.ts` is for.
 *
 * The barrel stays at `lib/marketing-i18n.ts` while the domains live in
 * `lib/marketing-i18n/`. A file beats a directory in both TS and webpack
 * resolution, so `@/lib/marketing-i18n` keeps meaning the barrel — which is why
 * all 63 import sites are untouched by this.
 *
 * Usage:  node scripts/i18n-split.mjs [--dry]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(WEB, "lib/marketing-i18n.ts");
const DIR = resolve(WEB, "lib/marketing-i18n");
const DRY = process.argv.includes("--dry");

/**
 * export-name stem (trailing `_FAQ` stripped) -> module slug.
 *
 * Explicit rather than derived from a prefix rule, because the grouping question
 * is "which page renders this", and only a person knows that. The script refuses
 * to run if an export is missing a home, so a 64th export fails loudly here
 * instead of quietly landing back in the shared chunk.
 */
const HOME_OF = {
  // Chrome — rendered by PublicNav / PublicFooter, so genuinely on every page.
  NAV: "chrome", FOOTER: "chrome",
  // Shared leaves.
  FAITH_NOTE: "devotional", FAQ_HEADING: "devotional", LEGAL: "legal",
  BETA: "beta", HOME: "home",
  // Features.
  FEAT_DAILY: "feat-daily", FEAT_FAMILY: "feat-family",
  FEAT_CHART: "feat-chart", FEAT_TIMING: "feat-timing",
  FAMILY_PAGE: "family-page",
  // Tools.
  TOOL_PORUTHAM: "tool-porutham", TOOL_NUMEROLOGY: "tool-numerology",
  TOOL_JADHAGAM: "tool-jadhagam", TOOL_PANCH: "tool-panchangam", TOOL_BTR: "tool-btr",
  // Learn.
  LEARN_THIRUK: "learn-thirukanitham", LEARN_PORUTHAM: "learn-porutham",
  LEARN_CHANDRA: "learn-chandrashtama", LEARN_JAD: "learn-jadhagam",
  LEARN_BIRTH: "learn-birth-time",
  // Trust.
  TRUST_METHOD: "trust-methodology", TRUST_ABOUT: "trust-about",
  // Natchathiram.
  NATCHATHIRAM_INDEX: "natchathiram-index", NATCHATHIRAM_DETAIL: "natchathiram-detail",
  NATCHATHIRAM_VISUAL: "natchathiram-visual",
  // Dosham — one module per page; each is ~120 lines and only its own page reads it.
  DOSHAM_INDEX: "dosham-index", YOGAM_INDEX: "yogam-index",
  DOSHAM_SEVVAI: "dosham-sevvai", DOSHAM_NAGA: "dosham-naga",
  DOSHAM_KALA_SARPA: "dosham-kala-sarpa", DOSHAM_PITHRU: "dosham-pithru",
  DOSHAM_KALATHRA: "dosham-kalathra",
  // Pariharam.
  PARIHARAM_INDEX: "pariharam-index", PARIHARAM_MARRIAGE: "pariharam-marriage",
  PARIHARAM_RAHU_KETU: "pariharam-rahu-ketu", PARIHARAM_SEVVAI: "pariharam-sevvai",
  PARIHARAM_NAGA: "pariharam-naga", PARIHARAM_KADAN: "pariharam-kadan",
  PARIHARAM_PUTHRA: "pariharam-puthra", PARIHARAM_AYUL: "pariharam-ayul",
  // Temples.
  TEMPLE_INDEX: "temple-index", TEMPLE_THIRUNALLAR: "temple-thirunallar",
  TEMPLE_THIRUMANANJERI: "temple-thirumananjeri",
  TEMPLE_PANCHA_BHOOTA: "temple-pancha-bhoota",
  TEMPLE_ARUPADAI_VEEDU: "temple-arupadai-veedu",
};

// ── Guards: refuse to run on already-split input ────────────────────────────
if (existsSync(DIR) && readdirSync(DIR).length) {
  console.error(`refusing: ${DIR} already exists and is non-empty — this is already split.`);
  console.error("css-split.mjs learned this the hard way: re-running a splitter on its own");
  console.error("output silently produces empty files. Revert with git before re-running.");
  process.exit(2);
}

const src = readFileSync(SRC, "utf8");
const EOL = src.includes("\r\n") ? "\r\n" : "\n";
if (src.includes("./marketing-i18n/")) {
  console.error("refusing: the barrel already imports from ./marketing-i18n/ — already split.");
  process.exit(2);
}

// ── Parse into preamble + one chunk per top-level `export const` ─────────────
const lines = src.split(EOL);
const startsAt = [];
lines.forEach((l, i) => {
  const m = /^export const (\w+)/.exec(l);
  if (m) startsAt.push({ name: m[1], line: i });
});
if (startsAt.length !== 63) {
  console.error(`expected 63 top-level exports, found ${startsAt.length} — grouping map is stale.`);
  process.exit(2);
}

/** Walk back over the contiguous comment/blank lines that belong to this export. */
function headStart(line) {
  let i = line;
  while (i > 0 && (lines[i - 1].startsWith("//") || lines[i - 1].trim() === "")) i--;
  // Leave one blank line with the previous chunk so files do not start blank.
  while (i < line && lines[i].trim() === "") i++;
  return i;
}

const chunks = startsAt.map((e, idx) => {
  const from = headStart(e.line);
  const to = idx + 1 < startsAt.length ? headStart(startsAt[idx + 1].line) : lines.length;
  return { name: e.name, text: lines.slice(from, to).join(EOL) };
});
const preamble = lines.slice(0, headStart(startsAt[0].line)).join(EOL);

// ── Assign every export a home ──────────────────────────────────────────────
const stem = (n) => n.replace(/_FAQ$/, "");
const orphans = chunks.filter((c) => !HOME_OF[stem(c.name)]).map((c) => c.name);
if (orphans.length) {
  console.error(`no module assigned for: ${orphans.join(", ")}`);
  console.error("add them to HOME_OF above — deciding which page renders an export is not derivable.");
  process.exit(2);
}

const byModule = new Map();
for (const c of chunks) {
  const slug = HOME_OF[stem(c.name)];
  if (!byModule.has(slug)) byModule.set(slug, []);
  byModule.get(slug).push(c);
}

// ── Build outputs ───────────────────────────────────────────────────────────
const LOCAL_S = [
  "type BiStr = { en: string; ta: string };",
  "",
  "function s(en: string, ta: string): BiStr {",
  "  return { en, ta };",
  "}",
].join(EOL);
if (!preamble.includes(LOCAL_S)) {
  console.error("the local `s` helper is not where this script expects it — reread the preamble.");
  process.exit(2);
}

const sModule =
  [
    "/** The bilingual string constructor every marketing-i18n domain module uses.",
    " *  Its own module so a domain file can reach it without importing the barrel,",
    " *  which would drag every other domain back in and undo the split. */",
    "export type BiStr = { en: string; ta: string };",
    "",
    "export function s(en: string, ta: string): BiStr {",
    "  return { en, ta };",
    "}",
  ].join(EOL) + EOL;

const slugs = [...byModule.keys()].sort();
const files = new Map();
for (const slug of slugs) {
  const body = byModule.get(slug).map((c) => c.text.replace(/\s+$/, "")).join(EOL + EOL);
  files.set(`${slug}.ts`, `import { s } from "./_s";${EOL}${EOL}${body}${EOL}`);
}

const barrel =
  preamble.replace(LOCAL_S, `import { s, type BiStr } from "./marketing-i18n/_s";`).replace(/\s+$/, "") +
  EOL + EOL +
  [
    "// ── Domain modules ─────────────────────────────────────────────────────────",
    "//",
    "// One module per page. Re-exported here so the ~63 existing",
    "// `from \"@/lib/marketing-i18n\"` import sites are unchanged — but because",
    "// package.json declares `sideEffects`, webpack can now drop the ones a given",
    "// route does not use. Before this split every route downloaded all 63.",
    "// See scripts/i18n-split.mjs for the measurement; both halves are required.",
  ].join(EOL) +
  EOL +
  slugs.map((s2) => `export * from "./marketing-i18n/${s2}";`).join(EOL) +
  EOL;

// ── Verify before writing ───────────────────────────────────────────────────
// Every declaration must survive verbatim, exactly once. Text is moved, never
// reformatted, so the barrel's diff is deletions only and each new file is
// reviewable as "this is the same bytes, relocated".
const emitted = [...files.values()].join(EOL);
const problems = [];
for (const c of chunks) {
  const decl = c.text.trim();
  if (!src.includes(decl)) problems.push(`${c.name}: chunk text is not verbatim from the source`);
  const n = [...emitted.matchAll(new RegExp(`^export const ${c.name}\\b`, "gm"))].length;
  if (n !== 1) problems.push(`${c.name}: appears ${n}x across the emitted modules, expected 1`);
  if (new RegExp(`^export const ${c.name}\\b`, "m").test(barrel))
    problems.push(`${c.name}: still declared in the barrel`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(`${chunks.length} exports -> ${slugs.length} modules`);
for (const slug of slugs) {
  const names = byModule.get(slug).map((c) => c.name);
  const bytes = Buffer.byteLength(files.get(`${slug}.ts`), "utf8");
  console.log(`  ${slug.padEnd(26)} ${String(bytes).padStart(7)} B  ${names.join(", ")}`);
}
console.log(`  ${"_s".padEnd(26)} ${String(Buffer.byteLength(sModule, "utf8")).padStart(7)} B`);
console.log(`  barrel ${Buffer.byteLength(src, "utf8")} B -> ${Buffer.byteLength(barrel, "utf8")} B`);

if (DRY) {
  console.log("\n--dry: nothing written");
  process.exit(0);
}

mkdirSync(DIR, { recursive: true });
writeFileSync(resolve(DIR, "_s.ts"), sModule, "utf8");
for (const [name, text] of files) writeFileSync(resolve(DIR, name), text, "utf8");
writeFileSync(SRC, barrel, "utf8");
console.log("\nwritten.");
