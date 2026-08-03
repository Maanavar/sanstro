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

from collections.abc import Sequence
from dataclasses import dataclass, replace
from typing import Literal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.calculations.numerology import NumberReading, score_text
from app.calculations.numerology_alignment import (
    NumberAlignment,
    align_number,
    should_advise_name_change,
)
from app.calculations.numerology_naming import (
    AksharaRelation,
    EmptyReason,
    MatchConfidence,
    NameCandidate,
    NamingConstraints,
    NamingMode,
    NamingResult,
    ScoredCandidate,
    evaluate_against_target,
    find_names,
)
from app.data.nakshatra_pada_akshara import PadaAkshara
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
#: A parent's own shortlist, checked against the same criteria as the corpus
#: and shown at its true rank — not a second recommendation list. Capped small
#: because this is "compare the names you already have," not a second search.
MAX_USER_NAMES = 5

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
    #: The same name written with the family's surname — "Aadhini
    #: Senthilkumar" — scored as one string, when a `family_name` was
    #: supplied. All three are None otherwise.
    #:
    #: Tamil Nadu naming has genuinely moved: the traditional initial + given
    #: name now coexists with first-name/last-name on every document, and both
    #: are names the child really carries. So both are answered.
    #:
    #: This never touches ranking, `relation`, `confidence` or
    #: `advise_against`. The paadham akshara is a rule about the GIVEN name's
    #: opening letter — a surname can neither satisfy nor violate it — and the
    #: called name is what the namakarana uses and what the child is addressed
    #: by. Ranking on the full name would also make the same given name rank
    #: differently for every family, i.e. make our list about the surname
    #: rather than about the name.
    #:
    #: Expect `full_name_reading.compound` to be None far more often than the
    #: called name's: Cheiro's series stops at 52 and full names routinely
    #: exceed it (doctrine D6).
    full_name_spelling: str | None = None
    full_name_reading: NumberReading | None = None
    full_name_alignment: NumberAlignment | None = None
    #: "corpus" — one of ours; "user" — one of the parent's own shortlist that
    #: doesn't also appear in the corpus; "both" — the parent's pick happens to
    #: BE a corpus name, shown once, not duplicated. Defaults to "corpus" so
    #: every existing construction site (the plain corpus ranking) is
    #: unaffected.
    source: Literal["corpus", "user", "both"] = "corpus"
    #: 1-based position in the FULL ranked pool (corpus + user shortlist),
    #: before `limit` trims the corpus side. A user's own name can rank behind
    #: `limit` and still be shown.
    overall_rank: int = 0

    @property
    def advise_against(self) -> bool:
        """Would a numerologist tell this family to set this spelling aside?

        Delegates to `should_advise_name_change` — the SAME guard the Fortune
        Alignment name-change recommendation uses — rather than inventing a
        second threshold for this surface. What that guard refuses matters as
        much as what it flags: a functionally **benefic** lordship is never a
        reason to reject a name, however bad the number's popular reputation
        ("8 is unlucky" is the least defensible claim in this trade). Only a
        non-benefic lordship that is also MISALIGNED or worse trips it.

        Never reorders across a relation tier — doctrine D2 holds, so a flagged
        on-paadham name still sits with the other on-paadham names. It sinks
        within its own tier because `_sort_key` already orders by fit there,
        and it is labelled rather than hidden: the akshara claim is real even
        when the number is poor, and that combination is exactly what the name
        *correction* feature exists to fix.
        """
        return should_advise_name_change(self.alignment)


@dataclass(frozen=True, slots=True)
class UserNameQuery:
    """One name from a parent's own shortlist (English spelling only — Tamil
    script input was deliberately left out of this feature, so these can
    reach at best LATIN_ONLY/AMBIGUOUS confidence, same ceiling any other
    Latin-only evidence has in this engine)."""

    latin_spelling: str


@dataclass(frozen=True, slots=True)
class ChartBabyNames:
    matches: tuple[RankedNameCandidate, ...]
    #: Size of the full ranked pool (corpus matches + shortlist entries)
    #: before `limit` trimmed the corpus side. Lets the UI say "your name
    #: ranks #47 of 132" even when only the top `limit` corpus names show.
    total_matches: int
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


def _align(
    reading: NumberReading,
    *,
    lagna_rasi: int | None,
    strengths: dict[str, float] | None,
    node_rasi_map: dict[str, int] | None,
) -> NumberAlignment | None:
    """Fortune Alignment for one reading, or None on the chart-less path."""
    if lagna_rasi is None:
        return None
    return align_number(
        reading.root,
        lagna_rasi,
        natal_strength=(strengths or {}).get(reading.graha),
        node_rasi_map=node_rasi_map,
    )


def _full_name(
    given: str,
    family_name: str | None,
    *,
    lagna_rasi: int | None,
    strengths: dict[str, float] | None,
    node_rasi_map: dict[str, int] | None,
) -> tuple[str | None, NumberReading | None, NumberAlignment | None]:
    """Score "<given> <family>" as one string — the name on the documents.

    Returns a triple of Nones when no surname was supplied, which is the
    ordinary case and not an error. `score_text` drops the space itself into
    `ignored_characters`, so the total is the two names' letters combined.
    """
    family = (family_name or "").strip()
    if not family:
        return (None, None, None)
    spelling = f"{given.strip()} {family}"
    reading = score_text(spelling)
    return (
        spelling,
        reading,
        _align(reading, lagna_rasi=lagna_rasi, strengths=strengths, node_rasi_map=node_rasi_map),
    )


def _matched_spelling(scored: ScoredCandidate) -> str:
    """The Latin string this match is scored and shown under.

    `matched_latin_variant` is None for a TAMIL_ONLY match (Latin evidence
    played no part) — the candidate's first Latin variant is still a real
    spelling of the same name and is what Chaldean scoring needs as input.
    """
    return scored.matched_latin_variant or scored.candidate.latin_variants[0]


def _confidence_rank(item: RankedNameCandidate) -> int:
    """Confidence tier for ranking, with the input-form artefact removed.

    `LATIN_ONLY` means the English initial matched **and is unambiguous for
    that row** (see `latin_is_ambiguous`) — the row is pinned; the only thing
    missing is Tamil corroboration. For a corpus name that gap is real
    evidence about the entry, because the corpus always carries both scripts,
    so a LATIN_ONLY corpus row means the Tamil actively did NOT agree.

    For a name the parent typed it is not evidence about anything: Baby Name
    Finder collects English spelling only, by product decision, so a
    user-supplied name can *never* reach CONFIRMED however good it is.
    Measured before changing this — Uthiradam P3, girl, `open` scope: the
    parent's own name scored **85, tied for the best chart fit of all 116
    names, and ranked 116th of 116**, entirely because of this tier. Ranking a
    name last on the strength of a field our own form made unfillable is not a
    judgement about the name.

    `AMBIGUOUS` is NOT promoted: that tier means the matching script is lossy
    for that row, which is a genuine doubt about which paadham the letter
    opens, and it survives regardless of who supplied the name.

    Doctrine D2 is untouched — `relation` still leads, so a promoted user name
    only ever moves *within* its own relation tier, never above an on-paadham
    name.
    """
    if item.source in ("user", "both") and item.confidence is MatchConfidence.LATIN_ONLY:
        return _CONFIDENCE_RANK[MatchConfidence.CONFIRMED]
    return _CONFIDENCE_RANK[item.confidence]


def _sort_key(item: RankedNameCandidate) -> tuple[int, int, float, str]:
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
    #    A user-supplied name that opens no paadham at all (NO_PAADHAM) sorts
    #    last for the same reason — the letter rule still leads even when the
    #    name being ranked is the parent's own pick, not a recommendation.
    # 2) pada-confidence tier (never overridden by a number — plan §9.1),
    #    less the English-only input artefact — see `_confidence_rank`.
    # 3) alignment score, best first, when a chart is behind this call
    # 4) spelling, for a deterministic order when neither of the above decides
    alignment_rank = -item.alignment.score if item.alignment is not None else 0
    return (
        _RELATION_RANK[item.relation],
        _confidence_rank(item),
        alignment_rank,
        item.matched_spelling,
    )


def _rank(
    result: NamingResult,
    *,
    lagna_rasi: int | None,
    strengths: dict[str, float] | None,
    node_rasi_map: dict[str, int] | None,
    family_name: str | None = None,
) -> tuple[RankedNameCandidate, ...]:
    """Score and sort every corpus match. NOT truncated to `limit` here —
    a caller merging in a parent's own shortlist needs the full ranked pool
    first, so a shortlist name's true position can be computed before the
    display cut is applied (see `_finalize`)."""
    ranked: list[RankedNameCandidate] = []
    for scored in result.matches:
        spelling = _matched_spelling(scored)
        reading = score_text(spelling)
        alignment = _align(
            reading, lagna_rasi=lagna_rasi, strengths=strengths, node_rasi_map=node_rasi_map
        )
        # Our own recommendations carry the full-name reading too: a parent
        # choosing from this list needs to know how "Gayathri Senthilkumar"
        # sits, not only how their own picks do.
        full_spelling, full_reading, full_alignment = _full_name(
            spelling,
            family_name,
            lagna_rasi=lagna_rasi,
            strengths=strengths,
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
                full_name_spelling=full_spelling,
                full_name_reading=full_reading,
                full_name_alignment=full_alignment,
            )
        )
    ranked.sort(key=_sort_key)
    return tuple(ranked)


def _evaluate_user_candidate(
    query: UserNameQuery,
    *,
    target_row: PadaAkshara,
    target_rasi: int,
    lagna_rasi: int | None,
    strengths: dict[str, float] | None,
    node_rasi_map: dict[str, int] | None,
    family_name: str | None = None,
) -> RankedNameCandidate:
    """Score one of the parent's own names against the birth paadham — the
    TRUE relation/confidence (see `evaluate_against_target`), not gated by
    `NamingMode`. A name the parent already chose is never withheld for
    "not matching well enough"; the whole point is to show where it stands.

    `query.latin_spelling` is the GIVEN name only. The surname arrives once,
    as `family_name`, because a family has one — retyping it onto all five
    candidates would also let the five drift apart.
    """
    spelling = query.latin_spelling.strip()
    candidate = NameCandidate(tamil_form="", latin_variants=(spelling,))
    scored = evaluate_against_target(candidate, target_row, target_rasi)
    reading = score_text(spelling)
    alignment = _align(
        reading, lagna_rasi=lagna_rasi, strengths=strengths, node_rasi_map=node_rasi_map
    )
    full_spelling, full_reading, full_alignment = _full_name(
        spelling,
        family_name,
        lagna_rasi=lagna_rasi,
        strengths=strengths,
        node_rasi_map=node_rasi_map,
    )
    return RankedNameCandidate(
        candidate=candidate,
        row_nakshatra_id=scored.row.nakshatra_id if scored.row else None,
        row_pada=scored.row.pada if scored.row else None,
        row_nakshatra_ta=scored.row.nakshatra_ta if scored.row else None,
        row_nakshatra_en=scored.row.nakshatra_en if scored.row else None,
        row_akshara_ta=scored.row.akshara_tamil if scored.row else None,
        confidence=scored.confidence,
        relation=scored.relation or AksharaRelation.NO_PAADHAM,
        matched_spelling=spelling,
        reading=reading,
        alignment=alignment,
        warnings=scored.warnings,
        source="user",
        full_name_spelling=full_spelling,
        full_name_reading=full_reading,
        full_name_alignment=full_alignment,
    )


def _merge_user_candidates(
    corpus_ranked: tuple[RankedNameCandidate, ...],
    user_ranked: tuple[RankedNameCandidate, ...],
) -> tuple[RankedNameCandidate, ...]:
    """Union a parent's shortlist onto the corpus ranking, re-sorted together.

    De-dupes on spelling: when a shortlist name IS a corpus name, the corpus
    card is tagged "both" and shown once — a parent must not see their own
    pick listed twice under two different cards.
    """
    if not user_ranked:
        return corpus_ranked

    def key(spelling: str) -> str:
        return spelling.strip().casefold()

    user_keys = {key(item.matched_spelling) for item in user_ranked}
    tagged_corpus = tuple(
        replace(item, source="both") if key(item.matched_spelling) in user_keys else item
        for item in corpus_ranked
    )
    corpus_keys = {key(item.matched_spelling) for item in corpus_ranked}
    extra_user = tuple(item for item in user_ranked if key(item.matched_spelling) not in corpus_keys)
    return tuple(sorted(tagged_corpus + extra_user, key=_sort_key))


def _finalize(combined_sorted: tuple[RankedNameCandidate, ...], limit: int) -> tuple[RankedNameCandidate, ...]:
    """Assign each match its true 1-based rank, then trim: the top `limit`
    corpus recommendations, PLUS every shortlist name regardless of where it
    falls — a parent's own pick is never silently dropped for ranking outside
    the display cut, that is the fact this feature exists to surface."""
    positioned = [replace(item, overall_rank=i + 1) for i, item in enumerate(combined_sorted)]
    kept: list[RankedNameCandidate] = []
    corpus_kept = 0
    for item in positioned:
        if item.source in ("user", "both"):
            kept.append(item)
        elif corpus_kept < limit:
            kept.append(item)
            corpus_kept += 1
    kept.sort(key=lambda item: item.overall_rank)
    return tuple(kept)


def _baby_names_for_constraints(
    constraints: NamingConstraints,
    *,
    lagna_rasi: int | None,
    strengths: dict[str, float] | None,
    node_rasi_map: dict[str, int] | None,
    limit: int,
    user_names: Sequence[UserNameQuery] = (),
    family_name: str | None = None,
) -> ChartBabyNames:
    """Shared tail of the entry points below. Callers must gate first —
    this raises `UnverifiedCanonError` (via `find_names`) unguarded."""
    result = find_names(list(TAMIL_NAME_CORPUS), constraints)
    corpus_ranked = _rank(
        result,
        lagna_rasi=lagna_rasi,
        strengths=strengths,
        node_rasi_map=node_rasi_map,
        family_name=family_name,
    )
    cleaned_user_names = [q for q in user_names if q.latin_spelling.strip()][:MAX_USER_NAMES]
    if cleaned_user_names:
        user_ranked = tuple(
            _evaluate_user_candidate(
                q,
                target_row=result.target_row,
                target_rasi=result.target_rasi,
                lagna_rasi=lagna_rasi,
                strengths=strengths,
                node_rasi_map=node_rasi_map,
                family_name=family_name,
            )
            for q in cleaned_user_names
        )
        combined = _merge_user_candidates(corpus_ranked, user_ranked)
    else:
        combined = corpus_ranked
    ranked = _finalize(combined, min(limit, MAX_LIMIT))
    return ChartBabyNames(
        matches=ranked,
        total_matches=len(combined),
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
    user_names: Sequence[UserNameQuery] = (),
    family_name: str | None = None,
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
        user_names=user_names,
        family_name=family_name,
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
    user_names: Sequence[UserNameQuery] = (),
    family_name: str | None = None,
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
        constraints,
        lagna_rasi=None,
        strengths=None,
        node_rasi_map=None,
        limit=limit,
        user_names=user_names,
        family_name=family_name,
    )


def baby_names_for_birth_details(
    chart_response: ChartCalculateResponse,
    *,
    gender: str | None = None,
    mode: NamingMode = NamingMode.PADA_FIRST,
    allow_ambiguous: bool = False,
    allow_tamil_collapse: bool = False,
    limit: int = DEFAULT_LIMIT,
    user_names: Sequence[UserNameQuery] = (),
    family_name: str | None = None,
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
        user_names=user_names,
        family_name=family_name,
    )
