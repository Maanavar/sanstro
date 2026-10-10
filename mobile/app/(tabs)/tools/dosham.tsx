import React, { useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react-native";
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
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
import {
  WhyThisResultSheet,
  type WhySheetHandle,
} from "@/components/WhyThisResultSheet";
import { getDosham } from "@/api/tools";
import { getPrimaryChartId } from "@/lib/userPrefs";
import type { ChartDoshamInsight } from "@vinaadi/shared/types";
import { displayName, natalStrengthWord } from "@vinaadi/shared/yogaDisplay";
import {
  doshamBeforeAfterLine,
  doshamContextLines,
  doshamMeaning,
  doshamReferenceRows,
  doshamResidual,
  mitigatedStandingLabel,
} from "@vinaadi/shared/doshamReckoning";

/**
 * Three groups, not two (DD-17, 2026-10-06). A mitigated dosham used to read
 * as "none" and sit under "Checked and Absent"; a chart whose doshams were all
 * mitigated was told "No doshas detected". Nivarthi lowers a dosham, it does
 * not erase it — the mitigated group now says what remains.
 */
type Group = "active" | "mitigated" | "absent";

function groupOf(d: ChartDoshamInsight): Group {
  if (!d.isPresent) return "absent";
  return d.isCancelled ? "mitigated" : "active";
}

function doshamColor(d: ChartDoshamInsight, C: ColorTokens): string {
  if (!d.isPresent) return C.green;
  if (d.isCancelled) return doshamResidual(d) === "MODERATE" ? C.amber : C.green;
  if (d.strength === "STRONG") return C.alert;
  if (d.strength === "PARTIAL") return C.caution;
  return C.amber;
}

/**
 * The engine description is shown only where it says something the card does
 * not already. Most are a one-line version of `explanationWhat` (Pitru,
 * Badhaka, Putra Sarpa, Marana Karaka Sthana) or of "In your chart" (Rahu–
 * Ketu, Kala Sarpa), and the expanded card printed both, one under the other
 * (owner report, 2026-10-06). Kalathra's names this chart's 7th lord and
 * house, and Sevvai's adds what its effect depends on, so those two stay.
 */
const DESCRIPTION_ADDS = new Set(["KALATHRA_DOSHAM", "SEVVAI_DOSHAM"]);

function showDescription(d: ChartDoshamInsight, what: string | null | undefined, meaning: string): boolean {
  if (!what?.trim() && !meaning) return true;
  return !meaning && DESCRIPTION_ADDS.has(d.name.toUpperCase());
}

function doshamChip(d: ChartDoshamInsight, lang: "ta" | "en"): string {
  if (d.isCancelled) return mitigatedStandingLabel(d, lang);
  return natalStrengthWord(d.strength, lang);
}

const HOW_CHECKED_ITEMS = [
  { label: "Primary position", value: "Lagna (Ascendant) — where the dosham planet sits relative to the rising sign" },
  { label: "Moon sign check", value: "Chandran's house — Sevvai is counted from the Moon too; for Rahu–Ketu it can raise the grade, never create the dosham" },
  { label: "Venus position", value: "Sukran's rasi — Sevvai is also counted from Venus, the lightest of the three references" },
  { label: "Cancellation rules", value: "Protective factors (nivarthi) reduce a dosham's grade; they never erase it, so a mitigated dosham still shows what remains" },
  { label: "Method", value: "Thirukanitham — precision birth-time sunrise-adjusted chart" },
];

export default function DoshamScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const [chartId, setChartId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const whyRef = useRef<WhySheetHandle>(null);

  useEffect(() => {
    if (tier !== "guest") getPrimaryChartId().then(setChartId);
  }, [tier]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dosham", chartId],
    queryFn: () => getDosham(chartId!),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const flags: ChartDoshamInsight[] = data?.data ?? [];
  const docLang: "ta" | "en" = isTamil ? "ta" : "en";
  const detected = flags.filter((f) => groupOf(f) === "active");
  const mitigated = flags.filter((f) => groupOf(f) === "mitigated");
  const absent = flags.filter((f) => groupOf(f) === "absent");

  if (tier === "guest" || (!chartId && !isLoading)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header isTamil={isTamil} onWhyPress={null} />
        <GuestWall isTamil={isTamil} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header isTamil={isTamil} onWhyPress={() => whyRef.current?.open()} />
      <MethodologyStrip />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isLoading && <><SkeletonCard height={100} /><SkeletonCard height={100} /></>}
        {isError && <ErrorCard onRetry={refetch} />}

        {!isLoading && !isError && detected.length === 0 && mitigated.length === 0 && flags.length > 0 && (
          <View style={styles.clearCard}>
            <Text style={styles.clearIcon}>✓</Text>
            <Text style={[styles.clearTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {isTamil ? "கவலை இல்லை" : "No doshas detected"}
            </Text>
            <Text style={[styles.clearDesc, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil
                ? "திருக்கணித முறையில் இந்த ஜாதகத்தில் தோஷங்கள் இல்லை."
                : "No doshas were found in this chart under Thirukanitham rules."}
            </Text>
          </View>
        )}

        {detected.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "கண்டறியப்பட்ட தோஷங்கள்" : "Detected Doshas"}
            </Text>
            {detected.map((f) => renderCard(f))}
          </>
        )}

        {mitigated.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "நிவர்த்தியுடன் உள்ள தோஷங்கள் — மீதத் தாக்கம் உண்டு" : "Mitigated — a residual remains"}
            </Text>
            {mitigated.map((f) => renderCard(f))}
          </>
        )}

        {absent.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "சரிபார்க்கப்பட்டவை — இல்லை" : "Checked and Absent"}
            </Text>
            <View style={styles.absentGrid}>
              {absent.map((f) => (
                <View key={f.name} style={styles.absentChip}>
                  <View style={[styles.absentDot, { backgroundColor: C.green }]} />
                  <Text style={[styles.absentName, { fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular" }]}>
                    {displayName(f.name, docLang)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <WhyThisResultSheet ref={whyRef} items={HOW_CHECKED_ITEMS} />
    </SafeAreaView>
  );

  function renderCard(f: ChartDoshamInsight) {
    const isExpanded = expanded === f.name;
    const color = doshamColor(f, C);
    const what = isTamil ? f.explanationWhatTa : f.explanationWhatEn;
    const rows = doshamReferenceRows(f, docLang);
    const beforeAfter = doshamBeforeAfterLine(f, docLang);
    const context = doshamContextLines(f, docLang);
    const meaning = doshamMeaning(f, docLang);
    const bodyType = isTamil ? TamilType.body : EnType.body;
    const captionType = isTamil ? TamilType.caption : EnType.caption;
    return (
      <TouchableOpacity
        key={f.name}
        // A full hairline border in the dosham's tone, not an accent
        // left border (owner ruling: no accent left-border on cards).
        style={[styles.card, { borderWidth: 1, borderColor: color + "55" }]}
        onPress={() => setExpanded(isExpanded ? null : f.name)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.cardRow}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.doshaName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
              {displayName(f.name, docLang)}
            </Text>
            <View style={[styles.severityBadge, { backgroundColor: color + "22" }]}>
              <Text style={[styles.severityText, { color }]}>
                {doshamChip(f, docLang)}
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
        </View>

        {isExpanded && (
          <View style={styles.expandedBody}>
            {showDescription(f, what, meaning) ? (
              <Text style={[styles.description, bodyType]}>
                {isTamil ? f.descriptionTa : f.descriptionEn}
              </Text>
            ) : null}
            {what ? (
              <Text style={[styles.description, bodyType]}>
                {what}
              </Text>
            ) : null}
            {rows.length > 0 && (
              <View style={styles.reckonBlock}>
                <Text style={[styles.reckonLabel, captionType]}>
                  {isTamil ? "எங்கிருந்து கணக்கிடப்பட்டது" : "Counted from"}
                </Text>
                {rows.map((row) => (
                  <Text key={row.reference} style={[styles.description, captionType]}>
                    {row.counts ? "● " : "○ "}
                    <Text style={{ fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_600SemiBold" }}>{row.reference}</Text>
                    {`  ${row.detail}`}
                  </Text>
                ))}
              </View>
            )}
            {beforeAfter ? (
              <View style={styles.reckonBlock}>
                <Text style={[styles.reckonLabel, captionType]}>{isTamil ? "மீதமுள்ளது" : "What remains"}</Text>
                <Text style={[styles.description, bodyType]}>{beforeAfter}</Text>
              </View>
            ) : null}
            {context.length > 0 && (
              <View style={styles.reckonBlock}>
                <Text style={[styles.reckonLabel, captionType]}>{isTamil ? "சூழல்" : "Context"}</Text>
                {context.map((line) => (
                  <Text key={line} style={[styles.description, captionType]}>{`• ${line}`}</Text>
                ))}
              </View>
            )}
            {meaning ? (
              <View style={styles.reckonBlock}>
                <Text style={[styles.reckonLabel, captionType]}>{isTamil ? "உங்கள் ஜாதகத்தில்" : "In your chart"}</Text>
                <Text style={[styles.description, bodyType]}>{meaning}</Text>
              </View>
            ) : null}
            <View style={styles.pariharamBox}>
              <Text style={[styles.pariharamLabel, isTamil ? TamilType.caption : EnType.caption]}>
                {isTamil ? "பரிகாரம்" : "Remedy overview"}
              </Text>
              <Text style={[styles.pariharamText, isTamil ? TamilType.body : EnType.body]}>
                {isTamil
                  ? "இந்த ஜாதகத்திற்கான பரிகாரங்கள் தனி பக்கத்தில் முன்னுரிமை வரிசையில் தரப்படுகின்றன."
                  : "Remedies for this chart are listed in priority order on the Pariharam page."}
              </Text>
              <TouchableOpacity
                style={styles.pariharamCta}
                onPress={() => router.push('/(tabs)/tools/pariharam' as any)}
              >
                <Text style={styles.pariharamCtaText}>
                  {isTamil ? "முழு பரிகாரம் காண →" : "See full remedies →"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }
}

function Header({ isTamil, onWhyPress }: { isTamil: boolean; onWhyPress: (() => void) | null }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
        {isTamil ? "தோஷ ஆய்வு" : "Dosha Check"}
      </Text>
      {onWhyPress ? (
        <TouchableOpacity onPress={onWhyPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.whyBtn}>{isTamil ? "எப்படி?" : "How?"}</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
  );
}

function GuestWall({ isTamil }: { isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.guestWrap}>
      <Lock size={48} color={C.textTertiary} strokeWidth={1} />
      <Text style={[styles.guestTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
        {isTamil ? "உள்நுழைவு தேவை" : "Login required"}
      </Text>
      <Text style={[styles.guestDesc, isTamil ? TamilType.caption : EnType.caption]}>
        {isTamil ? "தோஷ ஆய்வுக்கு ஜாதகம் தேவை." : "Create a birth chart to check doshas."}
      </Text>
      <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.loginBtnText}>{isTamil ? "உள்நுழைக" : "Sign In"}</Text>
      </TouchableOpacity>
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
  whyBtn: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.goldMethod, width: 48, textAlign: "right" },
  scroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  sectionLabel: { color: C.textPrimary, marginTop: S.xs },

  clearCard: {
    backgroundColor: C.green + "11", borderRadius: RADIUS.card, padding: S.xl,
    alignItems: "center", gap: S.sm, borderWidth: 1, borderColor: C.green + "33",
  },
  clearIcon: { fontSize: 36, color: C.green },
  clearTitle: { fontSize: 18, color: C.green },
  clearDesc: { color: C.textSecond, textAlign: "center" },

  card: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  doshaName: { fontSize: 16, lineHeight: 22, color: C.textPrimary, marginBottom: 4 },
  severityBadge: { borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 2, alignSelf: "flex-start" },
  severityText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  chevron: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  expandedBody: { gap: S.sm, paddingLeft: S.md + S.xs },
  description: { color: C.textPrimary, lineHeight: 22 },
  reckonBlock: { gap: S.xs },
  reckonLabel: { color: C.textSecond, textTransform: "uppercase", letterSpacing: 0.6 },
  pariharamBox: {
    backgroundColor: C.goldMethodLight, borderRadius: RADIUS.card, padding: S.md, gap: S.sm,
    borderWidth: 1, borderColor: C.amber + "55",
  },
  pariharamLabel: { color: C.caution },
  pariharamText: { color: C.textPrimary, lineHeight: 22 },
  pariharamCta: { alignSelf: "flex-start", marginTop: S.xs },
  pariharamCtaText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.saffron },

  absentGrid: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  absentChip: {
    flexDirection: "row", alignItems: "center", gap: S.xs,
    backgroundColor: C.surface, borderRadius: RADIUS.chip,
    paddingHorizontal: S.md, paddingVertical: S.xs + 2,
    borderWidth: 1, borderColor: C.green + "44",
  },
  absentDot: { width: 6, height: 6, borderRadius: 3 },
  absentName: { fontSize: 13, color: C.textSecond },

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
