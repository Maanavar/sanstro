"""Per-endpoint rate limiting for public (unauthenticated) expensive operations.

Provides per-IP rate limits for compute-heavy public endpoints like chart generation,
panchangam, muhurta, and PDF export. Complements the global middleware limiter with
tighter, endpoint-specific budgets.
"""
from __future__ import annotations

import logging
from collections.abc import Callable
from functools import wraps
from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.rate_limit import get_rate_limit_backend
from app.middleware import resolve_client_ip

logger = logging.getLogger(__name__)


_ONE_DAY_SECONDS = 86_400


class PublicEndpointLimiter:
    """Per-endpoint rate limits for expensive public operations.

    Each endpoint has its own budget independent of the global rate limiter.
    Budget is per-IP address to prevent abuse from single clients.

    An endpoint may declare an optional second budget, ``daily_max_requests``,
    enforced over 24 hours alongside the per-minute one. A per-minute limit alone
    bounds a *burst*; it does not bound a day. At 30/min a single IP can pull an
    endpoint 43,200 times between midnights, entirely within its budget, which is
    ample for mirroring a content library and not what the limit was chosen for.
    Both budgets must pass.
    """

    # Endpoint-specific budgets: more restrictive than global limit
    _ENDPOINT_CONFIG = {
        "public_chart": {"max_requests": 10, "window_seconds": 60},  # 10/min per IP
        "public_porutham": {"max_requests": 10, "window_seconds": 60},  # 10/min per IP
        "public_panchangam": {"max_requests": 30, "window_seconds": 60},  # 30/min per IP (GET, lightweight)
        "public_muhurta": {"max_requests": 5, "window_seconds": 60},  # 5/min per IP (heavy computation)
        "public_compare_pdf": {"max_requests": 3, "window_seconds": 60},  # 3/min per IP (PDF generation)
        "porutham_share_view": {"max_requests": 30, "window_seconds": 60},  # 30/min per IP
        "public_friendship": {"max_requests": 10, "window_seconds": 60},  # 10/min per IP (2 ephemeris charts, same cost as porutham)
        "public_muhurtham_naals": {"max_requests": 30, "window_seconds": 60},  # 30/min per IP (GET, curated content table)
        "public_panchangam_events": {"max_requests": 30, "window_seconds": 60},  # 30/min per IP (GET, SEO content pages)
        "public_calendar_categories": {"max_requests": 30, "window_seconds": 60},  # 30/min per IP (GET, SEO content pages)
        "public_panchangam_share_card": {"max_requests": 30, "window_seconds": 60},  # 30/min per IP (GET, panchangam-backed)
        # Its own key rather than sharing "public_panchangam" with /panchangam,
        # /rasi-palan and /panchangam/monthly: a daily cap on the shared key would
        # silently apply to all four, and only this one returns a whole library.
        #
        # One unauthenticated call returns every sign's full bilingual prediction
        # and remedies -- the complete day's content library. At 30/min and no
        # daily bound that is 43,200 full-library pulls per IP per day. The
        # content changes once a day, so no visitor has a reason to fetch it more
        # than a handful of times: 120/day still covers a NAT'd office of ~40
        # people loading it three times each, and cuts a single-IP mirror by 360x.
        # docs/launch/GO_LIVE_CHECKLIST.md, public-API scraping item.
        "public_rasi_palan_grid": {
            "max_requests": 30,
            "window_seconds": 60,
            "daily_max_requests": 120,
        },
        "public_numerology": {"max_requests": 30, "window_seconds": 60},  # 30/min per IP (pure integer arithmetic, no ephemeris)
        "places_search": {"max_requests": 60, "window_seconds": 60},  # 60/min per IP (autocomplete-style, fires every keystroke debounce)
    }

    def __init__(self) -> None:
        self._backend = get_rate_limit_backend()

    def check(self, endpoint: str, ip: str) -> tuple[bool, int]:
        """Check if request is allowed for the endpoint.

        Args:
            endpoint: Endpoint identifier (e.g. 'public_chart').
            ip: Client IP address.

        Returns:
            A tuple of (allowed: bool, retry_after: int in seconds).
        """
        if endpoint not in self._ENDPOINT_CONFIG:
            # Unknown endpoint — allow (fail open rather than blocking legitimate traffic)
            logger.debug(f"unknown_endpoint {endpoint}")
            return True, 0

        config = self._ENDPOINT_CONFIG[endpoint]

        # Burst budget first: it is the one nearly every rejection comes from, and
        # failing it early means a caller already over the per-minute limit does
        # not also burn a slot from the daily one.
        budgets: list[tuple[str, int, int]] = [
            ("", config["max_requests"], config["window_seconds"]),
        ]
        daily_max = config.get("daily_max_requests")
        if daily_max:
            # A distinct key prefix. Sharing one would make the two windows
            # increment the same counter, and the tighter of them would decide
            # both.
            budgets.append(("daily:", daily_max, _ONE_DAY_SECONDS))

        for prefix, max_requests, window_seconds in budgets:
            key = f"public:{endpoint}:{prefix}{ip}"
            result = self._backend.check(key, max_requests, window_seconds)
            if not result.allowed:
                logger.warning(
                    f"public_endpoint_limit endpoint={endpoint} ip={ip} "
                    f"window={'daily' if prefix else 'burst'}"
                )
                return False, result.retry_after
        return True, 0


_LIMITER = PublicEndpointLimiter()


def public_endpoint_rate_limit(endpoint: str) -> Callable:
    """Decorator: enforce per-endpoint rate limit for public endpoints.

    Usage:
        @public_endpoint_rate_limit("public_chart")
        def public_chart(payload: ..., request: Request) -> ...: ...

    Note: FastAPI injected dependencies (including Request) are available
    as keyword arguments. The decorator checks and enforces limits before
    calling the wrapped function.
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            request = kwargs.get("request")
            if request is None:
                # No request object available — allow (shouldn't happen in normal FastAPI usage)
                logger.debug(f"no_request_object in {endpoint}")
                return func(*args, **kwargs)

            settings = get_settings()
            trusted_proxy_count = max(0, int(settings.trusted_proxy_count))
            ip = resolve_client_ip(request, trusted_proxy_count)

            allowed, retry_after = _LIMITER.check(endpoint, ip)
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded for this endpoint. Retry after {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )

            return func(*args, **kwargs)

        return wrapper

    return decorator


def get_public_endpoint_limiter() -> PublicEndpointLimiter:
    """Return the shared PublicEndpointLimiter instance."""
    return _LIMITER
