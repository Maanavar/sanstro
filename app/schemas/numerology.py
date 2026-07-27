"""Numerology API schemas (Phases 1-4).

Deliberately **numbers only, no interpretive prose.** The engines are built and
golden-tested, but every sentence this feature can produce — the root 1-9 and
compound 10-52 corpus in ``app.services.numerology_content``, and the Phase 3/4
explanation strings (``reason_ta``, ``note_ta``, the name-change
recommendation) — was drafted by one hand and none of it has had a Tamil native
pass. Shipping the arithmetic without the readings is the honest split.

**How that is enforced, rather than remembered.** Prose fields exist on these
models but are populated only through ``reviewed_prose``, which returns ``None``
while ``numerology_content.CONTENT_REVIEWED`` is ``False``. Every response also
carries ``readingsAvailable`` so a client can tell "withheld pending review"
from "this number has no note". The gate lives in the ``from_*`` converters, so
a route added later gets it without knowing it exists, and
``tests/test_numerology_chart_api.py`` fails if any prose leaks while the
corpus is unreviewed.

Chart id is deliberately **not** echoed on the chart-scoped responses: it is
already in the path, and leaving it out lets the authenticated and public
personal-cycle routes share one response model (and therefore one TypeScript
interface).

Every response carries ``tradition`` — plan §9.5 requires the system be named in
the UI. One honest line is the difference between a tradition-bearer and a
fortune-teller, and it costs nothing.
"""
from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.calculations.display_names import planet_en, planet_ta
from app.calculations.numerology import (
    NumberReading,
    NumerologyProfile,
    ObjectKind,
    ObjectReading,
)
from app.calculations.numerology_alignment import FortuneAlignment, NumberAlignment
from app.calculations.numerology_compatibility import (
    ENEMY,
    FRIEND,
    NEUTRAL,
    PEYAR_PORUTHAM_EN,
    PEYAR_PORUTHAM_TA,
    PRECEDENCE_EN,
    PRECEDENCE_TA,
    NameHarmony,
    NumberPair,
    NumerologyCompatibility,
    summary_en,
    summary_ta,
)
from app.calculations.numerology_correction import RankedVariant
from app.calculations.numerology_timing import DateNumerology, PersonalCycle
from app.schemas.muhurta import MuhurtaSlot
from app.schemas.muhurtham_naal import MuhurthamNaalMatchContext, MuhurthamNaalMatchItem
from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS, DirectPoruthamData
from app.services.numerology_compatibility_service import ChartCompatibility
from app.services.numerology_name_session_service import (
    CALCULATION_VERSION as NAME_SESSION_CALCULATION_VERSION,
)
from app.services.numerology_name_session_service import (
    MAX_SESSIONS_PER_CHART,
    SavedNameReading,
)
from app.services.numerology_service import readings_available

#: Shown with every response. Chaldean numerology reached Tamil practice via
#: Cheiro in the early 20th century; it is not part of the Vedanga Jyotisha
#: corpus, and saying so plainly is a product requirement, not a footnote.
TRADITION_NOTE_EN = "Chaldean numerology, as practised in Tamil Nadu."
TRADITION_NOTE_TA = "கல்தேய எண் கணிதம் — தமிழ்நாட்டு வழக்கப்படி."


def reviewed_prose(text: str | None) -> str | None:
    """Pass interpretive copy through only once it has cleared review.

    The one chokepoint for unreviewed prose. Every model below routes its
    ``*_en``/``*_ta`` explanation fields through this rather than assigning the
    engine string directly — a converter that forgets is the failure mode, so
    there is nothing to forget.
    """
    return text if readings_available() else None


class NumberReadingOut(BaseModel):
    """One computed number with its derivation intact.

    ``compound`` is null only for a single-digit total. It is never collapsed
    into ``root`` — 43 and 34 both reduce to 7 and are read differently.
    """

    total: int
    compound: int | None = None
    root: int
    reduction_chain: list[int] = Field(alias="reductionChain")
    graha: str
    graha_ta: str = Field(alias="grahaTa")
    graha_en: str = Field(alias="grahaEn")
    ignored_characters: list[str] = Field(alias="ignoredCharacters", default_factory=list)
    #: Doctrine D6 — the name's own total when it exceeds the encoded 10-52
    #: series, meaning ``compound`` above describes a *reduced surrogate* rather
    #: than the number this name actually makes. Null when ``compound`` is the
    #: real thing. A client showing a compound reading while this is non-null is
    #: showing a different number's meaning and must say so.
    compound_beyond_series: int | None = Field(alias="compoundBeyondSeries", default=None)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_reading(cls, reading: NumberReading) -> NumberReadingOut:
        return cls(
            total=reading.total,
            compound=reading.compound,
            root=reading.root,
            reductionChain=list(reading.reduction_chain),
            graha=reading.graha,
            grahaTa=reading.graha_ta,
            grahaEn=reading.graha_en,
            ignoredCharacters=list(reading.ignored_characters),
            compoundBeyondSeries=reading.compound_beyond_series,
        )


class NumerologyProfileRequest(BaseModel):
    """Date of birth plus the name(s) to score.

    Note there is no birth *time* and no location — numerology needs neither.
    That is the point: this is the one reading Vinaadi can give the large share
    of users who do not know their birth time.
    """

    birth_date: date = Field(alias="birthDate")
    #: The spelling on official records — the name that "name correction" targets.
    document_name: str | None = Field(alias="documentName", default=None, max_length=120)
    #: What people actually call the person day to day. Often differs.
    called_name: str | None = Field(alias="calledName", default=None, max_length=120)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("birth_date")
    @classmethod
    def _bounded(cls, value: date) -> date:
        if value.year < 1900 or value > date.today():
            raise ValueError("birthDate must be between 1900 and today")
        return value


class NumerologyReadingsOut(BaseModel):
    """The four core numbers, with the strings they were computed from.

    Split out from ``NumerologyProfileResponse`` so the Fortune Alignment can
    embed the readings without also re-declaring the tradition note. The
    alignment scores *root* digits — the compound only lives here, and a surface
    that shows a name number needs both.
    """

    psychic: NumberReadingOut
    destiny: NumberReadingOut
    name: NumberReadingOut | None = None
    namesake: NumberReadingOut | None = None
    #: Doctrine D3 — the exact string each name number was computed from. A
    #: response that does not say what it scored cannot be acted on.
    scored_name: str | None = Field(alias="scoredName", default=None)
    scored_namesake: str | None = Field(alias="scoredNamesake", default=None)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_profile(cls, profile: NumerologyProfile) -> NumerologyReadingsOut:
        return cls(
            psychic=NumberReadingOut.from_reading(profile.psychic),
            destiny=NumberReadingOut.from_reading(profile.destiny),
            name=NumberReadingOut.from_reading(profile.name) if profile.name else None,
            namesake=(
                NumberReadingOut.from_reading(profile.namesake) if profile.namesake else None
            ),
            scoredName=profile.scored_name,
            scoredNamesake=profile.scored_namesake,
        )


class NumerologyProfileResponse(NumerologyReadingsOut):
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)


class ObjectNumberRequest(BaseModel):
    value: str = Field(max_length=40, min_length=1)
    kind: ObjectKind

    model_config = ConfigDict(populate_by_name=True)


class ObjectNumberResponse(BaseModel):
    kind: ObjectKind
    raw: str
    #: What was actually scored after normalisation (mobile strips separators).
    scored: str
    reading: NumberReadingOut
    secondary_label: str | None = Field(alias="secondaryLabel", default=None)
    secondary: NumberReadingOut | None = None
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_reading(cls, result: ObjectReading) -> ObjectNumberResponse:
        return cls(
            kind=result.kind,
            raw=result.raw,
            scored=result.scored,
            reading=NumberReadingOut.from_reading(result.reading),
            secondaryLabel=result.secondary_label,
            secondary=(
                NumberReadingOut.from_reading(result.secondary) if result.secondary else None
            ),
        )


# ---------------------------------------------------------------------------
# Phase 3 — Fortune Alignment (NUM-30..33)
# ---------------------------------------------------------------------------
class NumberAlignmentOut(BaseModel):
    """How one number sits against this native's own chart.

    ``functionalNature`` is the enum key the rest of the app already uses
    (YOGAKARAKA, DUSTHANA, …), not a sentence — clients render it from their own
    vocabulary, so it is not gated behind the corpus review the way
    ``reasonEn``/``reasonTa`` are.
    """

    number: int
    graha: str
    graha_ta: str = Field(alias="grahaTa")
    graha_en: str = Field(alias="grahaEn")
    functional_nature: str = Field(alias="functionalNature")
    #: 0-100 natal strength of the graha, when the chart carried one.
    natal_strength: float | None = Field(alias="natalStrength", default=None)
    score: int
    verdict: str
    reason_en: str | None = Field(alias="reasonEn", default=None)
    reason_ta: str | None = Field(alias="reasonTa", default=None)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_alignment(cls, alignment: NumberAlignment) -> NumberAlignmentOut:
        return cls(
            number=alignment.number,
            graha=alignment.graha,
            grahaTa=planet_ta(alignment.graha),
            grahaEn=planet_en(alignment.graha),
            functionalNature=alignment.functional_nature.value,
            natalStrength=alignment.natal_strength,
            score=alignment.score,
            verdict=alignment.verdict.value,
            reasonEn=reviewed_prose(alignment.reason_en),
            reasonTa=reviewed_prose(alignment.reason_ta),
        )


class FortuneAlignmentRequest(BaseModel):
    """Names to score against the chart.

    No date of birth: the chart owns it. Letting a caller pass one would allow
    the numerology and the jadhagam on the same screen to disagree, which is the
    exact failure this whole phase exists to prevent.
    """

    document_name: str | None = Field(alias="documentName", default=None, max_length=120)
    called_name: str | None = Field(alias="calledName", default=None, max_length=120)

    model_config = ConfigDict(populate_by_name=True)


class FortuneAlignmentResponse(BaseModel):
    """The differentiator: a number read against the native's actual chart."""

    readings: NumerologyReadingsOut
    psychic: NumberAlignmentOut
    destiny: NumberAlignmentOut
    name: NumberAlignmentOut | None = None
    namesake: NumberAlignmentOut | None = None
    overall_score: int = Field(alias="overallScore")
    verdict: str
    #: Doctrine §9.1/§9.2. False for any functionally benefic graha, whatever
    #: the number's popular reputation — this is the field that lets the product
    #: say "your name is fine" instead of always selling a change.
    name_change_advised: bool = Field(alias="nameChangeAdvised")
    #: 1-9 ranked best-first for this chart (NUM-33).
    favourable_numbers: list[int] = Field(alias="favourableNumbers")
    lagna_rasi: int = Field(alias="lagnaRasi")
    recommendation_en: str | None = Field(alias="recommendationEn", default=None)
    recommendation_ta: str | None = Field(alias="recommendationTa", default=None)
    #: False while the interpretive corpus is unreviewed — every prose field
    #: above is null and the client should say so rather than render a gap.
    readings_available: bool = Field(alias="readingsAvailable", default_factory=readings_available)
    calculation_version: str = Field(alias="calculationVersion")
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_alignment(
        cls,
        profile: NumerologyProfile,
        alignment: FortuneAlignment,
        *,
        lagna_rasi: int,
        calculation_version: str,
    ) -> FortuneAlignmentResponse:
        return cls(
            readings=NumerologyReadingsOut.from_profile(profile),
            psychic=NumberAlignmentOut.from_alignment(alignment.psychic),
            destiny=NumberAlignmentOut.from_alignment(alignment.destiny),
            name=(
                NumberAlignmentOut.from_alignment(alignment.name) if alignment.name else None
            ),
            namesake=(
                NumberAlignmentOut.from_alignment(alignment.namesake)
                if alignment.namesake
                else None
            ),
            overallScore=alignment.overall_score,
            verdict=alignment.verdict.value,
            nameChangeAdvised=alignment.name_change_advised,
            favourableNumbers=list(alignment.favourable_numbers),
            lagnaRasi=lagna_rasi,
            recommendationEn=reviewed_prose(alignment.recommendation_en),
            recommendationTa=reviewed_prose(alignment.recommendation_ta),
            calculationVersion=calculation_version,
        )


class FavourableNumbersResponse(BaseModel):
    """All nine numbers ranked for this chart, best first (NUM-33)."""

    lagna_rasi: int = Field(alias="lagnaRasi")
    #: Ranked best-first. ``numbers[i].number`` is the same order as
    #: ``favourableNumbers`` — the two are projections of one sort.
    numbers: list[NumberAlignmentOut]
    favourable_numbers: list[int] = Field(alias="favourableNumbers")
    readings_available: bool = Field(alias="readingsAvailable", default_factory=readings_available)
    calculation_version: str = Field(alias="calculationVersion")
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)

    model_config = ConfigDict(populate_by_name=True)


# ---------------------------------------------------------------------------
# Phase 4 — Time numerology (NUM-40..44)
# ---------------------------------------------------------------------------
class PersonalYearOut(BaseModel):
    """The personal year in force, with the boundaries it was derived from.

    ``cycleStart``/``cycleEnd`` are not decoration: the year rolls on a
    different day under each D1 epoch, and a number without its window cannot be
    checked. ``epoch`` says which convention produced it.
    """

    reading: NumberReadingOut
    epoch: str
    #: The calendar year summed into the number — the previous one for dates
    #: before the rollover under the birthday and chithirai epochs.
    governing_year: int = Field(alias="governingYear")
    cycle_start: date = Field(alias="cycleStart")
    #: Inclusive last day of the cycle.
    cycle_end: date = Field(alias="cycleEnd")

    model_config = ConfigDict(populate_by_name=True)


class PersonalCycleRequest(BaseModel):
    """Date of birth plus the day to read. No birth time, no location."""

    birth_date: date = Field(alias="birthDate")
    #: Defaults to today at the server's date when omitted.
    on_date: date | None = Field(alias="onDate", default=None)

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("birth_date")
    @classmethod
    def _bounded(cls, value: date) -> date:
        if value.year < 1900 or value > date.today():
            raise ValueError("birthDate must be between 1900 and today")
        return value


class PersonalCycleResponse(BaseModel):
    """Personal year, month and day. Shared by the public and chart routes.

    The month and day steps are universal — only the *year* boundary is
    doctrinal — so the chart adds nothing to them. What the chart route adds is
    that the birth date comes from the jadhagam and Puthandu resolves at the
    native's own longitude rather than the Chennai reference point.
    """

    on_date: date = Field(alias="onDate")
    year: PersonalYearOut
    month: NumberReadingOut
    day: NumberReadingOut
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_cycle(cls, cycle: PersonalCycle) -> PersonalCycleResponse:
        return cls(
            onDate=cycle.on_date,
            year=PersonalYearOut(
                reading=NumberReadingOut.from_reading(cycle.year.reading),
                epoch=cycle.year.epoch.value,
                governingYear=cycle.year.governing_year,
                cycleStart=cycle.year.cycle_start,
                cycleEnd=cycle.year.cycle_end,
            ),
            month=NumberReadingOut.from_reading(cycle.month),
            day=NumberReadingOut.from_reading(cycle.day),
        )


class DateNumerologyOut(BaseModel):
    """The numerology layered onto one already-astrologically-valid date."""

    date: date
    reading: NumberReadingOut
    personal_day: NumberReadingOut | None = Field(alias="personalDay", default=None)
    #: 1-9 position of this date's number in the chart's own ranking, best = 1.
    favourability_rank: int | None = Field(alias="favourabilityRank", default=None)
    #: Signed points added to the astrological score, bounded to ±8.
    adjustment: int
    #: True when a positive adjustment was withheld because the panchangam
    #: flagged the date. Surfaced so the clamp is visible, never silent.
    clamped_by_astrology: bool = Field(alias="clampedByAstrology")
    note_en: str | None = Field(alias="noteEn", default=None)
    note_ta: str | None = Field(alias="noteTa", default=None)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_numerology(cls, numerology: DateNumerology) -> DateNumerologyOut:
        return cls(
            date=numerology.date,
            reading=NumberReadingOut.from_reading(numerology.reading),
            personalDay=(
                NumberReadingOut.from_reading(numerology.personal_day)
                if numerology.personal_day
                else None
            ),
            favourabilityRank=numerology.favourability_rank,
            adjustment=numerology.adjustment,
            clampedByAstrology=numerology.clamped_by_astrology,
            noteEn=reviewed_prose(numerology.note_en),
            noteTa=reviewed_prose(numerology.note_ta),
        )


class LuckyDateOut(BaseModel):
    """A muhurta slot with its numerology layer kept visibly separate.

    ``slot.score`` is the astrology's own verdict and is never overwritten;
    ``adjustedScore`` is what the ranking used. Both ship so a surface can
    always show exactly what the number moved.
    """

    slot: MuhurtaSlot
    numerology: DateNumerologyOut
    adjusted_score: float = Field(alias="adjustedScore")

    model_config = ConfigDict(populate_by_name=True)


class LuckyDatesResponse(BaseModel):
    """Muhurta slots re-ranked by numerology (NUM-42, NUM-44).

    No slot is added or removed by this layer. The muhurta engine decided which
    dates are fit to act on; numerology only reorders that set, and a slot
    carrying cautions can never sort above a clean one.
    """

    activity: str
    timezone: str
    epoch: str
    favourable_numbers: list[int] = Field(alias="favourableNumbers")
    dates: list[LuckyDateOut]
    readings_available: bool = Field(alias="readingsAvailable", default_factory=readings_available)
    calculation_version: str = Field(alias="calculationVersion")
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)

    model_config = ConfigDict(populate_by_name=True)


# ---------------------------------------------------------------------------
# Phase 5 — Name correction (NUM-53, NUM-54, NUM-57)
# ---------------------------------------------------------------------------
class NameCorrectionRequest(BaseModel):
    """The spelling on the user's documents — the one correction targets."""

    name: str = Field(max_length=120, min_length=1)
    #: 1 or 2. Two edits is already generous for real TN practice; the engine
    #: refuses more, because past that a "correction" is a different name.
    max_edits: int = Field(alias="maxEdits", default=2, ge=1, le=2)

    model_config = ConfigDict(populate_by_name=True)


class NameVariantOut(BaseModel):
    """One alternative spelling, with the derivation that produced it.

    ``operations`` is the point. A user is being asked to change a legal name;
    "the second 'a' was lengthened" is a reason they can weigh, and "the
    algorithm ranked it first" is not. The operation set is also the artefact an
    astrologer reviews — seven named orthographic moves, not a list of outputs.
    """

    spelling: str
    reading: NumberReadingOut
    operations: list[str]
    #: Signed change in Chaldean total against the current spelling.
    delta: int
    alignment: NumberAlignmentOut
    #: Points of alignment gained over the current spelling. Always positive —
    #: a spelling that scores worse is not offered at all.
    improvement: int

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_ranked(cls, ranked: RankedVariant) -> NameVariantOut:
        return cls(
            spelling=ranked.variant.spelling,
            reading=NumberReadingOut.from_reading(ranked.variant.reading),
            operations=[op.value for op in ranked.variant.operations],
            delta=ranked.variant.delta,
            alignment=NumberAlignmentOut.from_alignment(ranked.alignment),
            improvement=ranked.improvement,
        )


class NameCorrectionResponse(BaseModel):
    """Name analysis, and alternatives only when they may honestly be offered.

    Read ``alternatives`` together with ``noChangeReason`` and
    ``alternativesWithheldReason`` — an empty list means three different things:

    * ``noChangeReason: "benefic_lordship"`` — the name's graha is benefic in
      this chart. This is a **result**, and the strongest one the product can
      give. Render it as prominently as any recommendation.
    * ``noChangeReason: "not_misaligned"`` / ``"no_better_spelling"`` — nothing
      is wrong, or nothing scored better.
    * ``alternativesWithheldReason: "pending_content_review"`` — the engine
      *did* find alternatives and this layer removed them, because plan §9.4
      requires the legal-consequence warning alongside any recommendation and
      that warning has not cleared Tamil review. Say "not available yet", never
      "your name is fine".
    """

    original: str
    original_reading: NumberReadingOut = Field(alias="originalReading")
    original_alignment: NumberAlignmentOut = Field(alias="originalAlignment")
    alternatives: list[NameVariantOut]
    change_advised: bool = Field(alias="changeAdvised")
    no_change_reason: str | None = Field(alias="noChangeReason", default=None)
    alternatives_withheld_reason: str | None = Field(
        alias="alternativesWithheldReason", default=None
    )
    #: Spellings examined before ranking. A shortlist of three off 90 candidates
    #: reads as selective; the same three off six reads as a thin search.
    variants_considered: int = Field(alias="variantsConsidered")
    lagna_rasi: int = Field(alias="lagnaRasi")
    #: Plan §9.4 (NUM-57). Non-null whenever ``alternatives`` is non-empty —
    #: enforced by the validator below, so the two cannot be separated by a
    #: future edit to the route.
    legal_warning_en: str | None = Field(alias="legalWarningEn", default=None)
    legal_warning_ta: str | None = Field(alias="legalWarningTa", default=None)
    readings_available: bool = Field(alias="readingsAvailable", default_factory=readings_available)
    calculation_version: str = Field(alias="calculationVersion")
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)

    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="after")
    def _warning_ships_with_any_recommendation(self) -> NameCorrectionResponse:
        """Plan §9.4 made structural: the warning cannot be dropped in isolation.

        A response carrying alternatives without both warning strings fails to
        serialise at all. That is deliberately louder than a lint rule — this is
        the one place in the feature where the harm is administrative and real
        (Aadhaar, KYC, passport and certificates disagreeing for years), not
        interpretive.
        """
        if self.alternatives and not (self.legal_warning_en and self.legal_warning_ta):
            raise ValueError(
                "name-change alternatives may not be returned without the "
                "legal-consequence warning in both languages (plan §9.4/NUM-57)"
            )
        return self


# ---------------------------------------------------------------------------
# Phase 3 — Horoscope + numerology compatibility (NUM-34)
# ---------------------------------------------------------------------------
class NameHarmonyOut(BaseModel):
    """One partner's own name against their own date of birth and chart.

    Sethuraman's core doctrine (D5) — the thing Tamil families actually act on
    when they add or drop a letter. Null when that partner sent no name; that is
    "not asked", not "scored badly".

    Reported per side and never averaged into ``peyarPorutham.score``: it is a
    fact about one person, and mixing it in would make a couple's number partly
    a statement about only one of them.
    """

    score: int
    verdict: str
    #: False for any functionally benefic graha, whatever the number's popular
    #: reputation — the field that lets the product say "your name already suits
    #: you" rather than always selling a correction.
    change_advised: bool = Field(alias="changeAdvised")

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_harmony(cls, harmony: NameHarmony) -> NameHarmonyOut:
        return cls(
            score=harmony.score,
            verdict=harmony.verdict,
            changeAdvised=harmony.change_advised,
        )


class PoruthamVerdictOut(BaseModel):
    """The astrological verdict this numerology layered over — facts, no prose.

    Structured fields only. The porutham engine's own bilingual summary, its
    context note and the Nadi note are **reviewed** content that already ships
    on ``POST /relationships/compare``; duplicating them here would put the same
    copy in two response models to keep in step, and would sit a reviewed Tamil
    sentence next to this feature's withheld ones under a single
    ``readingsAvailable: false``, which reads as a contradiction. Callers that
    want the full reading — the ten kutas and the summary — call that route.
    """

    total_score: int = Field(alias="totalScore")
    max_score: int = Field(alias="maxScore")
    percentage: float
    #: EXCELLENT | GOOD | AVERAGE | CAUTION. Authoritative; numerology never
    #: recomputes it.
    label: str
    rajju_dosha: bool = Field(alias="rajjuDosha")
    vedha_dosha: bool = Field(alias="vedhaDosha")
    nadi_dosha: bool = Field(alias="nadiDosha")
    nadi_severity: str = Field(alias="nadiSeverity")

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_porutham(cls, data: DirectPoruthamData) -> PoruthamVerdictOut:
        return cls(
            totalScore=data.total_score,
            maxScore=data.max_score,
            percentage=data.percentage,
            label=data.label,
            rajjuDosha=data.rajju_dosha,
            vedhaDosha=data.vedha_dosha,
            nadiDosha=data.nadi_dosha.has_nadi_dosha,
            nadiSeverity=data.nadi_dosha.severity,
        )


#: Directional relation float -> the word a client renders. Sent as a token
#: rather than a sentence for the same reason ``functionalNature`` is: clients
#: have their own vocabulary, and a token is not prose to be gated.
_REGARD_LABEL: dict[float, str] = {FRIEND: "friend", NEUTRAL: "neutral", ENEMY: "enemy"}


class NumberPairOut(BaseModel):
    """One pair of numbers, with each side's own chart view kept separate.

    ``a`` and ``b`` are each number aligned against **its own** native's chart,
    so a surface can say whose graha is strong where. They are reported, not
    folded into ``pairScore`` — the pair relation is natural friendship between
    two grahas and is chart-independent by definition (see the engine module).

    ``aTowardB`` and ``bTowardA`` are not redundant. Permanent friendship is
    asymmetric: Rahu counts Venus a friend and Venus counts Rahu an enemy, and
    which partner is on which side of that is the reading.
    """

    kind: str
    a: NumberAlignmentOut
    b: NumberAlignmentOut
    #: Which doctrine graded ``relation``: "cheiro_series" | "graha_maitri".
    basis: str
    relation: str
    #: 0-100 for this pair alone.
    pair_score: int = Field(alias="pairScore")
    #: Share of the aggregate, before renormalisation over the pairs present.
    weight: float
    #: The naisargika (graha) view, sent under BOTH bases. Directional:
    #: "friend" | "neutral" | "enemy". Permanent friendship is asymmetric, and
    #: which partner is on which side of it is the reading — Rahu counts Venus a
    #: friend while Venus counts Rahu an enemy.
    graha_regard_a_to_b: str = Field(alias="grahaRegardAToB")
    graha_regard_b_to_a: str = Field(alias="grahaRegardBToA")
    graha_relation: str = Field(alias="grahaRelation")
    #: False when the two doctrines reach different grades for this pair. Not an
    #: error — it is the case worth showing an astrologer.
    bases_agree: bool = Field(alias="basesAgree")
    reason_en: str | None = Field(alias="reasonEn", default=None)
    reason_ta: str | None = Field(alias="reasonTa", default=None)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_pair(cls, pair: NumberPair) -> NumberPairOut:
        return cls(
            kind=pair.kind.value,
            a=NumberAlignmentOut.from_alignment(pair.a),
            b=NumberAlignmentOut.from_alignment(pair.b),
            basis=pair.basis.value,
            relation=pair.relation.value,
            pairScore=pair.score,
            weight=pair.weight,
            grahaRegardAToB=_REGARD_LABEL[pair.graha_regard_a_to_b],
            grahaRegardBToA=_REGARD_LABEL[pair.graha_regard_b_to_a],
            grahaRelation=pair.graha_relation.value,
            basesAgree=pair.bases_agree,
            reasonEn=reviewed_prose(pair.reason_en),
            reasonTa=reviewed_prose(pair.reason_ta),
        )


class NumerologyCompatibilityRequest(BaseModel):
    """Two charts, and optionally the name each person actually uses.

    Chart ids go in the body rather than the path because there are two of them
    and neither is subordinate to the other — ``/charts/{id}/numerology/...``
    would have to pick a primary, and this reading has none. Names go in the
    body for the same reason they do on the alignment route: they stay out of
    URLs and access logs.

    No dates of birth: both come from the charts. A caller who could pass one
    could make the numerology and the jadhagam disagree on the same screen.
    """

    chart_id_a: UUID = Field(alias="chartIdA")
    chart_id_b: UUID = Field(alias="chartIdB")
    document_name_a: str | None = Field(alias="documentNameA", default=None, max_length=120)
    document_name_b: str | None = Field(alias="documentNameB", default=None, max_length=120)
    #: Masks which kutas the porutham evaluates. Same vocabulary and same
    #: default as ``POST /relationships/compare``.
    compatibility_context: str = Field(alias="compatibilityContext", default="GENERAL")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("compatibility_context")
    @classmethod
    def _known_context(cls, value: str) -> str:
        if value not in VALID_COMPATIBILITY_CONTEXTS:
            raise ValueError(
                f"compatibilityContext must be one of {sorted(VALID_COMPATIBILITY_CONTEXTS)}"
            )
        return value

    @model_validator(mode="after")
    def _two_distinct_charts(self) -> NumerologyCompatibilityRequest:
        """A chart compared with itself is not a compatibility reading.

        Every pair would be a number against itself — harmonious by construction
        — and the porutham would match a nakshatra with its own. The arithmetic
        succeeds and the answer means nothing, which is the failure mode this
        feature refuses everywhere else.

        Note this is stricter than ``POST /relationships/compare``, which does
        not check. That route is older and this is not the change to fix it in;
        the divergence is deliberate and narrow.
        """
        if self.chart_id_a == self.chart_id_b:
            raise ValueError("chartIdA and chartIdB must be two different charts")
        return self


class PeyarPoruthamOut(BaseModel):
    """பெயர் பொருத்தம் — the numerology half, under its own Tamil name (D5).

    Named for what Tamil practice calls it rather than for what the code does.
    Peyar Porutham is the instrument used when a birth time is unknown; when
    both horoscopes exist — which is the case on this route — **Jathagam
    Porutham decides and this is read alongside it**, never over it.

    ``nameHarmonyA``/``nameHarmonyB`` are Sethuraman's core doctrine and are
    deliberately outside ``score``: they are per-person findings.
    """

    #: Destiny and psychic always; name only when both names were supplied.
    pairs: list[NumberPairOut]
    #: Weighted mean of the pair scores, 0-100.
    score: int
    #: Where that score lands: strong | supportive | neutral | guarded | difficult.
    #: A band, not a relation — a summary must not read as a finding about a
    #: specific pair.
    band: str
    #: Doctrine D4, server-configured: "cheiro_series" | "graha_maitri".
    basis: str
    name_harmony_a: NameHarmonyOut | None = Field(alias="nameHarmonyA", default=None)
    name_harmony_b: NameHarmonyOut | None = Field(alias="nameHarmonyB", default=None)
    #: Machine-readable name of the instrument. A token, not prose, so it ships
    #: while the Tamil corpus is dark — a client can render its own label from
    #: it. The sentences below are gated like every other sentence.
    method: str = "peyar_porutham"
    method_en: str | None = Field(alias="methodEn", default=None)
    method_ta: str | None = Field(alias="methodTa", default=None)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_compatibility(cls, numerology: NumerologyCompatibility) -> PeyarPoruthamOut:
        return cls(
            methodEn=reviewed_prose(PEYAR_PORUTHAM_EN),
            methodTa=reviewed_prose(PEYAR_PORUTHAM_TA),
            pairs=[NumberPairOut.from_pair(pair) for pair in numerology.pairs],
            score=numerology.score,
            band=numerology.band.value,
            basis=numerology.basis.value,
            nameHarmonyA=(
                NameHarmonyOut.from_harmony(numerology.name_harmony_a)
                if numerology.name_harmony_a
                else None
            ),
            nameHarmonyB=(
                NameHarmonyOut.from_harmony(numerology.name_harmony_b)
                if numerology.name_harmony_b
                else None
            ),
        )


class NumerologyCompatibilityResponse(BaseModel):
    """Jathagam Porutham first, Peyar Porutham second — the response says so.

    ``overallLabel`` is always ``astrology.label``. Peyar Porutham moves
    ``combinedScore`` by at most eight points and never moves the verdict; under
    the default basis it cannot lower it at all. A client leads with the label
    and treats ``peyarPorutham.score`` as the second opinion it is —
    ``precedenceEn``/``precedenceTa`` say that in words so the ranking does not
    depend on the client's layout.

    ``clampedByAstrology`` marks the case where a positive numerology adjustment
    was withheld because the poruthams flagged the match.
    """

    chart_id_a: UUID = Field(alias="chartIdA")
    chart_id_b: UUID = Field(alias="chartIdB")
    compatibility_context: str = Field(alias="compatibilityContext")
    #: Jathagam Porutham. Authoritative — everything below is a layer over this.
    astrology: PoruthamVerdictOut
    #: பெயர் பொருத்தம். Read alongside the astrology, never over it.
    peyar_porutham: PeyarPoruthamOut = Field(alias="peyarPorutham")
    #: Signed, bounded to ±8 — the same bound the date-scoring layer uses.
    adjustment: int
    clamped_by_astrology: bool = Field(alias="clampedByAstrology")
    #: astrology.percentage + adjustment, clamped to 0-100.
    combined_score: float = Field(alias="combinedScore")
    #: Always identical to ``astrology.label``. Present so a surface rendering
    #: the combined score has the verdict beside it and cannot invent its own.
    overall_label: str = Field(alias="overallLabel")
    lagna_rasi_a: int = Field(alias="lagnaRasiA")
    lagna_rasi_b: int = Field(alias="lagnaRasiB")
    readings_a: NumerologyReadingsOut = Field(alias="readingsA")
    readings_b: NumerologyReadingsOut = Field(alias="readingsB")
    #: Which instrument decides this match, as a token. Ships even while the
    #: corpus is dark, because the *ranking of the two instruments* is safety
    #: information and must not wait on a Tamil review — a client renders its own
    #: wording from this. The sentences saying the same thing are gated below.
    authority: str = "jathagam_porutham"
    precedence_en: str | None = Field(alias="precedenceEn", default=None)
    precedence_ta: str | None = Field(alias="precedenceTa", default=None)
    summary_en: str | None = Field(alias="summaryEn", default=None)
    summary_ta: str | None = Field(alias="summaryTa", default=None)
    readings_available: bool = Field(alias="readingsAvailable", default_factory=readings_available)
    calculation_version: str = Field(alias="calculationVersion")
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_compatibility(cls, result: ChartCompatibility) -> NumerologyCompatibilityResponse:
        layered = result.layered
        return cls(
            chartIdA=result.chart_id_a,
            chartIdB=result.chart_id_b,
            compatibilityContext=result.compatibility_context,
            astrology=PoruthamVerdictOut.from_porutham(result.porutham),
            peyarPorutham=PeyarPoruthamOut.from_compatibility(layered.numerology),
            adjustment=layered.adjustment,
            clampedByAstrology=layered.clamped_by_astrology,
            combinedScore=layered.combined_score,
            overallLabel=layered.label,
            lagnaRasiA=result.lagna_rasi_a,
            lagnaRasiB=result.lagna_rasi_b,
            readingsA=NumerologyReadingsOut.from_profile(result.profile_a),
            readingsB=NumerologyReadingsOut.from_profile(result.profile_b),
            precedenceEn=reviewed_prose(PRECEDENCE_EN),
            precedenceTa=reviewed_prose(PRECEDENCE_TA),
            summaryEn=reviewed_prose(summary_en(layered)),
            summaryTa=reviewed_prose(summary_ta(layered)),
            calculationVersion=result.calculation_version,
        )

    @model_validator(mode="after")
    def _verdict_is_the_astrologys(self) -> NumerologyCompatibilityResponse:
        """Doctrine §9.1 made structural: a number never overrides a graha.

        The engine already passes the porutham label straight through, but this
        response is where a future edit would be tempted to "improve" the
        headline by re-deriving a label from ``combinedScore``. Refusing to
        serialise the disagreement is louder than a comment saying not to.
        """
        if self.overall_label != self.astrology.label:
            raise ValueError(
                "overallLabel must be the porutham engine's own label — numerology "
                "may shade the score and never the verdict (plan §9.1/NUM-34)"
            )
        return self


class NumerologyNaalMatchOut(BaseModel):
    match: MuhurthamNaalMatchItem
    numerology: DateNumerologyOut
    adjusted_score: float = Field(alias="adjustedScore")

    model_config = ConfigDict(populate_by_name=True)


class MarriageDatesResponse(BaseModel):
    """Curated muhurtham naals re-ranked by numerology (NUM-43).

    ``isRecommended`` on each match is read, never written: numerology cannot
    promote a chandrashtama or avoid-tara date into the recommended set.
    """

    year: int
    epoch: str
    favourable_numbers: list[int] = Field(alias="favourableNumbers")
    #: Chart context from the muhurtham-naal engine, passed through unchanged.
    context: MuhurthamNaalMatchContext
    matches: list[NumerologyNaalMatchOut]
    readings_available: bool = Field(alias="readingsAvailable", default_factory=readings_available)
    calculation_version: str = Field(alias="calculationVersion")
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)

    model_config = ConfigDict(populate_by_name=True)


class NameSessionRequest(BaseModel):
    """A spelling to add to this chart's shortlist (NUM-58)."""

    name: str = Field(max_length=120, min_length=1)
    #: The user's own note. Free text they wrote themselves, so it is *not*
    #: interpretive copy and does not pass through ``reviewed_prose`` — the
    #: corpus gate withholds sentences this codebase wrote, not the user's.
    label: str | None = Field(default=None, max_length=120)
    max_edits: int = Field(alias="maxEdits", default=2, ge=1, le=2)

    model_config = ConfigDict(populate_by_name=True)


class SavedNameSessionOut(BaseModel):
    """One saved spelling, recomputed at read time.

    There is no stored score here and deliberately no field for one. ``reading``
    and ``alignment`` are computed on this request; the row supplied only the
    name, the label and ``maxEdits``.
    """

    name_session_id: UUID = Field(alias="nameSessionId")
    name: str
    label: str | None = None
    max_edits: int = Field(alias="maxEdits")
    reading: NumberReadingOut
    alignment: NumberAlignmentOut
    saved_at: datetime = Field(alias="savedAt")
    #: True when the engine version has moved since the user saved this. A
    #: changed number with no explanation is worse than one with an explanation.
    recalculated_since_saved: bool = Field(alias="recalculatedSinceSaved")

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_saved(cls, saved: SavedNameReading) -> SavedNameSessionOut:
        return cls(
            nameSessionId=saved.session.numerology_name_session_id,
            name=saved.session.candidate_name,
            label=saved.session.label,
            maxEdits=saved.session.max_edits,
            reading=NumberReadingOut.from_reading(saved.reading),
            alignment=NumberAlignmentOut.from_alignment(saved.alignment),
            savedAt=saved.session.created_at,
            recalculatedSinceSaved=saved.recalculated_since_saved,
        )


class NameSessionsResponse(BaseModel):
    """This chart's saved-name shortlist (NUM-58)."""

    sessions: list[SavedNameSessionOut]
    #: How many more spellings may be saved before the cap refuses.
    remaining_slots: int = Field(alias="remainingSlots")
    readings_available: bool = Field(alias="readingsAvailable", default_factory=readings_available)
    calculation_version: str = Field(alias="calculationVersion")
    tradition_en: str = Field(alias="traditionEn", default=TRADITION_NOTE_EN)
    tradition_ta: str = Field(alias="traditionTa", default=TRADITION_NOTE_TA)

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def from_saved(cls, rows: list[SavedNameReading]) -> NameSessionsResponse:
        return cls(
            sessions=[SavedNameSessionOut.from_saved(row) for row in rows],
            remainingSlots=max(0, MAX_SESSIONS_PER_CHART - len(rows)),
            calculationVersion=NAME_SESSION_CALCULATION_VERSION,
        )
