import type { TextStyle } from "react-native";

export const TamilType = {
  display: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 24,
    lineHeight: 36,
  } satisfies TextStyle,
  heading: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 20,
    lineHeight: 30,
  } satisfies TextStyle,
  subheading: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 17,
    lineHeight: 26,
  } satisfies TextStyle,
  body: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 13,
    lineHeight: 21,
  } satisfies TextStyle,
  caption: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 12,
    lineHeight: 18,
  } satisfies TextStyle,
} as const;

export const EnType = {
  display: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 24,
    lineHeight: 30,
  } satisfies TextStyle,
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 26,
  } satisfies TextStyle,
  subheading: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    lineHeight: 22,
  } satisfies TextStyle,
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  } satisfies TextStyle,
} as const;

export const FONT_MAP = {
  NotoSansTamil_400Regular: require("../../assets/fonts/NotoSansTamil-Regular.ttf") as string,
  NotoSansTamil_700Bold: require("../../assets/fonts/NotoSansTamil-Bold.ttf") as string,
  Inter_400Regular: require("../../assets/fonts/Inter-Regular.ttf") as string,
  Inter_600SemiBold: require("../../assets/fonts/Inter-SemiBold.ttf") as string,
  Inter_700Bold: require("../../assets/fonts/Inter-Bold.ttf") as string,
  Inter_800ExtraBold: require("../../assets/fonts/Inter-ExtraBold.ttf") as string,
};

export const TAMIL_RENDER_TEST_CLUSTERS = [
  "ைி", "ோ", "ஸ்ரீ", "க்ஷ", "ஞ்", "ண்",
] as const;
