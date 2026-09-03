"""Application errors and translation from framework errors to the API contract."""
from __future__ import annotations

import re
from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.error_codes import BilingualMessage, ErrorCode, coerce_error_code, get_bilingual_error_message

_DETAIL_CODE_RULES: tuple[tuple[str, ErrorCode], ...] = (
    ("elevation", ErrorCode.ELEVATION_REQUIRED),
    ("birth time", ErrorCode.BIRTH_TIME_REQUIRED),
    ("birth profile", ErrorCode.BIRTH_PROFILE_NOT_FOUND),
    ("family vault", ErrorCode.FAMILY_VAULT_NOT_FOUND),
    ("family member", ErrorCode.FAMILY_MEMBER_NOT_FOUND),
    ("journal entry", ErrorCode.JOURNAL_ENTRY_NOT_FOUND),
    ("goal not found", ErrorCode.GOAL_NOT_FOUND),
    ("chart not found", ErrorCode.CHART_NOT_FOUND),
    ("daily limit", ErrorCode.DAILY_LIMIT_REACHED),
    ("limit reached", ErrorCode.RESOURCE_LIMIT_EXCEEDED),
    ("date range", ErrorCode.DATE_RANGE_INVALID),
)
_CAMEL_BOUNDARY_RE = re.compile(r"(?<!^)(?=[A-Z])")


class AppError(Exception):
    """A known, client-safe failure with a stable code and bilingual message."""

    def __init__(
        self,
        code: ErrorCode | str,
        *,
        http_status: int | None = None,
        message: BilingualMessage | None = None,
        field: str | None = None,
        detail: str | None = None,
    ) -> None:
        self.code = coerce_error_code(code)
        self.message = message or get_bilingual_error_message(self.code)
        from app.core.error_codes import ERROR_MESSAGES

        self.http_status = http_status or ERROR_MESSAGES[self.code]["status"]
        self.field = field
        self.detail = detail or self.message["en"]
        super().__init__(self.detail)


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def error_envelope(
    *,
    code: ErrorCode | str,
    request: Request,
    detail: Any,
    field: str | None = None,
) -> dict[str, Any]:
    stable_code = coerce_error_code(code)
    error: dict[str, Any] = {
        "code": stable_code.value,
        "message": get_bilingual_error_message(stable_code),
        "request_id": _request_id(request),
    }
    if field:
        error["field"] = field
    return {"success": False, "error": error, "detail": detail, "request_id": error["request_id"]}


def _infer_http_error_code(http_status: int, detail: Any) -> ErrorCode:
    if isinstance(detail, dict) and isinstance(detail.get("code"), str):
        return coerce_error_code(detail["code"])
    detail_text = detail.lower() if isinstance(detail, str) else ""
    if http_status == status.HTTP_409_CONFLICT:
        if "email" in detail_text and "already" in detail_text:
            return ErrorCode.EMAIL_ALREADY_EXISTS
        if "birth profile" in detail_text and ("maximum" in detail_text or "limit" in detail_text):
            return ErrorCode.PROFILE_LIMIT_REACHED
        if "limit" in detail_text:
            return ErrorCode.RESOURCE_LIMIT_EXCEEDED
        return ErrorCode.DUPLICATE_RESOURCE
    for fragment, code in _DETAIL_CODE_RULES:
        if fragment in detail_text:
            return code
    if http_status == status.HTTP_401_UNAUTHORIZED:
        return ErrorCode.NOT_AUTHENTICATED
    if http_status == status.HTTP_403_FORBIDDEN:
        return ErrorCode.ACCESS_DENIED
    if http_status == status.HTTP_404_NOT_FOUND:
        return ErrorCode.RESOURCE_NOT_FOUND
    if http_status == status.HTTP_422_UNPROCESSABLE_CONTENT:
        return ErrorCode.VALIDATION_FAILED
    if http_status == status.HTTP_429_TOO_MANY_REQUESTS:
        return ErrorCode.DAILY_LIMIT_REACHED
    if http_status >= 500:
        return ErrorCode.INTERNAL_ERROR
    return ErrorCode.VALIDATION_FAILED


def _validation_field(exc: RequestValidationError) -> str | None:
    errors = exc.errors()
    if not errors:
        return None
    loc = errors[0].get("loc", ())
    if not loc:
        return None
    name = str(loc[-1])
    return _CAMEL_BOUNDARY_RE.sub("_", name).lower()


def register_error_handlers(app) -> None:
    """Register one additive envelope for known, HTTP, and validation failures."""

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.http_status,
            content=error_envelope(code=exc.code, request=request, detail=exc.detail, field=exc.field),
        )

    @app.exception_handler(HTTPException)
    async def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            headers=exc.headers,
            content=error_envelope(
                code=_infer_http_error_code(exc.status_code, exc.detail),
                request=request,
                detail=exc.detail,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        # Keep FastAPI's list in ``detail`` for released clients that read its
        # per-field entries; the typed error layer supplies a stable code and
        # a single field name for new clients.
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=error_envelope(
                code=ErrorCode.VALIDATION_FAILED,
                request=request,
                detail=exc.errors(),
                field=_validation_field(exc),
            ),
        )
