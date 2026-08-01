"""Baby naming orchestration (NUM-50/51/52) — Phase 5's blocked half, wired.

`docs/NUMEROLOGY_IMPLEMENTATION_PLAN_2026-07-25.md` marked this "Blocked" on
2026-07-27: the pure pada-matching engine (`app.calculations.numerology_naming`,
NU-8a) was built, but had no corpus, no chart bridge and no route. This module
adds those three, and gates all of them behind `numerology_baby_naming`
(checked independently of `numerology_engine`; defaults `True` as of
2026-07-30 on product direction — access-gating, not a claim of review) — see
that flag's comment in `app.services.feature_flags` for why this feature
carries two stacked, unresolved blockers that nothing else shipped under
`numerology_engine` does: the pada canon is 0/108 verified, and
`app.data.tamil_name_corpus` is a corpus the assistant drafted to exercise
this pipeline, with zero rows reviewed. `assert_canon_usable()` (in the pure
engine) is the backstop that still raises outside dev/test regardless of
either flag.

**The pipeline, end to end:**

    chart_id -> load_chart_context (Moon's nakshatra_id/pada)
             -> NamingConstraints
             -> find_names(TAMIL_NAME_CORPUS, constraints)   [pure engine]
             -> per match: score_text(spelling) -> align_number(...)
             -> re-sort WITHIN each pada-confidence tier by alignment score
             -> ChartBabyNames

Pada precedence decides which names are candidates at all (plan doctrine D2);
Chaldean and Fortune Alignment only order the names that already passed that
filter. A number never overrides a graha (plan §9.1) — this module does not
touch `find_names`'s own tier ordering, it only breaks ties inside a tier.

**Three entry points, not two.**

- `baby_names_for_chart` — a saved chart, full alignment. For an existing
  family member.
- `baby_names_for_pada` — a bare nakshatra + pada, no alignment (no chart
  means no lagna). The fallback when even birth details aren't at hand.
- `baby_names_for_birth_details` — raw birth details, an ephemeral chart, full
  alignment, nothing persisted. **This is the primary path**: it needs no
  saved profile, which is the normal case for the person this feature is
  actually for — a baby who does not have one yet. Mirrors how
  `/public/chart-preview` already lets Jadhagam Generator work the same way,
  without login.
"""
from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.numerology import NumberReading, score_text
from app.calculations.numerology_alignment import NumberAlignment, align_number
from app.calculations.numerology_naming import (
    AksharaRelation,
    EmptyReason,
    MatchConfidence,
    NameCandidate,
    NamingConstraints,
    NamingMode,
    NamingResult,
    ScoredCandidate,
    find_names,
)
from app.data.tamil_name_corpus import TAMIL_NAME_CORPUS
from app.schemas.charts import ChartCalculateResponse
from app.services.feature_flags import get_flag
from app.services.numerology_service import (
    load_chart_context,
    pada_context_from_snapshot,
    require_numerology_enabled,
)

CALCULATION_VERSION = "numerology-baby-naming-v1"

DEFAULT_LIMIT = 20
MAX_LIMIT = 50

_CONFIDENCE_RANK: dict[MatchConfidence, int] = {
    MatchConfidence.CONFIRMED: 0,
    MatchConfidence.TAMIL_ONLY: 1,
    MatchConfidence.LATIN_ONLY: 2,
    MatchConfidence.AMBIGUOUS: 3,
    MatchConfidence.NO_MATCH: 4,
}

#: Declaration order of `AksharaRelation` is on-target first, by design.
_RELATION_RANK: dict[AksharaRelation, int] = {
    relation: index for index, relation in enumerate(AksharaRelation)
}


def baby_naming_enabled() -> bool:
    return bool(get_flag("numerology_baby_naming"))


def require_baby_naming_enabled() -> None:
    """404 while the capability flag is off — same shape as `require_numerology_enabled`.

    A separate flag, not folded into `numerology_engine`: this is the only
    numerology surface still blocked on unreviewed content quality rather than
    just an unreviewed *description* of a number.
    """
    if not baby_naming_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not available.")


@dataclass(frozen=True, slots=True)
class RankedNameCandidate:
    """One matched name: its pada evidence, its Chaldean reading, and — when a
    chart is behind the call — its Fortune Alignment."""

    candidate: NameCandidate
    #: None when this name opens with no paadham akshara at all — only
    #: reachable at `NamingMode.OPEN`, where the parent has set the akshara
    #: rule aside on purpose.
    row_nakshatra_id: int | None
    row_pada: int | None
    #: Tamil almanac name of the star whose paadham this name's letter opens,
    #: which is the whole content of "ஆ opens Kaarthigai paadham 1, not
    #: Uthiradam paadham 3". None alongside `row_nakshatra_id`.
    row_nakshatra_ta: str | None
    row_nakshatra_en: str | None
    row_akshara_ta: str | None
    confidence: MatchConfidence
    #: Where this name's opening stands relative to the birth paadham. Every
    #: widened result must carry this or a parent cannot tell which names the
    #: tradition actually chose from the ones they asked to also see.
    relation: AksharaRelation
    matched_spelling: str
    reading: NumberReading
    alignment: NumberAlignment | None
    warnings: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class ChartBabyNames:
    matches: tuple[RankedNameCandidate, ...]
    target_nakshatra_id: int
    #: Tamil almanac names — உத்திராடம் / "Uthiradam". The Sanskrit form is
    #: carried alongside for anyone cross-referencing a Sanskrit source, and is
    #: never the string a Tamil reader is shown.
    target_nakshatra_ta: str
    target_nakshatra_en: str
    target_nakshatra_sanskrit: str
    target_pada: int
    #: The opening letter this paadham calls for, in both scripts. This is the
    #: single fact the whole tradition turns on ("the name should begin with
    #: ஜா"), and the response carried everything BUT it until 2026-07-31 —
    #: which left an empty result with nothing to explain itself with.
    target_akshara_ta: str
    target_akshara_en: str
    #: The Moon rasi this paadham sits in — the scope one rung wider than the
    #: natchathiram, and the one a parent is most likely to have been told
    #: about ("name the child by the rasi letter").
    target_rasi: int
    #: The rung the caller asked for, echoed back. Distinct from
    #: `relaxations_applied`: that says what the search did, this says what
    #: rule the parent chose, and the UI has to explain the rule even when the
    #: strict search happened to fill the page on its own.
    mode: str
    relaxations_applied: tuple[str, ...]
    #: False while the target row is draft canon, the pool was empty, or the
    #: search found nothing — never render `matches` as a recommendation
    #: unless this is True. Mirrors `NamingResult.usable` exactly.
    usable: bool
    #: Developer sentence — for logs. Clients render from `empty_reason_code`;
    #: this one used to leak verbatim into the UI.
    empty_reason: str | None
    empty_reason_code: EmptyReason | None
    warnings: tuple[str, ...]
    #: None on the public (chart-less) path — every `matches[i].alignment` is
    #: None too, in that case.
    lagna_rasi: int | None
    calculation_version: str = CALCULATION_VERSION


def _matched_spelling(scored: ScoredCandidate) -> str:
    """The Latin string this match is scored and shown under.

    `matched_latin_variant` is None for a TAMIL_ONLY match (Latin evidence
    played no part) — the candidate's first Latin variant is still a real
    spelling of the same name and is what Chaldean scoring needs as input.
    """
    return scored.matched_latin_variant or scored.candidate.latin_variants[0]


def _rank(
    result: NamingResult,
    *,
    lagna_rasi: int | None,
    strengths: dict[str, float] | None,
    node_rasi_map: dict[str, int] | None,
    limit: int,
) -> tuple[RankedNameCandidate, ...]:
    ranked: list[RankedNameCandidate] = []
    for scored in result.matches:
        spelling = _matched_spelling(scored)
        reading = score_text(spelling)
        alignment: NumberAlignment | None = None
        if lagna_rasi is not None:
            alignment = align_number(
                reading.root,
                lagna_rasi,
                natal_strength=(strengths or {}).get(reading.graha),
                node_rasi_map=node_rasi_map,
            )
        ranked.append(
            RankedNameCandidate(
                candidate=scored.candidate,
                row_nakshatra_id=scored.row.nakshatra_id if scored.row else None,
                row_pada=scored.row.pada if scored.row else None,
                row_nakshatra_ta=scored.row.nakshatra_ta if scored.row else None,
                row_nakshatra_en=scored.row.nakshatra_en if scored.row else None,
                row_akshara_ta=scored.row.akshara_tamil if scored.row else None,
                confidence=scored.confidence,
                relation=scored.relation or AksharaRelation.ON_PAADHAM,
                matched_spelling=spelling,
                reading=reading,
                alignment=alignment,
                warnings=scored.warnings,
            )
        )

    def sort_key(item: RankedNameCandidate) -> tuple[int, int, float, str]:
        # 1) how close this name's letter is to the birth paadham. Doctrine D2
        #    — the pada akshara leads, numerology only ranks WITHIN what it
        #    admits — so a widened name never displaces one that opens with
        #    the letter this paadham actually calls for, however well it
        #    scores. This used to sit below confidence, which was harmless
        #    while siblings could only appear on an otherwise-empty search;
        #    once the scope rungs became additive (2026-07-31) they interleave
        #    and a CONFIRMED sibling would have outranked an on-target match.
        #    It is a full relation rank rather than an on/off flag because
        #    RASI_WIDE and OPEN put three and four distinct tiers on one page,
        #    and "your own star" must still outrank "somewhere in your rasi".
        # 2) pada-confidence tier (never overridden by a number — plan §9.1)
        # 3) alignment score, best first, when a chart is behind this call
        # 4) spelling, for a deterministic order when neither of the above decides
        alignment_rank = -item.alignment.score if item.alignment is not None else 0
        return (
            _RELATION_RANK[item.relation],
            _CONFIDENCE_RANK[item.confidence],
            alignment_rank,
            item.matched_spelling,
        )

    ranked.sort(key=sort_key)
    return tuple(ranked[:limit])


def _baby_names_for_constraints(
    constraints: NamingConstraints,
    *,
    lagna_rasi: int | None,
    strengths: dict[str, float] | None,
    node_rasi_map: dict[str, int] | None,
    limit: int,
) -> ChartBabyNames:
    """Shared tail of both entry points below. Callers must gate first —
    this raises `UnverifiedCanonError` (via `find_names`) unguarded."""
    result = find_names(list(TAMIL_NAME_CORPUS), constraints)
    ranked = _rank(
        result,
        lagna_rasi=lagna_rasi,
        strengths=strengths,
        node_rasi_map=node_rasi_map,
        limit=min(limit, MAX_LIMIT),
    )
    return ChartBabyNames(
        matches=ranked,
        target_nakshatra_id=result.target_row.nakshatra_id,
        target_nakshatra_ta=result.target_row.nakshatra_ta,
        target_nakshatra_en=result.target_row.nakshatra_en,
        target_nakshatra_sanskrit=result.target_row.nakshatra_sanskrit,
        target_pada=result.target_row.pada,
        target_akshara_ta=result.target_row.akshara_tamil,
        target_akshara_en=result.target_row.akshara_latin_bare,
        target_rasi=result.target_rasi,
        mode=result.mode.value,
        relaxations_applied=tuple(r.value for r in result.relaxations_applied),
        usable=result.usable,
        empty_reason=result.empty_reason,
        empty_reason_code=result.empty_reason_code,
        warnings=result.warnings,
        lagna_rasi=lagna_rasi,
    )


def baby_names_for_chart(
    chart_id: UUID,
    session: Session,
    *,
    gender: str | None = None,
    mode: NamingMode = NamingMode.PADA_FIRST,
    allow_ambiguous: bool = False,
    allow_tamil_collapse: bool = False,
    limit: int = DEFAULT_LIMIT,
) -> ChartBabyNames:
    """Baby names for the native behind this chart, ranked by pada then Fortune Alignment.

    Flags are checked before the chart is loaded (same reasoning as
    `app.api.numerology`'s `_authorize`): a flag-off deployment must not let a
    caller distinguish "chart exists" from "chart does not exist".
    """
    require_numerology_enabled()
    require_baby_naming_enabled()
    ctx = load_chart_context(session, chart_id)
    constraints = NamingConstraints(
        nakshatra_id=ctx.moon_nakshatra_id,
        pada=ctx.moon_pada,
        mode=mode,
        gender=gender,
        allow_ambiguous=allow_ambiguous,
        allow_tamil_collapse=allow_tamil_collapse,
    )
    return _baby_names_for_constraints(
        constraints,
        lagna_rasi=ctx.lagna_rasi,
        strengths=ctx.strengths,
        node_rasi_map=ctx.node_rasi_map,
        limit=limit,
    )


def baby_names_for_pada(
    nakshatra_id: int,
    pada: int,
    *,
    gender: str | None = None,
    mode: NamingMode = NamingMode.PADA_FIRST,
    allow_ambiguous: bool = False,
    allow_tamil_collapse: bool = False,
    limit: int = DEFAULT_LIMIT,
) -> ChartBabyNames:
    """Baby names for a bare nakshatra + pada — the public, chart-less path.

    No chart means no lagna: every result's `alignment` is `None`, and ranking
    within a confidence tier falls back to spelling order.
    """
    require_numerology_enabled()
    require_baby_naming_enabled()
    constraints = NamingConstraints(
        nakshatra_id=nakshatra_id,
        pada=pada,
        mode=mode,
        gender=gender,
        allow_ambiguous=allow_ambiguous,
        allow_tamil_collapse=allow_tamil_collapse,
    )
    return _baby_names_for_constraints(
        constraints, lagna_rasi=None, strengths=None, node_rasi_map=None, limit=limit
    )


def baby_names_for_birth_details(
    chart_response: ChartCalculateResponse,
    *,
    gender: str | None = None,
    mode: NamingMode = NamingMode.PADA_FIRST,
    allow_ambiguous: bool = False,
    allow_tamil_collapse: bool = False,
    limit: int = DEFAULT_LIMIT,
) -> ChartBabyNames:
    """Baby names from an ephemeral chart — raw birth details, no account, no save.

    Mirrors `/public/chart-preview`: the caller (a public route) computes a
    full chart in memory for this one request via
    `app.services.chart_service._chart_response_from_profile` and hands it
    here — nothing is persisted, so there is no `chart_id` to look up. This is
    the primary entry point for finding a name for someone who does not have a
    saved profile yet, which in practice is every baby this feature is for.

    Unlike `baby_names_for_pada`, this DOES carry Fortune Alignment — an
    ephemeral chart still has a real lagna and real planetary strengths, so
    there is no reason to withhold ranking the way the bare-pada public path
    has to.
    """
    require_numerology_enabled()
    require_baby_naming_enabled()
    lagna_rasi, strengths, node_rasi_map, moon_nakshatra_id, moon_pada = (
        pada_context_from_snapshot(chart_response)
    )
    constraints = NamingConstraints(
        nakshatra_id=moon_nakshatra_id,
        pada=moon_pada,
        mode=mode,
        gender=gender,
        allow_ambiguous=allow_ambiguous,
        allow_tamil_collapse=allow_tamil_collapse,
    )
    return _baby_names_for_constraints(
        constraints,
        lagna_rasi=lagna_rasi,
        strengths=strengths,
        node_rasi_map=node_rasi_map,
        limit=limit,
    )
