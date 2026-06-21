import React from "react";
import { View, Text } from "react-native";
import { C } from "@/theme/colors";

interface ScoreRingProps {
  score: number;  // 0–10
  size?: number;
  textColor?: string;
}

export function ScoreRing({ score, size = 96, textColor = "#FFFFFF" }: ScoreRingProps) {
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const bw = Math.round(size * 0.11);
  const half = size / 2;

  // Two-semicircle technique: right clip handles 0–50%, left clip 50–100%
  const rightRotate = Math.min(pct * 360 - 180, 0);   // -180° to 0°
  const leftRotate = Math.max((pct - 0.5) * 360, 0);  // 0° to 180°

  return (
    <View style={{ width: size, height: size }}>
      {/* Track ring */}
      <View style={{
        position: "absolute",
        width: size, height: size,
        borderRadius: half,
        borderWidth: bw,
        borderColor: "rgba(255,255,255,0.18)",
      }} />

      {/* Right fill: shows 0–50% of arc progress */}
      <View style={{
        position: "absolute",
        left: half, top: 0,
        width: half, height: size,
        overflow: "hidden",
      }}>
        <View style={{
          position: "absolute",
          left: -half, top: 0,
          width: size, height: size,
          borderRadius: half,
          borderWidth: bw,
          borderColor: C.saffron,
          transform: [{ rotate: `${rightRotate}deg` }],
        }} />
      </View>

      {/* Left fill: shows 50–100% of arc progress */}
      {pct > 0.5 && (
        <View style={{
          position: "absolute",
          left: 0, top: 0,
          width: half, height: size,
          overflow: "hidden",
        }}>
          <View style={{
            position: "absolute",
            left: 0, top: 0,
            width: size, height: size,
            borderRadius: half,
            borderWidth: bw,
            borderColor: C.gold,
            transform: [{ rotate: `${leftRotate}deg` }],
          }} />
        </View>
      )}

      {/* Center score text */}
      <View style={{
        position: "absolute",
        width: size, height: size,
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Text style={{
          fontFamily: "Inter_800ExtraBold",
          fontSize: size * 0.37,
          lineHeight: size * 0.44,
          color: textColor,
        }}>
          {score}
        </Text>
        <Text style={{
          fontFamily: "Inter_400Regular",
          fontSize: size * 0.17,
          lineHeight: size * 0.22,
          color: textColor === "#FFFFFF"
            ? "rgba(255,255,255,0.65)"
            : C.textSecond,
        }}>
          / 10
        </Text>
      </View>
    </View>
  );
}
