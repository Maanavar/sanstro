# Vinaadi AI — Product Understanding (Step 0)

**Author:** Senior Product Researcher (onboarding pass)
**Date:** 2026-07-07
**Purpose:** Deep understanding of the product before any UX research or review. No recommendations here — description only.
**Sources read:** `README.md`, `docs/INDEX.md`, `docs/HOW_TO_USE_CODEBASE.md`, `docs/AGENT_INSTRUCTIONS.md` (canonical), web route tree, mobile route tree, backend router list, dashboard component inventory, memory index.

---

## 1. Product Summary

**Vinaadi AI** (internal/legacy name "Jothidam AI") is a **Tamil-first, bilingual (Tamil + English) astrology daily companion**. A user enters their birth details once; the product computes their Vedic/Tamil natal chart and then acts as an ongoing personal astrologer — a **daily guidance score (0–100) with reasons**, dasha (planetary period) timeline, transit analysis, panchangam (almanac), remedies, timing/decision tools, and a family vault for tracking relatives' charts.

**Core positioning:** "Thirukanitham-precise Tamil astrology for daily guidance, timing, family planning, and clarity." The differentiator it claims is **calculation accuracy** (scientific ephemeris-based *Thirukanitham* tradition, not the older approximate *Vakiya* almanac) combined with a **calm, non-fatalistic, action-oriented tone** (never "bad times"/"danger" — always "caution period" paired with a remedy and a positive window).

**Tradition & method (strictly enforced in code):**
- Lahiri sidereal ayanamsa; Whole Sign houses; Mean-node Rahu/Ketu
- Vimshottari dasha (120-year system)
- Transit scoring primarily from **Janma Rasi (natal Moon)**
- South Indian **square** chart grid (Jathagam Kattam) — never North Indian diamond
- Swiss Ephemeris under the hood
- Honest caveat baked into the docs: the core framework is genuinely Thirukanitham, but the **daily-score numeric weights are the author's custom calibrated formula**, not from a classical text.

**Three surfaces, one monorepo (pnpm workspace):**
| Surface | Stack | Audience use |
|---|---|---|
| **Backend API** | FastAPI + PostgreSQL 16 + SQLAlchemy + Alembic; Swiss Ephemeris; Anthropic (Ask Vinaadi chat); ReportLab (PDF); APScheduler (cron) | Shared brain for all clients |
| **Web app** | Next.js 15 / React 19 / TanStack Query / Framer Motion | Public marketing/SEO site **+** logged-in dashboard |
| **Mobile app** | Expo / React Native; RevenueCat (subs), AdMob (ads), PostHog, Sentry, FCM push | App Store / Play Store product |

**Business model (from memory / TIER_PLAN):** freemium tiers — **Guest** (limited, no login), **Registered** (free account), **Premium** (subscription) — plus a **pay-per-use** catalogue for one-off reports. Mobile monetizes via RevenueCat subscriptions and AdMob ads.

---

## 2. Target Audience

- **Primary:** Tamil-speaking / Tamil-heritage individuals (Tamil Nadu + global diaspora) who consult traditional Jothidam (astrology) for **daily decisions, auspicious timing (muhurtham), and marriage matching (porutham)**.
- **Language posture:** Tamil-first but fully bilingual; every user-facing string is `{ta, en}`. English serves diaspora / younger / less-Tamil-literate users.
- **Astrological literacy spectrum:** ranges from believers who know the vocabulary (rasi, nakshatra, dasha, dosham) to curious novices — hence the large `/learn` and `/trust/methodology` explainer surface.
- **Life-stage sensitive:** the product deliberately calibrates content by age, marital status, and life stage (student / young adult / mid-life / senior) and **age-gates** sensitive content (no marriage content <16, no career windows <18, no relationship content <14). This implies a mixed-age audience including minors.
- **Family-oriented:** the "Family Vault" and family-aggregate features target a household decision-maker tracking multiple relatives (spouse, children, parents).

---

## 3. Feature Inventory

### 3.1 Onboarding & identity
- Birth-profile capture (date, time, place → lat/lng/timezone); "birth time unknown/approximate" handling with a Lagna-accuracy warning
- Auth: register / login / logout / me; mobile also has forgot/reset password
- Guest chart generation (try-before-signup)
- Multiple birth profiles per user; profile manager

### 3.2 Personal daily guidance (the core loop)
- **Daily score 0–100** with a 6-part breakdown (moon transit, dasha support, panchangam, gochar support, personal cautions, remedial-action support) and human-readable reasons
- **Best windows / caution windows** (time-of-day)
- Narrative text, remedy (parihara), action suggestion, caution suggestion — all bilingual
- **Emotional weather** (tone: heavy/expansive/restless/calm/scattered/confident + physical tendency + best use of day)
- **Nakshatra perspective** (birth-star framing lens)
- **Context insight** (fires when the user has a registered life event + a caution day)
- **Journal insight** (mood-pattern correlations, unlocks at 30+ journal entries)
- Tithi special-day cards (Amavasai / Pournami / Ekadasi / Pradosham)
- Chandrashtama caution (8th rasi from natal Moon)
- 3-day range preview & 7-day week-ahead digest

### 3.3 Charts & core astrology
- D1 (Rasi) + D9 (Navamsa) charts, planet table (rasi, nakshatra, pada, degree, house, retrograde, combust)
- Chart summary (lagna, moon sign, janma nakshatra, current dasha label)
- Vimshottari **dasha timeline** (maha / antar / pratyantar) + "dasha story" narrative from birth
- Advanced/experimental dashas: **Ashtottari, Yogini, Kalachakra** (shipped as experimental/display-only per memory)
- Advanced strength panels: **Shadbala, Vargas (divisional charts), Varshaphala (annual), Yoga/Dosham** panels
- Jadhagam report panel (full birth-chart report)

### 3.4 Transits (Gochar) & Peyarchi
- Current gochar snapshot with retrograde/combustion flags
- **Sani (Saturn) cycle** incl. Sade Sati / Ashtama Sani framing
- **Peyarchi** (Jupiter/Saturn sign-change) upcoming events + peyarchi outlook report + notifications
- Major transits view

### 3.5 Panchangam (almanac)
- Daily panchangam: tithi, nakshatra, yoga, karana, vara (weekday+lord), hora
- Kalam slots: **Rahu Kalam, Yamagandam, Kuligai** (sunrise-to-sunset ÷ 8), Abhijit muhurta
- Sunrise/sunset; monthly calendar; shareable panchangam card; panchangam widget
- Public dated panchangam pages (`/panchangam/[date]`, `/panchangam/today`)

### 3.6 Timing & decision tools ("Plan")
- **Muhurta calculator** + muhurta picker (auspicious time selection)
- **Muhurtham Naal** (auspicious-day finder, by year)
- **Activity timing** (top 5 dates for an activity type in a month)
- **Decision Support** (compare two options the user is weighing — A vs B) — explicitly *not* a fortune-teller
- **What-If Simulator** (timing analysis for one hypothetical action) — kept distinct from Decision Support
- **Life event log** (register real events across ~30 typed categories; feeds correlations)

### 3.7 Relationships & family
- **Porutham** (Tamil 10-porutham marriage compatibility; Rajju & Vedha are hard-fail gates) — distinct from synastry
- **Synastry** panel (chart-to-chart compatibility)
- **Family Vault**: add members with relationship + weight; family daily-aggregate score; family calendar
- Cultural guardrails: never compute marriage compatibility between disallowed family-member pairs; marital-status & age filtering

### 3.8 Journal & reflection
- AI-prompted journal entries with life-area picker
- **Shadow-work journal** (Jungian Rahu/Ketu axis, 8th/12th house, chart-specific)
- Context events registration; retrospective panel; journal export (CSV/JSON)

### 3.9 Doshams & Pariharam (afflictions & remedies)
- Dosham explainer + tools: Sevvai (Mars), Kala Sarpa, Naga Sarpa, Kalathra, Pithru dosham
- Pariharam (remedy) pages: chart-specific, dasha-lord-aware, Tamil temple tradition; per-slug remedy pages (ayul, kadan, naga, puthra, rahu-ketu, sevvai, thirumana-thadai)
- Remedies panel + prediction/prescription panels
- Temples content: Arupadai Veedu, Pancha Bhoota Sthalams, Thirunallar, Thirumananjeri

### 3.10 Public / SEO content surface (web)
- `/learn` explainers (how to read a jadhagam, what is chandrashtama/porutham/thirukanitham, why birth time matters)
- `/natchathiram/[27 stars]` each with a `/visual` variant
- `/tamil-calendar` (Hindu/Muslim/Christian festivals, TN govt holidays 2026, per-event pages)
- `/yogam/[slug]`, `/temples`, `/trust` (about, methodology), `/features/*`, `/pricing`, `/privacy`, `/terms`, `/beta`
- Free public tools under `/tools` (jadhagam generator, porutham calculator, muhurta, chandrashtama, friendship compatibility, indraiya rasipalan/daily rasi, birth-time rectification, daily-panchangam-planner)

### 3.11 AI & engagement
- **Ask Vinaadi** — Claude-powered astrology chat (floating button, always accessible)
- **Prasna** widget (horary/prashna question)
- **Annual Wrapped** (year-in-review / "Spotify-Wrapped"-style)
- Notifications: inbox + preferences (channel none/email/push/both, morning alert time, smart silence); FCM push + email
- Feedback modal; share cards; streaks; daily snapshot
- Rectification wizard (birth-time rectification)

### 3.12 Admin / QA / ops
- Admin panel (user lookup, stats, analytics)
- QA validation & regression-report endpoints; golden test cases
- Newsletter signup; geo lookup; RevenueCat webhooks

---

## 4. Navigation Map

### 4.1 Web — Public (logged-out, SEO) site
```
/                         Home (PublicNav + HomeContent + PublicFooter)
/features/*               chart-guidance · daily-guidance · family-planning · timing-and-decisions
/pricing                  Tiers / plans
/learn/*                  Explainer articles (thirukanitham, porutham, chandrashtama, birth time, jadhagam)
/trust/*                  about-vinaadi · methodology
/tools/*                  Free calculators (jadhagam, porutham, muhurta, chandrashtama, friendship,
                          indraiya-rasipalan, birth-time-rectification, daily-panchangam-planner)
/panchangam/today, /[date]   Public daily almanac
/tamil-calendar/*         Festivals & holidays 2026 (+ [event])
/natchathiram/[27]        Per-nakshatra pages (+ /visual each)
/dosham/*                 sevvai · kala-sarpa · naga-sarpa · kalathra · pithru (+ [slug])
/pariharam/*              remedy pages (+ [slug])
/yogam/[slug], /temples/*, /muhurtham-naal/[year]
/share/panchangam, /widget/panchangam
/privacy /terms /beta /notifications
/login                    Auth entry
```

### 4.2 Web — Dashboard (logged-in app)
Left rail (Nova redesign) collapses the app to **5 primary destinations**, with "Explore" acting as a hub to deeper tabs:
```
Left rail:
  ● Today (personal)   → score, dasha, transits, emotional weather, journal insight, goals, what-if, peyarchi
  ● Panchangam (calendar) → daily/weekly panchangam, 7-day week-ahead, monthly calendar
  ● Family             → vaults, member cards, family aggregate, synastry
  ● Tools              → porutham + timing/decision tools
  ● Explore (hub)      → depth tabs: Transits · Plan · Life Areas · Journal · Explore(learn/dosham/nakshatram/guide)

Dashboard sub-routes (deep links):
  /dashboard/chart-generate · /daily-score · /goals · /porutham · /reports · /wrapped

Modals/overlays: Ask Vinaadi (floating), Feedback, Edit member, Edit profile, Guest chart, Learn article
```
> Note: there are **two generations of components** in the tree — legacy (`dashboard-*-tab.tsx`) and the current **"Nova"** redesign (`dashboard-*-nova.tsx`), gated by a `useUiVariant` hook. The Today tab is aliased in code (`DashboardTodayTab as DashboardPersonalTab`). The active/shipped UI appears to be Nova.

### 4.3 Mobile (Expo Router)
```
(auth)/        login · register · forgot-password · reset-password
(onboarding)/  birth-details · location · rasi-picker · jadhagam-teaser · jadhagam-reveal
(tabs)/        today · panchangam(index/calendar) · tools(...) · insights · me
  tools/       jadhagam · porutham · muhurta · dosham · pariharam · natchathiram · yogam ·
               friendship · prashan · daily-panchangam
Stack routes:  dasha · transits · vargas · shadbala · varshaphala · synastry · retrospective ·
               journal · goals · life-event-log · rectification · muhurtham-naal · reports · wrapped ·
               jadhagam/[id] & upsell · learn/* · temples/* · notifications(inbox/settings) ·
               ask-vinaadi · daily-score · chandrashtama · family-vault · premium · profile-manager ·
               privacy · terms
```
Mobile tab bar = **5 tabs: Today · Panchangam · Tools · Insights · Me** — a similar 5-destination model to web.

### 4.4 Backend API domains (`/api/v1/*`, ~45 routers)
auth · mobile_auth · users · birth_profiles · charts · daily_guidance · daily_snapshot · panchangam · transits · dasha (in charts) · family_vaults · goals · alerts · content · context · retrospective · relationships · decisions · whatif · journal · life_areas · life_events · life_event_log · muhurta · predictions · remedies · rectification · prasna · ask_vinaadi · annual_wrapped · share_card · streak · notifications · notification_preferences · settings · feedback · newsletter · geo · public_tools · reports · qa · stats · admin · admin_analytics · webhooks · health

---

## 5. Unknown / Uncertain Areas (to verify before UX research)

1. **Which UI generation is live** — legacy tabs vs. "Nova" components, and how `useUiVariant` decides. Need to know the *actual* experience a real user gets today (A/B? flagged? fully migrated?).
2. **Tier boundaries in practice** — exactly what Guest vs Registered vs Premium can see/do per feature, and which features are pay-per-use. Memory references TIER_PLAN but I haven't read the enforcement in code.
3. **Feature liveness vs. "backend only"** — AGENT_INSTRUCTIONS lists several endpoints as "backend implemented, no frontend consumer." Several look wired now; need a current wired-vs-dead audit (there's an API_FRONTEND_WIRING_AUDIT doc) before assuming a feature is reachable.
4. **Experimental astrology surfaces** — Kalachakra/Yogini/Ashtottari/Shadbala/Vargas are flagged "experimental/display-only, no astrologer sign-off." Unclear if users see them, behind what labeling, and whether they're premium.
5. **Web dashboard vs mobile parity** — both have ~5-destination models but different depth. Unknown which is the primary/priority surface and where feature gaps intentionally exist.
6. **Real usage / analytics** — PostHog is wired on mobile; I have no data on which features users actually use, funnel drop-off, or retention. No analytics on web mentioned.
7. **Guest → registered → premium conversion flow** — the exact upsell moments (jadhagam-teaser/reveal on mobile, guest-chart-modal on web) and how aggressive/where they trigger.
8. **Content authorship & trust** — how narrative/remedy text is generated (templated vs. AI vs. hand-written per nakshatra), and how the "no astrologer verification" caveat surfaces to users.
9. **Onboarding completeness** — how birth-time-unknown users are handled end-to-end, and how location→timezone accuracy is ensured.
10. **Notification behavior** — what actually gets sent (morning alert, peyarchi, chandrashtama), cadence, and opt-in defaults.
11. **Accessibility, performance, and dark/light theming** — flagged as concern areas in the docs (CSS var fallbacks, scroll-depth rules) but current real-device state unknown.
12. **The "score" mental model** — how users interpret a 0–100 day score and the 6-part breakdown; whether the calibration/reasons are legible to a non-expert.

---

## 6. Questions Before Doing UX Research

**Product & strategy**
1. Who is the *priority* user right now — Tamil Nadu local or global diaspora? Web or mobile-first?
2. What is the single most important user action/outcome (the "north-star")? Daily-score check-in? Porutham? Muhurtham? Chart generation?
3. What stage is the product in — pre-launch beta, soft-launched, or scaling? (README shows staging/prod EAS profiles + a beta route + go-live checklists.)
4. What does success look like for this research pass — conversion, retention, comprehension, trust, or specific-feature usability?

**Users & context**
5. Do we have real users / analytics / session recordings I can look at, or is this pre-launch and research must be evaluative/expert-based?
6. What is the assumed astrological literacy of the target user — do they already know terms like dasha/nakshatra/porutham, or must the UI teach them?
7. How much do users trust an *app* (vs. a human astrologer) for these decisions — is trust-building the core UX problem?

**Scope of the research**
8. Should research cover **web dashboard, mobile app, and public/SEO site**, or focus on one surface? (They differ meaningfully.)
9. Which UI is canonical to evaluate — the "Nova" redesign or legacy? Can someone confirm what a real account sees today?
10. Are the experimental astrology panels (Kalachakra/Shadbala/Vargas/etc.) in scope, or should I treat them as out-of-scope until astrologer-verified?

**Business model & gating**
11. What exactly is free vs. premium vs. pay-per-use, and where are the paywalls? (Needed to evaluate the guest→paid journey honestly.)
12. Are ads (mobile AdMob) part of the free experience I should account for in the UX?

**Constraints**
13. Are there cultural/religious sensitivities or non-negotiable content rules (beyond the tone rules in the docs) that constrain UX changes?
14. Is there an existing UX audit (`docs/UX_EXCELLENCE_AUDIT.md`, `docs/MOBILE_UX_2026.md`) whose findings I should build on rather than duplicate?

---

*End of Step 0. No improvements proposed — understanding only. Ready for Step 1 on your signal.*
