/**
 * Astrology display-boundary ratchet for rendered TSX.
 *
 * The API deliberately carries language-free keys/numbers beside convenient
 * English names.  A JSX child, `value`, `title`, or `aria-label` must render
 * the key through the matching localiser; the English name is never a safe
 * fallback for Tamil.  This test parses TSX rather than looking only at visible
 * text, so attributes are in scope too.
 *
 * Blind spots: values can be copied into an innocently named local variable or
 * returned by a helper before reaching JSX; canvas/PDF drawing and runtime
 * accessibility-tree quality need separate checks.  Bare `lord`/`graha` reads
 * are checked in title/ARIA/value attributes, plus direct JSX interpolation,
 * but this deliberately ignores comparisons, map keys and colour lookups.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOTS = ["app", "components"];

type Finding = { file: string; line: number; field: string; attribute: string | null };

const NAME_LOCALISERS: Array<[RegExp, Set<string>]> = [
  [/(?:RasiName|RasiCode|LagnaName)$/i, new Set(["rasiDisplayName"])],
  [/(?:NakshatraName|NakshatraCode|janmaNakshatra)$/i, new Set(["tNakshatra"])],
  [/(?:TithiName|TithiCode)$/i, new Set(["tTithi"])],
  [/(?:YogaName|YogaCode)$/i, new Set(["tYoga"])],
  [/(?:KaranaName|KaranaCode)$/i, new Set(["tKarana"])],
];

const PLANET_LOCALISERS = new Set([
  "tPlanetLord",
  "displayPlanet",
  "grahaName",
  "grahaFullName",
  "lordName",
  "plainLangDashaLord",
]);

function listFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === "node_modules" || entry === ".next" ? [] : listFiles(full);
    }
    return full.endsWith(".tsx") && !full.endsWith(".test.tsx") && !full.endsWith(".spec.tsx") ? [full] : [];
  });
}

function callName(node: ts.CallExpression): string | null {
  if (ts.isIdentifier(node.expression)) return node.expression.text;
  if (ts.isPropertyAccessExpression(node.expression)) return node.expression.name.text;
  return null;
}

function isInsideAllowedCall(node: ts.Node, root: ts.Node, allowed: Set<string>): boolean {
  for (let current: ts.Node | undefined = node.parent; current && current !== root; current = current.parent) {
    if (ts.isCallExpression(current) && allowed.has(callName(current) ?? "")) return true;
  }
  return false;
}

function attributeName(expression: ts.JsxExpression): string | null {
  const parent = expression.parent;
  return ts.isJsxAttribute(parent) ? parent.name.getText() : null;
}

function renderedRoots(source: ts.SourceFile): ts.JsxExpression[] {
  const roots: ts.JsxExpression[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxExpression(node) && node.expression) roots.push(node);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return roots;
}

function isPrelocalisedPairMember(node: ts.PropertyAccessExpression): boolean {
  return ts.isPropertyAccessExpression(node.parent) &&
    node.parent.expression === node &&
    (node.parent.name.text === "ta" || node.parent.name.text === "en");
}

function isGuardOnly(node: ts.Node, root: ts.Node): boolean {
  for (let current: ts.Node = node; current.parent && current.parent !== root; current = current.parent) {
    const parent = current.parent;
    if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && parent.left === current) {
      return true;
    }
    if (ts.isConditionalExpression(parent) && parent.condition === current) return true;
  }
  return false;
}

export function scanRenderedAstrologyFields(file: string, text: string): Finding[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings: Finding[] = [];

  for (const root of renderedRoots(source)) {
    const attr = attributeName(root);
    const displayedAttributes = new Set(["aria-label", "title", "value", "label", "hint", "name", "sub"]);
    if (attr && !displayedAttributes.has(attr)) continue;

    const visit = (node: ts.Node) => {
      // Each nested JSX expression is scanned as its own root. Re-entering it
      // here duplicates findings and mistakes a surrounding map/guard for the
      // actual display expression.
      if (node !== root.expression && ts.isJsxExpression(node)) return;
      if (ts.isPropertyAccessExpression(node)) {
        const field = node.name.text;
        const policy = NAME_LOCALISERS.find(([pattern]) => pattern.test(field));
        if (
          policy &&
          !isPrelocalisedPairMember(node) &&
          !isGuardOnly(node, root) &&
          !isInsideAllowedCall(node, root, policy[1])
        ) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
          findings.push({ file, line: line + 1, field, attribute: attr });
        }

        if (
          attr && ["title", "aria-label", "value"].includes(attr) &&
          ["lord", "graha", "karaka"].includes(field) &&
          !isInsideAllowedCall(node, root, PLANET_LOCALISERS)
        ) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
          findings.push({ file, line: line + 1, field, attribute: attr });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(root.expression!);
  }

  return findings.filter((finding, index) =>
    findings.findIndex((candidate) =>
      candidate.file === finding.file && candidate.line === finding.line &&
      candidate.field === finding.field && candidate.attribute === finding.attribute,
    ) === index,
  );
}

function scanRepo(): Finding[] {
  return ROOTS.flatMap((root) => listFiles(root)).flatMap((file) =>
    scanRenderedAstrologyFields(file.split(path.sep).join("/"), readFileSync(file, "utf8")),
  );
}

describe("astrology render boundary", () => {
  it("renders server astrology fields through their language boundary, including attributes", () => {
    expect(
      scanRepo(),
      "Render rasi numbers with rasiDisplayName, star keys with tNakshatra, and " +
        "planet keys with tPlanetLord. title/aria-label/value count as rendering.",
    ).toEqual([]);
  });

  it("detects the visible and attribute shapes that previously escaped the ratchets", () => {
    const sample = `
      <MetaChip value={result.prasnaLagnaName} />
      <p>{data.boyNakshatraName}</p>
      <button title={period.lord} aria-label={planet.graha}>Open</button>
      <p>{tNakshatra(data.girlNakshatraName, lang)}</p>
      <div title={tPlanetLord(period.lord, lang)} />
    `;
    expect(scanRenderedAstrologyFields("sample.tsx", sample).map((f) => `${f.field}:${f.attribute ?? "text"}`)).toEqual([
      "prasnaLagnaName:value",
      "boyNakshatraName:text",
      "lord:title",
      "graha:aria-label",
    ]);
  });
});
