import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { getChartFull } from "@/api/charts";
import { JadhagamChart, type JadhagamHouseData } from "@/components/JadhagamChart";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import type { ChartCalculateResponseData } from "@vinaadi/shared";

const PLANET_SHORT_TA: Record<string, string> = {
  Sun: "சூ", Moon: "சந்", Mars: "செ", Mercury: "பு",
  Jupiter: "கு", Venus: "சு", Saturn: "ச", Rahu: "ரா", Ketu: "கே",
};

function buildHouses(chart: ChartCalculateResponseData): JadhagamHouseData[] {
  const houses: JadhagamHouseData[] = Array.from({ length: 12 }, (_, i) => ({
    rasi: i + 1, planets: [], isLagna: i + 1 === chart.lagna.rasi,
  }));
  for (const p of chart.planets) {
    const idx = p.rasi - 1;
    if (idx >= 0 && idx < 12) {
      const abbr = PLANET_SHORT_TA[p.graha] ?? p.graha.slice(0, 2);
      houses[idx].planets.push(p.isRetrograde ? `${abbr}R` : abbr);
    }
  }
  return houses;
}

export default function JadhagamDetailScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["chart-full", id],
    queryFn: () => getChartFull(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const chart = data?.data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]} numberOfLines={1}>
          {chart?.birthProfile?.displayName
            ? `${chart.birthProfile.displayName} ${isTamil ? "ஜாதகம்" : "Jadhagam"}`
            : (isTamil ? "ஜாதகம்" : "Jadhagam")}
        </Text>
        <ThirukanithamBadge />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLoading && <SkeletonCard height={320} />}
        {isError && <ErrorCard onRetry={refetch} />}

        {chart && (
          <>
            {/* Rasi chart */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "ரோஜா சக்கரம்" : "Rasi Chart"}
              </Text>
              <View style={{ alignItems: "center" }}>
                <JadhagamChart houses={buildHouses(chart)} size={300} />
              </View>
            </View>

            {/* Key chart data */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "முக்கிய விவரங்கள்" : "Key Details"}
              </Text>
              <View style={styles.dataGrid}>
                {[
                  { label: isTamil ? "லக்னம்" : "Lagna", value: chart.lagna.rasiName },
                  { label: isTamil ? "நட்சத்திரம்" : "Nakshatra", value: chart.lagna.nakshatraName },
                  { label: isTamil ? "பாதம்" : "Pada", value: String(chart.lagna.pada) },
                ].map((item) => (
                  <View key={item.label} style={styles.datumCard}>
                    <Text style={styles.datumLabel}>{item.label}</Text>
                    <Text style={[styles.datumValue, {
                      fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
                    }]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Planet positions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "கிரக நிலைகள்" : "Planet Positions"}
              </Text>
              <View style={styles.planetList}>
                {chart.planets.map((p, i) => (
                  <View key={p.graha} style={[styles.planetRow, i > 0 && styles.planetBorder]}>
                    <View style={styles.planetChip}>
                      <Text style={styles.planetChipText}>{PLANET_SHORT_TA[p.graha] ?? p.graha.slice(0, 2)}</Text>
                    </View>
                    <Text style={[styles.planetName, {
                      fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular",
                    }]}>
                      {p.graha}
                    </Text>
                    <Text style={styles.planetRasi}>{p.rasiName}</Text>
                    {p.isRetrograde && (
                      <View style={styles.retroBadge}>
                        <Text style={styles.retroText}>R</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Upsell CTA */}
            <TouchableOpacity
              style={styles.upsellCard}
              onPress={() => router.push({ pathname: "/jadhagam/upsell", params: { chartId: id } })}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.upsellTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "விரிவான அறிக்கை வேண்டுமா?" : "Want a detailed report?"}
                </Text>
                <Text style={[styles.upsellSub, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "5 பக்கம் ₹99 · 10 பக்கம் ₹249" : "5-page ₹99 · 10-page ₹249"}
                </Text>
              </View>
              <Text style={styles.upsellArrow}>→</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", gap: S.sm,
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerTitle: { color: C.textPrimary, flex: 1 },
  scroll: { padding: S.base, gap: S.xl, paddingBottom: S.xxl },
  section: { gap: S.sm },
  sectionTitle: { color: C.textPrimary },
  dataGrid: { flexDirection: "row", gap: S.sm },
  datumCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: S.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  datumLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, marginBottom: 3 },
  datumValue: { fontSize: 13, lineHeight: 18, color: C.textPrimary },
  planetList: { backgroundColor: C.surface, borderRadius: RADIUS.card, overflow: "hidden" },
  planetRow: { flexDirection: "row", alignItems: "center", gap: S.sm, paddingHorizontal: S.base, paddingVertical: S.sm },
  planetBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  planetChip: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#EBF2FB", alignItems: "center", justifyContent: "center",
  },
  planetChipText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 10, lineHeight: 14, color: C.skyBlue },
  planetName: { flex: 1, fontSize: 14, lineHeight: 20, color: C.textPrimary },
  planetRasi: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecond },
  retroBadge: { backgroundColor: C.caution, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  retroText: { fontFamily: "Inter_700Bold", fontSize: 10, color: C.surface },
  upsellCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.gold,
    padding: S.base, flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  upsellTitle: { color: C.textPrimary },
  upsellSub: { color: C.textSecond, marginTop: 2 },
  upsellArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.saffron },
});
