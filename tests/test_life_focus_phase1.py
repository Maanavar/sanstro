"""Life Focus, Phase 1: one preference drives the backend.

docs/LIFE_FOCUS_PLAN_2026-09-22.md §5 Phase 1. The D1 table, the focus →
goal_track write-through, the readers that now derive their track from the
focus, and the daily-guidance cache keyed by the track it was built for.
"""
from __future__ import annotations

import typing
from uuid import UUID

import pytest

from app.core.life_mode import ALL_LIFE_MODES, FOCUS_TABLE, focus_mapping

_PARAMS = {"date": "2026-05-21", "language": "ta-en"}


# ── D1 table ──────────────────────────────────────────────────────────────────

@pytest.mark.no_db
def test_focus_table_covers_every_mode_exactly():
    assert set(FOCUS_TABLE) == ALL_LIFE_MODES


@pytest.mark.no_db
def test_focus_table_names_only_codes_that_exist():
    # A typo here would silently match nothing downstream.
    from app.models.user_goal import VALID_GOAL_TYPES
    from app.schemas.auth import UpdateUserSettingsRequest
    from app.services.life_areas_service import _AREA_LABELS

    # Literal[...] | None → the Literal's members.
    annotation = UpdateUserSettingsRequest.model_fields["goal_track"].annotation
    literal = next(arg for arg in typing.get_args(annotation) if arg is not type(None))
    valid_tracks = set(typing.get_args(literal))
    assert valid_tracks == {"CAREER", "EXAM", "RELATIONSHIP", "FINANCIAL"}
    for mode, mapping in FOCUS_TABLE.items():
        assert mapping.goal_track is None or mapping.goal_track in valid_tracks, mode
        assert mapping.area is None or mapping.area in _AREA_LABELS, mode
        assert set(mapping.activities) <= VALID_GOAL_TYPES, mode


@pytest.mark.no_db
def test_balanced_and_unknown_modes_drive_nothing():
    for mode in ("BALANCED", None, "NOT_A_MODE"):
        mapping = focus_mapping(mode)
        assert (mapping.goal_track, mapping.area, mapping.activities) == (None, None, ())


# ── Contract and write-through ────────────────────────────────────────────────

def _user_goal_track() -> str | None:
    from app.db.session import SessionLocal
    from app.models.user import User
    from tests.conftest import TEST_USER_ID

    with SessionLocal() as session:
        return session.get(User, UUID(TEST_USER_ID)).goal_track


def _set_legacy_goal_track(value: str | None) -> None:
    from app.db.session import SessionLocal
    from app.models.user import User
    from tests.conftest import TEST_USER_ID

    with SessionLocal() as session, session.begin():
        session.get(User, UUID(TEST_USER_ID)).goal_track = value


def test_response_carries_the_focus_area_and_activities(client):
    body = client.patch("/api/v1/settings/life-mode", json={"mode": "CAREER"}).json()
    assert body["focusArea"] == "CAREER"
    assert body["focusActivities"] == ["job_change", "business_start"]

    first_run = client.patch("/api/v1/settings/life-mode", json={"mode": "BALANCED"}).json()
    assert first_run["focusArea"] is None
    assert first_run["focusActivities"] == []


def test_patch_writes_the_derived_goal_track_through(client):
    client.patch("/api/v1/settings/life-mode", json={"mode": "STUDY"})
    assert _user_goal_track() == "EXAM"

    # A focus with no track clears it, so a stale one cannot linger.
    client.patch("/api/v1/settings/life-mode", json={"mode": "HEALTH"})
    assert _user_goal_track() is None


def test_old_clients_can_still_send_goal_track(client):
    response = client.patch("/api/v1/auth/me", json={"goalTrack": "FINANCIAL"})
    assert response.status_code == 200
    assert response.json()["goalTrack"] == "FINANCIAL"


# ── Resolver ──────────────────────────────────────────────────────────────────

def test_a_user_who_never_chose_a_focus_keeps_the_legacy_track(client):
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.services.life_focus_service import resolve_goal_track
    from tests.conftest import TEST_USER_ID

    _set_legacy_goal_track("CAREER")
    with SessionLocal() as session:
        assert resolve_goal_track(session, session.get(User, UUID(TEST_USER_ID))) == "CAREER"


def test_a_chosen_focus_outranks_the_stored_track(client):
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.services.life_focus_service import resolve_goal_track
    from tests.conftest import TEST_USER_ID

    client.patch("/api/v1/settings/life-mode", json={"mode": "WEALTH"})
    _set_legacy_goal_track("EXAM")  # e.g. a stale client wrote it afterwards
    with SessionLocal() as session:
        assert resolve_goal_track(session, session.get(User, UUID(TEST_USER_ID))) == "FINANCIAL"


def test_a_focus_blocked_after_saving_drives_no_track(client, monkeypatch):
    # D5 reaches the readers, not just the settings response.
    import app.services.life_focus_service as focus_service
    from app.db.session import SessionLocal
    from app.models.user import User
    from tests.conftest import TEST_USER_ID

    client.patch("/api/v1/settings/life-mode", json={"mode": "MARRIAGE"})
    assert _user_goal_track() == "RELATIONSHIP"
    monkeypatch.setattr(
        focus_service, "user_blocked_modes", lambda _s, _u: frozenset({"LOVE", "MARRIAGE"})
    )
    with SessionLocal() as session:
        assert focus_service.resolve_goal_track(session, session.get(User, UUID(TEST_USER_ID))) is None


# ── Daily guidance ────────────────────────────────────────────────────────────

def _create_chart(client, payload: dict) -> str:
    created = client.post("/api/v1/birth-profiles", json=payload)
    assert created.status_code == 200, created.text
    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": created.json()["data"]["birthProfileId"],
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200, chart.text
    return chart.json()["data"]["chartId"]


@pytest.fixture
def track_marker(monkeypatch):
    """Make the goal-track hint unconditional and visible.

    The real hint only speaks on some days (dasha affinity or a caution label),
    so a date-pinned test could pass with the wiring broken. This proves the
    wiring (focus → track → action line → cache), not the hint's wording.
    """
    import app.services.daily_guidance_service as dg

    def _marked(action, goal_track, _maha_lord, _label):
        return type(action)(ta=action.ta, en=f"{action.en} [track:{goal_track}]")

    monkeypatch.setattr(dg, "_enrich_action_with_goal_track", _marked)
    return "[track:"


def _action_en(client, chart_id: str) -> str:
    response = client.get(f"/api/v1/charts/{chart_id}/daily-guidance", params=_PARAMS)
    assert response.status_code == 200, response.text
    return response.json()["data"]["actionSuggestion"]["en"]


def test_changing_focus_changes_the_action_line(client, birth_profile_payload_factory, track_marker):
    chart_id = _create_chart(client, birth_profile_payload_factory())

    client.patch("/api/v1/settings/life-mode", json={"mode": "CAREER"})
    assert "[track:CAREER]" in _action_en(client, chart_id)

    client.patch("/api/v1/settings/life-mode", json={"mode": "STUDY"})
    assert "[track:EXAM]" in _action_en(client, chart_id)

    client.patch("/api/v1/settings/life-mode", json={"mode": "SPIRITUALITY"})
    assert track_marker not in _action_en(client, chart_id)


def test_a_focus_user_is_served_from_the_cache(client, monkeypatch, birth_profile_payload_factory, track_marker):
    # Load check (plan Phase 1 item 3): a track used to bypass the cache
    # entirely, so every focus user recomputed on every request.
    import app.services.daily_guidance_service as dg

    chart_id = _create_chart(client, birth_profile_payload_factory())
    client.patch("/api/v1/settings/life-mode", json={"mode": "CAREER"})
    first = _action_en(client, chart_id)

    real_build = dg.build_daily_guidance_response
    builds: list[str | None] = []

    def _counting_build(*args, **kwargs):
        builds.append(kwargs.get("goal_track"))
        return real_build(*args, **kwargs)

    monkeypatch.setattr(dg, "build_daily_guidance_response", _counting_build)

    assert _action_en(client, chart_id) == first
    assert builds == [], "same focus, same day: must be a cache hit"

    # A new focus must not be served the old focus's row...
    client.patch("/api/v1/settings/life-mode", json={"mode": "WEALTH"})
    assert "[track:FINANCIAL]" in _action_en(client, chart_id)
    assert builds == ["FINANCIAL"]

    # ...and is itself cached from then on.
    _action_en(client, chart_id)
    assert builds == ["FINANCIAL"]


def test_rows_written_before_the_tag_still_serve_trackless_users(client, monkeypatch, birth_profile_payload_factory):
    # The tag must not retire the existing cache: an untagged row is a hit for
    # a user with no track, which is almost everyone.
    import app.services.daily_guidance_service as dg

    chart_id = _create_chart(client, birth_profile_payload_factory())
    _action_en(client, chart_id)  # no focus: writes an untagged row

    def _unexpected(*_a, **_k):
        raise AssertionError("an untagged row should serve a trackless user")

    monkeypatch.setattr(dg, "build_daily_guidance_response", _unexpected)
    _action_en(client, chart_id)


def _member_chart(client, vault_id: str, payload: dict) -> str:
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models import BirthProfile, Chart

    member = client.post(f"/api/v1/family-vaults/{vault_id}/members", json=payload)
    assert member.status_code == 200, member.text
    member_id = UUID(member.json()["data"]["familyMemberId"])
    with SessionLocal() as session:
        chart_id = session.execute(
            select(Chart.chart_id)
            .join(BirthProfile, BirthProfile.birth_profile_id == Chart.birth_profile_id)
            .where(BirthProfile.family_member_id == member_id)
        ).scalar_one()
    return str(chart_id)


def test_focus_never_steers_a_family_members_chart(
    client, family_vault_payload_factory, family_member_payload_factory, track_marker
):
    # D4, owner ruling Q2. The relationship lives on the vault member, and a
    # member marked "self" is the user, so that chart keeps the focus.
    vault = client.post("/api/v1/family-vaults", json=family_vault_payload_factory())
    vault_id = vault.json()["data"]["familyVaultId"]
    self_chart = _member_chart(
        client, vault_id,
        family_member_payload_factory(display_name="Synthetic Self", relationship_to_owner="self"),
    )
    spouse_chart = _member_chart(
        client, vault_id, family_member_payload_factory(display_name="Synthetic Spouse")
    )

    client.patch("/api/v1/settings/life-mode", json={"mode": "CAREER"})
    assert track_marker not in _action_en(client, spouse_chart)
    assert "[track:CAREER]" in _action_en(client, self_chart)


def test_focus_does_not_move_the_score(client, birth_profile_payload_factory):
    # D2 at the level Phase 1 can reach: the track rewrites words, not numbers.
    chart_id = _create_chart(client, birth_profile_payload_factory())

    def _numbers() -> tuple:
        data = client.get(f"/api/v1/charts/{chart_id}/daily-guidance", params=_PARAMS).json()["data"]
        return data["score"], data["label"], data["scoreBreakdown"], data["bestWindows"]

    baseline = _numbers()
    for mode in ("CAREER", "STUDY", "MARRIAGE", "WEALTH"):
        client.patch("/api/v1/settings/life-mode", json={"mode": mode})
        assert _numbers() == baseline, mode


# ── Ask Vinaadi context ───────────────────────────────────────────────────────

def test_ask_vinaadi_context_names_the_focus(client, birth_profile_payload_factory):
    from app.db.session import SessionLocal
    from app.services.ask_vinaadi_service import _build_context_block
    from tests.conftest import TEST_USER_ID

    chart_id = _create_chart(client, birth_profile_payload_factory())
    client.patch("/api/v1/settings/life-mode", json={"mode": "FAMILY"})
    with SessionLocal() as session:
        context, *_ = _build_context_block(session, UUID(chart_id), UUID(TEST_USER_ID))
    # FAMILY has no goal track, so the old "Goal track" line said "none set".
    assert "User's current life focus: FAMILY (life area FAMILY_HARMONY)" in context
