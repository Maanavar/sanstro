from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.calculations.astro import resolve_timezone
from app.db.session import SessionLocal
from app.models import BirthProfile, Chart
from app.models.peyarchi_alert import PeyarchiAlert
from app.models.user import User
from app.services.email_service import PeyarchiEmailContext, send_peyarchi_notification
from app.services.peyarchi_service import get_peyarchi_summary

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class PendingPeyarchiNotification:
    alert_id: UUID
    chart_id: UUID
    planet: str
    peyarchi_date: date
    due_tiers: tuple[str, ...]


def _format_event_date_for_email(value: date) -> str:
    """Cross-platform day-month-year format without leading zero day."""
    return f"{value.day} {value.strftime('%b %Y')}"


def refresh_peyarchi_alerts(session: Session, chart_id: UUID, as_of: date) -> None:
    summary = get_peyarchi_summary(session, chart_id, as_of=as_of)
    for event in summary.data:
        existing = session.execute(
            select(PeyarchiAlert).where(
                PeyarchiAlert.chart_id == chart_id,
                PeyarchiAlert.planet == event.planet,
                PeyarchiAlert.peyarchi_date == event.peyarchi_date_local,
            )
        ).scalar_one_or_none()
        if existing is not None:
            continue
        session.add(
            PeyarchiAlert(
                chart_id=chart_id,
                planet=event.planet,
                from_rasi=event.from_rasi,
                to_rasi=event.to_rasi,
                peyarchi_date=event.peyarchi_date_local,
                peyarchi_utc=event.peyarchi_date_utc,
                impact_from_moon=event.impact_from_moon,
                sani_cycle_after=event.sani_cycle_after,
            )
        )


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


def get_pending_notifications(
    session: Session,
    as_of: date,
    *,
    chart_id: UUID | None = None,
) -> list[PendingPeyarchiNotification]:
    max_date = as_of + timedelta(days=30)
    query = select(PeyarchiAlert).where(
        PeyarchiAlert.peyarchi_date >= as_of,
        PeyarchiAlert.peyarchi_date <= max_date,
        or_(
            PeyarchiAlert.notified_30d.is_(False),
            PeyarchiAlert.notified_7d.is_(False),
            PeyarchiAlert.notified_1d.is_(False),
            PeyarchiAlert.notified_day_of.is_(False),
        ),
    )
    if chart_id is not None:
        query = query.where(PeyarchiAlert.chart_id == chart_id)
    rows = session.execute(query).scalars().all()

    pending: list[PendingPeyarchiNotification] = []
    for alert in rows:
        tiers = _due_tiers(alert, as_of)
        if not tiers:
            continue
        pending.append(
            PendingPeyarchiNotification(
                alert_id=alert.alert_id,
                chart_id=alert.chart_id,
                planet=alert.planet,
                peyarchi_date=alert.peyarchi_date,
                due_tiers=tiers,
            )
        )
    return pending


def mark_notified(session: Session, alert_id: UUID, tier: str) -> None:
    alert = session.get(PeyarchiAlert, alert_id)
    if alert is None:
        raise ValueError(f"Peyarchi alert '{alert_id}' not found.")
    if tier == "30d":
        alert.notified_30d = True
    elif tier == "7d":
        alert.notified_7d = True
    elif tier == "1d":
        alert.notified_1d = True
    elif tier == "day_of":
        alert.notified_day_of = True
    else:
        raise ValueError(f"Unknown notification tier '{tier}'.")


def _lookup_chart_owner_email(session: Session, chart_id: UUID) -> tuple[str | None, str]:
    """Returns (email_or_None, display_name)."""
    row = session.execute(
        select(User.email, BirthProfile.display_name)
        .join(BirthProfile, BirthProfile.owner_user_id == User.user_id)
        .join(Chart, Chart.birth_profile_id == BirthProfile.birth_profile_id)
        .where(Chart.chart_id == chart_id)
    ).first()
    if row is None:
        return None, ""
    return row[0], row[1]


def daily_peyarchi_refresh(run_at_utc: datetime | None = None) -> dict[str, int]:
    now_utc = run_at_utc or datetime.now(tz=UTC)
    refreshed = 0
    notifications_sent = 0

    with SessionLocal() as session:
        chart_local_dates: dict[UUID, date] = {}
        chart_rows = session.execute(
            select(Chart.chart_id, BirthProfile.birth_timezone).join(
                BirthProfile,
                BirthProfile.birth_profile_id == Chart.birth_profile_id,
            )
        ).all()

        for chart_id, birth_timezone in chart_rows:
            local_date = now_utc.astimezone(resolve_timezone(birth_timezone)).date()
            refresh_peyarchi_alerts(session, chart_id, local_date)
            chart_local_dates[chart_id] = local_date
            refreshed += 1
        session.commit()

        # Second transaction — refresh writes are committed before dispatch.
        for chart_id, local_date in chart_local_dates.items():
            pending = get_pending_notifications(session, local_date, chart_id=chart_id)
            if not pending:
                continue

            owner_email, display_name = _lookup_chart_owner_email(session, chart_id)

            for item in pending:
                alert = session.get(PeyarchiAlert, item.alert_id)
                if alert is None:
                    continue
                for tier in item.due_tiers:
                    logger.info(
                        "peyarchi_notification chart_id=%s alert_id=%s planet=%s tier=%s peyarchi_date=%s",
                        item.chart_id,
                        item.alert_id,
                        item.planet,
                        tier,
                        item.peyarchi_date.isoformat(),
                    )
                    delivered_or_suppressed = True
                    if owner_email:
                        ctx = PeyarchiEmailContext(
                            to_address=owner_email,
                            display_name=display_name,
                            planet=item.planet,
                            from_rasi=alert.from_rasi,
                            to_rasi=alert.to_rasi,
                            event_date_str=_format_event_date_for_email(item.peyarchi_date),
                            days_away=(item.peyarchi_date - local_date).days,
                            house_from_moon=alert.impact_from_moon,
                            sani_cycle_after=alert.sani_cycle_after,
                            tier=tier,
                        )
                        delivered_or_suppressed = send_peyarchi_notification(ctx)
                    if delivered_or_suppressed:
                        mark_notified(session, item.alert_id, tier)
                        notifications_sent += 1
                    else:
                        logger.warning(
                            "peyarchi_notification_send_failed chart_id=%s alert_id=%s planet=%s tier=%s",
                            item.chart_id,
                            item.alert_id,
                            item.planet,
                            tier,
                        )
        session.commit()

    return {"charts_refreshed": refreshed, "notifications_marked": notifications_sent}
