// Mobile strings whose Tamil branch repeats the English: `isTamil ? "X" : "X"`.
//   node scripts/audit/mobile_same_branch_tamil.mjs mobile
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.argv[2];
const SKIP = new Set(["node_modules", "dist", "android", "__tests__", "__mocks__", ".expo"]);
const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(e) && !/\.test\./.test(e)) files.push(p);
  }
})(root);

const LIT = String.raw`("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\x60(?:[^\x60\\]|\\.)*\x60)`;
const COND = String.raw`(isTamil|isTa|lang\s*===\s*["']ta["']|language\s*===\s*["']ta["']|locale\s*===\s*["']ta["'])`;
const re = new RegExp(String.raw`${COND}\s*\?\s*${LIT}\s*:\s*${LIT}`, "g");
const rows = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(re)) {
    if (m[2] !== m[3]) continue;
    const line = src.slice(0, m.index).split("\n").length;
    rows.push({ file: path.relative(root, f).replaceAll("\\", "/"), line, text: m[2].slice(1, -1) });
  }
}
console.log(JSON.stringify(rows, null, 1));
