# Page Inventory — Web · Dashboard (logged-in app) & Auth

The dashboard (`/dashboard`) is a **single-page app** rendered by `dashboard-workspace.tsx` (state hub; owns ~43 API fetches via hooks `usePersonalData`/`useFamilyData`/`usePlanData`/`useJournalData`/`useSession`). `robots: noindex`. There are also 6 standalone `/dashboard/*` deep-link pages that mirror tab features.

---

## THEME MODEL — two user-selectable UI variants (document BOTH)

The dashboard ships **two themes the user chooses between**, controlled in **Settings → Session → "Look"** via `useUiVariant` (`hooks/useUiVariant.ts`, persisted in `localStorage["vinaadi-ui-variant"]`, applied as `data-ui` attribute on `<html>`):

| Variant | Default? | Appearance behavior | Copy shown in settings |
|---|---|---|---|
| **Classic** | ✅ Yes (hook default is `"classic"`) | Respects the separate **Appearance** setting (System / Light / Dark) via `useTheme` | "Classic is the familiar look." |
| **Nova** | opt-in | **Always dark** — disables the Appearance toggle (greyed at opacity 0.4, `pointerEvents:none`) with note "Nova is always dark — this setting doesn't apply." | "Nova is a new dark theme — it's always dark, regardless of the Appearance setting below." |

Two independent settings cards in the session tab:
- **Look** → pill buttons: `Classic` · `Nova`.
- **Appearance** → pill buttons: `System` · `Light` · `Dark` (active only in Classic).

**Implementation:** every primary tab has a **Classic component** and a **Nova component**, gated by `uiVariant === "nova"` in the workspace. **Feature set + data + API calls are the same across both variants — only layout, presentation, and the always-dark styling differ.** The tables below list both components per tab.

---

## SHELL — Auth `/login`
- **Purpose:** Single page, 4 modes: **login / signup / forgot / reset** (`?mode=signup` deep-link; reset consumes a token).
- **Inputs:** Email; Password (show/hide + strength validation on signup/reset); Confirm password (signup/reset); reset token (URL).
- **Outputs:** Mode tabs (Login/Sign up); form; password-strength meter; success states; marketing left panel.
- **Buttons:** Submit (per mode); tab switch; show/hide password; "Forgot password?" (login); "Back to sign in" (forgot/reset).
- **Actions/API:** `POST /auth/register`, `POST /auth/login` (+ `GET /birth-profiles/me/latest` to route post-login), `POST /auth/forgot-password`, `POST /auth/reset-password/confirm`. Fires `track("onboarding_step_completed")`.
- **Theme:** Not part of the dashboard variant system (own `login/layout.tsx`).

## SHELL — Dashboard chrome (persistent, both themes)
- **DashboardHero** (`dashboard-hero.tsx`): top header — tab context, **date picker** (drives `selectedDate`), **language toggle** (TA/EN), profile/member context.
- **DashboardLeftRail** (`dashboard-left-rail.tsx`): 5 rails — Today · Panchangam · Family · Tools · Explore (Explore highlights on any depth tab: transits/plan/life-areas/journal/explore). Collapsible. `uiVariant` passed in for styling.
- **Ask Vinaadi** (`DashboardAskVinaadiWidget`): floating bottom-right button → AI chat drawer (Claude, `POST /ask-vinaadi`). Both themes.
- **Modals (dynamic):** Feedback, Edit member, Edit profile, Guest chart, Learn article, Life-mode picker, Prasna.
- **Setup/Settings:** `DashboardSetupTab` (birth-profile create/edit) when no profile; `settings` tab has `setup` + `session` sub-tabs. The theme switch lives in `session`.

---

## TABS — Classic vs Nova component per tab

| Tab (rail id) | Classic component | Nova component | Shared feature set |
|---|---|---|---|
| **Today** (`personal`) | `dashboard-personal-tab.tsx` (via `dashboard-today-tab.tsx` re-export) | `dashboard-today-tab-nova.tsx` | Score, dasha, transits, panchangam, emotional weather, nakshatra, journal insight, life areas, alerts |
| **Panchangam** (`calendar`) | `dashboard-calendar-tab.tsx` (`CalendarTab`) | `dashboard-calendar-tab-nova.tsx` + `dashboard-calendar-monthly-nova.tsx` | Daily/weekly panchangam, week-ahead, monthly calendar, 3-day range |
| **Family** (`family`) | `dashboard-family-tab.tsx` | `dashboard-family-tab-nova.tsx` + `dashboard-family-member-nova.tsx` | Vault, member cards, aggregate, synastry |
| **Tools** (`tools`) | inline classic tools view (`cd-tools` markup in workspace) | `dashboard-tools-tab-nova.tsx` | Porutham, chart-gen, wrapped, retrospective, rasipalan |
| **Explore** (`explore`) | `dashboard-explore-tab.tsx` (simple nav) | `dashboard-explore-tab-nova.tsx` (+ nakshatram/dosham/guide/learn nova sub-views) | Hub → depth tabs + reference content |
| **Plan** (`plan`) | `dashboard-plan-tab.tsx` | `dashboard-plan-tab-nova.tsx` | Life event log, transits, what-if, muhurta, decisions |
| **Life Areas** (`life-areas`) | `dashboard-life-areas-tab.tsx` | `dashboard-life-areas-tab-nova.tsx` | 12 areas: predictions, yoga/dosham, jadhagam report, remedies, event windows |
| **Journal** (`journal`) | `dashboard-journal-tab.tsx` | `dashboard-journal-tab-nova.tsx` | Context events, write panel, entries, shadow prompts, correlations |
| **Transits** (`transits`) | `dashboard-transits-tab.tsx` (**shared — single component both themes**) | (same) | Gochar, major transits, Sani cycle, peyarchi |
| **Settings** (`settings`) | `dashboard-setup-tab.tsx` + `dashboard-settings-session-tab.tsx` (**shared**) | (same) | Profile, notifications, **theme switch**, journal retention, logout |
| **QA** (`qa`, dev only) | `dashboard-qa-tab.tsx` (**shared**) | (same) | Validate / regression report |

---

## TAB DETAIL (feature-level; applies to both Classic & Nova unless noted)

### Today (`personal`)
- **Purpose:** Daily check-in — the core loop.
- **Classic layout:** single-scroll, 7 sections in fixed order — score hero → life areas → cosmic alert → best window → journal → rasi palan → upcoming events.
- **Nova layout:** `NovaScoreDial` (/100 + band) → Today ribbon (panchangam) → "Decide" panel → Anticipation row → Glance row → Planets surface → Nakshatra card → **Classical Timing** (collapsible: Jaimini Chara Dasha, Annual/Tajaka) → Chart Explanation → **Vargas / Shadbala / Yogini / Ashtottari / Kalachakra** panels → streak.
- **Inputs:** selected date, birthProfileId, personal guidance/chart/dasha/transit/panchangam (from `usePersonalData`).
- **Actions:** score→detail scroll, download jadhagam PDF, expand collapsibles, go-to-calendar/family/journal, open Prasna, streak.
- **API:** `/charts/{id}/*`, `/daily-guidance/*`, `/panchangam/daily`, `useStreak`.

### Panchangam (`calendar`)
- **Purpose:** Personal panchangam + week-ahead + monthly calendar.
- **Outputs:** daily panchangam detail (tithi/nakshatra/yoga/karana/kalam/hora/sunrise-sunset), 7-day week-ahead digest (best day, Chandrashtama flags), monthly calendar, 3-day range.
- **API:** `/panchangam/daily`, `/daily-guidance/week-ahead`, `/daily-guidance/range`.

### Family (`family`)
- **Purpose:** Family vault — members' charts, aggregate, compatibility.
- **Outputs:** family aggregate score, member cards (per-member score + expand), Synastry panel, add/edit member.
- **API:** `/family-vaults`, `/family-vaults/{id}/daily-aggregate`, `/family-vaults/{id}/members`, `/relationships/{id}/synastry` (`useFamilyData`).

### Tools (`tools`)
- **Purpose:** Launcher (card grid → opens a tool view). Both variants share the same `TOOL_LIST`.
- **Tool cards:** 01 Porutham/Compatibility (10 poruthams, Rajju/Vedhai, D1, PDF); 02 Generate Chart (D1/D9 print-ready); 03 Annual Wrapped; 04 Retrospective (past-event vs dasha/transit); (Rasipalan). Cards disabled when no birth profile. (Birth-time rectification removed — "results unreliable".)

### Explore (`explore`)
- **Purpose:** In-dashboard hub of educational/reference content + entry to depth tabs.
- **Classic:** thin nav component (`onNavigate`). **Nova:** richer sub-views — Nakshatram / Dosham / Guide / Learn nova panels.

### Plan (`plan`) — depth tab
- **Panels:** Life Event Log (~30 event types), Transits view, What-If, Muhurta (+ picker), Decisions (option A vs B), Muhurtham Naal, Event Windows.
- **API:** `/whatif`, `/muhurta`, `/decisions/brief`, `/life-events`, `/activity-timing`, transit endpoints.

### Life Areas (`life-areas`) — depth tab
- **Panels:** Predictions, Yoga/Dosham, Jadhagam Report, Remedies, Event Windows. Age/marital-status/life-stage filtering (`isAreaRelevantForAge`).
- **API:** `/charts/{id}/life-areas`, `/predictions`, `/remedies`.

### Transits (`transits`) — depth tab (single shared component)
- Gochar snapshot, major transits, Sani cycle, peyarchi. `/charts/{id}/transits/major`, `/gochar/current`, `/sani-cycle`, `/peyarchi/upcoming`, `/transits/peyarchi-report/{id}`.

### Journal (`journal`) — depth tab
- **Panels:** context events register, AI-prompted write panel (life-area picker + date), entries list (archive), shadow-work prompts, journal insight/correlations.
- **API:** `POST/GET/DELETE /journal`, `/journal/prompts`, `/journal/{id}/correlations`, `POST /context`.

### Settings (`settings`: `setup` + `session`) — shared component both themes
- **setup:** birth-profile management (create/edit, place combobox). `/birth-profiles`.
- **session:** **Theme controls (Look = Classic/Nova, Appearance = System/Light/Dark)**, notification prefs (channel / morning alert / smart silence), language, journal retention, logout. `/settings/notifications`, `/settings/journal`, `/settings/ui`, `/auth/logout`.

---

## STANDALONE DASHBOARD PAGES (`/dashboard/*` — deep-linkable, mirror tab features)
> These render their own layout and are **not** wrapped in the tab/variant system (they read language from `localStorage`/`/settings/ui`; they do not switch on Classic/Nova).

| Route | Purpose | Inputs | Outputs | Key API |
|---|---|---|---|---|
| `/dashboard/daily-score` | Full daily-score breakdown | date, profile | ScoreRing + 6 weighted signals (moonTransit 28, gochar 24, dasha 19, panchangam 14, cautions 9, remedial 6) w/ descriptions | `/charts/{id}/daily-guidance` |
| `/dashboard/goals` | Manage life goals | goal type (10) + description | goal list, add/toggle/delete | `/goals` |
| `/dashboard/porutham` | Standalone porutham calculator | two profiles/stars | 10-porutham result | `/relationships` / porutham |
| `/dashboard/reports` | **Pay-per-use store** | product select | Jadhagam reports, Porutham reports, Ask-Vinaadi top-up; buy → queued | PPU products (`@vinaadi/shared`) |
| `/dashboard/wrapped` | Annual "Wrapped" slideshow | year (prev) | slides + share card | `/charts/{id}/annual-wrapped` |
| `/dashboard/chart-generate` | Standalone chart generator (796 lines) | full birth form | D1/D9 + planet table + PDF | `/charts/calculate` |
