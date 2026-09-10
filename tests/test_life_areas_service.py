from datetime import date, timedelta

from app.services.life_areas_service import (
    _CHANDRASHTAMA_AREAS,
    _TREND_DELTA,
    _duration_caution,
    _narrative,
    _trend,
)

# ── Trend arrow ────────────────────────────────────────────────────────────────
# `_trend` used to be a function of the current score alone — score < 45 meant
# "DOWN" — so a tile reading "Money 16 ↓" was not saying money was falling, it
# was saying 16 is a low number. It now measures the real six-month slope.


def test_trend_reads_the_six_month_slope_not_the_current_level():
    # A low score that is climbing must read UP, and a high one that is falling
    # must read DOWN. Both were impossible under the old level-only rule.
    assert _trend(16, 16 + _TREND_DELTA) == "UP"
    assert _trend(82, 82 - _TREND_DELTA) == "DOWN"


def test_trend_ignores_moves_smaller_than_the_ashtakavarga_jitter():
    # The ashtakavarga term alone swings a score by up to ±4 when the area's
    # karaka changes rasi, which is not a change of direction.
    for delta in range(-(_TREND_DELTA - 1), _TREND_DELTA):
        assert _trend(50, 50 + delta) == "STABLE", delta


def test_trend_is_flat_when_nothing_moves():
    for score in (0, 16, 45, 54, 70, 100):
        assert _trend(score, score) == "STABLE"


def test_chandrashtama_areas_are_the_mind_sensitive_ones():
    # The client's `chandrashtamaApplied` flag is derived from this same set, so
    # the marker on a tile can never disagree with the penalty on its score.
    assert _CHANDRASHTAMA_AREAS == frozenset(
        {"HEALTH", "RELATIONSHIPS", "FAMILY_HARMONY", "EDUCATION"}
    )
    assert "CAREER" not in _CHANDRASHTAMA_AREAS
    assert "MONEY" not in _CHANDRASHTAMA_AREAS


def test_low_score_health_caution_uses_non_chandrashtama_text_when_false():
    bundle = _narrative(
        area="HEALTH",
        score=40,
        maha_lord="MOON",
        sani_active=True,
        sani_type="ASHTAMA_SANI",
        chandrashtama=False,
        jupiter_house=7,
        saturn_house=4,
    )
    assert bundle.caution is not None
    assert "Chandrashtamam" not in bundle.caution.en
    assert "Ashtama Sani" in bundle.caution.en


def test_low_score_health_caution_mentions_chandrashtama_when_true():
    bundle = _narrative(
        area="HEALTH",
        score=40,
        maha_lord="MOON",
        sani_active=True,
        sani_type="ASHTAMA_SANI",
        chandrashtama=True,
        jupiter_house=7,
        saturn_house=4,
    )
    assert bundle.caution is not None
    assert "Chandrashtamam" in bundle.caution.en


def test_low_score_relationship_caution_is_conditional():
    bundle_no_chandra = _narrative(
        area="RELATIONSHIPS",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=False,
        jupiter_house=7,
        saturn_house=4,
    )
    bundle_with_chandra = _narrative(
        area="RELATIONSHIPS",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=True,
        jupiter_house=7,
        saturn_house=4,
    )

    assert bundle_no_chandra.caution is not None
    assert bundle_with_chandra.caution is not None
    assert "Chandrashtamam" not in bundle_no_chandra.caution.en
    assert "Chandrashtamam" in bundle_with_chandra.caution.en


def test_low_score_education_caution_is_conditional():
    bundle_no_chandra = _narrative(
        area="EDUCATION",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=False,
        jupiter_house=7,
        saturn_house=4,
    )
    bundle_with_chandra = _narrative(
        area="EDUCATION",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=True,
        jupiter_house=7,
        saturn_house=4,
    )

    assert bundle_no_chandra.caution is not None
    assert bundle_with_chandra.caution is not None
    assert "Chandrashtamam" not in bundle_no_chandra.caution.en
    assert "Chandrashtamam" in bundle_with_chandra.caution.en


def test_low_score_family_caution_is_conditional():
    bundle_no_chandra = _narrative(
        area="FAMILY_HARMONY",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=False,
        jupiter_house=7,
        saturn_house=4,
    )
    bundle_with_chandra = _narrative(
        area="FAMILY_HARMONY",
        score=40,
        maha_lord="MOON",
        sani_active=False,
        sani_type=None,
        chandrashtama=True,
        jupiter_house=7,
        saturn_house=4,
    )

    assert bundle_no_chandra.caution is not None
    assert bundle_with_chandra.caution is not None
    assert "Chandrashtamam" not in bundle_no_chandra.caution.en
    assert "Chandrashtamam" in bundle_with_chandra.caution.en


def test_duration_caution_includes_until_date_and_action():
    caution = _duration_caution("CAREER", date(2026, 9, 1))
    assert "until" in caution.en.lower()
    assert "Improvement starts" in caution.en


# ── "Conditions improve after <date>" ─────────────────────────────────────────
# `_find_next_improvement_date` feeds two sentences the reader acts on:
# `_with_improvement_hint`'s "Conditions improve after 14 Oct 2026" and
# `_duration_caution`'s "This challenging period lasts until 14 Oct 2026.
# Improvement starts clearly after this date." Both name a specific date, so the
# date has to be one the engine actually stands behind.
#
# The scan itself is stubbed here — the astrology is `_score_area`'s job and is
# tested there. What is under test is which of the scanned days gets printed.

def _scan_with(improving_from: date | None, on_date: date, monkeypatch):
    """Run the real search over a fake area whose score lifts on `improving_from`."""
    from types import SimpleNamespace

    from app.services import life_areas_service as svc

    tested: list[date] = []

    def fake_scan(birth_jd, moon_longitude, check_jd):
        # The real signature returns (transit_bodies, maha_lord, antar_lord).
        # The check date rides along in the bodies dict so the fake score below
        # can be a function of it without depending on call order.
        return (
            {"MOON": SimpleNamespace(rasi=1), "SATURN": SimpleNamespace(rasi=1), "_jd": check_jd},
            "SUN",
            "SUN",
        )

    def fake_score(area, natal_moon_rasi, transit_bodies, *args, **kwargs):
        from app.calculations.astro import julian_day_to_utc_datetime

        check_date = julian_day_to_utc_datetime(transit_bodies["_jd"]).date()
        tested.append(check_date)
        improved = improving_from is not None and check_date >= improving_from
        return (90 if improved else 10), None, None

    monkeypatch.setattr(svc, "_improvement_scan_at", fake_scan)
    monkeypatch.setattr(svc, "_score_area", fake_score)
    # The scan asks for each date's Chandrashtama rasi share, which is real
    # ephemeris. Stubbed to zero: this test is about WHICH scanned day gets
    # printed, and a term that moves four areas by up to 8 points would make the
    # fake score above depend on the sky rather than on `improving_from`.
    monkeypatch.setattr(svc, "_moon_rasi_spans_for_day", lambda *a, **k: ())

    found = svc._find_next_improvement_date(
        area="CAREER",
        current_score=10,
        on_date=on_date,
        birth_jd=0.0,
        natal_moon_rasi=1,
        natal_lagna_rasi=1,
        moon_longitude=0.0,
        natal_planet_scores={},
        natal_planet_rasis={},
        vargas=None,
        bav=None,
        sav=None,
        native_age=30,
        location=svc.EffectiveDailyLocation(
            place="Test", latitude=13.0827, longitude=80.2707,
            timezone="Asia/Kolkata", source="birth",
        ),
    )
    return found, tested


def test_the_improvement_date_is_the_first_improving_day_not_the_weekly_sample(monkeypatch):
    """The coarse pass steps a week at a time, so its hit is a grid artifact.

    A lift that begins on the 10th is first *seen* on the 14th — the second
    weekly sample — and printing the 14th tells the reader to wait four days
    longer than the chart says they must. The refinement walks back into the
    week that was cleared and names the day the lift actually began.
    """
    on_date = date(2026, 9, 1)
    found, _ = _scan_with(date(2026, 9, 10), on_date, monkeypatch)

    assert found == date(2026, 9, 10)


def test_the_improvement_date_never_precedes_a_week_that_was_tested_and_rejected(monkeypatch):
    """The walk-back is bounded by the previous sample, which did not improve.

    A lift beginning exactly on a sample day must be reported on that day, not
    walked back into the week before it — that week was measured and was worse.
    """
    on_date = date(2026, 9, 1)
    found, _ = _scan_with(date(2026, 9, 15), on_date, monkeypatch)

    assert found == date(2026, 9, 15)  # on_date + 14, a sample day exactly


def test_no_improving_day_reports_nothing_rather_than_a_date_it_rejected(monkeypatch):
    """The fabricated fallback this replaces.

    A fruitless 180-day scan used to return `on_date + 90` — a date it had
    tested at 84 and 91 days and found no improvement at either. That date then
    went straight into "This challenging period lasts until <date>. Improvement
    starts clearly after this date." The engine must not name a day it has
    disproved; the caller drops to the area's own caution copy instead.
    """
    on_date = date(2026, 9, 1)
    found, tested = _scan_with(None, on_date, monkeypatch)

    assert found is None
    assert max(tested) == on_date + timedelta(days=175)


def test_the_refinement_only_runs_inside_a_week_already_known_to_improve(monkeypatch):
    """Cost, stated as a bound rather than assumed.

    26 weekly samples, plus at most six day-steps and only after a hit. A
    coarse-to-fine scheme that skipped weeks would be cheaper and would change
    which date is returned; this one cannot, because every week up to the answer
    is still tested.
    """
    on_date = date(2026, 9, 1)
    _, tested = _scan_with(date(2026, 9, 10), on_date, monkeypatch)

    assert len(tested) <= 26 + 6
    weekly = [d for d in tested if (d - on_date).days % 7 == 0]
    assert weekly == [on_date + timedelta(days=7), on_date + timedelta(days=14)]
