"""Tests for the curated Tamil-calendar special-event listings + Karinaal flag.

Pure data + arithmetic (no DB, no ephemeris) — runs anywhere.
"""
from __future__ import annotations

from datetime import date

import pytest
from fastapi import HTTPException

from app.calculations.karinaal import KARINAAL_TAMIL_DAYS
from app.data.panchangam_events_2026 import PANCHANGAM_EVENTS_2026
from app.services import panchangam_events_service as svc

pytestmark = pytest.mark.no_db

EXPECTED_COUNTS = {
    "amavasai": 12, "pournami": 13, "pradosham": 25, "karthigai": 13, "ashtami": 25,
    "navami": 24, "sashti": 12, "sankatahara-chathurthi": 13, "thiruvonam": 13,
    "maadha-sivarathiri": 12, "ekadhasi": 24, "chathurthi": 12, "chandra-darisanam": 12,
    # Karinaal is DERIVED (F-MUH-02) and deliberately absent from the curated
    # table, so it has no row here — see `test_karinaal_is_derived_not_curated`.
    # Major Tamil festivals (annual, one date each)
    "thai-pongal": 1, "tamil-puthandu": 1, "chithirai-vishu": 1, "panguni-uthiram": 1,
    "karthigai-deepam": 1, "vaikunta-ekadasi": 1, "aadi-perukku": 1,
}


def test_karinaal_is_derived_not_curated():
    """F-MUH-02. The curated table must not carry Karinaal rows: they were
    dead once the rule took over, and they disagreed with it in four places,
    so a reader could not tell which was authoritative. The service reads the
    derivation, and its count follows the rule."""
    assert "karinaal" not in PANCHANGAM_EVENTS_2026
    expected = sum(len(days) for days in KARINAAL_TAMIL_DAYS.values())
    assert len(svc.karinaal_dates(2026)) == expected
    assert len(svc.karinaal_dates(2031)) == expected, "derived, so every year works"


def test_data_matches_expected_counts_and_is_sorted():
    assert set(PANCHANGAM_EVENTS_2026) == set(EXPECTED_COUNTS)
    for key, rows in PANCHANGAM_EVENTS_2026.items():
        assert len(rows) == EXPECTED_COUNTS[key], key
        iso = [r["date"] for r in rows]
        assert iso == sorted(iso), f"{key} not date-sorted"


def test_list_events_has_all_14_with_metadata():
    from app.services.panchangam_events_service import EVENT_ORDER
    out = svc.list_events(2026, reference=date(2026, 1, 1))
    assert out["year"] == 2026
    assert len(out["events"]) == len(EVENT_ORDER)
    keys = {e["key"] for e in out["events"]}
    assert keys == set(EVENT_ORDER)
    for e in out["events"]:
        assert e["name"]["ta"] and e["name"]["en"]
        assert e["slug"] == f"{e['key']}-2026"
        # Karinaal is derived, so its count comes from the rule rather than
        # from the curated table EXPECTED_COUNTS mirrors.
        expected = (
            sum(len(days) for days in KARINAAL_TAMIL_DAYS.values())
            if e["key"] == "karinaal"
            else EXPECTED_COUNTS[e["key"]]
        )
        assert e["count"] == expected, e["key"]


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
    assert len(kar) == sum(len(days) for days in KARINAAL_TAMIL_DAYS.values())
    assert svc.is_karinaal(date(2026, 1, 15)) is True
    assert svc.is_karinaal(date(2026, 1, 20)) is False
    # a Pournami date should not be Karinaal
    assert svc.is_karinaal(date(2026, 1, 3)) is False
