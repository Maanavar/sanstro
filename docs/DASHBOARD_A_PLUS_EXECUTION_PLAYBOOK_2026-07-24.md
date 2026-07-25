# Dashboard A+ Execution Playbook — 2026-07-24

> Companion to `DASHBOARD_UIUX_CONSISTENCY_AUDIT_2026-07-24.md` (the diagnosis).
> This is the **build doc**: the definition of A+, the foundation to build first, the exact mapping tables, per-screen punch lists, codemod recipes, and the CI gates that prove each screen landed.
> Grounded in the real code (token layer, `dashboard-nova.css`, `web/components/ui/`), not the design docs.

**Palette decision (resolved):** the dashboard ships **two first-class themes behind one semantic token namespace** — **Nova Galaxy** (`[data-ui="nova"]:not([data-theme="light"])`, navy `#04050E` + gold `#D6A85F`) and **Warm** (`[data-ui="nova"][data-theme="light"]`, parchment). Both already resolve `--color-*` / `--text-*`. Components must reference **only** those semantic tokens; the theme supplies the values. Collapsing the legacy namespaces (`--panel-*`, `--cl-*`, `--deepdive-*`, JS `W`/`C`) is what makes every surface obey the theme switch instead of being frozen in one look.

---

## 0. How to use this doc

Work top-down. **Section 3 (Foundation) must land before any per-screen work in Section 4** — the screens migrate *onto* the primitives and tokens built in Section 3. Each unit of work ends with the acceptance checks in Section 6; a screen is "A+" only when its Section 4 punch list is clear **and** its guard greps return 0.

Ordering at a glance: **3 → 4 → 6 gates run continuously.** Section 7 has the dependency graph and sizing.

---

## 1. Definition of A+ (the acceptance rubric)

A screen earns A+ only when **all** are true. This is the bar every item in Section 4 is measured against.

| # | Criterion | Pass condition (mechanically checkable where possible) |
|---|-----------|--------------------------------------------------------|
| A1 | **One token namespace** | Zero `--panel-*`, `--cl-*`, `--deepdive-*`, JS `W.`/`C.` palette refs in the file. Only `--color-*`, `--text-*`, `--space-*`, `--radius-*`. |
| A2 | **Type on-scale** | Zero raw `fontSize:"…px"` / `"…rem"`. Every size is `var(--text-*)` or a `var(--display-*)` heading token. |
| A3 | **Kit chrome** | No hand-rolled bordered card `<div style={{border,borderRadius,background,padding}}>`. Cards = `<Card>`, sub-heads = `<Kicker>`/`<SectionHeader>`, controls = kit `Field`/`Input`/`Select`/`Chip`/`Toggle`/`Segmented`/`Button`/`Pill`. |
| A4 | **Spacing/radius on token** | Zero literal `padding:"…px"` / `gap:"…px"` / `borderRadius:"…px"`. All `var(--space-*)` / `var(--radius-*)`. |
| A5 | **One `<h1>`, no skips** | Exactly one `<h1>` per rendered screen; heading levels never skip (`h1→h2→h3`). |
| A6 | **Icons, not glyphs** | No Unicode-glyph affordances (`→ ✕ ⚠ ⌕ ◆ ↗ ›`) and no emoji (`🪐`). Lucide at `strokeWidth={1.5}`, sized 16/20/24. |
| A7 | **Named for AT** | Every icon-only button has `aria-label`; every decorative glyph/SVG is `aria-hidden`. |
| A8 | **Both themes** | Screen renders correctly in **Nova Galaxy and Warm** (no frozen colors; contrast AA in both). |
| A9 | **Responsive** | No horizontal body scroll ≥320px; headings use `--display-*` fluid tokens; wide content scrolls in its own container. |
| A10 | **Motion honored** | Reveals via `NovaReveal`/`NovaFadeIn`; `prefers-reduced-motion` respected (inherited free from the kit + existing primitives). |

---

## 2. Target architecture

```
ONE namespace          TWO themes                         ONE kit
--color-*  ┐           Nova Galaxy  [data-ui=nova]         <Card> <Panel>
--text-*   ├─ semantic   :not([data-theme=light])         <Kicker> <SectionHeader>
--space-*  │           Warm         [data-ui=nova]         <Field> <Input> <Select> <Textarea>
--radius-* ┘             [data-theme=light]                <Chip> <Toggle> <StatusChip>
--display-*(new)                                           <Segmented> <Button> <Pill>
                                                           <Score> <Table> <ProgressBar>
```

- **Delete on sight:** `--panel-*`, `--cl-*`, `--deepdive-*` refs in components; `W.*`/`C.*` JS palettes; the 4× `NovaKicker`, 2× local `Card`, and per-file `cardStyle`/`kickerStyle`/`fieldStyle`/`novaDetailCardStyle` consts.
- **Keep:** `--color-*`, `--text-*`, `--space-*`, `--radius-*`; the Nova motion primitives (`NovaReveal`, `NovaFadeIn`, `NovaScoreDial`, `NovaProgressBar`, `NovaTable`, `NovaStarRow`); `dashboard-nova.css` theme blocks (extend, don't replace).

---

## 3. Foundation (build BEFORE any screen migration)

### 3a. Kit primitives to build

The kit today exports `Card`, `Panel`, `Button`, `Pill`, `Segmented`, `BilingualText`, `Score`. Migration is **blocked** on these missing pieces. Build each as a `.ui-*`-classed component in `web/components/ui/`, styled in the COMPONENT KIT section of `dashboard-nova.css` so it reads the token layer and themes for free (same pattern as `card.tsx`).

| New primitive | Replaces today | Props (min) | Token bindings |
|---------------|----------------|-------------|----------------|
| `Kicker` | `NovaKicker`×4, `HyKicker`, 220 inline uppercase labels | `children`, `tone?` | `font:var(--text-xs)`, `--color-text-accent`, `letter-spacing .12em`, uppercase |
| `SectionHeader` | inline `<div flex baseline>` kicker+hint rows | `title`, `hint?`, `right?` | `Kicker` + `--text-*` hint |
| `Field` | Classic `Field`, Setup `WField`, inline label+input stacks | `label`, `error?`, `helper?`, `required?`, `children` | `--text-sm` label, `--color-low` error (already has a11y wiring in Classic `Field` — port it) |
| `Input` | Classic `TextInput`, Setup `WInput`, inline `<input style>` | native + `error?` | `--radius-md`, `--color-border(-strong)`, `--color-surface`, `--text-base` |
| `Select` | Classic `Select`, `NovaSelect`×11, Setup `WSelect` | native + `error?` | same as `Input` |
| `Textarea` | inline `<textarea style>` (Journal etc.) | native + `error?` | same as `Input` |
| `Chip` | Classic `Chip`, Settings local `Chip`, inline pills | `tone?` (`neutral/high/mid/low/accent`), `active?`, `onClick?` | `--radius-full`, `--color-*-bg/-border` per tone |
| `Toggle` | Settings local `Toggle` | `checked`, `onChange`, `label?` | `--color-accent` on, `--color-border` off |
| `StatusChip` | Setup local `StatusChip` | `done`, `label` | `--color-high` / `--color-faint` |
| `Table` | re-export existing `NovaTable` from the kit barrel (import direct to avoid framer in barrel — same rule as `Score`) | — | already tokenized |
| `ProgressBar` | re-export existing `NovaProgressBar` (direct import) | — | already tokenized |

> **Note the Classic `Field`** in `dashboard-ui.tsx` already has the correct `aria-invalid`/`aria-describedby`/`role="alert"` wiring — port that logic into the kit `Field` verbatim so a11y isn't rebuilt.

### 3b. Font snap table

Add one micro step and a display ramp, then snap every literal. **Three tie-breaks need your sign-off** (flagged ⚠).

**Scale (body/UI):** `2xs=10` ⚠new · `xs=11` · `sm=12` · `base=14` · `md=16` · `lg=20` · `xl=26` · `2xl=34`
**Display (headings, fluid):** `--display-sm: clamp(1.5rem,2.5vw,1.9rem)` · `--display-md: clamp(1.7rem,3vw,2.2rem)` · `--display-lg: clamp(1.9rem,3.5vw,2.6rem)` (grounded in the 3 clamp ramps already in use)

| Observed values (px / rem) | → token |
|---|---|
| 8, 10 / 0.62, 0.625, 0.65 | `--text-2xs` (10) ⚠ *or snap all to xs — decision: keep 2xs; 0.625rem has 87 real uses (char counters, micro-labels)* |
| 11, 11.5 / 0.65625, 0.68, 0.6875, 0.7 | `--text-xs` (11) |
| 12, 12.5 / 0.72, 0.74, 0.75, 0.78 | `--text-sm` (12) |
| 13, 13.5 / 0.8, 0.8125, 0.82, 0.83, 0.85 | `--text-base` (14) ⚠ *body 13 rounds up to 14 for readability; if a 13 is a dense label, use sm — reviewer's call per site* |
| 14, 14.5 / 0.875, 0.9 | `--text-base` (14) |
| 15, 15.5 / 0.9375 | `--text-md` (16) |
| 16, 17 / 1, 1.1 | `--text-md` (16) |
| 18 / 1.125, 1.15 | `--text-lg` (20) ⚠ *subhead 18→20; if it's inline body emphasis, base — per site* |
| 20, 21, 22 / 1.25, 1.4 | `--text-lg` (20) |
| 24 / 1.5, 1.6 | `--text-xl` (26) |
| 26, 27 / — | `--text-xl` (26) |
| 30, 32, 34 / 1.8, 2, 2.2 | `--text-2xl` (34) or `--display-*` if it's a hero number/title |
| clamp() h1s / 2.8 | `--display-md` / `--display-lg` |

### 3c. Color-collapse mapping

Replace legacy refs with the semantic token. The **Warm theme** value keeps the parchment look; the **Nova Galaxy** value is already defined. Where a Warm value is missing, add it to the `[data-ui="nova"][data-theme="light"] .cd-shell` block (Section 3d).

| Legacy ref (component) | → semantic token | Warm value (verify/add) | Nova value (exists) |
|---|---|---|---|
| `--panel-earth`, `W.ink`, `C.text` | `--color-text-strong` | `#1A1612` | `#ECEEF7` |
| `--panel-mid-earth`, `W.muted`, `C.muted`, `--cl-muted` | `--color-muted` | `#6A5E4F` | `rgba(236,238,247,.66)` |
| `--panel-faint`, `C.faint` | `--color-faint` | `#8E7B68` | `rgba(236,238,247,.60)` |
| `--panel-cream`, `W.surface`, `C.card`, `--deepdive-surface*` | `--color-surface` | `#FFFFFF`/`#FAF5EA` | `#151827` |
| `--panel-hover` | `--color-hover-bg` | `#F4EEE2` | `rgba(255,255,255,.05)` |
| `--panel-tan-light`, `W.borderLt`, `C.border`, `--cl-border`, `--deepdive-border*` | `--color-border` | `#E4DBC8` | `#2A3147` |
| `--panel-tan`, `--cl-border-2` | `--color-border-strong` | `#D4C8AE` | `#343B56` |
| `--panel-brand`, `W.terracota`, `C.accent`, `--cl-accent` | `--color-accent` | `#B05220` (terracotta) | `#D6A85F` (gold) |
| `--cl-sage*`, `W.sage` | `--color-high` / `--color-accent-alt` | `#44614A` | `#8fbf9a` |
| `--cl-caution*` | `--color-mid` | `#8C3C22` | `#e39a3e` |
| `C.dangerBg`, `--color-error-bg` | `--color-low-bg` | (tint) | `rgba(179,87,61,.14)` |

> `--cl-*` is legitimately the **public/marketing** namespace — leave it alone *outside* the dashboard. Only the 56 in-dashboard uses collapse.

### 3d. Two-theme wiring

1. Audit that **every** semantic token the components use is defined in **both** theme blocks in `dashboard-nova.css` (`:not([data-theme=light])` and `[data-theme=light]`). Any token only defined in Nova gets a Warm value added (source of truth: the Warm values column in 3c + Design Constitution §1.1).
2. Add `--display-sm/md/lg` and `--text-2xs` to the shared `:root[data-ui="nova"]` block (theme-independent sizes).
3. Confirm the Settings → Appearance toggle already flips `data-theme` (it does — `dashboard-settings-session-tab.tsx`), and add a **"Nova Galaxy / Warm"** label pair so the two themes are named for users, not "Dark/Light."

---

## 4. Per-screen punch lists

Each screen: **specific fixes** → then the A-criteria it must clear. Numbers are current-state counts from the audit.

### Today (`dashboard-today-tab-nova.tsx` + 6 sub-components) — B → A+
- **A5:** collapse **4× `<h1>` → 1** (keep the greeting/verdict hero as `<h1>`; deep-dive "Why this prediction?" `<h2>`; sub-component headings `<h3>`).
- **A6:** replace `↗ ✕ ◆ ⤓ ⚠ →` with Lucide (`ArrowUpRight`, `X`, `Diamond`/`Sparkle`, `Download`, `AlertTriangle`, `ArrowRight`).
- **A3:** the deep-dive card + best/avoid/horai rail tiles + retry notice → `<Card>` / `<Card variant="soft">`.
- **A2/A4:** snap ~37 fontSize + paddings/gaps. Push shared styling **into the 6 sub-components** (`today-glance`, `today-ribbon`, `today-activity-board`, `today-decide`, `today-deepdive-extras`) — each is its own punch list, same criteria.
- **Clear when:** guards return 0 across `today-*` files.

### Explore (`dashboard-explore-tab-nova.tsx` + `explore-*`) — B+ → A+
- **A5:** 2× `<h1>` → 1 (page title stays; detail views use `<h2>`).
- **A3:** delete local `NovaKicker` → kit `Kicker`; `cardStyle` const → `<Card>`.
- **A6:** `⌕` → Lucide `Search`; `→` CTAs → `ArrowRight`.
- **A2:** snap ~31 fontSize (this cluster is dense: `explore-dosham` 26, `explore-yogam` 23, `explore-nakshatram` 16).

### Calendar (`dashboard-calendar-tab-nova.tsx` + `calendar-*`) — B → A+
- Already kit-adopted — **extend** to the local `NovaFestivalRow`/`NovaAuspiciousCard`/`NovaAvoidRow` (→ `<Card compact>`).
- **A5:** 2× `<h1>` → 1. **A2:** snap ~37 fontSize (largest single-file cluster after chart-explanation).

### Plan (`dashboard-plan-tab-nova.tsx` + `plan-*`) — B+ → A+
- **A6:** replace `🪐` **emoji** (Family cross-nav button) with Lucide `Orbit`/`Telescope`.
- Kit-adopted (`Segmented`) — extend to `novaDetailCardStyle` blocks → `<Card>`. **A2:** snap ~32 fontSize.

### Life Areas (`dashboard-life-areas-tab-nova.tsx` + `life-areas-*`) — A− → A+
- Reference implementation. Only: **A2** font snap + **A4** residual literal paddings. Fastest to A+; do it **first** as the worked example the others copy.

### Tools (`dashboard-tools-tab-nova.tsx`) — B → A+
- **A5:** 2× `<h1>` → 1. **A3:** `cardStyle(tool)` const → `<Card>` (keep the disabled/opacity logic as a prop). **A6:** `→`/`←`/`›` → Lucide. **A2:** snap ~15 fontSize.

### Journal (`dashboard-journal-tab-nova.tsx`) — B → A+
- **A2 (flagship offender):** the "New entry" card sizes small text **5 ways** — snap all to `--text-sm`/`xs`. ~45 fontSize total.
- **A3:** local `kickerStyle`/`fieldStyle` → kit `Kicker`/`Field`/`Textarea`. Kit `Card` already in use — extend to the right rail.

### Family & Charts (`dashboard-family-charts-hybrid.tsx` + `hybrid-parts.tsx`) — B− → A+ (biggest job)
- **A1/A3:** unify **three systems in one file** — `Hy*` primitives + Classic `Chip`/`Surface` + Nova dial — onto the kit. Keep `Hy*` that are genuinely bespoke *visualizations* (`HyPlanetOrbs`, `HyBhavaTable`, `HyBhuktiTimeline`), migrate `HyKicker`/`HyLinkOutCard`/`HyProfileCard` chrome → kit.
- **A2:** ~70 fontSize (highest in tree) + `hybrid-parts` 76. **A5:** 2× `<h1>` → 1. **A6:** clean the `→`/`✦` glyphs.
- Do this **last** — it benefits most from the primitives being battle-tested on the other tabs first.

### Settings / Setup (`dashboard-setup-tab.tsx`, `dashboard-settings-session-tab.tsx`) — C+ → A+
- **A1 (headline):** delete the `W.*` (Setup) and `C.*` (Settings) JS palettes → semantic tokens (mapping in 3c). This is the biggest single A1 win in the tree.
- **A3:** delete Settings' local `Card`/`Segmented`/`Chip`/`Toggle` → kit; Setup's `WField`/`WInput`/`WSelect`/`StepBtn`/`GhostBtn`/`StatusChip` → kit `Field`/`Input`/`Select`/`Button`/`StatusChip`.
- **A5:** Setup `<h1>`→`<h3>` skip — add the `<h2>`. Settings 2× `<h1>` → 1.
- **Font fallback bug:** `var(--font-body, Georgia, serif)` → `var(--font-body, ui-sans-serif, system-ui, sans-serif)`.
- **A2:** snap ~65 (Settings) + ~43 (Setup) fontSize.

### Deep-dive panels (`shadbala`, `vargas`, `synastry`, `yoga-dosham`, `*-dasha-panel`, `chart-explanation`, `jadhagam-report`) — B− → A+
- **A1:** move the **69 hex + 96 rgba** in components to tokens (keep only SVG/canvas gradient stops, which are legit).
- **A3:** bordered `<div>` → `<Card>`; data tables → kit `Table` (`NovaTable`). **A2:** the biggest clusters live here — `chart-explanation` 79, `synastry` 51, `jadhagam-report` 33, `yoga-dosham` 33.

---

## 5. Codemod recipes

Mechanical, low-risk, do per-file with the guard greps watching.

1. **Font snap (3b):** regex `fontSize:\s*["']([\d.]+)(px|rem)["']` → look up the value in the snap table → `fontSize: "var(--text-*)"`. Half-steps and the 3 ⚠ ties get a human glance.
2. **Color collapse (3c):** literal find/replace per row of the mapping table, per file. For JS palettes, replace `W.ink` → `"var(--color-text-strong)"` etc., then delete the `W`/`C` object.
3. **Card chrome (A3):** find bordered `<div style={{…border…borderRadius…}}>` → `<Card>` (or `variant="soft"/"accent"/"dashed"`). The kit `Card` is visually identical to `novaDetailCardStyle`, so swaps are safe.
4. **Kicker:** delete the 4 local `NovaKicker` defs; import kit `Kicker`.
5. **Glyphs → Lucide (A6):** targeted per-glyph replace with the Lucide import + `aria-hidden`; add `aria-label` to the button in the same edit.

---

## 6. Verification & CI gates

Run per file after each unit; wire the guards into a lint/CI step so regressions can't re-enter.

**Per-file guard greps (must return 0 for an A+ file):**
```
# A1 — no legacy namespaces / JS palettes
grep -nE '\-\-(panel|cl|deepdive)-|[^a-z]W\.|[^a-z]C\.' <file>
# A2 — no raw font sizes
grep -nE 'fontSize:\s*["'"'"'][0-9.]+(px|rem)' <file>
# A4 — no literal spacing/radius
grep -nE '(padding|gap|borderRadius):\s*["'"'"'][0-9]' <file>
# A5 — exactly one <h1>
grep -cE '<h1' <file>          # want 1
# A6 — no glyph/emoji affordances
grep -nE '🪐|[→←✕⚠◆↗›⌕✦]' <file>
```
**Whole-suite gates (unchanged behavior):**
- `cd web; npx tsc --noEmit` — green.
- `cd web; npx vitest run` — the 209 dashboard tests stay green.
- `npx playwright test` (authed) — visual/interaction pass per theme (owed; needs creds).
- **Both themes:** load each screen under Nova Galaxy and Warm; spot-check AA on text (`--color-faint` on `--color-surface` is the tightest — already tuned to 4.89:1 in Nova, verify Warm).

---

## 7. Sequencing & effort

```
Section 3 FOUNDATION (blocks everything)
  3a kit primitives ─┐
  3b font tokens ────┼─► 3d two-theme wiring ─► screens can start
  3c color mapping ──┘
Section 4, recommended order:
  1) Life Areas   (A−→A+, the worked example)        S
  2) Plan, Tools, Explore  (kit-friendly)            M each
  3) Journal, Calendar                               M each
  4) Settings/Setup  (palette + primitive deletions) L
  5) Family & Charts  (3-system unify)               L
  6) Deep-dive panels  (hex/rgba + tables)           L (parallelizable across panels)
```
Rough sizing: **Foundation ≈ 1 focused pass** (primitives are small; most styling already exists to copy). Each **S/M** screen is a mechanical codemod + review; **L** screens carry real restructuring (palette deletion, 3-system unify) and want their own reviewed commits. Do them as **separate commits per screen** so each diff is large-but-boring and independently verifiable — never one mega-commit.

**First move:** build Section 3a `Kicker` + `Field`/`Input`/`Select` and add 3b tokens, then take **Life Areas to A+** end-to-end as the reference other screens copy.
