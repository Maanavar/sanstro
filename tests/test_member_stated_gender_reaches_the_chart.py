"""A family member's stated gender reaches the member's chart (2026-11-11).

Before: the member row stored "female" while the member's birth profile stored
"not_specified" (create dropped the field; member edits did not copy it), so
every chart-based reading of a member ignored the stated gender (FAA-16's
spouse karaka, FAA-30's 8th-house role). Synthetic people only.
"""
from __future__ import annotations

from types import SimpleNamespace

from app.db.session import SessionLocal
from app.models import BirthProfile, FamilyMember
from app.services._chart_build import _stated_gender


def _vault(client, factory) -> str:
    return client.post("/api/v1/family-vaults", json=factory()).json()["data"]["familyVaultId"]


def test_member_created_with_a_gender_stores_it_on_the_profile(
    client, family_vault_payload_factory, family_member_payload_factory
):
    vid = _vault(client, family_vault_payload_factory)
    made = client.post(
        f"/api/v1/family-vaults/{vid}/members",
        json={**family_member_payload_factory(display_name="Synthetic Bride"), "genderForTraditionalRules": "female"},
    )
    assert made.status_code == 200
    with SessionLocal() as s:
        bp = s.query(BirthProfile).filter_by(family_member_id=made.json()["data"]["familyMemberId"]).one()
        assert bp.gender_for_traditional_rules == "female"


def test_member_gender_edit_reaches_the_profile(client, family_vault_payload_factory, family_member_payload_factory):
    vid = _vault(client, family_vault_payload_factory)
    made = client.post(f"/api/v1/family-vaults/{vid}/members", json=family_member_payload_factory(display_name="Synthetic B"))
    mid = made.json()["data"]["familyMemberId"]
    patched = client.patch(f"/api/v1/family-vaults/{vid}/members/{mid}", json={"genderForTraditionalRules": "male"})
    assert patched.status_code == 200, patched.text
    with SessionLocal() as s:
        assert s.query(FamilyMember).filter_by(family_member_id=mid).one().gender_for_traditional_rules == "male"
        assert s.query(BirthProfile).filter_by(family_member_id=mid).one().gender_for_traditional_rules == "male"


def test_a_legacy_profile_reads_its_members_stated_gender():
    """Rows written before the fix: profile unstated, member stated."""
    legacy = SimpleNamespace(gender_for_traditional_rules="not_specified",
                             family_member=SimpleNamespace(gender_for_traditional_rules="female"))
    assert _stated_gender(legacy) == "female"
    # The profile wins when it states one; nothing stated anywhere stays unstated.
    assert _stated_gender(SimpleNamespace(gender_for_traditional_rules="male",
                                          family_member=SimpleNamespace(gender_for_traditional_rules="female"))) == "male"
    assert _stated_gender(SimpleNamespace(gender_for_traditional_rules="not_specified", family_member=None)) == "not_specified"
    assert _stated_gender(SimpleNamespace(gender_for_traditional_rules="UNKNOWN")) == "UNKNOWN"
