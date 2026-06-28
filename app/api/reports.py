from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.subscription import is_premium
from app.core.tier_limits import (
    PPU_PORUTHAM_IDS,
    PPU_REPORT_IDS,
    PPU_TOPUP_IDS,
    get_limits,
)
from app.db.session import get_db
from app.models.user import User

router = APIRouter()

_ALL_PPU_IDS: frozenset[str] = frozenset(
    list(PPU_REPORT_IDS.values())
    + list(PPU_PORUTHAM_IDS.values())
    + list(PPU_TOPUP_IDS.values())
)


class PurchaseRequest(BaseModel):
    product_id: str
    chart_id: str | None = None


class PurchaseResponse(BaseModel):
    status: str
    reference_id: str
    product_id: str


@router.post("/reports/purchase", response_model=PurchaseResponse, tags=["reports"])
def purchase_report(
    body: PurchaseRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PurchaseResponse:
    """Queue a pay-per-use report purchase.

    Payment processing is not yet live; this endpoint validates the request,
    records purchase intent, and returns a reference_id for tracking.
    """
    tier = "premium" if is_premium(current_user.user_id, session) else "registered"
    limits = get_limits(tier)
    if not limits.pay_per_use_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pay-per-use purchases are not available on your plan.",
        )
    if body.product_id not in _ALL_PPU_IDS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown product_id '{body.product_id}'.",
        )
    return PurchaseResponse(
        status="queued",
        reference_id=str(uuid.uuid4()),
        product_id=body.product_id,
    )
