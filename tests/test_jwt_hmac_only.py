"""Pins the premise under which CI ignores python-jose CVE-2026-85394.

GHSA-3qf3-8w2g-rqmx / CVE-2026-85394 (python-jose <= 3.5.0, no fixed release):
HMAC key initialisation accepts a DER-encoded *public* key, so an attacker who
holds the service's public key can forge HS256 tokens when the decoder does not
restrict ``algorithms``. It is an algorithm-confusion attack and needs both:

1. an asymmetric key pair whose public half is used as the verification key, and
2. a decode that does not pin the accepted algorithms.

Neither holds here: tokens are HMAC-only over a symmetric secret, and every
decode passes ``algorithms=[settings.jwt_algorithm]``. Until 2026-10-08 the
first half was only a comment — ``jwt_algorithm`` was a free ``str`` read from
``JOTHIDAM_JWT_ALGORITHM``. These tests make both halves fail loudly, so the
ignore in ``.github/workflows/ci.yml`` cannot outlive its reason unnoticed.

Removing the ignore for good means leaving python-jose (REFACTOR_PLAN 1.2:
migrate to PyJWT), which also drops the ecdsa Minerva advisory.
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


def _jose_decode_calls():
    """Every ``<name>.decode(...)`` where ``<name>`` is bound to ``jose.jwt``."""
    found = []
    for path in sorted((REPO / "app").rglob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        jose_names = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module == "jose":
                jose_names |= {a.asname or a.name for a in node.names if a.name == "jwt"}
        if not jose_names:
            continue
        for node in ast.walk(tree):
            if (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr == "decode"
                and isinstance(node.func.value, ast.Name)
                and node.func.value.id in jose_names
            ):
                found.append((path.relative_to(REPO).as_posix(), node))
    return found


def test_every_jose_decode_pins_its_algorithms():
    calls = _jose_decode_calls()
    # app/core/auth.py and app/middleware.py at the time of writing; a scan that
    # finds nothing would pass vacuously.
    assert {p for p, _ in calls} >= {"app/core/auth.py", "app/middleware.py"}
    unpinned = [
        f"{p}:{n.lineno}"
        for p, n in calls
        if not any(k.arg == "algorithms" and isinstance(k.value, ast.List) for k in n.keywords)
    ]
    assert unpinned == []
