# Agent handoff — Dashboard Experience Audit, Wave 2 (2026-09-18)

**Paste everything below the line into the agent.** It is written to be picked
up cold, with no memory of the sessions that produced Waves 0 and 1.

Owner: keep this file updated as the wave progresses, or delete it when Wave 2
closes — a stale handoff is worse than none, which is the lesson half this
document is about.

---

You are taking over the remaining Wave 2 items of the Dashboard Experience
Audit in the Vinaadi AI repo. You have **full ownership**: make the design and
engineering calls yourself, and only come back to the owner for the two things
listed under "What is genuinely not yours to decide".

## Orientation — read these, in this order, before touching anything

1. `AGENTS.md` — the non-negotiables summary.
2. `CLAUDE.md` — **authoritative**. Repo root, shell, DB safety, encoding, the
   four-surface API contract. Two sections earn particular attention because
   both exist as a result of defects that shipped green: **"Display boundary —
   never render a name the server chose"** and **"A gate proves its own check,
   not the item"**.
3. `docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md` — the work order. Read §4's
   item conventions, §10 (rules of engagement), §11 (environment), §12
   (verification ladder and baseline), §13 (waves), §14 (traps) and §15 (status
   protocol) in full. Every item below is written to be finished alone.

Repo root is `D:\sanstro`. Start every command there. **PowerShell**, chain with
`;` not `&&`, no `head` (use `Select-Object -First N`).

## Where the work stands

Wave 0 and Wave 1 are complete. Wave 2 has two items done, taken out of order:

| item | commit | note |
|---|---|---|
| DXA-39 touch policy | `bea29ea` | owner-approved on their own touchscreen laptop |
| DXA-37 reading length switch | `4c41ef9` | owner-approved, Tamil signed off |

Latest full harness: **26 PASS / 18 FAIL** (`web/e2e/.artifacts/ux-audit-202609180924/`),
against a 5-PASS baseline on 2026-09-17. Everything in `MUST_PASS` in
`web/e2e/dashboard-experience.spec.ts` is green and must stay green.

## Your scope, in this order

### 1. DXA-19 — no elevation system  ·  `Needs: —`  ·  Review: shots
Start here, and not for tidiness: **DXA-12 and DXA-13 both depend on its
tokens.** 87 cards resolve no shadow at all; `--nova-card-shadow` reaches only
legacy `.surface`, `--nova-hover-shadow` only the callerless
`.nova-interactive`, and popovers wear a Classic warm-brown shadow that is
invisible on navy. Build `--elev-1/2/3` in both theme blocks and map `Card`,
`.ui-card--interactive:hover`, `.cd-dropdown` and `.cd-alerts-popover` onto
them. Gate: `DXA-19` zero flat cards.

### 2. DXA-12 — no hover or press feedback  ·  `Needs: 19, 39`  ·  Review: shots
`0 of 15` measured surfaces react to a press. A kit `Pressable`, an
interactive card variant, press states on `.ui-btn`/`.ui-pill`, then convert
the named surfaces. **DXA-39 is done, so its half of the dependency is
satisfied** — read that item before writing any `:active` rule, because the
touch policy governs what a press is allowed to change on a hybrid device.
Gate: hover ≥ 95%, press 100%.

### 3. DXA-13 — overlays hard-cut in, nothing animates out  ·  `Needs: 19`
A `Presence` primitive, then `ModalShell`, the three popovers, `DrawerPanel`
(which needs an `open` prop — today its parent unmounts it) and the Ask panel.
Gate: enter **and** exit on all five.

### 4. DXA-14 — view switches hard-cut  ·  `Needs: —`
**Half-built already.** `ViewSwap` exists at `web/components/ui/view-swap.tsx`
(crossfade, 180 ms in / 120 ms out) and is in use by DXA-37. What remains is
its *application*: the Tools hub ⇄ tool swap, every other `Segmented`-driven
view, the Understand hub ⇄ detail — plus the `Segmented` sliding thumb
(`motion.span`, per-instance `layoutId` from `useId()`). Read `view-swap.tsx`
first; its header records a measurement you should not redo.

The item has **no gate**. Add one when you implement, rather than declaring it
done by eye.

### 5. DXA-15 — disclosures pop open and shut  ·  `Needs: —`  ·  Review: —
`CollapsibleSection` renders `{open && …}`. Keep the body mounted after first
open and animate `grid-template-rows: 0fr → 1fr` with opacity. **Keep the
scroll-anchor pin** — that one is load-bearing and measured, unlike the one
DXA-37 removed. `e2e/dashboard-render-pass.spec.ts` reads `aria-expanded`.

### 6. DXA-16 — motion token drift  ·  `Needs: —`  ·  Review: —
The census still reports a bare `ease`. Small, and a good palate cleanser
between the bigger items.

### 7. DXA-17 — ambient loops outside the hero (D3)  ·  Review: shots
Six surfaces: the page stars, `hy-float` × 10, `hy-glow` × 2, `hy-ring-pulse`
(which animates `box-shadow` every frame), the Calendar pulse dot and today-cell
travel, and `DeepDiveOrbitGlyph`'s spin. **Its gate currently names only one or
two loops per run because the probe samples** — make it enumerate before you
trust a PASS. DXA-18 waits on this.

### 8. DXA-18 — long pages have no reading choreography  ·  `Needs: 17`
Last, because it needs 17.

**DXA-06 is in this wave but cannot be accepted here.** Implement it if you
reach it, but its acceptance needs a production build (see DXA-35) and its gate
is INFO until then. Do not record a PASS from a `next dev` run.

## Standards that are easy to skip, and have cost this repo real time

**A gate is a measurement, not the definition of done.** Before you write any
PASS: run that gate once with your fix *removed* and confirm it **fails**, then
write down what the check cannot see and look there by hand. Five items in this
file have now been recorded green by a check that could not fail. The most
recent: DXA-10's gate counted zero stars and passed on an unfixed tree, because
the page sky only draws stars after dusk and the run happened at 11:50 — the
layer under audit was not on screen at all.

Two blind spots belong to the harness itself and therefore apply to every item:

- `web/scripts/ux-audit-core.mjs` switches **top-level tab panes only**.
  Overlays, sub-tools, generated reports and anything needing a second click are
  never rendered. **DXA-13 is entirely about overlays** — its gate has a
  dedicated `overlays` phase, but everything *inside* those overlays is unseen.
- It pins the account to `lang: "en"`. **No browser gate in this file has ever
  run in Tamil.** For any copy, naming or localisation work, check Tamil by hand
  and say so. An RTL test that takes `lang` as an input is usually the cheapest
  way (`components/dashboard-tools-tab-nova.test.tsx` and
  `components/dashboard-chart-reading.test.tsx` are both worked examples).

**Never render a name the server chose.** The backend sends a language-free key
*and* a pre-rendered English name for most astrology terms (`rasi` vs
`rasiName`/`rasiCode`; `lord`/`graha` vs the bare string). Render the key through
its localiser — `rasiDisplayName`, `tPlanetLord`, `tNakshatra`, `tTithi`,
`saniCycleName`. A field ending in `Name` or `Code` is the wrong field.
`title=` and `aria-label=` count as rendering, and no browser text probe can see
them. `web/lib/rasi-display-boundary.test.ts` ratchets the rasi case; the others
are on you.

**Owner rulings are binding** (§10.3): no accent left border, *including*
`borderInlineStart`; active language only; no emoji or text-glyph icons; Tamil
almanac naming; Tamil clock period-words; Nova is the only colour and type
source; no Tailwind, shadcn or Radix; never take palettes, fonts or section
orders from the `ui-ux-pro-max` skill.

**Scope discipline.** Fix the item. No drive-by refactors, no cleanup of
surrounding code, no new abstractions for hypothetical needs. If you find a
defect outside your item, write it down and report it — do not fold it into the
commit. One item per commit where the files allow it.

**Deletion is a separate, per-file question, and it is the last task.** Do not
delete a file, a dead function or a table without explicit approval. If
`web/lib/orphan-scan.test.ts` starts failing because your change orphaned
something, that is the signal to either wire it up or declare it — not to
delete it.

## Environment — two rules that break the owner's machine if ignored

- **Never run `next dev` inside `web/`.** It deletes `web/.next` and breaks the
  owner's own server on :3000.
- The isolated stack is the only safe way to render signed-in pages:

  ```powershell
  Set-Location 'D:\sanstro'
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action up
  node web\scripts\ux-audit.mjs                        # all phases, ~8 min
  node web\scripts\ux-audit.mjs --phases hover,overlays # a subset
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action down
  ```

  Phases: `load, tabs, today, hover, overlays, reduced, light, phone, sky`.
  **Code changes are picked up only by re-running `up`** — `down` first, then
  `up`. That cycle takes several minutes, so batch your changes before
  measuring.

Verification ladder, from `D:\sanstro\web`, for every item:
`.\node_modules\.bin\tsc.CMD --noEmit` → `.\node_modules\.bin\vitest.CMD run` →
`.\node_modules\.bin\eslint.CMD <changed files> --max-warnings=0` → the stack and
the item's gate → before/after shots for visual items, and a reduced-motion run
for motion items.

## Traps that will cost you an hour each

- **Settle the scroll before measuring anything on this dashboard.** It scrolls
  smoothly. A baseline taken while a `scrollIntoView` is still in flight reported
  an "867px layout drift" that did not exist. Poll `window.scrollY` until it
  stops moving.
- **Chromium cannot emulate a hybrid pointer.** CDP `Emulation.setEmulatedMedia`
  silently ignores `pointer`/`hover` — it reports the *same* media state for
  every profile you ask for — and `hasTouch: true` produces `pointer: coarse` +
  `hover: none`, i.e. a phone. To test a touch-capable laptop, force the
  `any-pointer` rules on and assert the layout does not move. This matters for
  DXA-12's press states.
- **An empty pane is not a measurement.** A per-tab `page.goto` on the dev stack
  re-issues the CSP nonce and every lazy tab chunk is refused (DXA-35), so the
  pane renders blank. Switch tabs by **clicking**. A gate that reads a failed
  render as a finding is worse than no gate.
- **`backgroundColor` does not tell you what an element paints.** A card whose
  background is a gradient of two solid colours computes `rgba(0,0,0,0)`. Read
  the gradient's stops. Relevant to any DXA-19 shadow/elevation probe.
- **Framer's `AnimatePresence` keeps an exiting view mounted.** In jsdom that
  exit never completes, so an RTL test will see two of everything. Mock the
  presence primitive in unit tests and verify the animation in the browser. This
  will bite you on DXA-13 and DXA-14 specifically.
- **Keep `web/components/ui/index.ts` free of framer-motion.** Pulling it into
  that barrel once dragged framer into every route importing any kit primitive
  and produced a ChunkLoadError. `view-swap.tsx` is imported directly for this
  reason; `Presence` must be too.
- **Reduced motion does not reach framer through CSS.** The workspace wraps its
  render in `<MotionConfig reducedMotion="user">` (DXA-11) — that is the only
  guard that works on an inline transform framer writes. Do not add a CSS
  `prefers-reduced-motion` rule and call a motion item done.
- **Never round-trip source through PowerShell** (`Out-File`, `ReadAllText` →
  `WriteAllText`, or any escape-decoding trick). It adds a BOM and mojibakes
  Tamil. Use the editor tooling. Some files in `web/` are CRLF and some are LF —
  match what is there. `web/lib/text-encoding-guard.test.ts` will catch you, but
  after the damage.
- **A local test failure is not authoritative.** A second pytest run drops the
  test schema mid-run. Check for competing runs; CI decides.
- **`<Card>` is already a column flexbox.** A horizontal card needs
  `flexDirection: "row"` explicitly.

## What is genuinely not yours to decide

1. **Deletion of any file, dead function or table** — one question per file, and
   it is the last task, not the first.
2. **New or changed Tamil strings** — list every one in your handoff for the
   owner's sign-off. Never date a review marker without an explicit "approved".

Everything else — the design calls, the token values, the primitive APIs, the
order within your scope — is yours. If you disagree with an item's stated fix,
say so and do what is right, but **record the measurement that changed your
mind**. DXA-37 asked for a scroll anchor; it was built, measured at 0px drift in
both directions, and removed, with the measurement written into the code so the
next reader does not re-derive it. That is the standard.

## Reporting

Per §15, when an item is done: edit its heading in place (`[ ]` → `[x] YYYY-MM-DD`,
or `[~]` with the blocking reason), add one line beneath it giving the gate's
before → after, the metrics folder and the commit sha, and add its passing gates
to `MUST_PASS` in `web/e2e/dashboard-experience.spec.ts` in the same change.
Do not delete findings; strike through what stopped being true and say why.

Report honestly: gate values before and after, failures as failures, skipped
checks named. **Do not commit unless asked**, and stage only your own paths
(`git add <paths>`, never `-A`) — the branch `harden/production-readiness`
carries other work. Do not push or open a PR without asking.
