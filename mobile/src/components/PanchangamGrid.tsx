import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { C } from "@/theme/colors";
import { S } from "@/theme/spacing";
import type { PanchangamDailyResponseData } from "@vinaadi/shared";

interface Props {
  data: PanchangamDailyResponseData;
  isTamil: boolean;
  formatTime: (iso: string) => string;
}

interface Datum {
  label: string;
  value: string;
}

export function PanchangamGrid({ data, isTamil, formatTime }: Props) {
  const rows: Datum[] = [
    {
      label: isTamil ? "திதி" : "Tithi",
      value: data.tithi.name,
    },
    {
      label: isTamil ? "நக்ஷத்திரம்" : "Nakshatra",
      value: data.nakshatra.name,
    },
    {
      label: isTamil ? "யோகம்" : "Yoga",
      value: data.yoga.name,
    },
    {
      label: isTamil ? "கரணம்" : "Karana",
      value: data.karana.name,
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
