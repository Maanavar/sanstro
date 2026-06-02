"""
Product-level natal planet strength scorer.
Implements a practical six-component Shadbala blend for production use.
"""
from __future__ import annotations

from app.calculations.astro import house_from_reference
from app.calculations.transits import is_combust, is_gandanta

# Exaltation rasi (1-based)
EXALTATION_RASI: dict[str, int] = {
    "SUN": 1, "MOON": 2, "MARS": 10, "MERCURY": 6,
    "JUPITER": 4, "VENUS": 12, "SATURN": 7,
}

# Debilitation rasi (opposite of exaltation)
DEBILITATION_RASI: dict[str, int] = {
    "SUN": 7, "MOON": 8, "MARS": 4, "MERCURY": 12,
    "JUPITER": 10, "VENUS": 6, "SATURN": 1,
}

# Moolatrikona: (rasi, degree_start_in_sign, degree_end_in_sign)
MOOLATRIKONA_ZONE: dict[str, tuple[int, float, float]] = {
    "SUN": (5, 0.0, 20.0),
    "MOON": (2, 4.0, 30.0),
    "MARS": (1, 0.0, 12.0),
    "MERCURY": (6, 16.0, 20.0),
    "JUPITER": (9, 0.0, 10.0),
    "VENUS": (7, 0.0, 15.0),
    "SATURN": (11, 0.0, 20.0),
}

# Own-sign rasis per planet
OWN_SIGN_RASI: dict[str, frozenset[int]] = {
    "SUN": frozenset({5}),
    "MOON": frozenset({4}),
    "MARS": frozenset({1, 8}),
    "MERCURY": frozenset({3, 6}),
    "JUPITER": frozenset({9, 12}),
    "VENUS": frozenset({2, 7}),
    "SATURN": frozenset({10, 11}),
    "RAHU": frozenset(),
    "KETU": frozenset(),
}

# Natural friendship table
_NATURAL_FRIENDS: dict[str, frozenset[str]] = {
    "SUN": frozenset({"MOON", "MARS", "JUPITER"}),
    "MOON": frozenset({"SUN", "MERCURY"}),
    "MARS": frozenset({"SUN", "MOON", "JUPITER"}),
    "MERCURY": frozenset({"SUN", "VENUS"}),
    "JUPITER": frozenset({"SUN", "MOON", "MARS"}),
    "VENUS": frozenset({"MERCURY", "SATURN"}),
    "SATURN": frozenset({"MERCURY", "VENUS"}),
    "RAHU": frozenset({"VENUS", "SATURN"}),
    "KETU": frozenset({"MARS", "VENUS"}),
}
_NATURAL_ENEMIES: dict[str, frozenset[str]] = {
    "SUN": frozenset({"VENUS", "SATURN", "RAHU", "KETU"}),
    "MOON": frozenset({"RAHU", "KETU"}),
    "MARS": frozenset({"MERCURY", "RAHU"}),
    "MERCURY": frozenset({"MOON"}),
    "JUPITER": frozenset({"MERCURY", "VENUS", "RAHU", "KETU"}),
    "VENUS": frozenset({"SUN", "MOON", "RAHU", "KETU"}),
    "SATURN": frozenset({"SUN", "MOON", "MARS"}),
    "RAHU": frozenset({"SUN", "MOON", "MARS", "JUPITER"}),
    "KETU": frozenset({"SUN", "MOON", "JUPITER", "RAHU"}),
}

# Sign lords for friend/enemy of sign lord check
SIGN_LORD: dict[int, str] = {
    1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON", 5: "SUN", 6: "MERCURY",
    7: "VENUS", 8: "MARS", 9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER",
}

# Naisargika Bala natural hierarchy (0-1 scaled)
NAISARGIKA_BALA: dict[str, float] = {
    "SATURN": 0.143,
    "JUPITER": 0.286,
    "MARS": 0.429,
    "SUN": 0.571,
    "VENUS": 0.714,
    "MERCURY": 0.857,
    "MOON": 1.000,
    "RAHU": 0.143,
    "KETU": 0.143,
}


def _has_d9_dignity(planet: str, d9_rasi: int) -> bool:
    return (
        d9_rasi in OWN_SIGN_RASI.get(planet, frozenset())
        or d9_rasi == EXALTATION_RASI.get(planet)
    )


def _dignity_score(planet: str, natal_rasi: int, natal_longitude: float) -> int:
    """Returns dignity score per 9-level table."""
    if planet in DEBILITATION_RASI and natal_rasi == DEBILITATION_RASI[planet]:
        return 15

    if planet in EXALTATION_RASI and natal_rasi == EXALTATION_RASI[planet]:
        return 100

    if planet in MOOLATRIKONA_ZONE:
        mt_rasi, mt_start, mt_end = MOOLATRIKONA_ZONE[planet]
        deg_in_sign = natal_longitude % 30
        if natal_rasi == mt_rasi and mt_start <= deg_in_sign < mt_end:
            return 90

    if natal_rasi in OWN_SIGN_RASI.get(planet, frozenset()):
        return 80

    sign_lord = SIGN_LORD.get(natal_rasi)
    if sign_lord:
        if sign_lord in _NATURAL_FRIENDS.get(planet, frozenset()):
            return 60
        if sign_lord in _NATURAL_ENEMIES.get(planet, frozenset()):
            return 35

    return 50


_AVASTHA_MULTIPLIER_ODD = (0.50, 0.75, 1.00, 0.65, 0.25)
_AVASTHA_MULTIPLIER_EVEN = (0.25, 0.65, 1.00, 0.75, 0.50)


def _avastha_multiplier(natal_longitude: float, rasi: int) -> float:
    """Classical Baladi avastha multiplier with odd/even sign reversal."""
    deg = natal_longitude % 30.0
    zone = min(int(deg / 6.0), 4)
    is_odd = (rasi % 2 == 1)
    return _AVASTHA_MULTIPLIER_ODD[zone] if is_odd else _AVASTHA_MULTIPLIER_EVEN[zone]


def _dik_bala_score(planet: str, house_from_lagna: int) -> float:
    """Directional strength 0.0-1.0."""
    dik_peak: dict[str, int] = {
        "SUN": 10, "MARS": 10,
        "JUPITER": 1, "MERCURY": 1,
        "MOON": 4, "VENUS": 4,
        "SATURN": 7,
    }
    peak = dik_peak.get(planet)
    if peak is None:
        return 0.5
    dist = min(abs(house_from_lagna - peak), 12 - abs(house_from_lagna - peak))
    return max(0.0, 1.0 - dist / 6.0)


def _kala_bala_score(
    planet: str,
    is_daytime: bool,
    paksha_is_shukla: bool,
    is_vargottama: bool,
    d9_rasi: int | None,
) -> float:
    """Temporal strength 0.0-1.0."""
    diurnal = frozenset({"SUN", "JUPITER", "SATURN"})
    nocturnal = frozenset({"MOON", "MARS", "VENUS"})

    if planet in diurnal:
        natha = 1.0 if is_daytime else 0.4
    elif planet in nocturnal:
        natha = 1.0 if not is_daytime else 0.4
    elif planet == "MERCURY":
        natha = 0.7
    else:
        natha = 0.5

    benefics = frozenset({"MOON", "MERCURY", "VENUS", "JUPITER"})
    malefics = frozenset({"SUN", "MARS", "SATURN", "RAHU", "KETU"})
    if planet in benefics:
        paksha = 1.0 if paksha_is_shukla else 0.5
    elif planet in malefics:
        paksha = 1.0 if not paksha_is_shukla else 0.5
    else:
        paksha = 0.7

    d9_bonus = 0.2 if (is_vargottama or (d9_rasi is not None and _has_d9_dignity(planet, d9_rasi))) else 0.0
    return min(1.0, (natha * 0.50 + paksha * 0.30) + d9_bonus * 0.20)


def _chesta_bala_score(planet: str, is_retrograde: bool, speed_ratio: float | None) -> float:
    """Motional strength 0.0-1.0."""
    if planet in {"SUN", "MOON"}:
        return 0.5
    if planet in {"RAHU", "KETU"}:
        return 0.6
    if is_retrograde:
        return 1.0
    if speed_ratio is None:
        return 0.6
    if 0.8 <= speed_ratio <= 1.2:
        return 0.6
    if speed_ratio < 0.5:
        return 0.4
    if speed_ratio > 1.5:
        return 0.5
    return 0.55


def detect_planetary_wars(
    planet_longitudes: dict[str, float],
) -> dict[str, str]:
    """
    Returns {loser_planet: winner_planet}.
    War participants: non-luminaries, non-nodes within 1 degree.
    Loser: lower degree-within-sign.
    """
    participants = {
        p: lon
        for p, lon in planet_longitudes.items()
        if p not in {"SUN", "MOON", "RAHU", "KETU"}
    }
    wars: dict[str, str] = {}
    names = sorted(participants.keys())
    for i, p1 in enumerate(names):
        lon1 = participants[p1] % 360.0
        deg1 = lon1 % 30.0
        for p2 in names[i + 1:]:
            lon2 = participants[p2] % 360.0
            deg2 = lon2 % 30.0
            sep = abs(lon1 - lon2)
            sep = min(sep, 360.0 - sep)
            if sep > 1.0:
                continue
            if deg1 < deg2:
                loser, winner = p1, p2
            elif deg2 < deg1:
                loser, winner = p2, p1
            else:
                # Exact tie: skip assigning an artificial loser.
                continue
            wars[loser] = winner
    return wars


def _drik_bala_score(benefic_aspect_count: int, malefic_aspect_count: int) -> float:
    """Aspectual strength 0.0-1.0."""
    return max(0.0, min(1.0, 0.5 + benefic_aspect_count * 0.15 - malefic_aspect_count * 0.15))


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
    speed_ratio: float | None = None,
) -> dict[str, str]:
    """Returns sthana/dik/kala/chesta/naisargika/drik labels."""
    house = house_from_reference(natal_lagna_rasi, natal_rasi)
    dignity = _dignity_score(planet, natal_rasi, natal_longitude)

    sthana = "STRONG" if dignity >= 80 else ("NEUTRAL" if dignity >= 50 else "WEAK")

    dik_val = _dik_bala_score(planet, house)
    dik = "STRONG" if dik_val >= 0.7 else ("NEUTRAL" if dik_val >= 0.4 else "WEAK")

    kala_val = _kala_bala_score(planet, is_daytime, paksha_is_shukla, is_vargottama, d9_rasi)
    kala = "STRONG" if kala_val >= 0.7 else ("NEUTRAL" if kala_val >= 0.4 else "WEAK")

    chesta_val = _chesta_bala_score(planet, is_retrograde, speed_ratio)
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
    is_daytime: bool = True,
    paksha_is_shukla: bool = True,
    speed_ratio: float | None = None,
    planetary_wars: dict[str, str] | None = None,
) -> int:
    """
    Full Shadbala-weighted natal planet strength score.
    Returns 10-95.
    """
    house = house_from_reference(natal_lagna_rasi, natal_rasi)

    dignity = _dignity_score(planet, natal_rasi, natal_longitude)
    avastha = _avastha_multiplier(natal_longitude, natal_rasi)
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

    dik = _dik_bala_score(planet, house)
    kala = _kala_bala_score(planet, is_daytime, paksha_is_shukla, is_vargottama, d9_rasi)
    chesta = _chesta_bala_score(planet, is_retrograde, speed_ratio)
    naisargika = NAISARGIKA_BALA.get(planet, 0.5)
    drik = _drik_bala_score(benefic_aspect_count, malefic_aspect_count)

    shadbala = (
        sthana * 0.30
        + dik * 0.15
        + kala * 0.15
        + chesta * 0.15
        + naisargika * 0.10
        + drik * 0.15
    ) * 100.0

    if is_vargottama:
        shadbala += 4.0

    if d9_rasi is not None and dignity == 50 and _has_d9_dignity(planet, d9_rasi):
        shadbala += 5.0

    if planet not in {"SUN", "RAHU", "KETU"}:
        if is_combust(planet, natal_longitude, sun_longitude, is_retrograde):
            shadbala -= 20.0

    deg_in_sign = natal_longitude % 30
    if deg_in_sign <= 1.0 or deg_in_sign >= 29.0:
        shadbala -= 8.0

    if is_gandanta(natal_longitude):
        shadbala -= 10.0

    if is_retrograde and planet not in {"SUN", "MOON", "RAHU", "KETU"}:
        shadbala += 8.0

    if planetary_wars and planet in planetary_wars:
        shadbala -= 15.0

    return max(10, min(95, round(shadbala)))
