import React from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";

interface Props {
  style?: ViewStyle;
}

export function NativeAdUnit({ style }: Props) {
  const { tier } = useSession();
  const { t, strings } = useI18n();

  if (tier !== "guest") return null;

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{t(strings.common.sponsored)}</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Ad</Text>
      </View>
    </View>
  );
}

export function BannerAdUnit({ style }: Props) {
  const { tier } = useSession();

  if (tier !== "guest") return null;

  return (
    <View style={[styles.banner, style]}>
      <Text style={styles.label}>விளம்பரம் / Ad</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderLeftWidth: 3,
    borderLeftColor: C.divider,
    padding: S.md,
    marginVertical: S.sm,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    fontStyle: "italic",
    color: C.textTertiary,
    marginBottom: S.sm,
  },
  placeholder: {
    height: 80,
    backgroundColor: C.surfaceAlt,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: C.textTertiary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  banner: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
