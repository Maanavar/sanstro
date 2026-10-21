"""FSA-03 — the nakshatra pages' dasa timings are the engine's, and are right.

`web/lib/generated/natchathiram-dasa-timings.ts` is written by
`scripts/generate_natchathiram_dasa_timings.py` from `app/calculations/dasha.py`.
The first test fails when that file is stale. The rest re-derive what the
owner's ruling (2026-10-21) requires of the numbers, independently of the
generator's own loop: the lord sequences, the bhukti boundaries, the
elapsed-time-to-age conversion and the birth balance.

What this cannot see: whether a page *renders* these numbers rather than
prose typed beside them. That is `web/lib/natchathiram-dasa-prose.test.ts`.
"""
from __future__ import annotations

import importlib.util
from datetime import UTC, datetime
from pathlib import Path

import pytest

from app.calculations.astro import julian_day_to_utc_datetime
from app.calculations.dasha import (
    DASHA_YEARS,
    JULIAN_YEAR_DAYS,
    NAK_LORD,
    NAKSHATRA_SIZE_DEGREES,
    SEQUENCE,
    calculate_vimshottari_timeline,
)

pytestmark = pytest.mark.no_db

REPO = Path(__file__).resolve().parent.parent
TOL = 2e-6  # the file rounds to 1e-6 years (about 30 seconds)


def _generator():
    path = REPO / "scripts" / "generate_natchathiram_dasa_timings.py"
    spec = importlib.util.spec_from_file_location("generate_natchathiram_dasa_timings", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def stars() -> list[dict]:
    return _generator().build()


def test_committed_timings_are_current() -> None:
    generator = _generator()
    expected = generator.render(generator.build())
    committed = generator.OUTPUT.read_text(encoding="utf-8")
    assert committed == expected, (
        "web/lib/generated/natchathiram-dasa-timings.ts is stale — run "
        "`python scripts/generate_natchathiram_dasa_timings.py` and commit the result."
    )


def _rotation(start: str) -> list[str]:
    i = SEQUENCE.index(start)
    return SEQUENCE[i:] + SEQUENCE[:i]


def test_mahadasha_sequence_starts_from_the_star_lord(stars: list[dict]) -> None:
    for star in stars:
        n = star["nakshatra"]
        assert star["openingLord"] == NAK_LORD[n] == SEQUENCE[(n - 1) % 9]
        assert [md["lord"] for md in star["mahadashas"]] == _rotation(NAK_LORD[n])
        assert [md["isOpening"] for md in star["mahadashas"]] == [True] + [False] * 8


def test_bhukti_sequence_starts_from_the_dasa_lord(stars: list[dict]) -> None:
    for star in stars:
        for md in star["mahadashas"]:
            assert [b["lord"] for b in md["bhuktis"]] == _rotation(md["lord"])


def test_bhuktis_tile_the_dasa_exactly(stars: list[dict]) -> None:
    for star in stars:
        for md in star["mahadashas"]:
            assert md["years"] == DASHA_YEARS[md["lord"]]
            cursor = 0.0
            for b in md["bhuktis"]:
                assert b["durationYears"] == pytest.approx(md["years"] * DASHA_YEARS[b["lord"]] / 120, abs=TOL)
                assert b["offsetYears"] == pytest.approx(cursor, abs=TOL)
                cursor += b["durationYears"]
            assert cursor == pytest.approx(md["years"], abs=10 * TOL)


def test_the_example_the_ruling_was_drafted_with() -> None:
    """Venus–Rahu begins 7 yr 2 mo into Venus dasa — not the 12 yr 6 mo first drafted."""
    venus = next(md for md in _generator().build()[1]["mahadashas"] if md["lord"] == "VENUS")
    rahu = next(b for b in venus["bhuktis"] if b["lord"] == "RAHU")
    assert rahu["offset"] == [7, 2, 0]
    assert rahu["duration"] == [3, 0, 0]


def test_birth_balance_bounds_every_age(stars: list[dict]) -> None:
    """A native is born with between none and all of the opening dasa left."""
    for star in stars:
        opening = star["mahadashas"][0]
        width = DASHA_YEARS[opening["lord"]]
        assert opening["minStartAgeYears"] == opening["maxStartAgeYears"] == 0.0
        assert (opening["minEndAgeYears"], opening["maxEndAgeYears"]) == pytest.approx((0.0, width), abs=TOL)
        elapsed = 0.0
        for md in star["mahadashas"][1:]:
            # Starts after the balance plus every full dasa before it.
            assert md["minStartAgeYears"] == pytest.approx(elapsed, abs=TOL)
            assert md["maxStartAgeYears"] == pytest.approx(elapsed + width, abs=TOL)
            for b in md["bhuktis"]:
                assert b["minStartAgeYears"] == pytest.approx(md["minStartAgeYears"] + b["offsetYears"], abs=TOL)
                assert b["maxStartAgeYears"] == pytest.approx(md["maxStartAgeYears"] + b["offsetYears"], abs=TOL)
                assert not b["canPrecedeBirth"]
            elapsed += md["years"]
        for b in opening["bhuktis"]:
            # Born at the first degree the opening bhukti runs from its offset;
            # born at the last, the whole dasa lay before birth.
            assert b["maxStartAgeYears"] == pytest.approx(b["offsetYears"], abs=TOL)
            assert b["minStartAgeYears"] == pytest.approx(b["offsetYears"] - width, abs=TOL)
            assert b["canPrecedeBirth"] == (b["minStartAgeYears"] < 0)


def test_pada_balances_quarter_the_opening_dasa(stars: list[dict]) -> None:
    """Pada p leaves between (4-p)/4 and (5-p)/4 of the opening dasa at birth."""
    for star in stars:
        width = DASHA_YEARS[star["openingLord"]]
        assert [p["pada"] for p in star["balanceByPada"]] == [1, 2, 3, 4]
        for p in star["balanceByPada"]:
            assert p["maxYears"] == pytest.approx(width * (5 - p["pada"]) / 4, abs=TOL)
            assert p["minYears"] == pytest.approx(width * (4 - p["pada"]) / 4, abs=TOL)


def test_ages_agree_with_calendar_dates_from_a_real_timeline(stars: list[dict]) -> None:
    """Elapsed time -> age, checked through the engine's own calendar dates.

    A synthetic birth, Moon a quarter of the way into Rohini: the age at which
    each dasa starts on the calendar must sit inside the file's range, and at the
    balance-proportional point within it.
    """
    birth = datetime(1990, 1, 1, tzinfo=UTC)
    birth_jd = birth.timestamp() / 86400 + 2440587.5
    rohini = 4
    moon = (rohini - 1) * NAKSHATRA_SIZE_DEGREES + 0.25 * NAKSHATRA_SIZE_DEGREES
    timeline = calculate_vimshottari_timeline(birth_jd, moon)
    balance = timeline.balance_years_at_birth
    assert balance == pytest.approx(0.75 * DASHA_YEARS["MOON"])

    for md, period in zip(stars[rohini - 1]["mahadashas"][1:], timeline.mahadashas[1:9], strict=True):
        start = julian_day_to_utc_datetime(period.start_jd)
        age = (start - birth).total_seconds() / 86400 / JULIAN_YEAR_DAYS
        assert md["minStartAgeYears"] - TOL <= age <= md["maxStartAgeYears"] + TOL
        share = (age - md["minStartAgeYears"]) / (md["maxStartAgeYears"] - md["minStartAgeYears"])
        assert share == pytest.approx(0.75, abs=1e-6)


@pytest.mark.parametrize(
    ("years", "ymd"),
    [(3 + 1 / 3, [3, 4, 0]), (7 * 7 / 120, [0, 4, 27]), (7 * 17 / 120, [0, 11, 27]), (0.0, [0, 0, 0])],
)
def test_year_month_day_writes_the_same_number(years: float, ymd: list[int]) -> None:
    assert _generator()._ymd(years) == ymd
    y, m, d = ymd
    assert y + m / 12 + d / 360 == pytest.approx(years, abs=1 / 720)
