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
from dataclasses import dataclass, field, replace
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


class AksharaRelation(StrEnum):
    """How a returned name's opening letter stands to the birth paadham.

    The whole point of the widening scopes below is that a parent can ask for
    names the strict paadham rule would not offer — so every name has to say,
    on its own card, which rule it came in under. Without this a widened list
    is indistinguishable from a strict one and the tool would be quietly
    presenting an off-paadham name as if the tradition had chosen it.

    Ordered from most to least on-target; ``_RELATION_RANK`` below relies on
    the declaration order, and ranking never lets a weaker relation displace a
    stronger one (doctrine D2).
    """

    ON_PAADHAM = "on_paadham"                # the birth paadham's own letter
    SAME_NATCHATHIRAM = "same_natchathiram"  # another paadham of the same star
    SAME_RASI = "same_rasi"                  # a paadham inside the Moon rasi
    OTHER_PAADHAM = "other_paadham"          # some other star's paadham letter
    NO_PAADHAM = "no_paadham"                # opens with no paadham letter at all


_RELATION_RANK: dict[AksharaRelation, int] = {
    relation: index for index, relation in enumerate(AksharaRelation)
}


@dataclass(frozen=True, slots=True)
class ScoredCandidate:
    candidate: NameCandidate
    #: ``None`` only for a NO_PAADHAM candidate — a name whose opening letter
    #: is not any of the 108 paadham aksharas. Reachable exclusively through
    #: ``NamingMode.OPEN``, where the parent has asked for names chosen on the
    #: chart and the numbers rather than on the akshara rule.
    row: PadaAkshara | None
    confidence: MatchConfidence
    matched_latin_variant: str | None
    warnings: tuple[str, ...] = ()
    #: Set by ``find_names``, which is the only place that knows the target.
    #: ``evaluate_candidate`` scores one candidate against one row and has no
    #: opinion about which row the parent was born under.
    relation: AksharaRelation | None = None

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
        key=lambda s: (_CONFIDENCE_RANK[s.confidence], _row_key(s)),
    ))


_CONFIDENCE_RANK: dict[MatchConfidence, int] = {
    MatchConfidence.CONFIRMED: 0,
    MatchConfidence.TAMIL_ONLY: 1,
    MatchConfidence.LATIN_ONLY: 2,
    MatchConfidence.AMBIGUOUS: 3,
    MatchConfidence.NO_MATCH: 4,
}


# ---------------------------------------------------------------------------
# Rasi geometry
#
# A rasi is 30 degrees, a pada is 3 degrees 20 minutes: exactly NINE padas per
# rasi, with no remainder, so the mapping is arithmetic and needs no table.
# Padas are numbered continuously from Aswini pada 1, and rasi 1 (Mesham)
# begins at the same zero point.
#
# The nine padas of a rasi are NOT the four padas of a nakshatra: a nakshatra
# straddles a rasi boundary whenever 4 does not divide evenly into the running
# count. Uthiradam is the worked example — pada 1 falls in Dhanusu, padas 2-4
# in Makaram. So "another paadham of this star" and "another paadham of this
# rasi" are overlapping, not nested, and the widening ladder has to offer both.
# ---------------------------------------------------------------------------
PADAS_PER_RASI = 9


def rasi_of_pada(nakshatra_id: int, pada: int) -> int:
    """Sidereal rasi (1-12) containing this nakshatra-pada."""
    if not 1 <= nakshatra_id <= 27:
        raise ValueError(f"nakshatra_id must be 1..27, got {nakshatra_id}")
    if not 1 <= pada <= 4:
        raise ValueError(f"pada must be 1..4, got {pada}")
    absolute = (nakshatra_id - 1) * 4 + (pada - 1)
    return absolute // PADAS_PER_RASI + 1


def _build_rasi_index() -> dict[int, tuple[PadaAkshara, ...]]:
    buckets: dict[int, list[PadaAkshara]] = defaultdict(list)
    for row in PADA_AKSHARA_TABLE:
        buckets[rasi_of_pada(row.nakshatra_id, row.pada)].append(row)
    return {rasi: tuple(rows) for rasi, rows in buckets.items()}


#: rasi (1-12) -> the nine pada rows inside it, in order.
PADA_ROWS_BY_RASI: dict[int, tuple[PadaAkshara, ...]] = _build_rasi_index()


# ---------------------------------------------------------------------------
# Constraint satisfaction
# ---------------------------------------------------------------------------
class NamingMode(StrEnum):
    """How far past the birth paadham's own letter a search may reach.

    A ladder, each rung a strict superset of the one above it. The first two
    mirror the ``numerology_naming_mode`` feature flag (doctrine D2); the last
    two were added 2026-07-31 because the tool was silently asserting that the
    strict rule is the only legitimate practice, which is not what practising
    astrologer-numerologists do.

    Widening does not weaken doctrine D2 — a number still never displaces an
    akshara. ``AksharaRelation`` rides on every result and ranking keeps
    on-paadham names above every widened one at every rung, so the tradition's
    own answer stays first on the page no matter how far the parent opens the
    search.
    """

    PADA_FIRST = "pada_first"        # this paadham's letter only — a hard filter
    PADA_WEIGHTED = "pada_weighted"  # + the other three paadhams of this star
    RASI_WIDE = "rasi_wide"          # + every paadham inside the Moon rasi
    OPEN = "open"                    # + any name at all, ranked on chart/numbers


#: Ladder order. A mode admits every row its predecessors admit.
_MODE_RANK: dict[NamingMode, int] = {mode: index for index, mode in enumerate(NamingMode)}


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
        # Normalise a raw string to the enum. `NamingMode` is a StrEnum, so a
        # plain "rasi_wide" compares and hashes equal and every lookup here
        # keeps working — but `.value` does not exist on it, and the mode is
        # now echoed all the way out to the client. Coercing at construction
        # keeps that one difference from surfacing as an AttributeError three
        # layers away, and rejects an unknown rung here rather than silently
        # narrowing the search to the strict rule.
        if not isinstance(self.mode, NamingMode):
            object.__setattr__(self, "mode", NamingMode(self.mode))


class Relaxation(StrEnum):
    """Ordered widening steps. Every step taken is reported to the caller."""

    NONE = "none"
    ALLOW_TAMIL_COLLAPSE = "allow_tamil_collapse"
    ALLOW_SINGLE_SCRIPT = "allow_single_script"
    ALLOW_AMBIGUOUS = "allow_ambiguous"
    SIBLING_PADAS = "sibling_padas"
    RASI_PADAS = "rasi_padas"
    ANY_AKSHARA = "any_akshara"
    DROP_GENDER = "drop_gender"


class EmptyReason(StrEnum):
    """Why a search came back with nothing, as a stable code.

    ``empty_reason`` next to it is a developer sentence with counts and
    aksharas interpolated into it — useful in a log, unusable as UI copy and
    impossible to translate. Clients render from THIS, and must never print
    ``empty_reason``: it leaked verbatim to users ("pada gated on unresolved
    tamil_collapse rule") until 2026-07-31.
    """

    POOL_EMPTY = "pool_empty"
    COLLAPSE_GATED = "collapse_gated"
    NO_CANDIDATE_FITS = "no_candidate_fits"


@dataclass(frozen=True, slots=True)
class NamingResult:
    matches: tuple[ScoredCandidate, ...]
    target_row: PadaAkshara
    #: The Moon rasi the birth paadham falls in. Carried because the scope
    #: explanation a parent reads names it ("the nine paadhams of Makaram"),
    #: and because a rasi-scope result has to be able to say which rasi.
    target_rasi: int = 1
    #: The rung the caller asked for — distinct from `relaxations_applied`,
    #: which records what the search actually had to do. A parent who picks
    #: "any paadham of this star" and gets a full list of on-paadham names
    #: needs the UI to still explain the rule they chose.
    mode: NamingMode = NamingMode.PADA_FIRST
    relaxations_applied: tuple[Relaxation, ...] = ()
    warnings: tuple[str, ...] = ()
    #: False when the result must not be shown as a recommendation — draft
    #: canon, gated collapse row, or an empty search.
    usable: bool = False
    #: Developer-facing sentence. Never render this; see ``EmptyReason``.
    empty_reason: str | None = None
    empty_reason_code: EmptyReason | None = None

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


def _row_key(scored: ScoredCandidate) -> tuple[int, int]:
    """Sort key for a row that may be absent (NO_PAADHAM candidates)."""
    return scored.row.key if scored.row is not None else (99, 99)


def _collect(pool: list[NameCandidate], search: _Search) -> list[ScoredCandidate]:
    hits: list[ScoredCandidate] = []
    for row in search.rows:
        for candidate in pool:
            if not _gender_ok(candidate, search.gender):
                continue
            scored = evaluate_candidate(candidate, row)
            if scored.confidence in search.accepted:
                hits.append(scored)
    hits.sort(key=lambda s: (_CONFIDENCE_RANK[s.confidence], _row_key(s), s.candidate.tamil_form))
    return hits


def _collect_any(
    pool: list[NameCandidate],
    gender: str | None,
    already: set[str],
) -> list[ScoredCandidate]:
    """Every remaining name in the pool, whatever it opens with.

    Only ``NamingMode.OPEN`` reaches this. The akshara rule is set aside, but
    it is not hidden: each name is still scored against the whole 108-row
    table so the result can say *which* paadham its letter does belong to
    ("ஆ opens Kaarthigai paadham 1"), and names belonging to none get
    ``row=None``. Telling a parent their chosen letter suits a different star
    is a real answer; telling them nothing is what made the strict list feel
    like a verdict.
    """
    hits: list[ScoredCandidate] = []
    for candidate in pool:
        if candidate.tamil_form in already:
            continue
        if not _gender_ok(candidate, gender):
            continue
        best: ScoredCandidate | None = None
        for row in PADA_AKSHARA_TABLE:
            scored = evaluate_candidate(candidate, row)
            if not scored.is_match:
                continue
            if best is None or _CONFIDENCE_RANK[scored.confidence] < _CONFIDENCE_RANK[best.confidence]:
                best = scored
        hits.append(best if best is not None else ScoredCandidate(
            candidate=candidate,
            row=None,
            confidence=MatchConfidence.NO_MATCH,
            matched_latin_variant=None,
        ))
    hits.sort(key=lambda s: (_CONFIDENCE_RANK[s.confidence], _row_key(s), s.candidate.tamil_form))
    return hits


def _merge(
    base: list[ScoredCandidate],
    extra: list[ScoredCandidate],
    applied: list[Relaxation],
    step: Relaxation,
) -> list[ScoredCandidate]:
    """Union an additive rung onto the running set, best evidence per name.

    De-duplicates on the name itself, not on (name, row): the same name can
    open both the target pada and a sibling, and a parent must not be shown it
    twice. The first occurrence wins because `base` is always the stronger
    claim — on-target before sibling, better-evidenced before weaker.

    ``step`` is recorded only when the rung actually contributed a name, so
    "Search was widened: ..." never claims a widening the parent cannot see.
    """
    seen = {s.candidate.tamil_form for s in base}
    added: list[ScoredCandidate] = []
    for scored in extra:
        # `extra` can carry the same name twice when a sibling search spans
        # several rows and one name opens more than one of them.
        if scored.candidate.tamil_form in seen:
            continue
        seen.add(scored.candidate.tamil_form)
        added.append(scored)
    if not added:
        return base
    applied.append(step)
    return base + added


def _relation_to_target(
    row: PadaAkshara | None,
    target: PadaAkshara,
    rasi_keys: set[tuple[int, int]],
) -> AksharaRelation:
    """Classify one match against the birth paadham.

    Same-natchathiram wins over same-rasi when both apply — a nakshatra that
    straddles a rasi boundary puts three of its four paadhams in the parent's
    rasi, and "another paadham of your own star" is the more specific and more
    reassuring thing to be told.
    """
    if row is None:
        return AksharaRelation.NO_PAADHAM
    if row.key == target.key:
        return AksharaRelation.ON_PAADHAM
    if row.nakshatra_id == target.nakshatra_id:
        return AksharaRelation.SAME_NATCHATHIRAM
    if row.key in rasi_keys:
        return AksharaRelation.SAME_RASI
    return AksharaRelation.OTHER_PAADHAM


def find_names(
    pool: list[NameCandidate],
    constraints: NamingConstraints,
) -> NamingResult:
    """Run the constraint-satisfaction pipeline with an explicit relaxation ladder.

    Automatic rescues resolve first-hit-wins; the widenings the CALLER asked
    for (``allow_ambiguous``, ``mode=PADA_WEIGHTED``) then union on top. The
    result is tagged with every widening that actually contributed a name.

    An empty result is returned with ``empty_reason`` populated rather than as
    a bare empty list — "no name fits" and "the pool was empty" and "the row is
    gated" are different answers and the caller must be able to tell them
    apart.
    """
    assert_canon_usable()

    target = PADA_AKSHARA_BY_KEY.get((constraints.nakshatra_id, constraints.pada))
    if target is None:  # pragma: no cover - guarded by NamingConstraints
        raise KeyError(f"no pada row for {constraints.nakshatra_id}-{constraints.pada}")

    target_rasi = rasi_of_pada(constraints.nakshatra_id, constraints.pada)
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
            target_rasi=target_rasi,
            mode=constraints.mode,
            warnings=tuple(warnings),
            usable=False,
            empty_reason="candidate pool was empty",
            empty_reason_code=EmptyReason.POOL_EMPTY,
        )

    # tamil_collapse — the substitution rule for aspirates with no Tamil letter
    # is an OPEN practitioner question (NU-8a). What that open question can and
    # cannot invalidate is narrower than this code first assumed:
    #
    # The unresolved rule is about reading a pada *off the Tamil letter alone*.
    # A CONFIRMED candidate is one where the Tamil opening AND a Latin opening
    # both land on this row — Latin carries the voicing/aspiration Tamil drops,
    # so the pair pins the akshara regardless of how the substitution question
    # is eventually settled. `evaluate_candidate` already encodes exactly that:
    # on a collapse row it demotes Tamil-only evidence to AMBIGUOUS (see the
    # `row.tamil_collapse` branch) and leaves CONFIRMED alone.
    #
    # Until 2026-07-31 this function ALSO refused the whole row before the
    # ladder ran, which threw away every two-script match on it. Measured over
    # the shipping corpus: 84 CONFIRMED candidates across 54 of the 59 collapse
    # rows, i.e. 55% of all births got an empty Baby Name Finder. The gate now
    # sits where the doubt actually is — it withholds the SINGLE-SCRIPT rungs,
    # and the strict two-script rung runs on every row.
    collapse_gated = target.tamil_collapse and not constraints.allow_tamil_collapse
    if target.tamil_collapse:
        warnings.append(
            f"Pada {target.nakshatra_id}-{target.pada} akshara {target.akshara_tamil} "
            f"({target.akshara_iso}) has no distinct Tamil letter — the Tamil "
            "substitution rule for this akshara is unresolved, so a name is only "
            "offered here when its Latin spelling corroborates the Tamil opening."
            + ("" if collapse_gated else " allow_tamil_collapse widened this search.")
        )

    siblings = [
        PADA_AKSHARA_BY_KEY[(constraints.nakshatra_id, p)]
        for p in range(1, 5)
        if p != constraints.pada
    ]
    # The rasi's other paadhams, minus anything the sibling rung already
    # covers. A nakshatra can straddle a rasi boundary, so these two sets
    # overlap and must not be double-searched.
    sibling_keys = {row.key for row in siblings} | {target.key}
    rasi_rows = [
        row for row in PADA_ROWS_BY_RASI[target_rasi] if row.key not in sibling_keys
    ]
    rasi_keys = {row.key for row in PADA_ROWS_BY_RASI[target_rasi]}
    scope = _MODE_RANK[constraints.mode]

    # ── Two kinds of widening, which must NOT behave alike ─────────────────
    #
    # AUTOMATIC rescues (ALLOW_TAMIL_COLLAPSE, ALLOW_SINGLE_SCRIPT, DROP_GENDER)
    # are safety nets nobody asked for. They stay first-hit-wins: once a better-
    # evidenced rung produces names, a weaker one must not dilute it, and
    # DROP_GENDER especially must never volunteer boys' names into a search for
    # a girl's name that already worked.
    #
    # USER rungs (ALLOW_AMBIGUOUS, SIBLING_PADAS) were ticked by a parent
    # reading a checkbox that says "ALSO show close matches". Those are
    # ADDITIVE — they union onto whatever the automatic chain found.
    #
    # Until 2026-07-31 the user rungs were fallbacks too, which made them dead
    # controls. Measured over all 27x4 padas x 3 gender settings against the
    # shipping corpus: 293 of 324 searches returned byte-identical results for
    # ALL EIGHT toggle combinations, because the automatic chain had already
    # succeeded and the ladder returned at its first non-empty rung. A control
    # that changes nothing in 90% of searches is not a control.

    # Rung 0 is unconditional. Every rung below it leans on single-script
    # evidence, which is what a collapse row cannot support.
    automatic: list[tuple[Relaxation | None, _Search]] = [
        (None, _Search([target], STRICT_CONFIDENCES, constraints.gender)),
    ]
    if not collapse_gated:
        if target.tamil_collapse:
            # The declared-but-never-wired rung, now real: reaching past the
            # two-script rung on a collapse row IS the relaxation, and the
            # caller is told it was taken.
            automatic.append((
                Relaxation.ALLOW_TAMIL_COLLAPSE,
                _Search([target], SINGLE_SCRIPT_CONFIDENCES, constraints.gender),
            ))
        automatic.append((
            Relaxation.ALLOW_SINGLE_SCRIPT,
            _Search([target], SINGLE_SCRIPT_CONFIDENCES, constraints.gender),
        ))

    applied: list[Relaxation] = []
    hits: list[ScoredCandidate] = []
    for step, search in automatic:
        if step is not None:
            applied.append(step)
        hits = _collect(pool, search)
        if hits:
            break

    # Additive rungs, and what the collapse gate may and may not touch.
    #
    # `accepted` carries the gate: on a gated row only two-script CONFIRMED
    # evidence is admissible, everywhere. That is the whole gate — it must not
    # also decide WHICH ROWS are searched. Barring sibling padas outright here
    # would throw away CONFIRMED sibling matches, which the unresolved Tamil
    # substitution rule never put in doubt; that is precisely the one-level-too-
    # broad mistake this function already made once (see the long note above).
    #
    # ALLOW_AMBIGUOUS is different and stays barred: AMBIGUOUS is the exact
    # tier the open question demotes evidence INTO, so admitting it on a gated
    # row would re-admit the disputed reading through the back door.
    accepted = STRICT_CONFIDENCES if collapse_gated else SINGLE_SCRIPT_CONFIDENCES
    if constraints.allow_ambiguous and not collapse_gated:
        # Only the AMBIGUOUS tier — everything stronger is already in `hits`.
        hits = _merge(hits, _collect(pool, _Search(
            [target], frozenset({MatchConfidence.AMBIGUOUS}), constraints.gender,
        )), applied, Relaxation.ALLOW_AMBIGUOUS)
        accepted = accepted | {MatchConfidence.AMBIGUOUS}
    # The scope ladder. Each rung is a superset of the last and each is only
    # entered because the parent asked for it, so all three are additive for
    # the same reason ALLOW_AMBIGUOUS is — a control that only fires on an
    # otherwise-empty search is a control that does nothing 90% of the time.
    if scope >= _MODE_RANK[NamingMode.PADA_WEIGHTED]:
        hits = _merge(hits, _collect(pool, _Search(
            siblings, accepted, constraints.gender,
        )), applied, Relaxation.SIBLING_PADAS)
    if scope >= _MODE_RANK[NamingMode.RASI_WIDE] and rasi_rows:
        hits = _merge(hits, _collect(pool, _Search(
            rasi_rows, accepted, constraints.gender,
        )), applied, Relaxation.RASI_PADAS)
    if scope >= _MODE_RANK[NamingMode.OPEN]:
        # No row filter at all — the akshara rule is set aside on request.
        # Deliberately last, so every name the rule DOES admit is already in
        # `hits` and `_merge` keeps that stronger claim for any name that
        # appears in both.
        hits = _merge(
            hits,
            _collect_any(pool, constraints.gender, {s.candidate.tamil_form for s in hits}),
            applied,
            Relaxation.ANY_AKSHARA,
        )

    # Last resort, after everything the caller asked for has been added: a
    # gender filter that emptied the result is worth dropping, but only when
    # nothing else survived. Running it earlier is what made a girl search on
    # புனர்பூசம் paadham 1 answer with three boys' names.
    if not hits and constraints.gender is not None:
        applied.append(Relaxation.DROP_GENDER)
        rescue_rows = [target]
        if scope >= _MODE_RANK[NamingMode.PADA_WEIGHTED]:
            rescue_rows += siblings
        if scope >= _MODE_RANK[NamingMode.RASI_WIDE]:
            rescue_rows += rasi_rows
        hits = _collect(pool, _Search(rescue_rows, accepted, None))

    if hits:
        hits = [
            replace(hit, relation=_relation_to_target(hit.row, target, rasi_keys))
            for hit in hits
        ]
        off_target = [h for h in hits if h.relation is not AksharaRelation.ON_PAADHAM]
        local_warnings = list(warnings)
        if off_target:
            local_warnings.append(
                f"{len(off_target)} result(s) do not open with pada "
                f"{target.nakshatra_id}-{target.pada}'s own akshara."
            )
        return NamingResult(
            matches=tuple(hits),
            target_row=target,
            target_rasi=target_rasi,
            mode=constraints.mode,
            relaxations_applied=tuple(applied),
            warnings=tuple(local_warnings),
            # Never usable while the row is draft canon. This is the single
            # place that decides whether a caller may render a result.
            usable=target.verified,
            empty_reason=None,
        )

    # A gated collapse row that found no two-script match is a different answer
    # from "the corpus has nothing for this akshara": the caller can open the
    # first with `allow_tamil_collapse`, and can do nothing about the second.
    return NamingResult(
        matches=(),
        target_row=target,
        target_rasi=target_rasi,
        mode=constraints.mode,
        relaxations_applied=tuple(applied),
        warnings=tuple(warnings),
        usable=False,
        empty_reason=(
            f"no candidate in a pool of {len(pool)} opens with akshara "
            f"{target.akshara_tamil} / {target.akshara_latin_bare} "
            f"({target.akshara_iso}), after {len(applied)} relaxation step(s)"
            + (" (single-script rungs withheld: collapse row)" if collapse_gated else "")
        ),
        empty_reason_code=(
            EmptyReason.COLLAPSE_GATED if collapse_gated else EmptyReason.NO_CANDIDATE_FITS
        ),
    )
