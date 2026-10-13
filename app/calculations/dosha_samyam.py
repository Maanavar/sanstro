"""Dosha samyam for matching (DOCTRINE_DECISIONS v1.3, DD-03).

Samyam is a porutham concept, never a single-chart one: it asks whether two
partners carry comparable doshas, so neither chart's dosham weighs on the match.
Three samyams are kept apart on purpose and never merged:

* ``sevvai_samyam`` — both charts carry an uncancelled Sevvai dosham. It already
  lives in `compatibility_intelligence._apply_mutual_sevvai_cancellation`.
* ``rahu_ketu_samyam`` — both charts carry a Rahu–Ketu marriage axis of
  comparable grade. Tier B practice, below.
* ``papa_samyam`` — the wider balance of malefics in the marriage houses
  (பாப சாம்யம்). Built for F-CI-03; see `papa_samyam` below.

Cross-samyam — Rahu–Ketu in one chart balanced by Sevvai in the other — is
contested (O-3) and stays off unless `DoctrineOptions.o3_cross_samyam` is set.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.calculations._yoga_helpers import DoshamResult
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions

_GRADE_RANK = {"WEAK": 0, "PARTIAL": 1, "MODERATE": 1, "STRONG": 2}


def _uncancelled(result: DoshamResult | None) -> bool:
    return result is not None and result.is_present and not result.is_cancelled


def rahu_ketu_samyam(a: DoshamResult | None, b: DoshamResult | None) -> bool:
    """Both partners carry an uncancelled Rahu–Ketu axis of comparable grade.

    "Comparable" is read as the same grade or one step apart (Tier C): a Mild
    axis balances a Moderate one, but not a Strong one.
    """
    if a is None or b is None or not (_uncancelled(a) and _uncancelled(b)):
        return False
    return abs(_GRADE_RANK.get(a.strength, 0) - _GRADE_RANK.get(b.strength, 0)) <= 1


def cross_samyam(
    rahu_ketu: DoshamResult | None,
    sevvai: DoshamResult | None,
    options: DoctrineOptions = DEFAULT_DOCTRINE,
) -> bool:
    """Rahu–Ketu in one chart balanced by Sevvai in the other. Off by default (O-3)."""
    return options.o3_cross_samyam and _uncancelled(rahu_ketu) and _uncancelled(sevvai)


@dataclass(frozen=True, slots=True)
class MarriageSamyam:
    rahu_ketu: bool
    cross: bool


def compare_marriage_doshams(
    rahu_ketu_a: DoshamResult | None,
    rahu_ketu_b: DoshamResult | None,
    sevvai_a: DoshamResult | None,
    sevvai_b: DoshamResult | None,
    options: DoctrineOptions = DEFAULT_DOCTRINE,
) -> MarriageSamyam:
    return MarriageSamyam(
        rahu_ketu=rahu_ketu_samyam(rahu_ketu_a, rahu_ketu_b),
        cross=cross_samyam(rahu_ketu_a, sevvai_b, options) or cross_samyam(rahu_ketu_b, sevvai_a, options),
    )


# ── Papa samyam (பாப சாம்யம்) ───────────────────────────────────────────────
#
# F-CI-03. A standard part of Tamil jadhaga porutham that the report simply
# omitted: Tamil families who bring two jadhagams to a jothidar expect it, and
# a silent omission reads as "we checked and it was fine".
#
# The reckoning: count the malefics occupying the marriage-sensitive houses
# **from each of three references in turn** — Lagna, Moon and Venus — in both
# charts, and compare the totals. This is the same three-reference frame the
# Sevvai rule uses (`_yoga_helpers.TAMIL_SEVVAI_HOUSES`), which is why it is
# written against the same house set rather than a second one.

#: The malefics counted. Mandhi/Gulika is deliberately NOT here even though
#: `_yoga_helpers.NATURAL_MALEFICS` includes it: papa samyam as practised
#: counts the five grahas, and adding a sixth body would make our totals
#: incomparable with the count a jothidar does by hand.
PAPA_GRAHAS: frozenset[str] = frozenset({"SUN", "MARS", "SATURN", "RAHU", "KETU"})

#: Houses from each reference in which a malefic carries papa weight —
#: 1, 2, 4, 7, 8, 12, the Sevvai set.
PAPA_HOUSES: frozenset[int] = frozenset({1, 2, 4, 7, 8, 12})

#: References counted from, in the order they are reported.
PAPA_REFERENCES: tuple[str, ...] = ("LAGNA", "MOON", "VENUS")


@dataclass(frozen=True, slots=True)
class PapaCount:
    """One chart's papa points, with the per-reference breakdown kept.

    The breakdown is kept because the total alone cannot be checked by hand
    against a jothidar's own count, and an unexplainable number in a marriage
    report is worse than no number.
    """

    total: int
    by_reference: dict[str, int]
    grahas: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class PapaSamyam:
    boy: PapaCount
    girl: PapaCount
    #: True when the boy's papa points are >= the girl's, which is the
    #: condition practice asks for.
    balanced: bool
    #: How far short the boy falls when unbalanced; 0 when balanced.
    shortfall: int


def papa_count(
    planets_rasi: dict[str, int],
    lagna_rasi: int,
    *,
    houses: frozenset[int] = PAPA_HOUSES,
) -> PapaCount:
    """One chart's papa points over Lagna, Moon and Venus.

    A malefic in a papa house counts **once per reference it is in one from**,
    so a graha sitting in the 7th from both the Lagna and the Moon scores two.
    That is the practice: the references are three separate readings of the
    same chart, not one reading to be de-duplicated.

    A reference whose own graha is missing from `planets_rasi` is skipped
    rather than counted as zero — a chart we could not read from the Moon has
    an unknown Moon count, not a clean one.
    """
    from app.calculations.astro import house_from_reference

    reference_rasi = {
        "LAGNA": lagna_rasi,
        "MOON": planets_rasi.get("MOON"),
        "VENUS": planets_rasi.get("VENUS"),
    }
    by_reference: dict[str, int] = {}
    hits: set[str] = set()
    for reference in PAPA_REFERENCES:
        origin = reference_rasi[reference]
        if origin is None:
            continue
        count = 0
        for graha in sorted(PAPA_GRAHAS):
            rasi = planets_rasi.get(graha)
            if rasi is None:
                continue
            if house_from_reference(origin, rasi) in houses:
                count += 1
                hits.add(graha)
        by_reference[reference] = count
    return PapaCount(
        total=sum(by_reference.values()),
        by_reference=by_reference,
        grahas=tuple(sorted(hits)),
    )


def papa_samyam(
    boy_planets_rasi: dict[str, int],
    boy_lagna_rasi: int,
    girl_planets_rasi: dict[str, int],
    girl_lagna_rasi: int,
) -> PapaSamyam:
    """பாப சாம்யம் — is the malefic load balanced between the two charts?

    Practice asks that the **boy's papa points be at least the girl's**. The
    direction is not symmetric and is not a modern reading: it is the form the
    rule is stated in, and it is why `synastry_service._assign_bride_groom`
    getting the direction wrong (F-POR-05) would have inverted this check too.

    Returns the two counts and the verdict. It deliberately does **not** score:
    the composite's weights are a separate decision, and shipping a silent
    numeric effect in the same change as a new check would make neither
    attributable.
    """
    boy = papa_count(boy_planets_rasi, boy_lagna_rasi)
    girl = papa_count(girl_planets_rasi, girl_lagna_rasi)
    return PapaSamyam(
        boy=boy,
        girl=girl,
        balanced=boy.total >= girl.total,
        shortfall=max(0, girl.total - boy.total),
    )
