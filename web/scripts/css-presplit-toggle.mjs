#!/usr/bin/env node
/**
 * Puts the tree back into its pre-split CSS state, reversibly, so the split can
 * be A/B'd against a *rendered* page rather than only against static analysis.
 *
 *   node scripts/css-presplit-toggle.mjs --on    # render like 17b45ef
 *   node scripts/css-presplit-toggle.mjs --off   # back to HEAD
 *   node scripts/css-presplit-toggle.mjs --status
 *
 * Why not a worktree at 17b45ef: this is a pnpm workspace, so a second checkout
 * needs three junctioned node_modules trees, and it would move two variables at
 * once. The split commits also moved the public routes into an app/(marketing)
 * route group. That move cannot change rendering — route groups are stripped
 * from the URL and the group layout renders a bare fragment — so reverting it
 * too would only add risk. Holding the file layout fixed and changing *only
 * which stylesheets load* isolates the variable that can actually alter a pixel.
 *
 * The four edits are exactly the split's rendering surface:
 *   1. app/globals-presplit.css  <- git show 17b45ef:web/app/globals.css
 *   2. app/layout.tsx                  loads that instead of the split base
 *   3. app/(marketing)/layout.tsx      stops loading marketing.css
 *   4. app/dashboard/layout.tsx        stops loading dashboard-globals.css
 *      and dashboard-nova.css reverts, dropping F5's new scrollbar pair
 *
 * --off restores the three layouts and dashboard-nova.css from git and deletes
 * the generated file, so a forgotten toggle shows up in `git status` either way.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(WEB, "..");
const PRESPLIT_REF = "17b45ef";

const GENERATED = resolve(WEB, "app/globals-presplit.css");
const TRACKED_REVERTS = ["web/app/layout.tsx", "web/app/(marketing)/layout.tsx", "web/app/dashboard/layout.tsx"];
const FROM_REF = ["web/app/dashboard/dashboard-nova.css"];

const git = (...args) => execFileSync("git", args, { cwd: REPO, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** One reversible edit: `find` must appear exactly once, or we stop. */
function swap(file, find, replaceWith) {
  const p = resolve(WEB, file);
  const src = readFileSync(p, "utf8");
  const hits = src.split(find).length - 1;
  if (hits !== 1) throw new Error(`${file}: expected exactly 1 occurrence of ${JSON.stringify(find)}, found ${hits}`);
  writeFileSync(p, src.replace(find, replaceWith), "utf8");
}

const mode = process.argv.find((a) => ["--on", "--off", "--status"].includes(a));

if (mode === "--status" || !mode) {
  const on = existsSync(GENERATED);
  console.log(on ? "PRE-SPLIT (rendering like 17b45ef) — run --off before committing" : "HEAD (split active)");
  const dirty = git("status", "--porcelain", "--", ...TRACKED_REVERTS, ...FROM_REF).trim();
  if (dirty) console.log("modified:\n" + dirty);
  process.exit(on ? 1 : 0);
}

if (mode === "--on") {
  if (existsSync(GENERATED)) {
    console.error("already in pre-split mode — run --off first");
    process.exit(1);
  }
  // The pre-split globals.css is also the pre-F5 one: 17b45ef predates the
  // .cd-shell deletion, so the rival shell block comes back with it.
  writeFileSync(GENERATED, git("show", `${PRESPLIT_REF}:web/app/globals.css`), "utf8");
  for (const f of FROM_REF) writeFileSync(resolve(REPO, f), git("show", `${PRESPLIT_REF}:${f}`), "utf8");

  swap("app/layout.tsx", 'import "./globals.css";', 'import "./globals-presplit.css";');
  swap("app/(marketing)/layout.tsx", 'import "../marketing.css";', '// [presplit A/B] import "../marketing.css";');
  swap(
    "app/dashboard/layout.tsx",
    'import "./dashboard-globals.css";',
    '// [presplit A/B] import "./dashboard-globals.css";',
  );

  console.log(`pre-split mode ON — app/globals-presplit.css written from ${PRESPLIT_REF}`);
  console.log("marketing.css and dashboard-globals.css are no longer loaded by any layout.");
  process.exit(0);
}

// --off
git("checkout", "--", ...TRACKED_REVERTS, ...FROM_REF);
if (existsSync(GENERATED)) rmSync(GENERATED);
console.log("pre-split mode OFF — layouts and dashboard-nova.css restored from git");
const dirty = git("status", "--porcelain", "--", ...TRACKED_REVERTS, ...FROM_REF).trim();
if (dirty) {
  console.error("still modified after restore:\n" + dirty);
  process.exit(1);
}
