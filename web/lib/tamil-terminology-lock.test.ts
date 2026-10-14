/**
 * Tamil terms the owner locked on 2026-10-12 (docs/TAMIL_TERMINOLOGY_GLOSSARY.md,
 * from docs/TAMIL_REVIEW_SHEET_2026-10-12.md C-01, C-02, D-01) stay locked
 * across web, mobile and the shared package.
 *
 * - Rajju is ரஜ்ஜு. ராஜ்ஜு was the minority spelling, and both used to appear on
 *   one porutham result.
 * - Vedha is வேதை. வேதம் means the Veda, the scripture. Words that really are the
 *   Veda (ஆயுர்வேதம், கர்ணவேதம்) are joined to a preceding letter, so the
 *   standalone-word match below does not see them.
 * - The dosham badge advises ("தோஷம்: கவனம் தேவை") and never orders. The
 *   imperative "தோஷம் — தவிர்க்கவும்" / "Dosham - Avoid" is retired.
 *
 * The backend twin is tests/test_porutham.py::test_locked_tamil_terms_rajju_and_vedhai,
 * which covers the engine's kuta names and every summary. This file covers the copy.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO = path.resolve(process.cwd(), "..");
const ROOTS = ["web/app", "web/components", "web/lib", "mobile/app", "mobile/src", "packages/shared/src"];

const TAMIL_LETTER = "\\u0B80-\\u0BFF";
const RETIRED: Array<[string, RegExp]> = [
  ["ராஜ்ஜு (use ரஜ்ஜு)", /ராஜ்ஜு/],
  ["வேதம் as the porutham (use வேதை)", new RegExp(`(^|[^${TAMIL_LETTER}])வேதம்(?![${TAMIL_LETTER}])`)],
  ["வேத தோஷம் (use வேதை தோஷம்)", /வேத தோஷம்/],
  ["தோஷம் — தவிர்க்கவும் (use தோஷம்: கவனம் தேவை)", /தோஷம் — தவிர்க்கவும்/],
  ["Dosham - Avoid (use Dosham: needs care)", /Dosham - Avoid/],
];

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
    return /\.(ts|tsx)$/.test(full) && !/\.(test|spec)\.tsx?$/.test(full) ? [full] : [];
  });
}

export function retiredTerms(source: string): string[] {
  return RETIRED.filter(([, pattern]) => pattern.test(source)).map(([label]) => label);
}

describe("Tamil terminology lock (2026-10-12 owner ruling)", () => {
  it("uses no retired spelling or badge anywhere in web, mobile or shared copy", () => {
    const offenders = ROOTS.flatMap((root) => listFiles(path.join(REPO, root)))
      .map((file) => [path.relative(REPO, file).split(path.sep).join("/"), retiredTerms(readFileSync(file, "utf8"))] as const)
      .filter(([, hits]) => hits.length > 0)
      .map(([file, hits]) => `${file}: ${hits.join(", ")}`);
    expect(offenders, "See docs/TAMIL_TERMINOLOGY_GLOSSARY.md for the locked forms.").toEqual([]);
  });

  it("catches each retired form, and leaves the real Veda words alone", () => {
    expect(retiredTerms("ராஜ்ஜு தோஷம்")).toHaveLength(1);
    expect(retiredTerms('labelTa: "வேதம்",')).toHaveLength(1);
    expect(retiredTerms("ரஜ்ஜு, வேதம், ராசி")).toHaveLength(1);
    expect(retiredTerms("வேத தோஷம்")).toHaveLength(1);
    expect(retiredTerms('ta ? "தோஷம் — தவிர்க்கவும்" : "Dosham - Avoid"')).toHaveLength(2);

    expect(retiredTerms("ஆயுர்வேதம், மூலிகை மருத்துவம்")).toEqual([]);
    expect(retiredTerms("காதுகுத்து / கர்ணவேதம்")).toEqual([]);
    expect(retiredTerms("ரஜ்ஜு மற்றும் வேதை தோஷம்: கவனம் தேவை")).toEqual([]);
  });
});
