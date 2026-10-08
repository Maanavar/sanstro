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
from app.reasoning.verdict import Band, band_to_legacy_confidence
from app.services._dg_scoring import (
    SADE_SATI_TYPES,
    composite_day_score,
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
