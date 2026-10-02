"""Life Focus tuning gates (Phase 4, second half).

The merge/retire question is judged only among the readers a focus is offered
to, by a rule fixed before any production data. See
docs/LIFE_FOCUS_PLAN_2026-09-22.md §5 Phase 4 "Tuning rule".
"""
from __future__ import annotations

from datetime import date
from uuid import uuid4

from app.api.admin_analytics import rarely_picked, wilson_upper
from app.db.session import SessionLocal
from app.models.birth_profile import BirthProfile
from app.models.user import User
from app.models.user_preference import UserPreference

METRICS = "/api/v1/admin/analytics/life-focus"


def _years_ago(years: int) -> date:
    today = date.today()
    return date(today.year - years, 1, 1)


def _reader(*, life_mode: str | None, age: int | None = None, marital_status: str | None = None) -> None:
    """A synthetic reader, optionally with their own birth profile."""
    user_id = uuid4()
    with SessionLocal() as session, session.begin():
        session.add(User(user_id=user_id, email=f"tuning-{user_id.hex[:8]}@example.invalid"))
        session.flush()
        if life_mode is not None:
            session.add(UserPreference(preference_id=uuid4(), owner_user_id=user_id, life_mode=life_mode, show_life_mode_picker=False))
        if age is not None:
            session.add(
                BirthProfile(
                    owner_user_id=user_id,
                    display_name="Synthetic Reader",
                    birth_date_local=_years_ago(age),
                    birth_place="Synthetic Town",
                    birth_latitude=13.0,
                    birth_longitude=80.0,
                    birth_timezone="Asia/Kolkata",
                    marital_status=marital_status,
                )
            )


# ── The rule, as numbers ─────────────────────────────────────────────────────


def test_a_small_sample_never_flags_anything():
    # 0 of 399 would be 0%, but 399 readers is below the floor.
    assert rarely_picked({"LOVE": 399}, {"LOVE": 0}) == []


def test_rare_with_enough_readers_is_flagged():
    # 4 of 1000 = 0.4%; the Wilson upper bound is ~1.0%.
    assert rarely_picked({"LOVE": 1000}, {"LOVE": 4}) == ["LOVE"]


def test_the_share_threshold_is_strict_at_the_floor():
    # At the 400-reader floor: 7 of 400 (1.75%, upper bound ~3.6%) clears both
    # tests; 8 of 400 is exactly 2.0%, which is not under 2%.
    assert wilson_upper(7, 400) < 0.04
    assert rarely_picked({"LOVE": 400}, {"LOVE": 7}) == ["LOVE"]
    assert rarely_picked({"LOVE": 400}, {"LOVE": 8}) == []


def test_a_low_point_share_with_a_wide_interval_is_not_flagged():
    # The bound narrows with n: 1 of 60 is 1.7%, but its upper bound is ~9%,
    # while 19 of 1000 (1.9%) is tight enough to sit under 4%.
    assert wilson_upper(19, 1000) < 0.04
    assert wilson_upper(1, 60) > 0.04


def test_balanced_is_the_default_and_never_a_candidate():
    assert rarely_picked({"BALANCED": 5000}, {"BALANCED": 0}) == []


# ── Who a focus is offered to ────────────────────────────────────────────────


def test_offered_base_applies_the_age_and_marital_gate(client):
    # The client's own account has no profile: offered all ten.
    _reader(life_mode="CAREER", age=30, marital_status="married")  # no LOVE, no MARRIAGE
    _reader(life_mode="LOVE", age=55, marital_status="single")       # LOVE yes, MARRIAGE no
    _reader(life_mode="MARRIAGE", age=28, marital_status="single")   # both offered
    _reader(life_mode=None, age=15)                                   # minor: neither

    body = client.get(METRICS).json()
    assert body["total_users"] == 5
    assert body["offered_users"]["LOVE"] == 3        # client, 55 single, 28 single
    assert body["offered_users"]["MARRIAGE"] == 2    # client, 28 single
    assert body["offered_users"]["CAREER"] >= 4      # everyone but the minor
    assert body["offered_pick_share"]["LOVE"] == round(1 / 3, 4)
    assert body["offered_pick_share"]["MARRIAGE"] == 0.5
    # Raw mode_counts would put LOVE at 1 of 5; among readers offered it, 1 of 3.
    assert body["mode_counts"]["LOVE"] == 1
    assert body["rarely_picked"] == []  # far below the 400-reader floor
