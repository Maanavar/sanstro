"""Query budgets for paths previously susceptible to N+1 regressions (P2-7b)."""
from __future__ import annotations

from datetime import UTC, date, datetime, time
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select

from app.api.admin import list_users
from app.db.session import SessionLocal
from app.models.birth_profile import BirthProfile
from app.models.chart import Chart
from app.models.family_member import FamilyMember
from app.models.user import User
from app.models.user_notification_preference import UserNotificationPreference
from app.services.daily_push_cron import run_daily_push_cron
from app.services.family_vault_service import _collect_member_snapshots


def _add_user_with_profile_and_chart(session, index: int) -> User:
    user = User(user_id=uuid4(), email=f"query-budget-{index}@example.test")
    session.add(user)
    session.flush()
    profile = BirthProfile(
        owner_user_id=user.user_id,
        display_name=f"Query Budget Person {index}",
        birth_date_local=date(1990, 1, index + 1),
        birth_time_local=time(6, 30),
        birth_place="Synthetic Test City",
        birth_latitude=Decimal("1.234500"),
        birth_longitude=Decimal("2.345600"),
        birth_timezone="UTC",
    )
    session.add(profile)
    session.flush()
    session.add(
        Chart(
            birth_profile_id=profile.birth_profile_id,
            calculation_version="query-budget-test",
            julian_day=Decimal("2451545.00000000"),
            lagna_rasi="Mesha",
            lagna_longitude=Decimal("15.25000000"),
            moon_rasi="Rishabha",
            janma_nakshatra="Ashwini",
            janma_pada=1,
        )
    )
    return user


def test_admin_user_list_uses_constant_query_count(client, query_counter) -> None:
    """The list endpoint must not add two count queries for every rendered user."""
    with SessionLocal() as session:
        with session.begin():
            users = [_add_user_with_profile_and_chart(session, index) for index in range(3)]

        with query_counter() as counter:
            response = list_users(page=1, page_size=50, session=session, admin_user=users[0])

    summaries = {item.email: item for item in response.items}
    for index in range(3):
        summary = summaries[f"query-budget-{index}@example.test"]
        assert summary.birth_profile_count == 1
        assert summary.chart_count == 1

    # Total, page, profile aggregate, chart aggregate. This fails against the
    # original O(users) implementation (two extra SELECTs for every user).
    assert counter.count <= 4


def _add_user_with_morning_alert(session, index: int) -> User:
    """A user opted into the morning alert but with no birth profile.

    The dispatcher bails out as soon as it finds no profile, so what this
    measures is the cron's *per-user lookup* cost and nothing downstream of it.
    """
    user = User(user_id=uuid4(), email=f"push-budget-{index}@example.test")
    session.add(user)
    session.flush()
    session.add(
        UserNotificationPreference(
            owner_user_id=user.user_id,
            morning_alert_enabled=True,
            notification_channel="none",
        )
    )
    return user


def test_daily_push_cron_does_not_look_users_up_one_at_a_time(client, query_counter) -> None:
    """The cron read every opted-in user with its own SELECT (P2-7b path 3)."""
    user_count = 6
    with SessionLocal() as session:
        with session.begin():
            for index in range(user_count):
                _add_user_with_morning_alert(session, index)

    with query_counter() as counter:
        summary = run_daily_push_cron(datetime(2026, 9, 3, 6, 0, tzinfo=UTC))

    # Every user is skipped for want of a birth profile; none is dropped.
    assert summary["skipped"] == user_count
    assert summary["errors"] == 0

    # Fixed overhead (queued-notification scan, the preference query, one batched
    # user query) plus exactly one profile lookup per user. Measured: 14 queries
    # for 6 users before the fix, 9 after — the difference is the per-user
    # session.get that grew one-for-one with the opted-in cohort.
    assert counter.count <= user_count + 4


def test_family_member_snapshots_batch_their_profile_and_chart_lookups(
    client, query_counter, family_vault_payload_factory, family_member_payload_factory
) -> None:
    """Each member cost its own profile SELECT and chart SELECT (P2-7b path 2).

    The per-member snapshot work (chart load, panchangam, transits) is genuinely
    per member and is not what this pins. What it pins is the *lookup* pair in
    front of it, which the batch prefetch collapses to two queries for the whole
    vault however many members it holds.
    """
    member_count = 3
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code == 200
    family_vault_id = vault.json()["data"]["familyVaultId"]

    for index in range(member_count):
        created = client.post(
            f"/api/v1/family-vaults/{family_vault_id}/members",
            json=family_member_payload_factory(display_name=f"Synthetic Member {index}"),
        )
        assert created.status_code == 200

    with SessionLocal() as session:
        members = session.execute(
            select(FamilyMember)
            .where(FamilyMember.family_vault_id == UUID(family_vault_id))
            .order_by(FamilyMember.created_at.asc())
        ).scalars().all()
        assert len(members) == member_count

        with query_counter() as counter:
            snapshots = _collect_member_snapshots(session, list(members), date(2026, 9, 3), {})

    assert len(snapshots) == member_count
    # Measured: 16 queries for 3 members before the fix, 12 after. The removed
    # 2-per-member pair is the profile lookup and the chart lookup, now two
    # queries for the whole vault; what remains scales with members because
    # loading a chart is genuinely per-member work.
    assert counter.count <= 12
