def test_gemstone_advice_endpoint_enforces_malefic_rule(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/gemstone-advice")
    assert response.status_code == 200
    advice = response.json()["data"]["advice"]
    assert any(row["functional_nature"] in {"DUSTHANA", "MARAKA"} and row["is_gemstone_prescribed"] is False for row in advice)


def test_remedy_plan_endpoint_prioritizes_current_maha_lord(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/remedy-plan")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["items"]
    assert data["items"][0]["planet"] == data["currentMahaLord"]

