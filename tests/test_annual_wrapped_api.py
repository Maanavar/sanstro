from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from app.db.session import SessionLocal
from app.models.chart import Chart
from app.models.daily_score import DailyScore


def _create_chart(client) -> str:
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "Wrapped Test",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )
    assert created.status_code == 200
    birth_profile_id = created.json()["data"]["birthProfileId"]

    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200
    return chart.json()["data"]["chartId"]


def _seed_score_for_year(chart_id: str, year: int) -> None:
    with SessionLocal() as session:
        chart = session.get(Chart, UUID(chart_id))
        assert chart is not None
        session.add(
            DailyScore(
                birth_profile_id=chart.birth_profile_id,
                score_date=date(year, 6, 1),
                score=68,
                label="GOOD",
                data={},
            )
        )
        session.commit()


def test_annual_wrapped_happy_path(client):
    chart_id = _create_chart(client)
    _seed_score_for_year(chart_id, 2026)
    response = client.get(f"/api/v1/charts/{chart_id}/annual-wrapped", params={"year": 2026})
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "data" in body


def test_annual_wrapped_requires_auth(raw_client):
    response = raw_client.get(f"/api/v1/charts/{uuid4()}/annual-wrapped", params={"year": 2026})
    assert response.status_code == 401


def test_annual_wrapped_not_found_for_missing_chart(client):
    response = client.get(f"/api/v1/charts/{uuid4()}/annual-wrapped", params={"year": 2026})
    assert response.status_code == 404
