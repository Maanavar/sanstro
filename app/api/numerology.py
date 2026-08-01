"""Authenticated, chart-aware numerology (Phases 3-4).

The surface for the one reading a standalone numerology app structurally cannot
produce: a number scored against the native's *own* jadhagam. Everything here
needs a chart, which is why it is not in ``public_tools.py`` — the public tool
computes numbers, these routes compute what the numbers mean *for this person*.

Three things are true of every route below.

**The flag is checked before the chart is.** ``numerology_engine`` defaults off;
checking it first means a flag-off deployment answers 404 identically for a
chart that exists and one that does not, so the gate cannot be used to probe ids.

**Ownership is checked here, not in the services.** Same pattern as
``remedies.py`` / ``transits.py``: 404 for a chart or profile that is gone, 403
for one that belongs to someone else.

**No prose ships yet.** The engines emit ``reason_ta``, ``note_ta`` and a
name-change recommendation; none has had a Tamil native review. The schema
converters route every one of those through ``reviewed_prose`` and each response
carries ``readingsAvailable: false``, so the numbers, grahas, scores and verdicts
ship now and the sentences light up when the corpus clears — with no route,
schema or client change.

Path shape follows the repo's chart-scoped convention
(``/charts/{chart_id}/<thing>``) and the query params on lucky-dates and
marriage-dates deliberately mirror ``/charts/{chart_id}/muhurta`` and
``/charts/{chart_id}/muhurtham-naals`` exactly — these routes layer over those
engines, and a caller that can drive one should be able to drive the other
without relearning the parameters.

The one exception is ``POST /numerology/compatibility`` (NUM-34), which reads
*two* charts. Neither is subordinate to the other, so putting one in the path
would make it the subject and the other a parameter — both go in the body
instead. It is the same shape ``POST /relationships/compare`` already uses for
the porutham it layers over.
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.calculations.numerology import ScriptMismatchError
from app.calculations.numerology_correction import legal_warning
from app.calculations.numerology_naming import NamingMode, UnverifiedCanonError
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models import BirthProfile, Chart
from app.models.user import User
from app.schemas.muhurtham_naal import context_from_dict, item_from_match
from app.schemas.numerology import (
    BabyNamesResponse,
    DateNumerologyOut,
    FavourableNumbersResponse,
    FortuneAlignmentRequest,
    FortuneAlignmentResponse,
    LuckyDateOut,
    LuckyDatesResponse,
    MarriageDatesResponse,
    NameCorrectionRequest,
    NameCorrectionResponse,
    NameSessionRequest,
    NameSessionsResponse,
    NameVariantOut,
    NumberAlignmentOut,
    NumberReadingOut,
    NumerologyCompatibilityRequest,
    NumerologyCompatibilityResponse,
    NumerologyNaalMatchOut,
    PersonalCycleResponse,
)
from app.services.numerology_alignment_service import (
    alignment_for_chart,
    ranked_numbers_for_chart,
)
from app.services.numerology_compatibility_service import compatibility_for_charts
from app.services.numerology_correction_service import correct_name_for_chart
from app.services.numerology_name_session_service import (
    delete_name_session,
    list_name_sessions,
    save_name_session,
)
from app.services.numerology_naming_service import (
    baby_names_for_chart,
    require_baby_naming_enabled,
)
from app.services.numerology_service import require_numerology_enabled
from app.services.numerology_timing_service import (
    cycle_for_chart,
    lucky_dates_for_chart,
    marriage_dates_for_chart,
)

router = APIRouter()


def _assert_chart_owner(session: Session, chart_id: UUID, current_user: User) -> None:
    chart = session.get(Chart, chart_id)
    if chart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")
    profile = session.get(BirthProfile, chart.birth_profile_id)
    if profile is None or profile.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found."
        )
    if profile.owner_user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")


def _authorize(session: Session, chart_id: UUID, current_user: User) -> None:
    """Flag first, then ownership — see the module docstring."""
    require_numerology_enabled()
    _assert_chart_owner(session, chart_id, current_user)


def _authorize_baby_naming(session: Session, chart_id: UUID, current_user: User) -> None:
    """Both flags, then ownership. See `numerology_baby_naming`'s comment in
    `app.services.feature_flags` for why this feature needs a second flag on
    top of `numerology_engine`."""
    require_numerology_enabled()
    require_baby_naming_enabled()
    _assert_chart_owner(session, chart_id, current_user)


@router.post(
    "/charts/{chart_id}/numerology/alignment",
    response_model=FortuneAlignmentResponse,
    tags=["numerology"],
)
def get_fortune_alignment(
    chart_id: UUID,
    payload: FortuneAlignmentRequest = Body(default_factory=FortuneAlignmentRequest),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FortuneAlignmentResponse:
    """Fortune Alignment: this native's numbers against this native's chart.

    POST rather than GET because the names being scored are the user's own and
    would otherwise sit in URLs and access logs. The body is optional — with no
    names the psychic and destiny numbers still align, which is enough for a
    dashboard card.
    """
    _authorize(session, chart_id, current_user)
    try:
        result = alignment_for_chart(
            chart_id,
            session,
            document_name=payload.document_name,
            called_name=payload.called_name,
        )
    except ScriptMismatchError as exc:
        # Doctrine D3: Chaldean values are Latin-only. Refusing beats silently
        # skipping the characters and returning a confident wrong number.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    return FortuneAlignmentResponse.from_alignment(
        result.profile,
        result.alignment,
        lagna_rasi=result.lagna_rasi,
        calculation_version=result.calculation_version,
    )


@router.post(
    "/charts/{chart_id}/numerology/name-correction",
    response_model=NameCorrectionResponse,
    tags=["numerology"],
)
def get_name_correction(
    chart_id: UUID,
    payload: NameCorrectionRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NameCorrectionResponse:
    """Score a name against this chart and offer corrected spellings if warranted.

    Two outcomes are equally valid and the client must render both: a list of
    alternatives, and *no* list because the name's graha is already benefic in
    this chart. The second is the more valuable answer and the one every
    competing product is structurally unable to give.

    While the interpretive corpus is unreviewed the alternatives are withheld
    (``alternativesWithheldReason: "pending_content_review"``) because plan §9.4
    requires the legal-consequence warning alongside any recommendation. The
    analysis of the current name still ships.
    """
    _authorize(session, chart_id, current_user)
    try:
        correction = correct_name_for_chart(
            chart_id, payload.name, session, max_edits=payload.max_edits
        )
    except ScriptMismatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    alternatives = [NameVariantOut.from_ranked(row) for row in correction.alternatives]
    # The warning rides with the alternatives or neither ships — the response
    # model refuses to serialise the one without the other.
    warning = legal_warning() if alternatives else {}
    return NameCorrectionResponse(
        original=correction.result.original,
        originalReading=NumberReadingOut.from_reading(correction.result.original_reading),
        originalAlignment=NumberAlignmentOut.from_alignment(
            correction.result.original_alignment
        ),
        alternatives=alternatives,
        changeAdvised=correction.change_advised,
        noChangeReason=correction.result.no_change_reason,
        alternativesWithheldReason=correction.alternatives_withheld_reason,
        variantsConsidered=correction.result.variants_considered,
        lagnaRasi=correction.lagna_rasi,
        legalWarningEn=warning.get("legal_warning_en"),
        legalWarningTa=warning.get("legal_warning_ta"),
        calculationVersion=correction.calculation_version,
    )


@router.post(
    "/charts/{chart_id}/numerology/name-sessions",
    response_model=NameSessionsResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["numerology"],
)
def save_numerology_name_session(
    chart_id: UUID,
    payload: NameSessionRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NameSessionsResponse:
    """Save a spelling to this chart's shortlist (NUM-58).

    Returns the whole shortlist rather than the one row just written, because
    every client that saves a name immediately wants the list it now belongs to,
    and the alternative is a POST followed by a GET that recomputes the same
    readings a second time.

    Saving a spelling already on the list updates it in place — a retry is not a
    second session, and treating it as one would let a retry loop exhaust the cap.
    """
    _authorize(session, chart_id, current_user)
    try:
        save_name_session(
            session,
            owner_user_id=current_user.user_id,
            chart_id=chart_id,
            name=payload.name,
            label=payload.label,
            max_edits=payload.max_edits,
        )
    except ScriptMismatchError as exc:
        # Refused here rather than on read: a row holding a name the engine will
        # not score can only ever produce an error, and the 422 belongs at the
        # moment the user typed it.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    session.commit()
    return NameSessionsResponse.from_saved(list_name_sessions(session, chart_id))


@router.get(
    "/charts/{chart_id}/numerology/name-sessions",
    response_model=NameSessionsResponse,
    tags=["numerology"],
)
def get_numerology_name_sessions(
    chart_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NameSessionsResponse:
    """This chart's saved-name shortlist, recomputed (NUM-58).

    GET rather than POST despite carrying names, unlike the alignment and
    correction routes: the names are already stored server-side, so there is
    nothing here to keep out of a URL. Nothing user-supplied enters the path.
    """
    _authorize(session, chart_id, current_user)
    return NameSessionsResponse.from_saved(list_name_sessions(session, chart_id))


@router.delete(
    "/charts/{chart_id}/numerology/name-sessions/{name_session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["numerology"],
)
def delete_numerology_name_session(
    chart_id: UUID,
    name_session_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Remove a spelling from the shortlist (NUM-58). Soft delete."""
    _authorize(session, chart_id, current_user)
    if not delete_name_session(session, chart_id=chart_id, name_session_id=name_session_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Saved name not found."
        )
    session.commit()


@router.post(
    "/numerology/compatibility",
    response_model=NumerologyCompatibilityResponse,
    tags=["numerology"],
)
def get_numerology_compatibility(
    payload: NumerologyCompatibilityRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NumerologyCompatibilityResponse:
    """Jathagam Porutham for two charts, with Peyar Porutham alongside (NUM-34).

    Tamil practice ranks two instruments and so does this route (doctrine D5):
    **Jathagam Porutham** — the ten poruthams read from both horoscopes —
    decides the match, and **Peyar Porutham** (பெயர் பொருத்தம்), the
    names-and-dates instrument, is read alongside it and never over it.
    ``authority`` names the deciding one as a token so the ranking survives any
    client layout.

    **Not chart-scoped, deliberately.** Every other route in this module hangs
    off ``/charts/{chart_id}/numerology/...`` because it reads one native. This
    one reads two, and neither is subordinate to the other — putting one in the
    path would make it the subject and the other a parameter, which is not what
    a compatibility reading is. Both ids go in the body, alongside the optional
    names, and the body keeps the names out of access logs either way.

    **The poruthams decide; the numbers annotate.** ``overallLabel`` is the
    porutham engine's own label and the response model refuses to serialise any
    other value for it. Peyar Porutham moves ``combinedScore`` by at most eight
    points, by nothing upward when the match carries a dosha or a CAUTION
    verdict, and — under the default ``cheiro_series`` basis, which states
    sympathies and no enmities — by nothing downward at all. Every negative
    verdict in this response comes from the astrology.
    """
    require_numerology_enabled()
    _assert_chart_owner(session, payload.chart_id_a, current_user)
    _assert_chart_owner(session, payload.chart_id_b, current_user)
    try:
        result = compatibility_for_charts(
            payload.chart_id_a,
            payload.chart_id_b,
            session,
            document_name_a=payload.document_name_a,
            document_name_b=payload.document_name_b,
            compatibility_context=payload.compatibility_context,
        )
    except ScriptMismatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    return NumerologyCompatibilityResponse.from_compatibility(result)


@router.get(
    "/charts/{chart_id}/numerology/favourable-numbers",
    response_model=FavourableNumbersResponse,
    tags=["numerology"],
)
def get_favourable_numbers(
    chart_id: UUID,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FavourableNumbersResponse:
    """All nine numbers ranked for this chart, best first (NUM-33).

    Chart-first by construction — the ranking is a function of lordship and
    natal strength, never of a number's generic reputation. Needs no input
    beyond the chart, so it can sit on a dashboard unprompted.
    """
    _authorize(session, chart_id, current_user)
    ranked = ranked_numbers_for_chart(chart_id, session)
    return FavourableNumbersResponse(
        lagnaRasi=ranked.lagna_rasi,
        numbers=[NumberAlignmentOut.from_alignment(a) for a in ranked.alignments],
        favourableNumbers=list(ranked.numbers),
        calculationVersion=ranked.calculation_version,
    )


@router.get(
    "/charts/{chart_id}/numerology/personal-cycle",
    response_model=PersonalCycleResponse,
    tags=["numerology"],
)
def get_personal_cycle(
    chart_id: UUID,
    on_date: date | None = Query(default=None, alias="onDate"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PersonalCycleResponse:
    """Personal year, month and day for the native behind this chart.

    The birth date comes from the jadhagam, and Puthandu (under the chithirai
    epoch) resolves at the native's own longitude rather than the Chennai
    reference the public tool has to assume.
    """
    _authorize(session, chart_id, current_user)
    return PersonalCycleResponse.from_cycle(
        cycle_for_chart(chart_id, on_date or date.today(), session)
    )


@router.get(
    "/charts/{chart_id}/numerology/lucky-dates",
    response_model=LuckyDatesResponse,
    tags=["numerology"],
)
def get_lucky_dates(
    chart_id: UUID,
    activity: str = Query(
        description="JOB_START | MARRIAGE | EXAM | TRAVEL | INVESTMENT | MEDICAL | PURCHASE | SPIRITUAL"
    ),
    date_from: date = Query(alias="dateFrom"),
    date_to: date = Query(alias="dateTo"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LuckyDatesResponse:
    """Muhurta slots for an activity, re-ranked by numerology (NUM-42, NUM-44).

    Same parameters as ``/charts/{chart_id}/muhurta``, and the same slots: the
    muhurta engine runs first and unmodified, and this only annotates and
    reorders what it returned. ``slot.score`` is the astrology's own verdict and
    is never overwritten — compare it against ``adjustedScore`` to see exactly
    what the numerology moved.
    """
    _authorize(session, chart_id, current_user)
    result = lucky_dates_for_chart(chart_id, activity, date_from, date_to, session)
    return LuckyDatesResponse(
        activity=result.activity,
        timezone=result.timezone_name,
        epoch=result.epoch.value,
        favourableNumbers=list(result.favourable_numbers),
        dates=[
            LuckyDateOut(
                slot=row.slot,
                numerology=DateNumerologyOut.from_numerology(row.numerology),
                adjustedScore=row.adjusted_score,
            )
            for row in result.dates
        ],
        calculationVersion=result.calculation_version,
    )


@router.get(
    "/charts/{chart_id}/numerology/marriage-dates",
    response_model=MarriageDatesResponse,
    tags=["numerology"],
)
def get_marriage_dates(
    chart_id: UUID,
    year: int = Query(default=2027, description="Calendar year of the muhurtham sheet"),
    recommended_only: bool = Query(default=False, alias="recommendedOnly"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MarriageDatesResponse:
    """Curated muhurtham naals for a year, re-ranked by numerology (NUM-43).

    Same parameters as ``/charts/{chart_id}/muhurtham-naals``. The almanac sheet
    and its Tara Bala / chandrashtama verdicts are authoritative: numerology
    reorders within the recommended set and within the rest, never across them.
    """
    _authorize(session, chart_id, current_user)
    result = marriage_dates_for_chart(
        chart_id, year, session, recommended_only=recommended_only
    )
    return MarriageDatesResponse(
        year=result.year,
        epoch=result.epoch.value,
        favourableNumbers=list(result.favourable_numbers),
        context=context_from_dict(result.chart_context),
        matches=[
            NumerologyNaalMatchOut(
                match=item_from_match(row.match),
                numerology=DateNumerologyOut.from_numerology(row.numerology),
                adjustedScore=row.adjusted_score,
            )
            for row in result.matches
        ],
        calculationVersion=result.calculation_version,
    )


@router.get(
    "/charts/{chart_id}/numerology/baby-names",
    response_model=BabyNamesResponse,
    tags=["numerology"],
)
def get_baby_names(
    chart_id: UUID,
    gender: str | None = Query(default=None, description="m | f | n"),
    mode: str = Query(
        default="pada_first",
        description="pada_first | pada_weighted | rasi_wide | open",
    ),
    allow_ambiguous: bool = Query(default=False, alias="allowAmbiguous"),
    allow_tamil_collapse: bool = Query(default=False, alias="allowTamilCollapse"),
    limit: int = Query(default=20, ge=1, le=50),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BabyNamesResponse:
    """Baby names for the native's own birth (Moon) nakshatra-pada (NUM-50/51/52).

    GET, unlike alignment/correction: nothing here is user-supplied text that
    would otherwise sit in a URL or access log — the pada comes off the
    chart, and the filters are all enums/booleans.

    Behind a **second** flag on top of ``numerology_engine`` —
    ``numerology_baby_naming``, defaulting True as of 2026-07-30 (access-gating
    on product direction, not a claim of review — see
    ``app/services/feature_flags.py``). The nakshatra-pada canon this matches
    against is 0/108 astrologer-verified, and the name corpus is
    assistant-drafted with zero rows reviewed. ``response.usable`` is False
    and ``response.canonVerified`` is False until both clear; a client must
    not render ``candidates`` as a recommendation until then.
    """
    _authorize_baby_naming(session, chart_id, current_user)
    try:
        result = baby_names_for_chart(
            chart_id,
            session,
            gender=gender,
            mode=NamingMode(mode),
            allow_ambiguous=allow_ambiguous,
            allow_tamil_collapse=allow_tamil_collapse,
            limit=limit,
        )
    except UnverifiedCanonError as exc:
        # Belt-and-braces backstop behind the flag above (see module and
        # service docstrings) — reachable only if the flag were flipped True
        # against a still-unverified canon in a real environment.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    return BabyNamesResponse.from_result(result)
