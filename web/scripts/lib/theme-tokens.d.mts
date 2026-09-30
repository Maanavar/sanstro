/**
 * Types for theme-tokens.mjs, which is plain ESM so the node scripts can run it
 * without a build step. Same arrangement as scripts/ux-audit-core.d.mts.
 *
 * These are hand-written and therefore unverified against the implementation —
 * nothing checks that this file still describes that one. Keep them in step by
 * hand when the module's exports change.
 */

/** [r, g, b] or [r, g, b, a] — alpha 0..1, channels 0..255. */
export type Rgb = [number, number, number] | [number, number, number, number];

export const WEB_ROOT: string;

export function relativeLuminance(rgb: Rgb | number[]): number;

/** WCAG 2.x contrast ratio. Both colours must already be opaque — composite
 *  with `over()` first, or a translucent ink reports its unblended value. */
export function contrast(fg: Rgb | number[], bg: Rgb | number[]): number;

/** Composite a possibly-translucent colour over an opaque ground. */
export function over(fg: Rgb | number[], bg: Rgb | number[]): number[];

export function toHex(rgb: Rgb | number[]): string;

/** Parse a var-free CSS colour literal. Returns null for forms this file does
 *  not model (oklch, three-way color-mix), rather than approximating. */
export function parseColor(value: string): number[] | null;

export interface ResolvedTheme {
  /** Declarations as written, still containing var() references. */
  raw: Map<string, string>;
  /** The same declarations with var() chains expanded. */
  resolved: Map<string, string>;
  /** Only those that parse to a colour. */
  colors: Map<string, number[]>;
}

export function resolveTheme(theme: "light" | "dark"): ResolvedTheme;

export const HERO_STOPS: Record<"light" | "dark", Record<string, string> | null>;
