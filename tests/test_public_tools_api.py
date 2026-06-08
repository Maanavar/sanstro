from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.no_db


def _birth_payload(name: str, birth_date: str, birth_time: str) -> dict[str, object]:
    return {
        "displayName": name,
        "birthDateLocal": birth_date,
        "birthTimeLocal": birth_time,
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "birthPlace": "Chennai",
    }


def test_public_chart_accepts_marketing_site_payload() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/public/chart",
            json={"birth": _birth_payload("Marketing Tool User", "1990-01-01", "12:00")},
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["data"]["birthProfile"]["displayName"] == "Marketing Tool User"
    assert body["data"]["birthProfile"]["birthDateLocal"] == "1990-01-01"


def test_public_porutham_accepts_marketing_site_payload() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/public/porutham",
            json={
                "personA": _birth_payload("Person A", "1990-01-01", "12:00"),
                "personB": _birth_payload("Person B", "1992-02-02", "13:00"),
                "compatibilityContext": "MARRIAGE",
            },
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["data"]["boyNakshatraName"]
    assert body["data"]["girlNakshatraName"]


def test_public_panchangam_returns_daily_snapshot() -> None:
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.get(
            "/api/v1/public/panchangam?date=2026-06-02&lat=13.0827&lng=80.2707&timezone=Asia%2FKolkata"
        )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["data"]["dateLocal"] == "2026-06-02"
    assert body["data"]["tamilDate"]["en"]
    assert body["data"]["location"]["timezone"] == "Asia/Kolkata"
