"""Reports — making one, listing them, downloading one.

What was here before: `POST /reports/purchase`, which validated a product id,
generated a UUID, returned `{"status": "queued"}` and stored nothing. It was
honest about itself ("Payment processing is not yet live") and the web button
said "Join waitlist" — but payments *are* live now, and a waitlist endpoint
beside a working checkout is a second, fake way to buy. It is gone. Buying is
`POST /payments/checkout/order` with the real SKU; spending what that bought is
`POST /reports` here.
"""
from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_csrf_header
from app.db.session import get_db
from app.models.user import User
from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS
from app.services import report_delivery_service
from app.services.pdf_export_service import _safe_filename_fragment

router = APIRouter()


class _Camel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ReportOut(_Camel):
    id: UUID
    kind: str
    lang: str
    #: "included" spent a month's Premium inclusion; "credit" spent a bought one.
    source: str
    chart_id: UUID | None = Field(alias="chartId")
    partner_chart_id: UUID | None = Field(alias="partnerChartId")
    as_of_date: date | None = Field(alias="asOfDate")
    title: str
    byte_size: int = Field(alias="byteSize")
    sha256: str
    created_at: datetime = Field(alias="createdAt")
    download_count: int = Field(alias="downloadCount")
    last_downloaded_at: datetime | None = Field(alias="lastDownloadedAt")


class KindAllowanceOut(_Camel):
    kind: str
    included_monthly: int = Field(alias="includedMonthly")
    included_used: int = Field(alias="includedUsed")
    included_remaining: int = Field(alias="includedRemaining")
    credits: int
    can_create: bool = Field(alias="canCreate")


class AllowanceOut(_Camel):
    kinds: list[KindAllowanceOut]


class CreateReportRequest(_Camel):
    kind: str
    chart_id: UUID = Field(alias="chartId")
    #: Porutham only: the second chart. Both must be the caller's.
    partner_chart_id: UUID | None = Field(default=None, alias="partnerChartId")
    lang: str = "en"
    #: Porutham only. Defaults to MARRIAGE, which is what the report is for.
    compatibility_context: str = Field(default="MARRIAGE", alias="compatibilityContext")


class CreateReportResponse(_Camel):
    report: ReportOut
    #: What paid for it, so the client can say "1 of 1 included used" rather
    #: than guessing from a balance it fetched before the call.
    allowance: KindAllowanceOut


def _report_out(row) -> ReportOut:
    return ReportOut(
        id=row.id,
        kind=row.kind,
        lang=row.lang,
        source=row.source,
        chart_id=row.chart_id,
        partner_chart_id=row.partner_chart_id,
        as_of_date=row.as_of_date.date() if row.as_of_date is not None else None,
        title=row.title,
        byte_size=row.byte_size,
        sha256=row.sha256,
        created_at=row.created_at,
        download_count=row.download_count or 0,
        last_downloaded_at=row.last_downloaded_at,
    )


def _allowance_out(allowance) -> KindAllowanceOut:
    return KindAllowanceOut(
        kind=allowance.kind,
        included_monthly=allowance.included_monthly,
        included_used=allowance.included_used,
        included_remaining=allowance.included_remaining,
        credits=allowance.credits,
        can_create=allowance.can_create,
    )


@router.get(
    "/reports/allowance",
    response_model=AllowanceOut,
    tags=["reports"],
    summary="What this account can make now: included this month, plus bought credits",
)
def get_allowance(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AllowanceOut:
    return AllowanceOut(
        kinds=[
            _allowance_out(a)
            for a in report_delivery_service.allowance_for(session, current_user.user_id)
        ]
    )


@router.get(
    "/reports",
    response_model=list[ReportOut],
    tags=["reports"],
    summary="Reports this account has had delivered",
)
def list_reports(
    limit: int = Query(default=50, ge=1, le=200),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ReportOut]:
    return [
        _report_out(row)
        for row in report_delivery_service.list_reports(
            session, current_user.user_id, limit=limit
        )
    ]


@router.post(
    "/reports",
    response_model=CreateReportResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["reports"],
    summary="Spend an included report or a report credit on a document",
    # State-changing cookie-authenticated POST — the same CSRF gate the rest of
    # the mutating surface uses (DASH-07).
    dependencies=[Depends(require_csrf_header)],
)
def create_report(
    body: CreateReportRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CreateReportResponse:
    """402 when there is neither an inclusion left nor a credit to spend.

    Not 403: nothing is wrong with the account or the request, there is simply
    nothing left to pay with, and the client's job is to offer the purchase.
    """
    context = (
        body.compatibility_context
        if body.compatibility_context in VALID_COMPATIBILITY_CONTEXTS
        else "MARRIAGE"
    )
    delivered = report_delivery_service.deliver_report(
        session,
        current_user,
        kind=body.kind,
        chart_id=body.chart_id,
        partner_chart_id=body.partner_chart_id,
        lang="ta" if body.lang == "ta" else "en",
        compatibility_context=context,
    )
    return CreateReportResponse(
        report=_report_out(delivered.report),
        allowance=_allowance_out(delivered.allowance),
    )


@router.get(
    "/reports/{report_id}/download",
    tags=["reports"],
    response_class=Response,
    summary="Download a delivered report, as many times as you like",
)
def download_report(
    report_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """The stored bytes, unchanged. A report is not re-rendered on download:
    what the person bought is what they get back, every time."""
    report = report_delivery_service.load_for_download(
        session, current_user.user_id, report_id
    )
    name = _safe_filename_fragment(report.title, f"{report.kind}-report")
    return Response(
        content=report.pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{name}.pdf"',
            # A stored document never changes, so it is safe to cache privately;
            # it must not be cached by a shared proxy — it is someone's chart.
            "Cache-Control": "private, max-age=86400",
            "ETag": f'"{report.sha256}"',
        },
    )
