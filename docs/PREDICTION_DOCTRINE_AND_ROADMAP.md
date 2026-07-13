# Prediction Doctrine — Reality Audit & Roadmap

> **Author lens:** written as if by (a) a senior Thirukanitham jyotishi, (b) a full-stack
> engineer who has read every file in `app/reasoning/`, and (c) the product owner who has
> to decide what ships next.
>
> **Verified against source on 2026-07-13** — every claim below was checked against the
> actual code, not the design docs. File + line pointers are given so you can re-verify.
>
> **Status update — 2026-07-13 (later pass, same day):** every P0–P3 item this doc scoped
> has now shipped or been verified. This audit is kept as the **original point-in-time
> snapshot** (it explains *why* each item was prioritized), with inline status notes added
> wherever a specific claim is now factually wrong — rather than rewriting the audit's voice
> after the fact. The short version: all six rollout flags in §3 are **ON**; P1-1
> (`app/services/safety_filter.py`) and P1-2 (hard suppression for minors/opt-in
> reduced-content preference) shipped *before* P0-3 per §7's own sequencing call; P1-3
> aligned Ask Vinaadi to `Band` + the safety pass + the calibration spine; P2-1 published
> `docs/PREDICTION_TAXONOMY.md`; P2-2 grew the propensity registry from 23 → 40 cards; P2-3
> gave `whatif_service.py`'s scenario dicts parity with `life_areas_service.py` (added
> `foreign_settlement`/`litigation`, since `FOREIGN`/`LITIGATION`/`CHILDREN` already existed
> as life-area routes — the gap was whatif's separate dicts, not missing areas); P3-1 was
> verified already-built (not built new); P3-2/P3-3 shipped the recalibration *mechanism*
> only (band cutoffs moved from hardcoded literals to admin-tunable flags read via
> `get_flag()`) — no threshold value has actually changed, since only ~10 days of
> calibration data exist as of this update, well short of this doc's own n≥30/bucket bar.

---

## 0. The one-paragraph truth

*(Original 2026-07-13 audit, morning pass — see status update above for same-day resolution.)*

The **15-point reasoning doctrine is essentially correct and ~80% built in the kernel**
(`app/reasoning/`), but **only ~40% of it reaches a real user today** because most of it sits
behind feature flags that are still OFF. The engine already *thinks* the right way (gate on
promise, separate timing from potential, distinguish silence from denial, never fatalistic).
What it does not yet do is (1) *speak* that way on every surface, and (2) cover anywhere near
the **300–500 topic breadth** the doctrine aspires to — today it evaluates **~34 topics**
(23 propensity cards + ~11 life areas). The gap is **rollout + breadth**, not correctness.

**Resolved same day:** the rollout gap (1) is closed — all flags below are ON. The breadth
gap (2) narrowed but is not closed: 40 propensity cards (was 23) + ~11 life areas + 13 whatif
scenarios (was 11) — still a curated shortlist against the 300–500 ambition, and still a
defensible, stated product choice rather than an accidental ceiling (see §4.1).

---

## 1. Doctrine scorecard (D1–D15)

| # | Principle | Built? | Reaches user? | Where it lives |
|---|-----------|:------:|:-------------:|----------------|
| D1 | Evidence before prediction | ✅ | ✅ (gate ON) | `app/reasoning/promise_gate.py`, `timing_vote.py` |
| D2 | Multi-factor confirmation | ✅ | ✅ | `app/calculations/prediction_score.py` (L1–L6) |
| D3 | Quiet Chart (SILENT ≠ "no") | ✅ | ✅ (`reasoning_bands` ON 2026-07-13) | `verdict.py` `Band.SILENT` |
| D4 | No forced verdicts (MIXED allowed) | ✅ | ✅ | `Band.MIXED`, `ChanceLevel.MIXED/LIMITED` |
| D5 | Contradiction handling | ✅ | ✅ (`reasoning_contradiction` ON 2026-07-13) | `app/reasoning/contradiction.py` — plus new `Reading.PARTIALLY_PROMISED` (P0-2 specialist decision, §15.2 Option B) |
| D6 | Explain every conclusion | ✅ | ✅ (`reasoning_chart_signature` ON 2026-07-13) | `narrative_engine.build_score_reasons`; causal chain now also wired into whatif/marriage, not life-areas only |
| D7 | Confidence **bands**, not % | ✅ | ✅ (`reasoning_bands` ON 2026-07-13) | `Band` enum; numeric score shown *alongside* the band by product decision (P0-1), not stripped |
| D8 | Timing separate from potential | ✅ | ✅ | gate vs. timing vote split — **cleanest part of the system** |
| D9 | Watchfulness, not doom | ✅ | ✅ (`propensity_insights` ON 2026-07-13) | `CAUTION` tiers + `tone_validator`, now enforced at serve time via `safety_filter.py` |
| D10 | Never predict death | ✅ | ✅ | *by omission* — no death/lifespan engine exists at all |
| D11 | Never diagnose disease | 🟡 soft | 🟡 partial → hard gate now exists for minors | disclaimers (`propensity_models.py`) plus a real hard-suppress path (P1-2: sensitive WELLBEING cards force `deferred=True` for minors and for the opt-in `prefers_reduced_sensitive_content` preference); still no disclosed-medical-condition field anywhere by design |
| D12 | Human agency first | ✅ | ✅ | `tone_validator` bans fatalistic phrasing, now checked at serve time everywhere via `safety_filter.py`, not test-only |
| D13 | Evidence weighting | ✅ | ✅ | L1–L6 weighted layers |
| D14 | Domain independence | ✅ | ✅ | each life area / card scored on its own |
| D15 | Unified safety layer (pipeline) | 🟡 → mostly ✅ | 🟡 → mostly ✅ | `app/services/safety_filter.py` (P1-1, new 2026-07-13) is now the one seam every surface calls before returning — but it is deliberately **tone-only**, not the full imagined `Safety→Medical→Legal→Psychological→Language` sequence (medical/legal disclaimers remain per-card strings, not a single gate; see §4.2 for what's still genuinely partial) |

**Legend:** ✅ done · 🟡 partial · ❌ not surfaced

---

## 2. What the engine does *exceptionally* well

### 2.1 D1 + D8 — the Promise Gate (the crown jewel)
`app/reasoning/promise_gate.py` implements the classical principle correctly:

> *A dasha can only ripen what the birth chart has already promised.*

- `assess_promise()` requires **both** the bhava lord to be free of fatal affliction
  (not in 6/8/12, not combust/debilitated-uncancelled) **and** the karaka to hold a friendly
  dignity **in D1 and the routed varga** (D9 marriage, D10 career, D24 education…).
- The gate is a **veto, not a vote**. In `compute_prediction_score()` the timing layers
  (L2–L6) are **skipped entirely** if the gate blocks. Timing is rescaled 0–100 from L2–L6
  *only* — L1 is never re-added. This kills the "averaging error" that ruins most apps.
- Grades map to honest bands: `PASS→proceed`, `WEAK→cap at LIKELY`, `BLOCKED→Band.BLOCKED`,
  `SILENT→Band.SILENT`.

**Jyotishi's note:** this is textbook. Most software astrologers let a good Guru bhukti
"manufacture" a marriage the 7th house never promised. This engine refuses to. That is the
single most important thing it gets right.

### 2.2 D3 — Silence is not denial
`verdict.py` treats `BLOCKED` (chart actively denies) and `SILENT` (chart is quiet) as
**different epistemic states**, not two flavours of "low". `cap_band()` explicitly passes both
through unchanged — you can never *cap* your way into a BLOCKED/SILENT. The calibration loop
also **never grades a SILENT claim** (you can't be wrong about a prediction you declined to make).

### 2.3 D5 — Contradictions are named, not averaged
`contradiction.py::classify()` turns gate-vs-timing disagreement into a named `Reading`:
`PROMISED_NOT_NOW` (wait), `ACTIVE_BUT_UNPROMISED` (redirect), `PARTIALLY_PROMISED` (added
2026-07-13, P0-2 — one of the two promise conditions held; distinct from a genuinely silent
chart), `PROMISED_AND_TIMED`, `NOT_PROMISED`, `MIXED`, `SILENT`. This is exactly how a
seasoned astrologer speaks, and as of 2026-07-13 it is **live** — `reasoning_contradiction=True`.

### 2.4 D6, D9, D12 — non-fatalistic voice
`narrative_engine.tone_validator()` hard-bans 8 fatalistic phrases
(`"danger"`, `"will fail"`, `"doomed"`, `"crisis"`, `"hardship"`, `"inauspicious"`…). Even the
`BLOCKED` gate reason is phrased as *"redirect focus to areas the chart does support,"* never
*"this will not happen."* Sensitive tiers carry explicit non-diagnostic disclaimers. As of
2026-07-13 this check also runs **at serve time** via `safety_filter.run_safety_pass()`, not
just in tests — the one surface this actually catches something new on is Ask Vinaadi, since
its answer text is LLM-generated rather than a pre-validated template.

### 2.5 D10 — death is simply not modelled
There is **no maraka/ayur/lifespan prediction anywhere**. `longevity` appears only as a Saturn
significator *theme word*; `maraka_risk` is a routing flag that makes the HEALTH area *more
cautious*, not a death timer. The safest possible implementation of "never predict death" is
"never build the feature" — and that is what exists.

---

## 3. Where the doctrine was *built but silent* (the rollout gap) — CLOSED 2026-07-13

*(Original framing kept for history; every flag below is now ON.)*

These were **not missing code** — they were finished code behind an OFF flag, which made this
the highest-ROI work in the whole document: value already paid for, not yet collected. All of
it has now been collected.

| Flag | State | Doctrine it unlocks | Notes |
|------|:-----:|---------------------|---------|
| `reasoning_gate` | **ON** (since 2026-07-03) | D1/D8 | — |
| `reasoning_calibration_log` | **ON** (since 2026-07-03) | D5 accountability | silently collecting; P3-1 admin read surface confirmed working 2026-07-13 |
| `reasoning_bands` | **ON** (2026-07-13, P0-1) | D3/D4/D7 | schema coordinated across `app/api`, `packages/shared`, `mobile`, `web` in one pass; score shown alongside band, not replaced |
| `reasoning_contradiction` | **ON** (2026-07-13, P0-2) | D5 (voice) | new `PARTIALLY_PROMISED` reading added as part of this flip (§15.2 Option B) |
| `reasoning_chart_signature` | **ON** (2026-07-13, P0-4) | D6 root-cause chains | wiring extended from life-areas-only to whatif + marriage in this same pass |
| `propensity_insights` | **ON** (2026-07-13, P0-3) | D9 Chances & Cautions | sequenced *after* P1-1/P1-2 safety hardening per this doc's own §7 recommendation |

**Product owner's read (resolved):** the `X/100`-only leak (D7) was the most visible doctrine
violation a user could see. As of 2026-07-13 it no longer leaks alone — `whatif_service.py`'s
score lines now render with the band alongside them wherever `reasoning_bands` gates the copy,
and the flag is ON in the current build.

---

## 4. Where the doctrine is *genuinely thin* (the real build gaps)

### 4.1 Breadth — ~51 topics vs. the 300–500 ambition ⭐ still the biggest honest gap
The ontology aspires to **15–20 domains × 300–500 topics**. Reality as of 2026-07-13:

- **7 propensity categories** (`RELATIONSHIPS, EDUCATION, CAREER, WELLBEING, MARRIAGE, WEALTH,
  LIFE_PATH`) → **40 cards** in `propensity_service.py::_REGISTRY` (was 23; P2-2 added 14
  cards across Career/Wealth/Marriage-timing, P2-3 added 3 more sub-topic cards under
  `LIFE_PATH` — `pr_immigration_prospects`, `legal_outcome_favor`, `contract_dispute_risk`).
- **~11 life areas** (`marriage, education, career, property, health, spiritual, child_birth,
  job_change, business_start, travel_abroad, family_harmony` in `life_areas_service.py`'s
  routing) — unchanged; `FOREIGN`/`LITIGATION`/`CHILDREN` already existed here as full
  top-level areas before this pass, contrary to this doc's original P2-3 framing (see §6).
- **13 whatif scenarios** (was 11) — P2-3 added `foreign_settlement` (Rahu-Saturn,
  settlement/permanence) and `litigation` (Mars-Saturn, dispute houses) to
  `whatif_service.py`'s scenario dicts, which had lacked parity with `life_areas_service.py`'s
  routing even though the underlying areas already existed.

So the doctrine's *reasoning* is world-class but its *coverage* is a curated shortlist. That
remains a **defensible product choice** (well-reasoned cards beat hollow ones) — and is now a
more clearly *stated* choice (see `docs/PREDICTION_TAXONOMY.md`, published 2026-07-13, P2-1)
rather than an accidental ceiling. We are at roughly ~10–17% of the 300–500 ontology, up from
~7–10%.

### 4.2 D15 — the safety "pipeline" is now one seam, but still not the full imagined sequence
The doctrine imagines one ordered pass: `Safety → Medical → Legal → Psychological → Language`.
As of 2026-07-13, reality is:

1. `tone_validator()` (language) — **now enforced at serve time** via
   `app/services/safety_filter.py::run_safety_pass()` (P1-1), wired into every surface's final
   response-construction point (whatif, life-areas, marriage, daily-guidance, propensities,
   Ask Vinaadi). Previously test-only; that gap is closed.
2. Per-tier disclaimers (medical/legal) — still *strings attached to cards*, not a single gate.
   This is a deliberate scope decision, not an oversight: the disclaimers were reviewed and
   approved as appropriately hedged (P0-3 specialist review), and folding them into one gate
   was not part of what P1-1 scoped.
3. Age gates — **now a real hard suppression**, not just partial. `propensity_service.py`
   force-defers the sensitive WELLBEING CAUTION cards (`emotional_load`, `loneliness`,
   `resilience_watch`, `accident_care`, `child_timing`) for minors (via
   `app/core/age_gate.py::is_minor`) and for users with the new opt-in
   `UserContext.life_situation["prefers_reduced_sensitive_content"]` preference (P1-2). Ask
   Vinaadi gained the same minor-redirect coverage for wellbeing-adjacent questions via new
   `age_gate.WELLBEING_REDIRECT_KEYWORDS`.

There is still **no single `safety_filter` call that runs medical/legal disclaiming or hard
suppression** — those remain separate mechanisms from the tone pass. D11 still relies partly on
the user reading a disclaimer for non-minor users; the hard-suppression belt now exists only for
minors and the opt-in preference, not for a disclosed-medical-condition field (which is a
deliberate non-goal — no diagnosis-grade health data is stored anywhere in this system).

### 4.3 D5 — the loop collects and can now be read (recalibration mechanism shipped, unused)
`reasoning_calibration_log` is ON and accruing hit/near/miss rows, and
`build_calibration_report()` exists.

**Corrected 2026-07-13 (this doc's own P3-1 research):** the claim that "no admin read surface
exposes it yet" was already wrong even before this pass started — `GET /admin/calibration`
(`app/api/admin.py`), its backing tests (`tests/test_admin_api.py`), and a working frontend tab
(`web/components/admin-console.tsx`'s `CalibrationReport`/`CalibrationBucket` render) were all
already fully built. P3-1 required no new code, only verification (re-run 2026-07-13, both
calibration tests green, no regression from the flag/registry work above).

As of 2026-07-13 (P3-2/P3-3), a recalibration **mechanism** also exists: `timing_vote.py`'s
three band cutoffs (previously hardcoded 75/60/45) now live as named flags
(`timing_band_strong_cutoff`, `timing_band_likely_cutoff`, `timing_band_mixed_cutoff`) in
`feature_flags.py`, read via `get_flag()` inside `timing_band_from_score()`. An admin can review
`/admin/calibration`, decide a threshold change is justified, and change it through the existing
generic `PATCH /admin/flags/{flag_name}` endpoint — already automatically audit-logged via
`log_admin_action`. **No threshold has actually been changed** — defaults still reproduce the
original hardcoded behaviour byte-for-byte (regression-tested), because only ~10 days of data
exist since `reasoning_calibration_log` went on (2026-07-03), well short of the n≥30/bucket bar
this doc itself sets in §6/§7 for a *real* recalibration decision.

"The loop closes" (D5) is now: collects → is readable → **is adjustable through a real,
audited admin action** → still awaiting enough data to justify pulling that lever. That is
honest and complete as a *mechanism*; the actual recalibration decision is deliberately not
made yet.

### 4.4 Ask Vinaadi (LLM path) — now aligned to the doctrine
**Resolved 2026-07-13 (P1-3).** The LLM answer path previously emitted `confidence:
HIGH/MEDIUM/LOW`, not `Band`, so it spoke a different dialect from the rest of the system and
its outputs didn't feed the calibration loop.

`app/services/ask_vinaadi_service.py` now maps `HIGH/MEDIUM/LOW` → `Band` via the
already-existing `verdict.legacy_confidence_to_band()`, routes the generated `ta`/`en` answer
through `safety_filter.run_safety_pass(..., source="ask_vinaadi")` before returning (the one
surface where this check can catch something real, since it's non-template LLM output), and
logs to the calibration spine (`source="ask_vinaadi"`, `reading=None`, no timing window) only
when a new keyword classifier (`_classify_life_area()`, reusing `age_gate`'s
`MINOR_REDIRECT_KEYWORDS`/`CAREER_REDIRECT_KEYWORDS`/`STUDY_REDIRECT_KEYWORDS` plus new
HEALTH/MONEY/PROPERTY/FOREIGN/CHILDREN/SPIRITUAL/FAMILY_HARMONY keyword tuples) maps the
question confidently to a life area **and** confidence is HIGH or MEDIUM — LOW-confidence and
unmapped questions are skipped rather than polluting calibration buckets with noise.

---

## 5. The 7-level ontology — reality check

| Level | Ontology target | Reality (2026-07-13, end of day) | Verdict |
|------:|-----------------|---------|---------|
| 1. Life Domain | 15–20 | 7 propensity cats + ~11 area routes + 13 whatif scenarios | 🟡 ~half |
| 2. Prediction Topic | 300–500 | ~51 (40 propensity cards + ~11 life areas), was ~34 | ❌ ~10–17% |
| 3. Evidence (multi-factor) | planets/houses/yogas/dasha/transit/vargas | L1–L6 all present | ✅ |
| 4. Confidence | scored | `Band` (ordinal), live since 2026-07-13 | ✅ |
| 5. Explanation | reasoning trace | `build_score_reasons` + causal chain, live on life-areas/whatif/marriage since 2026-07-13 | ✅ |
| 6. Timing | dasha/bhukti/transit windows | `timing_vote` + `_TimingSpec`; band cutoffs now admin-tunable flags (P3-2/P3-3) | ✅ |
| 7. Remedies | optional | `get_age_based_remedies`, narrative remedy line | ✅ |

**Levels 3–7 are strong and, as of 2026-07-13, level 4/5 are no longer gated. Levels 1–2
(breadth) remain the frontier** — narrower than before, still the honest long-term gap.

---

## 6. TODO — prioritised, with effort and file pointers

Ordered by **(value already built) ÷ (cost to ship)**. All items below shipped 2026-07-13
unless noted otherwise.

### P0 — Collect value already paid for (rollout)

- [x] **P0-1 · Ship ordinal bands (D7/D3/D4).** DONE 2026-07-13. Response-schema change
      coordinated across `app/api`, `packages/shared`, `mobile`, `web` in one pass; both band
      and numeric score shown (product decision, not a score→band replacement);
      `reasoning_bands=True`.
- [x] **P0-2 · Turn on the contradiction voice (D5).** DONE 2026-07-13. Flipped
      `reasoning_contradiction=True`; `PROMISED_NOT_NOW` / `ACTIVE_BUT_UNPROMISED` /
      new `PARTIALLY_PROMISED` (§15.2 Option B) readings now surface. 17 golden-set `TODO`
      rows filled mechanically from `promise_gate.py`/`timing_vote.py`'s exact cutoffs; new
      `tests/reasoning/test_life_areas_golden.py`.
- [x] **P0-3 · Ship Chances & Cautions (D9).** DONE 2026-07-13. Specialist copy review of all
      8 sensitive-tier disclaimers closed (approved as-is; 3 inline literals folded into named
      shared constants). Sequenced after P1-1/P1-2 per §7. `propensity_insights=True`.
- [x] **P0-4 · Root-cause chains (D6).** DONE 2026-07-13. `reasoning_chart_signature=True`;
      `render_causal_chain` wiring extended from life-areas-only to whatif + marriage. §16's
      "falls back to Sun" claim in `docs/REASONING_LAYER_UPGRADE_PLAN.md` was found stale
      during this review — the code actually `raise`s `ValueError` on malformed/empty chart
      data (the more doctrine-correct choice, D6: never fabricate a claim); doc corrected,
      code kept as built.

### P1 — Safety hardening (done before, or with, P0-3)

- [x] **P1-1 · Build a real safety pass (D15).** DONE 2026-07-13. New
      `app/services/safety_filter.py::run_safety_pass()`, called at each surface's final
      response-construction point (whatif, life-areas, marriage, daily-guidance,
      propensities, Ask Vinaadi). Deliberately tone-only (see §4.2 for why precision-checking
      wasn't folded in the same way).
- [x] **P1-2 · Hard gates for sensitive states (D11).** DONE 2026-07-13. Sensitive WELLBEING
      CAUTION cards force `deferred=True` with a new supportive-redirect `BiText` for minors
      and for the new opt-in `UserContext.life_situation["prefers_reduced_sensitive_content"]`
      preference (JSON key on the existing freeform column, no migration). Reuses the existing
      `deferred`/`deferredReason` fields — no schema/contract change.
- [x] **P1-3 · Align Ask Vinaadi to the doctrine.** DONE 2026-07-13. See §4.4.

### P2 — Breadth toward the ontology (the long game)

- [x] **P2-1 · Publish the topic taxonomy.** DONE 2026-07-13. New
      `docs/PREDICTION_TAXONOMY.md`, versioned v1, built from `_AREA_ROUTING`/`_REGISTRY`/
      `_SCENARIO_KARAKA` (not invented structure); each row marked LIVE/PLANNED.
- [x] **P2-2 · Grow the registry in reviewed batches.** DONE 2026-07-13 — **shipped 14 cards,
      not the full ~15–18 originally scoped** (CAREER ×6, WEALTH ×5, MARRIAGE ×3; see
      `docs/PREDICTION_TAXONOMY.md` §5 for the specialist's reasoning on stopping at 14). Each
      card has a real multi-factor `eval_*` evaluator, no hollow cards. New golden-case tests
      in `tests/test_propensity_service.py`. Next tranche remains open-ended/ongoing per this
      item's original framing.
- [x] **P2-3 · Expand routing for Foreign/PR, Litigation, Children sub-topics.** DONE
      2026-07-13. **Correction to this item's original framing:** `FOREIGN`, `LITIGATION`, and
      `CHILDREN` already existed as full top-level areas in `life_areas_service.py` before this
      pass — the actual gap was `whatif_service.py`'s separate scenario dicts
      (`_SCENARIO_KARAKA`, `_SCENARIO_NATAL_HOUSES`, `_DASHA_SCENARIO_SCORE`,
      `_SCENARIO_LABEL_TA/EN`) lacking `foreign_settlement`/`litigation` parity entries. Fixed,
      plus downstream consumers (`prediction_log_service._SCENARIO_TO_AREA`,
      `decisions_service.py`'s scenario keyword/karaka maps,
      `web/components/dashboard-plan-shared.tsx`'s `WHATIF_OPTIONS` dropdown) updated in the
      same pass. Also added 3 new sub-topic propensity cards (`pr_immigration_prospects`,
      `legal_outcome_favor`, `contract_dispute_risk`) as part of the P2-2 tranche. This work
      is now **fully closed**, not merely "areas pre-exist, sub-topics pending" as originally
      scoped.

### P3 — Close the calibration loop (D5)

- [x] **P3-1 · Admin calibration read surface.** VERIFIED 2026-07-13, not built new — was
      already fully built (`GET /admin/calibration`, `tests/test_admin_api.py`,
      `admin-console.tsx`'s Calibration tab). This doc's earlier claim that "no admin read
      surface exists yet" (§4.3) was stale before this pass started; corrected here.
- [x] **P3-2 + P3-3 · Recalibration mechanism, combined.** Mechanism shipped 2026-07-13 — see
      §4.3. Band cutoffs are now admin-tunable flags via the existing generic
      `/admin/flags/{flag_name}` PATCH endpoint (already audit-logged). **Deliberately no
      threshold value was changed** — data isn't mature enough yet (~10 days since
      `reasoning_calibration_log` went on 2026-07-03, this doc's own n≥30/bucket bar not yet
      met). A regression test proves the default flag values reproduce the original hardcoded
      cutoffs (75/60/45) byte-for-byte.

---

## 7. Recommended sequence (product owner's call) — executed 2026-07-13

*(Original recommendation kept for history; all five steps below were followed in this order.)*

1. **P0-1** first — the `X/100` leak is the most visible doctrine violation and the fix is built.
2. **P1-1 + P1-2** *before* **P0-3** — never widen sensitive-domain exposure without the hard
   safety pass in place.
3. **P0-2, P0-4** ride along after bands are live.
4. **P2** is the multi-quarter differentiator — start the taxonomy (P2-1) now in parallel; it's
   cheap and unblocks everything.
5. **P3** — this doc originally recommended waiting on data maturity (~8 weeks from
   2026-07-03 → early September 2026) before touching P3 at all. That call was overridden: P3
   was built in full same-day, but scoped narrowly enough to honor the underlying concern —
   P3-1 was verification only (no new build), and P3-2/P3-3 shipped the *mechanism* without
   moving any actual threshold, so the "don't act on immature data" principle is honored even
   though the code shipped early.

---

## 8. The philosophy, restated for the team

> The purpose of this engine is **not to comment on every topic** — it is to maximise the number
> of **well-supported, transparent, responsibly-voiced conclusions**, and to say *"the chart is
> quiet here"* without embarrassment when the evidence isn't there.

We have built an engine that already *thinks* like that. As of 2026-07-13 it also *speaks*
like that on every surface (P0), *protects* like that in sensitive domains (P1), has widened
*coverage* of the life a person actually asks about (P2), and *can keep itself honest* against
outcomes via an audited, admin-tunable mechanism (P3) — though the accountability loop won't
have enough data to actually act on for some weeks yet. The next long-term work is breadth
(§4.1): 40 propensity cards and ~11 life areas against a 300–500-topic ambition.

---

*Verified files: `app/reasoning/{verdict,promise_gate,timing_vote,contradiction,calibration,chart_signature}.py`,
`app/services/{feature_flags,propensity_service,propensity_models,narrative_engine,whatif_service,marriage_service,daily_guidance_service,safety_filter,ask_vinaadi_service}.py`,
`app/core/age_gate.py`, `app/api/admin.py`, `app/api/ask_vinaadi.py`,
`app/calculations/prediction_score.py`. Doctrine source: `docs/REASONING_LAYER_UPGRADE_PLAN.md`.
Companion doc: `docs/PREDICTION_TAXONOMY.md` (P2-1, published 2026-07-13).*
