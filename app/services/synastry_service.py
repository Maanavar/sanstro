from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import resolve_timezone, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import angular_distance
from app.db.session import SessionLocal
from app.models import BirthProfile, Chart, FamilyMember, FamilyVault, RelationshipAlert
from app.schemas.dasha import ResponseMeta
from app.schemas.relationships import (
    RelationshipAlertData,
    RelationshipAlertsListData,
    RelationshipAlertsResponse,
    RelationshipBiText,
    SynastryAspect,
    SynastryData,
    SynastryResponse,
)
from app.services.chart_service import load_persisted_chart_response

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"
_TRANSIT_ALERT_PLANETS = ("JUPITER", "SATURN", "MARS", "RAHU", "VENUS")


@dataclass(frozen=True, slots=True)
class _AspectEval:
    pair: str
    aspect: str
    orb: float
    tone: str
    note_en: str
    note_ta: str
    score_delta: int


@dataclass(frozen=True, slots=True)
class _TransitSynastryHit:
    trigger_planet: str
    trigger_type: str
    message_en: str
    message_ta: str


def _meta() -> ResponseMeta:
    return ResponseMeta(calculationVersion=_CALC_VERSION, generatedAt=datetime.now(tz=UTC))


def _assert_vault_owner(session: Session, family_vault_id: UUID, owner_user_id: UUID) -> FamilyVault:
    vault = session.get(FamilyVault, family_vault_id)
    if vault is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family vault not found.")
    if vault.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return vault


def _member_in_vault(session: Session, family_vault_id: UUID, member_id: UUID) -> FamilyMember:
    member = session.execute(
        select(FamilyMember).where(
            FamilyMember.family_vault_id == family_vault_id,
            FamilyMember.family_member_id == member_id,
            FamilyMember.deleted_at.is_(None),
        )
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found.")
    return member


def _latest_birth_profile(session: Session, member: FamilyMember) -> BirthProfile:
    profile = session.execute(
        select(BirthProfile)
        .where(
            BirthProfile.family_member_id == member.family_member_id,
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(BirthProfile.created_at.desc())
    ).scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Family member has no birth profile.")
    return profile


def _latest_chart(session: Session, profile: BirthProfile) -> Chart:
    chart = session.execute(
        select(Chart)
        .where(
            Chart.birth_profile_id == profile.birth_profile_id,
            Chart.status == "completed",
            Chart.deleted_at.is_(None),
        )
        .order_by(Chart.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if chart is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Family member has no completed chart.")
    return chart


def _owner_chart_for_vault(session: Session, family_vault_id: UUID, owner_user_id: UUID) -> Chart:
    member = session.execute(
        select(FamilyMember)
        .where(
            FamilyMember.family_vault_id == family_vault_id,
            FamilyMember.owner_user_id == owner_user_id,
            FamilyMember.relationship_to_owner == "self",
            FamilyMember.deleted_at.is_(None),
        )
        .order_by(FamilyMember.created_at.asc())
    ).scalar_one_or_none()
    if member is not None:
        return _latest_chart(session, _latest_birth_profile(session, member))

    profile = session.execute(
        select(BirthProfile)
        .where(
            BirthProfile.owner_user_id == owner_user_id,
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(BirthProfile.created_at.desc())
    ).scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Owner birth profile not found for synastry.")
    return _latest_chart(session, profile)


def _planet(snapshot: Any, name: str) -> Any:
    for p in snapshot.data.planets:
        if p.graha == name:
            return p
    raise ValueError(f"Planet {name} missing in chart snapshot.")


def _aspect_between(a: float, b: float) -> tuple[str, float] | None:
    sep = angular_distance(a, b)
    if sep <= 6.0:
        return ("conjunction", sep)
    if abs(sep - 120.0) <= 5.0:
        return ("trine", abs(sep - 120.0))
    if abs(sep - 60.0) <= 4.0:
        return ("sextile", abs(sep - 60.0))
    if abs(sep - 180.0) <= 6.0:
        return ("opposition", abs(sep - 180.0))
    if abs(sep - 90.0) <= 5.0:
        return ("square", abs(sep - 90.0))
    return None


def _aspect_eval(pair: str, a: float, b: float) -> _AspectEval | None:
    out = _aspect_between(a, b)
    if out is None:
        return None
    aspect, orb = out

    if aspect in {"conjunction", "trine", "sextile"}:
        tone = "harmony"
        delta = 8 if aspect != "sextile" else 5
        note_en = f"{pair} shows {aspect} support; this is traditionally associated with smoother understanding."
        note_ta = f"{pair} il {aspect} support kaanappadugiradhu; idhu inakkamaana puridhaludan traditionally associated."
    else:
        tone = "tension"
        delta = -7 if aspect == "square" else -5
        note_en = f"{pair} shows {aspect} pressure; this is traditionally associated with differences needing patience."
        note_ta = f"{pair} il {aspect} pressure kaanappadugiradhu; idhu porumai thevaiana vithyasangaludan traditionally associated."

    return _AspectEval(
        pair=pair,
        aspect=aspect,
        orb=round(float(orb), 2),
        tone=tone,
        note_en=note_en,
        note_ta=note_ta,
        score_delta=delta,
    )


def compute_synastry_score(chart_a_snapshot: Any, chart_b_snapshot: Any) -> SynastryData:
    a_venus = _planet(chart_a_snapshot, "VENUS")
    a_mars = _planet(chart_a_snapshot, "MARS")
    a_moon = _planet(chart_a_snapshot, "MOON")
    a_sun = _planet(chart_a_snapshot, "SUN")
    b_venus = _planet(chart_b_snapshot, "VENUS")
    b_mars = _planet(chart_b_snapshot, "MARS")
    b_moon = _planet(chart_b_snapshot, "MOON")
    b_sun = _planet(chart_b_snapshot, "SUN")

    checks = [
        ("A_VENUS-B_VENUS", a_venus.absolute_longitude, b_venus.absolute_longitude),
        ("A_VENUS-B_MARS", a_venus.absolute_longitude, b_mars.absolute_longitude),
        ("B_VENUS-A_MARS", b_venus.absolute_longitude, a_mars.absolute_longitude),
        ("A_MOON-B_MOON", a_moon.absolute_longitude, b_moon.absolute_longitude),
        ("A_SUN-B_MOON", a_sun.absolute_longitude, b_moon.absolute_longitude),
        ("B_SUN-A_MOON", b_sun.absolute_longitude, a_moon.absolute_longitude),
    ]

    base = 50
    aspects: list[_AspectEval] = []
    for pair, a, b in checks:
        evald = _aspect_eval(pair, a, b)
        if evald is None:
            continue
        aspects.append(evald)
        base += evald.score_delta

    score = max(0, min(100, base))
    label = "SUPPORTIVE" if score >= 65 else "MIXED" if score >= 45 else "CAREFUL"

    harmony_notes = [
        RelationshipBiText(ta=a.note_ta, en=a.note_en) for a in aspects if a.tone == "harmony"
    ]
    tension_notes = [
        RelationshipBiText(ta=a.note_ta, en=a.note_en) for a in aspects if a.tone == "tension"
    ]

    key_aspects = [
        SynastryAspect(
            pair=a.pair,
            aspect=a.aspect,
            orbDegrees=a.orb,
            tone=a.tone,
            note=RelationshipBiText(ta=a.note_ta, en=a.note_en),
        )
        for a in aspects
    ]

    if label == "SUPPORTIVE":
        summary = RelationshipBiText(
            ta=f"Synastry score {score}/100. Inakkam nandraaga kaanappadugiradhu; uravugalai nilaiyaana paadhaiyil munnerka support ulladhu.",
            en=f"Synastry score {score}/100. Overall alignment looks supportive for steady relationship progress.",
        )
    elif label == "MIXED":
        summary = RelationshipBiText(
            ta=f"Synastry score {score}/100. Inakkamum sila tension point-galum serntha nilai; thelivana pesudhal mukkiyam.",
            en=f"Synastry score {score}/100. Mixed pattern with both harmony and pressure points; clear communication is key.",
        )
    else:
        summary = RelationshipBiText(
            ta=f"Synastry score {score}/100. Sila tension activation kaanappadugiradhu; porumai, varambu, amaidiyana nadai mukkiyam.",
            en=f"Synastry score {score}/100. Pressure signatures are stronger; patience, boundaries, and calm pacing matter.",
        )

    return SynastryData(
        familyVaultId=UUID(int=0),  # replaced by caller
        memberId=UUID(int=0),       # replaced by caller
        score=score,
        label=label,
        harmonyNotes=harmony_notes,
        tensionNotes=tension_notes,
        keyAspects=key_aspects,
        summary=summary,
    )


def _transit_point_hits(transit_deg: float, natal_deg: float) -> bool:
    return angular_distance(transit_deg, natal_deg) <= 2.0


def check_transit_activation(
    chart_a_snapshot: Any,
    chart_b_snapshot: Any,
    transit_bodies: dict[str, Any],
) -> list[_TransitSynastryHit]:
    targets = [
        ("A_VENUS", _planet(chart_a_snapshot, "VENUS").absolute_longitude),
        ("B_VENUS", _planet(chart_b_snapshot, "VENUS").absolute_longitude),
        ("A_MOON", _planet(chart_a_snapshot, "MOON").absolute_longitude),
        ("B_MOON", _planet(chart_b_snapshot, "MOON").absolute_longitude),
    ]

    hits: list[_TransitSynastryHit] = []
    for planet in _TRANSIT_ALERT_PLANETS:
        body = transit_bodies.get(planet)
        if body is None:
            continue
        for target_name, target_deg in targets:
            if not _transit_point_hits(body.absolute_longitude, target_deg):
                continue
            hits.append(
                _TransitSynastryHit(
                    trigger_planet=planet,
                    trigger_type=f"transit_conjunct_{target_name.lower()}",
                    message_en=(
                        f"{planet} is closely activating {target_name.replace('_', ' ')}. "
                        f"Traditionally this is associated with a relationship-sensitive day for mindful communication."
                    ),
                    message_ta=(
                        f"{planet} {target_name.replace('_', ' ')} point-ai nerukkamaaga activate seigiradhu. "
                        f"Idhu traditionally uravu-kuritha naalaaga karudappadugiradhu; amaidiyana pesudhal mukkiyam."
                    ),
                )
            )
    return hits


def get_synastry_for_member(
    session: Session,
    owner_user_id: UUID,
    family_vault_id: UUID,
    member_id: UUID,
) -> SynastryResponse:
    _assert_vault_owner(session, family_vault_id, owner_user_id)
    member = _member_in_vault(session, family_vault_id, member_id)
    owner_chart = _owner_chart_for_vault(session, family_vault_id, owner_user_id)
    member_chart = _latest_chart(session, _latest_birth_profile(session, member))

    owner_snapshot = load_persisted_chart_response(session, owner_chart.chart_id)
    member_snapshot = load_persisted_chart_response(session, member_chart.chart_id)
    data = compute_synastry_score(owner_snapshot, member_snapshot)
    data = data.model_copy(update={"family_vault_id": family_vault_id, "member_id": member_id})

    return SynastryResponse(data=data, meta=_meta())


def list_relationship_alerts(
    session: Session,
    owner_user_id: UUID,
    family_vault_id: UUID,
    *,
    unread_only: bool = True,
) -> RelationshipAlertsResponse:
    _assert_vault_owner(session, family_vault_id, owner_user_id)
    query = select(RelationshipAlert).where(RelationshipAlert.vault_id == family_vault_id)
    if unread_only:
        query = query.where(RelationshipAlert.is_read.is_(False))
    query = query.order_by(RelationshipAlert.alert_date.desc(), RelationshipAlert.created_at.desc())
    rows = session.execute(query).scalars().all()

    items = [
        RelationshipAlertData(
            alertId=row.alert_id,
            familyVaultId=row.vault_id,
            memberId=row.member_id,
            triggerPlanet=row.trigger_planet,
            triggerType=row.trigger_type,
            alertDate=row.alert_date,
            isRead=row.is_read,
            message=RelationshipBiText(ta=row.message_ta, en=row.message_en),
            createdAt=row.created_at,
        )
        for row in rows
    ]
    return RelationshipAlertsResponse(
        data=RelationshipAlertsListData(
            familyVaultId=family_vault_id,
            unreadOnly=unread_only,
            totalCount=len(items),
            items=items,
        ),
        meta=_meta(),
    )


def refresh_relationship_alerts(session: Session, *, as_of_date: date) -> int:
    created = 0
    vaults = session.execute(select(FamilyVault).where(FamilyVault.deleted_at.is_(None))).scalars().all()
    for vault in vaults:
        owner_chart = _owner_chart_for_vault(session, vault.family_vault_id, vault.owner_user_id)
        owner_snapshot = load_persisted_chart_response(session, owner_chart.chart_id)
        owner_profile = owner_snapshot.data.birth_profile

        local_noon = datetime.combine(as_of_date, time(12, 0), tzinfo=resolve_timezone(owner_profile.birth_timezone))
        transit = calculate_sidereal_planets(utc_datetime_to_julian_day(local_noon.astimezone(UTC)))

        members = session.execute(
            select(FamilyMember).where(
                FamilyMember.family_vault_id == vault.family_vault_id,
                FamilyMember.deleted_at.is_(None),
                FamilyMember.relationship_to_owner != "self",
            )
        ).scalars().all()

        for member in members:
            try:
                member_chart = _latest_chart(session, _latest_birth_profile(session, member))
            except HTTPException:
                continue
            member_snapshot = load_persisted_chart_response(session, member_chart.chart_id)
            hits = check_transit_activation(owner_snapshot, member_snapshot, transit.bodies)
            for hit in hits:
                exists = session.execute(
                    select(RelationshipAlert).where(
                        RelationshipAlert.vault_id == vault.family_vault_id,
                        RelationshipAlert.member_id == member.family_member_id,
                        RelationshipAlert.trigger_planet == hit.trigger_planet,
                        RelationshipAlert.trigger_type == hit.trigger_type,
                        RelationshipAlert.alert_date == as_of_date,
                    )
                ).scalar_one_or_none()
                if exists is not None:
                    continue
                session.add(
                    RelationshipAlert(
                        vault_id=vault.family_vault_id,
                        member_id=member.family_member_id,
                        trigger_planet=hit.trigger_planet,
                        trigger_type=hit.trigger_type,
                        message_en=hit.message_en,
                        message_ta=hit.message_ta,
                        alert_date=as_of_date,
                        is_read=False,
                    )
                )
                created += 1
    return created


def daily_relationship_alert_refresh(run_at_utc: datetime | None = None) -> dict[str, int]:
    now = run_at_utc or datetime.now(tz=UTC)
    created = 0
    with SessionLocal() as session:
        created = refresh_relationship_alerts(session, as_of_date=now.date())
    return {"alerts_created": created}

