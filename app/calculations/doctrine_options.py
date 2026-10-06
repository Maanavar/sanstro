"""Unfrozen doctrine switches for the yoga/dosham layer (DOCTRINE_DECISIONS v1.3).

`docs/DOCTRINE_DECISIONS_V1.2.md` §16 lists open items O-1 to O-11 that a
practitioner has not yet ruled on, each with a "default until ruled". This module
is the single home for those defaults, plus the items that implementation itself
uncovered (O-12 onward; each one is a conflict found while coding and recorded in
§16 of the decision file rather than settled silently in code).

Why a dataclass and not `get_flag` calls in the detectors: `app/calculations` is
pure and never reads runtime state. The service layer
(`feature_flags.current_doctrine_options`) builds a `DoctrineOptions` from the
admin-editable flags and passes it down; a test passes one directly. Every field
default here equals the decision file's default, so `DEFAULT_DOCTRINE` *is* the
v1.3 engine.

Nothing here is frozen. A ruling changes a default here and a line in §16, and
never a detector body.
"""
from __future__ import annotations

from dataclasses import dataclass

#: Floating-point safety for longitude equality tests, in degrees. Tier C, and
#: NOT an astrological orb (DD-10, DD-12). It exists only so that an elongation
#: that is mathematically 0° or 180° is not lost to float rounding.
LONGITUDE_EPSILON = 1e-6


@dataclass(frozen=True, slots=True)
class DoctrineOptions:
    """One field per unfrozen doctrine choice. Defaults are the v1.3 defaults."""

    #: O-1 — Rahu–Ketu "from Moon" / "from Venus" checks. True = secondary
    #: reference that may raise severity one grade but never creates the dosham.
    o1_rk_moon_venus_secondary: bool = True
    #: O-2: node dignity is disputed by lineage. Accept only an explicitly
    #: named, practitioner-supplied sign table; the default invents no scheme.
    o2_node_dignity_mode: str = "disabled"
    o2_node_dignity_source: str = ""
    o2_rahu_favourable_rasis: tuple[int, ...] = ()
    o2_ketu_favourable_rasis: tuple[int, ...] = ()
    #: O-3 — Rahu–Ketu in one chart balanced by Sevvai in the other. Off.
    o3_cross_samyam: bool = False
    #: O-4 / O-14 — a kendra/trikona lord that also owns the 12th. "contextual"
    #: (v1.3 default: never downgraded for the 12th alone) or "moolatrikona"
    #: (the 2026-09-23 ruling's test, which downgrades three such lords).
    o4_twelfth_colord_mode: str = "contextual"
    #: O-5 — Gaja Kesari base form with a neecha-bhanga Guru: "graded" (one
    #: rung lower) or "suppressed". Read by `detect_gaja_kesari`.
    o5_gk_base_nb_guru: str = "graded"
    #: O-6 — Sevvai for Kadagam/Simmam lagna. "strong_mitigation" (v1.3 interim)
    #: or "full_exemption" (switchable without recomputation: the marker
    #: `tamil_sevvai_exception_cancer_leo` is always recorded).
    o6_sevvai_cancer_leo: str = "strong_mitigation"
    #: O-7 — Neecha bhanga by Navamsa strength (NB-f). Excluded.
    o7_nb_navamsa: bool = False
    #: O-8 — the balāḍhya threshold for the lagna lord (DD-02 strength model).
    o8_lagna_lord_threshold: int = 60
    #: O-10 — NB-g reference point. "lagna" or "lagna_or_moon".
    o10_nbg_reference: str = "lagna"
    #: O-11: separate Phaladeepika Ch. 7 candidate. Non-combust is the
    #: engine's explicit proxy for the verse's "bright rays" wording.
    o11_retrograde_debilitated_raja_yoga: bool = False
    #: O-12 — two neecha-bhanga conditions the engine shipped that DD-09's
    #: Phaladeepika table does not contain: the planet that *exalts* in the
    #: debilitation sign in a kendra, and the debilitated planet aspected by the
    #: lord of its *exaltation* sign. Off until a text is cited for each.
    o12_nb_unlisted_conditions: bool = False
    #: O-13 — every Phaladeepika 7.26–30 rule is treated as stating a raja-yoga
    #: result (chapter 7 is the raja-yoga chapter). False would report the
    #: bhanga without the raja-yoga name.
    o13_nb_verses_give_raja_yoga: bool = True
    #: O-13, owner ruling 2026-10-03: the raja-yoga *name* needs this many
    #: distinct conditions (`NeechaBhangaEvaluation.grade_points`). Below it, a
    #: cancelled debility is reported as நீச நிவர்த்தி (`NEECHA_NIVARTHI`).
    #: Cancellation itself still needs only one condition (DD-09). 1 restores
    #: the v1.6 behaviour.
    o13_nb_raja_min_points: int = 2
    #: O-15 — Raja Yoga link by a one-way special aspect (audit L-3). DD-07 says
    #: "mutual aspect"; off until ruled.
    o15_raja_one_way_aspect: bool = False
    #: O-16 — the Moon as a *secondary* activator for Sunapha/Anapha/Durudhura/
    #: Adhi (DD-15) against the 2026-09-23 ruling that Chandran is the
    #: reference point, not a trigger. v1.3 table applies until ruled.
    o16_moon_secondary_activator: bool = True
    #: O-17: keep the literal narrow fallback, or label all well-placed
    #: 9th-lord cases that fall short of full Lakshmi Yoga.
    o17_bhagya_support_scope: str = "literal"
    #: O-18: full cancellation (shipped until v1.6) or strong mitigation. Owner
    #: ruling 2026-10-03: strong mitigation — a false "no dosham" is the
    #: costlier error in a marriage reading. Vinaadi's deliberate divergence
    #: from the popular Tamil list, which treats aatchi/ucham as nivarthi.
    o18_aries_scorpio_sevvai: str = "strong_mitigation"
    #: O-19 — NB-a/NB-b/NB-g when the lord in question *is* the Moon (Sevvai
    #: debilitated in Kadagam; Guru, who exalts in Kadagam). "In a kendra from
    #: the Moon" then always holds, so a literal reading cancels every such
    #: debility. True keeps the literal reading (the shipped behaviour); False
    #: skips the Moon reference for the Moon itself.
    o19_nb_moon_self_reference: bool = True
    #: O-20 — whether a malefic aspect to a forming Adhi benefic counts as the
    #: raja-grade form's "serious malefic affliction". Off: occupants only in
    #: the 6th/7th/8th from Moon are disqualifying.
    o20_adhi_raja_malefic_aspects: bool = False
    #: O-21 — Budhan is the lord of its own exaltation sign (Kanni). Read
    #: literally, NB-b / NB-c / NB-g then test the debilitated Budhan's own
    #: position, which is NB-e — the rule DD-09 deleted. Owner ruling
    #: 2026-10-03: True — the literal reading counts, but every rule that fires
    #: only through the self-reference is tagged `nb_self_reference` and those
    #: rules alone can never lift the grade to STRONG. False skips them (v1.6).
    o21_nb_planet_as_own_lord: bool = True
    #: O-22 — strict Gaja Kesari's "joined or aspected by a benefic": may the
    #: waxing Moon, one of the two forming grahas, be that benefic? True keeps
    #: DD-01/DD-12 literally; False requires a benefic other than the Moon.
    #: Owner ruling 2026-10-03: True. The Moon counts only when it is benefic
    #: (waxing, DD-12) and conjunct or opposite Guru — the detector's
    #: same-rasi-or-aspect test already refuses a Moon in the 4th/10th.
    o22_gk_moon_as_support: bool = True
    #: O-23 — a kendra/trikona lord that also owns a dusthana or upachaya
    #: house. Owner ruling 2026-10-03: "moolatrikona_3_6_8_11" — the 2026-09-23
    #: moolatrikona test applied to 3rd/6th/8th/11th co-lords. Besides the four
    #: 6th/8th cases (Kadagam Guru and Sani, Kanni Sani, Kumbam Budhan; Kadagam
    #: Guru is re-admitted by `o23_lineage_exceptions`) it
    #: excludes Mesham Sani (10+11), Simmam Sukran (3+10) and Kumbam Sevvai
    #: (3+10). "moolatrikona" is the 6th/8th-only test (v1.6); "lordship_only"
    #: lets the lordship decide and leaves the 6th/8th to the MIXED grade.
    o23_six_eight_colord_mode: str = "moolatrikona_3_6_8_11"
    #: O-23 lineage exceptions (owner ruling 2026-10-03, v1.8):
    #: `functional_status.RAJA_LINEAGE_EXCEPTIONS` re-admits a named lord that
    #: the moolatrikona test would exclude. Today one row, Kadagam Guru (6+9):
    #: it takes part as the 9th lord and grades MIXED by its 6th. False keeps
    #: the test with no exception (v1.7).
    o23_lineage_exceptions: bool = True
    #: O-24 — kendradhipati for a natural benefic owning two kendras (Guru for
    #: Mithunam/Kanni, Budhan for Dhanusu/Meenam). Owner ruling 2026-10-03
    #: (v1.8): "mixed". Kendradhipati is a grade modifier, not an eligibility
    #: veto: the lord takes part and the pair grades MIXED_KENDRADHIPATI; pair
    #: vetoes still apply. BPHS 34's Dhanus paragraph names Surya + Budhan as
    #: yoga-giving, which "exclude" would contradict. Provisional Tier A until
    #: the printed edition is checked (§18).
    o24_kendradhipati_two_kendras: str = "mixed"
    #: O-26 — Sevvai: "Mars's sign lord in a kendra/trikona *from Mars*" as a
    #: mitigation. It came from an internal design note (docs/SEVVAIRAGU.MD
    #: §6.7), not from a cited text, and on a real chart it alone decided
    #: nivarthi versus a strong active dosham. Ruling 2026-10-06 (DD-17): "off"
    #: until a printed source is produced. "from_mars" restores v2.0.
    o26_sevvai_dispositor_mitigation: str = "off"
    #: O-27 — Sevvai: what makes the 7th lord "strong" enough to protect.
    #: Ruling 2026-10-06 (DD-17): "dignity_or_kendra_trikona" — own sign,
    #: exaltation, or a kendra/trikona from the Lagna; not joined by Sevvai,
    #: Sani, Rahu or Ketu; not combust. The same test the Rahu–Ketu axis already
    #: applies to the 7th lord, so one chart has one answer to "is the 7th lord
    #: strong". "kendra_functional_benefic" restores v2.0, which ignored dignity.
    o27_sevvai_seventh_lord_strength: str = "dignity_or_kendra_trikona"
    #: O-28 — Rahu–Ketu 2/8 axis: the node in the 2nd (kudumba sthana) is
    #: weighed by the 2nd house's own support. "dignity": the 2nd lord in its
    #: own or exaltation sign, unafflicted, not combust. "strong_or_benefic":
    #: the 8th side's broader test (any kendra/trikona placement, or a benefic
    #: on the house). "off" restores v2.0 (8th side only). See DD-17 for the
    #: measured choice.
    o28_rk_second_house_support: str = "dignity"
    #: O-29 — Rahu–Ketu: one Guru aspect counted once. On the 2/8 axis a node
    #: sits in the 8th, so Guru aspecting it fired both
    #: `guru_joins_or_aspects_node` and the benefic-on-the-8th mitigation.
    #: Ruling 2026-10-06 (DD-17): True — Guru's influence on a node's house is
    #: its own mitigation, so the house-support tests read the other benefics.
    #: False restores v2.0's double count.
    o29_rk_guru_counted_once: bool = True
    #: O-32 — Putra Sarpa, Thulam lagna, Sani in Kumbam (its own 5th). Sani is
    #: the 5th lord, in its own sign, and yogakaraka (4th + 5th) for Thulam.
    #: Owner ruling 2026-10-06: "neutralized" — the placement is recorded but
    #: does not form the dosham; any independent affliction (a node in the 5th
    #: or beside Guru) still does. Deliberately this one case, not "own sign
    #: always cancels". "ordinary" counts it as any Sani in the 5th.
    o32_putra_sarpa_thulam_sani: str = "neutralized"
    #: DD-12 legacy: Moon benefic only beyond 72° of elongation. Off by default.
    moon_72_degree_convention: bool = False
    #: DD-02 — show the Phaladeepika Lakshmi variant in the consumer UI. Off.
    show_lakshmi_phaladeepika: bool = False


DEFAULT_DOCTRINE = DoctrineOptions()

_STRING_CHOICES: dict[str, frozenset[str]] = {
    "o2_node_dignity_mode": frozenset({"disabled", "explicit_signs"}),
    "o4_twelfth_colord_mode": frozenset({"contextual", "moolatrikona"}),
    "o5_gk_base_nb_guru": frozenset({"graded", "suppressed"}),
    "o6_sevvai_cancer_leo": frozenset({"strong_mitigation", "full_exemption"}),
    "o10_nbg_reference": frozenset({"lagna", "lagna_or_moon"}),
    "o17_bhagya_support_scope": frozenset({"literal", "all_incomplete_lakshmi"}),
    "o18_aries_scorpio_sevvai": frozenset({"full_cancellation", "strong_mitigation"}),
    "o23_six_eight_colord_mode": frozenset({"moolatrikona_3_6_8_11", "moolatrikona", "lordship_only"}),
    "o24_kendradhipati_two_kendras": frozenset({"mixed", "exclude"}),
    "o26_sevvai_dispositor_mitigation": frozenset({"off", "from_mars"}),
    "o27_sevvai_seventh_lord_strength": frozenset({"dignity_or_kendra_trikona", "kendra_functional_benefic"}),
    "o28_rk_second_house_support": frozenset({"dignity", "strong_or_benefic", "off"}),
    "o32_putra_sarpa_thulam_sani": frozenset({"neutralized", "ordinary"}),
}


def validated(options: DoctrineOptions) -> DoctrineOptions:
    """Reject a value no detector implements, rather than silently ignoring it.

    An admin typo in a string flag would otherwise run the engine on a branch
    nobody chose. Raising here surfaces it at the first chart build.
    """
    for field_name, choices in _STRING_CHOICES.items():
        value = getattr(options, field_name)
        if value not in choices:
            raise ValueError(f"{field_name}={value!r}; expected one of {sorted(choices)}")
    if not 0 <= options.o8_lagna_lord_threshold <= 100:
        raise ValueError(f"o8_lagna_lord_threshold={options.o8_lagna_lord_threshold} is outside 0-100")
    if not 1 <= options.o13_nb_raja_min_points <= 3:
        raise ValueError(f"o13_nb_raja_min_points={options.o13_nb_raja_min_points} is outside 1-3")
    for field_name in ("o2_rahu_favourable_rasis", "o2_ketu_favourable_rasis"):
        rasis = getattr(options, field_name)
        if any(not isinstance(rasi, int) or isinstance(rasi, bool) or not 1 <= rasi <= 12 for rasi in rasis):
            raise ValueError(f"{field_name}={rasis!r}; every rasi must be an integer from 1 to 12")
    if options.o2_node_dignity_mode == "explicit_signs":
        if not options.o2_node_dignity_source.strip():
            raise ValueError("o2_node_dignity_source is required when O-2 explicit signs are enabled")
        if not options.o2_rahu_favourable_rasis and not options.o2_ketu_favourable_rasis:
            raise ValueError("O-2 explicit signs require at least one favourable rasi")
    return options


@dataclass(frozen=True, slots=True)
class OpenItem:
    """One §16 row, as the engine carries it."""

    item_id: str
    question: str
    default: str
    #: FLAGGED — a `DoctrineOptions` field and an admin flag switch it.
    #: NOT_IMPLEMENTED — the default is "not implemented"; nothing to switch.
    #: UNFROZEN — a sign-off state, not a behaviour switch.
    status: str
    #: The `DoctrineOptions` field, or "" when there is none.
    option: str = ""
    #: Where it bites, or why nothing reads it yet.
    consumer: str = ""


OPEN_ITEMS: tuple[OpenItem, ...] = (
    OpenItem("O-1", "Rahu–Ketu: include from-Moon / from-Venus checks?", "Secondary, severity only",
             "FLAGGED", "o1_rk_moon_venus_secondary", "_yoga_dosham.detect_rahu_ketu_dosham"),
    OpenItem("O-2", "Node-dignity lineage (favourable signs for Rahu/Ketu)?", "Disabled; no sign list assumed",
             "FLAGGED", "o2_node_dignity_mode", "_yoga_dosham.detect_rahu_ketu_dosham"),
    OpenItem("O-3", "Cross-samyam between Rahu–Ketu and Sevvai?", "Astrologer view only, off",
             "FLAGGED", "o3_cross_samyam", "dosha_samyam.compare_marriage_doshams"),
    OpenItem("O-4", "12th co-lordship in the functional-status matrix", "CONTEXTUAL_12TH, never downgraded for the 12th alone",
             "FLAGGED", "o4_twelfth_colord_mode", "functional_status.raja_participation"),
    OpenItem("O-5", "Gaja Kesari base with neecha-bhanga Guru: graded or suppressed?", "Graded",
             "FLAGGED", "o5_gk_base_nb_guru", "_yoga_detect.detect_gaja_kesari"),
    OpenItem("O-6", "Sevvai Kadagam/Simmam: universal exemption or limited?", "Strong mitigation, never full erasure",
             "FLAGGED", "o6_sevvai_cancer_leo", "_yoga_dosham.detect_sevvai_dosham"),
    OpenItem("O-7", "Neecha bhanga in navamsa (NB-f)?", "Excluded",
             "FLAGGED", "o7_nb_navamsa", "neecha_bhanga.evaluate_neecha_bhanga"),
    OpenItem("O-8", "Lagna-lord strength threshold and penalty sizes", "60",
             "FLAGGED", "o8_lagna_lord_threshold", "lagna_lord_strength.is_baladhya"),
    OpenItem("O-9", "Sign-off of the 12 × 7 functional-status matrix and node rules", "Matrix built, unsigned",
             "UNFROZEN", "", "functional_status.MATRIX_SIGNED_OFF"),
    OpenItem("O-10", "NB-g: kendra from Lagna only, or Lagna/Moon?", "Lagna",
             "FLAGGED", "o10_nbg_reference", "neecha_bhanga.evaluate_neecha_bhanga"),
    OpenItem("O-11", "Adopt the retrograde-debilitated-planet raja yoga (Phaladeepika Ch 7)?", "Separate detector off",
             "FLAGGED", "o11_retrograde_debilitated_raja_yoga", "_yoga_detect.detect_retrograde_debilitated_raja_yoga"),
    OpenItem("O-12", "Two shipped neecha-bhanga conditions are not in DD-09's table", "Excluded",
             "FLAGGED", "o12_nb_unlisted_conditions", "neecha_bhanga.evaluate_neecha_bhanga"),
    OpenItem("O-13", "Does each Phaladeepika 7.26–30 verse state a raja-yoga result?",
             "Yes; owner ruling 2026-10-03: the raja-yoga name needs two or more distinct conditions, "
             "one condition reads நீச நிவர்த்தி",
             "FLAGGED", "o13_nb_verses_give_raja_yoga", "_yoga_detect.detect_neecha_bhanga"),
    OpenItem("O-14", "2026-09-23 moolatrikona ruling vs O-4 for three 12th co-lords", "O-4 (v1.3) governs",
             "FLAGGED", "o4_twelfth_colord_mode", "functional_status.raja_participation"),
    OpenItem("O-15", "Raja Yoga link: mutual aspect (DD-07) or one-way special aspect (audit L-3)?", "Mutual only",
             "FLAGGED", "o15_raja_one_way_aspect", "_yoga_detect.detect_raja_yoga"),
    OpenItem("O-16", "Moon as secondary activator (DD-15) vs 2026-09-23 'Chandran is not a trigger'", "DD-15 table applies",
             "FLAGGED", "o16_moon_secondary_activator", "yoga_rules activation table"),
    OpenItem("O-17", "BHAGYA_SUPPORT leaves two cases unlabelled", "Literal DD-02 text; neither case labelled",
             "FLAGGED", "o17_bhagya_support_scope", "_yoga_detect.detect_bhagya_support"),
    OpenItem("O-18", "Mesham/Viruchigam lagna Sevvai exemption still cancels outright",
             "Owner ruling 2026-10-03: strong mitigation (deliberate divergence from the popular list)",
             "FLAGGED", "o18_aries_scorpio_sevvai", "_yoga_dosham.detect_sevvai_dosham"),
    OpenItem("O-19", "NB-a/NB-b 'kendra from the Moon' when the lord is the Moon itself (always true)",
             "Literal reading kept: every debilitated Sevvai, and Guru, is cancelled",
             "FLAGGED", "o19_nb_moon_self_reference", "neecha_bhanga.evaluate_neecha_bhanga"),
    OpenItem("O-20", "Adhi raja-grade: do malefic aspects count as serious affliction?",
             "No — occupants in the 6th/7th/8th from Moon only",
             "FLAGGED", "o20_adhi_raja_malefic_aspects", "_yoga_detect.detect_adhi_raja_grade"),
    OpenItem("O-21", "NB-b/NB-c/NB-g for Budhan, the lord of its own exaltation sign (re-creates NB-e)",
             "Owner ruling 2026-10-03: counted, tagged nb_self_reference, never STRONG on its own",
             "FLAGGED", "o21_nb_planet_as_own_lord", "neecha_bhanga.evaluate_neecha_bhanga"),
    OpenItem("O-22", "Strict Gaja Kesari: may the waxing Moon be the supporting benefic?",
             "Owner ruling 2026-10-03: yes, when benefic and conjunct or opposite Guru (never from the 4th/10th)",
             "FLAGGED", "o22_gk_moon_as_support", "_yoga_detect.detect_gaja_kesari_parashara"),
    OpenItem("O-23", "Co-lords in Raja Yoga: moolatrikona test vs DD-07 lordship",
             "Owner ruling 2026-10-03: moolatrikona test extended to 3rd/6th/8th/11th co-lords; "
             "Kadagam Guru re-admitted as a named exception, graded MIXED (o23_lineage_exceptions)",
             "FLAGGED", "o23_six_eight_colord_mode", "functional_status.raja_participation"),
    OpenItem("O-24", "Kendradhipati: a natural benefic owning two kendras in Raja Yoga — mixed or excluded?",
             "Owner ruling 2026-10-03: mixed (MIXED_KENDRADHIPATI grade); a grade modifier, never an "
             "eligibility veto; BPHS 34's Dhanus Surya-Budhan pair stays yoga-giving",
             "FLAGGED", "o24_kendradhipati_two_kendras", "functional_status.raja_participation"),
    OpenItem("O-26", "Sevvai: does Mars's sign lord in a kendra/trikona from Mars mitigate?",
             "Ruling 2026-10-06 (DD-17): off — no printed source; it came from an internal design note",
             "FLAGGED", "o26_sevvai_dispositor_mitigation", "_yoga_dosham.detect_sevvai_dosham"),
    OpenItem("O-27", "Sevvai: does a dignified 7th lord protect, or only a 7th lord in a kendra?",
             "Ruling 2026-10-06 (DD-17): own/exalted or kendra/trikona, unafflicted, not combust "
             "(the Rahu–Ketu 7th-lord test)",
             "FLAGGED", "o27_sevvai_seventh_lord_strength", "_yoga_dosham.detect_sevvai_dosham"),
    OpenItem("O-28", "Rahu–Ketu 2/8: is the 2nd house's support read, as the 8th's is?",
             "Ruling 2026-10-06 (DD-17): yes, by the 2nd lord's dignity (own/exalted, unafflicted, not combust)",
             "FLAGGED", "o28_rk_second_house_support", "_yoga_dosham.detect_rahu_ketu_dosham"),
    OpenItem("O-29", "Rahu–Ketu: may one Guru aspect count both as Guru-on-node and as benefic-on-house?",
             "Ruling 2026-10-06 (DD-17): no — counted once",
             "FLAGGED", "o29_rk_guru_counted_once", "_yoga_dosham.detect_rahu_ketu_dosham"),
    OpenItem("O-32", "Putra Sarpa: does Sani in its own 5th (Kumbam, Thulam lagna) form the dosham?",
             "Owner ruling 2026-10-06: neutralized — recorded, not formed, unless another affliction "
             "touches the 5th, its lord or Guru; this case only, not a blanket own-sign rule",
             "FLAGGED", "o32_putra_sarpa_thulam_sani", "_yoga_dosham.detect_putra_sarpa_dosham"),
)

OPEN_ITEM_BY_ID: dict[str, OpenItem] = {item.item_id: item for item in OPEN_ITEMS}
