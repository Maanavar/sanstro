"""Fortune Alignment — the numerology/jyotisha bridge (NUM-30..33, Phase 3).

Pure module: no DB, no ephemeris, no clock.

What this is for
----------------
Every competing numerology product scores a number in isolation: "your name
number is 8, Saturn, therefore unlucky." That reading is worthless without the
chart, because **8 is only as good or bad as Saturn is in the native's own
horoscope.** For a Thula or Makara lagna Saturn is yogakaraka — the single most
benefic graha in the chart — and telling that person to change their name away
from 8 is malpractice.

This module resolves a number to its graha, resolves that graha to its
**functional nature in this chart** (``app.calculations.functional_nature``,
the same Parashari table the transit and dasha engines already use), and scores
the agreement. It is the one reading in this product that a standalone
numerology app structurally cannot produce.

The three doctrine rules it enforces
------------------------------------
1. **A number never overrides a graha** (plan §9.1). The chart is read first;
   the number's generic reputation never enters the scoring.
2. **"No change needed" must be reachable and must actually fire** (§9.2).
   ``should_advise_name_change`` returns ``False`` for *any* functionally benefic
   graha, unconditionally — before verdict thresholds are even consulted. An
   engine that can never say no is a slot machine, not an analysis.
3. **No fear framing** (§9.3). A misaligned number produces a *caution about
   emphasis*, never a verdict about the person.

Scoring
-------
Base score comes from functional nature alone. Natal strength then scales the
*expression*, not the nature: a strong benefic delivers more of its benefit, and
a strong malefic delivers more of its difficulty. Bounded to ±12 so strength
refines and never dominates lordship — the same discipline the holistic
strength synthesis uses.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from app.calculations.display_names import planet_en, planet_ta
from app.calculations.functional_nature import FunctionalNature, get_functional_nature
from app.calculations.numerology import NUMBER_TO_GRAHA, NumberReading, NumerologyProfile

#: Natures that are benefic for the native by lordship. A name number resolving
#: to one of these is NEVER a reason to change a name (doctrine §9.1/§9.2).
BENEFIC_NATURES: frozenset[FunctionalNature] = frozenset({
    FunctionalNature.YOGAKARAKA,
    FunctionalNature.LAGNA_LORD,
    FunctionalNature.TRIKONA,
})

MALEFIC_NATURES: frozenset[FunctionalNature] = frozenset({
    FunctionalNature.MARAKA,
    FunctionalNature.DUSTHANA,
})

#: Base alignment score by functional nature, 0-100. Ordering follows the same
#: doctrine as FUNCTIONAL_DASHA_MODIFIER; the numbers are spread wider because
#: this is a headline score rather than a multiplier.
_BASE_SCORE: dict[FunctionalNature, int] = {
    FunctionalNature.YOGAKARAKA: 92,
    FunctionalNature.LAGNA_LORD: 85,
    FunctionalNature.TRIKONA: 80,
    FunctionalNature.KENDRA: 60,
    FunctionalNature.NEUTRAL: 55,
    FunctionalNature.UPACHAYA: 48,
    FunctionalNature.MARAKA: 38,
    FunctionalNature.DUSTHANA: 25,
}

#: Strength refines, never dominates. ±12 at natal strength 0 / 100.
_STRENGTH_BOUND = 12.0
_NEUTRAL_STRENGTH = 50.0


class AlignmentVerdict(StrEnum):
    STRONGLY_ALIGNED = "strongly_aligned"
    ALIGNED = "aligned"
    NEUTRAL = "neutral"
    MISALIGNED = "misaligned"
    STRONGLY_MISALIGNED = "strongly_misaligned"


_VERDICT_CUTOFFS: tuple[tuple[int, AlignmentVerdict], ...] = (
    (78, AlignmentVerdict.STRONGLY_ALIGNED),
    (62, AlignmentVerdict.ALIGNED),
    (45, AlignmentVerdict.NEUTRAL),
    (32, AlignmentVerdict.MISALIGNED),
)


def verdict_from_score(score: int) -> AlignmentVerdict:
    for cutoff, verdict in _VERDICT_CUTOFFS:
        if score >= cutoff:
            return verdict
    return AlignmentVerdict.STRONGLY_MISALIGNED


@dataclass(frozen=True, slots=True)
class NumberAlignment:
    """How one number sits against the native's own chart."""

    number: int
    graha: str
    functional_nature: FunctionalNature
    natal_strength: float | None
    score: int
    verdict: AlignmentVerdict
    reason_en: str
    reason_ta: str

    @property
    def is_benefic_lordship(self) -> bool:
        return self.functional_nature in BENEFIC_NATURES


_NATURE_EN: dict[FunctionalNature, str] = {
    FunctionalNature.YOGAKARAKA: "yogakaraka — the most benefic graha in this chart",
    FunctionalNature.LAGNA_LORD: "lagna lord",
    FunctionalNature.TRIKONA: "a trikona lord, benefic here",
    FunctionalNature.KENDRA: "a kendra lord, neutral here",
    FunctionalNature.NEUTRAL: "functionally neutral here",
    FunctionalNature.UPACHAYA: "an upachaya lord — slow, growing results",
    FunctionalNature.MARAKA: "a maraka lord — a transition significator here",
    FunctionalNature.DUSTHANA: "a dusthana lord — it carries effort here",
}

_NATURE_TA: dict[FunctionalNature, str] = {
    FunctionalNature.YOGAKARAKA: "யோககாரகன் — இந்த ஜாதகத்தில் மிகச் சிறந்த கிரகம்",
    FunctionalNature.LAGNA_LORD: "லக்னாதிபதி",
    FunctionalNature.TRIKONA: "திரிகோண அதிபதி — இங்கே சுபன்",
    FunctionalNature.KENDRA: "கேந்திர அதிபதி — இங்கே நடுநிலை",
    FunctionalNature.NEUTRAL: "இங்கே நடுநிலையானது",
    FunctionalNature.UPACHAYA: "உபசய அதிபதி — மெதுவாக வளரும் பலன்",
    FunctionalNature.MARAKA: "மாரக அதிபதி — இங்கே மாற்றத்தைக் குறிக்கும்",
    FunctionalNature.DUSTHANA: "துஸ்தான அதிபதி — இங்கே உழைப்பு கேட்கும்",
}


def align_number(
    number: int,
    lagna_rasi: int,
    *,
    natal_strength: float | None = None,
    node_rasi_map: dict[str, int] | None = None,
) -> NumberAlignment:
    """Score one root number (1-9) against a chart.

    ``natal_strength`` is the graha's 0-100 strength score when available. It
    refines the base score by at most ±12 and is optional — the chart's
    lordship alone is enough to produce an honest reading.
    """
    if number not in NUMBER_TO_GRAHA:
        raise ValueError(f"number must be 1..9, got {number}")
    if not 1 <= lagna_rasi <= 12:
        raise ValueError(f"lagna_rasi must be 1..12, got {lagna_rasi}")

    graha = NUMBER_TO_GRAHA[number]
    nature = get_functional_nature(lagna_rasi, graha, node_rasi_map=node_rasi_map)
    base = _BASE_SCORE[nature]

    delta = 0.0
    if natal_strength is not None:
        raw = (natal_strength - _NEUTRAL_STRENGTH) / _NEUTRAL_STRENGTH * _STRENGTH_BOUND
        delta = max(-_STRENGTH_BOUND, min(_STRENGTH_BOUND, raw))
        if nature in MALEFIC_NATURES:
            # A strong malefic expresses its difficulty more, not less.
            delta = -delta
        elif nature not in BENEFIC_NATURES:
            delta *= 0.5

    score = max(0, min(100, round(base + delta)))
    return NumberAlignment(
        number=number,
        graha=graha,
        functional_nature=nature,
        natal_strength=natal_strength,
        score=score,
        verdict=verdict_from_score(score),
        reason_en=f"{number} is ruled by {planet_en(graha)}, which is {_NATURE_EN[nature]}.",
        reason_ta=f"{number} — {planet_ta(graha)} ஆட்சி; {_NATURE_TA[nature]}.",
    )


# ---------------------------------------------------------------------------
# Profile-level alignment
# ---------------------------------------------------------------------------
#: Relative weight of each number in the overall score. Destiny and the name
#: number carry the most: destiny is lifelong, and the name is the only one the
#: native can actually change.
_WEIGHTS: dict[str, float] = {
    "destiny": 0.35,
    "name": 0.35,
    "psychic": 0.20,
    "namesake": 0.10,
}


@dataclass(frozen=True, slots=True)
class FortuneAlignment:
    psychic: NumberAlignment
    destiny: NumberAlignment
    name: NumberAlignment | None
    namesake: NumberAlignment | None
    overall_score: int
    verdict: AlignmentVerdict
    #: The single output that gates any name-change recommendation.
    name_change_advised: bool
    recommendation_en: str
    recommendation_ta: str
    #: Numbers 1-9 ranked best-first for this chart (NUM-33).
    favourable_numbers: tuple[int, ...]


def should_advise_name_change(name: NumberAlignment | None) -> bool:
    """Doctrine §9.1/§9.2 — the guard that makes this engine honest.

    A functionally benefic graha is never a reason to change a name, whatever
    the number's popular reputation. Saturn as yogakaraka is the canonical case:
    "8 is unlucky" is the single most sold, least defensible claim in this
    trade, and a chart-aware engine must refuse it.
    """
    if name is None:
        return False
    if name.is_benefic_lordship:
        return False
    return name.verdict in {AlignmentVerdict.MISALIGNED, AlignmentVerdict.STRONGLY_MISALIGNED}


def ranked_alignments_for(
    lagna_rasi: int,
    *,
    strengths: dict[str, float] | None = None,
    node_rasi_map: dict[str, int] | None = None,
) -> tuple[NumberAlignment, ...]:
    """All nine numbers scored against this chart, best first (NUM-33).

    Chart-first by construction: the ranking is entirely a function of lordship
    and strength, never of a number's generic reputation.

    Returns the full alignments rather than bare numbers because a surface that
    shows a ranking has to be able to say *why* one number outranks another —
    graha, functional nature and score. ``favourable_numbers_for`` is the
    bare-number projection of exactly this list, so the two can never disagree
    about the order.
    """
    scored = [
        align_number(
            n,
            lagna_rasi,
            natal_strength=(strengths or {}).get(NUMBER_TO_GRAHA[n]),
            node_rasi_map=node_rasi_map,
        )
        for n in range(1, 10)
    ]
    scored.sort(key=lambda a: (-a.score, a.number))
    return tuple(scored)


def favourable_numbers_for(
    lagna_rasi: int,
    *,
    strengths: dict[str, float] | None = None,
    node_rasi_map: dict[str, int] | None = None,
) -> tuple[int, ...]:
    """Rank 1-9 for this chart, best first (NUM-33)."""
    return tuple(
        a.number
        for a in ranked_alignments_for(
            lagna_rasi, strengths=strengths, node_rasi_map=node_rasi_map
        )
    )


def _align_reading(
    reading: NumberReading | None,
    lagna_rasi: int,
    strengths: dict[str, float] | None,
    node_rasi_map: dict[str, int] | None,
) -> NumberAlignment | None:
    if reading is None:
        return None
    return align_number(
        reading.root,
        lagna_rasi,
        natal_strength=(strengths or {}).get(reading.graha),
        node_rasi_map=node_rasi_map,
    )


def align_profile(
    profile: NumerologyProfile,
    lagna_rasi: int,
    *,
    strengths: dict[str, float] | None = None,
    node_rasi_map: dict[str, int] | None = None,
) -> FortuneAlignment:
    """Full Fortune Alignment for a numerology profile against a chart."""
    psychic = align_number(
        profile.psychic.root,
        lagna_rasi,
        natal_strength=(strengths or {}).get(profile.psychic.graha),
        node_rasi_map=node_rasi_map,
    )
    destiny = align_number(
        profile.destiny.root,
        lagna_rasi,
        natal_strength=(strengths or {}).get(profile.destiny.graha),
        node_rasi_map=node_rasi_map,
    )
    name = _align_reading(profile.name, lagna_rasi, strengths, node_rasi_map)
    namesake = _align_reading(profile.namesake, lagna_rasi, strengths, node_rasi_map)

    parts: list[tuple[float, int]] = [
        (_WEIGHTS["psychic"], psychic.score),
        (_WEIGHTS["destiny"], destiny.score),
    ]
    if name is not None:
        parts.append((_WEIGHTS["name"], name.score))
    if namesake is not None:
        parts.append((_WEIGHTS["namesake"], namesake.score))

    total_weight = sum(weight for weight, _ in parts)
    overall = round(sum(weight * score for weight, score in parts) / total_weight)
    advise = should_advise_name_change(name)

    return FortuneAlignment(
        psychic=psychic,
        destiny=destiny,
        name=name,
        namesake=namesake,
        overall_score=overall,
        verdict=verdict_from_score(overall),
        name_change_advised=advise,
        recommendation_en=_recommendation_en(name, advise),
        recommendation_ta=_recommendation_ta(name, advise),
        favourable_numbers=favourable_numbers_for(
            lagna_rasi, strengths=strengths, node_rasi_map=node_rasi_map
        ),
    )


def _recommendation_en(name: NumberAlignment | None, advise: bool) -> str:
    if name is None:
        return "No name was scored, so no name guidance is offered."
    if name.is_benefic_lordship:
        return (
            f"Your name number {name.number} is ruled by {planet_en(name.graha)}, which is "
            f"{_NATURE_EN[name.functional_nature]}. Your current name is well matched to your "
            "chart — no change is called for."
        )
    if not advise:
        return (
            f"Your name number {name.number} sits neutrally with your chart. There is no "
            "particular reason to change it."
        )
    return (
        f"Your name number {name.number} is ruled by {planet_en(name.graha)}, which is "
        f"{_NATURE_EN[name.functional_nature]}. This is worth discussing with an astrologer "
        "before acting — and note that changing a legal name affects Aadhaar, bank KYC, "
        "passport and certificates."
    )


def _recommendation_ta(name: NumberAlignment | None, advise: bool) -> str:
    if name is None:
        return "பெயர் கணிக்கப்படவில்லை; பெயர் தொடர்பான ஆலோசனை இல்லை."
    if name.is_benefic_lordship:
        return (
            f"உங்கள் பெயர் எண் {name.number} — {planet_ta(name.graha)} ஆட்சி; "
            f"{_NATURE_TA[name.functional_nature]}. உங்கள் தற்போதைய பெயர் ஜாதகத்துடன் "
            "நன்கு பொருந்துகிறது — மாற்ற வேண்டியதில்லை."
        )
    if not advise:
        return (
            f"உங்கள் பெயர் எண் {name.number} ஜாதகத்துடன் நடுநிலையாக உள்ளது. "
            "மாற்றுவதற்குத் தனிக் காரணம் இல்லை."
        )
    return (
        f"உங்கள் பெயர் எண் {name.number} — {planet_ta(name.graha)} ஆட்சி; "
        f"{_NATURE_TA[name.functional_nature]}. செயல்படுவதற்கு முன் ஜோதிடரிடம் "
        "ஆலோசிப்பது நல்லது. சட்டப்பூர்வப் பெயர் மாற்றம் ஆதார், வங்கி KYC, கடவுச்சீட்டு, "
        "சான்றிதழ்கள் அனைத்தையும் பாதிக்கும்."
    )
