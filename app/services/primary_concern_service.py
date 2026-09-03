"""Primary-concern synthesizer.

A veteran Thirukkanitham reader opens a consultation by naming the client's
actual unspoken question — "you came about children" — derived from
age x gender x the house the current dasha activates x Saturn-transit stress.
Vinaadi computes all four ingredients separately; this module is the fusion
step that turns them into one ranked, explainable statement instead of a flat
list of "relevant" life areas.

Deterministic and rule-based (no ML/LLM) — every score traces back to a
computed astrological fact, and every rationale sentence cites that fact.
Confidence is a soft high/medium/low band, never a percentage claim, and the
wording never uses longevity/death framing or "denial" language for
marriage-timing (see app/calculations/_yoga_dosham.py's Marana Karaka Sthana
caveats for the established house style on this).
"""
from __future__ import annotations

from dataclasses import dataclass

from app.calculations.dasha_house_mapping import get_dasha_activated_houses
from app.calculations.transits import CycleAssessment
from app.services.age_phase_service import get_active_life_phases

# Classical significator house(s) for each focus-code the age engine emits.
# Keyed by the same vocabulary as get_active_life_phases() / the frontend's
# FOCUS_AREA_LABELS map, so this plugs straight into that list.
_CONCERN_HOUSES: dict[str, tuple[int, ...]] = {
    "health": (1, 6, 8),
    "health_priority": (1, 6, 8),
    "health_senior": (1, 6, 8),
    "family_nurture": (4,),
    "education": (4, 5),
    "family": (2, 4),
    "character_formation": (1,),
    "career_preparation": (10,),
    "career": (10, 6),
    "marriage": (7,),
    "wealth_foundation": (2, 11),
    "career_peak": (10,),
    "wealth": (2, 11),
    "property": (4,),
    "children": (5,),
    "spirituality": (9, 12),
    "family_legacy": (4, 9),
    "wealth_transfer": (2, 8),
    "retirement_stability": (2, 11),
    "family_support": (4,),
    "ancestral_duty": (9, 12),
}

_HEALTH_CONCERNS = {"health", "health_priority", "health_senior"}

_CONFIDENCE_HIGH = "high"
_CONFIDENCE_MEDIUM = "medium"
_CONFIDENCE_LOW = "low"


@dataclass(frozen=True)
class ConcernCandidate:
    concern: str
    confidence: str
    rationale_en: str
    rationale_ta: str


def infer_primary_concerns(
    *,
    current_age: int,
    gender: str | None,
    mahadasha_lord: str,
    antardasha_lord: str,
    lagna_rasi: int,
    sani_cycle: CycleAssessment | None,
    children: str | None = None,
    top_n: int = 3,
) -> list[ConcernCandidate]:
    # `children` reaches this function because `children` is a scored candidate
    # here (_CONCERN_HOUSES maps it to the 5th) — without it a childless reader
    # whose antardasha activates the 5th gets progeny ranked as their TOP
    # concern. The gate lives in get_active_life_phases; this only forwards it.
    candidates = get_active_life_phases(current_age, gender, children)
    if not candidates:
        return []

    activated_houses_maha = set(get_dasha_activated_houses(mahadasha_lord, lagna_rasi))
    activated_houses_antar = set(get_dasha_activated_houses(antardasha_lord, lagna_rasi))
    sani_active = bool(sani_cycle and sani_cycle.is_active)

    scored: list[tuple[float, str, list[str]]] = []
    for index, concern in enumerate(candidates):
        houses = _CONCERN_HOUSES.get(concern, ())
        signals: list[str] = []

        score = float(len(candidates) - index)

        if houses and (set(houses) & activated_houses_antar):
            score += 3.0
            signals.append("antardasha")
        if houses and (set(houses) & activated_houses_maha):
            score += 1.5
            signals.append("mahadasha")
        if sani_active and concern in _HEALTH_CONCERNS:
            score += 2.0
            signals.append("sani")

        scored.append((score, concern, signals))

    scored.sort(key=lambda item: item[0], reverse=True)

    results: list[ConcernCandidate] = []
    for _score, concern, signals in scored[:top_n]:
        if len(signals) >= 2:
            confidence = _CONFIDENCE_HIGH
        elif len(signals) == 1:
            confidence = _CONFIDENCE_MEDIUM
        else:
            confidence = _CONFIDENCE_LOW

        rationale_en, rationale_ta = _build_rationale(
            concern=concern,
            houses=_CONCERN_HOUSES.get(concern, ()),
            mahadasha_lord=mahadasha_lord,
            antardasha_lord=antardasha_lord,
            signals=signals,
            sani_cycle=sani_cycle,
        )
        results.append(
            ConcernCandidate(
                concern=concern,
                confidence=confidence,
                rationale_en=rationale_en,
                rationale_ta=rationale_ta,
            )
        )
    return results


def _build_rationale(
    *,
    concern: str,
    houses: tuple[int, ...],
    mahadasha_lord: str,
    antardasha_lord: str,
    signals: list[str],
    sani_cycle: CycleAssessment | None,
) -> tuple[str, str]:
    parts_en: list[str] = []
    parts_ta: list[str] = []

    if "antardasha" in signals:
        house_list = ", ".join(str(h) for h in houses)
        parts_en.append(f"{antardasha_lord} antardasha is currently active and rules house(s) {house_list}.")
        parts_ta.append(f"தற்போது {antardasha_lord} அந்தரதசை நடைபெறுகிறது, இது {house_list} இடங்களுக்கு அதிபதி.")
    elif "mahadasha" in signals:
        house_list = ", ".join(str(h) for h in houses)
        parts_en.append(f"{mahadasha_lord} mahadasha rules house(s) {house_list}.")
        parts_ta.append(f"{mahadasha_lord} மகாதசை {house_list} இடங்களுக்கு அதிபதி.")

    if "sani" in signals and sani_cycle is not None and sani_cycle.supportive_label:
        parts_en.append(f"Saturn's current transit phase ({sani_cycle.type}) adds pressure here: {sani_cycle.supportive_label}.")
        parts_ta.append("சனியின் தற்போதைய கோச்சார நிலை இந்த துறையில் அழுத்தத்தை சேர்க்கிறது.")

    if not parts_en:
        parts_en.append("This life-stage phase makes this area a natural current priority.")
        parts_ta.append("இந்த வாழ்க்கை பருவம் இந்த துறையை இயல்பான தற்போதைய முன்னுரிமையாக்குகிறது.")

    return " ".join(parts_en), " ".join(parts_ta)
