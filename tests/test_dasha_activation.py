"""Connection-match dasha activation (app/calculations/dasha_activation.py).

All cases hand-worked from Aries lagna (rasi 1): 7th bhava = Libra (7),
bhava lord = Venus. Rasi numbers are sidereal 1..12 from Mesha.
"""

import pytest

from app.calculations.dasha_activation import assess_dasha_activation

pytestmark = pytest.mark.no_db


def _assess(dasha_lords, planet_rasis, **kwargs):
    return assess_dasha_activation(
        lagna_rasi=1,
        bhava_house=7,
        dasha_lords=dasha_lords,
        natal_planet_rasis=planet_rasis,
        **kwargs,
    )


def test_identity_match_bhava_lord_is_strong():
    result = _assess(["VENUS", "SUN"], {"VENUS": 3, "SUN": 5})
    assert result.activated
    assert result.strength == "STRONG"
    assert "maha:VENUS:lords_bhava" in result.connections


def test_occupying_dasha_lord_activates():
    # Moon in Libra occupies the 7th — classically event-giving, previously missed.
    result = _assess(["MOON", "SUN"], {"MOON": 7, "SUN": 5, "VENUS": 1})
    assert result.activated
    assert result.strength == "STRONG"
    assert "maha:MOON:occupies_bhava" in result.connections


def test_aspecting_dasha_lord_is_moderate():
    # Saturn in Capricorn (10) casts its 10th aspect onto Libra (7).
    result = _assess(["SATURN", "SUN"], {"SATURN": 10, "SUN": 5, "VENUS": 1})
    assert result.activated
    assert result.strength == "MODERATE"
    assert "maha:SATURN:aspects_bhava" in result.connections


def test_dispositor_of_bhava_lord_is_moderate():
    # Venus (7th lord) stands in Capricorn — Saturn dasha activates as dispositor.
    # Saturn in Virgo (6) neither occupies nor aspects Libra (aspects 8, 12, 3).
    result = _assess(["SATURN", "SUN"], {"SATURN": 6, "SUN": 2, "VENUS": 10})
    assert result.activated
    assert result.strength == "MODERATE"
    assert "maha:SATURN:dispositor_of_bhava_lord" in result.connections


def test_node_agency_transfers_dispositor_lordship():
    # Rahu in Taurus is disposed by Venus, the 7th lord — Rahu dasha acts
    # as Venus's agent (classical node-agency rule).
    result = _assess(["RAHU", "SUN"], {"RAHU": 2, "SUN": 6, "VENUS": 5})
    assert result.activated
    assert result.strength == "STRONG"
    assert "maha:RAHU:node_agent_of_VENUS" in result.connections


def test_related_house_lordship_counts():
    # Marriage uses 2/7/11: 11th from Aries is Aquarius, lorded by Saturn.
    # Saturn in Virgo has no direct 7th-bhava contact; lordship alone connects.
    result = _assess(
        ["SATURN", "SUN"],
        {"SATURN": 6, "SUN": 2, "VENUS": 1},
        related_houses=[2, 11],
    )
    assert result.activated
    assert result.strength == "STRONG"
    assert "maha:SATURN:lords_related_house" in result.connections


def test_karaka_dasha_counts():
    result = _assess(["JUPITER", "SUN"], {"JUPITER": 5, "SUN": 2, "VENUS": 1}, karakas=["JUPITER"])
    assert result.activated
    assert result.strength == "STRONG"
    assert "maha:JUPITER:is_karaka" in result.connections


def test_antar_only_connection_is_moderate():
    # Unconnected mahadasha, but the antardasha lord owns the bhava.
    result = _assess(["SUN", "VENUS"], {"SUN": 2, "VENUS": 1, "MARS": 12})
    assert result.activated
    assert result.strength == "MODERATE"
    assert "antar:VENUS:lords_bhava" in result.connections


def test_no_connection_returns_none():
    # Sun in Taurus (aspects Scorpio only), Moon antar in Gemini (aspects
    # Sagittarius); Venus in Aries so neither is its dispositor.
    result = _assess(["SUN", "MOON"], {"SUN": 2, "MOON": 3, "VENUS": 1}, karakas=["VENUS"])
    assert not result.activated
    assert result.strength == "NONE"
    assert result.connections == ()
