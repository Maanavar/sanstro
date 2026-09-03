import React, { useMemo } from "react";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import Animated, { FadeInDown } from "react-native-reanimated";
import { entranceDelay, spring, staggerInterval } from "@/theme/motion";
import { NAKSHATRA_DATA } from "@vinaadi/shared/data/nakshatras";

export default function NakshatraListScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "27 நட்சத்திரங்கள்" : "27 Nakshatras"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.subtitle, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil
            ? "வேதாஸ்திரவியல் பட்டியல் — ஒவ்வொரு நட்சத்திரத்தையும் ஆராயுங்கள்"
            : "Browse all 27 lunar mansions of Vedic astrology"}
        </Text>

        <View style={styles.grid}>
          {NAKSHATRA_DATA.map((n, i) => (
            <Animated.View
              key={n.slug}
              entering={FadeInDown.delay(entranceDelay.supporting + Math.floor(i / 3) * staggerInterval).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}
              style={styles.cardWrap}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: "/learn/nakshatra-detail" as any, params: { slug: n.slug } })}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`${isTamil ? n.name.ta : n.name.en} nakshatra`}
              >
                <Text style={styles.symbol}>{n.symbol}</Text>
                <Text style={styles.number}>{n.number}</Text>
                <Text
                  style={[styles.name, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}
                  numberOfLines={2}
                >
                  {isTamil ? n.name.ta : n.name.en}
                </Text>
                <Text style={[styles.planet, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? n.planet.ta : n.planet.en}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: S.base, paddingVertical: S.md,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 40 },
    headerTitle: { color: C.textPrimary, flex: 1, textAlign: "center" },
    scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
    subtitle: { color: C.textSecond, textAlign: "center" },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
    cardWrap: { width: "31%" },
    card: {
      backgroundColor: C.surface, borderRadius: RADIUS.lg,
      borderWidth: 1, borderColor: C.divider,
      padding: S.md, gap: S.xs, alignItems: "center",
      shadowColor: C.deepIndigo, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    symbol: { fontSize: 28, lineHeight: 36 },
    number: {
      fontFamily: "Inter_700Bold", fontSize: 10,
      color: C.textTertiary, textAlign: "center",
    },
    name: {
      fontSize: 13, lineHeight: 18, color: C.textPrimary,
      textAlign: "center", minHeight: 36,
    },
    planet: { color: C.saffron, textAlign: "center" },
  });
}
