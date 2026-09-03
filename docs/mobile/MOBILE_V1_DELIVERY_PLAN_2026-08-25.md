# Vinaadi AI Mobile — v1 Delivery Plan & Time Estimate

**Date:** 2026-08-25
**Question answered:** how long to ship a hybrid app on Android + iOS at a world-class bar,
broken into a 0–100 task list with **separate durations for marketing and dashboard**.
**Authority:** this doc is authoritative for **estimates, sequencing and the task list only**.
`MOBILE_DECISIONS.md` remains authoritative for scope, tiers, pricing and GTM;
`11-gap-closure-ux-architecture.md` remains authoritative for feature placement.
**Team assumed:** solo — owner + Claude Code.
**Launch bar assumed:** world-class v1, both stores, not a fast MVP (an MVP cut is priced below).

---

## 1. Where we actually stand today

The estimate is not greenfield, because the app is not greenfield. Verified against the repo
on 2026-08-25:

| Evidence | Value |
|---|---|
| `mobile/` stack | Expo SDK 54, RN 0.81.5, React 19, Expo Router 6, New Architecture on |
| Mobile code | ~24,900 lines TS/TSX, ~70 route files, 30 shared components |
| Shell | 5 tabs (Today, Panchangam, Insights, Tools, Me) + ~20 stack routes |
| Auth | `app/api/mobile_auth.py` — bearer login / register / **refresh** / logout; `expo-secure-store` |
| Data layer | React Query v5 + encrypted async-storage persister, `useOfflineStatus` |
| API surface | 29 typed wrapper modules in `mobile/src/api/` |
| Monetization | RevenueCat (`react-native-purchases`) + AdMob (`react-native-google-mobile-ads`) wired |
| Telemetry | Sentry RN + PostHog RN |
| Build | `eas.json` with development / staging / production profiles + channels |
| Native extras | iOS WidgetKit + Android AppWidget via `plugins/withWidgets`, `react-native-view-shot` share |
| Design tokens | `packages/design-tokens` with a `dist/mobile/tokens.ts` build |
| QA today | 6 Maestro flows, 7 jest tests incl. 1 screen test, touch-target audit script |
| Spec already written | `docs/mobile/` — 12 numbered docs + BUILD_SPEC (495 ln), DECISIONS (207 ln), DESIGN_BRIEF (763 ln) |
| Web, for scale comparison | ~109,700 lines TSX/TS, 121 marketing pages, 10 dashboard tabs |

**Consequence:** the app is *broad but thin*, and unshipped. Most remaining work is depth,
mobile-native rethinking, and the un-compressible launch phase — not scaffolding.

Two numbers follow: **greenfield (G)** for budgeting a fresh team, and **delta from today (Δ)**
for what you would actually execute.

### 1.1 Stack verdict on "hybrid"

Expo / React Native — already chosen here — is the correct hybrid stack for this bar.

- The other "hybrid" reading (Capacitor / WebView wrapping the Next.js dashboard) reaches a
  store build in ~3 weeks and then fails the world-class bar on cold start, gesture fidelity,
  widgets, offline behaviour and Tamil typography control. Not recommended.
- A Flutter rewrite would discard 25k lines, `packages/shared`, and 29 typed API wrappers, for
  no capability this product needs. Not recommended.

**Do not change stacks. The stack is not the problem; depth and launch are.**

---

## 2. Estimating basis

Read this before quoting any number from section 3.

- **Unit = 1 focused dev-day** ≈ 6 productive hours of driving Claude Code plus review.
- **Team = solo (owner + Claude Code).** AI compresses UI implementation roughly 2–3× versus a
  human solo dev. It compresses real-device QA, store review, beta cycles and Tamil-typography
  judgement by approximately **zero**. That asymmetry is why Phase 5 barely differs between the
  G and Δ columns.
- **Backend is out of scope.** FastAPI already serves every domain the app needs, plus
  `mobile_auth`, `DELETE /auth/me`, notification preferences and device tokens. The few backend
  deltas that remain are folded into the task rows that need them.
- **"Marketing" = in-app guest + acquisition + growth + store presence.** The 121 `web/(marketing)`
  SEO pages stay on web; they are not becoming 121 screens.
- **"Dashboard" = the signed-in product** — onboarding, chart, insights, tools depth, family,
  reports, settings.
- **Shared platform work** (foundations, design system, app shell, QA/launch) is listed as its
  own phases **and** allocated pro-rata into the two tracks, so the marketing and dashboard
  figures are real fully-loaded costs rather than flattering fragments.

---

## 3. The numbers

### 3.1 Effort by phase (dev-days)

| Phase | Greenfield | Δ from today |
|---|---:|---:|
| 0 — Foundations & decisions *(shared)* | 10.5 | 4.5 |
| 1 — Mobile design system *(shared)* | 15.5 | 8.5 |
| 2 — App shell & platform *(shared)* | 20 | 10.5 |
| **3 — MARKETING (guest + growth + store)** | **46.5** | **26** |
| **4 — DASHBOARD (signed-in depth)** | **62** | **34** |
| 5 — Quality, beta & launch *(shared)* | 33.5 | 33 |
| **TOTAL** | **188** | **116.5** |

### 3.2 The two headline figures — fully loaded

Shared phases allocated 43 / 57 between the tracks, in proportion to their raw size.

| Track | Greenfield | Δ from today |
|---|---:|---:|
| **MARKETING** — guest surfaces, widgets, push habit loop, paywall, ads, ASO, store assets | **81 dev-days ≈ 16 weeks** | **50 dev-days ≈ 10 weeks** |
| **DASHBOARD** — onboarding, chart, insights, tools, family, reports, settings | **107 dev-days ≈ 21 weeks** | **66 dev-days ≈ 13 weeks** |
| **Both** | **188 dev-days** | **116.5 dev-days** |

### 3.3 Calendar

| Pace | Greenfield | Δ from today |
|---|---|---|
| 5 focused days / week | ~38 weeks → **8.5–9.5 months** | ~23 weeks → **5.5–6 months** |
| 3 focused days / week (part-time) | ~63 weeks → **~14.5 months** | ~39 weeks → **~9 months** |

Add **2–3 calendar weeks of external waiting** that effort cannot compress: Apple review rounds
(1–10 days each — budget two), Play closed-testing requirements, App Store Connect + RevenueCat
IAP propagation, and a genuine 2–3 week Tamil-user beta.

**Confidence band: ±25%.** The Δ path realistically lands **87–146 dev-days**.

### 3.4 The faster alternative, priced honestly

A deliberate **fast-MVP cut to both stores** — guest habit loop, panchangam, three tools, push,
one widget, paywall, and the *full* launch QA phase — is **45–55 dev-days ≈ 10–12 weeks**. The
remaining ~65 dev-days then become v1.1 / v1.2 waves.

This is a scope decision, not a discount. The world-class bar is precisely what the extra
~65 dev-days buys, and Phase 5 is not cuttable in either version.

---

## 4. The mobile-native contract (why this is not a desktop port)

1. **One job per surface.** Today = what matters now. Panchangam = time. Insights = personal
   depth. Tools = calculators. Me = identity and data. This is already the rule in
   `11-gap-closure-ux-architecture.md`; hold it under pressure.
2. **Thumb-first, not pointer-first.** Primary actions live in the bottom third. Bottom sheets
   replace modals. Swipe and long-press are real navigation, not decoration.
3. **Time-to-value under one second, and no login wall** — a LOCKED decision in
   `MOBILE_DECISIONS.md`. A guest sees real panchangam before typing anything.
4. **Port the job, never the page.** The 10 web dashboard tabs — `dashboard-calendar-tab-nova.tsx`
   alone is 1,602 lines — do not become 10 mobile screens. Each decomposes into one hero card on
   Today plus a focused detail screen reached by tap.
5. **The 121 marketing pages become one Learn reader plus deep links.** SEO stays on web; the app
   links out only where a native screen would genuinely be worse.
6. **Offline is a feature, not an error state.** Today, panchangam and the user's own chart must
   render from cache with no signal.
7. **Tamil is the design constraint, not a translation step.** Noto Sans Tamil carries different
   vertical metrics and materially longer strings than Latin. Every component is designed at the
   Tamil string length first and English second.
8. **No emoji as icons. No accent left-border stripes on cards.** (Recorded owner rulings.)
9. **Motion is orientation, not ornament** — and it honours reduce-motion.
10. **Every screen designs all five states:** loading, empty, error, offline, content.

---

## 5. The 0–100 task list

Tag: **[S]** shared platform · **[M]** marketing / growth · **[D]** dashboard.
**G** = greenfield dev-days · **Δ** = delta-from-today dev-days.

### Phase 0 — Foundations & decisions *(10.5 G / 4.5 Δ)*

| # | Task | Tag | G | Δ |
|---|---|---|---:|---:|
| 0 | Lock the v1 scope contract: what ships, what defers to v1.1 | S | 1 | 0.5 |
| 1 | Re-derive mobile IA from jobs-to-be-done, not from the web tabs | S | 2 | 1 |
| 2 | Device matrix + OS floor (iOS 16+, Android 9+), low-end Android target | S | 0.5 | 0.25 |
| 3 | Monorepo hygiene + a mobile CI job (tsc, lint, jest, touch-target audit) | S | 1.5 | 0.5 |
| 4 | Expo SDK / New Architecture upgrade policy + verification | S | 1 | 0.25 |
| 5 | Env + secrets matrix across the dev / staging / prod EAS profiles | S | 1 | 0.25 |
| 6 | Typed API contract sync guard: `packages/shared` ↔ FastAPI routes | S | 1.5 | 0.5 |
| 7 | Analytics event taxonomy for mobile (PostHog) + funnel definitions | S | 1 | 0.5 |
| 8 | Crash / error taxonomy + Sentry release-health wiring | S | 0.5 | 0.25 |
| 9 | Definition of Done — the gate list every screen must pass | S | 0.5 | 0.5 |

### Phase 1 — Mobile design system *(15.5 G / 8.5 Δ)*

| # | Task | Tag | G | Δ |
|---|---|---|---:|---:|
| 10 | Token pipeline: `packages/design-tokens` → RN build as the single source | S | 1 | 0.5 |
| 11 | Colour system including **true dark mode** + on-device contrast audit | S | 2 | 1.5 |
| 12 | Type scale: Noto Sans Tamil + Latin dual-metric tuning, dynamic type | S | 2 | 1.5 |
| 13 | Spacing, radius, elevation, safe areas, notch + gesture-bar rules | S | 1 | 0.5 |
| 14 | Motion system: Reanimated presets + reduce-motion honouring | S | 1.5 | 1 |
| 15 | Core primitives: Button, Card, Sheet, List, Field, Chip, Badge, Tabs | S | 3 | 1 |
| 16 | Feedback primitives: skeleton, empty, error, toast, offline banner | S | 1.5 | 0.5 |
| 17 | Icon set — line, consistent weight, no emoji as icons | S | 1 | 0.5 |
| 18 | Haptics language: what vibrates, when, and never more than that | S | 0.5 | 0.5 |
| 19 | Component gallery screen + visual snapshot harness | S | 2 | 1 |

### Phase 2 — App shell & platform *(20 G / 10.5 Δ)*

| # | Task | Tag | G | Δ |
|---|---|---|---:|---:|
| 20 | Navigation architecture: tabs, stacks, modals, typed routes, back rules | S | 2 | 0.5 |
| 21 | Universal Links / App Links + association files served from web | S | 1 | 1 |
| 22 | Auth: bearer + refresh rotation, secure store, optional biometric unlock | S | 2 | 0.5 |
| 23 | Guest identity + lossless migration into a real account | S | 1.5 | 1 |
| 24 | Data layer: React Query defaults, encrypted cache persistence, TTLs | S | 1.5 | 0.5 |
| 25 | Offline-first contract: what is cached, staleness UI, retry semantics | S | 2 | 1.5 |
| 26 | Background refresh + foreground prefetch (morning data ready on open) | S | 1 | 0.5 |
| 27 | Push: permission timing, token registration, categories, deep-link routing | S | 2 | 1 |
| 28 | Notification inbox + preference centre | S | 1.5 | 0.5 |
| 29 | Localization runtime (ta/en), locale-aware dates, numerals, plurals | S | 1.5 | 0.5 |
| 30 | Accessibility platform pass: labels, roles, focus order, dynamic type | S | 2 | 1.5 |
| 31 | Performance budgets: cold start, JS bundle, list virtualization, Hermes | S | 2 | 1.5 |

### Phase 3 — MARKETING: guest, growth & store *(46.5 G / 26 Δ)*

| # | Task | Tag | G | Δ |
|---|---|---|---:|---:|
| 32 | First-run: real content on screen in under 1s, zero required input | M | 2 | 1 |
| 33 | Location + rasi capture, gracefully skippable | M | 1.5 | 0.5 |
| 34 | Guest Today: panchangam + rasi palan as the morning habit | M | 2.5 | 1 |
| 35 | Guest Panchangam day view: timings, nalla neram, rahu kalam | M | 2 | 1 |
| 36 | Month calendar + festivals (Hindu / Christian / Muslim / Government) | M | 2.5 | 1.5 |
| 37 | Tools hub as a native browse surface, not a link list | M | 1.5 | 0.5 |
| 38 | Porutham quick check, guest-accessible | M | 2 | 0.5 |
| 39 | Muhurta quick check, guest-accessible | M | 2 | 0.5 |
| 40 | Natchathiram: the 27 stars as a mobile poster / detail experience | M | 2 | 1 |
| 41 | Learn reader: evergreen content, offline-capable, deep-linkable | M | 2 | 1.5 |
| 42 | Share cards: capture, per-surface layouts, watermark, CTA | M | 2.5 | 1 |
| 43 | Referral / invite loop with attribution | M | 2 | 2 |
| 44 | iOS home-screen widget (WidgetKit): daily panchangam + rasi palan | M | 3 | 1.5 |
| 45 | Android AppWidget parity | M | 2.5 | 1.5 |
| 46 | iOS Live Activity / Dynamic Island for the active window *(optional)* | M | 2 | 1.5 |
| 47 | Daily push habit loop: morning briefing, quiet hours, per-user timing | M | 2 | 1 |
| 48 | Streaks / return hooks that are honest rather than dark patterns | M | 1.5 | 0.5 |
| 49 | Guest→account conversion prompts: contextual, earned, never modal spam | M | 1.5 | 0.5 |
| 50 | Paywall + upsell screens wired to RevenueCat offerings | M | 2 | 1 |
| 51 | AdMob placements + UMP consent + ATT prompt + frequency caps | M | 2 | 1 |
| 52 | ASO: name, subtitle, keywords, description — Tamil **and** English | M | 1.5 | 1.5 |
| 53 | Store screenshots + preview video, both stores, all required sizes | M | 2 | 2 |
| 54 | Apple privacy nutrition labels + Play Data Safety form + policy pages | M | 1 | 1 |
| 55 | Store-review readiness audit: rejection-risk pass + reviewer account | M | 1 | 1 |

### Phase 4 — DASHBOARD: the signed-in product *(62 G / 34 Δ)*

| # | Task | Tag | G | Δ |
|---|---|---|---:|---:|
| 56 | Auth flows + **Sign in with Apple decision** — mandatory on iOS if Google login ships | D | 2 | 1.5 |
| 57 | Birth-details onboarding built for mobile: time picker, unknown-time path | D | 3 | 1.5 |
| 58 | On-device bundled birthplace search *(largely done — B-006)* | D | 2 | 0.5 |
| 59 | Chart reveal moment — the emotional payoff, not a data dump | D | 2 | 1 |
| 60 | Today (signed-in): score, decision window, dasha, live alerts | D | 3 | 1.5 |
| 61 | Daily score detail + why-this-result explanation | D | 1.5 | 0.5 |
| 62 | Insights hub IA — the personal-astrologer surface | D | 1.5 | 1 |
| 63 | Jadhagam chart renderer: native, pan / zoom, house detail sheets | D | 4 | 2 |
| 64 | Vargas / divisional charts | D | 2 | 1.5 |
| 65 | Dasha timeline: interactive, multi-level drill | D | 3 | 1.5 |
| 66 | Transits / peyarchi | D | 2 | 1 |
| 67 | Chandrashtama | D | 1 | 0.5 |
| 68 | Varshaphala | D | 1.5 | 1 |
| 69 | Shadbala / strength | D | 1.5 | 1 |
| 70 | Yogam list + detail | D | 2 | 1 |
| 71 | Dosham detection + result depth | D | 2 | 1 |
| 72 | Pariharam detail + temple linkage | D | 2 | 1.5 |
| 73 | Life areas | D | 2 | 1.5 |
| 74 | Goals | D | 2 | 1 |
| 75 | Plan: personal muhurta calendar and decision planning | D | 3 | 2 |
| 76 | Journal + life-event log | D | 2.5 | 1 |
| 77 | Retrospective / annual wrapped | D | 2 | 1 |
| 78 | Family vault + fast multi-profile switching | D | 3 | 1.5 |
| 79 | Synastry / relationship compatibility | D | 2 | 1 |
| 80 | Ask Vinaadi: streaming answers, decision mode, safety copy | D | 3 | 1.5 |
| 81 | Reports: purchase, generate, PDF view + share | D | 3 | 2 |
| 82 | Me / Settings: profile, language, notifications, privacy, export | D | 2.5 | 1.5 |
| 83 | In-app account deletion + data export (`DELETE /auth/me` already exists) | D | 1 | 0.5 |

### Phase 5 — Quality, beta & launch *(33.5 G / 33 Δ)*

Note how little this phase compresses — neither AI nor an existing codebase moves it. This is
the phase that separates "it runs" from "world class", and the one most often cut and regretted.

| # | Task | Tag | G | Δ |
|---|---|---|---:|---:|
| 84 | Unit + component test suite for mobile | S | 2 | 2 |
| 85 | Screen-test expansion (the jest screens project already exists) | S | 2 | 2 |
| 86 | Maestro E2E across every critical journey — 6 flows today → ~20 | S | 2 | 2 |
| 87 | Real-device lab pass: iOS + Android matrix including a low-end Android | S | 3 | 3 |
| 88 | On-device a11y audit: VoiceOver + TalkBack, including Tamil screen reader | S | 2 | 2 |
| 89 | Performance profiling: cold start, jank hunt, memory, list scroll | S | 2 | 2 |
| 90 | Offline / airplane-mode / flaky-network QA | S | 1.5 | 1.5 |
| 91 | Localization QA: Tamil truncation, font fallback, plurals | S | 2 | 2 |
| 92 | Security review: token storage, pinning decision, PII, jailbreak posture | S | 1.5 | 1.5 |
| 93 | Crash-free-session target + release-health gates before promotion | S | 1 | 1 |
| 94 | EAS build / submit pipeline + OTA channels + rollback runbook | S | 2 | 1.5 |
| 95 | TestFlight + Play internal / closed testing set up | S | 1.5 | 1.5 |
| 96 | Beta with real Tamil users + feedback triage + fix wave | S | 3 | 3 |
| 97 | Store submission, both stores, + review response loop (budget 2 rounds) | S | 2 | 2 |
| 98 | Launch ops: monitoring dashboards, alerting, support inbox | S | 1.5 | 1.5 |
| 99 | Post-launch 30-day iteration wave: retention, ASO, crash burn-down | S | 4 | 4 |
| 100 | v1.1 gate: subscription, devotional commerce, consult path decisions | S | 0.5 | 0.5 |

---

## 6. Critical path & sequencing

Do **not** run marketing and dashboard as two independent 10- and 13-week blocks.

```
P0 ─▶ P1 ─▶ P2 ─┬─▶ P3 MARKETING (guest surfaces) ─┐
                └─▶ P4 DASHBOARD (signed-in depth) ─┴─▶ P5 QA ─▶ beta ─▶ store
```

Recommended solo order on the Δ path (~23 weeks):

1. **Weeks 1–4** — P0 + P1 + P2. Nothing user-visible ships; everything afterwards gets faster.
2. **Weeks 5–10** — P3 marketing / guest. Ship a TestFlight + Play internal build at week 8, and
   run store-listing work in parallel — tasks 52–55 have long lead times and no code dependencies.
3. **Weeks 11–17** — P4 dashboard depth, hardest screens first: 63 chart, 65 dasha, 81 reports.
4. **Weeks 18–21** — P5 QA, device lab, a11y, beta. Start the beta at week 18, not week 21.
5. **Weeks 22–23** — submission, review rounds, launch ops.

Three long-lead items to start on **day one**, independent of phase:

- Apple Developer + App Store Connect accounts, agreements, tax and banking.
- App Store / Play listing metadata (task 52) — it gates submission and nothing gates it.
- Recruiting ~15 real Tamil beta users.

---

## 7. Risks that move the number

| Risk | Impact | Mitigation |
|---|---|---|
| Tamil typography on low-end Android | +3–6 days | Bundled Noto Sans Tamil is already a locked decision; verify on a real budget device in week 2, not week 20 |
| Store rejection — astrology, IAP and ads categories all draw scrutiny | +1–3 weeks calendar | Task 55 audit; the warm, non-fear-mongering brand voice is already a ruling and materially helps here |
| Reanimated v4 / New Architecture instability in tests | +2–4 days | Known and documented: mock the specific RN component, never the library globally |
| Widget native code (Swift + Kotlin) — the one place AI helps least | +2–5 days | Keep widget scope to exactly one: daily panchangam |
| Scope creep from the 121 web marketing pages | unbounded | Contract item 5: one Learn reader, deep links, nothing more |
| IAP + RevenueCat sandbox edge cases | +2–4 days | Test restore, refund and cross-platform entitlement in week 10, not week 22 |
| Sign in with Apple discovered late | +2–3 days + a review round | Decide in task 56, before any social login ships on iOS |

---

## 8. How to read this document

- Quote **section 3.2** for the two headline figures.
- Quote **section 3.4** if the question is "what if we need something in the stores sooner".
- Treat **section 4** as binding design constraints, not aspiration — they are what makes the
  estimate a mobile plan rather than a porting plan.
- Re-verify **section 1** before trusting the Δ column after any significant mobile work lands.
