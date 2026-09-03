# Vinaadi Dashboard — Master Design Audit (IA + Craft, hybrid)

**Lens:** chief product designer, world-class software company (Apple / Google / Tesla heritage).
**Method:** two passes, both grounded in the actual code — (A) an **information-architecture /
product-structure** pass, and (B) a **strict UI/UX craft & accessibility** pass where every defect is
*measured* with a file:line. This document merges them.
**Date:** 2026-07-23
**Supersedes:** `dashboard-product-design-audit-2026-07-23.md` (IA) and
`dashboard-uiux-strict-audit-2026-07-23.md` (craft) — both are folded in here with full explanations.

---

## 0. The 90-second verdict

Vinaadi is a **world-class astrology engine wearing a taxonomy-first coat of paint, and that paint is
applied by hand on every screen.** Two things are true at once:

1. **The foundations are excellent.** The jyotish engine is a real moat; the design *token* layer in
   `dashboard-nova.css` does documented, senior-level accessibility work.
2. **The two layers above the tokens are where it loses its "world-class" claim:** the **structure**
   is organized by feature-category instead of by what a person came to do, and the **components**
   bypass the good tokens with 654 hand-written inline styles.

Crucially, **both problems share one root cause** (§2). Fix that root cause and the macro (IA) and
micro (craft) symptoms resolve together. That is why this is a hybrid audit and not two separate
to-do lists.

---

## 1. How I audited

**Pass A — structure/IA.** Read the nav backbone (`web/lib/dashboard-tabs.ts`,
`dashboard-workspace.tsx`, `dashboard-hero.tsx`) and walked every tab's second-level structure to map
the *real* surface a user can reach.

**Pass B — craft/accessibility.** Read the shipped component render code and CSS and *measured* the
defects — type-scale sprawl, heading structure, touch-target sizes, reduced-motion coverage,
responsive breakpoints, icon consistency, theme parity. Numbers below are counted from the code, not
estimated.

---

## 2. The one root cause (why both audits point the same way)

> **Vinaadi is organized the way its codebase is organized — by category of feature — and its UI is
> assembled the way a prototype is assembled — inline, per screen. There is a token system but no
> component system, and an app-map but no intent-map.**

Everything downstream follows from this:

- **Because organization is category-first** ("Tools", "Explore", "Life Areas", "Charts"), the nav
  keeps growing, features duplicate across tabs, and the same question has multiple doors. → *Pass A
  findings.*
- **Because there is no component layer** (only tokens), every screen re-implements its own nav,
  cards, pills and type inline, so sizing/color/spacing/accessibility drift screen-to-screen. → *Pass
  B findings.*

The proof this is systemic, not incidental: the repo already carries **~15 dashboard "audits" and
"consistency passes."** You do not re-audit a structure that is right, and you cannot QA your way to
consistency without a component to be consistent *to*. The re-auditing is the symptom; the missing
intent-map and missing component-map are the disease.

---

## 3. The dashboard as it actually is (the map)

**Primary nav:** Today · Calendar · Family & Charts · Goals · Life Areas · **⋯ More** (Tools, Explore,
QA) · Settings (corner). **Journal is orphaned** — reachable only via "go to journal" links inside
other tabs.

| Level 1 | Level 2 | Nav pattern used |
|---|---|---|
| **Today** (`personal`) | 6 stacked sections: hero+score → activity board → sunrise timeline → life-areas+dasa row → family+remedy row → deep-dive bridge | vertical scroll |
| **Calendar** | Panchangam · Monthly · Muhurta | segmented toggle |
| **Family & Charts** | members → planet orbs → bhava table → bhukti timeline → Sani cycle → forecast (also absorbed the old Transit & Dasha tab) | section-rail scroll |
| **Goals** (`plan`) | Goals · Events · What-if · Decisions | rounded pills |
| **Life Areas** | Overview · Predictions · Chances & Cautions · Yogas & Doshams · Remedies · Full report | flat pills |
| **⋯ More** | Tools (9 cards) · Explore (5 categories) · QA | dropdown → grid |
| **Settings** | Setup & Family · Account · Life context · Experience · Appearance · Notifications · Journal & Data · Privacy · Danger Zone | left rail |
| **Journal** | Write · Entries · Reflections | flat pills |

**The two numbers that frame everything:**
- **~51 destination-states** (11 primary + ~40 second-level) — a huge surface for a product whose core
  job is "how's my day / what should I do."
- **7 different second-level navigation patterns** for the *same job* (switch view within a tab):
  segmented toggle, flat pills, rounded pills, card grid, category cards, section-rail, left rail.

---

## 4. What is genuinely strong (protect these)

- **Engine & doctrine.** Shadbala, vargas, conditional dashas, Kalachakra, synastry, varshaphala — a
  real jyotish engine. *This is the moat; the UI's job is to not get in its way.*
- **The token layer.** `dashboard-nova.css` documents contrast ratios, retunes `--color-faint`
  0.45→0.60 to clear AA on small text, splits `--color-alert-critical` into fill-vs-text variants, and
  separates a 4-band score palette from the brand gold so mid-scores stop reading as plain gold.
  *This is senior color work — the problem is adoption, not design.*
- **Bilingual seriousness.** The "render in the active language, no title-echo, no EN+TA co-render"
  discipline is the right instinct. *It just needs a component to enforce it, not vigilance.*
- **Two good instincts already present:** Today's "one canonical score," and Family & Charts as a
  single-scroll graphical page. *Both are correct directions that the findings below sharpen.*

---

## 5. PART A — Structure & Information Architecture (the macro layer)

### A-1 · Navigation is category-first, so it never stops growing
**What:** 7 top tabs + a "More" catch-all + Settings + an orphaned Journal. "More" currently hides
**Tools and Explore — two of the richest areas.**
**Why it matters:** category labels ("Tools", "Life Areas") carry **zero information scent.** A user
who wants "is Thursday good for the housewarming?" has to already *know* it lives under Calendar →
Muhurta (or Tools → Muhurta Finder, or Goals → Decisions). "More" is where features go to die.
Information scent — the ability to predict what's behind a label before tapping — is the single
biggest driver of whether navigation feels effortless or maze-like.

### A-2 · Conceptual duplication — the "AND-label" smell
**What:** the same concept appears behind multiple doors:
- **"Family & Charts"** is two mental models bolted together — and it *also* absorbed Transit & Dasha,
  making four models in one tab.
- **Muhurta** lives in Calendar, in Tools (Muhurta Finder), and in Goals → Decisions.
- **Panchangam** is a Calendar view *and* a Tool ("Panchangam Planner").
- **Compatibility/Porutham** moved Family → Tools, but Family still owns the synastry data.
- **Rasipalan** (Tools) overlaps Today's daily guidance.

**Why it matters:** an "AND" in a label ("Family & Charts") is almost always an unresolved IA decision
left as a label. And every duplicated door is a place a user can get **a different answer to the same
question depending on which entry they used.** In an astrology product, *inconsistent* answers destroy
trust faster than a *wrong* answer — a wrong answer is a disagreement you can argue with; two answers
reads as "they're guessing."

### A-3 · Multiple competing scoring systems
**What:** Today's one score vs. Life Areas' 6-tier scores vs. Family forecast scores vs. daily-
guidance layer breakdowns — four numeric "truths."
**Why it matters:** users cannot reconcile "Today = 7/10" with "Career = weak tier" with "6-month
forecast = stable." Trust in a divination product *is* the product, and a single, coherent number
expressed at different zooms is what earns it. Four independent scales quietly erode it.

### A-4 · Depth is unguided
**What:** a first-time user and a jyotishi see the same wall — Today is 6 dense sections, Life Areas is
6 sub-tabs, Family is a long scroll, all "advanced" by default.
**Why it matters:** with no progressive disclosure, nothing feels like *the* thing to look at, so the
newcomer bounces and the expert has to hunt. World-class products meter complexity: simplest-useful
view first, depth one tap away.

---

## 6. PART B — Craft, Accessibility & Visual System (the micro layer, measured)

### B-1 · The primary pages have no document outline **[P0 · accessibility]**
**Measured heading counts:** Today = **0**, Family & Charts = **0**, Calendar = **0**, Life Areas = 1;
**4 `<h1>` in the entire dashboard**, all on secondary tabs. Every "title" on the landing pages is a
styled `<div>` (`today-tab:299/706/718`).
**Why it matters:** screen-reader users get **no landmarks, no heading navigation, no page outline**
on the three most-used pages — a direct WCAG 1.3.1 / 2.4.1 / 2.4.6 failure. It's also a *sighted*
problem: if nothing is typographically "the title," the eye has no entry point (see B-8).
**Fix:** one `<h1>` per tab (can stay the greeting/date visually), `<h2>` per section, `<h3>` per
card. A promote-existing-divs pass — no redesign.

### B-2 · Micro-type below the legibility floor **[P0 · accessibility]**
**Measured:** the type scale **bottoms at 8.5px**; the most common size is 12px. Sub-10px is used for
real content — the **bhava (house) table header is a 10-column grid at 9.5px**, uppercase, letter-
spaced, at 60% opacity (`hybrid-parts.tsx:196`); "shared/today" and timeframe badges at **8.5px**
(`:405/:670`, `family-charts-hybrid:483`); 20+ more at 9–9.5px.
**Why it matters:** four legibility penalties **stack** — tiny + uppercase + letter-spaced + 60%
opacity. `--color-faint` was validated for *normal-weight small text*, not 8.5px tracked caps. And it
hits Vinaadi harder than most: the audience skews older, and **Tamil script needs more x-height than
Latin** to stay legible at the same px, so 8.5–9.5px Tamil is a genuine failure.
**Fix:** floor body at 12px, data/labels at 11px, delete every size below 11px.

### B-3 · Touch targets below the 44px floor **[P0 · accessibility]**
**Measured:** pills/toggles/chips built with 4–8px vertical padding on 11–12px text → **~22–28px
tall**, under the 44×44px (Apple HIG) / 48dp (Material) minimum. E.g. evening toggle `today-tab:325`
(`5px 10px`), sub-tab pills (`6px 13px`), score chips (`2px 8px`, `4px 11px`).
**Why it matters:** on phones these are mis-hit targets — the difference between a product that feels
precise and one that feels fiddly.
**Fix:** a `<Button>`/`<Pill>` primitive with `min-height: 44px` on touch + a compact desktop variant.

### B-4 · The animation system ignores reduced-motion **[P0 · accessibility]**
**Measured:** **22 `@keyframes`/animations in CSS + 23 framer-motion sites** + always-on
`CelestialAmbientNova`, `nova-pulse-dot`, `DeepDiveOrbitGlyph`; only **3 reduced-motion guards** in
CSS (4 files total).
**Why it matters:** users with vestibular sensitivity get pulsing/orbiting/sliding motion regardless
of their OS setting — WCAG 2.3.3.
**Fix:** one global `@media (prefers-reduced-motion: reduce)` guard + `useReducedMotion()` on the
celestial/orbit components.

### B-5 · Monthly calendar forces horizontal scroll on phones **[P0 · responsive]**
**Measured:** `calendar-monthly-nova.tsx:450` hard-codes `minWidth: "620px"` (the worst of **55 hard
`minWidth` px values** in components).
**Why it matters:** on a 375px phone the user scrolls *sideways* through their month — the one view
that should be the most glanceable.
**Fix:** responsive grid (`grid-template-columns: repeat(7, minmax(0,1fr))`) or a stacked agenda under
~600px.

### B-6 · The type scale is freehand, not a scale **[P1 · system]**
**Measured:** **23 distinct `fontSize` px literals** in the tab files, including half-pixel steps
(8.5 / 9.5 / 10.5 / 11.5 / 12.5 / 13.5 / 14.5 / 15.5).
**Why it matters:** a real scale has ~7 steps; half-pixel steps are invisible to users but guarantee
drift — nobody hits "12.5px / weight 600 / faint" consistently by hand across 77 files. This is what
*produces* B-2.
**Fix:** a 7-step token scale (`--text-xs…3xl`, e.g. 11/12/14/16/20/26/34); map every inline size to
the nearest step; half-pixels die.

### B-7 · No component layer — 654 inline styles over 117 tokens **[P1 · the keystone]**
**Measured:** **654 inline `style={{…}}` blocks** across the tab files; the only shared "chip"
components are `member-chip` and `streak-chip` — no shared `Segmented`, `Card`, `Button`, `Pill`,
`Stat`, or `Score`.
**Why it matters:** this is the **root cause of B-1/B-2/B-3/B-6 and of A-1's 7 nav patterns.** Each
tab re-hand-rolls its sub-nav and cards inline, so everything drifts and the "consistency audit"
recurs forever. **You cannot be consistent without a component to be consistent to.**

### B-8 · Two icon languages fighting **[P1 · polish]**
**Measured:** nav uses **lucide** (sized, `aria-hidden`) — correct. Content areas use a grab-bag of
emoji + Unicode: 🪔 🛕 📜 🗓 🔍 alongside ✦ ◐ ◇ ☀ ⚠ 🌿 🌘.
**Why it matters:** emoji render with different color/weight/metrics per OS (🪔 is full-color on some,
mono on others; ✦ ◐ ⚠ aren't real icons) — it reads "unfinished" on exactly the surfaces meant to
feel crafted.
**Fix:** one set (lucide + a small commissioned astro-glyph set for dosha/temple/lamp/nakshatra);
retire content emoji or keep a few as deliberately decorative + `aria-hidden`.

### B-9 · Light theme is second-class **[P1 · theming]**
**Measured:** **103 dark `--color-` definitions** vs a thin light-override block; Nova's "System" mode
**deliberately stays dark**; the repo's own history logs invisible light-mode bugs (dark-authored ink
on cream; phantom `var(--x, literal)` tokens firing the dark fallback in *both* themes).
**Why it matters:** Vinaadi is used in daylight, in temples, by older eyes — light mode is not
optional there. Half-supported is worse than either fully supported or honestly labeled.
**Fix:** fund a real parity pass (every token has a validated light value + follow OS preference), or
label it "Beta" until it is.

### B-10 · Fonts & motion applied ad hoc **[P1/P2 · consistency]**
**Measured:** 4+ font families active (Cormorant display / system-ui body / Source Serif prose / Tamil
/ mono) plus **193 `fontFamily: "inherit"`**; nav transition runs **0.42s** while micro-toggles run
0.15s.
**Why it matters:** the serif/sans boundary is applied "as each screen is built," so which strings are
serif vs sans is inconsistent screen-to-screen; and 0.42s is ~2× too slow for navigation (it should
feel instant). Both are the same disease as color/type — no token contract.
**Fix:** encode the font rule as tokens (display→headings/score, prose→guidance copy, body→UI) and a
motion-token set (nav 200–220ms, reveal 280ms, ambient 600ms+); enforce via the primitives.

### B-11 · Chart pages are over-dense **[P2 · craft]**
**Why it matters:** the 10-column bhava grid at 9.5px is spreadsheet density on a consumer spiritual
product — and it's *why* the micro-type in B-2 exists. Density is a choice: reduce to the 5–6 columns
that matter at a glance, move the rest to an expandable detail.

---

## 7. Unified severity-ranked findings

| Sev | ID | Finding | Layer |
|---|---|---|---|
| **P0** | B-1 | Primary pages have no headings / document outline | Craft (a11y) |
| **P0** | B-2 | Micro-type at 8.5–9.5px (esp. Tamil, older eyes) | Craft (a11y) |
| **P0** | B-3 | Touch targets ~22–28px (< 44px floor) | Craft (a11y) |
| **P0** | B-4 | Motion ignores `prefers-reduced-motion` | Craft (a11y) |
| **P0** | B-5 | Monthly calendar `minWidth:620px` → phone side-scroll | Craft (responsive) |
| **P1** | B-7 | **No component layer — 654 inline styles (keystone)** | Craft (system) |
| **P1** | A-2 | AND-label duplication (Muhurta/Panchangam/Compat) | IA |
| **P1** | A-1 | Category-first nav + "More" catch-all + orphaned Journal | IA |
| **P1** | B-6 | Freehand type scale (23 sizes, half-pixels) | Craft (system) |
| **P1** | A-3 | Four competing scoring systems | IA |
| **P1** | B-8 | Mixed emoji + Unicode icon languages | Craft |
| **P1** | B-9 | Light theme second-class | Craft (theming) |
| **P2** | A-4 | Depth is unguided (no progressive disclosure) | IA |
| **P2** | B-10 | Ad-hoc fonts + slow (0.42s) nav motion | Craft |
| **P2** | B-11 | Chart pages over-dense | Craft |

---

## 8. The revamp (macro + micro, one plan)

### 8.1 Re-cut the IA to 5 intent-tabs, no "More" (fixes A-1, A-2)
Organize around the four questions people open an astrology app to ask, plus a library:

| New tab | The question it answers | Absorbs today's… |
|---|---|---|
| **Today** | "How is today, and what should I do?" | Today (slimmed to 3 sections), daily Rasipalan, Activity Timing |
| **Timing** | "When should I do X?" | Calendar (all views), Muhurta Finder, Goals→Decisions, Panchangam |
| **Chart** | "What does my chart say?" | Family & Charts, Transit & Dasha, Life Areas, Yogas/Doshams, Reports, Varshaphala |
| **People** | "How do we fit together?" | Family members, Compatibility/Porutham, family remedies |
| **Explore** | "Teach me / let me wander" | Explore, Learn, Guides, Nakshatram/Dosham/Yogam library |

Goals + Journal fold in (a "track & reflect" strip on Today; goals as chart-linked timelines on
Chart). Muhurta/Panchangam/Compatibility get **exactly one home each — everything else links, never
re-implements.** *Result: 5 verb-tabs, no dropdown, nothing orphaned, no duplicate doors.*
> **Your call:** does "People" earn top-level billing or fold into "Chart"? My recommendation is
> top-level — cross-chart/family is a genuine differentiator and deserves the shelf.

### 8.2 Build the 5-primitive component kit (fixes B-7, and via it B-1/2/3/6, A-1's 7 patterns)
Ship in `web/components/ui/`, wired to the existing tokens:

| Primitive | Replaces | Kills |
|---|---|---|
| `<Segmented>` | 7 hand-rolled sub-navs | inline pill styles |
| `<Card>`/`<Panel>` | ad-hoc bordered divs | ~half the 654 inline styles |
| `<Button>`/`<Pill>` | inline buttons | sub-44px touch targets (B-3) |
| `<Score>` (ring/chip/trend) | 4 scoring UIs | competing scales (A-3) |
| `<BilingualText>` | per-site `lang==="ta"?…:…` | co-render/title-echo bugs *by construction* |

`<BilingualText>` is the systemic cure for the bilingual scar tissue: **one place** decides active-
language rendering, so the whole class of EN+TA bugs becomes impossible to author, not something to
keep catching in review. Adoption is incremental — build the 5, convert **Life Areas first** as the
reference tab (most sub-tabs, most inline styles), then roll out tab-by-tab. No big-bang rewrite.

### 8.3 The accessibility floor (fixes B-1..B-5)
Semantic heading pass · global reduced-motion guard · 11px type floor · 44px touch targets via
`<Button>` · responsive month grid. These are non-negotiable for the "world-class" claim and mostly
mechanical.

### 8.4 One score, three zooms (fixes A-3)
Define one 0–100 day/context score; render it as a **ring** on Today (the answer), **tier chips** on
Life Areas (bucketed), **trend line** on forecast (over time) — never a second independent scale.

### 8.5 Progressive disclosure (fixes A-4)
Today ships 3 sections not 6, with a single hero focal point (score + one line: *why + what to do*);
the rest collapses behind "More on today." Every tab opens at its simplest useful view. Add a
persisted **Simple / Full** reading-level toggle so the newcomer gets the answer and the jyotishi gets
the wall — same data, disclosed differently.

---

## 9. Prioritized roadmap

**Sprint 1 — accessibility floor (P0).** Heading pass · global reduced-motion guard · 11px type floor
· `<Button>`/`<Pill>` with 44px target · responsive month grid.

**Sprint 2 — the primitive kit (P1 keystone).** Ship `Segmented`/`Card`/`Button`/`Score`/
`BilingualText` + the 7-step type scale + motion tokens; convert **Life Areas** as the reference tab.

**Sprint 3 — IA re-cut (P1).** Collapse to 5 verb-tabs; dissolve "More"; one home per intent; slim
Today to 3 sections; wire the one-score model.

**Sprint 4 — polish (P1/P2).** One icon set; light-theme parity (or honest "Beta"); density pass on
chart tables; convert remaining tabs to the kit.

---

## 10. What to measure (so it doesn't regress)

| Metric | Now | Target |
|---|---|---|
| Sub-11px text sites | many | **0** |
| Distinct `fontSize` literals | 23 | **≤ 8** (the scale) |
| Inline `style={{` count | 654 | **< 100** |
| Headings on Today/Family/Calendar | 0 | **≥ 1 `<h1>` + `<h2>`/section** |
| Touch-target failures (< 44px) | many | **0** |
| axe-core / Lighthouse a11y per tab | unmeasured | **≥ 95, wired into CI** |
| "Which door" rate (feature reachable via ≥2 paths) | high | **→ 1** |
| Time-to-answer (open → sees today's verdict) | multi-tap | **< 3s, 0 taps** |
| Audit-frequency (the real KPI) | ~15 to date | **treadmill stops** |

---

## 11. The one-paragraph version

> Vinaadi has a Ferrari engine and a genuinely world-class **design-token** layer — but it's organized
> like a filing cabinet (category-first tabs, duplicate doors, an orphaned Journal) and assembled like
> a prototype (654 inline styles, no component kit, no headings, sub-9px text, sub-44px targets,
> motion that ignores reduced-motion). Both the macro and the micro trace to one root cause: **no
> intent-map and no component-map.** So the highest-leverage work is not more visual redesign — it's
> **(1) an accessibility floor, (2) a five-primitive component kit that finally makes the good tokens
> show up on screen, and (3) an IA re-cut to five intent-tabs** — after which the endless consistency
> audits stop, because there is finally a system to be consistent *to*.
