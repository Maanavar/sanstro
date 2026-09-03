/**
 * A source-level guard for the prose gate, written because it was already
 * breached once and nothing caught it.
 *
 * `readingsAvailable: false` means the server computed a reading and withheld
 * every interpretive sentence pending Tamil native review. `ReadingsWithheldNote`
 * is the one place the UI says so. A view that omits it shows numbers with no
 * meaning and no account of the absence — which reads as a broken screen, not a
 * partial one.
 *
 * **The omission this encodes:** the personal-cycle view shipped without it, and
 * could not have had it, because `PersonalCycleResponse` was the single
 * numerology response that never carried `readingsAvailable` at all. It was also
 * the surface that needed it most — three bare digits and three graha names.
 * Both halves were fixed on 2026-07-29.
 *
 * Why a source scan rather than render tests: the failure is *absence*, and a
 * render test only ever asserts what a component does, never that a sibling
 * component was written at all. A new numerology view added next year is caught
 * by this and would not be caught by any number of tests over the existing ones.
 *
 * A source scan is a blunt instrument and this one is deliberately narrow: it
 * asks only whether the identifier appears. Rendering it under a condition that
 * is never true would pass — that is what the render tests in
 * `dashboard-numerology-shared.test.tsx` are for. The two cover different halves.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const COMPONENTS_DIR = path.resolve(import.meta.dirname);

/** Files that render a numerology reading to a user. */
function numerologyViewFiles(): string[] {
  return readdirSync(COMPONENTS_DIR)
    .filter(
      (name) =>
        name.startsWith("dashboard-numerology-") &&
        name.endsWith("-nova.tsx") &&
        // The panel is a tab switcher; it renders no reading of its own.
        name !== "dashboard-numerology-panel-nova.tsx",
    )
    .sort();
}

describe("every numerology view accounts for the withheld prose", () => {
  it("finds the views (the scan is worthless if the glob silently matches nothing)", () => {
    expect(numerologyViewFiles().length).toBeGreaterThanOrEqual(3);
  });

  it.each(numerologyViewFiles())("%s renders ReadingsWithheldNote", (file) => {
    const source = readFileSync(path.join(COMPONENTS_DIR, file), "utf8");
    expect(
      source.includes("<ReadingsWithheldNote"),
      `${file} renders numerology readings but never tells the user why the ` +
        `sentences are missing. Render <ReadingsWithheldNote readingsAvailable={…} /> ` +
        `from the response's own field — do not hardcode it, and do not omit it ` +
        `because the numbers "speak for themselves".`,
    ).toBe(true);
  });

  it.each(numerologyViewFiles())("%s reads the flag off the response, not a literal", (file) => {
    const source = readFileSync(path.join(COMPONENTS_DIR, file), "utf8");
    expect(
      /readingsAvailable=\{(?!true|false)/.test(source),
      `${file} passes a literal to readingsAvailable. The field exists so the ` +
        `server can change its mind; a hardcoded value makes the note lie in ` +
        `whichever direction it was hardcoded.`,
    ).toBe(true);
  });
});
