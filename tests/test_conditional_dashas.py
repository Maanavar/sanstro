"""Golden tests for the conditional nakshatra dasha family
(app/calculations/conditional_dashas.py).

The centrepiece is `test_engine_reproduces_vimshottari`: it feeds the genuine
Vimshottari 9-lord / 120-year table through this generalised engine and asserts
it reproduces `dasha.py` exactly. That proves the *machinery* (opening lord,
balance-at-birth, mahadasha spans, proportional antardasha nesting) is correct
independent of any contested conditional-dasha table — so the remaining
per-system tests only need to police the tables and their sums.
"""
from __future__ import annotations

import pytest

from app.calculations import dasha
from app.calculations.chart_strength import SIGN_LORD
from app.calculations.conditional_dashas import (
    _SIGN_LORD,
    CONDITIONAL_DASHA_SYSTEMS,
    ConditionalDashaSystem,
    _build_periods,
    _build_subperiods,
    calculate_opening,
    calculate_timeline,
    evaluate_applicability,
)
from app.calculations.dasha import JULIAN_YEAR_DAYS, NAKSHATRA_SIZE_DEGREES

pytestmark = pytest.mark.no_db

SYSTEM_KEYS = list(CONDITIONAL_DASHA_SYSTEMS.keys())

# A reference birth Julian Day (arbitrary but fixed) and Moon longitude.
BIRTH_JD = 2451545.0  # 2000-01-01 12:00 TT, a convenient anchor
NODES = {"RAHU", "KETU"}


def _nak_midpoint_longitude(nakshatra: int) -> float:
    """Longitude at the exact middle of a 1-based nakshatra (fraction 0.5)."""
    return (nakshatra - 1) * NAKSHATRA_SIZE_DEGREES + NAKSHATRA_SIZE_DEGREES / 2.0


# --------------------------------------------------------------------------- #
# Table integrity                                                             #
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("key", SYSTEM_KEYS)
def test_years_sum_to_total(key: str) -> None:
    system = CONDITIONAL_DASHA_SYSTEMS[key]
    assert sum(system.years.values()) == system.total_years


@pytest.mark.parametrize("key", SYSTEM_KEYS)
def test_sequence_matches_year_keys(key: str) -> None:
    system = CONDITIONAL_DASHA_SYSTEMS[key]
    # Every lord in the ordered cycle has a year, and vice versa, no dupes.
    assert set(system.sequence) == set(system.years.keys())
    assert len(system.sequence) == len(set(system.sequence)) == system.lord_count


def test_expected_totals_and_counts() -> None:
    # Locks the named cycle lengths from the source, so a table edit that
    # breaks a total is caught even if it still self-sums.
    expected = {
        "shodashottari": (116, 8),
        "dwadashottari": (112, 8),
        "panchottari": (105, 7),
        "shatabdika": (100, 7),
        "chaturashiti_sama": (84, 7),
        "dwisaptati_sama": (72, 8),
        "shashtihayani": (60, 8),
    }
    for key, (total, count) in expected.items():
        system = CONDITIONAL_DASHA_SYSTEMS[key]
        assert (system.total_years, system.lord_count) == (total, count), key


def test_sama_dashas_have_equal_periods() -> None:
    for key in ("chaturashiti_sama", "dwisaptati_sama"):
        years = set(CONDITIONAL_DASHA_SYSTEMS[key].years.values())
        assert len(years) == 1, f"{key} is a 'sama' (equal-period) dasha"


# --------------------------------------------------------------------------- #
# Nakshatra -> opening lord rule                                              #
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("key", SYSTEM_KEYS)
def test_opening_lord_at_start_nakshatra_is_first_lord(key: str) -> None:
    system = CONDITIONAL_DASHA_SYSTEMS[key]
    # A birth exactly at the system's start nakshatra opens with sequence[0].
    assert system.nak_lord(system.start_nakshatra) == system.sequence[0]


def test_nak_lord_known_cases() -> None:
    shod = CONDITIONAL_DASHA_SYSTEMS["shodashottari"]  # start Pushya=8, N=8
    assert shod.nak_lord(8) == "SUN"       # Pushya -> 0 -> Sun
    assert shod.nak_lord(9) == "MARS"      # Ashlesha -> 1 -> Mars
    assert shod.nak_lord(7) == "JUPITER"   # Punarvasu -> forward 26 -> 26%8=2 -> Jupiter

    shash = CONDITIONAL_DASHA_SYSTEMS["shashtihayani"]  # non-uniform blocks, not mod-8
    assert shash.nak_lord(1) == "JUPITER"  # Ashwini opens with Jupiter
    assert shash.nak_lord(2) == "JUPITER"  # Bharani is still in Jupiter's block (EC-4)


def test_nak_lord_wraps_before_start() -> None:
    # Regression for the mod-27-first rule: a nakshatra *before* the start must
    # wrap a full circle, not take a raw negative modulo. Shodashottari starts
    # at Pushya (8); Ashwini (1) is 26 steps back (wrapping), not -7.
    shod = CONDITIONAL_DASHA_SYSTEMS["shodashottari"]  # seq=(SUN,MARS,JUPITER,SATURN,KETU,...)
    assert shod.nak_lord(8) == "SUN"        # Pushya opens
    assert shod.nak_lord(1) == "KETU"       # Ashwini: (1-8)%27=20, 20%8=4 -> KETU


def test_nak_lord_dwadashottari_reversed_direction() -> None:
    # EC-3 (astrologer-confirmed 2026-07-14): BPHS phrases Dwadashottari's
    # count in reverse ("from the Janma Nakshatra to Revati"), unlike the six
    # other systems' anchor -> janma count. Revati (27) is the anchor and
    # still opens with sequence[0]; Ashwini (1) is 26 steps *forward* from
    # Ashwini back to Revati, i.e. `(start - n) % 27` = 26, not the 1-step
    # anchor->janma count the uniform formula would give.
    dwad = CONDITIONAL_DASHA_SYSTEMS["dwadashottari"]  # seq[0]=SUN, seq[2]=KETU
    assert dwad.count_from_janma is True
    assert dwad.nak_lord(27) == "SUN"     # Revati (anchor) opens
    assert dwad.nak_lord(1) == "KETU"     # Ashwini: (27-1)%27=26, 26%8=2 -> KETU


# --------------------------------------------------------------------------- #
# Shashtihayani non-uniform block grouping (EC-4, astrologer-confirmed        #
# 2026-07-14): BPHS Ch.47 v.40-41 named-block table, not uniform mod-8.       #
# --------------------------------------------------------------------------- #

# Golden set from the astrologer's reference: (nakshatra number, expected lord).
# U.Ashadha(21) and Abhijit are the structurally decisive cells — mod-8 would
# give completely different lords for most of these (7 of the first 8 nakshatras
# disagree between the two algorithms; see the reference's diagnostic table).
_SHASHTIHAYANI_GOLDEN_NAKSHATRAS: list[tuple[int, str]] = [
    (1, "JUPITER"),   # Ashwini
    (3, "JUPITER"),   # Krittika — last of Jupiter's block
    (4, "SUN"),       # Rohini — first of Sun's block
    (7, "SUN"),       # Punarvasu — last of Sun's block (mod-8 would say Saturn)
    (10, "MARS"),     # Magha
    (14, "MOON"),     # Chitra
    (17, "MERCURY"),  # Anuradha
    (21, "VENUS"),    # U.Ashadha (midpoint still Venus; see Abhijit test below)
    (23, "SATURN"),   # Dhanishta
    (27, "RAHU"),     # Revati
]


@pytest.mark.parametrize("nakshatra,expected_lord", _SHASHTIHAYANI_GOLDEN_NAKSHATRAS)
def test_shashtihayani_block_grouping_golden(nakshatra: int, expected_lord: str) -> None:
    shash = CONDITIONAL_DASHA_SYSTEMS["shashtihayani"]
    assert shash.nak_lord(nakshatra) == expected_lord


def test_shashtihayani_mod8_would_disagree_on_bharani() -> None:
    # The diagnostic that proves mod-8 is structurally wrong here, not just
    # off by a rounding edge: Bharani (2) is mod-8's very first divergence
    # (mod-8 says Sun; the block table says Jupiter, since Bharani is the
    # 2nd of Jupiter's 3-nakshatra block).
    shash = CONDITIONAL_DASHA_SYSTEMS["shashtihayani"]
    assert shash.nak_lord(2) == "JUPITER"


def test_shashtihayani_abhijit_boundary_is_saturn() -> None:
    # The structurally decisive cell: a longitude inside Abhijit's sidereal
    # span (276.667-280.889 deg) must resolve to Saturn via calculate_opening,
    # even though it sits inside what the standard 27-nakshatra grid would
    # call U.Ashadha (nakshatra 21, whose own midpoint is still Venus's).
    shash = CONDITIONAL_DASHA_SYSTEMS["shashtihayani"]
    abhijit_midpoint = (276.0 + 40.0 / 60.0 + 280.0 + 53.0 / 60.0 + 20.0 / 3600.0) / 2.0
    lord, _, _ = calculate_opening(shash, abhijit_midpoint, BIRTH_JD)
    assert lord == "SATURN"

    # Just before Abhijit's start, still Venus's block (U.Ashadha's own body).
    just_before = 276.0 + 40.0 / 60.0 - 0.01
    lord_before, _, _ = calculate_opening(shash, just_before, BIRTH_JD)
    assert lord_before == "VENUS"


def test_shashtihayani_balance_is_fraction_of_full_block() -> None:
    # Balance-of-dasha must use the fraction of the FULL BLOCK elapsed, not
    # the single occupied nakshatra: Bharani is the *middle* of Jupiter's
    # 3-nakshatra (40 deg) block, so a Moon at Bharani's own midpoint (20 deg
    # absolute) is only 50% through the 40 deg block, not 50% through Bharani's
    # own 13.333 deg span (which would wrongly give a near-zero-elapsed
    # reading relative to the block).
    shash = CONDITIONAL_DASHA_SYSTEMS["shashtihayani"]
    bharani_midpoint = _nak_midpoint_longitude(2)  # 20.0 deg, block is [0, 40)
    lord, balance, _ = calculate_opening(shash, bharani_midpoint, BIRTH_JD)
    assert lord == "JUPITER"
    assert balance == pytest.approx(shash.years["JUPITER"] / 2.0)  # 5.0 of 10y


# --------------------------------------------------------------------------- #
# Balance-of-dasha proportionality                                            #
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("key", SYSTEM_KEYS)
def test_opening_balance_is_full_at_nakshatra_start(key: str) -> None:
    system = CONDITIONAL_DASHA_SYSTEMS[key]
    # Moon at the very start of its nakshatra -> full balance of that lord.
    longitude = (system.start_nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
    lord, balance, _ = calculate_opening(system, longitude, BIRTH_JD)
    assert lord == system.sequence[0]
    assert balance == pytest.approx(float(system.years[lord]))


@pytest.mark.parametrize("key", [k for k in SYSTEM_KEYS if k != "shashtihayani"])
def test_opening_balance_is_half_at_nakshatra_midpoint(key: str) -> None:
    # Shashtihayani excluded: its opening lord's mahadasha spans a 3-4
    # nakshatra BLOCK, not one nakshatra, so "midpoint of the start
    # nakshatra" is nowhere near the midpoint of the block. See
    # test_shashtihayani_balance_is_fraction_of_full_block below.
    system = CONDITIONAL_DASHA_SYSTEMS[key]
    longitude = _nak_midpoint_longitude(system.start_nakshatra)
    lord, balance, _ = calculate_opening(system, longitude, BIRTH_JD)
    assert balance == pytest.approx(float(system.years[lord]) / 2.0)


# --------------------------------------------------------------------------- #
# Mahadasha / antardasha span construction                                    #
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("key", SYSTEM_KEYS)
def test_one_full_cycle_spans_total_years(key: str) -> None:
    system = CONDITIONAL_DASHA_SYSTEMS[key]
    # Build from a nakshatra-start birth so the opening period is a full lord.
    longitude = (system.start_nakshatra - 1) * NAKSHATRA_SIZE_DEGREES
    lord, balance, _ = calculate_opening(system, longitude, BIRTH_JD)
    periods = _build_periods(system, BIRTH_JD, lord, balance)
    first_cycle = periods[: system.lord_count]
    span_days = first_cycle[-1].end_jd - first_cycle[0].start_jd
    assert span_days == pytest.approx(system.total_years * JULIAN_YEAR_DAYS)


@pytest.mark.parametrize("key", SYSTEM_KEYS)
def test_antardashas_sum_to_parent_true_span(key: str) -> None:
    system = CONDITIONAL_DASHA_SYSTEMS[key]
    longitude = _nak_midpoint_longitude(system.start_nakshatra)
    timeline = calculate_timeline(key, BIRTH_JD, longitude, as_of_jd=BIRTH_JD)
    parent = timeline.current_mahadasha
    antars = timeline.antardashas
    # Antardashas are rebuilt over the *true* (unclipped) parent span.
    total_span = antars[-1].end_jd - antars[0].start_jd
    parent_years = float(system.years[parent.lord])
    assert total_span == pytest.approx(parent_years * JULIAN_YEAR_DAYS)
    # First antardasha is always the parent lord's own bhukti.
    assert antars[0].lord == parent.lord


@pytest.mark.parametrize("key", SYSTEM_KEYS)
def test_timeline_resolves_running_periods(key: str) -> None:
    system = CONDITIONAL_DASHA_SYSTEMS[key]
    longitude = _nak_midpoint_longitude(system.start_nakshatra)
    as_of = BIRTH_JD + 20 * JULIAN_YEAR_DAYS
    timeline = calculate_timeline(key, BIRTH_JD, longitude, as_of_jd=as_of)
    maha = timeline.current_mahadasha
    antar = timeline.current_antardasha
    assert maha.start_jd <= as_of < maha.end_jd
    assert antar.start_jd <= as_of < antar.end_jd
    assert maha.lord in system.sequence
    assert antar.lord in system.sequence


# --------------------------------------------------------------------------- #
# THE correctness proof: reproduce Vimshottari                                #
# --------------------------------------------------------------------------- #

def _vimshottari_as_conditional_system() -> ConditionalDashaSystem:
    return ConditionalDashaSystem(
        key="_vimshottari_ref",
        name_en="Vimshottari (reference)",
        name_ta="",
        total_years=120,
        sequence=tuple(dasha.SEQUENCE),
        years=dict(dasha.DASHA_YEARS),
        start_nakshatra=1,  # Ashwini -> Ketu, matching dasha.NAK_LORD
        applicability_en="",
        applicability_ta="",
    )


@pytest.mark.parametrize("nakshatra", range(1, 28))
def test_engine_reproduces_vimshottari_opening(nakshatra: int) -> None:
    """The generalised nak_lord + balance must match dasha.py for every
    nakshatra — this is the whole-family correctness guarantee."""
    vim = _vimshottari_as_conditional_system()
    longitude = _nak_midpoint_longitude(nakshatra)

    lord, balance, end_jd = calculate_opening(vim, longitude, BIRTH_JD)
    ref_lord, ref_balance, ref_end = dasha.calculate_opening_dasha(longitude, BIRTH_JD)

    assert lord == ref_lord == dasha.NAK_LORD[nakshatra]
    assert balance == pytest.approx(ref_balance)
    assert end_jd == pytest.approx(ref_end)


def test_engine_reproduces_vimshottari_mahadashas() -> None:
    vim = _vimshottari_as_conditional_system()
    longitude = _nak_midpoint_longitude(10)  # Magha -> Ketu, an interesting mid case

    lord, balance, _ = calculate_opening(vim, longitude, BIRTH_JD)
    generalized = _build_periods(vim, BIRTH_JD, lord, balance)
    reference = dasha._build_periods(BIRTH_JD, lord, balance)

    # dasha.py builds 2 cycles (18); the generalised engine builds >= that.
    for gen, ref in zip(generalized, reference):
        assert gen.lord == ref.lord
        assert gen.start_jd == pytest.approx(ref.start_jd)
        assert gen.end_jd == pytest.approx(ref.end_jd)
        assert gen.start_date == ref.start_date
        assert gen.end_date == ref.end_date


def test_engine_reproduces_vimshottari_antardashas() -> None:
    vim = _vimshottari_as_conditional_system()
    longitude = _nak_midpoint_longitude(10)

    lord, balance, _ = calculate_opening(vim, longitude, BIRTH_JD)
    maha = _build_periods(vim, BIRTH_JD, lord, balance)[0]

    generalized = _build_subperiods(vim, maha)
    reference = dasha._build_subperiods(maha, "antar")

    assert [p.lord for p in generalized] == [p.lord for p in reference]
    for gen, ref in zip(generalized, reference):
        assert gen.start_jd == pytest.approx(ref.start_jd)
        assert gen.end_jd == pytest.approx(ref.end_jd)


# --------------------------------------------------------------------------- #
# Applicability selector                                                       #
# --------------------------------------------------------------------------- #

def test_local_sign_lord_matches_chart_strength() -> None:
    # The dependency-light local copy must not drift from the canonical map.
    assert _SIGN_LORD == SIGN_LORD


def _all_houses(**overrides: int) -> dict[str, int]:
    # Every graha parked in house 2 unless overridden (a benign default so no
    # condition accidentally fires).
    base = {g: 2 for g in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")}
    base.update(overrides)
    return base


def test_selector_shashtihayani_sun_in_lagna() -> None:
    res = evaluate_applicability(
        lagna_rasi=1, d9_lagna_rasi=5, d12_lagna_rasi=5,
        planet_house=_all_houses(SUN=1), paksha="SHUKLA", is_day_birth=True,
    )
    assert res["shashtihayani"].applicable is True
    res_no = evaluate_applicability(
        lagna_rasi=1, d9_lagna_rasi=5, d12_lagna_rasi=5,
        planet_house=_all_houses(SUN=5), paksha="SHUKLA", is_day_birth=True,
    )
    assert res_no["shashtihayani"].applicable is False


def test_selector_chaturashiti_tenth_lord_in_tenth() -> None:
    # Aries lagna -> 10th sign Capricorn -> lord Saturn. Saturn in house 10 => applies.
    res = evaluate_applicability(
        lagna_rasi=1, d9_lagna_rasi=1, d12_lagna_rasi=1,
        planet_house=_all_houses(SATURN=10), paksha=None, is_day_birth=None,
    )
    assert res["chaturashiti_sama"].applicable is True
    assert "SATURN" in res["chaturashiti_sama"].reason


def test_selector_dwisaptati_lagna_lord_in_1_or_7() -> None:
    # Aries lagna -> lord Mars. Mars in 7 => applies; in 4 => not.
    yes = evaluate_applicability(
        lagna_rasi=1, d9_lagna_rasi=1, d12_lagna_rasi=1,
        planet_house=_all_houses(MARS=7), paksha=None, is_day_birth=None,
    )
    assert yes["dwisaptati_sama"].applicable is True
    no = evaluate_applicability(
        lagna_rasi=1, d9_lagna_rasi=1, d12_lagna_rasi=1,
        planet_house=_all_houses(MARS=4), paksha=None, is_day_birth=None,
    )
    assert no["dwisaptati_sama"].applicable is False


def test_selector_shatabdika_vargottama() -> None:
    res = evaluate_applicability(
        lagna_rasi=3, d9_lagna_rasi=3, d12_lagna_rasi=3,
        planet_house=_all_houses(), paksha=None, is_day_birth=None,
    )
    assert res["shatabdika"].applicable is True
    res2 = evaluate_applicability(
        lagna_rasi=3, d9_lagna_rasi=8, d12_lagna_rasi=3,
        planet_house=_all_houses(), paksha=None, is_day_birth=None,
    )
    assert res2["shatabdika"].applicable is False


def test_selector_dwadashottari_venus_navamsa() -> None:
    res = evaluate_applicability(
        lagna_rasi=1, d9_lagna_rasi=7, d12_lagna_rasi=1,
        planet_house=_all_houses(), paksha=None, is_day_birth=None,
    )
    assert res["dwadashottari"].applicable is True  # D9 lagna Libra (Venus)


def test_selector_shodashottari_paksha_daynight_matrix() -> None:
    def status(is_day: bool, paksha: str) -> bool | None:
        return evaluate_applicability(
            lagna_rasi=1, d9_lagna_rasi=1, d12_lagna_rasi=1,
            planet_house=_all_houses(), paksha=paksha, is_day_birth=is_day,
        )["shodashottari"].applicable

    assert status(True, "KRISHNA") is True
    assert status(False, "SHUKLA") is True
    assert status(True, "SHUKLA") is False
    assert status(False, "KRISHNA") is False


def test_selector_indeterminate_when_data_missing() -> None:
    res = evaluate_applicability(
        lagna_rasi=1, d9_lagna_rasi=None, d12_lagna_rasi=None,
        planet_house=_all_houses(), paksha=None, is_day_birth=None,
    )
    assert res["shodashottari"].applicable is None   # no paksha/day-night
    assert res["dwadashottari"].applicable is None    # no D9
    assert res["shatabdika"].applicable is None       # no D9


# --------------------------------------------------------------------------- #
# Real-ephemeris anchor (T003 reference chart, shared with the other dashas)  #
# --------------------------------------------------------------------------- #

# Moon at 240.01137891 deg -> nakshatra 19 (Moola, starts at 240.0 deg), the
# same T003 reference chart used by test_ashtottari_dasha / test_yogini_dasha.
_T003_MOON_LONGITUDE = 240.01137891


def test_t003_opening_lords_are_deterministic() -> None:
    # Opening lord = system.nak_lord(19). These lock the (satyori-anchored)
    # tables against a real ephemeris longitude, not just synthetic midpoints.
    expected = {
        "shodashottari": "SATURN",       # Pushya(8),  steps 11 % 8 = 3
        "dwadashottari": "SUN",          # Revati(27), reverse steps (27-19)%27=8, 8 % 8 = 0
        "panchottari": "SATURN",         # Anuradha(17), steps 2 % 7 = 2
        "shatabdika": "MARS",            # Revati(27), steps 19 % 7 = 5
        "chaturashiti_sama": "JUPITER",  # Swati(15),  steps 4 % 7 = 4
        "dwisaptati_sama": "SUN",        # Mula(19),   steps 0
        "shashtihayani": "VENUS",        # Mula(19) longitude falls in Venus's block [226.667,276.667) (EC-4)
    }
    for key, lord in expected.items():
        opening, _, _ = calculate_opening(CONDITIONAL_DASHA_SYSTEMS[key], _T003_MOON_LONGITUDE, BIRTH_JD)
        assert opening == lord, key


def test_t003_dwisaptati_opens_at_moola_with_near_full_balance() -> None:
    # Moon is 0.011 deg into Moola, which is Dwisaptati's start nakshatra, so
    # the opening SUN bhukti is essentially full (9 years).
    lord, balance, _ = calculate_opening(
        CONDITIONAL_DASHA_SYSTEMS["dwisaptati_sama"], _T003_MOON_LONGITUDE, BIRTH_JD
    )
    assert lord == "SUN"
    assert balance == pytest.approx(9.0, abs=1e-2)


def test_selector_panchottari_cancer_and_d12() -> None:
    # Non-Cancer lagna => definitively not applicable, even without D12.
    non_cancer = evaluate_applicability(
        lagna_rasi=1, d9_lagna_rasi=1, d12_lagna_rasi=None,
        planet_house=_all_houses(), paksha=None, is_day_birth=None,
    )
    assert non_cancer["panchottari"].applicable is False
    # Cancer lagna but D12 unknown => needs review.
    indeterminate = evaluate_applicability(
        lagna_rasi=4, d9_lagna_rasi=4, d12_lagna_rasi=None,
        planet_house=_all_houses(), paksha=None, is_day_birth=None,
    )
    assert indeterminate["panchottari"].applicable is None
    # Cancer lagna + Cancer D12 => applies.
    applies = evaluate_applicability(
        lagna_rasi=4, d9_lagna_rasi=4, d12_lagna_rasi=4,
        planet_house=_all_houses(), paksha=None, is_day_birth=None,
    )
    assert applies["panchottari"].applicable is True
