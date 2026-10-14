"""Response model for GET /charts/{id}/shadbala (A14).

Describes the dict `shadbala_service.build_shadbala_response` already returns;
see `app/schemas/secondary_dashas.py` for why these models must stay lossless.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ShadbalaPlanet(BaseModel):
    graha: str
    sthana: float
    dig: float
    kala: float
    chesta: float
    naisargika: float
    drik: float
    total_virupa: float = Field(alias="totalVirupa")
    rupas: float
    required_rupas: float = Field(alias="requiredRupas")
    strength_ratio: float = Field(alias="strengthRatio")
    is_strong: bool = Field(alias="isStrong")
    sthana_components: dict[str, float] = Field(alias="sthanaComponents")
    kala_components: dict[str, float] = Field(alias="kalaComponents")

    model_config = ConfigDict(populate_by_name=True)


class ShadbalaData(BaseModel):
    chart_id: str = Field(alias="chartId")
    experimental: bool
    note: str
    birth_time_known: bool = Field(alias="birthTimeKnown")
    planets: list[ShadbalaPlanet]
    strongest_first: list[str] = Field(alias="strongestFirst")

    model_config = ConfigDict(populate_by_name=True)


class ShadbalaResponse(BaseModel):
    success: bool
    data: ShadbalaData
