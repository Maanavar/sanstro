/**
 * Planet, star, tithi, yoga and karana names reach the screen through their
 * localiser, never raw off the response — the five doubled field families
 * CLAUDE.md's display boundary names beside rasi (N-1b / W-7b, 2026-09-21).
 *
 * `lib/rasi-display-boundary.test.ts` ratchets rasi by flagging any read of a
 * name field. That does not transfer: `.lord` and `.graha` are read all the
 * time as KEYS (`tPlanetLord(p.lord, lang)`, `GRAHA_GLYPH[pl.graha]`,
 * `key={pl.graha}`). So this guard keys on a RENDER — the field as the whole
 * of a JSX child `{x.lord}`, of a text attribute `title={x.lord}` /
 * `aria-label=` / `alt=` / `placeholder=`, or of a template interpolation
 * `${x.lord}` that is not a `key`/`id`/`className`/`data-*` value — optionally
 * followed by a `??` / `||` fallback.
 *
 * It was written against a work-order claim that all five families were clean
 * (swept 2026-09-19). They were not: the first run found raw lords in the
 * compatibility panel (both languages), the life-event log and the Annual
 * Wrapped share card, and raw English star names in the marketing Jadhagam
 * tool's Tamil-only table — whose dashboard twin already localised them. Those
 * are fixed; what remains below is declared with its reason.
 *
 * TWO DIRECTIONS, as in the rasi guard: an undeclared render fails, and a
 * declared file that stopped rendering one also fails.
 *
 * KNOWN GAPS: `.tsx` only, so a `.ts` helper that builds a label is invisible
 * (none exists today); a render split across lines, or built by string `+`,
 * is not matched; and `title=` / `aria-label=` renders are caught here but no
 * browser text probe can see them (`innerText` excludes attributes).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Field shapes per family: the name, not the number or the language-free key. */
const FAMILIES = {
  lord: String.raw`[A-Za-z]*[Ll]ord|graha`,
  nakshatra: String.raw`[A-Za-z]*[Nn]akshatraName|nakshatra\??\.(?:name|activeName)`,
  tithi: String.raw`[A-Za-z]*[Tt]ithiName|tithi\??\.(?:name|activeName)`,
  yoga: String.raw`yogaName|yoga\??\.(?:name|activeName)`,
  karana: String.raw`karanaName|karana\??\.(?:name|activeName)`,
} as const;
type Family = keyof typeof FAMILIES;

/** What still renders one of these fields, and why that is not a leak. */
const DECLARED: Record<string, string> = {
  "components/dashboard-hybrid-parts.tsx":
    "lord: `r.signLord` is a label this file builds from rasiDisplayName() + tPlanetLord() (:604), not a response field",
  "components/marketing-visuals.tsx":
    "lord: `labels.graha` is the component's own localised label map, not a response field",
  "app/(marketing)/share/porutham/[token]/page.tsx":
    "nakshatra: an English-only public share page (its labels are English literals); the English name is the page's language. Localise with the page if it gains Tamil",
};

const ROOTS = ["app", "components"];
const CHAIN = String.raw`[\w$]+(?:\??\.[\w$]+|\[[^\]\n]+\])*?\??\.`;
const TAIL = String.raw`\s*(?:(?:\?\?|\|\|)[^{}\n]*)?`;
/** Template interpolations inside these attributes are identifiers, not text. */
const NON_TEXT_ATTR = /(?:\bkey|\bid|className|data-[\w-]+|htmlFor)=\{`[^`]*$/;

export function nameRenders(source: string, family: Family): string[] {
  const field = FAMILIES[family];
  // Not after `=` (an attribute), a word character, or `$` (the inside of a
  // template interpolation, which `tmpl` below judges with its context).
  const child = new RegExp(String.raw`(?<![=\w$])\{\s*${CHAIN}(?:${field})\b${TAIL}\}`, "g");
  const attr = new RegExp(String.raw`\b(?:title|aria-label|alt|placeholder)=\{\s*${CHAIN}(?:${field})\b${TAIL}\}`, "g");
  const tmpl = new RegExp(String.raw`\$\{\s*${CHAIN}(?:${field})\b${TAIL}\}`, "g");
  const hits = [...source.matchAll(child), ...source.matchAll(attr)].map((m) => m[0]);
  for (const m of source.matchAll(tmpl)) {
    if (!NON_TEXT_ATTR.test(source.slice(Math.max(0, m.index - 200), m.index))) hits.push(m[0]);
  }
  return hits;
}

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
    return full.endsWith(".tsx") && !full.endsWith(".test.tsx") ? [full] : [];
  });
}

function scan(): Map<string, string[]> {
  const hits = new Map<string, string[]>();
  for (const root of ROOTS) {
    for (const file of listFiles(root)) {
      const source = readFileSync(file, "utf8");
      const found = (Object.keys(FAMILIES) as Family[]).flatMap((family) => nameRenders(source, family).map((h) => `${family}: ${h}`));
      if (found.length > 0) hits.set(file.split(path.sep).join("/"), [...new Set(found)]);
    }
  }
  return hits;
}

describe("astro name display boundary (N-1b: lord/graha, nakshatra, tithi, yoga, karana)", () => {
  it("declares every surface that still renders a server-chosen name", () => {
    const undeclared = [...scan().entries()].filter(([f]) => !(f in DECLARED)).map(([f, h]) => `${f} → ${h.join(" | ")}`).sort();
    expect(
      undeclared,
      "Render the key through its localiser: tPlanetLord / tNakshatra / tTithi / tYoga / tKarana (lib/i18n). " +
        "A name field is English-only and prints English at a Tamil reader.",
    ).toEqual([]);
  });

  it("has no stale entries — a declared file that stopped rendering one must be removed here", () => {
    const present = new Set(scan().keys());
    const stale = Object.keys(DECLARED).filter((f) => !present.has(f)).sort();
    expect(stale, "This file no longer renders one. Delete the entry.").toEqual([]);
  });

  it("detects the render shapes, and stays quiet on keys and localised reads", () => {
    // The shapes this pass fixed, verbatim.
    expect(nameRenders("{d.dashaHarmony.personAMahaLord} / {d.dashaHarmony.personAantarLord}", "lord")).toEqual([
      "{d.dashaHarmony.personAMahaLord}",
      "{d.dashaHarmony.personAantarLord}",
    ]);
    expect(nameRenders('{en ? `7th Lord: ${strength.seventhLord}` : "…"}', "lord")).toEqual(["${strength.seventhLord}"]);
    expect(nameRenders("<td style={cellSt}>{row.nakshatraName}</td>", "nakshatra")).toEqual(["{row.nakshatraName}"]);
    expect(nameRenders('title={period.lord ?? "—"}', "lord")).toEqual(['title={period.lord ?? "—"}']);
    expect(nameRenders("<b>{panchangam.tithi.name}</b>", "tithi")).toEqual(["{panchangam.tithi.name}"]);
    expect(nameRenders("<b>{limb.yoga?.activeName}</b>", "yoga")).toEqual(["{limb.yoga?.activeName}"]);

    // Keys, lookups and localised reads are not renders.
    expect(nameRenders("{tPlanetLord(period.lord, lang)}", "lord")).toEqual([]);
    expect(nameRenders("{GRAHA_GLYPH[pl.graha]}", "lord")).toEqual([]);
    expect(nameRenders("<div key={pl.graha}>", "lord")).toEqual([]);
    expect(nameRenders("<div key={`bar-${period.lord}-${period.start}`}>", "lord")).toEqual([]);
    expect(nameRenders("<div data-testid={`status-marks-${pl.graha}`}>", "lord")).toEqual([]);
    expect(nameRenders("<PlanetBadge graha={pl.graha} />", "lord")).toEqual([]);
    expect(nameRenders("{tNakshatra(row.nakshatraName, \"ta\")}", "nakshatra")).toEqual([]);
  });
});
