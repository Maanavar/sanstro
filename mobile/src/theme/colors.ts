export const C = {
  saffron:      "#D4611A",
  ochre:        "#A8430E",
  amber:        "#F5A855",
  maroon:       "#8B1A3C",
  gold:         "#C9971C",
  parchment:    "#FAF7F2",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F5F0EA",
  textPrimary:  "#1C1008",
  textSecond:   "#6B5744",
  textTertiary: "#A89080",
  green:        "#2D7A3A",
  caution:      "#C0600A",
  alert:        "#B91C3C",
  skyBlue:      "#1A5EA8",
  divider:      "#E8DDD0",
  darkBg:       "#0F1520",
  darkSurface:  "#1E2A3A",
} as const;

export type ColorKey = keyof typeof C;

export const SCORE_COLORS = {
  high:    C.green,
  amber:   C.amber,
  caution: C.caution,
  rest:    C.textTertiary,
} as const;
