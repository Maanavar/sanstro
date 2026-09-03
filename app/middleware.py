"""Sprint 10 — rate limiting, security headers, and structured request logging."""
from __future__ import annotations

import logging
import time
import uuid
from ipaddress import ip_address

try:
    from jose import jwt as _jose_jwt
    _JOSE_AVAILABLE = True
except ImportError:  # pragma: no cover
    _JOSE_AVAILABLE = False

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.core.error_codes import ErrorCode
from app.core.errors import error_envelope
from app.core.rate_limit import get_rate_limit_backend
from app.services.feature_flags import get_flag

logger = logging.getLogger("jothidam.access")


# ---------------------------------------------------------------------------
# Correlation id
# ---------------------------------------------------------------------------

def ensure_request_id(request: Request) -> str:
    """Return this request's correlation id, minting one on first use.

    RateLimitMiddleware and MaintenanceModeMiddleware are mounted *outside*
    RequestLoggingMiddleware, so when either short-circuits, the logging
    middleware never runs and ``request.state.request_id`` would be unset. Both
    still owe the client a traceable id, so the mint moved here and every caller
    is idempotent.
    """
    existing = getattr(request.state, "request_id", None)
    if isinstance(existing, str) and existing:
        return existing
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
    request.state.request_id = request_id
    return request_id


def _middleware_error_response(
    request: Request,
    *,
    status_code: int,
    code: ErrorCode,
    detail: str,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    """Emit the same typed envelope the exception handlers produce.

    A response returned from middleware never reaches an exception handler, so
    without this the two most user-visible failures in the product — rate limit
    and maintenance — would ship untyped English prose that a Tamil client has
    to substring-match.
    """
    request_id = ensure_request_id(request)
    response_headers = {"X-Request-ID": request_id}
    if headers:
        response_headers.update(headers)
    return JSONResponse(
        status_code=status_code,
        content=error_envelope(code=code, request=request, detail=detail),
        headers=response_headers,
    )


# ---------------------------------------------------------------------------
# Security headers
# ---------------------------------------------------------------------------

def _build_security_headers(is_production: bool) -> dict[str, str]:
    # The API serves only JSON, so in production no inline script execution is ever
    # legitimate — drop 'unsafe-inline' from script-src. Outside production we keep
    # it so the bundled Swagger UI (/docs) still works.
    script_src = "'self'" if is_production else "'self' 'unsafe-inline'"
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(self), microphone=()",
        "Content-Security-Policy": (
            "default-src 'self'; "
            f"script-src {script_src}; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'"
        ),
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    }


# Backwards-compatible default (development-strength) header set.
SECURITY_HEADERS = _build_security_headers(is_production=False)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        is_production = get_settings().environment.strip().lower() == "production"
        self._headers = _build_security_headers(is_production)

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        for header, value in self._headers.items():
            response.headers[header] = value
        # Ensure Tamil/Unicode text is never mis-decoded as Latin-1
        ct = response.headers.get("content-type", "")
        if "application/json" in ct and "charset" not in ct:
            response.headers["content-type"] = "application/json; charset=utf-8"
        return response


# ---------------------------------------------------------------------------
# Structured request logging
# ---------------------------------------------------------------------------

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Correlation id: reuse an inbound X-Request-ID (e.g. from the Next proxy)
        # or mint one, so a single request can be traced across log lines and the
        # 500 envelope.
        request_id = ensure_request_id(request)

        start = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)
        logger.info(
            "request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "client": request.client.host if request.client else "unknown",
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response


# ---------------------------------------------------------------------------
# Sliding-window rate limiter (per client IP)
# The counting state lives in a pluggable backend (app.core.rate_limit): an
# in-process default, or Redis for a cluster-wide limit across workers/boxes.
# Select with JOTHIDAM_RATE_LIMIT_BACKEND=redis + JOTHIDAM_REDIS_URL.
# ---------------------------------------------------------------------------

RATE_LIMIT_EXEMPT_PREFIXES = ("/health", "/docs", "/redoc", "/openapi.json")


def _is_loopback_ip(value: str) -> bool:
    try:
        return ip_address(value).is_loopback
    except ValueError:
        return False


def _extract_user_id(request: Request) -> str | None:
    """Attempt to extract a stable user identifier from the Bearer token.

    Used to key authenticated rate limits by user rather than IP so that
    users behind a shared NAT (office, mobile carrier) are not penalised
    by the aggregate rate of their IP.
    Returns None when no valid Bearer token is present (unauthenticated).
    """
    if not _JOSE_AVAILABLE:
        return None
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    token = auth[7:]
    try:
        from app.core.config import get_settings
        settings = get_settings()
        if settings.jwt_secret is None:
            return None
        payload = _jose_jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        sub = payload.get("sub")
        return f"uid:{sub}" if sub else None
    except Exception:
        return None


def resolve_client_ip(request: Request, trusted_proxy_count: int) -> str:
    """Resolve the real client IP.

    Without a proxy (``trusted_proxy_count == 0``) the immediate peer is the
    client. Behind N trusted reverse proxies, each appends the address it saw to
    ``X-Forwarded-For`` (left = original client claim, right = closest proxy). The
    spoofing-resistant client IP is therefore the Nth entry from the right — the
    address the outermost *trusted* proxy actually observed.
    """
    peer = request.client.host if request.client else "unknown"
    if trusted_proxy_count <= 0:
        return peer
    xff = request.headers.get("x-forwarded-for")
    if not xff:
        return peer
    parts = [p.strip() for p in xff.split(",") if p.strip()]
    if not parts:
        return peer
    idx = max(0, len(parts) - trusted_proxy_count)
    return parts[idx] if idx < len(parts) else parts[0]


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        settings = get_settings()
        self.enabled = bool(settings.rate_limit_enabled)
        self.window_seconds = max(1, int(settings.rate_limit_window_seconds))
        self.max_requests = max(1, int(settings.rate_limit_max_requests))
        self.exempt_loopback = (
            bool(settings.rate_limit_exempt_loopback_in_non_prod)
            and settings.environment.lower() != "production"
        )
        self.trusted_proxy_count = max(0, int(settings.trusted_proxy_count))
        self.backend = get_rate_limit_backend()

    async def dispatch(self, request: Request, call_next):
        if not self.enabled:
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(p) for p in RATE_LIMIT_EXEMPT_PREFIXES):
            return await call_next(request)

        client_ip = resolve_client_ip(request, self.trusted_proxy_count)
        if self.exempt_loopback and _is_loopback_ip(client_ip):
            return await call_next(request)

        # Use user_id as key for authenticated requests to avoid penalising
        # multiple users behind a shared NAT (office, mobile carrier).
        rate_key = _extract_user_id(request) or client_ip
        result = self.backend.check(rate_key, self.max_requests, self.window_seconds)
        if not result.allowed:
            return _middleware_error_response(
                request,
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                # RATE_LIMITED, not DAILY_LIMIT_REACHED: this is "slow down and
                # retry", which the client handles differently from a spent quota.
                code=ErrorCode.RATE_LIMITED,
                detail="Rate limit exceeded. Please slow down.",
                headers={
                    "Retry-After": str(result.retry_after),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(result.remaining)
        return response


_MAINTENANCE_EXEMPT_PREFIXES = (
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/admin",
)


class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(path.startswith(prefix) for prefix in _MAINTENANCE_EXEMPT_PREFIXES):
            return await call_next(request)
        if bool(get_flag("maintenance_mode")):
            return _middleware_error_response(
                request,
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code=ErrorCode.SERVICE_UNAVAILABLE,
                detail="Service temporarily unavailable for maintenance.",
            )
        return await call_next(request)
