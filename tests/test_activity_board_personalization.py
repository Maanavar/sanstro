"""Life-stage personalisation of the daily activity board (ActivityAudience).

The board answers "what is an auspicious muhurtam to *begin* today"; these tests
pin that it only ever asks questions that apply to the native — a married person
is never shown a marriage muhurtam, a retiree never a job-change one — while
never changing the verdict of a question that IS asked.
"""
from __future__ import annotations

import pytest

from app.calculations.activity_timing_rules import (
    ActivityAudience,
    daily_activity_board,
)

# Pournami / Shukla / Thursday — the most supportive combination, so every
# activity that survives the roster filter lands somewhere visible.
_GOOD_DAY = (15, "SHUKLA", "JUPITER")


def _activities(board) -> set[str]:
    return {v.activity for v in board.favourable + board.caution + board.neutral}


@pytest.mark.no_db
def test_no_audience_is_unchanged() -> None:
    """The default board (no profile context) still lists all eleven — existing
    callers and tests must see no behaviour change."""
    plain = daily_activity_board(*_GOOD_DAY)
    withnone = daily_activity_board(*_GOOD_DAY, audience=None)
    assert _activities(plain) == _activities(withnone)
    assert "marriage" in _activities(plain)


@pytest.mark.no_db
def test_married_native_is_not_shown_marriage() -> None:
    aud = ActivityAudience(age=40, marital_status="married")
    acts = _activities(daily_activity_board(*_GOOD_DAY, audience=aud))
    assert "marriage" not in acts


@pytest.mark.no_db
def test_married_native_within_window_still_sees_starting_a_family() -> None:
    aud = ActivityAudience(age=30, marital_status="married", gender="male")
    acts = _activities(daily_activity_board(*_GOOD_DAY, audience=aud))
    assert "child_birth" in acts


@pytest.mark.no_db
def test_child_birth_hidden_for_the_unmarried() -> None:
    aud = ActivityAudience(age=28, marital_status="single")
    acts = _activities(daily_activity_board(*_GOOD_DAY, audience=aud))
    assert "child_birth" not in acts
    assert "marriage" in acts  # ...but marriage still applies


@pytest.mark.no_db
def test_child_birth_hidden_past_the_child_bearing_window() -> None:
    female = ActivityAudience(age=47, marital_status="married", gender="female")
    male = ActivityAudience(age=47, marital_status="married", gender="male")
    assert "child_birth" not in _activities(daily_activity_board(*_GOOD_DAY, audience=female))
    # The male window is wider — 47 is still within it.
    assert "child_birth" in _activities(daily_activity_board(*_GOOD_DAY, audience=male))


@pytest.mark.no_db
def test_seniors_past_prime_lose_marriage() -> None:
    aud = ActivityAudience(age=58, marital_status="single")
    acts = _activities(daily_activity_board(*_GOOD_DAY, audience=aud))
    assert "marriage" not in acts


@pytest.mark.no_db
def test_seeking_native_sees_remarriage_reframe() -> None:
    aud = ActivityAudience(age=44, marital_status="divorced")
    board = daily_activity_board(*_GOOD_DAY, audience=aud)
    marriage = next(
        v for v in board.favourable + board.caution + board.neutral if v.activity == "marriage"
    )
    assert "Remarriage" in marriage.label_en


@pytest.mark.no_db
def test_retiree_is_not_shown_job_or_business_starts() -> None:
    aud = ActivityAudience(age=68, marital_status="married", employment_type="retired")
    acts = _activities(daily_activity_board(*_GOOD_DAY, audience=aud))
    assert "job_change" not in acts
    assert "business_start" not in acts
    # But wellbeing/spiritual/family remain.
    assert {"health", "family_harmony", "spiritual"} <= acts


@pytest.mark.no_db
def test_minor_sees_only_age_appropriate_activities() -> None:
    aud = ActivityAudience(age=15, employment_type="student")
    acts = _activities(daily_activity_board(*_GOOD_DAY, audience=aud))
    assert acts <= {"education", "family_harmony", "health", "spiritual", "travel_abroad"}
    assert "marriage" not in acts
    assert "money" not in acts
    assert "education" in acts


@pytest.mark.no_db
def test_young_child_sees_only_health_and_family() -> None:
    aud = ActivityAudience(age=3)
    acts = _activities(daily_activity_board(*_GOOD_DAY, audience=aud))
    assert acts == {"health", "family_harmony"}


@pytest.mark.no_db
def test_resident_abroad_reframes_travel() -> None:
    aud = ActivityAudience(age=35, marital_status="married", is_abroad=True)
    board = daily_activity_board(*_GOOD_DAY, audience=aud)
    travel = next(
        v for v in board.favourable + board.caution + board.neutral if v.activity == "travel_abroad"
    )
    assert "Relocation" in travel.label_en or "relocation" in travel.label_en


@pytest.mark.no_db
def test_personalisation_never_changes_a_surviving_verdict() -> None:
    """Filtering the roster must not move an activity between green/amber/slate."""
    aud = ActivityAudience(age=40, marital_status="married")
    plain = daily_activity_board(*_GOOD_DAY)
    personal = daily_activity_board(*_GOOD_DAY, audience=aud)

    def bucket(board):
        b = {}
        for v in board.favourable:
            b[v.activity] = "SUPPORTS"
        for v in board.caution:
            b[v.activity] = "CAUTION"
        for v in board.neutral:
            b[v.activity] = "NEUTRAL"
        return b

    plain_b, personal_b = bucket(plain), bucket(personal)
    for activity, verdict in personal_b.items():
        assert plain_b[activity] == verdict
