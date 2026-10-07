"""Server-side premium gates (R-1, capability reference §21; app/core/entitlements.py).

The matrix the capability reference asks for: open beta on and off × registered
and premium, for every gated route. Guests never reach these routes — they need
a session — so the guest column is the auth layer's, not this module's.
"""
from __future__ import annotations

from dataclasses import fields
from uuid import UUID, uuid4

import pytest
from fastapi.routing import APIRoute

from app.core.config import get_settings
from app.core.entitlements import UNENFORCEABLE_FEATURES, require_feature
from app.core.tier_limits import TIER_LIMITS, TierLimits
from app.main import app
from app.models.subscription import Subscription
from tests.conftest import TEST_USER_ID, SessionLocal

_ANY = str(uuid4())

#: (method, path, json body or None) for every route that must carry a gate.
GATED_CALLS: dict[str, list[tuple[str, str, dict | None]]] = {
    "varshaphala_enabled": [("GET", f"/api/v1/charts/{_ANY}/varshaphala?year=2026", None)],
    "synastry_enabled": [
        ("GET", f"/api/v1/relationships/{_ANY}/synastry?familyVaultId={_ANY}", None),
        ("POST", "/api/v1/relationships/compare-synastry", {}),
    ],
    "retrospective_enabled": [
        ("GET", f"/api/v1/retrospective?chartId={_ANY}", None),
        ("POST", "/api/v1/retrospective", {}),
    ],
    "life_event_log_enabled": [
        ("GET", f"/api/v1/charts/{_ANY}/life-event-log", None),
        ("POST", f"/api/v1/charts/{_ANY}/life-event-log", {}),
    ],
    "birth_time_rectification_enabled": [
        ("POST", f"/api/v1/birth-profiles/{_ANY}/rectify", {}),
        ("PATCH", f"/api/v1/birth-profiles/{_ANY}/rectify/apply", {}),
    ],
}
_CASES = [(feature, *call) for feature, calls in GATED_CALLS.items() for call in calls]


def _gates_by_route() -> dict[tuple[str, str], set[str]]:
    gates: dict[tuple[str, str], set[str]] = {}
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        found = {
            getattr(dep.dependency, "required_feature", None) for dep in route.dependencies
        } - {None}
        if found:
            for method in route.methods:
                gates[(method, route.path)] = found  # type: ignore[assignment]
    return gates


# ── Structure ────────────────────────────────────────────────────────────────


@pytest.mark.no_db
def test_every_premium_only_boolean_is_gated_or_has_a_recorded_reason() -> None:
    """A new premium flag cannot ship as a UI-only lock without a written reason."""
    premium, registered = TIER_LIMITS["premium"], TIER_LIMITS["registered"]
    premium_only = {
        f.name
        for f in fields(TierLimits)
        if getattr(premium, f.name) is True and getattr(registered, f.name) is False
    }
    gated = set().union(*_gates_by_route().values())
    assert premium_only <= gated | set(UNENFORCEABLE_FEATURES), premium_only - gated - set(UNENFORCEABLE_FEATURES)
    assert not gated & set(UNENFORCEABLE_FEATURES), "a feature is both gated and listed as unenforceable"


@pytest.mark.no_db
def test_the_gated_route_set_is_exactly_the_expected_one() -> None:
    gates = _gates_by_route()
    expected = {
        (method, path.split("?")[0].replace(_ANY, "{x}")): feature
        for feature, method, path, _ in _CASES
    }
    actual = {
        (method, path): next(iter(features))
        for (method, path), features in gates.items()
    }
    normalised = {}
    for (method, path), feature in actual.items():
        parts = ["{x}" if p.startswith("{") else p for p in path.split("/")]
        normalised[(method, "/".join(parts))] = feature
    assert normalised == expected


@pytest.mark.no_db
def test_a_misspelt_feature_fails_at_import_time() -> None:
    with pytest.raises(ValueError):
        require_feature("varshapala_enabled")
    with pytest.raises(ValueError):
        require_feature("goals_max")  # a number, not a boolean


# ── Behaviour: beta on/off × registered/premium ──────────────────────────────


def _make_registered() -> None:
    with SessionLocal() as session, session.begin():
        session.query(Subscription).filter(Subscription.user_id == UUID(TEST_USER_ID)).delete()


def _call(client, method: str, path: str, body: dict | None):
    return client.request(method, path, json=body)


def _is_premium_required(response) -> bool:
    if response.status_code != 403:
        return False
    return (response.json().get("error") or {}).get("code") == "PREMIUM_REQUIRED"


@pytest.mark.parametrize(("feature", "method", "path", "body"), _CASES)
def test_registered_account_is_refused_once_the_beta_ends(client, monkeypatch, feature, method, path, body) -> None:
    monkeypatch.setattr(get_settings(), "open_beta", False)
    _make_registered()
    response = _call(client, method, path, body)
    assert _is_premium_required(response), (feature, response.status_code, response.text)
    assert response.json()["error"]["message"]["ta"], "PREMIUM_REQUIRED must carry Tamil copy"


@pytest.mark.parametrize(("feature", "method", "path", "body"), _CASES)
def test_registered_account_passes_the_gate_while_the_beta_runs(client, monkeypatch, feature, method, path, body) -> None:
    monkeypatch.setattr(get_settings(), "open_beta", True)
    _make_registered()
    assert not _is_premium_required(_call(client, method, path, body)), feature


@pytest.mark.parametrize("beta", [True, False])
@pytest.mark.parametrize(("feature", "method", "path", "body"), _CASES)
def test_a_subscriber_passes_the_gate_with_or_without_the_beta(client, monkeypatch, beta, feature, method, path, body) -> None:
    """The `client` fixture's user holds an active premium subscription."""
    monkeypatch.setattr(get_settings(), "open_beta", beta)
    assert not _is_premium_required(_call(client, method, path, body)), feature
