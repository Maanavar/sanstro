from __future__ import annotations

import math
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import case, delete, func, select
from sqlalchemy.orm import Session

from app.calculations.astro import local_datetime_to_utc
from app.constants.versions import CHART_CALCULATION_VERSION
from app.core.error_codes import ErrorCode
from app.core.errors import AppError
from app.core.subscription import limits_for_user
from app.core.tier_limits import TIER_LIMITS
from app.models import BirthProfile, FamilyMember
from app.models.chart import Chart
from app.models.daily_score import DailyScore
from app.schemas.birth_profiles import (
    BirthProfileCreate,
    BirthProfileCreateResult,
    BirthProfileGetResponse,
    BirthProfileResponse,
    BirthProfileResponseMeta,
    BirthProfileUpdate,
)
from app.services.chart_service import (
    _warning_messages,
    calculate_chart_for_persisted_profile,
    create_birth_profile_record,
)
from app.services.location_service import resolve_effective_daily_location_or_none
from app.services.notification_dispatch_service import dispatch_notification

_BIRTH_RECALC_FIELDS = {
    "birth_date_local",
    "birth_time_local",
    "birth_place",
    "birth_latitude",
    "birth_longitude",
    "birth_timezone",
}
_CURRENT_LOCATION_FIELDS = {
    "current_place",
    "current_latitude",
    "current_longitude",
    "current_timezone",
}

# The three fields that define the birth *instant*. Latitude and longitude change
# the chart but not the moment, so they are deliberately absent.
_BIRTH_MOMENT_FIELDS = {"birth_date_local", "birth_time_local", "birth_timezone"}


def _refresh_birth_datetime_utc(profile: BirthProfile) -> None:
    """Recompute the cached UTC birth instant from the local parts.

    `BirthProfile.birth_datetime_utc` is written once, at creation
    (`_chart_persist.create_birth_profile_record`), and `_chart_build.
    _birth_datetime_utc` PREFERS it over `birth_date_local + birth_time_local +
    birth_timezone`, falling back to those only when the column is null. No
    update path refreshed it, so correcting a birth date or time recalculated a
    chart from the ORIGINAL moment: a new Chart row, a new chart id, identical
    planetary positions. The edit appeared to work — no error, a fresh chart —
    and changed nothing. That held for the owner's own profile as much as for a
    family member's.

    Computed from the parts rather than by calling `_birth_datetime_utc`, which
    would hand back the very value being replaced.
    """
    if profile.birth_time_local is None:
        profile.birth_datetime_utc = None
        return
    profile.birth_datetime_utc = local_datetime_to_utc(
        datetime.combine(profile.birth_date_local, profile.birth_time_local),
        profile.birth_timezone,
    )


def _sync_linked_family_member(profile: BirthProfile) -> None:
    """Mirror the two fields `FamilyMember` duplicates from its birth profile.

    `FamilyMember` carries its own `display_name` and `date_of_birth_local`, and
    the family surfaces read those rather than the profile — the member switcher,
    the aggregate rows and the age buckets all do. The profile is the source of
    truth for birth data, so whichever door an edit came in through, the mirror
    follows. Without this, renaming someone in Setup left the Family tab still
    showing the old name with no way to tell which one was current.
    """
    # getattr, not attribute access: the relationship is absent entirely on the
    # lightweight namespaces the update-path tests build, and this function
    # already treats "no linked member" as nothing to do.
    member = getattr(profile, "family_member", None)
    if member is None:
        return
    member.display_name = profile.display_name
    member.date_of_birth_local = profile.birth_date_local
    member.updated_at = datetime.now(tz=UTC)


def normalise_current_location_updates(update_data: dict[str, object]) -> None:
    """In place: expand `current_place == ""` into a full clear of all four fields.

    A PATCH cannot use `None` to mean "remove this" — `None` already means "not
    sent". The empty string is the sentinel, and it has to take the coordinates
    and timezone with it: a place with no coordinates is not a location, and
    `resolve_effective_daily_location` requires all three before it will prefer
    the current place over the birth place. Clearing only the name would leave
    the reader on stale coordinates under a blank label.
    """
    if update_data.get("current_place") != "":
        return
    update_data["current_place"] = None
    update_data["current_latitude"] = None
    update_data["current_longitude"] = None
    update_data["current_timezone"] = None


def apply_birth_profile_changes(
    session: Session,
    profile: BirthProfile,
    update_data: dict[str, object],
    *,
    recalculate: bool,
    calculation_version: str,
) -> None:
    """Write birth-profile fields **and everything that must ride with them**.

    Shared by `update_birth_profile` and `update_family_member`. It exists
    because the family endpoint used to write the same columns by hand and did
    none of the rest: no recalculation (so a corrected birth time produced a
    chart still cast from the old one), no daily-score invalidation (so a member
    who moved kept the old city's windows for the rest of the day), and no
    mirror sync. Three silent wrong answers, all from one duplicated write.

    Caller commits.
    """
    normalise_current_location_updates(update_data)
    touched = set(update_data)

    # Read the effective location before and after, not just which fields the
    # payload mentioned: a PATCH that re-sends the same city is a confirmation,
    # not a move, and must not throw away warm rows.
    location_before = resolve_effective_daily_location_or_none(profile)
    for field, value in update_data.items():
        setattr(profile, field, value)
    if touched.intersection(_CURRENT_LOCATION_FIELDS):
        profile.current_location_updated_at = datetime.now(tz=UTC)
    # Before the flush and before any recalculation — the chart builder reads
    # this column in preference to the local parts just written.
    if touched.intersection(_BIRTH_MOMENT_FIELDS):
        _refresh_birth_datetime_utc(profile)
    profile.updated_at = datetime.now(tz=UTC)
    session.flush()

    if resolve_effective_daily_location_or_none(profile) != location_before:
        _drop_daily_scores_from_today(session, profile.birth_profile_id)

    _sync_linked_family_member(profile)

    should_recalculate = bool(recalculate and touched.intersection(_BIRTH_RECALC_FIELDS))
    if should_recalculate and profile.birth_time_local is not None:
        calculate_chart_for_persisted_profile(
            session,
            profile,
            calculation_version=calculation_version,
            force_recalculate=True,
        )


def _find_duplicate_birth_profile(
    session: Session,
    *,
    owner_user_id: UUID,
    display_name: str,
    birth_date_local,
    birth_time_local,
    birth_place: str,
    birth_latitude: float,
    birth_longitude: float,
    birth_timezone: str,
    exclude_birth_profile_id: UUID | None = None,
) -> BirthProfile | None:
    # birth_date_local/birth_time_local/birth_latitude/birth_longitude are stored
    # Fernet-encrypted, which is non-deterministic — equal plaintexts produce different
    # ciphertext, so they can't be filtered in SQL. Narrow by the plaintext-comparable
    # fields first, then compare the decrypted values in Python.
    conditions = [
        BirthProfile.owner_user_id == owner_user_id,
        BirthProfile.deleted_at.is_(None),
        BirthProfile.birth_place == birth_place,
        BirthProfile.birth_timezone == birth_timezone,
        func.lower(func.trim(BirthProfile.display_name)) == display_name.strip().lower(),
    ]
    if exclude_birth_profile_id is not None:
        conditions.append(BirthProfile.birth_profile_id != exclude_birth_profile_id)

    candidates = session.execute(
        select(BirthProfile)
        .where(*conditions)
        .order_by(BirthProfile.created_at.asc())
    ).scalars().all()

    for candidate in candidates:
        if (
            candidate.birth_date_local == birth_date_local
            and candidate.birth_time_local == birth_time_local
            and float(candidate.birth_latitude) == birth_latitude
            and float(candidate.birth_longitude) == birth_longitude
        ):
            return candidate
    return None


def _raise_duplicate_birth_profile() -> None:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="A matching birth profile already exists in this account. Use the existing profile instead of creating another copy.",
    )




def _schedule_post_chart_d1_nudge(session: Session, *, owner_user_id: UUID, chart_id: UUID) -> None:
    """Queue the gentle D+1 onboarding nudge after a user's first chart reveal."""
    title_ta = "உங்கள் தசை காலம் தயாராக உள்ளது"
    title_en = "Your first dasha period is ready"
    body_ta = "உங்கள் ஜாதகத்தில் இப்போது இயங்கும் தசை, புக்தி மற்றும் அடுத்த கால சாளரத்தைப் பாருங்கள்."
    body_en = "Explore your current maha dasha, antar dasha, and the next timing window in your chart."

    due_at = datetime.now(UTC) + timedelta(days=1)
    dispatch_notification(
        session=session,
        user_id=owner_user_id,
        notification_type="JADHAGAM_D1_NUDGE",
        title_ta=title_ta,
        title_en=title_en,
        body_ta=body_ta,
        body_en=body_en,
        chart_id=chart_id,
        priority=45,
        logical_key=f"onboarding:{owner_user_id}:JADHAGAM_D1_NUDGE:{chart_id}",
        send_at=due_at,
        expires_at=due_at + timedelta(days=1),
        payload_extra={"deepLink": "/dasha", "source": "onboarding_d1_nudge"},
    )


def create_birth_profile(session: Session, payload: BirthProfileCreate, *, calculation_version: str) -> BirthProfileCreateResult:
    # The schema field is optional because the request body does not carry it;
    # the route overwrites it with the authenticated user's id before calling
    # here. Enforced rather than assumed: a None owner would look up duplicates
    # across every unowned profile and ask is_premium() to tier nobody.
    owner_user_id = payload.owner_user_id
    if owner_user_id is None:
        raise ValueError(
            "create_birth_profile requires payload.owner_user_id — the route sets it "
            "from the authenticated user."
        )

    duplicate_profile = _find_duplicate_birth_profile(
        session,
        owner_user_id=owner_user_id,
        display_name=payload.display_name,
        birth_date_local=payload.birth_date_local,
        birth_time_local=payload.birth_time_local,
        birth_place=payload.birth_place,
        birth_latitude=float(payload.birth_latitude),
        birth_longitude=float(payload.birth_longitude),
        birth_timezone=payload.birth_timezone,
    )
    if duplicate_profile is not None:
        _raise_duplicate_birth_profile()

    max_profiles = limits_for_user(owner_user_id, session).birth_profiles_max
    active_profile_count = session.execute(
        select(func.count())
        .select_from(BirthProfile)
        .where(
            BirthProfile.owner_user_id == owner_user_id,
            BirthProfile.deleted_at.is_(None),
        )
    ).scalar_one()
    if not math.isinf(max_profiles) and int(active_profile_count) >= int(max_profiles):
        # The number has to come from the tier, not from the error catalogue.
        # The catalogue's copy said "(10)" while this tier's cap was 3, so the
        # message named a limit nobody was ever held to.
        limit = int(max_profiles)
        # Offer Premium only when Premium would actually lift this cap.
        upgrade = (
            ", or upgrade to Premium for unlimited profiles"
            if max_profiles < TIER_LIMITS["premium"].birth_profiles_max
            else ""
        )
        raise AppError(
            ErrorCode.RESOURCE_LIMIT_EXCEEDED,
            detail=(
                f"You have reached the maximum number of birth profiles "
                f"({limit}). Delete unused profiles from your settings to make "
                f"room for new ones{upgrade}."
            ),
        )

    birth_profile = create_birth_profile_record(session, payload)
    warnings = _warning_messages(payload)
    chart_id = None

    if payload.calculate_now and payload.birth_time_local is not None:
        chart_response = calculate_chart_for_persisted_profile(
            session,
            birth_profile,
            calculation_version=calculation_version,
            force_recalculate=False,
        )
        chart_id = chart_response.data.chart_id
        warnings = chart_response.data.warnings
        _schedule_post_chart_d1_nudge(session, owner_user_id=owner_user_id, chart_id=chart_id)
    elif payload.calculate_now and payload.birth_time_local is None:
        warnings = warnings + ["Birth time is required to calculate a Lagna-based chart, so the profile was saved without chart calculation."]

    return BirthProfileCreateResult(
        birth_profile_id=birth_profile.birth_profile_id,
        chart_id=chart_id,
        calculation_status="completed" if chart_id is not None else "pending",
        warnings=warnings,
    )


def get_birth_profile(session: Session, birth_profile_id: UUID, *, calculation_version: str) -> BirthProfileGetResponse:
    birth_profile = session.get(BirthProfile, birth_profile_id)
    if birth_profile is None or birth_profile.deleted_at is not None:
        raise AppError(ErrorCode.BIRTH_PROFILE_NOT_FOUND)

    family_member = birth_profile.family_member
    family_vault_id = family_member.family_vault_id if family_member is not None else None
    relationship_to_owner = family_member.relationship_to_owner if family_member is not None else "self"

    # The newest live chart for this profile, whatever engine version stamped it.
    #
    # This used to add `Chart.calculation_version == calculation_version`, and the
    # API handed it the frozen literal "thirukanitham-2026-v1" while
    # `family_vault_service` wrote charts stamped with the engine constant. So a
    # family member's chart existed and this endpoint answered `chart_id: null`
    # for it — the caller then had nothing to load, on a profile that was fully
    # calculated. A version is provenance, not identity; see
    # app/constants/versions.py.
    chart_row = session.execute(
        select(Chart.chart_id)
        .where(Chart.birth_profile_id == birth_profile_id)
        .where(Chart.archived_at.is_(None))
        .order_by(Chart.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    return BirthProfileGetResponse(
        data=BirthProfileResponse(
            birth_profile_id=birth_profile.birth_profile_id,
            chart_id=chart_row,
            owner_user_id=birth_profile.owner_user_id,
            family_vault_id=family_vault_id,
            family_member_id=birth_profile.family_member_id,
            relationship_to_owner=relationship_to_owner or "self",
            display_name=birth_profile.display_name,
            birth_date_local=birth_profile.birth_date_local,
            birth_time_local=birth_profile.birth_time_local,
            birth_place=birth_profile.birth_place,
            birth_latitude=float(birth_profile.birth_latitude),
            birth_longitude=float(birth_profile.birth_longitude),
            birth_timezone=birth_profile.birth_timezone,
            current_place=birth_profile.current_place,
            current_latitude=(float(birth_profile.current_latitude) if birth_profile.current_latitude is not None else None),
            current_longitude=(float(birth_profile.current_longitude) if birth_profile.current_longitude is not None else None),
            current_timezone=birth_profile.current_timezone,
            current_location_updated_at=birth_profile.current_location_updated_at,
            birth_time_source=birth_profile.birth_time_source,
            birth_time_confidence_minutes=int(birth_profile.birth_time_confidence_minutes or 0),
            calendar_input_type=birth_profile.calendar_input_type,
            calculate_now=False,
            language_preference="ta-en",
            gender_for_traditional_rules=birth_profile.gender_for_traditional_rules,
            marital_status=birth_profile.marital_status,
            employment_type=birth_profile.employment_type,
            children=birth_profile.children,
            birth_datetime_utc=birth_profile.birth_datetime_utc,
            calculation_status="completed" if birth_profile.birth_datetime_utc is not None else "pending",
            warnings=_warning_messages(birth_profile),
        ),
        meta=BirthProfileResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def update_birth_profile(
    session: Session,
    profile: BirthProfile,
    payload: BirthProfileUpdate,
    *,
    calculation_version: str,
) -> BirthProfileGetResponse:
    """Apply partial updates to an existing BirthProfile and optionally recalculate the chart."""
    update_data = payload.model_dump(exclude_unset=True, exclude={"recalculate"})
    duplicate_profile = _find_duplicate_birth_profile(
        session,
        owner_user_id=profile.owner_user_id,
        display_name=update_data.get("display_name", profile.display_name),
        birth_date_local=update_data.get("birth_date_local", profile.birth_date_local),
        birth_time_local=update_data["birth_time_local"] if "birth_time_local" in update_data else profile.birth_time_local,
        birth_place=update_data.get("birth_place", profile.birth_place),
        birth_latitude=float(update_data.get("birth_latitude", profile.birth_latitude)),
        birth_longitude=float(update_data.get("birth_longitude", profile.birth_longitude)),
        birth_timezone=update_data.get("birth_timezone", profile.birth_timezone),
        exclude_birth_profile_id=profile.birth_profile_id,
    )
    if duplicate_profile is not None:
        _raise_duplicate_birth_profile()

    apply_birth_profile_changes(
        session,
        profile,
        update_data,
        recalculate=bool(payload.recalculate),
        calculation_version=calculation_version,
    )

    session.commit()
    return get_birth_profile(session, profile.birth_profile_id, calculation_version=calculation_version)


def _drop_daily_scores_from_today(session: Session, birth_profile_id: UUID) -> None:
    """Throw away this profile's cached daily guidance from today forward.

    `DailyScore` is keyed on (birth_profile_id, score_date) and carries no note
    of the place it was computed for, unlike `PanchangamCache`, which is keyed
    on the coordinates themselves and therefore misses correctly on its own.
    Everything sunrise-derived in a daily row — the avoid kalas, the Gowri
    grid, horai, the recommended window's clock times — moves with the place,
    so a row built for Chennai must not be served to a reader who has told us
    they are in Singapore.

    Past dates are left alone: those rows describe days that were actually
    lived at the old place, and rewriting history would be the wrong answer as
    well as the expensive one.
    """
    session.execute(
        delete(DailyScore).where(
            DailyScore.birth_profile_id == birth_profile_id,
            DailyScore.score_date >= date.today(),
        )
    )


def confirm_current_location(
    session: Session,
    profile: BirthProfile,
    *,
    calculation_version: str = CHART_CALCULATION_VERSION,
) -> BirthProfileGetResponse:
    """Stamp the location as confirmed without changing where it points.

    Nothing about the chart or the saved place moves, so there is no
    recalculation and no cache to invalidate — only the answer to "when did a
    human last vouch for this?" changes.
    """
    profile.current_location_updated_at = datetime.now(tz=UTC)
    session.flush()
    session.commit()
    return get_birth_profile(session, profile.birth_profile_id, calculation_version=calculation_version)


def list_birth_profiles_for_owner(
    session: Session,
    owner_user_id: UUID,
    *,
    calculation_version: str,
) -> list[BirthProfileResponse]:
    """Return all active birth profiles for the owner, ordered by creation date."""
    birth_profiles = session.execute(
        select(BirthProfile)
        .where(
            BirthProfile.owner_user_id == owner_user_id,
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(BirthProfile.created_at.desc())
    ).scalars().all()

    results = []
    for birth_profile in birth_profiles:
        family_member = birth_profile.family_member
        family_vault_id = family_member.family_vault_id if family_member is not None else None
        relationship_to_owner = family_member.relationship_to_owner if family_member is not None else "self"

        results.append(BirthProfileResponse(
            birth_profile_id=birth_profile.birth_profile_id,
            owner_user_id=birth_profile.owner_user_id,
            family_vault_id=family_vault_id,
            family_member_id=birth_profile.family_member_id,
            relationship_to_owner=relationship_to_owner or "self",
            display_name=birth_profile.display_name,
            birth_date_local=birth_profile.birth_date_local,
            birth_time_local=birth_profile.birth_time_local,
            birth_place=birth_profile.birth_place,
            birth_latitude=float(birth_profile.birth_latitude),
            birth_longitude=float(birth_profile.birth_longitude),
            birth_timezone=birth_profile.birth_timezone,
            current_place=birth_profile.current_place,
            current_latitude=(float(birth_profile.current_latitude) if birth_profile.current_latitude is not None else None),
            current_longitude=(float(birth_profile.current_longitude) if birth_profile.current_longitude is not None else None),
            current_timezone=birth_profile.current_timezone,
            current_location_updated_at=birth_profile.current_location_updated_at,
            birth_time_source=birth_profile.birth_time_source,
            birth_time_confidence_minutes=int(birth_profile.birth_time_confidence_minutes or 0),
            calendar_input_type=birth_profile.calendar_input_type,
            calculate_now=False,
            language_preference="ta-en",
            gender_for_traditional_rules=birth_profile.gender_for_traditional_rules,
            marital_status=birth_profile.marital_status,
            employment_type=birth_profile.employment_type,
            children=birth_profile.children,
            birth_datetime_utc=birth_profile.birth_datetime_utc,
            calculation_status="completed" if birth_profile.birth_datetime_utc is not None else "pending",
            warnings=_warning_messages(birth_profile),
        ))

    return results


def get_latest_birth_profile_for_owner(
    session: Session,
    owner_user_id: UUID,
    *,
    calculation_version: str,
) -> BirthProfileGetResponse:
    """Return the owner's best personal profile candidate for dashboard restore.

    Ordering preference:
    1) Direct personal profile (not attached to a family member) — oldest first,
       so the user's real onboarding profile wins over any ephemeral temp profiles
       created by tools like chart-generate (which are always newer).
    2) Family member profile where relationship is `self`
    3) Any other owned profile
    """
    birth_profile = session.execute(
        select(BirthProfile)
        .outerjoin(FamilyMember, BirthProfile.family_member_id == FamilyMember.family_member_id)
        .where(
            BirthProfile.owner_user_id == owner_user_id,
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(
            case(
                (BirthProfile.family_member_id.is_(None), 0),
                (FamilyMember.relationship_to_owner == "self", 1),
                else_=2,
            ),
            # Within each priority tier, prefer the oldest profile. For standalone
            # profiles (priority 0) this ensures the user's real personal profile
            # (created at onboarding) beats any ephemeral temp profiles created
            # later by the chart-generate tool.
            BirthProfile.created_at.asc(),
        )
    ).scalars().first()

    if birth_profile is None:
        raise AppError(ErrorCode.BIRTH_PROFILE_NOT_FOUND)

    return get_birth_profile(session, birth_profile.birth_profile_id, calculation_version=calculation_version)


def soft_delete_birth_profile(session: Session, profile: BirthProfile) -> None:
    """Soft-delete a birth profile and retire its family member if it was the last active profile."""
    deleted_at = datetime.now(tz=UTC)
    profile.deleted_at = deleted_at

    family_member_id = profile.family_member_id
    session.flush()

    if family_member_id is None:
        session.commit()
        return

    remaining_active_profiles = session.execute(
        select(func.count())
        .select_from(BirthProfile)
        .where(
            BirthProfile.family_member_id == family_member_id,
            BirthProfile.deleted_at.is_(None),
            BirthProfile.birth_profile_id != profile.birth_profile_id,
        )
    ).scalar_one()

    if int(remaining_active_profiles) == 0:
        family_member = session.get(FamilyMember, family_member_id)
        if family_member is not None and family_member.deleted_at is None:
            family_member.deleted_at = deleted_at

    session.commit()
