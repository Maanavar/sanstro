"""Life Mode constants — Feature 2 (Life Mode Intent Picker).

Life Mode is the user's declared current focus. It is stored on
``user_preferences.life_mode`` and is distinct from ``users.user_mode`` (the
dashboard complexity mode).

See docs/LIFE_FOCUS_PLAN_2026-09-22.md for the product plan.
"""
from __future__ import annotations

from dataclasses import dataclass
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


@dataclass(frozen=True)
class FocusMapping:
    """What one focus drives. See plan §2 D1.

    ``goal_track`` is the legacy ``users.goal_track`` value the backend readers
    still consume; ``area`` is a life-area code from ``life_areas_service``;
    ``activities`` are ``user_goal.VALID_GOAL_TYPES`` the focus lifts.
    A focus reorders and pre-words; it never changes a score (D2).
    """

    goal_track: str | None
    area: str | None
    activities: tuple[str, ...]


# The D1 table. This is the only copy: clients read ``focusArea`` /
# ``focusActivities`` off the life-mode response instead of re-typing it.
FOCUS_TABLE: dict[str, FocusMapping] = {
    "STUDY":        FocusMapping("EXAM", "EDUCATION", ("education",)),
    "CAREER":       FocusMapping("CAREER", "CAREER", ("job_change", "business_start")),
    # Q4: LOVE has no matching activity type; adding one is a doctrine question.
    "LOVE":         FocusMapping("RELATIONSHIP", "RELATIONSHIPS", ()),
    "MARRIAGE":     FocusMapping("RELATIONSHIP", "RELATIONSHIPS", ("marriage",)),
    "FAMILY":       FocusMapping(None, "FAMILY_HARMONY", ("family_harmony", "child_birth", "property")),
    "WEALTH":       FocusMapping("FINANCIAL", "MONEY", ("money", "property", "business_start")),
    "HEALTH":       FocusMapping(None, "HEALTH", ("health",)),
    "SPIRITUALITY": FocusMapping(None, "SPIRITUAL", ("spiritual",)),
    # Cross-cutting: lifts remedy surfaces (Phase 2), not a life area.
    "REMEDIES":     FocusMapping(None, None, ()),
    "BALANCED":     FocusMapping(None, None, ()),
}


def is_valid_mode(mode: str) -> bool:
    return mode in ALL_LIFE_MODES


def focus_mapping(mode: str | None) -> FocusMapping:
    return FOCUS_TABLE.get(mode or DEFAULT_LIFE_MODE, FOCUS_TABLE[DEFAULT_LIFE_MODE])


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
