def test_life_areas_endpoint_exposes_score_breakdown_and_structured_remedy(client, birth_profile_payload_factory):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": "2026-06-01"})
    assert response.status_code == 200
    areas = response.json()["data"]["areas"]
    assert areas
    assert all("scoreBreakdown" in area for area in areas)
    assert all("structuredRemedy" in area for area in areas)


def test_life_areas_forecast_horizons_are_real_engine_scores(client, birth_profile_payload_factory):
    """score6mo / score12mo are the engine re-run at +6 / +12 months, not a
    cosmetic ± slope off the current score. Every area must expose both as valid
    scores, and — over a full year of transit + dasha motion — the horizons must
    not all collapse back onto the current score (the bug this replaced)."""
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory()).json()
    chart_id = created["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": "2026-06-01"})
    assert response.status_code == 200
    areas = response.json()["data"]["areas"]
    assert areas

    for area in areas:
        for key in ("score6mo", "score12mo"):
            assert key in area, f"{area['area']} missing {key}"
            assert isinstance(area[key], int)
            assert 0 <= area[key] <= 100

    # At least one area's outlook must actually move across the horizons —
    # otherwise the columns have silently flattened to the current score again.
    assert any(
        area["score6mo"] != area["score"] or area["score12mo"] != area["score"]
        for area in areas
    ), "no area's 6mo/12mo forecast differs from its current score — horizons look flat"


def _areas_by_key(client, birth_profile_payload_factory, *, birth_date, marital_status=None, as_of):
    """Create a profile at a chosen birth date (and optional marital status) and
    return its life areas keyed by area code, at the given as-of date."""
    payload = birth_profile_payload_factory()
    payload["birthDateLocal"] = birth_date
    if marital_status is not None:
        payload["maritalStatus"] = marital_status
    created = client.post("/api/v1/birth-profiles", json=payload).json()
    chart_id = created["data"]["chartId"]
    response = client.get(f"/api/v1/charts/{chart_id}/life-areas", params={"asOf": as_of})
    assert response.status_code == 200
    return {a["area"]: a for a in response.json()["data"]["areas"]}


def test_life_areas_age_relevant_flag_matches_engine_phase_gate(client, birth_profile_payload_factory):
    """`ageRelevant` is the engine's single source of truth for life-stage
    relevance. Every area exposes it, and it tracks the phase gate:
      - young adult (~34): every area is relevant;
      - child (~8): Career is not, Education/Health are;
      - unmarried elder (~76): Career and Relationships are not, Health/Money are.
    Surfaces filter/dim on this flag instead of re-deriving age relevance."""
    young = _areas_by_key(client, birth_profile_payload_factory, birth_date="1991-07-22", as_of="2026-06-01")
    assert young, "expected life areas for the young-adult profile"
    assert all("ageRelevant" in a for a in young.values())
    assert all(a["ageRelevant"] is True for a in young.values())

    child = _areas_by_key(client, birth_profile_payload_factory, birth_date="2018-01-01", as_of="2026-06-01")
    assert child["CAREER"]["ageRelevant"] is False
    assert child["MONEY"]["ageRelevant"] is False
    assert child["EDUCATION"]["ageRelevant"] is True
    assert child["HEALTH"]["ageRelevant"] is True

    elder = _areas_by_key(client, birth_profile_payload_factory, birth_date="1950-01-01", as_of="2026-06-01")
    assert elder["CAREER"]["ageRelevant"] is False
    assert elder["RELATIONSHIPS"]["ageRelevant"] is False
    assert elder["HEALTH"]["ageRelevant"] is True
    assert elder["MONEY"]["ageRelevant"] is True


def test_life_areas_married_elder_keeps_relationship_harmony_relevant(client, birth_profile_payload_factory):
    """Spouse harmony is lifelong: a *married* elder keeps the Relationships area
    (rendered as married-life harmony) even though the ELDER phase set drops it
    for the unmarried. This is the marital-status-aware branch of the gate."""
    married_elder = _areas_by_key(
        client, birth_profile_payload_factory,
        birth_date="1950-01-01", marital_status="married", as_of="2026-06-01",
    )
    assert married_elder["RELATIONSHIPS"]["ageRelevant"] is True


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

