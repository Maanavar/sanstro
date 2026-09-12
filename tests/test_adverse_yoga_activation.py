"""Activation and presentation contract for the adverse yogas.

Astrologer ruling, 2026-09-11. Three things were settled and are pinned here:

1. Kemadruma activates on Chandran; Sakata on Chandran and Guru. Before this
   their registry rows declared no key grahas, so `yoga_activation_score`
   collapsed to `round(strength_base * 0.45)` — a STRONG row scored exactly 34
   on every chart and every date, and no dasha could ever move it.
2. Daridra's key graha is a *house lord*, so it cannot live in a static registry
   row. `YogaResult.key_grahas` carries it per chart and must win over the
   registry table.
3. A detector that cannot see the dasha hardcodes `dasha_activated=False`. Now
   that key grahas exist, the chart builder resolves the flag instead, so mobile
   stops telling a Kemadruma native in a Chandran mahadasha that no dasha lord
   activates their yoga.
"""
import pytest

from app.calculations._yoga_detect import _daridra_key_grahas
from app.calculations.yoga_activation import (
    YOGA_KEY_PLANETS,
    key_planets_for,
    yoga_activation_score,
)
from app.calculations.yogas import (
    detect_daridra_yoga,
    detect_daridra_yoga_proxy,
    detect_kemadruma_yoga,
    detect_sakata_yoga,
)

DORMANT_STRONG = 34  # round(75 * 0.45) — the score a dormant-capped STRONG row is stuck at


@pytest.mark.no_db
@pytest.mark.parametrize(
    ("yoga", "expected"),
    [("KEMADRUMA_YOGA", ["MOON"]), ("SAKATA_YOGA", ["MOON", "JUPITER"])],
)
def test_ruling_gave_kemadruma_and_sakata_their_key_grahas(yoga, expected):
    assert YOGA_KEY_PLANETS.get(yoga) == expected


@pytest.mark.no_db
def test_kemadruma_is_no_longer_pinned_to_the_dormant_score():
    dormant = yoga_activation_score(
        yoga_name="KEMADRUMA_YOGA",
        yoga_is_present=True,
        yoga_strength="STRONG",
        mahadasha_lord="SATURN",
        antardasha_lord="MERCURY",
        planet_scores={"MOON": 70},
    )
    activated = yoga_activation_score(
        yoga_name="KEMADRUMA_YOGA",
        yoga_is_present=True,
        yoga_strength="STRONG",
        mahadasha_lord="MOON",
        antardasha_lord="MERCURY",
        planet_scores={"MOON": 70},
    )
    assert dormant == DORMANT_STRONG
    assert activated > dormant, "a Chandran mahadasha must move a Kemadruma's intensity"


@pytest.mark.no_db
def test_sakata_activates_on_guru_as_well_as_chandran():
    for lord in ("MOON", "JUPITER"):
        score = yoga_activation_score(
            yoga_name="SAKATA_YOGA",
            yoga_is_present=True,
            yoga_strength="STRONG",
            mahadasha_lord=lord,
            antardasha_lord="VENUS",
            planet_scores={lord: 65},
        )
        assert score > DORMANT_STRONG, f"{lord} dasha should activate Sakata"


@pytest.mark.no_db
def test_daridra_key_grahas_are_the_eleventh_and_second_lords_per_lagna():
    # Mesha(1): 11th house = Kumbam(11) -> SATURN; 2nd house = Rishabam(2) -> VENUS.
    assert _daridra_key_grahas(1) == ("SATURN", "VENUS")
    # Kadagam(4): 11th = Rishabam(2) -> VENUS; 2nd = Simmam(5) -> SUN.
    assert _daridra_key_grahas(4) == ("VENUS", "SUN")


@pytest.mark.no_db
def test_a_lagna_where_one_graha_owns_both_houses_does_not_duplicate_it():
    # Kumbam(11) lagna: 11th house = Thulam(7) -> VENUS; 2nd house = Meenam(12)
    # -> JUPITER. Mithunam(3) lagna: 11th = Kumbam(11) -> SATURN, 2nd =
    # Kadagam(4) -> MOON. Sweep every lagna for a de-duplicated tuple instead of
    # guessing which one collides.
    for lagna in range(1, 13):
        grahas = _daridra_key_grahas(lagna)
        assert len(grahas) == len(set(grahas)), f"lagna {lagna} repeated a key graha"
        assert 1 <= len(grahas) <= 2


@pytest.mark.no_db
def test_per_chart_key_grahas_beat_the_registry_table():
    # DARIDRA_YOGA declares no static key planets, so without the override it is
    # dormant-capped no matter which dasha runs.
    assert YOGA_KEY_PLANETS.get("DARIDRA_YOGA") is None
    assert key_planets_for("DARIDRA_YOGA") == []
    assert key_planets_for("DARIDRA_YOGA", ("SATURN", "VENUS")) == ["SATURN", "VENUS"]

    capped = yoga_activation_score(
        yoga_name="DARIDRA_YOGA",
        yoga_is_present=True,
        yoga_strength="STRONG",
        mahadasha_lord="SATURN",
        antardasha_lord="MERCURY",
        planet_scores={"SATURN": 60},
    )
    resolved = yoga_activation_score(
        yoga_name="DARIDRA_YOGA",
        yoga_is_present=True,
        yoga_strength="STRONG",
        mahadasha_lord="SATURN",
        antardasha_lord="MERCURY",
        planet_scores={"SATURN": 60},
        chart_key_grahas=("SATURN", "VENUS"),
    )
    assert capped == DORMANT_STRONG
    assert resolved > capped


@pytest.mark.no_db
def test_daridra_detectors_carry_their_key_grahas_on_the_result():
    planets = {
        "SUN": 3, "MOON": 4, "MARS": 8, "MERCURY": 2,
        "JUPITER": 1, "VENUS": 6, "SATURN": 6,
        "RAHU": 11, "KETU": 5,
    }
    scores = {p: 50 for p in planets}
    for detector in (detect_daridra_yoga, detect_daridra_yoga_proxy):
        result = detector(planets, 1, scores)
        assert result.key_grahas == ("SATURN", "VENUS"), detector.__name__


@pytest.mark.no_db
def test_daridra_needs_a_mutual_exchange_not_a_one_way_placement():
    """Ruling 2026-09-11 picked the parivartana reading of 'connecting'.

    The looser readings all fire MORE often than the rule they replaced — see
    `scripts/daridra_definition_sweep.py`. A one-way placement must therefore not
    be enough on its own.
    """
    scores = {p: 50 for p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")}
    # Mesha(1) lagna: 6th = Kanni(6) -> MERCURY, 11th = Kumbam(11) -> SATURN.
    # One-way: Mercury into the 11th (Kumbam) but Saturn NOT in the 6th.
    one_way = {
        "SUN": 3, "MOON": 4, "MARS": 8, "MERCURY": 11,
        "JUPITER": 9, "VENUS": 2, "SATURN": 10,
        "RAHU": 5, "KETU": 11,
    }
    assert detect_daridra_yoga(one_way, 1, scores).is_present is False

    # Mutual: Mercury (6th lord) in Kumbam = the 11th, and Saturn (11th lord) in
    # Kanni = the 6th. That is the exchange.
    exchange = dict(one_way, SATURN=6)
    result = detect_daridra_yoga(exchange, 1, scores)
    assert result.is_present is True
    assert result.strength == "STRONG"
    assert "parivartana_6_11" in result.conditions_met


@pytest.mark.no_db
def test_daridra_ignores_a_house_pair_owned_by_one_graha():
    """The shared-lordship trap, which is why the rule requires two grahas.

    For 5 of the 12 lagnas a single graha owns both a dusthana and a dhana house.
    Counting that as a 'connection' would fire on every chart of those lagnas
    from the lagna alone, before a single placement is read.
    """
    from app.calculations._yoga_helpers import _house_lord

    collided = [
        lagna
        for lagna in range(1, 13)
        if {_house_lord(lagna, h) for h in (6, 8, 12)}
        & {_house_lord(lagna, h) for h in (2, 11)}
    ]
    assert len(collided) == 5, "the trap is real; if this count moves, re-read the sweep"

    scores = {p: 50 for p in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")}
    for lagna in collided:
        # Every graha parked on the lagna rasi: no exchange is possible at all.
        flat = dict.fromkeys(
            ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"),
            lagna,
        )
        assert detect_daridra_yoga(flat, lagna, scores).is_present is False, (
            f"lagna {lagna} fired on shared lordship alone"
        )


@pytest.mark.no_db
def test_daridra_is_now_rarer_than_the_rule_it_replaced():
    """The ruling's stated reason was 'far fewer false positives'. Hold it to that.

    A deterministic sweep, so this is a property of the rule and not of a seed:
    every lagna x a fixed spread of placements. The old test (11th lord in a
    dusthana) fires on ~25% of random charts; the parivartana must come in far
    under that.
    """
    import random

    rng = random.Random(20260911)
    grahas = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU")
    scores = {p: 50 for p in grahas}
    trials = 20_000
    fired = 0
    for _ in range(trials):
        lagna = rng.randint(1, 12)
        planets = {g: rng.randint(1, 12) for g in grahas}
        if detect_daridra_yoga(planets, lagna, scores).is_present:
            fired += 1
    rate = fired / trials
    assert rate < 0.08, f"parivartana Daridra fired on {rate:.1%} of charts; expected ~4%"
    assert rate > 0.01, f"parivartana Daridra fired on {rate:.1%}; suspiciously close to never"


@pytest.mark.no_db
def test_a_fully_bhangaed_kemadruma_still_reports_its_cancellation_factors():
    """The backend half of the 'cancelled is not absent' ruling.

    `is_present=False` with a populated `cancellation_factors` is exactly the
    state the surfaces must render as CANCELLED rather than ABSENT, so the
    detector has to keep emitting the factors after the presence flag flips.
    """
    # Mesha(1) lagna, Chandran in Mesha(1). 2nd = Rishabam(2), 12th = Meenam(12)
    # both empty of the grahas that count, so the yoga forms; Guru in Kadagam(4)
    # is a kendra from Chandran, which is the full bhanga.
    planets = {
        "SUN": 7, "MOON": 1, "MARS": 9, "MERCURY": 7,
        "JUPITER": 4, "VENUS": 8, "SATURN": 10,
        "RAHU": 6, "KETU": 12,
    }
    result = detect_kemadruma_yoga(planets, moon_rasi=1, lagna_rasi=1)
    assert result.is_present is False
    assert "planet_kendra_from_moon" in result.cancellation_factors
    assert "no_planets_2nd_12th_from_moon" in result.conditions_met, (
        "the formed-ness must survive the cancellation, or no surface can tell "
        "'formed then annulled' from 'never formed'"
    )


@pytest.mark.no_db
def test_sakata_bhanga_still_softens_rather_than_cancels():
    """Ruling 2026-09-11 kept the asymmetry with Kemadruma deliberately.

    The Chandran-in-kendra-from-Lagna bhanga is contested in the texts, unlike
    Kemadruma's, so it grades to PARTIAL instead of annulling the card.
    """
    # Guru in Mesha(1), Chandran in Kanni(6) -> 6th from Guru, so Sakata forms.
    # Chandran is also the 6th from Lagna=1... use Lagna=3 so Chandran(6) is the
    # 4th from it, a kendra, which is the bhanga.
    result = detect_sakata_yoga(moon_rasi=6, jupiter_rasi=1, lagna_rasi=3)
    assert result.is_present is True, "a contested bhanga must not remove the card"
    assert result.strength == "PARTIAL"
    assert "moon_kendra_from_lagna" in result.cancellation_factors
