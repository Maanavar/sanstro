import React, { useMemo } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";

type Props = {
  title: string;
  titleTa?: string;
  subtitle?: string;
  subtitleTa?: string;
  isTamil?: boolean;
  /** Right-side slot — a pill, count badge, icon, etc. */
  badge?: React.ReactNode;
  style?: ViewStyle;
  entering?: React.ComponentProps<typeof Animated.View>["entering"];
};

/**
 * Standard screen header card: bordered parchment card with title, optional
 * subtitle, and an optional right badge slot. Handles Tamil/English font
 * switching automatically.
 *
 * Used by: ToolsScreen, insights, panchangam, daily-score, and any other screen
 * that needs the top "what is this screen" card.
 */
export function ScreenHeader({
  title,
  titleTa,
  subtitle,
  subtitleTa,
  isTamil,
  badge,
  style,
  entering,
}: Props) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const displayTitle = isTamil && titleTa ? titleTa : title;
  const displaySubtitle = isTamil && subtitleTa ? subtitleTa : subtitle;

  return (
    <Animated.View style={[styles.header, style]} entering={entering}>
      <View style={styles.text}>
        <Text style={[styles.title, isTamil ? TamilType.heading : EnType.heading]}>
          {displayTitle}
        </Text>
        {displaySubtitle ? (
          <Text style={[styles.subtitle, isTamil ? TamilType.caption : EnType.caption]}>
            {displaySubtitle}
          </Text>
        ) : null}
      </View>
      {badge ? <View>{badge}</View> : null}
    </Animated.View>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    header: {
      marginHorizontal: S.lg,
      marginTop: S.lg,
      marginBottom: S.md,
      padding: S.lg,
      borderRadius: RADIUS.xl,
      backgroundColor: C.parchmentDeep,
      borderWidth: 1,
      borderColor: C.divider,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: S.md,
      shadowColor: C.deepIndigo,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    text: { flex: 1, gap: S.xs },
    title: { color: C.textPrimary },
    subtitle: { color: C.textTertiary },
  });
}
