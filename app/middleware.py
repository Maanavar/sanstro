"""Sprint 10 — rate limiting, security headers, and structured request logging."""
from __future__ import annotations

import math
import logging
import time
from ipaddress import ip_address
from collections import defaultdict
from threading import Lock

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import get_settings

logger = logging.getLogger("jothidam.access")

# ---------------------------------------------------------------------------
# Security headers
# ---------------------------------------------------------------------------

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=()",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'"
    ),
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        for header, value in SECURITY_HEADERS.items():
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
        start = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 1)
        logger.info(
            "request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "client": request.client.host if request.client else "unknown",
            },
        )
        return response


# ---------------------------------------------------------------------------
# Sliding-window rate limiter (in-process, per client IP)
# ---------------------------------------------------------------------------

_counters: dict[str, list[float]] = defaultdict(list)
_lock = Lock()

RATE_LIMIT_EXEMPT_PREFIXES = ("/health", "/docs", "/redoc", "/openapi.json")


def _is_loopback_ip(value: str) -> bool:
    try:
        return ip_address(value).is_loopback
    except ValueError:
        return False


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

    async def dispatch(self, request: Request, call_next):
        if not self.enabled:
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(p) for p in RATE_LIMIT_EXEMPT_PREFIXES):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        if self.exempt_loopback and _is_loopback_ip(client_ip):
            return await call_next(request)

        now = time.monotonic()
        window_start = now - self.window_seconds

        with _lock:
            timestamps = _counters[client_ip]
            # Evict old timestamps
            _counters[client_ip] = [t for t in timestamps if t > window_start]
            current_count = len(_counters[client_ip])
            if current_count >= self.max_requests:
                oldest = _counters[client_ip][0] if _counters[client_ip] else now
                retry_after = max(1, int(math.ceil((oldest + self.window_seconds) - now)))
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Rate limit exceeded. Please slow down."},
                    headers={
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(self.max_requests),
                        "X-RateLimit-Remaining": "0",
                    },
                )
            _counters[client_ip].append(now)
            remaining = max(0, self.max_requests - len(_counters[client_ip]))

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
