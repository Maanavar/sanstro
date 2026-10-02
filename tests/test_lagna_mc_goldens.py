"""Exact Lahiri Ascendant and Midheaven goldens, against an independent reference.

The gap this closes. Before this file the sidereal Ascendant's only golden was
`test_t020_lagna_changes_once_within_two_hour_window_for_chennai` — the rasi
changes exactly once across 08:00-10:00. An Ascendant 5 deg out passes that, as
does one on the wrong ayanamsa. The Midheaven had no golden at all; it feeds Dig
Bala through `calculate_asc_mc`. The one pinned Ascendant literal in the suite,
`test_sidereal_ayanamsa_cold_start._EXPECTED_ASC`, is swisseph's own output read
back, so it proves call-order independence and nothing about correctness.

The reference here does not call Swiss Ephemeris. It is spherical astronomy from
published definitions:

  * Greenwich mean sidereal time, IAU 1982 (Meeus, *Astronomical Algorithms*
    eq. 12.4), plus the equation of the equinoxes (delta-psi * cos eps).
  * Nutation from Meeus ch. 22's four-term series (good to ~0.5 arcsec) and the
    IAU 1980 mean obliquity.
  * MC = atan2(sin RAMC, cos RAMC * cos eps);
    Asc = atan2(cos RAMC, -(sin RAMC * cos eps + tan lat * sin eps)).
  * **Lahiri** as the Indian Astronomical Ephemeris defines it: 23 deg 15' 00.658"
    on 1956-03-21 0h, a TRUE (nutation-inclusive) value, carried forward by the
    IAU 2006 general precession in longitude. The mean value at the epoch is that
    figure less the epoch's nutation, 0.004658035 deg.

Measured against the library, every case agrees to within 0.25 arcsec. The
assertion tolerance is 2 arcsec, which still catches:

  * Fagan/Bradley — the library's default mode, 0.883208 deg off (3180 arcsec);
  * Krishnamurti, Raman, True Chitra, or any other named ayanamsa;
  * subtracting the MEAN ayanamsa from a true-equinox Ascendant — 3 to 18 arcsec
    here. The sidereal Ascendant is tropical-true-equinox minus TRUE ayanamsa, so
    nutation cancels; dropping it on one side only is a real, silent bug class;
  * latitude/longitude transposed, an east/west sign flip, or a wrong JD.

**What this cannot see**, recorded so a pass is not over-read:

  * **Local time to UT.** Every golden starts from a UT instant. Timezone and DST
    resolution happen upstream in `local_datetime_to_utc` and are not exercised.
  * **UT1.** Both sides treat UT as UT1. DUT1 is under 0.9 s, worth at most a few
    thousandths of a degree of Ascendant, and is common-mode here.
  * **The Lahiri definition itself.** Both sides anchor on the IAE epoch value;
    if that anchor were wrong, both would agree on the wrong number. It is the
    published definition, which is as external as an anchor gets.
  * **House cusps.** Whole-sign houses use only the Ascendant's rasi; no other
    cusp is computed or checked.
  * **Parity with a printed Tamil almanac's lagna.** That depends on the sunrise
    and ayanamsa a publisher uses — the still-open AR-5 item — not on this.

The goldens are pinned as literals so a reader sees the numbers, and
`test_reference_model_reproduces_the_pinned_goldens` proves those literals are
this model's output and not hand-edited. Places are city centres at arbitrary
instants — no real birth profile.
"""
from __future__ import annotations

import math
from datetime import UTC, datetime

import pytest

from app.calculations.astro import rasi_from_degree, utc_datetime_to_julian_day
from app.calculations.ephemeris import calculate_asc_mc, calculate_lagna_degree

pytestmark = pytest.mark.no_db

J2000 = 2451545.0
#: IAE Lahiri epoch, 1956-03-21 0h, and the MEAN ayanamsa there: the published
#: true value 23 deg 15' 00.658" less that instant's nutation in longitude.
LAHIRI_EPOCH_JD = 2435553.5
LAHIRI_MEAN_AT_EPOCH = 23.250182778 - 0.004658035

#: Fagan/Bradley minus Lahiri — how far an ayanamsa-mode regression moves every
#: sidereal longitude. Also recorded in tests/test_sidereal_ayanamsa_cold_start.py.
FAGAN_BRADLEY_OFFSET = 0.883208

TOLERANCE_ARCSEC = 2.0


def _general_precession_arcsec(t: float) -> float:
    """IAU 2006 general precession in longitude, arcsec, T in Julian centuries from J2000."""
    return 5028.796195 * t + 1.1054348 * t * t + 0.00007964 * t ** 3


def _reference_asc_mc(jd_ut: float, latitude: float, longitude: float) -> tuple[float, float]:
    """Sidereal (Lahiri) Ascendant and MC, degrees, from first principles."""
    t = (jd_ut - J2000) / 36525.0
    gmst = (
        280.46061837
        + 360.98564736629 * (jd_ut - J2000)
        + 0.000387933 * t * t
        - t ** 3 / 38710000.0
    )

    node = math.radians(125.04452 - 1934.136261 * t)
    sun = math.radians(280.4665 + 36000.7698 * t)
    moon = math.radians(218.3165 + 481267.8813 * t)
    dpsi = (
        -17.20 * math.sin(node) - 1.32 * math.sin(2 * sun)
        - 0.23 * math.sin(2 * moon) + 0.21 * math.sin(2 * node)
    )
    deps = (
        9.20 * math.cos(node) + 0.57 * math.cos(2 * sun)
        + 0.10 * math.cos(2 * moon) - 0.09 * math.cos(2 * node)
    )
    mean_obliquity = 23 + 26 / 60 + (21.448 - 46.8150 * t - 0.00059 * t * t + 0.001813 * t ** 3) / 3600
    eps = math.radians(mean_obliquity + deps / 3600)

    gast = gmst + dpsi / 3600 * math.cos(eps)
    ramc = math.radians((gast + longitude) % 360)
    phi = math.radians(latitude)

    mc = math.degrees(math.atan2(math.sin(ramc), math.cos(ramc) * math.cos(eps)))
    asc = math.degrees(
        math.atan2(math.cos(ramc), -(math.sin(ramc) * math.cos(eps) + math.tan(phi) * math.sin(eps)))
    )

    t_epoch = (LAHIRI_EPOCH_JD - J2000) / 36525.0
    mean_ayanamsa = LAHIRI_MEAN_AT_EPOCH + (
        _general_precession_arcsec(t) - _general_precession_arcsec(t_epoch)
    ) / 3600
    true_ayanamsa = mean_ayanamsa + dpsi / 3600
    return (asc - true_ayanamsa) % 360, (mc - true_ayanamsa) % 360


def _arcsec_apart(a: float, b: float) -> float:
    return abs(((a - b + 180) % 360) - 180) * 3600


def _jd(moment: datetime) -> float:
    return utc_datetime_to_julian_day(moment)


CHENNAI = (13.0827, 80.2707)
MADURAI = (9.9252, 78.1198)

# (label, UT instant, latitude, longitude, Lahiri Ascendant, Lahiri MC)
GOLDENS = [
    ("Chennai 1950", datetime(1950, 1, 1, 6, 30, tzinfo=UTC), *CHENNAI, 346.6565039, 254.2926432),
    ("Madurai J2000", datetime(2000, 1, 1, 12, 0, tzinfo=UTC), *MADURAI, 68.8278386, 334.5957644),
    ("Chennai Asc 0.40 into Mesham", datetime(2026, 9, 30, 13, 24, tzinfo=UTC), *CHENNAI, 0.4030585, 264.7757220),
    ("Chennai Asc 0.44 into Thulam", datetime(2026, 9, 30, 1, 44, tzinfo=UTC), *CHENNAI, 180.4441468, 89.0251622),
    ("Chennai MC 1.2 short of Mesham", datetime(2026, 9, 30, 19, 26, tzinfo=UTC), *CHENNAI, 90.3491417, 358.8194844),
    ("Madurai afternoon", datetime(2026, 9, 30, 7, 10, tzinfo=UTC), *MADURAI, 255.3200009, 171.6953640),
    ("London 51.5N", datetime(2012, 6, 21, 4, 0, tzinfo=UTC), 51.5074, -0.1278, 68.3737875, 303.4008261),
    ("Sydney 33.9S", datetime(2019, 12, 10, 22, 15, tzinfo=UTC), -33.8688, 151.2093, 281.1409964, 182.0782703),
    ("Toronto 43.7N", datetime(2031, 4, 2, 15, 5, tzinfo=UTC), 43.6532, -79.3832, 67.5808015, 311.5506983),
]
_IDS = [g[0] for g in GOLDENS]


def test_reference_model_reproduces_the_pinned_goldens():
    """The literals are this model's output, not numbers typed in by hand."""
    for label, moment, lat, lng, asc, mc in GOLDENS:
        ref_asc, ref_mc = _reference_asc_mc(_jd(moment), lat, lng)
        assert _arcsec_apart(ref_asc, asc) < 0.001, label
        assert _arcsec_apart(ref_mc, mc) < 0.001, label


@pytest.mark.parametrize(("label", "moment", "lat", "lng", "asc", "mc"), GOLDENS, ids=_IDS)
def test_lagna_degree_is_the_lahiri_golden(label, moment, lat, lng, asc, mc):
    got = calculate_lagna_degree(_jd(moment), lat, lng)
    gap = _arcsec_apart(got, asc)
    assert gap < TOLERANCE_ARCSEC, (
        f"{label}: Ascendant {got:.6f}, golden {asc:.6f}, {gap:.2f} arcsec apart. "
        f"~{FAGAN_BRADLEY_OFFSET * 3600:.0f} arcsec means the ayanamsa mode is Fagan/Bradley."
    )


@pytest.mark.parametrize(("label", "moment", "lat", "lng", "asc", "mc"), GOLDENS, ids=_IDS)
def test_asc_mc_is_the_lahiri_golden(label, moment, lat, lng, asc, mc):
    got_asc, got_mc = calculate_asc_mc(_jd(moment), lat, lng)
    assert _arcsec_apart(got_asc, asc) < TOLERANCE_ARCSEC, f"{label}: Asc {got_asc:.6f} vs {asc:.6f}"
    assert _arcsec_apart(got_mc, mc) < TOLERANCE_ARCSEC, f"{label}: MC {got_mc:.6f} vs {mc:.6f}"


@pytest.mark.parametrize(("label", "moment", "lat", "lng", "asc", "mc"), GOLDENS, ids=_IDS)
def test_both_ascendant_entry_points_agree_exactly(label, moment, lat, lng, asc, mc):
    """Two functions, one Ascendant. The chart and Dig Bala must not disagree."""
    jd = _jd(moment)
    assert calculate_asc_mc(jd, lat, lng)[0] == calculate_lagna_degree(jd, lat, lng), label


def test_sign_edge_goldens_discriminate_the_ayanamsa():
    """The goldens that would change RASI, not merely degree, under Fagan/Bradley.

    A tolerance catches any ayanamsa error on any case. These two are here so
    the failure is also visible where a reader sees it — the lagna rasi — and
    the assertion checks the cases really do sit that close to the boundary,
    so a later edit to the table cannot quietly remove the teeth.
    """
    edges = {label: asc for label, _m, _la, _ln, asc, _mc in GOLDENS if "into" in label}
    assert set(edges) == {"Chennai Asc 0.40 into Mesham", "Chennai Asc 0.44 into Thulam"}
    for label, asc in edges.items():
        assert asc % 30 < FAGAN_BRADLEY_OFFSET, f"{label} no longer sits within the offset of its cusp"
        assert rasi_from_degree(asc - FAGAN_BRADLEY_OFFSET) != rasi_from_degree(asc), label
    assert rasi_from_degree(edges["Chennai Asc 0.40 into Mesham"]) == 1
    assert rasi_from_degree(edges["Chennai Asc 0.44 into Thulam"]) == 7


def test_ascendant_reference_is_latitude_sensitive_and_mc_is_not():
    """A property of the formulas, pinned so the reference cannot silently lose
    its latitude term: move the observer north along one meridian and the MC
    holds still while the Ascendant moves."""
    jd = _jd(datetime(2026, 9, 30, 7, 10, tzinfo=UTC))
    asc_south, mc_south = _reference_asc_mc(jd, 8.0, 78.1198)
    asc_north, mc_north = _reference_asc_mc(jd, 30.0, 78.1198)
    assert _arcsec_apart(mc_south, mc_north) < 1e-6
    assert _arcsec_apart(asc_south, asc_north) > 3600
