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
    #: O-18: retain the shipped full cancellation, or use strong mitigation.
    o18_aries_scorpio_sevvai: str = "full_cancellation"
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
    #: position, which is NB-e — the rule DD-09 deleted. False (default, DD-09
    #: governs) skips the self-reference; True keeps the literal reading.
    o21_nb_planet_as_own_lord: bool = False
    #: O-22 — strict Gaja Kesari's "joined or aspected by a benefic": may the
    #: waxing Moon, one of the two forming grahas, be that benefic? True keeps
    #: DD-01/DD-12 literally; False requires a benefic other than the Moon.
    o22_gk_moon_as_support: bool = True
    #: O-23 — a kendra/trikona lord that also owns the 6th or 8th. The
    #: 2026-09-23 ruling's moolatrikona test ("moolatrikona", shipped) excludes
    #: Kadagam Guru (6+9) and Sani (7+8), Kanni Sani (5+6) and Kumbam Budhan
    #: (5+8) from every Raja Yoga. "lordship_only" lets the lordship decide
    #: eligibility and leaves the 6th/8th to the MIXED grade, as O-4 does for
    #: the 12th.
    o23_six_eight_colord_mode: str = "moolatrikona"
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
    "o23_six_eight_colord_mode": frozenset({"moolatrikona", "lordship_only"}),
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
    OpenItem("O-13", "Does each Phaladeepika 7.26–30 verse state a raja-yoga result?", "Yes — card keeps its raja-yoga name",
             "FLAGGED", "o13_nb_verses_give_raja_yoga", "neecha_bhanga.evaluate_neecha_bhanga"),
    OpenItem("O-14", "2026-09-23 moolatrikona ruling vs O-4 for three 12th co-lords", "O-4 (v1.3) governs",
             "FLAGGED", "o4_twelfth_colord_mode", "functional_status.raja_participation"),
    OpenItem("O-15", "Raja Yoga link: mutual aspect (DD-07) or one-way special aspect (audit L-3)?", "Mutual only",
             "FLAGGED", "o15_raja_one_way_aspect", "_yoga_detect.detect_raja_yoga"),
    OpenItem("O-16", "Moon as secondary activator (DD-15) vs 2026-09-23 'Chandran is not a trigger'", "DD-15 table applies",
             "FLAGGED", "o16_moon_secondary_activator", "yoga_rules activation table"),
    OpenItem("O-17", "BHAGYA_SUPPORT leaves two cases unlabelled", "Literal DD-02 text; neither case labelled",
             "FLAGGED", "o17_bhagya_support_scope", "_yoga_detect.detect_bhagya_support"),
    OpenItem("O-18", "Mesham/Viruchigam lagna Sevvai exemption still cancels outright", "Full cancellation (shipped behaviour)",
             "FLAGGED", "o18_aries_scorpio_sevvai", "_yoga_dosham.detect_sevvai_dosham"),
    OpenItem("O-19", "NB-a/NB-b 'kendra from the Moon' when the lord is the Moon itself (always true)",
             "Literal reading kept: every debilitated Sevvai, and Guru, is cancelled",
             "FLAGGED", "o19_nb_moon_self_reference", "neecha_bhanga.evaluate_neecha_bhanga"),
    OpenItem("O-20", "Adhi raja-grade: do malefic aspects count as serious affliction?",
             "No — occupants in the 6th/7th/8th from Moon only",
             "FLAGGED", "o20_adhi_raja_malefic_aspects", "_yoga_detect.detect_adhi_raja_grade"),
    OpenItem("O-21", "NB-b/NB-c/NB-g for Budhan, the lord of its own exaltation sign (re-creates NB-e)",
             "Self-reference skipped (DD-09 deleted NB-e)",
             "FLAGGED", "o21_nb_planet_as_own_lord", "neecha_bhanga.evaluate_neecha_bhanga"),
    OpenItem("O-22", "Strict Gaja Kesari: may the waxing Moon be the supporting benefic?",
             "Yes — literal DD-01/DD-12",
             "FLAGGED", "o22_gk_moon_as_support", "_yoga_detect.detect_gaja_kesari_parashara"),
    OpenItem("O-23", "6th/8th co-lords in Raja Yoga: 2026-09-23 moolatrikona test vs DD-07 lordship",
             "Moolatrikona test (2026-09-23 ruling, shipped)",
             "FLAGGED", "o23_six_eight_colord_mode", "functional_status.raja_participation"),
)

OPEN_ITEM_BY_ID: dict[str, OpenItem] = {item.item_id: item for item in OPEN_ITEMS}
