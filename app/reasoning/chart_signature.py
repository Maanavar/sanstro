"""Chart signature — dominant-theme detector (Phase 5).

A master astrologer reads a chart through a single dominant force before
layering individual predictions on top ("this is a Saturn chart"). This
module picks that dominant graha from signals already computed elsewhere in
the app:

  - **Atmakaraka** — the Jaimini soul significator (highest degree-in-sign
    among Sun..Saturn+Rahu); the strongest classical signal, so it carries
    the most weight.
  - **Most-aspected planet** — the graha receiving the most classical
    special aspects (drishti) from the other natal grahas.
  - **Current dasha lord** — the running mahadasha lord, with a bonus when
    the antardasha lord matches (a "self period" amplifies that graha's
    signature right now).
  - **Natal strength** — the planet with the highest natal strength score;
    the weakest signal, used mainly to break ties.

Weights are an explicit, documented judgment call (not derived from a
formula), matching the precedent set by promise_gate.py's thresholds and
jaimini_karakas.py's tie-break order.

The classifier is pure and owns no copy; the bilingual framing templates
live in narrative_engine (SIGNATURE_VOICE), the same split used by
contradiction.py.
"""
from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

from app.calculations.aspects import aspects_house
from app.calculations.jaimini_karakas import compute_char_karakas

# Classical dignity order, reused from jaimini_karakas.py's documented
# tie-break precedent, extended with KETU (which cannot win Atmakaraka but
# can win via the aspect/dasha/strength signals below).
_TIEBREAK_ORDER: tuple[str, ...] = (
    "SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU",
)

# Explicit, documented signal weights. Atmakaraka carries the most weight
# (Jaimini's own "soul significator"); aspects and the current dasha are
# classical secondary reads; natal strength is the weakest signal since it
# is a general-purpose proxy, not a targeted technique.
_ATMAKARAKA_POINTS = 3
_ASPECT_POINTS = 2
_DASHA_POINTS = 2
_SELF_PERIOD_BONUS = 1
_STRENGTH_POINTS = 1

# One motif key per graha eligible to dominate the signature.
MOTIF: dict[str, str] = {
    "SUN": "authority_and_visibility",
    "MOON": "adaptability_and_care",
    "MARS": "courage_and_initiative",
    "MERCURY": "intellect_and_communication",
    "JUPITER": "wisdom_and_growth",
    "VENUS": "harmony_and_relationship",
    "SATURN": "delay_then_reward",
    "RAHU": "ambition_and_reinvention",
    "KETU": "detachment_and_depth",
}


@dataclass(frozen=True, slots=True)
class SignatureSignals:
    """Which raw signals contributed to the verdict — for tests/debugging only, never rendered."""
    atmakaraka: str | None
    most_aspected: str | None
    dasha_lord: str | None
    dasha_self_period: bool
    strongest_planet: str | None


@dataclass(frozen=True, slots=True)
class Signature:
    dominant: str
    motif: str
    signals: SignatureSignals


def _tie_break(candidates: Sequence[str]) -> str:
    for planet in _TIEBREAK_ORDER:
        if planet in candidates:
            return planet
    return candidates[0]


def _most_aspected(planet_rasis: Mapping[str, int]) -> str | None:
    receivers = [p for p in planet_rasis if p in MOTIF]
    if not receivers:
        return None
    counts = {p: 0 for p in receivers}
    for source, source_rasi in planet_rasis.items():
        if source not in MOTIF:
            continue
        for target in receivers:
            if target == source:
                continue
            if aspects_house(source, source_rasi, planet_rasis[target]):
                counts[target] += 1
    top = max(counts.values())
    if top == 0:
        return None
    return _tie_break([p for p, c in counts.items() if c == top])


def _strongest(planet_strength: Mapping[str, int]) -> str | None:
    eligible = {p: s for p, s in planet_strength.items() if p in MOTIF}
    if not eligible:
        return None
    top = max(eligible.values())
    return _tie_break([p for p, s in eligible.items() if s == top])


def detect_signature(
    *,
    planet_longitudes: Mapping[str, float],
    planet_rasis: Mapping[str, int],
    planet_strength: Mapping[str, int] | None = None,
    current_maha_lord: str | None = None,
    current_antar_lord: str | None = None,
) -> Signature:
    """Detect the chart's dominant graha and its interpretive motif.

    All inputs are plain data the caller already has (natal longitudes and
    rasis, an optional natal strength score per planet, and the running
    dasha) — this module runs no ephemeris or DB lookups of its own.
    """
    tally: dict[str, int] = {}

    def _add(planet: str | None, points: int) -> None:
        if planet:
            tally[planet] = tally.get(planet, 0) + points

    atmakaraka = compute_char_karakas(planet_longitudes).get("ATMAKARAKA")
    _add(atmakaraka, _ATMAKARAKA_POINTS)

    most_aspected = _most_aspected(planet_rasis)
    _add(most_aspected, _ASPECT_POINTS)

    dasha_self_period = bool(current_maha_lord) and current_maha_lord == current_antar_lord
    _add(current_maha_lord, _DASHA_POINTS)
    if dasha_self_period:
        _add(current_maha_lord, _SELF_PERIOD_BONUS)

    strongest_planet = _strongest(planet_strength) if planet_strength else None
    _add(strongest_planet, _STRENGTH_POINTS)

    if not tally:
        # No signal at all — every input map was empty. A real persisted
        # chart always yields an atmakaraka, so this means malformed data
        # reached us; raise rather than silently fabricating a "Sun chart".
        raise ValueError(
            "detect_signature: no signals available (empty planet_longitudes/"
            "planet_rasis/planet_strength/dasha) — cannot determine a dominant graha"
        )

    top = max(tally.values())
    dominant = _tie_break([p for p, v in tally.items() if v == top])

    return Signature(
        dominant=dominant,
        motif=MOTIF[dominant],
        signals=SignatureSignals(
            atmakaraka=atmakaraka,
            most_aspected=most_aspected,
            dasha_lord=current_maha_lord,
            dasha_self_period=dasha_self_period,
            strongest_planet=strongest_planet,
        ),
    )
