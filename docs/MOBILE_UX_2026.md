# Vinaadi Mobile — 2026 Design Completion Guide (remaining work)

**Last updated:** 2026-07-05 (trimmed to open items only — see note below)
**Goal:** Elevate every screen from "functional" to Apple / Google / Tesla-grade 2026 Gen Z quality.
**Stack:** Expo SDK 52, React Native 0.76+, `react-native-reanimated` 3.x, `@gorhom/bottom-sheet` 5.x, `react-native-svg`, `expo-haptics`

Read [CLAUDE.md](../CLAUDE.md) and [AGENTS.md](../AGENTS.md) first — path conventions, shell rules, and completed work are there.

> **2026-07-05 audit note:** This doc originally specified ~20 checklist items. A code audit found roughly half already done or superseded by a different (equally valid, sometimes better) implementation — those sections were removed rather than left to invite re-implementation of things that already work. What's below is the real remaining backlog. Two items you should know about before picking anything up here:
> - **`expo-blur`, `@react-native-community/blur`, `expo-linear-gradient`, and `lottie-react-native` are not installed in `mobile/`.** Every glass/blur/gradient item below is blocked on running the install step first — this isn't a wiring gap, the dependency genuinely isn't there yet.
> - Color tokens now come from `@vinaadi/design-tokens` (`mobile/src/theme/colors.ts`, actual saffron `#D4611A`) — this doc's original literal hex values are superseded by that package. Don't reintroduce hardcoded hex values; extend the tokens package instead if a new color is needed.

---

## Dependency install (needed for the blur/gradient items below — not yet done)

```bash
pnpm add expo-blur expo-linear-gradient @react-native-community/blur \
  @gorhom/bottom-sheet react-native-gesture-handler \
  lottie-react-native --filter mobile
```

`@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-svg`, and `expo-haptics` are already installed and in real use — no action needed on those.

---

## A-1 · Finish the color-token migration (PARTIAL)

**Problem:** `useColors()` / `useResolvedColors()` exist and are used in most screens, but `wrapped/index.tsx`, `rectification/index.tsx`, `ShareCard.tsx`, and `AnimatedEmptyState.tsx` still import the static `C` directly instead of the hook.

**Fix:** Migrate those four files to `const C = useColors();` inside the component, same pattern already used everywhere else.

**Done when:** No file in `mobile/` imports `C` directly outside `mobile/src/theme/colors.ts` itself.

---

## A-2 · `PressCard` component (NOT DONE)

**Problem:** `mobile/src/theme/motion.ts` exists with spring presets (different names/values than originally spec'd here, but same concept — don't rename them), and haptics are already used broadly via `expo-haptics` in ~22 files. What's missing is a shared **press-feedback component** — cards still use plain `TouchableOpacity`/`activeOpacity` instead of a reusable scale-spring response.

**Create `mobile/src/components/PressCard.tsx`:**

```tsx
import React, { useCallback } from 'react';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props extends PressableProps {
  children: React.ReactNode;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
}

export function PressCard({ children, onPress, haptic = 'light', style, ...rest }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { mass: 0.5, damping: 14, stiffness: 280 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { mass: 0.5, damping: 14, stiffness: 280 });
  }, []);

  const handlePress = useCallback((e: any) => {
    if (haptic === 'light')     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (haptic === 'medium')    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (haptic === 'heavy')     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (haptic === 'selection') Haptics.selectionAsync();
    onPress?.(e);
  }, [haptic, onPress]);

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress} {...rest}>
      <Animated.View style={[animStyle, style as any]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

Roll out incrementally — replace `TouchableOpacity` with `PressCard` on tappable cards, screen by screen, rather than a single sweeping change.

**Done when:** Every tappable card shows a scale-spring press response, and `android_ripple` is set on the underlying `Pressable` for Android parity (see F-3 below).

---

## B-1 · Glassmorphic tab bar (NOT DONE — blocked on `expo-blur` install)

**Problem:** The tab bar in `mobile/app/(tabs)/_layout.tsx` is still a flat `backgroundColor: C.surface, borderTopWidth: 1`.

**Fix (after installing `expo-blur`):**

```tsx
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<Tabs
  screenOptions={{
    tabBarStyle: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 60 + insets.bottom, paddingBottom: insets.bottom + 4,
      backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0,
    },
    tabBarBackground: () => (
      <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
    ),
  }}
>
```

Add bottom padding (`60 + insets.bottom + spacing`) to every screen's scroll content so it isn't hidden behind the now-floating bar. On Android < API 31, pass `fallbackColor={C.tabBarBg}` since `BlurView` falls back to a semi-opaque solid there.

**Done when:** Content is visibly blurred through the tab bar on both platforms; no hard top border.

---

## B-2 · Stack transition polish (NOT DONE)

**Problem:** `dasha`, `transits`, and `varshaphala` are registered as plain `Stack.Screen` entries in the root `_layout.tsx` with only `headerShown: false` — no modal presentation.

**Fix:**

```tsx
<Stack.Screen name="dasha/index" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
<Stack.Screen name="transits/index" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
<Stack.Screen name="varshaphala/index" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
```

**Done when:** Opening any of these three slides up from the bottom like a native sheet; back gesture dismisses downward.

---

## B-3 · Daily Score as a bottom sheet (PARTIAL)

**Problem:** `@gorhom/bottom-sheet` is already genuinely wired for Porutham, Muhurta, and the synastry flow — that part is done. The one gap: Today still navigates to Daily Score via `router.push('/daily-score')` (a full screen), not a sheet.

**Fix:** Convert `daily-score` to a `BottomSheet` triggered from Today, following the exact pattern already used for the Porutham/Muhurta result sheets in this codebase (don't reinvent — copy their `snapPoints`/`backdropComponent` setup).

**Done when:** Tapping the score ring on Today opens the breakdown as a sheet, with Today visible/blurred behind it, not a screen transition.

---

## C-2 · Scroll-driven header blur (NOT DONE — blocked on `expo-blur` install)

**Problem:** No `BlurHeader` component exists yet.

**Create `mobile/src/components/BlurHeader.tsx`:**

```tsx
import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useColorScheme } from 'react-native';

interface Props {
  title: string;
  scrollY: SharedValue<number>;
  rightElement?: React.ReactNode;
  onBack?: () => void;
}

export function BlurHeader({ title, scrollY, rightElement, onBack }: Props) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 48], [0, 1], 'clamp'),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [32, 72], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(scrollY.value, [32, 72], [8, 0], 'clamp') }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View style={[StyleSheet.absoluteFill, blurStyle]}>
        <BlurView intensity={70} tint={scheme} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={styles.row}>
        {onBack && (
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={{ color: C.saffron, fontSize: 22 }}>←</Text>
          </Pressable>
        )}
        <Animated.Text style={[styles.title, { color: C.textPrimary }, titleStyle]}>{title}</Animated.Text>
        {rightElement ?? <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 16 },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16 },
});
```

Wire into Dasha, Transits, Varshaphala, Chandrashtama, Family Vault — any screen with a back-button header.

**Done when:** Scrolling 48px into any detail screen fades in a frosted header with the screen title; scrolling back to top fades it out.

---

## D-1 · Today screen: time-aware greeting (PARTIAL — narrow gap)

**Problem:** Everything else in the original Today-screen spec (score-ring shared transition, location chip, Gowri/kalam row, activity chips, Log-moment sheet, share/Ask-Vinaadi actions) is already built. The one missing piece: the greeting is a static "Welcome back, {name}" instead of a time-aware one.

**Fix:**

```tsx
function greeting(isTamil: boolean): string {
  const h = new Date().getHours();
  if (h < 12) return isTamil ? 'காலை வணக்கம்' : 'Good morning';
  if (h < 17) return isTamil ? 'மதிய வணக்கம்' : 'Good afternoon';
  return isTamil ? 'மாலை வணக்கம்' : 'Good evening';
}
```

---

## D-3 · Panchangam calendar — verify selected-day highlight (spot-check, low confidence)

`SwipeRouteView` is already used for month transitions in `panchangam/calendar.tsx` and `panchangam/index.tsx`. Not independently verified: whether the selected-day cell gets a `ZoomIn` spring highlight on tap. Spot-check before treating this as done or not-done.

---

## D-4 / D-5 · Gradient decoration (NOT DONE — blocked on `expo-linear-gradient` install)

**Problem:** `expo-linear-gradient` is not installed anywhere in `mobile/`, so the Me-screen avatar gradient, premium shimmer badge, and the Dasha screen's banner gradient (`#1A2540 → #2A1A40`) don't exist. The Dasha active-period pulse animation was not independently verified either way.

**Fix (after install):** see the original gradient snippets — Me-screen avatar (`LinearGradient` saffron→maroon), Dasha banner gradient, both straightforward `expo-linear-gradient` wraps once the dependency is present.

---

## E · Premium screen visual polish (NOT DONE — functional purchase flow is already solid)

**Status:** RevenueCat wiring (`Purchases.configure`, `getOfferings`, `purchasePackage`, `restorePurchases`, entitlement-vs-backend-tier reconciliation) is already real and more defensive than originally spec'd — no action needed there. What's missing is purely visual: the gradient hero background and animated gold shimmer text described in the original paywall mockup. Blocked on the same `expo-linear-gradient` install as D-4/D-5.

---

## F-1 · Dynamic Type support (UNVERIFIED — spot-check)

Confirm Tamil `Text` components use `allowFontScaling={false}` (Tamil vowel marks break with scaled fonts) while English text scales by default. Not confirmed either way — grep for `allowFontScaling` usage before assuming this needs work.

---

## F-2 · Reduced motion (NOT DONE)

**Problem:** Zero `useReducedMotion` usage anywhere in `mobile/`.

**Create `mobile/src/hooks/useMotion.ts`:**

```ts
import { useReducedMotion } from 'react-native-reanimated';
import { FadeIn, FadeInDown } from 'react-native-reanimated';

export function useStagger(index: number, staggerStep = 55) {
  const reduced = useReducedMotion();
  return reduced ? FadeIn.duration(0) : FadeInDown.delay(index * staggerStep).springify();
}
```

**Done when:** Animations skip/shorten when the OS reduce-motion accessibility flag is on.

---

## F-3 · Android-specific fixes (UNVERIFIED — spot-check)

Not confirmed either way: ripple on pressables, `elevation` vs iOS shadow props, back-gesture enablement, status bar style per color scheme. Check these specifically rather than assuming absence.
