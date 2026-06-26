import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { ErrorCard } from "@/components/ErrorCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import {
  annualWrappedKeys,
  getAnnualWrapped,
  type AnnualWrappedData,
  type WrappedSlide,
} from "@/api/annualWrapped";
import { ShareCaptureView } from "@/components/share/ShareCaptureView";
import { loadQuickJournalEntries, type QuickJournalEntry } from "@/features/journal/journalStore";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { scoreTone } from "@/lib/score";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].filter((year) => year >= 2024);

const SLIDE_ICON: Record<string, string> = {
  OVERVIEW: "OV",
  DASHA_ERA: "DE",
  PEAK: "PK",
  STATS: "ST",
  REFLECTION: "RF",
  LIFE_AREA: "LA",
  CLOSING: "CL",
};

const AREA_LABELS: Record<string, string> = {
  career: "Career",
  money: "Money",
  health: "Health",
  relationship: "Relationship",
  family: "Family",
  spiritual: "Spiritual",
  education: "Education",
  home: "Home",
};

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateLabel(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function entryYear(entry: QuickJournalEntry) {
  return parseDate(entry.createdAt)?.getFullYear() ?? 0;
}

function labelForArea(area: string | null | undefined) {
  if (!area) return "-";
  return AREA_LABELS[area] ?? area.replace(/_/g, " ");
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = keyFn(item) || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function copy(slide: WrappedSlide, isTamil: boolean) {
  return {
    headline: isTamil ? slide.headline.ta : slide.headline.en,
    body: isTamil ? slide.body.ta : slide.body.en,
  };
}

export default function AnnualWrappedScreen() {
  const { lang } = useI18n();
  const { tier } = useSession();
  const isTamil = lang === "ta";
  const type = isTamil ? TamilType : EnType;
  const storyRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const cardWidth = Math.max(300, width - S.base * 2);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [chartId, setChartId] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [journalEntries, setJournalEntries] = useState<QuickJournalEntry[]>([]);

  const isAuthenticated = tier !== "guest";

  async function reloadJournal() {
    setJournalEntries(await loadQuickJournalEntries());
  }

  useEffect(() => {
    reloadJournal();
    if (isAuthenticated) {
      getPrimaryChartId().then(setChartId);
    } else {
      setChartId(null);
    }
  }, [isAuthenticated]);

  const wrapped = useQuery({
    queryKey: annualWrappedKeys.year(chartId ?? "", selectedYear),
    queryFn: () => getAnnualWrapped(chartId as string, selectedYear),
    enabled: isAuthenticated && !!chartId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const data = wrapped.data?.data;
  const entriesForYear = useMemo(
    () => journalEntries.filter((entry) => entryYear(entry) === selectedYear),
    [journalEntries, selectedYear]
  );
  const topJournalArea = useMemo(() => countBy(entriesForYear, (entry) => entry.area)[0] ?? null, [entriesForYear]);
  const uniqueJournalDays = useMemo(
    () => new Set(entriesForYear.map((entry) => parseDate(entry.createdAt)?.toISOString().slice(0, 10))).size,
    [entriesForYear]
  );

  function handleYear(year: number) {
    if (year === selectedYear) return;
    Haptics.selectionAsync();
    setSelectedYear(year);
    setSlideIndex(0);
    storyRef.current?.scrollTo({ x: 0, animated: false });
  }

  function handleStoryScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setSlideIndex(Math.max(0, Math.min((data?.slides.length ?? 1) - 1, next)));
  }

  function refresh() {
    reloadJournal();
    wrapped.refetch();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.back}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, type.heading]}>Annual Wrapped</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/insights" as Href)}>
          <Text style={styles.headerAction}>Insights</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearStrip}>
        {YEAR_OPTIONS.map((year) => (
          <TouchableOpacity
            key={year}
            style={[styles.yearChip, selectedYear === year && styles.yearChipActive]}
            onPress={() => handleYear(year)}
            activeOpacity={0.82}
          >
            <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>{year}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={wrapped.isFetching} onRefresh={refresh} tintColor={C.gold} />}
      >
        {!isAuthenticated || !chartId ? (
          <EmptyState
            title="Create your Wrapped"
            body="Annual Wrapped needs a saved birth chart. Your local journal rhythm still appears once you log moments."
            action="Go to Profile"
            onPress={() => router.push("/(tabs)/me" as Href)}
          />
        ) : wrapped.isLoading ? (
          <>
            <SkeletonCard height={230} />
            <SkeletonCard height={120} />
          </>
        ) : wrapped.isError ? (
          <ErrorCard
            message={`No Annual Wrapped data for ${selectedYear} yet.`}
            onRetry={wrapped.refetch}
          />
        ) : data ? (
          <>
            <Hero data={data} entriesForYear={entriesForYear.length} uniqueJournalDays={uniqueJournalDays} topJournalArea={topJournalArea} />
            <StoryRail
              refObj={storyRef}
              slides={data.slides}
              width={cardWidth}
              index={slideIndex}
              isTamil={isTamil}
              onScroll={handleStoryScroll}
            />
            <StatsSummary data={data} />
          </>
        ) : null}

        <SectionTitle title="Journal Echo" action="Log" onPress={() => router.push("/(tabs)/today" as Href)} />
        <JournalEcho entries={entriesForYear} topArea={topJournalArea} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Hero({
  data,
  entriesForYear,
  uniqueJournalDays,
  topJournalArea,
}: {
  data: AnnualWrappedData;
  entriesForYear: number;
  uniqueJournalDays: number;
  topJournalArea: [string, number] | null;
}) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroKicker}>Your year in Vinaadi</Text>
      <Text style={styles.heroYear}>{data.year}</Text>
      <Text style={styles.heroBody}>
        {data.totalDaysScored} scored days, {data.highDays} high days, and {data.dominantDashaLord} as the dominant dasha signal.
      </Text>
      <View style={styles.heroMetaRow}>
        <Text style={styles.heroMeta}>{entriesForYear} journal moments</Text>
        <Text style={styles.heroMeta}>{uniqueJournalDays} active days</Text>
        <Text style={styles.heroMeta}>{labelForArea(topJournalArea?.[0] ?? data.topLifeArea)}</Text>
      </View>
    </View>
  );
}

function StoryRail({
  refObj,
  slides,
  width,
  index,
  isTamil,
  onScroll,
}: {
  refObj: React.RefObject<ScrollView | null>;
  slides: WrappedSlide[];
  width: number;
  index: number;
  isTamil: boolean;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  if (!slides.length) {
    return (
      <View style={styles.mutedPanel}>
        <Text style={styles.mutedText}>Wrapped slides will appear here when score history is available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.storyBlock}>
      <ScrollView
        ref={refObj}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        onMomentumScrollEnd={onScroll}
        style={styles.storyRail}
      >
        {slides.map((slide, slideIdx) => (
          <SlideCard key={slide.slideId} slide={slide} width={width} index={slideIdx} total={slides.length} isTamil={isTamil} />
        ))}
      </ScrollView>
      <View style={styles.dotRow}>
        {slides.map((slide, dotIdx) => (
          <View key={slide.slideId} style={[styles.dot, dotIdx === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function SlideCard({
  slide,
  width,
  index,
  total,
  isTamil,
}: {
  slide: WrappedSlide;
  width: number;
  index: number;
  total: number;
  isTamil: boolean;
}) {
  const text = copy(slide, isTamil);
  const accent = slide.accentColor || C.saffron;
  const icon = SLIDE_ICON[slide.slideType] ?? "YR";

  return (
    <ShareCaptureView
      style={[styles.slideFrame, { width }]}
      fileName={`vinaadi-wrapped-${slide.slideType.toLowerCase()}-${index + 1}`}
      title="Vinaadi Annual Wrapped"
      message={text.headline}
    >
      <View style={[styles.slideCard, { borderColor: `${accent}55` }]}>
        <View style={[styles.slideAccent, { backgroundColor: accent }]} />
        <View style={styles.slideTopRow}>
          <View style={[styles.slideIcon, { backgroundColor: `${accent}22` }]}>
            <Text style={[styles.slideIconText, { color: accent }]}>{icon}</Text>
          </View>
          <Text style={styles.slideCounter}>{index + 1}/{total}</Text>
        </View>
        <Text style={[styles.slideHeadline, { color: accent }]}>{text.headline}</Text>
        <Text style={styles.slideBody}>{text.body}</Text>
        {slide.stat ? (
          <View style={[styles.slideStat, { backgroundColor: `${accent}1A`, borderColor: `${accent}44` }]}>
            <Text style={[styles.slideStatText, { color: accent }]}>{slide.stat}</Text>
          </View>
        ) : null}
      </View>
    </ShareCaptureView>
  );
}

function StatsSummary({ data }: { data: AnnualWrappedData }) {
  const stats = [
    { label: "Average", value: `${data.averageScore}/100`, color: scoreTone(data.averageScore) },
    { label: "Peak", value: `${data.peakScore}`, sub: dateLabel(data.peakDate), color: scoreTone(data.peakScore) },
    { label: "Caution", value: String(data.cautionDays), color: C.caution },
    { label: "Dasha", value: data.dominantDashaLord, color: C.saffron },
  ];

  return (
    <View style={styles.statsGrid}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.statCell}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={[styles.statValue, { color: stat.color }]} numberOfLines={1}>{stat.value}</Text>
          {stat.sub ? <Text style={styles.statSub}>{stat.sub}</Text> : null}
        </View>
      ))}
      <View style={styles.scoreBand}>
        <Text style={styles.scoreBandLabel}>Score range</Text>
        <Text style={styles.scoreBandText}>{data.valleyScore} low on {dateLabel(data.valleyDate)} - {data.peakScore} peak on {dateLabel(data.peakDate)}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onPress ? (
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function JournalEcho({ entries, topArea }: { entries: QuickJournalEntry[]; topArea: [string, number] | null }) {
  if (!entries.length) {
    return (
      <View style={styles.mutedPanel}>
        <Text style={styles.mutedText}>No journal moments for this year yet. Quick capture from Today will enrich this section.</Text>
      </View>
    );
  }

  return (
    <View style={styles.journalPanel}>
      <View style={styles.journalTop}>
        <Text style={styles.journalTopLabel}>Most logged area</Text>
        <Text style={styles.journalTopValue}>{labelForArea(topArea?.[0])} - {topArea?.[1] ?? 0}</Text>
      </View>
      {entries.slice(0, 4).map((entry) => (
        <View key={entry.id} style={styles.journalRow}>
          <Text style={styles.journalDate}>{dateLabel(entry.createdAt)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.journalMeta}>{labelForArea(entry.area)} - {entry.moment}</Text>
            <Text style={styles.journalText} numberOfLines={2}>{entry.note || "No note added"}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ title, body, action, onPress }: { title: string; body: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onPress}>
        <Text style={styles.primaryBtnText}>{action}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  back: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.textPrimary, width: 58 },
  headerTitle: { color: C.textPrimary },
  headerAction: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.saffron, width: 58, textAlign: "right" },
  yearStrip: {
    paddingHorizontal: S.base,
    paddingVertical: S.sm,
    gap: S.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  yearChip: {
    paddingHorizontal: S.base,
    paddingVertical: S.xs,
    borderRadius: RADIUS.chip,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.surface,
  },
  yearChipActive: { backgroundColor: C.saffron, borderColor: C.saffron },
  yearChipText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.textSecond },
  yearChipTextActive: { color: C.surface },
  content: { padding: S.base, gap: S.md, paddingBottom: S.xxl },
  hero: {
    minHeight: 210,
    borderRadius: RADIUS.card,
    backgroundColor: C.textPrimary,
    padding: S.lg,
    justifyContent: "flex-end",
    gap: S.xs,
  },
  heroKicker: { fontFamily: "Inter_700Bold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0, color: C.gold },
  heroYear: { fontFamily: "Inter_800ExtraBold", fontSize: 56, lineHeight: 62, color: C.surface },
  heroBody: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22, color: C.indigoText },
  heroMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: S.xs, marginTop: S.sm },
  heroMeta: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.surface, backgroundColor: `${C.surface}22`, borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 4 },
  storyBlock: { gap: S.sm },
  storyRail: { marginHorizontal: -S.base, paddingLeft: S.base },
  slideFrame: { paddingRight: S.base },
  slideCard: {
    minHeight: 220,
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    padding: S.lg,
    gap: S.sm,
    overflow: "hidden",
  },
  slideAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 4 },
  slideTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  slideIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  slideIconText: { fontFamily: "Inter_800ExtraBold", fontSize: 12 },
  slideCounter: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.textTertiary },
  slideHeadline: { fontFamily: "Inter_800ExtraBold", fontSize: 22, lineHeight: 28 },
  slideBody: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, color: C.textSecond },
  slideStat: { alignSelf: "flex-start", borderRadius: RADIUS.chip, borderWidth: 1, paddingHorizontal: S.md, paddingVertical: S.xs, marginTop: S.xs },
  slideStatText: { fontFamily: "Inter_800ExtraBold", fontSize: 13 },
  dotRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.divider },
  dotActive: { width: 18, backgroundColor: C.saffron },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  statCell: { flexGrow: 1, minWidth: "46%", backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md, gap: 2 },
  statLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.textTertiary },
  statValue: { fontFamily: "Inter_800ExtraBold", fontSize: 22, lineHeight: 28 },
  statSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecond },
  scoreBand: { width: "100%", backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md, gap: 2 },
  scoreBandLabel: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.textTertiary },
  scoreBandText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textPrimary },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: S.xs },
  sectionTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 16, color: C.textPrimary },
  sectionAction: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.saffron },
  journalPanel: { backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm },
  journalTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: S.xs },
  journalTopLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textTertiary },
  journalTopValue: { fontFamily: "Inter_800ExtraBold", fontSize: 13, color: C.textPrimary },
  journalRow: { flexDirection: "row", gap: S.sm, alignItems: "flex-start" },
  journalDate: { width: 58, fontFamily: "Inter_700Bold", fontSize: 11, color: C.textSecond },
  journalMeta: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textTertiary },
  journalText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 19, color: C.textPrimary, marginTop: 2 },
  mutedPanel: { backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base },
  mutedText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, color: C.textSecond },
  emptyPanel: { backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm },
  emptyTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 19, color: C.textPrimary },
  emptyBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, color: C.textSecond },
  primaryBtn: { alignSelf: "flex-start", backgroundColor: C.saffron, borderRadius: RADIUS.chip, paddingHorizontal: S.base, paddingVertical: S.sm },
  primaryBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.surface },
});





