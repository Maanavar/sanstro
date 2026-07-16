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

from datetime import date

import pytest

from app.calculations.festivals import get_festivals_for_date
from app.calculations.panchangam import calculate_daily_panchangam
from app.calculations.tamil_calendar import tamil_solar_date

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
    snap = calculate_daily_panchangam(d, *CHENNAI)
    tamil_month_index, tamil_day_of_month = tamil_solar_date(d, CHENNAI[2], CHENNAI[0], CHENNAI[1])
    prev_snap = calculate_daily_panchangam(previous_day, *CHENNAI) if previous_day else None
    festivals = get_festivals_for_date(
        d,
        snap.tithi_number,
        snap.tithi_paksha,
        snap.nakshatra_name,
        weekday=snap.weekday,
        tamil_month_index=tamil_month_index,
        special_tithi_day_number=snap.special_tithi_day_number,
        pradhosham_tithi_number=snap.pradhosham_tithi_number or None,
        nishita_tithi_number=snap.nishita_tithi_number or None,
        tamil_day_of_month=tamil_day_of_month,
        previous_day_tithi_number=prev_snap.tithi_number if prev_snap else None,
        previous_day_tithi_paksha=prev_snap.tithi_paksha if prev_snap else None,
    )
    return {f["name"] for f in festivals if f["category"] == "hindu"}


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


def test_thai_pongal_2026_is_jan_14_not_15() -> None:
    """See module docstring: verified independently against the raw sankranti
    crossing instant, this is a pre-existing hardcode error, not a WI-07
    side-effect — the hardcode's 01-15 is wrong."""
    assert "Thai Pongal" in _festival_names_for(date(2026, 1, 14))
    assert "Thai Pongal" not in _festival_names_for(date(2026, 1, 15))


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


def test_l13_aippasi_shukla_sashti_is_named_skanda_sashti() -> None:
    from app.calculations.festivals import _MONTH_AIPPASI, _recurring_tithi_festivals

    results = _recurring_tithi_festivals(6, "SHUKLA", "ROHINI", "MONDAY", _MONTH_AIPPASI, None)
    names = {r["name"] for r in results}
    assert "Sashti" in names
    assert "Skanda Sashti" in names


def test_l13_non_aippasi_shukla_sashti_stays_generic() -> None:
    from app.calculations.festivals import _MONTH_VAIKASI, _recurring_tithi_festivals

    results = _recurring_tithi_festivals(6, "SHUKLA", "ROHINI", "MONDAY", _MONTH_VAIKASI, None)
    names = {r["name"] for r in results}
    assert "Sashti" in names
    assert "Skanda Sashti" not in names


def test_l14_karthigai_deepam_fires_on_nakshatra_alone_even_off_pournami_day() -> None:
    """L-14: previously required special_tithi_day_number == 15 (the
    pournami-dominant civil day) in addition to Krittika nakshatra — the
    fix re-anchors on the nakshatra alone (with pournami no longer a hard
    gate), fixing the kshaya-year silent-skip regression."""
    from app.calculations.festivals import _MONTH_KARTHIGAI, _recurring_tithi_festivals

    # special_tithi_day_number=10 (NOT the pournami-dominant day) — under the
    # old AND-gate this would never fire.
    results = _recurring_tithi_festivals(1, "SHUKLA", "KARTHIGAI", "MONDAY", _MONTH_KARTHIGAI, 10)
    assert any(r["name"] == "Karthigai Deepam" for r in results)


def test_sankatahara_chaturthi_fires_every_krishna_chaturthi_not_only_tuesday() -> None:
    """WI-12 fix: previously only the Tuesday occurrence was labeled at all."""
    from app.calculations.festivals import _recurring_tithi_festivals

    non_tuesday = _recurring_tithi_festivals(19, "KRISHNA", "ROHINI", "MONDAY", None, None)
    tuesday = _recurring_tithi_festivals(19, "KRISHNA", "ROHINI", "TUESDAY", None, None)
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
