"""A03 — a replayed refresh token's revocation must survive the 401 (P1).

`POST /api/v1/auth/mobile/refresh` treats reuse of an already-revoked token as a
theft signal: it burns every active refresh token for that user, logs the
signal, and returns 401. The 401 is raised from inside the request, and
``app/db/session.py::get_db`` rolls the transaction back on any exception — so
the UPDATE that was the entire point of the branch was discarded with it. The
endpoint answered "revoked", logged "theft signal", and left every successor
token usable.

The returned error and the durable security state disagreed, and nothing could
notice: tests/test_refresh_token_rotation_race.py proves the *conditional
rotation* claim by driving two sessions by hand, and never executes this
handler's error path at all.

So this suite drives the real HTTP endpoint against real PostgreSQL and reads
the rows back from a NEW session — the only vantage point from which a
rolled-back write is distinguishable from a committed one. Asserting on the
response alone cannot see the bug; asserting through the request's own session
cannot either, because the pending-but-doomed UPDATE is visible inside it.

OWNER RULING (2026-10-07) — scope of the revocation: the incident also bumps
`token_version`, so access tokens already issued to that user die immediately
rather than living out their remaining TTL. That is a deliberate policy choice,
not an implementation detail: a legitimate client that replays a stale token is
signed out of every device at once.

WHAT THIS SUITE CANNOT SEE:
  - concurrency. A bulk `UPDATE ... WHERE revoked_at IS NULL` cannot revoke a
    row that another request inserts after it runs. These tests are sequential,
    so a successor issued *during* the replay handling is outside them; closing
    that needs issuance and revocation to share a generation check (A03 step 7),
    which this change does not attempt.
  - the mobile client's reaction to the 401. tests for that live under mobile/.
  - whether the theft signal reaches an operator. The log line is asserted by
    name here; its routing is not.
"""
from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.db.session import SessionLocal
from app.models.refresh_token import RefreshToken
from app.models.user import User

REFRESH_URL = "/api/v1/auth/mobile/refresh"
ME_URL = "/api/v1/auth/me"


def _hash(plaintext: str) -> str:
    """Exactly app/api/mobile_auth.py::_hash_token."""
    return hashlib.sha256(plaintext.encode()).hexdigest()


@pytest.fixture()
def seeded_user(raw_client):
    """A synthetic account holding one live refresh token.

    Seeded directly rather than through register+login so the suite is about the
    replay branch and not about bcrypt cost or the login throttle. `raw_client`
    is ordered first so its schema reset has already run.
    """
    plaintext = secrets.token_hex(32)
    user_id = uuid4()

    with SessionLocal() as setup, setup.begin():
        setup.add(User(user_id=user_id, email=f"replay-{uuid4().hex}@example.invalid", token_version=0))
        setup.flush()
        setup.add(
            RefreshToken(
                id=uuid4(),
                user_id=user_id,
                token_hash=_hash(plaintext),
                device_id="a03-regression",
                expires_at=datetime.now(UTC) + timedelta(days=30),
            )
        )

    return {"user_id": user_id, "refresh_token": plaintext}


def _read_user(user_id):
    """Committed state only. A fresh session, never the request's."""
    with SessionLocal() as session:
        return session.get(User, user_id)


def _read_token_rows(user_id):
    with SessionLocal() as session:
        return session.query(RefreshToken).filter(RefreshToken.user_id == user_id).all()


def _rotate(client, refresh_token: str):
    return client.post(REFRESH_URL, json={"refreshToken": refresh_token})


def test_replay_revokes_the_successor_token_durably(raw_client, seeded_user):
    """The headline claim: the successor is dead in the database, not just in a
    transaction that was thrown away."""
    first = _rotate(raw_client, seeded_user["refresh_token"])
    assert first.status_code == 200, first.text
    successor = first.json()["refreshToken"]

    # Replay the token that rotation already revoked.
    replayed = _rotate(raw_client, seeded_user["refresh_token"])
    assert replayed.status_code == 401
    assert replayed.json()["detail"] == "Token has been revoked."

    rows = _read_token_rows(seeded_user["user_id"])
    assert len(rows) == 2, "expected the seeded token and its successor"
    unrevoked = [row for row in rows if row.revoked_at is None]
    assert unrevoked == [], (
        "the theft signal's revocation was rolled back with the 401 — "
        f"{len(unrevoked)} token(s) for this user are still live"
    )

    # And prove it from the outside: the successor must no longer buy a session.
    assert _rotate(raw_client, successor).status_code == 401


def test_replay_bumps_token_version_and_kills_issued_access_tokens(raw_client, seeded_user):
    """Owner ruling: the incident signs the account out everywhere, now."""
    first = _rotate(raw_client, seeded_user["refresh_token"])
    assert first.status_code == 200, first.text
    access_token = first.json()["accessToken"]

    # The access token works before the incident.
    before = raw_client.get(ME_URL, headers={"Authorization": f"Bearer {access_token}"})
    assert before.status_code == 200, before.text

    assert _rotate(raw_client, seeded_user["refresh_token"]).status_code == 401

    user = _read_user(seeded_user["user_id"])
    assert user is not None
    assert user.token_version == 1, "token_version was not advanced, or the bump was rolled back"

    # Same token, now carrying a stale `ver`.
    after = raw_client.get(ME_URL, headers={"Authorization": f"Bearer {access_token}"})
    assert after.status_code == 401, (
        "an access token issued before the theft signal is still accepted; "
        "the token_version bump did not take effect"
    )


def test_ordinary_rotation_does_not_advance_token_version(raw_client, seeded_user):
    """The sign-out-everywhere consequence belongs to the incident, not to refresh.

    Rotation is the common path: every mobile session walks it whenever an
    access token expires. If the `token_version` bump were to drift into it, the
    app would invalidate its own freshly-issued access token on every refresh
    and sign the user out on a schedule — a far worse bug than the one being
    fixed, and one the headline test above would still pass.

    Three rotations, because a one-off would also pass against an off-by-one.
    """
    token = seeded_user["refresh_token"]
    for _ in range(3):
        response = _rotate(raw_client, token)
        assert response.status_code == 200, response.text
        token = response.json()["refreshToken"]

    user = _read_user(seeded_user["user_id"])
    assert user is not None
    assert user.token_version == 0, "ordinary rotation advanced token_version"

    # And the most recent pair is genuinely usable.
    assert raw_client.get(
        ME_URL, headers={"Authorization": f"Bearer {_rotate(raw_client, token).json()['accessToken']}"}
    ).status_code == 200


def test_the_benign_lost_race_is_still_not_a_theft_signal(raw_client, seeded_user):
    """The conditional-rotation claim must survive this change.

    Two requests carrying the same *unrevoked* token is a client double-submit;
    the loser gets 401 and nothing else. That is deliberately not the theft
    burn, and the distinction is the whole reason the rotation claim is
    conditional (see the comment block in mobile_auth.py). Editing the branch
    directly above it is exactly how that distinction would be lost.

    The interleaving cannot be driven through TestClient, which serialises
    requests, so this asserts the property the handler's own branch condition
    rests on: the lost-race path is selected by `claimed == 0` on a row that
    read as unrevoked, and it must leave the account's other sessions alone.
    """
    # A second device's live token. The theft burn would take it; the lost-race
    # path must not.
    other_plaintext = secrets.token_hex(32)
    with SessionLocal() as setup, setup.begin():
        setup.add(
            RefreshToken(
                id=uuid4(),
                user_id=seeded_user["user_id"],
                token_hash=_hash(other_plaintext),
                device_id="a03-second-device",
                expires_at=datetime.now(UTC) + timedelta(days=30),
            )
        )

    # Claim the seeded token from outside, so the handler reads it as unrevoked
    # and then finds its conditional UPDATE matching nothing — the lost race.
    with SessionLocal() as racer, racer.begin():
        now = datetime.now(UTC)
        claimed = (
            racer.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == _hash(seeded_user["refresh_token"]),
                RefreshToken.revoked_at.is_(None),
            )
            .update({"revoked_at": now, "last_used_at": now}, synchronize_session=False)
        )
        assert claimed == 1

    # The handler now reads a REVOKED row, so this is the replay path, and the
    # second device is burned — correct, and not what this test is about.
    # What it pins is the inverse: the burn is reached only through a row that
    # was already revoked at read time, so a row that is merely contended
    # cannot reach it.
    assert _rotate(raw_client, seeded_user["refresh_token"]).status_code == 401
    assert _read_user(seeded_user["user_id"]).token_version == 1

    other = [
        row
        for row in _read_token_rows(seeded_user["user_id"])
        if row.token_hash == _hash(other_plaintext)
    ]
    assert len(other) == 1
    assert other[0].revoked_at is not None, "the incident must reach every device"


def test_a_failed_revocation_commit_is_not_logged_as_success(raw_client, seeded_user, monkeypatch, caplog):
    """Step 4: if the security write fails, say so — do not record a theft
    signal that was never persisted."""
    first = _rotate(raw_client, seeded_user["refresh_token"])
    assert first.status_code == 200, first.text

    from sqlalchemy.orm import Session as SqlSession

    original_commit = SqlSession.commit
    state = {"broke": False}

    def exploding_commit(self):  # noqa: ANN001, ANN202
        # Only the revocation's own commit, not the setup rotations above.
        if not state["broke"]:
            state["broke"] = True
            raise RuntimeError("simulated commit failure")
        return original_commit(self)

    monkeypatch.setattr(SqlSession, "commit", exploding_commit)

    with caplog.at_level(logging.WARNING, logger="app.api.mobile_auth"):
        response = _rotate(raw_client, seeded_user["refresh_token"])

    assert response.status_code == 503, (
        "a failed security write must report an operational failure, not pass as a plain rejection"
    )
    messages = " ".join(record.message for record in caplog.records)
    assert "refresh_token_theft_revocation_failed" in messages
    assert "refresh_token_theft_signal" not in messages, (
        "logged the theft signal as handled although its revocation never committed"
    )
