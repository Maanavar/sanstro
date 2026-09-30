/**
 * Ratchet for the two palette guarantees that no other gate in this repo can
 * make, in BOTH themes.
 *
 * WHY A UNIT TEST AND NOT JUST THE SCRIPT. scripts/theme-contrast-matrix.mjs
 * is the readable report; this is the thing that actually runs. `npm test` is
 * in CI, `node scripts/...` is not, and a gate that depends on someone
 * remembering to invoke it is a gate that records PASS by not being run. The
 * script and this file share scripts/lib/theme-tokens.mjs, so they cannot
 * disagree about what the cascade resolves to.
 *
 * WHY NOT e2e/theme-contrast.spec.ts. That spec is the better evidence for
 * everything it covers — it measures composited pixels in a real browser. But
 * it runs axe's `color-contrast` rule, and axe implements no check for WCAG
 * 1.4.11 Non-text Contrast at all. The control-boundary case below is not a
 * pair that gate happened to miss; it is a criterion outside every browser
 * gate we own. It was green on a 1.43:1 input border and would have stayed
 * green forever.
 *
 * WHAT THIS CANNOT SEE — so it is not inherited as "the themes are clean":
 *   - Whether any of this renders. It resolves the stylesheet, not the app.
 *   - Font size/weight, so no large-text allowance is granted anywhere here.
 *   - Component-applied opacity, in-flight animation alphas, images, canvas,
 *     and every gradient except the hero band's declared stops.
 *   - Tamil surfaces, mobile viewports, and anything outside .cd-shell.
 *   The browser gate owns the first four; nothing owns the last two yet.
 */
import { describe, it, expect } from "vitest";
import { resolveTheme, contrast, over } from "../../scripts/lib/theme-tokens.mjs";

const THEMES = ["light", "dark"] as const;

/** Grounds a form control actually renders against. */
const CONTROL_GROUNDS = [
  "--color-surface",      // inside a Card — the common case, and the worst one,
  "--color-surface-soft", // because .ui-input's own fill is --color-surface too
  "--color-surface-2",
  "--color-bg",
] as const;

function ratio(theme: (typeof THEMES)[number], fgToken: string, bgToken: string) {
  const { colors } = resolveTheme(theme);
  // Everything composites down onto the theme's own base plane; a translucent
  // token measured against white would report a light-theme number on dark.
  const base = over(colors.get(theme === "light" ? "--color-surface" : "--color-bg")!, [255, 255, 255]);
  const ground = over(colors.get(bgToken)!, base);
  const fg = colors.get(fgToken);
  if (!fg) throw new Error(`${fgToken} does not resolve to a colour in the ${theme} theme`);
  return contrast(over(fg, ground), ground);
}

describe("WCAG 1.4.11 — control boundaries, both themes", () => {
  // A text input has no label inside it announcing that it is editable, so its
  // boundary is its identification and the criterion's 3:1 applies squarely.
  // --color-border-strong, which these controls used to carry, sits at 1.43
  // (light) / 1.60 (dark) against the very same --color-surface fill the
  // control paints itself with.
  for (const theme of THEMES) {
    for (const ground of CONTROL_GROUNDS) {
      it(`${theme}: --color-border-control clears 3:1 on ${ground}`, () => {
        expect(ratio(theme, "--color-border-control", ground)).toBeGreaterThanOrEqual(3);
      });
    }
  }

  // The token exists to be a hard outline. If someone "tidies" it back onto the
  // soft-chrome ramp the ratio check above would still be the thing that fails,
  // but this says the intent out loud so the failure is self-explaining.
  for (const theme of THEMES) {
    it(`${theme}: the control outline is stronger than the decorative hairline`, () => {
      expect(ratio(theme, "--color-border-control", "--color-surface"))
        .toBeGreaterThan(ratio(theme, "--color-border-strong", "--color-surface"));
    });
  }
});

describe("WCAG 1.4.11 — keyboard focus ring, both themes", () => {
  // UXD-07 points --focus-ring at the theme's accent gold on .cd-shell. That
  // declaration is on the shell, not on :root, which is easy to miss when
  // reading the cascade by hand — globals.css sets a near-black #1A1612 that
  // would be invisible on the dark shell if the shell rule ever went away.
  for (const theme of THEMES) {
    for (const ground of ["--color-surface", "--color-bg", "--color-surface-2"] as const) {
      it(`${theme}: focus ring clears 3:1 on ${ground}`, () => {
        expect(ratio(theme, "--focus-ring", ground)).toBeGreaterThanOrEqual(3);
      });
    }
  }
});

describe("the two themes define the same palette", () => {
  // Two of the 2026-08-21 audit's seven findings were fixes reasoned out in one
  // theme and never carried to its twin. A token that resolves in one theme and
  // not the other is that defect's earliest observable form: the var() falls
  // back to nothing and the property silently drops.
  it("every --color-* token that resolves in one theme resolves in the other", () => {
    const light = resolveTheme("light").colors;
    const dark = resolveTheme("dark").colors;
    const names = new Set([...light.keys(), ...dark.keys()].filter((k) => k.startsWith("--color-")));
    const missing = [...names].filter((k) => !light.has(k) || !dark.has(k));
    expect(missing).toEqual([]);
  });
});
