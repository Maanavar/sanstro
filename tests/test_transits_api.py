import pytest

from app.calculations.astro import house_from_reference
from app.calculations.transits import classify_sani_cycle


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


# ── Unit: Ardhashtama Sani classification (no birth profile required) ──────────

def test_ardhashtama_sani_dhanusu_moon_saturn_meenam():
    # Dhanusu moon (9), Saturn in Meenam (12): house_from = 4 → Ardhashtama
    cycle = classify_sani_cycle(house_from_reference("Dhanusu", "Meenam"))
    assert cycle.type == "ARDHASHTAMA_SANI"
    assert cycle.is_active is True


def test_sani_classification_not_ardhashtama_for_other_positions():
    # Viruchigam moon (8), Saturn in Meenam (12): house_from = 5 → no special cycle
    cycle = classify_sani_cycle(house_from_reference("Viruchigam", "Meenam"))
    assert cycle.type is None


# ── Integration: API tests using real fixture chart ────────────────────────────

def test_gochar_current_returns_transit_snapshot(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/gochar/current",
        params={"datetime": "2026-05-13T00:00:00Z"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["janmaRasi"] == "VIRUCHIGAM"

    transits = {item["graha"]: item for item in body["data"]["transits"]}
    assert len(transits) == 9
    assert transits["SANI"]["currentRasi"] == "MEENAM"
    assert transits["RAHU"]["isRetrograde"] is True
    assert transits["KETU"]["isRetrograde"] is True
    assert transits["MOON"]["isSandhi"] in {True, False}
    assert transits["SUN"]["isGandanta"] in {True, False}


def test_gochar_current_accepts_date_only_and_defaults_to_noon(client):
    chart_id = _create_chart(client)

    response = client.get(f"/api/v1/charts/{chart_id}/gochar/current", params={"date": "2026-05-21"})

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["asOfUTC"].startswith("2026-05-21")


def test_sani_cycle_endpoint_returns_valid_response(client):
    chart_id = _create_chart(client)

    response = client.get(f"/api/v1/charts/{chart_id}/sani-cycle", params={"date": "2026-05-21"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["saturnRasi"] == "MEENAM"
    assert body["data"]["janmaRasi"] == "VIRUCHIGAM"
    assert body["data"]["positionFromMoon"] == 5
    assert body["data"]["moonBasedCycle"]["isActive"] in {True, False}
    assert body["data"]["lagnaBasedCycle"]["isActive"] in {True, False}
    assert "confirmationSentence" in body["data"]


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


def test_peyarchi_endpoint_returns_upcoming_events(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/peyarchi",
        params={"as_of": "2026-05-22"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]) == 4
    assert [event["planet"] for event in body["data"]] == ["JUPITER", "RAHU", "KETU", "SATURN"]
    assert all(event["daysFromToday"] > 0 for event in body["data"])
    assert body["data"][3]["saniCycleAfter"] in {"EZHARAI_SANI_PHASE_1", "JANMA_SANI", "EZHARAI_SANI_PHASE_3", "ARDHASHTAMA_SANI", "KANTAKA_SANI", "ASHTAMA_SANI", None}


def test_peyarchi_upcoming_filters_to_window(client):
    chart_id = _create_chart(client)

    response = client.get(
        f"/api/v1/charts/{chart_id}/peyarchi/upcoming",
        params={"as_of": "2026-05-22", "window_days": 30},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    events = body["data"]
    assert events
    assert "JUPITER" in [event["planet"] for event in events]
    assert all(0 <= event["daysFromToday"] <= 30 for event in events)
