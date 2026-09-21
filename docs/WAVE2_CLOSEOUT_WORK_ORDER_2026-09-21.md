# Wave 2 close-out — agent work order (2026-09-21)

**Audience:** a coding agent (any) that has not seen this work before, plus the
owner for the three decisions in §3.

**Status of the work this closes:** `docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md`
(the audit and register), `docs/WAVE2_REMEDIATION_2026-09-18.md`,
`docs/WAVE2_REVIEW_2_2026-09-18.md` and `docs/DXA_AUDIT_REVIEW_2026-09-19.md`
(two independent reviews). This file is the **execution order** derived from the
last review. It does not replace the audit: the audit stays the register, §15 of
it stays the status protocol, and every `Done:` line still goes there.

**What this file is.** Ten tasks (W-1 … W-10) and three owner decisions
(OD-1 … OD-3), each with its own scope, acceptance test, negative control and
stop condition. Executable without reading the four documents above, though
§9 names exactly where each fact came from if you want to re-derive one.

**What this file is not.** It is not permission to commit anything beyond the
paths a task names, not permission to invent an icon set (OD-1), and not a
licence to widen a task because an adjacent defect is visible from it. Audit §10
rule 2 stands: one item per change, no drive-by cleanups.

---

## 0. Before your first command

```powershell
Set-Location 'D:\sanstro'
```

1. **Read `CLAUDE.md`.** PowerShell only (`;` not `&&`, no `head`, no `2>&1` on
   native exes). Never `Out-File` a source file. Never point pytest at
   `vinaadi_dev`. This work is frontend-only, so the DB rules should not come up
   — if a task seems to need the dev DB, stop and re-read the task.
2. **Read audit §10 (rules of engagement) and §11 (safe rendering).** The two
   that will bite you fastest: `next dev` inside `web/` deletes the owner's
   running `:3000` build, and you must not commit without being asked — and when
   asked, stage your own paths, never `-A`.
3. **Check for a competing session** before believing any local test failure:

   ```powershell
   Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
     Where-Object { $_.CommandLine -match 'vitest|playwright|next' } |
     Select-Object ProcessId, CommandLine
   ```

   Trace the parent chain before killing anything. `Code.exe → claude.exe → …`
   means another agent owns that run. Ask first.
4. **Confirm the ground truth in §1 still holds.** It was measured on
   2026-09-21 against an uncommitted tree. If W-1 has already run, the git facts
   in §1 are stale by design — the re-verify command is in the row.

---

## 1. Ground truth, measured 2026-09-21

Re-verify any row you are about to act on. A recorded conclusion outlives its
check; that is the single most expensive habit in this repo's history.

| # | Fact | Re-verify with |
|---|---|---|
| G1 | 52 modified + 7 untracked files on `harden/production-readiness`; nothing of Wave 2 is committed | `git status --porcelain` |
| G2 | 4 of the untracked files are source: `web/components/ui/presence.tsx`, `pressable.tsx`, `segmented-thumb.tsx`, `web/lib/dashboard-motion-source.test.ts` | `git status --porcelain \| Select-String '^\?\? web/'` |
| G3 | Last `load`/`today`/`light`/`phone` run: `ux-audit-202609180924`, **2026-09-18T09:24Z**. Last `sky`/`reduced`: `ux-audit-202609181141`, **11:41Z**. The Wave 2 CSS rewrite landed ~**18:00Z** that day (`verify-tabs-postfix` at 18:01Z is the first run after it) | the one-liner in §9 |
| G4 | 38 keys in `MUST_PASS`; **17** of them belong to the six stale phases (load 8, today 3, light 1, phone 1, sky 2, reduced 2) | `web/e2e/dashboard-experience.spec.ts:27-74` |
| G5 | DXA-12: **18/71 hover, 17/71 press**. The 53 with neither are enumerated in §4 W-6 | `web/e2e/.artifacts/rv-hover-final/metrics.json` |
| G6 | `Pressable` is 20 lines: `whileTap` only, no hover, `motion.button` only, and the `.ui-pressable` class it is specified to carry **does not exist** in any stylesheet | `Get-Content web\components\ui\pressable.tsx`; `Select-String -Path web\app\**\*.css,web\components\**\*.css -Pattern 'ui-pressable'` → 0 |
| G7 | `.ui-card--interactive`'s hover rule is inside `@media (prefers-reduced-motion: no-preference) and (hover: hover)` — `dashboard-nova.css:3030-3036`. Its `:active` (`:3037`) is outside, correctly | `Select-String -Path web\app\dashboard\dashboard-nova.css -Pattern 'ui-card--interactive'` |
| G8 | `--dur-press`, `--dur-exit`, `--ease-exit` — mandated by audit §6 lines 1344-1346 — **exist nowhere**. `DUR` is `{fast .12, base .24, slow .36, reveal .9}`; the only curve is `--ease-nova` / `EASE_NOVA` | `Select-String -Path web\app\dashboard\dashboard-nova.css,web\lib\motion.ts -Pattern 'dur-press\|dur-exit\|ease-exit'` → 0 |
| G9 | `Presence` runs `DUR.base` (240 ms) in **both** directions for popovers, modals and drawers alike; §6 specifies 160/120, 240/160, 240/180. Measured `lingeredMs` 244-248 on all five overlays | `web/components/ui/presence.tsx`; `ux-audit-wave2-after/metrics.json` |
| G10 | `.nova-today-pane[data-stale] { opacity: 0.6 }` at `dashboard-nova.css:4776-4778`. DXA-07 records at audit lines 384-387 that on light theme this "drops body text under AA for the ~1 s it is on" | `Select-String -Path web\app\dashboard\dashboard-nova.css -Pattern 'data-stale'` |
| G11 | The motion guard scans `app/globals.css`, `app/dashboard/*.css`, `components/*.css` and `components/dashboard-*.tsx` — but `dashboardComponents()` filters `/^dashboard-.*\.tsx$/`, so **the four new primitives in `components/ui/` are outside their own guard** | `web/lib/dashboard-motion-source.test.ts:19-25` |
| G12 | `scripts/` is in eslint's `ignorePatterns`, so `scripts/ux-audit-core.mjs` — the file every gate verdict passes through — is unlinted | `Get-Content web\.eslintrc.json` |
| G13 | The harness pins `lang: "en"` with one settings PATCH (`ux-audit-core.mjs:103`). No Tamil run of any phase exists | `Select-String -Path web\scripts\ux-audit-core.mjs -Pattern 'settings/ui'` |
| G14 | `DXA-05 pending hero within 8px of loaded` is in `MUST_PASS` (`:36`) but has **no row** in the §12 gate table | `Select-String -Path docs\DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md -Pattern 'pending hero'` |
| G15 | `gateKey = "${id} ${check}"` (`ux-audit-core.mjs:43`). Every `MUST_PASS` key must match that string exactly | — |
| G16 | `lucide-react@^1.21.0` and `framer-motion@^12.40.0` are already dependencies. No Tailwind, no shadcn, no Radix, and none may be added | `web/package.json:27-28` |

---

## 2. Order of work, and why this order

```
W-1  commit Wave 2 ─────────────────┐  nothing else is safe until the tree is saved
W-2  full 9-phase run ──────────────┤  every later gate claim compares against this
                                    │
W-3  stale-dim AA        (OD-3) ────┤  one number; a known AA failure sitting behind [x]
W-4  §6 vs DXA-16        (OD-2) ────┤  a contradiction that will trap the next agent
W-5  reduced-motion hover ──────────┤  small, no decision needed, unblocks W-6's spec
                                    │
W-6  DXA-12 properly ───────────────┤  the item that sets the interaction grade
W-7  guard scope ───────────────────┤  three ratchets that cannot see what they claim
W-8  Tamil phase ───────────────────┤  the harness's largest blind spot
W-9  production build check ────────┤  DXA-35 / DXA-06, and §3.1's unrun follow-up
W-10 document hygiene ──────────────┘  cheap, and a reader scans the tables first

OD-1 glyph set commission — owner only, blocks DXA-09 emoji + DXA-24 + DXA-33.
     Prepare the brief early (W-6 is a good moment); do not wait on it to start.
```

**W-1 and W-2 are hard prerequisites.** W-1 because four untracked source files
are one `git clean -fd` from gone. W-2 because until it runs, 17 ratcheted gates
are measurements of a build that no longer exists, and any "no other gate
regressed" claim you make is unfounded.

W-3 … W-10 are independently landable after W-2. If you can only do part of
this order, do it in this sequence and say in your handoff exactly where you
stopped and why — scaling the work down is the owner's call, not yours.

---

## 3. Owner decisions — do not guess these

Each carries a **recommended default**. Where a default is marked
*proceed-under-assumption*, implement it now, record the assumption in the
audit, and flag it in your handoff; the owner can reverse it in one line. Where
it is marked *blocking*, stop and ask.

### OD-1 · The astrology glyph set · **blocking**

A drawn set for **9 grahas, 12 rasis and the panchangam limbs**, 1.75 px stroke
to match Lucide (audit DXA-24, lines 1129-1135). **An agent must not invent
it.** It gates three things at once:

- `DXA-09 no emoji / text glyphs as icons` — the only gate still failing in the
  `tabs` phase. Live list from the current run:
  `calendar: 📅 🗓 📍 ♉ ☀ · family: 🪔 ☀ 👋 ✳ ♂ ♀ · journal: 🕊 · personal: ★ ⤓ · calendar: ▾ ☀ · family: ↻ ◇ ✎`
- **DXA-24** itself.
- **DXA-33** (chart artwork, deity art, calendar art — currently 1-3.6 KB
  placeholders and a README in `web/public/deities/`).

**What an agent may do without the decision:** the *agent part* of DXA-24 —
Lucide for all UI affordances, and one shared 36 px icon "well" component used
by Quick Links, Tools and Understand. Replace with Lucide **only** where a true
equivalent exists, plus `MiniMoonGlyph` for moon phases. Deity and festival
marks wait.

**What to hand the owner:** a one-page commission brief listing every glyph
needed, grouped (9 grahas / 12 rasis / panchangam limbs / festival + deity
marks), each with the emoji or text glyph it replaces and the surface it appears
on. That brief is a legitimate agent deliverable and is the highest-leverage
thing on the owner's desk — one decision, three items, and most of what makes
the product read as unfinished.

### OD-2 · §6's exit tokens, or one curve as house style · **blocking**

§6 mandates `--dur-press: 90ms`, `--dur-exit: 140ms`,
`--ease-exit: cubic-bezier(0.4, 0, 1, 1)` and the principle "exit faster on
`--ease-exit`". None exists (G8). Meanwhile DXA-16's gate is worded
**"transitions use the Nova easing tokens only"** and passes *because*
`--ease-nova` is the only curve on the page. **Introduce `--ease-exit` as §6
demands and the gate goes red for doing the right thing.**

Two coherent answers; both are defensible; leaving both standing is the only
wrong one.

| | A — ship the tokens | B — retire §6's exit language |
|---|---|---|
| CSS | add all three beside `--dur-*` (`dashboard-nova.css:2429-2433`) | no change |
| `lib/motion.ts` | add JS twins: `DUR.press = 0.09`, `DUR.exit = 0.14`, `EASE_EXIT` | no change |
| `Presence` | take `enter`/`exit` durations per overlay kind: popover 160/120, modal 240/160, drawer 240/180 | keep `DUR.base` both ways |
| DXA-16 gate | **must be re-worded to an allowlist** (`--ease-nova` ∪ `--ease-exit`), or it fails the fix | unchanged |
| Cost | ~1 day incl. a negative control per overlay kind | one paragraph, struck through per §15 |
| Gain | overlays read faster on the way out, which is what §6's principle is for | one curve is a real house style, and simpler to hold |

**Recommended:** **B**, *proceed-under-assumption*, because one settle curve is
already what every surface uses and shipping A means re-ratcheting DXA-16 in the
same change as a motion rewrite. If B: strike §6 lines 1339 and 1344-1346 per
§15 (strike, do not delete, and say why), and record the ruling as a lineage
choice — "we chose one curve", never "the other was wrong".

### OD-3 · The stale-day dim number · *proceed-under-assumption*

`opacity: 0.6` on the held day (G10). DXA-07 records that this drops light-theme
body text under AA for ~1 s and offers 0.75, then closes the item `[x]` pending
"say the word".

**Recommended:** implement **the chrome-dim variant** — dim the pane's chrome
and hold body text at full opacity — which carries the same "this is not yet the
day you asked for" message without touching legibility at all. If that reads
badly against the hairline, fall back to **0.75**. Either way it is one CSS
change plus a gate (W-3), and a known AA failure must not sit behind a `[x]` for
another day waiting on a conversation.

---

## 4. The tasks

Every task below follows the same contract. **Acceptance** is what must be true.
**Negative control** is mandatory and non-negotiable where stated: run the gate
once with your fix removed and confirm it *fails*, then restore. A gate that has
never failed has not been shown to measure anything — three items in this audit
were recorded green by gates that could not fail. **Done line** is the exact
text to add in the audit per §15.

---

### W-1 · P0 · Commit Wave 2 and backfill the commit fields

**Why.** 52 modified + 7 untracked files, and four of the untracked ones are
source (G2). Three are the primitives the whole wave is built on; the fourth
*is* DXA-16's guard. One `git clean -fd` and Wave 2 is gone. Separately, audit
§15 requires every `Done:` line to carry `commit <sha or "uncommitted">`, and
DXA-13, DXA-14, DXA-15 and DXA-16 carry **no commit field at all** — so a reader
of §12 cannot tell that four `[x]` items are unshipped.

**Scope.** Only paths Wave 2 touched. This branch carries unrelated uncommitted
work: **stage your own paths, never `-A`** (audit §10 rule 10).

**Do.**
1. `git status --porcelain` and separate Wave 2's paths from everything else.
   The Wave 2 set is the four untracked source files plus the `web/` files the
   remediation and review docs name. If a modified file's diff is not explained
   by a Wave 2 item, leave it unstaged and list it in your handoff.
2. Stage the four untracked source files explicitly — they are the exposure.
3. Commit. Split into more than one commit if the paths group cleanly (CSS
   rewrite / primitives / probe rebuild / tests); one commit is acceptable.
4. Stage `docs/WAVE2_REMEDIATION_2026-09-18.md`,
   `docs/WAVE2_REVIEW_2_2026-09-18.md`, `docs/DXA_AUDIT_REVIEW_2026-09-19.md`
   and this file too — they are currently untracked and are the audit trail.
5. Backfill `commit <sha>` on every `Done:` line missing one: DXA-13, DXA-14,
   DXA-15, DXA-16. Replace "commit see git log" on DXA-01/02/03/04 with the
   actual sha.

**Must not.** `git add -A`. `git clean`. Amend an existing commit. Push.

**Acceptance.** `git status --porcelain` shows no untracked file under `web/`;
every `[x]` item in audit §4 carries a resolvable sha; `git show --stat <sha>`
lists the four primitives.

**Negative control.** Not applicable (no gate).

**Commit message ending** (per this session's attribution rule):

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

---

### W-2 · P0 · One full nine-phase harness run, then rewrite §12 from it

**Why.** 17 of 38 ratcheted gates were last measured at 09:24Z or 11:41Z on
2026-09-18, and the Wave 2 CSS rewrite landed ~18:00Z (G3, G4). §12 prints all
17 as PASS. Two are plausibly live failures right now:

- `DXA-05 pending hero within 8px of loaded` is a **pixel** measurement, and the
  card padding + shadow layer moved underneath it.
- `DXA-01 skeleton bar/card contrast` is a **contrast** reading, and the skeleton
  block sits in the same rewritten stylesheet.

This is the identical gap `WAVE2_REVIEW_2` found for `tabs`, closed for `tabs`,
and left everywhere else.

**Do.**

```powershell
Set-Location 'D:\sanstro'
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action up
node web\scripts\ux-audit.mjs --out web\e2e\.artifacts\w2-full-2026-09-21
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\ux-audit-stack.ps1 -Action down
```

No `--phases` — the default is all nine. **~7-10 minutes** on `next dev`.

**Conditions that will cost you an hour if you skip them.**
- The stack builds from a **copy** at `artifacts\ux-stack\web`. Code changes are
  picked up only by `down` then `up` again. A run against a stale copy measures
  the build you already measured.
- `up` refuses to finish unless `/api/backend/health` **through the frontend
  proxy** reports `environment: e2e`. If it reports anything else, stop — do not
  work around it. The harness registers accounts.
- Never `Remove-Item -Recurse artifacts\ux-stack` while junctions exist. Run
  `down` first.
- Do not run this while a `playwright test` `serve` stack holds :3100/:8010.
- The owner's `:3000` and `:8000` must be untouched. Confirm before and after.

**Then.**
1. For each of the 38 `MUST_PASS` keys, record the new value. Any that is not
   PASS is a **regression**, not a finding — say so plainly and treat it as P0.
2. Rewrite the §12 rows from this run. Add the run's folder and date to every
   row you touch.
3. For any row you could not measure, the honest word is **stale**, not PASS.
4. Add the missing `DXA-05 pending hero within 8px of loaded` row (G14, and
   W-10).

**Acceptance.** One `metrics.json` whose `phases` array holds all nine, whose
`startedAt` is after W-1's commit, and a §12 table in which no row's date
precedes it.

**Negative control.** Not applicable (this is a measurement, not a fix). But
**do** state in your handoff which gates this run still cannot see: everything
outside a top-level English pane — overlays reached through sub-tools, report
surfaces, and every Tamil rendering (W-8).

**Done line.** None; this updates §12's baseline block and every row's date.

---

### W-3 · P1 · The light-theme stale dim, and a gate that would have caught it

**Why.** A known AA failure closed `[x]` with no item ID, no gate and no date,
parked behind "say the word" (G10, OD-3). The `light` phase already exists; a
contrast reading of the stale pane belongs in it.

**Do.**
1. Apply OD-3's recommendation. Chrome-dim variant: leave
   `.nova-today-pane[data-stale]` body text at full opacity and dim the pane's
   chrome (kickers, rules, chip fills, the sub-bar) instead. Fallback: change
   `0.6` → `0.75` at `dashboard-nova.css:4777`.
2. Add a gate to the `light` phase: read the **effective** contrast of the stale
   pane's body text against its background — computed colour composited through
   the ancestor opacity, not the declared token pair — and require ≥ 4.5:1.
   Register it exactly as:

   ```js
   add("DXA-07", "stale pane body text holds AA on light", `${ratio.toFixed(2)}:1`, ratio >= 4.5);
   ```

   which yields the `MUST_PASS` key `DXA-07 stale pane body text holds AA on light`
   (phase `light`).
3. Ratchet it **after** the negative control, not before.

**Must not.** Remove the dim entirely — the two marks (dim + hairline) are the
ruled behaviour and say the day in view is not the day asked for. Touch the
2 px hairline. Fold in the `useMonthlyPanchangam` Calendar twin, which DXA-07
deliberately left out as its own surface.

**Acceptance.** The new gate PASSes in a `light` run; no other `light` or
`today` gate moved.

**Negative control — required.** Restore `0.6` (or re-apply the body-text dim),
re-run `--phases light`, and confirm the new gate **FAILs** with a ratio below
4.5. Keep that metrics folder; name it in the Done line. A gate for a contrast
bug that has never printed a failing ratio has not been shown to read contrast.

**Done line.**
`Done: DXA-07 stale pane body text holds AA on light <failing ratio> → <passing ratio>; negative metrics <folder>; passing metrics <folder>; commit <sha>`

---

### W-4 · P1 · Resolve §6 against DXA-16, and record which way

**Why.** G8, G9 and OD-2. Three tokens the spec mandates do not exist; the gate
that guards easing would go red if they did. This is not a bug, it is an
unrecorded decision, and leaving both standing guarantees the next agent hits
the contradiction and guesses.

**Do — path B (recommended).**
1. Strike audit §6 line 1339 ("exit faster on `--ease-exit`") and lines
   1344-1346 (the three tokens) per §15: strike through, do not delete, and say
   why in one sentence — one settle curve is the house style.
2. Record it as a lineage choice: "we chose one curve for enter and exit",
   never "faster exits were wrong".
3. Leave DXA-16's gate wording alone. It is now true *and* consistent.
4. Note in DXA-13's block that `Presence` intentionally runs one duration both
   directions, so the next reader does not file it as drift.

**Do — path A (only if the owner picks it).**
1. Add the three CSS tokens beside `--dur-*` (`dashboard-nova.css:2429-2433`)
   and their JS twins in `lib/motion.ts` — the file's own comment already
   requires the two to stay in sync.
2. Give `Presence` an overlay `kind` (`popover` | `modal` | `drawer`) driving
   160/120, 240/160, 240/180, and thread it through `ModalShell` and
   `DrawerPanel`.
3. **Re-word DXA-16's check to an allowlist** in the same change, or the gate
   fails the fix. Both the browser probe (`ux-audit-core.mjs:1320`) and the
   source guard's `BARE_EASE` regex must accept `--ease-exit` and keep rejecting
   bare `ease`.
4. Negative control per overlay kind: each must show its own `lingeredMs` band.
   Today every overlay measures 244-248 ms — that single number *is* the
   evidence the tokens are absent, and three distinct bands are the evidence
   they landed.

**Acceptance.** Path B: §6 no longer mandates a token that does not exist, and
the audit records the ruling with its reason. Path A: all five overlays still
PASS DXA-13 and DXA-41, DXA-16 still PASSes under the new wording, and exit
durations differ by kind in the metrics.

**Negative control.** Path B: none (a documentation ruling). Path A: required,
per step 4.

---

### W-5 · P1 · Split `.ui-card--interactive`'s hover rule

**Why.** The whole hover rule — `translateY(-2px)`, `--elev-2`, border → strong
— sits inside `@media (prefers-reduced-motion: no-preference) and (hover: hover)`
(G7). A reduced-motion user therefore gets **zero** hover affordance, not even
the colour and shadow change. §6 line 1355 says reduced motion keeps
"colour/shadow only". This re-creates DXA-12 for exactly the users least able to
absorb it, and no census can see it: the harness's `hover` phase does not run
under reduced motion, and the `reduced` phase does not hover.

**Do.** In `dashboard-nova.css`, split at `:3030`:

```css
/* Affordance, always: a reduced-motion reader still needs to know this clicks.
   §6 — "reduced motion keeps meaning and drops travel". */
@media (hover: hover) {
  [data-ui="nova"] .cd-shell .ui-card--interactive:hover {
    box-shadow: var(--elev-2);
    border-color: var(--color-border-strong);
  }
}
/* Travel, only when motion is welcome. */
@media (prefers-reduced-motion: no-preference) and (hover: hover) {
  [data-ui="nova"] .cd-shell .ui-card--interactive:hover { transform: translateY(-2px); }
}
```

Then sweep for the same shape elsewhere: any rule that puts colour, border,
shadow **or** outline behind `prefers-reduced-motion`.

```powershell
Select-String -Path web\app\**\*.css,web\components\**\*.css -Pattern 'prefers-reduced-motion' -Context 0,12
```

**Must not.** Use the bare `pointer: coarse` touch query anywhere near this —
it matches the owner's touchscreen laptop. `(hover: hover)` is the correct axis
here, and DXA-39's policy is `(pointer: coarse) and (hover: none)`.

**Acceptance.** A `reduced` run in which a `.ui-card--interactive` hover still
changes `boxShadow` and `border`, and does **not** change `transform`.

**Negative control — required.** This one needs a probe that does not exist yet:
the `reduced` phase does not currently hover. Either extend `hoverPress` to run
once under `prefers-reduced-motion: reduce` and add

```js
add("DXA-12", "reduced motion keeps colour/shadow hover feedback", `${withFeedback}/${sampled}`, withFeedback === sampled);
```

(key: `DXA-12 reduced motion keeps colour/shadow hover feedback`, phase
`reduced`), or record explicitly in the audit that this fix is **verified by
hand only** and name what was checked in which theme. Do not ratchet a gate you
did not run against the fix removed.

**Done line.**
`Done: DXA-12 reduced motion keeps colour/shadow hover feedback <before> → <after>; negative metrics <folder>; passing metrics <folder>; commit <sha>`

---

### W-6 · P1 · DXA-12 properly — the item that sets the interaction grade

**Why.** 18/71 hover, 17/71 press (G5). **~75% of clickable surfaces give no
feedback at all.** Audit §1 grades interaction feedback **C** on the strength of
this, and Wave 2 — the "feel" wave — closed six items around it without moving
it. This is the last thing standing between Wave 2 and the grade it was meant to
buy, and it is design work, not plumbing.

**Read the probe before you start.** `hoverPress()`
(`ux-audit-core.mjs:494-541`) decides what counts:

- **Population:** inside the active pane, `button, a[href], [role='button'],
  [role='tab']`, **excluding** disabled / `aria-disabled` / `aria-selected=true`
  / `aria-pressed=true` / anything with `aria-current`, and **excluding**
  anything narrower than 90 px or shorter than 30 px.
- **Sample:** up to **16 per pane**, spread evenly across the candidate list.
  6 panes → 71. So **71 is a sample, not the population.** Converting the 53
  named below closes the sample; it does not close the population. Convert by
  **class of surface**, not by chasing 53 labels.
- **Hover** = any of `transform, boxShadow, border, bg, color, filter` differs
  between rest and hover.
- **Press is diffed against the hovered state**, not against rest. A press
  effect identical to the hover effect is **invisible to this gate and to a
  user**. `whileTap scale(0.97)` on top of a `translateY(-2px)` hover reads
  fine, because the computed `transform` value differs — but a press that only
  re-asserts the hover shadow will not register.

**The diagnosis, from the last run.** The 17 surfaces that *do* respond are:
6 Today Quick Links and 5 Explore cards (full `transform+boxShadow+border`
hover — these go through `Card` with `onClick`, which auto-applies
`.ui-card--interactive` at `components/ui/card.tsx:54`), 2 life-areas controls
with weak hover (`color` only / `border` only), and **4 `Pressable` call sites in
`dashboard-family-charts-hybrid.tsx` with `press: transform` and no hover at
all.** So:

> The mechanism that works is `.ui-card--interactive` via `Card onClick`. The
> kit's `.ui-btn` and `.ui-pill` also already carry hover **and** `:active`
> (`dashboard-nova.css:3309, 3320, 3329, 3337, 3366, 3367`). **The 53 dead
> surfaces are therefore overwhelmingly hand-rolled `button`/`a` elements
> outside the kit — not kit components missing states.** Route them through the
> kit; do not bolt states onto 53 bespoke selectors.

**The 53, grouped into the six jobs that close them** (labels verbatim from
`rv-hover-final/metrics.json`):

| # | Class | Count | Surfaces |
|---|---|---|---|
| 1 | Today pane actions | 9 | Remind me · Log a moment · View full almanac · +Ask your own · Full panchangam · Coming up — No major transit shifts · Turn on reminders · More remedies · Open Chart & Explanations |
| 2 | Tools hub tiles | 12 | Marriage Porutham · Jadhagam Generator · Annual Wrapped · Retrospective · Muhurta Finder · Panchangam Planner · Indraiya Rasipalan · Activity Timing · Varshaphala · Compatibility · Numerology · Baby Name Finder |
| 3 | Understand / Explore library tiles | 10 | Guru Peyarchi 2026 · Sevvai dosham · Your birth star · Active in your chart · What is a house? · What is Lagnam? · What does the daily score mean? · How to read a Jadhagam · What is Chandrashtama? · Why birth time matters (+ "Can't find what you're looking for?") |
| 4 | Family chart rows and panel headers | 12 | Moon · Jupiter · Saturn · Mandhi · Mars · Venus · Rahu · Mercury rows · Shadbala · Kalachakra Dasha · Jaimini Chara Dasha · the Compatibility summary card |
| 5 | Goals pane | 4 | Family & Charts · + Add goal ×2 · + Log event |
| 6 | Life-areas score card | 1 | Today's guidance 61/100 BALANCED |
| — | **Hover missing on `Pressable` itself** | 4 | ◇ Compatibility · + Add member · Audit Partner · ⤓ Download PDF |

**Do — W-6a, harden the primitive first.** `Pressable` is thinner than its own
fix step (G6). Give it:

1. **Hover, not just press.** `whileHover` (or the CSS class below) so the four
   existing call sites stop being press-only.
2. **Anchor support.** The fix step says "renders `button` or `a`". Accept an
   `as`/`href` discriminator and render `motion.a` when given an `href`. 24 of
   the 53 (classes 2 and 3) are navigational tiles; a `button` that navigates is
   the wrong element and breaks middle-click, copy-link and focus order.
3. **The `.ui-pressable` class it names.** It does not exist. Add it to
   `dashboard-nova.css` carrying the shared rest/hover/press appearance, so the
   primitive's look lives with every other token and `Pressable` stays a
   behaviour wrapper. Split it the same way W-5 splits
   `.ui-card--interactive`: colour/shadow/border outside the reduced-motion
   query, travel inside.
4. Keep it **out of `components/ui/index.ts`** (audit §10 rule 8, and the
   framer ChunkLoadError incident). Import it directly.

**Do — W-6b, convert by class.** One commit per numbered class above, in that
order (1 and 2 are the highest-traffic). For each: prefer the existing
mechanism — `Card` with `onClick` for card-shaped surfaces, `.ui-btn`/`.ui-pill`
for button-shaped ones, `Pressable` only where neither fits. Class 4's planet
rows and panel headers are disclosures; check whether they should be
`CollapsibleSection` (which DXA-15 already made correct) rather than gaining a
hover state.

**Must not.**
- Re-introduce a blanket rule. The `*{…!important}` selector that once made this
  gate read 8/8 is gone and **must not come back** — the audit calls that out
  explicitly on DXA-12. Zero new `!important` in the dashboard CSS.
- Add hover-only feedback. The gate wants press at **100%**, and a touch user
  never hovers.
- Use `pointer: coarse` alone (see W-5).
- Gain a hover state on something that is not actually clickable. If a surface
  in the list is decorative and matched only because it is a `<button>`, the fix
  is to stop it being a button — and say so.

**Acceptance.** `--phases hover`: `DXA-12 hover feedback coverage ≥ 95%` and
`DXA-12 press feedback coverage = 100%` both PASS, with
`DXA-12 every hover pane yielded surfaces` still PASS. Compare against a
denominator of **71** — never against the historical 22, which came from a probe
that sampled only on-screen controls and let four panes return nothing.

**Negative control — required.** Revert one converted class (class 2 is
cleanest), re-run `--phases hover`, confirm coverage drops by that class's count
and the gate FAILs. Restore. Both metrics folders named in the Done line.

**Then ratchet.** Add both keys to `MUST_PASS` with phase `hover`:

```
"DXA-12 hover feedback coverage ≥ 95%": "hover",
"DXA-12 press feedback coverage = 100%": "hover",
```

and keep `DXA-12 every hover pane yielded surfaces` there. Note in the item that
`hover` has never been ratcheted before, so this is its first entry.

**Stop condition.** If a class cannot reach feedback without a visual decision
the audit has not made (a new hover treatment for a chart row, say), convert
everything else, mark DXA-12 `[~]` with the remaining count, and put the
question in your handoff. Do not invent a treatment and do not mark `[x]` at
anything below the gate's own thresholds.

---

### W-7 · P2 · Three guards that cannot see what they claim to guard

Independent sub-tasks; land them together or separately.

**a. The motion guard is blind to the four files that define the dashboard's
motion.** `dashboardComponents()` recurses into `components/ui/` but filters
`/^dashboard-.*\.tsx$/`, so `presence.tsx`, `pressable.tsx`,
`segmented-thumb.tsx` and `view-swap.tsx` fall straight through (G11). They are
clean today — all use `EASE_NOVA` — so this is regression exposure, not a live
leak. **Do:** include every `.tsx` under `components/ui/`, plus the five
non-`dashboard-` components the guard already hand-lists as `COMPONENTS`
(`collapsible-section.tsx`, `modal-shell.tsx`, `drawer-panel.tsx`,
`life-area-card.tsx`, `nova-select.tsx`) if they are not there yet.
**Negative control:** the guard already ships a matcher self-test; add an
end-to-end one the way the previous review did — drop `transition: "opacity
120ms ease"` into `components/ui/presence.tsx`, confirm the guard fails **and
names the file**, then revert.

**b. The rasi ratchet covers one of six doubled field families.**
`lib/rasi-display-boundary.test.ts` is the right shape — two-directional, keyed
on the field rather than the casing, with its own matcher self-test. But
CLAUDE.md names **six** doubled families and only rasi is ratcheted: `lord` /
`graha`, nakshatra, tithi, yoga and karana have nothing. All five are clean
today (swept 2026-09-19), so again this is regression exposure. A raw
`period.lord` nonetheless sat in a dasha tooltip for months, two files from a
twin that localised it correctly. **Do:** generalise the same matcher — roughly
20 lines — keeping both directions (an undeclared read fails; a declared file
that stopped reading one **also** fails, so the allowlist cannot become a record
of a past that was cleaned up). Two known gaps to record whether or not you
close them: it scans `.tsx` only, so a `.ts` helper building a label is
invisible (none exists today); and `title=` / `aria-label=` are renders that no
browser text probe can see. **Negative control:** add a raw `.lord` render to a
scratch component, confirm failure naming the file, revert.

**c. The harness itself is unlinted.** `scripts/` is in eslint's
`ignorePatterns` (G12), and `ux-audit-core.mjs` is the single file every gate's
verdict passes through. **Do:** lint it — either narrow `ignorePatterns` to the
generated output under `scripts/` or add an explicit override for
`scripts/*.mjs`. Fix what it finds; if a rule is genuinely wrong for a Node
script, disable that rule for the file with a reason, not the file for all
rules.

**Acceptance.** `vitest run` green with the widened guards; `eslint` green
including `scripts/`; each sub-task's negative control recorded on disk or in
the audit.

---

### W-8 · P2 · A Tamil run of the `tabs` phase

**Why.** The harness pins `lang: "en"` with one settings PATCH (G13). Since that
blind spot was first written down, **14 `ViewSwap` sites** (9 of them in
`dashboard-explore-tab-nova.tsx`), **5 `Presence` overlays**, the elevation
system and the touch policy have all been gated — every one of them in English,
at top level. Tamil also stresses layout hardest: DXA-05's own reserve numbers
record Tamil at 860 px running 34 px short and Tamil on a phone overshooting by
10 px, both ungated. Per-item hand checks in Tamil have genuinely caught things
(DXA-09's `கருவிகள் · கருவிகள்` kicker), which is the argument for automating
them, not against.

**The precedent is already in the file.** DXA-10 added a whole `sky` phase
because a clock made a gate unfalsifiable. A `ta` variant is the same move and
about as cheap.

**Do.**
1. Add `"ta"` to `ALL_PHASES` (`ux-audit-core.mjs:26`) and a phase block
   modelled on `sky` (`:1177-1207`): **its own context**, because switching
   language is not free and every other phase measures the English render.
2. Set the account's language with the same settings PATCH the bootstrap uses
   (`:103`), then assert `document.documentElement.lang === "ta"` before
   sampling. If it is not `ta`, **fail the phase** — "not measurable" is a
   failure, not a pass. That is DXA-10's rule and it is the whole reason this
   phase is worth having.
3. Switch tabs by **clicking**, never `page.goto` — a fresh document re-issues
   the dev CSP nonce and the lazy tab chunk is refused, leaving a blank pane that
   reads as a clean zero.
4. Re-run the layout-sensitive checks in Tamil and register them with distinct
   names, so keys cannot collide with the English run:

   ```js
   add("DXA-27", "phone: no horizontal overflow (ta)", …);
   add("DXA-05", "pending hero within 8px of loaded (ta)", …);
   ```

5. `DXA-09 no Tamil text in English mode` self-disables in Tamil — the probe
   already returns `[]` when `documentElement.lang === "ta"`
   (`ux-audit-core.mjs:271`). Do not "fix" that. Its mirror — **English inside
   Tamil mode** — is the check worth adding here.
6. Give the two orphaned Tamil defects DXA-09 found and deliberately left
   outside its scope real item IDs in audit §4, so they can be picked up:
   - `metaTa` for the Panchangam Planner reads `இதில் · Calendar தாவல்` —
     English inside Tamil mode.
   - The Compatibility tool card and the Porutham hero share one Tamil name
     (`பொருத்தம் / இணக்கம்`), so Tamil mode offers two differently-scoped tools
     under the same title.

**Conditions.** Tamil display follows **almanac usage, not Sanskrit**. Tamil
clock strings use period-words (`மதியம் 1:42`, never "pm") and **no em-dash**.
Active language only — no bilingual echo. Any new or changed Tamil string goes
in your handoff for the owner's sign-off, and a review marker is never dated
without an explicit "approved".

**Files must be saved UTF-8 without BOM.** Never round-trip source through
PowerShell redirection — it adds a BOM and mojibakes Tamil. Use the editing
tools.

**Acceptance.** A `ta` phase that produces measurements, fails loudly when the
language did not apply, and whose gate keys do not collide with the English run.

**Negative control — required.** Force the language PATCH to `en` while asking
for the `ta` phase and confirm the phase **fails** rather than quietly measuring
English. That is the exact failure mode DXA-10 was opened for.

---

### W-9 · P2 · The production-build check nobody ran

**Why.** The §3.1 segmented fix carried an explicit follow-up — "verify
afterwards that a route importing only `Card` or `Pill` still has no framer in
its chunk" — and it was **never performed**. The import graph reads correctly,
which is not the same as the bundle being correct; that distinction is precisely
what DXA-35 was opened for. DXA-06 (full-opacity skeleton frames) also only
gates under `--prod`.

**Conditions.** `next build` inside `web/` disturbs the owner's `:3000` server.
Build from the **isolated copy** (`artifacts\ux-stack\web`), or coordinate with
the owner first. Do not start `next dev` inside `web/` for any reason.

**Do.**
1. Build the isolated copy.
2. Grep the emitted chunks for a framer marker on a route that imports only
   `Card`/`Pill`. If framer is present, the barrel has regressed (audit §10
   rule 8) and that is a P1 finding, not a footnote.
3. Run `node web\scripts\ux-audit.mjs --prod` and record DXA-06 and DXA-35.

**Acceptance.** A named build artifact plus the grep result, recorded on DXA-35.
If the build cannot be run safely now, **say that** in the handoff and leave
DXA-35 `[~]` — do not record the import-graph read as if it were a bundle check.

---

### W-10 · P3 · Document hygiene

Cheap, and a reader scans the tables before the prose.

1. **`DXA-05 pending hero within 8px of loaded` has no §12 row** (G14) though it
   is ratcheted in `MUST_PASS`. §15 treats the table as the register; a gate that
   can fail the suite and is invisible to a reader is the worst of both. Add it,
   with W-2's value.
2. **§12 collapses five DXA-13 gates and five DXA-41 gates into one row each**,
   so §15's instruction to key `MUST_PASS` "exactly as the gate table prints
   them" cannot be followed literally. Either split those rows to one per gate,
   or soften §15's wording to "one row may cover a family of gates; key
   `MUST_PASS` from the harness output". Pick one and do it.
3. **DXA-37 contradicts itself.** The heading reads `[x] 2026-09-18`, the block
   opens "Owner-approved 2026-09-18", and it still ends "`[~]` not `[x]`: a
   review marker is never dated without an explicit 'approved'." Approval
   arrived (`11020e8`). Per §15, strike that sentence with a reason; do not
   delete it.
4. Re-check the two summary tables the previous review flagged (audit `:1559`
   region and the §13 wave table) against whatever W-2 measured.

---

## 5. Execution protocol — applies to every task

### The verification ladder, from `D:\sanstro\web`

```powershell
.\node_modules\.bin\tsc.CMD --noEmit
.\node_modules\.bin\vitest.CMD run                      # targeted first, full before handoff
.\node_modules\.bin\eslint.CMD <changed files> --max-warnings=0
```

Then the rendered check for anything visual: isolated stack `up` → the relevant
`--phases` → compare to W-2's baseline → `down`. Visual items also need
before/after shots in dark, light **and** 390 px; motion items add a
reduced-motion run.

**Last known-green state** (2026-09-19, uncommitted tree): `tsc` clean,
**920 passed / 920** across 95 files in ~90 s, eslint 0 errors on the 48 changed
TS/TSX files. A failure you did not cause is a signal to check for a competing
local run before it is a signal to debug.

### The negative-control law

Before recording any gate as PASS, **run it once with the fix removed and
confirm it fails.** Then write down what the gate still cannot see, beside the
PASS. This is not ceremony:

- DXA-05's pending hero stands at the loaded height, so DXA-07's "hero ≥ 90%"
  passed with and **without** the fix.
- DXA-08's gate grepped for `UPPER_CASE`, so a correctly-cased English name
  tripped no regex — **nine** leaks shipped behind a green tick.
- DXA-10's stars paint only from dusk and the gate ran at 11:37, so it was
  passing on the unfixed tree.

A tick whose scope is not recorded is inherited by the next reader as "this item
is clean."

### The ratchet law

A gate enters `MUST_PASS` (`web/e2e/dashboard-experience.spec.ts:27`) **only
after** it has passed on the current tree *and* failed with the fix removed.
Keys are `"${id} ${check}"` exactly as the harness prints them (G15) — a typo
reads as `MISSING`, which fails, which is the one forgiving failure mode here.
If you must un-ratchet a gate, say so in the item heading with `[~]` and strike
the superseded claim rather than deleting it.

### Commit protocol

Do not commit unless asked. When asked: stage **only your own paths** (audit §10
rule 10 — this branch carries unrelated uncommitted work). Never overwrite an
existing test file with a whole-file write; check `git status`, then edit or
append. End commit messages with:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

### Status protocol (audit §15, verbatim obligations)

Edit the item's heading in §4 in place: `[ ]` → `[x] YYYY-MM-DD`. Add one line
underneath:

```
Done: <gate> <before> → <after>; metrics <folder>; commit <sha or "uncommitted">
```

Add the passing gates to `MUST_PASS` in the same change. Partial progress is
`[~]` with the blocking reason. **Do not delete findings**; strike through what
stopped being true and say why.

---

## 6. Traps that have already cost this repo time

Each of these has a scar in `CLAUDE.md` or the audit. They are listed because
this specific work order walks past all of them.

| Trap | What it looks like | What to do |
|---|---|---|
| `next dev` in `web/` | the owner's `:3000` build silently wiped | only the isolated stack copy, ever |
| Stale stack copy | a run that measures the build you already measured | `down` then `up` after every code change |
| A gate that cannot fail | "unverified" recorded as "verified" | negative control, always (§5) |
| Blanket `*{…!important}` | DXA-12 reading 8/8 on a broken build | zero new `!important`; it was deleted on purpose |
| `pointer: coarse` alone | touch floors applied to the owner's laptop | `(pointer: coarse) and (hover: none)` |
| `page.goto` per tab | dev CSP nonce re-issued, chunk refused, blank pane read as a clean zero | switch tabs by clicking |
| A name field rendered | `Mithunam` printed at a Tamil reader | read the key, render through the localiser; `title=`/`aria-label=` count |
| Source round-tripped through PowerShell | BOM added, Tamil mojibaked | use the editing tools; UTF-8 without BOM |
| A stale "blocked by" note | months lost to a constraint that stopped being true | re-verify the constraint verbatim before acting on it |
| Two local test runs | `DROP SCHEMA` mid-test, a burst of `UndefinedTable` | check for a competing process (§0.3); CI is authoritative |
| A framer import in the barrel | ChunkLoadError across the dashboard | keep `components/ui/index.ts` lean; import primitives directly |

---

## 7. Definition of done for this work order

- W-1 and W-2 complete, and every §12 row carries a date at or after W-2's run.
- W-3 … W-7 complete, each with its negative control on disk and its blind spot
  written beside its PASS.
- W-8, W-9, W-10 complete, or explicitly deferred with the reason and the
  verbatim constraint recorded.
- OD-1's commission brief delivered to the owner. OD-2 and OD-3 recorded as
  rulings with their reasons — including, if the owner never answered, the
  assumption you proceeded under.
- `tsc`, `vitest`, `eslint` green. No gate regressed against W-2.
- Every new or changed Tamil string listed for sign-off.
- A handoff that names: the gates that moved and their before/after values,
  **every check you skipped**, every assumption you proceeded under, and what
  each new gate still cannot see.

Report failures as failures. A partially closed item is `[~]` with a count, not
`[x]` with a caveat.

---

## 8. Out of scope

Do not start these from this work order, even though they are visible from it.

- **Waves 3 and 4** — 15 items. Three of the audit's six grades (system
  consistency C+, freshness B−, phone C) cannot move until Wave 3, and Wave 3
  should not start before OD-1 is answered.
- **DXA-18** (reading choreography) and **DXA-06** beyond W-9's measurement.
- The `useMonthlyPanchangam` Calendar collapse — same class as DXA-07, its own
  surface and its own skeleton story, deliberately not folded in.
- Deleting `sanitizeRestoredTab` or any other dead code. Deletion is the **last**
  task and needs **per-file owner approval**, one question per file.
- Backend changes. Frontend-only by default; a backend text fix is its own
  change after grepping all four API surfaces (`app/api/`,
  `packages/shared/src/api/`, `mobile/src/api/`, `web/`).
- Converting grandfathered direct `apiFetchJson` calls in `web/` to shared
  wrappers. New endpoints get wrappers; existing call sites stay.

---

## 9. Provenance

Every G-row in §1 was measured on 2026-09-21 against the working tree at
`harden/production-readiness` (HEAD `a89c5d0`), not read off a document.

The staleness table (G3) came from parsing every artifact folder's `startedAt`
and `phases`:

```powershell
Set-Location 'D:\sanstro\web'
Get-ChildItem e2e\.artifacts -Directory | ForEach-Object {
  $m = Join-Path $_.FullName 'metrics.json'
  if (Test-Path $m) {
    $j = Get-Content $m -Raw | ConvertFrom-Json
    [pscustomobject]@{ folder = $_.Name; startedAt = $j.startedAt; phases = ($j.phases -join ',') }
  }
} | Sort-Object startedAt | Format-Table -AutoSize -Wrap
```

The DXA-12 census (G5, and the 53 in W-6) came from:

```powershell
$j = Get-Content e2e\.artifacts\rv-hover-final\metrics.json -Raw | ConvertFrom-Json
$j.hover.PSObject.Properties | ForEach-Object {
  $pane = $_.Name
  $_.Value | ForEach-Object {
    [pscustomobject]@{ pane = $pane; label = $_.label; hover = ($_.hover -join '+'); press = ($_.press -join '+') }
  }
} | Where-Object { -not $_.hover } | Format-Table -AutoSize
```

Source documents: `docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md` (the register;
§0 owner decisions, §4 items, §6 motion spec, §10 rules, §11 environment, §12
ladder and gate table, §13 waves, §14 traps, §15 protocol),
`docs/WAVE2_REMEDIATION_2026-09-18.md`, `docs/WAVE2_REVIEW_2_2026-09-18.md`,
`docs/DXA_AUDIT_REVIEW_2026-09-19.md` (findings F1-F9, from which W-1 … W-10
derive), and `CLAUDE.md`.

**Not done here, and it matters:** no browser run of any phase was performed
while writing this file — W-2 exists precisely because nobody has. No production
build (W-9). No Tamil rendering check (W-8). Those three gaps are tasks in this
order, not claims inside it.
