# Vinaadi AI — Thirukanitham 98% Compliance Plan

**Goal:** Raise every phase score from current ~68% average to ≥98% against the
`thirukanitham-methodology.md` specification.

**How to use this document:**
Supply this file verbatim to any coding agent. Each work item includes the exact
file to create or edit, the exact existing symbols to extend, and precise
acceptance criteria. Work items are ordered by dependency — complete them top to
bottom. Never skip an item; each is a prerequisite for the ones that follow it.

## Execution status (2026-06-02)

- W07 completed
- W08 completed
- W09 completed
- W10 completed
- W11 completed
- W12 completed
- W13 completed
- W14 completed
- W15 completed
- W16 completed
- W17 completed
- W18 completed

---

## Repository root (never guess or alter)

```
C:\Users\senth\OneDrive\문서\GitHub\sanstro
```

Shell: **PowerShell**. Chain commands with `;` not `&&`.
Always set `$env:PYTHONIOENCODING = "utf-8"` before running Python.
Test DB: `postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test`

---

## Phase scores being targeted

| Phase | Current | Target |
|---|---|---|
| P1 Foundation (birth data, Bhava Chalit, divisional charts, validation) | 60% | 98% |
| P2 Chart analysis (Shadbala, yogam, dosham, aspects) | 75% | 98% |
| P3 Reading approach (age-based, question-based, dasha focus) | 80% | 98% |
| P4 0–100 prediction framework (all 6 layers wired) | 65% | 98% |
| P5 Life area predictions (all 26 areas) | 65% | 98% |
| P6 Timing (Varshaphala, maturation ages, double transit) | 55% | 98% |
| P7 Remedies (formal catalog, gemstone rules, mantra, daanam) | 25% | 98% |
| P8 Communication (framing, action steps, duration) | 90% | 98% |

---

## WORK ITEM INDEX

| ID | Title | Phase | Priority |
|---|---|---|---|
| W01 | Bhava Chalit chart | P1 | Critical |
| W02 | Divisional charts D2–D60 | P1, P4 | Critical |
| W03 | Past-event validation gate | P1 | High |
| W04 | Chesta Bala + Yuddha Bala (planetary war) | P2 | High |
| W05 | Classical Baladi Avastha | P2 | Medium |
| W06 | Nakshatra dispositor chain + Pushkara Bhaga | P2 | High |
| W07 | Expand yoga library (20+ missing yogas) | P2 | High |
| W08 | Missing doshams: Kalathra, Putra, Badhaka | P2 | High |
| W09 | Wire Ashtakavarga bindus into scoring | P4 | High |
| W10 | Divisional chart confirmation layer (L4) | P4 | Critical |
| W11 | Double transit scoring | P4, P6 | High |
| W12 | Planetary maturation ages | P4, P6 | High |
| W13 | Life areas: Education, Children, Property, Foreign, Litigation, Spirituality | P5 | High |
| W14 | Varshaphala / Tajaka full integration | P6 | High |
| W15 | Formal remedy catalog engine | P7 | High |
| W16 | Gemstone prescription rules | P7 | High |
| W17 | Communication framing: duration + action pairing | P8 | Medium |
| W18 | Scoring framework formal unification (0–100 six-layer) | P4 | Critical |

---

## WORK ITEM DETAIL

---

### W01 — Bhava Chalit Chart

**Phase:** P1  
**Acceptance:** `compute_bhava_chalit(lagna_longitude, planets)` returns a dict
mapping each planet to its Bhava Chalit house (1–12), distinct from Rasi house
when a planet sits within 15° of a house cusp. `ChartCalculateResponse` includes
`bhava_chalit` field. All dosham and yogam functions accept an optional
`bhava_chalit_map` parameter and use it for house-level judgements.

**File to create:** `app/calculations/bhava_chalit.py`

```python
# Public API
def compute_bhava_chalit(
    lagna_longitude: float,          # absolute degrees 0–360 (sidereal)
    planet_longitudes: dict[str, float],  # {"SUN": 123.4, ...}
) -> dict[str, int]:
    """
    Returns {planet: bhava_number_1_to_12}.

    Method (Equal House from Lagna cusp):
    1. The Lagna cusp = lagna_longitude.
    2. Each Bhava cusp = (lagna_longitude + (house-1)*30) % 360.
    3. A planet belongs to Bhava N if its longitude falls in
       [cusp_N, cusp_N+1).
    4. Planets within ±1° of a cusp get a note in warnings list
       (sandhi — mixed influence).
    """
```

**Files to edit:**

1. `app/services/chart_service.py`
   - In `_chart_response_from_profile()`, after computing `planet_positions`,
     call `compute_bhava_chalit(lagna_longitude, {p.graha: p.absolute_longitude
     for p in planet_positions})` and attach result to response.
   - Add field `bhava_chalit: dict[str, int]` to `ChartCalculateResponseData`
     (in the relevant schema file).

2. `app/calculations/yogas.py`
   - Add `bhava_chalit_map: dict[str, int] | None = None` parameter to
     `detect_yogas_and_doshams()` and all sub-functions that use
     `house_from_lagna`.
   - When `bhava_chalit_map` is provided and the planet's bhava differs from
     rasi house, use bhava for house-level tests, rasi for aspect/yogam tests.

3. `app/models/chart_planet.py`
   - Add column: `bhava_house: Mapped[int | None]` (nullable for backward compat).

4. Write a migration: `alembic revision --autogenerate -m "add bhava_house to chart_planets"`.

**Tests:** `tests/test_bhava_chalit.py`
- Planet at 29° Aries (lagna at 0° Aries) → bhava house 1 in rasi, bhava 2 in Bhava Chalit.
- Planet at 1° Taurus (lagna at 0° Aries) → bhava house 2 in both systems.
- Planet at 14° Taurus (lagna at 0° Aries, cusp 2 = 30°) → bhava house 2.

---

### W02 — Divisional Charts D2–D60

**Phase:** P1, P4  
**Acceptance:** Functions exist for D2, D3, D4, D7, D10, D12, D16, D20, D24,
D30, D40, D60. Each returns `dict[str, int]` mapping planet → rasi in that varga.
D10 is used by career scoring. D7 is used by children scoring. D2 is used by
wealth scoring. D9 already exists — do not rewrite it.

**File to create:** `app/calculations/divisional_charts.py`

```python
"""
Divisional chart (varga) calculations.

All functions accept:
    planet_longitudes: dict[str, float]  — absolute sidereal degrees 0–360
    include_lagna: bool = True           — if True, add "LAGNA" key

All functions return:
    dict[str, int]  — {planet_name: rasi_number_1_to_12}

Formulae (standard Parashari):
  D2  (Hora):     odd signs: Sun's hora (Leo=5) for 0–15°, Moon's hora (Cancer=4) for 15–30°
                  even signs: reverse
  D3  (Drekkana): 0–10° → same sign, 10–20° → 5th sign, 20–30° → 9th sign
  D4  (Chaturthamsa): each 7°30' maps to +0,+3,+6,+9 signs from current sign
  D7  (Saptamsa): odd sign: deg/4.2857 gives 0–6, add to sign; even: add to 7th sign
  D9  (Navamsa):  already implemented in app/calculations/astro.py — import, do not duplicate
  D10 (Dasamsha): odd sign: 3° increments from same sign; even sign: from 9th sign
  D12 (Dwadashamsa): 2°30' increments, 12 divisions from same sign
  D16 (Shodashamsa): 1°52'30" increments from Aries for movable, Leo for fixed, Sag for dual
  D20 (Vimshamsa): 1°30' increments from Aries/Sag/Leo by sign type
  D24 (Chaturvimshamsa): 1°15' increments from Leo/Cancer alternating by sign parity
  D30 (Trimsamsa): unequal divisions per sign (5°,5°,8°,7°,5° of Mars/Saturn/Jupiter/Mercury/Venus)
  D40 (Khavedamsa): 0°45' increments from Aries for odd, Libra for even signs
  D60 (Shashtiamsa): 0°30' increments, 60 divisions cycling Aries through all signs

Each function must be pure (no side effects), deterministic, and handle
Rahu/Ketu (use their absolute longitudes directly).
"""

def compute_d2(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d3(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d4(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d7(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d10(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d12(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d16(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d20(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d24(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d30(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d40(planet_longitudes: dict[str, float]) -> dict[str, int]: ...
def compute_d60(planet_longitudes: dict[str, float]) -> dict[str, int]: ...

def get_varga(
    division: int,
    planet_longitudes: dict[str, float],
) -> dict[str, int]:
    """Dispatch function: get_varga(10, planets) → D10 map."""
```

**Files to edit:**

1. `app/services/chart_service.py`
   - In `_chart_response_from_profile()`, compute and attach
     `vargas: dict[str, dict[str, int]]` = `{"D2": ..., "D3": ..., "D4": ...,
     "D7": ..., "D10": ..., "D12": ..., "D16": ..., "D20": ..., "D24": ...,
     "D30": ..., "D40": ..., "D60": ...}` to `ChartCalculateResponseData`.

2. Add `vargas: dict[str, dict[str, int]] = {}` field to
   `ChartCalculateResponseData` in the schemas file.

**Tests:** `tests/test_divisional_charts.py`
- For a known longitude (e.g. Sun at 45.0° = 15° Taurus):
  - D2: even sign, 15° → Moon's hora → Cancer (4). Assert == 4.
  - D9: verify matches existing `navamsa_rasi_from_degree(45.0)`.
  - D10: odd/even rule verify against known ephemeris example.
- Verify D9 output matches existing implementation for 5 sample longitudes.

---

### W03 — Past-Event Validation Gate

**Phase:** P1  
**Acceptance:** `app/services/rectification_service.py` gains a function
`validate_chart_against_events(chart_response, events) -> ValidationReport`.
`ValidationReport` contains `passed: bool`, `match_count: int`,
`total_checked: int`, `confidence: str` ("HIGH"/"MEDIUM"/"LOW"/"UNVALIDATED"),
`unmatched_events: list[str]`. When `match_count / total_checked < 0.5`,
`passed = False`. Life area predictions endpoint checks this and includes a
`chart_validation_status` field in the response.

**File to edit:** `app/services/rectification_service.py`

Add after existing `apply_rectified_time()`:

```python
@dataclass
class ValidationReport:
    passed: bool
    match_count: int
    total_checked: int
    confidence: str        # "HIGH" | "MEDIUM" | "LOW" | "UNVALIDATED"
    unmatched_events: list[str]
    note_ta: str
    note_en: str

def validate_chart_against_events(
    chart_response: "ChartCalculateResponse",
    events: list[dict],    # [{"type": "MARRIAGE", "year": 2018, "month": 5}]
) -> ValidationReport:
    """
    For each event, check if the dasha running at event date connects to
    the event's key houses (_EVENT_KEY_HOUSES). A match = at least one of
    (maha_lord, antar_lord) owns or is placed in a key house.
    confidence = HIGH if ≥75% match, MEDIUM if ≥50%, LOW if ≥25%, else UNVALIDATED.
    """
```

**File to edit:** `app/api/charts.py`
- Add `chart_validation_status` field to chart summary response if events exist
  in the birth profile's life event log.

---

### W04 — Chesta Bala + Yuddha Bala (Planetary War)

**Phase:** P2  
**Acceptance:** `compute_natal_planet_score()` in `chart_strength.py` correctly
applies Chesta Bala and Yuddha Bala. Two planets within 1° of each other trigger
war; the planet with lower longitude degree-within-sign loses (strength −15).
Retrograde non-luminaries get Chesta Bala bonus (currently stub, make proper).

**File to edit:** `app/calculations/chart_strength.py`

**Current state of `_chesta_bala_score()`:**
```python
def _chesta_bala_score(planet: str, is_retrograde: bool, speed_ratio: float | None) -> float:
    # currently a stub returning fixed values
```

**Replace with proper implementation:**

```python
def _chesta_bala_score(
    planet: str,
    is_retrograde: bool,
    speed_ratio: float | None,   # actual_speed / mean_speed, None for Rahu/Ketu
) -> float:
    """
    Classical Chesta Bala rules:
    - Sun, Moon: no Chesta Bala (return 0.5 neutral).
    - Rahu, Ketu: always retrograde by definition, return 0.6.
    - Retrograde planet: 1.0 (maximum — moving toward exaltation mentally).
    - Direct planet near mean speed (0.8–1.2× mean): 0.6.
    - Direct planet slow (<0.5× mean): 0.4 (winding down).
    - Direct planet fast (>1.5× mean): 0.5.
    """
```

**Add new function:**

```python
def detect_planetary_wars(
    planet_longitudes: dict[str, float],
) -> dict[str, str]:
    """
    Returns {loser_planet: winner_planet} for each war pair.
    War = two non-luminary planets within 1° of absolute longitude.
    Loser = planet with lower longitude (degree-within-sign comparison).
    Luminaries (SUN, MOON) and nodes (RAHU, KETU) do not participate in war.
    """
```

**Edit `compute_natal_planet_score()`:**
- Accept `planetary_wars: dict[str, str] | None = None` parameter.
- If planet is a war loser, apply `score -= 15` after all other calculations.
- Call `detect_planetary_wars()` in `chart_service.py` once per chart and pass
  result to each planet's `compute_natal_planet_score()` call.

**Tests:** `tests/test_chart_strength.py`
- Two planets at 45.0° and 45.5°: lower one is war loser, score penalty −15 applied.
- Retrograde Mars: Chesta Bala returns 1.0.
- Sun at any position: Chesta Bala returns 0.5 neutral.

---

### W05 — Classical Baladi Avastha

**Phase:** P2  
**Acceptance:** `compute_natal_planet_score()` optionally applies Baladi Avastha
multiplier based on planet's degree-within-sign and sign parity.

**File to edit:** `app/calculations/chart_strength.py`

Replace `_avastha_multiplier()` with:

```python
_AVASTHA_DEGREES = [6, 12, 18, 24, 30]  # Bala, Kumara, Yuva, Vriddha, Mrita zones
_AVASTHA_MULTIPLIER_ODD  = [0.50, 0.75, 1.00, 0.65, 0.25]  # Bala→Mrita odd signs
_AVASTHA_MULTIPLIER_EVEN = [0.25, 0.65, 1.00, 0.75, 0.50]  # reversed for even signs

def _avastha_multiplier(natal_longitude: float, rasi: int) -> float:
    """
    Classical Baladi Avastha:
    Odd signs (1,3,5,7,9,11): Bala(0–6°)=immature, Yuva(12–18°)=peak, Mrita(24–30°)=dead.
    Even signs (2,4,6,8,10,12): order is reversed (Mrita→Yuva→Bala).
    """
    deg = natal_longitude % 30.0
    zone = min(int(deg / 6), 4)
    is_odd = (rasi % 2 == 1)
    return _AVASTHA_MULTIPLIER_ODD[zone] if is_odd else _AVASTHA_MULTIPLIER_EVEN[zone]
```

Update all callers of `_avastha_multiplier()` to pass `rasi` as second argument.

---

### W06 — Nakshatra Dispositor Chain + Pushkara Bhaga

**Phase:** P2  
**Acceptance:** `app/calculations/nakshatra_analysis.py` (new file) exposes
`build_dispositor_chain()` and `pushkara_check()`. Results surface in
`ChartCalculateResponse` as `nakshatra_analysis` field.

**File to create:** `app/calculations/nakshatra_analysis.py`

```python
"""
Nakshatra-level analysis: dispositor chains and Pushkara.

Nakshatra lord order (Vimshottari): Ketu, Venus, Sun, Moon, Mars, Rahu,
Jupiter, Saturn, Mercury (repeating across 27 nakshatras).
"""

# NAK_LORD[1..27] already in dasha.py as NAK_LORD — import from there.
from app.calculations.dasha import NAK_LORD
from app.calculations.astro import SIGN_LORD  # rasi → planet

def build_dispositor_chain(
    planet_longitudes: dict[str, float],
    max_depth: int = 4,
) -> dict[str, list[str]]:
    """
    For each planet, trace: planet → nakshatra_lord → nakshatra_lord's
    nakshatra_lord → ... up to max_depth steps.
    Returns {"SUN": ["SUN", "MARS", "KETU", "MERCURY"], ...}
    """

def pushkara_check(planet_longitudes: dict[str, float]) -> dict[str, bool]:
    """
    Pushkara Navamsa: specific navamsa positions that are auspicious.
    Pushkara Bhaga: specific degree within a sign.

    Pushkara Navamsa positions (sign, navamsa_number pairs — classical list):
    (Aries 1), (Taurus 3), (Gemini 5), (Cancer 7), (Leo 9), (Virgo 2),
    (Libra 4), (Scorpio 6), (Sagittarius 8), (Capricorn 1), (Aquarius 3),
    (Pisces 5) — navamsa 1-9 within each sign.

    Pushkara Bhaga (exact auspicious degrees — classical 24 degrees):
    Aries 21°, Taurus 14°, Gemini 7°, Cancer 22°, Leo 18°, Virgo 7°,
    Libra 21°, Scorpio 28°, Sagittarius 21°, Capricorn 14°, Aquarius 7°, Pisces 22°.
    Within ±0.5° of Pushkara Bhaga = pushkara_bhaga_exact = True.

    Returns {"SUN": True/False, ...} — True if planet in Pushkara Navamsa.
    Also returns "SUN_bhaga": True/False for Pushkara Bhaga.
    """

def gandanta_detail(planet_longitudes: dict[str, float]) -> dict[str, dict]:
    """
    Returns per-planet: {is_gandanta: bool, zone: str|None, intensity: str|None}
    Zones: KATAKA_SIMHA, VRISCHIKA_DHANUS, MEENA_MESHA
    Intensity: DEEP (within 0°40') | MODERATE (within 3°20') | MILD (within 5°)
    """
```

**File to edit:** `app/services/chart_service.py`
- After building planet_positions, call `build_dispositor_chain()` and
  `pushkara_check()` and attach to response.

---

### W07 — Expand Yoga Library

**Phase:** P2  
**Acceptance:** `detect_yogas_and_doshams()` detects all yogas listed below.
Each uses the existing `YogaResult` dataclass. Strength is `STRONG`/`PARTIAL`/`WEAK`.
Tamil and English descriptions must be non-empty strings.

**File to edit:** `app/calculations/yogas.py`

Add the following detection functions (implement each fully):

```python
def detect_sakata_yoga(
    moon_rasi: int, jupiter_rasi: int, lagna_rasi: int
) -> YogaResult:
    """Moon in 6th, 8th, or 12th from Jupiter = Sakata Yoga (fluctuating fortune).
    Cancelled if Moon is in kendra from lagna."""

def detect_kemadruma_yoga(
    planets: dict[str, int],  # planet → rasi
    moon_rasi: int,
) -> YogaResult:
    """No planet in 2nd or 12th from Moon (excluding Sun, Rahu, Ketu).
    Cancelled if Moon is in kendra from lagna, or Moon conjoins a planet."""

def detect_chandala_yoga(
    jupiter_rasi: int, rahu_rasi: int
) -> YogaResult:
    """Jupiter conjunct Rahu (same rasi). Distorts wisdom and ethics."""

def detect_amala_yoga(
    planets: dict[str, int], lagna_rasi: int, moon_rasi: int,
    lagna_nature_map: dict[str, str],  # FunctionalNature per planet
) -> YogaResult:
    """Natural benefic (Jupiter, Venus, Mercury unafflicted) in 10th from lagna
    OR 10th from Moon = clean reputation."""

def detect_adhi_yoga(
    planets: dict[str, int], moon_rasi: int,
    lagna_nature_map: dict[str, str],
) -> YogaResult:
    """Natural benefics in 6th, 7th, and 8th from Moon. All three needed for
    STRONG; two for PARTIAL; one for WEAK."""

def detect_daridra_yoga(
    planets: dict[str, int], lagna_rasi: int,
    lagna_nature_map: dict[str, str],
) -> YogaResult:
    """11th lord in dusthana (6, 8, 12), OR 11th lord weak and conjunct malefic."""

def detect_lakshmi_yoga(
    planets: dict[str, int], lagna_rasi: int,
    lagna_nature_map: dict[str, str],
    planet_scores: dict[str, int],
) -> YogaResult:
    """9th lord strong in kendra or trikona AND lagna lord strong."""

def detect_sunaphа_anaphа_durudhura(
    planets: dict[str, int], moon_rasi: int,
) -> list[YogaResult]:
    """
    Sunаpha: planet(s) in 2nd from Moon (not Sun) → eloquence, wealth.
    Anаpha: planet(s) in 12th from Moon (not Sun) → physical grace, generosity.
    Durudhurа: planets in both 2nd and 12th from Moon → powerful personality.
    Returns list of 0–3 YogaResult.
    """

def detect_vasumati_yoga(
    planets: dict[str, int], moon_rasi: int,
    lagna_nature_map: dict[str, str],
) -> YogaResult:
    """Natural benefics in upachaya houses (3, 6, 10, 11) from Moon."""
```

Update `detect_yogas_and_doshams()` to call all new functions and include
results in the returned yoga list.

---

### W08 — Missing Doshams: Kalathra, Putra/Sarpa, Badhaka

**Phase:** P2  
**Acceptance:** Three new `DoshamResult`-returning functions exist, all wired
into `detect_yogas_and_doshams()`.

**File to edit:** `app/calculations/yogas.py`

```python
def detect_kalathra_dosham(
    planets: dict[str, int],         # planet → rasi
    lagna_rasi: int,
    moon_rasi: int,
    is_male: bool,
    lagna_nature_map: dict[str, str],
    planet_scores: dict[str, int],
) -> DoshamResult:
    """
    General affliction to 7th house, 7th lord, Venus (male) or Jupiter (female)
    by Saturn, Rahu, Ketu, or Mars without benefic protection.
    Cancellation: Jupiter strong in kendra, strong 7th lord, Venus/Jupiter in own sign.
    Labels: NO_DOSHAM | ACTIVE_DOSHAM | STRONG_ACTIVE_DOSHAM | DOSHAM_WITH_NIVARTHI
    """

def detect_putra_sarpa_dosham(
    planets: dict[str, int],
    lagna_rasi: int,
    planet_scores: dict[str, int],
) -> DoshamResult:
    """
    5th house or 5th lord afflicted by Rahu/Ketu/Saturn.
    Also: Jupiter (putra karaka) afflicted by nodes without benefic support.
    Cancellation: Jupiter in kendra, strong 5th lord, benefic aspect on 5th house.
    Labels: NO_DOSHAM | ACTIVE_DOSHAM | STRONG_ACTIVE_DOSHAM | DOSHAM_WITH_NIVARTHI
    """

def detect_badhaka_dosham(
    planets: dict[str, int],
    lagna_rasi: int,
    planet_scores: dict[str, int],
    current_maha_lord: str,
) -> DoshamResult:
    """
    Badhaka lord per lagna type:
      Movable lagnas (1,4,7,10): 11th lord is Badhaka.
      Fixed lagnas (2,5,8,11): 9th lord is Badhaka.
      Dual lagnas (3,6,9,12): 7th lord is Badhaka.
    Dosham is active when Badhaka lord is in lagna, conjuncts Moon or lagna lord,
    OR when current Maha Dasha lord is the Badhaka lord.
    Labels: NO_DOSHAM | ACTIVE_DOSHAM | STRONG_ACTIVE_DOSHAM | DOSHAM_WITH_NIVARTHI
    """

_MOVABLE_LAGNAS = {1, 4, 7, 10}
_FIXED_LAGNAS   = {2, 5, 8, 11}
_DUAL_LAGNAS    = {3, 6, 9, 12}

def get_badhaka_lord(lagna_rasi: int, planets_rasi_to_lord: dict[int, str]) -> str:
    """Return the planet that lords the Badhaka house for the given lagna."""
```

---

### W09 — Wire Ashtakavarga Into Prediction Scoring

**Phase:** P4  
**Acceptance:** `life_areas_service._score_area()` uses BAV bindu count of the
transiting planet in its current sign as a +/−5 point modifier (Layer 6 of the
0–100 framework). SAV of the relevant house used as +/−3 point modifier.

**File to edit:** `app/services/life_areas_service.py`

Current signature of `_score_area()`:
```python
def _score_area(area, natal_moon_rasi, transit_bodies, maha_lord, antar_lord,
                sani_cycle_type, sani_cycle_active, kandaka_sani_active,
                chandrashtama) -> int:
```

New signature:
```python
def _score_area(area, natal_moon_rasi, transit_bodies, maha_lord, antar_lord,
                sani_cycle_type, sani_cycle_active, kandaka_sani_active,
                chandrashtama,
                bav: dict | None = None,      # from compute_bhinnashtakavarga()
                sav: dict | None = None,      # from compute_sarvashtakavarga()
                lagna_rasi: int | None = None,
                ) -> int:
```

Inside the function, after computing the base score, add:
```python
# Layer 6: Ashtakavarga fine correction (±8 points max)
if bav and sav and lagna_rasi:
    relevant_house = _AREA_PRIMARY_HOUSE.get(area, 1)
    relevant_rasi  = ((lagna_rasi - 1 + relevant_house - 1) % 12) + 1
    sav_score      = sav.get(relevant_rasi, 28)
    sav_delta      = round((sav_score - 28) / 28 * 3)   # ±3 points

    # Check karaka planet's BAV in its current transit rasi
    karaka = _AREA_KARAKA.get(area, ["JUPITER"])[0]
    karaka_transit_rasi = transit_bodies.get(karaka, {}).get("rasi", lagna_rasi)
    bav_score  = get_av_bindu(bav, karaka, karaka_transit_rasi)
    bav_delta  = round((bav_score - 4) / 4 * 5)         # ±5 points

    score = max(0, min(100, score + sav_delta + bav_delta))
```

Add `_AREA_PRIMARY_HOUSE: dict[str, int]` constant mapping each area name to its
primary house number.

**File to edit:** `app/api/life_areas.py` (or wherever `get_life_areas` is called)
- Pass `bav` and `sav` computed from the chart's natal positions.

---

### W10 — Divisional Chart Confirmation Layer (L4)

**Phase:** P4  
**Acceptance:** Life area scoring uses divisional charts for confirmation.
Career uses D10, Children uses D7, Wealth uses D2, Spirituality uses D20,
Education uses D24, Marriage uses D9 (already available). Each adds ±10 points.

**File to edit:** `app/services/life_areas_service.py`

Add new function:
```python
_AREA_VARGA: dict[str, str] = {
    "CAREER":      "D10",
    "CHILDREN":    "D7",
    "WEALTH":      "D2",
    "EDUCATION":   "D24",
    "SPIRITUALITY":"D20",
    "PROPERTY":    "D4",
    "MARRIAGE":    "D9",
    "HEALTH":      "D30",
}

def _varga_confirmation_score(
    area: str,
    vargas: dict[str, dict[str, int]],  # from ChartCalculateResponse.vargas
    lagna_rasi: int,
    planet_scores: dict[str, int],
) -> int:
    """
    Returns −10 to +10 based on how well the relevant varga confirms D1 promise.
    Method:
    1. Get the varga map for this area (e.g. D10 for CAREER).
    2. Find the relevant house in the varga (e.g. 10th from D10 lagna).
    3. Check the house lord's strength in the varga.
    4. Check karaka planet's dignity in the varga.
    Score:
      +10: lord strong (score ≥70) and karaka in good dignity.
      +5:  lord moderate (40–69).
       0:  lord weak (20–39).
      −5:  lord very weak (<20) or in dusthana.
      −10: both lord and karaka severely afflicted.
    """
```

Update `_score_area()` to call `_varga_confirmation_score()` and add result to score.

---

### W11 — Double Transit Scoring

**Phase:** P4, P6  
**Acceptance:** When both Jupiter and Saturn simultaneously aspect or occupy the
relevant house for a life area, a +10 bonus is applied. When both malefics
simultaneously transit the relevant house, −10 is applied.

**File to create:** `app/calculations/double_transit.py`

```python
"""
Double transit (Graha Yugma Gochara):
A significant life event requires BOTH Saturn AND Jupiter to activate
the relevant house or its lord simultaneously.
"""

from app.calculations.transits import get_jupiter_aspects, get_saturn_aspects

def score_double_transit(
    relevant_house_rasi: int,     # absolute rasi 1–12 of the relevant house
    jupiter_transit_rasi: int,
    saturn_transit_rasi: int,
    rahu_transit_rasi: int,
    natal_house_lord_rasi: int,   # current rasi of the house lord
) -> int:
    """
    Returns −10 to +15.
    +15: Jupiter transiting relevant house AND Saturn aspecting it (or vice versa).
    +10: Jupiter aspecting relevant house from a supportive position.
     +5: Only one of Jupiter/Saturn connected to relevant house.
      0: Neither connected.
     −5: Saturn transiting relevant house with no Jupiter support.
    −10: Both Rahu/Ketu and Saturn afflicting relevant house simultaneously.
    """
```

**File to edit:** `app/services/life_areas_service.py`
- Import and call `score_double_transit()` inside `_score_area()`.

---

### W12 — Planetary Maturation Ages

**Phase:** P4, P6  
**Acceptance:** `get_life_areas()` and `get_chart_dasha()` both expose
`maturation_status` per planet. Dasha scoring applies a multiplier when the
native has not yet crossed the dasha lord's maturation age.

**File to create:** `app/calculations/maturation.py`

```python
"""
Planetary maturation ages (classical Tamil astrology).
Before maturation, a planet's results manifest with difficulty or immaturity.
After maturation, delivery is natural and full.
"""

MATURATION_AGE: dict[str, int] = {
    "JUPITER":  16,
    "SUN":      22,
    "MOON":     24,
    "VENUS":    25,
    "MARS":     28,
    "MERCURY":  32,
    "SATURN":   36,
    "RAHU":     42,
    "KETU":     48,
}

def maturation_multiplier(planet: str, age_years: float) -> float:
    """
    Returns 0.70 if age < maturation_age (pre-maturation penalty).
    Returns 1.00 if age >= maturation_age.
    Returns 1.10 if age is within 2 years of maturation (peak activation window).
    """

def maturation_status(planet: str, birth_date: date, on_date: date) -> dict:
    """
    Returns {
        "planet": str,
        "maturation_age": int,
        "current_age": float,
        "is_matured": bool,
        "years_to_maturation": float | None,
        "multiplier": float,
        "label_ta": str,
        "label_en": str,
    }
    """
```

**File to edit:** `app/services/dasha_service.py`
- In `_build_dasha_interpretation()`, call `maturation_status()` for the dasha
  lord and include in the returned object.
- In `get_chart_dasha()`, compute age from birth date and pass to
  `maturation_status()`.

**File to edit:** `app/services/life_areas_service.py`
- In `_score_area()`, apply `maturation_multiplier(maha_lord, native_age)` to
  the dasha-activation component of the score.

---

### W13 — Life Areas: Education, Children, Property, Foreign, Litigation, Spirituality

**Phase:** P5  
**Acceptance:** `get_life_areas()` returns all of the following areas in addition
to existing ones: `EDUCATION`, `CHILDREN`, `PROPERTY`, `FOREIGN`, `LITIGATION`,
`SPIRITUALITY`. Each has score, confidence, narrative, remedy, supporting/blocking
factors, and timing window. Existing areas must not regress.

**File to edit:** `app/services/life_areas_service.py`

Add to `_DASHA_AREA_SCORE` dict the 6 new areas with scoring per planet.
Add to `_AREA_KARAKA` dict the karaka planets for each new area:
```python
"EDUCATION":    ["MERCURY", "JUPITER"],
"CHILDREN":     ["JUPITER", "MOON"],
"PROPERTY":     ["MARS", "VENUS"],
"FOREIGN":      ["RAHU", "SATURN"],
"LITIGATION":   ["MARS", "SATURN"],
"SPIRITUALITY": ["KETU", "JUPITER"],
```

Add to `_AREA_PRIMARY_HOUSE` (from W09):
```python
"EDUCATION":    5,    # 4th for formal, 9th for higher — use 5th as intelligence house
"CHILDREN":     5,
"PROPERTY":     4,
"FOREIGN":      12,
"LITIGATION":   6,
"SPIRITUALITY": 9,
```

Add `_SANI_AREA_PENALTY` entries for all 6 new areas.

For each new area, add a `_narrative()` branch returning Tamil and English
`_NarrativeBundle` with:
- narrative: what the chart shows for this area now
- outlook: next 30-day window
- remedy: specific to the area's karaka planet
- caution: if score < 40

Add `_Jupiter_house_score`, `_Saturn_house_score` entries for the new areas
in the relevant scoring tables.

Also add the following **house-specific scoring tables** for new areas:
```python
_MERCURY_HOUSE_SCORE_EDUCATION: dict[int, int]  # Mercury house → education score
_JUPITER_HOUSE_SCORE_CHILDREN: dict[int, int]   # Jupiter house → children score
_MARS_HOUSE_SCORE_PROPERTY: dict[int, int]       # Mars house → property score
```

---

### W14 — Varshaphala / Tajaka Full Integration

**Phase:** P6  
**Acceptance:** `app/services/tajaka_service.py` (new) exposes
`get_varshaphala(session, chart_id, year)` returning a full Varshaphala response
including: solar return lagna, muntha position, year lord, Tajaka planet positions,
Itthasala/Isarafa aspects, and a prediction narrative per life area for the year.

**File to create:** `app/services/tajaka_service.py`

```python
"""
Tajaka (Varshaphala / Annual Chart) service.
Uses app/calculations/tajaka.py which already has:
  - find_solar_return_jd()
  - calculate_muntha()
  - calculate_tajaka_chart()
"""

from app.calculations.tajaka import (
    find_solar_return_jd, calculate_muntha, calculate_tajaka_chart
)

_TAJAKA_YEAR_LORD_BY_WEEKDAY = {
    0: "SUN",    # Sunday
    1: "MOON",   # Monday
    2: "MARS",   # Tuesday
    3: "MERCURY",# Wednesday
    4: "JUPITER",# Thursday
    5: "VENUS",  # Friday
    6: "SATURN", # Saturday
}

def _detect_itthasala(
    slow_planet_deg: float, fast_planet_deg: float,
    slow_planet_daily_speed: float, fast_planet_daily_speed: float,
    orb_degrees: float = 1.0,
) -> bool:
    """
    Itthasala (applying aspect): fast planet approaching slow planet within orb,
    both moving in the same direction (direct) and fast is behind slow.
    """

def _detect_isarafa(
    slow_planet_deg: float, fast_planet_deg: float,
    slow_planet_daily_speed: float, fast_planet_daily_speed: float,
) -> bool:
    """Isarafa (separating): fast planet just passed slow planet, moving away."""

def get_varshaphala(
    session: Session,
    chart_id: UUID,
    year: int,
) -> VarshaphalaResponse:
    """
    1. Load natal chart for chart_id.
    2. Compute solar return JD for the given year.
    3. Compute Tajaka chart (SR lagna, planet positions).
    4. Compute Muntha (natal lagna + years elapsed, 1 rasi per year).
    5. Determine year lord from weekday of solar return.
    6. Detect Itthasala / Isarafa pairs among Tajaka planets.
    7. Score each life area for the year using:
       - Tajaka lagna strength
       - Year lord's house placement
       - Muntha house
       - Itthasala/Isarafa involving area karaka
    8. Return VarshaphalaResponse.
    """
```

**File to create:** `app/schemas/varshaphala.py`
```python
class VarshaphalaData(BaseModel):
    year: int
    solar_return_date: date
    solar_return_lagna_rasi: int
    solar_return_lagna_name: str
    muntha_rasi: int
    muntha_rasi_name: str
    muntha_house_from_sr_lagna: int
    year_lord: str
    year_lord_house: int
    tajaka_planets: list[TajakaPlanetPosition]
    itthasala_pairs: list[TajakaAspect]
    isarafa_pairs: list[TajakaAspect]
    area_outlook: list[VarshaphalaAreaOutlook]

class VarshaphalaAreaOutlook(BaseModel):
    area: str
    score: int               # 0–100
    narrative_ta: str
    narrative_en: str
    favourable_months: list[int]   # 1–12
```

**File to edit:** `app/api/charts.py`
- Add GET endpoint: `/api/v1/charts/{chart_id}/varshaphala?year=YYYY`
- Calls `get_varshaphala(session, chart_id, year)`.

---

### W15 — Formal Remedy Catalog Engine

**Phase:** P7  
**Acceptance:** `app/calculations/remedies.py` (new) contains a complete,
queryable remedy catalog. Every dosham and weak planet can be looked up to get
specific remedies. Life area responses include `structured_remedy` field with
typed sub-fields (temple, mantra, daanam, fasting, behavioural).

**File to create:** `app/calculations/remedies.py`

```python
"""
Formal remedy catalog for all 9 grahas.
Rules:
  - Gemstone only prescribed for FUNCTIONAL BENEFIC planets.
  - For malefic planets: daanam + mantra only (no gemstone).
  - Match remedy intensity to dosham severity.
"""

from dataclasses import dataclass
from app.calculations.functional_nature import FunctionalNature

@dataclass(frozen=True)
class PlanetRemedy:
    planet: str
    day: str
    temple_ta: str
    temple_en: str
    mantra_seed: str
    mantra_full_ta: str
    japa_count: int
    daanam_items_ta: str
    daanam_items_en: str
    gemstone_ta: str
    gemstone_en: str
    metal: str
    finger: str
    fasting_rule_ta: str
    fasting_rule_en: str
    behavioural_ta: str
    behavioural_en: str

PLANET_REMEDIES: dict[str, PlanetRemedy] = {
    "SUN": PlanetRemedy(
        planet="SUN", day="ஞாயிறு",
        temple_ta="சூரியனார் கோவில், கும்பகோணம்",
        temple_en="Suriyanar Kovil, Kumbakonam",
        mantra_seed="ஓம் ஹ்ராம்",
        mantra_full_ta="ஓம் ஹ்ராம் ஹ்ரீம் ஹ்ரௌம் ஸஃ சூர்யாய நமஃ",
        japa_count=7000,
        daanam_items_ta="கோதுமை, சிவப்பு வஸ்திரம், தாமிரம்",
        daanam_items_en="Wheat, red cloth, copper",
        gemstone_ta="மாணிக்கம்",
        gemstone_en="Ruby",
        metal="Gold", finger="Ring finger",
        fasting_rule_ta="ஞாயிற்றுக்கிழமை உபவாசம்",
        fasting_rule_en="Fast on Sunday",
        behavioural_ta="தந்தையுடன் உறவை சீர்படுத்துக. அதிகாரிகளை மதிக்க.",
        behavioural_en="Improve relationship with father. Respect authority figures.",
    ),
    "MOON": PlanetRemedy(
        planet="MOON", day="திங்கள்",
        temple_ta="திங்களூர், கும்பகோணம்",
        temple_en="Thingaloor, Kumbakonam",
        mantra_seed="ஓம் ஹ்ரீம்",
        mantra_full_ta="ஓம் ஸ்ரம் ஸ்ரீம் ஸ்ரௌம் ஸஃ சந்த்ராய நமஃ",
        japa_count=11000,
        daanam_items_ta="அரிசி, வெள்ளை வஸ்திரம், வெள்ளி",
        daanam_items_en="Rice, white cloth, silver",
        gemstone_ta="முத்து",
        gemstone_en="Pearl",
        metal="Silver", finger="Little finger",
        fasting_rule_ta="திங்கட்கிழமை உபவாசம்",
        fasting_rule_en="Fast on Monday",
        behavioural_ta="தாயுடன் உறவை சீர்படுத்துக. மன அமைதியை வளர்க்க.",
        behavioural_en="Improve relationship with mother. Cultivate mental calm.",
    ),
    "MARS": PlanetRemedy(
        planet="MARS", day="செவ்வாய்",
        temple_ta="வைத்தீஸ்வரன் கோவில்",
        temple_en="Vaitheeswaran Kovil",
        mantra_seed="ஓம் க்ராம்",
        mantra_full_ta="ஓம் க்ராம் க்ரீம் க்ரௌம் ஸஃ பௌமாய நமஃ",
        japa_count=10000,
        daanam_items_ta="சிவப்பு பருப்பு, சிவப்பு வஸ்திரம், தாமிரம்",
        daanam_items_en="Red lentils, red cloth, copper",
        gemstone_ta="பவழம்",
        gemstone_en="Red Coral",
        metal="Copper", finger="Ring finger",
        fasting_rule_ta="செவ்வாய்க்கிழமை உபவாசம்",
        fasting_rule_en="Fast on Tuesday",
        behavioural_ta="கோபத்தை கட்டுப்படுத்துக. துணிவுடன் செயல்படுக.",
        behavioural_en="Control anger. Act with disciplined courage.",
    ),
    "MERCURY": PlanetRemedy(
        planet="MERCURY", day="புதன்",
        temple_ta="திருவேங்கடு",
        temple_en="Thiruvenkadu",
        mantra_seed="ஓம் ப்ராம்",
        mantra_full_ta="ஓம் ப்ராம் ப்ரீம் ப்ரௌம் ஸஃ புதாய நமஃ",
        japa_count=9000,
        daanam_items_ta="பச்சைப் பயறு, பச்சை வஸ்திரம்",
        daanam_items_en="Green moong, green cloth",
        gemstone_ta="மரகதம்",
        gemstone_en="Emerald",
        metal="Gold", finger="Little finger",
        fasting_rule_ta="புதன்கிழமை உபவாசம்",
        fasting_rule_en="Fast on Wednesday",
        behavioural_ta="தெளிவான தொடர்பு கொள்ளுக. வாக்கை காக்க.",
        behavioural_en="Communicate clearly. Keep your word.",
    ),
    "JUPITER": PlanetRemedy(
        planet="JUPITER", day="வியாழன்",
        temple_ta="ஆலங்குடி",
        temple_en="Alangudi",
        mantra_seed="ஓம் க்ராம்",
        mantra_full_ta="ஓம் க்ராம் க்ரீம் க்ரௌம் ஸஃ குரவே நமஃ",
        japa_count=19000,
        daanam_items_ta="கடலைப் பருப்பு, மஞ்சள், மஞ்சள் வஸ்திரம்",
        daanam_items_en="Chana dal, turmeric, yellow cloth",
        gemstone_ta="புஷ்பராகம்",
        gemstone_en="Yellow Sapphire",
        metal="Gold", finger="Index finger",
        fasting_rule_ta="வியாழக்கிழமை உபவாசம்",
        fasting_rule_en="Fast on Thursday",
        behavioural_ta="குருவை மதிக்க. அறிவை பகிர்க. நேர்மையுடன் வாழ்க.",
        behavioural_en="Respect teachers. Share knowledge. Live with integrity.",
    ),
    "VENUS": PlanetRemedy(
        planet="VENUS", day="வெள்ளி",
        temple_ta="காஞ்சனூர்",
        temple_en="Kanjanoor",
        mantra_seed="ஓம் த்ராம்",
        mantra_full_ta="ஓம் த்ராம் த்ரீம் த்ரௌம் ஸஃ சுக்ராய நமஃ",
        japa_count=16000,
        daanam_items_ta="வெள்ளை வஸ்திரம், நெய், வாசனை திரவியம்",
        daanam_items_en="White cloth, ghee, perfume",
        gemstone_ta="வைரம் அல்லது வெள்ளை நீலம்",
        gemstone_en="Diamond or White Sapphire",
        metal="Silver", finger="Middle finger",
        fasting_rule_ta="வெள்ளிக்கிழமை உபவாசம்",
        fasting_rule_en="Fast on Friday",
        behavioural_ta="கலையில் ஈடுபடுக. உறவுகளில் மரியாதையை வளர்க்க.",
        behavioural_en="Engage in creative arts. Cultivate respect in relationships.",
    ),
    "SATURN": PlanetRemedy(
        planet="SATURN", day="சனி",
        temple_ta="திருநள்ளாறு",
        temple_en="Thirunallar",
        mantra_seed="ஓம் ப்ராம்",
        mantra_full_ta="ஓம் ப்ராம் ப்ரீம் ப்ரௌம் ஸஃ சனைஸ்சராய நமஃ",
        japa_count=23000,
        daanam_items_ta="கருப்பு எள், இரும்பு, எண்ணெய், கருப்பு வஸ்திரம்",
        daanam_items_en="Black sesame, iron, oil, dark cloth",
        gemstone_ta="நீலக்கல் — மிகவும் எச்சரிக்கையாக அணிக",
        gemstone_en="Blue Sapphire — wear only with extreme caution after trial",
        metal="Iron/Steel", finger="Middle finger",
        fasting_rule_ta="சனிக்கிழமை உபவாசம்",
        fasting_rule_en="Fast on Saturday",
        behavioural_ta="ஒழுக்கத்தை வளர்க்க. சோம்பலை ஒழிக்க. மற்றவர்களுக்கு சேவை செய்க.",
        behavioural_en="Build discipline. Eliminate laziness. Serve others.",
    ),
    "RAHU": PlanetRemedy(
        planet="RAHU", day="சனி",
        temple_ta="திருநாகேஸ்வரம்",
        temple_en="Thirunageswaram",
        mantra_seed="ஓம் ப்ராம்",
        mantra_full_ta="ஓம் ப்ராம் ப்ரீம் ப்ரௌம் ஸஃ ராஹவே நமஃ",
        japa_count=18000,
        daanam_items_ta="தேங்காய், கருப்பு போர்வை, கருப்பு உளுந்து",
        daanam_items_en="Coconut, dark blanket, black lentils",
        gemstone_ta="கோமேதகம்",
        gemstone_en="Hessonite Garnet",
        metal="Silver", finger="Middle finger",
        fasting_rule_ta="சனிக்கிழமை ராகு காலத்தில் விரதம்",
        fasting_rule_en="Fast during Rahu Kalam on Saturdays",
        behavioural_ta="ஒரு குறிக்கோளில் கவனம் செலுத்துக. குழப்பத்தை தவிர்க்க.",
        behavioural_en="Focus on one goal. Avoid confusion and scattered attention.",
    ),
    "KETU": PlanetRemedy(
        planet="KETU", day="செவ்வாய்",
        temple_ta="கீழ்ப்பெரும்பள்ளம்",
        temple_en="Keezhaperumpallam",
        mantra_seed="ஓம் ஸ்ராம்",
        mantra_full_ta="ஓம் ஸ்ராம் ஸ்ரீம் ஸ்ரௌம் ஸஃ கேதவே நமஃ",
        japa_count=17000,
        daanam_items_ta="கலவை தானியங்கள், சாம்பல் வஸ்திரம்",
        daanam_items_en="Mixed grains, grey cloth",
        gemstone_ta="வைடூர்யம் (கேட்ஸ் ஐ)",
        gemstone_en="Cat's Eye (Chrysoberyl)",
        metal="Silver", finger="Ring finger",
        fasting_rule_ta="செவ்வாய்க்கிழமை உபவாசம்",
        fasting_rule_en="Fast on Tuesday",
        behavioural_ta="தியானம் செய்க. ஆன்மீக வழிகாட்டி தேடுக.",
        behavioural_en="Practice meditation. Seek a spiritual guide.",
    ),
}

def get_remedy(
    planet: str,
    functional_nature: FunctionalNature,
    severity: str,   # "MILD" | "MODERATE" | "SEVERE"
) -> dict:
    """
    Returns a structured remedy dict.
    CRITICAL RULE: If functional_nature is DUSTHANA or MARAKA,
    gemstone field is set to None — never prescribe gemstone for malefic planets.
    For YOGAKARAKA or TRIKONA: gemstone is prescribed.
    For KENDRA or NEUTRAL: gemstone optional (include with caution note).
    """

def get_area_remedy(
    area: str,
    weak_planets: list[str],
    lagna_rasi: int,
    functional_nature_map: dict[str, FunctionalNature],
    score: int,
) -> dict:
    """
    Returns the most appropriate remedy for a life area based on which
    karaka planets are weak and their functional nature.
    """
```

---

### W16 — Gemstone Prescription Rules Engine

**Phase:** P7  
**Acceptance:** A dedicated endpoint `GET /api/v1/charts/{chart_id}/gemstone-advice`
returns per-planet gemstone recommendations with explicit "prescribed" /
"not prescribed (malefic)" / "optional with caution" flags. No gemstone is ever
recommended for a DUSTHANA or MARAKA planet.

**File to edit:** `app/calculations/remedies.py` (from W15)
- `get_remedy()` must enforce the no-gemstone-for-malefic rule.

**File to create:** `app/api/remedies.py`

```python
@router.get("/charts/{chart_id}/gemstone-advice")
def gemstone_advice(chart_id: UUID, session: Session = Depends(get_db)):
    """
    Returns per-planet gemstone recommendation.
    Response includes:
      - planet
      - functional_nature
      - is_gemstone_prescribed: bool
      - gemstone_name_ta: str | None
      - gemstone_name_en: str | None
      - reason_ta: str
      - reason_en: str
      - caution_ta: str | None
      - caution_en: str | None
    """

@router.get("/charts/{chart_id}/remedy-plan")
def remedy_plan(chart_id: UUID, session: Session = Depends(get_db)):
    """
    Full remedy plan: weakest 3 planets + current dasha lord + any active dosham.
    For each: temple, mantra (with japa count), daanam, fasting, behavioural remedy.
    Ordered by priority: current dasha lord first, then weakest functional benefic,
    then active dosham planet.
    """
```

---

### W17 — Communication Framing: Duration + Action Pairing

**Phase:** P8  
**Acceptance:** Every `LifeAreaData` with `score < 50` must have a non-null
`caution` field that includes: (a) specific duration ("until [date]"),
(b) specific action step, (c) when improvement begins. Every `score ≥ 70` must
have a `next_30_day_outlook` that includes a specific action.

**File to edit:** `app/services/life_areas_service.py`

In `_narrative()`, enforce:
```python
# For difficult periods (score < 40):
caution = _NarrativeBundle(
    narrative=...,
    outlook=...,
    remedy=...,
    caution=LifeAreaText(
        ta=f"இந்த சவாலான காலம் {end_date_str} வரை நீடிக்கும். "
           f"{specific_action_ta}. {improvement_trigger_ta}.",
        en=f"This challenging period lasts until {end_date_str}. "
           f"{specific_action_en}. {improvement_trigger_en}.",
    ),
)
```

Add `_AREA_ACTION_GUIDANCE: dict[str, dict[str, str]]` — per-area action guidance
text for Tamil and English. Keys: area name. Values: `{"ta": "...", "en": "..."}`.

**File to edit:** `app/services/life_areas_service.py`
- `_find_next_improvement_date()` must return a `date`, not `None`, in all cases
  (fall back to "next Jupiter transit to relevant house" if no dasha transition
  found within 2 years).

---

### W18 — Scoring Framework Formal Unification (0–100 Six-Layer)

**Phase:** P4  
**Acceptance:** A single function `compute_prediction_score()` in a new file
explicitly implements all 6 layers from the methodology with exact weights.
`life_areas_service._score_area()` is refactored to call it.

**File to create:** `app/calculations/prediction_score.py`

```python
"""
Six-layer 0–100 prediction scoring framework.
Matches the Thirukanitham methodology Phase 4 exactly.

Layer weights:
  L1 Birth chart promise      30 pts
  L2 Planetary strength       15 pts
  L3 Dasha activation         25 pts
  L4 Divisional confirmation  10 pts
  L5 Transit support          15 pts
  L6 Ashtakavarga correction   5 pts
  Total                      100 pts
"""

@dataclass
class PredictionScoreInput:
    # L1 inputs
    house_lord_strength: int        # 0–100 from compute_natal_planet_score()
    karaka_strength: int            # 0–100
    yoga_present: bool
    yoga_strength: str              # "STRONG"|"PARTIAL"|"WEAK"|"NONE"
    dosham_present: bool
    dosham_cancelled: bool
    dosham_strength: str

    # L2 inputs
    key_planet_strengths: list[int] # list of 0–100 scores

    # L3 inputs
    maha_lord_functional_nature: str      # FunctionalNature value
    antar_lord_functional_nature: str
    maha_lord_house_connection: bool      # owns or placed in relevant house?
    antar_lord_house_connection: bool
    maha_lord_strength: int               # 0–100
    maturation_multiplier: float          # from W12

    # L4 inputs
    varga_confirmation: int               # −10 to +10 from W10

    # L5 inputs
    jupiter_house_score: int              # from _JUPITER_HOUSE_SCORE
    saturn_house_score: int               # from _SATURN_HOUSE_SCORE (negative = penalty)
    double_transit_score: int             # from W11
    is_sade_sati: bool
    is_ashtama_sani: bool

    # L6 inputs
    bav_delta: int                        # from W09
    sav_delta: int                        # from W09

@dataclass
class PredictionScoreResult:
    total: int                     # 0–100 final score
    l1_birth_promise: int          # 0–30
    l2_planet_strength: int        # 0–15
    l3_dasha_activation: int       # 0–25
    l4_varga_confirmation: int     # 0–10
    l5_transit_support: int        # 0–15
    l6_ashtakavarga: int           # 0–5
    interpretation: str            # "EXCEPTIONAL"|"STRONG"|"GOOD"|"MIXED"|"DIFFICULT"|"VERY_WEAK"
    interpretation_ta: str
    interpretation_en: str

def compute_prediction_score(inp: PredictionScoreInput) -> PredictionScoreResult:
    """Implement all 6 layers per methodology. Clamp each layer to its max."""

_INTERPRETATION_SCALE = [
    (91, "EXCEPTIONAL", "மிகவும் சிறப்பான காலம்", "Exceptional period — act fully"),
    (76, "STRONG",      "வலிமையான ஆதரவு",          "Strong support — act with confidence"),
    (61, "GOOD",        "நல்ல வாய்ப்பு",             "Good chance with effort"),
    (41, "MIXED",       "கலப்பான பலன்",              "Mixed — careful planning needed"),
    (21, "DIFFICULT",   "சவாலான காலம்",              "Significant struggle — wait for better window"),
    (0,  "VERY_WEAK",   "இப்போது தவிர்க்கவும்",      "Avoid major risk in this area now"),
]
```

**File to edit:** `app/services/life_areas_service.py`
- Replace the existing ad-hoc score accumulation in `_score_area()` with a call
  to `compute_prediction_score()`, constructing `PredictionScoreInput` from
  available data.
- Expose `l1`–`l6` breakdown in `LifeAreaData` as `score_breakdown: dict | None`.

---

## IMPLEMENTATION ORDER (strict — each builds on prior)

```
W01 → W02 → W04 → W05 → W06 → W03
                ↓
W07 → W08 → W12 → W09 → W10 → W11 → W18
                                      ↓
                         W13 → W14 → W15 → W16 → W17
```

Concretely:

1. **W01** (Bhava Chalit) — no dependencies
2. **W02** (Divisional charts) — no dependencies, can run parallel with W01
3. **W04** (Chesta + War Bala) — no dependencies
4. **W05** (Baladi Avastha) — depends on W04 being in same file
5. **W06** (Nakshatra chains) — no dependencies
6. **W07** (Yoga library expansion) — no dependencies
7. **W08** (Missing doshams) — no dependencies
8. **W12** (Maturation ages) — no dependencies
9. **W03** (Validation gate) — depends on W01, W02 (needs complete chart)
10. **W09** (Ashtakavarga wiring) — depends on W02 (needs vargas in response)
11. **W10** (Varga confirmation L4) — depends on W02
12. **W11** (Double transit) — depends on nothing, can run earlier
13. **W15** (Remedy catalog) — depends on W08 (needs all doshams)
14. **W16** (Gemstone rules) — depends on W15
15. **W13** (New life areas) — depends on W09, W10, W11, W12
16. **W14** (Varshaphala) — depends on W02 (uses divisional chart infrastructure)
17. **W18** (Unified scoring) — depends on W09, W10, W11, W12, W13
18. **W17** (Communication framing) — depends on W18

---

## DATABASE MIGRATIONS REQUIRED

| Migration | Triggered by | What it adds |
|---|---|---|
| `add_bhava_house_to_chart_planets` | W01 | `bhava_house int nullable` column on `chart_planets` |
| `add_vargas_to_charts` | W02 | `vargas jsonb` column on `charts` table (store computed varga maps) |
| `add_maturation_status_to_dasha_periods` | W12 | No schema change — computed at read time, not stored |

Run migrations against test DB only:
```powershell
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro'
alembic upgrade head
```

---

## TEST COVERAGE REQUIREMENTS

Every work item must have a corresponding test file. Tests must:
- Use `pytest` and the existing test infrastructure in `tests/`
- Use `sqlite:///./pytest_local_test.db` for the DB URL
- Not import or reference `vinaadi_dev`
- Set `$env:PYTHONUTF8 = "1"` before running (Tamil string comparisons)

Minimum test assertions per work item:

| Work item | Minimum assertions |
|---|---|
| W01 Bhava Chalit | 5 planet-position cases including cusp boundary |
| W02 Divisional charts | 3 longitude cases × 4 vargas = 12 assertions |
| W03 Validation gate | Pass case (3/3 match), fail case (1/3 match) |
| W04 Chesta + War | War loser penalty, retrograde bonus, luminary neutral |
| W05 Baladi Avastha | Odd sign peak (Yuva zone), even sign peak, Mrita zone |
| W06 Nakshatra chains | Chain depth ≤ 4, Pushkara degree match, Gandanta zone detection |
| W07 Yoga library | Each new yoga: present case + absent case + cancellation case |
| W08 Doshams | Each dosham: active + cancelled + absent |
| W09 BAV wiring | Score shifts +5 when bindu=8, −5 when bindu=0 |
| W10 Varga L4 | Score +10 when varga confirms, −5 when contradicts |
| W11 Double transit | +15 when Jupiter in house and Saturn aspects, −10 when both malefic |
| W12 Maturation | Pre-maturation multiplier=0.70, at maturation=1.10, post=1.00 |
| W13 New life areas | Each new area returns score, narrative, remedy in Tamil+English |
| W14 Varshaphala | SR lagna computed, Muntha correct, Itthasala detected |
| W15 Remedy catalog | All 9 planets have complete remedy entries, no null fields |
| W16 Gemstone rules | DUSTHANA planet → gemstone=None, YOGAKARAKA → gemstone prescribed |
| W17 Communication | score<40 → caution has end date and action, score≥70 → outlook has action |
| W18 Unified scoring | L1+L2+L3+L4+L5+L6 sum equals total, all clamps respected |

---

## WHAT NOT TO DO

- Do not change ayanamsa from Lahiri.
- Do not alter existing `DashaPeriod`, `VimshottariTimeline`, or `ChartPlanet`
  fields in a breaking way — add new fields only.
- Do not run any migration against `vinaadi_dev`.
- Do not rewrite D9 — it exists and is correct; import from `astro.py`.
- Do not add gemstone recommendations for DUSTHANA or MARAKA planets under any
  circumstances.
- Do not change the `FunctionalNature` enum values.
- Do not use `&&` in PowerShell. Use `;`.
- Do not use `head` command. Use `Select-Object -First N`.
- All new `.py` files: UTF-8 without BOM.

---

## ACCEPTANCE CHECKLIST (run before closing any work item)

```powershell
$env:PYTHONUTF8 = "1"
$env:JOTHIDAM_DATABASE_URL = "sqlite:///./pytest_local_test.db"
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro'
python -m pytest tests/ -x -q 2>&1 | Select-Object -First 60
```

All tests must pass. Zero failures. Zero errors. Warnings are acceptable.

After all 18 work items are complete, re-run the phase scoring against the
`thirukanitham-methodology.md` rubric. Every phase must score ≥98.

---

## ESSENTIAL IMPLEMENTATION BODIES

The sections below supply the full logic bodies that work items above only
describe as stubs. A coding agent must use these exactly — do not invent
alternative formulas.

---

### BODY-W01 — Bhava Chalit full implementation

```python
# app/calculations/bhava_chalit.py

def compute_bhava_chalit(
    lagna_longitude: float,
    planet_longitudes: dict[str, float],
) -> dict[str, int]:
    cusps = [((lagna_longitude + h * 30.0) % 360.0) for h in range(12)]

    def _bhava(longitude: float) -> int:
        lon = longitude % 360.0
        for h in range(11, -1, -1):
            c = cusps[h]
            # handle wrap-around at 0°/360°
            if c <= lon or (h == 0 and lon < cusps[0]):
                pass
        # simpler forward scan
        for h in range(12):
            c_start = cusps[h]
            c_end   = cusps[(h + 1) % 12]
            if c_end > c_start:
                if c_start <= lon < c_end:
                    return h + 1
            else:                          # wrap crosses 0°
                if lon >= c_start or lon < c_end:
                    return h + 1
        return 1                           # fallback

    result: dict[str, int] = {}
    for planet, lon in planet_longitudes.items():
        result[planet] = _bhava(lon % 360.0)
    return result


def bhava_sandhi_planets(
    lagna_longitude: float,
    planet_longitudes: dict[str, float],
    orb_degrees: float = 1.0,
) -> list[str]:
    """Returns list of planet names within orb_degrees of any bhava cusp."""
    cusps = [((lagna_longitude + h * 30.0) % 360.0) for h in range(12)]
    sandhi = []
    for planet, lon in planet_longitudes.items():
        lon = lon % 360.0
        for c in cusps:
            diff = min(abs(lon - c), 360.0 - abs(lon - c))
            if diff <= orb_degrees:
                sandhi.append(planet)
                break
    return sandhi
```

---

### BODY-W02 — Divisional chart formula bodies

```python
# app/calculations/divisional_charts.py
# Full formula implementations — copy these exactly.

from app.calculations.astro import navamsa_rasi_from_degree   # D9 reuse

def _deg_in_sign(longitude: float) -> float:
    return longitude % 30.0

def _sign(longitude: float) -> int:           # 1-based
    return int(longitude / 30.0) % 12 + 1

def _offset_sign(base: int, offset: int) -> int:
    return (base - 1 + offset) % 12 + 1


def compute_d2(planet_longitudes: dict[str, float]) -> dict[str, int]:
    result = {}
    for p, lon in planet_longitudes.items():
        sign = _sign(lon)
        deg  = _deg_in_sign(lon)
        is_odd = (sign % 2 == 1)
        # Odd sign: 0–15° → Leo (5), 15–30° → Cancer (4)
        # Even sign: 0–15° → Cancer (4), 15–30° → Leo (5)
        if is_odd:
            result[p] = 5 if deg < 15.0 else 4
        else:
            result[p] = 4 if deg < 15.0 else 5
    return result


def compute_d3(planet_longitudes: dict[str, float]) -> dict[str, int]:
    result = {}
    for p, lon in planet_longitudes.items():
        sign = _sign(lon)
        deg  = _deg_in_sign(lon)
        if deg < 10.0:
            result[p] = sign
        elif deg < 20.0:
            result[p] = _offset_sign(sign, 4)
        else:
            result[p] = _offset_sign(sign, 8)
    return result


def compute_d4(planet_longitudes: dict[str, float]) -> dict[str, int]:
    result = {}
    for p, lon in planet_longitudes.items():
        sign  = _sign(lon)
        deg   = _deg_in_sign(lon)
        part  = int(deg / 7.5)          # 0,1,2,3
        offsets = [0, 3, 6, 9]
        result[p] = _offset_sign(sign, offsets[part])
    return result


def compute_d7(planet_longitudes: dict[str, float]) -> dict[str, int]:
    result = {}
    for p, lon in planet_longitudes.items():
        sign  = _sign(lon)
        deg   = _deg_in_sign(lon)
        part  = int(deg / (30.0 / 7))   # 0–6
        part  = min(part, 6)
        is_odd = (sign % 2 == 1)
        base  = sign if is_odd else _offset_sign(sign, 6)
        result[p] = _offset_sign(base, part)
    return result


def compute_d9(planet_longitudes: dict[str, float]) -> dict[str, int]:
    """Delegates to existing implementation — do not duplicate logic."""
    from app.calculations.astro import navamsa_rasi_from_degree
    return {p: navamsa_rasi_from_degree(lon) for p, lon in planet_longitudes.items()}


def compute_d10(planet_longitudes: dict[str, float]) -> dict[str, int]:
    result = {}
    for p, lon in planet_longitudes.items():
        sign  = _sign(lon)
        deg   = _deg_in_sign(lon)
        part  = int(deg / 3.0)          # 0–9
        part  = min(part, 9)
        is_odd = (sign % 2 == 1)
        base  = sign if is_odd else _offset_sign(sign, 8)
        result[p] = _offset_sign(base, part)
    return result


def compute_d12(planet_longitudes: dict[str, float]) -> dict[str, int]:
    result = {}
    for p, lon in planet_longitudes.items():
        sign  = _sign(lon)
        deg   = _deg_in_sign(lon)
        part  = int(deg / 2.5)          # 0–11
        part  = min(part, 11)
        result[p] = _offset_sign(sign, part)
    return result


def compute_d16(planet_longitudes: dict[str, float]) -> dict[str, int]:
    # Base sign by type: Movable→Aries(1), Fixed→Leo(5), Dual→Sagittarius(9)
    _MOVABLE = {1, 4, 7, 10}
    _FIXED   = {2, 5, 8, 11}
    _BASE    = {s: 1 for s in _MOVABLE}
    _BASE.update({s: 5 for s in _FIXED})
    _BASE.update({s: 9 for s in {3, 6, 9, 12}})
    result = {}
    for p, lon in planet_longitudes.items():
        sign  = _sign(lon)
        deg   = _deg_in_sign(lon)
        part  = int(deg / (30.0 / 16))
        part  = min(part, 15)
        result[p] = _offset_sign(_BASE[sign], part)
    return result


def compute_d20(planet_longitudes: dict[str, float]) -> dict[str, int]:
    # Base: Movable→Aries(1), Fixed→Sagittarius(9), Dual→Leo(5)
    _BASE20 = {}
    for s in {1, 4, 7, 10}: _BASE20[s] = 1
    for s in {2, 5, 8, 11}: _BASE20[s] = 9
    for s in {3, 6, 9, 12}: _BASE20[s] = 5
    result = {}
    for p, lon in planet_longitudes.items():
        sign  = _sign(lon)
        deg   = _deg_in_sign(lon)
        part  = int(deg / 1.5)
        part  = min(part, 19)
        result[p] = _offset_sign(_BASE20[sign], part)
    return result


def compute_d24(planet_longitudes: dict[str, float]) -> dict[str, int]:
    # Odd signs start from Leo (5), even signs from Cancer (4)
    result = {}
    for p, lon in planet_longitudes.items():
        sign  = _sign(lon)
        deg   = _deg_in_sign(lon)
        part  = int(deg / 1.25)
        part  = min(part, 23)
        base  = 5 if (sign % 2 == 1) else 4
        result[p] = _offset_sign(base, part)
    return result


# D30 Trimsamsa — unequal divisions (classical)
_D30_ODD  = [(5,"MARS"), (5,"SATURN"), (8,"JUPITER"), (7,"MERCURY"), (5,"VENUS")]
_D30_EVEN = [(5,"VENUS"), (7,"MERCURY"), (8,"JUPITER"), (5,"SATURN"), (5,"MARS")]
# The rasi assigned is the sign owned by the division lord
_PLANET_OWN_SIGN_D30 = {
    "MARS": 1, "VENUS": 2, "MERCURY": 3, "MOON": 4, "SUN": 5,
    "SATURN": 7, "JUPITER": 9,
}

def compute_d30(planet_longitudes: dict[str, float]) -> dict[str, int]:
    result = {}
    for p, lon in planet_longitudes.items():
        sign  = _sign(lon)
        deg   = _deg_in_sign(lon)
        table = _D30_ODD if (sign % 2 == 1) else _D30_EVEN
        cursor = 0.0
        assigned_lord = table[-1][1]
        for span, lord in table:
            cursor += span
            if deg < cursor:
                assigned_lord = lord
                break
        result[p] = _PLANET_OWN_SIGN_D30.get(assigned_lord, sign)
    return result


def compute_d40(planet_longitudes: dict[str, float]) -> dict[str, int]:
    # Odd→Aries(1), Even→Libra(7)
    result = {}
    for p, lon in planet_longitudes.items():
        sign  = _sign(lon)
        deg   = _deg_in_sign(lon)
        part  = int(deg / 0.75)
        part  = min(part, 39)
        base  = 1 if (sign % 2 == 1) else 7
        result[p] = _offset_sign(base, part % 12)
    return result


def compute_d60(planet_longitudes: dict[str, float]) -> dict[str, int]:
    result = {}
    for p, lon in planet_longitudes.items():
        deg   = lon % 30.0
        part  = int(deg / 0.5)
        part  = min(part, 59)
        result[p] = (part % 12) + 1
    return result


_VARGA_DISPATCH = {
    2: compute_d2,   3: compute_d3,   4: compute_d4,
    7: compute_d7,   9: compute_d9,   10: compute_d10,
    12: compute_d12, 16: compute_d16, 20: compute_d20,
    24: compute_d24, 30: compute_d30, 40: compute_d40,
    60: compute_d60,
}

def get_varga(division: int, planet_longitudes: dict[str, float]) -> dict[str, int]:
    fn = _VARGA_DISPATCH.get(division)
    if fn is None:
        raise ValueError(f"Unsupported varga division: {division}")
    return fn(planet_longitudes)
```

---

### BODY-W04 — Chesta Bala + Planetary War full bodies

```python
# Additions to app/calculations/chart_strength.py

_MEAN_DAILY_SPEED: dict[str, float] = {
    "SUN": 0.9856, "MOON": 13.1764, "MARS": 0.5240,
    "MERCURY": 1.3830, "JUPITER": 0.0831, "VENUS": 1.2000,
    "SATURN": 0.0335,
}
_WAR_PARTICIPANTS = {"MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"}

def detect_planetary_wars(
    planet_longitudes: dict[str, float],
) -> dict[str, str]:
    wars: dict[str, str] = {}
    planets = [p for p in planet_longitudes if p in _WAR_PARTICIPANTS]
    for i in range(len(planets)):
        for j in range(i + 1, len(planets)):
            a, b = planets[i], planets[j]
            diff = abs(planet_longitudes[a] - planet_longitudes[b]) % 360.0
            if diff > 180.0:
                diff = 360.0 - diff
            if diff <= 1.0:
                # loser = lower absolute longitude within the sign
                deg_a = planet_longitudes[a] % 30.0
                deg_b = planet_longitudes[b] % 30.0
                loser, winner = (a, b) if deg_a < deg_b else (b, a)
                wars[loser] = winner
    return wars


def _chesta_bala_score(
    planet: str,
    is_retrograde: bool,
    speed_ratio: float | None,
) -> float:
    if planet in ("SUN", "MOON"):
        return 0.5
    if planet in ("RAHU", "KETU"):
        return 0.6
    if is_retrograde:
        return 1.0
    if speed_ratio is None:
        return 0.6
    if speed_ratio < 0.5:
        return 0.4
    if speed_ratio > 1.5:
        return 0.5
    return 0.6
```

---

### BODY-W12 — Maturation full bodies

```python
# app/calculations/maturation.py

from datetime import date

MATURATION_AGE: dict[str, int] = {
    "JUPITER": 16, "SUN": 22, "MOON": 24, "VENUS": 25,
    "MARS": 28, "MERCURY": 32, "SATURN": 36, "RAHU": 42, "KETU": 48,
}

def maturation_multiplier(planet: str, age_years: float) -> float:
    mat = MATURATION_AGE.get(planet, 30)
    if age_years < mat - 2:
        return 0.70
    if mat - 2 <= age_years <= mat + 2:
        return 1.10      # peak activation window
    return 1.00

def maturation_status(planet: str, birth_date: date, on_date: date) -> dict:
    mat = MATURATION_AGE.get(planet, 30)
    delta = on_date - birth_date
    age   = delta.days / 365.25
    is_matured = age >= mat
    years_to   = max(0.0, mat - age) if not is_matured else None
    mult = maturation_multiplier(planet, age)

    if is_matured:
        label_ta = f"{planet} பலன் முழுமை பெற்றது (வயது {mat}+)"
        label_en = f"{planet} fully matured (age {mat}+)"
    else:
        label_ta = f"{planet} இன்னும் முதிர்வடையவில்லை ({years_to:.1f} ஆண்டுகள் மீதம்)"
        label_en = f"{planet} not yet matured ({years_to:.1f} yrs remaining)"

    return {
        "planet": planet,
        "maturation_age": mat,
        "current_age": round(age, 2),
        "is_matured": is_matured,
        "years_to_maturation": round(years_to, 2) if years_to else None,
        "multiplier": mult,
        "label_ta": label_ta,
        "label_en": label_en,
    }
```

---

### BODY-W18 — compute_prediction_score full body

```python
# app/calculations/prediction_score.py

from dataclasses import dataclass

@dataclass
class PredictionScoreInput:
    # L1 — Birth chart promise (max 30)
    house_lord_strength: int        # 0–100
    karaka_strength: int            # 0–100
    yoga_present: bool
    yoga_strength: str              # "STRONG"|"PARTIAL"|"WEAK"|"NONE"
    dosham_present: bool
    dosham_cancelled: bool
    dosham_strength: str            # "STRONG"|"MODERATE"|"MILD"|"NONE"
    # L2 — Planetary strength (max 15)
    key_planet_strengths: list[int] # list of 0–100 scores
    # L3 — Dasha activation (max 25)
    maha_lord_functional_nature: str
    antar_lord_functional_nature: str
    maha_lord_house_connection: bool
    antar_lord_house_connection: bool
    maha_lord_strength: int
    maturation_multiplier: float
    # L4 — Divisional confirmation (max 10)
    varga_confirmation: int         # −10 to +10
    # L5 — Transit support (max 15)
    jupiter_house_score: int        # house-based score table lookup
    saturn_house_score: int         # negative = penalty
    double_transit_score: int       # −10 to +15
    is_sade_sati: bool
    is_ashtama_sani: bool
    # L6 — Ashtakavarga (max 5)
    bav_delta: int                  # −5 to +5
    sav_delta: int                  # −3 to +3


@dataclass
class PredictionScoreResult:
    total: int
    l1_birth_promise: int
    l2_planet_strength: int
    l3_dasha_activation: int
    l4_varga_confirmation: int
    l5_transit_support: int
    l6_ashtakavarga: int
    interpretation: str
    interpretation_ta: str
    interpretation_en: str


_YOGA_STRENGTH_BONUS  = {"STRONG": 8, "PARTIAL": 4, "WEAK": 1, "NONE": 0}
_DOSHAM_PENALTY       = {"STRONG": -10, "MODERATE": -5, "MILD": -2, "NONE": 0}
_FN_DASHA_SCORE       = {
    "YOGAKARAKA": 25, "LAGNA_LORD": 20, "TRIKONA": 18,
    "KENDRA": 12, "NEUTRAL": 10, "UPACHAYA": 8,
    "MARAKA": 5,  "DUSTHANA": 3,
}

def compute_prediction_score(inp: PredictionScoreInput) -> PredictionScoreResult:
    # ── L1: Birth chart promise (0–30) ──────────────────────────────────────
    lord_norm  = inp.house_lord_strength / 100.0
    karak_norm = inp.karaka_strength     / 100.0
    l1 = round((lord_norm * 14 + karak_norm * 8))
    l1 += _YOGA_STRENGTH_BONUS.get(inp.yoga_strength, 0)
    dosham_pen = _DOSHAM_PENALTY.get(inp.dosham_strength, 0)
    if inp.dosham_present and inp.dosham_cancelled:
        dosham_pen = dosham_pen // 2   # halved if cancelled
    l1 = max(0, min(30, l1 + dosham_pen))

    # ── L2: Planetary strength (0–15) ───────────────────────────────────────
    if inp.key_planet_strengths:
        avg = sum(inp.key_planet_strengths) / len(inp.key_planet_strengths)
        l2  = round(avg / 100.0 * 15)
    else:
        l2 = 8   # neutral default
    l2 = max(0, min(15, l2))

    # ── L3: Dasha activation (0–25) ─────────────────────────────────────────
    maha_base  = _FN_DASHA_SCORE.get(inp.maha_lord_functional_nature, 10)
    antar_base = _FN_DASHA_SCORE.get(inp.antar_lord_functional_nature, 10)
    l3 = round((maha_base * 0.6 + antar_base * 0.4))
    if inp.maha_lord_house_connection:
        l3 += 4
    if inp.antar_lord_house_connection:
        l3 += 2
    l3 = round(l3 * inp.maturation_multiplier)
    l3 = max(0, min(25, l3))

    # ── L4: Divisional chart confirmation (0–10) ────────────────────────────
    # varga_confirmation already in range −10..+10; map to 0–10
    l4 = max(0, min(10, inp.varga_confirmation + 5))

    # ── L5: Transit support (0–15) ──────────────────────────────────────────
    l5 = 8   # neutral base
    l5 += round(inp.jupiter_house_score * 0.05)
    l5 += round(inp.saturn_house_score  * 0.03)
    l5 += round(inp.double_transit_score * 0.4)
    if inp.is_sade_sati:
        l5 -= 4
    if inp.is_ashtama_sani:
        l5 -= 3
    l5 = max(0, min(15, l5))

    # ── L6: Ashtakavarga correction (0–5) ───────────────────────────────────
    l6 = max(0, min(5, 3 + inp.bav_delta // 2 + inp.sav_delta // 2))

    total = l1 + l2 + l3 + l4 + l5 + l6
    total = max(0, min(100, total))

    # Interpretation
    interp, ta, en = _INTERPRETATION_SCALE[-1][1], _INTERPRETATION_SCALE[-1][2], _INTERPRETATION_SCALE[-1][3]
    for threshold, key, label_ta, label_en in _INTERPRETATION_SCALE:
        if total >= threshold:
            interp, ta, en = key, label_ta, label_en
            break

    return PredictionScoreResult(
        total=total,
        l1_birth_promise=l1,
        l2_planet_strength=l2,
        l3_dasha_activation=l3,
        l4_varga_confirmation=l4,
        l5_transit_support=l5,
        l6_ashtakavarga=l6,
        interpretation=interp,
        interpretation_ta=ta,
        interpretation_en=en,
    )


_INTERPRETATION_SCALE = [
    (91, "EXCEPTIONAL", "மிகவும் சிறப்பான காலம் — முழு நடவடிக்கை எடுக்கவும்",
                        "Exceptional period — act fully, rare alignment"),
    (76, "STRONG",      "வலிமையான ஆதரவு — நம்பிக்கையுடன் முன்னேறவும்",
                        "Strong support — proceed with confidence"),
    (61, "GOOD",        "நல்ல வாய்ப்பு — முயற்சியுடன் நல்ல பலன் கிடைக்கும்",
                        "Good chance — result comes with sustained effort"),
    (41, "MIXED",       "கலப்பான பலன் — கவனமான திட்டமிடல் தேவை",
                        "Mixed — plan carefully, avoid impulsive decisions"),
    (21, "DIFFICULT",   "சவாலான காலம் — மேலும் நல்ல சந்தர்ப்பத்திற்காக காத்திரு",
                        "Difficult — conserve energy, wait for better window"),
    (0,  "VERY_WEAK",   "இப்போது இந்த விஷயத்தில் பெரிய ஆபத்தை தவிர்க்கவும்",
                        "Avoid major risk in this area during this period"),
]
```

---

### BODY-W13 — Dasha scoring tables for new life areas

Add these tables to `app/services/life_areas_service.py` alongside the existing
`_DASHA_AREA_SCORE` dict. Each value is the base score (0–100) contributed by
that mahadasha lord to that life area.

```python
# Extend _DASHA_AREA_SCORE with 6 new areas
_DASHA_AREA_SCORE_EXTENDED: dict[str, dict[str, int]] = {
    "EDUCATION": {
        "SUN": 60, "MOON": 55, "MARS": 45, "MERCURY": 85,
        "JUPITER": 80, "VENUS": 55, "SATURN": 40,
        "RAHU": 60, "KETU": 50,
    },
    "CHILDREN": {
        "SUN": 55, "MOON": 65, "MARS": 50, "MERCURY": 50,
        "JUPITER": 85, "VENUS": 60, "SATURN": 35,
        "RAHU": 40, "KETU": 45,
    },
    "PROPERTY": {
        "SUN": 55, "MOON": 60, "MARS": 80, "MERCURY": 55,
        "JUPITER": 65, "VENUS": 75, "SATURN": 50,
        "RAHU": 45, "KETU": 40,
    },
    "FOREIGN": {
        "SUN": 45, "MOON": 55, "MARS": 50, "MERCURY": 65,
        "JUPITER": 60, "VENUS": 60, "SATURN": 45,
        "RAHU": 85, "KETU": 50,
    },
    "LITIGATION": {
        "SUN": 60, "MOON": 40, "MARS": 75, "MERCURY": 60,
        "JUPITER": 55, "VENUS": 40, "SATURN": 70,
        "RAHU": 65, "KETU": 45,
    },
    "SPIRITUALITY": {
        "SUN": 65, "MOON": 60, "MARS": 45, "MERCURY": 55,
        "JUPITER": 80, "VENUS": 50, "SATURN": 60,
        "RAHU": 40, "KETU": 85,
    },
}

# Saturn cycle penalty table extension for new areas
_SANI_AREA_PENALTY_EXTENDED: dict[str, dict[str, int]] = {
    "EDUCATION":   {"EZHARAI_SANI_PHASE_1": -8, "JANMA_SANI": -12, "EZHARAI_SANI_PHASE_3": -10,
                    "ARDHASHTAMA_SANI": -6, "ASHTAMA_SANI": -15, "KANDAKA_SANI": -10, "NONE": 0},
    "CHILDREN":    {"EZHARAI_SANI_PHASE_1": -10, "JANMA_SANI": -15, "EZHARAI_SANI_PHASE_3": -12,
                    "ARDHASHTAMA_SANI": -8, "ASHTAMA_SANI": -18, "KANDAKA_SANI": -8, "NONE": 0},
    "PROPERTY":    {"EZHARAI_SANI_PHASE_1": -5, "JANMA_SANI": -10, "EZHARAI_SANI_PHASE_3": -8,
                    "ARDHASHTAMA_SANI": -5, "ASHTAMA_SANI": -12, "KANDAKA_SANI": -12, "NONE": 0},
    "FOREIGN":     {"EZHARAI_SANI_PHASE_1": -5, "JANMA_SANI": -8, "EZHARAI_SANI_PHASE_3": -5,
                    "ARDHASHTAMA_SANI": -4, "ASHTAMA_SANI": -10, "KANDAKA_SANI": -6, "NONE": 0},
    "LITIGATION":  {"EZHARAI_SANI_PHASE_1": -5, "JANMA_SANI": -8, "EZHARAI_SANI_PHASE_3": -5,
                    "ARDHASHTAMA_SANI": -4, "ASHTAMA_SANI": -10, "KANDAKA_SANI": -8, "NONE": 0},
    "SPIRITUALITY":{"EZHARAI_SANI_PHASE_1": 0, "JANMA_SANI": -5, "EZHARAI_SANI_PHASE_3": -3,
                    "ARDHASHTAMA_SANI": 0, "ASHTAMA_SANI": -8, "KANDAKA_SANI": -3, "NONE": 0},
}
```

---

### BODY-W17 — Action guidance text for all life areas

Add this constant to `app/services/life_areas_service.py`:

```python
_AREA_ACTION_GUIDANCE: dict[str, dict[str, str]] = {
    "CAREER": {
        "ta": "தொழில் திறன்களை மேம்படுத்துக. புதிய வாய்ப்புகளுக்கு விண்ணப்பிக்கவும்.",
        "en": "Upgrade professional skills. Apply actively for new opportunities.",
    },
    "MARRIAGE": {
        "ta": "பொருத்தமான நேரத்திற்காக காத்திரு. குடும்பத்தினரின் ஆலோசனை பெறவும்.",
        "en": "Wait for the right timing window. Seek guidance from trusted family.",
    },
    "HEALTH": {
        "ta": "தினசரி உடற்பயிற்சி மற்றும் சரியான உணவு கடைப்பிடிக்கவும். மருத்துவ பரிசோதனை செய்யவும்.",
        "en": "Maintain daily exercise and proper diet. Schedule preventive health checks.",
    },
    "WEALTH": {
        "ta": "அவசர முதலீடுகளை தவிர்க்கவும். சேமிப்பை தொடரவும்.",
        "en": "Avoid impulsive investments. Continue systematic savings.",
    },
    "EDUCATION": {
        "ta": "கவனம் செலுத்தி படிக்கவும். ஆசிரியரின் வழிகாட்டுதல் பெறவும்.",
        "en": "Study with focused attention. Seek a mentor or teacher for guidance.",
    },
    "CHILDREN": {
        "ta": "மருத்துவ ஆலோசனை பெறவும். கர்ப்ப காலத்தில் முறையான சோதனைகள் செய்யவும்.",
        "en": "Consult a physician. Ensure regular medical check-ups during pregnancy period.",
    },
    "PROPERTY": {
        "ta": "சட்ட ஆவணங்களை கவனமாக சரிபார்க்கவும். அவசர வாங்குதலை தவிர்க்கவும்.",
        "en": "Verify legal documents carefully. Avoid rushed property decisions.",
    },
    "FOREIGN": {
        "ta": "ஆவணங்களை சரியாக தயார் செய்யவும். நம்பகமான தரப்பினரின் உதவி பெறவும்.",
        "en": "Prepare documentation thoroughly. Work through trusted representatives.",
    },
    "LITIGATION": {
        "ta": "நிபுணர் வழக்கறிஞர் உதவி பெறவும். சமரசத்தை கவனமாக ஆராயவும்.",
        "en": "Engage a skilled legal counsel. Carefully explore settlement options.",
    },
    "SPIRITUALITY": {
        "ta": "தினசரி தியானம் அல்லது ஜபம் செய்யவும். கோயில் தரிசனம் சிறப்பான பலன் தரும்.",
        "en": "Practice daily meditation or mantra japa. Temple visits will yield good results.",
    },
}
```

---

### BODY — Prasna (Horary) module — W19 (new work item)

The methodology requires Prasna as a fallback when birth time is unknown.
This is not in the original 18 items. Add it.

**Work item ID:** W19  
**Phase:** P1, P6  
**Priority:** High  
**Dependencies:** W01, W02 (uses same chart assembly pipeline)

**File to create:** `app/calculations/prasna.py`

```python
"""
Prasna (Horary Astrology) chart.
Cast for the exact moment a question is asked, at the astrologer's location.
Used when: birth time unknown, specific immediate question, chart validation failed.
"""

import swisseph as swe
from datetime import datetime
from app.calculations.astro import (
    local_datetime_to_utc, utc_datetime_to_julian_day,
    rasi_from_degree, nakshatra_from_degree, pada_from_degree,
)
from app.calculations.dasha import NAK_LORD

_PRASNA_QUESTION_AREAS = {
    "JOB":        {"houses": [10, 6, 2, 11], "karaka": "MERCURY"},
    "MARRIAGE":   {"houses": [7, 2, 8],      "karaka": "VENUS"},
    "HEALTH":     {"houses": [1, 6, 8, 12],  "karaka": "SUN"},
    "FINANCE":    {"houses": [2, 5, 9, 11],  "karaka": "JUPITER"},
    "PROPERTY":   {"houses": [4, 11],        "karaka": "MARS"},
    "TRAVEL":     {"houses": [3, 9, 12],     "karaka": "MERCURY"},
    "LEGAL":      {"houses": [6, 7, 8],      "karaka": "MARS"},
    "CHILDREN":   {"houses": [5, 9],         "karaka": "JUPITER"},
    "GENERAL":    {"houses": [1, 10],        "karaka": "SUN"},
}

def cast_prasna_chart(
    question_datetime_local: datetime,
    timezone_name: str,
    latitude: float,
    longitude: float,
    question_area: str = "GENERAL",
    ayanamsa_type: str = "LAHIRI",
) -> dict:
    """
    Returns a prasna chart dict:
    {
        "prasna_lagna_rasi": int,
        "prasna_lagna_degree": float,
        "moon_rasi": int,
        "moon_nakshatra": int,
        "question_area": str,
        "relevant_houses": list[int],
        "karaka": str,
        "karaka_rasi": int,
        "karaka_house": int,
        "positive_indicators": list[str],
        "negative_indicators": list[str],
        "outlook": str,   # "FAVOURABLE" | "UNFAVOURABLE" | "MIXED" | "DELAY"
        "outlook_ta": str,
        "outlook_en": str,
    }

    Method:
    1. Cast chart for question_datetime_local at astrologer location.
    2. Compute Prasna Lagna (ascendant at question moment).
    3. Identify relevant houses for question_area.
    4. Check if karaka planet is in kendra/trikona from Prasna Lagna → positive.
    5. Check if Moon is applying to karaka → positive (Itthasala principle).
    6. Check if Moon/Lagna lord is in dusthana → negative.
    7. Return structured outlook.
    """

def prasna_outlook(
    prasna_chart: dict,
    lagna_nature_map: dict[str, str],
) -> str:
    """
    Determine FAVOURABLE / UNFAVOURABLE / MIXED / DELAY from Prasna chart.
    Rules:
    - FAVOURABLE: karaka in kendra/trikona from Prasna Lagna AND Moon applying to benefic.
    - UNFAVOURABLE: karaka in dusthana AND malefic on relevant house.
    - DELAY: karaka in upachaya (3, 6, 10, 11) → result comes but slowly.
    - MIXED: anything else.
    """
```

**File to create:** `app/api/prasna.py`

```python
@router.post("/prasna")
def ask_prasna(
    payload: PrasnaRequest,
    session: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """
    Cast a Prasna chart for an immediate question.
    Used when birth time is unavailable or chart validation failed.
    Request: { question_area, timezone_name, latitude, longitude }
    question_datetime defaults to now (server time at request receipt).
    """
```

**File to create:** `app/schemas/prasna.py`

```python
class PrasnaRequest(BaseModel):
    question_area: str = "GENERAL"   # from _PRASNA_QUESTION_AREAS keys
    timezone_name: str
    latitude: float
    longitude: float
    question_datetime_local: datetime | None = None  # None = use server now

class PrasnaResponse(BaseModel):
    prasna_lagna_rasi: int
    prasna_lagna_name: str
    moon_rasi: int
    moon_nakshatra_name: str
    question_area: str
    karaka: str
    karaka_house: int
    outlook: str              # "FAVOURABLE"|"UNFAVOURABLE"|"MIXED"|"DELAY"
    outlook_ta: str
    outlook_en: str
    positive_indicators: list[str]
    negative_indicators: list[str]
    caution_ta: str
    caution_en: str
```

**Update work item index** — add W19:

| W19 | Prasna (Horary) chart | P1, P6 | High |

**Test:** `tests/test_prasna.py`
- Cast chart for a known datetime — verify Prasna Lagna rasi matches manual calculation.
- MARRIAGE question with Venus in 7th from Prasna Lagna → FAVOURABLE.
- HEALTH question with 6th lord in lagna → UNFAVOURABLE.

---

### BODY — Age-based reading focus completeness check

The methodology (Phase 3, Step 3.1) defines 9 age ranges. Verify that
`app/services/age_phase_service.py` (or equivalent) covers all 9 with the
correct primary and secondary focus areas:

```python
# Confirm these ranges exist in age_phase_service.py — add any missing.
_AGE_PHASE_FOCUS = {
    (0,   1):  {"primary": ["HEALTH", "LONGEVITY"],     "secondary": []},
    (1,   5):  {"primary": ["HEALTH"],                   "secondary": ["EDUCATION"]},
    (5,  12):  {"primary": ["EDUCATION", "HEALTH"],      "secondary": ["SIBLINGS"]},
    (12, 18):  {"primary": ["EDUCATION"],                "secondary": ["CAREER", "FOREIGN"]},
    (18, 25):  {"primary": ["EDUCATION", "CAREER"],      "secondary": ["MARRIAGE", "FOREIGN"]},
    (25, 35):  {"primary": ["CAREER", "MARRIAGE"],       "secondary": ["CHILDREN", "PROPERTY", "WEALTH"]},
    (35, 50):  {"primary": ["CAREER", "WEALTH"],         "secondary": ["CHILDREN", "HEALTH", "PROPERTY"]},
    (50, 60):  {"primary": ["HEALTH", "WEALTH"],         "secondary": ["SPIRITUALITY", "CHILDREN"]},
    (60, 999): {"primary": ["HEALTH", "SPIRITUALITY"],   "secondary": ["WEALTH", "FOREIGN"]},
}
```

**Rule enforced in `get_life_areas()`:** Areas not in `primary` for the
native's age phase are returned with `is_goal_focus = False` and a reduced
`confidence` of `"LOW"` if the area is also not in `secondary`. This prevents
the system from confidently predicting marriage for a 6-month-old.

---

### BODY — Question-based routing table

Add to `app/services/life_areas_service.py`:

```python
# Maps each life area to its primary houses, karaka, and the varga used
# for Layer 4 divisional confirmation. Used by compute_prediction_score.
_AREA_ROUTING: dict[str, dict] = {
    "CAREER":      {"houses": [10, 6, 2, 11], "karaka": ["SUN", "SATURN"],  "varga": "D10", "maraka_risk": False},
    "MARRIAGE":    {"houses": [7, 2, 4, 8],   "karaka": ["VENUS", "JUPITER"],"varga": "D9", "maraka_risk": False},
    "HEALTH":      {"houses": [1, 6, 8, 12],  "karaka": ["SUN", "MOON"],    "varga": "D30", "maraka_risk": True},
    "WEALTH":      {"houses": [2, 5, 9, 11],  "karaka": ["JUPITER", "VENUS"],"varga": "D2", "maraka_risk": False},
    "EDUCATION":   {"houses": [2, 4, 5, 9],   "karaka": ["MERCURY", "JUPITER"],"varga": "D24","maraka_risk": False},
    "CHILDREN":    {"houses": [5, 9],         "karaka": ["JUPITER"],         "varga": "D7", "maraka_risk": False},
    "PROPERTY":    {"houses": [4, 11],        "karaka": ["MARS", "VENUS"],   "varga": "D4", "maraka_risk": False},
    "FOREIGN":     {"houses": [3, 9, 12],     "karaka": ["RAHU"],            "varga": "D9", "maraka_risk": False},
    "LITIGATION":  {"houses": [6, 7, 8],      "karaka": ["MARS", "SATURN"],  "varga": "D30","maraka_risk": False},
    "SPIRITUALITY":{"houses": [5, 9, 12],     "karaka": ["KETU", "JUPITER"], "varga": "D20","maraka_risk": False},
}
```

---

### BODY — Maraka safety guard in communication layer

The methodology explicitly says: "Never predict death directly." Enforce this
in the communication layer.

Add to `app/services/life_areas_service.py`:

```python
def _maraka_safety_check(
    area: str,
    maha_lord: str,
    antar_lord: str,
    lagna_nature_map: dict[str, str],
    native_age: float,
) -> dict | None:
    """
    If area == HEALTH and both maha_lord and antar_lord are MARAKA,
    and native_age > 65, return a caution dict instead of a score.
    Never name it as a death prediction — always frame as 'health caution period'.
    Returns None if no special handling needed.
    """
    from app.calculations.functional_nature import FunctionalNature
    maha_fn  = lagna_nature_map.get(maha_lord,  "NEUTRAL")
    antar_fn = lagna_nature_map.get(antar_lord, "NEUTRAL")
    if (area == "HEALTH"
            and maha_fn  == FunctionalNature.MARAKA
            and antar_fn == FunctionalNature.MARAKA
            and native_age > 65):
        return {
            "override_caution_ta": (
                "இந்த காலகட்டத்தில் உடல் நலத்தில் கூடுதல் கவனம் செலுத்துக. "
                "தொடர்ந்து மருத்துவ பரிசோதனை செய்யவும்."
            ),
            "override_caution_en": (
                "Exercise extra health caution during this period. "
                "Maintain regular medical check-ups and avoid strenuous activity."
            ),
            "suppress_score_display": True,   # show caution, not numeric score
        }
    return None
```

---

### BODY — Dasha transition communication

The methodology states: "Dasha transitions are often major life turning points."
Wire this into dasha service output.

Add to `app/services/dasha_service.py`:

```python
def _dasha_transition_note(
    outgoing_lord: str,
    incoming_lord: str,
    lagna_rasi: int,
    transition_date: date,
) -> dict:
    """
    Returns a bilingual note about the dasha transition.
    Called when building the timeline at the boundary between two Mahadashas.
    """
    from app.calculations.functional_nature import get_functional_nature, FunctionalNature
    out_fn = get_functional_nature(lagna_rasi, outgoing_lord)
    in_fn  = get_functional_nature(lagna_rasi, incoming_lord)

    if (out_fn in (FunctionalNature.YOGAKARAKA, FunctionalNature.TRIKONA)
            and in_fn in (FunctionalNature.DUSTHANA, FunctionalNature.MARAKA)):
        ta = (f"{outgoing_lord} தசையிலிருந்து {incoming_lord} தசைக்கு மாற்றம் — "
              f"சவாலான கட்டம் தொடங்கலாம். கவனமாக இருக்கவும்.")
        en = (f"Transition from {outgoing_lord} to {incoming_lord} dasha — "
              f"a more challenging phase begins. Exercise caution.")
    elif (out_fn in (FunctionalNature.DUSTHANA, FunctionalNature.MARAKA)
            and in_fn in (FunctionalNature.YOGAKARAKA, FunctionalNature.TRIKONA)):
        ta = (f"{incoming_lord} தசை தொடங்குகிறது — நிலைமை மேம்படும் காலம். "
              f"புதிய வாய்ப்புகளுக்கு தயாராகுங்கள்.")
        en = (f"{incoming_lord} dasha beginning — conditions improve significantly. "
              f"Prepare for new opportunities.")
    else:
        ta = f"{incoming_lord} தசை தொடங்குகிறது — {_PLANET_DOMAIN[incoming_lord][0]} தீவிரமாகும்."
        en = f"{incoming_lord} dasha begins — {_PLANET_DOMAIN[incoming_lord][1]} themes strengthen."

    return {"transition_date": transition_date.isoformat(), "note_ta": ta, "note_en": en}
```

Add `transition_note` field to `DashaPeriod` output (nullable, only populated at
Mahadasha boundary points in the timeline).

---

### BODY — Panchangam birth signature (Phase 1 gap)

The methodology requires noting Panchangam at birth as a characterological
foundation (not just for muhurta). Add this to the chart response.

Add to `app/services/chart_service.py` inside `_chart_response_from_profile()`:

```python
# Compute birth Panchangam and attach to chart response
from app.calculations.panchangam import calculate_daily_panchangam

birth_panchangam = calculate_daily_panchangam(
    date_local=birth_profile.birth_date_local,
    timezone_name=birth_profile.birth_timezone,
    latitude=float(birth_profile.birth_latitude),
    longitude=float(birth_profile.birth_longitude),
)

birth_panchangam_signature = {
    "vaaram":       birth_panchangam.weekday,
    "vaaram_lord":  birth_panchangam.weekday_lord,
    "tithi":        birth_panchangam.tithi_name,
    "tithi_paksha": birth_panchangam.tithi_paksha,
    "nakshatra":    birth_panchangam.nakshatra_name,
    "nakshatra_pada": birth_panchangam.nakshatra_pada,
    "yogam":        birth_panchangam.yoga_name,
    "karanam":      birth_panchangam.karana_name,
    "is_vishti_karanam": birth_panchangam.karana_name == "Vishti",
    "gana":         _nakshatra_gana(birth_panchangam.nakshatra_number),
    "nadi":         _nakshatra_nadi(birth_panchangam.nakshatra_number),
}
```

Add `_nakshatra_gana()` and `_nakshatra_nadi()` helpers:

```python
_NAKSHATRA_GANA = {
    # Deva = 1, Manushya = 2, Rakshasa = 3
    1:"Deva", 2:"Manushya", 3:"Deva", 4:"Deva", 5:"Manushya", 6:"Manushya",
    7:"Deva", 8:"Deva", 9:"Rakshasa", 10:"Rakshasa", 11:"Manushya", 12:"Deva",
    13:"Manushya", 14:"Manushya", 15:"Manushya", 16:"Deva", 17:"Deva",
    18:"Manushya", 19:"Rakshasa", 20:"Deva", 21:"Rakshasa", 22:"Manushya",
    23:"Deva", 24:"Deva", 25:"Rakshasa", 26:"Rakshasa", 27:"Deva",
}

_NAKSHATRA_NADI = {
    # Aadhi=1, Madhya=2, Anthya=3 — each repeats in groups of 9
    **{n: ("Aadhi" if (n-1)%9 < 3 else "Madhya" if (n-1)%9 < 6 else "Anthya")
       for n in range(1, 28)}
}

def _nakshatra_gana(nakshatra_number: int) -> str:
    return _NAKSHATRA_GANA.get(nakshatra_number, "Deva")

def _nakshatra_nadi(nakshatra_number: int) -> str:
    return _NAKSHATRA_NADI.get(nakshatra_number, "Aadhi")
```

Add `birth_panchangam_signature: dict` field to `ChartCalculateResponseData`.

---

### BODY — Porutham Nadi Dosha enforcement

The methodology calls Nadi Dosha a critical marriage concern (same Nadi = health
of children affected). The existing `porutham.py` does not check this.

Add to `app/calculations/porutham.py`:

```python
def check_nadi_dosha(
    boy_nakshatra: int,
    girl_nakshatra: int,
) -> dict:
    """
    Nadi Dosha: same Nadi between partners.
    Cancellations:
      - Different rasi lords (Graha Maitri rules)
      - Different rasi (even if same Nadi)
      - One partner's nakshatra is Abhijit
    """
    boy_nadi  = _NAKSHATRA_NADI[boy_nakshatra]
    girl_nadi = _NAKSHATRA_NADI[girl_nakshatra]
    has_dosha = (boy_nadi == girl_nadi)

    cancellations = []
    if boy_nakshatra == girl_nakshatra:
        cancellations = []           # same nakshatra = no cancellation possible
    elif has_dosha:
        if _NAK_RASI[boy_nakshatra] != _NAK_RASI[girl_nakshatra]:
            cancellations.append("Different rasi — Nadi Dosha partially mitigated")

    return {
        "boy_nadi":     boy_nadi,
        "girl_nadi":    girl_nadi,
        "has_nadi_dosha": has_dosha and not cancellations,
        "cancellations": cancellations,
        "severity": "SEVERE" if (has_dosha and not cancellations) else
                    "MILD"   if (has_dosha and cancellations) else "NONE",
        "note_ta": (
            "நாடி தோஷம் உள்ளது — பிள்ளைகளுக்கு உடல் பாதிப்பு வரலாம். "
            "குரு பலம் மற்றும் ஜோதிட ஆலோசனை அவசியம்."
        ) if has_dosha else "நாடி தோஷம் இல்லை.",
        "note_en": (
            "Nadi Dosha present — may affect health of children. "
            "Seek astrological remediation before proceeding."
        ) if has_dosha else "No Nadi Dosha.",
    }
```

Add `nadi_dosha` field to `PorutthamResult` and call `check_nadi_dosha()` inside
`compute_porutham()`.

---

### UPDATED WORK ITEM INDEX (add W19)

| ID | Title | Phase | Priority |
|---|---|---|---|
| W01 | Bhava Chalit chart | P1 | Critical |
| W02 | Divisional charts D2–D60 | P1, P4 | Critical |
| W03 | Past-event validation gate | P1 | High |
| W04 | Chesta Bala + Yuddha Bala | P2 | High |
| W05 | Classical Baladi Avastha | P2 | Medium |
| W06 | Nakshatra dispositor chain + Pushkara | P2 | High |
| W07 | Expand yoga library | P2 | High |
| W08 | Missing doshams: Kalathra, Putra, Badhaka | P2 | High |
| W09 | Wire Ashtakavarga into scoring | P4 | High |
| W10 | Divisional chart confirmation layer L4 | P4 | Critical |
| W11 | Double transit scoring | P4, P6 | High |
| W12 | Planetary maturation ages | P4, P6 | High |
| W13 | Life areas: 6 new areas | P5 | High |
| W14 | Varshaphala / Tajaka integration | P6 | High |
| W15 | Formal remedy catalog engine | P7 | High |
| W16 | Gemstone prescription rules | P7 | High |
| W17 | Communication framing: duration + action | P8 | Medium |
| W18 | Scoring framework unification | P4 | Critical |
| W19 | Prasna (Horary) chart | P1, P6 | High |
| W20 | Birth Panchangam signature on chart | P1 | Medium |
| W21 | Nadi Dosha in Porutham | P5 | High |
| W22 | Dasha transition notes | P6, P8 | Medium |
| W23 | Age-phase routing enforcement | P3, P5 | Medium |
| W24 | Question routing table (_AREA_ROUTING) | P3, P4 | Medium |
| W25 | Maraka safety guard in communication | P8 | High |
