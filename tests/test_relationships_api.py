from datetime import date
from uuid import UUID

from app.db.session import SessionLocal
from app.models.relationship_alert import RelationshipAlert


def _family_vault_payload(name: str = "Arjun Family"):
    return {"name": name, "defaultLanguage": "ta-en"}


def _family_member_payload(display_name: str):
    return {
        "relationshipToOwner": "self" if display_name == "Arjun Kumar" else "spouse",
        "displayName": display_name,
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Chennai, Tamil Nadu, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
        "memberWeight": 1.0,
    }


def _create_family_with_two_members(client) -> tuple[str, str]:
    vault = client.post("/api/v1/family-vaults", json=_family_vault_payload())
    assert vault.status_code == 200
    family_vault_id = vault.json()["data"]["familyVaultId"]

    self_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=_family_member_payload("Arjun Kumar"),
    )
    assert self_member.status_code == 200

    spouse_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=_family_member_payload("Anitha"),
    )
    assert spouse_member.status_code == 200
    member_id = spouse_member.json()["data"]["familyMemberId"]
    return family_vault_id, member_id


def test_relationship_synastry_endpoint_returns_score(client):
    family_vault_id, member_id = _create_family_with_two_members(client)

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


def test_relationship_alerts_endpoint_filters_unread(client):
    family_vault_id, member_id = _create_family_with_two_members(client)

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

