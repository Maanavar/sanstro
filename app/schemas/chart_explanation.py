from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.charts import ChartDoshamInsight, ChartYogaInsight, ResponseMeta


class ChartExplanationText(BaseModel):
    ta: str
    en: str

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationFacet(BaseModel):
    """One scannable line of a planet's reading.

    The single ``explanation`` paragraph concatenates placement, dignity,
    functional role, dasha state, transit contacts and condition notes into one
    block of prose. That is accurate and close to unreadable. Facets carry the
    same content pre-split, so a client can render labelled lines instead of a
    wall of text. ``explanation`` is retained unchanged for existing consumers.

    ``tone`` lets a client style the line without re-deriving meaning:
    BOOST = strengthening, CAUTION = asks for care, NEUTRAL = descriptive.
    """

    key: str
    label: ChartExplanationText
    value: ChartExplanationText
    tone: str = "NEUTRAL"

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationCoreIdentity(BaseModel):
    lagna_rasi: str = Field(alias="lagnaRasi")
    moon_rasi: str = Field(alias="moonRasi")
    janma_nakshatra: str = Field(alias="janmaNakshatra")
    janma_pada: int = Field(alias="janmaPada")
    current_mahadasha: str = Field(alias="currentMahadasha")
    current_antardasha: str = Field(alias="currentAntardasha")
    current_pratyantardasha: str = Field(alias="currentPratyantardasha")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationPlanet(BaseModel):
    graha: str
    house_from_lagna: int = Field(alias="houseFromLagna")
    rasi: int
    rasi_name: str = Field(alias="rasiName")
    nakshatra: int
    nakshatra_name: str = Field(alias="nakshatraName")
    pada: int
    # Graha ruling this nakshatra. Served from the engine's one canonical table
    # so clients stop maintaining their own copies of the 27-star lord list.
    nakshatra_lord: str = Field(default="", alias="nakshatraLord")
    dignity: str
    dignity_score: int = Field(alias="dignityScore")
    strength_score: int = Field(alias="strengthScore")
    is_retrograde: bool = Field(alias="isRetrograde")
    is_combust: bool = Field(alias="isCombust")
    is_cazimi: bool = Field(default=False, alias="isCazimi")
    is_vargottama: bool = Field(alias="isVargottama")
    d9_rasi: int = Field(alias="d9Rasi")
    house_group: str = Field(alias="houseGroup")
    functional_nature: str = Field(alias="functionalNature")
    explanation: ChartExplanationText
    # Same reading as `explanation`, split into labelled lines. Defaulted to []
    # so older clients are unaffected.
    facets: list[ChartExplanationFacet] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationMaitriPair(BaseModel):
    planet_a: str = Field(alias="planetA")
    planet_b: str = Field(alias="planetB")
    relationship: str
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationConjunctionGroup(BaseModel):
    rasi: int
    rasi_name: str = Field(alias="rasiName")
    house_from_lagna: int = Field(alias="houseFromLagna")
    planets: list[str]
    relationship_tone: str = Field(alias="relationshipTone")
    pairs: list[ChartExplanationMaitriPair]
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationAspect(BaseModel):
    source_planet: str = Field(alias="sourcePlanet")
    target_planet: str = Field(alias="targetPlanet")
    source_house: int = Field(alias="sourceHouse")
    target_house: int = Field(alias="targetHouse")
    aspect_house: int = Field(alias="aspectHouse")
    aspect_type: str = Field(alias="aspectType")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationHouseGroup(BaseModel):
    group: str
    houses: list[int]
    planets: list[str]
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationBhava(BaseModel):
    """One house read as a life area.

    The drishti list elsewhere in this payload is planet-to-planet only, so an
    EMPTY house — including the Lagna, the 7th and the 10th — could receive
    Saturn's or Jupiter's full aspect and nothing in the reading would ever say
    so. That is the reading a jyotishi actually gives ("what about my marriage,
    my career"), and it was missing entirely (2026-07-18 review).
    """

    house: int
    rasi: int
    rasi_name: str = Field(alias="rasiName")
    lord: str
    lord_house: int = Field(alias="lordHouse")
    lord_strength: int | None = Field(default=None, alias="lordStrength")
    occupants: list[str]
    aspecting_planets: list[str] = Field(alias="aspectingPlanets")
    bhava_bala: int | None = Field(default=None, alias="bhavaBala")
    theme: ChartExplanationText
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationBhavaSection(BaseModel):
    bhavas: list[ChartExplanationBhava]
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationYogaDoshamSection(BaseModel):
    yogas: list[ChartYogaInsight]
    doshams: list[ChartDoshamInsight]
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationActivationSignal(BaseModel):
    source_planet: str = Field(alias="sourcePlanet")
    signal_type: str = Field(alias="signalType")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationDashaLordActivation(BaseModel):
    level: str
    lord: str
    start_date: date = Field(alias="startDate")
    end_date: date = Field(alias="endDate")
    natal_house_from_lagna: int = Field(alias="natalHouseFromLagna")
    natal_house_from_moon: int = Field(alias="natalHouseFromMoon")
    natal_rasi: int = Field(alias="natalRasi")
    natal_rasi_name: str = Field(alias="natalRasiName")
    natal_dignity: str = Field(alias="natalDignity")
    natal_strength_score: int = Field(alias="natalStrengthScore")
    functional_nature: str = Field(alias="functionalNature")
    transit_rasi: int = Field(alias="transitRasi")
    transit_rasi_name: str = Field(alias="transitRasiName")
    transit_house_from_moon: int = Field(alias="transitHouseFromMoon")
    transit_house_from_lagna: int = Field(alias="transitHouseFromLagna")
    transit_is_retrograde: bool = Field(alias="transitIsRetrograde")
    period_tone: str = Field(alias="periodTone")
    life_areas: list[str] = Field(alias="lifeAreas")
    transit_signals: list[ChartExplanationActivationSignal] = Field(alias="transitSignals")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationCurrentActivationSection(BaseModel):
    as_of: date = Field(alias="asOf")
    period_summary: ChartExplanationText = Field(alias="periodSummary")
    transit_summary: ChartExplanationText = Field(alias="transitSummary")
    active_lords: list[ChartExplanationDashaLordActivation] = Field(alias="activeLords")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationSummarySection(BaseModel):
    strongest_planet: str | None = Field(alias="strongestPlanet")
    weakest_planet: str | None = Field(alias="weakestPlanet")
    # The scores behind the two picks above. Previously the summary shipped
    # bare planet names, so a reader had no way to see what "strongest" was
    # measuring — or to notice when this pick and the per-planet cards
    # disagreed. Optional for backward compatibility with older clients.
    strongest_planet_score: int | None = Field(default=None, alias="strongestPlanetScore")
    weakest_planet_score: int | None = Field(default=None, alias="weakestPlanetScore")
    # Set when the highest-scoring planet is nonetheless compromised (combust,
    # debilitated, or a functional malefic). Positional strength and the
    # capacity to deliver benefic results are different axes; calling a combust
    # planet "strongest" with no qualifier conflates them.
    strongest_planet_caveat: ChartExplanationText | None = Field(
        default=None, alias="strongestPlanetCaveat"
    )
    # One line telling the reader what the 0-100 scale actually is, so the
    # number is interpretable at the point of use.
    score_scale_note: ChartExplanationText | None = Field(default=None, alias="scoreScaleNote")
    positives: list[ChartExplanationText]
    cautions: list[ChartExplanationText]

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationPeyarchiEvent(BaseModel):
    planet: str
    event_date: date = Field(alias="eventDate")
    from_rasi: str = Field(alias="fromRasi")
    to_rasi: str = Field(alias="toRasi")
    house_from_moon: int = Field(alias="houseFromMoon")
    house_from_lagna: int = Field(alias="houseFromLagna")
    sani_cycle_after: str | None = Field(default=None, alias="saniCycleAfter")
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationPeyarchiSection(BaseModel):
    as_of: date = Field(alias="asOf")
    events: list[ChartExplanationPeyarchiEvent]
    explanation: ChartExplanationText

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationData(BaseModel):
    chart_id: UUID = Field(alias="chartId")
    core_identity: ChartExplanationCoreIdentity = Field(alias="coreIdentity")
    planets: list[ChartExplanationPlanet]
    conjunctions: list[ChartExplanationConjunctionGroup]
    aspects: list[ChartExplanationAspect]
    house_groups: list[ChartExplanationHouseGroup] = Field(alias="houseGroups")
    # Per-house life-area reading. Optional so existing clients are unaffected.
    bhavas: ChartExplanationBhavaSection | None = None
    functional_nature: dict[str, str] = Field(alias="functionalNature")
    yoga_dosham: ChartExplanationYogaDoshamSection = Field(alias="yogaDosham")
    current_activation: ChartExplanationCurrentActivationSection = Field(alias="currentActivation")
    summary: ChartExplanationSummarySection
    peyarchi: ChartExplanationPeyarchiSection
    method_note: ChartExplanationText = Field(alias="methodNote")

    model_config = ConfigDict(populate_by_name=True)


class ChartExplanationResponse(BaseModel):
    success: bool = True
    data: ChartExplanationData
    meta: ResponseMeta

    model_config = ConfigDict(populate_by_name=True)
