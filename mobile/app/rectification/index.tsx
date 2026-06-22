import React, { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { EnType, TamilType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { getChartFull } from "@/api/charts";
import {
  applyRectifiedBirthTime,
  estimateBirthTime,
  type RectificationApplyData,
  type RectificationEvent,
  type RectificationEventType,
  type RectificationResultData,
} from "@/api/rectification";
import { ErrorCard } from "@/components/ErrorCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { getPrimaryChartId, getPrimaryProfileId } from "@/lib/userPrefs";

type Step = "events" | "results" | "applied";

const EVENT_FIELDS: Array<{
  key: RectificationEventType;
  label: string;
  hint: string;
  house: string;
}> = [
  { key: "MARRIAGE", label: "Marriage / major relationship", hint: "Year it began", house: "7th / 2nd" },
  { key: "CAREER_BREAK", label: "Career shift or job loss", hint: "Year of the turning point", house: "10th / 6th" },
  { key: "RELOCATION", label: "Moved city or country", hint: "Year of relocation", house: "12th / 4th" },
  { key: "HEALTH_MAJOR", label: "Major health event", hint: "Year of surgery or illness", house: "6th / 8th" },
  { key: "PARENT_BIRTH", label: "Parent birth year", hint: "Mother or father birth year", house: "4th / 9th" },
];

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Unable to complete the request.";
}

function probabilityLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function parseEvents(answers: Record<RectificationEventType, string>): {
  events: RectificationEvent[];
  invalidLabels: string[];
} {
  const events: RectificationEvent[] = [];
  const invalidLabels: string[] = [];

  for (const field of EVENT_FIELDS) {
    const raw = answers[field.key]?.trim();
    if (!raw) continue;
    const year = Number.parseInt(raw, 10);
    if (!Number.isFinite(year) || String(year) !== raw || year < 1900 || year > 2100) {
      invalidLabels.push(field.label);
      continue;
    }
    events.push({ eventType: field.key, eventYear: year });
  }

  return { events, invalidLabels };
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <View style={[styles.stepPill, active && styles.stepPillActive]}>
      <Text style={[styles.stepPillText, active && styles.stepPillTextActive]}>{label}</Text>
    </View>
  );
}

export default function RectificationScreen() {
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const params = useLocalSearchParams<{
    chartId?: string | string[];
    birthProfileId?: string | string[];
  }>();

  const [fallbackChartId, setFallbackChartId] = useState<string | null>(null);
  const [fallbackProfileId, setFallbackProfileId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<RectificationEventType, string>>({
    MARRIAGE: "",
    CAREER_BREAK: "",
    RELOCATION: "",
    HEALTH_MAJOR: "",
    PARENT_BIRTH: "",
  });
  const [step, setStep] = useState<Step>("events");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RectificationResultData | null>(null);
  const [applied, setApplied] = useState<RectificationApplyData | null>(null);
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    async function loadStoredIds() {
      const [storedChartId, storedProfileId] = await Promise.all([
        getPrimaryChartId(),
        getPrimaryProfileId(),
      ]);
      setFallbackChartId(storedChartId);
      setFallbackProfileId(storedProfileId);
    }
    loadStoredIds();
  }, []);

  const chartId = firstParam(params.chartId) ?? fallbackChartId;
  const routeBirthProfileId = firstParam(params.birthProfileId);

  const {
    data: chartData,
    isLoading: chartLoading,
    isError: chartError,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ["rectification-chart", chartId],
    queryFn: () => getChartFull(chartId!),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 30,
  });

  const chart = chartData?.data;
  const birthProfileId = routeBirthProfileId ?? chart?.birthProfile.birthProfileId ?? fallbackProfileId;
  const profileName = chart?.birthProfile.displayName ?? "Birth profile";
  const currentBirthTime = chart?.birthProfile.birthTimeLocal ?? null;
  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value.trim()).length,
    [answers]
  );

  async function handleEstimate() {
    if (!birthProfileId) {
      setError("Create a birth profile before rectifying birth time.");
      return;
    }

    const { events, invalidLabels } = parseEvents(answers);
    if (invalidLabels.length > 0) {
      setError(`Check year format for: ${invalidLabels.join(", ")}.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (events.length === 0) {
      setError("Add at least one life event year.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await estimateBirthTime(birthProfileId, events);
      setResult(response.data);
      setSelectedTime(response.data.recommendedTime);
      setStep("results");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(formatError(err));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!birthProfileId || !selectedTime) return;
    setApplying(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const response = await applyRectifiedBirthTime(birthProfileId, selectedTime);
      setApplied(response);
      setStep("applied");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(formatError(err));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setApplying(false);
    }
  }

  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.back}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            Birth Time Rectification
          </Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Sign in required</Text>
          <Text style={styles.emptyText}>Create a chart first, then use life events to narrow the birth time.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.primaryBtnText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.back}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]} numberOfLines={1}>
          Birth Time Rectification
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.stepRow}>
          <StepPill active={step === "events"} label="Events" />
          <StepPill active={step === "results"} label="Candidates" />
          <StepPill active={step === "applied"} label="Applied" />
        </View>

        <View style={styles.heroPanel}>
          <Text style={styles.heroKicker}>Evidence-based estimate</Text>
          <Text style={[styles.heroTitle, isTamil ? TamilType.heading : EnType.heading]}>
            Narrow an uncertain birth time
          </Text>
          <Text style={[styles.heroBody, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
            Add known life-event years. Vinaadi compares candidate lagna windows and recommends the closest fit.
          </Text>
          <View style={styles.contextRow}>
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>Profile</Text>
              <Text style={styles.contextValue} numberOfLines={1}>{profileName}</Text>
            </View>
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>Current time</Text>
              <Text style={styles.contextValue}>{currentBirthTime ?? "Unknown"}</Text>
            </View>
          </View>
        </View>

        {chartLoading && !birthProfileId && (
          <>
            <SkeletonCard height={96} />
            <SkeletonCard height={180} />
          </>
        )}

        {chartError && !birthProfileId && (
          <ErrorCard message="Could not load chart context." onRetry={refetchChart} />
        )}

        {!chartLoading && !birthProfileId && (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No birth profile found</Text>
            <Text style={styles.emptyText}>Create or open a jadhagam first, then return to this wizard.</Text>
          </View>
        )}

        {birthProfileId && step === "events" && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Life events</Text>
              <Text style={styles.sectionMeta}>{answeredCount}/5 added</Text>
            </View>

            <View style={styles.eventList}>
              {EVENT_FIELDS.map((field) => (
                <View key={field.key} style={styles.eventRow}>
                  <View style={styles.eventCopy}>
                    <Text style={styles.eventTitle}>{field.label}</Text>
                    <Text style={styles.eventHint}>{field.hint}</Text>
                    <Text style={styles.eventHouse}>Signals: {field.house}</Text>
                  </View>
                  <TextInput
                    value={answers[field.key]}
                    onChangeText={(value) => {
                      setAnswers((prev) => ({ ...prev, [field.key]: value.replace(/[^0-9]/g, "").slice(0, 4) }));
                      setError(null);
                    }}
                    onFocus={() => Haptics.selectionAsync()}
                    placeholder="YYYY"
                    placeholderTextColor={C.textTertiary}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={styles.yearInput}
                  />
                </View>
              ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleEstimate}
              disabled={loading}
              activeOpacity={0.86}
            >
              {loading ? <ActivityIndicator color={C.surface} /> : <Text style={styles.primaryBtnText}>Find candidate times</Text>}
            </TouchableOpacity>
          </>
        )}

        {birthProfileId && step === "results" && result && (
          <>
            <View style={styles.resultSummary}>
              <Text style={styles.resultKicker}>Recommended</Text>
              <Text style={styles.resultTime}>{result.recommendedTime}</Text>
              <Text style={[styles.resultNote, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
                {result.confidenceNote}
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Candidate windows</Text>
              <Text style={styles.sectionMeta}>Pick one</Text>
            </View>

            <View style={styles.candidateList}>
              {result.candidates.map((candidate, index) => {
                const selected = selectedTime === candidate.timeLocal;
                const percent = Math.max(0, Math.min(100, Math.round(candidate.probabilityWeight * 100)));
                return (
                  <TouchableOpacity
                    key={`${candidate.timeLocal}-${candidate.lagnaRasi}`}
                    style={[styles.candidateRow, selected && styles.candidateRowSelected]}
                    onPress={() => {
                      setSelectedTime(candidate.timeLocal);
                      Haptics.selectionAsync();
                    }}
                    activeOpacity={0.86}
                  >
                    <View style={styles.candidateTimeBlock}>
                      <Text style={[styles.candidateTime, selected && styles.candidateTimeSelected]}>
                        {candidate.timeLocal}
                      </Text>
                      {index === 0 && <Text style={styles.recommendedBadge}>Recommended</Text>}
                    </View>
                    <View style={styles.candidateMain}>
                      <Text style={styles.candidateLagna}>Lagna: {candidate.lagnaRasiName}</Text>
                      <Text style={styles.candidateMatch}>
                        {candidate.matchingEvents} event match(es) - {probabilityLabel(candidate.probabilityWeight)}
                      </Text>
                      <View style={styles.scoreTrack}>
                        <View style={[styles.scoreFill, { width: `${percent}%` }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.disclaimer}>{result.disclaimer}</Text>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  setStep("events");
                  setError(null);
                }}
                disabled={applying}
              >
                <Text style={styles.secondaryBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.actionPrimary, applying && styles.btnDisabled]}
                onPress={handleApply}
                disabled={applying || !selectedTime}
              >
                {applying ? <ActivityIndicator color={C.surface} /> : <Text style={styles.primaryBtnText}>Apply {selectedTime}</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}

        {birthProfileId && step === "applied" && applied && (
          <View style={styles.appliedPanel}>
            <Text style={styles.resultKicker}>Birth time updated</Text>
            <Text style={styles.resultTime}>{applied.newBirthTimeLocal}</Text>
            <Text style={[styles.resultNote, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
              The profile now uses the rectified estimate. Lagna-dependent readings can still vary by nearby windows.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                if (chartId) {
                  router.replace({ pathname: "/jadhagam/[id]", params: { id: chartId } });
                } else {
                  router.back();
                }
              }}
            >
              <Text style={styles.primaryBtnText}>{chartId ? "Back to Jadhagam" : "Done"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  back: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary, width: 34 },
  headerTitle: { color: C.textPrimary, flex: 1, textAlign: "center" },
  scroll: { padding: S.base, gap: S.base, paddingBottom: S.xxl },
  stepRow: { flexDirection: "row", gap: S.sm },
  stepPill: {
    flex: 1,
    borderRadius: RADIUS.chip,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.surface,
    paddingVertical: S.xs,
    alignItems: "center",
  },
  stepPillActive: { backgroundColor: C.saffron, borderColor: C.saffron },
  stepPillText: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.textSecond },
  stepPillTextActive: { color: C.surface },
  heroPanel: {
    backgroundColor: "#1A2540",
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.sm,
  },
  heroKicker: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.amber, textTransform: "uppercase" },
  heroTitle: { color: C.surface },
  heroBody: { color: "rgba(255,255,255,0.78)" },
  contextRow: { flexDirection: "row", gap: S.sm, marginTop: S.xs },
  contextItem: {
    flex: 1,
    borderRadius: RADIUS.button,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: S.sm,
  },
  contextLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: "rgba(255,255,255,0.55)" },
  contextValue: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.surface, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 16, color: C.textPrimary },
  sectionMeta: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textTertiary },
  eventList: { backgroundColor: C.surface, borderRadius: RADIUS.card, overflow: "hidden" },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    padding: S.base,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  eventCopy: { flex: 1, gap: 2 },
  eventTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.textPrimary },
  eventHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecond },
  eventHouse: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: C.saffron, marginTop: 2 },
  yearInput: {
    width: 72,
    height: 44,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.surfaceAlt,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: C.textPrimary,
  },
  primaryBtn: {
    minHeight: 50,
    borderRadius: RADIUS.button,
    backgroundColor: C.saffron,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: S.base,
  },
  primaryBtnText: { fontFamily: "Inter_800ExtraBold", fontSize: 15, color: C.surface },
  btnDisabled: { opacity: 0.6 },
  errorText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.alert },
  resultSummary: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.gold,
    padding: S.base,
    alignItems: "center",
    gap: S.xs,
  },
  resultKicker: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.saffron, textTransform: "uppercase" },
  resultTime: { fontFamily: "Inter_800ExtraBold", fontSize: 42, lineHeight: 48, color: C.textPrimary },
  resultNote: { color: C.textSecond, textAlign: "center" },
  candidateList: { gap: S.sm },
  candidateRow: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.base,
    flexDirection: "row",
    gap: S.md,
  },
  candidateRowSelected: { borderColor: C.saffron, backgroundColor: "#FEF5EC" },
  candidateTimeBlock: { width: 82, gap: S.xs },
  candidateTime: { fontFamily: "Inter_800ExtraBold", fontSize: 24, color: C.textPrimary },
  candidateTimeSelected: { color: C.saffron },
  recommendedBadge: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: C.green,
  },
  candidateMain: { flex: 1, gap: S.xs },
  candidateLagna: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.textPrimary },
  candidateMatch: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecond },
  scoreTrack: { height: 6, borderRadius: 4, backgroundColor: C.divider, overflow: "hidden", marginTop: S.xs },
  scoreFill: { height: 6, borderRadius: 4, backgroundColor: C.saffron },
  disclaimer: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: C.textTertiary,
  },
  actionRow: { flexDirection: "row", gap: S.sm },
  secondaryBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontFamily: "Inter_800ExtraBold", fontSize: 15, color: C.textSecond },
  actionPrimary: { flex: 1.5 },
  appliedPanel: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.green,
    padding: S.xl,
    gap: S.md,
    alignItems: "center",
  },
  emptyWrap: { flex: 1, padding: S.xxl, alignItems: "center", justifyContent: "center", gap: S.md },
  emptyPanel: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.base,
    gap: S.sm,
  },
  emptyTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: C.textPrimary, textAlign: "center" },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, color: C.textSecond, textAlign: "center" },
});
