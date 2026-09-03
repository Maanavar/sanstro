# Verification audit — the last 15 days

**Date:** 2026-08-31 · **Branch:** `harden/production-readiness` · **Head:** `b6dd55d`
**Scope:** every `docs/*.md` touched since 2026-08-16 (44 files), the commits behind
them (`697bbf3..b6dd55d`, ~40 commits), and the astrology doctrine those commits
changed.

Three questions were asked and are answered separately below: are the "done"
claims true, is anything broken, and is the astrology right.

**Headline:** the engineering is in good shape — 4,566 backend tests green, web
typecheck clean, mobile green. But **one build is red and has been for four days**,
and **two shipped astrology rules are wrong or inert** in ways no test would catch,
because in both cases the test pins the wrong value or never reaches the code.

---

## Test and build status (measured, not claimed)

| Surface | Command | Result |
|---|---|---|
| Backend | `pytest tests/` (full) | ✅ **4566 passed, 14 skipped**, 40m46s |
| Backend doctrine suites | the 5 suites the rulings docs name | ✅ 223 passed |
| Web typecheck | `tsc --noEmit` | ✅ clean |
| Web unit | `vitest run` | ❌ **1 failed**, 683 passed |
| Mobile | `jest` | ✅ 78 passed, 7 suites |

---

## 1. Breaks

### B-1 · `web/lib/doctrine-parity.test.ts` is red, and has been since 2026-08-27 🔴

The only failing test in the repository. The backend's naisargika-maitri table and
the web's hand-typed mirror disagree:

```
_NATURAL_FRIENDS (backend)      NATURAL_FRIENDS (web/lib/chart-utils.ts:115)
  MARS:   … + KETU                MARS:   (no KETU)
  SATURN: … + RAHU                SATURN: (no RAHU)
```

`dad309b` (2026-08-27, *"apply the 2026-08-27 astrologer rulings FCR-01..FCR-12"*)
symmetrised the two node rows in [chart_strength.py:176](../app/calculations/chart_strength.py#L176)
on the dicta *Kuja-vat Ketu* and *Shani-vat Rahu*. The reasoning is sound and it is
correctly labelled `[PRODUCT]`. The web copy at
[web/lib/chart-utils.ts:115](../web/lib/chart-utils.ts#L115) was not updated, and the
guard that exists precisely to catch this went red and was left red across four
subsequent commits.

**Impact today: none.** Both readers survive the drift by accident — one compares
against a *sign lord* (never Rahu/Ketu, so the missing rows are unreachable), the
other ORs both directions (`dashboard-chart-explanation.tsx:194-197`), so the
present `KETU → MARS` row rescues the missing `MARS → KETU`. This is the *second*
time this exact boundary has drifted; the test file's own docstring documents the
first.

**Fix:** add `KETU` to `MARS` and `RAHU` to `SATURN` in `web/lib/chart-utils.ts`.
Backend is the doctrine source and is already self-guarded
(`test_chart_strength.py` asserts node-row symmetry).

### B-2 · A stale editable install shadows the repo 🟠

```
site-packages/__editable__.jothidam_ai-0.1.0.pth
  → MAPPING = {'app': 'C:\Users\senth\OneDrive\문서\GitHub\sanstro\app'}
```

`app` resolves to a **second copy of the repo last committed 2026-06-28** — two
months stale, 30 of the current 64 `app/calculations` modules. Work in `D:\sanstro`
only works because the CWD precedes the editable finder on `sys.path`. Any Python
process started from another directory silently runs June code:

```
PS C:\tmp> python -c "import app.calculations.panchangam"
  → C:\Users\senth\OneDrive\...\app\calculations\panchangam.py   # the stale copy
PS C:\tmp> python -c "import app.calculations.muhurta_engine"
  → ModuleNotFoundError                                          # doesn't exist there yet
```

This is the [[stale-editable-install]] hazard already on record. **Fix:**
`pip uninstall jothidam-ai` then `pip install -e D:\sanstro` from the real root.

---

## 2. Doc claims that are not true

Everything in the 2026-08-28 ruling set was checked against code. Most of it is
accurate — see §4. Three claims are not.

### D-1 · "Both safe exemptions are live" — they are inert 🔴

`ASTROLOGER_RULINGS_2026-08-28.md` §3 states:

> Both safe exemptions are live — `MANTRA_INITIATION_JANMA_TARA_FAVOURABLE` (p.62)
> and the milk-feeding fallback (p.32) — via a new `janma_tara_exempt` field on the
> activity registry, **applied before the graded weight so a per-rite favourable
> reading always wins.**

That describes runtime behaviour that cannot occur. The exemption is subtracted
from the activity's *own* prohibition set:

```python
# muhurta_engine.py:1780
prohibited = entry.janma_tara_prohibited - entry.janma_tara_exempt
if not prohibited:
    return None
```

`janma_tara_prohibited` is a per-activity opt-in field defaulting to
`frozenset()`, and **only three activities ever set it** — `UPANAYANAM`,
`SEEMANTHAM`, `HARVEST` (`muhurta_activity_registry.py:803, 851, 1151`). Neither
`MANTRA_INITIATION` nor `MILK_FEEDING` sets it, so for both the subtraction is
`frozenset() - {…}` = `frozenset()` and the factor returns `None` before the grade
is ever read. Confirmed by running the engine:

```
MANTRA_INITIATION count 1/10/19  -> JANMA_TARA_COUNT present: False
MILK_FEEDING      count 1/10/19  -> JANMA_TARA_COUNT present: False
```

There was no bar on these two rites to lift. The `janma_tara_exempt` fields are
dead configuration, and *apavada > utsarga* — the substance of ruling 3a — is not
actually exercised anywhere in the engine.

**Why no test caught it:** `test_kalaprakasika_agriculture_doctrine.py:146-155`
asserts the registry *field values* (`mantra.janma_tara_exempt == {1,10,19}`) but
never calls `score_day` for either activity. The behavioural janma-tara test
(`test_kalaprakasika_expansion_doctrine.py:291`) uses `HARVEST`, which does have
the bar wired.

**Decision needed (astrologer's, not the code's):** the six chapters that state the
janma-tara passage are listed at `muhurta_activity_registry.py:256-261`. Ch. X
(mantra initiation) and Ch. III (milk feeding) are *not* among them — their pages
state only the *favourable* reading. So either (a) the general bar was never meant
to reach these rites and the exemption fields should be deleted as misleading, or
(b) Ch. XVI p.92's general bar is meant to apply to rites beyond the three now
wired, in which case those activities need `janma_tara_prohibited` populated before
any exemption means anything. **Until that is settled, the doc sentence should be
corrected — it currently claims a behaviour the engine does not have.**

### D-2 · The Sthree Deergham band is not rendered on one of the two web panels 🟠

Same doc, §4b:

> …threaded through `compute_porutham`, `packages/shared`'s `KutaResult` type, and
> both the web (`compatibility-intelligence-panel.tsx`,
> `dashboard-tools-porutham-nova.tsx`) and mobile (`porutham.tsx`) detail panels,
> **which render MADHYAMA/UTTAMA next to the kuta name.**

Two of the three do:
- `dashboard-tools-porutham-nova.tsx:562-564` ✅
- `mobile/app/(tabs)/tools/porutham.tsx:170-172` ✅
- `web/components/compatibility-intelligence-panel.tsx:403-408` ❌ — maps
  `d.poruthamKutas` and renders `k.name` + `ScoreBar` only. No `k.detail`.

The data is available there (`poruthamKutas: KutaResult[]`, and `KutaResult` carries
`detail?: string | null`) — the panel simply doesn't read it.

**This is the worst surface to have missed.** It is the panel where a couple at
count 8–13 now sees a bare **FAIL** on Stree Dirgha where it read PASS last week,
with no MADHYAMA qualifier to explain it — which is exactly the "grading is lost"
outcome the `detail` field was created to prevent.

### D-3 · `UX_BLINDSPOT_HANDOFF_2026-08-23.md` still lists T15 as open 🟡

Line 249 carries no status marker, while T1/T2/T3/T13 in the same file carry ✅.
T15 was closed by `1a20847` on 2026-08-25 (*"close T15, A-024, B-004, B-032/B-033"*).
Cosmetic, but it is the fourth instance of the recurring "status file outlives the
commit that closed it" pattern that `HANDOFF_2026-08-28`'s own closure note calls
out.

---

## 3. Astrology accuracy

### A-1 · The fractional drishti table is wrong at the 4th and 5th houses 🔴 **highest severity**

[`aspects.py:50-52`](../app/calculations/aspects.py#L50), shipped `33427f0`
(2026-08-29) for ruling 6:

```python
_FRACTIONAL_DRISHTI = {3: 0.25, 4: 0.50, 5: 0.75, 7: 1.00, 8: 0.75, 9: 0.50, 10: 0.25}
```

The classical Parashari graded drishti (BPHS: *pādona* on the 4th/8th, *ardha* on
the 5th/9th, *pāda* on the 3rd/10th) is:

| House | Shipped | Classical | |
|---|---|---|---|
| 3 | 0.25 | 0.25 | ok |
| **4** | **0.50** | **0.75** | ❌ |
| **5** | **0.75** | **0.50** | ❌ |
| 7 | 1.00 | 1.00 | ok |
| 8 | 0.75 | 0.75 | ok |
| 9 | 0.50 | 0.50 | ok |
| 10 | 0.25 | 0.25 | ok |

**The 4th and 5th are swapped.** The descending half (8, 9, 10) is exactly right;
only the ascending half is wrong, and the code comment says why — *"the regular
sight rises toward the seventh and falls symmetrically afterwards"*. The classical
table does not ramp monotonically; it pairs **(4,8) = ¾, (5,9) = ½, (3,10) = ¼**.

**The decisive check does not require trusting any text.** Each special-aspect graha
promotes exactly one fractional tier to full — Mars the ¾ pair, Jupiter the ½ pair,
Saturn the ¼ pair. Under the shipped table, two of the three grahas' own special
houses sit at *different* tiers, which is impossible if the special aspects are
promotions:

```
MARS     houses [4, 8]   shipped [0.50, 0.75] INCOHERENT | classical [0.75, 0.75] coherent
JUPITER  houses [5, 9]   shipped [0.75, 0.50] INCOHERENT | classical [0.50, 0.50] coherent
SATURN   houses [3, 10]  shipped [0.25, 0.25] coherent   | classical [0.25, 0.25] coherent
```

**Blast radius — every graha, two live consumers.** The special aspects mask the
error only for the graha that owns that house, so:

- **Sun, Moon, Mercury, Venus, Saturn, Mandhi** are wrong on *both* the 4th and 5th
- **Mars** wrong on the 5th; **Jupiter, Rahu, Ketu** wrong on the 4th

Consumers:
- [`shadbala.py:501`](../app/calculations/shadbala.py#L501) — **Drik Bala**, the very
  calculation this table exists for. An aspector on the 4th contributes 5.0 virupas
  instead of 7.5 (33% understated); on the 5th, 7.5 instead of 5.0 (50% overstated).
  Drik Bala feeds total Shadbala, which ranks planetary strength product-wide.
- [`chart_strength.py:608`](../app/calculations/chart_strength.py#L608) — **Bhava
  Bala** `drishti_score`: 4 instead of 6 on the 4th, 6 instead of 4 on the 5th.

**Why nothing caught it.** `test_drishti_yoga_golden.py` froze only *poorna* targets
— it contains no fractional values at all — and it was regenerated from the new
behaviour, so a wrong table was frozen as correct. The only assertion on the
fractional values, [`test_aspects.py:71`](../tests/test_aspects.py#L71), **pins the
wrong number**:

```python
assert aspect_strength("SUN", 1, 5) == 0.75   # classical: 0.50
```

**Fix:** `{3: 0.25, 4: 0.75, 5: 0.50, 7: 1.00, 8: 0.75, 9: 0.50, 10: 0.25}`, correct
`test_aspects.py:71` to `0.50`, and regenerate the golden fixture *reading the diff*
— per the ruling's own instruction, the diff is the deliverable.

**Note this is a genuine doctrine question, not purely a bug**, in one respect: the
table is attributed to "Kalaprakasika p.245". If p.245 really prints a symmetric
ramp, that is a divergence to record and label, not a swap to fix. But the code
comment reconstructs the values from a symmetry argument rather than quoting them,
and the descending half matches Parashara exactly — which is what a partial reading
plus a plausible-but-wrong intuition looks like. **Worth checking the physical page
before editing**, then either fixing or labelling.

### A-2 · Unassociated Mercury is classed a malefic 🟠

[`aspects.py:127-138`](../app/calculations/aspects.py#L127). The ruling was
*"paksha-Moon + association-Mercury"*; it did not say what an **unassociated**
Mercury should be. The code chose malefic, and `test_aspects.py:85` pins it:

```python
assert effective_natural_class("MERCURY", alone) == "MALEFIC"
```

Neither mainstream classical reading supports this. Parashara's position is that
Mercury is a natural benefic that *becomes* malefic through malefic association
(alone → benefic); the alternative reading makes an unassociated Mercury *neutral*.
Malefic-by-default is the outlier.

Measured over 2,000 sampled days:

```
Mercury classed MALEFIC by the engine  : 85.0%
  ... of which, no co-tenant at all    : 16.0%   <- classical: BENEFIC, engine: MALEFIC
```

So roughly **one chart in six** carries a Mercury the engine calls malefic and the
classical rule calls benefic. Because `effective_natural_class` is the single
benefic set for Kartari, Amala, Adhi, Vasumati, Sunapha/Anapha and *every*
malefic-affliction count, this biases the whole engine harsh — compounding the
already-recorded fact that Ch. XXXIV's neutralizations are unmodelled.

**There is also an internal inconsistency.** In the *same function*, a Moon with
missing context deliberately keeps the benign default ("rather than being silently
turned into a malefic", line 114-115), while a Mercury with no association is turned
malefic. Two opposite default philosophies, three lines apart.

**Needs a ruling**, not a unilateral fix: should unassociated Mercury be BENEFIC
(classical majority), NEUTRAL, or stay MALEFIC as house policy — and if the last,
it should be labelled `[PRODUCT]` the way the node rows now are.

### A-3 · Marriage muhurta has no janma-tara rule at all 🟡

`muhurta_activity_registry.py:258` records Ch. XIV p.86 as stating the personal
janma-tara bar for **marriage** (janma, 3rd, 5th, 7th, 10th, 19th). Marriage is
scored from a separate rules file, [`marriage_muhurta_rules.py`](../app/data/marriage_muhurta_rules.py),
which contains **no janma-tara, janma-nakshatra or birth-star rule whatsoever**
(grep: zero hits). So the highest-stakes election in the product does not check the
native's own birth star, though the book it cites requires it.

This looks like a known partial extraction rather than a regression — the engine
already documents that Ch. XIV's weekday guidance was likewise not extracted
(`muhurta_engine.py:1231-1232`) — so it is logged here as a **scope gap to
schedule**, not a defect introduced in this window.

### A-4 · Sthree Deergham: correct as ruled, but the sweep was never actually run 🟡

The implementation is right. `_stree_dirgha_band()` counts girl → boy inclusively
(`(nak_boy - nak_girl) % 27 + 1`), which is the correct direction, and same-star
gives count 1 → FAIL. The bands and the ≥14 binary fallback match ruling 4b exactly,
and `detail` is carried on the Stree Dirgha kuta only.

But ruling 4b asked for a before/after sweep "read before it ships", and what was
delivered was unit-test boundary assertions. **Here is the sweep** (all 729 pairs):

```
Stree Dirgha passed   : 540 (74.1%)  ->  378 (51.9%)
pairs losing the point: 162 (22.2%)
bands                 : FAIL 189 · MADHYAMA 162 · UTTAMA 378
mean total change     : -0.222 of 10   ->  -0.78 of 100 composite
```

**22.2% of all nakshatra pairs lose this point.** And because item 5 raised Porutham
from 20 to 35 composite points in the same change, each porutham point is now worth
3.5 instead of 2.0 — so an affected couple drops **3.5 composite points**, against
`EXCELLENT ≥ 80` / `GOOD ≥ 65` cutoffs that were tuned on the old mix and were not
retuned. The rulings doc flags this as an open follow-up; the sweep above quantifies
it. Combined with D-2, a fifth of couples get a newly-failing criterion that one of
the two web panels cannot explain.

---

## 4. Claims verified as true

Checked against code, not taken on the doc's word:

| Claim | Verdict |
|---|---|
| Item 1 — Amavasai marriage VETO + `[TRADITION]` provenance | ✅ `marriage_muhurta_rules.py:165-166`, veto branch `muhurta_engine.py:982` |
| Item 2 — `PN-1` node rows relabelled `[PRODUCT]` | ✅ `chart_strength.py:177`, register closed |
| Item 3 — janma-tara **grading** table | ✅ `_JANMA_TARA_GRADES` = 1.0/0.5/0.25 → VETO/PENALTY/PENALTY; −20.0 × grade gives the documented −10.0 for Anu-Jenma; 3c reading recorded as a comment on the table as instructed *(the grading is correct — only the exemptions in D-1 are inert)* |
| Item 4b — Sthree Deergham bands + ≥14 fallback | ✅ correct (see A-4) |
| Item 5 — compatibility weights | ✅ `COMPATIBILITY_LAYER_MAX` sums to exactly 100; Porutham heaviest at 35; Synastry 0 |
| Item 7 — three new yoga cards | ✅ `CHANDALA_KETU_YOGA`, `DHANA_SUPPORTIVE_YOGA`, `DARIDRA_PROXY_YOGA` all present in backend + `yogaDisplay.ts` |
| `KutaResult.detail` generic + on the wire | ✅ backend `porutham.py:500`, `packages/shared/src/types/index.ts:1522` |
| `b2c8a9b` D7/D27/D45 amsa boundary fix | ✅ **and astrologically correct** — a degree on an amsa boundary belongs to the amsa it opens; D7 odd→from the sign, even→from the 7th, and D10 odd→from the sign, even→from the 9th, both correct classical mappings; `EPSILON_DEGREES = 1e-9` is far below any real precision concern |
| `HANDOFF_2026-08-28`'s "nothing left open" | ✅ items 3 and 4b are genuinely shipped |

The `264 passed` figure in the rulings doc could not be reproduced exactly — the
five suites those docs name give **223**. Different suite selection, not a
discrepancy worth chasing.

---

## Recommended order

1. **A-1** — fix the drishti table (check p.245 first, then fix or label) and
   correct `test_aspects.py:71`. Silently wrong Drik Bala and Bhava Bala on every
   chart is the largest live inaccuracy found.
2. **B-1** — two lines in `web/lib/chart-utils.ts`. Gets the build green.
3. **D-2** — render `k.detail` in `compatibility-intelligence-panel.tsx`.
4. **A-2** — rule on unassociated Mercury.
5. **D-1** — rule on whether the general janma-tara bar reaches mantra initiation
   and milk feeding; correct the rulings doc either way.
6. **B-2** — repair the editable install.
7. **A-3** / **A-4 cutoffs** / **D-3** — schedule.

**Standing note that all of this illustrates:** every finding above is silent. Not
one produces an error, and the full suite is green with two wrong doctrine values
and one inert rule in the tree. Where a test exists it pins the wrong number
(A-1) or asserts config rather than behaviour (D-1).
