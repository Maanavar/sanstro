// Vinaadi AI — Mobile Spacing Tokens
// Source of truth: packages/design-tokens/tokens.json
// Base unit: 4px

export const S = {
  // Token-aligned names (use these in new code)
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,

  // Legacy names (keep for backward compat — existing screens use these)
  base: 16, // = lg
  xxl:  32, // = 2xl
  // Note: old `lg: 20` had no equivalent in the 4px grid. Components using
  // S.lg now get 16 (design constitution value). Use S.xl (24) for the old
  // "spacious lg" intent if needed.
} as const;

export const RADIUS = {
  // Token-aligned names
  sm:   6,   // --radius-sm
  md:   10,  // --radius-md  (input fields)
  lg:   16,  // --radius-lg  (bottom sheets)
  xl:   24,  // --radius-xl  (hero cards)
  full: 9999,

  // Legacy names (keep for backward compat)
  card:        16, // = lg
  button:      10, // = md
  chip:        9999, // = full
  bottomSheet: 24, // = xl
  input:       10, // = md
} as const;

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
