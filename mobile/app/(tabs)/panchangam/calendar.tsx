import React, { useState } from "react";
import {
  SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPanchangamMonth } from "@/api/panchangam";

const LAT = 13.0827;
const LON = 80.2707;
const TZ = "Asia/Kolkata";

const WEEKDAY_LABELS_TA = ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"];
const WEEKDAY_LABELS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function PanchangamCalendarScreen() {
  const { t, strings, lang } = useI18n();
  const isTamil = lang === "ta";
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["panchangam-month", year, month],
    queryFn: () => getPanchangamMonth(year, month, { lat: LAT, lng: LON, tz: TZ }),
    staleTime: 1000 * 60 * 60 * 12,
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, isTamil ? TamilType.heading : EnType.heading]}>
            {monthLabel}
          </Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {(isTamil ? WEEKDAY_LABELS_TA : WEEKDAY_LABELS_EN).map((l) => (
            <Text key={l} style={styles.weekdayLabel}>{l}</Text>
          ))}
        </View>

        {isLoading ? (
          <SkeletonCard height={280} />
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

        {/* Upcoming festivals */}
        {d && (
          <View style={styles.festivalSection}>
            <Text style={[styles.festivalTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {t(strings.panchangam.festivals)}
            </Text>
            {d.entries
              .filter((e) => e.festivals.length > 0)
              .slice(0, 5)
              .map((e) => (
                <View key={e.dateLocal} style={styles.festivalRow}>
                  <Text style={[styles.festivalName, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_600SemiBold" }]}>
                    {e.festivals[0].name}
                  </Text>
                  <Text style={styles.festivalDate}>
                    {e.tamilDate ? (isTamil ? e.tamilDate.ta : e.tamilDate.en) : e.dateLocal}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  navArrow: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.saffron, paddingHorizontal: S.sm },
  monthLabel: { color: C.textPrimary },

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
  festivalTitle: { color: C.textPrimary },
  festivalRow: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  festivalName: { fontSize: 14, lineHeight: 20, color: C.textPrimary, flex: 1 },
  festivalDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
});
