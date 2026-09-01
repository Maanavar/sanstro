from __future__ import annotations

import math
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.core.error_codes import ErrorCode, get_error_message
from app.core.subscription import is_premium
from app.core.tier_limits import get_limits
from app.models import BirthProfile, FamilyMember
from app.models.chart import Chart
from app.models.notification import Notification
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
    existing = session.execute(
        select(Notification.notification_id).where(
            Notification.user_id == owner_user_id,
            Notification.chart_id == chart_id,
            Notification.type == "JADHAGAM_D1_NUDGE",
            Notification.status.in_(["queued", "sent"]),
        )
    ).scalar_one_or_none()
    if existing is not None:
        return

    title_ta = "உங்கள் தசை காலம் தயாராக உள்ளது"
    title_en = "Your first dasha period is ready"
    body_ta = "உங்கள் ஜாதகத்தில் இப்போது இயங்கும் தசை, புக்தி மற்றும் அடுத்த கால சாளரத்தைப் பாருங்கள்."
    body_en = "Explore your current maha dasha, antar dasha, and the next timing window in your chart."

    session.add(
        Notification(
            user_id=owner_user_id,
            chart_id=chart_id,
            type="JADHAGAM_D1_NUDGE",
            priority=45,
            title=f"{title_ta} / {title_en}",
            body=f"{body_ta}\n{body_en}",
            language="ta-en",
            send_at=datetime.now(UTC) + timedelta(days=1),
            status="queued",
            payload={
                "title": {"ta": title_ta, "en": title_en},
                "body": {"ta": body_ta, "en": body_en},
                "deepLink": "/dasha",
                "source": "onboarding_d1_nudge",
            },
        )
    )


def create_birth_profile(session: Session, payload: BirthProfileCreate, *, calculation_version: str) -> BirthProfileCreateResult:
    duplicate_profile = _find_duplicate_birth_profile(
        session,
        owner_user_id=payload.owner_user_id,
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

    tier = "premium" if is_premium(payload.owner_user_id, session) else "registered"
    max_profiles = get_limits(tier).birth_profiles_max
    active_profile_count = session.execute(
        select(func.count())
        .select_from(BirthProfile)
        .where(
            BirthProfile.owner_user_id == payload.owner_user_id,
            BirthProfile.deleted_at.is_(None),
        )
    ).scalar_one()
    if not math.isinf(max_profiles) and int(active_profile_count) >= int(max_profiles):
        # The number has to come from the tier, not from the error catalogue.
        # The catalogue's copy said "(10)" while this tier's cap was 3, so the
        # message named a limit nobody was ever held to.
        error_info = get_error_message(ErrorCode.RESOURCE_LIMIT_EXCEEDED)
        limit = int(max_profiles)
        raise HTTPException(
            status_code=error_info["status"],
            detail=(
                f"You have reached the maximum number of birth profiles "
                f"({limit}). Delete unused profiles from your settings to make "
                f"room for new ones, or upgrade to Premium for unlimited profiles."
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
        _schedule_post_chart_d1_nudge(session, owner_user_id=payload.owner_user_id, chart_id=chart_id)
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
        error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
        raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])

    family_member = birth_profile.family_member
    family_vault_id = family_member.family_vault_id if family_member is not None else None
    relationship_to_owner = family_member.relationship_to_owner if family_member is not None else "self"

    chart_row = session.execute(
        select(Chart.chart_id)
        .where(Chart.birth_profile_id == birth_profile_id)
        .where(Chart.calculation_version == calculation_version)
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

    touched_fields = set(update_data)
    for field, value in update_data.items():
        setattr(profile, field, value)
    if touched_fields.intersection(_CURRENT_LOCATION_FIELDS):
        profile.current_location_updated_at = datetime.now(tz=UTC)
    session.flush()

    should_recalculate = bool(payload.recalculate and touched_fields.intersection(_BIRTH_RECALC_FIELDS))
    if should_recalculate and profile.birth_time_local is not None:
        calculate_chart_for_persisted_profile(
            session,
            profile,
            calculation_version=calculation_version,
            force_recalculate=True,
        )

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
        error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
        raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])

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
