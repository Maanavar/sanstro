import React, { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ScrollView, Share, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { JadhagamChart, type JadhagamHouseData } from "@/components/JadhagamChart";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";
import { getChartFull } from "@/api/charts";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { RASI_LIST, type ChartCalculateResponseData } from "@vinaadi/shared";
import { Lock } from "lucide-react-native";

const PLANET_SHORT_TA: Record<string, string> = {
  Sun: "சூ", Moon: "சந்", Mars: "செ", Mercury: "பு",
  Jupiter: "கு", Venus: "சு", Saturn: "ச", Rahu: "ரா", Ketu: "கே", Mandhi: "மா",
};

const VARGA_OPTIONS = [
  { key: "D1", label: "D1 ராசி", labelEn: "D1 Rasi" },
  { key: "D9", label: "D9 நவாம்சம்", labelEn: "D9 Navamsa" },
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

function buildHouses(chart: ChartCalculateResponseData, view: VargaKey): JadhagamHouseData[] {
  const lagna = view === "D1"
    ? chart.lagna.rasi
    : navamsaRasiFromDegree(chart.lagna.absoluteLongitude);
  const houses: JadhagamHouseData[] = Array.from({ length: 12 }, (_, i) => ({
    rasi: i + 1,
    planets: [],
    isLagna: lagna === i + 1,
  }));
  for (const p of chart.planets) {
    const rasi = view === "D1" ? p.rasi : (chart.vargas?.D9?.[p.graha] ?? p.d9Rasi ?? null);
    const idx = rasi ? rasi - 1 : -1;
    if (idx >= 0 && idx < 12) {
      const abbr = PLANET_SHORT_TA[p.graha] ?? p.graha.slice(0, 2);
      houses[idx].planets.push(p.isRetrograde ? `${abbr}R` : abbr);
    }
  }
  return houses;
}

function rasiName(rasi: number | null, isTamil: boolean): string {
  if (!rasi) return "-";
  const r = RASI_LIST.find((x) => x.number === rasi);
  return r ? (isTamil ? r.name.ta : r.name.en) : `${rasi}`;
}

export default function JadhagamToolScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const [chartId, setChartId] = useState<string | null>(null);
  const [activeVarga, setActiveVarga] = useState<VargaKey>("D1");

  useEffect(() => {
    if (tier !== "guest") getPrimaryChartId().then(setChartId);
  }, [tier]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["chart-full", chartId],
    queryFn: () => getChartFull(chartId!),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const chart = data?.data;

  async function handleShare() {
    if (!chart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: isTamil
        ? `${chart.birthProfile.displayName} ஜாதகம் — லக்னம்: ${chart.lagna.rasiName}, நட்சத்திரம்: ${chart.lagna.nakshatraName}`
        : `${chart.birthProfile.displayName} Jadhagam — Lagna: ${chart.lagna.rasiName}, Nakshatra: ${chart.lagna.nakshatraName}`,
    });
  }

  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.container}>
        <Header isTamil={isTamil} C={C} styles={styles} onShare={null} />
        <View style={styles.guestWrap}>
          <Lock size={48} color={C.textTertiary} strokeWidth={1} />
          <Text style={[styles.guestTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
            {isTamil ? "உள்நுழைவு தேவை" : "Login required"}
          </Text>
          <Text style={[styles.guestDesc, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "ஜாதக விவரத்திற்கு கணக்கு தேவை." : "Create a birth chart to view your Jadhagam."}
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.loginBtnText}>{isTamil ? "கணக்கு உருவாக்கு" : "Create Account"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header isTamil={isTamil} C={C} styles={styles} onShare={chart ? handleShare : null} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isLoading && <><SkeletonCard height={320} /><SkeletonCard height={120} /></>}
        {isError && <ErrorCard onRetry={refetch} />}

        {!isLoading && !isError && !chart && !chartId && (
          <View style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil ? "ஜாதகம் இல்லை" : "No birth chart found"}
            </Text>
            <Text style={[styles.emptyDesc, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? "பிறந்த விவரங்கள் சேர்க்கவும்." : "Add your birth details to generate a chart."}
            </Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/(onboarding)/birth-details" as any)}>
              <Text style={styles.loginBtnText}>{isTamil ? "விவரங்கள் சேர்" : "Add Birth Details"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {chart && (
          <>
            {/* Profile info */}
            <View style={styles.profileCard}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                  {chart.birthProfile.displayName}
                </Text>
                <Text style={[styles.profileSub, isTamil ? TamilType.caption : EnType.caption]}>
                  {chart.birthProfile.birthDateLocal}
                  {chart.birthProfile.birthTimeLocal ? ` · ${chart.birthProfile.birthTimeLocal}` : ""}
                </Text>
              </View>
              <ThirukanithamBadge />
            </View>

            {/* Varga selector */}
            <View style={styles.vargaRow}>
              {VARGA_OPTIONS.map((v) => {
                const isSel = activeVarga === v.key;
                return (
                  <TouchableOpacity
                    key={v.key}
                    style={[styles.vargaChip, isSel && styles.vargaChipSel]}
                    onPress={() => { Haptics.selectionAsync(); setActiveVarga(v.key); }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.vargaChipText, isSel && styles.vargaChipTextSel]}>
                      {isTamil ? v.label : v.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Chart grid */}
            <View style={styles.chartWrap}>
              <JadhagamChart houses={buildHouses(chart, activeVarga)} size={300} />
            </View>

            {/* Key details */}
            <View style={styles.detailsGrid}>
              {[
                { label: isTamil ? "லக்னம்" : "Lagna", value: chart.lagna.rasiName },
                { label: isTamil ? "நட்சத்திரம்" : "Nakshatra", value: chart.lagna.nakshatraName },
                { label: isTamil ? "பாதம்" : "Pada", value: String(chart.lagna.pada) },
              ].map((item) => (
                <View key={item.label} style={styles.detailCard}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={[styles.detailValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Planet list */}
            <View style={styles.planetList}>
              {chart.planets.map((p, i) => (
                <View key={p.graha} style={[styles.planetRow, i > 0 && styles.planetBorder]}>
                  <View style={styles.planetChip}>
                    <Text style={styles.planetChipText}>{PLANET_SHORT_TA[p.graha] ?? p.graha.slice(0, 2)}</Text>
                  </View>
                  <Text style={[styles.planetName, { fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular" }]}>
                    {p.graha}
                  </Text>
                  <Text style={styles.planetRasi}>{rasiName(p.rasi, isTamil)}</Text>
                  {p.isRetrograde && (
                    <View style={styles.retroBadge}>
                      <Text style={styles.retroText}>R</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Open full detail */}
            <TouchableOpacity
              style={styles.fullDetailBtn}
              onPress={() => router.push({ pathname: "/jadhagam/[id]", params: { id: chartId! } })}
              activeOpacity={0.85}
            >
              <Text style={styles.fullDetailText}>
                {isTamil ? "முழு ஜாதகம் காண →" : "View Full Jadhagam →"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({
  isTamil, C, styles, onShare,
}: {
  isTamil: boolean;
  C: ColorTokens;
  styles: ReturnType<typeof makeStyles>;
  onShare: (() => void) | null;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
        {isTamil ? "ஜாதகம்" : "Birth Chart"}
      </Text>
      {onShare ? (
        <TouchableOpacity onPress={onShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.shareBtn}>{isTamil ? "பகிர்" : "Share"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
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
    shareBtn: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.saffron, width: 48, textAlign: "right" },
    scroll: { padding: S.base, gap: S.lg, paddingBottom: S.xxl },

    profileCard: {
      backgroundColor: C.goldMethodLight, borderRadius: RADIUS.card, padding: S.base,
      flexDirection: "row", alignItems: "center", gap: S.md,
    },
    profileName: { fontSize: 16, lineHeight: 22, color: C.textPrimary },
    profileSub: { color: C.textSecond, marginTop: 2 },

    vargaRow: { flexDirection: "row", gap: S.sm },
    vargaChip: {
      borderWidth: 1, borderColor: C.divider, backgroundColor: C.surface,
      borderRadius: RADIUS.chip, paddingHorizontal: S.md, paddingVertical: S.xs,
    },
    vargaChipSel: { backgroundColor: C.saffron, borderColor: C.saffron },
    vargaChipText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textPrimary },
    vargaChipTextSel: { color: C.surface },

    chartWrap: { alignItems: "center" },

    detailsGrid: { flexDirection: "row", gap: S.sm },
    detailCard: {
      flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md,
      shadowColor: C.deepIndigo, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
    },
    detailLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, marginBottom: 3 },
    detailValue: { fontSize: 13, lineHeight: 18, color: C.textPrimary },

    planetList: { backgroundColor: C.surface, borderRadius: RADIUS.card, overflow: "hidden" },
    planetRow: { flexDirection: "row", alignItems: "center", gap: S.sm, paddingHorizontal: S.base, paddingVertical: S.sm },
    planetBorder: { borderTopWidth: 1, borderTopColor: C.divider },
    planetChip: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: `${C.skyBlue}22`, alignItems: "center", justifyContent: "center",
    },
    planetChipText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 10, lineHeight: 14, color: C.skyBlue },
    planetName: { flex: 1, fontSize: 14, lineHeight: 20, color: C.textPrimary },
    planetRasi: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecond },
    retroBadge: { backgroundColor: C.caution, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
    retroText: { fontFamily: "Inter_700Bold", fontSize: 10, color: C.surface },

    fullDetailBtn: {
      backgroundColor: C.surface, borderRadius: RADIUS.card,
      borderWidth: 1, borderColor: C.saffron, padding: S.base,
      alignItems: "center",
    },
    fullDetailText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.saffron },

    guestWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: S.xxl, gap: S.md },
    guestTitle: { fontSize: 18, color: C.textPrimary, textAlign: "center" },
    guestDesc: { color: C.textSecond, textAlign: "center" },
    loginBtn: {
      backgroundColor: C.saffron, borderRadius: RADIUS.button,
      paddingHorizontal: S.xl, paddingVertical: S.md, marginTop: S.sm,
    },
    loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.surface },

    emptyCard: {
      backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.xl,
      alignItems: "center", gap: S.md,
    },
    emptyTitle: { fontSize: 18, color: C.textPrimary, textAlign: "center" },
    emptyDesc: { color: C.textSecond, textAlign: "center" },
  });
}
