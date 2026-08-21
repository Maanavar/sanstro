# Dashboard Motion Audit — Vinaadi Nova

**Status:** proposed implementation architecture

**Scope:** signed-in web dashboard only. This covers Today, Calendar,
Family & Charts, Life Areas, Goals, Journal, Explore, Tools, Settings,
onboarding, and all dashboard-owned overlays. Public marketing, admin, mobile,
and astrology calculations are excluded.

## Executive decision

Vinaadi should feel like a calm, precise almanac—not a generic animated
dashboard. Motion has one of four jobs:

1. **Orient** a person when the workspace or date changes.
2. **Connect** a cause to its visible result (selection, drill-down, save).
3. **Reveal** live astrological information as it becomes available.
4. **Mark meaning** in a small number of signature astrology moments.

Everything else stays still. In particular, warnings, score reasons, lengthy
Tamil prose, dense technical tables, and prediction content must not pulse,
loop, shake, or auto-scroll.

The codebase already has a strong base: Framer Motion, a shared Nova easing
curve, reduced-motion-aware score/ribbon primitives, and atmospheric celestial
visuals. It is currently inconsistent: many component-local CSS transitions
are unrelated to the shared language; tab switching is slower than the
interaction warrants; and several result, selection, and disclosure states
change without sufficiently clear spatial continuity.

## Design thesis

**An illuminated Tamil almanac: quiet paper-like content that settles into
place, with rare celestial movement used only when time, selection, or a real
chart signal changes.**

The motion personality is deliberate, not theatrical:

- Content settles upward by a maximum of 8 px.
- A selected object is traced or illuminated; it does not jump or bounce.
- One view change has one visual lead. Do not animate every child by default.
- Repeated navigation must be faster than first-time discovery.

## Current-state evidence

| Area | What exists | Audit finding |
| --- | --- | --- |
| Shared language | `web/lib/motion.ts` supplies Nova easing, timing, reveals, count-up. | Good foundation; it should become the only source for dashboard timing. |
| Workspace switching | `TabPane` fades and moves every mounted tab over 420 ms. | Too slow for frequent navigation, and it does not explicitly use the reduced-motion preference. |
| Navigation | Hero has a shared-layout spring tab indicator. | Correct interaction, but it should be a non-bouncy glide to suit a reading workspace. |
| Today | Score dial, score count-up, day-ribbon page-turn and celestial ambience exist. | Best-developed surface. Improve the hierarchy of date/data refresh; do not add more ambient looping. |
| Calendar | Date cells, selection rings, month controls, filters, and event rail are functional. | Date selection should create a connected detail transition; calendar cells themselves should remain still. |
| Family & Charts | Large, long-form hybrid reading with member selection, charts, timelines and many disclosures. | Must use section-level reveals only; do not stagger every chart/table row or animate technical data. |
| Goals / Life Areas | Many selections, segmented controls, timelines, forms and response panels. | Selection, result arrival and expansion need shared patterns; forms need only focus/validation feedback. |
| Journal | Write, entries and reflection views. | Preserve a calm writing environment. Saved-state feedback should be immediate and non-blocking. |
| Explore / Tools | Hub-to-detail navigation and calculation outputs. | Tool result should have a single result reveal after loading; no premature success animation. |
| CSS motion | Numerous 120–200 ms local transitions and several keyframes. | Retain useful press/hover affordances, consolidate timing tokens, and audit every loop. |

## Motion system

### Tokens

The existing `EASE_NOVA` remains the default settle curve:

| Token | Duration | Use |
| --- | ---: | --- |
| `instant` | 0 ms | reduced motion and data corrections |
| `press` | 120 ms | hover, press, chevron, toggle |
| `feedback` | 180 ms | selection, success state, compact progress change |
| `navigate` | 240 ms | tabs, sub-tabs, a new primary workspace |
| `reveal` | 360 ms | one above-fold data group or overlay |
| `signature` | 700–900 ms | score ring / count-up only |

Rules:

- Maximum translate distance: 8 px for content, 4 px for controls.
- No elastic bounce for normal navigation, tabs, accordions, or warnings.
- Never animate height with JavaScript when CSS grid/`max-height` or a discrete
  presence transition will preserve readability more reliably.
- Never use `transition: all`; declare only the properties that change.
- Animate transform and opacity wherever possible; do not animate layout-heavy
  properties across long content lists.

### Reduced motion

`prefers-reduced-motion: reduce` must preserve every semantic change while
removing travel, sweeping, count-up and perpetual motion. The reduced mode is:

- immediate tab/date state update;
- short opacity change for overlay appearance only when it helps orientation;
- static final score/progress state;
- no looping celestial ambience, pulse, shimmer, or auto-scrolling;
- no delayed/staggered content.

## Page-by-page recommendations

| Surface | Recommended motion | Do not animate | Priority |
| --- | --- | --- | --- |
| Global navigation | 240 ms crossfade/4–8 px settle; a shared indicator glides to the selected tab. | Whole-page exit animations or bounce. | P0 |
| Today | Keep score draw/count-up on first resolved data; day ribbon performs one page-turn only when the date changes; selected seven-day dot gets a quiet halo. | Constantly moving starfields, changing score reasons, status/warning badges. | P0 |
| Calendar | Selected date gains an inset trace; detail panel replaces its prior content with a 180–240 ms fade; month change is a single container transition. | Each day cell entering independently; festival icons pulsing. | P1 |
| Family & Charts | Member switch carries the selected member marker into the active reading; only section headings/content blocks reveal on first view. | Birth-chart draw-on on every visit, planet orbit loops, dasha rows cascading. | P1 |
| Goals | Segmented sub-tab indicator glides; newly computed supportive window gets a one-time reveal; goal completion uses a brief check/dissolve. | Repeated urgency pulse on goals or caution periods. | P1 |
| Life Areas | Selection ring/glow for focused area and a quiet detail replacement. | Meter bars that continuously animate on re-render. | P1 |
| Journal | Cursor/focus states are native and instant; save uses toast plus a 180 ms confirmation affordance. | Entry text motion, page-turn on each keystroke, distracting ambience. | P1 |
| Explore | Hub item gains press feedback; detail view uses one shared origin/fade transition. | Every article/list card entering on scroll. | P2 |
| Tools | Calculation state: skeleton → crossfade → result; result section uses one reveal. | A result before a real response, confetti, arbitrary "success" motion. | P1 |
| Settings/onboarding | Progress and validation feedback only; modal opens with a short opacity/scale-settle. | Decorative motion that makes setup feel longer. | P1 |
| Overlays | Backdrop fades in 120 ms; panel settles 8 px over 180–240 ms; closing reverses only when it does not delay navigation. | Sliding every popover from the screen edge. | P0 |

## Signature moments worth investment

1. **Today score:** retain the ring draw and count-up, but run it only after
   the daily score has genuinely changed or first becomes available. The score
   reasons remain static so the number never competes with interpretation.
2. **Panchangam time ribbon:** the current NOW marker and date page-turn are
   meaningful. Add only a static/current highlight state for the active window;
   do not add continuous time-based movement.
3. **Dasha timeline:** when the selected period changes, trace from the former
   period to the active one and bring its interpretation into view. This is a
   future shared component project, not an isolated animation patch.
4. **Chart-related selection:** selecting a person or life area should retain
   visible origin and destination through a shared marker/selection treatment,
   not by redrawing the entire chart.

## Implementation order

### P0 — foundation and trust

1. Make workspace navigation reduced-motion-aware and reduce its normal
   duration to `navigate`.
2. Define/align all dashboard CSS duration and easing tokens with
   `web/lib/motion.ts`.
3. Establish shared primitives for page/tab swap, overlay presence, selection
   trace, async skeleton-to-content crossfade, and press feedback.
4. Add a motion QA check to the existing Playwright dashboard sweep: normal and
   reduced-motion states must reach the same semantic/end state without
   horizontal overflow or console error.

### P1 — highest-value user flows

1. Today date refresh and weekly selection.
2. Calendar selected-date detail handoff.
3. Family member-to-reading handoff and disclosure transitions.
4. Goals, Life Areas and Tool result state transitions.
5. Modal/popover and form-feedback consistency.

### P2 — signature visual work

1. A data-faithful Dasha timeline transition.
2. A chart-selection/planetary glyph system, only after the proprietary glyph
   design is approved.
3. Scroll-linked depth only where it materially helps a long editorial reading.

## Acceptance standards

- Every transition has a stated user-visible cause and final state.
- Keyboard, screen-reader and reduced-motion users receive the same information
  and can act at the same time as other users.
- No automatic loop runs in reading-heavy content.
- No motion begins until real data exists.
- Repeated dashboard navigation feels immediate; normal view switches finish
  within 240 ms.
- Motion does not produce layout shift, clipped focus indicators, horizontal
  scrolling, or console errors at desktop and mobile widths.
- No animation changes astrology calculation, score meaning, or caution
  language.

## Explicit non-goals

- Rebuilding astrology calculations, response shapes, or data fetching.
- Adding generic floating particles, confetti, shaking warnings, parallax
  backgrounds, or auto-playing decorative animation.
- Replacing readable charts/tables with motion-first visualizations.
