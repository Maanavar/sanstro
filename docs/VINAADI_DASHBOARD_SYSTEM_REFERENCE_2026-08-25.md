# Vinaadi — Dashboard (Signed-in Product) System Reference

**Document 1 of 2.** Companion document: `docs/VINAADI_MARKETING_SITE_SYSTEM_REFERENCE_2026-08-25.md`
**Date:** 2026-08-25 · **Repo:** `D:\sanstro` · **Branch at time of writing:** `harden/production-readiness`
**Scope:** the signed-in web dashboard (`/dashboard/*`, `/login`, `/admin`) and the backend it calls.

> **How to read this.** §1–§4 are the product/business layer — read these if you want to know
> what Vinaadi is and what every screen does. §5–§10 are the engineering layer — architecture,
> data flow, engines, stack, testing. §11 is an as-built route/API reference. §12 is my own
> findings and recommendations — **proposals, not shipped state.** Everything before §12
> describes the code as it exists on this branch today.

---

## Table of contents

1. [What Vinaadi is](#1-what-vinaadi-is)
2. [Who it is for, and the product thesis](#2-who-it-is-for-and-the-product-thesis)
3. [The dashboard at a glance](#3-the-dashboard-at-a-glance)
4. [Every screen, explained](#4-every-screen-explained)
5. [Cross-cutting product systems](#5-cross-cutting-product-systems)
6. [Access model — auth, tiers, gating](#6-access-model--auth-tiers-gating)
7. [Architecture and data flow](#7-architecture-and-data-flow)
8. [The astrology engine behind the screens](#8-the-astrology-engine-behind-the-screens)
9. [Tech stack](#9-tech-stack)
10. [Testing, quality gates and operations](#10-testing-quality-gates-and-operations)
11. [Appendix A — route and API reference](#11-appendix-a--route-and-api-reference)
12. [Appendix B — findings, risks and recommendations](#12-appendix-b--findings-risks-and-recommendations)

---

## 1. What Vinaadi is

**Vinaadi is a Tamil-first, bilingual (Tamil/English) Vedic astrology companion.** It takes a
person's birth details, computes a full Thirukanitham-method natal chart from a real ephemeris,
and then answers the questions people actually ask an astrologer — *what is today like for me,
when should I do this thing, is this match good, what is happening in my career this year, what
should I name my child* — in plain language, every day, without an appointment.

Three things distinguish it from the general run of astrology apps:

| | What Vinaadi does | What the category usually does |
|---|---|---|
| **Calculation** | Thirukanitham (true-position, drik) sidereal computation via Swiss Ephemeris, versioned as `thirukanitham-2026-v1` | Sun-sign or Vakya approximations |
| **Doctrine** | Rules are sourced to named classical texts (Kalaprakasika and others), reviewed by a practising astrologer, and recorded in `docs/` before they are coded | Rules are invented or copied without provenance |
| **Register** | Tamil almanac vocabulary, one language at a time, no bilingual echo; plain-language explanations of *why* a verdict is what it is | Sanskritised jargon, or a bare score with no reasoning |

The product spans three surfaces on one backend:

- **Marketing / public web** (`vinaadi.com`) — free tools, an encyclopedia, SEO acquisition. *(Document 2.)*
- **Dashboard** (`/dashboard`) — the signed-in daily product. **This document.**
- **Mobile** (Expo / React Native) — a companion app sharing the same FastAPI backend and the
  `@vinaadi/shared` typed API client. Covered here only where it touches the dashboard's contracts.

The internal package name is `jothidam-ai`; `Vinaadi` is the brand. Both appear in the code.

---

## 2. Who it is for, and the product thesis

**Primary user.** A Tamil-speaking adult, in Tamil Nadu or the diaspora, who takes jothidam
seriously as a decision input — not entertainment. They already know what a nakshatra and a dasa
are. They want the calculation to be right and the reasoning shown.

**Secondary user.** The same person acting *for their family* — checking a marriage match for a
son or daughter, picking a muhurtham, naming a baby, watching a parent's Sani period. The Family
& Charts surface exists because this is not an individual product in practice.

**The thesis, as expressed by the architecture:**

1. **Daily habit, not one-off report.** The default screen is Today, not a chart. `usePersonalData`,
   the streak system, morning push notifications and the journal all exist to make the product a
   daily return, not a single purchase.
2. **A verdict is worthless without its reason.** Nearly every score in the product ships with a
   reason string derived from the same computation, and there is a whole `app/reasoning/` package
   (promise gate, contradiction detection, verdict lexicon, calibration log) devoted to making the
   prose agree with the numbers.
3. **Complexity is a setting, not a fixed level.** `user_mode` (BEGINNER / BALANCED / TRADITIONAL)
   and `life_mode` (the user's declared current focus) reshape what a screen shows, so one product
   serves a curious newcomer and a veteran practitioner.
4. **The astrologer is the authority, the code is the implementation.** Doctrine questions are
   escalated to docs and owner rulings; the code follows. This is why `docs/` carries ~110 audit
   and doctrine files.

---

## 3. The dashboard at a glance

### 3.1 The shell

Everything under `/dashboard` is drawn by **one client component**, `DashboardWorkspace`
([web/components/dashboard-workspace.tsx](web/components/dashboard-workspace.tsx), ~110 KB),
mounted in a route-group **layout** rather than in the pages beneath it.

That placement is deliberate and load-bearing. `/dashboard` and `/dashboard/*` are two different
Next routes; while the workspace lived inside each page, every tab click unmounted and remounted
the whole workspace — session state reset, every cache emptied, back to the first-load skeleton.
Mounting it in `web/app/dashboard/(workspace)/layout.tsx` means the layout is preserved across
navigations, so a tab change is local state plus a URL rewrite. The two page files below it
render `null` on purpose.

### 3.2 The eleven destinations

`Tab` is a single shared union in [web/lib/dashboard-tabs.ts](web/lib/dashboard-tabs.ts) — add or
remove a tab there and every consumer type-fails together.

| Tab id | Label (EN) | URL | What it is for |
|---|---|---|---|
| `personal` | **Today** | `/dashboard` (alias `/dashboard/today`) | The day at a glance — timing, guidance, one-minute reading |
| `calendar` | **Calendar** | `/dashboard/calendar` | Any day or month, with full panchangam detail |
| `family` | **Family & Charts** | `/dashboard/family` | Chart engine + family members, transits, dasas |
| `plan` | **Goals** | `/dashboard/goals` | Intentions, life events, what-if, decision briefs |
| `life-areas` | **Life Areas** | `/dashboard/life-areas` | Marriage / career / wealth / health readings |
| `tools` | **Tools** | `/dashboard/tools[/<tool>]` | 11 focused tools, each deep-linkable |
| `explore` | **Understand** | `/dashboard/explore` | Knowledge library, chart-relative |
| `journal` | **Journal** | `/dashboard/journal` | Diary, entries, reflections/correlations |
| `settings` | **Settings** | `/dashboard/settings` | 9-section preferences rail |
| `qa` | QA | `/dashboard/qa` | Dev-only golden-case diagnostics |
| `onboarding` | — | *not addressable* | Derived gate when no birth profile exists |

Plus two routes **outside** the workspace group, which therefore do not inherit it:
`/dashboard/glossary` (100-term glossary index) and `/dashboard/reports` (pay-per-use purchase).
`/admin` is a separate console entirely.

### 3.3 URL design

Tab and open tool are both real path segments, so every destination is deep-linkable,
bookmarkable and walkable with browser Back/Forward:

```
/dashboard                            → Today (canonical)
/dashboard/today                      → Today (inbound alias, never written back)
/dashboard/calendar
/dashboard/tools                      → tool grid
/dashboard/tools/numerology           → Tools tab with the Numerology panel open
/dashboard/tools/jadhagam-generator   → slug follows the tool's *name*, not its internal id
```

Two rules are enforced in `dashboardPath` / `parseDashboardPath`:

- **Slugs follow the visible label, not the internal id.** The tab whose id is `personal` is
  labelled "Today"; `plan` is labelled "Goals" and its slug is `goals`. `activityTiming` becomes
  `activity-timing` so camelCase never leaks into the address bar.
- **An unknown slug degrades, it does not 404.** A URL is user-editable input; a typo lands on
  the fallback tab and the outbound sync rewrites it to the canonical path.

A legacy `?tab=` query param (superseded 2026-07-28) is still *read* once on hydration so old
shared links resolve, then rewritten to the path form. Nothing writes it any more.

### 3.4 Pane keep-alive

Panes are mounted the first time they become visible and **never unmounted again** — `active`
only toggles CSS `display` and a framer-motion fade (`TabPane` in the workspace). A
`visitedPanesRef` records which panes have ever been on screen. Without this, every tab switch
re-showed every panel's loading state. Settings splits into two independently kept-alive panes
(`settings-setup`, `settings-session`).

Every tab body is a `next/dynamic` import with a skeleton fallback, so the first paint does not
carry eleven tabs' worth of JavaScript.

---

## 4. Every screen, explained

### 4.1 Entry — `/login`

[web/app/login/page.tsx](web/app/login/page.tsx). One page, four modes: `login`, `signup`,
`forgot`, `reset`.

- Email + password, with a live password-strength estimate and show/hide toggles.
- **Google SSO**, conditionally rendered: the page calls `GET /auth/oauth/providers` and hides
  the button entirely when Google credentials are not configured, rather than showing a button
  that fails.
- **Language is resolved server-side.** The `LangContext` provider in the root layout is seeded
  from a lang *cookie*, so the page renders in the reader's language instead of painting English
  and swapping to Tamil after hydration. A `<LangToggle/>` gives a first-time visitor a way to choose.
- **Error copy holds either a key or a text.** Our own messages are stored by i18n key so they
  re-render in the reader's language when they toggle; server messages are stored as text because
  we cannot translate what the API produced. This is a small detail that most products get wrong.
- **Guest chart modal** — an unregistered visitor can generate a chart here before committing.
- `LoginWelcomeNova` plays the signed-in welcome animation.

`middleware.ts` guards the perimeter: no `vinaadi_token` cookie and a `/dashboard` or `/admin`
path → redirect to `/login`.

### 4.2 Onboarding gate and Setup

If `GET /birth-profiles/me/latest` finds no profile, the workspace routes to the `onboarding`
tab, which renders `DashboardSetupTab` ([web/components/dashboard-setup-tab.tsx](web/components/dashboard-setup-tab.tsx), 54 KB) inside the Settings shell.

Setup collects, for the owner and for each family member:

- Display name, relationship to owner (self / spouse / child / parent / sibling / grandparent / other)
- Birth date, birth time, **birth place** (with lat/long/timezone), **current place**
- **Birth-time source and confidence in minutes** — this is what makes rectification possible later
- Life context: marital status, employment type, children
- A `memberWeight` derived from relationship (parent/grandparent 1.15, self/spouse 1.00, child/sibling 0.75) which feeds family aggregate scoring

Place entry uses `PlaceCombobox` against a **bundled offline place dataset** (`GET /places/search`,
Tamil-Nadu-scoped), with the external geocoding proxy (`/geo`) retained only as an explicit
opt-in fallback. This was an owner ruling (2026-08-24) — it removes a third-party dependency from
the single most important input in the product.

Note the incognito guard in `useSession`: when `?setup=1` is present it checks the **database**
for an existing profile rather than localStorage, because localStorage is unreliable in private
windows and on new devices and would falsely skip setup.

### 4.3 Today — `/dashboard`

[web/components/dashboard-today-tab-nova.tsx](web/components/dashboard-today-tab-nova.tsx) (66 KB),
plus a glance module (60 KB), a ribbon, an activity board (27 KB) and a deep-dive extras module (36 KB).

This is the decision layer. Top to bottom:

**Hero.** Date, place, the day's score dial, and a plain-language verdict band. A sky backdrop and
moon glyph render the actual tithi/phase, not decoration.

**The Today ribbon.** A live timeline of the day with a NOW marker, the current **horai** (planetary
hour), and the day's windows laid on a real clock axis. Every "now" comparison happens in the
**panchangam's timezone**, not the browser's — a diaspora user checking Chennai timings does not
get their local clock silently substituted.

**Timing windows.** Nalla Neram / Gowri Nalla Neram promoted windows, each labelled with the Gowri
kala it was cut from (Amirtham / Uthi / Labham / …) beside its period, because two adjacent good
windows with nothing to distinguish them read as a bug. Owner ruling: the best Gowri kala wins the
promoted window, and an avoid-kala vetoes it. Rahu kalam / Yamagandam / Kuligai are shown as
avoid-periods.

**One-Minute Reading.** A synthesised daily briefing (`one_minute_reading` flag, backed by the
244 KB `one_minute_reading_service.py` — the single largest service in the codebase). There is a
Five-Minute Reading counterpart. The naming rule is recorded: **name = round(median EN words / 118)**,
i.e. the name is a real reading-time estimate, not marketing.

**Activity board.** What today supports and what it does not, by activity, from
`activity_timing_rules.py` (39 KB) and the muhurta engine.

**Glance rows.** Family remedy row, life-areas/dasa row, quick links (8 tiles) to the tools —
chart-dependent tiles grey out when no profile is saved, matching the Tools tab's own gating.

**Deep dive** (one click, "Open Chart & Explanations"): chart validation chip, chart context /
guidance / gochar, the Dasa–Bhukti–Antaram strip, activity-timing month browser, planet table,
chart explanation, vargas, shadbala, three alternate dasa systems, classical timing, nakshatra
card, Prasna trigger, and PDF download.

**Evening preview.** After a threshold the surface swaps in tomorrow's item, read from the
already-fetched 3-day guidance range — no extra request.

**Section errors.** The bundle isolates per-section failures; a non-empty `sectionErrors` renders a
"some sections couldn't load" chip with a retry, rather than failing the whole screen.

### 4.4 Calendar — `/dashboard/calendar`

[web/components/dashboard-calendar-tab-nova.tsx](web/components/dashboard-calendar-tab-nova.tsx)
(91 KB) + monthly view (51 KB).

- **Daily view** — the full panchangam for any date: tithi, nakshatra, yogam, karanam, Tamil date
  and month, sunrise/sunset, moonrise/moonset, rahu/yama/kuligai, Gowri panchangam, hora table,
  nokku/nethiram, chandrashtamam, festivals as chips.
- **Monthly view** — a grid with a control rail filtering by one `CalCategory` enum, and a day-click
  **detail drawer** giving a preview without leaving the grid.
- Intra-day panchangam **transitions** are computed, not just the sunrise-moment value — a tithi
  that changes at 14:20 is shown changing at 14:20.
- Accepts a focus target on arrival (e.g. "show me Muhurta in Calendar" from another tab), then
  clears it so a later Back does not re-fire.

### 4.5 Family & Charts — `/dashboard/family`

[web/components/dashboard-family-charts-hybrid.tsx](web/components/dashboard-family-charts-hybrid.tsx)
(100 KB) + `dashboard-hybrid-parts.tsx` (142 KB — the largest single component file in the repo).

"Hybrid v2", promoted to default 2026-07-22. **A single-scroll, section-railed page where selecting
a member drives every reading section below it.** This is the chart home; the former standalone
"Transits & Dashas" tab was folded in here.

Sections: member selector → rasi and navamsa charts → planet table with dignity and functional
nature → chart explanation (backed by a 124 KB explanation service) → yogas and doshams (126 KB
panel) → dasa timeline → transits/gochar → Sani cycle → synastry/compatibility → remedies.

Content owned by other tabs (Predictions/Forecast, AI/Notes) is a **link-out card here, never a
second implementation** — a discipline worth calling out, because the same content re-implemented
per tab is how dashboards rot.

Supporting panels available from here: Vargas (divisional charts), Shadbala (six-fold strength),
Varshaphala (annual/Tajaka), Ashtottari / Yogini / Kalachakra / Jaimini-Chara / conditional dashas,
Ashtakavarga and BAV-derived indications, Prasna (horary), event windows, family harmony remedies,
and Jadhagam PDF export.

### 4.6 Goals — `/dashboard/goals`

[web/components/dashboard-plan-tab-nova.tsx](web/components/dashboard-plan-tab-nova.tsx) (40 KB).
Four sub-tabs:

| Sub-tab | What it does |
|---|---|
| **Goals** | Declare an intention (career / exam / relationship / financial …). Goals reshape guidance and appear as a focus strip on Life Areas. Limit is tier-bound. |
| **Events** | Life-event log — record what actually happened, feeding correlation and calibration. |
| **What-if** | Model a hypothetical date/decision against the chart (`POST /whatif`, 52 KB service). |
| **Decisions** | A decision brief for a concrete choice (`POST /decisions/brief`). |

Muhurta lives here too via `NovaPlanMuhurtaPanel`, which wraps a 55 KB muhurta picker and the
Muhurtham Naal panel.

### 4.7 Life Areas — `/dashboard/life-areas`

[web/components/dashboard-life-areas-tab-nova.tsx](web/components/dashboard-life-areas-tab-nova.tsx)
(31 KB). Six sub-tabs: **scores · predictions · chances · yogas · remedies · report**.

- **Scores** — each life area with a score, band and caution, grouped into three tiers:
  *Needs attention* / *Steady* / *Supportive*. An area lands in "Needs attention" if its tone is
  low **or** it carries a caution.
- **Predictions** — marriage, career, wealth, health, each from its own backend service
  (`marriage_service.py` 50 KB, `career_service.py` 28 KB, `wealth_service.py` 16 KB).
- **Chances / Yogas / Remedies / Report** — propensity cards, yoga-dosham detail, remedy plan,
  and a printable area report.
- A **goal-focus strip** threads the user's declared goals in from `usePlanData` — no new fetch.

This file is the **reference tab** for the shared component kit: the sub-nav is one `<Segmented>`,
tier names are real `<h2>` headings, every surface is a `<Card>`, every font-size reads a
`--text-*` scale step. New work on other tabs is meant to follow this file's shape.

### 4.8 Tools — `/dashboard/tools`

[web/components/dashboard-tools-tab-nova.tsx](web/components/dashboard-tools-tab-nova.tsx) (26 KB).
A card grid; opening a tool pushes a path segment and swaps the grid for the panel.

| Tool | Slug | What it does |
|---|---|---|
| Jadhagam Generator | `jadhagam-generator` | Full chart for any birth details (53 KB inline panel) |
| Marriage Porutham | `porutham` | 10-porutham match with reasons (51 KB panel) |
| Compatibility (Synastry) | `compatibility` | Cross-chart reads across the family (52 KB panel) |
| Muhurta Finder | `muhurta-finder` | Best window for a named activity |
| Activity Timing | `activity-timing` | When to do a specific thing, by rule |
| Rasipalan | `rasipalan` | Daily rasi forecast |
| Varshaphala | `varshaphala` | Annual solar-return reading |
| Numerology | `numerology` | Full numerology profile, cycles, alignment, name correction |
| Baby Name Finder | `baby-name-finder` | Pada-akshara-correct names with meanings |
| Annual Wrapped | `annual-wrapped` | Year-in-review, shareable |
| Retrospective | `retrospective` | Look back at a past period against the chart |

Two panels are **reused verbatim from the marketing site** (`RasippalanTool`, `MuhurtaTool`), wrapped
in a `NovaToolIsland` for theming — one implementation, two surfaces.

Tools requiring a chart show a "Needs profile" disabled state rather than failing on click.
Numerology tools are behind the `numerology_engine` flag; when off, every route 404s and the panel
renders "not switched on yet" rather than an error.

### 4.9 Understand (Explore) — `/dashboard/explore`

[web/components/dashboard-explore-tab-nova.tsx](web/components/dashboard-explore-tab-nova.tsx) (37 KB).

A searchable knowledge library — Natchathiram, Dosham, Yogam, Pariharam, Temples, Panchangam —
plus a "start from your own chart" row and short-read articles. **It reuses the live marketing
pages via real links rather than duplicating an encyclopedia inside the dashboard.**

Navigation is explicitly three-level: hub → list → detail, so Back reads the same way regardless
of how detail was entered. Chart-relative tiles (your nakshatram, your active dosham) are only
openable once the chart data has loaded — until then a disabled loading state, never a dead link.

### 4.10 Journal — `/dashboard/journal`

[web/components/dashboard-journal-tab-nova.tsx](web/components/dashboard-journal-tab-nova.tsx) (37 KB).
Three sub-tabs: **Write · Entries · Reflections**.

- Write — a prompted entry tagged to a life area, with prompts from `GET /journal/prompts`.
- Entries — filterable history, editable and deletable.
- Reflections — correlations between what was logged and what the engine said
  (`GET /journal/{chartId}/correlations?lookbackDays=30`).
- Retention policy is user-controlled (`POST /journal/retention/apply`) and entries are
  exportable (`GET /journal/export`).
- Life *context* (job change, marriage, relocation) deliberately does **not** live here — it is
  profile input the engine reads, so it moved to Settings. The diary keeps a read-only view of
  what context the engine is using.

### 4.11 Settings — `/dashboard/settings`

`SettingsRail` ([web/components/dashboard-settings-rail.tsx](web/components/dashboard-settings-rail.tsx))
+ a 67 KB session tab. Nine sections:

| Section | Contents |
|---|---|
| Setup & Family | Birth profiles, family members, vault management |
| Account | Email, password, sign-out |
| Life context | Job change / marriage / relocation — engine input |
| Experience | `user_mode` (BEGINNER/BALANCED/TRADITIONAL), `life_mode`, language |
| Appearance | Theme (system / light / dark) |
| Notifications | Morning guidance opt-in, push tokens, per-type preferences |
| Journal & Data | Retention, export |
| Privacy & Legal | Policy links, data controls |
| **Danger Zone** | Destructive actions, visually separated below a divider |

Note the copy ruling visible in the code: the identity card says "*<name>* family", not "vault" —
"the reader's own family, not a 'vault'".

### 4.12 Glossary — `/dashboard/glossary`

A 100-term bilingual glossary ([web/lib/glossary.ts](web/lib/glossary.ts), 34 KB). Terms are also
inlined across the product via `<GlossaryTerm>`, which renders a tooltip/pop-over on any technical
word in situ. This is the mechanism that lets TRADITIONAL vocabulary appear without stranding a
BEGINNER reader.

### 4.13 Reports — `/dashboard/reports`

Pay-per-use purchase surface. Three product families, priced in INR, purchased through RevenueCat:

- **Jadhagam Reports** — 1-page ₹29 · 3-page ₹59 · 5-page ₹99 · 10-page ₹179
- **Porutham Reports** — 1-page ₹49 · 3-page ₹99
- **Ask Vinaadi Top-up** — 10 questions ₹49

Subscription plans (from `packages/shared/src/constants/tiers.ts`): **Premium monthly ₹149**,
**Premium annual ₹999**. Displayed prices are fallbacks shown before store prices load.

### 4.14 Admin console — `/admin`

[web/components/admin-console.tsx](web/components/admin-console.tsx) (55 KB). Eleven tabs:
Overview · Health · Users · Analytics · Calibration · Feedback · Operations · Notifications ·
Config · Audit Log · Privacy.

Notable: **Operations can trigger any cron job on demand**, **Config can flip feature flags at
runtime** (`GET/PATCH/DELETE /admin/flags`), and **every admin action is written to an audit log**.
Admin access is granted by a server-side email allow-list (`JOTHIDAM_ADMIN_EMAILS`) so the browser
never holds the admin API key.

---

## 5. Cross-cutting product systems

### 5.1 Bilingual — one language at a time

Tamil is the default (`lang` defaults to `"ta"`). The dashboard carries **903 i18n key groups** in
[web/lib/i18n.ts](web/lib/i18n.ts) (132 KB) plus a dashboard-specific catalogue (31 KB).

The governing ruling: **active language only, never a faint other-language echo.** A bilingual
title echo was explicitly rejected. Where a Tamil name and an English name both exist, display
follows **Tamil almanac usage over Sanskrit** — this is a recorded doctrine decision, not a style
preference.

Language resolution order: server-rendered from cookie → `GET /auth/me` → `GET /settings/ui` →
localStorage → toggle. A `vinaadi:lang-resolved` custom event broadcasts the resolved value.

### 5.2 Two independent "modes"

These are frequently confused; they are different fields on different tables.

- **`user_mode`** (on `users`) — *dashboard complexity*: `BEGINNER` | `BALANCED` | `TRADITIONAL`.
  Controls how much classical vocabulary and how many panels a screen shows.
- **`life_mode`** (on `user_preferences`) — *the user's declared current focus*: `STUDY`, `CAREER`,
  `LOVE`, `MARRIAGE`, `FAMILY`, `WEALTH`, `HEALTH`, `SPIRITUALITY`, `REMEDIES`, `BALANCED`.
  Default `BALANCED`; the picker re-shows after 30 days (`LIFE_MODE_STALE_DAYS`).

An **age gate** restricts which life modes a minor may select (`MINOR_BLOCKED_MODES` in
`app/core/age_gate.py`) — a real safety control, not decoration.

### 5.3 Theming

Three states — `system` / `light` / `dark` — with `system` following the OS live via
`matchMedia`, and a pre-paint inline script in the root layout that sets `data-theme` before
first paint to avoid a flash. The Nova design system defines **376 CSS custom properties** in
`dashboard-nova.css`, and a colour-literal ratchet (`pnpm qa:colors`) fails the build when raw
hex values are added outside the token layer.

Recorded design rulings that override any generic UI advice: **no accent left-border stripes on
cards** (an AI-UI tell), brand-colour ≠ text-colour, and no emoji as icons (lucide only).

### 5.4 Ask Vinaadi

An AI chat grounded in the user's own chart. `POST /charts/{chartId}/ask`, powered by the
Anthropic API (`JOTHIDAM_ANTHROPIC_API_KEY`; returns 503 when unset). Reachable from the hero
search affordance with a ⌘K / Ctrl-K hint (resolved after mount, since SSR cannot know the platform),
and as a floating widget.

Guarded by: a per-tier quota (`GET /ask-vinaadi/daily-status`), a **safety filter**
(`app/services/safety_filter.py`) and usage accounting (`ask_vinaadi_usage` table). Top-ups are a
pay-per-use product.

### 5.5 Notifications, streaks and alerts

- **Morning guidance push** via FCM, sent by an hourly cron that checks each user's timezone window.
- **Ambient alerts** — significant transits surfaced in the hero (`GET /alerts/ambient`, filtered
  by `min_significance=70`).
- **Peyarchi alerts** — planetary transit changes, refreshed nightly.
- **Relationship alerts** — synastry events across family members, refreshed nightly.
- **Streaks** — daily-return counter (`GET /streak`, `POST /streak/ping`), gated to registered+.

### 5.6 Sharing

Share cards are rendered server-side (`GET /charts/{chartId}/share-card`,
`share_card_service.py`) and client-side to canvas (`lib/share-card-canvas.ts`). Porutham results
get **tokenised public share links** (`POST /porutham-shares` → `/share/porutham/{token}` on the
marketing site) so a match can be sent to family without an account. Annual Wrapped has its own
share card, gated to premium.

---

## 6. Access model — auth, tiers, gating

### 6.1 Authentication

**Web** uses an httpOnly cookie (`vinaadi_token`) plus a **custom CSRF header**: every mutating
request sends `X-Vinaadi-CSRF: 1`, and every cookie-authenticated router is mounted with
`Depends(require_csrf_header)`. Because the header cannot be set cross-origin by a simple form
post, this is a valid double-submit-free CSRF defence.

**Mobile** uses a separate cookie-free router (`/auth/*` from `mobile_auth.py`) with Bearer access
tokens and refresh tokens — no CSRF needed because no cookies.

**Google OAuth** is optional and self-describing: `GET /auth/oauth/providers` tells the client
whether to render the button.

Password reset is token-based with an expiring `password_reset_token` row. Auth endpoints are
rate-limited by **authenticated user, not IP** (a recorded correction — IP keying punished shared
NAT households).

### 6.2 Tiers

`app/core/tier_limits.py` is the backend source of truth, kept in sync with
`packages/shared/src/constants/tiers.ts`. Three tiers:

| Capability | Guest | Registered | Premium |
|---|---|---|---|
| Saved birth profiles | 0 | 3 | Unlimited |
| Family profiles | 0 | 1 | 5 |
| Goals | 0 | 3 | Unlimited |
| Rasi palan window | Today only | 7 days | 30 days |
| Ask Vinaadi | 2 / day | 7 / day | 30 / month + top-ups |
| Dasha depth | none | current period only | full timeline + sub-periods |
| Included reports / month | 0 | 0 | 5 detailed + 3 porutham |
| Ads | yes | yes | no |
| Journal · Streaks · Push | — | ✓ | ✓ |
| Annual Wrapped | — | ✓ (no share) | ✓ + share |
| Varshaphala · Vargas · Synastry · Retrospective · Remedies · Life-event log · Rectification · Life-area history | — | — | ✓ |
| Pay-per-use | ✓ | ✓ | ✓ |

**Premium is derived live** from an active `Subscription` row — there is deliberately no premium
boolean on the user model, so a lapsed subscription cannot leave a stale flag behind. RevenueCat
webhooks (`POST /webhooks/revenuecat`, shared-secret validated) keep the row current.

### 6.3 Feature flags

`app/services/feature_flags.py` — runtime-overridable defaults, editable from the admin console.
Currently defined: `reasoning_gate`, `reasoning_bands`, `reasoning_contradiction`,
`reasoning_calibration_log`, `reasoning_chart_signature`, `daily_briefing_synth`,
`propensity_insights`, `holistic_strength_synthesis`, `numerology_engine`,
`numerology_baby_naming`, `numerology_alignment_required`, `one_minute_reading`,
`five_minute_reading`, `enable_push_notifications`, `maintenance_mode`, plus tuning values
(`timing_band_strong_cutoff` 75 / `likely` 60 / `mixed` 45, `nadi_parihara_mode`,
`numerology_personal_year_epoch`, `numerology_naming_mode`, `numerology_compatibility_basis`).

---

## 7. Architecture and data flow

### 7.1 The request path

```
Browser
  │  fetch("/api/backend/api/v1/…", credentials:"include", X-Vinaadi-CSRF)
  ▼
Next.js route handler  web/app/api/backend/[...path]/route.ts
  │  · strips host / content-length
  │  · forwards method, query, body, cookies
  │  · forces  charset=utf-8  on JSON so Tamil is never mis-decoded as Latin-1
  │  · returns 502 {detail:"Backend unreachable"} instead of throwing
  ▼
FastAPI  (BACKEND_URL, default http://127.0.0.1:8000)
  │  SecurityHeaders → RequestLogging → MaintenanceMode → RateLimit → CORS → CSRF dep
  ▼
Router → Service → Calculation → SQLAlchemy → PostgreSQL
```

The proxy means the browser holds an **origin-local** cookie and never talks to the API host
directly — no CORS in the normal path, no cross-site cookie.

### 7.2 The dashboard bundle — the key performance decision

The Today surface once fanned out **13 parallel requests** per chart per day. It now issues **one**:

```
GET /charts/{chartId}/dashboard-bundle?date=YYYY-MM-DD
```

returning summary, explanation, dailyGuidance, dailyGuidanceRange, dasha, transit, sani,
peyarchiUpcoming, panchangam, panchangamTimings, lifeAreas, weekAhead, nakshatraCard,
panchangamLocation, panchangamTimezone — **and an `errors` map**.

Three properties of this design are worth naming:

1. **Section failures are isolated.** A failing section comes back `null` with a note in `errors`;
   the request still succeeds. The UI renders a gap and a retry chip for exactly the sections that
   failed. Compare with the fan-out, where one 500 could blank the screen.
2. **Fallbacks are conditional, not unconditional.** `weekAhead` and `nakshatraCard` have their own
   queries, but they are `enabled` only when the bundle came back without them. No duplicate work.
3. **The chart calculation is cached separately from the day.** `POST /charts/calculate` is keyed
   on `birthProfileId` with `STALE.session`; the bundle is keyed on `(chartId, date)` with
   `STALE.today`. Paging the date never re-runs the chart — only a profile edit does, via an
   explicit `forceChart`.

Life-area predictions (4 more requests) are gated on the Life Areas surface actually being open.

### 7.3 State management

| Layer | Mechanism |
|---|---|
| Server state | TanStack Query v5, one `QueryClient`, `STALE.{today, session, static}` tiers |
| Read path | `useApiQuery` — the single wrapper replacing six copies of a `useState`+`useEffect`+`cancelled` block that each refetched on every mount |
| Domain hooks | `usePersonalData` (25 KB), `useFamilyData` (14 KB), `usePlanData`, `useJournalData`, `useMonthlyPanchangam`, `useEventWindows` |
| Session | `useSession` — bootstraps from `/auth/me`, identifies analytics with an **opaque UUID only, never email** |
| Local UI | `useState` in the workspace, persisted to localStorage as `PersistedState` |
| Guest | `useGuestStore` — a rasi choice in localStorage, so a signed-out visitor gets something personal |

`useApiQuery` exposes a four-value state — `loading | error | unavailable | idle`. The
`unavailable` case distinguishes "this feature does not apply to this chart" (a 404 the
propensities panel treats as an empty state) from "the request failed", which is the kind of
distinction that otherwise diverges per copy.

### 7.4 Race and cancellation discipline

`usePersonalData` carries a `personalRequestIdRef` monotonic counter; every async continuation
checks `isPersonalRequestCurrent(requestId)` before writing state. `AbortError` is rethrown, never
swallowed as a failure. Error recovery is explicit: a 403/404 on the bundle clears the stale
profile/chart ids and re-resolves the latest profile once, then gives up — no infinite retry loop.

### 7.5 Backend layering

```
app/api/          49 routers   — HTTP surface, auth deps, schema validation only
app/schemas/      40 modules   — Pydantic request/response contracts
app/services/     95 modules   — orchestration, caching, persistence, narrative
app/calculations/ 62 modules   — pure astrology math (no DB, no HTTP)
app/reasoning/     7 modules   — promise gate, verdict lexicon, contradiction, calibration
app/data/         18 modules   — sourced classical rule sets (Kalaprakasika etc.)
app/models/       37 modules   — SQLAlchemy ORM
app/core/         16 modules   — config, auth, cache, rate limit, tiers, encryption
```

334 Python modules, 53 Alembic migrations.

**Birth data is encrypted at rest** (`app/core/encryption.py`, Fernet, `JOTHIDAM_ENCRYPTION_KEY`).
Production boot **fails** if the key is missing rather than 500-ing on first touch of encrypted data.

### 7.6 Cross-surface API contract

The route path, query params and response shape are a shared contract across **four** locations —
`app/api/`, `packages/shared/src/api/`, `mobile/src/api/`, `web/`. There is no compile-time check
across that boundary, so the project rule is: grep all four before changing a route.

Forward policy: every **new** endpoint gets a typed wrapper in `packages/shared/src/api/` (46
wrappers today), and new web/mobile code must use it. `web/` largely bypasses the shared client
via direct `apiFetchJson` calls with hardcoded paths — that is grandfathered, not endorsed. Two
wrappers have silently drifted wrong in the past (a query param where the backend wanted a path
param; PATCH where the backend accepts only PUT), which is why the rule is to re-read the FastAPI
decorator when touching one. Guards exist: a TS↔OpenAPI field-parity check.

---

## 8. The astrology engine behind the screens

Not a black box — this is the substance of the product, so a reader of this document should know
what is actually computed.

### 8.1 Foundation

- **Swiss Ephemeris** (`pyswisseph`, or `swisseph-ffi` on Python ≥ 3.14) via
  `app/calculations/ephemeris.py`.
- **Thirukanitham / drik** true positions, sidereal. Calculation version string:
  `thirukanitham-2026-v1` — sent on every `POST /charts/calculate`, so a chart record always
  names the method that produced it.
- Polar day/night is handled explicitly: a circumpolar Sun makes sunrise-anchored panchangam
  fields undefined, and the API returns **422 with a user-fixable message**, not a 500.

### 8.2 What is computed

| Domain | Modules |
|---|---|
| **Panchangam** | `panchangam.py` (104 KB) — tithi, nakshatra, yogam, karanam, Tamil date, sunrise/set, rahu/yama/kuligai, Gowri, hora, nokku/nethiram, chandrashtamam, intra-day transitions |
| **Chart** | `_chart_build.py`, `_chart_planets.py`, `divisional_charts.py`, `equal_bhava.py`, `house_lords.py`, `aspects.py`, `functional_nature.py`, `planet_conditions.py` |
| **Strength** | `shadbala.py`, `chart_strength.py` (42 KB), `ashtakavarga.py`, `bav_derived.py` |
| **Dasa systems** | Vimshottari (`dasha.py`), Ashtottari, Yogini, Kalachakra, Jaimini-Chara, plus 7 conditional dashas |
| **Yogas & doshams** | `_yoga_detect.py` (36 KB), `_yoga_dosham.py` (54 KB), `yoga_effects.py`, `yoga_activation.py` |
| **Transits** | `transits.py`, `double_transit.py`, `sade_sati.py`, peyarchi service |
| **Matching** | `porutham.py` (38 KB), `compatibility_intelligence.py` (41 KB), synastry service (48 KB) |
| **Muhurta** | `muhurta_engine.py` (94 KB) + a 83 KB activity registry + 6 Kalaprakasika rule files totalling ~230 KB |
| **Numerology** | naming (39 KB), correction (24 KB), compatibility (35 KB), timing (20 KB), alignment (22 KB), plus a 36 KB Tamil name corpus and the pada-akshara canon |
| **Propensities** | `propensities.py` (118 KB) — 40 propensity cards |
| **Prediction** | prediction score, dasha activation, bhava afflictions, karaka chains, maturation |
| **Narrative** | `narrative_engine.py` (101 KB), `chart_explanation_service.py` (124 KB), `life_areas_service.py` (127 KB), `one_minute_reading_service.py` (244 KB), `five_minute_reading_service.py` (89 KB) |

### 8.3 The reasoning layer

`app/reasoning/` is what stops the product from printing confident nonsense:

- **`promise_gate.py`** — a prediction is only made if the natal chart *promises* the thing.
  Timing without promise is suppressed.
- **`verdict.py` / `verdict_lexicon.py`** — a controlled vocabulary so "strong" always means the
  same band. Cutoffs are flags: strong ≥ 75, likely ≥ 60, mixed ≥ 45.
- **`contradiction.py`** — detects when two computed signals say opposite things and forces the
  prose to acknowledge it instead of picking one.
- **`calibration.py`** + `prediction_log` — predictions are logged so accuracy can be measured
  after the fact.
- **`chart_signature.py`** — a stable fingerprint of a chart, used for caching and for the QA
  golden-case suite.

A recorded rule worth repeating because it is a real bug class: **explanation copy must branch on
the printed value, not on the rule that produced it.** Copy written against the rule drifts from
the number the reader can see.

### 8.4 Doctrine governance

Astrology rules are not invented in code. The flow is: question → `docs/*_DOCTRINE_*.md` →
astrologer/owner ruling → implementation → test. `docs/` holds ~110 such files, including a
rulebook for external review, a doctrine-vs-code audit, per-chapter Kalaprakasika extraction
worksheets, and Tamil review sheets. The QA golden-case suite (`tests/golden/`, `qa_golden_case`
table, `/dashboard/qa`) is how a ruling stays true after later refactors.

---

## 9. Tech stack

### 9.1 Frontend — `web/`

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Route groups `(marketing)` and `(workspace)` |
| UI | **React 19** | Server Components for shells, `"use client"` for interactive surfaces |
| Language | **TypeScript 5**, strict | |
| Server state | **TanStack Query v5** | + devtools |
| Forms | **react-hook-form** + **zod 4** via `@hookform/resolvers` | |
| Motion | **framer-motion 12** | `useReducedMotion` respected throughout |
| Icons | **lucide-react** | Explicit rule: no emoji as icons |
| Toasts | **sonner** | |
| Push | **firebase** (FCM web) | |
| Analytics | **posthog-js** | Identified by opaque UUID only |
| Styling | **Hand-written CSS**, 376 Nova custom properties | **No Tailwind, no shadcn/ui, no Radix** — and none may be added |

Style is split so signed-in routes never download public-site CSS: `marketing.css` (~117 KB) is
imported by the marketing layout only; `dashboard*.css` by the dashboard layout only.

### 9.2 Backend

| Concern | Choice |
|---|---|
| Framework | **FastAPI** (≥0.115), **Uvicorn** |
| ORM / migrations | **SQLAlchemy 2** + **Alembic** (53 migrations, `render_as_batch=True`) |
| Database | **PostgreSQL** (dev `vinaadi_dev` :5432 · test `vinaadi_test` :5433) |
| Config | **pydantic-settings**, `JOTHIDAM_` prefix, `.env` UTF-8 |
| Astronomy | **pyswisseph** / **swisseph-ffi** |
| Auth | **python-jose** (JWT HS256), **bcrypt/passlib** |
| Crypto | **cryptography** (Fernet, birth data at rest) |
| Scheduling | **APScheduler** + a Postgres advisory **leader lock** |
| PDF | **reportlab** |
| AI | **anthropic** (Ask Vinaadi) |
| Cache / rate limit | in-memory by default; **Redis** optional for multi-worker |
| Python | **3.11+** |

### 9.3 Monorepo

**pnpm 11 workspaces**: `web`, `mobile`, `packages/*`.

- `packages/shared` — typed API client (46 wrappers), tier constants, i18n strings, formatters,
  panchangam name maps, types. Consumed by both web and mobile.
- `packages/design-tokens` — `tokens.json` + a build step, plus a `DESIGN_CONSTITUTION.md`.

### 9.4 Infrastructure

Docker Compose for local: `slw-postgres` (5432), `slw-postgres-test` (5433), `slw-adminer` (8081),
`slw-mailhog` (SMTP 1025 / UI 8025). `dev.ps1` creates the venv, installs deps, runs
`alembic upgrade head` and starts uvicorn with reload.

Middleware chain, outermost first: `SecurityHeaders` → `RequestLogging` (assigns a request id
echoed back on every error) → `MaintenanceMode` → `RateLimit` → CORS. Logging is JSON-formatted.
In production, `/docs`, `/redoc` and `/openapi.json` are all disabled.

Deployment shape: single box runs scheduler in the API process behind the leader lock; a scaled
deploy sets `JOTHIDAM_RUN_SCHEDULER_IN_WEB=false` and runs `app.worker` as a dedicated scheduler,
with Redis backing the cache and rate limiter so state is shared across workers.

---

## 10. Testing, quality gates and operations

### 10.1 Test suites

| Suite | Where | Scale |
|---|---|---|
| Backend unit/integration | `tests/` (pytest) | 206 files, coverage gate `--cov-fail-under=40` |
| Golden cases | `tests/golden/` + `qa_golden_case` table | Doctrine regression |
| Reasoning | `tests/reasoning/` | Verdict/contradiction behaviour |
| Web component | `web/**/*.test.tsx` (Vitest + Testing Library + jsdom) | 76 files, 682 tests |
| E2E | `web/e2e/` (Playwright) | 12 specs |
| Visual regression | `web/tests/visual/` | Snapshots across chromium / mobile-safari / reduced-motion |
| Mobile | `mobile/__tests__` (Jest) | Includes the first screen-test project |

E2E specs cover: auth + chart flow, dashboard render pass, tab-cycle request counts (a
**performance regression test** — it asserts the dashboard does not re-fan-out requests on tab
switch), theme contrast, mobile density/order, glossary tooltip on mobile, field a11y probe,
family-charts with no vault, a CSS A/B harness, and a Nova sweep.

### 10.2 Accessibility

`@axe-core/playwright` runs as a gate. **Its real coverage is narrower than it appears** — the
gate as configured effectively checks colour contrast, so other ARIA defects can ship silently.
This is a known, recorded limitation: accessible names are asserted by hand in component tests.
A past pass found 13 of 19 controls with no accessible name, and a separate browser axe run found
42 failing nodes *after* static token math had cleared the palette. The lesson recorded in the
repo: static analysis of tokens is not a substitute for a browser run.

Practices in place: `aria-live` status announcements carrying an explicit tone (✓/⚠) rather than
the UI guessing from wording; `aria-current` on active nav; `prefers-reduced-motion` respected;
disclosure patterns (not `role="menu"`) for dropdowns so keyboard and touch both work.

### 10.3 Other gates

- **`pnpm qa:colors`** — a colour-literal ratchet with a baseline; new raw hex outside the token
  layer fails. *(Baseline is known to be stale and line-number-sensitive — see §12.)*
- **ESLint** with `--max-warnings=0`.
- **Ruff pinned to 0.15.17** to match CI, plus mypy.
- **`pnpm i18n:dashboard`** extracts a dashboard i18n catalogue for translation review.
- **`pnpm qa:phase7`** — colours + mobile touch targets + visual suite in one command.

### 10.4 Cron jobs

| Job | Schedule | Purpose |
|---|---|---|
| `daily_peyarchi_refresh` | 02:00 UTC | Refresh transit alerts for all charts |
| `daily_relationship_alert_refresh` | 02:05 UTC | Refresh synastry alerts |
| `panchangam_prewarm` | 02:10 UTC | Pre-warm panchangam cache for popular locations |
| `daily_push_cron` | hourly on the hour | Morning guidance push, per-user timezone window checked inside |

`SCHEDULED_JOBS` is one tuple consumed by both the API lifespan and the standalone worker, so the
two entry points cannot drift. Job metadata registers in every process so admin triggers work
regardless of which process owns the scheduler.

### 10.5 Database safety

A hard rule set exists because dev data is real work: dev DB (`vinaadi_dev`) is never a test
target; `conftest.py` refuses to run against it; the test DB name must contain `test` and
`JOTHIDAM_TEST_DB_RESET_ACK` must be set exactly; `run-tests-safe.ps1` backs up dev before running.
Fixtures that reset schema must use `DROP SCHEMA … CASCADE` + `CREATE SCHEMA`, because `DROP TABLE`
leaves Postgres composite/enum types behind that collide on the second reset in a session.

---

## 11. Appendix A — route and API reference

### 11.1 Dashboard routes

| Path | Renders |
|---|---|
| `/login` | Auth (login / signup / forgot / reset) + guest chart modal |
| `/dashboard` | Workspace → Today |
| `/dashboard/today` | Inbound alias → Today |
| `/dashboard/calendar` | Calendar (daily + monthly) |
| `/dashboard/family` | Family & Charts (Hybrid v2) |
| `/dashboard/goals` | Goals (goals / events / what-if / decisions) |
| `/dashboard/life-areas` | Life Areas (6 sub-tabs) |
| `/dashboard/tools` | Tool grid |
| `/dashboard/tools/{porutham \| jadhagam-generator \| annual-wrapped \| retrospective \| rasipalan \| muhurta-finder \| activity-timing \| varshaphala \| compatibility \| numerology \| baby-name-finder}` | Tool panel |
| `/dashboard/explore` | Understand (hub → list → detail) |
| `/dashboard/journal` | Journal (write / entries / reflections) |
| `/dashboard/settings` | Settings (9-section rail) |
| `/dashboard/qa` | Dev-only QA diagnostics |
| `/dashboard/glossary` | 100-term glossary *(outside the workspace group)* |
| `/dashboard/reports` | Pay-per-use purchase *(outside the workspace group)* |
| `/admin` | 11-tab admin console |

### 11.2 API surface consumed by the dashboard

All under `/api/v1`, reached through `/api/backend/…`. Cookie-authenticated routers additionally
require `X-Vinaadi-CSRF`.

**Auth & user** — `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` ·
`GET|PATCH /auth/me` · `POST /auth/forgot-password` · `POST /auth/reset-password[/request|/confirm]` ·
`GET /auth/oauth/providers` · `GET /auth/oauth/google/start` · `GET /auth/oauth/google/callback` ·
`GET /users/…`

**Profiles & charts** — `GET|POST /birth-profiles` · `GET /birth-profiles/{id}` ·
`GET /birth-profiles/me/latest` · `PATCH /birth-profiles/{id}` · `POST /charts/calculate` ·
`GET /charts/{id}` · `/summary` · `/explanation` · `/jadhagam-report` · `/event-windows` ·
`/dasha` · `/dasha/timeline` · `/chara-dasha` · `/yogini-dasha` · `/ashtottari-dasha` ·
`/kalachakra-dasha` · `/conditional-dashas` · `/solar-return` · `/varshaphala` · `/shadbala` ·
`/share-card` · **`/dashboard-bundle`**

**Daily** — `GET /charts/{id}/daily-guidance` · `/week-ahead` · `GET /daily-guidance/range` ·
`GET /daily-guidance/week-ahead` · `GET /activity-timing[/batch]` · `GET /daily-snapshot` ·
`GET /alerts/ambient` · `GET /panchangam/daily|timings|monthly`

**Life & prediction** — `GET /charts/{id}/life-areas` · `GET /charts/{id}/predictions/{marriage|career|wealth|health}` ·
`GET /charts/{id}/life-events` · `GET|POST /charts/{id}/life-event-log` ·
`GET /charts/{id}/remedy-plan` · `/gemstone-advice` · `GET /charts/{id}/annual-wrapped` ·
`POST /whatif` · `POST /decisions/brief` · `POST /prasna` · `GET|POST /retrospective`

**Transits** — `GET /charts/{id}/gochar/current` · `/sani-cycle` · `/peyarchi/upcoming` ·
`GET /transits/peyarchi-report/{id}`

**Family & relationships** — `GET|POST /family-vaults` · `GET /family-vaults/{id}[/calendar|/journal]` ·
`GET /relationships/alerts` · `GET /relationships/{memberId}/synastry|/porutham` ·
`POST /relationships/compare[-synastry]` · `POST /relationships/compare/pdf` ·
`POST /porutham-shares` · `GET /porutham-shares/{token}`

**Timing & numerology** — `GET /charts/{id}/muhurta` · `GET /muhurta` · numerology profile /
cycles / alignment / correction / naming / name-sessions (11 routes)

**Personal data** — `POST|GET /journal` · `PATCH|DELETE /journal/{id}` · `/journal/prompts` ·
`/journal/export` · `/journal/retention/apply` · `GET /journal/{chartId}/correlations` ·
`GET|POST /goals` · `DELETE /goals/{id}` · `GET|POST /context` · `GET /streak` · `POST /streak/ping`

**Settings & notifications** — `GET|PATCH /settings/ui` · `/settings/life-mode` · `/settings/journal` ·
`GET|POST /notifications` · `GET|PATCH|PUT|DELETE /notification-preferences`

**AI & feedback** — `GET /ask-vinaadi/daily-status` · `POST /charts/{id}/ask` ·
`POST|GET|PATCH /feedback` · `GET /qa/…`

**Commerce & admin** — `POST /reports/…` · `POST /webhooks/revenuecat` ·
`GET /admin/{stats,users,jobs,audit-log,flags,health/detail}` · `POST /admin/jobs/{id}/trigger` ·
`PATCH|DELETE /admin/flags/{name}` · `POST /admin/notify/broadcast` ·
`GET /admin-analytics/{daily,features,retention}`

**Places** — `GET /places/search` (bundled dataset, public) · `POST /geo/…` (external fallback)

---

## 12. Appendix B — findings, risks and recommendations

**These are my own assessments and proposals. Nothing in this section describes shipped
behaviour.** Ordered by my read of severity.

### 12.1 Correctness and contract risk

**F1 — The four-surface API contract has no automated guard, and has already drifted twice.**
`app/api/`, `packages/shared/src/api/`, `mobile/src/api/` and `web/` share route paths as
hand-typed strings. Two shared wrappers were wrong on arrival (query-param vs path-param; PATCH vs
PUT) and would have failed on first real use. The discipline is documented but enforced by grep.
*Recommendation:* generate the shared client from the FastAPI OpenAPI schema, or at minimum add a
CI job that boots the app, dumps `/openapi.json`, and asserts every path+method referenced in
`packages/shared/src/api/` exists. The field-parity guard already proves the pattern works; extend
it to path and verb. **This is the single highest-value hardening available.**

**F2 — `web/` mostly bypasses the shared client.** Direct `apiFetchJson` calls with hardcoded path
strings are the dominant pattern; the forward policy says new code must use wrappers, but nothing
enforces it. *Recommendation:* an ESLint rule banning `apiFetchJson("/api/v1/…")` string literals
outside `lib/` and the hooks layer would make the policy self-enforcing without touching
grandfathered call sites.

**F3 — The axe gate checks less than its presence implies.** Recorded in the repo: it effectively
covers colour contrast, while every other ARIA defect ships silently — and a browser run once found
42 nodes after static token math had passed. *Recommendation:* run the full axe ruleset on the
dashboard render-pass spec and ratchet the violation count down from today's actual number, rather
than leaving the gate narrow. Failing loudly at a known baseline beats passing on a subset.

### 12.2 Maintainability

**F4 — Several components are past a workable size.** `dashboard-hybrid-parts.tsx` (142 KB),
`dashboard-yoga-dosham-panel.tsx` (126 KB), `dashboard-workspace.tsx` (110 KB),
`dashboard-chart-explanation.tsx` (109 KB), `dashboard-family-charts-hybrid.tsx` (100 KB),
`dashboard-numerology-shared.tsx` (90 KB). Similarly `one_minute_reading_service.py` at 244 KB.
These are not automatically wrong — the comments show they are deliberate and well-reasoned — but
they concentrate risk, slow review, and make the keep-alive/state coupling in the workspace hard
to reason about. *Recommendation:* treat 40 KB as a soft ceiling for new files and split the top
three along the seams the section rails already imply (one module per rail section), lowest-churn
first. Do not do this as a big-bang refactor.

**F5 — The colour-literal ratchet baseline is stale and line-sensitive.** A baseline keyed to line
numbers produces false diffs on unrelated edits, which trains people to regenerate it — the
failure mode that makes a ratchet decorative. *Recommendation:* key the baseline on
`(file, literal)` pairs and counts, not line numbers, and regenerate once.

**F6 — Coverage gate is 40%.** For a product whose correctness claim *is* the calculation, that
floor is low. The golden-case suite is the real safety net, but it protects doctrine, not plumbing.
*Recommendation:* leave the global floor alone and add a per-package floor for
`app/calculations/` and `app/reasoning/` at a materially higher number. Those are pure functions —
they are the cheapest possible things to test.

### 12.3 Product and UX

**F7 — Eleven top-level destinations, six of them in a "More" overflow.** `TAB_DEFS` shows six
primary tabs (Today, Calendar, Family & Charts, Goals, Life Areas, Settings) with Tools, Understand
and QA in `MORE_TAB_DEFS`. Tools is arguably the most commercially valuable surface in the product
and it sits behind an overflow. *Recommendation:* validate this with real navigation analytics
(PostHog is already wired) before changing anything — but if Tools has meaningful traffic, promote
it and demote Settings, which is a destination people reach deliberately and rarely.

**F8 — The tier ladder has a soft middle.** Registered gets journal, streaks, push and Annual
Wrapped (no share), but no dashas beyond the current period, no synastry, no remedies. The step
from Registered to Premium is large, which is good for conversion pressure and bad for perceived
value at the free tier. *Recommendation:* consider moving one *shallow* premium feature — a
single varga, or remedies for one life area — into Registered as a taste. The pay-per-use ladder
(₹29–₹179) already gives a low-commitment path; making sure Registered users *see* what they are
missing in context, rather than as a locked card, is the higher-leverage change.

**F9 — Two nearly identical reading products.** One-Minute and Five-Minute Reading are separate
services (244 KB and 89 KB) behind separate flags. The naming rule is sound. But it is not obvious
from the dashboard when a reader should want which, and both are on by default.
*Recommendation:* make the choice explicit and single — one reading with a "go deeper" expansion —
unless analytics show they serve genuinely different sessions.

**F10 — "Understand" links out to the marketing site.** Reusing live marketing pages instead of
duplicating an encyclopedia is exactly right. But it means a signed-in user can be walked out of
the authenticated shell into a public page with a "Sign in" button. *Recommendation:* confirm
those links open in-context (modal or new tab) and that the marketing chrome recognises an
authenticated session. This is a small fix with a disproportionate effect on how finished the
product feels.

### 12.4 Operations and security

**F11 — Rate limiting and caching default to in-memory.** Exact on one worker, ~N × limit across N
workers. Correct for a single box; silently wrong on a scaled deploy if Redis is not configured.
*Recommendation:* make it a startup assertion — if `run_scheduler_in_web` is false (i.e. this is a
scaled deploy) and the backends are still `memory`, refuse to boot, exactly the way missing
production secrets already do.

**F12 — `enable_admin_data_delete` is a runtime-flippable flag.** Destructive capability behind a
toggle an admin can flip from the browser. The audit log mitigates it. *Recommendation:* require
the flag **and** a separate confirmation step server-side, and consider making this one flag
env-only rather than runtime-overridable.

**F13 — Coverage of the maintenance-mode path.** `MaintenanceModeMiddleware` is early in the chain
and driven by a flag. Worth an explicit e2e that flips the flag and asserts the dashboard degrades
to a readable page rather than a wall of failed fetches.

### 12.5 Documentation

**F14 — 110+ docs, no index of current truth.** `docs/INDEX.md` exists, but the corpus is mostly
dated audits, and the memory record explicitly warns that "still open" notes go stale — three of
four checked items in one recent pass were already shipped. *Recommendation:* adopt one rule —
**every audit doc gets a status line at the top (OPEN / SUPERSEDED BY <file> / CLOSED <commit>)**,
updated when the work lands. These two reference documents can then be the stable entry point and
the audits become history rather than a trap.

---

*Prepared 2026-08-25 against branch `harden/production-readiness`. Every factual claim above was
read from the source on that branch; §12 is analysis, not description.*
