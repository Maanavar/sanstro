"""
Product-level natal planet strength scorer.
Implements a practical six-component Shadbala blend for production use.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from app.calculations.aspects import aspects_house
from app.calculations.astro import house_from_reference
from app.calculations.transits import combustion_severity, is_cazimi, is_gandanta
from app.constants.astrology import SIGN_LORD as _SIGN_LORD_CONSTANT

# Cazimi / combustion magnitudes on this module's 0-100 composite strength scale
# (see the block near the end of ``natal_strength_score``). Combustion is applied
# as a gradient — ``MAX_COMBUSTION_PENALTY`` is the worst case at the cazimi
# boundary, scaled down towards 0 at the combustion orb edge by
# ``combustion_severity``. Cazimi (within 0°17') overrides the penalty with a
# fixed bonus. EC-7.1 ruling (2026-07-15).
CAZIMI_BONUS = 10.0
MAX_COMBUSTION_PENALTY = 22.0

# Navamsa (D9) dignity modifiers on the same 0-100 composite scale. The bonus
# is long-standing; the penalty was added 2026-07-18 to close a one-sided
# reading (see ``_d9_dignity_tier``). Magnitudes are kept symmetric as the
# conservative default — a jyotishi may well want the penalty weighted heavier
# than the bonus, since "exalted in Rasi, neecha in Navamsa" is classically
# read as a severe loss of promise rather than a mild one. Flagged for
# astrologer confirmation before the weighting is treated as settled.
D9_DIGNITY_BONUS = 5.0
D9_DEBILITATION_PENALTY = 5.0

# Exaltation rasi (1-based)
EXALTATION_RASI: dict[str, int] = {
    "SUN": 1, "MOON": 2, "MARS": 10, "MERCURY": 6,
    "JUPITER": 4, "VENUS": 12, "SATURN": 7,
}

# Debilitation rasi (opposite of exaltation)
DEBILITATION_RASI: dict[str, int] = {
    "SUN": 7, "MOON": 8, "MARS": 4, "MERCURY": 12,
    "JUPITER": 10, "VENUS": 6, "SATURN": 1,
}

# Moolatrikona: (rasi, degree_start_in_sign, degree_end_in_sign)
# Convention note (2026-07 audit): Moon's zone here is 4°-30° Taurus; some
# classical sources (e.g. BPHS) give 3°-30°. Not changed — documenting the
# choice pending an astrologer's confirmation of which source this project follows.
MOOLATRIKONA_ZONE: dict[str, tuple[int, float, float]] = {
    "SUN": (5, 0.0, 20.0),
    "MOON": (2, 4.0, 30.0),
    "MARS": (1, 0.0, 12.0),
    "MERCURY": (6, 16.0, 20.0),
    "JUPITER": (9, 0.0, 10.0),
    "VENUS": (7, 0.0, 15.0),
    "SATURN": (11, 0.0, 20.0),
}

# Own-sign rasis per planet
OWN_SIGN_RASI: dict[str, frozenset[int]] = {
    "SUN": frozenset({5}),
    "MOON": frozenset({4}),
    "MARS": frozenset({1, 8}),
    "MERCURY": frozenset({3, 6}),
    "JUPITER": frozenset({9, 12}),
    "VENUS": frozenset({2, 7}),
    "SATURN": frozenset({10, 11}),
    "RAHU": frozenset(),
    "KETU": frozenset(),
}

# Natural friendship table (naisargika maitri).
#
# The seven-graha core is classical Parashari and is DERIVABLE from the
# Moolatrikona rule (from a graha's MT sign, the 2/4/5/8/9/12 are friendly and
# the 3/6/7/10/11 inimical; a graha owning one of each is neutral). Its
# asymmetries are real doctrine, not bugs — Moon regards Mercury a friend while
# Mercury regards Moon an enemy is the textbook example.
#
# The Rahu/Ketu rows are NOT Parashari: classical naisargika maitri has no node
# entries at all, and these follow common Tamil practice. They are kept in the
# same table (rather than a separate overlay) only because the nodes never act
# as a *sign lord*, so they cannot reach `_dignity_score` — they are read solely
# for planet-to-planet regard (dasha harmony, graha-maitri compatibility).
#
# 2026-08-17: VENUS's enemy row listed RAHU and KETU while the RAHU and KETU
# rows both list VENUS as a friend. That is not an asymmetry, it is a
# contradiction — the same pair graded friend one way and enemy the other, which
# `compatibility_intelligence._graha_relation` resolved as ENEMY (enemy-wins)
# while `numerology_compatibility.graha_relation` returned two different answers
# depending on argument order. Resolved toward FRIEND, which is what the node
# rows here already asserted and what the Tamil practice table this row came
# from states (Venus: friends Mercury, Saturn, Rahu, Ketu).
_NATURAL_FRIENDS: dict[str, frozenset[str]] = {
    "SUN": frozenset({"MOON", "MARS", "JUPITER"}),
    "MOON": frozenset({"SUN", "MERCURY"}),
    "MARS": frozenset({"SUN", "MOON", "JUPITER"}),
    "MERCURY": frozenset({"SUN", "VENUS"}),
    "JUPITER": frozenset({"SUN", "MOON", "MARS"}),
    "VENUS": frozenset({"MERCURY", "SATURN", "RAHU", "KETU"}),
    "SATURN": frozenset({"MERCURY", "VENUS"}),
    "RAHU": frozenset({"VENUS", "SATURN"}),
    "KETU": frozenset({"MARS", "VENUS"}),
}
_NATURAL_ENEMIES: dict[str, frozenset[str]] = {
    "SUN": frozenset({"VENUS", "SATURN", "RAHU", "KETU"}),
    "MOON": frozenset({"RAHU", "KETU"}),
    "MARS": frozenset({"MERCURY", "RAHU"}),
    "MERCURY": frozenset({"MOON"}),
    "JUPITER": frozenset({"MERCURY", "VENUS", "RAHU", "KETU"}),
    "VENUS": frozenset({"SUN", "MOON"}),
    "SATURN": frozenset({"SUN", "MOON", "MARS"}),
    "RAHU": frozenset({"SUN", "MOON", "MARS", "JUPITER"}),
    "KETU": frozenset({"SUN", "MOON", "JUPITER", "RAHU"}),
}

# Sign lords for friend/enemy of sign lord check.
#
# RE-EXPORTED, not defined here. This module was the de-facto canonical home and
# is where most call sites and tests import it from, so the name stays — but six
# other modules had hand-copied it, three of them explicitly to avoid importing
# this file. `app.constants.astrology` imports nothing, so it can be the one
# definition without costing any leaf a dependency.
SIGN_LORD = _SIGN_LORD_CONSTANT

# Naisargika Bala natural hierarchy (0-1 scaled).
# Classical BPHS order (strongest to weakest): Sun > Moon > Venus > Jupiter >
# Mercury > Mars > Saturn — NOT orbital-speed order.
NAISARGIKA_BALA: dict[str, float] = {
    "SATURN": 0.143,
    "MARS": 0.286,
    "MERCURY": 0.429,
    "JUPITER": 0.571,
    "VENUS": 0.714,
    "MOON": 0.857,
    "SUN": 1.000,
    "RAHU": 0.143,
    "KETU": 0.143,
}


def _d9_dignity_tier(planet: str, d9_rasi: int) -> int:
    """Navamsa dignity as a signed tier: +1 dignified, -1 debilitated, 0 neutral.

    Navamsa modulates the Rasi promise in *both* directions, but only the
    strengthening half was ever applied here. That left the classical case the
    D9 chart exists to catch — a planet exalted in Rasi but neecha in Navamsa,
    "exalted in name, powerless in effect" — scoring as though D9 were neutral.
    The -1 tier closes that gap.
    """
    if (
        d9_rasi in OWN_SIGN_RASI.get(planet, frozenset())
        or d9_rasi == EXALTATION_RASI.get(planet)
    ):
        return 1
    if d9_rasi == DEBILITATION_RASI.get(planet):
        return -1
    return 0


def _has_d9_dignity(planet: str, d9_rasi: int) -> bool:
    return _d9_dignity_tier(planet, d9_rasi) > 0


def d9_dignity_tier(planet: str, d9_rasi: int) -> int:
    """Public wrapper — the prose layer needs the same signed tier the scorer
    uses, so the sentence a reader sees and the number they see cannot disagree."""
    return _d9_dignity_tier(planet, d9_rasi)


def _dignity_score(planet: str, natal_rasi: int, natal_longitude: float) -> int:
    """Returns dignity score per 9-level table."""
    if planet in DEBILITATION_RASI and natal_rasi == DEBILITATION_RASI[planet]:
        return 15

    if planet in EXALTATION_RASI and natal_rasi == EXALTATION_RASI[planet]:
        return 100

    if planet in MOOLATRIKONA_ZONE:
        mt_rasi, mt_start, mt_end = MOOLATRIKONA_ZONE[planet]
        deg_in_sign = natal_longitude % 30
        if natal_rasi == mt_rasi and mt_start <= deg_in_sign < mt_end:
            return 90

    if natal_rasi in OWN_SIGN_RASI.get(planet, frozenset()):
        return 80

    sign_lord = SIGN_LORD.get(natal_rasi)
    if sign_lord:
        if sign_lord in _NATURAL_FRIENDS.get(planet, frozenset()):
            return 60
        if sign_lord in _NATURAL_ENEMIES.get(planet, frozenset()):
            return 35

    return 50


_AVASTHA_MULTIPLIER_ODD = (0.50, 0.75, 1.00, 0.65, 0.25)
_AVASTHA_MULTIPLIER_EVEN = (0.25, 0.65, 1.00, 0.75, 0.50)


def _avastha_multiplier(natal_longitude: float, rasi: int) -> float:
    """Classical Baladi avastha multiplier with odd/even sign reversal."""
    deg = natal_longitude % 30.0
    zone = min(int(deg / 6.0), 4)
    is_odd = (rasi % 2 == 1)
    return _AVASTHA_MULTIPLIER_ODD[zone] if is_odd else _AVASTHA_MULTIPLIER_EVEN[zone]


# Baladi avastha (5-stage: infant->old) — the classical names for the same
# odd/even degree-zone rule already used by _avastha_multiplier above, in
# the same strongest-to-weakest order the multiplier values already encode
# (Yuva=1.00 peak, Mrita=0.25/0.50 weakest).
_BALADI_LABELS_ODD = ("BALA", "KUMARA", "YUVA", "VRIDDHA", "MRITA")
_BALADI_LABELS_EVEN = ("MRITA", "VRIDDHA", "YUVA", "KUMARA", "BALA")


def _baladi_avastha(natal_longitude: float, rasi: int) -> str:
    """Classical Baladi avastha label — same zone/reversal rule as
    _avastha_multiplier, just the classical name instead of the multiplier."""
    deg = natal_longitude % 30.0
    zone = min(int(deg / 6.0), 4)
    is_odd = (rasi % 2 == 1)
    return _BALADI_LABELS_ODD[zone] if is_odd else _BALADI_LABELS_EVEN[zone]


# Jagradadi avastha (3-stage: awake/dreaming/sleeping) — degree-in-sign
# thirds (0-10 deg / 10-20 deg / 20-30 deg), reversed for even signs.
# Source: this is the degree-band formulation of Jagradadi avastha
# documented across multiple classical-astrology references (e.g.
# astrobix.com/learn/288-jagradadi-avasthas.html), independently structured
# the same way as this file's own Baladi avastha above (degree-zone +
# odd/even reversal) — chosen over an alternate benefic/malefic-plus-
# navamsa-parity formulation seen elsewhere because the degree-band rule
# cleanly produces all three states from natal_longitude and rasi alone,
# with no extra benefic/malefic classification input needed.
_JAGRADADI_LABELS_ODD = ("JAGRAT", "SWAPNA", "SUSHUPTI")
_JAGRADADI_LABELS_EVEN = ("SUSHUPTI", "SWAPNA", "JAGRAT")


def _jagradadi_avastha(natal_longitude: float, rasi: int) -> str:
    """Classical Jagradadi avastha label (awake/dreaming/sleeping)."""
    deg = natal_longitude % 30.0
    zone = min(int(deg / 10.0), 2)
    is_odd = (rasi % 2 == 1)
    return _JAGRADADI_LABELS_ODD[zone] if is_odd else _JAGRADADI_LABELS_EVEN[zone]


# Deeptadi avastha (classically 9 dignity-driven stages: Deepta, Swastha,
# Mudita, Shanta, Deena, Dukhita, Vikala, Khala, Kopa — BPHS: Deepta =
# exalted, Swastha = own sign, Mudita = friend's sign, Shanta = benefic
# varga, Deena = neutral, Dukhita = enemy sign). This is a dignity-only
# relabeling of the existing 7-band _dignity_score (see that function) into
# the closest classical names, in strength order.
#
# Two simplifications, both deliberate (M-1, docs/ASTROLOGY_FULL_CODE_AUDIT_2026-07-16.md):
# - Moolatrikona (90) and own sign (80) both map to SWASTHA — MT is a
#   stronger form of own-sign dignity, not a distinct classical Deeptadi
#   rung, so the two collapse onto the same label rather than MT displacing
#   own sign's SWASTHA down a rung (the bug this replaces).
# - Shanta (benefic varga) has no corresponding input here — this scorer
#   only classifies own/MT/friend/neutral/enemy/debilitated, not varga
#   placement — so the neutral band (50) uses Deena, matching the source's
#   own "Deena = neutral" pairing, and Shanta is simply never produced.
# - Vikala and Kopa are likewise never produced — both are combustion-driven
#   in the classical scheme and _dignity_score has no combustion input; the
#   weakest band (debilitated, score 15) maps to Khala instead.
def _deeptadi_avastha(dignity_score: int) -> str:
    """Classical Deeptadi avastha label, relabeled from the dignity score."""
    if dignity_score >= 100:
        return "DEEPTA"
    if dignity_score >= 80:
        return "SWASTHA"
    if dignity_score >= 60:
        return "MUDITA"
    if dignity_score >= 50:
        return "DEENA"
    if dignity_score >= 35:
        return "DUKHITA"
    return "KHALA"


def _dik_bala_score(planet: str, house_from_lagna: int) -> float:
    """Directional strength 0.0-1.0."""
    dik_peak: dict[str, int] = {
        "SUN": 10, "MARS": 10,
        "JUPITER": 1, "MERCURY": 1,
        "MOON": 4, "VENUS": 4,
        "SATURN": 7,
    }
    peak = dik_peak.get(planet)
    if peak is None:
        return 0.5
    dist = min(abs(house_from_lagna - peak), 12 - abs(house_from_lagna - peak))
    return max(0.0, 1.0 - dist / 6.0)


def _kala_bala_score(
    planet: str,
    is_daytime: bool,
    paksha_is_shukla: bool,
    is_vargottama: bool,
    d9_rasi: int | None,
) -> float:
    """Temporal strength 0.0-1.0."""
    # Nathonnatha rule (BPHS) — day-strong: Sun, Jupiter, Venus; night-strong:
    # Moon, Mars, Saturn. Must match shadbala._nathonnatha_bala (WI-01).
    diurnal = frozenset({"SUN", "JUPITER", "VENUS"})
    nocturnal = frozenset({"MOON", "MARS", "SATURN"})

    if planet in diurnal:
        natha = 1.0 if is_daytime else 0.4
    elif planet in nocturnal:
        natha = 1.0 if not is_daytime else 0.4
    elif planet == "MERCURY":
        natha = 0.7
    else:
        natha = 0.5

    benefics = frozenset({"MOON", "MERCURY", "VENUS", "JUPITER"})
    malefics = frozenset({"SUN", "MARS", "SATURN", "RAHU", "KETU"})
    if planet in benefics:
        paksha = 1.0 if paksha_is_shukla else 0.5
    elif planet in malefics:
        paksha = 1.0 if not paksha_is_shukla else 0.5
    else:
        paksha = 0.7

    # Signed: a D9-debilitated planet loses the same margin a D9-dignified one
    # gains. Vargottama holds the tier at +1 even in a debilitation sign — the
    # sign repeating across D1/D9 is classically stabilising, so it is not also
    # charged the neecha penalty.
    tier = 0 if d9_rasi is None else _d9_dignity_tier(planet, d9_rasi)
    if is_vargottama:
        tier = max(tier, 1)
    d9_bonus = 0.2 * tier
    return max(0.0, min(1.0, (natha * 0.50 + paksha * 0.30) + d9_bonus * 0.20))


def _chesta_bala_score(planet: str, is_retrograde: bool, speed_ratio: float | None) -> float:
    """Motional strength 0.0-1.0."""
    if planet in {"SUN", "MOON"}:
        return 0.5
    if planet in {"RAHU", "KETU"}:
        return 0.6
    if is_retrograde:
        return 1.0
    if speed_ratio is None:
        return 0.6
    if 0.8 <= speed_ratio <= 1.2:
        return 0.6
    if speed_ratio < 0.5:
        return 0.4
    if speed_ratio > 1.5:
        return 0.5
    return 0.55


def detect_planetary_wars(
    planet_longitudes: dict[str, float],
) -> dict[str, str]:
    """
    Returns {loser_planet: winner_planet}.
    War participants: non-luminaries, non-nodes within 1 degree.
    Loser: lower absolute zodiacal longitude (trailing in the forward direction).
    """
    participants = {
        p: lon
        for p, lon in planet_longitudes.items()
        # Mandhi/Gulika is a shadow upagraha, not a real graha — it doesn't
        # participate in classical graha yuddha (planetary war).
        if p not in {"SUN", "MOON", "RAHU", "KETU", "MANDHI"}
    }
    wars: dict[str, str] = {}
    names = sorted(participants.keys())
    for i, p1 in enumerate(names):
        lon1 = participants[p1] % 360.0
        for p2 in names[i + 1:]:
            lon2 = participants[p2] % 360.0
            sep = abs(lon1 - lon2)
            sep = min(sep, 360.0 - sep)
            if sep > 1.0:
                continue
            if lon1 == lon2:
                # Exact tie: skip assigning an artificial loser.
                continue
            # OQ-1 fix (2026-07-16): the previous code gated the war on
            # absolute-longitude separation but decided the winner by
            # degree-within-sign, which flips inconsistently at every sign
            # boundary (e.g. 29.5 deg Gemini vs 0.3 deg Cancer are ~0.8 deg
            # apart per the separation check above, but 29.5 vs 0.3
            # degree-within-sign gave the wrong answer). Now both the gate
            # and the winner decision use the same frame: absolute zodiacal
            # longitude, with the trailing planet in the short forward arc
            # (handles the 0/360 Aries seam the same as any other boundary)
            # losing. Surya Siddhanta's declination/latitude-based
            # alternative ("the northern planet wins") is a real classical
            # variant but is deferred — it needs ephemeris latitude data not
            # currently passed into this function. See OQ-1,
            # docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md.
            forward_gap = (lon2 - lon1) % 360.0
            if forward_gap <= 180.0:
                loser, winner = p1, p2
            else:
                loser, winner = p2, p1
            wars[loser] = winner
    return wars


def _drik_bala_score(benefic_aspect_count: int, malefic_aspect_count: int) -> float:
    """Aspectual strength 0.0-1.0."""
    return max(0.0, min(1.0, 0.5 + benefic_aspect_count * 0.15 - malefic_aspect_count * 0.15))


_BHAVA_BALA_BENEFICS: frozenset[str] = frozenset({"JUPITER", "VENUS", "MERCURY", "MOON"})
# Mandhi/Gulika occupies and aspects houses like a malefic graha in classical
# Tamil Thirukanitham practice (see aspects.py's ASPECT_HOUSES documentation).
_BHAVA_BALA_MALEFICS: frozenset[str] = frozenset({"SATURN", "MARS", "RAHU", "KETU", "SUN", "MANDHI"})


def compute_bhava_bala(
    house_number: int,
    lagna_rasi: int,
    planets_rasi: dict[str, int],
    planet_scores: dict[str, int],
) -> int:
    """Simplified Bhava Bala (house strength), 0-100 — a metric distinct from
    per-planet Shadbala. A house's strength is not just its lord's strength;
    it also depends on who occupies it and who aspects it. Combines:
      - Bhavadhipati Bala (50%): strength of the house's own lord.
      - Occupant Bala (25%): benefics occupying the house help it, malefics hurt it.
      - Drishti Bala (25%): aspects landing on the house, using the shared
        classical special-aspect table (Mars 4/7/8, Jupiter 5/7/9, Saturn
        3/7/10, Rahu/Ketu 5/7/9, 7th only otherwise) from aspects.py.
    """
    house_rasi = ((lagna_rasi + house_number - 2) % 12) + 1
    house_lord = SIGN_LORD[house_rasi]
    bhavadhipati_score = planet_scores.get(house_lord, 50)

    occupant_score = 50
    for planet, rasi in planets_rasi.items():
        if rasi != house_rasi:
            continue
        if planet in _BHAVA_BALA_BENEFICS:
            occupant_score += 10
        elif planet in _BHAVA_BALA_MALEFICS:
            occupant_score -= 10
    occupant_score = max(0, min(100, occupant_score))

    drishti_score = 50
    for planet, rasi in planets_rasi.items():
        has_aspect = aspects_house(planet, rasi, house_rasi)
        if not has_aspect:
            continue
        if planet in _BHAVA_BALA_BENEFICS:
            drishti_score += 8
        elif planet in _BHAVA_BALA_MALEFICS:
            drishti_score -= 8
    drishti_score = max(0, min(100, drishti_score))

    total = round(bhavadhipati_score * 0.5 + occupant_score * 0.25 + drishti_score * 0.25)
    return max(0, min(100, total))


def compute_all_bhava_bala(
    lagna_rasi: int,
    planets_rasi: dict[str, int],
    planet_scores: dict[str, int],
) -> dict[int, int]:
    """Bhava Bala for all 12 houses from Lagna. See compute_bhava_bala."""
    return {
        house: compute_bhava_bala(house, lagna_rasi, planets_rasi, planet_scores)
        for house in range(1, 13)
    }


def compute_strength_breakdown(
    planet: str,
    natal_rasi: int,
    natal_longitude: float,
    natal_lagna_rasi: int,
    is_retrograde: bool,
    is_vargottama: bool = False,
    d9_rasi: int | None = None,
    is_daytime: bool = True,
    paksha_is_shukla: bool = True,
    benefic_aspect_count: int = 0,
    malefic_aspect_count: int = 0,
    speed_ratio: float | None = None,
) -> dict[str, str]:
    """Returns sthana/dik/kala/chesta/naisargika/drik/baladi/jagradadi/deeptadi labels."""
    house = house_from_reference(natal_lagna_rasi, natal_rasi)
    dignity = _dignity_score(planet, natal_rasi, natal_longitude)

    sthana = "STRONG" if dignity >= 80 else ("NEUTRAL" if dignity >= 50 else "WEAK")

    dik_val = _dik_bala_score(planet, house)
    dik = "STRONG" if dik_val >= 0.7 else ("NEUTRAL" if dik_val >= 0.4 else "WEAK")

    kala_val = _kala_bala_score(planet, is_daytime, paksha_is_shukla, is_vargottama, d9_rasi)
    kala = "STRONG" if kala_val >= 0.7 else ("NEUTRAL" if kala_val >= 0.4 else "WEAK")

    chesta_val = _chesta_bala_score(planet, is_retrograde, speed_ratio)
    chesta = "STRONG" if chesta_val >= 0.7 else ("NEUTRAL" if chesta_val >= 0.4 else "WEAK")

    naisargika_val = NAISARGIKA_BALA.get(planet, 0.5)
    naisargika = "STRONG" if naisargika_val >= 0.7 else ("NEUTRAL" if naisargika_val >= 0.4 else "WEAK")

    drik_val = _drik_bala_score(benefic_aspect_count, malefic_aspect_count)
    drik = "STRONG" if drik_val >= 0.7 else ("NEUTRAL" if drik_val >= 0.4 else "WEAK")

    return {
        "sthana": sthana,
        "dik": dik,
        "kala": kala,
        "chesta": chesta,
        "naisargika": naisargika,
        "drik": drik,
        "baladi": _baladi_avastha(natal_longitude, natal_rasi),
        "jagradadi": _jagradadi_avastha(natal_longitude, natal_rasi),
        "deeptadi": _deeptadi_avastha(dignity),
    }


@dataclass(frozen=True, slots=True)
class ScoreContribution:
    """One signed term of a planet's 0-100 strength score.

    ``points`` is already expressed on the final scale, so the contributions of
    a planet ALWAYS sum to its displayed score — the ``CLAMP_KEY`` term absorbs
    rounding and the 10/95 clamp so the invariant holds by construction rather
    than by hope. A UI that prints these can be trusted to add up.

    ``key`` is a stable machine token; this module owns no copy. Bilingual
    labels live in the narration layer (chart_explanation_service), same split
    as everywhere else in the engine.

    ``detail_key``/``detail_value`` carry the one fact that decides the term
    where the key alone does not (which house, which opponent, how burnt). They
    are split so the narration layer can render them in either language: a
    single pre-formatted English string like "house 7" would have to be either
    parsed or shown untranslated in Tamil, and this module holds no copy.
    ``detail_value`` is always language-neutral — a number or a graha code.
    """

    key: str
    points: float
    detail_key: str | None = None
    detail_value: str | None = None


# Absorbs float rounding plus the 10/95 clamp. Present only when it is non-zero.
CLAMP_KEY = "clamp"

SCORE_FLOOR = 10
SCORE_CEILING = 95


def compute_natal_planet_score(
    planet: str,
    natal_rasi: int,
    natal_longitude: float,
    natal_lagna_rasi: int,
    sun_longitude: float,
    is_retrograde: bool,
    is_vargottama: bool = False,
    benefic_aspect_count: int = 0,
    malefic_aspect_count: int = 0,
    d9_rasi: int | None = None,
    is_daytime: bool = True,
    paksha_is_shukla: bool = True,
    speed_ratio: float | None = None,
    planetary_wars: dict[str, str] | None = None,
) -> int:
    """
    Full Shadbala-weighted natal planet strength score.
    Returns 10-95.

    Thin wrapper over ``explain_natal_planet_score`` so the number and its
    published breakdown can never disagree — there is one arithmetic path.
    """
    score, _ = explain_natal_planet_score(
        planet,
        natal_rasi,
        natal_longitude,
        natal_lagna_rasi,
        sun_longitude,
        is_retrograde,
        is_vargottama=is_vargottama,
        benefic_aspect_count=benefic_aspect_count,
        malefic_aspect_count=malefic_aspect_count,
        d9_rasi=d9_rasi,
        is_daytime=is_daytime,
        paksha_is_shukla=paksha_is_shukla,
        speed_ratio=speed_ratio,
        planetary_wars=planetary_wars,
    )
    return score


def explain_natal_planet_score(
    planet: str,
    natal_rasi: int,
    natal_longitude: float,
    natal_lagna_rasi: int,
    sun_longitude: float,
    is_retrograde: bool,
    *,
    is_vargottama: bool = False,
    benefic_aspect_count: int = 0,
    malefic_aspect_count: int = 0,
    d9_rasi: int | None = None,
    is_daytime: bool = True,
    paksha_is_shukla: bool = True,
    speed_ratio: float | None = None,
    planetary_wars: dict[str, str] | None = None,
) -> tuple[int, list[ScoreContribution]]:
    """``(score, contributions)`` — the score plus why it is that number.

    A bare 0-100 with no visible derivation is the single largest source of
    "this number is wrong" complaints about the product: a reader who sees an
    exalted, vargottama Jupiter land at 64 has no way to discover that a
    rasi-sandhi placement and an 8th-house occupancy are what took it there,
    so the only available conclusion is that the engine is broken. Publishing
    the terms converts an argument about the verdict into an argument about a
    weight, which is a conversation the doctrine can actually have.

    The six balas are reported as their WEIGHTED point contributions (sthana
    already carries its 0.30 factor), not as raw 0-1 sub-scores, so the column
    is directly addable. Modifiers follow in the order they are applied.
    """
    contributions: list[ScoreContribution] = []
    house = house_from_reference(natal_lagna_rasi, natal_rasi)

    dignity = _dignity_score(planet, natal_rasi, natal_longitude)
    avastha = _avastha_multiplier(natal_longitude, natal_rasi)
    if house in {1, 4, 7, 10}:
        house_strength = 80
    elif house in {5, 9}:
        house_strength = 75
    elif house in {2, 11}:
        house_strength = 65
    elif house in {3, 6}:
        house_strength = 55
    elif house in {8, 12}:
        house_strength = 25
    else:
        house_strength = 50
    sthana = (dignity * avastha * 0.60 + house_strength * 0.40) / 100.0

    dik = _dik_bala_score(planet, house)
    kala = _kala_bala_score(planet, is_daytime, paksha_is_shukla, is_vargottama, d9_rasi)
    chesta = _chesta_bala_score(planet, is_retrograde, speed_ratio)
    naisargika = NAISARGIKA_BALA.get(planet, 0.5)
    drik = _drik_bala_score(benefic_aspect_count, malefic_aspect_count)

    shadbala = (
        sthana * 0.30
        + dik * 0.15
        + kala * 0.15
        + chesta * 0.15
        + naisargika * 0.10
        + drik * 0.15
    ) * 100.0

    contributions.extend(
        (
            ScoreContribution("sthana", sthana * 0.30 * 100.0, "house", str(house)),
            ScoreContribution("dik", dik * 0.15 * 100.0, "house", str(house)),
            ScoreContribution("kala", kala * 0.15 * 100.0),
            ScoreContribution(
                "chesta",
                chesta * 0.15 * 100.0,
                # Chesta Bala IS the classical "vakra graha is strong" rule, and
                # it is the ONLY place retrogression is rewarded (the former flat
                # +8 was removed 2026-07-18 as a double-count). Naming it here
                # stops a reader hunting for a missing "retrograde" line.
                *(("retrograde", None) if is_retrograde else (None, None)),
            ),
            ScoreContribution("naisargika", naisargika * 0.10 * 100.0),
            ScoreContribution(
                "drik",
                drik * 0.15 * 100.0,
                "aspect_counts",
                f"{benefic_aspect_count}/{malefic_aspect_count}",
            ),
        )
    )

    if is_vargottama:
        shadbala += 4.0
        contributions.append(ScoreContribution("vargottama", 4.0))

    if d9_rasi is not None:
        d9_tier = _d9_dignity_tier(planet, d9_rasi)
        # The bonus stays gated on a neutral natal dignity: D9 strength is a
        # tie-breaker for an otherwise-average planet, not a top-up for one
        # already exalted in Rasi.
        if d9_tier > 0 and dignity == 50:
            shadbala += D9_DIGNITY_BONUS
            contributions.append(ScoreContribution("d9_dignified", D9_DIGNITY_BONUS))
        # The penalty is deliberately NOT gated on dignity. Gating it would
        # re-open the exact hole this closes: the case that most needs the
        # correction is a Rasi-exalted (dignity == 100) planet sitting neecha
        # in Navamsa. Vargottama is exempt, as in the Kala Bala branch above.
        elif d9_tier < 0 and not is_vargottama:
            shadbala -= D9_DEBILITATION_PENALTY
            contributions.append(ScoreContribution("d9_debilitated", -D9_DEBILITATION_PENALTY))

    if planet not in {"SUN", "RAHU", "KETU"}:
        if is_cazimi(planet, natal_longitude, sun_longitude):
            # Cazimi (heart of the Sun, within 0°17') — the planet is empowered,
            # not burnt. Not a native Parashari concept (it is a Western/Tajika
            # import), but classical usage flips a tightly-conjunct planet from
            # weak to fortified, and the product surfaces it as a BOOST. Kept as
            # the single strongest positive modifier (above retrograde +8).
            shadbala += CAZIMI_BONUS
            contributions.append(ScoreContribution("cazimi", CAZIMI_BONUS))
        else:
            # Combustion is a gradient, not a hard boundary: full weight only
            # near an exact conjunction, tapering to nothing at the orb edge.
            severity = combustion_severity(
                planet, natal_longitude, sun_longitude, is_retrograde
            )
            shadbala -= MAX_COMBUSTION_PENALTY * severity
            if severity > 0.0:
                # The severity is published because the gradient is exactly what
                # makes a bare "Combust −X" line look arbitrary: two combust
                # planets legitimately take very different penalties.
                contributions.append(
                    ScoreContribution(
                        "combustion",
                        -MAX_COMBUSTION_PENALTY * severity,
                        "orb_severity_pct",
                        str(round(severity * 100)),
                    )
                )

    deg_in_sign = natal_longitude % 30
    if deg_in_sign <= 1.0 or deg_in_sign >= 29.0:
        shadbala -= 8.0
        contributions.append(
            ScoreContribution("sandhi", -8.0, "degree_in_sign", f"{deg_in_sign:.2f}")
        )

    if is_gandanta(natal_longitude):
        shadbala -= 10.0
        contributions.append(ScoreContribution("gandanta", -10.0))

    # NOTE: retrogression is deliberately NOT rewarded again here.
    #
    # This block used to add a flat +8 for a retrograde planet, on top of
    # `_chesta_bala_score` already returning its maximum (1.0 vs 0.6 for a
    # direct planet — worth roughly +6 through the 0.15 chesta weight). Chesta
    # Bala *is* the classical "vakra graha is strong" rule; the flat bonus
    # double-counted it, making retrogression worth ~+14 against a maximum
    # combustion penalty of -22.
    #
    # The visible consequence: a combust AND retrograde planet netted only
    # about -8 and could still surface as the chart's strongest — which is how
    # a combust, retrograde, 6th-lord Mercury came to be presented as the
    # strongest graha in the chart. An astrologer review flagged the output as
    # not defensible (2026-07-18); this is the mechanism behind it.

    if planetary_wars and planet in planetary_wars:
        shadbala -= 15.0
        contributions.append(
            ScoreContribution("planetary_war", -15.0, "lost_to", planetary_wars[planet])
        )

    score = max(SCORE_FLOOR, min(SCORE_CEILING, round(shadbala)))

    # Close the books. Rounding and the 10/95 clamp are the only two ways the
    # terms above can fail to reach the published number, and a breakdown that
    # does not add up is worse than no breakdown at all — so the residual is
    # named rather than hidden.
    residual = score - sum(c.points for c in contributions)
    if abs(residual) >= 0.05:
        contributions.append(ScoreContribution(CLAMP_KEY, residual))

    return score, contributions


# ── Holistic Strength Synthesis ───────────────────────────────────────────────
# docs/THIRUKANITHAM_STRENGTH_SYNTHESIS_2026-07-23.md
#
# A flag-gated SECOND PASS over the base natal scores above. The six-bala blend
# in compute_natal_planet_score is a per-planet property; a Tamil reading also
# synthesises four *relational* measures it omits:
#   G1 functional lordship (lagnadhipathi / yogakaraka / dusthana-lord …)
#   G2 yuti — the company a planet keeps, graded by the companion's nature+strength
#   G3 neecha bhanga — cancellation of debilitation
#   G4 aspect relief weighted by the aspecting planet's OWN strength
# It reads the base scores of every graha and returns bounded per-term deltas.
# The net delta is clamped to +/- SYNTHESIS_DELTA_CAP so it REFINES, never
# dominates, the real Shadbala — a planet weak on the six balas cannot be
# inflated to "strong" by relationships alone. Pure: no I/O, nothing mutated.
# Weights are DOCTRINE (spec §4.2) — kept behind holistic_strength_synthesis
# (default OFF) pending the astrologer's sign-off.

# G1 — functional nature -> additive points. Mirrors the DIRECTION of
# functional_nature.FUNCTIONAL_DASHA_MODIFIER (Yogakaraka 1.40 … Dusthana 0.60),
# converted from a multiplier to conservative points so it composes on 0-100.
FUNCTIONAL_STRENGTH_DELTA: dict[str, float] = {
    "YOGAKARAKA": 7.0,
    "LAGNA_LORD": 5.0,
    "TRIKONA": 4.0,
    "KENDRA": -1.0,
    "UPACHAYA": -2.0,
    "MARAKA": -3.0,
    "DUSTHANA": -6.0,
    "NEUTRAL": 0.0,
}

_YUTI_WEIGHT = 6.0
_YUTI_CAP = 10.0
_DRISHTI_QUALITY_WEIGHT = 5.0
_DRISHTI_CAP = 10.0
_NEECHA_BHANGA_BONUS = 14.0
SYNTHESIS_DELTA_CAP = 22.0

_KENDRA_HOUSES = frozenset({1, 4, 7, 10})
_KENDRA_TRIKONA_HOUSES = frozenset({1, 4, 5, 7, 9, 10})

# Rahu/Ketu own no rasi, so they carry NO functional-lordship delta — a node is
# an agent of its dispositor and the houses it touches, never the lord itself
# (ராகு லக்னாதிபதி அல்ல). Its functional influence is captured by the yuti and
# drishti terms instead. Astrologer decision 2026-07-23 (spec §7 Q3).
_SYNTHESIS_NODES = frozenset({"RAHU", "KETU"})


def neecha_bhanga_cancelled(
    planet: str,
    *,
    planet_rasi: Mapping[str, int],
    lagna_rasi: int,
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
) -> tuple[bool, list[str]]:
    """Canonical Neecha Bhanga (debilitation-cancellation) test for ONE planet.

    THE single source of truth, shared by the yoga detector
    (``_yoga_detect.detect_neecha_bhanga`` — the visible yoga card) and the
    strength synthesis (``_neecha_bhanga_planets`` — the +14 bhanga term).
    Before this existed the two carried divergent condition sets and could
    disagree on the same chart (audit C2,
    docs/THIRUKANITHAM_ENGINE_AUDIT_2026-07-23.md). Returns
    ``(cancelled, conditions)`` naming the classical rules that fired.

    A planet not standing in its own debilitation rasi is never a candidate →
    ``(False, [])``. The four substantive rules (BPHS / standard Tamil
    Thirukanitham):
      1. the lord of the debilitation sign sits in a kendra from lagna or Moon,
      2. the planet that *exalts* in the debilitation sign sits in a kendra from
         lagna or Moon,
      3. the lord of the sign where THIS planet exalts casts a drishti on it,
      4. the planet is strong in the Navamsa — in a kendra/trikona from the D9
         lagna when that is known, else dignified (own/exaltation) in D9.
    Retrograde is a supporting *note* only (added by the caller), never on its
    own a cancellation — closing the old lone-retrograde over-detection (G6).
    """
    deb_rasi = DEBILITATION_RASI.get(planet)
    if deb_rasi is None or planet_rasi.get(planet) != deb_rasi:
        return False, []

    moon_rasi = planet_rasi.get("MOON")

    def _in_kendra(from_rasi: int | None, target_rasi: int | None) -> bool:
        if from_rasi is None or target_rasi is None:
            return False
        return house_from_reference(from_rasi, target_rasi) in _KENDRA_HOUSES

    conditions: list[str] = []

    # (1) lord of the debilitation sign in a kendra from lagna or Moon
    deb_lord = SIGN_LORD.get(deb_rasi)
    deb_lord_rasi = planet_rasi.get(deb_lord) if deb_lord else None
    if _in_kendra(lagna_rasi, deb_lord_rasi) or _in_kendra(moon_rasi, deb_lord_rasi):
        conditions.append("debilitation_sign_lord_in_kendra")

    # (2) the planet that exalts in the debilitation sign, in a kendra
    exalter = {rasi: p for p, rasi in EXALTATION_RASI.items()}.get(deb_rasi)
    exalter_rasi = planet_rasi.get(exalter) if exalter else None
    if _in_kendra(lagna_rasi, exalter_rasi) or _in_kendra(moon_rasi, exalter_rasi):
        conditions.append("exalter_of_debilitation_sign_in_kendra")

    # (3) the lord of the sign where THIS planet exalts casts a drishti on it
    own_exalt_rasi = EXALTATION_RASI.get(planet)
    if own_exalt_rasi is not None:
        exaltation_sign_lord = SIGN_LORD[own_exalt_rasi]
        esl_rasi = planet_rasi.get(exaltation_sign_lord)
        if esl_rasi is not None and aspects_house(exaltation_sign_lord, esl_rasi, deb_rasi):
            conditions.append("exaltation_sign_lord_aspects_debilitated")

    # (4) the debilitated planet strong in the Navamsa (D9)
    if d9_rasi_map is not None and planet in d9_rasi_map:
        d9_rasi = d9_rasi_map[planet]
        if d9_lagna_rasi is not None:
            strong_d9 = house_from_reference(d9_lagna_rasi, d9_rasi) in _KENDRA_TRIKONA_HOUSES
        else:
            strong_d9 = _has_d9_dignity(planet, d9_rasi)
        if strong_d9:
            conditions.append("debilitated_planet_strong_d9")

    return bool(conditions), conditions


def _neecha_bhanga_planets(
    planet_rasi: Mapping[str, int],
    lagna_rasi: int,
    d9_rasi_map: Mapping[str, int] | None,
    d9_lagna_rasi: int | None = None,
) -> frozenset[str]:
    """Planets whose debilitation is cancelled, via the canonical
    ``neecha_bhanga_cancelled`` predicate (shared with the yoga detector so the
    strength number and the yoga card can never disagree — audit C2)."""
    return frozenset(
        planet
        for planet in DEBILITATION_RASI
        if neecha_bhanga_cancelled(
            planet,
            planet_rasi=planet_rasi,
            lagna_rasi=lagna_rasi,
            d9_rasi_map=d9_rasi_map,
            d9_lagna_rasi=d9_lagna_rasi,
        )[0]
    )


def apply_holistic_synthesis(
    base_scores: Mapping[str, int],
    *,
    planet_rasi: Mapping[str, int],
    lagna_rasi: int,
    functional_nature: Mapping[str, str],
    benefic_planets: frozenset[str],
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
) -> dict[str, dict[str, float]]:
    """Second-pass relational refinement of base natal strength (spec §4).

    Returns ``{graha: {"base", "functional", "yuti", "drishti", "bhanga",
    "delta", "score"}}`` — the adjusted 10-95 ``score`` plus every term, for
    transparency in the UI/breakdown and per-term unit tests.

    ``benefic_planets`` is the caller's contextual (paksha-/combustion-aware)
    benefic set; any other scored graha is treated as malefic for the yuti and
    drishti sign. Only grahas present in BOTH ``base_scores`` and ``planet_rasi``
    are scored (Mandhi and unscored bodies are ignored).
    """
    neecha = _neecha_bhanga_planets(planet_rasi, lagna_rasi, d9_rasi_map, d9_lagna_rasi)
    grahas = [g for g in base_scores if g in planet_rasi]
    out: dict[str, dict[str, float]] = {}

    for planet in grahas:
        base = base_scores[planet]
        rasi = planet_rasi[planet]

        functional = (
            0.0
            if planet in _SYNTHESIS_NODES
            else FUNCTIONAL_STRENGTH_DELTA.get(functional_nature.get(planet, "NEUTRAL"), 0.0)
        )

        # G2 yuti — same-sign company, graded by the companion's nature+strength.
        yuti = 0.0
        for other in grahas:
            if other == planet or planet_rasi[other] != rasi:
                continue
            sign = 1.0 if other in benefic_planets else -1.0
            yuti += sign * (base_scores[other] - 50) / 50.0 * _YUTI_WEIGHT
        yuti = max(-_YUTI_CAP, min(_YUTI_CAP, yuti))

        # G4 weighted drishti — aspect QUALITY graded by the aspecting planet's
        # strength. The base score already counted aspect PRESENCE (flat ± via
        # _drik_bala_score); this is the strength-weighted quality layer on top.
        # aspects_house returns False for same-sign, so conjunction never
        # double-counts here — it is handled once, by the yuti term above.
        drishti = 0.0
        for source in grahas:
            if source == planet or not aspects_house(source, planet_rasi[source], rasi):
                continue
            sign = 1.0 if source in benefic_planets else -1.0
            drishti += sign * (base_scores[source] - 50) / 50.0 * _DRISHTI_QUALITY_WEIGHT
        drishti = max(-_DRISHTI_CAP, min(_DRISHTI_CAP, drishti))

        bhanga = _NEECHA_BHANGA_BONUS if planet in neecha else 0.0

        delta = max(-SYNTHESIS_DELTA_CAP, min(SYNTHESIS_DELTA_CAP, functional + yuti + drishti + bhanga))
        out[planet] = {
            "base": float(base),
            "functional": round(functional, 2),
            "yuti": round(yuti, 2),
            "drishti": round(drishti, 2),
            "bhanga": bhanga,
            "delta": round(delta, 2),
            "score": float(max(10, min(95, round(base + delta)))),
        }
    return out
