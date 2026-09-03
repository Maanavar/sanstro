"""Query budgets for paths previously susceptible to N+1 regressions (P2-7b)."""
from __future__ import annotations

from datetime import date, time
from decimal import Decimal
from uuid import uuid4

from app.api.admin import list_users
from app.db.session import SessionLocal
from app.models.birth_profile import BirthProfile
from app.models.chart import Chart
from app.models.user import User


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
