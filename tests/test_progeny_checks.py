"""V1 §18 Q13 step three: the D7 and dasa checks on children's doshams.

Synthetic longitudes only, built so each D7 fact is known by hand:

* Lagna at Mesham 15° → saptamsa 4 of an odd sign → D7 lagna Katakam (4).
  The D7 5th is then Viruchigam (8), lord Mars.
* A planet at Simmam 13° (133°) → Simmam is odd, part 3 → D7 Viruchigam (8),
  the D7 5th. A planet at Mesham 13° → D7 Katakam (4), the D7 lagna.
"""

from __future__ import annotations

from datetime import UTC, date, datetime

import pytest

from app.calculations.astro import utc_datetime_to_julian_day
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.progeny_checks import (
    MAX_WINDOWS,
    afflictors_in,
    check_d7,
    check_dasha,
    check_progeny,
)

LAGNA = 15.0  # Mesham 15°: about 8.6 minutes from the nearest D7 boundary.


def _longitudes(**over: float) -> dict[str, float]:
    base = {
        "SUN": 250.0, "MOON": 40.0, "MARS": 13.0, "MERCURY": 260.0,
        "JUPITER": 133.0, "VENUS": 300.0, "SATURN": 320.0,
        "RAHU": 20.0, "KETU": 200.0,
    }
    base.update(over)
    return base


def test_afflictors_come_from_the_dosham_own_conditions() -> None:
    assert afflictors_in("PUTRA_SARPA_DOSHAM", ["fifth_house_has_ketu"]) == ("KETU",)
    assert afflictors_in("PUTRA_SARPA_DOSHAM", ["fifth_house_has_ketu", "jupiter_joined_by_rahu"]) == ("KETU", "RAHU")
    assert afflictors_in("SANTHANA_THADAI", ["fifth_lord_venus_joined_by_saturn"]) == ("SATURN",)
    # Saturn never afflicts Putra Sarpa, nodes never Santhana Thadai (AAU-12).
    assert afflictors_in("PUTRA_SARPA_DOSHAM", ["fifth_house_has_saturn"]) == ()


def test_d7_repeats_when_the_afflictor_sits_in_the_d7_fifth() -> None:
    d7 = check_d7(_longitudes(KETU=133.0, JUPITER=60.0), LAGNA, ("KETU",))
    assert (d7.lagna_rasi, d7.fifth_rasi, d7.fifth_lord) == (4, 8, "MARS")
    assert d7.houses_reliable
    assert d7.repeated_by == ("KETU",)
    assert d7.verdict == "REPEATS"


def test_d7_supports_with_jupiter_in_the_d7_fifth_and_a_well_placed_lord() -> None:
    # Jupiter in the D7 5th, Mars (D7 5th lord) on the D7 lagna, Ketu elsewhere.
    d7 = check_d7(_longitudes(), LAGNA, ("KETU",))
    assert d7.fifth_lord_house == 1 and d7.jupiter_house == 5
    assert d7.jupiter_supports and not d7.fifth_lord_in_dusthana
    assert d7.verdict == "SUPPORTS"


def test_a_node_on_jupiter_in_the_d7_takes_its_support_away() -> None:
    d7 = check_d7(_longitudes(RAHU=133.0), LAGNA, ("KETU",))
    assert not d7.jupiter_supports


def test_d7_gives_no_verdict_when_the_birth_time_cannot_carry_it() -> None:
    loose = check_d7(_longitudes(KETU=133.0), LAGNA, ("KETU",), birth_time_confidence_minutes=10)
    assert not loose.houses_reliable and loose.verdict == "UNCERTAIN"
    # A rising degree 0.1° from a D7 boundary: under half a minute of margin.
    edge = check_d7(_longitudes(KETU=133.0), 30.0 / 7.0 * 3 + 0.1, ("KETU",))
    assert edge.margin_minutes == 0 and edge.verdict == "UNCERTAIN"


@pytest.fixture()
def mahadashas():
    birth = datetime(1993, 3, 14, 6, 0, tzinfo=UTC)
    timeline = calculate_vimshottari_timeline(utc_datetime_to_julian_day(birth), 40.0)
    return birth.date(), timeline.mahadashas


def test_dasha_windows_are_the_afflictor_and_supporter_periods_only(mahadashas) -> None:
    birth, periods = mahadashas
    as_of = date(2026, 11, 9)
    check = check_dasha(
        periods, lagna_rasi=1, afflictors=("KETU",),
        conditions_met=["fifth_house_has_ketu"], birth_date=birth, as_of=as_of,
    )
    # Mesham lagna: the 5th is Simmam, lord Sun. Jupiter and the Sun support.
    assert check.supporting_lords == ("JUPITER", "SUN")
    assert check.age_band == "CHILDBEARING"
    assert 0 < len(check.windows) <= MAX_WINDOWS
    for w in check.windows:
        assert w.end > as_of
        involved = {w.lord, w.maha_lord}
        assert involved & {"KETU", "JUPITER", "SUN"}
        if w.kind == "AFFLICTION":
            assert "KETU" in involved
    assert sum(w.is_current for w in check.windows) <= 1


def test_a_lord_carrying_the_afflictor_is_not_counted_as_support(mahadashas) -> None:
    birth, periods = mahadashas
    check = check_dasha(
        periods, lagna_rasi=1, afflictors=("RAHU",),
        conditions_met=["fifth_house_has_rahu", "jupiter_joined_by_rahu"],
        birth_date=birth, as_of=date(2026, 11, 9),
    )
    assert "JUPITER" not in check.supporting_lords


def test_age_bands(mahadashas) -> None:
    birth, periods = mahadashas
    kw = dict(lagna_rasi=1, afflictors=("KETU",), conditions_met=["fifth_house_has_ketu"], birth_date=birth)
    assert check_dasha(periods, as_of=date(2005, 1, 1), **kw).age_band == "UNDER_18"
    assert check_dasha(periods, as_of=date(2045, 1, 1), **kw).age_band == "PAST"


def test_only_children_doshams_get_checks(mahadashas) -> None:
    birth, periods = mahadashas
    kw = dict(
        lagna_rasi=1, lagna_longitude=LAGNA, longitudes=_longitudes(),
        mahadashas=periods, birth_date=birth, as_of=date(2026, 11, 9),
    )
    assert check_progeny("SEVVAI_DOSHAM", ["mars_in_7"], **kw) is None
    checks = check_progeny("PUTRA_SARPA_DOSHAM", ["fifth_house_has_ketu"], **kw)
    assert checks is not None and checks.tier == "engine_inference"


def test_checks_never_reach_the_grade() -> None:
    """Q18: engine_inference describes and times. The result type carries no
    grade, residual, parihara or outlook field for a consumer to read."""
    from app.calculations.progeny_checks import ProgenyChecks

    fields = set(ProgenyChecks.__dataclass_fields__)
    assert not fields & {"strength", "residual", "parihara", "progeny_outlook", "formation_strength"}


# ── Through the production assembler (`_chart_build._build_yoga_dosham_insights`) ──

def _position(graha: str, rasi: int, degree: float = 15.0):
    from app.calculations.chart_strength import d9_dignity_label
    from app.schemas.charts import PlanetPosition

    return PlanetPosition(
        graha=graha, rasi_name=f"Rasi{rasi}", absolute_longitude=(rasi - 1) * 30.0 + degree,
        rasi=rasi, degree_in_rasi=degree, nakshatra=1, nakshatra_name="Ashwini", pada=1,
        house_from_lagna=((rasi - 1) % 12) + 1, speed_deg_per_day=1.0, is_retrograde=False,
        is_combust=False, d9_rasi=rasi, d9_dignity=d9_dignity_label(graha, rasi),
        is_vargottama=False, show_retrograde_badge=False, strength_score=50,
    )


def _insights(lagna_longitude: float | None):
    from app.services._chart_build import _build_yoga_dosham_insights

    # Mesham lagna; Ketu in Simmam, the 5th, declares Putra Sarpa (synthetic).
    planets = [
        _position("SUN", 9), _position("MOON", 2), _position("MARS", 1),
        _position("MERCURY", 9), _position("JUPITER", 5, 13.0), _position("VENUS", 10),
        _position("SATURN", 11), _position("RAHU", 11), _position("KETU", 5, 20.0),
    ]
    jd = utc_datetime_to_julian_day(datetime(1993, 3, 14, 6, 0, tzinfo=UTC))
    _, doshams, _ = _build_yoga_dosham_insights(
        planets, lagna_rasi=1, moon_rasi=2, birth_jd=jd, lagna_longitude=lagna_longitude,
    )
    return next(d for d in doshams if d.name == "PUTRA_SARPA_DOSHAM")


@pytest.mark.no_db
def test_assembler_attaches_checks_and_leaves_every_grade_field_alone() -> None:
    without = _insights(None)
    with_checks = _insights(LAGNA)
    assert without.is_present and with_checks.is_present
    assert without.progeny_checks is None
    assert with_checks.progeny_checks is not None
    # Q18: the checks describe and time; the grade, residual, parihara and
    # outlook are byte-for-byte what the chart says without them.
    for attr in ("strength", "formation_strength", "residual", "progeny_outlook", "label"):
        assert getattr(with_checks, attr) == getattr(without, attr), attr
    assert with_checks.assessment == without.assessment
    # The "not yet read" note gives way to the "read, not yet ratified" one.
    assert "children_assessment_incomplete" in without.context_notes
    assert "children_assessment_incomplete" not in with_checks.context_notes
    assert "children_d7_dasha_unratified" in with_checks.context_notes
    wire = with_checks.model_dump(by_alias=True, mode="json")
    assert wire["progenyChecks"]["d7"]["verdict"] in {"REPEATS", "STRAINED", "SUPPORTS", "MIXED", "UNCERTAIN"}
    assert wire["progenyChecks"]["tier"] == "engine_inference"


def test_birth_time_guard_withholds_about_one_chart_in_four() -> None:
    """Plan item 0, measured. A D7 part is 30/7 deg, about 17 minutes of rising
    time; a 2-minute margin each side withholds about 4/17 = 23.3% of uniformly
    spread lagnas. The first build's 5-minute margin withheld about 58%."""
    import random

    from app.calculations.progeny_checks import D7_MARGIN_MINUTES, _d7_margin_minutes

    rng = random.Random(7)
    n = 100_000
    share = sum(_d7_margin_minutes(rng.uniform(0, 360)) < D7_MARGIN_MINUTES for _ in range(n)) / n
    assert 0.21 <= share <= 0.26, share


# ── Plan item 0, review 2026-11-09: the guard from the real ephemeris ───────────

def test_a_bracket_that_crosses_a_d7_boundary_withholds_the_verdict() -> None:
    boundary = 30.0 / 7.0 * 4  # Mesham, end of part 4 (D7 Katakam)
    # Lagna 0.3 deg before the boundary, rising 0.25 deg/min: +2 min crosses it.
    d7 = check_d7(_longitudes(KETU=133.0), boundary - 0.3, ("KETU",), lagna_bracket=(boundary - 0.8, boundary + 0.2))
    assert not d7.houses_reliable and d7.verdict == "UNCERTAIN"
    assert d7.margin_minutes == 1  # 0.3 deg at 0.25 deg/min = 1.2 min


def test_the_bracket_uses_this_charts_rising_rate_not_the_average() -> None:
    """0.4 deg from a boundary. The 4 min/deg average calls that 1.6 min and
    withholds; a slow-rising sign (0.1 deg/min) is 4 minutes away and stable."""
    boundary = 30.0 / 7.0 * 4  # part 4: D7 Katakam, so Ketu at 133 deg is in the D7 5th
    lagna = boundary - 0.4
    averaged = check_d7(_longitudes(KETU=133.0), lagna, ("KETU",))
    assert averaged.verdict == "UNCERTAIN"
    slow = check_d7(_longitudes(KETU=133.0), lagna, ("KETU",), lagna_bracket=(lagna - 0.2, lagna + 0.2))
    assert slow.houses_reliable and slow.verdict == "REPEATS"
    assert slow.margin_minutes == 4
    # And the reverse, a fast-rising sign the average wrongly trusts: 0.6 deg
    # from a boundary is 2.4 min by the average, but at 0.4 deg/min it is 1.5.
    fast_lagna = boundary - 0.6
    assert check_d7(_longitudes(KETU=133.0), fast_lagna, ("KETU",)).houses_reliable
    fast = check_d7(_longitudes(KETU=133.0), fast_lagna, ("KETU",), lagna_bracket=(fast_lagna - 0.8, fast_lagna + 0.8))
    assert not fast.houses_reliable


def test_a_loose_birth_time_withholds_even_with_a_stable_bracket() -> None:
    d7 = check_d7(_longitudes(), LAGNA, ("KETU",), birth_time_confidence_minutes=5, lagna_bracket=(LAGNA - 0.5, LAGNA + 0.5))
    assert d7.verdict == "UNCERTAIN"


def _guard_sweep(n: int, tolerance_minutes: float, seed: int = 3) -> dict[str, float]:
    """Share of synthetic birth moments whose D7 lagna changes within
    +/-tolerance, with the real ephemeris, over times and latitudes."""
    import random

    from app.calculations.ephemeris import calculate_lagna_degree
    from app.calculations.progeny_checks import _d7_sign

    rng = random.Random(seed)
    step = tolerance_minutes / 1440.0
    bands: dict[str, list[int]] = {"0-20N": [0, 0], "20-40N": [0, 0], "40-56N": [0, 0]}
    for _ in range(n):
        jd = 2433282.5 + rng.uniform(0, 365.25 * 60)  # 1950-2010
        lat = rng.uniform(0.0, 56.0)
        lon = rng.uniform(-10.0, 140.0)
        signs = {_d7_sign(calculate_lagna_degree(jd + k * step, lat, lon)) for k in (-1, 0, 1)}
        band = "0-20N" if lat < 20 else "20-40N" if lat < 40 else "40-56N"
        bands[band][0] += len(signs) > 1
        bands[band][1] += 1
    out = {k: v[0] / v[1] for k, v in bands.items()}
    out["all"] = sum(v[0] for v in bands.values()) / n
    return out


def test_birth_time_guard_share_from_the_ephemeris() -> None:
    """Plan item 0, re-measured on real birth moments. The lagna crosses
    12 x 7 = 84 D7 boundaries a sidereal day (~1436 min), so a +/-2 minute
    window catches one about 84 x 4 / 1436 = 23.4% of the time at any
    latitude. Measured 2026-11-09: see the assertion message.
    Blind spot: it measures the guard's rate, not whether the astrologer
    agrees 2 minutes is the right tolerance (that is the ruling owed)."""
    shares = _guard_sweep(6000, 2.0)
    assert 0.21 <= shares["all"] <= 0.26, shares
    for band in ("0-20N", "20-40N", "40-56N"):
        assert 0.19 <= shares[band] <= 0.28, shares
