import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { C } from "@/theme/colors";
import { RADIUS } from "@/theme/spacing";

interface Props {
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function ThirukanithamBadge({ size = "sm", style }: Props) {
  const isSmall = size === "sm";
  return (
    <View style={[styles.badge, isSmall ? styles.badgeSm : styles.badgeMd, style]}>
      <Text style={isSmall ? styles.textSm : styles.textMd}>
        திருக்கணிதம் ◉
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: C.gold,
    borderRadius: RADIUS.chip,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  textSm: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 10,
    lineHeight: 16,
    color: C.surface,
  },
  textMd: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 12,
    lineHeight: 18,
    color: C.surface,
  },
});
