# Vinaadi AI — Thirukanitham 98% Compliance Plan

**Goal:** Raise every phase score from current ~68% average to ≥98% against the
`thirukanitham-methodology.md` specification.

**How to use this document:**
Supply this file verbatim to any coding agent. Each work item includes the exact
file to create or edit, the exact existing symbols to extend, and precise
acceptance criteria. Work items are ordered by dependency — complete them top to
bottom. Never skip an item; each is a prerequisite for the ones that follow it.

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
