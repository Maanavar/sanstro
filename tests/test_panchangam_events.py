"""Tests for the curated Tamil-calendar special-event listings + Karinaal flag.

Pure data + arithmetic (no DB, no ephemeris) — runs anywhere.
"""
from __future__ import annotations

from datetime import date

import pytest
from fastapi import HTTPException

from app.data.panchangam_events_2026 import PANCHANGAM_EVENTS_2026
from app.services import panchangam_events_service as svc

pytestmark = pytest.mark.no_db

EXPECTED_COUNTS = {
    "amavasai": 12, "pournami": 13, "pradosham": 25, "karthigai": 13, "ashtami": 25,
    "navami": 24, "sashti": 12, "sankatahara-chathurthi": 13, "thiruvonam": 13,
    "maadha-sivarathiri": 12, "ekadhasi": 24, "chathurthi": 12, "chandra-darisanam": 12,
    "karinaal": 34,
}


def test_data_matches_expected_counts_and_is_sorted():
    assert set(PANCHANGAM_EVENTS_2026) == set(EXPECTED_COUNTS)
    for key, rows in PANCHANGAM_EVENTS_2026.items():
        assert len(rows) == EXPECTED_COUNTS[key], key
        iso = [r["date"] for r in rows]
        assert iso == sorted(iso), f"{key} not date-sorted"


def test_list_events_has_all_14_with_metadata():
    out = svc.list_events(2026, reference=date(2026, 1, 1))
    assert out["year"] == 2026
    assert len(out["events"]) == 14
    keys = {e["key"] for e in out["events"]}
    assert keys == set(EXPECTED_COUNTS)
    for e in out["events"]:
        assert e["name"]["ta"] and e["name"]["en"]
        assert e["slug"] == f"{e['key']}-2026"
        assert e["count"] == EXPECTED_COUNTS[e["key"]]


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
    assert len(kar) == 34
    assert svc.is_karinaal(date(2026, 1, 15)) is True
    assert svc.is_karinaal(date(2026, 1, 20)) is False
    # a Pournami date should not be Karinaal
    assert svc.is_karinaal(date(2026, 1, 3)) is False
