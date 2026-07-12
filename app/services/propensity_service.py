"""Propensity orchestration — assembles chart input, runs the 13 signature
evaluators, grades each into an ordinal level, and applies age-gating and
sensitive-tier framing.

Grading follows the reasoning-kernel doctrine: an ordinal LEVEL, never a
percentage (D2); a QUIET chart is silence, not denial (D3); caution levels
never read as doom (D6).
"""
from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import date

from app.calculations import propensities as P
from app.calculations.propensities import PlanetView, PropensityChartInput, Signals, _Reader
from app.reasoning.verdict import Band
from app.services.life_area_prediction_models import BiText
from app.services.propensity_models import (
    DISCLAIMER_FERTILITY,
    DISCLAIMER_LEGAL,
    DISCLAIMER_LOSS,
    DISCLAIMER_SAFETY,
    DISCLAIMER_WELLBEING,
    CautionLevel,
    ChanceLevel,
    PropensityBundle,
    PropensityCategory,
    PropensityResult,
    PropensityTier,
)

Cat = PropensityCategory
Tier = PropensityTier


@dataclass(frozen=True, slots=True)
class _TimingSpec:
    """Which house + karaka a topic's real timing window (Phase 2) is judged
    against — the same primary-house/karaka pairing the plan's Part 3 grid
    assigns that topic, so the gochara + SAV-bindu gate reads the question the
    card is actually asking."""

    house: int
    karaka: str


@dataclass(frozen=True, slots=True)
class _Spec:
    key: str
    category: PropensityCategory
    tier: PropensityTier
    title: BiText
    topic: BiText              # short noun-phrase used to compose the summary
    evaluator: object          # Callable[[_Reader], Signals]
    age_min: int = 0
    age_max: int = 200
    disclaimer: BiText | None = None
    show_support_resources: bool = False
    timing: _TimingSpec | None = None


# ── Registry — the 13 propensities, order = display order ────────────────────

_REGISTRY: list[_Spec] = [
    _Spec("love", Cat.RELATIONSHIPS, Tier.CHANCE,
          BiText("காதல் / அன்பு வாய்ப்பு", "Love & romance"),
          BiText("காதல் வாய்ப்பு", "the chance of romance"),
          P.eval_love, age_min=15, timing=_TimingSpec(house=5, karaka="VENUS")),
    _Spec("relationship_strain", Cat.RELATIONSHIPS, Tier.CAUTION,
          BiText("உறவு அழுத்த காலங்கள்", "Relationship-strain seasons"),
          BiText("உறவில் அழுத்தம்", "strain in close bonds"),
          P.eval_breakup, age_min=15,
          disclaimer=BiText(
              "இது ஒரு போக்கு மட்டுமே — உங்கள் தேர்வுகளே உறவை வடிவமைக்கும்.",
              "This is a tendency only — your choices shape the bond far more.")),
    _Spec("higher_education", Cat.EDUCATION, Tier.CHANCE,
          BiText("உயர் கல்வி வாய்ப்பு", "Higher-education chances"),
          BiText("உயர் கல்வி", "higher education"),
          P.eval_higher_education, timing=_TimingSpec(house=9, karaka="JUPITER")),
    _Spec("dropout_risk", Cat.EDUCATION, Tier.CAUTION,
          BiText("படிப்பு தொடர்ச்சி கவனம்", "Study-continuity watch"),
          BiText("படிப்பை முடிப்பது", "completing formal study"),
          P.eval_dropout_risk, age_max=35,
          disclaimer=BiText(
              "இது ஒரு எச்சரிக்கை மட்டுமே — சரியான ஆதரவுடன் இதை எளிதில் கடக்கலாம்.",
              "This is a heads-up only — with the right support it is easily navigated.")),
    _Spec("career_mode", Cat.CAREER, Tier.CHANCE,
          BiText("தொழில் இயல்பு: சொந்த vs வேலை", "Work style: enterprise vs salaried"),
          BiText("உங்கள் தொழில் இயல்பு", "your natural work style"),
          P.eval_career_mode, age_min=16),
    _Spec("government_job", Cat.CAREER, Tier.CHANCE,
          BiText("அரசு வேலை வாய்ப்பு", "Government-service chances"),
          BiText("அரசு வேலை", "a government-service path"),
          P.eval_government_job, age_min=16, timing=_TimingSpec(house=10, karaka="SUN")),
    _Spec("job_disruption", Cat.CAREER, Tier.CAUTION,
          BiText("தொழில் மாற்ற கவனம்", "Career-transition watch"),
          BiText("வேலை நிலைத்தன்மை", "work steadiness"),
          P.eval_job_loss, age_min=18,
          disclaimer=BiText(
              "இது ஒரு முன்னெச்சரிக்கை காலம் மட்டுமே — தயாரிப்பே பாதுகாப்பு.",
              "This flags a season for foresight only — preparation is the protection."),
          timing=_TimingSpec(house=10, karaka="SATURN")),
    _Spec("child_timing", Cat.WELLBEING, Tier.CAUTION,
          BiText("குழந்தை பேறு நேரம்", "Timing of children"),
          BiText("குழந்தை பேறு நேரம்", "the timing of children"),
          P.eval_child_delay, age_min=21, age_max=50,
          disclaimer=DISCLAIMER_FERTILITY, timing=_TimingSpec(house=5, karaka="JUPITER")),
    _Spec("accident_care", Cat.WELLBEING, Tier.CAUTION,
          BiText("பாதுகாப்பு கவன காலங்கள்", "Safety-care seasons"),
          BiText("உடல் பாதுகாப்பு", "physical safety"),
          P.eval_accident_care, disclaimer=DISCLAIMER_SAFETY,
          timing=_TimingSpec(house=8, karaka="MARS")),
    _Spec("emotional_load", Cat.WELLBEING, Tier.CAUTION,
          BiText("உணர்வு சுமை காலங்கள்", "Emotional-load seasons"),
          BiText("உணர்வு நலம்", "emotional wellbeing"),
          P.eval_depression_vuln, disclaimer=DISCLAIMER_WELLBEING,
          show_support_resources=True),
    _Spec("loneliness", Cat.WELLBEING, Tier.CAUTION,
          BiText("தனிமை உணர்வு காலங்கள்", "Seasons of feeling alone"),
          BiText("சமூக தொடர்பு", "social connection"),
          P.eval_loneliness, disclaimer=DISCLAIMER_WELLBEING,
          show_support_resources=True),
    _Spec("conviction", Cat.WELLBEING, Tier.CHANCE,
          BiText("உறுதி மற்றும் திறந்த மனது", "Conviction & open-mindedness"),
          BiText("உங்கள் உறுதியான குணம்", "your firmness of will"),
          P.eval_stubbornness),
    _Spec("resilience_watch", Cat.WELLBEING, Tier.CAUTION,
          BiText("முன்னெச்சரிக்கை காலங்கள்", "Prudence seasons"),
          BiText("வாழ்க்கை முன்னெச்சரிக்கை", "life prudence"),
          P.eval_severe_loss, age_min=18, disclaimer=DISCLAIMER_LOSS,
          timing=_TimingSpec(house=8, karaka="SATURN")),

    # ── Phase 3 — filling the dark houses ─────────────────────────────────
    _Spec("marriage_harmony", Cat.MARRIAGE, Tier.CHANCE,
          BiText("திருமண இணக்க வாய்ப்பு", "Married-life harmony"),
          BiText("திருமண இணக்கம்", "harmony in married life"),
          P.eval_marriage_harmony, age_min=18),
    _Spec("business_partnership_fit", Cat.MARRIAGE, Tier.CHANCE,
          BiText("வணிக கூட்டாண்மை தகுதி", "Business-partnership fit"),
          BiText("வணிக கூட்டாண்மை", "a business partnership"),
          P.eval_business_partnership_fit, age_min=18),
    _Spec("foreign_settlement", Cat.LIFE_PATH, Tier.CHANCE,
          BiText("வெளிநாட்டு குடியேற்ற வாய்ப்பு", "Foreign travel / settlement chance"),
          BiText("வெளிநாட்டு குடியேற்றம்", "foreign travel or settlement"),
          P.eval_foreign_settlement, age_min=16, timing=_TimingSpec(house=12, karaka="RAHU")),
    _Spec("income_growth", Cat.WEALTH, Tier.CHANCE,
          BiText("வருமான வளர்ச்சி வாய்ப்பு", "Income-growth chances"),
          BiText("வருமான வளர்ச்சி", "income growth"),
          P.eval_income_growth, age_min=18, timing=_TimingSpec(house=11, karaka="JUPITER")),
    _Spec("savings_capacity", Cat.WEALTH, Tier.CHANCE,
          BiText("சேமிப்பு திறன்", "Savings capacity"),
          BiText("சேமிக்கும் திறன்", "your capacity to save"),
          P.eval_savings_capacity, age_min=18),
    _Spec("inheritance_lean", Cat.WEALTH, Tier.CHANCE,
          BiText("பரம்பரை / எதிர்பாராத ஆதாய சாய்வு", "Inheritance / unearned-gains lean"),
          BiText("பரம்பரை ஆதாயம்", "inherited or unearned gains"),
          P.eval_inheritance_lean, age_min=18),
    _Spec("litigation_season", Cat.LIFE_PATH, Tier.CAUTION,
          BiText("சர்ச்சை / வழக்கு கவன காலங்கள்", "Dispute / litigation seasons"),
          BiText("சர்ச்சைகளை கையாளுதல்", "handling disputes"),
          P.eval_litigation_season, age_min=18, disclaimer=DISCLAIMER_LEGAL),
    _Spec("debt_watch", Cat.LIFE_PATH, Tier.CAUTION,
          BiText("கடன் சுமை கவன காலங்கள்", "Debt-burden watch"),
          BiText("கடன் நிலைமை", "your debt position"),
          P.eval_debt_watch, age_min=18, disclaimer=DISCLAIMER_LOSS),
    _Spec("competitive_edge", Cat.CAREER, Tier.CHANCE,
          BiText("போட்டி / தேர்வு வாய்ப்பு", "Competitive-exam / rivalry edge"),
          BiText("போட்டித் தேர்வு", "competitive exams and contests"),
          P.eval_competitive_edge, age_min=16),
    _Spec("swabhava_profile", Cat.WELLBEING, Tier.PROFILE,
          BiText("இயல்பு சுயவிவரம் (ஸ்வபாவம்)", "Temperament profile (Swabhava)"),
          BiText("உங்கள் இயல்பு", "your natural temperament"),
          P.eval_swabhava_profile),
]


# ── Grading ──────────────────────────────────────────────────────────────────

_CHANCE_BAND = {
    ChanceLevel.STRONG: Band.STRONG,
    ChanceLevel.PROMISING: Band.LIKELY,
    ChanceLevel.MIXED: Band.MIXED,
    ChanceLevel.LIMITED: Band.WEAK,
    ChanceLevel.QUIET: Band.SILENT,
}
_CAUTION_BAND = {
    CautionLevel.STEADY: Band.LIKELY,
    CautionLevel.WATCHFUL: Band.MIXED,
    CautionLevel.EXTRA_CARE: Band.WEAK,
    CautionLevel.QUIET: Band.SILENT,
}


def _grade_chance(s: Signals) -> ChanceLevel:
    if not s.has_signal:
        return ChanceLevel.QUIET
    if s.pro >= 3 and s.con <= 1:
        return ChanceLevel.STRONG
    if s.pro >= 2 and s.pro > s.con:
        return ChanceLevel.PROMISING
    if s.pro >= 1 and s.pro == s.con:
        return ChanceLevel.MIXED
    if s.pro > s.con:
        return ChanceLevel.PROMISING
    if s.con > s.pro:
        return ChanceLevel.LIMITED
    return ChanceLevel.MIXED


def _grade_caution(s: Signals) -> CautionLevel:
    if not s.has_signal:
        return CautionLevel.QUIET
    if s.con == 0:
        return CautionLevel.STEADY
    net = s.con - s.pro
    if net >= 2:
        return CautionLevel.EXTRA_CARE
    if net >= 1:
        return CautionLevel.WATCHFUL
    return CautionLevel.STEADY


# Summary composition — level phrasing × the spec's topic phrase.
_CHANCE_PHRASE: dict[ChanceLevel, tuple[str, str]] = {
    ChanceLevel.STRONG: ("உங்கள் ஜாதகம் இதற்கு வலுவாக ஆதரவளிக்கிறது.",
                         "your chart leans strongly in favour."),
    ChanceLevel.PROMISING: ("நம்பிக்கைக்குரிய, ஆதரிக்கத்தக்க போக்கு.",
                            "a promising, supportable leaning."),
    ChanceLevel.MIXED: ("கலவையான சமிக்ஞைகள் — முயற்சி முடிவை சாய்க்கும்.",
                        "signals are mixed — effort tilts the outcome."),
    ChanceLevel.LIMITED: ("இயற்கை ஆதரவு குறைவு — கூடுதல் முயற்சி தேவை.",
                          "natural support is limited — it will take extra effort."),
    ChanceLevel.QUIET: ("இங்கு ஜாதகம் அமைதி — வலுவான சமிக்ஞை இல்லை.",
                        "the chart is quiet here — no strong signal either way."),
}
_CAUTION_PHRASE: dict[CautionLevel, tuple[str, str]] = {
    CautionLevel.STEADY: ("நன்கு ஆதரிக்கப்பட்டது — கவலைக்கு இடமில்லை.",
                          "well supported — little to watch."),
    CautionLevel.WATCHFUL: ("கவனமாக இருக்க வேண்டிய காலம்.",
                            "a season to stay mindful."),
    CautionLevel.EXTRA_CARE: ("கூடுதல் கவனமும் ஆதரவும் தேவைப்படும் காலம்.",
                              "a season that deserves extra care and support."),
    CautionLevel.QUIET: ("இங்கு ஜாதகம் அமைதியாக உள்ளது.",
                         "the chart is quiet here."),
}


# career_mode is directional, not a strength — its own small grader.
def _career_direction(s: Signals) -> tuple[str, BiText]:
    if not s.has_signal:
        return "QUIET", BiText(
            "இங்கு ஜாதகம் அமைதி — இரு பாதைகளும் திறந்தே உள்ளன.",
            "The chart is quiet here — both paths stay open to you.")
    enterprise, service = s.pro, s.con
    if enterprise >= service + 2:
        return "ENTERPRISE_LEANING", BiText(
            "உங்கள் ஜாதகம் சுயமுயற்சி/வணிகப் பாதையை நோக்கி சாய்கிறது.",
            "Your chart leans toward an independent / enterprise path.")
    if service >= enterprise + 2:
        return "SALARIED_LEANING", BiText(
            "உங்கள் ஜாதகம் நிலையான வேலை/சேவைப் பாதையை நோக்கி சாய்கிறது.",
            "Your chart leans toward a steady salaried / service path.")
    return "BALANCED", BiText(
        "இரு பாதைகளும் உங்களுக்கு பொருந்தும் — உங்கள் விருப்பமே முடிவு.",
        "Both paths suit you well — the choice is genuinely yours.")


_PROFILE_SUMMARY = BiText(
    "உங்கள் லக்னம், சந்திரன், புதன் அடிப்படையிலான ஒரு இயல்பு சுருக்கம் — இவை போக்குகள், தீர்ப்புகள் அல்ல.",
    "A temperament synthesis from your Lagna, Moon, and Mercury — tendencies, not verdicts.")


def _summary(spec: _Spec, level_val: str) -> BiText:
    topic = spec.topic
    if spec.tier is Tier.CHANCE:
        ta, en = _CHANCE_PHRASE[ChanceLevel(level_val)]
    else:
        ta, en = _CAUTION_PHRASE[CautionLevel(level_val)]
    return BiText(ta=f"{topic.ta} — {ta}", en=f"Regarding {topic.en}, {en}")


# ── Input assembly from a persisted chart snapshot ───────────────────────────

def _house_from(ref_rasi: int, rasi: int) -> int:
    return ((rasi - ref_rasi) % 12) + 1


def build_chart_input(
    *,
    lagna_rasi: int,
    planets: list,                 # snapshot.data.planets (PlanetPosition-like)
    active_dasha_lords: set[str],
    maha_lord: str,
    antar_lord: str,
    yogas_present: set[str],
    doshams_active: set[str],
    age: int,
    natal_moon_rasi: int,
    transit_saturn_rasi: int | None,
    vargas: dict[str, dict[str, int]] | None = None,
    transit_house_by_planet: dict[str, int] | None = None,
    sav_bindus: dict[int, int] | None = None,
    current_antardasha_start: date | None = None,
    current_antardasha_end: date | None = None,
) -> PropensityChartInput:
    pv: dict[str, PlanetView] = {}
    for p in planets:
        pv[p.graha] = PlanetView(
            rasi=p.rasi,
            house=p.house_from_lagna,
            d9_rasi=p.d9_rasi,
            combust=bool(getattr(p, "is_combust", False)),
            strength=int(getattr(p, "strength_score", 50) or 50),
        )
    saturn_house = None
    sade_sati = False
    if transit_saturn_rasi is not None:
        saturn_house = _house_from(lagna_rasi, transit_saturn_rasi)
        sade_sati = _house_from(natal_moon_rasi, transit_saturn_rasi) in (12, 1, 2)
    return PropensityChartInput(
        lagna_rasi=lagna_rasi,
        planets=pv,
        active_dasha_lords=frozenset(active_dasha_lords),
        maha_lord=maha_lord,
        antar_lord=antar_lord,
        yogas_present=frozenset(yogas_present),
        doshams_active=frozenset(doshams_active),
        age=age,
        sade_sati_active=sade_sati,
        saturn_transit_house=saturn_house,
        vargas=vargas or {},
        transit_house_by_planet=transit_house_by_planet or {},
        sav_bindus=sav_bindus or {},
        current_antardasha_start=current_antardasha_start,
        current_antardasha_end=current_antardasha_end,
    )


# ── Public entry point ───────────────────────────────────────────────────────

_DEFER_EARLY = BiText(
    "இந்த பகுதி பிற்கால வாழ்க்கை கட்டத்தில் மிகவும் பொருத்தமாகும்.",
    "This area becomes more relevant in a later life stage.")
_DEFER_LATE = BiText(
    "இந்த பகுதி இப்போதைய வாழ்க்கை கட்டத்திற்கு முதன்மை கவனம் அல்ல.",
    "This area is no longer the primary focus for your current life stage.")


def assess_propensities(
    chart_input: PropensityChartInput,
    *,
    relationship_to_owner: str = "self",
    life_stage: str = "young_adult",
    as_of: date | None = None,
) -> PropensityBundle:
    reader = _Reader(chart_input)
    age = chart_input.age
    results: list[PropensityResult] = []

    for spec in _REGISTRY:
        deferred = age < spec.age_min or age > spec.age_max
        deferred_reason = None
        if deferred:
            deferred_reason = _DEFER_EARLY if age < spec.age_min else _DEFER_LATE

        signals: Signals = spec.evaluator(reader)

        if spec.key == "career_mode":
            # Directional verdict: relabel the "service" factors (emitted as
            # CAUTION for counting) to NEUTRAL — a service fit is not a risk.
            level_val, summary = _career_direction(signals)
            band_val = Band.SILENT.value if level_val == "QUIET" else Band.LIKELY.value
            factors = [
                replace(f, status="NEUTRAL") if f.status == "CAUTION" else f
                for f in signals.factors
            ]
        elif spec.tier is Tier.PROFILE:
            # Descriptive synthesis card — no pro/con grading, always shown.
            level_val, band_val = "PROFILE", Band.LIKELY.value
            summary = _PROFILE_SUMMARY
            factors = signals.factors
        elif spec.tier is Tier.CHANCE:
            clevel = _grade_chance(signals)
            level_val, band_val = clevel.value, _CHANCE_BAND[clevel].value
            summary = _summary(spec, level_val)
            factors = signals.factors
        else:
            klevel = _grade_caution(signals)
            level_val, band_val = klevel.value, _CAUTION_BAND[klevel].value
            summary = _summary(spec, level_val)
            factors = signals.factors

        # ── Phase 2: concrete timing dates ────────────────────────────────
        # Only ever narrows an ALREADY-fired prose window (never invents one),
        # and only when the tier's own polarity actually calls for a date: a
        # CHANCE card needs its support to outweigh its caution, a CAUTION
        # card needs an actual risk factor (never on a STEADY/risk-free read).
        timing_start: date | None = None
        timing_end: date | None = None
        if spec.timing is not None and signals.window is not None and not deferred and as_of is not None:
            eligible = (
                signals.pro > 0 and signals.pro >= signals.con
                if spec.tier is Tier.CHANCE
                else signals.con > 0
            )
            if eligible:
                window = reader.timing_window(spec.timing.house, spec.timing.karaka, as_of)
                if window is not None:
                    timing_start, timing_end = window

        results.append(
            PropensityResult(
                key=spec.key,
                category=spec.category,
                tier=spec.tier,
                title=spec.title,
                level=level_val,
                summary=summary,
                factors=factors,
                what_helps=signals.what_helps,
                window_note=signals.window,
                timing_window_start=timing_start,
                timing_window_end=timing_end,
                disclaimer=spec.disclaimer,
                show_support_resources=spec.show_support_resources,
                deferred=deferred,
                deferred_reason=deferred_reason,
                band=band_val,
            )
        )

    return PropensityBundle(
        generated_for=relationship_to_owner,
        life_stage=life_stage,
        results=results,
    )
