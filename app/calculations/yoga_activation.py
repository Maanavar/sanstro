"""Yoga activation intensity scorer.

A yoga is a standing promise; this module converts presence into *timed
intensity*. A yoga is strongest when one of its key grahas is the running
Mahadasha or Antardasha lord.

The key-graha table is **derived from `yoga_rules.YOGA_RULES`**, keyed by the
code the detectors actually emit. It used to be hand-maintained here and keyed
on near-miss names — ``GAJA_KESARI`` for a code emitted as
``GAJA_KESARI_YOGA``, ``PANCHA_MAHAPURUSHA_MARS`` for a code emitted as
``RUCHAKA_YOGA`` — so nine yogas looked up nothing, were treated as never
activated, and were capped at the dormant rung no matter which dasha ran. See
`YOG-01` split, 2026-08-27.

A yoga whose registry row declares no key grahas (Parivartana, Sakata,
Kemadruma, Chandala, Amala, Adhi, Daridra, Lakshmi, Sunapha/Anapha/Durudhura,
Vasumati, Kartari) is still dormant-capped. That is disclosed per rule in the
registry rather than fixed here, because choosing a key graha for a yoga that
has none is a doctrine call, not a code fix.
"""
from __future__ import annotations

from app.calculations.yoga_rules import activation_key_planets

#: Grahas whose maha/antar dasha activates a yoga, keyed by ``YogaResult.name``.
#: Built from the per-yoga rule registry — edit the rule row, not this dict.
YOGA_KEY_PLANETS: dict[str, list[str]] = activation_key_planets()


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
