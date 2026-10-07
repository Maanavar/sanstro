"""Server-side feature entitlements (R-1, capability reference §21).

Before this module the only plan rules the server enforced were counts — birth
profiles, family members, goals, Ask Vinaadi quota, pay-per-use. Every boolean
in `TierLimits` (Varshaphala, Synastry, Retrospective…) was a client-side lock
on the native app only, so web and the API served premium features to every
account. The open beta hid that: it grants premium's booleans to every
signed-in user. Ending the beta would have given premium away on web.

`require_feature("varshaphala_enabled")` is a route dependency that reads the
same `limits_for_user` as the count caps, so the beta, a real subscription and
the registered plan all resolve in one place. While the beta runs, nothing a
signed-in user sees changes.

Only features with their own routes are gated here. A feature delivered inside
a shared payload (Vargas ride in `GET /charts/{id}`) or with no route at all
(life-area history) cannot be enforced by a dependency; see
`UNENFORCEABLE_FEATURES` for the recorded reasons.
"""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import fields

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.error_codes import ErrorCode
from app.core.errors import AppError
from app.core.subscription import limits_for_user
from app.core.tier_limits import TierLimits
from app.db.session import get_db
from app.models.user import User

_BOOLEAN_FEATURES = frozenset(f.name for f in fields(TierLimits) if f.type in ("bool", bool))

#: Premium booleans deliberately NOT enforced by a route dependency, and why.
#: tests/test_entitlements.py fails if a premium-only boolean is neither gated
#: on some route nor listed here, so a new tier flag cannot ship as a UI-only lock
#: without someone writing down that it is one.
UNENFORCEABLE_FEATURES: dict[str, str] = {
    "vargas_enabled": "Vargas ride in the GET /charts/{id} payload every chart surface reads; "
    "no route of their own to gate.",
    "life_area_history_enabled": "No route serves life-area history.",
    "remedies_enabled": "Owner decision pending: the tier table says premium, but native "
    "Pariharam shows remedies to every account and daily guidance embeds a remedy focus.",
    "annual_wrapped_share_enabled": "Sharing is a client action; there is no share route.",
    "ask_vinaadi_topup_enabled": "No top-up purchase path exists yet (pay-per-use is not live) and "
    "nothing reads this flag; gate the purchase route when one is built.",
    "ads_enabled": "Not a feature gate — premium turns ads off.",
}


def require_feature(feature: str) -> Callable[..., None]:
    """Route dependency: 403 PREMIUM_REQUIRED unless the caller's plan has `feature`.

    `feature` is a boolean field name on `TierLimits`; a typo fails at import,
    not on the first request.
    """
    if feature not in _BOOLEAN_FEATURES:
        raise ValueError(f"{feature!r} is not a boolean TierLimits field")

    def _dependency(
        session: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> None:
        if not getattr(limits_for_user(current_user.user_id, session), feature):
            raise AppError(ErrorCode.PREMIUM_REQUIRED, detail=f"{feature} is not in your plan.")

    # Stable identity per feature so tests can find which routes carry which gate.
    _dependency.required_feature = feature  # type: ignore[attr-defined]
    return _dependency
