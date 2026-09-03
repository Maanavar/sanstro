"""Age/relationship gating for /charts/{id}/event-windows (MARRIAGE only)."""
from __future__ import annotations


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


def _event_windows(client, chart_id: str, event: str = "MARRIAGE"):
    return client.get(
        f"/api/v1/charts/{chart_id}/event-windows",
        params={"event": event, "fromYear": 2026, "toYear": 2040},
    )


def test_event_windows_marriage_hard_blocked_for_minor(client, birth_profile_payload_factory):
    payload = birth_profile_payload_factory(display_name="Minor Test")
    payload["birthDateLocal"] = "2012-06-01"
    chart_id = _create_chart(client, payload)

    resp = _event_windows(client, chart_id)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["ageGated"] is True
    assert data["windows"] == []


def test_event_windows_marriage_hard_blocked_past_prime_age(client, birth_profile_payload_factory):
    payload = birth_profile_payload_factory(display_name="Senior Test")
    payload["birthDateLocal"] = "1965-06-01"
    chart_id = _create_chart(client, payload)

    resp = _event_windows(client, chart_id)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["ageGated"] is True
    assert data["windows"] == []


def test_event_windows_marriage_soft_gated_for_married_profile(client, birth_profile_payload_factory):
    payload = birth_profile_payload_factory(display_name="Married Test")
    payload["birthDateLocal"] = "1992-03-15"
    payload["maritalStatus"] = "married"
    chart_id = _create_chart(client, payload)

    resp = _event_windows(client, chart_id)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["ageGated"] is True
    assert data["alternativeFraming"] == "RELATIONSHIP_HARMONY"


def test_event_windows_marriage_not_gated_for_eligible_single_adult(client, birth_profile_payload_factory):
    payload = birth_profile_payload_factory(display_name="Eligible Test")
    payload["birthDateLocal"] = "1996-03-15"
    chart_id = _create_chart(client, payload)

    resp = _event_windows(client, chart_id)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["ageGated"] is False
    assert data["alternativeFraming"] is None


def test_event_windows_marriage_hard_blocked_for_parent_relationship(
    client, family_vault_payload_factory, family_member_payload_factory
):
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code == 200
    family_vault_id = vault.json()["data"]["familyVaultId"]

    member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(display_name="Amma", relationship_to_owner="parent"),
    )
    assert member.status_code == 200
    chart_id = member.json()["data"]["chartId"]

    resp = _event_windows(client, chart_id)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["ageGated"] is True
    assert data["windows"] == []


def test_event_windows_career_not_age_gated(client, birth_profile_payload_factory):
    payload = birth_profile_payload_factory(display_name="Career Test")
    payload["birthDateLocal"] = "2012-06-01"
    chart_id = _create_chart(client, payload)

    resp = _event_windows(client, chart_id, event="CAREER")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["ageGated"] is False
