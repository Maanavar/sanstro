from __future__ import annotations

from datetime import date
from uuid import uuid4

from app.calculations.panchangam import calculate_daily_panchangam_range


def _create_chart(client) -> str:
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "Muhurta Test",
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


def test_muhurta_happy_path(client):
    chart_id = _create_chart(client)
    response = client.get(
        f"/api/v1/charts/{chart_id}/muhurta",
        params={"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-03"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["activity"] == "SPIRITUAL"
    assert body["data"]["timezone"] == "Asia/Kolkata"
    assert body["data"]["activityLocation"] == {
        "place": "Chennai, Tamil Nadu, India",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "timezone": "Asia/Kolkata",
        "source": "birth",
    }
    assert isinstance(body["data"]["slots"], list)


def test_muhurta_requires_auth(raw_client):
    response = raw_client.get(
        f"/api/v1/charts/{uuid4()}/muhurta",
        params={"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-03"},
    )
    assert response.status_code == 401


def test_muhurta_not_found_for_missing_chart(client):
    response = client.get(
        f"/api/v1/charts/{uuid4()}/muhurta",
        params={"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-03"},
    )
    assert response.status_code == 404


def test_muhurta_activity_location_changes_the_returned_window(client):
    """The event location, not the birthplace, anchors day timings."""
    chart_id = _create_chart(client)
    params = {"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-01"}
    chennai = client.get(f"/api/v1/charts/{chart_id}/muhurta", params=params)
    coimbatore = client.get(
        f"/api/v1/charts/{chart_id}/muhurta",
        params={**params, "lat": 11.0168, "lon": 76.9558, "tz": "Asia/Kolkata"},
    )

    assert chennai.status_code == coimbatore.status_code == 200
    chennai_data = chennai.json()["data"]
    coimbatore_data = coimbatore.json()["data"]
    assert coimbatore_data["activityLocation"] == {
        "place": "Selected activity location",
        "latitude": 11.0168,
        "longitude": 76.9558,
        "timezone": "Asia/Kolkata",
        "source": "activity",
    }
    assert chennai_data["slots"] and coimbatore_data["slots"]
    assert (
        chennai_data["slots"][0]["timeStart"],
        chennai_data["slots"][0]["timeEnd"],
    ) != (
        coimbatore_data["slots"][0]["timeStart"],
        coimbatore_data["slots"][0]["timeEnd"],
    )
    on_date = date(2026, 6, 1)
    chennai_snapshot = calculate_daily_panchangam_range(
        on_date, on_date, 13.0827, 80.2707, "Asia/Kolkata",
    )[on_date]
    coimbatore_snapshot = calculate_daily_panchangam_range(
        on_date, on_date, 11.0168, 76.9558, "Asia/Kolkata",
    )[on_date]
    assert chennai_snapshot.sunrise != coimbatore_snapshot.sunrise
    assert chennai_snapshot.gowri_panchangam[0].start != coimbatore_snapshot.gowri_panchangam[0].start


def test_general_muhurta_requires_activity_location_and_never_claims_personal_data(raw_client):
    params = {"activity": "SPIRITUAL", "dateFrom": "2026-06-01", "dateTo": "2026-06-01"}
    missing_location = raw_client.get("/api/v1/muhurta", params=params)
    assert missing_location.status_code == 422

    response = raw_client.get(
        "/api/v1/muhurta",
        params={**params, "lat": 11.0168, "lon": 76.9558, "tz": "Asia/Kolkata"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["chartId"] is None
    assert data.get("dashaSupport") is None
    assert all(slot.get("horaSupport") is None for slot in data["slots"])


def test_query_chart_id_keeps_the_muhurta_owner_gate(raw_client):
    response = raw_client.get(
        "/api/v1/muhurta",
        params={
            "chartId": str(uuid4()),
            "activity": "SPIRITUAL",
            "dateFrom": "2026-06-01",
            "dateTo": "2026-06-01",
            "lat": 11.0168,
            "lon": 76.9558,
            "tz": "Asia/Kolkata",
        },
    )
    assert response.status_code == 401


def test_selected_date_assessment_returns_a_saturday_veto_instead_of_hiding_it(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/muhurta",
        params={
            "activity": "EAR_BORING",
            "dateFrom": "2026-10-24",
            "dateTo": "2026-10-24",
            "includeExcluded": "true",
        },
    )

    assert response.status_code == 200
    slots = response.json()["data"]["slots"]
    assert len(slots) == 1
    assert slots[0]["recommended"] is False
    assert slots[0]["band"] == "NOT_RECOMMENDED"
    vara = next(factor for factor in slots[0]["factors"] if factor["factor"] == "VARA")
    assert vara["verdict"] == "VETO"
    assert "Saturday" in vara["reason"]["en"]


def test_selected_date_assessment_rejects_a_range(raw_client):
    response = raw_client.get(
        "/api/v1/muhurta",
        params={
            "activity": "EAR_BORING",
            "dateFrom": "2026-10-24",
            "dateTo": "2026-10-25",
            "includeExcluded": "true",
            "lat": 13.0827,
            "lon": 80.2707,
            "tz": "Asia/Kolkata",
        },
    )
    assert response.status_code == 422
