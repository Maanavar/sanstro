from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date

from app.calculations.astro import house_from_reference
from app.calculations.bhava_afflictions import assess_bhava_afflictions
from app.calculations.chart_strength import DEBILITATION_RASI, EXALTATION_RASI, OWN_SIGN_RASI
from app.calculations.dasha_activation import assess_dasha_activation
from app.calculations.display_names import planet_en, planet_ta
from app.calculations.transits import get_jupiter_aspects
from app.core.age_gate import MARRIAGE_UPPER_AGE, SEVVAI_DOSHAM_SOFTENING_AGE, is_married_settled, is_seeking_marriage
from app.reasoning.chart_signature import detect_signature
from app.reasoning.promise_gate import GateGrade, GateResult, assess_promise
from app.reasoning.timing_vote import combine_gate_and_timing
from app.reasoning.verdict import band_to_legacy_confidence
from app.services.feature_flags import get_flag
from app.services.life_area_prediction_models import (
    AstroFactor,
    BiText,
    ChartSignature,
    LifeAreaPrediction,
    house_lord_for_lagna,
)
from app.services.narrative_engine import render_causal_chain, signature_framing
from app.services.safety_filter import check_text, run_safety_pass

logger = logging.getLogger(__name__)


def _safety_checked(result: LifeAreaPrediction) -> LifeAreaPrediction:
    """D6/D15: serve-time tone/precision check before returning a marriage
    reading. main_prediction is a plain ta/en string pair (not a BiText),
    so it's checked directly; factor details, challenges, and supports are
    BiText and go through run_safety_pass."""
    check_text(result.main_prediction_ta, source="marriage", lang="ta")
    check_text(result.main_prediction_en, source="marriage", lang="en")
    run_safety_pass(
        *(f.detail for f in result.astrological_factors),
        *result.challenges,
        *result.supports,
        result.chart_signature.framing if result.chart_signature else None,
        result.causal_chain,
        source="marriage",
    )
    return result


def _compute_chart_signature(payload: MarriageAssessmentInput) -> ChartSignature | None:
    """Phase 5 (D6, P0-4): chart-level dominant-graha framing, extended here
    from life-areas-only (PR-5's original scope). Gated on
    reasoning_chart_signature; skipped (None, not fabricated) on malformed
    data — mirrors life_areas_service's own try/except around the same
    ValueError."""
    if not bool(get_flag("reasoning_chart_signature")):
        return None
    active = list(payload.active_dasha_lords)
    maha_lord = active[0] if active else None
    try:
        signature = detect_signature(
            planet_longitudes=payload.planet_longitudes or {},
            planet_rasis=payload.planets_rasi,
            current_maha_lord=maha_lord,
            current_antar_lord=active[-1] if len(active) > 1 else maha_lord,
        )
    except ValueError:
        logger.exception("chart signature detection failed for a marriage prediction")
        return None
    framing = signature_framing(signature.motif)
    return ChartSignature(dominant=signature.dominant, framing=BiText(ta=framing.ta, en=framing.en))


@dataclass(frozen=True, slots=True)
class MarriageAssessmentInput:
    as_of: date
    lagna_rasi: int
    planets_rasi: dict[str, int]
    active_dasha_lords: set[str]
    transit_jupiter_rasi: int
    transit_venus_rasi: int
    age: int
    life_stage: str = "young_adult"
    marital_status: str | None = None
    venus_combust: bool = False
    sevvai_dosham_cancelled: bool = False
    rahu_ketu_label: str | None = None
    d9_rasi_by_planet: dict[str, int] | None = None
    relationship_to_owner: str = "self"
    # Absolute longitudes (for Atmakaraka in the chart-signature overlay,
    # P0-4) — optional; when absent, the signature detector falls back to
    # aspect/dasha/strength signals alone (see detect_signature()).
    planet_longitudes: dict[str, float] | None = None
_PARENTAL_RELATIONSHIPS: frozenset[str] = frozenset({"parent", "grandparent"})


def _dignity_label(planet: str, rasi: int | None, *, combust: bool = False) -> str:
    """Collapse a rasi placement into the promise-gate dignity vocabulary."""
    if rasi is None:
        return "NEUTRAL"
    if combust:
        return "COMBUST"
    if rasi == DEBILITATION_RASI.get(planet):
        return "DEBILITATED"
    if rasi == EXALTATION_RASI.get(planet):
        return "EXALTED"
    if rasi in OWN_SIGN_RASI.get(planet, frozenset()):
        return "OWN"
    return "NEUTRAL"


def _marriage_promise_gate(payload: MarriageAssessmentInput) -> GateResult:
    """D1 promise gate for marriage timing (plan §Phase 1 step 4).

    Bhava = 7th house; karaka = Venus; varga = D9 (per _AREA_ROUTING).
    Falls back to a NEUTRAL varga dignity when D9 data is unavailable so
    missing data can never manufacture a BLOCKED reading (D3).
    """
    seventh_lord = house_lord_for_lagna(payload.lagna_rasi, 7)
    seventh_lord_rasi = payload.planets_rasi.get(seventh_lord)
    venus_rasi = payload.planets_rasi.get("VENUS")
    if seventh_lord_rasi is None or venus_rasi is None:
        return assess_promise(
            bhava_lord_house=1, bhava_lord_afflicted=False,
            karaka_dignity_d1="NEUTRAL", karaka_dignity_varga="NEUTRAL",
            karaka_available=False,
        )
    seventh_lord_house = house_from_reference(payload.lagna_rasi, seventh_lord_rasi)
    # Beyond debilitation/combustion, two or more natural malefics on the
    # 7th lord (conjunction or classical drishti) count as fatal affliction
    # for the gate. BLOCKED still additionally requires Venus afflicted in
    # both D1 and D9, so this stays conservative (D3).
    affliction = assess_bhava_afflictions(
        lagna_rasi=payload.lagna_rasi,
        bhava_house=7,
        planet_rasis=payload.planets_rasi,
        karaka="VENUS",
    )
    lord_afflicted = (
        seventh_lord_rasi == DEBILITATION_RASI.get(seventh_lord)
        or (seventh_lord == "VENUS" and payload.venus_combust)
        or len(affliction.lord_afflicted_by) >= 2
    )
    d9 = payload.d9_rasi_by_planet or {}
    return assess_promise(
        bhava_lord_house=seventh_lord_house,
        bhava_lord_afflicted=lord_afflicted,
        karaka_dignity_d1=_dignity_label("VENUS", venus_rasi, combust=payload.venus_combust),
        karaka_dignity_varga=_dignity_label("VENUS", d9.get("VENUS")),
        karaka_available=True,
    )


def _gated_marriage_prediction(payload: MarriageAssessmentInput, gate: GateResult) -> LifeAreaPrediction:
    """BLOCKED/SILENT gate outcome → honest, non-fatalistic redirect (D3/D6).

    No timing vote runs and no timing window is claimed: a strong Venus
    dasha cannot lift an unpromised event (D1).
    """
    if gate.grade is GateGrade.BLOCKED:
        main_ta = (
            "தற்போதைய ஜாதக அமைப்பில் திருமண நேரத்திற்கு வலுவான வாக்கு தெரியவில்லை — "
            "சாதகமான தசையிலும் இது தானாக மாறாது. "
            "இது 'முடியாது' என்பதல்ல; ஜாதகம் வலுவாக ஆதரிக்கும் பகுதிகளில் கவனம் செலுத்தி, "
            "பரிகாரங்களுடன் மறு ஆய்வு செய்வது நல்லது."
        )
        main_en = (
            "The current chart configuration does not show a strong promise for marriage timing — "
            "even a favourable dasha does not change this on its own. "
            "This is not a 'never'; redirecting focus to the areas your chart strongly supports, "
            "alongside remedies and a periodic re-assessment, is the wiser path."
        )
        factor_key = "promise_gate_blocked"
    else:
        main_ta = (
            "இந்த கேள்விக்கு ஜாதகம் அமைதியாக உள்ளது — உறுதியான திருமண நேர கணிப்பு தர "
            "போதிய சமிக்ஞை இல்லை. நேர்மையான பதில்: இப்போது உறுதியாக சொல்ல முடியாது."
        )
        main_en = (
            "The chart is quiet on this question — there isn't enough signal for a confident "
            "marriage-timing call. The honest answer: we cannot say with confidence right now."
        )
        factor_key = "promise_gate_silent"

    return _safety_checked(LifeAreaPrediction(
        life_area="marriage",
        main_prediction_ta=main_ta,
        main_prediction_en=main_en,
        astrological_factors=[
            AstroFactor(
                key=factor_key,
                status="INFO",
                detail=BiText(ta=gate.reason.ta, en=gate.reason.en),
            )
        ],
        dasha_support="WEAK",
        transit_support="WEAK",
        timing_window_start=None,
        timing_window_end=None,
        confidence="LOW",
        challenges=[BiText(
            "ஜாதக வாக்கு இல்லாமல் நேர கணிப்பு தரப்படவில்லை.",
            "No timing window is claimed without a natal promise.",
        )],
        supports=[BiText(
            "குடும்ப நலன், தொழில் மற்றும் ஆன்மிக வளர்ச்சி பற்றி கேட்கலாம் — ஜாதகம் ஆதரிக்கும் பாதைகளை காட்டும்.",
            "Ask about family well-being, career, and spiritual growth — the chart will show the paths it does support.",
        )],
        band=gate.grade.value,
        chart_signature=_compute_chart_signature(payload),
        # No causal_chain here — a BLOCKED/SILENT gate redirect has only one
        # reason string (already shown as the single astrological_factor
        # above), so a chain would just repeat it. Causal chains are for the
        # scored path below, which has three distinct reason strings to link.
    ))


def assess_marriage_prediction(
    payload: MarriageAssessmentInput, *, use_reasoning_gate: bool | None = None
) -> LifeAreaPrediction:
    # Parent/grandparent profiles: marriage timing is not applicable — redirect to
    # family harmony and companionship guidance instead.
    if payload.relationship_to_owner in _PARENTAL_RELATIONSHIPS:
        return LifeAreaPrediction(
            life_area="marriage",
            main_prediction_ta=(
                "பெற்றோர் / பாட்டன்/பாட்டி பிரோஃபைல்களுக்கு திருமண நேர ஆலோசனை பொருந்தாது. "
                "குடும்ப ஒற்றுமை, ஆரோக்கியம் மற்றும் ஆன்மிக வழிகாட்டல் பற்றி விநாடி உதவ தயார்."
            ),
            main_prediction_en=(
                "Marriage timing guidance is not applicable for parent/grandparent profiles. "
                "Vinaadi is here to guide on family harmony, health, and spiritual well-being."
            ),
            astrological_factors=[
                AstroFactor(
                    key="relationship_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"உறவு வகை '{payload.relationship_to_owner}': திருமண நேர கணிப்பு இந்த சூழலில் பொருந்தாது.",
                        en=f"Relationship type '{payload.relationship_to_owner}': marriage timing prediction is not applicable in this context.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[],
            supports=[BiText(
                "குடும்ப நலன், ஆரோக்கியம் மற்றும் துணைவர் ஒற்றுமை பற்றி கேட்கலாம்.",
                "Ask about family well-being, health, and companionship harmony instead.",
            )],
        )

    if payload.age < 18:
        return LifeAreaPrediction(
            life_area="marriage",
            main_prediction_ta="திருமண நேர ஆலோசனை வயது காரணமாக ஒத்திவைக்கப்படுகிறது; இப்போது குழந்தை வளர்ச்சி மற்றும் குடும்ப பராமரிப்பே முக்கியம்.",
            main_prediction_en="Marriage timing/advice is age-gated; current phase is child development and family care.",
            astrological_factors=[
                AstroFactor(
                    key="age_phase_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"வயது {payload.age}: இந்த கட்டத்தில் திருமண வழிகாட்டல் பொருந்தாது.",
                        en=f"Age {payload.age}: marriage guidance is not applicable in this phase.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[BiText("இப்போதைய வாழ்க்கை முடிவுகளுக்கு இந்த பகுதியை பயன்படுத்த வேண்டாம்.", "Do not use this section for current-life decisions.")],
            supports=[BiText("ஆரோக்கியம், பாசம், பாதுகாப்பான வளர்ச்சி வழக்கங்கள் ஆகியவற்றில் கவனம் செலுத்தவும்.", "Focus on health, bonding, and safe growth routines.")],
        )

    # Soft gate — past prime marriage age (50+, Tamil/Indian cultural context).
    if payload.age >= MARRIAGE_UPPER_AGE:
        return LifeAreaPrediction(
            life_area="marriage",
            main_prediction_ta=(
                "இந்த வாழ்க்கை கட்டத்தில் ஜோதிட வழிகாட்டல் திருமண நேர கணிப்பிலிருந்து "
                "துணைவன்/துணைவி ஒற்றுமை, குடும்ப பாலம் மற்றும் ஆன்மிக தொடர்புக்கு மாறுகிறது. "
                "உறவு தரம் மற்றும் குடும்ப நலன் பற்றிய கேள்விகளுக்கு விநாடி உதவ தயார்."
            ),
            main_prediction_en=(
                "At this life stage, astrological guidance naturally shifts from marriage timing "
                "to companionship quality, family bonds, and spiritual partnership. "
                "Vinaadi is happy to guide you on relationship quality and family well-being."
            ),
            astrological_factors=[
                AstroFactor(
                    key="life_stage_gate",
                    status="INFO",
                    detail=BiText(
                        ta=f"வயது {payload.age}: திருமண நேர கணிப்பு இந்த கட்டத்திற்கு பொருந்தாது.",
                        en=f"Age {payload.age}: marriage timing predictions are not applicable at this life stage.",
                    ),
                )
            ],
            dasha_support="PARTIAL",
            transit_support="PARTIAL",
            timing_window_start=payload.as_of,
            timing_window_end=date(payload.as_of.year, 12, 31),
            confidence="LOW",
            challenges=[],
            supports=[BiText(
                "துணைவன்/துணைவி ஒற்றுமை மற்றும் குடும்ப நலன் பற்றி கேட்கலாம்.",
                "Ask about companionship harmony and family well-being instead.",
            )],
        )

    married_harmony_mode = is_married_settled(payload.marital_status)

    # ── D1 astrological promise gate (reasoning_gate flag, plan Phase 1) ──
    # Runs after the applicability gates above, before the score=50 block.
    # Marriage-*timing* promise applies only when marriage is being sought;
    # married profiles are read for harmony, not for a new-event promise.
    if use_reasoning_gate is None:
        use_reasoning_gate = bool(get_flag("reasoning_gate"))
    gate: GateResult | None = None
    if use_reasoning_gate and not married_harmony_mode:
        gate = _marriage_promise_gate(payload)
        if not gate.proceeds_to_timing:
            return _gated_marriage_prediction(payload, gate)

    seventh_house_rasi = ((payload.lagna_rasi + 7 - 2) % 12) + 1
    seventh_lord = house_lord_for_lagna(payload.lagna_rasi, 7)
    second_lord = house_lord_for_lagna(payload.lagna_rasi, 2)
    venus_rasi = payload.planets_rasi["VENUS"]
    seventh_lord_rasi = payload.planets_rasi[seventh_lord]
    second_lord_rasi = payload.planets_rasi[second_lord]

    factors: list[AstroFactor] = []
    supports: list[BiText] = []
    challenges: list[BiText] = []
    if gate is not None:
        factors.append(AstroFactor(
            key=f"promise_gate_{gate.grade.value.lower()}",
            status="SUPPORT" if gate.grade is GateGrade.PASS else "CAUTION",
            detail=BiText(ta=gate.reason.ta, en=gate.reason.en),
        ))
        if gate.grade is GateGrade.WEAK:
            challenges.append(BiText(
                "ஜாதக வாக்கு பகுதியளவே — நேர கணிப்பு எச்சரிக்கையுடன் வாசிக்கவும்.",
                "Birth promise is partial — read the timing guidance with that caveat.",
            ))
    score = 50
    _LIFE_STAGE_LABEL = {
        "child": ("குழந்தை பருவம்", "Childhood"),
        "student": ("மாணவர் பருவம்", "Student years"),
        "young_adult": ("இளம் வயது", "Young adulthood"),
        "mid_life": ("நடு வயது", "Mid-life"),
        "senior": ("மூத்த பருவம்", "Senior years"),
    }
    stage_ta, stage_en = _LIFE_STAGE_LABEL.get(
        payload.life_stage,
        (payload.life_stage.replace("_", " "), payload.life_stage.replace("_", " ")),
    )
    factors.append(
        AstroFactor(
            key="life_stage",
            status="INFO",
            detail=BiText(
                ta=f"வாழ்க்கை கட்டம்: {stage_ta}.",
                en=f"Life stage: {stage_en}.",
            ),
        )
    )
    if married_harmony_mode:
        score += 5
        factors.append(AstroFactor(
            key="married_harmony_mode",
            status="INFO",
            detail=BiText(
                ta="திருமணமானவர் — இந்த பகுதி குடும்ப நலன், இல்ல ஒற்றுமை மற்றும் குழந்தை யோகத்தை காட்டுகிறது.",
                en="Married profile — this reading reflects family fortune: home stability, marital harmony, and children's prosperity.",
            ),
        ))
        supports.append(BiText(
            "7ம் வீடு பலம் உறவின் தரத்தை குறிக்கிறது.",
            "7th house strength reflects the quality of your marital bond.",
        ))

        # 4th house — home and family stability
        fourth_lord = house_lord_for_lagna(payload.lagna_rasi, 4)
        fourth_lord_rasi = payload.planets_rasi.get(fourth_lord)
        if fourth_lord_rasi is not None:
            fourth_lord_house = house_from_reference(payload.lagna_rasi, fourth_lord_rasi)
            if fourth_lord_house in {1, 4, 5, 7, 9, 10, 11}:
                score += 6
                factors.append(AstroFactor(
                    key="fourth_lord_family_home",
                    status="SUPPORT",
                    detail=BiText(
                        ta=f"4ம் அதிபதி {fourth_lord_house}ம் வீட்டில் — குடும்ப வீட்டு நிலை நல்லது.",
                        en=f"4th lord in house {fourth_lord_house} — family home stability is well-supported.",
                    ),
                ))
                supports.append(BiText("குடும்ப வீட்டு நிலை நல்ல நிலையில் உள்ளது.", "Family home stability is in a good position."))
            else:
                score -= 3
                factors.append(AstroFactor(
                    key="fourth_lord_family_home",
                    status="CAUTION",
                    detail=BiText(
                        ta=f"4ம் அதிபதி {fourth_lord_house}ம் வீட்டில் — இல்ல சுகத்தில் கவனம் தேவை.",
                        en=f"4th lord in house {fourth_lord_house} — home comfort needs mindful attention.",
                    ),
                ))
                challenges.append(BiText("இல்ல சுகம் மேம்பட கவனம் தேவை.", "Home comfort needs careful attention."))

        # 5th house — children and family prosperity
        fifth_lord = house_lord_for_lagna(payload.lagna_rasi, 5)
        fifth_lord_rasi = payload.planets_rasi.get(fifth_lord)
        if fifth_lord_rasi is not None:
            fifth_lord_house = house_from_reference(payload.lagna_rasi, fifth_lord_rasi)
            if fifth_lord_house in {1, 4, 5, 7, 9, 10, 11}:
                score += 6
                factors.append(AstroFactor(
                    key="fifth_lord_family_prosperity",
                    status="SUPPORT",
                    detail=BiText(
                        ta=f"5ம் அதிபதி {fifth_lord_house}ம் வீட்டில் — குழந்தை யோகம் மற்றும் குடும்ப செல்வாக்கு நல்லது.",
                        en=f"5th lord in house {fifth_lord_house} — children's fortune and family prosperity are well-supported.",
                    ),
                ))
                supports.append(BiText("குடும்ப செல்வாக்கு மற்றும் குழந்தை யோகம் நல்ல அமைப்பில் உள்ளது.", "Family prosperity and children's fortune are well-placed."))
            else:
                factors.append(AstroFactor(
                    key="fifth_lord_family_prosperity",
                    status="NEUTRAL",
                    detail=BiText(
                        ta=f"5ம் அதிபதி {fifth_lord_house}ம் வீட்டில் — குழந்தை நலனில் கவனம் நல்லது.",
                        en=f"5th lord in house {fifth_lord_house} — mindful care supports children's welfare.",
                    ),
                ))

    elif is_seeking_marriage(payload.marital_status):
        # Divorced / widowed / breakup — eligible for marriage fortune, contextually framed.
        marital = (payload.marital_status or "").strip().lower()
        _context_map = {
            "divorced": (
                "மறுமணம் / புதிய உறவு — முன்பு திருமணமானவர்; 7ம் வீடு புதிய வாழ்க்கைத்துணை யோகத்தை காட்டுகிறது.",
                "Second marriage / new relationship — previously married; 7th house now indicates prospects for a new life partner.",
            ),
            "widowed": (
                "புதிய வாழ்க்கைத்துணை யோகம் — இழப்பிற்குப் பிறகான துணை மற்றும் உறவு சாத்தியம் மதிப்பீடு செய்யப்படுகிறது.",
                "Companionship and new life-partner prospects assessed with sensitivity after bereavement.",
            ),
            "breakup": (
                "உறவு மீட்சி மற்றும் திருமண யோகம் — பிரிவிற்குப் பிறகு புதிய காதல் / திருமண சாத்தியம் மதிப்பீடு.",
                "Relationship healing and marriage prospects — assessing fresh love / marriage opportunity after a breakup.",
            ),
        }
        ta_ctx, en_ctx = _context_map.get(marital, (
            "திருமண / புதிய உறவு யோகம் மதிப்பீடு செய்யப்படுகிறது.",
            "Marriage / new relationship prospects are being assessed.",
        ))
        factors.append(AstroFactor(
            key="relationship_context",
            status="INFO",
            detail=BiText(ta=ta_ctx, en=en_ctx),
        ))
        supports.append(BiText(
            "7ம் வீடு பலம் புதிய வாழ்க்கைத்துணை யோகத்தை குறிக்கிறது.",
            "7th house strength indicates prospects for a new life partner.",
        ))

    elif payload.life_stage == "student":
        score -= 6
        challenges.append(BiText("மாணவர் கட்டத்தில் திருமண நேரம் பொதுவாக முதன்மை கவனம் அல்ல.", "Student life-stage: marriage timing is usually not the primary focus."))

    planets_in_7th = sorted(
        name for name, rasi in payload.planets_rasi.items() if rasi == seventh_house_rasi
    )
    if planets_in_7th:
        score += 6
        factors.append(
            AstroFactor(
                key="seventh_house_occupancy",
                status="SUPPORT",
                detail=BiText(
                    ta=f"7ம் வீட்டில் கிரகங்கள் உள்ளன: {', '.join(planet_ta(p) for p in planets_in_7th)}.",
                    en=f"Planets occupy the 7th house: {', '.join(planet_en(p) for p in planets_in_7th)}.",
                ),
            )
        )
        supports.append(BiText("7ம் வீடு செயலில் உள்ளது.", "7th house is activated."))
    else:
        factors.append(
            AstroFactor(
                key="seventh_house_occupancy",
                status="NEUTRAL",
                detail=BiText("7ம் வீட்டில் நேரடி நிரப்பு குறைவு.", "Direct occupancy in 7th house is limited."),
            )
        )

    seventh_lord_house = house_from_reference(payload.lagna_rasi, seventh_lord_rasi)
    if seventh_lord_house in {1, 4, 5, 7, 9, 10, 11}:
        score += 10
        supports.append(BiText("7ம் அதிபதி நல்ல நிலையில் உள்ளது.", "7th lord is in a supportive position."))
        factors.append(
            AstroFactor(
                key="seventh_lord_placement",
                status="SUPPORT",
                detail=BiText(
                    ta=f"7ம் அதிபதி {seventh_lord_house}ம் வீட்டில்.",
                    en=f"7th lord is placed in house {seventh_lord_house}.",
                ),
            )
        )
    else:
        score -= 8
        challenges.append(BiText("7ம் அதிபதி கஷ்ட வீட்டில்.", "7th lord is in a challenging house."))
        factors.append(
            AstroFactor(
                key="seventh_lord_placement",
                status="CAUTION",
                detail=BiText(
                    ta=f"7ம் அதிபதி {seventh_lord_house}ம் வீட்டில் கவனம் தேவை.",
                    en=f"7th lord in house {seventh_lord_house} calls for caution.",
                ),
            )
        )

    # ── Named malefic afflictions on the 7th bhava / lord / Venus ─────────
    # (bhava_afflictions.py — previously this path saw no natal drishti at all.)
    affliction = assess_bhava_afflictions(
        lagna_rasi=payload.lagna_rasi,
        bhava_house=7,
        planet_rasis=payload.planets_rasi,
        karaka="VENUS",
    )
    if affliction.malefics_occupying or affliction.malefics_aspecting:
        involved = sorted({*affliction.malefics_occupying, *affliction.malefics_aspecting})
        score -= min(9, 3 * len(involved))
        factors.append(AstroFactor(
            key="seventh_house_malefic_influence",
            status="CAUTION",
            detail=BiText(
                ta=f"7ம் வீட்டில் பாப கிரக தாக்கம்: {', '.join(planet_ta(p) for p in involved)} — திருமண விஷயங்களில் தாமதம்/உரசல் சாத்தியம்.",
                en=f"Malefic influence on the 7th house: {', '.join(planet_en(p) for p in involved)} — can indicate delay or friction in marriage matters.",
            ),
        ))
        challenges.append(BiText(
            "7ம் வீட்டின் மீது பாப கிரக பார்வை/சேர்க்கை உள்ளது.",
            "Malefic aspect/occupancy influences the 7th house.",
        ))
    if affliction.papa_kartari:
        score -= 4
        factors.append(AstroFactor(
            key="papa_kartari_seventh",
            status="CAUTION",
            detail=BiText(
                ta="7ம் வீடு பாப கர்த்தரி அமைப்பில் உள்ளது — இருபுறமும் பாப கிரகங்கள்.",
                en="The 7th house is hemmed in papa kartari — malefics on both sides.",
            ),
        ))
        challenges.append(BiText("பாப கர்த்தரி காரணமாக கூடுதல் பொறுமை தேவை.", "Papa kartari calls for extra patience."))
    elif affliction.shubha_kartari:
        score += 3
        supports.append(BiText(
            "7ம் வீடு சுப கர்த்தரி பாதுகாப்பில் உள்ளது.",
            "The 7th house is protected by shubha kartari (benefics on both sides).",
        ))
    if affliction.karaka_afflicted_by or affliction.lord_afflicted_by:
        # When Venus itself lords the 7th (Aries/Scorpio lagna) the module
        # skips the karaka pass and reports Venus's afflictors under
        # lord_afflicted_by — the display target is still Venus.
        venus_is_target = bool(affliction.karaka_afflicted_by) or seventh_lord == "VENUS"
        afflicted_target_ta = "சுக்கிரன்" if venus_is_target else planet_ta(seventh_lord)
        afflicted_target_en = "Venus" if venus_is_target else planet_en(seventh_lord)
        afflictors = affliction.karaka_afflicted_by or affliction.lord_afflicted_by
        score -= min(6, 2 * len(afflictors))
        challenges.append(BiText(
            f"{afflicted_target_ta} மீது பாப கிரக பார்வை உள்ளது.",
            f"{afflicted_target_en} is under malefic aspect ({', '.join(planet_en(p) for p in afflictors)}).",
        ))

    venus_support = 0
    if venus_rasi in OWN_SIGN_RASI["VENUS"] or venus_rasi == EXALTATION_RASI["VENUS"]:
        venus_support += 10
    if venus_rasi == DEBILITATION_RASI["VENUS"]:
        venus_support -= 8
    if payload.venus_combust:
        venus_support -= 6
    score += venus_support
    factors.append(
        AstroFactor(
            key="venus_strength",
            status="SUPPORT" if venus_support >= 0 else "CAUTION",
            detail=BiText(
                ta="சுக்கிரன் நிலை திருமண சுட்டியை பாதிக்கிறது.",
                en="Venus condition influences marriage indications.",
            ),
        )
    )
    if venus_support >= 0:
        supports.append(BiText("சுக்கிரன் ஆதரவு உள்ளது.", "Venus offers support."))
    else:
        challenges.append(BiText("சுக்கிரன் பலம் குறைவு.", "Venus strength is reduced."))

    second_lord_house = house_from_reference(payload.lagna_rasi, second_lord_rasi)
    if second_lord_house in {1, 2, 4, 5, 7, 9, 10, 11}:
        score += 5
        factors.append(
            AstroFactor(
                key="second_lord_family_support",
                status="SUPPORT",
                detail=BiText("2ம் அதிபதி குடும்ப ஆதரவுக்குத் துணை.", "2nd lord supports family foundation."),
            )
        )

    if payload.d9_rasi_by_planet is not None:
        d9_venus = payload.d9_rasi_by_planet.get("VENUS")
        if d9_venus in OWN_SIGN_RASI["VENUS"] or d9_venus == EXALTATION_RASI["VENUS"]:
            score += 6
            supports.append(BiText("D9-ல் சுக்கிரன் நல்ல நிலை.", "Venus is strong in D9."))
            factors.append(
                AstroFactor(
                    key="d9_venus",
                    status="SUPPORT",
                    detail=BiText("D9 சுக்கிரன் உறவு தரத்தை உறுதிப்படுத்துகிறது.", "D9 Venus reinforces relationship quality."),
                )
            )
        # 7th lord's own navamsa dignity — the classical D9 confirmation
        # of the 7th bhava itself, not just of the karaka.
        d9_seventh_lord = payload.d9_rasi_by_planet.get(seventh_lord)
        if d9_seventh_lord is not None and seventh_lord != "VENUS":
            _d9_lord_dignity = _dignity_label(seventh_lord, d9_seventh_lord)
            if _d9_lord_dignity in {"EXALTED", "OWN"}:
                score += 4
                supports.append(BiText(
                    "7ம் அதிபதி நவாம்சத்தில் வலுவாக உள்ளார்.",
                    "The 7th lord is strong in navamsa (D9).",
                ))
                factors.append(AstroFactor(
                    key="d9_seventh_lord",
                    status="SUPPORT",
                    detail=BiText(
                        ta=f"நவாம்சத்தில் 7ம் அதிபதி ({planet_ta(seventh_lord)}) சிறந்த நிலையில் — திருமண வாக்கு உறுதிப்படுகிறது.",
                        en=f"The 7th lord ({planet_en(seventh_lord)}) holds strong dignity in D9 — the marriage promise is reinforced.",
                    ),
                ))
            elif _d9_lord_dignity == "DEBILITATED":
                score -= 4
                challenges.append(BiText(
                    "7ம் அதிபதி நவாம்சத்தில் நீச நிலையில் உள்ளார்.",
                    "The 7th lord is debilitated in navamsa (D9).",
                ))
                factors.append(AstroFactor(
                    key="d9_seventh_lord",
                    status="CAUTION",
                    detail=BiText(
                        ta=f"நவாம்சத்தில் 7ம் அதிபதி ({planet_ta(seventh_lord)}) நீசம் — D1 பலம் இருந்தாலும் எச்சரிக்கை தேவை.",
                        en=f"The 7th lord ({planet_en(seventh_lord)}) is debilitated in D9 — read D1 strength with caution.",
                    ),
                ))

    if payload.d9_rasi_by_planet is not None:
        d9_venus = payload.d9_rasi_by_planet.get("VENUS")
        d1_venus_strong = venus_rasi in OWN_SIGN_RASI["VENUS"] or venus_rasi == EXALTATION_RASI["VENUS"]
        if d9_venus == DEBILITATION_RASI["VENUS"] and d1_venus_strong:
            score -= 2
            supports.append(
                BiText(
                    "\u0bb5\u0bc6\u0bb3\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0bb1 \u0b9a\u0bc2\u0bb4\u0bb2\u0bcd \u0baa\u0bca\u0ba4\u0bc1\u0bb5\u0bbe\u0b95 \u0b86\u0ba4\u0bb0\u0bb5\u0bc1 \u0b89\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1.",
                    "External circumstances remain broadly supportive.",
                )
            )
            challenges.append(
                BiText(
                    "D9-\u0bb2\u0bcd \u0b9a\u0bc1\u0b95\u0bcd\u0b95\u0bbf\u0bb0\u0ba9\u0bcd \u0ba8\u0bc0\u0b9a\u0bae\u0bcd: \u0ba4\u0ba9\u0bbf\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f \u0baa\u0bca\u0bb0\u0bc1\u0ba4\u0bcd\u0ba4\u0bae\u0bcd \u0bae\u0bbe\u0bb1\u0bc1\u0baa\u0b9f\u0bb2\u0bbe\u0bae\u0bcd.",
                    "D9 Venus debility can make personal compatibility vary.",
                )
            )
            factors.append(
                AstroFactor(
                    key="d9_venus_d1_support_d9_debility",
                    status="CAUTION",
                    detail=BiText(
                        "D1-\u0bb2\u0bcd \u0b9a\u0bc1\u0b95\u0bcd\u0b95\u0bbf\u0bb0\u0ba9\u0bcd \u0baa\u0bb2\u0bae\u0bcd \u0b89\u0bb3\u0bcd\u0bb3\u0ba4\u0bbe\u0bb2\u0bcd \u0bb5\u0bc6\u0bb3\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0bb1 \u0b86\u0ba4\u0bb0\u0bb5\u0bc1 \u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd; D9 \u0ba8\u0bbf\u0bb2\u0bc8 \u0ba4\u0ba9\u0bbf\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f \u0b92\u0ba4\u0bcd\u0ba4\u0bbf\u0b9a\u0bc8\u0bb5\u0bc8 \u0bae\u0bbe\u0bb1\u0bcd\u0bb1\u0bb2\u0bbe\u0bae\u0bcd.",
                        "Strong D1 Venus supports circumstances, while D9 suggests compatibility can fluctuate.",
                    ),
                )
            )

    # Connection-match dasha activation (dasha_activation.py): identity with
    # the 7th lord / Venus, but also occupying/aspecting the 7th, lording
    # 2/11, dispositorship of the 7th lord, and Rahu/Ketu node agency.
    # active_dasha_lords is an unordered set, so grade by best connection
    # kind rather than by maha/antar position.
    activation = assess_dasha_activation(
        lagna_rasi=payload.lagna_rasi,
        bhava_house=7,
        dasha_lords=sorted(payload.active_dasha_lords),
        natal_planet_rasis=payload.planets_rasi,
        karakas=("VENUS",),
        related_houses=(2, 11),
    )
    _PRIMARY_KINDS = {"lords_bhava", "lords_related_house", "is_karaka", "occupies_bhava"}
    _kinds = {conn.split(":", 2)[2] for conn in activation.connections}
    dasha_support = "WEAK"
    if _kinds & _PRIMARY_KINDS or any(kind.startswith("node_agent_of_") for kind in _kinds):
        dasha_support = "STRONG"
        score += 10
        supports.append(BiText("தசை ஆதரவு இணைந்துள்ளது.", "Dasha support is aligned."))
    elif activation.activated:
        dasha_support = "PARTIAL"
        score += 5
        supports.append(BiText(
            "தசை அதிபதி 7ம் வீட்டுடன் மறைமுக தொடர்பில் உள்ளார் (பார்வை/ஆதிக்கம்).",
            "The dasha lord connects to the 7th house indirectly (aspect or dispositorship).",
        ))
    else:
        challenges.append(BiText("நடப்பு தசைக்கு 7ம் வீட்டுடன் தொடர்பு இல்லை — தசை ஆதரவு குறைவு.", "The current dasha has no connection to the 7th house — dasha support is weak."))

    jupiter_aspects = get_jupiter_aspects(payload.transit_jupiter_rasi)
    transit_support = "WEAK"
    if payload.transit_jupiter_rasi == seventh_house_rasi or seventh_house_rasi in jupiter_aspects or payload.transit_venus_rasi == seventh_house_rasi:
        transit_support = "STRONG"
        score += 8
        supports.append(BiText("கோசார ஆதரவு உள்ளது.", "Transit support is present."))
    else:
        challenges.append(BiText("கோசார ஆதரவு குறைவு.", "Transit support is limited."))

    if married_harmony_mode:
        # Age range is irrelevant for married users — skip the timing-oriented age check.
        pass
    elif 25 <= payload.age <= 35:
        score += 6
        supports.append(BiText("வயது கட்டம் ஆதரிக்கும் நிலை.", "Age phase is supportive."))
    else:
        challenges.append(BiText("வயது கட்டம் மாறுபட்டு உள்ளது.", "Age phase is outside peak range."))

    if not payload.sevvai_dosham_cancelled:
        if payload.age >= SEVVAI_DOSHAM_SOFTENING_AGE:
            # Traditional softening, not a cancellation — the dosham is still present,
            # but its matching-relevance is treated as naturally reduced past this age.
            score -= 3
            challenges.append(BiText(
                "செவ்வாய் தோஷம் உள்ளது; ஆனால் 28 வயதிற்குப் பின் பாரம்பரிய முறைப்படி தீவிரம் இயற்கையாகவே குறைகிறது.",
                "Sevvai dosham is present, but traditional practice treats its severity as naturally softened past age 28.",
            ))
        else:
            score -= 6
            challenges.append(BiText("செவ்வாய் தோஷம் கவனத்துடன் அணுக வேண்டும்.", "Sevvai dosham requires caution."))
    else:
        supports.append(BiText("செவ்வாய் தோஷ ரத்து காரணம் உள்ளது.", "Sevvai dosham cancellation factors exist."))
    rahu_ketu_label = (payload.rahu_ketu_label or "").upper()
    if rahu_ketu_label in {"STRONG_ACTIVE_RAHU_KETU_DOSHAM", "ACTIVE_RAHU_KETU_DOSHAM"}:
        score -= 5
        challenges.append(BiText("ராகு-கேது தொடர்பு உறவு விஷயங்களில் கூடுதல் கவனம் தேவை என்பதைக் காட்டுகிறது.", "Rahu-Ketu factors suggest added relationship caution."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_CANDIDATE":
        score -= 2
        challenges.append(BiText("ராகு-கேது குறிப்பு நிலை உள்ளது; திட்டமிட்ட அணுகுமுறை பயனுள்ளதாக இருக்கும்.", "Rahu-Ketu candidate signals suggest planning and clarity."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_WITH_NIVARTHI":
        supports.append(BiText("ராகு-கேது நிவர்த்தி காரணங்கள் ஆதரவு தருகின்றன.", "Rahu-Ketu mitigation factors are supportive."))
    score = max(0, min(100, score))
    top_supports = [b.ta for b in supports[:2]] if supports else []
    top_challenges = [b.ta for b in challenges[:2]] if challenges else []
    top_supports_en = [b.en for b in supports[:2]] if supports else []
    top_challenges_en = [b.en for b in challenges[:2]] if challenges else []

    if married_harmony_mode:
        if score >= 70:
            confidence = "HIGH"
            support_phrase = " மற்றும் ".join(top_supports) if top_supports else "பொதுவாக வலுவான அமைப்பு"
            main = (
                f"உங்கள் திருமண பந்தம் இந்த கட்டத்தில் வலுவாக உள்ளது. {support_phrase}. "
                "தசை மற்றும் கோசாரம் உறவு ஒற்றுமைக்கு சாதகமான சூழலை உருவாக்குகின்றன.",
                f"Your marital bond appears strong in this phase. {'; '.join(top_supports_en) if top_supports_en else 'Overall indicators are favourable'}. "
                "Dasha and transit support a harmonious period in your relationship.",
            )
        elif score >= 50:
            confidence = "MEDIUM"
            challenge_phrase = " மற்றும் ".join(top_challenges) if top_challenges else "கொஞ்சம் கவனம் தேவை"
            main = (
                f"உறவு ஒற்றுமைக்கு கொஞ்சம் கவனம் மற்றும் புரிதல் தேவை. {challenge_phrase}. "
                "பொறுமையும் திறந்த உரையாடலும் நல்ல பலன் தரும்.",
                f"Your relationship calls for mindful attention. {'; '.join(top_challenges_en) if top_challenges_en else 'Some areas need care'}. "
                "Patience and open communication will strengthen the bond.",
            )
        else:
            confidence = "LOW"
            challenge_phrase = " மற்றும் ".join(top_challenges) if top_challenges else "சில சவால்கள் உள்ளன"
            main = (
                f"இந்த கட்டத்தில் திருமண உறவில் பொறுமையும் மரியாதையும் முக்கியம். {challenge_phrase}. "
                "இணை நலனில் கவனம் செலுத்துவது சிறந்த பாதை.",
                f"Patience and mutual respect are key in your marital relationship now. {'; '.join(top_challenges_en) if top_challenges_en else 'Some challenges need attention'}. "
                "Focusing on your partner's well-being is the better path.",
            )
    elif score >= 70:
        confidence = "HIGH"
        support_phrase = "குறிப்பாக " + " மற்றும் ".join(top_supports) if top_supports else "பொதுவாக நல்ல அமைப்பு உள்ளது"
        main = (
            f"திருமண விஷயங்களில் ஆதரவான நேரம் தெரிகிறது. {support_phrase}. "
            "தசை மற்றும் கோசாரம் இணைந்து இந்த சாதகமான கட்டத்தை உருவாக்குகின்றன.",
            f"The current phase appears supportive for marriage matters. {'; '.join(top_supports_en) if top_supports_en else 'General indicators are favourable'}. "
            "Dasha and transit together create this favourable window.",
        )
    elif score >= 50:
        confidence = "MEDIUM"
        support_phrase = " மற்றும் ".join(top_supports) if top_supports else ""
        challenge_phrase = "ஆனால் " + " மற்றும் ".join(top_challenges) if top_challenges else "சில கவலைகள் உள்ளன"
        main = (
            f"திருமண சிக்னல்கள் கலந்த நிலையில் உள்ளன. {support_phrase + ' ' if support_phrase else ''}{challenge_phrase}. "
            "திட்டமிட்ட அணுகுமுறை மற்றும் பொறுமை நல்ல பலன் தரும்.",
            f"Marriage indicators are mixed. {'; '.join(top_supports_en) if top_supports_en else ''} {'but ' + '; '.join(top_challenges_en) if top_challenges_en else ''}. "
            "A planned approach with patience will yield better results.",
        )
    else:
        confidence = "LOW"
        challenge_phrase = "முக்கியமாக " + " மற்றும் ".join(top_challenges) if top_challenges else "தற்போதைய நிலை கடினமாக உள்ளது"
        main = (
            f"திருமண முடிவுகளில் அவசரம் தவிர்க்கவும். {challenge_phrase}. "
            "இந்த கட்டத்தில் நிலைமையை நிலைநிறுத்துவதே சிறந்த பாதை.",
            f"Avoid haste in marriage decisions. {'; '.join(top_challenges_en) if top_challenges_en else 'Conditions need stabilising'}. "
            "Consolidating your situation is the better path right now.",
        )

    band: str | None = None
    if gate is not None:
        band_enum = combine_gate_and_timing(gate, score)
        band = band_enum.value
        if get_flag("reasoning_bands"):
            # Phase 2 (D2): one confidence vocabulary — legacy tier derives
            # from the band instead of a parallel score-band table.
            confidence = band_to_legacy_confidence(band_enum)
        # WEAK gate caps the final confidence at MEDIUM (band ≤ LIKELY, D1) —
        # stricter than the plain band→legacy map, kept from PR-1.
        if gate.grade is GateGrade.WEAK and confidence == "HIGH":
            confidence = "MEDIUM"

    # Phase 5 (D6, P0-4): LOW-confidence causal chain from the challenges
    # already identified above, mirroring life_areas_service's rule (chain
    # only for LOW confidence, never for a genuinely strong reading).
    causal_chain: BiText | None = None
    if bool(get_flag("reasoning_chart_signature")) and confidence == "LOW" and challenges:
        chain = render_causal_chain(
            steps=challenges[:2],
            conclusion=BiText(ta=main[0], en=main[1]),
        )
        causal_chain = BiText(ta=chain.ta, en=chain.en)

    return _safety_checked(LifeAreaPrediction(
        life_area="marriage",
        main_prediction_ta=main[0],
        main_prediction_en=main[1],
        astrological_factors=factors,
        dasha_support=dasha_support,
        transit_support=transit_support,
        timing_window_start=payload.as_of,
        timing_window_end=date(payload.as_of.year, 12, 31),
        confidence=confidence,
        challenges=challenges,
        supports=supports,
        band=band,
        chart_signature=_compute_chart_signature(payload),
        causal_chain=causal_chain,
    ))
