def test_life_areas_endpoint_exposes_score_breakdown_and_structured_remedy(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": "2026-06-01"})
    assert response.status_code == 200
    areas = response.json()["data"]["areas"]
    assert areas
    assert all("scoreBreakdown" in area for area in areas)
    assert all("structuredRemedy" in area for area in areas)


def test_life_areas_reading_surfaces_only_behind_contradiction_flag(client, birth_profile_payload_factory):
    """Phase 3 (D4): `reading` is additive — null with the flag off, a Reading
    value (or null for phase-skipped/harmony areas) with gate+contradiction on.

    `reasoning_contradiction` defaults to True since P0-2 (2026-07-13), so the
    "off" half of this test now needs an explicit override to exercise it."""
    from app.services import feature_flags

    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]

    feature_flags.set_flag("reasoning_contradiction", False)
    try:
        response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": "2026-06-01"})
        assert all(area["reading"] is None for area in response.json()["data"]["areas"])
    finally:
        feature_flags.reset_flag("reasoning_contradiction")

    feature_flags.set_flag("reasoning_gate", True)
    feature_flags.set_flag("reasoning_contradiction", True)
    try:
        response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": "2026-06-01"})
        assert response.status_code == 200
        areas = response.json()["data"]["areas"]
        allowed = {
            "PROMISED_AND_TIMED", "PROMISED_NOT_NOW", "ACTIVE_BUT_UNPROMISED",
            "PARTIALLY_PROMISED", "NOT_PROMISED", "MIXED", "SILENT", None,
        }
        assert all(area["reading"] in allowed for area in areas)
        assert any(area["reading"] is not None for area in areas)
    finally:
        feature_flags.reset_flag("reasoning_gate")
        feature_flags.reset_flag("reasoning_contradiction")


def test_life_areas_chart_signature_and_causal_chain_are_additive(client, birth_profile_payload_factory):
    """Phase 5: `chartSignature` (top-level) and `causalChain` (per area) are
    additive — absent with the flag off, present/well-formed with it on, and
    `causalChain` only ever fires for LOW-confidence areas.

    `reasoning_chart_signature` defaults to True since P0-4 (2026-07-13), so
    the "off" half now needs an explicit override."""
    from app.services import feature_flags

    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]

    feature_flags.set_flag("reasoning_chart_signature", False)
    try:
        response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": "2026-06-01"})
        data = response.json()["data"]
        assert data.get("chartSignature") is None
        assert all(area.get("causalChain") is None for area in data["areas"])
    finally:
        feature_flags.reset_flag("reasoning_chart_signature")

    feature_flags.set_flag("reasoning_chart_signature", True)
    try:
        response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": "2026-06-01"})
        assert response.status_code == 200
        data = response.json()["data"]
        signature = data["chartSignature"]
        assert signature["dominant"] in {
            "SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU",
        }
        assert signature["framing"]["ta"] and signature["framing"]["en"]

        for area in data["areas"]:
            chain = area.get("causalChain")
            if chain is not None:
                assert area["confidence"] == "LOW"
                assert chain["ta"] and chain["en"]
                # RP-09: spoken "Because … therefore …" prose, never an arrow chain.
                assert "→" not in chain["en"]
                assert chain["en"].startswith("Because") and "therefore" in chain["en"]
    finally:
        feature_flags.reset_flag("reasoning_chart_signature")

