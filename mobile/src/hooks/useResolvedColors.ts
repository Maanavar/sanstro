import { useColorScheme } from "react-native";
import { C } from "@/theme/colors";

const dark = {
  ...C,
  parchment: "#0F1520",
  parchmentDeep: "#161929",
  surface: "#1E2A3A",
  surfaceAlt: "#273449",
  textPrimary: "#F7EFE6",
  textSecond: "#D8C8B6",
  textTertiary: "#A99583",
  divider: "#34445C",
  goldMethodLight: "rgba(201,151,28,0.16)",
  darkBg: "#0B1018",
  darkSurface: "#162033",
  deepIndigo: "#080B12",
  indigoSurface: "#121827",
  indigoText: "#F1ECF8",
} as const;

export function useResolvedColors() {
  return useColorScheme() === "dark" ? dark : C;
}
