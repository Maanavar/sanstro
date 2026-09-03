"""Regression tests for the versioned, typed API error envelope."""
from __future__ import annotations

import re
from pathlib import Path

from fastapi.routing import APIRoute

from app.core.error_codes import ERROR_MESSAGES, ErrorCode
from app.main import app


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
    assert body["detail"] == "The birth profile was not found."


def test_request_validation_error_keeps_compatibility_detail_and_adds_code(client) -> None:
    response = client.get("/api/v1/birth-profiles/not-a-uuid")

    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == ErrorCode.VALIDATION_FAILED.value
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
