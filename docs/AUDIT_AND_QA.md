# Vinaadi AI — Audit & QA Reference
**Consolidated from:** ASTROLOGY_ENGINE_AUDIT.md · VINAADI_CODEX_AUDIT_2026.md · ASTROLOGY_AUDIT_CHECKLIST.md · TEST_PLAN_ASTROLOGY_ENGINE.md  
**Last audited:** 2026-05-26

---

## PART 1 — OVERALL SCORES (Engine Audit)

| Metric | Score |
|---|---|
| Overall System Score | 62 / 100 |
| Calculation Accuracy | 72 / 100 |
| Prediction Logic Depth | 42 / 100 |
| Final Report Presentation | 29 / 100 |
| Code Quality | 80 / 100 |

| Question | Answer |
|---|---|
| Is the system truly Thirukanitham-based? | PARTIAL |
| Prediction-grade or chart-generation-grade? | Chart-generation + Daily Guidance only |
| Production Readiness | MVP ONLY — not production prediction-grade |

**Biggest Strengths:** Swiss Ephemeris + Lahiri sidereal, complete Panchangam, 5-level Dasha, functional benefic/malefic table, Ashtakavarga, Vedha table, Sani cycle classification, clean architecture, bilingual output.

**Biggest Risks:** No Yogam/Dhosham engine; shallow life area prediction (table-driven, no house-lord-karaka chain); daily guidance ≠ Jadhagam prediction; Navamsam calculated but never used; planet strength 30% placeholders; no age-wise prediction; final report is a daily scorecard not a Jadhagam reading.

---

## PART 2 — CALCULATION ACCURACY CHECKLIST

Legend: ✅ PASS | ⚠️ PARTIAL | ❌ FAIL | 🔲 NOT FOUND

### Birth Data Handling
- ✅ DOB, time, place, lat/lon, timezone, IST→UTC conversion, birth time confidence warning
- ❌ DST — `astro.py:77` uses `replace(tzinfo=zone)` — silently wrong UTC for DST ambiguous hours
- ❌ Current age never calculated
- ⚠️ Gender stored but never used in prediction logic
- ⚠️ Missing birth time — raises error; no rectification path

### Astronomical Calculations
- ✅ Swiss Ephemeris, Lahiri ayanamsa (`SIDM_LAHIRI`), sidereal zodiac
- ✅ All 9 grahas, mean-node Rahu, Ketu = Rahu+180°, Lagna from lat/lon
- ✅ Retrograde via speed < 0, thread-safe via RLock
- ✅ Rasi/nakshatra/pada/house calculations, whole-sign system
- ✅ Exaltation, debilitation, own sign, Moolatrikona, friendly/enemy, Avastha
- ✅ Combustion with retrograde orbs, Sandhi (within 1°), Gandanta (3°20' zones), Vargottama (D1==D9)

### Panchangam
- ✅ Tithi, paksha, Nakshatra yoga, Karana, weekday, Yamagandam, Kuligai, Abhijit, Hora, sunrise/sunset cache
- ❌ Rahu Kalam — `panchangam.py:496-504` uses fixed 6 AM + 90-min slots; spec requires `(sunset−sunrise)/8` with day-of-week ordering — diverges up to 90 min in non-equatorial/winter

### Vimshottari Dasha
- ✅ All 5 levels (Maha→Prana), correct sequence and years, balance formula, current dasha lookup
- ❌ Dasha lord nakshatra lord not checked; D9 strength not checked; dasha–event-house connection absent

### Navamsam (D9)
- ✅ D9 rasi per planet (degree-based), Vargottama flag
- ❌ D9 Lagna not computed; D9 never used in marriage analysis, planet strength (bonus=0), or dasha quality

### Planet Strength (65% implemented)
- ✅ Dignity, Avastha, house position, combustion/sandhi/gandanta/retrograde bonuses
- ❌ Vargottama bonus = 0 × 0.10 (placeholder); Drik Bala = 50 × 0.15 (placeholder); full Shadbala = 50 × 0.10 (placeholder)

### Yoga / Dhosham — Status per item
| Item | Status |
|---|---|
| Sevvai Dosham | ✅ Correct (Mars from Lagna/Moon/Venus, house-sign Nivarthi, 5 labels) |
| Rahu-Ketu Dosham | ✅ Mostly correct |
| Pitru Dosham | ✅ Implemented |
| Kala Sarpa | ✅ Implemented (separate from Rahu-Ketu dosham) |
| Gaja Kesari Yoga | ✅ Correct |
| Raja Yoga | ✅ Implemented |
| Dhana Yoga | ✅ Implemented |
| Neecha Bhanga Raja Yoga | ✅ Implemented (2 of 5 cancellation rules) |
| Pancha Mahapurusha Yogas | ✅ Implemented (Ruchaka/Bhadra/Hamsa/Malavya/Sasa) |
| Budha Aditya Yoga | ✅ Implemented (partial label when combust) |
| Vipareetha Raja Yoga | ✅ Implemented (6/8/12 lord in other dusthana) |
| Parivartana Yoga | ✅ Implemented (Maha/Dainya/Kahala sub-types, feeds Raja Yoga) |
| Chandra Mangala Yoga | ✅ Implemented (same rasi or mutual 7th) |
| Nakshatra dosham cautions (Moola/Ayilyam/Kettai) | ✅ Implemented (non-catastrophic framing) |

### Transits
- ✅ Jupiter/Saturn/Rahu/Ketu/Mars/Moon transit, Vedha table, Sani cycles, Chandrashtama, Ashtakavarga bindu modifier
- ❌ Jupiter 5th/9th aspects not checked; Saturn 3rd/10th aspects not checked; transit over natal planets not analyzed

### Life Area Predictions
`life_areas_service.py` has 7 areas (CAREER, MONEY, HEALTH, RELATIONSHIPS, EDUCATION, SPIRITUAL, FAMILY_HARMONY) with transit-house and dasha-lord scoring. This is **table-driven period scoring only** — not natal house-lord chain prediction.
- ⚠️ All 7 areas: transit/dasha score only; no natal house lord chain, no event timing windows, no age-wise filtering
- 🔲 Children (5th house), Foreign travel (9th/12th/Rahu), Property (4th house) — not implemented

---

## PART 3 — KNOWN BUGS (prioritized)

### P0 Blocking
| Bug | File | Fix |
|---|---|---|
| week-ahead 500: `datetime.combine(date, None)` crashes when birth_time_local is None | `daily_guidance_service.py:1115` | Guard: `if birth_profile.birth_time_local is None: use chart.julian_day` |
| dasha_story 500: same None crash | `daily_guidance_service.py:1307` | Raise HTTP 422 if birth time missing |
| Rasi name inconsistency corrupts string lookups: `"Vrichigam"` vs `"Viruchigam"`, `"Midhunam"` vs `"Mithunam"`, `"Thulaam"` vs `"Thulam"` | `astro.py:14-24` | Standardize to spec: Viruchigam/Mithunam/Thulam; run DB migration on chart_planets + charts tables |

### P1 High
| Bug | File | Fix |
|---|---|---|
| Chandrashtama detection uses brittle Tamil text heuristic | `daily_guidance_service.py:1082` | Replace with `day_data.is_chandrashtama` (field already exists) |
| Kala Sarpa label may leak into Rahu-Ketu Dosham output | `yogas.py` | Verify `KalasarpaResult` returned in separate `kalasarpa` field |
| 7th lord strength check incomplete (missing: not conjunct malefics, not combust, Navamsa strength, Jupiter aspect) | `yogas.py:_planet_is_strong()` | Extend to 4 additional conditions |
| DST ambiguous time: `replace(tzinfo=zone)` wrong for clocks-fall-back hours | `astro.py:77` | Use fold-aware ZoneInfo or pytz.localize |
| Rahu Kalam fixed-slot: ignores actual sunrise/sunset | `panchangam.py:496-504` | Compute as `(sunset-sunrise)/8` with day-of-week slot order |

### P2 Medium
| Bug | File | Fix |
|---|---|---|
| `navamsa_rasi_from_nakshatra_pada` crashes for all inputs except `("uthiradam", 3)` | `astro.py:150-173` | Remove stub or replace with real lookup |
| Chandrashtama defined two ways (rasi-based vs nakshatra-based) | `daily_guidance_service.py:575` vs `qa_service.py:294` | Standardize to rasi-based (daily_guidance is correct) |
| Duplicate `_score_label` function | `daily_guidance_service.py:1207` | Remove duplicate |
| `week_ahead` tithi number always 0 (uses score proxy, not real tithi) | `daily_guidance_service.py:1059` | Store actual tithi number per day |
| Shadbala breakdown not exposed to user | `chart_strength.py` | Add `strength_breakdown` field with sthana/dik/kala/chesta labels |
| Duplicate constants: RASI_NAMES, SIGN_LORDS, friendship table in 3+ files | Multiple | Consolidate into `calculations/constants.py` |
| Tamil `_ta` explanation fields in yogas.py copy English strings | `yogas.py:174` | Write real Tamil text |

### What is confirmed working — do NOT change
Swiss Ephemeris Lahiri sidereal, mean-node Rahu/Ketu, whole-sign houses, Julian Day conversion, Vimshottari Dasha all 5 levels, Panchangam tithi/nakshatra/yoga/karana by bisection, Hora, Ashtakavarga Bhinna, Navamsa degree-based, Vargottama, Combustion, Sandhi, Chandrashtama (rasi-based), Ezhara/Ashtama/Kantaka Sani, Vedha Vichara, functional nature table, all 36 current test cases.

---

## PART 4 — SPRINT WORK ORDER (from VINAADI_CODEX_AUDIT_2026.md)

### Sprint 1 — Fix crashes and data integrity (do first, nothing else)
```
[ ] Fix week-ahead 500: handle birth_time_local = None in get_week_ahead() line 1115
[ ] Fix dasha_story 500: same None crash at line 1307
[ ] Standardize Rasi names in astro.py (Viruchigam, Mithunam, Thulam)
[ ] Run DB migration SQL on chart_planets and charts tables
[ ] One-line fix: replace Chandrashtama text heuristic at line 1082 with day_data.is_chandrashtama
[ ] Verify Kala Sarpa is output in its own separate field, not merged into RAHU_KETU_DOSHAM
```

### Sprint 2 — Missing yogas ✅ DONE
```
[x] Pancha Mahapurusha (Ruchaka/Bhadra/Hamsa/Malavya/Sasa) — imports MOOLATRIKONA_ZONE from chart_strength.py
[x] Budha Aditya Yoga (Mercury + Sun, not combust; partial label when combust)
[x] Vipareetha Raja Yoga (6th/8th/12th lord in OTHER dusthana — NOT plain malefic in dusthana)
[x] Parivartana Yoga (mutual sign exchange; Maha vs Dainya sub-types; feeds detect_raja_yoga as connection type)
[x] Chandra Mangala Yoga (Moon + Mars same rasi OR mutual 7th aspect)
[x] Nakshatra cautions (Moola=19, Ayilyam=9, Kettai=18) — nakshatra_cautions list, non-catastrophic framing
```

### Sprint 3 — Deepen existing engine ✅ DONE
```
[x] Extend 7th lord strength: not conjunct malefics, not combust, strong in D9, Jupiter aspect
[x] Pass d9_rasi_map + d9_lagna_rasi into dosham detectors (d9_lagna from navamsa_rasi_from_degree(lagna_degree))
[x] Add 3 missing Neecha Bhanga rules: D9 strength, aspect from exaltation lord, retrograde
[x] saturn_cycle_alert banner field present in schema + populated in daily_guidance_service.py:923
[x] Write real Tamil text for _ta fields: Vipareetha Raja, Parivartana, Chandra Mangala yogas
[x] Parivartana wired into Raja Yoga as connection type in detect_yogas_and_doshams
[x] Add strength_breakdown to PlanetPosition: sthana/dik/kala/chesta as WEAK/NEUTRAL/STRONG
```

### Sprint 4 — UX and product features ✅ DONE (backend) / ✅ DONE (UI selectors)
```
[x] PRES-01: South Indian Rasi Chakra SVG — already implemented as RasiChart in dashboard-charts.tsx
[x] PRES-02: City geocoding — already wired via PlaceCombobox in dashboard-setup-tab.tsx
[x] PRES-07: Birth time source selector (Hospital/Family/Elder/Approximate/Unknown → confidence_minutes)
      Added to BirthFormState + UI select in dashboard-setup-tab.tsx + API body in dashboard-workspace.tsx
[x] PRES-08: assess_activity_timing() — already called in daily_guidance_service.py
[x] PRES-09: House-aware Dasha text — dasha_service.py now builds DashaInterpretation per lord:
      activated_houses, house_text_ta/en, natural_domain_ta/en
[x] PRES-10: Antardasha explanation — relationship_to_maha_ta/en added to DashaInterpretation
      (natural domain of maha lord + functional nature context)
[ ] PRES-03: Porutham (10-point marriage matching) — not yet built
[ ] PRES-04: Chart context prompt builder for Q&A — qa_service.py partially exists
[ ] PRES-05: Daily 7 AM push notification — FCM service exists, dispatch cron not yet wired
[ ] PRES-06: Jadhagam PDF export — not yet built
[ ] PRES-11: Life event prediction windows (next 5 years) — not yet built
[ ] PRES-12: Family vault joint muhurtha + composite Peyarchi — partial
```

---

## PART 5 — VALIDATION AFTER EACH SPRINT

```powershell
$env:JOTHIDAM_DATABASE_URL = "sqlite:///./pytest_local_test.db"
.\.venv\Scripts\python.exe -m pytest tests/ -v --tb=short
```

Manual scenario (from SEVVAIRAGU.MD):
```
Input:  Lagna=Mesham, Mars=Viruchigam(8th), Jupiter=Kadagam(4th), Moon=Magaram(10th), Gender=Female
Expected: SEVVAI_DOSHAM_WITH_NIVARTHI
Must detect: Mars own sign, Jupiter 5th aspect on Mars, Moon-11th no dosham
Must NOT output: "Severe Sevvai Dosham" or "No Sevvai Dosham"
```

Rasi name regression:
```python
from app.calculations.astro import RASI_NAMES, resolve_rasi
assert RASI_NAMES[8] == "Viruchigam"
assert resolve_rasi("Viruchigam") == 8
assert resolve_rasi("Mithunam") == 3
assert resolve_rasi("Thulam") == 7
```

Existing regression assertions (must never fail):
- May 20, 2025 = Tuesday (not Wednesday)
- Meenam = Rasi 12 (not 9)
- Saturn in Meenam from Dhanusu Moon = Ardhashtama Sani
- Uthiradam 3rd Paadham → Kumbam Navamsa
- Gandanta = 3°20' zones

---

## PART 6 — TEST PLAN (priority order)

### Critical — must exist before production
| ID | Test | Notes |
|---|---|---|
| T003 | Cross-verify against published Thirukanitham table | All 9 planets within 0.1° |
| T020 | Lagna changes within 2-hour window for same date/location | Validates birth-time sensitivity |
| T060 | Opening dasha lord independent verification for reference chart | Current assertion needs cross-check |
| T064 | Current dasha from today for reference chart (1991-07-22) | Verify against hand calculation |

### High
| ID | Test |
|---|---|
| T002 | Lagna for Chennai lat/lon 13.0827, 80.2707 |
| T014 | DST ambiguous hour (2025-11-02 01:30 America/New_York) — fold=0 UTC |
| T016 | Rahu Kalam: daylight-based vs fixed-slot (winter Chennai) |
| T018 | Chandrashtama rasi vs nakshatra consistency |
| T050/T051 | Pournami (tithi 15) and Amavasai (tithi 30) detection |
| T070–T072 | Functional benefic/malefic for all 12 Lagnas |
| T090–T092 | Sevvai dosham (after implementation) |
| T100–T103 | Yoga detection (after implementation) |
| T110–T111 | Life area prediction chain (after implementation) |
| T121 | No fear-based wording ("curse", "death", "disaster", "definitely") |

### Medium
| ID | Test |
|---|---|
| T012 | DST timezone conversion (2025-03-09 01:00 America/New_York) |
| T015 | DST spring-forward gap |
| T017 | Rahu Kalam day-of-week slot ordering (7 weekdays) |
| T019 | Chandrashtama rasi boundary edge case |
| T043 | All navamsam start rasi types (movable/fixed/dual) |
| T080–T083 | Combustion/Gandanta/Sandhi boundary tests |
| T130–T131 | Ashtakavarga BAV/SAV sum validation |

### Test execution order
1. Run existing: `pytest tests/ -v`
2. Add T003 cross-reference before any production deployment
3. Verify T060 dasha opening lord against published Thirukanitham table
4. Tests T090–T122 require new prediction modules first
5. For DST tests, use pytz or dateutil to confirm ZoneInfo transition handling

---

## PART 7 — QUICK FILE REFERENCE

| Fix ID | Primary file | Secondary |
|---|---|---|
| BUG-LIVE-01 | `app/services/daily_guidance_service.py:1115` | — |
| BUG-LIVE-01b | `app/services/daily_guidance_service.py:1307` | — |
| BUG-DATA-01 | `app/calculations/astro.py:14-24` | DB migration SQL |
| BUG-DATA-02 | `app/services/daily_guidance_service.py:1082` | — |
| BUG-ENGINE-01 | `app/calculations/yogas.py` | `app/schemas/charts.py` |
| BUG-ENGINE-03 | `app/calculations/yogas.py:_planet_is_strong()` | `app/calculations/transits.py` |
| MISSING-01 to 06 | `app/calculations/yogas.py` | Import from `chart_strength.py`, not redefine |
| PARTIAL-03 | `app/schemas/daily_guidance.py` | `app/services/daily_guidance_service.py`, `web/components/dashboard-hero.tsx` |
| PRES-01 | `web/components/rasi-chakra.tsx` (new) | `dashboard-personal-tab.tsx` |
| PRES-02 | `web/components/dashboard-setup-tab.tsx` | — |
| PRES-03 | `app/calculations/porutham.py` (new) | `app/api/family_vaults.py` |
| PRES-06 | `app/api/charts.py` (new endpoint) | `dashboard-jadhagam-report-panel.tsx` |
| PRES-11 | `app/services/event_windows_service.py` (new) | Compose existing dasha + peyarchi |
