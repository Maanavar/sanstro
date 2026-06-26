import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MOBILE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(MOBILE_ROOT, "..");
const BASELINE_PATH = path.join(MOBILE_ROOT, "scripts", "touch-target-baseline.json");
const UPDATE_BASELINE = process.argv.includes("--update-baseline");
const EXTENSIONS = new Set([".ts", ".tsx"]);
const SCAN_ROOTS = [path.join(MOBILE_ROOT, "app"), path.join(MOBILE_ROOT, "src")];
const INTERACTIVE_COMPONENT_RE = /<(TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Pressable)\b[\s\S]*?>/g;
const INTERACTIVE_STYLE_RE = /([A-Za-z0-9_]*(?:back|button|btn|chip|close|cta|press|segment|tab|toggle|touch|action)[A-Za-z0-9_]*)\s*:\s*\{([^{}]*)\}/gi;
const DIMENSION_RE = /\b(width|height|minWidth|minHeight)\s*:\s*(\d+(?:\.\d+)?)/g;

function toRepoPath(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") walk(fullPath, files);
      continue;
    }
    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

function lineForOffset(text, offset) {
  return text.slice(0, offset).split(/\r?\n/).length;
}

function collectFindings() {
  const findings = [];
  for (const root of SCAN_ROOTS) {
    for (const filePath of walk(root)) {
      const repoPath = toRepoPath(filePath);
      const text = fs.readFileSync(filePath, "utf8");

      INTERACTIVE_COMPONENT_RE.lastIndex = 0;
      let componentMatch;
      while ((componentMatch = INTERACTIVE_COMPONENT_RE.exec(text)) !== null) {
        const tag = componentMatch[0];
        const component = componentMatch[1];
        const hasStyle = /\bstyle\s*=/.test(tag);
        const hasHitSlop = /\bhitSlop\s*=/.test(tag);
        const hasAccessibilityLabel = /\baccessibilityLabel\s*=/.test(tag);
        const isDisabledOnly = /\bdisabled\s*=\{?true\}?/.test(tag);
        if (!isDisabledOnly && !hasStyle && !hasHitSlop) {
          const line = lineForOffset(text, componentMatch.index);
          findings.push({
            key: `${repoPath}:${line}:unstyled-touchable:${tag.replace(/\s+/g, " ").slice(0, 140)}`,
            type: "unstyled-touchable",
            file: repoPath,
            line,
            component,
            source: tag.replace(/\s+/g, " ").slice(0, 180),
          });
        }
        if (!isDisabledOnly && !hasAccessibilityLabel && /(?:icon|back|close|bell|settings|trash|remove|edit)/i.test(tag)) {
          const line = lineForOffset(text, componentMatch.index);
          findings.push({
            key: `${repoPath}:${line}:missing-accessibility-label:${tag.replace(/\s+/g, " ").slice(0, 140)}`,
            type: "missing-accessibility-label",
            file: repoPath,
            line,
            component,
            source: tag.replace(/\s+/g, " ").slice(0, 180),
          });
        }
      }

      INTERACTIVE_STYLE_RE.lastIndex = 0;
      let styleMatch;
      while ((styleMatch = INTERACTIVE_STYLE_RE.exec(text)) !== null) {
        const styleName = styleMatch[1];
        const styleBody = styleMatch[2];
        DIMENSION_RE.lastIndex = 0;
        let dimensionMatch;
        while ((dimensionMatch = DIMENSION_RE.exec(styleBody)) !== null) {
          const property = dimensionMatch[1];
          const value = Number(dimensionMatch[2]);
          if (value > 0 && value < 44) {
            const line = lineForOffset(text, styleMatch.index);
            findings.push({
              key: `${repoPath}:${line}:small-interactive-dimension:${styleName}:${property}:${value}`,
              type: "small-interactive-dimension",
              file: repoPath,
              line,
              styleName,
              property,
              value,
              source: styleBody.trim().replace(/\s+/g, " ").slice(0, 180),
            });
          }
        }
      }
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
  console.log(`Updated touch-target baseline with ${findings.length} findings.`);
  process.exit(0);
}

const baseline = loadBaseline();
if (!baseline) {
  console.error("Missing mobile/scripts/touch-target-baseline.json. Run `pnpm -F mobile qa:touch-targets:update` to create the initial ratchet baseline.");
  process.exit(1);
}

const baselineKeys = new Set(baseline.findings.map((finding) => finding.key));
const currentKeys = new Set(findings.map((finding) => finding.key));
const newFindings = findings.filter((finding) => !baselineKeys.has(finding.key));
const resolvedCount = baseline.findings.filter((finding) => !currentKeys.has(finding.key)).length;

if (newFindings.length > 0) {
  console.error(`Found ${newFindings.length} new mobile touch-target/accessibility finding(s).`);
  for (const finding of newFindings.slice(0, 40)) {
    console.error(`- ${finding.file}:${finding.line} ${finding.type} :: ${finding.source}`);
  }
  if (newFindings.length > 40) console.error(`...and ${newFindings.length - 40} more.`);
  process.exit(1);
}

console.log(`Mobile touch-target ratchet passed. ${findings.length} known finding(s), ${resolvedCount} resolved since baseline.`);