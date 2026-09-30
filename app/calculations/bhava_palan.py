"""Bhava palan — a per-house verdict, its reason, and conduct guidance.

The engine has computed `bhava_bala` for all twelve houses for a long time and no
surface has ever drawn it (`ChartExplanationBhava.bhavaBala` had zero consumers in
web/ and mobile/). This module turns that number into the three things a reader
actually asks for: **how is this house**, **why**, and **what do I do about it**.

Four design rules, each of which was a decision with a reason
(docs/BHAVA_PALAN_SECTION_PLAN_2026-09-28.md §9):

1. **The band is polarity-aware.** A weak 6th means weak enemies, few debts and
   little illness — that is good news. Painting it red because its bala is 38 tells
   the reader the opposite of the truth. 6/8/12 read inverted, 3/11 read on the
   upachaya (grows-with-effort) scale, the rest read directly.

2. **Thresholds are measured, not eyeballed.** `bhava_bala` is centred at 45 with a
   stdev of 6 (4,000-chart sweep, 48,000 readings), not at 50. An earlier 60/40
   proposal fired SUPPORTED 0.7% of the time. The cuts below land the reader on about
   3 SUPPORTED and 1.4 NEEDS_CARE houses out of twelve (re-measured 2026-09-30, when
   the green cuts were raised by 2 — see `_CUT_DIRECT`).

3. **Conduct is keyed on the responsible graha, not on the band.** Band-keyed copy
   produces twelve interchangeable paragraphs. What a jyotishi actually varies is
   *which* graha is doing the work: Saturn in the 7th asks for patience and an older
   partner, Mars asks you not to decide in anger, Rahu asks you to verify what you
   are told. Composition, not 12 x 3 x 2 hand-written blocks.

4. **The lord sentence states its ground when the chart contradicts it.** "Its lord
   Venus is strongly placed" is a claim about a composite score; the reader takes it
   as a claim about dignity, because that is what the chart beside it shows. Those
   come apart often — across 4,000 sweep charts each carrying a forced debilitation,
   3,384 of those grahas still scored >= 50 — so where they disagree the sentence says
   why (`scripts/bhava_dignity_sweep.py`; full figures in `bhava_palan_copy`). This is
   also
   the only place the Navamsa becomes visible to a reader: D9 reaches `bhava_bala`
   upstream and silently, inside the lord's `strength_score`.

This module is deliberately pure — no DB, no ephemeris — so the whole register is
unit-testable from a dict of planet placements.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal

from app.calculations.aspects import aspect_strength, effective_natural_class
from app.calculations.bhava_palan_copy import (
    BHANGA,
    BHANGA_VIA_D9,
    CONDUCT,
    CONDUCT_FALLBACK,
    DEBILITATED_BUT_PLACED,
    FRAMING,
    FRAMING_QUIET,
    HOLLOW_EXALTATION,
    HOUSE_DOMAIN,
    INVERSION_NOTE,
    UPACHAYA_NOTE,
)
from app.calculations.chart_strength import (
    DEBILITATION_RASI,
    EXALTATION_RASI,
    neecha_bhanga_cancelled,
)
from app.calculations.display_names import planet_en, planet_ta
from app.constants.astrology import SIGN_LORD

Polarity = Literal["DIRECT", "UPACHAYA", "INVERTED"]
Verdict = Literal["SUPPORTED", "MIXED", "NEEDS_CARE"]

# ── Polarity ────────────────────────────────────────────────────────────────────
#
# UPACHAYA (3, 11) are the growth houses: they improve with age and effort, so a low
# reading is not a life sentence and the band is the most forgiving of the three.
#
# INVERTED (6, 8, 12) follow the Parashari line that a *quiet* dusthana favours the
# native. This is a lineage choice, not a claim that the other reading is wrong — but
# it is the defensible reading for THIS formula specifically, because `bhava_bala` is
# 50% lord strength and a strong 6th lord strengthens debts, illness and opponents.
_UPACHAYA: frozenset[int] = frozenset({3, 11})
_INVERTED: frozenset[int] = frozenset({6, 8, 12})


def polarity_of(house: int) -> Polarity:
    if house in _INVERTED:
        return "INVERTED"
    if house in _UPACHAYA:
        return "UPACHAYA"
    return "DIRECT"


# (supported_at, needs_care_below) for the two non-inverted scales.
#
# The green cuts were raised by 2 on 2026-09-30 (owner ruling, doc §9-Q1a). At the
# original 50/48/41 a re-sweep through today's scorer showed 4.5 green houses per
# chart and 28% of charts mostly green — the band had drifted ~1.4 greens above the
# 26% SUPPORTED the ruling was set at — and 21% of all greens sat exactly ON the
# line. Raised by 2: 3.1 green per chart, 8% mostly green. Red cuts unchanged.
_CUT_DIRECT = (52, 40)
_CUT_UPACHAYA = (50, 38)
# Inverted is read the other way round: low is the good news.
_INVERTED_QUIET_AT = 39
_INVERTED_LOUD_AT = 51


def verdict_of(house: int, bhava_bala: int) -> Verdict:
    """Band one house. See the module docstring for why this is polarity-aware."""
    pol = polarity_of(house)
    if pol == "INVERTED":
        if bhava_bala <= _INVERTED_QUIET_AT:
            return "SUPPORTED"
        if bhava_bala >= _INVERTED_LOUD_AT:
            return "NEEDS_CARE"
        return "MIXED"
    supported_at, care_below = _CUT_UPACHAYA if pol == "UPACHAYA" else _CUT_DIRECT
    if bhava_bala >= supported_at:
        return "SUPPORTED"
    if bhava_bala < care_below:
        return "NEEDS_CARE"
    return "MIXED"


# ── Band words ──────────────────────────────────────────────────────────────────
#
# The enum stays three-valued, but the WORD is polarity-aware: the top band for a
# dusthana is "quiet", not "supported". A quiet 6th means few enemies, which is the
# honest sentence; calling it "strong" beside a low number makes the reader distrust
# the whole panel.
#
# Never "பலவீனம்" for the low band — that reads as a life sentence in Tamil, and the
# tone validator bans fatalistic phrasing.
_BAND_WORD: dict[tuple[Verdict, bool], tuple[str, str]] = {
    ("SUPPORTED", False): ("வலுவானது", "Supported"),
    ("SUPPORTED", True): ("அமைதி", "Quiet"),
    ("MIXED", False): ("கலப்பு", "Mixed"),
    ("MIXED", True): ("கலப்பு", "Mixed"),
    ("NEEDS_CARE", False): ("கவனம் தேவை", "Needs care"),
    ("NEEDS_CARE", True): ("கவனம் தேவை", "Needs care"),
}


def band_word(verdict: Verdict, house: int) -> tuple[str, str]:
    """(ta, en) display word for a band, aware of dusthana inversion."""
    return _BAND_WORD[(verdict, house in _INVERTED)]


# ── House labels ────────────────────────────────────────────────────────────────
#
# Tamil almanac names, which carry meaning the ordinal does not.
#
# The 8th is DELIBERATELY not ஆயுள் ஸ்தானம். That name invites precisely the
# longevity question this product permanently refuses (Balarishta, 2026-09-11), from
# exactly the Tamil reader who knows the term. மாற்றம் is also what shipped copy
# already says for house 8. Do not "correct" this back to the almanac name.
HOUSE_LABEL: dict[int, tuple[str, str]] = {
    1: ("லக்னம்", "Self"),
    2: ("தனம்", "Family & resources"),
    3: ("விக்கிரமம்", "Courage & effort"),
    4: ("சுகம்", "Home & peace"),
    5: ("புத்திரம்", "Learning & children"),
    6: ("ரிபு", "Obstacles & health"),
    7: ("களத்திரம்", "Partnership"),
    8: ("மாற்றம்", "Deep change"),
    9: ("பாக்கியம்", "Fortune & dharma"),
    10: ("தொழில்", "Work & standing"),
    11: ("லாபம்", "Gains & network"),
    12: ("விரயம்", "Rest & release"),
}


# ── Which term is driving the verdict ───────────────────────────────────────────

@dataclass(frozen=True, slots=True)
class DominantTerm:
    """The term that moved this house furthest from neutral, and who did it.

    `graha` is the single body most responsible — the house lord for a lordship
    term, or the strongest benefic/malefic for an occupant or drishti term. It is
    what the why-line and the whole conduct register key on, so it is never None
    for a house that has any signal at all.
    """

    term: Literal["LORD", "OCCUPANT", "DRISHTI"]
    graha: str | None
    helps: bool


def _term_scores(
    house: int,
    lagna_rasi: int,
    planets_rasi: dict[str, int],
    planet_scores: dict[str, int],
) -> tuple[int, int, int, str]:
    """Recompute the three terms of `compute_bhava_bala` so we can say which one won.

    Deliberately mirrors `chart_strength.compute_bhava_bala` rather than changing it
    to return its parts: that function feeds the LIVE Life Areas score
    (life_areas_service.py:1669) and is not worth destabilising for a display panel.
    If the formula there changes, this must change with it — the parity test in
    tests/test_bhava_palan.py asserts the two agree.
    """
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    house_lord = SIGN_LORD[house_rasi]
    lord_score = planet_scores.get(house_lord, 50)

    occupant = 50
    for planet, rasi in planets_rasi.items():
        if rasi != house_rasi:
            continue
        if effective_natural_class(planet, planets_rasi) == "BENEFIC":
            occupant += 10
        elif _is_malefic(planet, planets_rasi):
            occupant -= 10
    occupant = max(0, min(100, occupant))

    drishti = 50
    for planet, rasi in planets_rasi.items():
        strength = aspect_strength(planet, rasi, house_rasi)
        if strength <= 0:
            continue
        if effective_natural_class(planet, planets_rasi) == "BENEFIC":
            drishti += round(8 * strength)
        elif _is_malefic(planet, planets_rasi):
            drishti -= round(8 * strength)
    drishti = max(0, min(100, drishti))

    return lord_score, occupant, drishti, house_lord


def _is_malefic(planet: str, planets_rasi: dict[str, int]) -> bool:
    """Mirror of chart_strength._is_bhava_bala_malefic (nodes always count)."""
    if planet in ("RAHU", "KETU"):
        return True
    return effective_natural_class(planet, planets_rasi) == "MALEFIC"


def dominant_term(
    house: int,
    lagna_rasi: int,
    planets_rasi: dict[str, int],
    planet_scores: dict[str, int],
) -> DominantTerm:
    """Which of the three terms moved this house furthest from neutral, and who.

    Not keyed on the band: a SUPPORTED house still has a reason, and naming it is
    what stops the copy reading like a horoscope column.
    """
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    lord_score, occupant, drishti, house_lord = _term_scores(
        house, lagna_rasi, planets_rasi, planet_scores
    )

    # Weighted distance from neutral, matching each term's share of the composite.
    candidates = [
        ("LORD", abs(lord_score - 50) * 0.5, lord_score >= 50),
        ("OCCUPANT", abs(occupant - 50) * 0.25, occupant >= 50),
        ("DRISHTI", abs(drishti - 50) * 0.25, drishti >= 50),
    ]
    term, _, helps = max(candidates, key=lambda c: c[1])

    if term == "LORD":
        return DominantTerm("LORD", house_lord, helps)

    # For occupant/drishti, name the body most responsible for the swing.
    best: str | None = None
    best_weight = 0.0
    for planet, rasi in planets_rasi.items():
        if term == "OCCUPANT":
            if rasi != house_rasi:
                continue
            weight = 1.0
        else:
            weight = aspect_strength(planet, rasi, house_rasi)
            if weight <= 0:
                continue
        is_benefic = effective_natural_class(planet, planets_rasi) == "BENEFIC"
        if is_benefic != helps:
            continue
        if weight > best_weight:
            best, best_weight = planet, weight

    return DominantTerm(term, best, helps)


# ── Karako bhava nashaya ────────────────────────────────────────────────────────
#
# "The karaka destroys the bhava" — a bhava karaka sitting in its own bhava strains
# it. Deliberately a DISPLAY NOTE and not a score term: `compute_bhava_bala` feeds the
# live Life Areas score (life_areas_service.py:1669), and shipping a reading panel is
# not a reason to silently move every user's career and marriage numbers (ruling Q5).
#
# Conservative set — only the well-attested four, plus Mars/3. Deliberately excludes
# Saturn in the 8th (the classical exception: it is said to *give* longevity), and the
# contested Sun/10 and Jupiter/11, where the placement is generally read as good.
_BHAVA_KARAKA: dict[int, str] = {
    3: "MARS",
    4: "MOON",
    5: "JUPITER",
    7: "VENUS",
    9: "SUN",
}


def karaka_in_own_bhava(house: int, lagna_rasi: int, planets_rasi: dict[str, int]) -> str | None:
    """The bhava karaka, if it is sitting in the very house it signifies."""
    karaka = _BHAVA_KARAKA.get(house)
    if karaka is None:
        return None
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    return karaka if planets_rasi.get(karaka) == house_rasi else None


# ── What the chart on screen shows about the lord ─────────────────────────────

@dataclass(frozen=True, slots=True)
class LordDignity:
    """The house lord's dignity across D1 and D9 — only for the why-line's honesty.

    Nothing here touches a score. `bhava_bala` is already decided by the time this is
    built; these flags decide whether the sentence explaining it has to state its
    ground (see `bhava_palan_copy`, "Why the chart on screen disagrees").

    `bhanga` follows the canonical `chart_strength.neecha_bhanga_cancelled` rather than
    a fourth copy of the rule — the same predicate the +14 synthesis term and the yoga
    card use, so the panel cannot disagree with either (audit C2).
    """

    debilitated: bool = False
    exalted: bool = False
    bhanga: bool = False
    bhanga_via_d9: bool = False
    d9_debilitated: bool = False


def lord_dignity_of(
    lord: str,
    lagna_rasi: int,
    planets_rasi: Mapping[str, int],
    d9_rasi: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
) -> LordDignity:
    """Read the lord's dignity in both vargas.

    Without `d9_rasi` the D9 flags stay False and neecha bhanga is tested on its three
    Rasi-side routes only — the caller simply has no Navamsa to look at. The service
    always passes it; the pure unit tests mostly do not, and a missing D9 must degrade
    to a quieter sentence, never to a wrong one.
    """
    rasi = planets_rasi.get(lord)
    if rasi is None:
        return LordDignity()

    debilitated = DEBILITATION_RASI.get(lord) == rasi
    exalted = EXALTATION_RASI.get(lord) == rasi

    bhanga = False
    via_d9 = False
    if debilitated:
        bhanga, conditions = neecha_bhanga_cancelled(
            lord,
            planet_rasi=planets_rasi,
            lagna_rasi=lagna_rasi,
            d9_rasi_map=d9_rasi,
            d9_lagna_rasi=d9_lagna_rasi,
        )
        via_d9 = "debilitated_planet_strong_d9" in conditions

    d9_debilitated = (
        d9_rasi is not None
        and lord in d9_rasi
        and DEBILITATION_RASI.get(lord) == d9_rasi[lord]
    )

    return LordDignity(
        debilitated=debilitated,
        exalted=exalted,
        bhanga=bhanga,
        bhanga_via_d9=via_d9,
        d9_debilitated=d9_debilitated,
    )


@dataclass(frozen=True, slots=True)
class BhavaPalan:
    """Everything the panel needs for one house, already decided."""

    house: int
    bhava_bala: int
    polarity: Polarity
    verdict: Verdict
    dominant: DominantTerm
    karaka_conflict: str | None
    lord_dignity: LordDignity = LordDignity()


def build_palan(
    house: int,
    lagna_rasi: int,
    planets_rasi: dict[str, int],
    planet_scores: dict[str, int],
    bhava_bala: int,
    *,
    d9_rasi: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
) -> BhavaPalan:
    """Band one house and work out who is responsible for that band.

    `bhava_bala` is passed in rather than recomputed so this stays the single
    consumer of whatever `compute_all_bhava_bala` decided — no second opinion.

    `d9_rasi`/`d9_lagna_rasi` are read for the why-line ONLY (see `LordDignity`). The
    band is unchanged by them: D9 already reached this number upstream, inside the
    lord's score, and folding it in a second time here is the double-count the whole
    module is written to avoid.
    """
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    return BhavaPalan(
        house=house,
        bhava_bala=bhava_bala,
        polarity=polarity_of(house),
        verdict=verdict_of(house, bhava_bala),
        dominant=dominant_term(house, lagna_rasi, planets_rasi, planet_scores),
        karaka_conflict=karaka_in_own_bhava(house, lagna_rasi, planets_rasi),
        lord_dignity=lord_dignity_of(
            SIGN_LORD[house_rasi], lagna_rasi, planets_rasi, d9_rasi, d9_lagna_rasi
        ),
    )


# ── Rendering ───────────────────────────────────────────────────────────────────
#
# Returns bare (ta, en) tuples rather than ChartExplanationText so this module stays
# schema-free and unit-testable on its own; the service wraps them.

def render_framing(palan: BhavaPalan) -> tuple[str, str]:
    """The opening sentence — what this band means, in the house's own domain."""
    domain_ta, domain_en = HOUSE_DOMAIN[palan.house]
    if palan.verdict == "SUPPORTED" and palan.polarity == "INVERTED":
        ta, en = FRAMING_QUIET
    else:
        ta, en = FRAMING[palan.verdict]
    return ta.format(domain=domain_ta), en.format(domain=domain_en)


def _varga_ground(dignity: LordDignity, helps: bool) -> tuple[str, str] | None:
    """The clause that reconciles the lord sentence with the chart on screen.

    Fires only where the two actually disagree. A debilitated lord that reads *weak*
    needs no explanation — the reader can see why — and neither does an exalted one
    that reads strong; adding a note there would undercut a verdict for no reason.
    """
    if helps and dignity.debilitated:
        if dignity.bhanga:
            return BHANGA_VIA_D9 if dignity.bhanga_via_d9 else BHANGA
        return DEBILITATED_BUT_PLACED
    if not helps and dignity.exalted and dignity.d9_debilitated:
        return HOLLOW_EXALTATION
    return None


def render_why(palan: BhavaPalan, lord_house: int | None) -> tuple[str, str]:
    """Why this house reads the way it does, naming the graha responsible.

    Never generic. A reader must be able to check the claim against the chart on the
    same screen — which is why this names the body and, for a lordship verdict, where
    that body actually sits.
    """
    d = palan.dominant
    if d.graha is None:
        return (
            "இந்த வீட்டில் தனித்து நிற்கும் வலுவான சமிக்ஞை எதுவும் இல்லை — "
            "இது சமநிலையான நிலை.",
            "No single influence stands out on this house — it sits in balance.",
        )

    name_ta, name_en = planet_ta(d.graha), planet_en(d.graha)

    if d.term == "LORD":
        where_ta = f" {lord_house}-ஆம் வீட்டில்" if lord_house else ""
        where_en = f" in house {lord_house}" if lord_house else ""
        if d.helps:
            ta = f"இதன் அதிபதி {name_ta}{where_ta} வலுவாக அமர்ந்துள்ளார்."
            en = f"Its lord {name_en} is strongly placed{where_en}."
        else:
            ta = f"இதன் அதிபதி {name_ta}{where_ta} வலு குறைந்து அமர்ந்துள்ளார்."
            en = f"Its lord {name_en} sits{where_en} without much strength."
    elif d.term == "OCCUPANT":
        if d.helps:
            ta = f"{name_ta} இந்த வீட்டில் அமர்ந்து இதற்கு ஆதரவு தருகிறார்."
            en = f"{name_en} sits in this house and supports it."
        else:
            ta = f"{name_ta} இந்த வீட்டில் அமர்ந்து இதற்கு அழுத்தம் தருகிறார்."
            en = f"{name_en} sits in this house and puts pressure on it."
    else:  # DRISHTI
        if d.helps:
            ta = f"{name_ta} இந்த வீட்டை நல்ல பார்வையால் பார்க்கிறார்."
            en = f"{name_en} casts a supportive aspect on this house."
        else:
            ta = f"{name_ta} இந்த வீட்டைப் பார்ப்பதால் கூடுதல் அழுத்தம் உள்ளது."
            en = f"{name_en}'s aspect falls on this house and adds pressure."

    # The lord sentence is the only one the reader can check against the chart drawn
    # beside it, and the only one D9 reaches, so it is the only one that states its
    # ground. See `bhava_palan_copy`, "Why the chart on screen disagrees".
    if d.term == "LORD":
        ground = _varga_ground(palan.lord_dignity, d.helps)
        if ground is not None:
            ta += f" {ground[0]}"
            en += f" {ground[1]}"

    # On 6/8/12 a *helpful* mechanic produces a NEEDS_CARE band, which reads as a
    # contradiction unless the bridge is said out loud right there. The general
    # inversion note is not enough at this distance.
    if palan.polarity == "INVERTED" and d.helps and palan.verdict == "NEEDS_CARE":
        ta += " இங்கு வலிமை என்பது இந்தத் துறை உங்களிடம் உண்மையான உழைப்பைக் கேட்கிறது என்பதே."
        en += " Strength here means this area asks real work of you."

    return ta, en


def render_conduct(palan: BhavaPalan) -> tuple[list[tuple[str, str]], list[tuple[str, str]]]:
    """(lean_on, go_slowly) — keyed on the responsible graha, not on the band."""
    register = CONDUCT.get(palan.dominant.graha or "", CONDUCT_FALLBACK)
    if register is CONDUCT_FALLBACK:
        return list(CONDUCT_FALLBACK["lean_on"]), list(CONDUCT_FALLBACK["go_slowly"])
    return list(register["lean_on"]), list(register["go_slowly"])


def render_karaka_note(palan: BhavaPalan) -> tuple[str, str] | None:
    """Karako bhava nashaya, as a note — never as a score term (ruling Q5)."""
    if palan.karaka_conflict is None:
        return None
    name_ta, name_en = planet_ta(palan.karaka_conflict), planet_en(palan.karaka_conflict)
    label_ta, label_en = HOUSE_LABEL[palan.house]
    return (
        f"{name_ta} இந்த வீட்டின் காரகன்; காரகன் தன் சொந்த வீட்டில் அமர்வது "
        f"{label_ta} துறையிடம் கூடுதல் முயற்சியைக் கேட்கும் என்பது மரபு.",
        f"{name_en} is this house's natural significator, and a significator sitting in "
        f"its own house is classically read as asking more of that area, not less.",
    )


# ── Contrast line: the lord's chip and the house's chip disagree ────────────────
#
# Family & Charts draws the house chip in one table and each graha's own strength
# chip in another, lower on the same page. A reader who sees "Supported" on the 10th
# and "Needs support" on Saturn, its lord, reads a contradiction — and the why-line
# made it worse, because `dominant_term` names the single LARGEST term: on a chart
# where the lord pulls a 10th down by 6.5 and the Moon (+2.5) and Jupiter's aspect
# (+4) together pull it up by more, the why-line names only Saturn, under a green
# chip. This line names what actually carried the house, and it shows in the CLOSED
# row, where the contradiction is seen.
#
# The planet chip's cuts live in web (`scoreLabel` in
# web/components/dashboard-chart-explanation.tsx: >=70 Strong, <45 Needs support).
# Mirrored, not shared, because the chip is drawn there; if those cuts move, move
# these. A "Moderate" lord never contradicts anything, so it never fires.
_LORD_CHIP_STRONG_AT = 70
_LORD_CHIP_WEAK_BELOW = 45


def _verdict_pull(house: int, verdict: Verdict) -> bool | None:
    """Which way the NUMBER moved to earn this verdict: True up, False down.

    On 6/8/12 the good band is the low one, so a Quiet house was pulled DOWN.
    MIXED makes no claim, so there is nothing for a lord to contradict.
    """
    if verdict == "MIXED":
        return None
    up = verdict == "SUPPORTED"
    return (not up) if polarity_of(house) == "INVERTED" else up


def _pullers(
    house: int,
    lagna_rasi: int,
    planets_rasi: dict[str, int],
    exclude: str,
    up: bool,
) -> list[str]:
    """Grahas whose occupancy or aspect moved this house in direction `up`, heaviest
    first, with the same weights `_term_scores` uses (occupant 10, aspect 8 x
    strength). The lord is excluded: "Saturn is weak, but Saturn carries it" is
    not a reason."""
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    weight: dict[str, float] = {}
    for planet, rasi in planets_rasi.items():
        if planet == exclude:
            continue
        benefic = effective_natural_class(planet, planets_rasi) == "BENEFIC"
        if benefic != up or (not benefic and not _is_malefic(planet, planets_rasi)):
            continue
        w = 10.0 if rasi == house_rasi else 0.0
        strength = aspect_strength(planet, rasi, house_rasi)
        if strength > 0:
            w += round(8 * strength)
        if w > 0:
            weight[planet] = w
    # Stable sort: ties keep the placement dict's order, so output is deterministic.
    return sorted(weight, key=lambda g: -weight[g])[:2]


def _names_ta(names: list[str]) -> str:
    """Same rule as the service's `_graha_list_ta`: a list of persons closes with ஆகியோர்."""
    return names[0] if len(names) == 1 else f"{', '.join(names)} ஆகியோர்"


def _names_en(names: list[str]) -> str:
    return names[0] if len(names) == 1 else f"{', '.join(names[:-1])} and {names[-1]}"


def render_contrast(
    house: int,
    lagna_rasi: int,
    planets_rasi: dict[str, int],
    planet_scores: dict[str, int],
    verdict: Verdict,
) -> tuple[str, str] | None:
    """One short line for the closed row, only where the lord's own chip points the
    other way from the house's chip. None everywhere else — a line on every row
    would be read as boilerplate and skipped."""
    pull = _verdict_pull(house, verdict)
    if pull is None:
        return None
    house_rasi = ((lagna_rasi + house - 2) % 12) + 1
    lord = SIGN_LORD[house_rasi]
    score = planet_scores.get(lord)
    if score is None:
        return None
    if score >= _LORD_CHIP_STRONG_AT:
        lord_up = True
    elif score < _LORD_CHIP_WEAK_BELOW:
        lord_up = False
    else:
        return None

    inverted = polarity_of(house) == "INVERTED"
    lord_ta, lord_en = planet_ta(lord), planet_en(lord)
    adj_ta, adj_en = ("வலுவானவர்", "strong") if lord_up else ("வலு குறைந்தவர்", "weak")
    lead_ta = f"அதிபதி {lord_ta} {adj_ta}"
    lead_en = f"Lord {lord_en} is {adj_en}"

    if lord_up == pull:
        # The lord explains the verdict on its own. That only LOOKS wrong on 6/8/12,
        # where a weak lord earns a green chip and a strong one a red chip.
        if not inverted:
            return None
        if pull:
            return (f"{lead_ta}; அதனால் இந்த வீடு அதிகம் இயங்குகிறது.",
                    f"{lead_en}, which keeps this house active.")
        return (f"{lead_ta}; அதனால் இந்த வீடு அமைதியாக உள்ளது.",
                f"{lead_en}, which keeps this house quiet.")

    # Something other than the lord outweighed it — name it.
    names = _pullers(house, lagna_rasi, planets_rasi, lord, pull)
    if not names:
        return None
    who_ta = _names_ta([planet_ta(g) for g in names])
    who_en = _names_en([planet_en(g) for g in names])
    many = len(names) > 1
    if not inverted and pull:
        verb_ta = "இந்த வீட்டைத் தாங்குகின்றனர்" if many else "இந்த வீட்டைத் தாங்குகிறார்"
        verb_en = "carry this house" if many else "carries this house"
    elif not inverted:
        verb_ta = ("இந்த வீட்டின் மேல் அழுத்தம் தருகின்றனர்" if many
                   else "இந்த வீட்டின் மேல் அழுத்தம் தருகிறார்")
        verb_en = "weigh on this house" if many else "weighs on this house"
    elif pull:
        verb_ta = ("இந்த வீட்டை அதிகம் இயங்க வைக்கின்றனர்" if many
                   else "இந்த வீட்டை அதிகம் இயங்க வைக்கிறார்")
        verb_en = "keep this house active" if many else "keeps this house active"
    else:
        verb_ta = ("இந்த வீட்டை அமைதியாக வைத்துள்ளனர்" if many
                   else "இந்த வீட்டை அமைதியாக வைத்துள்ளார்")
        verb_en = "keep this house quiet" if many else "keeps this house quiet"
    return (f"{lead_ta}; ஆனால் {who_ta} {verb_ta}.",
            f"{lead_en}, but {who_en} {verb_en}.")


def render_polarity_note(palan: BhavaPalan) -> tuple[str, str] | None:
    """The line that stops a green chip on a low house looking like a bug."""
    if palan.polarity == "INVERTED":
        return INVERSION_NOTE
    if palan.polarity == "UPACHAYA":
        return UPACHAYA_NOTE
    return None
