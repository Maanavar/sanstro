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

# Karaka planets associated with each scenario (for human-readable alignment notes)
_SCENARIO_KARAKAS = {
    "job_change":     ("Saturn", "Sun"),
    "business_start": ("Saturn", "Mercury"),
    "marriage":       ("Venus", "Jupiter"),
    "education":      ("Mercury", "Jupiter"),
    "property":       ("Saturn", "Mars"),
    "health":         ("Sun", "Mars"),
    "travel_abroad":  ("Rahu", "Jupiter"),
    "spiritual":      ("Jupiter", "Ketu"),
    "family_harmony": ("Moon", "Jupiter"),
    "money":          ("Jupiter", "Venus"),
    "child_birth":    ("Jupiter", "Moon"),
    "other":          ("Jupiter", "Sun"),
}


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
    panchangam_quality: str = "MODERATE",
    option_scenario: str | None = None,
    shared_scenario: str | None = None,
) -> OptionAnalysis:
    adjustment, factors = _score_adjustment(option)
    # Scenario-divergence signal: if this option maps to a different scenario than the
    # shared base, its karaka planets may be better or worse placed → differentiate score.
    eff_scenario = option_scenario or shared_scenario or "other"
    if option_scenario and shared_scenario and option_scenario != shared_scenario:
        adjustment += 5 if option_scenario in ("education", "spiritual", "family_harmony") else -5
    score = max(0, min(100, base_score + adjustment))

    # Specific alignment notes — name the actual planets governing this scenario
    primary_karaka, secondary_karaka = _SCENARIO_KARAKAS.get(eff_scenario, ("Jupiter", "Sun"))
    strength_label = {"STRONG": "strong", "MODERATE": "moderate", "WEAK": "weak"}
    alignment = [
        f"Natal promise: {strength_label.get(natal_strength, natal_strength)} — {primary_karaka} & {secondary_karaka} placement in your birth chart",
        f"Dasha timing: {strength_label.get(dasha_strength, dasha_strength)} — current Mahadasha/Antardasha alignment with {primary_karaka}",
        f"Gochar support: {strength_label.get(gochar_strength, gochar_strength)} — transit {primary_karaka} position relative to your Moon sign",
    ]

    risk_factors = list(factors)
    if panchangam_quality == "WEAK":
        risk_factors.append("Panchangam quality for the target date is weak; choose a better muhurta window if possible.")
    if verdict == "CAUTION":
        risk_factors.append("Current planetary timing calls for patience; consider phased or delayed execution.")
    if natal_strength == "WEAK":
        risk_factors.append(f"Natal {primary_karaka} placement is not strongly supporting this path — foundation work recommended first.")

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
    delta = abs(option_a.score - option_b.score)
    primary_karaka, _ = _SCENARIO_KARAKAS.get(scenario, ("Jupiter", "Sun"))

    if recommended == "DEFER":
        return (
            DecisionBiText(
                ta=(
                    f"இரண்டு விருப்பங்களும் கிட்டத்தட்ட சமம் "
                    f"(A: {option_a.score}, B: {option_b.score} — வித்தியாசம் {delta}). "
                    f"தற்போதைய {primary_karaka} நிலை இரண்டையும் ஒரே மாதிரி பாதிக்கிறது. "
                    f"சற்று காத்திருந்து கிரக நிலை மாற்றம் ஆனதும் மீண்டும் பார்க்கவும்."
                ),
                en=(
                    f"Score gap is narrow (A: {option_a.score}, B: {option_b.score} — delta: {delta}). "
                    f"Current {primary_karaka} position affects both options similarly. "
                    f"A short defer-and-reassess allows planetary conditions to shift before committing."
                ),
            ),
            DecisionBiText(
                ta="இது நிராகரிப்பு அல்ல — சரியான நேரம் தேர்ந்தெடுக்க உதவும் ஒரு சிறு இடைவெளி.",
                en="This is not a rejection; it is a supportive timing pause — reassess when transit conditions shift.",
            ),
        )

    chosen = option_a if recommended == "A" else option_b
    other = option_b if recommended == "A" else option_a
    margin_label = "clearly" if delta > 10 else "narrowly"
    return (
        DecisionBiText(
            ta=(
                f"'{chosen.label}' ({chosen.score}) '{other.label}' ({other.score}) ஐ விட {margin_label} முன்னணியில் உள்ளது. "
                f"{primary_karaka} தசை-கோசர நிலை இந்த விருப்பத்திற்கு சற்று சாதகமாக உள்ளது."
            ),
            en=(
                f"'{chosen.label}' ({chosen.score}) leads '{other.label}' ({other.score}) {margin_label} (delta: {delta}). "
                f"The {primary_karaka}-related natal promise and transit alignment is relatively more supportive for this option."
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

    shared_scenario = _pick_scenario(priority, option_a, option_b)
    scenario_a = _scenario_from_option(option_a) or shared_scenario
    scenario_b = _scenario_from_option(option_b) or shared_scenario

    # Evaluate each option against its own best-fit scenario for differentiated scoring
    eval_a = evaluate_whatif(session, owner_user_id=owner_user_id, chart_id=chart_id, scenario=scenario_a, target_date=target_date)
    eval_b = evaluate_whatif(session, owner_user_id=owner_user_id, chart_id=chart_id, scenario=scenario_b, target_date=target_date)
    triple_a = eval_a.data.triple_confirmation
    triple_b = eval_b.data.triple_confirmation

    analysis_a = _build_option_analysis(
        option_a,
        base_score=eval_a.data.overall_score,
        verdict=eval_a.data.verdict,
        target_date=target_date,
        natal_strength=triple_a.natal_promise_strength,
        dasha_strength=triple_a.dasha_support_strength,
        gochar_strength=triple_a.gochar_support_strength,
        panchangam_quality=triple_a.panchangam_quality,
        option_scenario=scenario_a,
        shared_scenario=shared_scenario,
    )
    analysis_b = _build_option_analysis(
        option_b,
        base_score=eval_b.data.overall_score,
        verdict=eval_b.data.verdict,
        target_date=target_date,
        natal_strength=triple_b.natal_promise_strength,
        dasha_strength=triple_b.dasha_support_strength,
        gochar_strength=triple_b.gochar_support_strength,
        panchangam_quality=triple_b.panchangam_quality,
        option_scenario=scenario_b,
        shared_scenario=shared_scenario,
    )
    # Use the shared scenario label for response metadata
    scenario = shared_scenario

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
