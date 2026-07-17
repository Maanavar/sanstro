import React, { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { askPrasna, type PrasnaOutlook, type PrasnaQuestionArea } from "@/api/tools";
import { getChartFull } from "@/api/charts";
import { getPrimaryChartId } from "@/lib/userPrefs";

/**
 * Prasna reads the sky at the moment the question is asked, for the place the
 * querent is asking from — it does not interpret the wording of the question.
 * The user therefore picks the *area* of life the question belongs to, which is
 * what the backend engine actually keys on (POST /prasna). This mirrors the web
 * Prasna widget's area picker.
 */
const QUESTION_AREAS: { key: PrasnaQuestionArea; ta: string; en: string }[] = [
  { key: "JOB",      ta: "வேலை",      en: "Job" },
  { key: "MARRIAGE", ta: "திருமணம்",  en: "Marriage" },
  { key: "HEALTH",   ta: "உடல்நலம்",  en: "Health" },
  { key: "FINANCE",  ta: "பணம்",      en: "Finance" },
  { key: "PROPERTY", ta: "சொத்து",    en: "Property" },
  { key: "TRAVEL",   ta: "பயணம்",     en: "Travel" },
  { key: "LEGAL",    ta: "வழக்கு",    en: "Legal" },
  { key: "CHILDREN", ta: "குழந்தை",   en: "Children" },
  { key: "GENERAL",  ta: "பொது",      en: "General" },
];

// Same fallback the web widget uses when a chart has no stored coordinates.
const FALLBACK_TIMEZONE = "Asia/Kolkata";
const FALLBACK_LATITUDE = 13.0827;
const FALLBACK_LONGITUDE = 80.2707;

function outlookColor(o: PrasnaOutlook): string {
  if (o === "FAVOURABLE") return C.green;
  if (o === "UNFAVOURABLE") return C.alert;
  if (o === "DELAY") return C.saffron;
  return C.amber;
}

function outlookLabel(o: PrasnaOutlook, isTamil: boolean): string {
  if (o === "FAVOURABLE") return isTamil ? "சாதகம்" : "Favourable";
  if (o === "UNFAVOURABLE") return isTamil ? "பாதகம்" : "Unfavourable";
  if (o === "DELAY") return isTamil ? "தாமதம்" : "Delay";
  return isTamil ? "கலப்பு" : "Mixed";
}

export default function PrashanScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const [area, setArea] = useState<PrasnaQuestionArea>("GENERAL");
  const [askedAt, setAskedAt] = useState("");
  const [chartId, setChartId] = useState<string | null>(null);

  useEffect(() => {
    getPrimaryChartId().then(setChartId);
  }, []);

  // The querent's place: use their chart's stored birth location when we have
  // one, falling back to Chennai — matching the web widget.
  const chart = useQuery({
    queryKey: ["chart-full", chartId],
    queryFn: () => getChartFull(chartId!),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const profile = chart.data?.data?.birthProfile;
  const place = {
    timezoneName: profile?.birthTimezone ?? FALLBACK_TIMEZONE,
    latitude: profile?.birthLatitude ?? FALLBACK_LATITUDE,
    longitude: profile?.birthLongitude ?? FALLBACK_LONGITUDE,
  };

  const { data: result, isLoading, isError, refetch } = useQuery({
    queryKey: ["prasna", area, askedAt],
    queryFn: () => askPrasna({ questionArea: area, ...place }),
    enabled: askedAt !== "",
    staleTime: 0,
  });

  function handleAsk() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // A fresh timestamp re-casts the chart for "now" on every ask.
    setAskedAt(new Date().toISOString());
  }

  function handleReset() {
    setAskedAt("");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "பிரச்னம்" : "Horary (Prasna)"}
        </Text>
        {askedAt ? (
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>{isTamil ? "மீண்டும்" : "Reset"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.intro, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil
            ? "உங்கள் கேள்வியை மனதில் தெளிவாக நிறுத்திக் கொள்ளுங்கள். அது எந்த வாழ்க்கைத் துறை சார்ந்தது என்பதைத் தேர்ந்தெடுத்து கேளுங்கள் — கேட்கும் தருணத்தின் கிரக நிலை கொண்டு விடை காணப்படும்."
            : "Hold your question clearly in mind, choose the area of life it belongs to, then ask — the answer is read from the planetary positions at the moment you ask."}
        </Text>

        <Text style={[styles.areaLabel, isTamil ? TamilType.caption : EnType.caption]}>
          {isTamil ? "கேள்வித் துறை" : "Question area"}
        </Text>
        <View style={styles.areaWrap}>
          {QUESTION_AREAS.map(({ key, ta, en }) => {
            const isActive = key === area;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setArea(key)}
                style={[styles.areaChip, isActive && styles.areaChipActive]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.areaChipText,
                    isActive && styles.areaChipTextActive,
                    { fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular" },
                  ]}
                >
                  {isTamil ? ta : en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.cta} onPress={handleAsk} activeOpacity={0.85}>
          <Text style={styles.ctaText}>
            {askedAt ? (isTamil ? "மீண்டும் கேள்" : "Ask again") : (isTamil ? "விடை காண்க" : "Get Answer")}
          </Text>
        </TouchableOpacity>

        {isLoading && <SkeletonCard height={200} />}
        {isError && <ErrorCard onRetry={refetch} />}

        {result && (
          <>
            <View style={[styles.outcomeCard, { borderColor: outcomeBorder(result.outlook) }]}>
              <Text style={[styles.outcomeTitle, { color: outlookColor(result.outlook) }]}>
                {outlookLabel(result.outlook, isTamil)}
              </Text>
              <Text style={[styles.outcomeBody, isTamil ? TamilType.body : EnType.body]}>
                {isTamil ? result.outlookTa : result.outlookEn}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <MetaChip label={isTamil ? "லக்னம்" : "Lagna"} value={result.prasnaLagnaName} />
              <MetaChip label={isTamil ? "நட்சத்திரம்" : "Moon star"} value={result.moonNakshatraName} />
              <MetaChip label={isTamil ? "காரகன்" : "Karaka"} value={`${result.karaka} (H${result.karakaHouse})`} />
            </View>

            {result.positiveIndicators.length > 0 && (
              <View style={styles.indicatorBlock}>
                <Text style={[styles.indicatorLabel, { color: C.green }]}>
                  {isTamil ? "சாதகமான அம்சங்கள்" : "Supporting factors"}
                </Text>
                {result.positiveIndicators.map((ind, i) => (
                  <Text key={i} style={styles.indicatorText}>+ {ind}</Text>
                ))}
              </View>
            )}

            {result.negativeIndicators.length > 0 && (
              <View style={styles.indicatorBlock}>
                <Text style={[styles.indicatorLabel, { color: C.alert }]}>
                  {isTamil ? "தடையான அம்சங்கள்" : "Opposing factors"}
                </Text>
                {result.negativeIndicators.map((ind, i) => (
                  <Text key={i} style={styles.indicatorText}>− {ind}</Text>
                ))}
              </View>
            )}

            {(isTamil ? result.cautionTa : result.cautionEn) ? (
              <View style={styles.cautionCard}>
                <Text style={[styles.cautionText, isTamil ? TamilType.caption : EnType.caption]}>
                  ⚠ {isTamil ? result.cautionTa : result.cautionEn}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function outcomeBorder(o: PrasnaOutlook): string {
  return outlookColor(o);
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaChipLabel}>{label}</Text>
      <Text style={styles.metaChipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 40 },
  headerTitle: { color: C.textPrimary },
  resetText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.saffron },
  scroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  intro: { color: C.textSecond, lineHeight: 22 },

  areaLabel: { color: C.textTertiary, textTransform: "uppercase", letterSpacing: 1 },
  areaWrap: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  areaChip: {
    paddingHorizontal: S.md, paddingVertical: S.sm,
    borderRadius: RADIUS.chip, borderWidth: 1.5,
    borderColor: C.divider, backgroundColor: C.surface,
  },
  areaChipActive: { borderColor: C.saffron, backgroundColor: C.saffron + "1A" },
  areaChipText: { fontSize: 13, color: C.textSecond },
  areaChipTextActive: { color: C.saffron, fontWeight: "700" },

  cta: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    height: 52, alignItems: "center", justifyContent: "center",
  },
  ctaText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },

  outcomeCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, borderWidth: 1.5, gap: S.xs,
  },
  outcomeTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  outcomeBody: { color: C.textPrimary, lineHeight: 22 },

  metaRow: { flexDirection: "row", gap: S.sm, flexWrap: "wrap" },
  metaChip: {
    flex: 1, minWidth: 96, gap: 2,
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.divider, padding: S.sm,
  },
  metaChipLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: C.textTertiary, textTransform: "uppercase" },
  metaChipValue: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.textPrimary },

  indicatorBlock: { gap: S.xs },
  indicatorLabel: { fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  indicatorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecond, lineHeight: 20 },

  cautionCard: {
    backgroundColor: C.saffron + "12", borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.saffron + "40", padding: S.md,
  },
  cautionText: { color: C.saffron, lineHeight: 20 },
});
