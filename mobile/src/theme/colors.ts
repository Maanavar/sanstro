// TODO(dark-mode): Dark mode is deferred to Phase 4. When committed, introduce
// a useColors() hook that returns a scheme-aware palette instead of this
// static constant. Track every hardcoded "#FFFFFF" / "#F5EFE6" / "white" in
// StyleSheet.create — those are the blockers for a full dark-mode pass.
export const C = {
  // Brand
  saffron:      "#D4611A",
  ochre:        "#A8430E",
  amber:        "#F5A855",
  maroon:       "#8B1A3C",

  // Surfaces
  parchment:    "#FAF7F2",
  parchmentDeep:"#EDE4D5",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F5F0EA",

  // Method / Gold accent
  gold:            "#C9971C",
  goldMethod:      "#C9971C", // semantic alias — use on calculation labels, method strips, Thirukanitham badge
  goldMethodLight: "#FDF3D9", // gold chip backgrounds

  // Text
  textPrimary:  "#1C1008",
  textSecond:   "#6B5744",
  textTertiary: "#A89080",

  // Status
  green:   "#2D7A3A",
  caution: "#C0600A",
  alert:   "#B91C3C",
  skyBlue: "#1A5EA8",

  // UI
  divider: "#E8DDD0",

  // Dark surfaces (premium screen, reveal moments)
  darkBg:      "#0F1520",
  darkSurface: "#1E2A3A",

  // Interpretation depth (deep indigo — for premium/reveal dark screens)
  deepIndigo:   "#0D0F1A",
  indigoSurface:"#161929",
  indigoText:   "#E8E4F0",
} as const;

export type ColorKey = keyof typeof C;

export const SCORE_COLORS = {
  high:    C.green,
  amber:   C.amber,
  caution: C.caution,
  rest:    C.textTertiary,
} as const;
