"""A13 — the day-score stages extracted from `build_daily_guidance_response`.

The point of lifting them out is that each rule can now be pinned directly,
with plain values and no chart, panchangam or database. These restate rules
already in the code (and in its comments); none is new doctrine.
`tests/test_daily_guidance_golden.py` covers the stages as the builder uses
them.
"""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.calculations.ashtakavarga import compute_bhinnashtakavarga
from app.calculations.chart_strength import compute_natal_planet_score
from app.calculations.functional_nature import get_dasha_modifier
from app.reasoning.verdict import Band, band_to_legacy_confidence
from app.services._dg_scoring import (
    PLANET_PERIOD_SCORE,
    SADE_SATI_TYPES,
    _age_dasha_modifier,
    _dasha_lord_strength_score,
    _graha_relationship_score,
    composite_day_score,
    dasha_component,
    personal_safety_component,
    transit_component,
)

pytestmark = pytest.mark.no_db

QUIET = SimpleNamespace(is_active=False, type="NORMAL")


def _safety(**overrides) -> int:
    kwargs = dict(
        chandrashtama=False, saturn_cycle=QUIET, kantaka_sani=QUIET,
        sade_sati_murthi_grade=None, abhijit_restricted=False, mercury_combust=False,
    )
    kwargs.update(overrides)
    return personal_safety_component(**kwargs)


class TestPersonalSafety:
    def test_a_quiet_day_is_sixty(self) -> None:
        assert _safety() == 60

    @pytest.mark.parametrize(
        ("overrides", "expected"),
        [
            ({"chandrashtama": True}, 45),
            ({"abhijit_restricted": True}, 55),
            ({"mercury_combust": True}, 57),
            ({"saturn_cycle": SimpleNamespace(is_active=True, type="ARDHASHTAMA_SANI")}, 51),
            ({"saturn_cycle": SimpleNamespace(is_active=True, type="ASHTAMA_SANI")}, 48),
        ],
    )
    def test_each_caution_costs_its_own_amount(self, overrides, expected) -> None:
        assert _safety(**overrides) == expected

    @pytest.mark.parametrize(("grade", "expected"), [("GOLD", 56), ("SILVER", 54), ("COPPER", 52), ("IRON", 50), (None, 53)])
    def test_sade_sati_is_graded_by_murthi_never_flat(self, grade, expected) -> None:
        for phase in SADE_SATI_TYPES:
            cycle = SimpleNamespace(is_active=True, type=phase)
            assert _safety(saturn_cycle=cycle, sade_sati_murthi_grade=grade) == expected

    def test_kandaka_alone_costs_seven(self) -> None:
        assert _safety(kantaka_sani=SimpleNamespace(is_active=True, type="KANDAKA_SANI")) == 53

    def test_kandaka_overlapping_a_saturn_cycle_is_scored_once(self) -> None:
        # Doctrine A-1: the 4th from the Moon is both Ardhashtama and Kandaka —
        # named twice, scored once.
        both = _safety(
            saturn_cycle=SimpleNamespace(is_active=True, type="ARDHASHTAMA_SANI"),
            kantaka_sani=SimpleNamespace(is_active=True, type="KANDAKA_SANI"),
        )
        assert both == 51


def _composite(**overrides):
    kwargs = dict(
        moon_score=80, transit_score=70, dasha_score=70, panchangam_score=70,
        personal_safety_score=70, remedial_support=6, chandrashtama=False,
    )
    kwargs.update(overrides)
    return composite_day_score(**kwargs)


class TestComposite:
    def test_components_are_rounded_then_summed(self) -> None:
        day = _composite()
        assert (day.moon, day.transit, day.dasha, day.panchangam, day.personal, day.remedial) == (22, 17, 13, 10, 6, 6)
        assert day.score == 74
        assert day.label == "GOOD"

    def test_chandrashtama_never_reads_positive(self) -> None:
        assert _composite(chandrashtama=True).label == "BALANCED"
        # …but it does not lift a weak day either.
        weak = _composite(moon_score=20, transit_score=20, dasha_score=20, chandrashtama=True)
        assert weak.label not in ("GOOD", "STRONG_SUPPORT", "BALANCED")

    def test_the_maximum_is_exactly_one_hundred(self) -> None:
        top = _composite(moon_score=100, transit_score=100, dasha_score=100, panchangam_score=100, personal_safety_score=100)
        assert top.score == 100

    @pytest.mark.parametrize(
        ("moon", "dasha", "transit", "band"),
        [(80, 70, 70, Band.LIKELY), (80, 50, 70, Band.MIXED), (80, 50, 50, Band.WEAK)],
    )
    def test_confidence_counts_moon_dasha_and_transit(self, moon, dasha, transit, band) -> None:
        day = _composite(moon_score=moon, dasha_score=dasha, transit_score=transit)
        assert day.band is band
        assert day.confidence == band_to_legacy_confidence(band)
        assert day.confidence_reason.en and day.confidence_reason.ta


class TestTransit:
    def _bodies(self, **rasi):
        names = ("JUPITER", "SATURN", "RAHU", "KETU", "MARS", "MOON")
        return {g: SimpleNamespace(rasi=rasi.get(g, 1)) for g in names}

    def test_houses_are_counted_from_the_natal_moon(self) -> None:
        bav = compute_bhinnashtakavarga({
            "LAGNA": 1, "SUN": 2, "MOON": 3, "MARS": 4, "MERCURY": 5,
            "JUPITER": 6, "VENUS": 7, "SATURN": 8, "RAHU": 9, "KETU": 3,
        })
        bodies = self._bodies(JUPITER=5, SATURN=12, MOON=3)
        result = transit_component(bodies, natal_moon_rasi=3, natal_lagna=1, bav=bav)
        assert result.houses_from_moon["MOON"] == 1
        assert result.houses_from_moon["JUPITER"] == 3
        assert result.houses_from_moon["SATURN"] == 10
        assert 0 <= result.score <= 100


LAGNA = 1


def _planet(graha: str, rasi: int, *, strength: int = 0, lon: float | None = None):
    return SimpleNamespace(
        graha=graha, rasi=rasi, absolute_longitude=(rasi - 1) * 30 + 10.0 if lon is None else lon,
        strength_score=strength, is_retrograde=False, is_vargottama=False, d9_rasi=None,
    )


def _dasha(planets, *, maha, antar, praty=None, transits=None, age=40, is_daytime=True):
    return dasha_component(
        planets, maha_lord=maha, antar_lord=antar, pratyantar_lord=praty or antar,
        natal_lagna=LAGNA, natal_moon_rasi=4, transit_bodies=transits or {},
        natal_rasi_by_graha={p.graha: p.rasi for p in planets}, is_daytime=is_daytime, profile_age=age,
    )


def _blend(maha_raw: int, antar_raw: int, maha: str, antar: str, age: int = 40) -> int:
    """The stage's last step, restated: modifiers, 10-95 clamp, 45/30/25 blend."""
    def lord(raw: int, planet: str) -> int:
        return max(10, min(95, round(raw * get_dasha_modifier(LAGNA, planet) * _age_dasha_modifier(age, planet))))
    blended = lord(maha_raw, maha) * 0.45 + lord(antar_raw, antar) * 0.30 + _graha_relationship_score(maha, antar) * 0.25
    return max(0, min(100, round(blended)))


class TestDasha:
    def test_a_lord_the_chart_does_not_carry_takes_the_generic_period_score(self) -> None:
        result = _dasha([], maha="JUPITER", antar="SATURN")
        assert result.score == _blend(PLANET_PERIOD_SCORE["JUPITER"], PLANET_PERIOD_SCORE["SATURN"], "JUPITER", "SATURN")
        assert result.planet_strength == {}

    def test_a_carried_lord_uses_its_own_strength_and_without_a_transit_keeps_it(self) -> None:
        # Sun, Mercury and Venus are not among the day's scored transit bodies.
        planets = [_planet("VENUS", 2, strength=81), _planet("MERCURY", 3, strength=33)]
        result = _dasha(planets, maha="VENUS", antar="MERCURY")
        assert result.score == _blend(81, 33, "VENUS", "MERCURY")
        assert result.planet_strength == {"VENUS": 81, "MERCURY": 33}

    def test_a_transiting_lord_is_read_from_its_house_from_the_natal_moon(self) -> None:
        planets = [_planet("SATURN", 7, strength=60), _planet("JUPITER", 9, strength=70)]
        transits = {
            "SATURN": SimpleNamespace(rasi=6, is_retrograde=True),   # 3rd from a Kadagam Moon
            "JUPITER": SimpleNamespace(rasi=4, is_retrograde=False),  # 1st
        }
        result = _dasha(planets, maha="SATURN", antar="JUPITER", transits=transits)
        saturn = _dasha_lord_strength_score("SATURN", 60, 3, is_retrograde_transit=True)
        jupiter = _dasha_lord_strength_score("JUPITER", 70, 1, is_retrograde_transit=False)
        assert result.score == _blend(saturn, jupiter, "SATURN", "JUPITER")
        # The narrative reads natal strength, not the transit-adjusted score.
        assert result.planet_strength == {"SATURN": 60, "JUPITER": 70}

    def test_a_missing_strength_is_computed_from_the_placement(self) -> None:
        planets = [_planet("SUN", 5, lon=130.0), _planet("MOON", 8, lon=220.0), _planet("MARS", 10, lon=280.0)]
        result = _dasha(planets, maha="MARS", antar="MARS", is_daytime=False)
        expected = compute_natal_planet_score(
            planet="MARS", natal_rasi=10, natal_longitude=280.0, natal_lagna_rasi=LAGNA,
            sun_longitude=130.0, is_retrograde=False, is_vargottama=False, d9_rasi=None,
            is_daytime=False, paksha_is_shukla=True, planet_rasi_map={"SUN": 5, "MOON": 8, "MARS": 10},
        )
        assert expected > 0
        assert result.planet_strength == {"MARS": expected}

    def test_the_pratyantar_lord_is_reported_but_does_not_move_the_score(self) -> None:
        planets = [_planet("VENUS", 2, strength=81), _planet("MERCURY", 3, strength=33), _planet("SATURN", 7, strength=50)]
        result = _dasha(planets, maha="VENUS", antar="MERCURY", praty="SATURN")
        assert list(result.planet_strength) == ["VENUS", "MERCURY", "SATURN"]
        assert result.score == _dasha(planets[:2], maha="VENUS", antar="MERCURY").score

    @pytest.mark.parametrize(("strength", "expected"), [(1000, 89), (1, 26)])
    def test_each_lord_is_clamped_to_10_95_before_the_blend(self, strength, expected) -> None:
        # Jupiter-Jupiter: relationship 72. 95*0.45 + 95*0.30 + 18 = 89.25;
        # 10*0.45 + 10*0.30 + 18 = 25.5 -> 26.
        result = _dasha([_planet("JUPITER", 9, strength=strength)], maha="JUPITER", antar="JUPITER")
        assert result.score == expected
