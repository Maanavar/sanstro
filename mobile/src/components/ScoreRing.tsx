import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { C } from "@/theme/colors";

interface ScoreRingProps {
  score: number; // 0-10
  size?: number;
  textColor?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreRing({ score, size = 96, textColor = C.surface }: ScoreRingProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 10);
  const strokeWidth = Math.max(Math.round(size * 0.11), 8);
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    progress.value = withTiming(normalizedScore / 10, { duration: 1200 });
    return () => cancelAnimation(progress);
  }, [normalizedScore, progress]);

  // Drive the integer count-up on the JS thread in sync with the stroke animation
  const intProgress = useDerivedValue(() => Math.round(progress.value * 10));
  useAnimatedReaction(
    () => intProgress.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayScore)(current);
      }
    }
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center} cy={center} r={radius}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={strokeWidth} fill="none"
        />
        <AnimatedCircle
          cx={center} cy={center} r={radius}
          stroke={C.gold} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>

      <View
        style={{
          position: "absolute", width: size, height: size,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_800ExtraBold",
            fontSize: size * 0.37,
            lineHeight: size * 0.44,
            color: textColor,
          }}
        >
          {displayScore}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: size * 0.17,
            lineHeight: size * 0.22,
            color: textColor === C.surface ? "rgba(255,255,255,0.65)" : C.textSecond,
          }}
        >
          / 10
        </Text>
      </View>
    </View>
  );
}
