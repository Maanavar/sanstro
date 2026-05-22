import pytest


def _birth_profile_payload():
    return {
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Arjun Kumar",
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Chennai, Tamil Nadu, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    }


def _create_chart(client):
    created = client.post("/api/v1/birth-profiles", json=_birth_profile_payload())
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


def test_gochar_current_returns_transit_snapshot(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/gochar/current",
        params={"datetime": "2026-05-21T05:00:00Z"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["janmaRasi"] == "DHANUSU"
    assert body["data"]["isChandrashtama"] is True

    transits = {item["graha"]: item for item in body["data"]["transits"]}
    assert len(transits) == 9
    assert transits["SANI"]["currentRasi"] == "MEENAM"
    assert transits["SANI"]["houseFromMoon"] == 4
    assert transits["SANI"]["interpretationKey"] == "SANI_FROM_MOON_4"
    assert transits["SANI"]["isRetrograde"] is False
    assert transits["RAHU"]["isRetrograde"] is True
    assert transits["KETU"]["isRetrograde"] is True
    assert transits["MOON"]["houseFromMoon"] == 8
    assert transits["MOON"]["isSandhi"] in {True, False}
    assert transits["SUN"]["isGandanta"] in {True, False}


def test_gochar_current_accepts_date_only_and_defaults_to_noon(client):
    chart_id = _create_chart(client)

    response = client.get(f"/api/v1/charts/{chart_id}/gochar/current", params={"date": "2026-05-21"})

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["asOfUTC"].startswith("2026-05-21")


def test_sani_cycle_endpoint_uses_dhanusu_moon_golden_case(client):
    chart_id = _create_chart(client)

    response = client.get(f"/api/v1/charts/{chart_id}/sani-cycle", params={"date": "2026-05-21"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["saturnRasi"] == "MEENAM"
    assert body["data"]["janmaRasi"] == "DHANUSU"
    assert body["data"]["positionFromMoon"] == 4
    assert body["data"]["moonBasedCycle"]["type"] == "ARDHASHTAMA_SANI"
    assert body["data"]["moonBasedCycle"]["isActive"] is True
    assert body["data"]["moonBasedCycle"]["supportiveLabel"] == "Home and inner stability refinement cycle"
    assert body["data"]["lagnaBasedCycle"]["isActive"] in {True, False}
    assert "not Ezharai Sani" in body["data"]["confirmationSentence"]


def test_major_transits_endpoint_filters_to_major_grahas(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/transits/major",
        params={"datetime": "2026-05-21T05:00:00Z"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True

    transits = [item["graha"] for item in body["data"]["transits"]]
    assert transits == ["GURU", "SANI", "RAHU", "KETU"]
