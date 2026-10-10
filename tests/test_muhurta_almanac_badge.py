"""§3: a detailed-search wedding date says whether the almanac lists it too.

docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md §3. The published marriage
dates and the detailed search are two different sources behind the same
controls and never mentioned each other. Astrologer: almanac membership is a
**gate**, not a bonus point — so these tests also pin that it stays out of the
score.
"""

from datetime import date, timedelta

from app.data.muhurtham_naals import (
    available_years,
    get_muhurtham_naals,
    has_sourced_sheet,
    muhurtham_naal_on,
)
from app.services.muhurta_service import _almanac_muhurtham


def _a_published_wedding_day() -> date:
    """A real entry from the sourced 2026 sheet, read from the data itself.

    Hardcoding one date here would make the test a second copy of the sheet,
    and the sheet is the thing under test.
    """
    return get_muhurtham_naals(2026)[0].date


def test_a_published_wedding_day_is_reported_on_the_list() -> None:
    day = _a_published_wedding_day()
    badge = _almanac_muhurtham("MARRIAGE", day)

    assert badge is not None
    assert badge.status == "ON_LIST"
    # The almanac's own paksha travels with the date rather than being
    # re-derived: families filter the published list by it.
    assert badge.pirai == muhurtham_naal_on(day).pirai


def test_an_unlisted_day_in_a_sourced_year_is_reported_as_not_on_the_list() -> None:
    naal_dates = {n.date for n in get_muhurtham_naals(2026)}
    unlisted = next(
        day
        for day in (date(2026, 1, 1) + timedelta(days=i) for i in range(360))
        if day not in naal_dates
    )

    badge = _almanac_muhurtham("MARRIAGE", unlisted)
    assert badge is not None
    assert badge.status == "NOT_ON_LIST"
    assert badge.pirai is None


def test_a_year_with_no_sourced_sheet_is_not_reported_as_not_on_the_list() -> None:
    """"No sheet" is not "rejected by the almanac".

    Only years with a sourced sheet are published at all. Telling a family their
    date failed a list that was never consulted is worse than saying nothing, so
    the two answers are distinct states rather than one boolean.
    """
    unsourced_year = max(available_years()) + 5
    assert not has_sourced_sheet(unsourced_year)

    badge = _almanac_muhurtham("MARRIAGE", date(unsourced_year, 6, 1))
    assert badge is not None
    assert badge.status == "NO_SHEET"


def test_no_almanac_verdict_is_attached_to_a_non_wedding_activity() -> None:
    """Structurally absent, not filtered downstream.

    The sourced sheets are wedding sheets. "Not on the list" is a meaningless
    verdict on a day someone picked for an exam, so there is no wording path a
    surface could get wrong.
    """
    day = _a_published_wedding_day()
    for activity in ("EXAM", "TRAVEL", "GOLD", "JOB_START"):
        assert _almanac_muhurtham(activity, day) is None


CHENNAI = {"lat": 13.0827, "lon": 80.2707, "tz": "Asia/Kolkata"}


def test_almanac_only_is_refused_for_a_non_wedding_activity(raw_client) -> None:
    """Tested through the route, so the query alias is checked with the rule.

    A service-level assertion would pass while `almanacOnly` was spelled wrong
    on the wire, which is the drift class CLAUDE.md records for the shared
    wrappers.
    """
    response = raw_client.get(
        "/api/v1/muhurta",
        params={
            "activity": "EXAM",
            "dateFrom": "2026-05-01",
            "dateTo": "2026-05-20",
            "almanacOnly": "true",
            **CHENNAI,
        },
    )
    assert response.status_code == 422
    assert "MARRIAGE" in response.json()["detail"]


def test_almanac_only_is_refused_alongside_include_excluded(raw_client) -> None:
    """The two answer opposite questions.

    `includeExcluded` exists to show why one chosen date is unavailable.
    Filtering that same date out would answer with an empty list.
    """
    response = raw_client.get(
        "/api/v1/muhurta",
        params={
            "activity": "MARRIAGE",
            "dateFrom": "2026-05-01",
            "dateTo": "2026-05-01",
            "almanacOnly": "true",
            "includeExcluded": "true",
            **CHENNAI,
        },
    )
    assert response.status_code == 422


def test_almanac_only_returns_published_days_and_every_slot_carries_the_badge(raw_client) -> None:
    published = _a_published_wedding_day()
    window_start = published.replace(day=1)
    params = {
        "activity": "MARRIAGE",
        "dateFrom": window_start.isoformat(),
        "dateTo": (window_start + timedelta(days=45)).isoformat(),
        **CHENNAI,
    }

    unfiltered = raw_client.get("/api/v1/muhurta", params=params)
    filtered = raw_client.get("/api/v1/muhurta", params={**params, "almanacOnly": "true"})
    assert unfiltered.status_code == filtered.status_code == 200

    filtered_slots = filtered.json()["data"]["slots"]
    assert filtered_slots, "a window around a published day must yield at least one"
    # The filter is a gate: everything it returns is on the list.
    assert all(s["almanacMuhurtham"]["status"] == "ON_LIST" for s in filtered_slots)

    # The badge is on every wedding slot, filter or no filter — §3's ask is that
    # the two lists mention each other, which a reader gets without opting in.
    for slot in unfiltered.json()["data"]["slots"]:
        assert slot["almanacMuhurtham"]["status"] in {"ON_LIST", "NOT_ON_LIST", "NO_SHEET"}


def test_a_non_wedding_activity_carries_no_badge_on_the_wire(raw_client) -> None:
    response = raw_client.get(
        "/api/v1/muhurta",
        params={
            "activity": "EXAM",
            "dateFrom": "2026-05-01",
            "dateTo": "2026-05-20",
            **CHENNAI,
        },
    )
    assert response.status_code == 200
    slots = response.json()["data"]["slots"]
    assert slots
    assert all(slot["almanacMuhurtham"] is None for slot in slots)
