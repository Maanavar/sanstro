"""Database-backed tests for the daily push cron's row lookups.

Kept separate from ``test_daily_push_cron.py``, which is marked ``no_db`` and
drives the cron entirely through mocks. The defect these cover is invisible to a
mock: it lives in the emitted SQL, not in the Python around it.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, time
from decimal import Decimal
from uuid import uuid4

from app.db.session import SessionLocal
from app.models.birth_profile import BirthProfile
from app.models.user import User
from app.services.daily_push_cron import _latest_active_profile


def _synthetic_profile(user: User, name: str, created_at: datetime) -> BirthProfile:
    """A birth profile with an explicit created_at so ordering is deterministic.

    Postgres' ``now()`` is transaction time, so two rows inserted in one
    transaction would otherwise share a timestamp and "latest" would be
    arbitrary.
    """
    return BirthProfile(
        owner_user_id=user.user_id,
        display_name=name,
        birth_date_local=date(1990, 1, 1),
        birth_time_local=time(6, 30),
        birth_place="Synthetic Test City",
        birth_latitude=Decimal("1.234500"),
        birth_longitude=Decimal("2.345600"),
        birth_timezone="UTC",
        created_at=created_at,
    )


def test_latest_active_profile_returns_newest_when_a_user_has_several(client) -> None:
    """Two active profiles must yield the newest, not raise MultipleResultsFound.

    ``_latest_active_profile`` ordered by ``created_at.desc()`` but omitted
    ``.limit(1)``, so ``scalar_one_or_none()`` raised ``MultipleResultsFound``
    for any user with a second active profile — the cron then logged an error
    and silently sent that user no morning alert. Its sibling
    ``_latest_completed_chart`` had the limit all along.

    Without the ``.limit(1)`` this test raises rather than fails.
    """
    with SessionLocal() as session:
        with session.begin():
            user = User(user_id=uuid4(), email=f"push-profile-{uuid4().hex[:8]}@example.test")
            session.add(user)
            session.flush()
            session.add_all(
                [
                    _synthetic_profile(user, "Older Synthetic Person", datetime(2026, 1, 1, tzinfo=UTC)),
                    _synthetic_profile(user, "Newer Synthetic Person", datetime(2026, 6, 1, tzinfo=UTC)),
                ]
            )
            user_id = user.user_id

        profile = _latest_active_profile(session, user_id)

        assert profile is not None
        assert profile.display_name == "Newer Synthetic Person"


def test_latest_active_profile_ignores_soft_deleted_profiles(client) -> None:
    """A newer but soft-deleted profile must not win the ordering."""
    with SessionLocal() as session:
        with session.begin():
            user = User(user_id=uuid4(), email=f"push-deleted-{uuid4().hex[:8]}@example.test")
            session.add(user)
            session.flush()
            live = _synthetic_profile(user, "Live Synthetic Person", datetime(2026, 1, 1, tzinfo=UTC))
            removed = _synthetic_profile(user, "Removed Synthetic Person", datetime(2026, 6, 1, tzinfo=UTC))
            removed.deleted_at = datetime(2026, 6, 2, tzinfo=UTC)
            session.add_all([live, removed])
            user_id = user.user_id

        profile = _latest_active_profile(session, user_id)

        assert profile is not None
        assert profile.display_name == "Live Synthetic Person"
