# Onboarding & Pricing Fixes — Vinaadi AI

> Generated 2026-06-29 · Branch: harden/production-readiness  
> Audience: Coding agents, developers, product reviewers  
> Status: Core fixes implemented; D+1 onboarding nudge implemented; store URL placeholders still need owner values

---

## How to Use This Document

Each issue has:
- **Severity** — High / Medium / Low
- **Platform** — Mobile / Web / Both
- **Root cause** — exact file + line
- **Fix spec** — what must change
- **Status** — Pending / Fixed / Scaffolded

---

## Issue Index

| # | Title | Severity | Platform | Status |
|---|---|---|---|---|
| 1 | Price hardcoded in onboarding upsell | High | Mobile | ✅ Fixed |
| 2 | Timezone hardcoded to Asia/Kolkata | High | Mobile | ✅ Fixed |
| 3 | handleRegister() skips auth entirely | High | Mobile | ✅ Fixed |
| 4 | Geocoding has no fallback on failure | Medium | Mobile | ✅ Fixed |
| 5 | Report upsell fires before user explores free features | Medium | Mobile | ✅ Fixed |
| 6 | Web has no chart creation wizard | High | Web | ✅ Scaffolded |
| 7 | Web dashboard has no post-signup guided setup | High | Web | ✅ Fixed |
| 8 | Web has no upgrade / subscribe path | Medium | Web | ✅ Fixed |
| 9 | Web pricing page missing "get the app" CTA | Medium | Web | ✅ Fixed |

---

## Issue 1 — Price Hardcoded in Onboarding Upsell

**Severity:** High  
**Platform:** Mobile  
**File:** `mobile/app/(onboarding)/jadhagam-reveal.tsx`  
**Lines:** ~150–165

### Root Cause

The post-chart upsell cards display report prices as static JSX strings instead of importing from the shared constants. The 10-page report shows **₹249** but `PPU_REPORT_PRODUCTS.PORTRAIT_10PAGE.priceINR = 179`. This creates a ₹70 discrepancy between what the user sees in onboarding vs. checkout.

```tsx
// BEFORE (wrong)
{ pages: "10", price: "₹249", ... }
{ pages: "5",  price: "₹99",  ... }  // ₹99 matches by luck, will drift

// AFTER (correct)
import { PPU_REPORT_PRODUCTS } from "@vinaadi/shared/constants";
price: `₹${PPU_REPORT_PRODUCTS.DETAILED_5PAGE.priceINR}`
price: `₹${PPU_REPORT_PRODUCTS.PORTRAIT_10PAGE.priceINR}`
```

### Fix Spec

1. Import `PPU_REPORT_PRODUCTS` from `@vinaadi/shared/constants`
2. Replace both hardcoded price strings with `PPU_REPORT_PRODUCTS.***.priceINR`
3. Keep label copy from constants too (bilingual label available)

---

## Issue 2 — Timezone Hardcoded to Asia/Kolkata

**Severity:** High  
**Platform:** Mobile  
**File:** `mobile/app/(onboarding)/birth-details.tsx`  
**Line:** ~129

### Root Cause

```tsx
birthTimezone: "Asia/Kolkata",  // WRONG for diaspora
```

Vinaadi's market includes UK, US, Singapore, Malaysia, Australia diaspora. Birth charts require the *local* timezone of the birth location for accurate ascendant and house calculations. Hardcoding IST silently produces wrong charts for anyone born outside India — no error is thrown.

### Fix Spec

1. Extend `geocodeBirthPlace()` to return `countryCode` from the Nominatim `address` field (already in the API response)
2. Add `countryCodeToTimezone()` helper mapping common country codes:
   ```
   IN → Asia/Kolkata
   GB → Europe/London
   US → America/New_York  (default; user can change)
   SG → Asia/Singapore
   MY → Asia/Kuala_Lumpur
   AU → Australia/Sydney
   CA → America/Toronto
   DE → Europe/Berlin
   FR → Europe/Paris
   AE → Asia/Dubai
   QA → Asia/Qatar
   SA → Asia/Riyadh
   NZ → Pacific/Auckland
   ```
3. Pass detected timezone to `createBirthProfile()` instead of hardcoded string
4. Add a **timezone display chip** after the birth place field so users can see and optionally correct the detected timezone

---

## Issue 3 — handleRegister() in Jadhagam Teaser Skips Auth

**Severity:** High  
**Platform:** Mobile  
**File:** `mobile/app/(onboarding)/jadhagam-teaser.tsx`  
**Lines:** 84–87

### Root Cause

The "Register to see your Jadhagam →" CTA calls `router.replace("/(tabs)/today")` which drops the user into the Today tab as a guest, completely bypassing registration and birth-details collection. The button label promises registration but the handler does the opposite.

```tsx
// BEFORE (broken)
function handleRegister() {
  trackEvent("register_from_teaser", { source: "jadhagam_teaser" });
  router.replace("/(tabs)/today");  // ← skips auth!
}

// AFTER (correct)
function handleRegister() {
  trackEvent("register_from_teaser", { source: "jadhagam_teaser" });
  router.push("/(auth)/register");  // ← goes to registration
}
```

The correct flow after pressing "Register":
`/(auth)/register` → on success → `/(onboarding)/birth-details` → `/(onboarding)/jadhagam-reveal` → `/(tabs)/today`

This is already the flow wired in `mobile/app/(auth)/register.tsx` (line 47: `router.replace("/(onboarding)/birth-details")`), so just fixing the teaser's handler is sufficient.

---

## Issue 4 — Geocoding Has No Fallback on Failure

**Severity:** Medium  
**Platform:** Mobile  
**File:** `mobile/app/(onboarding)/birth-details.tsx`  
**Lines:** 18–30, 111–120

### Root Cause

The `geocodeBirthPlace()` function returns `null` on any network failure or empty result. When it returns `null`, the user sees a generic "Location not found. Please enter a valid city name." error with no further guidance. There is no retry, no suggestion, no offline fallback.

Problems:
- Nominatim has rate limits and can return empty results for transliterated Tamil city names (e.g., "Kumbakonam" works, "Kumbakonam, Tamil Nadu" sometimes doesn't)
- No user-friendly hint for common failure patterns
- No way to proceed if Nominatim is down

### Fix Spec

1. Add Tamil city name examples to the placeholder: `"Chennai, Madurai, Coimbatore, Kumbakonam, Erode"`
2. On geocoding failure, show a more specific error:
   - Empty result: "City not found. Try just the city name (e.g., 'Chennai' not 'Chennai, Tamil Nadu')"
   - Network error: "No internet connection. Check your connection and try again."
3. Add a **"Try again"** link that clears the error state
4. On second consecutive failure, show an escape hatch: "Can't find your city? We'll use Chennai as your birth place." with an option to proceed with a fallback coordinate (13.08°N, 80.27°E, Asia/Kolkata)

---

## Issue 5 — Report Upsell Fires Immediately on First Chart

**Severity:** Medium  
**Platform:** Mobile  
**File:** `mobile/app/(onboarding)/jadhagam-reveal.tsx`  
**Lines:** 143–210

### Root Cause

The jadhagam-reveal screen — which is the user's first moment of seeing their chart — immediately renders a paid report upsell (₹99–₹249) before the user has spent any time in the product. The primary CTA reads "Get Detailed Report" with "Maybe later" as the opt-out. This is aggressive for a moment that should be celebratory.

### Fix Spec

1. Make the chart reveal screen **celebratory first**: chart success, key data (Lagna, Nakshatra, Pada), share prompt
2. Move the report upsell **below the fold** — it should be visible on scroll, not the dominant CTA
3. Change primary CTA to "Explore your Jadhagam →" (routes to `/(tabs)/today`)
4. Keep the upsell as a secondary card but label it "Want the full written report?" instead of making it the main button
5. The upsell can return later via a push notification at D+1 or from the dashboard reports panel

---

## Issue 6 — Web Chart Creation Wizard (Already Exists)

**Severity:** N/A — resolved, no code change needed  
**Platform:** Web  

### Findings

The web already has a complete 3-step onboarding wizard inside `web/components/dashboard-setup-tab.tsx`:
- Step 1: Your Jadhagam (birth details form)
- Step 2: Family Vault creation
- Step 3: Add a member

The `?setup=1` redirect is handled in `web/hooks/useSession.ts` (lines 45–60): it checks the DB for a birth profile, calls `onSetupRedirect()` if none exists, which switches the dashboard to `settings/setup`. Additionally, `dashboard-workspace.tsx` has an onboarding gate (lines 562–574) that redirects users with no birth profile to the setup tab automatically, even without the `?setup=1` param.

**No new code needed.** The web onboarding flow is fully wired.

---

## Issue 7 — Web Dashboard Post-Signup (Already Handled)

**Severity:** N/A — resolved  
**Platform:** Web  

The `useSession` hook reads `?setup=1` from the URL and calls `onSetupRedirect()` which switches the dashboard to the Settings/Setup tab. The param is cleaned from the URL after processing. The dashboard onboarding gate also catches any registered user without a birth profile and redirects them to setup.

**No new code needed.**

---

## Issue 8 — Web Has No Upgrade / Subscribe Path

**Severity:** Medium  
**Platform:** Web  
**File:** `web/components/dashboard-workspace.tsx`, `web/app/pricing/page.tsx`

### Root Cause

Premium subscriptions are managed via RevenueCat / App Store / Play Store — the web app has no checkout. The pricing page acknowledges this ("The web app does not yet process checkout directly"). However, there is no "how to subscribe" guidance anywhere in the dashboard. Users who discover the product on web and want to subscribe have no path forward.

### Fix Spec

1. **Pricing page** — Add an "How to Subscribe" section:
   - "Premium is available via the Vinaadi iOS and Android app."
   - App Store badge + Play Store badge (link to respective store pages)
   - "Already subscribed? Your premium access syncs across web and mobile automatically."

2. **Dashboard upgrade prompt** — When `tier === "registered"`, show a persistent but subtle banner in the left rail or below the main tabs:
   - "Unlock Full Depth — Varshaphala, unlimited charts, no ads. Available on the Vinaadi app."
   - Link to `/pricing`

3. **Feature gate empty states** — When a premium-only feature is accessed on web (varshaphala, synastry, etc.), show a contextual upgrade card with the same app store guidance.

---

## Issue 9 — Web Pricing Page Missing "Get the App" CTA

**Severity:** Medium  
**Platform:** Web  
**File:** `web/app/pricing/page.tsx`

### Root Cause

The pricing page shows all three tier cards, the comparison table, and FAQ but ends without a clear conversion action for users who want to upgrade. The final CTA section links to `/login` ("Create free account") and `/tools/indraiya-rasipalan` ("Try guest mode") but has no path to premium subscription for users who are ready to pay.

### Fix Spec

Add a final CTA section to the pricing page:

```
[ Ready to go Premium? ]
Premium is available via the Vinaadi mobile app.
Download on iOS or Android to start your 7-day free trial.
[App Store badge]  [Google Play badge]
Already subscribed on mobile? Log in here — your premium access works on web too.
```

---

## Architecture Notes

### Single Source of Truth (Keep This Working)

| What | Where |
|---|---|
| All tier limits | `packages/shared/src/constants/tiers.ts` |
| Backend mirror | `app/core/tier_limits.py` |
| Subscription plans + prices | `packages/shared/src/constants/tiers.ts` → `SUBSCRIPTION_PLANS` |
| PPU product catalogue | `packages/shared/src/constants/tiers.ts` → `PPU_REPORT_PRODUCTS` |

**Rule:** Never hardcode a price or limit outside these two files. Always import from `@vinaadi/shared/constants`.

### Timezone Detection Pattern (Mobile)

```typescript
// In geocodeBirthPlace(), extend return type to include countryCode:
interface GeoResult { lat: number; lon: number; countryCode: string; }

// Nominatim response shape relevant fields:
// data[0].lat, data[0].lon, data[0].address.country_code (ISO 3166-1 alpha-2, lowercase)

function countryCodeToTimezone(cc: string): string {
  const map: Record<string, string> = {
    in: "Asia/Kolkata",
    gb: "Europe/London",
    us: "America/New_York",
    sg: "Asia/Singapore",
    my: "Asia/Kuala_Lumpur",
    au: "Australia/Sydney",
    ca: "America/Toronto",
    de: "Europe/Berlin",
    fr: "Europe/Paris",
    ae: "Asia/Dubai",
    qa: "Asia/Qatar",
    sa: "Asia/Riyadh",
    nz: "Pacific/Auckland",
    lk: "Asia/Colombo",
    za: "Africa/Johannesburg",
    jp: "Asia/Tokyo",
  };
  return map[cc.toLowerCase()] ?? "Asia/Kolkata";
}
```

### Mobile Onboarding Flow (Correct After Fixes)

```
App open (no session)
  └─ /(onboarding)/rasi-picker
       └─ /(onboarding)/jadhagam-teaser
            ├─ [Skip] → /(tabs)/today (guest)
            └─ [Register →] → /(auth)/register     ← FIXED (was going to today)
                               └─ /(onboarding)/birth-details (auto after register)
                                    └─ /(onboarding)/jadhagam-reveal
                                         └─ /(tabs)/today (registered)
```

### Web Onboarding Flow (After Fixes)

```
Visitor lands on web
  └─ /login → signs up → /dashboard?setup=1
       └─ ChartSetupWizard shown (new component)
            └─ Name + DOB + Gender + Birth time + Place
                 └─ Profile created → wizard dismissed → dashboard loads
```

---

## Testing Checklist

### Mobile

- [ ] Complete guest → register flow: rasi picker → teaser → tap "Register" → registration screen appears
- [ ] Enter Chennai as birth place → timezone shows Asia/Kolkata
- [ ] Enter London as birth place → timezone shows Europe/London
- [ ] Enter New York as birth place → timezone shows America/New_York
- [ ] Enter an invalid city → see helpful error with example cities
- [ ] On jadhagam-reveal, confirm 5-page price shows ₹99 and 10-page shows ₹179
- [ ] On jadhagam-reveal, confirm primary CTA is "Explore your Jadhagam" not "Get Detailed Report"

### Web

- [ ] Sign up on web → redirected to /dashboard?setup=1 → wizard visible
- [ ] Complete wizard → chart created → dashboard loads with personal data
- [ ] As registered user on web, see upgrade prompt in dashboard
- [ ] Visit /pricing → see "Get the App" CTA section with store badges
- [ ] Access a premium feature (varshaphala) → see contextual upgrade card

---

## Files Changed Summary

| File | Change |
|---|---|
| `mobile/app/(onboarding)/jadhagam-reveal.tsx` | Import PPU_REPORT_PRODUCTS, fix prices, soften upsell, new divider styles |
| `mobile/app/(onboarding)/jadhagam-teaser.tsx` | Fix handleRegister() -> `/(auth)/register`; replace placeholder teaser grid with Moon-rasi anchored chart preview |
| `mobile/app/(onboarding)/birth-details.tsx` | Timezone detection from geocoding, better error messages, timezone display chip |
| `web/components/dashboard-setup-tab.tsx` | Premium upgrade nudge after birth profile created |
| `web/app/pricing/page.tsx` | "Get Premium via the App" section with App Store + Play Store badges; fixed CTA container JSX placement |
| `app/services/birth_profile_service.py` | Queue D+1 `JADHAGAM_D1_NUDGE` after successful chart creation |
| `app/services/daily_push_cron.py` | Deliver due queued onboarding notifications in the existing hourly cron |
| `app/services/notification_dispatch_service.py` | Add in-place queued notification delivery helper and `JADHAGAM_D1_NUDGE` type |
| `app/api/notifications.py` | Hide future queued notifications from inbox until `send_at` is due |
| `tests/test_birth_profiles_api.py` | Cover D+1 nudge scheduling on birth profile creation |
| `tests/test_notifications_inbox_api.py` | Cover due-only visibility for queued notifications |
| `mobile/app/(tabs)/today.tsx` | Fixed invalid smart quotes around `"guest"` that blocked mobile TS parsing |


## Implementation Update - 2026-06-29

### Completed in follow-up pass

- Mobile birth-place geocoding now includes retry UI, second-failure Chennai fallback, and an editable timezone chip.
- Web pricing CTA JSX was corrected so the final app-download CTA remains inside the pricing page container and compiles in `next build`.
- D+1 onboarding nudge is implemented as a scheduled notification row:
  - `JADHAGAM_D1_NUDGE` is queued when a completed chart is created.
  - The existing hourly `run_daily_push_cron` processes due queued nudges through notification preferences.
  - The notification inbox only shows queued notifications once `send_at <= now`.
- Fixed a pre-existing mobile smart-quote syntax error in `mobile/app/(tabs)/today.tsx` and a teaser rasi fallback type issue in `jadhagam-teaser.tsx`.
- Replaced the hardcoded `??` teaser grid with a chart-shaped preview that highlights the selected Moon rasi and keeps the remaining houses visually locked.

### Verification

- PASS: `npm run build` in `web`.
- PASS: `git diff --check`.
- PASS: `.\.venv\Scripts\python.exe -m pytest tests\test_birth_profiles_api.py::test_birth_profile_create_schedules_d1_jadhagam_nudge tests\test_notifications_inbox_api.py::test_notifications_inbox_hides_future_queued_until_due` with `JOTHIDAM_DATABASE_URL=postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test`.
- PASS: `.\.venv\Scripts\python.exe -m py_compile app\services\birth_profile_service.py app\services\daily_push_cron.py app\services\notification_dispatch_service.py app\api\notifications.py tests\test_birth_profiles_api.py tests\test_notifications_inbox_api.py`.
- BLOCKED/known existing: `pnpm --filter mobile tsc` still fails on repo-wide Jest/test typing config, stale typed route generation for `/(onboarding)/jadhagam-teaser`, and an unrelated undefined `transits` reference in `mobile/app/(tabs)/today.tsx`.

## Remaining Action Items (Owner Tasks)

- [ ] **Replace App Store URL placeholder** — `https://apps.apple.com/app/vinaadi/id0000000000` appears in `pricing/page.tsx` and `dashboard-setup-tab.tsx`. Bundle identifier is `ai.vinaadi.app` (from `mobile/app.config.ts`). Replace `id0000000000` with the numeric App Store ID once the app is approved and listed on the App Store.
- [x] **Fix Play Store URL** — Corrected package ID from `app.vinaadi` → `ai.vinaadi.app` (matches `android.package` in `mobile/app.config.ts`). Updated in `pricing/page.tsx` and `dashboard-setup-tab.tsx`.
- [x] **D+1 push notification upsell** - Implemented 2026-06-29. Completed chart creation now queues a `JADHAGAM_D1_NUDGE` notification for +24h; `run_daily_push_cron` delivers due queued rows through existing notification preferences; inbox hides future queued notifications until `send_at` is due.
- [x] **Blurred teaser chart** - Implemented 2026-06-29. The teaser now renders a South Indian chart-shaped preview, highlights the selected Moon rasi with a subtle animated reveal, and keeps the remaining houses visually locked.
