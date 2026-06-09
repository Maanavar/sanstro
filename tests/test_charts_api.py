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
    assert "bhavaChalit" in body["data"]
    assert "vargas" in body["data"]
    assert "nakshatraAnalysis" in body["data"]
    assert "birthPanchangamSignature" in body["data"]

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


def test_chart_summary_includes_validation_status_when_events_exist(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": created["data"]["birthProfileId"],
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    ).json()["data"]["chartId"]
    event_payload = {
        "eventType": "JOB_CHANGE",
        "eventDate": "2018-05-15",
        "description": "Changed job",
    }
    event_resp = client.post(f"/api/v1/charts/{chart_id}/life-event-log", json=event_payload)
    assert event_resp.status_code == 200

    response = client.get(f"/api/v1/charts/{chart_id}/summary", params={"language": "ta-en"})
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["chartValidationStatus"] in {"HIGH", "MEDIUM", "LOW", "UNVALIDATED"}


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


def test_chart_explanation_endpoint_returns_structured_payload(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]

    response = client.get(
        f"/api/v1/charts/{chart_id}/explanation",
        params={"asOf": "2026-05-21", "peyarchiWindowDays": 30},
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["chartId"] == chart_id
    assert body["coreIdentity"]["lagnaRasi"]
    assert body["coreIdentity"]["currentMahadasha"]
    assert len(body["planets"]) == 9
    assert {item["graha"] for item in body["planets"]} >= {"SUN", "MOON", "JUPITER", "SATURN", "RAHU", "KETU"}
    assert all(item["explanation"]["ta"] and item["explanation"]["en"] for item in body["planets"])
    assert "JUPITER" in body["functionalNature"]
    assert isinstance(body["conjunctions"], list)
    assert isinstance(body["aspects"], list)
    assert all(item["aspectType"] for item in body["aspects"])
    assert {item["group"] for item in body["houseGroups"]} == {"KENDRA", "TRIKONA", "DUSTHANA"}
    assert "yogas" in body["yogaDosham"]
    assert "doshams" in body["yogaDosham"]
    assert body["currentActivation"]["asOf"] == "2026-05-21"
    assert body["currentActivation"]["periodSummary"]["en"]
    assert body["currentActivation"]["transitSummary"]["en"]
    assert len(body["currentActivation"]["activeLords"]) == 3
    assert {item["level"] for item in body["currentActivation"]["activeLords"]} == {"MAHADASHA", "BHUKTI", "ANTARAM"}
    for item in body["currentActivation"]["activeLords"]:
        assert item["lord"]
        assert item["startDate"]
        assert item["endDate"]
        assert item["natalHouseFromLagna"] in range(1, 13)
        assert item["natalHouseFromMoon"] in range(1, 13)
        assert item["transitHouseFromLagna"] in range(1, 13)
        assert item["transitHouseFromMoon"] in range(1, 13)
        assert item["periodTone"] in {"SUPPORT", "STEADY", "CAUTION"}
        assert item["lifeAreas"]
        assert item["explanation"]["ta"]
        assert item["explanation"]["en"]
    assert body["summary"]["positives"]
    assert body["summary"]["cautions"]
    assert body["peyarchi"]["asOf"] == "2026-05-21"
    assert isinstance(body["peyarchi"]["events"], list)
    assert body["methodNote"]["en"]


def test_chart_explanation_includes_expanded_rahu_ketu_peyarchi_notes(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]

    response = client.get(
        f"/api/v1/charts/{chart_id}/explanation",
        params={"asOf": "2026-05-21", "peyarchiWindowDays": 700},
    )

    assert response.status_code == 200
    events = response.json()["data"]["peyarchi"]["events"]
    rahu_event = next(item for item in events if item["planet"] == "RAHU")
    ketu_event = next(item for item in events if item["planet"] == "KETU")
    assert "Rahu/Ketu axis" in rahu_event["explanation"]["en"]
    assert "Ketu" in rahu_event["explanation"]["en"]
    assert "Rahu/Ketu axis" in ketu_event["explanation"]["en"]
    assert "Rahu" in ketu_event["explanation"]["en"]


def test_solar_return_endpoint_includes_tajaka_pairs(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/solar-return", params={"year": 2026})
    assert response.status_code == 200
    data = response.json()["data"]
    assert "itthasalaPairs" in data
    assert "isarafaPairs" in data
    assert isinstance(data["itthasalaPairs"], list)
    assert isinstance(data["isarafaPairs"], list)


def test_varshaphala_endpoint_returns_annual_outlook(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/varshaphala", params={"year": 2026})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["year"] == 2026
    assert "yearLord" in data
    assert isinstance(data["areaOutlook"], list) and len(data["areaOutlook"]) >= 5


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
