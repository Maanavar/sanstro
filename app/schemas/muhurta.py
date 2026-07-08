from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


class BiText(BaseModel):
    ta: str
    en: str


class MuhurtaQuery(BaseModel):
    chart_id: UUID
    activity: str = Field(
        description="JOB_START | MARRIAGE | EXAM | TRAVEL | INVESTMENT | MEDICAL | PURCHASE | SPIRITUAL"
    )
    date_from: date
    date_to: date = Field(description="Max 60 days from date_from")

    model_config = {"populate_by_name": True}


class MuhurtaSlot(BaseModel):
    date: date
    tamil_date: BiText | None = Field(alias="tamilDate", default=None)
    time_start: str = Field(alias="timeStart")
    time_end: str = Field(alias="timeEnd")
    score: float
    panchangam_support: BiText = Field(alias="panchangamSupport")
    dasha_support: BiText = Field(alias="dashaSupport")
    hora_support: BiText | None = Field(alias="horaSupport", default=None)
    cautions: list[BiText]

    model_config = {"populate_by_name": True}


class MuhurtaResponseData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    activity: str
    date_from: date = Field(alias="dateFrom")
    date_to: date = Field(alias="dateTo")
    timezone: str = Field(description="IANA timezone the slot times are computed and expressed in")
    slots: list[MuhurtaSlot]

    model_config = {"populate_by_name": True}


class ResponseMeta(BaseModel):
    calculation_version: str = Field(alias="calculationVersion", default="1.0")
    generated_at: str = Field(alias="generatedAt", default="")

    model_config = {"populate_by_name": True}


class MuhurtaResponse(BaseModel):
    success: bool = True
    data: MuhurtaResponseData
    meta: ResponseMeta
