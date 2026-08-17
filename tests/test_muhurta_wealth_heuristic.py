"""Owner-approved, explicitly unsourced 2nd/11th wealth heuristic."""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.calculations.muhurta_engine import wealth_house_heuristic_factor
from app.services.muhurta_service import _apply_in_band_heuristic_bonus

pytestmark = pytest.mark.no_db


def _body(rasi: int, longitude: float, *, retrograde: bool = False) -> SimpleNamespace:
    return SimpleNamespace(rasi=rasi, absolute_longitude=longitude, is_retrograde=retrograde)


def test_wealth_heuristic_uses_unafflicted_benefic_at_selected_lagna_house():
    factor = wealth_house_heuristic_factor(
        "GOLD",
        1,
        {
            "SUN": _body(5, 120.0),
            "JUPITER": _body(2, 35.0),
        },
    )

    assert factor is not None
    assert factor.factor == "WEALTH_HOUSE_HEURISTIC"
    assert factor.contribution == 1.0
    assert factor.rule_id is None
    assert "product heuristic" in factor.reason_en
    assert "கலப்பிரகாசிகை விதியல்ல" in factor.reason_ta


@pytest.mark.parametrize(
    "bodies",
    [
        # A natural malefic in the second house blocks the condition entirely.
        {"SUN": _body(5, 120.0), "JUPITER": _body(2, 35.0), "MARS": _body(2, 45.0)},
        # Venus is in the eleventh but combust, so it cannot qualify.
        {"SUN": _body(11, 300.0), "VENUS": _body(11, 305.0)},
        # A malefic conjoined with the otherwise qualifying benefic disqualifies it.
        {"SUN": _body(5, 120.0), "MERCURY": _body(11, 320.0), "SATURN": _body(11, 325.0)},
    ],
)
def test_wealth_heuristic_rejects_afflicted_or_malefic_placements(bodies):
    assert wealth_house_heuristic_factor("GOLD", 1, bodies) is None


def test_wealth_heuristic_never_moves_a_picker_result_across_a_display_band():
    assert _apply_in_band_heuristic_bonus(72.0, 1.0) == 73.0
    assert _apply_in_band_heuristic_bonus(74.5, 1.0) == 74.9
    assert _apply_in_band_heuristic_bonus(74.95, 1.0) == 74.95
    assert _apply_in_band_heuristic_bonus(54.5, 1.0) == 54.9
