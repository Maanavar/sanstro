from datetime import UTC, datetime

import pytest

from app.calculations.astro import (
    house_from_reference,
    julian_day_to_utc_datetime,
    rasi_from_degree,
    utc_datetime_to_julian_day,
)
from app.calculations.ephemeris import (
    EphemerisBody,
    EphemerisSnapshot,
    calculate_sidereal_planets,
    saturn_longitude_at_jd,
)
from app.calculations.transits import (
    classify_ezharai_sani_murthi_ingress,
    classify_kandaka_cycle,
    classify_sani_cycle,
    find_saturn_egress_jd,
    find_saturn_ingress_jd,
    get_jupiter_aspects,
    get_saturn_aspects,
    is_gandanta,
    planets_transited_by,
)

pytestmark = pytest.mark.no_db


def test_sani_cycle_mapping_uses_expected_house_numbers():
    assert classify_sani_cycle(4).type == "ARDHASHTAMA_SANI"
    assert classify_sani_cycle(1).type == "JANMA_SANI"
    assert classify_sani_cycle(2).type == "EZHARAI_SANI_PHASE_3"
    assert classify_sani_cycle(3).type is None


# T040 — Dhanusu Moon + Saturn in Meenam = Ardhashtama Sani (house 4), NOT Janma Sani
def test_dhanusu_moon_saturn_meenam_is_ardhashtama_not_janma():
    janma_rasi = 9   # Dhanusu
    saturn_rasi = 12  # Meenam
    position = house_from_reference(janma_rasi, saturn_rasi)
    assert position == 4
    cycle = classify_sani_cycle(position)
    assert cycle.type == "ARDHASHTAMA_SANI"
    assert cycle.type != "JANMA_SANI"
    assert cycle.is_active is True


# T041 — Magaram Moon + Saturn in Meenam = house 3, no named cycle
def test_magaram_moon_saturn_meenam_has_no_named_cycle():
    janma_rasi = 10  # Magaram
    saturn_rasi = 12  # Meenam
    position = house_from_reference(janma_rasi, saturn_rasi)
    assert position == 3
    cycle = classify_sani_cycle(position)
    assert cycle.type is None
    assert cycle.is_active is False


# T042 — Meenam Moon + Saturn in Meenam = house 1, Janma Sani
def test_meenam_moon_saturn_meenam_is_janma_sani():
    janma_rasi = 12  # Meenam
    saturn_rasi = 12  # Meenam
    position = house_from_reference(janma_rasi, saturn_rasi)
    assert position == 1
    cycle = classify_sani_cycle(position)
    assert cycle.type == "JANMA_SANI"
    assert cycle.is_active is True


def test_kandaka_cycle_is_only_active_on_quadrants_from_lagna():
    assert classify_kandaka_cycle(1).type == "KANDAKA_SANI"
    assert classify_kandaka_cycle(4).type == "KANDAKA_SANI"
    assert classify_kandaka_cycle(7).type == "KANDAKA_SANI"
    assert classify_kandaka_cycle(10).type == "KANDAKA_SANI"
    assert classify_kandaka_cycle(2).type is None


def test_gandanta_uses_three_degrees_twenty_minutes():
    assert is_gandanta(0.5) is True
    assert is_gandanta(357.0) is True
    assert is_gandanta(117.0) is True
    assert is_gandanta(240.5) is True
    assert is_gandanta(30.0) is False


# T050 — house_from_reference: Kumbam(11) is 8th house from Katakam(4)
def test_house_from_reference_kumbam_is_8th_from_katakam():
    current_moon_rasi = 11  # Kumbam
    janma_rasi = 4           # Katakam / Kadagam
    position = house_from_reference(janma_rasi, current_moon_rasi)
    assert position == 8


# T060 — additional Gandanta boundary tests from QA spec
def test_gandanta_at_fire_water_junctions():
    assert is_gandanta(359.0) is True   # Meenam end
    assert is_gandanta(1.0) is True     # Mesham start
    assert is_gandanta(119.0) is True   # Kadagam end
    assert is_gandanta(121.0) is True   # Simmam start
    assert is_gandanta(239.0) is True   # Vrichigam end
    assert is_gandanta(241.0) is True   # Dhanusu start
    assert is_gandanta(150.0) is False  # unrelated zone


def test_jupiter_special_aspects():
    assert get_jupiter_aspects(1) == [5, 7, 9]
    assert get_jupiter_aspects(11) == [3, 5, 7]


def test_saturn_special_aspects():
    assert get_saturn_aspects(1) == [3, 7, 10]
    assert get_saturn_aspects(12) == [2, 6, 9]


def test_planets_transited_by_same_rasi_detection():
    snapshot = EphemerisSnapshot(
        jd_ut=0.0,
        backend="test",
        ayanamsa="LAHIRI",
        ayanamsa_value_degrees=0.0,
        bodies={
            "SUN": EphemerisBody("SUN", 5.0, 1.0, 1, 5.0, False, False),
            "JUPITER": EphemerisBody("JUPITER", 35.0, 1.0, 2, 5.0, False, False),
            "SATURN": EphemerisBody("SATURN", 65.0, 1.0, 3, 5.0, False, False),
        },
    )
    natal = {
        "MOON": {"rasi": 2},
        "VENUS": {"rasi": 1},
        "MARS": {"rasi": 12},
    }
    transited = planets_transited_by(snapshot, natal)
    assert transited["MOON"] == ["JUPITER"]
    assert transited["VENUS"] == ["SUN"]
    assert transited["MARS"] == []


# ---------------------------------------------------------------------------
# WI-08 — Ezharai Sani Murthi: default ingress-Moon method (Doctrine §3)
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "janma_rasi,ingress_moon_rasi,expected_grade",
    [
        # janma_rasi=1 fixed; ingress_moon_rasi sweeps all 12 counts.
        (1, 1, "GOLD"), (1, 6, "GOLD"), (1, 11, "GOLD"),
        (1, 2, "SILVER"), (1, 5, "SILVER"), (1, 9, "SILVER"),
        (1, 3, "COPPER"), (1, 7, "COPPER"), (1, 10, "COPPER"),
        (1, 4, "IRON"), (1, 8, "IRON"), (1, 12, "IRON"),
    ],
)
def test_classify_ezharai_sani_murthi_ingress_all_twelve_counts(janma_rasi, ingress_moon_rasi, expected_grade):
    result = classify_ezharai_sani_murthi_ingress(janma_rasi, ingress_moon_rasi)
    assert result["grade"] == expected_grade


def test_classify_ezharai_sani_murthi_ingress_is_relative_not_absolute():
    # Same count (1) from a different janma rasi should still grade GOLD —
    # the rule is the OFFSET between janma and ingress-moon rasi, not either
    # rasi's absolute number.
    assert classify_ezharai_sani_murthi_ingress(7, 7)["grade"] == "GOLD"
    assert classify_ezharai_sani_murthi_ingress(7, 8)["grade"] == "SILVER"


def test_find_saturn_ingress_jd_locates_actual_sign_boundary():
    # Self-consistency check against the real ephemeris (no external
    # reference date assumed — OQ-6 tracks getting printed-panchangam golden
    # dates from the astrologer to lock as golden tests later): pick a fixed
    # date, read off whatever rasi Saturn is actually in, and verify the
    # located ingress instant is the true boundary — Saturn occupies
    # current_rasi at (and after) the returned jd, and the PREVIOUS rasi
    # just before it.
    fixed_jd = utc_datetime_to_julian_day(datetime(2024, 6, 15, 12, 0, tzinfo=UTC))
    current_rasi = calculate_sidereal_planets(fixed_jd).bodies["SATURN"].rasi

    ingress_jd = find_saturn_ingress_jd(current_rasi, fixed_jd)

    assert calculate_sidereal_planets(ingress_jd).bodies["SATURN"].rasi == current_rasi
    just_before = calculate_sidereal_planets(ingress_jd - 0.01).bodies["SATURN"].rasi
    assert just_before != current_rasi


# OQ-6 (partial close, 2026-07-16): no printed panchangam available to cross-
# check against, so these do NOT claim to be externally-verified golden
# dates — they lock the murthi grade this repo's OWN ephemeris pipeline
# (find_saturn_ingress_jd -> real Moon rasi at that instant ->
# classify_ezharai_sani_murthi_ingress) produces for two real historical
# Saturn ingresses, self-computed via the commands in this comment:
#   probe 2024-06-15 -> Saturn already in Kumbham (11); ingress ~early 2023
#   probe 2020-03-01 -> Saturn already in Makaram (10); ingress ~Jan 2020
# If an astrologer later supplies printed-panchangam reference values that
# disagree with the grades below, that is a real finding against this
# pipeline, not a broken test — OQ-6 itself stays open for that check.
def test_ezharai_sani_murthi_self_computed_kumbham_ingress_2023():
    probe_jd = utc_datetime_to_julian_day(datetime(2024, 6, 15, 12, 0, tzinfo=UTC))
    saturn_rasi = calculate_sidereal_planets(probe_jd).bodies["SATURN"].rasi
    assert saturn_rasi == 11  # Kumbham (Aquarius)

    ingress_jd = find_saturn_ingress_jd(saturn_rasi, probe_jd)
    moon_rasi_at_ingress = calculate_sidereal_planets(ingress_jd).bodies["MOON"].rasi
    assert moon_rasi_at_ingress == 8  # self-computed, not printed-source-verified

    assert classify_ezharai_sani_murthi_ingress(1, moon_rasi_at_ingress)["grade"] == "IRON"
    assert classify_ezharai_sani_murthi_ingress(6, moon_rasi_at_ingress)["grade"] == "COPPER"
    assert classify_ezharai_sani_murthi_ingress(9, moon_rasi_at_ingress)["grade"] == "IRON"


def test_ezharai_sani_murthi_self_computed_makaram_ingress_2020():
    probe_jd = utc_datetime_to_julian_day(datetime(2020, 3, 1, 12, 0, tzinfo=UTC))
    saturn_rasi = calculate_sidereal_planets(probe_jd).bodies["SATURN"].rasi
    assert saturn_rasi == 10  # Makaram (Capricorn)

    ingress_jd = find_saturn_ingress_jd(saturn_rasi, probe_jd)
    moon_rasi_at_ingress = calculate_sidereal_planets(ingress_jd).bodies["MOON"].rasi
    assert moon_rasi_at_ingress == 10  # self-computed, not printed-source-verified

    assert classify_ezharai_sani_murthi_ingress(1, moon_rasi_at_ingress)["grade"] == "COPPER"
    assert classify_ezharai_sani_murthi_ingress(6, moon_rasi_at_ingress)["grade"] == "SILVER"
    assert classify_ezharai_sani_murthi_ingress(9, moon_rasi_at_ingress)["grade"] == "SILVER"


# --- find_saturn_egress_jd: the FINAL egress, not the first crossing ---------
#
# Fixed 2026-08-12 (spec §8.5). A sign boundary falling inside Saturn's
# retrograde arc is crossed three times — forward, back, forward — and the old
# finder returned the first. Measured over one reading per month, 1990-2050:
# **380 of 732 samples (51.9%) would have rendered a different month**, worst
# case 1302 days out. That is not an edge case, which is why these tests exist.
#
# Same posture as the ingress tests above: self-computed against this repo's own
# ephemeris, not verified against a printed panchangam. What they lock is the
# PROPERTY (the returned instant is the last crossing) rather than a date from
# an external source.

_EGRESS_PROBES = (
    # (probe date, the rasi Saturn is in on that date — asserted, not assumed)
    (datetime(2014, 12, 6, tzinfo=UTC), 8),
    (datetime(2020, 3, 1, tzinfo=UTC), 10),
    (datetime(2024, 6, 15, tzinfo=UTC), 11),
    (datetime(2026, 8, 12, tzinfo=UTC), 12),
)


def _first_crossing_egress(current_rasi: int, after_jd: float) -> float:
    """The pre-fix implementation, kept verbatim as the thing being regressed.

    Walks forward in 30-day steps to the first sample outside `current_rasi`
    and bisects that bracket — so on a retrograde loop it names the crossing
    Saturn is about to undo.
    """
    lo = after_jd
    hi = after_jd + 30.0
    while rasi_from_degree(saturn_longitude_at_jd(hi)) == current_rasi:
        lo = hi
        hi += 30.0
    while hi - lo > 1.0:
        mid = (lo + hi) / 2
        if rasi_from_degree(saturn_longitude_at_jd(mid)) == current_rasi:
            lo = mid
        else:
            hi = mid
    return hi


@pytest.mark.parametrize(("probe", "expected_rasi"), _EGRESS_PROBES)
def test_saturn_egress_lands_on_a_real_sign_boundary(probe: datetime, expected_rasi: int):
    probe_jd = utc_datetime_to_julian_day(probe)
    assert rasi_from_degree(saturn_longitude_at_jd(probe_jd)) == expected_rasi

    egress_jd = find_saturn_egress_jd(expected_rasi, probe_jd)

    # Out at the returned instant, still in a day earlier: a true boundary.
    assert rasi_from_degree(saturn_longitude_at_jd(egress_jd)) != expected_rasi
    assert rasi_from_degree(saturn_longitude_at_jd(egress_jd - 1.0)) == expected_rasi


@pytest.mark.parametrize(("probe", "expected_rasi"), _EGRESS_PROBES)
def test_saturn_never_returns_to_the_sign_after_the_reported_egress(
    probe: datetime, expected_rasi: int
):
    """THE GUARANTEE THE OLD FINDER DID NOT MAKE.

    "Moves on around {month}" is a claim about the last time Saturn is in that
    sign, not the first time it steps out. Sampled every two days for 200 days
    after the returned instant — long enough to contain a whole retrograde loop,
    which is the only thing that could bring Saturn back.
    """
    probe_jd = utc_datetime_to_julian_day(probe)
    egress_jd = find_saturn_egress_jd(expected_rasi, probe_jd)

    returns = [
        offset
        for offset in range(2, 200, 2)
        if rasi_from_degree(saturn_longitude_at_jd(egress_jd + offset)) == expected_rasi
    ]
    assert returns == [], f"Saturn re-entered rasi {expected_rasi} {returns[:3]} days after egress"


def test_saturn_egress_outruns_a_first_crossing_finder_on_a_retrograde_loop():
    """The regression, on a residency where the difference is nine months.

    Saturn in rasi 8 in December 2014: the first crossing out is in January
    2017, but Saturn retrogrades straight back and does not finally leave until
    October 2017. A reading generated at the probe date would have told the
    reader the transit ends nine months before it does.
    """
    probe_jd = utc_datetime_to_julian_day(datetime(2014, 12, 6, tzinfo=UTC))
    saturn_rasi = rasi_from_degree(saturn_longitude_at_jd(probe_jd))
    assert saturn_rasi == 8

    first = julian_day_to_utc_datetime(_first_crossing_egress(saturn_rasi, probe_jd)).date()
    final = julian_day_to_utc_datetime(find_saturn_egress_jd(saturn_rasi, probe_jd)).date()

    assert (first.year, first.month) == (2017, 1)
    assert (final.year, final.month) == (2017, 10)
    # The month is what the reading prints, so the months must differ — a fix
    # that moved the answer by days would not have been worth making.
    assert (final.year, final.month) != (first.year, first.month)
    # And it is a real loop, not two nearby boundary touches: somewhere between
    # the two dates Saturn is genuinely back inside rasi 8. Searched rather than
    # guessed at — the re-entry sits near the retrograde station, months after
    # the first crossing, not just behind it.
    first_jd = _first_crossing_egress(saturn_rasi, probe_jd)
    final_jd = find_saturn_egress_jd(saturn_rasi, probe_jd)
    reentry_days = [
        offset
        for offset in range(0, int(final_jd - first_jd), 5)
        if rasi_from_degree(saturn_longitude_at_jd(first_jd + offset)) == saturn_rasi
    ]
    assert reentry_days, "no re-entry found — this probe is not a triple crossing after all"


def test_saturn_egress_rejects_an_anchor_that_is_not_inside_the_rasi():
    """The precondition is now enforced rather than assumed.

    The one caller reads the rasi from the very JD it passes, so this cannot
    fire in production — but a future caller that passes a stale rasi would
    otherwise get a confidently wrong date instead of an error.
    """
    probe_jd = utc_datetime_to_julian_day(datetime(2026, 8, 12, tzinfo=UTC))
    actual = rasi_from_degree(saturn_longitude_at_jd(probe_jd))

    with pytest.raises(ValueError, match="must fall within"):
        find_saturn_egress_jd(actual % 12 + 1, probe_jd)

