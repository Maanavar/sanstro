import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";

export type ChipItem = {
  key: string;
  label: string;
  /** Tamil label — shown when isTamil is true. */
  labelTa?: string;
};

type Props = {
  items: ChipItem[];
  selected: string;
  onSelect: (key: string) => void;
  isTamil?: boolean;
  /**
   * horizontal (default): single-row ScrollView.
   * wrap: multi-row flex wrap in a plain View.
   */
  layout?: "horizontal" | "wrap";
  style?: ViewStyle;
  /** Passed as contentContainerStyle when layout="horizontal". */
  contentStyle?: ViewStyle;
};

/**
 * Horizontal (or wrapping) row of selectable chips with haptic feedback.
 *
 * Replaces the inline chip-strip pattern from today.tsx (journal moments,
 * activity-type picker), panchangam, and any screen with a filter/tab strip
 * (3+ screens, ~8 instances).
 *
 * Usage:
 *   <ChipStrip items={MOMENTS} selected={moment} onSelect={setMoment} isTamil={isTamil} />
 */
export function ChipStrip({
  items,
  selected,
  onSelect,
  isTamil,
  layout = "horizontal",
  style,
  contentStyle,
}: Props) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const chips = items.map((item) => {
    const active = item.key === selected;
    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => {
          Haptics.selectionAsync();
          onSelect(item.key);
        }}
        activeOpacity={0.75}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {isTamil && item.labelTa ? item.labelTa : item.label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (layout === "horizontal") {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.strip, contentStyle]}
        style={style}
      >
        {chips}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.strip, styles.wrap, style]}>
      {chips}
    </View>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    strip: {
      flexDirection: "row",
      gap: S.sm,
      paddingVertical: S.xs,
    },
    wrap: { flexWrap: "wrap" },
    chip: {
      height: 34,
      paddingHorizontal: S.md,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: C.divider,
      backgroundColor: C.parchmentDeep,
      alignItems: "center",
      justifyContent: "center",
    },
    chipActive: {
      backgroundColor: C.goldLight,
      borderColor: C.gold,
    },
    chipText: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      lineHeight: 18,
      color: C.textSecond,
    },
    chipTextActive: {
      fontFamily: "Inter_600SemiBold",
      color: C.goldOnLight,
    },
  });
}
