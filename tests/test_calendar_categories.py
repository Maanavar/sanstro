from __future__ import annotations

from datetime import date

import pytest

from app.calculations.festivals import get_festivals_for_date
from app.data.calendar_categories_2026 import (
    CALENDAR_CATEGORY_EVENTS_2026,
    CALENDAR_CATEGORY_META,
    events_for_category,
)
from app.services.calendar_category_service import get_calendar_category, list_calendar_categories

pytestmark = pytest.mark.no_db


EXPECTED_COUNTS = {
    "hindu-festivals-2026": 53,
    "muslim-festivals-2026": 6,
    "christian-festivals-2026": 10,
    "tamil-nadu-government-holidays-2026": 26,
}


def test_calendar_category_data_counts_and_weekdays_are_valid():
    assert set(CALENDAR_CATEGORY_META) == set(EXPECTED_COUNTS)
    for slug, expected_count in EXPECTED_COUNTS.items():
        rows = events_for_category(slug, 2026)
        assert len(rows) == expected_count
        assert [row.date for row in rows] == sorted(row.date for row in rows)
        assert all(row.date.strftime("%A") for row in rows)

    assert all(event.date.year == 2026 for event in CALENDAR_CATEGORY_EVENTS_2026)


def test_calendar_category_service_returns_bilingual_rows():
    out = get_calendar_category("muslim-festivals-2026", 2026, reference=date(2026, 1, 1))

    assert out["slug"] == "muslim-festivals-2026"
    assert out["count"] == 6
    assert out["nextDate"] == "2026-02-19"
    first = out["events"][0]
    assert first["date"] == "2026-02-19"
    assert first["weekday"]["en"] == "Thursday"
    assert first["name"]["en"] == "Ramzan Begins"
    assert first["name"]["ta"]
    assert first["note"]["en"]


def test_list_calendar_categories_has_only_category_pages():
    out = list_calendar_categories(2026, reference=date(2026, 6, 15))
    slugs = {category["slug"] for category in out["categories"]}

    assert slugs == set(EXPECTED_COUNTS)
    assert "pongal-2026" not in slugs
    tn = next(category for category in out["categories"] if category["slug"] == "tamil-nadu-government-holidays-2026")
    assert tn["nextDate"] == "2026-06-26"


def test_category_events_feed_dashboard_festival_lookup():
    festivals = get_festivals_for_date(
        date(2026, 3, 29),
        tithi_number=11,
        tithi_paksha="SHUKLA",
        nakshatra_name="PUNARPOOSAM",
        weekday="SUNDAY",
        tamil_month_index=11,
        special_tithi_day_number=None,
    )

    palm_sunday = next(item for item in festivals if item["name"] == "Palm Sunday")
    assert palm_sunday["category"] == "christian"
    assert palm_sunday["tags"] == ["christian"]
