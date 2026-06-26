import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { ErrorCard } from "@/components/ErrorCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { AnimatedEmptyState } from "@/components/AnimatedEmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionLabel } from "@/components/SectionLabel";
import { getDashaTimeline, dashaKeys } from "@/api/dasha";
import { getLifeAreas, lifeAreasKeys } from "@/api/lifeAreas";
import { getLifeEvents, lifeEventsKeys } from "@/api/lifeEvents";
import { getUpcomingTransits, transitsKeys } from "@/api/transits";
import { loadGuestPrefs } from "@/features/guest/guestStore";
import { loadQuickJournalEntries, syncQuickJournalEntries, type QuickJournalEntry } from "@/features/journal/journalStore";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { entranceDelay, spring, staggerInterval, duration } from "@/theme/motion";
import { ShareCaptureView } from "@/components/share/ShareCaptureView";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { biText } from "@/lib/i18n";
import { scoreTone } from "@/lib/score";
import type { GuestPrefs } from "@/features/guest/guestStore";
import type { LifeAreaData } from "@/api/lifeAreas";
import type { LifeEventWindow } from "@/api/lifeEvents";

const LEARN_CARDS = [
  { slug: "what-is-thirukanitham", titleEn: "What is Thirukanitham?", titleTa: "திருக்கணிதம் என்றால் என்ன?" },
  { slug: "why-birth-time-matters", titleEn: "Why birth time matters", titleTa: "பிறந்த நேரம் ஏன் முக்கியம்?" },
  { slug: "how-to-read-a-jadhagam", titleEn: "How to read a Jadhagam", titleTa: "ஜாதகத்தை எப்படி படிப்பது?" },
  { slug: "what-is-chandrashtama", titleEn: "What is Chandrashtama?", titleTa: "சந்திராஷ்டமம் என்றால் என்ன?" },
  { slug: "what-is-porutham", titleEn: "What is Porutham?", titleTa: "பொருத்தம் என்றால் என்ன?" },
] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(date: string) {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function recentDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - index));
    return d.toISOString().slice(0, 10);
  });
}

function dayKey(dateLike: string) {
  return new Date(dateLike).toISOString().slice(0, 10);
}

function topArea(entries: QuickJournalEntry[]) {
  const counts = new Map<string, number>();
  entries.forEach((entry) => counts.set(entry.area, (counts.get(entry.area) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
}

export default function InsightsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const { tier } = useSession();
  const isAuthenticated = tier !== "guest";
  const isTamil = lang === "ta";
  const type = isTamil ? TamilType : EnType;
  const [chartId, setChartId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<GuestPrefs | null>(null);
  const [journalEntries, setJournalEntries] = useState<QuickJournalEntry[]>([]);

  const reloadJournal = async (syncChartId?: string | null) => {
    if (syncChartId && isAuthenticated) {
      const result = await syncQuickJournalEntries(syncChartId);
      setJournalEntries(result.entries);
      return;
    }
    setJournalEntries(await loadQuickJournalEntries());
  };

  useEffect(() => {
    getPrimaryChartId().then(setChartId);
    loadGuestPrefs().then(setPrefs);
    reloadJournal();
  }, []);

  useEffect(() => {
    if (chartId && isAuthenticated) void reloadJournal(chartId);
  }, [chartId, isAuthenticated]);

  const date = useMemo(todayIso, []);

  const STALE_5MIN = 5 * 60 * 1000;

  const dasha = useQuery({
    queryKey: dashaKeys.timeline(chartId ?? ""),
    queryFn: () => getDashaTimeline(chartId as string),
    enabled: !!chartId && isAuthenticated,
    staleTime: STALE_5MIN,
  });

  const lifeAreas = useQuery({
    queryKey: lifeAreasKeys.areas(chartId ?? "", date),
    queryFn: () => getLifeAreas(chartId as string, date),
    enabled: !!chartId && isAuthenticated,
    staleTime: STALE_5MIN,
  });

  const lifeEvents = useQuery({
    queryKey: lifeEventsKeys.events(chartId ?? ""),
    queryFn: () => getLifeEvents(chartId as string),
    enabled: !!chartId && isAuthenticated,
    staleTime: STALE_5MIN,
  });

  const transits = useQuery({
    queryKey: transitsKeys.upcoming(prefs?.rasi ?? ""),
    queryFn: () => getUpcomingTransits(prefs?.rasi as string, 3),
    enabled: !!prefs?.rasi,
    staleTime: STALE_5MIN,
  });

  const refreshing = dasha.isFetching || lifeAreas.isFetching || lifeEvents.isFetching || transits.isFetching;
  const refresh = () => {
    dasha.refetch();
    lifeAreas.refetch();
    lifeEvents.refetch();
    transits.refetch();
    reloadJournal(chartId);
  };

  const areas = lifeAreas.data?.data.areas ?? [];
  const events = lifeEvents.data?.data.windows ?? [];
  const currentDasha = dasha.data?.data;
  const currentYear = new Date().getFullYear();
  const journalPattern = topArea(journalEntries);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.gold} />}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Explore"
          titleTa="ஆராய்"
          subtitle="Your personalised depth views"
          subtitleTa="உங்கள் ஜோதிட ஆழம்"
          isTamil={isTamil}
          entering={FadeInDown.delay(entranceDelay.hero).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}
          badge={
            <View style={styles.rasiChip}>
              <Text style={styles.rasiText}>{prefs?.rasi ?? "Rasi"}</Text>
            </View>
          }
        />

        {!isAuthenticated || !chartId ? (
          <Animated.View style={{ gap: S.md }} entering={FadeInDown.delay(entranceDelay.supporting).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}>
            <AnimatedEmptyState
              variant="constellation"
              title={isTamil ? "உங்கள் ஜாதகம் சேர்க்கவும்" : "Add your chart to unlock insights"}
              body={isTamil
                ? "தசா, வாழ்க்கைப் பகுதிகள், நிகழ்வு சாளரங்கள் மற்றும் ஆண்டு கணிப்புகள் உங்கள் பிறந்த ஜாதகத்திலிருந்து கணக்கிடப்படுகின்றன."
                : "Dasha, life-area trends, event windows, and annual predictions are calculated from your birth chart."}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.primaryBtnText}>{isTamil ? "கணக்கு உருவாக்கு" : "Create account"}</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ gap: S.md }} entering={FadeInDown.delay(entranceDelay.supporting).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)}>
            <SectionLabel labelEn="Daily Depth" labelTa="நாளாந்த ஆழம்" isTamil={isTamil} />
            {dasha.isLoading ? (
              <SkeletonCard height={170} />
            ) : dasha.isError ? (
              <ErrorCard message={isTamil ? "Could not load dasha data." : "Could not load dasha data."} onRetry={dasha.refetch} />
            ) : currentDasha ? (
              <TouchableOpacity style={styles.dashaHero} activeOpacity={0.88} onPress={() => router.push("/dasha" as Href)}>
                <Text style={styles.heroKicker}>{isTamil ? "Dasha now" : "Dasha now"}</Text>
                <Text style={[styles.heroLord, type.display]}>
                  {isTamil ? currentDasha.maha_dasha.lord_ta : currentDasha.maha_dasha.lord}
                </Text>
                <Text style={styles.heroSub}>
                  {isTamil ? currentDasha.antar_dasha.lord_ta : currentDasha.antar_dasha.lord} {isTamil ? "Antar Dasha" : "Antar Dasha"}
                </Text>
                <View style={styles.heroMetaRow}>
                  <Text style={styles.heroMeta}>{fmt(currentDasha.maha_dasha.start_date)} - {fmt(currentDasha.maha_dasha.end_date)}</Text>
                  <Text style={styles.heroLink}>{isTamil ? "Timeline" : "Timeline"}</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <SectionTitle title={isTamil ? "This period's outlook" : "This period's outlook"} action={isTamil ? "Score" : "Score"} onPress={() => router.push("/daily-score")} />
            {lifeAreas.isLoading ? (
              <SkeletonCard height={220} />
            ) : lifeAreas.isError ? (
              <ErrorCard message={isTamil ? "Could not load life-area outlook." : "Could not load life-area outlook."} onRetry={lifeAreas.refetch} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaRail} snapToInterval={292} decelerationRate="fast">
                {areas.slice(0, 6).map((area) => (
                  <AreaStoryCard key={area.area} area={area} isTamil={isTamil} />
                ))}
              </ScrollView>
            )}

            <SectionTitle title={isTamil ? "Your life timeline" : "Your life timeline"} />
            <RiverTimeline events={events.slice(0, 5)} isTamil={isTamil} />

            <View style={styles.linkGrid}>
              <InsightLink title={isTamil ? "Annual wrapped" : "Annual wrapped"} body={String(currentYear)} onPress={() => router.push("/wrapped" as Href)} />
              <InsightLink title={isTamil ? "Annual prediction" : "Annual prediction"} body={String(currentYear)} onPress={() => router.push("/varshaphala" as Href)} />
              <InsightLink title={isTamil ? "Transits" : "Transits"} body={`${transits.data?.data.length ?? 0} upcoming`} onPress={() => router.push("/transits" as Href)} />
            </View>

            {/* Family & Journal group */}
            <SectionLabel labelEn="Family & Journal" labelTa="குடும்பம் & குறிப்பு" isTamil={isTamil} />
            <NavCard
              icon={<Users size={22} color={C.goldOnLight} strokeWidth={1.5} />}
              title="Family Vault"
              titleTa="குடும்ப சேமிப்பு"
              body="Charts and guidance for your family"
              bodyTa="குடும்பத்தினர் அனைவரின் ஜாதகங்கள்"
              isTamil={isTamil}
              onPress={() => router.push("/family-vault" as Href)}
              C={C}
            />
            <NavCard
              icon={<BookOpen size={22} color={C.goldOnLight} strokeWidth={1.5} />}
              title="Journal"
              titleTa="குறிப்பேடு"
              body="Log life moments and see your rhythm"
              bodyTa="தருணங்கள் பதிவு செய்யுங்கள்"
              isTamil={isTamil}
              onPress={() => router.push("/journal" as Href)}
              C={C}
            />

            <SectionTitle title={isTamil ? "Journal rhythm" : "Journal rhythm"} action={isTamil ? "Open" : "Open"} onPress={() => router.push("/journal" as Href)} />
            <JournalPanel entries={journalEntries} pattern={journalPattern} isTamil={isTamil} />

            {/* Specialist Tools group */}
            <SectionLabel labelEn="Specialist Tools" labelTa="சிறப்பு கருவிகள்" isTamil={isTamil} />

            {/* Goals tile */}
            <TouchableOpacity
              style={styles.goalsTile}
              activeOpacity={0.88}
              onPress={() => router.push("/goals" as Href)}
              accessibilityLabel={isTamil ? "இலக்குகள்" : "Goals"}
              accessibilityRole="button"
            >
              <View style={styles.goalsTileTop}>
                <Text style={styles.goalsTileKicker}>{isTamil ? "P0" : "P0"}</Text>
                <Text style={styles.goalsTileArrow}>{"->"}</Text>
              </View>
              <Text style={styles.goalsTileTitle}>{isTamil ? "இலக்குகள்" : "Goals"}</Text>
              <Text style={styles.goalsTileBody}>
                {isTamil
                  ? "உங்கள் இலக்குகளை தசா காலத்திற்கு ஏற்ப பரிசீலிக்கவும்."
                  : "Set and track your life goals. Correlated with your current dasha period and life-area outlook."}
              </Text>
            </TouchableOpacity>

            {/* Varga tile */}
            <TouchableOpacity
              style={styles.vargaTile}
              activeOpacity={0.88}
              onPress={() => router.push("/vargas" as Href)}
              accessibilityLabel={isTamil ? "பிரிவு ஜாதகங்கள்" : "Divisional Charts"}
              accessibilityRole="button"
            >
              <View style={styles.vargaTileTop}>
                <Text style={styles.vargaTileKicker}>{isTamil ? "பிரிவு ஜாதகங்கள்" : "Divisional Charts"}</Text>
                <Text style={styles.vargaTileArrow}>{"->"}</Text>
              </View>
              <Text style={styles.vargaTileTitle}>{isTamil ? "D1 · D9 · D10" : "D1 · D9 · D10"}</Text>
              <Text style={styles.vargaTileBody}>
                {isTamil
                  ? "ராசி, நவாம்சம், தசாம்சம் — திருக்கணிதத்தில் கணக்கிடப்பட்டது."
                  : "Rasi, Navamsa, Dashamsa — and more. Depth from Thirukanitham-precise positions."}
              </Text>
            </TouchableOpacity>

            {/* Learn Thirukanitham rail */}
            <SectionTitle title={isTamil ? "கற்றுக்கொள்ளுங்கள்" : "Learn Thirukanitham"} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.learnRail}>
              {LEARN_CARDS.map((card) => (
                <TouchableOpacity
                  key={card.slug}
                  style={styles.learnCard}
                  activeOpacity={0.86}
                  onPress={() => router.push(`/learn/${card.slug}` as Href)}
                  accessibilityRole="button"
                >
                  <Text style={styles.learnCardTitle}>{isTamil ? card.titleTa : card.titleEn}</Text>
                  <Text style={styles.learnCardArrow}>{"->"}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
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

function AreaStoryCard({ area, isTamil }: { area: LifeAreaData; isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const tone = scoreTone(area.score);
  const title = biText(area.label, isTamil, area.area);
  return (
    <ShareCaptureView
      style={styles.areaCard}
      fileName={`vinaadi-insight-${area.area}`}
      title="Vinaadi Insight"
      message={title}
    >
      <View style={styles.areaTopRow}>
        <View style={[styles.scoreOrb, { backgroundColor: tone }]}>
          <Text style={styles.scoreOrbText}>{Math.round(area.score)}</Text>
        </View>
        <View style={styles.trendBadge}>
          <Text style={styles.trendText}>{area.trend || "STABLE"}</Text>
        </View>
      </View>
      <Text style={styles.areaTitle}>{title}</Text>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${Math.max(8, Math.min(area.score, 100))}%`, backgroundColor: tone }]} />
      </View>
      <Text numberOfLines={4} style={styles.areaBody}>{biText(area.narrative, isTamil)}</Text>
      <View style={styles.nextBlock}>
        <Text style={styles.nextLabel}>{isTamil ? "Next 30 days" : "Next 30 days"}</Text>
        <Text numberOfLines={3} style={styles.nextText}>{biText(area.next30DayOutlook, isTamil)}</Text>
      </View>
    </ShareCaptureView>
  );
}

function RiverTimeline({ events, isTamil }: { events: LifeEventWindow[]; isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  if (!events.length) {
    return (
      <View style={styles.timelineEmpty}>
        <Text style={styles.timelineEmptyText}>{isTamil ? "Upcoming event windows will appear here." : "Upcoming event windows will appear here."}</Text>
      </View>
    );
  }

  return (
    <View style={styles.riverPanel}>
      <View style={styles.riverLine} />
      {events.map((event, index) => {
        const days = daysUntil(event.startDate);
        const isSoon = days !== null && days <= 120;
        return (
          <TouchableOpacity key={`${event.eventType}-${event.startDate}-${index}`} style={styles.riverItem} activeOpacity={0.86}>
            <View style={[styles.riverDot, isSoon && styles.riverDotSoon]} />
            <View style={styles.riverCopy}>
              <View style={styles.riverMetaRow}>
                <Text style={styles.riverMeta}>{days === null ? fmt(event.startDate) : days <= 0 ? "Active now" : `${days} days`}</Text>
                <Text style={styles.riverConfidence}>{event.confidence}</Text>
              </View>
              <Text style={styles.riverTitle}>{biText(event.headline, isTamil, event.eventType)}</Text>
              <Text style={styles.riverDates}>{fmt(event.startDate)} - {fmt(event.endDate)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function JournalPanel({ entries, pattern, isTamil }: { entries: QuickJournalEntry[]; pattern: [string, number] | null; isTamil: boolean }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const days = recentDays(35);
  const counts = new Map<string, number>();
  entries.forEach((entry) => counts.set(dayKey(entry.createdAt), (counts.get(dayKey(entry.createdAt)) ?? 0) + 1));
  const maxCount = Math.max(1, ...Array.from(counts.values()));
  const recent = entries.slice(0, 3);
  const wins = entries.filter((entry) => entry.moment === "win" || entry.moment === "milestone").length;

  return (
    <View style={styles.journalPanel}>
      <View style={styles.heatmapGrid}>
        {days.map((day) => {
          const count = counts.get(day) ?? 0;
          const opacity = count === 0 ? 0.16 : 0.32 + (count / maxCount) * 0.58;
          return <View key={day} style={[styles.heatCell, { backgroundColor: C.saffron, opacity }]} />;
        })}
      </View>
      <Text style={styles.patternTitle}>{isTamil ? "Patterns" : "Patterns"}</Text>
      <Text style={styles.patternBody}>
        {entries.length === 0
          ? (isTamil ? "Log moments from Today; your rhythm will collect here." : "Log moments from Today; your rhythm will collect here.")
          : pattern
            ? `${entries.length} moments logged. ${pattern[0]} leads with ${pattern[1]} entries; ${wins} wins or milestones captured.`
            : `${entries.length} moments logged.`}
      </Text>
      {recent.length > 0 && (
        <View style={styles.recentList}>
          {recent.map((entry) => (
            <View key={entry.id} style={styles.recentRow}>
              <Text style={styles.recentDate}>{fmt(entry.createdAt)}</Text>
              <Text style={styles.recentText} numberOfLines={1}>{entry.area} - {entry.note || entry.moment}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function InsightLink({ title, body, onPress }: { title: string; body: string; onPress: () => void }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <TouchableOpacity style={styles.linkPanel} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.linkTitle}>{title}</Text>
      <Text style={styles.linkBody}>{body}</Text>
      <Text style={styles.linkArrow}>{"->"}</Text>
    </TouchableOpacity>
  );
}

function NavCard({
  icon, title, titleTa, body, bodyTa, isTamil, onPress, C,
}: {
  icon: React.ReactNode;
  title: string;
  titleTa: string;
  body: string;
  bodyTa: string;
  isTamil: boolean;
  onPress: () => void;
  C: ColorTokens;
}) {
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <TouchableOpacity
      style={styles.navCard}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <View style={styles.navCardIconWell}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.navCardTitle}>{isTamil ? titleTa : title}</Text>
        <Text style={styles.navCardBody}>{isTamil ? bodyTa : body}</Text>
      </View>
      <Text style={styles.navCardArrow}>{"->"}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.parchment },
  content: { paddingHorizontal: S.lg, paddingBottom: S.xl * 2, gap: S.md },
  rasiChip: { borderRadius: 999, backgroundColor: C.surface, borderWidth: 1, borderColor: C.divider, paddingHorizontal: S.md, paddingVertical: S.xs },
  rasiText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textSecond },
  emptyPanel: { backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.lg, gap: S.sm, borderWidth: 1, borderColor: C.divider },
  emptyTitle: { color: C.textPrimary },
  emptyBody: { color: C.textSecond },
  primaryBtn: { alignSelf: "flex-start", marginTop: S.sm, backgroundColor: C.saffron, borderRadius: RADIUS.button, paddingHorizontal: S.lg, paddingVertical: S.sm },
  primaryBtnText: { color: C.surface, fontFamily: "Inter_700Bold", fontSize: 14 },
  dashaHero: { backgroundColor: C.darkBg, borderRadius: RADIUS.card, padding: S.lg, gap: S.xs },
  heroKicker: { fontFamily: "Inter_600SemiBold", color: C.gold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0 },
  heroLord: { color: C.surface },
  heroSub: { fontFamily: "Inter_600SemiBold", color: C.indigoText, fontSize: 16, opacity: 0.72 },
  heroMetaRow: { marginTop: S.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: S.md },
  heroMeta: { flex: 1, color: C.indigoText, fontFamily: "Inter_400Regular", fontSize: 12, opacity: 0.62 },
  heroLink: { color: C.gold, fontFamily: "Inter_700Bold", fontSize: 13 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: S.sm },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, lineHeight: 23, color: C.textPrimary },
  sectionAction: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.saffron },
  areaRail: { gap: S.sm, paddingRight: S.lg },
  areaCard: { width: 280, minHeight: 226, backgroundColor: C.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider, padding: S.md },
  areaTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreOrb: { width: 48, height: 48, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  scoreOrbText: { color: C.surface, fontFamily: "Inter_800ExtraBold", fontSize: 16 },
  trendBadge: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.chip, paddingHorizontal: S.sm, paddingVertical: 3 },
  trendText: { color: C.textSecond, fontFamily: "Inter_700Bold", fontSize: 11 },
  areaTitle: { marginTop: S.md, color: C.textPrimary, fontFamily: "Inter_700Bold", fontSize: 18 },
  meterTrack: { height: 5, borderRadius: 999, backgroundColor: C.surfaceAlt, overflow: "hidden", marginTop: S.sm },
  meterFill: { height: 5, borderRadius: 999 },
  areaBody: { marginTop: S.md, color: C.textSecond, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  nextBlock: { marginTop: "auto", borderTopWidth: 1, borderTopColor: C.divider, paddingTop: S.sm },
  nextLabel: { color: C.saffron, fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0 },
  nextText: { color: C.textPrimary, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginTop: 3 },
  timelineEmpty: { backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md, borderWidth: 1, borderColor: C.divider },
  timelineEmptyText: { color: C.textSecond, fontFamily: "Inter_400Regular", fontSize: 13 },
  riverPanel: { backgroundColor: C.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider, padding: S.md, overflow: "hidden" },
  riverLine: { position: "absolute", left: 22, top: S.md, bottom: S.md, width: 3, borderRadius: 999, backgroundColor: C.divider },
  riverItem: { flexDirection: "row", gap: S.md, paddingVertical: S.sm, alignItems: "center" },
  riverDot: { width: 14, height: 14, borderRadius: 999, backgroundColor: C.gold, borderWidth: 3, borderColor: C.surface, marginLeft: 2 },
  riverDotSoon: { backgroundColor: C.saffron },
  riverCopy: { flex: 1 },
  riverMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: S.sm },
  riverMeta: { color: C.saffron, fontFamily: "Inter_700Bold", fontSize: 11, textTransform: "uppercase", letterSpacing: 0 },
  riverConfidence: { color: C.textTertiary, fontFamily: "Inter_700Bold", fontSize: 11 },
  riverTitle: { marginTop: 3, color: C.textPrimary, fontFamily: "Inter_700Bold", fontSize: 15, lineHeight: 20 },
  riverDates: { marginTop: 2, color: C.textSecond, fontFamily: "Inter_400Regular", fontSize: 12 },
  linkGrid: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  linkPanel: { flexGrow: 1, minWidth: "30%", minHeight: 104, backgroundColor: C.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider, padding: S.md },
  linkTitle: { color: C.textSecond, fontFamily: "Inter_600SemiBold", fontSize: 12 },
  linkBody: { color: C.textPrimary, fontFamily: "Inter_800ExtraBold", fontSize: 20, marginTop: S.sm },
  linkArrow: { color: C.saffron, fontFamily: "Inter_700Bold", fontSize: 16, marginTop: "auto" },
  journalPanel: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.card, padding: S.md, gap: S.sm },
  heatmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  heatCell: { width: 13, height: 13, borderRadius: 3 },
  patternTitle: { color: C.textPrimary, fontFamily: "Inter_800ExtraBold", fontSize: 16, marginTop: S.xs },
  patternBody: { color: C.textSecond, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  recentList: { gap: S.xs, marginTop: S.xs },
  recentRow: { flexDirection: "row", gap: S.sm, alignItems: "center" },
  recentDate: { width: 74, color: C.textTertiary, fontFamily: "Inter_600SemiBold", fontSize: 11 },
  recentText: { flex: 1, color: C.textPrimary, fontFamily: "Inter_400Regular", fontSize: 12 },

  // Goals tile
  goalsTile: {
    backgroundColor: C.saffron, borderRadius: RADIUS.card, padding: S.lg, gap: S.xs,
  },
  goalsTileTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalsTileKicker: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.indigoText, textTransform: "uppercase", opacity: 0.72 },
  goalsTileArrow: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.indigoText, opacity: 0.72 },
  goalsTileTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 22, color: C.indigoText },
  goalsTileBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, color: C.indigoText, opacity: 0.82 },

  // Varga tile
  vargaTile: {
    backgroundColor: C.darkBg, borderRadius: RADIUS.card, padding: S.lg, gap: S.xs,
  },
  vargaTileTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vargaTileKicker: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.gold, textTransform: "uppercase" },
  vargaTileArrow: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.indigoText, opacity: 0.5 },
  vargaTileTitle: { fontFamily: "Inter_800ExtraBold", fontSize: 22, color: C.indigoText },
  vargaTileBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, color: C.indigoText, opacity: 0.72 },

  // Family & Journal nav cards
  navCard: {
    flexDirection: "row", alignItems: "center", gap: S.md,
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: C.divider, padding: S.md, minHeight: 72,
  },
  navCardIconWell: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: C.goldLight, alignItems: "center", justifyContent: "center",
  },
  navCardTitle: { fontFamily: "Inter_700Bold", fontSize: 15, lineHeight: 20, color: C.textPrimary },
  navCardBody: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, color: C.textSecond, marginTop: 2 },
  navCardArrow: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.saffron },

  // Learn rail
  learnRail: { gap: S.sm, paddingRight: S.lg },
  learnCard: {
    width: 200, backgroundColor: C.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: C.divider,
    padding: S.md, justifyContent: "space-between", minHeight: 96,
  },
  learnCardTitle: { fontFamily: "Inter_700Bold", fontSize: 14, lineHeight: 20, color: C.textPrimary, flex: 1 },
  learnCardArrow: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.gold, marginTop: S.sm },
  });
}
