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
import { BannerAdUnit } from "@/components/AdUnit";
import { getMuhurta } from "@/api/tools";

const ACTIVITIES = [
  { key: "marriage",    ta: "திருமணம்",    en: "Marriage" },
  { key: "house",       ta: "வீடு",         en: "House" },
  { key: "vehicle",     ta: "வாகனம்",      en: "Vehicle" },
  { key: "business",    ta: "தொழில்",       en: "Business" },
  { key: "baby_naming", ta: "குழந்தை பேர்", en: "Baby Naming" },
  { key: "travel",      ta: "பயணம்",       en: "Travel" },
];

function addDays(date: Date, n: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

type ViewState = "input" | "result";

export default function MuhurtaScreen() {
  const { lang } = useI18n();
  const isTamil = lang === "ta";

  const [view, setView] = useState<ViewState>("input");
  const [activity, setActivity] = useState<string>("marriage");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date();
  const dateFrom = addDays(today, 1);
  const dateTo = addDays(today, 30);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["muhurta", activity, dateFrom, dateTo],
    queryFn: () => getMuhurta({ chartId: "public", activity, dateFrom, dateTo }),
    enabled: submitted,
    staleTime: 1000 * 60 * 60 * 12,
  });

  function handleSearch() {
    setSubmitted(true);
    setView("result");
  }

  const slots = data?.data?.slots ?? [];

  if (view === "result") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView("input")} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            {isTamil ? "முகூர்த்த நேரங்கள்" : "Auspicious Timings"}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={[styles.resultCount, isTamil ? TamilType.caption : EnType.caption]}>
            {isLoading
              ? (isTamil ? "தேடுகிறது…" : "Searching…")
              : `${slots.length} ${isTamil ? "நல்ல நேரங்கள்" : "auspicious times found"}`}
          </Text>

          {isLoading ? (
            <>
              <SkeletonCard height={96} />
              <SkeletonCard height={96} />
              <SkeletonCard height={96} />
            </>
          ) : isError ? (
            <ErrorCard onRetry={refetch} />
          ) : (
            slots.map((slot, i) => (
              <View key={i} style={styles.slotCard}>
                <View style={styles.slotLeft}>
                  <Text style={[styles.slotDate, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                    {slot.tamilDate ? (isTamil ? slot.tamilDate.ta : slot.tamilDate.en) : slot.date}
                  </Text>
                  <Text style={styles.slotDateEn}>{slot.date}</Text>
                </View>
                <View style={styles.slotCenter}>
                  <Text style={styles.slotTime}>
                    {slot.timeStart} – {slot.timeEnd}
                  </Text>
                  <Text style={styles.slotScore}>
                    {"⭐".repeat(Math.max(1, Math.min(5, Math.round(slot.score / 2))))}
                  </Text>
                </View>
                {i === 0 && (
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>{isTamil ? "சிறந்தது" : "Best"}</Text>
                  </View>
                )}
              </View>
            ))
          )}

          <BannerAdUnit />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
          {isTamil ? "முகூர்த்த நேரம்" : "Auspicious Timing"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionLabel, isTamil ? TamilType.bodySmall : EnType.bodySmall]}>
          {isTamil ? "நோக்கம் தேர்வு" : "Select purpose"}
        </Text>
        <View style={styles.activityRow}>
          {ACTIVITIES.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={[styles.actChip, activity === a.key && styles.actChipSel]}
              onPress={() => setActivity(a.key)}
            >
              <Text style={[
                styles.actChipText,
                { fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular" },
                activity === a.key && styles.actChipTextSel,
              ]}>
                {isTamil ? a.ta : a.en}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateRow}>
          <View style={styles.datePill}>
            <Text style={styles.dateLabel}>{isTamil ? "இருந்து" : "From"}</Text>
            <Text style={styles.dateValue}>{dateFrom}</Text>
          </View>
          <Text style={styles.dateSep}>→</Text>
          <View style={styles.datePill}>
            <Text style={styles.dateLabel}>{isTamil ? "வரை" : "To"}</Text>
            <Text style={styles.dateValue}>{dateTo}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.cta} onPress={handleSearch} activeOpacity={0.85}>
          <Text style={styles.ctaText}>
            {isTamil ? "முகூர்த்தம் தேடு" : "Find Muhurta"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: S.base, paddingVertical: S.md,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 40 },
  headerTitle: { color: C.textPrimary },
  scroll: { padding: S.base, gap: S.md },

  sectionLabel: { color: C.textSecond },
  activityRow: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
  actChip: {
    paddingHorizontal: S.md, paddingVertical: S.sm,
    borderRadius: RADIUS.chip, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.divider,
  },
  actChipSel: { backgroundColor: C.saffron, borderColor: C.saffron },
  actChipText: { fontSize: 13, lineHeight: 20, color: C.textPrimary },
  actChipTextSel: { color: C.surface },

  dateRow: { flexDirection: "row", alignItems: "center", gap: S.sm },
  datePill: {
    flex: 1, backgroundColor: C.surfaceAlt,
    borderRadius: RADIUS.input, padding: S.md,
  },
  dateLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
  dateValue: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.textPrimary },
  dateSep: { fontFamily: "Inter_400Regular", fontSize: 16, color: C.textTertiary },

  cta: {
    backgroundColor: C.saffron, borderRadius: RADIUS.button,
    height: 52, alignItems: "center", justifyContent: "center",
  },
  ctaText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 16, lineHeight: 24, color: C.surface },

  resultCount: { color: C.textTertiary },
  slotCard: {
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    padding: S.base, flexDirection: "row", alignItems: "center",
    gap: S.sm, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  slotLeft: { width: 80 },
  slotDate: { fontSize: 16, lineHeight: 22, color: C.textPrimary },
  slotDateEn: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary },
  slotCenter: { flex: 1, gap: 4 },
  slotTime: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: C.textPrimary },
  slotScore: { fontSize: 12 },
  bestBadge: {
    backgroundColor: C.gold, borderRadius: RADIUS.chip,
    paddingHorizontal: S.sm, paddingVertical: 3,
  },
  bestBadgeText: { fontFamily: "NotoSansTamil_700Bold", fontSize: 10, lineHeight: 14, color: C.surface },
});
