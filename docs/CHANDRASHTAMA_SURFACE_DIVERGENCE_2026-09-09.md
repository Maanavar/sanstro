# Chandrashtama: four surfaces, three different questions

**Raised:** 2026-09-09 by the owner (Dhanusu rasi / Moolam nakshatram).
**Report:** "Today the almanac says Chandrashtamam is for Pooradam. The Today
hero shows me nothing, but the Family & Charts member card and Today's Rhythm
both say I am in Chandrashtamam."

**Status:** ruled and fixed the same day — see §6 — then corrected three times
as the ruling was tested against the almanac: §11 (a star spanning two rasis is
two audiences), §13 (a window names one day, and which day is the உதய rule).
**§13 is the standing rule; read it before changing anything here.** Owner
ruling: a person's Chandrashtama is their janma **star's** window (~1 day), not
the Moon's full 2¼-day transit of the 8th rasi.

**The title undercounts: there were seven.** §15 found two surfaces never on any
of these rulings, and completing that audit in §16 found a third. All are now on
one primitive, `is_chandrashtama_day`, and verified across 365 days x 36
star-and-rasi halves with **zero** divergence. §4's closing paragraph also
carried a wrong claim about scoring until 2026-09-10; the correction there is the
answer to "does this touch the numbers?".

**§16 carries the governing distinction — read it before adding any surface:**
Chandrashtama has two registers, and every defect in this document is one boolean
answering both. The CONDITION (Moon in the 8th rasi, ~2¼ days, graded by the
day's share) and the PROHIBITION (சந்திராஷ்டம நாள், the day the almanac names for
one star, ~1 day, binary). Decide which register a new surface belongs to before
writing the test; a surface needing both carries both, as the Muhurtham Naal
picker does.

**Note on the numbers below.** §1's window table was corrected after D6 was
found: the times this engine had been printing were themselves wrong by hours.
The table shows the true values.

---

## 1. The astrology, established first

Chandrashtama = transiting Moon in the 8th rasi from natal Moon rasi.
Dhanusu (9) → 8th = **Kadagam (4)**.

The Moon's Kadagam transit this cycle (Chennai 13.0827 / 80.2707, IST),
computed from this repo's own ephemeris:

| | |
|---|---|
| Moon enters Kadagam | **07-Sep 12:38** |
| Moon leaves Kadagam | **09-Sep 15:14** |
| Duration | ~2 d 2 h 36 m |

A Tamil almanac does not print "Dhanusu" across those 2¼ days. It splits the
stretch by **janma nakshatram**, because the affected point — the longitude
210° behind the Moon — walks Kettai → Moolam → Pooradam → Uthiradam at the
Moon's own rate, roughly one star per day:

| Affected janma star | True window (IST) | What the engine printed |
|---|---|---|
| Kettai (Vrischikam) | … → 07-Sep 12:38 | → 07-Sep 12:38 |
| **Moolam (Dhanusu)** | **07-Sep 12:38 → 08-Sep 11:02** | 08-Sep 00:00 → **16:39** |
| Pooradam (Dhanusu) | 08-Sep 11:02 → **09-Sep 09:34** | → 09-Sep **15:14** |
| Uthiradam (Makaram) | 09-Sep 09:34 → 10-Sep 08:20 | 10-Sep 00:00 → 14:04 |

The third column is D6 (§3): every boundary was late, and Moolam's opening on
the afternoon of the 7th was missing altogether. Both are fixed.

**So the owner's almanac is right, and this engine already agrees with it.**
`calculate_daily_panchangam(2026-09-09, …).chandrashtamam_today_nakshatras`
returns exactly `('POORADAM',)`. Moolam's window closed yesterday at 11:02
(the engine said 16:39 — that is D6, below).

Verdict on the report: **the Today hero is correct today and Family & Charts is
wrong** — but the hero is correct by accident, for a reason unrelated to the
nakshatra. It would show the same blank to a Pooradam native today, on the one
day the almanac names them.

---

## 2. Why the surfaces disagree

Three different questions are being asked of the same fact.

### Question A — "was the Moon in the 8th rasi for *most of the solar day*?"

`app/services/daily_guidance_service.py:437-449`

```python
moon_score, chandrashtama_fraction = weighted_moon_score(...)
chandrashtama = chandrashtama_fraction >= 0.5
```

`weighted_moon_score` (`app/services/_dg_scoring.py:571-603`) takes
`limb_fraction(moon_rasi_spans, …)` over **sunrise → next sunrise**.

Today, Dhanusu's share = **0.384** (Kadagam 06:01 → 15:14 out of a 24 h 00 m
solar day) → below the 0.5 gate → `isChandrashtama: false`.

Consumers: the **Today hero pill**
(`web/components/dashboard-today-tab-nova.tsx:817`), week-ahead
`chandrashtamaDays`, the daily push cron, the journal mood correlation.

### Question B — "is the Moon in the 8th rasi at *this instant*?"

`app/services/transit_service.py:91`

```python
chandrashtama = is_chandrashtama(natal_moon_rasi, moon_position.rasi)
```

The instant is **local solar noon** — `family_vault_service.py:269, 417, 502`
pass `solar_noon_utc`, and `/gochar/current` called with a `date` resolves to
`local_noon_as_utc_for_profile` (`transit_service.py:107-114`). At 12:00 today
the Moon is still in Kadagam (it leaves at 15:14) → **true**.

Consumers: **Family & Charts member card** (`CHANDRASHTAMA` tag,
`web/lib/family-flags.ts:96`), **Today's Rhythm** `careMembers`
(`dashboard-family-charts-hybrid.tsx:952`), and — note — the **Gochar
Chandrashtama card in the Today tab's own deep dive**
(`dashboard-today-deepdive-extras-nova.tsx:370`).

### Question C — "which janma *star* does the 8th rasi fall on right now?"

`app/calculations/panchangam.py:1533-1577`

```python
def _chandrashtamam_janma_nakshatra_name_at_jd(jd):
    janma_longitude = normalize_longitude(_nakshatra_angle_at_jd(jd) - 210.0)
    return NAKSHATRA_NAMES[nakshatra_from_degree(janma_longitude) - 1]
```

This is the almanac reckoning, and it is correct. **It is never matched against
any user's own natal Moon nakshatra.** It reaches the UI only as an impersonal
list on the Panchangam/Calendar surfaces, and as the subtitle of a card whose
*visibility* is decided by Question B.

---

## 3. Defects

### D1 — Two personal flags, two different questions, guaranteed to diverge

A ≥0.5-of-solar-day gate and a noon point-sample disagree on **every day the
Moon changes rasi** — about 2 days in 9 for any given user, i.e. every
chandrashtama stretch has at least one contradicting day at each end.

Worked both ways this week for Dhanusu:

| Date | Day share | Hero (A) | Noon sample (B) | Agree? |
|---|---|---|---|---|
| 07-Sep | 0.724 | **true** | false (Moon in Mithunam at noon) | ✗ |
| 08-Sep | 1.000 | true | true | ✓ |
| **09-Sep** | **0.384** | **false** | **true** | **✗ ← reported** |
| 10-Sep | 0.000 | false | false | ✓ |

Note 07-Sep inverts the same bug: the hero flagged a day the member card did not.

### D2 — The Today tab contradicts itself, on one screen

The hero pill (A) and the deep-dive Gochar card (B) are on the same page and
read different fields. Right now the pill is absent while the card below it is
present — and the pill, when it does render, is an anchor to that very card
(`href="#nova-deep-dive"`). Whatever ruling comes out of §4, these two must read
one field.

### D3 — Neither personal flag is nakshatra-aware

Both A and B are rasi-granular, so both are necessarily wrong for 2 of the 3
stars in a rasi on any given day of the stretch:

- A Moolam native (this report) is flagged by B on **Pooradam's** day.
- A Pooradam native gets **no hero pill today** — same 0.384 share — on the one
  day the almanac prints their star.

### D4 — `ChandrashtamaCard` contradicts its own printed numbers

`web/components/dashboard-personal-shared.tsx:60` renders `windowsSummary`,
built by `formatChandrashtamaWindowSummary` from the Question-C windows. For
this owner today the card asserts Chandrashtama and then prints
**"Pooradam 00:00 – 15:14"** underneath — someone else's star. Same shape as the
recorded `explanation-must-match-its-own-numbers` rule.

### D6 — the window boundaries were searched on the wrong grid

Found while preparing the fix, and the reason §1's table needed correcting.

The affected point is `Moon − 210°`, and **210° is 15.75 nakshatras** — not a
whole number. So the affected star turns over on a grid sitting 10°, three
padas, away from the Moon's own nakshatra grid. The walk stepped on the Moon's
nakshatra (13°20′) and rasi (30°) boundaries and read the affected star's name
at the *start* of each step, so the reported name stayed stale until the next
coarse step.

Measured against 5-minute sampling of `nakshatra(Moon − 210°)`:

| Handover | True | Reported | Error |
|---|---|---|---|
| Moolam → Pooradam | 08-Sep 11:02 | 08-Sep 16:39 | +5 h 37 m |
| Pooradam → Uthiradam | 09-Sep 09:34 | 09-Sep 15:14 | +5 h 40 m |
| Uthiradam → Thiruvonam | 10-Sep 08:20 | 10-Sep 14:04 | +5 h 44 m |

Harmless while the windows were decoration on an almanac page. Not harmless
once the personal flag is keyed to them.

### D5 — `_chandrashtamam_janma_nakshatra_windows` truncates the day

`app/calculations/panchangam.py:1539-1577` is passed the Moon's rasi at the
panchangam's reference moment (sunrise) and walks only while
`current_moon_rasi == moon_rasi_number`, `break`ing once it has left. On any
rasi-change day the rest of the civil day is silently dropped:

- **07-Sep** lists only `('KETTAI',)` 00:00→12:38. **Moolam's window opens at
  12:38 that day and appears nowhere.**
- **09-Sep** lists only `('POORADAM',)` 00:00→15:14. Uthiradam from 15:14 is dropped.

Second defect in the same function: the windows are bounded by the **civil day**
(`_civil_day_bounds_jd`, 00:00→00:00) while Question A's share is bounded by the
**solar day** (sunrise→sunrise). Three day-definitions inside one feature.

`tests/test_panchangam.py:477-481` asserts only that windows exist, are ordered,
bracket sunrise, and carry real nakshatra names — none of which the truncation
violates. That is why it has survived since v24.

---

## 4. The ruling needed

§4.11 of the frozen spec
(`docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md:801-813`),
verbatim:

> Chandrashtama occurs when the transiting Moon is 8th from natal Moon Rasi.
> This platform freezes the Tamil Thirukanitham standard as **rasi-based, not
> nakshatra-count based**. Do not compute Chandrashtama as the 8th nakshatra from
> Janma Nakshatra; Janma Nakshatra, Anujanma, and Trijanma remain separate
> nakshatra-based checks.

**This does not block the almanac reckoning, and that is the key point.** What
§4.11 forbids is the *count* rule — janma nakshatra + 8, an offset of 106°40'.
Question C is not that. It is the identical 210° offset §4.11 mandates, merely
resolved at nakshatra granularity instead of rasi granularity. The star window
is a strict sub-interval of the rasi window. Adopting it is a refinement of
§4.11, not a reversal of it.

So the ruling is about **duration**, not about method:

- **Option 1 — rasi span (~2¼ days/cycle).** Every Dhanusu native flagged
  07-Sep 12:38 → 09-Sep 15:14. Literal §4.11.
- **Option 2 — star window (~1 day/cycle).** Moolam 07-Sep 12:38 → 08-Sep 16:39;
  Pooradam 08-Sep 16:39 → 09-Sep 15:14. What the printed panchangam says, and
  what a reader who checks their star expects.
- **Option 3 — rasi flags, star window ranks.** Flag on for the full rasi span,
  with the reader's own star window called out as the peak inside it.

**Owner ruled Option 2** on 2026-09-09.

Implementation note: the flag is keyed to the star standing **at sunrise** (the
உதய rule), not to "does my star's window touch this day". That is what gives
each star exactly one day, which is the property an almanac reader relies on —
and it is verified as a property, not assumed, in
`test_chandrashtamam_sunrise_star_gives_each_star_exactly_one_day`.

The *moon-score* penalty is deliberately left on the rasi share. §4.11's graded
`-25 × share` is a defensible reading of the classical rule, and moving it would
change every user's daily number — a separate decision, not a bug fix.

**Correction (2026-09-10).** This paragraph used to end "Only the display/alert
boolean moved, which is what the code comment beside it always said it was for."
That was wrong, and wrong from §6 onward. The boolean is not display-only —
audited while answering "does this touch scoring?":

| Reader of the boolean | Effect |
|---|---|
| `daily_guidance_service.py:693` | `personal_safety_score -= 15` → weight 0.09 → **−1 point of 100** |
| `daily_guidance_service.py:753` | `GOOD` / `STRONG_SUPPORT` are clamped to **`BALANCED`** |
| `activity_timing_rules.py:709` | every `SUPPORTS` activity is demoted to **neutral** — the favourable column empties |
| `chandrashtamaDays`, push cron, journal mood correlation | all read the same flag |

The `-25 × share` term is untouched and byte-identical (it reads
`moon_rasi_spans`, which no ruling here has changed). Everything else in the
table moves whenever the badge moves. The honest statement is that the badge
carries a small score penalty and two large **qualitative** effects, and the
2026-09-09/10 rulings changed which days receive them — from 23.5 days per
star-and-rasi half per year under §10 to **13.7** under §13.

---

## 6. What shipped

| File | Change |
|---|---|
| `app/calculations/astro.py` | New primitives beside `is_chandrashtama`: `chandrashtama_janma_angle` / `chandrashtama_janma_nakshatra`, with the 15.75-nakshatra trap documented at the definition. |
| `app/calculations/panchangam.py` | D5+D6: the windows are now produced by `limb_spans_between` over a new `"chandrashtama_janma_nakshatra"` limb whose boundary search uses the *shifted* angle — so the grid can no longer drift from the value — and cover the civil day end to end. New persisted scalars `chandrashtamam_affected_janma_nakshatra_number` / `_name` (the star at sunrise). Cache version 43 → **44**. |
| `app/services/daily_guidance_service.py` | D3: the badge is now `affected star at sunrise == janma nakshatra`, replacing `chandrashtama_fraction >= 0.5`. Falls back to the old gate for a pre-v44 cached snapshot. |
| `app/services/transit_service.py` | D1+D2: `_chandrashtama_on_local_day` replaces the solar-noon rasi sample and asks the identical question, sampling sunrise. Polar no-sunrise dates fall back to §4.11 at noon. |
| `tests/test_panchangam.py` | Three regression tests: full-day tiling (the 07-Sep truncation), boundaries on the affected-star grid (the 08-Sep 11:02 handover), and one-star-per-day handover across a six-day stretch. |

**No frontend change was needed, and none was made.** Both backend fields now
answer the same question, so the four web call sites that read them — the hero
pill, the deep-dive Gochar card, the family member card and Today's Rhythm —
agree without being touched. `memberIsChandrashtama` ORs the transit flag with
the vault's `CHANDRASHTAMA` tag; both derive from the corrected fields.

`TransitSnapshotData.is_chandrashtama` keeps its name and shape but its
semantics tighten from "Moon in the 8th rasi at the instant you asked" to
"today is this chart's Chandrashtama". Mobile already read the daily-guidance
field (`mobile/app/(tabs)/today.tsx:138`), so it inherits the fix.

### Verified

```
date         sunrise star (names the day)   Moolam?   Pooradam?
2026-09-07   KETTAI                         False     False
2026-09-08   MOOLAM                         True      False     <- owner's day
2026-09-09   POORADAM                       False     True      <- reported day
2026-09-10   UTHIRADAM                      False     False
2026-09-11   THIRUVONAM                     False     False
```

Engine and calculation suites — `test_panchangam`, `test_calculations`,
`test_chandrashtama_end`, `test_intraday_panchangam_spans`, `test_panchangam_api`
— **240 passed**.

API and service suites over both changed flags — `test_transits_api`,
`test_transits_calculations`, `test_daily_guidance_api`, `test_family_vaults_api`,
`test_astrology_shared_rules`, `test_muhurta_engine`, `test_chandrashtama_end`
— **132 passed**.

Ruff clean on all five changed files. Separately verified that the two code
paths sample the identical sunrise Moon longitude across 60 consecutive days
(0 divergences) — the property D1 depends on, and the one that lets the four
web call sites stay untouched.

Local runs are not authoritative here; CI is.

### Left open

- ~~**Three day-definitions in one feature.**~~ **Closed in §13**: the windows
  are now solar-day bounded like every other span list, and the badge asks which
  day a window names. The note below it — "worth a ruling before anything else
  keys off the window edges" — was right, and the badge started keying off them
  four sections later.
- ~~**`chandrashtamam_affected_janma_rasi_number`**~~ **Ruled in §13**: kept as
  the day's almanac headline, paired with the sunrise star, and asserted to be
  the first window rather than a second derivation of the same fact.
- ~~**D4** — the card still prints every star of the day rather than the
  reader's own.~~ **Closed** in a follow-up the same day; see §7.
- **`muhurtham_naal_service.py:363`** computes its own `is_chandra` and was not
  touched. Check it against this ruling before the next muhurtham change.

---

## 5. Reproduction

```powershell
Set-Location 'D:\sanstro'
$env:PYTHONUTF8 = "1"; $env:PYTHONIOENCODING = "utf-8"
```

```python
from datetime import date
from app.calculations.panchangam import calculate_daily_panchangam
from app.calculations.astro import chandrashtama_rasi_from_janma
from app.services._dg_scoring import limb_fraction

for d in (date(2026, 9, 7), date(2026, 9, 8), date(2026, 9, 9), date(2026, 9, 10)):
    p = calculate_daily_panchangam(d, 13.0827, 80.2707, "Asia/Kolkata")
    share = limb_fraction(p.moon_rasi_spans, lambda s: s.number == chandrashtama_rasi_from_janma(9))
    print(d, p.chandrashtamam_today_nakshatras, f"{share:.3f}", share >= 0.5)
```

```
2026-09-07 ('KETTAI',)                 0.724 True
2026-09-08 ('MOOLAM', 'POORADAM')      1.000 True
2026-09-09 ('POORADAM',)               0.384 False
2026-09-10 ('UTHIRADAM', 'THIRUVONAM') 0.000 False
```

No personal data is used: Dhanusu rasi is passed as the bare rasi number 9.

---

## 7. Follow-up: D4 closed

The badge was fixed in §6, but `ChandrashtamaCard` still printed its subtitle
from the day's whole star list. On a handover day that list holds two stars, so
the card could still assert "Chandrashtama is active" to a reader and then name
a star they were not born under — the original complaint in miniature, one
heading further down the page.

The client does not need the natal chart to fix this. The card renders only on
the reader's own day, and the day belongs to the star standing at sunrise, so
that star **is** theirs. Exposing it is enough.

| File | Change |
|---|---|
| `app/schemas/panchangam.py` | `chandrashtamamToday` gains `affectedJanmaNakshatraNumber` / `Name`. Additive with defaults — no existing consumer changes behaviour. |
| `app/services/panchangam_service.py` | Populated from the v44 snapshot scalars. |
| `packages/shared/src/types/index.ts` | Both fields added, optional (absent on a pre-v44 cached snapshot). |
| `web/components/dashboard-calendar-shared.tsx` | New `formatOwnChandrashtamaWindow` beside the existing list formatter; returns `""` when the star is unknown so callers fall back rather than render an empty alert. |
| `web/components/dashboard-personal-shared.tsx` | `ChandrashtamaCard` takes `ownWindowSummary` and prefers it — "Your star: Pooradam 00:00 - 09:34" instead of the day's list. |
| `web/components/dashboard-today-deepdive-extras-nova.tsx`, `dashboard-family-charts-hybrid.tsx` | Both call sites pass it. |

The family call site carried a comment asserting that the affected janma rasi
"is the same for everyone in the vault, so these windows are correct for the
member being read". True of the rasi, and the ruling makes it misleading — a
rasi holds 2¼ stars and they no longer share a day. Corrected in place rather
than left for the next reader to inherit.

Verified: `dashboard-calendar-shared.test.tsx` — 11 passed (3 new, covering the
two-star handover day, the pre-v44 fallback, and a star absent from the day).
`tsc --noEmit` clean, ruff clean.

### Still open after this

- The muhurtham-naal avoid rule (§6) — a decision, not a defect.
- The 00:00 window edge (§6).

---

## 8. D7 — the end time never migrated with the badge

Found while reviewing what else the ruling touched, and it is the same mistake
as the §6 cache bump: a field was moved and the thing sitting beside it was not.

`chandrashtama_end` still read `moon_rasi_spans` — when the Moon leaves the 8th
**rasi** — while the badge had moved to the star window. Measured at Chennai:

| Day | Belongs to | Their star window ends | `chandrashtamaEnds` said |
|---|---|---|---|
| 08-Sep | Moolam | **11:02** | `None` → "Extra care advised today." |
| 09-Sep | Pooradam | **09:34** | **15:14** |

So a Pooradam native was told their Chandrashtama ran 5 h 40 m past its actual
close, and a Moolam native was told to take care all day when it lifted at 11:02.

Web was partly shielded by §7 — the card leads with `ownWindowSummary` and only
falls back to the end label. **Mobile was not**: `mobile/app/(tabs)/today.tsx:139`
and `mobile/app/chandrashtama.tsx:78` render this field directly as *the* end
time, with no window line to fall back on.

### Fixed

| File | Change |
|---|---|
| `app/services/_dg_scoring.py` | `chandrashtama_end` takes `janma_nakshatra` and reads `chandrashtamam_janma_nakshatra_windows`. The 2026-09-01 clipping guard is kept in the same shape — the window list is civil-day bounded, so a window still running at midnight must report `None`, not "ends 00:00". `_chandrashtama_rasi_spans` had no other caller and was removed. |
| `app/services/daily_guidance_service.py` | Passes `janma_nakshatra` (already in scope) instead of `natal_moon.rasi`. |
| `app/services/_dg_cache.py` | Engine v11 → **v12**. `chandrashtamaEnds` is persisted, so a row written under v11 pairs a correct badge with a stale time. |
| `app/schemas/daily_guidance.py`, `packages/shared/src/types/index.ts` | Both comments described the rasi basis and told callers null was the *normal* answer. Under a ~1-day window that inverts: a real time is now normal, null the exception. Corrected on both sides rather than left to mislead. |
| `tests/test_chandrashtama_end.py` | Rewritten against the star window. Keeps the `chandrashtama_rasi_for` tests — the ruling left the SCORE on the rasi share, so that rule is still live — and keeps the 2026-09-01 clipping case, which carries over unchanged. |

Note the inversion this creates for callers: null used to mean "a normal middle
day of a long stretch" and now means "your window outlasts the civil day". Both
comments say so; neither should be trimmed to just "may be null".

### Verified

```
2026-09-08  badge belongs to MOOLAM
   MOOLAM    badge=True  ends=11:02
   POORADAM  badge=False ends=None
2026-09-09  badge belongs to POORADAM
   MOOLAM    badge=False ends=None
   POORADAM  badge=True  ends=09:34
```

---

## 9. The two open decisions, ruled

Both were put to the owner on 2026-09-09 and answered the same day.

### Muhurtham picker: the star window vetoes, the rasi span cautions

Picking a date is not the same act as reading today's dashboard — a wedding is
chosen once — so the wider rasi transit keeps a voice, but only the reader's own
star window can knock a date out of "recommended".

| Case | Score | Vetoes "recommended"? | `isChandrashtama` |
|---|---|---|---|
| The reader's own star window | −40 | yes | true |
| Moon in their 8th, day belongs to another star | **−10** | **no** | false |
| Neither | — | no | false |

Before this, all 2¼ days of the transit were a hard veto, so the picker marked
three dates "Chandrashtama for you, avoid" where the dashboard badged one.

Two implementation notes worth keeping:

- The reason strings now name the **star** ("Chandrashtama for your star Moolam
  — avoid"), not "your birth sign". Under this ruling the sign no longer decides
  it, and copy that still said "sign" would re-teach the thing we removed.
- Where a chart has no activity location there is no panchangam, so no star to
  read. That case **falls back to the old rasi veto** rather than clearing the
  date: for an avoidance rule the fail-safe direction is toward the doctrine.

`_panchangam_by_date` was split out of `_computed_nalla_neram_by_date` so one
batched range call feeds both. Two range calls over the same dates would have
doubled the ephemeris work and could have disagreed.

### Learn article: name both durations

`/learn/what-is-chandrashtama` said Chandrashtama "lasts about 2.5 days" in
three places. Not false — that is the rasi transit, and §4.11 still says so —
but the app now badges about a day, so a reader moving from article to dashboard
saw the product contradict its own explainer.

Both durations are now named, in both languages: the sign transit runs ~2.5
days, a Tamil almanac names one birth star per day within it, so the window that
is yours is about a day of those 2.5.

The visible copy lives in `web/lib/marketing-i18n/learn-chandrashtama.ts`, not
in `page.tsx` — editing only the page metadata would have left the on-page lead
still saying 2.5 days. Metadata, OpenGraph, the FAQ schema answer and the
bilingual body were all updated. File re-checked for BOM afterwards (none), per
the repo's UTF-8 rule.

`/tools/chandrashtama` was checked and deliberately left alone: it is a
rasi-only educational lookup with no dates and no personal day, so it
contradicts nothing.

### Verified

`tests/test_muhurtham_naal.py` — 14 passed, ruff clean, `tsc` clean.

Two test defects were found and fixed while adding coverage, both mine:

1. The existing Nalla Neram test stubbed snapshots with a `SimpleNamespace`
   carrying only `nalla_neram`. The stub was incomplete, not the code — real
   snapshots always carry the field (dataclass default) — so the fake was
   extended rather than the production read weakened to `getattr`.
2. My first draft of the new tests filtered dates by star *name*
   (`{"Moolam", "Pooradam", "Uthiradam"}`) on the assumption that all three sit
   in Dhanusu. **Uthiradam is rasi 10 (Makaram) in this sheet** — only its first
   pada is Dhanusu — so the filter swept in dates that were never in the
   reader's 8th and the test failed against correct code. Now keyed off
   `moon_rasi_number`, which is the fact the rule actually reads.

### Still open

- ~~The 00:00 window edge (§6)~~ — closed in §13, along with the rest of D11.

---

## 10. D8 — the sunrise rule silently skipped stars

Found by auditing the ruling rather than the code: §6 asserted one-star-per-day
as a property and verified it over **six days**. Nothing guarantees it.

A star window is 13°20′ of Moon motion. The Moon runs 11.76–15.4°/day, so the
window is **20.8 h at its shortest and 27.2 h at its longest** — against a 24 h
day. Two things follow, and both happen:

- A window longer than 24 h straddles two sunrises → that star owns two days.
- A window shorter than 24 h can fall **entirely between two sunrises** → that
  star owns **no day at all**, and its natives are never warned.

Measured over all 365 days of 2026 at Chennai under the sunrise rule:

| | |
|---|---|
| Stars skipped outright | **11** |
| Stars owning two consecutive days | 15 |
| Badged days per star across the year | 11 to 17, not ~13.5 |

Pooradam had no badged day around **06-Jan** or **19-Jun 2026**. Moolam — the
reporting owner's own star — was skipped around **29-Nov**.

### The rule is overlap, not sunrise

A printed almanac never loses a star. It prints "Moolam until 11:02, Pooradam
from 11:02", and a native whose star is named for *any part* of the day observes
it. So the badge asks whether the reader's star appears in the day at all.

This stays inside the owner's ruling: the duration is still about a day. It
simply touches two dates when it straddles a midnight, which is what the almanac
shows — and `chandrashtamaEnds` plus the card's window line carry the exact
hours, so a reader sees which part of each day is theirs.

Same year, same location, under overlap:

| | Sunrise | Overlap |
|---|---|---|
| Stars never badged | 11 | **none** |
| Badged days per star / year | 11–17 | 25–28 |
| Longest gap between one star's days | — | **27 days** (one lunar cycle; no cycle skipped) |

### Changed

| File | Change |
|---|---|
| `app/calculations/panchangam.py` | `chandrashtamam_janma_nakshatra_windows_for_day` made public. Takes no lat/lon on purpose — the affected star is a function of the Moon's longitude alone, so a caller holding only a timezone can ask without computing sunrise or a snapshot. |
| `app/services/daily_guidance_service.py` | Badge = the reader's star appears in the day's windows. Falls back to the old share gate on a pre-v44 snapshot. |
| `app/services/transit_service.py` | Same test, now costing two boundary searches instead of a sunrise + ephemeris call. |
| `app/services/muhurtham_naal_service.py` | The §9 veto reads the same overlap set, so the picker cannot clear a date the dashboard badges. |
| `app/schemas/daily_guidance.py`, `packages/shared/src/types/index.ts` | New `chandrashtamaStar`. |
| `app/services/_dg_cache.py` | Engine v12 → **v13**. |
| web card call sites | Take the reader's star from their guidance, not the almanac's sunrise star. |

**Why `chandrashtamaStar` had to be added.** §7 let the card find the reader's
window using the day's sunrise star, on the reasoning that the card only renders
on the reader's own day so the sunrise star *is* theirs. Overlap breaks that: on
the day a window opens, the reader's star is the day's **second** one, and the
sunrise star points at somebody else's window. The card would have silently
found nothing on exactly the days this fix was made for. The personal star now
comes from the personal payload.

### Verified

`tests/test_panchangam.py::test_every_janma_star_gets_a_chandrashtama_day_in_a_lunar_cycle`
asserts the property, not the mechanism: across three separate 28-day stretches
every one of the 27 stars is named at least once. Full run: 207 passed,
9 skipped; ruff clean on `app` and `tests` (one pre-existing I001 in
`notification_dispatch_service.py`, untouched and unrelated); `tsc` clean.

### To revert to one-star-per-day

`chandrashtamam_affected_janma_nakshatra_number` is still computed and still
names the day for almanac display. Compare against it instead of the window set.
Doing so reinstates the 11 annual skips.

---

## 11. D9 — a star is not an audience

**Reported:** 2026-09-09 by the owner, on the fix in §10. "The card says
Affected Rasi ♐ Dhanusu, Uthiradam 9:34 am – 12:00 am. But my daughter is
Uthiradam **Magaram** and she is shown Chandrashtamam today too."

Correct report, and the badge was not the only thing wrong.

### The arithmetic nobody checked

A nakshatra is 13°20′ and a rasi is 30°, so a rasi holds **2.25** nakshatras.
Only every fourth rasi boundary lands on a nakshatra boundary. The other nine
fall *inside* a star:

| Star | Splits |
|---|---|
| Karthigai | Mesham / Rishabam |
| Mirugaseeridam | Rishabam / Mithunam |
| Punarpoosam | Mithunam / Kadagam |
| Uthiram | Simmam / Kanni |
| Chithirai | Kanni / Thulam |
| Visakam | Thulam / Viruchigam |
| **Uthiradam** | **Dhanusu / Magaram** |
| Avittam | Magaram / Kumbam |
| Poorattathi | Kumbam / Meenam |

**A third of all natives are born under a star that spans two rasis**, and the
two halves are not one audience. Chandrashtama is the Moon in the 8th rasi from
natal Moon rasi, so Uthiradam/Dhanusu natives observe it when the Moon is in
Kadagam and Uthiradam/Magaram natives when it is in Simmam — **a fortnight
apart**. Every surface was matching windows on the star *name*.

§9 had already tripped over this fact in a test — *"Uthiradam is rasi 10
(Makaram) in this sheet — only its first pada is Dhanusu"* — fixed the test and
left the production match alone. The check did not outlive the sentence.

### What the reader saw, 2026-09-09 at Chennai

The affected point crosses 270° at **15:14**, when the Moon leaves Kadagam:

| | True window | What shipped |
|---|---|---|
| Uthiradam / **Dhanusu** | 09-Sep 09:34 → **15:14** | 09-Sep 09:34 → 10-Sep 08:20 |
| Uthiradam / **Magaram** | 09-Sep **15:14** → 10-Sep 08:20 | 09-Sep 09:34 → 10-Sep 08:20 |

So the daughter's badge was right and her *hours* were somebody else's, 5 h 40 m
early, under a card headed with somebody else's sign. The mirror case is worse
and silent: on **10-Sep** the Dhanusu half is badged for a whole day whose
Chandrashtama ended the previous afternoon.

Measured over all 365 days of 2026 at Chennai, per straddling half:

| | |
|---|---|
| Days badged that are not that half's at all | **2 to 12 per year** |
| Halves affected | 18 (nine stars × two rasis) |

Worst: Karthigai/Mesham and Poorattathi/Meenam, 12 false days each.

### Why the rasi test is not a new rule

It is §4.11 itself. The affected point is the Moon − 210°, and 210° is seven
**whole** rasis, so `rasi(Moon − 210°) == natal Moon rasi` *is* "the Moon is in
my 8th". The star reading was only ever meant to be a sub-interval of that. An
unsplit straddling window is not a refinement of §4.11 — it steps outside it,
which is exactly why it produced days the rasi rule never would.

### Changed

| File | Change |
|---|---|
| `app/calculations/panchangam.py` | Windows are intersected with the Moon's rasi spans and carry `rasi_number` / `rasi_name`. The affected point crosses a rasi boundary at the same instant the Moon does, seven signs away, so the Moon's spans are reused rather than a second grid searched. New `own_chandrashtama_windows(...)` — the one place the star-and-rasi test lives. Cache version 44 → **45**. |
| `app/services/daily_guidance_service.py` | Badge and `chandrashtamaEnds` go through it. New `chandrashtamaRasi` on the payload. |
| `app/services/transit_service.py` | Same, for the family surfaces. |
| `app/services/muhurtham_naal_service.py` | The §9 veto tests both, so the picker still cannot clear a date the dashboard badges. |
| `app/services/_dg_scoring.py` | `chandrashtama_end` takes `natal_moon_rasi`. |
| `app/schemas/panchangam.py`, `app/schemas/daily_guidance.py`, `packages/shared/src/types/index.ts`, `app/services/panchangam_service.py` | `rasiNumber` / `rasiName` on each window; `chandrashtamaRasi` beside `chandrashtamaStar`. All additive with defaults. |
| `web/components/dashboard-calendar-shared.tsx` | `formatOwnChandrashtamaWindow` takes the rasi. `formatChandrashtamaWindowSummary` qualifies a star with its rasi **only when the day holds it twice** — otherwise the list reads as the same star repeated with no way to tell which half is yours. New `chandrashtamaAffectedRasiNumbers`. |
| `web/components/dashboard-calendar-tab-nova.tsx` | "Affected Rasi" names every rasi the day touches. `affectedJanmaRasiNumber` is a *sunrise* scalar, so on the two days in five the Moon changes rasi it named only the first — the ♐ Dhanusu in the report, on a day that was Magaram's from 15:14. This closes the second half of the §6 "left open" note. |

**`chandrashtamaRasi` had to be added** for the same reason §10 had to add
`chandrashtamaStar`: the client cannot derive it. The card would otherwise match
the reader's star against a list holding that star twice and take whichever came
first — right half the time, by coin flip.

### Fallback direction

A window with `rasi_number == 0` (pre-v45 snapshot) or a guidance row without
`chandrashtamaRasi` falls back to the name-only match — the previous behaviour,
correct for the 18 non-straddling stars. An avoidance rule fails toward the
doctrine; it must not clear a day it cannot read. Same ruling as the missing
activity location in §9.

### Verified

```
2026-09-08  MOOLAM 00:00-11:02 (Dhanusu)   POORADAM 11:02-00:00 (Dhanusu)
2026-09-09  POORADAM 00:00-09:34 (Dhanusu)
            UTHIRADAM 09:34-15:14 (Dhanusu)   <- pada 1
            UTHIRADAM 15:14-00:00 (Magaram)   <- the daughter
2026-09-10  UTHIRADAM 00:00-08:20 (Magaram)  THIRUVONAM 08:20-00:00 (Magaram)

            Uthiradam/Dhanusu   Uthiradam/Magaram
2026-09-09  09:34-15:14         15:14-00:00
2026-09-10  not badged          00:00-08:20
```

Three new engine tests: the handover day splits into two windows one boundary
apart; the wrong half is not badged on 10-Sep; and — the one that would have
caught this on day one — **every window, sampled at three points, has the Moon
in the 8th rasi from the sign the window names**, across 40 consecutive days.
That is §4.11 stated as a property rather than trusted as a description.

Two new `chandrashtama_end` tests (the two halves' end times; the pre-v45
fallback). The existing tile test asserted windows were distinct **by star**,
which is now false by design — it asserts distinct by (star, rasi), the stronger
form of the same intent.

`test_panchangam`, `test_chandrashtama_end`, `test_calculations`,
`test_intraday_panchangam_spans`, `test_muhurtham_naal`, `test_panchangam_api`
— **260 passed**. `test_transits_api`, `test_transits_calculations`,
`test_daily_guidance_api`, `test_family_vaults_api`,
`test_astrology_shared_rules`, `test_api_wrapper_field_contract` — **142 passed,
9 skipped**. Web: 60 passed across the five affected suites; `tsc --noEmit`
clean. Ruff clean apart from the pre-existing `notification_dispatch_service`
I001. Local runs are not authoritative; CI is.

Mobile needed no change — it renders `chandrashtamaEnds` and `is_chandrashtama`,
both computed server-side.

One test-stub fix, the same shape as §9's: the muhurtham fake built windows as a
`SimpleNamespace(name=...)` with no rasi. The stub was incomplete, not the code —
a real window is a dataclass that always carries the field — so the fake was
extended rather than the production read loosened to `getattr`.

### Still open after this

- ~~The 00:00 window edge (§6)~~ — **closed in §13.** Not cosmetic after all: it
  was the missing half of D11, because "which day does this window name?" cannot
  be asked of a list bounded by midnight.
- ~~`chandrashtamam_affected_janma_rasi_number` is still the sunrise scalar~~ —
  **ruled in §13.** Kept, and promoted from trap to contract: under D11 the
  sunrise (star, rasi) pair *is* the day's almanac headline and the first window,
  asserted by test.

---

## 12. D10 — the cache bump was a load test, and something failed it

**Reported:** 2026-09-09, minutes after §11 shipped. "2026 Wedding Muhurtham
Naal … 0 dates. Backend unreachable."

```
GET .../charts/{id}/muhurtham-naals?year=2026&recommendedOnly=false 502 in 305088ms
```

502 at **305 s** — the proxy's 300 s limit. Not an error: a hang. Every other
endpoint in the same log was 200.

### It was mine, and it was not the code I thought

First suspect was the extra `limb_spans_between("moon_rasi", …)` §11 added to
every window computation. Measured before theorising, per the P0-5 rule:

| | |
|---|---|
| One `calculate_daily_panchangam` | 604 ms |
| …of which §11's added moon_rasi search | **50 ms (8%)** |
| Projected over 55 naal dates | +2.7 s |

2.7 s of 305. Not it.

The actual cause was `PANCHANGAM_CACHE_DATA_VERSION` 44 → **45**. That is a
correct and necessary bump — the window shape changed — but it invalidated every
cached snapshot at once, and that turned a warm read into a cold computation for
the first caller of every date. **A cache-version bump is a load test of every
uncached path**, and this path could not pass one.

### The latent defect it exposed

`_panchangam_by_date` asked for `min(naal.date) … max(naal.date)`, and
`calculate_daily_panchangam_range` fills a **contiguous** range:

| | |
|---|---|
| 2026 curated naals | **55 dates**, 28-Jan … 14-Dec |
| Contiguous span between them | **321 days** |
| Waste factor | **5.8×** |
| 321 days of pure ephemeris | **126.7 s** — plus 321 cache INSERTs |

So the endpoint computed 321 days to answer about 55, and had done so all along.
On a warm cache that is a single bulk SELECT and invisible. On a cold one it is
past the proxy's limit before the DB writes are counted.

The retries made it worse, not better: uvicorn keeps running a handler after the
client disconnects, so each 502'd attempt kept computing and persisting. That is
why the same request later returned in 0.8 s — five abandoned attempts had
warmed the cache between them. **A hang that partially self-heals is the hardest
kind to attribute**, and it very nearly read as "the fix worked on its own".

### Fixed

`calculate_daily_panchangam_range` takes `only: Collection[date] | None`. The
cache SELECT still covers the whole range in one query — that part was never the
cost — but only the requested dates are computed. `_panchangam_by_date` passes
the naal dates.

| Year | Dates | Contiguous span | Before | After (cold) | Warm |
|---|---|---|---|---|---|
| 2026 | 55 | 321 | 502 @ 305 s | **21.7 s** | 0.4 s |
| 2027 (the route's default) | 74 | — | would also have 502'd | **31.9 s** | 0.10 s |

Every other caller of the range function was checked and genuinely needs each
day of a contiguous stretch — a week, a calendar month, a 120-day look-ahead
scan. `only` is for sparse callers, and the curated sheet is the only one.

The test stub now **asserts** `only` is the naal date set rather than merely
tolerating the kwarg; a stub that accepts and ignores it would have let the
5.8× come straight back.

### The rule

Two, and the second is the one that generalises:

1. **A sparse set of dates is not a range.** Passing `min … max` to a range API
   silently multiplies the work by the sparsity factor. Here it was 5.8×.
2. **Bumping a cache version is a deploy-scale event, not a one-line edit.** It
   moves every consumer onto its cold path simultaneously. Before bumping, ask
   which endpoint has the largest uncached fan-out and whether it fits inside
   the proxy timeout. This one did not, and nothing in the test suite could have
   told us — the suites stub the range call, and a warm dev cache hid it too.

Related: the repo's own `bound-every-unbounded-wait` note. The 300 s proxy limit
is what produced this diagnosis; without it the request would still be running.

---

## 13. D11 — a window is not the same thing as a day

**Reported:** 2026-09-09 by the owner, on the fix in §11. "I still see
uthiradam magaram person is shown with chandrashtamam label on 09-09-26, even
though it falls on pooradam dhanusu."

Correct again, and it is the §10 overlap rule this time, not the §11 rasi split.
§11 gave the daughter the right *hours*; it left her badged on two dates.

### The three cuts, and why only the third is the almanac

| Cut | Rule | Failure |
|---|---|---|
| §6 | the star standing at **sunrise** owns the day | a window shorter than 24 h can fall between two sunrises and own no day — **11 stars never badged in 2026** |
| §10 | any window **touching** the day badges it | every straddling half badged on two dates; the reported case, badged on a day the almanac gives to Pooradam |
| **§13** | the day whose **sunrise** the window covers — or, covering none, the day containing it | — |

The third is the printed almanac's own reckoning, stated completely. A Tamil
page is headed with the star standing at உதயம், and a window opening in the
afternoon is tomorrow's entry printed today so the reader sees it coming. The
one thing a printed page never does is lose a star — so a window that opens and
closes between two sunrises is named on the page it falls inside.

Formally, over the solar day D = [sunrise(D), sunrise(D+1)):

```
owns(W, D)  <=>  W covers sunrise(D)   OR   W ends before sunrise(D+1)
```

Windows are clipped to their day, so both tests are local — `W.start <= day_start
or W.end < day_end` — and exactly one case is excluded: opens late **and**
outlasts the day.

### What the reader saw, 2026-09-09 at Chennai

```
2026-09-09  sunrise 06:01   headline: POORADAM / Dhanusu
   POORADAM    06:01 -> 09:34   Dhanusu    owns the day
   UTHIRADAM   09:34 -> 15:14   Dhanusu    owns the day   (covers no sunrise)
   UTHIRADAM   15:14 -> 06:01+  Magaram    NAMES THE 10th  <- the daughter
2026-09-10  sunrise 06:01   headline: UTHIRADAM / Magaram
   UTHIRADAM   06:01 -> 08:20   Magaram    owns the day
   THIRUVONAM  08:20 -> 06:01+  Magaram    names the 11th
```

Note Uthiradam/Dhanusu: 5 h 40 m, wholly inside one solar day, with no other day
anywhere in the cycle. That half is precisely what the §6 sunrise rule dropped,
and it is why the rule needs its second clause rather than being "read the
sunrise star".

Measured over all 365 days of 2026 at Chennai, across all 36 star-and-rasi
halves:

| | §6 sunrise | §10 overlap | §13 |
|---|---|---|---|
| Halves never badged | 11 | none | **none** |
| Badged days per half / year | 11–17 | 25–28 | **13–17** |
| Longest gap for one half | — | 27 d | **28 d** (one cycle, none skipped) |
| Halves badged on two consecutive days | 15 | all | **11** |

13.4 is the arithmetic expectation (365 / 27.3). The eleven two-day runs are
real: a 27.2 h window at the Moon's slowest genuinely covers two sunrises, and
an almanac prints that star on both pages.

### The 00:00 window edge, ruled at the same time

This was carried as "cosmetic, and now genuinely the last item" through §11. It
was not cosmetic — it was the missing half of this bug. The ownership test above
cannot be asked of a list bounded by midnight, because midnight is not where the
almanac day begins.

**Ruled: the window list is bounded by the SOLAR day, sunrise to next sunrise.**
That was already true of every other span list on the snapshot —
`tithi_spans`, `nakshatra_spans`, `yoga_spans`, `karana_spans`,
`moon_rasi_spans` — and of the score share. The chandrashtama windows were the
one list in the file measured over different bounds. Three day-definitions in
one feature is now one.

A side effect worth naming: the intersection in
`_chandrashtamam_janma_nakshatra_windows` needed the Moon's rasi spans over
*its* bounds, so it walked that limb a second time. Over the same bounds it can
take the list `calculate_daily_panchangam` already computed — the 50 ms D10
measured, returned.

### `chandrashtamam_affected_janma_rasi_number`, ruled at the same time

Carried since §6 as a trap: a sunrise scalar naming only the first of a
rasi-change day's two rasis, read by nothing personal.

**Ruled: keep it, and make it a contract.** Under D11 the day belongs to the
star standing at sunrise, so the pair
(`affected_janma_nakshatra_number`, `affected_janma_rasi_number`) *is* the day's
almanac headline — the single line a printed page carries. It is not a
degenerate summary of the window list; it is the first window.

That is now asserted rather than left to agree by habit
(`test_the_sunrise_scalars_are_the_first_window`): the scalars come from
`moon_longitude` at sunrise and the windows from a boundary walk, and nothing
else in the system would notice them parting company. Anything needing finer
than the headline reads the windows, and the calendar's "Affected Rasi" line
already does (§11).

### Changed

| File | Change |
|---|---|
| `app/calculations/panchangam.py` | New `_solar_day_bounds_jd`. `_chandrashtamam_janma_nakshatra_windows` takes JD bounds and an optional pre-computed `moon_rasi_spans`; the public `..._for_day` takes latitude/longitude, because the almanac day needs a horizon. `own_chandrashtama_windows` gains the ownership test — the one place it lives, shared by the badge, the end time, the family surfaces and the muhurtham veto. Cache version 45 → **46**. |
| `app/services/transit_service.py` | Reads `resolve_effective_daily_location` for the horizon, not just the timezone. |
| `app/services/_dg_cache.py` | Engine v14 → **v15**. `isChandrashtama`, `chandrashtamaEnds`, `chandrashtamaStar` and `chandrashtamaRasi` are all persisted and all move. The v14 entry itself was missing from the changelog above the constant — bumped without a note, so its reason lived only in §11 — and is written in beside v15. |
| `app/services/daily_guidance_service.py`, `app/services/_dg_scoring.py` | No logic change — both go through `own_chandrashtama_windows`, which is the point of it. Comments corrected: they described the overlap rule this replaces. |
| `tests/test_panchangam.py` | Four new tests, all keyed to the report: a late-opening window names tomorrow; a window between two sunrises still claims its day; every one of the 36 halves owns one contiguous spell per cycle; the sunrise scalars are the first window. Two existing tests updated to solar-day bounds. |
| `web/components/dashboard-calendar-shared.test.tsx` | Fixtures rebuilt as the real 2026-09-09 payload — sunrise-bounded, three windows, both halves of Uthiradam. Two new cases: each half gets its own hours, and an edge falling on tomorrow's date is qualified. |

No frontend source change was needed. `formatChandrashtamaWindowEdge` already
qualifies an edge that lands on another date, which is what a sunrise-bounded
list produces at its tail.

### The cache bump, checked before it was made (D10's rule)

A version bump moves every consumer onto its cold path at once, so the question
is which endpoint has the largest uncached fan-out.

| Caller | Dates | Cold |
|---|---|---|
| `muhurtham-naals` (2027, the route default) | 74, sparse — `only=` since D10 | ~43 s |
| `/muhurta` search | 61 contiguous (`MAX_DATE_RANGE_DAYS`) | ~35 s |
| calendar month | 31 | ~18 s |

Against the proxy's 300 s limit, with a cold day now **577 ms** (604 ms before
this change — the returned moon_rasi walk). All fit. `panchangam_prewarm` runs
nightly for nine locations x 45 days; **run it by hand after deploying this**
rather than letting the first real user of each date pay for the bump.

### Verified

```
2026-09-07  KETTAI/Viruchigam  owns   MOOLAM/Dhanusu     names the 8th
2026-09-08  MOOLAM/Dhanusu     owns   POORADAM/Dhanusu   names the 9th
2026-09-09  POORADAM/Dhanusu   owns   UTHIRADAM/Dhanusu  owns (no sunrise)
                                      UTHIRADAM/Magaram  names the 10th  <- reported
2026-09-10  UTHIRADAM/Magaram  owns   THIRUVONAM/Magaram names the 11th
```

`test_panchangam`, `test_muhurtham_naal`, `test_life_areas_service`,
`test_chandrashtama_end` — **143 passed**. Web: `dashboard-calendar-shared` 13
passed. Local runs are not authoritative; CI is.

### Still open

Nothing from §6's list. Both items it carried — the 00:00 edge and the sunrise
rasi scalar — are ruled above rather than deferred again, because both turned
out to be load-bearing for this bug rather than cosmetic. The lesson is the
repo's own `stale-conclusion-outlives-its-check`: "cosmetic" was a judgement
made when nothing read the window edges, and it outlived the day the badge
started reading them.

---

## 14. `_find_next_improvement_date` — a date the engine had disproved

Raised alongside D11, and framed by the owner as a product question rather than
a performance one. That framing is right, and it moves the answer.

`app/services/life_areas_service.py` scans 26 weekly samples out to 180 days for
the first date an area's score lifts. Two things were wrong with what it
printed, neither of them the scan.

### The fabricated fallback

```python
return on_date + timedelta(days=90)
```

When 180 days held no improvement, it returned day 90 — a date the scan had
tested at day 84 and day 91 and rejected at both. That date went into
`_duration_caution`:

> This challenging period lasts until 9 Dec 2026. **Improvement starts clearly
> after this date.**

An assertion the engine had specifically disproved, printed as a specific date.
This is the recorded `explanation-must-match-its-own-numbers` shape.

**Ruled: return `None`.** The caller already handles it —
`_with_improvement_hint` drops the sentence and `_duration_caution` is skipped,
so the area's own caution copy stands, which claims nothing it cannot support.
Saying less is the only honest option when there is nothing to say.

### The grid artifact

The coarse pass steps a week, so the date returned is always a multiple of seven
days out. A lift beginning on the 10th is first *seen* on the 14th, and the
reader is told to wait four days longer than their chart says they must.

**Ruled: name the first improving day, not the first improving sample.** The
weekly step stays — a week is the resolution at which a transit change is a
change of regime rather than a one-day blip, and a blip is not what "conditions
improve after" means to somebody planning around it. But once a week has been
cleared, the search walks back day by day within it to the first day holding the
same improvement.

This is deliberately *not* the coarse-to-fine scheme that would make the scan
cheaper: every week up to the answer is still tested, so the refinement can only
ever move the answer **earlier**, and only inside a week already known to
improve. A scheme that skipped weeks would change which date is returned at the
margins, and a "next" that skips an earlier qualifying date is a broken promise.

Cost: 26 samples as before, plus at most six day-steps, and only on a hit.

Four tests in `tests/test_life_areas_service.py` cover both rulings and the
bound, stubbing the ephemeris so what is under test is which of the scanned days
gets printed.

---

## 15. Two surfaces were never on any of these rulings

Found on 2026-09-10 by auditing the question "does the D11 change touch scoring
and predictions?" rather than by a report. The answer to that question is in the
correction at the end of §4; this is what the audit turned up beside it.

Four surfaces were brought onto the star-and-rasi window rule across §6–§13. Two
were not, and neither was ever mentioned in this document's "left open" lists.

| Surface | Question it asks | Sampled at |
|---|---|---|
| `life_areas_service.py:1723` | `moon.rasi == 8th from natal moon rasi` | **local noon** |
| `muhurta_engine.py:1924` (the `/muhurta` day search) | `chandra_bala(janma_rasi, snapshot.chandrashtamam_moon_rasi_number) == 8` | **sunrise** |

Both are rasi-only and point-sampled — Question B and a sunrise variant of it,
the exact two shapes §2 named as the original defect. They are not decoration:

- Life Areas applies `_CHANDRASHTAMA_PENALTY = 8` to HEALTH, RELATIONSHIPS,
  FAMILY_HARMONY and EDUCATION, sets the client's `chandrashtamaApplied` marker,
  and switches the narrative, remedy and caution copy for those four areas
  (`"Chandrashtamam — watch mental stress"`). The same test drives the 6- and
  12-month forecast columns (`_ForecastContext.chandrashtama`) and
  `_find_next_improvement_date`.
- `/muhurta` **vetoes** the date outright — "not compensable by an excellent
  almanac", so the day is dropped rather than docked.

### Measured, 365 days x all 36 star-and-rasi halves, Chennai

| Surface | Days badged per half per year | Days disagreeing with the D11 badge |
|---|---|---|
| D11 badge (Today hero, family, muhurtham naal) | **13.7** | — |
| §10 overlap (what shipped before 2026-09-10) | 23.5 | 9.9 |
| **Life Areas** (noon, rasi only) | **30.4** | **20.8** |
| **`/muhurta` search** (sunrise, rasi only) | **30.4** | **20.2** |

30.4 is the rasi transit: ~2.25 days x 13.4 cycles. 13.7 is the star window.

Solving the totals for direction (`extra − missed = life − d11`,
`extra + missed = disagree`): Life Areas flags **~18.8 days a year the badge does
not**, and **misses ~2.1 days the badge does flag**. `/muhurta`: ~18.5 extra,
~1.8 missed. So it is overwhelmingly a false-positive surface — but not purely,
and the missed days are the worse half, because on those the hero warns and the
life-area penalty silently does not apply.

### The original complaint, still reproducible

The owner is Moolam/Dhanusu; the daughter Uthiradam/Magaram. Two of five days
still disagree across surfaces:

```
date        reader                 D11 badge  Life Areas  /muhurta
2026-09-08  owner Moolam/Dhanusu     True       True        True
2026-09-09  owner Moolam/Dhanusu     False      True        True   <-- DISAGREE
2026-09-10  daughter Uthiradam/Mag   True       True        True
2026-09-11  daughter Uthiradam/Mag   False      True        True   <-- DISAGREE
```

2026-09-09 is the report that opened this document, one tab across: the Today
hero shows the owner nothing while the Life Areas tab docks four of his areas by
8 points and tells him to watch his mental stress.

### Not caused by D11, but made more visible by it

Both surfaces were already on the old rule before 2026-09-10; §6 moved the badge
and left them. What D11 changed is the *badge*, from 23.5 badged days to 13.7,
which widens the gap to these two from ~9.9 days a year to ~20.8. The defect is
older than the fix that exposed it.

### Not fixed here — it is a doctrine decision with a score consequence

Bringing Life Areas onto `own_chandrashtama_windows` would remove the 8-point
penalty on ~18.8 days a year per half and add it on ~2.1, changing four life-area
scores for every user on roughly one day in nineteen. That is the "would change
every user's number" class of decision §4 declined to make as part of a bug fix,
and it needs the same owner ruling. Two sub-questions it should answer:

1. Life Areas is a *standing state*, not a daily alert. There is a defensible
   reading in which the wider rasi transit is the right unit there, the way §9
   ruled the muhurtham picker keeps a rasi-level caution (−10) beside the star-level
   veto (−40). If so the fix is to say so in the code, not to change the rule.
2. `/muhurta` is an avoidance search, and its veto currently fails toward the
   doctrine — it drops more dates than D11 would. Narrowing it removes that
   safety margin, which §9's fallback ruling deliberately preserved elsewhere.

---

## 16. The ruling: two registers, never one boolean

Asked on 2026-09-10, after §15: *"if you are world class Tamil Thirukanitham
astro what will you do next."* This is the answer, and it turns out not to be a
new ruling — it is §4 and §9 applied to the places nobody applied them to.

### The distinction the tradition makes

| | **The CONDITION** | **The PROHIBITION** |
|---|---|---|
| What | the Moon transiting the 8th rasi from natal Moon | சந்திராஷ்டம நாள் — the day the almanac NAMES for one janma star |
| Duration | ~2¼ days | ~1 day |
| Shape | continuous, graded | binary |
| Resolution | rasi | star **and** rasi |
| Means | vitality low, mind unsettled | do not begin: no muhurtham, no surgery, no signing |
| Test | share of the solar day | `own_chandrashtama_windows` |

Not rival readings of §4.11 — the same 210° offset asked at two resolutions for
two purposes. The classical rule supports both because it states a *placement*,
not a verdict.

**Every place in this codebase that was already correct keeps them apart:**
`weighted_moon_score` (graded `-25 × rasi share`), the Today hero badge and
`chandrashtamaEnds` (star window), and the Muhurtham Naal picker (§9), which
carries **both, explicitly, side by side** — `-40` and a veto on the star
window, `-10` on the rasi span.

**Every place that was wrong used one boolean for both.** That is the whole
defect class in one line, and it is worth more than any individual fix: §2's
Question A and Question B were each an attempt to answer *two* questions with
*one* number.

### The seventh surface

§15 found two by accident while answering a different question; it had examined
six of the sixteen files in `app/services/` that mention Chandrashtama (33
across `app/` as a whole, counting the schemas and API routes that only carry
the fields). Completing that audit found a seventh:

**`ask_vinaadi_service.py:213-214`** — `moon_transit.rasi == chandrashtama_rasi`,
sampled at **`datetime.now()`**. Worse than a noon sample: the same question
asked at 10am and at 6pm on a rasi-change day got opposite answers. And the
system prompt instructs the model *"if Chandrashtamam is active, always mention
it when answering timing questions"* — a prohibition claim resting on the
condition's test, at an arbitrary instant.

Cleared in the same pass: `narrative_engine`, `daily_briefing_synth`,
`family_vault_service` and `daily_push_cron` all receive the flag from callers
already on the D11 rule, so they inherit it. `numerology_timing_service` passes
it through. `qa_service`'s module asserts §4.11 at rasi level — correct as far
as it goes, and now an incomplete statement of what the product ships.

### One primitive, so an eighth cannot appear quietly

Four surfaces each had a private route to the same question. New public
`is_chandrashtama_day(...)` in `app/calculations/panchangam.py`, beside
`own_chandrashtama_windows`; `transit_service`, `life_areas_service` and
`ask_vinaadi_service` all call it. Its docstring names the four wrong routes
that existed — a solar-noon rasi sample, a sunrise rasi sample, a
`datetime.now()` rasi sample and a half-the-solar-day gate — and states that the
graded condition is a different question with a different answer, so the next
reader cannot reach for it by mistake.

### Applied — `/muhurta` day search

§9 had already ruled this exact act:

> Picking a date is not the same act as reading today's dashboard — a wedding is
> chosen once — so the wider rasi transit keeps a voice, but only the reader's
> own star window can knock a date out of "recommended".

`/muhurta` is the same act as the Muhurtham Naal picker, and a user comparing the
two screens saw one veto three dates where the other vetoed one.

| Case | Verdict |
|---|---|
| The reader's own named day | **VETO** |
| Moon in their 8th, day belongs to another star | **PENALTY**, `_W.CHANDRA_ASHTAMA_RASI = -15` |

`-15` sits deliberately between the veto and the `-12` a merely weak 4th/12th
carries. `Subject` has carried `janma_nakshatra` since it was written — **no
plumbing was needed, only the question was wrong.** Reasons lead with the star
(§9's own note), while still naming the sign as the mechanism, because §4.11 has
not moved. A snapshot with no window list keeps the rasi veto: an avoidance rule
must not clear a date it cannot read.

### D12 — and the first cut of that veto failed open

Caught by the year-long sweep below, **not** by the 30-day property test written
beside the fix.

The veto was gated inside `if house == _CHANDRASHTAMA`, and `house` reads the
Moon's rasi at **sunrise**. A window that opens after sunrise and closes before
the next one — §13's contained-window case, the whole reason the ownership rule
has a second clause — belongs to a day whose sunrise Moon has not yet reached
the reader's 8th rasi. So the star test was never reached, and the date was
cleared on **63 dates in 2026** that the dashboard badged.

An avoidance rule failing *open* is the worst direction there is. The star test
is now asked first and unconditionally; `house` is consulted only for the
caution branch.

**Why the test missed it.** It swept one Moolam/Dhanusu subject across 30 dates.
The defect is a property of *which chart*, not of which date — Moolam/Dhanusu
never hits the contained-window case in that stretch. A property that must hold
for every chart has to be swept over charts. The test now sweeps all 36
star-and-rasi halves across a full lunar cycle, and asserts
`contained_seen > 0`: a sweep that cannot reach the bug is not a regression test.

### Applied — Life Areas

One noon boolean drove an 8-point penalty *and* "avoid surgery on Chandrashtamam
days". Split:

- **Score** → `round(8 × the day's rasi share)`, the same quantity
  `weighted_moon_score` uses over the same solar day.
- **Narrative, remedy, caution copy and the tile's marker** → the named day, via
  the identical `is_chandrashtama_day` call the Today hero makes.

The marker follows the *named day*, not the penalty, deliberately: a life-area
score moves for a dozen transit reasons daily and none of the others get a chip.
"சந்திராஷ்டமம்" is the one thing a Tamil reader **names**, and the chip must mean
that or it means nothing.

The owner's own stretch — the penalty now tapers instead of switching:

```
2026-09-07  share 0.724   -6   named day: False
2026-09-08  share 1.000   -8   named day: True    <- his day
2026-09-09  share 0.384   -3   named day: False   <- the §15 contradiction
2026-09-10  share 0.000    0   named day: False
```

2026-09-09 is the day the Life Areas tab used to charge the full 8 and tell him
to watch his mental stress while the Today hero, one tab across, showed nothing.

### The copy had to learn the number

`dashboard-today-glance-nova.tsx` printed *"this score is docked 8 points"* — true
under a flat penalty, false under a graded one, and false on exactly the days the
flag now fires for (2026-09-09 costs three). New `chandrashtamaPenalty` on the
payload, and the copy prints what the server actually subtracted. Flag and figure
are separate facts and neither is derivable from the other, so both travel. A
payload cached before the field names no figure rather than a stale one. Same
shape as the recorded `explanation-must-match-its-own-numbers` rule.

### Cost, measured before choosing the shape

The share is wanted per date by today's score, both forecast horizons and the
26-date improvement scan.

| | first measurement | re-measured 2026-09-10 |
|---|---|---|
| `_moon_rasi_spans_for_day` — direct limb walk | 23 ms/day | **33–45 ms/day** |
| full `calculate_daily_panchangam` | 222 ms/day | **395–417 ms/day** |
| **ratio — what the choice rests on** | 9.7× | **10–12×** |
| 26-date improvement scan, cold | 0.6 s | **~1.0 s** (~10.5 s at panchangam cost) |
| second and later areas in the same request | 0 s — `lru_cache` | 0 s |

Both columns are this machine; the absolutes roughly doubled between them and
the ratio did not, across three trials each. So do not quote the millisecond
figures as a spec — they move with machine state, and a later reader measuring
420 ms has not found a regression. The **ratio** is the finding, and it is what
the decision rests on: the direct walk is an order of magnitude cheaper than the
full snapshot, which is why the share is affordable per date at all.

Verified to return exactly the snapshot's own `moon_rasi_spans` fraction: the
cheap path is not an approximation, it is the same walk without the other limbs.

Both caches are keyed on `(date, location)` **and nothing else**. The first cut
keyed them on the chart as well, which looks harmless and silently recomputes the
same boundary search once per chart — a family vault reading eight members on one
date would have paid for eight identical walks. The repo's own
`pure-function-recomputed-per-consumer` note, walked straight into while writing
the docstring that cites it.

The forecast horizons take the graded share too rather than staying on a noon
boolean. A projection may be coarse, but not coarse in a *different* way from
today's score: an 8-point term binary at the horizon and graded today would
inject a pure artefact into `_trend`, whose deadband is only ±5.

### Verified — 365 days x 36 star-and-rasi halves at Chennai

```
Life Areas named-day  vs Today hero badge : 0 disagreements   (was 750, 20.83/half/yr)
/muhurta veto         vs Today hero badge : 0 disagreements   (was 728, 20.22/half/yr)

the old surfaces' disagreement by direction, per half per year:
  Life Areas : 18.78 days it flagged that the badge does not, 2.06 it missed
  /muhurta   : 18.47 days it vetoed that the badge does not,  1.75 it missed

days with any share             : 43.83
penalty days (nonzero points)   : 42.42   (the full -8 on 18.42 of them)
named days (the prohibition)    : 13.69
penalty points per half per year: 243.33   old flat-8 x noon boolean: 243.33
```

13,140 (day × half) combinations, zero divergence on both. The comparison is
worth more than it looks: the badge reads the snapshot's own window list while
Life Areas, `transit_service` and `ask_vinaadi` compute windows standalone via
`chandrashtamam_janma_nakshatra_windows_for_day`. Two independent computations
of the same thing, agreeing on every one of the 13,140.

§15 solved for the old surfaces' direction algebraically and predicted ~18.8 /
~2.1 and ~18.5 / ~1.8. Measured directly they are 18.78 / 2.06 and 18.47 /
1.75. The algebra held.

**The total weight did not change — only its distribution.** The first draft of
this section claimed the graded rule was 9% lighter, against an old-rule figure
of 266.7. That number was an estimate, not a count, and it is wrong. Measured,
both rules cost **243.33** points per half per year, and the equality is not a
coincidence: the Moon spends 1/12 of the year in any given rasi, so the graded
sum is 8 × 365/12 = 243.33, and an unbiased noon point-sample fires on the same
365/12 = 30.42 days. What moved is the shape — 42.42 days now carry a *small*
penalty, because any touch of the 8th rasi charges at least one point, against
30.42 under the point sample, while only 18.42 carry the full eight. The same
weight, spread over the days that actually earn it.

That is the honest claim and it is a better one. "9% lighter" would have been an
argument about severity, which this ruling deliberately does not touch (see
"What deliberately did NOT change"). What it buys is that the penalty a reader
sees now matches the day they are actually having.

Re-run 2026-09-10 against the shipped code, every figure above measured rather
than estimated. Two of them moved and are corrected here; the rest held,
including the 63 dates of D12 above, which the sweep reproduces exactly and
which turns out to equal the 1.75/half/year `/muhurta` used to miss — the same
contained-window days counted two independent ways.

Suites: `test_muhurta_engine`, `test_muhurta_api`, `test_life_areas_service`,
`test_life_areas_api`, `test_ask_vinaadi`, `test_transits_api`,
`test_panchangam`, `test_muhurtham_naal`, `test_chandrashtama_end` —
**238 passed** (9m09s). `test_golden_validation` — **14 passed**, 148 golden
cases. Web: `dashboard-today-glance-nova` 27 passed,
`dashboard-calendar-shared` 13 passed. `tsc --noEmit` clean. Ruff clean apart
from the pre-existing `notification_dispatch_service` I001 (from `7728866`, not
from this work).

Local runs are not authoritative; CI is — and CI had not run on this branch
since 2026-09-02. `ci.yml` triggers on push to `main` and on `pull_request`
only, and the branch had no open PR, so 64 commits had had nothing against them
but Mobile CI, which does not run the backend suite. **PR #4** opened 2026-09-10
to close that. A branch that is pushed is not a branch that is checked.

### What deliberately did NOT change

- `weighted_moon_score`'s `-25 × share` — already the condition register,
  already graded, already on the solar day. §4 stands.
- `_CHANDRASHTAMA_PENALTY = 8` and `_CHANDRASHTAMA_AREAS`. This ruling is about
  *which question*, not how hard the answer hits.
- The D11 badge and everything reading it.

### Closed while writing this section

`qa_service`'s Chandrashtama module asserted the rasi rule only, against a local
reimplementation of it. Correct as far as it went, and not a description of what
ships — every defect this document records would have passed through it
unchanged. It now carries eight **T063** cases for the prohibition register,
asserted against `own_chandrashtama_windows` itself rather than a copy: a window
covering sunrise names the day, a contained window names the day it sits in, a
window that opens late and outlasts the day names *tomorrow*, each half of a
straddling star gets its own hours, and both fallbacks fail toward the doctrine.
**T063-f asserts the two registers disagreeing on one day** — on 2026-09-09 every
Dhanusu native carries the graded condition and only Pooradam natives are under
the prohibition — because that property, not either register alone, is what this
section is about. The fixture is hand-built (a fixture that called the ephemeris
would re-assert the boundary search instead of the rule, and would change under
it) and was checked window-for-window against the engine's real output for that
day. The T060/T061 rasi cases stay, with a docstring saying which register they
are. 12 cases to 20; `test_golden_validation`'s two count assertions moved with
them.

### Still open

- **A projection now carries a term that turns over daily.** The forecast
  horizons take the graded share at +6 and +12 months, which is right in that it
  is no longer coarse in a *different* way from today's score. But `_TREND_DELTA`
  is 5 and the term is worth up to 8, so where the Moon happens to sit on one
  sampled horizon date can move a tile's arrow by itself. Grading it reduced the
  artefact; it did not remove it. Whether a six-month arrow should carry a ~1-day
  input at all is a product question about what the arrow claims.
- **2.4% of named days now carry the flag and no points.** Measured: 12 of the
  493 named days in 2026 round to a zero penalty, the smallest share being 0.003
  of the day. The cause is correct and unavoidable — a window that opened
  yesterday afternoon and closes a few minutes after this morning's sunrise still
  names today under the உதய rule, while the Moon holds the reader's 8th rasi for
  only those minutes. The tile has a branch for it that names no figure, and this
  measurement is what says the branch is reached. Whether the copy should say
  more on those days is a wording decision, not a code one.
