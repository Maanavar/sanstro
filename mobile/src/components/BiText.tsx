import React from "react";
import { Text, type TextStyle } from "react-native";
import type { BiText as BiTextValue } from "@vinaadi/shared";
import { useLanguage } from "@/state/languageContext";
import { TamilType, EnType } from "@/theme/typography";

interface Props {
  value: BiTextValue;
  style?: TextStyle;
  scale?: "display" | "heading" | "subheading" | "body" | "bodySmall" | "caption";
  numberOfLines?: number;
}

export function BiText({ value, style, scale = "body", numberOfLines }: Props) {
  const { lang } = useLanguage();
  const typeScale = lang === "ta" ? TamilType[scale] : EnType[scale];
  return (
    <Text style={[typeScale, style]} numberOfLines={numberOfLines}>
      {value[lang]}
    </Text>
  );
}
