"""Resolve a user's Life Focus for the backend readers.

One place answers "which focus, and which goal track, should this request act
on?", so daily guidance, Ask Vinaadi and journal prompts cannot drift apart.
See docs/LIFE_FOCUS_PLAN_2026-09-22.md (Phase 1).
"""
from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.age_gate import compute_age, get_blocked_life_modes
from app.core.life_mode import effective_life_mode, focus_mapping
from app.models.birth_profile import BirthProfile
from app.models.family_member import FamilyMember
from app.models.user import User
from app.models.user_preference import UserPreference


def self_birth_profile(session: Session, user_id: UUID) -> BirthProfile | None:
    """The user's own birth profile (not a family member) — used for age gating."""
    return (
        session.query(BirthProfile)
        .filter(
            BirthProfile.owner_user_id == user_id,
            BirthProfile.family_member_id.is_(None),
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(BirthProfile.created_at.asc())
        .first()
    )


def user_blocked_modes(session: Session, user_id: UUID) -> frozenset[str]:
    """Comprehensive blocked life modes based on age and marital status."""
    profile = self_birth_profile(session, user_id)
    if profile is None:
        return frozenset()
    age = compute_age(profile.birth_date_local)
    return get_blocked_life_modes(age, profile.marital_status)


def resolve_focus(session: Session, user_id: UUID) -> str | None:
    """The user's effective focus, or None if they have never chosen one.

    None (rather than BALANCED) lets callers tell "never answered the picker"
    apart from "chose Balanced": only the first keeps a legacy goal track.
    D5 applies — a focus a profile edit has since blocked reads as BALANCED.
    """
    pref = session.query(UserPreference).filter_by(owner_user_id=user_id).first()
    if pref is None or pref.life_mode_set_at is None:
        return None
    return effective_life_mode(pref.life_mode, user_blocked_modes(session, user_id))


def resolve_goal_track(session: Session, user: User | None) -> str | None:
    """The goal track the backend readers should use for this user.

    Derived from the focus (D1) once one has been chosen, so a focus that is
    now blocked cannot keep steering guidance through a stale stored track.
    A user who has never chosen a focus keeps whatever ``users.goal_track``
    they set through the retired Goal track card or an old client.
    """
    if user is None:
        return None
    focus = resolve_focus(session, user.user_id)
    if focus is None:
        return user.goal_track
    return focus_mapping(focus).goal_track


def is_own_chart(session: Session, birth_profile: Any) -> bool:
    """Whether a birth profile is the owner's own chart, not a relative's.

    Accepts the ORM row or ``BirthProfileResponse``. The relationship lives on
    the family member, not the profile: a profile with no member is the
    owner's own, and a vault member marked "self" is the owner too.
    """
    member_id = getattr(birth_profile, "family_member_id", None)
    if member_id is None:
        return True
    member = session.get(FamilyMember, member_id)
    return member is not None and member.relationship_to_owner == "self"


def focus_push_line(
    session: Session,
    birth_profile: Any,
    owner_user_id: UUID,
    board: Any,
) -> tuple[str, str] | None:
    """The morning push's one focus line (Phase 3), as ``(ta, en)``, or None.

    Read off the day's activity board, which the push already fetched with the
    guidance: no new calculation, and the same verdicts the Today board shows.
    The first focus activity the board favours is named; failing that, the
    first it cautions against. Otherwise, as on a neutral or Chandrashtama
    day, there is no line; one line of silence beats one of filler.

    D4: only on the user's own chart. D2: the line reorders nothing and
    re-scores nothing, it only names a verdict the board already holds.
    """
    if board is None or not is_own_chart(session, birth_profile):
        return None
    focus = resolve_focus(session, owner_user_id)
    mapping = focus_mapping(focus)
    if focus is None or mapping.area is None or not mapping.activities:
        return None

    from app.services.life_areas_service import area_label  # heavy module; only the push needs it

    area = area_label(mapping.area)
    if area is None:
        return None

    def first(rows: Any) -> Any:
        by_activity = {row.activity: row for row in rows or []}
        return next((by_activity[a] for a in mapping.activities if a in by_activity), None)

    # New Tamil, pending native review (CLAUDE.md new-Tamil rule). Same frame
    # as the Today hero ("Your focus, %1") and the T3 note ("%s: …").
    if (row := first(board.favourable)) is not None:
        return (
            f"உங்கள் கவனம், {area.ta}. {row.label.ta}: இன்று உகந்தது.",
            f"Your focus, {area.en}. {row.label.en}: supported today.",
        )
    if (row := first(board.caution)) is not None:
        return (
            f"உங்கள் கவனம், {area.ta}. {row.label.ta}: இன்று எச்சரிக்கை தேவை.",
            f"Your focus, {area.en}. {row.label.en}: go carefully today.",
        )
    return None


def chart_goal_track(session: Session, birth_profile: Any, owner_user_id: UUID) -> str | None:
    """The goal track to apply to this chart's guidance.

    D4 (owner ruling Q2): a focus is about the user's own life, so it never
    steers a family member's chart. Those charts get None, which is also what
    keeps them on the shared daily-score cache.
    """
    if not is_own_chart(session, birth_profile):
        return None
    return resolve_goal_track(session, session.get(User, owner_user_id))
