# Wave 2 close-out — remaining work, errors to reopen, and items not started (2026-09-21)

**Audience:** a coding agent (any) picking up Wave 2 close-out part-way through.
You have not seen the previous session. This file tells you what is already
done, what was done wrong and must be reopened, what is half-done, and what has
not started, each with its acceptance test.

**Relationship to other files.** The authority for *how* to work is still
`docs/WAVE2_CLOSEOUT_WORK_ORDER_2026-09-21.md` (§0 setup, §5 execution
protocol, §6 traps) and `CLAUDE.md`. This file does not repeat those rules at
length. It replaces only the work order's **status**: the work order describes
the tree at `a89c5d0`; this file describes the tree at **`ba7685d`**. The audit
register stays `docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md`, and its §15
status protocol still governs every `Done:` line.

**How this was produced.** A read-only review of commits `af20604..ba7685d`
(19 commits), their metrics folders under `web/e2e/.artifacts/`, and a fresh
local ladder run. No browser run was made during the review. Values marked
*computed* are arithmetic from token colours, not measurements; they are the
reason to measure, not a substitute for it.

---

## 0. Before your first command

```powershell
Set-Location 'D:\sanstro'
git log --oneline -3          # expect ba7685d at the top; if not, re-verify every row in §1
git status --porcelain
```

1. Read `CLAUDE.md` and the work order's §0, §5 and §6. PowerShell only, `;`
   not `&&`, never `Out-File` a source file, never `next dev` inside `web/`,
   rendered checks through `scripts\ux-audit-stack.ps1` only.
2. **Check for a competing session.** A previous agent (Codex, parent
   `codex.exe`) was running audit phases on this branch today. Before trusting
   any failure, and before starting the stack:

   ```powershell
   Get-CimInstance Win32_Process |
     Where-Object { $_.CommandLine -match 'codex|vitest|playwright|ux-audit' } |
     Select-Object ProcessId, ParentProcessId, CommandLine
   ```

   If another agent owns a run, stop and ask. Do not kill it.
3. `:3000` is the owner's own `npm run dev` (VS Code terminal). The isolated
   audit stack uses `:3100` / `:8010`. Confirm `:3000` is untouched before and
   after every stack cycle.
4. Do not commit unless asked. When asked, stage only your own paths, never
   `-A`. `docs/WAVE2_CLOSEOUT_CODEX_PROMPT_2026-09-21.md` is the owner's
   untracked file; leave it alone.

---

## 1. Snapshot at `ba7685d`

| Item | State | Evidence |
|---|---|---|
| W-1 commit Wave 2 | **Done.** Do not redo. | `af20604`, `9886ee4`; commit SHAs backfilled on DXA-01–04 and DXA-13–16 |
| W-2 nine-phase baseline | **Done.** Do not redo. | `w2-full-2026-09-21-r3`: 10 FAIL · 39 PASS · 3 INFO, all 38 `MUST_PASS` passed; §12 rewritten |
| W-2 side-fix: pending hero reserve | **Done.** | `05bab96`, `--nova-hero-reserve` 592 → 621 px |
| W-2 side-fix: observance name | **Error, reopen** → E-3 | `e1632f8` |
| W-3 stale-day AA | **Error, reopen** → E-1 | marked `[x]`, but the failure moved onto the masthead |
| W-4 one motion curve (OD-2 path B) | **Mostly done; residue** → E-5 | `8dac3da`; §6's table still specifies asymmetric in/out durations |
| W-5 reduced-motion hover | **Done.** Do not redo. | `b4285f3`, `44644cc`; 0/3 → 3/3 with negative control |
| W-6 DXA-12 hover/press | **Incomplete, and partly wrong** → E-4, I-1 | 70/71 hover, 71/71 press in `w6-hover-pass-precontrol`; no negative control, not ratcheted, audit not updated |
| W-7 guard scope | **Not started** → N-1 | |
| W-8 Tamil phase | **Not started** → N-2 | |
| W-9 production build | **Not started** → N-3 | |
| W-10 doc hygiene | **1 of 4 done** → I-2 | pending-hero §12 row added; items 2, 3, 4 open |
| OD-1 glyph commission brief | **Not delivered** → N-4 | |
| Ladder | `tsc` clean · eslint clean (53 changed files incl. `scripts/`) · **vitest 920/921, one failure** → E-2 | run 2026-09-21 12:36 IST |

---

## 2. Owner decisions this file adds

The work order's OD-1 (glyph set, **blocking**) still stands. Two new ones:

### OD-4 · Hover/press treatment per kind of surface · **blocking for rows, headers and selects**

W-6 applied one treatment, the card lift (`translateY(-2px)` + `--elev-2`
shadow + strong border), to things that are not cards: planet table rows,
every `CollapsibleSection` and `Surface` header, and the `NovaSelect` trigger.
The work order's W-6 stop condition names exactly this case ("a new hover
treatment for a chart row, say") as one an agent must not invent.

**Recommended taxonomy** for the owner to approve or amend:

| Kind | Rest → hover | Press | Reduced motion |
|---|---|---|---|
| Card / tile (whole surface navigates or opens) | lift −2 px, `--elev-1`→`--elev-2`, border → strong | scale 0.985 | shadow + border only |
| Button (kit `.ui-btn--*`) | variant's own background/border shift; **no shadow on ghost** | scale 0.97 | unchanged (no travel involved) |
| Text link / inline action | colour → `--color-accent-strong`, underline | none needed beyond colour; or opacity 0.8 | unchanged |
| List row / disclosure header | background tint (`--color-surface-soft` or equivalent) — **no lift, no shadow** | background one step deeper | unchanged |
| Select trigger | border → strong | background tint | unchanged |

**Until the owner answers:** implement only the card and button rows, revert
the lift from rows, headers and the select (E-4), leave DXA-12 `[~]` with the
honest count, and put this table in your handoff. If the owner has answered,
record the ruling in audit §6 and implement it.

### OD-5 · Where the English observance names live · *proceed-under-assumption*

See E-3. **Recommended:** the frontend stopgap (a complete 24-entry map keyed
by the Tamil name, plus a parity test), because the backend fix is an API
contract change that must touch four surfaces and is out of this work order's
frontend-only scope. Record the assumption; the backend fix becomes its own
item.

---

## 3. Errors in work already marked done — reopen these

### E-1 · P0 · W-3 moved the AA failure onto the masthead; its gate cannot see it

**What was done (`1ea20e0`).** `.nova-today-pane[data-stale] { opacity: 0.6 }`
was replaced by colour-mix dims on border/accent tokens plus
`.nova-today-pane[data-stale] .nova-hero-masthead { opacity: 0.68 }`
(`web/app/dashboard/dashboard-nova.css:4850`). DXA-07 was closed `[x]` with
"3.41:1 → 10.47:1".

**Why it is wrong.** The masthead (`web/components/dashboard-today-tab-nova.tsx:742`)
is not chrome. It carries the date (`.nova-hero-masthead__date`,
`--color-text`) and the five panchangam limbs (`.nova-hero-masthead__limb`,
`--color-muted`) — the text that says which day is on screen. Computed on the
light theme at opacity 0.68 over `#FFFCF6`:

| Text | Token | Computed effective contrast |
|---|---|---|
| panchangam limbs | `#6F5B41` | **≈ 2.9 : 1** |
| date | `#4A3820` | **≈ 4.3 : 1** |

Both are under 4.5:1, and the limbs are worse than the 3.41 the change
"fixed".

**Why the gate passed.** The probe (`web/scripts/ux-audit-core.mjs:1182` onward)
does not put the pane into the stale state. It searches the stylesheets for a
rule whose selector contains `.nova-today-pane[data-stale]` and has an
`opacity`, then applies that value inline to the pane. After the fix that rule
has no opacity, so the probe measures an undimmed pane. It also samples one
briefing paragraph (`.nova-hero-col-main > div > div[id]`), never the
masthead. The run history shows the probe was reworked until the negative
control failed: `w3-stale-aa-negative-r4`, `-r6`, `-r7` read 10.47 (the probe
could not see the dim) before `-r8` read 3.41. The first fix attempt read
**4.19:1** (`w3-stale-aa-pass`, `-r2`), so the work order's 0.75 fallback would
not have passed either.

The audit's blind-spot line for this item ("the light probe forces the loaded
English Today pane's stale CSS state") describes the probe inaccurately.

**Do.**
1. **Rebuild the probe first**, so it measures the real state:
   - Prefer the real state: hold the next day's request with `page.route(...)`
     (delay, do not fail it), click the next-day control, wait for
     `.nova-today-pane[data-stale]` to exist, measure, then release the route.
   - Fallback only if that proves impossible: `pane.setAttribute("data-stale", "")`,
     wait 300 ms, measure, remove the attribute. Say which one you used.
   - Measure **every visible element in the pane that has a direct non-empty
     text node**, not one sample. For each: effective foreground and background
     composited through the product of ancestor opacities (the existing
     `over()` / `luminance()` helpers are fine). Apply WCAG's large-text rule
     (≥ 24 px, or ≥ 18.66 px and weight ≥ 700 → 3:1; otherwise 4.5:1).
   - Report the **minimum** ratio, the element that produced it and how many
     elements were checked. Gate value: `min <ratio>:1 (<label>, n=<count>)`.
   - Keep the key unchanged: `DXA-07 stale pane body text holds AA on light`.
     Optionally rename the check to "stale pane text holds AA on light"; if you
     do, update `MUST_PASS` in the same change.
2. **Run the new probe on the current tree before changing any CSS.** The
   current tree is your negative control: it must FAIL on the masthead limbs.
   Keep that folder. If it passes, the probe is still wrong. Do not continue.
3. **Then fix the design.** No `opacity` on any element that contains text.
   Dim only non-text marks: the border/accent token dims already in place, SVG
   icons, fills. Keep the 2 px progress hairline untouched (ruled behaviour).
   If the pane does not already set `aria-busy="true"` while stale, add it; it
   tells assistive tech what the dim tells sighted readers. Do not add a
   visible "Loading…" label without the owner's sign-off (it is a new Tamil
   string).
4. Re-run `--phases light,today`. The new gate must PASS; no other `light` or
   `today` gate may move.

**Status protocol.** Change DXA-07's heading to `[~]` while you work. Strike
the existing "3.41:1 → 10.47:1" Done line and its blind-spot line per §15
(strike through, do not delete) with the reason "probe did not enter the stale
state; masthead text fell to ≈2.9:1". When done, restore `[x] <date>` and add:

`Done: DXA-07 stale pane text holds AA on light <failing min> → <passing min>; negative metrics <folder>; passing metrics <folder>; commit <sha>`

**Blind spot to write beside the PASS:** English only, light theme only,
Today pane only; nested overlays opened from the pane are not measured.

---

### E-2 · P0 · The vitest suite is red

```
lib/css-surface-boundary.test.ts
  × root routes only use classes defined in a stylesheet they load
    → [".ui-card--interactive -> app/dashboard/dashboard-nova.css"]
```

**Cause.** W-6 added `ui-card--interactive` to shared components (`Surface`'s
`.surface__title` in `web/components/dashboard-ui.tsx`, `0bf9c91`; and
`CollapsibleSection`'s trigger, `bdd5e08`). `/login` renders `GuestChartModal`
(`web/app/login/page.tsx:20`), which pulls one of those in, and `/login` never
loads `dashboard-nova.css`. The guard caught it; nobody ran the full suite
after those commits.

**Reproduce the exact list:**

```powershell
Set-Location 'D:\sanstro\web'
.\node_modules\.bin\vitest.CMD run lib/css-surface-boundary.test.ts
```

**Do.** Fix it as part of E-4, not separately: the disclosure headers should
not carry the card class at all (OD-4). If OD-4 is answered with a
row/header treatment, give it its own class (e.g. `.ui-disclosure-trigger`)
defined in a component-scoped stylesheet that travels with its importer, so
`/login` reaches it. **Do not** weaken the boundary test or add the class to
an allowlist.

**Acceptance.** Full vitest green: 921/921 or more.

---

### E-3 · P1 · The observance fix is keyed to one date

**What was done (`e1632f8`).** `novaFestivalDisplayName` in
`web/components/dashboard-calendar-tab-nova.tsx` maps `"09-21"` →
"International Day of Peace", renders the generic word "Observance" for any
other Tamil-named observance in English mode, and "Festival" for any other
Tamil-named festival.

**Why it is wrong.** The backend's `_WORLD_OBSERVANCES`
(`app/calculations/festivals.py:24-49`) carries **24** entries, every one a
Tamil-only name. The W-2 run happened on 21 September, so the gate saw one of
them; the other 23 days a year an English reader sees a chip that says
"Observance". Two entries share `06-08`, so a date-keyed map would give both
the same label. It was also not a Wave 2 regression; it surfaced because the
audit ran on that date.

**Do (OD-5 recommended path).**
1. Replace the date-keyed map with a map **keyed by the exact Tamil name**,
   covering all 24:

   | Tamil name (key) | English |
   |---|---|
   | உலக பிரெய்லி தினம் | World Braille Day |
   | உலக புற்றுநோய் தினம் | World Cancer Day |
   | சர்வதேச மகளிர் தினம் | International Women's Day |
   | உலக மகிழ்ச்சி தினம் | International Day of Happiness |
   | உலக காடுகள் தினம் | International Day of Forests |
   | உலக நீர் தினம் | World Water Day |
   | உலக சுகாதார தினம் | World Health Day |
   | உலக புவி தினம் | Earth Day |
   | உலக தொழிலாளர் தினம் | International Workers' Day |
   | உலக புகையிலை எதிர்ப்பு தினம் | World No Tobacco Day |
   | உலக சுற்றுச்சூழல் தினம் | World Environment Day |
   | உலக பெருங்கடல் தினம் | World Oceans Day |
   | உலக மூளைக்கட்டி தினம் | World Brain Tumour Day |
   | சர்வதேச யோகா தினம் | International Day of Yoga |
   | உலக மக்கள்தொகை தினம் | World Population Day |
   | சர்வதேச இளைஞர் தினம் | International Youth Day |
   | சர்வதேச எழுத்தறிவு தினம் | International Literacy Day |
   | சர்வதேச அமைதி தினம் | International Day of Peace |
   | சர்வதேச முதியோர் தினம் | International Day of Older Persons |
   | உலக உணவு தினம் | World Food Day |
   | உலக நீரிழிவு தினம் | World Diabetes Day |
   | உலக குழந்தைகள் தினம் | World Children's Day |
   | உலக எய்ட்ஸ் தினம் | World AIDS Day |
   | உலக மனித உரிமைகள் தினம் | Human Rights Day |

   Copy the Tamil keys **from `festivals.py` with your editing tool**, not from
   this table through PowerShell, and save UTF-8 without BOM.
2. Drop the `dateLocal` prop that only existed for the date lookup.
3. Add a **parity test** (vitest) that reads `app/calculations/festivals.py`,
   extracts every Tamil name in `_WORLD_OBSERVANCES`, and fails if any is
   missing from the map. That turns "the backend added a 25th observance" into
   a red test instead of a silent "Observance" chip. Include the matcher
   self-test pattern used by `lib/rasi-display-boundary.test.ts`.
4. Keep a fallback for unknown Tamil festival names, but note it in the handoff
   as a known gap: the right fix is a language-free key from the backend.
5. Note: `05-01` also has "May Day (Labour Day)" in `_FIXED_FESTIVALS`, so
   English mode will show two chips for the same day. Record it; do not fix it
   here (backend data).

**Acceptance.** The existing test in `dashboard-calendar-tab-nova.test.tsx`
still passes; add one for a second observance (e.g. `06-08`, both names) and
the parity test. Negative control: delete one map entry, confirm the parity
test fails naming it, restore.

**Record** a new backend follow-up in the audit (its own item, not started):
"`_WORLD_OBSERVANCES` sends Tamil-only names; send a language-free key and
localise on the client, per CLAUDE.md's display boundary. Touches `app/api/`,
`packages/shared/src/api/`, `mobile/src/api/`, `web/`."

---

### E-4 · P1 · W-6's conversions broke its own rules

Each point below is a correction to W-6's commits `2d3dc74..ba7685d`. Fix these
before finishing W-6 (I-1).

**a. Card lift invented for non-cards (stop-condition violation; OD-4).**
Revert `ui-card--interactive` / `ui-pressable` from:
- `web/components/dashboard-hybrid-parts.tsx` — both planet-row buttons in
  `HyPlanetOrbs` (the orb button and the table-row button);
- `web/components/collapsible-section.tsx` — `.collapsible__trigger`;
- `web/components/dashboard-ui.tsx` — `Surface`'s `.surface__title`;
- `web/components/nova-select.tsx` — the trigger button.

These render in about 38 dashboard files, so the change restyled every
disclosure and select in the product, not only the sampled surfaces. Apply
OD-4's row/header/select treatment only once the owner has answered.

**b. Kit-wide visual changes landed without review.** `ba7685d` made every
`.ui-btn` (ghost variant included) and every `.ui-pill` cast a hover shadow.
Under OD-4's recommendation, ghost buttons do not take a shadow. Scope the
`.ui-btn:hover` shadow to the variants that should have one, or remove it and
rely on the variant hover colours. Remove the **duplicate**
`.ui-btn:active { transform: scale(0.97); }` at `dashboard-nova.css:3374`
(the original is at `:3363`).

**c. Kit class bolted onto inline-styled buttons.** Bare `className="ui-btn"`
was added to buttons that keep a full inline `style={{…}}`. Inline
`background` / `border` / `color` beat the kit's hover rules, so the only
feedback is a shadow. Meanwhile the class adds properties the inline style did
not set: `min-height: 38px`, `line-height: 1`, `justify-content: center`,
`gap: 8px`. For example, the "View full almanac" text link (inline
`padding: 0`) is now 38 px tall. Sites:

| File | Approx. line | Surface |
|---|---|---|
| `dashboard-today-activity-board-nova.tsx` | 593 | + Ask your own |
| `dashboard-today-glance-nova.tsx` | 129 | `GlanceHeader` link button (text link) |
| `dashboard-today-glance-nova.tsx` | 808, 820 | Remedy focus: reminder, More remedies |
| `dashboard-today-tab-nova.tsx` | 950 | reminder button |
| `dashboard-today-tab-nova.tsx` | 1238, 1253 | **hero action row**: Remind me, Log a moment |
| `dashboard-today-tab-nova.tsx` | 1535 | Full panchangam |
| `dashboard-today-tab-nova.tsx` | 1732 | Open Chart & Explanations |
| `dashboard-plan-life-event-log-nova.tsx` | 145 | + Log event |
| `dashboard-plan-tab-nova.tsx` | 408 | + Add goal |

For each: choose the right kit variant (`ui-btn--primary` / `--secondary` /
`--ghost`, `ui-btn--sm` where the inline size was small) and **delete the
inline properties the variant now supplies**, so the kit's hover and press
states actually apply. A text link is not a button: give it a link treatment
(OD-4), not `.ui-btn`. Never add `!important` to win against inline styles.

**d. Census dodge.** `DashboardTodayComingUpNova` gained
`disabled={!onGoToCalendar}`. A disabled button is excluded from the census
and is announced as "unavailable". If there is no handler, render a non-button
element (`div`) instead, and say so in the handoff.

**e. Unused primitive path.** `Pressable` gained `as="a"` / `href`, which no
call site uses. Either use it where a surface genuinely navigates to a URL, or
state in the handoff that every converted surface opens in-app state (so a
`<button>` is correct) and leave the path for later use. Do not delete it
(deletion needs per-file owner approval).

**f. The hero moved and nobody measured it.** Two hero-action buttons gained
`min-height: 38px` after the pending-hero reserve was re-pinned to 621 px
(`05bab96`). Only `--phases hover` has run since. After fixing (c), run
`--phases load,today,phone` and confirm
`DXA-05 pending hero within 8px of loaded` still PASSes. If it does not,
re-measure the reserve per the comment above `--nova-hero-reserve` in
`dashboard-nova.css` (en and ta, 390 / 860 / 1440).

---

### E-5 · P2 · §6's motion table still contradicts OD-2

W-4 struck the exit *tokens* and the "exit faster" principle, but audit §6's
moment table still specifies asymmetric durations:

| Audit line | Row | Still says |
|---|---|---|
| 1390 | Sub-view / tool swap | 180 ms in / 120 ms out |
| 1394 | Popover | 160 in / 120 out |
| 1395 | Modal | 240 in / 160 out |
| 1396 | Drawer / sheet | 240 in / 180 out |
| 1397 | Disclosure | 240 / 180 ms |
| 1392 | Press (card) | 90 ms (the retired `--dur-press`) |

**Do.** Per §15, strike each superseded duration and write what the code
actually does (`DUR.base` 240 ms both directions for `Presence`; check
`ViewSwap` and `CollapsibleSection` for their real values in
`web/lib/motion.ts` and the components before writing a number). One-line
reason: "OD-2 path B, 2026-09-21: one settle curve and one duration per
direction pair". No code change.

---

## 4. Incomplete items

### I-1 · P1 · Finish W-6 (DXA-12)

**Current numbers** (`w6-hover-pass-precontrol`, 12:33 IST, **before** the
E-4 corrections): hover **70/71**, press **71/71**, every pane yielded
surfaces. The one hover miss is Family → "Mercury", selector
`button.glossary-term__trigger < span < span`, press registers but hover does
not. Investigate why the new `.glossary-term__trigger:hover` colour rule
(`dashboard-nova.css:3077` onward) does not register: the text may already be
`--color-accent-strong`, or the rule may lack `(hover: hover)` scoping. Note
also that `ba7685d` moved the trigger's `color: inherit` from inline style into
a rule scoped to `.cd-shell`; confirm `GlossaryTerm` renders nowhere outside
`.cd-shell`, or the text falls back to the browser's button colour there.

**Expect the numbers to drop** after E-4 reverts rows, headers and the select.
That is correct. Do not reinstate the lift to recover them.

**Do, after E-4.**
1. Run `--phases hover` **three times in a row** on the same build. Press
   moved 63 → 54 → 70 → 71 across today's runs (code changed between some of
   them, but not all). A gate with a 100% threshold that flaps will make CI
   flaky, and the audit already removed DXA-13's ratchet once for flapping.
   Record all three values.
2. **Negative control (required, not yet done):** revert class 2 (Tools tiles,
   commit `1841ca0`) locally, `down`/`up` the stack, run `--phases hover`,
   confirm coverage drops by that class's count and the gate FAILs. Restore.
3. Rendered check the work order requires for visual items: before/after shots
   in **dark, light and 390 px** of Today, Tools, Understand, Family, Goals and
   Life Areas, hovering one converted surface of each kind. Also run
   `--phases reduced` (W-5's gate must stay 3/3).
4. **Only if** hover ≥ 95% and press = 100% on all three runs: add to
   `MUST_PASS` (phase `hover`):

   ```
   "DXA-12 hover feedback coverage ≥ 95%": "hover",
   "DXA-12 press feedback coverage = 100%": "hover",
   ```

   Keep `DXA-12 every hover pane yielded surfaces` there. Note in the item that
   this is `hover`'s first ratchet. Copy the keys from the harness output, not
   from this file; a typo reads as `MISSING`.
5. If OD-4 is unanswered and coverage is below threshold, DXA-12 stays `[~]`
   with the count: `[~] hover <n>/71, press <n>/71 — rows, disclosure headers
   and selects await OD-4`.

**Done line (only at thresholds):**
`Done: DXA-12 hover 19/71 → <n>/71, press 18/71 → <n>/71 (3 runs: …); negative metrics <folder>; passing metrics <folder>; commit <sha>`

**Blind spot to write beside it:** the probe samples up to 16 surfaces per
pane (71 is a sample, not the population), English only, top-level panes only,
mouse only (touch press and keyboard focus are not measured), dark theme only.

### I-2 · P3 · Finish W-10

Done: item 1 (the `DXA-05 pending hero within 8px of loaded` row is in §12).
Open:

2. §12 still collapses five DXA-13 gates and five DXA-41 gates into one row
   each. Either split them to one row per gate, or soften §15's wording to "one
   row may cover a family of gates; key `MUST_PASS` from the harness output".
   Pick one, do it, and say which.
3. **DXA-37 still contradicts itself.** Audit line 892-893 ends "`[~]` not
   `[x]`: a review marker is never dated without an explicit 'approved'" under
   a heading that reads `[x] 2026-09-18` and a block that opens
   "Owner-approved". Approval is `11020e8`. Strike that sentence per §15 with
   the reason; do not delete it.
4. Re-check the summary table near audit line 1559 and the §13 wave table
   against the latest full run (§6 below), and update any stale status.

---

## 5. Not started

Full specifications are in the work order (§4, W-7 … W-9, and §3 OD-1). The
essentials are below so you can plan; read the work order's section before you
start each.

### N-1 · P2 · W-7 — three guards that cannot see what they claim

- **a. Motion guard scope.** `web/lib/dashboard-motion-source.test.ts`'s
  `dashboardComponents()` filters `/^dashboard-.*\.tsx$/`, so every file in
  `components/ui/` (`presence.tsx`, `pressable.tsx`, `segmented-thumb.tsx`,
  `view-swap.tsx`) is outside it. Include every `.tsx` under `components/ui/`
  plus `collapsible-section.tsx`, `modal-shell.tsx`, `drawer-panel.tsx`,
  `life-area-card.tsx`, `nova-select.tsx`. **Negative control:** add
  `transition: "opacity 120ms ease"` to `components/ui/presence.tsx`, confirm
  the guard fails naming that file, revert.
- **b. Display-boundary ratchet covers one of six families.** Generalise
  `web/lib/rasi-display-boundary.test.ts` to `lord`/`graha`, nakshatra, tithi,
  yoga and karana. Keep both directions (an undeclared read fails; a declared
  file that stopped reading also fails). Record the two gaps: `.tsx` only, and
  `title=` / `aria-label=` are invisible to browser text probes. **Negative
  control:** a raw `.lord` render in a scratch component fails naming the
  file; revert.
- **c. Harness lint.** `scripts/` is in `web/.eslintrc.json`'s
  `ignorePatterns`. Narrow it (or add an override for `scripts/*.mjs`). Today
  `eslint --no-ignore` on `scripts/ux-audit-core.mjs` is already clean, so this
  is mostly config, but confirm the other `scripts/*.mjs` files too. Disable a
  wrong rule per file with a reason, never the file for all rules.

**Acceptance:** vitest and eslint green with the widened guards; each negative
control recorded.

### N-2 · P2 · W-8 — a Tamil (`ta`) phase

- Add `"ta"` to `ALL_PHASES` (`web/scripts/ux-audit-core.mjs:26`) and a phase
  block modelled on `sky`, in **its own browser context**.
- Set the language with the same settings PATCH the bootstrap uses
  (`Select-String -Path web\scripts\ux-audit-core.mjs -Pattern 'settings/ui'`),
  then assert `document.documentElement.lang === "ta"`. If it is not, the phase
  **fails** — "not measurable" is a failure.
- Switch tabs by **clicking**, never `page.goto` (dev CSP nonce; blank pane
  reads as a clean zero).
- Re-run layout-sensitive checks under distinct keys, e.g.
  `DXA-27 phone: no horizontal overflow (ta)`,
  `DXA-05 pending hero within 8px of loaded (ta)`.
- Add the mirror of `DXA-09 no Tamil text in English mode`: **English inside
  Tamil mode**. Do not "fix" the English check's self-disable in Tamil.
- Give the two orphaned Tamil defects real audit IDs in §4: Panchangam
  Planner `metaTa` reads `இதில் · Calendar தாவல்`; Compatibility tool and
  Porutham hero share one Tamil title (`பொருத்தம் / இணக்கம்`).
- **Negative control:** force the PATCH to `en` while running the `ta` phase;
  it must fail.
- Tamil rules: almanac usage over Sanskrit; clock period-words (`மதியம் 1:42`),
  no "pm", no em-dash; active language only. List every new or changed Tamil
  string for owner sign-off. UTF-8 without BOM; edit with tools, never
  PowerShell redirection.

### N-3 · P2 · W-9 — the production-build check

- Build **the isolated copy** (`artifacts\ux-stack\web`), never inside `web/`.
- Grep the emitted chunks of a route that imports only `Card`/`Pill` for a
  framer-motion marker. Framer present = the `components/ui/index.ts` barrel
  regressed: a P1 finding, not a footnote. (Today `Pressable`, `Presence` and
  `SegmentedThumb` are correctly **not** exported from the barrel; confirm
  that still holds.)
- Run `node web\scripts\ux-audit.mjs --prod` and record DXA-06 and DXA-35.
- If the build cannot be run safely, say so and leave DXA-35 `[~]`. Do not
  record an import-graph read as a bundle check.

### N-4 · OD-1 commission brief (agent deliverable; the decision stays the owner's)

Write `docs/GLYPH_COMMISSION_BRIEF_2026-09-21.md`: every glyph needed, grouped
as **9 grahas / 12 rasis / panchangam limbs / festival and deity marks**, each
with the emoji or text glyph it replaces and the surface it appears on. Style
target: 1.75 px stroke to match Lucide (audit DXA-24). Start from the live list
in the `tabs` phase's `DXA-09 no emoji / text glyphs as icons` gate:
`calendar: 📅 🗓 📍 ♉ ☀ · family: 🪔 ☀ 👋 ✳ ♂ ♀ · journal: 🕊 · personal: ★ ⤓ · calendar: ▾ ☀ · family: ↻ ◇ ✎`,
plus `festivalIcon()` in `dashboard-calendar-tab-nova.tsx` and the placeholders
in `web/public/deities/`. **Do not draw or invent icons.** The agent part of
DXA-24 (Lucide only where a true equivalent exists, plus one shared 36 px icon
well for Quick Links, Tools and Understand) may proceed; deity and festival
marks wait.

---

## 6. Order of work

```
E-2  red vitest ─────────────── folded into E-4a; nothing is "green" until this is
E-1  W-3 probe, then design ─── a known AA failure is sitting behind [x]
E-5  §6 table strike ────────── documentation only, 15 minutes
E-4  W-6 corrections ────────── needs OD-4 for rows/headers/selects; do the rest now
I-1  finish W-6 ─────────────── 3 stable runs + negative control + shots, then ratchet
E-3  observance map ─────────── OD-5 proceed-under-assumption
N-1  W-7 guards
N-2  W-8 Tamil phase
N-3  W-9 production build
I-2  W-10 hygiene
N-4  OD-1 brief ─────────────── any time; highest leverage for the owner
LAST one full nine-phase run (no --phases) after everything above; compare to
     w2-full-2026-09-21-r3; any MUST_PASS key not PASS is a regression (P0)
```

Stack cycle for every rendered check: `ux-audit-stack.ps1 -Action down`, then
`-Action up` (the stack serves a **copy**; code changes are picked up only by
re-copying), run the phases, `-Action down`. `up` must report
`environment: e2e` through the frontend proxy; if not, stop.

---

## 7. Rules that the previous pass broke — do not repeat

- **Run the full vitest suite before handing off**, not only targeted tests.
  The boundary guard was red for three commits.
- **A probe must drive the real state.** Scraping a stylesheet for a
  declaration and re-applying it measures the CSS text, not the render. If a
  probe's negative control needed several attempts to fail, say so and explain
  what changed.
- **A gate reaching its threshold is not the item's definition of done.** Hitting
  70/71 by lifting table rows satisfies the regex and fails the design. Work
  order §5: state what the check cannot see, and look there by hand.
- **A stop condition is not optional.** When a surface needs a visual decision
  the audit has not made, convert the rest, mark `[~]` with the count, and ask.
- **Kit classes replace inline styles; they do not sit on top of them.**
- **No gate-shaped data.** A fix that is correct only on the date, account or
  viewport the audit happened to use is not a fix.
- Every other rule in the work order's §5 and §6 still applies: negative
  control before every PASS, blind spot beside every PASS, ratchet only after
  both, `[~]` with a count rather than `[x]` with a caveat, never delete a
  finding, no new `!important`, no bare `pointer: coarse`, no Tailwind, shadcn
  or Radix, no framer primitive through the barrel, no server-chosen display
  names rendered.

---

## 8. Handoff format

Per item:

```
<ID>  <title>
  changed:    <paths>
  gate:       <key>  <before> → <after>
  negative:   <metrics folder>   (or: not possible, because …)
  passing:    <metrics folder>
  blind spot: <what this gate still cannot see>
  ladder:     tsc <r> · vitest <passed>/<total> · eslint <r>
  status:     [x] / [~] <reason and count>
```

Then one closing section: every gate that moved with before/after; **every
check you skipped and why**; every assumption you proceeded under (OD-4 if
unanswered, OD-5); every new or changed Tamil string for sign-off; the OD-1
brief's path; and the final nine-phase run's folder with its PASS/FAIL count
against `w2-full-2026-09-21-r3`.
