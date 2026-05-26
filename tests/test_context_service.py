from datetime import date
from types import SimpleNamespace

from app.services.context_service import should_surface_proactively


def test_should_surface_for_job_stress_when_saturn_pressure():
    context = SimpleNamespace(
        life_situation={"job": "stressed"},
        active_events=[],
    )
    result = should_surface_proactively(
        context,
        for_date=date(2026, 5, 23),
        score_label="GOOD",
        saturn_house_from_moon=10,
    )
    assert result.should_surface is True
    assert "job-pressure" in result.en


def test_should_not_surface_without_context():
    result = should_surface_proactively(
        None,
        for_date=date(2026, 5, 23),
        score_label="GOOD",
        saturn_house_from_moon=10,
    )
    assert result.should_surface is False
