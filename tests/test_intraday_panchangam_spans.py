"""Regression coverage for intra-day panchangam transitions (doctrine R-1/R-2/R-3).

A civil day routinely carries two nakshatras, two tithis, two or three yogas and
three karanas. Until 2026-08-19 every consumer collapsed the day to the value at
sunrise (and one — the Moon score — to the value at solar noon), so a limb that
held fifteen minutes of the day carried a full day's score.

Ruled 2026-08-19:

* **R-1** — the sunrise (உதய) value still *names* the day; the score is
  duration-weighted over the solar day.
* **R-2** — Tara Bala, chandrashtama and the Moon score follow the same epoch as
  the almanac score, ending the sunrise/solar-noon split.
* **R-3** — a star that never holds a sunrise is still findable, so a native does
  not lose a Pirantha Naal to a rounding convention.

The anchor date is **2026-08-19 at Chennai**, the day that exposed the bug:
sunrise 06:00:32, Swathi ends 06:47 (3.2% of the day), Visakam holds the rest.
"""

from datetime import UTC, date, datetime, timedelta

import pytest

from app.calculations.panchangam import (
    PanchangamLimbSpan,
    calculate_daily_panchangam,
    dominant_from_spans,
    dominant_span_name,
    limb_fraction,
    limb_weighted,
)
from app.services._dg_scoring import weighted_panchangam_score
from app.services.pirantha_naal_service import next_janma_nakshatra_date

CHENNAI = (13.0827, 80.2707, "Asia/Kolkata")
ANCHOR = date(2026, 8, 19)

pytestmark = pytest.mark.no_db


@pytest.fixture(scope="module")
def snapshot():
    lat, lon, tz = CHENNAI
    return calculate_daily_panchangam(ANCHOR, lat, lon, tz, session=None, use_cache=False)


def _span(number: int, name: str, fraction: float) -> PanchangamLimbSpan:
    base = datetime(2026, 8, 19, 6, 0, tzinfo=UTC)
    return PanchangamLimbSpan(
        number=number, name=name, start=base, end=base + timedelta(days=1), fraction=fraction,
    )


class TestSpansDescribeTheWholeSolarDay:
    @pytest.mark.parametrize("limb", ["tithi_spans", "nakshatra_spans", "yoga_spans", "karana_spans"])
    def test_spans_tile_the_day_without_gap_or_overlap(self, snapshot, limb):
        spans = getattr(snapshot, limb)
        assert spans, f"{limb} must be populated"
        assert sum(s.fraction for s in spans) == pytest.approx(1.0, abs=1e-6)
        for earlier, later in zip(spans, spans[1:]):
            assert earlier.end == later.start

    def test_the_day_runs_sunrise_to_next_sunrise_not_midnight_to_midnight(self, snapshot):
        # Every other anchor on the snapshot (rahu kalam, the gowri slots, the
        # hora chain) is measured from sunrise, so a duration-weighted score has
        # to be weighted over that same day or it is weighting a different one.
        assert snapshot.nakshatra_spans[0].start == snapshot.sunrise
        total = snapshot.nakshatra_spans[-1].end - snapshot.nakshatra_spans[0].start
        assert timedelta(hours=23) < total < timedelta(hours=25)

    def test_the_anchor_day_really_is_3_percent_swathi(self, snapshot):
        """The reported symptom, pinned as a number."""
        assert snapshot.nakshatra_name == "SWATHI"          # what the almanac calls it
        assert snapshot.dominant_nakshatra_number == 16      # Visakam — what actually ran
        swathi = limb_fraction(snapshot.nakshatra_spans, lambda s: s.name == "SWATHI")
        assert swathi == pytest.approx(0.032, abs=0.005)

    def test_karana_carries_a_third_span_the_old_wire_could_not_express(self, snapshot):
        # `karana_next_name` names only the second. Vishti is the third, and it
        # is the one that costs points.
        names = [s.name for s in snapshot.karana_spans]
        assert len(names) == 3
        assert snapshot.karana_name == "GARAJA"
        assert snapshot.karana_next_name == "VANIJA"
        assert "VISHTI" in names


class TestWeighting:
    def test_a_day_with_no_transition_scores_exactly_as_the_old_scalar_did(self):
        """The property that confines this change to the days that split."""
        single = (_span(4, "RIKTA", 1.0),)
        assert limb_weighted(single, lambda s: -15.0 if s.number == 4 else 0.0) == -15.0
        assert limb_fraction(single, lambda s: s.number == 4) == 1.0

    def test_a_penalty_is_proportional_to_how_long_the_value_held(self):
        spans = (_span(4, "RIKTA", 0.25), _span(5, "OTHER", 0.75))
        assert limb_weighted(spans, lambda s: -20.0 if s.number == 4 else 0.0) == pytest.approx(-5.0)

    def test_dominant_breaks_ties_towards_the_star_the_day_is_named_for(self):
        # On a genuine 50/50 day the dominant reading must agree with the உதய
        # reading rather than diverging on a rounding artefact.
        spans = (_span(15, "SWATHI", 0.5), _span(16, "VISAKAM", 0.5))
        assert dominant_from_spans(spans) == 15

    def test_dominant_span_name_survives_the_karana_index(self, snapshot):
        # A karana span's `number` is its 0..59 index in the lunar month, which
        # no caller can turn back into a name on its own.
        assert dominant_span_name(snapshot.karana_spans) == "VANIJA"

    def test_empty_spans_return_zero_so_callers_must_supply_a_fallback(self):
        assert limb_weighted((), lambda s: -10.0) == 0.0
        assert limb_fraction((), lambda s: True) == 0.0
        assert dominant_from_spans(()) is None


class TestVishtiIsNoLongerMissed:
    """The single largest correction: karana averages 11.79 h, so keying Vishti
    to the sunrise value missed it on 100 of the 149 days a year it occurs."""

    def test_the_anchor_day_carries_vishti_away_from_sunrise(self, snapshot):
        assert snapshot.karana_name != "VISHTI"          # the old test saw nothing
        share = limb_fraction(snapshot.karana_spans, lambda s: s.name == "VISHTI")
        assert share == pytest.approx(0.445, abs=0.01)

    def test_the_score_now_charges_for_it(self, snapshot):
        scored = weighted_panchangam_score(snapshot, lagna_lord=None, maha_lord="NONE")

        # Same snapshot with the Vishti stretch relabelled — the only difference
        # between the two runs is whether that stretch is Vishti.
        import dataclasses
        clean = dataclasses.replace(snapshot, karana_spans=tuple(
            dataclasses.replace(s, name="VANIJA") if s.name == "VISHTI" else s
            for s in snapshot.karana_spans
        ))
        assert scored < weighted_panchangam_score(clean, lagna_lord=None, maha_lord="NONE")

    def test_the_charge_is_proportional_not_the_full_flat_penalty(self, snapshot):
        import dataclasses
        scored = weighted_panchangam_score(snapshot, lagna_lord=None, maha_lord="NONE")
        all_vishti = dataclasses.replace(snapshot, karana_spans=(
            dataclasses.replace(snapshot.karana_spans[0], name="VISHTI", fraction=1.0),
        ))
        assert weighted_panchangam_score(all_vishti, lagna_lord=None, maha_lord="NONE") < scored


class TestPiranthaNaalRescue:
    """R-3. Ten nakshatra spans a year contain no sunrise at all; under the old
    sunrise-only test those natives were skipped and the scan silently returned
    the next cycle ~27 days later."""

    def test_a_star_with_no_sunrise_is_found_on_the_day_it_actually_runs(self):
        lat, lon, tz = CHENNAI
        # Magham (10) runs 2026-08-13 06:06 → 2026-08-14 04:38 — after the 13th's
        # sunrise and before the 14th's, so it holds no sunrise at all.
        alert = next_janma_nakshatra_date(10, date(2026, 8, 11), lat, lon, tz)
        assert alert is not None
        assert alert.alert_date == date(2026, 8, 13)
        assert alert.matched_by_overlap is True

    def test_an_ordinary_star_still_uses_the_classical_sunrise_date(self):
        lat, lon, tz = CHENNAI
        # Visakam does hold the 20th's sunrise, so the classical answer stands
        # and the rescue must not pre-empt it.
        alert = next_janma_nakshatra_date(16, date(2026, 8, 17), lat, lon, tz)
        assert alert is not None
        assert alert.alert_date == date(2026, 8, 20)
        assert alert.matched_by_overlap is False

    def test_a_rescued_day_reports_its_own_stars_end_not_the_sunrise_stars(self):
        lat, lon, tz = CHENNAI
        alert = next_janma_nakshatra_date(10, date(2026, 8, 11), lat, lon, tz)
        # The snapshot's nakshatra_ends_at is measured forward from sunrise and
        # therefore belongs to the star running *then*, not to Magham.
        snap = calculate_daily_panchangam(date(2026, 8, 13), lat, lon, tz, session=None, use_cache=False)
        assert snap.nakshatra_name != "MAGHAM"
        assert alert.nakshatra_ends_at != snap.nakshatra_ends_at.strftime("%H:%M")


class TestCacheRoundTrip:
    def test_spans_survive_serialisation(self, snapshot):
        from app.calculations.panchangam import _deserialize_snapshot, _serialize_snapshot

        restored = _deserialize_snapshot(_serialize_snapshot(snapshot))
        assert restored.nakshatra_spans == snapshot.nakshatra_spans
        assert restored.karana_spans == snapshot.karana_spans
        assert restored.moon_rasi_spans == snapshot.moon_rasi_spans
        assert restored.nethiram_next == snapshot.nethiram_next

    def test_a_record_without_spans_deserialises_to_empty_not_to_a_crash(self):
        from app.calculations.panchangam import _deserialize_limb_spans

        assert _deserialize_limb_spans(None) == ()
        assert _deserialize_limb_spans([]) == ()
