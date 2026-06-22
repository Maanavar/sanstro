import React, { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, type Href } from "expo-router";
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
import { RASI_LIST, type ChartCalculateResponseData } from "@vinaadi/shared";

const PLANET_SHORT_TA: Record<string, string> = {
  Sun: "à®šà¯‚", Moon: "à®šà®¨à¯", Mars: "à®šà¯†", Mercury: "à®ªà¯",
  Jupiter: "à®•à¯", Venus: "à®šà¯", Saturn: "à®š", Rahu: "à®°à®¾", Ketu: "à®•à¯‡",
};
const VARGA_OPTIONS = [
  { key: "D1", label: "D1 Rasi", meaning: "Birth chart - body, identity, life direction" },
  { key: "D9", label: "D9 Navamsa", meaning: "Marriage, dharma, deeper planetary strength" },
  { key: "D10", label: "D10 Dasamsha", meaning: "Career, authority, public work" },
  { key: "D12", label: "D12 Dwadashamsa", meaning: "Parents, ancestry, inherited patterns" },
] as const;

type VargaKey = typeof VARGA_OPTIONS[number]["key"];

function navamsaRasiFromDegree(absLongitude: number): number {
  const sign = Math.floor(absLongitude / 30) + 1;
  const degreeInSign = ((absLongitude % 30) + 30) % 30;
  const pada = Math.floor(degreeInSign / (30 / 9));
  const movable = new Set([1, 4, 7, 10]);
  const fixed = new Set([2, 5, 8, 11]);
  const start = movable.has(sign) ? sign : fixed.has(sign) ? ((sign + 7 - 1) % 12) + 1 : ((sign + 3 - 1) % 12) + 1;
  return ((start + pada - 1) % 12) + 1;
}

function vargaRasiForPlanet(chart: ChartCalculateResponseData, graha: string, view: VargaKey): number | null {
  if (view === "D1") return chart.planets.find((p) => p.graha === graha)?.rasi ?? null;
  if (view === "D9") return chart.vargas?.D9?.[graha] ?? chart.planets.find((p) => p.graha === graha)?.d9Rasi ?? null;
  return chart.vargas?.[view]?.[graha] ?? null;
}

function lagnaForVarga(chart: ChartCalculateResponseData, view: VargaKey): number | null {
  if (view === "D1") return chart.lagna.rasi;
  if (view === "D9") return navamsaRasiFromDegree(chart.lagna.absoluteLongitude);
  return null;
}

function rasiNameForNumber(rasi: number | null, isTamil: boolean): string {
  if (!rasi) return "-";
  const match = RASI_LIST.find((item) => item.number === rasi);
  return match ? (isTamil ? match.name.ta : match.name.en) : `Rasi ${rasi}`;
}

function hasVargaPlacements(chart: ChartCalculateResponseData, view: VargaKey): boolean {
  if (view === "D1") return true;
  if (view === "D9") return Boolean(chart.vargas?.D9) || chart.planets.some((p) => typeof p.d9Rasi === "number");
  const placements = chart.vargas?.[view];
  return Boolean(placements && Object.keys(placements).length > 0);
}

function buildHouses(chart: ChartCalculateResponseData, view: VargaKey): JadhagamHouseData[] {
  const lagna = lagnaForVarga(chart, view);
  const houses: JadhagamHouseData[] = Array.from({ length: 12 }, (_, i) => ({
    rasi: i + 1,
    planets: [],
    isLagna: lagna === i + 1,
  }));
  for (const p of chart.planets) {
    const rasi = vargaRasiForPlanet(chart, p.graha, view);
    const idx = rasi ? rasi - 1 : -1;
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
  const [activeVarga, setActiveVarga] = useState<VargaKey>("D1");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["chart-full", id],
    queryFn: () => getChartFull(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const chart = data?.data;
  const activeVargaMeta = useMemo(() => VARGA_OPTIONS.find((item) => item.key === activeVarga) ?? VARGA_OPTIONS[0], [activeVarga]);
  const activeVargaHasPlacements = useMemo(
    () => chart ? hasVargaPlacements(chart, activeVarga) : true,
    [chart, activeVarga]
  );

  function handleVargaSelect(view: VargaKey) {
    if (view === activeVarga) return;
    Haptics.selectionAsync();
    setActiveVarga(view);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>â†</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]} numberOfLines={1}>
          {chart?.birthProfile?.displayName
            ? `${chart.birthProfile.displayName} ${isTamil ? "à®œà®¾à®¤à®•à®®à¯" : "Jadhagam"}`
            : (isTamil ? "à®œà®¾à®¤à®•à®®à¯" : "Jadhagam")}
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
                {isTamil ? "à®°à¯‹à®œà®¾ à®šà®•à¯à®•à®°à®®à¯" : `${activeVargaMeta.label} Chart`}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vargaStrip}
              >
                {VARGA_OPTIONS.map((item) => {
                  const selected = activeVarga === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.vargaChip, selected && styles.vargaChipSelected]}
                      onPress={() => handleVargaSelect(item.key)}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.vargaChipText, selected && styles.vargaChipTextSelected]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.vargaContextRow}>
                <Text style={[styles.vargaMeaning, isTamil ? TamilType.caption : EnType.caption]}>
                  {activeVargaMeta.meaning}
                </Text>
                {!activeVargaHasPlacements && (
                  <Text style={[styles.vargaMissing, isTamil ? TamilType.caption : EnType.caption]}>
                    Backend placements not available yet
                  </Text>
                )}
              </View>
              <View style={{ alignItems: "center" }}>
                <JadhagamChart houses={buildHouses(chart, activeVarga)} size={300} />
              </View>
            </View>

            {/* Key chart data */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "à®®à¯à®•à¯à®•à®¿à®¯ à®µà®¿à®µà®°à®™à¯à®•à®³à¯" : "Key Details"}
              </Text>
              <View style={styles.dataGrid}>
                {[
                  { label: isTamil ? "à®²à®•à¯à®©à®®à¯" : "Lagna", value: chart.lagna.rasiName },
                  { label: isTamil ? "à®¨à®Ÿà¯à®šà®¤à¯à®¤à®¿à®°à®®à¯" : "Nakshatra", value: chart.lagna.nakshatraName },
                  { label: isTamil ? "à®ªà®¾à®¤à®®à¯" : "Pada", value: String(chart.lagna.pada) },
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
                {isTamil ? "à®•à®¿à®°à®• à®¨à®¿à®²à¯ˆà®•à®³à¯" : `${activeVargaMeta.key} Planet Positions`}
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
                    <Text style={styles.planetRasi}>{rasiNameForNumber(vargaRasiForPlanet(chart, p.graha, activeVarga), isTamil)}</Text>
                    {p.isRetrograde && (
                      <View style={styles.retroBadge}>
                        <Text style={styles.retroText}>R</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.rectifyCard}
              onPress={() => router.push(
                `/rectification?chartId=${encodeURIComponent(id)}&birthProfileId=${encodeURIComponent(chart.birthProfile.birthProfileId)}` as Href
              )}
              activeOpacity={0.85}
            >
              <View style={styles.rectifyBadge}>
                <Text style={styles.rectifyBadgeText}>BT</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rectifyTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "Birth Time Rectification" : "Birth Time Rectification"}
                </Text>
                <Text style={[styles.rectifySub, isTamil ? TamilType.caption : EnType.caption]}>
                  {chart.birthProfile.birthTimeLocal ? "Check this birth time against life events" : "Estimate a birth time from life events"}
                </Text>
              </View>
              <Text style={styles.rectifyArrow}>{">"}</Text>
            </TouchableOpacity>

            {/* Upsell CTA */}
            <TouchableOpacity
              style={styles.upsellCard}
              onPress={() => router.push({ pathname: "/jadhagam/upsell", params: { chartId: id } })}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.upsellTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "à®µà®¿à®°à®¿à®µà®¾à®© à®…à®±à®¿à®•à¯à®•à¯ˆ à®µà¯‡à®£à¯à®Ÿà¯à®®à®¾?" : "Want a detailed report?"}
                </Text>
                <Text style={[styles.upsellSub, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "5 à®ªà®•à¯à®•à®®à¯ â‚¹99 Â· 10 à®ªà®•à¯à®•à®®à¯ â‚¹249" : "5-page â‚¹99 Â· 10-page â‚¹249"}
                </Text>
              </View>
              <Text style={styles.upsellArrow}>â†’</Text>
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
  vargaStrip: { gap: S.sm, paddingRight: S.base },
  vargaChip: {
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.surface,
    borderRadius: RADIUS.chip,
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
  },
  vargaChipSelected: { backgroundColor: C.saffron, borderColor: C.saffron },
  vargaChipText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textPrimary },
  vargaChipTextSelected: { color: C.surface },
  vargaContextRow: { gap: 2, paddingRight: S.base },
  vargaMeaning: { color: C.textSecond },
  vargaMissing: { color: C.caution },
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
  rectifyCard: {
    backgroundColor: "#FEF5EC", borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.saffron,
    padding: S.base, flexDirection: "row", alignItems: "center", gap: S.md,
  },
  rectifyBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.saffron, alignItems: "center", justifyContent: "center",
  },
  rectifyBadgeText: { fontFamily: "Inter_800ExtraBold", fontSize: 13, color: C.surface },
  rectifyTitle: { color: C.textPrimary },
  rectifySub: { color: C.textSecond, marginTop: 2 },
  rectifyArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.saffron },  upsellCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.gold,
    padding: S.base, flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  upsellTitle: { color: C.textPrimary },
  upsellSub: { color: C.textSecond, marginTop: 2 },
  upsellArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.saffron },
});
