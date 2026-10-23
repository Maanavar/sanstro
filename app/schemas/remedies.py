"""Response model for GET /charts/{id}/remedy-plan (A14).

Each item is `app.calculations.remedies.get_remedy`'s payload — the
`PlanetRemedy` catalogue row plus the policy fields it layers on — with the
route's `priority`. Keys stay snake_case because that is what the calculation
layer emits and what web/mobile already parse. See
`app/schemas/secondary_dashas.py` for why this must stay lossless.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class RemedyDisclaimer(BaseModel):
    fasting_caution_ta: str
    fasting_caution_en: str
    guarantee_note_ta: str
    guarantee_note_en: str


class RemedyPlanItem(BaseModel):
    # PlanetRemedy catalogue fields
    planet: str
    day: str
    temple_ta: str
    temple_en: str
    mantra_seed: str
    mantra_full_ta: str
    japa_count: int
    daanam_items_ta: str
    daanam_items_en: str
    gemstone_ta: str | None
    gemstone_en: str | None
    metal: str
    finger: str
    fasting_rule_ta: str
    fasting_rule_en: str
    behavioural_ta: str
    behavioural_en: str
    seva_ta: str
    seva_en: str
    # Policy fields added by get_remedy
    functional_nature: str
    severity: str
    is_gemstone_prescribed: bool
    gemstone_note_ta: str
    gemstone_note_en: str
    reason_ta: str
    reason_en: str
    caution_ta: str | None
    caution_en: str | None
    fasting_caution_ta: str
    fasting_caution_en: str
    guarantee_note_ta: str
    guarantee_note_en: str
    # Added by the route
    priority: int


class RemedyPlanData(BaseModel):
    chart_id: str = Field(alias="chartId")
    current_maha_lord: str = Field(alias="currentMahaLord")
    weakest_planets: list[str] = Field(alias="weakestPlanets")
    active_dosham_planet: str | None = Field(alias="activeDoshamPlanet")
    items: list[RemedyPlanItem]
    disclaimer: RemedyDisclaimer

    model_config = ConfigDict(populate_by_name=True)


class RemedyPlanResponse(BaseModel):
    success: bool
    data: RemedyPlanData
