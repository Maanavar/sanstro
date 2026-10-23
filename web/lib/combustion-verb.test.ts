/**
 * One spelling for the combustion verb in rendered Tamil.
 *
 * Native-reader correction, 2026-10-03: a planet is அஸ்தங்கமடைந்துள்ளது /
 * அஸ்தங்கமடையவில்லை (one), அஸ்தங்கமடைந்துள்ளன (several), written as one
 * word, and never with the human honorific -ார். The yoga panel had mixed
 * "அஸ்தங்கம் அடைந்துள்ளது", "அஸ்தங்கம் அடைந்துள்ளார்" and a singular verb
 * after a list of planets.
 *
 * This guard sees source strings only. It cannot see the plural agreement,
 * which is decided at runtime from the planet count, and it cannot judge
 * whether any other Tamil reads naturally.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["components", "lib", "app", "../packages/shared/src"];
const SELF = path.normalize("lib/combustion-verb.test.ts");

/** The split form ("அஸ்தங்கம் அடை…") and the honorific ending. */
const BANNED = [/அஸ்தங்கம்\s+அடை/u, /அஸ்தங்கமடை[^\s"'`]*ார்/u];

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
    return /\.(tsx?|mjs)$/.test(full) && path.normalize(full) !== SELF ? [full] : [];
  });
}

describe("combustion verb in Tamil copy", () => {
  it("is written as one word and never with the honorific -ார்", () => {
    const hits: string[] = [];
    for (const root of ROOTS) {
      for (const file of listFiles(root)) {
        readFileSync(file, "utf8").split("\n").forEach((line, i) => {
          if (BANNED.some((re) => re.test(line))) hits.push(`${file.split(path.sep).join("/")}:${i + 1}`);
        });
      }
    }
    expect(hits).toEqual([]);
  });
});
