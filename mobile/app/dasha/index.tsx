import React, { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react-native";
import {
  FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View,
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
import { MethodologyStrip } from "@/components/MethodologyStrip";
import { getDashaTimeline } from "@/api/dasha";
import { getPrimaryChartId } from "@/lib/userPrefs";
import type { DashaPeriod } from "@/api/dasha";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function yearsLabel(start: string, end: string, isTamil: boolean): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const yrs = (ms / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  return isTamil ? `${yrs} ஆண்டுகள்` : `${yrs} years`;
}

function percentElapsed(start: string, end: string): number {
  const total = new Date(end).getTime() - new Date(start).getTime();
  const elapsed = Date.now() - new Date(start).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function remainingLabel(end: string, isTamil: boolean): string {
  const ms = new Date(end).getTime() - Date.now();
  if (ms < 0) return isTamil ? "முடிந்தது" : "Ended";
  const yrs = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  const months = Math.floor((ms % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30));
  if (yrs > 0) return isTamil ? `${yrs} ஆண்டு ${months} மாதம் மீதம்` : `${yrs}y ${months}m remaining`;
  return isTamil ? `${months} மாதம் மீதம்` : `${months}m remaining`;
}

export default function DashaScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const [chartId, setChartId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (tier !== "guest") getPrimaryChartId().then(setChartId);
  }, [tier]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["dasha-timeline", chartId],
    queryFn: () => getDashaTimeline(chartId!),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 6,
  });

  const d = data?.data;

  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            {isTamil ? "தசா காலவரிசை" : "Dasha Timeline"}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.guestWrap}>
          <Lock size={48} color={C.textTertiary} strokeWidth={1} />
          <Text style={[styles.guestTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
            {isTamil ? "உள்நுழைவு தேவை" : "Login required"}
          </Text>
          <Text style={[styles.guestDesc, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "தசா காலவரிசை காண ஜாதகம் தேவை."
              : "Create a birth chart to see your Dasha timeline."}
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.loginBtnText}>{isTamil ? "உள்நுழைக" : "Sign In"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "தசா காலவரிசை" : "Dasha Timeline"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <MethodologyStrip />

      {isLoading && (
        <View style={{ padding: S.base, gap: S.md }}>
          <SkeletonCard height={140} />
          <SkeletonCard height={96} />
          <SkeletonCard height={96} />
        </View>
      )}
      {isError && (
        <View style={{ padding: S.base }}>
          <ErrorCard onRetry={refetch} />
        </View>
      )}

      {d && (
        <FlatList
          data={d.current_timeline}
          keyExtractor={(item) => item.start_date}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.saffron} />}
          ListHeaderComponent={
            <>
              {/* Current dasha banner */}
              <View style={styles.banner}>
                <View style={styles.bannerMain}>
                  <Text style={styles.bannerLord}>{isTamil ? d.maha_dasha.lord_ta : d.maha_dasha.lord}</Text>
                  <Text style={styles.bannerLabel}>{isTamil ? "மஹா தசை" : "Maha Dasha"}</Text>
                  <Text style={styles.bannerDates}>
                    {formatDate(d.maha_dasha.start_date)} – {formatDate(d.maha_dasha.end_date)}
                  </Text>
                  <Text style={styles.bannerRemaining}>{remainingLabel(d.maha_dasha.end_date, isTamil)}</Text>
                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percentElapsed(d.maha_dasha.start_date, d.maha_dasha.end_date)}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>
                    {percentElapsed(d.maha_dasha.start_date, d.maha_dasha.end_date)}
                    {isTamil ? "% கடந்தது" : "% elapsed"}
                  </Text>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerSub}>
                  <Text style={styles.bannerSubLord}>{isTamil ? d.antar_dasha.lord_ta : d.antar_dasha.lord}</Text>
                  <Text style={styles.bannerSubLabel}>{isTamil ? "அந்தர் தசை" : "Antar Dasha"}</Text>
                  <Text style={styles.bannerSubDates}>
                    {formatDate(d.antar_dasha.start_date)} – {formatDate(d.antar_dasha.end_date)}
                  </Text>
                </View>
              </View>




              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "ஜீவித தசை காலவரிசை" : "Lifetime Dasha Periods"}
              </Text>
            </>
          }
          renderItem={({ item }: { item: DashaPeriod }) => {
            const isActive = new Date(item.start_date) <= new Date() && new Date() <= new Date(item.end_date);
            const isExpanded = expanded === item.start_date;
            return (
              <TouchableOpacity
                style={[styles.periodCard, isActive && styles.periodCardActive]}
                onPress={() => setExpanded(isExpanded ? null : item.start_date)}
                activeOpacity={0.85}
              >
                <View style={styles.periodRow}>
                  <View style={[styles.periodDot, isActive && { backgroundColor: C.saffron }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.periodLord, {
                      fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
                      color: isActive ? C.saffron : C.textPrimary,
                    }]}>
                      {isTamil ? item.lord_ta : item.lord}
                    </Text>
                    <Text style={[styles.periodDates, isTamil ? TamilType.caption : EnType.caption]}>
                      {formatDate(item.start_date)} – {formatDate(item.end_date)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={styles.periodDuration}>{yearsLabel(item.start_date, item.end_date, isTamil)}</Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{isTamil ? "தற்போது" : "Active"}</Text>
                      </View>
                    )}
                    <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
                  </View>
                </View>

                {isExpanded && item.sub_periods && item.sub_periods.length > 0 && (
                  <View style={styles.subList}>
                    {item.sub_periods.map((sp, i) => {
                      const spActive = new Date(sp.start_date) <= new Date() && new Date() <= new Date(sp.end_date);
                      return (
                        <View key={i} style={[styles.subRow, spActive && styles.subRowActive]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.subLord, {
                              fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
                              color: spActive ? C.saffron : C.textSecond,
                            }]}>
                              {isTamil ? sp.lord_ta : sp.lord}
                            </Text>
                            <Text style={[styles.subDates, isTamil ? TamilType.caption : EnType.caption]}>
                              {formatDate(sp.start_date)} – {formatDate(sp.end_date)}
                            </Text>
                            {sp.prediction_ta && (
                              <Text style={[styles.subPrediction, isTamil ? TamilType.caption : EnType.caption]}>
                                {isTamil ? sp.prediction_ta : sp.prediction_en}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  headerTitle: { color: C.textPrimary },
  list: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  sectionTitle: { color: C.textPrimary, marginTop: S.sm },

  banner: {
    backgroundColor: C.darkBg, borderRadius: RADIUS.card,
    padding: S.base, flexDirection: "row", marginBottom: S.md,
  },
  bannerMain: { flex: 1, gap: S.xs },
  bannerLord: { fontFamily: "NotoSansTamil_700Bold", fontSize: 22, lineHeight: 30, color: C.gold },
  bannerLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.indigoText, opacity: 0.6 },
  bannerDates: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.indigoText, opacity: 0.45 },
  bannerRemaining: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.amber },
  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: C.indigoText + "26",
    marginTop: S.xs,
  },
  progressFill: {
    height: 4, borderRadius: 2, backgroundColor: C.gold,
  },
  progressLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.indigoText, opacity: 0.45 },
  bannerDivider: { width: 1, backgroundColor: C.indigoText + "26", marginHorizontal: S.md },
  bannerSub: { flex: 1, gap: S.xs, justifyContent: "center" },
  bannerSubLord: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.indigoText },
  bannerSubLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.indigoText, opacity: 0.6 },
  bannerSubDates: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.indigoText, opacity: 0.55 },

  birthTimeNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: S.sm,
    backgroundColor: C.amber + "22", borderRadius: RADIUS.card, padding: S.md,
    borderWidth: 1, borderColor: C.amber + "55", marginBottom: S.sm,
  },
  birthTimeNoticeText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textPrimary, lineHeight: 18 },
  birthTimeNoticeCta: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.saffron, marginTop: 4 },

  periodCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  periodCardActive: { borderWidth: 1.5, borderColor: C.saffron },
  periodRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  periodDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.divider },
  periodLord: { fontSize: 16, lineHeight: 22 },
  periodDates: { color: C.textTertiary, marginTop: 2 },
  periodDuration: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  activeBadge: {
    backgroundColor: C.goldMethodLight, borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm, paddingVertical: 2,
  },
  activeBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: C.saffron },
  expandChevron: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },

  subList: { marginTop: S.md, gap: S.sm, paddingLeft: S.md, borderLeftWidth: 2, borderLeftColor: C.divider },
  subRow: { gap: 2, paddingVertical: S.xs },
  subRowActive: {},
  subLord: { fontSize: 14, lineHeight: 20 },
  subDates: { color: C.textTertiary },
  subPrediction: { color: C.textSecond, marginTop: 4 },

  guestWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: S.xxl, gap: S.md },
  guestTitle: { fontSize: 18, color: C.textPrimary, textAlign: "center" },
  guestDesc: { color: C.textSecond, textAlign: "center" },
  loginBtn: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    paddingHorizontal: S.xl, paddingVertical: S.md, marginTop: S.sm,
  },
  loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.surface },
  });
}
