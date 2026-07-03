from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.chart_strength import SIGN_LORD


@dataclass(frozen=True, slots=True)
class BiText:
    ta: str
    en: str


@dataclass(frozen=True, slots=True)
class AstroFactor:
    key: str
    status: str
    detail: BiText


@dataclass(frozen=True, slots=True)
class LifeAreaPrediction:
    life_area: str
    main_prediction_ta: str
    main_prediction_en: str
    astrological_factors: list[AstroFactor]
    dasha_support: str
    transit_support: str
    timing_window_start: date | None
    timing_window_end: date | None
    confidence: str
    challenges: list[BiText]
    supports: list[BiText]
    # Ordinal reasoning band (STRONG/LIKELY/MIXED/WEAK/BLOCKED/SILENT).
    # Additive — populated only when the reasoning_gate flag is on (Phase 1).
    band: str | None = None


def house_lord_for_lagna(lagna_rasi: int, house: int) -> str:
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    return SIGN_LORD[house_rasi]
