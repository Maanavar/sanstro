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
  type WhyItem,
} from "@/components/WhyThisResultSheet";
import { getYogam } from "@/api/tools";
import { getPrimaryChartId } from "@/lib/userPrefs";
import type { ChartYogaInsight } from "@vinaadi/shared/types";
import { displayName, isAdverseYoga } from "@vinaadi/shared/yogaDisplay";

/**
 * Strength is not valence. `STRONG` on a Kemadruma means the isolation pattern is
 * unmitigated, so painting it `C.green` — as this did until 2026-09-11 — told the
 * reader their strongest finding was a good one. Adverse yogas take the amber/red
 * end regardless of strength; see `ADVERSE_YOGAS` in `@vinaadi/shared`.
 */
function strengthColor(s: ChartYogaInsight["strength"], C: ColorTokens, name?: string): string {
  if (name && isAdverseYoga(name)) {
    return s === "STRONG" ? C.alert : C.caution;
  }
  if (s === "STRONG") return C.green;
  if (s === "PARTIAL") return C.amber;
  return C.textTertiary;
}

function strengthLabel(s: ChartYogaInsight["strength"], isTamil: boolean): string {
  if (s === "STRONG") return isTamil ? "வலிமையான" : "Strong";
  if (s === "PARTIAL") return isTamil ? "நடுத்தர" : "Moderate";
  return isTamil ? "பலவீனமான" : "Weak";
}

/**
 * What to show on a yoga card. Prefers the engine's plain-language effect (what
 * the yoga is held to do) over description (how it forms) — the card is where a
 * reader decides whether the yoga matters to them, and several descriptions are
 * barely more than the name restated ("Sunapha Yoga."). Falls back to the
 * description if a code has no effect entry.
 */
function yogaMeaning(yoga: ChartYogaInsight, isTamil: boolean): string {
  const effect = isTamil ? yoga.effectTa : yoga.effectEn;
  if (effect?.trim()) return effect;
  return isTamil ? yoga.descriptionTa : yoga.descriptionEn;
}

function yogaHowCheckedItems(yoga: ChartYogaInsight): WhyItem[] {
  return [
    { label: "Yoga name", value: displayName(yoga.name, "en") },
    { label: "Strength", value: strengthLabel(yoga.strength, false) },
    // "What it means" before "Basis": a reader who does not know the term needs
    // the effect first. Basis (the mechanism) stays, one line below.
    ...(yoga.effectEn?.trim() ? [{ label: "What it means", value: yoga.effectEn }] : []),
    { label: "Basis", value: yoga.descriptionEn },
    {
      label: "Dasha activation",
      value: yoga.dashaActivated
        ? "A dasha lord tied to this yoga is currently running, so it is active now."
        : "No current dasha lord activates this yoga, so it is formed but dormant.",
    },
    // Only claim the yoga is a highlight when it is one. See ADVERSE_YOGAS.
    ...(isAdverseYoga(yoga.name)
      ? [{
          label: "Reading",
          value:
            "This is a demanding combination, not a favourable one. It names a pressure the chart " +
            "carries and what answers it — it is not a prediction of misfortune.",
        }]
      : []),
    { label: "Method", value: "Thirukanitham — verified from Lagna, planetary dignities, and house lords" },
  ];
}

export default function YogamScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const [chartId, setChartId] = useState<string | null>(null);
  const [selectedYoga, setSelectedYoga] = useState<ChartYogaInsight | null>(null);
  const whyRef = useRef<WhySheetHandle>(null);

  useEffect(() => {
    if (tier !== "guest") getPrimaryChartId().then(setChartId);
  }, [tier]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["yogam", chartId],
    queryFn: () => getYogam(chartId!),
    enabled: !!chartId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // The chart payload reports every yoga it checked, including the ones that did
  // not form — only the formed ones belong on this screen.
  const yogas: ChartYogaInsight[] = (data?.data ?? []).filter((y) => y.isPresent);
  // "Key Yogas" is a highlight rail — a gold rank medallion over the name. Until
  // 2026-09-11 it was `filter(STRONG)` with no valence test, so a chart whose only
  // strong yoga was Kemadruma opened this screen with "emotional isolation" at
  // rank 1, presented as the headline achievement. Adverse yogas still appear in
  // full below under "All Yogas" — they are excluded from the podium, not hidden.
  const top3 = yogas.filter((y) => y.strength === "STRONG" && !isAdverseYoga(y.name)).slice(0, 3);
  const rest = yogas.filter((y) => !top3.includes(y));

  function openHow(yoga: ChartYogaInsight) {
    setSelectedYoga(yoga);
    setTimeout(() => whyRef.current?.open(), 50);
  }

  if (tier === "guest" || (!chartId && !isLoading)) {
    return (
      <SafeAreaView style={styles.container}>
        <Header isTamil={isTamil} />
        <View style={styles.guestWrap}>
          <Lock size={48} color={C.textTertiary} strokeWidth={1} />
          <Text style={[styles.guestTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
            {isTamil ? "உள்நுழைவு தேவை" : "Login required"}
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
      <MethodologyStrip />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isLoading && <><SkeletonCard height={140} /><SkeletonCard height={100} /></>}
        {isError && <ErrorCard onRetry={refetch} />}

        {!isLoading && !isError && yogas.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? "குறிப்பிடத்தக்க யோகங்கள் இல்லை." : "No notable yogas found in this chart."}
            </Text>
          </View>
        )}

        {top3.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "முக்கிய யோகங்கள்" : "Key Yogas"}
            </Text>
            <View style={styles.heroRow}>
              {top3.map((y, i) => (
                <View key={i} style={styles.heroCard}>
                  <View style={[styles.heroRank, { backgroundColor: C.gold + "22" }]}>
                    <Text style={styles.heroRankText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.heroName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]} numberOfLines={2}>
                    {displayName(y.name, isTamil ? "ta" : "en")}
                  </Text>
                  <View style={[styles.strengthBadge, { backgroundColor: strengthColor(y.strength, C, y.name) + "22" }]}>
                    <Text style={[styles.strengthBadgeText, { color: strengthColor(y.strength, C, y.name) }]}>
                      {strengthLabel(y.strength, isTamil)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {rest.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "அனைத்து யோகங்கள்" : "All Yogas"}
            </Text>
            {yogas.map((y, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.yogaName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {displayName(y.name, isTamil ? "ta" : "en")}
                  </Text>
                  <View style={styles.cardBadges}>
                    <View style={[styles.strengthBadge, { backgroundColor: strengthColor(y.strength, C, y.name) + "22" }]}>
                      <Text style={[styles.strengthBadgeText, { color: strengthColor(y.strength, C, y.name) }]}>
                        {strengthLabel(y.strength, isTamil)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openHow(y)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.howLink}>{isTamil ? "எப்படி?" : "How?"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.description, isTamil ? TamilType.body : EnType.body]}>
                  {yogaMeaning(y, isTamil)}
                </Text>
              </View>
            ))}
          </>
        )}

        {top3.length > 0 && rest.length === 0 && (
          <View style={styles.allYogasSection}>
            <Text style={[styles.sectionLabel, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "அனைத்து யோகங்கள்" : "All Yogas"}
            </Text>
            {yogas.map((y, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.yogaName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {displayName(y.name, isTamil ? "ta" : "en")}
                  </Text>
                  <View style={styles.cardBadges}>
                    <View style={[styles.strengthBadge, { backgroundColor: strengthColor(y.strength, C, y.name) + "22" }]}>
                      <Text style={[styles.strengthBadgeText, { color: strengthColor(y.strength, C, y.name) }]}>
                        {strengthLabel(y.strength, isTamil)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => openHow(y)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.howLink}>{isTamil ? "எப்படி?" : "How?"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.description, isTamil ? TamilType.body : EnType.body]}>
                  {yogaMeaning(y, isTamil)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <WhyThisResultSheet
        ref={whyRef}
        title={selectedYoga ? `How: ${displayName(selectedYoga.name, "en")}` : "How was this checked?"}
        items={selectedYoga ? yogaHowCheckedItems(selectedYoga) : []}
      />
    </SafeAreaView>
  );
}

function Header({ isTamil }: { isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
        {isTamil ? "யோக ஆய்வு" : "Yoga Analysis"}
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
  scroll: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  sectionLabel: { color: C.textPrimary },

  heroRow: { flexDirection: "row", gap: S.sm },
  heroCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.md, gap: S.xs, alignItems: "center",
    borderTopWidth: 3, borderTopColor: C.gold,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  heroRank: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  heroRankText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.gold },
  heroName: { fontSize: 13, lineHeight: 18, color: C.textPrimary, textAlign: "center" },

  allYogasSection: { gap: S.md },
  card: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm,
    // A plain full border, not a coloured left-edge stripe. The accent
    // left-border is a standing owner ruling (2026-07-23) and it applies to all
    // surfaces, not just the web card it was first flagged on. Strength and
    // valence are carried by the badge, which is where a reader looks anyway.
    borderWidth: 1, borderColor: C.divider,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: S.sm },
  cardBadges: { gap: S.xs, alignItems: "flex-end" },
  yogaName: { flex: 1, fontSize: 16, lineHeight: 22, color: C.textPrimary },
  strengthBadge: { borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 3 },
  strengthBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  howLink: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.goldMethod },
  description: { color: C.textPrimary, lineHeight: 22 },

  emptyWrap: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: C.textTertiary, textAlign: "center" },
  guestWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: S.xxl, gap: S.md },
  guestTitle: { fontSize: 18, color: C.textPrimary, textAlign: "center" },
  loginBtn: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    paddingHorizontal: S.xl, paddingVertical: S.md, marginTop: S.sm,
  },
  loginBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: C.surface },
  });
}
