from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.transits import angular_distance
from app.db.session import SessionLocal
from app.models import BirthProfile, Chart, FamilyMember, FamilyVault, RelationshipAlert
from app.schemas.dasha import ResponseMeta
from app.calculations.astro import NAKSHATRA_NAMES
from app.calculations.porutham import compute_porutham
from app.schemas.relationships import (
    ChartMarriageStrength,
    CompatibilityIntelligenceData,
    CompatibilityIntelligenceResponse,
    CompatibilityScoreBreakdown,
    DashaHarmony,
    DirectCompareRequest,
    DirectPoruthamData,
    DirectPoruthamResponse,
    EmotionalCompatibility,
    KutaResult,
    NadiDoshaData,
    NavamsaCompatibility,
    PorutthamData,
    PorutthamResponse,
    RelationshipAlertData,
    RelationshipAlertsListData,
    RelationshipAlertsResponse,
    RelationshipBiText,
    SevvaiDoshamDetail,
    SynastryAspect,
    SynastryData,
    SynastryResponse,
)
from app.services.chart_service import load_persisted_chart_response
from app.services.location_service import local_noon_as_utc_for_profile

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


def _load_owned_chart(session: Session, chart_id: UUID, owner_user_id: UUID) -> Chart:
    """Load a completed chart by id, asserting it belongs to the requesting user.

    Used when a caller (e.g. the Porutham tool) wants to pin Person A explicitly
    to a chart they just generated, instead of defaulting to the vault owner.
    """
    chart = session.execute(
        select(Chart).where(
            Chart.chart_id == chart_id,
            Chart.status == "completed",
            Chart.deleted_at.is_(None),
        )
    ).scalar_one_or_none()
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found for comparison.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chart does not belong to this user.")
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
        .limit(1)
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

        local_noon_utc = local_noon_as_utc_for_profile(as_of_date, owner_profile)
        transit = calculate_sidereal_planets(utc_datetime_to_julian_day(local_noon_utc))

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


_CONTEXT_KUTA_MASK: dict[str, tuple[str, ...]] = {
    "MARRIAGE": ("Dinam", "Ganam", "Mahendra", "Stree Dirgha", "Yoni", "Rasi", "Graha Maitri", "Vedha", "Vasya", "Rajju"),
    "FRIENDSHIP": ("Dinam", "Ganam", "Rasi", "Graha Maitri", "Vedha"),
    "BUSINESS": ("Ganam", "Mahendra", "Rasi", "Graha Maitri", "Vasya"),
    "FAMILY": ("Rasi", "Ganam", "Vasya", "Graha Maitri", "Vedha"),
    "GENERAL": ("Dinam", "Ganam", "Rasi", "Graha Maitri"),
}

_CONTEXT_TITLE_EN: dict[str, str] = {
    "MARRIAGE": "Marriage compatibility",
    "FRIENDSHIP": "Friendship compatibility",
    "BUSINESS": "Business compatibility",
    "FAMILY": "Family harmony compatibility",
    "GENERAL": "General compatibility",
}

_CONTEXT_NOTE: dict[str, dict[str, str]] = {
    "MARRIAGE": {
        "ta": "திருமண பொருத்தம்: ஸ்தீர கூடம் (நிலைத்த தன்மை) மற்றும் ராஜ்ஜு தோஷம் முக்கியம்.",
        "en": "Marriage context: Sthira kuta (stability) and Rajju dosha are most significant.",
    },
    "FRIENDSHIP": {
        "ta": "நட்பு பொருத்தம்: தினம், கணம், ராசி, கிரக மைத்திரி, வேதம் ஆகிய சமிக்ஞைகள் மதிப்பிடப்படுகின்றன.",
        "en": "Friendship context: Dina, Gana, Rasi, Graha Maitri, and Vedha factors are evaluated.",
    },
    "BUSINESS": {
        "ta": "தொழில் பொருத்தம்: கணம், மஹேந்திரம், ராசி, கிரக மைத்திரி, வாஸ்யம் மூலம் கூட்டாண்மை திறன் மதிப்பிடப்படுகிறது.",
        "en": "Business context: Gana, Mahendra, Rasi, Graha Maitri, and Vasya factors evaluate partnership potential.",
    },
    "FAMILY": {
        "ta": "குடும்ப பொருத்தம்: ராசி, கணம், வாஸ்யம், கிரக மைத்திரி, வேதம் மூலம் ஒற்றுமை மதிப்பிடப்படுகிறது.",
        "en": "Family context: Rasi, Gana, Vasya, Graha Maitri, and Vedha factors evaluate harmony.",
    },
    "GENERAL": {
        "ta": "பொதுவான பொருத்தம்: தினம், கணம், ராசி, கிரக மைத்திரி ஆகிய மைய குறியீடுகள் பார்க்கப்படுகின்றன.",
        "en": "General compatibility uses core factors only (Dina, Gana, Rasi, Graha Maitri).",
    },
}


def _label_for_percentage(percentage: float) -> str:
    if percentage >= 80:
        return "EXCELLENT"
    if percentage >= 60:
        return "GOOD"
    if percentage >= 40:
        return "AVERAGE"
    return "CAUTION"


def _contextualize_porutham_result(result, compatibility_context: str) -> dict[str, object]:
    allowed = set(_CONTEXT_KUTA_MASK.get(compatibility_context, _CONTEXT_KUTA_MASK["GENERAL"]))
    selected = [k for k in result.kutas if k.name in allowed]
    if not selected:
        selected = list(result.kutas)

    total_score = sum(k.score for k in selected)
    max_score = sum(k.max_score for k in selected)
    percentage = round((total_score / max_score) * 100, 1) if max_score > 0 else 0.0
    label = _label_for_percentage(percentage)
    rajju_dosha = any(k.name == "Rajju" and k.score == 0 for k in selected)
    vedha_dosha = any(k.name == "Vedha" and k.score == 0 for k in selected)

    if compatibility_context == "MARRIAGE":
        summary = RelationshipBiText(ta=result.summary_ta, en=result.summary_en)
    else:
        factors = ", ".join(k.name for k in selected[:6])
        scope = _CONTEXT_TITLE_EN.get(compatibility_context, _CONTEXT_TITLE_EN["GENERAL"])
        scope_ta = {
            "FRIENDSHIP": "நட்பு பொருத்தம்",
            "BUSINESS": "தொழில் பொருத்தம்",
            "FAMILY": "குடும்ப ஒற்றுமை பொருத்தம்",
            "GENERAL": "பொது பொருத்தம்",
        }.get(compatibility_context, "பொது பொருத்தம்")
        en = (
            f"{scope}: {label.lower()} alignment ({total_score}/{max_score} · {percentage}%). "
            f"Evaluated factors: {factors}."
        )
        ta = (
            f"{scope_ta}: {label.lower()} இணக்கம் ({total_score}/{max_score} · {percentage}%). "
            f"மதிப்பிடப்பட்ட கூறுகள்: {factors}."
        )
        summary = RelationshipBiText(ta=ta, en=en)

    return {
        "kutas": selected,
        "total_score": total_score,
        "max_score": max_score,
        "percentage": percentage,
        "label": label,
        "rajju_dosha": rajju_dosha,
        "vedha_dosha": vedha_dosha,
        "nadi_dosha": result.nadi_dosha,
        "summary": summary,
    }


def get_porutham_for_member(
    session: Session,
    owner_user_id: UUID,
    family_vault_id: UUID,
    member_id: UUID,
    *,
    compatibility_context: str = "GENERAL",
) -> PorutthamResponse:
    _assert_vault_owner(session, family_vault_id, owner_user_id)
    member = _member_in_vault(session, family_vault_id, member_id)
    if compatibility_context == "MARRIAGE" and member.relationship_to_owner in {"parent", "child", "sibling", "grandparent"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Marriage compatibility analysis is not applicable for this relationship type.",
        )
    owner_chart = _owner_chart_for_vault(session, family_vault_id, owner_user_id)
    member_chart = _latest_chart(session, _latest_birth_profile(session, member))

    owner_snap = load_persisted_chart_response(session, owner_chart.chart_id)
    member_snap = load_persisted_chart_response(session, member_chart.chart_id)

    owner_moon = _planet(owner_snap, "MOON")
    member_moon = _planet(member_snap, "MOON")

    # Convention: owner=boy, member=girl for the kuta direction
    result = compute_porutham(
        boy_nakshatra=owner_moon.nakshatra,
        girl_nakshatra=member_moon.nakshatra,
        boy_rasi=owner_moon.rasi,
        girl_rasi=member_moon.rasi,
    )
    shaped = _contextualize_porutham_result(result, compatibility_context)

    kutas = [
        KutaResult(
            name=k.name,
            name_ta=k.name_ta,
            score=k.score,
            max_score=k.max_score,
            label=k.label,
        )
        for k in shaped["kutas"]
    ]

    _note_raw = _CONTEXT_NOTE.get(compatibility_context, _CONTEXT_NOTE["GENERAL"])
    data = PorutthamData(
        family_vault_id=family_vault_id,
        member_id=member_id,
        boy_nakshatra=owner_moon.nakshatra,
        boy_nakshatra_name=NAKSHATRA_NAMES[owner_moon.nakshatra - 1],
        girl_nakshatra=member_moon.nakshatra,
        girl_nakshatra_name=NAKSHATRA_NAMES[member_moon.nakshatra - 1],
        kutas=kutas,
        total_score=shaped["total_score"],
        max_score=shaped["max_score"],
        percentage=shaped["percentage"],
        label=shaped["label"],
        rajju_dosha=shaped["rajju_dosha"],
        vedha_dosha=shaped["vedha_dosha"],
        nadi_dosha=NadiDoshaData(**shaped["nadi_dosha"]),
        summary=shaped["summary"],
        compatibility_context=compatibility_context,
        context_note=RelationshipBiText(ta=_note_raw["ta"], en=_note_raw["en"]),
    )
    return PorutthamResponse(data=data, meta=_meta())


def compare_charts_direct(
    session: Session,
    owner_user_id: UUID,
    chart_id_a: UUID,
    chart_id_b: UUID,
    *,
    compatibility_context: str = "GENERAL",
) -> DirectPoruthamResponse:
    """Compute Porutham for any two charts owned by the current user."""
    from app.models import Chart

    def _assert_owned(cid: UUID) -> Chart:
        chart = session.get(Chart, cid)
        if chart is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Chart {cid} not found.")
        profile = session.get(BirthProfile, chart.birth_profile_id)
        if profile is None or profile.owner_user_id != owner_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return chart

    chart_a = _assert_owned(chart_id_a)
    chart_b = _assert_owned(chart_id_b)

    snap_a = load_persisted_chart_response(session, chart_a.chart_id)
    snap_b = load_persisted_chart_response(session, chart_b.chart_id)

    moon_a = _planet(snap_a, "MOON")
    moon_b = _planet(snap_b, "MOON")

    result = compute_porutham(
        boy_nakshatra=moon_a.nakshatra,
        girl_nakshatra=moon_b.nakshatra,
        boy_rasi=moon_a.rasi,
        girl_rasi=moon_b.rasi,
    )
    shaped = _contextualize_porutham_result(result, compatibility_context)

    kutas = [
        KutaResult(name=k.name, name_ta=k.name_ta, score=k.score, max_score=k.max_score, label=k.label)
        for k in shaped["kutas"]
    ]

    _note_raw = _CONTEXT_NOTE.get(compatibility_context, _CONTEXT_NOTE["GENERAL"])
    data = DirectPoruthamData(
        chart_id_a=chart_id_a,
        chart_id_b=chart_id_b,
        boy_nakshatra=moon_a.nakshatra,
        boy_nakshatra_name=NAKSHATRA_NAMES[moon_a.nakshatra - 1],
        girl_nakshatra=moon_b.nakshatra,
        girl_nakshatra_name=NAKSHATRA_NAMES[moon_b.nakshatra - 1],
        kutas=kutas,
        total_score=shaped["total_score"],
        max_score=shaped["max_score"],
        percentage=shaped["percentage"],
        label=shaped["label"],
        rajju_dosha=shaped["rajju_dosha"],
        vedha_dosha=shaped["vedha_dosha"],
        nadi_dosha=NadiDoshaData(**shaped["nadi_dosha"]),
        summary=shaped["summary"],
        compatibility_context=compatibility_context,
        context_note=RelationshipBiText(ta=_note_raw["ta"], en=_note_raw["en"]),
    )
    return DirectPoruthamResponse(data=data, meta=_meta())


def get_compatibility_intelligence_for_member(
    session: Session,
    owner_user_id: UUID,
    family_vault_id: UUID,
    member_id: UUID,
    person_a_chart_id: UUID | None = None,
) -> CompatibilityIntelligenceResponse:
    """Full 8-level Compatibility Intelligence Report for marriage (signed users only).

    Person A defaults to the vault owner's chart. Callers that already know who
    Person A is (the Porutham tool, where the user fills two explicit people) can
    pass ``person_a_chart_id`` to pin Person A to that chart instead of the owner —
    otherwise the report can silently compare the owner against the member even
    when the user meant two different people.
    """
    from app.calculations.astro import utc_datetime_to_julian_day
    from app.calculations.compatibility_intelligence import compute_compatibility_intelligence
    from app.calculations.porutham import compute_porutham, check_nadi_dosha

    _assert_vault_owner(session, family_vault_id, owner_user_id)
    member = _member_in_vault(session, family_vault_id, member_id)

    if member.relationship_to_owner in {"parent", "child", "sibling", "grandparent"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Compatibility Intelligence analysis requires a spouse/partner relationship context.",
        )

    owner_chart = (
        _load_owned_chart(session, person_a_chart_id, owner_user_id)
        if person_a_chart_id is not None
        else _owner_chart_for_vault(session, family_vault_id, owner_user_id)
    )
    member_chart = _latest_chart(session, _latest_birth_profile(session, member))

    snap_a = load_persisted_chart_response(session, owner_chart.chart_id)
    snap_b = load_persisted_chart_response(session, member_chart.chart_id)

    moon_a = _planet(snap_a, "MOON")
    moon_b = _planet(snap_b, "MOON")

    # Layer 1: compute porutham
    porutham_result = compute_porutham(
        boy_nakshatra=moon_a.nakshatra,
        girl_nakshatra=moon_b.nakshatra,
        boy_rasi=moon_a.rasi,
        girl_rasi=moon_b.rasi,
    )

    # Layer 8: compute synastry
    synastry_data = compute_synastry_score(snap_a, snap_b)

    # Today's JD
    today_jd = utc_datetime_to_julian_day(datetime.now(tz=UTC))

    # Get display names
    name_a = snap_a.data.birth_profile.display_name or "Person A"
    name_b = snap_b.data.birth_profile.display_name or "Person B"

    ci = compute_compatibility_intelligence(
        snap_a=snap_a,
        snap_b=snap_b,
        porutham_result=porutham_result,
        synastry_score=synastry_data.score,
        today_jd=today_jd,
        person_a_name=name_a,
        person_b_name=name_b,
    )

    # Build nadi dosha schema
    nadi = porutham_result.nadi_dosha
    nadi_data = NadiDoshaData(
        boy_nadi=nadi["boy_nadi"],
        girl_nadi=nadi["girl_nadi"],
        has_nadi_dosha=nadi["has_nadi_dosha"],
        cancellations=nadi.get("cancellations", []),
        severity=nadi["severity"],
        note_ta=nadi["note_ta"],
        note_en=nadi["note_en"],
    )

    kutas = [
        KutaResult(name=k.name, name_ta=k.name_ta, score=k.score, max_score=k.max_score, label=k.label)
        for k in porutham_result.kutas
    ]

    def _sevvai_schema(s: object) -> SevvaiDoshamDetail:
        return SevvaiDoshamDetail(
            has_dosham=s.has_dosham,
            mars_house=s.mars_house,
            is_cancelled=s.is_cancelled,
            severity=s.severity,
            cancellation_reasons=s.cancellation_reasons,
            note_en=s.note_en,
            note_ta=s.note_ta,
            score=s.score,
        )

    def _cms_schema(c: object) -> ChartMarriageStrength:
        return ChartMarriageStrength(
            seventh_house_rasi=c.seventh_house_rasi,
            seventh_lord=c.seventh_lord,
            seventh_lord_house=c.seventh_lord_house,
            seventh_lord_strength=c.seventh_lord_strength,
            venus_house=c.venus_house,
            venus_strength=c.venus_strength,
            jupiter_house=c.jupiter_house,
            jupiter_strength=c.jupiter_strength,
            has_malefic_in_seventh=c.has_malefic_in_seventh,
            score=c.score,
            note_en=c.note_en,
            note_ta=c.note_ta,
        )

    data = CompatibilityIntelligenceData(
        person_a_name=ci.person_a_name,
        person_b_name=ci.person_b_name,
        porutham_score=ci.porutham_score,
        porutham_max=ci.porutham_max,
        porutham_percentage=ci.porutham_percentage,
        porutham_label=ci.porutham_label,
        porutham_kutas=kutas,
        rajju_dosha=ci.rajju_dosha,
        vedha_dosha=ci.vedha_dosha,
        nadi_dosha=nadi_data,
        chart_a_strength=_cms_schema(ci.chart_a_strength),
        chart_b_strength=_cms_schema(ci.chart_b_strength),
        navamsa=NavamsaCompatibility(
            person_a_venus_d9=ci.navamsa.person_a_venus_d9,
            person_b_venus_d9=ci.navamsa.person_b_venus_d9,
            person_a_seventh_lord_d9=ci.navamsa.person_a_seventh_lord_d9,
            person_b_seventh_lord_d9=ci.navamsa.person_b_seventh_lord_d9,
            harmony_label=ci.navamsa.harmony_label,
            note_en=ci.navamsa.note_en,
            note_ta=ci.navamsa.note_ta,
            score=ci.navamsa.score,
        ),
        sevvai_a=_sevvai_schema(ci.sevvai_a),
        sevvai_b=_sevvai_schema(ci.sevvai_b),
        dasha_harmony=DashaHarmony(
            person_a_maha_lord=ci.dasha_harmony.person_a_maha_lord,
            person_a_antar_lord=ci.dasha_harmony.person_a_antar_lord,
            person_a_maha_end=ci.dasha_harmony.person_a_maha_end,
            person_b_maha_lord=ci.dasha_harmony.person_b_maha_lord,
            person_b_antar_lord=ci.dasha_harmony.person_b_antar_lord,
            person_b_maha_end=ci.dasha_harmony.person_b_maha_end,
            harmony_label=ci.dasha_harmony.harmony_label,
            note_en=ci.dasha_harmony.note_en,
            note_ta=ci.dasha_harmony.note_ta,
            score=ci.dasha_harmony.score,
        ),
        emotional=EmotionalCompatibility(
            moon_moon_harmony=ci.emotional.moon_moon_harmony,
            venus_mars_harmony=ci.emotional.venus_mars_harmony,
            communication_note=ci.emotional.communication_note,
            note_en=ci.emotional.note_en,
            note_ta=ci.emotional.note_ta,
            score=ci.emotional.score,
        ),
        synastry_score=ci.synastry_score,
        overall_score=ci.overall_score,
        overall_label=ci.overall_label,
        score_breakdown=CompatibilityScoreBreakdown(
            porutham=ci.score_breakdown.porutham,
            seventh_house=ci.score_breakdown.seventh_house,
            navamsa=ci.score_breakdown.navamsa,
            dasha_harmony=ci.score_breakdown.dasha_harmony,
            dosham_analysis=ci.score_breakdown.dosham_analysis,
            emotional=ci.score_breakdown.emotional,
            synastry=ci.score_breakdown.synastry,
        ),
        strengths_en=ci.strengths_en,
        strengths_ta=ci.strengths_ta,
        risks_en=ci.risks_en,
        risks_ta=ci.risks_ta,
        summary=RelationshipBiText(ta=ci.summary_ta, en=ci.summary_en),
    )
    return CompatibilityIntelligenceResponse(data=data, meta=_meta())


def daily_relationship_alert_refresh(run_at_utc: datetime | None = None) -> dict[str, int]:
    now = run_at_utc or datetime.now(tz=UTC)
    created = 0
    with SessionLocal() as session:
        created = refresh_relationship_alerts(session, as_of_date=now.date())
    return {"alerts_created": created}

