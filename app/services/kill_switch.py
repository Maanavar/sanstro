"""Kill switches — route dependencies that turn one feature off without a deploy.

Each switch is a boolean flag in `app/services/feature_flags.py` (True = live),
persisted for every worker. A paused feature answers `SERVICE_UNAVAILABLE`
(503): one concept, one code (`app/core/error_codes.py`), and every client
already renders it in Tamil and English.
"""
from __future__ import annotations

from collections.abc import Callable

from app.core.error_codes import ErrorCode
from app.core.errors import AppError
from app.services.feature_flags import get_flag

#: switch flag -> the English detail a paused request carries.
KILL_SWITCHES: dict[str, str] = {
    "enable_ask_vinaadi": "Ask Vinaadi is paused for a short while. Please come back soon.",
    "enable_payments_checkout": "Purchases are paused for a short while. Nothing has been charged.",
    "enable_guest_charts": "Chart tools are paused for a short while. Please try again soon.",
    "enable_signups": "New sign-ups are paused for a short while. Please try again soon.",
}


def switch_is_on(switch: str) -> bool:
    if switch not in KILL_SWITCHES:
        raise ValueError(f"{switch!r} is not a kill switch")
    return bool(get_flag(switch))


def raise_if_paused(switch: str) -> None:
    if not switch_is_on(switch):
        raise AppError(ErrorCode.SERVICE_UNAVAILABLE, detail=KILL_SWITCHES[switch])


def require_switch(switch: str) -> Callable[[], None]:
    """Route dependency: 503 while `switch` is off. A typo fails at import."""
    if switch not in KILL_SWITCHES:
        raise ValueError(f"{switch!r} is not a kill switch")

    def _dependency() -> None:
        raise_if_paused(switch)

    _dependency.kill_switch = switch  # type: ignore[attr-defined]
    return _dependency
