import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput,
  TouchableOpacity, useWindowDimensions, View,
} from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Svg, { Path } from "react-native-svg";
import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/context/ToastContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { FadeInDown } from "react-native-reanimated";
import { entranceDelay, spring } from "@/theme/motion";
import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType, TamilFont, EnFont } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { useColors } from "@/hooks/useColors";
import { TimeCard } from "@/components/TimeCard";
import { ListItem } from "@/components/ListItem";
import { ChipStrip, type ChipItem } from "@/components/ChipStrip";
import { RasiPalanCard } from "@/components/RasiPalanCard";
import { ScoreRing } from "@/components/ScoreRing";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";
import { NativeAdUnit } from "@/components/AdUnit";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { SharedTransitionView } from "@/components/SharedTransitionView";
import { getDailySnapshot } from "@/api/snapshot";
import { pingStreak } from "@/api/streak";
import type { LifeAreaData } from "@/api/lifeAreas";
import type { LifeEventWindow } from "@/api/lifeEvents";
import { moonHouseImpact } from "@/api/transits";
import type { TransitItem } from "@/api/transits";
import { loadGuestPrefs } from "@/features/guest/guestStore";
import { useJournal } from "@/hooks/useJournal";
import { useConversionPrompt } from "@/hooks/useConversionPrompt";
import { usePushNotificationOptIn } from "@/hooks/usePushNotificationOptIn";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { pushWidgetData } from "@/lib/widgetBridge";
import { biText } from "@/lib/i18n";
import { formatTimeLang, formatDateLang } from "@/lib/formatLocale";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import type { GuestPrefs } from "@/features/guest/guestStore";
import type { DailyGuidanceData } from "@vinaadi/shared";
import { tKarana, tNakshatra, tTithi, tYoga } from "@vinaadi/shared";
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


function OrbitIcon({ size, color }: { size?: number; color?: string }) {
  return <Ionicons name="planet-outline" size={size ?? 24} color={color} />;
}

const JOURNAL_MOMENTS: ChipItem[] = [
  { key: "win",       label: "Big win",    labelTa: "வெற்றி" },
  { key: "hard_day",  label: "Hard day",   labelTa: "கஷ்டமான நாள்" },
  { key: "decision",  label: "Decision",   labelTa: "முடிவு" },
  { key: "milestone", label: "Milestone",  labelTa: "மைல்கல்" },
  { key: "quiet",     label: "Nothing yet",labelTa: "இன்னும் எதுவும் இல்லை" },
];

const JOURNAL_AREAS: ChipItem[] = [
  { key: "career",    label: "Career",    labelTa: "தொழில்" },
  { key: "love",      label: "Love",      labelTa: "அன்பு" },
  { key: "health",    label: "Health",    labelTa: "உடல்நலம்" },
  { key: "money",     label: "Money",     labelTa: "பணம்" },
  { key: "family",    label: "Family",    labelTa: "குடும்பம்" },
  { key: "spiritual", label: "Spiritual", labelTa: "ஆன்மீகம்" },
  { key: "general",   label: "General",   labelTa: "பொதுவான" },
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

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
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

function getCosmicAlert(g: ExtendedGuidance | undefined, transit: TransitItem | undefined, isTamil: boolean, lang: "en" | "ta" = "en"): DetailSheetState {
  if (g?.isChandrashtama ?? g?.is_chandrashtama) {
    const end = g.chandrashtamaEnds ?? g.chandrashtama_ends;
    return {
      title: isTamil ? "Chandrashtama alert" : "Chandrashtama alert",
      // `end` is always an instant later today — the backend sends it only when
      // Chandrashtama actually lifts before the day is out, and null (the
      // untimed branch) whenever the stretch runs on. So the date part carries
      // no information and the time is the whole point; toLocaleDateString here
      // rendered "Ends: 9/1/2026", which tells the reader nothing they did not
      // already know.
      body: end
        ? `Ends: ${new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : (isTamil ? "Move slowly today." : "Move slowly today."),
      tone: "caution",
    };
  }
  if (transit) {
    const impact = moonHouseImpact(transit.planet, transit.impactFromMoon);
    return {
      title: isTamil ? transit.labelTa : `${transit.labelEn} transit`,
      body: `${transit.fromRasi} → ${transit.toRasi}`,
      tone: impact === "challenging" ? "caution" : impact === "good" ? "good" : "neutral",
    };
  }
  if (g?.cautionWindows?.length) {
    const first = g.cautionWindows[0];
    return {
      title: isTamil ? "Timing caution" : "Timing caution",
      body: `${first.type}: ${formatTimeLang(first.start, lang)} - ${formatTimeLang(first.end, lang)}`,
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
  const [, setJournalOpen] = useState(false);
  const detailSheetRef = useRef<BottomSheet>(null);
  const journalSheetRef = useRef<BottomSheet>(null);
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
      // Server-side streak for signed-in users; the stored local value shows
      // instantly and doubles as a one-time seed for the server row.
      void AsyncStorage.getItem("vinaadi_streak_days").then((val) => {
        const localDays = val ? Number(val) : NaN;
        if (Number.isFinite(localDays) && localDays > 0) setStreakCount(localDays);
        pingStreak(Number.isFinite(localDays) && localDays > 0 ? localDays : undefined)
          .then((resp) => setStreakCount(resp.data.days))
          .catch(() => {
            // Offline — the locally stored value stands.
          });
      });
    } else {
      void recordTodayVisit().then(() => {
        void AsyncStorage.getItem("vinaadi_streak_days").then((val) => {
          if (val) setStreakCount(Number(val));
        });
      });
    }
  }, [tier, recordTodayVisit]);

  const lat = prefs?.lat ?? undefined;
  const lon = prefs?.lon ?? undefined;
  const hasLocation = lat != null && lon != null;
  const isLocationMissing = !!prefs && !hasLocation;
  const tz = "Asia/Kolkata";

  const todayDateStr = new Date().toISOString().split("T")[0];

  const {
    data: snapshotData,
    isLoading: isPanchangamLoading,
    isFetching: isSnapshotFetching,
    isError,
    refetch: refetchSnapshot,
  } = useQuery({
    queryKey: ["daily-snapshot", lat, lon, prefs?.rasi, primaryChartId, todayDateStr],
    queryFn: () =>
      getDailySnapshot({
        lat: lat ?? undefined,
        lng: lon ?? undefined,
        tz,
        rasi: prefs?.rasi ?? undefined,
        chartId: primaryChartId ?? undefined,
      }),
    enabled: !!prefs,
    staleTime: msUntilMidnight(),
  });

  const p = snapshotData?.data.panchangam ?? undefined;
  const rasiPalanData = snapshotData?.data.rasi_palan ?? null;
  const g = (snapshotData?.data.guidance ?? undefined) as ExtendedGuidance | undefined;
  const { state: pushPromptState, dismiss: dismissPushPrompt, requestAndRegister: requestPushPermission } = usePushNotificationOptIn(!!g);

  // Push today's snapshot to native widget storage whenever data freshens.
  useEffect(() => {
    if (!p) return;
    const firstNalla = p.kalam.nallaNeram[0];
    pushWidgetData({
      nallaNeram: firstNalla
        ? `${formatTime(firstNalla.start)} – ${formatTime(firstNalla.end)}`
        : "–",
      rahuKalam: `${formatTime(p.kalam.rahuKalam.start)} – ${formatTime(p.kalam.rahuKalam.end)}`,
      rasiPalan: g ? (lang === "ta" ? g.text?.ta ?? "" : g.text?.en ?? "") : "",
      tamilDate: p.tamilDate ? (lang === "ta" ? p.tamilDate.ta : p.tamilDate.en) : "",
      lang,
    });
  }, [p, g, lang]);

  const fmt = (iso: string) => formatTimeLang(iso, lang);
  const today = new Date();
  const todayLabel = formatDateLang(today, lang);
  const tamilDate = p?.tamilDate ? (isTamil ? p.tamilDate.ta : p.tamilDate.en) : todayLabel;
  const cityName = prefs?.city ?? (isLocationMissing ? (isTamil ? "இடத்தை அமைக்கவும்" : "Set location") : "Chennai");
  const areaPulse = snapshotData?.data.life_areas ?? [];
  const nextEvent = useMemo(
    () => getNextEvent((snapshotData?.data.life_events ?? []) as LifeEventWindow[]),
    [snapshotData]
  );
  const gowriSlots = getGowriSlots(p as any);
  const primaryGowri = gowriSlots[0];
  const cosmicAlert = getCosmicAlert(g, (snapshotData?.data.transits?.[0] ?? undefined) as TransitItem | undefined, isTamil, lang);
  const bestActionWindow = g?.bestWindows?.[0] ?? null;
  const hasDoshamWarning = !!(g?.is_chandrashtama || (g?.cautionWindows?.length ?? 0) > 0 || (g?.score !== undefined && g.score < SCORE_THRESHOLDS.MID));
  const refreshing = isSnapshotFetching;
  const activityChips = useMemo(() => {
    if (!g) return [];
    const chips = [] as { label: string; ok: boolean; detail: string }[];
    if (g.bestWindows?.[0]) {
      const w = g.bestWindows[0];
      chips.push({ label: t(strings.chips.start_work), ok: true, detail: `${w.type}: ${fmt(w.start)} - ${fmt(w.end)}` });
    }
    if (g.currentHoraLord) {
      chips.push({ label: `${g.currentHoraLord} ${t(strings.chips.hora_suffix)}`, ok: true, detail: biText(g.actionSuggestion, isTamil, "Use this window for focused action.") });
    }
    chips.push({ label: t(strings.chips.travel),    ok: g.score >= SCORE_THRESHOLDS.MID, detail: biText(g.reasons?.panchangam, isTamil, biText(g.actionSuggestion, isTamil)) });
    chips.push({ label: t(strings.chips.contracts), ok: !g.cautionWindows?.length && g.score >= SCORE_THRESHOLDS.HIGH, detail: biText(g.cautionSuggestion, isTamil, "Check caution windows before signing.") });
    if (g.cautionWindows?.[0]) {
      const w = g.cautionWindows[0];
      chips.push({ label: t(strings.chips.avoid_rush), ok: false, detail: `${w.type}: ${fmt(w.start)} - ${fmt(w.end)}` });
    }
    return chips.slice(0, 5);
  }, [g, isTamil, t, strings]);

  const openDetailSheet = useCallback((sheet: DetailSheetState) => {
    setDetailSheet(sheet);
    detailSheetRef.current?.expand();
  }, []);

  const closeDetailSheet = useCallback(() => {
    detailSheetRef.current?.close();
    setDetailSheet(null);
  }, []);

  const openJournalSheet = useCallback(() => {
    setJournalOpen(true);
    journalSheetRef.current?.expand();
  }, []);

  const closeJournalSheet = useCallback(() => {
    journalSheetRef.current?.close();
    setJournalOpen(false);
  }, []);

  const refreshAll = () => {
    void refetchSnapshot();
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
      activeTransit: (snapshotData?.data.transits?.[0] ?? null) as TransitItem | null,
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
              <Text style={styles.logo}>விநாடி AI</Text>
              {user?.displayName ? (
                <Text style={[styles.greeting, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? `வணக்கம், ${user.displayName}` : `Welcome back, ${user.displayName}`}
                </Text>
              ) : null}
            </View>
            {streakCount >= 1 && (
              <View style={styles.streakChip} accessibilityLabel={`${streakCount}-day streak`}>
                <Ionicons name="flame-outline" size={13} color={C.surface} /><Text style={styles.streakText}>{streakCount}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => router.push("/notifications/inbox" as Href)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={22} color={C.textSecond} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.header}>
            <Text style={styles.logo}>விநாடி AI</Text>
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
                    <Ionicons name="sunny-outline" size={16} color={C.gold} />
                    <Text style={[styles.scoreHeroLabel, isTamil ? TamilType.caption : EnType.caption]}>
                      {t(strings.tabs.today)} · {cityName}
                    </Text>
                    <ThirukanithamBadge size="sm" style={{ alignSelf: "center" }} />
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={C.textTertiary} />
                </View>

                <View style={styles.scoreHeroMain}>
                  <SharedTransitionView entering={FadeInDown.delay(entranceDelay.hero).springify().stiffness(spring.default.stiffness).damping(spring.default.damping)} sharedTransitionTag="score-ring">
                    <ScoreRing score={g.score} size={132} />
                  </SharedTransitionView>
                  <View style={styles.scoreHeroCopy}>
                    <Text style={styles.scoreHeroNumber}>{g.score}</Text>
                    <Text style={styles.scoreHeroState}>
                      {g.score >= SCORE_THRESHOLDS.HIGH
                        ? t(strings.today.score_state_high)
                        : g.score >= SCORE_THRESHOLDS.MID
                          ? t(strings.today.score_state_mid)
                          : t(strings.today.score_state_low)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bestWindowPanel}>
                  <Text style={styles.bestWindowLabel}>{t(strings.today.best_window)}</Text>
                  <Text style={styles.bestWindowTime}>
                    {bestActionWindow
                      ? `${fmt(bestActionWindow.start)} - ${fmt(bestActionWindow.end)}`
                      : primaryGowri
                        ? `${fmt(primaryGowri.start)} - ${fmt(primaryGowri.end)}`
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
        {tier !== "guest" && pushPromptState === "should_show" && (
          <View style={styles.pushPromptCard}>
            <View style={styles.pushPromptBody}>
              <Ionicons name="notifications-outline" size={20} color={C.saffron} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.pushPromptTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "காலை வழிகாட்டுதல் அறிவிப்பு" : "Morning guidance notifications"}
                </Text>
                <Text style={[styles.pushPromptBody2, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil
                    ? "நாள்தோறும் உங்கள் திருகணிதம் மதிப்பெண் மற்றும் சிறந்த நேரங்களை காலையிலேயே பெறுங்கள்."
                    : "Get your daily Thirukanitham score and best windows every morning."}
                </Text>
              </View>
            </View>
            <View style={styles.pushPromptActions}>
              <TouchableOpacity
                style={styles.pushPromptEnable}
                activeOpacity={0.86}
                onPress={() => { void requestPushPermission(); }}
              >
                <Text style={styles.pushPromptEnableText}>
                  {isTamil ? "இயக்கு" : "Enable"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pushPromptDismiss}
                activeOpacity={0.86}
                onPress={() => { void dismissPushPrompt(); }}
              >
                <Text style={styles.pushPromptDismissText}>
                  {isTamil ? "பிறகு" : "Later"}
                </Text>
              </TouchableOpacity>
            </View>
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
              openDetailSheet({
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
              openDetailSheet(cosmicAlert);
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
            <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
          </TouchableOpacity>
        )}
        {/* Dasha Timeline quick-link (registered users with a chart) */}
        {tier !== "guest" && primaryChartId && (
          <ListItem
            icon={OrbitIcon}
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
                  <Text style={styles.heroLabel}>{isTamil ? "இன்று" : "Today"}</Text>
                  <ThirukanithamBadge size="sm" />
                </View>
                <View style={styles.heroRow}>
                  <View>
                    <Text style={styles.heroRasi}>
                      {prefs?.rasi
                        ? (isTamil
                          ? { mesham: "மேஷம்", rishabam: "ரிஷபம்", mithunam: "மிதுனம்", katakam: "கடகம்",
                              simham: "சிம்மம்", kanni: "கன்னி", thulam: "துலாம்", viruchigam: "விருச்சிகம்",
                              dhanusu: "தனுசு", makaram: "மகரம்", kumbam: "கும்பம்", meenam: "மீனம்" }[prefs.rasi] ?? prefs.rasi
                          : prefs.rasi.charAt(0).toUpperCase() + prefs.rasi.slice(1))
                        : (isTamil ? "ராசி தேர்வு செய்யவும்" : "Select your rasi")}
                    </Text>
                    {p && (
                      <Text style={styles.heroSub}>
                        {p.nakshatra.name} · {p.tithi.name}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="sunny-outline" size={56} color={C.surface} />
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
                start={fmt(slot.start)}
                end={fmt(slot.end)}
              />
            ))}
            {primaryGowri && (
              <GowriCard
                slot={primaryGowri}
                isTamil={isTamil}
                styles={styles}
                fmt={fmt}
                onPress={() => {
                  Haptics.selectionAsync();
                  openDetailSheet({
                    title: gowriKalaLabel(primaryGowri.name) || primaryGowri.label || "Gowri",
                    body: primaryGowri.purpose || primaryGowri.warning || `${fmt(primaryGowri.start)} - ${fmt(primaryGowri.end)}`,
                    tone: primaryGowri.warning ? "caution" : "good",
                  });
                }}
              />
            )}
            <TimeCard
              kind="rahu_kalam"
              start={fmt(p.kalam.rahuKalam.start)}
              end={fmt(p.kalam.rahuKalam.end)}
            />
            <TimeCard
              kind="yamagandam"
              start={fmt(p.kalam.yamagandam.start)}
              end={fmt(p.kalam.yamagandam.end)}
            />
            <TimeCard
              kind="kuligai"
              start={fmt(p.kalam.kuligai.start)}
              end={fmt(p.kalam.kuligai.end)}
            />
          </ScrollView>
        ) : null}

        {activityChips.length > 0 && (
          <ActivityChipRow
            chips={activityChips}
            styles={styles}
            onSelect={(chip) => {
              Haptics.selectionAsync();
              openDetailSheet({
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
            {isTamil ? "இன்றைய ராசி பலன்" : "Today's Rasi Palan"}
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
            <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
          </TouchableOpacity>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            activeOpacity={0.86}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              openJournalSheet();
            }}
          >
            <View style={styles.quickActionInner}><Ionicons name="book-outline" size={18} color={C.surface} /><Text style={styles.quickActionText}>{isTamil ? "Log moment" : "Log moment"}</Text></View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionSecondary]}
            activeOpacity={0.86}
            onPress={() => router.push("/ask-vinaadi" as Href)}
          >
            <View style={styles.quickActionInner}><Ionicons name="sparkles-outline" size={18} color={C.saffron} /><Text style={[styles.quickActionText, styles.quickActionSecondaryText]}>{isTamil ? "Ask Vinaadi" : "Ask Vinaadi"}</Text></View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionSecondary]}
            activeOpacity={0.86}
            onPress={async () => {
              trackEvent("share_card_opened");
              const scoreText = g ? `Score: ${g.score}/100` : "";
              const windowText = bestActionWindow
                ? `Best window: ${fmt(bestActionWindow.start)}–${fmt(bestActionWindow.end)}`
                : "";
              const message = [
                isTamil ? "இன்றைய விநாடி பஞ்சாங்கம்" : "My Vinaadi day — powered by Thirukanitham",
                scoreText,
                windowText,
                "vinaadi.app",
              ].filter(Boolean).join("\n");
              try {
                const result = await Share.share({ message });
                if (result.action === Share.sharedAction) trackEvent("share_card_shared");
              } catch {
                // user cancelled — no-op
              }
            }}
          >
            <View style={styles.quickActionInner}>
              <Ionicons name="share-outline" size={18} color={C.saffron} />
              <Text style={[styles.quickActionText, styles.quickActionSecondaryText]}>{isTamil ? "பகிர்" : "Share"}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionSecondary]}
            activeOpacity={0.86}
            onPress={async () => {
              trackEvent("whatsapp_share_tapped");
              const scoreText = g ? (isTamil ? `மதிப்பெண்: ${g.score}/100` : `Score: ${g.score}/100`) : "";
              const windowText = bestActionWindow
                ? (isTamil
                    ? `சிறந்த நேரம்: ${fmt(bestActionWindow.start)}–${fmt(bestActionWindow.end)}`
                    : `Best window: ${fmt(bestActionWindow.start)}–${fmt(bestActionWindow.end)}`)
                : "";
              const message = [
                isTamil ? "இன்றைய விநாடி திருகணிதம்" : "My Vinaadi day — powered by Thirukanitham",
                scoreText,
                windowText,
                "vinaadi.app",
              ].filter(Boolean).join("\n");
              const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
              try {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                  await Linking.openURL(url);
                } else {
                  await Share.share({ message });
                }
              } catch {
                await Share.share({ message }).catch(() => {});
              }
            }}
          >
            <View style={styles.quickActionInner}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366"/>
                <Path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.982-1.404A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.054-1.107l-.29-.172-3.005.847.81-2.962-.19-.304A7.944 7.944 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" fill="#25D366"/>
              </Svg>
              <Text style={[styles.quickActionText, styles.quickActionSecondaryText]}>WhatsApp</Text>
            </View>
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
            <Ionicons name="chevron-forward" size={18} color={C.gold} />
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
        {/* Ad unit — guest only, suppressed when dosham or caution window is active */}
        {tier === "guest" && !hasDoshamWarning && <NativeAdUnit />}

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
                {isTamil ? "பஞ்சாங்க விவரம்" : "Panchangam Details"}
              </Text>
              <View style={{ transform: [{ rotate: panchangamExpanded ? "90deg" : "0deg" }] }}>
                <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
              </View>
            </TouchableOpacity>
            {panchangamExpanded && (
              <View style={styles.panchangamGrid}>
                {[
                  { label: t(strings.panchangam.tithi), value: tTithi(p.tithi.name, lang) },
                  { label: t(strings.panchangam.nakshatra), value: tNakshatra(p.nakshatra.name, lang) },
                  { label: t(strings.panchangam.yoga), value: tYoga(p.yoga.name, lang) },
                  { label: t(strings.panchangam.sunrise), value: fmt(p.sunrise) },
                  { label: t(strings.panchangam.sunset), value: fmt(p.sunset) },
                  { label: t(strings.panchangam.karana), value: tKarana(p.karana.name, lang) },
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

        {isError && <ErrorCard onRetry={() => void refetchSnapshot()} />}

        {/* Soft Signup Prompt (shown after 3+ days) */}
        {tier === "guest" && showSignupPrompt && (
          <View style={styles.signupPrompt}>
            <TouchableOpacity
              onPress={() => setShowSignupPrompt(false)}
              style={styles.promptDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color={C.textTertiary} />
            </TouchableOpacity>
            <Text style={[styles.promptHeading, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
              {isTamil
                ? "உங்கள் ஜாதகத்தில் இன்றைய நாள் எப்படி?"
                : "How does today look for YOUR birth chart?"}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.promptCta}>
                {isTamil ? "இலவசமாக அறிந்துகொள் →" : "Find out free →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Detail sheet — slides up from bottom on both iOS and Android */}
      <BottomSheet
        ref={detailSheetRef}
        index={-1}
        snapPoints={["35%"]}
        enablePanDownToClose
        enableDynamicSizing={false}
        onClose={closeDetailSheet}
        backgroundStyle={{ backgroundColor: C.surface }}
        handleIndicatorStyle={{ backgroundColor: C.gold, width: 42 }}
      >
        <BottomSheetView style={styles.bsDetailContent}>
          <View style={[styles.sheetHandle, detailSheet?.tone === "caution" && { backgroundColor: C.caution }]} />
          <Text style={styles.sheetTitle}>{detailSheet?.title}</Text>
          <Text style={styles.sheetBody}>{detailSheet?.body}</Text>
          <TouchableOpacity style={styles.sheetDoneBtn} onPress={closeDetailSheet}>
            <Text style={styles.sheetDoneText}>{isTamil ? "Done" : "Done"}</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>

      {/* Journal sheet */}
      <BottomSheet
        ref={journalSheetRef}
        index={-1}
        snapPoints={["70%", "90%"]}
        enablePanDownToClose
        enableDynamicSizing={false}
        onClose={closeJournalSheet}
        backgroundStyle={{ backgroundColor: C.surface }}
        handleIndicatorStyle={{ backgroundColor: C.gold, width: 42 }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.bsJournalContent}>
          <Text style={styles.sheetTitle}>{isTamil ? "Log a moment" : "Log a moment"}</Text>
          <Text style={styles.journalStep}>{isTamil ? "What happened?" : "What happened?"}</Text>
          <ChipStrip
            items={JOURNAL_MOMENTS}
            selected={journalMoment}
            onSelect={setJournalMoment}
            isTamil={isTamil}
            layout="wrap"
          />
          <Text style={styles.journalStep}>{isTamil ? "Which area?" : "Which area?"}</Text>
          <ChipStrip
            items={JOURNAL_AREAS}
            selected={journalArea}
            onSelect={setJournalArea}
            isTamil={isTamil}
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
        </BottomSheetScrollView>
      </BottomSheet>
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

/**
 * `name` is the backend's kala enum ("AMIRTHAM"), which must never reach the
 * screen. It used to arrive null on the gowriNallaNeram summary — so this card
 * always fell through to the generic "Gowri" — and the backend now sends it
 * populated, which would print the shouting enum verbatim.
 *
 * Title-casing reproduces the English labels the web's `gowriCategoryLabel`
 * table returns for all eight kalas exactly, so this stays a formatter rather
 * than a third copy of that table. Tamil labels are still owed here (the card
 * has never had them — both branches printed "Gowri").
 */
function gowriKalaLabel(name: string | null | undefined): string {
  const raw = String(name ?? "").trim();
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function GowriCard({ slot, isTamil, onPress, styles, fmt }: { slot: GowriSlot; isTamil: boolean; onPress: () => void; styles: ReturnType<typeof makeStyles>; fmt: (iso: string) => string }) {
  return (
    <TouchableOpacity style={styles.gowriCard} activeOpacity={0.86} onPress={onPress}>
      <View style={styles.gowriChip}>
        <Text style={styles.gowriChipText}>G</Text>
      </View>
      <Text style={styles.gowriTime}>{fmt(slot.start)} - {fmt(slot.end)}</Text>
      <Text style={styles.gowriLabel} numberOfLines={1}>{gowriKalaLabel(slot.name) || slot.label || (isTamil ? "Gowri" : "Gowri")}</Text>
    </TouchableOpacity>
  );
}

function ActivityChipRow({
  chips,
  onSelect,
  styles,
}: {
  chips: { label: string; ok: boolean; detail: string }[];
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
  bsDetailContent: { padding: S.lg, gap: S.sm },
  bsJournalContent: { padding: S.lg, gap: S.sm, paddingBottom: S.xxl },
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
  pushPromptCard: {
    marginHorizontal: S.base,
    marginTop: S.sm,
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.sm,
    borderWidth: 1,
    borderColor: `${C.saffron}40`,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  pushPromptBody: { flexDirection: "row", alignItems: "flex-start", gap: S.sm },
  pushPromptTitle: { color: C.textPrimary },
  pushPromptBody2: { color: C.textSecond },
  pushPromptActions: { flexDirection: "row", gap: S.sm },
  pushPromptEnable: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.chip,
    backgroundColor: C.saffron, alignItems: "center",
  },
  pushPromptEnableText: { fontFamily: EnFont.Bold, fontSize: 14, color: C.surface },
  pushPromptDismiss: {
    paddingVertical: 10, paddingHorizontal: S.md, borderRadius: RADIUS.chip,
    borderWidth: 1, borderColor: C.divider, alignItems: "center",
  },
  pushPromptDismissText: { fontFamily: EnFont.Regular, fontSize: 14, color: C.textSecond },

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
