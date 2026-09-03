# Handoff — muhurta score scale, Ch. XIX–XXII extraction, Tamil review

**Written 2026-08-15.** Paste this whole file to a fresh coding agent. It is
self-contained: every claim below was verified in the session that wrote it, and
file:line references were correct at that moment. **Re-check any line number
before you edit at it** — the tree is uncommitted and may have moved.

---

## STATUS — updated 2026-08-15, later the same day

| Task | State |
|---|---|
| **1 — score scale** | **DONE.** `display_score` added, both consumers fixed, thresholds re-based, 9 regression tests. See §Task 1 outcome. |
| **2 — chapter extraction** | **DONE for every chapter present in the transcription.** Eight new activities from Ch. XIX, XXII, X, XII, XVIII and Ch. III p.32. Ch. XXV / XXIX / XXXI still need printed pages 119–250, which are not in the scan. |
| **3 — Tamil review** | **STILL OPEN. Needs the astrologer, not an agent.** The list below has grown from ~30 strings to ~55 — the new ones are in §Task 3, second table. |

Gates after the work, all from `D:\sanstro`:

```
python -m pytest tests/ -q --no-cov -m no_db   => 2247 passed, 1 skipped   (was 2171)
tests/test_muhurta_api.py + test_public_tools_api.py (pg 5433) => 26 passed
ruff check on every touched file               => All checks passed!
web:    npx tsc --noEmit  => the same ONE pre-existing muhurtham-naal error, nothing new
web:    npx vitest run    => 51 files, 428 tests passed
mobile: npx tsc --noEmit  => clean;  npx jest => 6 suites, 70 tests passed
```

**Still not committed.** Nothing in this tree has been committed; that remains
its own task. **Still no browser pass** — see the last section.

---

## 0. Environment — read before running anything

- Repo root, exactly: `D:\sanstro`. Never guess it.
- **Use PowerShell.** Chain with `;`, never `&&` (PS 5.1 has no `&&`).
- No `head` — use `Select-Object -First N`.
- Do **not** put `2>&1` on a native exe (npm/npx/python). PS 5.1 wraps stderr in
  ErrorRecords and it will look like a failure when it isn't. Use `2>$null`, or
  check `$?` on the next line.
- Set `$env:PYTHONUTF8 = "1"` before any Python that touches Tamil text.
- **Never round-trip a source file through `Get-Content`/`Set-Content`** — it
  adds a BOM and mojibakes non-ASCII. Use the Edit/Write tools only.
- Test DB is port **5433** / `vinaadi_test`. Never point tests at `vinaadi_dev`
  (port 5432) — that is the real dev data.

### Baselines to beat (measured at handoff time)

```powershell
Set-Location 'D:\sanstro'
$env:JOTHIDAM_DATABASE_URL = "sqlite:///./pytest_local_test.db"; $env:PYTHONUTF8 = "1"
python -m pytest tests/ -q --no-cov -m no_db
#   => 2171 passed, 1 skipped, 947 deselected

$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
python -m pytest tests/test_muhurta_api.py tests/test_public_tools_api.py -q --no-cov
#   => 26 passed

python -m ruff check app/calculations/muhurta_engine.py app/data/ --output-format concise
#   => All checks passed!
```

- `ruff check app/ tests/` repo-wide reports ~156 findings. **That is a
  pre-existing baseline, not yours.** Only assert on the files you touch.
- `cd web; npx tsc --noEmit` reports exactly **one** error, in
  `.next/types/app/(marketing)/muhurtham-naal/page.ts`. It is pre-existing and
  unrelated (that page exports two helper functions from a Next.js page file).
  Do not try to fix it as part of this work; just confirm it is still the only one.
- `cd mobile; npx tsc --noEmit` is clean.

### State of the tree

**Nothing from the last two work sessions is committed.** The working tree holds
a large muhurta doctrine expansion (4 new data modules, 11 new activities, new
engine factors, 3 frontend surfaces, 4 worksheets) on branch
`harden/production-readiness`. Do not `git reset`, `git checkout --`, or `git
stash` anything without asking. If the user wants commits, that is its own task.

---

## TASK 1 — The score scale collapses every ranking (two live bugs) — **DONE**

### Task 1 outcome

Implemented exactly as specified below. What changed:

| File | Change |
|---|---|
| `app/calculations/muhurta_engine.py` | `display_score()` + `_DISPLAY_KNEE` / `_DISPLAY_CEIL`, at the end of the module. `score_day` still returns unclamped. |
| `app/services/muhurta_service.py` | `round(display_score(c.score), 1)` replaces the bare clamp. |
| `app/api/public_tools.py` | `_quality_label` now takes the **raw** score, maps it itself, and grades at **85 / 70**. |
| `web/components/dashboard-plan-muhurta-picker-nova.tsx` | renders `.toFixed(1)` instead of `Math.round`. |
| `tests/test_muhurta_display_scale.py` | new; 9 tests. |

Measured before → after, 90-day Chennai sweep, all 22 then-sourced activities:

* every activity's top five was `[100, 100, 100, 100, 100]`; TONSURE now reads
  `[96.2, 95.2, 94.2, 94.0, 93.6]`.
* distinct values across all 22 top-fives: **22/110 → 93/110**.
* public quality labels on a **one-week** search: `88% excellent / 9% good / 3%
  fair` → `46 / 49 / 4`. On a 14-day search: `100/0/0` → `75/25/0`.

**Two corrections to the brief below, both verified:**

1. **The mobile row in the consumer table is wrong.**
   `mobile/app/(tabs)/tools/muhurta.tsx:367,373` is `option.score` from the
   *decisions* API (`OptionAnalysis`), not a muhurta slot. The mobile muhurta
   screen renders `slot.date`, `slot.timeStart/timeEnd`, `panchangamSupport` and
   a citation line — **it never renders `slot.score` at all.** No mobile change
   was needed for this fix.
2. **Display precision is load-bearing and the brief did not say so.** The
   validated "93/110 distinct" figure holds at **one decimal**. At integer
   precision the same curve recovers only **66/110** — `Math.round` in the picker
   would have thrown away a third of the fix. Hence `.toFixed(1)`.

**Still open, deliberately: the inflation problem.** The curve restores ranking,
not calibration. The median raw day-score is 80, so a statistically average day
still displays **80**. Fixing that means recentring the whole scale and changing
every displayed number on every surface. Not done. **Owner decision.**

`packages/shared/src/utils/score.ts` was **not** touched — `scoreTone` has ~20
non-muhurta callers, and the knee at 80 is what makes touching it unnecessary.

### What was wrong

`muhurta_engine.score_day()` returns a deliberately **unclamped** score. Base is
`_W.BASE = 50.0` and factor contributions are summed on top. Over a real 90-day
Chennai sweep the usable days run from roughly 20 to **161**.

Two separate consumers then mishandle that range.

**Bug A — the signed-in picker shows a five-way tie that is not a tie.**
`app/services/muhurta_service.py:558` clamps for display:

```python
score=round(max(0.0, min(100.0, c.score)), 1),
```

Measured over 90 days with a synthetic subject: **15–29 days per activity score
above 100 raw**, and for **all 22** sourced activities the top five all clamp to
exactly `100`. The picker's entire job is ranking and at the top of the list it
communicates none. (`web/.../dashboard-plan-muhurta-picker-nova.tsx:188` clamps a
second time in the UI — `Math.min(100, Math.round(slot.score))` — so fixing only
the backend will not fix the display.)

**Bug B — the public calculator calls literally everything "excellent".**
`app/api/public_tools.py:922` calls `_quality_label(s)` on the **raw, unclamped**
score. Thresholds (`public_tools.py:793`) are `>=80 excellent`, `>=65 good`, else
`fair`. Because that route sorts and takes the top N, every result clears 80.
Measured: **110 of 110** labels across all sourced activities came back
`excellent`. On the whole sweep the spread would have been sensible (MARRIAGE:
41 excellent / 18 good / 31 fair), so the information exists — the top-N slice
throws it away.

**Neither bug was introduced by the recent doctrine work.** MARRIAGE is
untouched by it and has 25 clamped days. A new `PAKSHA` factor (max +6) made
three activities marginally worse. The defect predates all of it.

### Every consumer of this score — change none of these blindly

| Location | What it does | Assumes |
|---|---|---|
| `app/services/muhurta_service.py:558` | clamps 0–100 for the signed-in API | 0–100 |
| `app/api/public_tools.py:793,922` | `_quality_label` on the **raw** score | 80 / 65 |
| `web/components/dashboard-plan-muhurta-picker-nova.tsx:97` | `SCORE_COLOR` | 75 / 55 |
| `web/components/dashboard-plan-muhurta-picker-nova.tsx:188` | second clamp + render | 0–100 |
| `packages/shared/src/utils/score.ts` | `scoreTone`, `SCORE_THRESHOLDS = {HIGH:65, MID:45}` | 0–100 |
| `mobile/src/lib/score.ts` → `mobile/app/(tabs)/tools/muhurta.tsx:367,373` | badge colour + number | 0–100 |

`packages/shared/src/utils/score.ts` is **shared with non-muhurta surfaces.**
Changing `SCORE_THRESHOLDS` there will move colours on unrelated screens. If the
muhurta scale changes, prefer a muhurta-local mapping over editing the shared
thresholds — and grep for other `scoreTone` callers before deciding.

### DECIDED: monotonic squash — and the curve is specified, not left open

The owner confirmed monotonic squash on 2026-08-15. The curve below was designed
against the real distribution and validated; **use it rather than inventing one.**

Measured over a 90-day Chennai sweep, all 22 sourced activities, general and
personal (n = 3244 usable day-scores):

```
min -9.0   p25 60   p50 80   p75 104   p90 122   p95 130   p99 145   max 161.0
29.3% of all scores are >= 100   (they all render as an identical "100" today)
50.6% of all scores are >=  80
```

**The curve** — piecewise linear, identity below the knee:

```python
_DISPLAY_KNEE = 80.0    # below this the scale already behaves: leave it alone
_DISPLAY_CEIL = 180.0   # the raw value that maps to 100. FIXED, never observed.

def display_score(raw: float) -> float:
    """Monotonic 0-100 display mapping. Identity on [0, KNEE]; compresses
    [KNEE, CEIL] into [KNEE, 100]. Above CEIL it saturates."""
    if raw <= 0.0:
        return 0.0
    if raw <= _DISPLAY_KNEE:
        return raw
    if raw >= _DISPLAY_CEIL:
        return 100.0
    return _DISPLAY_KNEE + (raw - _DISPLAY_KNEE) * (100.0 - _DISPLAY_KNEE) / (
        _DISPLAY_CEIL - _DISPLAY_KNEE
    )
```

Why these constants: the knee at 80 leaves every value below it **byte-identical**
to today, so `SCORE_COLOR` (75/55) and `scoreTone` (65/45) keep their exact
current meaning and no unrelated screen moves. The ceiling is a **fixed** 180 —
comfortably above the observed 161 — precisely so it does not drift when a weight
or factor changes, which is the failure mode that ruled out linear rescaling.

**Validation already run** (re-run it after implementing, numbers must match):

| Property | Result |
|---|---|
| Monotonic at 0.1 display precision over raw −20…220 | **True** |
| Ties in the top five that are *artifacts of the curve* | **0** |
| Ties remaining, all with **equal raw scores** (honest ties) | 17 |
| Distinct values shown across all 22 top-fives | **22/110 today → 93/110 after** |

Example — TONSURE top five: raw `[161, 156, 151, 150, 148]` renders
`[100, 100, 100, 100, 100]` today and `[96.2, 95.2, 94.2, 94.0, 93.6]` after.

**Bug B needs a threshold re-base as well as the curve.** `_quality_label`'s
80/65 is too generous for a base-50 scale — the median raw score is 80. Measured
on the squashed scale:

| Thresholds | excellent | good | fair |
|---|---|---|---|
| 80 / 65 (today) | 51% | 19% | 30% |
| **85 / 70 (recommended)** | **24%** | **39%** | **37%** |
| 88 / 74 | 12% | 47% | 42% |

Move `_quality_label` to run on `display_score(raw)` **and** raise its thresholds
to 85/70, or the public calculator keeps calling roughly half of all days
"excellent".

### Known limitation to raise with the owner, not to fix silently

The curve restores *ranking* but does not fix *inflation*: the median raw score
is 80, so after the fix a statistically average day still displays **80**, which
reads as "very good". Correcting that means recentring the whole scale, which
changes every displayed number on every surface — a materially bigger product
change than this bug. **Do not do it as part of this fix.** Surface it, and let
the owner decide separately.

### Constraints

- **Do not change any weight in `muhurta_engine._W`, any rule table, or any
  `ActivityRules` field.** This is a presentation fix. If it changes which day
  ranks first for any activity, it is wrong.
- Keep `score_day()` itself unclamped. Its docstring
  (`muhurta_engine.py:1285-1288`) explains why: callers add dasha and hora layers
  on top, and clamping early eats them.
- Add a regression test that **fails on the current code**: assert that the top 5
  days of at least one activity have strictly decreasing displayed scores.
- Re-run the scripts in "Reproduce" below and paste before/after numbers.

### Reproduce

Write these to a scratch dir (not the repo) and run from `D:\sanstro`:

```python
# yield + clamp collapse
from datetime import date, timedelta
from app.calculations.muhurta_engine import SOURCED_ACTIVITIES, Subject, score_day
from app.calculations.panchangam import calculate_daily_panchangam
LAT, LON, TZ = 13.0827, 80.2707, "Asia/Kolkata"
S = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5)
snaps = [calculate_daily_panchangam(date(2026,6,1)+timedelta(days=i), LAT, LON, TZ) for i in range(90)]
for act in sorted(SOURCED_ACTIVITIES):
    ok = sorted((d.score for d in (score_day(s, act, S) for s in snaps) if not d.vetoed), reverse=True)
    print(act, "clamped:", sum(1 for x in ok if x >= 100), "of", len(ok), "top5:", [round(x,1) for x in ok[:5]])
```

Known-good current output: no activity is empty or thin (worst is UPANAYANAM at
48/90 usable with a subject, which is expected — its janma-tara ban covers 11 of
27 counts). So **yield is fine; only the display is broken.** Do not "fix" the
rules.

---

## TASK 2 — Extract the remaining chapters — **DONE**

### Task 2 outcome

Eight new activities, taking the sourced set from **22 to 30**. All eight are on
all three pickers, all score cleanly, none emits an `UNSOURCED` factor, and all
yield 48–80 usable days out of a 90-day Chennai sweep.

| Activity | Chapter | Pages | Module |
|---|---|---|---|
| `AGRICULTURE_START` | XIX | 100 | `app/data/kalaprakasika_agriculture_rules.py` (new) |
| `TILLAGE` | XIX | 100–102 | same |
| `SOWING` | XIX | 102–105 | same |
| `NEW_GRAIN_MEAL` | XXII | 114–115 | same |
| `MANTRA_INITIATION` | X | 61–64 | `kalaprakasika_learning_rules.py` |
| `SNAANA` | XII | 67–68 | same |
| `LYING_IN_CHAMBER` | XVIII | 99 | `kalaprakasika_lifecycle_rules.py` |
| `MILK_FEEDING` | III | 32 | `kalaprakasika_samskara_rules.py` |

Worksheet for the new module: `docs/sources/kalaprakasika_agriculture_rules.md`.
The learning, lifecycle and samskara worksheets each gained an "Update
2026-08-15" section. Tests: `tests/test_kalaprakasika_agriculture_doctrine.py`
(67 tests).

**`MILK_FEEDING` was not on the brief's list and is the pass's best find.** Ch.
III p.32 was already in the repo as two constants recorded *only* to prove which
karana clause did not belong to Annaprasana. Re-reading it showed a complete rule
set — 17 stars, a tithi ban, a weekday list, a sign ban — so it is now a full
activity. The two feeding rites stay strictly separate; Ardhra is forbidden for
the rice and merely absent for the milk.

**Findings worth an astrologer's eye, all encoded as printed and all pinned by
tests:**

1. **Ch. X reverses the book's most-repeated personal rule.** p.62 calls the
   janma / Anu-Jenma / Thri-Jenma triad **beneficial**, where six chapters
   prohibit it. **Ch. III p.32 does the same thing independently**, offering the
   10th tara as the fallback good day for the first milk feeding. Two chapters
   thirty printed pages apart. **Recorded, deliberately not scored** — the
   engine's janma-tara field is a prohibition set, and building a
   "favourable-count" field around two passages would be premature. **Owner
   decision.**
2. **Ch. X inverts the learning chapters' sign doctrine.** The previous pass's
   headline finding was that Ch. VI, VIII and XI state one sign doctrine three
   times. Ch. X sits *between* two of them and swaps the top two tiers. Encoded
   as printed — the agreement is only evidence because it is not universal.
3. **Ch. XIX contradicts itself on the tillage rising sign**, one page apart:
   p.100 calls Scorpio good, p.101 avoids it. The p.101 partition is scored,
   because p.101's own per-sign gloss sides with it ("damage to the crops by
   fire"). Both readings kept.
4. **Three more weekday inversions.** Ch. XIX p.100 names **Tuesday** auspicious
   and omits Friday; Ch. XII p.68 names **Sunday** good — the only place in the
   doctrine that does; Ch. XXII p.114 names three good days, not four.
5. **Ch. XIX p.103's karana list drops Sakunam**, where every other karana
   passage names the Sthira four plus Vishti. Not completed from neighbours.
6. **Ch. XXII p.114 reverses its own avoidance of Pisces** one clause later, on
   an attribution to Devaratha. Recorded, not applied.
7. **Ch. XIX's tillage tithi rule is the one graded conservatively.** Three of
   six excluded tithis carry a stated consequence and three do not; one boolean
   cannot say that, so it is a PENALTY and the split is declared. **Confirm.**

**Not scored, and it is the largest gap in Ch. XIX:** the chapter selects tillage
days by counting from the star the **Sun** occupies and sowing days by counting
from the star **Venus** occupies. Both are recorded in full. The engine's only
star-counting factor counts from a *subject's birth star*; pointing it at a graha
is a new factor, not a use of an existing one.

**Rites in the brief's list that are deliberately NOT activities**, because the
text gives them no rule a day-scorer can check — each has only a
days-from-birth or a required-tara rule:

| Rite | Page | Its only rule |
|---|---|---|
| First jewels | 29 | the 5th tara from the child's birth star |
| Cradling | 31 | the 10th/12th/16th/32nd day from birth |
| First outing | 32–33 | the 3rd or 4th month from birth |
| Abdhapoorthy | 35 | the birth-star day, every year |

Exposing any of them would mean an activity whose entire doctrine is invisible to
the engine. Ch. XII's **Vrutham** is excluded for a different reason: p.68 says
it follows the tonsure's rules, so cloning them under a second name would present
one rule set as two independent confirmations.

Deliberately skipped and **not** to be added without asking: Ch. II (natal, not
election), Ch. XV (predictive, not election), Ch. XIII (porutham — a separate
engine already exists), Ch. XVI Nishekam (sensitive; the user should decide).

### The one input that would move this further

**The transcription ends at printed p.118.** Ch. XXV (foundation /
Grihapravesh), XXIX (travel) and XXXI (treatment) are the three that would
convert `SPIRITUAL`, `TRAVEL` and `MEDICAL` from generic almanac to page-cited —
the last unsourced activities in the picker. **Ask the user for a scan of printed
pages 119–250.** That is still the highest-leverage single input.

### Follow the established pattern exactly

Read these first — they are the template, and the conventions in them are
load-bearing:

- `app/data/kalaprakasika_harvest_rules.py` (best recent example)
- `app/data/muhurta_activity_registry.py` (the docstring states the **severity
  grading rule**: VETO vs PENALTY is read off the source's verb, never chosen for
  convenience)
- `docs/sources/kalaprakasika_harvest_rules.md` (worksheet format)
- `tests/test_kalaprakasika_expansion_doctrine.py` (test style)

Rules that must not be broken:

1. **Never invent doctrine.** Encode only what a cited passage supports. If the
   source is ambiguous or the scan is illegible, leave the constant **empty** and
   record why. Precedent: `ANNAPRASANA_FAVOURABLE_TARA_COUNTS` is empty because
   four of ten ordinals are OCR noise.
2. **Preserve disagreements between chapters.** Do not harmonise. Ch. XX makes
   Saturday a *best* day; Ch. XXIV makes Purnima a *best* tithi. Both are real
   and both are pinned by tests.
3. **Attributed dissents ("some writers say…") are recorded, never applied.**
4. **Watch for scope traps.** A rule in the paragraph *next to* a rite is not
   that rite's rule. Two have been caught already: the milk-feeding karana clause
   misattributed to Annaprasana, and Ch. V's janma-tara ban that belongs to the
   *first shaving after* the tonsure, not the tonsure.
5. Every activity must declare `unscored_dimensions` — what the chapter covers
   that the engine cannot check. A test enforces non-empty.
6. New Tamil strings are **pending review**; list them for the user (see Task 3).
7. Add the activity to all three pickers. `tests/test_muhurta_activity_surface_parity.py`
   will fail if a picker offers something the backend would 422, and if the
   dashboard omits a sourced activity. If you add a picker whose const is not
   named `ACTIVITIES`, update `_SURFACES` in that test.

### Engine shapes available (added in the last pass — reuse, don't reinvent)

`StarGroup(tier="MIDDLING")`, `stars_exhaustive`, `paksha_preferred` +
`paksha_exempt_in_paksha`, `janma_tara_prohibited`, `karana_avoid`,
`lagna_middling`, `lagna_conditional`, `tithi_remainder_auspicious`,
`tithi_exhaustive`, `prohibited_stars_is_veto`.

Things the engine still **cannot** score, so record them as unscored: muhurta-
moment house occupancy, navamsa/vargas, ayana and solar/lunar month, days or
months from birth, day-part (forenoon/noon), nakshatra pada at the moment, and
sub-day sandhi. One near-miss: Pradhosham (Ch. XI p.66) only needs a
ghatika-to-clock conversion, since `tithi_ends_at` already exists.

---

## TASK 3 — Tamil review (needs the user, not the agent) — **STILL OPEN**

**Now ~56 strings, not ~30.** The eight new activities added 26 more, listed in
their own section at the end of this task. Everything below is unreviewed.

~30 Tamil strings were written in the last pass and have **never** been reviewed.
The user is the astrologer and approves Tamil directly in chat. **Never infer a
sign-off from "proceed"** — get explicit per-string approval or correction.

House rules that already apply: display follows **Tamil almanac usage over
Sanskrit** (enum keys stay Sanskrit); **never render a faint other-language echo**
beside a title — active language only.

Present these for correction. All live in
`app/data/muhurta_activity_registry.py`.

### Activity labels (`label_ta`)

| Key | EN | TA |
|---|---|---|
| `TONSURE` | the tonsure ceremony (Choulam) | மொட்டை அடிக்கும் சடங்கிற்கு (சூடாகர்மம்) |
| `UPANAYANAM` | Upanayanam (the thread ceremony) | உபநயனத்திற்கு (பூணூல் விழா) |
| `SEEMANTHAM` | Seemantham (the baby shower) | சீமந்தத்திற்கு (வளைகாப்பு) |
| `VIDYARAMBHAM` | Vidyarambham (learning the alphabet) | வித்யாரம்பத்திற்கு (எழுத்தறிவித்தலுக்கு) |
| `EDUCATION_START` | starting formal education | கல்வியைத் தொடங்குவதற்கு |
| `VEDA_STUDY` | beginning Veda study | வேத அத்யயனம் தொடங்குவதற்கு |
| `HARVEST` | starting the harvest | அறுவடை தொடங்குவதற்கு |
| `HARVEST_INGATHERING` | bringing the crop in | விளைச்சலைச் சேர்ப்பதற்கு |
| `GRAIN_EXPENDITURE` | drawing down the grain store | தானியத்தைச் செலவிடுவதற்கு |
| `NEW_CLOTHES` | wearing new clothes | புத்தாடை அணிவதற்கு |
| `NEW_ORNAMENT` | wearing a new gold ornament | புது தங்க நகை அணிவதற்கு |

Note the labels are written to slot into a sentence ("…is favourable **for the
tonsure**"), which is why they carry the dative `-க்கு`. If the astrologer wants
bare nouns instead, the reason-copy templates in `muhurta_engine.py` must change
with them.

### StarGroup descriptors (`what_ta`)

| Key / tier | EN | TA |
|---|---|---|
| `TONSURE` BEST | named favourable for the tonsure | மொட்டை அடிக்கும் சடங்கிற்கு உகந்ததெனக் கூறப்பட்ட |
| `TONSURE` MIDDLING | called only 'pretty good' | மொட்டை அடிக்கும் சடங்கிற்கு ஓரளவு உகந்ததெனக் கூறப்பட்ட |
| `UPANAYANAM` BEST | named excellent | உபநயனத்திற்கு மிகச் சிறந்ததெனக் கூறப்பட்ட |
| `SEEMANTHAM` BEST | named excellent | சீமந்தத்திற்கு மிகச் சிறந்ததெனக் கூறப்பட்ட |
| `SEEMANTHAM` MIDDLING | commended only by some, only when unavoidable | தவிர்க்க இயலாத சூழ்நிலையில் மட்டும் சிலரால் ஏற்கப்பட்ட |
| `VIDYARAMBHAM` BEST | named favourable | எழுத்தறிவிக்கத் தொடங்க உகந்ததெனக் கூறப்பட்ட |
| `EDUCATION_START` BEST | named most fruitful | கல்வியைத் தொடங்க மிகவும் பயனுள்ளதெனக் கூறப்பட்ட |
| `EDUCATION_START` MIDDLING | expressly neutral | கல்விக்கு நடுநிலையானதெனக் கூறப்பட்ட |
| `VEDA_STUDY` BEST | named favourable | வேத அத்யயனம் தொடங்க உகந்ததெனக் கூறப்பட்ட |
| `VEDA_STUDY` MIDDLING | expressly neutral | வேத அத்யயனத்திற்கு நடுநிலையானதெனக் கூறப்பட்ட |
| `HARVEST` BEST | named most favourable | அறுவடை தொடங்க மிகவும் உகந்ததெனக் கூறப்பட்ட |
| `HARVEST_INGATHERING` BEST | named best | விளைச்சலைச் சேர்ப்பதற்குச் சிறந்ததெனக் கூறப்பட்ட |
| `GRAIN_EXPENDITURE` BEST | named best | தானியத்தைச் செலவிடுவதற்குச் சிறந்ததெனக் கூறப்பட்ட |
| `GRAIN_EXPENDITURE` MIDDLING | called middling | தானியம் செலவிடுவதற்கு நடுத்தரமானதெனக் கூறப்பட்ட |
| `NEW_CLOTHES` BEST | named best | புத்தாடை அணிவதற்குச் சிறந்ததெனக் கூறப்பட்ட |
| `NEW_ORNAMENT` BEST | named fruitful for first wearing | புது தங்க நகையை முதன்முதலில் அணிவதற்கு உகந்ததெனக் கூறப்பட்ட |

### Two new factors' reason copy — `app/calculations/muhurta_engine.py`

- `_paksha_factor` (~line 1120): three branches — preferred fortnight, the
  exempt-opening-tithis branch, and the disfavoured fortnight.
- `_janma_tara_count_factor` (~line 1092): the veto sentence, plus the named
  counts **ஜென்ம / அனுஜென்ம / த்ரிஜென்ம** (Jenma / Anu-Jenma / Thri-Jenma). Confirm
  those three transliterations especially.

### Five dropdown group headings — `web/components/dashboard-plan-muhurta-picker-nova.tsx:~41`

`குடும்ப நிகழ்வுகள்` · `கல்வி` · `செல்வம் & சொத்து` · `இல்லம் & அறுவடை` ·
`பொது பஞ்சாங்கம்` (the first four are suffixed `· கலப்பிரகாசிகை`).

### NEW 2026-08-15 — the eight new activities' Tamil (26 strings)

Activity labels (`label_ta`, in `app/data/muhurta_activity_registry.py`). Same
dative `-க்கு` convention as above, because they slot into the same sentence.

| Key | EN | TA |
|---|---|---|
| `MILK_FEEDING` | the first feeding on milk | பால் ஊட்டத் தொடங்குவதற்கு |
| `LYING_IN_CHAMBER` | arranging the lying-in chamber | பேறுகால அறையை ஏற்பாடு செய்வதற்கு |
| `MANTRA_INITIATION` | initiation in a mantra | மந்திர உபதேசம் பெறுவதற்கு |
| `SNAANA` | the Samavarthanam bath (Snaana) | சமாவர்த்தன ஸ்நானத்திற்கு |
| `AGRICULTURE_START` | first setting foot on the land for the season's work | நிலத்தில் வேளாண் பணியைத் தொடங்குவதற்கு |
| `TILLAGE` | ploughing the field | நிலத்தை உழுவதற்கு |
| `SOWING` | sowing seed | விதைப்பதற்கு |
| `NEW_GRAIN_MEAL` | the first meal of the new grain | புதிய தானியத்தை முதன்முதலில் உண்பதற்கு |

StarGroup descriptors (`what_ta`), same file:

| Key / tier | EN | TA |
|---|---|---|
| `MILK_FEEDING` BEST | named best for the first feeding on milk | பால் ஊட்டத் தொடங்க உகந்ததெனக் கூறப்பட்ட |
| `LYING_IN_CHAMBER` BEST | named best for arranging the lying-in chamber | பேறுகால அறையை ஏற்பாடு செய்வதற்குச் சிறந்ததெனக் கூறப்பட்ட |
| `MANTRA_INITIATION` BEST | named most fruitful for beginning to learn a mantra | மந்திரம் கற்கத் தொடங்க மிகவும் பயனுள்ளதெனக் கூறப்பட்ட |
| `SNAANA` BEST | named good for the Samavarthanam bath | சமாவர்த்தன ஸ்நானத்திற்கு உகந்ததெனக் கூறப்பட்ட |
| `AGRICULTURE_START` BEST | named best for the owner's first entry onto the land | நிலத்தில் முதன்முதலில் கால் பதிக்க உகந்ததெனக் கூறப்பட்ட |
| `TILLAGE` BEST | named beneficent for ploughing | நிலத்தை உழ உகந்ததெனக் கூறப்பட்ட |
| `SOWING` BEST | named most fruitful for sowing | விதைப்பதற்கு மிகவும் பயனுள்ளதெனக் கூறப்பட்ட |
| `SOWING` MIDDLING | called middling for sowing | விதைப்பதற்கு நடுத்தரமானதெனக் கூறப்பட்ட |
| `NEW_GRAIN_MEAL` BEST | named most fruitful for the first meal of the new crop | புதிய விளைச்சலை முதன்முதலில் உண்ண மிகவும் பயனுள்ளதெனக் கூறப்பட்ட |

Dashboard picker rows (`web/components/dashboard-plan-muhurta-picker-nova.tsx`).
These are **bare nouns**, not dative — a dropdown row, not a sentence fragment:

| Key | EN | TA |
|---|---|---|
| `MILK_FEEDING` | First feeding on milk | பால் ஊட்டத் தொடங்குதல் |
| `LYING_IN_CHAMBER` | Arranging the lying-in chamber | பேறுகால அறை ஏற்பாடு |
| `MANTRA_INITIATION` | Mantra initiation / Upadesam | மந்திர உபதேசம் |
| `SNAANA` | Samavarthanam bath / Snaana | சமாவர்த்தன ஸ்நானம் |
| `AGRICULTURE_START` | Starting work on the land | வேளாண் பணியைத் தொடங்குதல் |
| `TILLAGE` | Ploughing the field | நிலத்தை உழுதல் |
| `SOWING` | Sowing seed | விதைத்தல் |
| `NEW_GRAIN_MEAL` | First meal of the new grain | புதிய தானியத்தை உண்ணுதல் |

One new dropdown group heading, beside the five above:
`வயல் & விதைப்பு · கலப்பிரகாசிகை` ("Field & sowing · Kalaprakasika").

**Specific things worth the astrologer's attention:**

* **`SNAANA` and `MANTRA_INITIATION` are transliterations, not translations.**
  Is சமாவர்த்தன ஸ்நானம் the right almanac usage, or is a Tamil word preferred?
  Likewise மந்திர உபதேசம் — உபதேசம் is the term I expect a Tamil almanac to use
  for initiation, but that is an assumption, not a check.
* **`LYING_IN_CHAMBER`** — பேறுகால அறை is a description rather than a customary
  term. If there is an almanac word for the Soothika-Griham, it should replace
  this.
* **`AGRICULTURE_START`** — the English is deliberately long ("first setting foot
  on the land") because that is what Ch. XIX describes. The Tamil compresses it.
  If the compression loses the "first footstep" sense, say so.
* `SNAANA` reuses `NAMING_CEREMONY`'s conditional-lagna sentence verbatim, so it
  is **not** a new string and is not listed above.

**A guard already exists and must stay green:** every scored Tamil reason string
is asserted to contain no Latin run of 3+ characters on the unlabelled subject
path (`tests/test_muhurta_engine.py`,
`tests/test_kalaprakasika_expansion_doctrine.py`). If a correction introduces a
Latin word into Tamil copy, those fail — that is intended.

---

## Also outstanding (not tasks, but do not lose them)

- **Browser pass still never done, and there is now more to look at.** The
  dashboard dropdown is a **6-group, 37-option** grouped select (was flat 17,
  then 5-group/29). The score now renders with a **decimal point** — `96.2`
  where it used to say `100` — which is a visual change nobody has seen. Day
  cards carry a factor list with citations. The mobile chip row went from 17
  chips to 25 and will wrap further. **None of this has been opened in a
  browser.** This repo's history is that visual defects pass every automated gate
  and only fall out of a screenshot.
- **Mobile jest and web component tests HAVE now been run** (6 suites / 70 tests,
  and 51 files / 428 tests, both green) — that item from the last pass is closed.
- **The mobile picker is a curated subset and still omits six sourced
  activities** that predate this pass: `TREASURE_STORE`, `LAND_POSSESSION`,
  `VEDA_STUDY`, `GRAIN`, `GRAIN_EXPENDITURE`, `HARVEST_INGATHERING`. All eight
  new ones were added, so the gap is now purely historical. Nothing fails
  because of it — `test_the_dashboard_offers_every_page_cited_activity` only
  guards the dashboard — but it is an inconsistency someone should decide on.
- **The Oordhwa-Mukha table is still not wired to marriage**, and the Ch. XIX–XXII
  pass did not change that. Marriage scoring is byte-identical to before this
  work: `MARRIAGE` is the one activity the engine scores by its own branch rather
  than the registry, and nothing in this pass touched that branch.
- `GRAIN_EXPENDITURE` has **four stars named by neither tier** (Ch. XX p.108's
  "remaining asterisms (Aslesha and Magha)" lists two of six). Held in
  `GRAIN_EXPENDITURE_UNACCOUNTED_STARS`, awaiting a clean page image. Do not
  guess them.
- The **Oordhwa-Mukha** class table (Ch. XX p.107) is recorded but deliberately
  **not** wired to marriage, because Ch. XIV also names Atho-Mukha and
  Thiryag-Mukha and neither is defined in the transcribed pages. Wiring one third
  of a three-way classification would score some marriage days on a rule the
  others cannot be judged by. **Marriage scoring must stay byte-identical.**
