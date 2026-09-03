import React, { useEffect } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { C } from "@/theme/colors";
import { RADIUS, S } from "@/theme/spacing";
import { duration } from "@/theme/motion";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Checkmark path: M39 57.5 50.5 69 75 43
// Seg1: sqrt(11.5²+11.5²)≈16.3  Seg2: sqrt(24.5²+26²)≈35.7  Total≈52
const CHECK_LENGTH = 52;

// Constellation line lengths
const L1 = 27;  // (31,38)→(55,26)
const L2 = 31;  // (55,26)→(78,47)
const L3 = 33;  // (78,47)→(62,76)
const L4 = 49;  // (62,76)→(31,38)

const BURST = [
  { angle: 0,   color: C.saffron, size: 6, dist: 32 },
  { angle: 60,  color: C.gold,    size: 5, dist: 28 },
  { angle: 120, color: C.green,   size: 6, dist: 34 },
  { angle: 180, color: C.amber,   size: 4, dist: 30 },
  { angle: 240, color: C.skyBlue, size: 5, dist: 32 },
  { angle: 300, color: C.maroon,  size: 4, dist: 26 },
] as const;

function BurstParticle({
  angle, color, size, dist, delay,
}: { angle: number; color: string; size: number; dist: number; delay: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, { damping: 10, stiffness: 80 }));
  }, []);
  const rad = (angle * Math.PI) / 180;
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * dist * Math.cos(rad) },
      { translateY: progress.value * dist * Math.sin(rad) },
      { scale: 1 - progress.value * 0.4 },
    ],
    opacity: 1 - progress.value * 0.8,
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top: 64 - size / 2,
          left: 64 - size / 2,
        },
        animStyle,
      ]}
    />
  );
}

interface Props {
  title: string;
  body?: string;
  variant?: "constellation" | "success";
  style?: ViewStyle;
}

export function AnimatedEmptyState({ title, body, variant = "constellation", style }: Props) {
  const pulse = useSharedValue(0.92);

  // Success: checkmark stroke draw-in
  const checkOffset = useSharedValue(CHECK_LENGTH);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: checkOffset.value } as any));

  // Constellation: 4 line draw-ins (strokeDashoffset: len→0 reveals each line)
  const lOff1 = useSharedValue(L1);
  const lOff2 = useSharedValue(L2);
  const lOff3 = useSharedValue(L3);
  const lOff4 = useSharedValue(L4);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lProps1 = useAnimatedProps(() => ({ strokeDashoffset: lOff1.value } as any));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lProps2 = useAnimatedProps(() => ({ strokeDashoffset: lOff2.value } as any));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lProps3 = useAnimatedProps(() => ({ strokeDashoffset: lOff3.value } as any));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lProps4 = useAnimatedProps(() => ({ strokeDashoffset: lOff4.value } as any));

  // Constellation: 5 star opacity fade-ins
  const sOp1 = useSharedValue(0);
  const sOp2 = useSharedValue(0);
  const sOp3 = useSharedValue(0);
  const sOp4 = useSharedValue(0);
  const sOp5 = useSharedValue(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sProps1 = useAnimatedProps(() => ({ opacity: sOp1.value } as any));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sProps2 = useAnimatedProps(() => ({ opacity: sOp2.value } as any));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sProps3 = useAnimatedProps(() => ({ opacity: sOp3.value } as any));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sProps4 = useAnimatedProps(() => ({ opacity: sOp4.value } as any));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sProps5 = useAnimatedProps(() => ({ opacity: sOp5.value } as any));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.5 + (pulse.value - 0.92) * 2,
  }));

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: duration.slow }), -1, true);
    if (variant === "success") {
      checkOffset.value = withDelay(200, withTiming(0, { duration: 700 }));
    } else {
      // Stars appear first, then lines draw between them
      sOp1.value = withTiming(1, { duration: 280 });
      sOp2.value = withDelay(120, withTiming(1, { duration: 280 }));
      sOp3.value = withDelay(240, withTiming(1, { duration: 280 }));
      sOp4.value = withDelay(360, withTiming(1, { duration: 280 }));
      sOp5.value = withDelay(480, withTiming(1, { duration: 280 }));
      lOff1.value = withDelay(160, withTiming(0, { duration: duration.medium }));
      lOff2.value = withDelay(320, withTiming(0, { duration: duration.medium }));
      lOff3.value = withDelay(480, withTiming(0, { duration: duration.medium }));
      lOff4.value = withDelay(640, withTiming(0, { duration: duration.medium }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  return (
    <Animated.View entering={FadeInDown.springify()} style={[styles.wrap, style]}>
      <View style={styles.visual}>
        <Animated.View style={[styles.halo, haloStyle]} />
        <Svg width={112} height={112} viewBox="0 0 112 112">
          {variant === "success" ? (
            <>
              <Circle cx={56} cy={56} r={36} fill={C.goldMethodLight} stroke={C.goldMethod} strokeWidth={2} />
              <AnimatedPath
                d="M39 57.5 50.5 69 75 43"
                fill="none"
                stroke={C.green}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={CHECK_LENGTH}
                animatedProps={checkProps}
              />
              <Circle cx={32} cy={33} r={3} fill={C.goldMethod} />
              <Circle cx={82} cy={76} r={2.5} fill={C.saffron} />
            </>
          ) : (
            <>
              <AnimatedLine x1={31} y1={38} x2={55} y2={26} stroke={C.goldMethod} strokeWidth={1.4} strokeDasharray={L1} animatedProps={lProps1} />
              <AnimatedLine x1={55} y1={26} x2={78} y2={47} stroke={C.goldMethod} strokeWidth={1.4} strokeDasharray={L2} animatedProps={lProps2} />
              <AnimatedLine x1={78} y1={47} x2={62} y2={76} stroke={C.goldMethod} strokeWidth={1.4} strokeDasharray={L3} animatedProps={lProps3} />
              <AnimatedLine x1={62} y1={76} x2={31} y2={38} stroke={C.goldMethod} strokeWidth={1.4} strokeDasharray={L4} animatedProps={lProps4} />
              <AnimatedCircle cx={31} cy={38} r={5} fill={C.saffron} animatedProps={sProps1} />
              <AnimatedCircle cx={55} cy={26} r={4} fill={C.goldMethod} animatedProps={sProps2} />
              <AnimatedCircle cx={78} cy={47} r={5} fill={C.skyBlue} animatedProps={sProps3} />
              <AnimatedCircle cx={62} cy={76} r={4} fill={C.maroon} animatedProps={sProps4} />
              <AnimatedCircle cx={44} cy={63} r={2.5} fill={C.textTertiary} animatedProps={sProps5} />
            </>
          )}
        </Svg>
        {variant === "success" && BURST.map((p, i) => (
          <BurstParticle key={i} {...p} delay={850 + i * 40} />
        ))}
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
