import type { TextStyle } from "react-native";

export const TamilFont = {
  Regular: "NotoSansTamil_400Regular",
  SemiBold: "NotoSansTamil_600SemiBold",
  Bold: "NotoSansTamil_700Bold",
} as const;

export const EnFont = {
  Regular: "Inter_400Regular",
  SemiBold: "Inter_600SemiBold",
  Bold: "Inter_700Bold",
  ExtraBold: "Inter_800ExtraBold",
} as const;

export const TamilType = {
  display: {
    fontFamily: TamilFont.Bold,
    fontSize: 24,
    lineHeight: 36,
  } satisfies TextStyle,
  heading: {
    fontFamily: TamilFont.Bold,
    fontSize: 20,
    lineHeight: 30,
  } satisfies TextStyle,
  subheading: {
    fontFamily: TamilFont.Bold,
    fontSize: 17,
    lineHeight: 26,
  } satisfies TextStyle,
  body: {
    fontFamily: TamilFont.Regular,
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: TamilFont.Regular,
    fontSize: 13,
    lineHeight: 21,
  } satisfies TextStyle,
  caption: {
    fontFamily: TamilFont.Regular,
    fontSize: 12,
    lineHeight: 18,
  } satisfies TextStyle,
} as const;

export const EnType = {
  display: {
    fontFamily: EnFont.ExtraBold,
    fontSize: 24,
    lineHeight: 30,
  } satisfies TextStyle,
  heading: {
    fontFamily: EnFont.Bold,
    fontSize: 20,
    lineHeight: 26,
  } satisfies TextStyle,
  subheading: {
    fontFamily: EnFont.SemiBold,
    fontSize: 17,
    lineHeight: 22,
  } satisfies TextStyle,
  body: {
    fontFamily: EnFont.Regular,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: EnFont.Regular,
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  caption: {
    fontFamily: EnFont.Regular,
    fontSize: 12,
    lineHeight: 16,
  } satisfies TextStyle,
} as const;

export function fontFamily(weight: keyof typeof EnFont | keyof typeof TamilFont, isTamil: boolean): string {
  const familyMap = isTamil ? TamilFont : EnFont;
  if (weight in familyMap) {
    return familyMap[weight as keyof typeof familyMap];
  }
  return isTamil ? TamilFont.Regular : EnFont.Regular;
}

export const FONT_MAP = {
  NotoSansTamil_400Regular: require("../../assets/fonts/NotoSansTamil-Regular.ttf") as string,
  NotoSansTamil_700Bold: require("../../assets/fonts/NotoSansTamil-Bold.ttf") as string,
  Inter_400Regular: require("../../assets/fonts/Inter-Regular.ttf") as string,
  Inter_600SemiBold: require("../../assets/fonts/Inter-SemiBold.ttf") as string,
  Inter_700Bold: require("../../assets/fonts/Inter-Bold.ttf") as string,
  Inter_800ExtraBold: require("../../assets/fonts/Inter-ExtraBold.ttf") as string,
};

export const TAMIL_RENDER_TEST_CLUSTERS = [
  "\u0bc8\u0bbf", "\u0bcb", "\u0bb8\u0bcd\u0bb0\u0bc0", "\u0b95\u0bcd\u0bb7", "\u0b9e\u0bcd", "\u0ba3\u0bcd",
] as const;