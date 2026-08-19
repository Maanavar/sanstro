# Bhinnāṣṭakavarga indications counted from the kāraka graha

**Date:** 2026-08-18
**Hats:** Product Owner · Full-stack · Thirukanitham astrologer
**Source under review:** owner's 7-rule proposal (4 core / 3 Nādi), 2026-08-18
**Method:** read from the code, cite `file:line`, code wins over docs.

---

## Verdict in one paragraph

The calculation half of this proposal is already built and has been for months —
`compute_bhinnashtakavarga()` returns the full planet × rāsi bindu table
([ashtakavarga.py:97](../app/calculations/ashtakavarga.py#L97)) and it already ships to
every client ([charts.py:244](../app/schemas/charts.py#L244)). What is missing is one
five-line idea: **a reference point**. Every existing caller counts bindus from Lagna or
from a bhāva's rāsi; not one counts from *the kāraka graha's own rāsi*, which is what all
four core rules require. The gating half is also already built — four independent gates —
but only **one** of the four rules has a surface those gates protect. The owner's instinct
is correct and this document sharpens it in one place: **age is the wrong gate for three
of the four core rules.** Progeny is a forward prediction and needs an age band; siblings,
maternal and paternal relations are claims about facts the reader already knows at every
age, so their failure mode is not inappropriateness but **falsifiability** — and no age
band fixes that, only a rule that never prints a count.

---

# Part 1 — Assessment

## 1.1 What already exists

| Gate | Where | What it does |
|---|---|---|
| Kāraka age band | [karaka_chains.py:12](../app/calculations/karaka_chains.py#L12) | `CHILDREN` = 18–52 → newborn and 80-year-old both get `NOT_APPLICABLE_FOR_AGE` |
| Life-phase relevance | [life_areas_service.py:368](../app/services/life_areas_service.py#L368) | `CHILDREN` present only in `YOUNG_ADULT`/`MID`, with a stage-specific skip reason rather than a blank |
| Propensity band | [propensity_service.py:122](../app/services/propensity_service.py#L122) | `child_timing` = 21–50 + `DISCLAIMER_FERTILITY` |
| Declared-fact gate | [age_phase_service.py:37](../app/services/age_phase_service.py#L37) | `has_declared_children()` — progeny only on explicit `children == "has"`; `None` and `"undisclosed"` never collapse into an answer |

The codebase also already states the governing principle, in a different domain:

> *"Applied as an interpretive overlay at scoring time, not baked into the natal dosham
> calculation itself (which must stay age-independent)."*
> — [age_gate.py:46](../app/core/age_gate.py#L46)

That is exactly the separation this build needs: **the calculation is age-blind; the
disclosure is gated.** This document does not invent a new principle, it applies an
existing one.

## 1.2 The rendering convention is already set

The web already reads bindus and renders them as a **qualitative band, never a number of
people** — `binduReading()` maps 0–8 to
strongly-supported / supported / neutral / thin / very-thin
([dashboard-chart-explanation.tsx:714](../web/components/dashboard-chart-explanation.tsx#L714)).
Any new rule that emits "3 children" or "4 paternal siblings" would be the *only* place in
the product that converts a bindu into a person. It will not be built.

## 1.3 Defect found during assessment — blocking, fixed in this change

`_AREA_TO_CHAIN_KEY` lets a life area borrow another area's kāraka chain
([life_areas_service.py:1318](../app/services/life_areas_service.py#L1318)):

```
"EDUCATION":      "CHILDREN"    # chain age band 18–52
"FAMILY_HARMONY": "PROPERTY"    # chain age band 25+
"LITIGATION":     "CAREER"      # chain age band 16–70
```

The age band travels with the **chain**, not with the **area the reader sees**. So:

- A 10-year-old's **Education** card is phase-relevant
  ([`_PHASE_RELEVANT_AREAS["CHILD"]`](../app/services/life_areas_service.py#L368) contains
  `EDUCATION`), so it is *not* phase-skipped — but the borrowed `CHILDREN` chain returns
  `too_young`, pins the chain score to 30, drags the blended score down by 35 %, and emits
  a **`too_young` chip on a child's education card**.
- The same happens to **Family Harmony** for anyone under 25, via `PROPERTY`.
- **Litigation** is capped at 70 for no reason of its own.

This is not a cosmetic bug and it is a hard prerequisite here: hanging progeny logic on
`chain_key == "CHILDREN"` would leak progeny indications straight into the **Education**
card of a child. The fix is to move the age band off the borrowed chain and onto the area
the reader actually sees.

## 1.4 Rule-by-rule ruling

### Core (build)

| # | Rule | Ruling | Home | Gate |
|---|---|---|---|---|
| 1 | Jupiter BAV → 5th from Jupiter → progeny | **Build.** Guru is putra-kāraka; counting from the kāraka is standard BAV practice | `CHILDREN` life area | Inherits all four gates. Asymmetric — see below |
| 2 | Mars BAV → 3rd from Mars → siblings | **Build.** Sahaja bhāva + bhrātṛ-kāraka agree | `FAMILY_HARMONY` life area | No age gate needed; count-free |
| 3 | Mercury BAV → 4th from Mercury → maternal relatives | **Build.** Budha is mātula-kāraka; this correctly *replaces* the source PDF's Moon-BAV 4th rule | `FAMILY_HARMONY` life area | No age gate needed; count-free |
| 4 | Sun BAV → 9th from Sun → paternal | **Build.** Sūrya is pitṛ-kāraka; 9th is the father's bhāva | `FAMILY_HARMONY` life area | No age gate needed; count-free |

**Why rules 2–4 need no age band.** They are not predictions. A newborn already has however
many siblings they have; an 80-year-old knows their own maternal and paternal families
better than we ever will. Gating them by age would be theatre. What they need — and get —
is the rule that they are rendered as a bindu band and never as a count, because a printed
count is instantly checkable and being wrong costs more trust here than saying nothing.

**Why `FAMILY_HARMONY` is the right home.** It is the one area relevant in *every* life
phase, including `INFANT` and `ELDER`
([life_areas_service.py:368](../app/services/life_areas_service.py#L368)) — which matches
the fact that the reader has a family at every age. It needed the §1.3 fix anyway.

**Progeny is disclosed asymmetrically — deliberate.** The supportive band is emitted; the
thin band is **not**. A chip reading "Jupiter's bindus in the 5th from Jupiter are
supportive" is a harmless chart fact in every case the age band admits. The mirror-image
chip delivered to a 34-year-old who has been trying and failing is not a chart fact to
them, it is a verdict — and it is exactly the reader `DISCLAIMER_FERTILITY` and
`has_declared_children()` were built for. Discouraging fertility content has one home in
this product, the `child_timing` propensity card, which carries a disclaimer and a 21–50
band. It does not get a second, undisclaimed home as a chip. Rules 2–4 emit both bands,
because a thin sibling bindu count is descriptive, not a hope being denied.

### Nādi tier (defer — with reasons)

Rules 5–7 (Mars-associated planets → siblings, Moon-associated → mother's family,
Venus-associated → spouse's family) are **not built in this change**:

1. They have no surface. They need a *labelled auxiliary/Nādi section* — the owner's own
   framing — and no such section exists on any screen. Building the calc without it leaves
   three rules of dead code, which this repo already has a documented history of.
2. Their natural output *is* a count of associated planets. Stripped of the count they say
   very little; kept as a count they violate §1.2.
3. Rule 7 (Venus → spouse's family) repeats a defect we just removed. "Your spouse's
   siblings" **asserts a spouse**, on no evidence, exactly as the old `children` focus code
   asserted children from age and gender alone
   ([age_phase_service.py:60](../app/services/age_phase_service.py#L60)). It would need to
   be gated on `is_married_settled()` / `is_seeking_marriage()`
   ([age_gate.py:61](../app/core/age_gate.py#L61)) the way progeny is gated on
   `has_declared_children()`. That is a real design, just not this change's.

### Rejected outright (agreeing with the owner)

- ❌ Planets 2nd from Sun + 2nd from Jupiter = exact number of children
- ❌ Planets 11th from Venus = exact number of children
- ❌ 5th-lord navāṁśa sign → count to navāṁśa Lagna = children
- ❌ Moon BAV → 4th from Moon → mother's siblings *(superseded by rule 3)*

---

# Part 2 — Build plan

### Phase 0 — prerequisite (§1.3)
Move the age band from the kāraka chain onto the life area. `_AREA_AGE_BAND` in
`life_areas_service.py`; `_karaka_chain_score()` takes explicit `age_min`/`age_max` and
falls back to the chain's own values when not supplied, so no existing caller changes
behaviour except the three mis-banded areas.

### Phase 1 — calculation (pure, age-blind)
New `app/calculations/bav_derived.py`:
- `bav_house_from_planet()` — bindus in the *n*th rāsi counted from a graha's own natal
  rāsi, 1-based inclusive (the graha's own rāsi is the 1st), matching the convention in
  `compute_bhinnashtakavarga` itself.
- `BAV_DERIVED_RULES` — the four rules as data, each carrying its kāraka, its house, and
  its domain.
- `expected_bindus()` / `classify_bindu_band()` — `STRONG` / `NEUTRAL` / `THIN`, judged
  against **each rule's own baseline**, not a flat cut. See §3 — this was rewritten
  mid-build after measurement.
- `compute_bav_derived_indications()` — all four, always. No gating in this layer.

### Phase 2 — disclosure (gated)
`life_areas_service.py` maps indications onto the existing, already-rendered
`supportingFactors` / `blockingFactors` mechanism, keyed on **`area`, never `chain_key`**.
`NEUTRAL` emits nothing. Progeny emits the supportive band only.

### Phase 3 — surfaces
`web/components/life-area-card.tsx` — bilingual labels for the new factor codes. Mobile
does not render factors, and unknown codes already degrade gracefully
([life-area-card.tsx:62](../web/components/life-area-card.tsx#L62)), so no contract break
either way.

### Phase 4 — tests
`tests/test_bav_derived.py` — the counting convention, the bands, the four rules, the
age-band regression from §1.3, and the asymmetric progeny disclosure.

---

---

# Part 3 — What measurement changed

The plan above specified a flat band cut — `STRONG ≥5 / THIN ≤3` — copied from the web's
existing `binduReading()`. Before wiring it, the band distribution was swept over 5,000
synthetic charts. It was wrong, and badly:

| Rule | Flat cut ≥5/≤3 | Corrected |
|---|---|---|
| progeny (Guru, 5th) | 34 % strong · 31 % neutral · 34 % thin | 34 / 31 / 34 |
| **siblings (Sevvai, 3rd)** | **7 % strong · 18 % neutral · 74 % thin** | **25 / 56 / 17** |
| maternal (Budhan, 4th) | 29 / 30 / 39 | 29 / 55 / 14 |
| paternal (Suriyan, 9th) | 45 / 30 / 24 | 17 / 57 / 24 |

**Three quarters of all readers would have been told their sibling indication is thin** —
and it would have been a property of Sevvai's table, not of anybody's chart.

Two causes, both structural, both now derived analytically at import from `BAV_TABLE`
rather than hand-tuned:

1. **The grahas' BAV totals differ.** Guru 56, Budhan 54, Suriyan 48, Sevvai 39. The same
   five bindus is above average for Sevvai and below average for Guru.
2. **The self term is deterministic, and only one rule collects it.** A graha's own row is
   counted from its own rāsi, so its contribution is fixed, not probabilistic. The 9th
   *is* in Suriyan's own row, so the paternal rule always banks that bindu. The 5th, 3rd
   and 4th are absent from Guru's, Sevvai's and Budhan's own rows, so those three never
   do. That is a permanent one-bindu head start for the paternal rule alone, and it is
   why a flat cut read 45 % of fathers' indications as strong.

Resulting baselines — progeny **4.00**, siblings **2.67**, maternal **3.83**, paternal
**4.33** — with a ±1 bindu margin around each. A regression test now caps any disclosed
band at 50 % of charts, so this cannot silently return.

**Caveat, and an open astrologer question.** The baseline treats the seven non-self
reference points as uniformly distributed around the zodiac relative to the kāraka. The
self term — the larger distortion — is exact, but the uniform assumption is least true for
Budhan and Sukran, which never stray far from Suriyan. If that materially skews the
paternal baseline in real charts, the fix is to derive baselines from the live chart
corpus rather than analytically.

---

## Owner decisions still open

1. **Baseline method.** The ±1-bindu margin around an analytically-derived baseline is a
   judgement call; the baselines themselves are not. Confirm the margin, and whether the
   uniform-position caveat above warrants a corpus-derived baseline instead.
2. ~~**Nādi section.** Do rules 5–7 get a labelled auxiliary section, and on which screen?~~
   **Answered 2026-08-18 — parked, with the conditions written down.** Rules 5–7 stay
   unbuilt until *both* preconditions exist, and they are now stated as doctrine
   (`OUT-07` in the external-review rulebook) rather than as an open question that
   decays into someone building them: a labelled auxiliary/Nādi section to hang them
   on, and — for rule 7 — a marital-status gate matching the `has_declared_children()`
   pattern. Recording them as an explicit non-claim also means an external reviewer
   sees what we *chose* not to implement, which is more useful than silence.
3. **Rule 7 gate.** Confirm spouse-family indications should follow the
   `has_declared_children()` pattern against marital status.
4. **Chip length.** The approved Tamil measures 94–114 characters per label (English 72–89),
   rendered in a 0.75 rem chip
   on a card that shows at most three. The astrologer offered a shorter traditional register
   — `பிந்து பலம்` for `பிந்துக்கள்`, `பலமளிக்கின்றன` for `நல்ல வலிமை அளிக்கின்றன` — which
   would cut roughly a quarter. Decide against the rendered card, not in the abstract.

---

## Status

| Phase | State |
|---|---|
| 0 · age band moved onto the area | **Done** — `_AREA_AGE_BAND`; fixes the child-Education, under-25 Family-Harmony and Litigation-at-70 defects |
| 1 · `bav_derived.py` calculation | **Done** — four rules, per-rule baselines, count-free |
| 2 · gated disclosure into life areas | **Done** — keyed on `area`, asymmetric for progeny |
| 3 · web labels | **Done** — 7 bilingual factor labels, Tamil approved by the astrologer 2026-08-18; mobile renders no factors |
| 4 · tests | **Done** — 36 unit + 6 end-to-end |
| — · Nādi rules 5–7 | **Not built** — see §1.4; now a recorded non-claim (`OUT-07`) rather than an open question |
| 5 · P2-05 ruled + boundary enforced | **Done 2026-08-18** — see §4 below |

Verification: full backend suite **3343 passed, 13 skipped, 0 failed** (1:08:28, coverage
89.96 %); the 13 skips are pre-existing (WI-07 sunrise reference values still pending, and
one non-object response schema). `ruff` clean on the changed files; `tsc --noEmit` clean on
`web/`.

Note for whoever runs these next: CLAUDE.md's SQLite test path is stale —
`tests/conftest.py` now hard-requires the Docker `vinaadi_test` DB on :5433 and refuses
`pytest_local_test.db`. Do not run two pytest sessions against it concurrently; both reset
the schema and the results are garbage.

---

# Part 4 — The gap this build left, and closing it (2026-08-18)

Four gates now stand in front of the kāraka-relative readings. All four live in
`life_areas_service`, and all four are reached through one function,
`disclosable_indications()`. Every one of them is bypassed by a single import.

`compute_bav_derived_indications()` is public, age-blind by design, and hands back objects
with `.band` already filled in. Meanwhile `ashtakavarga.py` carried an open
`TODO(product): decide fate — P2-05` proposing a **bindu grid on the Jādhagam screen**, and
the raw table has shipped to every client on `ChartSummaryData.ashtakavarga` all along.

That grid is exactly where these rules would go next, and it is the one surface where not
one of the four gates applies. Whoever builds it will want a cell to *mean* something, will
find the compute function sitting right there, and will read `.band` off it — and nothing in
a diff of the grid's own file would look wrong. The gates were built and the hole beside
them was left open.

## The ruling (DOCTRINE §13)

**A bindu grid states a count. It never states a subject.**

| | Bindu table | Kāraka-relative reading |
|---|---|---|
| What it is | A measurement, like a longitude | A claim about a named relative |
| Changes with age? | No | No — but its *appropriateness* does |
| Failure mode | None — it is arithmetic | **Falsifiable.** The reader knows their own siblings |
| Gate | None, correctly | All four, via `disclosable_indications()` |
| Ships on | `ChartSummaryData.ashtakavarga` | Life-area `supportingFactors` / `blockingFactors` |

So the grid is **approved and ungated** — it is part of a chart's face, printed beside the
rāsi and navāṁśa charts in any almanac, and "keep it internal-only" was never the status quo
on offer; it would have been a removal breaking the peyarchi bindu line. What the grid may
never acquire is a band word, a life-domain label, or a highlight on "the 5th from Guru".

## Making it a test rather than a paragraph

A paragraph is what gets bypassed. `tests/test_bav_disclosure_boundary.py` asserts five
things, each with a failure message naming the ruling and the alternative:

1. **Import allow-list.** `bav_derived` may be imported by `life_areas_service` alone — the
   one caller that owns both age gates, keyed on the area the reader sees. The message tells
   a grid-builder to import `ashtakavarga` instead, which is ungated on purpose. The
   allow-list is also checked for staleness in the other direction.
2. **Compute-without-disclose.** Any module calling `compute_bav_derived_indications()` must
   also call `disclosable_indications()`. The pair is what makes the age-blind layer safe.
3. **The grid payload stays numeric.** `ChartSummaryData.ashtakavarga` must remain
   `dict[str, dict[int, int]]` — catches the same bypass arriving through the schema rather
   than through an import.
4. **No `schemas/` or `api/` reach-through.** A gated reading in a response model has
   escaped the life area that was deciding whether to show it, and no client can put it back.
5. **Bilingual copy for every disclosable code.** `life-area-card.tsx` humanises unknown
   codes, which is right for an unknown code and wrong for one we ship: a fifth rule added
   without copy would show a Tamil reader "Paternal Bav Thin". The test asks the disclosure
   layer which codes are reachable, so `progeny_bav_thin` correctly needs none.

## Found while wiring guard 1

`ast.parse(path.read_text(encoding="utf-8"))` died on `U+FEFF`: two `app/` sources carried a
UTF-8 BOM, and a sweep found **38 across `app/`, `web/` and `docs/`**. Python's tokenizer
strips a BOM from a module it imports, so nothing had ever failed at runtime — but anything
reading source *as text* hits the wall, which is how a BOM previously hid the 38 heaviest
files during the F7 bundle audit. `test_text_encoding_guard.py` checked mojibake but not
BOMs, though both come from the same accident (a PowerShell `Get-Content`/`Set-Content`
round-trip). BOMs stripped, and the missing half added to the existing guard rather than to a
new one.

## Also closed

`equal_bhava.py` and `divisional_charts.py` carried the same `TODO(product): decide fate —
P2-05`, and both were **already shipped** — divisional charts in `mobile/app/vargas/`, equal
bhāva in `dashboard-vargas-panel.tsx` as a labelled secondary lens listing only the grahas
whose bhāva differs from their rāsi. The notes were stale, not open. The equal-bhāva framing
is doctrine and now says so in the file: whole-sign is the primary engine (§6), so a parallel
house grid would hand the reader two contradictory house numbers per graha with no way to
tell which one the app's own text used.

---

Not committed.
