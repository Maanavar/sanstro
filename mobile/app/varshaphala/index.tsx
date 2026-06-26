import React, { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react-native";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { ChipStrip } from "@/components/ChipStrip";
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
import { getVarshaphala } from "@/api/varshaphala";
import { getPrimaryChartId } from "@/lib/userPrefs";
import type { HouseSummary } from "@/api/varshaphala";

const MONTH_NAMES_TA = [
  "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
  "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்",
];
const MONTH_NAMES_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE = [-3, -2, -1, 0, 1, 2, 3].map((n) => CURRENT_YEAR + n);

function scoreColor(score: number, C: ColorTokens): string {
  if (score >= 7) return C.green;
  if (score >= 4) return C.amber;
  return C.alert;
}

export default function VarshaphalaScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const [chartId, setChartId] = useState<string | null>(null);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [expandedBhava, setExpandedBhava] = useState<number | null>(null);

  useEffect(() => {
    if (tier !== "guest") getPrimaryChartId().then(setChartId);
  }, [tier]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["varshaphala", chartId, year],
    queryFn: () => getVarshaphala(chartId!, year),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const v = data?.data;

  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.container}>
        <Header isTamil={isTamil} />
        <View style={styles.guestWrap}>
          <Lock size={48} color={C.textTertiary} strokeWidth={1} />
          <Text style={[styles.guestTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
            {isTamil ? "உள்நுழைவு தேவை" : "Login required"}
          </Text>
          <Text style={[styles.guestDesc, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "வர்ஷபல காண ஜாதகம் தேவை."
              : "Create a birth chart to view annual predictions."}
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
      <Header isTamil={isTamil} />

      {/* Year selector */}
      <View style={styles.yearStripOuter}>
        <ChipStrip
          items={YEAR_RANGE.map((y) => ({ key: String(y), label: String(y) }))}
          selected={String(year)}
          onSelect={(k) => setYear(Number(k))}
          contentStyle={{ paddingHorizontal: S.base, paddingVertical: S.sm, gap: S.sm }}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isLoading && (
          <>
            <SkeletonCard height={120} />
            <SkeletonCard height={200} />
          </>
        )}
        {isError && <ErrorCard onRetry={refetch} />}

        {v && (
          <>
            {/* Solar return summary */}
            <View style={styles.summaryCard}>
              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? `${year} வர்ஷபல சுருக்கம்` : `${year} Annual Summary`}
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, isTamil ? TamilType.caption : EnType.caption]}>
                    {isTamil ? "வர்ஷ லக்னம்" : "Varsha Lagna"}
                  </Text>
                  <Text style={[styles.summaryValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {isTamil ? v.varsha_lagna_ta : v.varsha_lagna}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, isTamil ? TamilType.caption : EnType.caption]}>
                    {isTamil ? "முந்தா" : "Muntha"}
                  </Text>
                  <Text style={[styles.summaryValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {isTamil ? v.muntha_ta : v.muntha}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, isTamil ? TamilType.caption : EnType.caption]}>
                    {isTamil ? "வர்ஷேஷ்" : "Varshesh"}
                  </Text>
                  <Text style={[styles.summaryValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {isTamil ? v.varshesh_ta : v.varshesh}
                  </Text>
                </View>
              </View>
            </View>

            {/* Monthly prediction grid */}
            <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "மாதாந்திர கணிப்பு" : "Monthly Predictions"}
            </Text>
            <View style={styles.monthGrid}>
              {v.monthly.map((m) => (
                <View key={m.month} style={[styles.monthCard, { borderTopColor: scoreColor(m.score, C) }]}>
                  <Text style={styles.monthName}>
                    {isTamil ? MONTH_NAMES_TA[m.month - 1] : MONTH_NAMES_EN[m.month - 1]}
                  </Text>
                  <View style={[styles.monthScore, { backgroundColor: scoreColor(m.score, C) + "22" }]}>
                    <Text style={[styles.monthScoreText, { color: scoreColor(m.score, C) }]}>{m.score}/10</Text>
                  </View>
                  <Text style={[styles.monthPred, isTamil ? TamilType.caption : EnType.caption]} numberOfLines={3}>
                    {isTamil ? m.prediction_ta : m.prediction_en}
                  </Text>
                </View>
              ))}
            </View>

            {/* House-by-house accordion */}
            <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "பாவ பலன்கள்" : "House Results"}
            </Text>
            {v.houses.map((h: HouseSummary) => {
              const isOpen = expandedBhava === h.bhava;
              return (
                <TouchableOpacity
                  key={h.bhava}
                  style={styles.bhavaRow}
                  onPress={() => setExpandedBhava(isOpen ? null : h.bhava)}
                  activeOpacity={0.85}
                >
                  <View style={styles.bhavaHeader}>
                    <View style={styles.bhavaNum}>
                      <Text style={styles.bhavaNumText}>{h.bhava}</Text>
                    </View>
                    <Text style={[styles.bhavaTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                      {isTamil ? h.title_ta : h.title_en}
                    </Text>
                    <Text style={styles.bhavaChevron}>{isOpen ? "▲" : "▼"}</Text>
                  </View>
                  {isOpen && (
                    <Text style={[styles.bhavaSummary, isTamil ? TamilType.body : EnType.body]}>
                      {isTamil ? h.summary_ta : h.summary_en}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ isTamil }: { isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
        {isTamil ? "வர்ஷபல" : "Annual Prediction"}
      </Text>
      <View style={{ width: 40 }} />
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
  headerTitle: { color: C.textPrimary },
  yearStripOuter: { borderBottomWidth: 1, borderBottomColor: C.divider },
  scroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  sectionTitle: { color: C.textPrimary },

  summaryCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  summaryRow: { flexDirection: "row", gap: S.sm },
  summaryItem: { flex: 1, gap: 2 },
  summaryLabel: { color: C.textTertiary },
  summaryValue: { fontSize: 15, lineHeight: 22, color: C.textPrimary },

  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  monthCard: {
    width: "30%", flexGrow: 1,
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderTopWidth: 3, padding: S.sm, gap: S.xs,
  },
  monthName: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textSecond },
  monthScore: { borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 2, alignSelf: "flex-start" },
  monthScoreText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  monthPred: { color: C.textSecond, lineHeight: 16 },

  bhavaRow: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  bhavaHeader: { flexDirection: "row", alignItems: "center", gap: S.sm },
  bhavaNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.saffron + "22", alignItems: "center", justifyContent: "center",
  },
  bhavaNumText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.saffron },
  bhavaTitle: { flex: 1, fontSize: 15, lineHeight: 22, color: C.textPrimary },
  bhavaChevron: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  bhavaSummary: { color: C.textPrimary, marginTop: S.md, lineHeight: 22 },

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
