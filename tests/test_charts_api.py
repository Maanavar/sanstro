from datetime import UTC, datetime

import pytest

from app.calculations.astro import navamsa_rasi_from_degree


def test_birth_profile_create_endpoint_persists_and_returns_chart(client, birth_profile_payload_factory):
    response = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory())

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["calculationStatus"] == "completed"
    assert body["data"]["chartId"] is not None


def test_chart_calculate_endpoint_uses_persisted_birth_profile(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    birth_profile_id = created["data"]["birthProfileId"]

    response = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["calculationStatus"] == "completed"
    assert body["data"]["birthProfile"]["birthProfileId"] == birth_profile_id
    assert body["data"]["birthDateTimeUTC"].startswith("1991-07-22T01:00:00")
    assert body["data"]["ephemerisBackend"] in {"pyswisseph", "swisseph-ffi"}
    assert body["data"]["ayanamsa"]["type"] == "LAHIRI"
    assert body["data"]["ayanamsa"]["valueDegrees"] == pytest.approx(23.7391, abs=0.01)
    assert "yogas" in body["data"]
    assert "doshams" in body["data"]
    assert len(body["data"]["yogas"]) >= 1
    assert len(body["data"]["doshams"]) >= 1
    assert all("dashaActivated" in item for item in body["data"]["yogas"])
    assert all(item["descriptionTa"] and item["descriptionEn"] for item in body["data"]["yogas"])
    assert all(item["descriptionTa"] and item["descriptionEn"] for item in body["data"]["doshams"])

    planets = {planet["graha"]: planet for planet in body["data"]["planets"]}
    assert len(planets) == 9
    assert planets["SUN"]["absoluteLongitude"] == pytest.approx(95.0158, abs=0.01)
    assert planets["MOON"]["absoluteLongitude"] == pytest.approx(223.5993, abs=0.01)
    assert planets["RAHU"]["absoluteLongitude"] == pytest.approx(264.6921, abs=0.01)
    assert planets["KETU"]["absoluteLongitude"] == pytest.approx(84.6921, abs=0.01)
    assert planets["SUN"]["showRetrogradeBadge"] is False
    assert planets["MOON"]["showRetrogradeBadge"] is False
    assert planets["RAHU"]["showRetrogradeBadge"] is False
    assert planets["KETU"]["showRetrogradeBadge"] is False
    assert body["data"]["lagna"]["rasi"] in range(1, 13)
    assert body["data"]["lagna"]["absoluteLongitude"] == pytest.approx(
        body["data"]["lagna"]["absoluteLongitude"] % 360,
        abs=1e-9,
    )
    for planet in planets.values():
        assert planet["houseFromLagna"] in range(1, 13)
        assert planet["d9Rasi"] == navamsa_rasi_from_degree(planet["absoluteLongitude"])
        assert "showRetrogradeBadge" in planet
    assert planets["KETU"]["absoluteLongitude"] == pytest.approx(
        (planets["RAHU"]["absoluteLongitude"] + 180.0) % 360.0,
        abs=1e-9,
    )


def test_chart_summary_endpoint_returns_dashboard_payload(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    birth_profile_id = created["data"]["birthProfileId"]
    chart_id = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    ).json()["data"]["chartId"]

    response = client.get(f"/api/v1/charts/{chart_id}/summary", params={"language": "ta-en"})

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["chartId"] == chart_id
    assert body["displayName"] == "Arjun Kumar"
    today = datetime.now(tz=UTC).date()
    expected_age = today.year - 1991 - (1 if (today.month, today.day) < (7, 22) else 0)
    assert body["currentAge"] == expected_age
    assert body["primaryLanguageText"]["en"]
    assert body["currentMahadasha"]
    assert body["currentAntardasha"]
    assert "functionalNature" in body
    assert "JUPITER" in body["functionalNature"]
    assert "ashtakavarga" in body
    assert "SUN" in body["ashtakavarga"]
    assert len(body["ashtakavarga"]["SUN"]) == 12


def test_dasha_endpoint_honours_level_parameter(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    birth_profile_id = created["data"]["birthProfileId"]
    chart_id = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    ).json()["data"]["chartId"]

    response = client.get(f"/api/v1/charts/{chart_id}/dasha", params={"asOf": "2026-05-21", "level": "maha"})

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["timeline"]
    assert all(item["level"] == "maha" for item in body["timeline"])


def test_jadhagam_report_endpoint_returns_structured_payload(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    birth_profile_id = created["data"]["birthProfileId"]
    chart_id = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    ).json()["data"]["chartId"]

    response = client.get(f"/api/v1/charts/{chart_id}/jadhagam-report")

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["chartId"] == chart_id
    assert "birthProfile" in body
    assert "coreIdentity" in body
    assert "functionalNatureTable" in body
    assert "JUPITER" in body["functionalNatureTable"]
    assert "planetaryStrengthSummary" in body
    assert "executiveSummary" in body


def test_chart_calculate_rejects_inline_birth_profile(client):
    response = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfile": {
                "ownerUserId": "11111111-1111-1111-1111-111111111111",
                "displayName": "Arjun Kumar",
                "birthDateLocal": "1991-07-22",
                "birthTimeLocal": "06:30:00",
                "birthPlace": "Chennai, Tamil Nadu, India",
                "birthLatitude": 13.0827,
                "birthLongitude": 80.2707,
                "birthTimezone": "Asia/Kolkata",
                "calculateNow": True,
            },
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )

    assert response.status_code == 422
