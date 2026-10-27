"""WI-12 (festival rules engine, Doctrine §8) parity-gate tests.

Locks the algorithmic engine's 2026 output against the (still-present, about
to be trimmed) hardcoded Hindu entries in `_YEARLY_FESTIVALS[2026]`, and
proves the engine produces a non-empty 2027 festival set — the actual
regression ("silent 2027 failure") this WI exists to prevent.

Every mismatch found during the parity check is explained here, not silently
absorbed. Of the 24 hardcoded 2026 Ekadashi dates, 20 are reproduced by the
engine exactly; 4 were not, for three distinct, verified reasons (07-10 is now
reproduced, see below):

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
- **2026-07-10 (Yogini Ekadashi) — kshaya, now reproduced:** tithi 11
  (Krishna Ekadashi) is entirely "kshaya" this cycle — elided between
  2026-07-10's sunrise (tithi 10) and 2026-07-11's sunrise (tithi 12). It
  was a documented gap; it now names the day it falls in (§5), which is
  Drik Panchang's smarta fast day for Chennai and the printed almanacs' day
  (answers of 23 Oct, Q9). See test_kshaya_ekadashi_names_the_day_it_falls_in.

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
_EKADASHI_EXCEPTIONS = {"05-27", "11-20", "12-05"}
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
    """21 of the 24 hardcoded dates — the 3 exceptions are covered by their
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


def test_kshaya_ekadashi_names_the_day_it_falls_in() -> None:
    """An Ekadashi holding no sunrise names the day it falls in (§5), not the
    Dwadasi after it. Drik Panchang (Chennai) gives Yogini Ekadashi on Fri
    10 Jul 2026 (Ekadashi 08:16 to 05:22) and the Vaishnava / Gauna fast on
    11 Jul; both printed almanacs give 10 Jul 2026 and 29 Jul 2027.

    R2 of the 23 Oct follow-up settles this as the **festival date**, keeping it
    apart from the fasting date a tradition prescribes, and withdraws A6a's
    "every skipped Ekadashi is fasted on Dwadasi" as a universal Tamil rule."""
    assert "Ekadashi (Krishna)" in _festival_names_for(date(2026, 7, 10), previous_day=date(2026, 7, 9))
    assert not any("Ekadashi" in n for n in _festival_names_for(date(2026, 7, 11), previous_day=date(2026, 7, 10)))
    assert _days_named("Ekadashi (Krishna)", date(2027, 7, 26), date(2027, 8, 2)) == [date(2027, 7, 29)]


def test_vaikunta_ekadashi_2025_is_the_day_srirangam_opened_the_vasal() -> None:
    """The anchor case for R2: Vaikunta Ekadashi 2025 held no sunrise at Chennai
    (Ekadashi 30 Dec 07:51 to 31 Dec 05:00, before the 06:30 sunrise). Srirangam
    opened the Paramapada Vasal on the morning of 30 Dec, both printed almanacs
    give 30 Dec, and the astrologer ruled the festival date is that day — the
    Dwadasi belongs to the fasting field, which is not built. Before §5 reached
    Ekadashi the engine named no day at all for this one."""
    assert _days_named("Vaikunta Ekadashi", date(2025, 12, 26), date(2026, 1, 3)) == [date(2025, 12, 30)]


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


def _varalakshmi_fires(days_to_pournami: int) -> bool:
    from app.calculations.festivals import ObservanceInstants, _recurring_tithi_festivals

    results = _recurring_tithi_festivals(
        15, "SHUKLA", "SADAYAM", "FRIDAY", None, 15, lunar_month_index=LUNAR_SHRAVANA,
        instants=ObservanceInstants(days_until_pournami_day=days_to_pournami),
    )
    return any(r["name"] == "Varalakshmi Vratham" for r in results)


def test_varalakshmi_window_is_the_friday_on_or_before_the_pournami() -> None:
    """§9.1 in the default reading (`_VARALAKSHMI_FRIDAY_POURNAMI`): the last
    Friday on or before the printed Pournami day, so a Friday Pournami is
    itself the vratham (0) and the window closes at 6."""
    from app.calculations import festivals

    assert festivals._VARALAKSHMI_FRIDAY_POURNAMI == "the_pournami"
    assert _varalakshmi_fires(0) and _varalakshmi_fires(6)
    assert not _varalakshmi_fires(7)


def test_varalakshmi_strict_reading_moves_the_window_a_day(monkeypatch) -> None:
    """The competing reading (A5b of the 23 Oct follow-up, contradicted by his
    own R3) kept working behind the switch: the Friday *strictly* before, so a
    Friday Pournami pushes the vratham a week back and the Pournami day itself
    is not it."""
    from app.calculations import festivals

    monkeypatch.setattr(festivals, "_VARALAKSHMI_FRIDAY_POURNAMI", "the_week_before")
    assert _varalakshmi_fires(1) and _varalakshmi_fires(7)
    assert not _varalakshmi_fires(0)
    assert not _varalakshmi_fires(8)
    # Asserted at the rule, not through the production assembler: the curated
    # 2026 row follows the default, so switching the reading there would show
    # both 21 and 28 Aug — which is why the curated row moves with this switch.


# ── Astrologer rulings 2026-10-22 (docs/REVIEW_REQUESTS_2026-10-22.md) ──────
#
# The 26-year gate is scripts/audit/yearly_observances_scan.py; these pin the
# cases each ruling changed.


def test_krishna_jayanthi_is_gokulashtami_at_true_midnight() -> None:
    """Q1: the Krishna Ashtami of lunar Shravana at nisheetha. 2020 is the
    ruling's own proof: Tamil Nadu kept 11-12 Aug while the Sun was still in
    Katakam; the old solar-Aavani rule gave 10 Sep."""
    assert _days_named("Krishna Jayanthi", date(2020, 8, 1), date(2020, 9, 30)) == [date(2020, 8, 11)]


def test_krishna_jayanthi_is_the_jayanthi_yoga_day_when_ashtami_meets_rohini() -> None:
    """§2.3 of 23 Oct: when Krishna Ashtami overlaps Rohini, the overlap
    decides. 2027: Ashtami holds the 24->25 Aug nisheetha alone, but meets
    Rohini on 25 Aug 12:27-19:19, so 25 Aug. 2029 (1 Sep) and 2030 (21 Aug)
    likewise. All three are Drik Panchang's Chennai smarta dates and the
    round-two vectors; the Ashtami-only rule gave 24 Aug, 31 Aug and 20 Aug."""
    assert _days_named("Krishna Jayanthi", date(2027, 8, 20), date(2027, 8, 28)) == [date(2027, 8, 25)]
    assert _days_named("Krishna Jayanthi", date(2029, 8, 27), date(2029, 9, 4)) == [date(2029, 9, 1)]
    assert _days_named("Krishna Jayanthi", date(2030, 8, 17), date(2030, 8, 25)) == [date(2030, 8, 21)]


def test_a_morning_only_rohini_overlap_does_not_decide_the_jayanthi_day() -> None:
    """A1a of the 23 Oct follow-up: the overlap decides only where it reaches
    the evening — the midnight, aparahna or pradosham. In 2019 Ashtami met
    Rohini from 03:47 to 08:32 on 24 Aug and no later, so the yoga does not
    override and Ashtami at nisheetha stands: 23 Aug, the Tamil Nadu holiday.
    Without the threshold the engine gave 24 Aug."""
    from app.calculations.observance_days import jayanthi_yoga_day

    assert jayanthi_yoga_day(date(2019, 8, 23), CHENNAI[2], *CHENNAI[:2]) is None
    assert _days_named("Krishna Jayanthi", date(2019, 8, 18), date(2019, 8, 28)) == [date(2019, 8, 23)]
    # 2030's overlap is only 19:24-20:01, inside pradosham, and does decide.
    assert jayanthi_yoga_day(date(2030, 8, 21), CHENNAI[2], *CHENNAI[:2]) == date(2030, 8, 21)


def test_krishna_jayanthi_without_rohini_prints_the_evening_of_the_ashtami_night() -> None:
    """No overlap: Ashtami at nisheetha, printed by the evening that opens the
    night (`festivals._JAYANTHI_LABEL`, Q1 of 23 Oct). 2031: Ashtami holds
    the 9->10 Aug midnight; Rohini begins only on the 11th. Drik Panchang
    (Chennai) prints 9 Aug, as does the round-two vector."""
    from app.calculations import festivals

    assert festivals._JAYANTHI_LABEL == "evening_date"
    assert _days_named("Krishna Jayanthi", date(2031, 8, 5), date(2031, 8, 13)) == [date(2031, 8, 9)]


def test_krishna_jayanthi_nisheetha_label_names_the_civil_date_of_the_instant(monkeypatch) -> None:
    """§2's label, kept working behind the switch: with no Rohini overlap the
    2028 night prints as 14 Aug (its vector is the 13th)."""
    from app.calculations import festivals

    monkeypatch.setattr(festivals, "_JAYANTHI_LABEL", "nisheetha_date")
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
    """Aadi Krithigai is judged at sunrise (Q2 of 23 Oct). Aadi 2028 holds
    Krittika at the 18 Jul and 14 Aug sunrises; §3 keeps the later, in the
    lunar month opening inside Aadi -- the vector, 14 Aug."""
    assert _days_named("Aadi Krithigai", date(2028, 7, 10), date(2028, 8, 20)) == [date(2028, 8, 14)]


def test_a_contained_star_gives_way_to_one_holding_a_sunrise() -> None:
    """Aadi 2025: Krittika holds the 20 Jul sunrise, and again runs inside
    16 Aug without holding its sunrise. A day holding the star at sunrise
    beats one that only contains it, before §3 is asked: 20 Jul, the vector
    and AstroVed's date (§3 alone gave 16 Aug)."""
    assert _days_named("Aadi Krithigai", date(2025, 7, 15), date(2025, 8, 18)) == [date(2025, 7, 20)]


def test_karthigai_deepam_is_the_krittika_united_with_the_pournami() -> None:
    """Q5 of 23 Oct: Karthigai 2032 holds Krittika at the 17 Nov and 14 Dec
    sunsets. 17 Nov is beside Karthigai's full moon (Krittika with Pournami);
    14 Dec has Krittika on Trayodasi. The same shape in 2013: Tiruvannamalai
    lit the Maha Deepam on 17 Nov, where §3 gave 15 Dec."""
    assert _days_named("Karthigai Deepam", date(2032, 11, 14), date(2032, 12, 17)) == [date(2032, 11, 17)]
    assert _days_named("Karthigai Deepam", date(2013, 11, 14), date(2013, 12, 17)) == [date(2013, 11, 17)]


def test_an_undecided_full_moon_tie_break_falls_back_to_the_lunar_month() -> None:
    """Q4 of 23 Oct: Vaikasi 2022 holds Visakam on 16 May and 12 Jun, both
    beside a Vaikasi full moon, and both were labelled. §3 decides: 12 Jun."""
    assert _days_named("Vaigasi Visakam", date(2022, 5, 14), date(2022, 6, 15)) == [date(2022, 6, 12)]


def test_varalakshmi_on_a_friday_pournami_is_the_pournami() -> None:
    """The three Friday-Pournami years of 2020-2045, in the default reading.
    Drik Panchang (Chennai) prints each of these, and the astrologer's R3 names
    12 Aug 2022 as the day observed — which is what sent the engine back here
    after A5b had asked for the Friday a week earlier."""
    assert _days_named("Varalakshmi Vratham", date(2022, 7, 30), date(2022, 8, 14)) == [date(2022, 8, 12)]
    assert _days_named("Varalakshmi Vratham", date(2026, 8, 14), date(2026, 8, 31)) == [date(2026, 8, 28)]
    assert _days_named("Varalakshmi Vratham", date(2029, 8, 10), date(2029, 8, 26)) == [date(2029, 8, 24)]


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


def test_a_navami_holding_two_aparahnas_takes_the_later() -> None:
    """Q7 of 23 Oct: Ayudha Pooja's Navami, holding two aparahnas, takes the
    later, the one adjoining Dasami. 2018: Navami held the 17 and 18 Oct
    aparahnas and Tamil Nadu kept Ayudha Pooja on 18 Oct, Vijayadasami 19 Oct
    (G.O. 937); "the first" gave 17 Oct. 2045: Navami 13:34 on the 18th to
    16:08 on the 19th, Dasami holding only the 20th's -> 19 and 20 Oct."""
    assert _days_named("Ayudha Pooja", date(2018, 10, 12), date(2018, 10, 22)) == [date(2018, 10, 18)]
    assert _days_named("Vijayadasami", date(2018, 10, 12), date(2018, 10, 22)) == [date(2018, 10, 19)]
    assert _days_named("Ayudha Pooja", date(2045, 10, 10), date(2045, 10, 25)) == [date(2045, 10, 19)]
    assert _days_named("Vijayadasami", date(2045, 10, 10), date(2045, 10, 25)) == [date(2045, 10, 20)]


def test_ayudha_pooja_and_vijayadasami_are_consecutive_2020_2045() -> None:
    """§6 structural invariant, swept with the same day-naming the engine
    uses (`observance_days.name_day` at aparahna, Navami taking the later of
    two). The production assembler is swept by
    scripts/audit/yearly_observances_scan.py; the pins above go through it."""
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
                    day, how, _jd = name_day(occurrence, "aparahna", clock)
                    later = tithi == 9 and how == "kala_two"
                    days[tithi] = day + timedelta(days=1) if later else day
        assert days[10] - days[9] == timedelta(days=1), (year, days)


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
