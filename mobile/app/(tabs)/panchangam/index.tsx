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
import { TimeCard } from "@/components/TimeCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPanchangamDay } from "@/api/panchangam";
import { loadGuestPrefs } from "@/features/guest/guestStore";
import type { GuestPrefs } from "@/features/guest/guestStore";

const TZ = "Asia/Kolkata";

function isoToHHMM(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return iso;
  }
}

function dateString(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function PanchangamDayScreen() {
  const { t, strings, lang } = useI18n();
  const isTamil = lang === "ta";
  const [dayOffset, setDayOffset] = useState(0);
  const [prefs, setPrefs] = useState<GuestPrefs | null>(null);

  useEffect(() => {
    loadGuestPrefs().then(setPrefs);
  }, []);

  const dateStr = dateString(dayOffset);
  const lat = prefs?.lat ?? 13.0827;
  const lon = prefs?.lon ?? 80.2707;
  const locationLabel = prefs?.city ?? "Chennai";

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["panchangam-day", dateStr, lat, lon],
    queryFn: () => getPanchangamDay(dateStr, { lat, lng: lon, tz: TZ }),
    staleTime: 1000 * 60 * 60 * 12,
  });
  const p = data?.data;

  const dayChips = [-2, -1, 0, 1, 2].map((i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    const num = d.getDate();
    return { offset: i, label, num, isToday: i === 0 };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {t(strings.panchangam.title)}
        </Text>
        <View style={styles.headerActions}>
          <Text style={styles.locationLabel}>{locationLabel}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/panchangam/calendar")}>
            <Text style={styles.calendarLink}>{isTamil ? "மாதம் ▸" : "Month ▸"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayStrip}>
        {dayChips.map((chip) => (
          <TouchableOpacity
            key={chip.offset}
            style={[styles.dayChip, chip.offset === dayOffset && styles.dayChipActive]}
            onPress={() => setDayOffset(chip.offset)}
          >
            <Text style={[styles.dayChipLabel, chip.offset === dayOffset && styles.dayChipLabelActive]}>
              {chip.label}
            </Text>
            <Text style={[styles.dayChipNum, chip.offset === dayOffset && styles.dayChipNumActive]}>
              {chip.num}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.saffron} />}
      >
        {isLoading ? (
          <>
            <SkeletonCard height={80} />
            <SkeletonCard height={200} />
            <SkeletonCard height={160} />
          </>
        ) : isError ? (
          <ErrorCard onRetry={refetch} />
        ) : p ? (
          <>
            {/* Date hero */}
            <View style={styles.dateHero}>
              <Text style={[styles.tamilDate, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                {p.tamilDate ? (isTamil ? p.tamilDate.ta : p.tamilDate.en) : dateStr}
              </Text>
              <View style={styles.sunRow}>
                <Text style={styles.sunText}>🌅 {isoToHHMM(p.sunrise)}</Text>
                <Text style={styles.sunText}>🌇 {isoToHHMM(p.sunset)}</Text>
              </View>
            </View>

            {/* Primary timings */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kalamRow}>
              {p.kalam.nallaNeram.slice(0, 2).map((slot, i) => (
                <TimeCard key={`n-${i}`} kind="nalla_neram" start={isoToHHMM(slot.start)} end={isoToHHMM(slot.end)} />
              ))}
              <TimeCard kind="rahu_kalam" start={isoToHHMM(p.kalam.rahuKalam.start)} end={isoToHHMM(p.kalam.rahuKalam.end)} />
              <TimeCard kind="yamagandam" start={isoToHHMM(p.kalam.yamagandam.start)} end={isoToHHMM(p.kalam.yamagandam.end)} />
              <TimeCard kind="kuligai" start={isoToHHMM(p.kalam.kuligai.start)} end={isoToHHMM(p.kalam.kuligai.end)} />
            </ScrollView>

            {/* Five elements */}
            <View style={styles.fiveCard}>
              <Text style={[styles.fiveTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                {isTamil ? "பஞ்சாங்க அம்சங்கள்" : "Panchangam Elements"}
              </Text>
              {[
                { label: t(strings.panchangam.tithi),     value: `${p.tithi.name} (${p.tithi.paksha === "SHUKLA" ? "வளர்பிறை" : "தேய்பிறை"})` },
                { label: t(strings.panchangam.nakshatra), value: `${p.nakshatra.name}, ${isTamil ? "பாதம்" : "Pada"} ${p.nakshatra.pada}` },
                { label: t(strings.panchangam.yoga),     value: p.yoga.name },
                { label: t(strings.panchangam.karana),   value: p.karana.name },
                { label: t(strings.panchangam.vara),     value: p.vara.weekday },
              ].map((row) => (
                <View key={row.label} style={styles.fiveRow}>
                  <Text style={styles.fiveLabel}>{row.label}</Text>
                  <Text style={[styles.fiveValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Festivals */}
            {p.festivals.length > 0 && (
              <View style={styles.festivalCard}>
                <Text style={[styles.festivalTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
                  {t(strings.panchangam.festivals)}
                </Text>
                {p.festivals.map((f, i) => (
                  <Text key={i} style={[styles.festivalItem, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_600SemiBold" }]}>
                    ⭐ {f.name}
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S.base,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  headerTitle: { color: C.textPrimary },
  headerActions: { flexDirection: "row", alignItems: "center", gap: S.sm },
  locationLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.textTertiary },
  calendarLink: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.saffron },

  dayStrip: { paddingHorizontal: S.base, paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: C.divider },
  dayChip: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderRadius: RADIUS.chip,
    marginRight: S.sm,
    minWidth: 52,
  },
  dayChipActive: { backgroundColor: C.saffron },
  dayChipLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
  dayChipLabelActive: { color: C.surface },
  dayChipNum: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.textPrimary },
  dayChipNumActive: { color: C.surface },

  scroll: { padding: S.base, gap: S.base },
  dateHero: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.sm,
  },
  tamilDate: { fontSize: 16, lineHeight: 24, color: C.textPrimary },
  sunRow: { flexDirection: "row", gap: S.xl },
  sunText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecond },

  kalamRow: { marginLeft: -S.base, paddingLeft: S.base },

  fiveCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    padding: S.base,
    gap: S.sm,
  },
  fiveTitle: { color: C.textPrimary, marginBottom: S.xs },
  fiveRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: S.xs, borderBottomWidth: 1, borderBottomColor: C.divider },
  fiveLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textTertiary, flex: 1 },
  fiveValue: { fontSize: 14, lineHeight: 20, color: C.textPrimary, flex: 2, textAlign: "right" },

  festivalCard: { backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm },
  festivalTitle: { color: C.textPrimary },
  festivalItem: { fontSize: 14, lineHeight: 22, color: C.textPrimary },
});
