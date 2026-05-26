from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.calculations.astro import resolve_timezone, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.panchangam import calculate_daily_panchangam
from app.models import BirthProfile, Chart, FamilyDailyScore, FamilyMember, FamilyVault, User
from app.schemas.daily_guidance import DailyGuidanceWindow
from app.schemas.dasha import ResponseMeta
from app.schemas.family_vaults import (
    FamilyAggregateBreakdown,
    FamilyAggregateData,
    FamilyAggregateMember,
    FamilyAggregateResponse,
    FamilyAggregateSummary,
    FamilyCalendarData,
    FamilyCalendarItem,
    FamilyCalendarResponse,
    FamilyMemberCreate,
    FamilyMemberCreateResponse,
    FamilyMemberCreateResult,
    FamilyMemberData,
    FamilyMemberDayView,
    FamilyMemberListData,
    FamilyMemberListResponse,
    FamilyMemberResponse,
    FamilyMemberUpdate,
    FamilyVaultDetailData,
    FamilyVaultDetailResponse,
    FamilyVaultCreate,
    FamilyVaultCreateResponse,
    FamilyVaultData,
    FamilyVaultListData,
    FamilyVaultListItem,
    FamilyVaultListResponse,
    FamilyVaultTodayData,
    FamilyVaultTodayResponse,
    FamilySummaryData,
    FamilySummaryResponse,
)
from app.services.chart_service import calculate_chart_for_persisted_profile, create_birth_profile_record
from app.services.chart_service import load_persisted_chart_response
from app.services.daily_guidance_service import build_daily_guidance_response
from app.services.transit_service import build_sani_cycle_response, build_transit_snapshot

DEFAULT_CALCULATION_VERSION = "jothidam-formula-engine-v1.1-2026"
MAJOR_SANI_TAGS = {"JANMA_SANI", "ARDHASHTAMA_SANI", "ASHTAMA_SANI", "KANTAKA_SANI", "KANDAKA_SANI"}
SUPPORTIVE_HORA_TAGS = {"JUPITER_HORA", "VENUS_HORA", "MERCURY_HORA"}


@dataclass(frozen=True, slots=True)
class _MemberSnapshot:
    member: FamilyMember
    birth_profile: BirthProfile
    chart_id: UUID
    daily_guidance: object
    gochar: object
    sani_cycle: object
    panchangam: object


def _ensure_user(session: Session, owner_user_id: UUID) -> None:
    if session.get(User, owner_user_id) is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Owner account not found for this session.",
        )


def _load_family_vault(session: Session, family_vault_id: UUID) -> FamilyVault:
    family_vault = session.get(FamilyVault, family_vault_id)
    if family_vault is None or family_vault.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family vault not found.")
    return family_vault


def _member_weight(member: FamilyMember) -> float:
    if member.member_weight is not None:
        return float(member.member_weight)

    weights = {
        "self": 1.0,
        "spouse": 1.0,
        "child": 0.75,
        "parent": 1.15,
        "grandparent": 1.15,
        "sibling": 0.75,
    }
    return weights.get(member.relationship_to_owner, 1.0)


def _latest_birth_profile(session: Session, member: FamilyMember) -> BirthProfile:
    birth_profile = session.execute(
        select(BirthProfile)
        .where(
            BirthProfile.family_member_id == member.family_member_id,
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(BirthProfile.created_at.desc())
    ).scalar_one_or_none()
    if birth_profile is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Family member {member.display_name} does not have a birth profile yet.",
        )
    return birth_profile


def _latest_chart(session: Session, birth_profile: BirthProfile) -> Chart:
    chart = session.execute(
        select(Chart)
        .where(Chart.birth_profile_id == birth_profile.birth_profile_id, Chart.status == "completed")
        .order_by(Chart.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if chart is not None:
        return chart

    chart_response = calculate_chart_for_persisted_profile(session, birth_profile, calculation_version=DEFAULT_CALCULATION_VERSION)
    resolved_chart = session.get(Chart, chart_response.data.chart_id)
    if resolved_chart is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to load chart.")
    return resolved_chart


def _find_duplicate_family_member(session: Session, family_vault_id: UUID, payload: FamilyMemberCreate) -> FamilyMember | None:
    normalized_name = payload.display_name.strip().lower()
    existing = session.execute(
        select(FamilyMember)
        .join(BirthProfile, BirthProfile.family_member_id == FamilyMember.family_member_id)
        .where(
            FamilyMember.family_vault_id == family_vault_id,
            FamilyMember.deleted_at.is_(None),
            BirthProfile.deleted_at.is_(None),
            func.lower(func.trim(FamilyMember.display_name)) == normalized_name,
            func.lower(func.trim(BirthProfile.display_name)) == normalized_name,
            FamilyMember.relationship_to_owner == payload.relationship_to_owner,
            FamilyMember.date_of_birth_local == payload.birth_date_local,
            BirthProfile.birth_date_local == payload.birth_date_local,
            BirthProfile.birth_time_local == payload.birth_time_local,
            BirthProfile.birth_place == payload.birth_place,
            BirthProfile.birth_latitude == payload.birth_latitude,
            BirthProfile.birth_longitude == payload.birth_longitude,
            BirthProfile.birth_timezone == payload.birth_timezone,
        )
        .order_by(FamilyMember.created_at.desc())
    ).scalar_one_or_none()
    return existing


def _member_snapshot(session: Session, member: FamilyMember, on_date: date) -> _MemberSnapshot:
    birth_profile = _latest_birth_profile(session, member)
    chart = _latest_chart(session, birth_profile)
    chart_id = chart.chart_id
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    panchangam = calculate_daily_panchangam(
        on_date,
        float(birth_profile.birth_latitude),
        float(birth_profile.birth_longitude),
        birth_profile.birth_timezone,
        session=session,
    )
    solar_noon_utc = panchangam.solar_noon.astimezone(UTC)
    current_jd = utc_datetime_to_julian_day(solar_noon_utc)
    transit_snapshot = calculate_sidereal_planets(current_jd)
    midnight_jd = utc_datetime_to_julian_day(
        datetime.combine(on_date, time(0, 0), tzinfo=resolve_timezone(birth_profile.birth_timezone)).astimezone(UTC)
    )
    midnight_snapshot = calculate_sidereal_planets(midnight_jd)

    daily_guidance = build_daily_guidance_response(
        chart_snapshot,
        on_date,
        panchangam=panchangam,
        transit_snapshot=transit_snapshot,
    )
    gochar = build_transit_snapshot(chart_snapshot, solar_noon_utc, current_snapshot=transit_snapshot)
    sani_cycle = build_sani_cycle_response(chart_snapshot, on_date, saturn_snapshot=midnight_snapshot)

    return _MemberSnapshot(
        member=member,
        birth_profile=birth_profile,
        chart_id=chart_id,
        daily_guidance=daily_guidance,
        gochar=gochar,
        sani_cycle=sani_cycle,
        panchangam=panchangam,
    )


def _cached_member_snapshot(
    session: Session,
    member: FamilyMember,
    on_date: date,
    snapshot_cache: dict[tuple[UUID, date], _MemberSnapshot],
) -> _MemberSnapshot:
    key = (member.family_member_id, on_date)
    cached = snapshot_cache.get(key)
    if cached is not None:
        return cached
    snapshot = _member_snapshot(session, member, on_date)
    snapshot_cache[key] = snapshot
    return snapshot


def _member_active_tags(snapshot: _MemberSnapshot) -> list[str]:
    tags: list[str] = []
    score = snapshot.daily_guidance.data.score

    if score >= 80:
        tags.append("STRONG_DAY")
    elif score >= 50:
        tags.append("NORMAL_DAY")
    elif score >= 35:
        tags.append("SUPPORT_DAY")
    else:
        tags.append("AVOID_NEW_START_DAY")

    if snapshot.gochar.data.is_chandrashtama:
        tags.append("CHANDRASHTAMA")

    if snapshot.sani_cycle.data.moon_based_cycle.is_active and snapshot.sani_cycle.data.moon_based_cycle.type:
        tags.append(snapshot.sani_cycle.data.moon_based_cycle.type)

    if snapshot.sani_cycle.data.lagna_based_cycle.is_active and snapshot.sani_cycle.data.lagna_based_cycle.type:
        tags.append(snapshot.sani_cycle.data.lagna_based_cycle.type)

    return tags


def _member_response(snapshot: _MemberSnapshot) -> FamilyAggregateMember:
    score = snapshot.daily_guidance.data.score
    return FamilyAggregateMember(
        familyMemberId=snapshot.member.family_member_id,
        displayName=snapshot.member.display_name,
        birthProfileId=snapshot.birth_profile.birth_profile_id,
        chartId=snapshot.chart_id,
        individualScore=score,
        label=snapshot.daily_guidance.data.label,
        memberWeight=_member_weight(snapshot.member),
        birthTimeConfidenceMinutes=int(snapshot.birth_profile.birth_time_confidence_minutes or 0),
        activeCycleTags=_member_active_tags(snapshot),
        bestWindows=snapshot.daily_guidance.data.best_windows,
        cautionWindows=snapshot.daily_guidance.data.caution_windows,
    )


def _family_label(score: int) -> str:
    if score >= 80:
        return "STRONG_FAMILY_DAY"
    if score >= 65:
        return "SUPPORTIVE"
    if score >= 50:
        return "SUPPORTIVE_MIXED"
    if score >= 35:
        return "CARE_REQUIRED"
    return "REST_AND_REFLECT"


def _minutes(value: str) -> int:
    hours, minutes = value.split(":")
    return int(hours) * 60 + int(minutes)


def _format_minutes(value: int) -> str:
    value = value % (24 * 60)
    return f"{value // 60:02d}:{value % 60:02d}"


def _intersect_windows(windows: list[list[DailyGuidanceWindow]]) -> list[DailyGuidanceWindow]:
    if not windows:
        return []

    common_ranges: list[tuple[int, int, str]] = [
        (_minutes(window.start), _minutes(window.end), window.type) for window in windows[0]
    ]

    for member_windows in windows[1:]:
        next_ranges: list[tuple[int, int, str]] = []
        for current_start, current_end, current_type in common_ranges:
            for window in member_windows:
                overlap_start = max(current_start, _minutes(window.start))
                overlap_end = min(current_end, _minutes(window.end))
                if overlap_start < overlap_end:
                    next_ranges.append((overlap_start, overlap_end, current_type))
        common_ranges = next_ranges
        if not common_ranges:
            return []

    common_ranges.sort(key=lambda item: (item[0], item[1]))
    start, end, window_type = common_ranges[0]
    return [DailyGuidanceWindow(type=window_type, start=_format_minutes(start), end=_format_minutes(end))]


def _family_best_windows(member_snapshots: list[_MemberSnapshot]) -> list[DailyGuidanceWindow]:
    common = _intersect_windows([snapshot.daily_guidance.data.best_windows for snapshot in member_snapshots])
    if common:
        return common
    first_windows = member_snapshots[0].daily_guidance.data.best_windows
    return first_windows[:1]


def _family_avoid_windows(member_snapshots: list[_MemberSnapshot]) -> list[DailyGuidanceWindow]:
    panchangam = member_snapshots[0].panchangam
    return [
        DailyGuidanceWindow(type="RAHU_KALAM", start=panchangam.rahu_kalam.start.strftime("%H:%M"), end=panchangam.rahu_kalam.end.strftime("%H:%M")),
        DailyGuidanceWindow(type="YAMAGANDAM", start=panchangam.yamagandam.start.strftime("%H:%M"), end=panchangam.yamagandam.end.strftime("%H:%M")),
        DailyGuidanceWindow(type="KULIGAI", start=panchangam.kuligai.start.strftime("%H:%M"), end=panchangam.kuligai.end.strftime("%H:%M")),
    ]


def _family_summary(
    label: str,
    best_windows: list[DailyGuidanceWindow],
    avoid_windows: list[DailyGuidanceWindow],
    support_member: FamilyAggregateMember | None,
) -> FamilyAggregateSummary:
    if label == "STRONG_FAMILY_DAY":
        en = "The family field is strongly supportive today. Use the shared best window for the most important task."
        ta = "இன்று குடும்ப அளவில் வலுவான ஆதரவு உள்ளது. மிக முக்கியமான பணியை பகிர்ந்த நல்ல நேரத்தில் வையுங்கள்."
    elif label == "SUPPORTIVE":
        en = "The day is supportive at family level. Keep plans calm and use the shared best window."
        ta = "குடும்ப அளவில் நாள் ஆதரவாக உள்ளது. திட்டங்களை அமைதியாக வைத்துக்கொண்டு பகிர்ந்த நல்ல நேரத்தை பயன்படுத்துங்கள்."
    elif label == "SUPPORTIVE_MIXED":
        en = "The family day is supportive but mixed. Keep decisions simple and support the member who needs a gentler pace."
        ta = "குடும்ப நாளில் ஆதரவும் கலப்பும் உள்ளது. முடிவுகளை எளிமையாக வைத்துக்கொண்டு மென்மையான நடைமுறை தேவைப்படும் உறுப்பினருக்கு ஆதரவு அளியுங்கள்."
    elif label == "CARE_REQUIRED":
        en = "The family field needs extra care today. Focus on routine, support, and practical decisions only."
        ta = "இன்று குடும்ப அளவில் கூடுதல் கவனம் தேவை. வழக்கமான பணிகள், ஆதரவு, மற்றும் நடைமுறை முடிவுகளில் மட்டும் கவனம் செலுத்துங்கள்."
    else:
        en = "A quieter day will suit the family best. Keep commitments light and avoid major new starts."
        ta = "குடும்பத்திற்கு அமைதியான நாள் ஏற்றது. பொறுப்புகளை இலகுவாக வைத்துக்கொண்டு பெரிய புதிய தொடக்கங்களைத் தவிர்க்குங்கள்."

    if best_windows:
        window = best_windows[0]
        en += f" Best shared window: {window.start}-{window.end}."
        ta += f" சிறந்த பகிர்ந்த நேரம்: {window.start}-{window.end}."

    if avoid_windows:
        window = avoid_windows[0]
        en += f" Avoid beginning important new work during {window.type.replace('_', ' ').title()}."
        ta += f" {window.type.replace('_', ' ')} நேரத்தில் முக்கியமான புதிய பணிகளைத் தொடங்க வேண்டாம்."

    if support_member is not None:
        en += f" {support_member.display_name} may benefit from a gentler pace today."
        ta += f" {support_member.display_name} அவர்களுக்கு இன்று மென்மையான நடைமுறை உதவும்."

    return FamilyAggregateSummary(ta=ta, en=en)


def _decision_member(member: FamilyAggregateMember) -> bool:
    return member.member_weight >= 1.2 or member.label == "STRONG_SUPPORT"


def _family_breakdown(
    member_summaries: list[FamilyAggregateMember],
    best_family_windows: list[DailyGuidanceWindow],
    avoid_for_family_decisions: list[DailyGuidanceWindow],
) -> tuple[FamilyAggregateBreakdown, int, int]:
    scores = [member.individual_score for member in member_summaries]
    weights = [member.member_weight for member in member_summaries]
    total_weight = sum(weights) or 1.0
    weighted_mean = sum(score * weight for score, weight in zip(scores, weights, strict=False)) / total_weight
    mean_score = sum(scores) / len(scores)
    lowest_score = min(scores)
    highest_score = max(scores)
    low_score_count = sum(1 for score in scores if score < 45)
    chandrashtama_count = sum(1 for member in member_summaries if "CHANDRASHTAMA" in member.active_cycle_tags)
    major_sani_count = sum(
        1 for member in member_summaries if MAJOR_SANI_TAGS.intersection(member.active_cycle_tags)
    )
    health_preventive_nudge_count = sum(1 for score in scores if score < 35)

    lowest_score_penalty = max(0, 55 - lowest_score) * 0.35
    high_stress_count_penalty = low_score_count * 4
    chandrashtama_penalty = chandrashtama_count * 3
    major_sani_penalty = major_sani_count * 4
    family_score_raw = (
        weighted_mean
        - lowest_score_penalty
        - high_stress_count_penalty
        - chandrashtama_penalty
        - major_sani_penalty
    )
    family_score = max(0, min(100, round(family_score_raw)))

    common_good_window_bonus = 0
    if best_family_windows:
        if best_family_windows[0].type == "ABHIJIT":
            common_good_window_bonus = 5
        elif best_family_windows[0].type in SUPPORTIVE_HORA_TAGS:
            common_good_window_bonus = 3

    rahu_yama_overlap_penalty = 0
    if best_family_windows and avoid_for_family_decisions:
        shared_start = _minutes(best_family_windows[0].start)
        shared_end = _minutes(best_family_windows[0].end)
        for caution_window in avoid_for_family_decisions[:2]:
            caution_start = _minutes(caution_window.start)
            caution_end = _minutes(caution_window.end)
            if max(shared_start, caution_start) < min(shared_end, caution_end):
                rahu_yama_overlap_penalty += 15 if caution_window.type == "RAHU_KALAM" else 12

    key_member_low_score_penalty = 0
    if any(_decision_member(member) and member.individual_score < 50 for member in member_summaries):
        key_member_low_score_penalty = 10

    decision_readiness_index = max(
        0,
        min(
            100,
            family_score + common_good_window_bonus - rahu_yama_overlap_penalty - key_member_low_score_penalty - (5 if chandrashtama_count else 0),
        ),
    )
    support_need_index = min(
        100,
        low_score_count * 10 + major_sani_count * 8 + chandrashtama_count * 5 + health_preventive_nudge_count * 4,
    )

    return (
        FamilyAggregateBreakdown(
            weightedMean=weighted_mean,
            meanScore=mean_score,
            lowestScore=lowest_score,
            highestScore=highest_score,
            totalWeight=total_weight,
            lowScoreCount=low_score_count,
            chandrashtamaCount=chandrashtama_count,
            majorSaniCount=major_sani_count,
            healthPreventiveNudgeCount=health_preventive_nudge_count,
            supportNeedIndex=support_need_index,
            decisionReadinessIndex=decision_readiness_index,
            commonGoodWindowBonus=common_good_window_bonus,
            rahuYamaOverlapPenalty=rahu_yama_overlap_penalty,
            keyMemberLowScorePenalty=key_member_low_score_penalty,
        ),
        family_score,
        decision_readiness_index,
    )


def _persist_family_daily_score(
    session: Session,
    family_vault_id: UUID,
    timezone_name: str,
    aggregate: FamilyAggregateData,
    member_summaries: list[FamilyAggregateMember],
    support_need_index: int,
    decision_readiness_index: int,
) -> None:
    existing = session.execute(
        select(FamilyDailyScore).where(
            FamilyDailyScore.family_vault_id == family_vault_id,
            FamilyDailyScore.date_local == aggregate.date_local,
            FamilyDailyScore.timezone == timezone_name,
        )
    ).scalar_one_or_none()

    payload_breakdown = aggregate.aggregate_breakdown.model_dump(mode="json", by_alias=True)
    payload_members = [member.model_dump(mode="json", by_alias=True) for member in member_summaries]
    payload_best_windows = [window.model_dump(mode="json", by_alias=True) for window in aggregate.best_family_windows]
    payload_avoid_windows = [
        window.model_dump(mode="json", by_alias=True) for window in aggregate.avoid_for_family_decisions
    ]

    if existing is None:
        existing = FamilyDailyScore(
            family_vault_id=family_vault_id,
            date_local=aggregate.date_local,
            timezone=timezone_name,
            family_score=aggregate.family_score,
            family_label=aggregate.family_label,
            aggregate_breakdown=payload_breakdown,
            member_scores=payload_members,
            best_family_windows=payload_best_windows,
            avoid_for_family_decisions=payload_avoid_windows,
            support_need_index=support_need_index,
            decision_readiness_index=decision_readiness_index,
        )
        session.add(existing)
    else:
        existing.family_score = aggregate.family_score
        existing.family_label = aggregate.family_label
        existing.aggregate_breakdown = payload_breakdown
        existing.member_scores = payload_members
        existing.best_family_windows = payload_best_windows
        existing.avoid_for_family_decisions = payload_avoid_windows
        existing.support_need_index = support_need_index
        existing.decision_readiness_index = decision_readiness_index

    session.flush()


def create_family_vault(session: Session, payload: FamilyVaultCreate, *, calculation_version: str = DEFAULT_CALCULATION_VERSION) -> FamilyVaultCreateResponse:
    owner_user_id = payload.owner_user_id
    if owner_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ownerUserId is required for family vault creation.",
        )
    _ensure_user(session, owner_user_id)
    now = datetime.now(tz=UTC)

    family_vault = FamilyVault(
        owner_user_id=owner_user_id,
        name=payload.name,
        default_language=payload.default_language,
        created_at=now,
        updated_at=now,
    )
    session.add(family_vault)
    session.flush()

    member_count = session.execute(
        select(func.count(FamilyMember.family_member_id)).where(
            FamilyMember.family_vault_id == family_vault.family_vault_id,
            FamilyMember.deleted_at.is_(None),
        )
    ).scalar_one()

    return FamilyVaultCreateResponse(
        data=FamilyVaultData(
            familyVaultId=family_vault.family_vault_id,
            ownerUserId=owner_user_id,
            name=family_vault.name,
            defaultLanguage=family_vault.default_language,
            memberCount=int(member_count or 0),
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_family_vault_detail(
    session: Session,
    family_vault_id: UUID,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
) -> FamilyVaultDetailResponse:
    family_vault = _load_family_vault(session, family_vault_id)
    member_count = session.execute(
        select(func.count(FamilyMember.family_member_id)).where(
            FamilyMember.family_vault_id == family_vault.family_vault_id,
            FamilyMember.deleted_at.is_(None),
        )
    ).scalar_one()
    latest_aggregate_date = session.execute(
        select(func.max(FamilyDailyScore.date_local)).where(
            FamilyDailyScore.family_vault_id == family_vault.family_vault_id
        )
    ).scalar_one()

    return FamilyVaultDetailResponse(
        data=FamilyVaultDetailData(
            familyVaultId=family_vault.family_vault_id,
            ownerUserId=family_vault.owner_user_id,
            name=family_vault.name,
            defaultLanguage=family_vault.default_language,
            memberCount=int(member_count or 0),
            latestAggregateDate=latest_aggregate_date,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def list_family_vaults(
    session: Session,
    owner_user_id: UUID,
    *,
    limit: int = 20,
    offset: int = 0,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
) -> FamilyVaultListResponse:
    member_counts = (
        select(
            FamilyMember.family_vault_id.label("family_vault_id"),
            func.count(FamilyMember.family_member_id).label("member_count"),
        )
        .where(FamilyMember.deleted_at.is_(None))
        .group_by(FamilyMember.family_vault_id)
        .subquery()
    )
    latest_scores = (
        select(
            FamilyDailyScore.family_vault_id.label("family_vault_id"),
            func.max(FamilyDailyScore.date_local).label("latest_aggregate_date"),
        )
        .group_by(FamilyDailyScore.family_vault_id)
        .subquery()
    )

    total_count = session.execute(
        select(func.count(FamilyVault.family_vault_id)).where(
            FamilyVault.owner_user_id == owner_user_id,
            FamilyVault.deleted_at.is_(None),
        )
    ).scalar_one()

    rows = session.execute(
        select(
            FamilyVault,
            func.coalesce(member_counts.c.member_count, 0).label("member_count"),
            latest_scores.c.latest_aggregate_date.label("latest_aggregate_date"),
        )
        .outerjoin(member_counts, member_counts.c.family_vault_id == FamilyVault.family_vault_id)
        .outerjoin(latest_scores, latest_scores.c.family_vault_id == FamilyVault.family_vault_id)
        .where(
            FamilyVault.owner_user_id == owner_user_id,
            FamilyVault.deleted_at.is_(None),
        )
        .order_by(FamilyVault.created_at.desc(), FamilyVault.family_vault_id.asc())
        .limit(limit)
        .offset(offset)
    ).all()

    items = [
        FamilyVaultListItem(
            familyVaultId=family_vault.family_vault_id,
            ownerUserId=family_vault.owner_user_id,
            name=family_vault.name,
            defaultLanguage=family_vault.default_language,
            memberCount=int(member_count or 0),
            latestAggregateDate=latest_aggregate_date,
        )
        for family_vault, member_count, latest_aggregate_date in rows
    ]

    return FamilyVaultListResponse(
        data=FamilyVaultListData(
            ownerUserId=owner_user_id,
            limit=limit,
            offset=offset,
            totalCount=int(total_count or 0),
            items=items,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def add_family_member(
    session: Session,
    family_vault_id: UUID,
    payload: FamilyMemberCreate,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
) -> FamilyMemberCreateResponse:
    family_vault = _load_family_vault(session, family_vault_id)

    if payload.family_vault_id is not None and payload.family_vault_id != family_vault.family_vault_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Family vault mismatch.")

    owner_user_id = payload.owner_user_id or family_vault.owner_user_id
    if payload.owner_user_id is not None and payload.owner_user_id != family_vault.owner_user_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Owner mismatch for family vault.")

    _ensure_user(session, owner_user_id)

    duplicate_member = _find_duplicate_family_member(session, family_vault.family_vault_id, payload)
    if duplicate_member is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This family member already exists in the vault.",
        )

    family_member = FamilyMember(
        owner_user_id=owner_user_id,
        family_vault_id=family_vault.family_vault_id,
        relationship_to_owner=payload.relationship_to_owner,
        display_name=payload.display_name,
        gender_for_traditional_rules=payload.gender_for_traditional_rules or "not_specified",
        date_of_birth_local=payload.birth_date_local,
        is_minor=payload.relationship_to_owner == "child",
        managed_by_user_id=owner_user_id,
        consent_status="owner_managed",
        member_weight=payload.member_weight,
    )
    session.add(family_member)
    session.flush()

    birth_profile = create_birth_profile_record(session, payload, family_member_id=family_member.family_member_id)
    chart_response = None
    if payload.calculate_now:
        chart_response = calculate_chart_for_persisted_profile(
            session,
            birth_profile,
            calculation_version=calculation_version,
            force_recalculate=False,
        )

    chart_id = chart_response.data.chart_id if chart_response is not None else None
    warnings = chart_response.data.warnings if chart_response is not None else []
    calculation_status = "completed" if payload.calculate_now else "pending"

    return FamilyMemberCreateResponse(
        data=FamilyMemberCreateResult(
            familyMemberId=family_member.family_member_id,
            familyVaultId=family_vault.family_vault_id,
            ownerUserId=owner_user_id,
            displayName=family_member.display_name,
            relationshipToOwner=family_member.relationship_to_owner,
            memberWeight=float(family_member.member_weight),
            birthProfileId=birth_profile.birth_profile_id,
            chartId=chart_id,
            calculationStatus=calculation_status,
            warnings=warnings,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_family_daily_aggregate(
    session: Session,
    family_vault_id: UUID,
    on_date: date,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
    snapshot_cache: dict[tuple[UUID, date], _MemberSnapshot] | None = None,
) -> FamilyAggregateResponse:
    family_vault = _load_family_vault(session, family_vault_id)
    family_members = session.execute(
        select(FamilyMember)
        .where(
            FamilyMember.family_vault_id == family_vault.family_vault_id,
            FamilyMember.deleted_at.is_(None),
        )
        .order_by(FamilyMember.created_at.asc())
    ).scalars().all()
    if not family_members:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Family vault has no members.")

    request_cache = snapshot_cache if snapshot_cache is not None else {}
    member_snapshots = [
        _cached_member_snapshot(session, member, on_date, request_cache)
        for member in family_members
    ]
    member_summaries = [_member_response(snapshot) for snapshot in member_snapshots]
    best_family_windows = _family_best_windows(member_snapshots)
    avoid_for_family_decisions = _family_avoid_windows(member_snapshots)

    breakdown, family_score, decision_readiness_index = _family_breakdown(
        member_summaries,
        best_family_windows,
        avoid_for_family_decisions,
    )
    family_label = _family_label(family_score)
    support_member = min(member_summaries, key=lambda item: item.individual_score) if member_summaries else None
    summary = _family_summary(family_label, best_family_windows, avoid_for_family_decisions, support_member)
    timezone_name = member_snapshots[0].birth_profile.birth_timezone

    aggregate = FamilyAggregateData(
        familyVaultId=family_vault.family_vault_id,
        dateLocal=on_date,
        timezone=timezone_name,
        familyScore=family_score,
        familyLabel=family_label,
        members=member_summaries,
        aggregateBreakdown=breakdown,
        bestFamilyWindows=best_family_windows,
        avoidForFamilyDecisions=avoid_for_family_decisions,
        summary=summary,
    )

    _persist_family_daily_score(
        session,
        family_vault.family_vault_id,
        timezone_name,
        aggregate,
        member_summaries,
        breakdown.support_need_index,
        decision_readiness_index,
    )

    return FamilyAggregateResponse(
        data=aggregate,
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_family_summary(
    session: Session,
    family_vault_id: UUID,
    on_date: date,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
) -> FamilySummaryResponse:
    aggregate = get_family_daily_aggregate(
        session,
        family_vault_id,
        on_date,
        calculation_version=calculation_version,
        snapshot_cache={},
    )
    return FamilySummaryResponse(
        data=FamilySummaryData(
            familyVaultId=aggregate.data.family_vault_id,
            dateLocal=aggregate.data.date_local,
            familyScore=aggregate.data.family_score,
            familyLabel=aggregate.data.family_label,
            summary=aggregate.data.summary,
            bestFamilyWindows=aggregate.data.best_family_windows,
            avoidForFamilyDecisions=aggregate.data.avoid_for_family_decisions,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_family_calendar(
    session: Session,
    family_vault_id: UUID,
    start_date: date,
    end_date: date,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
) -> FamilyCalendarResponse:
    if end_date < start_date:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="End date must be on or after start date.")

    if (end_date - start_date).days + 1 > 90:
        raise HTTPException(
            status_code=422,
            detail="Family calendar range must not exceed 90 days.",
        )

    _load_family_vault(session, family_vault_id)

    items: list[FamilyCalendarItem] = []
    snapshot_cache: dict[tuple[UUID, date], _MemberSnapshot] = {}
    current = start_date
    while current <= end_date:
        aggregate = get_family_daily_aggregate(
            session,
            family_vault_id,
            current,
            calculation_version=calculation_version,
            snapshot_cache=snapshot_cache,
        )
        items.append(
            FamilyCalendarItem(
                dateLocal=current,
                familyScore=aggregate.data.family_score,
                familyLabel=aggregate.data.family_label,
                bestFamilyWindows=aggregate.data.best_family_windows,
                avoidForFamilyDecisions=aggregate.data.avoid_for_family_decisions,
                summary=aggregate.data.summary,
            )
        )
        current += timedelta(days=1)

    return FamilyCalendarResponse(
        data=FamilyCalendarData(
            familyVaultId=family_vault_id,
            fromDate=start_date,
            toDate=end_date,
            items=items,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def _load_family_member(session: Session, family_vault_id: UUID, family_member_id: UUID) -> FamilyMember:
    member = session.execute(
        select(FamilyMember).where(
            FamilyMember.family_member_id == family_member_id,
            FamilyMember.family_vault_id == family_vault_id,
            FamilyMember.deleted_at.is_(None),
        )
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found.")
    return member


def _member_data(member: FamilyMember, birth_profile: BirthProfile | None) -> FamilyMemberData:
    return FamilyMemberData(
        familyMemberId=member.family_member_id,
        familyVaultId=member.family_vault_id,
        ownerUserId=member.owner_user_id,
        displayName=member.display_name,
        relationshipToOwner=member.relationship_to_owner,
        memberWeight=float(member.member_weight),
        genderForTraditionalRules=member.gender_for_traditional_rules,
        dateOfBirthLocal=member.date_of_birth_local,
        isMinor=member.is_minor,
        birthProfileId=birth_profile.birth_profile_id if birth_profile else None,
    )


def list_family_members(
    session: Session,
    family_vault_id: UUID,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
) -> FamilyMemberListResponse:
    _load_family_vault(session, family_vault_id)
    members = session.execute(
        select(FamilyMember)
        .where(
            FamilyMember.family_vault_id == family_vault_id,
            FamilyMember.deleted_at.is_(None),
        )
        .order_by(FamilyMember.created_at.asc())
    ).scalars().all()

    items: list[FamilyMemberData] = []
    for member in members:
        profile = session.execute(
            select(BirthProfile)
            .where(
                BirthProfile.family_member_id == member.family_member_id,
                BirthProfile.deleted_at.is_(None),
            )
            .order_by(BirthProfile.created_at.desc())
        ).scalar_one_or_none()
        items.append(_member_data(member, profile))

    return FamilyMemberListResponse(
        data=FamilyMemberListData(
            familyVaultId=family_vault_id,
            totalCount=len(items),
            items=items,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def get_family_member(
    session: Session,
    family_vault_id: UUID,
    family_member_id: UUID,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
) -> FamilyMemberResponse:
    _load_family_vault(session, family_vault_id)
    member = _load_family_member(session, family_vault_id, family_member_id)
    profile = session.execute(
        select(BirthProfile)
        .where(
            BirthProfile.family_member_id == member.family_member_id,
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(BirthProfile.created_at.desc())
    ).scalar_one_or_none()
    return FamilyMemberResponse(
        data=_member_data(member, profile),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def update_family_member(
    session: Session,
    family_vault_id: UUID,
    family_member_id: UUID,
    payload: FamilyMemberUpdate,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
) -> FamilyMemberResponse:
    _load_family_vault(session, family_vault_id)
    member = _load_family_member(session, family_vault_id, family_member_id)

    if payload.display_name is not None:
        member.display_name = payload.display_name
    if payload.relationship_to_owner is not None:
        member.relationship_to_owner = payload.relationship_to_owner
        member.is_minor = payload.relationship_to_owner == "child"
    if payload.member_weight is not None:
        member.member_weight = payload.member_weight
    if payload.gender_for_traditional_rules is not None:
        member.gender_for_traditional_rules = payload.gender_for_traditional_rules
    member.updated_at = datetime.now(tz=UTC)

    # Update birth profile fields if birth location/time data was supplied
    birth_fields = {
        "birth_place": payload.birth_place,
        "birth_latitude": payload.birth_latitude,
        "birth_longitude": payload.birth_longitude,
        "birth_timezone": payload.birth_timezone,
        "birth_time_local": payload.birth_time_local,
    }
    if any(v is not None for v in birth_fields.values()):
        profile = session.execute(
            select(BirthProfile)
            .where(
                BirthProfile.family_member_id == member.family_member_id,
                BirthProfile.deleted_at.is_(None),
            )
            .order_by(BirthProfile.created_at.desc())
        ).scalar_one_or_none()
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No birth profile found for this member to update.",
            )
        if payload.birth_place is not None:
            profile.birth_place = payload.birth_place
        if payload.birth_latitude is not None:
            profile.birth_latitude = payload.birth_latitude
        if payload.birth_longitude is not None:
            profile.birth_longitude = payload.birth_longitude
        if payload.birth_timezone is not None:
            profile.birth_timezone = payload.birth_timezone
        if payload.birth_time_local is not None:
            profile.birth_time_local = payload.birth_time_local
        profile.updated_at = datetime.now(tz=UTC)
    else:
        profile = session.execute(
            select(BirthProfile)
            .where(
                BirthProfile.family_member_id == member.family_member_id,
                BirthProfile.deleted_at.is_(None),
            )
            .order_by(BirthProfile.created_at.desc())
        ).scalar_one_or_none()

    session.flush()
    return FamilyMemberResponse(
        data=_member_data(member, profile),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def delete_family_member(
    session: Session,
    family_vault_id: UUID,
    family_member_id: UUID,
) -> None:
    _load_family_vault(session, family_vault_id)
    member = _load_family_member(session, family_vault_id, family_member_id)
    now = datetime.now(tz=UTC)
    member.deleted_at = now
    # Soft-delete all birth profiles linked to this member
    profiles = session.execute(
        select(BirthProfile).where(
            BirthProfile.family_member_id == member.family_member_id,
            BirthProfile.deleted_at.is_(None),
        )
    ).scalars().all()
    for profile in profiles:
        profile.deleted_at = now
    session.flush()


_SCORE_HIGHLIGHT: dict[str, dict[str, str]] = {
    "STRONG_SUPPORT": {
        "ta": "இன்று வலுவான நாள் — திட்டமிட்ட காரியங்களுக்கு ஏற்றது.",
        "en": "Strong support day — ideal for planned tasks.",
    },
    "GOOD": {
        "ta": "நல்ல ஆதரவு நாள் — திட்டமிட்டதை முன்னெடுக்கலாம்.",
        "en": "Good day — move ahead with planned activities.",
    },
    "BALANCED": {
        "ta": "நிலையான நாள் — படிப்படியாக செல்லுங்கள்.",
        "en": "Steady day — proceed step by step.",
    },
    "CAUTION": {
        "ta": "கவனம் தேவை — வழக்கமான பணிகளில் கவனம் செலுத்துங்கள்.",
        "en": "Quieter day — focus on routine tasks.",
    },
    "RESTORATIVE": {
        "ta": "ஓய்வு நாள் — புதிய முயற்சிகளை நாளை தொடங்குங்கள்.",
        "en": "Restorative day — start fresh tomorrow.",
    },
}


def get_family_vault_today(
    session: Session,
    family_vault_id: UUID,
    on_date: date,
    *,
    calculation_version: str = DEFAULT_CALCULATION_VERSION,
) -> FamilyVaultTodayResponse:
    """
    FEATURE-04: Combined today view for all members in a family vault.
    Calls the existing score engine for each member and assembles a concise per-member card.
    """
    _load_family_vault(session, family_vault_id)

    members = session.execute(
        select(FamilyMember)
        .where(
            FamilyMember.family_vault_id == family_vault_id,
            FamilyMember.deleted_at.is_(None),
        )
        .order_by(FamilyMember.created_at.asc())
    ).scalars().all()

    day_views: list[FamilyMemberDayView] = []
    for member in members:
        try:
            snapshot = _member_snapshot(session, member, on_date)
        except HTTPException:
            continue

        guidance = snapshot.daily_guidance
        panchangam = snapshot.panchangam
        sani = snapshot.sani_cycle
        gochar = snapshot.gochar

        score = guidance.data.score
        label = guidance.data.label
        highlight = _SCORE_HIGHLIGHT.get(label, _SCORE_HIGHLIGHT["BALANCED"])
        sani_active = sani.data.moon_based_cycle.is_active or sani.data.lagna_based_cycle.is_active
        sani_type = (
            sani.data.moon_based_cycle.type
            if sani.data.moon_based_cycle.is_active
            else (sani.data.lagna_based_cycle.type if sani.data.lagna_based_cycle.is_active else None)
        )

        nalla_neram_start = "N/A"
        if guidance.data.best_windows:
            nalla_neram_start = guidance.data.best_windows[0].start

        rahu_start = panchangam.rahu_kalam.start.strftime("%H:%M")
        rahu_end = panchangam.rahu_kalam.end.strftime("%H:%M")

        birth_profile = _latest_birth_profile(session, member)

        day_views.append(FamilyMemberDayView(
            profileId=birth_profile.birth_profile_id,
            chartId=snapshot.chart_id,
            name=member.display_name,
            relationship=member.relationship_to_owner,
            score=score,
            label=label,
            highlightTa=highlight["ta"],
            highlightEn=highlight["en"],
            chandrashtama=gochar.data.is_chandrashtama,
            saniCycleActive=sani_active,
            saniCycleType=sani_type,
            nallaNeramStart=nalla_neram_start,
            rahuKalamStart=rahu_start,
            rahuKalamEnd=rahu_end,
        ))

    return FamilyVaultTodayResponse(
        data=FamilyVaultTodayData(
            vaultId=family_vault_id,
            dateLocal=on_date,
            members=day_views,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )
