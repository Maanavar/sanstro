"""WI-12 (festival rules engine, Doctrine §8) parity-gate tests.

Locks the algorithmic engine's 2026 output against the (still-present, about
to be trimmed) hardcoded Hindu entries in `_YEARLY_FESTIVALS[2026]`, and
proves the engine produces a non-empty 2027 festival set — the actual
regression ("silent 2027 failure") this WI exists to prevent.

Every mismatch found during the parity check is explained here, not silently
absorbed. Of the 24 hardcoded 2026 Ekadashi dates, 20 are reproduced by the
engine exactly; 4 are not, for three distinct, verified reasons:

- **2026-05-27 (Padmini Ekadashi):** tithi 11 (Shukla Ekadashi) spans BOTH
  2026-05-26 and 2026-05-27's sunrises (a long tithi). Smarta reckoning takes
  only the FIRST (05-26) — Doctrine §8's explicit rule. The hardcode's 05-27
  reads as sourced from a generic pan-Indian/Vaishnava-leaning Ekadashi list
  (Puranic names like Padmini are Vaishnava-tradition names for the
  Adhik-Maas Ekadashi), which commonly takes the second day in this exact
  scenario. This is the doctrine-mandated Smarta-vs-Vaishnava divergence,
  not a bug — see Doctrine §8's dependencies note.
- **2026-11-20 (Devutthana Ekadashi) and 2026-12-05 (Utpanna Ekadashi):**
  verified against the raw tithi timeline — neither date's sunrise tithi is
  actually 11 (11-20 is Dashami/10; 12-05 is Dvadashi/12). The true Ekadashi
  day in each case is one day away (11-21, 12-04 respectively) and IS found
  by the engine. These two hardcoded dates predate this session and appear
  to have simply been wrong.
- **2026-07-10 (Yogini Ekadashi) — genuine, documented gap:** tithi 11
  (Krishna Ekadashi) is entirely "kshaya" this cycle — elided between
  2026-07-10's sunrise (tithi 10) and 2026-07-11's sunrise (tithi 12),
  never governing any civil day's sunrise at all. This is a general
  characteristic of the pure-udaya-tithi convention this whole module uses
  (verified: 17 such skip events occur across all tithis in 2026, roughly
  one every three weeks) — it affects Sashti/Ashtami/Chaturthi identically
  and isn't new to this WI. Doctrine §8 doesn't specify a kshaya-tithi rule,
  and fabricating one wasn't in scope; tracked as a follow-up open question
  rather than silently guessed. See test_yogini_ekadashi_kshaya_tithi_gap_
  is_a_known_limitation below.

Also, two other WI-12 discrepancies with the pre-existing hardcode, verified
independently rather than assumed:
- **Thai Pongal:** engine says 2026-01-14, hardcode says 2026-01-15. The
  Makar Sankranti crossing instant for 2026 is 2026-01-14 15:07 IST — hours
  before that day's sunset under EITHER the old or new (WI-07) sunset
  definition — so this is not a WI-07-driven shift; the hardcode's 01-15
  appears to have simply been wrong.
- **Vinayagar Chaturthi:** engine says 2026-09-15, hardcode says 2026-09-14.
  Ganesh Chaturthi is classically observed on the day Chaturthi prevails at
  MADHYAHNA (midday), not sunrise — a documented simplification here (this
  function uses the same sunrise-only convention as every other tithi rule
  in it, matching Doctrine §9's precedent of labeling known simplifications
  rather than silently modeling a separate midday instant).
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.lunar_month import (
    LUNAR_BHADRAPADA,
    LUNAR_KARTIKA,
    LUNAR_SHRAVANA,
    amanta_month_at,
)
from app.calculations.tamil_calendar import tamil_solar_date
from app.services.panchangam_cache import calculate_daily_panchangam
from app.services.panchangam_service import _build_festivals

pytestmark = pytest.mark.no_db

CHENNAI = (13.0827, 80.2707, "Asia/Kolkata")

# The 24 dates that were hardcoded as Ekadashi in _YEARLY_FESTIVALS[2026]
# before WI-12 deleted that block (captured literally here, not derived from
# the now-algorithmic source, so this parity lock survives the deletion).
_HARDCODED_2026_EKADASHI_DATES = [
    "01-14", "01-29", "02-13", "02-27", "03-15", "03-29", "04-13", "04-27",
    "05-13", "05-27", "06-11", "06-25", "07-10", "07-25", "08-09", "08-23",
    "09-07", "09-22", "10-06", "10-22", "11-05", "11-20", "12-05", "12-20",
]
# The 4 exceptions, each explained in the module docstring above. Excluded
# from the blanket "engine reproduces hardcode" parametrized test below and
# covered individually instead.
_EKADASHI_EXCEPTIONS = {"05-27", "07-10", "11-20", "12-05"}
_CLEAN_MATCH_EKADASHI_DATES = [
    mmdd for mmdd in _HARDCODED_2026_EKADASHI_DATES if mmdd not in _EKADASHI_EXCEPTIONS
]


def _festival_names_for(d: date, *, previous_day: date | None = None) -> set[str]:
    """Through the service's own builder, so the Tamil solar date AND the
    amanta lunar month (FCA-01) are derived exactly as production derives
    them — a hand-assembled argument list here would hide a missing input."""
    snap = calculate_daily_panchangam(d, *CHENNAI)
    prev_snap = calculate_daily_panchangam(previous_day, *CHENNAI) if previous_day else None
    festivals = _build_festivals(snap, previous_day_snapshot=prev_snap)
    return {f.name for f in festivals if f.category == "hindu"}


def _days_named(festival: str, start: date, end: date) -> list[date]:
    found, day = [], start
    while day <= end:
        if festival in _festival_names_for(day):
            found.append(day)
        day += timedelta(days=1)
    return found


@pytest.mark.parametrize("mmdd", _CLEAN_MATCH_EKADASHI_DATES)
def test_hardcoded_2026_ekadashi_dates_reproduced_by_engine(mmdd: str) -> None:
    """20 of the 24 hardcoded dates — the 4 exceptions are covered by their
    own tests below, each with a verified explanation, not asserted here."""
    month, day = (int(x) for x in mmdd.split("-"))
    d = date(2026, month, day)
    prev = date(2026, month, day - 1) if day > 1 else None
    names = _festival_names_for(d, previous_day=prev)
    assert any("Ekadashi" in n for n in names), f"{mmdd}: engine did not find Ekadashi (names={names})"


def test_two_consecutive_sunrise_ekadashi_smarta_takes_the_first() -> None:
    """2026-05-26 and 2026-05-27 both have tithi 11 (Shukla Ekadashi) at
    sunrise (a long tithi spanning both) — Smarta takes only the first."""
    names_26 = _festival_names_for(date(2026, 5, 26), previous_day=date(2026, 5, 25))
    names_27 = _festival_names_for(date(2026, 5, 27), previous_day=date(2026, 5, 26))
    assert any("Ekadashi" in n for n in names_26)
    assert not any("Ekadashi" in n for n in names_27)


def test_hardcoded_nov20_dec05_ekadashi_dates_were_actually_wrong() -> None:
    """Neither hardcoded date's sunrise tithi is really 11 — verified via the
    raw tithi timeline. The true Ekadashi day in each case is adjacent and
    IS found by the engine."""
    assert not any("Ekadashi" in n for n in _festival_names_for(date(2026, 11, 20)))
    names_21 = _festival_names_for(date(2026, 11, 21), previous_day=date(2026, 11, 20))
    assert any("Ekadashi" in n for n in names_21)

    assert not any("Ekadashi" in n for n in _festival_names_for(date(2026, 12, 5)))
    names_04 = _festival_names_for(date(2026, 12, 4), previous_day=date(2026, 12, 3))
    assert any("Ekadashi" in n for n in names_04)


def test_yogini_ekadashi_kshaya_tithi_gap_is_a_known_limitation() -> None:
    """2026-07-10 (hardcoded 'Yogini Ekadashi'): tithi 11 is elided between
    both adjacent sunrises this cycle (tithi 10 at 07-10's sunrise, tithi 12
    at 07-11's) — a general, pre-existing characteristic of every
    udaya-tithi rule in this module (not new to Ekadashi), not modeled by
    Doctrine §8. Documented gap, not silently hidden — see module docstring
    and the astrologer-queue follow-up."""
    assert not any("Ekadashi" in n for n in _festival_names_for(date(2026, 7, 10)))
    assert not any("Ekadashi" in n for n in _festival_names_for(date(2026, 7, 11), previous_day=date(2026, 7, 10)))


def test_vaikunta_ekadashi_named_instance_in_margazhi() -> None:
    names = _festival_names_for(date(2026, 12, 20), previous_day=date(2026, 12, 19))
    assert "Vaikunta Ekadashi" in names


def test_puthandu_tamil_new_year() -> None:
    assert "Puthandu (Tamil New Year)" in _festival_names_for(date(2026, 4, 14))


def test_thai_pongal_2026_is_the_published_15_january() -> None:
    """Owner ruling 2026-10-22 (FCA-08): Thai 1, 2026 = 15 Jan, the Tamil Nadu
    Pongal holiday. The sunset rule gives 14 Jan (Makara sankranti 15:07 IST
    on the 14th, before sunset); the ruling overrides it, and the whole week
    follows: Bhogi 14, Pongal 15, Mattu 16, Kaanum 17. This test used to pin
    the rule's 14 Jan and call the gazetted 15 Jan "wrong"."""
    week = {
        "Bhogi": date(2026, 1, 14),
        "Thai Pongal": date(2026, 1, 15),
        "Mattu Pongal": date(2026, 1, 16),
        "Kaanum Pongal": date(2026, 1, 17),
    }
    for name, expected in week.items():
        assert _days_named(name, date(2026, 1, 10), date(2026, 1, 20)) == [expected], name


def test_aadi_perukku() -> None:
    assert "Aadi Perukku" in _festival_names_for(date(2026, 8, 3))


def test_thai_poosam() -> None:
    assert "Thai Poosam" in _festival_names_for(date(2026, 2, 1))


def test_vinayagar_chaturthi_2026_is_sep_15_madhyahna_vs_udaya_explained() -> None:
    assert "Vinayagar Chaturthi" in _festival_names_for(date(2026, 9, 15))


def test_krishna_jayanthi() -> None:
    assert "Krishna Jayanthi" in _festival_names_for(date(2026, 9, 4))


def test_deepavali_named_plainly_to_dedupe_with_govt_holiday_rows() -> None:
    assert "Deepavali" in _festival_names_for(date(2026, 11, 8))


def test_karthigai_deepam() -> None:
    assert "Karthigai Deepam" in _festival_names_for(date(2026, 11, 24))


def test_l13_kartika_shukla_sashti_is_named_skanda_sashti() -> None:
    """L-13 + FCA-01: the flagship Sashti is Kartika Shukla Sashti (the one
    after Deepavali's new moon). Tamil calendars call it the Aippasi Sashti, but
    the solar month is not what decides it."""
    from app.calculations.festivals import _MONTH_AIPPASI, _recurring_tithi_festivals

    results = _recurring_tithi_festivals(
        6, "SHUKLA", "ROHINI", "MONDAY", _MONTH_AIPPASI, None, lunar_month_index=LUNAR_KARTIKA
    )
    names = {r["name"] for r in results}
    assert "Sashti" in names
    assert "Skanda Sashti" in names


def test_l13_solar_aippasi_alone_no_longer_names_skanda_sashti() -> None:
    """The FCA-01 defect as a unit: a Shukla Sashti in solar Aippasi whose
    lunar month is Ashvina is an ordinary Sashti (2023-10-20 was this day)."""
    from app.calculations.festivals import _MONTH_AIPPASI, _recurring_tithi_festivals

    results = _recurring_tithi_festivals(
        6, "SHUKLA", "ROHINI", "MONDAY", _MONTH_AIPPASI, None, lunar_month_index=LUNAR_KARTIKA - 1
    )
    names = {r["name"] for r in results}
    assert "Sashti" in names
    assert "Skanda Sashti" not in names


def test_adhika_lunar_month_carries_no_festival() -> None:
    """A lunation with no sankranti takes the next month's name and carries no
    festival — the festival falls in the nija month that follows."""
    from app.calculations.festivals import _recurring_tithi_festivals

    nija = _recurring_tithi_festivals(
        4, "SHUKLA", "ROHINI", "MONDAY", None, None, lunar_month_index=LUNAR_BHADRAPADA
    )
    adhika = _recurring_tithi_festivals(
        4, "SHUKLA", "ROHINI", "MONDAY", None, None,
        lunar_month_index=LUNAR_BHADRAPADA, lunar_month_is_adhika=True,
    )
    assert "Vinayagar Chaturthi" in {r["name"] for r in nija}
    assert "Vinayagar Chaturthi" not in {r["name"] for r in adhika}


def test_lunar_festivals_need_the_lunar_month_and_never_guess_it() -> None:
    """Without a lunar month the lunar festivals are omitted — thinner, never
    the solar-month guess that misdated 16 festival-years."""
    from app.calculations.festivals import _MONTH_AAVANI, _recurring_tithi_festivals

    results = _recurring_tithi_festivals(4, "SHUKLA", "ROHINI", "MONDAY", _MONTH_AAVANI, None)
    assert "Vinayagar Chaturthi" not in {r["name"] for r in results}


def test_l14_karthigai_deepam_fires_off_the_pournami_day() -> None:
    """L-14: Deepam once also required the Pournami civil day, and silently
    skipped years where the two split. In 2027 Krittika holds the 11 Dec
    sunset and the Pournami day is the 13th: Deepam is still the 11th."""
    assert calculate_daily_panchangam(date(2027, 12, 13), *CHENNAI).special_tithi_day_number == 15
    assert _days_named("Karthigai Deepam", date(2027, 12, 8), date(2027, 12, 15)) == [date(2027, 12, 11)]


def test_sankatahara_chaturthi_fires_every_krishna_chaturthi_not_only_tuesday() -> None:
    """WI-12 fix: previously only the Tuesday occurrence was labeled at all.
    FCA-04: judged at moonrise, so the instant is supplied."""
    from app.calculations.festivals import ObservanceInstants, _recurring_tithi_festivals

    at_moonrise = ObservanceInstants(moonrise_tithi_number=19, next_moonrise_tithi_number=20)
    non_tuesday = _recurring_tithi_festivals(19, "KRISHNA", "ROHINI", "MONDAY", None, None, instants=at_moonrise)
    tuesday = _recurring_tithi_festivals(19, "KRISHNA", "ROHINI", "TUESDAY", None, None, instants=at_moonrise)
    assert any(r["name"] == "Sankatahara Chaturthi" for r in non_tuesday)
    assert any(r["name"] == "Angarki Sankatahara Chaturthi" for r in tuesday)


def test_karthigai_vratam_nakshatra_spelling_fixed() -> None:
    """Was 'KRITHIGAI' in _NAKSHATRA_FESTIVALS, which never matched the
    canonical 'KARTHIGAI' spelling used everywhere else in this codebase
    (app/constants/astrology.py, nakshatra_content.py) — the row silently
    never fired. Fixed alongside the WI-12 yearly-rules work."""
    from app.calculations.festivals import _NAKSHATRA_FESTIVALS

    assert "KARTHIGAI" in _NAKSHATRA_FESTIVALS
    assert "KRITHIGAI" not in _NAKSHATRA_FESTIVALS


def test_sivarathiri_2026_matches_nishita_not_sunrise_tithi() -> None:
    """M-2: Sivarathiri (Krishna Chaturdashi) is a nishita (midnight) vrata,
    not a sunrise-tithi one. Astrologer-curated docs/calendar_categories_2026.py
    has "Maha Sivarathiri" on 2026-02-15; the old sunrise-tithi rule instead
    fires a day late, on 2026-02-16 (verified: sunrise tithi on 02-15 is still
    Trayodashi/13, only reaching Chaturdashi/14 at 02-16's sunrise, while the
    nishita tithi already reads Chaturdashi/14 on 02-15's midnight)."""
    assert "Sivarathiri" in _festival_names_for(date(2026, 2, 15))
    assert "Sivarathiri" not in _festival_names_for(date(2026, 2, 16))


def test_2027_produces_nonempty_hindu_festivals() -> None:
    """The actual regression this WI exists to prevent: _YEARLY_FESTIVALS has
    no 2027 entry at all, so before this WI the Hindu festival list for any
    2027 date was silently empty. Spot-check a spread of 2027 dates."""
    sample_dates = [
        date(2027, 1, 15), date(2027, 3, 1), date(2027, 6, 15),
        date(2027, 9, 1), date(2027, 11, 15), date(2027, 12, 25),
    ]
    any_named_festival = any(_festival_names_for(d) for d in sample_dates)
    assert any_named_festival, "2027 produced zero Hindu festivals across the sample — regression"


# ── F-FES-01 — the Pournami AND-gate (ground-truth audit 2026-10-13) ────────
#
# Chitra Pournami, Maasi Magam and Panguni Uthiram each required the star and
# the full moon to land on the same civil day. In a year where the two split
# the festival silently disappeared — the exact bug class L-14 fixed for
# Karthigai Deepam. Chitra Pournami had a second fault: it tested the Chitra
# *nakshatra* and never checked the Tamil month it is named for.

@pytest.mark.parametrize("year", [2026, 2027])
@pytest.mark.parametrize(
    ("festival", "month_window"),
    [
        ("Chitra Pournami", ((4, 10), (5, 20))),
        ("Maasi Magam", ((2, 10), (3, 20))),
        ("Panguni Uthiram", ((3, 10), (4, 20))),
    ],
)
def test_pournami_anchored_festival_appears_every_year(
    year: int, festival: str, month_window: tuple[tuple[int, int], tuple[int, int]]
) -> None:
    """Each must fire at least once a year. Asserted as "it happens at all"
    rather than on a fixed date: the date moves with the ephemeris, but a
    festival vanishing entirely is the failure this guards."""
    (m1, d1), (m2, d2) = month_window
    day, end = date(year, m1, d1), date(year, m2, d2)
    found: list[date] = []
    while day <= end:
        if festival in _festival_names_for(day):
            found.append(day)
        day += timedelta(days=1)
    assert found, f"{festival} did not occur anywhere in {year}"


def test_chitra_pournami_is_the_chithirai_full_moon_not_the_chitra_star() -> None:
    """The specific inversion. It is the Pournami of the Chithirai month,
    whatever star that day carries — the old rule checked the star and never
    the month, so it could fire in any month and miss the one it is named
    for."""
    from app.calculations.festivals import _MONTH_CHITHIRAI

    day, end = date(2026, 4, 10), date(2026, 5, 20)
    hits: list[date] = []
    while day <= end:
        if "Chitra Pournami" in _festival_names_for(day):
            hits.append(day)
        day += timedelta(days=1)

    assert hits, "Chitra Pournami did not occur in 2026"
    for hit in hits:
        snap = calculate_daily_panchangam(hit, *CHENNAI)
        month_index, _ = tamil_solar_date(hit, CHENNAI[2], CHENNAI[0], CHENNAI[1])
        assert month_index == _MONTH_CHITHIRAI, f"{hit} is not in Chithirai"
        assert snap.special_tithi_day_number == 15, f"{hit} is not the dominant Pournami"


# ── FCA-01 — lunar festivals are named by the amanta month ──────────────────
#
# docs/FULL_CODEBASE_AUDIT_2026-10-22.md. Each pin below is a year the old
# solar-month rule got wrong. The 26-year gate is
# scripts/audit/festival_lunar_month_scan.py; these keep the cases it found.


def test_amanta_month_names_and_adhika() -> None:
    """2023 carried an adhika Shravana (new moons ~17 Jul and ~16 Aug): the
    Sun stayed in Karkata across the whole lunation."""
    from datetime import UTC, datetime

    in_adhika = amanta_month_at(utc_datetime_to_julian_day(datetime(2023, 8, 1, 6, tzinfo=UTC)))
    assert (in_adhika.name, in_adhika.is_adhika) == ("SHRAVANA", True)
    nija = amanta_month_at(utc_datetime_to_julian_day(datetime(2023, 8, 25, 6, tzinfo=UTC)))
    assert (nija.index, nija.is_adhika) == (LUNAR_SHRAVANA, False)


def test_vinayagar_chaturthi_2023_is_in_september_not_august() -> None:
    """Old rule: 20 Aug 2023 (Shukla Chaturthi of solar Aavani — but that
    lunation was adhika Shravana). Tamil Nadu observed 18 Sep (G.O. 528); the
    sunrise rule gives 19 Sep, one day from the madhyahna date — the kala gap
    the audit names, not a month."""
    assert _days_named("Vinayagar Chaturthi", date(2023, 8, 1), date(2023, 9, 30)) == [date(2023, 9, 19)]


def test_skanda_sashti_2023_follows_deepavali_not_precedes_it() -> None:
    assert _days_named("Skanda Sashti", date(2023, 10, 1), date(2023, 11, 30)) == [date(2023, 11, 19)]


def test_deepavali_2028_happens_once() -> None:
    """The old rule added a false second Deepavali on 15 Nov 2028."""
    assert _days_named("Deepavali", date(2028, 10, 1), date(2028, 11, 30)) == [date(2028, 10, 17)]


def test_maha_sivarathiri_2029_is_in_february() -> None:
    """Old rule: 13 Mar 2029. Magha Krishna Chaturdashi is 11 Feb."""
    assert _days_named("Sivarathiri", date(2029, 2, 1), date(2029, 3, 31)) == [date(2029, 2, 11)]


@pytest.mark.parametrize(
    ("festival", "expected"),
    [
        # The owner-supplied 2027 almanac ("Tamil Dates 2027").
        ("Sivarathiri", date(2027, 3, 6)),
        ("Vinayagar Chaturthi", date(2027, 9, 4)),
        ("Mahalaya Amavasai", date(2027, 9, 29)),
        ("Deepavali", date(2027, 10, 28)),
        ("Skanda Sashti", date(2027, 11, 4)),
    ],
)
def test_2027_lunar_festivals_match_the_published_almanac(festival: str, expected: date) -> None:
    window = timedelta(days=40)
    assert _days_named(festival, expected - window, expected + window) == [expected]


# ── FCA-04 — each observance at its own instant ─────────────────────────────
#
# Measured against the owner-supplied 2027 almanac by
# scripts/audit/almanac_2027_vs_engine.py: Karthigai 13/13 (sunrise rule
# 7/13), Sankatahara 12/13 -> 12/12 (sunrise rule 5/12), Masa Sivarathiri
# 13/13, Thiruvonam 13/13. Pins below are the days the old rules got wrong.


@pytest.mark.parametrize(
    ("expected", "old_rule_day"),
    [(date(2027, 3, 13), date(2027, 3, 14)), (date(2027, 12, 11), date(2027, 12, 12))],
)
def test_karthigai_vratam_is_the_star_at_sunset(expected: date, old_rule_day: date) -> None:
    assert "Karthigai Vratam" in _festival_names_for(expected)
    assert "Karthigai Vratam" not in _festival_names_for(old_rule_day)


def test_karthigai_deepam_is_krittika_at_pradosham() -> None:
    """Ruling Q2: Deepam is Krittika with the Karthigai full moon, the lamp lit
    at pradosham — not a sunrise-star exception. In 2027 Krittika holds the
    11 Dec sunset and not the 12th's, so Deepam is 11 Dec. The almanac prints
    12 Dec (its sunrise star); the ruling is followed and the date is queued
    back to the astrologer (docs/REVIEW_REQUESTS_2026-10-22.md)."""
    assert _days_named("Karthigai Deepam", date(2027, 11, 17), date(2027, 12, 20)) == [date(2027, 12, 11)]


def test_karthigai_deepam_falls_back_to_sunrise_when_krittika_holds_no_sunset() -> None:
    """2025: Krittika began after the 3 Dec sunset and ended before the 4 Dec
    one. The failed kala falls back to the sunrise star (ruling Q3's general
    principle): 4 Dec, the 2025 row."""
    assert _days_named("Karthigai Deepam", date(2025, 11, 17), date(2025, 12, 15)) == [date(2025, 12, 4)]


@pytest.mark.parametrize(
    ("expected", "other"),
    [
        (date(2027, 8, 20), date(2027, 8, 21)),  # Chaturthi holds only the 20th's moonrise
        (date(2027, 5, 24), date(2027, 5, 23)),  # holds both moonrises: the later day
        (date(2027, 2, 24), date(2027, 2, 23)),  # holds neither: the sunrise-Chaturthi day
    ],
)
def test_sankatahara_is_judged_at_moonrise(expected: date, other: date) -> None:
    def sankatahara(d: date) -> bool:
        return any("Sankatahara" in n for n in _festival_names_for(d))

    assert sankatahara(expected)
    assert not sankatahara(other)


def test_masa_sivarathiri_is_computed_and_named_once() -> None:
    """FCA-07: not computed at all before. Krishna Chaturdashi at nishita, and a
    Chaturdashi holding two midnights names the first (25 Dec 2027, not 26)."""
    assert _days_named("Masa Sivarathiri", date(2027, 12, 20), date(2027, 12, 31)) == [date(2027, 12, 25)]
    # Magha's is Maha Sivarathiri, not a second row.
    assert "Masa Sivarathiri" not in _festival_names_for(date(2027, 3, 6))


def test_a_star_spanning_two_sunrises_names_the_first() -> None:
    """Thiruvonam holds the 12 and 13 Sep 2027 sunrises; the almanac lists 12."""
    assert _days_named("Thiruvonam Vratam", date(2027, 9, 10), date(2027, 9, 15)) == [date(2027, 9, 12)]


# ── FCA-07 — yearly observances that existed only as 2026 rows ──────────────
#
# Each vanished from every calendar on 1 Jan 2027. Pinned to the owner-supplied
# 2027 almanac; the 2026-2028 gate is scripts/audit/yearly_observances_scan.py.


@pytest.mark.parametrize(
    ("observance", "expected"),
    [
        ("Bhogi", date(2027, 1, 14)),
        ("Thai Pongal", date(2027, 1, 15)),
        ("Mattu Pongal", date(2027, 1, 16)),
        ("Kaanum Pongal", date(2027, 1, 17)),
        ("Thai Amavasai", date(2027, 2, 6)),
        ("Aadi Krithigai", date(2027, 7, 28)),
        ("Aadi Amavasai", date(2027, 8, 2)),
        ("Thiru Aadi Pooram", date(2027, 8, 5)),
        ("Varalakshmi Vratham", date(2027, 8, 13)),
        ("Ayudha Pooja", date(2027, 10, 8)),
        ("Vijayadasami", date(2027, 10, 9)),
    ],
)
def test_2027_yearly_observances_match_the_published_almanac(observance: str, expected: date) -> None:
    window = timedelta(days=12)
    assert _days_named(observance, expected - window, expected + window) == [expected]


def test_ayudha_pooja_is_navami_at_aparahna_not_at_sunrise() -> None:
    """8 Oct 2027 still has Ashtami at sunrise; Navami holds the afternoon."""
    snap = calculate_daily_panchangam(date(2027, 10, 8), *CHENNAI)
    assert snap.tithi_number == 8
    assert "Ayudha Pooja" in _festival_names_for(date(2027, 10, 8))


def test_varalakshmi_is_the_last_friday_before_the_pournami() -> None:
    """§9.1: 2025's Pournami day is Saturday 9 Aug, so the 8th — not also the
    1st, which the old "Friday with Shukla 8..14 at sunrise" window let in."""
    assert _days_named("Varalakshmi Vratham", date(2025, 7, 25), date(2025, 8, 20)) == [date(2025, 8, 8)]


def test_varalakshmi_is_the_pournami_itself_when_that_is_a_friday() -> None:
    """§9.1's second branch, as a unit: 28 Aug 2026 was a Friday Pournami. In
    production 2026 also carries the curated 21 Aug row, which the ruling
    contradicts (reported to the astrologer)."""
    from app.calculations.festivals import ObservanceInstants, _recurring_tithi_festivals

    def varalakshmi(days_to_pournami: int) -> bool:
        results = _recurring_tithi_festivals(
            15, "SHUKLA", "SADAYAM", "FRIDAY", None, 15, lunar_month_index=LUNAR_SHRAVANA,
            instants=ObservanceInstants(days_until_pournami_day=days_to_pournami),
        )
        return any(r["name"] == "Varalakshmi Vratham" for r in results)

    assert varalakshmi(0) and varalakshmi(6)
    assert not varalakshmi(7)


# ── Astrologer rulings 2026-10-22 (docs/REVIEW_REQUESTS_2026-10-22.md) ──────
#
# The 26-year gate is scripts/audit/yearly_observances_scan.py; these pin the
# cases each ruling changed.


def test_krishna_jayanthi_is_gokulashtami_at_true_midnight() -> None:
    """Q1: the Krishna Ashtami of lunar Shravana at nisheetha. 2020 is the
    ruling's own proof: Tamil Nadu kept 11-12 Aug while the Sun was still in
    Katakam; the old solar-Aavani rule gave 10 Sep."""
    assert _days_named("Krishna Jayanthi", date(2020, 8, 1), date(2020, 9, 30)) == [date(2020, 8, 11)]


def test_krishna_jayanthi_label_is_held_at_the_evening_that_opens_the_night() -> None:
    """2027: Ashtami holds the nisheetha of 24->25 Aug (00:11 on the 25th).
    §2 rules the printed date to be the 25th; that rule matched 3 of its own
    11 acceptance vectors and the evening label 8, so the label is held at the
    evening (`festivals._JAYANTHI_LABEL`) until the astrologer answers. Both
    dates are carried; switching the label moves 2027 to the 25th."""
    from app.calculations import festivals

    assert festivals._JAYANTHI_LABEL == "evening_date"
    assert _days_named("Krishna Jayanthi", date(2027, 8, 1), date(2027, 9, 30)) == [date(2027, 8, 24)]


def test_krishna_jayanthi_nisheetha_label_names_the_civil_date_of_the_instant(monkeypatch) -> None:
    """§2's label, kept working behind the held switch: the 2027 night prints
    as 25 Aug, and the 2028 one as 14 Aug (its vector is the 13th). In 2026
    it would print 5 Sep, off the 4 Sep government holiday — not asserted
    here because the curated 2026 row prints 4 Sep regardless."""
    from app.calculations import festivals

    monkeypatch.setattr(festivals, "_JAYANTHI_LABEL", "nisheetha_date")
    assert _days_named("Krishna Jayanthi", date(2027, 8, 20), date(2027, 8, 28)) == [date(2027, 8, 25)]
    assert _days_named("Krishna Jayanthi", date(2028, 8, 9), date(2028, 8, 17)) == [date(2028, 8, 14)]


def test_krishna_jayanthi_rohini_tie_break() -> None:
    """§2: Ashtami at two midnights — Rohini's night wins; neither, the later."""
    from app.calculations.festivals import NisheethaNight, _jayanthi_night_selected

    def at(tithi: int, star: str | None) -> NisheethaNight:
        return NisheethaNight(tithi, star or "BHARANI", date(2027, 1, 1), date(2027, 1, 2))

    def night(before, tonight, after, stars=(None, None, None)) -> bool:
        return _jayanthi_night_selected(at(before, stars[0]), at(tonight, stars[1]), at(after, stars[2]))

    assert night(22, 23, 24)
    # Two midnights, no Rohini: the later.
    assert not night(22, 23, 23) and night(23, 23, 24)
    # Two midnights, Rohini on the earlier: the earlier.
    assert night(22, 23, 23, (None, "ROHINI", "MIRUGASEERIDAM"))
    assert not night(23, 23, 24, ("ROHINI", "MIRUGASEERIDAM", None))
    # Ashtami at neither midnight: the later night.
    assert not night(21, 22, 24) and night(22, 24, 25)


def test_mahalaya_is_the_aparahna_amavasai_not_the_monthly_one() -> None:
    """Q6: tharpanam is judged at aparahna, the monthly Amavasai at sunrise.
    2027 shows both, as the almanac does: Mahalaya 29 Sep, Amavasai 30 Sep."""
    assert _days_named("Mahalaya Amavasai", date(2027, 9, 1), date(2027, 10, 20)) == [date(2027, 9, 29)]
    assert calculate_daily_panchangam(date(2027, 9, 30), *CHENNAI).special_tithi_day_number == 30


def test_thai_poosam_is_beside_thai_s_own_full_moon() -> None:
    """Q5 family A: Thai 2025 held Poosam twice. 15 Jan sits beside a full
    moon that fell in Margazhi; 11 Feb beside Thai's."""
    assert _days_named("Thai Poosam", date(2025, 1, 10), date(2025, 2, 20)) == [date(2025, 2, 11)]


def test_a_star_holding_no_sunrise_still_names_its_festival() -> None:
    """Poosam ran 9 Feb 06:50 to 10 Feb 04:03 in 2028, holding no sunrise, and
    the sunrise rule gave 2028 no Thai Poosam at all. It names the day it falls in."""
    assert _days_named("Thai Poosam", date(2028, 1, 10), date(2028, 2, 20)) == [date(2028, 2, 9)]


def test_a_failed_aparahna_falls_back_to_the_sunrise_tithi() -> None:
    """Q3's general principle, applied to Q4: Dasami held no aparahna in 2022,
    and Vijayadasami had no day at all. It falls back to the sunrise day."""
    assert _days_named("Vijayadasami", date(2022, 9, 25), date(2022, 10, 15)) == [date(2022, 10, 5)]
    assert _days_named("Ayudha Pooja", date(2022, 9, 25), date(2022, 10, 15)) == [date(2022, 10, 4)]


def test_aadi_pooram_is_the_pooram_of_the_lunar_month_opening_in_aadi() -> None:
    """Q5 family B: Aadi 2026 held Pooram on 18 Jul and 14 Aug. 18 Jul is the
    tail of the lunar month before; 14 Aug is in the one that opens in Aadi."""
    assert _days_named("Thiru Aadi Pooram", date(2026, 7, 10), date(2026, 8, 20)) == [date(2026, 8, 14)]


# ── Rulings 2026-10-22, round two ───────────────────────────────────────────
#
# 26-year gates: scripts/audit/solar_month_tiebreak_scan.py (§3, Task 3a/3b),
# yearly_observances_scan.py (all rows, §0.1 fire counts, §6 invariant),
# jayanthi_label_scan.py (§2). These pin the cases each section names.


def test_aadi_amavasai_two_amavasai_year_takes_the_one_closing_aadi_s_lunar_month() -> None:
    """§3 / §9.2: solar Aadi 2023 held Amavasai on 17 Jul and 15 Aug and both
    were labelled. The 15 Aug one closes the lunar month that opened inside
    Aadi; the "first occurrence" reading is withdrawn."""
    assert _days_named("Aadi Amavasai", date(2023, 7, 10), date(2023, 8, 20)) == [date(2023, 8, 15)]


def test_aadi_krithigai_is_one_day_in_a_two_krittika_month() -> None:
    """§3: Aadi 2028 holds Krittika at the 17 Jul and 13 Aug sunsets; the
    later is in the lunar month opening inside Aadi. OPEN-2: the vector is
    14 Aug, the day Krittika holds at sunrise; the ruled kala (pradosham)
    gives 13 Aug and is what the engine uses until that is answered."""
    assert _days_named("Aadi Krithigai", date(2028, 7, 10), date(2028, 8, 20)) == [date(2028, 8, 13)]


def test_a_single_occurrence_is_never_moved_by_a_tie_break() -> None:
    """§0.1 / §9.3: with one Magam in Maasi 2026 the tie-break is dormant and
    the day is Magam's own sunrise day, 3 Mar (Magam ran 07:51 on 2 Mar to
    07:31 on 3 Mar, with Pournami). The curated 2 Mar row is the majority-of-
    day day, which §0.3 rules out; the conflict is reported."""
    from app.calculations.observance_days import select_in_solar_month

    selection = select_in_solar_month("star", "MAGAM", "sunrise", date(2026, 3, 1), CHENNAI[2], *CHENNAI[:2])
    assert selection.selected == (date(2026, 3, 3),)
    assert not selection.tie_break_fired


def test_the_monthly_karthigai_vratam_falls_back_to_sunrise() -> None:
    """§0.3 / §4: Deepam is the Karthigai month's Karthigai vratam, so the
    vratam itself needs the universal fallback — in Dec 2025 Krittika held no
    sunset and the month had no vratam at all."""
    assert _days_named("Karthigai Vratam", date(2025, 12, 1), date(2025, 12, 8)) == [date(2025, 12, 4)]


def test_two_aparahnas_take_the_first() -> None:
    """§6: Navami held the 18 and 19 Oct 2045 aparahnas (13:34 on the 18th to
    16:08 on the 19th). The kala was met twice, which is not a failed check:
    the first. Dasami holds only the 20 Oct aparahna, so Vijayadasami is the
    20th — a gap §6's consecutive-days invariant forbids; reported."""
    assert _days_named("Ayudha Pooja", date(2045, 10, 10), date(2045, 10, 25)) == [date(2045, 10, 18)]
    assert _days_named("Vijayadasami", date(2045, 10, 10), date(2045, 10, 25)) == [date(2045, 10, 20)]


def test_ayudha_pooja_and_vijayadasami_are_consecutive_2020_2045() -> None:
    """§6 structural invariant, swept with the same day-naming the engine
    uses (`observance_days.name_day` at aparahna). The production assembler is
    swept by scripts/audit/yearly_observances_scan.py; the pins above go
    through it here. 2045 is the one year §6's own tie-break breaks it
    (see test_two_aparahnas_take_the_first); pinned so a change shows."""
    from app.calculations.lunar_month import LUNAR_ASHVINA
    from app.calculations.observance_days import _Clock, name_day, tithi_occurrences

    clock = _Clock(CHENNAI[2], *CHENNAI[:2])
    for year in range(2020, 2046):
        lo, hi = clock.sunrise(date(year, 9, 15)), clock.sunrise(date(year, 10, 31))
        days = {}
        for tithi in (9, 10):
            for occurrence in tithi_occurrences(tithi, lo, hi):
                month = amanta_month_at(occurrence.start_jd)
                if month.index == LUNAR_ASHVINA and not month.is_adhika:
                    days[tithi] = name_day(occurrence, "aparahna", clock)[0]
        gap = timedelta(days=2) if year == 2045 else timedelta(days=1)
        assert days[10] - days[9] == gap, (year, days)


def test_selection_rules_report_when_they_fire() -> None:
    """§0.1: the audit counts the years each rule fires. Aadi 2023's duplicate
    Amavasai fires the tie-break; an ordinary Aadi Amavasai does not."""
    from app.calculations.festivals import SELECTION_RULES, rule_fires

    with rule_fires() as fired:
        _festival_names_for(date(2023, 8, 15))
    assert "solar_month.duplicate_tie_break" in fired
    with rule_fires() as fired:
        _festival_names_for(date(2027, 8, 2))
    assert "solar_month.duplicate_tie_break" not in fired
    assert all(text.startswith("FIRES WHEN:") and "EFFECT:" in text for text in SELECTION_RULES.values())


def test_month_resolver_fallbacks_are_counted_too() -> None:
    """§0.1 blind spot, found by the first 26-year scan: containment named
    Thai Poosam 2028 inside the month resolver, which reported nothing, so
    `contained.names_day` read 0 fires in 26 years."""
    from app.calculations.festivals import rule_fires

    with rule_fires() as fired:
        names = _festival_names_for(date(2028, 2, 9))
    assert "Thai Poosam" in names
    assert "contained.names_day" in fired
