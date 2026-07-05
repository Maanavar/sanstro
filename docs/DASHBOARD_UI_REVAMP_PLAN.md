# Dashboard UI/UX Revamp — Master Plan & Progress Log

> **Status:** 🟡 Phase 1 (Today tab) signed off. Phase 2 (`cal-panch`, daily Panchangam view) signed off. Phase 3 (`cal-monthly`, monthly grid) pulled forward and built in the same session after Phase 2 sign-off surfaced Classic-styled colors leaking through the Monthly toggle — awaiting visual sign-off. Design direction is now the "Nova" look (see [§2](#2-design-source)), an **additive** third theme, not a brand pivot.
> **Last updated:** 2026-07-05
> **Owner:** senthilkumarsivaraman
> **How to use this file:** This is the single source of truth for this initiative. Any coding agent (Claude Code, a subagent, a human) picking up this work at any point should read this entire file before writing code. Update the **Progress Log** at the bottom every time you complete a step, make a decision, or hit a blocker — dated entries, most recent last. Do not start implementation on a screen until its row in the [Gap & Mapping Table](#gap--mapping-table) is filled in and, per the working style below, cosmetic ambiguity is either resolved or explicitly deferred.

---

## 0. Scope (confirmed 2026-07-05)

The Vinaadi codebase has three distinct surfaces. **This initiative touches #2 only.**

| # | Surface | In scope? | Root |
|---|---------|-----------|------|
| 1 | Marketing / public site pages (SEO landing pages, tools, learn, temples, natchathiram, dosham, pariharam, pricing, etc.) | ❌ Out of scope | `web/app/**` (everything using `PublicNav`/`PublicFooter`/`clarity-shell`, e.g. `web/app/family/page.tsx` is a **marketing** page, not the real Family feature) |
| 2 | **Dashboard — signed-in user pages** | ✅ **In scope** | `web/app/dashboard/**`, `web/components/dashboard-*.tsx`, `web/hooks/*` that feed them |
| 3 | Mobile app | ❌ Out of scope | `mobile/**` |

Corollary: `packages/design-tokens/` is **shared** between web and mobile (`dist/web/tokens.css` and `dist/mobile/tokens.ts` are both built from the same `tokens.json`). Any token change made for this revamp must not visually regress mobile — prefer **additive new tokens** over redefining existing ones, unless a token rename/removal is explicitly approved (check `mobile/` usage before removing any token). Same caution applies to `web/components/dashboard-ui.tsx` if anything in it is imported outside the dashboard.

The admin console (`web/app/admin`, `web/components/admin-console.tsx`) is a separate internal tool, not part of the end-user dashboard — **treat as out of scope unless the user says otherwise.**

---

## 1. Mission (verbatim from the originating directive)

Act as a senior product team of one: **world-class Product Designer + UX/UI Architect + Software Architect + Full-Stack Developer + UI Developer**, revamping the signed-in dashboard end-to-end to match a new design direction, while preserving and correctly wiring up every existing functionality — including features that exist only in the new designs and are not yet coded.

**Product context:** Vinaadi, a Tamil Vedic astrology (Jothidam) platform. Core domains: birth chart generation (Swiss Ephemeris + Lahiri Ayanamsa), Panchangam, Dasha-Gochara-Ashtakavarga timing, varga charts, Jaimini methodology, nakshatra/porutham marriage compatibility, family dashboard, Prashna, Muhurtham.

**Design direction:** Tamil palm-leaf and kolam aesthetic — kolam-dot day-arc SVG, normalized signal bars, unified Panchangam ribbon, bookmark-style member tabs, a three-font system (Fraunces / Inter / IBM Plex Mono), new colors. These new designs are **visual/interaction specs only** — some implied functionality does not exist in code yet.

### Non-negotiable principles

1. **All ages, all literacy levels.** Target user ranges from a tech-savvy 20-something to a grandparent checking a Panchangam. Every screen: legible, low-jargon (or jargon explained inline), high-contrast, large tap targets, forgiving of mis-taps. Never sacrifice clarity for aesthetic minimalism.
2. **Homepage (dashboard Today tab) must be genuinely useful, not just pretty.** Surface real, live, relevant info at a glance (today's Panchangam, active Dasha period, upcoming significant transits/events, family member quick-status) — not just navigation tiles.
3. **No functionality regression.** Every calculation, data flow, and interaction that exists today must survive the revamp, even if its old UI is deleted.
4. **No functionality left unimplemented.** Every interaction/feature implied by the new designs (even if only sketched in a mockup) must be either fully implemented or explicitly flagged as a stub with a TODO and a clear reason.
5. **Preserve the calculation engine untouched unless asked.** Swiss Ephemeris / Lahiri Ayanamsa / Panchangam / Dasha logic is domain-sensitive and previously hand-verified (see memory: `feedback_astrology_calc_accuracy`, `project_thirukanitham_audit_2026-07`) — do not refactor astrological calculation logic while doing a visual revamp unless a UI change requires a data-shape change.

### Working style

- Work incrementally, **screen by screen** — never a single giant rewrite.
- Pause and ask when: an astrological calculation's correctness is ambiguous, a new design implies data that doesn't exist yet, or a UI pattern could be read two different ways.
- Otherwise, use good default judgment and keep moving — don't block on cosmetic decisions.

---

## 2. Design source

**Resolved 2026-07-05 — access was unblocked manually, not via `DesignSync`.** `DesignSync.get_project` still requires interactive `/design-login`, unavailable in this environment. Instead, the user downloaded the Claude Design project's HTML exports directly and placed them at:

```
D:\sanstro\Astrology App Dashboard Redesign\
```

**This folder is gitignored (`.gitignore`) and must never be committed or referenced by path from shipped code.** Treat it as read-only reference; extract values into real tokens/components, don't import from it.

Contents, in order of authority:
- **`Vinaadi Prototype.dc.html`** — **the primary, latest, most-complete mockup.** 10 static screens as sibling `data-screen` blocks: `today`, `cal-panch` (Panchangam detail), `cal-monthly` (Calendar), `family`, `family-member` (Jathagam detail), `explore` (hub), `explore-moolam` (Nakshatram profile), `explore-sevvai` (Dosham detail), `tools` (hub), `tools-porutham` (result). One shared top-bar + context-strip chrome, **no left sidebar** — build against this file.
- **`Design Tokens.dc.html`** — full token sheet for the same look: colors, type scale, spacing, radius, border-alpha steps, component patterns (chips, buttons, data-label pattern).
- **`Dashboard Redesign.dc.html`** — an earlier design-review iteration. 8 of its screens are verbatim-identical to Vinaadi Prototype (confirms those are final). Has 2 extra, superseded Today variants with features later dropped (a "9/10 signals agree" confidence tile, a "next 3 days" trend strip, an inlined best-dates card). **Historical reference only — do not resurrect these unless asked.**
- **`design_handoff_dashboard_revamp/README.md` + `dashboard-2a.html`** — an earlier, more detailed prose spec for just the Today screen; superseded by Vinaadi Prototype's `today` screen but useful prose cross-reference for interaction notes.

The look itself is branded **"Nova"** internally (implementation naming, see `useUiVariant.ts`) — a single fixed dark ("dark astronomical") theme: deep plum backgrounds (`#221a2c`/`#2c2338`/`#2e2440`), cream text (`#f3ecdd`), gold accent (`#d4af5f`/`#e7c87e`), Cormorant Garamond (display) / Source Serif 4 (prose) / system-ui (nav/labels/data) / Noto Sans Tamil (script, already loaded app-wide).

### Blockers — both resolved 2026-07-05

1. ~~Design content not readable via `DesignSync`~~ — resolved via manual download (see above), not via "Send to Claude Code Web" as originally planned.
2. ~~Font-system / brand-language conflict~~ — resolved: **Nova is an additive third look, not a v2 revision or brand pivot.** The existing `packages/design-tokens/DESIGN_CONSTITUTION.md` ("Warm Cosmic Minimalism": Playfair Display/Inter/JetBrains Mono) is **untouched** — that's "Classic," selectable via a new Look toggle in Settings (Classic/Nova), separate from the existing Light/Dark/System toggle. Nova's tokens live in a new web-only file (`web/app/dashboard/dashboard-nova.css`), not in the shared `packages/design-tokens` package — see Progress Log 2026-07-05 for why (no light/dark pairing to derive, mobile is out of scope, `build.js` has no generic per-key emission).

**New decision, also 2026-07-05:** the existing unshipped `/dashboard/v2` Today-tab preview (see [§4.6](#note-existing-v2-preview)) is **retired**, superseded by Nova's Today screen — not kept as a third parallel look.

---

## 3. Design Inventory

*Screen-by-screen inventory of `Vinaadi Prototype.dc.html`, confirmed 2026-07-05 (sections, data fields, colors, and which existing dashboard component/hook each maps to). Full detail lives in the Phase 1 section of the implementation plan; summary here for quick reference.*

| # | `data-screen` | Maps to existing tab/route |
|---|---|---|
| 1 | `today` | `personal` tab — `dashboard-personal-tab.tsx` + `dashboard-personal-hero.tsx` + `dashboard-personal-overview.tsx` |
| 2 | `cal-panch` | `calendar` tab, daily view — `dashboard-calendar-tab.tsx` |
| 3 | `cal-monthly` | `calendar` tab, monthly view — `dashboard-calendar-tab.tsx` |
| 4 | `family` | `family` tab — `dashboard-family-tab.tsx` (incl. existing Synastry Matrix/Panel for "family bonds") |
| 5 | `family-member` | Family member detail / Jathagam — `dashboard-jadhagam-report-panel.tsx`, `dashboard-vargas-panel.tsx` |
| 6 | `explore` | `explore` tab, hub — `dashboard-explore-tab.tsx` |
| 7 | `explore-moolam` | Explore → Nakshatram profile detail (new shared detail-page shell, generalizing `dashboard-personal-overview.tsx`'s Nakshatra card + `dashboard-yoga-dosham-panel.tsx`) |
| 8 | `explore-sevvai` | Explore → Dosham profile detail (same shared shell as above) |
| 9 | `tools` | `tools` tab, hub — `tool-card.tsx`/`tools-grid.tsx` |
| 10 | `tools-porutham` | Porutham result — `porutham-panel.tsx`/`friendship-result-card.tsx` |

### 3.1 Coverage policy — superseded 2026-07-05

Earlier assumption (2026-07-05, same day) was that the mockup only covered a partial subset. Once `Vinaadi Prototype.dc.html` was actually read in full, it turned out to cover all 10 of the dashboard's main screens/tabs (table above) — coverage is effectively complete, not partial. The extrapolation policy below is kept for any screen/sub-view genuinely outside those 10 (e.g. a settings sub-page), but in practice almost everything has a direct mockup source now:

1. **Explicitly-designed screens** (the 10 above) get built exactly to spec, adapted to real data per the Phase 1 mapping table.
2. **Anything left over with no mockup** still gets revamped by extrapolating Nova's established tokens/primitives (`dashboard-nova.css`, `dashboard-ui-nova.tsx`) rather than being left in Classic or invented independently.
3. Where extrapolation requires a judgment call, follow the working style: keep moving for cosmetic-only calls, ask when it's ambiguous enough that two reasonable people would build it differently or implies data/functionality that doesn't exist yet.

---

## 4. Current Codebase Map — Dashboard (Scope #2)

### 4.1 Routes

| Route | File | Purpose |
|---|---|---|
| `/dashboard` | `web/app/dashboard/page.tsx` → `<DashboardWorkspace />` | Main tabbed workspace (see §4.2) |
| `/dashboard/v2` | `web/app/dashboard/v2/page.tsx` | **Existing in-flight redesign preview** of the Today tab only — see [project_dashboard_v2_redesign memory](#note-existing-v2-preview) below. Renders `<DashboardWorkspace todayVariant="v2" />` + `dashboard-today-tab-v2.tsx` + `today-v2.css` (`.t2-*` classes). Awaiting user sign-off as of 2026-07-02. |
| `/dashboard/chart-generate` | `web/app/dashboard/chart-generate/` | Chart generation flow |
| `/dashboard/daily-score` | `web/app/dashboard/daily-score/` | Daily score detail |
| `/dashboard/goals` | `web/app/dashboard/goals/` | Life-goals feature |
| `/dashboard/porutham` | `web/app/dashboard/porutham/` | Marriage compatibility tool (dashboard-embedded variant) |
| `/dashboard/reports` | `web/app/dashboard/reports/` | Paid report purchase/delivery |
| `/dashboard/wrapped` | `web/app/dashboard/wrapped/` | Annual "Wrapped"-style recap |

`web/app/dashboard/layout.tsx` just sets metadata (title, `robots: noindex`) — no shared chrome there; all chrome lives in `DashboardWorkspace`.

### 4.2 Primary navigation (from `web/components/dashboard-left-rail.tsx`)

The left rail defines these top-level tabs (type `Tab` in that file):

```
personal | calendar | family | tools | explore | settings
(+ hidden: onboarding, qa [dev-only, NODE_ENV !== "production"])
```

Rail order: **Today** (personal) → **Panchangam** (calendar) → **Family** → **Tools** → **Explore** (an umbrella that lights up for `transits | plan | life-areas | journal | explore`) → *(spacer)* → **Reports** link (`/dashboard/reports`) → **Settings** (pinned bottom).

### 4.3 Component inventory (`web/components/dashboard-*.tsx` + supporting)

First-pass grouping by likely tab, from file naming and the orchestrator's dynamic imports in `dashboard-workspace.tsx`. **Not yet individually verified — verify per-screen during the screen-by-screen build, per working style.**

| Tab / Area | Components (file names, `.tsx` implied) |
|---|---|
| Shell / shared | `dashboard-workspace.tsx` (orchestrator + state), `dashboard-hero.tsx`, `dashboard-left-rail.tsx`, `dashboard-ui.tsx` (shared primitives — likely the closest thing to an existing component library for this surface), `life-mode-picker.tsx`, `member-chip.tsx`, `mode-badge.tsx`, `day-strip.tsx`, `icons.tsx`, `dashboard-ask-vinaadi.tsx` / `dashboard-ask-vinaadi-widget.tsx` (AI chat, likely global) |
| Today / Personal (`personal`) | `dashboard-today-tab.tsx`, `dashboard-today-tab-v2.tsx` (preview — **to be deleted**, see §4.6), `dashboard-personal-tab.tsx`, `dashboard-personal-hero.tsx`, `dashboard-personal-overview.tsx`, `dashboard-daily-snapshot.tsx`, `dashboard-activity-timing-card.tsx`, `dashboard-retrospective-panel.tsx` — **corrected 2026-07-05:** `dashboard-decision-panel.tsx`/`dashboard-event-windows.tsx` actually belong to the Plan tab, `dashboard-prediction-panel.tsx`/`dashboard-remedies-panel.tsx`/`dashboard-shadow-prompts.tsx` actually belong to Life-areas/Journal tabs — moved below, were mis-grouped here |
| Panchangam (`calendar`) | `dashboard-calendar-tab.tsx`, `panchangam-date-picker.tsx`, `panchangam-share-card.tsx` |
| Family (`family`) | `dashboard-family-tab.tsx`, `dashboard-edit-member-modal.tsx`, `dashboard-edit-profile-modal.tsx`, `birth-profiles-manager.tsx`, `dashboard-guest-chart-modal.tsx` |
| Tools (`tools`) | `dashboard-muhurta-picker.tsx`, `dashboard-muhurtham-naal.tsx`, `dashboard-prasna-widget.tsx`, `dashboard-rectification-wizard.tsx`, `chart-generate-inline-panel.tsx`, `porutham-panel.tsx`, `friendship-result-card.tsx` |
| Explore umbrella: Transits | `dashboard-transits-tab.tsx` |
| Explore umbrella: Plan | `dashboard-plan-tab.tsx` (uses `usePlanData` hook), `dashboard-decision-panel.tsx`, `dashboard-event-windows.tsx` |
| Explore umbrella: Life Areas | `dashboard-life-areas-tab.tsx`, `life-area-card.tsx`, `dashboard-life-event-log.tsx`, `dashboard-life-events.tsx`, `dashboard-prediction-panel.tsx`, `dashboard-remedies-panel.tsx` |
| Explore umbrella: Journal | `dashboard-journal-tab.tsx` (uses `useJournalData` hook), `dashboard-shadow-prompts.tsx` |
| Explore umbrella: Explore | `dashboard-explore-tab.tsx` |
| Chart / deep-dive detail (surfaced from Today + reports) | `dashboard-charts.tsx`, `dashboard-chart-explanation.tsx`, `dashboard-vargas-panel.tsx`, `dashboard-dasha.tsx`, `dashboard-ashtottari-dasha-panel.tsx`, `dashboard-kalachakra-dasha-panel.tsx`, `dashboard-yogini-dasha-panel.tsx`, `dashboard-shadbala-panel.tsx`, `dashboard-yoga-dosham-panel.tsx`, `dashboard-synastry-panel.tsx`, `synastry-matrix.tsx`, `dashboard-varshaphala-panel.tsx`, `dashboard-jadhagam-report-panel.tsx`, `astro-symbols.tsx`, `thirukanitham-badge.tsx` |
| Annual Wrapped (`/dashboard/wrapped`) | `dashboard-annual-wrapped.tsx`, `wrapped-share-card.tsx` |
| Setup / onboarding (`onboarding`) | `dashboard-setup-tab.tsx` |
| Settings (`settings`) | `dashboard-settings-session-tab.tsx` |
| QA (dev-only) | `dashboard-qa-tab.tsx` |
| Sharing (cross-cutting) | `dashboard-share-card.tsx`, `panchangam-share-card.tsx`, `wrapped-share-card.tsx` |
| Feedback | `dashboard-feedback-modal.tsx` (+ `.css`) |
| Misc shared UI (used across tabs, not dashboard-prefixed) | `collapsible-section.tsx`, `drawer-panel.tsx`, `place-combobox.tsx`, `guide-cards.tsx`, `guide-detail-page.tsx`, `guide-traditional-notes.tsx`, `tool-card.tsx`, `tools-grid.tsx` |

### 4.4 Data hooks (`web/hooks/*`)

| Hook | Feeds |
|---|---|
| `useSession.ts` | Auth/session state |
| `usePersonalData.ts` | Today/Personal tab |
| `useFamilyData.ts` | Family tab (exports `MemberChart` type) |
| `usePlanData.ts` | Plan tab |
| `useJournalData.ts` | Journal tab |
| `useMonthlyPanchangam.ts` | Panchangam/calendar tab |
| `useBirthProfileForm.ts` | Chart generation / profile edit flows |
| `useGuestStore.ts` | Guest (pre-signup) chart state |
| `useStreak.ts` | Streak/gamification indicator |
| `useTheme.ts` | Light/dark theme |

### 4.5 Styling

- `web/app/dashboard/dashboard.css` — main dashboard stylesheet
- `web/app/dashboard/v2/today-v2.css` — the in-flight Today-tab-v2 preview, scoped `.t2-*`
- Tokens: `packages/design-tokens/tokens.json` → built to `packages/design-tokens/dist/web/tokens.css` (imported in `web/app/layout.tsx`) and `dist/mobile/tokens.ts`. Regenerate via `node packages/design-tokens/build.js`.
- `web/app/globals.css` — web-specific extensions layered on top of the generated tokens (score colors, planet colors, chart-cell states, panel/parchment tints). Comment at top of file: *"No hardcoded hex... only web-specific, non-token values belong here."*

### <a name="note-existing-v2-preview"></a>4.6 Note: an existing redesign is already mid-flight — retired 2026-07-05

Per memory `project_dashboard_v2_redesign` (2026-07-02): a "daily briefing" redesign of the Today tab was already built as an A/B preview at `/dashboard/v2`, with 3 altitude bands (Briefing → Your world → Deep dive) and its own `.t2-*` CSS. **Decided 2026-07-05: retired, superseded by Nova's Today screen** (Nova covers Today plus 9 more screens with one coherent design system — no reason to keep 3 parallel looks). Removal sequence (last step of Phase 1, after Nova's Today is signed off, kept live until then as a fallback comparison): delete `web/app/dashboard/v2/page.tsx`, `web/components/dashboard-today-tab-v2.tsx`, `web/app/dashboard/v2/today-v2.css`, and the `todayVariant` prop path (`dashboard-workspace.tsx:252,1243,1321,1367` — default `"classic"`, only other value `"v2"`).

---

## 5. Process

1. **Audit** (this document, in progress) — Functionality Inventory (§4 above) + Design Inventory (§3, blocked) + Gap & Mapping Table (§6). Present back for confirmation before implementation, unless told to proceed straight to build.
2. **Design System Extraction** — resolve the font/brand conflict (§2 blocker 2), then extend `packages/design-tokens` (additively) with: confirmed typography scale, color tokens (respecting kolam/palm-leaf identity), spacing/radius/shadow/motion tokens, and core primitives (cards, bookmark-style member tabs, ribbons, gauges/signal bars, day-arc SVG component) as reusable components in `web/components/dashboard-ui.tsx` or a new shared primitives module — not one-off inline styles.
3. **Component & Screen Rebuild**, in order:
   1. Design tokens + shared primitives
   2. Screens, sequenced by whatever the Design Inventory turns out to contain (Today tab first is the likely default, given the existing `/dashboard/v2` head start — confirm against the mockup).
   
   For each screen: (a) what's reused from old code as-is (logic/data only, re-skinned), (b) what's net-new UI, (c) what's net-new functionality requiring new state/data/API work, (d) accessibility check (contrast, tap target size, screen-reader labels, keyboard nav).
4. **Implementation standards:** typed components, accessible (semantic HTML/ARIA), responsive (mobile-first web layout, not to be confused with the separate native mobile app which is out of scope). Reuse existing data-fetching/business logic; loading + empty states on every data-driven component (astro calcs can be slow — never a blank screen). If a new design implies a feature with no backend yet (e.g. a "signal bar" needing an uncomputed score), stub it clearly, propose the simplest correct calculation or data source, and **ask before inventing astrological logic**. Comment non-obvious astrological UI decisions (e.g. why a dosha shows a specific severity color).
5. **Verification** — after each screen: run the app, visually diff against the design reference, confirm every relevant Functionality Inventory item still works, confirm every relevant Design Inventory item is implemented or explicitly flagged as a pending stub with a reason. End with a changelog: ported as-is / rebuilt / net-new / stub.

Cross-cutting reminder from `CLAUDE.md`: routes, query params, and response shapes are a shared contract across `app/api/`, `packages/shared/src/api/`, `mobile/src/api/`, and `web/`. `web/` mostly bypasses the shared client today (direct `apiFetchJson(...)` calls) — that's grandfathered; don't add new bypass call sites going forward. If this revamp touches any endpoint the mobile app also calls, update all four locations in the same change.

---

## 6. Gap & Mapping Table

*Populated 2026-07-05 for Phase 1 (Today tab). Remaining screens (Phase 2+) will be populated as each is built — see the implementation plan's Phase 2+ section for the named build sequence.*

| Mockup section (Today) | Existing component/hook | Net-new work | Status |
|---|---|---|---|
| Greeting hero + score dial | `dashboard-personal-hero.tsx` data (`personalDailyGuidance`) + `NovaScoreDial` | `dashboard-today-tab-nova.tsx` section 1 | **Built** |
| Panchangam band | `personalDailyGuidance`/`panchangam` data, same fields as classic's `CollapsibleSection` | `dashboard-today-tab-nova.tsx` section 2 | **Built** |
| One-focus + remedy | `personalDailyGuidance.actionSuggestion` + `.remedy` (same source as `dashboard-daily-snapshot.tsx`/`dashboard-personal-overview.tsx`) | `dashboard-today-tab-nova.tsx` section 3 — merged into one row per the note below | **Built** — "Add to my day" and remedy "✓ Done" omitted, no backing feature exists for either (see Progress Log) |
| Day timeline ribbon | `panchangam.kalam.rahuKalam` + `.nallaNeram[]` | `dashboard-today-ribbon-nova.tsx` — new segmented-bar visual (real data, dynamic range/segment count, not hardcoded) | **Built** |
| Ask + decide | Resolved 2026-07-05: user chose to add a small backend field over downgrading the UI or stubbing it (see Progress Log) | `dashboard-today-decide-nova.tsx` — Ask Vinaadi teaser (opens the existing FAB, doesn't duplicate its chat) + a 4-activity Decide grid backed by a new additive `dateResult` field on `/api/v1/activity-timing` | **Built** |
| Anticipation row | `peyarchiUpcoming[]`, `personalSani`, `weekAhead` | `dashboard-today-glance-nova.tsx` (`DashboardTodayAnticipationRowNova`) | **Built** — mockup's "Chandrashtama · in 6 days" forward-countdown chip omitted, no such calculation exists (only "is it active today," not "days until next occurrence") |
| Glance row | `familyAggregate`, `personalChartSummary`/`dasha`/`dashaAntar`, `lifeAreas` | `dashboard-today-glance-nova.tsx` (`DashboardTodayGlanceRowNova`) | **Built** |
| Deep-dive teaser | Existing detail panels reused verbatim, wrapped in `collapsible-section.tsx` | `dashboard-today-tab-nova.tsx` section 8 | **Built**, bounded scope — see Progress Log for what's deliberately not yet folded in |
| Porutham "Dasa sandhi" / "Papasamyam" cross-checks (Phase 2, screen 10) | — | **Genuine stub** — no existing calculation found anywhere in the codebase | Flag with TODO, do not invent the astrological logic |

Already-existing features confirmed during research — **treat as re-skins, not stubs**: the "4 free questions today" meter (`dashboard-ask-vinaadi-widget.tsx`, backed by `/api/v1/ask-vinaadi/daily-status`), family "bonds" pairwise compatibility (`dashboard-family-tab.tsx`'s synastry sub-tab, `synastry-matrix.tsx`), the "why this prediction" Dasa/Panchangam/Transit breakdown (`dashboard-daily-snapshot.tsx`, `guidance.scoreBreakdown`), streak gamification (`useStreak.ts`), and Life Areas scoring (`dashboard-life-areas-tab.tsx`).

### 6.1 Phase 2 gap & mapping table (`cal-panch` — Calendar tab, daily Panchangam view)

*Populated 2026-07-05. `CalendarTab` (`dashboard-calendar-tab.tsx`) turned out to already be written almost entirely with `var(--color-*)`-driven inline styles (not Classic's hardcoded hex) for its daily-view content (`DayTimeline`, Five Limbs rows via `.cd-detail-spec-row`, `LunarTithiBadge`) — those Nova already re-themes for free via the same cascade mechanism Phase 1 relied on, so they're reused verbatim (exported, not reimplemented). Sub-widgets that instead read Classic-only hardcoded custom properties (`--panel-warm-tint`, `--cl-brand-edge`, `--chart-d9-active-bg`, `--cal-*`, etc. — confirmed via `globals.css` to be literal hex with no Nova override) were rebuilt fresh with Nova tokens instead of patched, to avoid growing the gap-fix list in `dashboard-nova.css` indefinitely.*

| Mockup section (cal-panch) | Existing component/hook | Net-new work | Status |
|---|---|---|---|
| Page header (date, Tamil date, weekday·paksha·nakshatra meta, Panchangam/Monthly toggle) | `formatHeaderDate`/`getTamilMonthDate`/`activeLimb` (exported from Classic) | `dashboard-calendar-tab-nova.tsx` header block | **Built** |
| Day at a glance headline + sunrise/sunset + location override | Same `panchangam` fields; `PlaceCombobox` reused as-is (Classic-styled dropdown — minor, accepted cosmetic mismatch, see below) | New Nova card chrome | **Built** |
| Day arc (SVG) | `DayTimeline` (Classic, exported) — already 100% `var(--color-*)`-driven | Reused verbatim, no changes | **Built** |
| Auspicious (Nalla Neram / Gowri Nalla Neram) | `panchangam.kalam.nallaNeram` / `.gowriNallaNeram`, `gowriPeriodLabel` | `NovaAuspiciousCard` — Classic's `AuspiciousSlotGroup` reads non-Nova-safe tokens, so this is a fresh Nova-token implementation of the same data | **Built** |
| Avoid (Rahu Kalam / Yamagandam / Kuligai) | `panchangam.kalam.*` | `NovaAvoidRow` (fresh Nova-token version, same data) | **Built** |
| Today's Nakshatra card | `nakActive`/`panchangam.nakshatra` | Inline in orchestrator | **Built** |
| Chandrashtamam card | `chandrashtamaAffectedNatalRasi`, `formatChandrashtamaWindowSummary`, `moonRasiFromNakshatra`, `rasiName` (all exported, reused) | Inline in orchestrator, Nova-token styling | **Built** |
| Today's Events (festivals, world observance) | `festivalTags`/`festivalIcon` (exported) | `NovaFestivalRow` + `novaFestivalTagTone`/`novaFestivalTagLabel` (fresh Nova tag badge coloring — Classic's `festivalTagTone` uses non-Nova-safe `--cl-festival-*` tokens) | **Built** |
| Gowri Nalla Neram Details (14-slot grid) | `panchangam.kalam.gowriPanchangam`, `gowriCategoryLabel`/`gowriPurposeLabel`, `timeWindowsOverlap` (exported) | `NovaGowriDetailGrid` (fresh Nova-token version, same data/logic) | **Built** |
| Today's Significance | Same fallback logic as Classic (`festivals[0].name` → `subhaMuhurtham.reason` → generic line) | Inline in orchestrator | **Built** |
| Panchangam · Five Limbs (11 rows incl. Soolam/Lagnam/Nethiram/Jeevan/Amirdhadhi Yogam) | Same row-array construction as Classic; `.cd-detail-spec-row` CSS class (already `var()`-driven, safe to reuse) | Row array duplicated verbatim in the Nova file (same i18n calls, same fields) | **Built** — carries forward the pre-existing "5L" tag on every row unchanged (present identically in Classic and in the mockup itself; its purpose is unclear — looks like a leftover placeholder never wired to real data — flagged here, not invented or removed) |
| Hora Table (running-hora highlight + full list) | `panchangam.hora`, `DASHA_COLORS` | `NovaHoraRow` (fresh Nova-token version of Classic's `HoraRow`, same auto-scroll-into-view behavior) | **Built** |
| Monthly toggle (screen 3, `cal-monthly`) | `MonthlyCalendarView` + `DayDetailDrawer` (exported from Classic, unchanged) | **Deliberately deferred** — reused Classic-styled (light/cream) verbatim inside the Nova tab so the toggle stays fully functional; Phase 3 re-skins this screen next | Functional, not yet Nova-styled |

**Known minor cosmetic mismatch, accepted:** `PlaceCombobox` (the location-override search dropdown) renders with Classic's light/cream input styling even under Nova, since it reads Classic-only hardcoded tokens (`--chart-cell-default`, `--panel-earth`, `--panel-hover`). Low-traffic, secondary feature (changing which city's panchangam you're viewing) — noted, not fixed in this pass.

### 6.2 Phase 3 gap & mapping table (`cal-monthly` — Calendar tab, monthly grid) — pulled forward

*Populated 2026-07-05. Originally planned as a separate later phase (Monthly reused Classic's `MonthlyCalendarView` verbatim in the meantime); pulled forward in the same session after the user's Phase 2 sign-off screenshot showed the Monthly toggle still rendering Classic's cream/light colors. Unlike `cal-panch`, essentially none of `MonthlyCalendarView`'s markup was safe to reuse verbatim — its `monthlyTheme` object and every highlight/legend color reads Classic-only literal-hex custom properties (`--cal-*`, `--panel-cream-light`, confirmed via `globals.css` to have no `[data-ui="nova"]` override anywhere) rather than the `--color-*` tokens Nova redefines.*

| Mockup section (cal-monthly) | Existing component/hook | Net-new work | Status |
|---|---|---|---|
| Page header + Panchangam/Monthly toggle | Shared with `cal-panch` header | Reused from `dashboard-calendar-tab-nova.tsx`'s existing header (no duplication — same component renders both sub-views) | **Built** |
| Month nav (‹ July 2026 · Aani & Aadi ›) | `tamilMonthOnly`, `MONTH_LABELS_EN/TA` (exported from Classic) | `MonthlyCalendarViewNova` header block | **Built** |
| Calendar grid (day cells: Tamil date, tithi, festival icons, Muhurtham/Pournami/Amavasai/Chathurthi/Sashti/Pradosham highlight colors, Karinaal warning, Today badge) | Same `PanchangamMonthDayEntry[]` data and the exact same `highlightType` priority logic as Classic (muhurtham > pournami > amavasai > chathurthi > sashti > pradosham) | Fresh Nova-token color mapping (`NOVA_CAL_HILITE`) — reused verbatim: `festivalIcon`/`festivalImagePath`/`festivalTags`/`MoonPhaseMark`/`lunarSpecialTithiMeta` (all pure logic/data, no Classic-only tokens) | **Built** |
| Legend row (9 categories) | Same 9 categories as Classic | `NOVA_LEGEND` — reuses Nova semantic tokens where an exact match exists (Muhurtham→`--color-high`, Chathurthi→`--color-low`, Karinaal→`--color-alert-critical`, Pradosham→`--color-accent`, Festival→`--color-accent-strong`, Ekadashi→`--color-faint`); Pournami/Amavasai/Sashti needed 3 small new literal one-off colors since Nova has no existing semantic slot for a 3rd gold shade or a blue — matched to the mockup's own legend swatch values, not invented | **Built** |
| Sidebar (Events/Vratha/Muhurtham tabs, item list, vratha-sequence chips, "best for your chart" muhurtham chips) | Same `monthFestivals`/`vrathaGroups`/`sidebarItems` derivation as Classic (recomputed from the same `PanchangamMonthlyData` prop — Classic doesn't expose these as a reusable hook, so the `useMemo` blocks are duplicated verbatim, not reinvented) | Fresh Nova-token card/tab/chip styling | **Built** |
| Day-click preview drawer | Classic's `DayDetailDrawer` reused the non-Nova-safe `AuspiciousSlotGroup`/inline avoid-rows | `DayDetailDrawerNova` (in `dashboard-calendar-tab-nova.tsx`) — reuses `DrawerPanel`'s existing default **dark** theme (only Classic's drawer opts into `theme="light"`) plus the `NovaAuspiciousCard`/`NovaAvoidRow`/`NovaFestivalRow` pieces already built for `cal-panch`, so no new sub-components were needed | **Built** |

---

## 7. Open Questions / Decisions Needed

All items below are **resolved** as of 2026-07-05 except the two flagged still-open:

- [x] **Design access** — resolved via manual download to a gitignored local folder (§2).
- [x] **Which screens are mocked up?** — all 10 main dashboard screens (§3), not a subset as first assumed.
- [x] **Brand direction** — Nova is additive, not a `DESIGN_CONSTITUTION.md` revision (§2 Blockers).
- [x] **`/dashboard/v2` disposition** — retired, superseded by Nova's Today screen (§4.6).
- [x] **Today tab "Ask + decide" section mapping** — resolved 2026-07-05: user chose to add a small additive backend field (`dateResult` on `/api/v1/activity-timing`) rather than downgrade the UI to a single-activity picker or stub the grid out (§6, Progress Log).
- [x] **`.cd-shell` incremental-rollout risk during screen-by-screen rollout** — resolved at the CSS-mechanics level for the outer shell. **Widened 2026-07-05**: found while building the Deep Dive section that `Surface`/`Chip`/`Metric`/`.card`/`.table`/buttons/etc. in `globals.css` are governed by a *second*, separate set of `.cd-shell .X { background: #hex }` rules that hardcode literal Classic colors (not `var()` references) — Nova's variable redefinitions never reached them. Fixed with a matching `[data-ui="nova"] .cd-shell .X { ... var(--color-*) }` override block in `dashboard-nova.css`. Still worth a visual spot-check once a mid-rollout screen mix exists (some screens Nova, some still Classic) to confirm nothing leaks through in practice.
- [ ] **Deep Dive completeness** — Nova's Today tab Deep Dive section intentionally covers a bounded subset for this pass (planet table, chart explanation, vargas, shadbala, the three alternate dashas, classical timing, nakshatra card, PDF). Not yet folded in: the two-col Chart Context/Guidance-detail/Gochar surfaces, the Dasa-Bhukti-Antaram strip, `DashboardActivityTimingCard` (the single-activity month browser — distinct from the new 4-activity Decide grid), `MorningGuidanceCard`, the Prasna/Horary trigger, and the chart-validation confidence chip. Nothing is lost for users (Classic is one Settings toggle away), but these should be folded into Nova before Classic's Today tab is ever retired for good.

---

## 8. Progress Log

- **2026-07-05** — Created this tracking document. Completed a first-pass Functionality Inventory of the dashboard surface (routes, left-rail tabs, ~70 `dashboard-*`/supporting components grouped by tab, 10 data hooks, CSS/token file locations) by reading the repo directly (no design input yet). Attempted to read the Claude Design project via `DesignSync.get_project` — failed, needs `/design-login` which isn't available in this environment; needs the user to either use "Send to Claude Code Web" from the Claude Design canvas, or paste/export the mockup into the repo. Flagged a real conflict: the shipped `DESIGN_CONSTITUTION.md` (Playfair Display / Inter / JetBrains Mono, "Warm Cosmic Minimalism") disagrees with the new direction's stated fonts (Fraunces / Inter / IBM Plex Mono) and aesthetic (Tamil palm-leaf/kolam) — needs a user decision before Step 2 (Design System Extraction) can start for real. Also noted an already in-flight, unshipped `/dashboard/v2` Today-tab redesign preview awaiting sign-off, which likely needs to be reconciled with (not built alongside) this initiative. No code changed yet — audit only.
- **2026-07-05 (later)** — User chose "Send to Claude Code Web" to unblock design access; re-checked `DesignSync` — still not authorized as of this entry, no new design files landed in the repo yet. User then clarified an important scoping point: the Claude Design project only has revamped mockups for **a subset** of dashboard pages, not all of them. Added §3.1 coverage policy: build explicitly-mocked screens to spec; for the rest, extrapolate the same tokens/primitives/visual language for consistency rather than reinventing per-page or leaving them in the old style. This makes token/primitive extraction (Process §5 step 2) a hard prerequisite for touching any undesigned page. Still need: (a) design access to actually land, (b) the specific list of which screens/tabs are covered by mockups today. No code changed — audit/policy only.
- **2026-07-05 (Phase 0 build)** — Design access unblocked: user manually downloaded the Claude Design exports to `D:\sanstro\Astrology App Dashboard Redesign\` (added to `.gitignore` immediately — never commit). Read `Vinaadi Prototype.dc.html` (primary mockup, all 10 screens — coverage turned out complete, not partial as previously assumed) and `Design Tokens.dc.html` in full; `Dashboard Redesign.dc.html` confirmed as historical reference (8 screens verbatim-identical, 2 extra superseded Today variants). User confirmed two decisions: (1) Nova is an additive "Look: Classic/Nova" toggle, not a replacement of Light/Dark/System — Nova is always-dark and disables that sub-toggle while active; (2) the in-flight `/dashboard/v2` Today preview is retired, superseded by Nova's Today screen. Went through Plan Mode (approved plan at the time saved in `C:\Users\senth\.claude\plans\rosy-wishing-pelican.md`) before writing any code, per the working style. Built Phase 0 (foundation): `web/hooks/useUiVariant.ts` (mirrors `useTheme.ts`); FOUC-prevention restore for `data-ui` in `web/app/layout.tsx`; **found during implementation that `.cd-shell` is much bigger than a simple override** — it's ~400 lines across `dashboard.css`+`globals.css`, including a large `!important`-heavy layer of literal `[style*="#hex"]` attribute-selector hacks patching old raw inline styles. Refined the plan's approach: Nova's own `--color-*`/`--radius-*` variable redefinitions under `[data-ui="nova"] .cd-shell` win automatically via CSS specificity against the plain `.cd-shell {}` definitions (no edits needed there) — reusing the entire existing token-driven chrome (topbar, tabnav, chips, buttons) for free. Only the literal inline-style hack block (`globals.css` ~3298-3486) needed an actual edit, since attribute-selector-on-raw-style-text is orthogonal to CSS variables — rescoped every selector there to `html:not([data-ui="nova"])`. Created `web/app/dashboard/dashboard-nova.css` (Nova token values + nav-shell reuse: forcing `.cd-tabnav` visible and `.cd-left-rail` hidden at all viewport widths, confirmed to work via specificity without `!important` since `DashboardLeftRail` is a flex sibling not a wrapper) and imported it in `web/app/dashboard/page.tsx`. Added Cormorant Garamond + Source Serif 4 via `next/font/google`, scoped to `web/app/dashboard/layout.tsx` (not root layout) as `--font-nova-display`/`--font-nova-prose`; confirmed Noto Sans Tamil already loads app-wide, reused as-is. Mapped `--font-display` to Cormorant Garamond but left `--font-body` on the system-ui stack (not Source Serif 4) — the source tokens reserve "Prose" (Source Serif 4) for body-copy/insight text specifically, not all UI chrome; `--font-nova-prose` is applied selectively per-component starting in Phase 1. Scaffolded `web/components/dashboard-ui-nova.tsx` (`NovaScoreDial`, `NovaProgressBar`, `NovaTable`) as a separate file from `dashboard-ui.tsx` to avoid variant-branching the widely-used Classic primitive library. Added the "Look" toggle UI to `dashboard-settings-session-tab.tsx` (new card before "Appearance"; existing Light/Dark/System row now visually disabled with an explanatory note when Nova is active). Updated this doc's §2/§3/§4.3/§4.6/§6/§7 to reflect all of the above. **Next:** dev-server verification of Phase 0 mechanics, then start Phase 1 (Today tab) screen build.
- **2026-07-05 (Phase 1 build)** — Built the Today tab (`data-screen="today"`, all 8 mockup sections). Before writing code, resolved the one flagged open question with the user (§6/§7): the mockup's "Is today right for…?" grid needs a live per-activity status for *today*, but the only backend (`/api/v1/activity-timing`) returns just the top-5 best dates in a month for one activity — it silently computes every day internally but only returns the top 5, so today's own result was already being thrown away. User chose to add a small additive field over downgrading the UI or stubbing it out. Backend: added `date_result`/`dateResult` to `ActivityTimingData` (`app/schemas/daily_guidance.py`), an optional `asOf` query param (`app/api/daily_guidance.py`), and capture-during-the-existing-loop logic in `get_activity_timing` (`app/services/daily_guidance_service.py`) — no new calculation, no astrology logic touched, fully backwards-compatible (omitting `asOf` reproduces prior behavior exactly). Mirrored the type into `packages/shared/src/types/index.ts`. Mapped the mockup's 4 activity cards (Travel/Signing/Buy gold/New job) onto the *existing* allowed activity keys (`travel`/`property`/`money`/`job_change`) rather than inventing new astrological categories.
  Built 4 new frontend files: `dashboard-today-ribbon-nova.tsx` (day timeline, segmented-bar visual built from real Rahu Kalam/Nalla Neram data, range and segment count computed dynamically per day — not hardcoded), `dashboard-today-decide-nova.tsx` (Ask Vinaadi teaser — real quota + real mode-based suggested questions, opens the existing FAB rather than duplicating its chat — plus the 4-activity Decide grid), `dashboard-today-glance-nova.tsx` (Coming up/Week ahead/Family/Dasa chapter/Life areas — all existing data, re-laid-out), and `dashboard-today-tab-nova.tsx` (orchestrator: greeting hero + score dial, Panchangam band, one-focus+remedy, and a collapsed Deep Dive section reusing existing panels verbatim). Exported `downloadJadhagamPdf` from `dashboard-personal-tab.tsx` (was an inline function) so Nova's Deep Dive PDF button reuses it instead of re-implementing.
  **Found and fixed a real Phase 0 coverage gap while wiring the Deep Dive section**: `dashboard-nova.css`'s header comment claimed `.cd-shell`'s `--color-*` variable redefinitions re-theme "cards, tables..." for free, but `globals.css` actually governs `Surface`/`Chip`/`Metric`/`.card`/`.table`/buttons/snapshot-box/alert-banner via a *second*, separate set of `.cd-shell .X { background: #hex }` rules that hardcode literal Classic colors directly rather than reading the variables — meaning any Nova screen reusing these shared primitives (not just this one) would have silently rendered Classic's cream/tan colors. Added a matching `[data-ui="nova"] .cd-shell .X { ...var(--color-*) }` override block to `dashboard-nova.css` (mirrors the same selector list at one higher specificity level) — fixes this for the whole initiative going forward, not just today's build. Also added `.nova-grid-2`/`.nova-grid-3`/`.nova-grid-anticipation` responsive utility classes (the one place Nova needs a `@media` breakpoint, which can't be expressed in the inline-style convention `dashboard-ui-nova.tsx` otherwise uses).
  Wired it into `dashboard-workspace.tsx`: lifted `useUiVariant()` up from `dashboard-settings-session-tab.tsx` into the workspace itself (previously two independent hook instances — toggling in Settings wouldn't have swapped the Today tab tree without a page reload, since nothing threaded the variant into the component that decides which tab tree to render) and now passes `uiVariant`/`onUiVariantChange` down as props. Added a new `activeTab === "personal" && uiVariant === "nova"` render branch (checked before the existing `todayVariant === "v2"` branch — Nova supersedes v2 per §4.6), extended the household-strip gating to also skip when Nova is active (it has its own Family glance card), and lifted the Ask-Vinaadi FAB's `open` state from `dashboard-ask-vinaadi-widget.tsx`'s internal `useState` up into the workspace (now a controlled `open`/`onOpenChange` pair) so the new Nova teaser card can open the same chat panel instead of duplicating it.
  **Scoped Deep Dive deliberately narrower than Classic's full detail** (flagged in §7, not silently dropped): covers planet table, chart explanation, vargas, shadbala, the three alternate dashas (Yogini/Ashtottari/Kalachakra), classical timing (Chara Dasha/Solar Return), nakshatra card, and PDF download — all reused verbatim from `dashboard-personal-tab.tsx`. NOT yet carried into Nova: the two-col Chart Context/Guidance-detail/Gochar surfaces, the Dasa-Bhukti-Antaram strip, `DashboardActivityTimingCard` (single-activity month browser, distinct from the new Decide grid), `MorningGuidanceCard`, the Prasna/Horary trigger, and the chart-validation confidence chip. Also omitted (no backing feature exists, confirmed by grep): the mockup's "Add to my day" button and the remedy's "✓ Done" button; and the "Chandrashtama · in 6 days" forward-countdown chip in the Coming Up card (only "is it active today" exists, not a days-until-next-occurrence forecast).
  Verified: `tsc --noEmit` clean project-wide (strict mode), `eslint` clean on all new/touched files, edited Python backend modules import cleanly, and the already-running dev backend's live OpenAPI schema confirms `dateResult`/`asOf` are live. Both dev servers (web:3000, backend:8000) were already running from a prior session — did not need to start them. **Next: visual sign-off from the user in a real signed-in browser session** (toggle Look → Nova in Settings, check the Today tab), then either follow-up fixes or move to Phase 2 (screen 2, `cal-panch`).
- **2026-07-05 (Phase 2 build)** — User confirmed Phase 1 sign-off, proceeded straight to Phase 2. Read the `cal-panch` mockup in full (lines 320-539 of `Vinaadi Prototype.dc.html`) and then `dashboard-calendar-tab.tsx` end to end (1943 lines — both the daily Panchangam view inside `CalendarTab` and the `MonthlyCalendarView`/`DayDetailDrawer` it also contains).
  **Key finding that shaped the whole approach**: unlike the Today tab (which needed a from-scratch rebuild in Phase 1), Classic's daily Panchangam view turned out to already be content- and layout-identical to the mockup — same header text ("Transits & Events"), same 11-row Five Limbs list in the same order (down to a static, unexplained "5L" tag appearing on every row in *both* the shipped Classic code and the mockup, meaning the mockup was very likely captured from a live render of this exact page), same Hora table, same Chandrashtamam/Nakshatra/Events sections. More importantly, several of its sub-components (`DayTimeline`'s SVG day-arc, `LunarTithiBadge`, the `.cd-detail-spec-row` CSS class backing Five Limbs) were already written using only `var(--color-*)` custom properties that Nova's `[data-ui="nova"] .cd-shell` block already redefines — meaning they re-theme automatically with zero changes, the same mechanism Phase 1 relied on for the base chrome.
  Other sub-components (`AuspiciousSlotGroup`, `GowriNamedSlotPanel`, `HoraRow`, festival tag badges) instead read Classic-only literal-hex custom properties defined in `globals.css` (`--panel-warm-tint`, `--cl-brand-edge`, `--chart-d9-active-bg`, `--cal-*`, `--cl-festival-*` — confirmed via grep that none of these have a `[data-ui="nova"]` override anywhere) — reusing those verbatim would have rendered Classic's light cream/sage colors on top of Nova's dark plum background, a real visual bug of the same class Phase 1 found and fixed for `Surface`/`Chip`/`Metric`. Rather than extend the gap-fix list in `dashboard-nova.css` to cover a dozen more one-off tokens whose exact Classic semantics would need reverse-engineering, rebuilt those specific pieces fresh with Nova's own token set (`--color-high-bg`/`--color-low-bg`/`--color-accent-muted`/etc.), while still importing and reusing the underlying *data and pure logic* unchanged (`gowriPeriodLabel`/`gowriCategoryLabel`/`gowriPurposeLabel` from `lib/gowri.ts`, `timeWindowsOverlap`, `festivalTags`, `festivalIcon`).
  Made 18 additive `export` keyword changes to `dashboard-calendar-tab.tsx` (zero behavior change, same class of edit as Phase 1's `export downloadJadhagamPdf`) to expose the pure derivation helpers (`activeLimb`, `moonRasiFromNakshatra`, `chandrashtamaAffectedNatalRasi`, `rasiName`, `formatHeaderDate`, `getTamilMonthDate`, `formatChandrashtamaWindowSummary`, `parseHmToMinutes`, `timeWindowsOverlap`, `festivalTags`, `festivalIcon`, `RASI_NAMES_EN/TA`) plus three components reused verbatim (`DayTimeline`, `LunarTithiBadge`) and two reused for the deferred Monthly toggle (`MonthlyCalendarView`, `DayDetailDrawer`, plus the `CalendarView` type) — no astrological calculation logic was touched or duplicated, only exposed.
  Built `web/components/dashboard-calendar-tab-nova.tsx` (new file, ~500 lines): page header, the two-column "Day at a glance" mega-card (day arc, auspicious/avoid cards, nakshatra/chandrashtamam/events/significance cards, the 14-slot Gowri Nalla Neram detail grid) and the right-column Five Limbs + Hora Table panel — see §6.1 for the full section-by-section mapping. Kept the location-override feature (📍 "change location" popover using the existing `PlaceCombobox`) for parity with Classic rather than dropping it, since it's a real working feature, not a mockup-only idea. The Monthly toggle is wired to the exact same `useMonthlyPanchangam` hook and reuses Classic's `MonthlyCalendarView`/`DayDetailDrawer` verbatim (Classic-styled, functional) — its own Nova re-skin is Phase 3's job (screen 3, `cal-monthly`), not this one's; nothing regresses in the meantime.
  Wired into `dashboard-workspace.tsx`: added a `DashboardCalendarTabNova` dynamic import and split the existing `activeTab === "calendar"` render block into `uiVariant === "nova"` / `uiVariant !== "nova"` branches (same pattern as the Today tab's Phase 1 branch), so the Look toggle now also swaps the Calendar tab.
  Verified: `tsc --noEmit` clean project-wide, `eslint` clean (0 errors/warnings) on the new file and both touched files (`dashboard-calendar-tab.tsx`, `dashboard-workspace.tsx`). Did not drive a real signed-in browser session for this screen — no browser-automation tool is available in this Windows environment (no `chromium-cli`/xvfb, and the dashboard requires an authenticated session this agent doesn't have credentials for), so — same handoff as Phase 1 — **visual sign-off needs to happen in the user's own browser** (dev servers already running on :3000/:8000; toggle Look → Nova, open the Calendar tab). **Next:** user sign-off on `cal-panch`, then Phase 3 (`cal-monthly`).
- **2026-07-05 (Phase 3 pulled forward)** — User checked Phase 2 in the browser and sent a screenshot: the page header/toggle were correctly Nova-dark, but the **Monthly** sub-view (which the user had clicked into) showed the old Classic cream/light calendar grid. Confirmed via follow-up question this was expected/documented (Monthly was deliberately deferred, reusing Classic's `MonthlyCalendarView` verbatim per §6.1) and that the actual Phase 2 deliverable — the **Panchangam** (daily) sub-view — looked correct. User then chose to pull Phase 3 forward immediately rather than leave Monthly Classic-styled even temporarily, so built it in the same session.
  Read the `cal-monthly` mockup in full (lines 540-700 of `Vinaadi Prototype.dc.html`). Unlike `cal-panch`, found that essentially **none** of Classic's `MonthlyCalendarView` was safe to reuse verbatim: its `monthlyTheme` object and every highlight-color path resolve through `--cal-*`/`--panel-cream-light`/etc. custom properties, all confirmed via `globals.css` to be literal hardcoded hex with zero `[data-ui="nova"]` override — the opposite situation from `DayTimeline`/`.cd-detail-spec-row`, which Phase 2 found were already Nova-safe. So this phase is a genuine from-scratch rebuild of the presentation layer (matching Phase 1's Today-tab pattern), not a light re-skin.
  Made 8 more additive `export` keyword changes to `dashboard-calendar-tab.tsx` (same zero-behavior-change class as Phase 2's 19) to expose `tamilMonthOnly`, `MoonPhaseMark` (already fully `currentColor`-driven, theme-safe with zero changes), `MONTH_LABELS_EN/TA`, `WEEKDAY_LABELS_EN/TA`, `festivalImagePath`, and `VRATHA_FESTIVAL_PATTERN` — all pure data/logic, reused as-is.
  Built `web/components/dashboard-calendar-monthly-nova.tsx` (new file): month nav, the 7-column day-cell grid (recomputing the same `cells`/`monthFestivals`/`vrathaGroups`/`sidebarItems` derivations Classic's `useMemo` blocks compute, off the same `PanchangamMonthlyData` prop — duplicated since Classic doesn't expose them as a standalone hook, but pure JS derivation over already-fetched data, not astrological calculation), the 9-item legend, and the Events/Vratha/Muhurtham sidebar. Introduced one small `NOVA_CAL_HILITE` color map: reused exact Nova semantic tokens where they already existed (Muhurtham→`--color-high`, Chathurthi→`--color-low`, Karinaal→`--color-alert-critical`, Pradosham→`--color-accent` — this one turned out to be the *exact* same hex Nova already uses, `#d4af5f`, since the mockup's own Pradosham legend swatch matches it — and Festival→`--color-accent-strong`, another exact match, `#e7c87e`), and added 3 small new literal one-off colors only where Nova truly has no equivalent semantic slot (Pournami needs a 3rd distinct gold shade since Pradosham/Festival already claim Nova's two existing golds; Amavasai kept `--color-accent-secondary` reused rather than a new purple; Sashti needed a genuinely new blue) — matched to the mockup's own stated legend values, not invented from scratch.
  Also rebuilt the day-click preview drawer: added `DayDetailDrawerNova` directly in `dashboard-calendar-tab-nova.tsx` (co-located with the Nova sub-components it reuses — `NovaAuspiciousCard`, `NovaAvoidRow`, `NovaFestivalRow`, `LunarTithiBadge`). Found `DrawerPanel` (`drawer-panel.tsx`) already defaults to a dark theme app-wide (`theme="dark"` is the default; only Classic's `DayDetailDrawer` explicitly opts into `theme="light"` for its cream aesthetic) — so no new drawer chrome was needed, just a Nova-styled body reusing the same sub-components as the main `cal-panch` screen instead of Classic's non-Nova-safe `AuspiciousSlotGroup`/inline avoid-rows.
  Added a `.nova-cal-monthly-layout` responsive rule to `dashboard-nova.css` (collapses the grid+sidebar 2-column layout to 1-column under 960px — the one `@media` breakpoint this screen needs, same convention as the existing `.nova-grid-2/3` utilities from Phase 1).
  Wired `MonthlyCalendarViewNova` into `dashboard-calendar-tab-nova.tsx` in place of the Classic `MonthlyCalendarView` reuse, and `DayDetailDrawerNova` in place of `DayDetailDrawer` — both drop-in swaps (identical prop signatures), no changes needed in `dashboard-workspace.tsx` beyond what Phase 2 already wired.
  Verified: `tsc --noEmit` clean project-wide, `eslint` clean (0 errors/warnings) on all touched/new files, confirmed the `dashboard-calendar-tab.tsx` diff is still purely additive `export` keywords (27 total across Phases 2+3, zero logic changed). Hit `/dashboard` to confirm the dev server compiles the changed route (307 auth redirect, no 500). Same as before, could not drive a real authenticated browser session myself. **Next:** user sign-off on both `cal-panch` and `cal-monthly` together, then continue to the remaining screens (`family`, `family-member`, `explore`, `explore-moolam`, `explore-sevvai`, `tools`, `tools-porutham`).
