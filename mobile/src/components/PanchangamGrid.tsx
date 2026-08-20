import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { C } from "@/theme/colors";
import { S } from "@/theme/spacing";
import { limbNow, tKarana, tNakshatra, tTithi, tYoga } from "@vinaadi/shared";
import type { PanchangamDailyResponseData } from "@vinaadi/shared";

interface Props {
  data: PanchangamDailyResponseData;
  isTamil: boolean;
  formatTime: (iso: string) => string;
  /** True when `data` is for the user's current day. Only then is there a "now"
   *  to promote a limb to; on any other date the almanac's sunrise value is the
   *  right and only answer. Defaults to false so a caller that has not been
   *  updated keeps showing the sunrise value rather than promoting on the wrong
   *  day. */
  isToday?: boolean;
}

interface Datum {
  label: string;
  value: string;
}

export function PanchangamGrid({ data, isTamil, formatTime, isToday = false }: Props) {
  const lang = isTamil ? "ta" : "en";
  // Each limb shows the value in effect, not the one the day is named after.
  // A nakshatra holds under half the day on 46.6% of days and a karana on 97.5%
  // — this grid printed the sunrise value flat for all four limbs, so on a day
  // like 2026-08-19 it read "Swathi" and "Garaja" long after both had ended.
  const opts = { isToday, nowIso: new Date().toISOString() };
  const tithi = limbNow(data.tithi, opts);
  const nakshatra = limbNow(data.nakshatra, opts);
  const yoga = limbNow(data.yoga, opts);
  const karana = limbNow(data.karana, opts);
  const rows: Datum[] = [
    {
      label: isTamil ? "திதி" : "Tithi",
      value: tTithi(tithi.activeName, lang),
    },
    {
      label: isTamil ? "நக்ஷத்திரம்" : "Nakshatra",
      value: tNakshatra(nakshatra.activeName, lang),
    },
    {
      label: isTamil ? "யோகம்" : "Yoga",
      value: tYoga(yoga.activeName, lang),
    },
    {
      label: isTamil ? "கரணம்" : "Karana",
      value: tKarana(karana.activeName, lang),
    },
    {
      label: isTamil ? "சூரிய உதயம்" : "Sunrise",
      value: formatTime(data.sunrise),
    },
    {
      label: isTamil ? "சூரிய அஸ்தமனம்" : "Sunset",
      value: formatTime(data.sunset),
    },
  ];

  return (
    <View style={styles.grid}>
      {rows.map((item) => (
        <View key={item.label} style={styles.cell}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <Text
            style={[
              styles.value,
              {
                fontFamily: isTamil
                  ? "NotoSansTamil_700Bold"
                  : "Inter_700Bold",
              },
            ]}
            numberOfLines={1}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: S.sm,
  },
  cell: {
    width: "47%",
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  label: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textTertiary,
    marginBottom: 3,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    color: C.textPrimary,
  },
});
