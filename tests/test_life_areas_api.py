def test_life_areas_endpoint_exposes_score_breakdown_and_structured_remedy(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": "2026-06-01"})
    assert response.status_code == 200
    areas = response.json()["data"]["areas"]
    assert areas
    assert all("scoreBreakdown" in area for area in areas)
    assert all("structuredRemedy" in area for area in areas)

