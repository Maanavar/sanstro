from __future__ import annotations

from collections import defaultdict
from datetime import date
from itertools import pairwise
from unittest import mock

import pytest

from app.calculations import festivals
from app.calculations.festivals import get_festivals_for_date
from app.data.calendar_categories_2026 import (
    CALENDAR_CATEGORY_EVENTS_2026,
    CALENDAR_CATEGORY_META,
    events_for_category,
)
from app.services.calendar_category_service import get_calendar_category, list_calendar_categories
from app.services.panchangam_cache import calculate_daily_panchangam_range
from app.services.panchangam_service import _build_festivals

pytestmark = pytest.mark.no_db


@pytest.fixture(scope="module")
def engine_days_2026() -> dict[str, set[date]]:
    """Each festival name the engine gives in 2026, and its days — with the
    curated rows switched off, so it is the engine alone that answers."""
    snapshots = calculate_daily_panchangam_range(
        date(2025, 12, 31), date(2026, 12, 31), 13.0827, 80.2707, "Asia/Kolkata",
    )
    days: dict[str, set[date]] = defaultdict(set)
    ordered = [snapshots[d] for d in sorted(snapshots)]
    with mock.patch.object(festivals, "category_events_for_date", lambda _d: []):
        for previous, snapshot in pairwise(ordered):
            for festival in _build_festivals(snapshot, previous_day_snapshot=previous):
                days[festival.name].add(snapshot.date_local)
    return days


def test_curated_rows_agree_with_the_engine(engine_days_2026):
    """4E / FCA-06: one source of truth. A curated Hindu row that names a
    festival the engine also computes must sit on one of the engine's days.
    Two did not (Maasi Magam 2 Mar, Varalakshmi 21 Aug), and the calendar
    showed each festival on two days. When the astrologer's rulings move the
    engine (OPEN_ITEMS 1A-E, 1A-G), this test moves the row with it.

    Blind spot: rows the engine does not compute (24 of 53: temple days,
    Agni Nakshatram, …) are not checked against anything."""
    disagree = [
        (row.name_en, row.date.isoformat(), sorted(d.isoformat() for d in engine_days_2026[row.name_en]))
        for row in events_for_category("hindu-festivals-2026", 2026)
        if row.name_en in engine_days_2026 and row.date not in engine_days_2026[row.name_en]
    ]
    assert not disagree


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


@pytest.mark.parametrize(
    ("year", "easter"),
    [(2000, date(2000, 4, 23)), (2024, date(2024, 3, 31)), (2025, date(2025, 4, 20)),
     (2026, date(2026, 4, 5)), (2027, date(2027, 3, 28)), (2038, date(2038, 4, 25))],
)
def test_easter_by_the_gregorian_computus(year, easter):
    from app.calculations.christian_calendar import easter_sunday

    assert easter_sunday(year) == easter


def test_computed_christian_feasts_match_the_curated_2026_list():
    """The curated list is the computed one, so 2027 on is the same ten days."""
    from app.calculations.christian_calendar import christian_feasts

    curated = [(row.date, row.name_en, row.name_ta) for row in events_for_category("christian-festivals-2026", 2026)]
    computed = [(feast.date, feast.name_en, feast.name_ta) for feast in christian_feasts(2026)]
    assert computed == curated


def test_a_later_year_has_the_computed_categories_only():
    """Hindu (engine) and Christian (computed) have pages every published
    year; Muslim (moon sighting) and the TN government list need a published
    list, so 2027 has no page for either rather than a guessed one."""
    from fastapi import HTTPException

    out = list_calendar_categories(2027, reference=date(2027, 1, 1))
    assert [c["slug"] for c in out["categories"]] == ["hindu-festivals-2027", "christian-festivals-2027"]
    christian = get_calendar_category("christian-festivals-2027", reference=date(2027, 1, 1))
    assert ("2027-03-26", "Good Friday") in {(e["date"], e["name"]["en"]) for e in christian["events"]}
    for slug, year in (("muslim-festivals-2027", None), ("hindu-festivals-2027", 2026), ("pournami-2027", None)):
        with pytest.raises(HTTPException):
            get_calendar_category(slug, year)
    with pytest.raises(HTTPException):
        list_calendar_categories(2050)


def test_hindu_festivals_of_a_later_year_come_from_the_engine():
    """2027 dates from the owner-supplied 2027 almanac (FCA-07). Every name is
    a yearly observance with a Tamil form; the monthly vratas, which have their
    own event pages, never appear."""
    from app.services.calendar_category_service import HINDU_YEARLY_NAMES

    out = get_calendar_category("hindu-festivals-2027", reference=date(2027, 1, 1))
    rows = {(e["date"], e["name"]["en"]) for e in out["events"]}
    for expected in (("2027-01-15", "Thai Pongal"), ("2027-07-28", "Aadi Krithigai"),
                     ("2027-08-13", "Varalakshmi Vratham"), ("2027-08-25", "Krishna Jayanthi"),
                     ("2027-10-08", "Ayudha Pooja"), ("2027-10-09", "Vijayadasami"),
                     ("2027-12-11", "Karthigai Deepam")):
        assert expected in rows
    shown = {en for en, _ta in HINDU_YEARLY_NAMES.values()}
    assert {e["name"]["en"] for e in out["events"]} <= shown
    assert all(e["name"]["ta"] and e["name"]["ta"] != e["name"]["en"] for e in out["events"])


def test_every_hindu_name_the_engine_gives_is_classified():
    """A yearly festival added to the engine must reach the category page, and
    a monthly one must not: each name is either listed or known monthly."""
    from app.services.calendar_category_service import HINDU_YEARLY_NAMES
    from app.services.panchangam_events_service import hindu_festival_days

    monthly = {
        "Pradhosam", "Sani Pradhosam", "Ekadashi (Shukla)", "Ekadashi (Krishna)", "Sankatahara Chaturthi",
        "Angarki Sankatahara Chaturthi", "Chathurthi", "Sashti", "Theipirai Ashtami", "Masa Sivarathiri",
        "Thiruvonam Vratam", "Rohini Vratam", "Karthigai Vratam",
    }
    # 2025 carries hand-entered rows; 2027 does not. Neither may leak a name.
    for year in (2025, 2027):
        names = {name for row in hindu_festival_days(year) for name in row["names"]}
        assert names - monthly - set(HINDU_YEARLY_NAMES) == set(), year


def test_a_hand_entered_row_neither_doubles_nor_drops_a_festival():
    """2025 carries hand-entered rows. Where one disagrees with the engine
    (Krishna Jayanthi, 16 Aug against the engine's 15) the page lists the
    engine's day only; where one agrees (Deepavali 20 Oct, Karthigai Deepam
    4 Dec) the festival is still listed, once."""
    out = get_calendar_category("hindu-festivals-2025", reference=date(2025, 1, 1))
    days = defaultdict(list)
    for event in out["events"]:
        days[event["name"]["en"]].append(event["date"])
    assert days["Krishna Jayanthi"] == ["2025-08-15"]
    assert days["Deepavali"] == ["2025-10-20"]
    assert days["Karthigai Deepam"] == ["2025-12-04"]
    assert days["Bhogi"] == ["2025-01-13"]


def test_computed_christian_feasts_reach_the_dashboard_after_2026():
    out = get_festivals_for_date(
        date(2027, 3, 26), tithi_number=19, tithi_paksha="KRISHNA", nakshatra_name="SWATHI", weekday="FRIDAY",
    )
    assert {"name": "Good Friday", "category": "christian", "tags": ["christian"]} in out
    christmas = get_festivals_for_date(
        date(2027, 12, 25), tithi_number=1, tithi_paksha="SHUKLA", nakshatra_name="ASWINI", weekday="SATURDAY",
    )
    assert [r["category"] for r in christmas if r["name"] == "Christmas"].count("christian") == 1
    # The fixed government row of the same name must not swallow the Christian
    # one: rows of one name merge into one, carrying both tags.
    new_year = get_festivals_for_date(
        date(2027, 1, 1), tithi_number=24, tithi_paksha="KRISHNA", nakshatra_name="CHITHIRAI", weekday="FRIDAY",
    )
    (row,) = [r for r in new_year if r["name"] == "New Year's Day"]
    assert {"tamilnadu_govt", "christian"} <= set(row["tags"])


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
