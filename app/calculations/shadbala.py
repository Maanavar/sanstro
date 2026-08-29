"""Full classical Shadbala engine (six-fold graha strength) — the spec's own
§8 "Full Shadbala Engine Contract" made concrete.

This is an ADDITIVE, advanced/experimental module. It does NOT replace
`chart_strength.py`'s product strength score (per the Depth Expansion Plan's
guiding principle #5 and spec §7.6). Output is in classical **Virupas**
(a.k.a. Shashtiamsas; 60 Virupa = 1 Rupa), converted to Rupas and compared
against the spec §8 minimum-required-Rupas table to yield a pass/fail
"is this planet classically strong" verdict distinct from the 0-100 score.

Citation policy (Depth Expansion Plan guiding principle #1): the spec only
fixes the Dig Bala approximation (§8.1), the Rupa conversion, and the
required-Rupas table. Every other sub-formula below is the classical BPHS /
B.V. Raman ("Graha and Bhava Balas") method, cited inline. Where a classical
sub-component needs an input this engine does not have (Abda/Masa year/month
lords via ahargana; Yuddha Bala disc diameters), it is DELIBERATELY OMITTED
and documented rather than guessed — the same precedent as Jeevan/Nethiram
being left unimplemented rather than shipped wrong (see
feedback_astrology_calc_accuracy). Those omissions mean the total is a
*floor* on classical Shadbala, which is why this ships behind an
experimental label pending Jagannatha Hora cross-validation (plan §2
validation note).

Shadbala is defined for the seven grahas only (Sun..Saturn); Rahu/Ketu have
no classical Shadbala and are excluded.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

from app.calculations.aspects import aspect_strength, effective_natural_class
from app.calculations.astro import (
    house_from_reference,
    navamsa_rasi_from_degree,
    rasi_from_degree,
)
from app.calculations.chart_strength import (
    _NATURAL_ENEMIES,
    _NATURAL_FRIENDS,
    MOOLATRIKONA_ZONE,
    OWN_SIGN_RASI,
    SIGN_LORD,
)
from app.calculations.divisional_charts import (
    compute_d2,
    compute_d3,
    compute_d7,
    compute_d12,
    compute_d30,
)

# The seven grahas that have a classical Shadbala. Rahu/Ketu excluded.
SHADBALA_GRAHAS: tuple[str, ...] = (
    "SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN",
)

VIRUPA_PER_RUPA = 60.0

# Spec §8: minimum required Rupas for a planet to be classically "strong".
REQUIRED_RUPAS: dict[str, float] = {
    "SUN": 6.5, "MOON": 6.0, "MARS": 5.0, "MERCURY": 7.0,
    "JUPITER": 6.5, "VENUS": 5.5, "SATURN": 5.0,
}

# Naisargika (natural) Bala in Virupas. BPHS: fixed per-planet natural
# strength, Sun strongest → Saturn weakest, in steps of 60/7. These are the
# same ratios already encoded in chart_strength.NAISARGIKA_BALA, rescaled to
# the classical 0-60 Virupa range.
NAISARGIKA_VIRUPA: dict[str, float] = {
    "SUN": 60.0,
    "MOON": 51.43,
    "VENUS": 42.86,
    "JUPITER": 34.29,
    "MERCURY": 25.71,
    "MARS": 17.14,
    "SATURN": 8.57,
}

# Deep-exaltation longitudes (absolute, 0-360). BPHS: the exact degree of
# highest exaltation; deep debilitation is the point 180° opposite. Uchcha
# Bala is measured as distance from the deep-debilitation point.
DEEP_EXALTATION_LON: dict[str, float] = {
    "SUN": 10.0,        # 10° Aries
    "MOON": 33.0,       # 3° Taurus
    "MARS": 298.0,      # 28° Capricorn
    "MERCURY": 165.0,   # 15° Virgo
    "JUPITER": 95.0,    # 5° Cancer
    "VENUS": 357.0,     # 27° Pisces
    "SATURN": 200.0,    # 20° Libra
}

# Natural benefics / malefics used by Paksha Bala and Drik Bala. Classical
# grouping; Moon and Mercury's conditional benefic-nature is simplified to
# "natural benefic" here (documented simplification).
_NAT_BENEFICS: frozenset[str] = frozenset({"MOON", "MERCURY", "JUPITER", "VENUS"})
_NAT_MALEFICS: frozenset[str] = frozenset({"SUN", "MARS", "SATURN"})

# Mean geocentric daily motion (deg/day), used by the Chesta Bala speed
# approximation. Sun/Moon do not use this (see _chesta_bala).
_MEAN_DAILY_SPEED: dict[str, float] = {
    "MARS": 0.524,
    "MERCURY": 1.383,
    "JUPITER": 0.083,
    "VENUS": 1.602,
    "SATURN": 0.034,
}

# Weekday (0=Sunday .. 6=Saturday) → ruling graha, for Vara Bala and as the
# sunrise hora lord anchor.
_WEEKDAY_LORD: dict[int, str] = {
    0: "SUN", 1: "MOON", 2: "MARS", 3: "MERCURY",
    4: "JUPITER", 5: "VENUS", 6: "SATURN",
}

# Chaldean order of the planetary-hour (hora) sequence.
_CHALDEAN_ORDER: tuple[str, ...] = (
    "SATURN", "JUPITER", "MARS", "SUN", "VENUS", "MERCURY", "MOON",
)


@dataclass(frozen=True, slots=True)
class PlanetInput:
    """Per-planet astronomical inputs for Shadbala."""

    longitude: float                 # sidereal absolute longitude, 0-360
    is_retrograde: bool
    speed_deg_per_day: float
    declination: float | None = None  # signed degrees (+ north); None → Ayana neutral


@dataclass(frozen=True, slots=True)
class ShadbalaContext:
    """Chart-level context shared across planets."""

    asc_longitude: float              # sidereal ascendant longitude, 0-360
    mc_longitude: float               # sidereal midheaven longitude, 0-360
    weekday: int                      # 0=Sunday .. 6=Saturday (of birth date)
    birth_clock_hours: float | None = None   # local clock time [0,24); None if unknown
    sunrise_hours: float | None = None        # local clock hours of sunrise
    sunset_hours: float | None = None         # local clock hours of sunset


@dataclass(frozen=True, slots=True)
class PlanetShadbala:
    graha: str
    sthana: float
    dig: float
    kala: float
    chesta: float
    naisargika: float
    drik: float
    total_virupa: float
    rupas: float
    required_rupas: float
    strength_ratio: float
    is_strong: bool
    # Sub-component breakdown for transparency / debugging / UI drill-down.
    sthana_components: dict[str, float] = field(default_factory=dict)
    kala_components: dict[str, float] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Angular helpers
# ---------------------------------------------------------------------------

def _angular_sep(a: float, b: float) -> float:
    """Smallest separation between two longitudes, 0-180 degrees."""
    diff = abs((a - b) % 360.0)
    return min(diff, 360.0 - diff)


# ---------------------------------------------------------------------------
# Compound (five-fold / Panchadha) planetary relationship — needed by
# Saptavargaja Bala. BPHS: combine the permanent (natural) relationship with
# the temporary (tatkalika) relationship. Temporary friends are planets in
# houses 2,3,4,10,11,12 from each other; the rest are temporary enemies.
#   natural friend + temp friend  = great friend (Adhimitra)
#   natural friend + temp enemy    = neutral (Sama)
#   natural neutral + temp friend  = friend (Mitra)
#   natural neutral + temp enemy    = enemy (Shatru)
#   natural enemy  + temp friend   = neutral (Sama)
#   natural enemy  + temp enemy     = great enemy (Adhishatru)
# ---------------------------------------------------------------------------

_GREAT_FRIEND, _FRIEND, _NEUTRAL, _ENEMY, _GREAT_ENEMY = (
    "GREAT_FRIEND", "FRIEND", "NEUTRAL", "ENEMY", "GREAT_ENEMY",
)

# Saptavargaja Virupa per compound-relationship grade (B.V. Raman).
_SAPTAVARGAJA_POINTS: dict[str, float] = {
    "MOOLATRIKONA": 45.0,
    "OWN": 30.0,
    _GREAT_FRIEND: 22.5,
    _FRIEND: 15.0,
    _NEUTRAL: 7.5,
    _ENEMY: 3.75,
    _GREAT_ENEMY: 1.875,
}


def _natural_relation(planet: str, other: str) -> str:
    if other in _NATURAL_FRIENDS.get(planet, frozenset()):
        return _FRIEND
    if other in _NATURAL_ENEMIES.get(planet, frozenset()):
        return _ENEMY
    return _NEUTRAL


def _temporal_relation(planet_rasi: int, other_rasi: int) -> str:
    house = house_from_reference(planet_rasi, other_rasi)
    return _FRIEND if house in {2, 3, 4, 10, 11, 12} else _ENEMY


def _compound_relation(planet: str, other: str, rasi_map: dict[str, int]) -> str:
    nat = _natural_relation(planet, other)
    temp = _temporal_relation(rasi_map[planet], rasi_map[other])
    if nat == _FRIEND and temp == _FRIEND:
        return _GREAT_FRIEND
    if nat == _FRIEND and temp == _ENEMY:
        return _NEUTRAL
    if nat == _NEUTRAL and temp == _FRIEND:
        return _FRIEND
    if nat == _NEUTRAL and temp == _ENEMY:
        return _ENEMY
    if nat == _ENEMY and temp == _FRIEND:
        return _NEUTRAL
    return _GREAT_ENEMY  # natural enemy + temporal enemy


# ---------------------------------------------------------------------------
# Sthana Bala (positional strength) — 5 sub-components.
# ---------------------------------------------------------------------------

def _uchcha_bala(planet: str, longitude: float) -> float:
    """Exaltation strength: distance from the deep-debilitation point / 3.
    BPHS — 0 at deep debilitation, 60 at deep exaltation."""
    deep_deb = (DEEP_EXALTATION_LON[planet] + 180.0) % 360.0
    return _angular_sep(longitude, deep_deb) / 3.0


def _saptavargaja_bala(
    planet: str,
    varga_rasis: dict[str, int],
    longitude: float,
    rasi_map: dict[str, int],
) -> float:
    """Sum of dignity points across the 7 Saptavarga charts (D1, D2, D3, D7,
    D9, D12, D30). BPHS/B.V. Raman: in each varga grade the planet by its
    dignity in that varga sign — Moolatrikona 45 (D1 only, by degree), own
    sign 30, else by the compound relationship toward the varga-sign lord."""
    total = 0.0
    for varga_code, rasi in varga_rasis.items():
        # Moolatrikona only assessable in D1 (needs the actual degree).
        if varga_code == "D1" and planet in MOOLATRIKONA_ZONE:
            mt_rasi, mt_start, mt_end = MOOLATRIKONA_ZONE[planet]
            deg_in_sign = longitude % 30.0
            if rasi == mt_rasi and mt_start <= deg_in_sign < mt_end:
                total += _SAPTAVARGAJA_POINTS["MOOLATRIKONA"]
                continue
        if rasi in OWN_SIGN_RASI.get(planet, frozenset()):
            total += _SAPTAVARGAJA_POINTS["OWN"]
            continue
        lord = SIGN_LORD[rasi]
        if lord == planet:  # own sign already caught above; guard anyway
            total += _SAPTAVARGAJA_POINTS["OWN"]
            continue
        total += _SAPTAVARGAJA_POINTS[_compound_relation(planet, lord, rasi_map)]
    return total


def _oja_yugma_bala(planet: str, rasi: int, d9_rasi: int) -> float:
    """Odd/even sign & navamsa strength. BPHS: Moon and Venus gain 15 Virupa
    for occupying an even (yugma) rasi and 15 for an even navamsa; the other
    five planets gain the same for odd (oja) rasi/navamsa. Max 30."""
    wants_even = planet in {"MOON", "VENUS"}
    score = 0.0
    if (rasi % 2 == 0) == wants_even:
        score += 15.0
    if (d9_rasi % 2 == 0) == wants_even:
        score += 15.0
    return score


def _kendradi_bala(house_from_lagna: int) -> float:
    """Angular-house strength. BPHS: kendra (1,4,7,10)=60, panapara
    (2,5,8,11)=30, apoklima (3,6,9,12)=15."""
    if house_from_lagna in {1, 4, 7, 10}:
        return 60.0
    if house_from_lagna in {2, 5, 8, 11}:
        return 30.0
    return 15.0


def _drekkana_bala(planet: str, longitude: float) -> float:
    """Decanate strength, max 15. BPHS: male planets (Sun, Mars, Jupiter)
    gain 15 in the 1st drekkana (0-10°); neutral (Mercury, Saturn) in the
    2nd (10-20°); female (Moon, Venus) in the 3rd (20-30°)."""
    deg = longitude % 30.0
    drekkana = min(int(deg // 10.0), 2)  # 0,1,2
    male = {"SUN", "MARS", "JUPITER"}
    female = {"MOON", "VENUS"}
    if planet in male and drekkana == 0:
        return 15.0
    if planet in female and drekkana == 2:
        return 15.0
    if planet in {"MERCURY", "SATURN"} and drekkana == 1:
        return 15.0
    return 0.0


# ---------------------------------------------------------------------------
# Dig Bala (directional strength) — spec §8.1.
# ---------------------------------------------------------------------------

def _dig_bala(planet: str, longitude: float, asc: float, mc: float) -> float:
    """Directional strength per spec §8.1: dig = (180 - sep)/3 where sep is
    the angular distance from the planet's peak direction. Peak points:
    Jupiter/Mercury → Ascendant (East), Sun/Mars → MC (South), Saturn →
    Descendant (West), Moon/Venus → IC (North)."""
    east = asc
    south = mc
    west = (asc + 180.0) % 360.0
    north = (mc + 180.0) % 360.0
    peak = {
        "JUPITER": east, "MERCURY": east,
        "SUN": south, "MARS": south,
        "SATURN": west,
        "MOON": north, "VENUS": north,
    }[planet]
    return max(0.0, (180.0 - _angular_sep(longitude, peak)) / 3.0)


# ---------------------------------------------------------------------------
# Kala Bala (temporal strength) — sub-components below. Abda (year-lord) and
# Masa (month-lord) Bala are DELIBERATELY OMITTED: they require the ahargana
# year/month lord this engine does not compute, and are documented here
# rather than guessed. Yuddha Bala (planetary-war correction) is likewise not
# folded into the total (needs disc diameters); war participants are reported
# separately via detect_planetary_wars in compute_shadbala.
# ---------------------------------------------------------------------------

def _nathonnatha_bala(planet: str, ctx: ShadbalaContext) -> float:
    """Diurnal/nocturnal strength. BPHS: diurnal planets (Sun, Jupiter,
    Venus) peak at noon; nocturnal (Moon, Mars, Saturn) peak at midnight;
    Mercury always 60. Measured from local midnight/noon derived from
    sunrise/sunset. Returns 30 (neutral) if birth clock time is unknown."""
    if planet == "MERCURY":
        return 60.0
    if ctx.birth_clock_hours is None or ctx.sunrise_hours is None or ctx.sunset_hours is None:
        return 30.0
    noon = (ctx.sunrise_hours + ctx.sunset_hours) / 2.0
    midnight = (noon - 12.0) % 24.0
    raw = abs(ctx.birth_clock_hours - midnight)
    hours_from_midnight = min(raw, 24.0 - raw)  # 0 at midnight, 12 at noon
    day_strength = hours_from_midnight / 12.0 * 60.0
    night_strength = (12.0 - hours_from_midnight) / 12.0 * 60.0
    if planet in {"SUN", "JUPITER", "VENUS"}:
        return day_strength
    return night_strength  # MOON, MARS, SATURN


def _paksha_bala(planet: str, sun_lon: float, moon_lon: float) -> float:
    """Lunar-phase strength. BPHS: benefics gain with the waxing Moon,
    malefics with the waning Moon; measured by Sun-Moon elongation. The
    Moon's own Paksha Bala is doubled (classical special rule).

    This is a fixed classical component formula, not the product-level
    contextual natural-class classifier used for predictive benefic/malefic
    effects below.
    """
    elong = _angular_sep(sun_lon, moon_lon)  # 0-180
    if planet in _NAT_BENEFICS:
        bala = elong / 3.0
    else:
        bala = (180.0 - elong) / 3.0
    if planet == "MOON":
        bala *= 2.0  # BPHS: Moon's Paksha Bala is doubled
    return bala


def _tribhaga_bala(planet: str, ctx: ShadbalaContext) -> float:
    """Tri-portion strength. B.V. Raman: the day (sunrise→sunset) splits into
    three parts ruled by Mercury/Sun/Saturn; the night into three ruled by
    Moon/Venus/Mars. Jupiter always gains 60. The lord of the birth portion
    gains 60. Returns 0 if birth clock time is unknown (except Jupiter)."""
    if planet == "JUPITER":
        return 60.0
    if ctx.birth_clock_hours is None or ctx.sunrise_hours is None or ctx.sunset_hours is None:
        return 0.0
    h, sr, ss = ctx.birth_clock_hours, ctx.sunrise_hours, ctx.sunset_hours
    is_day = sr <= h < ss
    if is_day:
        part = min(int((h - sr) / ((ss - sr) / 3.0)), 2)
        lords = ("MERCURY", "SUN", "SATURN")
    else:
        night_len = (24.0 - ss) + sr
        elapsed = (h - ss) % 24.0
        part = min(int(elapsed / (night_len / 3.0)), 2)
        lords = ("MOON", "VENUS", "MARS")
    return 60.0 if planet == lords[part] else 0.0


def _vara_bala(planet: str, ctx: ShadbalaContext) -> float:
    """Weekday-lord strength. BPHS: the lord of the birth weekday gains 45
    Virupa."""
    return 45.0 if planet == _WEEKDAY_LORD.get(ctx.weekday) else 0.0


def _hora_lord(ctx: ShadbalaContext) -> str | None:
    """Lord of the planetary hour (hora) at birth, via the Chaldean sequence
    starting from the weekday lord at sunrise. Uses unequal day/night horas
    (day and night each divided into 12). None if birth clock time unknown."""
    if ctx.birth_clock_hours is None or ctx.sunrise_hours is None or ctx.sunset_hours is None:
        return None
    h, sr, ss = ctx.birth_clock_hours, ctx.sunrise_hours, ctx.sunset_hours
    start_lord = _WEEKDAY_LORD.get(ctx.weekday)
    if start_lord is None:
        return None
    start_idx = _CHALDEAN_ORDER.index(start_lord)
    if sr <= h < ss:  # daytime
        hora_len = (ss - sr) / 12.0
        hora_index = int((h - sr) / hora_len)  # 0-11
    else:  # nighttime; horas 12-23 continue the Chaldean cycle from sunset
        night_len = (24.0 - ss) + sr
        elapsed = (h - ss) % 24.0
        hora_len = night_len / 12.0
        hora_index = 12 + int(elapsed / hora_len)  # 12-23
    return _CHALDEAN_ORDER[(start_idx + hora_index) % 7]


def _ayana_bala(planet: str, declination: float | None) -> float:
    """Declination (Ayana) strength. BPHS: computed from the planet's
    declination. Sun/Mars/Jupiter/Venus gain in north declination;
    Moon/Saturn in south; Mercury in either. ayana = (24 + eff_decl)/48 * 60,
    and the Sun's Ayana Bala is doubled. Returns 30 (neutral) if declination
    is unavailable."""
    if declination is None:
        return 30.0
    if planet in {"SUN", "MARS", "JUPITER", "VENUS"}:
        eff = declination
    elif planet in {"MOON", "SATURN"}:
        eff = -declination
    else:  # MERCURY — strong in either direction
        eff = abs(declination)
    bala = (24.0 + eff) / 48.0 * 60.0
    bala = max(0.0, min(60.0, bala))
    if planet == "SUN":
        bala *= 2.0  # BPHS: Sun's Ayana Bala is doubled
    return bala


# ---------------------------------------------------------------------------
# Chesta Bala (motional strength).
# ---------------------------------------------------------------------------

def _chesta_bala(planet: str, inp: PlanetInput, ayana: float, paksha: float) -> float:
    """Motional strength. BPHS special cases: the Sun's Chesta Bala equals
    its Ayana Bala and the Moon's equals its Paksha Bala. For the five star
    planets the full classical Chesta uses the seeghra-kendra (epicyclic
    anomaly); this engine uses a documented speed-vs-mean approximation of the
    eight-fold motional states (retrograde strongest, mean-speed medium,
    accelerated weakest) — a known simplification pending a full epicyclic
    implementation."""
    if planet == "SUN":
        return ayana
    if planet == "MOON":
        return paksha
    if inp.is_retrograde:
        return 60.0  # Vakra — strongest
    mean = _MEAN_DAILY_SPEED.get(planet)
    if mean is None:
        return 30.0
    ratio = abs(inp.speed_deg_per_day) / mean
    if ratio < 0.2:
        return 45.0   # near-stationary (Vikala/Manda)
    if ratio < 0.8:
        return 30.0   # slow direct (Manda)
    if ratio <= 1.2:
        return 20.0   # about mean speed (Sama)
    return 15.0       # accelerated (Chara/Atichara)


# ---------------------------------------------------------------------------
# Drik Bala (aspectual strength) — simplified from full Sputa Drishti.
# ---------------------------------------------------------------------------

def _drik_bala(planet: str, planet_rasi: int, rasi_map: dict[str, int]) -> float:
    """Aspectual strength. BPHS full Drik Bala uses graded Sputa Drishti
    (0-60 by exact angle) plus the special aspects; this engine uses the
    shared discrete special-aspect table (aspects.py) — a benefic aspect on
    the planet adds, a malefic aspect subtracts, from a 30 Virupa baseline
    (documented simplification of the full graded form)."""
    bala = 30.0
    for other, other_rasi in rasi_map.items():
        # Classical Shadbala is defined only for the seven grahas.  In
        # particular, do not let an incidental Rahu/Ketu entry turn into a new
        # Drik Bala aspector merely because it is naturally malefic elsewhere.
        if other == planet or other not in SHADBALA_GRAHAS:
            continue
        strength = aspect_strength(other, other_rasi, planet_rasi)
        if strength <= 0:
            continue
        if effective_natural_class(other, rasi_map) == "BENEFIC":
            bala += 10.0 * strength
        else:
            bala -= 10.0 * strength
    return max(0.0, min(60.0, bala))


# ---------------------------------------------------------------------------
# Top-level assembly.
# ---------------------------------------------------------------------------

def compute_shadbala(
    planets: dict[str, PlanetInput],
    ctx: ShadbalaContext,
) -> dict[str, PlanetShadbala]:
    """Compute full six-component Shadbala for the seven grahas.

    `planets` must contain at least the seven Shadbala grahas (extra entries,
    e.g. Rahu/Ketu, are ignored). Returns {graha: PlanetShadbala}.
    """
    # Rasi and navamsa maps (from the seven grahas' longitudes).
    rasi_map = {
        g: rasi_from_degree(planets[g].longitude)
        for g in SHADBALA_GRAHAS if g in planets
    }
    d9_map = {
        g: navamsa_rasi_from_degree(planets[g].longitude)
        for g in SHADBALA_GRAHAS if g in planets
    }
    asc_rasi = rasi_from_degree(ctx.asc_longitude)

    # Saptavarga rasi maps for all grahas, from longitudes.
    lon_map = {g: planets[g].longitude for g in SHADBALA_GRAHAS if g in planets}
    varga_maps: dict[str, dict[str, int]] = {
        "D1": rasi_map,
        "D2": compute_d2(lon_map),
        "D3": compute_d3(lon_map),
        "D7": compute_d7(lon_map),
        "D9": d9_map,
        "D12": compute_d12(lon_map),
        "D30": compute_d30(lon_map),
    }

    hora_lord = _hora_lord(ctx)

    results: dict[str, PlanetShadbala] = {}
    for graha in SHADBALA_GRAHAS:
        inp = planets.get(graha)
        if inp is None:
            continue
        rasi = rasi_map[graha]
        d9_rasi = d9_map[graha]
        house = house_from_reference(asc_rasi, rasi)

        # --- Sthana Bala ---
        uchcha = _uchcha_bala(graha, inp.longitude)
        this_varga = {code: m[graha] for code, m in varga_maps.items()}
        saptavargaja = _saptavargaja_bala(graha, this_varga, inp.longitude, rasi_map)
        oja_yugma = _oja_yugma_bala(graha, rasi, d9_rasi)
        kendradi = _kendradi_bala(house)
        drekkana = _drekkana_bala(graha, inp.longitude)
        sthana = uchcha + saptavargaja + oja_yugma + kendradi + drekkana

        # --- Dig Bala ---
        dig = _dig_bala(graha, inp.longitude, ctx.asc_longitude, ctx.mc_longitude)

        # --- Kala Bala ---
        nathonnatha = _nathonnatha_bala(graha, ctx)
        paksha = _paksha_bala(graha, planets["SUN"].longitude, planets["MOON"].longitude)
        tribhaga = _tribhaga_bala(graha, ctx)
        vara = _vara_bala(graha, ctx)
        hora = 60.0 if (hora_lord is not None and graha == hora_lord) else 0.0
        ayana = _ayana_bala(graha, inp.declination)
        kala = nathonnatha + paksha + tribhaga + vara + hora + ayana

        # --- Chesta / Naisargika / Drik ---
        chesta = _chesta_bala(graha, inp, ayana, paksha)
        naisargika = NAISARGIKA_VIRUPA[graha]
        drik = _drik_bala(graha, rasi, rasi_map)

        total = sthana + dig + kala + chesta + naisargika + drik
        rupas = total / VIRUPA_PER_RUPA
        required = REQUIRED_RUPAS[graha]
        ratio = rupas / required if required else 0.0

        results[graha] = PlanetShadbala(
            graha=graha,
            sthana=round(sthana, 2),
            dig=round(dig, 2),
            kala=round(kala, 2),
            chesta=round(chesta, 2),
            naisargika=round(naisargika, 2),
            drik=round(drik, 2),
            total_virupa=round(total, 2),
            rupas=round(rupas, 3),
            required_rupas=required,
            strength_ratio=round(ratio, 3),
            is_strong=rupas >= required,
            sthana_components={
                "uchcha": round(uchcha, 2),
                "saptavargaja": round(saptavargaja, 2),
                "oja_yugma": round(oja_yugma, 2),
                "kendradi": round(kendradi, 2),
                "drekkana": round(drekkana, 2),
            },
            kala_components={
                "nathonnatha": round(nathonnatha, 2),
                "paksha": round(paksha, 2),
                "tribhaga": round(tribhaga, 2),
                "vara": round(vara, 2),
                "hora": round(hora, 2),
                "ayana": round(ayana, 2),
            },
        )

    return results


def declination_from_longitude(sidereal_longitude: float, ayanamsa: float, obliquity: float) -> float:
    """Approximate declination from sidereal longitude, ignoring ecliptic
    latitude: δ = asin(sin(ε)·sin(λ_tropical)), λ_tropical = sidereal + ayanamsa.
    Small-latitude approximation, adequate for Ayana Bala (documented)."""
    tropical = math.radians((sidereal_longitude + ayanamsa) % 360.0)
    eps = math.radians(obliquity)
    return math.degrees(math.asin(math.sin(eps) * math.sin(tropical)))


def mean_obliquity(jd_ut: float) -> float:
    """Mean obliquity of the ecliptic (IAU 1980), degrees. Adequate for the
    Ayana Bala declination approximation across the supported date range."""
    t = (jd_ut - 2451545.0) / 36525.0
    seconds = 84381.448 - 46.8150 * t - 0.00059 * t * t + 0.001813 * t * t * t
    return seconds / 3600.0
