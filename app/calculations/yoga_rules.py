"""Per-yoga rule registry — one auditable row per yoga definition.

Why this module exists
----------------------
Until 2026-08-27 every yoga in the engine sat behind a single rulebook ID,
``YOG-01``. Twenty detector functions, thirty emitted yoga codes and at least
two independent Raja Yoga formulations took one verdict between them, and the
reviewing astrologer refused to sign that block:

    "Twenty independent definitions cannot take one verdict, and 'Raja Yoga'
    alone has several legitimate classical formulations plus a great many loose
    modern ones. Do not read a blanket approval into this row."

This registry is the split. Every rule below carries its own ID, its own
presence test, its own strength ladder, its own cancellation rules and its own
marker, so each can be marked Correct / Incorrect / Incomplete / Variant on its
own. **The conditions were not invented here** — they are lifted verbatim from
the detector that evaluates them, and `tests/test_yoga_rules.py` pins the
registry to the emitted codes so a new yoga cannot ship without a row.

What a marker means (same vocabulary as the external-review rulebook)
---------------------------------------------------------------------
``TRADITION``      an implemented traditional rule, suitable for source checking
``VARIANT``        a real practice, but one that differs by school; we picked one
``PRODUCT``        Vinaadi arithmetic — a threshold, a grading, a cut-off
``TAMIL_LINEAGE``  lineage practice with no printed derivation
``LIMIT``          present but simplified, or deliberately not used

Two markers on one row is deliberate: most of these are a traditional principle
wrapped in a Vinaadi grading, and a bare ``TRADITION`` would claim source
authority for our own rungs.

Scoring reach of this whole block
---------------------------------
Every yoga here reaches the reader as a card carrying a strength band, the
``conditions_met`` list, and an activation score 0-100 from
``yoga_activation.yoga_activation_score``. Yogas feed the life-area and
prediction layers through that activation score. The nakshatra cautions
(``YOG-NKC-*``) are the one exception and are display-only.

``key_planets`` is the activation table, held here rather than in
``yoga_activation`` so the graha list a reviewer reads is the graha list the
score uses. An empty tuple means **no activation key planets are defined**, and
that yoga's activation score is therefore permanently capped at the dormant
rung (``round(strength_base * 0.45)``) no matter which dasha runs. That is
disclosed per row rather than hidden, because it is a live behaviour a reviewer
should rule on.

The ``dasha_activated`` flag on a card is a **separate** computation from the
activation score, and the two can disagree on one chart. The detectors for
Sakata, Kemadruma, Kartari, Chandala, Daridra, Lakshmi, Sunapha/Anapha/
Durudhura and Vasumati hardcode it to ``False`` whatever dasha is running; Amala
and Adhi set it from the *functional nature* of a benefic rather than from any
dasha at all. Both are disclosed on the rows concerned and left for a verdict.
"""
from __future__ import annotations

from dataclasses import dataclass

#: Markers legal in :attr:`YogaRule.markers`. Kept in step with the rulebook's
#: own marker table; `tests/test_yoga_rules.py` rejects anything else.
LEGAL_MARKERS = frozenset({"TRADITION", "VARIANT", "PRODUCT", "TAMIL_LINEAGE", "LIMIT"})

#: The retired blanket ID. Kept as a string so both documents and the tests can
#: refer to it without hardcoding the literal in five places.
RETIRED_BLANKET_RULE_ID = "YOG-01"


@dataclass(frozen=True, slots=True)
class YogaRule:
    """One yoga definition, stated the way a reviewer has to be able to mark it."""

    rule_id: str
    #: The ``YogaResult.name`` this rule produces. Empty for a row that records
    #: something the engine deliberately does **not** detect.
    yoga_name: str
    name_en: str
    name_ta: str
    markers: tuple[str, ...]
    #: ``module.function`` that evaluates the rule.
    detector: str
    #: The presence test, exactly as coded.
    present_when: str
    #: How STRONG / PARTIAL / WEAK is decided once present.
    strength_rule: str
    #: Bhanga, gating and mitigation. "—" when the rule has none.
    cancellation: str
    #: Chapter-level citation, or a plain statement that no printed source is
    #: claimed. Never a page number from memory.
    source: str
    #: Grahas whose maha/antar dasha activates this yoga in the activation
    #: score. Empty tuple = dormant-capped; see the module docstring.
    key_planets: tuple[str, ...] = ()
    #: The school choice, the departure from the classical form, or the thing a
    #: reviewer would otherwise have to read the source to discover.
    note: str = ""


# --------------------------------------------------------------------------- #
# Shared note fragments, so the same disclosure cannot drift between two rows.
# --------------------------------------------------------------------------- #
_GATE_NOTE = (
    "Strength is then lowered one rung per condition by "
    "`_yoga_helpers.gate_yoga_strength` — a key graha's composite natal score "
    "below 45, or a key graha combust — and floored at PARTIAL, so a gate never "
    "hides a formed yoga."
)

_PMP_NOTE = (
    "Kendra is counted from the **Lagna only**; schools that also count from "
    "Chandran would report more of these. The Moolatrikona clause tests the sign "
    "(`MOOLATRIKONA_ZONE[graha][0]`), not the degree band — which changes nothing "
    "for these five, because each of their Moolatrikona signs is also one of "
    "their own signs (Chevvai Mesham, Budhan Kanni, Guru Dhanusu, Sukran Thulam, "
    "Sani Kumbam), so the own-sign clause already catches every such placement. "
    "All three dignity clauses are recorded separately in `conditions_met`."
)

_BENEFIC_SET_NOTE = (
    "The natural-benefic set is Guru, Sukran, Budhan and Chandran, applied "
    "unconditionally: there is no waxing/waning test on Chandran and no "
    "association test on Budhan, both of which classical texts use to move a "
    "graha between the sets."
)


YOGA_RULES: tuple[YogaRule, ...] = (
    # ── Gaja Kesari ──────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-GK-01",
        yoga_name="GAJA_KESARI_YOGA",
        name_en="Gaja Kesari Yoga",
        name_ta="கஜகேசரி யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_gaja_kesari",
        present_when=(
            "Guru occupies a kendra (1/4/7/10) counted from **Chandran's** rasi, "
            "whole sign."
        ),
        strength_rule="STRONG on formation, then gated over Guru and Chandran.",
        cancellation=(
            "None that removes the yoga. Dignity and combustion lower the reported "
            "strength, never presence."
        ),
        source="Yoga chapters of BPHS and Phaladeepika; kendra-from-Chandran is the standard form.",
        key_planets=("JUPITER", "MOON"),
        note=(
            "Presence is counted from Chandran only. Texts that additionally "
            "require Guru to be free of debilitation or combustion are honoured "
            f"as a strength downgrade rather than as absence — a declared choice. {_GATE_NOTE}"
        ),
    ),
    # ── Raja Yoga — the block the reviewer named ─────────────────────────────
    YogaRule(
        rule_id="YOG-RY-01",
        yoga_name="RAJA_YOGA",
        name_en="Raja Yoga — trikona/kendra lord association",
        name_ta="ராஜ யோகம் — இணைப்பு",
        markers=("VARIANT", "PRODUCT"),
        detector="_yoga_detect.detect_raja_yoga",
        present_when=(
            "For every pair of a trikona lord (of 1/5/9) and a kendra lord (of "
            "1/4/7/10) that are different grahas: the two share a rasi, **or** the "
            "trikona lord casts a drishti on the kendra lord's rasi, **or** the "
            "kendra lord casts a drishti on the trikona lord's rasi. Parashari "
            "aspects including the special 4/8, 5/9 and 3/10 (`CORE-11`); the "
            "either-direction test exists because the special aspects are "
            "asymmetric (audit L-3)."
        ),
        strength_rule=(
            "STRONG per firing pair, gated over that pair's two lords. The chart "
            "card is the merge of every pair — best strength, union of conditions, "
            "activated if any pair is activated."
        ),
        cancellation="—",
        source=(
            "Parashari trikona-kendra sambandha, BPHS raja yoga chapters. The "
            "association reading is one of several live formulations, not the only one."
        ),
        key_planets=("SUN", "MOON", "MARS", "JUPITER"),
        note=(
            "**This is the formulation choice the reviewer asked to see.** At "
            "least four are in live Tamil use: (a) association of a trikona and a "
            "kendra lord — implemented here; (b) mutual exchange between them — "
            "`YOG-RY-02`; (c) a single graha owning both a kendra and a trikona "
            "acting as yogakaraka on its own; (d) the strict Dharma-Karmadhipati "
            "reading, 9th lord with 10th lord only. Vinaadi implements (a) and "
            "(b). Because every lagna has one lord shared between the two sets, "
            "the association test is generous: it iterates all trikona × kendra "
            "pairs and one hit forms the yoga. "
            "**`key_planets` here is a `[PRODUCT]` approximation** — the true key "
            "grahas are the specific lords that linked, which are lagna-dependent, "
            "and the activation table cannot express that. `dasha_activated` on the "
            "same card *is* computed from the real lords, so the two can disagree."
        ),
    ),
    YogaRule(
        rule_id="YOG-RY-02",
        yoga_name="RAJA_YOGA",
        name_en="Raja Yoga — trikona/kendra lord exchange",
        name_ta="ராஜ யோகம் — பரிவர்தனம்",
        markers=("VARIANT",),
        detector="yogas.detect_yogas_and_doshams",
        present_when=(
            "A MAHA-grade sign exchange (`YOG-PV-01`) whose two grahas are one "
            "kendra lord and one trikona lord, in either order. Recorded as "
            "`<a>_<b>_parivartana_link`."
        ),
        strength_rule="STRONG, flat.",
        cancellation="—",
        source="Parivartana raja yoga, standard in the Tamil commentaries on the exchange yogas.",
        key_planets=(),
        note=(
            "Merges into the same `RAJA_YOGA` card as `YOG-RY-01`. **This path is "
            "not strength-gated** while `YOG-RY-01` is — a combust or badly placed "
            "pair still reports STRONG here. That asymmetry is disclosed rather "
            "than quietly evened out, because evening it out is a doctrine call."
        ),
    ),
    YogaRule(
        rule_id="YOG-RY-03",
        yoga_name="",
        name_en="Raja Yoga — formulations deliberately not implemented",
        name_ta="",
        markers=("LIMIT",),
        detector="—",
        present_when="Never fires. This row records what the engine does *not* detect.",
        strength_rule="—",
        cancellation="—",
        source="—",
        key_planets=(),
        note=(
            "Not reported by Vinaadi under any name: (a) a yogakaraka graha owning "
            "both a kendra and a trikona forming raja yoga by itself, with no "
            "second lord involved; (b) the two lords merely occupying kendras from "
            "each other, without conjunction, drishti or exchange; (c) raja yogas "
            "read from the Navamsa or from Chandra lagna rather than from the "
            "Lagna; (d) Dharma-Karmadhipati as a **separately named** yoga — the "
            "9th/10th pair does form `YOG-RY-01`, but it is never distinguished "
            "from any other trikona-kendra link on the card. Neecha Bhanga and "
            "Vipareetha raja yogas are detected, under their own IDs."
        ),
    ),
    # ── Dhana ────────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-DN-01",
        yoga_name="DHANA_YOGA",
        name_en="Dhana Yoga",
        name_ta="தன யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_dhana_yoga",
        present_when=(
            "Any one of three conditions on the 2nd and 11th lords: they share a "
            "rasi (`second_eleventh_conjunction`); each occupies the sign the "
            "other rules (`second_eleventh_exchange`); or **both** stand in a "
            "kendra or a trikona (`both_lords_in_strong_houses`)."
        ),
        strength_rule=(
            "STRONG if the conjunction or the exchange fired; PARTIAL if only the "
            "both-in-strong-houses condition fired. Then gated over the two lords."
        ),
        cancellation="—",
        source="The 2nd/11th dhana formulation of the BPHS dhana yoga chapter, for the first two conditions only.",
        key_planets=("JUPITER", "VENUS", "MERCURY"),
        note=(
            "**The third condition is not a classical dhana yoga.** It is a "
            "Vinaadi proxy for 'both wealth lords are well placed', and it is much "
            "the commonest of the three, so `DHANA_YOGA` reads present at PARTIAL "
            "on a large share of charts. Two questions for the reviewer: should "
            "that third condition survive at all, and should the classical set "
            "widen to the 5th and 9th lords as most dhana treatments do. "
            "`key_planets` is a `[PRODUCT]` approximation for the same reason as "
            f"`YOG-RY-01`. {_GATE_NOTE}"
        ),
    ),
    # ── Neecha Bhanga ────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-NBR-01",
        yoga_name="NEECHA_BHANGA_RAJA_YOGA",
        name_en="Neecha Bhanga Raja Yoga",
        name_ta="நீசபங்க ராஜ யோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_neecha_bhanga",
        present_when=(
            "A graha stands in its debilitation rasi **and** "
            "`chart_strength.neecha_bhanga_cancelled` returns cancelled. That "
            "predicate tests four classical rules: the lord of the debilitation "
            "sign in a kendra from Lagna or Chandran; the graha that *exalts* in "
            "that sign in a kendra from Lagna or Chandran; the lord of the sign "
            "where this graha exalts casting a drishti on it; and this graha "
            "strong in the Navamsa."
        ),
        strength_rule="PARTIAL when cancelled, WEAK when not. Ungated.",
        cancellation=(
            "Retrogression of the debilitated graha is recorded as a supporting "
            "note only (`debilitated_planet_retrograde_note`) and never forms the "
            "yoga by itself — closing the old lone-retrograde over-detection (G6)."
        ),
        source="BPHS neechabhanga rules; standard Tamil Thirukanitham practice.",
        key_planets=("JUPITER",),
        note=(
            "The cancellation clauses are **not** in the yoga module: "
            "`chart_strength.neecha_bhanga_cancelled` is the single source of "
            "truth, shared with the +14 bhanga term in the strength synthesis, so "
            "the card and the score cannot disagree on one chart (audit C2). "
            "**`key_planets = (JUPITER,)` is wrong on its face** — the key graha is "
            "the debilitated graha, which varies by chart. It is left unchanged "
            "here because correcting it changes a shipped number, and is flagged "
            "for the reviewer's verdict."
        ),
    ),
    # ── Pancha Mahapurusha — five rules, not one ─────────────────────────────
    YogaRule(
        rule_id="YOG-PMP-01",
        yoga_name="RUCHAKA_YOGA",
        name_en="Ruchaka Yoga (Chevvai)",
        name_ta="ருசக யோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_pancha_mahapurusha",
        present_when=(
            "Chevvai stands in its own sign, its exaltation sign or its "
            "Moolatrikona sign, **and** that rasi is a kendra (1/4/7/10) from Lagna."
        ),
        strength_rule="STRONG on formation, gated over Chevvai alone.",
        cancellation="—",
        source="Pancha Mahapurusha chapter, BPHS and Phaladeepika.",
        key_planets=("MARS",),
        note=_PMP_NOTE,
    ),
    YogaRule(
        rule_id="YOG-PMP-02",
        yoga_name="BHADRA_YOGA",
        name_en="Bhadra Yoga (Budhan)",
        name_ta="பத்ர யோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_pancha_mahapurusha",
        present_when=(
            "Budhan stands in its own sign, its exaltation sign or its "
            "Moolatrikona sign, **and** that rasi is a kendra from Lagna."
        ),
        strength_rule="STRONG on formation, gated over Budhan alone.",
        cancellation="—",
        source="Pancha Mahapurusha chapter, BPHS and Phaladeepika.",
        key_planets=("MERCURY",),
        note=_PMP_NOTE,
    ),
    YogaRule(
        rule_id="YOG-PMP-03",
        yoga_name="HAMSA_YOGA",
        name_en="Hamsa Yoga (Guru)",
        name_ta="ஹம்ச யோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_pancha_mahapurusha",
        present_when=(
            "Guru stands in its own sign, its exaltation sign or its Moolatrikona "
            "sign, **and** that rasi is a kendra from Lagna."
        ),
        strength_rule="STRONG on formation, gated over Guru alone.",
        cancellation="—",
        source="Pancha Mahapurusha chapter, BPHS and Phaladeepika.",
        key_planets=("JUPITER",),
        note=_PMP_NOTE,
    ),
    YogaRule(
        rule_id="YOG-PMP-04",
        yoga_name="MALAVYA_YOGA",
        name_en="Malavya Yoga (Sukran)",
        name_ta="மாளவ்ய யோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_pancha_mahapurusha",
        present_when=(
            "Sukran stands in its own sign, its exaltation sign or its "
            "Moolatrikona sign, **and** that rasi is a kendra from Lagna."
        ),
        strength_rule="STRONG on formation, gated over Sukran alone.",
        cancellation="—",
        source="Pancha Mahapurusha chapter, BPHS and Phaladeepika.",
        key_planets=("VENUS",),
        note=_PMP_NOTE,
    ),
    YogaRule(
        rule_id="YOG-PMP-05",
        yoga_name="SASA_YOGA",
        name_en="Sasa Yoga (Sani)",
        name_ta="சஸ யோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_pancha_mahapurusha",
        present_when=(
            "Sani stands in its own sign, its exaltation sign or its Moolatrikona "
            "sign, **and** that rasi is a kendra from Lagna."
        ),
        strength_rule="STRONG on formation, gated over Sani alone.",
        cancellation="—",
        source="Pancha Mahapurusha chapter, BPHS and Phaladeepika.",
        key_planets=("SATURN",),
        note=_PMP_NOTE,
    ),
    # ── Budha Aditya ─────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-BA-01",
        yoga_name="BUDHA_ADITYA_YOGA",
        name_en="Budha Aditya Yoga",
        name_ta="புத ஆதித்ய யோகம்",
        markers=("TRADITION", "VARIANT"),
        detector="_yoga_detect.detect_budha_aditya",
        present_when="Budhan and Suriyan share a rasi.",
        strength_rule=(
            "STRONG when Budhan is not combust; PARTIAL when it is. Reported "
            "present in both cases."
        ),
        cancellation="—",
        source="Standard in the Tamil yoga lists; BPHS treats the Sun-Mercury conjunction under buddhi yogas.",
        key_planets=("SUN", "MERCURY"),
        note=(
            "Whole sign, no degree orb. **Treating a combust Budhan as a partial "
            "yoga rather than as no yoga is a declared school choice**: Budhan "
            "inside its combustion orb of Suriyan is the ordinary state of this "
            "conjunction, and a strict no-combust rule would make the yoga nearly "
            "unreportable. The card names the reason ('internalized intellect') "
            "rather than dropping silently."
        ),
    ),
    # ── Vipareetha Raja ──────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-VRY-01",
        yoga_name="VIPAREETHA_RAJA_YOGA",
        name_en="Vipareetha Raja Yoga (Harsha / Sarala / Vimala)",
        name_ta="விபரீத ராஜ யோகம்",
        markers=("VARIANT",),
        detector="_yoga_detect.detect_vipareetha_raja",
        present_when=(
            "The lord of the 6th, 8th or 12th occupies a dusthana (6/8/12), "
            "**including its own**. Every hit is recorded as "
            "`<lord>_lord_of_<owned>_in_<occupied>`."
        ),
        strength_rule="STRONG if any hit, WEAK otherwise. Ungated.",
        cancellation="—",
        source="Harsha, Sarala and Vimala of the vipareetha raja yoga chapter, Phaladeepika.",
        key_planets=("SATURN", "MARS", "JUPITER"),
        note=(
            "**Three named sub-forms share this one ID**, separable from "
            "`conditions_met`: **Harsha** = 6th lord in a dusthana, **Sarala** = "
            "8th lord, **Vimala** = 12th lord. Vinaadi follows the **inclusive** "
            "school (audit M-4): the lord in its *own* dusthana counts, which is "
            "exactly the canonical Harsha/Sarala/Vimala placement. The stricter "
            "school requires a *cross* placement — 6th lord in the 8th, and so on "
            "— and would report far fewer. Two calls for the reviewer: the "
            "inclusive-vs-cross choice, and whether the three sub-forms should be "
            "shown as three cards instead of one. `key_planets` is fixed here and "
            "so is a `[PRODUCT]` approximation; the real lords are lagna-dependent."
        ),
    ),
    # ── Parivartana ──────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-PV-01",
        yoga_name="PARIVARTANA_YOGA",
        name_en="Parivartana Yoga (Maha / Dainya / Kahala)",
        name_ta="பரிவர்தன யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_parivartana",
        present_when=(
            "Two of the seven grahas each occupy the sign the other rules. One "
            "card per exchanging pair."
        ),
        strength_rule=(
            "MAHA → STRONG when **both** grahas stand in {1,2,4,5,7,9,10,11}; "
            "DAINYA → PARTIAL when either stands in a dusthana 6/8/12; KAHALA → "
            "WEAK otherwise."
        ),
        cancellation="—",
        source="The three-fold Maha / Dainya / Kahala classification of the exchange yogas, Phaladeepika.",
        key_planets=(),
        note=(
            "The Maha house set is kendra ∪ trikona **plus the 2nd and 11th** "
            "(audit L-2): a 2↔11 dhana exchange has to grade MAHA, not KAHALA. The "
            "classical taxonomy names the three grades by the houses involved; "
            "this particular house partition is Vinaadi's reading of it and is the "
            "`[PRODUCT]` half of the marker. The nodes never form a parivartana, "
            "ruling no sign. No key grahas are defined, so this yoga's activation "
            "score is dormant-capped — deliberate, since the exchanging pair varies."
        ),
    ),
    # ── Chandra Mangala ──────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-CM-01",
        yoga_name="CHANDRA_MANGALA_YOGA",
        name_en="Chandra Mangala Yoga",
        name_ta="சந்திர மங்கள யோகம்",
        markers=("TRADITION", "VARIANT"),
        detector="_yoga_detect.detect_chandra_mangala",
        present_when="Chandran and Chevvai share a rasi, **or** Chevvai is the 7th rasi from Chandran.",
        strength_rule=(
            "STRONG for the conjunction, PARTIAL for the mutual 7th, then gated "
            "over Chandran and Chevvai."
        ),
        cancellation="—",
        source="BPHS and Phaladeepika treat this as a conjunction yoga.",
        key_planets=("MOON", "MARS"),
        note=(
            "**Classical Chandra-Mangala is the conjunction.** Admitting the "
            "mutual 7th at reduced strength is a declared widening, not the source "
            f"rule. {_GATE_NOTE}"
        ),
    ),
    # ── Sakata ───────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-SK-01",
        yoga_name="SAKATA_YOGA",
        name_en="Sakata Yoga",
        name_ta="சகட யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_sakata_yoga",
        present_when="Chandran stands in the 6th, 8th or 12th rasi from Guru.",
        strength_rule="STRONG; PARTIAL when Chandran is also in a kendra from Lagna.",
        cancellation=(
            "Chandran in a kendra from Lagna is the classical bhanga. Here it "
            "**softens** the yoga to PARTIAL rather than removing it."
        ),
        source="Sakata yoga, Phaladeepika.",
        key_planets=(),
        note=(
            "An adverse yoga. Softening rather than cancelling means the finding "
            "stays on the card with its mitigation shown, instead of vanishing — "
            "the same posture as the Nadi parihara rule. Whether the classical "
            "bhanga should **cancel** outright is a reviewer call. No key grahas "
            "are defined, so activation is dormant-capped even in a Chandran or "
            "Guru dasha."
        ),
    ),
    # ── Kemadruma ────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-KD-01",
        yoga_name="KEMADRUMA_YOGA",
        name_en="Kemadruma Yoga",
        name_ta="கேமத்ரும யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_kemadruma_yoga",
        present_when=(
            "No graha other than Suriyan, Rahu, Kethu and Chandran itself occupies "
            "the 2nd or the 12th rasi from Chandran."
        ),
        strength_rule=(
            "Four bhanga are tested. `planet_kendra_from_moon` is a **full** bhanga "
            "on its own → WEAK. Of the other three — Chandran in a kendra from "
            "Lagna, Guru's drishti on Chandran, full moon opposite Suriyan — one → "
            "PARTIAL, two or more → WEAK. None → STRONG."
        ),
        cancellation="The four bhanga above; all four are recorded in `cancellation_factors`.",
        source="Kemadruma and its bhanga, BPHS and Phaladeepika.",
        key_planets=(),
        note=(
            "The full-bhanga carve-out is doctrine, not calibration: a graha in a "
            "kendra from Chandran destroys Kemadruma outright in both texts, and "
            "grading it produced a self-contradicting reading — Guru in a kendra "
            "from Chandran **is** Gaja Kesari, so one chart reported Gaja Kesari "
            "and Kemadruma as simultaneously active. The 1→PARTIAL / 2→WEAK "
            "grading of the remaining three is `[PRODUCT]`; those three are "
            "mitigating, not annulling."
        ),
    ),
    # ── Kartari ──────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-KT-01",
        yoga_name="PAPA_KARTARI_YOGA",
        name_en="Papa Kartari Yoga",
        name_ta="பாப கர்த்தரி யோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_kartari_yoga",
        present_when=(
            "The 2nd and the 12th rasis from the Lagna are **both** occupied, both "
            "contain at least one natural malefic, and **neither** contains a "
            "natural benefic."
        ),
        strength_rule="STRONG when formed, WEAK otherwise.",
        cancellation="A benefic on either side prevents the formation outright.",
        source="Papa/Shubha kartari (hemming) of the Phaladeepika bhava chapters.",
        key_planets=(),
        note=(
            "Called with `target_rasi = lagna_rasi` **only** — the hemming of any "
            "other bhava, or of Chandran, is not computed, though the function "
            "accepts a target and would compute it. The natural-malefic set "
            "includes Rahu, Kethu and **Mandhi**; treating the upagraha Mandhi as a "
            f"hemming malefic is a declared Tamil inclusion. {_BENEFIC_SET_NOTE}"
        ),
    ),
    YogaRule(
        rule_id="YOG-KT-02",
        yoga_name="SHUBHA_KARTARI_YOGA",
        name_en="Shubha Kartari Yoga",
        name_ta="சுப கர்த்தரி யோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_kartari_yoga",
        present_when=(
            "The 2nd and the 12th rasis from the Lagna are **both** occupied, both "
            "contain at least one natural benefic, and **neither** contains a "
            "natural malefic."
        ),
        strength_rule="STRONG when formed, WEAK otherwise.",
        cancellation="A malefic on either side prevents the formation outright.",
        source="Papa/Shubha kartari (hemming) of the Phaladeepika bhava chapters.",
        key_planets=(),
        note=f"Lagna only, as `YOG-KT-01`. {_BENEFIC_SET_NOTE}",
    ),
    YogaRule(
        rule_id="YOG-KT-03",
        yoga_name="KARTARI_YOGA",
        name_en="Kartari — neither formation present",
        name_ta="கர்த்தரி அமைப்பு இல்லை",
        markers=("PRODUCT",),
        detector="_yoga_detect.detect_kartari_yoga",
        present_when="Emitted with `is_present=False` when neither `YOG-KT-01` nor `YOG-KT-02` forms.",
        strength_rule="Always WEAK.",
        cancellation="—",
        source="Not a rule. A placeholder.",
        key_planets=(),
        note=(
            "**Not a third kartari yoga.** It is the empty-state row so the card "
            "slot always exists, and it is listed here only so a reviewer meeting "
            "`KARTARI_YOGA` in the output does not read it as a distinct formation."
        ),
    ),
    # ── Chandala ─────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-CH-01",
        yoga_name="CHANDALA_YOGA",
        name_en="Guru Chandala Yoga",
        name_ta="சண்டாள யோகம்",
        markers=("TRADITION", "LIMIT"),
        detector="_yoga_detect.detect_chandala_yoga",
        present_when="Guru and Rahu share a rasi.",
        strength_rule="STRONG when formed, WEAK otherwise. Ungated.",
        cancellation="—",
        source="Guru Chandala, standard in the Tamil dosha/yoga lists.",
        key_planets=(),
        note=(
            "Whole sign, **no degree orb**: a Guru-Rahu pair 25° apart inside one "
            "rasi forms it, while a 3° pair straddling a rasi boundary does not. "
            "Name the orb your lineage uses and it can be tightened. **Kethu is "
            "not tested** — schools that form Guru Chandala with either node would "
            "report more. No key grahas defined, so activation is dormant-capped."
        ),
    ),
    # ── Amala ────────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-AM-01",
        yoga_name="AMALA_YOGA",
        name_en="Amala Yoga",
        name_ta="அமல யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_amala_yoga",
        present_when=(
            "At least one of Guru, Sukran, Budhan or Chandran occupies the 10th "
            "rasi from the Lagna **or** the 10th from Chandran."
        ),
        strength_rule="STRONG when two or more such benefics are found, PARTIAL for one.",
        cancellation="—",
        source="Amala yoga, Phaladeepika — a benefic in the 10th from Lagna or Chandran.",
        key_planets=(),
        note=(
            "Classical Amala is satisfied by a **single** benefic in that position; "
            "the two-or-more → STRONG rung is Vinaadi's grading, not a source "
            f"distinction. {_BENEFIC_SET_NOTE} `dasha_activated` here is not a "
            "dasha test at all — it is true when any of the found benefics is a "
            "yogakaraka or trikona lord for the lagna, which is a different "
            "statement from 'this yoga is running now'. Flagged for a verdict."
        ),
    ),
    # ── Adhi ─────────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-AD-01",
        yoga_name="ADHI_YOGA",
        name_en="Adhi Yoga",
        name_ta="அதி யோகம்",
        markers=("VARIANT", "PRODUCT"),
        detector="_yoga_detect.detect_adhi_yoga",
        present_when=(
            "**At least one** of Guru, Sukran or Budhan occupies the 6th, 7th or "
            "8th rasi from Chandran."
        ),
        strength_rule=(
            "By the number of those three *houses* covered: 3 → STRONG, 2 → "
            "PARTIAL, 1 → WEAK. Two benefics in one house count once."
        ),
        cancellation="—",
        source="Adhi yoga, BPHS and Phaladeepika — the three benefics in the 6th/7th/8th from Chandran.",
        key_planets=(),
        note=(
            "**This is the loosest presence test in the yoga set, and it is looser "
            "than the classical rule.** Adhi Yoga proper asks for the benefics in "
            "those houses as a set, graded by how many of the three *benefics* are "
            "so placed. Firing on one benefic in one of three houses makes Adhi "
            "Yoga present on most charts; counting distinct houses rather than "
            "distinct benefics is a second departure. **Both are surfaced for the "
            "reviewer's verdict rather than changed unilaterally** — tightening the "
            "presence test would remove a yoga from charts that currently show it, "
            "which is a doctrine decision, not a bug fix. `dasha_activated` here is "
            "read from the functional nature of Guru, Sukran and Budhan for the "
            "lagna — **all three, whether or not they are among the grahas that "
            "formed the yoga** — so it is neither a dasha test nor restricted to "
            "this yoga's own participants."
        ),
    ),
    # ── Daridra ──────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-DR-01",
        yoga_name="DARIDRA_YOGA",
        name_en="Daridra Yoga",
        name_ta="தரித்ர யோகம்",
        markers=("VARIANT", "PRODUCT"),
        detector="_yoga_detect.detect_daridra_yoga",
        present_when=(
            "The 11th lord occupies a dusthana (6/8/12), **or** its composite "
            "natal score is below 40 and a natural malefic other than itself "
            "shares its rasi."
        ),
        strength_rule=(
            "STRONG when the dusthana condition fired, PARTIAL when only the "
            "weak-plus-malefic condition did."
        ),
        cancellation="—",
        source=(
            "No single source claimed. Daridra yogas are a family — variously on "
            "the 2nd/11th lords in dusthanas, the lagna lord in the 6/8/12, and "
            "other combinations. This implements one narrow member of it."
        ),
        key_planets=(),
        note=(
            "The `< 40` cut-off reads the composite natal graha score (§3.3.4), a "
            "`[PRODUCT]` number, not a classical strength. **When the 11th lord's "
            "rasi is absent from the chart map the function silently defaults it to "
            "the Lagna rasi**, which makes the dusthana test read house 1 — a "
            "silent default a reviewer should know about, though every production "
            "call site supplies all nine grahas. Adverse yoga; no key grahas "
            "defined, so activation is dormant-capped."
        ),
    ),
    # ── Lakshmi ──────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-LK-01",
        yoga_name="LAKSHMI_YOGA",
        name_en="Lakshmi Yoga",
        name_ta="லக்ஷ்மி யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_lakshmi_yoga",
        present_when=(
            "The 9th lord scores 60 or more **and** stands in a kendra or trikona, "
            "**and** the Lagna lord scores 60 or more."
        ),
        strength_rule="STRONG when formed, WEAK otherwise. Ungated.",
        cancellation="—",
        source="Lakshmi yoga, Phaladeepika — a strong and well-placed 9th lord with a strong lagna lord.",
        key_planets=(),
        note=(
            "**The principle is classical; the two 60s are Vinaadi's.** The source "
            "rule reads dignity — the 9th lord in its own or exaltation sign in a "
            "kendra/trikona — and Vinaadi substitutes the composite natal score "
            "(§3.3.4) with a 60 cut-off in both places. A reviewer should judge the "
            "direction, not the number. Note this yoga is one of the four that "
            "silently go inert if `planet_scores_in` is not threaded from the real "
            "chart-strength computation, since the fallback yields a uniform 50."
        ),
    ),
    # ── Sunapha / Anapha / Durudhura ─────────────────────────────────────────
    YogaRule(
        rule_id="YOG-SAD-01",
        yoga_name="SUNAPHA_YOGA",
        name_en="Sunapha Yoga",
        name_ta="சுனபா யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_sunapha_anapha_durudhura",
        present_when=(
            "A graha other than Suriyan, Chandran, Rahu, Kethu and Mandhi occupies "
            "the 2nd rasi from Chandran."
        ),
        strength_rule="PARTIAL, flat. Ungated.",
        cancellation="—",
        source="Chandra yogas of BPHS — Sunapha, Anapha and Durudhura.",
        key_planets=(),
        note=(
            "The exclusion set is classical for Suriyan and the nodes; excluding "
            "**Mandhi** is the WI-15 ruling — an upagraha is not a graha for this "
            "test — and matches Kemadruma's exclusion in the same module. **Emitted "
            "only when present**: an absent Sunapha produces no card at all, unlike "
            "most yogas here which always emit a row. The flat PARTIAL rung is "
            "Vinaadi's; the texts grade these by the graha involved."
        ),
    ),
    YogaRule(
        rule_id="YOG-SAD-02",
        yoga_name="ANAPHA_YOGA",
        name_en="Anapha Yoga",
        name_ta="அநபா யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_sunapha_anapha_durudhura",
        present_when=(
            "A graha other than Suriyan, Chandran, Rahu, Kethu and Mandhi occupies "
            "the 12th rasi from Chandran."
        ),
        strength_rule="PARTIAL, flat. Ungated.",
        cancellation="—",
        source="Chandra yogas of BPHS — Sunapha, Anapha and Durudhura.",
        key_planets=(),
        note="Same exclusion set, same emit-only-when-present behaviour and same flat rung as `YOG-SAD-01`.",
    ),
    YogaRule(
        rule_id="YOG-SAD-03",
        yoga_name="DURUDHURA_YOGA",
        name_en="Durudhura Yoga",
        name_ta="துருதுரா யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_sunapha_anapha_durudhura",
        present_when="Both `YOG-SAD-01` and `YOG-SAD-02` are satisfied.",
        strength_rule="STRONG, flat. Ungated.",
        cancellation="—",
        source="Chandra yogas of BPHS — Sunapha, Anapha and Durudhura.",
        key_planets=(),
        note=(
            "Emitted **in addition to** Sunapha and Anapha, not instead of them, so "
            "a chart with both sides occupied shows three cards for one "
            "configuration. Whether Durudhura should absorb the other two is a "
            "presentation call for the reviewer."
        ),
    ),
    # ── Vasumati ─────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-VS-01",
        yoga_name="VASUMATI_YOGA",
        name_en="Vasumati Yoga",
        name_ta="வசுமதி யோகம்",
        markers=("VARIANT", "PRODUCT"),
        detector="_yoga_detect.detect_vasumati_yoga",
        present_when=(
            "Two or more of Guru, Sukran, Budhan and Chandran occupy an upachaya "
            "rasi (3/6/10/11) counted from Chandran."
        ),
        strength_rule="STRONG at three or more, PARTIAL at two.",
        cancellation="—",
        source="Vasumati yoga — benefics in the upachayas.",
        key_planets=(),
        note=(
            "Counted from **Chandran only**; the usual statement of the rule allows "
            "the Lagna as well. Chandran is in the candidate set but can never "
            "satisfy the test — it is always the 1st from itself — so it is inert "
            "and the effective set is three grahas. The 2-and-3 rungs are Vinaadi's."
        ),
    ),
    # ── Nakshatra cautions — not yogas, and display-only ─────────────────────
    YogaRule(
        rule_id="YOG-NKC-01",
        yoga_name="AYILYAM_CAUTION",
        name_en="Ayilyam (Ashlesha) caution",
        name_ta="ஆயில்ய தோஷம்",
        markers=("TAMIL_LINEAGE", "LIMIT"),
        detector="_yoga_detect.detect_nakshatra_cautions",
        present_when="The janma nakshatra is Ayilyam (9).",
        strength_rule="None — `NakshatraCautionResult` carries no strength and no activation.",
        cancellation="—",
        source="Tamil household practice, widely printed in almanacs. No derivable rule; no page claimed.",
        key_planets=(),
        note=(
            "**Not a yoga, and scoring reach: none.** A caution string keyed on the "
            "birth star alone, surfaced with remedy-oriented wording, feeding no "
            "score, no ranking and no recommendation. Carried in this registry "
            "because it is the twentieth detector and the reviewer asked for all "
            "twenty. The in-law framing is the traditional one and is a lineage "
            "statement, not a claim."
        ),
    ),
    YogaRule(
        rule_id="YOG-NKC-02",
        yoga_name="KETTAI_CAUTION",
        name_en="Kettai (Jyeshtha) caution",
        name_ta="கேட்டை தோஷம்",
        markers=("TAMIL_LINEAGE", "LIMIT"),
        detector="_yoga_detect.detect_nakshatra_cautions",
        present_when="The janma nakshatra is Kettai (18).",
        strength_rule="None — no strength, no activation.",
        cancellation="—",
        source="Tamil household practice. No derivable rule; no page claimed.",
        key_planets=(),
        note="As `YOG-NKC-01`: display-only, no scoring reach.",
    ),
    YogaRule(
        rule_id="YOG-NKC-03",
        yoga_name="MOOLAM_CAUTION",
        name_en="Moolam (Moola) caution",
        name_ta="மூல தோஷம்",
        markers=("TAMIL_LINEAGE", "LIMIT"),
        detector="_yoga_detect.detect_nakshatra_cautions",
        present_when="The janma nakshatra is Moolam (19).",
        strength_rule="None — no strength, no activation.",
        cancellation="—",
        source="Tamil household practice. No derivable rule; no page claimed.",
        key_planets=(),
        note=(
            "As `YOG-NKC-01`: display-only, no scoring reach. The 'especially for a "
            "first child' clause is the traditional wording and is presented with "
            "remedies rather than as a finding."
        ),
    ),
)


#: Rule rows by ID.
YOGA_RULE_BY_ID: dict[str, YogaRule] = {rule.rule_id: rule for rule in YOGA_RULES}


def rules_for_yoga(yoga_name: str) -> tuple[YogaRule, ...]:
    """Every rule that can produce ``yoga_name``.

    More than one for ``RAJA_YOGA``, which has two independent formulations
    (`YOG-RY-01` association, `YOG-RY-02` exchange) merged onto one card. Empty
    for an unknown code, which is how a yoga shipped without a registry row
    would show up — `tests/test_yoga_rules.py` fails before that can reach a user.
    """
    return tuple(rule for rule in YOGA_RULES if rule.yoga_name == yoga_name)


def rule_ids_for_yoga(yoga_name: str) -> tuple[str, ...]:
    return tuple(rule.rule_id for rule in rules_for_yoga(yoga_name))


def activation_key_planets() -> dict[str, list[str]]:
    """The activation table, keyed by the code the detectors actually emit.

    ``yoga_activation.YOGA_KEY_PLANETS`` is built from this. It used to be a
    hand-maintained dict keyed on *near-miss* names — ``GAJA_KESARI`` for a code
    emitted as ``GAJA_KESARI_YOGA``, ``PANCHA_MAHAPURUSHA_MARS`` for a code
    emitted as ``RUCHAKA_YOGA`` — so nine yogas looked up nothing, scored as
    permanently dormant, and could never be activated by their own dasha lord.
    Deriving the table from the registry makes that class of drift impossible:
    the key *is* ``YogaResult.name``.
    """
    table: dict[str, list[str]] = {}
    for rule in YOGA_RULES:
        if not rule.yoga_name or not rule.key_planets:
            continue
        table.setdefault(rule.yoga_name, [])
        for planet in rule.key_planets:
            if planet not in table[rule.yoga_name]:
                table[rule.yoga_name].append(planet)
    return table
