"""Tests for "Your Chart in Five Minutes" (docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md).

This suite only covers what five_minute_reading_service.py actually ships
right now: the flag gate, register gating (only "self" renders), and the four
beats (who_you_are, what_this_rests_on, core_nature, one_thing) that exist.
See that module's docstring for what's deliberately not built yet — beats
4-7, and the client_with_guardian/parent/other registers.

Deliberately NOT reproduced here yet: the bidirectional provenance test, the
vocabulary-size ceiling, and the "one graha" invariant from spec §4. All
three guard tables/beats this module doesn't have. The one new table this
slice adds (`_Voice.mechanism`) lives in one_minute_reading_service.py and is
already exercised by that module's test_every_narration_facet_is_classified
and test_no_copy_slot_classifies_as_an_event_or_a_cold_read.
"""
from __future__ import annotations

import itertools
import uuid
from datetime import date

import pytest

from app.services.feature_flags import reset_flag, set_flag
from app.services.five_minute_reading_service import word_budget

TODAY = date.today()


@pytest.fixture(autouse=True)
def _reading_enabled():
    set_flag("five_minute_reading", True)
    yield
    reset_flag("five_minute_reading")


def _birth_date_for_age(age: int) -> str:
    # 14 March keeps the birthday behind us for most of the year, so the
    # requested age is the age the service computes — same convention as
    # test_one_minute_reading.py.
    return date(TODAY.year - age, 3, 14).isoformat()


_SERIAL = itertools.count(1)


def _profile(*, age: int, display_name: str | None = None) -> dict:
    """A clearly-synthetic profile. Never a real birth record (CLAUDE.md)."""
    return {
        "displayName": display_name or f"Five Minute Synthetic {next(_SERIAL)}",
        "birthDateLocal": _birth_date_for_age(age),
        "birthTimeLocal": "06:42:00",
        "birthPlace": "Madurai, Tamil Nadu, India",
        "birthLatitude": 9.9252,
        "birthLongitude": 78.1198,
        "birthTimezone": "Asia/Kolkata",
        "birthTimeSource": "BIRTH_CERTIFICATE",
        "calculateNow": True,
    }


def _chart_id_for_age(client, age: int) -> str:
    created = client.post("/api/v1/birth-profiles", json=_profile(age=age))
    assert created.status_code == 200, created.text
    return created.json()["data"]["chartId"]


# ── The rollout gate ─────────────────────────────────────────────────────────


def test_flag_off_answers_404_identically_for_real_and_fake_chart_ids(
    client, birth_profile_payload_factory
):
    created = client.post("/api/v1/birth-profiles", json=birth_profile_payload_factory())
    real_chart_id = created.json()["data"]["chartId"]
    reset_flag("five_minute_reading")
    set_flag("five_minute_reading", False)

    real = client.get(f"/api/v1/charts/{real_chart_id}/five-minute")
    fake = client.get(f"/api/v1/charts/{uuid.uuid4()}/five-minute")

    assert real.status_code == 404
    assert fake.status_code == 404
    assert real.json() == fake.json()


# ── Register gating (§0.2): only "self" ships ────────────────────────────────


def test_a_minor_owning_their_own_account_gets_the_same_404_as_flag_off(client):
    """Age 8, own chart, own account -> "parent" register, which doesn't ship yet."""
    reset_flag("five_minute_reading")
    set_flag("five_minute_reading", False)
    off = client.get(f"/api/v1/charts/{uuid.uuid4()}/five-minute")
    set_flag("five_minute_reading", True)

    chart_id = _chart_id_for_age(client, age=8)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")

    assert response.status_code == 404
    assert response.json() == off.json()


def test_a_teen_owning_their_own_account_gets_the_same_404_as_flag_off(client):
    """Age 15, own chart, own account -> "client_with_guardian", not built yet."""
    reset_flag("five_minute_reading")
    set_flag("five_minute_reading", False)
    off = client.get(f"/api/v1/charts/{uuid.uuid4()}/five-minute")
    set_flag("five_minute_reading", True)

    chart_id = _chart_id_for_age(client, age=15)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")

    assert response.status_code == 404
    assert response.json() == off.json()


def test_a_family_vault_members_chart_gets_the_same_404_as_flag_off(
    client, family_vault_payload_factory, family_member_payload_factory
):
    """A chart read off someone else's family-vault card -> "other", never ships."""
    reset_flag("five_minute_reading")
    set_flag("five_minute_reading", False)
    off = client.get(f"/api/v1/charts/{uuid.uuid4()}/five-minute")
    set_flag("five_minute_reading", True)

    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models import BirthProfile, Chart

    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    assert vault.status_code == 200, vault.text
    vault_id = vault.json()["data"]["familyVaultId"]

    payload = family_member_payload_factory(
        display_name="Five Minute Synthetic Daughter", relationship_to_owner="child"
    )
    payload["birthDateLocal"] = _birth_date_for_age(26)
    member = client.post(f"/api/v1/family-vaults/{vault_id}/members", json=payload)
    assert member.status_code == 200, member.text
    member_id = member.json()["data"]["familyMemberId"]

    with SessionLocal() as session:
        row = session.execute(
            select(Chart.chart_id)
            .join(BirthProfile, BirthProfile.birth_profile_id == Chart.birth_profile_id)
            .where(BirthProfile.family_member_id == uuid.UUID(member_id))
            .order_by(Chart.created_at.desc())
        ).first()
    assert row is not None, "the member's chart was not created"

    response = client.get(f"/api/v1/charts/{row[0]}/five-minute")

    assert response.status_code == 404
    assert response.json() == off.json()


# ── What actually ships: "self", 4 beats ────────────────────────────────────


@pytest.mark.parametrize("age", [22, 45, 66])
def test_self_register_renders_exactly_the_four_beats_that_exist(client, age):
    chart_id = _chart_id_for_age(client, age=age)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")
    assert response.status_code == 200, response.text
    data = response.json()["data"]

    assert data["addressedTo"] == "self"
    ids = [beat["id"] for beat in data["beats"]]
    assert ids == ["who_you_are", "what_this_rests_on", "core_nature", "one_thing"]

    max_en, max_ta = word_budget("self")
    assert data["wordCount"]["en"] <= max_en, data["wordCount"]
    assert data["wordCount"]["ta"] <= max_ta, data["wordCount"]


def test_core_nature_beat_names_gift_mechanism_and_shadow_in_one_sentence_pair(client):
    """The mechanism clause must actually render, not just exist in the table."""
    chart_id = _chart_id_for_age(client, age=30)
    response = client.get(f"/api/v1/charts/{chart_id}/five-minute")
    assert response.status_code == 200, response.text
    data = response.json()["data"]

    core_nature = next(beat for beat in data["beats"] if beat["id"] == "core_nature")
    assert "Your real strength is" in core_nature["text"]["en"]
    assert "Where it costs you is" in core_nature["text"]["en"]
    # Every mechanism clause was drafted as a "because ..." connective (§2.1).
    assert "because" in core_nature["text"]["en"]
