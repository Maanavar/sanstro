import React from "react";
import { Text, type TextStyle } from "react-native";
import type { BiText as BiTextValue } from "@vinaadi/shared";
import { useLanguage } from "@/state/languageContext";
import { TamilType, EnType } from "@/theme/typography";

interface Props {
  value: BiTextValue | null | undefined;
  style?: TextStyle;
  scale?: "display" | "heading" | "subheading" | "body" | "bodySmall" | "caption";
  numberOfLines?: number;
}

export function BiText({ value, style, scale = "body", numberOfLines }: Props) {
  const { lang } = useLanguage();
  const typeScale = lang === "ta" ? TamilType[scale] : EnType[scale];
  const text = lang === "ta"
    ? value?.ta ?? value?.en ?? ""
    : value?.en ?? value?.ta ?? "";

  return (
    <Text style={[typeScale, style]} numberOfLines={numberOfLines}>
      {text}
    </Text>
  );
}
