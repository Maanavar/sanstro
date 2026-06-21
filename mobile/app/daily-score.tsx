import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { getDailyGuidance } from "@/api/guidance";
import { ScoreRing } from "@/components/ScoreRing";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import type { DailyGuidanceData } from "@vinaadi/shared";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return iso; }
}

const BREAKDOWN_AREAS = [
  { ta: "தொழில்",        en: "Career",        key: "moonTransit" as const },
  { ta: "பண விஷயம்",   en: "Finance",        key: "dashaSupport" as const },
  { ta: "உடல்நலம்",     en: "Health",         key: "panchangam" as const },
  { ta: "உறவு",          en: "Relationships",  key: "gocharSupport" as const },
];

export default function DailyScoreScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const { chartId } = useLocalSearchParams<{ chartId?: string }>();
  const today = new Date().toISOString().split("T")[0];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["daily-guidance", chartId, today],
    queryFn: () => getDailyGuidance(chartId!, today),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60,
  });

  const g = data?.data as DailyGuidanceData | undefined;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "இன்றைய விரிவான நிலை" : "Today's Detailed Guidance"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLoading && <SkeletonCard height={160} />}
        {isError && <ErrorCard onRetry={refetch} />}

        {g && (
          <>
            {/* Score hero */}
            <View style={styles.scoreCard}>
              <ScoreRing score={g.score} size={100} />
              <View style={styles.scoreInfo}>
                <Text style={[styles.scoreLabel, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "இன்றைய நிலை" : "Today's Score"}
                </Text>
                <Text style={[styles.scoreText, isTamil ? TamilType.body : EnType.body]}>
                  {isTamil ? g.text?.ta : g.text?.en}
                </Text>
                {g.actionSuggestion && (
                  <Text style={[styles.actionText, isTamil ? TamilType.caption : EnType.caption]}>
                    {isTamil ? g.actionSuggestion.ta : g.actionSuggestion.en}
                  </Text>
                )}
              </View>
            </View>

            {/* Score breakdown by life area */}
            <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "வாழ்க்கை அம்சங்கள்" : "Life Areas"}
            </Text>
            {BREAKDOWN_AREAS.map((area) => {
              const raw = g.scoreBreakdown[area.key] ?? 0;
              const barPct = Math.min(Math.max(raw / 10, 0), 1);
              const barColor = barPct > 0.6 ? C.green : barPct > 0.3 ? C.saffron : C.caution;
              return (
                <View key={area.key} style={styles.areaCard}>
                  <View style={styles.areaHeader}>
                    <Text style={[styles.areaName, {
                      fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
                    }]}>
                      {isTamil ? area.ta : area.en}
                    </Text>
                    <Text style={styles.areaScore}>{Math.round(raw * 10) / 10} / 10</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${barPct * 100}%` as any, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })}

            {/* Best windows */}
            {g.bestWindows.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "சிறந்த நேரங்கள்" : "Best Windows"}
                </Text>
                {g.bestWindows.map((w, i) => (
                  <View key={i} style={styles.windowRow}>
                    <View style={[styles.windowDot, { backgroundColor: C.green }]} />
                    <Text style={styles.windowTime}>
                      {formatTime(w.start)} – {formatTime(w.end)}
                    </Text>
                    <Text style={[styles.windowType, isTamil ? TamilType.caption : EnType.caption]}>
                      {w.type}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Caution windows */}
            {g.cautionWindows.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "கவனம் தேவை" : "Caution Windows"}
                </Text>
                {g.cautionWindows.map((w, i) => (
                  <View key={i} style={[styles.windowRow, { borderColor: C.caution }]}>
                    <View style={[styles.windowDot, { backgroundColor: C.caution }]} />
                    <Text style={styles.windowTime}>
                      {formatTime(w.start)} – {formatTime(w.end)}
                    </Text>
                    <Text style={[styles.windowType, isTamil ? TamilType.caption : EnType.caption]}>
                      {w.type}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Caution suggestion */}
            {g.cautionSuggestion && (
              <View style={[styles.suggestionCard, { borderLeftColor: C.caution }]}>
                <Text style={[styles.suggestionLabel, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "கவனம்" : "Caution"}
                </Text>
                <Text style={[styles.suggestionBody, isTamil ? TamilType.body : EnType.body]}>
                  {isTamil ? g.cautionSuggestion.ta : g.cautionSuggestion.en}
                </Text>
              </View>
            )}

            {/* Remedy */}
            {g.remedy && (
              <View style={[styles.suggestionCard, { borderLeftColor: C.gold }]}>
                <Text style={[styles.suggestionLabel, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "பரிகாரம்" : "Remedy"}
                </Text>
                <Text style={[styles.suggestionBody, isTamil ? TamilType.body : EnType.body]}>
                  {isTamil ? g.remedy.ta : g.remedy.en}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", gap: S.md,
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  backArrow: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary },
  headerTitle: { color: C.textPrimary, flex: 1 },
  scroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  scoreCard: {
    backgroundColor: "#1A2540", borderRadius: RADIUS.card,
    padding: S.base, flexDirection: "row", alignItems: "center", gap: S.base,
  },
  scoreInfo: { flex: 1, gap: S.xs },
  scoreLabel: { color: "rgba(255,255,255,0.65)" },
  scoreText: { color: "#FFFFFF" },
  actionText: { color: "rgba(255,255,255,0.8)", marginTop: 4 },
  sectionTitle: { color: C.textPrimary },
  areaCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md, gap: S.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  areaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  areaName: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
  areaScore: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textSecond },
  barTrack: { height: 6, backgroundColor: C.surfaceAlt, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  windowRow: {
    flexDirection: "row", alignItems: "center", gap: S.sm,
    backgroundColor: C.surface, borderRadius: RADIUS.chip,
    borderWidth: 1, borderColor: C.divider,
    paddingHorizontal: S.md, paddingVertical: S.sm,
  },
  windowDot: { width: 8, height: 8, borderRadius: 4 },
  windowTime: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.textPrimary, flex: 1 },
  windowType: { color: C.textTertiary },
  suggestionCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, gap: S.xs, borderLeftWidth: 3, borderLeftColor: C.saffron,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  suggestionLabel: { color: C.textTertiary },
  suggestionBody: { color: C.textPrimary },
});
