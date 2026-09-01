"""Refresh-token rotation must be atomic (P1-6).

The audit claimed rotation was not atomic and the triage doc marked that
unverified, with instructions to reproduce before fixing. Firing concurrent
refreshes through TestClient came back clean — but TestClient can serialise
requests, so "it did not happen" is not "it cannot happen". Driving two real
database sessions through the interleaving by hand showed it plainly: both read
`revoked_at IS NULL`, both passed every check, and both commits succeeded.

That is one stolen refresh token becoming two live sessions, with the
revoked-token theft signal silent throughout — neither request ever saw a
revoked row, so neither tripped it.

The fix is a conditional `UPDATE ... WHERE revoked_at IS NULL` whose rowcount
decides the winner. This test drives the same interleaving and asserts the
database now awards the claim exactly once.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.db.session import SessionLocal
from app.models.refresh_token import RefreshToken
from app.models.user import User

TOKEN_HASH = "rotation-race-regression-hash"


@pytest.fixture()
def live_token(client):
    """A single unrevoked refresh token, and the two sessions that will fight
    over it. `client` is here only to reset the schema."""
    with SessionLocal() as setup, setup.begin():
        setup.query(RefreshToken).filter(RefreshToken.token_hash == TOKEN_HASH).delete()
        user = User(user_id=uuid4(), email=f"rotation-{uuid4().hex}@example.invalid")
        setup.add(user)
        setup.flush()
        setup.add(
            RefreshToken(
                id=uuid4(),
                user_id=user.user_id,
                token_hash=TOKEN_HASH,
                device_id="regression-probe",
                expires_at=datetime.now(UTC) + timedelta(days=30),
            )
        )
    yield
    with SessionLocal() as teardown, teardown.begin():
        teardown.query(RefreshToken).filter(RefreshToken.token_hash == TOKEN_HASH).delete()


def _claim(session, row_id) -> int:
    """The rotation claim exactly as app/api/mobile_auth.py performs it."""
    now = datetime.now(UTC)
    return (
        session.query(RefreshToken)
        .filter(RefreshToken.id == row_id, RefreshToken.revoked_at.is_(None))
        .update({"revoked_at": now, "last_used_at": now}, synchronize_session=False)
    )


def test_only_one_of_two_interleaved_rotations_can_claim_the_token(live_token):
    first, second = SessionLocal(), SessionLocal()
    try:
        row_a = first.query(RefreshToken).filter(RefreshToken.token_hash == TOKEN_HASH).first()
        row_b = second.query(RefreshToken).filter(RefreshToken.token_hash == TOKEN_HASH).first()

        # The precondition that made the old code unsafe: both requests are
        # past the "is it revoked?" check before either has written anything.
        assert row_a.revoked_at is None
        assert row_b.revoked_at is None

        claimed_a = _claim(first, row_a.id)
        first.commit()
        claimed_b = _claim(second, row_b.id)
        second.commit()
    finally:
        first.close()
        second.close()

    assert claimed_a == 1, "the first rotation should win the token"
    assert claimed_b == 0, (
        "the second rotation also claimed the token — one refresh token has "
        "just produced two live sessions"
    )


def test_the_token_ends_up_revoked_exactly_once(live_token):
    with SessionLocal() as session:
        row = session.query(RefreshToken).filter(RefreshToken.token_hash == TOKEN_HASH).first()
        assert _claim(session, row.id) == 1
        session.commit()

        # A later reuse of the same token claims nothing, which is what routes
        # it to the theft-signal branch rather than issuing a session.
        assert _claim(session, row.id) == 0
        session.commit()

        session.refresh(row)
        assert row.revoked_at is not None
