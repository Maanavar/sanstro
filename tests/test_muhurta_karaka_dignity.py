"""A5 — the wealth karakas' transit condition must reach the score.

Master doc §3.6 / §9.1. Before this factor existed, `grep -n "combust"
app/calculations/muhurta_engine.py` returned nothing: an almanac could read
perfectly for buying gold while Venus, the karaka of the thing being bought, sat
invisible in the Sun's glare. Every test here fails on the code before it — the
function under test did not exist.

Provenance note, asserted below: this is Tamil practice consensus (almanacs print
குரு / சுக்ர மௌட்யம் as dated spans and offer no muhurtham inside them), *not* a
Kalaprakasika page. The reason copy must never imply otherwise.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

import pytest

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.ephemeris import EphemerisBody, calculate_sidereal_planets
from app.calculations.muhurta_engine import Verdict, karaka_dignity_factors

pytestmark = pytest.mark.no_db

SWEEP_START = date(2026, 1, 1)
SWEEP_DAYS = 365
ACQUISITION = "GOLD"
NOT_AN_ACQUISITION = "MARRIAGE"


def _body(graha: str, longitude: float, *, retrograde: bool = False) -> EphemerisBody:
    return EphemerisBody(
        graha=graha,
        absolute_longitude=longitude % 360,
        speed_deg_per_day=-0.1 if retrograde else 1.0,
        rasi=int((longitude % 360) // 30) + 1,
        degree_in_rasi=(longitude % 360) % 30,
        is_retrograde=retrograde,
        show_retrograde_badge=retrograde,
    )


def _clear_sky() -> dict[str, EphemerisBody]:
    """Sun, Jupiter and Venus far apart, direct, and out of their fall signs."""
    return {
        "SUN": _body("SUN", 0.0),          # Mesha
        "JUPITER": _body("JUPITER", 120.0),  # Simha — not Makara (fall)
        "VENUS": _body("VENUS", 240.0),      # Dhanus — not Kanni (fall)
    }


@pytest.fixture(scope="module")
def planets_by_day() -> dict[date, dict[str, EphemerisBody]]:
    """Real positions at a fixed instant on each day of a year."""
    out = {}
    for i in range(SWEEP_DAYS):
        d = SWEEP_START + timedelta(days=i)
        jd = utc_datetime_to_julian_day(datetime(d.year, d.month, d.day, 6, 0, tzinfo=UTC))
        out[d] = calculate_sidereal_planets(jd).bodies
    return out


# ── the §9.1 acceptance test ──────────────────────────────────────────────────

def test_a_combust_karaka_day_is_docked_and_a_clear_one_is_not(planets_by_day):
    """§9.1 — the same activity scores lower on a day its karaka is hidden."""
    combust_days = [
        d for d, bodies in planets_by_day.items()
        if any(
            f.contribution < 0 and "combust" in f.reason_en
            for f in karaka_dignity_factors(ACQUISITION, bodies)
        )
    ]
    clear_days = [d for d, bodies in planets_by_day.items() if not karaka_dignity_factors(ACQUISITION, bodies)]

    assert combust_days, "no combust karaka day in a whole year — sweep is vacuous"
    assert clear_days, "no clear karaka day in a whole year — the factor fires always, which is wrong"

    worst = min(
        sum(f.contribution for f in karaka_dignity_factors(ACQUISITION, planets_by_day[d]))
        for d in combust_days
    )
    assert worst <= -14.0, "a combust karaka must cost at least a favoured nakshatra's worth"


def test_the_penalty_can_outweigh_a_favoured_nakshatra(planets_by_day):
    """A fine star alone must not carry a purchase whose karaka is invisible.

    This is the anchor the weight was derived from, so it is asserted rather than
    left as a comment that can drift away from `_W`.
    """
    from app.calculations.muhurta_engine import _W

    assert _W.KARAKA_COMBUST + _W.NAKSHATRA_FAVOURED <= 0


# ── gating ────────────────────────────────────────────────────────────────────

def test_a_non_acquisition_activity_is_never_touched(planets_by_day):
    """Marriage has its own sourced doctrine; A5 scopes to purchases only."""
    for bodies in planets_by_day.values():
        assert karaka_dignity_factors(NOT_AN_ACQUISITION, bodies) == []


def test_a_clear_sky_produces_no_factor():
    assert karaka_dignity_factors(ACQUISITION, _clear_sky()) == []


def test_missing_planets_produce_no_factor():
    assert karaka_dignity_factors(ACQUISITION, {}) == []
    assert karaka_dignity_factors(ACQUISITION, {"VENUS": _body("VENUS", 5.0)}) == []


# ── the three conditions, and their precedence ────────────────────────────────

def test_combustion_is_detected_and_named_in_both_languages():
    bodies = _clear_sky()
    bodies["VENUS"] = _body("VENUS", 4.0)  # 4° from the Sun, inside Venus's 10° orb
    factors = karaka_dignity_factors(ACQUISITION, bodies)

    assert len(factors) == 1
    factor = factors[0]
    assert factor.factor == "KARAKA_DIGNITY"
    assert factor.verdict is Verdict.PENALTY
    assert factor.contribution == -14.0
    assert "Venus" in factor.reason_en
    # The almanac's printed compound leads; the nominative returns as the subject.
    assert factor.reason_ta.startswith("சுக்கிர மௌட்யம் —")
    assert "காரகரான சுக்கிரன்," in factor.reason_ta
    # The exact inversion a single name column would have produced.
    assert "சுக்கிரன் மௌட்யம்" not in factor.reason_ta


def test_cazimi_is_not_a_combust_penalty():
    """A planet in the Sun's heart gains; the engine must not dock it."""
    bodies = _clear_sky()
    bodies["VENUS"] = _body("VENUS", 0.1)  # within 0°17' of the Sun
    assert karaka_dignity_factors(ACQUISITION, bodies) == []


def test_debilitation_is_detected_when_not_combust():
    bodies = _clear_sky()
    bodies["VENUS"] = _body("VENUS", 160.0)  # Kanni — Venus's fall, far from the Sun
    factors = karaka_dignity_factors(ACQUISITION, bodies)

    assert len(factors) == 1
    assert factors[0].contribution == -10.0
    assert "debilitated" in factors[0].reason_en
    # நீசம் takes the nominative, unlike மௌட்யம் above.
    assert factors[0].reason_ta.startswith("சுக்கிரன் நீசம் —")


def test_retrogression_alone_is_never_penalised():
    """Vakri is a strength here, and this app must not contradict itself.

    `chart_strength._chesta_bala_score` gives a retrograde planet its maximum
    motional strength. A penalty here would make two engines in one product
    disagree about the sign of one condition — the defect a 2026-07-18
    astrologer review already caught once. Tamil practice bars muhurthams inside
    மௌட்யம், not inside a vakri period.
    """
    from app.calculations.chart_strength import _chesta_bala_score

    assert _chesta_bala_score("JUPITER", True, None) > _chesta_bala_score("JUPITER", False, None)

    bodies = _clear_sky()
    bodies["JUPITER"] = _body("JUPITER", 120.0, retrograde=True)
    assert karaka_dignity_factors(ACQUISITION, bodies) == []


def test_a_cazimi_retrograde_karaka_is_left_entirely_alone():
    """The jagged case a printed span exposed.

    Venus retrograde and 0.15° from the Sun sat mid-way through a combust span.
    An earlier draft skipped the combustion penalty (correctly, it is cazimi) and
    then fell through to a retrograde penalty, so the one day Venus is strongest
    scored worse than clear days around it.
    """
    bodies = _clear_sky()
    bodies["VENUS"] = _body("VENUS", 0.15, retrograde=True)
    assert karaka_dignity_factors(ACQUISITION, bodies) == []


def test_one_planet_is_docked_once_even_when_two_conditions_hold():
    """Combust *and* fallen is one factor, not two penalties."""
    bodies = _clear_sky()
    bodies["SUN"] = _body("SUN", 160.0)             # Sun in Kanni
    bodies["VENUS"] = _body("VENUS", 163.0)          # combust, and in its own fall sign
    factors = karaka_dignity_factors(ACQUISITION, bodies)

    assert len(factors) == 1
    assert factors[0].contribution == -14.0


def test_both_karakas_can_fire_on_the_same_day():
    bodies = _clear_sky()
    bodies["VENUS"] = _body("VENUS", 4.0)
    bodies["JUPITER"] = _body("JUPITER", 8.0)
    factors = karaka_dignity_factors(ACQUISITION, bodies)

    assert len(factors) == 2
    assert {f.contribution for f in factors} == {-14.0}


# ── provenance ────────────────────────────────────────────────────────────────

def test_the_reason_never_claims_a_kalaprakasika_citation():
    """This factor is practice consensus. It must not borrow the text's authority."""
    bodies = _clear_sky()
    bodies["VENUS"] = _body("VENUS", 4.0)
    bodies["JUPITER"] = _body("JUPITER", 8.0)
    for factor in karaka_dignity_factors(ACQUISITION, bodies):
        blob = f"{factor.reason_en} {factor.reason_ta}".lower()
        for claim in ("kalaprakasika", "chapter", "p.", "கலப்பிரகாசிகை", "அத்தியாயம்"):
            assert claim not in blob
