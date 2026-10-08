/**
 * User-facing copy must not promise that birth details are encrypted at rest.
 *
 * "Encrypted at rest" was printed in six places in both languages while a
 * readable dump held the exact birth instant in plaintext. A12 Option C
 * (migration uu4e5f6a7b8c) encrypted the instant, place, timezone, current
 * location and longitudes — but by ruling the rasi/nakshatra/pada keys stay
 * plaintext, and together they still give away the birth date and a ~2-hour
 * window. The claim is therefore still not true as a reader would hear it.
 * Delete this guard deliberately, together with wording that states the
 * residual, never by loosening the pattern.
 *
 * See docs/A12_BIRTH_DATA_CONSUMER_INVENTORY_2026-10-08.md and
 * docs/DATA_PROTECTION.md §1.
 *
 * Blind spot: scans source text only. Copy assembled at runtime from parts, or
 * served by the backend, is invisible to it.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["app", "components", "lib", "../packages/shared/src/data"];

// "குறியாக்குகிறது" (symbolises) is a different word and must stay quiet.
const CLAIM = /\bencrypt(?:ed|ion|s)?\b|குறியாக்கம்|மறையாக்க/gi;

export function encryptionClaims(source: string): string[] {
  return [...source.matchAll(CLAIM)].map((m) => m[0]);
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
    if (/\.test\.tsx?$/.test(entry)) return [];
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

describe("encryption claim in user-facing copy (A12)", () => {
  it("no surface claims encryption at rest", () => {
    const hits: string[] = [];
    for (const root of ROOTS) {
      for (const file of listFiles(root)) {
        const claims = encryptionClaims(readFileSync(file, "utf8"));
        if (claims.length > 0) hits.push(`${file.split(path.sep).join("/")}: ${[...new Set(claims)].join(", ")}`);
      }
    }
    expect(
      hits,
      "Birth details are readable from a database dump until A12 Option C ships " +
        "(birth_datetime_utc, julian_day, natal longitudes). Do not promise encryption.",
    ).toEqual([]);
  });

  it("detects the shipped claims and ignores 'symbolises'", () => {
    expect(encryptionClaims("Birth details are encrypted at rest.")).toEqual(["encrypted"]);
    expect(encryptionClaims("உங்கள் பிறப்பு விவரங்கள் மறையாக்கம் —")).toEqual(["மறையாக்க"]);
    expect(encryptionClaims("சேமிப்பில் குறியாக்கம் செய்யப்படுகின்றன")).toEqual(["குறியாக்கம்"]);
    expect(encryptionClaims("ஐம்பூதங்களைக் குறியாக்குகிறது.")).toEqual([]);
  });
});
