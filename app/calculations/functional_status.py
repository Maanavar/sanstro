"""Lagna-specific functional status of the seven sign lords (DD-07, v1.3).

A static, reviewed table — 12 lagnas × 7 sign-owning grahas = 84 cells — read
by Raja Yoga, the yogakaraka card and any later maraka or dasha reading. It is a
literal table on purpose (DD-07: "not derived ad hoc in code"); `derive_status`
re-derives every cell from house ownership only so a test can prove the table
carries no typo.

Each cell is a **set** of statuses, not one label: Budhan for Mithunam lagna is
the lagna lord *and* a kendra lord, and a reading needs both facts.

Rahu and Ketu are not in the matrix. They own no sign, so a node never acquires
a lordship status from this table; `functional_status` answers
`{NON_SIGN_LORD}` for them and `node_functional_context` describes them by
dispositor and association instead.

**Unfrozen (O-9).** The matrix is built, not signed off. `MATRIX_SIGNED_OFF`
stays False until the astrologer signs the 84 cells, the 12th-lord and 8th-lord
cells especially, and the node rules.

**Owner ruling 2026-10-03 (v1.7, not a practitioner signature).** The Sun and
the Moon carry no 8th-lordship blemish: their 8th ownership is
`EIGHTH_LUMINARY_EXEMPT`, not `EIGHTH_SPECIAL_CASE`. Kendra lordship is
`KENDRA_LORD` (ownership only), and kendradhipati is a separate modifier:
`KENDRADHIPATI_BENEFIC` for a natural benefic, `KENDRADHIPATI_MALEFIC` for a
natural malefic. The lagna lord carries neither, because lagna lordship decides
first. Raja Yoga adds the 3rd/11th to the moolatrikona co-lord test, has a
source-veto table for three BPHS pairs, and a kendradhipati rule (O-24).

**Owner rulings 2026-10-03, second round (v1.8).** Kadagam Guru is a named
exception to the moolatrikona co-lord test (`RAJA_LINEAGE_EXCEPTIONS`): it takes
part as the 9th lord and grades MIXED by its 6th. O-24 is ruled `mixed`:
kendradhipati modifies the grade and never removes Raja Yoga eligibility.

`functional_nature.FunctionalNature` is a different, older thing: one label per
graha, used to scale transit and dasha scores. It is not replaced here.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from enum import Enum

from app.calculations.aspects import aspects_house
from app.calculations.astro import house_from_reference
from app.calculations.chart_strength import MOOLATRIKONA_ZONE
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions
from app.constants.astrology import SIGN_LORD


class FunctionalStatus(str, Enum):  # noqa: UP042 — str-mixin, as FunctionalNature
    LAGNA_LORD = "LAGNA_LORD"                    # owns house 1; tracked separately
    TRIKONA_BENEFIC = "TRIKONA_BENEFIC"          # owns 1/5/9 — always auspicious
    #: Owns one of {4, 7, 10} AND one of {5, 9}. House 1 never satisfies either
    #: side, though it is geometrically both a kendra and a trikona — otherwise
    #: every lagna lord would be a yogakaraka. Named for the ownership it
    #: describes: the textual "yogakaraka" is used more loosely.
    DUAL_LORD_YOGAKARAKA = "DUAL_LORD_YOGAKARAKA"
    KENDRA_LORD = "KENDRA_LORD"                  # owns 4/7/10 — lordship only
    #: Kendradhipati, split by natural nature (v1.7): a natural benefic that
    #: owns a kendra loses its beneficence; a natural malefic sheds its malefic
    #: nature. Not given to the lagna lord.
    KENDRADHIPATI_BENEFIC = "KENDRADHIPATI_BENEFIC"
    KENDRADHIPATI_MALEFIC = "KENDRADHIPATI_MALEFIC"
    TRISHADAYA_MALEFIC = "TRISHADAYA_MALEFIC"    # owns 3/6/11
    CONTEXTUAL_2ND = "CONTEXTUAL_2ND"            # 2nd lordship — by association
    CONTEXTUAL_12TH = "CONTEXTUAL_12TH"          # 12th lordship — by association
    EIGHTH_SPECIAL_CASE = "EIGHTH_SPECIAL_CASE"  # owns the 8th; lagna-specific
    #: The Sun or Moon owning the 8th (v1.7). The ownership stands, so 8th-house
    #: significations still route through the graha; only the 8th-lordship
    #: blemish is withdrawn. It does not make the graha a benefic.
    EIGHTH_LUMINARY_EXEMPT = "EIGHTH_LUMINARY_EXEMPT"
    MARAKA = "MARAKA"                            # 2nd/7th lord — timing context only
    NON_SIGN_LORD = "NON_SIGN_LORD"              # Rahu/Ketu — never in the matrix


LL = FunctionalStatus.LAGNA_LORD
TB = FunctionalStatus.TRIKONA_BENEFIC
YK = FunctionalStatus.DUAL_LORD_YOGAKARAKA
KL = FunctionalStatus.KENDRA_LORD
KB = FunctionalStatus.KENDRADHIPATI_BENEFIC
KM = FunctionalStatus.KENDRADHIPATI_MALEFIC
TM = FunctionalStatus.TRISHADAYA_MALEFIC
C2 = FunctionalStatus.CONTEXTUAL_2ND
C12 = FunctionalStatus.CONTEXTUAL_12TH
E8 = FunctionalStatus.EIGHTH_SPECIAL_CASE
E8X = FunctionalStatus.EIGHTH_LUMINARY_EXEMPT
MK = FunctionalStatus.MARAKA

SEVEN_SIGN_LORDS: tuple[str, ...] = ("SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN")
ALL_LAGNAS: tuple[int, ...] = tuple(range(1, 13))
NODES: frozenset[str] = frozenset({"RAHU", "KETU"})
LUMINARIES: frozenset[str] = frozenset({"SUN", "MOON"})
#: Natural nature for kendradhipati, on Laghu Parashari's static list (Guru,
#: Sukran, Budhan, Chandran, in falling order of the blemish). DD-12's
#: chart-dynamic Moon/Mercury class is a chart-level reading; a lagna-level
#: table cannot see the paksha or Budhan's company. Tier C.
KENDRADHIPATI_NATURAL_BENEFICS: frozenset[str] = frozenset({"JUPITER", "VENUS", "MERCURY", "MOON"})

#: O-9. Flip only on the astrologer's signature, and record the date here.
MATRIX_SIGNED_OFF = False

#: Every cell's source. The statuses restate Laghu Parashari's functional-
#: lordship rules; the verse number per rule is still to be checked (§18).
LAGHU_PARASHARI = "LAGHU_PARASHARI (functional lordship; verse numbers pending §18)"


@dataclass(frozen=True, slots=True)
class MatrixCell:
    statuses: frozenset[FunctionalStatus]
    source: str = LAGHU_PARASHARI


def _cell(*statuses: FunctionalStatus) -> MatrixCell:
    return MatrixCell(frozenset(statuses))


FUNCTIONAL_STATUS_MATRIX: dict[tuple[int, str], MatrixCell] = {
    # MESHAM (1)
    (1, "SUN"): _cell(TB),  # owns 5
    (1, "MOON"): _cell(KL, KB),  # owns 4
    (1, "MARS"): _cell(LL, TB, E8),  # owns 1+8
    (1, "MERCURY"): _cell(TM),  # owns 3+6
    (1, "JUPITER"): _cell(TB, C12),  # owns 9+12
    (1, "VENUS"): _cell(KL, KB, C2, MK),  # owns 2+7
    (1, "SATURN"): _cell(KL, KM, TM),  # owns 10+11
    # RISHABAM (2)
    (2, "SUN"): _cell(KL, KM),  # owns 4
    (2, "MOON"): _cell(TM),  # owns 3
    (2, "MARS"): _cell(KL, KM, C12, MK),  # owns 7+12
    (2, "MERCURY"): _cell(TB, C2, MK),  # owns 2+5
    (2, "JUPITER"): _cell(TM, E8),  # owns 8+11
    (2, "VENUS"): _cell(LL, TB, TM),  # owns 1+6
    (2, "SATURN"): _cell(TB, YK, KL, KM),  # owns 9+10
    # MITHUNAM (3)
    (3, "SUN"): _cell(TM),  # owns 3
    (3, "MOON"): _cell(C2, MK),  # owns 2
    (3, "MARS"): _cell(TM),  # owns 6+11
    (3, "MERCURY"): _cell(LL, TB, KL),  # owns 1+4
    (3, "JUPITER"): _cell(KL, KB, MK),  # owns 7+10
    (3, "VENUS"): _cell(TB, C12),  # owns 5+12
    (3, "SATURN"): _cell(TB, E8),  # owns 8+9
    # KADAGAM (4)
    (4, "SUN"): _cell(C2, MK),  # owns 2
    (4, "MOON"): _cell(LL, TB),  # owns 1
    (4, "MARS"): _cell(TB, YK, KL, KM),  # owns 5+10
    (4, "MERCURY"): _cell(TM, C12),  # owns 3+12
    (4, "JUPITER"): _cell(TB, TM),  # owns 6+9
    (4, "VENUS"): _cell(KL, KB, TM),  # owns 4+11
    (4, "SATURN"): _cell(KL, KM, E8, MK),  # owns 7+8
    # SIMMAM (5)
    (5, "SUN"): _cell(LL, TB),  # owns 1
    (5, "MOON"): _cell(C12),  # owns 12
    (5, "MARS"): _cell(TB, YK, KL, KM),  # owns 4+9
    (5, "MERCURY"): _cell(TM, C2, MK),  # owns 2+11
    (5, "JUPITER"): _cell(TB, E8),  # owns 5+8
    (5, "VENUS"): _cell(KL, KB, TM),  # owns 3+10
    (5, "SATURN"): _cell(KL, KM, TM, MK),  # owns 6+7
    # KANNI (6)
    (6, "SUN"): _cell(C12),  # owns 12
    (6, "MOON"): _cell(TM),  # owns 11
    (6, "MARS"): _cell(TM, E8),  # owns 3+8
    (6, "MERCURY"): _cell(LL, TB, KL),  # owns 1+10
    (6, "JUPITER"): _cell(KL, KB, MK),  # owns 4+7
    (6, "VENUS"): _cell(TB, C2, MK),  # owns 2+9
    (6, "SATURN"): _cell(TB, TM),  # owns 5+6
    # THULAM (7)
    (7, "SUN"): _cell(TM),  # owns 11
    (7, "MOON"): _cell(KL, KB),  # owns 10
    (7, "MARS"): _cell(KL, KM, C2, MK),  # owns 2+7
    (7, "MERCURY"): _cell(TB, C12),  # owns 9+12
    (7, "JUPITER"): _cell(TM),  # owns 3+6
    (7, "VENUS"): _cell(LL, TB, E8),  # owns 1+8
    (7, "SATURN"): _cell(TB, YK, KL, KM),  # owns 4+5
    # VIRUCHIGAM (8)
    (8, "SUN"): _cell(KL, KM),  # owns 10
    (8, "MOON"): _cell(TB),  # owns 9
    (8, "MARS"): _cell(LL, TB, TM),  # owns 1+6
    (8, "MERCURY"): _cell(TM, E8),  # owns 8+11
    (8, "JUPITER"): _cell(TB, C2, MK),  # owns 2+5
    (8, "VENUS"): _cell(KL, KB, C12, MK),  # owns 7+12
    (8, "SATURN"): _cell(KL, KM, TM),  # owns 3+4
    # DHANUSU (9)
    (9, "SUN"): _cell(TB),  # owns 9
    (9, "MOON"): _cell(E8X),  # owns 8 — luminary, no 8th-lord blemish (v1.7)
    (9, "MARS"): _cell(TB, C12),  # owns 5+12
    (9, "MERCURY"): _cell(KL, KB, MK),  # owns 7+10
    (9, "JUPITER"): _cell(LL, TB, KL),  # owns 1+4
    (9, "VENUS"): _cell(TM),  # owns 6+11
    (9, "SATURN"): _cell(TM, C2, MK),  # owns 2+3
    # MAGARAM (10)
    (10, "SUN"): _cell(E8X),  # owns 8 — luminary, no 8th-lord blemish (v1.7)
    (10, "MOON"): _cell(KL, KB, MK),  # owns 7
    (10, "MARS"): _cell(KL, KM, TM),  # owns 4+11
    (10, "MERCURY"): _cell(TB, TM),  # owns 6+9
    (10, "JUPITER"): _cell(TM, C12),  # owns 3+12
    (10, "VENUS"): _cell(TB, YK, KL, KB),  # owns 5+10
    (10, "SATURN"): _cell(LL, TB, C2, MK),  # owns 1+2
    # KUMBAM (11)
    (11, "SUN"): _cell(KL, KM, MK),  # owns 7
    (11, "MOON"): _cell(TM),  # owns 6
    (11, "MARS"): _cell(KL, KM, TM),  # owns 3+10
    (11, "MERCURY"): _cell(TB, E8),  # owns 5+8
    (11, "JUPITER"): _cell(TM, C2, MK),  # owns 2+11
    (11, "VENUS"): _cell(TB, YK, KL, KB),  # owns 4+9
    (11, "SATURN"): _cell(LL, TB, C12),  # owns 1+12
    # MEENAM (12)
    (12, "SUN"): _cell(TM),  # owns 6
    (12, "MOON"): _cell(TB),  # owns 5
    (12, "MARS"): _cell(TB, C2, MK),  # owns 2+9
    (12, "MERCURY"): _cell(KL, KB, MK),  # owns 4+7
    (12, "JUPITER"): _cell(LL, TB, KL),  # owns 1+10
    (12, "VENUS"): _cell(TM, E8),  # owns 3+8
    (12, "SATURN"): _cell(TM, C12),  # owns 11+12
}

#: BPHS Ch. 34's ascendant-wise counterexamples: pairs whose kendra–trikona
#: relationship "by mere association" gives no Raja Yoga for that lagna. Owner
#: ruling 2026-10-03; verse numbers pending §18 (edition numbering varies).
SOURCE_VETOED_RAJA_PAIRS: dict[tuple[int, frozenset[str]], str] = {
    (1, frozenset({"JUPITER", "SATURN"})): "BPHS 34, Mesha: Guru-Sani association gives no auspicious result (verse pending §18)",
    (3, frozenset({"JUPITER", "SATURN"})): "BPHS 34, Mithuna: Guru-Sani association, as for Mesha (verse pending §18)",
    (5, frozenset({"JUPITER", "VENUS"})): "BPHS 34, Simha: Guru-Sukran association gives no Raja Yoga (verse pending §18)",
}


@dataclass(frozen=True, slots=True)
class RajaLineageException:
    """A named lagna-specific exception to the moolatrikona co-lord test. It
    restores eligibility only: the adverse co-lordship stays on the lord, so
    `raja_grade` still grades every pair it joins, and pair vetoes still apply."""

    basis: str
    positive_lordship: frozenset[int]
    adverse_lordship: frozenset[int]
    ruling: str


#: O-23 exceptions (owner ruling 2026-10-03, v1.8). Kadagam Guru owns the 6th
#: (Dhanusu, its moolatrikona) and the 9th. The moolatrikona test would erase
#: its 9th lordship from every Raja Yoga; this keeps the test and lets Guru take
#: part, carrying the 6th, so a pair it forms grades MIXED, never FULL. A
#: deliberate Tamil/Parashari lineage choice; the other 6th/8th co-lords
#: (Kadagam Sani, Kanni Sani, Kumbam Budhan) are not affected.
RAJA_LINEAGE_EXCEPTIONS: dict[tuple[int, str], RajaLineageException] = {
    (4, "JUPITER"): RajaLineageException(
        basis="kadagam_guru_9th_lord_exception",
        positive_lordship=frozenset({9}),
        adverse_lordship=frozenset({6}),
        ruling="Owner ruling 2026-10-03 (v1.8): Kadagam Guru takes part as the 9th lord, graded by its 6th",
    ),
}


def owned_houses(lagna_rasi: int, planet: str) -> frozenset[int]:
    """Houses counted from this lagna whose sign this graha rules. Empty for nodes."""
    return frozenset(((rasi - lagna_rasi) % 12) + 1 for rasi, lord in SIGN_LORD.items() if lord == planet)


def derive_status(lagna_rasi: int, planet: str) -> frozenset[FunctionalStatus]:
    """Validation oracle for the literal table: the statuses that follow from
    house ownership alone. Not the production path (DD-07)."""
    houses = owned_houses(lagna_rasi, planet)
    statuses: set[FunctionalStatus] = set()
    if 1 in houses:
        statuses.add(LL)
    if houses & {1, 5, 9}:
        statuses.add(TB)
    if houses & {4, 7, 10} and houses & {5, 9}:
        statuses.add(YK)
    if houses & {4, 7, 10}:
        statuses.add(KL)
        if 1 not in houses:
            statuses.add(KB if planet in KENDRADHIPATI_NATURAL_BENEFICS else KM)
    if houses & {3, 6, 11}:
        statuses.add(TM)
    if 2 in houses:
        statuses.add(C2)
    if 12 in houses:
        statuses.add(C12)
    if 8 in houses:
        statuses.add(E8X if planet in LUMINARIES else E8)
    if houses & {2, 7}:
        statuses.add(MK)
    return frozenset(statuses)


def kendradhipati_two_kendras(lagna_rasi: int, planet: str) -> bool:
    """A natural benefic, not the lagna lord, owning two kendras — the full
    kendradhipati case: Guru for Mithunam/Kanni, Budhan for Dhanusu/Meenam."""
    if planet in NODES or KB not in functional_status(lagna_rasi, planet):
        return False
    return len(owned_houses(lagna_rasi, planet) & {4, 7, 10}) >= 2


def _matrix_cell(lagna_rasi: int, planet: str) -> MatrixCell:
    # DD-07: a node must never pass through the lordship matrix. A real raise,
    # not `assert`, so it survives `python -O`.
    if planet in NODES:
        raise ValueError(f"{planet} owns no sign and is not in the functional-status matrix")
    return FUNCTIONAL_STATUS_MATRIX[(lagna_rasi, planet)]


def functional_status(lagna_rasi: int, planet: str) -> frozenset[FunctionalStatus]:
    """The planet's functional statuses for this lagna. `{NON_SIGN_LORD}` for a node."""
    if planet in NODES:
        return frozenset({FunctionalStatus.NON_SIGN_LORD})
    return _matrix_cell(lagna_rasi, planet).statuses


def dual_lord_yogakaraka(lagna_rasi: int) -> str | None:
    """The one graha holding DUAL_LORD_YOGAKARAKA for this lagna, if any. Six
    lagnas have one: Rishabam/Thulam (Sani), Kadagam/Simmam (Sevvai),
    Magaram/Kumbam (Sukran)."""
    for planet in SEVEN_SIGN_LORDS:
        if YK in functional_status(lagna_rasi, planet):
            return planet
    return None


@dataclass(frozen=True, slots=True)
class NodeFunctionalContext:
    """How a node functions, per Laghu Parashari: by placement and association,
    never by lordship (DD-07 step 1b). Owner ruling 2026-10-03: the context is
    the occupied house (`house`) and its sign lord (`dispositor`), conjunctions,
    and aspects *received* (`aspected_by`). The nodes' own outgoing aspects are
    a separate lineage question and are deliberately not read here."""

    node: str
    house: int
    sign: int
    dispositor: str
    conjunctions: tuple[str, ...]
    aspected_by: tuple[str, ...]
    kind: str = "FUNCTION_BY_DISPOSITOR_AND_ASSOCIATION"


def node_functional_context(
    lagna_rasi: int, node: str, planets_rasi: Mapping[str, int]
) -> NodeFunctionalContext:
    if node not in NODES:
        raise ValueError(f"{node} is a sign lord; read it from the matrix")
    sign = planets_rasi[node]
    others = [p for p in planets_rasi if p != node]
    return NodeFunctionalContext(
        node=node,
        house=house_from_reference(lagna_rasi, sign),
        sign=sign,
        dispositor=SIGN_LORD[sign],
        conjunctions=tuple(p for p in others if planets_rasi[p] == sign),
        aspected_by=tuple(p for p in others if aspects_house(p, planets_rasi[p], sign)),
    )


# ── Raja Yoga participation (DD-07 step 2) ──────────────────────────────────
@dataclass(frozen=True, slots=True)
class RajaParticipation:
    planet: str
    kendra_lord: bool       # owns 1/4/7/10 (house 1 counts for Raja Yoga)
    trikona_lord: bool      # owns 1/5/9
    eligible: bool
    #: Why, in one token: "lagna_lord", "clean", "contextual_12th",
    #: "moolatrikona_kendra_trikona", "moolatrikona_dusthana",
    #: "moolatrikona_upachaya" (3rd/11th co-lord, v1.7),
    #: "lordship_only_6th_8th" (O-23 alternative), "kendradhipati_mixed" /
    #: "kendradhipati_two_kendras" (O-24), or a `RAJA_LINEAGE_EXCEPTIONS` basis
    #: such as "kadagam_guru_9th_lord_exception" (v1.8).
    basis: str


def raja_participation(
    lagna_rasi: int, planet: str, options: DoctrineOptions = DEFAULT_DOCTRINE
) -> RajaParticipation:
    """May this lord take part in a kendra–trikona Raja Yoga, and on what basis?

    There is no generic dusthana rule (the v1.0 "6/12 → qualified, 8 → spoiled"
    table is withdrawn). The rule table, per participant:

    * the lagna lord always takes part — lagna ownership decides first (ruling
      2026-09-23, amended);
    * a lord with no 6th, 8th or 12th co-lordship takes part;
    * a 12th co-lord takes part — 12th lordship is contextual and trikona/kendra
      lordship dominates (DD-07, O-4 default). O-14 records that the 2026-09-23
      moolatrikona ruling disagreed for three cells; ``o4_twelfth_colord_mode =
      "moolatrikona"`` restores that reading;
    * a 6th or 8th co-lord is decided per lagna by its moolatrikona sign (ruling
      2026-09-23): it takes part when that sign is the kendra/trikona it owns.
      This is a lagna-specific test, which DD-07 asks for, not a blanket one.
      O-23 records that it excludes four kendra/trikona lords outright;
      ``o23_six_eight_colord_mode = "lordship_only"`` lets them take part and
      leaves the 6th/8th to the MIXED grade. A named lineage exception
      (`RAJA_LINEAGE_EXCEPTIONS`, ``o23_lineage_exceptions``) re-admits one
      such lord without weakening the test: Kadagam Guru (owner ruling
      2026-10-03, v1.8), which then grades MIXED by its 6th;
    * a 3rd or 11th co-lord takes the same moolatrikona test (owner ruling
      2026-10-03, ``"moolatrikona_3_6_8_11"``, the default). It excludes three
      more lords: Mesham Sani (10+11), Simmam Sukran (3+10) and Kumbam Sevvai
      (3+10). ``"moolatrikona"`` keeps the 6th/8th-only test;
    * a natural benefic owning two kendras (`kendradhipati_two_kendras`) takes
      part under a MIXED grade by default; ``o24_kendradhipati_two_kendras =
      "exclude"`` shuts it out of every Raja Yoga instead (O-24).

    Kendra and trikona lordship are read from the signed matrix (LAGNA_LORD,
    KENDRA_LORD, TRIKONA_BENEFIC), so a correction made at O-9 sign-off
    reaches Raja Yoga. The matrix's TRISHADAYA_MALEFIC does not separate the
    6th from the 3rd/11th, so the co-lord tests read ownership directly.
    """
    statuses = functional_status(lagna_rasi, planet)
    houses = owned_houses(lagna_rasi, planet)
    kendra = bool(statuses & {LL, KL})
    trikona = bool(statuses & {LL, TB})

    def moolatrikona_test(failed: str = "moolatrikona_dusthana") -> tuple[bool, str]:
        mt = MOOLATRIKONA_ZONE.get(planet)
        if mt is None:
            return True, "clean"
        ok = house_from_reference(lagna_rasi, mt[0]) in {1, 4, 5, 7, 9, 10}
        return ok, "moolatrikona_kendra_trikona" if ok else failed

    mode = options.o23_six_eight_colord_mode
    if LL in statuses:
        eligible, basis = True, "lagna_lord"
    elif houses & {6, 8}:
        if mode == "lordship_only":
            eligible, basis = True, "lordship_only_6th_8th"
        else:
            eligible, basis = moolatrikona_test()
    elif houses & {3, 11} and mode == "moolatrikona_3_6_8_11":
        eligible, basis = moolatrikona_test("moolatrikona_upachaya")
    elif 12 in houses:
        if options.o4_twelfth_colord_mode == "moolatrikona":
            eligible, basis = moolatrikona_test()
        else:
            eligible, basis = True, "contextual_12th"
    else:
        eligible, basis = True, "clean"
    exception = RAJA_LINEAGE_EXCEPTIONS.get((lagna_rasi, planet))
    if not eligible and exception is not None and options.o23_lineage_exceptions:
        eligible, basis = True, exception.basis
    if eligible and kendradhipati_two_kendras(lagna_rasi, planet):
        if options.o24_kendradhipati_two_kendras == "exclude":
            eligible, basis = False, "kendradhipati_two_kendras"
        else:
            basis = "kendradhipati_mixed"
    return RajaParticipation(planet, kendra, trikona, eligible, basis)


def raja_grade(lagna_rasi: int, *planets: str) -> str:
    """Tier C display label over the matrix: FULL / QUALIFIED / MIXED /
    MIXED_KENDRADHIPATI.

    MIXED when a participant (other than the lagna lord) also owns the 6th or
    8th; MIXED_KENDRADHIPATI when one is a natural benefic owning two kendras
    (v1.7); QUALIFIED when one also owns the 2nd, 3rd, 11th or 12th; FULL
    otherwise. A label only — it neither forms nor removes the yoga.
    """
    grade = "FULL"
    for planet in planets:
        houses = owned_houses(lagna_rasi, planet)
        if 1 in houses:
            continue
        if houses & {6, 8}:
            return "MIXED"
        if kendradhipati_two_kendras(lagna_rasi, planet):
            grade = "MIXED_KENDRADHIPATI"
        elif houses & {2, 3, 11, 12} and grade == "FULL":
            grade = "QUALIFIED"
    return grade


CONFIRMED_RAJA_YOGA = "CONFIRMED_RAJA_YOGA"
MIXED_RAJA_RELATION = "MIXED_RAJA_RELATION"
SOURCE_VETOED_RELATION = "SOURCE_VETOED_RELATION"


def source_veto(lagna_rasi: int, planet_a: str, planet_b: str) -> str | None:
    """The BPHS counterexample that vetoes this pair for this lagna, if any."""
    return SOURCE_VETOED_RAJA_PAIRS.get((lagna_rasi, frozenset({planet_a, planet_b})))


def raja_relation(lagna_rasi: int, planet_a: str, planet_b: str) -> str:
    """The three-way outcome of a linked kendra–trikona pair (v1.7):
    SOURCE_VETOED_RELATION when a BPHS counterexample names the pair;
    MIXED_RAJA_RELATION when the grade is MIXED or MIXED_KENDRADHIPATI;
    CONFIRMED_RAJA_YOGA otherwise (FULL or QUALIFIED)."""
    if source_veto(lagna_rasi, planet_a, planet_b):
        return SOURCE_VETOED_RELATION
    if raja_grade(lagna_rasi, planet_a, planet_b).startswith("MIXED"):
        return MIXED_RAJA_RELATION
    return CONFIRMED_RAJA_YOGA
