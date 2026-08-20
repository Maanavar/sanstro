"""
Daily push notification cron.

Runs every hour on the hour (trigger: ``minute=0`` in app/scheduler.py).
``_morning_alert_due`` checks each user's preferred alert time against the
current UTC clock, so each user receives the notification in a ±30-minute
window around their chosen local time — not all at once.

For each user who has opted into morning_alert, dasha_alert, or
pirantha_naal_alert the function:

  1. Loads their primary birth profile + chart.
  2. Computes the panchangam-based daily score for today (local date).
  3. Builds and dispatches the Morning Nalla Neram notification (MORNING_NALLA_NERAM).
  4. Checks for dasha transitions within 90 days (DASHA_TRANSITION).
  5. Checks for today's Pirantha Naal (PIRANTHA_NAAL).

All delivery is opt-in and goes through dispatch_notification, which handles
FCM/email routing, smart-silence suppression, and audit logging.

Deployment model
----------------
Single-box (default)
    ``JOTHIDAM_RUN_SCHEDULER_IN_WEB=true`` (the default).  APScheduler runs
    inside the FastAPI lifespan.  A PostgreSQL advisory lock (SchedulerLease)
    ensures only one worker fires the cron when uvicorn spawns multiple workers.
    On SQLite the lock is a no-op (always granted).

Dedicated worker (scaled deploy)
    Set ``JOTHIDAM_RUN_SCHEDULER_IN_WEB=false`` on API processes, then start
    one scheduler process per deployment::

        python -m app.worker

    The worker acquires the same advisory lock; replicated worker containers
    elect a leader automatically.  A crashed leader releases the lock when its
    DB connection drops and a replica takes over on next startup.

Designed to be callable as a plain function (no async) so APScheduler can
invoke it as a standard job.
"""
from __future__ import annotations

import logging
from datetime import UTC, date, datetime, time
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.calculations.astro import (
    NAKSHATRA_NAME_TO_NUMBER,
    local_datetime_to_utc,
    resolve_timezone,
    utc_datetime_to_julian_day,
)
from app.calculations.panchangam import (
    best_gowri_slot,
    calculate_daily_panchangam,
    gowri_good_label,
    gowri_good_purpose,
)
from app.db.session import SessionLocal
from app.models.birth_profile import BirthProfile
from app.models.chart import Chart
from app.models.chart_planet import ChartPlanet
from app.models.notification import Notification
from app.models.user import User
from app.models.user_notification_preference import UserNotificationPreference
from app.services._dg_scoring import (
    AUSPICIOUS_DAILY_NAKSHATRAS,
    CAUTION_DAILY_NAKSHATRAS,
)
from app.services.daily_guidance_service import get_daily_guidance
from app.services.dasha_transition_service import get_dasha_transition_alerts
from app.services.location_service import resolve_effective_daily_location
from app.services.nakshatra_content import build_nakshatra_perspective
from app.services.notification_dispatch_service import dispatch_notification, dispatch_queued_notification
from app.services.notification_service import build_morning_notification
from app.services.pirantha_naal_service import next_janma_nakshatra_date

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _score_label(score: int) -> str:
    if score >= 80:
        return "STRONG_SUPPORT"
    if score >= 65:
        return "GOOD"
    if score >= 50:
        return "BALANCED"
    if score >= 35:
        return "CAUTION"
    return "RESTORATIVE"


def _format_clock_label(value: datetime | time | object | None) -> str:
    if value is None:
        return "N/A"
    try:
        hour = int(value.hour)
        minute = int(value.minute)
    except Exception:
        try:
            raw = str(value.strftime("%H:%M"))
            hour_text, minute_text = raw.split(":", 1)
            hour = int(hour_text)
            minute = int(minute_text[:2])
        except Exception:
            return str(value)

    suffix = "am" if hour < 12 else "pm"
    hour_12 = hour % 12 or 12
    return f"{hour_12}:{minute:02d} {suffix}"


def _latest_active_profile(session: Session, user_id: UUID) -> BirthProfile | None:
    return session.execute(
        select(BirthProfile)
        .where(
            BirthProfile.owner_user_id == user_id,
            BirthProfile.deleted_at.is_(None),
        )
        .order_by(BirthProfile.created_at.desc())
    ).scalar_one_or_none()


def _latest_completed_chart(session: Session, profile: BirthProfile) -> Chart | None:
    return session.execute(
        select(Chart)
        .where(
            Chart.birth_profile_id == profile.birth_profile_id,
            Chart.status == "completed",
            Chart.deleted_at.is_(None),
        )
        .order_by(Chart.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()


def _morning_alert_due(pref: UserNotificationPreference, now_utc: datetime, tz_name: str) -> bool:
    """True when the current UTC time falls within the user's morning_alert_time window (±30 min)."""
    try:
        tz = resolve_timezone(tz_name)
        local_now = now_utc.astimezone(tz)
    except Exception:
        return False
    alert_time = pref.morning_alert_time or time(6, 0)
    alert_dt = datetime.combine(local_now.date(), alert_time)
    delta = abs((local_now.replace(tzinfo=None) - alert_dt).total_seconds())
    return delta <= 1800  # ±30 minutes


def _morning_alert_in_catchup_window(pref: UserNotificationPreference, now_utc: datetime, tz_name: str) -> bool:
    """True when the alert window was missed: it ended 30-120 minutes ago (server restart catch-up)."""
    try:
        tz = resolve_timezone(tz_name)
        local_now = now_utc.astimezone(tz)
    except Exception:
        return False
    alert_time = pref.morning_alert_time or time(6, 0)
    alert_dt = datetime.combine(local_now.date(), alert_time)
    elapsed = (local_now.replace(tzinfo=None) - alert_dt).total_seconds()
    return 1800 < elapsed <= 7200  # missed 30 min–2 hours ago


def _already_sent_today(
    session: Session,
    user_id: UUID,
    notification_type: str,
    local_date: date,
    timezone_name: str,
) -> bool:
    """True if a notification of this type was already sent/queued for this user today (local date)."""
    local_tz = resolve_timezone(timezone_name)
    day_start_local = datetime.combine(local_date, time(0, 0), tzinfo=local_tz)
    day_end_local = datetime.combine(local_date, time(23, 59, 59), tzinfo=local_tz)
    day_start = day_start_local.astimezone(UTC)
    day_end = day_end_local.astimezone(UTC)
    count = session.execute(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.type == notification_type,
            Notification.status.in_(["sent", "queued"]),
            Notification.send_at >= day_start,
            Notification.send_at <= day_end,
        )
    ).scalars().first()
    return count is not None


# ---------------------------------------------------------------------------
# Per-user dispatch
# ---------------------------------------------------------------------------

def _dispatch_for_user(
    session: Session,
    user: User,
    pref: UserNotificationPreference,
    run_date: date,
    now_utc: datetime,
) -> dict[str, str]:
    """Process one user; return a dict of alert_type → dispatch result."""
    results: dict[str, str] = {}

    profile = _latest_active_profile(session, user.user_id)
    if profile is None:
        return results

    chart = _latest_completed_chart(session, profile)
    if chart is None:
        return results

    daily_location = resolve_effective_daily_location(profile)
    tz_name = daily_location.timezone or "Asia/Kolkata"
    lat = daily_location.latitude
    lon = daily_location.longitude

    # Use the user's local date for all date-sensitive checks
    try:
        user_tz = resolve_timezone(tz_name)
        run_date = now_utc.astimezone(user_tz).date()
    except Exception:  # noqa: S110 — fall back to the UTC run_date computed above
        pass

    # ----------------------------------------------------------------
    # 1. Morning Nalla Neram (MORNING_NALLA_NERAM)
    # Regular window ±30 min + catch-up window 30-120 min after (P2-09).
    # The _already_sent_today check prevents double-sending on overlapping ticks.
    # ----------------------------------------------------------------
    _alert_due = (
        _morning_alert_due(pref, now_utc, tz_name)
        or _morning_alert_in_catchup_window(pref, now_utc, tz_name)
    )
    if pref.morning_alert_enabled and _alert_due and not _already_sent_today(session, user.user_id, "MORNING_NALLA_NERAM", run_date, tz_name):
        try:
            panchang = calculate_daily_panchangam(run_date, lat, lon, tz_name)
            # The star this push speaks about. Dominant rather than sunrise: the
            # sunrise star holds under half the day on 46.6% of days, and a
            # morning notification naming a star that ended fifteen minutes
            # after sunrise is the defect this whole change is about.
            fallback_star = panchang.dominant_nakshatra_number or panchang.nakshatra_number
            nalla_slot = best_gowri_slot(panchang.nalla_neram)
            nalla_start = _format_clock_label(nalla_slot.start) if nalla_slot else "-"
            nalla_end = _format_clock_label(nalla_slot.end) if nalla_slot else "-"
            nalla_name = getattr(nalla_slot, "name", None) if nalla_slot else None
            rahu_start = _format_clock_label(panchang.rahu_kalam.start)
            rahu_end = _format_clock_label(panchang.rahu_kalam.end)

            # Use the full daily guidance engine for an accurate score and rich content.
            # get_daily_guidance() is cache-backed (DailyScore table) so this is cheap
            # if the daily batch has already run for today.
            try:
                guidance = get_daily_guidance(session, chart.chart_id, run_date)
                score = guidance.data.score
                label = guidance.data.label
                is_chandrashtama = guidance.data.is_chandrashtama
                action_ta = guidance.data.action_suggestion.ta
                action_en = guidance.data.action_suggestion.en
                dasha_ctx_ta = guidance.data.reasons.dasha_support.ta
                dasha_ctx_en = guidance.data.reasons.dasha_support.en
            except Exception:
                # Fall back to panchangam-only signal if full guidance fails.
                # Star sets imported, not restated: this branch used to carry
                # 14 (Chithirai) in BOTH its auspicious and its caution literal,
                # and because auspicious was tested first the caution arm for 14
                # was unreachable — the two lists agreed on 14 by accident while
                # disagreeing in their source. Keyed on the day's dominant star
                # rather than the sunrise one, to match the guidance score this
                # is standing in for.
                score = 50
                if fallback_star in AUSPICIOUS_DAILY_NAKSHATRAS:
                    score = 72
                elif fallback_star in CAUTION_DAILY_NAKSHATRAS:
                    score = 32
                label = _score_label(score)
                is_chandrashtama = False
                action_ta = action_en = ""
                dasha_ctx_ta = dasha_ctx_en = ""

            nak_content = build_nakshatra_perspective(fallback_star, label)
            nak_ta = nak_content.ta if nak_content else str(panchang.nakshatra_number)
            nak_en = nak_content.en if nak_content else str(panchang.nakshatra_number)

            payload = build_morning_notification(
                score_label=label,
                nalla_neram_start=nalla_start,
                nalla_neram_end=nalla_end,
                rahu_start=rahu_start,
                rahu_end=rahu_end,
                nakshatra_name_ta=nak_ta,
                nakshatra_name_en=nak_en,
                nalla_neram_category_ta=gowri_good_label(nalla_name, "ta"),
                nalla_neram_category_en=gowri_good_label(nalla_name, "en"),
                nalla_neram_purpose_ta=gowri_good_purpose(nalla_name, "ta"),
                nalla_neram_purpose_en=gowri_good_purpose(nalla_name, "en"),
            )

            # Enrich body with chandrashtama warning, dasha context, action guidance.
            if is_chandrashtama:
                payload["body"]["ta"] += " சந்திராஷ்டமம் — உணர்ச்சி ரீதியாக சற்று கவனம் தேவை."
                payload["body"]["en"] += " Chandrashtama day — be emotionally mindful."
            if dasha_ctx_en:
                payload["body"]["ta"] += f" {dasha_ctx_ta}"
                payload["body"]["en"] += f" {dasha_ctx_en}"
            if action_en:
                payload["body"]["ta"] += f" {action_ta}"
                payload["body"]["en"] += f" {action_en}"

            result = dispatch_notification(
                session=session,
                user_id=user.user_id,
                notification_type="MORNING_NALLA_NERAM",
                title_ta=payload["title"]["ta"],
                title_en=payload["title"]["en"],
                body_ta=payload["body"]["ta"],
                body_en=payload["body"]["en"],
                user_email=user.email,
                chart_id=chart.chart_id,
                priority=60,
            )
            results["MORNING_NALLA_NERAM"] = result
            session.commit()
        except Exception as exc:
            logger.error("morning_alert_error user=%s exc=%s", user.user_id, exc)
            session.rollback()

    # ----------------------------------------------------------------
    # 2. Dasha transition alert (DASHA_TRANSITION)
    # ----------------------------------------------------------------
    if pref.dasha_alert_enabled and not _already_sent_today(session, user.user_id, "DASHA_TRANSITION", run_date, tz_name):
        try:
            local_noon = datetime.combine(run_date, time(12, 0), tzinfo=resolve_timezone(tz_name))
            jd_noon = utc_datetime_to_julian_day(local_noon.astimezone(UTC))

            moon_planet = session.execute(
                select(ChartPlanet).where(
                    ChartPlanet.chart_id == chart.chart_id,
                    ChartPlanet.graha == "MOON",
                )
            ).scalar_one_or_none()
            birth_dt = profile.birth_datetime_utc
            if (
                birth_dt is None
                and profile.birth_date_local is not None
                and profile.birth_time_local is not None
                and profile.birth_timezone
            ):
                local_dt = datetime.combine(profile.birth_date_local, profile.birth_time_local)
                birth_dt = local_datetime_to_utc(local_dt, profile.birth_timezone)
            if birth_dt is not None and moon_planet is not None:
                birth_jd = utc_datetime_to_julian_day(
                    birth_dt if birth_dt.tzinfo else birth_dt.replace(tzinfo=UTC)
                )
                moon_lon = float(moon_planet.absolute_longitude)
                alerts = get_dasha_transition_alerts(birth_jd, moon_lon, jd_noon, run_date)
                for alert in alerts:
                    result = dispatch_notification(
                        session=session,
                        user_id=user.user_id,
                        notification_type="DASHA_TRANSITION",
                        title_ta=f"தசை மாற்றம் — {alert.urgency}",
                        title_en=f"Dasha Transition — {alert.urgency}",
                        body_ta=alert.copy_ta,
                        body_en=alert.copy_en,
                        user_email=user.email,
                        chart_id=chart.chart_id,
                        priority=80 if alert.urgency == "TODAY" else 60,
                    )
                    results[f"DASHA_TRANSITION_{alert.type}_{alert.urgency}"] = result
                session.commit()
        except Exception as exc:
            logger.error("dasha_alert_error user=%s exc=%s", user.user_id, exc)
            session.rollback()

    # ----------------------------------------------------------------
    # 3. Pirantha Naal (PIRANTHA_NAAL)
    # ----------------------------------------------------------------
    if pref.pirantha_naal_alert_enabled and not _already_sent_today(session, user.user_id, "PIRANTHA_NAAL", run_date, tz_name):
        try:
            janma_nak_name = chart.janma_nakshatra  # stored as uppercase string e.g. "ROHINI"
            nak_key = "".join(c for c in janma_nak_name.lower() if c.isalnum()) if janma_nak_name else None
            janma_nak_num = NAKSHATRA_NAME_TO_NUMBER.get(nak_key) if nak_key else None
            if janma_nak_num:
                pirantha = next_janma_nakshatra_date(janma_nak_num, run_date, lat, lon, tz_name)
                if pirantha and pirantha.is_today:
                    result = dispatch_notification(
                        session=session,
                        user_id=user.user_id,
                        notification_type="PIRANTHA_NAAL",
                        title_ta=f"இன்று உங்கள் பிறந்த நாள் நட்சத்திரம்: {pirantha.nakshatra_name_ta}",
                        title_en=f"Today is your Janma Nakshatra day: {pirantha.nakshatra_name_en}",
                        body_ta=(
                            f"{pirantha.nakshatra_name_ta} நட்சத்திரம் {pirantha.nakshatra_ends_at} வரை நீடிக்கும். "
                            "இன்று பிரார்த்தனை, தானம் மற்றும் நல்ல செயல்களுக்கு சிறந்த நேரம்."
                        ),
                        body_en=(
                            f"{pirantha.nakshatra_name_en} nakshatra lasts until {pirantha.nakshatra_ends_at}. "
                            "An auspicious day for prayer, charity, and good deeds."
                        ),
                        user_email=user.email,
                        chart_id=chart.chart_id,
                        priority=70,
                    )
                    results["PIRANTHA_NAAL"] = result
                    session.commit()
        except Exception as exc:
            logger.error("pirantha_naal_error user=%s exc=%s", user.user_id, exc)
            session.rollback()

    return results




def _payload_text(notification: Notification, field: str, lang: str) -> str | None:
    value = (notification.payload or {}).get(field)
    if isinstance(value, dict):
        text_value = value.get(lang)
        if isinstance(text_value, str) and text_value.strip():
            return text_value
    return None


def _process_due_queued_notifications(session: Session, now_utc: datetime) -> dict[str, int]:
    """Deliver due one-time onboarding notification rows."""
    due_rows = session.execute(
        select(Notification)
        .where(
            Notification.type == "JADHAGAM_D1_NUDGE",
            Notification.status == "queued",
            Notification.send_at <= now_utc,
        )
        .order_by(Notification.send_at.asc())
        .limit(200)
    ).scalars().all()

    dispatched = skipped = errors = 0
    for notification in due_rows:
        user = session.get(User, notification.user_id)
        if user is None:
            notification.status = "failed"
            notification.suppression_reason = "user_not_found"
            skipped += 1
            session.commit()
            continue

        try:
            result = dispatch_queued_notification(
                session,
                notification,
                user_email=user.email,
                title_ta=_payload_text(notification, "title", "ta"),
                title_en=_payload_text(notification, "title", "en"),
                body_ta=_payload_text(notification, "body", "ta"),
                body_en=_payload_text(notification, "body", "en"),
            )
            if result == "failed":
                errors += 1
            else:
                dispatched += 1
            session.commit()
        except Exception as exc:
            logger.error("queued_notification_error notification=%s exc=%s", notification.notification_id, exc)
            session.rollback()
            errors += 1

    return {"dispatched": dispatched, "skipped": skipped, "errors": errors}

# ---------------------------------------------------------------------------
# Cron entry point
# ---------------------------------------------------------------------------

def run_daily_push_cron(run_at_utc: datetime | None = None) -> dict[str, int]:
    """
    Main cron entry point.  Called by APScheduler at 06:00 UTC daily.

    Returns a summary dict: {dispatched: N, skipped: N, errors: N}.
    """
    now_utc = run_at_utc or datetime.now(tz=UTC)
    run_date = now_utc.date()
    dispatched = skipped = errors = 0

    with SessionLocal() as session:
        queued_results = _process_due_queued_notifications(session, now_utc)
        dispatched += queued_results['dispatched']
        skipped += queued_results['skipped']
        errors += queued_results['errors']

        # Fetch all users with at least one alert opt-in. The notification_channel
        # is intentionally NOT filtered here: the in-app inbox is decoupled from
        # push/email delivery (dispatch_notification persists an in-app row even
        # when channel == "none"), so a user who enables an alert toggle but
        # leaves the channel as "none" still gets a populated bell.
        prefs = session.execute(
            select(UserNotificationPreference).where(
                or_(
                    UserNotificationPreference.morning_alert_enabled.is_(True),
                    UserNotificationPreference.dasha_alert_enabled.is_(True),
                    UserNotificationPreference.pirantha_naal_alert_enabled.is_(True),
                )
            )
        ).scalars().all()

        for pref in prefs:
            if not (pref.morning_alert_enabled or pref.dasha_alert_enabled or pref.pirantha_naal_alert_enabled):
                skipped += 1
                continue

            user = session.get(User, pref.owner_user_id)
            if user is None:
                skipped += 1
                continue

            try:
                results = _dispatch_for_user(session, user, pref, run_date, now_utc)
                dispatched += len(results)
                if not results:
                    skipped += 1
            except Exception as exc:
                logger.error("push_cron_user_error user=%s exc=%s", pref.owner_user_id, exc)
                errors += 1

    logger.info("daily_push_cron run_date=%s dispatched=%d skipped=%d errors=%d", run_date, dispatched, skipped, errors)
    return {"dispatched": dispatched, "skipped": skipped, "errors": errors}
