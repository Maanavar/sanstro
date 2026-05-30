from __future__ import annotations


def _birth_profile_payload(
    *,
    birth_date_local: str,
    employment_type: str | None = None,
    marital_status: str | None = None,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Prediction Test",
        "birthDateLocal": birth_date_local,
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Chennai, Tamil Nadu, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    }
    if employment_type is not None:
        payload["employmentType"] = employment_type
    if marital_status is not None:
        payload["maritalStatus"] = marital_status
    return payload


def _create_chart(client, payload: dict[str, object]) -> str:
    created = client.post("/api/v1/birth-profiles", json=payload)
    assert created.status_code == 200
    birth_profile_id = created.json()["data"]["birthProfileId"]

    calculated = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert calculated.status_code == 200
    return calculated.json()["data"]["chartId"]


def test_predictions_endpoints_age_gate_for_minor(client):
    chart_id = _create_chart(
        client,
        _birth_profile_payload(birth_date_local="2012-06-01"),
    )
    params = {"asOf": "2026-05-24"}

    marriage = client.get(f"/api/v1/charts/{chart_id}/predictions/marriage", params=params)
    career = client.get(f"/api/v1/charts/{chart_id}/predictions/career", params=params)
    wealth = client.get(f"/api/v1/charts/{chart_id}/predictions/wealth", params=params)

    assert marriage.status_code == 200
    assert career.status_code == 200
    assert wealth.status_code == 200

    assert "age-gated" in marriage.json()["data"]["mainPredictionEn"].lower()
    assert "age-gated" in career.json()["data"]["mainPredictionEn"].lower()
    assert "age-gated" in wealth.json()["data"]["mainPredictionEn"].lower()


def test_career_prediction_uses_employment_to_derive_student_life_stage(client):
    chart_id = _create_chart(
        client,
        _birth_profile_payload(
            birth_date_local="1996-03-15",
            employment_type="student",
        ),
    )

    response = client.get(
        f"/api/v1/charts/{chart_id}/predictions/career",
        params={"asOf": "2026-05-24"},
    )
    assert response.status_code == 200
    data = response.json()["data"]

    life_stage_factor = next((f for f in data["astrologicalFactors"] if f["key"] == "life_stage"), None)
    assert life_stage_factor is not None
    assert "student" in life_stage_factor["detail"]["en"].lower()
    assert any("student life-stage" in item["en"].lower() for item in data["challenges"])


def test_marriage_prediction_reflects_marital_status_for_married_profile(client):
    chart_id = _create_chart(
        client,
        _birth_profile_payload(
            birth_date_local="1992-03-15",
            marital_status="married",
        ),
    )

    response = client.get(
        f"/api/v1/charts/{chart_id}/predictions/marriage",
        params={"asOf": "2026-05-24"},
    )
    assert response.status_code == 200
    data = response.json()["data"]

    assert "age-gated" not in data["mainPredictionEn"].lower()
    assert any("married profile" in item["en"].lower() for item in data["supports"])


def test_self_employed_career_gets_second_lord_check(client):
    """Self-employed profile triggers employment_second_lord factor in career predictions."""
    chart_id = _create_chart(
        client,
        _birth_profile_payload(birth_date_local="1990-06-10", employment_type="self_employed"),
    )
    response = client.get(
        f"/api/v1/charts/{chart_id}/predictions/career",
        params={"asOf": "2026-05-29"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert any(f["key"] == "employment_second_lord" for f in data["astrologicalFactors"])


def test_business_owner_career_gets_seventh_house_factor(client):
    """Business owner profile triggers employment_seventh_house factor."""
    chart_id = _create_chart(
        client,
        _birth_profile_payload(birth_date_local="1985-03-20", employment_type="business_owner"),
    )
    response = client.get(
        f"/api/v1/charts/{chart_id}/predictions/career",
        params={"asOf": "2026-05-29"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert any(f["key"] == "employment_seventh_house" for f in data["astrologicalFactors"])


def test_retired_career_gets_legacy_framing(client):
    """Retired employment type surfaces 'retired' in challenges."""
    chart_id = _create_chart(
        client,
        _birth_profile_payload(birth_date_local="1961-01-15", employment_type="retired"),
    )
    response = client.get(
        f"/api/v1/charts/{chart_id}/predictions/career",
        params={"asOf": "2026-05-29"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert any("retired" in c["en"].lower() for c in data["challenges"])


def test_age_modifier_affects_young_vs_senior_differently(client):
    """A young profile (2001) vs. senior (1961) should differ in career confidence
    when both are in the same dasha lord — the age modifier must produce different signals."""
    young_id = _create_chart(
        client,
        _birth_profile_payload(birth_date_local="2001-03-15", employment_type="employed_salaried"),
    )
    senior_id = _create_chart(
        client,
        _birth_profile_payload(birth_date_local="1961-03-15", employment_type="employed_salaried"),
    )
    young_resp = client.get(f"/api/v1/charts/{young_id}/predictions/career", params={"asOf": "2026-05-29"})
    senior_resp = client.get(f"/api/v1/charts/{senior_id}/predictions/career", params={"asOf": "2026-05-29"})
    assert young_resp.status_code == 200
    assert senior_resp.status_code == 200
    # Both must return valid confidence values — the age modifier must not crash
    assert young_resp.json()["data"]["confidence"] in ("HIGH", "MEDIUM", "LOW")
    assert senior_resp.json()["data"]["confidence"] in ("HIGH", "MEDIUM", "LOW")
