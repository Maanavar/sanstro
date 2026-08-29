"""Kalaprakasika Ch. XIX & XXII, plus Ch. X, XII, XVIII and the milk-feeding rite.

The second doctrine-expansion pass. These tests pin the same properties the
first one did — the page's own arithmetic, the scope boundaries between
neighbouring rites, and the disagreements the book contains — for the eight
activities added on 2026-08-15:

    AGRICULTURE_START  TILLAGE  SOWING  NEW_GRAIN_MEAL      (Ch. XIX, XXII)
    MANTRA_INITIATION  SNAANA                               (Ch. X, XII)
    LYING_IN_CHAMBER                                        (Ch. XVIII)
    MILK_FEEDING                                            (Ch. III p.32)

Two findings here are load-bearing enough to have their own tests, because both
are cases where the *easy* thing to do would have been to make the book
consistent with itself:

* **Ch. X inverts** the sign doctrine Ch. VI, VIII and XI state three times over,
  and it **reverses** the janma-tara polarity six chapters agree on;
* **Ch. XIX contradicts itself** on the tillage rising sign, one page apart.

`pytestmark` keeps the module in the offline suite — nothing here touches a DB.
"""
from __future__ import annotations

import re
from datetime import date, timedelta

import pytest

from app.calculations.muhurta_engine import Subject, Verdict, resolve_rule_source, score_day
from app.calculations.panchangam import calculate_daily_panchangam
from app.constants.astrology import NAKSHATRA_NAMES
from app.data import kalaprakasika_agriculture_rules as agriculture
from app.data import kalaprakasika_learning_rules as learning
from app.data import kalaprakasika_lifecycle_rules as lifecycle
from app.data import kalaprakasika_samskara_rules as samskara
from app.data.muhurta_activity_registry import ACTIVITY_RULES
from app.services.muhurta_service import MUHURTA_ACTIVITIES

pytestmark = pytest.mark.no_db

# Chennai — a location, not a person.
LATITUDE, LONGITUDE, TIMEZONE = 13.0827, 80.2707, "Asia/Kolkata"
SWEEP_START = date(2026, 6, 1)
SWEEP_DAYS = 60

_NEW_ACTIVITIES = (
    "AGRICULTURE_START", "TILLAGE", "SOWING", "NEW_GRAIN_MEAL",
    "MANTRA_INITIATION", "SNAANA", "LYING_IN_CHAMBER", "MILK_FEEDING",
)


@pytest.fixture(scope="module")
def snapshots() -> list:
    return [
        calculate_daily_panchangam(SWEEP_START + timedelta(days=i), LATITUDE, LONGITUDE, TIMEZONE)
        for i in range(SWEEP_DAYS)
    ]


def _n(name: str) -> int:
    return NAKSHATRA_NAMES.index(name) + 1


# ── the page's own arithmetic ───────────────────────────────────────────────

@pytest.mark.parametrize(
    ("stars", "expected"),
    [
        (agriculture.AGRICULTURE_START_NAKSHATRA_BEST, 10),
        (agriculture.TILLAGE_NAKSHATRA_BEST, 9),
        (agriculture.TILLAGE_NAKSHATRA_DISPUTED_ADDITIONS, 9),
        (agriculture.SOWING_NAKSHATRA_BEST, 14),
        (agriculture.SOWING_NAKSHATRA_MIDDLING, 4),
        (agriculture.NEW_GRAIN_MEAL_NAKSHATRA_BEST, 19),
        (learning.MANTRA_INITIATION_NAKSHATRA_BEST, 17),
        (learning.SNAANA_NAKSHATRA_BEST, 10),
        (lifecycle.LYING_IN_NAKSHATRA_BEST, 12),
        (samskara.MILK_FEEDING_NAKSHATRA_BEST, 17),
    ],
)
def test_star_list_lengths_match_the_page(stars: frozenset[int], expected: int) -> None:
    assert len(stars) == expected


def test_sowing_is_the_only_closed_star_list_in_ch19() -> None:
    """Ch. XIX p.102 closes the sowing list — "The other asterisms should be
    avoided" — and states no such clause for entering the land or for ploughing.
    An unlisted star must therefore cost more for sowing than for the other two.
    """
    assert agriculture.SOWING_NAKSHATRA_LIST_IS_EXHAUSTIVE is True
    assert agriculture.AGRICULTURE_START_NAKSHATRA_LIST_IS_EXHAUSTIVE is False
    assert agriculture.TILLAGE_NAKSHATRA_LIST_IS_EXHAUSTIVE is False
    # 14 fruitful + 4 middling = 18 named, so nine fall to the closed-list penalty.
    named = agriculture.SOWING_NAKSHATRA_BEST | agriculture.SOWING_NAKSHATRA_MIDDLING
    assert not (agriculture.SOWING_NAKSHATRA_BEST & agriculture.SOWING_NAKSHATRA_MIDDLING)
    assert len(named) == 18
    assert len(set(range(1, 28)) - named) == 9


def test_the_agriculture_start_tithi_sentence_leaves_three_days_unranked() -> None:
    """p.100 names Navami, Dwithiyai and Dhasami only to take them OUT of a list.
    Neither favoured nor avoided is the honest reading, and it must not collapse
    into either."""
    best = agriculture.AGRICULTURE_START_TITHI_BEST_IN_PAKSHA
    avoid = agriculture.AGRICULTURE_START_TITHI_AVOID_IN_PAKSHA
    assert not (best & avoid)
    assert agriculture.AGRICULTURE_START_TITHI_UNRANKED == {2, 9, 10}
    assert not (agriculture.AGRICULTURE_START_TITHI_UNRANKED & (best | avoid))
    # The enumeration never reaches Purnima and never mentions Amavasya.
    assert agriculture.AGRICULTURE_START_TITHI_AVOID_PURNIMA is False
    assert agriculture.AGRICULTURE_START_TITHI_AVOID_AMAVASYA is False


def test_ch18_defines_rikthai_in_place_and_the_repo_agrees_with_it() -> None:
    """Ch. XVIII p.99 is the only page in the transcription that enumerates
    Rikthai — "(Chathurthi, Navami and Chathurdhasi)". Every other Rikta reading
    in this repo depends on that decode, so it is pinned here."""
    assert {4, 9, 14} <= lifecycle.LYING_IN_TITHI_AVOID_IN_PAKSHA
    # Ch. XII p.68 says "Avoid Rikthai, Prathamai, Ashtami..." without listing it.
    assert {4, 9, 14} <= learning.SNAANA_TITHI_AVOID_IN_PAKSHA
    assert {1, 8} <= learning.SNAANA_TITHI_AVOID_IN_PAKSHA


# ── the book disagreeing with itself, preserved ─────────────────────────────

def test_ch10_inverts_the_sign_doctrine_the_other_learning_chapters_share() -> None:
    """The headline finding of the first pass was that Ch. VI, VIII and XI state
    one sign doctrine three times. Ch. X sits between two of them and swaps the
    top two tiers. Harmonising it would have destroyed the evidence — the
    agreement is only meaningful because it is not universal."""
    for activity in ("VIDYARAMBHAM", "EDUCATION_START", "VEDA_STUDY"):
        assert ACTIVITY_RULES[activity].lagna_best == {3, 6, 9, 12}, activity

    mantra = ACTIVITY_RULES["MANTRA_INITIATION"]
    assert mantra.lagna_best == {1, 4, 7, 10}      # movable, not common
    assert mantra.lagna_middling == {3, 6, 9, 12}  # common demoted
    assert mantra.lagna_avoid == {2, 5, 8, 11}     # fixed rejected, as in all four


def test_the_janma_tara_reversal_lifts_only_its_own_rite() -> None:
    """Six chapters PROHIBIT the janma / Anu-Jenma / Thri-Jenma triad. Two
    reverse it — Ch. X p.62 outright, and Ch. III p.32 by offering the 10th tara
    as a fallback good day. Both are explicit apavada exemptions: they remove
    the general bar for their own rite without manufacturing a bonus."""
    assert learning.MANTRA_INITIATION_JANMA_TARA_FAVOURABLE == {1, 10, 19}
    assert samskara.MILK_FEEDING_FALLBACK_JANMA_TARA == 10

    mantra = ACTIVITY_RULES["MANTRA_INITIATION"]
    assert mantra.janma_tara_exempt == {1, 10, 19}
    assert mantra.janma_tara_exempt_rule_id == "KP_CH10_MANTRA_JANMA_TARA_001"

    milk = ACTIVITY_RULES["MILK_FEEDING"]
    assert milk.janma_tara_exempt == {10}
    assert milk.janma_tara_exempt_rule_id == "KP_CH3_MILK_FEEDING_JANMA_TARA_001"


def test_ch19_contradicts_itself_on_the_tillage_sign_and_both_readings_survive() -> None:
    """p.100 calls Scorpio good for ploughing; p.101 avoids it. The partition is
    scored because p.101's own per-sign gloss sides with it — Scorpio "threatens
    to cause damage to the crops by fire". The opening sentence is kept."""
    scorpio, virgo = 8, 6
    assert scorpio in agriculture.TILLAGE_LAGNA_OPENING_SENTENCE
    assert scorpio in agriculture.TILLAGE_LAGNA_AVOID
    assert virgo in agriculture.TILLAGE_LAGNA_OPENING_SENTENCE
    assert virgo in agriculture.TILLAGE_LAGNA_MIDDLING
    # The gloss is what breaks the tie, so it has to still say what it says.
    assert "fire" in agriculture.TILLAGE_LAGNA_EFFECTS[scorpio]
    # Only the partition reaches the engine.
    assert ACTIVITY_RULES["TILLAGE"].lagna_avoid == agriculture.TILLAGE_LAGNA_AVOID


def test_leo_is_best_for_sowing_and_avoided_for_ploughing() -> None:
    """Two stages of one season's work, three printed pages apart, disagreeing on
    a sign. Both are encoded as printed."""
    leo = 5
    assert leo in ACTIVITY_RULES["SOWING"].lagna_best
    assert leo in ACTIVITY_RULES["TILLAGE"].lagna_avoid


def test_ch19_and_ch22_break_the_weekday_pattern_in_three_different_ways() -> None:
    """Mon/Wed/Thu/Fri good, Sun/Tue/Sat bad is near-universal in this book."""
    # Entering the land: Tuesday is GOOD and Friday is absent.
    entering = ACTIVITY_RULES["AGRICULTURE_START"]
    assert "TUESDAY" in entering.vara_good
    assert "FRIDAY" not in entering.vara_good
    assert entering.vara_avoid == frozenset()      # no adverse day is named

    # The new-grain meal: three good days, not four — Monday is absent.
    meal = ACTIVITY_RULES["NEW_GRAIN_MEAL"]
    assert meal.vara_good == {"WEDNESDAY", "THURSDAY", "FRIDAY"}

    # Sowing: Sun/Tue/Sat are QUALIFIEDLY PERMITTED, so the avoid set is empty.
    sowing = ACTIVITY_RULES["SOWING"]
    assert sowing.vara_good == {"MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"}
    assert sowing.vara_avoid == frozenset()
    assert agriculture.SOWING_VARA_QUALIFIED == {"SUNDAY", "TUESDAY", "SATURDAY"}


def test_snaana_is_the_only_place_sunday_is_named_good() -> None:
    """Ch. XII p.68 names five good weekdays including Sunday. Everywhere else
    Sunday is avoided or middling."""
    assert "SUNDAY" in ACTIVITY_RULES["SNAANA"].vara_good
    others = [
        a for a, e in ACTIVITY_RULES.items()
        if a != "SNAANA" and "SUNDAY" in e.vara_good
    ]
    assert not others, f"Sunday is also named good for: {others}"


def test_the_sowing_karana_list_is_missing_sakunam_and_is_not_completed() -> None:
    """Every other karana passage names the Sthira four plus Vishti. Ch. XIX
    p.103 names four, and Sakunam is not one of them."""
    assert agriculture.SOWING_KARANA_AVOID == {"VISHTI", "CHATUSHPADA", "NAGA", "KIMSTUGHNA"}
    assert "SHAKUNI" not in agriculture.SOWING_KARANA_AVOID
    # The neighbours it was NOT completed from.
    assert "SHAKUNI" in lifecycle.LYING_IN_KARANA_AVOID
    assert "SHAKUNI" in samskara.MILK_FEEDING_KARANA_AVOID
    # Ch. XXII names Vishti alone, and is likewise not completed.
    assert agriculture.NEW_GRAIN_MEAL_KARANA_AVOID == {"VISHTI"}


def test_attributed_dissents_are_recorded_and_never_applied() -> None:
    """Four more "some astrologers say" clauses, none of which outranks the
    sentence it dissents from."""
    # Ch. XIX p.101 would double the ploughing star list.
    assert len(agriculture.TILLAGE_NAKSHATRA_DISPUTED_ADDITIONS) == 9
    assert not (agriculture.TILLAGE_NAKSHATRA_DISPUTED_ADDITIONS & agriculture.TILLAGE_NAKSHATRA_BEST)
    assert not any(
        agriculture.TILLAGE_NAKSHATRA_DISPUTED_ADDITIONS & g.stars
        for g in ACTIVITY_RULES["TILLAGE"].star_groups
    )
    # Ch. XIX p.100 condemns Badhrai, which includes a tithi it has just favoured.
    assert agriculture.AGRICULTURE_START_BADHRAI_DISPUTED & (
        agriculture.AGRICULTURE_START_TITHI_BEST_IN_PAKSHA
    )
    assert agriculture.AGRICULTURE_START_SATURDAY_DISPUTED is True
    assert "SATURDAY" not in ACTIVITY_RULES["AGRICULTURE_START"].vara_good
    # Ch. XXII p.114 reverses its own avoidance of Pisces.
    assert agriculture.NEW_GRAIN_MEAL_PISCES_DISPUTED_BY_DEVARATHA is True
    assert 12 in ACTIVITY_RULES["NEW_GRAIN_MEAL"].lagna_avoid
    # Ch. XII p.68 would add a star to a list its own sentence has closed.
    assert learning.SNAANA_NAKSHATRA_LIST_IS_EXHAUSTIVE is True
    assert not (learning.SNAANA_NAKSHATRA_DISPUTED_AS_BEST & learning.SNAANA_NAKSHATRA_BEST)
    assert not any(
        learning.SNAANA_NAKSHATRA_DISPUTED_AS_BEST & g.stars
        for g in ACTIVITY_RULES["SNAANA"].star_groups
    )
    # Ch. XII p.68 grants Shashti to kings only.
    assert learning.SNAANA_TITHI_FAVOURABLE_TO_KINGS == {6}
    assert 6 not in ACTIVITY_RULES["SNAANA"].tithi_best


# ── scope boundaries between neighbouring rites ─────────────────────────────

def test_the_two_feeding_rites_stay_separate() -> None:
    """Ch. III holds a milk-feeding rite (p.32) and a rice-feeding rite
    (pp.33-35). The karana clause that belongs to the first was once attributed
    to the second; now that the first is a real activity, the boundary matters
    more, not less."""
    milk = ACTIVITY_RULES["MILK_FEEDING"]
    rice = ACTIVITY_RULES["ANNAPRASANA"]

    # The karana rule is the milk rite's and stays there.
    assert milk.karana_avoid == samskara.MILK_FEEDING_KARANA_AVOID
    assert rice.karana_avoid == frozenset()

    # Ardhra: forbidden for the rice, merely absent for the milk.
    ardhra = _n("THIRUVATHIRAI")
    assert ardhra in samskara.ANNAPRASANA_NAKSHATRA_PROHIBITED
    assert ardhra not in samskara.MILK_FEEDING_NAKSHATRA_BEST
    assert milk.prohibited_stars == frozenset()   # p.32 names no forbidden star

    # Neither list is derivable from the other.
    assert samskara.MILK_FEEDING_NAKSHATRA_BEST != samskara.ANNAPRASANA_NAKSHATRA_BEST
    shared = samskara.MILK_FEEDING_NAKSHATRA_BEST & samskara.ANNAPRASANA_NAKSHATRA_BEST
    assert 0 < len(shared) < len(samskara.MILK_FEEDING_NAKSHATRA_BEST)


def test_the_milk_rites_nine_favourable_signs_are_not_credited() -> None:
    """p.32 calls the other nine signs favourable AND disqualifies whichever sign
    the Sun occupies. Crediting the nine would certify, one month in twelve, a
    sign the same sentence excludes."""
    milk = ACTIVITY_RULES["MILK_FEEDING"]
    assert milk.lagna_avoid == {1, 8, 12}
    assert milk.lagna_best == frozenset()
    assert milk.lagna_middling == frozenset()
    assert samskara.MILK_FEEDING_SUN_OCCUPIED_SIGN_IS_ADVERSE is True


def test_the_vrutham_is_not_cloned_into_a_second_activity() -> None:
    """Ch. XII p.68 says the Vrutham follows the tonsure's rules. Exposing it
    would present one rule set as two independent confirmations."""
    assert learning.SNAANA_VRUTHAM_FOLLOWS_TONSURE_RULES is True
    assert "VRUTHAM" not in ACTIVITY_RULES
    assert "SAMAVARTHANAM" not in ACTIVITY_RULES


def test_the_graha_relative_star_counts_are_recorded_and_not_wired() -> None:
    """Ch. XIX counts stars from the SUN's star and from VENUS's. The engine's
    only star-counting factor counts from a birth star; pointing it at a graha
    would be a new factor, not a use of an existing one."""
    assert len(agriculture.TILLAGE_SURYA_TARA_FAVOURABLE) == 15
    assert len(agriculture.TILLAGE_SURYA_TARA_HARMS_BULLOCKS) == 6
    assert len(agriculture.TILLAGE_SURYA_TARA_HARMS_LANDLORD) == 6
    assert sum(n for _, n in agriculture.SOWING_SUKRA_TARA_BANDS) == 27
    # Nothing graha-relative may have reached the registry.
    for activity in ("TILLAGE", "SOWING"):
        assert ACTIVITY_RULES[activity].janma_tara_prohibited == frozenset(), activity


def test_the_new_grain_sub_rites_are_kept_out_of_the_meal() -> None:
    """The first flowers, fruits and leaves each need one sign — and they are
    exactly the three signs the grain meal avoids."""
    sub_rite_signs = {
        agriculture.NEW_GRAIN_MEAL_FIRST_FLOWERS_SIGN,
        agriculture.NEW_GRAIN_MEAL_FIRST_FRUITS_SIGN,
        agriculture.NEW_GRAIN_MEAL_FIRST_LEAVES_SIGN,
    }
    assert sub_rite_signs == set(ACTIVITY_RULES["NEW_GRAIN_MEAL"].lagna_avoid)


def test_the_tillage_tithi_consequence_split_is_declared_not_averaged() -> None:
    """Three of six excluded tithis carry a stated consequence and three do not.
    One boolean cannot say that, so the split is recorded and the flat grade is
    the conservative one."""
    assert agriculture.TILLAGE_TITHI_AVOID_WITH_STATED_CONSEQUENCE == {4, 9, 14}
    assert agriculture.TILLAGE_TITHI_AVOID_WITH_STATED_CONSEQUENCE < (
        agriculture.TILLAGE_TITHI_AVOID_IN_PAKSHA
    )
    assert ACTIVITY_RULES["TILLAGE"].tithi_avoid_is_veto is False
    gaps = " ".join(ACTIVITY_RULES["TILLAGE"].unscored_dimensions).lower()
    assert "consequence" in gaps


# ── the whole set stays honest ──────────────────────────────────────────────

@pytest.mark.parametrize("activity", _NEW_ACTIVITIES)
def test_every_new_activity_is_reachable_and_declares_its_gaps(activity: str) -> None:
    assert activity in MUHURTA_ACTIVITIES
    entry = ACTIVITY_RULES[activity]
    assert entry.unscored_dimensions, f"{activity} claims full coverage of its chapter"
    assert all(g.strip() for g in entry.unscored_dimensions)
    assert entry.star_groups, f"{activity} has no sourced star list"


@pytest.mark.parametrize("activity", _NEW_ACTIVITIES)
def test_every_new_activity_yields_usable_days(activity: str, snapshots) -> None:
    """A rule set so tight that it vetoes almost everything is a defect the
    picker would show as an empty list, not as a strict chapter."""
    subject = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5)
    usable = sum(1 for s in snapshots if not score_day(s, activity, subject).vetoed)
    assert usable >= 20, f"{activity} left only {usable} of {len(snapshots)} days usable"


@pytest.mark.parametrize("activity", _NEW_ACTIVITIES)
def test_every_new_activity_emits_only_resolvable_rule_ids(activity: str, snapshots) -> None:
    subject = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5)
    for snap in snapshots[:25]:
        for factor in score_day(snap, activity, subject).factors:
            if factor.rule_id is None or factor.verdict is Verdict.UNSOURCED:
                continue
            assert resolve_rule_source(factor.rule_id) is not None, (
                f"{activity}/{factor.factor} emitted unresolvable {factor.rule_id}"
            )


@pytest.mark.parametrize("activity", _NEW_ACTIVITIES)
def test_new_activities_keep_latin_out_of_the_unlabelled_tamil_copy(
    activity: str, snapshots
) -> None:
    """The picker builds its Subject without a label, so this is the production
    path for every one of these activities too."""
    unlabelled = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5)
    latin = re.compile(r"[A-Za-z]{3,}")
    for snap in snapshots[:25]:
        for factor in score_day(snap, activity, unlabelled).factors:
            if factor.verdict is Verdict.UNSOURCED:
                continue
            assert not latin.search(factor.reason_ta), (
                f"{activity}/{factor.factor}: Latin in Tamil copy — {factor.reason_ta}"
            )


@pytest.mark.parametrize("activity", _NEW_ACTIVITIES)
def test_no_new_activity_reports_an_unsourced_gap(activity: str, snapshots) -> None:
    """An UNSOURCED verdict means the engine had no table to check. Every one of
    these activities has one for every factor it emits, and if a wiring mistake
    drops a rule_id the factor would silently degrade to UNSOURCED rather than
    fail."""
    subject = Subject(janma_nakshatra=4, janma_rasi=2, lagna_rasi=5)
    for snap in snapshots[:10]:
        unsourced = [
            f.factor for f in score_day(snap, activity, subject).factors
            if f.verdict is Verdict.UNSOURCED
        ]
        assert not unsourced, f"{activity} reported UNSOURCED for {unsourced}"
