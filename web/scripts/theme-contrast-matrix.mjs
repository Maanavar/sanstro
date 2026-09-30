/**
 * Static WCAG matrix over the Nova palette, both themes.
 *
 * This is the twin of e2e/theme-contrast.spec.ts, not a replacement for it.
 * The browser gate measures composited pixels on the routes it sweeps; it is
 * the better evidence and it is the one that must stay green. But its coverage
 * is the ROUTE set — top-level tab panes plus the day drawer, in English, at
 * 1280x900 — so a pair reachable only through a sub-tool, an error state, a
 * Tamil-only string or a viewport it does not visit is outside it by
 * construction. This walks the TOKEN set instead, so adding a token puts it in
 * scope whether or not anything renders it yet.
 *
 * WHAT IT CHECKS
 *   text      every ink on every ground the light ink contract names
 *             (dashboard-nova.css, "THE LIGHT INK CONTRACT"), extended to the
 *             dark block, which had no written twin — plus each ink on its own
 *             tint, which is where the 2026-08-21 browser pass found 42 of its
 *             failing nodes.
 *   hero      the inks that land directly on --nova-hero-gradient, measured at
 *             the band's own stops. The band is not a token, so no ground-based
 *             sweep sees it; this is the ground the Chandrashtama pill was
 *             failing on.
 *   non-text  borders, focus ring and status fills against their grounds at the
 *             3:1 of WCAG 1.4.11. axe does not implement 1.4.11 at all, so this
 *             is not redundant with the browser gate — it is the only check.
 *
 * WHAT IT CANNOT SEE — the blind spots, recorded here rather than discovered
 * later, per CLAUDE.md "A gate proves its own check, not the item":
 *   - Font size and weight. AA allows 3:1 for large text (>=24px, or >=18.66px
 *     bold). This reports against 4.5 always. A flagged pair that only ever
 *     renders at display size is a false positive and must be dismissed BY
 *     NAMING THE CALL SITE, not by lowering the threshold here.
 *   - Whether a pair renders at all. An ink that no component ever puts on a
 *     given ground is arithmetic, not a defect.
 *   - Gradients other than the hero band, images, SVG fills, canvas.
 *   - Opacity applied by a component (`style={{opacity:.6}}`) or by an
 *     in-flight animation. The browser gate owns those.
 *
 * Usage:  node scripts/theme-contrast-matrix.mjs [--json] [--all]
 */
import { resolveTheme, contrast, over, toHex, HERO_STOPS } from "./lib/theme-tokens.mjs";

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3.0;

/** Inks: tokens that render as small text somewhere in the dashboard. */
const INKS = [
  "--color-text-strong", "--color-text", "--color-muted",
  "--color-accent", "--color-text-accent", "--color-accent-strong",
  "--color-accent-secondary",
  "--color-high", "--color-mid-text", "--color-low", "--color-neutral",
  "--color-positive", "--color-alert-critical-text",
  "--deepdive-ink", "--deepdive-ink-mid", "--deepdive-accent",
  "--deepdive-good", "--deepdive-warn", "--deepdive-info",
  // --color-faint is the smallest ink in the palette and was missing from the
  // first pass of this list. It is not decorative: it carries the porutham
  // score denominator ("/ 10 PORUTHAMS") and the score baseline caption, both
  // at --text-xs / --text-2xs on --color-surface-3. Omitting an ink because it
  // is named "faint" is how the quietest text on the page goes unmeasured.
  "--color-faint",
  // The score ramp renders as the score NUMBER itself, at display size, and as
  // the verdict chip label at --text-xs — the chip is the small-text case and
  // it is the one that has to clear 4.5.
  "--color-score-weak", "--color-score-low", "--color-score-fair",
  "--color-score-mid", "--color-score-good", "--color-score-high",
  "--color-score-strong",
];

/**
 * Plain grounds. `required: true` means an ink that fails here fails the build.
 *
 * The first five are the light ink contract's own list (dashboard-nova.css),
 * plus --chart-bg, which light aliases to surface-soft but dark does not.
 *
 * --color-surface-3 is the exception and it is worth the paragraph, because
 * the token means OPPOSITE things in the two themes. Dark's #0A0E20 is deeper
 * than --color-surface and dark's inks are light, so it is dark's most
 * generous ground — every ink clears it easily. Light's #DDD6C8 is the
 * deepest cream and light's inks are dark, so it is light's contrast FLOOR:
 * twelve inks land between 4.20 and 4.49 on it, all just under AA. Same token
 * name, inverted behaviour, and the ink contract never named it.
 *
 * Three components were rendering small text on it in light (the porutham
 * score disc, the setup-tab premium nudge, and .nova-hero before it was
 * pointed at --nova-hero-gradient). All three now use a lighter ground, so the
 * rows below are arithmetic rather than defects — which is exactly why they
 * are advisory and not failing. A gate that stays red on pairs nothing renders
 * is a gate that gets ignored, and the next real failure arrives in a report
 * the reader has already learned to skip.
 *
 * What the advisory is FOR: light's surface-3 is a decorative deep ground, not
 * a text ground. If you are about to put small text on it, these rows are the
 * reason not to. They are not a licence to add one.
 */
const GROUNDS = [
  ["--color-bg", true], ["--color-surface", true], ["--color-surface-soft", true],
  ["--color-surface-2", true], ["--color-accent-muted", true], ["--chart-bg", true],
  ["--color-surface-3", false],
];

/** Ink -> its own tint token(s). The contract measures a tint composited over
 *  bg/surface/surface-soft; the -bg-solid twins are already opaque. */
const TINTS = {
  "--color-high": ["--color-high-bg", "--color-high-bg-solid"],
  "--color-mid-text": ["--color-mid-bg", "--color-mid-bg-solid"],
  "--color-low": ["--color-low-bg", "--color-low-bg-solid"],
  "--color-neutral": ["--color-neutral-bg", "--color-neutral-bg-solid"],
  "--color-accent-secondary": ["--color-accent-secondary-muted", "--color-accent-secondary-bg-solid"],
};
const TINT_BASES = ["--color-bg", "--color-surface", "--color-surface-soft"];

/** Inks that land directly on the hero band (no Card between them and it).
 *  Read off dashboard-hero.tsx / dashboard-today-tab-nova.tsx. */
const HERO_INKS = [
  "--color-text-strong", "--color-text", "--color-muted",
  "--color-text-accent", "--color-accent-strong", "--color-accent-secondary",
];

/**
 * Non-text pairs the 3:1 of WCAG 1.4.11 actually governs.
 *
 * The criterion covers "visual information required to IDENTIFY user interface
 * components and states" — not every edge on the page. Getting that line wrong
 * in either direction breaks the gate:
 *
 *   too narrow  and it misses the real defect (this list's first version left
 *               --color-border-control out entirely, because the token did not
 *               exist yet and controls were sitting on a 1.43:1 decorative
 *               hairline that nothing measured).
 *   too wide    and it fails forever on edges no criterion requires, which is
 *               how a gate stops being read. The first version of this list did
 *               that too: it reported the four status-chip borders as failures
 *               at ~1.7, and a status chip is identified by its LABEL — which
 *               clears AA as text, above — with the edge as reinforcement. A
 *               chip whose border vanished would still be a readable chip.
 *
 * So: controls that a border alone identifies, and the focus ring, are
 * REQUIRED. Decorative edges are measured and printed under --all, but they do
 * not fail the build. Each one is listed with the reason it is decorative, so
 * the judgement is auditable rather than implied by omission.
 */
const NON_TEXT = [
  // ── Required: 1.4.11 applies. ──
  ["--color-border-control", "--color-surface", "input/select/textarea + toggle track on a card", true],
  ["--color-border-control", "--color-surface-soft", "control on a soft panel", true],
  ["--color-border-control", "--color-surface-2", "control on a deep panel", true],
  ["--color-border-control", "--color-bg", "control on the page ground", true],
  ["--focus-ring", "--color-surface", "keyboard focus ring on a card", true],
  ["--focus-ring", "--color-bg", "keyboard focus ring on the page", true],
  ["--focus-ring", "--color-surface-2", "keyboard focus ring on a panel", true],

  // ── Decorative: measured, never failed. ──
  ["--color-border", "--color-surface", "card hairline — a card is identified by fill + shadow", false],
  ["--color-border-strong", "--color-surface", "raised-card hairline — same", false],
  ["--color-high-border", "--color-surface", "status chip edge — the chip's label carries it", false],
  ["--color-mid-border", "--color-surface", "status chip edge — the chip's label carries it", false],
  ["--color-low-border", "--color-surface", "status chip edge — the chip's label carries it", false],
  ["--color-neutral-border", "--color-surface", "status chip edge — the chip's label carries it", false],
];

function ratio(fgTok, bgTok, colors, groundOverride) {
  const fg = colors.get(fgTok);
  const bgRaw = colors.get(bgTok);
  if (!fg || !bgRaw) return null;
  const ground = over(bgRaw, groundOverride ?? [255, 255, 255]);
  const ink = over(fg, ground);
  return { value: contrast(ink, ground), ink: toHex(ink), ground: toHex(ground) };
}

const wantJson = process.argv.includes("--json");
const showAll = process.argv.includes("--all");
const report = { light: [], dark: [] };

for (const theme of ["light", "dark"]) {
  const { colors } = resolveTheme(theme);
  const opaqueBase = colors.get(theme === "light" ? "--color-surface" : "--color-bg");
  const rows = [];

  const push = (kind, ink, ground, r, min, note, required = true) => {
    if (!r) return;
    rows.push({
      kind, ink, ground, ratio: r.value, inkHex: r.ink, groundHex: r.ground, min, note, required,
      // `pass` is what fails the build; a decorative row below threshold is
      // reported as `advisory` and never blocks.
      pass: r.value >= min || !required,
      advisory: r.value < min && !required,
    });
  };

  // ink x plain ground
  for (const ink of INKS) {
    for (const [g, required] of GROUNDS) {
      push("text", ink, g, ratio(ink, g, colors, opaqueBase), AA_TEXT, undefined, required);
    }
  }

  // ink x its own tint, composited over each of the three bases
  for (const [ink, tints] of Object.entries(TINTS)) {
    for (const tint of tints) {
      const isSolid = tint.endsWith("-solid");
      for (const base of isSolid ? ["--color-surface"] : TINT_BASES) {
        const baseRgb = colors.get(base);
        if (!baseRgb) continue;
        const r = ratio(ink, tint, colors, over(baseRgb, opaqueBase));
        push("tint", ink, `${tint} / ${base}`, r, AA_TEXT);
      }
    }
  }

  // hero band
  const stops = HERO_STOPS[theme];
  if (stops) {
    for (const ink of HERO_INKS) {
      const fg = colors.get(ink);
      if (!fg) continue;
      for (const [label, hex] of Object.entries(stops)) {
        const ground = over([...hexToRgb(hex)], opaqueBase);
        const inkRgb = over(fg, ground);
        rows.push({
          kind: "hero", ink, ground: label, ratio: contrast(inkRgb, ground),
          inkHex: toHex(inkRgb), groundHex: hex, min: AA_TEXT,
          pass: contrast(inkRgb, ground) >= AA_TEXT,
        });
      }
    }
  }

  for (const [tok, g, note, required] of NON_TEXT) {
    push("non-text", tok, g, ratio(tok, g, colors, opaqueBase), AA_NON_TEXT, note, required);
  }

  report[theme] = rows;
}

function hexToRgb(h) {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}

if (wantJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

let failures = 0;
for (const theme of ["light", "dark"]) {
  const rows = report[theme];
  const failed = rows.filter((r) => !r.pass);
  const advisory = rows.filter((r) => r.advisory);
  const shown = showAll ? rows : [...failed, ...advisory];
  failures += failed.length;
  console.log(
    `\n══ ${theme.toUpperCase()} — ${rows.length} pairs measured, ` +
    `${failed.length} failing, ${advisory.length} advisory`,
  );
  if (!shown.length) { console.log("   (all clear)"); continue; }
  for (const r of shown.sort((a, b) => a.ratio - b.ratio)) {
    const mark = !r.pass ? "!!" : r.advisory ? "··" : "  ";
    console.log(
      `${mark} ${r.ratio.toFixed(2).padStart(5)} /${r.min}  ${r.kind.padEnd(8)} ` +
      `${r.ink.padEnd(30)} ${r.inkHex}  on  ${r.ground.padEnd(42)} ${r.groundHex}` +
      (r.note ? `  — ${r.note}` : ""),
    );
  }
}
console.log(
  `\n${failures} required pair(s) below threshold.` +
  (failures ? "" : "  (··  rows are decorative edges — measured, not required; see NON_TEXT.)"),
);
process.exit(failures ? 1 : 0);
