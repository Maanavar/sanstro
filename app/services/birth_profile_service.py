from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import case, select
from sqlalchemy.orm import Session

from app.models import BirthProfile, FamilyMember
from app.schemas.birth_profiles import BirthProfileCreate, BirthProfileCreateResult, BirthProfileGetResponse, BirthProfileResponse, BirthProfileResponseMeta, BirthProfileUpdate
from app.services.chart_service import calculate_chart_for_persisted_profile, create_birth_profile_record, _warning_messages


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


def create_birth_profile(session: Session, payload: BirthProfileCreate, *, calculation_version: str) -> BirthProfileCreateResult:
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")

    family_member = birth_profile.family_member
    family_vault_id = family_member.family_vault_id if family_member is not None else None
    relationship_to_owner = family_member.relationship_to_owner if family_member is not None else "self"

    return BirthProfileGetResponse(
        data=BirthProfileResponse(
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
            gender_for_traditional_rules=None,
            marital_status=birth_profile.marital_status,
            employment_type=birth_profile.employment_type,
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No birth profile found for the current user.")

    return get_birth_profile(session, birth_profile.birth_profile_id, calculation_version=calculation_version)
