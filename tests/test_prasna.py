from datetime import datetime

from app.calculations.prasna import cast_prasna_chart, prasna_outlook


def test_cast_prasna_chart_returns_required_fields():
    out = cast_prasna_chart(
        question_datetime_local=datetime(2026, 6, 1, 10, 30),
        timezone_name="Asia/Kolkata",
        latitude=13.0827,
        longitude=80.2707,
        question_area="MARRIAGE",
    )
    assert 1 <= out["prasna_lagna_rasi"] <= 12
    assert 1 <= out["moon_rasi"] <= 12
    assert out["question_area"] == "MARRIAGE"
    assert out["karaka"] == "VENUS"
    assert out["outlook"] in {"FAVOURABLE", "UNFAVOURABLE", "MIXED", "DELAY"}


def test_l15_tenth_house_karaka_is_never_delay():
    """L-15: the 10th is a kendra (positive) house, not upachaya — a karaka
    in the 10th must never also read DELAY, which contradicted its own
    positive indicator before the fix."""
    chart = {
        "karaka_house": 10,
        "positive_indicators": ["VENUS in kendra/trikona from Prasna Lagna"],
        "negative_indicators": [],
    }
    assert prasna_outlook(chart, {}) != "DELAY"


def test_l15_upachaya_karaka_still_reads_delay():
    """The pure upachaya houses {3, 6, 11} must still trigger DELAY."""
    for house in (3, 6, 11):
        chart = {
            "karaka_house": house,
            "positive_indicators": ["VENUS in upachaya house (results with effort/time)"],
            "negative_indicators": [],
        }
        assert prasna_outlook(chart, {}) == "DELAY"
