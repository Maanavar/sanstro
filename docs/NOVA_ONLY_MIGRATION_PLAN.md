# Nova-Only Migration Plan

**Decision (2026-07-10):** Nova becomes the *only* signed-in dashboard look. Classic is being fully removed — its components, routes, and the Classic/Nova toggle all go away once the work below lands. Alongside that, Nova gains a Light/Dark toggle (today it is hard-coded dark-only).

**Who this doc is for:** any agent picking this up cold, with no memory of the conversation that produced it. Read this whole doc before touching code — the phases have real ordering dependencies (you cannot safely delete Classic before Phase 1 and Phase 2 are done).

**Ground rule inherited from this repo's CLAUDE.md and its own history of stale-memory bugs:** every file path and line number below was verified against the `harden/production-readiness` branch on 2026-07-10. Code moves fast here — re-grep before trusting a line number, and treat anything phrased "as of 2026-07-10" as a claim to re-verify, not a fact to build on blind. Use PowerShell from `D:\sanstro` per the repo's CLAUDE.md; the grep recipes below are written for `rg`/Grep-tool syntax, adjust quoting for PowerShell if running by hand.

---

## 0. Orientation — how the two-mode system actually works today

Skip this section only if you already know it cold.

**Two independent toggles exist today, both `localStorage`-only, both client-side:**

- `web/hooks/useUiVariant.ts` — Classic vs Nova. Sets `data-ui="nova"` on `<html>` (absent = Classic). Storage key `vinaadi-ui-variant`.
- `web/hooks/useTheme.ts` — System/Light/Dark. Sets `data-theme="light"` / `data-theme="dark"` on `<html>` (absent = follow `prefers-color-scheme`). Storage key `vinaadi-theme`.

**Three CSS layers stack on top of each other, in this cascade order:**

1. **`packages/design-tokens/dist/web/tokens.css`** (generated, shared with mobile, do not hand-edit — regenerate via `node packages/design-tokens/build.js`). Defines the base token set: `--surface-0..5`, `--text-primary/secondary/tertiary/disabled`, `--accent`, `--accent-hover`, `--accent-subtle`, `--success/warning/error/info` (+ `-subtle` variants). Dark values live at bare `:root` (yes — the *base* default is dark: `--surface-0:#0D0F1A`, `--text-primary:#F0EBE0`, `--accent:#C9971C`). Light values are defined twice — once under `@media (prefers-color-scheme: light)` for system-follow, once again explicitly under `[data-theme="light"]` (wins over the media query) — both blocks currently identical: `--surface-0:#FAF7F2` down to `--surface-5:#B8AFA0`, `--text-primary:#1C1008`, `--accent:#C9971C` (same gold in both themes), `--overlay: rgba(28,16,8,0.5)`. `[data-theme="dark"]` re-asserts the dark values explicitly (wins over a light OS preference when the user picked Dark).
2. **`web/app/globals.css`** — aliases the base tokens into the `--color-*`/`--panel-*`/`--chart-*` names components actually use (`--color-text: var(--text-primary)`, `--color-accent: var(--accent)`, `--color-surface: var(--surface-1)`, etc., see lines ~116–130), plus a large number of **Classic-specific literal hex tokens that do NOT derive from the base system at all** (`--panel-brand:#B05220`, `--panel-cream:#FAF5EA`, `--chart-cell-default:#FFFFFF`, `--planet-*` colors, etc. — see lines 1–135). Also contains a ~400-line `.cd-shell` block with legacy `[style*="#hex"]` attribute-selector hacks patching old inline styles, already scoped to `html:not([data-ui="nova"])` so Nova doesn't see it.
3. **`web/app/dashboard/dashboard-nova.css`** (859 lines) — re-declares the same `--color-*`/`--radius-*` variable *names* from layer 2, but under `[data-ui="nova"] .cd-shell`, with **hard-coded dark hex values that ignore `data-theme` entirely** (lines 34–120+: `--color-bg:#221a2c`, `--color-surface:#2c2338`, `--color-accent:#d4af5f`, `--color-accent-strong:#e7c87e`, plus a 4-band score palette, semantic alert colors, and ~6 redirects of Classic-only chart/panel tokens onto Nova's own high/mid/low triplet). This block currently wins by selector specificity over layer 2 unconditionally — Nova today looks identical regardless of the Appearance (System/Light/Dark) setting. **This is the file Phase 1 restructures.**

**Settings UI today** (`web/components/dashboard-settings-session-tab.tsx`):
- "Look" card, lines 590–608: Classic/Nova pill toggle, calls `onUiVariantChange` (threaded from `useUiVariant`). **Removed entirely in Phase 3.**
- "Appearance" card, lines 610–644: System/Light/Dark pill toggle, calls `setTheme` from `useTheme`. Currently **disabled whenever Nova is active** — `opacity: uiVariant === "nova" ? 0.4 : 1`, `pointerEvents: "none"`, plus copy at line 638–643 saying "Nova is always dark — this setting doesn't apply." **Phase 1 removes this disable block; Phase 3 removes the now-dead `uiVariant` check entirely (Appearance is just always active).**

**Component split:** `web/components/dashboard-*-nova.tsx` (34 files as of 2026-07-10) render Nova's tabs; their Classic counterparts are the same base name without `-nova`. `dashboard-workspace.tsx` is the shared parent — it branches ~20+ times on `uiVariant === "nova"` vs `!== "nova"` to pick which tree to mount. Some tabs (Transits, most of Life Areas' scoring, Journal's CRUD) have no branch at all or import Classic's logic functions directly — those were already structurally safe. **Critically, many `*-nova.tsx` files import UI components, formatters, and constants directly from their non-`-nova` counterpart** — e.g. `dashboard-today-deepdive-extras-nova.tsx` imports `ChandrashtamaCard` from `dashboard-personal-tab.tsx`. Deleting a "Classic" file without checking this first will break Nova. Phase 3 opens with a mandatory dependency audit for exactly this reason.

---

## Phase 1 — Give Nova a real Light/Dark toggle (colors only, layout untouched)

**Goal:** Nova's structural CSS (nav shape, spacing, radii, card chrome, typography) stays exactly as-is regardless of theme. Only the *color* custom properties change between Nova-dark (today's look, unchanged) and Nova-light (new). **Nova-light reuses Classic's existing light token values — do not invent a new palette.** That means: don't hand-author new hex codes for `--color-bg`, `--color-surface`, `--color-text`, `--color-accent`, etc. under the light state — let those fall through to what layer 2 already resolves them to (which itself resolves from layer 1's `[data-theme="light"]` block). Nova's light mode should look like Classic's actual light palette (warm cream surfaces, near-black warm text, `#C9971C` gold accent — **not pure white**, matching how Classic's own light theme is already built), wrapped in Nova's layout.

### 1a. Split `dashboard-nova.css`'s color block by theme

In `web/app/dashboard/dashboard-nova.css`, the `[data-ui="nova"] .cd-shell` block (starts line 34) currently mixes two kinds of rules:
- **Structural** (`--cd-container-max`, radii, spacing if any) — must stay unconditional under `[data-ui="nova"] .cd-shell`.
- **Color** (`--color-bg`, `--color-surface*`, `--color-border*`, `--color-text*`, `--color-accent*`, `--color-score-*`, `--color-high/mid/low*`, `--color-alert-*`, `--color-positive`, the `--chart-d9-active-bg`/`--panel-warm-tint`/`--cl-*` redirects) — must move under a theme-conditional selector.

Concretely: rename the existing block's selector from `[data-ui="nova"] .cd-shell` to `[data-ui="nova"]:not([data-theme="light"]) .cd-shell` for the color portion (keep it as the default/dark state — covers `data-theme="dark"` and the no-attribute "system" case, since Nova's default should stay dark when following system, matching today's behavior). Leave structural rules under the original unconditional `[data-ui="nova"] .cd-shell` selector so they keep applying in both themes. Read the whole file first — there may be more color-bearing rules further down past line 120 (it's 859 lines total; only the first 120 were inspected while writing this doc) that also need to move.

### 1b. Add the Nova-light block

New selector: `[data-ui="nova"][data-theme="light"] .cd-shell`. For every `--color-*` name that has a direct Classic equivalent already aliased in `globals.css` (layer 2), **do not redeclare it** — just omit it from this block so it inherits Classic's light mapping naturally via the cascade (Classic's alias already resolves to the base token system's `[data-theme="light"]` values). That covers at minimum: `--color-bg`/`--color-surface`/`--color-surface-2`/`--color-surface-3`, `--color-border`/`--color-border-strong` (check what Classic's light `--color-border` actually resolves to — it's `var(--surface-5)` per the alias, `#B8AFA0` under light), `--color-text`/`--color-text-strong`/`--color-muted`/`--color-faint`, `--color-accent`/`--color-accent-strong` (Classic's light accent is `#C9971C` — a warmer, slightly darker gold than Nova-dark's `#d4af5f`/`#e7c87e`; this is expected and correct, not a bug).

For Nova-exclusive tokens that have **no Classic counterpart** (nothing to fall through to — must be hand-tuned for light-on-cream instead of light-on-plum), give each an explicit light-safe value in this new block:
- `--color-bg-glass`, `--color-bg-glass-97`, `--color-hover-bg` (currently gold-tinted overlays tuned for a dark base — need cream-appropriate low-opacity values)
- `--color-on-accent` (currently `#221a2c`, dark plum text on gold buttons — check whether that still has enough contrast against the light accent `#C9971C`; likely fine as-is since gold is mid-tone, but verify)
- `--color-accent-alt`, `--color-accent-secondary`, `--color-accent-secondary-muted`
- The 4-band score palette: `--color-score-high/mid/low`, `--color-score-strong/good/fair/weak`, `--color-high/mid/low` + their `-bg`/`-border` variants, `--color-alert-critical`, `--color-alert-caution`, `--color-positive` — these are currently tuned as translucent overlays that read correctly on a `#221a2c`-family dark base; the same rgba alpha values will likely look washed-out or too pale on a `#FAF7F2`-family light base. Re-tune each for contrast on light, keeping the same hue family (green=good, amber=mid, red/coral=low) so score meaning stays legible — this is the same "semantic color, not the accent hue" rule the rest of the app already follows.
- The Classic-token redirects (`--chart-d9-active-bg`, `--chart-d1-lagna-bg`, `--panel-warm-tint`, `--cl-sage-edge`, `--cl-rust-edge`, `--cl-rust-30`, `--cl-sage-border`, `--cl-rust-35`) — these were pointed at Nova-dark's own high/mid/low tokens specifically because Classic's originals didn't read correctly on a dark base. Under Nova-light, decide per-token whether to point back at Classic's original light-tuned values (likely correct now, since we're light-on-light again) or keep pointing at Nova-light's own high/mid/low triplet from the bullet above — check each visually, don't assume.

### 1c. Re-enable the Appearance toggle for Nova

In `dashboard-settings-session-tab.tsx`:
- Remove the `opacity`/`pointerEvents`/`aria-disabled` block gated on `uiVariant === "nova"` (lines ~618–626).
- Remove the "Nova is always dark" conditional message block (lines ~638–644).
- Update the "Look" card's description copy (line 593–596) — it currently says "Nova... it's always dark, regardless of the Appearance setting below," which becomes false.
- The System option must resolve correctly for Nova too — verify `useTheme`'s `applyTheme("system")` (removes `data-theme` attribute) correctly falls through to `@media (prefers-color-scheme)` under `[data-ui="nova"]:not([data-theme="light"])`'s selector. Since that selector matches whenever `data-theme` isn't explicitly `"light"`, System-preference-is-light won't be picked up by CSS alone (the selector only checks the attribute, not the media query) — decide whether Nova's System mode should read the OS preference via a small `@media (prefers-color-scheme: light)` block scoped to `[data-ui="nova"]:not([data-theme]) .cd-shell`, mirroring how layer 1 does it, or whether Nova's System default should just stay dark until the user explicitly picks Light. Pick one, document the choice in a code comment, verify by toggling OS light/dark with System selected.

### 1d. Fix components with hard-coded hex instead of token references

Grep for the failure mode first:

```
rg "#[0-9a-fA-F]{3,6}" web/components/*-nova.tsx web/app/dashboard/dashboard-nova.css -l
```

Any Nova component rendering a literal hex color inline (not via `var(--color-*)`) will not respond to the new light toggle — it'll stay whatever color it was hard-coded as. Triage each hit: legitimate cases are truly theme-invariant colors (e.g. a planet's fixed semantic color that's meant to look the same in both themes) vs. bugs (a `--color-*`-equivalent value that should have been a variable reference). Fix the bugs.

**Known existing leak, fix as part of this phase:** `PlaceCombobox` (the location-override search dropdown, used in Calendar and elsewhere) reads Classic-only hard-coded tokens (`--chart-cell-default`, `--panel-earth`, `--panel-hover`) and currently renders with Classic's cream input styling even when Nova-dark is active — flagged as an accepted cosmetic gap in the original Nova build (`docs/DASHBOARD_UI_REVAMP_PLAN.md` line ~241) precisely because it was low-priority while Classic still existed as an escape hatch. Once Nova is the only mode and gets a real light theme, this accidental "looks like Classic-light no matter what" behavior must become deliberate: make `PlaceCombobox` read Nova's `--color-*` tokens so it correctly shows Nova-dark under dark and Nova-light (not literally identical to old Classic, even if visually close) under light.

### 1e. Verify

- `tsc` and `eslint` clean.
- Live in the dev server: toggle Look=Nova, then cycle Appearance through System/Light/Dark. Confirm: layout/spacing/nav identical across all three; colors change only; Light is a warm cream/gold look (not pure white, not identical to Nova-dark with colors merely inverted); score bands, alert chips, and accent buttons stay legible and correctly green/amber/red-coded in both themes; `PlaceCombobox` matches whichever theme is active.
- Re-run `scripts/audit-color-literals.mjs` if it exists (see repo memory on this script) — new hard-coded hex introduced by this phase should show up as new findings, not be silently added to the baseline.

---

## Phase 2 — Close Nova's remaining feature gaps (must finish before Phase 3)

Classic cannot be deleted until Nova can do everything Classic could. Most of this was already closed in the three days before this doc was written (2026-07-08 through 2026-07-10) — this phase is about the remainder, plus final confirmation.

### 2a. The standalone dashboard routes

These live outside the tabbed `dashboard-workspace.tsx` shell as their own pages and, as of the last check, still render with Classic's chrome regardless of the Look setting:

```
web/app/dashboard/reports/page.tsx
web/app/dashboard/goals/page.tsx
web/app/dashboard/chart-generate/page.tsx
web/app/dashboard/daily-score/page.tsx
web/app/dashboard/porutham/page.tsx
web/app/dashboard/wrapped/page.tsx
```

For each: check whether it already conditionally renders based on `uiVariant`/`data-ui` (grep the file for `uiVariant`/`useUiVariant`/`data-ui` — as of 2026-07-10 none of the six matched, meaning none currently branch at all). Give each page Nova-equivalent chrome (reuse `dashboard-ui-nova.tsx` primitives and the `.cd-shell`/Nova nav pattern the tabbed dashboard already uses) before Phase 3, since after Classic removal there's no fallback for these routes to keep looking like Classic — they simply won't have anywhere else to inherit a look from.

### 2b. Re-verify previously-flagged "unresolved" items

An earlier parity audit (2026-07-08) flagged three items as open/unverified. A grep done while writing this doc (2026-07-10) suggests **the option-array item is likely already fixed** — `dashboard-plan-muhurta-nova.tsx` imports `ACTIVITY_OPTIONS`/`ACTIVITY_TO_MUHURTA` directly from `dashboard-plan-tab.tsx`, `dashboard-plan-whatif-nova.tsx` imports `WHATIF_OPTIONS` from the same file, and `dashboard-plan-decisions-nova.tsx` imports `SCENARIO_GROUPS` from `dashboard-decision-panel.tsx` — real imports, not copy-pasted arrays. Confirm this by diffing rather than trusting either audit blindly. Still needing a fresh look:

- **Nova's Plan dasha-timeline view** (`dashboard-plan-transits-nova.tsx` or wherever the dasha timeline renders under Plan) — check whether it's missing per-bhukti score/age display and the 90-year cap that Classic's equivalent view has.
- **Family compatibility-button visibility** — a narrow edge-case condition difference flagged between Nova and Classic's synastry/compatibility entry point; re-locate and confirm current behavior.

### 2c. Content review debt (parallel track, does not block Phases 1/3)

Three dosham guides (`rahu-ketu-dosham`, `badhaka-dosham`, `marana-karaka-sthana` in `web/lib/guide-detail-content.ts`, gated by `DRAFT_GUIDE_SLUGS`) and three nakshatra English translations (`ashlesha`, `magha`, `purva-phalguni` in `web/lib/natchathiram-data-en.ts`) are marked draft, grounded in the detection code but not reviewed by an astrologer or a Tamil-fluent content reviewer. This doesn't block making Nova the only mode — the content already renders in Nova today — but schedule the review, since after Classic's removal Nova is the *only* place a user sees this content (no Classic fallback to quietly prefer).

### 2d. Final `uiVariant` branch inventory

Before starting Phase 3, grep every remaining branch point and confirm each has a working, verified Nova-side implementation:

```
rg 'uiVariant (===|!==) "nova"' web/components/dashboard-workspace.tsx -n
```

(As of 2026-07-10 this returns ~20 matches covering Today/Personal, Family, Calendar, Life Areas, Plan, Journal, Explore.) For each, load the app with Look=Nova and exercise that tab/sub-tab live — don't rely on a prior audit's "confirmed working" without re-checking, since the components have changed since.

---

## Phase 3 — Remove Classic

Only start this phase once Phase 1 is verified live and Phase 2's checklist is fully green.

### 3a. Mandatory dependency audit — do this first, every time, before deleting anything

Nova components import UI pieces, formatters, and constants directly from their Classic-named counterparts. Deleting the Classic file breaks Nova's build. Run this before touching any file:

```
rg -o 'from "\./dashboard-[a-zA-Z0-9-]+"' web/components/*-nova.tsx | sort -u | grep -v nova
```

As of 2026-07-10, this returns 27 non-`-nova` `dashboard-*.tsx` files that at least one Nova component depends on, plus (via a broader sweep) `chart-generate-inline-panel.tsx`, `glossary-term.tsx`, and `synastry-matrix.tsx`. **Do not assume this list is exhaustive or still accurate — re-run it fresh.** Known-heavy dependencies worth checking first, because they mix genuine Classic-UI rendering code with exports Nova actually needs:

| File | Known Nova dependents (2026-07-10) | What Nova actually needs from it |
|---|---|---|
| `dashboard-yoga-dosham-panel.tsx` | dosham/yogam/explore-tab/family-member/life-areas-yogas-doshams nova files | `YOGA_DISPLAY`, `displayName`, `getWhat`, `strengthBand`, `resolveYogaKey` — utility exports, not its Classic-styled `YogaDoshamPanel` component itself |
| `dashboard-calendar-tab.tsx` | family-tab, explore-nakshatram, calendar-monthly, calendar-tab, today-deepdive-extras (all -nova) | `formatHeaderDate`, `getTamilMonthDate`, `moonRasiFromNakshatra`, `rasiName`, `CalendarView` type, `formatChandrashtamaWindowSummary` |
| `dashboard-family-tab.tsx` | family-tab-nova, charts-panel-nova | `ScoreRing`, `formatRelLabel`, `MemberDetailExpanded`, `FamilySevenDayOutlook`, `ageFromBirth`, `DasaBhuktiAntaramDetail` |
| `dashboard-personal-tab.tsx` | charts-panel-nova, today-deepdive-extras-nova | `downloadJadhagamPdf`, `ChandrashtamaCard`, `GUIDANCE_REASON_KEYS` |
| `dashboard-plan-tab.tsx` | life-areas-tab-nova, plan-tab-nova, plan-muhurta-nova, plan-whatif-nova | `GOAL_OPTIONS`, `ACTIVITY_OPTIONS`, `ACTIVITY_TO_MUHURTA`, `verdictKey`, `strengthKey`, `WHATIF_OPTIONS`, others |
| `dashboard-decision-panel.tsx` | plan-decisions-nova | `SCENARIO_GROUPS` |
| `dashboard-life-areas-tab.tsx` | life-areas-tab-nova | `isAreaRelevantForAge` |
| `dashboard-journal-tab.tsx` | journal-tab-nova | `ContextEventType`, `LifeArea` types + other named exports |
| `dashboard-ui.tsx` | journal-tab-nova, charts-panel-nova, today-deepdive-extras-nova, tools-porutham-nova | `Chip`, `Surface`, `Metric`, `Field` — base primitives, likely genuinely shared rather than Classic-skinned; probably safe to keep as-is rather than split |

The other ~18 files in the raw grep output (`dashboard-dasha`, `dashboard-charts`, `dashboard-vargas-panel`, `dashboard-shadbala-panel`, the dasha-system panels, `dashboard-chart-explanation`, `dashboard-prasna-widget`, `dashboard-activity-timing-card`, `dashboard-event-windows`, `dashboard-jadhagam-report-panel`, `dashboard-share-card`, `dashboard-retrospective-panel`, `dashboard-prediction-panel`, `dashboard-annual-wrapped`, `dashboard-life-event-log`, `dashboard-learn-content`, `synastry-matrix`, `glossary-term`, `chart-generate-inline-panel`) did not show up in the earlier per-tab parity audits as having a `-nova` fork at all — they're likely genuinely shared, uiVariant-agnostic components (same category as Transits). Confirm each has no `uiVariant`/`data-ui` branch inside it before assuming it's safe to leave untouched.

### 3b. Extract, then delete

For every file in the table above: move the specific exports Nova needs into a neutral module (e.g. co-locate into the relevant `-nova.tsx` file if only one consumer, or a new small shared file like `dashboard-calendar-shared.ts` if many consumers need it) — do not just delete the Classic-only rendering component (e.g. the actual `<YogaDoshamPanel>` JSX, `<DashboardPersonalTab>` JSX) and leave the file's non-JSX exports orphaned. Once extraction is done and Nova's imports are repointed, the original file should contain only Classic-exclusive JSX/rendering code with zero remaining inbound references — verify with:

```
rg 'from "\./dashboard-personal-tab"' web/components/*-nova.tsx web/app
```

(repeat per filename) before deleting it.

### 3c. Delete confirmed-orphaned Classic files and routes

Once the dependency audit shows zero Nova/route references, delete the Classic-only component files (e.g. `dashboard-personal-tab.tsx`'s remaining JSX-only shell, `dashboard-today-tab.tsx`, `dashboard-left-rail.tsx`, `dashboard-hero.tsx` if it turns out Nova's topnav fully replaced it, `dashboard-explore-tab.tsx`'s Classic nav-hub version, etc.) and any Classic-only sub-routes superseded in Phase 2a.

### 3d. Collapse `dashboard-workspace.tsx`

Every `{uiVariant === "nova" && <NovaX/>}` / `{uiVariant !== "nova" && <ClassicX/>}` pair becomes an unconditional `<NovaX/>`. Remove the `useUiVariant` import and the `uiVariant`/`setUiVariant` plumbing threaded through props. Delete `web/hooks/useUiVariant.ts`.

### 3e. Remove the Settings "Look" card

Delete the card at `dashboard-settings-session-tab.tsx` lines ~590–608 (exact lines will have shifted after Phase 1's edits — re-locate by searching for `"Look"` / `பார்வை பாணி`). Remove the now-fully-unconditional Appearance card's leftover references to `uiVariant`, if any remain after Phase 1.

### 3f. Simplify the `data-ui="nova"` gate — recommended approach: keep it, always-on

Rewriting all ~859 lines of `dashboard-nova.css`'s selectors to drop `[data-ui="nova"]` scoping is high-risk (CSS specificity is easy to break silently) for very little benefit. Simpler and safer: keep every selector as-is, and just make `data-ui="nova"` permanently present — set it directly in `web/app/layout.tsx`'s FOUC-prevention script and anywhere else `<html>` is rendered, instead of reading it from `useUiVariant`/localStorage. This makes Nova's CSS "always match" without touching the CSS file at all. Only revisit a full de-scoping rewrite later, as separate cleanup, if there's a concrete reason (e.g. bundle-size or specificity conflicts) to do so.

### 3g. Clean up Classic-only dead weight in `globals.css` — do last, lowest priority

The ~400-line `.cd-shell` block of legacy `[style*="#hex"]` attribute-selector hacks (scoped to `html:not([data-ui="nova"])`) and the Classic-specific literal-hex tokens (`--panel-brand`, `--panel-cream`, etc.) that never fed Nova become dead code once nothing ever lacks `data-ui="nova"` (per 3f). Confirm nothing still reads them (some may be shared with marketing/public pages outside the dashboard — the existing Nova CSS comments flag `tamil-calendar` and `jadhagam-generator` marketing pages as consumers of some of these tokens, so **do not delete tokens used outside the dashboard**). Only remove what's confirmed dashboard-and-Classic-only.

### 3h. Test and doc cleanup

- `web/e2e/nova-sweep.spec.ts` becomes the primary (arguably only) dashboard e2e suite — consider renaming and making it a permanent, CI-run spec rather than a disposable one-off.
- Check `web/e2e/verify-ui-fixes.spec.ts` for Classic-specific assertions that no longer apply; update or remove.
- Update `docs/DASHBOARD_UI_REVAMP_PLAN.md` to reflect Nova-only status — it's the existing durable source of truth for this feature and should not be left describing a two-mode system that no longer exists.
- Search the codebase for remaining user-facing strings mentioning "Classic" (`rg -i '"classic"' web/lib/i18n.ts web/components`) and remove.

### 3i. Verify

Full sweep: `tsc`, `eslint`, `vitest` all clean; `nova-sweep.spec.ts` green; manual click-through of all tabs + all 6 former standalone routes in both Light and Dark; confirm no `/dashboard*` route renders unstyled or falls back to any remaining Classic CSS; confirm Settings no longer shows a Look toggle and Appearance always works.

---

## Suggested execution order

1. Phase 1 (theme toggle) — self-contained, ships value on its own, lowest risk.
2. Phase 2 (gap closure) — some of it may already be done; confirm, don't re-do blindly.
3. Phase 3 (removal) — only after 1 and 2 are verified live, not just type-checked.

Each phase should get its own PR/commit(s) and its own live-browser verification pass before starting the next — this repo's own history (two separate Nova/Classic parity audits three days apart) shows that "looks done in the diff" and "verified working live" are not the same thing here.
