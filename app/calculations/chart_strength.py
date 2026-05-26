"""
Product-level natal planet strength scorer.
Implements Formula Engine Spec §7.6 (approximate strength score).
Uses dignity table §7.1, Moolatrikona zones §7.3, Avastha §7.4.

This is NOT full classical Shadbala (spec §8) — that is a future module.
"""
from __future__ import annotations

from app.calculations.astro import house_from_reference
from app.calculations.transits import is_combust, is_gandanta

# Spec §7.2 — exaltation Rasi (1-based)
EXALTATION_RASI: dict[str, int] = {
    "SUN": 1, "MOON": 2, "MARS": 10, "MERCURY": 6,
    "JUPITER": 4, "VENUS": 12, "SATURN": 7,
}

# Spec §7.2 — debilitation Rasi (opposite of exaltation)
DEBILITATION_RASI: dict[str, int] = {
    "SUN": 7, "MOON": 8, "MARS": 4, "MERCURY": 12,
    "JUPITER": 10, "VENUS": 6, "SATURN": 1,
}

# Spec §7.3 — Moolatrikona: (Rasi, degree_start_in_sign, degree_end_in_sign)
MOOLATRIKONA_ZONE: dict[str, tuple[int, float, float]] = {
    "SUN":     (5,  0.0, 20.0),
    "MOON":    (2,  4.0, 30.0),
    "MARS":    (1,  0.0, 12.0),
    "MERCURY": (6, 16.0, 20.0),
    "JUPITER": (9,  0.0, 10.0),
    "VENUS":   (7,  0.0, 15.0),
    "SATURN":  (11, 0.0, 20.0),
}

# Own-sign Rasis per planet
OWN_SIGN_RASI: dict[str, frozenset[int]] = {
    "SUN":     frozenset({5}),
    "MOON":    frozenset({4}),
    "MARS":    frozenset({1, 8}),
    "MERCURY": frozenset({3, 6}),
    "JUPITER": frozenset({9, 12}),
    "VENUS":   frozenset({2, 7}),
    "SATURN":  frozenset({10, 11}),
    "RAHU":    frozenset(),
    "KETU":    frozenset(),
}

# Natural friendship table (same as BUG-04 / functional_nature)
_NATURAL_FRIENDS: dict[str, frozenset[str]] = {
    "SUN":     frozenset({"MOON", "MARS", "JUPITER"}),
    "MOON":    frozenset({"SUN", "MERCURY"}),
    "MARS":    frozenset({"SUN", "MOON", "JUPITER"}),
    "MERCURY": frozenset({"SUN", "VENUS"}),
    "JUPITER": frozenset({"SUN", "MOON", "MARS"}),
    "VENUS":   frozenset({"MERCURY", "SATURN"}),
    "SATURN":  frozenset({"MERCURY", "VENUS"}),
    "RAHU":    frozenset({"VENUS", "SATURN"}),
    "KETU":    frozenset({"MARS", "VENUS"}),
}
_NATURAL_ENEMIES: dict[str, frozenset[str]] = {
    "SUN":     frozenset({"VENUS", "SATURN", "RAHU", "KETU"}),
    "MOON":    frozenset({"RAHU", "KETU"}),
    "MARS":    frozenset({"MERCURY", "RAHU"}),
    "MERCURY": frozenset({"MOON"}),
    "JUPITER": frozenset({"MERCURY", "VENUS", "RAHU", "KETU"}),
    "VENUS":   frozenset({"SUN", "MOON", "RAHU", "KETU"}),
    "SATURN":  frozenset({"SUN", "MOON", "MARS"}),
    "RAHU":    frozenset({"SUN", "MOON", "MARS", "JUPITER"}),
    "KETU":    frozenset({"SUN", "MOON", "JUPITER", "RAHU"}),
}

# Sign lords for friend/enemy of sign lord check
SIGN_LORD: dict[int, str] = {
    1: "MARS", 2: "VENUS", 3: "MERCURY", 4: "MOON", 5: "SUN", 6: "MERCURY",
    7: "VENUS", 8: "MARS", 9: "JUPITER", 10: "SATURN", 11: "SATURN", 12: "JUPITER",
}


def _aspect_support_score(benefic_aspect_count: int, malefic_aspect_count: int) -> int:
    return max(0, min(100, 50 + benefic_aspect_count * 10 - malefic_aspect_count * 10))


def _has_d9_dignity(planet: str, d9_rasi: int) -> bool:
    return (
        d9_rasi in OWN_SIGN_RASI.get(planet, frozenset())
        or d9_rasi == EXALTATION_RASI.get(planet)
    )


def _dignity_score(planet: str, natal_rasi: int, natal_longitude: float) -> int:
    """Returns dignity score per spec §7.1 (9 levels)."""
    # Debilitation overrides everything
    if planet in DEBILITATION_RASI and natal_rasi == DEBILITATION_RASI[planet]:
        return 15

    # Exaltation
    if planet in EXALTATION_RASI and natal_rasi == EXALTATION_RASI[planet]:
        return 100

    # Moolatrikona zone (within own sign, specific degree range)
    if planet in MOOLATRIKONA_ZONE:
        mt_rasi, mt_start, mt_end = MOOLATRIKONA_ZONE[planet]
        deg_in_sign = natal_longitude % 30
        if natal_rasi == mt_rasi and mt_start <= deg_in_sign < mt_end:
            return 90

    # Own sign
    if natal_rasi in OWN_SIGN_RASI.get(planet, frozenset()):
        return 80

    # Friend/enemy of sign lord
    sign_lord = SIGN_LORD.get(natal_rasi)
    if sign_lord:
        if sign_lord in _NATURAL_FRIENDS.get(planet, frozenset()):
            return 60  # Friend's sign
        if sign_lord in _NATURAL_ENEMIES.get(planet, frozenset()):
            return 35  # Enemy's sign

    return 50  # Neutral


def _avastha_multiplier(natal_longitude: float) -> float:
    """Spec §7.4 — Bala Avastha based on degree within sign (0-30°)."""
    deg = natal_longitude % 30
    if deg < 6:
        return 0.25   # Bala (infant)
    if deg < 12:
        return 0.50   # Kumara (youth)
    if deg < 18:
        return 1.00   # Yuva (peak strength)
    if deg < 24:
        return 0.50   # Vriddha (elder)
    return 0.25       # Mrita (dead — weakened)


def compute_strength_breakdown(
    planet: str,
    natal_rasi: int,
    natal_longitude: float,
    natal_lagna_rasi: int,
    is_retrograde: bool,
    is_vargottama: bool = False,
    d9_rasi: int | None = None,
) -> dict[str, str]:
    """Returns sthana/dik/kala/chesta breakdown labels (WEAK/NEUTRAL/STRONG)."""
    dignity = _dignity_score(planet, natal_rasi, natal_longitude)
    if dignity >= 80:
        sthana = "STRONG"
    elif dignity >= 50:
        sthana = "NEUTRAL"
    else:
        sthana = "WEAK"

    # Dik Bala — directional strength by planet and house
    DIK_BALA_HOUSE: dict[str, int] = {
        "SUN": 10, "MARS": 10, "JUPITER": 1, "MERCURY": 1,
        "MOON": 4, "VENUS": 4, "SATURN": 7,
    }
    house = house_from_reference(natal_lagna_rasi, natal_rasi)
    peak = DIK_BALA_HOUSE.get(planet)
    if peak is not None:
        dist = min(abs(house - peak), 12 - abs(house - peak))
        dik = "STRONG" if dist <= 1 else ("NEUTRAL" if dist <= 3 else "WEAK")
    else:
        dik = "NEUTRAL"

    # Kala Bala — Vargottama and D9 dignity as proxy for temporal strength
    if is_vargottama or (d9_rasi is not None and _has_d9_dignity(planet, d9_rasi)):
        kala = "STRONG"
    elif d9_rasi is not None:
        kala = "NEUTRAL"
    else:
        kala = "NEUTRAL"

    # Chesta Bala — motional strength (retrograde = strong)
    if planet not in {"SUN", "MOON", "RAHU", "KETU"}:
        chesta = "STRONG" if is_retrograde else "WEAK"
    else:
        chesta = "NEUTRAL"

    return {"sthana": sthana, "dik": dik, "kala": kala, "chesta": chesta}


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
) -> int:
    """
    Product-level strength score for a natal planet.
    Implements spec §7.6 formula. Returns 10-95.

    NOT full Shadbala (spec §8). That is Module 20.
    """
    dignity = _dignity_score(planet, natal_rasi, natal_longitude)
    avastha = _avastha_multiplier(natal_longitude)
    d9_dignity_bonus = 5 if d9_rasi is not None and dignity == 50 and _has_d9_dignity(planet, d9_rasi) else 0

    # House from Lagna
    house = house_from_reference(natal_lagna_rasi, natal_rasi)
    if house in {1, 4, 7, 10}:
        house_strength = 80   # Kendra
    elif house in {5, 9}:
        house_strength = 75   # Trikona (pure — 1st is already in Kendra)
    elif house in {2, 11}:
        house_strength = 65   # Dhana / Labha
    elif house in {3, 6}:
        house_strength = 55   # Upachaya (growing)
    elif house in {8, 12}:
        house_strength = 25   # Dusthana (difficult)
    else:
        house_strength = 50   # Neutral (7th counted in Kendra above)

    aspect_support = _aspect_support_score(benefic_aspect_count, malefic_aspect_count)

    # Spec §7.6 weights
    score = (
        dignity        * 0.35
        + avastha * 100 * 0.15
        + house_strength * 0.15
        + aspect_support * 0.15
        + (10 if is_vargottama else 0) * 0.10
        + 50             * 0.10   # shadbala_ratio placeholder
    )
    score += d9_dignity_bonus

    # Combustion penalty
    if planet not in {"SUN", "RAHU", "KETU"}:
        if is_combust(planet, natal_longitude, sun_longitude, is_retrograde):
            score -= 20

    # Sandhi (within 1° of sign boundary)
    deg_in_sign = natal_longitude % 30
    if deg_in_sign <= 1.0 or deg_in_sign >= 29.0:
        score -= 8

    # Gandanta (water-fire sign junction)
    if is_gandanta(natal_longitude):
        score -= 10

    # Retrograde: Cheshta Bala — retrograde planets gain motional strength
    if is_retrograde and planet not in {"SUN", "MOON", "RAHU", "KETU"}:
        score += 8

    return max(10, min(95, round(score)))
