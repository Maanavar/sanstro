import React, { useMemo } from "react";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import Animated, { FadeInDown } from "react-native-reanimated";
import { entranceDelay, spring, staggerInterval } from "@/theme/motion";
import { NAKSHATRA_DATA } from "@vinaadi/shared/data/nakshatras";

export default function NakshatraDetailScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const n = NAKSHATRA_DATA.find((x) => x.slug === slug);

  if (!n) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, isTamil ? TamilType.body : EnType.body]}>
            {isTamil ? "நட்சத்திரம் காணவில்லை" : "Nakshatra not found"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const prevSlug = NAKSHATRA_DATA[(n.number - 2 + 27) % 27]?.slug;
  const nextSlug = NAKSHATRA_DATA[n.number % 27]?.slug;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]} numberOfLines={1}>
          {isTamil ? n.name.ta : n.name.en}
        </Text>
        <TouchableOpacity onPress={() => router.push("/learn/nakshatra-list" as any)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.allLink}>{isTamil ? "அனைத்தும்" : "All"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <Animated.View
          style={styles.hero}
          entering={FadeInDown.delay(entranceDelay.hero).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}
        >
          <Text style={styles.heroSymbol}>{n.symbol}</Text>
          <View style={styles.heroNameBlock}>
            <Text style={styles.heroNum}>#{n.number}</Text>
            <Text style={[styles.heroNameEn, { fontFamily: "Inter_800ExtraBold" }]}>{n.name.en}</Text>
            <Text style={[styles.heroNameTa, { fontFamily: "NotoSansTamil_700Bold" }]}>{n.name.ta}</Text>
          </View>
        </Animated.View>

        {/* Planet ruler */}
        <Animated.View
          style={styles.rulerRow}
          entering={FadeInDown.delay(entranceDelay.supporting).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}
        >
          <View style={styles.rulerItem}>
            <Text style={styles.rulerLabel}>{isTamil ? "ஆட்சி கிரகம்" : "Ruling Planet"}</Text>
            <Text style={[styles.rulerValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil ? n.planet.ta : n.planet.en}
            </Text>
          </View>
          <View style={styles.rulerDivider} />
          <View style={styles.rulerItem}>
            <Text style={styles.rulerLabel}>{isTamil ? "தெய்வம்" : "Deity"}</Text>
            <Text style={[styles.rulerValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil ? n.deity.ta : n.deity.en}
            </Text>
          </View>
        </Animated.View>

        {/* Qualities */}
        <Animated.View
          entering={FadeInDown.delay(entranceDelay.supporting + staggerInterval).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}
        >
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "குணங்கள்" : "Qualities"}
          </Text>
          <View style={styles.qualityRow}>
            {n.qualities.map((q, i) => (
              <View key={i} style={styles.qualityChip}>
                <Text style={[styles.qualityText, { fontFamily: isTamil ? "NotoSansTamil_600SemiBold" : "Inter_600SemiBold" }]}>
                  {isTamil ? q.ta : q.en}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View
          style={styles.descCard}
          entering={FadeInDown.delay(entranceDelay.supporting + staggerInterval * 2).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}
        >
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "விளக்கம்" : "About"}
          </Text>
          <Text style={[styles.descText, isTamil ? TamilType.body : EnType.body]}>
            {isTamil ? n.description.ta : n.description.en}
          </Text>
        </Animated.View>

        {/* Compatibility */}
        <Animated.View
          style={styles.compatCard}
          entering={FadeInDown.delay(entranceDelay.supporting + staggerInterval * 3).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}
        >
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "பொருத்தம்" : "Compatibility"}
          </Text>
          <Text style={[styles.compatText, isTamil ? TamilType.body : EnType.body]}>
            {isTamil ? n.compatibility.ta : n.compatibility.en}
          </Text>
        </Animated.View>

        {/* Prev / Next navigation */}
        <View style={styles.navRow}>
          {prevSlug && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => router.replace({ pathname: "/learn/nakshatra-detail" as any, params: { slug: prevSlug } })}
              activeOpacity={0.85}
            >
              <Text style={styles.navArrow}>‹</Text>
              <Text style={[styles.navLabel, isTamil ? TamilType.caption : EnType.caption]}>
                {isTamil ? "முந்தைய" : "Previous"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnCenter]}
            onPress={() => router.push("/learn/nakshatra-list" as any)}
            activeOpacity={0.85}
          >
            <Text style={[styles.navLabel, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? "பட்டியல்" : "List"}
            </Text>
          </TouchableOpacity>
          {nextSlug && (
            <TouchableOpacity
              style={[styles.navBtn, { alignItems: "flex-end" }]}
              onPress={() => router.replace({ pathname: "/learn/nakshatra-detail" as any, params: { slug: nextSlug } })}
              activeOpacity={0.85}
            >
              <Text style={[styles.navLabel, isTamil ? TamilType.caption : EnType.caption]}>
                {isTamil ? "அடுத்தது" : "Next"}
              </Text>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          )}
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
    allLink: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.saffron, width: 60, textAlign: "right" },
    scroll: { padding: S.base, gap: S.lg, paddingBottom: S.xxl },

    hero: {
      backgroundColor: C.goldMethodLight, borderRadius: RADIUS.xl, padding: S.xl,
      flexDirection: "row", alignItems: "center", gap: S.lg,
      borderWidth: 1, borderColor: `${C.gold}40`,
    },
    heroSymbol: { fontSize: 56 },
    heroNameBlock: { flex: 1, gap: S.xs },
    heroNum: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textTertiary },
    heroNameEn: { fontSize: 22, lineHeight: 28, color: C.textPrimary },
    heroNameTa: { fontSize: 20, lineHeight: 28, color: C.textPrimary },

    rulerRow: {
      flexDirection: "row", backgroundColor: C.surface, borderRadius: RADIUS.card,
      padding: S.base, alignItems: "center",
    },
    rulerItem: { flex: 1, alignItems: "center", gap: 4 },
    rulerDivider: { width: 1, height: 36, backgroundColor: C.divider },
    rulerLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
    rulerValue: { fontSize: 15, lineHeight: 22, color: C.textPrimary, textAlign: "center" },

    sectionTitle: { color: C.textPrimary, marginBottom: S.xs },

    qualityRow: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
    qualityChip: {
      backgroundColor: `${C.saffron}15`, borderRadius: RADIUS.chip,
      paddingHorizontal: S.md, paddingVertical: S.xs,
      borderWidth: 1, borderColor: `${C.saffron}40`,
    },
    qualityText: { fontSize: 13, color: C.saffron },

    descCard: {
      backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm,
    },
    descText: { color: C.textPrimary, lineHeight: 24 },

    compatCard: {
      backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm,
      borderLeftWidth: 3, borderLeftColor: C.amber,
    },
    compatText: { color: C.textPrimary, lineHeight: 24 },

    navRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
    navBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: S.xs },
    navBtnCenter: { justifyContent: "center" },
    navArrow: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.saffron },
    navLabel: { color: C.textSecond },

    notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
    notFoundText: { color: C.textSecond },
  });
}
