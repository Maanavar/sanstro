# Vinaadi — Dashboard UI/UX Strict Audit (code-grounded)

**Lens:** chief product designer, world-class software company.
**Method:** read the shipped code and CSS, *measured* the defects. Every finding below has a
file:line and a number behind it — no vibes.
**Date:** 2026-07-23
**Companion:** the IA re-cut lives in `dashboard-product-design-audit-2026-07-23.md`. This doc is
about **craft, accessibility, and visual-system integrity** — the things that decide whether it
*looks and feels* world-class.

---

## First, credit where it's earned

The **token layer is genuinely good.** `dashboard-nova.css` documents real contrast ratios, retunes
`--color-faint` from 0.45→0.60 *specifically to clear AA on small text*, splits `--color-alert-
critical` into fill vs text variants for legibility, and separates a 4-band score palette from the
brand gold so mid-scores stop reading as "gold." That is senior color work. **The problem is not the
system — it's that the components don't use it.** 654 inline `style={{…}}` blocks sit on top of those
117 tokens, and that gap is where every defect below is born.

---

## P0 — Ship-blockers for "world-class" (accessibility & correctness)

### P0-1 · The primary pages have no document outline
Measured heading counts:

| Page | `<h1..h3>` |
|---|---|
| **Today** (`dashboard-today-tab-nova.tsx`) | **0** |
| **Family & Charts** (`dashboard-family-charts-hybrid.tsx`) | **0** |
| **Calendar** (`dashboard-calendar-tab-nova.tsx`) | **0** |
| Life Areas | 1 |
| *whole dashboard* | **4 `<h1>` total**, all on secondary tabs (journal, life-areas, plan, setup) |

Every "title" on the landing pages is a styled `<div>` (e.g. `today-tab:299` hero, the section
banners at `:706/:718/:740`). A screen-reader user gets **no landmarks, no heading navigation, no
outline** on the three most-used pages. This fails WCAG 1.3.1 (Info & Relationships), 2.4.1 (Bypass
Blocks) and 2.4.6 (Headings & Labels). It is also a *sighted* problem: nothing on the page is
typographically "the title," so the eye has no entry point (see P2-2).

**Fix:** one `<h1>` per tab (visually it can stay the greeting/date), `<h2>` for each of the ~6
sections, `<h3>` for cards. This is a find-and-promote pass on existing styled divs — no redesign.

### P0-2 · Micro-type below the legibility floor
The type scale **bottoms out at 8.5px** and the single most common size is 12px. Sub-10px is used for
**real content**, not decoration:

- `dashboard-hybrid-parts.tsx:196` — the **bhava (house) table header** is a 10-column grid at
  **9.5px**, uppercase, letter-spaced, in `--color-faint` (60% opacity).
- `dashboard-hybrid-parts.tsx:405` / `:670` — "Today · shared" and window badges at **8.5px**.
- `dashboard-family-charts-hybrid.tsx:483` — timeframe badge at **8.5px**.
- 20+ more sites at 9–9.5px uppercase-tracked in `--color-faint`.

Three legibility penalties **stack** here: tiny size + uppercase + letter-spacing + 60%-opacity text.
`--color-faint` was tuned to clear AA for *normal-weight small text* — it was **not** validated for
8.5px uppercase tracked labels, which are materially harder to read. This matters more than usual for
Vinaadi: the audience skews older, and **Tamil script needs more x-height than Latin** to stay legible
at the same px. 8.5–9.5px Tamil is a real problem.

**Fix:** floor body text at **12px**, data/labels at **11px**, and delete every size below 11px.
Micro-labels that "need" to be tiny are a density symptom (P2-1), not a real constraint.

### P0-3 · Touch targets below the 44px floor
Pills, toggles and chips are built with 4–8px vertical padding on ~11–12px text → **~22–28px tall**,
well under the 44×44px (Apple HIG) / 48dp (Material) minimum. Examples: evening-preview toggle
(`today-tab:325`, `padding: 5px 10px`), sub-tab pills across Life Areas / Goals / Journal
(`padding: 6px 13px`), score/legend chips (`padding: 2px 8px`, `4px 11px`). On a phone these are
mis-hit targets.

**Fix:** a `<Button>`/`<Pill>` primitive with `min-height: 44px` (touch) and a compact desktop
variant — set once, inherited everywhere.

### P0-4 · The animation system ignores reduced-motion
Inventory: **22 `@keyframes`/`animation:` in `dashboard-nova.css`**, **23 framer-motion
`initial/animate` sites**, plus the always-on `CelestialAmbientNova`, `nova-pulse-dot`, and
`DeepDiveOrbitGlyph`. Guards that honor `prefers-reduced-motion`: **3 in the CSS, 4 files total.** So
for a user with vestibular sensitivity, the pulsing dots, orbiting glyphs and page-transition slides
keep firing. WCAG 2.3.3.

**Fix:** one global `@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation,
transition → near-0 } }` guard, plus `useReducedMotion()` gating the celestial/orbit components.

### P0-5 · Monthly calendar forces horizontal scroll on phones
`dashboard-calendar-monthly-nova.tsx:450` wraps the grid in a hard `minWidth: "620px"`. On a 375px
phone the month grid can't fit and the user scrolls sideways through their calendar — the one view
that should be the most glanceable. (It's one of **55 hard `minWidth` px values** in components; 620
is the worst offender.)

**Fix:** a responsive month grid (min column width via `grid-template-columns:
repeat(7, minmax(0,1fr))`), or a stacked agenda view under ~600px.

---

## P1 — Visual-system integrity

### P1-1 · The type scale is freehand, not a scale
**23 distinct `fontSize` px literals** in the tab files alone, including half-pixel steps —
8.5 / 9 / 9.5 / 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 14.5 / 15 / 15.5 / 16 / 17…
A real system has ~7 steps. The 0.5px steps (12 vs 12.5) are invisible to users but guarantee drift:
nobody can hit "12.5px, weight 600, faint" consistently by hand across 77 files.

**Fix:** a 7-step token scale (e.g. 11 / 12 / 14 / 16 / 20 / 26 / 34) exposed as `--text-xs…3xl`.
Every inline `fontSize` maps to the nearest step. Half-pixels die.

### P1-2 · No component layer — 654 inline styles over 117 tokens
Re-confirmed and it's the **root cause of P0-2/3 and P1-1**. There is no shared `Segmented`, `Card`,
`Button`, `Pill`, `Stat`, or `Score` primitive (only `member-chip`/`streak-chip` exist). So each of
the 7 tabs re-hand-rolls its sub-nav and cards inline — which is exactly why sizes, paddings and
colors drift and why "consistency audits" recur in the repo history. **You cannot QA your way to
consistency without a component to be consistent to.**

### P1-3 · Two icon languages fighting
The top nav uses **lucide** (clean, sized via `.cd-icon`, `aria-hidden`) — correct. But content areas
use a **grab-bag of emoji + Unicode symbols**: 🪔 🛕 📜 🗓 🔍 alongside ✦ ◐ ◇ ☀ ⚠ 🌿 🌘. Emoji render
with different color, weight and metrics on Windows / macOS / Android / iOS (🪔 is full-color on some,
mono on others; ⚠ ✦ ◐ aren't real icons at all). This reads as "unfinished" on exactly the surfaces
meant to feel crafted.

**Fix:** one icon set (extend lucide; commission a small custom set for the astrology-specific
glyphs — dosha, temple, lamp, nakshatra). Retire content emoji, or keep a few as deliberately
decorative and `aria-hidden`.

### P1-4 · Light theme is second-class
**103 dark `--color-` definitions** vs a thin light-override block; Nova's "System" mode
**deliberately stays dark** and light is opt-in and, per the repo's own history, prone to invisible
bugs (dark-authored ink on cream; phantom `var(--x, literal)` tokens that fire the dark fallback in
*both* themes). For a product used in daylight/temple/older-eyes contexts, light mode is not a nice-
to-have.

**Fix:** either fund a real light-theme parity pass (audit every token has a validated light value +
follow OS preference), or label it "Beta" honestly until it's ready. Half-supported is worse than
either.

### P1-5 · Font families applied ad hoc
Four+ families active: display (Cormorant), body (system-ui), prose (Source Serif), Tamil, mono —
plus **193 `fontFamily: "inherit"`**. The intent is documented in the CSS, but the serif/sans
boundary is applied "as each screen is built," so which strings are serif vs sans is inconsistent
screen-to-screen. Decide the rule as a token contract (display→headings/score only; prose→guidance
copy; body→everything UI) and enforce it through the primitives, not per-string.

---

## P2 — Craft, density & delight

### P2-1 · Chart pages are over-dense
The bhava table is a **10-column grid at 9.5px** (`hybrid-parts:196`). That's spreadsheet density on a
consumer spiritual product. The reason micro-type exists (P0-2) is that too much is crammed per row.
Reduce columns to the 5–6 that matter at a glance; move the rest to an expandable detail. Density is a
choice, not a requirement.

### P2-2 · The landing has no focal point
Today stacks **6 dense sections** with near-equal visual weight and no `<h1>`, so there's no F-pattern
entry — the eye lands nowhere. World-class daily products lead with **one hero answer** (the score +
one line: "why + what to do now") occupying the top third, everything else demoted. The content is
already there (`today-tab:297`); it just needs hierarchy and air.

### P2-3 · Motion timing is inconsistent
Tab transitions run **0.42s** (`dashboard-workspace.tsx:1479`) — ~2× too slow for navigation — while
micro-toggles run 0.15s. Adopt a motion-token set (nav 200–220ms, reveal 280ms, ambient 600ms+) so
timing stops being per-component guesswork.

---

## The prescription (what I'd actually build, in order)

**Sprint 1 — accessibility floor (P0).** Non-negotiable for the "world-class" claim.
1. Semantic heading pass: one `<h1>`/tab, `<h2>`/section (promote existing styled divs).
2. Global `prefers-reduced-motion` guard + gate celestial/orbit/pulse.
3. Type floor at 11px; delete every sub-11px size.
4. `<Button>`/`<Pill>` primitive with 44px touch floor.
5. Responsive month grid (kill the 620px min-width).

**Sprint 2 — the primitive kit (P1-2, unlocks the rest).**
6. Ship `Segmented`, `Card`, `Button`, `Pill`, `Stat`, `Score`, `BilingualText` in `components/ui/`,
   wired to the tokens. Convert **Life Areas** as the reference tab.
7. Publish the 7-step type scale + motion tokens; map inline styles to them during conversion.

**Sprint 3 — polish & consistency (P1/P2).**
8. One icon set (lucide + custom astro glyphs); retire content emoji.
9. Light-theme parity pass — or honest "Beta" label.
10. Density pass on chart tables; give Today a single hero focal point.

## What I'd measure (so this doesn't regress)
- **Sub-11px text count** → target 0.
- **Distinct `fontSize` literals** → 23 → ≤ 8 (the scale).
- **Inline `style={{` count** → 654 → < 100.
- **Headings on Today/Family/Calendar** → 0 → ≥ 1 h1 + h2/section.
- **axe-core / Lighthouse a11y score** on each tab → wire into CI; target ≥ 95.
- **Touch-target failures** (min 44px) → 0.

## One-sentence version
> The design *tokens* are already world-class; the **components ignore them** — so the fastest path
> to "effective, useful, best-viewing" is not more visual redesign, it's **an accessibility floor
> (headings, 11px min, 44px targets, reduced-motion) and a five-primitive component kit** that finally
> makes the good tokens show up on screen.
