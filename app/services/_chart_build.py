"""Assemble ChartCalculateResponse from a birth profile or a persisted Chart record."""
from __future__ import annotations

from collections.abc import Mapping
from datetime import UTC, date, datetime, time
from functools import lru_cache
from typing import Any
from uuid import UUID, uuid4

from app.calculations.astro import (
    degree_in_rasi,
    local_datetime_to_utc,
    nakshatra_from_degree,
    navamsa_rasi_from_degree,
    pada_from_degree,
    utc_datetime_to_julian_day,
)
from app.calculations.birth_conditions import (
    birth_condition_strength_penalties,
    detect_birth_conditions,
    sun_rasi_day_bounds,
    tithi_number_from_longitudes,
)
from app.calculations.chart_strength import (
    apply_holistic_synthesis,
    compute_strength_breakdown,
    d9_dignity_label,
    detect_planetary_wars,
    explain_natal_planet_score,
)
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.ephemeris import calculate_lagna_degree, calculate_sidereal_planets
from app.calculations.equal_bhava import compute_equal_bhava
from app.calculations.functional_nature import get_functional_nature
from app.calculations.functional_status import owned_houses
from app.calculations.panchangam import NAKSHATRA_NAMES, calculate_daily_panchangam
from app.calculations.transits import RASI_NAMES, is_cazimi, is_combust
from app.calculations.yoga_activation import activation_tier, key_planets_for, yoga_activation_score
from app.calculations.yoga_effects import yoga_effect
from app.calculations.yogas import detect_yogas_and_doshams
from app.constants.versions import CHART_CALCULATION_VERSION
from app.models import Chart
from app.schemas.birth_profiles import BirthProfileResponse
from app.schemas.charts import (
    AyanamsaInfo,
    ChartBirthCondition,
    ChartCalculateResponse,
    ChartCalculateResponseData,
    ChartDoshamInsight,
    ChartNakshatraCaution,
    ChartYogaInsight,
    DoshamReferenceHouse,
    LagnaPosition,
    PlanetPosition,
    PlanetScoreTerm,
    ResponseMeta,
    YogaPeakWindow,
)
from app.services._chart_planets import (
    _NATAL_GRAHAS,
    _aspect_counts,
    _compute_nakshatra_analysis,
    _compute_vargas,
    _mandhi_longitude,
    _mandhi_planet_position,
    _paksha_is_shukla,
    _planet_position_from_snapshot,
    _speed_ratio,
    _varga_reliability,
    resolve_daytime_birth_for_profile,
)
from app.services.feature_flags import current_doctrine_options, get_flag

# The chart engine's version now lives in app/constants/versions.py, with its
# per-revision notes, because `app.schemas.charts` needs it too and cannot import
# a service. Re-exported here under the old name: fifteen modules import
# `DEFAULT_CALCULATION_VERSION` from this one, and the indirection is cheaper
# than touching all of them.
#
# It no longer claims that bumping it invalidates stored charts. It never did:
# `load_persisted_chart_response` rebuilds from the stored rows without
# consulting the version, and every caller that passed the old frozen literal
# compared a string that could not change. See the versions module docstring.
DEFAULT_CALCULATION_VERSION = CHART_CALCULATION_VERSION
RASI_NUMBERS = {name: number for number, name in RASI_NAMES.items()}
PLANET_ORDER = {
    "SUN": 0,
    "MOON": 1,
    "MARS": 2,
    "MERCURY": 3,
    "JUPITER": 4,
    "VENUS": 5,
    "SATURN": 6,
    "RAHU": 7,
    "KETU": 8,
    "MANDHI": 9,
}


def _public_planets(planets: list[PlanetPosition]) -> list[PlanetPosition]:
    """Return the API planet set.

    Maandhi is exposed here as a tenth entry, same shape as Rahu/Ketu — per
    docs/THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md Phase 1.2, classical Tamil
    Thirukanitham practice reads an upagraha's house placement and aspects like
    a graha's. Previously this function filtered Maandhi out of every consumer
    of ChartCalculateResponse; it no longer does.

    It is **Maandhi, not Gulika.** The owner ruling of 2026-09-29 adopted the
    Uttara-Kalamrita distinction: Maandhi is the proportional nazhigai measure in
    `_chart_planets.MAANDHI_DAY_NAZHIGAI`, and Gulika is Saturn's eighth-part,
    whose tables live with Gulika in panchangam.py (`KULIGAI_SLOT`). Nothing
    here derives one from the other. This docstring said "Mandhi (Gulika)" for
    months after that ruling, which is how a reader concludes the code still
    aliases them.

    Note that a graha rule does not automatically extend to Maandhi just because
    it fits inside `PlanetPosition`. The natal scoring paths select on the
    positive set `_chart_planets._NATAL_GRAHAS` rather than excluding Maandhi by
    name, so a second upagraha can be added without auditing every consumer.
    """
    return planets


def _value(profile: Any, name: str, default: Any = None) -> Any:
    return getattr(profile, name, default)


def _warning_messages(profile: Any) -> list[str]:
    warnings: list[str] = []
    confidence = _value(profile, "birth_time_confidence_minutes", 0) or 0
    if confidence:
        warnings.append(
            f"Birth time confidence is +/- {confidence} minutes; Lagna near boundary should be verified."
        )
    return warnings


def _birth_datetime_utc(profile: Any) -> datetime:
    birth_datetime_utc = _value(profile, "birth_datetime_utc")
    if birth_datetime_utc is not None:
        if birth_datetime_utc.tzinfo is None:
            return birth_datetime_utc.replace(tzinfo=UTC)
        return birth_datetime_utc.astimezone(UTC)
    birth_time_local = _value(profile, "birth_time_local")
    if birth_time_local is None:
        raise ValueError("Birth time is required to calculate a chart.")
    birth_datetime_local = datetime.combine(_value(profile, "birth_date_local"), _value(profile, "birth_time_local"))
    return local_datetime_to_utc(birth_datetime_local, _value(profile, "birth_timezone"))


@lru_cache(maxsize=1024)
def _birth_panchangam_signature_items(
    birth_date_local: date,
    birth_timezone: str,
    birth_latitude: float,
    birth_longitude: float,
) -> tuple[tuple[str, object], ...]:
    """The birth day's panchangam signature, memoised on the four values it reads.

    Deliberately keyed on scalars rather than the profile object: this is a pure
    function of the birth moment and place, none of which can change for a chart,
    so the answer is good for the life of the process.

    It is worth memoising because it is expensive and called far more often than
    it looks. `load_persisted_chart_response` calls it on every load, and one
    dashboard-bundle request loads the chart **eight** times — the bundle itself
    plus each sub-service that re-loads it independently. Profiled 2026-09-09:
    32,338 swisseph calls per bundle, 7.4 s of 10.6 s total, and ~7.8 s of that
    was eight identical recomputations of this one signature.

    Note the `use_cache=False` below is intentional and stays: the panchangam
    row cache is keyed for daily-guidance reads, and a birth date is a one-off
    lookup that would only pollute it. This cache is the right layer.

    Returns items rather than a dict so the caller can build a fresh mapping and
    no caller can mutate what the next one receives.
    """
    from zoneinfo import ZoneInfo

    from app.calculations.tamil_calendar import format_tamil_date

    snapshot = calculate_daily_panchangam(
        date_local=birth_date_local,
        timezone_name=birth_timezone,
        latitude=birth_latitude,
        longitude=birth_longitude,
        session=None,
        use_cache=False,
    )

    tz = ZoneInfo(birth_timezone)
    sunrise_local = snapshot.sunrise.astimezone(tz)
    sunset_local = snapshot.sunset.astimezone(tz)
    tamil_date_ta, tamil_date_en = format_tamil_date(
        birth_date_local,
        birth_timezone,
        birth_latitude,
        birth_longitude,
    )

    from app.services._chart_planets import _nakshatra_gana, _nakshatra_nadi
    return tuple({
        "vaaram": snapshot.weekday,
        "vaaram_lord": snapshot.weekday_lord,
        "tithi": snapshot.tithi_name,
        "tithi_paksha": snapshot.tithi_paksha,
        "nakshatra": snapshot.nakshatra_name,
        "nakshatra_pada": snapshot.nakshatra_pada,
        "yogam": snapshot.yoga_name,
        "karanam": snapshot.karana_name,
        "is_vishti_karanam": snapshot.karana_name == "VISHTI",
        "gana": _nakshatra_gana(snapshot.nakshatra_number),
        "nadi": _nakshatra_nadi(snapshot.nakshatra_number),
        "sunrise_time": sunrise_local.strftime("%I:%M:%S %p"),
        "sunset_time": sunset_local.strftime("%I:%M:%S %p"),
        "tamil_date_ta": tamil_date_ta,
        "tamil_date_en": tamil_date_en,
    }.items())


def _birth_panchangam_signature(profile: Any) -> dict[str, object]:
    return dict(_birth_panchangam_signature_items(
        _value(profile, "birth_date_local"),
        str(_value(profile, "birth_timezone")),
        float(_value(profile, "birth_latitude")),
        float(_value(profile, "birth_longitude")),
    ))


def _build_birth_conditions(
    planet_positions: list[PlanetPosition],
    birth_time_local: time | None,
    lagna_rasi: int | None = None,
) -> tuple[list[ChartBirthCondition], dict[str, float]]:
    """Assemble the Border-Alert list (and its natal strength penalties) from planets.

    Everything here is derived from the planet longitudes/speeds plus the birth
    time, so it works identically on the fresh-calc and persisted-record paths
    with no extra ephemeris or panchangam call. Returns the display flags plus the
    EC-7.2 per-graha strength-penalty map (empty when no scoring boundary birth is
    present); the caller applies the map to the luminaries via
    ``_apply_birth_condition_penalties``.
    """
    longitudes = {p.graha: p.absolute_longitude for p in planet_positions}
    sun = next((p for p in planet_positions if p.graha == "SUN"), None)
    moon_lon = longitudes.get("MOON")
    if sun is None or moon_lon is None:
        return [], {}

    tithi_number = tithi_number_from_longitudes(sun.absolute_longitude, moon_lon)
    if birth_time_local is None:
        day_fraction = 0.5
    else:
        day_fraction = (
            birth_time_local.hour * 3600 + birth_time_local.minute * 60 + birth_time_local.second
        ) / 86400.0
    sun_start, sun_end = sun_rasi_day_bounds(
        sun.absolute_longitude, sun.speed_deg_per_day, day_fraction
    )
    cazimi_planets = [p.graha for p in planet_positions if p.is_cazimi]

    flags = detect_birth_conditions(
        planet_longitudes=longitudes,
        tithi_number=tithi_number,
        sun_rasi_day_start=sun_start,
        sun_rasi_day_end=sun_end,
        cazimi_planets=cazimi_planets,
        lagna_rasi=lagna_rasi,
    )
    conditions = [
        ChartBirthCondition(
            code=f.code,
            is_present=f.is_present,
            severity=f.severity,
            title_ta=f.title_ta,
            title_en=f.title_en,
            description_ta=f.description_ta,
            description_en=f.description_en,
            detail=f.detail,
        )
        for f in flags
    ]
    return conditions, birth_condition_strength_penalties(flags)


def _apply_birth_condition_penalties(
    planets: list[PlanetPosition],
    penalties: Mapping[str, float],
) -> None:
    """Lower the afflicted luminaries' natal strength for verified boundary births.

    EC-7.2: Grahana/Sankranti births are natal constants, so they are scored once
    here on the persisted natal ``strength_score`` (which daily + prediction read)
    rather than as a flat daily-tone offset. Floored at the same 10 as the scorer;
    the six-fold ``strength_breakdown`` is left untouched, consistent with the
    other score-only natal modifiers (cazimi/gandanta/war are likewise not in it).
    """
    if not penalties:
        return
    for planet in planets:
        penalty = penalties.get(planet.graha)
        if penalty and planet.strength_score is not None:
            planet.strength_score = max(10, int(round(planet.strength_score - penalty)))


def _apply_holistic_strength_synthesis(
    planet_positions: list[PlanetPosition],
    *,
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    combust_planets: frozenset[str] | set[str],
    paksha_is_shukla: bool,
    d9_lagna_rasi: int | None,
) -> None:
    """Flag-gated SECOND PASS refining each base ``strength_score`` with the four
    relational measures the six-bala blend omits — functional lordship, yuti
    (company kept), neecha bhanga, and strength-weighted drishti. Spec:
    docs/THIRUKANITHAM_STRENGTH_SYNTHESIS_2026-07-23.md.

    Shared by BOTH build paths (``_chart_response_from_profile`` and
    ``_chart_response_from_record``) so the fresh-calc / public-tools /
    compatibility path and the persisted-record read can never disagree on
    ``strength_score`` — the C1 fix in
    docs/THIRUKANITHAM_ENGINE_AUDIT_2026-07-23.md. Must run AFTER the base
    per-planet loop (the relational terms read every other planet's base score)
    and BEFORE yoga detection (both paths feed the synthesised strength into
    yoga activation). No-op when the flag is OFF ⇒ scores stay byte-identical to
    the base loop. Mutates ``strength_score`` and the ``synthesis_*``
    transparency keys in place; nothing else is touched.
    """
    if not get_flag("holistic_strength_synthesis"):
        return
    natal = [p for p in planet_positions if p.graha in _NATAL_GRAHAS]
    base_scores = {p.graha: int(p.strength_score) for p in natal if p.strength_score is not None}
    if not base_scores:
        return
    d9_map = {p.graha: p.d9_rasi for p in natal if isinstance(p.d9_rasi, int)}
    functional = {
        p.graha: get_functional_nature(lagna_rasi, p.graha, node_rasi_map=planet_rasi_map).value
        for p in natal
    }
    # Contextual benefics — the same paksha-/combustion-aware classification the
    # drik counter uses (_chart_planets._aspect_counts), so the yuti and drishti
    # sign agrees with the base score's own drik sign.
    benefics = {"JUPITER", "VENUS"}
    if paksha_is_shukla:
        benefics.add("MOON")
    if "MERCURY" not in combust_planets:
        benefics.add("MERCURY")
    synthesis = apply_holistic_synthesis(
        base_scores,
        planet_rasi=planet_rasi_map,
        lagna_rasi=lagna_rasi,
        functional_nature=functional,
        benefic_planets=frozenset(benefics),
        d9_rasi_map=d9_map,
        d9_lagna_rasi=d9_lagna_rasi,
        planet_longitude={p.graha: float(p.absolute_longitude) for p in natal},
        # The same doctrine the yoga detector reads, so the +14 bhanga term and
        # the Neecha Bhanga card follow one set of rules (audit C2).
        doctrine=current_doctrine_options(),
    )
    for p in natal:
        terms = synthesis.get(p.graha)
        if terms is None:
            continue
        p.strength_score = int(terms["score"])
        # Transparency (spec §5): surface the per-term deltas so the UI and
        # tests can show WHY the number moved ("Lagna lord +5, Guru +1").
        if p.strength_breakdown is not None:
            for key in ("functional", "yuti", "drishti", "bhanga", "delta"):
                value = terms[key]
                if value:
                    p.strength_breakdown[f"synthesis_{key}"] = f"{value:+g}"
        # Keep the published breakdown addable. The base terms were computed
        # against the pre-synthesis score; without appending the four relational
        # deltas (plus a residual for the synthesis cap and int() truncation) the
        # column would silently stop summing to the number beside it the moment
        # this flag is switched on.
        if p.score_terms:
            # The base pass may already have left a clamp term. Drop it and
            # recompute one at the end, so the reader sees a single residual row
            # rather than two rows with the same label that only make sense
            # together.
            p.score_terms = [t for t in p.score_terms if t.key != "clamp"]
            for key in ("functional", "yuti", "drishti", "bhanga"):
                value = float(terms[key])
                if value:
                    p.score_terms.append(
                        PlanetScoreTerm(key=f"synthesis_{key}", points=value)
                    )
            residual = p.strength_score - sum(t.points for t in p.score_terms)
            if abs(residual) >= 0.05:
                p.score_terms.append(PlanetScoreTerm(key="clamp", points=residual))


def _current_timeline(birth_jd: float, moon_longitude: float):
    return calculate_vimshottari_timeline(
        birth_jd,
        moon_longitude,
        utc_datetime_to_julian_day(datetime.now(tz=UTC)),
    )


def _current_dasha_lords(birth_jd: float, moon_longitude: float) -> tuple[str, str]:
    timeline = _current_timeline(birth_jd, moon_longitude)
    return timeline.current_mahadasha.lord, timeline.current_antardasha.lord


def _former_groups(item) -> tuple[tuple[str, ...], ...]:
    """One tuple of forming grahas per instance behind this card."""
    if item.former_groups:
        return item.former_groups
    formers = tuple(key_planets_for(item.name, item.key_grahas))
    return (formers,) if formers else ()


def _structural_reach(item, planet_map: Mapping[str, int], lagna_rasi: int) -> int:
    """O-25 (2026-10-05): how much of the chart the yoga's forming grahas reach.

    A Vinaadi tie-break for the Top-3 lists, not classical doctrine — the
    ruling says so, and says lordship first (the subjects the grahas carry),
    occupation next (where results show), then whether the Lagna or its lord
    takes part. Deliberately no kendra/trikona points: those would be one
    generic weight applied across yoga families with different logic. Strength
    is not read here — it is already the earlier key, and reading it again
    would count it twice. Encoded lexicographically in one integer so every
    client compares a number and never re-derives it.
    """
    grahas = [g for g in dict.fromkeys(g for group in _former_groups(item) for g in group) if g in planet_map]
    ruled = set().union(*(owned_houses(lagna_rasi, g) for g in grahas)) if grahas else set()
    occupied = {((planet_map[g] - lagna_rasi) % 12) + 1 for g in grahas}
    return len(ruled) * 100 + len(occupied) * 10 + int(1 in ruled or 1 in occupied)


def _yoga_timing(item, *, maha: str, antar: str, antaram) -> tuple[bool, YogaPeakWindow | None]:
    """The two 2026-09-23 timing refinements, for a yoga already activated.

    * **Strong**: two *distinct* forming planets are the Mahadasha and
      Antardasha lords of the same instance. A planet's own bhukti (maha ==
      antar) is Moderate — swa-bhukti classically gives mixed results, not a
      peak — so a single-former yoga (Hamsa, the yogakaraka) never reaches
      Strong (ruling 2026-09-23, amended).
    * **Peak window**: the running Antaram's lord formed an instance that an
      activating Maha/Antar lord also formed. Never activates on its own.
    """
    groups = [set(g) for g in _former_groups(item)]
    both = maha != antar and any({maha, antar} <= g for g in groups)
    peak = any(antaram.lord in g and (maha in g or antar in g) for g in groups)
    window = (
        YogaPeakWindow(start=antaram.start_date, end=antaram.end_date, antaramLord=antaram.lord)
        if peak else None
    )
    return both, window


def _build_yoga_dosham_insights(
    planets: list[PlanetPosition],
    *,
    lagna_rasi: int,
    moon_rasi: int,
    birth_jd: float,
    gender: str | None = None,
    d9_lagna_rasi: int | None = None,
    equal_bhava_map: dict[str, int] | None = None,
) -> tuple[list[ChartYogaInsight], list[ChartDoshamInsight], list[ChartNakshatraCaution]]:
    planet_map: dict[str, int] = {planet.graha: planet.rasi for planet in planets}
    timeline = _current_timeline(
        birth_jd,
        next(planet.absolute_longitude for planet in planets if planet.graha == "MOON"),
    )
    mahadasha_lord = timeline.current_mahadasha.lord
    antardasha_lord = timeline.current_antardasha.lord
    # Mahadasha + Antardasha only — the same two lords `yoga_activation_score`
    # reads. The detectors used to get the Pratyantar lord as well, so a yoga
    # lit only by a weeks-long Pratyantar printed "Active" beside the dormant
    # score 34/100 (a Guru Pratyantar under a Suriya/Ketu period lit Gaja
    # Kesari, Hamsa and Vipareetha, 2026-09-23). One definition of "running".
    active_lords = {mahadasha_lord, antardasha_lord}
    planet_scores = {p.graha: p.strength_score for p in planets}
    combust_set = frozenset(p.graha for p in planets if p.is_combust)
    retrograde_set = frozenset(p.graha for p in planets if p.is_retrograde)
    moon_planet = next((p for p in planets if p.graha == "MOON"), None)
    janma_nakshatra = moon_planet.nakshatra if moon_planet else None
    d9_rasi_map: dict[str, int] = {p.graha: p.d9_rasi for p in planets if isinstance(p.d9_rasi, int)}
    yogas, doshams, nakshatra_cautions = detect_yogas_and_doshams(
        planet_map,
        lagna_rasi=lagna_rasi,
        moon_rasi=moon_rasi,
        active_lords=active_lords,
        current_maha_lord=mahadasha_lord,
        gender=gender,
        combust_planets=combust_set,
        retrograde_planets=retrograde_set,
        janma_nakshatra=janma_nakshatra,
        d9_rasi_map=d9_rasi_map,
        d9_lagna_rasi=d9_lagna_rasi,
        equal_bhava_map=equal_bhava_map,
        planet_scores_in=planet_scores,
        # Doctrine A-4: Kala Sarpa is a degree-exact arc test. `planet_map`
        # carries rasi only, so the sidereal longitudes go across separately.
        longitudes_in={planet.graha: planet.absolute_longitude for planet in planets},
        doctrine=current_doctrine_options(),
    )

    # A detector that cannot see the running dasha hardcodes `dasha_activated`
    # to False (Sakata, Kemadruma, Daridra all do). Before the 2026-09-11 ruling
    # gave those yogas key grahas that was harmless — nothing could activate
    # them anyway — but it left the surfaces *asserting* dormancy: mobile's
    # how-sheet said "no current dasha lord activates this yoga" on a Kemadruma
    # chart in a Chandran mahadasha. Now that key grahas exist, resolve the flag
    # here, where the dasha lords are actually in scope, against the same table
    # the activation score uses. The detector's own True is never overturned.
    running_lords = {mahadasha_lord, antardasha_lord}

    def _dasha_activated(item) -> bool:
        if item.dasha_activated:
            return True
        if not item.is_present:
            return False
        # DD-15: a secondary activator's dasha lights the yoga too, at the
        # moderate tier only (see `activation_tier`).
        activators = set(key_planets_for(item.name, item.key_grahas)) | set(item.secondary_grahas)
        return bool(running_lords & activators)

    def _yoga_model(item) -> ChartYogaInsight:
        activated = _dasha_activated(item)
        both, peak = (
            _yoga_timing(item, maha=mahadasha_lord, antar=antardasha_lord,
                         antaram=timeline.current_pratyantardasha)
            if activated else (False, None)
        )
        tier = activation_tier(
            item.name,
            is_present=item.is_present,
            maha=mahadasha_lord,
            antar=antardasha_lord,
            key_grahas=item.key_grahas,
            secondary_grahas=item.secondary_grahas,
            both_lords=both,
            detector_activated=activated,
        )
        return ChartYogaInsight(
            name=item.name,
            isPresent=item.is_present,
            strength=item.strength,
            conditionsMet=item.conditions_met,
            cancellationFactors=item.cancellation_factors,
            dashaActivated=activated,
            # The flag above and this score must never disagree, so the score
            # is handed the flag instead of re-deciding it.
            activationScore=yoga_activation_score(
                yoga_name=item.name,
                yoga_is_present=item.is_present,
                yoga_strength=item.strength,
                mahadasha_lord=mahadasha_lord,
                antardasha_lord=antardasha_lord,
                planet_scores=planet_scores,
                chart_key_grahas=item.key_grahas,
                activated=activated,
                both_lords=both,
                chart_secondary_grahas=item.secondary_grahas,
            ),
            isCurrentlyActive=activated,
            activationTier=tier,
            structuralReach=_structural_reach(item, planet_map, lagna_rasi),
            descriptionTa=item.description_ta,
            descriptionEn=item.description_en,
            # description_* states the mechanism (how the yoga forms); effect_*
            # states what it is traditionally held to do. Resolved here rather
            # than in each detector so the catalogue has one home.
            effectTa=yoga_effect(item.name)[0],
            effectEn=yoga_effect(item.name)[1],
            peakWindow=peak,
        )

    yoga_models = [_yoga_model(item) for item in yogas]
    dosham_models = [
        ChartDoshamInsight(
            name=item.name,
            isPresent=item.is_present,
            isCancelled=item.is_cancelled,
            strength=item.strength,
            label=item.label,
            category=item.category,
            conditionsMet=item.conditions_met,
            cancellationFactors=item.cancellation_factors,
            missingData=item.missing_data,
            dashaActivated=item.dasha_activated,
            descriptionTa=item.description_ta,
            descriptionEn=item.description_en,
            explanationWhatTa=item.explanation_what_ta,
            explanationWhatEn=item.explanation_what_en,
            explanationWhyTa=item.explanation_why_ta,
            explanationWhyEn=item.explanation_why_en,
            explanationHowTa=item.explanation_how_ta,
            explanationHowEn=item.explanation_how_en,
            variantTa=item.variant_ta,
            variantEn=item.variant_en,
            formationStrength=item.formation_strength,
            residual=item.residual,
            contextNotes=list(item.context_notes),
            referenceHouses=[
                DoshamReferenceHouse(
                    reference=row.reference, referenceRasi=row.reference_rasi,
                    houses=list(row.houses), counts=row.counts,
                )
                for row in item.reference_houses
            ],
            meaningTa=item.meaning_ta,
            meaningEn=item.meaning_en,
        )
        for item in doshams
    ]
    nakshatra_caution_models = [
        ChartNakshatraCaution(
            name=item.name,
            nakshatraNumber=item.nakshatra_number,
            descriptionTa=item.description_ta,
            descriptionEn=item.description_en,
        )
        for item in nakshatra_cautions
    ]
    return yoga_models, dosham_models, nakshatra_caution_models


def _relationship_to_owner(profile: Any) -> str:
    """Resolve the relationship from wherever it actually lives.

    `relationship` is a column on **FamilyMember**, not on BirthProfile — the
    profile model has no such attribute at all. This used to be
    `_value(profile, "relationship_to_owner", "self")`, which meant every
    persisted profile reported `"self"` unconditionally: `getattr` found
    nothing and handed back the default. Only `BirthProfileCreate`, which does
    declare the field, ever produced a real answer, so the bug was invisible on
    the create path and total on every read.

    It was not cosmetic. `dashboard-workspace.handleEditFamilyMember` seeds the
    edit modal's relationship dropdown from `chart.birthProfile`, so opening a
    member's editor showed "Self" for a spouse or a child, and saving wrote that
    back over `family_members.relationship`. A member tagged `self` is then
    dropped from `useFamilyData`'s `memberCharts` by design (it would otherwise
    duplicate the owner's own pill), which empties the member picker on every
    tab. One phantom field, and the whole vault disappears from the app.

    Mirrors `birth_profile_service._profile_response`, which has always read the
    linked member correctly.
    """
    declared = _value(profile, "relationship_to_owner")
    if declared:
        return str(declared)
    member = _value(profile, "family_member")
    relationship = _value(member, "relationship_to_owner") if member is not None else None
    return str(relationship) if relationship else "self"


def _birth_profile_response(
    profile: Any,
    birth_profile_id: UUID,
    birth_datetime_utc: datetime,
    *,
    calculation_status: str = "completed",
    warnings: list[str] | None = None,
) -> BirthProfileResponse:
    return BirthProfileResponse(
        birth_profile_id=birth_profile_id,
        owner_user_id=_value(profile, "owner_user_id"),
        family_vault_id=_value(profile, "family_vault_id"),
        family_member_id=_value(profile, "family_member_id"),
        relationship_to_owner=_relationship_to_owner(profile),
        display_name=_value(profile, "display_name"),
        birth_date_local=_value(profile, "birth_date_local"),
        birth_time_local=_value(profile, "birth_time_local"),
        birth_place=_value(profile, "birth_place"),
        birth_latitude=float(_value(profile, "birth_latitude")),
        birth_longitude=float(_value(profile, "birth_longitude")),
        birth_timezone=_value(profile, "birth_timezone"),
        current_place=_value(profile, "current_place"),
        current_latitude=(
            float(_value(profile, "current_latitude"))
            if _value(profile, "current_latitude") is not None
            else None
        ),
        current_longitude=(
            float(_value(profile, "current_longitude"))
            if _value(profile, "current_longitude") is not None
            else None
        ),
        current_timezone=_value(profile, "current_timezone"),
        current_location_updated_at=_value(profile, "current_location_updated_at"),
        birth_time_source=_value(profile, "birth_time_source", "unknown"),
        birth_time_confidence_minutes=int(_value(profile, "birth_time_confidence_minutes", 0) or 0),
        # Life-stage inputs — must survive into the persisted snapshot: the
        # life-areas engine reads them for the age/phase gate (married ⇒ keep
        # Relationships/harmony lifelong; student-under-18 ⇒ drop Career;
        # retired ⇒ Career becomes "Life Purpose"). Dropping them here silently
        # disabled all of that.
        #
        # `children` joined them late and for a different reason: it is the only
        # copy of the answer the profile form can read back. The form hydrates
        # from this response, so omitting the field left a stored "has"/"none"
        # invisible and therefore uncorrectable — the reader could set it (the
        # one-minute reading asks and PATCHes) but never see or change it.
        # Never treat the absence of a value here as "no children": None means
        # the chart response did not carry it, which is what this line fixes.
        marital_status=_value(profile, "marital_status"),
        employment_type=_value(profile, "employment_type"),
        children=_value(profile, "children"),
        calendar_input_type=_value(profile, "calendar_input_type", "gregorian"),
        calculate_now=bool(_value(profile, "calculate_now", True)),
        language_preference=_value(profile, "language_preference", "ta-en"),
        gender_for_traditional_rules=_value(profile, "gender_for_traditional_rules"),
        birth_datetime_utc=birth_datetime_utc,
        calculation_status=calculation_status,
        warnings=warnings or [],
    )


def _chart_response_from_profile(profile: Any, calculation_version: str, chart_id: UUID | None = None) -> ChartCalculateResponse:
    birth_datetime_utc = _birth_datetime_utc(profile)
    julian_day = utc_datetime_to_julian_day(birth_datetime_utc)
    snapshot = calculate_sidereal_planets(julian_day)

    lagna_degree = calculate_lagna_degree(julian_day, float(_value(profile, "birth_latitude")), float(_value(profile, "birth_longitude")))
    lagna_rasi = int((lagna_degree % 360) // 30) + 1
    birth_profile_id = _value(profile, "birth_profile_id") or uuid4()
    chart_id = chart_id or uuid4()
    profile_warnings = _warning_messages(profile)

    lagna = LagnaPosition(
        rasi=lagna_rasi,
        rasi_name=RASI_NAMES[lagna_rasi],
        absolute_longitude=lagna_degree,
        degree_in_rasi=degree_in_rasi(lagna_degree),
        nakshatra=nakshatra_from_degree(lagna_degree),
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_from_degree(lagna_degree) - 1],
        pada=pada_from_degree(lagna_degree),
        d9_rasi=navamsa_rasi_from_degree(lagna_degree),
    )

    planet_positions = []
    sun_degree = snapshot.bodies["SUN"].absolute_longitude
    moon_degree = snapshot.bodies["MOON"].absolute_longitude
    birth_time_local = _value(profile, "birth_time_local")
    is_daytime = resolve_daytime_birth_for_profile(profile)
    paksha_is_shukla = _paksha_is_shukla(moon_degree, sun_degree)
    snapshot_rasi_map = {body.graha: body.rasi for body in snapshot.bodies.values() if body.graha in _NATAL_GRAHAS}
    # Cazimi (heart of the Sun) is empowered, not burnt — exclude it from the
    # combust set exactly as the record path does, so the two build paths agree
    # on the paksha-/combustion-aware benefic classification (audit C1).
    snapshot_combust = {
        body.graha
        for body in snapshot.bodies.values()
        if body.graha in _NATAL_GRAHAS
        and is_combust(body.graha, body.absolute_longitude, sun_degree, body.is_retrograde)
        and not is_cazimi(body.graha, body.absolute_longitude, sun_degree)
    }
    planetary_wars = detect_planetary_wars({
        body.graha: body.absolute_longitude for body in snapshot.bodies.values()
    })
    for body in snapshot.bodies.values():
        benefic_aspects, malefic_aspects = _aspect_counts(
            body.graha,
            snapshot_rasi_map,
            snapshot_combust,
            paksha_is_shukla=paksha_is_shukla,
        )
        planet_positions.append(
            _planet_position_from_snapshot(
                body,
                lagna_rasi=lagna_rasi,
                sun_degree=sun_degree,
                is_daytime=is_daytime,
                paksha_is_shukla=paksha_is_shukla,
                benefic_aspect_count=benefic_aspects,
                malefic_aspect_count=malefic_aspects,
                planetary_wars=planetary_wars,
                planet_rasi_map=snapshot_rasi_map,
            )
        )

    # Maandhi (மாந்தி) upagraha — the nirayana ascendant at the proportionally
    # calculated Maandhi INSTANT. Not the start of a "Maandhi kalam": Maandhi is
    # a point, not a window, and it is not on the eighth-part grid at all (the
    # constants are thirtieths of the span). The window on that grid is Kuligai,
    # which is Gulika's, and Maandhi falls strictly inside it — see
    # tests/test_gulika.py.
    mandhi_lng = _mandhi_longitude(
        _value(profile, "birth_date_local"),
        _value(profile, "birth_time_local"),
        float(_value(profile, "birth_latitude")),
        float(_value(profile, "birth_longitude")),
        _value(profile, "birth_timezone"),
    )
    if mandhi_lng is not None:
        planet_positions.append(_mandhi_planet_position(mandhi_lng, lagna_rasi))

    # Holistic Strength Synthesis — shared with the record path (audit C1), run
    # here (before yoga detection) so the fresh-calc / public-tools / first-view
    # numbers match what the persisted-record read later produces.
    _apply_holistic_strength_synthesis(
        planet_positions,
        lagna_rasi=lagna_rasi,
        planet_rasi_map=snapshot_rasi_map,
        combust_planets=snapshot_combust,
        paksha_is_shukla=paksha_is_shukla,
        d9_lagna_rasi=navamsa_rasi_from_degree(lagna_degree),
    )

    equal_bhava_map = compute_equal_bhava(
        lagna_degree,
        {p.graha: p.absolute_longitude for p in planet_positions},
    )

    moon_rasi = next(planet.rasi for planet in planet_positions if planet.graha == "MOON")
    yogas, doshams, nakshatra_cautions = _build_yoga_dosham_insights(
        planet_positions,
        lagna_rasi=lagna_rasi,
        moon_rasi=moon_rasi,
        birth_jd=julian_day,
        gender=_value(profile, "gender_for_traditional_rules"),
        d9_lagna_rasi=navamsa_rasi_from_degree(lagna_degree),
        equal_bhava_map=equal_bhava_map,
    )
    public_planet_positions = _public_planets(planet_positions)
    planet_longitudes = {p.graha: p.absolute_longitude for p in public_planet_positions}
    planet_longitudes["LAGNA"] = lagna_degree
    vargas = _compute_vargas(planet_longitudes)
    varga_reliability = _varga_reliability(int(_value(profile, "birth_time_confidence_minutes", 0) or 0))
    nakshatra_analysis = _compute_nakshatra_analysis(planet_longitudes)
    birth_conditions, bc_penalties = _build_birth_conditions(
        public_planet_positions, birth_time_local, lagna_rasi=lagna_rasi
    )
    _apply_birth_condition_penalties(public_planet_positions, bc_penalties)
    birth_panchangam_signature = _birth_panchangam_signature(profile)

    birth_profile_response = _birth_profile_response(
        profile=profile,
        birth_profile_id=birth_profile_id,
        birth_datetime_utc=birth_datetime_utc,
        calculation_status="completed",
        warnings=profile_warnings,
    )

    return ChartCalculateResponse(
        data=ChartCalculateResponseData(
            chart_id=chart_id,
            birth_profile=birth_profile_response,
            birth_datetime_utc=birth_datetime_utc,
            julian_day=julian_day,
            ayanamsa=AyanamsaInfo(value_degrees=snapshot.ayanamsa_value_degrees),
            lagna=lagna,
            planets=public_planet_positions,
            equal_bhava=equal_bhava_map,
            vargas=vargas,
            varga_reliability=varga_reliability,
            nakshatra_analysis=nakshatra_analysis,
            birth_conditions=birth_conditions,
            birth_panchangam_signature=birth_panchangam_signature,
            yogas=yogas,
            doshams=doshams,
            nakshatra_cautions=nakshatra_cautions,
            calculation_version=calculation_version,
            calculation_status="completed",
            warnings=list(snapshot.source_warnings) + profile_warnings,
            ephemeris_backend=snapshot.backend,
        ),
        meta=ResponseMeta(
            calculation_version=calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )


def _chart_response_from_record(chart: Chart) -> ChartCalculateResponse:
    birth_profile = chart.birth_profile
    if birth_profile is None:
        raise ValueError("Chart is missing its birth profile relation.")

    birth_profile_response = _birth_profile_response(
        profile=birth_profile,
        birth_profile_id=birth_profile.birth_profile_id,
        birth_datetime_utc=_birth_datetime_utc(birth_profile),
        calculation_status="completed" if chart.status == "completed" else chart.status,
        warnings=_warning_messages(birth_profile),
    )

    lagna_rasi = RASI_NUMBERS[chart.lagna_rasi]
    lagna_nakshatra = nakshatra_from_degree(float(chart.lagna_longitude))
    lagna = LagnaPosition(
        rasi=lagna_rasi,
        rasi_name=chart.lagna_rasi,
        absolute_longitude=float(chart.lagna_longitude),
        degree_in_rasi=degree_in_rasi(float(chart.lagna_longitude)),
        nakshatra=lagna_nakshatra,
        nakshatra_name=NAKSHATRA_NAMES[lagna_nakshatra - 1],
        pada=pada_from_degree(float(chart.lagna_longitude)),
        d9_rasi=navamsa_rasi_from_degree(float(chart.lagna_longitude)),
    )

    def _stored_d9_rasi(planet: Any) -> int:
        """The navamsa sign of a persisted planet row.

        Rows written before the `d9_rasi` column existed fall back to deriving
        it from the stored longitude, with the same function the fresh path
        uses. One definition, because `d9_rasi` and `d9_dignity` must never
        disagree about which sign they are describing — two copies of this
        expression is how they would.
        """
        if planet.d9_rasi is not None:
            return RASI_NUMBERS.get(str(planet.d9_rasi), 1)
        return navamsa_rasi_from_degree(float(planet.absolute_longitude))

    planets = sorted(chart.planets, key=lambda planet: PLANET_ORDER.get(planet.graha, 99))
    planet_positions = [
        PlanetPosition(
            graha=planet.graha,
            rasi_name=planet.rasi,
            absolute_longitude=float(planet.absolute_longitude),
            rasi=RASI_NUMBERS[planet.rasi],
            degree_in_rasi=float(planet.degree_in_rasi),
            nakshatra=NAKSHATRA_NAMES.index(planet.nakshatra) + 1 if planet.nakshatra in NAKSHATRA_NAMES else nakshatra_from_degree(float(planet.absolute_longitude)),
            nakshatra_name=planet.nakshatra,
            pada=int(planet.pada),
            house_from_lagna=int(planet.house_from_lagna),
            speed_deg_per_day=float(planet.speed_deg_per_day) if planet.speed_deg_per_day is not None else 0.0,
            is_retrograde=bool(planet.is_retrograde),
            is_combust=bool(planet.is_combust),
            d9_rasi=_stored_d9_rasi(planet),
            d9_dignity=d9_dignity_label(planet.graha, _stored_d9_rasi(planet)),
            is_vargottama=bool(planet.is_vargottama),
            show_retrograde_badge=bool(planet.is_retrograde) and planet.graha not in {"RAHU", "KETU"},
        )
        for planet in planets
    ]

    # Maandhi is always DERIVED here, never read back from `chart_planets`.
    #
    # Two independent reasons, and each alone would be enough:
    #
    # 1. This function rebuilds the chart strictly from the persisted rows, so a
    #    chart written when the engine emitted nine grahas serves nine grahas
    #    forever. Nothing repairs it: `load_persisted_chart_response` recomputes
    #    only when a chart has NO planet rows at all, and the read path does not
    #    consult `calculation_version` — bumping that constant invalidates
    #    nothing here, and it no longer claims to (see
    #    app/constants/versions.py). Maandhi was simply missing from the wheel,
    #    the bhava table and every Maandhi-dependent yoga on every older chart,
    #    with no error anywhere.
    #
    # 2. The owner ruling of 2026-09-29 redefined Maandhi from Saturn's
    #    eighth-part (which is GULIKA) to the proportional nazhigai measure in
    #    `_chart_planets.MAANDHI_DAY_NAZHIGAI`. Rows written before that ruling
    #    hold the old position — up to ~20 deg away, routinely a different rasi
    #    — and there is no field on the row that distinguishes the two
    #    definitions. A stored value cannot be trusted, so it is not consulted.
    #
    # Cheap: Maandhi is a pure function of birth data and place, one rise/set
    # plus one ascendant. Derived against the STORED lagna so the house it
    # lands in cannot disagree with the rest of this response. Unconditional on
    # purpose — the version strings are unified now, but a version gate would
    # still be the wrong mechanism here: reason 2 above is that no field on the
    # row distinguishes the two Maandhi definitions, and that stays true however
    # the chart is stamped.
    planet_positions = [planet for planet in planet_positions if planet.graha != "MANDHI"]
    mandhi_lng = _mandhi_longitude(
        birth_profile.birth_date_local,
        birth_profile.birth_time_local,
        float(birth_profile.birth_latitude),
        float(birth_profile.birth_longitude),
        birth_profile.birth_timezone,
    )
    if mandhi_lng is not None:
        planet_positions.append(_mandhi_planet_position(mandhi_lng, lagna_rasi))
        planet_positions.sort(key=lambda planet: PLANET_ORDER.get(planet.graha, 99))

    sun_degree = next(planet.absolute_longitude for planet in planet_positions if planet.graha == "SUN")
    moon_degree = next(planet.absolute_longitude for planet in planet_positions if planet.graha == "MOON")
    is_daytime = resolve_daytime_birth_for_profile(birth_profile)
    paksha_is_shukla = _paksha_is_shukla(moon_degree, sun_degree)
    planet_rasi_map = {p.graha: p.rasi for p in planet_positions if p.graha in _NATAL_GRAHAS}
    planetary_wars = detect_planetary_wars({p.graha: p.absolute_longitude for p in planet_positions})
    combust_planets = {
        p.graha
        for p in planet_positions
        if p.graha in _NATAL_GRAHAS
        and is_combust(p.graha, p.absolute_longitude, sun_degree, p.is_retrograde)
        and not is_cazimi(p.graha, p.absolute_longitude, sun_degree)
    }
    for planet in planet_positions:
        planet.is_cazimi = is_cazimi(planet.graha, planet.absolute_longitude, sun_degree)
        # Cazimi overrides combustion — a heart-of-Sun planet is empowered, not burnt.
        planet.is_combust = (
            is_combust(planet.graha, planet.absolute_longitude, sun_degree, planet.is_retrograde)
            and not planet.is_cazimi
        )
        if planet.graha == "MANDHI":
            continue
        benefic_aspects, malefic_aspects = _aspect_counts(
            planet.graha,
            planet_rasi_map,
            combust_planets,
            paksha_is_shukla=paksha_is_shukla,
        )
        speed_ratio = _speed_ratio(planet.graha, float(planet.speed_deg_per_day))
        planet.strength_score, _score_terms = explain_natal_planet_score(
            planet.graha,
            planet.rasi,
            planet.absolute_longitude,
            lagna_rasi,
            sun_degree,
            planet.is_retrograde,
            is_vargottama=planet.is_vargottama,
            d9_rasi=planet.d9_rasi,
            is_daytime=is_daytime,
            paksha_is_shukla=paksha_is_shukla,
            speed_ratio=speed_ratio,
            benefic_aspect_count=benefic_aspects,
            malefic_aspect_count=malefic_aspects,
            planetary_wars=planetary_wars,
            planet_rasi_map=planet_rasi_map,
        )
        planet.score_terms = [
            PlanetScoreTerm(
                key=c.key,
                points=c.points,
                detail_key=c.detail_key,
                detail_value=c.detail_value,
            )
            for c in _score_terms
        ]
        planet.strength_breakdown = compute_strength_breakdown(
            planet=planet.graha,
            natal_rasi=planet.rasi,
            natal_longitude=planet.absolute_longitude,
            natal_lagna_rasi=lagna_rasi,
            is_retrograde=planet.is_retrograde,
            is_vargottama=planet.is_vargottama,
            d9_rasi=planet.d9_rasi,
            is_daytime=is_daytime,
            paksha_is_shukla=paksha_is_shukla,
            benefic_aspect_count=benefic_aspects,
            malefic_aspect_count=malefic_aspects,
            speed_ratio=speed_ratio,
            planet_rasi_map=planet_rasi_map,
        )

    # Holistic Strength Synthesis — shared across both build paths (audit C1).
    # Runs AFTER the base loop (relational terms read every other planet's base
    # score) and BEFORE yoga detection (yoga activation reads the synthesised
    # strength). See _apply_holistic_strength_synthesis.
    d9_lagna_rasi_val = navamsa_rasi_from_degree(float(chart.lagna_longitude))
    _apply_holistic_strength_synthesis(
        planet_positions,
        lagna_rasi=lagna_rasi,
        planet_rasi_map=planet_rasi_map,
        combust_planets=combust_planets,
        paksha_is_shukla=paksha_is_shukla,
        d9_lagna_rasi=d9_lagna_rasi_val,
    )

    # Recomputed from the FINAL longitudes, never zipped against the stored rows.
    #
    # `compute_equal_bhava` is pure arithmetic — (longitude - lagna) // 30 — over
    # exactly the inputs that wrote `chart_planets.bhava_house` in the first
    # place, so for the nine grahas this is bit-identical to reading the column.
    # For Maandhi it is not, and that is the point: Maandhi is rederived above
    # (see the note there), so any stored row beside it is describing a different
    # longitude.
    #
    # The positional `zip(planet_positions, planets)` this replaced got it wrong
    # both ways round. With no stored MANDHI row the lengths differed by one, so
    # `strict=False` dropped the newly derived Maandhi and left it with no bhava
    # entry at all — and the nine surviving values could still all be valid
    # houses, so the `all(...)` guard below passed and never triggered the
    # recompute. With a stored MANDHI row written before the 2026-09-29 ruling,
    # the lengths matched and the OLD eighth-part Gulika bhava house was welded
    # onto the NEW proportional Maandhi, which is precisely the stale value the
    # rederivation exists to discard.
    equal_bhava_map = compute_equal_bhava(
        float(chart.lagna_longitude),
        {p.graha: p.absolute_longitude for p in planet_positions},
    )

    moon_rasi = next(planet.rasi for planet in planet_positions if planet.graha == "MOON")
    yogas, doshams, nakshatra_cautions = _build_yoga_dosham_insights(
        planet_positions,
        lagna_rasi=lagna_rasi,
        moon_rasi=moon_rasi,
        birth_jd=float(chart.julian_day),
        gender=_value(birth_profile, "gender_for_traditional_rules"),
        d9_lagna_rasi=d9_lagna_rasi_val,
        equal_bhava_map=equal_bhava_map,
    )
    public_planet_positions = _public_planets(planet_positions)
    planet_longitudes = {p.graha: p.absolute_longitude for p in public_planet_positions}
    planet_longitudes["LAGNA"] = float(chart.lagna_longitude)
    vargas = _compute_vargas(planet_longitudes)
    varga_reliability = _varga_reliability(int(_value(birth_profile, "birth_time_confidence_minutes", 0) or 0))
    nakshatra_analysis = _compute_nakshatra_analysis(planet_longitudes)
    birth_conditions, bc_penalties = _build_birth_conditions(
        public_planet_positions, _value(birth_profile, "birth_time_local"), lagna_rasi=lagna_rasi
    )
    _apply_birth_condition_penalties(public_planet_positions, bc_penalties)
    birth_panchangam_signature = _birth_panchangam_signature(birth_profile)

    return ChartCalculateResponse(
        data=ChartCalculateResponseData(
            chart_id=chart.chart_id,
            birth_profile=birth_profile_response,
            birth_datetime_utc=_birth_datetime_utc(birth_profile),
            julian_day=float(chart.julian_day),
            ayanamsa=AyanamsaInfo(value_degrees=float(chart.ayanamsa_value_degrees or 0.0)),
            lagna=lagna,
            planets=public_planet_positions,
            equal_bhava=equal_bhava_map,
            vargas=vargas,
            varga_reliability=varga_reliability,
            nakshatra_analysis=nakshatra_analysis,
            birth_conditions=birth_conditions,
            birth_panchangam_signature=birth_panchangam_signature,
            yogas=yogas,
            doshams=doshams,
            nakshatra_cautions=nakshatra_cautions,
            calculation_version=chart.calculation_version,
            calculation_status="completed" if chart.status == "completed" else "completed",
            warnings=list(chart.warnings or []),
            ephemeris_backend=chart.ephemeris_version or "pyswisseph",
        ),
        meta=ResponseMeta(
            calculation_version=chart.calculation_version,
            generated_at=datetime.now(tz=UTC),
        ),
    )
