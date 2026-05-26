from __future__ import annotations

from uuid import UUID, uuid4

from app.db.session import SessionLocal
from app.models.family_vault import FamilyVault
from app.models.user import User


def _birth_profile_payload() -> dict[str, object]:
    return {
        "ownerUserId": "11111111-1111-1111-1111-111111111111",
        "displayName": "Arjun Kumar",
        "birthDateLocal": "1991-07-22",
        "birthTimeLocal": "06:30:00",
        "birthPlace": "Chennai, Tamil Nadu, India",
        "birthLatitude": 13.0827,
        "birthLongitude": 80.2707,
        "birthTimezone": "Asia/Kolkata",
        "calculateNow": True,
    }


def _create_chart(client) -> str:
    created = client.post("/api/v1/birth-profiles", json=_birth_profile_payload())
    assert created.status_code == 200
    birth_profile_id = created.json()["data"]["birthProfileId"]

    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": birth_profile_id,
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200
    return chart.json()["data"]["chartId"]


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


def _create_family_with_two_members(client) -> tuple[str, dict[str, str], dict[str, str]]:
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
    return family_vault_id, self_member.json()["data"], spouse_member.json()["data"]


def _ensure_user(session, user_id: UUID, email: str) -> None:
    if session.get(User, user_id) is None:
        session.add(User(user_id=user_id, email=email))


def test_journal_create_returns_tags_and_chart_anchor(client):
    chart_id = _create_chart(client)

    payload = {
        "chartId": chart_id,
        "entryDate": "2026-05-23",
        "lifeArea": "career",
        "noteText": "Had interview stress today and planned monthly budget after work.",
    }
    response = client.post("/api/v1/journal", json=payload)
    assert response.status_code == 200
    body = response.json()["data"]

    assert body["chartId"] == chart_id
    assert body["lifeArea"] == "career"
    assert "life_area_career" in body["tags"]
    assert "career_focus" in body["tags"]
    assert "finance_planning" in body["tags"]
    assert 1 <= body["anchor"]["moonHouseFromMoon"] <= 12
    assert 1 <= body["anchor"]["saturnHouseFromMoon"] <= 12
    assert body["anchor"]["activeDasha"]


def test_journal_list_filters_by_life_area(client):
    chart_id = _create_chart(client)

    entries = [
        {
            "chartId": chart_id,
            "entryDate": "2026-05-23",
            "lifeArea": "career",
            "noteText": "Promotion and team discussion.",
        },
        {
            "chartId": chart_id,
            "entryDate": "2026-05-24",
            "lifeArea": "health",
            "noteText": "Sleep routine and exercise felt better.",
        },
    ]
    for item in entries:
        created = client.post("/api/v1/journal", json=item)
        assert created.status_code == 200

    filtered = client.get(
        "/api/v1/journal",
        params={"chartId": chart_id, "lifeArea": "health"},
    )
    assert filtered.status_code == 200
    data = filtered.json()["data"]
    assert data["totalCount"] == 1
    assert data["items"][0]["lifeArea"] == "health"


def test_journal_update_recomputes_tags(client):
    chart_id = _create_chart(client)
    created = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-05-23",
            "lifeArea": "general",
            "noteText": "Today was calm.",
        },
    )
    assert created.status_code == 200
    journal_id = created.json()["data"]["journalId"]

    updated = client.patch(
        f"/api/v1/journal/{journal_id}",
        json={
            "lifeArea": "finance",
            "noteText": "Focused on budget and savings goals.",
        },
    )
    assert updated.status_code == 200
    body = updated.json()["data"]
    assert body["lifeArea"] == "finance"
    assert "life_area_finance" in body["tags"]
    assert "finance_planning" in body["tags"]


def test_journal_delete_hides_from_default_list_and_can_show_archived(client):
    chart_id = _create_chart(client)
    created = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-05-23",
            "lifeArea": "family",
            "noteText": "Family dinner and conversation.",
        },
    )
    assert created.status_code == 200
    journal_id = created.json()["data"]["journalId"]

    deleted = client.delete(f"/api/v1/journal/{journal_id}")
    assert deleted.status_code == 200
    assert deleted.json()["data"]["journalId"] == journal_id

    default_list = client.get("/api/v1/journal", params={"chartId": chart_id})
    assert default_list.status_code == 200
    assert default_list.json()["data"]["totalCount"] == 0

    archived_list = client.get(
        "/api/v1/journal",
        params={"chartId": chart_id, "includeArchived": True},
    )
    assert archived_list.status_code == 200
    assert archived_list.json()["data"]["totalCount"] == 1


def test_journal_retention_apply_archives_older_entries(client):
    chart_id = _create_chart(client)
    first = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-01-01",
            "lifeArea": "career",
            "noteText": "Early-year planning.",
        },
    )
    assert first.status_code == 200

    second = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-05-20",
            "lifeArea": "career",
            "noteText": "Recent work update.",
        },
    )
    assert second.status_code == 200

    applied = client.post(
        "/api/v1/journal/retention/apply",
        json={
            "chartId": chart_id,
            "keepDays": 60,
            "asOfDate": "2026-05-23",
            "dryRun": False,
        },
    )
    assert applied.status_code == 200
    data = applied.json()["data"]
    assert data["matchedCount"] == 1
    assert data["archivedCount"] == 1

    default_list = client.get("/api/v1/journal", params={"chartId": chart_id})
    assert default_list.status_code == 200
    assert default_list.json()["data"]["totalCount"] == 1


def test_journal_retention_uses_user_default_when_keep_days_missing(client):
    chart_id = _create_chart(client)
    settings = client.patch("/api/v1/settings/journal", json={"journalRetentionDays": 30})
    assert settings.status_code == 200

    first = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-03-20",
            "lifeArea": "career",
            "noteText": "Older note.",
        },
    )
    assert first.status_code == 200

    second = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-05-20",
            "lifeArea": "career",
            "noteText": "Recent note.",
        },
    )
    assert second.status_code == 200

    applied = client.post(
        "/api/v1/journal/retention/apply",
        json={
            "chartId": chart_id,
            "asOfDate": "2026-05-23",
            "dryRun": False,
        },
    )
    assert applied.status_code == 200
    data = applied.json()["data"]
    assert data["keepDays"] == 30
    assert data["matchedCount"] == 1
    assert data["archivedCount"] == 1


def test_journal_prompts_endpoint_returns_bilingual_templates(client):
    chart_id = _create_chart(client)
    response = client.get(
        "/api/v1/journal/prompts",
        params={
            "chartId": chart_id,
            "date": "2026-05-23",
            "lifeArea": "career",
            "scoreLabel": "CAUTION",
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["chartId"] == chart_id
    assert data["lifeArea"] == "career"
    assert data["scoreLabel"] == "CAUTION"
    assert len(data["prompts"]) == 3
    assert all(item["text"]["ta"] for item in data["prompts"])
    assert all(item["text"]["en"] for item in data["prompts"])


def test_journal_prompts_auto_resolves_life_area_from_journal_insight(client):
    chart_id = _create_chart(client)
    created = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-05-20",
            "lifeArea": "career",
            "noteText": "Interview and office planning notes.",
        },
    )
    assert created.status_code == 200

    response = client.get(
        "/api/v1/journal/prompts",
        params={
            "chartId": chart_id,
            "date": "2026-05-23",
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["lifeArea"] == "career"
    assert data["scoreLabel"] in {"STRONG_SUPPORT", "GOOD", "BALANCED", "CAUTION", "RESTORATIVE"}
    assert len(data["prompts"]) == 3


def test_journal_export_endpoint_returns_portable_payload(client):
    chart_id = _create_chart(client)
    first = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-05-21",
            "lifeArea": "career",
            "noteText": "Export sample active entry.",
        },
    )
    assert first.status_code == 200
    second = client.post(
        "/api/v1/journal",
        json={
            "chartId": chart_id,
            "entryDate": "2026-05-22",
            "lifeArea": "health",
            "noteText": "Export sample archived entry.",
        },
    )
    assert second.status_code == 200
    archived_id = second.json()["data"]["journalId"]
    archived = client.delete(f"/api/v1/journal/{archived_id}")
    assert archived.status_code == 200

    only_active = client.get(
        "/api/v1/journal/export",
        params={"chartId": chart_id, "includeArchived": False},
    )
    assert only_active.status_code == 200
    active_data = only_active.json()["data"]
    assert active_data["chartId"] == chart_id
    assert active_data["includeArchived"] is False
    assert active_data["totalCount"] == 1
    assert active_data["items"][0]["deletedAt"] is None

    with_archived = client.get(
        "/api/v1/journal/export",
        params={"chartId": chart_id, "includeArchived": True},
    )
    assert with_archived.status_code == 200
    full_data = with_archived.json()["data"]
    assert full_data["totalCount"] == 2
    assert any(item["deletedAt"] is not None for item in full_data["items"])


def test_family_vault_journal_view_filters_to_member_entries(client):
    family_vault_id, _self_member, spouse_member = _create_family_with_two_members(client)
    spouse_chart_id = spouse_member["chartId"]
    assert spouse_chart_id

    spouse_entry = client.post(
        "/api/v1/journal",
        json={
            "chartId": spouse_chart_id,
            "entryDate": "2026-05-23",
            "lifeArea": "family",
            "noteText": "Vault member journal entry.",
        },
    )
    assert spouse_entry.status_code == 200

    other_chart_id = _create_chart(client)
    other_entry = client.post(
        "/api/v1/journal",
        json={
            "chartId": other_chart_id,
            "entryDate": "2026-05-23",
            "lifeArea": "career",
            "noteText": "Non-vault personal entry.",
        },
    )
    assert other_entry.status_code == 200

    listed = client.get(f"/api/v1/family-vaults/{family_vault_id}/journal")
    assert listed.status_code == 200
    data = listed.json()["data"]
    assert data["familyVaultId"] == family_vault_id
    assert data["totalCount"] == 1
    assert data["items"][0]["chartId"] == spouse_chart_id
    assert data["items"][0]["memberDisplayName"] == "Anitha"


def test_family_vault_journal_summary_returns_life_area_counts_only(client):
    family_vault_id, self_member, spouse_member = _create_family_with_two_members(client)
    self_chart_id = self_member["chartId"]
    spouse_chart_id = spouse_member["chartId"]
    assert self_chart_id and spouse_chart_id

    first = client.post(
        "/api/v1/journal",
        json={
            "chartId": self_chart_id,
            "entryDate": "2026-05-22",
            "lifeArea": "finance",
            "noteText": "Budget review and savings check.",
        },
    )
    assert first.status_code == 200

    second = client.post(
        "/api/v1/journal",
        json={
            "chartId": spouse_chart_id,
            "entryDate": "2026-05-23",
            "lifeArea": "family",
            "noteText": "Family planning discussion.",
        },
    )
    assert second.status_code == 200

    third = client.post(
        "/api/v1/journal",
        json={
            "chartId": spouse_chart_id,
            "entryDate": "2026-05-23",
            "lifeArea": "family",
            "noteText": "Another family check-in.",
        },
    )
    assert third.status_code == 200

    outside_chart_id = _create_chart(client)
    outside = client.post(
        "/api/v1/journal",
        json={
            "chartId": outside_chart_id,
            "entryDate": "2026-05-23",
            "lifeArea": "career",
            "noteText": "Outside vault entry.",
        },
    )
    assert outside.status_code == 200

    summary = client.get(
        f"/api/v1/family-vaults/{family_vault_id}/journal/summary",
        params={"fromDate": "2026-05-20", "toDate": "2026-05-23"},
    )
    assert summary.status_code == 200
    data = summary.json()["data"]

    assert data["familyVaultId"] == family_vault_id
    assert data["totalEntries"] == 3
    counts = {item["lifeArea"]: item["count"] for item in data["lifeAreaCounts"]}
    assert counts == {"family": 2, "finance": 1}
    assert all("noteText" not in item for item in data["lifeAreaCounts"])


def test_family_vault_journal_view_denies_non_owner_vault(client):
    foreign_vault_id = str(uuid4())
    foreign_owner_id = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
    with SessionLocal() as session:
        with session.begin():
            _ensure_user(session, foreign_owner_id, "foreign-owner@jothidam.test")
            session.add(
                FamilyVault(
                    family_vault_id=UUID(foreign_vault_id),
                    owner_user_id=foreign_owner_id,
                    name="Foreign Vault",
                    default_language="ta-en",
                )
            )

    denied = client.get(f"/api/v1/family-vaults/{foreign_vault_id}/journal")
    assert denied.status_code == 403


def test_family_vault_journal_summary_denies_non_owner_vault(client):
    foreign_vault_id = str(uuid4())
    foreign_owner_id = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
    with SessionLocal() as session:
        with session.begin():
            _ensure_user(session, foreign_owner_id, "foreign-owner@jothidam.test")
            session.add(
                FamilyVault(
                    family_vault_id=UUID(foreign_vault_id),
                    owner_user_id=foreign_owner_id,
                    name="Foreign Vault",
                    default_language="ta-en",
                )
            )

    denied = client.get(f"/api/v1/family-vaults/{foreign_vault_id}/journal/summary")
    assert denied.status_code == 403
