import React, { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import { getPrimaryChartId } from "@/lib/userPrefs";
import { getPublicMuhurthamNaals, getChartMuhurthamNaals } from "@/api/muhurthamNaal";
import type { MuhurthamNaalItem } from "@/api/muhurthamNaal";

const MONTHS = [
  { v: 0, ta: "அனைத்தும்", en: "All" },
  { v: 1, ta: "ஜனவரி", en: "Jan" }, { v: 2, ta: "பிப்ரவரி", en: "Feb" },
  { v: 3, ta: "மார்ச்", en: "Mar" }, { v: 4, ta: "ஏப்ரல்", en: "Apr" },
  { v: 5, ta: "மே", en: "May" }, { v: 6, ta: "ஜூன்", en: "Jun" },
  { v: 7, ta: "ஜூலை", en: "Jul" }, { v: 8, ta: "ஆகஸ்ட்", en: "Aug" },
  { v: 9, ta: "செப்டம்பர்", en: "Sep" }, { v: 10, ta: "அக்டோபர்", en: "Oct" },
  { v: 11, ta: "நவம்பர்", en: "Nov" }, { v: 12, ta: "டிசம்பர்", en: "Dec" },
];

function formatDate(iso: string, lang: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function MuhurthamNaalScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const T = isTamil ? TamilType : EnType;

  const [selectedMonth, setSelectedMonth] = useState(0);
  const [chartId, setChartId] = useState<string | null>(null);

  useEffect(() => {
    if (tier !== "guest") getPrimaryChartId().then(setChartId);
  }, [tier]);

  const publicQuery = useQuery({
    queryKey: ["muhurtham-naals-public", 2027],
    queryFn: () => getPublicMuhurthamNaals(2027),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const personalQuery = useQuery({
    queryKey: ["muhurtham-naals-chart", chartId, 2027],
    queryFn: () => getChartMuhurthamNaals(chartId!, 2027),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const allNaals: MuhurthamNaalItem[] = publicQuery.data?.naals ?? [];
  const matchMap = useMemo(() => {
    const m = new Map<string, "GOOD" | "NEUTRAL" | "AVOID">();
    for (const match of personalQuery.data?.matches ?? []) {
      m.set(match.naal.date, match.taraQuality);
    }
    return m;
  }, [personalQuery.data]);

  const filtered = useMemo(() => {
    if (selectedMonth === 0) return allNaals;
    return allNaals.filter((n) => new Date(n.date + "T00:00:00").getMonth() + 1 === selectedMonth);
  }, [allNaals, selectedMonth]);

  function qualityDot(date: string): string | null {
    if (!chartId) return null;
    const q = matchMap.get(date);
    if (!q) return null;
    if (q === "GOOD") return C.green;
    if (q === "AVOID") return C.alert;
    return C.textTertiary;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, T.heading]}>
            {isTamil ? "முகூர்த்த நாட்கள்" : "Muhurtham Naal"}
          </Text>
          <Text style={[styles.headerSub, T.caption]}>2027</Text>
        </View>
      </View>

      {/* Month filter */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {MONTHS.map((m) => (
            <TouchableOpacity
              key={m.v}
              style={[styles.chip, selectedMonth === m.v && styles.chipActive]}
              onPress={() => setSelectedMonth(m.v)}
            >
              <Text style={[styles.chipText, selectedMonth === m.v && styles.chipTextActive, {
                fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular",
              }]}>
                {isTamil ? m.ta : m.en}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {chartId && personalQuery.isSuccess && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.green }]} />
            <Text style={[styles.legendText, T.caption]}>{isTamil ? "உங்கள் நட்சத்திரம் சாதகம்" : "Good for your star"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: C.alert }]} />
            <Text style={[styles.legendText, T.caption]}>{isTamil ? "தவிர்க்கவும்" : "Avoid"}</Text>
          </View>
        </View>
      )}

      {publicQuery.isLoading && (
        <View style={styles.loadingState}>
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
        </View>
      )}
      {publicQuery.isError && <ErrorCard onRetry={publicQuery.refetch} />}

      {!publicQuery.isLoading && !publicQuery.isError && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={publicQuery.isFetching} onRefresh={publicQuery.refetch} tintColor={C.saffron} />}
          ListHeaderComponent={
            <Text style={[styles.countText, T.caption]}>
              {isTamil ? `${filtered.length} முகூர்த்த நாட்கள்` : `${filtered.length} muhurtham dates`}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, T.body]}>
                {isTamil ? "தேர்ந்த மாதத்தில் தேதிகள் இல்லை" : "No dates for the selected month"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const dot = qualityDot(item.date);
            return (
              <View style={styles.naalCard}>
                <View style={styles.naalLeft}>
                  <Text style={[styles.naalDate, T.subheading]}>{formatDate(item.date, lang)}</Text>
                  <Text style={[styles.naalWeekday, T.caption]}>{isTamil ? item.weekday.ta : item.weekday.en}</Text>
                </View>
                <View style={styles.naalCenter}>
                  <View style={styles.naalRow}>
                    <Text style={[styles.naalLabel, T.caption]}>{isTamil ? "நட்சத்திரம்" : "Nakshatra"}</Text>
                    <Text style={[styles.naalValue, T.bodySmall]}>{isTamil ? item.nakshatra.ta : item.nakshatra.en}</Text>
                  </View>
                  <View style={styles.naalRow}>
                    <Text style={[styles.naalLabel, T.caption]}>{isTamil ? "பிறை" : "Pirai"}</Text>
                    <Text style={[styles.naalValue, T.bodySmall]}>{isTamil ? item.pirai.ta : item.pirai.en}</Text>
                  </View>
                  {item.nallaNeram.length > 0 && (
                    <View style={styles.naalRow}>
                      <Text style={[styles.naalLabel, T.caption]}>{isTamil ? "நல்ல நேரம்" : "Nalla Neram"}</Text>
                      <Text style={[styles.naalValue, T.bodySmall]}>{item.nallaNeram[0].start}–{item.nallaNeram[0].end}</Text>
                    </View>
                  )}
                </View>
                {dot && <View style={[styles.qualityDot, { backgroundColor: dot }]} />}
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {!chartId && publicQuery.isSuccess && (
        <View style={styles.ctaBanner}>
          <Text style={[styles.ctaText, T.body]}>
            {isTamil
              ? "உங்கள் நட்சத்திரத்திற்கு சிறந்த தேதிகள் காண உங்கள் ஜாதகம் உருவாக்குங்கள்."
              : "Create your birth chart to see which dates best match your birth star."}
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.ctaBtnText}>{isTamil ? "ஜாதகம் உருவாக்கு" : "Create chart"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row", alignItems: "center", gap: S.md,
      paddingHorizontal: S.base, paddingVertical: S.md,
      borderBottomWidth: 1, borderBottomColor: C.divider,
      backgroundColor: C.goldLight,
    },
    backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
    headerTitle: { color: C.textPrimary },
    headerSub: { color: C.textTertiary },
    filterWrapper: { borderBottomWidth: 1, borderBottomColor: C.divider },
    filterRow: { paddingHorizontal: S.base, paddingVertical: S.sm, gap: S.sm },
    chip: {
      borderRadius: RADIUS.chip, paddingHorizontal: S.md, paddingVertical: 5,
      borderWidth: 1, borderColor: C.divider, backgroundColor: C.surface,
    },
    chipActive: { backgroundColor: C.saffron, borderColor: C.saffron },
    chipText: { fontSize: 12, lineHeight: 18, color: C.textSecond },
    chipTextActive: { color: C.surface },
    legendRow: {
      flexDirection: "row", gap: S.base, paddingHorizontal: S.base, paddingVertical: S.sm,
      backgroundColor: C.surfaceAlt, borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: S.xs },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { color: C.textSecond },
    loadingState: { padding: S.base, gap: S.sm },
    list: { padding: S.base, paddingBottom: S.xxl },
    countText: { color: C.textTertiary, marginBottom: S.sm },
    emptyState: { alignItems: "center", paddingTop: 40 },
    emptyText: { color: C.textTertiary },
    naalCard: {
      flexDirection: "row", alignItems: "center", gap: S.md,
      backgroundColor: C.surface, borderRadius: RADIUS.card,
      padding: S.md, borderWidth: 1, borderColor: C.divider,
    },
    naalLeft: { width: 90 },
    naalDate: { color: C.textPrimary },
    naalWeekday: { color: C.saffron, marginTop: 2 },
    naalCenter: { flex: 1, gap: 3 },
    naalRow: { flexDirection: "row", gap: S.xs, alignItems: "center" },
    naalLabel: { color: C.textTertiary, minWidth: 68 },
    naalValue: { color: C.textPrimary, flex: 1 },
    qualityDot: { width: 10, height: 10, borderRadius: 5 },
    separator: { height: S.xs },
    ctaBanner: {
      margin: S.base,
      backgroundColor: C.goldLight, borderRadius: RADIUS.card,
      padding: S.md, gap: S.sm,
      borderWidth: 1, borderColor: C.gold,
    },
    ctaText: { color: C.textPrimary },
    ctaBtn: {
      backgroundColor: C.saffron, borderRadius: RADIUS.button,
      paddingVertical: S.sm, paddingHorizontal: S.md, alignSelf: "flex-start",
    },
    ctaBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.surface },
  });
}
