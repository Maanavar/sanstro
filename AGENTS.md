# Vinaadi AI — Agent Work Guide

**Last updated:** 2026-06-21  
**Scope:** Mobile app gap closure (critical bugs → missing features → UX polish)  
**Stack:** Expo / React Native (TypeScript), FastAPI backend, pnpm workspace

Read [CLAUDE.md](CLAUDE.md) before anything else — it defines path conventions, shell rules, DB safety, and encoding requirements.

---

## How to use this file

Work top-to-bottom. Each section is ordered by blast radius:

1. **Critical bugs** — wrong data shown to users or silent crashes in production
2. **Missing features** — backend exists, mobile screen does not
3. **UX / polish** — functionality is there, but experience is sub-standard
4. **Web gaps** — smaller surface, lower urgency

Each task has:
- A **problem** statement (what is broken and why it matters)
- **Files to touch** (exact paths from repo root)
- **Implementation notes** (what to do, with minimal code anchors)
- **Done when** (testable acceptance criterion)

---

## Section 1 — Critical Bugs 🔴

### BUG-1 · Panchangam location hardcoded to Chennai

**Problem:** Both Panchangam screens ignore user location and always compute timings for Chennai (13.08° N, 80.27° E). Every user outside Chennai gets wrong muhurta/kalam data.

**Files to touch:**
- [mobile/app/(tabs)/panchangam/index.tsx](mobile/app/(tabs)/panchangam/index.tsx)
- [mobile/app/(tabs)/panchangam/calendar.tsx](mobile/app/(tabs)/panchangam/calendar.tsx)

**Reference (working pattern):**
- [mobile/app/(tabs)/today.tsx](mobile/app/(tabs)/today.tsx) — already loads `guestPrefs` correctly

**Implementation notes:**

Both files currently declare:
```ts
const LAT = 13.0827; // Chennai
const LON = 80.2707;
```

Replace with the same `guestPrefs` load that `today.tsx` uses:

```ts
import { loadGuestPrefs } from '@/src/features/guest/guestStore';

// inside the component
const [prefs, setPrefs] = useState<GuestPrefs | null>(null);
useEffect(() => { loadGuestPrefs().then(setPrefs); }, []);

const lat = prefs?.lat ?? 13.0827;
const lon = prefs?.lon ?? 80.2707;
```

Pass `lat`/`lon` into every API call that currently uses the hardcoded constants. Add a `locationLabel` derived from `prefs?.cityName ?? 'Chennai'` and display it in the screen header so users can see which location is active.

**Done when:**
- Setting location to Madurai in onboarding, then opening Panchangam, shows Madurai-correct sunrise/sunset times
- Fallback to Chennai when prefs are null (guest with no location set)

---

### BUG-2 · RevenueCat not wired — premium is a stub

**Problem:** `react-native-purchases` is installed but never initialised. `handleSubscribe()` in premium screen shows an Alert saying "Coming Soon". No entitlement check happens anywhere — premium features are either always locked or always unlocked depending on hardcoded defaults.

**Files to touch:**
- [mobile/app/_layout.tsx](mobile/app/_layout.tsx) — root layout, initialise SDK here
- [mobile/app/premium.tsx](mobile/app/premium.tsx) — replace stub with real purchase flow
- [mobile/src/hooks/useSession.ts](mobile/src/hooks/useSession.ts) — add entitlement check

**Implementation notes:**

`mobile/.env.local` must have `REVENUECAT_PUBLIC_KEY=appl_xxx` (iOS) and `REVENUECAT_ANDROID_KEY=goog_xxx`. Add both to `mobile/src/lib/env.ts`.

In `_layout.tsx`, after font loading resolves, add:
```ts
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { REVENUECAT_PUBLIC_KEY, REVENUECAT_ANDROID_KEY } from '@/src/lib/env';

Purchases.configure({
  apiKey: Platform.OS === 'ios' ? REVENUECAT_PUBLIC_KEY : REVENUECAT_ANDROID_KEY,
});
```

In `premium.tsx`, replace `handleSubscribe`:
```ts
const handleSubscribe = async (pkg: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (customerInfo.entitlements.active['premium']) {
      router.replace('/(tabs)/today');
    }
  } catch (e: any) {
    if (!e.userCancelled) Alert.alert('Error', e.message);
  }
};
```

Fetch available offerings with `Purchases.getOfferings()` on mount and render real package cards.

In `useSession.ts`, after JWT login succeeds, call `Purchases.logIn(userId)` and read `customerInfo.entitlements.active['premium']` to set the `tier` field in session state.

**Done when:**
- Sandbox purchase on TestFlight completes and the app immediately reflects `tier: 'premium'`
- Restore purchases works (add a Restore button on premium screen calling `Purchases.restorePurchases()`)

---

### BUG-3 · Sentry DSN empty — crashes invisible in production

**Problem:** `mobile/.env.local` has `SENTRY_DSN=` (empty). `initAnalytics()` silently skips Sentry initialisation. Any crash in production is invisible.

**Files to touch:**
- `mobile/.env.local` — add real DSN value (never commit — use EAS secret)
- [mobile/src/lib/analytics.ts](mobile/src/lib/analytics.ts) — verify the init guard and log a warning when DSN is missing

**Implementation notes:**

In EAS dashboard: add `SENTRY_DSN` as an EAS secret for production and preview channels.

In `analytics.ts`, add a dev-time warning:
```ts
if (__DEV__ && !SENTRY_DSN) {
  console.warn('[analytics] SENTRY_DSN not set — crashes will not be reported');
}
```

In the web Dockerfile, add Sentry source map upload as a build step:
```dockerfile
RUN npx @sentry/cli sourcemaps inject .next && \
    npx @sentry/cli sourcemaps upload .next
```
Set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` in CI environment.

**Done when:**
- Deliberately throwing in a screen triggers a Sentry event visible in the dashboard
- EAS build log shows sourcemap upload step completing

---

## Section 2 — Missing Features 🟠

### FEAT-1 · Dasha Timeline screen

**Problem:** The web app has a full dasha scrubber and timeline. Mobile has nothing. This is one of the top-requested features.

**Files to create:**
- `mobile/app/dasha/index.tsx` — main screen
- `mobile/app/dasha/_layout.tsx` — stack layout for this route group

**Files to touch:**
- [mobile/app/(tabs)/today.tsx](mobile/app/(tabs)/today.tsx) — add "View Dasha" CTA from the today card
- [mobile/app/(tabs)/me.tsx](mobile/app/(tabs)/me.tsx) — link from profile section

**API:** `GET /api/v1/dasha/timeline?chart_id={id}` — already exists in backend. See [mobile/src/api/charts.ts](mobile/src/api/charts.ts) for the pattern.

**Implementation notes:**

The screen needs three sections:
1. **Current dasha banner** — Maha Dasha lord, Antar Dasha lord, exact start/end dates, years remaining. Large hero treatment.
2. **Horizontal scrubber** — a `FlatList` of Maha Dasha periods spanning the user's life. Active period highlighted. Tap to expand.
3. **Expanded period detail** — Antar Dasha sub-periods as a nested list with date ranges and a one-line prediction string per sub-period (backend returns `prediction_ta` / `prediction_en`).

Add a route to `mobile/app/(tabs)/_layout.tsx` is not needed — access via `router.push('/dasha')` from today and me screens.

**Done when:**
- Tapping "View Dasha" from Today screen opens the screen with real data
- Scrubbing to a past Maha Dasha period shows correct historical sub-periods

---

### FEAT-2 · Transit / Peyarchi alerts screen

**Problem:** Backend pushes peyarchi notifications via FCM and has `peyarchi_alert_service.py` + `transit_service.py`. The notification inbox exists but shows generic items — there is no dedicated screen to browse upcoming transits.

**Files to create:**
- `mobile/app/transits/index.tsx`

**Files to touch:**
- [mobile/app/notifications/inbox.tsx](mobile/app/notifications/inbox.tsx) — when notification type is `peyarchi`, deep-link to `/transits` instead of a generic detail

**API:** `GET /api/v1/transits/upcoming?rasi={rasi}&limit=12` — confirm endpoint in backend router.

**Implementation notes:**

Screen layout:
1. **Section header** — "Upcoming Transits" with the user's Rasi displayed
2. **Card list** — each card: planet name (Tamil + English), from-sign → to-sign, exact date/time, impact level badge (good/neutral/challenging), one-line summary
3. **Detail sheet** — tap a card to expand a bottom sheet (see UX-6 below for bottom sheet setup) with full Tamil/English description

Read user's rasi from `guestPrefs.rasi` (already stored) or from the primary chart in the vault.

**Done when:**
- Screen loads and shows at least 3 upcoming transits for any valid rasi
- Tapping a push notification for peyarchi opens this screen

---

### FEAT-3 · Varshaphala (Annual Prediction) screen

**Problem:** `varshaphala_service.py` exists, web panel exists, mobile has nothing.

**Files to create:**
- `mobile/app/varshaphala/index.tsx`

**Files to touch:**
- [mobile/app/(tabs)/me.tsx](mobile/app/(tabs)/me.tsx) — add link in the "My Charts" section

**API:** `GET /api/v1/varshaphala?chart_id={id}&year={yyyy}` — confirm in backend.

**Implementation notes:**

Screen layout:
1. **Year selector** — horizontal strip of years (±3 from current). Default to current year.
2. **Solar return details** — Varsha Lagna, Muntha position, Varshesh (year lord)
3. **Monthly prediction grid** — 12 cards, one per month, with a score and brief prediction
4. **House-by-house summary** — collapsible accordion per bhava

Use `useQuery` from `@tanstack/react-query` with `queryKey: ['varshaphala', chartId, year]`.

**Done when:**
- Opening the screen for current year shows real data
- Changing year re-fetches and updates all sections

---

### FEAT-4 · Expand Tools tab to match web (15 tools → 3 currently)

**Problem:** [mobile/app/(tabs)/tools/index.tsx](mobile/app/(tabs)/tools/index.tsx) shows only 3 tool cards (Porutham, Muhurta, and one more). Web has 15+ tools.

**Priority tools to add (in order):**
1. **Natchathiram Detail** — nakshatra characteristics, ruling deity, symbol, pada details
2. **Dosham Check** — Mangal Dosha, Kala Sarpa Dosha, Pitru Dosha flags with pariharam
3. **Yogam Analysis** — Raja Yoga, Dhana Yoga, Pancha Mahapurusha Yoga in the chart
4. **Pariharam (Remedies)** — per-dosha remedy list: temples, colours, mantras, stones
5. **Prashan (Horary)** — enter a question + current time → instant horary reading

**Files to touch:**
- [mobile/app/(tabs)/tools/index.tsx](mobile/app/(tabs)/tools/index.tsx) — add tool cards
- Create `mobile/app/(tabs)/tools/natchathiram.tsx`, `dosham.tsx`, `yogam.tsx`, `pariharam.tsx`, `prashan.tsx`

**Implementation notes:**

The tools index uses a grid of `ToolCard` components. Each card needs: Tamil title, English subtitle, icon (use a placeholder SVG initially), and `router.push` to the new screen.

Each new screen follows the same pattern as [mobile/app/(tabs)/tools/porutham.tsx](mobile/app/(tabs)/tools/porutham.tsx): `useQuery` hitting the relevant backend endpoint, results displayed with `BiText` for Tamil/English.

**Done when:**
- Tools tab shows at minimum 8 tool cards
- Each card navigates to a working screen that fetches and displays real data

---

### FEAT-5 · Make Chandrashtama screen dynamic

**Problem:** [mobile/app/chandrashtama.tsx](mobile/app/chandrashtama.tsx) contains hardcoded static Tamil/English text arrays. It never calls the backend to check if the user is in chandrashtama or when it ends.

**Files to touch:**
- [mobile/app/chandrashtama.tsx](mobile/app/chandrashtama.tsx)

**API:** `GET /api/v1/daily-guidance` already returns chandrashtama fields — check the response shape in [mobile/src/api/guidance.ts](mobile/src/api/guidance.ts).

**Implementation notes:**

Replace static arrays with a `useQuery` call to `/daily-guidance`. The response includes:
- `is_chandrashtama: boolean`
- `chandrashtama_ends: string | null` (ISO date)
- `chandrashtama_description_ta: string`
- `chandrashtama_description_en: string`

Show a dynamic banner: if `is_chandrashtama` is true, show a warning card with the end date. If false, show when the next period begins. Replace the static text blocks with `chandrashtama_description_ta/en`.

**Done when:**
- For a Kanni rasi user when Moon is in Scorpio: screen shows active chandrashtama with correct end date
- For users not in chandrashtama: screen shows next occurrence

---

## Section 3 — UX / Polish 🟡

These tasks transform the app from functional to world-class. Work through them in order as some have shared dependencies (e.g., install `react-native-reanimated` before attempting animations or shared elements).

---

### UX-1 · Add react-native-reanimated and spring animations

**Problem:** Zero spring animations anywhere. Every transition is a hard cut.

**Install first:**
```bash
pnpm add react-native-reanimated --filter mobile
```
Add `'react-native-reanimated/plugin'` to `babel.config.js` plugins array.

**Files to touch (priority order):**
- [mobile/app/(tabs)/today.tsx](mobile/app/(tabs)/today.tsx) — score ring entrance (FadeIn + scale spring on mount)
- [mobile/app/daily-score.tsx](mobile/app/daily-score.tsx) — card slide-in list (staggered FadeInDown)
- [mobile/app/(tabs)/tools/porutham.tsx](mobile/app/(tabs)/tools/porutham.tsx) — results sheet springs up (SlideInDown)
- [mobile/app/_layout.tsx](mobile/app/_layout.tsx) — screen transitions via `Animated.View` wrappers

**Pattern to follow:**
```tsx
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// entrance
<Animated.View entering={FadeInDown.delay(100).springify()}>
  <ScoreRing score={score} />
</Animated.View>
```

**Done when:**
- Launching the Today tab animates the score ring in with a spring
- Opening a tool result shows the result card springing up, not cutting in

---

### UX-2 · Add haptic feedback throughout

**Install:**
```bash
pnpm add expo-haptics --filter mobile
```

**Files to touch:** Every screen with interactive elements. Priority list:

| File | Trigger | Haptic type |
|------|---------|-------------|
| [mobile/app/(tabs)/tools/porutham.tsx](mobile/app/(tabs)/tools/porutham.tsx) | Nakshatra chip select | `selectionAsync()` |
| [mobile/app/(tabs)/tools/porutham.tsx](mobile/app/(tabs)/tools/porutham.tsx) | Check button press | `impactAsync(Medium)` |
| [mobile/app/(tabs)/tools/porutham.tsx](mobile/app/(tabs)/tools/porutham.tsx) | Porutham result "Good match" | `notificationAsync(Success)` |
| [mobile/app/(tabs)/tools/muhurta.tsx](mobile/app/(tabs)/tools/muhurta.tsx) | Activity chip select | `selectionAsync()` |
| [mobile/app/(onboarding)/rasi-picker.tsx](mobile/app/(onboarding)/rasi-picker.tsx) | Rasi card tap | `selectionAsync()` |
| [mobile/app/premium.tsx](mobile/app/premium.tsx) | Subscribe button | `impactAsync(Heavy)` |
| [mobile/app/(auth)/login.tsx](mobile/app/(auth)/login.tsx) | Login error | `notificationAsync(Error)` |
| [mobile/app/(tabs)/me.tsx](mobile/app/(tabs)/me.tsx) | Language toggle | `selectionAsync()` |

```ts
import * as Haptics from 'expo-haptics';
// on press:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

**Done when:** Every interactive element in the priority table above triggers the correct haptic response

---

### UX-3 · Replace emoji tab bar icons with SVG icons

**Problem:** [mobile/app/(tabs)/_layout.tsx](mobile/app/(tabs)/_layout.tsx) uses emoji strings as tab icons. These render inconsistently across Android and cannot be tinted.

**Install:**
```bash
pnpm add react-native-svg --filter mobile
```

**Files to create:**
- `mobile/src/components/icons/TodayIcon.tsx`
- `mobile/src/components/icons/PanchangamIcon.tsx`
- `mobile/src/components/icons/ToolsIcon.tsx`
- `mobile/src/components/icons/MeIcon.tsx`

Each icon component accepts `{ color: string; size: number }` props and renders an `<Svg>` with `<Path>` strokes. Use simple geometric icons (sun/moon, calendar grid, wrench, person silhouette).

**Files to touch:**
- [mobile/app/(tabs)/_layout.tsx](mobile/app/(tabs)/_layout.tsx) — replace `tabBarIcon: () => <Text>🌅</Text>` with `tabBarIcon: ({ color, size }) => <TodayIcon color={color} size={size} />`

**Done when:**
- Tab icons render as clean vector SVGs on both iOS and Android
- Active tab icon uses `tabBarActiveTintColor` correctly (visually distinct from inactive)

---

### UX-4 · Rewrite ScoreRing with SVG arc

**Problem:** [mobile/src/components/ScoreRing.tsx](mobile/src/components/ScoreRing.tsx) fakes an arc using two clipped Views. Visually glitches at the seam and doesn't animate.

**Files to touch:**
- [mobile/src/components/ScoreRing.tsx](mobile/src/components/ScoreRing.tsx) — full rewrite

**Implementation notes:**

Requires `react-native-svg` (installed in UX-3 above).

```tsx
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ScoreRing({ score }: { score: number }) {
  const R = 54;
  const circumference = 2 * Math.PI * R;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1200 });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      {/* track */}
      <Circle cx={60} cy={60} r={R} stroke="#E8E0D4" strokeWidth={10} fill="none" />
      {/* progress */}
      <AnimatedCircle
        cx={60} cy={60} r={R}
        stroke="#C8A96E"
        strokeWidth={10}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
        rotation={-90}
        origin="60, 60"
      />
    </Svg>
  );
}
```

**Done when:** Score ring animates smoothly from 0 to the target value on mount, with no visual seam

---

### UX-5 · Rewrite JadhagamChart with SVG

**Problem:** [mobile/src/components/JadhagamChart.tsx](mobile/src/components/JadhagamChart.tsx) uses `position: absolute` View grids. Planet text overflows, borders look blocky, and the South Indian diamond is not precise.

**Files to touch:**
- [mobile/src/components/JadhagamChart.tsx](mobile/src/components/JadhagamChart.tsx) — full rewrite using `react-native-svg`

**Implementation notes:**

The South Indian chart is a 4×4 grid of 12 rhombus cells around a centre label. Render it as an SVG with explicit `<Rect>` and `<Line>` elements for hairline borders (`strokeWidth={0.5}`), and `<Text>` for planet abbreviations with `fontSize={11}`.

Define the 12 cell positions as a constant mapping `{ bhava: number; row: number; col: number; width: number; height: number }[]` and render planet lists per bhava as stacked SVG `<Text>` lines.

Key constraint: the chart must fit in a 320×320 viewBox and be legible at 160pt display size on both platforms.

**Done when:**
- Jadhagam chart renders with clean hairline borders and no text overflow on both 375pt (SE) and 430pt (Pro Max) screen widths
- All 12 bhavas show correct planets from API data

---

### UX-6 · Implement dark mode

**Problem:** `mobile/src/theme/colors.ts` defines dark tokens (`darkBg`, `darkSurface`, etc.) but `useColorScheme()` is never called anywhere. All screens are hardcoded to light.

**Files to touch:**
- `mobile/src/theme/colors.ts` — export a `getColors(scheme: 'light' | 'dark')` function that returns the appropriate token set
- Create `mobile/src/hooks/useColors.ts` — wraps `useColorScheme()` and returns `getColors(scheme)`
- Every screen file — replace `import C from '@/src/theme/colors'` with `const C = useColors()`

**Implementation notes:**

```ts
// mobile/src/hooks/useColors.ts
import { useColorScheme } from 'react-native';
import { getColors } from '@/src/theme/colors';

export function useColors() {
  const scheme = useColorScheme() ?? 'light';
  return getColors(scheme);
}
```

```ts
// mobile/src/theme/colors.ts — add
export function getColors(scheme: 'light' | 'dark') {
  return scheme === 'dark' ? darkTokens : lightTokens;
}
```

Work through screens in dependency order: theme hook → Today → Panchangam → Tools → Me → auth screens → modals.

**Done when:**
- Switching iOS/Android system appearance to dark switches the app to dark mode with no white flash
- All text and backgrounds use dark tokens — no hardcoded `#FFF` or `parchment` visible in dark mode

---

### UX-7 · Add bottom sheets for result views

**Problem:** Porutham results, muhurta slot lists, and daily score breakdowns navigate to full screens. Apple-grade UX keeps the parent in view and presents results as a draggable bottom sheet.

**Install:**
```bash
pnpm add @gorhom/bottom-sheet --filter mobile
pnpm add @react-native-community/viewpager --filter mobile
```

Register the `GestureHandlerRootView` wrapper in [mobile/app/_layout.tsx](mobile/app/_layout.tsx) (required by `@gorhom/bottom-sheet`).

**Files to touch:**
- [mobile/app/(tabs)/tools/porutham.tsx](mobile/app/(tabs)/tools/porutham.tsx) — convert results from `router.push` to `bottomSheetRef.current.expand()`
- [mobile/app/(tabs)/tools/muhurta.tsx](mobile/app/(tabs)/tools/muhurta.tsx) — same pattern for slot list
- [mobile/app/daily-score.tsx](mobile/app/daily-score.tsx) — score breakdown as sheet from Today tap

**Pattern:**
```tsx
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

const sheetRef = useRef<BottomSheet>(null);
const snapPoints = useMemo(() => ['50%', '90%'], []);

// trigger:
sheetRef.current?.expand();

// sheet:
<BottomSheet ref={sheetRef} snapPoints={snapPoints} index={-1} enablePanDownToClose>
  <BottomSheetScrollView>
    {/* result content */}
  </BottomSheetScrollView>
</BottomSheet>
```

**Done when:**
- Running a Porutham check slides up a result sheet without leaving the tool picker screen
- Sheet can be dragged to 90% for more detail or dismissed by dragging down

---

### UX-8 · Add pull-to-refresh on all data screens

**Problem:** Only [mobile/app/(tabs)/today.tsx](mobile/app/(tabs)/today.tsx) has `RefreshControl`. All other screens with fetched data show stale content with no refresh affordance.

**Files to touch:**
- [mobile/app/(tabs)/panchangam/index.tsx](mobile/app/(tabs)/panchangam/index.tsx)
- [mobile/app/(tabs)/panchangam/calendar.tsx](mobile/app/(tabs)/panchangam/calendar.tsx)
- [mobile/app/notifications/inbox.tsx](mobile/app/notifications/inbox.tsx)
- [mobile/app/chandrashtama.tsx](mobile/app/chandrashtama.tsx)
- [mobile/app/family-vault.tsx](mobile/app/family-vault.tsx)

**Pattern (using react-query's refetch):**
```tsx
const { data, isFetching, refetch } = useQuery(...);

<ScrollView
  refreshControl={
    <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={C.gold} />
  }
>
```

**Done when:** Every screen in the list above shows the iOS/Android native pull-to-refresh spinner and reloads data on release

---

### UX-9 · Shared element transition: Score Ring → Daily Score

**Problem:** Tapping the score ring on Today navigates to daily-score.tsx with a hard cut. This should be a shared element expansion.

**Requires:** `react-native-reanimated` (UX-1), Expo Router v3 shared transitions.

**Files to touch:**
- [mobile/app/(tabs)/today.tsx](mobile/app/(tabs)/today.tsx) — tag the score ring with `sharedTransitionTag="score-ring"`
- [mobile/app/daily-score.tsx](mobile/app/daily-score.tsx) — tag the matching element with the same tag

**Implementation notes:**
```tsx
// today.tsx — wrap ScoreRing
import Animated from 'react-native-reanimated';
<Animated.View sharedTransitionTag="score-ring">
  <ScoreRing score={todayScore} />
</Animated.View>

// daily-score.tsx — matching element at top of screen
<Animated.View sharedTransitionTag="score-ring">
  <ScoreRing score={todayScore} size="large" />
</Animated.View>
```

**Done when:** Tapping the ring on Today morphs smoothly into the large ring at the top of Daily Score screen

---

## Section 4 — Web Gaps 🔵

These are lower urgency (web app is production-capable) but should be tracked.

### WEB-1 · Sentry source maps in web Dockerfile

**Problem:** Uncaught production errors will not have line numbers in Sentry.

**Files to touch:**
- `web/Dockerfile` (or `docker/web/Dockerfile`) — add source map upload step after `next build`

```dockerfile
RUN SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN \
    npx @sentry/nextjs sourcemaps inject .next && \
    npx @sentry/nextjs sourcemaps upload .next \
      --org $SENTRY_ORG --project $SENTRY_PROJECT
```

Add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` to CI secrets.

**Done when:** A deliberate throw in a web page shows a symbolised stack trace in Sentry

---

### WEB-2 · QA dashboard complex modals

These panels need manual QA sessions — they are complex stateful modals with no automated coverage:

- `web/components/dashboard-shadow-prompts.tsx`
- `web/components/dashboard-guest-chart-modal.tsx`

Test: open each modal, submit all form states (empty, valid, error), confirm data saves and modal closes cleanly. Record any bugs as GitHub issues.

---

### WEB-3 · Document payment flow

The web payment / subscription flow is not visible in the repo. Either:
- Document where it lives (external Stripe/RevenueCat redirect URL, Lemon Squeezy, etc.)
- Or add a `PAYMENT.md` in `web/` that explains the flow so future agents don't hunt for missing code

---

## Dependency install summary

Run once at the start of the mobile gap closure sprint:

```bash
pnpm add react-native-reanimated expo-haptics react-native-svg @gorhom/bottom-sheet \
  @react-native-community/viewpager --filter mobile
```

Add `'react-native-reanimated/plugin'` to `mobile/babel.config.js` plugins (must be last plugin).

Run `npx pod-install` inside `mobile/ios/` after adding native packages.

---

## Task order recommendation

For a single agent working sequentially, this order minimises re-work:

1. BUG-1 (location fix — no new deps, highest user impact)
2. BUG-3 (Sentry DSN — 10-minute fix, unlocks crash visibility for all subsequent work)
3. UX-1 (install Reanimated — unblocks UX-4, UX-5, UX-9)
4. UX-3 (install react-native-svg — unblocks UX-4, UX-5)
5. UX-4 (ScoreRing SVG rewrite)
6. UX-5 (JadhagamChart SVG rewrite)
7. UX-2 (haptics — no deps, quick wins)
8. UX-6 (dark mode — touches many files, do after other screens are stable)
9. UX-7 (bottom sheets)
10. UX-8 (pull-to-refresh — mechanical, low risk)
11. UX-9 (shared element transition — last, requires UX-1 stable)
12. BUG-2 (RevenueCat — needs real API keys from user)
13. FEAT-1 through FEAT-5 (new screens — build in any order after deps are in)
14. WEB-1 through WEB-3 (web gaps — separate from mobile work)
