"""End-to-end: the sourced activities actually change how a day scores.

`test_kalaprakasika_*_doctrine.py` prove the constants match the pages. These
prove the engine *reads* them — that adding an enum value and a picker row did
not leave the rules dormant, which is the failure mode this workstream existed
to fix (`baby_naming` sat on the mobile picker for months routing nowhere).

Each activity is driven over a real 90-day panchangam sweep and asserted on
three properties:

* the day's star is judged against **that activity's** list, not a generic one;
* a source-stated prohibition removes the day rather than merely docking it;
* the factor carries a `rule_id` that resolves to a page and a passage.

Scores are asserted only by direction, never by value — the weights are
`ENGINE_POLICY` and pinning them here would freeze tunable numbers as doctrine.
"""
from __future__ import annotations

import re
from dataclasses import replace
from datetime import date, timedelta

import pytest

from app.calculations.muhurta_engine import (
    SOURCED_ACTIVITIES,
    Subject,
    Verdict,
    resolve_rule_source,
    score_day,
    unscored_dimensions_for,
)
from app.calculations.panchangam import calculate_daily_panchangam
from app.data import kalaprakasika_samskara_rules as kps
from app.data import kalaprakasika_treasure_rules as kp21
from app.data.muhurta_activity_registry import ACTIVITY_RULES

# Chennai — a location, not a person.
LATITUDE, LONGITUDE, TIMEZONE = 13.0827, 80.2707, "Asia/Kolkata"
SWEEP_START = date(2026, 6, 1)
SWEEP_DAYS = 90

pytestmark = pytest.mark.no_db

_SAMSKARAS = ("NAMING_CEREMONY", "ANNAPRASANA", "EAR_BORING")
_TREASURE = (
    "TREASURE_STORE", "GOLD", "GEMS", "GRAIN",
    "LAND_POSSESSION", "LAND_PURCHASE", "CATTLE_PURCHASE",
)
_ALL_NEW = _SAMSKARAS + _TREASURE

# A clearly-synthetic subject — no real birth data, per repo policy.
SYNTHETIC = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5, label="Test Subject")


@pytest.fixture(scope="module")
def snapshots() -> list:
    return [
        calculate_daily_panchangam(SWEEP_START + timedelta(days=i), LATITUDE, LONGITUDE, TIMEZONE)
        for i in range(SWEEP_DAYS)
    ]


def _factor(day, name: str):
    return next((f for f in day.factors if f.factor == name), None)


# ── the rules are live, not dormant ─────────────────────────────────────────

@pytest.mark.parametrize("activity", _ALL_NEW)
def test_the_activity_is_registered_as_sourced(activity: str) -> None:
    assert activity in SOURCED_ACTIVITIES
    assert activity in ACTIVITY_RULES


@pytest.mark.parametrize("activity", _ALL_NEW)
def test_no_scored_factor_reports_unsourced_where_a_table_exists(
    snapshots, activity: str
) -> None:
    """An UNSOURCED verdict on a dimension the registry *does* cover would mean
    the table was wired but never read — enum added, rules dormant."""
    entry = ACTIVITY_RULES[activity]
    day = score_day(snapshots[0], activity, None)
    if entry.star_groups:
        assert _factor(day, "NAKSHATRA").verdict is not Verdict.UNSOURCED
    if entry.tithi_best or entry.tithi_avoid:
        assert _factor(day, "TITHI").verdict is not Verdict.UNSOURCED
    if entry.karana_avoid:
        assert _factor(day, "KARANA") is not None
    if entry.vara_good or entry.vara_avoid:
        assert _factor(day, "VARA") is not None
    if entry.lagna_best or entry.lagna_avoid:
        assert _factor(day, "LAGNA_SIGN_AT_SUNRISE") is not None


@pytest.mark.parametrize("activity", _ALL_NEW)
def test_every_emitted_rule_id_resolves_to_a_page_and_a_passage(
    snapshots, activity: str
) -> None:
    """A `rule_id` nothing can turn back into a citation is worse than none —
    the UI renders a provenance badge over an unverifiable claim."""
    for snap in snapshots[:30]:
        for factor in score_day(snap, activity, SYNTHETIC).factors:
            if factor.rule_id is None:
                continue
            record = resolve_rule_source(factor.rule_id)
            assert record is not None, f"{activity}: unresolvable rule_id {factor.rule_id}"
            assert record.authority.page is not None
            assert record.authority.verse_or_passage


@pytest.mark.parametrize("activity", _ALL_NEW)
def test_the_activity_separates_days_rather_than_flat_ranking(
    snapshots, activity: str
) -> None:
    """A ranking every day agrees on is not a ranking. Catches a table that is
    wired but whose lookup silently never matches."""
    scores = {score_day(snap, activity, None).score for snap in snapshots}
    assert len(scores) > 1, f"{activity} scored every day identically"


@pytest.mark.parametrize("activity", _ALL_NEW)
def test_the_star_is_judged_against_this_activitys_own_list(
    snapshots, activity: str
) -> None:
    """The NAKSHATRA factor must agree with the registry for this activity —
    not with the generic almanac list, which knows nothing about the activity.
    LAND_PURCHASE is included on purpose: the chapter gives it no star list, so
    the correct behaviour is an UNSOURCED verdict, not a borrowed one."""
    entry = ACTIVITY_RULES[activity]
    for snap in snapshots:
        factor = _factor(score_day(snap, activity, None), "NAKSHATRA")
        star = snap.nakshatra_number
        if not entry.star_groups:
            assert factor.verdict is Verdict.UNSOURCED, activity
            continue
        if star in entry.prohibited_stars:
            expected = Verdict.VETO if entry.prohibited_stars_is_veto else Verdict.PENALTY
        elif any(star in g.stars for g in entry.star_groups):
            expected = Verdict.BONUS
        else:
            expected = Verdict.PENALTY
        assert factor.verdict is expected, f"{activity} star {star} on {snap.date_local}"


# ── prohibitions remove the day; preferences only move the score ────────────

def test_annaprasana_vetoes_its_eight_forbidden_stars(snapshots) -> None:
    """"One should not start any function of feeding on those days" (p.34) is a
    prohibition with a stated consequence, so it must remove the day — not dock
    it and leave it rankable above a merely-mediocre one."""
    hit = 0
    for snap in snapshots:
        day = score_day(snap, "ANNAPRASANA", None)
        if snap.nakshatra_number in kps.ANNAPRASANA_NAKSHATRA_PROHIBITED:
            hit += 1
            assert day.vetoed, f"{snap.date_local} kept a forbidden Annaprasana star"
            reasons = [f.factor for f in day.veto_reasons]
            assert "NAKSHATRA" in reasons
    assert hit >= 10, "a 90-day sweep should meet the eight forbidden stars repeatedly"


def test_naming_never_vetoes_on_a_star_because_the_chapter_forbids_none(
    snapshots,
) -> None:
    """Ch. III names fourteen stars *good* and forbids none. Vetoing the other
    thirteen would assert something the page does not say — and would remove
    half the calendar."""
    for snap in snapshots:
        day = score_day(snap, "NAMING_CEREMONY", None)
        assert "NAKSHATRA" not in [f.factor for f in day.veto_reasons], snap.date_local


def test_ear_boring_vetoes_every_tithi_outside_its_closed_list(snapshots) -> None:
    """"Other Thithis are not to be considered" (p.36) closes the set. This is
    the only sourced tithi rule that does, so it is the only one whose unlisted
    remainder is a prohibition rather than an absence."""
    seen_ok = seen_banned = 0
    for snap in snapshots:
        day = score_day(snap, "EAR_BORING", None)
        in_paksha = snap.tithi_number if snap.tithi_number <= 15 else snap.tithi_number - 15
        tithi_factor = _factor(day, "TITHI")
        if in_paksha in kps.EAR_BORING_TITHI_BEST_IN_PAKSHA:
            seen_ok += 1
            assert tithi_factor.verdict is Verdict.BONUS
        else:
            seen_banned += 1
            assert tithi_factor.verdict is Verdict.VETO, snap.date_local
    assert seen_ok and seen_banned, "the sweep must exercise both branches"


def test_naming_vetoes_purnima_and_amavasya_but_annaprasana_does_not(
    snapshots,
) -> None:
    """The two rites share a chapter and disagree. Copying naming's bans onto
    Annaprasana would forbid two days a month the feeding passage never
    mentions — so this asserts the disagreement survives into scoring."""
    checked_full = checked_new = False
    for snap in snapshots:
        is_amavasya = snap.tithi_number == 30
        is_purnima = snap.tithi_number == 15
        if not (is_amavasya or is_purnima):
            continue
        naming = score_day(snap, "NAMING_CEREMONY", None)
        anna = score_day(snap, "ANNAPRASANA", None)
        assert _factor(naming, "TITHI").verdict is Verdict.VETO, snap.date_local
        assert _factor(anna, "TITHI").verdict is not Verdict.VETO, snap.date_local
        checked_full |= is_purnima
        checked_new |= is_amavasya
    assert checked_full and checked_new, "the sweep must cover both a full and a new moon"


@pytest.mark.parametrize("activity", ("NAMING_CEREMONY", "TREASURE_STORE", "GOLD", "GEMS", "GRAIN", "LAND_POSSESSION"))
def test_karana_rules_are_live_and_keep_transition_scope(snapshots, activity: str) -> None:
    """Avoidance is categorical at a selected moment, but a date has transitions.

    One prohibited side is surfaced as a penalty so a user does not receive a
    whole-day veto for a temporary karana. Two supplied adjacent prohibited
    karanas veto the day. This also proves the cited activity-specific table is
    actually read by the engine.
    """
    entry = ACTIVITY_RULES[activity]
    assert entry.karana_avoid
    current = next(iter(entry.karana_avoid))
    safe_next = "BAVA" if "BAVA" not in entry.karana_avoid else "BALAVA"
    mixed = replace(snapshots[0], karana_name=current, karana_next_name=safe_next)
    factor = _factor(score_day(mixed, activity, None), "KARANA")
    assert factor.verdict is Verdict.PENALTY
    assert factor.rule_id == entry.karana_rule_id

    following = current
    continuous = replace(snapshots[0], karana_name=current, karana_next_name=following)
    assert _factor(score_day(continuous, activity, None), "KARANA").verdict is Verdict.VETO


def test_milk_feeding_karana_is_not_promoted_to_annaprasana() -> None:
    """The p.32 rule is separately sourced, not a rice-feeding rule."""
    assert "STHIRA" not in kps.MILK_FEEDING_KARANA_AVOID
    assert kps.MILK_FEEDING_KARANA_AVOID == frozenset({
        "SHAKUNI", "CHATUSHPADA", "NAGA", "KIMSTUGHNA", "VISHTI"
    })
    assert not ACTIVITY_RULES["ANNAPRASANA"].karana_avoid

def test_the_treasure_tithi_exclusion_penalises_rather_than_vetoes(snapshots) -> None:
    """"All Thithis except Rikthai, Full-Moon and New-Moon are auspicious"
    (p.109) excludes three from the auspicious set — weaker than the imperative
    "Avoid Rikthai" the land passage uses on p.112. Graded off the verb, and
    the two must not converge."""
    assert ACTIVITY_RULES["GOLD"].tithi_avoid_is_veto is False
    assert ACTIVITY_RULES["LAND_POSSESSION"].tithi_avoid_is_veto is True
    checked = 0
    for snap in snapshots:
        in_paksha = snap.tithi_number if snap.tithi_number <= 15 else snap.tithi_number - 15
        if in_paksha not in kp21.TREASURE_TITHI_AVOID_IN_PAKSHA:
            continue
        checked += 1
        assert _factor(score_day(snap, "GOLD", None), "TITHI").verdict is Verdict.PENALTY
        assert _factor(score_day(snap, "LAND_POSSESSION", None), "TITHI").verdict is Verdict.VETO
    assert checked, "the sweep met no Rikta tithi"


# ── an obviously-supported day ranks, an obviously-bad one does not ─────────

@pytest.mark.parametrize(
    "activity",
    ["NAMING_CEREMONY", "ANNAPRASANA", "EAR_BORING", "GOLD", "GEMS", "LAND_POSSESSION"],
)
def test_a_day_on_the_best_star_outscores_one_off_it(snapshots, activity: str) -> None:
    """The whole point of wiring the table: the sourced star list must move the
    score, in the right direction, for every day in the sweep.

    Asserted on the NAKSHATRA factor's own contribution rather than on the day
    total. The total also carries the L1 generic almanac layer — subha
    muhurtham, Abhijit, Nalla Neram — which is activity-agnostic and can easily
    swamp a 20-point star swing, so a total-vs-total comparison would be testing
    the almanac, not the doctrine. Both bounds are checked, so a table that
    silently never matched (all days equal) fails here.
    """
    entry = ACTIVITY_RULES[activity]
    best_stars = {s for g in entry.star_groups for s in g.stars}
    favoured: set[float] = set()
    unlisted: set[float] = set()
    for snap in snapshots:
        day = score_day(snap, activity, None)
        if day.vetoed:
            continue
        factor = _factor(day, "NAKSHATRA")
        (favoured if snap.nakshatra_number in best_stars else unlisted).add(factor.contribution)

    assert favoured and unlisted, f"{activity}: the sweep exercised only one branch"
    assert min(favoured) > max(unlisted), activity
    assert max(unlisted) < 0, f"{activity}: an unlisted star must cost something"


def test_cattle_credits_whichever_sourced_list_matched_and_names_it(
    snapshots,
) -> None:
    """Ch. XXI gives cattle two star lists — a buy-only six and a bidirectional
    nine — that overlap on one star. The engine must name which one it used, or
    the buy/sell distinction the chapter insists on is invisible."""
    seen: set[str] = set()
    for snap in snapshots:
        factor = _factor(score_day(snap, "CATTLE_PURCHASE", None), "NAKSHATRA")
        if factor.verdict is Verdict.BONUS:
            seen.add(factor.rule_id)
    assert seen == {"KP_CH21_CATTLE_NAKSHATRA_001", "KP_CH21_CATTLE_NAKSHATRA_002"}, seen


def test_grains_copy_hedges_where_its_provenance_is_inherited(snapshots) -> None:
    """Gold is pointed at the chapter list by name; grain is not. The reason
    copy must not present the two as equally attested."""
    for snap in snapshots:
        gold = _factor(score_day(snap, "GOLD", None), "NAKSHATRA")
        grain = _factor(score_day(snap, "GRAIN", None), "NAKSHATRA")
        if grain.verdict is not Verdict.BONUS:
            continue
        assert "no star list for grain specifically" in grain.reason_en
        assert "specifically" not in gold.reason_en
        return
    pytest.fail("the sweep never hit a favoured grain star")


# ── conditions the engine cannot check are named, never credited ────────────

def test_the_land_purchase_weekday_bonus_names_its_unverified_condition(
    snapshots,
) -> None:
    """The passage also requires the day-lord in the rising sign. Crediting the
    weekday while silently ignoring that would let a half-met rule read as met."""
    for snap in snapshots:
        factor = _factor(score_day(snap, "LAND_PURCHASE", None), "VARA")
        if factor.verdict is not Verdict.BONUS:
            continue
        assert "not checked here" in factor.reason_en
        assert factor.rule_id == "KP_CH21_LAND_VARA_001"
        return
    pytest.fail("the sweep never hit a favoured land-purchase weekday")


def test_naming_common_signs_score_neutral_with_the_condition_stated(
    snapshots,
) -> None:
    """Common signs are approved "when occupied by a benefic" — unverifiable
    from a day snapshot, so they must not earn the best-sign bonus."""
    for snap in snapshots:
        if snap.lagna_rasi_number not in kps.NAMING_LAGNA_CONDITIONAL:
            continue
        factor = _factor(score_day(snap, "NAMING_CEREMONY", None), "LAGNA_SIGN_AT_SUNRISE")
        assert factor.verdict is Verdict.NEUTRAL
        assert factor.contribution == 0.0
        assert "benefic" in factor.reason_en
        return
    pytest.fail("the sweep never rose in a common sign")


@pytest.mark.parametrize("activity", _ALL_NEW)
def test_each_activity_declares_what_it_could_not_check(activity: str) -> None:
    """A day that clears every scored factor has not cleared the chapter. If
    nothing lists the karana, house-occupancy and yoga rules the engine skips, a
    sourced citation on screen overstates what was verified."""
    gaps = unscored_dimensions_for(activity)
    assert gaps, f"{activity} claims full coverage of its chapter"
    assert all(g.strip() for g in gaps)


# ── the personal layer ──────────────────────────────────────────────────────

def test_annaprasana_vetoes_the_subjects_own_birth_star_only_with_a_subject(
    snapshots,
) -> None:
    """"The child should not be fed on a day ruled by its asterism at birth"
    (p.34) needs a birth star, so it is a personal-layer rule. General mode must
    never fire it — a general result vetoed by a personal factor would break the
    definition of the mode."""
    fired = False
    for snap in snapshots:
        general = score_day(snap, "ANNAPRASANA", None)
        assert "JANMA_NAKSHATRA" not in [f.factor for f in general.factors]
        personal = score_day(snap, "ANNAPRASANA", SYNTHETIC)
        factor = _factor(personal, "JANMA_NAKSHATRA")
        if snap.nakshatra_number == SYNTHETIC.janma_nakshatra:
            fired = True
            assert factor is not None and factor.verdict is Verdict.VETO
            assert personal.vetoed
            # Which star was compared must be stated: the picker's subject is
            # the chart owner's, exact when the chart is the child's and wrong
            # when a parent runs it against their own.
            assert SYNTHETIC.label in factor.reason_en
        else:
            assert factor is None
    assert fired, "the sweep never hit the synthetic subject's birth star"


def test_the_unlabelled_subject_path_keeps_latin_out_of_the_tamil_copy(
    snapshots,
) -> None:
    """`muhurta_service` builds its `Subject` **without** a label, so this is the
    production path, not a corner case. Sharing one English fallback across both
    reason strings — `who = subject.label or "this chart"` — would drop a Latin
    phrase into the middle of every real Tamil result.

    Guards the whole sourced L2 layer, not just the janma factor, because the
    same shortcut is easy to repeat in the next chapter's copy.
    """
    unlabelled = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5)
    latin = re.compile(r"[A-Za-z]{3,}")
    scored = {
        "NAKSHATRA", "TITHI", "KARANA", "VARA", "LAGNA_SIGN_AT_SUNRISE",
        "CHANDRA_BALA", "TARA_BALA", "JANMA_NAKSHATRA",
    }
    for activity in _ALL_NEW:
        for snap in snapshots[:40]:
            for factor in score_day(snap, activity, unlabelled).factors:
                if factor.factor not in scored or factor.verdict is Verdict.UNSOURCED:
                    continue
                assert not latin.search(factor.reason_ta), (
                    f"{activity}/{factor.factor}: Latin text in Tamil copy — {factor.reason_ta}"
                )


def test_no_other_activity_grew_a_janma_nakshatra_veto(snapshots) -> None:
    """Only Annaprasana states this rule. Generalising it across the samskaras
    would be inventing doctrine from the shape of a neighbour."""
    for activity in _ALL_NEW:
        if activity == "ANNAPRASANA":
            continue
        for snap in snapshots[:30]:
            names = [f.factor for f in score_day(snap, activity, SYNTHETIC).factors]
            assert "JANMA_NAKSHATRA" not in names, activity
