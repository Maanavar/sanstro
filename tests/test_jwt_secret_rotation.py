"""JWT secret rotation without signing anyone out, and the length floor.

Before 2026-10-10 ``JOTHIDAM_JWT_SECRET`` was a single value that both signed
and verified. Changing it invalidated every token in flight at once, so the one
secret in the system that most wants rotating was the one nobody could rotate
without planning a forced sign-out of the whole web tier. That is why the
``InsecureKeyLengthWarning`` PyJWT started emitting on 2026-10-08 (an HMAC
secret shorter than its hash) was recorded as "owner decision, not done here":
the fix was an outage.

``JOTHIDAM_JWT_SECRETS`` (comma-separated, newest first) removes the outage, so
the length floor can be enforced instead of logged. This pins both halves.

What it cannot see:
- A real deploy. These are ``Settings(...)`` constructions and in-process
  tokens; whether the operator actually sets the plural variable, and waits a
  token lifetime before dropping the old secret, is procedural
  (``docs/DATA_PROTECTION.md`` section 2a).
- Mobile's recovery path. A rotation that *does* invalidate an access token is
  survivable on mobile because the refresh token is an opaque DB row, not a JWT
  - asserted in ``tests/test_refresh_replay_revocation.py``, not here.
- Whether production's current secret is long enough. Only the deployment knows
  its own value; this makes a short one refuse to boot rather than warn.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import jwt
import pytest
from fastapi import HTTPException

from app.core import auth, jwt_keys
from app.core.config import Settings

pytestmark = pytest.mark.no_db

# Synthetic, and long enough for HS256 so the length floor is not what is under
# test except where a test says so.
OLD = "synthetic-old-jwt-secret-0123456789-not-a-real-key"
NEW = "synthetic-new-jwt-secret-9876543210-not-a-real-key"
SUBJECT = "00000000-0000-0000-0000-0000000005a17"


@pytest.fixture(autouse=True, scope="session")
def require_db():  # noqa: F811 - shadows conftest require_db; no DB needed
    return


@pytest.fixture
def settings(monkeypatch):
    """Patch both readers: auth reads the algorithm, jwt_keys the secrets."""
    current = SimpleNamespace(
        jwt_secret=OLD, jwt_secrets="", jwt_algorithm="HS256", jwt_expire_minutes=60
    )
    monkeypatch.setattr(auth, "get_settings", lambda: current)
    monkeypatch.setattr(jwt_keys, "get_settings", lambda: current)
    return current


# -- the precedence rule ----------------------------------------------------


def test_the_plural_form_wins_and_keeps_its_order() -> None:
    assert jwt_keys.split_jwt_secrets(f"{NEW}, {OLD}", "ignored") == [NEW, OLD]


def test_a_single_secret_containing_a_comma_is_not_split() -> None:
    """Why the plural form is its own variable rather than a comma in the old one."""
    assert jwt_keys.split_jwt_secrets("", "secret,with,commas") == ["secret,with,commas"]


def test_neither_set_is_empty_not_an_error_here() -> None:
    """The caller decides: a boot failure in production, an ephemeral in dev."""
    assert jwt_keys.split_jwt_secrets("", "") == []


def test_no_secret_configured_is_a_runtime_error(settings) -> None:
    settings.jwt_secret = ""
    with pytest.raises(RuntimeError, match="not configured"):
        jwt_keys.configured_jwt_secrets()


def test_the_same_secret_listed_twice_is_refused(settings) -> None:
    """Listing it twice means someone believes they are rotating and is not."""
    settings.jwt_secrets = f"{NEW},{NEW}"
    with pytest.raises(RuntimeError, match="not a rotation"):
        jwt_keys.configured_jwt_secrets()


# -- the rotation itself ----------------------------------------------------


def test_a_token_signed_under_the_old_secret_survives_the_rotation(settings) -> None:
    """Stage 1: prepend the new secret. Nobody is signed out."""
    token = auth.create_access_token(SUBJECT)
    settings.jwt_secrets = f"{NEW},{OLD}"
    assert auth.decode_token(token)["sub"] == SUBJECT


def test_new_tokens_are_signed_with_the_newest_secret(settings) -> None:
    settings.jwt_secrets = f"{NEW},{OLD}"
    token = auth.create_access_token(SUBJECT)
    # Verifiable with NEW alone; OLD alone rejects it.
    assert jwt.decode(token, NEW, algorithms=["HS256"])["sub"] == SUBJECT
    with pytest.raises(jwt.InvalidSignatureError):
        jwt.decode(token, OLD, algorithms=["HS256"])


def test_dropping_the_old_secret_is_what_signs_people_out(settings) -> None:
    """Stage 2, done too early: the cost the single-secret form paid every time."""
    token = auth.create_access_token(SUBJECT)
    settings.jwt_secrets = NEW
    with pytest.raises(HTTPException) as exc:
        auth.decode_token(token)
    assert exc.value.status_code == 401


def test_signing_secret_is_the_first_entry(settings) -> None:
    settings.jwt_secrets = f"{NEW},{OLD}"
    assert jwt_keys.signing_secret() == NEW


def test_an_expired_token_reports_expiry_not_a_bad_signature(settings) -> None:
    """The error from the secret that *did* verify the signature is the honest one.

    A naive loop reports the last attempt's failure, so an expired token signed
    under the older secret would be reported as a signature failure - sending
    whoever reads the log looking for a key problem.
    """
    expired = jwt.encode(
        {"sub": SUBJECT, "exp": datetime.now(UTC) - timedelta(minutes=5)}, OLD, algorithm="HS256"
    )
    settings.jwt_secrets = f"{NEW},{OLD}"
    with pytest.raises(jwt.ExpiredSignatureError):
        jwt_keys.decode_jwt_payload(expired)


def test_a_malformed_token_is_not_retried_against_every_secret(settings) -> None:
    settings.jwt_secrets = f"{NEW},{OLD}"
    with pytest.raises(jwt.DecodeError):
        jwt_keys.decode_jwt_payload("not-a-jwt")


# -- the length floor -------------------------------------------------------


@pytest.mark.parametrize(("alg", "minimum"), [("HS256", 32), ("HS384", 48), ("HS512", 64)])
def test_the_floor_is_the_hash_width(alg, minimum) -> None:
    assert jwt_keys.undersized_jwt_secrets(["x" * (minimum - 1)], alg) == [1]
    assert jwt_keys.undersized_jwt_secrets(["x" * minimum], alg) == []


def test_it_reports_positions_so_the_message_cannot_echo_a_secret() -> None:
    assert jwt_keys.undersized_jwt_secrets(["x" * 32, "short", "y" * 32, "s"], "HS256") == [2, 4]


def _production(**overrides):
    kwargs = {
        "database_url": "postgresql://example/test",
        "environment": "production",
        "encryption_key": "configured",
        "cookie_secure": True,
        "admin_api_key": "synthetic-admin-key",
        "_env_file": None,
    }
    kwargs.update(overrides)
    return Settings(**kwargs)


def test_production_refuses_a_short_secret(monkeypatch) -> None:
    monkeypatch.delenv("JOTHIDAM_JWT_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="shorter than 32 bytes"):
        _production(jwt_secret="too-short")


def test_production_boots_with_a_long_secret(monkeypatch) -> None:
    monkeypatch.delenv("JOTHIDAM_JWT_SECRET", raising=False)
    assert _production(jwt_secret=OLD).jwt_secret == OLD


def test_production_refuses_a_short_secret_mid_rotation(monkeypatch) -> None:
    """A rotation is not an excuse to leave a weak secret on the verify path."""
    monkeypatch.delenv("JOTHIDAM_JWT_SECRET", raising=False)
    with pytest.raises(RuntimeError, match=r"entries \[2\]"):
        _production(jwt_secrets=f"{NEW},weak")


def test_the_refusal_names_the_variable_actually_set(monkeypatch) -> None:
    monkeypatch.delenv("JOTHIDAM_JWT_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="JOTHIDAM_JWT_SECRET shorter"):
        _production(jwt_secret="weak")


def test_the_refusal_never_prints_the_secret(monkeypatch) -> None:
    monkeypatch.delenv("JOTHIDAM_JWT_SECRET", raising=False)
    with pytest.raises(RuntimeError) as exc:
        _production(jwt_secret="w3ak-but-identifiable")
    assert "w3ak-but-identifiable" not in str(exc.value)


def test_the_plural_form_alone_satisfies_the_required_secret(monkeypatch) -> None:
    """Mid-rotation a deployment may set only the plural one; that must boot."""
    monkeypatch.delenv("JOTHIDAM_JWT_SECRET", raising=False)
    settings = _production(jwt_secrets=f"{NEW},{OLD}")
    assert jwt_keys.split_jwt_secrets(settings.jwt_secrets, settings.jwt_secret) == [NEW, OLD]


def test_a_worker_is_not_asked_about_the_jwt_secret(monkeypatch) -> None:
    """The scheduler serves no HTTP and verifies no token."""
    monkeypatch.delenv("JOTHIDAM_JWT_SECRET", raising=False)
    assert _production(process_role="worker", jwt_secret="short").jwt_secret == "short"


def test_development_does_not_refuse_a_short_secret(monkeypatch) -> None:
    """Dev keeps booting: the floor protects real sessions, and dev has none."""
    monkeypatch.delenv("JOTHIDAM_JWT_SECRET", raising=False)
    settings = Settings(
        database_url="postgresql://example/test",
        environment="development",
        jwt_secret="short",
        _env_file=None,
    )
    assert settings.jwt_secret == "short"


def test_development_does_not_mint_an_ephemeral_over_a_configured_rotation(monkeypatch) -> None:
    """The plural form counts as configured, or dev would sign its own tokens off."""
    monkeypatch.delenv("JOTHIDAM_JWT_SECRET", raising=False)
    settings = Settings(
        database_url="postgresql://example/test",
        environment="development",
        jwt_secrets=f"{NEW},{OLD}",
        _env_file=None,
    )
    assert settings.jwt_secret is None
    assert jwt_keys.split_jwt_secrets(settings.jwt_secrets, settings.jwt_secret) == [NEW, OLD]
