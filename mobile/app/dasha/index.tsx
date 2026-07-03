import React, { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react-native";
import {
  FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View,
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
import { getDashaTimeline, getCharaDasha, getYoginiDasha, getAshtottariDasha, getKalachakraDasha } from "@/api/dasha";
import { getPrimaryChartId } from "@/lib/userPrefs";
import type { DashaTimelineItem, CharaPeriod, YoginiDashaPeriod, AshtottariDashaPeriod, KalachakraDashaPeriod } from "@/api/dasha";

// Jaimini Chara Karakas (BPHS Ch. 32) — Atmakaraka can be any of these 8 grahas.
const KARAKA_PLANET_LABELS: Record<string, { en: string; ta: string }> = {
  SUN: { en: "Sun", ta: "சூரியன்" },
  MOON: { en: "Moon", ta: "சந்திரன்" },
  MARS: { en: "Mars", ta: "செவ்வாய்" },
  MERCURY: { en: "Mercury", ta: "புதன்" },
  JUPITER: { en: "Jupiter", ta: "குரு" },
  VENUS: { en: "Venus", ta: "சுக்ரன்" },
  SATURN: { en: "Saturn", ta: "சனி" },
  RAHU: { en: "Rahu", ta: "ராகு" },
};

// Yogini Dasha (Devi Bhagavata / Muhurta Chintamani tradition) — 8 Yoginis,
// fixed Mangala..Sankata order. See app/calculations/yogini_dasha.py.
const YOGINI_LABELS: Record<string, { en: string; ta: string }> = {
  MANGALA: { en: "Mangala", ta: "மங்களை" },
  PINGALA: { en: "Pingala", ta: "பிங்களை" },
  DHANYA: { en: "Dhanya", ta: "தன்யா" },
  BHRAMARI: { en: "Bhramari", ta: "பிராமரி" },
  BHADRIKA: { en: "Bhadrika", ta: "பத்ரிகை" },
  ULKA: { en: "Ulka", ta: "உல்கா" },
  SIDDHA: { en: "Siddha", ta: "சித்தா" },
  SANKATA: { en: "Sankata", ta: "சங்கடா" },
};

// Ashtottari Dasha (Krittikadi convention, no Ketu, 8 lords) — lords are the
// 8 classical planets, so this reuses KARAKA_PLANET_LABELS above rather than
// a separate name table. See app/calculations/ashtottari_dasha.py.

// Kalachakra Dasha (rasi-based, non-uniform period lengths) — experimental,
// display only. Lords are rasis; the API already returns a display name
// (rasiName) so no separate label table is needed, same as Jaimini Chara
// Dasha's rasi_name. See app/calculations/kalachakra_dasha.py for the cited
// Saravali source and its documented conventions/caveats.

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function yearsLabel(start: string, end: string, isTamil: boolean): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const yrs = (ms / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  return isTamil ? `${yrs} ஆண்டுகள்` : `${yrs} years`;
}

function percentElapsed(start: string, end: string): number {
  const total = new Date(end).getTime() - new Date(start).getTime();
  const elapsed = Date.now() - new Date(start).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function remainingLabel(end: string, isTamil: boolean): string {
  const ms = new Date(end).getTime() - Date.now();
  if (ms < 0) return isTamil ? "முடிந்தது" : "Ended";
  const yrs = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25));
  const months = Math.floor((ms % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30));
  if (yrs > 0) return isTamil ? `${yrs} ஆண்டு ${months} மாதம் மீதம்` : `${yrs}y ${months}m remaining`;
  return isTamil ? `${months} மாதம் மீதம்` : `${months}m remaining`;
}

export default function DashaScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const [chartId, setChartId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState<"vimshottari" | "jaimini" | "yogini" | "ashtottari" | "kalachakra">("vimshottari");

  useEffect(() => {
    if (tier !== "guest") getPrimaryChartId().then(setChartId);
  }, [tier]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["dasha-timeline", chartId],
    queryFn: () => getDashaTimeline(chartId!),
    enabled: !!chartId && tab === "vimshottari",
    staleTime: 1000 * 60 * 60 * 6,
  });

  const { data: charaData, isLoading: charaLoading, isError: charaError, refetch: charaRefetch } = useQuery({
    queryKey: ["chara-dasha", chartId],
    queryFn: () => getCharaDasha(chartId!),
    enabled: !!chartId && tab === "jaimini",
    staleTime: 1000 * 60 * 60 * 6,
  });

  const { data: yoginiData, isLoading: yoginiLoading, isError: yoginiError, refetch: yoginiRefetch } = useQuery({
    queryKey: ["yogini-dasha", chartId],
    queryFn: () => getYoginiDasha(chartId!),
    enabled: !!chartId && tab === "yogini",
    staleTime: 1000 * 60 * 60 * 6,
  });

  const { data: ashtottariData, isLoading: ashtottariLoading, isError: ashtottariError, refetch: ashtottariRefetch } = useQuery({
    queryKey: ["ashtottari-dasha", chartId],
    queryFn: () => getAshtottariDasha(chartId!),
    enabled: !!chartId && tab === "ashtottari",
    staleTime: 1000 * 60 * 60 * 6,
  });

  const { data: kalachakraData, isLoading: kalachakraLoading, isError: kalachakraError, refetch: kalachakraRefetch } = useQuery({
    queryKey: ["kalachakra-dasha", chartId],
    queryFn: () => getKalachakraDasha(chartId!),
    enabled: !!chartId && tab === "kalachakra",
    staleTime: 1000 * 60 * 60 * 6,
  });

  const d = data?.data;
  const cd = charaData?.data;
  const yd = yoginiData?.data;
  const ad = ashtottariData?.data;
  const kd = kalachakraData?.data;

  if (tier === "guest") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            {isTamil ? "தசா காலவரிசை" : "Dasha Timeline"}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.guestWrap}>
          <Lock size={48} color={C.textTertiary} strokeWidth={1} />
          <Text style={[styles.guestTitle, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
            {isTamil ? "உள்நுழைவு தேவை" : "Login required"}
          </Text>
          <Text style={[styles.guestDesc, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil
              ? "தசா காலவரிசை காண ஜாதகம் தேவை."
              : "Create a birth chart to see your Dasha timeline."}
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "தசா காலவரிசை" : "Dasha Timeline"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <MethodologyStrip />

      {/* Tab switcher: Vimshottari / Jaimini Chara */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "vimshottari" && styles.tabBtnActive]}
          onPress={() => setTab("vimshottari")}
        >
          <Text style={[styles.tabLabel, tab === "vimshottari" && styles.tabLabelActive, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "விம்சோத்தரி" : "Vimshottari"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "jaimini" && styles.tabBtnActive]}
          onPress={() => setTab("jaimini")}
        >
          <Text style={[styles.tabLabel, tab === "jaimini" && styles.tabLabelActive, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "ஜைமினி சர தசை" : "Jaimini Chara"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "yogini" && styles.tabBtnActive]}
          onPress={() => setTab("yogini")}
        >
          <Text style={[styles.tabLabel, tab === "yogini" && styles.tabLabelActive, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "யோகினி தசை" : "Yogini"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "ashtottari" && styles.tabBtnActive]}
          onPress={() => setTab("ashtottari")}
        >
          <Text style={[styles.tabLabel, tab === "ashtottari" && styles.tabLabelActive, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "அஷ்டோத்தரி" : "Ashtottari"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "kalachakra" && styles.tabBtnActive]}
          onPress={() => setTab("kalachakra")}
        >
          <Text style={[styles.tabLabel, tab === "kalachakra" && styles.tabLabelActive, isTamil ? TamilType.caption : EnType.caption]}>
            {isTamil ? "காலசக்ரா" : "Kalachakra"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Vimshottari tab ── */}
      {tab === "vimshottari" && (
        <>
          {isLoading && (
            <View style={{ padding: S.base, gap: S.md }}>
              <SkeletonCard height={140} />
              <SkeletonCard height={96} />
              <SkeletonCard height={96} />
            </View>
          )}
          {isError && (
            <View style={{ padding: S.base }}>
              <ErrorCard onRetry={refetch} />
            </View>
          )}
        </>
      )}

      {tab === "vimshottari" && isLoading === false && isError === false && d === undefined && null}

      {tab === "vimshottari" && d && (
        <FlatList
          data={d.timeline}
          keyExtractor={(item) => item.startDate}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.saffron} />}
          ListHeaderComponent={
            <>
              {/* Current dasha banner */}
              <View style={styles.banner}>
                <View style={styles.bannerMain}>
                  <Text style={styles.bannerLord}>{isTamil ? d.current.mahadasha.lord : d.current.mahadasha.lord}</Text>
                  <Text style={styles.bannerLabel}>{isTamil ? "மஹா தசை" : "Maha Dasha"}</Text>
                  <Text style={styles.bannerDates}>
                    {formatDate(d.current.mahadasha.startDate)} – {formatDate(d.current.mahadasha.endDate)}
                  </Text>
                  <Text style={styles.bannerRemaining}>{remainingLabel(d.current.mahadasha.endDate, isTamil)}</Text>
                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percentElapsed(d.current.mahadasha.startDate, d.current.mahadasha.endDate)}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>
                    {percentElapsed(d.current.mahadasha.startDate, d.current.mahadasha.endDate)}
                    {isTamil ? "% கடந்தது" : "% elapsed"}
                  </Text>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerSub}>
                  <Text style={styles.bannerSubLord}>{isTamil ? d.current.antardasha.lord : d.current.antardasha.lord}</Text>
                  <Text style={styles.bannerSubLabel}>{isTamil ? "அந்தர் தசை" : "Antar Dasha"}</Text>
                  <Text style={styles.bannerSubDates}>
                    {formatDate(d.current.antardasha.startDate)} – {formatDate(d.current.antardasha.endDate)}
                  </Text>
                </View>
              </View>




              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "ஜீவித தசை காலவரிசை" : "Lifetime Dasha Periods"}
              </Text>
            </>
          }
          renderItem={({ item }: { item: DashaTimelineItem }) => {
            const isActive = new Date(item.startDate) <= new Date() && new Date() <= new Date(item.endDate);
            const isExpanded = expanded === item.startDate;
            return (
              <TouchableOpacity
                style={[styles.periodCard, isActive && styles.periodCardActive]}
                onPress={() => setExpanded(isExpanded ? null : item.startDate)}
                activeOpacity={0.85}
              >
                <View style={styles.periodRow}>
                  <View style={[styles.periodDot, isActive && { backgroundColor: C.saffron }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.periodLord, {
                      fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
                      color: isActive ? C.saffron : C.textPrimary,
                    }]}>
                      {isTamil ? item.lord : item.lord}
                    </Text>
                    <Text style={[styles.periodDates, isTamil ? TamilType.caption : EnType.caption]}>
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={styles.periodDuration}>{yearsLabel(item.startDate, item.endDate, isTamil)}</Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{isTamil ? "தற்போது" : "Active"}</Text>
                      </View>
                    )}
                    <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.subList}>
                    {item.transitionNote && (
                      <Text style={[styles.subPrediction, isTamil ? TamilType.caption : EnType.caption]}>
                        {isTamil ? item.transitionNote.noteTa : item.transitionNote.noteEn}
                      </Text>
                    )}
                    {item.interpretation && (
                      <Text style={[styles.subPrediction, isTamil ? TamilType.caption : EnType.caption]}>
                        {isTamil ? item.interpretation.naturalDomainTa : item.interpretation.naturalDomainEn}
                      </Text>
                    )}
                    {item.maturationStatus?.summary && (
                      <Text style={[styles.subPrediction, isTamil ? TamilType.caption : EnType.caption]}>
                        {String(item.maturationStatus.summary)}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── Jaimini Chara Dasha tab ── */}
      {tab === "jaimini" && charaLoading && (
        <View style={{ padding: S.base, gap: S.md }}>
          <SkeletonCard height={100} />
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
        </View>
      )}
      {tab === "jaimini" && charaError && (
        <View style={{ padding: S.base }}>
          <ErrorCard onRetry={charaRefetch} />
        </View>
      )}
      {tab === "jaimini" && cd && (
        <FlatList
          data={cd.periods}
          keyExtractor={(item: CharaPeriod) => String(item.rasi)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={charaLoading} onRefresh={charaRefetch} tintColor={C.saffron} />}
          ListHeaderComponent={
            <>
              {cd.atmakaraka && (
                <View style={styles.karakaCard}>
                  <View style={styles.karakaRow}>
                    <Text style={styles.karakaLabel}>{isTamil ? "ஆத்மகாரகன்" : "Atmakaraka"}</Text>
                    <Text style={styles.karakaValue}>
                      {isTamil
                        ? KARAKA_PLANET_LABELS[cd.atmakaraka]?.ta ?? cd.atmakaraka
                        : KARAKA_PLANET_LABELS[cd.atmakaraka]?.en ?? cd.atmakaraka}
                    </Text>
                  </View>
                  {cd.karakamsaRasiName && (
                    <View style={styles.karakaRow}>
                      <Text style={styles.karakaLabel}>{isTamil ? "காரகாம்சம்" : "Karakamsa"}</Text>
                      <Text style={styles.karakaValue}>{cd.karakamsaRasiName}</Text>
                    </View>
                  )}
                </View>
              )}
              {cd.currentPeriod && (
                <View style={styles.banner}>
                  <View style={styles.bannerMain}>
                    <Text style={styles.bannerLord}>{cd.currentPeriod.rasi_name}</Text>
                    <Text style={styles.bannerLabel}>
                      {isTamil ? "நடப்பு சர தசை" : "Current Chara Dasha"}
                    </Text>
                    <Text style={styles.bannerDates}>
                      {formatDate(cd.currentPeriod.start_date)} – {formatDate(cd.currentPeriod.end_date)}
                    </Text>
                    <Text style={styles.bannerRemaining}>
                      {remainingLabel(cd.currentPeriod.end_date, isTamil)}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, {
                          width: `${percentElapsed(cd.currentPeriod.start_date, cd.currentPeriod.end_date)}%` as any,
                        }]}
                      />
                    </View>
                  </View>
                </View>
              )}
            </>
          }
          renderItem={({ item }: { item: CharaPeriod }) => {
            const isActive = new Date(item.start_date) <= new Date() && new Date() <= new Date(item.end_date);
            return (
              <View style={[styles.periodCard, isActive && styles.periodCardActive]}>
                <View style={styles.periodRow}>
                  <View style={[styles.periodDot, isActive && { backgroundColor: C.saffron }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.periodLord, {
                      fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
                      color: isActive ? C.saffron : C.textPrimary,
                    }]}>
                      {item.rasi_name}
                    </Text>
                    <Text style={[styles.periodDates, isTamil ? TamilType.caption : EnType.caption]}>
                      {formatDate(item.start_date)} – {formatDate(item.end_date)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={styles.periodDuration}>
                      {isTamil ? `${item.years} ஆண்டுகள்` : `${item.years} years`}
                    </Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{isTamil ? "தற்போது" : "Active"}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── Yogini Dasha tab ── */}
      {tab === "yogini" && yoginiLoading && (
        <View style={{ padding: S.base, gap: S.md }}>
          <SkeletonCard height={100} />
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
        </View>
      )}
      {tab === "yogini" && yoginiError && (
        <View style={{ padding: S.base }}>
          <ErrorCard onRetry={yoginiRefetch} />
        </View>
      )}
      {tab === "yogini" && yd && (
        <FlatList
          data={yd.mahadashas}
          keyExtractor={(item: YoginiDashaPeriod) => item.startDate}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={yoginiLoading} onRefresh={yoginiRefetch} tintColor={C.saffron} />}
          ListHeaderComponent={
            <>
              <View style={styles.banner}>
                <View style={styles.bannerMain}>
                  <Text style={styles.bannerLord}>
                    {isTamil
                      ? YOGINI_LABELS[yd.current.mahadasha.yogini]?.ta ?? yd.current.mahadasha.yogini
                      : YOGINI_LABELS[yd.current.mahadasha.yogini]?.en ?? yd.current.mahadasha.yogini}
                  </Text>
                  <Text style={styles.bannerLabel}>{isTamil ? "யோகினி மஹா தசை" : "Yogini Maha Dasha"}</Text>
                  <Text style={styles.bannerDates}>
                    {formatDate(yd.current.mahadasha.startDate)} – {formatDate(yd.current.mahadasha.endDate)}
                  </Text>
                  <Text style={styles.bannerRemaining}>{remainingLabel(yd.current.mahadasha.endDate, isTamil)}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, {
                        width: `${percentElapsed(yd.current.mahadasha.startDate, yd.current.mahadasha.endDate)}%` as any,
                      }]}
                    />
                  </View>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerSub}>
                  <Text style={styles.bannerSubLord}>
                    {isTamil
                      ? YOGINI_LABELS[yd.current.antardasha.yogini]?.ta ?? yd.current.antardasha.yogini
                      : YOGINI_LABELS[yd.current.antardasha.yogini]?.en ?? yd.current.antardasha.yogini}
                  </Text>
                  <Text style={styles.bannerSubLabel}>{isTamil ? "அந்தர் தசை" : "Antar Dasha"}</Text>
                  <Text style={styles.bannerSubDates}>
                    {formatDate(yd.current.antardasha.startDate)} – {formatDate(yd.current.antardasha.endDate)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "36 ஆண்டு யோகினி தசை சுழற்சி" : "36-Year Yogini Dasha Cycle"}
              </Text>
            </>
          }
          renderItem={({ item }: { item: YoginiDashaPeriod }) => {
            const isActive = new Date(item.startDate) <= new Date() && new Date() <= new Date(item.endDate);
            const rulingLabel = KARAKA_PLANET_LABELS[item.rulingPlanet];
            return (
              <View style={[styles.periodCard, isActive && styles.periodCardActive]}>
                <View style={styles.periodRow}>
                  <View style={[styles.periodDot, isActive && { backgroundColor: C.saffron }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.periodLord, {
                      fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
                      color: isActive ? C.saffron : C.textPrimary,
                    }]}>
                      {isTamil ? YOGINI_LABELS[item.yogini]?.ta ?? item.yogini : YOGINI_LABELS[item.yogini]?.en ?? item.yogini}
                    </Text>
                    <Text style={[styles.periodDates, isTamil ? TamilType.caption : EnType.caption]}>
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                      {rulingLabel ? ` · ${isTamil ? rulingLabel.ta : rulingLabel.en}` : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={styles.periodDuration}>
                      {isTamil ? `${item.years} ஆண்டுகள்` : `${item.years} years`}
                    </Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{isTamil ? "தற்போது" : "Active"}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── Ashtottari Dasha tab ── */}
      {tab === "ashtottari" && ashtottariLoading && (
        <View style={{ padding: S.base, gap: S.md }}>
          <SkeletonCard height={100} />
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
        </View>
      )}
      {tab === "ashtottari" && ashtottariError && (
        <View style={{ padding: S.base }}>
          <ErrorCard onRetry={ashtottariRefetch} />
        </View>
      )}
      {tab === "ashtottari" && ad && (
        <FlatList
          data={ad.mahadashas}
          keyExtractor={(item: AshtottariDashaPeriod, index) => `${item.startDate}-${index}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={ashtottariLoading} onRefresh={ashtottariRefetch} tintColor={C.saffron} />}
          ListHeaderComponent={
            <>
              <View style={styles.banner}>
                <View style={styles.bannerMain}>
                  <Text style={styles.bannerLord}>
                    {KARAKA_PLANET_LABELS[ad.current.mahadasha.lord]
                      ? (isTamil ? KARAKA_PLANET_LABELS[ad.current.mahadasha.lord].ta : KARAKA_PLANET_LABELS[ad.current.mahadasha.lord].en)
                      : ad.current.mahadasha.lord}
                  </Text>
                  <Text style={styles.bannerLabel}>{isTamil ? "அஷ்டோத்தரி மஹா தசை" : "Ashtottari Maha Dasha"}</Text>
                  <Text style={styles.bannerDates}>
                    {formatDate(ad.current.mahadasha.startDate)} – {formatDate(ad.current.mahadasha.endDate)}
                  </Text>
                  <Text style={styles.bannerRemaining}>{remainingLabel(ad.current.mahadasha.endDate, isTamil)}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, {
                        width: `${percentElapsed(ad.current.mahadasha.startDate, ad.current.mahadasha.endDate)}%` as any,
                      }]}
                    />
                  </View>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerSub}>
                  <Text style={styles.bannerSubLord}>
                    {KARAKA_PLANET_LABELS[ad.current.antardasha.lord]
                      ? (isTamil ? KARAKA_PLANET_LABELS[ad.current.antardasha.lord].ta : KARAKA_PLANET_LABELS[ad.current.antardasha.lord].en)
                      : ad.current.antardasha.lord}
                  </Text>
                  <Text style={styles.bannerSubLabel}>{isTamil ? "அந்தர் தசை" : "Antar Dasha"}</Text>
                  <Text style={styles.bannerSubDates}>
                    {formatDate(ad.current.antardasha.startDate)} – {formatDate(ad.current.antardasha.endDate)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "108 ஆண்டு அஷ்டோத்தரி தசை சுழற்சி" : "108-Year Ashtottari Dasha Cycle"}
              </Text>
            </>
          }
          renderItem={({ item }: { item: AshtottariDashaPeriod }) => {
            const isActive = new Date(item.startDate) <= new Date() && new Date() <= new Date(item.endDate);
            const label = KARAKA_PLANET_LABELS[item.lord];
            return (
              <View style={[styles.periodCard, isActive && styles.periodCardActive]}>
                <View style={styles.periodRow}>
                  <View style={[styles.periodDot, isActive && { backgroundColor: C.saffron }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.periodLord, {
                      fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
                      color: isActive ? C.saffron : C.textPrimary,
                    }]}>
                      {label ? (isTamil ? label.ta : label.en) : item.lord}
                    </Text>
                    <Text style={[styles.periodDates, isTamil ? TamilType.caption : EnType.caption]}>
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={styles.periodDuration}>
                      {isTamil ? `${item.years} ஆண்டுகள்` : `${item.years} years`}
                    </Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{isTamil ? "தற்போது" : "Active"}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── Kalachakra Dasha tab (experimental, display only) ── */}
      {tab === "kalachakra" && kalachakraLoading && (
        <View style={{ padding: S.base, gap: S.md }}>
          <SkeletonCard height={100} />
          <SkeletonCard height={80} />
          <SkeletonCard height={80} />
        </View>
      )}
      {tab === "kalachakra" && kalachakraError && (
        <View style={{ padding: S.base }}>
          <ErrorCard onRetry={kalachakraRefetch} />
        </View>
      )}
      {tab === "kalachakra" && kd && (
        <FlatList
          data={kd.mahadashas}
          keyExtractor={(item: KalachakraDashaPeriod, index) => `${item.startDate}-${index}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={kalachakraLoading} onRefresh={kalachakraRefetch} tintColor={C.saffron} />}
          ListHeaderComponent={
            <>
              <Text style={[styles.subPrediction, isTamil ? TamilType.caption : EnType.caption, { marginBottom: S.sm }]}>
                {isTamil
                  ? "இரண்டாம்நிலை/ஒப்பீட்டு தசை — சோதனை நிலையில் உள்ளது, மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை"
                  : "Secondary/comparison dasha — experimental, display only, not used in any scoring path"}
              </Text>
              <View style={styles.banner}>
                <View style={styles.bannerMain}>
                  <Text style={styles.bannerLord}>{kd.current.mahadasha.rasiName ?? kd.current.mahadasha.rasiCode}</Text>
                  <Text style={styles.bannerLabel}>{isTamil ? "காலசக்ரா மஹா தசை" : "Kalachakra Maha Dasha"}</Text>
                  <Text style={styles.bannerDates}>
                    {formatDate(kd.current.mahadasha.startDate)} – {formatDate(kd.current.mahadasha.endDate)}
                  </Text>
                  <Text style={styles.bannerRemaining}>{remainingLabel(kd.current.mahadasha.endDate, isTamil)}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[styles.progressFill, {
                        width: `${percentElapsed(kd.current.mahadasha.startDate, kd.current.mahadasha.endDate)}%` as any,
                      }]}
                    />
                  </View>
                </View>
                <View style={styles.bannerDivider} />
                <View style={styles.bannerSub}>
                  <Text style={styles.bannerSubLord}>{kd.current.antardasha.rasiName ?? kd.current.antardasha.rasiCode}</Text>
                  <Text style={styles.bannerSubLabel}>{isTamil ? "அந்தர் தசை" : "Antar Dasha"}</Text>
                  <Text style={styles.bannerSubDates}>
                    {formatDate(kd.current.antardasha.startDate)} – {formatDate(kd.current.antardasha.endDate)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "காலசக்ரா தசை காலவரிசை" : "Kalachakra Dasha Timeline"}
              </Text>
            </>
          }
          renderItem={({ item }: { item: KalachakraDashaPeriod }) => {
            const isActive = new Date(item.startDate) <= new Date() && new Date() <= new Date(item.endDate);
            return (
              <View style={[styles.periodCard, isActive && styles.periodCardActive]}>
                <View style={styles.periodRow}>
                  <View style={[styles.periodDot, isActive && { backgroundColor: C.saffron }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.periodLord, {
                      fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold",
                      color: isActive ? C.saffron : C.textPrimary,
                    }]}>
                      {item.rasiName ?? item.rasiCode}
                    </Text>
                    <Text style={[styles.periodDates, isTamil ? TamilType.caption : EnType.caption]}>
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Text style={styles.periodDuration}>
                      {isTamil ? `${item.years} ஆண்டுகள்` : `${item.years} years`}
                    </Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{isTamil ? "தற்போது" : "Active"}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
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
  list: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  sectionTitle: { color: C.textPrimary, marginTop: S.sm },
  tabRow: {
    flexDirection: "row", gap: 0,
    borderBottomWidth: 1, borderBottomColor: C.divider,
    backgroundColor: C.surface,
  },
  tabBtn: {
    flex: 1, paddingVertical: S.md, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: C.saffron },
  tabLabel: { color: C.textTertiary },
  tabLabelActive: { color: C.saffron },

  karakaCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, marginBottom: S.md, gap: S.xs,
    borderWidth: 1, borderColor: C.divider,
  },
  karakaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  karakaLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  karakaValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.textPrimary },
  banner: {
    backgroundColor: C.darkBg, borderRadius: RADIUS.card,
    padding: S.base, flexDirection: "row", marginBottom: S.md,
  },
  bannerMain: { flex: 1, gap: S.xs },
  bannerLord: { fontFamily: "NotoSansTamil_700Bold", fontSize: 22, lineHeight: 30, color: C.gold },
  bannerLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.indigoText, opacity: 0.6 },
  bannerDates: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.indigoText, opacity: 0.45 },
  bannerRemaining: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.amber },
  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: C.indigoText + "26",
    marginTop: S.xs,
  },
  progressFill: {
    height: 4, borderRadius: 2, backgroundColor: C.gold,
  },
  progressLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.indigoText, opacity: 0.45 },
  bannerDivider: { width: 1, backgroundColor: C.indigoText + "26", marginHorizontal: S.md },
  bannerSub: { flex: 1, gap: S.xs, justifyContent: "center" },
  bannerSubLord: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.indigoText },
  bannerSubLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.indigoText, opacity: 0.6 },
  bannerSubDates: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.indigoText, opacity: 0.55 },

  birthTimeNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: S.sm,
    backgroundColor: C.amber + "22", borderRadius: RADIUS.card, padding: S.md,
    borderWidth: 1, borderColor: C.amber + "55", marginBottom: S.sm,
  },
  birthTimeNoticeText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textPrimary, lineHeight: 18 },
  birthTimeNoticeCta: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.saffron, marginTop: 4 },

  periodCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  periodCardActive: { borderWidth: 1.5, borderColor: C.saffron },
  periodRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  periodDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.divider },
  periodLord: { fontSize: 16, lineHeight: 22 },
  periodDates: { color: C.textTertiary, marginTop: 2 },
  periodDuration: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  activeBadge: {
    backgroundColor: C.goldMethodLight, borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm, paddingVertical: 2,
  },
  activeBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: C.saffron },
  expandChevron: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },

  subList: { marginTop: S.md, gap: S.sm, paddingLeft: S.md, borderLeftWidth: 2, borderLeftColor: C.divider },
  subRow: { gap: 2, paddingVertical: S.xs },
  subRowActive: {},
  subLord: { fontSize: 14, lineHeight: 20 },
  subDates: { color: C.textTertiary },
  subPrediction: { color: C.textSecond, marginTop: 4 },

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
