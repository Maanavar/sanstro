"""Chaldean numerology core (NUM-10..12, NUM-20..23).

Pure module: no DB, no ephemeris, no clock, no settings. Every function is
deterministic and sub-millisecond.

System choice
-------------
**Chaldean, not Pythagorean.** Tamil Nadu practice is Chaldean; a Pythagorean
table would be dismissed on sight by any practitioner. Two properties of the
Chaldean system break naive implementations, and both are enforced here:

1. **No letter carries the value 9.** Nine is held apart. The table below is
   *data*, not an ``A=1..Z=26 mod 9`` formula — deriving it arithmetically
   produces a different, wrong table.

2. **The compound number outranks the root.** 43 and 34 both reduce to 7 and
   mean different things. Every reading therefore carries ``total``,
   ``reduction_chain``, ``compound`` and ``root``; the compound is never
   discarded. Reducing to a single digit and stopping is the clearest tell of a
   low-quality implementation.

Script discipline (doctrine D3)
-------------------------------
Chaldean values are defined over the Latin alphabet, and Tamil Nadu name
correction operates on the **document spelling** (Aadhaar/passport/certificate).
``score_text`` therefore rejects non-Latin letters with ``ScriptMismatchError``
rather than skipping them — silently ignoring Tamil characters would return a
plausible, wrong number, which is the exact failure mode this codebase keeps
getting bitten by. Characters that are legitimately not letters (spaces,
hyphens, apostrophes, dots) are ignored *and reported* in
``NumberReading.ignored_characters`` so a caller can show what was dropped.

Open doctrine question (D4, see docs/NUMEROLOGY_IMPLEMENTATION_PLAN)
--------------------------------------------------------------------
Which value in the reduction chain is "the compound" is not fully settled.
This module uses the most common Tamil/Cheiro convention: **the first value in
the chain that falls within Cheiro's documented 10..52 series**. So a name
totalling 37 has compound 37 (not 10), and one totalling 87 has compound 15
(87 is outside the series, so reduce once). ``reduction_chain`` is always
exposed so a different reading can be derived without recomputation.
"""
from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from enum import StrEnum

from app.calculations.display_names import planet_en, planet_ta

#: Chaldean letter groups. NOTE the absence of 9 — see module docstring.
CHALDEAN_GROUPS: dict[int, str] = {
    1: "AIJQY",
    2: "BKR",
    3: "CGLS",
    4: "DMT",
    5: "EHNX",
    6: "UVW",
    7: "OZ",
    8: "FP",
}

CHALDEAN_VALUES: dict[str, int] = {
    letter: value for value, letters in CHALDEAN_GROUPS.items() for letter in letters
}

#: Number -> graha. The one place Chaldean numerology touches jyotisha, and the
#: bridge the Fortune Alignment Score (Phase 3) is built on. Enum keys match
#: ``app.calculations.display_names`` so Tamil/English display is not forked.
NUMBER_TO_GRAHA: dict[int, str] = {
    1: "SUN",
    2: "MOON",
    3: "JUPITER",
    4: "RAHU",
    5: "MERCURY",
    6: "VENUS",
    7: "KETU",
    8: "SATURN",
    9: "MARS",
}

#: Cheiro's documented compound series. A compound outside this range is
#: reduced further rather than interpreted.
COMPOUND_SERIES_MIN = 10
COMPOUND_SERIES_MAX = 52

#: Non-letter characters that may appear in a real written name and are dropped
#: without complaint (but are still reported).
_IGNORABLE = frozenset(" \t\n.'’-_/,()")


class ScriptMismatchError(ValueError):
    """Raised when a non-Latin script reaches the Chaldean scorer.

    Chaldean values are Latin-only. Scoring a Tamil string by skipping its
    characters would return a confident wrong answer; refusing is the only safe
    behaviour. Callers must romanise first and record which string they scored.
    """


class ObjectKind(StrEnum):
    """Non-person subjects that carry a number (NUM-21..23)."""

    MOBILE = "mobile"
    VEHICLE = "vehicle"
    HOUSE = "house"


@dataclass(frozen=True, slots=True)
class NumberReading:
    """One computed number, with its full derivation kept intact."""

    total: int
    reduction_chain: tuple[int, ...]
    compound: int | None
    root: int
    graha: str
    ignored_characters: tuple[str, ...] = ()

    @property
    def graha_ta(self) -> str:
        return planet_ta(self.graha)

    @property
    def graha_en(self) -> str:
        return planet_en(self.graha)

    @property
    def has_compound(self) -> bool:
        """False for a single-digit total — there is no compound to interpret."""
        return self.compound is not None


def digit_sum(value: int) -> int:
    """Sum of the decimal digits of ``value``. Public: the timing engine needs it."""
    return sum(int(ch) for ch in str(abs(value)))


def reduction_chain(total: int) -> tuple[int, ...]:
    """Full reduction path, starting at ``total`` and ending at a single digit.

    Exposed (rather than kept internal) because the compound convention is an
    open doctrine question — a caller can re-derive a different reading from the
    chain without recomputing the sum.
    """
    if total < 0:
        raise ValueError("total must be non-negative")
    chain = [total]
    current = total
    while current > 9:
        current = digit_sum(current)
        chain.append(current)
    return tuple(chain)


def compound_from_chain(chain: tuple[int, ...]) -> int | None:
    """First value in Cheiro's 10..52 series, or None for a single-digit total."""
    for value in chain:
        if COMPOUND_SERIES_MIN <= value <= COMPOUND_SERIES_MAX:
            return value
    return None


def reading_from_total(total: int, ignored: tuple[str, ...] = ()) -> NumberReading:
    """Build a full reading from an already-summed total.

    Public so sibling modules (``numerology_timing``) build readings the same
    way rather than re-deriving compound/root/graha and drifting.
    """
    chain = reduction_chain(total)
    root = chain[-1]
    if root == 0:
        raise ValueError("cannot build a reading from a zero total")
    return NumberReading(
        total=total,
        reduction_chain=chain,
        compound=compound_from_chain(chain),
        root=root,
        graha=NUMBER_TO_GRAHA[root],
        ignored_characters=ignored,
    )


def chaldean_value(char: str) -> int | None:
    """Chaldean value of a single Latin letter, or None if it is not a letter."""
    return CHALDEAN_VALUES.get(char.upper())


def _strip_diacritics(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def score_text(text: str) -> NumberReading:
    """Chaldean reading of a written name.

    Raises ``ScriptMismatchError`` on non-Latin letters (doctrine D3) and
    ``ValueError`` on input with no scoreable letters at all.
    """
    if not text or not text.strip():
        raise ValueError("cannot score an empty name")

    normalized = _strip_diacritics(text)
    total = 0
    ignored: list[str] = []
    for char in normalized:
        if char in _IGNORABLE:
            ignored.append(char)
            continue
        value = chaldean_value(char)
        if value is not None:
            total += value
            continue
        if char.isalpha():
            raise ScriptMismatchError(
                f"{char!r} (U+{ord(char):04X}, {unicodedata.name(char, 'unnamed')}) is not a "
                "Latin letter. Chaldean values are Latin-only and Tamil Nadu name correction "
                "scores the document spelling — romanise the name first and record which "
                "string was scored."
            )
        ignored.append(char)

    if total == 0:
        raise ValueError(f"no scoreable Latin letters in {text!r}")
    return reading_from_total(total, tuple(dict.fromkeys(ignored)))


def score_digits(text: str) -> NumberReading:
    """Reading of a digit string (mobile, house, plate digits).

    Letters are scored with the Chaldean table too — vehicle plates and house
    numbers like "12A" are alphanumeric in practice.
    """
    if not text or not text.strip():
        raise ValueError("cannot score an empty number")

    normalized = _strip_diacritics(text)
    total = 0
    ignored: list[str] = []
    seen_token = False
    for char in normalized:
        if char.isdigit():
            total += int(char)
            seen_token = True
            continue
        value = chaldean_value(char)
        if value is not None:
            total += value
            seen_token = True
            continue
        if char.isalpha():
            raise ScriptMismatchError(
                f"{char!r} is not a Latin letter or digit; cannot score it."
            )
        ignored.append(char)

    if not seen_token or total == 0:
        raise ValueError(f"no scoreable digits or letters in {text!r}")
    return reading_from_total(total, tuple(dict.fromkeys(ignored)))


# ---------------------------------------------------------------------------
# The four core numbers (NUM-11)
# ---------------------------------------------------------------------------
@dataclass(frozen=True, slots=True)
class NumerologyProfile:
    """The four numbers a Tamil practitioner reads for a person.

    ``scored_name``/``scored_namesake`` record the exact string that produced
    each number. Doctrine D3 requires this: an English-spelling reading and a
    Tamil-spelling reading are different numbers, and a response that does not
    say which it computed is unusable for name correction.
    """

    psychic: NumberReading
    destiny: NumberReading
    name: NumberReading | None = None
    namesake: NumberReading | None = None
    scored_name: str | None = None
    scored_namesake: str | None = None


def psychic_number(birth_day: int) -> NumberReading:
    """Day-of-month reading. Strongest roughly 1..35 years."""
    if not 1 <= birth_day <= 31:
        raise ValueError(f"birth_day must be 1..31, got {birth_day}")
    return reading_from_total(birth_day)


def destiny_number(year: int, month: int, day: int) -> NumberReading:
    """Life-path reading: every digit of the full date of birth.

    Sums all digits of YYYY+MM+DD rather than summing pre-reduced components.
    Because digit sums are congruent mod 9 the two methods always agree on the
    *root* — but they produce different totals and therefore different
    **compounds** (1990-05-17: all-digits 32, pre-reduced 14; both root 5). The
    compound outranks the root, so this is a real difference, not a stylistic
    one. All-digits is the Chaldean/Cheiro standard.
    """
    if not 1 <= month <= 12:
        raise ValueError(f"month must be 1..12, got {month}")
    if not 1 <= day <= 31:
        raise ValueError(f"day must be 1..31, got {day}")
    if year < 1:
        raise ValueError(f"year must be positive, got {year}")
    total = digit_sum(year) + digit_sum(month) + digit_sum(day)
    return reading_from_total(total)


def build_profile(
    *,
    year: int,
    month: int,
    day: int,
    document_name: str | None = None,
    called_name: str | None = None,
) -> NumerologyProfile:
    """Assemble the four numbers.

    ``document_name`` is the spelling on official records — the one name
    correction targets. ``called_name`` is what people actually use day to day;
    it frequently differs, and practitioners read it separately.
    """
    return NumerologyProfile(
        psychic=psychic_number(day),
        destiny=destiny_number(year, month, day),
        name=score_text(document_name) if document_name else None,
        namesake=score_text(called_name) if called_name else None,
        scored_name=document_name or None,
        scored_namesake=called_name or None,
    )


# ---------------------------------------------------------------------------
# Object numerology (NUM-20..23)
# ---------------------------------------------------------------------------
@dataclass(frozen=True, slots=True)
class ObjectReading:
    kind: ObjectKind
    raw: str
    scored: str
    reading: NumberReading
    #: Mobile numbers are read both whole and by their last four digits; this
    #: carries the secondary reading where a convention calls for one.
    secondary_label: str | None = None
    secondary: NumberReading | None = None


def _digits_only(text: str) -> str:
    return "".join(ch for ch in text if ch.isdigit())


def analyze_object(
    raw: str,
    kind: ObjectKind,
    *,
    mobile_tail_length: int = 4,
) -> ObjectReading:
    """Score a mobile / vehicle / house number.

    Mobile also returns a last-``mobile_tail_length``-digits reading, which is
    the more commonly quoted number in Tamil Nadu practice. Vehicle plates and
    house numbers are scored whole, letters included ("TN 09 BX 4512", "12A").
    """
    if not raw or not raw.strip():
        raise ValueError("cannot analyze an empty value")

    if kind is ObjectKind.MOBILE:
        digits = _digits_only(raw)
        if not digits:
            raise ValueError(f"no digits in mobile number {raw!r}")
        primary = score_digits(digits)
        tail = digits[-mobile_tail_length:] if len(digits) >= mobile_tail_length else None
        return ObjectReading(
            kind=kind,
            raw=raw,
            scored=digits,
            reading=primary,
            secondary_label=f"last {mobile_tail_length}" if tail else None,
            secondary=score_digits(tail) if tail else None,
        )

    scored = raw.strip()
    return ObjectReading(kind=kind, raw=raw, scored=scored, reading=score_digits(scored))
