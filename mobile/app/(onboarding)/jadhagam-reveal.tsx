import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { getChartFull } from "@/api/charts";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";
import { JadhagamChart, type JadhagamHouseData } from "@/components/JadhagamChart";
import { AnimatedEmptyState } from "@/components/AnimatedEmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import type { ChartCalculateResponseData } from "@vinaadi/shared";

const PLANET_SHORT_TA: Record<string, string> = {
  Sun: "சூ", Moon: "சந்", Mars: "செ", Mercury: "பு",
  Jupiter: "கு", Venus: "சு", Saturn: "ச", Rahu: "ரா", Ketu: "கே",
};

function buildHouses(chart: ChartCalculateResponseData): JadhagamHouseData[] {
  const houses: JadhagamHouseData[] = Array.from({ length: 12 }, (_, i) => ({
    rasi: i + 1,
    planets: [],
    isLagna: i + 1 === chart.lagna.rasi,
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

export default function JadhagamRevealScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { chartId } = useLocalSearchParams<{ chartId?: string; profileId?: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["chart-full", chartId],
    queryFn: () => getChartFull(chartId!),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const chart = data?.data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success header */}
        <AnimatedEmptyState
          variant="success"
          title={isTamil ? "ஜாதகம் தயார்!" : "Jadhagam Ready!"}
          body={
            chart?.birthProfile
              ? `${chart.birthProfile.displayName}${chart.birthProfile.birthPlace ? ` · ${chart.birthProfile.birthPlace}` : ""}`
              : undefined
          }
          style={{ marginBottom: S.xl }}
        />

        {/* Chart preview card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "ரோஜா சக்கரம்" : "Rasi Chart"}
            </Text>
            <ThirukanithamBadge />
          </View>

          {isLoading ? (
            <SkeletonCard height={290} />
          ) : chart ? (
            <View style={{ alignItems: "center" }}>
              <JadhagamChart houses={buildHouses(chart)} size={290} />
            </View>
          ) : (
            <View style={styles.pendingBox}>
              <Text style={[styles.pendingText, isTamil ? TamilType.body : EnType.body]}>
                {isTamil ? "ஜாதகம் கணக்கிடப்படுகிறது…" : "Chart is being calculated…"}
              </Text>
              <Text style={[styles.pendingSub, isTamil ? TamilType.caption : EnType.caption]}>
                {isTamil ? "சில நிமிடங்கள் ஆகலாம்." : "This may take a few minutes."}
              </Text>
            </View>
          )}

          {chart && (
            <View style={styles.keyGrid}>
              {[
                { label: isTamil ? "லக்னம்" : "Lagna", value: chart.lagna.rasiName },
                { label: isTamil ? "நட்சத்திரம்" : "Nakshatra", value: chart.lagna.nakshatraName },
                { label: isTamil ? "பாதம்" : "Pada", value: `${chart.lagna.pada}` },
              ].map((item) => (
                <View key={item.label} style={styles.keyDatum}>
                  <Text style={styles.keyLabel}>{item.label}</Text>
                  <Text style={[styles.keyValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.savedChip}>
            <Text style={styles.savedText}>✓ {isTamil ? "சேமிக்கப்பட்டது" : "Saved to your account"}</Text>
          </View>
        </View>

        {/* Upsell */}
        <Text style={[styles.upsellHeading, isTamil ? TamilType.subheading : EnType.subheading]}>
          {isTamil ? "மேலும் விரிவான அறிக்கை வேண்டுமா?" : "Want a more detailed report?"}
        </Text>

        <View style={styles.upsellRow}>
          {[
            {
              pages: "5",
              price: "₹99",
              desc: isTamil ? "தசா · கிரக விளக்கம் · யோகங்கள்" : "Dasha · Planet analysis · Yogas",
            },
            {
              pages: "10",
              price: "₹249",
              best: true,
              desc: isTamil ? "+ பரிகாரம் · தொழில் · திருமண நேரம்" : "+ Remedies · Career · Marriage timing",
            },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.pages}
              style={[styles.upsellCard, opt.best && styles.upsellCardBest]}
              onPress={() =>
                chartId
                  ? router.push({ pathname: "/jadhagam/upsell", params: { chartId } })
                  : undefined
              }
              activeOpacity={0.85}
            >
              {opt.best && (
                <View style={styles.bestBadge}>
                  <Text style={styles.bestText}>{isTamil ? "சிறந்தது" : "Best"}</Text>
                </View>
              )}
              <Text style={styles.upsellPages}>
                {opt.pages} {isTamil ? "பக்கம்" : "Pages"}
              </Text>
              <Text style={styles.upsellPrice}>{opt.price}</Text>
              <Text style={[styles.upsellDesc, isTamil ? TamilType.caption : EnType.caption]}>
                {opt.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            chartId
              ? router.push({ pathname: "/jadhagam/upsell", params: { chartId } })
              : router.replace("/(tabs)/today")
          }
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>
            {isTamil ? "விரிவான அறிக்கை பெறுங்கள்" : "Get Detailed Report"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.laterBtn} onPress={() => router.replace("/(tabs)/today")}>
          <Text style={styles.laterText}>{isTamil ? "பின்னர்" : "Maybe later"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  scroll: { padding: S.base, paddingBottom: S.xxl },
  successRow: {
    flexDirection: "row", alignItems: "center", gap: S.md, marginBottom: S.xl,
  },
  checkCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.saffron,
    alignItems: "center", justifyContent: "center",
  },
  checkMark: { color: C.surface, fontFamily: "Inter_700Bold", fontSize: 22 },
  readyTitle: { color: C.textPrimary },
  readySub: { color: C.textSecond, marginTop: 2 },
  chartCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.gold,
    padding: S.base, gap: S.sm, marginBottom: S.xl,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartTitle: { color: C.textPrimary },
  pendingBox: {
    height: 160, alignItems: "center", justifyContent: "center",
    backgroundColor: C.surfaceAlt, borderRadius: RADIUS.card, gap: S.sm,
  },
  pendingText: { color: C.textPrimary },
  pendingSub: { color: C.textSecond },
  keyGrid: { flexDirection: "row", gap: S.sm },
  keyDatum: { flex: 1, backgroundColor: C.surfaceAlt, borderRadius: 10, padding: S.sm },
  keyLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, marginBottom: 2 },
  keyValue: { fontSize: 13, lineHeight: 18, color: C.textPrimary },
  savedChip: {
    backgroundColor: "#EAF6EC", borderRadius: RADIUS.chip,
    paddingHorizontal: S.md, paddingVertical: 4, alignSelf: "flex-start",
  },
  savedText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.green },
  upsellHeading: { color: C.textPrimary, marginBottom: S.md },
  upsellRow: { flexDirection: "row", gap: S.sm, marginBottom: S.base },
  upsellCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.divider, padding: S.md, gap: 4,
  },
  upsellCardBest: { borderColor: C.gold },
  bestBadge: {
    backgroundColor: C.gold, borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm, paddingVertical: 2, alignSelf: "flex-start",
  },
  bestText: { fontFamily: "Inter_700Bold", fontSize: 10, color: C.surface },
  upsellPages: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.textPrimary },
  upsellPrice: { fontFamily: "Inter_800ExtraBold", fontSize: 20, color: C.saffron },
  upsellDesc: { color: C.textSecond },
  primaryBtn: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    height: 52, alignItems: "center", justifyContent: "center", marginBottom: S.sm,
  },
  primaryBtnText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },
  laterBtn: { alignItems: "center", paddingVertical: S.sm },
  laterText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textTertiary },
});
