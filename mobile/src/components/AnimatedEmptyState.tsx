import React, { useEffect } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { duration } from "@/theme/motion";

interface Props {
  title: string;
  body?: string;
  variant?: "constellation" | "success";
  style?: ViewStyle;
}

export function AnimatedEmptyState({
  title,
  body,
  variant = "constellation",
  style,
}: Props) {
  const pulse = useSharedValue(0.92);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: duration.slow }), -1, true);
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.5 + (pulse.value - 0.92) * 2,
  }));

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.wrap, style]}>
      <View style={styles.visual}>
        <Animated.View style={[styles.halo, haloStyle]} />
        <Animated.View entering={FadeIn.duration(duration.medium)}>
          <Svg width={112} height={112} viewBox="0 0 112 112">
            {variant === "success" ? (
              <>
                <Circle cx={56} cy={56} r={36} fill={C.goldMethodLight} stroke={C.goldMethod} strokeWidth={2} />
                <Path
                  d="M39 57.5 50.5 69 75 43"
                  fill="none"
                  stroke={C.green}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx={32} cy={33} r={3} fill={C.goldMethod} />
                <Circle cx={82} cy={76} r={2.5} fill={C.saffron} />
              </>
            ) : (
              <>
                <Line x1={31} y1={38} x2={55} y2={26} stroke={C.goldMethod} strokeWidth={1.4} />
                <Line x1={55} y1={26} x2={78} y2={47} stroke={C.goldMethod} strokeWidth={1.4} />
                <Line x1={78} y1={47} x2={62} y2={76} stroke={C.goldMethod} strokeWidth={1.4} />
                <Line x1={62} y1={76} x2={31} y2={38} stroke={C.goldMethod} strokeWidth={1.4} />
                <Circle cx={31} cy={38} r={5} fill={C.saffron} />
                <Circle cx={55} cy={26} r={4} fill={C.goldMethod} />
                <Circle cx={78} cy={47} r={5} fill={C.skyBlue} />
                <Circle cx={62} cy={76} r={4} fill={C.maroon} />
                <Circle cx={44} cy={63} r={2.5} fill={C.textTertiary} />
              </>
            )}
          </Svg>
        </Animated.View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: S.sm,
    padding: S.xl,
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: C.divider,
  },
  visual: {
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.goldMethodLight,
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 18,
    lineHeight: 24,
    color: C.textPrimary,
    textAlign: "center",
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: C.textSecond,
    textAlign: "center",
  },
});
