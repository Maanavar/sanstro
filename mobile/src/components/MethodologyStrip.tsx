import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";

interface Props {
  method?: string;
  city?: string;
  style?: ViewStyle;
}

export function MethodologyStrip({ method = "Thirukanitham", city, style }: Props) {
  return (
    <View style={[styles.strip, style]}>
      <View style={styles.chip}>
        <Text style={styles.dotMark}>◉</Text>
        <Text style={styles.chipText}>{method}</Text>
      </View>
      {city ? (
        <View style={styles.cityChip}>
          <Text style={styles.cityText}>{city}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    paddingHorizontal: S.base,
    paddingVertical: S.xs + 2,
    backgroundColor: C.goldMethodLight,
    borderBottomWidth: 1,
    borderBottomColor: C.goldMethod + "33",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dotMark: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 10,
    color: C.goldMethod,
    lineHeight: 16,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: C.goldMethod,
    lineHeight: 16,
  },
  cityChip: {
    paddingHorizontal: S.sm,
    paddingVertical: 2,
    backgroundColor: C.surface,
    borderRadius: RADIUS.chip,
    borderWidth: 1,
    borderColor: C.goldMethod + "44",
  },
  cityText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textSecond,
  },
});
