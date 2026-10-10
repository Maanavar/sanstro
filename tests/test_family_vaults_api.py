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


def test_deleting_member_profile_does_not_break_family_summary_or_calendar(
    client,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory()).json()["data"]
    family_vault_id = vault["familyVaultId"]

    owner_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(
            display_name="Arjun Kumar",
            relationship_to_owner="self",
        ),
    )
    assert owner_member.status_code == 200

    spouse_member = client.post(
        f"/api/v1/family-vaults/{family_vault_id}/members",
        json=family_member_payload_factory(
            display_name="Meera",
            relationship_to_owner="spouse",
        ),
    )
    assert spouse_member.status_code == 200
    spouse_profile_id = spouse_member.json()["data"]["birthProfileId"]

    delete_response = client.delete(f"/api/v1/birth-profiles/{spouse_profile_id}")
    assert delete_response.status_code == 204

    members_after_delete = client.get(f"/api/v1/family-vaults/{family_vault_id}/members")
    assert members_after_delete.status_code == 200
    remaining_members = members_after_delete.json()["data"]["items"]
    assert len(remaining_members) == 1
    assert remaining_members[0]["displayName"] == "Arjun Kumar"

    summary = client.get(
        f"/api/v1/family-vaults/{family_vault_id}/summary",
        params={"date": "2026-05-21"},
    )
    assert summary.status_code == 200
    assert summary.json()["data"]["familyVaultId"] == family_vault_id

    calendar = client.get(
        f"/api/v1/family-vaults/{family_vault_id}/calendar",
        params={"from": "2026-05-21", "to": "2026-05-22"},
    )
    assert calendar.status_code == 200
    assert len(calendar.json()["data"]["items"]) == 2


def test_family_vault_today_includes_owner_with_highlight(
    client,
    birth_profile_payload_factory,
    family_vault_payload_factory,
    family_member_payload_factory,
):
    """The /today view must include the vault owner's own profile with a day
    highlight, not just the managed FamilyMember rows. Before the owner day-view
    fix the owner's grid tile showed a score but no guidance line, unlike every
    other member."""
    # Owner's own personal profile (family_member_id IS NULL) — created via the
    # birth-profiles endpoint, exactly the row _owner_day_view looks up.
    owner = client.post(
        "/api/v1/birth-profiles",
        json=birth_profile_payload_factory(display_name="Owner Self"),
    )
    assert owner.status_code == 200

    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code == 200
    vault_id = vault.json()["data"]["familyVaultId"]

    member = client.post(
        f"/api/v1/family-vaults/{vault_id}/members",
        json=family_member_payload_factory(display_name="Anitha", relationship_to_owner="spouse"),
    )
    assert member.status_code == 200

    today = client.get(f"/api/v1/family-vaults/{vault_id}/today", params={"date": "2026-05-21"})
    assert today.status_code == 200
    members = today.json()["data"]["members"]

    # Owner ("self") appears alongside the managed member...
    relationships = [m["relationship"] for m in members]
    assert "self" in relationships
    assert "spouse" in relationships
    # ...and every card, owner included, carries a non-empty bilingual highlight.
    assert all(m["highlightEn"] and m["highlightTa"] for m in members)
    owner_view = next(m for m in members if m["relationship"] == "self")
    assert owner_view["displayName"] == "Owner Self"


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


# ── Member edit: the three things the PATCH used to drop on the floor ────────
#
# `update_family_member` wrote the birth-profile columns by hand and stopped
# there, so a member edit skipped everything that has to ride with a birth-data
# change. Each test below fails against that implementation.


def _member_with_chart(client, vault_payload_factory, member_payload_factory, **kwargs):
    vault = client.post("/api/v1/family-vaults", json=vault_payload_factory()).json()["data"]
    vault_id = vault["familyVaultId"]
    member = client.post(
        f"/api/v1/family-vaults/{vault_id}/members",
        json=member_payload_factory(display_name="Test Subject", **kwargs),
    ).json()["data"]
    return vault_id, member



def _latest_chart_id_for_profile(birth_profile_id: str) -> str:
    """The newest Chart row for a profile — what every family surface resolves to
    via `_latest_chart`. A recalculation writes a NEW row rather than mutating the
    old one, so the previously-held chart id keeps answering with the old Lagna."""
    from sqlalchemy import select

    from app.models.chart import Chart

    with SessionLocal() as session:
        chart = session.execute(
            select(Chart)
            .where(Chart.birth_profile_id == birth_profile_id, Chart.status == "completed")
            .order_by(Chart.created_at.desc())
            .limit(1)
        ).scalars().first()
        return str(chart.chart_id) if chart is not None else ""


def test_member_patch_applies_birth_date(client, family_vault_payload_factory, family_member_payload_factory):
    """birthDateLocal was absent from FamilyMemberUpdate, so pydantic dropped it
    and the endpoint answered 200 with the old date still stored."""
    vault_id, member = _member_with_chart(client, family_vault_payload_factory, family_member_payload_factory)

    resp = client.patch(
        f"/api/v1/family-vaults/{vault_id}/members/{member['familyMemberId']}",
        json={"birthDateLocal": "1988-03-14"},
    )
    assert resp.status_code == 200

    profiles = client.get("/api/v1/birth-profiles").json()["data"]
    profile = next(p for p in profiles if p["birthProfileId"] == member["birthProfileId"])
    assert profile["birthDateLocal"] == "1988-03-14"


def test_member_patch_rejects_impossible_birth_date(client, family_vault_payload_factory, family_member_payload_factory):
    """Same bounds as /birth-profiles — the two doors must not disagree."""
    vault_id, member = _member_with_chart(client, family_vault_payload_factory, family_member_payload_factory)

    resp = client.patch(
        f"/api/v1/family-vaults/{vault_id}/members/{member['familyMemberId']}",
        json={"birthDateLocal": "1823-01-01"},
    )
    assert resp.status_code == 422


def test_member_patch_recalculates_chart_after_birth_time_change(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """A birth time moved by nine hours must move the Lagna. Without a
    recalculation the member kept pointing at a chart cast from the old minute
    while the profile beside it showed the new one.

    Asserted against the member's CURRENT chartId, not the one captured before
    the edit: `force_recalculate` writes a new Chart row rather than mutating
    the old one (`_chart_persist.calculate_chart_for_persisted_profile`), and
    the old row keeps answering with the old Lagna forever. Reading the stale id
    made this test fail against a working fix — the chart response embeds the
    live birth profile, so `birthTimeLocal` showed the new time on a chart whose
    positions were the old ones, which is exactly what the pre-fix bug looked
    like from the outside."""
    vault_id, member = _member_with_chart(client, family_vault_payload_factory, family_member_payload_factory)
    old_chart_id = member["chartId"]
    before = client.get(f"/api/v1/charts/{old_chart_id}").json()["data"]["lagna"]["rasi"]

    resp = client.patch(
        f"/api/v1/family-vaults/{vault_id}/members/{member['familyMemberId']}",
        json={"birthTimeLocal": "15:30:00"},
    )
    assert resp.status_code == 200

    # Read the profile's current chart from the DB: FamilyMemberData carries no
    # chartId, and GET /birth-profiles leaves its `chartId` null (it is never
    # populated by `list_birth_profiles_for_owner`, despite the field's docstring).
    new_chart_id = _latest_chart_id_for_profile(member["birthProfileId"])
    assert new_chart_id != old_chart_id, "no recalculation happened"

    after = client.get(f"/api/v1/charts/{new_chart_id}").json()["data"]
    assert after["birthProfile"]["birthTimeLocal"].startswith("15:30")
    assert after["lagna"]["rasi"] != before


def test_member_patch_syncs_name_onto_the_family_member_row(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """FamilyMember mirrors display_name and date_of_birth_local from the
    profile; the family surfaces read the mirror, so it must not drift."""
    vault_id, member = _member_with_chart(client, family_vault_payload_factory, family_member_payload_factory)

    client.patch(
        f"/api/v1/family-vaults/{vault_id}/members/{member['familyMemberId']}",
        json={"birthDateLocal": "1990-02-02"},
    )

    listed = client.get(f"/api/v1/family-vaults/{vault_id}/members").json()["data"]["items"][0]
    assert listed["dateOfBirthLocal"] == "1990-02-02"


def test_member_patch_can_set_and_then_clear_a_current_location(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """An empty currentPlace is the only way to say "they moved back". It has to
    take the coordinates with it — a named place with stale coordinates would
    still win over the birth place in `resolve_effective_daily_location`."""
    vault_id, member = _member_with_chart(client, family_vault_payload_factory, family_member_payload_factory)
    member_id = member["familyMemberId"]
    url = f"/api/v1/family-vaults/{vault_id}/members/{member_id}"

    assert client.patch(url, json={
        "currentPlace": "Singapore",
        "currentLatitude": 1.3521,
        "currentLongitude": 103.8198,
        "currentTimezone": "Asia/Singapore",
    }).status_code == 200

    profiles = client.get("/api/v1/birth-profiles").json()["data"]
    profile = next(p for p in profiles if p["birthProfileId"] == member["birthProfileId"])
    assert profile["currentPlace"] == "Singapore"
    assert profile["currentTimezone"] == "Asia/Singapore"

    assert client.patch(url, json={"currentPlace": ""}).status_code == 200

    profiles = client.get("/api/v1/birth-profiles").json()["data"]
    profile = next(p for p in profiles if p["birthProfileId"] == member["birthProfileId"])
    assert profile["currentPlace"] is None
    assert profile["currentLatitude"] is None
    assert profile["currentLongitude"] is None
    assert profile["currentTimezone"] is None


def test_editing_a_family_linked_profile_from_the_profiles_list_syncs_the_family_row(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """Setup -> all birth profiles -> Edit writes through /birth-profiles, not
    through the member endpoint.

    That is deliberate: the profiles list edits birth DATA, while relationship
    and weight are membership facts belonging to the Family surface. It only
    holds up because `FamilyMember`'s duplicated `display_name` and
    `date_of_birth_local` are mirrored back from the profile — the family
    switcher, aggregate rows and age buckets all read the mirror, so without the
    sync a rename in Setup would leave the Family tab showing the old name with
    nothing on screen to say which one was current.
    """
    vault_id, member = _member_with_chart(client, family_vault_payload_factory, family_member_payload_factory)

    resp = client.patch(
        f"/api/v1/birth-profiles/{member['birthProfileId']}",
        json={"displayName": "Renamed In Settings", "birthDateLocal": "1989-11-05"},
    )
    assert resp.status_code == 200

    listed = client.get(f"/api/v1/family-vaults/{vault_id}/members").json()["data"]["items"][0]
    assert listed["displayName"] == "Renamed In Settings"
    assert listed["dateOfBirthLocal"] == "1989-11-05"
