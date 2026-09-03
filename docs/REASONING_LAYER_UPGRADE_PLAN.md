# Vinaadi AI — Reasoning Layer Upgrade Plan

> **Author role:** Software architect + product designer + owner + chief Thirukanitham specialist
> **Status:** PR-1 (Phase 0 + Phase 1) BUILT 2026-07-03 — flag `reasoning_gate` **internal rollout** as of 2026-07-03 per §8 rollout order step 2 (thresholds signed off 2026-07-03, §11); watch for over-suppression before promoting to beta; golden-set expansion to ~20 still owed before beta (scaffold ready, see §7 / `tests/golden/reasoning/GOLDEN_SET_WORKSHEET.md`). PR-2 (Phase 2) BUILT 2026-07-03 — flag `reasoning_bands` OFF (see §12), next in rollout order after gate reaches beta. PR-3 (Phase 4 data spine) BUILT 2026-07-03 — flag `reasoning_calibration_log` **ON** as of 2026-07-03 per §8 rollout order step 1 (silent-launch collection started; see §13). PR-4 (Phase 3 contradiction engine) BUILT 2026-07-03 — flag `reasoning_contradiction` OFF, **pending chief-specialist sign-off on the reading templates and WEAK-gate framing** (review packet in §15); ships last per §8 since it's a no-op without the gate. PR-5 (Phase 5 chart signature + root-cause chains) BUILT 2026-07-04 — flag `reasoning_chart_signature` OFF (see §16); wired into `life_areas_service` only (chart-level dominant-graha framing + per-area causal chain for LOW-confidence areas), whatif/marriage surfaces deferred. Phase 6 not started.
> **Created:** 2026-07-03
> **Companion docs:** [`THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md`](./THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md) (knowledge layer), this doc (reasoning layer)

---

## 0. One-paragraph thesis

Our **knowledge layer is excellent** (~9/10): we compute Rasi, Vargas, five dasha systems,
Ashtakavarga, Shadbala, Atmakaraka, transits, Tajaka, synastry — per-domain, in Tamil
Thirukanitham tradition. Our **reasoning layer is where a world-class astrologer lives**, and
today it is only ~4.5/10. A master is not distinguished by knowing more techniques; they are
distinguished by **how they decide**: they gate on *promise* before they weigh *timing*, they
speak in *honest confidence bands* not false percentages, they *investigate contradictions*
instead of averaging them, and — the one thing that separates a real expert engine from an
articulate rule engine — they **keep score against reality and recalibrate**.

This plan turns the reasoning layer from a flat additive scorer into an **expert decision
kernel**, in six phases, each shippable independently, each mapped to concrete files, schemas,
tests, and product value.

---

## 1. Why now (grounded current-state audit)

A codebase audit (not just the design docs) found the reasoning gaps are concrete and located:

| Principle a master uses | Where we stand | Evidence in code |
|---|---|---|
| **Promise cannot be overridden by timing** (hard gate) | ❌ Named, not enforced | [`prediction_score.py:110`](../app/calculations/prediction_score.py#L110) — `total = l1+l2+l3+l4+l5+l6`; a zero-promise chart can still score 70 on timing alone |
| **Gate → then weighted vote** | 🟡 Only in one place, soft | [`whatif_service.py:558-566`](../app/services/whatif_service.py#L558) — weighted sum + a soft AND-floor of 50 |
| **Ordinal confidence, not false precision** | 🟡 Ordinal at output, numeric guts, and `X/100` still shown to users | [`daily_guidance_service.py:493`](../app/services/daily_guidance_service.py#L493); numeric leaks in [`narrative_engine.py`](../app/services/narrative_engine.py) |
| **"Not indicated" ≠ "insufficient confidence"** | 🟡 Applicability gates yes, SILENT state no | [`marriage_service.py:68`](../app/services/marriage_service.py#L68) |
| **Contradiction analysis** | ❌ Averages, never investigates | supports[]/challenges[] summed into one score everywhere |
| **Promise vs timing separated** | 🟡 Concepts split then re-merged | [`whatif_service.py:782`](../app/services/whatif_service.py#L782) |
| **Domain-specific frameworks** | ✅ Strong | [`life_areas_service.py:259`](../app/services/life_areas_service.py#L259) `_AREA_ROUTING` (houses+karaka+varga per area) |
| **Chart-specific dominant themes** | ❌ Absent | no "this is a Saturn chart" signature drives interpretation |
| **Root-cause chains** | ❌ Flat lists | `list[AstroFactor]` never linked causally |
| **Calibration / outcome loop** | 🟡 Collected, never closed | [`life_event_log_service.py`](../app/services/life_event_log_service.py) + [`retrospective_service.py`](../app/services/retrospective_service.py) log & correlate, but nothing scores past predictions vs outcomes |

**Two structural advantages we already have** and will build on:
1. `_AREA_ROUTING` / `_SCENARIO_KARAKA` — the domain-framework backbone the tradition prizes.
2. `retrospective` + `life_event_log` + `rectification_service.validate_chart_against_events` —
   the raw material for a calibration loop is already flowing; we just never close it.

---

## 2. Design doctrine (the rules every phase obeys)

These are non-negotiable principles. Treat them like the DB-safety rules in `CLAUDE.md`.

### D1 — Gate before vote (promise is a veto, not a weight)
Birth promise is a **hard gate**. If the natal chart does not promise an event, no dasha, transit,
or ashtakavarga can manufacture it. Only charts that **pass the gate** proceed to a weighted
timing vote. Additive scoring *across* the gate is the "averaging error" and is banned.

```
verdict = GATE(promise) THEN WEIGHTED_VOTE(dasha, transit, varga, ashtakavarga)
```

### D2 — Ordinal honesty (bands, not decimals)
Public confidence is an **ordinal band**, never a percentage. Internal integer scores may exist for
computation but **must not surface** in user copy. Bands:

`STRONG · LIKELY · MIXED · WEAK · BLOCKED · SILENT`

### D3 — Distinguish silence from denial (epistemic limit)
- **BLOCKED** = the chart actively denies it (promise gate failed, or strong affliction).
- **SILENT** = the chart is quiet — insufficient signal to say. This is *not* the same as "no."
- A system that can say *"the chart supports the year but not the month, for anyone"* is more
  credible than one that always emits a figure.

### D4 — Contradictions are investigated, not averaged
When pillars disagree, classify *why*:
- **Promise present + timing absent** → *"promised but not now"* (wait).
- **Promise absent + timing present** → *"active period, but not this event"* (redirect).
- **All aligned** → high confidence. **All silent** → SILENT.

### D5 — The loop must close (accountability over consistency)
Every material prediction is logged with its window and band. When a real outcome arrives, we
join, score hit/near/miss, and **recalibrate**. The engine is accountable to its own hit-rate, not
only to tradition. *If we build only one thing beyond techniques, we build this.*

### D6 — Non-fatalistic, bilingual, always (existing rule, keep it)
Keep the `tone_validator` guarantee ([`narrative_engine.py:1050`](../app/services/narrative_engine.py#L1050)).
Every new string is Tamil + English, UTF-8 no BOM.

---

## 3. Target architecture

Introduce a **reasoning kernel** — a thin, pure, well-tested module every domain service calls,
so the doctrine is enforced in *one* place instead of re-implemented per surface.

```
app/
  calculations/            # KNOWLEDGE LAYER (unchanged, keep excellent)
    ephemeris, dasha, ashtakavarga, shadbala, vargas, transits ...
  reasoning/               # NEW — REASONING KERNEL (the "how a master thinks" layer)
    __init__.py
    verdict.py             # Verdict, Band, GateResult dataclasses + ordinal helpers
    promise_gate.py        # D1: promise assessment → PASS / WEAK / BLOCKED / SILENT
    timing_vote.py         # D1: weighted vote over dasha/transit/varga/ashtakavarga
    contradiction.py       # D4: pillar disagreement classifier
    chart_signature.py     # dominant-theme detector (Phase 5)
    calibration.py         # D5: hit/near/miss scoring + weight adjustment (Phase 4)
  services/                # DOMAIN FRAMEWORKS call the kernel, own their karakas/houses
    marriage_service.py, career_service.py, life_areas_service.py, whatif_service.py ...
  models/
    prediction_log.py      # NEW — D5 accountability table
```

**Key invariant:** domain services keep their Thirukanitham knowledge (which house, which karaka,
which varga — already in `_AREA_ROUTING`). The kernel owns the *decision procedure*. This is the
"knowledge layer vs reasoning layer" separation the tradition-expert recommended.

---

## 4. Phased roadmap

Each phase is independently shippable and independently valuable. Ship in order; do not skip D1.

| Phase | Name | Doctrine | Effort | Ships value |
|---|---|---|---|---|
| **0** | Reasoning kernel primitives | D2, D3 | S | Shared types; no behaviour change |
| **1** | Promise gate | D1 | M | Predictions stop over-promising; correctness ↑ |
| **2** | Ordinal confidence unification | D2, D3 | M | Honest, consistent confidence; SILENT/BLOCKED |
| **3** | Contradiction & promise-vs-timing | D4 | M | "Promised but not now" readings — feels expert |
| **4** | **Calibration loop** | D5 | L | Accountability, hit-rate, self-correction ⭐ |
| **5** | Chart signature + root-cause chains | — | L | "Your chart revolves around Saturn" synthesis |
| **6** | Hypothesis / falsification (advanced) | — | XL | Master-level reasoning; optional |

---

### Phase 0 — Reasoning kernel primitives (foundation)

**Goal:** create the shared vocabulary. No behaviour change yet; this de-risks every later phase.

**Steps**

1. Create `app/reasoning/verdict.py`:

   ```python
   from __future__ import annotations
   from dataclasses import dataclass
   from enum import Enum

   class Band(str, Enum):
       STRONG  = "STRONG"    # promised + timing aligned
       LIKELY  = "LIKELY"
       MIXED   = "MIXED"
       WEAK    = "WEAK"
       BLOCKED = "BLOCKED"   # chart denies it (D3)
       SILENT  = "SILENT"    # chart is quiet — insufficient signal (D3)

   # Ordinal rank for comparisons; never expose the int to users (D2).
   _RANK = {Band.BLOCKED: 0, Band.SILENT: 1, Band.WEAK: 2,
            Band.MIXED: 3, Band.LIKELY: 4, Band.STRONG: 5}

   @dataclass(frozen=True, slots=True)
   class BiText:
       ta: str
       en: str

   @dataclass(frozen=True, slots=True)
   class Verdict:
       band: Band
       promise_passed: bool          # did the gate pass?
       reason: BiText                 # why this band (D2 requires a reason)
       timing_window_start: "date | None" = None
       timing_window_end: "date | None" = None
       # internal only — MUST NOT be rendered in user copy (D2)
       _debug_score: int | None = None
   ```

2. Map legacy `HIGH/MEDIUM/LOW` → `Band` in one helper so existing schemas keep working during
   migration (`STRONG/LIKELY → HIGH`, `MIXED → MEDIUM`, `WEAK/BLOCKED/SILENT → LOW`).
3. Unit-test the ordinal ranking and the legacy mapping.

**Files:** new `app/reasoning/verdict.py`, `tests/reasoning/test_verdict.py`.
**Contract impact:** none yet (internal).
**Definition of done:** kernel imports cleanly; 100% branch coverage on `verdict.py`.

---

### Phase 1 — Promise gate (the highest-correctness, lowest-cost fix)

**Goal:** enforce D1. Promise gates; timing only votes for charts that pass. This directly fixes
[`prediction_score.py:110`](../app/calculations/prediction_score.py#L110) and the soft floor in
[`whatif_service.py:564`](../app/services/whatif_service.py#L564).

**Astrological definition of the gate (chief-specialist spec)**
A life area is **PROMISED** when *both*:
- The relevant **bhava** (house) and its **lord** are not fatally afflicted (not in dusthana 6/8/12
  from lagna *and* combust/debilitated without cancellation), **and**
- The area's **karaka** holds a supportive dignity in **D1 and the area's varga** (e.g. D9 for
  marriage, D10 for career — we already route these in `_AREA_ROUTING`).

Grades:
- **PASS** — both conditions hold → proceed to timing vote.
- **WEAK** — one condition holds → proceed, but cap final band at `LIKELY` and add a caveat.
- **BLOCKED** — bhava lord fatally afflicted *and* karaka debilitated in both D1 & varga → return
  `Band.BLOCKED`, confidence near zero, **do not** run the timing vote.
- **SILENT** — karaka/lord data missing or genuinely neutral on every axis → `Band.SILENT`.

**Steps**

1. `app/reasoning/promise_gate.py`:

   ```python
   def assess_promise(*, bhava_lord_house: int, bhava_lord_afflicted: bool,
                      karaka_dignity_d1: str, karaka_dignity_varga: str,
                      karaka_available: bool) -> GateResult:
       if not karaka_available:
           return GateResult(grade="SILENT", ...)
       lord_ok = bhava_lord_house not in {6, 8, 12} and not bhava_lord_afflicted
       karaka_ok = karaka_dignity_d1 in FRIENDLY and karaka_dignity_varga in FRIENDLY
       if lord_ok and karaka_ok:      return GateResult("PASS", ...)
       if not lord_ok and not karaka_ok and bhava_lord_afflicted:
                                       return GateResult("BLOCKED", ...)
       if lord_ok or karaka_ok:        return GateResult("WEAK", ...)
       return GateResult("SILENT", ...)
   ```

2. Refactor `compute_prediction_score` ([`prediction_score.py`](../app/calculations/prediction_score.py))
   to run the gate on L1 **first**:
   - Compute `l1_birth_promise` as today, but convert it to a `GateResult`.
   - If `BLOCKED`/`SILENT` → return early with that band, `total` clamped near 0, and skip L2–L6.
   - If `PASS`/`WEAK` → compute the **timing vote** = weighted L2..L6 (this becomes the "when/how
     strong", not "whether"). `WEAK` caps the band at `LIKELY`.
   - **Never** add L1 into the timing total again — the gate already consumed it.

3. Apply the same shape to `whatif_service._overall_verdict`
   ([`whatif_service.py:554`](../app/services/whatif_service.py#L554)): replace the weighted-sum +
   soft-floor with `gate(natal) → vote(dasha, gochar, panchangam)`. Promise weight (`0.25`) is
   removed from the vote — promise is no longer a vote member, it is the gate.

4. `marriage_service` already early-returns on applicability gates (age/relationship). Add the
   **astrological** promise gate after those, before the `score = 50 ± deltas` block
   ([`marriage_service.py:140`](../app/services/marriage_service.py#L140)).

**Product effect:** a chart that never promised, say, foreign settlement will read *"the chart does
not strongly promise this — even in a good dasha"* instead of a cheerful 72/100. This is the single
biggest credibility upgrade with domain experts.

**Tests (golden cases — see §8):**
- A hand-picked "denied marriage" chart → `BLOCKED`, and a strong Venus dasha **does not** lift it.
- A "delayed marriage" chart → `PASS` gate but timing vote low now, higher later.
- Regression: charts that were `STRONG` for genuinely promised+timed events stay `STRONG`.

**Contract impact:** response gains `band` (additive, backwards-compatible); keep `confidence`
HIGH/MED/LOW derived from `band` for one release so mobile/web don't break. Update all four
surfaces per `CLAUDE.md` API-contract rule when you *remove* the legacy field later.

---

### Phase 2 — Ordinal confidence unification + kill false precision

**Goal:** enforce D2 + D3 everywhere. One confidence vocabulary, no `X/100` in user copy, and a real
SILENT/BLOCKED distinction.

**Steps**

1. Route **all** confidence through `Band`. Today three services derive confidence three ways
   (signal-count in daily guidance, score-bands in marriage, verdict thresholds in whatif). Replace
   each with `Verdict.band`.
2. **Strip numeric scores from all user-facing strings.** Grep and remove `X/100` render sites:
   - [`narrative_engine.py`](../app/services/narrative_engine.py) — `(Panchangam score: …/100)`,
     `(Gochar score: …/100)`, `({score}/100)` in `_SUMMARY_TEMPLATES`, `build_strength_narrative`.
   - [`life_areas_service.py`](../app/services/life_areas_service.py) — `_build_area_reason` ends
     with `({score}/100)`.
   - [`whatif_service.py`](../app/services/whatif_service.py) — `({overall_score}/100)`.
   Replace with the band word: *"strongly supported"*, *"steady"*, *"needs attention"*, plus the
   existing reason clause. Keep the integer in the API response as an **optional debug field**
   gated behind an admin/QA flag, never shown in the app.
3. Add the **SILENT** copy family to `narrative_engine` — a distinct, honest voice:
   *TA:* "இந்த கேள்விக்கு ஜாதகம் அமைதியாக உள்ளது — உறுதியான கணிப்பு தர போதிய சமிக்ஞை இல்லை."
   *EN:* "The chart is quiet on this question — there isn't enough signal for a confident call."
4. Keep `tone_validator` green; add SILENT/BLOCKED phrasings to its allowed-tone tests so we never
   drift into fatalism ("BLOCKED" must read as *"not indicated / redirect"*, never *"doomed"*).

**Product effect:** the whole app speaks one honest language. A `78` never implies a calibration we
can't defend. Users trust *"strong / quiet / not indicated"* more than a suspiciously precise number.

**Contract impact:** `confidenceReason` already bilingual — keep. Deprecate any client that renders
raw score; coordinate `packages/shared`, `mobile/src/api`, `web` in the same change.

---

### Phase 3 — Contradiction engine & promise-vs-timing

**Goal:** enforce D4. Stop averaging disagreeing pillars; classify the disagreement.

**Steps**

1. `app/reasoning/contradiction.py`:

   ```python
   def classify(promise: GateResult, timing_band: Band) -> Reading:
       if promise.grade in ("BLOCKED",):        return Reading.NOT_PROMISED
       if promise.grade == "PASS" and timing_band <= Band.WEAK:
                                                 return Reading.PROMISED_NOT_NOW   # wait
       if promise.grade in ("WEAK","SILENT") and timing_band >= Band.LIKELY:
                                                 return Reading.ACTIVE_BUT_UNPROMISED  # redirect
       if promise.grade == "PASS" and timing_band >= Band.LIKELY:
                                                 return Reading.PROMISED_AND_TIMED
       return Reading.MIXED
   ```

2. Each `Reading` maps to a distinct narrative template (bilingual) in `narrative_engine`:
   - `PROMISED_NOT_NOW` → *"This is promised in your chart, but the timing isn't active yet. The
     window opens around …"* (compute next-improvement date — we already have
     `_find_next_improvement_date` in [`life_areas_service.py:476`](../app/services/life_areas_service.py#L476)).
   - `ACTIVE_BUT_UNPROMISED` → *"This is an active period, but your chart points the energy toward
     [dominant area] rather than [asked area]."*
   - `NOT_PROMISED` → SILENT/BLOCKED voice from Phase 2.
3. Wire whatif and life-areas to attach the `Reading` to their response, and to choose the template
   accordingly instead of the current band-only branch.

**Product effect:** this is the moment the engine *sounds like a master*. "Promised but not now" vs
"active but not this" is exactly the discrimination beginners can't make and experts are paid for.

**Contract impact:** add `reading` enum to life-area / whatif responses (additive).

---

### Phase 4 — The calibration loop ⭐ (the one that matters most)

**Goal:** enforce D5. Close prediction → outcome → recalibration. We already collect outcomes; we
just never score ourselves against them.

**Data model** — new `app/models/prediction_log.py`:

```python
class PredictionLog(TimestampMixin, Base):
    __tablename__ = "prediction_log"
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    chart_id: Mapped[UUID] = mapped_column(ForeignKey("charts.chart_id", ondelete="CASCADE"))
    life_area: Mapped[str] = mapped_column(String(32))         # CAREER, RELATIONSHIPS, ...
    reading: Mapped[str] = mapped_column(String(32))           # PROMISED_AND_TIMED, ...
    band: Mapped[str] = mapped_column(String(16))              # STRONG/LIKELY/... (ordinal)
    window_start: Mapped[date | None]
    window_end: Mapped[date | None]
    active_maha: Mapped[str | None] = mapped_column(String(16))
    active_antar: Mapped[str | None] = mapped_column(String(16))
    # filled later by the outcome join:
    outcome_event_id: Mapped[UUID | None] = mapped_column(ForeignKey("user_life_events.id", ondelete="SET NULL"))
    outcome_grade: Mapped[str | None] = mapped_column(String(8))   # HIT / NEAR / MISS
    calc_version: Mapped[str] = mapped_column(String(64))
```

Register it in [`app/models/__init__.py`](../app/models/__init__.py) and write a **reversible**
Alembic migration (`downgrade()` mandatory per `CLAUDE.md`), tested on the test DB first.

**Steps**

1. **Write on serve.** When life-areas / whatif / marriage emit a material prediction with a
   window, persist a `PredictionLog` row (fire-and-forget, best-effort, never block the response —
   mirror the try/except pattern in [`life_event_log_service.py:147`](../app/services/life_event_log_service.py#L147)).
2. **Join on outcome.** When a user logs a `UserLifeEvent`
   ([`life_event_log_service.py`](../app/services/life_event_log_service.py)), match it to open
   `PredictionLog` rows for the same chart + mapped life area whose window brackets the event date:
   - event inside window → `HIT`
   - within ±N months of window → `NEAR`
   - opposite band (we said BLOCKED, it happened) → `MISS`
   Store `outcome_event_id` + `outcome_grade`. Reuse the event→area mapping already in
   [`retrospective_service.py:32`](../app/services/retrospective_service.py#L32) (`_EVENT_HOUSES`)
   and the dasha correlation already in `life_event_log_service._correlate`.
3. **Report hit-rate.** `app/reasoning/calibration.py` aggregates per life-area, per band, per
   dasha lord: `hit / (hit+near+miss)`. Expose read-only via `app/api/admin.py` (admin-only) as a
   calibration dashboard: *"Marriage STRONG predictions: 71% hit, 12% near, 17% miss (n=41)."*
4. **Recalibrate (closed loop).** Once n is meaningful (e.g. ≥30 per bucket), nudge the timing-vote
   weights toward what actually predicts hits — start with a manual, reviewed adjustment (owner +
   specialist sign-off), not auto-tuning. Log every weight change with the calibration snapshot
   that justified it. This is the honest, falsifiable core the whole product can be proud of.

**Product effect & moat:** we can *truthfully* say "our marriage-timing calls hit 71% within the
window." No astrology app does this. It is a marketing asset, a trust asset, and an engineering
feedback signal simultaneously. It also feeds birth-time rectification
([`rectification_service.py`](../app/services/rectification_service.py)) with far richer signal.

**Privacy:** `PredictionLog` is derived astrological data, but it references life events (sensitive).
Follow the existing PII posture — `ondelete` cascade/SET NULL like
[`feedback.py`](../app/models/feedback.py); never store raw event descriptions in the log, only the
typed area + grade. Synthetic-only in tests/fixtures (`CLAUDE.md` rule).

**Contract impact:** admin-only endpoint (new); no consumer-app contract change. Add
`packages/shared` client only if the app ever surfaces "our accuracy" publicly (a later product call).

---

### Phase 5 — Chart signature (dominant themes) + root-cause chains

**Goal:** synthesis. "50 observations → one story", and flat factor lists → causal chains.

**Steps**

1. `app/reasoning/chart_signature.py` — detect the chart's dominant force from data we already
   compute: Atmakaraka (highest-degree planet), most-aspected planet, strongest Shadbala, tightest
   dasha concentration. Output e.g. `Signature(dominant="SATURN", motif="delay_then_reward")`.
2. Feed the signature into **every** narrative as a framing sentence:
   *"Your chart revolves around Saturn — meaningful gains arrive after delay and discipline."*
   This is the "read everything through the dominant planet" skill the tradition-expert flagged.
3. Root-cause chains: change `astrological_factors` from a flat `list[AstroFactor]` to an ordered
   causal chain when confidence is low, e.g.
   `7th lord in 8th → D9 confirms weakness → Venus combust → 7th-lord dasha not until 2029`.
   Render as *"because … → therefore …"* rather than parallel bullet points.

**Product effect:** readings stop feeling like a checklist dump and start feeling authored. Highest
qualitative lift in perceived expertise.

---

### Phase 6 — Hypothesis generation & falsification (advanced, optional)

**Goal:** the master's `Generate → Test → Reject → Confirm` loop.

**Steps (design sketch only — commit after Phases 1–4 prove out):**
1. For a question, generate 2–3 competing hypotheses (e.g. *delayed* vs *denied* vs *early*
   marriage) as structured objects.
2. For each, gather supporting and **disconfirming** evidence across D1/D9/dasha/transit/ashtakavarga.
3. Reject hypotheses whose disconfirming evidence dominates; surface the surviving one *with the
   rejected alternatives noted* ("not denied — the 7th lord is dignified; delayed — dasha activates
   in 2029"). This is falsification (#10) + hypothesis reasoning (#1) made concrete.

Keep this behind a flag; it is the most compute- and QA-intensive and least necessary for value.

---

## 5. Data model & migration summary

| Change | Table | Migration notes |
|---|---|---|
| New `PredictionLog` | `prediction_log` | Reversible; `downgrade()` drops table **and** any composite/enum types (`DROP … CASCADE` per `CLAUDE.md`); test on `vinaadi_test` (port 5433) first |
| Register model | — | Add to [`app/models/__init__.py`](../app/models/__init__.py) `__all__` |
| No changes to existing tables in Phases 0–3 | — | Purely additive response fields |

Never run migrations against `vinaadi_dev` without confirming backwards-safety (path-guard rule).

---

## 6. API contract coordination (four surfaces — do together)

Per `CLAUDE.md`, routes/params/response shapes are a shared contract. For each phase that changes a
response, update **in the same PR**:

- `app/api/` (backend) — emit new fields.
- `packages/shared/src/api/` — extend the client types.
- `mobile/src/api/` — consume `band` / `reading` / SILENT copy.
- `web/` — same.

**Backwards-compat strategy:** additive first (`band`, `reading` alongside legacy `confidence`),
deprecate `confidence` and raw scores one release later, remove in the release after. Prefer query
params over path segments for any new optional filters.

---

## 7. Testing & validation strategy

The reasoning layer's correctness is **not** a unit-test problem — it's a **golden-case** problem
(existing `QaGoldenCase` model + `feedback_astrology_calc_accuracy` memory: *domain bugs are
silent*).

1. **Golden charts.** Build a fixture set of ~20 synthetic charts (never real birth data —
   `CLAUDE.md`), each hand-annotated by the specialist with expected `band`/`reading` per life area:
   e.g. "chart K: marriage = PROMISED_NOT_NOW, window ~2029". Store under `tests/golden/reasoning/`.
   **Scaffold ready** — `tests/golden/reasoning/GOLDEN_SET_WORKSHEET.md` lays out the 20 slots (3
   already annotated from the marriage golden set, 17 TODO) with the input schema and a coverage
   table across all 6 `Reading` values and all 10 life areas; specialist fills in the TODO rows.
2. **Gate tests.** Prove D1: a `BLOCKED` chart cannot be lifted by any dasha/transit combination
   (property test: vary timing inputs, assert band stays BLOCKED).
3. **Ordinal tests.** Prove D2: no user-facing string contains `/100` (regex scan across all
   narrative outputs — extend `tone_validator` into a `precision_validator`).
4. **Calibration harness.** Replay logged predictions against logged outcomes; assert hit-rate
   computation is correct on a seeded synthetic dataset.
5. **Regression.** Snapshot current `STRONG`/`GOOD` outputs for genuinely promised+timed cases;
   assert Phase 1 does not regress them.
6. Run with `PYTHONUTF8=1` and test DB env vars per `CLAUDE.md`; SQLite for offline/CI.

---

## 8. Rollout, flags, and risk

- **Feature-flag each phase** via existing `feature_flags` service. Roll gate (Phase 1) to internal
  → beta → all, watching for over-suppression (too many BLOCKED/SILENT = gate too strict).
- **Rollout sequencing (decided 2026-07-03):** `reasoning_calibration_log` ON first — silent, so
  worth turning on early precisely because it's invisible; needs weeks of collection before hit-rates
  mean anything (n≥30/bucket). **Done 2026-07-03** (default flipped in `feature_flags.py`, §13).
  Then `reasoning_gate` internal → beta (watching for over-suppression). **Internal step done
  2026-07-03** (default flipped in `feature_flags.py`; PR-1 thresholds already signed off, §11) —
  watching for over-suppression (too many BLOCKED/SILENT) before promoting to beta. Then
  `reasoning_bands`, then `reasoning_contradiction` last — it is a no-op without the gate anyway.
- **Calibration is silent-launch:** log predictions for weeks *before* trusting hit-rates; you need
  n before you recalibrate.
- **Biggest risk:** an over-strict promise gate makes the app feel negative. Mitigate with (a) WEAK
  passing through, (b) SILENT (not BLOCKED) as the default when uncertain, (c) the non-fatalism
  tone gate, (d) always pairing a BLOCKED reading with a redirect to what the chart *does* support.
- **Astrological review gate:** Phases 1, 3, 5 change what we *claim*. Each needs specialist
  sign-off on the rule tables before flag-on (mirror the `A-04 needs astrologer review` discipline).

---

## 9. Product & business implications

- **Trust & differentiation:** ordinal honesty + a published hit-rate is a category-defining moat.
  "The astrology app that keeps score" is a real position.
- **Pricing:** the promise-gate + contradiction reading ("promised but not now, window 2029") is
  premium-tier material — it's the depth that justifies pay-per-reading (ties to `project_tier_plan`).
- **Retention:** the calibration loop + life-event logging creates a reason to return ("did the
  prediction land?") and a compounding personal dataset that raises switching cost.
- **Ask Vinaadi:** feed `Verdict`/`Reading` into the LLM context so conversational answers inherit
  the gate discipline instead of free-forming — consistency across surfaces.

---

## 10. Suggested execution order (first 3 PRs)

1. **PR-1 (Phase 0 + 1):** kernel primitives + promise gate in `prediction_score` and
   `whatif._overall_verdict`, behind `reasoning_gate` flag, with golden-case + regression tests.
   *Highest correctness-per-line; smallest surface.*
2. **PR-2 (Phase 2):** strip `/100` from copy, unify on `Band`, add SILENT voice. Coordinate all
   four API surfaces.
3. **PR-3 (Phase 4 data spine):** `PredictionLog` model + migration + write-on-serve + outcome join.
   Silent-launch; dashboard read-only in admin.

Phases 3, 5, 6 follow once 1/2/4 are proven in production.

---

## 11. Implementation status (updated 2026-07-03)

**PR-1 (Phase 0 + Phase 1) — BUILT; flag `reasoning_gate` ON (internal rollout, flipped 2026-07-03).**

| Piece | Where | Notes |
|---|---|---|
| Kernel primitives | `app/reasoning/verdict.py` | `Band`, `BiText`, `Verdict`, `band_rank`, `cap_band`, legacy HIGH/MED/LOW mapping. 100% coverage. |
| Promise gate | `app/reasoning/promise_gate.py` | `assess_promise` (dignity-based, strict BLOCKED per §Phase 1 prose spec) + `gate_from_l1` (L1→gate for `prediction_score`). 100% coverage. |
| Timing vote | `app/reasoning/timing_vote.py` | `weighted_timing_vote`, `timing_band_from_score` (≥75 STRONG / ≥60 LIKELY / ≥45 MIXED / else WEAK), `combine_gate_and_timing` (WEAK caps at LIKELY). 100% coverage. |
| Flag | `app/services/feature_flags.py` | `reasoning_gate`, default **False**; runtime-editable via admin flags API. |
| prediction_score | `app/calculations/prediction_score.py` | `use_reasoning_gate=True` → gate L1 first; BLOCKED total ≤10, SILENT total ≤20, L2–L6 skipped; PASS/WEAK → total = L2–L6 rescaled 0–100 (L1 never re-added). Legacy path byte-identical. |
| whatif | `app/services/whatif_service.py::_overall_verdict` | Gate thresholds on natal 0–100: PASS ≥60, WEAK 42–59, BLOCKED <42. Vote weights renormalised: dasha .45 / gochar .35 / panchangam .20 (promise 0.25 removed). Returns `(overall, verdict, band)`. |
| marriage | `app/services/marriage_service.py` | `_marriage_promise_gate` (7th lord + Venus D1/D9); BLOCKED/SILENT → non-fatalistic redirect with **no timing window**; WEAK caps confidence at MEDIUM; married profiles never promise-gated (harmony ≠ new-event promise). |
| Contract | `app/schemas/whatif.py`, `app/api/predictions.py`, `packages/shared/src/types/index.ts` | Additive optional `band` (+ `ReasoningBand` TS type); web/mobile consume via shared re-exports. Legacy `confidence` retained. |
| Tests | `tests/reasoning/`, `tests/golden/reasoning/` | 47 tests: ordinal/legacy-mapping, gate grades, D1 property tests (BLOCKED unliftable by any timing sweep), flag-off regression, 3 synthetic golden marriage cases. |

**PR-1 threshold decisions — chief-specialist SIGNED OFF 2026-07-03 (§8 review gate):**
1. ✅ `gate_from_l1` cut-points (PASS ≥16, WEAK ≥8 of L1's 30) — derived from the L1 formula's neutral point (~11), not from classical texts.
2. ✅ Whatif natal gate cut-points (60/42) — derived from `_assess_natal_promise`'s 38/65 house-quality bases.
3. ✅ Marriage BLOCKED criterion uses only debilitation/combustion as "fatal affliction" — no aspect-based affliction until aspect rules are unified across modules (2026-07 methodology audit).
4. ✅ (decision) Golden set expands 3 → ~20 hand-annotated synthetic charts (§7) — **scaffold ready 2026-07-03** at `tests/golden/reasoning/GOLDEN_SET_WORKSHEET.md` (3 done, 17 TODO slots spanning all 6 readings × all 10 life areas); **specialist annotation of the 17 TODO charts still owed before beta**.

---

## 12. PR-2 implementation status (Phase 2, built 2026-07-03)

**Flag:** `reasoning_bands`, default **False**, independent of `reasoning_gate` so copy can roll out separately. Flag-off output is byte-identical (regression-tested).

| Piece | Where | Notes |
|---|---|---|
| /100 stripped from copy | `narrative_engine.py` (strength, dasha, panchangam, gochar, personal-caution, `_SUMMARY_TEMPLATES_BANDED`), `life_areas_service.py` (`_build_area_reason`, dasha fallback narr), `whatif_service.py` (summary + dasha/gochar index tails) | Band/level words carry the judgement; numeric only on legacy path. |
| SILENT/BLOCKED voice | `narrative_engine.py` — `SILENT_VOICE`, `BLOCKED_VOICE`, `BAND_PHRASE`, `band_phrase()` | One vocabulary for all surfaces; tone-validated (D6). |
| `precision_validator` | `narrative_engine.py` | Companion to `tone_validator`; catches `X/100`, `மதிப்பெண்: X`, `score: X`, `index X`. |
| Confidence unified on Band | `daily_guidance_service.py` (signal count → LIKELY/MIXED/WEAK, legacy tier via `band_to_legacy_confidence`), `marriage_service.py` (flag-on: legacy tier derives from band; PR-1 WEAK→MEDIUM cap retained) | Legacy tiers byte-identical flag-off. |
| Contract | `app/schemas/daily_guidance.py` + `packages/shared/src/types/index.ts` — additive optional `band` on DailyGuidanceData | Single shared TS definition; mobile/web via re-export. Numeric API fields retained this release (deprecate per §6). |
| Tests | `tests/reasoning/test_ordinal_copy.py` (16) | Flag-off score-retention regression, flag-on precision sweep across services, band-voice tone checks. |

**Deliberately deferred from PR-2:** synastry/porutham kuta scores (traditional out-of-N counts, not false precision), annual-wrapped stats (explicitly a numbers feature), PDF export, and client-side score meters (numeric fields stay in the API this release per §6 backwards-compat; deprecate in the release after flag-on).

---

## 13. PR-3 implementation status (Phase 4 data spine, built 2026-07-03)

**Flag:** `reasoning_calibration_log`, default **True** (flipped 2026-07-03 — first flag turned on per §8 rollout order, precisely because it's invisible), independent of the other two reasoning flags. Silent-launch per §8: flag-on starts *collecting*; nobody reads hit-rates until n per bucket is meaningful, and any weight recalibration remains a manual owner + specialist decision.

| Piece | Where | Notes |
|---|---|---|
| Model | `app/models/prediction_log.py` | Per §Phase 4 schema plus `source` (whatif/marriage/life_areas) and nullable `reading` (fills when Phase 3 ships). String columns only — no PG enum/composite types, so downgrade is a clean `drop_table` (CLAUDE.md DB rule 8). FK `charts` CASCADE, FK `user_life_events` SET NULL. |
| Migration | `migrations/versions/gg7c8d9e0f1b_add_prediction_log.py` | Reversible; verified apply → downgrade → re-apply on `vinaadi_test` (5433). |
| Write on serve | `whatif_service.evaluate_whatif` (scenario→area map, window = target date), `api/predictions.py::get_marriage_prediction` (skipped when age-gated — placeholder windows claim nothing), `life_areas_service.get_life_areas` (only HIGH-confidence areas — a 30-day material claim; logging all 12 areas per serve would drown the report) | All via `prediction_log_service.log_prediction`: best-effort, never raises, never commits (rides `get_db`'s commit), dedupes re-views of the same open claim so n isn't inflated. Legacy-path predictions (no Band yet) are logged via a conservative legacy→Band map (`verdict.legacy_confidence_to_band`, HIGH→LIKELY — never STRONG). |
| Outcome join | `life_event_log_service.log_life_event` → `prediction_log_service.join_outcome` | Event-type→area map (RELATIONSHIP_* grades MARRIAGE + RELATIONSHIPS, etc.). Grading: inside window → HIT; within ±92 days → NEAR; BLOCKED contradicted within 365 days *after* the claim → MISS; SILENT never graded (D3 — silence claims nothing); far-off events leave the row open. |
| Calibration kernel | `app/reasoning/calibration.py` | Pure (no DB): `build_calibration_report` → buckets per life-area×band and per maha lord, `hit/(hit+near+miss)`; open rows counted in totals but excluded from buckets. |
| Admin read | `app/api/admin.py` GET `/admin/calibration` | Read-only, admin-only. No consumer contract change (per §Phase 4 contract note — no shared/mobile/web client until "our accuracy" becomes a product surface). |
| Tests | `tests/reasoning/test_calibration.py` (12, no_db), `tests/test_prediction_log_api.py` (7, end-to-end) | Grading rules incl. BLOCKED/SILENT asymmetry, aggregation harness on a seeded synthetic dataset, flag-off writes nothing, write-once dedupe, life-event join → HIT, admin report shape, auth. |

**Deliberately deferred from PR-3:** window-expiry sweep (grading predictions where *nothing* happened — needs a "closed, no event" state and a cron; revisit once real rows accrue), auto-recalibration of timing-vote weights (§Phase 4 step 4 stays manual by design), and any public accuracy surface.

---

## 14. PR-4 implementation status (Phase 3 contradiction engine, built 2026-07-03)

**Flag:** `reasoning_contradiction`, default **False**. Readings derive from the promise gate, so user-visible effect requires `reasoning_gate` ON as well; with the gate on but this flag off, readings are still computed and silently fill `PredictionLog.reading` (the column PR-3 left nullable), so calibration data accrues before the copy ships.

| Piece | Where | Notes |
|---|---|---|
| Classifier kernel | `app/reasoning/contradiction.py` | `Reading` enum (plan sketch's five + `SILENT` per D4's "all silent → SILENT") and pure `classify(promise_grade, timing_band)`. Classifies from the **pre-cap** timing band (a WEAK gate caps the published band at LIKELY, but the reading is about what the timing itself says). BLOCKED → NOT_PROMISED regardless of timing; SILENT gate + timing ≥ LIKELY → ACTIVE_BUT_UNPROMISED (redirect), + timing ≤ WEAK → SILENT. |
| Reading voice | `narrative_engine.py` — `READING_VOICE`, `reading_phrase()`, `promised_not_now_voice(window_opens)`, `active_but_unpromised_voice(dominant_area)` | NOT_PROMISED reuses `BLOCKED_VOICE`, SILENT reuses `SILENT_VOICE` (one vocabulary). All strings tone- and precision-validated (D6/D2). |
| whatif | `whatif_service.py` — `_overall_verdict` now returns `(overall, verdict, band, reading)`; `_reading_summary` overrides the verdict-only summary for PROMISED_NOT_NOW ("plan toward the better window suggested below" — whatif computes no next-window date, the response's bestPeriodInWindow carries that), ACTIVE_BUT_UNPROMISED, NOT_PROMISED. PROMISED_AND_TIMED / MIXED keep the verdict copy. | Reading logged to `PredictionLog` whenever the gate ran; surfaced on the response only behind the flag. |
| life-areas | `life_areas_service.py` — `_score_area` also returns `gate_grade`; reading classified from the pre-blend prediction total (the timing vote). PROMISED_NOT_NOW triggers `_find_next_improvement_date` even when the blended score ≥ 50 and prepends the dated window voice; NOT_PROMISED prepends the redirect voice; ACTIVE_BUT_UNPROMISED is completed in a post-pass naming the dominant (top-scoring ≥ 60) area. | Reading suppressed for phase-skipped areas, married RELATIONSHIPS harmony framing (married profiles are never promise-gated — PR-1 decision), and maraka-suppressed scores. |
| Contract | `app/schemas/whatif.py`, `app/schemas/life_areas.py` — additive optional `reading`; `packages/shared/src/types/index.ts` — `ReasoningReading` type + `reading?` on `WhatIfData`/`LifeAreaData` (mobile/web consume via re-export; `tsc --noEmit` clean). |
| Tests | `tests/reasoning/test_contradiction.py` (17: full classifier matrix incl. totality, voice tone/precision sweeps, summary template selection, flag-off byte-identical), `test_whatif_gate.py` updated for the 4-tuple, `test_prediction_log_api.py` (reading fills with gate on), `test_life_areas_api.py` (reading null flag-off, valid enum flag-on). |

**Specialist review gate (§8):** Phase 3 changes what we *claim* — the reading templates and the WEAK-gate → ACTIVE_BUT_UNPROMISED framing need chief-specialist sign-off before flag-on (same discipline as the PR-1 thresholds).

**Deliberately deferred from PR-4:** marriage surface readings (marriage_service has its own gate shape; wire when its narrative is next touched), naming the dominant area in whatif's redirect copy (whatif is single-scenario and has no cross-area scores — Phase 5 chart signature is the right tool), and Ask Vinaadi context injection (§9, after flag-on).

**Full-suite verification (2026-07-04):** ran the whole suite (873 tests) to confirm the two 2026-07-03
flag flips (`reasoning_calibration_log` → True, `reasoning_gate` → internal-on) introduced no
regressions. One failure, unrelated to either flip: `test_whatif_gate.py::test_pass_gate_with_poor_timing_is_caution_not_blocked`
still unpacked `_overall_verdict`'s old 3-tuple — missed when PR-4 added the `reading` 4th return
value (every other call site in the file was updated). Fixed the unpack; suite is 873/873 green.
No other module (chart calc, dasha, synastry, admin, notifications) regressed with the gate live.

---

## 15. PR-4 specialist review packet (pending sign-off)

Two things block flag-on for `reasoning_contradiction` (and, since readings derive from the gate,
carry implications for `reasoning_gate`'s beta rollout): the six reading templates below, and one
framing decision. Both are extracted here verbatim from `app/services/narrative_engine.py` so they
can be reviewed without reading code — same discipline as the §11 threshold sign-off.

### 15.1 The six reading templates (`READING_VOICE`, `narrative_engine.py:1200`)

| Reading | Fires when | தமிழ் | English |
|---|---|---|---|
| `PROMISED_AND_TIMED` | gate PASS + timing ≥ LIKELY | ஜாதக வாக்கும் கால ஆதரவும் இணைந்துள்ளன — முன்னேற ஏற்ற தருணம். | The chart's promise and the timing are aligned — a supportive moment to act. |
| `PROMISED_NOT_NOW` | gate PASS + timing ≤ WEAK ("wait") | இது உங்கள் ஜாதகத்தில் வாக்களிக்கப்பட்டுள்ளது; ஆனால் தற்போதைய காலம் இன்னும் செயலூக்கம் பெறவில்லை. பொறுமையாக காத்திருப்பது பலன் தரும். | This is promised in your chart, but the timing isn't active yet. Waiting patiently will serve you. |
| `ACTIVE_BUT_UNPROMISED` | gate WEAK/SILENT + timing ≥ LIKELY ("redirect") | இது ஒரு செயலூக்கமான காலம்; ஆனால் ஜாதகம் இந்த ஆற்றலை வேறு திசையில் காட்டுகிறது. | This is an active period, but your chart points the energy in a different direction. |
| `NOT_PROMISED` | gate BLOCKED, any timing (reuses `BLOCKED_VOICE`) | இந்த விஷயத்தில் ஜாதகம் வலுவான வாக்கு தரவில்லை — ஜாதகம் ஆதரிக்கும் பகுதிகளில் கவனம் செலுத்துவது நல்லது. | The chart does not strongly promise this — redirecting focus to areas the chart does support is wiser. |
| `MIXED` | anything else (fallback) | சமிக்ஞைகள் கலந்த நிலையில் உள்ளன — சிறிய, மீளக்கூடிய அடிகளுடன் முன்னேறலாம். | The signals are mixed — proceed with small, reversible steps. |
| `SILENT` | gate SILENT + timing ≤ WEAK (reuses `SILENT_VOICE`) | இந்த கேள்விக்கு ஜாதகம் அமைதியாக உள்ளது — உறுதியான கணிப்பு தர போதிய சமிக்ஞை இல்லை. | The chart is quiet on this question — there isn't enough signal for a confident call. |

`PROMISED_NOT_NOW` gains a concrete date when one is known (`promised_not_now_voice`):
appends *"... 2029-06-15 அளவில் காலச் சாளரம் திறக்கத் தொடங்கும்."* / *"... The window begins to
open around 15 June 2029."* `ACTIVE_BUT_UNPROMISED` gains a named area when one is known
(`active_but_unpromised_voice`): *"...ஆனால் ஜாதகம் இந்த ஆற்றலை [area] பக்கம் காட்டுகிறது."* /
*"...but your chart points the energy toward [area] instead."*

**Review ask:** do these six read as non-fatalistic, honest, and in the register Vinaadi should
speak in? (D6 tone rules already gate them mechanically — this is a judgment call the validator
can't make.)

### 15.2 The framing decision: WEAK gate + active timing

This is the one open design question, not just a copy-editing pass.

`classify()` (`app/reasoning/contradiction.py`) currently treats **WEAK** and **SILENT** gates
identically when timing is active — both produce `ACTIVE_BUT_UNPROMISED` and therefore the same
redirect voice as `NOT_PROMISED`/`BLOCKED`:

```python
if promise.grade in ("WEAK", "SILENT") and timing_band >= Band.LIKELY:
    return Reading.ACTIVE_BUT_UNPROMISED
```

But `WEAK` and `SILENT` are not the same epistemic state (D3): **SILENT** means the chart is
genuinely quiet — no promise signal either way. **WEAK** means one of the two promise conditions
*did* hold (bhava lord clean but karaka undignified, or vice versa — plan §Phase 1) — there is
partial promise, just not enough to PASS. Speaking to a WEAK chart in the same "your chart points
the energy in a different direction" redirect voice implies zero promise, which overstates how
little the chart supports the question.

**Option A — keep current behaviour (WEAK folds into the redirect voice).**
Simpler: one voice for "not enough promise," regardless of *how* not-enough. Risk: a chart that
does have half a promise gets told, in a strong active period, that the energy points elsewhere —
this may read as more dismissive than the underlying signal warrants.

**Option B — give WEAK its own "partially promised" voice, distinct from SILENT/BLOCKED's redirect.**
Draft (not yet in code — for review only):
> *TA:* "இது ஒரு செயலூக்கமான காலம்; ஜாதகம் ஓரளவு ஆதரவு தருகிறது, ஆனால் முழுமையான உறுதி இல்லை."
> *EN:* "This is an active period, and your chart offers partial support — though not a full promise."

This would require `classify()` to distinguish `WEAK` from `SILENT` as separate branches (currently
merged) and a seventh `READING_VOICE` entry, or a `WEAK`-specific variant of `ACTIVE_BUT_UNPROMISED`.

**Decision (pending):**
- [ ] Option A — ship as built.
- [ ] Option B — split WEAK into its own voice; engineering implements after sign-off.

### 15.3 Sign-off checklist

| # | Item | Status |
|---|---|---|
| 1 | §15.1 — six reading templates read correctly in tone/register | ⬜ pending |
| 2 | §15.2 — WEAK-gate framing: Option A or B | ⬜ pending |
| 3 | Golden-set worksheet (§7, `tests/golden/reasoning/GOLDEN_SET_WORKSHEET.md`) — 17 TODO rows annotated | ⬜ pending |

Until all three are checked, `reasoning_gate` stays internal-only and `reasoning_contradiction`
stays off, per §8's astrological review gate.

---

## 16. PR-5 implementation status (Phase 5, built 2026-07-04)

**Flag:** `reasoning_chart_signature`, default **False**, independent of the other reasoning
flags. Flag-off output is unchanged (both new response fields are simply absent).

| Piece | Where | Notes |
|---|---|---|
| Signature kernel | `app/reasoning/chart_signature.py` | Pure, no ephemeris/DB calls. `detect_signature()` tallies four signals — Atmakaraka (3 pts, via `jaimini_karakas.compute_char_karakas`), most-aspected planet (2 pts, via `calculations/aspects.py`'s `aspects_house`), current mahadasha lord (2 pts, +1 self-period bonus when antardasha matches), natal strength (1 pt, weakest/tie-breaking signal) — into one dominant graha + motif key. Ties broken by the same classical dignity order `jaimini_karakas.py` already documents (Sun..Saturn, Rahu, extended with Ketu). No signal at all → **raises `ValueError`** rather than inventing a claim (a real persisted chart always yields an atmakaraka, so an empty tally means malformed input reached the function; callers catch this gracefully rather than rendering a fabricated "Sun chart"). Corrected 2026-07-13 (docs/PREDICTION_DOCTRINE_AND_ROADMAP.md P0-4) — this table previously said "falls back to Sun," which does not match the code. The classifier owns no copy (mirrors `contradiction.py`'s split): `Signature.motif` is a plain string key. |
| Framing voice | `narrative_engine.py` — `SIGNATURE_VOICE` (9 bilingual "your chart revolves around X" sentences, one per motif), `signature_framing(motif)` | One vocabulary entry per graha; unknown motif falls back to Jupiter's ("wisdom_and_growth"). Tone- (D6) and precision- (D2) validated. |
| Root-cause chains | `narrative_engine.py` — `render_causal_chain(steps, conclusion)` | Pure formatting helper: joins ordered bilingual evidence with "→" and a "Because: ... → therefore: ..." frame. Accepts any `.ta`/`.en` object (BiText, LifeAreaText) — not a new bilingual type. Empty `steps` returns the conclusion unchanged. |
| life-areas wiring | `life_areas_service.get_life_areas` | Computes the chart-level `Signature` once (reusing `natal_planet_rasis`/`natal_planet_scores`/`maha_lord`/`antar_lord` already loaded for scoring — no extra work) and attaches it as `chartSignature`. Per area, when `_area_confidence == "LOW"` **and** the area is neither phase-skipped nor the married-RELATIONSHIPS harmony framing (neither is a real promise/timing claim), builds a 2-step causal chain from `driver_reason` (karaka transit) → `detailed_reason` (dasha/sani/net-effect) → `_area_conf_reason` as the "therefore" conclusion — all three already computed for the existing narrative, so no new astrological logic. |
| Contract | `app/schemas/life_areas.py` — `LifeAreaData.causal_chain` (alias `causalChain`), new `ChartSignatureData` model, `LifeAreasResponseData.chart_signature` (alias `chartSignature`); `packages/shared/src/types/index.ts` — matching `ChartSignatureData` interface + optional fields on `LifeAreaData`/`LifeAreasResponseData` (mobile/web consume via re-export; `tsc --noEmit` clean). | Both fields additive/optional; absent (not merely null) is not guaranteed — flag-off responses send explicit `null`. |
| Tests | `tests/reasoning/test_chart_signature.py` (10 — signal weighting, self-period bonus, tie-break order, motif completeness, no-signal raises `ValueError`), `tests/reasoning/test_signature_voice.py` (7 — framing/chain tone+precision, fallback, joining order), `tests/test_life_areas_api.py::test_life_areas_chart_signature_and_causal_chain_are_additive` (flag-off absent, flag-on well-formed, causal chain only on LOW-confidence areas) | 139 tests across the reasoning-adjacent suite (`tests/reasoning/`, `tests/golden/`, prediction-log, life-areas, admin, service-priority) green against the real Postgres test DB after this change; full 874-test suite unaffected bar one pre-existing, unrelated `test_perf_budget.py` timing flake. |

**Deliberately deferred from PR-5:** wiring the signature framing sentence into whatif/marriage/
daily-guidance narratives (plan §Phase 5 step 2 says "every narrative" — this PR ships the
single richest-context surface first, matching how PR-4 deferred the marriage surface); richer
multi-step root-cause chains that trace through varga/dasha-transition evidence rather than the
two already-computed reason strings; and Shadbala as a signature signal (the natal strength score
already used is a general-purpose proxy — pulling in the full experimental Shadbala pipeline for
one weak-weighted tie-break signal was judged not worth the added DB/ephemeris dependency for a
Phase that is itself off by default).

**Astrological review gate:** per §8, Phase 5 changes what we *claim* (a new "dominant force"
framing sentence and reordering of existing evidence into a causal narrative) and needs
chief-specialist sign-off on the nine motif framings and the signal-weighting judgment call
before flag-on — same discipline as §11/§15. Not yet requested.

---

### Appendix A — Doctrine-to-code quick map

| Doctrine | Enforced in | Primary file(s) |
|---|---|---|
| D1 gate→vote | Phase 1 | `reasoning/promise_gate.py`, `reasoning/timing_vote.py`, `prediction_score.py`, `whatif_service.py` |
| D2 ordinal | Phase 2 | `reasoning/verdict.py`, `narrative_engine.py`, `life_areas_service.py` |
| D3 silent≠denied | Phase 1–2 | `reasoning/promise_gate.py`, `narrative_engine.py` |
| D4 contradiction | Phase 3 | `reasoning/contradiction.py` |
| D5 calibration | Phase 4 | `models/prediction_log.py`, `reasoning/calibration.py`, `life_event_log_service.py` |
| D6 tone/bilingual | all | `narrative_engine.tone_validator` |
| — synthesis (chart signature + root-cause chains) | Phase 5 | `reasoning/chart_signature.py`, `narrative_engine.py`, `life_areas_service.py` |
