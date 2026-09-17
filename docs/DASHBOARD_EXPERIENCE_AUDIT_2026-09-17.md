# Dashboard Experience Audit and Execution Plan (2026-09-17)

**What this is.** A product-design / creative-direction audit of the signed-in
dashboard. It asks whether every page, and every moment *between* pages, feels
like a world-class product. It is also a **work order**: Part B is written so
that a coding agent can pick up any item, implement it, and prove it done.

**Status:**
- Audit complete; owner decisions D1–D6 taken 2026-09-17 (§0).
- Wave 0 is complete (DXA-40, DXA-11, DXA-36, DXA-34; see §13). No Wave 1+
  item has started.
- Measuring tools exist: `web/scripts/ux-audit.mjs` (CLI),
  `web/e2e/dashboard-experience.spec.ts` (Playwright, with a regression
  ratchet) and `scripts/ux-audit-stack.ps1` (§11). Baseline: 36 of 44 gates failing (§12).

**Scope:** `/dashboard/*`, which covers Today, Calendar, Family & Charts, Goals,
Life Areas, Tools, Understand (Explore), Journal and Settings, plus the shared
chrome, the overlays and phone width. The astrology engine and marketing pages
are out of scope.

**Method.**
- **Rendered pages.** 152 screenshots and filmstrips of a synthetic account
  ("Audit Sample", fictitious birth data) on the isolated e2e stack: frontend
  :3100, backend :8010, database `vinaadi_e2e`.
- **Themes and widths.** Dark 1440 px, light 1440 px, phone 390 px, and reduced
  motion.
- **In-page probes.** Layout shift, a 100 ms load timeline, per-frame
  opacity/transform through tab switches, `document.getAnimations()`, hover and
  press style diffs from real pointer moves, and a computed-style census.
- **Source cross-check.** Every finding was traced to code.
- **Re-runnable.** The same probes are now `web/scripts/ux-audit.mjs`, which
  prints a PASS/FAIL gate for each item. The baseline is in §12.

**Caveat.** The stack runs `next dev`, so absolute timings are dev-inflated.
Dev does not change *ordering*, *copy shown during loading*, *layout-shift
sources*, *which surfaces have hover/press/presence states*, or *colours*.
Every P0 is one of those. Items that need a production build say so.

Status legend: `[ ]` open · `[x]` done · `[~]` partial / blocked, reason stated.

---

## 0. Owner decisions (2026-09-17), binding

| # | Question | Decision | Lands in |
|---|---|---|---|
| D1 | What does bare `/dashboard` open? | **Always Today.** No last-tab restore. Deep links (`/dashboard/<tab>`) still land where they name. | DXA-02 |
| D2 | Phone navigation | **Bottom tab bar** on phones: Today · Calendar · Family · Goals · More. More opens a sheet with Life Areas, Tools, Understand, Journal and Settings. A compact top bar hides on scroll-down. | DXA-27 |
| D3 | Ambient loops | **Static page sky; motion only inside the Today hero.** Every infinite animation outside `.nova-hero` stops. Loading indicators (skeleton shimmer, spinners) are not ambient and stay. | DXA-17 |
| D4 | Family's two stacked readings | **One reading with a length switch** (2 min / 4 min). | DXA-37 |
| D5 | Touch-target sizing | **Delegated to the auditor, decided:** size follows the device, hit area follows the finger. Details and rationale in DXA-39. | DXA-39 |
| D6 | Tamil date before data arrives | **Hidden.** No client approximation is ever shown; a width-reserved placeholder holds the space. | DXA-38 |

---

# Part A: The audit

## 1. Verdict

| Dimension | Grade | One line |
|---|---|---|
| Visual composition of key screens | **A−** | Today hero, score dial, calendar landscape header and the Family harmony card are genuinely premium. |
| Freshness | **B−** | The celestial system is distinctive. Mock-up leftovers ("5L", "coming soon", "Draft: pending review"), raw enums and emoji date it. |
| System consistency | **C+** | 86% of styling is inline, so pages render 11–15 font sizes, up to 9 corner radii and two motion languages. |
| Interaction feedback and motion | **C** | Good tokens and tab fade, but **0 of 20** measured clickable cards/buttons react to hover or press; 1 of 3 top-bar popovers animates; nothing animates out. |
| Loading and continuity | **D** | Today renders then swaps tab; "Create a birth profile" shows to set-up users; cream skeletons on navy; the page height changes 10–11 times in one load. |
| Phone | **C** | No horizontal overflow, but the pinned header takes 180–197 px (21–23%) of an 844 px screen, grows as data arrives, and a tab label is overprinted. |

**Overall: C+.** *The screens are designed; the experience between the screens
is not.* Almost every fix is cheap, and none needs a new visual direction: the
direction exists and is simply not applied everywhere.

## 2. What already works (keep it, build on it)

- **Today hero** (`.nova-hero*`): masthead, name, briefing, best window, score,
  key timings. Correct, calm hierarchy.
- **`NovaScoreDial`**: gradient arc, glow, draw-on, count-up; reduced motion
  respected.
- **Calendar landscape header** (`.nova-cal-landscape`): the most editorial
  image in the product.
- **Reading typography**: the `.om` reading surface is deliberately "not a
  card" (`dashboard-nova.css:3484-3499`), with prose on its own register.
- **Motion foundation**: `EASE_NOVA`/`DUR` (`web/lib/motion.ts`) with CSS twins.
  `TabPane` runs 240 ms and honours reduced motion. The nav indicator glides.
- **Light ("Warm") theme** is coherent.
- **No horizontal overflow** at 390 px.

## 3. Root causes

1. **Styling lives in `style={{…}}`**: 3,573 in the 87 `dashboard-*.tsx` files,
   against 583 `className=`. Inline styles cannot express `:hover`, `:active`,
   `:focus-visible` or media queries. That is why feedback is missing and sizes
   drift.
2. **Loading has one state where it needs three.** "Not loaded yet" renders as
   "empty".
3. **Presence is enter-only.** Nothing uses `AnimatePresence`; overlays, tools,
   sub-views and disclosures hard-cut.
4. **No reserved space**, so late-mounting chrome and cards push everything
   around.
5. **Legacy palettes and primitives leak**: the Classic cream skeleton, and
   `Surface`/`Metric`/`Chip` rendering raw enums inside Nova.

---

## 4. Items

Each item carries a header line:
- **Ready:** whether an agent can finish it alone (§9).
- **Wave** (§13).
- **Needs:** the items it depends on.
- **Review:** who must see it before it counts as done:
  - `—`: the gates and tests are enough;
  - `shots`: the owner sees before/after screenshots;
  - `Tamil`: the owner signs off new Tamil copy in chat;
  - `astrologer`: doctrine-sensitive.

It also carries a **Gate** line: the `ux-audit` check that proves it (§12).

### P0: trust and continuity

#### DXA-01 `[ ]` Loading placeholders flash the Classic cream palette on the dark theme
Ready: yes · Wave 1 · Needs: — · Review: shots
- **Problem:** `web/app/dashboard/dashboard.css:726-758` forces
  `.cd-main-content .skel { background: var(--panel-tan, #D4C8AE) }` and a
  `--panel-tan-light` card border. Its premise, "the dashboard shell has a fixed
  cream background", died with the Nova migration. `--panel-tan` is not bridged
  under Nova.
- **Evidence:** dark probe: bar `rgb(212,200,174)` on card `rgb(26,30,49)`,
  contrast **9.95** (a quiet placeholder is 1.05–1.6). See `load-06.jpg` and
  `phone-today-viewport.png`.
- **Fix:**
  1. Re-point the block to Nova tokens:
     - bar `color-mix(in srgb, var(--color-text-strong) 8%, transparent)`;
     - shimmer peak `… 14%`;
     - card `var(--color-surface)`;
     - border `var(--color-border)`.
  2. Same for `.cd-skeleton` (`dashboard.css:704`).
  3. Update the stale comment.
- **Files:** `web/app/dashboard/dashboard.css`.
- **Gate:** `DXA-01` contrast within 1.05–1.6, dark **and** light.

#### DXA-02 `[ ]` `/dashboard` renders Today, then switches to the last-used tab (D1: Today is home)
Ready: yes · Wave 1 · Needs: — · Review: —
- **Problem:** the first render is Today (`dashboard-workspace.tsx:349`). The
  localStorage restore runs after `/auth/me` (`:796-801`) and swaps the tab.
  Login lands on bare `/dashboard`, so every returning user sees the swap.
- **Evidence:** `load-06…10.jpg` (Today), then `load-11.jpg` (Understand). The
  harness reports destinations `personal → calendar`.
- **Fix (D1):**
  1. In the hydration effect, stop restoring `activeTab`: drop the
     `sanitizeRestoredTab` branch. Keep restoring everything else (date, vault,
     profile ids, form state, lang).
  2. The path and the legacy `?tab=` still win exactly as today.
  3. `sanitizeRestoredTab` (`web/lib/dashboard-tabs.ts`) and its tests may
     become unused. Removing them is a deletion: ask the owner first, and do it
     last.
  4. Update the footer comment that says Glossary's "Back to dashboard …
     restores the last tab" (`dashboard-workspace.tsx:2193-2206`). Glossary
     returns to Today now; if returning to the previous tab matters, use
     `router.back()` there.
- **Files:** `web/components/dashboard-workspace.tsx`; possibly
  `web/app/dashboard/glossary/*`.
- **Tests:** a workspace/unit test that bare `/dashboard` with a stored
  `activeTab: "calendar"` stays on Today. Existing `dashboard-tabs.test.ts`
  stays green.
- **Gate:** `DXA-02` one destination, `personal`.

#### DXA-03 `[ ]` "Empty" copy shown while data is still loading
Ready: yes · Wave 1 · Needs: — · Review: shots
- **Problem:**
  - `needsProfile = !personal.birthProfileId` (`dashboard-workspace.tsx:671`)
    is true during the lookup, so Quick Links greys three tiles and setup copy
    shows.
  - Empty-state strings render during loading: `chart_no_profile`,
    `guidance_empty`, `panja_empty` (`web/lib/i18n.ts:293,319,446`), and "No
    family members yet" (`dashboard-today-glance-nova.tsx:1008`).
  - The Calendar rail shows "Nothing matches the selected filters" beside
    "Loading monthly panchangam…".
  - The hero shows the sun without a name.
- **Evidence:** cold load of `/dashboard/today`: false-empty copy from ~2–6 s
  to ~14 s (two dev runs). See `today-load-04.jpg`,
  `phone-calendar-viewport.png`, `dark-calendar-monthly.png`. On phone the
  placeholder state was still on screen when the page otherwise looked settled
  (`ux-audit-202609171257/phone-today.png`).
- **Fix:**
  1. `needsProfile = personal.birthProfileLookupDone && !personal.birthProfileId`.
  2. Every consumer of a nullable data prop distinguishes *loading* from
     *empty*. Pass `birthProfileLookupDone`, or a per-section status, down.
     Loading renders a shape-matched placeholder in the final layout; the empty
     copy renders only after a completed lookup found nothing.
  3. For the Calendar rail, show the empty line only when the month's request
     has resolved.
- **Files:** `dashboard-workspace.tsx`, `dashboard-today-tab-nova.tsx`,
  `dashboard-today-glance-nova.tsx`, `dashboard-calendar-tab-nova.tsx`,
  `dashboard-calendar-monthly-nova.tsx` (+ panels).
- **Tests:** RTL for glance cards: loading props render the placeholder, not
  the empty copy.
- **Gate:** `DXA-03` never.

#### DXA-04 `[ ]` "A few steps to get started" flashes for finished users
Ready: yes · Wave 1 · Needs: — · Review: —
- **Problem:** `onboardingDone` starts `false`. The gate effect
  (`dashboard-workspace.tsx:944-955`) treats a not-yet-fetched vault list as "no
  members". The banner (`:1719`) therefore shows, then disappears and shifts the
  page ~130 px. On Journal and Settings it stayed on screen after the page had
  settled.
- **Fix:**
  1. Expose `vaultsReady: vaultsQuery.isFetched` from
     `web/hooks/useFamilyData.ts` (next to `busyVaults`, line ~340).
  2. Make `onboardingDone` `boolean | null`, starting `null`. Decide it only when
     `personal.birthProfileLookupDone && family.vaultsReady`.
  3. Render the banner only when `=== false`, with height+opacity presence
     (DXA-13).
- **Gate:** `DXA-04` false (bare and Today loads).

#### DXA-05 `[ ]` Layout instability on load
Ready: yes · Wave 1 · Needs: — · Review: shots
- **Evidence:** over two dev runs: CLS **0.77–0.92** (Today) and **0.82–1.00**
  (Understand); document height changed 7–10 times; 2–3 shifts inside the top
  bar. Sources:
  - `footer.cd-footer` / `div.nova-sky`: panes resize as they mount.
  - `button.cd-tab--more`: the Ask pill mounts only when `chartId` exists
    (`dashboard-workspace.tsx:1648`) and pushes More ~225 px.
  - `div.cd-subbar__right`: status text, vault picker and chart line mount late.
  - Understand: the birth-star card arrives last and is inserted first.
  - Today: the glance rows move when the reading and the board mount.
- **Fix:**
  1. Always render the Ask pill, disabled until a chart exists.
  2. Give the sub-bar fixed slots with placeholders. "Data refreshed" becomes a
     transient toast, not chrome text.
  3. Give each pane a `min-height` equal to its last rendered height
     (`ResizeObserver`, stored per tab in memory).
  4. Render Understand's cards in final order with placeholders.
  5. Reserve the reading slot on Today.
- **Gate:** `DXA-05` CLS < 0.1 on both loads; top-bar shifts 0.

#### DXA-07 `[ ]` Changing the date collapses Today while the new day loads
Ready: yes · Wave 1 · Needs: — · Review: shots
- **Problem:** the bundle is `useQuery` keyed on `(chartId, selectedDate)`
  (`web/hooks/usePersonalData.ts:271-276`). A new date means a new key, so data
  is `undefined` and the page collapses.
- **Evidence:** hero **590 → 264 px**, page **4,029 → 1,376 px** within 78 ms,
  staying collapsed until the response.
- **Fix:**
  1. `placeholderData: keepPreviousData` (TanStack v5) on the bundle query (and
     on the week-ahead and dasha-story queries, which share the date).
  2. Expose `isPlaceholderData` as `personal.isShowingPreviousDay`. While it is
     true, dim the Today pane to 0.6 and show a 2 px progress hairline under
     the sub-bar.
  3. **Trap:** `dashboard-today-ribbon-nova.tsx` keys its page-turn on
     `selectedDate`. With placeholder data it would animate the *old* day under
     the new key. Key it on `panchangam.dateLocal` (the data's own date).
  4. Scores count from the old value (`useCountUp` already does).
- **Gate:** `DXA-07` hero keeps ≥ 90% height.

#### DXA-08 `[ ]` Raw enums and "None" rendered as copy
Ready: yes · Wave 1 · Needs: — · Review: —
- **Problem:** `NovaGocharCard` (`dashboard-today-deepdive-extras-nova.tsx:397-410`)
  renders **"ARDHASHTAMA_SANI"** (`moonBasedCycle.type`), **"Chandrashtamam:
  None"** and **"SUN · KANNI"**. Upper-case rasi names also reach the planet
  orbs, the planet table and the member tiles.
- **Fix:**
  - `saniCycleName(type, lang)` (already used by Family).
  - Graha and rasi display names from
    `packages/shared/src/i18n/panchangam-names.ts` or the existing `t*` helpers.
  - "Not today" in place of `label_none`.
  - Title-case rasi names in the display layer.
  - The upper-case rasi inside the backend `confirmationSentence` is a separate
    backend change: text only, no shape change. Grep `narrative_engine.py` per
    the almanac-naming rule. Record it; do not mix it into this change.
- **Gate:** `DXA-08` no enums, no "None", no upper-case rasi names.

#### DXA-09 `[ ]` Owner-ruling violations still on screen
Ready: stripe and echo, yes; emoji, partial (see DXA-24) · Wave 1 (stripe, echo) / Wave 3 (emoji) · Review: —
- **Accent stripe:** `dashboard-family-charts-hybrid.tsx:1233` uses
  `borderInlineStart: 3px solid ${accent}` on the birth-condition cards.
  - Replace it with a full 1 px `--color-*-border` border; the tone rides the
    chip.
  - Replace the undefined `--color-text-secondary` with `--color-text`.
- **Bilingual echo:** `dashboard-tools-tab-nova.tsx:334` renders "Tools ·
  கருவிகள்" (Tamil mode: "கருவிகள் · கருவிகள்"); `:356` always prints
  "திருமணப் பொருத்தம்". Active language only.
- **Emoji and text glyphs as icons:** 34 source lines, for example "🪔 Remedies",
  "🕒", "👋" (Family), "🕊" (Journal), "📍", "📅/🗓️" (Calendar segmented),
  `dashboard-hybrid-parts.tsx:241` "💼💰🧠", and the calendar legend
  🌟🌕🌑🐘🦚🪷🪔🎉🚫. Also text glyphs used as icons: "↻ ◇ ✎ + ⤓ ★ ▾ ☀ →".
  - Replace with Lucide where an equivalent exists, and `MiniMoonGlyph` for moon
    phases.
  - Deity or festival marks with no Lucide equivalent wait for DXA-24's glyph
    set. Do not invent icons.
- **Gate:** `DXA-09` stripes 0, Tamil-in-English 0, emoji/glyphs 0.

#### DXA-10 `[ ]` The page starfield shows through titles and translucent cards
Ready: yes · Wave 1 · Needs: DXA-17 (same component) · Review: shots
- **Evidence:**
  - A star sits between two words of the Goals title ("Plan·with confidence").
  - Specks inside the Tools hero card (`linear-gradient(…, transparent)`).
  - A dot after "30+ entries." on Journal.
  - Harness, tops of the tabs: 2 stars inside text lines, 6 visible through
    translucent surfaces.
- **Fix:**
  1. Mask `.nova-sky__stars` out of the content column. Stars live only in the
     gutters and the top crown.
  2. Headers and cards sit on opaque or blurred surfaces.
  3. The sky fades in on mount: today it pops, and its
     `transition: opacity 600ms` never fires
     (`celestial-ambient-nova.tsx:172`).
- **Gate:** `DXA-10` stars in text 0; stars through a translucent surface 0.

#### DXA-11 `[x] 2026-09-17` Reduced motion does not reach Framer layout animations
Done: DXA-11 indicator transforms 3 → 1; pane opacity 1 → 1; metrics `web/e2e/.artifacts/ux-audit-202609171446`; commit 929f317
Ready: yes · Wave 0 · Needs: — · Review: —
- **Evidence:** ~~with `reducedMotion: "reduce"` the nav indicator still slides
  for ~270 ms.~~ `TabPane` was correctly instant; MotionConfig and the reduced-
  motion indicator guard now leave the pane at opacity `1` and the indicator at
  one transform state.
- **Fix:**
  1. Wrap the workspace render in
     `<MotionConfig reducedMotion="user" transition={{ duration: DUR.base, ease: EASE_NOVA }}>`.
     This covers every `motion.*`, including `layoutId`.
  2. Fix the stale "keep this LAST" comment on the CSS guard
     (`dashboard-nova.css:3837`); ~600 lines follow it, and it wins through
     `!important`.
- **Gate:** `DXA-11` indicator transforms ≤ 1; pane opacity only `1`.

#### DXA-41 `[ ]` Top-bar menus ignore a page click and Escape
Ready: yes · Wave 1 · Needs: — · Review: —
- **Problem:** the "click outside to close" layer `.cd-overlay`
  (`dashboard.css:199-210`, `position: fixed; inset: 0`) is rendered inside
  `.cd-topbar`. That element has `backdrop-filter: blur(14px)`
  (`dashboard.css:96`), and a backdrop filter makes it the containing block for
  fixed descendants. The layer is therefore only as big as the header.
- **Evidence (probe, 1440 × 900):**
  - notifications and account-menu overlay rect **1440 × 93** at top 0;
  - after a click on the page body both menus **stay open**, and the click
    reaches the control underneath (a button, a textarea);
  - **Escape does nothing**;
  - they close only on a click inside the header;
  - the first harness run timed out on the next menu because the open overlay
    covered its trigger.
- **Why:** a menu that cannot be dismissed where the user is looking, and that
  lets a stray click act on the page behind it, feels broken.
- **Fix:**
  1. Render popover and overlay through a portal to `.cd-shell`, as
     `DrawerPanel` already does, so the layer really covers the viewport and
     swallows the dismissing click. Alternatively, drop the layer and close on a
     document `pointerdown` outside trigger and menu.
  2. Add Escape handling to the notifications popover and the account menu,
     returning focus to the trigger (the More menu already does this).
  3. Pair with DXA-13 `Presence`.
- **Gate:** `DXA-41` every overlay closes on Escape and on a page click.

### P1: make it feel alive

#### DXA-12 `[ ]` Clickable surfaces give no hover or press feedback
Ready: yes · Wave 2 · Needs: DXA-19 (tokens), DXA-39 · Review: shots
- **Evidence (real pointer):**
  - Today hero buttons: 0/3;
  - Quick Links: 0/8;
  - Tools cards: 0/4;
  - Family actions: 0/5;
  - press feedback: 0 everywhere.

  The harness baseline across Today, Tools, Family, Understand and Calendar is
  2/22 hover and 0/22 press. `.nova-interactive` (`dashboard-nova.css:2448`)
  has **zero** callers, and `.ui-card` has no hover rule.
- **Fix:**
  1. A kit `Pressable` (`web/components/ui/pressable.tsx`) that renders
     `button` or `a` with `.ui-pressable`.
  2. `.ui-card--interactive` for `button.ui-card`.
  3. Press states on `.ui-btn`/`.ui-pill`.
  4. Hover and press specs in §6.
  5. Convert: Quick Links, Tools cards and the Porutham hero, Family
     `HyActionButton`, Understand library tiles, hero buttons.
- **Gate:** `DXA-12` hover ≥ 95%, press 100%.

#### DXA-13 `[ ]` Overlays hard-cut in, and nothing animates out
Ready: yes · Wave 2 · Needs: DXA-19 · Review: shots
- **Evidence:**
  - More menu: 120 ms entrance (good).
  - Notifications (`dashboard-hero.tsx:484`), account menu (`:591`) and
    `ModalShell`: no entrance.
  - `DrawerPanel`: CSS entrance, no exit (it has no `open` prop; its parent
    unmounts it).
  - No `AnimatePresence` exists anywhere.
- **Fix:**
  1. A `Presence` primitive (`web/components/ui/presence.tsx`, kept out of the
     barrel because it pulls Framer) with the §6 overlay specs.
  2. Used by `ModalShell`, the three popovers, `DrawerPanel` (add an `open`
     prop) and the Ask panel.
  3. Popovers get `--elev-3` and `transform-origin` at their trigger.
- **Gate:** `DXA-13` enter and exit on every overlay.

#### DXA-14 `[ ]` Tools, sub-views and view switches hard-cut; segmented selection repaints
Ready: yes · Wave 2 · Needs: — · Review: shots
- **Evidence:** opening Numerology: no animation. Calendar "Best Dates": none.
  Goals and Life Areas sub-tabs: none.
- **Fix:**
  1. A `ViewSwap` primitive (crossfade plus a 4 px settle, 180 ms in / 120 ms
     out) for the Tools hub ⇄ tool swap, every `Segmented`-driven view and the
     Understand hub ⇄ detail.
  2. `Segmented` gets a **sliding thumb**: `motion.span` with a per-instance
     `layoutId` from `useId()`.
- **Gate:** none yet. Manual: each switch shows one crossfade in
  `getAnimations()`; add a harness check when implementing.

#### DXA-15 `[ ]` Disclosures pop open and shut
Ready: yes · Wave 2 · Needs: — · Review: —
- **Problem:** `CollapsibleSection` renders `{open && …}`
  (`collapsible-section.tsx:61`).
- **Fix:** keep the body mounted after first open. Animate
  `grid-template-rows: 0fr → 1fr` plus opacity (240 ms, `--ease-nova`). Keep the
  scroll-anchor pin.
- **Tests:** the existing collapsible behaviour, and
  `e2e/dashboard-render-pass.spec.ts`, which reads `aria-expanded`.

#### DXA-06 `[ ]` First visit to each tab fades a skeleton in, then hard-cuts
Ready: partial (implementation yes; acceptance needs a production build, see DXA-35) · Wave 2 · Needs: DXA-01, DXA-05, DXA-14
- **Evidence:** after a reload the incoming pane fades 0 → 1 while showing the
  12-node generic skeleton. Content replaces it with no transition (Calendar
  544 ms, Tools 756 ms, Family 954 ms; dev). Document height jumps
  940 → 2,575 / 8,109 px.
- **Fix:**
  1. A `TAB_LOADERS` map used both by each `dynamic(() => TAB_LOADERS.x())` and
     by a prefetcher (`requestIdleCallback` after Today settles, plus nav
     `pointerenter`/`focus`).
  2. Tab-shaped skeletons in Nova colours.
  3. Crossfade skeleton → content with a `DataSwap` primitive (§6), inside the
     DXA-05 `min-height`.
- **Gate:** `DXA-06` zero full-opacity skeleton frames. It is **INFO under
  `next dev`** and **gating with `--prod`**.

#### DXA-16 `[ ]` Motion token drift
Ready: yes · Wave 2 · Needs: — · Review: —
- **Evidence:**
  - Family: 29 of 31 transitions on generic `ease`.
  - 30+ literals (`150ms ease`, `0.2s ease`, `200ms ease-out`) in the dashboard
    CSS and inline styles.
  - `NovaProgressBar` animates `width` (`dashboard-ui-nova.tsx:356`).
  - `max-height` transition at `dashboard-globals.css:389`.
- **Fix:**
  1. Codemod to `var(--dur-*) var(--ease-nova)`; exits use `--ease-exit` (§6).
  2. Progress bars use `transform: scaleX()` with a draw-on.
  3. Add a guard grep for `\d+m?s ease\b` in the dashboard CSS and components.
- **Gate:** `DXA-16` tokens only.

#### DXA-17 `[ ]` Ambient loops outside the hero (D3: static page sky)
Ready: yes · Wave 2 · Needs: — · Review: shots
- **Evidence:**
  - 20 twinkling page stars;
  - `hy-float` × 10 planet orbs;
  - `hy-glow` × 2;
  - `hy-ring-pulse`, which animates **`box-shadow`** every frame on the harmony
    card (`dashboard-nova.css:2885`, `dashboard-family-charts-hybrid.tsx:936`);
  - `nova-pulse-dot` on Calendar (`dashboard-calendar-tab-nova.tsx:393`);
  - `nova-cal-today-travel` on the month grid;
  - the `DeepDiveOrbitGlyph` spin and glow in "Why this prediction"
    (`dashboard-today-tab-nova.tsx:1543`).
- **Fix (D3):** outside `.nova-hero`, no infinite animation.
  1. Page stars become static (drop the `nova-celestial__star` class on the page
     sky, keep the dots).
  2. Remove `hy-float`, `hy-glow` and `hy-ring-pulse` usage.
  3. The Calendar today cell keeps its steady ring (the reduced-motion frame
     becomes the only frame).
  4. The calendar pulse dot becomes static.
  5. `DeepDiveOrbitGlyph` renders without `spin` and without breathing.
  6. Inside the hero, the sky, chakra and live-state pulse dots stay.
  7. Loading indicators (`shimmer`, `om-pulse`, spinners) stay.
- **Gate:** `DXA-17` zero loops outside the hero; none paint `box-shadow`.

#### DXA-18 `[ ]` Long pages have no reading choreography
Ready: yes · Wave 2 · Needs: DXA-17 · Review: shots
- **Evidence:** `NovaReveal` and `NovaFadeIn` have one caller each. Family
  (8.8–10.4k px), Life Areas and Today are static on scroll.
- **Fix:** a section-level `Reveal` (§6) on `HySection`, the Life Areas groups
  and the Understand library. Once per session; headings and cards only, never
  table rows or chart cells.

#### DXA-37 `[ ]` One reading with a length switch (D4)
Ready: yes · Wave 2 · Needs: DXA-14 · Review: shots + Tamil
- **Problem:** Family renders `DashboardOneMinuteReading` ("Your chart in two
  minutes") and `DashboardFiveMinuteReading` ("… four minutes") stacked
  (`dashboard-family-charts-hybrid.tsx:1074,1081`). The second repeats the
  first's beats at twice the length.
- **Fix:**
  1. New `DashboardChartReading` (`web/components/dashboard-chart-reading.tsx`)
     renders **one** `.om` reading with a kit `Segmented` in its header:
     "2 min" / "4 min".
  2. Extract the fetch logic of both components into hooks
     (`useOneMinuteReading`, `useFiveMinuteReading`). Use the existing shared
     wrappers (`@vinaadi/shared/api/oneMinuteReading`, `…/fiveMinuteReading`);
     no new direct fetches.
  3. Show the switch **only when the four-minute reading loaded**. That
     endpoint 404s for any register other than "self" and when its flag is off;
     in those cases render the two-minute reading alone with no switch.
  4. Default to 2 min. Remember the choice per viewer in `localStorage`
     (`vinaadi-reading-length`).
  5. Swap with `ViewSwap`. Pin the header's viewport position across the swap:
     the 4-min body is ~2× taller (reuse `CollapsibleSection`'s anchor
     technique).
  6. The H2 follows the selection and keeps the measured names ("two minutes",
     "four minutes"). The naming rule `minutes = round(median EN words / 118)`
     stays authoritative, and the switch labels use the same numbers.
  7. The two-minute view keeps its pending-question (marital status) machinery.
  8. **Today is unchanged:** it still renders `DashboardOneMinuteReading` with
     `collapseWhenRead`.
  9. Replace the "→" in `.om__next` with a Lucide arrow (DXA-09).
- **Tamil:** switch labels (proposed "2 நிமிடம்" / "4 நிமிடம்") need the owner's
  sign-off in chat before shipping.
- **Tests:**
  - new RTL: no switch when the four-minute call 404s; switching changes the
    title; the choice persists.
  - keep `dashboard-one-minute-reading.test.tsx` green (`deferUntilVisible`,
    `collapseWhenRead`).
- **Gate:** add `readingSections` to the harness pane checks: Family shows
  exactly one `section.om`.

#### DXA-38 `[ ]` Tamil date hidden until the server answers (D6)
Ready: yes · Wave 1 · Needs: — · Review: astrologer (informational)
- **Problem:** `resolveTamilDate` falls back to `getTamilMonthDate`
  (`dashboard-calendar-shared.tsx:109-119`). That is a year-independent table
  its own comment admits is a day off for Karthigai, Thai and Panguni in 2026.
  It was also off on 17 Sept 2026: fallback **"Purattasi 1"**, server
  **"Aavani 31"**.
- **Fix (D6):**
  1. `resolveTamilDate` returns `""` when there is no server value.
  2. Callers render a width-reserved, `aria-hidden` placeholder (≈ 8ch)
     instead:
     - `dashboard-calendar-tab-nova.tsx:778, 1174`;
     - `dashboard-family-charts-hybrid.tsx:752`, where the date line drops the
       segment when it is empty.
  3. `getTamilMonthDate` and `TAMIL_MONTH_STARTS` become unused. Removing them
     is a deletion: ask the owner first. If eslint flags them before approval,
     say so in the handoff instead of deleting them.
- **Tests:** a unit test that `resolveTamilDate(undefined, …)` returns `""`.

#### DXA-39 `[ ]` Touch-target policy (D5, decided by the auditor)
Ready: yes · Wave 2 · Needs: — · Review: shots (owner's own touchscreen laptop)
- **Decision: size follows the device, hit area follows the finger.**
  1. **Phones and tablets**, `@media (pointer: coarse) and (hover: none)`: 44 px
     minimum *visual* height on `.ui-btn`, `.ui-pill`, `.ui-segmented__btn`,
     `button.ui-chip`, `.om__basis-toggle`, `.om__ask-btn` and
     `.om-recap__link`.
  2. **Touch-capable laptops**, `@media (any-pointer: coarse)`: no layout change.
     Compact controls get an invisible **hit slop** instead:
     - `position: relative` plus `::after { content: ""; position: absolute; inset: -8px -2px; }`;
     - vertical slop only, so neighbours in a row never overlap;
     - use `::before` where `::after` is taken.
  3. **`.ui-toggle` never takes `min-height`.** Its 38 × 22 track is the
     control; the bare `(pointer: coarse)` rule today stretches it to 44 px tall
     on a touch laptop. It gets the hit slop.
  4. **Everywhere**, interactive controls stay ≥ 28 px visually (WCAG 2.5.8 AA
     asks 24). Kit buttons are 38 px (small: 32 px).
- **Why:** phones need Apple's 44 pt and have the vertical room. The owner
  reviews on a touch laptop driven by a mouse, where a bare `(pointer: coarse)`
  floor bloated the Calendar rail on 15 Sep 2026. A hit slop gives a finger the
  same 44 px target on that device without moving a pixel, and a hybrid device
  gets correct targets without a layout designed for thumbs.
- **Fix:** move the two bare rules (`dashboard-nova.css:3476-3482`,
  `:3831-3835`) under the policy above. The Calendar blocks at `:2293-2304`
  already comply.
- **Tests:** new `web/app/dashboard/touch-policy.test.ts` (node env) parses
  `dashboard-nova.css` and fails if any `@media` prelude containing
  `pointer: coarse` without `hover: none` sets `min-height`, `min-width`,
  `height`, `width` or `padding`.
- **Gate:** that test; phone screenshots show 44 px controls.

### P1: visual system

#### DXA-19 `[ ]` No elevation system
Ready: yes · Wave 2 (first) · Needs: — · Review: shots
- **Evidence:**
  - `.ui-card` is flat (`dashboard-nova.css:2921`); the harness counts **91
    flat cards** across the tabs.
  - `--nova-card-shadow` reaches only legacy `.surface`, and
    `--nova-hover-shadow` only the unused `.nova-interactive`.
  - Popovers use the Classic `--color-shadow-warm` (brown at 16%,
    `dashboard.css:24,318`), which vanishes on navy.
- **Fix:** tokens in both theme blocks of `dashboard-nova.css`, built from the
  existing `--nova-card-shadow` / `--nova-hover-shadow` values:
  - `--elev-1` (resting card): 1 px inner top highlight + contact shadow;
  - `--elev-2` (hover or raised);
  - `--elev-3` (overlay): deep shadow + `--color-border-strong` +
    `backdrop-filter: blur(16px) saturate(140%)`.

  Map the kit `Card` variants, `.ui-card--interactive:hover`, `.cd-dropdown`
  and `.cd-alerts-popover` to them.
- **Gate:** `DXA-19` zero flat cards.

#### DXA-20 `[ ]` One spacing value everywhere, so no rhythm
Ready: yes · Wave 3 · Review: shots
- **Evidence:** Today stacks 8 sections at a uniform 16 px
  (`dashboard-today-tab-nova.tsx:530`). Five section titles are 16 px system
  type and one ("Why this prediction?") is 20 px gold display.
- **Fix:**
  1. `--rhythm-tight` 12, `--rhythm-group` 24, `--rhythm-section` 56 (48 below
     760 px).
  2. Chapters open with the kit `SectionHeader` (eyebrow + title + optional
     action). Today's chapters: Your day · Decide · Your period · People · Why.
- **Gate:** `DXA-20` top-level gaps ⊆ {12, 24, 48, 56}.

#### DXA-21 `[ ]` Type scale not honoured
Ready: yes · Wave 3 · Review: shots
- **Evidence:**
  - Distinct sizes: Today 11, Family 15, Life Areas 12, including 10.37, 12.5,
    13.12, 14.62, 30.4 and 39.04 px.
  - 10 px text: 121 nodes on Family, 107 on Life Areas.
  - H2 sizes range from 11 to 35 px across pages.
- **Fix:**
  1. Heading roles: page 35 (`--display-md`), chapter 26, card 20, eyebrow
     11 / 0.14em.
  2. Snap literals to `--text-*` (A+ playbook codemod).
  3. Retire `--text-2xs` from content.
  4. Where 13 px snaps to 14 px, flag the site in the handoff (the playbook's
     open per-site judgement).
- **Gate:** `DXA-21` ≤ 8 sizes, none < 11 px.

#### DXA-22 `[ ]` Corner radii drift
Ready: yes · Wave 3 · Review: —
- **Evidence:** Family renders 1, 3, 8, 10, 12, 14, 16 and 20 px plus 999 and
  9999.
- **Fix:** 8 (controls), 14 (cards), 20 (hero/panel), pill.
- **Gate:** `DXA-22` ≤ 4.

#### DXA-23 `[ ]` Accent drift, and a surface that should be a token
Ready: yes · Wave 3 · Review: shots
- **Evidence:**
  - "Turn on reminders" (gold fill) beside "More remedies" (purple outline).
  - The Settings kicker is purple where every other page uses gold.
  - Journal's "Save Entry" is a one-off dark outlined button.
- **Correction to the first draft:** the reading card's warm surface is
  **intentional** (`dashboard-nova.css:3484-3499`, "Deliberately NOT a Card").
  Keep it; name it.
- **Fix:**
  1. Accent grammar: gold acts, purple explains, and siblings never mix
     accents.
  2. `--color-surface-reading` defined in both themes and used by `.om`.
  3. Journal uses the kit primary button.
- **Gate:** manual: button census shows primary / secondary / ghost only.

#### DXA-24 `[~]` Icon system (custom astrology glyphs need design approval)
Ready: partial · Wave 3 · Review: owner design approval for custom glyphs
- **Agent part:** Lucide for all UI affordances; one 36 px icon "well"
  component shared by Quick Links, Tools and Understand.
- **Blocked part:** a drawn set for 9 grahas, 12 rasis and the panchangam limbs
  (1.75 px stroke to match Lucide). Needs an approved design. An agent must not
  invent it. Unblocks DXA-09's remaining emoji and DXA-33.

#### DXA-25 `[ ]` Chips stretched into bars
Ready: yes · Wave 3 · Review: —
- **Evidence:** the "Created" chip in Settings spans 350 px; the "Sankranti
  Birth" / "Dagda Rasi" chips span their card. This is the column-flex stretch.
- **Fix:** `.ui-chip { align-self: flex-start; width: fit-content; }`.

#### DXA-26 `[ ]` Freshness: leftovers and copy that reads unfinished
Ready: yes (EN) · Wave 3 · Review: Tamil for any new Tamil copy
- "**5L**" is hard-coded on every limb row (`dashboard-calendar-tab-nova.tsx:1575`)
  under "**Five Limbs**" (`:1561`), which lists **eight** rows. Remove the tag;
  retitle to "Panchangam today".
- "**Recent results** — coming soon" card (`dashboard-tools-tab-nova.tsx:391-401`):
  remove it until the feature exists. Removing JSX is not a file deletion.
- "**Draft: pending astrologer and native-speaker review**" in the Baby Name
  Finder description (`:223`): the user-facing copy drops it (the review status
  stays tracked in docs).
- Phrasing:
  - "Remaining 0 nazhigai 0 vinadi · 6:01 am until";
  - "10:48 am active since" → "since 10:48 am";
  - "A shared, care required day." (grammar);
  - the kicker "Transits & Events" above the Panchangam view.
- The sub-bar's permanent "✓ Personal data refreshed…" moves to a toast
  (DXA-05).
- **Three clocks disagree at dusk:**
  - the greeting turns "evening" at 17:00 (`greetingWord`);
  - the name ornament stays a sun until a hard-coded 18:00
    (`dashboard-today-tab-nova.tsx:680`);
  - the hero sky turns to dusk at 17:00 using the *browser* clock
    (`celestial-ambient-nova.tsx:388`), not the panchangam zone.

  Drive all three from `panchangam.sunrise`/`sunset` in the panchangam zone
  (`web/lib/tz.ts`).
- The Family 7-day outlook draws 38–52 as near-identical bars. Use a dot/line
  on a visible 0–100 scale (`dataviz` guidance).
- Planet orbs: 10 bodies in a 9-column grid orphan **Mandhi**. Use a 5 × 2
  layout at desktop.

### P1: phone

#### DXA-27 `[ ]` Phone chrome takes a fifth of the screen (D2: bottom tab bar)
Ready: yes · Wave 3 · Needs: DXA-02, DXA-13 · Review: shots
- **Evidence:**
  - At 390 × 844 the top bar is three rows plus a growing sub-bar, all pinned:
    **180–197 CSS px (21–23%)**, measured by the harness.
    ~~"~45%"~~: the first draft read 2× device-pixel screenshots as CSS pixels.
  - Content shows through the sub-bar.
  - "Goals" is overprinted by the scroll chevron ("G>a").
  - No `scroll-padding-top` anywhere. Family anchors use a fixed 72 px, less
    than the 93 px desktop header. WCAG 2.4.11 (AA) risk.
- **Fix (D2):**
  1. Below 760 px, a **bottom tab bar** (Today, Calendar, Family, Goals, More)
     with `env(safe-area-inset-bottom)`. The top strip is hidden at that width.
  2. **More** opens a sheet (DXA-13 `Presence`) with Life Areas, Tools,
     Understand, Journal and Settings.
  3. The compact top bar (wordmark, Ask, avatar) hides on scroll-down and
     returns on scroll-up (transform only).
  4. Sub-bar identity moves into the avatar sheet.
  5. `html { scroll-padding-top: var(--cd-header-h) }` from a measured custom
     property; anchors drop their fixed 72 px.
  6. Replace the overprinting chevron with an edge fade.
- **Tests:** `e2e/mobile-density-order.spec.ts` scopes by `button.cd-tab`.
  Update it deliberately and say so.
- **Gate:** `DXA-27` pinned top ≤ 120 px, bottom bar present, no overprinted
  labels, no overflow.

#### DXA-28 `[ ]` Phone Today opens with ~1,000 px of Quick Links
Ready: yes · Wave 3 · Review: shots
- **Evidence:** 8 tiles in two columns come before any daily content; the
  activity board starts **4.55 screens** down.
- **Fix:** below 560 px, a single-row snap scroller of compact tiles with an
  edge fade.
- **Gate:** `DXA-28` activity board within 2.5 screens.

### P2: signature moments

#### DXA-29 `[~]` One signature for "the day changed"
Ready: partial (build behind a flag, owner reviews a rendered preview) · Wave 4 · Needs: DXA-07
- The ribbon page-turn, the hero glyph arc and the score count become one
  choreographed beat (§6, "date change"). It plays for the date picker, the
  week dots and the evening preview.

#### DXA-30 `[ ]` Score reveal as a sequence
Ready: yes · Wave 4 · Review: shots
- Ring draw (900 ms) → number lands → verdict fades in at +300 ms → "Why this
  prediction" at +450 ms. Reduced motion shows the final state.

#### DXA-31 `[~]` Shared-element continuity
Ready: partial · Wave 4 · Needs: DXA-14 · Review: shots
- `document.startViewTransition` with `view-transition-name` for:
  - Quick Link → tool header;
  - member card → member reading;
  - calendar day → drawer;
  - library tile → detail.

  Progressive enhancement: fall back to `ViewSwap`; off under reduced motion.

#### DXA-32 `[~]` Login curtain → dashboard hand-off
Ready: partial · Wave 4 · Needs: DXA-02, DXA-03 · Review: shots
- **Evidence:** the curtain (`login-welcome-nova.tsx`) pushes to `/dashboard`,
  which shows ~0.75 s of empty shell, then a skeleton, then content.
- **Fix:** prefetch the Today bundle during the curtain; hold it until the
  bundle resolves (cap 2.5 s); crossfade into a rendered Today.

#### DXA-33 `[~]` Carry-over art work (blocked on assets)
Ready: no · Needs: DXA-24 design
- The birth chart still uses two-letter chips (`dark-family-s6.png`).
- `web/public/deities/` holds only a README.
- Calendar art is 1–3.6 KB placeholders except `moonlit-temple.png`.

### P3: guardrails and verification

#### DXA-34 `[x] 2026-09-17` Make the audit repeatable
Done: DXA-34 spec `VISUAL_AUDIT=1` load,tabs,reduced 1 passed (2.9 min), 6 ratcheted gates; unset → skipped; negative check (renamed key) → fails as MISSING; CLI after refactor DXA-11 PASS×2; metrics `web/e2e/.artifacts/ux-audit-wave0-recheck`, `ux-audit-dxa34-cli`; commit see git log (after 929f317)
Ready: yes · Wave 0
- **Done 2026-09-17:**
  - `web/scripts/ux-audit.mjs` (every gate in §12);
  - `scripts/ux-audit-stack.ps1` (isolated stack up / down / status).
- ~~**Remaining:** a CI-safe Playwright port (`web/e2e/dashboard-experience.spec.ts`,
  skipped unless `VISUAL_AUDIT=1`). Blocked on DXA-40, because the Playwright
  web server is destructive locally.~~ DXA-40 landed; the port is done:
  - the probes and gates moved to `web/scripts/ux-audit-core.mjs` (types in
    `ux-audit-core.d.mts`); `ux-audit.mjs` is now a thin CLI over it, so the
    CLI and the spec cannot drift;
  - `web/e2e/dashboard-experience.spec.ts` runs the same audit, skipped unless
    `VISUAL_AUDIT=1` (CI does not set it), with `retries: 0` and a 30 min cap;
  - it refuses any backend but e2e (`assertE2eBackend`), attaches
    `metrics.json` and `gates.txt`, and annotates every failing gate as
    "open gate" without failing on it;
  - **ratchet:** gates in its `MUST_PASS` map pass today and fail the test if
    they regress (or go missing while their phase ran). Add an item's gates
    there when it lands (§15).

#### DXA-35 `[~]` Verify in a production build
Ready: partial · Wave 4 · Needs: a prod mode for the stack
- **Dev console noise:** CSP violations on every lazy tab chunk
  (`script-src … 'strict-dynamic'`). Coincident with them, Today's
  server-rendered pane was replaced by a skeleton and then re-rendered. Also a
  hydration attribute-mismatch warning. Confirm or dismiss both with
  `next build && next start` before treating either as real.
- **To do that:**
  1. Add `-Mode prod` to `scripts/ux-audit-stack.ps1`: `next build`, then
     `next start` in the copy.
  2. Production CSP adds `upgrade-insecure-requests` (`web/lib/security-headers.ts:120`).
     If that breaks plain-http localhost, record it and verify on the staging
     preview instead. Do not weaken production headers to make a local check
     pass.

#### DXA-36 `[x] 2026-09-17` Hygiene
Done: DXA-36 hygiene check `}@keyframes` 1 → 0; `nova-cal-reveal` literal `200ms ease-out` → Nova tokens; metrics `web/e2e/.artifacts/ux-audit-202609171446`; commit 929f317
Ready: yes · Wave 0
- ~~`dashboard-nova.css:1825`: `}@keyframes nova-cal-reveal` sits on a rule's
  line.~~ It was split into its own rule line.
- ~~`nova-cal-reveal` uses `200ms ease-out` (DXA-16).~~ It now uses the Nova
  `--motion-nav` and `--ease-nova` tokens.

#### DXA-40 `[x] 2026-09-17` The local Playwright web server wipes the owner's running dev build
Done: DXA-40 safety acceptance `web/.next` listing unchanged (320 → 320), owner :3000 stayed available; metrics `web/test-results/`; commit 929f317
Ready: yes · Wave 0 · Review: —
- **Problem:** `next dev` runs `clean()` on start, deleting everything in
  `.next` except `cache` (`next/dist/server/dev/hot-reloader-webpack.js`).
  ~~`web/playwright.config.ts` starts `npm run dev -- --port 3100` inside `web/`.~~
  It now delegates to the isolated copy-based `serve` stack.
  So any local e2e run wipes the build of a dev server already on :3000.
  - CI is unaffected: it only runs e2e against `E2E_BASE_URL`.
- **Why not a second `distDir`:** `next-env.d.ts` references
  `./.next/types/routes.d.ts`. A different `distDir` rewrites that tracked file
  and needs tsconfig and `.gitignore` edits.
- **Fix:**
  1. Add `-Action serve` to `scripts/ux-audit-stack.ps1`: `up`, then block until
     the process is stopped, then `down`.
  2. Point `playwright.config.ts`'s local `webServer` at it, so Playwright owns
     an isolated copy instead of `web/` (the combined action starts both the
     frontend and backend).
  3. Keep `global-setup.ts`'s environment guard.
- **Acceptance:** with a dev server on :3000, a full local Playwright run leaves
  `web/.next` untouched (compare a file listing before and after) and :3000
  keeps serving.

---

## 5. Page-by-page direction

| Page | Now | What makes it world-class |
|---|---|---|
| **Global chrome** | B− | Stable top bar (05); popovers with elevation and presence (13, 19); status as toast; phone bottom bar (27). |
| **Today** | A− craft / C experience | Chapters with rhythm (20); pressable tiles (12); keep-previous-day date change and one signature beat (07, 29); score sequence (30); no false-empty (03). |
| **Calendar** | B+ | Keep the landscape header and reuse its treatment for other page headers. Remove "5L" and fix the title (26); fill the empty band above the sun arc; sliding segmented thumb and view crossfade (14); day → drawer continuity (31). |
| **Family & Charts** | B− | One reading with a length switch (37); no stripe or emoji (09); static orbs (17); section reveals (18); title-case rasis (08); outlook chart and Mandhi fix (26); a sticky in-page index (Overview · Members · Charts · Periods · Remedies) for a 9–10k px page. |
| **Goals** | C+ | An illustrated first-goal moment with 3 suggested goals as pressable cards; move the unrelated "Family & Charts" header button; star fix (10). |
| **Life Areas** | C+ | Retire the legacy gochar card (08); shorten "Chart patterns (Yogas) & Difficult placements (Doshams)" to "Yogas & Doshams"; move the member switch into the header row. |
| **Tools** | B− | Pressable cards with elevation (12, 19); no echo, draft note or coming-soon card (09, 26); opaque hero (10); hub → tool continuity (14, 31). |
| **Understand** | B | Stable card order (05); pressable library tiles; hub → detail transition. |
| **Journal** | B− | Reserved prompt chips instead of "Loading prompts…" (03); kit primary Save; no dove emoji; 180 ms saved confirmation. |
| **Settings** | C+ | Set-up users open on Account, not onboarding copy; gold kicker and fitted chips (23, 25); a real skeleton for "Loading your birth profiles…". |
| **Phone** | C | DXA-27 and DXA-28. |

## 6. Motion system v2: the choreography spec

Binding principles (from 2026-08-20):
- motion orients, connects, reveals, or marks meaning;
- one lead per change;
- ≤ 8 px travel;
- enter on `--ease-nova`, exit faster on `--ease-exit`;
- reduced motion keeps meaning and drops travel.

New tokens (CSS in `dashboard-nova.css` beside `--dur-*`; JS twins in
`web/lib/motion.ts`):
- `--dur-press: 90ms`
- `--dur-exit: 140ms`
- `--ease-exit: cubic-bezier(0.4, 0, 1, 1)`

| Moment | Trigger | What moves | Duration / easing | Reduced motion |
|---|---|---|---|---|
| Tab switch (warm) | nav click | incoming pane opacity 0→1, y 6→0 | 200 ms, ease-nova | instant |
| Tab switch (cold) | chunk not ready | tab-shaped skeleton → content crossfade | 160 ms | instant swap |
| Nav indicator | nav click | `layoutId` glide | 240 ms, ease-nova | none (MotionConfig) |
| Segmented thumb | sub-view change | `layoutId` glide | 220 ms, ease-nova | none |
| Sub-view / tool swap | segmented, tool open | crossfade + y 4→0 | 180 ms in / 120 ms out | instant |
| Hover (card) | pointer enter, `hover: hover` | y −2, `--elev-1`→`--elev-2`, border → strong | 180 ms | colour/shadow only |
| Press (card) | pointer down | scale 0.985 | 90 ms; release 180 ms | none |
| Press (button) | pointer down | scale 0.97 | 90 ms | none |
| Popover | open / close | opacity + y −4 + scale 0.98, origin = trigger | 160 in / 120 out | opacity 80 ms |
| Modal | open / close | backdrop 160 ms; panel y 8 + scale 0.98 | 240 in / 160 out | opacity only |
| Drawer / sheet | open / close | x 24→0 (sheet: y 24→0) + opacity | 240 in / 180 out | opacity only |
| Disclosure | toggle | grid-rows 0fr→1fr + opacity; chevron 180° | 240 / 180 ms | instant |
| Data arrival | fetch resolves | placeholder → content crossfade | 200 ms | instant |
| Numbers | first reveal or change | count from previous value | 600–900 ms | final value |
| Date change | picker, week dot | old day at 0.6 while loading; then x 10→0 + fade; glyph arc | 280 ms | instant |
| Score | first reveal | ring → number → verdict (+300 ms) → link (+450 ms) | 900 ms | static |
| Toast | save, refresh | y 12→0 + fade; 4 s | 200 ms | fade |
| Scroll reveal | section enters view | once per session, opacity + y 8, stagger 50 ms, ≤ 5 per group | 360 ms | none |
| Ambient | idle | **Today hero only** (D3); opacity/transform; paused off-screen | 3–240 s | frozen |

**Budgets:**
- Feedback starts within 100 ms.
- View changes finish within 240 ms.
- Only the score and the login curtain exceed 400 ms.
- Never animate `width`, `height` or `top`, and never loop `box-shadow` or
  `filter`.

**Primitives to build.** All live in `web/components/ui/`. Any that import
Framer stay **out of the barrel** (`index.ts`); import them directly.
- `Pressable`
- `Presence`
- `ViewSwap`
- `DataSwap`
- `Reveal` (rename of `NovaReveal`)
- the `Segmented` thumb
- plus `<MotionConfig>` at the workspace root.

## 7. Visual system v2

- **Surfaces:** base `--color-bg` → card `--color-surface` + `--elev-1` →
  raised `--color-surface-soft` + `--elev-2` → overlay + `--elev-3` + blur.
  The reading surface is `--color-surface-reading`. No translucent card over
  the sky.
- **Rhythm:** 12 / 24 / 56. Chapters use `SectionHeader`.
- **Type:** Fraunces for display (page 35, chapter 26), system UI for
  interface, Source Serif 4 for reading only. 11 px floor.
- **Radius:** 8 / 14 / 20 / pill.
- **Accent grammar:** gold acts, purple explains, semantic colours report.
- **Icons:** Lucide plus an approved astrology set. No emoji, no text glyphs.
- **Sky:** hero plus a static page crown; stars in gutters only.
- **Headers:** reuse the calendar's feathered-art header (same palette and
  mask, one image per page) once art exists.

## 8. Status of the earlier audits (re-verified 2026-09-17)

| Earlier item | Status |
|---|---|
| 08-20 P0.1: TabPane 240 ms + reduced motion | **Done** (`dashboard-workspace.tsx:307-309`) |
| 08-20: indicator glide, not spring | **Done**; the reduced-motion leak is DXA-11 |
| 08-20 P0.2: align CSS timing tokens | **Open**, DXA-16 |
| 08-20 P0.3: shared presence / selection / crossfade / press primitives | **Partial**, DXA-12/13/14 |
| 08-20 P0.4: motion QA check | **Partial**: harness done; CI port DXA-34 |
| 08-20: no loops in reading content | **Open**, DXA-17 (D3 widens it) |
| 07-18 #1: birth-chart visual upgrade | **Open**, DXA-33 |
| 07-18 #5: deity / calendar art | **Open**, DXA-33 |
| 07-18 #7: `day-strip.tsx` | **Closed** (the file no longer exists) |

---

# Part B: Execution guide for coding agents

## 9. Can an agent pick this up?

**Mostly yes.** An agent that follows this part can finish the **32 of 41**
items marked **Ready: yes** and prove each with a gate or a stated check. The
other 9 need a production build, another item first, or something only the
owner can give:

| Needs | Items |
|---|---|
| A production build to *prove* the fix (implementation itself is agent work) | DXA-06, DXA-35 |
| Another item first | DXA-09 emoji part (needs DXA-24's glyphs) |
| Owner review of a rendered preview before it ships | DXA-29, DXA-31, DXA-32 (and every item marked `Review: shots`, as a final look) |
| The owner's sign-off on new Tamil copy, in chat | DXA-37 labels, any Tamil in DXA-26 |
| Approved design assets; an agent must not invent them | DXA-24 (custom glyphs), DXA-33 |
| A per-file deletion approval | removing `sanitizeRestoredTab` (DXA-02), `getTamilMonthDate` (DXA-38), any dead file |

What made the first draft insufficient, fixed in this revision:
- open decisions (now §0);
- no way to prove "done" (now the harness and gates);
- the harness lived only in a gitignored folder on one machine (now
  `web/scripts/`);
- environment traps that silently corrupt a run (now §11 and §14).

## 10. Rules of engagement

1. **Read `CLAUDE.md` first.** PowerShell from `D:\sanstro`, DB safety, the
   four-surface API contract, synthetic fixtures only.
2. **One item per change** (or a group this doc lists together). No drive-by
   cleanups: grandfathered direct fetches in `web/` stay unless the item says
   otherwise.
3. **Owner rulings are binding:**
   - no accent left border, including `borderInlineStart`;
   - active language only;
   - no emoji or text-glyph icons;
   - Tamil almanac naming;
   - Tamil clock period-words (மதியம் 1:42, never "pm"; no em-dash in Tamil
     copy);
   - Nova is the only colour and type source;
   - no Tailwind, shadcn or Radix;
   - never take palettes, fonts or section orders from the `ui-ux-pro-max`
     skill.
4. **Tamil copy:** list every new or changed Tamil string in the handoff for the
   owner's sign-off. Never date a review marker without an explicit "approved".
5. **Doctrine-sensitive values** (dates, anything the engine computes): no
   client approximations. If the server has no value, show nothing (D6).
6. **Frontend-only by default.** A backend text fix goes in its own change
   after a grep of all four API surfaces. New endpoints get a shared wrapper.
7. **Deletion last, and one question per file** (or per dead function/table).
8. **Keep `web/components/ui/index.ts` lean.** Framer-based primitives are
   imported directly.
9. **Never overwrite an existing test file** with a whole-file write. Check
   `git status`, then edit or append. Update tests that assert old copy; add
   tests for new behaviour.
10. **Do not commit unless asked.** This branch carries many unrelated
    uncommitted changes, so stage only your own paths (`git add <paths>`),
    never `-A`.
11. **Report honestly:** gate values before and after, failures as failures,
    skipped checks named.

## 11. Environment: rendering signed-in pages safely

- **Never start `next dev` inside `web/` while the owner's :3000 server runs.**
  It deletes `web/.next` (DXA-40).
- **A local `playwright test` is safe** since DXA-40: its `webServer` runs
  `ux-audit-stack.ps1 -Action serve`, which builds from the copy and tears the
  stack down when Playwright exits. Do not run it while a manual `up` stack is
  holding :3100/:8010; `serve` refuses busy ports.
- **Isolated stack**, run from `D:\sanstro`:
  ```powershell
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action up
  node web\scripts\ux-audit.mjs                     # all phases, ~7-10 min on next dev
  node web\scripts\ux-audit.mjs --phases load,tabs  # a subset
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action down
  ```
- **Same audit as a Playwright test** (DXA-34), with the ratchet:
  ```powershell
  Set-Location D:\sanstro\web
  $env:VISUAL_AUDIT = "1"
  $env:VISUAL_AUDIT_PHASES = "load,tabs,reduced"   # optional; default all
  npx playwright test e2e/dashboard-experience.spec.ts --project=chromium
  ```
  With no `BASE_URL`, Playwright starts and stops the stack itself (`serve`).
  If a manual `up` stack is already running, set
  `$env:BASE_URL = "http://localhost:3100"` so Playwright reuses it instead.
  - `up` copies `web/` to `artifacts\ux-stack\web` (gitignored), links
    `node_modules`/`packages`, starts :8010 (`vinaadi_e2e`) and :3100, and
    refuses to finish unless the proxy reports `environment: e2e`.
  - Code changes are picked up only by re-running `up`. Run `down` first, then
    `up` again.
  - `down` stops only the processes it recorded and removes the links.
  - Never `Remove-Item -Recurse` `artifacts\ux-stack` while links exist.
- **The harness refuses any backend but e2e.** It registers a fresh
  `ux-audit-*@e2e.test` account each run. Use `--email` to reuse one.
- **Address Today as `/dashboard/today`** until DXA-02 lands; bare `/dashboard`
  restores another tab.
- **Dev-console CSP chunk warnings** are DXA-35's question, not your bug, unless
  reproduced in a production build.

## 12. Verification ladder, definition of done, baseline

**For every item, in `D:\sanstro\web`:**
1. `.\node_modules\.bin\tsc.CMD --noEmit`
2. `.\node_modules\.bin\vitest.CMD run` (targeted first, then full before
   handoff)
3. `.\node_modules\.bin\eslint.CMD <changed files> --max-warnings=0`
4. Isolated stack `up` → `node web\scripts\ux-audit.mjs --phases <relevant>` →
   compare the item's gate to the baseline below → `down`.
5. Visual items: before/after screenshots in dark, light and 390 px. Motion
   items: also a reduced-motion run.

**Done means all of these:**
- the item's gate passes (or its stated manual check is met);
- no other gate regressed against the baseline;
- tsc, vitest and eslint are green, with tests added or updated;
- new Tamil strings are listed for sign-off;
- the item is marked `[x] YYYY-MM-DD`, with the gate value and the metrics
  folder path, in this file.

**Baseline, 2026-09-17** (`web/e2e/.artifacts/ux-audit-202609171309/metrics.json`,
`next dev`, 429 s): **36 FAIL · 5 PASS · 3 INFO.** Timings and CLS move between
dev runs (an earlier run gave CLS 0.92 / 1.00 and false-empty from 6.4 s), so
compare pass/fail, not decimals.

| Gate | Check | Baseline | Result |
|---|---|---|---|
| DXA-01 | skeleton bar/card contrast, dark (1.05–1.6) | 9.95 | FAIL |
| DXA-01 | same, light | 1.30 | PASS |
| DXA-02 | bare `/dashboard` shows one destination | personal → calendar | FAIL |
| DXA-03 | no empty-state copy while loading (Today) | 1,947–13,800 ms | FAIL |
| DXA-04 | no onboarding banner for a set-up account | seen (bare and Today) | FAIL |
| DXA-05 | CLS < 0.1, Today cold load | 0.77 | FAIL |
| DXA-05 | no top-bar / sub-bar shifts | 2 | FAIL |
| DXA-05 | document height changes during load | 7 | INFO |
| DXA-05 | CLS < 0.1, Understand cold load | 0.82 | FAIL |
| DXA-06 | full-opacity skeleton frames on first tab visits | 78 | INFO (gates with `--prod`) |
| DXA-07 | hero keeps ≥ 90% height through a date change | 0.45 | FAIL |
| DXA-08 | no raw enums / "None" / upper-case rasi names | `ARDHASHTAMA_SANI`; `MITHUNAM`, `DHANUSU`, … | FAIL |
| DXA-09 | no accent stripes | Family: 1 | FAIL |
| DXA-09 | no Tamil in English mode | Tools: echo + "திருமணப் பொருத்தம்" | FAIL |
| DXA-09 | no emoji / text glyphs as icons | Calendar, Family, Journal, Today | FAIL |
| DXA-10 | no page-sky star inside a text line | 2 | FAIL |
| DXA-10 | no star through a translucent surface | 6 | FAIL |
| DXA-11 | reduced motion: indicator does not move | 3 transforms | FAIL |
| DXA-11 | reduced motion: pane without a fade | 1 | PASS |
| DXA-12 | hover feedback ≥ 95% | 2 / 22 | FAIL |
| DXA-12 | press feedback = 100% | 0 / 22 | FAIL |
| DXA-13 | enter + exit animation (More, notifications, account, Ask, day drawer) | only More and the drawer enter; none exit | FAIL × 5 |
| DXA-16 | Nova easing tokens only | `ease` present | FAIL |
| DXA-17 | no infinite animation outside the hero | page twinkles, orbs, ring pulse, calendar loops | FAIL |
| DXA-19 | cards resolve an elevation shadow | 91 flat | FAIL |
| DXA-20 | top-level gaps ⊆ {12, 24, 48, 56} | 16, 20, 24, 48 | FAIL |
| DXA-21 | ≤ 8 font sizes, none < 11 px | 15 sizes, 240 tiny | FAIL |
| DXA-22 | ≤ 4 corner radii | 9 | FAIL |
| DXA-27 | pinned top chrome ≤ 120 px (scrolled) | 197 px | FAIL |
| DXA-27 | bottom tab bar present | 0 px | FAIL |
| DXA-27 | no overprinted tab labels | Goals / Life Areas | FAIL |
| DXA-27 | no horizontal overflow | none | PASS |
| DXA-28 | activity board within 2.5 screens | 4.55 | FAIL |
| DXA-37 | Family shows exactly one reading | 2 | FAIL |
| DXA-41 | closes on Escape and page click: More / notifications / account | Esc only / neither / neither | FAIL × 3 |
| DXA-41 | same: Ask panel, day drawer | both work | PASS × 2 |
| — | console errors (dev CSP chunk warnings included) | 20 | INFO |

## 13. Waves and dependencies

| Wave | Items, in order | Why this order |
|---|---|---|
| 0: tooling and safety (**done 2026-09-17**) | DXA-40, DXA-11, DXA-36, DXA-34 | a safe referee first; MotionConfig unblocks all motion work |
| 1: trust | DXA-01, 02, 03, 04, 05, 07, 08, 09 (stripe, echo), 38, 41, 10 | the broken moments users see on every visit |
| 2: feel | DXA-19 (tokens) → 39 → 12 → 13 → 14 → 15 → 06 → 16 → 17 → 18 → 37 | elevation tokens feed hover and overlays; the touch policy feeds `Pressable`; `ViewSwap` feeds the reading switch |
| 3: finish | DXA-20, 21, 22, 23, 24 (Lucide part), 25, 26, 09 (emoji), 27, 28 | rhythm and type after the primitives exist; the phone bar after D1 and `Presence` |
| 4: signature | DXA-30, 29, 31, 32, 35; 33 when assets exist | each behind an owner-reviewed preview |

## 14. Traps that have already cost this repo time

- **`<Card>` is already a column flexbox.** A horizontal card needs
  `flexDirection: "row"` explicitly, or `flex-basis` applies to height.
- **Framer layout animations ignore the CSS reduced-motion guard.** Gate them
  in JS (`MotionConfig`).
- **Source search misses built names and logical properties.**
  `as-rasi--${tone}` and `borderInlineStart` are invisible to naive greps.
  Verify in the render.
- **Never round-trip source through PowerShell.** It adds a BOM and garbles
  Tamil. Use the editor tool; Tamil files stay UTF-8 without BOM.
- **Hero test anchors constrain markup:**
  - `getByText(/Best window/).closest("div")` must contain the window time;
  - `getByText(/^Avoid window$/).closest("div").parentElement` is the avoid
    card.
- **`dashboard-workspace.test.tsx` matches the source text** of the
  `hasVisitedReading` effect. Keep that effect's shape.
- **`pointer: coarse` matches the owner's laptop** (DXA-39).
- **A local test failure is not authoritative.** Another session's pytest can
  drop the test schema mid-run; check for competing runs; CI decides.
- **Playwright's `reuseExistingServer` reuses whatever sits on :3100.**
  `global-setup.ts` guards the database, not your code version.
- **The first-run focus picker can mount late and eat clicks** on new accounts.
  The harness pre-sets the life mode.

## 15. Status-update protocol

When an item is done, edit its heading line in §4 in place:
`[ ]` → `[x] 2026-MM-DD`. Add one line under the header: `Done: <gate> <before>
→ <after>; metrics <folder>; commit <sha or "uncommitted">`. Add the item's
passing gates to `MUST_PASS` in `web/e2e/dashboard-experience.spec.ts` in the
same change, keyed `<id> <check>` exactly as the gate table prints them. Partial
progress uses `[~]` with the blocking reason. Do not delete findings; strike through
text that stopped being true and say why.

## 16. Evidence index

First audit pass: `web/e2e/.artifacts/dashboard-experience-audit-2026-09-17/`
(gitignored).
- `load-00…17.jpg`: bare `/dashboard` cold load; the restore swap happens at
  frames 10 → 11.
- `today-load-00…15.jpg`: `/dashboard/today` cold load.
- `today-*.png`: Today settled; `today-next-day.png`: after a date change.
- `dark-<tab>-*.png`, `light-*.png`, `phone-*.png`: every destination per theme
  and width.
- `overlay-*.png`, `switch-*.jpg`, `dial-*.png`.
- `metrics*.json`: raw probes of the first pass.
- `harness/`: the first-pass scripts, superseded by `web/scripts/ux-audit.mjs`.

Baseline run of the tracked harness:
`web/e2e/.artifacts/ux-audit-202609171309/` (gitignored). The earlier run
`ux-audit-202609171257/` predates two probe fixes (easing parse, star
occlusion) and a hung overlay close; do not compare against it.

Known invalid measurements in the first pass, excluded above:
- its "Today" section shots are Understand (the DXA-02 restore);
- its Understand hover census measured hidden Tools buttons;
- its first date-change probe did not change the date.
