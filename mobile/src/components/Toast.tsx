/**
 * Reanimated toast — slides down from top of screen, auto-dismisses in 3s.
 * Design spec: UX Excellence Audit §Finding 12
 * Triggered via useToast() hook — never instantiate directly.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { S } from "@/theme/spacing";
import { spring, duration } from "@/theme/motion";

export type ToastTone = "success" | "error";

export interface ToastState {
  message: string;
  tone: ToastTone;
  id: number;
}

interface ToastProps {
  state: ToastState | null;
}

const TOAST_HEIGHT = 56;
const AUTO_DISMISS_MS = 3000;

export function Toast({ state }: ToastProps) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-TOAST_HEIGHT - insets.top);

  React.useEffect(() => {
    if (!state) return;
    translateY.value = withSequence(
      withSpring(0, spring.snappy),
      withDelay(AUTO_DISMISS_MS, withTiming(-TOAST_HEIGHT - insets.top, { duration: duration.base })),
    );
  }, [state?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!state) return null;

  const isSuccess = state.tone === "success";
  const iconColor = isSuccess ? C.green : C.alert;
  const bgColor = isSuccess ? C.greenLight : C.alertLight;
  const borderColor = isSuccess ? C.green : C.alert;

  return (
    <Animated.View
      style={[styles.wrapper, { top: insets.top + S.sm }, animatedStyle]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.pill, { backgroundColor: bgColor, borderColor }]}>
        {isSuccess ? (
          <CheckCircle2 size={18} color={iconColor} strokeWidth={1.5} />
        ) : (
          <XCircle size={18} color={iconColor} strokeWidth={1.5} />
        )}
        <Text style={[styles.message, { color: C.textPrimary }]} numberOfLines={2}>
          {state.message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: S.lg,
    right: S.lg,
    zIndex: 9999,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    paddingVertical: S.sm,
    paddingHorizontal: S.lg,
    borderRadius: 9999,
    borderWidth: 1,
    maxWidth: 360,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
});
