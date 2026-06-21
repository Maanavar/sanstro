import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";

interface Props {
  height?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ height = 80, style }: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <Animated.View style={[styles.card, { height, opacity }, style]} />
  );
}

export function SkeletonRow({ width = "100%", height = 16, style }: { width?: number | string; height?: number; style?: ViewStyle }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View style={[styles.row, { width: width as number, height, opacity }, style]} />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceAlt,
    borderRadius: RADIUS.card,
    marginBottom: S.sm,
  },
  row: {
    backgroundColor: C.surfaceAlt,
    borderRadius: S.xs,
    marginBottom: S.sm,
  },
});
