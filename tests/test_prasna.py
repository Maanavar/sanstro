from datetime import datetime

from app.calculations.prasna import cast_prasna_chart


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
