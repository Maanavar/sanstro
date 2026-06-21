# Vinaadi AI — Mobile App Build Specification
**Single source of truth for any coding agent implementing the mobile app.**
**Authority order:** `MOBILE_DECISIONS.md` > this file > `MOBILE_APP_PLAN.md` > `MOBILE_UX_STRATEGY.md`
**Design visuals:** `MOBILE_DESIGN_BRIEF.md` (32 screens, exact hex/Tamil strings/ad slots)
**Last updated:** 2026-06-20

---

## 0. Non-Negotiables

- **Bilingual throughout.** Every string ships in both Tamil (`ta`) and English (`en`). Tamil is the *default*; English is the fallback. The same `BiText { ta: string; en: string }` type used on the web applies here. No screen is Tamil-only. User can toggle language in Settings.
- **Expo + React Native, not a web wrapper.** Talk directly to FastAPI; never through the Next.js proxy.
- **Bearer + refresh token auth.** Cookies are web-only. Mobile stores tokens in `expo-secure-store`.
- **Guest-first.** App must be fully usable with no account. Login wall = never.
- **Tamil font must be bundled.** Never rely on system Tamil fonts on Android. Noto Sans Tamil only.

---

## 1. Tech Stack (locked)

| Layer | Choice |
|---|---|
| Runtime | Expo SDK 52+ (dev client — NOT Expo Go; `expo-secure-store` needs native) |
| Navigation | Expo Router v4 (file-based, typed routes) |
| Language | TypeScript 5.x strict |
| Data / cache | `@tanstack/react-query` v5 + `@tanstack/react-query-persist-client` |
| Token storage | `expo-secure-store` |
| Offline cache / prefs | `@react-native-async-storage/async-storage` |
| HTTP | Native `fetch` (custom wrapper — no Axios) |
| Notifications | `expo-notifications` → Expo Push → FCM/APNs |
| Fonts | `expo-font`, bundled Noto Sans Tamil (Regular + Bold) + Inter |
| Localisation | `expo-localization` + custom i18n (see §5) |
| Ads (Phase A) | `react-native-google-mobile-ads` (AdMob) |
| IAP (Phase B) | `react-native-purchases` (RevenueCat) |
| Widgets | `react-native-widgetkit` (iOS) + `react-native-android-widget` |
| Share cards | `react-native-view-shot` → `react-native-share` |
| Chart rendering | `react-native-skia` (jadhagam 12-house square, Phase B) |
| Analytics | PostHog React Native (or `@segment/analytics-react-native`) |
| Crash | `@sentry/react-native` |
| Build | EAS Build — profiles: `development` / `staging` / `production` |
| OTA | Expo Updates (channel per EAS profile) |
| Monorepo | pnpm workspaces |
| State | React Query + minimal Context (session + language). **No Redux. No Zustand for MVP.** |

---

## 2. Repository Layout

```
sanstro/                          ← existing repo root
├── app/                          ← FastAPI backend (existing, do not move)
├── web/                          ← Next.js web (existing, do not move)
├── mobile/                       ← NEW
│   ├── app/                      ← Expo Router file-based routes
│   │   ├── _layout.tsx           ← root layout: session bootstrap + font load
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── (onboarding)/
│   │   │   ├── location.tsx          ← Screen 02
│   │   │   ├── rasi-picker.tsx       ← Screen 03
│   │   │   ├── birth-details.tsx     ← Screens 17–19
│   │   │   └── jadhagam-reveal.tsx   ← Screen 20
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx           ← 4-tab bottom bar
│   │   │   ├── today.tsx             ← Screens 04 / 21 (guest / registered variant)
│   │   │   ├── panchangam/
│   │   │   │   ├── index.tsx         ← Screen 05 (day view)
│   │   │   │   └── calendar.tsx      ← Screen 06 (month calendar)
│   │   │   ├── tools/
│   │   │   │   ├── index.tsx         ← Screen 07
│   │   │   │   ├── porutham.tsx      ← Screens 08–09
│   │   │   │   └── muhurta.tsx       ← Screens 10–11
│   │   │   └── me.tsx                ← Screens 12 / 27 (guest / registered)
│   │   ├── jadhagam/
│   │   │   ├── [id].tsx              ← Screen 24 (1-page result)
│   │   │   └── upsell.tsx            ← Screens 25–26
│   │   ├── notifications/
│   │   │   ├── inbox.tsx             ← Screen 28
│   │   │   └── settings.tsx          ← Screen 29
│   │   ├── chandrashtama.tsx         ← Screen 23
│   │   ├── premium.tsx               ← Screen 30
│   │   ├── family-vault.tsx          ← Screen 31 (Phase C)
│   │   └── ask-vinaadi.tsx           ← Screen 32 (Phase C)
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts             ← fetch wrapper, 401 interceptor, token rotation
│   │   │   ├── auth.ts
│   │   │   ├── panchangam.ts
│   │   │   ├── guidance.ts
│   │   │   ├── charts.ts
│   │   │   ├── notifications.ts
│   │   │   └── tools.ts
│   │   ├── components/               ← shared RN primitives
│   │   │   ├── BiText.tsx            ← renders ta/en based on language context
│   │   │   ├── TimeCard.tsx          ← nalla neram / rahu kalam card
│   │   │   ├── RasiPalanCard.tsx
│   │   │   ├── ScoreRing.tsx
│   │   │   ├── PanchangamGrid.tsx
│   │   │   ├── JadhagamChart.tsx     ← Skia 12-house square
│   │   │   ├── AdUnit.tsx
│   │   │   ├── ThirukanithamBadge.tsx
│   │   │   ├── SkeletonCard.tsx      ← warm-mist shimmer
│   │   │   ├── ErrorCard.tsx
│   │   │   └── ShareCard.tsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── guest/                ← local rasi/location, anonymous push token
│   │   │   ├── guidance/
│   │   │   ├── panchangam/
│   │   │   ├── tools/
│   │   │   ├── jadhagam/
│   │   │   └── notifications/
│   │   ├── hooks/
│   │   │   ├── useSession.ts
│   │   │   ├── useI18n.ts            ← returns t(key) for current language
│   │   │   └── useConversionPrompt.ts
│   │   ├── lib/
│   │   │   ├── queryClient.ts
│   │   │   ├── secureStore.ts        ← typed token read/write/clear
│   │   │   ├── env.ts                ← typed env from EAS / app.config.ts
│   │   │   └── analytics.ts
│   │   ├── state/
│   │   │   ├── sessionContext.tsx    ← { user | null, tier: "guest"|"registered"|"premium" }
│   │   │   └── languageContext.tsx   ← { lang: "ta" | "en", setLang }
│   │   └── theme/
│   │       ├── colors.ts             ← see §6
│   │       ├── typography.ts         ← Noto Tamil + Inter tokens
│   │       └── spacing.ts            ← 4px grid
│   ├── widgets/
│   │   ├── ios/                      ← WidgetKit Swift extension
│   │   └── android/                  ← AppWidget Kotlin
│   ├── assets/fonts/                 ← NotoSansTamil-*.ttf + Inter-*.ttf
│   ├── app.config.ts
│   ├── eas.json
│   └── package.json
└── packages/
    └── shared/                       ← NEW — pure TS, no DOM, no RN
        ├── src/
        │   ├── types/                ← BiText + all API types (migrated from web/lib/types.ts)
        │   ├── format/               ← DOM-free date/score formatters
        │   ├── i18n/                 ← string keys + translation maps (ta/en)
        │   └── constants/            ← rasi names, nakshatra list, life-event types
        └── package.json              ← name: "@vinaadi/shared"
```

`web/lib/types.ts` re-exports from `@vinaadi/shared` after migration so web imports don't break.

---

## 3. Backend Changes (do these before writing any screen)

All changes are **additive and backwards-compatible**. Web continues to use cookies unchanged.

### P0 — Fix `/me` endpoints (2 h, must be first)

`app/api/auth.py` lines ~138, ~171, ~208: the handlers for `GET /me`, `PATCH /me`, `DELETE /me`
read `Cookie()` directly instead of using `get_current_user`.
**Fix:** replace the inline cookie dependency with `Depends(get_current_user)` in all three.
`get_current_user` (`app/core/auth.py:65`) already accepts both Bearer header and cookie — web is unaffected.

### P0 — Mobile auth endpoints

Add to `app/api/auth.py` (or new `app/api/mobile_auth.py`):

```
POST /auth/mobile/login      → { accessToken, refreshToken, expiresIn, user }
POST /auth/mobile/register   → same shape
POST /auth/mobile/refresh    → { accessToken, refreshToken, expiresIn }   (rotates old pair)
POST /auth/mobile/logout     → 204   (revokes the presented refreshToken)
```

Reuse `_verify_password`, `_hash_password`, `create_access_token`.
Access token TTL: 30 min. Refresh token TTL: 60 days, **rotated on every use**.
On revoked-token reuse: revoke ALL tokens for that user (theft signal).

### P0 — Refresh token model + migration

Create `app/models/refresh_token.py`:
```
token_hash, user_id, device_id, expires_at, revoked_at, last_used_at
```
Store only the SHA-256 hash — never plaintext. New table only → migration is backwards-safe.
Test `alembic upgrade head` + `downgrade` on `vinaadi_test` before touching dev.

### P1 — Multi-device push token model

Create `app/models/device_token.py`:
```
device_id (client UUID), user_id (nullable for anonymous/guest), fcm_token,
platform (ios|android), app_version, updated_at
```

```
POST /devices/push-token   ← upsert by (user_id OR anonymous_id, device_id)
DELETE /devices/push-token ← on logout or permission revoke
```

Update `app/services/notification_dispatch_service.py` to fan out to all `DeviceToken` rows per user.
Keep existing `fcm_device_token` on `User` during transition; backfill; deprecate in Phase B.

### P1 — RevenueCat webhook (before IAP launch in Phase B)

```
POST /webhooks/revenuecat   ← validate RevenueCat signature → upsert app/models/subscription.py
```

### Definition of done before screen work

- [ ] `/me` family passes pytest with `Authorization: Bearer` token
- [ ] 4 mobile auth endpoints return correct token shapes
- [ ] Refresh token table: up + down migration green on `vinaadi_test`
- [ ] Device token upsert + fan-out tested
- [ ] Anonymous push token (guest, `user_id=null`) accepted

---

## 4. API Client Architecture

```typescript
// mobile/src/api/client.ts
// Single-flight 401 refresh — queue concurrent 401s, resolve after one refresh
const QUEUE: Array<() => void> = [];
let isRefreshing = false;

async function fetchWithAuth(url: string, init: RequestInit): Promise<Response> {
  const token = await SecureStore.getItemAsync("access_token");
  const res = await fetch(ENV.API_BASE_URL + url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });

  if (res.status !== 401) return res;

  if (!isRefreshing) {
    isRefreshing = true;
    try {
      await rotateTokens();           // POST /auth/mobile/refresh
      QUEUE.forEach(fn => fn());
      QUEUE.length = 0;
    } catch {
      await clearSession();
      router.replace("/(auth)/login");
      return res;
    } finally { isRefreshing = false; }
  }
  return new Promise(resolve => QUEUE.push(() => resolve(fetchWithAuth(url, init))));
}
```

`ACCESS_TOKEN` in `expo-secure-store` (Keychain/Keystore). Never `AsyncStorage` for tokens.

---

## 5. Bilingual System

Every user-facing string ships in both languages. Language can be toggled in Settings (default: Tamil).

### String structure

```typescript
// packages/shared/src/i18n/strings.ts
export const strings = {
  tabs: {
    today:      { ta: "இன்று",       en: "Today" },
    panchangam: { ta: "பஞ்சாங்கம்",  en: "Panchangam" },
    tools:      { ta: "கருவிகள்",    en: "Tools" },
    me:         { ta: "நான்",        en: "Me" },
  },
  // ... all strings keyed the same way
} as const;
```

### `BiText` component (renders current language)

```typescript
// mobile/src/components/BiText.tsx
export function BiText({ value, style }: { value: BiText; style?: TextStyle }) {
  const { lang } = useLanguage();
  return <Text style={style}>{value[lang]}</Text>;
}
```

### Rules

- Tamil text must appear **at equal or larger size** than its English equivalent on the same screen.
- When `lang === "ta"`: use `NotoSansTamil` font family. When `lang === "en"`: use `Inter`.
- API data (`BiText { ta, en }`) from FastAPI already carries both — display the active language's field.
- Push notification body: send both languages; display device-language-matched copy.
- Widget: reads `lang` from `AsyncStorage` / shared preferences and shows the right copy.
- All Tamil strings in `MOBILE_DESIGN_BRIEF.md §6` are the canonical reference.

---

## 6. Theme Tokens

Full spec in `MOBILE_DESIGN_BRIEF.md §1`. Key values for implementation:

```typescript
// mobile/src/theme/colors.ts
export const C = {
  saffron:     "#D4611A",   // primary CTA, active tab
  ochre:       "#A8430E",   // pressed states
  amber:       "#F5A855",   // soft backgrounds
  maroon:      "#8B1A3C",   // badges, alerts, premium
  gold:        "#C9971C",   // score rings, premium
  parchment:   "#FAF7F2",   // app background (NEVER pure white)
  surface:     "#FFFFFF",   // cards, bottom nav
  surfaceAlt:  "#F5F0EA",   // secondary cards, inputs
  textPrimary: "#1C1008",
  textSecond:  "#6B5744",
  textTertiary:"#A89080",
  green:       "#2D7A3A",   // good time markers
  caution:     "#C0600A",   // rahu kalam, caution windows
  alert:       "#B91C3C",   // chandrashtama, hard-avoid
  skyBlue:     "#1A5EA8",   // planet chips
  divider:     "#E8DDD0",
  // dark mode
  darkBg:      "#0F1520",
  darkSurface: "#1E2A3A",
} as const;
```

Typography: `NotoSansTamil_400Regular`, `NotoSansTamil_700Bold` + `Inter_400Regular`, `Inter_600SemiBold`, `Inter_700Bold`, `Inter_800ExtraBold`. All bundled in `assets/fonts/`.

Spacing: 4px base. Common: 8, 12, 16, 20, 24, 32.
Corner radius: cards 16px, buttons 12px, chips 20px (pill), bottom sheet top corners 20px.

---

## 7. React Query Cache Policy

| Domain | staleTime | persist offline |
|---|---|---|
| Daily guidance | 1 h | yes (last day) |
| Panchangam | 12 h | yes |
| Rasi palan | 12 h | yes |
| Profile / settings | 24 h | yes |
| Notifications inbox | 1 min | no |
| Porutham / tool results | session only | no |

Persistence: `@tanstack/react-query-persist-client` + `AsyncStorage`.
**Do NOT port `web/hooks/usePersonalData.ts`** — use one `useQuery` per domain instead.

---

## 8. Session Bootstrap (root `_layout.tsx`)

Hold Expo splash until complete:
1. Load fonts (`expo-font`).
2. Read `access_token` + `refresh_token` from `expo-secure-store`.
3. If none → guest session (`tier: "guest"`).
4. If present → `GET /auth/me` with Bearer. On 401 → try `POST /auth/mobile/refresh` → on failure → guest. On success → `tier: "registered"` (or `"premium"` per subscription).
5. Release splash. Navigate to `(tabs)/today`.

Guest local state (AsyncStorage): selected rasi, selected language, city, anonymous device ID.

---

## 9. Screen Inventory & Data Sources

### Phase A — Guest (build first)

| # | Screen | Route | FastAPI endpoint(s) |
|---|---|---|---|
| 01 | Splash + App Icon | root `_layout` | — |
| 02 | Location Permission | `(onboarding)/location` | — (local only) |
| 03 | Rasi Picker | `(onboarding)/rasi-picker` | — (local store) |
| 04 | Today Tab — Guest | `(tabs)/today` | `GET /panchangam/today`, rasi-palan content |
| 05 | Panchangam Day View | `(tabs)/panchangam/` | `GET /panchangam/{date}` |
| 06 | Panchangam Month Calendar | `(tabs)/panchangam/calendar` | `GET /panchangam/month/{year}/{month}` |
| 07 | Tools Tab | `(tabs)/tools/` | — |
| 08 | Porutham Input | `(tabs)/tools/porutham` | — |
| 09 | Porutham Result | `(tabs)/tools/porutham` | `POST /public-tools/porutham` |
| 10 | Muhurta Input | `(tabs)/tools/muhurta` | — |
| 11 | Muhurta Result | `(tabs)/tools/muhurta` | `GET /muhurta` |
| 12 | Me Tab — Guest | `(tabs)/me` | — (local prefs) |
| 13 | Jadhagam Signup Gate | bottom sheet from tools | — (triggers onboarding) |
| 14 | WhatsApp Share Card | component (ViewShot) | uses local panchangam cache |
| 15 | Home Screen Widget | native extension | reads AsyncStorage cache |
| 16 | Push Notification Visual | `expo-notifications` | `POST /devices/push-token` (anonymous) |

### Phase B — Registered (build second)

| # | Screen | Route | FastAPI endpoint(s) |
|---|---|---|---|
| 17 | Signup Step 1 — Auth Method | `(onboarding)/birth-details` step 1 | `POST /auth/mobile/register` |
| 18 | Signup Step 2 — Name + DOB | step 2 | — (form state) |
| 19 | Signup Step 3 — Birth Time + Place | step 3 | `POST /birth-profiles` |
| 20 | Signup Step 4 — Jadhagam Reveal | `(onboarding)/jadhagam-reveal` | `GET /charts/...` (summary) |
| 21 | Today Tab — Registered | `(tabs)/today` | `GET /daily-guidance`, `/panchangam/today`, `/charts/summary` |
| 22 | Daily Score Detail | push from today card | `GET /daily-guidance` (full) |
| 23 | Chandrashtama Alert | `chandrashtama` | `GET /predictions` or alert model |
| 24 | Jadhagam 1-Page Result | `jadhagam/[id]` | `GET /charts/{id}` |
| 25 | Daily Limit Reached | bottom sheet | server counter (`ask_vinaadi_usage` pattern) |
| 26 | Jadhagam Upsell + IAP | `jadhagam/upsell` | RevenueCat purchase → `POST /webhooks/revenuecat` |
| 27 | Me Tab — Registered | `(tabs)/me` | `GET /auth/me`, `/settings/notifications` |
| 28 | Notification Inbox | `notifications/inbox` | `GET /notifications` |
| 29 | Notification Settings | `notifications/settings` | `GET/PATCH /settings/notifications` |

### Phase C — Premium

| # | Screen | Route | FastAPI endpoint(s) |
|---|---|---|---|
| 30 | Premium Upgrade | `premium` | RevenueCat subscription purchase |
| 31 | Family Vault | `family-vault` | `GET /family-vaults`, `/family-vaults/{id}/daily-score` |
| 32 | Ask Vinaadi Chat | `ask-vinaadi` | `POST /ask-vinaadi` |

---

## 10. Guest Mode Architecture

Guests have NO account. Their data lives only on-device.

```typescript
// mobile/src/features/guest/guestStore.ts
interface GuestPrefs {
  rasi: string | null;          // e.g. "mesham"
  nakshatra: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  lang: "ta" | "en";
  anonymousId: string;          // expo-device UUID, stable per install
  pushOptedIn: boolean;
  pushTime: string;             // "06:30"
}
// stored in AsyncStorage under key "vinaadi_guest_prefs"
```

Anonymous push: `POST /devices/push-token` with `{ anonymousId, fcmToken, platform }` (no `userId`).

Conversion triggers (soft prompts, never a wall):
- Viewed rasi palan ≥ 3 days
- Tapped Porutham result (upsell to detailed report)
- Tapped "Generate Jadhagam" (Signup Gate bottom sheet, Screen 13)
- 7-day streak on Today tab

---

## 11. Monetization

### Ads — Phase A (AdMob)

| Slot | Placement | Format | Rule |
|---|---|---|---|
| Today tab | Below rasi palan card | Native in-feed | Guest only; labelled "விளம்பரம்" / "Sponsored" |
| Tool results | Below content, above nav | Adaptive banner | Guest only; tool result screens only |
| Porutham result | Natural break after result | Interstitial | Max 1/session; never on app open |
| Detailed report | Rewarded opt-in | Rewarded video | Always alongside paid alternative |

**Never** show ads: on panchangam hero above fold, during onboarding, on auth screens, for registered/premium users (beyond optional native unit).
ATT prompt: iOS only, on 2nd app open. UMP consent for EU. Non-personalized ads if ATT declined.

### IAP — Phase B (RevenueCat)

```
ai.vinaadi.jadhagam.1page.extra  ← ₹49 consumable (4th+ chart after daily limit)
ai.vinaadi.jadhagam.5page        ← ₹99 consumable
ai.vinaadi.jadhagam.10page       ← ₹249 consumable
ai.vinaadi.porutham.detailed     ← ₹99 consumable
ai.vinaadi.yearahead             ← ₹199 consumable
ai.vinaadi.premium.monthly       ← ₹149/month auto-renewable (Phase C)
ai.vinaadi.premium.annual        ← ₹999/year (Phase C)
```

Always validate server-side via RevenueCat webhook. Never trust client-side purchase state alone.

Daily jadhagam limit: 3 free/day (registered), reset midnight IST. Pattern mirrors `ask_vinaadi_usage` table — implement as `jadhagam_usage` table with same structure.

---

## 12. Widgets

Widgets are separate processes — no React Native. Architecture:

- **iOS WidgetKit (Swift):** reads shared `UserDefaults` from App Group `group.ai.vinaadi`. Expo app writes panchangam cache + active language to App Group via `expo-shared-preferences` / `react-native-mmkv-storage`.
- **Android AppWidget (Kotlin):** reads from `SharedPreferences` (same package). `AlarmManager` triggers refresh at 5:00 AM IST + end of Nalla Neram window.

Widget content: Nalla Neram time, Rahu Kalam time, today's rasi palan first line, date in Tamil calendar format — **rendered in the active language** (Tamil or English) read from shared prefs.

Sizes to implement: Small (2×2), Medium (4×2).

---

## 13. Home Screen Widget Push Notification

```
Daily push content (in active language):
  title: { ta: "இன்றைய நல்ல நேரம் 🌅", en: "Today's Nalla Neram 🌅" }
  body:  { ta: "06:00 – 07:30 | ராகு காலம்: 09:00 | மேஷம்: உற்சாகமான நாள்",
           en: "06:00 – 07:30 | Rahu Kalam: 09:00 | Mesham: An energetic day" }
  tap:  → opens (tabs)/today for current date
```

User selects push time in Settings. Language follows user's app language setting.

---

## 14. EAS Build Config

```json
// mobile/eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "API_BASE_URL": "http://YOUR_LOCAL_IP:8000" }
    },
    "staging": {
      "distribution": "internal",
      "env": { "API_BASE_URL": "https://staging.vinaadi.app" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "API_BASE_URL": "https://api.vinaadi.app" }
    }
  }
}
```

Bundle IDs: `ai.vinaadi.app` (prod), `ai.vinaadi.app.staging`, `ai.vinaadi.app.dev`.

---

## 15. CI (GitHub Actions)

```yaml
# .github/workflows/mobile.yml
on:
  push:
    paths: ["mobile/**", "packages/shared/**"]
jobs:
  check:
    steps:
      - run: pnpm install
      - run: pnpm -F @vinaadi/shared tsc --noEmit   # no DOM lib — validates purity
      - run: pnpm -F mobile tsc --noEmit
      - run: pnpm -F mobile eslint src/
  build:
    if: github.ref == 'refs/heads/main'
    steps:
      - run: eas build --profile production --platform all --auto-submit --non-interactive
```

---

## 16. Tamil Rendering Validation (Week 1, mandatory)

Before any screen work, validate on **real Android** (API 29 + 31 + 33 minimum):

Test clusters: `ைி` `ோ` `ஸ்ரீ` `க்ஷ` `ஞ்` `ண்` at font scale 1.0, 1.5, 2.0.
Expected: correct ligature shaping, no glyph overlap, correct line height.
If system font is used, it will fail on Android <12. Noto Sans Tamil bundled = fix.

Typography tokens for Tamil (set explicit `lineHeight` to avoid Android clipping):
```typescript
export const TamilType = {
  display: { fontFamily: "NotoSansTamil_700Bold",    fontSize: 24, lineHeight: 36 },
  body:    { fontFamily: "NotoSansTamil_400Regular",  fontSize: 15, lineHeight: 24 },
  caption: { fontFamily: "NotoSansTamil_400Regular",  fontSize: 12, lineHeight: 18 },
} as const;
```

Set `android:supportsRtl="false"` in `AndroidManifest.xml` (Tamil is not RTL but some shaping pipelines differ).

---

## 17. Key Design Rules (from MOBILE_DESIGN_BRIEF.md)

- Background is always Parchment `#FAF7F2` — never pure white `#FFFFFF` (cards only).
- Tamil text ≥ English text size on same screen; Tamil is visually prominent.
- Soft signup prompts must always have a visible dismiss option (no dark patterns).
- Never gate daily panchangam behind login or paywall.
- Never use fear language: "ஆபத்து" / "danger" / "bad day". Use "கவனம்" / "caution".
- Error states use amber border, not red background.
- "Thirukanitham" gold badge on all computed content (jadhagam, daily score, report covers).
- No Western zodiac imagery. No dark purple/neon. No generic horoscope aesthetics.
- App opens to Today tab in <1 second (offline cache renders immediately, refreshes in background).

---

## 18. Build Order

1. **Backend P0 fixes** (§3) — unblock everything else
2. **Monorepo + `packages/shared`** — web imports must keep working
3. **Tamil render spike on Android** — Week 1, mandatory before screens
4. **API client + session bootstrap** — the foundation all screens depend on
5. **Phase A screens** (01–16) → TestFlight + Play internal → first ad revenue
6. **Phase B backend** (refresh tokens, device tokens) → Phase B screens (17–29)
7. **Phase C** (premium, family vault, ask vinaadi)

---

## 19. Out of Scope (web-only forever)

`learn/*`, `dosham/*`, `yogam/*`, `temples/*`, `pariharam/*`, `features/*`, `trust/*`, nakshatra article pages, admin panel, QA dashboard. These are SEO pages. Do not rebuild them in the app. Link to web from Settings (open in browser).

---

## 20. Key Cross-References

| What | Where |
|---|---|
| 32-screen visual specs (hex, Tamil strings, ad slots, px) | `MOBILE_DESIGN_BRIEF.md` |
| Final locked decisions (monetization, tiers, sequencing) | `MOBILE_DECISIONS.md` |
| Backend endpoint contract + migration detail | `MOBILE_APP_PLAN.md §3–6` |
| UX strategy + tier model + conversion funnel | `MOBILE_UX_STRATEGY.md` |
| DB safety rules (never touch vinaadi_dev, test DB rules) | `CLAUDE.md` |
| Backend models + routers | `app/models/*.py`, `app/api/*.py` |
