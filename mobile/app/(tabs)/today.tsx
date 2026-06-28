import React, { useEffect, useMemo, useState } from "react";
import {
  Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, useWindowDimensions, View,
} from "react-native";
import { useToast } from "@/context/ToastContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { FadeInDown } from "react-native-reanimated";
import { entranceDelay, spring } from "@/theme/motion";
import { router, type Href } from "expo-router";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Flame,
  Orbit,
  Sparkles,
  SunMedium,
  X,
} from "lucide-react-native";
import { type ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType, TamilFont, EnFont } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { useColors } from "@/hooks/useColors";
import { TimeCard } from "@/components/TimeCard";
import { ListItem } from "@/components/ListItem";
import { ChipStrip } from "@/components/ChipStrip";
import { RasiPalanCard } from "@/components/RasiPalanCard";
import { ScoreRing } from "@/components/ScoreRing";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";
import { NativeAdUnit } from "@/components/AdUnit";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { SharedTransitionView } from "@/components/SharedTransitionView";
import { getPanchangamToday } from "@/api/panchangam";
import { getRasiPalan } from "@/api/rasiPalan";
import { getDailyGuidance } from "@/api/guidance";
import { getLifeAreas, type LifeAreaData } from "@/api/lifeAreas";
import { getLifeEvents, type LifeEventWindow } from "@/api/lifeEvents";
import { getUpcomingTransits, type TransitItem } from "@/api/transits";
import { loadGuestPrefs } from "@/features/guest/guestStore";
import { useJournal } from "@/hooks/useJournal";
import { useConversionPrompt } from "@/hooks/useConversionPrompt";
import { STALE } from "@/lib/queryClient";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { pushWidgetData } from "@/lib/widgetBridge";
import { biText } from "@/lib/i18n";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import type { GuestPrefs } from "@/features/guest/guestStore";
import type { DailyGuidanceData } from "@vinaadi/shared";
import { SCORE_THRESHOLDS } from "@vinaadi/shared/utils/score";
type ExtendedGuidance = DailyGuidanceData & {
  is_chandrashtama?: boolean;
  chandrashtama_ends?: string | null;
};

type GowriSlot = {
  name?: string | null;
  label?: string | null;
  purpose?: string | null;
  start: string;
  end: string;
  warning?: string | null;
};

type DetailSheetState = {
  title: string;
  body: string;
  tone?: "good" | "caution" | "neutral";
} | null;


const JOURNAL_MOMENTS = [
  { key: "win", label: "Big win" },
  { key: "hard_day", label: "Hard day" },
  { key: "decision", label: "Decision" },
  { key: "milestone", label: "Milestone" },
  { key: "quiet", label: "Nothing yet" },
];

const JOURNAL_AREAS = [
  { key: "career", label: "Career" },
  { key: "love", label: "Love" },
  { key: "health", label: "Health" },
  { key: "money", label: "Money" },
  { key: "family", label: "Family" },
  { key: "spiritual", label: "Spiritual" },
  { key: "general", label: "General" },
];

function formatTime(iso: string): string {
  try {
    if (/^\d{2}:\d{2}/.test(iso)) return iso.slice(0, 5);
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return iso;
  }
}

function dateDistanceLabel(date: string, isTamil: boolean): string {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return date;
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return isTamil ? "active now" : "active now";
  if (days === 1) return isTamil ? "tomorrow" : "tomorrow";
  return isTamil ? `${days} days` : `${days} days`;
}


function getGowriSlots(p: { kalam?: { gowriNallaNeram?: GowriSlot[] } } | undefined): GowriSlot[] {
  return p?.kalam?.gowriNallaNeram ?? [];
}

function getNextEvent(events: LifeEventWindow[]): LifeEventWindow | undefined {
  const now = Date.now();
  return [...events]
    .filter((event) => new Date(event.endDate).getTime() >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
}

function getCosmicAlert(g: ExtendedGuidance | undefined, transit: TransitItem | undefined, isTamil: boolean): DetailSheetState {
  if (g?.isChandrashtama ?? g?.is_chandrashtama) {
    const end = g.chandrashtamaEnds ?? g.chandrashtama_ends;
    return {
      title: isTamil ? "Chandrashtama alert" : "Chandrashtama alert",
      body: end ? `${isTamil ? "Ends" : "Ends"}: ${new Date(end).toLocaleDateString()}` : (isTamil ? "Move slowly today." : "Move slowly today."),
      tone: "caution",
    };
  }
  if (transit) {
    return {
      title: isTamil ? transit.planet_ta || transit.planet : `${transit.planet} transit`,
      body: isTamil ? transit.summary_ta : transit.summary_en,
      tone: transit.impact === "challenging" ? "caution" : transit.impact === "good" ? "good" : "neutral",
    };
  }
  if (g?.cautionWindows?.length) {
    const first = g.cautionWindows[0];
    return {
      title: isTamil ? "Timing caution" : "Timing caution",
      body: `${first.type}: ${formatTime(first.start)} - ${formatTime(first.end)}`,
      tone: "caution",
    };
  }
  return null;
}

export default function TodayTab() {
  const { showSuccess, showError } = useToast();
  const { t, strings, lang } = useI18n();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { tier, user } = useSession();
  const isTamil = lang === "ta";
  const T = isTamil ? TamilType : EnType;
  const { height: windowHeight } = useWindowDimensions();
  const heroZoneHeight = Math.round(windowHeight * 0.4);

  const { recordTodayVisit } = useConversionPrompt();
  const [prefs, setPrefs] = useState<GuestPrefs | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [primaryChartId, setPrimaryChartId] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [detailSheet, setDetailSheet] = useState<DetailSheetState>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalMoment, setJournalMoment] = useState(JOURNAL_MOMENTS[0].key);
  const [journalArea, setJournalArea] = useState(JOURNAL_AREAS[0].key);
  const [journalNote, setJournalNote] = useState("");
  const [panchangamExpanded, setPanchangamExpanded] = useState(false);
  const { saveEntry } = useJournal({ chartId: primaryChartId, isAuthenticated: tier !== "guest" });

  const isOffline = useOfflineStatus();

  useEffect(() => {
    loadGuestPrefs().then(setPrefs);
    if (tier !== "guest") {
      getPrimaryChartId().then(setPrimaryChartId);
    }
    void recordTodayVisit().then(() => {
      void AsyncStorage.getItem("vinaadi_streak_days").then((val) => {
        if (val) setStreakCount(Number(val));
      });
    });
  }, [tier, recordTodayVisit]);

  const lat = prefs?.lat ?? undefined;
  const lon = prefs?.lon ?? undefined;
  const hasLocation = lat != null && lon != null;
  const isLocationMissing = !!prefs && !hasLocation;
  const tz = "Asia/Kolkata";

  const {
    data: panchangamData,
    isLoading: isPanchangamLoading,
    isFetching: isPanchangamFetching,
    isError,
    refetch: refetchPanchangam,
  } = useQuery({
    queryKey: ["panchangam-today", lat, lon],
    queryFn: () => getPanchangamToday({ lat: lat!, lng: lon!, tz }),
    staleTime: STALE.panchangam,
    enabled: hasLocation,
  });

  const todayDateStr = new Date().toISOString().split("T")[0];
  const {
    data: rasiPalanData,
    isFetching: isRasiPalanFetching,
    refetch: refetchRasiPalan,
  } = useQuery({
    queryKey: ["rasi-palan", prefs?.rasi, todayDateStr, lat, lon],
    queryFn: () =>
      getRasiPalan({
        rasi: prefs!.rasi!,
        date: todayDateStr,
        lat,
        lng: lon,
        timezone: tz,
      }),
    staleTime: STALE.rasiPalan,
    enabled: !!prefs?.rasi,
  });

  const p = panchangamData?.data;

  const {
    data: guidanceData,
    isFetching: isGuidanceFetching,
    refetch: refetchGuidance,
  } = useQuery({
    queryKey: ["daily-guidance", primaryChartId, todayDateStr],
    queryFn: () => getDailyGuidance(primaryChartId!, todayDateStr),
    enabled: tier !== "guest" && !!primaryChartId,
    staleTime: STALE.guidance,
  });
  const g = guidanceData?.data as ExtendedGuidance | undefined;

  const lifeAreas = useQuery({
    queryKey: ["today-life-areas", primaryChartId, todayDateStr],
    queryFn: () => getLifeAreas(primaryChartId!, todayDateStr),
    enabled: tier !== "guest" && !!primaryChartId,
    staleTime: STALE.today,
  });

  const lifeEvents = useQuery({
    queryKey: ["today-life-events", primaryChartId],
    queryFn: () => getLifeEvents(primaryChartId!, 3),
    enabled: tier !== "guest" && !!primaryChartId,
    staleTime: STALE.today,
  });

  const transits = useQuery({
    queryKey: ["today-transits", prefs?.rasi],
    queryFn: () => getUpcomingTransits(prefs!.rasi!, 3),
    enabled: !!prefs?.rasi,
    staleTime: STALE.transits,
  });

  // Push today's snapshot to native widget storage whenever data freshens.
  useEffect(() => {
    if (!p) return;
    const firstNalla = p.kalam.nallaNeram[0];
    pushWidgetData({
      nallaNeram: firstNalla
        ? `${formatTime(firstNalla.start)} â€“ ${formatTime(firstNalla.end)}`
        : "â€“",
      rahuKalam: `${formatTime(p.kalam.rahuKalam.start)} â€“ ${formatTime(p.kalam.rahuKalam.end)}`,
      rasiPalan: g ? (lang === "ta" ? g.text?.ta ?? "" : g.text?.en ?? "") : "",
      tamilDate: p.tamilDate ? (lang === "ta" ? p.tamilDate.ta : p.tamilDate.en) : "",
      lang,
    });
  }, [p, g, lang]);

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const tamilDate = p?.tamilDate ? (isTamil ? p.tamilDate.ta : p.tamilDate.en) : todayLabel;
  const cityName = prefs?.city ?? (isLocationMissing ? (isTamil ? "இடத்தை அமைக்கவும்" : "Set location") : "Chennai");
  const areaPulse = lifeAreas.data?.data.areas ?? [];
  const nextEvent = useMemo(
    () => getNextEvent(lifeEvents.data?.data.windows ?? []),
    [lifeEvents.data]
  );
  const gowriSlots = getGowriSlots(p);
  const primaryGowri = gowriSlots[0];
  const cosmicAlert = getCosmicAlert(g, transits.data?.data[0], isTamil);
  const bestActionWindow = g?.bestWindows?.[0] ?? null;
  const refreshing = isPanchangamFetching || isRasiPalanFetching || isGuidanceFetching || lifeAreas.isFetching || lifeEvents.isFetching || transits.isFetching;
  const activityChips = useMemo(() => {
    if (!g) return [];
    const chips = [] as Array<{ label: string; ok: boolean; detail: string }>;
    if (g.bestWindows?.[0]) {
      const w = g.bestWindows[0];
      chips.push({ label: "Start work", ok: true, detail: `${w.type}: ${formatTime(w.start)} - ${formatTime(w.end)}` });
    }
    if (g.currentHoraLord) {
      chips.push({ label: `${g.currentHoraLord} hora`, ok: true, detail: biText(g.actionSuggestion, isTamil, "Use this window for focused action.") });
    }
    chips.push({ label: "Travel", ok: g.score >= SCORE_THRESHOLDS.MID, detail: biText(g.reasons?.panchangam, isTamil, biText(g.actionSuggestion, isTamil)) });
    chips.push({ label: "Contracts", ok: !g.cautionWindows?.length && g.score >= SCORE_THRESHOLDS.HIGH, detail: biText(g.cautionSuggestion, isTamil, "Check caution windows before signing.") });
    if (g.cautionWindows?.[0]) {
      const w = g.cautionWindows[0];
      chips.push({ label: "Avoid rush", ok: false, detail: `${w.type}: ${formatTime(w.start)} - ${formatTime(w.end)}` });
    }
    return chips.slice(0, 5);
  }, [g, isTamil]);

  const refreshAll = () => {
    if (hasLocation) {
      refetchPanchangam();
    }
    void refetchRasiPalan();
    refetchGuidance();
    lifeAreas.refetch();
    lifeEvents.refetch();
    transits.refetch();
  };

  const saveJournalEntry = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const entry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      moment: journalMoment,
      area: journalArea,
      note: journalNote.trim(),
      chartId: primaryChartId,
      dailyScore: g?.score ?? null,
      dashaContext: g?.contextInsight ?? null,
      activeTransit: transits.data?.data[0] ?? null,
    };
    try {
      await saveEntry(entry);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setJournalOpen(false);
      setJournalNote("");
      showSuccess(isTamil ? "தருணம் பதிவு செய்யப்பட்டது" : "Moment logged");
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(isTamil ? "தருணம் சேமிக்க முடியவில்லை" : "Could not save moment");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={C.saffron} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Offline banner */}
        {isOffline && (
          <View style={styles.offlineBanner} accessibilityLiveRegion="polite">
            <Text style={styles.offlineBannerText}>
              {isTamil ? "இணைப்பு இல்லை — தேக்கிய தகவல் காட்டப்படுகிறது" : "No connection — showing cached data"}
            </Text>
          </View>
        )}

        {/* Header */}
        {tier !== "guest" ? (
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.logo}>à®µà®¿à®¨à®¾à®Ÿà®¿ AI</Text>
              {user?.displayName ? (
                <Text style={[styles.greeting, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? `à®µà®£à®•à¯à®•à®®à¯, ${user.displayName}` : `Welcome back, ${user.displayName}`}
                </Text>
              ) : null}
            </View>
            {streakCount >= 1 && (
              <View style={styles.streakChip} accessibilityLabel={`${streakCount}-day streak`}>
                <Flame size={13} color={C.surface} strokeWidth={1.5} /><Text style={styles.streakText}>{streakCount}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => router.push("/notifications/inbox" as Href)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Bell size={22} color={C.textSecond} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.header}>
            <Text style={styles.logo}>à®µà®¿à®¨à®¾à®Ÿà®¿ AI</Text>
            <View style={styles.headerCenter}>
              <Text style={[styles.tamilDate, { fontFamily: T.subheading.fontFamily }]}>
                {tamilDate}
              </Text>
              <Text style={styles.engDate}>{todayLabel}</Text>
            </View>
            <TouchableOpacity
              style={styles.cityChip}
              activeOpacity={0.75}
              onPress={() => router.push("/(onboarding)/location" as Href)}
              accessibilityRole="button"
              accessibilityLabel={isTamil ? "இடத்தை மாற்றவும்" : "Update location"}
            >
              <Text style={styles.cityText}>{cityName}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLocationMissing && (
          <TouchableOpacity
            style={styles.signupPrompt}
            activeOpacity={0.85}
            onPress={() => router.push("/(onboarding)/location" as Href)}
            accessibilityRole="button"
            accessibilityLabel={isTamil ? "நகரத்தை அமைக்கவும்" : "Set your city"}
          >
            <Text style={[styles.promptHeading, isTamil ? TamilType.body : EnType.body]}>
              {isTamil ? "பஞ்சாங்க நேரங்கள் உங்கள் நகரத்தை சார்ந்தவை." : "Panchangam timings depend on your city."}
            </Text>
            <Text style={styles.engDate}>
              {isTamil ? "சரியான சூரியோதயம், ராகு காலம், நல்ல நேரம் பார்க்க இடத்தை அமைக்கவும்." : "Set your location to see correct sunrise, Rahu Kalam, and Nalla Neram."}
            </Text>
            <Text style={styles.promptCta}>{isTamil ? "இடத்தை புதுப்பிக்கவும்" : "Update location"}</Text>
          </TouchableOpacity>
        )}

        {/* Registered: one-answer hero */}
        {tier !== "guest" && (
          <View style={styles.hero}>
            {!g ? (
              <SkeletonCard height={260} />
            ) : (
              <TouchableOpacity
                style={[styles.scoreHeroCard, { minHeight: heroZoneHeight }]}
                onPress={() => primaryChartId && router.push({ pathname: "/daily-score", params: { chartId: primaryChartId } })}
                activeOpacity={0.9}
                accessibilityLabel={g ? `Today's score ${g.score}. ${isTamil ? g.text?.ta : g.text?.en}` : "Today's score"}
                accessibilityRole="button"
                accessibilityHint="Opens daily score details"
              >
                <View style={styles.scoreHeroTopRow}>
                  <View style={styles.heroKickerRow}>
                    <SunMedium size={16} color={C.gold} strokeWidth={1.5} />
                    <Text style={[styles.scoreHeroLabel, isTamil ? TamilType.caption : EnType.caption]}>
                      {isTamil ? "Today" : "Today"} · {cityName}
                    </Text>
                    <ThirukanithamBadge size="sm" style={{ alignSelf: "center" }} />
                  </View>
                  <ChevronRight size={20} color={C.textTertiary} strokeWidth={1.5} />
                </View>

                <View style={styles.scoreHeroMain}>
                  <SharedTransitionView entering={FadeInDown.delay(entranceDelay.hero).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)} sharedTransitionTag="score-ring">
                    <ScoreRing score={g.score} size={132} />
                  </SharedTransitionView>
                  <View style={styles.scoreHeroCopy}>
                    <Text style={styles.scoreHeroNumber}>{g.score}</Text>
                    <Text style={styles.scoreHeroState}>{g.score >= SCORE_THRESHOLDS.HIGH ? "Good window" : g.score >= SCORE_THRESHOLDS.MID ? "Move steadily" : "Go gently"}</Text>
                  </View>
                </View>

                <View style={styles.bestWindowPanel}>
                  <Text style={styles.bestWindowLabel}>{isTamil ? "Best window" : "Best window"}</Text>
                  <Text style={styles.bestWindowTime}>
                    {bestActionWindow
                      ? `${formatTime(bestActionWindow.start)} - ${formatTime(bestActionWindow.end)}`
                      : primaryGowri
                        ? `${formatTime(primaryGowri.start)} - ${formatTime(primaryGowri.end)}`
                        : "Check timing"}
                  </Text>
                  <Text style={[styles.scoreHeroText, isTamil ? TamilType.bodySmall : EnType.bodySmall]} numberOfLines={3}>
                    {isTamil ? g.text?.ta : g.text?.en}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
        {tier !== "guest" && areaPulse.length > 0 && (
          <LifeAreaPulse
            areas={areaPulse.slice(0, 4)}
            isTamil={isTamil}
            C={C}
            styles={styles}
            onSelect={(area) => {
              Haptics.selectionAsync();
              setDetailSheet({
                title: biText(area.label, isTamil, area.area),
                body: `${biText(area.narrative, isTamil)}\n\n${biText(area.next30DayOutlook, isTamil)}`,
                tone: area.score >= SCORE_THRESHOLDS.MID ? "good" : "caution",
              });
            }}
          />
        )}

        {cosmicAlert && (
          <TouchableOpacity
            style={[styles.cosmicAlert, cosmicAlert.tone === "good" && styles.cosmicAlertGood]}
            activeOpacity={0.86}
            onPress={() => {
              Haptics.selectionAsync();
              setDetailSheet(cosmicAlert);
            }}
            accessibilityLabel={`Cosmic alert: ${cosmicAlert.title}`}
            accessibilityRole="button"
            accessibilityHint="Opens detail"
          >
            <View style={[styles.cosmicDot, { backgroundColor: cosmicAlert.tone === "good" ? C.green : C.caution }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cosmicKicker}>{isTamil ? "Cosmic alert" : "Cosmic alert"}</Text>
              <Text style={[styles.cosmicTitle, isTamil ? TamilType.bodySmall : EnType.bodySmall]} numberOfLines={2}>
                {cosmicAlert.title}
              </Text>
            </View>
            <ChevronRight size={16} color={C.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
        {/* Dasha Timeline quick-link (registered users with a chart) */}
        {tier !== "guest" && primaryChartId && (
          <ListItem
            icon={Orbit}
            title="Dasha Timeline"
            titleTa="தசா காலவரிசை"
            subtitle="Your Maha & Antar Dasha periods"
            subtitleTa="உங்கள் மகா தசை & அந்தர தசை"
            isTamil={isTamil}
            onPress={() => router.push("/dasha" as Href)}
            style={{ marginHorizontal: S.base, marginTop: S.sm }}
          />
        )}
        {/* Guest Hero Card */}
        {tier === "guest" && (
          <View style={styles.hero}>
            {isPanchangamLoading ? (
              <SkeletonCard height={200} />
            ) : (
              <View style={styles.heroCard}>
                <View style={[styles.heroKickerRow, { justifyContent: "space-between" }]}>
                  <Text style={styles.heroLabel}>{isTamil ? "à®‡à®©à¯à®±à¯" : "Today"}</Text>
                  <ThirukanithamBadge size="sm" />
                </View>
                <View style={styles.heroRow}>
                  <View>
                    <Text style={styles.heroRasi}>
                      {prefs?.rasi
                        ? (isTamil
                          ? { mesham: "à®®à¯‡à®·à®®à¯", rishabam: "à®°à®¿à®·à®ªà®®à¯", mithunam: "à®®à®¿à®¤à¯à®©à®®à¯", katakam: "à®•à®Ÿà®•à®®à¯",
                              simham: "à®šà®¿à®®à¯à®®à®®à¯", kanni: "à®•à®©à¯à®©à®¿", thulam: "à®¤à¯à®²à®¾à®®à¯", viruchigam: "à®µà®¿à®°à¯à®šà¯à®šà®¿à®•à®®à¯",
                              dhanusu: "à®¤à®©à¯à®šà¯", makaram: "à®®à®•à®°à®®à¯", kumbam: "à®•à¯à®®à¯à®ªà®®à¯", meenam: "à®®à¯€à®©à®®à¯" }[prefs.rasi] ?? prefs.rasi
                          : prefs.rasi.charAt(0).toUpperCase() + prefs.rasi.slice(1))
                        : (isTamil ? "à®°à®¾à®šà®¿ à®¤à¯‡à®°à¯à®µà¯ à®šà¯†à®¯à¯à®¯à®µà¯à®®à¯" : "Select your rasi")}
                    </Text>
                    {p && (
                      <Text style={styles.heroSub}>
                        {p.nakshatra.name} Â· {p.tithi.name}
                      </Text>
                    )}
                  </View>
                  <SunMedium size={56} color={C.surface} strokeWidth={1.5} />
                </View>
                {p?.specialTithiDay && (
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>
                      {p.specialTithiDay.name === "POURNAMI"
                        ? t(strings.panchangam.pournami)
                        : t(strings.panchangam.amavasai)}
                    </Text>
                  </View>
                )}
                {p?.isKarinaal && (
                  <View style={[styles.heroBadge, { backgroundColor: C.maroon }]}>
                    <Text style={styles.heroBadgeText}>{t(strings.panchangam.karinaal_badge)}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Nalla Neram / Kalam Strip */}
        {isPanchangamLoading ? (
          <SkeletonCard height={80} />
        ) : isError ? null : p ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kalamRow}>
            {p.kalam.nallaNeram.slice(0, 2).map((slot, i) => (
              <TimeCard
                key={`nalla-${i}`}
                kind="nalla_neram"
                start={formatTime(slot.start)}
                end={formatTime(slot.end)}
              />
            ))}
            {primaryGowri && (
              <GowriCard
                slot={primaryGowri}
                isTamil={isTamil}
                styles={styles}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDetailSheet({
                    title: primaryGowri.name || primaryGowri.label || "Gowri",
                    body: primaryGowri.purpose || primaryGowri.warning || `${formatTime(primaryGowri.start)} - ${formatTime(primaryGowri.end)}`,
                    tone: primaryGowri.warning ? "caution" : "good",
                  });
                }}
              />
            )}
            <TimeCard
              kind="rahu_kalam"
              start={formatTime(p.kalam.rahuKalam.start)}
              end={formatTime(p.kalam.rahuKalam.end)}
            />
            <TimeCard
              kind="yamagandam"
              start={formatTime(p.kalam.yamagandam.start)}
              end={formatTime(p.kalam.yamagandam.end)}
            />
            <TimeCard
              kind="kuligai"
              start={formatTime(p.kalam.kuligai.start)}
              end={formatTime(p.kalam.kuligai.end)}
            />
          </ScrollView>
        ) : null}

        {activityChips.length > 0 && (
          <ActivityChipRow
            chips={activityChips}
            styles={styles}
            onSelect={(chip) => {
              Haptics.selectionAsync();
              setDetailSheet({
                title: chip.label,
                body: chip.detail,
                tone: chip.ok ? "good" : "caution",
              });
            }}
          />
        )}
        {/* Rasi Palan Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "à®‡à®©à¯à®±à¯ˆà®¯ à®°à®¾à®šà®¿ à®ªà®²à®©à¯" : "Today's Rasi Palan"}
          </Text>
          {isPanchangamLoading ? (
            <SkeletonCard height={120} />
          ) : (
            <RasiPalanCard
              rasiName={
                rasiPalanData
                  ? (isTamil ? rasiPalanData.rasiName.ta : rasiPalanData.rasiName.en)
                  : prefs?.rasi
                    ? prefs.rasi.charAt(0).toUpperCase() + prefs.rasi.slice(1)
                    : (isTamil ? "ராசி தேர்வு செய்யவும்" : "Select rasi")
              }
              palanText={
                rasiPalanData
                  ? (isTamil ? rasiPalanData.body.ta : rasiPalanData.body.en)
                  : prefs?.rasi
                    ? (isTamil ? "ஏற்றுகிறது…" : "Loading…")
                    : (isTamil ? "உங்கள் ராசியை தேர்வு செய்யுங்கள்." : "Select your rasi to see today's palan.")
              }
              onReadMore={
                !prefs?.rasi
                  ? () => router.push("/(onboarding)/rasi-picker")
                  : undefined
              }
            />
          )}
        </View>

        {tier !== "guest" && nextEvent && (
          <TouchableOpacity
            style={styles.eventCountdown}
            activeOpacity={0.86}
            onPress={() => router.push("/(tabs)/insights" as Href)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.eventKicker}>{isTamil ? "Next significant window" : "Next significant window"}</Text>
              <Text style={[styles.eventTitle, isTamil ? TamilType.bodySmall : EnType.bodySmall]} numberOfLines={2}>
                {biText(nextEvent.headline, isTamil, nextEvent.eventType)}
              </Text>
              <Text style={styles.eventMeta}>{dateDistanceLabel(nextEvent.startDate, isTamil)} - {nextEvent.confidence.toLowerCase()} confidence</Text>
            </View>
            <ChevronRight size={18} color={C.textTertiary} strokeWidth={1.5} />
          </TouchableOpacity>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            activeOpacity={0.86}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setJournalOpen(true);
            }}
          >
            <View style={styles.quickActionInner}><BookOpen size={18} color={C.surface} strokeWidth={1.5} /><Text style={styles.quickActionText}>{isTamil ? "Log moment" : "Log moment"}</Text></View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionSecondary]}
            activeOpacity={0.86}
            onPress={() => router.push("/ask-vinaadi" as Href)}
          >
            <View style={styles.quickActionInner}><Sparkles size={18} color={C.saffron} strokeWidth={1.5} /><Text style={[styles.quickActionText, styles.quickActionSecondaryText]}>{isTamil ? "Ask Vinaadi" : "Ask Vinaadi"}</Text></View>
          </TouchableOpacity>
        </View>

        {/* Decision prompt card — daily card surfacing the /ask-vinaadi decision mode */}
        <TouchableOpacity
          style={styles.decisionCard}
          activeOpacity={0.86}
          onPress={() => router.push("/ask-vinaadi" as Href)}
          accessibilityLabel={isTamil ? "முடிவு எடுக்க விநாடியிடம் கேளுங்கள்" : "Facing a decision? Ask Vinaadi."}
          accessibilityRole="button"
          accessibilityHint={isTamil ? "விநாடி AI திறக்கும்" : "Opens Vinaadi AI assistant"}
        >
          <View style={styles.decisionTop}>
            <Text style={styles.decisionKicker}>{isTamil ? "இன்றைய முடிவு" : "Decision of the day"}</Text>
            <ChevronRight size={18} color={C.gold} strokeWidth={1.5} />
          </View>
          <Text style={styles.decisionTitle}>
            {isTamil
              ? "இன்று ஒரு முடிவை எதிர்கொள்கிறீர்களா?"
              : "Facing a decision today?"}
          </Text>
          <Text style={styles.decisionBody}>
            {isTamil
              ? "விநாடியிடம் கேளுங்கள் — உங்கள் தசா மற்றும் கோச்சாரத்தை வைத்து சரியான நேரத்தை அறியலாம்."
              : "Ask Vinaadi — your dasha and transits reveal the right timing for your decision."}
          </Text>
        </TouchableOpacity>
        {/* Ad unit â€” guest only */}
        {tier === "guest" && <NativeAdUnit />}

        {/* Panchangam Details — collapsible */}
        {p && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.panchangamToggle}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                setPanchangamExpanded((v) => !v);
              }}
              accessibilityRole="button"
              accessibilityLabel={isTamil ? "Panchangam Details" : "Panchangam Details"}
              accessibilityState={{ expanded: panchangamExpanded }}
            >
              <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "à®ªà®žà¯à®šà®¾à®™à¯à®• à®µà®¿à®µà®°à®®à¯" : "Panchangam Details"}
              </Text>
              <ChevronRight
                size={16}
                color={C.textTertiary}
                strokeWidth={1.5}
                style={{ transform: [{ rotate: panchangamExpanded ? "90deg" : "0deg" }] }}
              />
            </TouchableOpacity>
            {panchangamExpanded && (
              <View style={styles.panchangamGrid}>
                {[
                  { label: t(strings.panchangam.tithi), value: p.tithi.name },
                  { label: t(strings.panchangam.nakshatra), value: p.nakshatra.name },
                  { label: t(strings.panchangam.yoga), value: p.yoga.name },
                  { label: t(strings.panchangam.sunrise), value: formatTime(p.sunrise) },
                  { label: t(strings.panchangam.sunset), value: formatTime(p.sunset) },
                  { label: t(strings.panchangam.karana), value: p.karana.name },
                ].map((item) => (
                  <View key={item.label} style={styles.datumCard}>
                    <Text style={styles.datumLabel}>{item.label}</Text>
                    <Text style={[styles.datumValue, { fontFamily: T.subheading.fontFamily }]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {isError && <ErrorCard onRetry={refetchPanchangam} />}

        {/* Soft Signup Prompt (shown after 3+ days) */}
        {tier === "guest" && showSignupPrompt && (
          <View style={styles.signupPrompt}>
            <TouchableOpacity
              onPress={() => setShowSignupPrompt(false)}
              style={styles.promptDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={C.textTertiary} strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={[styles.promptHeading, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
              {isTamil
                ? "à®‰à®™à¯à®•à®³à¯ à®œà®¾à®¤à®•à®¤à¯à®¤à®¿à®²à¯ à®‡à®©à¯à®±à¯ˆà®¯ à®¨à®¾à®³à¯ à®Žà®ªà¯à®ªà®Ÿà®¿?"
                : "How does today look for YOUR birth chart?"}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.promptCta}>
                {isTamil ? "à®‡à®²à®µà®šà®®à®¾à®• à®…à®±à®¿à®¨à¯à®¤à¯à®•à¯Šà®³à¯ â†’" : "Find out free â†’"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal transparent visible={!!detailSheet} animationType="slide" onRequestClose={() => setDetailSheet(null)}>
          <TouchableOpacity style={styles.modalScrim} activeOpacity={1} onPress={() => setDetailSheet(null)}>
            <TouchableOpacity activeOpacity={1} style={styles.detailSheet}>
              <View style={[styles.sheetHandle, detailSheet?.tone === "caution" && { backgroundColor: C.caution }]} />
              <Text style={styles.sheetTitle}>{detailSheet?.title}</Text>
              <Text style={styles.sheetBody}>{detailSheet?.body}</Text>
              <TouchableOpacity style={styles.sheetDoneBtn} onPress={() => setDetailSheet(null)}>
                <Text style={styles.sheetDoneText}>{isTamil ? "Done" : "Done"}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <Modal transparent visible={journalOpen} animationType="slide" onRequestClose={() => setJournalOpen(false)}>
          <TouchableOpacity style={styles.modalScrim} activeOpacity={1} onPress={() => setJournalOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.journalSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{isTamil ? "Log a moment" : "Log a moment"}</Text>
              <Text style={styles.journalStep}>{isTamil ? "What happened?" : "What happened?"}</Text>
              <ChipStrip
                items={JOURNAL_MOMENTS}
                selected={journalMoment}
                onSelect={setJournalMoment}
                layout="wrap"
              />
              <Text style={styles.journalStep}>{isTamil ? "Which area?" : "Which area?"}</Text>
              <ChipStrip
                items={JOURNAL_AREAS}
                selected={journalArea}
                onSelect={setJournalArea}
                layout="wrap"
              />
              <TextInput
                value={journalNote}
                onChangeText={setJournalNote}
                maxLength={200}
                multiline
                placeholder={isTamil ? "Optional note" : "Optional note"}
                placeholderTextColor={C.textTertiary}
                style={styles.journalInput}
              />
              <TouchableOpacity style={styles.sheetDoneBtn} onPress={saveJournalEntry}>
                <Text style={styles.sheetDoneText}>{isTamil ? "Save" : "Save"}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

function LifeAreaPulse({
  areas,
  isTamil,
  C,
  onSelect,
  styles,
}: {
  areas: LifeAreaData[];
  isTamil: boolean;
  C: ColorTokens;
  onSelect: (area: LifeAreaData) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.areaPulseRow}>
      {areas.map((area) => {
        const tone = area.score >= SCORE_THRESHOLDS.HIGH ? C.green : area.score >= SCORE_THRESHOLDS.MID ? C.gold : C.caution;
        const score = Math.round(area.score);
        const rawLabel = biText(area.label, isTamil, area.area);
        const label = rawLabel.length > 7 ? rawLabel.slice(0, 6) + "…" : rawLabel;
        return (
          <TouchableOpacity
            key={area.area}
            style={styles.areaDotWrap}
            activeOpacity={0.78}
            onPress={() => onSelect(area)}
            accessibilityLabel={`${rawLabel}: ${score}`}
            accessibilityRole="button"
          >
            <View style={[styles.areaDot, { backgroundColor: tone }]}>
              <Text style={styles.areaDotScore}>{score}</Text>
            </View>
            <Text numberOfLines={1} style={styles.areaDotLabel}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function GowriCard({ slot, isTamil, onPress, styles }: { slot: GowriSlot; isTamil: boolean; onPress: () => void; styles: ReturnType<typeof makeStyles> }) {
  return (
    <TouchableOpacity style={styles.gowriCard} activeOpacity={0.86} onPress={onPress}>
      <View style={styles.gowriChip}>
        <Text style={styles.gowriChipText}>G</Text>
      </View>
      <Text style={styles.gowriTime}>{formatTime(slot.start)} - {formatTime(slot.end)}</Text>
      <Text style={styles.gowriLabel} numberOfLines={1}>{slot.name || slot.label || (isTamil ? "Gowri" : "Gowri")}</Text>
    </TouchableOpacity>
  );
}

function ActivityChipRow({
  chips,
  onSelect,
  styles,
}: {
  chips: Array<{ label: string; ok: boolean; detail: string }>;
  onSelect: (chip: { label: string; ok: boolean; detail: string }) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityRow} contentContainerStyle={styles.activityContent}>
      {chips.map((chip) => (
        <TouchableOpacity
          key={chip.label}
          activeOpacity={0.82}
          onPress={() => onSelect(chip)}
          style={[styles.activityChip, !chip.ok && styles.activityChipCaution]}
        >
          <Text style={[styles.activityChipText, !chip.ok && styles.activityChipTextCaution]}>{chip.ok ? "+" : "!"} {chip.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  scroll: { paddingBottom: S.xxl },
  offlineBanner: {
    backgroundColor: C.caution,
    paddingVertical: 6,
    paddingHorizontal: S.base,
    alignItems: "center",
  },
  offlineBannerText: {
    fontFamily: EnFont.SemiBold,
    fontSize: 12,
    color: C.surface,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  logo: { fontFamily: TamilFont.Bold, fontSize: 14, color: C.saffron, flex: 1 },
  headerCenter: { flex: 2, alignItems: "center" },
  tamilDate: { fontSize: 14, lineHeight: 20, color: C.textPrimary },
  engDate: { fontFamily: EnFont.Regular, fontSize: 11, color: C.textTertiary },
  cityChip: {
    flex: 1,
    alignItems: "flex-end",
  },
  cityText: { fontFamily: EnFont.Regular, fontSize: 12, color: C.textSecond },

  hero: { paddingHorizontal: S.base, paddingTop: S.base },
  heroCard: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.card,
    padding: S.base,
    minHeight: 160,
    overflow: "hidden",
  },
  heroLabel: {
    fontFamily: TamilFont.Regular,
    fontSize: 13,
    color: `${C.surface}CC`,
    marginBottom: S.sm,
  },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroRasi: {
    fontFamily: TamilFont.Bold,
    fontSize: 28,
    lineHeight: 36,
    color: C.surface,
  },
  heroSub: {
    fontFamily: TamilFont.Regular,
    fontSize: 14,
    lineHeight: 20,
    color: `${C.surface}D9`,
    marginTop: S.xs,
  },
  heroSymbol: { fontSize: 64, opacity: 0.9 },
  heroBadge: {
    backgroundColor: C.gold,
    borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: S.sm,
  },
  heroBadgeText: {
    fontFamily: TamilFont.Bold,
    fontSize: 11,
    lineHeight: 16,
    color: C.surface,
  },

  greeting: { color: C.textSecond, marginTop: 2 },
  bellIcon: { fontSize: 22 },
  scoreHeroCard: {
    backgroundColor: C.darkSurface,
    borderRadius: RADIUS.xl,
    padding: S.xl,
    gap: S.lg,
    borderWidth: 1,
    borderColor: C.darkRaised,
  },
  scoreHeroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: S.md },
  heroKickerRow: { flexDirection: "row", alignItems: "center", gap: S.xs },
  scoreHeroLabel: { color: C.indigoText },
  scoreHeroMain: { alignItems: "center", justifyContent: "center", flex: 1, minHeight: 120 },
  scoreHeroCopy: { position: "absolute", alignItems: "center", justifyContent: "center" },
  scoreHeroNumber: { fontFamily: EnFont.ExtraBold, fontSize: 40, lineHeight: 46, color: C.indigoText },
  scoreHeroState: { fontFamily: EnFont.Bold, fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 1 },
  bestWindowPanel: {
    backgroundColor: C.indigoSurface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: C.darkRaised,
    padding: S.md,
    gap: S.xs,
  },
  bestWindowLabel: { fontFamily: EnFont.Bold, fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 0 },
  bestWindowTime: { fontFamily: EnFont.ExtraBold, fontSize: 26, lineHeight: 32, color: C.indigoText },
  scoreHeroText: { color: C.indigoText, opacity: 0.78 },
  windowChipRow: { flexDirection: "row", gap: S.xs, flexWrap: "wrap", marginTop: 4 },
  windowChip: {
    backgroundColor: C.darkRaised,
    borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm,
    paddingVertical: 2,
  },
  windowChipText: { fontFamily: EnFont.SemiBold, fontSize: 11, color: C.indigoText },
  scoreArrow: { fontFamily: EnFont.Bold, fontSize: 22, color: C.textTertiary },
  chandraCard: {
    marginHorizontal: S.base, marginBottom: S.sm,
    backgroundColor: C.cautionLight, borderRadius: RADIUS.card,
    borderLeftWidth: 4, borderLeftColor: C.caution,
    flexDirection: "row", alignItems: "center", gap: S.sm,
    paddingHorizontal: S.md, paddingVertical: S.sm,
  },
  chandraIcon: { fontSize: 18 },
  chandraText: { flex: 1, color: C.caution },
  chandraArrow: { fontFamily: EnFont.Bold, fontSize: 18, color: C.caution },
  kalamRow: { paddingLeft: S.base, paddingVertical: S.base },
  areaPulseRow: {
    flexDirection: "row",
    marginHorizontal: S.base,
    marginTop: S.sm,
    gap: S.sm,
  },
  areaDotWrap: {
    flex: 1,
    alignItems: "center",
    gap: S.xs,
  },
  areaDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.deepIndigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  areaDotScore: {
    fontFamily: EnFont.ExtraBold,
    fontSize: 16,
    color: C.surface,
  },
  areaDotLabel: {
    fontFamily: EnFont.SemiBold,
    fontSize: 10,
    color: C.textSecond,
    textAlign: "center",
  },
  cosmicAlert: {
    marginHorizontal: S.base,
    marginTop: S.sm,
    backgroundColor: C.goldLight,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: `${C.caution}2E`,
    padding: S.md,
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
  },
  cosmicAlertGood: { backgroundColor: C.greenLight, borderColor: `${C.green}2E` },
  cosmicDot: { width: 10, height: 10, borderRadius: 999 },
  cosmicKicker: { fontFamily: EnFont.Bold, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0 },
  cosmicTitle: { color: C.textPrimary, marginTop: 2 },
  cosmicArrow: { fontFamily: EnFont.Bold, fontSize: 16, color: C.textTertiary },
  gowriCard: {
    width: 120,
    borderRadius: RADIUS.card,
    padding: S.md,
    marginRight: S.sm,
    backgroundColor: C.surface,
    shadowColor: C.deepIndigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gowriChip: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: S.xs, backgroundColor: C.gold },
  gowriChipText: { color: C.surface, fontFamily: EnFont.ExtraBold, fontSize: 13 },
  gowriTime: { fontFamily: EnFont.SemiBold, fontSize: 14, lineHeight: 20, color: C.textPrimary, marginBottom: 2 },
  gowriLabel: { fontFamily: EnFont.Regular, fontSize: 11, lineHeight: 16, color: C.textSecond },
  activityRow: { paddingLeft: S.base, marginBottom: S.xs },
  activityContent: { gap: S.xs, paddingRight: S.base },
  activityChip: {
    borderRadius: RADIUS.chip,
    backgroundColor: C.greenLight,
    borderWidth: 1,
    borderColor: `${C.green}2A`,
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
  },
  activityChipCaution: { backgroundColor: C.cautionLight, borderColor: `${C.caution}2E` },
  activityChipText: { fontFamily: EnFont.Bold, fontSize: 12, color: C.green },
  activityChipTextCaution: { color: C.caution },
  eventCountdown: {
    marginHorizontal: S.base,
    marginTop: S.base,
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.md,
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
  },
  eventKicker: { fontFamily: EnFont.Bold, fontSize: 11, color: C.saffron, textTransform: "uppercase", letterSpacing: 0 },
  eventTitle: { color: C.textPrimary, marginTop: 3 },
  eventMeta: { marginTop: 4, fontFamily: EnFont.SemiBold, fontSize: 12, color: C.textSecond },
  eventArrow: { fontFamily: EnFont.Bold, fontSize: 18, color: C.textTertiary },
  quickActions: { flexDirection: "row", gap: S.sm, marginHorizontal: S.base, marginTop: S.base },
  quickActionBtn: { flex: 1, minHeight: 48, borderRadius: RADIUS.button, backgroundColor: C.saffron, paddingVertical: S.sm, alignItems: "center", justifyContent: "center" },
  quickActionSecondary: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.divider },
  quickActionInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs },
  quickActionText: { fontFamily: EnFont.ExtraBold, fontSize: 13, color: C.surface },
  quickActionSecondaryText: { color: C.saffron },
  modalScrim: { flex: 1, backgroundColor: C.deepIndigo, justifyContent: "flex-end" },
  detailSheet: { backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: S.lg, gap: S.sm },
  journalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: S.lg, gap: S.sm, maxHeight: "86%" },
  sheetHandle: { alignSelf: "center", width: 42, height: 4, borderRadius: 999, backgroundColor: C.gold, marginBottom: S.xs },
  sheetTitle: { fontFamily: EnFont.ExtraBold, fontSize: 20, lineHeight: 26, color: C.textPrimary },
  sheetBody: { fontFamily: EnFont.Regular, fontSize: 14, lineHeight: 22, color: C.textSecond },
  sheetDoneBtn: { marginTop: S.sm, borderRadius: RADIUS.button, backgroundColor: C.saffron, paddingVertical: S.sm, alignItems: "center" },
  sheetDoneText: { fontFamily: EnFont.ExtraBold, fontSize: 14, color: C.surface },
  journalStep: { marginTop: S.xs, fontFamily: EnFont.Bold, fontSize: 13, color: C.textSecond },
  journalInput: {
    minHeight: 84,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.divider,
    padding: S.md,
    color: C.textPrimary,
    fontFamily: EnFont.Regular,
    textAlignVertical: "top",
  },
  section: { paddingHorizontal: S.base, marginTop: S.base, gap: S.sm },
  sectionTitle: { color: C.textPrimary },
  panchangamToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: S.xs,
  },

  panchangamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: S.sm,
  },
  datumCard: {
    width: "47%",
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: S.md,
    shadowColor: C.deepIndigo,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  datumLabel: {
    fontFamily: EnFont.Regular,
    fontSize: 11,
    color: C.textTertiary,
    marginBottom: 3,
  },
  datumValue: { fontSize: 14, lineHeight: 20, color: C.textPrimary },

  signupPrompt: {
    margin: S.base,
    backgroundColor: C.alertLight,
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.sm,
  },
  promptDismiss: { alignSelf: "flex-end" },
  promptDismissText: { color: C.textTertiary, fontSize: 14 },
  promptHeading: { color: C.textPrimary },
  promptCta: {
    fontFamily: EnFont.SemiBold,
    fontSize: 14,
    color: C.saffron,
  },
  decisionCard: {
    marginHorizontal: S.base,
    marginTop: S.base,
    backgroundColor: C.deepIndigo,
    borderRadius: RADIUS.card,
    padding: S.lg,
    gap: S.xs,
  },
  decisionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  decisionKicker: { fontFamily: EnFont.Bold, fontSize: 11, color: C.gold, textTransform: "uppercase", letterSpacing: 0 },
  decisionArrow: { fontFamily: EnFont.Bold, fontSize: 18, color: `${C.surface}80` },
  decisionTitle: { fontFamily: EnFont.ExtraBold, fontSize: 18, lineHeight: 24, color: C.surface },
  decisionBody: { fontFamily: EnFont.Regular, fontSize: 13, lineHeight: 19, color: `${C.surface}B8` },

  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    backgroundColor: C.saffron,
    borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
    marginRight: S.sm,
  },
  streakText: {
    fontFamily: EnFont.Bold,
    fontSize: 13,
    color: C.surface,
  },
  });
}
