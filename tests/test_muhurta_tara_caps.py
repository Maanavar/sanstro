"""Owner-approved display caps for adverse nine-fold Tara Bala."""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.calculations.muhurta_engine import Subject, score_day
from app.calculations.panchangam import calculate_daily_panchangam
from app.calculations.tara_bala import tara_number
from app.services.muhurta_service import _apply_tara_display_cap

pytestmark = pytest.mark.no_db

_LATITUDE, _LONGITUDE, _TIMEZONE = 13.0827, 80.2707, "Asia/Kolkata"
_START = date(2026, 6, 1)
_DAYS = 60


@pytest.fixture(scope="module")
def snapshots():
    return [
        calculate_daily_panchangam(_START + timedelta(days=offset), _LATITUDE, _LONGITUDE, _TIMEZONE)
        for offset in range(_DAYS)
    ]


def test_adverse_taras_cannot_cross_the_owner_approved_display_bands(snapshots):
    """Sweep instead of a hand-picked day: caps must survive strong other layers."""
    subject = Subject(janma_nakshatra=1, janma_rasi=2, lagna_rasi=5)
    exercised = {3: 0, 5: 0, 7: 0}
    for snapshot in snapshots:
        day = score_day(snapshot, "MARRIAGE", subject)
        # A deliberately large addition stands in for every later non-veto layer
        # (dasha + hora): it proves the cap, rather than a weak day, enforces it.
        displayed_raw = _apply_tara_display_cap(day.score + 100.0, snapshot, subject)
        tara = tara_number(subject.janma_nakshatra, snapshot.nakshatra_number)
        if tara == 7:
            assert displayed_raw < 55.0
            exercised[tara] += 1
        elif tara in {3, 5}:
            assert displayed_raw < 75.0
            exercised[tara] += 1
    assert all(count > 0 for count in exercised.values())


def test_sourced_count_veto_is_not_reclassified_as_a_general_tara_cap(snapshots):
    subject = Subject(janma_nakshatra=1, janma_rasi=2, lagna_rasi=5)
    vetoed = None
    for snapshot in snapshots:
        day = score_day(snapshot, "SEEMANTHAM", subject)
        if any(factor.factor == "JANMA_TARA_COUNT" and factor.verdict.value == "VETO" for factor in day.factors):
            vetoed = day
            break
    assert vetoed is not None
    assert any(f.factor == "JANMA_TARA_COUNT" and f.verdict.value == "VETO" for f in vetoed.factors)
