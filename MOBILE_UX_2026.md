# Vinaadi Mobile — 2026 Design Completion Guide

**Last updated:** 2026-06-21  
**Goal:** Elevate every screen from "functional" to Apple / Google / Tesla-grade 2026 Gen Z quality.  
**Stack:** Expo SDK 52, React Native 0.76+, `react-native-reanimated` 3.x, `@gorhom/bottom-sheet` 5.x, `expo-blur`, `react-native-svg`, `expo-haptics`

Read [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md) first — path conventions, shell rules, and completed work are there.

---

## Design Philosophy

> **Stillness is earned. Every pixel should either carry meaning or disappear.**

Three rules that override all others:

1. **Spring, never linear.** Every transition uses spring physics (`mass 0.8, damping 18, stiffness 200`). Ease-in-out is banned from motion code.
2. **Glass, never flat.** Surfaces that float above content — tab bar, headers, modals — blur the content below. Flat white/black rectangles are 2020.
3. **Zero dead time.** If the network hasn't responded in 120 ms, the skeleton is already on screen. Users never stare at an empty view.

---

## Dependency install (run once)

```bash
pnpm add expo-blur expo-linear-gradient @react-native-community/blur \
  @gorhom/bottom-sheet react-native-gesture-handler \
  lottie-react-native --filter mobile

# If not yet installed:
pnpm add react-native-reanimated react-native-svg expo-haptics --filter mobile
```

Add to `mobile/babel.config.js` plugins **last**:
```js
'react-native-reanimated/plugin'
```

Run after adding native packages:
```bash
npx pod-install mobile/ios
```

---

## Section A — Foundation (complete this section first; everything else depends on it)

---

### A-1 · Semantic Color System + True Dark Mode

**Problem:** Dark tokens exist in `colors.ts` but `getColors()` is never called. All screens are hardcoded light.

**Files to touch:**
- `mobile/src/theme/colors.ts` — full rewrite with light/dark token sets
- Create `mobile/src/hooks/useColors.ts`
- Every screen that imports `C` from `@/theme/colors` — swap to hook

**Token design — use these exact values:**

```ts
// mobile/src/theme/colors.ts

const light = {
  // Backgrounds
  bg:          '#F9F4EC',   // parchment
  surface:     '#FFFFFF',
  surfaceAlt:  '#F4EDE4',
  surfaceCard: '#FFFDF9',

  // Text
  textPrimary:   '#1A1512',
  textSecond:    '#6B5744',
  textTertiary:  '#A89882',
  textInverse:   '#FFFFFF',

  // Accent (saffron family)
  saffron:  '#D4602A',
  gold:     '#C8A96E',
  amber:    '#E09D3A',
  maroon:   '#8B1A3C',

  // Semantic
  green:    '#2E8B57',
  alert:    '#C0392B',
  caution:  '#B87333',
  blue:     '#2563EB',

  // Chrome
  divider:     '#E8DDD2',
  border:      '#D4C9BB',
  overlay:     'rgba(26, 21, 18, 0.48)',
  tabBarBg:    'rgba(255, 255, 255, 0.82)',

  // Elevation shadows (iOS)
  shadow: '#1A1512',
} as const;

const dark = {
  bg:          '#0A0A0B',   // true OLED black
  surface:     '#131210',   // barely-warm dark
  surfaceAlt:  '#1C1A17',
  surfaceCard: '#181613',

  textPrimary:   '#F0EDE8',
  textSecond:    '#9E9187',
  textTertiary:  '#5E574F',
  textInverse:   '#0A0A0B',

  saffron:  '#E87040',   // pop brighter on dark
  gold:     '#D4B483',
  amber:    '#F0AA45',
  maroon:   '#C44060',

  green:    '#3DAD70',
  alert:    '#E05449',
  caution:  '#CC9944',
  blue:     '#4D8EF5',

  divider:     '#2A2320',
  border:      '#38302A',
  overlay:     'rgba(0, 0, 0, 0.72)',
  tabBarBg:    'rgba(13, 12, 10, 0.85)',

  shadow: '#000000',
} as const;

export type ColorTokens = typeof light;

export function getColors(scheme: 'light' | 'dark'): ColorTokens {
  return scheme === 'dark' ? dark : light;
}

// Backwards compat: default export is light (screens should migrate to useColors)
export const C = light;
```

**Create `mobile/src/hooks/useColors.ts`:**

```ts
import { useColorScheme } from 'react-native';
import { getColors, type ColorTokens } from '@/theme/colors';

export function useColors(): ColorTokens {
  const scheme = useColorScheme() ?? 'light';
  return getColors(scheme);
}
```

**Migration pattern for every screen:**

```tsx
// BEFORE
import { C } from '@/theme/colors';

// AFTER — add at top of component
const C = useColors();
```

**Done when:**
- Switching system appearance to dark makes every screen switch immediately with no white flash
- OLED screenshot shows true `#0A0A0B` black (verify with a colour picker)
- Tab bar, cards, and text all use dark tokens — no hardcoded `'#FFF'` or `'parchment'` strings remain

---

### A-2 · Spring Motion System

**Problem:** `FadeInDown` is used in one screen. The rest of the app cuts in. Spring configs are scattered.

**Files to create:**
- `mobile/src/theme/motion.ts` — canonical spring presets

**Files to touch:**
- Every screen's list renders, card entrances, and button presses

**`mobile/src/theme/motion.ts`:**

```ts
import { WithSpringConfig } from 'react-native-reanimated';

// Standard spring — most UI elements
export const SPRING_STD: WithSpringConfig = {
  mass: 0.8,
  damping: 18,
  stiffness: 200,
};

// Gentle — large panels, bottom sheets
export const SPRING_GENTLE: WithSpringConfig = {
  mass: 1.0,
  damping: 22,
  stiffness: 160,
};

// Snappy — micro feedback (press, toggle)
export const SPRING_SNAPPY: WithSpringConfig = {
  mass: 0.5,
  damping: 14,
  stiffness: 280,
};

// Delays for staggered lists (ms)
export const STAGGER_STEP = 55;
```

**Press feedback — create `mobile/src/components/PressCard.tsx`:**

Every tappable card in the app should use this instead of `TouchableOpacity`.

```tsx
import React, { useCallback } from 'react';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SPRING_SNAPPY } from '@/theme/motion';

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
    scale.value = withSpring(0.96, SPRING_SNAPPY);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_SNAPPY);
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

**List stagger pattern — apply to every `FlatList` / `ScrollView` with cards:**

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';
import { STAGGER_STEP } from '@/theme/motion';

// inside renderItem:
<Animated.View entering={FadeInDown.delay(index * STAGGER_STEP).springify()}>
  <PressCard ...>...</PressCard>
</Animated.View>
```

**Done when:**
- Every card in Today, Tools, Dasha, Transits, Varshaphala springs in staggered on first load
- Tapping any card shows a subtle scale-down → scale-up spring response

---

### A-3 · Typography Audit

**Problem:** Tamil and English text mixes `NotoSansTamil_*` and `Inter_*` inconsistently. Line heights for Tamil text are too tight, causing clipping on Android.

**Files to touch:**
- `mobile/src/theme/typography.ts`

**Correct values:**

```ts
// mobile/src/theme/typography.ts

export const EnType = {
  display:    { fontFamily: 'Inter_700Bold',    fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  heading:    { fontFamily: 'Inter_700Bold',    fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  subheading: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22 },
  body:       { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  label:      { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 },
  caption:    { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  micro:      { fontFamily: 'Inter_600SemiBold', fontSize: 10, lineHeight: 14, letterSpacing: 0.4 },
} as const;

// Tamil needs +4px line height vs Latin at every size due to vowel marks
export const TamilType = {
  display:    { fontFamily: 'NotoSansTamil_700Bold',    fontSize: 28, lineHeight: 44, letterSpacing: 0 },
  heading:    { fontFamily: 'NotoSansTamil_700Bold',    fontSize: 20, lineHeight: 34 },
  subheading: { fontFamily: 'NotoSansTamil_700Bold',    fontSize: 15, lineHeight: 28 },
  body:       { fontFamily: 'NotoSansTamil_400Regular', fontSize: 14, lineHeight: 26 },
  label:      { fontFamily: 'NotoSansTamil_700Bold',    fontSize: 13, lineHeight: 24 },
  caption:    { fontFamily: 'NotoSansTamil_400Regular', fontSize: 12, lineHeight: 22 },
  micro:      { fontFamily: 'NotoSansTamil_700Bold',    fontSize: 10, lineHeight: 18 },
} as const;
```

**Done when:**
- No Tamil text is clipped on any Android device (test on Pixel 7 or emulator)
- All letter-spacing overrides removed from individual screens — typography comes from this file only

---

## Section B — Navigation Shell

---

### B-1 · Glassmorphic Tab Bar

**Problem:** Tab bar is a flat white rectangle (`backgroundColor: C.surface`). In 2026, floating glass surfaces are the standard (Spotify, Apple Maps, iOS 18 tab bar).

**Files to touch:**
- `mobile/app/(tabs)/_layout.tsx`

**Implementation:**

```tsx
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Inside TabLayout, replace tabBarStyle:
const insets = useSafeAreaInsets();

<Tabs
  screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: C.saffron,
    tabBarInactiveTintColor: C.textTertiary,
    tabBarShowLabel: true,
    tabBarStyle: {
      position: 'absolute',          // float over content
      bottom: 0,
      left: 0,
      right: 0,
      height: 60 + insets.bottom,
      paddingBottom: insets.bottom + 4,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      elevation: 0,
    },
    tabBarBackground: () => (
      <BlurView
        intensity={80}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
    ),
  }}
>
```

**Also add bottom padding to all ScrollView `contentContainerStyle`:**

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();

// contentContainerStyle:
{ paddingBottom: 60 + insets.bottom + S.xl }
```

**Done when:**
- Content beneath the tab bar is visibly blurred through it on both iOS and Android
- Tab bar has no hard border — it blends naturally into the screen

---

### B-2 · Stack Transition Polish

**Problem:** Navigation between screens uses the default slide-right, which feels heavy for modal-style screens (Dasha, Varshaphala, Transits).

**Files to touch:**
- `mobile/app/_layout.tsx` — root Stack config

**Implementation:**

```tsx
import { Stack } from 'expo-router';

// In the root Stack, apply per-screen presentations:
<Stack>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

  {/* Modal-style screens slide up, not in from the side */}
  <Stack.Screen
    name="dasha/index"
    options={{
      headerShown: false,
      presentation: 'modal',
      animation: 'slide_from_bottom',
    }}
  />
  <Stack.Screen
    name="transits/index"
    options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
  />
  <Stack.Screen
    name="varshaphala/index"
    options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
  />
  <Stack.Screen
    name="daily-score"
    options={{ headerShown: false, presentation: 'card', animation: 'fade_from_bottom' }}
  />

  {/* Auth screens fade in */}
  <Stack.Screen
    name="(auth)"
    options={{ headerShown: false, animation: 'fade' }}
  />
</Stack>
```

**Done when:**
- Opening Dasha / Transits / Varshaphala slides up from bottom (like a native sheet)
- Going back dismisses them downward — the parent screen stays in place visually

---

### B-3 · Bottom Sheet System

**Problem:** Porutham results, Muhurta slot lists, and Daily Score drill-down navigate away. Native feel requires the parent context to stay in view.

**Files to touch:**
- `mobile/app/_layout.tsx` — wrap root in `GestureHandlerRootView`
- `mobile/app/(tabs)/tools/porutham.tsx` — results sheet
- `mobile/app/(tabs)/tools/muhurta.tsx` — slot list sheet
- `mobile/app/daily-score.tsx` — score breakdown sheet

**Step 1 — root layout:**

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Outermost wrapper in root _layout.tsx:
<GestureHandlerRootView style={{ flex: 1 }}>
  <Stack>...</Stack>
</GestureHandlerRootView>
```

**Step 2 — bottom sheet pattern (apply to porutham, muhurta, daily-score):**

```tsx
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useCallback, useRef, useMemo } from 'react';
import { useColors } from '@/hooks/useColors';

const C = useColors();
const sheetRef = useRef<BottomSheet>(null);
const snapPoints = useMemo(() => ['52%', '92%'], []);

const renderBackdrop = useCallback(
  (props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  ),
  []
);

// Trigger (replace router.push calls):
sheetRef.current?.snapToIndex(0);

// JSX (place at root of screen, outside ScrollView):
<BottomSheet
  ref={sheetRef}
  index={-1}
  snapPoints={snapPoints}
  enablePanDownToClose
  backdropComponent={renderBackdrop}
  backgroundStyle={{ backgroundColor: C.surface }}
  handleIndicatorStyle={{ backgroundColor: C.border }}
  animateOnMount
>
  <BottomSheetScrollView contentContainerStyle={{ padding: S.base, gap: S.md }}>
    {/* result content */}
  </BottomSheetScrollView>
</BottomSheet>
```

**Porutham-specific:** When `result.score >= 6`, trigger `Haptics.notificationAsync(NotificationFeedbackType.Success)` before opening the sheet.

**Done when:**
- Tapping "Check" on Porutham opens a draggable sheet over the input form — the nakshatra pickers remain visible behind it
- Sheet can be dragged to 92% for full detail, pulled down to dismiss
- Daily Score tapping the ring from Today opens the breakdown as a sheet, not a new screen

---

## Section C — Micro-interactions

---

### C-1 · Complete Haptic Map

Replace every remaining `TouchableOpacity` / `Pressable` across the app with `PressCard` (created in A-2) or add explicit haptic calls where the interaction has special meaning.

| Screen | Trigger | Haptic |
|--------|---------|--------|
| `today.tsx` | Score ring tap | `impactAsync(Medium)` |
| `today.tsx` | Section card tap | `impactAsync(Light)` |
| `daily-score.tsx` | Category row expand | `selectionAsync()` |
| `panchangam/index.tsx` | Date chip scroll select | `selectionAsync()` |
| `panchangam/calendar.tsx` | Day cell tap | `selectionAsync()` |
| `tools/porutham.tsx` | Nakshatra chip select | `selectionAsync()` |
| `tools/porutham.tsx` | Check button press | `impactAsync(Medium)` |
| `tools/porutham.tsx` | Result "Good match" reveal | `notificationAsync(Success)` |
| `tools/porutham.tsx` | Result "Incompatible" reveal | `notificationAsync(Warning)` |
| `tools/muhurta.tsx` | Activity chip select | `selectionAsync()` |
| `tools/muhurta.tsx` | Muhurta slot result (auspicious) | `notificationAsync(Success)` |
| `tools/dosham.tsx` | Dosha expand (present) | `impactAsync(Medium)` |
| `tools/yogam.tsx` | Yoga card expand | `selectionAsync()` |
| `tools/prashan.tsx` | Submit question | `impactAsync(Heavy)` |
| `(onboarding)/rasi-picker.tsx` | Rasi card select | `impactAsync(Light)` + selection |
| `premium.tsx` | Subscribe tap | `impactAsync(Heavy)` |
| `premium.tsx` | Purchase success | `notificationAsync(Success)` |
| `(auth)/login.tsx` | Login error | `notificationAsync(Error)` |
| `(auth)/login.tsx` | Login success | `notificationAsync(Success)` |
| `me.tsx` | Language toggle | `selectionAsync()` |
| `dasha/index.tsx` | Period expand | `selectionAsync()` |
| `transits/index.tsx` | Transit card expand | `selectionAsync()` |
| `varshaphala/index.tsx` | Year chip change | `selectionAsync()` |
| `varshaphala/index.tsx` | Bhava row expand | `selectionAsync()` |

---

### C-2 · Scroll-Driven Header Blur

**Problem:** Screen headers are plain-background views. As the user scrolls down, the header should pick up a blur/opacity effect to signal the scroll position — this is the iOS 2026 standard.

**Create `mobile/src/components/BlurHeader.tsx`:**

```tsx
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle, interpolate, SharedValue,
} from 'react-native-reanimated';
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
        <Animated.Text style={[styles.title, { color: C.textPrimary }, titleStyle]}>
          {title}
        </Animated.Text>
        {rightElement ?? <View style={{ width: 40 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, paddingHorizontal: 16,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16 },
});
```

**Wire it in:** Dasha, Transits, Varshaphala, Chandrashtama, Family Vault — any screen with a back button header. Pass `useAnimatedScrollHandler` from an `Animated.ScrollView`.

```tsx
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

const scrollY = useSharedValue(0);
const onScroll = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });

<BlurHeader title="தசா காலவரிசை" scrollY={scrollY} onBack={() => router.back()} />
<Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} ...>
```

**Done when:**
- On every detail screen, scrolling 48px into the content fades in a frosted glass header bar with the screen title
- Scroll back to top — header fades back to transparent

---

### C-3 · Loading → Content Transition

**Problem:** Skeleton cards cut directly to content. The replace should cross-fade.

**Pattern — wrap data views in:**

```tsx
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Skeleton:
{isLoading && (
  <Animated.View key="skeleton" exiting={FadeOut.duration(180)}>
    <SkeletonCard height={140} />
  </Animated.View>
)}

// Content:
{data && (
  <Animated.View key="content" entering={FadeIn.duration(240)}>
    {/* rendered data */}
  </Animated.View>
)}
```

Apply to: Today, Dasha, Transits, Varshaphala, Dosham, Yogam, Pariharam, Chandrashtama.

---

### C-4 · Empty States

**Problem:** When queries return 0 results (no upcoming transits, no chart), screens either show nothing or a raw text string.

**Create `mobile/src/components/EmptyState.tsx`:**

```tsx
interface Props {
  icon: string;           // emoji or SVG name
  titleTa: string;
  titleEn: string;
  bodyTa?: string;
  bodyEn?: string;
  ctaLabel?: string;
  onCta?: () => void;
  isTamil: boolean;
}

export function EmptyState({ icon, titleTa, titleEn, bodyTa, bodyEn, ctaLabel, onCta, isTamil }: Props) {
  const C = useColors();
  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.wrap}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: C.textPrimary, ...(isTamil ? TamilType.heading : EnType.heading) }]}>
        {isTamil ? titleTa : titleEn}
      </Text>
      {(bodyTa || bodyEn) && (
        <Text style={[styles.body, { color: C.textSecond, ...(isTamil ? TamilType.body : EnType.body) }]}>
          {isTamil ? bodyTa : bodyEn}
        </Text>
      )}
      {ctaLabel && onCta && (
        <PressCard onPress={onCta} haptic="medium" style={[styles.cta, { backgroundColor: C.saffron }]}>
          <Text style={[styles.ctaText, { color: C.textInverse }]}>{ctaLabel}</Text>
        </PressCard>
      )}
    </Animated.View>
  );
}
```

**Use on:**
- `transits/index.tsx` — when `items.length === 0` after loading
- `notifications/inbox.tsx` — when inbox is empty
- `family-vault.tsx` — when no family members added
- `dasha/index.tsx` — when guest or no chart
- `varshaphala/index.tsx` — when no chart

---

## Section D — Screen-by-Screen Upgrades

---

### D-1 · Today Screen

**Files to touch:** `mobile/app/(tabs)/today.tsx`

**Changes:**

1. **Score ring entrance** — already has `FadeInDown`, upgrade to shared transition tag:

```tsx
import Animated from 'react-native-reanimated';

<Animated.View sharedTransitionTag="score-ring">
  <ScoreRing score={todayScore} />
</Animated.View>
```

2. **Greeting line** — add a time-aware Tamil/English greeting above the score ring:

```tsx
function greeting(isTamil: boolean): string {
  const h = new Date().getHours();
  if (h < 12) return isTamil ? 'காலை வணக்கம்' : 'Good morning';
  if (h < 17) return isTamil ? 'மதிய வணக்கம்' : 'Good afternoon';
  return isTamil ? 'மாலை வணக்கம்' : 'Good evening';
}
```

3. **Location label** — show `prefs?.cityName ?? 'Chennai'` in a `TextInput`-less chip beneath the greeting so users know which location is active. Tap → navigates to `/(onboarding)/location`.

4. **Kaalam cards** — wrap each `TimeCard` in `PressCard` with `haptic="light"`, staggered `FadeInDown`.

5. **"View Dasha" CTA** — add after the guidance card:

```tsx
<PressCard onPress={() => router.push('/dasha')} haptic="medium" style={styles.dashaBtn}>
  <Text>...</Text>
  <Text style={styles.dashaArrow}>→</Text>
</PressCard>
```

**Done when:** Today screen feels like a living dashboard — greeting adapts, location is visible, every card springs in, ring tap morphs into Daily Score

---

### D-2 · Score Ring → Daily Score Shared Transition (UX-9)

**Problem:** Hard-cut transition between Today and Daily Score.

**Files to touch:**
- `mobile/app/(tabs)/today.tsx`
- `mobile/app/daily-score.tsx`

**today.tsx:**
```tsx
import Animated from 'react-native-reanimated';

<Animated.View sharedTransitionTag="score-ring">
  <TouchableOpacity onPress={() => router.push('/daily-score')}>
    <ScoreRing score={todayScore} />
  </TouchableOpacity>
</Animated.View>
```

**daily-score.tsx — at the top of the screen:**
```tsx
import Animated from 'react-native-reanimated';

<Animated.View sharedTransitionTag="score-ring">
  <ScoreRing score={score} size="large" />
</Animated.View>
```

**Done when:** The score ring on Today smoothly morphs/expands into the large ring at the top of Daily Score — no jump cut

---

### D-3 · Panchangam Calendar Tab

**Files to touch:** `mobile/app/(tabs)/panchangam/calendar.tsx`

**Changes:**

1. **Selected day highlight** — animate the selected day cell with a scale-spring when tapped:

```tsx
<PressCard
  onPress={() => { setSelectedDate(day); Haptics.selectionAsync(); }}
  haptic="none"   // haptic handled above
>
  <Animated.View entering={isToday ? ZoomIn.springify() : undefined}>
    ...
  </Animated.View>
</PressCard>
```

2. **Month transition** — when changing month, slide the grid left/right using `useAnimatedStyle` + `withSpring` on `translateX`.

3. **Location chip** — same as Today — show active location with tap-to-change.

---

### D-4 · Me / Profile Screen

**Files to touch:** `mobile/app/(tabs)/me.tsx`

**Changes:**

1. **Avatar section** — replace the initials view with a gradient circle using `expo-linear-gradient`:

```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={[C.saffron, C.maroon]}
  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
  style={styles.avatarGradient}
>
  <Text style={styles.avatarInitial}>{initials}</Text>
</LinearGradient>
```

2. **Section rows** — replace plain `TouchableOpacity` rows with `PressCard`. Add a subtle right-arrow `›` that springs to `›› ` on hover (animated).

3. **Premium badge** — if `tier === 'premium'`, show an animated gold shimmer label using `LinearGradient` + `Animated.View` looping `translateX`.

4. **Varshaphala link** — add in the "My Charts" section:

```tsx
<PressCard onPress={() => router.push('/varshaphala')} haptic="light">
  <Text>...</Text>
</PressCard>
```

---

### D-5 · Dasha Screen Visual Upgrade

**Files to touch:** `mobile/app/dasha/index.tsx`

**Changes:**

1. **Banner gradient** — replace `backgroundColor: '#1A2540'` with:

```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#1A2540', '#2A1A40']}
  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
  style={styles.banner}
>
```

2. **Active period pulse** — the active Maha Dasha period card should have a subtle border pulse animation:

```tsx
const pulse = useSharedValue(1);
useEffect(() => {
  pulse.value = withRepeat(withTiming(1.015, { duration: 1800 }), -1, true);
}, []);

const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

// Wrap active card:
{isActive && <Animated.View style={pulseStyle}>{card}</Animated.View>}
```

3. **Sub-period reveal** — animate the sub-period list in with `FadeInDown` stagger when expanded:

```tsx
{item.sub_periods.map((sp, i) => (
  <Animated.View key={i} entering={FadeInDown.delay(i * 40).springify()}>
    ...
  </Animated.View>
))}
```

---

## Section E — Premium Screen (BUG-2 completion check)

**Files to touch:** `mobile/app/premium.tsx`

Confirm the following are present (if not, implement):

1. **RevenueCat init in `_layout.tsx`:**

```tsx
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// After fonts load, before rendering:
Purchases.configure({
  apiKey: Platform.OS === 'ios' ? REVENUECAT_PUBLIC_KEY : REVENUECAT_ANDROID_KEY,
});
```

2. **Offerings fetch in `premium.tsx`:**

```tsx
const [offerings, setOfferings] = useState<Offerings | null>(null);
useEffect(() => {
  Purchases.getOfferings().then(setOfferings).catch(console.warn);
}, []);
```

3. **Real purchase handler:**

```tsx
const handleSubscribe = async (pkg: PurchasesPackage) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (customerInfo.entitlements.active['premium']) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/today');
    }
  } catch (e: any) {
    if (!e.userCancelled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(isTamil ? 'பிழை' : 'Error', e.message);
    }
  }
};
```

4. **Restore button:**

```tsx
<TouchableOpacity onPress={() => Purchases.restorePurchases()}>
  <Text>{isTamil ? 'கொள்முதல்களை மீட்டமை' : 'Restore Purchases'}</Text>
</TouchableOpacity>
```

5. **Visual upgrade — paywall design:**

```
┌─────────────────────────────────┐
│  [LinearGradient: saffron→maroon]│
│         ✦ Vinaadi Premium       │
│    [animated gold shimmer text] │
│                                 │
│  ✓ Dasha Timeline               │
│  ✓ Annual Predictions           │
│  ✓ Dosham & Yoga Analysis       │
│  ✓ Pariharam Remedies           │
│  ✓ Ad-free experience           │
│                                 │
│  [Annual ₹999/yr]  [SAVE 50%]   │
│  [Monthly ₹149/mo]              │
│                                 │
│  [CTA: Subscribe — spring press]│
│  [Restore Purchases]            │
└─────────────────────────────────┘
```

Replace the plan cards with `PressCard` components that show a selected ring animation when tapped.

---

## Section F — Accessibility & Platform Adaptation

---

### F-1 · Dynamic Type support

Every `Text` component that uses an absolute `fontSize` should also respond to system font scaling. Add `allowFontScaling={false}` ONLY for Tamil text — Tamil vowel marks break with scaled fonts. All English text should scale:

```tsx
<Text allowFontScaling={false} style={TamilType.body}>...</Text>  // Tamil
<Text style={EnType.body}>...</Text>                               // English — scales by default
```

---

### F-2 · Reduced Motion

Wrap all `entering` / `exiting` animations in a reduced-motion check:

```ts
// mobile/src/hooks/useMotion.ts
import { useReducedMotion } from 'react-native-reanimated';

export function useStagger(index: number) {
  const reduced = useReducedMotion();
  return reduced
    ? FadeIn.duration(0)
    : FadeInDown.delay(index * STAGGER_STEP).springify();
}
```

---

### F-3 · Android-specific fixes

| Issue | Fix |
|-------|-----|
| Ripple on PressCard | Add `android_ripple={{ color: C.saffron + '28', borderless: false }}` to `Pressable` in PressCard |
| Elevation shadow | Replace all iOS `shadowColor/shadowOffset` with `elevation: N` wrapped in `Platform.select` |
| Tab bar blur | On Android < API 31, `BlurView` falls back to a semi-opaque solid — add `fallbackColor={C.tabBarBg}` prop |
| Back gesture | `Drawer` and stack screens need `gestureEnabled: true` in options |
| Status bar | Use `<StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />` from `expo-status-bar` in root `_layout.tsx` |

---

## Section G — Web Gaps (lower priority)

### G-1 · Sentry Source Maps in Web Dockerfile

**File:** `web/Dockerfile`

After `RUN pnpm run build`, add:

```dockerfile
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN) \
    npx @sentry/nextjs sourcemaps inject .next && \
    npx @sentry/nextjs sourcemaps upload .next \
      --org $SENTRY_ORG --project $SENTRY_PROJECT
```

Add to CI secrets: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

### G-2 · Payment Flow documented

**File:** `web/PAYMENT.md` — confirm this exists and documents the Stripe/RevenueCat/Lemon Squeezy entrypoint URL, webhook path, and how the `tier` field is set on the user record after payment.

---

## Task Order (for a coding agent)

Complete in this exact sequence to avoid re-work:

| # | Task | Blocks |
|---|------|--------|
| 1 | A-1 Color system + dark mode | Everything downstream |
| 2 | A-2 Motion system + PressCard | C-1, D-*, animation work |
| 3 | A-3 Typography audit | Text clipping on Android |
| 4 | B-1 Glass tab bar | Shell look |
| 5 | B-3 Bottom sheet system | Porutham, Muhurta, Daily Score UX |
| 6 | C-1 Complete haptic map | Full sensory feedback |
| 7 | C-2 BlurHeader | Dasha, Transits, Varshaphala |
| 8 | C-3 Loading cross-fade | All data screens |
| 9 | C-4 Empty states | Transits, Inbox, Vault |
| 10 | D-1 Today screen upgrades | Score ring transition |
| 11 | D-2 Shared element transition | Score ring morph |
| 12 | D-3 Panchangam calendar | Calendar feel |
| 13 | D-4 Me screen | Profile polish |
| 14 | D-5 Dasha visual | Screen premium feel |
| 15 | E Premium paywall | RevenueCat must be wired first |
| 16 | B-2 Stack transitions | Navigation feel |
| 17 | F-1, F-2, F-3 Accessibility | Last — touches many files |
| 18 | G-1, G-2 Web gaps | Parallel, independent |

---

## Definition of Done — Overall

The app meets 2026 Apple / Google / Tesla Gen Z standard when all of the following are true:

- [ ] System dark mode switch immediately changes every screen with no white flash
- [ ] OLED screenshot shows `#0A0A0B` true black backgrounds in dark mode
- [ ] Tab bar blurs the content beneath it (visually verifiable)
- [ ] Every list that fetches data shows staggered spring entrance — no cut-in
- [ ] Every tappable card shows a scale-spring press response
- [ ] Every meaningful action has a haptic response matching the table in C-1
- [ ] Porutham result, Muhurta slots, and Daily Score breakdown open as bottom sheets
- [ ] Score ring on Today morphs into the large ring on Daily Score (shared element)
- [ ] Scroll 48px on any detail screen — a frosted header appears with the title
- [ ] Tamil text has zero clipping on a Pixel 7 emulator (check vowel marks)
- [ ] RevenueCat sandbox purchase completes and `tier: 'premium'` is reflected
- [ ] Sentry receives a test event from a deliberately thrown error
- [ ] All empty states show illustrated placeholders, not blank screens
- [ ] `useReducedMotion()` is respected — animations skip when accessibility flag is on
- [ ] Android ripple replaces the iOS press opacity on all interactive elements
