import { Appearance } from "react-native";
import { lightTokens, darkTokens } from "@vinaadi/design-tokens/dist/mobile/tokens";

// Vinaadi AI — Mobile Color Tokens
// Source of truth: packages/design-tokens/tokens.json
// Run: node packages/design-tokens/build.js  to regenerate dist/mobile/tokens.ts
// Import via useColors() hook — never import C directly in components.

export const CLight = {
  // ── Brand identity (not in tokens.json — brand-specific) ────
  saffron: "#D4611A",
  ochre:   "#A8430E",
  amber:   "#F5A855",
  maroon:  "#8B1A3C",

  // ── Surfaces (tokens: surface-0 through surface-5) ──────────
  parchment:     lightTokens.surface0, // surface-0 — canvas
  parchmentDeep: lightTokens.surface1, // surface-1 — card
  surfaceRaised: lightTokens.surface2, // surface-2 — elevated card
  surfaceActive: lightTokens.surface3, // surface-3 — selected/active
  surfaceSunken: lightTokens.surface4, // surface-4 — inset
  divider:       lightTokens.surface5, // surface-5 — borders/dividers

  // Legacy surface aliases (keep for backward compat)
  surface:    "#FFFFFF",
  surfaceAlt: "#F5F0EA",

  // ── Text ────────────────────────────────────────────────────
  textPrimary:  lightTokens.textPrimary,
  textSecond:   lightTokens.textSecondary,
  textTertiary: "#9A8A70", // adjusted for WCAG AA on parchment (5.25:1)
  textDisabled: lightTokens.textDisabled,

  // ── Accent / Gold ───────────────────────────────────────────
  gold:            lightTokens.accentBase,
  goldHover:       lightTokens.accentHover,
  goldLight:       lightTokens.accentSubtle,
  goldMethod:      lightTokens.accentBase,   // semantic alias — Thirukanitham badge
  goldMethodLight: "#FDF3D9",                // gold chip backgrounds
  goldOnLight:     "#8B6412",                // WCAG AA 5.00:1 on #FAF7F2

  // ── Semantic states ─────────────────────────────────────────
  green:          lightTokens.success,
  greenLight:     lightTokens.successSubtle,
  caution:        lightTokens.warning,
  cautionLight:   lightTokens.warningSubtle,
  alert:          lightTokens.error,
  alertLight:     lightTokens.errorSubtle,
  skyBlue:        lightTokens.info,
  skyBlueLight:   lightTokens.infoSubtle,

  // ── Dark surfaces (premium / reveal moments) ─────────────────
  darkBg:       darkTokens.surface0,
  darkSurface:  darkTokens.surface1,
  darkRaised:   darkTokens.surface2,
  indigoSurface:"#161929",
  indigoText:   "#E8E4F0",
  deepIndigo:   darkTokens.surface0,
} as const;

// Dark theme color map — ready for Phase 5 useColorScheme() integration
export const CDark = {
  parchment:     darkTokens.surface0,
  parchmentDeep: darkTokens.surface1,
  surfaceRaised: darkTokens.surface2,
  surfaceActive: darkTokens.surface3,
  surfaceSunken: darkTokens.surface4,
  divider:       darkTokens.surface5,
  surface:       darkTokens.surface1,
  surfaceAlt:    darkTokens.surface2,

  textPrimary:  darkTokens.textPrimary,
  textSecond:   darkTokens.textSecondary,
  textTertiary: "#9A8A70", // WCAG AA 5.67:1 on surface-0, 5.25:1 on surface-1
  textDisabled: darkTokens.textDisabled,

  gold:            darkTokens.accentBase,
  goldHover:       darkTokens.accentHover,
  goldLight:       darkTokens.accentSubtle,
  goldMethod:      darkTokens.accentBase,
  goldMethodLight: darkTokens.accentSubtle,
  goldOnLight:     darkTokens.accentHover,

  green:        darkTokens.success,
  greenLight:   darkTokens.successSubtle,
  caution:      darkTokens.warning,
  cautionLight: darkTokens.warningSubtle,
  alert:        darkTokens.error,
  alertLight:   darkTokens.errorSubtle,
  skyBlue:      darkTokens.info,
  skyBlueLight: darkTokens.infoSubtle,

  // Brand stays same across themes
  saffron: "#D4611A",
  ochre:   "#A8430E",
  amber:   "#F5A855",
  maroon:  "#8B1A3C",
  darkBg:       darkTokens.surface0,
  darkSurface:  darkTokens.surface1,
  darkRaised:   darkTokens.surface2,
  indigoSurface:"#161929",
  indigoText:   "#E8E4F0",
  deepIndigo:   darkTokens.surface0,
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
