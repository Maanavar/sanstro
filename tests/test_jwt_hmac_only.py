"""Pins the HMAC-only, algorithm-pinned JWT design.

Algorithm confusion — verifying a token with key material of the wrong kind
because the token's own header chose the algorithm — needs both:

1. an asymmetric key pair whose public half is used as the verification key, and
2. a decode that does not pin the accepted algorithms.

Neither holds here: tokens are HMAC-only over a symmetric secret, and every
decode passes ``algorithms=[settings.jwt_algorithm]``. This premise is what CI
ignored python-jose CVE-2026-85394 on until 2026-10-08; the app has since moved
to PyJWT (REFACTOR_PLAN 1.2, ``tests/test_jwt_library.py``) and the ignore is
gone, but the design is still the defence, so both halves keep failing loudly.
"""

from __future__ import annotations

import ast
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.core.config import Settings

pytestmark = pytest.mark.no_db

REPO = Path(__file__).resolve().parents[1]


@pytest.fixture(autouse=True, scope="session")
def require_db():  # noqa: F811 - shadows conftest require_db; no DB needed
    return


def _settings(**overrides):
    kwargs = {"database_url": "postgresql://example/test", "_env_file": None}
    kwargs.update(overrides)
    return Settings(**kwargs)


def test_default_algorithm_is_hmac(monkeypatch):
    monkeypatch.delenv("JOTHIDAM_JWT_ALGORITHM", raising=False)
    assert _settings().jwt_algorithm == "HS256"


@pytest.mark.parametrize("alg", ["HS256", "HS384", "HS512"])
def test_hmac_algorithms_are_accepted(alg):
    assert _settings(jwt_algorithm=alg).jwt_algorithm == alg


@pytest.mark.parametrize("alg", ["RS256", "ES256", "PS256", "EdDSA", "none", "hs256"])
def test_non_hmac_algorithm_is_refused_at_boot(monkeypatch, alg):
    """An asymmetric algorithm would put a public key on the verify path."""
    monkeypatch.setenv("JOTHIDAM_JWT_ALGORITHM", alg)
    with pytest.raises(ValidationError, match="jwt_algorithm"):
        _settings()


def _jwt_decode_calls():
    """Every ``<name>.decode(...)`` where ``<name>`` is the PyJWT module."""
    found = []
    for path in sorted((REPO / "app").rglob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        jwt_names = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                jwt_names |= {a.asname or a.name for a in node.names if a.name == "jwt"}
        if not jwt_names:
            continue
        for node in ast.walk(tree):
            if (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr == "decode"
                and isinstance(node.func.value, ast.Name)
                and node.func.value.id in jwt_names
            ):
                found.append((path.relative_to(REPO).as_posix(), node))
    return found


def test_every_jwt_decode_pins_its_algorithms():
    calls = _jwt_decode_calls()
    # app/core/auth.py and app/middleware.py at the time of writing; a scan that
    # finds nothing would pass vacuously.
    assert {p for p, _ in calls} >= {"app/core/auth.py", "app/middleware.py"}
    unpinned = [
        f"{p}:{n.lineno}"
        for p, n in calls
        if not any(k.arg == "algorithms" and isinstance(k.value, ast.List) for k in n.keywords)
    ]
    assert unpinned == []
