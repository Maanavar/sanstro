"""Saved name sessions (NUM-58, Phase 5).

The shortlist a user builds while weighing a name change. Four things these
tests hold down beyond the round trip:

1. **The row stores the question, never the answer.** That is the whole design,
   and the only way it stays true is a test that fails when someone adds a
   ``score`` column to make the list endpoint faster.
2. **A saved row can never hold a name the engine would refuse.** Doctrine D3
   makes non-Latin input a 422; if that check ran only on read, a stored row
   would be a permanent error the user could not clear.
3. **The cap is real.** A shortlist that grows without bound turns the list
   endpoint into unbounded work per request.
4. **Delete is soft, and deleting twice is a 404 rather than a lie.**
"""
from __future__ import annotations

from collections.abc import Iterator
from typing import Any
from uuid import UUID, uuid4

import pytest
from sqlalchemy import inspect, select

from app.db.session import SessionLocal
from app.models import NumerologyNameSession
from app.models.user import User
from app.services.feature_flags import reset_flag, set_flag
from app.services.numerology_name_session_service import MAX_SESSIONS_PER_CHART

OTHER_USER_ID = UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def enabled() -> Iterator[None]:
    set_flag("numerology_engine", True)
    try:
        yield
    finally:
        reset_flag("numerology_engine")


@pytest.fixture
def numerology_off() -> Iterator[None]:
    """The flag ships ON (2026-07-28) — this forces the rollback path so the
    gate itself stays under test rather than only its currently-launched
    happy path."""
    set_flag("numerology_engine", False)
    try:
        yield
    finally:
        reset_flag("numerology_engine")


def _create_chart(client) -> str:
    """A clearly-synthetic Chennai-born native. No real birth data in fixtures."""
    created = client.post(
        "/api/v1/birth-profiles",
        json={
            "ownerUserId": "11111111-1111-1111-1111-111111111111",
            "displayName": "Name Session Test",
            "birthDateLocal": "1991-07-22",
            "birthTimeLocal": "06:30:00",
            "birthPlace": "Chennai, Tamil Nadu, India",
            "birthLatitude": 13.0827,
            "birthLongitude": 80.2707,
            "birthTimezone": "Asia/Kolkata",
            "calculateNow": True,
        },
    )
    assert created.status_code == 200
    chart = client.post(
        "/api/v1/charts/calculate",
        json={
            "birthProfileId": created.json()["data"]["birthProfileId"],
            "calculationVersion": "thirukanitham-2026-v1",
            "forceRecalculate": False,
        },
    )
    assert chart.status_code == 200
    return chart.json()["data"]["chartId"]


def _base(chart_id: str) -> str:
    return f"/api/v1/charts/{chart_id}/numerology/name-sessions"


def _save(client, chart_id: str, name: str, **extra: Any):
    return client.post(_base(chart_id), json={"name": name, **extra})


# ── The design ───────────────────────────────────────────────────────────────
def test_the_table_stores_the_question_and_never_the_answer() -> None:
    """No score, no verdict, no prose is persisted — see the model docstring.

    Pinned as a column-set assertion rather than prose in a docstring because
    the tempting "optimisation" is to cache the computed reading on the row, and
    that would silently freeze the doctrine flags and the dark corpus into
    storage. Whoever adds such a column should have to delete this test on
    purpose.
    """
    columns = {c.name for c in inspect(NumerologyNameSession).columns}
    assert columns == {
        "numerology_name_session_id",
        "owner_user_id",
        "chart_id",
        "candidate_name",
        "label",
        "max_edits",
        "saved_calculation_version",
        "created_at",
        "updated_at",
        "deleted_at",
    }
    forbidden = {"score", "verdict", "reading", "alignment", "graha", "reason_en", "reason_ta"}
    assert not (columns & forbidden), (
        "a computed result reached storage; saved sessions must recompute so "
        "they follow the engine and the doctrine flags"
    )


# ── Round trip ───────────────────────────────────────────────────────────────
def test_save_returns_the_whole_shortlist_with_the_reading_recomputed(
    client, enabled: None
) -> None:
    chart_id = _create_chart(client)
    response = _save(client, chart_id, "Zoro", label="for the passport")
    assert response.status_code == 201
    body = response.json()

    assert len(body["sessions"]) == 1
    saved = body["sessions"][0]
    assert saved["name"] == "Zoro"
    assert saved["label"] == "for the passport"
    assert saved["maxEdits"] == 2
    assert saved["recalculatedSinceSaved"] is False
    assert body["remainingSlots"] == MAX_SESSIONS_PER_CHART - 1

    # The reading is computed on this request, not read back from the row.
    assert saved["reading"]["root"] in range(1, 10)
    assert saved["alignment"]["graha"]
    assert saved["alignment"]["functionalNature"]
    assert body["traditionEn"]


def test_list_returns_what_was_saved(client, enabled: None) -> None:
    chart_id = _create_chart(client)
    _save(client, chart_id, "Zoro")
    _save(client, chart_id, "Zorro")

    listed = client.get(_base(chart_id))
    assert listed.status_code == 200
    assert {row["name"] for row in listed.json()["sessions"]} == {"Zoro", "Zorro"}


def test_an_empty_shortlist_lists_cleanly(client, enabled: None) -> None:
    """The no-rows path must not pay for a chart snapshot to return nothing."""
    chart_id = _create_chart(client)
    response = client.get(_base(chart_id))
    assert response.status_code == 200
    assert response.json()["sessions"] == []
    assert response.json()["remainingSlots"] == MAX_SESSIONS_PER_CHART


def test_two_saved_names_are_scored_against_the_same_chart_context(
    client, enabled: None
) -> None:
    """One chart load for the whole list.

    Not a performance assertion — a correctness one. Two spellings scored
    against separately-loaded contexts is how one chart starts disagreeing with
    itself, so both rows must report the same lagna-derived graha for the same
    number.
    """
    chart_id = _create_chart(client)
    _save(client, chart_id, "Zoro")
    _save(client, chart_id, "Zoro Zoro")

    sessions = client.get(_base(chart_id)).json()["sessions"]
    by_number = {}
    for row in sessions:
        by_number.setdefault(row["alignment"]["number"], set()).add(
            (row["alignment"]["graha"], row["alignment"]["functionalNature"])
        )
    for number, seen in by_number.items():
        assert len(seen) == 1, f"number {number} scored two ways in one response: {seen}"


# ── Saving the same spelling twice ───────────────────────────────────────────
def test_saving_the_same_spelling_twice_updates_in_place(client, enabled: None) -> None:
    """A retry is not a second session, and must not eat a cap slot."""
    chart_id = _create_chart(client)
    _save(client, chart_id, "Zoro", label="first thought")
    second = _save(client, chart_id, "Zoro", label="settled on this", maxEdits=1)

    assert second.status_code == 201
    body = second.json()
    assert len(body["sessions"]) == 1
    assert body["sessions"][0]["label"] == "settled on this"
    assert body["sessions"][0]["maxEdits"] == 1
    assert body["remainingSlots"] == MAX_SESSIONS_PER_CHART - 1


# ── Doctrine D3 ──────────────────────────────────────────────────────────────
def test_non_latin_name_is_refused_at_save_and_nothing_is_stored(
    client, enabled: None
) -> None:
    """Chaldean values are Latin-only; refusing beats storing an unreadable row.

    The 422 belongs at the moment the user typed it. Checked on read instead,
    the row would be a permanent error in their shortlist.
    """
    chart_id = _create_chart(client)
    response = _save(client, chart_id, "ரமேஷ்")
    assert response.status_code == 422

    with SessionLocal() as session:
        stored = session.scalars(select(NumerologyNameSession)).all()
    assert stored == []


# ── The cap ──────────────────────────────────────────────────────────────────
def test_the_cap_refuses_one_spelling_too_many(client, enabled: None) -> None:
    chart_id = _create_chart(client)
    for index in range(MAX_SESSIONS_PER_CHART):
        response = _save(client, chart_id, f"Zoro{index}")
        assert response.status_code == 201, f"save {index} failed: {response.text}"
    assert response.json()["remainingSlots"] == 0

    overflow = _save(client, chart_id, "OneTooMany")
    assert overflow.status_code == 409

    # And the refusal did not partially write.
    assert len(client.get(_base(chart_id)).json()["sessions"]) == MAX_SESSIONS_PER_CHART


# ── Delete ───────────────────────────────────────────────────────────────────
def test_delete_removes_it_from_the_list_but_keeps_the_row(client, enabled: None) -> None:
    chart_id = _create_chart(client)
    saved = _save(client, chart_id, "Zoro").json()["sessions"][0]
    session_id = saved["nameSessionId"]

    deleted = client.delete(f"{_base(chart_id)}/{session_id}")
    assert deleted.status_code == 204
    assert client.get(_base(chart_id)).json()["sessions"] == []

    with SessionLocal() as session:
        row = session.get(NumerologyNameSession, UUID(session_id))
        assert row is not None, "delete should be soft — the row is still there"
        assert row.deleted_at is not None


def test_deleting_twice_is_a_404(client, enabled: None) -> None:
    chart_id = _create_chart(client)
    session_id = _save(client, chart_id, "Zoro").json()["sessions"][0]["nameSessionId"]

    assert client.delete(f"{_base(chart_id)}/{session_id}").status_code == 204
    assert client.delete(f"{_base(chart_id)}/{session_id}").status_code == 404


def test_deleting_an_unknown_id_is_a_404(client, enabled: None) -> None:
    chart_id = _create_chart(client)
    assert client.delete(f"{_base(chart_id)}/{uuid4()}").status_code == 404


def test_a_deleted_spelling_can_be_saved_again(client, enabled: None) -> None:
    """The soft-deleted row must not block a fresh save of the same name."""
    chart_id = _create_chart(client)
    session_id = _save(client, chart_id, "Zoro").json()["sessions"][0]["nameSessionId"]
    client.delete(f"{_base(chart_id)}/{session_id}")

    again = _save(client, chart_id, "Zoro")
    assert again.status_code == 201
    assert [row["name"] for row in again.json()["sessions"]] == ["Zoro"]


# ── The receipt ──────────────────────────────────────────────────────────────
def test_a_moved_engine_version_is_declared_not_hidden(client, enabled: None) -> None:
    """``recalculatedSinceSaved`` exists so a changed number arrives explained."""
    chart_id = _create_chart(client)
    session_id = _save(client, chart_id, "Zoro").json()["sessions"][0]["nameSessionId"]

    with SessionLocal() as session:
        with session.begin():
            row = session.get(NumerologyNameSession, UUID(session_id))
            row.saved_calculation_version = "numerology-name-session-v0"

    listed = client.get(_base(chart_id)).json()["sessions"][0]
    assert listed["recalculatedSinceSaved"] is True


# ── Gate and access ──────────────────────────────────────────────────────────
def test_delete_404s_while_the_flag_is_off(client, numerology_off: None) -> None:
    """The DELETE route does not fit the shared matrix, so it is gated here.

    Without ``numerology_off`` this would still return 404 once the flag ships
    ON by default, but for the wrong reason (a random session id under a real,
    owned chart is simply "not found", not gated) — silently testing nothing
    about the flag.
    """
    chart_id = _create_chart(client)
    response = client.delete(f"{_base(chart_id)}/{uuid4()}")
    assert response.status_code == 404


def test_delete_requires_auth(raw_client) -> None:
    response = raw_client.delete(f"{_base(str(uuid4()))}/{uuid4()}")
    assert response.status_code == 401


def test_another_users_chart_is_forbidden(client, enabled: None) -> None:
    """Storing rows against someone else's chart is the failure worth pinning."""
    from app.core.auth import get_current_user
    from app.main import app

    chart_id = _create_chart(client)
    with SessionLocal() as session:
        with session.begin():
            session.add(User(user_id=OTHER_USER_ID, email="other@example.test"))

    intruder = User(user_id=OTHER_USER_ID, email="other@example.test")
    app.dependency_overrides[get_current_user] = lambda: intruder
    try:
        assert _save(client, chart_id, "Zoro").status_code == 403
        assert client.get(_base(chart_id)).status_code == 403
        assert client.delete(f"{_base(chart_id)}/{uuid4()}").status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    with SessionLocal() as session:
        assert session.scalars(select(NumerologyNameSession)).all() == []
