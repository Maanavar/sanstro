from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import BirthProfile, Chart
from app.schemas.dasha import ResponseMeta
from app.schemas.decisions import DecisionBiText, DecisionBriefData, DecisionBriefResponse, DecisionOption, OptionAnalysis
from app.services.chart_service import load_persisted_chart_response
from app.services.whatif_service import evaluate_whatif

_CALC_VERSION = "jothidam-formula-engine-v1.0-2026"

_PRIORITY_SCENARIO = {
    "career": "job_change",
    "family": "family_harmony",
    "health": "health",
    "relationship": "marriage",
    "education": "education",
    "money": "money",
    "spiritual": "spiritual",
}

_SCENARIO_KEYWORDS = {
    "job_change": {"job", "offer", "role", "salary", "promotion", "company", "career"},
    "business_start": {"business", "startup", "founder", "venture", "client"},
    "marriage": {"marriage", "wedding", "partner", "relationship", "spouse"},
    "education": {"study", "education", "exam", "college", "course", "degree"},
    "property": {"property", "house", "home", "flat", "land", "mortgage"},
    "health": {"health", "medical", "hospital", "surgery", "fitness", "wellness"},
    "travel_abroad": {"abroad", "visa", "overseas", "relocate", "move", "migration"},
    "spiritual": {"spiritual", "meditation", "retreat", "temple", "sadhana"},
    "family_harmony": {"family", "parents", "child", "home", "harmony"},
    "money": {"money", "finance", "investment", "loan", "savings", "wealth"},
    "child_birth": {"pregnancy", "baby", "childbirth", "conceive"},
}

_RISK_MARKERS = {"quit", "resign", "loan", "startup", "relocate", "abroad", "new city", "new country"}
_STABILITY_MARKERS = {"stay", "current", "continue", "existing", "same role", "same city"}


def _meta() -> ResponseMeta:
    return ResponseMeta(calculationVersion=_CALC_VERSION, generatedAt=datetime.now(tz=UTC))


def _assert_chart_owner(session: Session, chart_id: UUID, owner_user_id: UUID) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.owner_user_id != owner_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def _tokenize(text: str) -> str:
    return text.lower().replace(",", " ").replace(".", " ").replace("/", " ")


def _scenario_from_text(text: str) -> str:
    corpus = _tokenize(text)
    best_scenario = "other"
    best_score = 0
    for scenario, words in _SCENARIO_KEYWORDS.items():
        score = sum(1 for word in words if word in corpus)
        if score > best_score:
            best_score = score
            best_scenario = scenario
    return best_scenario


def _pick_scenario(priority: str | None, option_a: DecisionOption, option_b: DecisionOption) -> str:
    if priority and priority in _PRIORITY_SCENARIO:
        return _PRIORITY_SCENARIO[priority]
    merged = f"{option_a.label} {option_a.description} {option_b.label} {option_b.description}"
    return _scenario_from_text(merged)


def _score_adjustment(option: DecisionOption) -> tuple[int, list[str]]:
    text = _tokenize(f"{option.label} {option.description}")
    risk = sum(1 for marker in _RISK_MARKERS if marker in text)
    stable = sum(1 for marker in _STABILITY_MARKERS if marker in text)
    delta = min(3, stable) * 2 - min(6, risk) * 2

    factors: list[str] = []
    if risk > 0:
        factors.append("Option includes transition-risk markers (new setup/relocation/financial load).")
    if stable > 0:
        factors.append("Option includes stability markers (continuity/current ecosystem).")
    return delta, factors


def _optimal_window(target_date: date, verdict: str) -> str:
    if verdict == "FAVOURABLE":
        return f"around {target_date.strftime('%d %b %Y')}"
    if verdict == "NEUTRAL":
        return f"after { (target_date + timedelta(days=21)).strftime('%d %b %Y') }"
    return f"reassess after { (target_date + timedelta(days=45)).strftime('%d %b %Y') }"


def _scenario_from_option(option: DecisionOption) -> str:
    """Detect scenario from an individual option's label and description."""
    return _scenario_from_text(f"{option.label} {option.description}")


def _build_option_analysis(
    option: DecisionOption,
    *,
    base_score: int,
    verdict: str,
    target_date: date,
    natal_strength: str,
    dasha_strength: str,
    gochar_strength: str,
    option_scenario: str | None = None,
    shared_scenario: str | None = None,
) -> OptionAnalysis:
    adjustment, factors = _score_adjustment(option)
    # If this option resolves to a different scenario than the shared one,
    # apply a scenario-divergence signal (±5) so the two options can differ
    # on astrological grounds, not just keyword presence.
    if option_scenario and shared_scenario and option_scenario != shared_scenario:
        adjustment += 5 if option_scenario in ("education", "spiritual", "family_harmony") else -5
    score = max(0, min(100, base_score + adjustment))

    alignment = [
        f"Natal promise: {natal_strength}",
        f"Dasha timing: {dasha_strength}",
        f"Gochar support: {gochar_strength}",
    ]

    risk_factors = list(factors)
    if verdict == "CAUTION":
        risk_factors.append("Base timing verdict is caution; consider phased execution.")

    return OptionAnalysis(
        label=option.label,
        score=score,
        alignmentNotes=alignment,
        riskFactors=risk_factors,
        optimalWindow=_optimal_window(target_date, verdict),
    )


def _recommend(score_a: int, score_b: int) -> tuple[str, int]:
    delta = abs(score_a - score_b)
    if delta < 5 or (max(score_a, score_b) < 50 and delta < 8):
        confidence = min(78, 52 + delta * 4)
        return "DEFER", confidence
    if score_a > score_b:
        confidence = min(95, 60 + delta * 5)
        return "A", confidence
    confidence = min(95, 60 + delta * 5)
    return "B", confidence


def _reasoning(
    recommended: str,
    option_a: OptionAnalysis,
    option_b: OptionAnalysis,
    scenario: str,
) -> tuple[DecisionBiText, DecisionBiText | None]:
    if recommended == "DEFER":
        return (
            DecisionBiText(
                ta=(
                    f"Irendu therivugalukkum score idaiyveli kuraivaga ulladhu "
                    f"(A: {option_a.score}, B: {option_b.score}). "
                    f"{scenario} thodarpana mudivai kurippitta nerathil meendum parisaalikka vendum."
                ),
                en=(
                    f"Score gap is narrow between both options (A: {option_a.score}, B: {option_b.score}). "
                    f"For this {scenario} decision, a short defer-and-reassess approach is preferable."
                ),
            ),
            DecisionBiText(
                ta="Idhu nirakaram alla; idhu neram-thittam refinement-kku oru supportive pause.",
                en="This is not a rejection; it is a supportive timing pause for refinement.",
            ),
        )

    chosen = option_a if recommended == "A" else option_b
    other = option_b if recommended == "A" else option_a
    return (
        DecisionBiText(
            ta=(
                f"Therndhedukkappatta option ({chosen.label}) score {chosen.score}, "
                f"matra option ({other.label}) score {other.score}. "
                f"Dasha-gochar timing intha therivukku thunaiyaga irukkiradhu."
            ),
            en=(
                f"Recommended option ({chosen.label}) scores {chosen.score} versus "
                f"{other.score} for the alternative. Dasha-transit timing is relatively more aligned here."
            ),
        ),
        None,
    )


def build_decision_brief(
    session: Session,
    *,
    owner_user_id: UUID,
    chart_id: UUID,
    option_a: DecisionOption,
    option_b: DecisionOption,
    priority: str | None,
    target_date: date | None,
) -> DecisionBriefResponse:
    _assert_chart_owner(session, chart_id, owner_user_id)
    chart_snapshot = load_persisted_chart_response(session, chart_id)
    if target_date is None:
        tz = chart_snapshot.data.birth_profile.birth_timezone
        target_date = datetime.now(tz=UTC).astimezone(ZoneInfo(tz)).date()

    scenario = _pick_scenario(priority, option_a, option_b)
    base = evaluate_whatif(session, owner_user_id=owner_user_id, chart_id=chart_id, scenario=scenario, target_date=target_date)
    triple = base.data.triple_confirmation

    scenario_a = _scenario_from_option(option_a)
    scenario_b = _scenario_from_option(option_b)

    analysis_a = _build_option_analysis(
        option_a,
        base_score=base.data.overall_score,
        verdict=base.data.verdict,
        target_date=target_date,
        natal_strength=triple.natal_promise_strength,
        dasha_strength=triple.dasha_support_strength,
        gochar_strength=triple.gochar_support_strength,
        option_scenario=scenario_a,
        shared_scenario=scenario,
    )
    analysis_b = _build_option_analysis(
        option_b,
        base_score=base.data.overall_score,
        verdict=base.data.verdict,
        target_date=target_date,
        natal_strength=triple.natal_promise_strength,
        dasha_strength=triple.dasha_support_strength,
        gochar_strength=triple.gochar_support_strength,
        option_scenario=scenario_b,
        shared_scenario=scenario,
    )

    recommended, confidence = _recommend(analysis_a.score, analysis_b.score)
    reasoning, caution = _reasoning(recommended, analysis_a, analysis_b, scenario)

    return DecisionBriefResponse(
        data=DecisionBriefData(
            chartId=chart_id,
            targetDate=target_date,
            scenarioUsed=scenario,
            optionA=analysis_a,
            optionB=analysis_b,
            recommended=recommended,
            confidence=confidence,
            reasoning=reasoning,
            caution=caution,
        ),
        meta=_meta(),
    )
