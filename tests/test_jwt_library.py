"""The JWT library swap (REFACTOR_PLAN 1.2): python-jose -> PyJWT.

python-jose carried two advisories with no fixed release (CVE-2026-85394 on
jose itself, the ecdsa Minerva issue on its transitive dependency), both
ignored in CI on stated premises. PyJWT retires them. This pins what must not
change across the swap:

- A session minted before the deploy still works after it. The two tokens
  below were signed by python-jose 3.5.0 through the exact claim set
  `create_access_token` builds (synthetic secret and subject), so the first
  request after the deploy is a token PyJWT never issued.
- Everything the old decoder refused is still refused: expired, tampered,
  signed under another algorithm, `alg: none`.
- Nothing imports `jose` any more, so the library (and the ignores that came
  with it) cannot drift back in.

What it cannot see: tokens signed under a different secret than the one the
deployment has (a rotated secret logs everyone out under either library), and
clock skew between issuing and verifying hosts (single-host today).
"""
from __future__ import annotations

import ast
from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import SimpleNamespace
from uuid import UUID

import pytest
from fastapi import HTTPException

from app.core import auth

pytestmark = pytest.mark.no_db

REPO = Path(__file__).resolve().parents[1]
SECRET = "synthetic-jwt-compat-secret-not-a-real-key-0123456789"
SUBJECT = str(UUID(int=0x5A17))

# Signed by python-jose 3.5.0 on 2026-10-08 with SECRET. HS256 access token
# and HS512 password-reset token; exp 2099-01-01.
JOSE_HS256 = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDVhMTci"
    "LCJpYXQiOjE3OTE0MTc2MDAsImV4cCI6NDA3MDkwODgwMCwidHlwIjoiYWNjZXNzIiwidmVyIjozLCJqdGkiOiJzeW50aGV0aWMt"
    "anRpLTAwMDEifQ.7C4XoNhgKvqdlIFh6t7M2rt7jF20LVhg3hCGEtFua-s"
)
JOSE_HS512 = (
    "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDVhMTci"
    "LCJpYXQiOjE3OTE0MTc2MDAsImV4cCI6NDA3MDkwODgwMCwidHlwIjoicHdyZXNldCIsInZlciI6MywianRpIjoic3ludGhldGlj"
    "LWp0aS0wMDAxIn0.xDS4snW7NSpcFacMO324kepCF5A4fFtFnlJv4GFu7bZdRPg3fcc_RvHTBkLuhID0g917OC8N1ojvCijhbyW-8A"
)


@pytest.fixture
def settings(monkeypatch):
    current = SimpleNamespace(jwt_secret=SECRET, jwt_algorithm="HS256", jwt_expire_minutes=60)
    monkeypatch.setattr(auth, "get_settings", lambda: current)
    return current


@pytest.mark.parametrize(("token", "alg", "typ"), [(JOSE_HS256, "HS256", "access"), (JOSE_HS512, "HS512", "pwreset")])
def test_a_token_python_jose_signed_still_verifies(settings, token, alg, typ) -> None:
    settings.jwt_algorithm = alg
    payload = auth.decode_token(token)
    assert payload == {
        "sub": SUBJECT, "iat": 1791417600, "exp": 4070908800, "typ": typ, "ver": 3, "jti": "synthetic-jti-0001",
    }


def test_a_new_token_round_trips_with_integer_times(settings) -> None:
    token = auth.create_access_token(SUBJECT, token_version=2, jti="j1")
    payload = auth.decode_token(token)
    assert payload["sub"] == SUBJECT and payload["typ"] == "access" and payload["ver"] == 2 and payload["jti"] == "j1"
    assert isinstance(payload["iat"], int) and isinstance(payload["exp"], int)
    assert payload["exp"] - payload["iat"] == 60 * 60


def _refused(token: str) -> None:
    with pytest.raises(HTTPException) as caught:
        auth.decode_token(token)
    assert caught.value.status_code == 401


def test_an_expired_token_is_refused(settings) -> None:
    _refused(auth.create_access_token(SUBJECT, expires_delta=timedelta(seconds=-5)))


def test_a_tampered_signature_is_refused(settings) -> None:
    head, body, sig = JOSE_HS256.split(".")
    _refused(f"{head}.{body}.{sig[:-2]}AA")


def test_a_token_signed_under_another_algorithm_is_refused(settings) -> None:
    # Valid HS512 signature with the right secret, but the deployment pins HS256.
    _refused(JOSE_HS512)


def test_an_unsigned_token_is_refused(settings) -> None:
    head = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0"  # {"alg":"none","typ":"JWT"}
    body = JOSE_HS256.split(".")[1]
    _refused(f"{head}.{body}.")


def test_a_wrong_secret_is_refused(settings) -> None:
    settings.jwt_secret = SECRET + "-rotated"
    _refused(JOSE_HS256)


def test_nothing_imports_python_jose() -> None:
    offenders = []
    for root in ("app", "tests", "scripts"):
        for path in sorted((REPO / root).rglob("*.py")):
            tree = ast.parse(path.read_text(encoding="utf-8"))
            for node in ast.walk(tree):
                names = (
                    [a.name for a in node.names] if isinstance(node, ast.Import)
                    else [node.module or ""] if isinstance(node, ast.ImportFrom) else []
                )
                if any(n == "jose" or n.startswith("jose.") for n in names):
                    offenders.append(f"{path.relative_to(REPO).as_posix()}:{node.lineno}")
    assert offenders == []


def test_the_lock_and_project_name_pyjwt_not_jose() -> None:
    pinned = {
        line.split("==")[0].strip().lower()
        for line in (REPO / "requirements.txt").read_text(encoding="utf-8").splitlines()
        if "==" in line and not line.lstrip().startswith("#")
    }
    project = (REPO / "pyproject.toml").read_text(encoding="utf-8").lower()
    assert "pyjwt" in pinned
    assert pinned & {"python-jose", "ecdsa", "rsa", "pyasn1"} == set()
    assert '"pyjwt' in project and '"python-jose' not in project


def test_now_is_inside_the_frozen_tokens_lifetime() -> None:
    # The fixtures must stay unexpired, or the compat test would test nothing.
    assert datetime.now(UTC) < datetime(2099, 1, 1, tzinfo=UTC)
