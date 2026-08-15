from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.calculations.muhurta_engine import Verdict, score_day
from app.calculations.panchangam import _compute_subha_muhurtham_strict

pytestmark = pytest.mark.no_db


@pytest.mark.parametrize("yoga_name", ["VAIDHRITI", "VISHKAMBHA", "VAJRA"])
def test_ashubha_nitya_yogas_block_subha_muhurtham(yoga_name: str) -> None:
    is_subha, reason = _compute_subha_muhurtham_strict(
        2,
        "SHUKLA",
        "ROHINI",
        yoga_name,
        weekday_index=0,
    )

    assert is_subha is False
    assert reason.startswith("Inauspicious:")
    assert f"{yoga_name} yoga" in reason


def test_variyana_is_the_matching_subha_nitya_yoga_spelling() -> None:
    is_subha, reason = _compute_subha_muhurtham_strict(
        2,
        "SHUKLA",
        "ROHINI",
        "VARIYANA",
        weekday_index=0,
    )

    assert is_subha is True
    assert "VARIYANA yoga" in reason


def _muhurta_snapshot(tithi_number: int) -> SimpleNamespace:
    return SimpleNamespace(
        tithi_number=tithi_number,
        tithi_paksha="KRISHNA",
        tithi_name=f"Tithi {tithi_number}",
        nakshatra_name="ROHINI",
        nakshatra_number=4,
        nakshatra_pada=1,
        yoga_name="SIDDHA",
        weekday="MONDAY",
        is_subha_muhurtham=False,
        abhijit_restricted=True,
        nalla_neram=[],
    )


def test_muhurta_scores_krishna_paksha_favourable_tithi_by_paksha_number() -> None:
    """A Krishna tithi is matched on its *within-paksha* number, not its 1-30 one.

    Ported from `muhurta_service._score_panchangam` when the two copies of the
    generic almanac layer were folded into `muhurta_engine.score_day`; the
    regression it guards is in the fold, so it moved rather than went away.
    """
    favourable = score_day(_muhurta_snapshot(17), "PURCHASE")  # Krishna Dwitiya: in-paksha 2
    neutral = score_day(_muhurta_snapshot(20), "PURCHASE")     # Krishna Panchami: in-paksha 5

    assert favourable.score == neutral.score + 8

    def tithi_factor(day):
        return next(f for f in day.factors if f.factor == "ALMANAC_TITHI")

    assert tithi_factor(favourable).verdict is Verdict.BONUS
    assert "favourable tithi" in tithi_factor(favourable).reason_en.lower()
    assert tithi_factor(neutral).verdict is Verdict.NEUTRAL
