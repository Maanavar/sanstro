"""Neecha bhanga, one rule per verse (DOCTRINE_DECISIONS v1.3, DD-09).

The engine used to carry four cancellation conditions with no verse attached,
two of which are not in Phaladeepika 7.26–30 at all. DD-09 replaces that with a
table: each textual condition is tested on its own, and the rule that fired —
with its verse — is what the card records. There is no count threshold. One
authenticated condition cancels the debility.

Every rule row says where it comes from. The Phaladeepika verse map was checked
against the Subrahmanya Sastri translation as published online (siva.sh,
2026-10-01). It is not yet checked against the physical edition (§18).

`chart_strength.neecha_bhanga_cancelled` delegates here, so the yoga card, the
+14 bhanga term in the strength synthesis, the yogakaraka card and bhava palan
still read one predicate and cannot disagree (audit C2).
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from app.calculations.aspects import aspects_house
from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import (
    DEBILITATION_RASI,
    EXALTATION_RASI,
    SIGN_LORD,
    _has_d9_dignity,
)
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions

_KENDRA = frozenset({1, 4, 7, 10})
_KENDRA_TRIKONA = frozenset({1, 4, 5, 7, 9, 10})
_DUSTHANA = frozenset({6, 8, 12})


@dataclass(frozen=True, slots=True)
class NeechaBhangaRule:
    rule_id: str
    #: The string recorded in `conditions_met`. Read by web marker labels.
    marker: str
    condition: str
    #: Text and verse, or the open item that keeps an unsourced rule switched off.
    source: str
    #: "A" classical, "C" Vinaadi reading of an underspecified verse, "—" unsourced.
    tier: str
    #: The cited verse itself states a raja-yoga result (O-13).
    gives_raja_yoga: bool
    #: The `DoctrineOptions` field that switches this rule on, or "" for always on.
    gated_by: str = ""


NB_A = NeechaBhangaRule(
    "NB-a", "nb_a_debilitation_lord_in_kendra",
    "Lord of the debilitation sign in a kendra from Lagna or Moon.",
    "Phaladeepika 7.26, restated 7.29", "A", True,
)
NB_B = NeechaBhangaRule(
    "NB-b", "nb_b_exaltation_lord_in_kendra",
    "Lord of the planet's exaltation sign in a kendra from Lagna or Moon.",
    "Phaladeepika 7.26, restated 7.29", "A", True,
)
NB_C = NeechaBhangaRule(
    "NB-c", "nb_c_lords_in_mutual_kendras",
    "Debilitation-sign lord and exaltation-sign lord in mutual kendras.",
    "Phaladeepika 7.27", "A", True,
)
NB_D = NeechaBhangaRule(
    "NB-d", "nb_d_aspected_by_debilitation_lord",
    "Debilitated planet aspected by its debilitation-sign lord.",
    "Phaladeepika 7.28", "A", True,
)
NB_D_PLUS = NeechaBhangaRule(
    "NB-d+", "nb_d_plus_outside_dusthana",
    "NB-d, and the debilitated planet in a house other than 6/8/12 — the stronger result.",
    "Phaladeepika 7.28 (second half)", "A", True,
)
NB_G = NeechaBhangaRule(
    "NB-g", "nb_g_lord_in_kendra",
    "Debilitation-sign lord and/or exaltation-sign lord in a kendra. The verse names "
    "no reference point; Vinaadi reads it from Lagna (O-10).",
    "Phaladeepika 7.30", "C", True,
)
# Off by default. Kept so a ruling switches them on without a code change.
NB_F = NeechaBhangaRule(
    "NB-f", "debilitated_planet_strong_d9",
    "Debilitated planet strong in the Navamsa (kendra/trikona from the D9 lagna, "
    "else own or exaltation sign in D9).",
    "Not in Phaladeepika 7.26–30; source pending (O-7)", "—", False, "o7_nb_navamsa",
)
NB_X1 = NeechaBhangaRule(
    "NB-x1", "exalter_of_debilitation_sign_in_kendra",
    "The planet that exalts in the debilitation sign, in a kendra from Lagna or Moon.",
    "Not in DD-09's table; text pending (O-12)", "—", False, "o12_nb_unlisted_conditions",
)
NB_X2 = NeechaBhangaRule(
    "NB-x2", "exaltation_sign_lord_aspects_debilitated",
    "The lord of the planet's exaltation sign aspects it.",
    "Not in DD-09's table; text pending (O-12)", "—", False, "o12_nb_unlisted_conditions",
)

NEECHA_BHANGA_RULES: tuple[NeechaBhangaRule, ...] = (NB_A, NB_B, NB_C, NB_D, NB_D_PLUS, NB_G, NB_F, NB_X1, NB_X2)
RULE_BY_MARKER: dict[str, NeechaBhangaRule] = {rule.marker: rule for rule in NEECHA_BHANGA_RULES}


@dataclass(frozen=True, slots=True)
class NeechaBhangaEvaluation:
    planet: str
    debilitated: bool
    fired: tuple[NeechaBhangaRule, ...]
    #: Grahas whose placement or aspect produced a firing rule — DD-15's
    #: secondary activators for this card.
    cancelling_grahas: tuple[str, ...]

    @property
    def cancelled(self) -> bool:
        return bool(self.fired)

    @property
    def markers(self) -> list[str]:
        return [rule.marker for rule in self.fired]

    def gives_raja_yoga(self, options: DoctrineOptions = DEFAULT_DOCTRINE) -> bool:
        return options.o13_nb_verses_give_raja_yoga and any(rule.gives_raja_yoga for rule in self.fired)

    @property
    def grade_points(self) -> int:
        """Distinct facts, not distinct verses. Tier C.

        NB-g restates NB-a/NB-b from the Lagna, so it can never add a point a
        placement has not already earned. NB-d+ is NB-d plus a placement and
        adds one point for the stronger result. Counting verses would grade one
        placement twice.
        """
        ids = {rule.rule_id for rule in self.fired}
        points = len(ids & {"NB-a", "NB-b", "NB-c", "NB-d", "NB-f", "NB-x1", "NB-x2"})
        if "NB-g" in ids and not ids & {"NB-a", "NB-b"}:
            points += 1
        if "NB-d+" in ids:
            points += 1
        return points


def strength_for_points(points: int) -> str:
    """Each satisfied condition raises the grade (Tier C). One → WEAK (shown as
    "Mild"), two → PARTIAL, three or more → STRONG. With "any one condition"
    the yoga fires on many charts, so a lone condition must not read as a full
    raja yoga (DD-09 warning)."""
    if points >= 3:
        return "STRONG"
    if points == 2:
        return "PARTIAL"
    return "WEAK"


def evaluate_neecha_bhanga(
    planet: str,
    *,
    planet_rasi: Mapping[str, int],
    lagna_rasi: int,
    d9_rasi_map: Mapping[str, int] | None = None,
    d9_lagna_rasi: int | None = None,
    options: DoctrineOptions = DEFAULT_DOCTRINE,
) -> NeechaBhangaEvaluation:
    deb_rasi = DEBILITATION_RASI.get(planet)
    if deb_rasi is None or planet_rasi.get(planet) != deb_rasi:
        return NeechaBhangaEvaluation(planet, False, (), ())

    moon_rasi = planet_rasi.get("MOON")
    deb_lord = SIGN_LORD[deb_rasi]
    exalt_lord = SIGN_LORD[EXALTATION_RASI[planet]]
    deb_lord_rasi = planet_rasi.get(deb_lord)
    exalt_lord_rasi = planet_rasi.get(exalt_lord)

    def kendra_from(reference: int | None, target: int | None) -> bool:
        if reference is None or target is None:
            return False
        return house_from_reference(reference, target) in _KENDRA

    def kendra_from_lagna_or_moon(target: int | None, lord: str) -> bool:
        # O-19: the Moon is always in the 1st from itself. Unless the literal
        # reading is kept, the Moon reference does not count for the Moon.
        moon_counts = lord != "MOON" or options.o19_nb_moon_self_reference
        return kendra_from(lagna_rasi, target) or (moon_counts and kendra_from(moon_rasi, target))

    fired: list[NeechaBhangaRule] = []
    cancelling: list[str] = []

    def fire(rule: NeechaBhangaRule, *grahas: str) -> None:
        fired.append(rule)
        cancelling.extend(g for g in grahas if g != planet)

    # O-21: Budhan rules Kanni, its own exaltation sign, so "the exaltation
    # lord" is the debilitated Budhan itself. Testing its own position is NB-e,
    # which DD-09 deleted; skip it unless the literal reading is chosen.
    def lord_counts(lord: str) -> bool:
        return lord != planet or options.o21_nb_planet_as_own_lord

    if kendra_from_lagna_or_moon(deb_lord_rasi, deb_lord):
        fire(NB_A, deb_lord)
    if lord_counts(exalt_lord) and kendra_from_lagna_or_moon(exalt_lord_rasi, exalt_lord):
        fire(NB_B, exalt_lord)
    # Mutual kendras: each is in a kendra from the other. The relation is
    # symmetric (a kendra from A is always a kendra from B back), so one test.
    if (
        deb_lord != exalt_lord
        and lord_counts(exalt_lord)
        and kendra_from(deb_lord_rasi, exalt_lord_rasi)
    ):
        fire(NB_C, deb_lord, exalt_lord)
    aspected = (
        deb_lord != planet
        and deb_lord_rasi is not None
        and aspects_house(deb_lord, deb_lord_rasi, deb_rasi)
    )
    if aspected:
        fire(NB_D, deb_lord)
        if house_from_reference(lagna_rasi, deb_rasi) not in _DUSTHANA:
            fire(NB_D_PLUS, deb_lord)
    nbg_references = (lagna_rasi,) if options.o10_nbg_reference == "lagna" else (lagna_rasi, moon_rasi)
    nbg_lords = [
        lord for lord, rasi in ((deb_lord, deb_lord_rasi), (exalt_lord, exalt_lord_rasi))
        if lord_counts(lord)
        and any(
            kendra_from(ref, rasi) for ref in nbg_references
            if ref == lagna_rasi or lord != "MOON" or options.o19_nb_moon_self_reference
        )
    ]
    if nbg_lords:
        fire(NB_G, *nbg_lords)

    if options.o7_nb_navamsa and d9_rasi_map is not None and planet in d9_rasi_map:
        d9_rasi = d9_rasi_map[planet]
        if d9_lagna_rasi is not None:
            strong_d9 = house_from_reference(d9_lagna_rasi, d9_rasi) in _KENDRA_TRIKONA
        else:
            strong_d9 = _has_d9_dignity(planet, d9_rasi)
        if strong_d9:
            fire(NB_F)
    if options.o12_nb_unlisted_conditions:
        exalter = {rasi: p for p, rasi in EXALTATION_RASI.items()}.get(deb_rasi)
        if exalter and kendra_from_lagna_or_moon(planet_rasi.get(exalter), exalter):
            fire(NB_X1, exalter)
        if exalt_lord_rasi is not None and aspects_house(exalt_lord, exalt_lord_rasi, deb_rasi):
            fire(NB_X2, exalt_lord)

    return NeechaBhangaEvaluation(
        planet=planet,
        debilitated=True,
        fired=tuple(fired),
        cancelling_grahas=tuple(dict.fromkeys(cancelling)),
    )
