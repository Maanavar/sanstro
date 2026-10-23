/**
 * The touch policy (DXA-39, owner decision D5): size follows the device, hit
 * area follows the finger.
 *
 * The defect this guards is not "a control was the wrong size". It is a media
 * query that matches the wrong DEVICE. `pointer: coarse` is true of the
 * owner's touchscreen laptop, which they drive with a mouse — so a bare
 * `@media (pointer: coarse)` rule that sets a size is applied there, and on
 * 15 Sep 2026 that stretched every row of the Calendar rail to a thumb's
 * height and produced the near-empty rail they flagged. The fix is to say
 * which of the two things you mean:
 *
 *   - `(pointer: coarse) and (hover: none)` — a phone or tablet. Size may
 *     change; there is vertical room to spend.
 *   - `(any-pointer: coarse)` — anything a finger can reach, hybrids included.
 *     Layout must NOT change; the finger gets an invisible hit slop instead.
 *
 * So this parses the stylesheet and fails on the shape, not on any one rule:
 * a coarse-pointer query that does not exclude hover and that sets a
 * size-affecting property. A new one has to state its intent to get in.
 *
 * Node env — it reads the CSS as text. There is no browser here, and there
 * does not need to be: the bug was in the prelude, not the render.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CSS = path.join("app", "dashboard", "dashboard-nova.css");

/** Properties that move layout. `min-height` is the one that did the damage. */
const SIZING = /(^|[\s;{])(min-height|min-width|height|width|padding(-block|-block-start|-block-end|-top|-bottom)?)\s*:/;

/**
 * Every `@media` block whose prelude mentions a coarse pointer, with its body.
 *
 * Brace-counted from the prelude, so a nested block cannot leak its
 * declarations into an unrelated query — and `@media` blocks here do nest
 * (the reduced-motion guard sits inside width queries elsewhere in the file).
 */
function coarseMediaBlocks(source: string): Array<{ prelude: string; body: string; line: number }> {
  const found: Array<{ prelude: string; body: string; line: number }> = [];
  // `source` must already have its comments blanked (`withoutComments`).
  const re = /@media([^{]*)\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const prelude = match[1].trim();
    if (!/pointer\s*:\s*coarse/.test(prelude)) continue;
    let depth = 1;
    let i = re.lastIndex;
    while (i < source.length && depth > 0) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") depth -= 1;
      i += 1;
    }
    found.push({
      prelude,
      body: source.slice(re.lastIndex, i - 1),
      line: source.slice(0, match.index).split("\n").length,
    });
  }
  return found;
}

/**
 * Blank out CSS comments, keeping every newline so the line numbers reported
 * below still point at the real rule.
 *
 * Three comments in this stylesheet discuss `@media (pointer: coarse)` in
 * prose. A scanner that reads them matches the `@media` inside the comment,
 * runs its "prelude" on to the next real `{` far below, and reports the
 * component-kit header as a policy violation — which is exactly what the first
 * version of this test did.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}

describe("touch policy (D5)", () => {
  const source = withoutComments(readFileSync(CSS, "utf8"));
  const blocks = coarseMediaBlocks(source);

  it("finds the coarse-pointer queries it is meant to police", () => {
    // A parser that silently matched nothing would pass every other case here.
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("never changes size for a coarse pointer that can also hover", () => {
    const offenders = blocks
      .filter(({ prelude }) => !/hover\s*:\s*none/.test(prelude) && !/any-pointer/.test(prelude))
      .filter(({ body }) => SIZING.test(body))
      .map(({ prelude, line }) => `${CSS}:${line} — @media ${prelude}`);

    expect(offenders).toEqual([]);
  });

  it("never gives the toggle a height floor: its track is the control", () => {
    const offenders = blocks
      .filter(({ body }) => /\.ui-toggle\b[^{}]*\{[^}]*min-height/.test(body))
      .map(({ prelude, line }) => `${CSS}:${line} — @media ${prelude}`);

    expect(offenders).toEqual([]);
  });

  it("gives phones a real 44px target, not only a hit slop", () => {
    const phone = blocks.filter(({ prelude }) => /hover\s*:\s*none/.test(prelude));
    const floored = phone.map(({ body }) => body).join("\n");

    for (const control of [".ui-btn", ".ui-pill", ".ui-segmented__btn", "button.ui-chip", ".om__ask-btn"]) {
      expect(floored, `${control} has no 44px floor on phones`).toContain(control);
    }
    expect(floored).toContain("var(--touch-target)");
  });
});
