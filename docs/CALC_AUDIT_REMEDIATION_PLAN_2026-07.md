# Calculation Audit — Remediation Plan (2026-07)

**Status:** ACTIVE work order. Source of truth for fixing every finding from the full-calculation audit (2026-07-15, all 44 modules in `app/calculations/` read line-by-line) plus the ratified [Doctrine Decisions v1.0](DOCTRINE_DECISIONS_V1.md).

**How to use this file (for any coding agent):**
1. Work items are `WI-01 … WI-21`, ordered by priority. Each is independently completable unless a **Depends on** line says otherwise.
2. Do NOT reorder priorities or reinterpret doctrine. Where a decision is cited as `Doctrine §N`, [DOCTRINE_DECISIONS_V1.md](DOCTRINE_DECISIONS_V1.md) is authoritative. Where a corrected table is spelled out below, implement it verbatim.
3. Update the checkbox + status line on each item as you complete it. One commit per work item (or per tightly-related pair), referencing the WI id in the commit message.
4. Items in **OPEN QUESTIONS** must NOT be "fixed" by guessing — they wait for astrologer input. Doing nothing there is correct.

---

## Ground rules (repo-specific — read before touching anything)

- **Shell:** PowerShell, from `D:\sanstro`. No `&&` (use `;`), no `head` (use `Select-Object -First N`). See `CLAUDE.md`.
- **Tests:** run against the test DB or SQLite — NEVER `vinaadi_dev`:
  ```powershell
  $env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
  $env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
  $env:PYTHONUTF8 = "1"; $env:PYTHONIOENCODING = "utf-8"
  .\.venv\Scripts\python.exe -m pytest tests/ -x -q
  ```
- **Tamil text:** files stay UTF-8 without BOM. Never write `.py` via `Out-File`. Any NEW user-facing Tamil string added by these fixes must be listed in the PR description as "pending native review" (repo pattern: reviewed strings get golden-locked in tests later).
- **Tests that pin current (wrong) behavior WILL fail** after several of these fixes. Update the expected values in the test — with a comment citing this file + the WI id — do not weaken the assertion style.
- **API contract rule:** any change to a route path, param, or response shape must be swept across `app/api/`, `packages/shared/src/api/`, `mobile/src/api/`, `web/` in the same change (see `CLAUDE.md` §API contracts). WI-08 and WI-11 are the items most likely to touch response shapes.
- **File deletion policy:** deletion of a *file* is always the last task and requires explicit per-file user approval. Renames (WI-11) are `git mv` + import sweep, not delete-and-recreate. Deleting *entries inside* `festivals.py` (WI-12) is fine once parity tests pass.
- **Never hardcode real personal data** in tests/fixtures. Use synthetic birth data.
- **Golden-validation rule:** domain calc bugs are silent. Every fix below ships with at least one test asserting the corrected value on a concrete input.

### Recommended execution order

```
Phase A (P0, independent, small):  WI-01, WI-02, WI-03, WI-04, WI-05, WI-06
Phase B (doctrine gates):          WI-07  →  WI-12   (sunrise before festivals)
                                   WI-09  →  WI-10   (Jaimini degree before Chara dasha)
                                   WI-08, WI-11      (independent)
Phase C (consistency/docs):        WI-13 … WI-21     (any order)
```

---

# PHASE A — P0 correctness bugs (wrong output today; mechanical fixes)

## WI-01 — Kala Bala day/night sets swap Venus and Saturn ✅❌
- [x] **Status:** DONE (2026-07-16, commit `1f2f3b2`) — `chart_strength._kala_bala_score` now matches `shadbala._nathonnatha_bala`; cross-module consistency test + day/night direction test added (`tests/test_chart_strength.py`).
- **Priority:** P0 — affects every composite planet `strength_score` product-wide (yogas, house lords, propensities, predictions).
- **File:** `app/calculations/chart_strength.py`, `_kala_bala_score` (~lines 239–249).
- **Problem:** `diurnal = {SUN, JUPITER, SATURN}` / `nocturnal = {MOON, MARS, VENUS}`. Classical Nathonnatha rule — confirmed by this repo's own classical engine `shadbala.py:343-360`, which is correct — is:
  - **Day-strong:** Sun, Jupiter, **Venus**
  - **Night-strong:** Moon, Mars, **Saturn**
  - Mercury: always (unchanged).
- **Fix:**
  ```python
  diurnal = frozenset({"SUN", "JUPITER", "VENUS"})
  nocturnal = frozenset({"MOON", "MARS", "SATURN"})
  ```
- **Acceptance criteria:**
  - `chart_strength._kala_bala_score` and `shadbala._nathonnatha_bala` classify all 7 grahas identically (add a cross-module consistency test).
  - For a day birth: Venus kala component > Saturn kala component (all else equal); reversed for a night birth.
- **Ripple:** composite scores shift ±~4–5 points for Venus/Saturn. Expect snapshot/threshold test updates in strength-gated yoga tests, house-lord bands, and possibly propensity fixtures. Update expected values, citing WI-01.

## WI-02 — Graha Maitri: Mercury→Saturn wrongly marked friend (corrupts Nadi parihara) ✅❌
- [x] **Status:** DONE (2026-07-16, commit `1f2f3b2`) — data fix (`porutham.py` line 119, `_gr("MERCURY", "SATURN", 0.5, 1.0)`) confirmed live; all remaining acceptance criteria added: the four explicit `_rasi_lords_mutually_friendly(3,10)/(3,11)/(6,10)/(6,11)` assertions, a Kanni×Magaram Nadi-pair regression, and the full 7-graha cross-module consistency test (`porutham._GRAHA_RELATION` vs `chart_strength._NATURAL_FRIENDS`/`_NATURAL_ENEMIES`) in `tests/test_nadi_dosha_v2.py`.
- **Priority:** P0 — issues wrong Nadi Dosha cancellation/mitigation verdicts in marriage matching (A-9 v2 flow).
- **File:** `app/calculations/porutham.py`, line ~119.
- **Problem:** `_gr("MERCURY", "SATURN", 1.0, 1.0)`. Per BPHS naisargika maitri, Mercury regards Saturn as **neutral**; only Saturn→Mercury is a friend. Consequence: `_rasi_lords_mutually_friendly()` (requires ≥1.0 both ways) wrongly qualifies Mithunam/Kanni × Magaram/Kumbam Moon-sign pairs, granting a full Nadi cancel (lenient mode) or partial mitigation (strict mode) where classically neither applies. Also contradicts `chart_strength._NATURAL_FRIENDS["MERCURY"] == {SUN, VENUS}` (which is correct).
- **Fix:**
  ```python
  _gr("MERCURY", "SATURN", 0.5, 1.0)  # Mercury:neutral, Saturn:friend (BPHS)
  ```
- **Acceptance criteria:**
  - `_rasi_lords_mutually_friendly(3, 10)`, `(3, 11)`, `(6, 10)`, `(6, 11)` (Mercury-sign × Saturn-sign) all return **False**.
  - A Nadi-dosha pair with Moons in Kanni and Magaram, different nakshatras, no classical exception: strict mode → `mitigation == "NONE"`; lenient mode → NOT cancelled.
  - Add a consistency test: for the 7 classical grahas, `porutham._GRAHA_RELATION[(a,b)] == 1.0` ⟺ `b in chart_strength._NATURAL_FRIENDS[a]`, and `== 0.0` ⟺ `b in _NATURAL_ENEMIES[a]`.
  - `_graha_maitri_kuta` pass/fail outcomes are unchanged (it only checks 0.0) — assert one such case to prove no porutham-score regression.
- **Note:** do NOT touch the native-reviewed Tamil strings in this file; the golden test `test_nadi_v2_tamil_strings_native_reviewed_locked` must keep passing.

## WI-03 — D30 (Trimsamsa) even-sign targets use the odd-sign set ✅❌
- [ ] **Status:** NOT STARTED
- **Priority:** P0 (display correctness; contained — lords are identical so Shadbala Saptavargaja is unaffected).
- **File:** `app/calculations/divisional_charts.py`, `compute_d30` (~lines 135–160).
- **Problem:** `even_segments` maps to Libra/Gemini/Sag/Aquarius/Aries (the odd-sign set). Classical BPHS Trimsamsa for **even signs** maps each lord's portion to the lord's **even** sign.
- **Fix (verbatim):**
  ```python
  even_segments = [
      (5.0, 2),   # Venus  -> Taurus
      (7.0, 6),   # Mercury-> Virgo
      (8.0, 12),  # Jupiter-> Pisces
      (5.0, 10),  # Saturn -> Capricorn
      (5.0, 8),   # Mars   -> Scorpio
  ]
  ```
  (`odd_segments` are already correct: Mars→Aries 5°, Saturn→Aquarius 5°, Jupiter→Sag 8°, Mercury→Gemini 7°, Venus→Libra 5°.)
- **Acceptance criteria (golden cases):**
  - 3° Taurus → D30 rasi 2 (Taurus). 10° Cancer → D30 rasi 6 (Virgo). 15° Virgo → D30 rasi 12 (Pisces). 22° Scorpio → D30 rasi 10 (Capricorn). 28° Pisces → D30 rasi 8 (Scorpio).
  - Odd-sign outputs unchanged (assert one: 3° Aries → rasi 1).
  - `SIGN_LORD[new] == SIGN_LORD[old]` for every even-sign degree (proves Saptavargaja invariance) — one parametrized test.

## WI-04 — Compatibility Navamsa: rasi compared against house sets (category error) ✅❌
- [x] **Status:** DONE (2026-07-16, commit `0569f84`) — replaced with `_d9_dignified` (own sign or exaltation); regression tests for both the debilitation-in-kendra trap and the own-sign-not-in-kendra false negative.
- **Priority:** P0 — meaningless +3/+3 in the couple's Navamsa score.
- **File:** `app/calculations/compatibility_intelligence.py`, `_compute_navamsa` (~lines 446–449).
- **Problem:** `sla_d9` / `slb_d9` are D9 **sign numbers** (1–12) of each person's 7th lord, but are tested with `in (_KENDRAS | _TRIKONAS)` — house sets. The couple gets points whenever the sign happens to be numbered 1/4/5/7/9/10.
- **Fix:** replace with a **dignity check** (self-contained, no new data needed):
  ```python
  def _d9_dignified(planet: str, d9_rasi: int) -> bool:
      return (d9_rasi in OWN_SIGN_RASI.get(planet, frozenset())
              or d9_rasi == EXALTATION_RASI.get(planet))
  # ...
  if sla_d9 and _d9_dignified(seventh_lord_a, sla_d9):
      score += 3
  if slb_d9 and _d9_dignified(seventh_lord_b, slb_d9):
      score += 3
  ```
  (If the chart snapshot exposes a D9 lagna field, `house_from_reference(d9_lagna, sla_d9) in KENDRA|TRIKONA` is also acceptable — verify the field actually exists on `ChartCalculateResponseData` before choosing that path. Dignity is the safe default.)
- **Acceptance criteria:** a 7th lord in its D9 debilitation sign numbered 1–10 scores 0 for this component; a 7th lord in own D9 sign scores +3. Update any pinned compatibility fixture scores, citing WI-04.

## WI-05 — Moon-harmony table inverts classical rasi doctrine ✅❌
- [x] **Status:** DONE (2026-07-16, commit `0569f84`) — ratified table implemented verbatim; lookup made structurally symmetric (0-indexed fold, not the 1-based-count trap); symmetry verified for all 144 pairs + consistency vs porutham's Shashtashtaka veto.
- **Priority:** P0 — 2/12 (dwirdwadasa) rated EXCELLENT in the original code; 7 (samasaptama) rated TENSE; lookup was also direction-dependent (not symmetric). Contradicts this repo's own porutham rasi logic.
- **File:** `app/calculations/compatibility_intelligence.py`, `_MOON_HARMONY_TABLE` (~lines 586–594).
- **Fix (verbatim — Doctrine §10 ratified table, count is inclusive `(a-b) % 12 + 1`):**
  ```python
  _MOON_HARMONY_TABLE: dict[int, str] = {
      1: "GOOD",                        # same rasi
      2: "MIXED", 12: "MIXED",          # dwirdwadasa
      3: "GOOD", 11: "GOOD",            # upachaya
      4: "GOOD", 10: "GOOD",            # kendra
      5: "EXCELLENT", 9: "EXCELLENT",   # trikona
      6: "TENSE", 8: "TENSE",           # shadashtaka
      7: "GOOD",                        # samasaptama
  }
  ```
  **Note — do not implement from memory of an earlier version of this WI:** the first-pass draft that circulated before reconciliation had 2/12 → TENSE and 4/10 → MIXED. Both cells are corrected above; use this table, not any earlier one. See `DOCTRINE_DECISIONS_V1.md` §10 for the full reasoning on all three reconciled cells (same-rasi, kendra, samasaptama).
- **Symmetry requirement (new — not in the original finding):** the lookup must be **order-independent**: `harmony(moon_a_rasi, moon_b_rasi) == harmony(moon_b_rasi, moon_a_rasi)`. Fold the sign-distance to the smaller of the two directions **using the 0-indexed difference** before mapping to the table above — folding the 1-based count directly (e.g. `min(count, 13-count)`) is a trap: it collapses samasaptama (7) into the shadashtaka (6/8) bucket, which is wrong. Verify with a parametrized test before trusting any specific formula.
- **Acceptance criteria:** Moons 6 or 8 apart → TENSE; 2 or 12 apart → MIXED; 4 or 10 apart → GOOD; 7 apart → GOOD; 5/9 apart → EXCELLENT; same rasi → GOOD. Symmetry test (`harmony(a,b) == harmony(b,a)`) passes for all 144 rasi pairs. Consistency test: any pair failing porutham `_rasi_score` (6/8 Shashtashtaka veto) must NOT grade above TENSE here.
- **Tamil note:** no new Tamil strings needed (labels are enum values).

## WI-06 — Pushkara Navamsa + Pushkara Bhaga tables are wrong ✅❌
- [x] **Status:** DONE (2026-07-16, commit `6fe7ad2`) — element-keyed navamsa table + standard bhaga degrees implemented; golden tests added. OQ-3 (printed-source cross-check) still open on the astrologer queue.
- **Priority:** P0 — surfaced in every chart payload via `app/services/_chart_planets.py:110`.
- **File:** `app/calculations/nakshatra_analysis.py` (`_PUSHKARA_NAVAMSA`, `_PUSHKARA_BHAGA`, `pushkara_check`).
- **Problem:** current navamsa table has one entry per sign matching no known tradition; classical Pushkara Navamsa assigns **two navamsas per sign by element**. Bhaga degrees diverge from the standard list on 9 of 12 signs.
- **Fix (standard tables — C.S. Patel, *Navamsa in Astrology* lineage):**
  ```python
  # Two pushkara navamsas per sign, by element (navamsa index 1-9 within the sign)
  _PUSHKARA_NAVAMSA: dict[int, frozenset[int]] = {
      1: frozenset({7, 9}),  5: frozenset({7, 9}),  9: frozenset({7, 9}),    # fire
      2: frozenset({3, 5}),  6: frozenset({3, 5}), 10: frozenset({3, 5}),    # earth
      3: frozenset({6, 8}),  7: frozenset({6, 8}), 11: frozenset({6, 8}),    # air
      4: frozenset({1, 3}),  8: frozenset({1, 3}), 12: frozenset({1, 3}),    # water
  }
  # Pushkara bhaga — one exact degree per sign
  _PUSHKARA_BHAGA: dict[int, float] = {
      1: 21.0, 2: 14.0, 3: 18.0, 4: 8.0,  5: 19.0, 6: 9.0,
      7: 24.0, 8: 11.0, 9: 23.0, 10: 14.0, 11: 19.0, 12: 9.0,
  }
  ```
  `pushkara_check` membership test becomes `navamsa_no in _PUSHKARA_NAVAMSA[rasi]`. Keep the ±0.5° bhaga orb.
- **Acceptance criteria:** golden cases — 21° Aries → bhaga True; 21.6° Aries → False; 20–23.33° Aries (7th navamsa) → navamsa True; 0–3.33° Cancer (1st navamsa) → True; 0–3.33° Aries → False.
- **Post-merge action:** add to the astrologer queue (OQ-3) for a printed-source cross-check, per the project's golden-validation rule. Until then the values above are the two-source web-standard tables and strictly better than the current ones.

---

# PHASE B — Doctrine launch gates (Doctrine Decisions v1.0)

## WI-07 — Hindu sunrise: disc center, no refraction (Doctrine §1) ✅❌
- [ ] **Status:** NOT STARTED
- **Priority:** P1 — launch gate. **Do this before WI-12.**
- **Files:** `app/calculations/ephemeris.py` (`calculate_rise_transit_jd`, both backends), `app/calculations/panchangam.py` (`PANCHANGAM_CACHE_DATA_VERSION`).
- **Change:**
  1. Add the rsmi bits to BOTH backends. Swiss Ephemeris values: `SE_BIT_DISC_CENTER = 256`, `SE_BIT_NO_REFRACTION = 512`.
     - **pyswisseph path:** rsmi argument becomes `(CALC_RISE | BIT_DISC_CENTER | BIT_NO_REFRACTION)` (import `BIT_DISC_CENTER`, `BIT_NO_REFRACTION` from `swisseph`; if the installed version lacks the names, define the int constants locally with a comment).
     - **swisseph-ffi path:** OR the same bits into the rsmi parameter of `swe_rise_trans`. If `swisseph_ffi` doesn't export `SE_BIT_*`, define `_SE_BIT_DISC_CENTER = 256; _SE_BIT_NO_REFRACTION = 512` locally.
  2. Bump `PANCHANGAM_CACHE_DATA_VERSION` 32 → 33 with a versioned comment: *"v33: sunrise switched to Hindu sunrise (disc center, no refraction) per Doctrine §1 — every sunrise-anchored field changes, cached snapshots must recompute."*
  3. (Optional, only if trivial) a labeled "observed sunrise" advanced toggle; NOT required for this WI.
- **Everything downstream inherits automatically** (Rahu kalam, Yamagandam, Kuligai, horai, udaya tithi/nakshatra, sunrise lagna, Gowri, tamil_calendar sunset cutoff — sunset shifts symmetrically ~+3 min). No per-consumer changes needed; that's the point of the single anchor.
- **Acceptance criteria:**
  - New sunrise for a fixed test date/place is **later** than the old value by roughly 2–4 minutes (assert direction and magnitude band, not an exact second).
  - Golden validation harness: pick ≥6 dates spread across the year × 2 locations (Chennai + one northern-latitude diaspora city). Compare computed sunrise + Rahu kalam start against ≥2 printed panchangam references supplied by the user/astrologer. **If reference values are not yet available, write the harness with TODO reference slots and mark this WI "code-complete, validation pending" — do not invent reference numbers.**
  - All existing panchangam tests updated (sunrise-derived expected times shift). Cite WI-07 in each changed assertion.
- **Migration:** cache version bump handles persisted snapshots. Nothing else stored derives sunrise.

## WI-08 — Ezharai Sani Murthi: default to ingress-Moon method (Doctrine §3) ✅❌
- [x] **Status:** DONE (2026-07-16, commit `0948921`) — `classify_ezharai_sani_murthi_ingress` + `find_saturn_ingress_jd` added; both service call sites (`daily_guidance_service.py`, `life_areas_service.py`) switched to the ingress method; pada function kept, documented as regional variant, no longer called from any default path. No API/shared/web/mobile sweep needed (grade only ever feeds composed narrative strings, no standalone field existed). OQ-6 (golden murthi dates) still open on the astrologer queue.
- **Priority:** P1 — launch gate.
- **Files:** `app/calculations/transits.py` (murthi section, ~lines 189–208) + every consumer of `classify_ezharai_sani_murthi` (grep `ezharai`, `murthi` across `app/`, `packages/shared/`, `web/`, `mobile/`).
- **Change:**
  1. New function `classify_ezharai_sani_murthi_ingress(janma_rasi: int, ingress_moon_rasi: int) -> dict` implementing:
     | count `((moon - janma) % 12) + 1` | murthi |
     |---|---|
     | 1, 6, 11 | `GOLD` (Swarna) |
     | 2, 5, 9 | `SILVER` (Rajata) |
     | 3, 7, 10 | `COPPER` (Tamra) |
     | 4, 8, 12 | `IRON` (Loha) |
     Reuse the existing grade/ta/en dict shape. Tamil labels already exist (பொன்/வெள்ளி/செம்பு/இரும்பு சனி) — reuse them; no new Tamil strings.
  2. Saturn ingress instant: add `find_saturn_ingress_jd(current_rasi, before_jd)` — walk back day-by-day until Saturn's rasi differs, then bisect (mirror the `_find_sankranti_jd` pattern in `tamil_calendar.py`, but step ~30 days since Saturn spends ~2.5 years per rasi; cap the walk at ~1200 days). Moon rasi at that jd via `calculate_sidereal_planets`.
  3. Rename the existing pada-based function's *output label* to make the variant explicit: keep `classify_ezharai_sani_murthi` working (back-compat) but have the service layer call the ingress method as default and pass the pada result only under an "advanced/regional variant" label ("Traditional Pada Murthi — regional variant").
- **API sweep:** if the murthi payload shape changes (e.g. adds `method` field), update `packages/shared/src/api/` types and the web/mobile renderers in the same change.
- **Acceptance criteria:**
  - Deterministic unit test with a mocked/fixed ingress-moon rasi covering all 12 counts → 4 murthis.
  - Integration test: for one synthetic birth chart and a known Saturn ingress date, the returned murthi matches a hand-computed value.
  - The pada variant is never returned unlabeled.

## WI-09 — Jaimini Rahu degree: 30° − advancement; document 8-karaka scheme (Doctrine §4) ✅❌
- [x] **Status:** DONE (2026-07-16, commit `0cb71aa`) — `_karaka_degree` helper reverses Rahu; docstring updated; T003 regression + tie-break + new Atmakaraka-flip golden test all updated/added. No migration needed (karakas computed per-request from stored longitudes, never persisted themselves).
- **Priority:** P1 — launch gate. **Do before/with WI-10.**
- **File:** `app/calculations/jaimini_karakas.py`.
- **Change:**
  ```python
  def _karaka_degree(planet: str, longitude: float) -> float:
      deg = longitude % 30.0
      return 30.0 - deg if planet == "RAHU" else deg
  ```
  Use `_karaka_degree` in `compute_char_karakas` ranking. Update the module docstring: delete the "counted forward… matching common Tamil practice" paragraph and replace with the Doctrine §4 ruling (30° − advancement; BPHS/Rao/Rath/JHora standard). State explicitly: **8-karaka scheme (Sun..Saturn + Rahu) is the ratified default**; the existing candidate tuple already implements it — this is now doctrine, not accident.
- **Acceptance criteria:**
  - Rahu at 5° of a sign ranks as 25° (beats a planet at 20°); Rahu at 28° ranks as 2°.
  - Golden test: one synthetic chart where forward-vs-reversed produces a different Atmakaraka — assert the reversed result. Cross-check the expected AK/AmK against JHora for that chart if available; otherwise hand-compute and show the working in a test comment.
- **Migration:** grep for persisted karaka outputs (`karakamsa`, `ATMAKARAKA` in `app/services/_chart_persist.py` / chart cache). If chart snapshots cache karakas, bump the relevant chart-cache/schema version so stored charts recompute. If karakas are computed per-request, no migration needed — verify and record which in the commit message.

## WI-10 — Chara Dasha: full K.N. Rao / BPHS rule set (Doctrine §5) ✅❌
- [ ] **Status:** NOT STARTED
- **Priority:** P1 — launch gate. **Depends on:** WI-09 (same subsystem; land Rahu degree first).
- **File:** `app/calculations/jaimini_dasha.py` (full rewrite of `_chara_period_years` + direction logic), consumers: `app/api/charts.py` chara-dasha route, `packages/shared/src/api/charaDasha.ts`, web "Classical Timing" surface, mobile "Jaimini Chara" tab.
- **Interim step (do FIRST, separate small commit):** until the rewrite lands, label the existing output "Experimental — non-standard school" in the API payload/UI and confirm nothing interpretive consumes it (grep consumers). Doctrine §5 interim policy.
- **Rule set to implement:**
  1. **Direction (savya/apasavya):** determined by sign parity groups per the Rao/BPHS convention.
  2. **Years:** count from the dasha rasi to the rasi occupied by its lord, in that direction, inclusive, **minus one**.
  3. **Own sign:** lord in its own sign → **12 years**.
  4. **Scorpio (Mars/Ketu) and Aquarius (Saturn/Rahu):** compute from the **stronger co-lord** per the standard strength-comparison rules (co-tenancy: if exactly one co-lord occupies the sign itself, use the other; otherwise the stronger by the standard placement/degree comparison). This branch is mandatory — do not skip.
  5. Antardasha rules per the same school.
- **Validation strategy (mandatory, resolves sub-school ambiguity empirically):** build golden tests from **≥3 reference charts cross-checked in JHora** (Chara Dasha, Rao's method). The implementation is correct when all three full mahadasha sequences (rasi order + year lengths) match JHora exactly. Use synthetic/celebrity-public birth data only — no real personal data. If JHora access is unavailable, STOP after the interim-labeling step and flag the WI as blocked; do not ship an unvalidated rewrite (that is how the current wrong formula got in).
- **Acceptance criteria:** 3 golden sequence tests pass; the old formula is deleted; the "Experimental" label is removed from UI in the same change that ships validated rules.

## WI-11 — `bhava_chalit.py`: rename to equal-house (Doctrine §6) ✅❌
- [x] **Status:** DONE (2026-07-16, commits `6834794`+`7d42472`) — full coordinated rename across app/schemas, shared TS types, and the 2 web consumers (no mobile consumer existed) rather than a deprecated-duplicate field, since consumer count was small. tsc/eslint/vitest/pytest all green.
- **Priority:** P1 — launch gate (trust issue). Chosen path: **rename** (minimal); true Sripati is an optional follow-up, not part of this WI.
- **Change:**
  1. `git mv app/calculations/bhava_chalit.py app/calculations/equal_bhava.py`; function `compute_bhava_chalit` → `compute_equal_bhava` (keep a deprecated alias `compute_bhava_chalit = compute_equal_bhava` for one release if external callers exist).
  2. Import sweep: grep `bhava_chalit` across `app/`, `tests/`, `packages/shared/`, `web/`, `mobile/`. Note `yogas.py:detect_yogas_and_doshams` takes a `bhava_chalit_map` kwarg (currently unused `_ = bhava_chalit_map`) — rename the kwarg too, keeping a back-compat alias if any caller passes it by name.
  3. **API contract check:** `ChartCalculateResponse.bhavaChalit` is a public field. Renaming a response field breaks web/mobile silently — per doctrine the *module* naming is the trust issue, so: rename module + internals now; for the API field, add `equalBhava` and keep `bhavaChalit` as a deprecated duplicate for one release, OR coordinate a same-change rename across all four surfaces. Decide based on how many consumers grep shows; record the decision in the commit.
  4. Docstring: state plainly "Equal houses from the Lagna degree. NOT Sripati chalit. Primary interpretation in this product remains whole-sign (rasi-as-bhava) per Doctrine §6."
- **Acceptance criteria:** no remaining `chalit` naming that returns equal houses; tsc + eslint + pytest green; web/mobile still render house assignments.

## WI-12 — Festival rules engine; algorithmic Ekadashi (Doctrine §8) ✅❌
- [ ] **Status:** NOT STARTED
- **Priority:** P1 — launch gate (silent 2027 failure). **Depends on:** WI-07 (sunrise definition changes udaya tithi → can flip Ekadashi dates; do not build golden tests on the old sunrise).
- **Files:** `app/calculations/festivals.py` (+ possibly a new `app/calculations/festival_rules.py`), consumers via `panchangam_events_service` / calendar services.
- **Scope:**
  1. **Ekadashi (recurring, both pakshas):** observance day = the civil day whose **Hindu-sunrise tithi** is 11 (Shukla) or 26 (Krishna), with **Smarta dashami-viddha handling**: if the sunrise tithi is still Dashami (10/25) but Ekadashi begins before the next sunrise and prevails at it, the observance shifts to that next day; when Ekadashi prevails at two consecutive sunrises, Smarta takes the **first**. Default reckoning: **Smarta**. (Vaishnava = optional user setting, later — out of scope unless trivial.)
  2. **Move remaining tithi-anchored observances** still hardcoded (monthly Amavasya/Pournami vrata rows if any, Sankatahara Chaturthi already rule-based — verify) into the same recurring machinery in `_recurring_tithi_festivals`.
  3. **Yearly rules engine** — a declarative table: `(tamil_month_index, condition)` where condition is tithi+paksha, nakshatra, or solar-day. Starter rule set (verify each against the existing 2026 hardcode as the parity oracle):
     | Festival | Rule |
     |---|---|
     | Puthandu | Chithirai 1 (solar) |
     | Thai Pongal | Thai 1 (solar) |
     | Aadi Perukku | Aadi 18 (solar) |
     | Thai Poosam | Thai month, Poosam nakshatra day |
     | Vaigasi Visakam | (already rule-based — keep) |
     | Vinayagar Chaturthi | Aavani, Shukla Chaturthi |
     | Krishna Jayanthi (TN) | Aavani, Krishna Ashtami (Rohini preference where applicable) |
     | Deepavali (TN) | Aippasi, Naraka Chaturdashi (Krishna 14 prevailing at pre-dawn) |
     | Karthigai Deepam | Karthigai month, Krithigai nakshatra day (full-moon proximity) |
     | Vaikunta Ekadashi | Margazhi, Shukla Ekadashi |
     | Maha Sivarathiri | (already rule-based Maasi Krishna 14 — keep) |
     | Maasi Magam / Panguni Uthiram / Chitra Pournami / Mahalaya Amavasai | (already rule-based — keep) |
  4. **Parity gate before deleting hardcode:** run the engine across all of 2026 and diff against `_YEARLY_FESTIVALS[2026]` Hindu entries. Every match/mismatch must be explained (a ±1-day shift traceable to the WI-07 sunrise change or a viddha rule is acceptable and should be documented in the test). Only after parity is recorded, delete the Hindu tithi/solar entries from the 2026/2025 hardcode. **Keep** gov/Muslim/Christian holidays hardcoded (not astronomically computable) — those year-lists remain and simply need annual data updates.
  5. Run the engine for 2027 and assert a non-empty festival set (the actual regression this WI exists to prevent).
- **Acceptance criteria:** 2026 parity test recorded; 2027 produces Ekadashis (24–26 of them), Deepavali, Pongal, Karthigai Deepam; no hardcoded Hindu tithi festivals remain; monthly calendar endpoint still renders.

---

# PHASE C — Consistency, exemptions, documentation

## WI-13 — Unify the two Sevvai engines ✅❌
- [x] **Status:** DONE (2026-07-16, commit `c1c437b`) — `_compute_sevvai` now delegates to `detect_sevvai_dosham`; cross-engine regression test for the Mars-clean-from-Lagna-but-7th-from-Moon disagreement case.
- **Priority:** P2 — same person can read "dosham" on the Jadhagam card and "no dosham" in the compatibility report.
- **Files:** `app/calculations/compatibility_intelligence.py` (`_compute_sevvai`, ~line 201) vs `app/calculations/_yoga_dosham.py` (`detect_sevvai_dosham` — the authoritative Tamil-standard engine: Lagna + Moon + Venus references, nivarthi rules).
- **Fix:** `_compute_sevvai` must delegate to `detect_sevvai_dosham` (build the `planets` rasi map + lagna from the snapshot; map the returned `DoshamResult` onto `SevvaiDoshamDetail`, deriving `score` from `is_present/is_cancelled/strength`). Keep `_apply_mutual_sevvai_cancellation` (equivalently pass `partner_has_sevvai_dosham=True` on the second pass — either, but not both).
- **Acceptance criteria:** for the same synthetic chart, the compatibility report's `has_dosham/is_cancelled` equals the main engine's `is_present/is_cancelled` — add a cross-engine consistency test with a chart that has Mars clean from Lagna but in the 7th from Moon (previously the disagreement case).

## WI-14 — Transit Vedha: add classical Sun↔Saturn and Moon↔Mercury exemptions ✅❌
- [x] **Status:** DONE (2026-07-16, commit `5a25d88`) — `_VEDHA_EXEMPT_PAIRS` added; both-direction tests for each pair + an unrelated-planet-still-blocks control.
- **Priority:** P2.
- **File:** `app/calculations/transits.py`, `check_vedha` (~line 234).
- **Fix:**
  ```python
  _VEDHA_EXEMPT_PAIRS = frozenset({frozenset({"SUN", "SATURN"}), frozenset({"MOON", "MERCURY"})})
  # inside the loop:
  if frozenset({planet, other_planet}) in _VEDHA_EXEMPT_PAIRS:
      continue
  ```
- **Acceptance criteria:** Saturn occupying Sun's vedha house does NOT cancel Sun's transit benefit (and vice versa); same for Moon/Mercury; an unrelated planet in the same house still does.

## WI-15 — Sunapha/Anapha/Durudhura: exclude nodes (and Mandhi) ✅❌
- [x] **Status:** DONE (2026-07-16, commit `4e4e89e`) — exclusion set widened to {SUN,MOON,RAHU,KETU,MANDHI}; lone-Rahu-forms-Kemadruma-not-Sunapha consistency test + Mandhi test added.
- **Priority:** P2.
- **File:** `app/calculations/_yoga_detect.py`, `detect_sunapha_anapha_durudhura` (~lines 697–709).
- **Fix:** exclusion set `{"SUN", "MOON", "RAHU", "KETU", "MANDHI"}` instead of `{"SUN"}` (classical: planets other than the Sun form these; nodes never do; Moon is the reference; Mandhi is an upagraha). Matches Kemadruma's existing exclusions in the same file.
- **Acceptance criteria:** a lone Rahu in the 2nd from Moon → no Sunapha (and, with nothing else in 2nd/12th, Kemadruma present — assert both together to lock the consistency).

## WI-16 — Stale Ashtottari note in conditional_dashas docstring ✅❌
- [ ] **Status:** NOT STARTED
- **Priority:** P2 (doc-only).
- **File:** `app/calculations/conditional_dashas.py`, module docstring lines ~44–49.
- **Fix:** the paragraph claiming `ashtottari_dasha.py` uses `(n - 3) % 8` (with a "latent bug") is stale — Ashtottari has used the explicit Ardra-adi `NAK_LORD` table since 2026-07-14 (EC-6). Rewrite that sentence to say the two modules use different, both-correct mechanisms (uniform count-mod-N here; explicit non-uniform table there). No code change.

## WI-17 — Mean-node documentation + optional true-node toggle (Doctrine §2) ✅❌
- [ ] **Status:** NOT STARTED
- **Priority:** P2. Code is already compliant (mean node everywhere, consistent).
- **Required (small):** add a doc/FAQ note — user-facing help or `docs/` — stating: mean node is the deliberate default per Tamil/Vakya practice; **JHora defaults to TRUE node**, so out-of-box JHora comparisons will show Rahu/Ketu differing up to ~1.5°+, occasionally flipping nakshatra pada (which can shift a Vimshottari start). Add the same caveat to `ephemeris.py`'s Rahu section as a comment.
- **Optional (separate follow-up, needs product sign-off):** settings toggle for true node + a boundary warning when mean-vs-true changes the Moon's pada. Do NOT build the toggle as part of this WI without explicit approval.

## WI-18 — Tajaka "Simplified" labeling audit (Doctrine §9) ✅❌
- [ ] **Status:** NOT STARTED
- **Priority:** P2 (verification, likely tiny).
- **Task:** confirm (a) no interpretive/scoring layer consumes `itthasala_pairs`/`isarafa_pairs` (grep `app/services/`, `web/`, `mobile/`); (b) wherever they render, the UI label says "Simplified" prominently. Add the label if missing (EN + TA; new Tamil string → flag for native review). Add a comment in `tajaka.py` citing Doctrine §9 with the deferred deeptamsa-orb spec (Sun 15°, Moon 12°, Mars 8°, Mercury 7°, Jupiter 9°, Venus 7°, Saturn 9°) so a future implementer has it in place.

## WI-19 — Dinam comment/set mismatch: fix the comment ✅❌
- [x] **Status:** DONE (2026-07-16, commit `1f2f3b2`) — comment in `porutham.py` (already corrected in an earlier session) and the matching stale comment in `tests/test_porutham.py` both now describe the published 12-count set as-is, noting 17/22/27 are deliberately excluded. Set itself unchanged (OQ-2 still pending astrologer confirmation).
- **Priority:** P2 (doc-only pending OQ-2).
- **File:** `app/calculations/porutham.py`, lines ~167–175.
- **Problem:** comment says the good-count set includes "9th/18th/**27th** (Parama Mitra tara)" but `_DINAM_GOOD_COUNTS = {2,4,6,8,9,11,13,15,18,20,24,26}` has no 27 (nor 17/22, which a pure tara-mod-9 rule would include). The 12-count **set matches the widely published Tamil dinam list** and is presumed correct.
- **Fix:** correct the comment to describe the set as-is ("the published Tamil 12-count dinam table; note this is NOT the pure mod-9 tara rule — 17/22/27 are deliberately excluded"). Do NOT change the set (that is OQ-2, astrologer's call).

## WI-20 — `_graha_relation` compound friendship rule (Doctrine §11) ✅❌
- [x] **Status:** DONE (2026-07-16, commit `0569f84`) — implemented per the verbatim fix code + the 3-bullet rule + porutham precedent. **Doc inconsistency found and flagged in the commit message:** this WI's own prose example ("Moon×Mercury... should be neutral") contradicts its own rule/code/precedent, all three of which say "enemy" for that exact pair (porutham._graha_maitri_kuta FAILs it). Implemented as "enemy"; the prose sentence above needs an astrologer/doc-owner amendment.
- **Priority:** P1 — Level 6 Dasha Harmony verdict text can currently call an inimical pairing "friendly."
- **File:** `app/calculations/compatibility_intelligence.py`, `_graha_relation` (~lines 55–62).
- **Problem:** checks `b in _NATURAL_FRIENDS[a] or a in _NATURAL_FRIENDS[b]` **before** checking enmity, so a one-way-friend pairing is labelled "friend" even when the other direction is an enemy. Example: Moon regards Mercury as a friend, but Mercury regards Moon as an enemy (`_NATURAL_ENEMIES["MERCURY"] == {"MOON"}`) — currently resolves to "friend"; should be neutral.
- **Fix (per Doctrine §11 — matches `porutham._graha_maitri_kuta`'s existing enemy-priority logic):**
  ```python
  def _graha_relation(a: str, b: str) -> str:
      if a == b:
          return "friend"
      a_enemy_b = b in _NATURAL_ENEMIES.get(a, frozenset())
      b_enemy_a = a in _NATURAL_ENEMIES.get(b, frozenset())
      if a_enemy_b or b_enemy_a:
          return "enemy"
      a_friend_b = b in _NATURAL_FRIENDS.get(a, frozenset())
      b_friend_a = a in _NATURAL_FRIENDS.get(b, frozenset())
      if a_friend_b and b_friend_a:
          return "friend"
      return "neutral"
  ```
- **Acceptance criteria:** `_graha_relation("MOON", "MERCURY") == "neutral"` and `_graha_relation("MERCURY", "MOON") == "neutral"` (order-independent). Add a consistency test: for the 7 classical grahas, this function's "enemy" verdicts agree with `porutham._graha_maitri_kuta`'s fail cases wherever both apply.
- **Ripple:** Level 6 Dasha Harmony `harmony_label` and its EN/TA note text may change for any dasha-lord pair that was previously a one-way-friend read as "friend." Update pinned CI fixtures, citing WI-20.

## WI-21 — Rajju/Vedha veto caps the CI overall label (Doctrine §12) ✅❌
- [x] **Status:** DONE (2026-07-16, commit `0569f84`) — label hard-capped on Rajju/Vedha; `overall_score` and breakdown unchanged; tested with a stubbed strongest-possible fixture (pre-cap 100) for both Rajju and Vedha, plus a no-veto control. Did not add a separate "Traditional Verdict" text field — the plan's own Web/API sweep note says this is backend-only since `overallLabel` is already rendered/colored by the web panel.
- **Priority:** P1 — brand-trust issue: a Rajju-dosha couple can currently see "EXCELLENT" as the Compatibility Intelligence headline.
- **File:** `app/calculations/compatibility_intelligence.py`, `compute_compatibility_intelligence` (~lines 739–758, the overall-label assignment).
- **Problem:** Porutham is only 20 of the CI report's 100 weighted points; a Rajju/Vedha dosha zeroes that component, but the other 7 levels can still push the weighted total into GOOD/EXCELLENT territory, and the veto is relegated to a single risk bullet rather than shaping the headline verdict.
- **Fix (per Doctrine §12 — consistent with the porutham engine's own label-veto precedent):**
  ```python
  # after computing overall_score/overall_label from the weighted breakdown:
  if porutham_result.rajju_dosha or porutham_result.vedha_dosha:
      overall_label = "CAUTION"
  ```
  Keep `overall_score` (the 0–100 number) and the full 8-level breakdown unchanged/displayed as-is — only the headline label is capped. Add a distinct "Traditional Verdict" line surfaced alongside the numeric score (e.g. "Traditional Verdict: CAUTION (Rajju Dosha)") so the veto reads as a governing verdict, not just a risk bullet, per Doctrine §12's UI framing.
- **Acceptance criteria:** a synthetic chart pair with Rajju dosha and otherwise-strong CI component scores (engineer the fixture to hit ≥65 pre-cap) asserts `overall_label == "CAUTION"` after the fix, while `overall_score` stays unchanged. Existing CI fixtures without Rajju/Vedha are unaffected.
- **Web/API sweep:** `CompatibilityIntelligenceData.overallLabel` is already consumed by `compatibility-intelligence-panel.tsx` (the Level-1 porutham badge was fixed 2026-07-15 to color by label, not percentage — that fix is unrelated/already shipped). This WI is backend-only; no shared/web type changes needed since the field already exists and is already rendered.

---

# OPEN QUESTIONS — astrologer queue (do NOT implement without a ruling)

Follow the established pattern: present each as an open request for the authoritative data/rule (see `feedback_astrologer_provides_reference_tables_directly` — the astrologer supplies tables/rulings directly; don't gate on multiple-choice).

- **OQ-1 — Graha yuddha winner rule.** `chart_strength.detect_planetary_wars` currently: loser = lower degree-within-sign. Common software rule (JHora): planet with **lower longitude wins**; classical Surya Siddhanta: northern (higher declination) planet wins. Also: degree-within-sign comparison behaves inconsistently across a sign boundary (29.5° Gemini vs 0.3° Cancer). Need: which rule, and whether comparison is absolute-longitude or declination based.
- **OQ-2 — Dinam good-count set.** Confirm the published 12-count set {2,4,6,8,9,11,13,15,18,20,24,26} is final (i.e., 17/22/27 deliberately excluded), or supply the corrected table. WI-19 fixes only the comment.
- **OQ-3 — Pushkara tables cross-check.** After WI-06, confirm the element-based navamsa pairs + standard bhaga degrees against a printed source (C.S. Patel or a Tamil panchangam appendix).
- **OQ-4 — `EXTENDED_SEVVAI_HOUSES`** is still a placeholder identical to the Tamil-standard set (`_yoga_helpers.py:29`, tracked in ASTROLOGER_REVIEW_QUEUE). Needs the authentic "extended manglik" house list or removal of the mode.
- **OQ-5 — Jeevan/Nethiram unlock (Doctrine §7).** Needs the tables from ≥2 independent printed panchangams. Stays gated until then — no code action.
- **OQ-6 — Murthi golden dates (supports WI-08/WI-07 validation).** Request 3–4 known Saturn-ingress murthi verdicts from a printed panchangam to lock as golden tests.

---

# Master checklist

## Phase A — P0 bugs
- [x] WI-01 Kala Bala Venus/Saturn day-night swap (`chart_strength.py`)
- [x] WI-02 Mercury→Saturn maitri 1.0 → 0.5 — data fix + full acceptance criteria done
- [x] WI-03 D30 even-sign targets → Taurus/Virgo/Pisces/Capricorn/Scorpio
- [x] WI-04 Compatibility navamsa rasi-vs-house category error → dignity check
- [x] WI-05 Moon-harmony table → Doctrine §10 ratified table (EXCELLENT=trikona only; TENSE=shadashtaka only; GOOD=same/upachaya/kendra/samasaptama; MIXED=dwirdwadasa) + symmetry fix
- [x] WI-06 Pushkara navamsa (2-per-sign, by element) + standard bhaga degrees

## Phase B — Doctrine launch gates
- [ ] WI-07 Hindu sunrise (disc center, no refraction) + cache v33 + validation harness  *(before WI-12)*
- [x] WI-08 Murthi default → ingress-Moon method; pada rule as labeled variant
- [x] WI-09 Jaimini Rahu = 30° − advancement; 8-karaka documented; migration check  *(before WI-10)*
- [ ] WI-10 Chara Dasha → full Rao/BPHS rules, JHora-validated golden sequences *(interim: "Experimental" label)*
- [x] WI-11 `bhava_chalit.py` → `equal_bhava.py` rename + API field strategy
- [ ] WI-12 Festival rules engine + algorithmic Smarta Ekadashi; 2026 parity gate; 2027 asserted non-empty

## Phase C — Consistency & docs
- [x] WI-13 Compatibility Sevvai delegates to the main dosham engine
- [x] WI-14 Vedha exemptions: Sun↔Saturn, Moon↔Mercury
- [x] WI-15 Sunapha/Anapha/Durudhura exclude nodes + Mandhi
- [ ] WI-16 Fix stale Ashtottari note in `conditional_dashas.py` docstring
- [ ] WI-17 Mean-node FAQ/doc note (JHora true-node divergence)
- [ ] WI-18 Tajaka "Simplified" label verification + deferred-spec comment
- [x] WI-19 Dinam comment corrected to match the published 12-count set
- [x] WI-20 `_graha_relation` compound rule (enemy-either-direction, friend-both-directions, else neutral) — Doctrine §11 (see WI-20 note: doc's own prose example is internally inconsistent, flagged for amendment)
- [x] WI-21 Rajju/Vedha veto hard-caps the CI overall label at CAUTION — Doctrine §12

## Blocked on astrologer (no code until ruled)
- [ ] OQ-1 Graha yuddha rule · OQ-2 Dinam set · OQ-3 Pushkara cross-check · OQ-4 Extended Sevvai set · OQ-5 Jeevan/Nethiram tables · OQ-6 Murthi golden dates

---

*Audit source: full read of all 44 modules in `app/calculations/` on 2026-07-15. Doctrine source: [DOCTRINE_DECISIONS_V1.md](DOCTRINE_DECISIONS_V1.md) (ratified, two independent Thirukanitham assessments). Amendments to doctrine go through that file first; this plan then follows.*

*WI-20/WI-21 and the WI-05 table correction added 2026-07-16 following Doctrine §10–12 ratification — sourced from a separate porutham-specific audit (2026-07-15) and astrologer reconciliation, not the original 44-module read. WI-02's data fix was applied and verified live in that same porutham-specific session, ahead of this plan's own execution — see the WI-02 status note.*
