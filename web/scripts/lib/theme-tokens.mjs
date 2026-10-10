/**
 * Resolve the Nova palette for both themes, the way the browser cascade does.
 *
 * WHY THIS IS NOT A REGEX OVER THE STYLESHEET. Almost every token in this
 * palette is a var() chain that crosses files — `--color-surface-2` is declared
 * only in the dark block of dashboard-nova.css, and light picks it up from
 * globals.css's `:root` as `var(--surface-2)`, which is itself a raw hex three
 * declarations further up. A grep for `--color-surface-2` in the light block
 * returns nothing and the naive conclusion is "light does not use it", which is
 * false: light renders it on every panel that --panel-cream redirects.
 *
 * WHY IT IS NOT A BROWSER EITHER. The browser gate (e2e/theme-contrast.spec.ts)
 * measures composited pixels, which is strictly better evidence — but it can
 * only measure the pairs that a swept tab happens to *render*. A token pair
 * that is only reachable through a sub-tool, an error state, or a Tamil-only
 * surface is outside it by construction, and so is a pair that exists in the
 * palette and has no call site yet but will the first time someone writes one.
 * This resolves the palette itself, so its coverage is the token set rather
 * than the route set. The two gates are complements; neither replaces the other.
 *
 * KNOWN BLIND SPOTS, stated rather than discovered later:
 *   - Gradients. --nova-hero-gradient is a multi-stop composite; this file
 *     records its stops as explicit grounds (HERO_STOPS) so ink on the band can
 *     be measured, but it does not integrate across the ramp.
 *   - Anything painted by an image, an SVG fill, or a canvas.
 *   - Actual font size and weight at a call site. AA's 3:1 large-text allowance
 *     needs >=18.66px bold or >=24px; this file reports the 4.5 number and the
 *     caller decides. Nothing here grants a pass on the large-text rule.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const WEB_ROOT = path.resolve(__dirname, "..", "..");

// ── colour maths ──────────────────────────────────────────────────────────

/** sRGB channel -> linear. WCAG 2.x definition, not the 2.2 sRGB piecewise. */
function toLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([r, g, b]) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrast(fg, bg) {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Composite a possibly-translucent colour over an opaque ground. */
export function over(fg, bg) {
  const alpha = fg.length === 4 ? fg[3] : 1;
  if (alpha >= 1) return [fg[0], fg[1], fg[2]];
  return [0, 1, 2].map((i) => Math.round(fg[i] * alpha + bg[i] * (1 - alpha)));
}

export function toHex(rgb) {
  return `#${rgb.slice(0, 3).map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

// ── value parsing ─────────────────────────────────────────────────────────

const NAMED = { white: [255, 255, 255], black: [0, 0, 0], transparent: [0, 0, 0, 0] };

/** Parse a resolved (var-free) colour literal to [r,g,b] or [r,g,b,a]. */
export function parseColor(value) {
  const v = String(value).trim().toLowerCase();
  if (NAMED[v]) return NAMED[v].slice();

  let m = /^#([0-9a-f]{3})$/.exec(v);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));

  m = /^#([0-9a-f]{6})$/.exec(v);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));

  m = /^#([0-9a-f]{8})$/.exec(v);
  if (m) {
    const n = [0, 2, 4, 6].map((i) => parseInt(m[1].slice(i, i + 2), 16));
    return [n[0], n[1], n[2], n[3] / 255];
  }

  m = /^rgba?\(([^)]+)\)$/.exec(v);
  if (m) {
    const parts = m[1].split(/[,/\s]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return parts.length > 3 && Number.isFinite(parts[3])
        ? [parts[0], parts[1], parts[2], parts[3]]
        : [parts[0], parts[1], parts[2]];
    }
  }

  // color-mix(in srgb, A P%, B) — the form this repo actually uses. Anything
  // else (oklch interpolation, three-way mixes) returns null rather than a
  // wrong number; a silent approximation here would be worse than a gap.
  m = /^color-mix\(\s*in\s+srgb\s*,\s*(.+)\)$/.exec(v);
  if (m) {
    const args = splitTop(m[1]);
    if (args.length === 2) {
      const a = parseWeighted(args[0]);
      const b = parseWeighted(args[1]);
      if (a && b) {
        let pa = a.pct, pb = b.pct;
        if (pa == null && pb == null) { pa = 50; pb = 50; }
        else if (pa == null) pa = 100 - pb;
        else if (pb == null) pb = 100 - pa;
        const total = pa + pb;
        if (total > 0) {
          const wa = pa / total, wb = pb / total;
          const ca = a.rgb, cb = b.rgb;
          const aa = ca.length === 4 ? ca[3] : 1;
          const ab = cb.length === 4 ? cb[3] : 1;
          const alpha = aa * wa + ab * wb;
          // Premultiplied, which is what the spec does and what makes a mix
          // with `transparent` behave (transparent is rgb(0 0 0 / 0), so a
          // naive average would drag the hue to black).
          const mix = [0, 1, 2].map((i) =>
            alpha === 0 ? 0 : (ca[i] * aa * wa + cb[i] * ab * wb) / alpha,
          );
          return alpha >= 1 ? mix : [...mix, alpha];
        }
      }
    }
    return null;
  }

  return null;
}

function parseWeighted(arg) {
  const m = /^(.*?)(?:\s+([\d.]+)%)?$/.exec(arg.trim());
  if (!m) return null;
  const rgb = parseColor(m[1].trim());
  if (!rgb) return null;
  return { rgb, pct: m[2] == null ? null : Number(m[2]) };
}

/** Split on commas that are not inside parentheses. */
function splitTop(s) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

// ── cascade ───────────────────────────────────────────────────────────────

/** Strip comments, then pull `--name: value;` pairs out of a text region. */
function declarations(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = new Map();
  const re = /(--[a-z0-9-]+)\s*:\s*([^;}]+)[;}]/gi;
  let m;
  while ((m = re.exec(clean))) out.set(m[1], m[2].trim());
  return out;
}

/** The text of the first top-level block whose selector matches `needle`. */
function blockAfter(css, needle) {
  const at = css.indexOf(needle);
  if (at === -1) return "";
  const open = css.indexOf("{", at);
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return "";
}

/** All blocks whose selector text matches, concatenated in source order —
 *  `:root` is declared more than once in both files and later wins. */
function allBlocks(css, selectorRe) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  const re = new RegExp(`(^|\\})\\s*(${selectorRe})\\s*\\{`, "gm");
  let m;
  while ((m = re.exec(stripped))) {
    const open = stripped.indexOf("{", m.index + m[0].length - 1);
    let depth = 0;
    for (let i = open; i < stripped.length; i++) {
      if (stripped[i] === "{") depth++;
      else if (stripped[i] === "}") {
        depth--;
        if (depth === 0) { out.push(stripped.slice(open + 1, i)); re.lastIndex = i; break; }
      }
    }
  }
  return out.join("\n");
}

// The base layer is a built artefact of packages/design-tokens, imported in
// app/layout.tsx *before* globals.css. It is where --text-primary, --surface-0
// and the rest of the ramp actually live; neither globals.css nor
// dashboard-nova.css declares them, they only alias them. Omitting this file
// makes the light theme resolve to a third of its palette and the missing two
// thirds look like "light does not use these tokens", which is the exact wrong
// conclusion — light inherits nearly all of its ramp from here.
const tokensCss = fs.readFileSync(
  path.resolve(WEB_ROOT, "..", "packages", "design-tokens", "dist", "web", "tokens.css"),
  "utf8",
);
const globalsCss = fs.readFileSync(path.join(WEB_ROOT, "app", "globals.css"), "utf8");
const novaCss = fs.readFileSync(path.join(WEB_ROOT, "app", "dashboard", "dashboard-nova.css"), "utf8");

/**
 * Build the variable map a `.cd-shell` descendant sees in one theme.
 *
 * Order mirrors specificity+source order for the selectors that actually carry
 * palette tokens. It is deliberately a short, named list rather than a general
 * cascade engine: a general engine would be wrong in ways nobody could audit,
 * whereas this list can be read against the stylesheet by eye.
 */
export function resolveTheme(theme) {
  const layers = [
    allBlocks(tokensCss, ":root"),
    // tokens.css ships both an explicit [data-theme=...] block and a
    // prefers-color-scheme media query. The app always stamps an explicit
    // data-theme (the pre-paint script in app/layout.tsx guarantees it, System
    // included), so the attribute block is the one that renders and the media
    // query is dead weight for our purposes — modelling the media query would
    // describe a state the app never reaches.
    theme === "light" ? blockAfter(tokensCss, '[data-theme="light"]') : blockAfter(tokensCss, '[data-theme="dark"]'),
    allBlocks(globalsCss, ":root"),
    theme === "light" ? blockAfter(globalsCss, '[data-theme="light"]') : blockAfter(globalsCss, '[data-theme="dark"]'),
    allBlocks(novaCss, ':root\\[data-ui="nova"\\]'),
    // The unconditional `.cd-shell` block, which is easy to forget because it
    // is introduced as "structural only (nav shape, spacing, radii, type)".
    // It is not only structural: it re-points --focus-ring at the accent gold,
    // and it declares it on .cd-shell rather than on :root, so it beats the
    // globals.css :root value for everything inside the dashboard. Leaving this
    // layer out made the resolver report a near-black #1A1612 focus ring on the
    // dark shell — a dramatic false positive that the stylesheet disproves in
    // one grep. Kept as a named layer with this note so the next reader does
    // not re-derive it.
    allBlocks(novaCss, '\\[data-ui="nova"\\] \\.cd-shell'),
    theme === "light"
      ? blockAfter(novaCss, '[data-ui="nova"][data-theme="light"] .cd-shell')
      : blockAfter(novaCss, '[data-ui="nova"]:not([data-theme="light"]) .cd-shell'),
  ];

  const raw = new Map();
  for (const layer of layers) for (const [k, v] of declarations(layer)) raw.set(k, v);

  // Resolve var() chains with a depth bound — a self-referential token
  // (`--x: color-mix(... var(--x))`) is a real failure mode in this repo and
  // must surface as an unresolved value, not as a stack overflow.
  const resolved = new Map();
  function expand(name, seen = new Set()) {
    if (resolved.has(name)) return resolved.get(name);
    if (seen.has(name)) return null; // cycle
    seen.add(name);
    let value = raw.get(name);
    if (value == null) return null;
    for (let pass = 0; pass < 12 && value.includes("var("); pass++) {
      value = value.replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]*))?\)/gi, (_all, ref, fallback) => {
        const got = expand(ref, new Set(seen));
        return got ?? (fallback ?? "").trim();
      });
    }
    resolved.set(name, value);
    return value;
  }
  for (const name of raw.keys()) expand(name);

  const colors = new Map();
  for (const [name, value] of resolved) {
    if (value == null) continue;
    const rgb = parseColor(value);
    if (rgb) colors.set(name, rgb);
  }
  return { raw, resolved, colors };
}

/**
 * Explicit stops of --nova-hero-gradient, per theme. The band is the one
 * ground in this palette that is not a token, and the ink on it is real text
 * (the greeting h1, the briefing lede, the focus line, the weather prose).
 *
 * Dark's stops include the plum aurora composited at its peak alpha, not just
 * the linear ramp underneath. That matters and it is easy to get backwards:
 * the aurora LIGHTENS the ground, and dark's inks are light, so the radial
 * REDUCES contrast where it is strongest. Measuring the bare linear would
 * report the hero's best case and call it the worst.
 */
export const HERO_STOPS = {
  light: { "hero-lit": "#FDF8ED", "hero-mid": "#F6EEDD", "hero-deep": "#E8DCC6" },
  dark: {
    // linear-gradient(150deg, #151827 0%, #0A0E20 62%)
    "hero-lit": "#151827",
    "hero-deep": "#0A0E20",
    // ...with radial-gradient(... rgba(101, 82, 216, 0.24)) over the top-left,
    // which is where the greeting and the lede sit.
    "hero-aurora": toHex(over([101, 82, 216, 0.24], [0x15, 0x18, 0x27])),
  },
};
