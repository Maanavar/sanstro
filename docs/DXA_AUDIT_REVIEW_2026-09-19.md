# Independent review — `DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md` (2026-09-19)

Reviewed as UX direction, implementation and test discipline in one pass.
Everything below was **measured against the working tree**, not read off the
audit. Where I trusted a claim without re-running it, I say so.

Nothing was changed. Nothing was committed.

---

## Verdict

| | Grade | One line |
|---|---|---|
| **The document as a work order** | **A−** | Among the best audit-and-execute docs I have reviewed. Negative controls, recorded blind spots, superseded claims struck rather than deleted. |
| **Wave 0 + 1 (trust)** | **A−** | Real, in the source, and gated. Spot-checked every claim; all held. |
| **Wave 2 (feel)** | **B−** | Substantially real, but half its ratcheted gates are unmeasured against the tree that exists today, all of it is uncommitted, and the one item users actually feel (DXA-12) is at 25%. |
| **Waves 3 + 4** | **not started** | 15 items. Three of the audit's own six grades — system consistency (C+), freshness (B−), phone (C) — cannot move until Wave 3. |
| **Overall implementation** | **B / B+** | The plan is better than the execution is complete, which is the right way round. |

**Headline:** the work that has landed is honest and well-tested. The risk is
not that something was faked — the previous review already caught and corrected
that pattern, and this pass does not repeat it. The risk is **17 green ticks in
§12 that describe a build from 2026-09-18 09:24**, and **an entire wave sitting
in an uncommitted working tree**.

---

## What I verified, and how

### Verification ladder, re-run from `D:\sanstro\web`

| Step | Result |
|---|---|
| `tsc --noEmit` | **clean** (exit 0) |
| `vitest run` | **920 passed / 920**, 95 files, 90 s |
| `eslint <48 changed files> --max-warnings=0` | **0 errors** (one warning: see F6c) |

### Source claims spot-checked (all hold)

| Item | Claim | Found |
|---|---|---|
| DXA-02 | tab restore gone | `sanitizeRestoredTab` has zero callers; `dashboard-workspace.test.tsx:65` asserts its absence from the hydration effect. Function + tests retained pending deletion approval, exactly as the item says. |
| DXA-03 | loading ≠ empty | `needsProfile = personal.birthProfileLookupDone && !personal.birthProfileId` (`dashboard-workspace.tsx:712`). |
| DXA-04 | tri-state gate | `useState<boolean \| null>(null)` (`:640`), waits on `family.vaultsReady` (`:982`), renders on `=== false` (`:1757`). |
| DXA-07 | hold the previous day | `keepPreviousData` on **8** date-keyed queries across both hooks; `isShowingPreviousDay = isPlaceholderData && !isError` (`usePersonalData.ts:300`); `lifeAreaInsights` gated on `!isShowingPreviousDay` (`:407`). `data-stale` + `aria-busy` both wired (`dashboard-today-tab-nova.tsx:721-722`). |
| DXA-08 | display boundary | Zero raw `.rasiName`/`.rasiCode` renders in `web/`. I also swept the five *other* doubled fields CLAUDE.md names (`lord`, `graha`, nakshatra, tithi, yoga, karana) — all reach the screen through `DashaLordLabel` / `tPlanetLord`. Clean today. |
| §3.1 regression | segmented `ssr` | Fixed, and better than asked: `ssr: true` **plus** a `:not(:has(.ui-segmented__thumb))` CSS fallback for the client-nav frame (`dashboard-nova.css:3158`). |
| Review fixes 5–8 | gate, inert, click, token | DXA-14 gate exists (`ux-audit-core.mjs:1294-1296`); open-direction `inert` asserted (`collapsible-section.test.tsx:76,82`); `clickOpen` is a real `locator.click()` (`:1072`); `Presence` uses `DUR.base`. |
| Rule 8 | barrel stays lean | `components/ui/index.ts` carries no framer-importing module. Verified by import graph read, **not** by a build (see F6d). |

### Evidence on disk — re-parsed, not trusted

The negative controls the audit cites are real and they discriminate:

```
ux-audit-wave2-negative   more/notifications/account/ask  enter false | exit false
                          DXA-16  FAIL  "ease"
ux-audit-wave2-after      all five overlays               enter true  | exit true
                          DXA-16  PASS  "tokens only"
ux-audit-dxa14-negative2  life-areas/plan/calendar        animated:false, changed:true
ux-audit-wave2-after      same three                      animated:true,  changed:true
```

The five consecutive `overlays` runs exist (`ux-audit-wave2-after-2…5`) and
**DXA-41 is green in all five**, including the `ask-vinaadi page-click` case
that flapped 2/10 before. That flake looks genuinely closed by the shared
`Presence` lifetime, not papered over.

One nuance worth recording: in `ux-audit-wave2-negative` the DXA-14 rows read
`changed:false` — the key never changed, so that run is not a valid negative for
DXA-14. `ux-audit-dxa14-negative2` is, and the audit cites the right one. Good.

---

## Findings

### F1 · P0 · Seventeen ratcheted gates describe a build that no longer exists

Last run of each phase, read out of the artifact folders:

| phase | last run | gates it owns |
|---|---|---|
| `tabs` | **2026-09-19 03:43** | 8 |
| `overlays` | **2026-09-19 03:49** | 10 |
| `hover` | 2026-09-19 02:56 | 3 (not ratcheted) |
| `load` | **2026-09-18 09:24** | DXA-01 dark, 02, 03, 04, 05 × 4 |
| `today` | **2026-09-18 09:24** | DXA-07 × 3 |
| `light` | **2026-09-18 09:24** | DXA-01 light |
| `phone` | **2026-09-18 09:24** | DXA-27 overflow |
| `sky` | **2026-09-18 11:41** | DXA-10 × 2 |
| `reduced` | **2026-09-18 11:41** | DXA-11 × 2 |

The Wave 2 CSS rewrite — `--elev-1/2/3` onto every `.ui-card`, the blanket
`!important` deletion, `Presence` wrapping five overlays, `ViewSwap` at 14
sites, `Segmented`'s dynamic thumb — all landed **after 18:00 on 2026-09-18**.
So **17 of the 38 `MUST_PASS` gates have never run against it**, and §12 prints
every one of them as PASS.

This is the exact gap `WAVE2_REVIEW_2` identified for `tabs`, closed for `tabs`,
and did not close for anything else. Several of them are plausibly live:
`DXA-05 pending hero within 8px of loaded` is a pixel measurement and the card
padding/shadow layer moved under it; `DXA-01` is a contrast reading and the
skeleton block sits in the same rewritten stylesheet.

**Do:** one `node web\scripts\ux-audit.mjs` with **all** phases before anything
here is described as done. It is ~7–10 min. Until then the honest word in §12
for those rows is *stale*, not PASS.

### F2 · P0 · Wave 2 exists only in an uncommitted working tree

58 modified files, plus **4 untracked**:

```
?? web/components/ui/presence.tsx          ← DXA-13 depends on it
?? web/components/ui/pressable.tsx         ← DXA-12 depends on it
?? web/components/ui/segmented-thumb.tsx   ← DXA-14 depends on it
?? web/lib/dashboard-motion-source.test.ts ← DXA-16's guard *is* this file
```

An untracked file is one `git clean -fd` from gone, and three of these are the
primitives the whole wave is built on.

Compounding it: §15 requires each `Done:` line to carry `commit <sha or
"uncommitted">`. DXA-13, DXA-14, DXA-15 and DXA-16 cite artifact folders and
**no commit field at all** — so a reader of §12 cannot tell that four `[x]`
items are unshipped. DXA-01/02/03/04 use the equally unhelpful "commit see git
log".

**Do:** `git add` the Wave 2 paths and commit (rule 10 — stage your own paths,
never `-A`), and backfill the commit field on every Done line that lacks one.

### F3 · P1 · The item that sets the interaction grade is at 25%

`rv-hover-final`, re-read:

```
PASS  DXA-12  every hover pane yielded surfaces   all panes measured
FAIL  DXA-12  hover feedback coverage ≥ 95%       18/71
FAIL  DXA-12  press feedback coverage = 100%      17/71
```

**~75% of clickable surfaces still give no hover and no press feedback.** §1
grades interaction feedback **C** on the strength of this, and Wave 2 — the
"feel" wave — closed six items around it without moving it.

The primitive is also thinner than its own fix step. `Pressable`
(`components/ui/pressable.tsx`) is 20 lines, applies `whileTap` only — **no
hover at all** — renders `motion.button` only (the fix says "`button` or `a`"),
and the `.ui-pressable` class the fix names **does not exist** in the
stylesheet. It has 3 call sites, all in `dashboard-family-charts-hybrid.tsx`.
The real hover work is being done by `.ui-card--interactive`, which `Card`
applies automatically when `onClick` is present — a good mechanism, just not
yet reaching the other 53 surfaces.

One more thing that census cannot see: `.ui-card--interactive`'s hover rule is
inside `@media (prefers-reduced-motion: no-preference) and (hover: hover)`
(`dashboard-nova.css:3030`). A reduced-motion user therefore gets **zero** hover
affordance — not even the border and shadow change. §6 says reduced motion keeps
"colour/shadow only", so this is a spec miss that re-creates DXA-12 for exactly
the users least able to absorb it. Split the rule: travel behind the motion
query, colour/shadow/border outside it.

### F4 · P1 · A known AA failure was closed `[x]` with no owner deadline and no gate

`.nova-today-pane[data-stale] { opacity: 0.6 }` (`dashboard-nova.css:4777`).
DXA-07 records, in its own words, that on the light theme this "drops body text
under AA for the ~1 s it is on", offers 0.75 as the fix, and closes the item
`[x]` pending "say the word".

A defect whose remedy is one number should not be parked behind a conversation.
It has no item ID, no gate, no date — it is a textbook candidate for
[A Stale Conclusion Outlives Its Check]. The `light` phase already exists;
a contrast reading of the stale pane belongs in it.

**Do:** set 0.75 now (or dim chrome and leave text at full opacity, which
carries the message without touching legibility), and add the check to `light`.

### F5 · P1 · §6's motion spec and DXA-16's gate now contradict each other

§6 mandates three new tokens: `--dur-press: 90ms`, `--dur-exit: 140ms`,
`--ease-exit: cubic-bezier(0.4, 0, 1, 1)`, with the binding principle "exit
faster on `--ease-exit`".

**None of the three exists** anywhere in `web/` — not in the CSS, not in
`lib/motion.ts`. Consequently:

- `Presence` runs `DUR.base` (240 ms) with `EASE_NOVA` in **both** directions,
  for popovers, modals and drawers alike, where §6 specifies 160/120, 240/160
  and 240/180 respectively. Measured exits in the artifacts: `lingeredMs` 244–248
  on every overlay — one duration, as predicted.
- DXA-16's gate is worded **"Nova easing tokens only"** and passes because
  `--ease-nova` is the only curve on the page. Introduce `--ease-exit` as §6
  requires and **the gate goes red for doing the right thing.**

This is not a bug; it is an unrecorded decision. Either §6's exit language is
retired (say so, and say why — one curve is a defensible house style), or the
tokens ship and DXA-16's check is re-worded to an allowlist. Leaving both
standing guarantees the next agent hits the contradiction and guesses.

### F6 · P2 · Guard scope

**a. The rasi ratchet covers one of six doubled fields.** `lib/rasi-display-boundary.test.ts`
is excellent — two-directional, keyed on the field not the casing, with its own
matcher self-test. But CLAUDE.md names six doubled families and only rasi is
ratcheted. I swept the other five and they are clean *today*; the exposure is
regression, not a live leak. Generalising the same matcher to `.lord` / `.graha`
/ nakshatra / tithi / yoga / karana is maybe 20 lines. (It also scans `.tsx`
only — a `.ts` helper building a label is invisible. None exists today.)

**b. The motion guard still cannot see the four new primitives.** The scan list
fix landed (`app/globals.css`, `app/dashboard/*.css`, `components/*.css` are all
in). But `dashboardComponents()` filters on `/^dashboard-.*\.tsx$/`, so
`components/ui/presence.tsx`, `pressable.tsx`, `segmented-thumb.tsx` and
`view-swap.tsx` — the files that define the dashboard's motion — are outside its
own guard. They are clean now (all use `EASE_NOVA`); the guard just would not
notice if they stopped being.

**c. The harness itself is unlinted.** `scripts/ux-audit-core.mjs` is in
eslint's ignore list — that is the single file every gate's verdict passes
through. The lone warning in my eslint run was this file being skipped.

**d. One check from the previous review was never performed.** §3.1's fix
carried a follow-up: "verify afterwards that a route importing only `Card` or
`Pill` still has no framer in its chunk." That needs a build; no build artifacts
exist. The import graph reads correctly, which is not the same as the bundle
being correct — that is the exact distinction DXA-35 was opened for.

### F7 · P2 · The two harness-wide blind spots now carry much more weight

§4 names them honestly: **top-level panes only**, and **`lang: "en"` only**.
Since they were written, 14 `ViewSwap` sites, 5 `Presence` overlays, the
elevation system and the touch policy have all been gated — every one of them in
English, at top level. Per-item hand checks in Tamil have been done and have
genuinely caught things (DXA-09's `கருவிகள் · கருவிகள்` kicker), but there is
still **no Tamil run of any phase**.

The precedent for fixing this is already in the file: DXA-10 added a `sky` phase
because a clock made a gate unfalsifiable. A `ta` variant of `tabs` is the same
move and about as cheap. Tamil also stresses layout hardest — the DXA-05 reserve
numbers record Tamil at 860 px running 34 px short and Tamil on a phone
overshooting by 10 px, both ungated.

Two Tamil defects the audit found and deliberately left outside their items are
still open and unticketed: `metaTa` for the Panchangam Planner reading
`இதில் · Calendar தாவல்`, and the Compatibility card and Porutham hero sharing
one Tamil name (`பொருத்தம் / இணக்கம்`) for two differently-scoped tools.
Neither has an ID, so neither will be picked up.

### F8 · P2 · The owner decision that unblocks the most visible work

`DXA-09 no emoji / text glyphs as icons` is the only gate still failing in the
`tabs` phase, with a live list read straight out of the current run:

```
calendar: 📅 🗓 📍 ♉ ☀   family: 🪔 ☀ 👋 ✳ ♂ ♀   journal: 🕊
personal: ★ ⤓            calendar: ▾ ☀           family: ↻ ◇ ✎
```

It is blocked on **DXA-24**, a drawn set for 9 grahas, 12 rasis and the
panchangam limbs, which the audit is right to say an agent must not invent.
DXA-24 also blocks DXA-33 (chart artwork, deity art, calendar art — currently
1–3.6 KB placeholders and a README).

That is one owner decision gating three items and most of what makes the product
read as unfinished. **It is the highest-leverage thing on the owner's desk**, and
it should be commissioned before Wave 3 rather than discovered mid-wave.

### F9 · P3 · Document hygiene

- **`DXA-05 pending hero within 8px of loaded` is ratcheted in `MUST_PASS` but
  has no row in the §12 table.** §15 treats the table as the register; a gate
  that can fail the suite and is absent from it is invisible to a reader.
- **§12 collapses five DXA-13 gates and five DXA-41 gates into one row each**, so
  §15's instruction to key `MUST_PASS` "exactly as the gate table prints them"
  cannot be followed literally. Either split the rows or soften §15.
- **DXA-37 carries a stale self-contradiction.** The heading reads
  `[x] 2026-09-18` and the block opens "**Owner-approved 2026-09-18**" — then
  ends "`[~]` not `[x]`: a review marker is never dated without an explicit
  'approved'." Approval arrived (`11020e8`); per §15 that sentence should be
  struck with a reason, not left standing.

---

## What is genuinely excellent, and should outlive this audit

Three passages here are better engineering writing than most postmortems, and
two of them are already load-bearing rules in `CLAUDE.md`:

1. **DXA-07's "the probe was wrong in four ways, each of which passed the gate."**
   Reading a baseline after dispatching the input, `settle()` mistaken for a
   load, `documentElement.scrollHeight` on a page that scrolls an inner element,
   and no precondition. Four ways to build a green light over a broken build,
   each written down with the cost.
2. **DXA-10's "this gate could not fail, and was passing before any fix."**
   Stars paint only from dusk; the gate was run at 11:37. The response was to
   rebuild the gate *before* touching the item, add a pinned-clock phase, and make
   "not measurable" a **failure** rather than a pass.
3. **The habit of writing the blind spot next to the PASS.** "The harness pins
   `lang: en`, so this proves nothing about Tamil" appears repeatedly and is the
   single practice that stopped this file becoming a record of green ticks.

The `[~]` markers are used correctly and unflatteringly — DXA-12 at 18/71 is
sitting in the open where it belongs, and the superseded completion claims were
struck rather than deleted. That discipline is the reason this review found
process gaps rather than fiction.

---

## Recommended order

1. **Commit Wave 2** (F2) — four untracked primitives are the exposure. Backfill
   the missing commit fields on the Done lines.
2. **Full-phase harness run** (F1) — all nine phases against the current tree.
   Whatever it says becomes §12. Expect one or two surprises in `load`/`light`.
3. **Light-theme dim to 0.75** (F4) — one number, a known AA failure, plus a
   `light`-phase check so it cannot come back.
4. **Resolve §6 vs DXA-16** (F5) — either ship `--dur-press` / `--dur-exit` /
   `--ease-exit` and re-word the gate, or retire §6's exit language. Record which.
5. **Split `.ui-card--interactive`'s hover rule** (F3) so reduced-motion users
   get colour and shadow feedback.
6. **Commission DXA-24's glyph set** (F8) — owner-only, and it gates three items
   and most of the "freshness" grade.
7. **Then DXA-12 properly** — it is design work, not plumbing: 53 surfaces, a
   `.ui-pressable` class, anchor support, and hover on the primitive. It is the
   last thing standing between Wave 2 and the grade it was supposed to buy.
8. **A `ta` variant of the `tabs` phase** (F7), and IDs for the two orphaned
   Tamil defects DXA-09 found and left outside its scope.

---

### Method note

Read: the full audit, `WAVE2_REVIEW_2_2026-09-18.md`. Ran: `tsc`, `vitest`,
`eslint` on the 48 changed TS/TSX files. Re-parsed: `metrics.json` from
`ux-audit-wave2-negative`, `-after`, `-after-2…5`, `dxa14-negative2`,
`verify-tabs-postfix`, `rv-hover-final`, and every artifact folder's
`startedAt` + `phases` to build the staleness table in F1. Grepped the working
tree for each `[x]` item's named mechanism.

**Not done, and it matters:** no browser run of my own (the audit's `load`,
`today`, `sky`, `light`, `phone`, `reduced` phases are stale, and re-running
them is recommendation 2, not something to slip into a review); no production
build (DXA-35/DXA-06 remain unproven, and `next build` inside `web/` would
disturb the owner's `:3000` server); no Tamil rendering check of my own.
