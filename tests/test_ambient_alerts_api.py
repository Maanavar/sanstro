from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import BirthProfile, Chart, PeyarchiAlert, RelationshipAlert


def _create_family_with_two_members(client, family_vault_payload_factory, family_member_payload_factory) -> tuple[str, str, str]:
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code == 200
    family_vault_id = vault.json()["data"]["familyVaultId"]

    self_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(display_name="Arjun Kumar", relationship_to_owner="self"),
    )
    assert self_member.status_code == 200
    self_member_id = self_member.json()["data"]["familyMemberId"]

    spouse_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(display_name="Anitha"),
    )
    assert spouse_member.status_code == 200
    spouse_member_id = spouse_member.json()["data"]["familyMemberId"]
    return family_vault_id, self_member_id, spouse_member_id


def _latest_chart_for_member(member_id: str) -> UUID:
    with SessionLocal() as session:
        row = session.execute(
            select(Chart.chart_id)
            .join(BirthProfile, BirthProfile.birth_profile_id == Chart.birth_profile_id)
            .where(BirthProfile.family_member_id == UUID(member_id))
            .order_by(Chart.created_at.desc())
        ).first()
    assert row is not None
    return row[0]


def test_ambient_alerts_threshold_suppresses_low_signal(client, family_vault_payload_factory, family_member_payload_factory):
    family_vault_id, self_member_id, spouse_member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )
    self_chart_id = _latest_chart_for_member(self_member_id)

    with SessionLocal() as session:
        with session.begin():
            session.add(
                PeyarchiAlert(
                    chart_id=self_chart_id,
                    planet="SATURN",
                    from_rasi="KUMBAM",
                    to_rasi="MEENAM",
                    peyarchi_date=date(2026, 5, 24),
                    peyarchi_utc=datetime(2026, 5, 24, 0, 0, tzinfo=UTC),
                    impact_from_moon=4,
                    sani_cycle_after="ARDHASHTAMA_SANI",
                )
            )
            session.add(
                PeyarchiAlert(
                    chart_id=self_chart_id,
                    planet="VENUS",
                    from_rasi="MESHAM",
                    to_rasi="RISHABAM",
                    peyarchi_date=date(2026, 6, 18),
                    peyarchi_utc=datetime(2026, 6, 18, 0, 0, tzinfo=UTC),
                    impact_from_moon=2,
                )
            )
            session.add(
                RelationshipAlert(
                    vault_id=UUID(family_vault_id),
                    member_id=UUID(spouse_member_id),
                    trigger_planet="RAHU",
                    trigger_type="transit_conjunct_b_moon",
                    message_en="Mindful communication can help today.",
                    message_ta="Inru amaidiyana pesudhal payanulladhu.",
                    alert_date=date(2026, 5, 23),
                    is_read=False,
                )
            )

    response = client.get(
        "/api/v1/alerts/ambient",
        params={"asOfDate": "2026-05-23", "minSignificance": 75, "unreadOnly": True},
    )
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["totalReturned"] == 2
    assert body["totalSuppressed"] >= 1
    assert {item["source"] for item in body["items"]} == {"PEYARCHI", "RELATIONSHIP"}
    assert all(item["significanceScore"] >= 75 for item in body["items"])


def test_ambient_alerts_unread_only_excludes_read_relationship_alerts(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    family_vault_id, _self_member_id, spouse_member_id = _create_family_with_two_members(
        client,
        family_vault_payload_factory,
        family_member_payload_factory,
    )
    with SessionLocal() as session:
        with session.begin():
            session.add(
                RelationshipAlert(
                    vault_id=UUID(family_vault_id),
                    member_id=UUID(spouse_member_id),
                    trigger_planet="SATURN",
                    trigger_type="transit_conjunct_a_moon",
                    message_en="Steady boundaries can support this period.",
                    message_ta="Nilaiana varambu intha kaalathai support seyyum.",
                    alert_date=date(2026, 5, 23),
                    is_read=True,
                )
            )

    unread = client.get(
        "/api/v1/alerts/ambient",
        params={"asOfDate": "2026-05-23", "minSignificance": 60, "unreadOnly": True},
    )
    assert unread.status_code == 200
    unread_items = unread.json()["data"]["items"]
    assert all(item["source"] != "RELATIONSHIP" for item in unread_items)

    all_items = client.get(
        "/api/v1/alerts/ambient",
        params={"asOfDate": "2026-05-23", "minSignificance": 60, "unreadOnly": False},
    )
    assert all_items.status_code == 200
    included = all_items.json()["data"]["items"]
    assert any(item["source"] == "RELATIONSHIP" for item in included)
