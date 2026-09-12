"""Application errors and translation from framework errors to the API contract."""
from __future__ import annotations

import re
from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.error_codes import BilingualMessage, ErrorCode, coerce_error_code, get_bilingual_error_message

# Transitional only: infers a code from an un-migrated ``HTTPException``'s English
# detail. Every entry here is a call site that has not yet been converted to
# ``AppError``; the table shrinks as they are, and deleting it is the goal.
#
# ORDER IS LOAD-BEARING — first match wins. A more specific fragment must precede
# any fragment it contains ("birth time" before "birth profile"; "goal not found"
# before "not found"). ``tests/test_error_envelope.py`` pins the pairs that matter,
# so appending a rule cannot silently shadow an earlier one. Keep fragments long
# enough to be unambiguous: a 3-4 character fragment will match prose it should not.
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
    ("date range", ErrorCode.INVALID_DATE_RANGE),
)
_CAMEL_BOUNDARY_RE = re.compile(r"(?<!^)(?=[A-Z])")


class AppError(HTTPException):
    """A known, client-safe failure with a stable code and bilingual message.

    Subclasses ``HTTPException`` deliberately. 305 raisers are still untyped, and
    thirteen ``except HTTPException`` blocks in ``app/`` treat one as a control
    signal (``_member_snapshot`` skips the member, the activity-timing batch
    records ``None``). Were ``AppError`` a sibling of ``HTTPException``, every
    converted raiser would escape those blocks and change behaviour far from the
    call site. As a subclass, conversion is purely additive: the same handlers
    still catch it, while Starlette's MRO walk finds the ``AppError`` handler
    first and emits the typed code instead of inferring one from English prose.
    """

    def __init__(
        self,
        code: ErrorCode | str,
        *,
        http_status: int | None = None,
        message: BilingualMessage | None = None,
        field: str | None = None,
        detail: str | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        from app.core.error_codes import ERROR_MESSAGES

        self.code = coerce_error_code(code)
        entry = ERROR_MESSAGES[self.code]
        self.message = message or get_bilingual_error_message(self.code)
        self.http_status = http_status or entry["status"]
        self.field = field
        # Default to the catalogue's ``user_message``, which is the released
        # English ``detail`` prose for codes that had one before this layer. A
        # caller-supplied ``message`` overrides it, since the catalogue copy no
        # longer describes the failure.
        resolved_detail = detail or (self.message["en"] if message else entry["user_message"])
        super().__init__(status_code=self.http_status, detail=resolved_detail, headers=headers)


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


def _detail_code_hint(detail: Any) -> ErrorCode | None:
    """Read a code a raiser already put in a dict ``detail``.

    ``error`` is included because the Ask Vinaadi quota has shipped
    ``detail={"error": "MONTHLY_LIMIT_REACHED", ...}`` since before this layer
    existed. An unrecognised string returns ``None`` so inference continues from
    the status, rather than degrading a 404 to ``INTERNAL_ERROR``.
    """
    if not isinstance(detail, dict):
        return None
    for key in ("code", "error"):
        value = detail.get(key)
        if isinstance(value, str):
            try:
                return ErrorCode(value)
            except ValueError:
                continue
    return None


def _infer_http_error_code(http_status: int, detail: Any) -> ErrorCode:
    hinted = _detail_code_hint(detail)
    if hinted is not None:
        return hinted
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
        return ErrorCode.VALIDATION_ERROR
    if http_status == status.HTTP_429_TOO_MANY_REQUESTS:
        # Default to the throttle, not the quota: every un-hinted 429 raiser in
        # app/ is an attempt limiter ("Too many login attempts", the per-endpoint
        # limiter, the Ask Vinaadi concurrency guard). The quota raisers name
        # themselves in a dict detail and are picked up by _detail_code_hint.
        return ErrorCode.RATE_LIMITED
    if http_status == status.HTTP_503_SERVICE_UNAVAILABLE:
        return ErrorCode.SERVICE_UNAVAILABLE
    if http_status >= 500:
        return ErrorCode.INTERNAL_ERROR
    return ErrorCode.VALIDATION_ERROR


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
            # Forwarded like the HTTPException handler's: a 401 carrying
            # WWW-Authenticate, or a 429 carrying Retry-After, is useless without
            # them, and a typed raiser must not quietly lose what an untyped one
            # keeps.
            headers=exc.headers,
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
                code=ErrorCode.VALIDATION_ERROR,
                request=request,
                # Pydantic can retain a Python exception in an error ``ctx``
                # value (for example, a custom email validator's ValueError).
                # JSONResponse cannot serialize it directly; FastAPI's encoder
                # preserves the released list shape while making every value
                # transport-safe.
                detail=jsonable_encoder(exc.errors()),
                field=_validation_field(exc),
            ),
        )
