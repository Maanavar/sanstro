from datetime import date
from uuid import UUID

from app.db.session import SessionLocal
from app.models.relationship_alert import RelationshipAlert


def _create_family_with_two_members(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
) -> tuple[str, str]:
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code == 200
    family_vault_id = vault.json()["data"]["familyVaultId"]

    self_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(display_name="Arjun Kumar", relationship_to_owner="self"),
    )
    assert self_member.status_code == 200

    spouse_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(display_name="Anitha"),
    )
    assert spouse_member.status_code == 200
    member_id = spouse_member.json()["data"]["familyMemberId"]
    return family_vault_id, member_id


def test_relationship_synastry_endpoint_returns_score(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    response = client.get(
        f"/api/v1/relationships/{member_id}/synastry",
        params={"familyVaultId": family_vault_id},
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["familyVaultId"] == family_vault_id
    assert body["memberId"] == member_id
    assert 0 <= body["score"] <= 100
    assert body["label"] in {"SUPPORTIVE", "MIXED", "CAREFUL"}
    assert body["summary"]["en"]
    assert isinstance(body["keyAspects"], list)


def test_relationship_alerts_endpoint_filters_unread(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    with SessionLocal() as session:
        with session.begin():
            session.add(
                RelationshipAlert(
                    vault_id=UUID(family_vault_id),
                    member_id=UUID(member_id),
                    trigger_planet="JUPITER",
                    trigger_type="transit_conjunct_a_venus",
                    message_en="Supportive relationship activation window.",
                    message_ta="Uravukku supportive activation window.",
                    alert_date=date(2026, 5, 23),
                    is_read=False,
                )
            )

    unread = client.get(
        "/api/v1/relationships/alerts",
        params={"familyVaultId": family_vault_id},
    )
    assert unread.status_code == 200
    unread_body = unread.json()["data"]
    assert unread_body["unreadOnly"] is True
    assert unread_body["totalCount"] == 1
    assert unread_body["items"][0]["isRead"] is False

    all_items = client.get(
        "/api/v1/relationships/alerts",
        params={"familyVaultId": family_vault_id, "unreadOnly": False},
    )
    assert all_items.status_code == 200
    all_body = all_items.json()["data"]
    assert all_body["unreadOnly"] is False
    assert all_body["totalCount"] == 1



def test_relationship_compatibility_intelligence_includes_astro_identity(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    """Rasi/Nakshatra/Lagnam identity facts (2026-07 UX gap fix) must be
    present for both people, not just the score breakdowns."""
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    response = client.get(
        f"/api/v1/relationships/{member_id}/compatibility-intelligence",
        params={"familyVaultId": family_vault_id},
    )
    assert response.status_code == 200
    body = response.json()["data"]
    for identity in (body["personAIdentity"], body["personBIdentity"]):
        assert 1 <= identity["rasi"] <= 12
        assert identity["rasiName"]
        assert 1 <= identity["nakshatra"] <= 27
        assert identity["nakshatraName"]
        assert 1 <= identity["pada"] <= 4
        assert 1 <= identity["lagnaRasi"] <= 12
        assert identity["lagnaRasiName"]


def test_relationship_compatibility_intelligence_pdf_endpoint_returns_pdf(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    response = client.get(
        f"/api/v1/relationships/{member_id}/compatibility-intelligence/pdf",
        params={"familyVaultId": family_vault_id},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content[:4] == b"%PDF"


def test_relationship_compatibility_intelligence_direct_pdf_endpoint_returns_pdf(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    family_vault_id, member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )

    response = client.post(
        f"/api/v1/relationships/{member_id}/compatibility-intelligence/direct/pdf",
        params={"familyVaultId": family_vault_id},
        json={
            "personA": {
                "displayName": "Arjun Kumar",
                "birthDateLocal": "1991-07-22",
                "birthTimeLocal": "06:30:00",
                "birthPlace": "Chennai, Tamil Nadu, India",
                "birthLatitude": 13.0827,
                "birthLongitude": 80.2707,
                "birthTimezone": "Asia/Kolkata",
            }
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content[:4] == b"%PDF"
