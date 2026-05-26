from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BirthProfile, Chart, FamilyMember, FamilyVault, PeyarchiAlert, RelationshipAlert
from app.schemas.ambient_alerts import AmbientAlertItem, AmbientAlertsData, AmbientAlertsResponse
from app.schemas.dasha import ResponseMeta
from app.schemas.relationships import RelationshipBiText

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"

_PEYARCHI_BASE_SCORE = {
    "SATURN": 92,
    "RAHU": 86,
    "KETU": 86,
    "JUPITER": 84,
    "MARS": 74,
    "VENUS": 68,
}

_RELATIONSHIP_BASE_SCORE = {
    "RAHU": 80,
    "SATURN": 78,
    "JUPITER": 76,
    "VENUS": 74,
    "MARS": 72,
}


def _meta() -> ResponseMeta:
    return ResponseMeta(calculationVersion=_CALC_VERSION, generatedAt=datetime.now(tz=UTC))


def _due_tiers(alert: PeyarchiAlert, as_of: date) -> tuple[str, ...]:
    days = (alert.peyarchi_date - as_of).days
    tiers: list[str] = []
    if days == 0 and not alert.notified_day_of:
        tiers.append("day_of")
    if days == 1 and not alert.notified_1d:
        tiers.append("1d")
    if 2 <= days <= 7 and not alert.notified_7d:
        tiers.append("7d")
    if 8 <= days <= 30 and not alert.notified_30d:
        tiers.append("30d")
    return tuple(tiers)


def _tier_bonus(tier: str) -> int:
    if tier == "day_of":
        return 8
    if tier == "1d":
        return 6
    if tier == "7d":
        return 3
    return 0


def _score_peyarchi(planet: str, tier: str) -> int:
    base = _PEYARCHI_BASE_SCORE.get(planet, 60)
    return min(100, base + _tier_bonus(tier))


def _score_relationship(alert: RelationshipAlert, as_of_date: date) -> int:
    base = _RELATIONSHIP_BASE_SCORE.get(alert.trigger_planet, 70)
    day_gap = abs((alert.alert_date - as_of_date).days)
    freshness_penalty = min(20, day_gap * 4)
    unread_bonus = 5 if not alert.is_read else 0
    return max(0, min(100, base + unread_bonus - freshness_penalty))


def _collect_peyarchi_items(session: Session, owner_user_id: UUID, as_of_date: date) -> list[AmbientAlertItem]:
    rows = session.execute(
        select(PeyarchiAlert, BirthProfile.display_name)
        .join(Chart, Chart.chart_id == PeyarchiAlert.chart_id)
        .join(BirthProfile, BirthProfile.birth_profile_id == Chart.birth_profile_id)
        .where(
            BirthProfile.owner_user_id == owner_user_id,
            BirthProfile.deleted_at.is_(None),
            Chart.deleted_at.is_(None),
            PeyarchiAlert.peyarchi_date >= as_of_date,
            PeyarchiAlert.peyarchi_date <= as_of_date + timedelta(days=30),
        )
    ).all()

    items: list[AmbientAlertItem] = []
    for alert, display_name in rows:
        tiers = _due_tiers(alert, as_of_date)
        if not tiers:
            continue
        for tier in tiers:
            score = _score_peyarchi(alert.planet, tier)
            days = (alert.peyarchi_date - as_of_date).days
            items.append(
                AmbientAlertItem(
                    alertId=f"peyarchi:{alert.alert_id}:{tier}",
                    source="PEYARCHI",
                    significanceScore=score,
                    triggerPlanet=alert.planet,
                    triggerType="peyarchi_transition",
                    eventDate=alert.peyarchi_date,
                    daysFromToday=days,
                    tier=tier,
                    chartId=str(alert.chart_id),
                    title=RelationshipBiText(
                        ta=f"{display_name} - {alert.planet} peyarchi signal",
                        en=f"{display_name} - {alert.planet} transit signal",
                    ),
                    message=RelationshipBiText(
                        ta="Idhu traditionally associated with planning and steady routines; amaidiyana nadai payanulla kaalap pagudhi.",
                        en="Traditionally associated with planning and steady routines; this is a useful period for calm pacing.",
                    ),
                )
            )
    return items


def _collect_relationship_items(
    session: Session,
    owner_user_id: UUID,
    as_of_date: date,
    *,
    unread_only: bool,
) -> list[AmbientAlertItem]:
    query = (
        select(RelationshipAlert, FamilyMember.display_name, FamilyVault.family_vault_id)
        .join(FamilyMember, FamilyMember.family_member_id == RelationshipAlert.member_id)
        .join(FamilyVault, FamilyVault.family_vault_id == RelationshipAlert.vault_id)
        .where(
            FamilyVault.owner_user_id == owner_user_id,
            FamilyVault.deleted_at.is_(None),
            FamilyMember.deleted_at.is_(None),
            RelationshipAlert.alert_date >= as_of_date - timedelta(days=7),
        )
    )
    if unread_only:
        query = query.where(RelationshipAlert.is_read.is_(False))

    rows = session.execute(query).all()
    items: list[AmbientAlertItem] = []
    for alert, member_name, vault_id in rows:
        score = _score_relationship(alert, as_of_date)
        days = (alert.alert_date - as_of_date).days
        items.append(
            AmbientAlertItem(
                alertId=f"relationship:{alert.alert_id}",
                source="RELATIONSHIP",
                significanceScore=score,
                triggerPlanet=alert.trigger_planet,
                triggerType=alert.trigger_type,
                eventDate=alert.alert_date,
                daysFromToday=days,
                familyVaultId=str(vault_id),
                memberId=str(alert.member_id),
                title=RelationshipBiText(
                    ta=f"{member_name} uravu activation",
                    en=f"{member_name} relationship activation",
                ),
                message=RelationshipBiText(
                    ta=alert.message_ta,
                    en=alert.message_en,
                ),
            )
        )
    return items


def list_ambient_alerts(
    session: Session,
    owner_user_id: UUID,
    *,
    as_of_date: date,
    min_significance: int,
    unread_only: bool,
    limit: int,
) -> AmbientAlertsResponse:
    candidates = _collect_peyarchi_items(session, owner_user_id, as_of_date)
    candidates.extend(
        _collect_relationship_items(
            session,
            owner_user_id,
            as_of_date,
            unread_only=unread_only,
        )
    )

    candidates.sort(
        key=lambda item: (
            -item.significance_score,
            item.event_date,
            item.source,
        )
    )
    filtered = [item for item in candidates if item.significance_score >= min_significance]
    items = filtered[:limit]

    return AmbientAlertsResponse(
        data=AmbientAlertsData(
            asOfDate=as_of_date,
            minSignificance=min_significance,
            unreadOnly=unread_only,
            totalReturned=len(items),
            totalSuppressed=max(0, len(candidates) - len(filtered)),
            items=items,
        ),
        meta=_meta(),
    )
