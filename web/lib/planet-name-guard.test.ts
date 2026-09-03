/**
 * One Tamil planet-name table, and a test that fails when a ninth copy appears.
 *
 * `tPlanetLord` in `lib/i18n.ts` is canonical and served ~10 surfaces. Eight
 * other files hand-rolled the same nine rows, and four of them had drifted to
 * **சுக்ரன்** for Venus where the rest of the app says **சுக்கிரன்**:
 * `dashboard-ashtottari-dasha-panel`, `dashboard-yogini-dasha-panel`,
 * `dashboard-shadbala-panel`, `dashboard-conditional-dashas-panel`.
 *
 * EACH COPY WAS INTERNALLY CONSISTENT, which is exactly why nothing caught it:
 * there is no assertion a single panel could fail. The bug only exists in the
 * relationship between files, so the test has to look at the tree.
 *
 * `dashboard-yoga-dosham-panel` is the cautionary one. Its map carried a comment
 * saying it was local "on purpose … there is no shared web-side planet-name
 * helper to reuse" — untrue when written. A justification nobody re-checks
 * outlives the duplication it defends, so this guard replaces the comment.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOTS = ["app", "components", "lib"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

// The canonical table lives here and is allowed to spell the names out.
const CANONICAL = path.join("lib", "i18n.ts");

const PLANET_KEY = /\b(SUN|MOON|MARS|MERCURY|JUPITER|VENUS|SATURN|RAHU|KETU)\b\s*:/;

// Both the canonical spelling and the drifted one, so re-introducing either is
// caught.
const TAMIL_PLANET_NAMES = new Set([
  "சூரியன்", "சந்திரன்", "செவ்வாய்", "புதன்", "குரு",
  "சுக்கிரன்", "சுக்ரன்", "சனி", "ராகு", "கேது",
]);

// EXACT MATCH, NOT "CONTAINS", and the difference is the whole test.
//
// `guide-detail-content` / `natchathiram-data` / `marketing-i18n` name planets in
// prose constantly and legitimately, so the key check narrows to lookup tables —
// but keying on the enum name alone is still not enough. Three planet-keyed
// tables are content rather than names and a "contains" rule flags all three:
//
//   JUPITER: { ta: "ஞானம், செல்வம், குழந்தைகள், குரு", … }   // significations
//   SATURN:  { ta: "சனி தீபம் + பெரியோரை சேவித்தல்", … }      // a remedy
//
// Those are keyed by planet and happen to mention one. A NAME table's value is
// the name and nothing else, so the rule is that some complete string literal on
// the line equals a graha name. That admits `VENUS: "சுக்கிரன்"` and
// `VENUS: { en: "Venus", ta: "சுக்கிரன்" }` and rejects both lines above.
const STRING_LITERAL = /(["'`])((?:(?!\1)[^\\])*)\1/g;

function hasBareGrahaNameLiteral(line: string): boolean {
  for (const match of line.matchAll(STRING_LITERAL)) {
    if (TAMIL_PLANET_NAMES.has(match[2].trim())) return true;
  }
  return false;
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === ".next" || entry === "node_modules") return [];
      return listSourceFiles(fullPath);
    }
    return SOURCE_EXTENSIONS.has(path.extname(fullPath)) ? [fullPath] : [];
  });
}

/**
 * Lines that map a graha ENUM key straight to a Tamil name — i.e. a row of a
 * hand-rolled lookup table, not prose.
 *
 * Deliberately line-scoped and deliberately crude. A parser would be more
 * precise and would also be a thing to maintain; the failure this catches is
 * somebody pasting nine rows into a component, and nine pasted rows always look
 * like this.
 */
function planetTableRows(content: string): string[] {
  return content
    .split(/\r?\n/)
    .filter((line) => PLANET_KEY.test(line) && hasBareGrahaNameLiteral(line));
}

describe("planet name guard", () => {
  it("keeps the Tamil graha names in lib/i18n.ts and nowhere else", () => {
    const root = process.cwd();
    const offenders = SOURCE_ROOTS.flatMap((sourceRoot) =>
      listSourceFiles(path.join(root, sourceRoot)),
    ).flatMap((filePath) => {
      const relative = path.relative(root, filePath);
      if (relative === CANONICAL) return [];
      const rows = planetTableRows(readFileSync(filePath, "utf8"));
      return rows.length ? [`${relative}: ${rows.length} row(s), e.g. ${rows[0].trim()}`] : [];
    });

    expect(
      offenders,
      "These files map a graha enum key to a Tamil name. Call " +
        "tPlanetLord(code, lang) from lib/i18n.ts instead — four panels drifted to " +
        "'சுக்ரன்' for Venus behind maps like these, and every copy was internally " +
        "consistent, so no per-file test could see it.",
    ).toEqual([]);
  });

  it("detects a pasted name table and ignores a planet-keyed content table", () => {
    // The detector tested directly, because the sweep above proves only that the
    // tree is currently clean — it cannot show the rule would notice a ninth
    // copy. The first two lines are the real rows that were deleted from
    // `dashboard-shadbala-panel` and `chart-generate-inline-panel`; the last two
    // are the real content rows from `dashboard-chart-explanation` and
    // `dashboard-hybrid-parts` that a "contains" rule wrongly flagged.
    const shouldFlag = [
      '  VENUS: { en: "Venus", ta: "சுக்ரன்" },',
      '  JUPITER: "குரு", VENUS: "சுக்கிரன்", SATURN: "சனி", RAHU: "ராகு",',
    ];
    const shouldPass = [
      '  JUPITER: { ta: "ஞானம், செல்வம், குழந்தைகள், குரு", en: "wisdom, wealth, children, teachers/guru" },',
      '  SATURN:  { en: "Shani lamp + serving elders", ta: "சனி தீபம் + பெரியோரை சேவித்தல்" },',
      '  {en ? `Mars: House ${h}` : `செவ்வாய்: ${h}ஆம் இடம்`}',
    ];

    expect(planetTableRows(shouldFlag.join("\n"))).toHaveLength(shouldFlag.length);
    expect(planetTableRows(shouldPass.join("\n"))).toEqual([]);
  });

  it("finds the canonical table, so the check above cannot pass by looking nowhere", () => {
    // Without this, renaming i18n.ts or moving PLANET_LORDS would empty the
    // regex's only true positive and turn the guard permanently green — the
    // stale-baseline failure this repo has paid for more than once.
    const content = readFileSync(path.join(process.cwd(), CANONICAL), "utf8");
    const rows = planetTableRows(content);
    expect(rows.length).toBeGreaterThanOrEqual(9);
    expect(content).toContain("சுக்கிரன்");
    expect(content).not.toContain("சுக்ரன்,");
  });
});
