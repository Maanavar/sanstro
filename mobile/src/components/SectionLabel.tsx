import React from "react";
import { StyleSheet, Text, type TextStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  labelEn: string;
  labelTa?: string;
  isTamil?: boolean;
  style?: TextStyle;
};

/**
 * Uppercase overline/group label (11 px, bold, tracked).
 * Replaces the inline `groupLabel` style pattern repeated across 10+ screens.
 */
export function SectionLabel({ labelEn, labelTa, isTamil, style }: Props) {
  const C = useColors();
  return (
    <Text style={[styles.label, { color: C.textTertiary }, style]}>
      {isTamil && labelTa ? labelTa : labelEn}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
    paddingLeft: 2,
  },
});
