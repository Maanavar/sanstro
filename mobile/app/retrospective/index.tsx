import React, { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { biText } from "@/lib/i18n";
import { TIER_LIMITS } from "@vinaadi/shared";
import {
  createRetrospective,
  listRetrospectives,
  type RetrospectiveData,
} from "@/api/retrospective";

const EVENT_TYPES = [
  { key: "career",       en: "Career",       ta: "தொழில்" },
  { key: "health",       en: "Health",        ta: "உடல்நலம்" },
  { key: "relationship", en: "Relationship",  ta: "உறவு" },
  { key: "finance",      en: "Finance",       ta: "நிதி" },
  { key: "family",       en: "Family",        ta: "குடும்பம்" },
  { key: "travel",       en: "Travel",        ta: "பயணம்" },
  { key: "spiritual",    en: "Spiritual",     ta: "ஆன்மீகம்" },
  { key: "other",        en: "Other",         ta: "மற்றவை" },
] as const;

type EventTypeKey = typeof EVENT_TYPES[number]["key"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function RetrospectiveScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const type = isTamil ? TamilType : EnType;
  const qc = useQueryClient();

  const [chartId, setChartId] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState(todayIso());
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState<EventTypeKey>("career");
  const [result, setResult] = useState<RetrospectiveData | null>(null);

  React.useEffect(() => {
    getPrimaryChartId().then(setChartId);
  }, []);

  const history = useQuery({
    queryKey: ["retrospective", "list", chartId ?? ""],
    queryFn: () => listRetrospectives(chartId as string),
    enabled: !!chartId && TIER_LIMITS[tier].retrospectiveEnabled,
    staleTime: 1000 * 60 * 5,
  });

  const analyse = useMutation({
    mutationFn: () =>
      createRetrospective({
        chartId: chartId as string,
        eventDate,
        eventDescription: eventDescription.trim(),
        eventType,
      }),
    onSuccess: (res) => {
      setResult(res.data);
      void qc.invalidateQueries({ queryKey: ["retrospective", "list", chartId ?? ""] });
    },
  });

  const canAnalyse = !!chartId && !!eventDate && eventDescription.trim().length > 3;

  if (!TIER_LIMITS[tier].retrospectiveEnabled) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header isTamil={isTamil} />
        <View style={styles.gatePanel}>
          <Text style={[styles.gateTitle, type.heading]}>
            {isTamil ? "பிரீமியம் அம்சம்" : "Premium feature"}
          </Text>
          <Text style={[styles.gateBody, type.body]}>
            {isTamil
              ? "கடந்த நிகழ்வுகளை திருக்கணிதத்தில் பகுப்பாய்வு செய்ய பிரீமியம் திட்டம் தேவை."
              : "Analyse past events against your Thirukanitham chart to find dasha-transit patterns. Requires a premium plan."}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/premium")}>
            <Text style={styles.primaryBtnText}>{isTamil ? "பிரீமியம் பெறுங்கள்" : "Upgrade to premium"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{isTamil ? "திரும்பு" : "Go back"}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header isTamil={isTamil} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={history.isFetching} onRefresh={() => history.refetch()} tintColor={C.gold} />
        }
      >
        {/* Form */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, type.subheading]}>
            {isTamil ? "நிகழ்வை பகுப்பாய்வு செய்யுங்கள்" : "Analyse an event"}
          </Text>
          <Text style={[styles.fieldLabel, type.caption]}>
            {isTamil ? "நிகழ்வு தேதி" : "Event date"}
          </Text>
          <TextInput
            style={styles.input}
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.textTertiary}
            maxLength={10}
          />
          <Text style={[styles.fieldLabel, type.caption]}>
            {isTamil ? "நிகழ்வு வகை" : "Event type"}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {EVENT_TYPES.map((et) => (
              <TouchableOpacity
                key={et.key}
                style={[styles.chip, eventType === et.key && styles.chipActive]}
                onPress={() => setEventType(et.key)}
              >
                <Text style={[styles.chipText, eventType === et.key && styles.chipTextActive]}>
                  {isTamil ? et.ta : et.en}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[styles.fieldLabel, type.caption]}>
            {isTamil ? "என்ன நடந்தது?" : "What happened?"}
          </Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={eventDescription}
            onChangeText={setEventDescription}
            placeholder={isTamil ? "சுருக்கமாக விவரிக்கவும்…" : "Briefly describe the event…"}
            placeholderTextColor={C.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          {analyse.isError && (
            <Text style={styles.errorText}>
              {isTamil ? "பகுப்பாய்வு தோல்வி. மீண்டும் முயலுங்கள்." : "Analysis failed. Please try again."}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.primaryBtn, !canAnalyse && styles.primaryBtnDisabled]}
            onPress={() => analyse.mutate()}
            disabled={!canAnalyse || analyse.isPending}
          >
            <Text style={styles.primaryBtnText}>
              {analyse.isPending
                ? (isTamil ? "பகுப்பாய்கிறது…" : "Analysing…")
                : (isTamil ? "பகுப்பாய்வு" : "Analyse")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Latest result */}
        {result && <ResultCard data={result} isTamil={isTamil} C={C} styles={styles} type={type} />}

        {/* History */}
        {history.isLoading ? (
          <SkeletonCard height={80} />
        ) : history.isError ? (
          <ErrorCard message={isTamil ? "வரலாறு ஏற்றல் தோல்வி." : "Could not load history."} onRetry={history.refetch} />
        ) : (history.data?.data.items?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, type.subheading]}>
              {isTamil ? "முந்தைய பகுப்பாய்வுகள்" : "Previous analyses"}
            </Text>
            {history.data!.data.items.map((item) => (
              <HistoryRow key={item.retrospectiveId} item={item} isTamil={isTamil} C={C} styles={styles} type={type} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ isTamil }: { isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backIcon} accessibilityRole="button">
        <Text style={styles.backArrow}>{"←"}</Text>
      </TouchableOpacity>
      <View>
        <Text style={styles.headerTitle}>{isTamil ? "பின்னோக்கு" : "Retrospective"}</Text>
        <Text style={styles.headerSub}>{isTamil ? "கடந்த நிகழ்வு பகுப்பாய்வு" : "Past event analysis"}</Text>
      </View>
    </View>
  );
}

function ResultCard({
  data,
  isTamil,
  C,
  styles,
  type,
}: {
  data: RetrospectiveData;
  isTamil: boolean;
  C: ColorTokens;
  styles: ReturnType<typeof makeStyles>;
  type: typeof TamilType | typeof EnType;
}) {
  return (
    <View style={styles.resultCard}>
      <Text style={[styles.cardTitle, type.subheading]}>
        {isTamil ? "பகுப்பாய்வு முடிவு" : "Analysis result"}
      </Text>
      <View style={styles.dashaRow}>
        <Text style={[styles.dashaLabel, type.caption]}>{isTamil ? "செயலில் தசை" : "Active dasha"}</Text>
        <Text style={[styles.dashaValue, type.body]}>{data.activeDasha}</Text>
      </View>
      <Text style={[styles.narrative, type.body]}>
        {biText(data.correlationExplanation, isTamil)}
      </Text>
      {data.futureRecurrences.length > 0 && (
        <View style={styles.recurrenceSection}>
          <Text style={[styles.subLabel, type.caption]}>
            {isTamil ? "எதிர்கால மறுநிகழ்வுகள்" : "Future recurrences"}
          </Text>
          {data.futureRecurrences.slice(0, 3).map((r, i) => (
            <View key={i} style={styles.recurrenceRow}>
              <Text style={[styles.recurrenceDate, type.caption]}>{fmt(r.approximateDate)}</Text>
              <View style={[styles.intensityBadge, { backgroundColor: intensityBg(r.intensity, C) }]}>
                <Text style={[styles.intensityText]}>{r.intensity}</Text>
              </View>
              <Text style={[styles.recurrenceDesc, type.body]}>{r.signatureDescription}</Text>
            </View>
          ))}
        </View>
      )}
      {data.caution && (
        <View style={styles.cautionBox}>
          <Text style={[styles.cautionText, type.body]}>
            {biText(data.caution, isTamil)}
          </Text>
        </View>
      )}
    </View>
  );
}

function HistoryRow({
  item,
  isTamil,
  C,
  styles,
  type,
}: {
  item: RetrospectiveData;
  isTamil: boolean;
  C: ColorTokens;
  styles: ReturnType<typeof makeStyles>;
  type: typeof TamilType | typeof EnType;
}) {
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyMeta}>
        <Text style={[styles.historyDate, type.caption]}>{fmt(item.eventDate)}</Text>
        <Text style={[styles.historyType, type.caption]}>{item.eventType}</Text>
      </View>
      <Text numberOfLines={2} style={[styles.historyDesc, type.body]}>{item.eventDescription}</Text>
      <Text numberOfLines={2} style={[styles.historyCorr, type.body]}>
        {biText(item.correlationExplanation, isTamil)}
      </Text>
    </View>
  );
}

function intensityBg(intensity: string, C: ColorTokens): string {
  if (intensity === "stronger") return C.alert;
  if (intensity === "similar") return C.gold;
  return C.green;
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: S.sm,
      paddingHorizontal: S.lg,
      paddingVertical: S.md,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    backIcon: { padding: S.xs },
    backArrow: { fontSize: 20, color: C.textSecond },
    headerTitle: { fontSize: 17, fontWeight: "700", color: C.textPrimary },
    headerSub: { fontSize: 12, color: C.textTertiary, marginTop: 1 },
    content: { padding: S.lg, gap: S.md, paddingBottom: S.xl },
    card: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.lg,
      padding: S.md,
      gap: S.sm,
      borderWidth: 1,
      borderColor: C.divider,
    },
    cardTitle: { fontSize: 14, fontWeight: "700", color: C.textPrimary, marginBottom: S.xs },
    fieldLabel: { fontSize: 11, fontWeight: "600", color: C.textTertiary, letterSpacing: 0.5, textTransform: "uppercase" },
    input: {
      backgroundColor: C.parchment,
      borderRadius: RADIUS.md,
      borderWidth: 1.5,
      borderColor: C.divider,
      paddingHorizontal: S.sm,
      paddingVertical: S.xs,
      color: C.textPrimary,
      fontSize: 15,
    },
    textarea: { minHeight: 72, paddingTop: S.sm },
    chipRow: { gap: S.xs, paddingVertical: S.xs },
    chip: {
      paddingHorizontal: S.sm,
      paddingVertical: 5,
      borderRadius: RADIUS.chip,
      backgroundColor: C.parchment,
      borderWidth: 1,
      borderColor: C.divider,
    },
    chipActive: { backgroundColor: C.gold, borderColor: C.gold },
    chipText: { fontSize: 13, color: C.textSecond },
    chipTextActive: { color: C.parchment, fontWeight: "600" },
    primaryBtn: {
      backgroundColor: C.gold,
      borderRadius: RADIUS.chip,
      paddingVertical: S.sm,
      alignItems: "center",
      marginTop: S.xs,
    },
    primaryBtnDisabled: { opacity: 0.45 },
    primaryBtnText: { color: C.parchment, fontWeight: "700", fontSize: 15 },
    backBtn: { alignItems: "center", marginTop: S.xs },
    backBtnText: { color: C.textTertiary, fontSize: 14 },
    errorText: { color: C.alert, fontSize: 13 },
    resultCard: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.lg,
      padding: S.md,
      gap: S.sm,
      borderWidth: 1,
      borderColor: C.divider,
    },
    dashaRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
    dashaLabel: { fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.4 },
    dashaValue: { fontSize: 14, fontWeight: "700", color: C.gold },
    narrative: { fontSize: 14, color: C.textPrimary, lineHeight: 21 },
    recurrenceSection: { gap: S.xs, marginTop: S.xs },
    subLabel: { fontSize: 11, fontWeight: "600", color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
    recurrenceRow: { flexDirection: "row", alignItems: "flex-start", gap: S.xs, flexWrap: "wrap" },
    recurrenceDate: { fontSize: 12, color: C.textTertiary, minWidth: 70 },
    intensityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    intensityText: { fontSize: 10, fontWeight: "700", color: "#fff" },
    recurrenceDesc: { fontSize: 13, color: C.textSecond, flex: 1 },
    cautionBox: {
      backgroundColor: C.surfaceAlt ?? C.surface,
      borderRadius: RADIUS.md,
      padding: S.sm,
      borderLeftWidth: 3,
      borderLeftColor: C.gold,
    },
    cautionText: { fontSize: 13, color: C.textPrimary, lineHeight: 20 },
    gatePanel: {
      flex: 1,
      padding: S.lg,
      justifyContent: "center",
      gap: S.md,
    },
    gateTitle: { fontSize: 20, fontWeight: "700", color: C.textPrimary },
    gateBody: { fontSize: 15, color: C.textSecond, lineHeight: 22 },
    section: { gap: S.sm },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 },
    historyRow: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.md,
      padding: S.sm,
      gap: 4,
      borderWidth: 1,
      borderColor: C.divider,
    },
    historyMeta: { flexDirection: "row", gap: S.sm, alignItems: "center" },
    historyDate: { fontSize: 12, color: C.textTertiary },
    historyType: { fontSize: 11, color: C.gold, fontWeight: "600", textTransform: "uppercase" },
    historyDesc: { fontSize: 13, color: C.textPrimary },
    historyCorr: { fontSize: 12, color: C.textSecond, lineHeight: 18 },
  });
}
