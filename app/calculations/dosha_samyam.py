"""Dosha samyam for matching (DOCTRINE_DECISIONS v1.3, DD-03).

Samyam is a porutham concept, never a single-chart one: it asks whether two
partners carry comparable doshas, so neither chart's dosham weighs on the match.
Three samyams are kept apart on purpose and never merged:

* ``sevvai_samyam`` — both charts carry an uncancelled Sevvai dosham. It already
  lives in `compatibility_intelligence._apply_mutual_sevvai_cancellation`.
* ``rahu_ketu_samyam`` — both charts carry a Rahu–Ketu marriage axis of
  comparable grade. Tier B practice, below.
* ``papa_samyam`` — the wider balance of malefics in the marriage houses. Not
  built; DD-05 parks the Rahu–Ketu gender markers there if they return at all.

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
