"""Regression tests for the versioned, typed API error envelope."""
from __future__ import annotations

import re
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

import app.core.errors as errors_module
import app.middleware as middleware_module
from app.core.error_codes import ERROR_MESSAGES, ErrorCode
from app.core.errors import _DETAIL_CODE_RULES, AppError, _infer_http_error_code, register_error_handlers
from app.core.rate_limit import reset_rate_limit_backend
from app.main import app
from app.services.feature_flags import reset_flag, set_flag


def test_every_error_code_has_distinct_nonempty_bilingual_copy() -> None:
    assert set(ERROR_MESSAGES) == set(ErrorCode)

    for code, definition in ERROR_MESSAGES.items():
        message = definition["message"]
        assert message["ta"].strip(), code
        assert message["en"].strip(), code
        assert message["ta"] != message["en"], code


def test_shared_typescript_error_codes_match_backend_catalogue() -> None:
    shared_errors = (
        Path(__file__).resolve().parents[1] / "packages" / "shared" / "src" / "api" / "errors.ts"
    ).read_text(encoding="utf-8")
    match = re.search(r"API_ERROR_CODES\s*=\s*\[(.*?)\]\s*as const", shared_errors, flags=re.DOTALL)
    assert match is not None

    shared_codes = set(re.findall(r'"([A-Z_]+)"', match.group(1)))
    backend_codes = {code.value for code in ErrorCode}
    assert shared_codes == backend_codes


def test_not_found_error_uses_typed_envelope_and_request_id(client) -> None:
    response = client.get("/api/v1/birth-profiles/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == ErrorCode.BIRTH_PROFILE_NOT_FOUND.value
    assert body["error"]["message"]["ta"]
    assert body["error"]["message"]["en"]
    assert body["error"]["request_id"] == response.headers["X-Request-ID"]
    assert body["request_id"] == response.headers["X-Request-ID"]
    assert body["detail"] == "Birth profile not found. Please create one to get started."


def test_request_validation_error_keeps_compatibility_detail_and_adds_code(client) -> None:
    response = client.get("/api/v1/birth-profiles/not-a-uuid")

    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == ErrorCode.VALIDATION_ERROR.value
    assert body["error"]["field"] == "birth_profile_id"
    assert isinstance(body["detail"], list)
    assert body["error"]["request_id"] == response.headers["X-Request-ID"]


def test_unhandled_exception_returns_redacted_typed_error(raw_client) -> None:
    async def _crash() -> None:
        raise RuntimeError("SELECT private_value FROM users at C:\\workspace\\secret.py")

    route = APIRoute("/__test-error-envelope-crash", _crash, methods=["GET"])
    app.router.routes.append(route)
    try:
        response = raw_client.get(route.path)
    finally:
        app.router.routes.remove(route)

    assert response.status_code == 500
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == ErrorCode.INTERNAL_ERROR.value
    assert body["error"]["request_id"] == response.headers["X-Request-ID"]
    assert body["detail"] == "Internal server error."

    serialized = response.text.lower()
    for forbidden in ("traceback", "select private", "secret.py", "workspace"):
        assert forbidden not in serialized


# ── The typed path, end to end ───────────────────────────────────────────────

def test_app_error_raiser_reports_its_own_code_without_prose_inference(client) -> None:
    """A converted raiser must not depend on _infer_http_error_code at all.

    The 404 below is raised as `AppError(BIRTH_PROFILE_NOT_FOUND)`. Blanking the
    inference table proves the code on the wire came from the raiser: with the
    table empty, an un-migrated HTTPException would fall back to the generic
    RESOURCE_NOT_FOUND for this status.
    """
    with patch.object(errors_module, "_DETAIL_CODE_RULES", ()):
        response = client.get("/api/v1/birth-profiles/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == ErrorCode.BIRTH_PROFILE_NOT_FOUND.value


def test_app_error_is_catchable_as_httpexception() -> None:
    """Thirteen `except HTTPException` blocks in app/ treat one as control flow.

    If AppError stopped being an HTTPException, every converted raiser would
    escape those blocks and change behaviour far from its call site — a family
    member would surface an error instead of being skipped.
    """
    with pytest.raises(HTTPException) as caught:
        raise AppError(ErrorCode.CHART_NOT_FOUND)

    assert caught.value.status_code == 404
    assert caught.value.detail == ERROR_MESSAGES[ErrorCode.CHART_NOT_FOUND]["user_message"]


def test_detail_rule_order_keeps_specific_fragments_ahead_of_general_ones() -> None:
    """Pins the orderings that make the transitional table safe.

    _DETAIL_CODE_RULES is first-match-wins, so appending a rule can silently
    shadow an earlier one. This is the bug the web-side table had before P2-3;
    it is pinned here so it cannot be reintroduced on the backend.
    """
    positions = {code: index for index, (_fragment, code) in enumerate(_DETAIL_CODE_RULES)}
    assert positions[ErrorCode.BIRTH_TIME_REQUIRED] < positions[ErrorCode.BIRTH_PROFILE_NOT_FOUND]
    assert positions[ErrorCode.DAILY_LIMIT_REACHED] < positions[ErrorCode.RESOURCE_LIMIT_EXCEEDED]

    # No fragment may contain an earlier one, which is what shadowing looks like.
    fragments = [fragment for fragment, _code in _DETAIL_CODE_RULES]
    for later_index, later in enumerate(fragments):
        for earlier in fragments[:later_index]:
            assert earlier not in later, f"{later!r} is shadowed by the earlier {earlier!r}"

    # A fragment short enough to match unrelated prose is the other half of the bug.
    assert all(len(fragment) >= 8 for fragment in fragments)


def test_a_429_defaults_to_rate_limited_but_a_quota_names_itself() -> None:
    """'Slow down' and 'your quota is spent' need different codes and different UI."""
    assert _infer_http_error_code(429, "Too many login attempts. Please try again later.") is ErrorCode.RATE_LIMITED

    # Shipped since before this layer existed: the key is `error`, not `code`.
    quota = {"error": "DAILY_LIMIT_REACHED", "chips_used": 3, "daily_limit": 3}
    assert _infer_http_error_code(429, quota) is ErrorCode.DAILY_LIMIT_REACHED
    monthly = {"error": "MONTHLY_LIMIT_REACHED", "chips_used": 60, "monthly_limit": 60}
    assert _infer_http_error_code(429, monthly) is ErrorCode.MONTHLY_LIMIT_REACHED


def test_an_unrecognised_code_hint_falls_back_to_the_status_not_to_internal_error() -> None:
    """A stray code string must not turn a 404 into a 500-shaped error."""
    assert _infer_http_error_code(404, {"code": "NO_SUCH_CODE"}) is ErrorCode.RESOURCE_NOT_FOUND


# ── Middleware-generated responses (they never reach an exception handler) ───

def _mini_app(middleware) -> FastAPI:
    mini = FastAPI()
    register_error_handlers(mini)

    @mini.get("/ping")
    def _ping() -> dict[str, bool]:  # pragma: no cover - body is never the point
        return {"ok": True}

    mini.add_middleware(middleware)
    return mini


class _RateLimitSettings:
    """Only the fields RateLimitMiddleware.__init__ reads."""

    rate_limit_enabled = True
    rate_limit_window_seconds = 60
    rate_limit_max_requests = 1
    rate_limit_exempt_loopback_in_non_prod = False
    environment = "test"
    trusted_proxy_count = 0


def test_rate_limit_429_is_typed_and_keeps_its_retry_headers(monkeypatch) -> None:
    monkeypatch.setattr(middleware_module, "get_settings", lambda: _RateLimitSettings())
    reset_rate_limit_backend()
    try:
        with TestClient(_mini_app(middleware_module.RateLimitMiddleware)) as mini_client:
            assert mini_client.get("/ping").status_code == 200
            limited = mini_client.get("/ping")
    finally:
        reset_rate_limit_backend()

    assert limited.status_code == 429
    body = limited.json()
    assert body["success"] is False
    # RATE_LIMITED, not DAILY_LIMIT_REACHED: retrying shortly will succeed.
    assert body["error"]["code"] == ErrorCode.RATE_LIMITED.value
    assert body["error"]["message"]["ta"] != body["error"]["message"]["en"]
    # The released English detail is unchanged for clients that still render it.
    assert body["detail"] == "Rate limit exceeded. Please slow down."
    # A middleware response is outside RequestLoggingMiddleware, so it has to
    # mint its own correlation id rather than ship a null one.
    assert body["error"]["request_id"]
    assert body["error"]["request_id"] == limited.headers["X-Request-ID"]
    assert limited.headers["Retry-After"]
    assert limited.headers["X-RateLimit-Remaining"] == "0"


def test_maintenance_503_is_typed_rather_than_bare_english_detail() -> None:
    set_flag("maintenance_mode", True)
    try:
        with TestClient(_mini_app(middleware_module.MaintenanceModeMiddleware)) as mini_client:
            response = mini_client.get("/ping")
    finally:
        reset_flag("maintenance_mode")

    assert response.status_code == 503
    body = response.json()
    assert body["error"]["code"] == ErrorCode.SERVICE_UNAVAILABLE.value
    assert body["error"]["message"]["ta"].strip()
    assert body["detail"] == "Service temporarily unavailable for maintenance."
    assert body["error"]["request_id"] == response.headers["X-Request-ID"]


def test_an_inbound_request_id_is_echoed_by_a_middleware_response() -> None:
    """The Next proxy sends X-Request-ID; a 503 must not mint a second one."""
    set_flag("maintenance_mode", True)
    try:
        with TestClient(_mini_app(middleware_module.MaintenanceModeMiddleware)) as mini_client:
            response = mini_client.get("/ping", headers={"X-Request-ID": "trace-from-proxy"})
    finally:
        reset_flag("maintenance_mode")

    assert response.json()["error"]["request_id"] == "trace-from-proxy"


def test_app_error_headers_survive_the_typed_handler() -> None:
    """A typed raiser must not lose headers an untyped one would have kept."""
    mini = FastAPI()
    register_error_handlers(mini)

    @mini.get("/gone")
    def _gone() -> None:
        raise AppError(
            ErrorCode.RATE_LIMITED,
            headers={"Retry-After": "30", "X-RateLimit-Remaining": "0"},
        )

    with TestClient(mini) as mini_client:
        response = mini_client.get("/gone")

    assert response.status_code == 429
    assert response.json()["error"]["code"] == ErrorCode.RATE_LIMITED.value
    assert response.headers["Retry-After"] == "30"
    assert response.headers["X-RateLimit-Remaining"] == "0"
