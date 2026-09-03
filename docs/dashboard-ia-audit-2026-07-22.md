# Dashboard Information-Architecture Audit & Refactor Spec

**Date:** 2026-07-22
**Scope:** The signed-in dashboard tabs — `Today`, `Calendar (Transits & Events)`, `Family & Charts`, `Goals`, `Life Areas`, `Journal`, `Tools`, `Explore`, `Settings`.
**Author intent:** Kill cross-tab duplication, reduce page density, put every function under a tab whose name predicts it, and do it **without introducing runtime errors or dead links**.

> This document is written so a coding agent can execute it phase-by-phase. Each phase is **independently shippable** (compiles, no dead links) and ends with an explicit acceptance checklist. **Do the phases in order.** Do not batch-delete before the additive step of the same phase is green.

---

## 0. Ground truth — how the dashboard is wired today

Read these before touching anything. Do not trust memory; verify each reference still exists.

### 0.1 The Tab contract (a shared contract across 4+ spots — change together)
- `web/lib/dashboard-tabs.ts` — the `Tab` union, `RESTORABLE_TABS`, `URL_ADDRESSABLE_TABS`, `sanitizeRestoredTab`, `sanitizeUrlTab`.
- `web/components/dashboard-hero.tsx` — `TAB_DEFS` (primary nav) + `MORE_TAB_DEFS` (the "More" menu). Labels come from `labelEn` / `labelTaKey`.
- `web/lib/i18n.ts` — the `tab_*` label keys (`tab_today`, `tab_calendar`, `tab_family`, `tab_plan`, `tab_life_area_nav`, `tab_tools`, `tab_explore`, `tab_settings`).
- `web/components/dashboard-workspace.tsx` — the `{activeTab === "..." && <Panel .../>}` render switch **and** all the cross-tab `goToTab(...)` callbacks.

**Rule:** adding/removing/renaming a tab id means editing **all four** of the above in the same change, or the build type-fails (that is by design — keep it that way).

### 0.2 Current nav → component map

| Nav label (EN) | Tab id | Component file | Internal structure |
|---|---|---|---|
| Today | `personal` | `dashboard-today-tab-nova.tsx` | Snapshot cards + a large **"Deep Dive"** that renders the full natal report (chart context, guidance, gochar, dasa-bhukti, vargas, shadbala, 3 alt dashas, classical timing, nakshatra card) |
| Transits & Events | `calendar` | `dashboard-calendar-tab-nova.tsx` | Panchangam calendar, transits & events |
| Family & Charts | `family` | `dashboard-family-charts-hybrid.tsx` (1,313 lines) | Single-scroll section rail: `hy-today`, `hy-members`, `hy-overview`, `hy-charts`, `hy-planets`, `hy-dashas`, `hy-insights` (yogas+strengths+**remedies**), `hy-forecast` (6/12-mo), `hy-explain`, `hy-connections` |
| Goals | `plan` | `dashboard-plan-tab-nova.tsx` | Sub-tabs: `goals`, `events` (Life Events), `whatif`, `muhurta` (**Best Dates & Muhurta**), `decisions` |
| Life Areas | `life-areas` | `dashboard-life-areas-tab-nova.tsx` | Sub-tabs: `scores`, `predictions`, `chances`, `yogas` (Yogas & Doshams), `report`, `remedies` |
| — (reached via links) | `journal` | `dashboard-journal-tab-nova.tsx` | Sub-tabs: `write` (mood + **context events** + life-area tags), `entries`, `reflections` |
| Tools | `tools` | `dashboard-tools-tab-nova.tsx` | Compatibility/Porutham, misc tools |
| Explore | `explore` | `dashboard-explore-tab-nova.tsx` | Discovery hub |

### 0.3 Cross-tab navigation callbacks that exist today (dead-link surface)
These are the wires that break if a destination tab id is renamed/removed. **Every one must resolve to a live tab after every phase.**

| Callback prop | Passed in `dashboard-workspace.tsx` as | Notes |
|---|---|---|
| `onGoToTransits` (in plan, life-areas, journal) | `() => goToTab("family")` | **Misnomer.** There is no `transits` tab; the label says "transits" but it jumps to Family & Charts. The standalone `transits` tab was deleted 2026-07-21 and folded into Family. |
| `onGoToLifeAreas` (family, plan) | `() => goToTab("life-areas")` | |
| `onGoToPlan` (life-areas) | `() => goToTab("plan")` | |
| `onGoToCalendar` (plan) | `() => goToTab("calendar")` | |
| `onGoToJournal` (family, plan) | `() => goToTab("journal")` | |
| `onGoToTools` (family) | `() => goToTab("tools")` | |

> **`transits` is already a dead concept in the code but a live word in the UI.** Comments in `dashboard-plan-tab-nova.tsx` and `dashboard-hero.tsx` still describe a `"transits"` nav id that no longer exists. Cleaning this up is part of Phase 5.

---

## 1. Findings (the "why")

### F1 — Duplication: the same artifact renders in two tabs
| Artifact | Home A | Home B | Shared code/data |
|---|---|---|---|
| **Remedies** | Life Areas → `remedies` sub-tab (`NovaRemediesPanel`) | Family & Charts → `hy-insights` | `remedyPlan`, `gemstoneAdvice`, `loadRemedies()` in workspace |
| **Yogas & Doshams** | Life Areas → `yogas` sub-tab | Family & Charts → `hy-insights` | chart `yogas`/`doshams` |
| **Full natal deep-dive** (planets, dashas, vargas, explanation) | Today → "Deep Dive" | Family & Charts → `hy-charts`/`hy-planets`/`hy-dashas`/`hy-explain` | `personal.chart`, `personalDasha*` |
| **Today's guidance & score** | Today (its home) | Family & Charts `hy-today` **and** Life Areas overview | `dailyGuidance`, `transit`, `sani` |

### F2 — Density
- **`dashboard-family-charts-hybrid.tsx` is 1,313 lines / 10 scroll sections** and spans a family roster → a solo natal deep-dive → remedies → 6/12-mo forecast → porutham. It is effectively three products in one page.
- **Today's "Deep Dive"** re-renders the same full report — second-densest and redundant with Family & Charts.

### F3 — Function under the wrong page name
- **"Family & Charts"** — roughly half its content (remedies, yogas, forecast, chart explanation, prasna) is single-person interpretation, not "family." The `&` in the name is the tell.
- **"Goals"** carries **Best Dates & Muhurta** (`muhurta` sub-tab) — that is timing/almanac, not goal-setting.
- **"Journal"** carries **Context events** (job change, marriage, relocation) buried in the `write` sub-tab — those are *engine input about the user's life context*, not diary entries.

---

## 2. Target information architecture (the "what")

**Guiding principle: one artifact → exactly one canonical home. Every other surface *links* to it, never re-renders it.**

The clean seam is **structure vs. outcome vs. timing vs. people**:

| Lens | Owns | Tab |
|---|---|---|
| **Snapshot** | today's score, best/avoid window, one-line dasha, link-outs | **Today** (`personal`) |
| **People** | member roster, household scores, cross-chart compatibility, relationship alerts, connections/porutham | **Family** (`family`) |
| **Chart structure** | planets, houses, dashas & timeline, yogas, chart explanation | **My Chart** (`family`, relabeled — see §3 note) |
| **Outcomes** | life-area scores, predictions, chances, remedies, 6/12-mo forecast | **Life Areas** (`life-areas`) |
| **Timing** | panchangam, transits, events, **muhurta / best dates** | **Calendar / Transits & Events** (`calendar`) |
| **Planning** | goals, decisions, what-if | **Goals** (`plan`) |
| **Reflection** | diary entries, mood, correlations | **Journal** (`journal`) |
| **Profile input** | context events (job/marriage/relocation) | **Settings** (`settings`) |

### Decision points — both RESOLVED (2026-07-22)
Recorded for traceability; the phases below are now deterministic.

- **D1 — Yogas home: RESOLVED → the chart view.** Yogas are a chart property and must display for **the root user's chart and each family member's chart**. Canonical home = Family & Charts (the member-selectable chart view). Life Areas keeps only *activation* scoring with a link-out.
- **D2 — Split depth: RESOLVED → Option A (keep one tab, de-duplicate).** Keep `family` as a single tab; do **not** introduce a new `chart` tab id. Remove the embedded Remedies/Forecast (link out to Life Areas) while **keeping the chart + Yogas** in place. Rename the tab so the name fits its content. No change to the Tab union, localStorage restore, or URL sanitizers.
  - The ambitious physical split (new `chart` tab id) was **not chosen**. §7 is retained only as a "future option" appendix — do not execute it.

> **This spec executes Option A only.** §7 is dormant.

### Pre-flight: is the Life Areas home correct before we delete duplicates? (verified 2026-07-22)
Before Phase 1 removes Remedies/Forecast from Family, both were confirmed to compute correctly in Life Areas:
- **Remedies** — real backend endpoints `GET /api/v1/charts/{chartId}/remedy-plan` and `/gemstone-advice`; per-chart and member-aware via `resolveLifeAreasChartId()` (resolves the selected member's chart, else owner's); gemstone "prescribed/not-prescribed" is real Thirukanitham functional-nature + strength logic. **Caveat:** `NovaRemediesPanel` is **load-on-click** (a "Load" button, not auto-fetch) — a user arriving via a link-out lands on an empty panel. Fix in Phase 2 (auto-load on arrival, or have the link-out trigger `onLoadRemedies`).
- **Forecast (6/12-mo)** — real engine recompute (backend returns `score6mo`/`score12mo` per area; `HyLifeAreaForecast` reads them, no cosmetic slope). **The data already reaches the Life Areas tab** via `lifeAreas={personal.lifeAreas}` (same source Family uses), so hosting it there needs **no backend change and no new fetch** — only rendering `HyLifeAreaForecast` in the Predictions sub-tab.

---

## 3. Invariants — do not break these

1. **The Tab contract stays consistent** across `dashboard-tabs.ts`, `dashboard-hero.tsx`, `i18n.ts`, and the `dashboard-workspace.tsx` render switch. If you touch one, grep the other three.
2. **Every `onGoTo*` callback resolves to a live tab.** After any rename, grep `onGoTo` across `web/components/dashboard-*.tsx` and confirm each target id still exists in the `Tab` union.
3. **`?tab=<id>` deep links keep working.** Any id you remove must be dropped from `URL_ADDRESSABLE_TABS` **and** `RESTORABLE_TABS`, and `sanitizeUrlTab` must degrade an unknown id to `null` (it already does — keep it).
4. **localStorage restore** (`STORAGE_KEY = "jothidam-ai-dashboard-state"`, field `activeTab`) must not resurrect a removed id. `sanitizeRestoredTab` already allowlists — keep the allowlist in sync.
5. **No orphaned data fetches.** If a section is removed from a tab, check whether its data hook in `dashboard-workspace.tsx` (e.g. `loadRemedies`, `predictionsEnabled: activeTab === "life-areas"`) should stop being gated on that tab. Do **not** leave a fetch firing for a section that no longer renders, and do **not** remove a fetch another surface still needs.
6. **Bilingual parity.** Every new/moved label needs both `ta` and `en`. Section titles render in the active language only — never title + faint other-language echo (see memory `feedback_bilingual_title_echo_rejected`).
7. **No new hardcoded PII.** Any example/fixture uses a synthetic identity.
8. **Additive-before-subtractive.** Within a phase: build the new home and its link-out first, verify it renders, *then* delete the duplicate. Never the reverse.

---

## 4. Phased execution plan

Each phase: **change → verify → (only then) delete**. Run the §6 verification gate at the end of every phase.

### Phase 1 — De-duplicate Family & Charts (highest impact, no new tab id)
**Goal:** Family & Charts stops re-rendering **Remedies** and **Forecast** (which belong to Life Areas) but **keeps Yogas** as the canonical chart-view home (per **D1** — see below). It shows a compact summary + a link-out for the artifacts it no longer owns. Cuts density and removes the F1 duplicates.

> **D1 — RESOLVED.** Yogas are a property of a chart, so they render in the **chart view for whichever chart is selected — the root user's chart and each family member's chart**. Family & Charts is already the member-selectable chart view, so **Yogas stay here as the canonical home.** Do **not** move them to Life Areas. Life Areas' `yogas` sub-tab becomes a link-out (or activation-only) — see Phase 2.

**The link-out pattern already exists** — reuse it, don't invent one:
- `HyActionButton` (used for `onGoToTools`, `onGoToJournal` in `dashboard-family-charts-hybrid.tsx`).
- `HyLifeAreaForecast … onViewAll={onGoToLifeAreas}` already accepts a link-out callback.

Steps:
1. In `dashboard-family-charts-hybrid.tsx`:
   - `hy-insights` section: **keep the Yogas render** (it is the canonical home per D1, member-selectable). **Remove the embedded `NovaRemediesPanel` render**; replace with a summary card (e.g. top-priority remedy planet + count) and a `HyActionButton onClick={onGoToLifeAreas}` reading "Remedies →" / "பரிகாரங்கள் →". Confirm Yogas here already follow the selected member (owner + each family member), not just the owner — if the section is hardcoded to the owner's chart, fix it to read the selected member's chart so D1 ("displayed for root user's chart AND family members' chart") holds.
   - `hy-forecast` section: keep the compact forecast preview but ensure the "view all" link (`onViewAll` / `onGoToLifeAreas`) is the only path to the full horizon; do not duplicate the full 6/12-mo tables if Life Areas will own them (see Phase 2).
2. Delete now-unused imports in the file (run eslint to catch them).
3. Do **not** change `loadRemedies` gating yet — Life Areas still needs it. (Workspace `loadRemedies` is called from Life Areas' `onLoadRemedies`; Family's copy was reading the same state. Removing Family's render just means one fewer consumer.)

**Acceptance:**
- Family & Charts no longer renders a full remedies list or duplicate yogas panel.
- The "Remedies →" / "Forecast →" links land on the correct Life Areas sub-tab and that sub-tab is populated.
- `tsc` + `eslint` clean; no unused-import warnings.

### Phase 2 — Establish single homes for Remedies / Yogas / Forecast
**Goal:** confirm the canonical home renders the *full* artifact and every other surface links to it.

Steps:
1. **Remedies** canonical home = Life Areas `remedies` sub-tab (already exists via `NovaRemediesPanel`, backed by `GET /api/v1/charts/{chartId}/remedy-plan` + `/gemstone-advice`). No move needed — just confirm Phase 1 left Life Areas as the only full render. **Fix the load-on-click gap:** `NovaRemediesPanel` only fetches when its "Load" button is clicked, so a user who arrives from Family's "Remedies →" link sees an empty panel. Either (a) call `onLoadRemedies` automatically when the remedies sub-tab opens (a one-shot `useEffect` guarded by a `hasLoaded` ref so it doesn't refetch on every render), or (b) have the Family link-out set the target sub-tab AND trigger the load. Prefer (a) — it also helps direct `?tab=life-areas` visitors.
2. **Yogas & Doshams** — per **D1 (resolved)**, the canonical home is Family & Charts (member-selectable). Make Life Areas' `yogas` sub-tab a *link-out + activation-only* view: keep any "today's activation score" for a yoga if it's outcome-flavoured, but the full yoga/dosham catalog links to Family & Charts (via the renamed `onGoToChart`/`onGoToTransits` callback). Do **not** render the full catalog in both. Confirm the Family yoga section follows the selected member so a family member's yogas are reachable.
3. **Forecast (6/12-mo)** — currently lives **only** in Family (`HyLifeAreaForecast`, exported from `dashboard-hybrid-parts.tsx`). **Verified:** the columns are real backend scores (`score6mo`/`score12mo` per area) and the source data **already reaches the Life Areas tab** via the existing `lifeAreas={personal.lifeAreas}` prop — so **no backend change and no new fetch are needed.** To move it: import `HyLifeAreaForecast` into `dashboard-life-areas-tab-nova.tsx` and render it in the `predictions` sub-tab, passing `areas={lifeAreas?.areas ?? null}` and `age={currentAge}` (both already available in that file). Then reduce Family's copy to the compact preview + `onViewAll`/`onGoToLifeAreas` link. Render the full horizon in exactly one place.

**Acceptance:**
- Each of Remedies / Yogas / Forecast renders in full in exactly one tab.
- All other references are `HyActionButton`/link-out cards pointing to that tab.
- No `?tab=` change; no nav change.

### Phase 3 — Move "Best Dates & Muhurta" from Goals → Calendar
**Goal:** timing lives with the almanac. Calendar is already labelled "Transits & Events" (`tab_calendar`), so muhurta fits.

The panel is self-contained: `NovaPlanMuhurtaPanel` from `dashboard-plan-muhurta-nova.tsx`, props `{ lang, chartId }` (it internally embeds `dashboard-plan-muhurta-picker-nova.tsx`).

Steps:
1. In `dashboard-calendar-tab-nova.tsx`: add a "Best Dates & Muhurta" section (or sub-view) that renders `NovaPlanMuhurtaPanel` with `lang` and the personal `chartId`. Confirm `chartId` is already available to the calendar tab in `dashboard-workspace.tsx`; if not, pass `chartId={personal.chartId}` in the calendar render props (extend the component's prop type in the same change — §0.1 note about props being a hand-typed contract applies).
2. In `dashboard-plan-tab-nova.tsx`:
   - Remove `"muhurta"` from `PlanSubTab` union and `PLAN_SUB_TABS`.
   - Remove the `{subTab === "muhurta" && <NovaPlanMuhurtaPanel .../>}` render and its import.
   - Where Goals references best-dates (the existing `onGoToCalendar` link at line ~429), keep/repoint it to the new Calendar muhurta section.
3. Keep `dashboard-plan-muhurta-nova.tsx` and its picker file — they are now imported by Calendar, not Plan. Do **not** delete them.

**Acceptance:**
- Goals no longer shows a Muhurta sub-tab; its pill list has 4 entries.
- Calendar renders the muhurta picker and it computes for the active chart.
- `onGoToCalendar` from Goals lands on/near the muhurta section.
- No dangling import of `NovaPlanMuhurtaPanel` in the plan file.

### Phase 4 — Move Journal "context events" → Settings (profile input)
**Goal:** life-context inputs (job change, marriage, relocation) live where profile data lives, not inside a diary.

Context events currently live in `dashboard-journal-tab-nova.tsx` `write` sub-tab: state `ctxEventType`/`ctxEventDate`/`ctxEventNote`, handlers `handleAddContextEvent` / `handleRemoveContextEvent`, hitting `POST /api/v1/context`. Data flows through `contextData` + `onContextUpdated` props (owned by `useJournalData` → `journal.contextData` in workspace).

Steps:
1. Create/extend a Settings section (`dashboard-settings-session-tab.tsx` uses `SettingsSectionId`) to host a "Life context" block: the same add/remove UI and the same `POST /api/v1/context` calls. Reuse the shared types from `dashboard-journal-shared.tsx` (`ContextEventType`, `ContextEvent`) — do not fork them.
2. Wire `contextData` + `onContextUpdated` from the workspace into the Settings section (the workspace already owns `journal.contextData`). Keep the journal loader `journal.loadContextData(personal.chartId)` firing — Reflections still reads context.
3. In Journal `write` sub-tab: remove the context-event add/remove UI. **Decision D3:** either (a) remove entirely, or (b) leave a compact read-only "active life context" chip row with a "manage in Settings →" link. Recommended: **(b)** so the diary still shows what context the engine is using, without being the place you edit it.
4. Add a nav path: Journal's link (or Reflections' `onGoToTransits` area) can point to the new Settings section if useful — but at minimum ensure the Settings section is reachable from the settings rail.

**Acceptance:**
- Context events can be added/removed from Settings and persist (`POST /api/v1/context` succeeds).
- Journal no longer owns the editable context UI; Reflections/correlations still work.
- No orphaned handlers/state left in the journal file (eslint clean).

### Phase 5 — Slim Today's Deep Dive + kill the "transits" misnomer
**Goal:** Today becomes a true snapshot that links into the canonical deep-dive; remove dead "transits" wording.

Steps:
1. **Today Deep Dive:** replace the full-report render in `dashboard-today-tab-nova.tsx` with a compact summary + a "Full chart →" link to Family & Charts (`onGoToTransits` today already lands there; rename the callback — see next). Move any deep-dive-only components that Today alone used into Family & Charts if not already there. **Verify no data hook becomes orphaned** (Today may fetch dasha/varga data purely for the deep dive — if the deep dive is gone, gate or drop those fetches; if Family still needs them, leave them).
2. **Rename `onGoToTransits` → `onGoToChart`** (or `onGoToFamily`) everywhere it appears: `dashboard-plan-tab-nova.tsx`, `dashboard-life-areas-tab-nova.tsx`, `dashboard-journal-tab-nova.tsx`, `dashboard-today-tab-nova.tsx`, and the workspace render props. Update the visible link text that says "transits and dasa periods" / "See the transits behind them" to match where it actually goes.
3. Remove stale comments describing a `"transits"` nav id in `dashboard-hero.tsx` and `dashboard-plan-tab-nova.tsx`.
4. **Relabel `family` tab** (D2-a) so the name predicts its content, e.g. EN "Family & Chart", or split label per D2-b. Update `tab_family` in `i18n.ts` (both `ta`/`en`) and `labelEn` in `dashboard-hero.tsx`.

**Acceptance:**
- Today shows a snapshot; "Full chart →" lands on the populated deep-dive.
- No identifier or user-visible string implies a `transits` tab that doesn't exist.
- Grep `transits`/`Transits` in `web/components/dashboard-*.tsx` returns only legitimate astrology-domain uses (planetary transits), not nav references.

---

## 5. Files-to-touch matrix

| File | P1 | P2 | P3 | P4 | P5 |
|---|:--:|:--:|:--:|:--:|:--:|
| `web/components/dashboard-family-charts-hybrid.tsx` | ● | ● | | | ● |
| `web/components/dashboard-life-areas-tab-nova.tsx` | | ● | | | ○ |
| `web/components/dashboard-plan-tab-nova.tsx` | | | ● | | ● |
| `web/components/dashboard-calendar-tab-nova.tsx` | | | ● | | |
| `web/components/dashboard-journal-tab-nova.tsx` | | | | ● | ● |
| `web/components/dashboard-settings-session-tab.tsx` | | | | ● | |
| `web/components/dashboard-today-tab-nova.tsx` | | | | | ● |
| `web/components/dashboard-workspace.tsx` (render props, callbacks, fetch gating) | ○ | ○ | ● | ● | ● |
| `web/components/dashboard-hero.tsx` (labels/comments) | | | | | ● |
| `web/lib/i18n.ts` (`tab_*`, new labels) | | | ○ | ○ | ● |
| `web/lib/dashboard-tabs.ts` | | | | | — | (untouched under Option A — no new tab id) |

● = primary edit ○ = check/minor edit

---

## 6. Verification gate (run at the END of every phase)

```powershell
Set-Location 'D:\sanstro'
# Type + lint the web app
cd web ; npm run type-check ; if ($?) { npm run lint }
```
(Confirm the exact scripts in `web/package.json`; adjust if named `tsc`/`eslint`.)

Then a manual browser pass on each affected route:
```
http://localhost:3000/dashboard?tab=family
http://localhost:3000/dashboard?tab=plan
http://localhost:3000/dashboard?tab=life-areas
http://localhost:3000/dashboard?tab=journal
http://localhost:3000/dashboard?tab=calendar
http://localhost:3000/dashboard?tab=personal
```

**Dead-link self-check (must pass before calling a phase done):**
1. Grep every `onGoTo` callback; confirm each target id is in the `Tab` union.
2. Click every link-out you added; confirm it lands on a tab that renders the promised content populated (not an empty sub-tab).
3. Deep-link each `?tab=` above directly (fresh load, not just in-app nav) — confirms URL sanitizer + restore still resolve.
4. Toggle EN⇄TA on each touched surface; confirm no missing-key fallback and no title echo.
5. Confirm no console errors and no network call firing for a section you removed.

**Do not mark a phase complete on `tsc` alone** — cross-tab links and envelope shapes are invisible to the type checker (see memory: silent envelope-unwrap and hand-typed-URL drift classes).

---

## 7. [DORMANT — DO NOT EXECUTE] Future option: physical split into a new `chart` tab

> **D2 was resolved to Option A (2026-07-22). This section is NOT part of the current work.** It is kept only as a record of what a future physical split would involve. A coding agent executing this spec must **skip §7 entirely.**

Only if a future product owner picks the ambitious split. Adds a new tab id `chart`:
1. `web/lib/dashboard-tabs.ts`: add `"chart"` to the `Tab` union, `RESTORABLE_TABS`, and (via `URL_ADDRESSABLE_TABS` spread) URL-addressable set.
2. `web/lib/i18n.ts`: add `tab_chart` (`ta` + `en`).
3. `web/components/dashboard-hero.tsx`: add `{ id: "chart", labelEn: "My Chart", labelTaKey: "tab_chart" }` to `TAB_DEFS` (or `MORE_TAB_DEFS`).
4. `web/components/dashboard-workspace.tsx`: add a `{activeTab === "chart" && ...}` render branch. Decide what state it reads — it needs the same `selectedVaultId`/`memberCharts`/member-selector (`lifeAreasViewId`-style) the Family hybrid uses so "select a member → see their chart" still works. Reuse the existing member-selector state rather than adding a parallel one.
5. Physically move the `hy-charts`/`hy-planets`/`hy-dashas`/`hy-explain`/`hy-insights` sections out of `dashboard-family-charts-hybrid.tsx` into the new chart component; leave roster/household/connections in `family`.
6. Re-point every `onGoToTransits`/"Full chart →" link to `goToTab("chart")`.
7. Re-run the **entire** §6 gate, paying special attention to localStorage restore and `?tab=chart` deep-link.

**Risk note:** D2-b touches the shared Tab contract and the workspace's shared member-selection state. It is the only phase that can strand a bookmarked URL if done carelessly. If unsure, ship D2-a first and evaluate whether the split is still wanted.

---

## 8. Summary — what improves

- **Density:** the 1,313-line Family & Charts monolith drops its remedies/yogas/forecast bulk to link-outs; Today's Deep Dive shrinks to a snapshot.
- **Repetition:** Remedies, Yogas, Forecast, and the natal deep-dive each render in exactly one tab; everything else links to it.
- **Naming honesty:** Muhurta moves to Calendar (timing), context events move to Settings (profile input), the "transits" misnomer is gone, and the `family` tab name predicts its content.
- **Efficiency:** fewer duplicate renders and no duplicate/orphaned data fetches (Phase gating checks in §3.5 and §6.5).
- **Safety:** additive-before-subtractive per phase, an explicit dead-link self-check, and the shared Tab contract kept consistent — so the site can be shipped after any single phase.
