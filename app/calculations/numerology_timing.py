"""Time numerology — personal year/month/day and date scoring (NUM-40..45, Phase 4).

Pure module: no DB, no ephemeris, no clock, no settings. Every function takes the
dates it needs as arguments so the caller — not this module — owns "today".

What Phase 4 is, and is not
---------------------------
These are **scoring layers, not engines**. The panchangam stays authoritative on
whether a date is auspicious; numerology only re-ranks *within a set muhurta has
already blessed*. That rule is enforced here rather than left to the caller:
``score_date`` takes ``has_astrological_caution`` and, when it is set, clamps its
own adjustment to at most zero. A numerologically ideal date that is
astrologically flagged can therefore never be lifted above a clean one — see
``NUMEROLOGY_ADJUSTMENT_BOUND`` and plan §7 Phase 4 "Design note".

Chart-first, exactly as in Phase 3
----------------------------------
The adjustment is derived from where a date's number sits in the *chart's own*
ranking of 1-9 (``numerology_alignment.favourable_numbers_for``), never from a
number's generic reputation. A "4 date" is good for a native whose Rahu is well
placed and quiet for one whose Rahu is not — which is the whole point of having
a jadhagam engine underneath.

Digit convention
----------------
Totals sum **every digit** of every component (17 May 2026 -> 1+7+5+2+0+2+6),
matching ``numerology.destiny_number``. Many published sources pre-reduce each
component first (8+5+1). Both always agree on the **root** — digit sums are
congruent mod 9 — but they produce different **compounds**, and the compound
outranks the root, so the choice is real. All-digits is the Chaldean/Cheiro
standard and is what the rest of this engine already does; forking the
convention between two modules of the same feature would be worse than either
choice.
"""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, timedelta
from enum import StrEnum

from app.calculations.numerology import NumberReading, digit_sum, reading_from_total
from app.calculations.numerology_alignment import align_number

#: Maximum points numerology may move an astrological score, in either
#: direction. The muhurta/naal scores it layers over are 0-100, so this is a
#: nudge inside a band, never a re-ordering of the astrology. Widening it is a
#: doctrine change, not a tuning change.
NUMEROLOGY_ADJUSTMENT_BOUND = 8

#: Rank in the chart's favourable-number list that scores zero adjustment.
#: Nine numbers, so rank 5 is the median and the neutral point by construction.
_NEUTRAL_RANK = 5


class PersonalYearEpoch(StrEnum):
    """When the personal year rolls over (doctrine D1).

    All three ship. The default lives in the ``numerology_personal_year_epoch``
    feature flag so the ruling is a ``PATCH /admin/flags`` call rather than a
    code change.
    """

    #: Rolls on the native's birthday. Vinaadi's default — not because the
    #: calendar-year method is wrong (it is the more widely published one) but
    #: because varshaphala here already rolls at the solar return, and two
    #: "your year ahead" features with different year boundaries inside one app
    #: would contradict each other with no explanation available.
    BIRTHDAY = "birthday"
    #: Rolls 1 January. The dominant published convention in both Pythagorean
    #: and Chaldean practice.
    JANUARY = "january"
    #: Rolls at Puthandu (Sun into Mesha). A minority Tamil view, retained
    #: because it costs nothing once the branch exists.
    CHITHIRAI = "chithirai"


def resolve_epoch(value: str | PersonalYearEpoch) -> PersonalYearEpoch:
    """Parse a flag value into an epoch.

    Raises on anything unrecognised. A typo in the flag must not silently fall
    back to the default — that would ship a year boundary nobody chose.
    """
    if isinstance(value, PersonalYearEpoch):
        return value
    try:
        return PersonalYearEpoch(str(value).strip().lower())
    except ValueError as exc:
        valid = ", ".join(sorted(e.value for e in PersonalYearEpoch))
        raise ValueError(
            f"unknown personal-year epoch {value!r}; valid values are {valid}"
        ) from exc


#: Resolver for Puthandu (Chithirai 1) of a given calendar year. Required only
#: for the CHITHIRAI epoch, because the date moves (13-15 April) with the Sun's
#: sidereal entry into Mesha and can only be answered by the ephemeris — which
#: this module deliberately does not import.
ChithiraiResolver = Callable[[int], date]


@dataclass(frozen=True, slots=True)
class PersonalYear:
    """The personal year in force on a given date, with its own boundaries."""

    reading: NumberReading
    epoch: PersonalYearEpoch
    #: The calendar year summed into the number. Under BIRTHDAY and CHITHIRAI
    #: this is the previous year for dates before the rollover.
    governing_year: int
    cycle_start: date
    #: Inclusive last day of the cycle.
    cycle_end: date

    @property
    def root(self) -> int:
        return self.reading.root

    def contains(self, day: date) -> bool:
        return self.cycle_start <= day <= self.cycle_end


@dataclass(frozen=True, slots=True)
class PersonalCycle:
    """Personal year, month and day for one native on one date."""

    on_date: date
    year: PersonalYear
    month: NumberReading
    day: NumberReading


def _anniversary(birth_date: date, in_year: int) -> date:
    """The birthday anniversary falling in ``in_year``.

    A 29 February birth has no anniversary in a common year. It rolls to
    1 March: the completed year is attained once February ends, which is also
    the Indian legal position for attaining majority. Clamping back to
    28 February would instead award the year a day early.
    """
    try:
        return birth_date.replace(year=in_year)
    except ValueError:
        return date(in_year, 3, 1)


def _cycle_bounds(
    on_date: date,
    birth_date: date,
    epoch: PersonalYearEpoch,
    chithirai_start_for: ChithiraiResolver | None,
) -> tuple[int, date, date]:
    """(governing_year, cycle_start, cycle_end_inclusive) for ``on_date``."""
    if epoch is PersonalYearEpoch.JANUARY:
        year = on_date.year
        return year, date(year, 1, 1), date(year, 12, 31)

    if epoch is PersonalYearEpoch.BIRTHDAY:
        this_year = _anniversary(birth_date, on_date.year)
        if on_date >= this_year:
            return on_date.year, this_year, _anniversary(birth_date, on_date.year + 1) - timedelta(days=1)
        return (
            on_date.year - 1,
            _anniversary(birth_date, on_date.year - 1),
            this_year - timedelta(days=1),
        )

    if chithirai_start_for is None:
        raise ValueError(
            "the 'chithirai' epoch needs a Puthandu resolver — the date moves "
            "13-15 April with the Sun's entry into Mesha and cannot be assumed. "
            "app/services/numerology_timing_service.py supplies one."
        )
    this_year = chithirai_start_for(on_date.year)
    if on_date >= this_year:
        return (
            on_date.year,
            this_year,
            chithirai_start_for(on_date.year + 1) - timedelta(days=1),
        )
    return (
        on_date.year - 1,
        chithirai_start_for(on_date.year - 1),
        this_year - timedelta(days=1),
    )


def personal_year(
    birth_date: date,
    on_date: date,
    *,
    epoch: PersonalYearEpoch = PersonalYearEpoch.BIRTHDAY,
    chithirai_start_for: ChithiraiResolver | None = None,
) -> PersonalYear:
    """The personal year in force for ``birth_date`` on ``on_date`` (NUM-40).

    Sums the digits of the birth day, the birth month and the *governing* year —
    which is the calendar year only under the JANUARY epoch. Under BIRTHDAY and
    CHITHIRAI a date before the rollover still belongs to the previous year, and
    that is the number a practitioner would read.
    """
    governing_year, start, end = _cycle_bounds(on_date, birth_date, epoch, chithirai_start_for)
    total = digit_sum(birth_date.day) + digit_sum(birth_date.month) + digit_sum(governing_year)
    return PersonalYear(
        reading=reading_from_total(total),
        epoch=epoch,
        governing_year=governing_year,
        cycle_start=start,
        cycle_end=end,
    )


def personal_month(personal_year_root: int, month: int) -> NumberReading:
    """Personal month: the personal year root plus the calendar month (NUM-41)."""
    if not 1 <= personal_year_root <= 9:
        raise ValueError(f"personal_year_root must be 1..9, got {personal_year_root}")
    if not 1 <= month <= 12:
        raise ValueError(f"month must be 1..12, got {month}")
    return reading_from_total(personal_year_root + month)


def personal_day(personal_month_root: int, day: int) -> NumberReading:
    """Personal day: the personal month root plus the day of month (NUM-41)."""
    if not 1 <= personal_month_root <= 9:
        raise ValueError(f"personal_month_root must be 1..9, got {personal_month_root}")
    if not 1 <= day <= 31:
        raise ValueError(f"day must be 1..31, got {day}")
    return reading_from_total(personal_month_root + day)


def personal_cycle(
    birth_date: date,
    on_date: date,
    *,
    epoch: PersonalYearEpoch = PersonalYearEpoch.BIRTHDAY,
    chithirai_start_for: ChithiraiResolver | None = None,
) -> PersonalCycle:
    """Personal year, month and day together (NUM-40, NUM-41).

    Note the month and day are keyed to the *calendar* month and day of
    ``on_date`` under every epoch. Only the year boundary is doctrinal; the
    month and day steps are universal.
    """
    year = personal_year(
        birth_date, on_date, epoch=epoch, chithirai_start_for=chithirai_start_for
    )
    month = personal_month(year.root, on_date.month)
    return PersonalCycle(
        on_date=on_date,
        year=year,
        month=month,
        day=personal_day(month.root, on_date.day),
    )


# ---------------------------------------------------------------------------
# Date numerology (NUM-42, NUM-43, NUM-44)
# ---------------------------------------------------------------------------
def date_number(day: date) -> NumberReading:
    """The date's own number: every digit of DD + MM + YYYY."""
    return reading_from_total(
        digit_sum(day.day) + digit_sum(day.month) + digit_sum(day.year)
    )


@dataclass(frozen=True, slots=True)
class DateNumerology:
    """What numerology has to say about one candidate date, and how much of it counts."""

    date: date
    #: The date's own number.
    reading: NumberReading
    #: The native's personal day on that date, when a birth date was supplied.
    personal_day: NumberReading | None
    #: 1-9 position of ``reading.root`` in this chart's favourable-number
    #: ranking, best = 1. None when no chart was supplied.
    favourability_rank: int | None
    #: Signed points to add to the astrological score. Bounded by
    #: ``NUMEROLOGY_ADJUSTMENT_BOUND`` and never positive on a date the
    #: astrology has already flagged.
    adjustment: int
    #: True when a positive adjustment was withheld because the astrology
    #: flagged the date. Surfaced so the clamp is visible, not silent.
    clamped_by_astrology: bool
    note_en: str
    note_ta: str


def _rank_adjustment(rank: int) -> int:
    """Map a 1-9 favourability rank to a bounded, symmetric adjustment.

    rank 1 -> +8 ... rank 5 -> 0 ... rank 9 -> -8.
    """
    span = _NEUTRAL_RANK - 1
    return round(NUMEROLOGY_ADJUSTMENT_BOUND * (_NEUTRAL_RANK - rank) / span)


def score_date(
    day: date,
    *,
    favourable_numbers: tuple[int, ...] | None = None,
    birth_date: date | None = None,
    epoch: PersonalYearEpoch = PersonalYearEpoch.BIRTHDAY,
    chithirai_start_for: ChithiraiResolver | None = None,
    has_astrological_caution: bool = False,
) -> DateNumerology:
    """Score one candidate date for a native (NUM-42, NUM-44).

    ``favourable_numbers`` is the chart's own 1-9 ranking from
    ``numerology_alignment.favourable_numbers_for`` — chart-first by
    construction, so this function never consults a number's generic reputation.
    Without it the adjustment is zero: no chart, no opinion.

    ``has_astrological_caution`` is the doctrine guard. When the panchangam has
    flagged the date, numerology may still lower the ranking but may never raise
    it. Plan §7: *"A numerologically ideal date that is astrologically
    inauspicious must never be recommended."*
    """
    reading = date_number(day)

    rank: int | None = None
    adjustment = 0
    if favourable_numbers:
        if sorted(favourable_numbers) != list(range(1, 10)):
            raise ValueError(
                "favourable_numbers must be a ranking of all nine numbers; got "
                f"{favourable_numbers!r}"
            )
        rank = favourable_numbers.index(reading.root) + 1
        adjustment = _rank_adjustment(rank)

    clamped = has_astrological_caution and adjustment > 0
    if clamped:
        adjustment = 0

    cycle_day: NumberReading | None = None
    if birth_date is not None:
        cycle_day = personal_cycle(
            birth_date, day, epoch=epoch, chithirai_start_for=chithirai_start_for
        ).day

    return DateNumerology(
        date=day,
        reading=reading,
        personal_day=cycle_day,
        favourability_rank=rank,
        adjustment=adjustment,
        clamped_by_astrology=clamped,
        note_en=_date_note_en(reading, rank, clamped),
        note_ta=_date_note_ta(reading, rank, clamped),
    )


def _date_note_en(reading: NumberReading, rank: int | None, clamped: bool) -> str:
    base = f"This date's number is {reading.root} ({reading.graha_en})"
    if rank is None:
        return f"{base}. No chart was supplied, so it is not weighed against your jadhagam."
    standing = (
        "among the strongest numbers for your chart" if rank <= 3
        else "mid-ranked for your chart" if rank <= 6
        else "among the quieter numbers for your chart"
    )
    note = f"{base}, {standing} (ranked {rank} of 9)."
    if clamped:
        note += " The panchangam has flagged this day, so its numerology does not raise it."
    return note


def _date_note_ta(reading: NumberReading, rank: int | None, clamped: bool) -> str:
    base = f"இந்த நாளின் எண் {reading.root} ({reading.graha_ta})"
    if rank is None:
        return f"{base}. ஜாதகம் தரப்படவில்லை; ஜாதகத்துடன் ஒப்பிடப்படவில்லை."
    standing = (
        "உங்கள் ஜாதகத்திற்கு மிகவும் பொருத்தமான எண்களில் ஒன்று" if rank <= 3
        else "உங்கள் ஜாதகத்திற்கு நடுநிலையான எண்" if rank <= 6
        else "உங்கள் ஜாதகத்திற்கு அமைதியான எண்களில் ஒன்று"
    )
    note = f"{base} — {standing} (9ல் {rank}வது)."
    if clamped:
        note += " பஞ்சாங்கம் இந்நாளில் எச்சரிக்கை காட்டுவதால், எண் கணிதம் இதை உயர்த்தாது."
    return note


# ---------------------------------------------------------------------------
# Business launch (NUM-45)
# ---------------------------------------------------------------------------
#: Weights for the launch blend. The date carries most: a launch is an act in
#: time, and the name is a standing property that the alignment engine already
#: reads separately. Renormalised over whichever components are present.
_LAUNCH_WEIGHTS: dict[str, float] = {
    "date": 0.45,
    "name": 0.35,
    "personal_year": 0.20,
}


@dataclass(frozen=True, slots=True)
class BusinessLaunchScore:
    """A launch-date ranking, and the reasons it is only a ranking (NUM-45)."""

    launch_date: date
    score: int
    date_number: NumberReading
    name_number: NumberReading | None
    #: Exactly the string that produced ``name_number`` (doctrine D3 discipline:
    #: a number without its input cannot be acted on).
    scored_name: str | None
    personal_year_number: NumberReading | None
    components: tuple[tuple[str, int], ...]
    reasons_en: tuple[str, ...]
    reasons_ta: tuple[str, ...]
    #: Always True. Numerology ranks launch dates; it never clears one. The
    #: muhurta engine decides whether the date is fit to act on at all.
    requires_muhurta_confirmation: bool = True


def business_launch_score(
    launch_date: date,
    lagna_rasi: int,
    *,
    name_number: NumberReading | None = None,
    scored_name: str | None = None,
    owner_birth_date: date | None = None,
    epoch: PersonalYearEpoch = PersonalYearEpoch.BIRTHDAY,
    chithirai_start_for: ChithiraiResolver | None = None,
    strengths: dict[str, float] | None = None,
    node_rasi_map: dict[str, int] | None = None,
) -> BusinessLaunchScore:
    """Rank a launch date against a chart (NUM-45).

    Every component is scored through Phase 3's ``align_number`` — the same
    chart-first path the Fortune Alignment uses — rather than a second, parallel
    scale invented here. ``lagna_rasi`` is the promoter's lagna (or the firm's,
    where one has been cast).

    ``name_number`` is passed in already computed rather than as a string,
    because scoring a business name is ``numerology.score_text``'s job and it
    raises on non-Latin input; taking the reading keeps that error at the
    caller's boundary where the input actually came from.
    """
    components: list[tuple[str, int, float]] = []
    reasons_en: list[str] = []
    reasons_ta: list[str] = []

    date_reading = date_number(launch_date)
    date_alignment = align_number(
        date_reading.root, lagna_rasi, natal_strength=(strengths or {}).get(date_reading.graha),
        node_rasi_map=node_rasi_map,
    )
    components.append(("date", date_alignment.score, _LAUNCH_WEIGHTS["date"]))
    reasons_en.append(f"Launch date number {date_reading.root} — {date_alignment.reason_en}")
    reasons_ta.append(f"தொடக்க நாள் எண் {date_reading.root} — {date_alignment.reason_ta}")

    if name_number is not None:
        name_alignment = align_number(
            name_number.root, lagna_rasi,
            natal_strength=(strengths or {}).get(name_number.graha),
            node_rasi_map=node_rasi_map,
        )
        components.append(("name", name_alignment.score, _LAUNCH_WEIGHTS["name"]))
        reasons_en.append(f"Business name number {name_number.root} — {name_alignment.reason_en}")
        reasons_ta.append(f"நிறுவனப் பெயர் எண் {name_number.root} — {name_alignment.reason_ta}")

    py: NumberReading | None = None
    if owner_birth_date is not None:
        py = personal_year(
            owner_birth_date, launch_date, epoch=epoch, chithirai_start_for=chithirai_start_for
        ).reading
        py_alignment = align_number(
            py.root, lagna_rasi, natal_strength=(strengths or {}).get(py.graha),
            node_rasi_map=node_rasi_map,
        )
        components.append(("personal_year", py_alignment.score, _LAUNCH_WEIGHTS["personal_year"]))
        reasons_en.append(
            f"You are in a {py.root} personal year — {py_alignment.reason_en}"
        )
        reasons_ta.append(
            f"நீங்கள் {py.root} தனிப்பட்ட ஆண்டில் உள்ளீர்கள் — {py_alignment.reason_ta}"
        )

    total_weight = sum(weight for _, _, weight in components)
    blended = sum(score * weight for _, score, weight in components) / total_weight

    reasons_en.append(
        "This is a numerological ranking of dates you have already cleared "
        "astrologically. Confirm the muhurta before fixing the date."
    )
    reasons_ta.append(
        "இது ஜோதிட ரீதியாக ஏற்கனவே தேர்ந்தெடுக்கப்பட்ட நாட்களுக்கிடையேயான எண் கணித "
        "வரிசைப்படுத்தல் மட்டுமே. நாளை உறுதி செய்வதற்கு முன் முகூர்த்தத்தைப் பாருங்கள்."
    )

    return BusinessLaunchScore(
        launch_date=launch_date,
        score=max(0, min(100, round(blended))),
        date_number=date_reading,
        name_number=name_number,
        scored_name=scored_name,
        personal_year_number=py,
        components=tuple((label, score) for label, score, _ in components),
        reasons_en=tuple(reasons_en),
        reasons_ta=tuple(reasons_ta),
    )
