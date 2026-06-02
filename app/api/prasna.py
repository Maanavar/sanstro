from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.calculations.prasna import cast_prasna_chart
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.prasna import PrasnaRequest, PrasnaResponse

router = APIRouter()


@router.post("/prasna", response_model=PrasnaResponse, tags=["prasna"])
def ask_prasna(
    payload: PrasnaRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PrasnaResponse:
    _ = session, current_user
    question_dt = payload.question_datetime_local or datetime.now()
    chart = cast_prasna_chart(
        question_datetime_local=question_dt,
        timezone_name=payload.timezone_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        question_area=payload.question_area,
    )
    if chart["outlook"] == "UNFAVOURABLE":
        caution_ta = "இந்த கேள்வியில் அவசரம் வேண்டாம்; அனுபவமுள்ள ஆலோசகரின் வழிகாட்டுதல் பெறுங்கள்."
        caution_en = "Avoid rushing this matter; seek guidance from an experienced advisor."
    elif chart["outlook"] == "DELAY":
        caution_ta = "பலன் வர தாமதம் உண்டு; பொறுமையுடன் முன்னேறுங்கள்."
        caution_en = "Results may come with delay; proceed patiently."
    else:
        caution_ta = ""
        caution_en = ""
    return PrasnaResponse(
        prasnaLagnaRasi=chart["prasna_lagna_rasi"],
        prasnaLagnaName=chart["prasna_lagna_name"],
        moonRasi=chart["moon_rasi"],
        moonNakshatraName=chart["moon_nakshatra_name"],
        questionArea=chart["question_area"],
        karaka=chart["karaka"],
        karakaHouse=chart["karaka_house"],
        outlook=chart["outlook"],
        outlookTa=chart["outlook_ta"],
        outlookEn=chart["outlook_en"],
        positiveIndicators=chart["positive_indicators"],
        negativeIndicators=chart["negative_indicators"],
        cautionTa=caution_ta,
        cautionEn=caution_en,
    )
