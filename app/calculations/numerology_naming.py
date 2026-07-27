"""Name Lab — pada-akshara constraint satisfaction (NU-8a).

Pure module: no DB, no ephemeris, no clock, no settings import. Given a
nakshatra + pada and a pool of candidate names, decide which candidates carry a
valid starting akshara, how confidently, and what had to be relaxed to return a
non-empty result.

Two hard rules, both from the NU-8a fixture analysis:

1. **Unverified canon never reaches a user.** ``assert_canon_usable()`` raises
   ``UnverifiedCanonError`` when the table has unverified rows and ``APP_ENV``
   is a real user environment ("production"/"staging" — the same set
   ``app.core.config`` uses). Dev and test run freely so the pipeline can be
   built and exercised now.

2. **Neither script confirms a pada alone.** Bare Latin loses retroflex/dental
   (11-P3 ṭī and 16-P1 tī are both "Ti"); Tamil loses aspiration/voicing
   (ka/kha/ga/gha all -> க). A candidate matched on one script only is
   ``AMBIGUOUS``, not a match, whenever that script is lossy *for that row*.
   Ambiguous candidates are withheld by default and surface only through an
   explicit relaxation step that is recorded in the result.

The relaxation ladder exists because a strict two-script match against a small
name pool very often returns nothing, and a Name Lab that silently returns an
empty list is indistinguishable from one that is broken. Every widening is
named in ``NamingResult.relaxations_applied`` so the caller can tell the user
exactly how far the search had to reach.
"""
from __future__ import annotations

import os
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field
from enum import Enum, StrEnum

from app.data.nakshatra_pada_akshara import (
    CANON_NAME,
    CANON_VERSION,
    PADA_AKSHARA_BY_KEY,
    PADA_AKSHARA_TABLE,
    PadaAkshara,
    is_production_ready,
    verified_row_count,
)

#: Mirrors ``app.core.config.Settings._require_strong_secrets_in_production``.
#: Kept as a literal rather than imported so this module stays pure.
REAL_USER_ENVS: frozenset[str] = frozenset({"production", "staging"})


class UnverifiedCanonError(RuntimeError):
    """Raised when draft canon would have been served to a real user."""


def _current_app_env() -> str:
    return os.getenv("APP_ENV", os.getenv("JOTHIDAM_ENVIRONMENT", "development")).strip().lower()


def assert_canon_usable() -> None:
    """Fail loudly if draft pada canon is about to be used in production.

    Called at the top of every public entry point. Deliberately not cached —
    the check is a dict lookup and a string compare, and caching it would let a
    process that booted in dev keep serving after an env flip.
    """
    if _current_app_env() not in REAL_USER_ENVS:
        return
    if is_production_ready():
        return
    raise UnverifiedCanonError(
        f"{CANON_NAME} v{CANON_VERSION} is draft canon "
        f"({verified_row_count()}/{len(PADA_AKSHARA_TABLE)} rows verified). "
        "It must not produce user-facing name recommendations. "
        "Complete the NU-8a verification protocol and flip verified=True row by row."
    )


# ---------------------------------------------------------------------------
# Collision indices — built once at import.
#
# These are what make single-script evidence untrustworthy. A bare-Latin or
# Tamil form appearing at more than one (nakshatra, pada) cannot identify a pada
# on its own.
# ---------------------------------------------------------------------------
def _build_collision_index(attr: str) -> dict[str, tuple[tuple[int, int], ...]]:
    buckets: dict[str, list[tuple[int, int]]] = defaultdict(list)
    for row in PADA_AKSHARA_TABLE:
        buckets[getattr(row, attr)].append(row.key)
    return {value: tuple(keys) for value, keys in buckets.items()}


LATIN_BARE_INDEX: dict[str, tuple[tuple[int, int], ...]] = _build_collision_index("akshara_latin_bare")
TAMIL_INDEX: dict[str, tuple[tuple[int, int], ...]] = _build_collision_index("akshara_tamil")


def latin_is_ambiguous(row: PadaAkshara) -> bool:
    """True when this row's bare-Latin akshara also occurs at another pada."""
    return len(LATIN_BARE_INDEX.get(row.akshara_latin_bare, ())) > 1


def tamil_is_ambiguous(row: PadaAkshara) -> bool:
    """True when this row's Tamil akshara also occurs at another pada.

    Distinct from ``row.tamil_collapse``: collapse is an orthographic property
    of the letter, this is an observed collision within the 108-row table.
    """
    return len(TAMIL_INDEX.get(row.akshara_tamil, ())) > 1


# ---------------------------------------------------------------------------
# Candidate model
# ---------------------------------------------------------------------------
@dataclass(frozen=True, slots=True)
class NameCandidate:
    """A name in both scripts.

    Both forms are required. A candidate carrying only one script can only ever
    reach ``AMBIGUOUS`` on a lossy row, which is not a result worth showing.
    ``latin_variants`` is a tuple because Tamil romanisation is genuinely
    many-to-one in practice (தீபா -> "Deepa"/"Dheepa"/"Theepa").
    """

    tamil_form: str
    latin_variants: tuple[str, ...]
    meaning_en: str | None = None
    meaning_ta: str | None = None
    gender: str | None = None  # "m" | "f" | "n" | None

    def __post_init__(self) -> None:
        if not self.tamil_form.strip():
            raise ValueError("NameCandidate.tamil_form must not be empty")
        if not self.latin_variants:
            raise ValueError("NameCandidate.latin_variants must not be empty")


class MatchConfidence(Enum):
    """How well a candidate's opening is pinned to a specific pada."""

    CONFIRMED = "confirmed"        # both scripts agree
    TAMIL_ONLY = "tamil_only"      # Tamil matches and is unambiguous for this row
    LATIN_ONLY = "latin_only"      # Latin matches and is unambiguous for this row
    AMBIGUOUS = "ambiguous"        # matched, but the matching script is lossy here
    NO_MATCH = "no_match"


#: Confidences that count as a real match under strict search.
STRICT_CONFIDENCES: frozenset[MatchConfidence] = frozenset({MatchConfidence.CONFIRMED})
#: Confidences acceptable once single-script evidence is allowed.
SINGLE_SCRIPT_CONFIDENCES: frozenset[MatchConfidence] = STRICT_CONFIDENCES | {
    MatchConfidence.TAMIL_ONLY,
    MatchConfidence.LATIN_ONLY,
}


@dataclass(frozen=True, slots=True)
class ScoredCandidate:
    candidate: NameCandidate
    row: PadaAkshara
    confidence: MatchConfidence
    matched_latin_variant: str | None
    warnings: tuple[str, ...] = ()

    @property
    def is_match(self) -> bool:
        return self.confidence is not MatchConfidence.NO_MATCH


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------
def _normalize_latin(value: str) -> str:
    """Casefold + strip diacritics so 'Dheepa' and 'dheepa' compare equal.

    NFD-decompose then drop combining marks: a user typing "Thīrthā" must match
    the same way as "Thirtha".
    """
    decomposed = unicodedata.normalize("NFD", value.strip())
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return stripped.casefold()


def _normalize_tamil(value: str) -> str:
    return unicodedata.normalize("NFC", value.strip())


def _tamil_opening_matches(candidate: NameCandidate, row: PadaAkshara) -> bool:
    return _normalize_tamil(candidate.tamil_form).startswith(_normalize_tamil(row.akshara_tamil))


def _latin_opening_match(candidate: NameCandidate, row: PadaAkshara) -> str | None:
    """Return the candidate variant that opens with an accepted Latin initial.

    Longest-initial-first so "Bha" wins over "Ba" on the same variant — the
    longer initial is the more specific claim.
    """
    accepted = sorted((_normalize_latin(i) for i in row.latin_initial_set), key=len, reverse=True)
    for variant in candidate.latin_variants:
        norm = _normalize_latin(variant)
        if any(norm.startswith(initial) for initial in accepted):
            return variant
    return None


def _alternate_opening_matches(candidate: NameCandidate, row: PadaAkshara) -> str | None:
    """Match against a competing tradition's reading of the same pada.

    Only Shravana carries one today (Ja-series vs Kha-series). Both are
    attested, so a name valid under either reading is valid for the pada;
    silently honouring only one would reject correct names.
    """
    if row.alternate is None:
        return None
    _deva, _iso, latin_bare, tamil = row.alternate
    if _normalize_tamil(candidate.tamil_form).startswith(_normalize_tamil(tamil)):
        return latin_bare
    target = _normalize_latin(latin_bare)
    for variant in candidate.latin_variants:
        if _normalize_latin(variant).startswith(target):
            return latin_bare
    return None


def evaluate_candidate(candidate: NameCandidate, row: PadaAkshara) -> ScoredCandidate:
    """Score one candidate against one pada row. Pure; no guard (callers guard)."""
    tamil_hit = _tamil_opening_matches(candidate, row)
    latin_hit = _latin_opening_match(candidate, row)
    warnings: list[str] = []

    if not tamil_hit and latin_hit is None:
        alternate_hit = _alternate_opening_matches(candidate, row)
        if alternate_hit is not None:
            # Matched the competing tradition, not the primary reading. Never
            # better than AMBIGUOUS: which series applies is itself unresolved.
            return ScoredCandidate(
                candidate=candidate,
                row=row,
                confidence=MatchConfidence.AMBIGUOUS,
                matched_latin_variant=None,
                warnings=(
                    f"Matched the alternate reading '{alternate_hit}' for pada "
                    f"{row.nakshatra_id}-{row.pada}, not the primary "
                    f"'{row.akshara_latin_bare}'. Two traditions are in circulation "
                    "for this nakshatra and the split is unresolved.",
                    f"Row {row.nakshatra_id}-{row.pada} is unverified draft canon "
                    f"(tier {row.confidence_tier}); not fit for a user-facing "
                    "recommendation.",
                ),
            )

    if tamil_hit and latin_hit:
        confidence = MatchConfidence.CONFIRMED
    elif tamil_hit:
        # Tamil evidence alone is only trustworthy where the Tamil letter is not
        # shared across Sanskrit consonants AND does not recur in the table.
        if row.tamil_collapse or tamil_is_ambiguous(row):
            confidence = MatchConfidence.AMBIGUOUS
            warnings.append(
                f"Tamil akshara {row.akshara_tamil} does not uniquely identify pada "
                f"{row.nakshatra_id}-{row.pada}; Latin form did not corroborate."
            )
        else:
            confidence = MatchConfidence.TAMIL_ONLY
    elif latin_hit:
        if latin_is_ambiguous(row):
            others = [k for k in LATIN_BARE_INDEX[row.akshara_latin_bare] if k != row.key]
            confidence = MatchConfidence.AMBIGUOUS
            warnings.append(
                f"Bare-Latin '{row.akshara_latin_bare}' also occurs at {others}; "
                "Tamil form did not corroborate."
            )
        else:
            confidence = MatchConfidence.LATIN_ONLY
    else:
        confidence = MatchConfidence.NO_MATCH

    if confidence is not MatchConfidence.NO_MATCH and not row.verified:
        warnings.append(
            f"Row {row.nakshatra_id}-{row.pada} is unverified draft canon "
            f"(tier {row.confidence_tier}); not fit for a user-facing recommendation."
        )

    return ScoredCandidate(
        candidate=candidate,
        row=row,
        confidence=confidence,
        matched_latin_variant=latin_hit,
        warnings=tuple(warnings),
    )


def padas_for_name(candidate: NameCandidate) -> tuple[ScoredCandidate, ...]:
    """Reverse lookup: which padas does this name's opening suit?

    Returns a tuple, never a single row — an akshara does not uniquely identify
    a pada in either script (see module docstring). Callers that want "the"
    pada for a name are asking a question the table cannot answer.
    """
    assert_canon_usable()
    scored = (evaluate_candidate(candidate, row) for row in PADA_AKSHARA_TABLE)
    return tuple(sorted(
        (s for s in scored if s.is_match),
        key=lambda s: (_CONFIDENCE_RANK[s.confidence], s.row.key),
    ))


_CONFIDENCE_RANK: dict[MatchConfidence, int] = {
    MatchConfidence.CONFIRMED: 0,
    MatchConfidence.TAMIL_ONLY: 1,
    MatchConfidence.LATIN_ONLY: 2,
    MatchConfidence.AMBIGUOUS: 3,
    MatchConfidence.NO_MATCH: 4,
}


# ---------------------------------------------------------------------------
# Constraint satisfaction
# ---------------------------------------------------------------------------
class NamingMode(StrEnum):
    """Mirrors the ``numerology_naming_mode`` feature flag (doctrine D2)."""

    PADA_FIRST = "pada_first"        # pada akshara is a hard filter
    PADA_WEIGHTED = "pada_weighted"  # sibling padas may be reached for


@dataclass(frozen=True, slots=True)
class NamingConstraints:
    nakshatra_id: int
    pada: int
    mode: NamingMode = NamingMode.PADA_FIRST
    gender: str | None = None
    #: Withhold candidates whose only evidence is a lossy script.
    allow_ambiguous: bool = False
    #: Withhold rows whose Tamil letter is shared across Sanskrit consonants.
    allow_tamil_collapse: bool = False

    def __post_init__(self) -> None:
        if not 1 <= self.nakshatra_id <= 27:
            raise ValueError(f"nakshatra_id must be 1..27, got {self.nakshatra_id}")
        if not 1 <= self.pada <= 4:
            raise ValueError(f"pada must be 1..4, got {self.pada}")


class Relaxation(StrEnum):
    """Ordered widening steps. Every step taken is reported to the caller."""

    NONE = "none"
    ALLOW_TAMIL_COLLAPSE = "allow_tamil_collapse"
    ALLOW_SINGLE_SCRIPT = "allow_single_script"
    ALLOW_AMBIGUOUS = "allow_ambiguous"
    SIBLING_PADAS = "sibling_padas"
    DROP_GENDER = "drop_gender"


@dataclass(frozen=True, slots=True)
class NamingResult:
    matches: tuple[ScoredCandidate, ...]
    target_row: PadaAkshara
    relaxations_applied: tuple[Relaxation, ...] = ()
    warnings: tuple[str, ...] = ()
    #: False when the result must not be shown as a recommendation — draft
    #: canon, gated collapse row, or an empty search.
    usable: bool = False
    empty_reason: str | None = None

    @property
    def is_empty(self) -> bool:
        return not self.matches


@dataclass
class _Search:
    """Mutable accumulator for the relaxation ladder."""

    rows: list[PadaAkshara]
    accepted: frozenset[MatchConfidence]
    gender: str | None
    steps: list[Relaxation] = field(default_factory=list)


def _gender_ok(candidate: NameCandidate, wanted: str | None) -> bool:
    return wanted is None or candidate.gender is None or candidate.gender == wanted


def _collect(pool: list[NameCandidate], search: _Search) -> list[ScoredCandidate]:
    hits: list[ScoredCandidate] = []
    for row in search.rows:
        for candidate in pool:
            if not _gender_ok(candidate, search.gender):
                continue
            scored = evaluate_candidate(candidate, row)
            if scored.confidence in search.accepted:
                hits.append(scored)
    hits.sort(key=lambda s: (_CONFIDENCE_RANK[s.confidence], s.row.key, s.candidate.tamil_form))
    return hits


def find_names(
    pool: list[NameCandidate],
    constraints: NamingConstraints,
) -> NamingResult:
    """Run the constraint-satisfaction pipeline with an explicit relaxation ladder.

    Returns the first non-empty rung, tagged with every widening it took to get
    there. An empty result is returned with ``empty_reason`` populated rather
    than as a bare empty list — "no name fits" and "the pool was empty" and "the
    row is gated" are different answers and the caller must be able to tell them
    apart.
    """
    assert_canon_usable()

    target = PADA_AKSHARA_BY_KEY.get((constraints.nakshatra_id, constraints.pada))
    if target is None:  # pragma: no cover - guarded by NamingConstraints
        raise KeyError(f"no pada row for {constraints.nakshatra_id}-{constraints.pada}")

    warnings: list[str] = []
    if not target.verified:
        warnings.append(
            f"{CANON_NAME} v{CANON_VERSION}: row {target.nakshatra_id}-{target.pada} is "
            f"unverified (tier {target.confidence_tier}). Results are for pipeline "
            "development only."
        )
    if target.note:
        warnings.append(target.note)

    if not pool:
        return NamingResult(
            matches=(),
            target_row=target,
            warnings=tuple(warnings),
            usable=False,
            empty_reason="candidate pool was empty",
        )

    # tamil_collapse gate — the substitution rule for aspirates with no Tamil
    # letter is an OPEN practitioner question (NU-8a). Until it is answered we
    # refuse to lead with these rows unless the caller opts in.
    collapse_gated = target.tamil_collapse and not constraints.allow_tamil_collapse
    if collapse_gated:
        warnings.append(
            f"Pada {target.nakshatra_id}-{target.pada} akshara {target.akshara_tamil} "
            f"({target.akshara_iso}) has no distinct Tamil letter — the Tamil "
            "substitution rule for this akshara is unresolved. Set "
            "allow_tamil_collapse to search it anyway."
        )
        return NamingResult(
            matches=(),
            target_row=target,
            warnings=tuple(warnings),
            usable=False,
            empty_reason="pada gated on unresolved tamil_collapse rule",
        )

    siblings = [
        PADA_AKSHARA_BY_KEY[(constraints.nakshatra_id, p)]
        for p in range(1, 5)
        if p != constraints.pada
    ]

    ladder: list[tuple[Relaxation | None, _Search]] = [
        (None, _Search([target], STRICT_CONFIDENCES, constraints.gender)),
        (Relaxation.ALLOW_SINGLE_SCRIPT, _Search([target], SINGLE_SCRIPT_CONFIDENCES, constraints.gender)),
        (Relaxation.DROP_GENDER, _Search([target], SINGLE_SCRIPT_CONFIDENCES, None)),
    ]
    if constraints.allow_ambiguous:
        ladder.append((
            Relaxation.ALLOW_AMBIGUOUS,
            _Search([target], SINGLE_SCRIPT_CONFIDENCES | {MatchConfidence.AMBIGUOUS}, None),
        ))
    if constraints.mode is NamingMode.PADA_WEIGHTED:
        ladder.append((
            Relaxation.SIBLING_PADAS,
            _Search([target, *siblings], SINGLE_SCRIPT_CONFIDENCES, None),
        ))

    applied: list[Relaxation] = []
    for step, search in ladder:
        if step is not None:
            applied.append(step)
        hits = _collect(pool, search)
        if hits:
            off_target = [h for h in hits if h.row.key != target.key]
            local_warnings = list(warnings)
            if off_target:
                local_warnings.append(
                    f"{len(off_target)} result(s) come from a sibling pada, not "
                    f"{target.nakshatra_id}-{target.pada}."
                )
            return NamingResult(
                matches=tuple(hits),
                target_row=target,
                relaxations_applied=tuple(applied),
                warnings=tuple(local_warnings),
                # Never usable while the row is draft canon. This is the single
                # place that decides whether a caller may render a result.
                usable=target.verified,
                empty_reason=None,
            )

    return NamingResult(
        matches=(),
        target_row=target,
        relaxations_applied=tuple(applied),
        warnings=tuple(warnings),
        usable=False,
        empty_reason=(
            f"no candidate in a pool of {len(pool)} opens with akshara "
            f"{target.akshara_tamil} / {target.akshara_latin_bare} "
            f"({target.akshara_iso}), after {len(applied)} relaxation step(s)"
        ),
    )
