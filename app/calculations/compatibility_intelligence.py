"""
Compatibility Intelligence engine for signed users.

Produces an 8-level marriage compatibility report beyond the traditional 10-kuta
Porutham check. Requires two fully computed chart snapshots (ChartCalculateResponseData)
and the Porutham + Synastry scores already computed by the existing engines.

Scoring model (total 100 points) — REWEIGHTED by astrologer ruling 2026-08-28:
  Porutham (kutas)          35 pts  (was 20)
  7th house strength        20 pts  (10 per person)
  Navamsa (D9) quality      15 pts  (was 20)
  Dasha alignment           15 pts
  Dosha analysis            10 pts  (Sevvai only; Nadi is a note, no points, since 2026-11-11)
  Emotional compatibility    5 pts  (was 10)
  Synastry (chart aspects)   0 pts  (was 5 — dropped from the composite)

WHY THESE NUMBERS, and the instruction that came with them:

  "De-duplicate by trimming Emotional and Navamsa, not by capping Porutham."

20 of 100 was too low for a Tamil audience. The ten poruthams are the instrument
the family actually uses, and a report that weights them at one fifth will
sometimes disagree with the elder in the room and lose that argument whatever
the other eighty points say.

But raising Porutham alone would have INFLATED every score, because Moon-Moon
harmony (Emotional) and the D9 Venus / 7th-lord agreement (Navamsa) partly
RESTATE what the ten poruthams already measure. Trimming those two is what makes
the raise honest rather than additive — the same agreement is no longer counted
twice. Synastry, the Western-aspect layer, leaves the composite entirely; it is
still computed and still reported on its own (`synastry_score`), just not
weighted into the headline number.

Each layer keeps its own native scale in its own dataclass — `NavamsaAnalysis.
score` is still 0-20 and `EmotionalCompatibility.score` still 0-10, because
those are what the layer detail panels display. Only the CONTRIBUTION to the
composite is rescaled, in `compute_compatibility_intelligence`. Do not "tidy"
that by rescaling the layer dataclasses: their ranges are on the wire.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.calculations._yoga_dosham import detect_rahu_ketu_dosham, detect_sevvai_dosham
from app.calculations.astro import julian_day_to_utc_datetime, utc_datetime_to_julian_day
from app.calculations.chart_strength import (
    _NATURAL_ENEMIES,
    _NATURAL_FRIENDS,
    EXALTATION_RASI,
    OWN_SIGN_RASI,
    SIGN_LORD,
)
from app.calculations.cross_chart import (
    CrossChartObservation,
    chart_points_from_snapshot,
    cross_chart_observations,
)
from app.calculations.dasa_sandhi import CoupleSandhiReading, couple_reading
from app.calculations.dasha import calculate_vimshottari_timeline
from app.calculations.display_names import planet_en, planet_ta
from app.calculations.doctrine_options import DEFAULT_DOCTRINE, DoctrineOptions
from app.calculations.dosha_samyam import PapaSamyam, compare_marriage_doshams, papa_samyam
from app.calculations.ephemeris import calculate_lagna_degree
from app.calculations.joint_progeny import JointProgeny, joint_progeny
from app.calculations.joint_progeny import birth_date_of as progeny_birth_date
from app.calculations.joint_progeny import chart_from_snapshot as progeny_chart_from_snapshot
from app.calculations.mangalya_sthana import D9_TOLERANCE_MINUTES, EighthHouseReading
from app.calculations.mangalya_sthana import JointLine as MangalyaJointLine
from app.calculations.mangalya_sthana import chart_from_snapshot as mangalya_chart_from_snapshot
from app.calculations.mangalya_sthana import joint_lines as mangalya_joint_lines
from app.calculations.mangalya_sthana import one_chart as mangalya_one_chart
from app.calculations.progeny_checks import BIRTH_TIME_TOLERANCE_MINUTES

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

#: The composite's layer weights, ruled 2026-08-28. **This is the single source
#: of truth** — the assembly rescales against it and `tests/
#: test_compatibility_intelligence.py` asserts it sums to 100, so a weight can
#: no longer be changed in one place and left stale in another.
#:
#: `web/components/compatibility-intelligence-panel.tsx` carries a hand-typed
#: copy of these maxima for its bars. Nothing checks the two against each other
#: — a change here that misses that file renders every bar against the wrong
#: denominator while the numbers stay right, which is the hardest kind of wrong
#: to spot. Update both or neither.
#:
#: **F-CI-04 — `dasha_harmony` is a standing layer, not a property of the two
#: charts.** It scores the two *current* mahadasha lords, so the same couple's
#: composite moves by up to 11 points depending on the day the report is run.
#: Classical matching is a property of the charts; dasha belongs to marriage
#: *timing*. It is kept in the composite and **labelled** rather than dropped,
#: which is the audit's first option: removing 15 of 100 points is a
#: redistribution of every other weight and needs its own ruling against a
#: measured composite distribution, exactly as the 80/65/50 rung retune does.
#: Every surface showing this layer names it as the current period, and
#: `DashaHarmony` carries the maha end dates so a reader can see when it moves.
COMPATIBILITY_LAYER_MAX: dict[str, int] = {
    "porutham": 35,
    "seventh_house": 20,
    "navamsa": 15,
    "dasha_harmony": 15,
    "dosham_analysis": 10,
    "emotional": 5,
    "synastry": 0,
}

#: The native scales the layer scorers emit, before the composite trims them.
#: Kept separate because each layer's own detail panel displays its native
#: score, and those ranges are on the wire.
_NAVAMSA_NATIVE_MAX = 20
_EMOTIONAL_NATIVE_MAX = 10

_MALEFICS = frozenset({"MARS", "SATURN", "RAHU", "KETU", "SUN"})
_KENDRAS = frozenset({1, 4, 7, 10})
_TRIKONAS = frozenset({1, 5, 9})
_DUSTHANAS = frozenset({6, 8, 12})
_MARRIAGE_DASHAS = frozenset({"VENUS", "JUPITER", "MOON"})  # dashas generally favourable for marriage


def _get_planet(snap: Any, name: str) -> Any:
    for p in snap.data.planets:
        if p.graha == name:
            return p
    raise ValueError(f"Planet {name} not found in chart snapshot.")


def _seventh_house_rasi(lagna_rasi: int) -> int:
    return (lagna_rasi - 1 + 6) % 12 + 1


def _graha_relation(a: str, b: str) -> str:
    """Compound relationship (Doctrine §11): enemy in either direction wins
    over friend in either direction — matches porutham._graha_maitri_kuta's
    existing enemy-priority logic, so the two modules cannot silently
    diverge on the same relationship concept."""
    if a == b:
        return "friend"
    a_enemy_b = b in _NATURAL_ENEMIES.get(a, frozenset())
    b_enemy_a = a in _NATURAL_ENEMIES.get(b, frozenset())
    if a_enemy_b or b_enemy_a:
        return "enemy"
    a_friend_b = b in _NATURAL_FRIENDS.get(a, frozenset())
    b_friend_a = a in _NATURAL_FRIENDS.get(b, frozenset())
    if a_friend_b and b_friend_a:
        return "friend"
    return "neutral"


# ---------------------------------------------------------------------------
# Result dataclasses
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class SevvaiDoshamDetail:
    has_dosham: bool
    mars_house: int
    is_cancelled: bool
    severity: str          # NONE / MILD / MODERATE / SEVERE
    cancellation_reasons: list[str]
    note_en: str
    note_ta: str
    score: int             # 0-5 (5 = no dosham or fully cancelled)


@dataclass(frozen=True, slots=True)
class ChartMarriageStrength:
    seventh_house_rasi: int
    seventh_lord: str
    seventh_lord_house: int
    seventh_lord_strength: int
    venus_house: int
    venus_strength: int
    jupiter_house: int
    jupiter_strength: int
    has_malefic_in_seventh: bool
    score: int             # 0-10
    note_en: str
    note_ta: str


@dataclass(frozen=True, slots=True)
class NavamsaCompatibility:
    person_a_venus_d9: int
    person_b_venus_d9: int
    person_a_seventh_lord_d9: int
    person_b_seventh_lord_d9: int
    harmony_label: str     # STRONG / GOOD / MIXED / WEAK
    note_en: str
    note_ta: str
    score: int             # 0-20


@dataclass(frozen=True, slots=True)
class DashaHarmony:
    person_a_maha_lord: str
    person_a_antar_lord: str
    person_a_maha_end: str   # ISO date string
    person_b_maha_lord: str
    person_b_antar_lord: str
    person_b_maha_end: str
    harmony_label: str       # SUPPORTIVE / MIXED / CHALLENGING
    note_en: str
    note_ta: str
    score: int               # 0-15


@dataclass(frozen=True, slots=True)
class EmotionalCompatibility:
    moon_moon_harmony: str   # EXCELLENT / GOOD / MIXED / TENSE
    # F-CI-05: this is measured Venus A <-> Venus B, NOT Venus-to-Mars. The
    # wire name `venusMarsHarmony` is kept because it is on the contract
    # across four surfaces; every user-facing label already says "Venus"
    # alone. Do not add a Venus-Mars reading under this field - give it its
    # own one.
    venus_mars_harmony: str  # STRONG / GOOD / MIXED / TENSE
    # F-DSP-01: one note, both languages. It was a single English string and
    # the panel rendered it unconditionally, so Tamil readers got an English
    # sentence under a Tamil heading.
    communication_note_en: str
    communication_note_ta: str
    note_en: str
    note_ta: str
    score: int               # 0-10


@dataclass
class CompatibilityScoreBreakdown:
    # Weights ruled 2026-08-28; see the module docstring for why the raise to
    # Porutham is paid for by Navamsa and Emotional rather than by capping.
    porutham: int = 0        # 0-35
    seventh_house: int = 0   # 0-20
    navamsa: int = 0         # 0-15
    dasha_harmony: int = 0   # 0-15
    dosham_analysis: int = 0 # 0-10
    emotional: int = 0       # 0-5
    synastry: int = 0        # always 0 — out of the composite, still reported alone


@dataclass
class CompatibilityIntelligenceResult:
    person_a_name: str
    person_b_name: str

    # Layer 1 — traditional porutham (raw values from compute_porutham)
    porutham_score: float  # halves, from PorutthamResult.total_score
    porutham_max: int
    porutham_percentage: float
    porutham_label: str
    rajju_dosha: bool
    vedha_dosha: bool

    # Layer 2+3 — individual chart strength
    chart_a_strength: ChartMarriageStrength
    chart_b_strength: ChartMarriageStrength

    # Layer 4 — Navamsa
    navamsa: NavamsaCompatibility

    # Layer 5 — Dosham
    sevvai_a: SevvaiDoshamDetail
    sevvai_b: SevvaiDoshamDetail

    # Layer 6 — Dasha
    dasha_harmony: DashaHarmony

    # Layer 7 — Emotional
    emotional: EmotionalCompatibility

    # Layer 8 — Synastry (raw 0-100 score from existing engine)
    synastry_score: int

    # Aggregate
    overall_score: int
    overall_label: str
    score_breakdown: CompatibilityScoreBreakdown

    strengths_en: list[str] = field(default_factory=list)
    strengths_ta: list[str] = field(default_factory=list)
    risks_en: list[str] = field(default_factory=list)
    risks_ta: list[str] = field(default_factory=list)

    summary_en: str = ""
    summary_ta: str = ""

    # FAA-33: cross-chart observations (both directions). Not a layer: no
    # points, attached after the composite is fixed.
    cross_chart: tuple[CrossChartObservation, ...] = ()

    # FAA-30: each chart's 8th-house reading, and the joint lines beside the
    # samyam layers (never merged into them). Descriptive: no points. One line
    # per cause (OWNER-Q-D4); empty when either gender is not stated.
    mangalya_a: EighthHouseReading | None = None
    mangalya_b: EighthHouseReading | None = None
    mangalya_joint: tuple[MangalyaJointLine, ...] = ()

    # FAA-32: joint progeny (both charts, joint patterns, dasha windows).
    # Descriptive: no points, attached after the composite is fixed.
    joint_progeny: JointProgeny | None = None

    # FAA-31: dasa sandhi, mahadasa changes that fall close together.
    # Surface ratified 2026-11-12 (spec §0.4). Timing only: no points.
    dasa_sandhi: CoupleSandhiReading | None = None


# ---------------------------------------------------------------------------
# Level 5: Sevvai Dosham — delegates to the main dosham engine's
# detect_sevvai_dosham (Lagna + Moon + Venus references, nivarthi rules), with
# the inputs the Jadhagam card passes, so the report and the card agree on
# presence, strength, label and cancellations for the same chart (WI-13).
#
# WI-13 said they "can never disagree" while this file passed planets and lagna
# only. The card also passes combustion (combust Mars aggravates), the D9 map
# (a mitigation) and the live doctrine, so on 400 synthetic charts severity
# differed on 57 and the reasons on 214 (AAU-05).
# ---------------------------------------------------------------------------

def sevvai_inputs_from_snapshot(snap: Any, doctrine: DoctrineOptions = DEFAULT_DOCTRINE) -> dict[str, Any]:
    """Everything `detect_sevvai_dosham` reads, from a chart response, as the
    card path (`_chart_build._build_yoga_dosham_insights`) assembles it.

    Active dasha lords are not passed: Sevvai detection does not read them.
    """
    planets = snap.data.planets
    return {
        "planets": {p.graha: p.rasi for p in planets},
        "lagna_rasi": snap.data.lagna.rasi,
        "gender": getattr(snap.data.birth_profile, "gender_for_traditional_rules", None),
        "combust_planets": frozenset(p.graha for p in planets if p.is_combust),
        "d9_rasi_map": {p.graha: p.d9_rasi for p in planets if isinstance(p.d9_rasi, int)},
        "d9_lagna_rasi": snap.data.lagna.d9_rasi,
        "doctrine": doctrine,
    }


def _sevvai_references(snap: Any, doctrine: DoctrineOptions = DEFAULT_DOCTRINE) -> list[str]:
    """The `from_*` references a chart's own Sevvai dosham stands on, or none."""
    result = detect_sevvai_dosham(**sevvai_inputs_from_snapshot(snap, doctrine))
    return [c for c in result.conditions_met if c.startswith("from_")] if result.is_present else []


def _compute_sevvai(
    snap: Any, partner: Any | None = None, doctrine: DoctrineOptions = DEFAULT_DOCTRINE
) -> SevvaiDoshamDetail:
    """`partner` makes this a two-chart reading, the only kind that can cancel
    (rulings 2026-10-22 round two, §8): dosha samyam of comparable weight, or
    Mars debilitated in Katakam in the dosha house. It replaced a mutual
    cancellation that fired whenever both charts carried any Sevvai at all."""
    mars = _get_planet(snap, "MARS")
    result = detect_sevvai_dosham(
        **sevvai_inputs_from_snapshot(snap, doctrine),
        partner_sevvai_references=_sevvai_references(partner, doctrine) if partner is not None else None,
    )

    if not result.is_present:
        severity, score = "NONE", 5
    elif result.is_cancelled:
        severity, score = "NONE", 4
    elif result.strength == "STRONG":
        severity, score = "SEVERE", 0
    else:
        severity, score = "MODERATE", 2

    return SevvaiDoshamDetail(
        has_dosham=result.is_present,
        mars_house=mars.house_from_lagna,
        is_cancelled=result.is_cancelled,
        severity=severity,
        cancellation_reasons=list(result.cancellation_factors),
        note_en=result.explanation_why_en,
        note_ta=result.explanation_why_ta,
        score=score,
    )


_SEVERITY_TA = {"SEVERE": "தீவிரம்", "MODERATE": "நடுத்தரம்", "MILD": "லேசானது", "NONE": "இல்லை"}


def sevvai_risk_lines(
    sevvai_a: SevvaiDoshamDetail, sevvai_b: SevvaiDoshamDetail
) -> tuple[list[str], list[str]]:
    """The report's Sevvai Dosham lines, (english, tamil).

    Three states, three readings — and the third one used to be silent.

    An *active* dosham is a live risk. A *cancelled* dosham is not the same
    thing as no dosham at all: it carries a residue a clear chart does not,
    which is why `_compute_sevvai` scores it 4 rather than 5, and why anchor
    case 4 (2026-08-31) says the family must be told it was cancelled, **not**
    that it was absent. Before this, both branches required
    ``not is_cancelled``, so a cancelled dosham produced no line anywhere — not
    a risk, not a strength — and the report read exactly like one for a couple
    who never had it.

    Cancellation lands in risks rather than strengths because it is a qualified
    concern, not an asset. That is the same position the dosham panel already
    takes in words: "for marriage matching, this should not be called 'dosham
    free', but the protective factors mean the practical impact is mild."

    Extracted from the narrative block so the rule can be tested directly; it
    was thirty lines of inline branching that nothing could reach.
    """
    risks_en: list[str] = []
    risks_ta: list[str] = []

    for person, sevvai in (("A", sevvai_a), ("B", sevvai_b)):
        if not sevvai.has_dosham:
            continue
        if sevvai.is_cancelled:
            risks_en.append(
                f"Person {person} has Sevvai Dosham, cancelled by protective "
                "factors — reduced, not absent"
            )
            risks_ta.append(
                f"நபர் {person}-க்கு செவ்வாய் தோஷம் உள்ளது, நிவர்த்தி காரணங்களால் "
                "நீக்கப்பட்டுள்ளது — குறைந்துள்ளது, இல்லாமல் இல்லை"
            )
        else:
            severity_ta = _SEVERITY_TA.get(sevvai.severity, sevvai.severity)
            risks_en.append(
                f"Person {person} has active Sevvai Dosham "
                f"({sevvai.severity.lower()}) — matching recommended"
            )
            risks_ta.append(
                f"நபர் {person}-க்கு செவ்வாய் தோஷம் உள்ளது ({severity_ta}) — "
                "பொருத்தம் பரிந்துரை"
            )

    return risks_en, risks_ta


def marriage_samyam_lines(
    snap_a: Any, snap_b: Any, doctrine: DoctrineOptions = DEFAULT_DOCTRINE
) -> tuple[list[str], list[str]]:
    """DD-03 samyam lines, (english, tamil). Report text only: no score moves.

    `rahu_ketu_samyam` is its own concept, kept apart from the Sevvai mutual
    cancellation above and from papa samyam. Cross-samyam (O-3) is off by
    default, so its line appears only when that open item is switched on.
    """
    def doshams(snap: Any) -> tuple[Any, Any]:
        planets = {p.graha: p.rasi for p in snap.data.planets}
        lagna = snap.data.lagna.rasi
        return detect_rahu_ketu_dosham(planets, lagna), detect_sevvai_dosham(**sevvai_inputs_from_snapshot(snap, doctrine))

    rk_a, sv_a = doshams(snap_a)
    rk_b, sv_b = doshams(snap_b)
    samyam = compare_marriage_doshams(rk_a, rk_b, sv_a, sv_b)
    lines_en: list[str] = []
    lines_ta: list[str] = []
    if samyam.rahu_ketu:
        lines_en.append("Rahu-Ketu samyam: both charts carry a comparable Rahu-Ketu marriage axis, so it is balanced for porutham")
        lines_ta.append("ராகு-கேது சாம்யம்: இரு ஜாதகங்களிலும் ஒத்த ராகு-கேது திருமண அச்சு உள்ளதால் பொருத்தத்தில் சமன்படுகிறது")
    if samyam.cross:
        lines_en.append("Cross-samyam: Rahu-Ketu in one chart is balanced by Sevvai in the other (astrologer view)")
        lines_ta.append("குறுக்கு சாம்யம்: ஒரு ஜாதகத்தின் ராகு-கேது மற்றதின் செவ்வாயால் சமன்படுகிறது (ஜோதிடர் பார்வை)")
    return lines_en, lines_ta


def papa_samyam_for_snapshots(boy_snap: Any, girl_snap: Any) -> PapaSamyam | None:
    """Papa samyam read off two chart snapshots, boy first; None if unreadable.

    The one place a snapshot becomes papa-samyam input, shared by the report
    lines below and the porutham route's `papaSamyam` block, so the two can
    never count differently.
    """
    def chart(snap: Any) -> tuple[dict[str, int], int]:
        return {p.graha: p.rasi for p in snap.data.planets}, snap.data.lagna.rasi

    try:
        boy_planets, boy_lagna = chart(boy_snap)
        girl_planets, girl_lagna = chart(girl_snap)
    except (AttributeError, KeyError, TypeError):
        # One check must not be able to take down a whole report. This is NOT
        # the silent omission F-CI-03 was about: that was a check we never
        # wrote, whereas this is a chart we could not read, and it is logged
        # rather than swallowed. If it fires in production the fix is the
        # snapshot, not this branch.
        logger.warning("papa samyam skipped: could not read both chart snapshots", exc_info=True)
        return None
    return papa_samyam(boy_planets, boy_lagna, girl_planets, girl_lagna)


def papa_samyam_lines(
    snap_a: Any, snap_b: Any, sevvai_a_is_boy: bool = True
) -> tuple[list[str], list[str], list[str], list[str]]:
    """பாப சாம்யம் lines: ``(strengths_en, strengths_ta, risks_en, risks_ta)``.

    F-CI-03. A standard part of Tamil jadhaga porutham the report omitted
    entirely: families who bring two jadhagams to a jothidar expect this check,
    and its absence read as a clean result.

    Report text only, no score. The composite's weights are a separate
    decision; shipping a new check and a silent numeric effect in one change
    would make neither attributable (the same reasoning the layer-weight
    comment records for the 80/65/50 rungs).

    `sevvai_a_is_boy` carries the direction, because papa samyam is not
    symmetric — practice asks the **boy's** papa points to be at least the
    girl's. Defaults to the caller's own A=boy convention, and
    `compute_compatibility_intelligence` passes the direction its caller
    resolved (F-POR-05): before 2026-11-09 it passed nothing, so a report whose
    signed-in reader was the bride counted this check backwards.
    """
    result = (
        papa_samyam_for_snapshots(snap_a, snap_b)
        if sevvai_a_is_boy
        else papa_samyam_for_snapshots(snap_b, snap_a)
    )
    if result is None:
        return [], [], [], []

    detail_en = f"(boy {result.boy.total}, girl {result.girl.total})"
    detail_ta = f"(மாப்பிள்ளை {result.boy.total}, பெண் {result.girl.total})"
    if result.balanced:
        return (
            [f"Papa samyam agrees - the malefic load is balanced between the charts {detail_en}"],
            [f"பாப சாம்யம் உள்ளது - இரு ஜாதகங்களிலும் பாப கிரக பலம் சமனாக உள்ளது {detail_ta}"],
            [],
            [],
        )
    return (
        [],
        [],
        [
            f"Papa samyam falls short by {result.shortfall} {detail_en} - traditional practice "
            "asks the groom's malefic count to be at least the bride's; an experienced "
            "astrologer should weigh this against the rest of the reading"
        ],
        [
            f"பாப சாம்யம் குறைகிறது {detail_ta} - மரபுப்படி "
            "மாப்பிள்ளையின் பாப பலம் பெண்ணின் பாப பலத்திற்கு குறையாமல் இருக்க "
            "வேண்டும்; அனுபவமிக்க ஜோதிடரிடம் ஆலோசிக்கவும்"
        ],
    )


_LABEL_RUNGS = ("CAUTION", "AVERAGE", "GOOD", "EXCELLENT")


def sevvai_label_cap(
    sevvai_a: SevvaiDoshamDetail, sevvai_b: SevvaiDoshamDetail
) -> tuple[str | None, str, str]:
    """F-CI-01 - the dosha-samyam cap the 2026-08-31 anchors asked for.

    Tamil practice after Rajju is **dosha samyam**: a chart carrying an
    uncancelled Chevvai dosham is matched with another dosham chart, not with
    a clear one. The composite only ever charged it 5 of 100 points, so a
    one-sided STRONG active dosham could still read EXCELLENT while the risk
    list said the opposite.

    The astrologer's own anchor cases (docs/RULINGS_2026-08-31_MADHYAMA_HALF_POINT.md
    Q1b) fix the two rungs, and they are caps on the *label* only - the 0-100
    score and the full breakdown are untouched, exactly as the Rajju/Vedha veto
    beside this one works:

    * anchor #6 - present and **not** cancelled -> **AVERAGE** ("the live
      dosham holds it here despite a respectable count").
    * anchor #4 - present and **cancelled** -> **GOOD** ("present-but-cancelled
      caps an otherwise-excellent match one rung down").

    Returns ``(cap_label_or_None, reason_en, reason_ta)``; the reason is what
    makes the summary cause-aware, so a capped report never claims every layer
    points in favour.

    Mutual cancellation runs *before* this (``_apply_mutual_sevvai_cancellation``),
    so two uncancelled doshams arrive here as two cancelled ones and take the
    GOOD rung - which is the samyam reading: the match is workable, but it is
    not the dosham-free EXCELLENT.
    """
    active = [p for p, sv in (("A", sevvai_a), ("B", sevvai_b)) if sv.has_dosham and not sv.is_cancelled]
    cancelled = [p for p, sv in (("A", sevvai_a), ("B", sevvai_b)) if sv.has_dosham and sv.is_cancelled]

    if active:
        who_en = " and ".join(f"Person {p}" for p in active)
        who_ta = " மற்றும் ".join(f"நபர் {p}" for p in active)
        return (
            "AVERAGE",
            f"{who_en} carries a live, uncancelled Sevvai Dosham, so the reading is held at "
            "Average however the other layers score - traditional practice matches such a "
            "chart with another dosham chart.",
            f"{who_ta}-க்கு நிவர்த்தி ஆகாத செவ்வாய் தோஷம் உள்ளதால், மற்ற அடுக்குகள் எப்படி இருந்தாலும் "
            "இந்த பிணைப்பு சராசரியாகவே குறிக்கப்படுகிறது.",
        )
    if cancelled:
        who_en = " and ".join(f"Person {p}" for p in cancelled)
        who_ta = " மற்றும் ".join(f"நபர் {p}" for p in cancelled)
        return (
            "GOOD",
            f"{who_en} has a Sevvai Dosham that protective factors cancel - reduced, not "
            "absent, so the reading is held one rung below the top band.",
            f"{who_ta}-க்கு செவ்வாய் தோஷம் உள்ளது, நிவர்த்தி காரணங்கள் உள்ளன — "
            "குறைந்துள்ளது, இல்லாமல் இல்லை. ஆகவே உச்ச நிலையிலிருந்து ஒரு படி கீழ் நிறுத்தப்படுகிறது.",
        )
    return None, "", ""


def apply_label_cap(label: str, cap: str | None) -> str:
    """Lower ``label`` to ``cap`` when the cap is the stricter of the two."""
    if cap is None:
        return label
    return cap if _LABEL_RUNGS.index(cap) < _LABEL_RUNGS.index(label) else label


# ---------------------------------------------------------------------------
# Level 2+3: Individual chart marriage strength
# ---------------------------------------------------------------------------

def _stated_gender(gender: str | None) -> str | None:
    """FAA-16 policy §2: only an explicit "female" / "male" is stated."""
    g = (gender or "").strip().lower()
    return g if g in {"female", "male"} else None


def _chart_spouse_karakas(gender: str | None) -> list[tuple[str, float]]:
    """(graha, weight), primary first — the same table as
    ``marriage_service._spouse_karakas``, so one chart reads alike on both."""
    if gender == "female":
        return [("JUPITER", 1.0), ("VENUS", 0.5)]
    if gender == "male":
        return [("VENUS", 1.0), ("JUPITER", 0.5)]
    return [("VENUS", 0.75), ("JUPITER", 0.75)]


def _compute_chart_marriage_strength(snap: Any) -> ChartMarriageStrength:
    lagna_rasi = snap.data.lagna.rasi
    seventh_rasi = _seventh_house_rasi(lagna_rasi)
    seventh_lord = SIGN_LORD[seventh_rasi]

    venus = _get_planet(snap, "VENUS")
    jupiter = _get_planet(snap, "JUPITER")

    # Find 7th lord in planets
    seventh_lord_planet = next(
        (p for p in snap.data.planets if p.graha == seventh_lord), None
    )
    seventh_lord_house = seventh_lord_planet.house_from_lagna if seventh_lord_planet else 0
    seventh_lord_strength = seventh_lord_planet.strength_score if seventh_lord_planet else 50

    # Malefics in 7th
    malefics_in_7th = [
        p.graha for p in snap.data.planets
        if p.house_from_lagna == 7 and p.graha in _MALEFICS
    ]
    has_malefic_in_seventh = bool(malefics_in_7th)

    # Score calculation
    score = 0

    # 7th lord in kendra or trikona
    if seventh_lord_house in (_KENDRAS | _TRIKONAS):
        score += 3
    elif seventh_lord_house not in _DUSTHANAS and seventh_lord_house != 0:
        score += 1

    # 7th lord strength
    if seventh_lord_strength >= 70:
        score += 3
    elif seventh_lord_strength >= 50:
        score += 2
    else:
        score += 0

    # Spouse karakas (FAA-16): both are read, weighted by this chart's STATED
    # gender — bride Guru 1.0 + Venus 0.5, groom Venus 1.0 + Guru 0.5, unknown
    # 0.75 each (docs/FAA_DECISIONS_2026-11-11.md §2). Gender is this chart's
    # own field only; the porutham direction inferred from the partner is NOT
    # a stated gender and is not read here. The weighted MEAN keeps the old
    # Venus-only band (1–3 points), so the layer's budget does not move.
    def _band(strength: int) -> int:
        return 3 if strength >= 70 else 2 if strength >= 50 else 1

    gender = _stated_gender(getattr(snap.data.birth_profile, "gender_for_traditional_rules", None))
    karakas = _chart_spouse_karakas(gender)
    by_graha = {"VENUS": venus, "JUPITER": jupiter}
    karaka_pts = sum(_band(by_graha[g].strength_score) * w for g, w in karakas) / sum(w for _g, w in karakas)
    score += int(karaka_pts + 0.5)  # half-up; round() is banker's (2.5 → 2)
    primary = by_graha[karakas[0][0]]
    primary_ta, primary_en = planet_ta(karakas[0][0]), planet_en(karakas[0][0])
    if gender is None:
        karaka_ta = f"குரு வலிமை {jupiter.strength_score}/100, சுக்கிர வலிமை {venus.strength_score}/100 (பாலினம் குறிப்பிடப்படாததால் இரண்டும் சமமாக)"
        karaka_en = (
            f"Guru strength {jupiter.strength_score}/100, Venus strength {venus.strength_score}/100 "
            "(read equally: gender not given)"
        )
    else:
        secondary = by_graha[karakas[1][0]]
        secondary_ta, secondary_en = planet_ta(karakas[1][0]), planet_en(karakas[1][0])
        karaka_ta = (
            f"முதன்மை வாழ்க்கைத் துணை காரகன் {primary_ta} வலிமை {primary.strength_score}/100, "
            f"இரண்டாம் நிலை காரகன் {secondary_ta} {secondary.strength_score}/100"
        )
        karaka_en = (
            f"primary spouse significator {primary_en} strength {primary.strength_score}/100, "
            f"secondary {secondary_en} {secondary.strength_score}/100"
        )

    # Malefic penalty
    score -= len(malefics_in_7th)
    score = max(0, min(10, score))

    # Build notes
    seventh_lord_ta, seventh_lord_en = planet_ta(seventh_lord), planet_en(seventh_lord)
    malefics_ta = ", ".join(planet_ta(p) for p in malefics_in_7th)
    malefics_en = ", ".join(planet_en(p) for p in malefics_in_7th)
    if score >= 8:
        note_en = (
            f"Strong marriage indicators: 7th lord {seventh_lord_en} in house {seventh_lord_house} "
            f"with strength {seventh_lord_strength}/100; {karaka_en}."
        )
        note_ta = (
            f"திருமண அறிகுறிகள் வலுவானவை: 7ஆம் அதிபதி {seventh_lord_ta} {seventh_lord_house}ஆம் இடத்தில், "
            f"வலிமை {seventh_lord_strength}/100; {karaka_ta}."
        )
    elif score >= 5:
        note_en = (
            f"Moderate marriage strength: 7th lord {seventh_lord_en} in house {seventh_lord_house}; "
            f"{karaka_en}."
            + (f" Note: {malefics_en} in 7th house." if malefics_in_7th else "")
        )
        note_ta = (
            f"நடுத்தர திருமண வலிமை: 7ஆம் அதிபதி {seventh_lord_ta} {seventh_lord_house}ஆம் இடத்தில்; "
            f"{karaka_ta}."
            + (f" கவனிக்க: 7ஆம் வீட்டில் {malefics_ta}." if malefics_in_7th else "")
        )
    else:
        note_en = (
            f"Marriage house needs attention: 7th lord {seventh_lord_en} in house {seventh_lord_house} "
            f"(strength {seventh_lord_strength}/100); {karaka_en}."
            + (f" {malefics_en} in 7th house — remedies advised." if malefics_in_7th else "")
        )
        note_ta = (
            f"திருமண இடம் கவனம் தேவை: 7ஆம் அதிபதி {seventh_lord_ta} {seventh_lord_house}ஆம் இடத்தில் "
            f"(வலிமை {seventh_lord_strength}/100); {karaka_ta}."
            + (f" 7ஆம் வீட்டில் {malefics_ta} — பரிகாரம் பரிந்துரை." if malefics_in_7th else "")
        )

    return ChartMarriageStrength(
        seventh_house_rasi=seventh_rasi,
        seventh_lord=seventh_lord,
        seventh_lord_house=seventh_lord_house,
        seventh_lord_strength=seventh_lord_strength,
        venus_house=venus.house_from_lagna,
        venus_strength=venus.strength_score,
        jupiter_house=jupiter.house_from_lagna,
        jupiter_strength=jupiter.strength_score,
        has_malefic_in_seventh=has_malefic_in_seventh,
        score=score,
        note_en=note_en,
        note_ta=note_ta,
    )


# ---------------------------------------------------------------------------
# Level 4: Navamsa (D9)
# ---------------------------------------------------------------------------

def _d9_dignified(planet: str, d9_rasi: int) -> bool:
    """Is this planet in its own sign or exaltation sign in the D9 (WI-04)."""
    return (d9_rasi in OWN_SIGN_RASI.get(planet, frozenset())
            or d9_rasi == EXALTATION_RASI.get(planet))


def _compute_navamsa(snap_a: Any, snap_b: Any) -> NavamsaCompatibility:
    venus_a = _get_planet(snap_a, "VENUS")
    venus_b = _get_planet(snap_b, "VENUS")

    lagna_a = snap_a.data.lagna.rasi
    lagna_b = snap_b.data.lagna.rasi
    seventh_lord_a = SIGN_LORD[_seventh_house_rasi(lagna_a)]
    seventh_lord_b = SIGN_LORD[_seventh_house_rasi(lagna_b)]

    seventh_lord_a_planet = next((p for p in snap_a.data.planets if p.graha == seventh_lord_a), None)
    seventh_lord_b_planet = next((p for p in snap_b.data.planets if p.graha == seventh_lord_b), None)

    va_d9 = venus_a.d9_rasi
    vb_d9 = venus_b.d9_rasi
    sla_d9 = seventh_lord_a_planet.d9_rasi if seventh_lord_a_planet else 0
    slb_d9 = seventh_lord_b_planet.d9_rasi if seventh_lord_b_planet else 0

    score = 0

    # Venus D9 harmony — are they in kendra/trikona from each other?
    if va_d9 and vb_d9:
        diff = (va_d9 - vb_d9) % 12 + 1
        if diff in {1, 5, 9}:  # trikona = excellent
            score += 8
        elif diff in {4, 7, 10}:  # kendra = good
            score += 6
        elif diff in {2, 12}:  # 2nd/12th = decent
            score += 4
        elif diff in {3, 11}:
            score += 3
        else:
            score += 1

    # Venus A in own/exaltation D9
    if va_d9 in OWN_SIGN_RASI.get("VENUS", frozenset()):
        score += 3
    elif va_d9 == EXALTATION_RASI.get("VENUS"):
        score += 3

    # Venus B in own/exaltation D9
    if vb_d9 in OWN_SIGN_RASI.get("VENUS", frozenset()):
        score += 3
    elif vb_d9 == EXALTATION_RASI.get("VENUS"):
        score += 3

    # 7th lords D9 — dignity check (own sign or exaltation), not a
    # kendra/trikona house test: sla_d9/slb_d9 are D9 SIGN numbers (1-12), and
    # _KENDRAS|_TRIKONAS is a set of HOUSE positions — comparing a sign number
    # against a house set is a category error that awarded points on 6 of 12
    # signs regardless of dignity (WI-04).
    if sla_d9 and _d9_dignified(seventh_lord_a, sla_d9):
        score += 3
    if slb_d9 and _d9_dignified(seventh_lord_b, slb_d9):
        score += 3

    score = max(0, min(20, score))

    if score >= 16:
        harmony_label = "STRONG"
        note_en = "Excellent Navamsa alignment — Venus and 7th lords in D9 show strong marriage potential."
        note_ta = "சிறந்த நவாம்ச இணக்கம் — D9-ல் சுக்கிரன் மற்றும் 7ஆம் அதிபதி நல்ல திருமண சாத்தியத்தை காட்டுகின்றன."
    elif score >= 11:
        harmony_label = "GOOD"
        note_en = "Good Navamsa compatibility — some strong D9 placements support the match."
        note_ta = "நல்ல நவாம்ச இணக்கம் — D9-ல் சில வலுவான நிலைகள் பொருத்தத்தை ஆதரிக்கின்றன."
    elif score >= 6:
        harmony_label = "MIXED"
        note_en = "Mixed Navamsa signals — the D9 shows some challenges alongside compatible placements."
        note_ta = "கலந்த நவாம்ச அறிகுறிகள் — D9-ல் சில சவால்களும் இணக்கமான நிலைகளும் காணப்படுகின்றன."
    else:
        harmony_label = "WEAK"
        note_en = "Navamsa needs attention — D9 placements suggest working on the deeper soul-level compatibility."
        note_ta = "நவாம்சம் கவனம் தேவை — D9 நிலைகள் ஆழமான ஆன்மீக இணக்கத்தில் முயற்சி தேவை என்று காட்டுகின்றன."

    return NavamsaCompatibility(
        person_a_venus_d9=va_d9,
        person_b_venus_d9=vb_d9,
        person_a_seventh_lord_d9=sla_d9,
        person_b_seventh_lord_d9=slb_d9,
        harmony_label=harmony_label,
        note_en=note_en,
        note_ta=note_ta,
        score=score,
    )


# ---------------------------------------------------------------------------
# Level 6: Dasha Harmony
# ---------------------------------------------------------------------------

def _jd_for_today() -> float:
    return utc_datetime_to_julian_day(datetime.now(tz=UTC))


def _compute_dasha_harmony(snap_a: Any, snap_b: Any, today_jd: float) -> DashaHarmony:
    moon_a = _get_planet(snap_a, "MOON")
    moon_b = _get_planet(snap_b, "MOON")

    tl_a = calculate_vimshottari_timeline(snap_a.data.julian_day, moon_a.absolute_longitude, today_jd)
    tl_b = calculate_vimshottari_timeline(snap_b.data.julian_day, moon_b.absolute_longitude, today_jd)

    maha_a = tl_a.current_mahadasha.lord
    antar_a = tl_a.current_antardasha.lord
    maha_end_a = tl_a.current_mahadasha.end_date.isoformat()

    maha_b = tl_b.current_mahadasha.lord
    antar_b = tl_b.current_antardasha.lord
    maha_end_b = tl_b.current_mahadasha.end_date.isoformat()

    # Harmony between maha lords
    relation = _graha_relation(maha_a, maha_b)

    # Also check if both are in marriage-supportive dashas
    both_supportive = maha_a in _MARRIAGE_DASHAS and maha_b in _MARRIAGE_DASHAS
    one_supportive = maha_a in _MARRIAGE_DASHAS or maha_b in _MARRIAGE_DASHAS

    maha_a_ta, maha_a_en = planet_ta(maha_a), planet_en(maha_a)
    maha_b_ta, maha_b_en = planet_ta(maha_b), planet_en(maha_b)

    if relation == "friend" and both_supportive:
        score = 15
        harmony_label = "SUPPORTIVE"
        note_en = (
            f"Both partners are in supportive dashas ({maha_a_en} and {maha_b_en}) and their dasha lords "
            f"are mutually friendly — an auspicious time for marriage planning."
        )
        note_ta = (
            f"இரு நபர்களும் சாதகமான தசைகளில் உள்ளனர் ({maha_a_ta} மற்றும் {maha_b_ta}); தசை அதிபதிகள் "
            f"நண்பர்கள் — திருமண திட்டமிடலுக்கு நல்ல காலம்."
        )
    elif relation == "friend":
        score = 12
        harmony_label = "SUPPORTIVE"
        note_en = (
            f"Dasha lords {maha_a_en} and {maha_b_en} are friendly planets — supportive period for the relationship, "
            f"though timing may need checking against transit support."
        )
        note_ta = (
            f"தசை அதிபதிகள் {maha_a_ta} மற்றும் {maha_b_ta} நண்பர்கள் — உறவுக்கு சாதகமான காலம்; "
            f"கோச்சார ஆதரவையும் சரிபார்க்கவும்."
        )
    elif relation == "neutral":
        score = 9
        harmony_label = "MIXED"
        if one_supportive:
            score = 10
            supportive_en = maha_a_en if maha_a in _MARRIAGE_DASHAS else maha_b_en
            supportive_ta = maha_a_ta if maha_a in _MARRIAGE_DASHAS else maha_b_ta
            note_en = (
                f"One partner is in a marriage-supportive dasha ({supportive_en}); "
                f"the dasha lords are neutral to each other. Moderately favourable."
            )
            note_ta = (
                f"ஒரு நபர் திருமண சாதகமான தசையில் ({supportive_ta}) உள்ளார்; தசை அதிபதிகள் நடுநிலையானவர்கள். "
                "நடுத்தர சாதகம்."
            )
        else:
            note_en = (
                f"Dasha lords {maha_a_en} and {maha_b_en} are neutral — stable but not particularly activated "
                f"for relationship matters in this period."
            )
            note_ta = (
                f"தசை அதிபதிகள் {maha_a_ta} மற்றும் {maha_b_ta} நடுநிலையானவர்கள் — நிலையான ஆனால் "
                f"திருமண விஷயங்களுக்கு குறிப்பாக செயல்படவில்லை."
            )
    else:  # enemy
        score = 4
        harmony_label = "CHALLENGING"
        note_en = (
            f"Dasha lords {maha_a_en} and {maha_b_en} are in an inimical relationship — this period may "
            f"bring friction; patience and communication are especially important."
        )
        note_ta = (
            f"தசை அதிபதிகள் {maha_a_ta} மற்றும் {maha_b_ta} எதிர் தன்மை கொண்டவர்கள் — இந்த காலம் "
            f"சில மோதல்களை கொண்டுவரலாம்; பொறுமை மற்றும் தொடர்பு முக்கியம்."
        )

    return DashaHarmony(
        person_a_maha_lord=maha_a,
        person_a_antar_lord=antar_a,
        person_a_maha_end=maha_end_a,
        person_b_maha_lord=maha_b,
        person_b_antar_lord=antar_b,
        person_b_maha_end=maha_end_b,
        harmony_label=harmony_label,
        note_en=note_en,
        note_ta=note_ta,
        score=score,
    )


# ---------------------------------------------------------------------------
# Level 7: Emotional Compatibility
# ---------------------------------------------------------------------------

# Doctrine §10 (ratified 2026-07-16) — reconciled, symmetric table. Keys are
# the inclusive 1-based count (a-b) % 12 + 1; the table is kept verbatim in
# both directions (k and 14-k share a value) even though the lookup below
# only ever indexes the smaller-side keys 1-7 (see _moon_harmony_label).
_MOON_HARMONY_TABLE: dict[int, str] = {
    1: "GOOD",                        # same rasi
    2: "MIXED", 12: "MIXED",          # dwirdwadasa
    3: "GOOD", 11: "GOOD",            # upachaya
    4: "GOOD", 10: "GOOD",            # kendra
    5: "EXCELLENT", 9: "EXCELLENT",   # trikona
    6: "TENSE", 8: "TENSE",           # shadashtaka
    7: "GOOD",                        # samasaptama
}


def _moon_harmony_label(rasi_a: int, rasi_b: int) -> str:
    """Symmetric lookup: harmony(a, b) == harmony(b, a) for all rasi pairs.

    Folds to the smaller directional distance using the 0-indexed difference
    (0..11) before mapping into the table — NOT by folding the 1-based count
    directly (e.g. min(count, 13-count)), which is a trap that wrongly
    collapses samasaptama (7) into the shadashtaka (6/8) bucket (WI-05).
    """
    d = (rasi_a - rasi_b) % 12
    normalized = min(d, 12 - d)
    return _MOON_HARMONY_TABLE.get(normalized + 1, "MIXED")


def _compute_emotional_compatibility(snap_a: Any, snap_b: Any) -> EmotionalCompatibility:
    moon_a = _get_planet(snap_a, "MOON")
    moon_b = _get_planet(snap_b, "MOON")
    venus_a = _get_planet(snap_a, "VENUS")
    venus_b = _get_planet(snap_b, "VENUS")

    moon_harmony = _moon_harmony_label(moon_a.rasi, moon_b.rasi)

    # FAA-12 (owner ruling 2026-11-11): Venus-Venus is graded on the one ruled
    # harmony table, Doctrine §10 (`_MOON_HARMONY_TABLE`), as the Moon is. Its
    # old literal set called 1, 2 and 12 STRONG where §10 says GOOD / MIXED.
    # The wire scale names §10's EXCELLENT "STRONG"; the other words match.
    # (The dead Venus-Mars cross-chart lines are gone too.)
    venus_mars_harmony = {"EXCELLENT": "STRONG"}.get(
        _moon_harmony_label(venus_a.rasi, venus_b.rasi), _moon_harmony_label(venus_a.rasi, venus_b.rasi)
    )

    # Score (0-10)
    moon_score_map = {"EXCELLENT": 5, "GOOD": 4, "MIXED": 2, "TENSE": 0}
    vm_score_map = {"STRONG": 5, "GOOD": 4, "MIXED": 3, "TENSE": 1}
    score = moon_score_map.get(moon_harmony, 2) + vm_score_map.get(venus_mars_harmony, 3)
    score = max(0, min(10, score))

    moon_diff_desc = (moon_b.rasi - moon_a.rasi) % 12 + 1  # noqa: F841 — retained scaffolding for future moon-distance note
    easy_wavelength = moon_harmony in {"EXCELLENT", "GOOD"}
    communication_note_en = (
        "Natural emotional wavelength — communication will feel effortless."
        if easy_wavelength
        else "Different emotional styles — intentional communication and empathy bridge the gap."
    )
    communication_note_ta = (
        "இயல்பான உணர்வுத் தாளம் — உரையாடல் எளிதாக இருக்கும்."
        if easy_wavelength
        else "வெவ்வேறு உணர்வு முறைகள் — திட்டமிட்ட உரையாடலும் பரிவும் இடைவெளியை இணைக்கும்."
    )

    _HARMONY_TA = {
        "EXCELLENT": "மிகச் சிறந்த", "GOOD": "நல்ல", "STRONG": "வலுவான",
        "MIXED": "கலப்பான", "TENSE": "இறுக்கமான",
    }
    moon_harmony_ta = _HARMONY_TA.get(moon_harmony, "கலப்பான")
    venus_harmony_ta = _HARMONY_TA.get(venus_mars_harmony, "கலப்பான")

    if score >= 8:
        note_en = (
            f"Strong emotional resonance: Moon positions show {moon_harmony.lower()} harmony; "
            f"Venus compatibility is {venus_mars_harmony.lower()}. The relationship will feel emotionally nourishing."
        )
        note_ta = (
            f"வலுவான உணர்வு இணக்கம்: சந்திர நிலைகள் {moon_harmony_ta} இணக்கம் காட்டுகின்றன; "
            f"சுக்கிர இணக்கம் {venus_harmony_ta}. உறவு உணர்வு ரீதியாக நல்லதாக இருக்கும்."
        )
    elif score >= 5:
        note_en = (
            f"Moderate emotional compatibility: Moon harmony is {moon_harmony.lower()}, "
            f"Venus shows {venus_mars_harmony.lower()} alignment. Mutual understanding grows with time."
        )
        note_ta = (
            f"நடுத்தர உணர்வு இணக்கம்: சந்திர இணக்கம் {moon_harmony_ta}, "
            f"சுக்கிர இணக்கம் {venus_harmony_ta}. பரஸ்பர புரிதல் நேரத்துடன் வளரும்."
        )
    else:
        note_en = (
            f"Emotional differences need attention: Moon harmony is {moon_harmony.lower()}. "
            f"Building shared emotional vocabulary is the key investment for this relationship."
        )
        note_ta = (
            f"உணர்வு வேறுபாடுகளுக்கு கவனம் தேவை: சந்திர இணக்கம் {moon_harmony_ta}. "
            f"பகிரப்பட்ட உணர்வு மொழியை உருவாக்குவது இந்த உறவிற்கான முக்கிய முதலீடு."
        )

    return EmotionalCompatibility(
        moon_moon_harmony=moon_harmony,
        venus_mars_harmony=venus_mars_harmony,
        communication_note_en=communication_note_en,
        communication_note_ta=communication_note_ta,
        note_en=note_en,
        note_ta=note_ta,
        score=score,
    )


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def compute_compatibility_intelligence(
    *,
    snap_a: Any,
    snap_b: Any,
    porutham_result: Any,     # PorutthamResult from compute_porutham
    synastry_score: int = 50,  # 0-100 from compute_synastry_score
    today_jd: float | None = None,
    person_a_name: str = "Person A",
    person_b_name: str = "Person B",
    doctrine: DoctrineOptions = DEFAULT_DOCTRINE,
    a_is_boy: bool = True,
) -> CompatibilityIntelligenceResult:
    """`a_is_boy` is the direction the caller resolved (F-POR-05,
    `synastry_service._assign_bride_groom`). Only the direction-sensitive
    checks read it; today that is papa samyam."""
    if today_jd is None:
        today_jd = _jd_for_today()

    # Layer 1: Porutham — 35 of 100 since the 2026-08-28 ruling. The single
    # heaviest layer, which is the point: it is the instrument the family uses.
    porutham_pts = round(porutham_result.percentage / 100 * COMPATIBILITY_LAYER_MAX["porutham"])

    # Layer 2+3: Chart strength
    strength_a = _compute_chart_marriage_strength(snap_a)
    strength_b = _compute_chart_marriage_strength(snap_b)
    seventh_house_pts = strength_a.score + strength_b.score  # 0-20

    # Layer 4: Navamsa
    navamsa = _compute_navamsa(snap_a, snap_b)

    # Layer 5: Dosham
    sevvai_a = _compute_sevvai(snap_a, partner=snap_b, doctrine=doctrine)
    sevvai_b = _compute_sevvai(snap_b, partner=snap_a, doctrine=doctrine)
    dosham_pts = sevvai_a.score + sevvai_b.score  # 0-10 (5 each max)

    # No Nadi deduction (owner ruling 2026-11-11). Nadi is a North Indian
    # (Ashtakoota) check, not one of the Tamil ten poruthams, so it is shown as
    # a secondary note and moves no number. It used to take 3 points off this
    # layer, which let a check the family's jothidar does not count lower the
    # headline score. The note itself still rides on `porutham_result`.

    # Layer 6: Dasha
    dasha = _compute_dasha_harmony(snap_a, snap_b, today_jd)

    # Layer 7: Emotional
    emotional = _compute_emotional_compatibility(snap_a, snap_b)

    # Layer 8: Synastry — WEIGHT ZERO since the 2026-08-28 ruling.
    #
    # Still computed and still reported in full as `synastry_score`; it simply
    # no longer moves the headline number. Kept as an explicit 0 rather than
    # deleted because the field is on the wire across four surfaces, and because
    # a layer that was dropped deliberately should read as dropped rather than
    # as absent.
    synastry_pts = COMPATIBILITY_LAYER_MAX["synastry"]

    # Overall score
    # Navamsa and Emotional are rescaled HERE, not in their own scorers: each
    # layer keeps its native scale for its own detail panel (`navamsa.score` is
    # 0-20, `emotional.score` is 0-10) and only its contribution is trimmed.
    # This is the "de-duplicate by trimming, not by capping" half of the ruling.
    breakdown = CompatibilityScoreBreakdown(
        porutham=porutham_pts,
        seventh_house=seventh_house_pts,
        navamsa=round(navamsa.score / _NAVAMSA_NATIVE_MAX * COMPATIBILITY_LAYER_MAX["navamsa"]),
        dasha_harmony=dasha.score,
        dosham_analysis=dosham_pts,
        emotional=round(
            emotional.score / _EMOTIONAL_NATIVE_MAX * COMPATIBILITY_LAYER_MAX["emotional"]
        ),
        synastry=synastry_pts,
    )
    overall_score = (
        breakdown.porutham
        + breakdown.seventh_house
        + breakdown.navamsa
        + breakdown.dasha_harmony
        + breakdown.dosham_analysis
        + breakdown.emotional
        + breakdown.synastry
    )
    overall_score = max(0, min(100, overall_score))

    # Label
    if overall_score >= 80:
        overall_label = "EXCELLENT"
    elif overall_score >= 65:
        overall_label = "GOOD"
    elif overall_score >= 50:
        overall_label = "AVERAGE"
    else:
        overall_label = "CAUTION"

    # Doctrine §12 — Rajju/Vedha veto hard-caps the headline label at CAUTION
    # regardless of the weighted 0-100 score (WI-21). Porutham is 35 of the 100
    # weighted points (raised from 20 by the 2026-08-28 ruling; this comment
    # said 20 until 2026-08-31), so a Rajju/Vedha dosha can still be outweighed
    # by the other 7 levels; the traditional veto must therefore govern the
    # headline verdict, matching the porutham engine's own shipped label-veto.
    # overall_score itself and the full breakdown are unaffected — only the
    # label is capped.
    #
    # THE 80/65/50 RUNGS BELOW HAVE NOT BEEN RETUNED SINCE porutham went 20 -> 35,
    # and that is a deliberate hold, not an oversight. Raising the share gave one
    # kuta of ten 3.5 composite points instead of 2, and the same ruling set made
    # Sthree Deergham's MADHYAMA band score zero — which is 22.2% of the 729 star
    # pairs (measured), each losing exactly 3.5 points. Retuning the rungs in the
    # same change as the rulings that moved the distribution would make it
    # impossible to attribute any verdict change to either one. The retune needs
    # a measured composite distribution over real charts, not over the star grid:
    # 65 of the 100 points come from layers no star pair determines.
    if porutham_result.rajju_dosha or porutham_result.vedha_dosha:
        overall_label = "CAUTION"

    # F-CI-01 - the dosha-samyam cap, the second half of the 2026-08-31 ruling.
    # Rajju/Vedha above cap at CAUTION; a live Sevvai dosham caps at AVERAGE
    # (anchor #6) and a cancelled one at GOOD (anchor #4). Caps compose: the
    # strictest wins, and none of them moves `overall_score`.
    sevvai_cap, cap_reason_en, cap_reason_ta = sevvai_label_cap(sevvai_a, sevvai_b)
    label_before_sevvai_cap = overall_label
    overall_label = apply_label_cap(overall_label, sevvai_cap)
    sevvai_cap_applied = overall_label != label_before_sevvai_cap

    # Strengths and risks
    strengths_en: list[str] = []
    strengths_ta: list[str] = []
    risks_en: list[str] = []
    risks_ta: list[str] = []

    if porutham_result.percentage >= 70:
        strengths_en.append(f"Strong traditional porutham score ({porutham_result.percentage:.0f}%)")
        strengths_ta.append(f"வலுவான பாரம்பரிய பொருத்தம் மதிப்பெண் ({porutham_result.percentage:.0f}%)")
    elif porutham_result.percentage < 50:
        risks_en.append(f"Traditional porutham score is below average ({porutham_result.percentage:.0f}%)")
        risks_ta.append(f"பாரம்பரிய பொருத்தம் சராசரிக்கு கீழே ({porutham_result.percentage:.0f}%)")

    if strength_a.score + strength_b.score >= 14:
        strengths_en.append("Both charts show strong 7th house and Venus placements")
        strengths_ta.append("இரு ஜாதகங்களிலும் 7ஆம் இடம் மற்றும் சுக்கிரன் வலுவாக உள்ளனர்")
    elif strength_a.score + strength_b.score <= 6:
        risks_en.append("7th house or Venus placement needs attention in one or both charts")
        risks_ta.append("ஒரு அல்லது இரு ஜாதகங்களிலும் 7ஆம் இடம் அல்லது சுக்கிரன் கவனம் தேவை")

    if navamsa.harmony_label in {"STRONG", "GOOD"}:
        navamsa_ta = "வலுவானது" if navamsa.harmony_label == "STRONG" else "நல்லது"
        strengths_en.append(f"Navamsa (D9) alignment is {navamsa.harmony_label.lower()}")
        strengths_ta.append(f"நவாம்ச (D9) இணக்கம் {navamsa_ta}")
    elif navamsa.harmony_label == "WEAK":
        risks_en.append("Navamsa (D9) placement shows weaker marriage potential")
        risks_ta.append("நவாம்ச (D9) நிலை பலவீனமான திருமண சாத்தியத்தை காட்டுகிறது")

    dasha_pair_ta = f"{planet_ta(dasha.person_a_maha_lord)} × {planet_ta(dasha.person_b_maha_lord)}"
    dasha_pair_en = f"{planet_en(dasha.person_a_maha_lord)} × {planet_en(dasha.person_b_maha_lord)}"
    if dasha.harmony_label == "SUPPORTIVE":
        strengths_en.append(f"Dasha period is supportive ({dasha_pair_en})")
        strengths_ta.append(f"தசை காலம் சாதகமானது ({dasha_pair_ta})")
    elif dasha.harmony_label == "CHALLENGING":
        risks_en.append(f"Current dasha lords are in tension ({dasha_pair_en})")
        risks_ta.append(f"தற்போதைய தசை அதிபதிகள் மோதலில் உள்ளனர் ({dasha_pair_ta})")

    sevvai_risks_en, sevvai_risks_ta = sevvai_risk_lines(sevvai_a, sevvai_b)
    risks_en.extend(sevvai_risks_en)
    risks_ta.extend(sevvai_risks_ta)

    samyam_en, samyam_ta = marriage_samyam_lines(snap_a, snap_b, doctrine)
    strengths_en.extend(samyam_en)
    strengths_ta.extend(samyam_ta)

    # F-CI-03: papa samyam, which the report used to omit silently.
    papa_s_en, papa_s_ta, papa_r_en, papa_r_ta = papa_samyam_lines(snap_a, snap_b, a_is_boy)
    strengths_en.extend(papa_s_en)
    strengths_ta.extend(papa_s_ta)
    risks_en.extend(papa_r_en)
    risks_ta.extend(papa_r_ta)

    # F-CI-02: EC-RULING-06 excised the lifespan framing from the porutham
    # engine; it survived here, in the module that engine's tone sweep does
    # not reach. Rajju is now stated as the hard gate it is, in advisory
    # voice, naming neither health nor lifespan. Vedha, which caps the label
    # identically, had no line at all - a capped report could not say why.
    for _gate_on, _gate_en, _gate_ta in (
        (porutham_result.rajju_dosha, "Rajju", "ரஜ்ஜு"),
        (porutham_result.vedha_dosha, "Vedha", "வேதை"),
    ):
        if _gate_on:
            risks_en.append(_gate_en + " porutham does not agree — a traditional hard gate; an experienced astrologer should review this pairing before it is settled")
            risks_ta.append(_gate_ta + " பொருத்தம் இல்லை — இது பாரம்பரிய முதன்மை விதி; முடிவு எடுப்பதற்கு முன் அனுபவமிக்க ஜோதிடரிடம் ஆலோசிக்கவும்")

    if emotional.score >= 8:
        moon_harmony_summary_ta = {
            "EXCELLENT": "மிகச் சிறந்தது", "GOOD": "நல்லது", "MIXED": "கலப்பானது", "TENSE": "இறுக்கமானது",
        }.get(emotional.moon_moon_harmony, "நல்லது")
        strengths_en.append(f"Strong emotional resonance — Moon harmony is {emotional.moon_moon_harmony.lower()}")
        strengths_ta.append(f"வலுவான உணர்வு இணக்கம் — சந்திர இணக்கம் {moon_harmony_summary_ta}")
    elif emotional.score <= 3:
        risks_en.append("Emotional styles differ significantly — communication investment needed")
        risks_ta.append("உணர்வு முறைகள் வேறுபட்டுள்ளன — தொடர்பு முயற்சி தேவை")

    # Summary
    if overall_label == "EXCELLENT":
        summary_en = (
            f"Compatibility Intelligence Score: {overall_score}/100 — Excellent. "
            "Traditional porutham, navamsa alignment, dasha harmony, and emotional compatibility all "
            "point strongly in favour of this match. A holistically auspicious pairing."
        )
        summary_ta = (
            f"இணக்க நுண்ணறிவு மதிப்பெண்: {overall_score}/100 — சிறந்தது. "
            "பாரம்பரிய பொருத்தம், நவாம்ச இணக்கம், தசை சாதகம், மற்றும் உணர்வு இணக்கம் அனைத்தும் "
            "இந்த ஜோடிக்கு சாதகமாக சுட்டிக்காட்டுகின்றன."
        )
    elif overall_label == "GOOD":
        summary_en = (
            f"Compatibility Intelligence Score: {overall_score}/100 — Good. "
            "Most compatibility layers align well. Minor areas to be mindful of are noted in the risk section."
        )
        summary_ta = (
            f"இணக்க நுண்ணறிவு மதிப்பெண்: {overall_score}/100 — நல்லது. "
            "பெரும்பாலான இணக்க அடுக்குகள் நன்றாக இணைகின்றன. சில கவனிக்க வேண்டிய அம்சங்கள் குறிப்பிடப்பட்டுள்ளன."
        )
    elif overall_label == "AVERAGE":
        summary_en = (
            f"Compatibility Intelligence Score: {overall_score}/100 — Average. "
            "The match has both supportive and challenging factors. "
            "Understanding the risk areas and working through them together is key."
        )
        summary_ta = (
            f"இணக்க நுண்ணறிவு மதிப்பெண்: {overall_score}/100 — சராசரி. "
            "பொருத்தத்தில் சாதக மற்றும் சவாலான காரணிகள் உள்ளன. "
            "ஆபத்து அம்சங்களை புரிந்துகொண்டு சேர்ந்து செயல்படுவது முக்கியம்."
        )
    else:
        summary_en = (
            f"Compatibility Intelligence Score: {overall_score}/100 — Caution advised. "
            "Several compatibility layers show friction. Consultation with an experienced jyotishi "
            "and careful remedial planning is recommended before proceeding."
        )
        summary_ta = (
            f"இணக்க நுண்ணறிவு மதிப்பெண்: {overall_score}/100 — எச்சரிக்கை பரிந்துரை. "
            "பல இணக்க அடுக்குகளில் மோதல்கள் காணப்படுகின்றன. தொடர்வதற்கு முன் "
            "அனுபவமிக்க ஜோதிட ஆலோசனை மற்றும் பரிகார திட்டமிடல் பரிந்துரைக்கப்படுகிறது."
        )

    # F-CI-01: a capped report must say why. Without this the GOOD/AVERAGE
    # wording ("most compatibility layers align well") reads as a comment on
    # the layers when it is actually the dosham holding the rung down.
    if sevvai_cap_applied:
        summary_en = f"{summary_en} {cap_reason_en}"
        summary_ta = f"{summary_ta} {cap_reason_ta}"

    return CompatibilityIntelligenceResult(
        person_a_name=person_a_name,
        person_b_name=person_b_name,
        porutham_score=porutham_result.total_score,
        porutham_max=porutham_result.max_score,
        porutham_percentage=porutham_result.percentage,
        porutham_label=porutham_result.label,
        rajju_dosha=porutham_result.rajju_dosha,
        vedha_dosha=porutham_result.vedha_dosha,
        chart_a_strength=strength_a,
        chart_b_strength=strength_b,
        navamsa=navamsa,
        sevvai_a=sevvai_a,
        sevvai_b=sevvai_b,
        dasha_harmony=dasha,
        emotional=emotional,
        synastry_score=synastry_score,
        overall_score=overall_score,
        overall_label=overall_label,
        score_breakdown=breakdown,
        strengths_en=strengths_en,
        strengths_ta=strengths_ta,
        risks_en=risks_en,
        risks_ta=risks_ta,
        summary_en=summary_en,
        summary_ta=summary_ta,
        # FAA-33: observations only; computed after every number above is fixed.
        cross_chart=_cross_chart(snap_a, snap_b),
        **_mangalya_fields(snap_a, snap_b, doctrine),
        joint_progeny=joint_progeny_from_snapshots(snap_a, snap_b, today_jd),
        dasa_sandhi=dasa_sandhi_from_snapshots(snap_a, snap_b, today_jd),
    )


def _lagna_bracket(snap: Any, minutes: float) -> tuple[float, float] | None:
    """The lagna at birth time -/+ ``minutes``, from the ephemeris. None when
    the birth place is unknown."""
    data = snap.data
    profile = getattr(data, "birth_profile", None)
    lat = getattr(profile, "birth_latitude", None)
    lon = getattr(profile, "birth_longitude", None)
    if lat is None or lon is None:
        return None
    step = minutes / 1440.0
    return (
        calculate_lagna_degree(data.julian_day - step, lat, lon),
        calculate_lagna_degree(data.julian_day + step, lat, lon),
    )


def eighth_house_reading_from_snapshot(snap: Any, doctrine: DoctrineOptions = DEFAULT_DOCTRINE) -> EighthHouseReading:
    """FAA-30 for one chart. The D9-lagna bracket comes from the ephemeris when
    the birth place is known; without it the D9 lines are dropped, not guessed."""
    profile = getattr(snap.data, "birth_profile", None)
    bracket = _lagna_bracket(snap, D9_TOLERANCE_MINUTES)
    chart = mangalya_chart_from_snapshot(snap, sevvai_conditions=_sevvai_references(snap, doctrine), lagna_bracket=bracket)
    return mangalya_one_chart(chart, getattr(profile, "gender_for_traditional_rules", None))


def joint_progeny_from_snapshots(snap_a: Any, snap_b: Any, today_jd: float) -> JointProgeny:
    """FAA-32 for the couple. Attached after the composite is fixed: no points."""
    as_of = julian_day_to_utc_datetime(today_jd).date()
    parts: list[Any] = []
    for snap in (snap_a, snap_b):
        data = snap.data
        moon = next(p for p in data.planets if p.graha == "MOON")
        timeline = calculate_vimshottari_timeline(data.julian_day, moon.absolute_longitude, today_jd)
        chart = progeny_chart_from_snapshot(snap, lagna_bracket=_lagna_bracket(snap, BIRTH_TIME_TOLERANCE_MINUTES))
        gender = getattr(getattr(data, "birth_profile", None), "gender_for_traditional_rules", None)
        parts.append((chart, gender, timeline.mahadashas, progeny_birth_date(snap)))
    (ca, ga, ma, ba), (cb, gb, mb, bb) = parts
    return joint_progeny(ca, ga, ma, ba, cb, gb, mb, bb, as_of=as_of)


def _mahadashas(snap: Any, today_jd: float) -> Any:
    data = snap.data
    moon = next(p for p in data.planets if p.graha == "MOON")
    return calculate_vimshottari_timeline(data.julian_day, moon.absolute_longitude, today_jd).mahadashas


def dasa_sandhi_from_snapshots(snap_a: Any, snap_b: Any, today_jd: float) -> CoupleSandhiReading:
    """FAA-31 for the couple. Attached after the composite is fixed: no points.

    The horizon starts at the reference date. The ruling allows a planned
    marriage date instead, but no CI field carries one, so none is guessed.
    """
    as_of = julian_day_to_utc_datetime(today_jd).date()
    return couple_reading(_mahadashas(snap_a, today_jd), _mahadashas(snap_b, today_jd), from_date=as_of)


def _mangalya_fields(snap_a: Any, snap_b: Any, doctrine: DoctrineOptions) -> dict[str, Any]:
    a, b = eighth_house_reading_from_snapshot(snap_a, doctrine), eighth_house_reading_from_snapshot(snap_b, doctrine)
    return {"mangalya_a": a, "mangalya_b": b, "mangalya_joint": mangalya_joint_lines(a, b)}


def _cross_chart(snap_a: Any, snap_b: Any) -> tuple[CrossChartObservation, ...]:
    return cross_chart_observations(chart_points_from_snapshot(snap_a), chart_points_from_snapshot(snap_b))
