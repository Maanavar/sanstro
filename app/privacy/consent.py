"""Consent per purpose (spec L2, D-10): the ledger's one writer and one reader.

Purposes:
- service (P1): required. Granted at signup or on the consent panel; withdrawing
  it is erasing the account (`DELETE /auth/me`), so no toggle writes it false.
- updates (P2): astro alerts and nudges, every type the notification outbox
  sends (`notification_dispatch_service`). Off until granted.
- analytics (P3): the web and mobile clients identify the account to PostHog
  only while this is granted. Off until granted.
- ask_improve (P4): Ask Vinaadi answers may be reviewed to improve it. Off
  until granted; nothing reviews answers yet (L7).

`consent_records` is append-only; the current answer is the latest row per
purpose, and a purpose with no row reads as not granted.
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.error_codes import ErrorCode
from app.core.errors import AppError
from app.core.privacy_policy import CURRENT_POLICY_VERSION
from app.models import ConsentRecord, User

Purpose = Literal["service", "updates", "analytics", "ask_improve"]
Channel = Literal["web", "android", "ios"]
Language = Literal["ta", "en"]

PURPOSES: tuple[Purpose, ...] = ("service", "updates", "analytics", "ask_improve")
OPTIONAL_PURPOSES: tuple[Purpose, ...] = ("updates", "analytics", "ask_improve")


#: Sent by the mobile app (`mobile/src/api/client.ts`); absent means the web.
CLIENT_HEADER = "X-Vinaadi-Client"


def consent_channel(request: Any) -> Channel:
    """Where an answer was given, for the ledger. Anything unrecognised reads as web."""
    value = (request.headers.get(CLIENT_HEADER) or "").strip().lower()
    if value == "android":
        return "android"
    if value == "ios":
        return "ios"
    return "web"


def current_consents(session: Session, user_id: UUID) -> dict[Purpose, bool]:
    """The latest answer per purpose; False where there is none."""
    rows = session.execute(
        select(ConsentRecord.purpose, ConsentRecord.granted)
        .where(ConsentRecord.user_id == user_id)
        .distinct(ConsentRecord.purpose)
        .order_by(ConsentRecord.purpose, ConsentRecord.created_at.desc(), ConsentRecord.id.desc())
    ).all()
    latest = {purpose: granted for purpose, granted in rows}
    return {purpose: bool(latest.get(purpose, False)) for purpose in PURPOSES}


def has_consent(session: Session, user_id: UUID, purpose: Purpose) -> bool:
    granted = session.execute(
        select(ConsentRecord.granted)
        .where(ConsentRecord.user_id == user_id, ConsentRecord.purpose == purpose)
        .order_by(ConsentRecord.created_at.desc(), ConsentRecord.id.desc())
        .limit(1)
    ).scalar_one_or_none()
    return bool(granted)


def require_service_consent(session: Session, user_id: UUID) -> None:
    """Refuse to store birth details for an account that never consented (L2 acceptance).

    Any service grant counts, including one given to an older policy version:
    that account is asked again by the panel, but is not locked out of adding
    to data it already holds (app/api/auth.py::record_consent).
    """
    if not has_consent(session, user_id, "service"):
        raise AppError(ErrorCode.CONSENT_REQUIRED)


def record_consents(
    session: Session,
    user: User,
    answers: dict[Purpose, bool],
    *,
    language: Language,
    channel: Channel,
    ip: str | None,
    adult_declared: bool = False,
) -> None:
    """Append one row per answer, against the policy version live now.

    A service grant also stamps `users.consent_*`, which `consent_required_for`
    reads. The version is always the server's, never one a client names: a
    client running older code must not record consent to text it never showed.
    """
    if answers.get("service") is False:
        raise ValueError("service consent is withdrawn by erasing the account, not recorded as false")
    now = datetime.now(UTC)
    for purpose in PURPOSES:
        if purpose not in answers:
            continue
        session.add(
            ConsentRecord(
                user_id=user.user_id,
                purpose=purpose,
                granted=answers[purpose],
                notice_version=CURRENT_POLICY_VERSION,
                language=language,
                channel=channel,
                ip=ip,
                created_at=now,
            )
        )
    if answers.get("service"):
        user.consent_given_at = now
        user.consent_policy_version = CURRENT_POLICY_VERSION
    if adult_declared and user.adult_declared_at is None:
        user.adult_declared_at = now
    session.flush()


def forget_consents(session: Session, user: User) -> None:
    """Drop every answer on the account (ARC-17: an unproven registrant gave them).

    Deleting is the one change the ledger's guard allows. The proven owner is
    then asked afresh, and cannot add birth details until they answer.
    """
    session.execute(delete(ConsentRecord).where(ConsentRecord.user_id == user.user_id))
    user.consent_given_at = None
    user.consent_policy_version = None
    user.adult_declared_at = None
