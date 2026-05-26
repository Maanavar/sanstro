from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.whatif import WhatIfRequest, WhatIfResponse
from app.services.whatif_service import evaluate_whatif

router = APIRouter()


@router.post("/whatif", response_model=WhatIfResponse, tags=["whatif"])
def what_if_simulator(
    payload: WhatIfRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WhatIfResponse:
    return evaluate_whatif(
        session,
        owner_user_id=current_user.user_id,
        chart_id=payload.chart_id,
        scenario=payload.scenario,
        target_date=payload.target_date,
    )
