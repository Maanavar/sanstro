from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass
from datetime import date
from typing import Literal

from app.data.calendar_categories_2026 import events_for_date as category_events_for_date

FestivalCategory = Literal[
    "hindu",
    "muslim",
    "christian",
    "indian_govt",
    "tamilnadu_govt",
    "govt",
    "observance",
]
FestivalEntry = tuple[str, str, FestivalCategory]


# ---------------------------------------------------------------------------
# World / international observance days (MM-DD) — apply every year.
# Tamil names are draft translations pending review.
# ---------------------------------------------------------------------------
_WORLD_OBSERVANCES: list[tuple[str, str]] = [
    ("01-04", "உலக பிரெய்லி தினம்"),
    ("02-04", "உலக புற்றுநோய் தினம்"),
    ("03-08", "சர்வதேச மகளிர் தினம்"),
    ("03-20", "உலக மகிழ்ச்சி தினம்"),
    ("03-21", "உலக காடுகள் தினம்"),
    ("03-22", "உலக நீர் தினம்"),
    ("04-07", "உலக சுகாதார தினம்"),
    ("04-22", "உலக புவி தினம்"),
    ("05-01", "உலக தொழிலாளர் தினம்"),
    ("05-31", "உலக புகையிலை எதிர்ப்பு தினம்"),
    ("06-05", "உலக சுற்றுச்சூழல் தினம்"),
    ("06-08", "உலக பெருங்கடல் தினம்"),
    ("06-08", "உலக மூளைக்கட்டி தினம்"),
    ("06-21", "சர்வதேச யோகா தினம்"),
    ("07-11", "உலக மக்கள்தொகை தினம்"),
    ("08-12", "சர்வதேச இளைஞர் தினம்"),
    ("09-08", "சர்வதேச எழுத்தறிவு தினம்"),
    ("09-21", "சர்வதேச அமைதி தினம்"),
    ("10-01", "சர்வதேச முதியோர் தினம்"),
    ("10-16", "உலக உணவு தினம்"),
    ("11-14", "உலக நீரிழிவு தினம்"),
    ("11-20", "உலக குழந்தைகள் தினம்"),
    ("12-01", "உலக எய்ட்ஸ் தினம்"),
    ("12-10", "உலக மனித உரிமைகள் தினம்"),
]


# ---------------------------------------------------------------------------
# Fixed Gregorian festivals (MM-DD) — apply every year
# ---------------------------------------------------------------------------
_FIXED_FESTIVALS: list[FestivalEntry] = [
    # Indian / Tamil Nadu government holidays with fixed Gregorian dates.
    ("01-01", "New Year's Day", "tamilnadu_govt"),
    ("01-26", "Republic Day", "indian_govt"),
    ("01-26", "Republic Day", "tamilnadu_govt"),
    ("05-01", "May Day (Labour Day)", "tamilnadu_govt"),
    ("08-15", "Independence Day", "indian_govt"),
    ("08-15", "Independence Day", "tamilnadu_govt"),
    ("10-02", "Gandhi Jayanthi", "indian_govt"),
    ("10-02", "Gandhi Jayanthi", "tamilnadu_govt"),
    # Christian — fixed
    ("12-25", "Christmas", "christian"),
    ("12-25", "Christmas", "indian_govt"),
    ("12-25", "Christmas", "tamilnadu_govt"),
    ("12-24", "Christmas Eve", "christian"),
]


# ---------------------------------------------------------------------------
# Year-specific festival dates (exact Gregorian dates for each year)
# ---------------------------------------------------------------------------
_YEARLY_FESTIVALS: dict[int, list[FestivalEntry]] = {
    2026: [
        # Hindu — solar / fixed Tamil calendar. Bhogi/Mattu Pongal/Kaanum
        # Pongal are simple day-offsets from Pongal itself (day-1/+1/+2) —
        # WI-12 (2026-07-16): corrected to stay consistent with the verified
        # Pongal date below (was one day late here, an error independent of
        # WI-12/WI-07 — the Makar Sankranti crossing for 2026 is 2026-01-14
        # 15:07 IST, hours before sunset under either sunrise definition).
        # These three remain hardcoded (not in Doctrine §8's starter rule
        # set) — only their dates were corrected, not their reckoning.
        # FCA-08: Bhogi / Mattu Pongal / Kaanum Pongal are now derived from
        # Thai 1 (`_yearly_observances`), which is 15 Jan 2026 by owner ruling;
        # the hindu rows that stood here were a day early. Gazetted rows stay.
        ("01-15", "Pongal", "tamilnadu_govt"),
        ("01-16", "Thiruvalluvar Day", "tamilnadu_govt"),
        ("01-17", "Uzhavar Thirunal", "tamilnadu_govt"),
        ("02-01", "Thai Poosam", "tamilnadu_govt"),
        ("04-14", "Tamil New Year (Puthandu) / Ambedkar Jayanti", "tamilnadu_govt"),
        ("09-04", "Krishna Jayanthi", "indian_govt"),
        ("09-04", "Krishna Jayanthi", "tamilnadu_govt"),
        # Vinayagar Chaturthi (WI-12): this gazetted govt-holiday date
        # (09-14) is kept as-is — it's an administrative record, not
        # something to override from a tithi calculation. The "hindu" tag
        # for the same name now comes from the algorithmic engine at 09-15
        # (sunrise-tithi rule; classical practice actually uses the
        # MADHYAHNA/midday-prevailing tithi for this specific festival, a
        # documented simplification — see tests/test_festivals.py). The two
        # tags may render as adjacent-day entries instead of one merged row;
        # that's a real government-date-vs-computed-date difference, not a
        # bug.
        ("09-14", "Vinayagar Chaturthi", "tamilnadu_govt"),
        ("10-19", "Ayudha Pooja", "hindu"),
        ("10-19", "Ayudha Pooja", "tamilnadu_govt"),
        ("10-20", "Vijayadasami", "hindu"),
        ("10-20", "Vijayadasami", "indian_govt"),
        ("10-20", "Vijayadasami", "tamilnadu_govt"),
        ("11-08", "Deepavali", "indian_govt"),
        ("11-08", "Deepavali", "tamilnadu_govt"),
        # Hindu — Ekadashis, Puthandu, Aadi Perukku, Krishna Jayanthi (hindu
        # tag), Vinayagar Chaturthi (hindu tag), Deepavali (hindu tag),
        # Karthigai Deepam now all computed algorithmically (WI-12,
        # Doctrine §8) — see _recurring_tithi_festivals. Parity against this
        # 2026 list verified in tests/test_festivals.py, including 4
        # explained exceptions (2 pre-existing hardcode date errors here
        # corrected by the engine, 1 Smarta-vs-Vaishnava divergence, 1
        # documented tithi-kshaya gap).
        # Other Hindu / Indian gazetted / Tamil Nadu public holidays
        ("03-04", "Holi", "hindu"),
        ("03-04", "Holi", "indian_govt"),
        ("03-19", "Ugadi (Telugu New Year)", "hindu"),
        ("03-19", "Ugadi (Telugu New Year)", "tamilnadu_govt"),
        ("03-26", "Ram Navami", "hindu"),
        ("03-26", "Ram Navami", "indian_govt"),
        ("03-31", "Mahavir Jayanti", "hindu"),
        ("03-31", "Mahavir Jayanti", "indian_govt"),
        ("03-31", "Mahavir Jayanti", "tamilnadu_govt"),
        ("04-01", "Annual Closing of Bank Accounts", "tamilnadu_govt"),
        ("05-01", "Buddha Purnima", "indian_govt"),
        ("11-24", "Guru Nanak's Birthday", "indian_govt"),
        # Muslim 2026
        ("02-19", "Ramzan Begins", "muslim"),
        ("03-21", "Eid ul-Fitr (Ramazan)", "muslim"),
        ("03-21", "Eid ul-Fitr (Ramazan)", "indian_govt"),
        ("03-21", "Eid ul-Fitr (Ramazan)", "tamilnadu_govt"),
        ("05-27", "Bakrid (Eid al-Adha)", "indian_govt"),
        ("05-28", "Bakrid (Eid al-Adha)", "muslim"),
        ("05-28", "Bakrid (Eid al-Adha)", "tamilnadu_govt"),
        ("06-26", "Muharram", "muslim"),
        ("06-26", "Muharram", "indian_govt"),
        ("06-26", "Muharram", "tamilnadu_govt"),
        ("08-26", "Milad-un-Nabi", "muslim"),
        ("08-26", "Milad-un-Nabi", "indian_govt"),
        ("08-26", "Milad-un-Nabi", "tamilnadu_govt"),
        # Christian 2026
        ("04-03", "Good Friday", "christian"),
        ("04-03", "Good Friday", "indian_govt"),
        ("04-03", "Good Friday", "tamilnadu_govt"),
        ("04-05", "Easter Sunday", "christian"),
    ],
    2025: [
        # Hindu
        ("01-13", "Bhogi", "hindu"),
        ("01-14", "Thai Pongal / Makar Sankranti", "hindu"),
        ("01-15", "Mattu Pongal", "hindu"),
        ("01-16", "Kaanum Pongal", "hindu"),
        ("04-14", "Tamil New Year (Puthandu)", "hindu"),
        ("08-03", "Aadi Perukku", "hindu"),
        ("08-16", "Krishna Jayanthi", "hindu"),
        ("08-27", "Vinayagar Chaturthi", "hindu"),
        ("10-02", "Vijaya Dasami", "hindu"),
        ("10-20", "Deepavali", "hindu"),
        ("12-04", "Karthigai Deepam", "hindu"),
        # Muslim 2025
        ("03-01", "Ramzan begins", "muslim"),
        ("03-30", "Eid ul-Fitr (Ramazan)", "muslim"),
        ("06-06", "Eid ul-Adha (Bakrid)", "muslim"),
        ("06-27", "Muharram", "muslim"),
        ("09-04", "Milad-un-Nabi", "muslim"),
        # Christian 2025
        ("04-18", "Good Friday", "christian"),
        ("04-20", "Easter Sunday", "christian"),
        # Other
        ("03-19", "Ugadi (Telugu New Year)", "hindu"),
        ("03-14", "Mahavir Jayanti", "hindu"),
    ],
}

#: Years for which the gazetted/administrative rows above exist (`PAN-17`).
#:
#: Two engines produce festival rows and they do NOT have the same reach. The
#: tithi/nakshatra/solar-month rules below are algorithmic and answer for any
#: year. `_YEARLY_FESTIVALS` is a transcription of government holiday gazettes
#: plus a few dates that are administrative records rather than calculations,
#: and it only covers the years named here. Outside that range the calendar
#: returns the algorithmic set and no gazetted rows — thinner, never wrong.
#:
#: Naming the boundary as a constant is what lets a caller disclose it and lets
#: `tests/test_rulebook_invariants.py` assert the published rulebook still
#: states the truth. Extend this the same commit you extend `_YEARLY_FESTIVALS`.
GAZETTED_FESTIVAL_YEARS: frozenset[int] = frozenset(_YEARLY_FESTIVALS)


def gazetted_coverage_bounds() -> tuple[int, int]:
    """First and last year for which gazetted festival rows exist."""
    return min(GAZETTED_FESTIVAL_YEARS), max(GAZETTED_FESTIVAL_YEARS)


def has_gazetted_coverage(year: int) -> bool:
    """Whether `year` has government/administrative festival rows on file.

    A caller rendering a calendar for a year outside coverage should say so
    rather than let the reader infer that a month genuinely has no festivals.
    """
    return year in GAZETTED_FESTIVAL_YEARS


# ---------------------------------------------------------------------------
# Selection rules and when they fire (rulings 2026-10-22 round two, §0.1).
#
# Three first-round defects shared one cause: a tie-break implemented as a
# filter, running in years with nothing to break a tie between. Every rule
# below that can move or choose a day says when it fires, and records each
# firing, so the audit (scripts/audit/yearly_observances_scan.py) can count
# the years each one actually fired. A tie-break firing in more than a handful
# of years is a bug report, not a result. Mirrored, with confidence tags, in
# docs/DOCTRINE_DECISIONS_V1.md §8.1.
# ---------------------------------------------------------------------------
SELECTION_RULES: dict[str, str] = {
    "solar_month.duplicate_tie_break": (
        "FIRES WHEN: a star (or special tithi) is named on two days of one Tamil solar month "
        "EFFECT: the one in the amanta month that begins inside the solar month "
        "OTHERWISE: dormant; the single day stands"
    ),
    "solar_month.full_moon_tie_break": (
        "FIRES WHEN: a Family A star is named on two days of its solar month "
        "EFFECT: the one beside the solar month's own full moon (held pending OPEN-3) "
        "OTHERWISE: dormant; the single day stands"
    ),
    "kala.sunrise_fallback": (
        "FIRES WHEN: a sunset-kala star holds no sunset "
        "EFFECT: the day it holds at sunrise (§0.3 universal fallback) "
        "OTHERWISE: dormant; the pradosham day stands"
    ),
    "contained.names_day": (
        "FIRES WHEN: a star or tithi holds no kala instant and no sunrise "
        "EFFECT: the sunrise-to-sunrise day containing it (§5; names the day only) "
        "OTHERWISE: dormant"
    ),
    "aparahna.two_aparahnas_first": (
        "FIRES WHEN: the tithi holds two aparahnas "
        "EFFECT: the first (§6) "
        "OTHERWISE: dormant; the one aparahna day stands"
    ),
    "aparahna.none_sunrise_fallback": (
        "FIRES WHEN: the tithi holds no aparahna "
        "EFFECT: the tithi at sunrise, first of two (§6) "
        "OTHERWISE: dormant"
    ),
    "jayanthi.rohini_tie_break": (
        "FIRES WHEN: Krishna Ashtami holds two nisheethas, or none "
        "EFFECT: the night with Rohini at nisheetha; if neither, the later (§2) "
        "OTHERWISE: dormant; the one Ashtami night stands"
    ),
    "sankatahara.two_moonrises_later": (
        "FIRES WHEN: Krishna Chaturthi holds two moonrises EFFECT: the later (FCA-04) OTHERWISE: dormant"
    ),
    "sankatahara.no_moonrise_sunrise": (
        "FIRES WHEN: Krishna Chaturthi holds no moonrise EFFECT: the sunrise-Chaturthi day (FCA-04) "
        "OTHERWISE: dormant"
    ),
    "varalakshmi.pournami_is_friday": (
        "FIRES WHEN: Shravana's Pournami day is a Friday EFFECT: that Friday (§9.1) "
        "OTHERWISE: dormant; the last Friday before it"
    ),
}

_rule_sink: ContextVar[list[str] | None] = ContextVar("festival_rule_sink", default=None)


@contextmanager
def rule_fires() -> Iterator[list[str]]:
    """Collect the `SELECTION_RULES` that fire while festivals are computed.

    For the audit's per-rule fire count (§0.1); production never opens one,
    so recording costs one context-variable read.
    """
    sink: list[str] = []
    token = _rule_sink.set(sink)
    try:
        yield sink
    finally:
        _rule_sink.reset(token)


def _fired(rule: str) -> None:
    sink = _rule_sink.get()
    if sink is not None:
        sink.append(rule)


# ---------------------------------------------------------------------------
# Nakshatra-based festivals (nakshatra name → festival) — every year
# ---------------------------------------------------------------------------
_NAKSHATRA_FESTIVALS: dict[str, str] = {
    "THIRUVONAM": "Thiruvonam Vratam",
    "ROHINI":     "Rohini Vratam",
    # WI-12 (2026-07-16): was "KRITHIGAI", which never matched the canonical
    # nakshatra spelling used everywhere else in this codebase (constants/
    # astrology.py, nakshatra_content.py) — this row silently never fired.
    "KARTHIGAI":  "Karthigai Vratam",
}

# FCA-04 — which instant names a star day. Measured against the owner-supplied
# 2027 almanac (scripts/audit/almanac_2027_vs_engine.py): Karthigai vratam is
# the star at SUNSET (13/13; the sunrise star matched 7/13 and was always a day
# late), while Thiruvonam vratam is the star at SUNRISE (13/13; sunset 8/13).
# Two observance classes, two instants — recorded as that almanac's practice,
# for the astrologer to confirm, not as the other reading being wrong. Rohini
# has no almanac row to measure and stays on sunrise.
_SUNSET_STAR_VRATAMS = frozenset({"KARTHIGAI"})


@dataclass(frozen=True, slots=True)
class NisheethaNight:
    """One night, at its nisheetha (§2): the tithi and star then — the
    computation — and the two civil dates it could be printed on — the label.
    Kept as separate fields so the label rule can change without touching
    the computation."""

    tithi_number: int
    nakshatra_name: str
    evening_date: date  # the civil date of the sunset that opens the night
    nisheetha_date: date  # the civil date of the nisheetha instant


@dataclass(frozen=True, slots=True)
class ObservanceInstants:
    """Panchangam values read at instants other than this day's sunrise.

    Every field is optional. A missing value never falls back to the sunrise
    value: the observance that needs it is omitted (thinner, never wrong) or,
    for the "previous" fields, the first-of-two dedup is simply skipped.

    * ``sunset_nakshatra_name`` / ``previous_sunset_nakshatra_name`` — the star
      at this and the previous civil day's sunset (Karthigai vratam).
    * ``previous_sunrise_nakshatra_name`` — the star at the previous sunrise. A
      star spanning two sunrises is observed on the first (the almanac lists
      one Thiruvonam day where the sunrise rule found two).
    * ``moonrise_tithi_number`` (+ the previous and next day's) — the tithi
      at moonrise. Sankatahara Chaturthi is a chandrodaya vrata: the fast ends
      at moonrise, so Krishna Chaturthi must hold then. The sunrise rule
      matched the 2027 almanac 5/12; see ``_is_sankatahara_day``.
    * ``previous_nishita_tithi_number`` — the tithi at the previous midnight,
      so a Chaturdashi holding two midnights names one Sivarathiri, the first.
    """

    sunset_nakshatra_name: str | None = None
    previous_sunset_nakshatra_name: str | None = None
    previous_sunrise_nakshatra_name: str | None = None
    moonrise_tithi_number: int | None = None
    previous_moonrise_tithi_number: int | None = None
    next_moonrise_tithi_number: int | None = None
    previous_nishita_tithi_number: int | None = None
    # FCA-07 — the yearly observances that existed only as 2026 rows.
    previous_sunrise_tithi_number: int | None = None
    # The next sunrise's tithi: a tithi holding neither sunrise is kshaya.
    next_sunrise_tithi_number: int | None = None
    # Midpoint of aparahna, the fourth fifth of daytime. Ayudha Pooja and
    # Vijayadasami are aparahna observances: the 2027 almanac prints Ayudha
    # Pooja on 8 Oct, when Navami holds the afternoon, though the sunrise
    # tithi is still Ashtami (the 2026 rows show the same pattern).
    aparahna_tithi_number: int | None = None
    # Whether this is the last civil day of its Tamil month (Bhogi is the last
    # day of Margazhi, the eve of Thai 1).
    tamil_month_ends_today: bool = False
    # Ruling 2026-10-22 Q6 — tharpanam is the Amavasai at aparahna; the
    # neighbours' aparahna settle "two aparahnas" and "none".
    previous_aparahna_tithi_number: int | None = None
    next_aparahna_tithi_number: int | None = None
    # Krishna Jayanthi (§2) — the four nights opening on the evenings of this
    # day -2, -1, 0 and +1. The night is judged at nisheetha (true midnight,
    # the midpoint of sunset to sunrise); the label goes on the civil date of
    # that instant, which can be this day or the one before.
    nisheetha_nights: tuple[NisheethaNight, ...] = ()
    # A star that holds no sunrise (it begins and ends between this sunrise and
    # the next) is contained in this day (§5).
    kshaya_nakshatra_name: str | None = None
    # §3 — the solar-month observances (`SOLAR_MONTH_OBSERVANCES`) whose day
    # is this one, decided over the whole solar month by
    # `observance_days.select_in_solar_month`; and those whose duplicate
    # tie-break fired to choose it.
    solar_month_observances: frozenset[str] = frozenset()
    solar_month_tie_breaks: frozenset[str] = frozenset()
    # (name, how its day was named: observance_days.NamedBy), so the month
    # resolver's fallbacks are counted by the audit like the day rules' (§0.1).
    solar_month_named_by: frozenset[tuple[str, str]] = frozenset()
    # §9.1 — civil days from this one to the printed Pournami (sunrise rule)
    # that follows it. Computed for Fridays in the bright fortnight only.
    days_until_pournami_day: int | None = None


_KRISHNA_CHATURTHI = 19


def _is_sankatahara_day(sunrise_tithi_number: int, instants: ObservanceInstants) -> bool:
    """Krishna Chaturthi at moonrise, with the almanac's two tie-breaks (FCA-04).

    The 2027 almanac settles both edge cases a moonrise rule meets:

    * Chaturthi holds **two** moonrises (23 and 24 May 2027) — the almanac
      takes the later day.
    * Chaturthi holds **neither** (it began after the 23 Feb moonrise and
      ended before the 24 Feb one) — the almanac takes the day Chaturthi rules
      at sunrise.

    With both, this matches the almanac 12/12. Derived from those two rows and
    recorded as that almanac's convention for the astrologer to confirm. With a
    neighbour's moonrise unknown, the tie-break is skipped, not guessed.
    """
    today = instants.moonrise_tithi_number
    if today == _KRISHNA_CHATURTHI:
        if instants.next_moonrise_tithi_number == _KRISHNA_CHATURTHI:
            return False
        if instants.previous_moonrise_tithi_number == _KRISHNA_CHATURTHI:
            _fired("sankatahara.two_moonrises_later")
        return True
    named = (
        sunrise_tithi_number == _KRISHNA_CHATURTHI
        and today is not None
        and instants.previous_moonrise_tithi_number is not None
        and instants.previous_moonrise_tithi_number != _KRISHNA_CHATURTHI
    )
    if named:
        _fired("sankatahara.no_moonrise_sunrise")
    return named


_KRISHNA_ASHTAMI = 23


def _jayanthi_night_selected(before: NisheethaNight, tonight: NisheethaNight, after: NisheethaNight) -> bool:
    """Whether `tonight` is the Krishna Jayanthi night (§2, CLASSICAL).

    Krishna Ashtami at nisheetha. When Ashtami holds two nisheethas, or none
    (it begins after one and ends before the next), the two nights bracketing
    it compete: the one with Rohini at nisheetha wins; if Rohini is at
    neither, the later. "Later" in both branches. Rohini at *both* is not
    ruled and takes the later night, the same default as neither.
    """
    rohini_tonight = tonight.nakshatra_name.upper() == "ROHINI"
    if tonight.tithi_number == _KRISHNA_ASHTAMI and _KRISHNA_ASHTAMI not in (before.tithi_number, after.tithi_number):
        return True
    # Tonight is the EARLIER of a competing pair: wins only on Rohini alone.
    if (tonight.tithi_number == after.tithi_number == _KRISHNA_ASHTAMI) or (
        tonight.tithi_number < _KRISHNA_ASHTAMI < after.tithi_number
    ):
        won = rohini_tonight and after.nakshatra_name.upper() != "ROHINI"
    # Tonight is the LATER of a pair: wins unless the earlier has Rohini alone.
    elif (tonight.tithi_number == before.tithi_number == _KRISHNA_ASHTAMI) or (
        before.tithi_number < _KRISHNA_ASHTAMI < tonight.tithi_number
    ):
        won = not (before.nakshatra_name.upper() == "ROHINI" and not rohini_tonight)
    else:
        return False
    if won:
        _fired("jayanthi.rohini_tie_break")
    return won


#: Which civil date prints the Jayanthi night — HELD (§2 / OPEN-1). §2 rules
#: the date of the nisheetha instant ("nisheetha_date": 24->25 Aug 2027 prints
#: 25 Aug). Against its own 2023-2033 acceptance vectors that matches 3 of 11;
#: the evening that opens the night (the label before round two) matches 8,
#: and the day Ashtami holds at sunrise 7; every vector is one of the last two
#: and no one rule gives all eleven (scripts/audit/jayanthi_label_scan.py).
#: The nisheetha label would also move 2026 off the 4 Sep government holiday.
#: Held at the evening until the astrologer answers.
_JAYANTHI_LABEL: Literal["evening_date", "nisheetha_date"] = "evening_date"


def _is_krishna_jayanthi(day: date, instants: ObservanceInstants) -> bool:
    """Krishna Jayanthi is printed on `day` (§2).

    The night is chosen by `_jayanthi_night_selected` (the computation); the
    printed date is `_JAYANTHI_LABEL` of that night (the label). Under the
    nisheetha label either middle night can land on `day`, since nisheetha
    falls after 00:00 at Chennai and before it further east.
    """
    nights = instants.nisheetha_nights
    if len(nights) != 4:
        return False
    return any(
        getattr(nights[i], _JAYANTHI_LABEL) == day
        and _jayanthi_night_selected(nights[i - 1], nights[i], nights[i + 1])
        for i in (1, 2)
    )


def _aparahna_names_day(tithi: int, sunrise_names_day: bool, instants: ObservanceInstants) -> bool:
    """`tithi` at aparahna names this day (§6, CONVENTION) — the kala of
    tharpanam, Ayudha Pooja and Vijayadasami.

    Two aparahnas: the first — the kala was satisfied twice, which is not a
    failed check; taking the first keeps Ayudha Pooja and Vijayadasami on
    consecutive days. No aparahna: the tithi at sunrise, `sunrise_names_day`
    (Vijayadasami 2022, when Dasami held no afternoon). Unknown neighbours
    omit the observance.
    """
    today = instants.aparahna_tithi_number
    before, after = instants.previous_aparahna_tithi_number, instants.next_aparahna_tithi_number
    if today is None or before is None or after is None:
        return False
    if today == tithi:
        if before == tithi:
            return False
        if after == tithi:
            _fired("aparahna.two_aparahnas_first")
        return True
    if tithi in (before, after):
        return False
    if sunrise_names_day:
        _fired("aparahna.none_sunrise_fallback")
    return sunrise_names_day


def _sunrise_names_tithi_day(tithi: int, sunrise_tithi: int, instants: ObservanceInstants) -> bool:
    """`tithi` at sunrise, first of two; a kshaya tithi names the day it falls
    in (§5) — the rule `panchangam.special_tithi_day_from_sunrises` applies to
    the Amavasai and Pournami (Q6)."""
    before, after = instants.previous_sunrise_tithi_number, instants.next_sunrise_tithi_number
    if sunrise_tithi == tithi:
        return before is not None and before != tithi
    contained = sunrise_tithi == tithi - 1 and after == tithi + 1
    if contained:
        _fired("contained.names_day")
    return contained


def _is_tharpanam_amavasai(special_tithi_day_number: int | None, instants: ObservanceInstants) -> bool:
    """The Amavasai of tharpanam and pitru karya: the one at aparahna (ruling Q6).

    Tharpanam is performed in aparahna, so aparahna names the day — which is
    why the 2027 almanac gives Mahalaya on 29 Sep while printing the monthly
    Amavasai on 30 Sep.
    """
    return _aparahna_names_day(30, special_tithi_day_number == 30, instants)


def _sunset_star_names_day(star: str, sunrise_star: str, instants: ObservanceInstants) -> bool:
    """`star` at pradosham names the day, first of two sunsets (§0.3) — the
    Karthigai vratam, and with it Karthigai Deepam (§4).

    If the star holds no sunset (4 Dec 2025: Krittika began after the 3 Dec
    sunset and ended before the 4 Dec one), the universal fallback: the day it
    holds at sunrise, first of two; and a star holding no sunrise either is
    the day that contains it (§5).
    """
    if instants.sunset_nakshatra_name is None or instants.previous_sunset_nakshatra_name is None:
        return False
    if instants.sunset_nakshatra_name.upper() == star:
        return instants.previous_sunset_nakshatra_name.upper() != star
    if instants.previous_sunset_nakshatra_name.upper() == star:
        return False
    if (instants.kshaya_nakshatra_name or "").upper() == star:
        _fired("contained.names_day")
        return True
    # Holding neither neighbouring sunset, a star at this sunrise holds no
    # other sunrise either: the first of two is automatic.
    if sunrise_star == star:
        _fired("kala.sunrise_fallback")
        return True
    return False

# ---------------------------------------------------------------------------
# Tamil solar month indices (matching tamil_calendar.TAMIL_MONTHS ordering:
# 0=Chithirai .. 11=Panguni). Named here so the recurring-festival rules below
# read naturally without importing the full Tamil calendar module.
# ---------------------------------------------------------------------------
_MONTH_CHITHIRAI = 0
_MONTH_VAIKASI = 1
_MONTH_AADI = 3
_MONTH_AAVANI = 4
_MONTH_PURATTASI = 5
_MONTH_AIPPASI = 6
_MONTH_KARTHIGAI = 7
_MONTH_MARGAZHI = 8
_MONTH_THAI = 9
_MONTH_MAASI = 10
_MONTH_PANGUNI = 11

_WEEKDAY_TUESDAY = "TUESDAY"
_WEEKDAY_SATURDAY = "SATURDAY"

# ---------------------------------------------------------------------------
# Amanta lunar month indices (app/calculations/lunar_month.py: 0=Chaitra ..
# 11=Phalguna). FCA-01: the festivals below that are named by a LUNAR month
# key on these, never on the solar Tamil month — a solar month can hold a
# given tithi zero, one or two times. Duplicated as plain ints, like the solar
# indices above, so this module stays free of ephemeris imports.
# ---------------------------------------------------------------------------
_LUNAR_SHRAVANA = 4
_LUNAR_BHADRAPADA = 5
_LUNAR_ASHVINA = 6
_LUNAR_KARTIKA = 7
_LUNAR_MAGHA = 10

@dataclass(frozen=True, slots=True)
class SolarMonthObservance:
    """A yearly observance named by a star (or special tithi) in one Tamil
    solar month. Its day is decided over the whole month, not day by day:
    `observance_days.select_in_solar_month` names each occurrence's day by
    `kala` (§0.3) and breaks a duplicate by `tie_break` (§3)."""

    name: str
    tamil_month: int
    kind: Literal["star", "tithi"]
    value: str | int
    kala: Literal["sunrise", "sunset", "aparahna"]
    # "lunar_month" is §3. "full_moon_month" is the Family A proximity test,
    # gated behind the duplicate check (§9.3) and held until OPEN-3 is
    # answered: under §3, six Family A dates in 2020-2045 move
    # (scripts/audit/solar_month_tiebreak_scan.py), and the ruling asks for
    # those to be reported before the proximity test is deleted.
    tie_break: Literal["lunar_month", "full_moon_month"] = "lunar_month"


#: Rulings 2026-10-22, round two, §3/§4. Family A (Thai Poosam .. Arudra) are
#: the stars opposite the month's Sun, at sunrise, the generic kala.
#: Karthigai Deepam is the Karthigai month's Karthigai vratam (§4) and Aadi
#: Krithigai the Aadi month's (OPEN-2: the 2023-2033 vectors fit sunrise
#: 10/11 and pradosham 4/11 -- pradosham is what §0.3 rules and is kept).
#: Tharpanam Amavasais are at aparahna (§6).
SOLAR_MONTH_OBSERVANCES: tuple[SolarMonthObservance, ...] = (
    SolarMonthObservance("Thai Poosam", _MONTH_THAI, "star", "POOSAM", "sunrise", "full_moon_month"),
    SolarMonthObservance("Maasi Magam", _MONTH_MAASI, "star", "MAGAM", "sunrise", "full_moon_month"),
    SolarMonthObservance("Panguni Uthiram", _MONTH_PANGUNI, "star", "UTHIRAM", "sunrise", "full_moon_month"),
    SolarMonthObservance("Vaigasi Visakam", _MONTH_VAIKASI, "star", "VISAKAM", "sunrise", "full_moon_month"),
    SolarMonthObservance("Arudra Darisanam", _MONTH_MARGAZHI, "star", "THIRUVATHIRAI", "sunrise", "full_moon_month"),
    SolarMonthObservance("Thiru Aadi Pooram", _MONTH_AADI, "star", "POORAM", "sunrise"),
    SolarMonthObservance("Aadi Krithigai", _MONTH_AADI, "star", "KARTHIGAI", "sunset"),
    SolarMonthObservance("Karthigai Deepam", _MONTH_KARTHIGAI, "star", "KARTHIGAI", "sunset"),
    SolarMonthObservance("Aadi Amavasai", _MONTH_AADI, "tithi", 30, "aparahna"),
    SolarMonthObservance("Thai Amavasai", _MONTH_THAI, "tithi", 30, "aparahna"),
)


def _recurring_tithi_festivals(
    tithi_number: int,
    tithi_paksha: str,
    nakshatra_name: str,
    weekday: str | None,
    tamil_month_index: int | None,
    special_tithi_day_number: int | None,
    pradhosham_tithi_number: int | None = None,
    nishita_tithi_number: int | None = None,
    tamil_day_of_month: int | None = None,
    previous_day_tithi_number: int | None = None,
    previous_day_tithi_paksha: str | None = None,
    lunar_month_index: int | None = None,
    lunar_month_is_adhika: bool = False,
    amavasai_lunar_month_index: int | None = None,
    amavasai_lunar_month_is_adhika: bool = False,
    instants: ObservanceInstants | None = None,
    day: date | None = None,
) -> list[dict]:
    """Recurring festivals defined by tithi/paksha/weekday/Tamil-month/nakshatra
    combinations rather than fixed Gregorian dates — these recur every lunar
    month (or every year on the matching Tamil-month occurrence) and so must
    be derived from the day's panchangam state, not looked up by date.

    Most observances follow the udaya (sunrise) tithi passed in ``tithi_number``.
    Pradhosam is the exception: it is a twilight/sunset vrata, so it is dated from
    ``pradhosham_tithi_number`` (the tithi at pradhosha-kalam), falling back to the
    sunrise tithi only when that is unavailable (issue #10).

    Sivarathiri is likewise a nishita (midnight) vrata, dated from
    ``nishita_tithi_number`` (the tithi at nishita-kalam), falling back to the
    sunrise tithi only when that is unavailable (M-2).

    ``previous_day_tithi_number``/``previous_day_tithi_paksha`` (WI-12) are the
    prior civil day's own sunrise tithi/paksha — needed only for the Ekadashi
    two-consecutive-sunrise dedup below. Omit them (default None) to skip that
    dedup, which just means an unusually long Ekadashi tithi could be labeled
    on both sunrises it governs, instead of only the first (Smarta rule).

    ``lunar_month_index``/``lunar_month_is_adhika`` (FCA-01) are the amanta
    lunar month in force at sunrise; ``amavasai_lunar_month_index`` and its flag
    are the lunation the day's dominant Amavasai closes (see
    ``lunar_month.amavasai_month_for_day``). The lunar-month festivals —
    Vinayagar Chaturthi, Skanda Sashti, Sivarathiri, Deepavali, Mahalaya
    Amavasai and Krishna Jayanthi — fire only
    when the lunar month is supplied and is not adhika. Omitting it makes the
    calendar thinner, never wrong: the solar-month rule they used before is
    known to misdate 16 festival-years in 2020-2045.
    """
    results: list[dict] = []

    def in_lunar_month(month: int) -> bool:
        return lunar_month_index == month and not lunar_month_is_adhika

    instants = instants or ObservanceInstants()
    tithi_in_paksha = tithi_number if tithi_number <= 15 else tithi_number - 15

    # Pradhosam — trayodashi (13th tithi) of either paksha, judged at pradhosha-kalam
    # (sunset). On Saturdays the specific observance name replaces the generic one to
    # avoid duplicate UI rows for the same vrata.
    pradhosham_tithi = pradhosham_tithi_number or tithi_number
    pradhosham_in_paksha = pradhosham_tithi if pradhosham_tithi <= 15 else pradhosham_tithi - 15
    if pradhosham_in_paksha == 13:
        if weekday == _WEEKDAY_SATURDAY:
            results.append({"name": "Sani Pradhosam", "category": "hindu"})
        else:
            results.append({"name": "Pradhosam", "category": "hindu"})

    # Ekadashi (Doctrine §8, WI-12): 11th tithi of either paksha at today's Hindu
    # sunrise (Smarta reckoning). Dashami-viddha rejection needs no extra code
    # under the pure udaya rule: a day whose sunrise tithi is still Dashami (10)
    # is simply not Ekadashi here, regardless of what tithi runs later that day —
    # whatever the NEXT day's own sunrise tithi turns out to be governs that next
    # day, via this same rule applied to it. The one case that DOES need extra
    # state: when Ekadashi is unusually long and governs two sunrises in a row,
    # Smarta takes only the FIRST — so suppress today's label if yesterday's
    # sunrise tithi (same paksha) was already 11.
    if tithi_in_paksha == 11:
        previous_in_paksha = None
        if previous_day_tithi_number is not None:
            previous_in_paksha = (
                previous_day_tithi_number if previous_day_tithi_number <= 15 else previous_day_tithi_number - 15
            )
        already_observed_yesterday = (
            previous_in_paksha == 11 and previous_day_tithi_paksha == tithi_paksha
        )
        if not already_observed_yesterday:
            if tithi_paksha == "SHUKLA" and tamil_month_index == _MONTH_MARGAZHI:
                # The one Puranic name doctrine calls out explicitly; the other
                # 23 Ekadashis/year keep a generic paksha-qualified name below —
                # a full lunar-month-keyed name table is a documented follow-up,
                # not required to close the "silent 2027" regression this WI
                # exists to fix.
                results.append({"name": "Vaikunta Ekadashi", "category": "hindu"})
            else:
                ekadashi_name = "Ekadashi (Shukla)" if tithi_paksha == "SHUKLA" else "Ekadashi (Krishna)"
                results.append({"name": ekadashi_name, "category": "hindu"})

    # Chathurthi (4th tithi). Every Krishna-paksha Chaturthi is Sankatahara
    # Chaturthi (monthly Ganesha vrata) — WI-12 fix: previously only the Tuesday
    # occurrence was labeled at all (ordinary Krishna Chaturthi fell through to
    # the bare "Chathurthi" name); the Tuesday occurrence is additionally the
    # highest-merit "Angarki" variant, not the only occasion that counts.
    #
    # Sankatahara is judged at MOONRISE, not sunrise (FCA-04 — see
    # ObservanceInstants). Krishna Chaturthi = tithi 19.
    if _is_sankatahara_day(tithi_number, instants):
        if weekday == _WEEKDAY_TUESDAY:
            results.append({"name": "Angarki Sankatahara Chaturthi", "category": "hindu"})
        else:
            results.append({"name": "Sankatahara Chaturthi", "category": "hindu"})
    # The monthly Chathurthi is Shukla Chaturthi at sunrise, the first of two;
    # a Chaturthi holding no sunrise names the day it falls in (§5). Before
    # that, a kshaya Chaturthi named no day: 2026 had 10 against the
    # almanac's 12 (Apr, Jul).
    if _sunrise_names_tithi_day(4, tithi_number, instants):
        results.append({"name": "Chathurthi", "category": "hindu"})
    if tithi_in_paksha == 4 and tithi_paksha == "SHUKLA":
        # Bhadrapada Shukla Chaturthi (FCA-01). It was "Shukla Chaturthi in
        # solar Aavani", which named 20 Aug 2023 when Tamil Nadu observed
        # 18 Sep (G.O. 528).
        if in_lunar_month(_LUNAR_BHADRAPADA):
            results.append({"name": "Vinayagar Chaturthi", "category": "hindu"})

    # Sashti — 6th tithi, Shukla paksha (Skanda Sashti tradition). The flagship
    # Skanda Sashti (L-13) is the Sashti after Deepavali's new moon — Kartika
    # Shukla Sashti (FCA-01). Tamil calendars call it the Aippasi Sashti because
    # it usually falls in solar Aippasi, but keying on solar Aippasi put it a
    # month early in 5 years of 2020-2045 and dropped it entirely in 2031.
    if tithi_in_paksha == 6 and tithi_paksha == "SHUKLA":
        results.append({"name": "Sashti", "category": "hindu"})
        if in_lunar_month(_LUNAR_KARTIKA):
            results.append({"name": "Skanda Sashti", "category": "hindu"})

    # Theipirai Ashtami — 8th tithi, Krishna paksha (waning-fortnight Ashtami).
    if tithi_in_paksha == 8 and tithi_paksha == "KRISHNA":
        results.append({"name": "Theipirai Ashtami", "category": "hindu"})
    # Krishna Jayanthi — Gokulashtami: Krishna Ashtami of the lunar month
    # Shravana, at true midnight (ruling 2026-10-22 Q1; §2 of round two). It
    # replaced Sri Jayanthi (the Krishna Ashtami of solar Aavani) and the
    # switch between the two. Tamil Nadu kept 11-12 Aug 2020 while the Sun was
    # still in Katakam, a date the solar reckoning cannot reach; and a lunar
    # month holds one Krishna Ashtami, where solar Aavani 2033 held two. The
    # lunar month is the printed day's; the new moon is a week from either
    # date the night could be printed on.
    if in_lunar_month(_LUNAR_SHRAVANA) and day is not None and _is_krishna_jayanthi(day, instants):
        results.append({"name": "Krishna Jayanthi", "category": "hindu"})

    # Sivarathiri — Magha Krishna Chaturdashi (FCA-01; was "Krishna
    # Chaturdashi in solar Maasi", which named 13 Mar 2029 for an 11 Feb
    # festival and labelled 2037 twice), judged at nishita-kalam (local
    # midnight), not the sunrise tithi (M-2): Krishna Chaturdashi is defined by
    # the tithi prevailing at midnight, and on the true vrata day the sunrise
    # tithi is usually still Trayodashi. The lunar month is the one in force at
    # sunrise — no new moon can fall between that sunrise and a midnight that
    # still reads Chaturdashi.
    nishita_tithi = nishita_tithi_number or tithi_number
    nishita_in_paksha = nishita_tithi if nishita_tithi <= 15 else nishita_tithi - 15
    nishita_paksha = "SHUKLA" if nishita_tithi <= 15 else "KRISHNA"
    #
    # Every other month's Krishna Chaturdashi at nishita is Masa Sivarathiri
    # (FCA-07: it was not computed at all; the 2027 almanac lists all 13, and
    # this rule reproduces 13/13). A Chaturdashi holding two midnights names
    # one Sivarathiri — the first, as the almanac does.
    repeated_midnight = instants.previous_nishita_tithi_number == 29
    if nishita_in_paksha == 14 and nishita_paksha == "KRISHNA" and not repeated_midnight:
        if in_lunar_month(_LUNAR_MAGHA):
            results.append({"name": "Sivarathiri", "category": "hindu"})
        else:
            results.append({"name": "Masa Sivarathiri", "category": "hindu"})

    # Deepavali (TN) — Ashvina Krishna Chaturdashi (Naraka Chaturdashi), the
    # day before the new moon that opens Kartika. FCA-01: was "Krishna
    # Chaturdashi in solar Aippasi", which gave 2028 a second, false Deepavali
    # on 15 Nov.
    # Simplification (documented, not guessed): observed classically at the
    # tithi prevailing shortly before dawn specifically (abhyanga snanam),
    # not necessarily the udaya tithi; this function uses the same
    # udaya-only convention as every other tithi rule here rather than
    # modeling a separate pre-dawn instant. Named plain "Deepavali" (not
    # "...Naraka Chaturdashi") so it dedupes by name with the govt-holiday
    # hardcode rows for the same date instead of rendering as two rows.
    if tithi_in_paksha == 14 and tithi_paksha == "KRISHNA" and in_lunar_month(_LUNAR_ASHVINA):
        results.append({"name": "Deepavali", "category": "hindu"})

    # Festivals anchored to the dominant Pournami (15) / Amavasai (30) day —
    # gated on special_tithi_day_number so they fire only on the civil day
    # where that tithi actually dominates, not on adjacent spillover days.
    #
    # F-FES-01 — these three were all AND-gated on "the star AND the full moon
    # fall on the same civil day", which is the exact bug class L-14 fixed for
    # Karthigai Deepam below: in a year where the two split across two days the
    # festival silently disappeared. Each is now keyed on its own rule.
    #
    # **Chitra Pournami is the Chithirai-month Pournami, whatever the star.**
    # It used to test `nk_upper == "CHITHIRAI"` — the Chitra *nakshatra* — and
    # never checked the Tamil month at all, so it could fire on a Chitra-star
    # full moon in any month and miss the Chithirai full moon it is named for.
    if special_tithi_day_number == 15 and tamil_month_index == _MONTH_CHITHIRAI:
        results.append({"name": "Chitra Pournami", "category": "hindu"})

    # Solar-month star and tharpanam observances (§3, §4): decided over the
    # whole month by the service, which passes the ones that fall today. One
    # day a year each: never both occurrences of a duplicated star. Neither
    # AND-gates on the Pournami *day* (the L-14 / F-FES-01 defect).
    named_by = dict(instants.solar_month_named_by)
    for observance in SOLAR_MONTH_OBSERVANCES:
        if observance.name in instants.solar_month_observances:
            if observance.name in instants.solar_month_tie_breaks:
                _fired(
                    "solar_month.duplicate_tie_break"
                    if observance.tie_break == "lunar_month"
                    else "solar_month.full_moon_tie_break"
                )
            how = named_by.get(observance.name)
            if how == "contained":
                _fired("contained.names_day")
            elif how == "sunrise":
                _fired("aparahna.none_sunrise_fallback" if observance.kala == "aparahna" else "kala.sunrise_fallback")
            elif how == "kala_two" and observance.kala == "aparahna":
                _fired("aparahna.two_aparahnas_first")
            results.append({"name": observance.name, "category": "hindu"})

    results.extend(_yearly_observances(
        tithi_number, weekday, tamil_month_index, tamil_day_of_month, in_lunar_month, instants,
    ))

    # Mahalaya Amavasai closes Pitru Paksha — the Amavasai that ends Bhadrapada
    # (FCA-01). Solar Purattasi held two Amavasais in 2020 and 2039, and the
    # old rule labelled both. A tharpanam day, so dated at aparahna (Q6).
    if (
        _is_tharpanam_amavasai(special_tithi_day_number, instants)
        and amavasai_lunar_month_index == _LUNAR_BHADRAPADA
        and not amavasai_lunar_month_is_adhika
    ):
        results.append({"name": "Mahalaya Amavasai", "category": "hindu"})

    # Solar-day yearly festivals (fixed Tamil-month + day-of-month, not
    # tithi-anchored) — need the Tamil calendar day-of-month, not just month.
    if tamil_day_of_month is not None:
        if tamil_month_index == _MONTH_CHITHIRAI and tamil_day_of_month == 1:
            results.append({"name": "Puthandu (Tamil New Year)", "category": "hindu"})
        if tamil_month_index == _MONTH_THAI and tamil_day_of_month == 1:
            results.append({"name": "Thai Pongal", "category": "hindu"})
        if tamil_month_index == _MONTH_AADI and tamil_day_of_month == 18:
            results.append({"name": "Aadi Perukku", "category": "hindu"})

    return results


def _yearly_observances(
    tithi_number: int,
    weekday: str | None,
    tamil_month_index: int | None,
    tamil_day_of_month: int | None,
    in_lunar_month,
    instants: ObservanceInstants,
) -> list[dict]:
    """FCA-07 — yearly observances that existed only as 2026 data rows.

    `app/data/calendar_categories_2026.py` was the only source for these, so
    every one of them vanished from every calendar on 1 Jan 2027. Each is now a
    rule, named exactly as the 2026 rows name it so the two dedupe, and checked
    against the owner-supplied 2027 almanac and the 2026 rows
    (tests/test_festivals.py). Solar-month observances key on the solar month,
    lunar ones on the amanta month — the FCA-01 distinction.
    """
    results: list[dict] = []

    # Pongal week, from Thai 1 (which stays in _recurring_tithi_festivals).
    if tamil_month_index == _MONTH_MARGAZHI and instants.tamil_month_ends_today:
        results.append({"name": "Bhogi", "category": "hindu"})
    if tamil_month_index == _MONTH_THAI and tamil_day_of_month == 2:
        results.append({"name": "Mattu Pongal", "category": "hindu"})
    if tamil_month_index == _MONTH_THAI and tamil_day_of_month == 3:
        results.append({"name": "Kaanum Pongal", "category": "hindu"})

    # Thai and Aadi Amavasai, Aadi Pooram and Aadi Krithigai are solar-month
    # observances: see SOLAR_MONTH_OBSERVANCES.

    # Navarathiri — lunar Ashvina. It begins on the first sunrise of the
    # month: Prathama at sunrise (Dvitiya if Prathama was kshaya) with the
    # previous sunrise still in the dark fortnight.
    if (
        in_lunar_month(_LUNAR_ASHVINA)
        and tithi_number in (1, 2)
        and instants.previous_sunrise_tithi_number in (29, 30)
    ):
        results.append({"name": "Navarathiri Begins", "category": "hindu"})
    if in_lunar_month(_LUNAR_ASHVINA) and _aparahna_names_day(
        9, _sunrise_names_tithi_day(9, tithi_number, instants), instants
    ):
        results.append({"name": "Saraswathi Poojai", "category": "hindu"})
        results.append({"name": "Ayudha Pooja", "category": "hindu"})
    if in_lunar_month(_LUNAR_ASHVINA) and _aparahna_names_day(
        10, _sunrise_names_tithi_day(10, tithi_number, instants), instants
    ):
        results.append({"name": "Vijayadasami", "category": "hindu"})

    # Varalakshmi Vratham (§9.1, CLASSICAL) — the last Friday before the
    # Pournami of Shravana (Tamil "Aavani"), or the Pournami itself if that
    # day is a Friday. The old window, "a Friday with Shukla 8..14 at sunrise",
    # admitted two Fridays in 2025 (1 and 8 Aug). The Pournami day is the
    # printed one (sunrise rule, Q6). This moves 2026 from the curated 21 Aug
    # to Friday 28 Aug, the Pournami itself -- reported, not hidden.
    days_to_pournami = instants.days_until_pournami_day
    if (
        in_lunar_month(_LUNAR_SHRAVANA)
        and weekday == "FRIDAY"
        and days_to_pournami is not None
        and 0 <= days_to_pournami <= 6
    ):
        if days_to_pournami == 0:
            _fired("varalakshmi.pournami_is_friday")
        results.append({"name": "Varalakshmi Vratham", "category": "hindu"})

    return results


def get_festivals_for_date(
    d: date,
    tithi_number: int,
    tithi_paksha: str,
    nakshatra_name: str,
    weekday: str | None = None,
    tamil_month_index: int | None = None,
    special_tithi_day_number: int | None = None,
    pradhosham_tithi_number: int | None = None,
    nishita_tithi_number: int | None = None,
    tamil_day_of_month: int | None = None,
    previous_day_tithi_number: int | None = None,
    previous_day_tithi_paksha: str | None = None,
    lunar_month_index: int | None = None,
    lunar_month_is_adhika: bool = False,
    amavasai_lunar_month_index: int | None = None,
    amavasai_lunar_month_is_adhika: bool = False,
    instants: ObservanceInstants | None = None,
) -> list[dict]:
    """Return list of {name, category} dicts for the given date + panchangam state."""
    results: list[dict] = []
    mmdd = d.strftime("%m-%d")
    weekday = weekday or d.strftime("%A").upper()

    # Fixed every year
    for fixed_mmdd, name, cat in _FIXED_FESTIVALS:
        if fixed_mmdd == mmdd:
            results.append({"name": name, "category": cat})

    # Year-specific
    for md, name, cat in _YEARLY_FESTIVALS.get(d.year, []):
        if md == mmdd:
            results.append({"name": name, "category": cat})

    # Curated category-page events. These also feed the signed-in dashboard so
    # public SEO lists and the product calendar show the same named days.
    for event in category_events_for_date(d):
        category = event.tags[0] if event.tags else "observance"
        results.append({"name": event.name_en, "category": category, "tags": list(event.tags)})

    # Nakshatra-based — each at its own instant (FCA-04), first of two days.
    # A sunset vratam whose star holds no sunset falls back to sunrise (§0.3).
    nk_upper = nakshatra_name.upper()
    star_instants = instants or ObservanceInstants()
    for nk_key, name in _NAKSHATRA_FESTIVALS.items():
        if nk_key in _SUNSET_STAR_VRATAMS:
            named = _sunset_star_names_day(nk_key, nk_upper, star_instants)
        else:
            previous = (star_instants.previous_sunrise_nakshatra_name or "").upper()
            named = nk_upper == nk_key and previous != nk_key
        if named:
            results.append({"name": name, "category": "hindu"})

    # Recurring tithi/paksha/weekday/Tamil-month combinations
    results.extend(
        _recurring_tithi_festivals(
            tithi_number,
            tithi_paksha,
            nakshatra_name,
            weekday,
            tamil_month_index,
            special_tithi_day_number,
            pradhosham_tithi_number,
            nishita_tithi_number,
            tamil_day_of_month,
            previous_day_tithi_number,
            previous_day_tithi_paksha,
            lunar_month_index=lunar_month_index,
            lunar_month_is_adhika=lunar_month_is_adhika,
            amavasai_lunar_month_index=amavasai_lunar_month_index,
            amavasai_lunar_month_is_adhika=amavasai_lunar_month_is_adhika,
            instants=instants,
            day=d,
        )
    )

    # World / international observance days
    for obs_mmdd, name in _WORLD_OBSERVANCES:
        if obs_mmdd == mmdd:
            results.append({"name": name, "category": "observance"})

    # Deduplicate by name while preserving all category tags. A festival can
    # also be a government holiday, so callers need more than one label.
    deduped_by_name: dict[str, dict] = {}
    for item in results:
        name = item["name"]
        category = "indian_govt" if item["category"] == "govt" else item["category"]
        tags = [
            "indian_govt" if tag == "govt" else tag
            for tag in item.get("tags", [category])
        ]
        existing = deduped_by_name.get(name)
        if existing is None:
            existing = {"name": name, "category": category, "tags": []}
            deduped_by_name[name] = existing
        elif category == "hindu":
            # WI-12 (2026-07-16): a religious-calendar tag is more specific
            # than a govt-holiday tag for the same festival name — prefer it
            # as the primary category regardless of arrival order. Matters
            # now that the algorithmic engine's "hindu" rows are appended
            # after the fixed/yearly govt rows for several dates (Thai
            # Poosam, Krishna Jayanthi, Deepavali) where "hindu" used to be
            # listed first in the removed hardcode.
            existing["category"] = "hindu"
        for tag in tags:
            if tag not in existing["tags"]:
                existing["tags"].append(tag)

    return list(deduped_by_name.values())
