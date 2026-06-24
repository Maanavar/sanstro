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
import type { DoshamFlag } from "@/api/tools";

function severityColor(s: DoshamFlag["severity"], C: ColorTokens): string {
  if (s === "severe") return C.alert;
  if (s === "moderate") return C.caution;
  if (s === "mild") return C.amber;
  return C.green;
}

function severityLabel(s: DoshamFlag["severity"], isTamil: boolean): string {
  if (s === "severe") return isTamil ? "கடுமையானது" : "Severe";
  if (s === "moderate") return isTamil ? "மிதமானது" : "Moderate";
  if (s === "mild") return isTamil ? "சிறியது" : "Mild";
  return isTamil ? "இல்லை" : "None";
}

const HOW_CHECKED_ITEMS = [
  { label: "Primary position", value: "Lagna (Ascendant) — where the dosham planet sits relative to the rising sign" },
  { label: "Moon sign check", value: "Chandran's house and its aspects — required for Kuja and Sarpa dosham" },
  { label: "Venus position", value: "Sukran's rasi and house — mandatory for marriage-related dosham checks" },
  { label: "Cancellation rules", value: "If the dosham lord occupies specific houses or is conjoined with a benefic, the dosham is cancelled or reduced" },
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

  const flags: DoshamFlag[] = data?.data ?? [];
  const detected = flags.filter((f) => f.present);
  const absent = flags.filter((f) => !f.present);

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

        {!isLoading && !isError && detected.length === 0 && flags.length > 0 && (
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
            {detected.map((f) => {
              const isExpanded = expanded === f.name_en;
              return (
                <TouchableOpacity
                  key={f.name_en}
                  style={[styles.card, styles.cardDetected, { borderLeftColor: severityColor(f.severity, C) }]}
                  onPress={() => setExpanded(isExpanded ? null : f.name_en)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.statusDot, { backgroundColor: severityColor(f.severity, C) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.doshaName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                        {isTamil ? f.name_ta : f.name_en}
                      </Text>
                      <View style={[styles.severityBadge, { backgroundColor: severityColor(f.severity, C) + "22" }]}>
                        <Text style={[styles.severityText, { color: severityColor(f.severity, C) }]}>
                          {severityLabel(f.severity, isTamil)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.chevron}>{isExpanded ? "▲" : "▼"}</Text>
                  </View>

                  {isExpanded && (
                    <View style={styles.expandedBody}>
                      <Text style={[styles.description, isTamil ? TamilType.body : EnType.body]}>
                        {isTamil ? f.description_ta : f.description_en}
                      </Text>
                      {(f.pariharam_ta || f.pariharam_en) && (
                        <View style={styles.pariharamBox}>
                          <Text style={[styles.pariharamLabel, isTamil ? TamilType.caption : EnType.caption]}>
                            {isTamil ? "பரிகாரம்" : "Remedy overview"}
                          </Text>
                          <Text style={[styles.pariharamText, isTamil ? TamilType.body : EnType.body]}>
                            {isTamil ? f.pariharam_ta : f.pariharam_en}
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
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {absent.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "சரிபார்க்கப்பட்டவை — இல்லை" : "Checked and Absent"}
            </Text>
            <View style={styles.absentGrid}>
              {absent.map((f) => (
                <View key={f.name_en} style={styles.absentChip}>
                  <View style={[styles.absentDot, { backgroundColor: C.green }]} />
                  <Text style={[styles.absentName, { fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular" }]}>
                    {isTamil ? f.name_ta : f.name_en}
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
  cardDetected: { borderLeftWidth: 3 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  doshaName: { fontSize: 16, lineHeight: 22, color: C.textPrimary, marginBottom: 4 },
  severityBadge: { borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 2, alignSelf: "flex-start" },
  severityText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  chevron: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  expandedBody: { gap: S.sm, paddingLeft: S.md + S.xs },
  description: { color: C.textPrimary, lineHeight: 22 },
  pariharamBox: {
    backgroundColor: C.goldMethodLight, borderRadius: RADIUS.card, padding: S.md, gap: S.sm,
    borderLeftWidth: 2, borderLeftColor: C.amber,
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
