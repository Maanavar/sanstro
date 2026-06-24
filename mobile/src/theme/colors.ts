import { Appearance } from "react-native";

// Vinaadi AI — Mobile Color Tokens
// Source of truth: packages/design-tokens/tokens.json
// Light theme is the primary mobile theme.
// Dark mode map is added here ready for Phase 5.
// Import via useColors() hook — never import C directly in components.

export const CLight = {
  // ── Brand identity ──────────────────────────────────────────
  saffron: "#D4611A",
  ochre:   "#A8430E",
  amber:   "#F5A855",
  maroon:  "#8B1A3C",

  // ── Surfaces (light theme — tokens: surface-0 through surface-5) ──
  parchment:     "#FAF7F2", // surface-0 — canvas
  parchmentDeep: "#F3EEE5", // surface-1 — card
  surfaceRaised: "#EAE3D6", // surface-2 — elevated card
  surfaceActive: "#DDD6C8", // surface-3 — selected/active
  surfaceSunken: "#CFC7B5", // surface-4 — inset
  divider:       "#B8AFA0", // surface-5 — borders/dividers

  // Legacy surface aliases (keep for backward compat)
  surface:    "#FFFFFF",
  surfaceAlt: "#F5F0EA",

  // ── Text ────────────────────────────────────────────────────
  textPrimary:  "#1C1008", // text-primary
  textSecond:   "#4A3820", // text-secondary
  textTertiary: "#9A8A70", // text-tertiary — #9A8A70 passes WCAG AA on parchment (5.25:1)
  textDisabled: "#A89880", // text-disabled

  // ── Accent / Gold ───────────────────────────────────────────
  gold:            "#C9971C", // accent
  goldHover:       "#A87D18", // accent-hover
  goldLight:       "#FDF3DC", // accent-subtle
  goldMethod:      "#C9971C", // semantic alias — calculation labels, Thirukanitham badge
  goldMethodLight: "#FDF3D9", // gold chip backgrounds
  goldOnLight:     "#8B6412", // gold on parchment/white — WCAG AA 5.00:1 on #FAF7F2

  // ── Semantic states ─────────────────────────────────────────
  green:          "#2D7A4F", // success
  greenLight:     "#EAF5EF", // success-subtle
  caution:        "#B86A00", // warning
  cautionLight:   "#FEF3E2", // warning-subtle
  alert:          "#C0392B", // error
  alertLight:     "#FDE8E6", // error-subtle
  skyBlue:        "#1D5EA8", // info
  skyBlueLight:   "#E8F0FC", // info-subtle

  // ── Dark surfaces (premium / reveal moments) ─────────────────
  darkBg:       "#0D0F1A", // surface-0 dark
  darkSurface:  "#151825", // surface-1 dark
  darkRaised:   "#1E2235", // surface-2 dark
  indigoSurface:"#161929",
  indigoText:   "#E8E4F0",
  deepIndigo:   "#0D0F1A",
} as const;

// Dark theme color map — ready for Phase 5 useColorScheme() integration
export const CDark = {
  parchment:     "#0D0F1A",
  parchmentDeep: "#151825",
  surfaceRaised: "#1E2235",
  surfaceActive: "#252A40",
  surfaceSunken: "#0A0C14",
  divider:       "#2A3050",
  surface:       "#151825",
  surfaceAlt:    "#1E2235",

  textPrimary:  "#F0EBE0",
  textSecond:   "#B8A88A",
  textTertiary: "#9A8A70", // WCAG AA 5.67:1 on surface-0, 5.25:1 on surface-1
  textDisabled: "#4A3E2E",

  gold:            "#C9971C",
  goldHover:       "#E0AE28",
  goldLight:       "#1E1A0A",
  goldMethod:      "#C9971C",
  goldMethodLight: "#1E1A0A",
  goldOnLight:     "#E0AE28",

  green:        "#3DAA6A",
  greenLight:   "#0A1E14",
  caution:      "#E08A20",
  cautionLight: "#1E1200",
  alert:        "#E05040",
  alertLight:   "#1E0A08",
  skyBlue:      "#5080E0",
  skyBlueLight: "#080E1E",

  // Brand stays same across themes
  saffron: "#D4611A",
  ochre:   "#A8430E",
  amber:   "#F5A855",
  maroon:  "#8B1A3C",
  darkBg:       "#0D0F1A",
  darkSurface:  "#151825",
  darkRaised:   "#1E2235",
  indigoSurface:"#161929",
  indigoText:   "#E8E4F0",
  deepIndigo:   "#0D0F1A",
} as const;

export type ColorKey = keyof typeof CLight;
export type ColorSchemeName = "light" | "dark";
export type ColorTokens = Record<ColorKey, string>;

export function getColors(scheme: ColorSchemeName): ColorTokens {
  return scheme === "dark" ? CDark : CLight;
}


export const C = getColors(Appearance.getColorScheme() === "dark" ? "dark" : "light");

export const SCORE_COLORS = {
  high:    C.green,
  amber:   C.amber,
  caution: C.caution,
  rest:    C.textTertiary,
} as const;
