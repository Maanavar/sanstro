# Vinaadi AI — Audit Pending Items

> Generated: 28 June 2026  
> Source: Multi-role production audit (CEO / CMO / CPO / Architect / UX / UI / Full-Stack / Test)  
> Scope: 10 partially-done or not-done items that remain open after the first implementation pass.

---

## How to Read This Document

Each item is structured as:

- **What is the problem** — the exact bug, gap, or inconsistency found in the code  
- **Why it matters** — impact on users, correctness, or the business  
- **What to do** — concrete steps to fix it  
- **How to enhance** — the next level improvement beyond the bare fix

---

## Part A — Partially Done (3 items)

---

### A1. Score Thresholds — Shared Package Exists but `today.tsx` Bypasses It

**Status:** Partial — `packages/shared/src/utils/score.ts` was created and is imported by `web/lib/format.ts` and `mobile/src/lib/score.ts`, but `mobile/app/(tabs)/today.tsx` still has raw magic numbers instead of using the shared constant.

#### What is the problem

`packages/shared/src/utils/score.ts` defines the canonical thresholds:

```ts
export const SCORE_THRESHOLDS = { HIGH: 65, MID: 45 } as const;
```

Both `web/lib/format.ts` (line 8) and `mobile/src/lib/score.ts` (line 1) correctly import from it.

However, `mobile/app/(tabs)/today.tsx` bypasses the shared constant entirely and uses raw literals in four places:

| Line | Code | Issue |
|------|------|-------|
| 305 | `g.score >= 55` | Should be `SCORE_THRESHOLDS.MID` — but 55 ≠ 45, so this is also the wrong threshold |
| 461 | `g.score >= 65 ? "Good window" : g.score >= 45 ? ...` | Correct thresholds but not using constants |
| 493 | `area.score >= 55 ? "good" : "caution"` | Wrong threshold value (55 instead of 45) |
| 878 | `area.score >= 65 ? C.green : area.score >= 45 ? C.gold : C.caution` | Correct values but not using constants |

Line 305 and 493 use `55` as the mid threshold, which is between the old mobile value (55) and the new unified value (45). This means the shared package fix is incomplete — the screen the user actually sees most (Today) is still running the wrong numbers.

#### Why it matters

A user with a score of 50 will see "Travel: not recommended" (because 50 < 55) but the score engine has already classified it as "mid" (because 50 ≥ 45). The Today screen contradicts itself within a single view.

#### What to do

In `mobile/app/(tabs)/today.tsx`:

1. Add the import:
   ```ts
   import { SCORE_THRESHOLDS } from "@vinaadi/shared/utils/score";
   ```

2. Replace all four literals:
   ```ts
   // Line 305
   ok: g.score >= SCORE_THRESHOLDS.MID

   // Line 461
   g.score >= SCORE_THRESHOLDS.HIGH ? "Good window"
     : g.score >= SCORE_THRESHOLDS.MID ? "Move steadily"
     : "Go gently"

   // Line 493
   tone: area.score >= SCORE_THRESHOLDS.MID ? "good" : "caution"

   // Line 878
   const tone = area.score >= SCORE_THRESHOLDS.HIGH
     ? C.green
     : area.score >= SCORE_THRESHOLDS.MID
     ? C.gold
     : C.caution;
   ```

#### How to enhance

Add a `scoreTone()` utility call everywhere a tone label or color is derived from a score. Today.tsx should never inspect a raw score number directly — it should call `scoreTone(score)` and switch on the result. This means any future threshold change is a single-file edit in the shared package with zero ripple across screens.

---

### A2. Chennai Hardcoded Fallback — Web Panchangam Page Not Fixed

**Status:** Partial — Mobile `today.tsx` was fixed (now uses `prefs?.lat`), but `web/app/panchangam/[date]/page.tsx` still silently falls back to Chennai coordinates.

#### What is the problem

`web/app/panchangam/[date]/page.tsx` lines 14–17:

```ts
const DEFAULT_LAT = "13.0827";
const DEFAULT_LNG  = "80.2707";
const DEFAULT_CITY = "Chennai";
```

A user in Singapore, London, or Toronto who opens the panchangam page and has not set a city will receive panchangam calculated for Chennai with no indication that the data is wrong for their location. The page renders successfully, so they have no reason to suspect the data is off.

This is not a crash bug — it is a silent data correctness bug. The Thirukanitham engine is location-sensitive (sunrise, sunset, planetary positions all shift with latitude). A wrong city means wrong panchangam.

#### Why it matters

The Tamil diaspora is the primary audience. Most users are outside Tamil Nadu. Silently showing Chennai data to a user in Malaysia breaks the core promise of the product.

#### What to do

1. Read the user's preferred city from their profile (if logged in) or from `localStorage`/a cookie (if guest).
2. If no location is available, show an inline city-picker prompt above the panchangam card instead of rendering Chennai data.
3. The city-picker already exists on mobile (onboarding and profile screens) — extract or replicate it as a web component.

Quick interim fix — surface the location assumption visibly:

```tsx
{city === DEFAULT_CITY && (
  <Banner>
    Showing panchangam for Chennai. 
    <Link href="/settings/location">Set your city</Link> for accurate results.
  </Banner>
)}
```

#### How to enhance

- Detect location via the browser Geolocation API on first visit and offer "Use my current location" as a one-tap action.
- Persist the chosen city in `localStorage` for guests, and to the user profile for registered users.
- Add a floating city chip in the panchangam page header so users can always see and change the active city.

---

### A3. ThirukanithamBadge — Not Placed Above the Fold

**Status:** Partial — The badge renders inside the guest hero card section of Today, but it appears after significant scroll content rather than being immediately visible on open.

#### What is the problem

The ThirukanithamBadge is the primary trust signal that separates Vinaadi AI from generic astrology apps. It communicates that the calculations use the precise astronomical Thirukanitham method, not approximated Western or Lahiri methods. Currently it is positioned deep in the Today tab scroll, visible only after the user has already scrolled past the score hero, life area pulse, and cosmic alert sections.

A new user who opens the app for the first time will judge the product within the first 3 seconds and the first visible scroll area. The badge being below the fold means most first-time users will never see it.

#### Why it matters

Without the badge visible immediately, Vinaadi looks identical to every other Tamil astrology app from a first impression standpoint. The ThirukanithamBadge is the CMO's primary above-the-fold differentiator.

#### What to do

Move the ThirukanithamBadge to one of these positions (in priority order):

1. **Inside the score hero card** — place it as a small pill or label directly below the score ring (e.g., "Thirukanitham-precise"). This is always visible on first open.
2. **In the app header / top bar** — as a small trust badge next to the date or Vinaadi logo. Always visible, not tied to scroll position.
3. **As the first item below the header** — before the score hero, as a single-line context strip ("Your insights are calculated using Thirukanitham precision").

#### How to enhance

On web, add the ThirukanithamBadge (or equivalent) to:
- The landing page hero section above the fold
- The dashboard header alongside the date

Make the badge tappable/clickable — link it to `/learn/what-is-thirukanitham` which already exists. This turns the trust signal into an educational entry point.

---

## Part B — Not Done (7 items)

---

### B1. Web Guest Mode (Biggest Gap)

**Status:** Not implemented. Web forces login immediately.

#### What is the problem

A user who hears about Vinaadi AI, searches "rasi palan today", or clicks a shared link lands on the web homepage and is immediately presented with a login or registration wall. There is zero product visible before authentication.

Mobile handles this correctly — a guest can see the rasi picker, today's score, and daily guidance without creating an account. Web has no equivalent.

#### Why it matters

This is the single largest acquisition gap in the product. Every marketing spend, every social share, every SEO ranking that brings a new user to the web domain results in a login wall bounce. The Tamil diaspora user in London who searches "rasi palan today" has no reason to create an account before seeing any value.

Mobile guest acquisition works because the user sees value first. Web does not.

#### What to do

1. **Create a guest rasi picker on the web homepage** — reuse the same localStorage-based rasi persistence that already exists on mobile guest mode. User picks their rasi, the page shows today's rasi palan without any login.

2. **Show today's panchangam publicly** — the `/panchangam/[date]` page should be fully public with only location selection required (not authentication).

3. **Gate premium features with an inline upgrade prompt** — when a guest tries to view Dasha, Jadhagam, or Ask Vinaadi, show a "Create a free account to unlock" prompt instead of a full login wall.

4. **Add a soft CTA after showing value** — "You're seeing Mesha rasi palan. Sign up to get personalised insights based on your exact birth details."

#### How to enhance

- Implement the same tiered guest → registered → premium flow that mobile has.
- Track guest rasi selection in analytics to understand conversion intent.
- A/B test the CTA copy — Tamil-native copy ("உங்கள் விரிவான ஜாதகம் பெற இப்போது பதிவு செய்யுங்கள்") vs English.
- Surface Annual Wrapped teasers to guests during the Margazhi/Panguni season as a seasonal acquisition hook.

---

### B2. Pricing Page

**Status:** Not implemented. No `/pricing` route exists anywhere on web.

#### What is the problem

The tier model (guest / registered / premium) is implemented in code and referenced in multiple components, but there is no page on the website that explains what each tier includes or what premium costs. Users who want to upgrade have no way to understand the value proposition before committing.

The premium upgrade strip exists in `Me.tsx` on mobile, but there is no web equivalent, and neither surface explains what premium actually unlocks with specificity.

#### Why it matters

Without a pricing page:
- Registered users who would upgrade don't know what they'd get.
- New users cannot evaluate the product before signing up.
- SEO cannot capture "vinaadi ai pricing" or "Tamil astrology app cost" searches.
- The business cannot communicate monetisation intent clearly to investors or press.

#### What to do

Create `web/app/pricing/page.tsx` with:

1. **Three-column tier comparison** — Guest, Registered (Free), Premium.
2. **Feature matrix** — explicit list of what each tier unlocks. Examples:
   - Guest: Today's rasi palan, panchangam (city required), ThirukanithamBadge explanation
   - Registered: Full jadhagam, dasha timeline, 1 family member, journal, goals
   - Premium: Unlimited family vault, AI Ask Vinaadi queries, annual wrapped, muhurta planner, all tools
3. **Price and billing** — monthly / annual with discount, currency options (INR / USD / SGD / MYR / GBP for diaspora).
4. **FAQ section** — "What is Thirukanitham?", "Is this the same as Western astrology?", "Can I cancel?"

#### How to enhance

- Add the pricing page link to the main nav and to the homepage hero CTA.
- On mobile, link the upgrade strip in `Me.tsx` to open a web pricing page or a native upgrade sheet.
- Consider a "Pay-per-report" option for users who do not want a subscription — e.g., ₹49 for a single Annual Wrapped PDF, ₹99 for a Muhurta report. This is in the tier plan memory.

---

### B3. Web Today Tab — Consolidated View

**Status:** Not implemented. Web dashboard has 10+ tabs; there is no unified "Today" landing state.

#### What is the problem

Mobile's Today tab is the product at its best: score ring, life area pulse, cosmic alert, best time window, activity chips, journal quick-log, and rasi palan — all in one continuous scroll that tells the user everything they need to know to navigate their day.

On web, this same information is fragmented across at minimum 4 separate dashboard tabs (personal, calendar, life areas, journal). A user who opens web on a Saturday morning must navigate across tabs to get the same picture that mobile delivers in one scroll.

This is not a feature gap — all the data exists on web. It is a UX layout gap.

#### Why it matters

The Today tab is what drives daily active use. If web users do not have a single "start here" view, the web dashboard will always feel like a research tool rather than a daily companion. Daily retention on web will lag mobile.

#### What to do

1. Create a `DashboardTodayTab` component (or repurpose `dashboard-personal-tab`) as a consolidated today view.
2. Make it the default landing tab when a user opens the dashboard.
3. Components to include in order:
   - Score hero (ring + tone label + Thirukanitham badge)
   - Life area pulse (horizontal chips)
   - Cosmic alert (Chandrashtama / Rahu kalam / Gulika kalam)
   - Best time window for today
   - Quick-log journal entry (bottom sheet or inline input)
   - Rasi palan for today
   - Upcoming events / muhurta countdown

#### How to enhance

- After 3 visits, show a "Customise your Today view" link that lets users pin or hide sections.
- Add a "Share today" button that generates a share card image of the day's score + rasi palan — using the share card infrastructure already built.
- On mobile browser, ensure the web Today view matches the native Today tab layout (responsive design).

---

### B4. Web Notification Inbox

**Status:** Not implemented. `web/app/notifications/` does not exist. Mobile has a full `/notifications/inbox` screen with FCM/APNs integration.

#### What is the problem

Notifications are a primary re-engagement channel. Mobile users receive push notifications about Chandrashtama alerts, auspicious windows, and journal reminders. Web users receive nothing.

Additionally, there is no notification inbox on web — if a user reads something on mobile and later opens web, they cannot see their notification history.

#### Why it matters

Users who primarily use the web (desktop workers, laptop users) are completely excluded from the re-engagement loop. Time-sensitive Thirukanitham alerts (Rahu kalam, Chandrashtama warning, auspicious muhurta today) lose their value if the user only finds out about them next time they open the app.

#### What to do

**Phase 1 — Notification inbox (no push required):**
1. Create `web/app/notifications/page.tsx` — a simple inbox that fetches the user's notification history from the existing backend notification service.
2. Add a notification bell icon to the web dashboard header with an unread count badge.
3. Render the same notification types that mobile shows (Chandrashtama alert, daily score, muhurta window).

**Phase 2 — Browser push notifications:**
1. Implement Web Push (PWA service worker + VAPID keys).
2. Ask permission on the dashboard after the user has had 3 sessions (not on first load).
3. Send the same alerts that mobile already generates from the backend.

#### How to enhance

- Allow notification preferences per channel (web push / email / mobile push) from a single settings page.
- Add "Today's panchangam summary" as a daily email digest option for web users who prefer email over push.
- Surface the notification bell in the web page `<title>` count — "Vinaadi AI (3)" — for users with the tab open in the background.

---

### B5. Mobile Nakshatra Detail Pages (27-page depth)

**Status:** Not implemented on mobile. Web has 27 fully-fleshed nakshatra pages. Mobile has `/tools/natchathiram` (list view only) and 5 generic learn articles.

#### What is the problem

Web has a full content library: 27 nakshatra pages, each with mythology, personality traits, compatible nakshatras, career guidance, health notes, and deity/visual pages. This is a significant educational resource that mobile users cannot access within the app — they would need to switch to a browser.

Mobile's learn section has 5 generic articles. The 27 nakshatra articles are not accessible at all on mobile.

#### Why it matters

Nakshatra lookup is a common casual-use entry point ("What nakshatra is Rohini? What does it mean?"). If mobile users cannot access this from the app, they will Google it and land on a competitor's page. This is a retention and engagement gap.

#### What to do

**Option A — Deep link to web pages from mobile:**
In mobile `/tools/natchathiram`, make each nakshatra list item link out to the corresponding web page (`/natchathiram/rohini`). This is fast to ship but breaks the native experience.

**Option B — Native detail screens (recommended):**
1. Create `mobile/app/tools/natchathiram/[slug].tsx` — a detail screen.
2. Fetch the nakshatra data from the backend (the same data that powers the web pages — ensure the API endpoint exposes it).
3. Render: nakshatra name (Tamil + English), deity, ruling planet, key traits, compatible nakshatras, today's guidance if the user's nakshatra matches.

#### How to enhance

- Add a "My Nakshatra" pin — if the user's birth nakshatra matches the one they are reading, show a personalised callout ("This is your nakshatra — here's what it means for you today").
- Add the nakshatra visual (the geometric/artistic symbol images that web already has) as a full-bleed header image on the mobile detail screen.
- Surface "Related nakshatras" and "Compatible nakshatras" as tappable chips that navigate to those detail screens.

---

### B6. Frontend Test Coverage

**Status:** Not implemented. Mobile has zero test files. Web has 2 test files only (`mode-badge.test.tsx`, `collapsible-section.test.tsx`).

#### What is the problem

The backend has pytest infrastructure with test DB isolation, which is correct. The frontend has almost no automated tests. This means:

- The score threshold bug (55 vs 45 vs 65) could have been caught by a single unit test.
- The LifeAreaPulse color bug (`backgroundColor: tone`) would have been caught by a render test.
- The Me tab navigation to a non-existent register route would have been caught by a navigation test.
- Every future change to `today.tsx` (the most complex screen) is a manual regression risk.

#### Why it matters

`mobile/app/(tabs)/today.tsx` is the highest-traffic, highest-complexity screen in the entire product. It has 13+ sections, multiple API dependencies, guest/authenticated states, language switching, and animation logic. Without tests, every deployment to this screen is a leap of faith.

#### What to do

**Mobile — Jest + React Native Testing Library:**

Priority test targets in order:

1. `packages/shared/src/utils/score.ts` — unit tests for `scoreTone()` and `scoreTonePct()`. These are pure functions with no dependencies and are fast to write.

   ```ts
   test("score 65 is high", () => expect(scoreTone(65)).toBe("high"));
   test("score 64 is mid", () => expect(scoreTone(64)).toBe("mid"));
   test("score 45 is mid", () => expect(scoreTone(45)).toBe("mid"));
   test("score 44 is low", () => expect(scoreTone(44)).toBe("low"));
   ```

2. Navigation smoke test — assert that every route in `mobile/app/(auth)/` and `mobile/app/(tabs)/` is reachable without throwing.

3. `today.tsx` render test — shallow render with mock API responses and assert the score hero, life area pulse, and rasi palan sections render without crashing.

**Web — Playwright E2E:**

1. Guest landing → rasi palan visible (once guest mode is built — B1 above).
2. Login → dashboard renders all tab sections.
3. All tool pages (`/tools/*`) load without a 500 error.
4. All 27 nakshatra pages return HTTP 200 and have an `<h1>` tag.

#### How to enhance

- Add a CI step that runs the score unit tests on every PR. A PR that changes any threshold value will fail CI if the test is not updated — this prevents future threshold drift.
- Add visual regression snapshots (Playwright / Storybook) for the Today tab score hero and the Me tab menu — the two screens most likely to break on UI changes.
- Set a minimum coverage threshold of 60% for `packages/shared/src/utils/` — shared utilities must be tested because they affect both platforms simultaneously.

---

### B7. Tamil Font Abstraction — Inline Ternaries Scattered Across Screens

**Status:** Not implemented. `mobile/app/(tabs)/today.tsx` and `mobile/app/(tabs)/me.tsx` contain dozens of inline font-family ternaries instead of using the `TamilType` / `EnType` abstractions from `@/theme/typography`.

#### What is the problem

The correct pattern is:

```ts
import { TamilType, EnType } from "@/theme/typography";
// Usage:
fontFamily: isTamil ? TamilType.Bold : EnType.Bold
```

The current pattern scattered across both files:

```ts
fontFamily: isTamil ? "NotoSansTamil_700Bold" : "Inter_700Bold"
fontFamily: isTamil ? "NotoSansTamil_400Regular" : "Inter_400Regular"
fontFamily: isTamil ? "NotoSansTamil_600SemiBold" : "Inter_600SemiBold"
```

The literal font family strings appear dozens of times. If the Tamil font is changed (e.g., from NotoSansTamil to a custom Vinaadi Tamil typeface), every one of these strings must be hunted down and updated manually.

In `today.tsx`, the motion animation also uses inline `FadeInDown.delay(80).springify()` instead of the motion constants from `@/theme/motion`.

#### Why it matters

Tamil font rendering is central to the Thirukanitham brand promise. If a font is misconfigured or changed, the inconsistency will show up as mixed font weights mid-sentence — a visible quality regression. The inline pattern makes this refactor error-prone.

#### What to do

1. In `mobile/theme/typography.ts`, ensure `TamilType` and `EnType` export named keys for every weight used:

   ```ts
   export const TamilType = {
     Regular: "NotoSansTamil_400Regular",
     SemiBold: "NotoSansTamil_600SemiBold",
     Bold: "NotoSansTamil_700Bold",
   } as const;

   export const EnType = {
     Regular: "Inter_400Regular",
     SemiBold: "Inter_600SemiBold",
     Bold: "Inter_700Bold",
   } as const;
   ```

2. In `today.tsx` and `me.tsx`, replace every inline font string with the typed constant.

3. In `today.tsx`, replace `FadeInDown.delay(80).springify()` with the equivalent motion constant from `@/theme/motion`.

#### How to enhance

- Write a helper `fontFamily(weight, isTamil)` that returns the correct font string — callers pass only the weight key and the language flag, never a raw string.
- Enforce this with an ESLint rule that flags any string literal matching `"NotoSansTamil_"` or `"Inter_"` outside of `theme/typography.ts`. This turns a future violation into a CI failure.
- Long term: if Vinaadi commissions a custom Tamil typeface (as Tamil brands like Vikatan and Dinamalar have done), the typography file is the single place to update — every screen picks it up automatically.

---

## Priority Order for Implementation

| Priority | Item | Estimated Effort | Impact |
|----------|------|-----------------|--------|
| P0 | B1 — Web Guest Mode | Large (1–2 weeks) | Acquisition — every web visitor currently bounces |
| P0 | A1 — Score Thresholds in today.tsx | Small (1–2 hours) | Correctness — Today screen contradicts score engine |
| P1 | B2 — Pricing Page | Medium (2–3 days) | Revenue — upgrade path is invisible |
| P1 | A2 — Chennai Fallback on Web | Small (half day) | Data correctness for diaspora users |
| P1 | A3 — ThirukanithamBadge placement | Small (1 hour) | Brand trust above the fold |
| P2 | B3 — Web Today Consolidated View | Large (1 week) | Daily retention on web |
| P2 | B6 — Frontend Tests | Medium (1 week setup + ongoing) | Regression safety |
| P3 | B4 — Web Notification Inbox | Medium (3–4 days) | Re-engagement for web users |
| P3 | B5 — Mobile Nakshatra Detail Pages | Medium (3–4 days) | Content depth parity |
| P4 | B7 — Tamil Font Abstraction | Small (half day) | Maintainability |

---

## Thirukanitham Compliance Checklist

The audit also evaluated whether all features respect the Thirukanitham calculation standard. Items to verify before each release:

- [ ] All dasha calculations use Thirukanitham ayanamsa (not Lahiri)
- [ ] Panchangam sunrise/sunset computed for user's actual location, not Chennai default (A2 above)
- [ ] Score thresholds are unified at HIGH=65 / MID=45 across web, mobile, and backend (A1 above)
- [ ] ThirukanithamBadge is visible without scrolling on mobile Today and web dashboard (A3 above)
- [ ] Muhurta calculations reference Thirukanitham planetary positions
- [ ] `/learn/what-is-thirukanitham` is linked from the ThirukanithamBadge on both platforms
- [ ] All nakshatra descriptions note they follow the Thirukanitham sidereal zodiac system

---

*This document tracks the open items from the 27 June 2026 multi-role audit. Mark each item complete when the fix is merged and verified on both web and mobile.*
