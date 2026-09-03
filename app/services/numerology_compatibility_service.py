"""Horoscope + numerology compatibility orchestration (NUM-34, Phase 3).

Thin, like the alignment and correction services: the doctrine lives in the pure
module ``app.calculations.numerology_compatibility``, where the bound, the clamp
and the "label is never recomputed" rule are unit-testable without a database.

**The astrology runs first, and it runs unmodified.** This service calls
``synastry_service.compare_chart_snapshots_direct`` — the same function
``POST /relationships/compare`` serves — and takes its verdict as given, doshas
and A-4 veto downgrade included. Only then is the numerology computed and
layered on. Reusing that call rather than reaching for ``compute_porutham``
directly is deliberate: the context masking, the Rajju/Vedha label cap and the
Nadi parihara mode all live in the wrapper, and a numerology surface that
disagreed with the porutham screen about the same two charts would be worse
than having no numerology surface.

**Both charts, one load each.** The porutham needs the snapshots and the
numerology needs each native's lagna, strengths, nodes and date of birth — which
``load_chart_context`` derives from the same snapshot. Passing it through keeps
this to two loads rather than four; chart loads are the expensive part of these
requests.

Ownership is not checked here. Same rule as ``numerology_service``:
authorisation is a route concern in this codebase, and a report or batch caller
with no request user must still be able to run this.
"""
from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session

from app.calculations.numerology import NumberReading, NumerologyProfile, build_profile
from app.calculations.numerology_alignment import FortuneAlignment, align_profile
from app.calculations.numerology_compatibility import (
    CompatibilityBasis,
    LayeredCompatibility,
    NumberPair,
    PairKind,
    compare_numbers,
    layer_over_porutham,
    pair_numbers,
    resolve_basis,
)
from app.schemas.relationships import DirectPoruthamData
from app.services.chart_service import load_persisted_chart_response
from app.services.feature_flags import get_flag
from app.services.numerology_service import load_chart_context, require_numerology_enabled
from app.services.synastry_service import compare_chart_snapshots_direct

CALCULATION_VERSION = "numerology-compatibility-v1"


def compatibility_basis() -> CompatibilityBasis:
    """Doctrine D4, read at request time.

    Raises on an unrecognised flag value rather than defaulting — a typo must not
    silently ship a doctrine nobody chose.
    """
    return resolve_basis(get_flag("numerology_compatibility_basis"))


@dataclass(frozen=True, slots=True)
class ChartCompatibility:
    """A porutham verdict with the numerology layer, plus what fed each side."""

    chart_id_a: UUID
    chart_id_b: UUID
    compatibility_context: str
    #: The astrology, exactly as ``POST /relationships/compare`` would answer it.
    porutham: DirectPoruthamData
    layered: LayeredCompatibility
    profile_a: NumerologyProfile
    profile_b: NumerologyProfile
    lagna_rasi_a: int
    lagna_rasi_b: int
    #: Each partner's own numbers against their own chart. Feeds the per-side
    #: name harmony (D5, Sethuraman); never mixed into the pair score.
    alignment_a: FortuneAlignment
    alignment_b: FortuneAlignment
    calculation_version: str = CALCULATION_VERSION


def has_astrological_caution(porutham: DirectPoruthamData) -> bool:
    """Whether the poruthams flagged this match, in any of the four ways.

    Nadi dosha is included even though it does not force a ``CAUTION`` label on
    its own — it is a caution in every practitioner's reading of the word, and
    the clamp exists so numerology cannot brighten a flagged match. Reading only
    ``label == "CAUTION"`` would let a Nadi-dosha pair collect a positive nudge.
    """
    return bool(
        porutham.label == "CAUTION"
        or porutham.rajju_dosha
        or porutham.vedha_dosha
        or porutham.nadi_dosha.has_nadi_dosha
    )


def _pairs_for(
    profile_a: NumerologyProfile,
    profile_b: NumerologyProfile,
    *,
    basis: CompatibilityBasis,
    lagna_rasi_a: int,
    lagna_rasi_b: int,
    strengths_a: dict[str, float],
    strengths_b: dict[str, float],
    node_rasi_map_a: dict[str, int],
    node_rasi_map_b: dict[str, int],
) -> tuple[NumberPair, ...]:
    """Pair every number both natives have. Names pair only if both were given.

    A name pair against a missing name is not a weak signal, it is no signal —
    scoring one side's name against the other's *destiny* number would be an
    invented rule, and dropping the pair renormalises the weights honestly.
    """
    def build(
        kind: PairKind, reading_a: NumberReading, reading_b: NumberReading
    ) -> NumberPair:
        return pair_numbers(
            kind,
            reading_a,
            reading_b,
            basis=basis,
            lagna_rasi_a=lagna_rasi_a,
            lagna_rasi_b=lagna_rasi_b,
            strengths_a=strengths_a,
            strengths_b=strengths_b,
            node_rasi_map_a=node_rasi_map_a,
            node_rasi_map_b=node_rasi_map_b,
        )

    pairs = [
        build(PairKind.DESTINY, profile_a.destiny, profile_b.destiny),
        build(PairKind.PSYCHIC, profile_a.psychic, profile_b.psychic),
    ]
    if profile_a.name is not None and profile_b.name is not None:
        pairs.append(build(PairKind.NAME, profile_a.name, profile_b.name))
    return tuple(pairs)


def compatibility_for_charts(
    chart_id_a: UUID,
    chart_id_b: UUID,
    session: Session,
    *,
    document_name_a: str | None = None,
    document_name_b: str | None = None,
    compatibility_context: str = "GENERAL",
) -> ChartCompatibility:
    """Compare two charts astrologically, then layer the numerology (NUM-34).

    Dates of birth come from the charts, never from the caller — the same rule
    the single-chart alignment route follows, and for the same reason: the
    numerology and the jadhagam on one screen must not be able to disagree.
    Names are caller-supplied because they are not chart data; ``build_profile``
    raises ``ScriptMismatchError`` on non-Latin input (doctrine D3) and the route
    turns that into a 422.
    """
    require_numerology_enabled()
    basis = compatibility_basis()

    snap_a = load_persisted_chart_response(session, chart_id_a)
    snap_b = load_persisted_chart_response(session, chart_id_b)

    # Astrology first, and taken as given.
    porutham = compare_chart_snapshots_direct(
        snap_a, snap_b, compatibility_context=compatibility_context
    ).data

    ctx_a = load_chart_context(session, chart_id_a, snapshot=snap_a)
    ctx_b = load_chart_context(session, chart_id_b, snapshot=snap_b)

    profile_a = build_profile(
        year=ctx_a.birth_date.year,
        month=ctx_a.birth_date.month,
        day=ctx_a.birth_date.day,
        document_name=document_name_a,
    )
    profile_b = build_profile(
        year=ctx_b.birth_date.year,
        month=ctx_b.birth_date.month,
        day=ctx_b.birth_date.day,
        document_name=document_name_b,
    )

    # Sethuraman's core doctrine (D5): each partner's own name against their own
    # date of birth and chart. Pure functions over context already loaded, so
    # this costs no additional query.
    alignment_a = align_profile(
        profile_a,
        ctx_a.lagna_rasi,
        strengths=ctx_a.strengths,
        node_rasi_map=ctx_a.node_rasi_map,
    )
    alignment_b = align_profile(
        profile_b,
        ctx_b.lagna_rasi,
        strengths=ctx_b.strengths,
        node_rasi_map=ctx_b.node_rasi_map,
    )

    numerology = compare_numbers(
        _pairs_for(
            profile_a,
            profile_b,
            basis=basis,
            lagna_rasi_a=ctx_a.lagna_rasi,
            lagna_rasi_b=ctx_b.lagna_rasi,
            strengths_a=ctx_a.strengths,
            strengths_b=ctx_b.strengths,
            node_rasi_map_a=ctx_a.node_rasi_map,
            node_rasi_map_b=ctx_b.node_rasi_map,
        ),
        alignment_a=alignment_a,
        alignment_b=alignment_b,
    )

    return ChartCompatibility(
        chart_id_a=chart_id_a,
        chart_id_b=chart_id_b,
        compatibility_context=compatibility_context,
        porutham=porutham,
        layered=layer_over_porutham(
            numerology,
            porutham_percentage=porutham.percentage,
            porutham_label=porutham.label,
            has_astrological_caution=has_astrological_caution(porutham),
        ),
        profile_a=profile_a,
        profile_b=profile_b,
        lagna_rasi_a=ctx_a.lagna_rasi,
        lagna_rasi_b=ctx_b.lagna_rasi,
        alignment_a=alignment_a,
        alignment_b=alignment_b,
    )
