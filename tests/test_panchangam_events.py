"""Tests for the Tamil-calendar special-event listings + Karinaal flag.

The pages are read off the daily panchangam engine (FCA-06, owner decision 4E,
2026-10-22), so these need the ephemeris but no database.
"""
from __future__ import annotations

from datetime import date
from itertools import pairwise

import pytest
from fastapi import HTTPException

from app.calculations.karinaal import KARINAAL_TAMIL_DAYS
from app.data.panchangam_events_2026 import PANCHANGAM_EVENTS_2026
from app.schemas.panchangam import PanchangamMonthlyQuery
from app.services import panchangam_events_service as svc
from app.services.panchangam_service import build_monthly_panchangam

pytestmark = pytest.mark.no_db

KARINAAL_COUNT = sum(len(days) for days in KARINAAL_TAMIL_DAYS.values())

# The curated 2026 almanac table, kept only as the reference
# scripts/audit/seo_events_vs_engine.py scores the engine against.
REFERENCE_COUNTS = {
    "amavasai": 12, "pournami": 13, "pradosham": 25, "karthigai": 13, "ashtami": 25,
    "navami": 24, "sashti": 12, "sankatahara-chathurthi": 13, "thiruvonam": 13,
    "maadha-sivarathiri": 12, "ekadhasi": 24, "chathurthi": 12, "chandra-darisanam": 12,
    # Karinaal is DERIVED (F-MUH-02) and deliberately absent from the curated
    # table, so it has no row here — see `test_karinaal_is_derived_not_curated`.
    # Major Tamil festivals (annual, one date each)
    "thai-pongal": 1, "tamil-puthandu": 1, "chithirai-vishu": 1, "panguni-uthiram": 1,
    "karthigai-deepam": 1, "vaikunta-ekadasi": 1, "aadi-perukku": 1,
}

# What the engine serves for 2026. Ekadashi sits one below the almanac's
# because the engine names no day for an Ekadashi that holds no sunrise
# (kshaya, Jul): whether it is observed on any day is doctrine, with the
# astrologer. Shukla Chathurthi takes §5 (the day it falls in) and is back
# at the almanac's 12.
ENGINE_COUNTS_2026 = {
    "pournami": 13, "amavasai": 12, "pradosham": 24, "ekadhasi": 23,
    "sankatahara-chathurthi": 13, "chathurthi": 12, "sashti": 12, "ashtami": 25,
    "navami": 24, "karthigai": 13, "thiruvonam": 13, "maadha-sivarathiri": 12,
    "chandra-darisanam": 12, "karinaal": KARINAAL_COUNT,
}

CHENNAI = {"lat": 13.0827, "lng": 80.2707, "timezone": "Asia/Kolkata"}


def test_karinaal_is_derived_not_curated():
    """F-MUH-02. The curated table must not carry Karinaal rows: they were
    dead once the rule took over, and they disagreed with it in four places,
    so a reader could not tell which was authoritative. The service reads the
    derivation, and its count follows the rule."""
    assert "karinaal" not in PANCHANGAM_EVENTS_2026
    assert len(svc.karinaal_dates(2026)) == KARINAAL_COUNT
    assert len(svc.karinaal_dates(2031)) == KARINAAL_COUNT, "derived, so every year works"


def test_reference_table_is_intact_and_sorted():
    assert set(PANCHANGAM_EVENTS_2026) == set(REFERENCE_COUNTS)
    for key, rows in PANCHANGAM_EVENTS_2026.items():
        assert len(rows) == REFERENCE_COUNTS[key], key
        iso = [r["date"] for r in rows]
        assert iso == sorted(iso), f"{key} not date-sorted"


def test_list_events_has_all_14_with_metadata():
    out = svc.list_events(2026, reference=date(2026, 1, 1))
    assert out["year"] == 2026
    assert [e["key"] for e in out["events"]] == list(svc.EVENT_ORDER)
    for e in out["events"]:
        assert e["name"]["ta"] and e["name"]["en"]
        assert e["slug"] == f"{e['key']}-2026"
        assert e["count"] == ENGINE_COUNTS_2026[e["key"]], e["key"]


@pytest.mark.parametrize("month", [1, 8, 11])
def test_pages_name_the_days_the_monthly_calendar_names(month: int):
    """FCA-06: one engine. Every page date in the month is a day the signed-in
    monthly calendar marks the same way, and no marked day is missing — read
    through `build_monthly_panchangam`, a separate path from the page's scan.
    August and November 2026 are months where the curated almanac and the
    sunrise rule (Q6) disagree on the Pournami or the Amavasai."""
    grid = build_monthly_panchangam(PanchangamMonthlyQuery(year=2026, month=month, **CHENNAI)).data.entries
    marked = {
        "pournami": {e.date_local for e in grid if e.special_tithi_day_number == 15},
        "amavasai": {e.date_local for e in grid if e.special_tithi_day_number == 30},
        "pradosham": {e.date_local for e in grid if {f.name for f in e.festivals} & {"Pradhosam", "Sani Pradhosam"}},
        "sashti": {e.date_local for e in grid if "Sashti" in {f.name for f in e.festivals}},
    }
    for key, days in marked.items():
        served = {
            date.fromisoformat(r["date"])
            for r in svc.get_event(key, 2026)["dates"]
            if date.fromisoformat(r["date"]).month == month
        }
        assert served == days, key


def test_august_2026_pournami_is_the_sunrise_day():
    """The case the curated page got wrong: Pournami holds the 28 Aug sunrise
    (ruling Q6); the almanac table printed 27 Aug."""
    dates = {r["date"] for r in svc.get_event("pournami", 2026)["dates"]}
    assert "2026-08-28" in dates and "2026-08-27" not in dates


def test_a_tithi_holding_two_sunrises_is_listed_once():
    """Ashtami and Navami take Q6's 'first of two' (an extension; Q6 names
    only Pournami and Amavasai). Before it, Navami 2026 listed 27 days."""
    for key in ("ashtami", "navami"):
        days = [date.fromisoformat(r["date"]) for r in svc.get_event(key, 2026)["dates"]]
        consecutive = [b for a, b in pairwise(days) if (b - a).days == 1]
        assert not consecutive, (key, consecutive)


def test_a_kshaya_chathurthi_names_the_day_it_falls_in():
    """§5. Shukla Chaturthi held no sunrise in April and July 2026, and the
    engine named no day; the almanac prints 20 Apr and 17 Jul. Every other
    month keeps its sunrise day, first of two."""
    dates = [r["date"] for r in svc.get_event("chathurthi", 2026)["dates"]]
    assert "2026-04-20" in dates and "2026-07-17" in dates
    assert len({d[:7] for d in dates}) == 12, "one Chathurthi in each month"


def test_2027_is_served():
    """FCA-07: the pages answered "No calendar published" for 2027."""
    out = svc.list_events(2027, reference=date(2027, 1, 1))
    assert all(e["count"] > 0 for e in out["events"])
    pournami = svc.get_event("pournami-2027", 2027, reference=date(2027, 1, 1))
    assert pournami["slug"] == "pournami-2027"
    assert pournami["keywords"][0] == "pournami 2027"


def test_next_date_logic():
    # mid-year reference -> next pournami is the first on/after that date
    out = svc.list_events(2026, reference=date(2026, 6, 15))
    pournami = next(e for e in out["events"] if e["key"] == "pournami")
    assert pournami["nextDate"] == "2026-06-29"
    # after the last date -> None
    late = svc.list_events(2026, reference=date(2026, 12, 31))
    amavasai = next(e for e in late["events"] if e["key"] == "amavasai")
    assert amavasai["nextDate"] is None  # last amavasai is 2026-12-08


def test_get_event_accepts_key_and_slug_and_enriches():
    by_key = svc.get_event("pournami", 2026, reference=date(2026, 1, 1))
    by_slug = svc.get_event("pournami-2026", 2026, reference=date(2026, 1, 1))
    assert by_key["count"] == by_slug["count"] == 13
    first = by_key["dates"][0]
    assert first["date"] == "2026-01-03"
    assert first["weekday"]["en"] == "Saturday"
    assert first["tamilDate"]["en"] and first["tamilDate"]["ta"]
    assert by_key["summary"]["en"] and by_key["significance"]["ta"]
    assert by_key["keywords"][0] == "pournami 2026"


def test_unknown_event_and_year_raise_404():
    with pytest.raises(HTTPException) as e1:
        svc.get_event("not-an-event", 2026)
    assert e1.value.status_code == 404
    with pytest.raises(HTTPException) as e2:
        svc.get_event("pournami", 2099)
    assert e2.value.status_code == 404
    with pytest.raises(HTTPException) as e3:
        svc.list_events(2099)
    assert e3.value.status_code == 404


def test_karinaal_helpers():
    kar = svc.karinaal_dates(2026)
    # Derived from the rule, not a literal — see test_karinaal_is_derived_not_curated.
    assert len(kar) == KARINAAL_COUNT
    assert svc.is_karinaal(date(2026, 1, 15)) is True
    assert svc.is_karinaal(date(2026, 1, 20)) is False
    # a Pournami date should not be Karinaal
    assert svc.is_karinaal(date(2026, 1, 3)) is False
