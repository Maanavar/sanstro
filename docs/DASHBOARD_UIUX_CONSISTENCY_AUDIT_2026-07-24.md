# Dashboard UI/UX Consistency Audit — 2026-07-24

> Full audit of every dashboard tab/component in the current working tree (incl. uncommitted edits to Today Glance / Today Tab / Workspace).
> Method: read directly from source (`web/components/dashboard-*.tsx`, `web/components/ui/`, `web/app/globals.css` + token layer). Numbers below are grep/AST counts, not impressions.
> Scope: ~70 `dashboard-*.tsx` files, 37,554 LOC, 9 navigable tabs + deep-dive panels.
> **Audit-only. No code changed.**

---

## TL;DR

The dashboard is **well-designed at the layout level and fragmented at the system level.** Individual screens have genuine craft — clear heroes, thoughtful IA, good bilingual copy, real motion. But underneath, the same button/card/kicker/field is built **7 different ways**, and the font scale is essentially freehand. A proper token layer and a shared component kit both exist — they're just bypassed 80–90% of the time.

**The single biggest issue:** a keystone `Card`/`Segmented`/`Button`/`Pill` kit was built (2026-07-23) *specifically* to replace the hand-rolled chrome — and rollout stalled at **4 of ~13 surfaces**. The dashboard is now in a half-migrated state where two-to-seven visually-similar-but-not-identical systems coexist. That's harder to keep consistent than either extreme.

**Overall grade: B−.** Screen craft is A−/B+; system consistency is C. The gap between them is the whole story.

---

## Part 1 — Objective inconsistency findings (measured)

### 1.1 Font size — the worst offender

A clean 7-step type scale **exists** (`--text-*` in the token layer):

| token | value | | token | value |
|-------|-------|---|-------|-------|
| `--text-xs` | 11px | | `--text-md` | 16px |
| `--text-sm` | 12px | | `--text-lg` | 20px |
| `--text-base` | 14px | | `--text-xl` | 26px |
| | | | `--text-2xl` | 34px |

**It is used ~12% of the time.** Real counts across the dashboard components:

- **194** uses of `var(--text-*)` — and **179 of those are just `--text-xs`**. The rest of the scale (`sm`/`base`/`md`/`lg`/`xl`) is used **15 times total**.
- **1,483** raw font-size literals (854 px + 629 rem) bypassing the scale entirely.
- **~55 distinct font-size values** in use, e.g. px: 8, 10, 11, **11.5**, 12, **12.5**, 13, **13.5**, 14, **14.5**, 15, **15.5**, 16, 17, 18, 20, 21, 22, 24, 26, 27, 30, 32, 34; rem: 0.62, 0.625, 0.65, 0.65625, 0.68, 0.6875, 0.7, 0.72, 0.74, 0.75, 0.78, 0.8, 0.8125, 0.82, 0.83, 0.85, 0.875, 0.9, 0.9375, 1, 1.1, 1.125, 1.15, 1.25, 1.4, 1.5, 1.6, 1.8, 2, 2.2, 2.8.

Three compounding problems:
1. **Unit-mixing for identical sizes.** `12px` (188×) *and* `0.75rem` (171×) both = 12px. `14px` (68×) *and* `0.875rem` (188×) both = 14px. The same size is expressed two ways, thousands of times.
2. **Half-pixel freehand steps.** `11.5` (76×), `12.5` (145×), `13.5` (22×), `14.5` (7×) map to **no** scale step — they're eyeballed.
3. **Seven sizes doing one job.** Between 11px and 14px there are 7 distinct "small body/label" sizes (11, 11.5, 12, 12.5, 13, 13.5, 14) plus their rem twins.

**Worst single example** — the Journal "New entry" card expresses small text *five ways* in one component: `11px`, `0.75rem`, `0.625rem`, `12.5px`, `var(--text-xs)`.

### 1.2 Color — 5 CSS namespaces + 2 JS palette objects

Coexisting semantic-color systems for the same roles:

| namespace | uses in components | origin / intent |
|-----------|-------------------:|-----------------|
| `--color-*` | 2,921 | Nova (intended primary) |
| `--panel-*` | 338 | Classic "warm parchment" |
| `--text-*` | 195 | Design Constitution canonical (barely used) |
| `--deepdive-*` | 82 | component-scoped deep-dive set |
| `--cl-*` | 56 | public "Clarity" pages, leaking into dashboard |

Plus **two local JS color objects** that never touch the token layer:
- `dashboard-setup-tab.tsx` — a `W` object (`W.ink`, `W.muted`, `W.sage`, `W.terracota` *[sic — misspelled]*, `W.borderLt`…).
- `dashboard-settings-session-tab.tsx` — a `C` object (`C.card`, `C.border`, `C.accent`, `C.dangerBg`…).

And **raw literals still in component files** despite the Constitution's "no hex/rgba in components — ever": **69 hex** across 18 files, **96 rgba()** across 25 files (worst: `share-card` 19 rgba, `hybrid-parts` 18 hex / 10 rgba, `yoga-dosham-panel` 10 rgba, `setup-tab` 10 rgba). Some are legitimate (SVG/canvas gradient stops), many are not.

### 1.3 Structure — no universal primitive; the kit stalled at 30%

A shared kit exists at `web/components/ui/`: `Card`/`Panel`, `Button`/`Pill`, `Segmented`, `BilingualText`, `Score`. Its own source comment states the mission:

> *"Replaces the ad-hoc bordered `<div style={{ background, border, borderRadius, padding }}>` repeated hundreds of times across the tab files (roughly half of the 654 inline styles the audit counts)."*

**Adoption: 4 of ~13 surfaces** import `./ui` — Calendar, Plan, Life Areas, Journal. **Not adopted:** Today, Explore, Tools, Family & Charts, Setup, Settings-session, and every deep-dive panel.

Consequences, measured across the tree:
- **368** hand-rolled `1px solid …` border declarations (card chrome, inline).
- **532** padding literals vs **169** `var(--space-*)` — padding is ~76% un-tokenized (spacing tokens exist and are otherwise used 771×).
- **669** hardcoded `gap` literals.
- **220** copy-pasted uppercase "kicker" headers (`textTransform:"uppercase"` inline) — no shared `<SectionHeader>`.
- **`NovaKicker` is defined 4 separate times** (identical signature) in `explore-detail`, `explore-tab`, `family-harmony-remedies`, `family-member`. A local `Card` is defined 2 more times (`family-member`, `settings-session`).

**Seven parallel component systems for the same primitives:**
1. Classic `dashboard-ui.tsx` — CSS-class based (`.metric`, `.chip`, `.button`), `--panel-*` tokens.
2. Nova `dashboard-ui-nova.tsx` — inline-style based, `--color-*` tokens.
3. Shared kit `ui/` — `.ui-*` classes (the intended future). 4 adopters.
4. Family `Hy*` — `HyKicker`, `HySection`, `HyProfileCard`… in `dashboard-hybrid-parts.tsx`.
5. Setup `W*` — `WField`/`WInput`/`WSelect`/`StepBtn`/`GhostBtn` + `W.*` palette.
6. Settings `C.*` + locally-redefined `Card`/`Segmented`/`Chip`/`Toggle` (a duplicate of the kit's `Segmented`).
7. Per-file loose consts — `kickerStyle`, `fieldStyle`, `novaDetailCardStyle`, `cardStyle`.

**Card radius/padding never agree:** radius seen as `10px`, `11px`, `14px`, `16px`, `var(--radius-md)`, `var(--radius-lg)`, and the `.ui-card` class value; padding as `20px 22px`, `20px 24px`, `24px 26px`, `13px 15px`, `var(--space-*)`. There is no single "card."

### 1.4 Fonts (families) — mostly OK, one split + one bad fallback

Family usage is *relatively* clean: `inherit` (186), `var(--font-body)` (65), `var(--font-display)` (61), `var(--font-nova-prose)` (14), `var(--font-mono)`/`monospace` (10), `var(--font-tamil)` (3). Two issues:
- **`--font-nova-prose` vs `--font-body`** are both in play for prose — pick one per context and document it.
- **Bad fallback:** `settings-session` uses `var(--font-body, Georgia, serif)` — a **serif** fallback for a **sans** body font. If the var ever fails to resolve, that block flips to Georgia.

### 1.5 Accessibility & semantics

- **Multiple `<h1>` per page.** `today-tab-nova` renders **4 `<h1>`**; Explore/Calendar/Tools/Family/Settings each render 2. A page should have exactly one `<h1>`.
- **Skipped heading levels.** `setup-tab` goes `<h1>` → `<h3>` (no `<h2>`); `today` has h1+h2 but deep-dive content isn't headed. Only **Life Areas** nests cleanly (h1→h2→h3).
- **Icon/glyph buttons under-labeled.** Only **30** `aria-label` across 70 files, against hundreds of glyph-only affordances.
- **Emoji + glyph affordances violate the "no emoji / Lucide-only" rule.** `🪐` emoji in Plan; UI arrows/actions rendered as Unicode glyphs — `→` (207×), `✦` (30×), `⚠` (20×), `✕` (7×), `↗`, `◆`, `⌕`, `›` — instead of Lucide `ArrowRight`/`X`/`AlertTriangle`/`Search`. Lucide *is* used elsewhere (Tools icons, Field check/alert), so this is a mix, not a policy.

### 1.6 Responsive & motion

- **Fluid type is rare:** `clamp()` appears **19 times** total — consistent with fixed-px sizing that doesn't scale. Page `<h1>`s use it; body/label text doesn't.
- **Grid helpers exist but are used sparingly:** `nova-grid-2` (9), `nova-grid-detail` (6), `nova-grid-3` (5), others (6). Most layout is inline flex/grid with fixed gaps.
- **Motion primitives are good and shared:** `NovaReveal`, `NovaFadeIn`, `NovaScoreDial` count-up, reduced-motion honored. This layer is the healthiest part of the system.

---

## Part 2 — Per-page ranking

Grades weight: consistency-with-system (40%), layout/craft & hierarchy (30%), a11y/semantics (20%), code quality (10%).

| Rank | Page | Grade | Why |
|------|------|-------|-----|
| 1 | **Life Areas** | **A−** | Only tab with correct h1→h2→h3 nesting. Adopts the shared kit (`Segmented`, `Pill`, `Card`). Nurturing, non-clinical tier framing. Member switcher + accessible sub-nav. Most system-disciplined screen. |
| 2 | **Plan** | **B+** | Adopts kit (`Segmented`, `Card`), single `<h1>`, clear hero + sub-nav, strong empty states and "nearest supportive window" hero. Still px-sprawls. |
| 3 | **Explore** | **B+** | Excellent hero + search + "start from your chart" cards; good token-driven local `cardStyle`. But hand-rolls everything (own `NovaKicker`), 2× `<h1>`, heavy px sprawl. |
| 4 | **Journal** | **B** | Clean two-column write/patterns layout, kit `Card`, good streak/prompt UX. Undercut by 5-ways-to-size-text in one card + local `kickerStyle`/`fieldStyle`. |
| 5 | **Calendar** | **B** | Adopts kit, consistent `--color-*` usage, solid festival/timing rows. Very large (1,111 LOC), dense, many local row components, px sprawl. |
| 6 | **Today** (flagship) | **B** | Visually the richest decision layer — hero verdict, best/avoid/horai rail, timeline ribbon, activity board, IA comments are exemplary. But **4× `<h1>`** (worst heading hygiene), most fragmented delegation (6 sub-components each self-styled), glyph affordances, px sprawl. Craft A−, hygiene C. |
| 7 | **Tools** | **B** | Clean, well-gated card grid (`needsProfile`), consistent local `cardStyle`. 2× `<h1>`, hand-rolled, cross-nav vs inline-tool cards blur. |
| 8 | **Family & Charts** (hybrid) | **B−** | The most feature-rich surface (planet orbs, bhava table, bhukti timeline, forecast). Also the **most fragmented single file**: its own `Hy*` system **+** Classic `Chip`/`Surface` **+** Nova dial, 2× `<h1>`, ~70 font-size literals (highest in the tree). |
| 9 | **Settings / Setup** | **C+** | Setup is genuinely thorough (stepper, status chips, data-custody reassurance at the fear point). But Setup runs a private `W.*` palette + `W*` primitives, and Session runs a private `C.*` palette + duplicate `Card`/`Segmented`/`Chip`/`Toggle`. Two sub-tabs, two bespoke design systems, serif body fallback. Furthest from the system. |
| — | **Deep-dive panels** (charts, shadbala, vargas, synastry, yogini/ashtottari/kalachakra/conditional dashas, yoga-dosham) | **B−** | Internally consistent with each other (Nova inline pattern) but the densest hardcoded-value cluster: `synastry` 51 px sizes, `yoga-dosham` 10 hex + 10 rgba, `chart-explanation` 79 px sizes. Tables and dense data, little kit adoption. |

---

## Part 3 — Recommended remediation (when you're ready to fix)

> **The full execution playbook** — A+ acceptance rubric, primitive build specs, font snap table, color-collapse mapping, per-screen punch lists, codemod recipes, and CI guard greps — is in `DASHBOARD_A_PLUS_EXECUTION_PLAYBOOK_2026-07-24.md`. The list below is the summary; the playbook is the build doc.

Ordered by leverage. All are mechanical/low-risk except where noted.

1. **Finish the kit rollout** (highest leverage). Migrate Today, Explore, Tools, Family, Setup, Settings, and panels onto `web/components/ui/` `Card`/`Button`/`Pill`/`Segmented`. Delete the 4× `NovaKicker` and 2× local `Card` in favor of a kit `Kicker`/`SectionHeader` (add one — it's missing). Retire the Setup `W.*` and Settings `C.*` palettes.
2. **Codemod font sizes onto `--text-*`.** Map `11/11.5→xs`, `12/12.5/0.75rem→sm`, `13/13.5→sm`, `14/14.5/0.875rem→base`, `16→md`, `20→lg`, `26→xl`, `32/34→2xl`. Snap the half-steps to the nearest token. Kills ~1,300 literals and the px/rem split in one pass. **Needs a design sign-off on the snap table** (a few 13.5s may want to be `base` not `sm`).
3. **One heading per page.** Downgrade the extra `<h1>`s (Today's 3 extras, and the 2× tabs) to `<h2>`/`<h3>`; fill the skipped `<h2>` in Setup.
4. **Swap glyph affordances → Lucide** (`→`→`ArrowRight`, `✕`→`X`, `⚠`→`AlertTriangle`, `⌕`→`Search`) and drop the `🪐` emoji. Add `aria-label` to every icon-only button in the same pass.
5. **Collapse the color namespaces.** Alias `--panel-*`, `--cl-*`, `--deepdive-*` onto their `--color-*`/`--text-*` equivalents, then codemod call sites. Move the remaining 69 hex / 96 rgba in components to tokens (keep only SVG/canvas stops).
6. **Fix the serif fallback** in `settings-session` (`var(--font-body, Georgia, serif)` → sans fallback).

Items 3, 4, 6 are quick wins with immediate visible/a11y payoff. Items 1, 2, 5 are the real consistency fixes and are best done as their own reviewed commits (large diffs, low behavioral risk).
