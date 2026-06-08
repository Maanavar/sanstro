from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.calculations.panchangam import _compute_subha_muhurtham_strict
from app.services.muhurta_service import _score_panchangam

pytestmark = pytest.mark.no_db


@pytest.mark.parametrize("yoga_name", ["VAIDHRITI", "VISHKAMBHA", "VAJRA"])
def test_ashubha_nitya_yogas_block_subha_muhurtham(yoga_name: str) -> None:
    is_subha, reason = _compute_subha_muhurtham_strict(
        2,
        "SHUKLA",
        "ROHINI",
        yoga_name,
        weekday_index=0,
        abhijit_restricted=False,
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
        abhijit_restricted=False,
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
    favourable_score, favourable_support, _ = _score_panchangam(
        _muhurta_snapshot(17),  # Krishna Dwitiya: within-paksha tithi 2
        activity="general",
        moon_rasi=1,
        lagna_rasi=1,
    )
    neutral_score, neutral_support, _ = _score_panchangam(
        _muhurta_snapshot(20),  # Krishna Panchami: within-paksha tithi 5
        activity="general",
        moon_rasi=1,
        lagna_rasi=1,
    )

    assert favourable_score == neutral_score + 8
    assert "Favourable tithi" in favourable_support.en
    assert "Favourable tithi" not in neutral_support.en
