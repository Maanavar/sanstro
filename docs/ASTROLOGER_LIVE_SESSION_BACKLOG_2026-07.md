# Live Review Session Backlog — Deferred Stakeholder-Audit Items (2026-07-14)

Source: `docs/STAKEHOLDER_AUDIT_ASTROLOGER_CUSTOMER_2026-07.md`, combined
priority list items #6-8 (A-7, A-8, A-9, C-3/C-4, C-5) plus C-6. These were
deliberately **not** fixed by guessing — each needs either a real classical
source, a worked example, or native-Tamil judgment that a coding session
can't fabricate responsibly. That's what this session is for.

**How to use this doc:** go section by section. Each has: what the finding
is, exactly where it lives in code, the current behavior/data, and the
specific question to answer. Give me a ruling (or say "needs more research
data") and I'll implement it immediately and move to the next one. I'll also
update `docs/ASTROLOGER_REVIEW_QUEUE.md` as we resolve each.

Already resolved this cycle (for context, not part of today's session):
A-1 (Stree Dirgham threshold), A-2 (functional-nature Kendra/Maraka),
A-4 (porutham label downgrade), A-5 (Sevvai standard house set), A-6
(Mahendra direction) — see `docs/ASTROLOGER_REVIEW_QUEUE.md` → Resolved.

---

## A-7 — Amirdhadhi Yogam grid: 182 of 189 cells unverified

**Severity:** 🔵 disclosure/polish, but it's a **daily-visible field**.

**Where:** [`app/calculations/panchangam.py:278-299`](../app/calculations/panchangam.py#L278-L299)
(`AMIRDHADHI_YOGAM_TABLE`).

**What it is:** Amirdhadhi Yogam (அமிர்தாதி யோகம்) — a fixed weekday ×
nakshatra lookup used by Tamil almanacs to label each day's yoga as
Amirtha (A, auspicious), Siddha (C, neutral-good), or Marana (M,
inauspicious). 7 weekdays × 27 nakshatras = 189 cells.

**Current table** (row key = weekday, 0=Mon..6=Sun; columns = nakshatra 1-27
in order Aswini→Revathi):

```python
AMIRDHADHI_YOGAM_TABLE = {
    6: ("C","C","C","C","C","C","C","C","C","M","C","A","A","C","C","M","M","M","A","C","A","A","M","C","C","A","A"),  # Sun
    0: ("C","C","M","A","A","C","A","C","C","M","C","C","C","C","A","M","C","C","C","C","M","A","C","C","M","C","C"),  # Mon
    1: ("A","C","C","A","C","M","C","C","C","C","C","A","C","C","C","M","C","C","A","C","C","C","C","M","M","A","C"),  # Tue
    2: ("M","C","A","C","C","C","C","C","C","C","A","A","M","C","C","C","A","C","M","A","A","C","M","C","A","C","M"),  # Wed
    3: ("A","C","M","M","M","M","A","A","C","A","C","M","C","C","A","C","C","C","C","C","C","C","C","M","C","C","C"),  # Thu
    4: ("A","C","C","M","C","C","C","M","M","M","C","C","A","C","C","C","C","M","A","C","C","M","C","C","C","C","A"),  # Fri
    5: ("C","C","A","A","C","C","C","C","M","A","C","M","M","M","A","C","C","C","C","C","C","C","C","A","M","C","M"),  # Sat
}
```

**What's already verified (2026-07 audit):** the 7 classical Amrita Siddhi
Yoga anchor pairs — Sun+Hastham(13), Mon+Thiruvonam(22), Tue+Ashwini(1),
Wed+Anuradha(17), Thu+Pushya(8), Fri+Revathi(27), Sat+Rohini(4) — all read
"A" in this table (2 were found wrong and already corrected: Tue+Ashwini and
Wed+Anuradha).

**What's NOT verified:** the other 182 cells — everything except those 7
anchor points.

**The question:** can you cross-check this full 7×27 grid against a printed
Tamil panchangam (ideally a full year, so every weekday×nakshatra
combination that actually occurs gets exercised)? If you have a reference
table (book, trusted app, or an almanac publisher's data) rather than
needing to derive it live, that also works — I can diff it against the
table above cell-by-cell.

**Decision (2026-07-14):** ✅ IMPLEMENTED — **full grid re-sourced**, and the doc's
own premise was wrong. Astrologer supplied the complete 7×27 grid from the **Ungal
Vazhkkai Vazhikatti** panchangam (internally consistent: every weekday row covers
27 nakshatras once, verified three ways — grid, arrays, and raw class-lists all
reconstruct identically). Two rulings:

1. **Adopt the reference wholesale (17 cells changed).** This REVERSES the "7
   Amrita-Siddhi anchor pairs must read A" premise the audit locked. The reference
   classes 5 of those 7 pairs (Sun+Hasta, Tue+Ashwini, Wed+Anuradha, Thu+Pushya,
   Fri+Revathi) as **Siddha (C)**, not Amirtha (A) — only Mon+Shravana and Sat+Rohini
   read A. The conflation was Amrita-**Siddhi** *Yoga* (7 muhurta day/star combos)
   vs. the Amirthadhi daily-classification table; the "Siddhi" pairs landing on the
   Siddha class is the tell. **v29's Tue+Ashwini / Wed+Anuradha "A" corrections were
   therefore wrong and are reverted.**
2. **Model the 4th class P (Prabalarishta, ~3× worse than Marana).** Added
   `"P": "பிரபலாரிஷ்ட யோகம்"` to `AMIRDHADHI_YOGAM_LABELS` (backend) + web i18n
   (`Prabalarishta Yogam`). One P cell per weekday: Sun+Bharani, Mon+Chithirai,
   Tue+Uthiradam, Wed+Avittam, Thu+Kettai, Fri+Pooradam, Sat+Revathi.

`AMIRDHADHI_YOGAM_TABLE` replaced (panchangam.py); cache version bumped v30→**v31**
(persisted `amirdhadhi_yogam_name` strings change, so snapshots recompute). Golden
tests added: structural soundness (27 cells/row, one P/row), the 7 P cells, and a
regression lock asserting the Amrita-Siddhi pairs read Siddha not Amirtha. 25
panchangam tests green.

**⚠️ Single-source caveat (flagged, not blocking):** one Tamil publisher; validate
against a second panchangam (Pambu / Vakya) before treating as final. The **Thu+Kettai(18)
and Fri+Pooradam(20)** Prabalarishta cells diverge from the classical Dagdha-yoga
single-nakshatra list (which gives Thu→U.Phalguni, Fri→Jyeshtha) and are the cells
most worth cross-checking. Noted in the module comment.

---

## A-8 — Soolam parigaram (travel remedy) table: DRAFT

**Severity:** 🔵 low stakes — a single food-word suggestion, not a dosha verdict.

**Where:** [`app/calculations/panchangam.py:216-234`](../app/calculations/panchangam.py#L216-L234).

**What it is:** Soolam (சூலம்) is the day's inauspicious travel direction by
weekday. Parigaram is the food traditionally eaten before travelling in that
direction to nullify the effect.

**Current data:**

```python
SOOLAM_DIRECTION = {
    0: "கிழக்கு",   # Monday — East
    1: "வடக்கு",    # Tuesday — North
    2: "வடக்கு",    # Wednesday — North
    3: "தெற்கு",    # Thursday — South
    4: "மேற்கு",    # Friday — West
    5: "கிழக்கு",   # Saturday — East
    6: "மேற்கு",    # Sunday — West
}
SOOLAM_PARIGARAM_BY_DIRECTION = {
    "கிழக்கு": "வெல்லம்",   # East → jaggery
    "மேற்கு": "தயிர்",      # West → curd
    "வடக்கு": "பால்",       # North → milk
    "தெற்கு": "எண்ணெய்",    # South → oil
}
```

**Already verified:** the direction table itself (`SOOLAM_DIRECTION`) is
correct per the classical 8-slot weekday grid.

**Not verified:** the direction → food mapping (`SOOLAM_PARIGARAM_BY_DIRECTION`).

**The question:** are jaggery/curd/milk/oil the correct parigaram foods for
East/West/North/South respectively? This renders today on the panchangam
card hint text (e.g. "பரிகாரம்: வெல்லம்").

**Decision (2026-07-14):** ✅ IMPLEMENTED — table was wrong. Astrologer-supplied
correction: **East/West were swapped** (East→**Curd** not Jaggery, West→**Jaggery**
not Curd), and North/South refined to the specific traditional words
(**பசும்பால்**=fresh/raw milk, **நல்லெண்ணெய்**=sesame oil) rather than the generic
பால்/எண்ணெய். `SOOLAM_PARIGARAM_BY_DIRECTION` updated (panchangam.py), DRAFT comment
removed, web i18n (`PARIGARAM_NAMES`) synced. Cache version bumped v31→**v32**
(persisted `soolam_parigaram` values change). Golden test added
(`test_soolam_parigaram_direction_food_mapping`); 26 panchangam tests green; web
eslint clean on the touched file.

---

## A-9 — Nadi Dosha cancellation is lenient

**Severity:** 🔵 disclosed product stance, not urgent — but worth a real ruling.

**Where:** [`app/calculations/porutham.py:288-327`](../app/calculations/porutham.py#L288-L327)
(`check_nadi_dosha`).

**Current rule:** Nadi Dosha is flagged when both partners share the same
Nadi group. It is then **fully cancelled** (`has_nadi_dosha=False`,
severity downgraded to "MILD") whenever the two nakshatras fall in
**different rasis** — no other condition required:

```python
if has_dosha and boy_nakshatra != girl_nakshatra:
    if boy_resolved_rasi != girl_resolved_rasi:
        cancellations.append("Different rasi — Nadi Dosha partially mitigated")
final_has_dosha = has_dosha and not cancellations
```

**The concern:** many practitioners require *additional* conditions before
cancelling Nadi Dosha — e.g. same-pada exceptions, or checking rasi-lord
friendship — not "different rasi" alone.

**The question:** is "different rasi alone cancels" too lenient for this
product's audience? If so, what's the correct fuller cancellation rule
(list the conditions, all-must-hold or any-one-suffices)?

**Decision (2026-07-14, superseded same day):** ⏸️ NEEDS MORE RESEARCH — superseded
below once the astrologer returned with a full corrected spec (v2).

**Decision v2 (2026-07-14):** ✅ IMPLEMENTED — full rewrite of `check_nadi_dosha`.
"Different rasi alone" no longer cancels anything (regression on the old bug).
Cancellation now requires one of two Classical Exceptions (Parihāra) — same
nakshatra+different pada, or same rasi+different nakshatra — both apply in
every mode; or a rasi-lord-friendship branch gated by a new
`nadi_parihara_mode` flag (`strict` default / `classical_lenient`,
admin-editable via the existing flag mechanism): lenient mode grants a full
cancel, strict mode records only a disclosed partial mitigation (dosha stays
flagged). A Rajju hard-fail is surfaced independently and can never be
implied-away by a Nadi cancellation (already structurally guaranteed —
`compute_porutham` forces the overall label to CAUTION whenever
`rajju_dosha` is true, regardless of Nadi status). Every cancellation/
mitigation note closes with "this removes only the Nadi objection — other
mandatory poruthams are evaluated independently." New fields on the Nadi
payload: `mitigation` (NONE/LIGHT/MODERATE/FULL, internal), `nadi_parihara_mode`
(always named), `rajju_guard_warning` (non-null only when Rajju fails).
Pada now threaded from real chart data at the call sites that have it
(`app/api/public_tools.py`, `app/services/synastry_service.py` x3); sites
without pada data default to pada=1/1 (conservative — never spuriously grants
the same-nakshatra/different-pada exception). Two pre-existing tests in
`tests/test_porutham.py` asserted the now-corrected old behavior and were
updated; full acceptance-check coverage in `tests/test_nadi_dosha_v2.py`.
`app/schemas/relationships.py` (`NadiDoshaData`) and
`packages/shared/src/types/index.ts` (`NadiDoshaResult`) extended with the 3
new fields (additive/optional, web/mobile unaffected — nothing consumes them
yet). Tamil text for the new user-facing sentences (Classical Exception /
lenient-cancel / strict-partial-mitigation / Rajju-guard notes) is a
first-draft translation, **not yet native-reviewed** — flagged the same way
`daily_briefing_synth`'s glue was before its Tamil pass; needs the same
treatment before being treated as final.

**Verified 2026-07-14:** new test file `tests/test_nadi_dosha_v2.py` (17
tests, every acceptance check in the ruling) + `tests/test_porutham.py`'s 2
updated tests + 1 admin-flags test (new flag name added to its expected set)
all green. Full targeted run across porutham/synastry/PDF-export/admin-flags/
friendship/public_tools (176 tests) green. `packages/shared` + `web` tsc both
clean. A full-suite run separately surfaced a pre-existing, unrelated Postgres
test-DB flake (`test_decisions_api.py`, `relation "users" does not exist`
right after schema reset) — reproduced in complete isolation on a file that
imports nothing this change touches; not caused by this work, flagged
separately, not blocking.

---

## C-3 / C-4 — Native-Tamil review pass, then decide on `daily_briefing_synth`

**Severity:** 🟡 — this is the one most likely to move the product's "feel."

**Where:**
- [`app/services/daily_briefing_synth.py`](../app/services/daily_briefing_synth.py) —
  flag-gated OFF (`daily_briefing_synth`). Composes the six existing daily-guidance
  fragments into one flowing bilingual briefing instead of six equal blocks.
  Docstring says outright: *"the Tamil connective glue below is first-draft
  and marked for a native review pass... The English is production-intent."*
- 40 propensity signature cards: `app/calculations/propensities.py` +
  `app/services/propensity_service.py` (per memory
  `project_propensity_insights_2026-07` — shipped and live, never had a
  native-Tamil/jyotishi read).
- Older service strings the audit flagged as reading odd, e.g. `age_phase`
  phrasing like "தொழிலாளர்" for service-significations
  (`app/services/age_phase_service.py`).

**What "review" means concretely:** read the Tamil `ta` strings in these
files/modules against their English pair, flag anything that reads
stilted, mistranslated, or "machine-made," and give corrected Tamil. This is
a genuinely large surface (40 propensity cards alone) — we don't have to do
it all in one sitting; even a first pass on `daily_briefing_synth.py`'s
connective glue (a few dozen short phrases) is enough to unblock a decision
on flipping the flag.

**The question, once the Tamil is reviewed:** does the synthesized
single-briefing read better than today's six-block layout? If yes, flip
`daily_briefing_synth` ON.

**Decision (2026-07-14):** progress —
- daily_briefing_synth glue ✅ **DONE.** Native-Tamil review completed; all 10
  openers + 3 connectors + action lead corrected and applied to
  `app/services/daily_briefing_synth.py`. Record in
  `docs/tamil-review-daily-briefing.md` (status RESOLVED). Module review notes
  updated. Unit tests (12) green — they assert English + structure, unaffected.
- propensity cards ✅ **REVIEWED + CORRECTED** (40 signatures, ~368 en/ta pairs).
  Extracted every Tamil string (AST over `propensities.py` + registry metadata) into a
  review artifact + `docs/tamil-review-propensity-cards.md`. Reviewer returned a 14-item
  native pass; ALL 14 applied to `propensities.py` (+ `propensity_service.py` for the PR
  card title/topic). Highlights: Sade Sati→**ஏழரை சனி** (TN localisation, both cards);
  killed English calques (மதிப்புகளை பகிரும், பகிரப்பட்ட நேரம்), the unparseable
  இணை ஆலோசனை→**தம்பதியர் ஆலோசனை**, தாமதம்(delay)→**விலகல்**(coolness), செல்லுபடியாகும்
  →**சரியானவை**, standardised சிரமமான→**கஷ்ட** வீடு, sandhi பாபக்→**பாப**, and the
  precision fix **குடியுரிமை (citizenship) → நிரந்தர குடியிருப்பு (PR)** across the PR
  card. Golden regression lock added (`test_native_tamil_review_corrections_locked`);
  34 propensity tests green. ⚠️ Sibling spotted (NOT changed — outside reviewed surface):
  `marriage_service.py:493` also uses `சிரமமான வீட்டில்` — flag for a later consistency pass.
- age_phase + older strings ✅ **DONE.**
  - Applied: `dasha_service.py:41` Saturn `தொழிலாளர்`→**`சேவை`**; and the propensity
    consistency sibling `marriage_service.py:493` `சிரமமான வீட்டில்`→**`கஷ்ட வீட்டில்`**.
  - Extracted all **86** age_phase en/ta pairs (AST + Tamil-codepoint classification,
    handles the file's mixed structures) into `docs/tamil-review-age-phase.md` —
    grouped by section (labels / practical guidance / dasha+gender+strength overlays /
    remedies / year guidance / summary templates), tickable like the propensity doc.
  - Reviewer returned **21 corrections** (11 critical — wrong meaning; 10 significant
    — machine-translated/stilted). ALL 21 applied to `app/services/age_phase_service.py`
    in the same change. Highlights: கட்டுப்பாடுகள்(restrictions)→உறுதிமொழிகள்/முடிவுகள்
    (commitments/decisions, 3 sites); குடியேற்றம்(immigration/colonization)→வாழ்க்கை
    நிலைப்பாடு(life settlement, 2 sites — a real mistranslation, not a style nit);
    மூங்கில் மவுல்(non-word)→பவளக் கல்(coral gemstone, Mars remedy); தசை(muscle)→
    தசா(dasha) — homophone-adjacent slip that changed the sentence's subject; பிரிவு
    (parting/separation)→பற்றின்மை(detachment, Ketu); பகுத்தறிவு(rationalist-movement
    connotation)→விவேகம்(discernment, Rahu); ஆக்கிரமிப்பு(invasion)→ஆக்ரோஷம்
    (aggression, Mars); standardized ஆஞ்சநேய/அஞ்சநேய spelling inconsistency. Golden
    regression lock `tests/test_age_phase_tamil_review.py`; 42 tests green (incl.
    existing `test_age_phase_gender.py`). Record in `docs/tamil-review-age-phase.md`
    (status RESOLVED).

**Flag flip — correction to the 2026-07-14 ruling above:** `daily_briefing_synth`
was found to be **already `True`** in `app/services/feature_flags.py` — flipped ON
in commit `61bed9f` (2026-07-09, `refactor(daily-guidance): consolidate cache, goals,
and service logic`), independent of and prior to this live session. The "flag stays
OFF pending review" framing above was therefore stale — nothing to flip today. The
propensity (C-4) and age_phase Tamil corrections landed as a **quality follow-up on
already-live text**, not as an unblock. No further action needed on the flag itself.

---

## C-5 — Vocabulary drift across surfaces (four grading dialects)

**Severity:** 🔵 polish — coherent within each surface, just inconsistent
across them.

**Where these four tier vocabularies live:**

| Surface | File | Tiers (best → worst) |
|---|---|---|
| Daily guidance band | `app/services/daily_guidance_service.py:1251` | `STRONG_SUPPORT` / `GOOD` / `BALANCED` / `CAUTION` / `RESTORATIVE` |
| Prediction interpretation | `app/calculations/prediction_score.py:67-74` | `EXCEPTIONAL` / `STRONG` / `GOOD` / `MIXED` / `DIFFICULT` / `VERY_WEAK` |
| Synastry (relationship) | `app/services/synastry_service.py:269` | `SUPPORTIVE` / `MIXED` / `CAREFUL` |
| Porutham (marriage) | `app/calculations/porutham.py:391-430` | `EXCELLENT` / `GOOD` / `AVERAGE` / `CAUTION` |

A customer moving between Today, Life-Areas, Family compatibility, and
Porutham currently meets four different grading vocabularies with
different tier counts (3, 4, 5, and 6 tiers respectively) and different
Tamil words per tier.

**The question:** should these share one Tamil verdict lexicon (a shared
word for "best," a shared word for "needs caution," etc.) even if the
internal enum names / tier *counts* stay different per domain (porutham
genuinely has a different number of meaningful buckets than a 6-tier
prediction score)? If yes, what should the shared words be?

**Decision (2026-07-14):** ✅ YES — UNIFY. Adopt one shared Tamil verdict lexicon
across all four surfaces (shared word for "best," shared word for "needs
caution," etc.); internal enum names and per-domain tier *counts* stay
different. Exact Tamil words to be chosen during the C-3/C-4 native-Tamil review
pass, then mapped onto each surface's tiers. Implementation blocked only on
finalizing the words.

**Implemented (2026-07-14):** ✅ FULL ROLLOUT. Shared 4-rung ladder
(மிகச் சிறந்த / நல்ல / சமநிலையான / கவனம் தேவை), native-approved, composed with
each surface's own noun so phrases read in context:
- New source of truth: `app/calculations/verdict_lexicon.py` (+ web mirror
  `web/lib/verdict-lexicon.ts`; hand-synced pair). Golden test
  `tests/test_verdict_lexicon.py` asserts cross-surface consistency.
- **Daily** (`web/lib/format.ts`): STRONG_SUPPORT→மிகச் சிறந்த நாள், GOOD→நல்ல
  நாள், BALANCED→சமநிலையான நாள், CAUTION→கவனம் தேவை, RESTORATIVE→**ஓய்வு நாள்**
  (own honest word, not "caution"). Tones/colours unchanged.
- **Porutham** (`web/.../PoruthamTool.tsx`): EXCELLENT→மிகச் சிறந்த பொருத்தம், etc.
- **Synastry** (`app/services/synastry_service.py`): romanized Tamil
  ("Inakkam nandraaga…") **converted to Tamil script**, leading with the shared
  verdict word — fixes a real quality bug in passing.
- **Prediction** (`app/calculations/prediction_score.py`): EXCEPTIONAL lead
  aligned to மிகச் சிறந்த; GOOD (நல்ல) / MIXED (கலப்பான) already family-consistent.
- Out of scope this pass (flagged): `compatibility_intelligence.py` (a separate,
  larger sub-label vocabulary — its overall_label already uses porutham's family).
- Verified: backend tests green (verdict/porutham/relationships/prediction);
  web format vitest (6) + tsc + eslint green. Live visual pass still worth doing.

---

## C-6 — Guest tier has no chart preview at all

**Severity:** 🔵 — product framing more than an astrology question, included
for completeness.

**Where:** [`app/core/tier_limits.py:46-72`](../app/core/tier_limits.py#L46-L72) —
`"guest": TierLimits(birth_profiles_max=0, ...)`.

**Current state:** a signed-out guest can only use the public tools
(porutham calculator, panchangam lookup) and 2 Ask-Vinaadi questions/day.
No birth chart at all pre-signup — deliberate, per the tier plan (memory
`project_tier_plan`). This means the product's best trust-builder
(explainable daily guidance) is invisible before signup.

**The question (product call, not astrology):** is a one-shot, ephemeral
(not saved) chart preview for guests worth building? This is really a
product-owner decision — flag if you want to discuss it, otherwise it can
stay parked.

**Decision (2026-07-14):** ✅ RESOLVED — KEEP PARKED. Product owner confirms the
current tier plan stands: no guest chart pre-signup, only public tools +
2 Ask-Vinaadi/day. No code change. Item closed.

---

## EC-1 — Tithi Shoonya rasi table (திதி சூன்யம்) — table needed

**Severity:** 🟡 — a per-chart dosha verdict; wrong table = silently wrong output.

**Where:** [`app/calculations/birth_conditions.py`](../app/calculations/birth_conditions.py)
— `TITHI_SHOONYA_TABLE` (empty) gated behind `TITHI_SHOONYA_TABLE_VERIFIED = False`.

**What it is:** Tithi Shoonya rasi — each lunar day (tithi) is classically said
to render one or more zodiac signs "void" (shoonya); a planet sitting in a
shoonya rasi for that birth tithi loses strength. Part of the 2026-07
edge-conditions expansion (memory `project_edge_conditions_expansion_2026-07`),
built from a customer's premium-astro checklist.

**Current state:** the full engine, schema (`ChartBirthCondition`), the
"Border Alert" response block, the web card, and tests are all built and
wired. The lookup table is **deliberately empty** so the feature emits nothing
until verified — it is dormant, not wrong.

**Why it's here, not guessed:** the published Tithi Shoonya tables genuinely
diverge across sources (Uttara Kalamrita vs. Muhurtha Chintamani vs. regional
Tamil panchanga usage) — differing on both *which* tithi voids *which* rasi and
whether it's one rasi or a pair. Per this project's standing rule (memory
`feedback_astrology_calc_accuracy`), a divergent table is not something a
coding session should pick a side on.

**The question:** what is the authoritative tithi (1-30, or 1-15 repeating per
paksha) → shoonya rasi(s) table for this product's Tamil Thirukanitham
tradition? Give me the 15- or 30-row mapping (or point me at a printed
panchangam/book table) and I'll populate `TITHI_SHOONYA_TABLE`, flip
`TITHI_SHOONYA_TABLE_VERIFIED = True`, and add a golden test in the same change.

**Decision (2026-07-14):** ✅ RESOLVED — **RETIRED as a Dagda duplicate**. The
astrologer's disambiguation showed four distinct doshas share the "Shoonya/
Dagdha" words; the resolution rule is to inspect the flag's key. Our
`TITHI_SHOONYA` was keyed **tithi → rasi(s)**, which is exactly Dagda Rasi
(Dagdha Rasi = Shoonya Rasi = Zero Rasi). So it was retired — removed
`tithi_shoonya_rasis`, `TITHI_SHOONYA_TABLE`, `TITHI_SHOONYA_TABLE_VERIFIED`,
and the duplicate flag; the single `DAGDA_RASI` flag (EC-2) now covers it. The
"திதி சூன்யம்" label is deliberately avoided going forward — it collides with the
distinct **Maasa Shoonya Tithi** dosha (lunar-month → void *tithi*), which is NOT
modelled. Regression test asserts the retired symbols are gone; 20 tests green.
Related unmodelled doshas noted in code for future scope: Dagdha Tithi
(solar-month → burnt date), Maasa Shoonya Tithi (month-keyed table provided in
the reference appendix, partial/unverified), Dagdha Yoga (weekday × tithi).

---

## EC-2 — Dagda rasi table (தக்த ராசி) — table needed

**Severity:** 🟡 — a per-chart "burnt sign" verdict; same silent-wrong risk as EC-1.

**Where:** [`app/calculations/birth_conditions.py`](../app/calculations/birth_conditions.py)
— `DAGDA_RASI_TABLE` (empty) gated behind `DAGDA_RASI_TABLE_VERIFIED = False`.

**What it is:** Dagda ("burnt") rasi — a sign rendered burnt for a birth by the
combination of the **solar month** (Sun's sidereal sign) and the **tithi**. A
planet in the dagda rasi is weakened. Same expansion as EC-1.

**Current state:** engine + schema + Border-Alert plumbing + tests all built;
`dagda_rasi(sun_rasi, tithi_number)` returns `None` until the table is filled.
The signature already keys on `(sun_sidereal_rasi, tithi_within_paksha 1-15)`
— if the authoritative rule keys differently (e.g. weekday×tithi "Dagdha yoga"
combinations rather than solar-month×tithi), I'll adjust the key shape to match.

**Why it's here, not guessed:** sources conflate at least two distinct
"burnt" concepts (solar-month×tithi Dagda rasi vs. weekday×tithi Dagdha/Visha/
Hutasana yogas). Picking one and its cell values live would be a guess.

**The question:** (a) which concept does this product want under "Dagda rasi" —
solar-month×tithi, weekday×tithi, or lunar-month based? (b) what are the
authoritative cell values? Give me the rule + table and I'll populate it, flip
`DAGDA_RASI_TABLE_VERIFIED = True`, and add a golden test.

**Decision (2026-07-14):** ✅ IMPLEMENTED — concept **(a) corrected**. The
astrologer's authoritative "Zero Rasi" table (Vidya Madhaviya lineage) shows
Dagda Rasi is **tithi-keyed and paksha-independent** (tithi name 1-14;
Purnima/Amavasya = none), NOT solar-month × tithi. The old
`dagda_rasi(sun_rasi, tithi)` key was actually the *different* "Dagdha Tithi"
dosha (burnt date). Reshaped `dagda_rasi(tithi_number) -> tuple[int, ...]`,
populated the 14-row table, flipped `DAGDA_RASI_TABLE_VERIFIED = True`, updated
the flag (now lists all burnt signs; Chaturdashi has 4), and added a golden
test. 20 birth-condition/explanation tests green. Symmetric pairs (1↔12, 2↔11,
5↔8, 9↔10) and empty full/new moon are stable; interior rows flagged for a
Tamil-panchangam / B.V. Raman *Muhurtha* cross-check.

**⚠️ Raised for EC-1:** the same reference states **Dagda Rasi = Shoonya Rasi**
(synonyms), i.e. EC-1's Tithi-Shoonya table is very likely this *same* tithi-keyed
table. If so, `TITHI_SHOONYA` should not carry a separate table (double-report).
See EC-1 for the resolution needed.

---

## EC-3 — Conditional nakshatra dasha tables: confirm single-source anchor

**Severity:** 🟡 — seven per-chart dasha timelines; a wrong table = silently
wrong periods. Currently shipped **experimental / display-only** (behind the
"more advanced astrology" gate), never fed into scoring — same posture as
Ashtottari and Kalachakra.

**Where:** [`app/calculations/conditional_dashas.py`](../app/calculations/conditional_dashas.py)
— `CONDITIONAL_DASHA_SYSTEMS` (the seven `ConditionalDashaSystem` configs).
Route `GET /charts/{id}/conditional-dashas`; web panel
`web/components/dashboard-conditional-dashas-panel.tsx`.

**What it is:** the seven Parashari **conditional** udu-dashas — Shodashottari
(116y), Dwadashottari (112y), Panchottari (105y), Shatabdika (100y),
Chaturashiti-sama (84y), Dwisaptati-sama (72y), Shashtihayani (60y) — each a
Vimshottari variant with its own lord cycle, per-lord year table, and starting
nakshatra. Part of the 2026-07 edge-conditions expansion, Tranche 3 (memory
`project_edge_conditions_expansion_2026-07`).

**Current state:** all seven engines + service + shared client + web panel +
tests are built and live behind the advanced gate. The generalised engine's
*machinery* is proven correct by a golden test that reproduces Vimshottari
exactly when fed the 120y/9-lord table. The *tables* are anchored to a single
cited source (satyori.com, citing R. Santhanam's BPHS translation — the same
source `ashtottari_dasha.py` trusts), corroborated by the traditional web
numbers on the -ottari family.

**Why it's here, not final:** a second systematised source (astrosutras.in)
gives **materially different** tables for the same dashas — e.g. a natural
Sun→Rahu lord order with monotonically increasing years, and Rahu = 48y in
Panchottari — which we deliberately did **not** blend in. The satyori tables
in code are (lord order → years, start nakshatra):

- **Shodashottari** (start Pushya): Sun 11, Mars 12, Jupiter 13, Saturn 14, Ketu 15, Moon 16, Mercury 17, Venus 18.
- **Dwadashottari** (start Revati): Sun 7, Jupiter 9, Ketu 11, Mercury 13, Rahu 15, Mars 17, Saturn 19, Moon 21.
- **Panchottari** (start Anuradha): Sun 12, Mercury 13, Saturn 14, Mars 15, Venus 16, Moon 17, Jupiter 18.
- **Shatabdika** (start Revati): Sun 5, Moon 5, Venus 10, Mercury 10, Jupiter 20, Mars 20, Saturn 30.
- **Chaturashiti-sama** (start Swati): all seven grahas Sun→Saturn, 12 each.
- **Dwisaptati-sama** (start Mula): all eight (Sun→Saturn + Rahu), 9 each.
- **Shashtihayani** (start Ashwini): Jupiter 10, Sun 10, Mars 10, Moon 6, Mercury 6, Venus 6, Saturn 6, Rahu 6.

**The question:** are these seven lord-order/year tables and starting
nakshatras correct for this product's tradition? For any that differ, give me
the corrected order + years + start nakshatra and I'll update the config and
its golden test in the same change.

**Decision (2026-07-14):** ✅ TABLES CONFIRMED, BUG FOUND + FIXED. Astrologer
confirmed all seven lord-order/year/anchor tables match the classical BPHS /
R. Santhanam standard exactly — **no cell corrections needed**. But the
reference also flagged four implementation gotchas that a correct table alone
doesn't protect against; checked all four against the code:

1. **Counting direction (real bug, fixed).** BPHS phrases six systems
   "count from the anchor to the Janma Nakshatra" (anchor → janma) but phrases
   **Dwadashottari in reverse** — "from the Janma Nakshatra to Revati" (janma
   → anchor). The shared `nak_lord()` formula used one direction for all
   seven, so Dwadashottari's opening lord was silently wrong for most births
   (reversing direction is not equivalent to negating the step count mod 8,
   since 27 isn't a multiple of 8). Added `count_from_janma: bool` to
   `ConditionalDashaSystem`, set `True` only for Dwadashottari, branched
   `nak_lord()` accordingly (`app/calculations/conditional_dashas.py`). T003
   reference chart's Dwadashottari opening lord moves **MERCURY → SUN**.
2. **Remainder→lord indexing (checked, not a bug).** Verified algebraically
   that the code's 0-indexed `steps % N` is exactly equivalent to the
   classical 1-indexed "remainder 1→first lord, remainder 0→last lord"
   convention (count = steps+1; (count-1) % N ≡ steps % N always). No change.
3. **Equal-year system order (checked, correct).** Chaturashiti-sama and
   Dwisaptati-sama sequences already match the confirmed naisargika order
   (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn[, Rahu]).
4. **Divisor (checked, correct).** 7-lord systems divide by 7, 8-lord systems
   by 8 — no copy-paste drift found.

Two source-level ambiguities noted, not acted on: a 54-year Shashtihayani
variant circulates elsewhere (we ship the mainstream Santhanam 60y reading —
kept); Panchottari's applicability condition varies by source (already pinned
to BPHS's Cancer-lagna+Cancer-D12 wording under EC-5.1, unaffected here).

Tests updated: `test_nak_lord_wraps_before_start` re-targeted to Shodashottari
(a direction-neutral wrap case), new `test_nak_lord_dwadashottari_reversed_direction`
locks the reversed-count behavior, `test_t003_opening_lords_are_deterministic`
updated for the new Dwadashottari opening lord. 114 tests green
(`test_conditional_dashas.py` + `test_conditional_dashas_api.py` +
`test_ashtottari_dasha.py`).

---

## EC-4 — Shashtihayani nakshatra grouping: uniform vs non-uniform

**Severity:** 🔵 — one of the seven EC-3 dashas; affects only *which* opening
lord a birth gets, not the period lengths.

**Where:** `conditional_dashas.py` — `ConditionalDashaSystem.nak_lord` +
the `shashtihayani` config.

**What it is:** the rule that maps the Moon's janma nakshatra to the opening
dasha lord. For six of the seven systems satyori states a **uniform** rule —
"count nakshatras from the start nakshatra, divide by N (lord count), remainder
selects the lord" — which we implement as `SEQUENCE[((n - start) % 27) % N]`.

**Why it's here:** for **Shashtihayani specifically**, satyori's prose implies
a **non-uniform** grouping ("Guru governs Ashwini through Krittika" = 3
nakshatras, "Surya covers Rohini through Punarvasu" = 4 nakshatras…), which
does not match the uniform "divide by 8" rule the same page states for the
others. We implemented the uniform rule for family consistency and flagged the
discrepancy rather than guess a bespoke 27→8 grouping.

**The question:** does Shashtihayani use the same uniform count-and-mod rule as
the rest of the family, or a specific non-uniform nakshatra→lord grouping? If
non-uniform, give me the full grouping (which nakshatras → which lord) and I'll
special-case its `nak_lord` and add a golden test.

**Decision (2026-07-14):** ✅ IMPLEMENTED — **non-uniform, confirmed**. The
astrologer's reference (BPHS Ch.47 v.40-41, Astroseekers/Sunil Dutt citation)
gives contiguous 3-4 nakshatra blocks per lord (Jupiter: Ashwini-Krittika, Sun:
Rohini-Punarvasu, Mars: Pushya-Magha, Moon: P.Phalguni-Chitra, Mercury:
Swati-Anuradha, Venus: Jyeshtha-U.Ashadha, Saturn: Abhijit-Dhanishta, Rahu:
Shatabhisha-Revati) — mod-8 disagrees with this table on 7 of the first 8
nakshatras, confirming it's a structurally different algorithm, not a
rounding-edge variant. Two implementation consequences beyond a simple table
swap:

1. **The true sequence has 28 members, not 27.** Abhijit (sidereal
   6°40′–10°53′20″ Capricorn = 276.667°–280.889°) is a real inserted
   nakshatra folded into Saturn's block, shifting the Venus/Saturn boundary
   3°20′ earlier than the classical U.Ashadha/Shravana line. Modelled as
   absolute-longitude blocks (`_SHASHTIHAYANI_BLOCKS` in
   `conditional_dashas.py`), not as a general 28-nakshatra system elsewhere.
2. **Balance-of-dasha must use the full block, not the single occupied
   nakshatra** (an inference forced by the block model itself, not stated
   explicitly in the reference — flagging in case it needs a second look):
   since one lord's mahadasha spans 3-4 contiguous nakshatras, computing
   balance from the single occupied nakshatra would incorrectly reset the
   fraction at every nakshatra boundary *inside* the same lord's block.
   `calculate_opening()` now branches on `degree_blocks` for exact-longitude
   lookup + full-block fraction; `nak_lord()` branches on a
   midpoint-of-nakshatra lookup for table-level/display checks (can't
   resolve the Abhijit sliver inside U.Ashadha, which only the exact
   longitude path handles).

`sequence`/`years` (lord order, per-lord years) are unchanged — only the
janma-nakshatra→opening-lord assignment changes. T003 reference chart's
Shashtihayani opening lord moves MARS→**VENUS** (Mula falls in Venus's block).
Golden tests added: full block-boundary set from the reference, the
Bharani-diagnostic (mod-8 vs block table's first disagreement), the Abhijit
boundary itself, and the full-block balance fraction. 117 tests green
(`test_conditional_dashas.py` + `test_conditional_dashas_api.py`).

**⚠️ Single-source caveat (astrologer-flagged, not blocking):** blocks 3-8 rest
on one fully-sourced citation (Astroseekers/Sunil Dutt, citing BPHS); validate
against Jagannatha Hora's Shashtihayani output before treating as final — same
posture as the Amirthadhi grid (A-7). Still shipped experimental/display-only
behind the advanced gate, unaffected by scoring either way.

---

## EC-5 — Conditional-dasha applicability rules + day/night approximation

**Severity:** 🔵 — the applicability report is **informational only** (it never
hides a dasha or feeds scoring), so a wrong condition mislabels a chip, not a
timeline.

**Where:** `conditional_dashas.py` — `evaluate_applicability`; the day/night
derivation is in
[`app/services/conditional_dashas_service.py`](../app/services/conditional_dashas_service.py).

**What it is:** each conditional dasha is classically *selected* by a birth
condition. The selector reports, per system, Applies / Does not apply / Needs
review. Conditions as coded (satyori wording): Shodashottari = day+Krishna or
night+Shukla; Dwadashottari = lagna in a Venus navamsa; Panchottari = Cancer
lagna **and** Cancer dvadamsa; Shatabdika = vargottama lagna; Chaturashiti =
10th lord in the 10th; Dwisaptati = lagna lord in the 1st or 7th; Shashtihayani
= Sun in the lagna.

**Two things to confirm:**
1. **Rule wording** — sources word several conditions differently (e.g.
   Shodashottari is elsewhere "day birth + strong lagna lord"; Shatabdika is
   elsewhere "Moon in Cancer/Leo" rather than vargottama lagna). Are the
   satyori conditions above the ones this product should use?
2. **Day/night approximation** — Shodashottari needs "day vs night birth."
   We currently approximate it from the Sun's whole-sign house (houses 7–12 =
   above horizon = day), flagged `isDayBirthApproximate: true`. A precise test
   needs the birth-time sunrise/sunset. Is the whole-sign approximation
   acceptable for an informational chip, or should we compute true
   above/below-horizon from the birth time?

**Decision (2026-07-14):**
1. **Rule wording:** ✅ ACCEPT SATYORI CONDITIONS as coded. The applicability
   report is informational-only, so this is settled without further sourcing.
   No code change.
2. **Day/night:** 🔧 COMPUTE TRUE HORIZON. Replace the whole-sign approximation
   with a real above/below-horizon test from the birth-time sunrise/sunset.
   `isDayBirthApproximate` retired once the true calc is wired.
   → implemented 2026-07-14 (see EC-5.2 commit below).

---

## EC-6 — Ashtottari opening-lord formula: latent pre-start-nakshatra bug

**Severity:** 🔵 — found while building EC-3; affects the (already gated /
experimental) Ashtottari dasha, not the new conditional family.

**Where:** [`app/calculations/ashtottari_dasha.py`](../app/calculations/ashtottari_dasha.py)
— `NAK_LORD = {n: ASHTOTTARI_SEQUENCE[(n - 3) % 8] ...}`.

**What it is:** Ashtottari's nakshatra→opening-lord map uses `(n - 3) % 8`,
which omits the "count forward mod 27 first" step. For a birth whose Moon
nakshatra *precedes* the start nakshatra (Krittika = 3) — i.e. Ashwini (1) or
Bharani (2) — this takes a raw negative modulo and yields a **different opening
lord** than the classical forward-count rule `((n - start) % 27) % N` (which
the new `conditional_dashas.py` uses correctly). Example: Ashwini gives Rahu
under the current formula, but Moon under the forward-count rule.

**The question:** confirm the correct Ashtottari opening lord for Ashwini- and
Bharani-born charts (and whether Ashtottari even uses the same forward-count
convention). If the forward-count rule is right, I'll switch Ashtottari's
`NAK_LORD` to `((n - 3) % 27) % 8` and update its golden test — a one-line fix,
held only because Ashtottari is itself display-only and pending cross-check.

**Decision (2026-07-14):** ✅ IMPLEMENTED — but the doc's premise was wrong twice
over. The astrologer supplied the authoritative **Ardra-adi grouping** (Jataka
Parijata / B.V. Raman lineage): Ashwini(1)/Bharani(2)/Revati(27) → **Rahu**
(stable across all sources), NOT Moon. The forward-count "fix" this item
proposed would have *broken* it (Moon is wrong under every Ardra-adi source),
and the grouping is **non-uniform** (runs 3/3/3/4/3/4/3/4), so a modulo formula
can't express it at all. Replaced `NAK_LORD` with the explicit 27-row table
(`app/calculations/ashtottari_dasha.py`), rewrote the docstring, and updated the
golden tests (the T003 reference chart's opening lord moves SUN→**MERCURY**,
since Mula(19)→Mercury). 118 dasha tests green. Anchors (Ashwini/Bharani/Revati
→ Rahu) locked; interior boundaries flagged for a Jagannatha Hora cross-check.
Applicability-gating (Ardra-adi is classically conditional on Rahu vs. lagna
lord) remains deferred as a separate product call — noted in the module.

---

## EC-7 — Scoring weight for the verified edge conditions (Cazimi magnitude + birth conditions)

**Severity:** 🟡 — Cazimi already moves the daily/prediction score today with an
**engineer-chosen magnitude**; the birth-condition part is a genuine "should it
score at all" product+astrology call.

**Where:**
- Cazimi / combustion magnitudes:
  [`app/calculations/chart_strength.py:487-492`](../app/calculations/chart_strength.py#L487-L492)
  — `shadbala += 12.0` for Cazimi, `shadbala -= 20.0` for combustion.
- Birth conditions: [`app/calculations/birth_conditions.py`](../app/calculations/birth_conditions.py)
  (Sankranti/Grahana boundary births) — currently **display-only**; now also
  named in the "Why this prediction?" explanation
  (`chart_explanation_service.py`), but with **zero effect on the score**.

**Context (2026-07-14):** the explanation now surfaces Cazimi and the
Border-Alert birth conditions as qualitative reasons. That wiring is purely
narrative — it does not change any score. Two scoring questions remain open:

1. **Cazimi magnitude.** A cazimi planet gets `+12` shadbala instead of the
   `−20` combustion penalty — a `+32` swing versus a combust planet. This was
   an engineering estimate, not a cited value, and it feeds the daily score and
   prediction score via `strength_score`. Is `+12` (and the `−20` combustion
   penalty it replaces) the right magnitude, or should it be tuned?

2. **Birth conditions in scoring.** Sankranti/Grahana boundary births are
   ephemeris-verified facts. Should either carry a scoring weight (e.g. a small
   caution to the day/prediction score, or a per-planet adjustment), or stay
   display-only? If they should score: how much, applied where (whole-chart
   tone vs. a specific planet/house), and for which conditions? Nothing is
   wired here until you rule — the unverified conditions (Tithi-Shoonya EC-1,
   Dagda EC-2) stay out of scoring regardless.

**The question:** confirm the Cazimi/combustion magnitudes, and decide whether
(and how much) the verified birth conditions should influence the score. Give
me magnitudes + placement and I'll wire them into `chart_strength.py` /
`_dg_scoring.py` with a regression test in the same change.

**Decision (2026-07-14):**
1. **Cazimi magnitude (+12 / −20):** ⏸️ NEEDS MORE RESEARCH. Astrologer wants a
   cited value before we confirm or tune the estimate. Code left unchanged
   (`chart_strength.py:490` `+12.0`, `:492` `−20.0` stand as-is).
2. **Birth conditions in scoring:** ⏸️ NEEDS MORE RESEARCH. Sankranti/Grahana
   boundary births stay **display-only** (narrative in "Why this prediction?",
   zero score effect) until a ruling on whether/how much they should weight.
   No wiring added.

Both sub-items stay open in `docs/ASTROLOGER_REVIEW_QUEUE.md`.

**Decision v2 — sub-item 1 (2026-07-15):** ✅ IMPLEMENTED — full ownership call.
Grounded in classical sources (Surya Siddhanta combustion orbs — already matched
in code; the explicit gradient principle "the closer the planet is to the Sun, the
more intense the combustion… treating the orb as a gradient rather than a hard
boundary gives a much truer reading"; cazimi confirmed a Western/Tajika import,
*not* native Parashari — "no Cazimi effect explained in Jyotish scriptures" — but
one classical usage does flip a tightly-conjunct planet weak→fortified, and the
product is already narratively committed to it as a BOOST birth condition). Rulings:

1. **Combustion is now GRADED, not flat.** The old flat `−20` (applied identically
   whether a planet sat 0.5° or 13° from the Sun) is replaced by a linear taper:
   maximum penalty at the cazimi boundary (0°17', most burnt), scaling to **0** at
   the planet's motion-dependent combustion orb edge. New helper
   `combustion_severity(graha, degree, sun_degree, is_retrograde) → [0.0, 1.0]` in
   `app/calculations/transits.py`; the per-planet Surya-Siddhanta orbs
   (`COMBUST_ORBS`) do the differentiating, so a planet near the edge is only
   lightly penalised while a near-exact one takes the full weight. This is the real
   correctness win — a barely-combust planet no longer eats the same penalty as a
   nearly-conjunct one.
2. **Max combustion penalty `−22`** (`MAX_COMBUSTION_PENALTY`, at the cazimi
   boundary) — slightly deeper than the old flat `−20` because that near-conjunction
   worst case is genuinely severe, while the *average* combust planet now scores
   materially higher than before.
3. **Cazimi bonus `+12 → +10`** (`CAZIMI_BONUS`) — kept as the single strongest
   positive modifier (above retrograde `+8`) for the rarest/most-exalted condition,
   but the uncited `+12` outlier is retired.

`chart_strength.py`: import swapped `is_combust` → `combustion_severity`, two named
module constants added, the cazimi/combustion block rewritten. The binary
`is_combust` flag (chart display / PDF "C" marker / `_dg_scoring`) is **unchanged** —
only the *strength magnitude* went graded; display semantics stay binary. Golden
tests added to `tests/test_calculations.py` (EC-7.1 section): `combustion_severity`
geometry (max at cazimi boundary, 0.5 at midpoint, 0 at/beyond orb edge, 0 inside
the heart, 0 for Sun/nodes/Moon); a scoring-order chain
(cazimi > non-combust > shallow-combust > deep-combust) proving graded + boost +
penalty together; and a magnitude regression lock (`+10 / −22`). 93 test_calculations
+ 61 combustion-consumer tests (birth_conditions / chart_explanation_edge / yoga
strength gate / gulika / pdf_export / phase4_predictions) green. No route/schema/type
surface touched. **Sub-item 2 (birth-condition scoring) stays NEEDS RESEARCH.**
