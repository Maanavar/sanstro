from __future__ import annotations

"""
Yoga activation intensity scorer.
A yoga is strongest when its key planet is the current Mahadasha or
Antardasha lord. This module converts yoga presence into a timed intensity.
"""

YOGA_KEY_PLANETS: dict[str, list[str]] = {
    "GAJA_KESARI": ["JUPITER", "MOON"],
    "RAJA_YOGA": ["SUN", "MOON", "MARS", "JUPITER"],
    "DHANA_YOGA": ["JUPITER", "VENUS", "MERCURY"],
    "NEECHA_BHANGA_RAJA_YOGA": ["JUPITER"],
    "KALASARPA": ["RAHU", "KETU"],
    "PANCHA_MAHAPURUSHA_SUN": ["SUN"],
    "PANCHA_MAHAPURUSHA_MOON": ["MOON"],
    "PANCHA_MAHAPURUSHA_MARS": ["MARS"],
    "PANCHA_MAHAPURUSHA_MERCURY": ["MERCURY"],
    "PANCHA_MAHAPURUSHA_JUPITER": ["JUPITER"],
    "PANCHA_MAHAPURUSHA_VENUS": ["VENUS"],
    "PANCHA_MAHAPURUSHA_SATURN": ["SATURN"],
    "BUDHA_ADITYA": ["SUN", "MERCURY"],
    "VIPAREETHA_RAJA": ["SATURN", "MARS", "JUPITER"],
    "PARIVARTANA": [],
    "CHANDRA_MANGALA": ["MOON", "MARS"],
}


def yoga_activation_score(
    yoga_name: str,
    yoga_is_present: bool,
    yoga_strength: str,
    mahadasha_lord: str,
    antardasha_lord: str,
    planet_scores: dict[str, int],
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
    activated = bool(dasha_lords & set(key_planets))

    strength_base = {"STRONG": 75, "MODERATE": 55, "PARTIAL": 40, "WEAK": 25}.get(yoga_strength, 50)
    if not activated:
        return round(strength_base * 0.45)

    best_planet_score = max((planet_scores.get(p, 50) for p in key_planets if p in dasha_lords), default=50)
    intensity = strength_base * 0.60 + best_planet_score * 0.40
    return max(10, min(100, round(intensity)))
