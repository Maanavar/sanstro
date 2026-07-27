"""Horoscope + numerology compatibility (NUM-34, Phase 3).

Pure module: no DB, no ephemeris, no clock.

What this is, and what it refuses to be
---------------------------------------
Every numerology app on the market will tell two people their "love
compatibility" from a pair of birth dates. That reading is not wrong so much as
*unanchored*: it is a statement about two digits, sold as a statement about a
marriage. Tamil practice already has an instrument for that question — the ten
poruthams — and it is the authoritative one.

So this module is a **layer, not an engine**, in exactly the sense Phase 4's
date scoring is. `compute_porutham` decides what the match is. Numerology
annotates it, may move the score by at most ``NUMEROLOGY_ADJUSTMENT_BOUND``, and
**never touches the label**. `layer_over_porutham` takes the astrological
verdict as an argument rather than computing one, so there is no code path here
that can produce a compatibility reading without the astrology having spoken
first (doctrine §9.1 — a number never overrides a graha).

Where the number-pair relation comes from — doctrine D4
-------------------------------------------------------
Two bases ship, selected by the ``numerology_compatibility_basis`` flag. Neither
is invented; both are read off a named source.

**``cheiro_series`` (default).** Cheiro's own compatibility doctrine, stated in
his per-number chapters in exactly the terms this route asks about — which
numbers a person "gets on well with". Two sympathetic groups, one universal
number, one pair bond:

* **{1, 2, 4, 7}** — 1 "get[s] on well with persons born under the 2, 4, and 7";
  4 is "more attracted to persons born under the 1, 2, 7 and 8 numbers"; 2
  "vibrate[s] together" with 1 and "in a lesser degree" with 7. Cheiro's "1-4"
  (Sun/Uranus) and "2-7" (Moon/Neptune) series, which he says are sympathetic to
  each other.
* **{3, 6, 9}** — named from three sides as "the series of 3, 6, or 9".
* **5** — "get[s] on with persons born under almost any other number, but their
  best friends are those born under their own number".
* **4 ↔ 8** — "their interchangeable number, which is 4".

**``graha_maitri``.** Number → graha → Parashari permanent natural friendship,
the table ``shadbala``, ``porutham``'s Graha Maitri kuta, daily guidance and
chart explanation already share.

Why Cheiro leads
----------------
Naisargika maitri is a **dignity rule**: it governs how a graha behaves when
placed in a sign owned by another graha. It decides strength, not sympathy
between people, and neither Parashara nor Cheiro ever applied it to "do these two
get along". Reading a *person-to-person* verdict off it is a category move
nobody in either tradition made — it merely looks rigorous because the table is
old. Cheiro states the person-to-person doctrine outright, and Chaldean
numerology reached Tamil practice through him (see NU-05). So his answer is the
one this system inherits, and the graha table is the second opinion.

Cheiro names sympathies, never enmities — and that shapes everything
--------------------------------------------------------------------
He says who you get on with and is silent about the rest. **Silence is not
enmity**, and building an "enemy" tier out of what he declined to say would be
invention wearing a source's name. So this basis grades only ``HARMONIOUS``,
``SUPPORTIVE`` and ``NEUTRAL``: no pairing is condemned.

The consequence is deliberate and is the best property this layer has. Under the
default basis **numerology can raise a compatibility score and can never lower
one.** Every negative verdict comes from the poruthams. That is "a number never
overrides a graha" carried to its conclusion, instead of being asserted and then
undercut by a table that grades half of all couples adversaries.

Cheiro's 4-and-8 fatalism is refused
------------------------------------
He is emphatic elsewhere about "the terrible combination of the 8 and the 4" and
calls it fatalistic in love and marriage. **That is not encoded here.** The
8-and-4 fear trade is banned by standing ruling 3 and linted by
``numerology_content.BANNED_FEAR_TERMS``, and this is the same editorial call
already made at NU-05: keep his structure, re-render his fatalism. The
structural fact — 4 and 8 are interchangeable and drawn together — is kept and
grades harmonious. Whether Sani or Rahu is heavy *for these two people* is a
question their charts answer, through the per-side alignment and the porutham.

Permanent friendship is asymmetric — and it is a graha fact, not a number fact
------------------------------------------------------------------------------
Rahu counts Venus a friend; Venus counts Rahu an enemy. That asymmetry is real
and must not be collapsed into "4 and 6 don't get along", because *which of them
experiences the difficulty* is the reading. It is reported on every pair as
``graha_regard_a_to_b`` / ``graha_regard_b_to_a`` under **both** bases — filed
where it belongs, as a property of the graha pair rather than of the number pair.

Why each side's own chart alignment rides along but does not score
------------------------------------------------------------------
Each paired number is also aligned against its *own* native's chart, so a
surface can say "her 6 is yogakaraka in her chart; his 8 is a dusthana lord in
his". That is genuine Vinaadi-only information and it ships. It is deliberately
**not** folded into the pair score: the pair relation is chart-independent under
either basis, and the charts already speak — through the porutham, which is
authoritative here. Multiplying a chart-independent relation by a chart-specific
lordship would count the horoscope twice and call the result precision.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from app.calculations.chart_strength import _NATURAL_ENEMIES, _NATURAL_FRIENDS
from app.calculations.display_names import planet_en, planet_ta
from app.calculations.numerology import NUMBER_TO_GRAHA, NumberReading
from app.calculations.numerology_alignment import (
    FortuneAlignment,
    NumberAlignment,
    align_number,
)
from app.calculations.numerology_timing import NUMEROLOGY_ADJUSTMENT_BOUND

#: Directional relation values, matching ``porutham._GRAHA_RELATION``'s scale so
#: the two encodings can be compared numerically in a test.
FRIEND = 1.0
NEUTRAL = 0.5
ENEMY = 0.0


#: The nine grahas the friendship table covers, which is also exactly the nine
#: ``NUMBER_TO_GRAHA`` produces.
KNOWN_GRAHAS: frozenset[str] = frozenset(_NATURAL_FRIENDS)


def graha_relation(a: str, b: str) -> float:
    """How graha ``a`` regards graha ``b``: 1.0 friend, 0.5 neutral, 0.0 enemy.

    Public because it is the one piece of doctrine this module reads from
    elsewhere, and a caller (or a test) needs to be able to ask it directly.
    A graha is always its own friend, which is also what ``porutham`` asserts
    for the seven classical grahas.

    Raises on an unrecognised name rather than falling back to neutral. The
    fallback is what the sibling readers of this table do, and it is right for
    them — they ask about a sign lord, which is always one of the seven. Here a
    bad name would mean a *pair of people* were quietly told they are neutral to
    each other, which is a confident wrong answer of exactly the kind
    ``ScriptMismatchError`` exists to prevent elsewhere in this feature.
    """
    unknown = {name for name in (a, b) if name not in KNOWN_GRAHAS}
    if unknown:
        raise ValueError(
            f"unknown graha(s) {sorted(unknown)}; expected one of {sorted(KNOWN_GRAHAS)}"
        )
    if a == b:
        return FRIEND
    if b in _NATURAL_FRIENDS[a]:
        return FRIEND
    if b in _NATURAL_ENEMIES[a]:
        return ENEMY
    return NEUTRAL


class CompatibilityBasis(StrEnum):
    """Which doctrine grades the number pair (D4, flag-selected)."""

    #: Cheiro's own sympathetic series. Names sympathies, never enmities.
    CHEIRO_SERIES = "cheiro_series"
    #: Number -> graha -> Parashari permanent natural friendship.
    GRAHA_MAITRI = "graha_maitri"


def resolve_basis(value: str | CompatibilityBasis) -> CompatibilityBasis:
    """Parse a flag value into a basis.

    Raises on anything unrecognised, exactly as ``resolve_epoch`` does. A typo in
    the flag must not silently fall back to a default — that would ship a
    doctrine nobody chose, which is the whole failure mode string flags exist to
    make visible.
    """
    if isinstance(value, CompatibilityBasis):
        return value
    try:
        return CompatibilityBasis(str(value).strip().lower())
    except ValueError as exc:
        valid = ", ".join(sorted(b.value for b in CompatibilityBasis))
        raise ValueError(
            f"unknown numerology compatibility basis {value!r}; valid values are {valid}"
        ) from exc


class NumberRelation(StrEnum):
    """How two numbers sit together.

    The first three are producible under either basis. The last three can only
    arise under ``GRAHA_MAITRI`` — Cheiro names no enmities, so his basis has no
    negative grade at all (see the module docstring).
    """

    #: Same sympathetic series, or friends both ways.
    HARMONIOUS = "harmonious"
    #: Cheiro's 5 with anyone; or friend one way and neutral the other.
    SUPPORTIVE = "supportive"
    #: Nothing is claimed either way.
    NEUTRAL = "neutral"
    #: Friend one way, enemy the other. Named rather than merged into STRAINED
    #: because *which* side experiences the difficulty is the whole reading.
    ONE_SIDED = "one_sided"
    #: Enemy one way, neutral the other.
    STRAINED = "strained"
    #: Enemies both ways.
    DIFFICULT = "difficult"


class CompatibilityBand(StrEnum):
    """Summary of the aggregate score.

    Deliberately **not** ``NumberRelation``. A relation is a fact about one pair
    of numbers; a band is where a weighted average landed. Reusing the relation
    enum for the summary let an aggregate report ``one_sided`` when no pair was
    one-sided — a category error that reads as a specific finding.
    """

    STRONG = "strong"
    SUPPORTIVE = "supportive"
    NEUTRAL = "neutral"
    GUARDED = "guarded"
    DIFFICULT = "difficult"


#: Every unordered combination of two directional values, exhaustively. Keyed on
#: ``(min, max)`` so the table cannot be indexed with the pair in the wrong
#: order. Six entries covers all 3x3 ordered combinations; a test asserts the
#: table is total, so a future third relation value cannot slip through as a
#: KeyError in production.
_RELATION_BY_PAIR: dict[tuple[float, float], NumberRelation] = {
    (FRIEND, FRIEND): NumberRelation.HARMONIOUS,
    (NEUTRAL, FRIEND): NumberRelation.SUPPORTIVE,
    (NEUTRAL, NEUTRAL): NumberRelation.NEUTRAL,
    (ENEMY, FRIEND): NumberRelation.ONE_SIDED,
    (ENEMY, NEUTRAL): NumberRelation.STRAINED,
    (ENEMY, ENEMY): NumberRelation.DIFFICULT,
}

#: 0-100 score per relation grade. NEUTRAL sits at 55 rather than 50 because it
#: is a genuinely workable pairing, not a coin flip — the same reasoning that
#: puts ``FunctionalNature.NEUTRAL`` at 55 in ``numerology_alignment``.
_RELATION_SCORE: dict[NumberRelation, int] = {
    NumberRelation.HARMONIOUS: 92,
    NumberRelation.SUPPORTIVE: 74,
    NumberRelation.NEUTRAL: 55,
    NumberRelation.ONE_SIDED: 45,
    NumberRelation.STRAINED: 35,
    NumberRelation.DIFFICULT: 20,
}

#: The neutral point, and the distance from it to each extreme. Used to turn an
#: aggregate score into a signed adjustment that reaches exactly
#: +/-NUMEROLOGY_ADJUSTMENT_BOUND at the ends rather than approximately.
NEUTRAL_SCORE = _RELATION_SCORE[NumberRelation.NEUTRAL]
_SPAN_UP = _RELATION_SCORE[NumberRelation.HARMONIOUS] - NEUTRAL_SCORE
_SPAN_DOWN = NEUTRAL_SCORE - _RELATION_SCORE[NumberRelation.DIFFICULT]

#: Aggregate score at the centre of each summary band, best first. Ordered so a
#: tie resolves upward (``min`` keeps the first minimum) — a summary sitting
#: exactly between two bands should not be rounded down into a judgement the
#: arithmetic did not make.
_BAND_SCORE: dict[CompatibilityBand, int] = {
    CompatibilityBand.STRONG: 92,
    CompatibilityBand.SUPPORTIVE: 74,
    CompatibilityBand.NEUTRAL: 55,
    CompatibilityBand.GUARDED: 38,
    CompatibilityBand.DIFFICULT: 20,
}


# ---------------------------------------------------------------------------
# Basis 1 (default) — Cheiro's sympathetic series
# ---------------------------------------------------------------------------
#: Cheiro's two mutually-sympathetic groups. Every member is named by another
#: member in his own text; see the module docstring for the quotes. He maps 4 to
#: Uranus and 7 to Neptune — Tamil practice re-maps those to Rahu and Ketu, which
#: is what ``NUMBER_TO_GRAHA`` does. The grouping is unaffected by the re-mapping.
#: Note 4 appears in two series. That is Cheiro, not an encoding accident: he
#: names 4 as attracted to 1, 2 and 7 *and* gives 8 as its interchangeable
#: number. 8's only stated bond is with 4, which is why {4, 8} is a series of
#: its own rather than 8 being folded into the first group.
CHEIRO_SERIES: tuple[frozenset[int], ...] = (
    frozenset({1, 2, 4, 7}),
    frozenset({3, 6, 9}),
    frozenset({4, 8}),
)

#: "get on with persons born under almost any other number, but their best
#: friends are those born under their own number".
CHEIRO_UNIVERSAL = 5


def cheiro_relation(a: int, b: int) -> NumberRelation:
    """Grade a number pair under Cheiro's own compatibility doctrine.

    Returns only ``HARMONIOUS``, ``SUPPORTIVE`` or ``NEUTRAL``. There is no
    negative grade because Cheiro states no enmities — ``NEUTRAL`` means "he does
    not speak to this pairing", not "these two clash".

    Every number is harmonious with itself. That falls out of the series (each
    number is in one) rather than being a rule added on top, and it is uniform
    across his system: an 8 gets on with another 8 exactly as a 3 does with a 3.
    """
    for number in (a, b):
        if number not in NUMBER_TO_GRAHA:
            raise ValueError(f"number must be 1..9, got {number}")

    if a == CHEIRO_UNIVERSAL and b == CHEIRO_UNIVERSAL:
        return NumberRelation.HARMONIOUS
    if CHEIRO_UNIVERSAL in (a, b):
        # "almost any other number" — a real claim, but a weaker one than
        # belonging to the same series, so it does not grade as harmonious.
        return NumberRelation.SUPPORTIVE
    if any(a in series and b in series for series in CHEIRO_SERIES):
        return NumberRelation.HARMONIOUS
    return NumberRelation.NEUTRAL


class PairKind(StrEnum):
    """Which pair of numbers is being read."""

    #: Day-of-month numbers. Temperament, how the two meet day to day.
    PSYCHIC = "psychic"
    #: Full-date life-path numbers. The lifelong pairing, and the headline.
    DESTINY = "destiny"
    #: Document-name numbers. Present only when both names were supplied.
    NAME = "name"


#: Relative weight of each pair in the aggregate. Destiny leads because it is
#: lifelong. The name carries *less* here than it does in
#: ``numerology_alignment._WEIGHTS`` and deliberately so: there, the name is
#: weighted up because it is the one number the native can actually change; here
#: nobody is correcting a name, and the numbers neither party chose are the
#: honest basis for reading a fit. Weights are renormalised over the pairs
#: actually present, so omitting names does not silently deflate the score.
_WEIGHTS: dict[PairKind, float] = {
    PairKind.DESTINY: 0.40,
    PairKind.PSYCHIC: 0.35,
    PairKind.NAME: 0.25,
}


@dataclass(frozen=True, slots=True)
class NumberPair:
    """Two numbers under the active basis, with the graha view always alongside."""

    kind: PairKind
    #: Each number aligned against *its own* native's chart. Reported, not scored
    #: — see the module docstring.
    a: NumberAlignment
    b: NumberAlignment
    #: Which doctrine produced ``relation`` and ``score``.
    basis: CompatibilityBasis
    relation: NumberRelation
    score: int
    weight: float
    #: The naisargika view, reported under **both** bases. Directional and not
    #: redundant: permanent friendship is asymmetric, and which partner is on
    #: which side of that is the reading. Under ``GRAHA_MAITRI`` these produced
    #: ``relation``; under ``CHEIRO_SERIES`` they are context an astrologer reads
    #: beside it.
    graha_regard_a_to_b: float
    graha_regard_b_to_a: float
    graha_relation: NumberRelation
    reason_en: str
    reason_ta: str

    @property
    def is_mutual(self) -> bool:
        """Whether the two grahas regard each other identically."""
        return self.graha_regard_a_to_b == self.graha_regard_b_to_a

    @property
    def bases_agree(self) -> bool:
        """Whether Cheiro and the graha table reach the same grade for this pair.

        Surfaced because the disagreement is the interesting case for the
        astrologer reviewing D4, not something to smooth over.
        """
        return self.relation is self.graha_relation


def relation_between(graha_a: str, graha_b: str) -> tuple[float, float, NumberRelation]:
    """Directional regard in both directions, plus the grade they combine to."""
    a_to_b = graha_relation(graha_a, graha_b)
    b_to_a = graha_relation(graha_b, graha_a)
    key = (min(a_to_b, b_to_a), max(a_to_b, b_to_a))
    return a_to_b, b_to_a, _RELATION_BY_PAIR[key]


_RELATION_EN: dict[NumberRelation, str] = {
    NumberRelation.HARMONIOUS: "The two grahas are natural friends both ways.",
    NumberRelation.SUPPORTIVE: "One regards the other as a friend; the other is neutral.",
    NumberRelation.NEUTRAL: "Neither graha is invested in the other either way.",
    NumberRelation.ONE_SIDED: (
        "The regard runs one way only — one graha is friendly, the other is not. "
        "Expect the effort in this area to be unevenly shared."
    ),
    NumberRelation.STRAINED: "One graha holds the other an adversary; the other is neutral.",
    NumberRelation.DIFFICULT: "The two grahas are natural adversaries both ways.",
}

_RELATION_TA: dict[NumberRelation, str] = {
    NumberRelation.HARMONIOUS: "இரு கிரகங்களும் இயற்கையில் இருபுறமும் நண்பர்கள்.",
    NumberRelation.SUPPORTIVE: "ஒருவர் மற்றவரை நண்பராகக் கருதுகிறார்; மற்றவர் நடுநிலை.",
    NumberRelation.NEUTRAL: "இரு கிரகங்களுக்கும் ஒன்றின் மீது ஒன்று பற்று இல்லை.",
    NumberRelation.ONE_SIDED: (
        "நட்பு ஒரு பக்கம் மட்டுமே — ஒரு கிரகம் நட்பாகவும் மற்றொன்று அல்லாமலும் "
        "உள்ளது. இந்தத் துறையில் உழைப்பு சமமாகப் பகிரப்படாமல் இருக்கலாம்."
    ),
    NumberRelation.STRAINED: "ஒரு கிரகம் மற்றொன்றை பகைவராகக் கொள்கிறது; மற்றொன்று நடுநிலை.",
    NumberRelation.DIFFICULT: "இரு கிரகங்களும் இயற்கையில் இருபுறமும் பகைவர்கள்.",
}

_KIND_EN: dict[PairKind, str] = {
    PairKind.PSYCHIC: "Birth-day numbers",
    PairKind.DESTINY: "Life-path numbers",
    PairKind.NAME: "Name numbers",
}

_KIND_TA: dict[PairKind, str] = {
    PairKind.PSYCHIC: "பிறந்த தேதி எண்கள்",
    PairKind.DESTINY: "விதி எண்கள்",
    PairKind.NAME: "பெயர் எண்கள்",
}

#: Cheiro-basis phrasing. His doctrine is about the numbers' own series, so the
#: reason must say that rather than borrowing the graha language — a reader told
#: "the grahas are friends" when the verdict came from a number series has been
#: given the wrong reason for the right answer.
_CHEIRO_EN: dict[NumberRelation, str] = {
    NumberRelation.HARMONIOUS: (
        "Both numbers sit in the same sympathetic series, which Cheiro reads as "
        "getting on naturally."
    ),
    NumberRelation.SUPPORTIVE: (
        "5 is the adaptable number and gets on with almost any other, so this "
        "pairing runs easily without being a same-series match."
    ),
    NumberRelation.NEUTRAL: (
        "The two numbers belong to different series. Cheiro claims no particular "
        "sympathy here and no difficulty either — the chart decides this one."
    ),
}

_CHEIRO_TA: dict[NumberRelation, str] = {
    NumberRelation.HARMONIOUS: (
        "இரு எண்களும் ஒரே இணக்கத் தொடரில் உள்ளன; சீரோ இதை இயல்பான "
        "ஒத்துப்போதலாகக் கருதுகிறார்."
    ),
    NumberRelation.SUPPORTIVE: (
        "5 எண் இயைபுத் தன்மை கொண்டது; கிட்டத்தட்ட எல்லா எண்களுடனும் ஒத்துப்போகும். "
        "ஒரே தொடர் அல்ல என்றாலும் இந்தப் பொருத்தம் எளிதாக இயங்கும்."
    ),
    NumberRelation.NEUTRAL: (
        "இரு எண்களும் வெவ்வேறு தொடர்களைச் சேர்ந்தவை. சீரோ இங்கே தனி இணக்கத்தையும் "
        "சொல்லவில்லை, சிரமத்தையும் சொல்லவில்லை — இதை ஜாதகமே தீர்மானிக்கிறது."
    ),
}


def pair_numbers(
    kind: PairKind,
    reading_a: NumberReading,
    reading_b: NumberReading,
    *,
    lagna_rasi_a: int,
    lagna_rasi_b: int,
    basis: CompatibilityBasis = CompatibilityBasis.CHEIRO_SERIES,
    strengths_a: dict[str, float] | None = None,
    strengths_b: dict[str, float] | None = None,
    node_rasi_map_a: dict[str, int] | None = None,
    node_rasi_map_b: dict[str, int] | None = None,
) -> NumberPair:
    """Read one pair of numbers, each also aligned against its own chart.

    The graha view is computed under either basis, because it is reported either
    way — see the module docstring on where the asymmetry belongs.
    """
    number_a, number_b = reading_a.root, reading_b.root
    graha_a = NUMBER_TO_GRAHA[number_a]
    graha_b = NUMBER_TO_GRAHA[number_b]

    a_to_b, b_to_a, graha_grade = relation_between(graha_a, graha_b)
    relation = (
        graha_grade
        if basis is CompatibilityBasis.GRAHA_MAITRI
        else cheiro_relation(number_a, number_b)
    )

    return NumberPair(
        kind=kind,
        a=align_number(
            number_a,
            lagna_rasi_a,
            natal_strength=(strengths_a or {}).get(graha_a),
            node_rasi_map=node_rasi_map_a,
        ),
        b=align_number(
            number_b,
            lagna_rasi_b,
            natal_strength=(strengths_b or {}).get(graha_b),
            node_rasi_map=node_rasi_map_b,
        ),
        basis=basis,
        relation=relation,
        score=_RELATION_SCORE[relation],
        weight=_WEIGHTS[kind],
        graha_regard_a_to_b=a_to_b,
        graha_regard_b_to_a=b_to_a,
        graha_relation=graha_grade,
        reason_en=_reason_en(kind, number_a, number_b, graha_a, graha_b, relation, basis),
        reason_ta=_reason_ta(kind, number_a, number_b, graha_a, graha_b, relation, basis),
    )


def _reason_en(
    kind: PairKind,
    a: int,
    b: int,
    graha_a: str,
    graha_b: str,
    relation: NumberRelation,
    basis: CompatibilityBasis,
) -> str:
    head = (
        f"{_KIND_EN[kind]} {a} and {b} are ruled by {planet_en(graha_a)} and "
        f"{planet_en(graha_b)}."
    )
    if basis is CompatibilityBasis.CHEIRO_SERIES:
        return f"{head} {_CHEIRO_EN[relation]}"
    return f"{head} {_RELATION_EN[relation]}"


def _reason_ta(
    kind: PairKind,
    a: int,
    b: int,
    graha_a: str,
    graha_b: str,
    relation: NumberRelation,
    basis: CompatibilityBasis,
) -> str:
    head = (
        f"{_KIND_TA[kind]} {a}, {b} — {planet_ta(graha_a)}, {planet_ta(graha_b)} ஆட்சி."
    )
    if basis is CompatibilityBasis.CHEIRO_SERIES:
        return f"{head} {_CHEIRO_TA[relation]}"
    return f"{head} {_RELATION_TA[relation]}"


@dataclass(frozen=True, slots=True)
class NameHarmony:
    """One partner's own name against their own date of birth and chart.

    **Sethuraman's core doctrine** (D5) — "how a person should have his or her
    name spelt based on dates of birth" — and the thing Tamil families actually
    act on when they add or drop a letter. It is a fact about *one* person, so it
    is reported per side and never averaged into the couple's score: folding a
    one-person finding into a two-person number would make the pair score partly
    not about the pair.

    ``None`` when that partner supplied no name. Absence is not a low score.
    """

    #: 0-100 Fortune Alignment of this person's numbers against their own chart.
    score: int
    #: The name number's own alignment verdict in this chart.
    verdict: str
    #: Doctrine §9.1/§9.2 — False for any functionally benefic graha. The field
    #: that lets the product say "your name already suits you".
    change_advised: bool


@dataclass(frozen=True, slots=True)
class NumerologyCompatibility:
    """Peyar Porutham — the numerology layer, before the astrology is applied.

    Named for what Tamil practice calls it (D5). It sits *beneath* Jathagam
    Porutham, which is why this dataclass carries no verdict label of its own.
    """

    pairs: tuple[NumberPair, ...]
    #: Weighted mean of the pair scores, 0-100.
    score: int
    #: Where that score lands. A band, not a relation — see ``CompatibilityBand``.
    band: CompatibilityBand
    basis: CompatibilityBasis
    #: Each partner's own name↔date harmony. Reported, never scored into ``score``.
    name_harmony_a: NameHarmony | None = None
    name_harmony_b: NameHarmony | None = None


#: What this instrument is called, shown on every response (D5). Tamil first —
#: it is the tradition's own name for the method, not a translation of ours.
PEYAR_PORUTHAM_EN = "Peyar Porutham — name and birth-date matching."
PEYAR_PORUTHAM_TA = "பெயர் பொருத்தம் — பெயரும் பிறந்த தேதியும் ஒப்பிடும் முறை."

#: Stated on every response so the ranking of the two instruments is never left
#: to the client's layout. Jathagam Porutham decides; Peyar Porutham annotates.
PRECEDENCE_EN = (
    "Jathagam Porutham — the ten poruthams read from both horoscopes — decides "
    "this match. Peyar Porutham is read alongside it and never over it."
)
PRECEDENCE_TA = (
    "இரு ஜாதகங்களிலிருந்தும் பார்க்கப்படும் பத்து பொருத்தங்களே — ஜாதகப் "
    "பொருத்தமே — இந்தப் பொருத்தத்தைத் தீர்மானிக்கிறது. பெயர் பொருத்தம் "
    "அதனுடன் சேர்த்துப் பார்க்கப்படுவதே, அதற்கு மேல் அல்ல."
)


def _band_for_score(score: int) -> CompatibilityBand:
    """Nearest summary band to an aggregate score.

    Nearest rather than a cutoff ladder: the bands are not evenly spaced, and a
    ladder would need its own thresholds — a second set of numbers to keep in
    step with ``_BAND_SCORE``.

    Exact ties are reachable (83 sits between 92 and 74; 46 between 55 and 38)
    and resolve to the **better** band, because ``_BAND_SCORE`` is declared
    best-first and ``min`` keeps the first minimum. That is deliberate and pinned
    by a test: this band sits beside the astrological verdict, and rounding a
    summary down on a tie would read as a judgement the arithmetic did not make.
    """
    return min(_BAND_SCORE, key=lambda band: abs(_BAND_SCORE[band] - score))


def name_harmony_from_alignment(alignment: FortuneAlignment | None) -> NameHarmony | None:
    """Project a partner's own Fortune Alignment into the per-side harmony (D5).

    Returns ``None`` when no name was scored — the alignment of a nameless
    profile says nothing about a *name*, and reporting its date-only score under
    a "name harmony" label would be a quiet lie.
    """
    if alignment is None or alignment.name is None:
        return None
    return NameHarmony(
        score=alignment.overall_score,
        verdict=alignment.name.verdict.value,
        change_advised=alignment.name_change_advised,
    )


def compare_numbers(
    pairs: tuple[NumberPair, ...],
    *,
    alignment_a: FortuneAlignment | None = None,
    alignment_b: FortuneAlignment | None = None,
) -> NumerologyCompatibility:
    """Aggregate the pairs. Weights are renormalised over what is present.

    ``alignment_a``/``alignment_b`` are each partner's own Fortune Alignment.
    They populate ``name_harmony_*`` and are deliberately **not** mixed into
    ``score`` — see ``NameHarmony``.

    Refuses a mixed-basis set: two pairs graded by different doctrines cannot be
    averaged into one number, and the caller that assembled them has a bug worth
    hearing about rather than a plausible-looking score.
    """
    if not pairs:
        raise ValueError("at least one number pair is required")
    bases = {pair.basis for pair in pairs}
    if len(bases) > 1:
        raise ValueError(
            f"cannot aggregate pairs graded under different bases: {sorted(b.value for b in bases)}"
        )
    total_weight = sum(pair.weight for pair in pairs)
    score = round(sum(pair.weight * pair.score for pair in pairs) / total_weight)
    return NumerologyCompatibility(
        pairs=pairs,
        score=score,
        band=_band_for_score(score),
        basis=bases.pop(),
        name_harmony_a=name_harmony_from_alignment(alignment_a),
        name_harmony_b=name_harmony_from_alignment(alignment_b),
    )


@dataclass(frozen=True, slots=True)
class LayeredCompatibility:
    """The astrology's verdict with the numerology layered over it.

    ``label`` is the porutham engine's own and is never recomputed here. That is
    the doctrine in a field: numerology may move the *score* inside a bounded
    band and may not move the *verdict* at all.
    """

    numerology: NumerologyCompatibility
    #: Astrological percentage this layered over, passed in, never derived.
    porutham_percentage: float
    #: The porutham engine's label, echoed unchanged.
    label: str
    #: Signed, bounded by ``NUMEROLOGY_ADJUSTMENT_BOUND``.
    adjustment: int
    #: True when a positive adjustment was withheld because the match carries an
    #: astrological caution. Surfaced so the clamp is visible, never silent.
    clamped_by_astrology: bool
    combined_score: float


def _adjustment_for(score: int) -> int:
    """Turn an aggregate 0-100 numerology score into a bounded signed nudge."""
    if score >= NEUTRAL_SCORE:
        raw = (score - NEUTRAL_SCORE) / _SPAN_UP * NUMEROLOGY_ADJUSTMENT_BOUND
    else:
        raw = (score - NEUTRAL_SCORE) / _SPAN_DOWN * NUMEROLOGY_ADJUSTMENT_BOUND
    bounded = max(-NUMEROLOGY_ADJUSTMENT_BOUND, min(NUMEROLOGY_ADJUSTMENT_BOUND, raw))
    return round(bounded)


def layer_over_porutham(
    numerology: NumerologyCompatibility,
    *,
    porutham_percentage: float,
    porutham_label: str,
    has_astrological_caution: bool,
) -> LayeredCompatibility:
    """Apply the numerology layer to an astrological verdict that already exists.

    The astrological arguments are required and are not computed here, so this
    function is structurally incapable of producing a compatibility reading with
    no chart behind it.

    ``has_astrological_caution`` clamps any positive adjustment to zero, exactly
    as ``numerology_timing.score_date`` does for a flagged date: a numerologically
    excellent pairing can never lift a match the poruthams have flagged, but it
    can still lower one. The label is passed straight through.
    """
    adjustment = _adjustment_for(numerology.score)
    clamped = has_astrological_caution and adjustment > 0
    if clamped:
        adjustment = 0
    combined = max(0.0, min(100.0, porutham_percentage + adjustment))
    return LayeredCompatibility(
        numerology=numerology,
        porutham_percentage=porutham_percentage,
        label=porutham_label,
        adjustment=adjustment,
        clamped_by_astrology=clamped,
        combined_score=round(combined, 1),
    )


def summary_en(layered: LayeredCompatibility) -> str:
    """One honest line naming which instrument said what."""
    body = (
        f"The poruthams rate this match {layered.porutham_percentage}% "
        f"({layered.label}). Read against that, the numbers are "
        f"{layered.numerology.band.value} ({layered.numerology.score}/100)."
    )
    if layered.clamped_by_astrology:
        return (
            f"{body} The numerology would have raised the score, but the "
            "astrological cautions on this match hold it where it is."
        )
    return f"{body} The porutham verdict stands as given; numerology only shades it."


def summary_ta(layered: LayeredCompatibility) -> str:
    body = (
        f"பொருத்தங்கள் இந்தப் பொருத்தத்திற்கு {layered.porutham_percentage}% "
        f"({layered.label}) தருகின்றன. அதனுடன் ஒப்பிடுகையில் எண்களின் நிலை "
        f"{layered.numerology.score}/100."
    )
    if layered.clamped_by_astrology:
        return (
            f"{body} எண் கணிதம் மதிப்பெண்ணை உயர்த்தியிருக்கும், ஆனால் இந்தப் "
            "பொருத்தத்தின் ஜோதிட எச்சரிக்கைகள் அதை அப்படியே நிறுத்துகின்றன."
        )
    return f"{body} பொருத்த முடிவே இறுதியானது; எண் கணிதம் அதற்கு நிழல் மட்டுமே."
