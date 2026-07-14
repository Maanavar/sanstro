"""Composite dashboard bundle (DASH-04).

One response carrying everything the dashboard's per-chart surface needs for a
given date. The web dashboard previously issued ~13 parallel requests per chart
per date (and the family view repeated that per member); this schema is the
single-round-trip replacement. Every section is nullable: a section that fails
to compute is returned as ``null`` with a short note under ``errors`` instead
of failing the whole bundle (pairs with DASH-02's fail-soft requirement).

The individual endpoints remain in place for mobile until it migrates.
"""
from __future__ import annotations

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.chart_explanation import ChartExplanationData
from app.schemas.charts import ChartCalculateResponseData, ChartSummaryData
from app.schemas.daily_guidance import (
    DailyGuidanceData,
    DailyGuidanceRangeData,
    WeekAheadData,
)
from app.schemas.dasha import DashaTimelineResponseData, ResponseMeta
from app.schemas.life_areas import LifeAreasResponseData
from app.schemas.panchangam import PanchangamDailyResponseData, PanchangamTimingsData
from app.schemas.peyarchi import PeyarchiEvent
from app.schemas.transits import SaniCycleData, TransitSnapshotData
from app.services.nakshatra_content import NakshatraCard


class ChartDashboardBundleData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    date_local: date = Field(alias="dateLocal")
    chart: ChartCalculateResponseData | None = None
    summary: ChartSummaryData | None = None
    daily_guidance: DailyGuidanceData | None = Field(default=None, alias="dailyGuidance")
    # 3-day window starting at date_local (today..+2) — feeds the evening preview.
    daily_guidance_range: DailyGuidanceRangeData | None = Field(default=None, alias="dailyGuidanceRange")
    # Combined maha+antar+pratyantar timeline; rows carry their `level` tag.
    dasha: DashaTimelineResponseData | None = None
    transit: TransitSnapshotData | None = None
    sani: SaniCycleData | None = None
    peyarchi_upcoming: list[PeyarchiEvent] | None = Field(default=None, alias="peyarchiUpcoming")
    explanation: ChartExplanationData | None = None
    panchangam: PanchangamDailyResponseData | None = None
    panchangam_timings: PanchangamTimingsData | None = Field(default=None, alias="panchangamTimings")
    life_areas: LifeAreasResponseData | None = Field(default=None, alias="lifeAreas")
    week_ahead: WeekAheadData | None = Field(default=None, alias="weekAhead")
    nakshatra_card: NakshatraCard | None = Field(default=None, alias="nakshatraCard")
    # Which saved location the panchangam was computed for (current wins over
    # birth), and its IANA timezone — the Today tab computes "now" in this zone
    # so horai/NOW-marker/countdowns stay location-true for diaspora (DASH-01).
    panchangam_location: Literal["current", "birth"] | None = Field(default=None, alias="panchangamLocation")
    panchangam_timezone: str | None = Field(default=None, alias="panchangamTimezone")
    # Section name -> short failure note for any section that came back null
    # because its computation raised. Purely diagnostic.
    errors: dict[str, str] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True)


class ChartDashboardBundleResponse(BaseModel):
    success: bool = True
    data: ChartDashboardBundleData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)
