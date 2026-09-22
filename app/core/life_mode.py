"""Life Mode constants — Feature 2 (Life Mode Intent Picker).

Life Mode is the user's declared current focus. It is stored on
``user_preferences.life_mode`` and is distinct from ``users.user_mode`` (the
dashboard complexity mode).

See docs/LIFE_FOCUS_PLAN_2026-09-22.md for the product plan.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.core.age_gate import MINOR_BLOCKED_MODES

ALL_LIFE_MODES: set[str] = {
    "STUDY", "CAREER", "LOVE", "MARRIAGE", "FAMILY",
    "WEALTH", "HEALTH", "SPIRITUALITY", "REMEDIES", "BALANCED",
}

# Modes a minor (age < 18) is allowed to select.
MINOR_ALLOWED_MODES: set[str] = ALL_LIFE_MODES - MINOR_BLOCKED_MODES

DEFAULT_LIFE_MODE = "BALANCED"

# Offer the "Still focused on X?" strip once the focus is this many days old.
# Owner ruling 2026-09-22 (Q3): 60 days, as a soft inline strip, never a modal.
# A focus is a standing interest; 30 days asked too often.
LIFE_MODE_STALE_DAYS = 60


def is_valid_mode(mode: str) -> bool:
    return mode in ALL_LIFE_MODES


def effective_life_mode(saved: str | None, blocked: frozenset[str] | set[str]) -> str:
    """The focus to act on: the saved one, unless it is unknown or now blocked.

    D5: a profile edit (marital status, a corrected birth date) can make a
    saved focus unavailable. The saved row is left alone, since the edit may be
    undone, but nothing downstream sees the blocked value.
    """
    if not saved or saved not in ALL_LIFE_MODES or saved in blocked:
        return DEFAULT_LIFE_MODE
    return saved


def is_focus_nudge_due(
    *,
    show_picker: bool,
    set_at: datetime | None,
    now: datetime | None = None,
) -> bool:
    """Whether the Today tab should offer the "Still focused on X?" strip.

    Never while the first-run picker is still owed (that is the picker's job),
    and never without a timestamp to measure from.
    """
    if show_picker or set_at is None:
        return False
    if set_at.tzinfo is None:
        set_at = set_at.replace(tzinfo=UTC)
    now = now or datetime.now(tz=UTC)
    return now - set_at >= timedelta(days=LIFE_MODE_STALE_DAYS)
