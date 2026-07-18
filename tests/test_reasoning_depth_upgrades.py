"""Service-level pins for the 2026-07-17 reasoning-depth upgrade.

Verifies that the shared modules (bhava_afflictions, dasha_activation) are
actually wired into the user-facing prediction services — named affliction
factors surface, indirect dasha connections earn PARTIAL support, and the
7th lord's navamsa dignity is read. Charts are synthetic (PII rule).
"""

from datetime import date

import pytest

from app.services.career_service import CareerAssessmentInput, assess_career_prediction
from app.services.marriage_service import MarriageAssessmentInput, assess_marriage_prediction

pytestmark = pytest.mark.no_db


def _marriage_payload(**overrides) -> MarriageAssessmentInput:
    base = dict(
        as_of=date(2026, 7, 17),
        lagna_rasi=1,  # Aries lagna → 7th = Libra, lord Venus
        planets_rasi={
            "SUN": 5, "MOON": 9, "MARS": 7, "MERCURY": 4, "JUPITER": 11,
            "VENUS": 2, "SATURN": 1, "RAHU": 6, "KETU": 12,
        },
        active_dasha_lords={"SUN", "MOON"},
        transit_jupiter_rasi=3,  # aspects 7/9/11 → includes Libra (7)
        transit_venus_rasi=4,
        age=28,
        marital_status="single",
    )
    base.update(overrides)
    return MarriageAssessmentInput(**base)


def test_marriage_surfaces_named_seventh_house_affliction():
    # Mars occupies Libra, Saturn in Aries casts its 7th aspect onto it.
    result = assess_marriage_prediction(_marriage_payload(), use_reasoning_gate=False)
    keys = {f.key for f in result.astrological_factors}
    assert "seventh_house_malefic_influence" in keys
    assert any("Malefic aspect/occupancy" in c.en for c in result.challenges)


def test_marriage_papa_kartari_flagged():
    # Rahu in Virgo (12th from Libra) + Ketu in Scorpio (2nd from Libra).
    payload = _marriage_payload(
        planets_rasi={
            "SUN": 5, "MOON": 10, "MARS": 3, "MERCURY": 4, "JUPITER": 11,
            "VENUS": 2, "SATURN": 11, "RAHU": 6, "KETU": 8,
        },
    )
    result = assess_marriage_prediction(payload, use_reasoning_gate=False)
    assert "papa_kartari_seventh" in {f.key for f in result.astrological_factors}


def test_marriage_venus_as_seventh_lord_affliction_not_dropped():
    """Aries lagna: Venus is both the 7th lord and the karaka, so the
    affliction module skips its karaka pass and reports Venus's afflictors
    under lord_afflicted_by. The score path must still surface them — this
    exact configuration was silently dropped before the fix (the condition
    excluded Venus-as-lord while karaka_afflicted_by was empty by design).
    In the default chart Mars in Libra casts its 8th aspect onto Venus."""
    result = assess_marriage_prediction(_marriage_payload(), use_reasoning_gate=False)
    assert any("Venus is under malefic aspect" in c.en for c in result.challenges)


def test_marriage_indirect_dasha_connection_is_partial():
    # Saturn dasha: not the 7th lord or Venus, but Saturn in Capricorn casts
    # its 10th aspect onto Libra AND lords the 11th (Aquarius) — previously
    # scored WEAK, now an acknowledged connection.
    payload = _marriage_payload(
        planets_rasi={
            "SUN": 5, "MOON": 9, "MARS": 3, "MERCURY": 4, "JUPITER": 11,
            "VENUS": 2, "SATURN": 10, "RAHU": 9, "KETU": 3,
        },
        active_dasha_lords={"SATURN"},
    )
    result = assess_marriage_prediction(payload, use_reasoning_gate=False)
    # Saturn lords the 11th (related house) → connection-match STRONG.
    assert result.dasha_support in {"STRONG", "PARTIAL"}
    assert not any("no connection to the 7th house" in c.en for c in result.challenges)


def test_marriage_d9_seventh_lord_dignity_read():
    # Venus is the 7th lord for Aries lagna, so use Taurus lagna (2):
    # 7th = Scorpio, lord Mars. Mars exalted in D9 Capricorn (10).
    payload = _marriage_payload(
        lagna_rasi=2,
        planets_rasi={
            "SUN": 5, "MOON": 9, "MARS": 4, "MERCURY": 6, "JUPITER": 11,
            "VENUS": 3, "SATURN": 12, "RAHU": 9, "KETU": 3,
        },
        d9_rasi_by_planet={"VENUS": 1, "MARS": 10},
    )
    result = assess_marriage_prediction(payload, use_reasoning_gate=False)
    assert "d9_seventh_lord" in {f.key for f in result.astrological_factors}


def test_career_indirect_dasha_connection_is_partial_or_strong():
    # Aries lagna → 10th = Capricorn. Jupiter dasha: not a career karaka and
    # owns neither 10 nor 2/6/11, but from Virgo (6) its 5th aspect lands on
    # Capricorn (10) — an aspect connection, previously invisible.
    result = assess_career_prediction(CareerAssessmentInput(
        as_of=date(2026, 7, 17),
        lagna_rasi=1,
        planets_rasi={
            "SUN": 2, "MOON": 5, "MARS": 12, "MERCURY": 3, "JUPITER": 6,
            "VENUS": 8, "SATURN": 4, "RAHU": 9, "KETU": 3,
        },
        active_dasha_lords={"JUPITER"},
        transit_saturn_rasi=3,
        age=30,
    ))
    assert result.dasha_support in {"PARTIAL", "STRONG"}


def test_career_afflicted_tenth_house_is_named():
    # Cancer lagna (4) → 10th = Aries. Saturn in Cancer aspects Aries via its
    # 10th aspect; Mars in Libra aspects Aries via its 7th; Rahu in Pisces and
    # Ketu in Taurus hem the 10th in papa kartari.
    result = assess_career_prediction(CareerAssessmentInput(
        as_of=date(2026, 7, 17),
        lagna_rasi=4,
        planets_rasi={
            "SUN": 5, "MOON": 8, "MARS": 7, "MERCURY": 6, "JUPITER": 11,
            "VENUS": 6, "SATURN": 4, "RAHU": 12, "KETU": 2,
        },
        active_dasha_lords={"MOON"},
        transit_saturn_rasi=6,
        age=35,
    ))
    assert "tenth_house_malefic_influence" in {f.key for f in result.astrological_factors}
