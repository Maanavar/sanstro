import pytest

from app.db.session import SessionLocal
from app.models import FamilyVault


def test_family_vault_member_and_aggregate_flow(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code == 200
    vault_body = vault.json()["data"]
    family_vault_id = vault_body["familyVaultId"]
    assert vault_body["memberCount"] == 0

    first_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(
            display_name="Arjun Kumar",
            relationship_to_owner="self",
            member_weight=1.25,
        ),
    )
    assert first_member.status_code == 200
    first_member_body = first_member.json()["data"]
    assert first_member_body["familyVaultId"] == family_vault_id
    assert first_member_body["chartId"] is not None
    assert first_member_body["calculationStatus"] == "completed"
    assert first_member_body["memberWeight"] == pytest.approx(1.25)

    second_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(display_name="Anitha"),
    )
    assert second_member.status_code == 200
    second_member_body = second_member.json()["data"]
    assert second_member_body["chartId"] is not None

    vault_detail = client.get(f"/api/v1/family-vaults/{family_vault_id}")
    assert vault_detail.status_code == 200
    vault_detail_body = vault_detail.json()["data"]
    assert vault_detail_body["familyVaultId"] == family_vault_id
    assert vault_detail_body["memberCount"] == 2
    assert vault_detail_body["latestAggregateDate"] is None

    member_score = client.get(
        f"/api/v1/charts/{first_member_body['chartId']}/daily-guidance",
        params={"date": "2026-05-21", "language": "ta-en"},
    )
    assert member_score.status_code == 200
    individual_score = member_score.json()["data"]["score"]

    aggregate = client.get(
        f"/api/v1/family-vaults/{family_vault_id}/daily-aggregate",
        params={"date": "2026-05-21"},
    )
    assert aggregate.status_code == 200
    body = aggregate.json()["data"]
    assert body["familyVaultId"] == family_vault_id
    assert body["dateLocal"] == "2026-05-21"
    breakdown = body["aggregateBreakdown"]
    expected_family_score = round(
        breakdown["weightedMean"]
        - max(0, 55 - breakdown["lowestScore"]) * 0.35
        - breakdown["lowScoreCount"] * 4
        - breakdown["chandrashtamaCount"] * 3
        - breakdown["majorSaniCount"] * 4
    )
    assert body["familyScore"] == max(0, min(100, expected_family_score))
    expected_support_need = min(
        100,
        breakdown["lowScoreCount"] * 10
        + breakdown["majorSaniCount"] * 8
        + breakdown["chandrashtamaCount"] * 5
        + breakdown["healthPreventiveNudgeCount"] * 4,
    )
    assert breakdown["supportNeedIndex"] == expected_support_need
    expected_decision_readiness = max(
        0,
        min(
            100,
            body["familyScore"]
            + breakdown["commonGoodWindowBonus"]
            - breakdown["rahuYamaOverlapPenalty"]
            - breakdown["keyMemberLowScorePenalty"]
            - (5 if breakdown["chandrashtamaCount"] else 0),
        ),
    )
    assert breakdown["decisionReadinessIndex"] == expected_decision_readiness
    assert breakdown["weightedMean"] == pytest.approx(individual_score, rel=0, abs=5)
    assert len(body["members"]) == 2
    assert body["members"][0]["activeCycleTags"]
    assert body["bestFamilyWindows"]
    assert body["avoidForFamilyDecisions"][0]["type"] == "RAHU_KALAM"
    assert body["summary"]["en"]
    assert body["summary"]["ta"]

    summary = client.get(
        f"/api/v1/family-vaults/{family_vault_id}/summary",
        params={"date": "2026-05-21"},
    )
    assert summary.status_code == 200
    summary_body = summary.json()["data"]
    assert summary_body["familyVaultId"] == family_vault_id
    assert summary_body["dateLocal"] == "2026-05-21"
    assert summary_body["familyScore"] == body["familyScore"]
    assert summary_body["familyLabel"] == body["familyLabel"]
    assert summary_body["summary"]["en"] == body["summary"]["en"]
    assert summary_body["bestFamilyWindows"]
    assert summary_body["avoidForFamilyDecisions"][0]["type"] == "RAHU_KALAM"

    vault_detail_after = client.get(f"/api/v1/family-vaults/{family_vault_id}")
    assert vault_detail_after.status_code == 200
    vault_detail_after_body = vault_detail_after.json()["data"]
    assert vault_detail_after_body["latestAggregateDate"] == "2026-05-21"

    calendar = client.get(
        f"/api/v1/family-vaults/{family_vault_id}/calendar",
        params={"from": "2026-05-21", "to": "2026-05-22"},
    )
    assert calendar.status_code == 200
    calendar_body = calendar.json()["data"]
    assert calendar_body["familyVaultId"] == family_vault_id
    assert calendar_body["fromDate"] == "2026-05-21"
    assert calendar_body["toDate"] == "2026-05-22"
    assert len(calendar_body["items"]) == 2
    assert calendar_body["items"][0]["familyScore"] == body["familyScore"]
    assert calendar_body["items"][0]["summary"]["en"]

    duplicate_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(display_name="Anitha"),
    )
    assert duplicate_member.status_code == 409
    assert "already exists" in duplicate_member.json()["detail"]

    vault_detail_after_duplicate = client.get(f"/api/v1/family-vaults/{family_vault_id}")
    assert vault_detail_after_duplicate.status_code == 200
    assert vault_detail_after_duplicate.json()["data"]["memberCount"] == 2


def test_family_vault_list_returns_auth_user_vaults(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    """List endpoint returns vaults belonging to the authenticated user only."""
    first_vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory("Vault A"))
    assert first_vault.status_code == 200
    first_vault_id = first_vault.json()["data"]["familyVaultId"]

    second_vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory("Vault B"))
    assert second_vault.status_code == 200
    second_vault_id = second_vault.json()["data"]["familyVaultId"]

    client.post(
        f"/api/v1/family-vaults/{first_vault_id}/members",
        json=family_member_payload_factory(
            display_name="Arjun Kumar",
            relationship_to_owner="self",
            member_weight=1.25,
        ),
    )
    client.get(
        f"/api/v1/family-vaults/{first_vault_id}/daily-aggregate",
        params={"date": "2026-05-21"},
    )

    vault_list = client.get("/api/v1/family-vaults")
    assert vault_list.status_code == 200
    body = vault_list.json()["data"]
    assert body["limit"] == 20
    assert body["offset"] == 0
    assert body["totalCount"] == 2
    ids = {item["familyVaultId"] for item in body["items"]}
    assert first_vault_id in ids
    assert second_vault_id in ids
    first_item = next(i for i in body["items"] if i["familyVaultId"] == first_vault_id)
    assert first_item["memberCount"] == 1
    assert first_item["latestAggregateDate"] == "2026-05-21"


def test_family_vault_list_paginates(client, family_vault_payload_factory):
    first = client.post("/api/v1/family-vaults", json=family_vault_payload_factory("Vault A"))
    assert first.status_code == 200
    first_id = first.json()["data"]["familyVaultId"]

    second = client.post("/api/v1/family-vaults", json=family_vault_payload_factory("Vault B"))
    assert second.status_code == 200
    second_id = second.json()["data"]["familyVaultId"]

    third = client.post("/api/v1/family-vaults", json=family_vault_payload_factory("Vault C"))
    assert third.status_code == 200
    third_id = third.json()["data"]["familyVaultId"]

    page_one = client.get("/api/v1/family-vaults", params={"limit": 2, "offset": 0})
    assert page_one.status_code == 200
    page_one_body = page_one.json()["data"]
    assert page_one_body["limit"] == 2
    assert page_one_body["offset"] == 0
    assert page_one_body["totalCount"] == 3
    assert len(page_one_body["items"]) == 2
    assert page_one_body["items"][0]["familyVaultId"] == third_id
    assert {item["familyVaultId"] for item in page_one_body["items"][1:]} <= {first_id, second_id}

    page_two = client.get("/api/v1/family-vaults", params={"limit": 2, "offset": 2})
    assert page_two.status_code == 200
    page_two_body = page_two.json()["data"]
    assert page_two_body["limit"] == 2
    assert page_two_body["offset"] == 2
    assert page_two_body["totalCount"] == 3
    assert len(page_two_body["items"]) == 1
    assert page_two_body["items"][0]["familyVaultId"] in {first_id, second_id}
    assert page_two_body["items"][0]["familyVaultId"] not in {item["familyVaultId"] for item in page_one_body["items"]}


def test_family_member_list_get_update_delete(client, family_vault_payload_factory, family_member_payload_factory):
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory()).json()["data"]
    vault_id = vault["familyVaultId"]

    add_resp = client.post(
        f"/api/v1/family-vaults/{vault_id}/members",
        json=family_member_payload_factory(display_name="Kavitha"),
    )
    assert add_resp.status_code == 200
    member_id = add_resp.json()["data"]["familyMemberId"]

    list_resp = client.get(f"/api/v1/family-vaults/{vault_id}/members")
    assert list_resp.status_code == 200
    list_body = list_resp.json()["data"]
    assert list_body["familyVaultId"] == vault_id
    assert list_body["totalCount"] == 1
    assert list_body["items"][0]["familyMemberId"] == member_id
    assert list_body["items"][0]["displayName"] == "Kavitha"
    assert list_body["items"][0]["birthProfileId"] is not None

    get_resp = client.get(f"/api/v1/family-vaults/{vault_id}/members/{member_id}")
    assert get_resp.status_code == 200
    get_body = get_resp.json()["data"]
    assert get_body["familyMemberId"] == member_id
    assert get_body["displayName"] == "Kavitha"
    assert get_body["relationshipToOwner"] == "spouse"

    patch_resp = client.patch(
        f"/api/v1/family-vaults/{vault_id}/members/{member_id}",
        json={"displayName": "Kavitha Updated", "memberWeight": 1.15},
    )
    assert patch_resp.status_code == 200
    patch_body = patch_resp.json()["data"]
    assert patch_body["displayName"] == "Kavitha Updated"
    assert patch_body["memberWeight"] == pytest.approx(1.15)

    verify_resp = client.get(f"/api/v1/family-vaults/{vault_id}/members/{member_id}")
    assert verify_resp.status_code == 200
    assert verify_resp.json()["data"]["displayName"] == "Kavitha Updated"

    del_resp = client.delete(f"/api/v1/family-vaults/{vault_id}/members/{member_id}")
    assert del_resp.status_code == 204

    gone_resp = client.get(f"/api/v1/family-vaults/{vault_id}/members/{member_id}")
    assert gone_resp.status_code == 404

    list_after = client.get(f"/api/v1/family-vaults/{vault_id}/members")
    assert list_after.status_code == 200
    assert list_after.json()["data"]["totalCount"] == 0


def test_family_member_not_found_returns_404(client, family_vault_payload_factory):
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory()).json()["data"]
    vault_id = vault["familyVaultId"]
    nonexistent_id = "cccccccc-cccc-cccc-cccc-cccccccccccc"

    assert client.get(f"/api/v1/family-vaults/{vault_id}/members/{nonexistent_id}").status_code == 404
    assert client.patch(f"/api/v1/family-vaults/{vault_id}/members/{nonexistent_id}", json={"displayName": "X"}).status_code == 404
    assert client.delete(f"/api/v1/family-vaults/{vault_id}/members/{nonexistent_id}").status_code == 404


def test_family_calendar_range_is_capped(client, family_vault_payload_factory, family_member_payload_factory):
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory()).json()["data"]
    family_vault_id = vault["familyVaultId"]
    client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(
            display_name="Arjun Kumar",
            relationship_to_owner="self",
            member_weight=1.25,
        ),
    )

    response = client.get(
        f"/api/v1/family-vaults/{family_vault_id}/calendar",
        params={"from": "2026-01-01", "to": "2026-04-15"},
    )

    assert response.status_code == 422
    assert "90 days" in response.json()["detail"]


def test_delete_family_vault_soft_deletes_row(client, family_vault_payload_factory):
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory("Soft Delete Vault"))
    assert vault.status_code == 200
    vault_id = vault.json()["data"]["familyVaultId"]

    delete_response = client.delete(f"/api/v1/family-vaults/{vault_id}")
    assert delete_response.status_code == 204

    list_response = client.get("/api/v1/family-vaults")
    assert list_response.status_code == 200
    ids = {item["familyVaultId"] for item in list_response.json()["data"]["items"]}
    assert vault_id not in ids

    detail_response = client.get(f"/api/v1/family-vaults/{vault_id}")
    assert detail_response.status_code == 404

    with SessionLocal() as session:
        row = session.get(FamilyVault, vault_id)
        assert row is not None
        assert row.deleted_at is not None
