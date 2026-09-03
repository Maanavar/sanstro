"""Named malefic-affliction analysis for a bhava, its lord, and its karaka.

Before this module, natal malefic influence entered predictions only as an
averaged multiplier (drik bala inside planet strength / bhava bala). A
classical astrologer treats Saturn's drishti on the 7th house as a *named
delay signature*, papa kartari as a *named hemming*, and multiple malefics
on the karaka as an affliction that qualifies the birth promise itself —
not as a -0.15 buried in an average. This module surfaces those named
findings so every prediction path can (a) show them to the user as
explicit factors and (b) feed them into the promise gate as an
area-specific dosham.

Conventions (documented, per this repo's aspect table in aspects.py):
  - Affliction candidates are Saturn, Mars, Rahu, Ketu, Moon and Mercury.
    Moon's paksha and Mercury's association decide their effective class.
    Sun's affliction is combustion, handled elsewhere; it is counted only for
    kartari hemming, where classical papa includes the Sun.
  - A malefic that *owns* the bhava is exempt from afflicting that bhava
    (Saturn aspecting its own house reads as stability/delay, not denial).
  - Kartari: papa when malefics stand in both the 12th and 2nd from the
    bhava; shubha when benefics hem both sides with no malefic in either.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.calculations.aspects import aspects_house, effective_natural_class
from app.calculations.chart_strength import SIGN_LORD

_AFFLICTION_CANDIDATES: frozenset[str] = frozenset(
    {"SATURN", "MARS", "RAHU", "KETU", "MOON", "MERCURY"}
)


def _effective_malefics(planet_rasis: dict[str, int]) -> set[str]:
    return {
        planet
        for planet in _AFFLICTION_CANDIDATES & planet_rasis.keys()
        if effective_natural_class(planet, planet_rasis) == "MALEFIC"
    }


def _effective_benefics(planet_rasis: dict[str, int]) -> set[str]:
    return {
        planet
        for planet in {"JUPITER", "VENUS", "MOON", "MERCURY"} & planet_rasis.keys()
        if effective_natural_class(planet, planet_rasis) == "BENEFIC"
    }


@dataclass(frozen=True, slots=True)
class BhavaAfflictionReport:
    bhava_house: int
    malefics_occupying: tuple[str, ...]
    malefics_aspecting: tuple[str, ...]
    lord_afflicted_by: tuple[str, ...]
    karaka_afflicted_by: tuple[str, ...]
    papa_kartari: bool
    shubha_kartari: bool
    severity: int

    @property
    def is_afflicted(self) -> bool:
        return self.severity >= 3


def affliction_dosham_strength(severity: int) -> str:
    """Collapse severity into the prediction-score dosham vocabulary.

    Thresholds are deliberately conservative: with four malefics each
    aspecting ~3 houses, an average chart carries severity 1-2 on most
    bhavas — that is normal background, not an affliction.
    """
    if severity >= 7:
        return "STRONG"
    if severity >= 5:
        return "MODERATE"
    if severity >= 3:
        return "MILD"
    return "NONE"


def _planet_afflictors(
    target: str,
    target_rasi: int | None,
    planet_rasis: dict[str, int],
) -> tuple[str, ...]:
    """Malefics conjunct with or aspecting `target`'s natal position."""
    if target_rasi is None:
        return ()
    hits = []
    for malefic in sorted(_effective_malefics(planet_rasis)):
        if malefic == target:
            continue
        rasi = planet_rasis.get(malefic)
        if rasi is None:
            continue
        if rasi == target_rasi or aspects_house(malefic, rasi, target_rasi):
            hits.append(malefic)
    return tuple(hits)


def assess_bhava_afflictions(
    *,
    lagna_rasi: int,
    bhava_house: int,
    planet_rasis: dict[str, int],
    karaka: str | None = None,
) -> BhavaAfflictionReport:
    bhava_rasi = ((lagna_rasi + bhava_house - 2) % 12) + 1
    bhava_lord = SIGN_LORD.get(bhava_rasi, "SUN")

    occupying = tuple(
        malefic
        for malefic in sorted(_effective_malefics(planet_rasis))
        if malefic != bhava_lord and planet_rasis.get(malefic) == bhava_rasi
    )
    aspecting = tuple(
        malefic
        for malefic in sorted(_effective_malefics(planet_rasis))
        if malefic != bhava_lord
        and (rasi := planet_rasis.get(malefic)) is not None
        and rasi != bhava_rasi
        and aspects_house(malefic, rasi, bhava_rasi)
    )

    lord_afflicted = _planet_afflictors(bhava_lord, planet_rasis.get(bhava_lord), planet_rasis)
    karaka_afflicted: tuple[str, ...] = ()
    if karaka is not None and karaka != bhava_lord:
        karaka_afflicted = _planet_afflictors(karaka, planet_rasis.get(karaka), planet_rasis)

    before_rasi = ((bhava_rasi - 2) % 12) + 1  # 12th from the bhava
    after_rasi = (bhava_rasi % 12) + 1  # 2nd from the bhava
    before = {p for p, r in planet_rasis.items() if r == before_rasi}
    after = {p for p, r in planet_rasis.items() if r == after_rasi}
    benefics = _effective_benefics(planet_rasis)
    malefics = _effective_malefics(planet_rasis)
    papa_kartari = bool(before & (malefics | {"SUN"})) and bool(after & (malefics | {"SUN"}))
    shubha_kartari = bool(before & benefics) and bool(after & benefics) and not (before & malefics) and not (after & malefics)

    severity = (
        len(occupying)
        + len(aspecting)
        + min(2, len(lord_afflicted))
        + min(2, len(karaka_afflicted))
        + (2 if papa_kartari else 0)
        - (1 if shubha_kartari else 0)
    )
    return BhavaAfflictionReport(
        bhava_house=bhava_house,
        malefics_occupying=occupying,
        malefics_aspecting=aspecting,
        lord_afflicted_by=lord_afflicted,
        karaka_afflicted_by=karaka_afflicted,
        papa_kartari=papa_kartari,
        shubha_kartari=shubha_kartari,
        severity=max(0, severity),
    )
