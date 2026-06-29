import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { HIT_SLOP, RADIUS, S } from "@/theme/spacing";
import { EnType, TamilType } from "@/theme/typography";

/** Generic icon component shape accepted by ListItem (compatible with Ionicons and Lucide). */
type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type Props = {
  /** Icon component displayed in the left icon well. Omit to skip the well. */
  icon?: IconComponent;
  /** Override icon color (defaults to C.goldOnLight). */
  iconColor?: string;
  /** Override icon well background (defaults to C.goldLight). */
  iconBg?: string;
  title: string;
  titleTa?: string;
  subtitle?: string;
  subtitleTa?: string;
  isTamil?: boolean;
  onPress?: () => void;
  /**
   * Right-side slot. Pass `null` to suppress the default chevron.
   * Defaults to a ChevronRight when `onPress` is provided.
   */
  trailing?: React.ReactNode | null;
  style?: ViewStyle;
  activeOpacity?: number;
};

/**
 * Row: [icon well?] → [title / subtitle stack] → [trailing?]
 *
 * Replaces the repeated "icon + title + subtitle + ChevronRight" card pattern
 * across today.tsx (dasha card, event countdown), me.tsx, family-vault.tsx, and
 * insights/index.tsx (10+ instances total).
 */
export function ListItem({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  titleTa,
  subtitle,
  subtitleTa,
  isTamil,
  onPress,
  trailing,
  style,
  activeOpacity = 0.85,
}: Props) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const resolvedIconColor = iconColor ?? C.goldOnLight;
  const resolvedIconBg = iconBg ?? C.goldLight;

  const displayTitle = isTamil && titleTa ? titleTa : title;
  const displaySubtitle = isTamil && subtitleTa ? subtitleTa : subtitle;

  const defaultTrailing =
    trailing === undefined && onPress ? (
      <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
    ) : null;
  const resolvedTrailing = trailing !== undefined ? trailing : defaultTrailing;

  const inner = (
    <>
      {Icon ? (
        <View style={[styles.iconWell, { backgroundColor: resolvedIconBg }]}>
          <Icon size={24} color={resolvedIconColor} strokeWidth={1.5} />
        </View>
      ) : null}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_600SemiBold" },
          ]}
          numberOfLines={2}
        >
          {displayTitle}
        </Text>
        {displaySubtitle ? (
          <Text
            style={[styles.subtitle, isTamil ? TamilType.caption : EnType.caption]}
            numberOfLines={2}
          >
            {displaySubtitle}
          </Text>
        ) : null}
      </View>
      {resolvedTrailing}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.row, style]}
        onPress={onPress}
        activeOpacity={activeOpacity}
        hitSlop={HIT_SLOP}
      >
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.row, style]}>{inner}</View>;
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.parchmentDeep,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: C.divider,
      padding: S.md,
      gap: S.md,
    },
    iconWell: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      alignItems: "center",
      justifyContent: "center",
    },
    content: { flex: 1, gap: S.xs },
    title: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
    subtitle: { color: C.textTertiary },
  });
}
