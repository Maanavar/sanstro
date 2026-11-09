"""Deferred-checks plan, item 4: the medical safety line.

Whatever the star tables eventually say, a medical muhurta must never suggest
delaying urgent care or prescribed treatment. So every MEDICAL response, on
every muhurta route, carries the key `medical_doctor_first`, which
`packages/shared/src/muhurtaSafety.ts` words. No other activity carries it.

Synthetic birth details only.
"""
from __future__ import annotations

import pytest

from app.services.muhurta_service import SAFETY_NOTICES_BY_ACTIVITY, safety_notices_for

_BIRTH = {
    "displayName": "Synthetic Reader",
    "birthDateLocal": "1991-02-11",
    "birthTimeLocal": "07:40:00",
    "birthLatitude": 11.0,
    "birthLongitude": 78.0,
    "birthTimezone": "Asia/Kolkata",
    "birthPlace": "Synthetic Town",
}
_WHERE = {"lat": 13.0827, "lng": 80.2707, "timezone": "Asia/Kolkata"}


@pytest.mark.no_db
def test_medical_resolves_to_the_doctor_first_key_through_aliases() -> None:
    assert safety_notices_for("MEDICAL") == ("medical_doctor_first",)
    assert safety_notices_for(" medical ") == ("medical_doctor_first",)
    assert safety_notices_for("MARRIAGE") == ()
    assert set(SAFETY_NOTICES_BY_ACTIVITY) == {"MEDICAL"}


@pytest.mark.parametrize(("activity", "expected"), [("MEDICAL", ["medical_doctor_first"]), ("JOB_START", [])])
def test_the_personalized_route_carries_the_key_for_medical_only(client, activity, expected) -> None:
    response = client.post(
        "/api/v1/public/muhurta/personalized",
        json={
            "birth": _BIRTH, "eventType": activity,
            "dateFrom": "2026-12-01", "dateTo": "2026-12-03",
            **_WHERE, "place": "Chennai",
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["data"]["safetyNotices"] == expected


@pytest.mark.parametrize(("activity", "expected"), [("MEDICAL", ["medical_doctor_first"]), ("TRAVEL", [])])
def test_the_public_route_carries_the_key_for_medical_only(client, activity, expected) -> None:
    response = client.post(
        "/api/v1/public/muhurta",
        json={"eventType": activity, "dateFrom": "2026-12-01", "dateTo": "2026-12-03", **_WHERE},
    )
    assert response.status_code == 200, response.text
    assert response.json()["safetyNotices"] == expected


def test_the_key_never_moves_a_score(client) -> None:
    """Not a factor: the same day scores the same whether or not the line is
    attached. Checked by comparing MEDICAL against itself with the table
    emptied, which is also this gate's negative run."""
    import app.services.muhurta_service as ms

    payload = {
        "birth": _BIRTH, "eventType": "MEDICAL",
        "dateFrom": "2026-12-01", "dateTo": "2026-12-03", **_WHERE, "place": "Chennai",
    }
    with_line = client.post("/api/v1/public/muhurta/personalized", json=payload).json()["data"]
    saved = dict(ms.SAFETY_NOTICES_BY_ACTIVITY)
    ms.SAFETY_NOTICES_BY_ACTIVITY.clear()
    try:
        without = client.post("/api/v1/public/muhurta/personalized", json=payload).json()["data"]
    finally:
        ms.SAFETY_NOTICES_BY_ACTIVITY.update(saved)
    assert with_line["safetyNotices"] == ["medical_doctor_first"]
    assert without["safetyNotices"] == []
    assert [(s["date"], s["score"], s["band"]) for s in with_line["slots"]] == [
        (s["date"], s["score"], s["band"]) for s in without["slots"]
    ]
