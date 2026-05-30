# Vinaadi AI — Astrology Depth Implementation Plan

## How to use this document

This document is a complete, ordered implementation guide for deepening the
classical Jyotish engine in the Vinaadi AI backend. Every section specifies:

- The exact file to edit
- The exact functions to add or modify
- The exact line numbers of stubs or gaps
- The exact variable names already in the codebase
- The acceptance test for each phase

Execute the phases in strict order. Each phase depends on the one before it.

---

## Repo root

```
C:\Users\senth\OneDrive\문서\GitHub\sanstro
```

The Korean folder name `문서` is mandatory. Never substitute `Documents` or
any variation.

## Shell convention

Use PowerShell. Chain commands with `;` not `&&`.

## Python encoding

Always run Python with:

```powershell
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
```

---

## Current state — what already exists

### Solid (do not rewrite)

| File | What works |
|------|-----------|
| `app/calculations/astro.py` | RASI_NAMES, navamsa_rasi_from_degree(), DST handling with fold |
| `app/calculations/ephemeris.py` | Swiss Ephemeris wrapper, complete |
| `app/calculations/panchangam.py` | Dynamic Rahu Kalam, full five-limb calculation |
| `app/calculations/yogas.py` | All 14 yoga types with classical logic |
| `app/calculations/transits.py` | Vedha table, Sani cycle, combustion, gandanta |
| `app/calculations/event_windows.py` | Marriage/career/finance windows with dasha scoring |

### Partial (this plan completes them)

| File | Gap |
|------|-----|
| `app/calculations/chart_strength.py` | Shadbala placeholder on line 231: `50 * 0.10` |
| `app/services/daily_guidance_service.py` | `PLANET_PERIOD_SCORE` is hardcoded, not computed from Shadbala |
| `app/calculations/yogas.py` | Neecha Bhanga rules 3-5 exist but D9 check (rule 4) only fires when `d9_rasi_map` is passed |
| `app/services/life_area_service.py` | Table-driven only; no karaka chain |

### Not started

- Full 6-component Shadbala
- Karaka chain scoring per life area
- Age filter per life area
- Ashtakavarga in transit scoring
- Yoga activation intensity by dasha
- `BirthProfile.deleted_at` soft-delete
- `panchangam_cache` TTL cleanup

---

## Phase 1 — Complete Shadbala

**Target file:** `app/calculations/chart_strength.py`

The current file (238 lines) computes dignity and avastha but has a hardcoded
Shadbala placeholder on line 231: `50 * 0.10`. Replace the entire scoring
formula with the 6 classical Shadbala components.

### 1.1 — Add Naisargika Bala constants

After the existing `SIGN_LORD` dict (currently ends around line 70), add:

```python
# Naisargika Bala — natural strength fixed hierarchy (Parashari).
# Values are in Shadbala Rupas (out of 1.0 natural unit).
NAISARGIKA_BALA: dict[str, float] = {
    "SATURN":  0.143,
    "JUPITER": 0.286,
    "MARS":    0.429,
    "SUN":     0.571,
    "VENUS":   0.714,
    "MERCURY": 0.857,
    "MOON":    1.000,
    "RAHU":    0.143,
    "KETU":    0.143,
}
```

### 1.2 — Add Dik Bala computation function

Add this function after `_avastha_multiplier()`:

```python
def _dik_bala_score(planet: str, house_from_lagna: int) -> float:
    """
    Directional strength (Dik Bala).
    Each planet has a peak house where it gains full directional strength (1.0).
    Opposite house gives 0.0. Interpolate linearly by angular distance.
    Returns 0.0 to 1.0.
    """
    DIK_PEAK: dict[str, int] = {
        "SUN": 10, "MARS": 10,
        "JUPITER": 1, "MERCURY": 1,
        "MOON": 4, "VENUS": 4,
        "SATURN": 7,
    }
    peak = DIK_PEAK.get(planet)
    if peak is None:
        return 0.5  # Rahu/Ketu — no classical Dik Bala
    dist = min(abs(house_from_lagna - peak), 12 - abs(house_from_lagna - peak))
    return max(0.0, 1.0 - dist / 6.0)
```

### 1.3 — Add Kala Bala computation function

Add this function after `_dik_bala_score()`:

```python
def _kala_bala_score(
    planet: str,
    is_daytime: bool,
    paksha_is_shukla: bool,
    is_vargottama: bool,
    d9_rasi: int | None,
) -> float:
    """
    Temporal strength (Kala Bala) — simplified to three sub-components:
    1. Diurnal/nocturnal affinity (Nathonnatha Bala)
    2. Paksha Bala (waxing/waning moon)
    3. Vargottama / D9 dignity bonus
    Returns 0.0 to 1.0.
    """
    # Diurnal planets gain strength in daytime; nocturnal at night.
    DIURNAL = frozenset({"SUN", "JUPITER", "SATURN"})
    NOCTURNAL = frozenset({"MOON", "MARS", "VENUS"})
    BOTH = frozenset({"MERCURY"})

    if planet in DIURNAL:
        natha = 1.0 if is_daytime else 0.4
    elif planet in NOCTURNAL:
        natha = 1.0 if not is_daytime else 0.4
    elif planet in BOTH:
        natha = 0.7  # Mercury is moderate in both
    else:
        natha = 0.5  # Rahu/Ketu

    # Paksha Bala: benefics gain in Shukla, malefics in Krishna.
    BENEFICS = frozenset({"MOON", "MERCURY", "VENUS", "JUPITER"})
    MALEFICS = frozenset({"SUN", "MARS", "SATURN", "RAHU", "KETU"})
    if planet in BENEFICS:
        paksha = 1.0 if paksha_is_shukla else 0.5
    elif planet in MALEFICS:
        paksha = 1.0 if not paksha_is_shukla else 0.5
    else:
        paksha = 0.7

    # D9 / Vargottama bonus.
    d9_bonus = 0.2 if (is_vargottama or (d9_rasi is not None and _has_d9_dignity(planet, d9_rasi))) else 0.0

    return min(1.0, (natha * 0.50 + paksha * 0.30) + d9_bonus * 0.20)
```

### 1.4 — Add Chesta Bala computation function

Add after `_kala_bala_score()`:

```python
def _chesta_bala_score(planet: str, is_retrograde: bool, speed_ratio: float | None) -> float:
    """
    Motional strength (Chesta Bala).
    speed_ratio: actual_daily_speed / mean_daily_speed. Pass None if unavailable.
    Retrograde = exceptional strength (0.9).
    Fast-moving direct = good (0.7). Slow-moving direct = weak (0.3).
    Sun and Moon have no Chesta Bala in classical sense — return 0.5.
    """
    if planet in {"SUN", "MOON", "RAHU", "KETU"}:
        return 0.5
    if is_retrograde:
        return 0.9
    if speed_ratio is None:
        return 0.5
    # Fast = ratio > 1.0 (moving faster than mean)
    if speed_ratio > 1.2:
        return 0.75
    if speed_ratio > 0.8:
        return 0.55
    return 0.35  # Very slow (vakri boundary approaching)
```

### 1.5 — Add Drik Bala computation function

Add after `_chesta_bala_score()`:

```python
def _drik_bala_score(benefic_aspect_count: int, malefic_aspect_count: int) -> float:
    """
    Aspectual strength (Drik Bala).
    Each full benefic aspect adds 0.15; each malefic aspect subtracts 0.15.
    Clamped to [0.0, 1.0]. Neutral baseline is 0.5.
    """
    return max(0.0, min(1.0, 0.5 + benefic_aspect_count * 0.15 - malefic_aspect_count * 0.15))
```

### 1.6 — Replace `compute_natal_planet_score()` with full Shadbala formula

Replace the entire function `compute_natal_planet_score()` starting at line 185.
Keep the same function signature but add two new parameters:

```python
def compute_natal_planet_score(
    planet: str,
    natal_rasi: int,
    natal_longitude: float,
    natal_lagna_rasi: int,
    sun_longitude: float,
    is_retrograde: bool,
    is_vargottama: bool = False,
    benefic_aspect_count: int = 0,
    malefic_aspect_count: int = 0,
    d9_rasi: int | None = None,
    # New parameters for full Shadbala:
    is_daytime: bool = True,
    paksha_is_shukla: bool = True,
    speed_ratio: float | None = None,
) -> int:
    """
    Full Shadbala-weighted natal planet strength score.
    Returns 10-95.

    Shadbala components (6):
    1. Sthana Bala  — positional/dignity strength          weight 0.30
    2. Dik Bala     — directional strength                 weight 0.15
    3. Kala Bala    — temporal strength                    weight 0.15
    4. Chesta Bala  — motional strength                    weight 0.15
    5. Naisargika   — natural strength (fixed hierarchy)   weight 0.10
    6. Drik Bala    — aspectual strength                   weight 0.15
    """
    house = house_from_reference(natal_lagna_rasi, natal_rasi)

    # 1. Sthana Bala: combines dignity (0-100) and avastha (0.25-1.0) and house
    dignity = _dignity_score(planet, natal_rasi, natal_longitude)
    avastha = _avastha_multiplier(natal_longitude)
    if house in {1, 4, 7, 10}:
        house_strength = 80
    elif house in {5, 9}:
        house_strength = 75
    elif house in {2, 11}:
        house_strength = 65
    elif house in {3, 6}:
        house_strength = 55
    elif house in {8, 12}:
        house_strength = 25
    else:
        house_strength = 50
    sthana = (dignity * avastha * 0.60 + house_strength * 0.40) / 100.0

    # 2. Dik Bala
    dik = _dik_bala_score(planet, house)

    # 3. Kala Bala
    kala = _kala_bala_score(planet, is_daytime, paksha_is_shukla, is_vargottama, d9_rasi)

    # 4. Chesta Bala
    chesta = _chesta_bala_score(planet, is_retrograde, speed_ratio)

    # 5. Naisargika Bala
    naisargika = NAISARGIKA_BALA.get(planet, 0.5)

    # 6. Drik Bala
    drik = _drik_bala_score(benefic_aspect_count, malefic_aspect_count)

    # Weighted sum → normalise to 0-100
    shadbala = (
        sthana    * 0.30
        + dik     * 0.15
        + kala    * 0.15
        + chesta  * 0.15
        + naisargika * 0.10
        + drik    * 0.15
    ) * 100.0

    # D9 dignity bonus when dignity is neutral (50)
    if d9_rasi is not None and dignity == 50 and _has_d9_dignity(planet, d9_rasi):
        shadbala += 5.0

    # Affliction penalties (applied after base score)
    if planet not in {"SUN", "RAHU", "KETU"}:
        if is_combust(planet, natal_longitude, sun_longitude, is_retrograde):
            shadbala -= 20.0

    deg_in_sign = natal_longitude % 30
    if deg_in_sign <= 1.0 or deg_in_sign >= 29.0:
        shadbala -= 8.0   # Sandhi

    if is_gandanta(natal_longitude):
        shadbala -= 10.0  # Gandanta

    if is_retrograde and planet not in {"SUN", "MOON", "RAHU", "KETU"}:
        shadbala += 8.0   # Retrograde bonus (already in Chesta, small extra)

    return max(10, min(95, round(shadbala)))
```

### 1.7 — Update `compute_strength_breakdown()` to return shadbala components

Replace the `compute_strength_breakdown()` return value to include numerical
scores alongside labels:

```python
def compute_strength_breakdown(
    planet: str,
    natal_rasi: int,
    natal_longitude: float,
    natal_lagna_rasi: int,
    is_retrograde: bool,
    is_vargottama: bool = False,
    d9_rasi: int | None = None,
    is_daytime: bool = True,
    paksha_is_shukla: bool = True,
    benefic_aspect_count: int = 0,
    malefic_aspect_count: int = 0,
) -> dict[str, str]:
    """Returns sthana/dik/kala/chesta/naisargika/drik labels (WEAK/NEUTRAL/STRONG)."""
    house = house_from_reference(natal_lagna_rasi, natal_rasi)
    dignity = _dignity_score(planet, natal_rasi, natal_longitude)

    sthana = "STRONG" if dignity >= 80 else ("NEUTRAL" if dignity >= 50 else "WEAK")

    dik_val = _dik_bala_score(planet, house)
    dik = "STRONG" if dik_val >= 0.7 else ("NEUTRAL" if dik_val >= 0.4 else "WEAK")

    kala_val = _kala_bala_score(planet, is_daytime, paksha_is_shukla, is_vargottama, d9_rasi)
    kala = "STRONG" if kala_val >= 0.7 else ("NEUTRAL" if kala_val >= 0.4 else "WEAK")

    chesta_val = _chesta_bala_score(planet, is_retrograde, None)
    chesta = "STRONG" if chesta_val >= 0.7 else ("NEUTRAL" if chesta_val >= 0.4 else "WEAK")

    naisargika_val = NAISARGIKA_BALA.get(planet, 0.5)
    naisargika = "STRONG" if naisargika_val >= 0.7 else ("NEUTRAL" if naisargika_val >= 0.4 else "WEAK")

    drik_val = _drik_bala_score(benefic_aspect_count, malefic_aspect_count)
    drik = "STRONG" if drik_val >= 0.7 else ("NEUTRAL" if drik_val >= 0.4 else "WEAK")

    return {
        "sthana": sthana,
        "dik": dik,
        "kala": kala,
        "chesta": chesta,
        "naisargika": naisargika,
        "drik": drik,
    }
```

### 1.8 — Update callers of `compute_natal_planet_score()`

Search the codebase for all calls to `compute_natal_planet_score()` and add
the new optional parameters `is_daytime`, `paksha_is_shukla`, `speed_ratio`
where the calling context has panchangam data available.

In `app/services/chart_service.py` (or wherever chart strength is computed),
pass:
- `is_daytime=True` as default if birth time is unknown
- `paksha_is_shukla=panchangam.tithi.paksha == "SHUKLA"` when panchangam is
  available at birth datetime

### 1.9 — Expose `strength_breakdown` in chart schema

In `app/schemas/chart.py`, the `PlanetPosition` schema already exists.
Add the `strength_breakdown` field:

```python
class PlanetPosition(BaseModel):
    # ... existing fields ...
    strength_score: int = 0
    strength_breakdown: dict[str, str] = Field(default_factory=dict)
    # strength_breakdown keys: sthana, dik, kala, chesta, naisargika, drik
    # strength_breakdown values: "STRONG" | "NEUTRAL" | "WEAK"
```

### 1.10 — Replace hardcoded `PLANET_PERIOD_SCORE`

In `app/services/daily_guidance_service.py`, the `PLANET_PERIOD_SCORE` dict
(lines 100-110) assigns fixed scores to dasha lords. Replace the lookup with a
computed score:

Create a new function in `daily_guidance_service.py`:

```python
def _dasha_lord_strength_score(
    planet: str,
    natal_planet_score: int,
    transit_house: int,
    is_retrograde_transit: bool = False,
) -> int:
    """
    Compute dasha lord support score from natal strength and current transit.
    Replaces the static PLANET_PERIOD_SCORE lookup.
    natal_planet_score: output of compute_natal_planet_score() for this planet.
    transit_house: house of transiting planet from natal Moon.
    Returns 0-100.
    """
    # Base from natal strength (40% weight)
    natal_component = natal_planet_score * 0.40

    # Transit house quality from TRANSIT_BASE_SCORE (40% weight)
    transit_base = TRANSIT_BASE_SCORE.get(planet, {}).get(transit_house, 50)
    transit_component = transit_base * 0.40

    # Retrograde transit bonus (20% weight) — retrograde planets intensify dasha
    retro_component = 20.0 if is_retrograde_transit else 10.0

    return max(10, min(95, round(natal_component + transit_component + retro_component)))
```

Keep `PLANET_PERIOD_SCORE` as a fallback when natal chart data is unavailable.

### Phase 1 acceptance test

Run:
```powershell
$env:JOTHIDAM_DATABASE_URL = "sqlite:///./pytest_local_test.db"
$env:PYTHONUTF8 = "1"
python -m pytest tests/ -k "strength or shadbala" -v
```

Expected: all existing strength tests pass. No regressions in yoga tests.

---

## Phase 2 — D9 Navamsa Everywhere

**Depends on:** Phase 1 complete.

The function `navamsa_rasi_from_degree()` exists in `app/calculations/astro.py`
line 193 and is complete. The function `navamsa_rasi_from_nakshatra_pada()` at
line 210 is also complete.

D9 is currently computed in chart calculation but the `d9_rasi_map` is not
always passed into yoga detection and strength scoring.

### 2.1 — Pass d9_rasi_map into strength scoring

In the chart calculation service (wherever `compute_natal_planet_score()` is
called), ensure `d9_rasi` is passed for every planet. The D9 rasi for each
planet is already computed via `navamsa_rasi_from_degree(planet.longitude)`.

### 2.2 — Pass d9_rasi_map into yoga detection

In `app/calculations/yogas.py`, `detect_neecha_bhanga()` already accepts
`d9_rasi_map` and `d9_lagna_rasi` parameters (lines 882-883). Verify that all
call sites in the chart service pass these values.

### 2.3 — D9 7th lord check in marriage assessment

In `app/calculations/yogas.py`, locate `detect_rahu_ketu_dosham()`. Add a D9
7th lord strength check as an additional cancellation condition:

```python
# D9 cancellation: if 7th lord in D9 is in own/exalt/kendra from D9 Lagna
if d9_rasi_map and d9_lagna_rasi:
    d9_7th_lord = SIGN_LORD[((d9_lagna_rasi + 5) % 12) + 1]
    if d9_7th_lord in d9_rasi_map:
        d9_7th_lord_house = house_from_reference(d9_lagna_rasi, d9_rasi_map[d9_7th_lord])
        if d9_7th_lord_house in KENDRA_HOUSES | TRIKONA_HOUSES:
            conditions.append("d9_seventh_lord_strong")
```

### 2.4 — Expose D9 Lagna in chart summary

In `app/schemas/chart.py`, `ChartSummaryData` has `lagnaRasi` and `moonRasi`.
Add `d9LagnaRasi` and `d9MoonRasi`:

```python
class ChartSummaryData(BaseModel):
    # ... existing fields ...
    d9LagnaRasi: str | None = None
    d9MoonRasi: str | None = None
```

### Phase 2 acceptance test

```powershell
python -m pytest tests/ -k "d9 or navamsa or neecha" -v
```

---

## Phase 3 — Life Area Karaka Chain

**Depends on:** Phase 1 and Phase 2 complete (karaka chain uses Shadbala scores).

**Target file:** `app/services/life_area_service.py` (or wherever
`get_life_area_predictions()` is implemented — check `app/api/life_areas.py`
for the import path).

### 3.1 — Define karaka chain constants

Add this to the life area service or a new file
`app/calculations/karaka_chains.py`:

```python
# Classical karaka (significator) chain per life area.
# Each area has: primary house, karaka planets, secondary houses.
# Used for both natal assessment and timing windows.

LIFE_AREA_KARAKA: dict[str, dict] = {
    "MARRIAGE": {
        "primary_house": 7,
        "karaka_planets": ["VENUS", "JUPITER"],  # Venus = Darakaraka, Jupiter = blesses 7th
        "secondary_houses": [2, 11],              # Family (2nd) and gains (11th)
        "age_min": 18,
        "age_max": 60,
    },
    "CHILDREN": {
        "primary_house": 5,
        "karaka_planets": ["JUPITER", "MOON"],
        "secondary_houses": [9, 11],
        "age_min": 18,
        "age_max": 52,
    },
    "CAREER": {
        "primary_house": 10,
        "karaka_planets": ["SUN", "MERCURY", "SATURN"],
        "secondary_houses": [6, 11],
        "age_min": 16,
        "age_max": 70,
    },
    "FINANCE": {
        "primary_house": 2,
        "karaka_planets": ["JUPITER", "VENUS"],
        "secondary_houses": [11, 5],
        "age_min": None,
        "age_max": None,
    },
    "PROPERTY": {
        "primary_house": 4,
        "karaka_planets": ["MOON", "MARS"],
        "secondary_houses": [12, 2],
        "age_min": 25,
        "age_max": None,
    },
    "FOREIGN_TRAVEL": {
        "primary_house": 12,
        "karaka_planets": ["RAHU", "SATURN"],
        "secondary_houses": [9, 3],
        "age_min": None,
        "age_max": None,
    },
    "HEALTH": {
        "primary_house": 1,
        "karaka_planets": ["SUN", "MOON"],
        "secondary_houses": [6, 8],
        "age_min": None,
        "age_max": None,
    },
    "SPIRITUAL": {
        "primary_house": 9,
        "karaka_planets": ["JUPITER", "KETU"],
        "secondary_houses": [12, 5],
        "age_min": None,
        "age_max": None,
    },
}
```

### 3.2 — Implement karaka chain scorer

Add this function to the life area service:

```python
def _karaka_chain_score(
    area_key: str,
    lagna_rasi: int,
    moon_rasi: int,
    planet_scores: dict[str, int],       # output of compute_natal_planet_score per planet
    planet_rasis: dict[str, int],        # natal rasi per planet
    current_mahadasha_lord: str,
    current_antardasha_lord: str,
    transit_planet_rasis: dict[str, int], # current transit rasis
    native_age: int,
) -> dict:
    """
    Compute a life area score using the classical karaka chain.
    Returns {
        score: int (0-100),
        primary_house_strength: str,
        karaka_status: str,
        dasha_activation: bool,
        transit_support: int,
        blocking_factors: list[str],
        supporting_factors: list[str],
    }
    """
    chain = LIFE_AREA_KARAKA.get(area_key)
    if chain is None:
        return {"score": 50, "primary_house_strength": "NEUTRAL",
                "karaka_status": "UNKNOWN", "dasha_activation": False,
                "transit_support": 50, "blocking_factors": [], "supporting_factors": []}

    # Age filter
    age_min = chain.get("age_min")
    age_max = chain.get("age_max")
    if age_min is not None and native_age < age_min:
        return {"score": 30, "primary_house_strength": "N/A",
                "karaka_status": "NOT_APPLICABLE_FOR_AGE",
                "dasha_activation": False, "transit_support": 30,
                "blocking_factors": ["too_young"], "supporting_factors": []}
    if age_max is not None and native_age > age_max:
        return {"score": 30, "primary_house_strength": "N/A",
                "karaka_status": "NOT_APPLICABLE_FOR_AGE",
                "dasha_activation": False, "transit_support": 30,
                "blocking_factors": ["age_limit"], "supporting_factors": []}

    primary_house = chain["primary_house"]
    karaka_planets = chain["karaka_planets"]
    secondary_houses = chain["secondary_houses"]
    supporting_factors: list[str] = []
    blocking_factors: list[str] = []

    # 1. House lord strength (primary house lord's natal score)
    primary_house_rasi = ((lagna_rasi + primary_house - 2) % 12) + 1
    from app.calculations.chart_strength import SIGN_LORD
    house_lord = SIGN_LORD.get(primary_house_rasi, "SUN")
    lord_score = planet_scores.get(house_lord, 50)
    if lord_score >= 65:
        supporting_factors.append(f"{house_lord}_lord_strong")
    elif lord_score <= 35:
        blocking_factors.append(f"{house_lord}_lord_weak")

    # 2. Karaka planet strength
    karaka_score_avg = 0
    for karaka in karaka_planets:
        ks = planet_scores.get(karaka, 50)
        karaka_score_avg += ks
        if ks >= 65:
            supporting_factors.append(f"{karaka}_karaka_strong")
        elif ks <= 35:
            blocking_factors.append(f"{karaka}_karaka_weak")
    karaka_score_avg = karaka_score_avg // max(1, len(karaka_planets))

    # 3. Dasha activation: primary house lord or karaka as dasha lord
    dasha_lords = {current_mahadasha_lord, current_antardasha_lord}
    dasha_activation = bool(dasha_lords & ({house_lord} | set(karaka_planets)))
    if dasha_activation:
        supporting_factors.append("dasha_activates_area")

    # 4. Transit support: key planets transiting supportive houses
    transit_support = 50
    for karaka in karaka_planets:
        t_rasi = transit_planet_rasis.get(karaka)
        if t_rasi is not None:
            t_house = house_from_reference(lagna_rasi, t_rasi)
            if t_house in {1, 5, 9, 11, primary_house}:
                transit_support += 8
                supporting_factors.append(f"{karaka}_transit_supportive")
            elif t_house in {6, 8, 12}:
                transit_support -= 8
                blocking_factors.append(f"{karaka}_transit_difficult")
    transit_support = max(20, min(80, transit_support))

    # 5. Composite score
    score = (
        lord_score * 0.35
        + karaka_score_avg * 0.30
        + transit_support * 0.20
        + (15 if dasha_activation else 0)
    )
    score = max(10, min(95, round(score)))

    # House lord placement label
    lord_house = house_from_reference(lagna_rasi, planet_rasis.get(house_lord, lagna_rasi))
    if lord_house in {1, 4, 7, 10, 5, 9}:
        primary_house_strength = "STRONG"
    elif lord_house in {6, 8, 12}:
        primary_house_strength = "WEAK"
    else:
        primary_house_strength = "NEUTRAL"

    karaka_status = "STRONG" if karaka_score_avg >= 65 else ("WEAK" if karaka_score_avg <= 35 else "MODERATE")

    return {
        "score": score,
        "primary_house_strength": primary_house_strength,
        "karaka_status": karaka_status,
        "dasha_activation": dasha_activation,
        "transit_support": transit_support,
        "blocking_factors": blocking_factors,
        "supporting_factors": supporting_factors,
    }
```

### 3.3 — Wire karaka chain into existing life area scoring

In the existing life area API handler, replace the table-driven score with
`_karaka_chain_score()`. Pass:
- `planet_scores`: dict of planet name → `compute_natal_planet_score()` result
- `planet_rasis`: dict of planet name → natal rasi
- `current_mahadasha_lord` and `current_antardasha_lord` from dasha timeline
- `transit_planet_rasis`: current transit rasi per planet
- `native_age`: computed from birth date

### 3.4 — Update life area schema to return explanation fields

In `app/schemas/life_areas.py` (or equivalent), add:

```python
class LifeAreaResult(BaseModel):
    area: str
    score: int
    label: str                          # STRONG / MODERATE / WEAK
    primary_house_strength: str
    karaka_status: str
    dasha_activation: bool
    transit_support: int
    supporting_factors: list[str]
    blocking_factors: list[str]
    text_en: str
    text_ta: str
```

### Phase 3 acceptance test

```powershell
python -m pytest tests/ -k "life_area" -v
```

Also manually verify: a chart with Jupiter in Kendra (strong karaka) scores
CHILDREN area higher than a chart with Jupiter in 8th.

---

## Phase 4 — Ashtakavarga Integration

**Depends on:** Phase 3 complete.

The file `app/calculations/ashtakavarga.py` already exists and exports
`compute_bhinnashtakavarga()` and `get_av_bindu()` (imported in
`daily_guidance_service.py` line 20).

### 4.1 — Use BAV score in transit house scoring

In `app/services/daily_guidance_service.py`, when computing transit planet
contribution to the daily score, add Ashtakavarga Bhinna check:

```python
def _transit_with_av_score(
    planet: str,
    transit_rasi: int,
    moon_rasi: int,
    bhinnashtakavarga: dict[str, list[int]],  # planet -> list of 12 bindus by rasi
) -> int:
    """
    Adjust transit house score by Ashtakavarga Bhinna bindus.
    bindus >= 4: supportive transit (add +8 to base score)
    bindus <= 2: difficult transit (add -8 to base score)
    bindus 3: neutral
    """
    base_house = house_from_reference(moon_rasi, transit_rasi)
    base_score = TRANSIT_BASE_SCORE.get(planet, {}).get(base_house, 50)

    # Get BAV bindus for this planet in this rasi (1-indexed, rasi 1=index 0)
    av_row = bhinnashtakavarga.get(planet, [])
    if len(av_row) == 12:
        bindus = av_row[transit_rasi - 1]
        if bindus >= 4:
            base_score += 8
        elif bindus <= 2:
            base_score -= 8

    return max(10, min(90, base_score))
```

Replace `TRANSIT_BASE_SCORE.get(planet, {}).get(house, 50)` calls with
`_transit_with_av_score()` throughout the daily guidance scoring loop.

### 4.2 — Use Sarvashtakavarga for house strength in life areas

In `_karaka_chain_score()` from Phase 3, pass the Sarvashtakavarga (total
bindus per house) and adjust the primary house strength score:

```python
# If primary house has Sarvashtakavarga bindus >= 28: strong
# If <= 22: weak
sarva = sarvashtakavarga.get(primary_house_rasi, 25)  # 25 = average
if sarva >= 28:
    supporting_factors.append("house_av_strong")
elif sarva <= 22:
    blocking_factors.append("house_av_weak")
```

### Phase 4 acceptance test

Run the full test suite. Verify daily scores change (slightly) when
Ashtakavarga is factored in vs not — they should not be identical.

---

## Phase 5 — Yoga Activation Intensity by Dasha

**Depends on:** Phase 1 and Phase 3 complete.

Currently, yogas are detected as present/absent (`is_present: bool`). This
phase adds an activation intensity score (0-100) based on the current dasha.

### 5.1 — Add yoga activation function

Create `app/calculations/yoga_activation.py`:

```python
"""
Yoga activation intensity scorer.
A yoga is strongest when its key planet is the current Mahadasha or
Antardasha lord. This module converts yoga presence into a timed intensity.
"""
from __future__ import annotations

# Key planets per yoga type. Yoga fires strongest when one of these
# is the current dasha lord.
YOGA_KEY_PLANETS: dict[str, list[str]] = {
    "GAJA_KESARI":              ["JUPITER", "MOON"],
    "RAJA_YOGA":                ["SUN", "MOON", "MARS", "JUPITER"],
    "DHANA_YOGA":               ["JUPITER", "VENUS", "MERCURY"],
    "NEECHA_BHANGA_RAJA_YOGA":  ["JUPITER"],   # Jupiter aspects cancel debilitation
    "KALASARPA":                ["RAHU", "KETU"],
    "PANCHA_MAHAPURUSHA_SUN":   ["SUN"],
    "PANCHA_MAHAPURUSHA_MOON":  ["MOON"],
    "PANCHA_MAHAPURUSHA_MARS":  ["MARS"],
    "PANCHA_MAHAPURUSHA_MERCURY": ["MERCURY"],
    "PANCHA_MAHAPURUSHA_JUPITER": ["JUPITER"],
    "PANCHA_MAHAPURUSHA_VENUS": ["VENUS"],
    "PANCHA_MAHAPURUSHA_SATURN": ["SATURN"],
    "BUDHA_ADITYA":             ["SUN", "MERCURY"],
    "VIPAREETHA_RAJA":          ["SATURN", "MARS", "JUPITER"],
    "PARIVARTANA":              [],   # depends on exchange planets — handled separately
    "CHANDRA_MANGALA":          ["MOON", "MARS"],
}


def yoga_activation_score(
    yoga_name: str,
    yoga_is_present: bool,
    yoga_strength: str,
    mahadasha_lord: str,
    antardasha_lord: str,
    planet_scores: dict[str, int],  # natal Shadbala scores from Phase 1
) -> int:
    """
    Returns 0-100 activation intensity for a yoga.
    0 = yoga absent or dormant.
    100 = yoga present and at peak dasha activation with strong key planet.
    """
    if not yoga_is_present:
        return 0

    key_planets = YOGA_KEY_PLANETS.get(yoga_name, [])
    dasha_lords = {mahadasha_lord, antardasha_lord}

    # Dasha activation check
    activated = bool(dasha_lords & set(key_planets))

    # Base from yoga strength
    strength_base = {"STRONG": 75, "MODERATE": 55, "PARTIAL": 40, "WEAK": 25}.get(yoga_strength, 50)

    if not activated:
        return round(strength_base * 0.45)  # Dormant — present but not triggered

    # Find strongest key planet in current dasha
    best_planet_score = max(
        (planet_scores.get(p, 50) for p in key_planets if p in dasha_lords),
        default=50,
    )

    # Weighted: strength_base (60%) + dasha planet quality (40%)
    intensity = strength_base * 0.60 + best_planet_score * 0.40
    return max(10, min(100, round(intensity)))
```

### 5.2 — Add activation score to yoga response schema

In `app/schemas/chart.py`, update `ChartYogaInsight`:

```python
class ChartYogaInsight(BaseModel):
    # ... existing fields ...
    activationScore: int = 0          # 0-100, from yoga_activation_score()
    isCurrentlyActive: bool = False   # True when dasha activates the yoga
```

### 5.3 — Wire activation score in chart response

When building the chart response (in `app/services/chart_service.py`), call
`yoga_activation_score()` for each detected yoga and populate the new fields.

### Phase 5 acceptance test

A chart in Jupiter Mahadasha should show Gaja Kesari `activationScore` > 70.
The same chart in Saturn Mahadasha should show Gaja Kesari `activationScore`
< 40 (present but dormant).

---

## Phase 6 — Dasha Depth (Pratyantar + Dignity Chain)

**Depends on:** Phase 1 complete.

### 6.1 — Replace static PLANET_PERIOD_SCORE with dynamic computation

In `app/services/daily_guidance_service.py` lines 100-110, the
`PLANET_PERIOD_SCORE` dict assigns fixed values. The function
`_dasha_lord_strength_score()` added in Phase 1.10 should now be called
everywhere `PLANET_PERIOD_SCORE[lord]` is used.

Search for: `PLANET_PERIOD_SCORE.get(` and `PLANET_PERIOD_SCORE[`
Replace each with the dynamic function call.

### 6.2 — Add Pratyantar-level interpretation

In `app/services/daily_guidance_service.py`, the dasha story currently
covers Mahadasha + Antardasha. Add Pratyantar interpretation when its
remaining duration is <= 90 days:

```python
def _pratyantar_narrative(
    pratyantar_lord: str,
    pratyantar_days_remaining: int,
    mahadasha_lord: str,
    antardasha_lord: str,
    planet_scores: dict[str, int],
    lang: str = "ta-en",
) -> dict[str, str] | None:
    """
    Returns a short narrative for the Pratyantar dasha if it expires within
    90 days. Returns None otherwise (too granular to narrate).
    """
    if pratyantar_days_remaining > 90:
        return None

    score = planet_scores.get(pratyantar_lord, 50)
    quality = "strong" if score >= 65 else ("challenging" if score <= 35 else "moderate")

    en = (
        f"{pratyantar_lord.capitalize()} Pratyantar ({pratyantar_days_remaining}d remaining) "
        f"brings a {quality} short-term influence within the "
        f"{antardasha_lord.capitalize()} Antardasha of {mahadasha_lord.capitalize()} Mahadasha."
    )
    ta = (
        f"{pratyantar_lord} பிரத்யந்தர தசை ({pratyantar_days_remaining} நாட்கள் மீதம்) — "
        f"{antardasha_lord} அந்தர தசையில் குறுகிய கால {quality} தாக்கம்."
    )
    return {"en": en, "ta": ta}
```

### Phase 6 acceptance test

```powershell
python -m pytest tests/ -k "dasha" -v
```

---

## Phase 7 — Surface Everything in the API

**Depends on:** Phases 1-6 complete.

### 7.1 — Chart response: expose all Shadbala fields

Ensure `GET /charts/{id}/summary` returns for each planet:
```json
{
  "graha": "JUPITER",
  "strengthScore": 78,
  "strengthBreakdown": {
    "sthana": "STRONG",
    "dik": "STRONG",
    "kala": "NEUTRAL",
    "chesta": "NEUTRAL",
    "naisargika": "STRONG",
    "drik": "NEUTRAL"
  }
}
```

### 7.2 — Life area response: expose explanation fields

Ensure `GET /life-areas` returns for each area:
```json
{
  "area": "MARRIAGE",
  "score": 72,
  "label": "STRONG",
  "primaryHouseStrength": "STRONG",
  "karakaStatus": "STRONG",
  "dashaActivation": true,
  "transitSupport": 68,
  "supportingFactors": ["VENUS_karaka_strong", "dasha_activates_area"],
  "blockingFactors": [],
  "text_en": "...",
  "text_ta": "..."
}
```

### 7.3 — Yoga response: expose activation score

Ensure `GET /charts/{id}/summary` yoga list includes:
```json
{
  "name": "GAJA_KESARI",
  "isPresent": true,
  "strength": "STRONG",
  "activationScore": 82,
  "isCurrentlyActive": true,
  "description_en": "...",
  "description_ta": "..."
}
```

### 7.4 — Fix remaining P2 bugs

#### BirthProfile soft-delete

In `app/models/birth_profile.py`, add:
```python
deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

Create migration:
```powershell
alembic revision --autogenerate -m "add_deleted_at_to_birth_profiles"
```

In all queries that fetch birth profiles, add:
```python
.where(BirthProfile.deleted_at.is_(None))
```

In the delete endpoint, do not `session.delete(profile)`. Instead:
```python
profile.deleted_at = datetime.now(UTC)
```

#### PanchangamCache TTL cleanup

In `app/models/panchangam_cache.py`, add:
```python
expires_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    nullable=False,
    server_default=text("NOW() + INTERVAL '90 days'"),
)
```

Add a cleanup function to the panchangam service:
```python
def purge_expired_panchangam_cache(session: Session) -> int:
    from datetime import UTC
    result = session.execute(
        delete(PanchangamCache).where(PanchangamCache.expires_at < datetime.now(UTC))
    )
    session.commit()
    return result.rowcount
```

Call `purge_expired_panchangam_cache()` from the daily background job or on
app startup.

Create migration:
```powershell
alembic revision --autogenerate -m "add_expires_at_to_panchangam_cache"
```

### Phase 7 acceptance test

```powershell
python -m pytest tests/ -v
```

All 233+ tests must pass. Then run a manual API test:

```powershell
curl http://localhost:8000/api/v1/charts/{chart_id}/summary
```

Verify the response includes `strengthBreakdown` per planet and
`activationScore` per yoga.

---

## Execution rules for the coding agent

1. **Never skip a phase.** Each phase feeds into the next.

2. **Never rewrite working code.** The yoga detection, ephemeris, and
   panchangam modules are complete. Do not touch them unless a phase
   explicitly says to.

3. **All Tamil strings must be UTF-8 encoded.** Never use escape sequences
   like `க`. Write Tamil characters directly. Save files as UTF-8
   without BOM. Example:
   - Correct: `"description_ta": "நீச கிரகத்தின் நிவர்த்தி"`
   - Wrong: `"description_ta": "நீச கிரகத்தின்"`

4. **Never run `alembic upgrade head` against `vinaadi_dev`** without first
   reviewing the migration file. Always test on `vinaadi_test` (port 5433)
   first.

5. **Run the acceptance test after every phase** before starting the next.

6. **Keep `PLANET_PERIOD_SCORE` as a fallback dict** even after Phase 6
   replaces it dynamically. Do not delete it — it is used when chart data
   is unavailable.

7. **`SIGN_LORDS` in `daily_guidance_service.py` is a local copy.** Use
   `from app.calculations.chart_strength import SIGN_LORD` instead wherever
   possible. Do not create a third copy.

8. **The `W` palette dict in `dashboard-calendar-tab.tsx`** uses CSS variable
   references. Do not hardcode hex colors in frontend components — use
   `var(--color-score-high)`, `var(--color-score-mid)`, `var(--color-score-low)`.

9. **All new Python files must start with** `from __future__ import annotations`.

10. **All Alembic migrations must implement `downgrade()`** — never leave it
    as `pass`.

---

## Summary of files changed per phase

| Phase | Files changed |
|-------|--------------|
| 1 | `app/calculations/chart_strength.py`, `app/services/daily_guidance_service.py`, `app/schemas/chart.py` |
| 2 | `app/calculations/yogas.py`, `app/services/chart_service.py`, `app/schemas/chart.py` |
| 3 | `app/calculations/karaka_chains.py` (new), `app/services/life_area_service.py`, `app/schemas/life_areas.py` |
| 4 | `app/services/daily_guidance_service.py`, `app/services/life_area_service.py` |
| 5 | `app/calculations/yoga_activation.py` (new), `app/services/chart_service.py`, `app/schemas/chart.py` |
| 6 | `app/services/daily_guidance_service.py` |
| 7 | `app/models/birth_profile.py`, `app/models/panchangam_cache.py`, migrations (2 new), API response builders |

---

## What this produces at the end

A chart response where every planet has a 6-component Shadbala score, every
yoga has a dasha-timed activation intensity, every life area has a classical
karaka chain explanation, and daily transit scores are weighted by
Ashtakavarga bindus — all grounded in the Thirukanitham (Tamil classical
Jyotish) tradition.
