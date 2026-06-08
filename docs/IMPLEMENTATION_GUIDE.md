# Vinaadi AI — Implementation Guide
**Consolidated from:** IMPLEMENTATION_INSTRUCTIONS.md · IMPLEMENTATION_ROADMAP.md · Jothidam_AI_MVP_Sprint_Execution_Plan_v1.md · CODEX_FIX_INSTRUCTIONS.md  
**Last updated:** 2026-05-26

---

## NON-NEGOTIABLE RULES (carry into every task)

| Area | Rule |
|---|---|
| Ayanamsa | Lahiri / Chitra Paksha sidereal only |
| Ephemeris | Swiss Ephemeris (Lahiri sidereal mode) |
| Rahu | Mean node — never true node |
| Ketu | Exactly 180° opposite Rahu — never computed separately |
| House system | Whole-sign South Indian primary |
| Gochar | Count from Chandra Rasi (primary), Lagna (secondary) |
| Sani cycles | Derive from Moon position |
| Dasha | Vimshottari 120-year cycle with correct Tamil period lengths |
| Vargottama | D1 rasi must equal D9 rasi — never infer |
| Gandanta | 3°20' zones — never 0.8° |
| Language | Supportive framing. Never "will happen." Use "traditionally associated with," "indicates tendency," "this period is interpreted as" |
| Sani framing | Refinement / discipline / restructuring — never doom |
| Health | Preventive nudges only — never diagnosis |
| Science claim | "Astronomically precise / tradition-grounded" — never "scientifically proven astrology" |
| Time storage | Always UTC; display in user's IANA timezone |
| House counting | `((target_rasi - reference_rasi) % 12) + 1` |

**Regression tests that must never fail:**
- May 20, 2025 = Tuesday (not Wednesday)
- Meenam = Rasi 12 (not 9)
- Saturn in Meenam from Dhanusu Moon = Ardhashtama Sani (not Janma Sani)
- Uthiradam 3rd Paadham → Kumbam Navamsa (not Magaram)
- Gandanta = 3°20' zones (not 0.8°)

---

## IMPLEMENTATION STATUS (as of 2026-05-26)

| Section | Status |
|---|---|
| Missing ORM models (A1–A7) | ✅ All done |
| Supabase auth removal → local JWT | ✅ Done |
| Data integrity (cascade delete, dasha level, schema) | ✅ Done |
| Calculation correctness (score ceiling, weight table, encoding) | ✅ Done |
| Security hardening (CSP, encryption, JWT, test isolation) | ✅ Done |
| Performance (snapshot cache, migration) | ✅ Done |
| Peyarchi & notifications (finder, alerts, SMTP dispatch, tests) | ✅ Done |
| OpenAPI YAML sync (14 missing endpoints, timings, preview, qa) | ✅ Done |
| Frontend surface gaps (types, emotional weather, ambient alerts) | ✅ Done |

**Test suite: 233 tests passing as of 2026-05-26.**

New agents: treat above as fully-implemented baseline. Check git log before starting new work.

---

## STACK CONTEXT

- **Database:** Local Docker Postgres 16 — container `slw-postgres`, port `5432`, db `vinaadi_dev`, user `slw_admin`, password `slw_dev_password`
- **DB Admin:** Adminer on `localhost:8081`
- **Backend:** FastAPI + SQLAlchemy + Alembic — `dev.ps1` auto-migrates on start
- **Frontend:** Next.js 14 in `web/` — proxies `/api/backend/*` to `http://127.0.0.1:8000`
- **Auth:** Local bcrypt + HS256 JWT in httpOnly cookie (`vinaadi_token`)
- **Shell:** PowerShell on Windows. Repo root: `C:\Users\senth\OneDrive\문서\GitHub\sanstro`

---

## MVP 1 SCOPE

### Included in MVP 1
1. User registration and birth profile creation
2. Birth location, lat/lon, timezone, UTC conversion
3. D1 Rasi chart in South Indian whole-sign format
4. D9 Navamsa (108-pada logic)
5. Moon Rasi, Nakshatra, Pada, Janma Nakshatra, Dasha balance
6. Tamil Panchangam: Tithi, Vara, Nakshatra, Yoga, Karana
7. Rahu Kalam, Yamagandam, Kuligai, Abhijit, Hora
8. Vimshottari Maha/Antar/Pratyantar Dasha timeline
9. Current Gochar from Moon and Lagna
10. Sani-cycle detection (Ezharai, Janma, Ardhashtama, Ashtama, Kantaka, Kandaka)
11. Guru/Sani/Rahu-Ketu Peyarchi basic personalized interpretation
12. Daily 0–100 guidance score
13. Family vault (up to 6 members)
14. Family Aggregate Fortune (family day score, support need index, decision readiness, family calendar)
15. Tamil + English interpretation output
16. Internal QA dashboard with expected-vs-actual validation

### Deferred beyond MVP 1
Full Porutham engine, full Muhurtham finder, full Shadbala, full Ashtakavarga production scoring, health tendency monitor beyond soft nudges, expert marketplace, native mobile app (launch as responsive web/PWA first), advanced PDF reports.

---

## PHASE 1 — Critical Calculation Corrections (fix before any new features)

### 1.1 Vargottama Strength Bonus
- **File:** `app/calculations/chart_strength.py:165`
- **Change:** Replace `0 * 0.10` with `10 * 0.10 if is_vargottama else 0`
- **Why:** Vargottama planet currently gets zero benefit — one of strongest classical indicators

### 1.2 Remove/Replace Broken Navamsam Stub
- **File:** `app/calculations/astro.py:150-173`
- **Change:** Remove `navamsa_rasi_from_nakshatra_pada` or replace with real per-nakshatra lookup
- **Why:** Crashes for any input except `("uthiradam", 3)`

### 1.3 Current Age Calculation
- **File:** `app/services/chart_service.py`
- **Change:** Add `current_age = today.year - birth_date.year` (adjust for birthday) to `ChartSummaryData`

### 1.4 Fix DST Ambiguous Time Conversion
- **File:** `app/calculations/astro.py:77`
- **Change:** Replace `naive_dt.replace(tzinfo=zone)` with fold-aware ZoneInfo conversion
- **Why:** Silently produces wrong UTC for clocks-fall-back hours

### 1.5 Fix Rahu Kalam Slot Calculation
- **File:** `app/calculations/panchangam.py:496-504`
- **Change:** Compute as `(sunset - sunrise) / 8` with day-of-week slot order (Sun=5, Mon=7, Tue=3, Wed=6, Thu=6, Fri=4, Sat=2)
- **Why:** Fixed 6 AM + 90-min diverges up to 90 min in winter / non-equatorial locations

### 1.6 Unify Chandrashtama Definition
- **File:** `app/services/qa_service.py:294-300`
- **Change:** Standardize to rasi-based (daily_guidance_service.py:575-579 is correct); update qa_service to match

### 1.7 Consolidate Duplicate Constants
- **New file:** `app/calculations/constants.py`
- **Move:** `RASI_NAMES`, `SIGN_LORDS`, `_NATURAL_FRIENDS`, `_NATURAL_ENEMIES` from 3+ files into one

### 1.8 Fix Duplicate `_score_label`
- **File:** `app/services/daily_guidance_service.py:1207`
- **Change:** Remove the duplicate (first definition at line 172 is canonical)

### 1.9 Fix Week-Ahead Tithi Proxy Bug
- **File:** `app/services/daily_guidance_service.py:1059`
- **Change:** Store actual tithi number per day (not panchangam score component)

---

## PHASE 2 — Critical Yoga/Dhosham Engine

All new yoga/dosham code goes in `app/calculations/yogas.py`. Import constants from existing files — do NOT redefine:
```python
from app.calculations.chart_strength import MOOLATRIKONA_ZONE, OWN_SIGN_RASI, EXALTATION_RASI
```

### 2.1 Sevvai Dosham (already implemented — verify)
Mars from Lagna/Moon/Venus, house-sign Nivarthi, Guru aspect, own/exalt, gender weighting, 5 labels.
Test case: `Lagna=Mesham, Mars=Viruchigam(8th), Jupiter=Kadagam(4th), Moon=Magaram(10th), Gender=Female` → `SEVVAI_DOSHAM_WITH_NIVARTHI`

### 2.2 Yogas (implemented — verify against `app/calculations/yogas.py`)
- Pancha Mahapurusha (Ruchaka/Bhadra/Hamsa/Malavya/Sasa)
- Budha Aditya (Mercury + Sun, not combust)
- Vipareetha Raja (6th/8th/12th lord in OTHER dusthana — NOT plain malefic in dusthana)
- Parivartana (mutual sign exchange — Maha vs Dainya; feed into Raja Yoga connection check)
- Chandra Mangala (Moon + Mars same rasi OR mutual 7th aspect)
- Nakshatra cautions (Moola=19, Ayilyam=9, Kettai=18) — non-catastrophic framing, with remedies

---

## PHASE 3 — Life Area Prediction Engine

Current state: `life_areas_service.py` has transit/dasha table scoring for 7 areas. What's missing is natal house-lord-karaka chain analysis that answers "what is your potential?" and "when will X happen?"

### 3.1 Marriage Analysis
**New file:** `app/services/marriage_service.py`
Checks: 7th house strength, 7th lord placement/strength, Venus analysis, Navamsa Venus/7th lord, Sevvai dosham, Dasha activation (Venus/7th lord/Jupiter), Jupiter/Saturn transit confirmation.

### 3.2 Career Analysis
**New file:** `app/services/career_service.py`
Checks: 10th house, 10th lord, 6th house (service), 2nd/11th income, Sun/Saturn/Mercury karaka, Dasamsam (D10 — not yet built), Dasha activation.

### 3.3 Wealth Analysis
**New file:** `app/services/wealth_service.py`
Checks: 2nd house, 11th house, Dhana yogas, 5th/9th Poorva Punya, Dasha activation.

### 3.4 Health Analysis
**New file:** `app/services/health_service.py`
Checks: Lagna and Lagna lord strength, 6th (disease), 8th (chronic), 12th (hospitalization), Saturn/Mars/Rahu affliction, Dasha risk periods.

### 3.5 Age-Wise Priority Filtering
Use current age to focus predictions:
- 0–12: health, parents, education
- 13–24: education, Mercury, Jupiter
- 25–35: career, marriage, wealth
- 36–50: status, property, children
- 50+: health, peace, spirituality

---

## PHASE 4 — Dasha–Event Connection

### 4.1 Dasha–House Mapping
**New file:** `app/calculations/dasha_house_mapping.py` (already exists — verify it's actually called from guidance service)
Map each Dasha lord to activated houses per Lagna.

### 4.2 Event Windows
**New file:** `app/services/event_windows_service.py`
Scan next 5 years of Dasha transitions + Jupiter/Saturn Peyarchi. Output ranked windows per area: marriage, career, property, child, travel. Compose existing dasha + peyarchi services — no new calculations needed.

### 4.3 Jupiter/Saturn Aspects in Transit
**File:** `app/calculations/transits.py`
Add Jupiter 5th and 9th aspects; Saturn 3rd and 10th aspects; transit-over-natal-planet detection.

---

## PHASE 5 — Navamsam Integration

- Compute D9 Lagna (`app/calculations/ephemeris.py`)
- Use vargottama bonus in strength formula: `+10` (not `0`)
- Pass `d9_rasi_map` + `d9_lagna_rasi` into dosham detectors for 7th lord Navamsa check
- Use D9 Venus/7th lord in marriage analysis

---

## PHASE 6 — Final Report Presentation

- Add birth profile summary to chart response: ayanamsa, calculation version, current age
- Add planetary strength narrative (strong/weak and why) via `narrative_engine.py`
- Add yoga/dosham summary section
- Add life area prediction section (after yogas built)
- Show functional nature per planet in chart summary
- Expose BAV bindus per rasi in chart response

---

## UX FEATURES (PRES items from audit)

| ID | Feature | Where |
|---|---|---|
| PRES-01 | South Indian Rasi Chakra SVG diagram | `web/components/rasi-chakra.tsx` (new) — data is ready from API |
| PRES-02 | City geocoding on birth profile form (OpenStreetMap Nominatim) | `dashboard-setup-tab.tsx` |
| PRES-03 | Porutham (10-point marriage matching) between family vault members | `app/calculations/porutham.py` (new) |
| PRES-04 | Chart context prompt builder for Q&A (feed all planet/dosham/dasha data) | `app/services/qa_service.py` |
| PRES-05 | Daily 7 AM push notification (FCM service already exists) | `notification_dispatch_service.py` |
| PRES-06 | Jadhagam PDF export endpoint | `app/api/charts.py` (new endpoint) |
| PRES-07 | Birth time source selector (Hospital/Family/Elder/Unknown → confidence_minutes) | `dashboard-setup-tab.tsx` |
| PRES-08 | Activity-specific daily guidance text using `assess_activity_timing()` | `daily_guidance_service.py:_build_text()` |
| PRES-09 | House-aware Dasha interpretation using `dasha_house_mapping.py` + `employment_type` | `dasha_service.py` |
| PRES-10 | Antardasha explanation (natural domain, relationship to Maha lord, natal house) | `dasha_service.py` — reuse `_graha_relationship_score()` |
| PRES-11 | Life event prediction windows (next 5 years) | `event_windows_service.py` (new) |
| PRES-12 | Family vault: joint muhurtha + composite Peyarchi + side-by-side charts | `family_vault_service.py` |

---

## PRESENTATION GOALS

Current system produces: chart data, daily score, dasha timeline, panchangam.

A Tamil astrology user expects:
> "உங்கள் தற்போதைய குரு தசை 9ஆம் இட அதிபதியை செயல்படுத்துகிறது. குரு 5ஆம் இடத்திற்கு பயணிக்கிறார், உங்கள் 9ஆம் இடத்தில் குரு பார்வை — கல்வி மற்றும் தொழில் வளர்ச்சிக்கு சிறந்த காலம். ஆனால் சனியின் 3ஆம் பார்வை 11ஆம் இடத்தில் வருமான தாமதத்தை ஏற்படுத்தலாம். அபிஜித் முகூர்த்தத்தில் செயல்படுங்கள்."

Gap between current output and expected output is the core product risk.

---

## RUNNING THE STACK

```powershell
# Start full stack
cd 'C:\Users\senth\OneDrive\문서\GitHub\sanstro'
.\dev.ps1

# Run tests
$env:JOTHIDAM_DATABASE_URL = "sqlite:///./pytest_local_test.db"
.\.venv\Scripts\python.exe -m pytest tests/ -v --tb=short

# Run specific test file
.\.venv\Scripts\python.exe -m pytest tests/test_calculations.py -v

# Database migration
.\.venv\Scripts\python.exe -m alembic upgrade head

# After DB changes: regenerate migration
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "description"
```
