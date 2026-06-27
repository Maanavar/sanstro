import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import type { ColorTokens } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { TamilType, EnType } from "@/theme/typography";
import { useI18n } from "@/hooks/useI18n";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
import { getPanchangamDay } from "@/api/panchangam";
import { loadGuestPrefs } from "@/features/guest/guestStore";
import type { GuestPrefs } from "@/features/guest/guestStore";
import type { PanchangamDailyResponseData } from "@vinaadi/shared";

const TZ = "Asia/Kolkata";

function isoToHHMM(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true, timeZone: TZ,
    });
  } catch {
    return iso;
  }
}

function dateOffset(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayLabel(d: Date, isTamil: boolean): string {
  return d.toLocaleDateString(isTamil ? "ta-IN" : "en-IN", { weekday: "short" });
}

type TimeBarProps = {
  label: string;
  labelTa?: string;
  start: string;
  end: string;
  color: string;
  C: ColorTokens;
  isTamil: boolean;
  styles: ReturnType<typeof makeStyles>;
};

function TimeBar({ label, labelTa, start, end, color, C, isTamil, styles }: TimeBarProps) {
  return (
    <View style={[styles.timeBar, { borderLeftColor: color }]}>
      <View style={[styles.timeBarDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.timeBarLabel, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold", color }]}>
          {isTamil && labelTa ? labelTa : label}
        </Text>
        <Text style={[styles.timeBarRange, isTamil ? TamilType.caption : EnType.caption]}>
          {isoToHHMM(start)} – {isoToHHMM(end)}
        </Text>
      </View>
    </View>
  );
}

type PanchangamCardProps = {
  label: string;
  labelTa: string;
  value: string;
  sub?: string;
  isTamil: boolean;
  styles: ReturnType<typeof makeStyles>;
  C: ColorTokens;
};

function PanchangamCard({ label, labelTa, value, sub, isTamil, styles, C }: PanchangamCardProps) {
  return (
    <View style={styles.pCard}>
      <Text style={[styles.pCardLabel, isTamil ? TamilType.caption : EnType.caption]}>
        {isTamil ? labelTa : label}
      </Text>
      <Text style={[styles.pCardValue, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
        {value}
      </Text>
      {sub ? (
        <Text style={[styles.pCardSub, isTamil ? TamilType.caption : EnType.caption]}>{sub}</Text>
      ) : null}
    </View>
  );
}

export default function DailyPanchangamToolScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { lang } = useI18n();
  const isTamil = lang === "ta";
  const [offset, setOffset] = useState(0);
  const [prefs, setPrefs] = useState<GuestPrefs | null>(null);

  useEffect(() => { loadGuestPrefs().then(setPrefs); }, []);

  const selectedDate = dateOffset(offset);
  const iso = dateStr(selectedDate);
  const lat = prefs?.lat ?? 13.0827;
  const lon = prefs?.lon ?? 80.2707;
  const locationLabel = prefs?.city ?? "Chennai";

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["panchangam-tool", iso, lat, lon],
    queryFn: () => getPanchangamDay(iso, { lat, lng: lon, tz: TZ }),
    staleTime: 1000 * 60 * 60 * 12,
  });

  const p: PanchangamDailyResponseData | undefined = data?.data;

  const dayChips = [-2, -1, 0, 1, 2].map((i) => {
    const d = dateOffset(i);
    return { offset: i, label: dayLabel(d, isTamil), num: d.getDate(), isToday: i === 0 };
  });

  const tamilDateLabel = p?.tamilDate
    ? (isTamil ? p.tamilDate.ta : p.tamilDate.en)
    : selectedDate.toLocaleDateString(isTamil ? "ta-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isTamil ? TamilType.heading : EnType.heading]}>
            {isTamil ? "பஞ்சாங்கம்" : "Daily Panchangam"}
          </Text>
          <Text style={styles.locationLabel}>{locationLabel}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Date chips */}
      <View style={styles.dateStrip}>
        {dayChips.map((chip) => {
          const isSel = chip.offset === offset;
          return (
            <TouchableOpacity
              key={chip.offset}
              style={[styles.dateChip, isSel && styles.dateChipSel]}
              onPress={() => { Haptics.selectionAsync(); setOffset(chip.offset); }}
              activeOpacity={0.85}
            >
              <Text style={[styles.dateChipWeek, isSel && styles.dateChipTextSel]}>{chip.label}</Text>
              <Text style={[styles.dateChipNum, isSel && styles.dateChipTextSel]}>{chip.num}</Text>
              {chip.isToday && !isSel && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={C.saffron} />}
      >
        {/* Date headline */}
        <Text style={[styles.dateHeadline, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
          {tamilDateLabel}
        </Text>

        {isLoading && (
          <><SkeletonCard height={120} /><SkeletonCard height={200} /><SkeletonCard height={160} /></>
        )}

        {isError && <ErrorCard onRetry={refetch} />}

        {p && (
          <>
            {/* Auspicious banner */}
            {p.subhaMuhurtham.isSubha && (
              <View style={styles.subhaBanner}>
                <Text style={[styles.subhaBannerText, { fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold" }]}>
                  {isTamil ? "✓ இன்று சுப முகூர்த்த நாள்" : "✓ Auspicious Muhurtham Day"}
                </Text>
              </View>
            )}

            {/* Festivals */}
            {p.festivals.length > 0 && (
              <View style={styles.festivalStrip}>
                {p.festivals.map((f, i) => (
                  <View key={i} style={styles.festivalTag}>
                    <Text style={[styles.festivalText, { fontFamily: isTamil ? "NotoSansTamil_600SemiBold" : "Inter_600SemiBold" }]}>
                      {f.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Panchangam summary cards */}
            <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "பஞ்சாங்க விவரங்கள்" : "Panchangam Details"}
            </Text>
            <View style={styles.pGrid}>
              <PanchangamCard
                label="Tithi" labelTa="திதி"
                value={p.tithi.name}
                sub={`${isTamil ? "முடிவு" : "Ends"} ${isoToHHMM(p.tithi.endsAt)}`}
                isTamil={isTamil} styles={styles} C={C}
              />
              <PanchangamCard
                label="Nakshatra" labelTa="நட்சத்திரம்"
                value={p.nakshatra.name}
                sub={`${isTamil ? "பாதம்" : "Pada"} ${p.nakshatra.pada}`}
                isTamil={isTamil} styles={styles} C={C}
              />
            </View>
            <View style={styles.pGrid}>
              <PanchangamCard
                label="Yoga" labelTa="யோகம்"
                value={p.yoga.name}
                sub={`${isTamil ? "முடிவு" : "Ends"} ${isoToHHMM(p.yoga.endsAt)}`}
                isTamil={isTamil} styles={styles} C={C}
              />
              <PanchangamCard
                label="Karana" labelTa="கரணம்"
                value={p.karana.name}
                sub={`${isTamil ? "முடிவு" : "Ends"} ${isoToHHMM(p.karana.endsAt)}`}
                isTamil={isTamil} styles={styles} C={C}
              />
            </View>

            {/* Sunrise/Sunset */}
            <View style={styles.sunRow}>
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌅</Text>
                <Text style={[styles.sunLabel, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "சூர்யோதயம்" : "Sunrise"}
                </Text>
                <Text style={[styles.sunTime, { fontFamily: "Inter_700Bold" }]}>{isoToHHMM(p.sunrise)}</Text>
              </View>
              <View style={styles.sunDivider} />
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌇</Text>
                <Text style={[styles.sunLabel, isTamil ? TamilType.caption : EnType.caption]}>
                  {isTamil ? "சூர்யாஸ்தமயம்" : "Sunset"}
                </Text>
                <Text style={[styles.sunTime, { fontFamily: "Inter_700Bold" }]}>{isoToHHMM(p.sunset)}</Text>
              </View>
            </View>

            {/* Time windows */}
            <Text style={[styles.sectionTitle, isTamil ? TamilType.subheading : EnType.subheading]}>
              {isTamil ? "நேர சாளரங்கள்" : "Time Windows"}
            </Text>

            <View style={styles.timeBarsCard}>
              {/* Inauspicious */}
              <Text style={[styles.timeGroupLabel, { color: C.alert, fontFamily: "Inter_600SemiBold" }]}>
                {isTamil ? "தவிர்க்க வேண்டிய நேரம்" : "Avoid"}
              </Text>
              <TimeBar label="Rahu Kalam" labelTa="ராகு காலம்"
                start={p.kalam.rahuKalam.start} end={p.kalam.rahuKalam.end}
                color={C.alert} C={C} isTamil={isTamil} styles={styles} />
              <TimeBar label="Yamagandam" labelTa="யமகண்டம்"
                start={p.kalam.yamagandam.start} end={p.kalam.yamagandam.end}
                color={C.alert} C={C} isTamil={isTamil} styles={styles} />
              <TimeBar label="Kuligai" labelTa="குளிகை"
                start={p.kalam.kuligai.start} end={p.kalam.kuligai.end}
                color={C.caution} C={C} isTamil={isTamil} styles={styles} />

              <View style={styles.timeDivider} />

              {/* Auspicious */}
              <Text style={[styles.timeGroupLabel, { color: C.green, fontFamily: "Inter_600SemiBold" }]}>
                {isTamil ? "சுப நேரம்" : "Auspicious"}
              </Text>
              {p.kalam.nallaNeram.map((slot, i) => (
                <TimeBar key={i}
                  label={`Nalla Neram ${p.kalam.nallaNeram.length > 1 ? i + 1 : ""}`}
                  labelTa={`நல்ல நேரம்${p.kalam.nallaNeram.length > 1 ? ` ${i + 1}` : ""}`}
                  start={slot.start} end={slot.end}
                  color={C.green} C={C} isTamil={isTamil} styles={styles}
                />
              ))}
              {!p.abhijit.isRestrictedByWeekday && (
                <TimeBar label="Abhijit Muhurta" labelTa="அபிஜித் முகூர்த்தம்"
                  start={p.abhijit.start} end={p.abhijit.end}
                  color={C.amber} C={C} isTamil={isTamil} styles={styles} />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.parchment },
    header: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: S.base, paddingVertical: S.md,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    back: { fontFamily: "Inter_400Regular", fontSize: 22, color: C.textSecond, width: 40 },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: { color: C.textPrimary },
    locationLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },

    dateStrip: {
      flexDirection: "row", paddingHorizontal: S.base,
      paddingVertical: S.sm, gap: S.sm,
      borderBottomWidth: 1, borderBottomColor: C.divider,
    },
    dateChip: {
      flex: 1, alignItems: "center", paddingVertical: S.xs,
      borderRadius: RADIUS.md, borderWidth: 1, borderColor: "transparent",
      gap: 2,
    },
    dateChipSel: { backgroundColor: C.saffron, borderColor: C.saffron },
    dateChipWeek: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: C.textTertiary },
    dateChipNum: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.textPrimary },
    dateChipTextSel: { color: C.surface },
    todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.saffron },

    scroll: { padding: S.base, gap: S.lg, paddingBottom: S.xxl },
    dateHeadline: { fontSize: 18, lineHeight: 26, color: C.textPrimary },
    sectionTitle: { color: C.textPrimary, marginTop: S.xs },

    subhaBanner: {
      backgroundColor: `${C.green}15`, borderRadius: RADIUS.card,
      borderWidth: 1, borderColor: `${C.green}40`,
      padding: S.md, alignItems: "center",
    },
    subhaBannerText: { fontSize: 14, color: C.green },

    festivalStrip: { flexDirection: "row", flexWrap: "wrap", gap: S.sm },
    festivalTag: {
      backgroundColor: `${C.gold}20`, borderRadius: RADIUS.chip,
      paddingHorizontal: S.md, paddingVertical: S.xs,
      borderWidth: 1, borderColor: `${C.gold}50`,
    },
    festivalText: { fontSize: 12, color: C.goldOnLight },

    pGrid: { flexDirection: "row", gap: S.sm },
    pCard: {
      flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.md, gap: 2,
      shadowColor: C.deepIndigo, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
    },
    pCardLabel: { color: C.textTertiary },
    pCardValue: { fontSize: 15, lineHeight: 22, color: C.textPrimary },
    pCardSub: { color: C.textSecond },

    sunRow: {
      flexDirection: "row", backgroundColor: C.surface, borderRadius: RADIUS.card,
      padding: S.base, alignItems: "center",
    },
    sunItem: { flex: 1, alignItems: "center", gap: 2 },
    sunDivider: { width: 1, height: 40, backgroundColor: C.divider },
    sunIcon: { fontSize: 22 },
    sunLabel: { color: C.textSecond },
    sunTime: { fontSize: 18, lineHeight: 24, color: C.textPrimary },

    timeBarsCard: {
      backgroundColor: C.surface, borderRadius: RADIUS.card, padding: S.base, gap: S.sm,
    },
    timeGroupLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
    timeDivider: { height: 1, backgroundColor: C.divider, marginVertical: S.xs },
    timeBar: {
      flexDirection: "row", alignItems: "center", gap: S.sm,
      borderLeftWidth: 3, paddingLeft: S.sm, paddingVertical: 4,
    },
    timeBarDot: { width: 8, height: 8, borderRadius: 4 },
    timeBarLabel: { fontSize: 14, lineHeight: 20 },
    timeBarRange: { color: C.textSecond },
  });
}
