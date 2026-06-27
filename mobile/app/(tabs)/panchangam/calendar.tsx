import React, { useEffect, useState } from "react";
import {
  RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPanchangamMonth } from "@/api/panchangam";
import { loadGuestPrefs } from "@/features/guest/guestStore";
import type { GuestPrefs } from "@/features/guest/guestStore";
import { SwipeRouteView } from "@/components/SwipeRouteView";

const TZ = "Asia/Kolkata";

const WEEKDAY_LABELS_TA = ["ÃƒÂ Ã‚Â®Ã…Â¾ÃƒÂ Ã‚Â®Ã‚Â¾", "ÃƒÂ Ã‚Â®Ã‚Â¤ÃƒÂ Ã‚Â®Ã‚Â¿", "ÃƒÂ Ã‚Â®Ã…Â¡ÃƒÂ Ã‚Â¯Ã¢â‚¬Â ", "ÃƒÂ Ã‚Â®Ã‚ÂªÃƒÂ Ã‚Â¯Ã‚Â", "ÃƒÂ Ã‚Â®Ã‚ÂµÃƒÂ Ã‚Â®Ã‚Â¿", "ÃƒÂ Ã‚Â®Ã‚ÂµÃƒÂ Ã‚Â¯Ã¢â‚¬Â ", "ÃƒÂ Ã‚Â®Ã…Â¡"];
const WEEKDAY_LABELS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function PanchangamCalendarScreen() {
  const { t, strings, lang } = useI18n();
  const isTamil = lang === "ta";
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [prefs, setPrefs] = useState<GuestPrefs | null>(null);

  useEffect(() => {
    loadGuestPrefs().then(setPrefs);
  }, []);

  const prefsLoaded = prefs !== null;
  const lat = prefs?.lat ?? undefined;
  const lon = prefs?.lon ?? undefined;
  const hasLocation = lat != null && lon != null;
  const isLocationMissing = prefsLoaded && !hasLocation;
  const locationLabel = prefs?.city ?? (isLocationMissing ? (isTamil ? "Ã Â®â€¡Ã Â®Å¸Ã Â®Â¤Ã Â¯ÂÃ Â®Â¤Ã Â¯Ë† Ã Â®â€¦Ã Â®Â®Ã Â¯Ë†Ã Â®â€¢Ã Â¯ÂÃ Â®â€¢Ã Â®ÂµÃ Â¯ÂÃ Â®Â®Ã Â¯Â" : "Set location") : "Chennai");

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["panchangam-month", year, month, lat, lon],
    queryFn: () => getPanchangamMonth(year, month, { lat: lat!, lng: lon!, tz: TZ }),
    staleTime: 1000 * 60 * 60 * 12,
    enabled: hasLocation,
  });
  const d = data?.data;

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const monthLabel = d?.tamilMonthName
    ? (isTamil ? d.tamilMonthName.ta : d.tamilMonthName.en)
    : new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  type DayEntry = NonNullable<typeof d>["entries"][0];
  const cells: Array<DayEntry | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  if (d) for (const entry of d.entries) cells.push(entry);

  const todayStr = today.toISOString().slice(0, 10);

  return (
    <SwipeRouteView rightRoute="/(tabs)/panchangam">
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>ÃƒÂ¢Ã¢â‚¬Â Ã‚Â</Text>
        </TouchableOpacity>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.navArrow}>ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹</Text>
          </TouchableOpacity>
          <View style={styles.monthTitleGroup}>
            <Text style={[styles.monthLabel, isTamil ? TamilType.heading : EnType.heading]}>
              {monthLabel}
            </Text>
            <Text style={styles.locationLabel}>{locationLabel}</Text>
          </View>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.navArrow}>ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âº</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={hasLocation && isFetching}
            onRefresh={() => { if (hasLocation) void refetch(); }}
            tintColor={C.saffron}
          />
        }
      >
        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {(isTamil ? WEEKDAY_LABELS_TA : WEEKDAY_LABELS_EN).map((l) => (
            <Text key={l} style={styles.weekdayLabel}>{l}</Text>
          ))}
        </View>

        {!prefsLoaded || isLoading ? (
          <SkeletonCard height={280} />
        ) : isLocationMissing ? (
          <TouchableOpacity
            style={styles.locationPrompt}
            activeOpacity={0.86}
            onPress={() => router.push("/(onboarding)/location")}
          >
            <Text style={[styles.locationPromptTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "à®‰à®™à¯à®•à®³à¯ à®¨à®•à®°à®¤à¯à®¤à¯ˆ à®…à®®à¯ˆà®¤à¯à®¤à¯ à®®à®¾à®¤ à®ªà®žà¯à®šà®¾à®™à¯à®•à®¤à¯à®¤à¯ˆ à®ªà®¾à®°à¯à®•à¯à®•à®µà¯à®®à¯" : "Set your city to load the monthly Panchangam"}
            </Text>
            <Text style={styles.locationPromptBody}>
              {isTamil ? "à®®à¯à®¹à¯‚à®°à¯à®¤à¯à®¤ à®¨à®¾à®³à¯, à®¤à®¿à®°à¯à®¨à®¾à®³à¯, à®¤à®¿à®© à®¨à¯‡à®°à®™à¯à®•à®³à¯ à®…à®©à¯ˆà®¤à¯à®¤à¯à®®à¯ à®‡à®Ÿà®¤à¯à®¤à¯ˆ à®šà®¾à®°à¯à®¨à¯à®¤à®µà¯ˆ." : "Muhurtham days, festivals, and daily timings all shift by location."}
            </Text>
            <Text style={styles.locationPromptCta}>{isTamil ? "à®‡à®Ÿà®¤à¯à®¤à¯ˆ à®ªà¯à®¤à¯à®ªà¯à®ªà®¿à®•à¯à®•à®µà¯à®®à¯" : "Update location"}</Text>
          </TouchableOpacity>
        ) : isError ? (
          <ErrorCard onRetry={refetch} />
        ) : (
          <View style={styles.grid}>
            {cells.map((cell, i) => {
              if (!cell) return <View key={`empty-${i}`} style={styles.cell} />;
              const isToday = cell.dateLocal === todayStr;
              const hasFestival = cell.festivals.length > 0;
              return (
                <TouchableOpacity
                  key={cell.dateLocal}
                  style={[styles.cell, isToday && styles.cellToday]}
                  onPress={() => router.push("/(tabs)/panchangam")}
                >
                  <Text style={[styles.cellNum, isToday && styles.cellNumToday]}>
                    {new Date(cell.dateLocal).getDate()}
                  </Text>
                  <View style={styles.dotRow}>
                    {cell.isSubhaMuhurtham && <View style={[styles.dot, { backgroundColor: C.green }]} />}
                    {hasFestival && <View style={[styles.dot, { backgroundColor: C.gold }]} />}
                    {cell.isKarinaal && <View style={[styles.dot, { backgroundColor: C.maroon }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Muhurtham Naal ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â auspicious days this month */}
        {d && (() => {
          const muhurthamDays = d.entries.filter((e) => e.isSubhaMuhurtham);
          return muhurthamDays.length > 0 ? (
            <View style={styles.festivalSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionDot} />
                <Text style={[styles.festivalTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {isTamil ? "ÃƒÂ Ã‚Â®Ã‚Â®ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã¢â‚¬Â¢ÃƒÂ Ã‚Â¯Ã¢â‚¬Å¡ÃƒÂ Ã‚Â®Ã‚Â°ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã‚Â¤ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã‚Â¤ ÃƒÂ Ã‚Â®Ã‚Â¨ÃƒÂ Ã‚Â®Ã‚Â¾ÃƒÂ Ã‚Â®Ã…Â¸ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã¢â‚¬Â¢ÃƒÂ Ã‚Â®Ã‚Â³ÃƒÂ Ã‚Â¯Ã‚Â" : "Muhurtham Naal"}
                </Text>
              </View>
              <Text style={styles.sectionHint}>
                {isTamil ? "ÃƒÂ Ã‚Â®Ã¢â‚¬Â¡ÃƒÂ Ã‚Â®Ã‚Â¨ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã‚Â¤ ÃƒÂ Ã‚Â®Ã‚Â®ÃƒÂ Ã‚Â®Ã‚Â¾ÃƒÂ Ã‚Â®Ã‚Â¤ÃƒÂ Ã‚Â®Ã‚Â®ÃƒÂ Ã‚Â¯Ã‚Â ÃƒÂ Ã‚Â®Ã…Â¡ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã‚ÂªÃƒÂ Ã‚Â®Ã‚Â®ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã¢â‚¬Â¢ÃƒÂ Ã‚Â¯Ã¢â‚¬Å¡ÃƒÂ Ã‚Â®Ã‚Â°ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã‚Â¤ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã‚Â¤ ÃƒÂ Ã‚Â®Ã‚Â¨ÃƒÂ Ã‚Â®Ã‚Â¾ÃƒÂ Ã‚Â®Ã…Â¸ÃƒÂ Ã‚Â¯Ã‚ÂÃƒÂ Ã‚Â®Ã¢â‚¬Â¢ÃƒÂ Ã‚Â®Ã‚Â³ÃƒÂ Ã‚Â¯Ã‚Â" : "Auspicious days this month"}
              </Text>
              {muhurthamDays.map((e) => (
                <View key={`muhurtham-${e.dateLocal}`} style={[styles.festivalRow, styles.muhurthamRow]}>
                  <View style={styles.muhurthamDot} />
                  <Text style={[styles.festivalName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_600SemiBold" }]}>
                    {e.tamilDate ? (isTamil ? e.tamilDate.ta : e.tamilDate.en) : e.dateLocal}
                  </Text>
                  <Text style={styles.muhurthamDate}>
                    {new Date(e.dateLocal).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </Text>
                </View>
              ))}
            </View>
          ) : null;
        })()}

        {/* All festivals this month */}
        {d && (() => {
          const festivalEntries = d.entries.filter((e) => e.festivals.length > 0);
          return festivalEntries.length > 0 ? (
            <View style={styles.festivalSection}>
              <Text style={[styles.festivalTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {t(strings.panchangam.festivals)}
              </Text>
              {festivalEntries.map((e) => (
                e.festivals.map((fest, fi) => (
                  <View key={`${e.dateLocal}-${fi}`} style={styles.festivalRow}>
                    <Text style={[styles.festivalName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_600SemiBold" }]}>
                      {fest.name}
                    </Text>
                    <Text style={styles.festivalDate}>
                      {e.tamilDate ? (isTamil ? e.tamilDate.ta : e.tamilDate.en) : e.dateLocal}
                    </Text>
                  </View>
                ))
              ))}
            </View>
          ) : null;
        })()}
      </ScrollView>
    </SafeAreaView>
    </SwipeRouteView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    gap: S.sm,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, paddingRight: S.sm },
  monthNav: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: S.base },
  monthTitleGroup: { flex: 1, alignItems: "center" },
  navArrow: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.saffron, paddingHorizontal: S.sm },
  monthLabel: { color: C.textPrimary, textAlign: "center" },
  locationLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textTertiary, marginTop: 2 },
  locationPrompt: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.sm,
    borderWidth: 1,
    borderColor: C.divider,
  },
  locationPromptTitle: { color: C.textPrimary },
  locationPromptBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, color: C.textSecond },
  locationPromptCta: { fontFamily: "Inter_700Bold", fontSize: 13, color: C.saffron },

  scroll: { padding: S.base, gap: S.base },
  weekdayRow: { flexDirection: "row", marginBottom: S.sm },
  weekdayLabel: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: C.textTertiary,
    textAlign: "center",
  },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  cellToday: {
    backgroundColor: C.saffron,
    borderRadius: RADIUS.chip,
  },
  cellNum: { fontFamily: "Inter_700Bold", fontSize: 14, color: C.textPrimary },
  cellNumToday: { color: C.surface },
  dotRow: { flexDirection: "row", gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  festivalSection: { gap: S.sm },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: S.xs },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  sectionHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary, marginTop: -S.xs },
  festivalTitle: { color: C.textPrimary },
  festivalRow: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  muhurthamRow: { borderLeftWidth: 3, borderLeftColor: C.green },
  muhurthamDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green, marginRight: S.xs },
  muhurthamDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  festivalName: { fontSize: 14, lineHeight: 20, color: C.textPrimary, flex: 1 },
  festivalDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
});
