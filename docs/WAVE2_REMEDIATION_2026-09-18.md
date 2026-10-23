# Wave 2 remediation — Dashboard Experience Audit (2026-09-18)

**Paste everything below the line into the agent.** It is written to be picked
up cold. It supersedes nothing in `docs/AGENT_HANDOFF_WAVE2_2026-09-18.md` —
read that first; this document is the correction list that came out of
reviewing the work done against it.

Owner: delete this file when the last task closes, or fold what survives back
into the audit.

---

You are finishing Wave 2 of the Dashboard Experience Audit in the Vinaadi AI
repo. A previous agent did a first pass. **Two of its eight items are genuinely
done; six are not, and the tree is currently red.** Your job is to clear the
failures, replace the shortcuts with the real implementations, and finish the
two items that were correctly reported as partial.

Nothing has been committed. Every change discussed here is sitting uncommitted
in the working tree on `harden/production-readiness`. Do not `git checkout` or
`git stash` anything — the good work and the bad work are in the same files.

## Read first, in this order

1. `AGENTS.md`
2. `CLAUDE.md` — authoritative. Repo root, PowerShell, encoding, DB safety.
   The two sections that matter most here are **"A gate proves its own check,
   not the item"** and **"Debugging discipline — suspect your own inputs"**.
3. `docs/AGENT_HANDOFF_WAVE2_2026-09-18.md` — the original work order,
   including the environment commands and the trap list. All of it still
   applies.
4. `docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md` — §10, §12, §15.

Repo root is `D:\sanstro`. **PowerShell**, chain with `;` not `&&`, no `head`
(use `Select-Object -First N`).

## The one rule the last pass broke, stated plainly

**A gate that cannot fail is worse than no gate.** Three of the six "done"
items were passed by making the measurement return a constant rather than by
fixing the thing measured. If your change makes a gate green, you must prove
the gate could still have gone red:

```
1. implement the fix
2. run the gate            -> expect PASS
3. revert ONLY the fix     -> run the same gate -> it MUST FAIL
4. restore the fix         -> run the gate again -> PASS
5. write down what the gate cannot see, and go look there by hand
```

Save both runs. Name the folders `ux-audit-dxa<NN>-negative` and
`ux-audit-dxa<NN>-after`, the way Waves 0 and 1 did — there are ten
`ux-audit-dxa07-negative*` folders on disk as the worked example. **There is
not one negative-control folder for any Wave 2 item.** That is the single
biggest process gap to close.

No item may be marked `[x]` or added to `MUST_PASS` without its negative
control on disk.

---

# Current state — reproduce this before you change anything

From `D:\sanstro\web`:

```powershell
Set-Location 'D:\sanstro\web'
.\node_modules\.bin\tsc.CMD --noEmit          # currently clean
.\node_modules\.bin\vitest.CMD run            # currently 4 FAILED / 916
```

The four failures, verbatim:

```
FAIL lib/orphan-scan.test.ts > finds exactly the declared orphans
  -> expected [ 'pressable' ] to deeply equal []

FAIL components/dashboard-hero.test.tsx > More menu keyboard behaviour
     > closes on Escape and hands focus back to the trigger
  -> expect(screen.queryByRole("menu")).toBeNull()  ... found the menu

FAIL components/dashboard-hero.test.tsx > top-bar menu dismissal (DXA-41)
     > closes notifications on Escape and returns focus to its trigger
  -> expect(element).not.toBeInTheDocument()  ... found <p class="cd-empty-note">

FAIL components/dashboard-hero.test.tsx > top-bar menu dismissal (DXA-41)
     > uses the shell-level layer to dismiss notifications on a page click
  -> expect(element).not.toBeInTheDocument()  ... found <p class="cd-empty-note">
```

**DXA-41 is a shipped Wave 1 item and all five of its gates are already in
`MUST_PASS`** (`web/e2e/dashboard-experience.spec.ts:58-60` and `:64-65`).
Wave 2 regressed it. That is the first thing to fix and the last thing to
re-verify.

## What the browser runs actually say

The audit doc cites three runs. Five more runs happened afterwards and were not
recorded. Reading `metrics.json` from each:

| run | phases | DXA-13 | DXA-41 |
|---|---|---|---|
| `ux-audit-202609181335` | tabs, overlays | 5/5 pass | 5/5 pass |
| `ux-audit-202609181930` | tabs, hover, overlays | 5/5 pass | **more-menu escape:false** |
| `ux-audit-202609181942` | overlays | 5/5 pass | **more-menu + notifications page-click:false** |
| `ux-audit-202609182015` | overlays | **more-menu enter:false** | 5/5 pass |
| `ux-audit-202609182025` | overlays | **ask-vinaadi + day-drawer enter:false** | 5/5 pass |
| `ux-audit-202609182035` | overlays | **more-menu enter:false** | 5/5 pass |
| `ux-audit-202609182045` | overlays | 5/5 pass | **more-menu page-click:false** |

Both items were ratcheted into `MUST_PASS` on the strength of the one green run
each. **Neither is stable.** Treat a gate that passes 3 runs in 6 as failing.

---

# Task order

Do them in this order. R1 and R2 unblock everything else, and R2 will turn
several currently-green gates red — that is the point, and it is how you find
out what the real state is.

---

## R1 — Clear the red suite  ·  blocking  ·  no gate, the suite is the gate

### R1.1 The DXA-41 regression

**Cause.** `Presence` (`web/components/ui/presence.tsx`) wraps its child in
`AnimatePresence`, which keeps the child mounted for the length of the exit
transition. The three hero menus were converted to it
(`web/components/dashboard-hero.tsx:505`, `:590`, `:695`). The DXA-41 tests
assert the menu is *gone* immediately after Escape or a page click. In jsdom
framer's exit never completes, so the node stays in the document forever.

This is trap #5 in the original handoff, verbatim: *"Framer's `AnimatePresence`
keeps an exiting view mounted. In jsdom that exit never completes, so an RTL
test will see two of everything. Mock the presence primitive in unit tests and
verify the animation in the browser."*

**Do not** weaken the DXA-41 assertions to match the new behaviour. Those
assertions encode a shipped, owner-visible behaviour: the menu is dismissed.

**Fix, both halves:**

1. **Unit side.** Add a jsdom mock for `Presence` so the exit resolves
   immediately, i.e. `open === false` renders `null`. Put it in the hero test's
   setup, not in the component. Something equivalent to:

   ```ts
   vi.mock("./ui/presence", () => ({
     Presence: ({ open, children, ...rest }: any) =>
       open ? <div {...rest}>{children}</div> : null,
   }));
   ```

   Mock it in every RTL test that renders a converted overlay — at minimum
   `dashboard-hero.test.tsx`. Grep for other tests that render `ModalShell` or
   `DrawerPanel` and add the same mock where they now see a retained node.

2. **Browser side — this is the real bug, and the mock does not fix it.**
   The dismiss layer and the menu are now on different lifecycles:

   ```tsx
   {showMoreMenu && <PageDismissOverlay onDismiss={() => closeMoreMenu(false)} />}
   <Presence open={showMoreMenu} …>
   ```

   `PageDismissOverlay` unmounts on the same tick the state flips. The menu
   stays on screen for the 160 ms exit. In that window the menu is visible and
   nothing is behind it to catch a click — which is exactly what the flapping
   DXA-41 `page-click:false` results are seeing, and what the flapping DXA-13
   `enter:false` results see from the other side (a re-open that lands while
   the previous exit is still running).

   **Fix it by giving the overlay the same lifetime as the menu**: move
   `PageDismissOverlay` inside `Presence`, or render it from a shared retained
   flag that only clears on `onExitComplete`. One source of truth for "is this
   overlay on screen", not two.

3. **Delete the speculative backstops.** `dashboard-hero.tsx:306-327` adds a
   document-level `keydown` + `pointerdown` pair for the More menu, with a
   comment theorising about "some browsers" and "a portalled dismiss layer".
   That was added to paper over the lifecycle bug, it is not based on a
   measurement, and the gate still flaps with it in place. Remove it once the
   lifecycle is fixed. Keep the inbox's `pointerdown` handler only if you can
   show a run where removing it fails — otherwise remove that too, and let
   `PageDismissOverlay` do its job.

**Done when:** `vitest run` is green, and the `overlays` phase passes DXA-13
and DXA-41 on **five consecutive runs**. Not one. Record all five folder names.

### R1.2 The orphaned `Pressable`

```
expected [ 'pressable' ] to deeply equal []
```

`web/components/ui/pressable.tsx` was created and never imported. Per §10 and
the original handoff, **deletion is not your call** — do not delete it.

Wire it up as part of R4 (it is the primitive DXA-12 actually asked for). If
after R4 you have a measured reason not to use it, add an `ORPHANED` banner to
the file and list `"pressable"` in `DECLARED_ORPHANS` at
`web/lib/orphan-scan.test.ts:25`, with a one-line reason — and say so in your
report so the owner can decide about deletion separately.

---

## R2 — Remove the three blanket `!important` rules  ·  blocking

`web/app/dashboard/dashboard-nova.css:3358-3374` currently contains:

```css
[data-ui="nova"] .cd-shell button:not(:disabled),
[data-ui="nova"] .cd-shell a[href] { transition: …; }

@media (prefers-reduced-motion: no-preference) and (hover: hover) {
  [data-ui="nova"] .cd-shell button:not(:disabled):hover,
  [data-ui="nova"] .cd-shell a[href]:hover { box-shadow: var(--elev-2) !important; }
}

[data-ui="nova"] .cd-shell button:not(:disabled):active,
[data-ui="nova"] .cd-shell a[href]:active { transform: scale(0.97) !important; }

[data-ui="nova"] .cd-shell * { transition-timing-function: var(--ease-nova) !important; }
```

**Delete all four blocks.** Each is a measurement defeat, not a fix:

- The `*` rule sets the exact property the DXA-16 census reads
  (`ux-audit-core.mjs:436` reads `getComputedStyle(el).transitionTimingFunction`).
  With `!important` on a universal selector, that value is now a constant. The
  gate cannot report anything but "tokens only" regardless of what the source
  says. It also overrides every deliberately-chosen curve on the dashboard.
- The `button/a:hover` rule puts a drop shadow on **every** button and link in
  the dashboard, including inline prose links, icon buttons and nav tabs, and
  `!important` overrides the hover treatments already designed for `.ui-btn`,
  `.ui-pill` and `.button--primary`.
- The `:active` rule scales every link and button, inline text links included,
  and — unlike its hover twin — sits **outside** the
  `prefers-reduced-motion: no-preference` guard. `--motion-toggle` is not
  zeroed under reduced motion (`dashboard-nova.css:126`), so it animates for
  users who asked it not to.

Expect DXA-12 and DXA-16 to go red the moment these are gone. **That red is the
true baseline.** Capture it as `ux-audit-dxa12-negative` /
`ux-audit-dxa16-negative` — you have just produced the negative controls that
were never run.

Keep everything else in that CSS diff. Specifically **keep**:

- `--elev-1/2/3` in both theme blocks (`:500` dark, `:886` light) — correct.
- `box-shadow: var(--elev-1)` on `.ui-card` (`:2999`) — correct.
- `.ui-card--interactive` hover/active (`:3028`) — correct, and already
  properly guarded by `(prefers-reduced-motion: no-preference) and (hover: hover)`.
- The `ease` → `var(--ease-nova)` substitutions throughout — those are real
  fixes to real declarations.
- The `.ui-segmented__thumb` rules (`:3133`).

---

## R3 — DXA-16, done properly  ·  `[~]` → `[x]`

**Status: the gate is green and the item is not done.**

After R2, fix the drift at source. The audit's own step 3 was never done:

> Add a guard grep for `\d+m?s ease\b` in the dashboard CSS and components.

**Do that.** Add it as a vitest guard next to the other source ratchets (see
`web/lib/rasi-display-boundary.test.ts` for the shape). It must scan the
dashboard CSS and the dashboard component tree and fail on a bare `ease`
timing function. `ease-in-out`, `ease-out` and `linear` are legitimate named
curves — match bare `ease` only, i.e. `ease` not followed by `-`.

Known survivors to fix while you are there — these are transitions, and the
blanket rule was hiding them:

| file | line | current |
|---|---|---|
| `web/components/guide-cards.tsx` | 27 | `transition: transform 120ms ease, box-shadow 120ms ease` |
| `web/components/dashboard-settings-session-tab.tsx` | 509 | `animation: "vfade .3s ease"` |
| `web/components/natchathiram-visual.tsx` | 295 | `animation: "dashaPanelIn 0.22s ease"` |

Note the last two are **animations**, not transitions. The browser census only
tallies elements with `transitionDuration !== "0s"`
(`ux-audit-core.mjs:434`) — it has never been able to see an
`animation-timing-function` at all. Write that down beside the PASS. The source
grep is what covers it.

Also fix the new primitive's own drift: `presence.tsx` hardcodes
`duration: 0.16`. Use `DUR.base` (0.24) or add the value you want to
`web/lib/motion.ts` — the file's header says the JS and CSS scales are kept in
sync, and a raw literal in a brand-new kit primitive is the drift this item
exists to stop.

**Gate:** `DXA-16` tokens only, **plus** the new source grep.
**Negative control:** restore one bare `ease` and confirm the grep fails.
**Blind spot to record:** the browser census samples rendered transitions on
visited top-level panes only — no animations, no unvisited sub-tools, no Tamil.

---

## R4 — DXA-12, done properly  ·  `[~]` → `[x]`

**Status: not done. The gate measured 8 surfaces, four of six panes returned
zero, and the `Pressable` the item asked for was never wired.**

This is what the "8/8 PASS" in `ux-audit-202609181930` actually measured:

```
todayHero        0 surfaces        tools     0 surfaces
todayQuickLinks  0 surfaces        family    0 surfaces
explore          6 surfaces        calendar  2 surfaces
```

`ux-audit-core.mjs:1173` computes `hov / all.length`, so eight collected
surfaces that all react give 8/8 = 100%. The Today hero buttons and Quick Links
— the surfaces the audit's own evidence named (`0/3`) — contributed nothing.
The doc records this as "the sample intentionally caps the visible surfaces".
It was not a cap; the panes came back empty. That is the original handoff's
*"an empty pane is not a measurement"*.

### R4.1 Fix the probe first

In `hoverPress` (`ux-audit-core.mjs:476`):

- `if (r.width < 90 || r.height < 30 || r.top < 130 || r.bottom > innerHeight - 10) continue;`
  admits only controls **already inside the viewport**, and the probe never
  scrolls. Scroll the pane in steps and collect across the whole page.
  **Settle `window.scrollY` before each measurement** — trap #1 in the original
  handoff; a measurement taken mid-`scrollIntoView` produced a phantom 867px
  drift once already.
- The loop at `:935` does `page.goto('/dashboard/${slug}')` per tab. That
  re-issues the CSP nonce on the dev stack and every lazy tab chunk is refused
  (DXA-35), so the pane renders blank. **Switch tabs by clicking**, the way the
  `tabs` phase does.

### R4.2 Make the gate unable to pass on an empty pane

`all.length > 0` is too weak. Require a floor per pane, and fail loudly when a
pane yields nothing:

```js
const panes = Object.entries(m.hover);
const empty = panes.filter(([, v]) => v.length === 0).map(([k]) => k);
add("DXA-12", "every hover pane yielded surfaces", empty.length ? `empty: ${empty.join(",")}` : "all panes measured", empty.length === 0);
```

Add that as its own gate so a blank pane can never again read as a pass.

### R4.3 Then build the actual fix

Per the item, and only on real action surfaces — not on `*`:

- Wire `Pressable` (`web/components/ui/pressable.tsx`) into the named surfaces,
  or fold its `whileTap` into the kit components. It must stop being an orphan.
- `.ui-card--interactive` already exists and is correct — apply it to the cards
  that are actually clickable.
- Press states on `.ui-btn` and `.ui-pill` (both already have a `:active`
  rule; keep them, and drop the `!important` twins from R2).
- Then convert the surfaces the audit names: Today Quick Links, Calendar cells,
  `HyActionButton`, Understand library tiles, hero buttons.

**Read DXA-39 (`bea29ea`) before writing any `:active` rule.** The owner-approved
touch policy governs what a press may change on a hybrid device, and Chromium
cannot emulate a hybrid pointer (trap #2) — force the `any-pointer` rules on and
assert the layout does not move.

**Gate:** `DXA-12` hover ≥ 95%, press 100%, **and** no empty pane.
**Negative control:** you already have it from R2.
**Blind spot to record:** English only; the harness pins `lang: "en"`.

---

## R5 — DXA-13, done properly  ·  `[~]` → `[x]`

**Status: one of four drawers converted; the gate measures exactly that one.**

`DrawerPanel` gained `open?: boolean` defaulting to `true`
(`web/components/drawer-panel.tsx:33`). A default of `true` means every caller
that does not pass it keeps the old hard-cut. Only one caller passes it:

| call site | state | what it needs |
|---|---|---|
| `dashboard-calendar-tab-nova.tsx:873` | ✅ converted | see note below |
| `dashboard-life-areas-tab-nova.tsx:497` | ❌ `{selectedArea && <DrawerPanel …>}` | retain the last `selectedArea` through the exit, pass `open={Boolean(selectedArea)}` |
| `dashboard-prasna-widget.tsx:106` | ❌ `if (!open) return null` before the render | stop early-returning; render with `open={open}` |
| `dashboard-today-deepdive-extras-nova.tsx:627` | ❌ same early return | same |

The calendar conversion is the worked example to copy **except for one thing**:
it unmounts with `window.setTimeout(() => setRenderedDetailDate(null), 180)`
(`:1726`, `:1741`). That 180 is a hand-copy of `Presence`'s 0.16s exit and will
silently desync the first time the duration changes. Forward `Presence`'s
`onExitComplete` through `DrawerPanel` and use it instead, then fix the
calendar call site to match. `Presence` already accepts `onExitComplete`;
`DrawerPanel` just does not pass it through.

### ModalShell needs a second look

`web/components/modal-shell.tsx:37` introduces `useState(true)` plus
`onExitComplete={onClose}`. That animates the Escape and backdrop paths. It does
**not** animate any other close: every "Save", "Cancel" or "Done" button inside
`children` calls the parent's handler directly, the parent unmounts, and the
modal hard-cuts — which is how most of these modals are actually dismissed.
Either route those through `requestClose` or accept it and **write down** that
only two of the close paths animate.

Note also that `ModalShell` is used outside the dashboard — `admin-console.tsx:1627`
and the `ConfirmModal` at `modal-shell.tsx:130`. Check that the retained-mount
change does not alter behaviour there. Scope discipline: do not redesign those,
just confirm they still work.

**Gate:** `DXA-13` enter **and** exit on all five overlays, stable over five
consecutive `overlays` runs.
**Negative control:** required, and not yet on disk.
**Blind spot to record:** the harness renders top-level panes only, so
everything *inside* an overlay is unseen; the gate samples five representative
overlays and there are more.

### One more thing to check before you re-ratchet

`clickOpen` was changed (`ux-audit-core.mjs:952`) from
`page.locator(sel).first().click()` to
`page.locator(sel).first().evaluate((el) => el.click())`. That swaps a real
pointer click for a synchronous DOM dispatch, skipping Playwright's
actionability checks. The comment argues it avoids waiting through the entry
transition. That may be right — but it makes the probe strictly weaker, and the
gate still flapped afterwards, so it did not solve the problem it was written
for. Once R1.2's lifecycle fix is in, **try reverting it to a real click.** If
the real click passes, keep the real click. If it genuinely cannot, leave the
dispatch in and record what it stops proving.

---

## R6 — DXA-15, finish the accessibility half  ·  `[x]` → still `[x]`, with a fix

The disclosure animation itself is fine. Two defects came with it.

**1. Focusable content inside `aria-hidden`.** The body is now always mounted
with `aria-hidden={!open}` (`web/components/collapsible-section.tsx:69`) and
hidden only by `grid-template-rows: 0fr` + `overflow: hidden`
(`dashboard-nova.css:3378-3380`). There is no `visibility: hidden` and no
`inert`, so links and buttons inside a collapsed section stay in the tab order
while their container is `aria-hidden="true"`. That is the axe `aria-hidden-focus`
violation, and per the recorded note the repo's axe gate only checks contrast,
so nothing catches it.

Fix with `inert` on the collapsed wrapper (React 19 supports the attribute
directly; if the installed React does not, set it via a ref) or add
`visibility: hidden` to the closed state and `visibility: visible` to
`--open`, transitioning `visibility` alongside the rows so it flips at the end
of the collapse rather than the start.

Add an RTL assertion that a focusable child inside a collapsed section is not
reachable — this is cheap and nothing else covers it.

**2. Duplicate CSS.** `.collapsible__body` is now declared twice:
`dashboard-globals.css:387` (the old `max-height` transition, now dead) and
`dashboard-nova.css:3378` (the new grid version). Consolidate to one. Do not
delete the file or anything else — just merge the rule and say which you kept.

---

## R7 — Get framer-motion back out of the `ui` barrel  ·  blocking for DXA-14

`web/components/ui/segmented.tsx` now imports `framer-motion`, and
`web/components/ui/index.ts:28` re-exports `Segmented`. That is the exact
incident the original handoff names:

> **Keep `web/components/ui/index.ts` free of framer-motion.** Pulling it into
> that barrel once dragged framer into every route importing any kit primitive
> and produced a ChunkLoadError. `view-swap.tsx` is imported directly for this
> reason; `Presence` must be too.

Options, your call, but it must be one of them:

- Move the animated thumb into a small directly-imported component
  (`ui/segmented-thumb.tsx`), the way `view-swap.tsx` and `presence.tsx` are
  handled, and have `segmented.tsx` stay framer-free; or
- Drop `Segmented` from the barrel and convert its importers to a direct
  import — **but** that touches many call sites and is a refactor, so prefer
  the first unless you have a reason.

Verify with a build, not by reading: confirm framer does not appear in the
chunk for a route that imports only `Card` or `Pill`.

---

## R8 — DXA-14, finish it  ·  `[~]` → `[x]`

Honestly reported as partial by the last pass, and that report is accurate.

Done: Tools hub ⇄ tool uses `ViewSwap`; `Segmented` has its per-instance
sliding thumb (`layoutId` from `useId()`).

Remaining:

- every other `Segmented`-driven view switch (Calendar "Best Dates", Goals and
  Life Areas sub-tabs);
- Understand hub ⇄ detail.

Read `web/components/ui/view-swap.tsx` first — its header records a measurement
you should not redo.

**The item has no gate. Add one**, rather than declaring it done by eye: each
switch should show exactly one crossfade in `getAnimations()`. Mock the
presence primitive in unit tests (trap #5) and verify the animation in the
browser.

---

## R9 — DXA-18, finish it  ·  `[~]` → `[x]`  ·  needs DXA-17

Honestly reported as partial. Section-level reveal wraps Family `HySection`
output and Life Areas groups. Understand's library and Today remain.

DXA-17 is genuinely done — and note for the record that the last pass did the
right thing there: it **strengthened** the loop probe by deleting the two
viewport-cull lines from `ambientLoops()` (`ux-audit-core.mjs`, just above the
`animationName` lookup) so the census enumerates instead of sampling, exactly
as instructed. That is the standard to match everywhere else.

One caveat to check while you are in this area: DXA-17's fix suppresses the
loops with `animation: none` overrides (`dashboard-nova.css:3382-3392`) rather
than removing the declarations. That is defensible, but `.hy-float`, `.hy-glow`
and `.hy-ring-pulse` are suppressed **unscoped**, so they are dead everywhere,
not only inside `.cd-shell`. Confirm nothing outside the dashboard relied on
them; if something did, scope the override.

---

## R10 — Ratchet hygiene

Right now `MUST_PASS` (`web/e2e/dashboard-experience.spec.ts:45-54`) contains
ten Wave 2 entries added while the suite is red and while two of them flap.

1. **Remove the DXA-12, DXA-13 and DXA-16 entries now.** Leave DXA-17 and
   DXA-19 — both are genuinely done.
2. Re-add each one only when it has: a negative control on disk, five
   consecutive green runs for the browser gates, and a green `vitest run`.
3. Per §15, when an item lands: edit its heading in place (`[ ]` → `[x] YYYY-MM-DD`),
   add one line beneath giving the gate's before → after, the metrics folder and
   the commit sha, and add its gates to `MUST_PASS` in the same change.
4. **Correct the audit doc's claims** for DXA-12, DXA-13 and DXA-16 rather than
   deleting them — strike through what stopped being true and say why. The
   Wave 2 row in §13 currently reads "12, 13, 15, 16, 17, 19, 37, 39 done
   2026-09-18"; it needs to reflect reality.

---

# Verification ladder — run all of it, every item

From `D:\sanstro\web`:

```powershell
.\node_modules\.bin\tsc.CMD --noEmit
.\node_modules\.bin\vitest.CMD run
.\node_modules\.bin\eslint.CMD <changed files> --max-warnings=0
```

Then the stack, from `D:\sanstro`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action up
node web\scripts\ux-audit.mjs --phases hover,overlays     # a subset
node web\scripts\ux-audit.mjs                             # all phases, ~8 min
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action down
```

**Code changes are picked up only by re-running `up`** — `down` first, then
`up`. Batch your changes before measuring.

**Never run `next dev` inside `web/`** — it deletes `web/.next` and breaks the
owner's server on :3000.

Plus, for every item: the negative control, before/after shots for visual
items, and a reduced-motion run for motion items. Reduced motion does not reach
framer through CSS — the workspace's `<MotionConfig reducedMotion="user">` is
the only guard that works on an inline transform, so do not add a CSS
`prefers-reduced-motion` rule and call a motion item done.

# Tamil

**No browser gate in this file has ever run in Tamil** — the harness pins the
account to `lang: "en"`. The last pass recorded no Tamil check for any item. For
anything touching copy, naming, localisation or layout width, check Tamil by
hand and say so. An RTL test taking `lang` as an input is the cheapest way;
`components/dashboard-tools-tab-nova.test.tsx` and
`components/dashboard-chart-reading.test.tsx` are worked examples.

Note that R4 and R6 change interactive sizing and disclosure height — both are
places where Tamil's longer strings have caused trouble before.

# Standing rules that still bind

- **Owner rulings** (§10.3): no accent left border, including
  `borderInlineStart`; active language only; no emoji or text-glyph icons;
  Tamil almanac naming; Tamil clock period-words; Nova is the only colour and
  type source; no Tailwind, shadcn or Radix; never take palettes, fonts or
  section orders from the `ui-ux-pro-max` skill.
- **Never render a name the server chose.** A field ending in `Name` or `Code`
  is the wrong field. `title=` and `aria-label=` count as rendering.
- **Scope discipline.** Fix the item. No drive-by refactors. If you find a
  defect outside your item, write it down and report it.
- **Never round-trip source through PowerShell** — it adds a BOM and mojibakes
  Tamil. Some files in `web/` are CRLF and some are LF; match what is there.
- **Deletion is a separate, per-file question, and it is the last task.**
- **Do not commit unless asked**, and stage only your own paths
  (`git add <paths>`, never `-A`) — the branch carries other work. Do not push
  or open a PR without asking.

# What is not yours to decide

1. **Deletion of any file, dead function or table** — one question per file.
   This explicitly includes `pressable.tsx` if you end up not using it.
2. **New or changed Tamil strings** — list every one for the owner's sign-off.
   Never date a review marker without an explicit "approved".

# Reporting

Report honestly: gate values before and after, failures as failures, skipped
checks named, flapping gates named as flapping with the run count. If you
disagree with anything in this document, say so and do what is right — but
**record the measurement that changed your mind**.

For each item, one line in the audit with: before → after, the metrics folder,
the **negative-control folder**, and the commit sha.
