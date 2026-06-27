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
            key: `${repoPath}:${index + 1}:${match[0]}:${line.trim()}`,
            file: repoPath,
            line: index + 1,
            value: match[0],
            source: line.trim(),
          });
        }
      });
    }
  }
  return findings.sort((a, b) => a.key.localeCompare(b.key));
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