"""Database-backed tests for the daily push cron's row lookups.

Kept separate from ``test_daily_push_cron.py``, which is marked ``no_db`` and
drives the cron entirely through mocks. The defect these cover is invisible to a
mock: it lives in the emitted SQL, not in the Python around it.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, time
from decimal import Decimal
from uuid import UUID, uuid4

from app.db.session import SessionLocal
from app.models.birth_profile import BirthProfile
from app.models.family_member import FamilyMember
from app.models.user import User
from app.services.daily_push_cron import _own_profile


def _synthetic_profile(
    user: User, name: str, created_at: datetime, member: FamilyMember | None = None
) -> BirthProfile:
    """A birth profile with an explicit created_at so ordering is deterministic.

    Postgres' ``now()`` is transaction time, so two rows inserted in one
    transaction would otherwise share a timestamp and the ordering would be
    arbitrary.
    """
    return BirthProfile(
        owner_user_id=user.user_id,
        family_member_id=member.family_member_id if member else None,
        display_name=name,
        birth_date_local=date(1990, 1, 1),
        birth_time_local=time(6, 30),
        birth_place="Synthetic Test City",
        birth_latitude=Decimal("1.234500"),
        birth_longitude=Decimal("2.345600"),
        birth_timezone="UTC",
        created_at=created_at,
    )


def _synthetic_member(user: User, relationship: str) -> FamilyMember:
    return FamilyMember(
        owner_user_id=user.user_id,
        relationship_to_owner=relationship,
        display_name=f"Synthetic {relationship.title()}",
    )


def _new_user(session, prefix: str) -> User:
    user = User(user_id=uuid4(), email=f"{prefix}-{uuid4().hex[:8]}@example.test")
    session.add(user)
    session.flush()
    return user


def _own_profile_name(user_id: UUID) -> str | None:
    with SessionLocal() as session:
        profile = _own_profile(session, user_id)
        return profile.display_name if profile else None


def test_own_profile_ignores_a_newer_family_member_profile(client) -> None:
    """Audit N2 (2026-11-03): alerts were computed on a family member's chart.

    The lookup took the newest owned profile, and a family member's profile is
    owned by the same user, so adding one moved every alert onto that chart.
    Ordering by ``created_at.desc()`` without the family filter fails this.
    """
    with SessionLocal() as session:
        with session.begin():
            user = _new_user(session, "push-family")
            member = _synthetic_member(user, "spouse")
            session.add(member)
            session.flush()
            session.add_all(
                [
                    _synthetic_profile(user, "Own Synthetic Person", datetime(2026, 1, 1, tzinfo=UTC)),
                    _synthetic_profile(
                        user, "Family Synthetic Person", datetime(2026, 6, 1, tzinfo=UTC), member
                    ),
                ]
            )
            user_id = user.user_id

    assert _own_profile_name(user_id) == "Own Synthetic Person"


def test_own_profile_prefers_the_oldest_personal_profile(client) -> None:
    """Two personal profiles yield the oldest — the onboarding one.

    Newer personal profiles are temp profiles from tools such as
    chart-generate; dashboard restore already prefers the oldest, and the push
    must speak about the same chart the dashboard shows. This also keeps the
    earlier guard: without ``.limit(1)`` a second row raised
    ``MultipleResultsFound`` and the user silently got no alert.
    """
    with SessionLocal() as session:
        with session.begin():
            user = _new_user(session, "push-profile")
            session.add_all(
                [
                    _synthetic_profile(user, "Older Synthetic Person", datetime(2026, 1, 1, tzinfo=UTC)),
                    _synthetic_profile(user, "Newer Synthetic Person", datetime(2026, 6, 1, tzinfo=UTC)),
                ]
            )
            user_id = user.user_id

    assert _own_profile_name(user_id) == "Older Synthetic Person"


def test_own_profile_ignores_soft_deleted_profiles(client) -> None:
    """An older but soft-deleted profile must not win the ordering."""
    with SessionLocal() as session:
        with session.begin():
            user = _new_user(session, "push-deleted")
            removed = _synthetic_profile(user, "Removed Synthetic Person", datetime(2026, 1, 1, tzinfo=UTC))
            removed.deleted_at = datetime(2026, 6, 2, tzinfo=UTC)
            live = _synthetic_profile(user, "Live Synthetic Person", datetime(2026, 6, 1, tzinfo=UTC))
            session.add_all([live, removed])
            user_id = user.user_id

    assert _own_profile_name(user_id) == "Live Synthetic Person"


def test_own_profile_accepts_a_self_family_member(client) -> None:
    """A user whose only own chart is filed as relationship ``self`` still gets alerts."""
    with SessionLocal() as session:
        with session.begin():
            user = _new_user(session, "push-self")
            me = _synthetic_member(user, "self")
            other = _synthetic_member(user, "child")
            session.add_all([me, other])
            session.flush()
            session.add_all(
                [
                    _synthetic_profile(user, "Child Synthetic Person", datetime(2026, 1, 1, tzinfo=UTC), other),
                    _synthetic_profile(user, "Self Synthetic Person", datetime(2026, 6, 1, tzinfo=UTC), me),
                ]
            )
            user_id = user.user_id

    assert _own_profile_name(user_id) == "Self Synthetic Person"


def test_own_profile_is_none_when_only_family_charts_exist(client) -> None:
    """No own chart means no alert, not an alert about a relative."""
    with SessionLocal() as session:
        with session.begin():
            user = _new_user(session, "push-only-family")
            member = _synthetic_member(user, "parent")
            session.add(member)
            session.flush()
            session.add(
                _synthetic_profile(user, "Parent Synthetic Person", datetime(2026, 1, 1, tzinfo=UTC), member)
            )
            user_id = user.user_id

    assert _own_profile_name(user_id) is None
