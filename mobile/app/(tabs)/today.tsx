import React, { useEffect, useState } from "react";
import {
  RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { TimeCard } from "@/components/TimeCard";
import { RasiPalanCard } from "@/components/RasiPalanCard";
import { ScoreRing } from "@/components/ScoreRing";
import { ThirukanithamBadge } from "@/components/ThirukanithamBadge";
import { NativeAdUnit } from "@/components/AdUnit";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPanchangamToday } from "@/api/panchangam";
import { getDailyGuidance } from "@/api/guidance";
import { loadGuestPrefs } from "@/features/guest/guestStore";
import { getPrimaryChartId } from "@/lib/userPrefs";
import { pushWidgetData } from "@/lib/widgetBridge";
import type { GuestPrefs } from "@/features/guest/guestStore";
import type { DailyGuidanceData } from "@vinaadi/shared";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return iso;
  }
}

export default function TodayTab() {
  const { t, strings, lang } = useI18n();
  const { tier, user } = useSession();
  const isTamil = lang === "ta";

  const [prefs, setPrefs] = useState<GuestPrefs | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [primaryChartId, setPrimaryChartId] = useState<string | null>(null);

  useEffect(() => {
    loadGuestPrefs().then(setPrefs);
    if (tier !== "guest") {
      getPrimaryChartId().then(setPrimaryChartId);
    }
  }, [tier]);

  const lat = prefs?.lat ?? 13.0827;
  const lon = prefs?.lon ?? 80.2707;
  const tz = "Asia/Kolkata";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["panchangam-today", lat, lon],
    queryFn: () => getPanchangamToday({ lat, lng: lon, tz }),
    staleTime: 1000 * 60 * 60,
    enabled: !!prefs,
  });

  const p = data?.data;

  const todayStr = new Date().toISOString().split("T")[0];
  const { data: guidanceData } = useQuery({
    queryKey: ["daily-guidance", primaryChartId, todayStr],
    queryFn: () => getDailyGuidance(primaryChartId!, todayStr),
    enabled: tier !== "guest" && !!primaryChartId,
    staleTime: 1000 * 60 * 60,
  });
  const g = guidanceData?.data as DailyGuidanceData | undefined;

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

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const tamilDate = p?.tamilDate ? (isTamil ? p.tamilDate.ta : p.tamilDate.en) : todayLabel;
  const cityName = prefs?.city ?? "Chennai";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={C.saffron} />}
        contentContainerStyle={styles.scroll}
      >
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
            <TouchableOpacity
              onPress={() => router.push("/notifications/inbox")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.header}>
            <Text style={styles.logo}>விநாடி AI</Text>
            <View style={styles.headerCenter}>
              <Text style={[styles.tamilDate, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                {tamilDate}
              </Text>
              <Text style={styles.engDate}>{todayLabel}</Text>
            </View>
            <TouchableOpacity style={styles.cityChip}>
              <Text style={styles.cityText}>{cityName} ▾</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Registered: Daily Score Hero */}
        {tier !== "guest" && (
          <View style={styles.hero}>
            {!g ? (
              <SkeletonCard height={160} />
            ) : (
              <TouchableOpacity
                style={styles.scoreHeroCard}
                onPress={() => primaryChartId && router.push({ pathname: "/daily-score", params: { chartId: primaryChartId } })}
                activeOpacity={0.88}
              >
                <ScoreRing score={g.score} size={88} />
                <View style={{ flex: 1, gap: S.xs }}>
                  <Text style={[styles.scoreHeroLabel, isTamil ? TamilType.caption : EnType.caption]}>
                    {isTamil ? "இன்றைய நிலை" : "Today's Score"}
                  </Text>
                  <Text style={[styles.scoreHeroText, isTamil ? TamilType.body : EnType.body]}>
                    {isTamil ? g.text?.ta : g.text?.en}
                  </Text>
                  {g.bestWindows.length > 0 && (
                    <View style={styles.windowChipRow}>
                      {g.bestWindows.slice(0, 2).map((w, i) => (
                        <View key={i} style={styles.windowChip}>
                          <Text style={styles.windowChipText}>✓ {formatTime(w.start)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={styles.scoreArrow}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Chandrashtama alert (registered, when active) */}
        {tier !== "guest" && g !== undefined && g.score <= 3 && g.cautionWindows.length > 0 && (
          <TouchableOpacity
            style={styles.chandraCard}
            onPress={() => router.push("/chandrashtama")}
            activeOpacity={0.85}
          >
            <Text style={styles.chandraIcon}>⚠️</Text>
            <Text style={[styles.chandraText, isTamil ? TamilType.caption : EnType.caption]}>
              {isTamil ? "சந்திராஷ்டமம் — விரிவாக அறிய" : "Chandrashtama — tap to learn more"}
            </Text>
            <Text style={styles.chandraArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Guest Hero Card */}
        {tier === "guest" && (
          <View style={styles.hero}>
            {isLoading ? (
              <SkeletonCard height={200} />
            ) : (
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>{isTamil ? "இன்று" : "Today"}</Text>
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
                  <Text style={styles.heroSymbol}>🌅</Text>
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
        {isLoading ? (
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

        {/* Rasi Palan Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
            {isTamil ? "இன்றைய ராசி பலன்" : "Today's Rasi Palan"}
          </Text>
          {isLoading ? (
            <SkeletonCard height={120} />
          ) : (
            <RasiPalanCard
              rasiName={
                prefs?.rasi
                  ? (isTamil ? "மேஷம்" : "Aries")
                  : (isTamil ? "ராசி தேர்வு செய்யவும்" : "Select rasi")
              }
              palanText={
                isTamil
                  ? "இன்றைய நாள் உங்களுக்கு சாதகமாக உள்ளது. தொழில் விஷயங்களில் கவனம் தேவை. குடும்பத்தினருடன் நேரம் செலவிடுங்கள்."
                  : "Today looks favourable. Pay attention to professional matters. Spend quality time with family."
              }
              onReadMore={
                !prefs?.rasi
                  ? () => router.push("/(onboarding)/rasi-picker")
                  : undefined
              }
            />
          )}
        </View>

        {/* Ad unit — guest only */}
        {tier === "guest" && <NativeAdUnit />}

        {/* Panchangam Details (collapsible stub) */}
        {p && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "பஞ்சாங்க விவரம்" : "Panchangam Details"}
            </Text>
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
                  <Text
                    style={[styles.datumValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {isError && <ErrorCard onRetry={refetch} />}

        {/* Soft Signup Prompt (shown after 3+ days) */}
        {tier === "guest" && showSignupPrompt && (
          <View style={styles.signupPrompt}>
            <TouchableOpacity
              onPress={() => setShowSignupPrompt(false)}
              style={styles.promptDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.promptDismissText}>✕</Text>
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

        <ThirukanithamBadge style={styles.badge} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  scroll: { paddingBottom: S.xxl },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  logo: { fontFamily: "NotoSansTamil_700Bold", fontSize: 14, color: C.saffron, flex: 1 },
  headerCenter: { flex: 2, alignItems: "center" },
  tamilDate: { fontSize: 14, lineHeight: 20, color: C.textPrimary },
  engDate: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
  cityChip: {
    flex: 1,
    alignItems: "flex-end",
  },
  cityText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecond },

  hero: { paddingHorizontal: S.base, paddingTop: S.base },
  heroCard: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.card,
    padding: S.base,
    minHeight: 160,
    overflow: "hidden",
  },
  heroLabel: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginBottom: S.sm,
  },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroRasi: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 28,
    lineHeight: 36,
    color: C.surface,
  },
  heroSub: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
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
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 11,
    lineHeight: 16,
    color: C.surface,
  },

  greeting: { color: C.textSecond, marginTop: 2 },
  bellIcon: { fontSize: 22 },
  scoreHeroCard: {
    backgroundColor: "#1A2540", borderRadius: RADIUS.card,
    padding: S.base, flexDirection: "row", alignItems: "center", gap: S.md,
  },
  scoreHeroLabel: { color: "rgba(255,255,255,0.65)" },
  scoreHeroText: { color: "#FFFFFF" },
  windowChipRow: { flexDirection: "row", gap: S.xs, flexWrap: "wrap", marginTop: 4 },
  windowChip: {
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm, paddingVertical: 2,
  },
  windowChipText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "rgba(255,255,255,0.85)" },
  scoreArrow: { fontFamily: "Inter_700Bold", fontSize: 22, color: "rgba(255,255,255,0.6)" },
  chandraCard: {
    marginHorizontal: S.base, marginBottom: S.sm,
    backgroundColor: "#FFF3E0", borderRadius: RADIUS.card,
    borderLeftWidth: 4, borderLeftColor: C.caution,
    flexDirection: "row", alignItems: "center", gap: S.sm,
    paddingHorizontal: S.md, paddingVertical: S.sm,
  },
  chandraIcon: { fontSize: 18 },
  chandraText: { flex: 1, color: C.caution },
  chandraArrow: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.caution },
  kalamRow: { paddingLeft: S.base, paddingVertical: S.base },

  section: { paddingHorizontal: S.base, marginTop: S.base, gap: S.sm },
  sectionTitle: { color: C.textPrimary },

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  datumLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textTertiary,
    marginBottom: 3,
  },
  datumValue: { fontSize: 14, lineHeight: 20, color: C.textPrimary },

  signupPrompt: {
    margin: S.base,
    backgroundColor: "rgba(139,26,60,0.06)",
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.sm,
  },
  promptDismiss: { alignSelf: "flex-end" },
  promptDismissText: { color: C.textTertiary, fontSize: 14 },
  promptHeading: { color: C.textPrimary },
  promptCta: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: C.saffron,
  },
  badge: { alignSelf: "center", marginTop: S.xl },
});
