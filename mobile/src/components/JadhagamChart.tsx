import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { C } from "@/theme/colors";

// South Indian fixed rasi grid positions [row, col] for rasi 1-12
const RASI_GRID: [number, number][] = [
  [0, 1], // 1  Mesham
  [0, 2], // 2  Rishabam
  [0, 3], // 3  Mithunam
  [1, 3], // 4  Katakam
  [2, 3], // 5  Simham
  [3, 3], // 6  Kanni
  [3, 2], // 7  Thulam
  [3, 1], // 8  Viruchigam
  [3, 0], // 9  Dhanusu
  [2, 0], // 10 Makaram
  [1, 0], // 11 Kumbam
  [0, 0], // 12 Meenam
];

const RASI_SHORT_TA = ["", "மே", "ரி", "மி", "க", "சி", "க", "து", "வி", "த", "ம", "கு", "மீ"];

export interface JadhagamHouseData {
  rasi: number;
  planets: string[];
  isLagna: boolean;
}

interface Props {
  houses: JadhagamHouseData[];
  size?: number;
}

export function JadhagamChart({ houses, size = 280 }: Props) {
  const cell = Math.floor(size / 4);
  const houseMap = new Map(houses.map((h) => [h.rasi, h]));

  return (
    <View style={[styles.grid, { width: cell * 4, height: cell * 4 }]}>
      {RASI_GRID.map(([row, col], idx) => {
        const rasiNum = idx + 1;
        const house = houseMap.get(rasiNum) ?? { rasi: rasiNum, planets: [], isLagna: false };
        return (
          <View
            key={rasiNum}
            style={[styles.cell, {
              position: "absolute",
              top: row * cell,
              left: col * cell,
              width: cell,
              height: cell,
              backgroundColor: house.isLagna ? "#FEF5EC" : C.surface,
            }]}
          >
            <Text style={styles.rasiLabel}>{RASI_SHORT_TA[rasiNum]}</Text>
            {house.isLagna && <Text style={styles.lagnaTag}>லக்</Text>}
            {house.planets.length > 0 && (
              <Text style={styles.planets} numberOfLines={3}>
                {house.planets.join(" ")}
              </Text>
            )}
          </View>
        );
      })}

      {/* Centre — no house */}
      <View style={[styles.centre, { top: cell, left: cell, width: cell * 2, height: cell * 2 }]}>
        <Text style={styles.centreText}>திருக்கணிதம்</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    position: "relative",
    borderWidth: 1.5,
    borderColor: C.gold,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: C.parchment,
  },
  cell: {
    borderWidth: 0.75,
    borderColor: C.divider,
    padding: 4,
  },
  rasiLabel: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 9,
    lineHeight: 12,
    color: C.textTertiary,
  },
  lagnaTag: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 8,
    lineHeight: 10,
    color: C.saffron,
  },
  planets: {
    fontFamily: "NotoSansTamil_700Bold",
    fontSize: 10,
    lineHeight: 14,
    color: C.textPrimary,
    flexShrink: 1,
  },
  centre: {
    position: "absolute",
    backgroundColor: C.parchment,
    borderWidth: 0.75,
    borderColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  centreText: {
    fontFamily: "NotoSansTamil_400Regular",
    fontSize: 7,
    lineHeight: 11,
    color: C.textTertiary,
    textAlign: "center",
  },
});
