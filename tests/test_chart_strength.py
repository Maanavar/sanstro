import pytest

from app.calculations.chart_strength import (
    _AVASTHA_MULTIPLIER_EVEN,
    _AVASTHA_MULTIPLIER_ODD,
    _NATURAL_ENEMIES,
    _NATURAL_FRIENDS,
    _baladi_avastha,
    _chesta_bala_score,
    _deeptadi_avastha,
    _jagradadi_avastha,
    _kala_bala_score,
    compute_bhava_bala,
    compute_natal_planet_score,
    compute_strength_breakdown,
    detect_planetary_wars,
)
from app.calculations.shadbala import ShadbalaContext, _nathonnatha_bala

pytestmark = pytest.mark.no_db


def test_detect_planetary_war_marks_lower_degree_as_loser():
    wars = detect_planetary_wars({"MARS": 45.0, "MERCURY": 45.5, "SUN": 45.2})
    assert wars["MARS"] == "MERCURY"


def test_bhava_bala_follows_mercurys_contextual_class():
    """Bhava Bala must read Budha's *contextual* class, not a fixed malefic set.

    Varying only Mercury's company, with the same graha occupying the same
    house each time, is what separates "the contextual rule is wired in" from
    "Mercury happens to be on a hardcoded list".

    Solitary Mercury is BENEFIC as of the 2026-08-31 ruling — it shipped as
    malefic, which no classical reading of Budha supports; see
    `aspects.effective_natural_class`. So the alone case now credits the bhava
    rather than penalising it, and only malefic company turns it.
    """
    def bala(planets_rasi):
        return compute_bhava_bala(
            house_number=1,
            lagna_rasi=1,
            planets_rasi=planets_rasi,
            planet_scores={"MARS": 50},
        )

    alone = bala({"SUN": 8, "MERCURY": 1})
    with_malefic = bala({"SUN": 8, "MERCURY": 1, "SATURN": 1})
    with_benefic = bala({"SUN": 8, "MERCURY": 1, "JUPITER": 1})

    assert alone == 52          # benefic occupant, credited
    assert with_malefic == 45   # Saturn turns Budha; two malefic occupants
    assert with_benefic == 55   # two benefic occupants
    assert with_malefic < alone < with_benefic


def test_detect_planetary_war_sign_boundary_uses_absolute_longitude():
    # OQ-1 (2026-07-16): Mercury at 29.5 deg Gemini (abs 89.5) and Jupiter at
    # 0.3 deg Cancer (abs 90.3) are ~0.8 deg apart — a war — but the OLD code
    # compared degree-within-sign (29.5 vs 0.3) and would have wrongly made
    # the higher-absolute-longitude planet (Jupiter) the loser. Fixed: the
    # trailing planet in absolute zodiacal longitude (Mercury) loses.
    wars = detect_planetary_wars({"MERCURY": 89.5, "JUPITER": 90.3})
    assert wars["MERCURY"] == "JUPITER"


def test_detect_planetary_war_handles_zero_aries_seam():
    # Same boundary bug, at the 0/360 Aries seam instead of an interior sign
    # boundary: Saturn at 359.9 deg (29.9 Pisces) trails Venus at 0.2 deg
    # (0.2 Aries) by the short forward arc (~0.3 deg), so Saturn loses.
    wars = detect_planetary_wars({"SATURN": 359.9, "VENUS": 0.2})
    assert wars["SATURN"] == "VENUS"


def test_chesta_bala_rules():
    assert _chesta_bala_score("MARS", True, 1.0) == 1.0
    assert _chesta_bala_score("SUN", False, 1.0) == 0.5


def test_planetary_war_penalty_applied_to_score():
    base = compute_natal_planet_score(
        planet="MARS",
        natal_rasi=2,
        natal_longitude=45.0,
        natal_lagna_rasi=1,
        sun_longitude=10.0,
        is_retrograde=False,
    )
    penalized = compute_natal_planet_score(
        planet="MARS",
        natal_rasi=2,
        natal_longitude=45.0,
        natal_lagna_rasi=1,
        sun_longitude=10.0,
        is_retrograde=False,
        planetary_wars={"MARS": "MERCURY"},
    )
    assert penalized <= base


# ---------------------------------------------------------------------------
# Phase 1.3 — Baladi / Jagradadi / Deeptadi avastha golden cases
# (docs/THIRUKANITHAM_DEPTH_EXPANSION_PLAN.md Phase 1.3)
# ---------------------------------------------------------------------------

def test_baladi_avastha_odd_sign_zones():
    # Rasi 1 (Aries, odd): zones are 0-6/6-12/12-18/18-24/24-30 deg.
    assert _baladi_avastha(3.0, 1) == "BALA"
    assert _baladi_avastha(9.0, 1) == "KUMARA"
    assert _baladi_avastha(15.0, 1) == "YUVA"
    assert _baladi_avastha(21.0, 1) == "VRIDDHA"
    assert _baladi_avastha(27.0, 1) == "MRITA"


def test_baladi_avastha_even_sign_reverses_zones():
    # Rasi 2 (Taurus, even): zone order reverses.
    assert _baladi_avastha(33.0, 2) == "MRITA"    # 3 deg in sign
    assert _baladi_avastha(57.0, 2) == "BALA"     # 27 deg in sign


def test_the_baladi_multiplier_curve_stays_a_declared_product_choice():
    """These five numbers are `[PRODUCT]`, not `[CLASSICAL]` — see `PN-2` in
    `docs/VINAADI_PAGE_NEEDED_REGISTER_2026-08-27.md`.

    The zoning above is BPHS and signed. The curve is ours: the texts give
    fractions of effect — broadly a quarter, a half, full, little, nil — while
    this is deliberately smoothed, doubling the infant and flooring the dead at
    0.25 where the texts give nothing. Both properties below are the ones that
    make it *not* the classical curve, and either one changing means the
    provenance label and the register row have to change with it.
    """
    assert _AVASTHA_MULTIPLIER_ODD == (0.50, 0.75, 1.00, 0.65, 0.25)
    assert _AVASTHA_MULTIPLIER_EVEN == tuple(reversed(_AVASTHA_MULTIPLIER_ODD))
    # Smoothed, not classical: the dead graha still contributes, and the infant
    # is worth more than the classical quarter.
    assert _AVASTHA_MULTIPLIER_ODD[4] > 0.0, "a zero here would be the classical Mrita"
    assert _AVASTHA_MULTIPLIER_ODD[0] > 0.25, "a quarter here would be the classical Bala"
    # Yuva is the single peak, and the curve only ever falls away from it.
    assert _AVASTHA_MULTIPLIER_ODD[2] == 1.00
    assert _AVASTHA_MULTIPLIER_ODD[:3] == tuple(sorted(_AVASTHA_MULTIPLIER_ODD[:3]))
    assert _AVASTHA_MULTIPLIER_ODD[2:] == tuple(sorted(_AVASTHA_MULTIPLIER_ODD[2:], reverse=True))


def test_jagradadi_avastha_odd_sign_thirds():
    # Rasi 1 (Aries, odd): 0-10/10-20/20-30 deg thirds.
    assert _jagradadi_avastha(5.0, 1) == "JAGRAT"
    assert _jagradadi_avastha(15.0, 1) == "SWAPNA"
    assert _jagradadi_avastha(25.0, 1) == "SUSHUPTI"


def test_jagradadi_avastha_even_sign_reverses_thirds():
    # Rasi 2 (Taurus, even): third order reverses.
    assert _jagradadi_avastha(35.0, 2) == "SUSHUPTI"  # 5 deg in sign
    assert _jagradadi_avastha(55.0, 2) == "JAGRAT"     # 25 deg in sign


def test_deeptadi_avastha_dignity_bands():
    """M-1: Deepta=exalted, Swastha=Moolatrikona/own sign (both collapse to
    the same label — MT is a stronger form of own-sign dignity, not a
    distinct classical rung), Mudita=friend's sign, Deena=neutral,
    Dukhita=enemy sign, Khala=debilitated. Own sign must render Swastha, not
    Mudita — a Tamil-literate user checking a planet in own sign expects
    ஸ்வஸ்த (Swastha)."""
    assert _deeptadi_avastha(100) == "DEEPTA"
    assert _deeptadi_avastha(90) == "SWASTHA"
    assert _deeptadi_avastha(80) == "SWASTHA"
    assert _deeptadi_avastha(60) == "MUDITA"
    assert _deeptadi_avastha(50) == "DEENA"
    assert _deeptadi_avastha(35) == "DUKHITA"
    assert _deeptadi_avastha(15) == "KHALA"


# ---------------------------------------------------------------------------
# WI-01 — Kala Bala day/night sets must agree with shadbala._nathonnatha_bala
# (docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md)
# ---------------------------------------------------------------------------

def test_kala_bala_and_nathonnatha_classify_all_grahas_identically():
    day_ctx = ShadbalaContext(
        asc_longitude=0.0, mc_longitude=0.0, weekday=0,
        birth_clock_hours=12.0, sunrise_hours=6.0, sunset_hours=18.0,
    )
    night_ctx = ShadbalaContext(
        asc_longitude=0.0, mc_longitude=0.0, weekday=0,
        birth_clock_hours=0.0, sunrise_hours=6.0, sunset_hours=18.0,
    )
    for planet in ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN"):
        kala_day = _kala_bala_score(planet, is_daytime=True, paksha_is_shukla=True,
                                     is_vargottama=False, d9_rasi=None)
        kala_night = _kala_bala_score(planet, is_daytime=False, paksha_is_shukla=True,
                                       is_vargottama=False, d9_rasi=None)
        natha_day = _nathonnatha_bala(planet, day_ctx)
        natha_night = _nathonnatha_bala(planet, night_ctx)
        # Both engines must agree on which half (day vs night) is stronger.
        assert (kala_day > kala_night) == (natha_day > natha_night)
        assert (kala_day < kala_night) == (natha_day < natha_night)


def test_kala_bala_venus_stronger_by_day_saturn_stronger_by_night():
    venus_day = _kala_bala_score("VENUS", is_daytime=True, paksha_is_shukla=True,
                                  is_vargottama=False, d9_rasi=None)
    saturn_day = _kala_bala_score("SATURN", is_daytime=True, paksha_is_shukla=True,
                                   is_vargottama=False, d9_rasi=None)
    assert venus_day > saturn_day

    venus_night = _kala_bala_score("VENUS", is_daytime=False, paksha_is_shukla=True,
                                    is_vargottama=False, d9_rasi=None)
    saturn_night = _kala_bala_score("SATURN", is_daytime=False, paksha_is_shukla=True,
                                     is_vargottama=False, d9_rasi=None)
    assert saturn_night > venus_night


def test_compute_strength_breakdown_includes_avastha_labels():
    # 20 deg Aries: Mars own-sign but outside its 0-12 deg Moolatrikona zone,
    # so dignity_score is the plain own-sign band (80) -> SWASTHA (M-1).
    breakdown = compute_strength_breakdown(
        planet="MARS",
        natal_rasi=1,
        natal_longitude=20.0,
        natal_lagna_rasi=1,
        is_retrograde=False,
    )
    assert breakdown["baladi"] == _baladi_avastha(20.0, 1)
    assert breakdown["jagradadi"] == _jagradadi_avastha(20.0, 1)
    assert breakdown["deeptadi"] == "SWASTHA"


def test_retrogression_is_counted_once_via_chesta_bala_only():
    """Retrogression must be worth exactly its Chesta Bala margin — no more.

    Chesta Bala already encodes the classical "vakra graha is strong" rule
    (`_chesta_bala_score` returns its 1.0 maximum for a retrograde planet
    against a 0.6 direct baseline). A flat +8 bonus used to be added on top of
    that, so retrogression was worth roughly +14 on a scale whose worst
    combustion penalty is -22 — enough for a deeply combust planet to still
    read as a chart's strongest. An astrologer review caught the symptom
    (2026-07-18); this locks the arithmetic.

    Asserted as a bound rather than an exact number so the test survives a
    deliberate re-weighting of the chesta component, while still failing if a
    second, independent retrograde bonus is ever reintroduced.
    """
    chesta_weight = 0.15
    chesta_margin = (
        _chesta_bala_score("MERCURY", is_retrograde=True, speed_ratio=None)
        - _chesta_bala_score("MERCURY", is_retrograde=False, speed_ratio=None)
    ) * chesta_weight * 100.0

    def score(is_retrograde: bool) -> int:
        return compute_natal_planet_score(
            planet="MERCURY",
            natal_rasi=4,
            natal_longitude=95.0,
            natal_lagna_rasi=1,
            sun_longitude=15.0,      # far from Mercury: no combustion in play
            is_retrograde=is_retrograde,
        )

    observed = score(True) - score(False)
    assert observed == pytest.approx(chesta_margin, abs=1.0), (
        f"retrograde is worth {observed} points but Chesta Bala alone accounts "
        f"for {chesta_margin:.1f} — a second retrograde bonus has been added back"
    )


# ── Naisargika maitri invariants ─────────────────────────────────────────────

def test_the_only_friend_versus_enemy_pair_is_the_classical_moon_mercury_one():
    """A pair may be asymmetric; it may only be *contradictory* where doctrine says so.

    Naisargika maitri is directional by design, and exactly one pair in the
    seven-graha core is graded friend one way and enemy the other: Moon counts
    Mercury a friend, Mercury counts Moon an enemy. That is derivable from the
    Moolatrikona rule (from Moon's MT in Taurus, both Mercury signs land in the
    friendly 2/4/5/8/9/12 set; from Mercury's MT in Virgo, Cancer lands in the
    inimical 3/6/7/10/11 set), so it is doctrine, not a splice.

    Any *other* friend/enemy pair means two incompatible source tables were
    spliced together — which is what Venus/Rahu and Venus/Ketu were until
    2026-08-17. That splice produced two different answers for one couple
    depending on which partner the caller passed first
    (`numerology_compatibility.graha_relation`), while
    `compatibility_intelligence._graha_relation` silently resolved it to "enemy".

    Asserted as an exact set rather than "no contradictions", so neither
    direction of drift passes: re-introducing a spliced pair fails, and so does
    flattening the genuine Moon/Mercury asymmetry away.
    """
    contradictory: set[frozenset[str]] = set()
    for a in _NATURAL_FRIENDS:
        for b in _NATURAL_FRIENDS:
            if a >= b:
                continue
            a_friend_b = b in _NATURAL_FRIENDS[a]
            a_enemy_b = b in _NATURAL_ENEMIES[a]
            b_friend_a = a in _NATURAL_FRIENDS[b]
            b_enemy_a = a in _NATURAL_ENEMIES[b]
            assert not (a_friend_b and a_enemy_b), f"{a} grades {b} friend and enemy at once"
            if (a_friend_b and b_enemy_a) or (a_enemy_b and b_friend_a):
                contradictory.add(frozenset({a, b}))
    assert contradictory == {frozenset({"MOON", "MERCURY"})}


def test_moon_mercury_asymmetry_is_preserved():
    """The one genuine directional pair must survive the contradiction fix —
    flattening every asymmetry would be the opposite error."""
    assert "MERCURY" in _NATURAL_FRIENDS["MOON"]
    assert "MOON" in _NATURAL_ENEMIES["MERCURY"]


def test_node_rows_are_symmetric_in_both_directions():
    """No node pair may be graded one way and left neutral the other. STR-01.

    The test above catches a pair graded *friend one way and enemy the other*.
    It cannot catch the quieter failure: a pair graded in one direction and
    simply absent from the other row, which reads as NEUTRAL. Three of those
    were live until the 2026-08-27 ruling — Ketu/Rahu, Ketu/Mars and (unnamed by
    the review that prompted it) Rahu/Saturn.

    The rule that settles them is not taste. Every asymmetry in the seven-graha
    core is *derivable* from the Moolatrikona arithmetic — that is what makes
    Moon/Mercury doctrine. The nodes have no Moolatrikona sign, so no derivation
    is available to them, and therefore no node asymmetry can be justified from
    any source. A one-sided node grade is a transcription accident by
    construction, which is why this can be asserted as an invariant rather than
    as a list of blessed exceptions.
    """
    def grade(a: str, b: str) -> str:
        if b in _NATURAL_FRIENDS[a]:
            return "FRIEND"
        if b in _NATURAL_ENEMIES[a]:
            return "ENEMY"
        return "NEUTRAL"

    for node in ("RAHU", "KETU"):
        for other in _NATURAL_FRIENDS:
            if other == node:
                continue
            assert grade(node, other) == grade(other, node), (
                f"{node} grades {other} {grade(node, other)} "
                f"but {other} grades {node} {grade(other, node)}"
            )
