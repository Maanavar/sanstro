"""Spending a report inclusion or a report credit on a document, and keeping it.

This is the half of the payment rail that was missing. `products` has carried
`jadhagam_report` and `porutham_report` since the payments build, each granting
one credit in `credit_ledger` — and nothing anywhere could spend one. ARC-14
seeded both SKUs inactive for exactly that reason: "a report SKU goes active
when its deliverable ships and has a test buying it end to end."

Order of payment, which is the same order Ask Vinaadi uses: **the included
allowance first, then a bought credit.** Premium includes one jadhagam and one
porutham report a month (ARC-06). Those were advertised on the pricing page, the
upgrade page and the reports page and enforced nowhere, so a Premium account had
either an unlimited number of them or none, depending on whether anything
checked — nothing did. They are counted here, per account, per kind, per quota
month in the accounting timezone.

**One transaction, so nobody pays for a document they did not get.** The credit
spend is flushed, never committed, before the PDF is rendered; `get_db` commits
the request or rolls the whole thing back. Nothing in the render path commits,
so a failed render leaves no spend, no inclusion consumed and no row. The
credit's ledger key is still stored on the report, because that is what a
support refund has to find later.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import UTC, date, datetime
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.core.chart_access import assert_chart_owner
from app.core.clock import SYSTEM_CLOCK, Clock, accounting_date, accounting_month_start_utc
from app.core.subscription import limits_for_user
from app.models.report import REPORT_KINDS, Report
from app.models.user import User
from app.services.payment_service import credit_balance, spend_credit
from app.services.report_pdf_service import (
    compose_jadhagam_report_pdf,
    compose_porutham_report_pdf,
)

#: Report kind → the `credit_ledger` key a purchase of it grants, and the
#: `TierLimits` field that says how many a plan includes each month. Both ends
#: named in one place: a kind with no credit key could be bought and never
#: delivered, and a kind with no inclusion field would silently include none.
_KIND_CREDIT_KEY: dict[str, str] = {
    "jadhagam": "jadhagam_report",
    "porutham": "porutham_report",
}
_KIND_INCLUSION_FIELD: dict[str, str] = {
    "jadhagam": "detailed_reports_monthly_included",
    "porutham": "porutham_reports_monthly_included",
}

# The three tables above must name the same kinds. A kind missing from
# `_KIND_CREDIT_KEY` could be bought and never delivered; one missing from
# `_KIND_INCLUSION_FIELD` would silently include none. Pinned by
# tests/test_report_delivery.py rather than an `assert` the linter bans.


@dataclass(frozen=True)
class KindAllowance:
    kind: str
    included_monthly: int
    included_used: int
    credits: int

    @property
    def included_remaining(self) -> int:
        return max(0, self.included_monthly - self.included_used)

    @property
    def can_create(self) -> bool:
        return self.included_remaining > 0 or self.credits > 0


def _included_used(
    session: Session, user_id: UUID, kind: str, *, clock: Clock = SYSTEM_CLOCK
) -> int:
    """Inclusions already spent this quota month, for this kind.

    Counted from the `reports` rows rather than from a usage counter: the rows
    are the inclusions. A counter would be a second answer that can disagree
    with the list the person is looking at.
    """
    return int(
        session.execute(
            select(func.count())
            .select_from(Report)
            .where(
                Report.user_id == user_id,
                Report.kind == kind,
                Report.source == "included",
                Report.created_at >= accounting_month_start_utc(clock=clock),
            )
        ).scalar_one()
    )


def allowance_for(
    session: Session, user_id: UUID, *, clock: Clock = SYSTEM_CLOCK
) -> list[KindAllowance]:
    """What this account can make right now, per kind. Read-only."""
    limits = limits_for_user(user_id, session)
    return [
        KindAllowance(
            kind=kind,
            included_monthly=int(getattr(limits, _KIND_INCLUSION_FIELD[kind])),
            included_used=_included_used(session, user_id, kind, clock=clock),
            credits=max(0, credit_balance(session, user_id, _KIND_CREDIT_KEY[kind])),
        )
        for kind in REPORT_KINDS
    ]


def _lock(session: Session, user_id: UUID, kind: str) -> None:
    """Serialise this account's deliveries of this kind for the transaction.

    Two requests arriving together would both read "0 of 1 inclusions used" and
    both deliver one, which is the same race the Ask allowance had and fixed.
    A transaction-scoped advisory lock keyed on (user, kind) is enough: the
    second request waits for the first to commit and then counts 1.

    `hashtext` would do, but its result is an implementation detail of the
    server's hashing; a sha256 of the key, truncated, is stable across
    versions and across a dump and restore.
    """
    digest = hashlib.sha256(f"report:{user_id}:{kind}".encode()).digest()
    # Signed 64-bit, which is what pg_advisory_xact_lock(bigint) takes.
    key = int.from_bytes(digest[:8], "big", signed=True)
    session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": key})


@dataclass(frozen=True)
class Delivered:
    report: Report
    source: str
    allowance: KindAllowance


def deliver_report(
    session: Session,
    user: User,
    *,
    kind: str,
    chart_id: UUID,
    partner_chart_id: UUID | None = None,
    lang: str = "en",
    as_of: date | None = None,
    compatibility_context: str = "MARRIAGE",
    clock: Clock = SYSTEM_CLOCK,
) -> Delivered:
    """Render one report, paying for it with an inclusion or a credit.

    Raises 404 for a chart the user does not own (before anything is spent, so
    a wrong id never costs a credit), 422 for a malformed request and 402 when
    there is nothing left to pay with.
    """
    if kind not in REPORT_KINDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Unknown report kind '{kind}'.",
        )

    # Authorisation first, always: a 404 for someone else's chart must not be
    # reachable only after a credit has been taken.
    _chart, profile = assert_chart_owner(session, chart_id, user)
    partner_profile = None
    if kind == "porutham":
        if partner_chart_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="A porutham report needs a second chart.",
            )
        if partner_chart_id == chart_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="A porutham report needs two different charts.",
            )
        _partner_chart, partner_profile = assert_chart_owner(session, partner_chart_id, user)
    elif partner_chart_id is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A jadhagam report takes one chart.",
        )

    _lock(session, user.user_id, kind)

    limits = limits_for_user(user.user_id, session)
    included_monthly = int(getattr(limits, _KIND_INCLUSION_FIELD[kind]))
    included_used = _included_used(session, user.user_id, kind, clock=clock)
    credit_key = _KIND_CREDIT_KEY[kind]
    credits = credit_balance(session, user.user_id, credit_key)

    source: str
    credit_spend_key: str | None = None
    if included_used < included_monthly:
        source = "included"
    elif credits > 0:
        source = "credit"
        credit_spend_key = spend_credit(
            session,
            user_id=user.user_id,
            credit_key=credit_key,
            source_id=f"report:{uuid4()}",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "NO_REPORT_CREDIT",
                "kind": kind,
                "includedMonthly": included_monthly,
                "includedUsed": included_used,
                "credits": credits,
            },
        )

    report_date = as_of or accounting_date(clock=clock)
    if kind == "jadhagam":
        pdf, title = compose_jadhagam_report_pdf(
            session, chart_id, profile, as_of=report_date, lang=lang
        )
    else:
        pdf, title = compose_porutham_report_pdf(
            session,
            user.user_id,
            chart_id,
            partner_chart_id,  # type: ignore[arg-type]  # not None: checked above
            lang=lang,
            compatibility_context=compatibility_context,
            as_of=report_date,
        )

    if not pdf:
        # Never seen, but an empty document is worse than an error: it would be
        # a paid row with nothing in it, and the check constraint would reject
        # it from the database with a 500 the caller cannot read.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The report could not be written.",
        )

    report = Report(
        id=uuid4(),
        user_id=user.user_id,
        kind=kind,
        lang="ta" if lang == "ta" else "en",
        source=source,
        credit_spend_key=credit_spend_key,
        chart_id=chart_id,
        partner_chart_id=partner_chart_id,
        as_of_date=datetime.combine(report_date, datetime.min.time(), tzinfo=UTC),
        title=title[:200],
        calculation_version=_calculation_version(session, chart_id),
        pdf=pdf,
        byte_size=len(pdf),
        sha256=hashlib.sha256(pdf).hexdigest(),
    )
    session.add(report)
    session.flush()

    allowance = KindAllowance(
        kind=kind,
        included_monthly=included_monthly,
        included_used=included_used + (1 if source == "included" else 0),
        credits=max(0, credits - (1 if source == "credit" else 0)),
    )
    return Delivered(report=report, source=source, allowance=allowance)


def _calculation_version(session: Session, chart_id: UUID) -> str:
    from app.models.chart import Chart

    chart = session.get(Chart, chart_id)
    return (getattr(chart, "calculation_version", None) or "unknown")[:64]


def list_reports(session: Session, user_id: UUID, *, limit: int = 100) -> list[Report]:
    """The person's reports, newest first. The bytes are not loaded here — the
    list is a list, and a page of ten reports is not ten megabytes of PDF."""
    rows = session.execute(
        select(
            Report.id,
            Report.kind,
            Report.lang,
            Report.source,
            Report.chart_id,
            Report.partner_chart_id,
            Report.as_of_date,
            Report.title,
            Report.byte_size,
            Report.sha256,
            Report.created_at,
            Report.download_count,
            Report.last_downloaded_at,
        )
        .where(Report.user_id == user_id)
        .order_by(Report.created_at.desc())
        .limit(limit)
    ).all()
    return rows  # type: ignore[return-value]  # row tuples, shaped by the caller


def load_for_download(session: Session, user_id: UUID, report_id: UUID) -> Report:
    """The report with its bytes, or 404. Stamps the download.

    404 rather than 403 for someone else's report, for the same reason
    `chart_access` answers 404: a 403 tells a stranger the id exists.
    """
    report = session.get(Report, report_id)
    if report is None or report.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    report.download_count = (report.download_count or 0) + 1
    report.last_downloaded_at = datetime.now(UTC)
    return report
