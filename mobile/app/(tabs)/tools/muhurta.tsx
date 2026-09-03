import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useConfirm } from "@/context/ConfirmContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { BannerAdUnit } from "@/components/AdUnit";
import { getDecisionBrief, type DecisionPriority } from "@/api/decisions";
import { getMuhurta } from "@/api/tools";
import type { MuhurtaSlot } from "@vinaadi/shared/types";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { scoreFillColor } from "@/lib/score";

/**
 * Keys are sent verbatim as the `activity` query param and must resolve through
 * `app.services.muhurta_service.normalize_activity` — uppercased, then any
 * alias applied. Anything else returns 422.
 *
 * `baby_naming` shipped here from the start and never resolved: it uppercased
 * to `BABY_NAMING`, which no backend activity matched, so every tap failed. It
 * now aliases to the sourced `NAMING_CEREMONY` (Kalaprakasika Ch. III), and the
 * key is kept rather than renamed so installed builds keep working.
 *
 * `house`, `vehicle` and `business` had the same defect and are REMOVED rather
 * than aliased: routing them would mean guessing which backend activity was
 * meant, and no chapter we have extracted rules on a house or a vehicle.
 * Offering a chip that silently answers a different question is worse than not
 * offering it. `LAND_PURCHASE` below is the nearest genuinely-sourced option.
 */
const ACTIVITIES = [
  { key: "marriage", label: "Marriage" },
  { key: "baby_naming", label: "Baby Naming" },
  { key: "MILK_FEEDING", label: "First Milk" },
  { key: "ANNAPRASANA", label: "First Feeding" },
  { key: "EAR_BORING", label: "Ear Boring" },
  { key: "TONSURE", label: "Tonsure" },
  { key: "UPANAYANAM", label: "Upanayanam" },
  { key: "SEEMANTHAM", label: "Seemantham" },
  { key: "LYING_IN_CHAMBER", label: "Birth Chamber" },
  { key: "VIDYARAMBHAM", label: "First Letters" },
  { key: "EDUCATION_START", label: "Start Studies" },
  { key: "MANTRA_INITIATION", label: "Mantra Upadesam" },
  { key: "VEDA_STUDY", label: "Veda Study" },
  { key: "SNAANA", label: "Snaana" },
  { key: "NEW_CLOTHES", label: "New Clothes" },
  { key: "NEW_ORNAMENT", label: "New Jewel" },
  { key: "GOLD", label: "Gold" },
  { key: "GEMS", label: "Gems" },
  { key: "TREASURE_STORE", label: "Store Treasure" },
  { key: "LAND_POSSESSION", label: "Take Land Possession" },
  { key: "LAND_PURCHASE", label: "Buying Land" },
  { key: "CATTLE_PURCHASE", label: "Cattle" },
  { key: "HARVEST", label: "Harvest" },
  { key: "HARVEST_INGATHERING", label: "Bring in Harvest" },
  { key: "GRAIN", label: "Store Grain" },
  { key: "GRAIN_EXPENDITURE", label: "Use Grain Store" },
  { key: "AGRICULTURE_START", label: "Start Field Work" },
  { key: "TILLAGE", label: "Ploughing" },
  { key: "SOWING", label: "Sowing" },
  { key: "NEW_GRAIN_MEAL", label: "New Grain Meal" },
  { key: "travel", label: "Travel" },
];

/** The classical sources actually cited for this slot, deduplicated.
 *
 * Only primary-text-confirmed factors carry a `citation`, so this line never
 * appears for a day judged purely on the generic almanac layer — which is the
 * point: it must not imply a text ruled on a day no text was consulted for. */
function citationLine(slot: MuhurtaSlot): string | null {
  const seen = new Set<string>();
  for (const f of slot.factors ?? []) {
    if (!f.citation) continue;
    const parts = [f.citation.tradition, f.citation.chapter && `Ch. ${f.citation.chapter}`, f.citation.page && `p. ${f.citation.page}`];
    const label = parts.filter(Boolean).join(" ");
    if (label) seen.add(label);
  }
  return seen.size > 0 ? Array.from(seen).join(" · ") : null;
}

const LIFE_AREAS: { key: DecisionPriority; label: string; action: string }[] = [
  { key: "career", label: "Career", action: "make the career move" },
  { key: "relationship", label: "Relationship", action: "move the relationship forward" },
  { key: "money", label: "Money", action: "make the financial decision" },
  { key: "family", label: "Family", action: "settle the family matter" },
  { key: "education", label: "Education", action: "begin the learning plan" },
  { key: "spiritual", label: "Spiritual", action: "start the spiritual commitment" },
];

const HORIZONS = [
  { months: 3, label: "3 months" },
  { months: 6, label: "6 months" },
  { months: 12, label: "1 year" },
  { months: 24, label: "2 years" },
];

function addDays(date: Date, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function addMonths(date: Date, n: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}


export default function MuhurtaScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const confirm = useConfirm();
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const isGuest = tier === "guest";

  const [mode, setMode] = useState<"quick" | "decision">("quick");
  const [activity, setActivity] = useState<string>("marriage");
  const [decisionArea, setDecisionArea] = useState<DecisionPriority>("career");
  const [horizonMonths, setHorizonMonths] = useState(6);
  const [submittedMode, setSubmittedMode] = useState<"quick" | "decision" | null>(null);
  const [chartId, setChartId] = useState<string | null>(null);

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["55%", "92%"], []);

  useEffect(() => {
    if (!isGuest) getPrimaryChartId().then(setChartId);
  }, [isGuest]);

  const today = new Date();
  const dateFrom = addDays(today, 1);
  const dateTo = addDays(today, 30);
  const targetDate = addMonths(today, horizonMonths);
  const selectedArea = LIFE_AREAS.find((item) => item.key === decisionArea) ?? LIFE_AREAS[0];

  // Muhurta slots are chart-personalised (dasha + hora support), so they need a
  // real chart id — the old literal "public" was never a valid chart.
  const muhurta = useQuery({
    queryKey: ["muhurta", chartId, activity, dateFrom, dateTo],
    queryFn: () => getMuhurta({ chartId: chartId!, activity, dateFrom, dateTo }),
    enabled: submittedMode === "quick" && !!chartId,
    staleTime: 1000 * 60 * 60 * 12,
  });

  const decision = useQuery({
    queryKey: ["decision-brief", chartId, decisionArea, targetDate],
    queryFn: () => getDecisionBrief({
      chartId: chartId!,
      priority: decisionArea,
      targetDate,
      optionA: {
        label: `Act within ${HORIZONS.find((h) => h.months === horizonMonths)?.label ?? "this window"}`,
        description: `I want to ${selectedArea.action} within the selected horizon if timing supports it.`,
      },
      optionB: {
        label: "Wait for stronger timing",
        description: "I can delay and prepare until the astrology shows a cleaner support window.",
      },
    }),
    enabled: submittedMode === "decision" && !!chartId,
    staleTime: 1000 * 60 * 60 * 12,
  });

  function setModeWithHaptic(nextMode: "quick" | "decision") {
    Haptics.selectionAsync();
    setMode(nextMode);
    setSubmittedMode(null);
  }

  async function handleSearch() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!chartId || isGuest) {
      const ok = await confirm({
        title: "Chart required",
        body: mode === "decision"
          ? "Life Decision needs your birth chart so Vinaadi can compare dasha, transit, and timing support."
          : "Muhurta slots are scored against your birth chart's dasha and hora windows, so they need your chart.",
        confirmLabel: "Create account",
        cancelLabel: "Cancel",
      });
      if (ok) router.push("/(auth)/register");
      return;
    }
    setSubmittedMode(mode);
    sheetRef.current?.expand();
  }

  const slots = muhurta.data?.data?.slots ?? [];
  const brief = decision.data?.data;
  const isSearching = submittedMode === "quick" ? muhurta.isLoading : decision.isLoading;
  const isError = submittedMode === "quick" ? muhurta.isError : decision.isError;
  const retry = submittedMode === "quick" ? muhurta.refetch : decision.refetch;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>{"<-"}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>Auspicious Timing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.segmented}>
          <TouchableOpacity style={[styles.segment, mode === "quick" && styles.segmentActive]} onPress={() => setModeWithHaptic("quick")}>
            <Text style={[styles.segmentText, mode === "quick" && styles.segmentTextActive]}>Quick Muhurta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, mode === "decision" && styles.segmentActive]} onPress={() => setModeWithHaptic("decision")}>
            <Text style={[styles.segmentText, mode === "decision" && styles.segmentTextActive]}>Life Decision</Text>
          </TouchableOpacity>
        </View>

        {mode === "quick" ? (
          <>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>Select purpose</Text>
            <View style={styles.activityRow}>
              {ACTIVITIES.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.actChip, activity === item.key && styles.actChipSel]}
                  onPress={() => { Haptics.selectionAsync(); setActivity(item.key); }}
                >
                  <Text style={[styles.actChipText, activity === item.key && styles.actChipTextSel]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dateRow}>
              <View style={styles.datePill}>
                <Text style={styles.dateLabel}>From</Text>
                <Text style={styles.dateValue}>{dateFrom}</Text>
              </View>
              <Text style={styles.dateSep}>{"->"}</Text>
              <View style={styles.datePill}>
                <Text style={styles.dateLabel}>To</Text>
                <Text style={styles.dateValue}>{dateTo}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>Choose life area</Text>
            <View style={styles.activityRow}>
              {LIFE_AREAS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.actChip, decisionArea === item.key && styles.actChipSel]}
                  onPress={() => { Haptics.selectionAsync(); setDecisionArea(item.key); }}
                >
                  <Text style={[styles.actChipText, decisionArea === item.key && styles.actChipTextSel]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>Planning horizon</Text>
            <View style={styles.activityRow}>
              {HORIZONS.map((item) => (
                <TouchableOpacity
                  key={item.months}
                  style={[styles.actChip, horizonMonths === item.months && styles.actChipSel]}
                  onPress={() => { Haptics.selectionAsync(); setHorizonMonths(item.months); }}
                >
                  <Text style={[styles.actChipText, horizonMonths === item.months && styles.actChipTextSel]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.decisionPreview}>
              <Text style={styles.previewKicker}>Decision window</Text>
              <Text style={styles.previewTitle}>{selectedArea.label} by {targetDate}</Text>
              <Text style={styles.previewBody}>Vinaadi will compare acting in this window with waiting for stronger support.</Text>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.cta} onPress={handleSearch} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{mode === "quick" ? "Find Muhurta" : "Check Decision Timing"}</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetScroll}>
          <Text style={[styles.resultCount, isTamil ? TamilType.caption : EnType.caption]}>
            {isSearching
              ? "Searching..."
              : submittedMode === "decision"
                ? "Decision brief"
                : `${slots.length} auspicious times found`}
          </Text>

          {isSearching ? (
            <>
              <SkeletonCard height={96} />
              <SkeletonCard height={96} />
              <SkeletonCard height={96} />
            </>
          ) : isError ? (
            <ErrorCard onRetry={retry} />
          ) : submittedMode === "decision" && brief ? (
            <DecisionResult brief={brief} />
          ) : (
            slots.map((slot, i) => (
              <View key={`${slot.date}-${slot.timeStart}-${i}`} style={styles.slotCard}>
                <View style={styles.slotLeft}>
                  <Text style={styles.slotDate}>{slot.tamilDate ? (isTamil ? slot.tamilDate.ta : slot.tamilDate.en) : slot.date}</Text>
                  <Text style={styles.slotDateEn}>{slot.date}</Text>
                </View>
                <View style={styles.slotCenter}>
                  <Text style={styles.slotTime}>{formatSlotClock(slot.timeStart)} - {formatSlotClock(slot.timeEnd)}</Text>
                  <Text style={styles.slotSupport} numberOfLines={2}>{isTamil ? slot.panchangamSupport.ta : slot.panchangamSupport.en}</Text>
                  {/* The row is too tight for the full factor list the web picker
                      renders, but the provenance is the part worth the space: it
                      is what separates a cited rule from a scoring opinion. */}
                  {citationLine(slot) && (
                    <Text style={styles.slotCitation} numberOfLines={1}>{citationLine(slot)}</Text>
                  )}
                </View>
                {i === 0 && (
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>Best</Text>
                  </View>
                )}
              </View>
            ))
          )}

          <BannerAdUnit />
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}

function DecisionResult({ brief }: { brief: import("@/api/decisions").DecisionBriefData }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const recommendedA = brief.recommended === brief.optionA.label;
  return (
    <View style={styles.decisionResult}>
      <View style={styles.recommendPanel}>
        <Text style={styles.previewKicker}>Recommendation</Text>
        <Text style={styles.recommendTitle}>{brief.recommended}</Text>
        <Text style={styles.previewBody}>{brief.reasoning.en}</Text>
        {brief.caution && <Text style={styles.cautionText}>{brief.caution.en}</Text>}
      </View>
      <OptionCard option={brief.optionA} active={recommendedA} />
      <OptionCard option={brief.optionB} active={!recommendedA} />
    </View>
  );
}

function OptionCard({ option, active }: { option: import("@/api/decisions").OptionAnalysis; active: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const tone = scoreFillColor(option.score);
  return (
    <View style={[styles.optionCard, active && styles.optionCardActive]}>
      <View style={styles.optionTop}>
        <Text style={styles.optionTitle}>{option.label}</Text>
        <View style={[styles.scoreBadge, { backgroundColor: tone }]}>
          <Text style={styles.scoreBadgeText}>{option.score}</Text>
        </View>
      </View>
      {option.optimalWindow && <Text style={styles.optionWindow}>{option.optimalWindow}</Text>}
      {option.alignmentNotes.slice(0, 2).map((note) => (
        <Text key={note} style={styles.optionNote}>+ {note}</Text>
      ))}
      {option.riskFactors.slice(0, 2).map((risk) => (
        <Text key={risk} style={styles.optionRisk}>! {risk}</Text>
      ))}
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
  back: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.textSecond, width: 40 },
  headerTitle: { color: C.textPrimary },
  scroll: { padding: S.base, gap: S.md },
  segmented: { flexDirection: "row", backgroundColor: C.surfaceAlt, borderRadius: RADIUS.button, padding: 3, gap: 3 },
  segment: { flex: 1, borderRadius: RADIUS.input, alignItems: "center", paddingVertical: S.sm },
  segmentActive: { backgroundColor: C.surface },
  segmentText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textSecond },
  segmentTextActive: { color: C.saffron },
  sectionLabel: { color: C.textSecond },
  activityRow: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  actChip: {
    paddingHorizontal: S.md, paddingVertical: S.sm,
    borderRadius: RADIUS.chip, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.divider,
  },
  actChipSel: { backgroundColor: C.saffron, borderColor: C.saffron },
  actChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 20, color: C.textPrimary },
  actChipTextSel: { color: C.surface },
  dateRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  datePill: { flex: 1, backgroundColor: C.surfaceAlt, borderRadius: RADIUS.input, padding: S.md },
  dateLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
  dateValue: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.textPrimary },
  dateSep: { fontFamily: "Inter_400Regular", fontSize: 16, color: C.textTertiary },
  decisionPreview: { backgroundColor: C.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider, padding: S.md, gap: S.xs },
  previewKicker: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.saffron, textTransform: "uppercase", letterSpacing: 0 },
  previewTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 18, lineHeight: 24, color: C.textPrimary },
  previewBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, color: C.textSecond },
  cta: { backgroundColor: C.saffron, borderRadius: RADIUS.button, height: 52, alignItems: "center", justifyContent: "center" },
  ctaText: { fontFamily: "Inter_800ExtraBold", fontSize: 15, color: C.surface },
  sheetBg: { backgroundColor: C.parchment },
  sheetHandle: { backgroundColor: C.divider, width: 40 },
  sheetScroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  resultCount: { color: C.textTertiary },
  slotCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, flexDirection: "row", alignItems: "center",
    gap: S.sm, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  slotLeft: { width: 82 },
  slotDate: { fontFamily: "Inter_700Bold", fontSize: 15, lineHeight: 21, color: C.textPrimary },
  slotDateEn: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
  slotCenter: { flex: 1, gap: 4 },
  slotTime: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.textPrimary },
  slotSupport: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, color: C.textSecond },
  slotCitation: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15, color: C.textTertiary },
  bestBadge: { backgroundColor: C.gold, borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 3 },
  bestBadgeText: { fontFamily: "Inter_800ExtraBold", fontSize: 10, color: C.surface },
  decisionResult: { gap: S.md },
  recommendPanel: { backgroundColor: C.darkBg, borderRadius: RADIUS.card, padding: S.md, gap: S.xs },
  recommendTitle: { color: C.surface, fontFamily: "Inter_800ExtraBold", fontSize: 20, lineHeight: 26 },
  cautionText: { color: C.indigoText, opacity: 0.8, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: S.xs },
  optionCard: { backgroundColor: C.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider, padding: S.md, gap: S.xs },
  optionCardActive: { borderColor: C.gold, borderWidth: 2 },
  optionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: S.sm },
  optionTitle: { flex: 1, color: C.textPrimary, fontFamily: "Inter_800ExtraBold", fontSize: 16 },
  scoreBadge: { minWidth: 42, height: 28, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: S.sm },
  scoreBadgeText: { color: C.surface, fontFamily: "Inter_800ExtraBold", fontSize: 13 },
  optionWindow: { color: C.saffron, fontFamily: "Inter_700Bold", fontSize: 12 },
  optionNote: { color: C.textSecond, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  optionRisk: { color: C.caution, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  });
}

/** API slots are HH:MM. Render the reader-facing 12-hour clock, matching web. */
function formatSlotClock(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  const minute = match[2];
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return value;
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? "am" : "pm"}`;
}
