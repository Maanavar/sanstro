/**
 * Public copy must not contradict the ruled engine (FAA-04, FAA-05, FAA-25,
 * FAA-42 in docs/FULL_ASTRO_ACCURACY_AUDIT_2026-11-10.md; §8.1 there).
 *
 * The engine's rule text (_build_dosham_explanations, porutham summaries) is
 * the source of truth. These pages had drifted from it: Rajju framed as a
 * spouse-longevity concern (EC-RULING-06 excised that from the engine only),
 * Nadi called a dealbreaker, own-sign / exalted Mars and Guru's aspect called
 * cancellations of Sevvai, a node with the 5th lord said to declare Naga
 * dosham, Kala Sarpa promised a grading the engine never computes, and the
 * Moon's sign transit put at 2.5 days.
 *
 * Gate verified 2026-11-11: with the pre-fix learn-porutham.ts, dosham-sevvai.ts,
 * dosham-naga.ts and dosham-kala-sarpa.ts restored from HEAD, every rule below
 * that targets them fails.
 *
 * BLIND SPOT: source text only, sentence by sentence and English-weighted for
 * the cancellation rules; the Tamil twins are covered by the word bans only.
 * Copy assembled from parts at runtime, or a claim phrased with words not
 * listed here, passes. It is a ratchet against the drift seen, not a proof of
 * parity.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["lib/marketing-i18n", "app/(marketing)"];

function listFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return listFiles(full);
    if (/\.test\.tsx?$/.test(entry)) return [];
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const FILES = ROOTS.flatMap(listFiles);
const rel = (f: string) => f.split(path.sep).join("/");

/** Every quoted string literal, split into sentences. */
function sentences(source: string): string[] {
  const literals = [...source.matchAll(/"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map((m) => m[1] ?? m[2] ?? "");
  return literals.flatMap((l) => l.split(/(?<=[.!?;])\s+/));
}

function hits(pattern: RegExp, files = FILES): string[] {
  const out: string[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(pattern)) out.push(`${rel(file)}: ${m[0]}`);
  }
  return out;
}

function fileNamed(name: string): string[] {
  return FILES.filter((f) => rel(f).endsWith(name));
}

describe("marketing copy parity with the ruled engine", () => {
  it("never frames a porutham or dosham as lifespan / spouse loss (EC-RULING-06)", () => {
    // Scoped to marriage and dosham copy: the Ayush pariharam and nakshatra
    // pages speak of a person's OWN health and long life, which the ruling
    // does not touch. A new marriage/dosham page is caught by its file name.
    const marriage = FILES.filter((f) =>
      /porutham|dosham|marriage|kalathra|sevvai|naga|rajju|nadi|thirumana|compatib/i.test(rel(f)),
    );
    expect(hits(/longevity|life-?span|widow|spouse'?s? death|ஆயுள்|விதவை/gi, marriage)).toEqual([]);
  });

  it("never calls Rajju or Nadi a dealbreaker (they are a ruled veto and a disclosure)", () => {
    expect(hits(/deal-?breaker/gi)).toEqual([]);
  });

  it("never says a different moon sign alone cancels Nadi (A-9 v2)", () => {
    expect(hits(/different moon signs?[^."]{0,80}can cancel/gi)).toEqual([]);
  });

  it("Sevvai: own sign, exaltation and Guru reduce; a sentence calling them a cancellation must say so", () => {
    const bad = fileNamed("dosham-sevvai.ts").flatMap((f) =>
      sentences(readFileSync(f, "utf8"))
        .filter((s) => /cancel/i.test(s) && /own sign|exalt|guru|jupiter/i.test(s))
        .filter((s) => !/reduc|lower|some traditions|strong guru|neechabhanga|only when|three cases/i.test(s))
        .map((s) => `${rel(f)}: ${s}`),
    );
    expect(bad).toEqual([]);
    expect(hits(/partial cancellation|strong cancellation|marriage-house significator/gi, fileNamed("dosham-sevvai.ts"))).toEqual([]);
  });

  it("Naga: only a node in the 5th declares it; protections lower, never cancel", () => {
    const bad = fileNamed("dosham-naga.ts").flatMap((f) =>
      sentences(readFileSync(f, "utf8"))
        .filter((s) => /\b(recogni[sz]ed|declare[sd]?|forms)\b/i.test(s) && /5th lord|jupiter/i.test(s))
        .filter((s) => !/only when|not declared|noted|heavier|some traditions|does not count|link/i.test(s))
        .map((s) => `${rel(f)}: ${s}`),
    );
    expect(bad).toEqual([]);
    expect(hits(/natural cancellation|neutrali[sz]e/gi, fileNamed("dosham-naga.ts"))).toEqual([]);
  });

  it("Kala Sarpa: no grading promise the engine does not compute (FAA-25)", () => {
    expect(hits(/mild to intense|self-cancell?ing/gi, fileNamed("dosham-kala-sarpa.ts"))).toEqual([]);
  });

  it("the Moon's sign transit is about 2¼ days, not 2.5 (FAA-42)", () => {
    expect(hits(/2\.5 days|2\.5 நாட்க/g)).toEqual([]);
  });

  // Owner ruling 2026-11-11: Nadi is a North Indian (Ashtakoota) check, not one
  // of the Tamil ten, and is shown only as a side note that moves no number.
  // Gate verified 2026-11-11: with the pre-fix methodology page, tool-porutham.ts,
  // PoruthamPageContent.tsx and what-is-porutham/page.tsx restored from HEAD,
  // both rules fail. BLIND SPOT: it only sees these phrasings; a new list of the
  // ten written another way passes.
  it("never lists Nadi as one of the ten poruthams (Vasya and Vedhai are)", () => {
    expect(
      hits(/(Rasiyathipathi|ராசியதிபதி|ராசியாதிபதி),? (and )?(Nadi|நாடி)\b|Nadi porutham —|நாடி பொருத்தம் —|"(Nadi|நாடி) ⚠"/g),
    ).toEqual([]);
  });

  it("never ranks Nadi with Rajju as a critical or score-outweighing check", () => {
    expect(
      hits(/Rajju (and|or) Nadi|Rajju dosha (and|or) Nadi dosha|ரஜ்ஜு (மற்றும் )?நாடி|Critical dosha|முக்கியமான தோஷம்/g),
    ).toEqual([]);
  });
});
