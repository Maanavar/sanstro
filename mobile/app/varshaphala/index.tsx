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
import { rasiDisplayName, tPlanetLord, type Lang } from "@vinaadi/shared";
import {
  VARUDA_PALAN_COMPONENTS,
  VARUDA_PALAN_SHORT_NAME,
  VARUDA_PALAN_STATUS_LABEL,
  varudaPalanAreaLabel,
} from "@vinaadi/shared/constants";
import { getVarshaphala } from "@/api/varshaphala";
import { getPrimaryChartId } from "@/lib/userPrefs";
import type { VarshaphalaAreaOutlook } from "@/api/varshaphala";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE = [-3, -2, -1, 0, 1, 2, 3].map((n) => CURRENT_YEAR + n);

// The backend scores each area 20–90 (tajaka_service clamps to that range and
// words >= 70 as supportive, 50–69 as mixed). This used to test 7 and 4 and
// print "/10", so every area showed green and read "72/10".
function scoreColor(score: number, C: ColorTokens): string {
  if (score >= 70) return C.green;
  if (score >= 50) return C.amber;
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
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

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
        <Header lang={lang} />
        <View style={styles.guestWrap}>
          <Lock size={48} color={C.textTertiary} strokeWidth={1} />
          <Text style={[styles.guestTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
            {isTamil ? "உள்நுழைவு தேவை" : "Login required"}
          </Text>
          <Text style={[styles.guestDesc, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "வருடப்பலன் காண ஜாதகம் தேவை."
              : "Create a birth chart to view your annual chart."}
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
      <Header lang={lang} />

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
        {/* What this feature does and does not compute — on the paid screen
            itself (owner ruling 2026-10-21). Same shared table as web. */}
        <View style={styles.summaryCard} testID="varuda-palan-disclosure">
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "இந்த ஆண்டு ஜாதகத்தில் என்ன உள்ளது" : "What this annual chart includes"}
          </Text>
          {VARUDA_PALAN_COMPONENTS.map((row) => (
            <Text key={row.key} style={[styles.disclosureRow, isTamil ? TamilType.caption : EnType.caption]}>
              <Text style={styles.disclosureLabel}>{row.label[lang]}: </Text>
              {VARUDA_PALAN_STATUS_LABEL[row.status][lang]}
              {row.note ? ` — ${row.note[lang]}` : ""}
            </Text>
          ))}
        </View>

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
                {`${year} ${VARUDA_PALAN_SHORT_NAME[lang]}`}
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, isTamil ? TamilType.caption : EnType.caption]}>
                    {isTamil ? "சூரியப் பிரவேச லக்னம்" : "Solar-return lagna"}
                  </Text>
                  <Text style={[styles.summaryValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {rasiDisplayName(v.solarReturnLagnaRasi, lang)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, isTamil ? TamilType.caption : EnType.caption]}>
                    {isTamil ? "முந்தா" : "Muntha"}
                  </Text>
                  <Text style={[styles.summaryValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {rasiDisplayName(v.munthaRasi, lang)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, isTamil ? TamilType.caption : EnType.caption]}>
                    {isTamil ? "ஆண்டு அதிபதி (தோராயம்)" : "Year lord (approximate)"}
                  </Text>
                  <Text style={[styles.summaryValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {tPlanetLord(v.yearLord, lang)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Area outlook */}
            <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "வாழ்க்கை துறை பலன்கள்" : "Area Outlook"}
            </Text>
            {v.areaOutlook.map((h: VarshaphalaAreaOutlook) => {
              const isOpen = expandedArea === h.area;
              return (
                <TouchableOpacity
                  key={h.area}
                  style={styles.bhavaRow}
                  onPress={() => setExpandedArea(isOpen ? null : h.area)}
                  activeOpacity={0.85}
                >
                  <View style={styles.bhavaHeader}>
                    <View style={[styles.scoreChip, { backgroundColor: scoreColor(h.score, C) + "22" }]}>
                      <Text style={[styles.scoreChipText, { color: scoreColor(h.score, C) }]}>{h.score}</Text>
                    </View>
                    <Text style={[styles.bhavaTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                      {varudaPalanAreaLabel(h.area, lang)}
                    </Text>
                    <Text style={styles.bhavaChevron}>{isOpen ? "▲" : "▼"}</Text>
                  </View>
                  {isOpen && (
                    <>
                      <Text style={[styles.bhavaSummary, isTamil ? TamilType.body : EnType.body]}>
                        {isTamil ? h.narrativeTa : h.narrativeEn}
                      </Text>
                      {/* Favourable months are hidden (FSA-17): they were a
                          constant per score band, not computed from the chart. */}
                    </>
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

function Header({ lang }: { lang: Lang }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, lang === "ta" ? TamilType.heading : EnType.heading]}>
        {VARUDA_PALAN_SHORT_NAME[lang]}
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

  bhavaRow: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  bhavaHeader: { flexDirection: "row", alignItems: "center", gap: S.sm },
  scoreChip: { borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 2 },
  scoreChipText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  bhavaTitle: { flex: 1, fontSize: 15, lineHeight: 22, color: C.textPrimary },
  bhavaChevron: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  bhavaSummary: { color: C.textPrimary, marginTop: S.md, lineHeight: 22 },
  disclosureRow: { color: C.textSecond },
  disclosureLabel: { color: C.textPrimary },

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
