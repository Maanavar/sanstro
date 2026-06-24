import React from "react";
import { StyleSheet, Text, View, type DimensionValue, type ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";

interface Props {
  currentStep: number;
  totalSteps: number;
  label?: string;
  style?: ViewStyle;
}

export function OnboardingProgressBar({ currentStep, totalSteps, label, style }: Props) {
  const clampedStep = Math.max(1, Math.min(currentStep, totalSteps));
  const progress: DimensionValue = `${(clampedStep / totalSteps) * 100}%`;

  return (
    <Animated.View entering={FadeInDown.delay(40).springify()} style={[styles.wrap, style]}>
      <View style={styles.metaRow}>
        <Text style={styles.label}>{label ?? "Onboarding"}</Text>
        <Text style={styles.count}>{clampedStep}/{totalSteps}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: progress }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: S.xs },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.textSecond,
  },
  count: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: C.saffron,
  },
  track: {
    height: 7,
    borderRadius: RADIUS.chip,
    backgroundColor: C.surfaceAlt,
    overflow: "hidden",
  },
  fill: {
    height: 7,
    borderRadius: RADIUS.chip,
    backgroundColor: C.saffron,
  },
});
