import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, "scripts", "color-literals-baseline.json");
const UPDATE_BASELINE = process.argv.includes("--update-baseline");
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^\n"'`]+\)|\bhsla?\([^\n"'`]+\)/g;
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const SCAN_ROOTS = ["web", "mobile"];
const SKIP_DIRS = new Set([".next", ".expo", "artifacts", "coverage", "node_modules", "playwright-report", "test-results"]);
const SKIP_FILES = new Set([
  "mobile/src/theme/colors.ts",
  // Canvas 2D share-card renderers: ctx.fillStyle / ctx.strokeStyle require
  // literal color strings — CSS custom properties (var(--token)) do not resolve
  // inside the Canvas API, so these files are exempt from the token ratchet.
  "web/components/dashboard-share-card.tsx",
  "web/components/friendship-result-card.tsx",
  "web/components/panchangam-share-card.tsx",
  "web/components/public-share-card.tsx",
]);

function toRepoPath(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), files);
      continue;
    }
    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function collectFindings() {
  const findings = [];
  for (const scanRoot of SCAN_ROOTS) {
    for (const filePath of walk(path.join(ROOT, scanRoot))) {
      const repoPath = toRepoPath(filePath);
      if (SKIP_FILES.has(repoPath)) continue;
      const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        COLOR_RE.lastIndex = 0;
        let match;
        while ((match = COLOR_RE.exec(line)) !== null) {
          findings.push({
            // NO LINE NUMBER IN THE KEY. It used to be
            // `file:line:value:source`, which made the ratchet
            // line-sensitive: inserting a single line at the top of a file
            // shifted every literal below it and the gate reported them all
            // as new. That is how a baseline of 200 came to report 347 "new"
            // literals without anyone adding a colour, and why the gate has
            // been failing continuously rather than guarding anything.
            //
            // `file:value:source` still distinguishes different literals and
            // different usages of the same literal, but survives edits
            // elsewhere in the file. Two identical usages on different lines
            // collapse to one entry, which is the right trade: the gate exists
            // to catch a NEW hardcoded colour, not to count repetitions.
            key: `${repoPath}:${match[0]}:${line.trim()}`,
            file: repoPath,
            line: index + 1,
            value: match[0],
            source: line.trim(),
          });
        }
      });
    }
  }
  // Keys are no longer unique per occurrence (see above), so collapse repeats.
  // The first occurrence keeps its line number, which is only ever used to
  // point a human at the code — it is deliberately not part of the key.
  const byKey = new Map();
  for (const finding of findings) {
    if (!byKey.has(finding.key)) byKey.set(finding.key, finding);
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  return JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
}

function writeBaseline(findings) {
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), count: findings.length, findings }, null, 2)}\n`,
    "utf8",
  );
}

const findings = collectFindings();

if (UPDATE_BASELINE) {
  writeBaseline(findings);
  console.log(`Updated color literal baseline with ${findings.length} findings.`);
  process.exit(0);
}

const baseline = loadBaseline();
if (!baseline) {
  console.error("Missing scripts/color-literals-baseline.json. Run `pnpm qa:colors:update` to create the initial ratchet baseline.");
  process.exit(1);
}

const baselineKeys = new Set(baseline.findings.map((finding) => finding.key));
const currentKeys = new Set(findings.map((finding) => finding.key));
const newFindings = findings.filter((finding) => !baselineKeys.has(finding.key));
const resolvedCount = baseline.findings.filter((finding) => !currentKeys.has(finding.key)).length;

if (newFindings.length > 0) {
  console.error(`Found ${newFindings.length} new color literal(s). Use design tokens instead, or intentionally update the baseline.`);
  for (const finding of newFindings.slice(0, 40)) {
    console.error(`- ${finding.file}:${finding.line} ${finding.value} :: ${finding.source}`);
  }
  if (newFindings.length > 40) console.error(`...and ${newFindings.length - 40} more.`);
  process.exit(1);
}

console.log(`Color literal ratchet passed. ${findings.length} known finding(s), ${resolvedCount} resolved since baseline.`);