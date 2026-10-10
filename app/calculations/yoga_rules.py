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
Durudhura and Vasumati hardcode it to ``False`` whatever dasha is running. Since
2026-09-23 ``_chart_build`` resolves the published flag against the same key
grahas the score reads and hands the score that verdict, so the two agree on
every chart (`tests/test_yoga_activation_agreement.py`).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ActivationBasis(str, Enum):  # noqa: UP042 — str-mixin, as FunctionalNature
    """Why a graha is an activator (DOCTRINE_DECISIONS v1.3, DD-15)."""

    SOURCE_EXPLICIT = "SOURCE_EXPLICIT"        # a cited text names this activator for this yoga
    SOURCE_INFERRED = "SOURCE_INFERRED"        # follows from a stated general principle
    VINAADI_CONVENTION = "VINAADI_CONVENTION"  # engine choice, Tier C


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
    #: When the activating grahas are resolved **per chart** and carried in
    #: ``YogaResult.key_grahas``, a plain statement of which grahas they are.
    #: Such a yoga is *not* dormant-capped even with an empty ``key_planets``;
    #: the appendix prints this instead of "none — dormant-capped".
    per_chart_activation: str = ""
    #: The school choice, the departure from the classical form, or the thing a
    #: reviewer would otherwise have to read the source to discover.
    note: str = ""
    #: DD-15: the basis for the primary activators (``key_planets`` or the
    #: per-chart ones). The general principle — a yoga gives its results in the
    #: dashas of the planets that form it — is Raman's, stated for Sunapha and
    #: applied to Gaja Kesari; applying it elsewhere is inference.
    activation_basis: ActivationBasis = ActivationBasis.SOURCE_INFERRED
    #: DD-15 secondary activators, stated in words because most are per chart
    #: (carried in ``YogaResult.secondary_grahas``). Their dasha activates at the
    #: moderate tier only. "" = none.
    secondary_activation: str = ""
    secondary_basis: ActivationBasis | None = None


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
    YogaRule(
        rule_id="YOG-GK-02",
        yoga_name="GAJA_KESARI_PARASHARA",
        name_en="Gaja Kesari Yoga",
        name_ta="கஜகேசரி யோகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_gaja_kesari_parashara",
        present_when=(
            "Guru is in a kendra from Lagna or Chandran, is joined or aspected "
            "by a chart-dynamic benefic, and is not debilitated, combust, or in "
            "an enemy sign. Same-sign placement counts as the first kendra."
        ),
        strength_rule="STRONG on formation, then gated over Guru and Chandran.",
        cancellation="Any failed formation clause makes this strict form absent; neecha bhanga does not rescue it.",
        source="BPHS 36.3-4 (verse numbering remains external-review pending).",
        key_planets=("JUPITER", "MOON"),
        activation_basis=ActivationBasis.SOURCE_EXPLICIT,
        note=(
            "Strict Parashara form. Dynamic benefic classification follows DD-12. "
            "Whether the waxing Moon may itself be the supporting benefic is open "
            "item O-22 (default: yes, literal)."
        ),
    ),
    # ── Gaja Kesari ──────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-GK-01",
        yoga_name="GAJA_KESARI_YOGA",
        name_en="Gaja Kesari pattern",
        name_ta="கஜகேசரி அமைப்பு",
        markers=("VARIANT", "PRODUCT"),
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
        activation_basis=ActivationBasis.SOURCE_EXPLICIT,
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
        name_ta="ராஜயோகம் — இணைப்பு",
        markers=("VARIANT", "PRODUCT"),
        detector="_yoga_detect.detect_raja_yoga",
        present_when=(
            "For every pair of an eligible trikona lord (of 1/5/9) and an eligible "
            "kendra lord (of 1/4/7/10) that are different grahas: the two share a "
            "rasi, **or** each casts a drishti on the other's rasi (a **mutual** "
            "aspect, DD-07). Parashari aspects including the special 4/8, 5/9 and "
            "3/10 (`CORE-11`). A one-way special aspect (audit L-3) links only "
            "under open item O-15. Eligibility is read from the functional-status "
            "rule table (`functional_status.raja_participation`, DD-07)."
        ),
        strength_rule=(
            "STRONG per firing pair, gated over that pair's two lords. Each "
            "instance also records a Tier C grade, `raja_grade_full` / "
            "`_qualified` / `_mixed` / `_mixed_kendradhipati`, from both lords' "
            "co-lordships. The chart card is the merge of every pair — best "
            "strength, union of conditions, activated if any pair is activated."
        ),
        cancellation=(
            "A pair BPHS 34 names as giving no Raja Yoga by mere association for "
            "this lagna — Mesham Guru+Sani, Mithunam Guru+Sani, Simmam Guru+Sukran "
            "(`functional_status.SOURCE_VETOED_RAJA_PAIRS`, owner ruling "
            "2026-10-03) — forms nothing and is recorded as "
            "`raja_pair_source_vetoed_<a>_<b>`."
        ),
        source=(
            "Parashari trikona-kendra sambandha, BPHS raja yoga chapters. The "
            "association reading is one of several live formulations, not the only one."
        ),
        key_planets=("SUN", "MOON", "MARS", "JUPITER"),
        per_chart_activation="This instance's own trikona lord and kendra lord (the fixed list is only a fallback).",
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
            "**Ruling 2026-09-23:** (1) each instance activates on its own two "
            "lords, carried in `YogaResult.key_grahas`; the `key_planets` below is "
            "now only a fallback for a card with no instance. (2) A lord that also "
            "owns the 6th/8th qualifies only if its moolatrikona sign is the "
            "kendra/trikona it owns. This excludes Kadagam Guru (6+9) and Sani "
            "(7+8), Kanni Sani (5+6) and Kumbam Budhan (5+8) from every Raja Yoga; "
            "set against DD-07's trikona-dominates reading it is open item O-23 "
            "(default: this ruling). Precedence is lagna ownership first: the lagna "
            "lord always qualifies. **DD-07 (v1.3) changed the 12th:** a 12th "
            "co-lord is never downgraded for the 12th alone (O-4), which "
            "re-admits Rishabam Sevvai, Thulam Budhan and Viruchigam Sukran — "
            "the conflict with this ruling is open item O-14. (3) Rahu/Ketu sharing a sign with a forming "
            "lord are recorded as supporting (`supporting_grahas`), never forming, "
            "and their dashas do not activate the card. "
            "**Owner ruling 2026-10-03 (v1.7):** the moolatrikona test now covers "
            "3rd/11th co-lords too, excluding Mesham Sani (10+11), Simmam Sukran "
            "(3+10) and Kumbam Sevvai (3+10); a natural benefic owning two "
            "kendras (Guru for Mithunam/Kanni, Budhan for Dhanusu/Meenam) takes "
            "part at the `mixed_kendradhipati` grade (O-24); three BPHS pairs "
            "are source-vetoed. Kadagam Guru's exclusion is kept with a "
            "recorded dissent: many Tamil practitioners read Guru as a strong "
            "benefic for Kataka."
        ),
    ),
    YogaRule(
        rule_id="YOG-RY-02",
        yoga_name="RAJA_YOGA",
        name_en="Raja Yoga — trikona/kendra lord exchange",
        name_ta="ராஜயோகம் — பரிவர்தனம்",
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
        per_chart_activation="The two exchanging lords of this instance.",
        note=(
            "Merges into the same `RAJA_YOGA` card as `YOG-RY-01`. **This path is "
            "not strength-gated** while `YOG-RY-01` is — a combust or badly placed "
            "pair still reports STRONG here. That asymmetry is disclosed rather "
            "than quietly evened out, because evening it out is a doctrine call. "
            "The same 2026-09-23 lord-eligibility, per-instance trigger and "
            "Rahu/Ketu rules as `YOG-RY-01` apply."
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
            "Not reported by Vinaadi under any name: (a) retired 2026-09-23 — the "
            "lone yogakaraka is now `YOG-RY-04`, its own card, which since 2026-10-01 reports "
            "the yogakaraka planet's strength and makes no Raja Yoga claim; (b) the two lords "
            "merely occupying kendras from "
            "each other, without conjunction, drishti or exchange; (c) raja yogas "
            "read from the Navamsa or from Chandra lagna rather than from the "
            "Lagna; (d) Dharma-Karmadhipati as a **separately named** yoga — the "
            "9th/10th pair does form `YOG-RY-01`, but it is never distinguished "
            "from any other trikona-kendra link on the card. Neecha Bhanga and "
            "Vipareetha raja yogas are detected, under their own IDs."
        ),
    ),
    YogaRule(
        rule_id="YOG-RY-04",
        yoga_name="YOGAKARAKA_RAJA_YOGA",
        name_en="Yogakaraka planet",
        name_ta="யோககாரக கிரகம்",
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_raja_yogakaraka",
        present_when=(
            "One graha holds `DUAL_LORD_YOGAKARAKA` in the functional-status "
            "matrix (DD-07): it owns one of {4, 7, 10} **and** one of {5, 9}; house "
            "1 never satisfies either side. Exactly six lagnas have one — Sani for "
            "Rishabha/Thulam, Sevvai for Kataka/Simha, Sukran for Makara/Kumbam. "
            "Ownership alone makes it the yogakaraka."
        ),
        strength_rule=(
            "STRONG on formation; PARTIAL when the yogakaraka is debilitated, "
            "combust or placed in the 6th/8th/12th from Lagna — one rung however "
            "many apply, each recorded as `<graha>_yogakaraka_<affliction>`. "
            "A debility cancelled by Neecha Bhanga (`neecha_bhanga_cancelled`, "
            "the same predicate as `YOG-NBR-01`) costs nothing and is recorded "
            "as `<graha>_yogakaraka_neecha_bhanga`; the other afflictions still "
            "apply (ruling 2026-10-01, option B). "
            f"{_GATE_NOTE} Here the gate reads the composite score only; "
            "combustion is already counted once, above."
        ),
        cancellation=(
            "None. Debility, combustion and a dusthana placement lower its "
            "yogakaraka strength; they never remove its yogakaraka status (owner "
            "ruling 2026-09-23, superseding the first-pass dignity gate)."
        ),
        source="Yogakaraka graha, BPHS — a single lord of a kendra and a trikona.",
        key_planets=(),
        per_chart_activation="The yogakaraka graha itself.",
        note=(
            "Astrologer ruling 2026-10-01: this card reports the yogakaraka "
            "**planet and its strength**, not a distinct Raja Yoga. Ownership "
            "alone does not create a yoga; a Raja Yoga still needs `YOG-RY-01`'s "
            "link between lords. The emitted code keeps its historical name "
            "`YOGAKARAKA_RAJA_YOGA` as a stable API key only. Supersedes the "
            "2026-09-23 framing as 'a distinct yoga type'. The yogakaraka is "
            "carried per chart in `YogaResult.key_grahas`."
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
            "Either of two conditions on the 2nd and 11th lords: they share a "
            "rasi (`second_eleventh_conjunction`), or each occupies the sign the "
            "other rules (`second_eleventh_exchange`). The third, parentless "
            "condition no longer lives on this card — see `YOG-DN-02`."
        ),
        strength_rule="STRONG when either condition fires. Then gated over the two lords.",
        cancellation="—",
        source="The 2nd/11th dhana formulation of the BPHS dhana yoga chapter.",
        key_planets=("JUPITER", "VENUS", "MERCURY"),
        activation_basis=ActivationBasis.VINAADI_CONVENTION,
        note=(
            "**Separated by the 2026-08-28 ruling** ('Separate `[PRODUCT]`'). "
            "This card now carries only the two sourced conditions, so a reader "
            "meeting `DHANA_YOGA` sees a claim with a printed classical parent. "
            "`key_planets` is a `[PRODUCT]` approximation for the same reason as "
            f"`YOG-RY-01`. {_GATE_NOTE}"
        ),
    ),
    YogaRule(
        rule_id="YOG-DN-02",
        yoga_name="DHANA_SUPPORTIVE_YOGA",
        name_en="Dhana Yoga (supportive)",
        name_ta="தன யோகம் (துணை)",
        markers=("PRODUCT",),
        detector="_yoga_detect.detect_dhana_yoga_supportive",
        present_when="Both the 2nd and 11th lords stand in a kendra or a trikona (`both_lords_in_strong_houses`).",
        strength_rule="PARTIAL when formed, gated over the two lords; WEAK otherwise.",
        cancellation="—",
        source="No single source claimed. A Vinaadi proxy for 'both wealth lords are well placed', not a classical dhana yoga.",
        key_planets=("JUPITER", "VENUS", "MERCURY"),
        activation_basis=ActivationBasis.VINAADI_CONVENTION,
        note=(
            "**Split off `YOG-DN-01` by ruling, kept rather than dropped.** This "
            "is much the commonest of the original three Dhana conditions, so it "
            "fires on a large share of charts — now on its own labelled card "
            "rather than under the classical name. `key_planets` is a "
            f"`[PRODUCT]` approximation for the same reason as `YOG-RY-01`. {_GATE_NOTE}"
        ),
    ),
    # ── Neecha Bhanga ────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-NBR-01",
        yoga_name="NEECHA_BHANGA_RAJA_YOGA",
        name_en="Neecha Bhanga Raja Yoga",
        name_ta="நீசபங்க ராஜயோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_neecha_bhanga",
        present_when=(
            "A graha stands in its debilitation rasi, rules of "
            "`neecha_bhanga.NEECHA_BHANGA_RULES` fire whose verse states a "
            "raja-yoga result (O-13), **and** they amount to at least two "
            "distinct conditions (`o13_nb_raja_min_points`, owner ruling "
            "2026-10-03). One rule per Phaladeepika verse (DD-09): "
            "NB-a debilitation-sign lord in a kendra from Lagna or Chandran "
            "(7.26/7.29); NB-b exaltation-sign lord in a kendra from Lagna or "
            "Chandran (7.26/7.29); NB-c the two lords in mutual kendras (7.27); "
            "NB-d the debilitated graha aspected by its debilitation-sign lord "
            "(7.28), NB-d+ the same outside 6/8/12 (7.28, second half); NB-g "
            "either lord in a kendra from Lagna (7.30, reference point O-10). "
            "**Any one rule cancels the debility**; one condition alone is "
            "`YOG-NBR-02`, not this yoga."
        ),
        strength_rule=(
            "By distinct conditions, not verses (Tier C): two → PARTIAL, three or "
            "more → STRONG. NB-g never adds a point NB-a/NB-b already counted; "
            "NB-d+ adds one. A rule that fires only through Budhan's "
            "self-reference (O-21, tagged `nb_self_reference`) may add a rung but "
            "never makes it STRONG on its own. Ungated."
        ),
        cancellation=(
            "Retrogression of the debilitated graha is recorded as a supporting "
            "note only (`debilitated_planet_retrograde_note`) and never forms the "
            "yoga by itself — the retrograde verse is open item O-11. Off by "
            "default: NB-f, Navamsa strength (O-7); NB-x1/NB-x2, two conditions "
            "the engine shipped without a verse in DD-09's table (O-12). Budhan "
            "rules its own exaltation sign, so for a debilitated Budhan NB-b, NB-c "
            "and NB-g test Budhan's own position — the deleted NB-e. Owner ruling "
            "2026-10-03 (O-21): counted, tagged `nb_self_reference`, never STRONG "
            "on its own."
        ),
        source=(
            "Phaladeepika 7.26–30, verse map checked against the Subrahmanya "
            "Sastri translation online (siva.sh, 2026-10-01); physical edition "
            "pending (§18). DOCTRINE_DECISIONS v1.3, DD-09."
        ),
        key_planets=(),
        per_chart_activation="The debilitated graha itself (DD-15).",
        secondary_activation="The grahas whose placement or aspect produced the bhanga.",
        secondary_basis=ActivationBasis.VINAADI_CONVENTION,
        note=(
            "The rules are **not** in the yoga module: `neecha_bhanga` holds them "
            "and `chart_strength.neecha_bhanga_cancelled` wraps them, so this card, "
            "the +14 bhanga term in the strength synthesis and the yogakaraka "
            "card cannot disagree on one chart (audit C2). DD-09 removed the "
            "verse-less conditions the predicate used to carry and NB-e (the "
            "debilitated graha itself in a kendra), which no cited verse states. "
            "With any one condition the yoga fired on 95% of charts carrying a "
            "debilitated graha (v1.6 frequency report), so the 2026-10-03 ruling "
            "moved the single-condition case to its own card. The old static key "
            "graha (`JUPITER`) is retired by DD-15: the debilitated graha activates."
        ),
    ),
    YogaRule(
        rule_id="YOG-NBR-02",
        yoga_name="NEECHA_NIVARTHI",
        name_en="Neecha Bhanga (debility cancelled)",
        name_ta="நீசபங்கம்",  # owner-ruled wording 2026-10-03 (v1.8); was நீச நிவர்த்தி
        markers=("TRADITION", "PRODUCT"),
        detector="_yoga_detect.detect_neecha_bhanga",
        present_when=(
            "A graha stands in its debilitation rasi and at least one rule of "
            "`neecha_bhanga.NEECHA_BHANGA_RULES` fires, but not enough for "
            "`YOG-NBR-01`: fewer than two distinct conditions, or no firing verse "
            "states a raja-yoga result (O-13)."
        ),
        strength_rule="WEAK (shown as 'Mild'), flat.",
        cancellation="—",
        source=(
            "Phaladeepika 7.26–30 for the cancellation itself (DD-09). The "
            "two-condition line between this card and the raja yoga is a Vinaadi "
            "display rule (owner ruling 2026-10-03), not a textual threshold."
        ),
        key_planets=(),
        per_chart_activation="The debilitated graha itself (DD-15).",
        secondary_activation="The grahas whose placement or aspect produced the bhanga.",
        secondary_basis=ActivationBasis.VINAADI_CONVENTION,
        note=(
            "The debility is cancelled — the +14 bhanga strength term, the "
            "yogakaraka card and bhava palan all see it, as before — but no "
            "raja-yoga name is claimed. DD-09 says there is no classical count "
            "threshold; the threshold here governs only which name the reader "
            "sees, and is recorded as a departure for that reason."
        ),
    ),
    # ── Pancha Mahapurusha — five rules, not one ─────────────────────────────
    YogaRule(
        rule_id="YOG-NRV-01",
        yoga_name="RETROGRADE_DEBILITATED_RAJA_YOGA",
        name_en="Retrograde debilitated-planet Raja Yoga",
        name_ta="வக்கிர நீச கிரக ராஜயோகம்",  # owner-ruled wording 2026-10-03 (v1.8)
        markers=("TRADITION", "PRODUCT", "LIMIT"),
        detector="_yoga_detect.detect_retrograde_debilitated_raja_yoga",
        present_when=(
            "A debilitated graha is retrograde, outside houses 6/8/12 from "
            "Lagna, and has bright rays. O-11 must be enabled."
        ),
        strength_rule="STRONG when every formation clause is met; no composite-score gate.",
        cancellation="Combustion fails the engine's provisional bright-rays test.",
        source=(
            "Phaladeepika chapter 7, retrograde debilitated-planet verse; verse "
            "number and physical-edition wording remain pending section 18."
        ),
        per_chart_activation="The debilitated retrograde graha itself.",
        activation_basis=ActivationBasis.SOURCE_INFERRED,
        note=(
            "Off by default under O-11. Vinaadi provisionally translates bright "
            "rays as non-combust; that translation is Tier C and must be ruled."
        ),
    ),
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
        name_ta="விபரீத ராஜயோகம்",
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
        activation_basis=ActivationBasis.VINAADI_CONVENTION,
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
        per_chart_activation="Both exchanging lords (DD-15).",
        note=(
            "The Maha house set is kendra ∪ trikona **plus the 2nd and 11th** "
            "(audit L-2): a 2↔11 dhana exchange has to grade MAHA, not KAHALA. The "
            "classical taxonomy names the three grades by the houses involved; "
            "this particular house partition is Vinaadi's reading of it and is the "
            "`[PRODUCT]` half of the marker. The nodes never form a parivartana, "
            "ruling no sign. Activation (DD-15): the two exchanging lords, carried "
            "per chart in `YogaResult.key_grahas`."
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
        source=(
            "Sakata yoga, Phaladeepika (Mantreswara) — Chandran in the 6th, 8th "
            "or 12th from Guru. **A lineage choice, not the only reading**: a "
            "competing classical stream, followed by several Tamil texts, gives "
            "Sakata as 6/8 only, with the kendra-from-Lagna bhanga. We follow "
            "the 6/8/12 form as the dominant one (astrologer ruling, "
            "2026-09-11). Any surface that says '6th or 8th' is following the "
            "other lineage, not making an error — but the product speaks with "
            "one voice, and that voice is 6/8/12."
        ),
        key_planets=("MOON", "JUPITER"),
        note=(
            "An adverse yoga. Softening rather than cancelling means the finding "
            "stays on the card with its mitigation shown, instead of vanishing — "
            "the same posture as the Nadi parihara rule. **The bhanga stays "
            "graded by astrologer ruling, 2026-09-11**: unlike Kemadruma's, the "
            "Chandran-in-kendra bhanga for Sakata is genuinely contested in the "
            "texts — some treat it as full cancellation, others as mitigation — "
            "so promoting it to a cancel would assert a settlement the sources "
            "do not have. The asymmetry with `YOG-KD-01` is deliberate and "
            "tracks how firm each bhanga's classical ground is, not a "
            "consistency defect. Key grahas are Chandran and Guru, the two "
            "grahas the yoga is defined on (same ruling)."
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
            "on its own → the card no longer shows as present at all (WEAK, "
            "`is_present=False`). Of the other three — Chandran in a kendra from "
            "Lagna, Guru's drishti on Chandran, full moon opposite Suriyan — one → "
            "PARTIAL, two or more → WEAK (still present, softened). None → STRONG."
        ),
        cancellation="The four bhanga above; all four are recorded in `cancellation_factors`.",
        source="Kemadruma and its bhanga, BPHS and Phaladeepika.",
        key_planets=("MOON",),
        note=(
            "**Bhanga is now mandatory before display (2026-08-28 ruling).** "
            "Before this, the full bhanga only lowered the reported strength to "
            "WEAK while `is_present` stayed True, so a cancelled Kemadruma could "
            "still surface as present to a reader. The full-bhanga carve-out "
            "itself is doctrine, not calibration: a graha in a kendra from "
            "Chandran destroys Kemadruma outright in both texts, and grading it "
            "produced a self-contradicting reading — Guru in a kendra from "
            "Chandran **is** Gaja Kesari, so one chart reported Gaja Kesari and "
            "Kemadruma as simultaneously active. The 1→PARTIAL / 2→WEAK grading "
            "of the remaining three is `[PRODUCT]`; those three still soften "
            "rather than cancel, matching Sakata's posture.\n\n"
            "**A cancelled Kemadruma is a reading, not a non-event** "
            "(astrologer ruling, 2026-09-11). `is_present=False` with a "
            "non-empty `cancellation_factors` means the Moon *was* isolated and "
            "the bhanga then annulled it — the native carries the Kemadruma "
            "signature (self-reliance, the rise-from-nothing pattern) together "
            "with the resource to transcend it. That is a different and more "
            "valuable reading than 'the geometry never formed', and surfaces "
            "MUST distinguish the two: see `yogaReadingStatus` in "
            "`packages/shared/src/yogaDisplay.ts`, which resolves this case to "
            "`CANCELLED` rather than `ABSENT`. Key graha is Chandran, on which "
            "the whole yoga is defined (same ruling)."
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
        per_chart_activation="The hemming planets (DD-15).",
        secondary_activation="The lord of the hemmed sign.",
        secondary_basis=ActivationBasis.VINAADI_CONVENTION,
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
        per_chart_activation="The hemming planets (DD-15).",
        secondary_activation="The lord of the hemmed sign.",
        secondary_basis=ActivationBasis.VINAADI_CONVENTION,
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
        present_when="Guru and Rahu share a rasi. **Guru-Ketu does not form this yoga** — see `YOG-CH-02`.",
        strength_rule="STRONG when formed, WEAK otherwise. Ungated.",
        cancellation="—",
        source="Guru Chandala, standard in the Tamil dosha/yoga lists.",
        key_planets=(),
        per_chart_activation="Guru and Rahu (DD-15).",
        secondary_activation="Rahu's dispositor (BPHS: a node gives the results of its sign lord; verse to verify).",
        secondary_basis=ActivationBasis.SOURCE_INFERRED,
        note=(
            "**Guru+Rahu ONLY (2026-08-28 ruling).** Whole sign, **no degree "
            "orb**: a Guru-Rahu pair 25° apart inside one rasi forms it, while a "
            "3° pair straddling a rasi boundary does not. Name the orb your "
            "lineage uses and it can be tightened. The Guru-Ketu form some "
            "schools also use is split into its own `[VARIANT]` card "
            "(`YOG-CH-02`, `CHANDALA_KETU_YOGA`) rather than folded in here, so "
            "the Ketu form never reads as the same yoga. Activation (DD-15): Guru "
            "and Rahu primary, Rahu's dispositor secondary."
        ),
    ),
    YogaRule(
        rule_id="YOG-CH-02",
        yoga_name="CHANDALA_KETU_YOGA",
        name_en="Guru Chandala Yoga (Ketu variant)",
        name_ta="சண்டாள யோகம் (குரு-கேது வேறுபாடு)",
        markers=("VARIANT",),
        detector="_yoga_detect.detect_chandala_yoga_ketu_variant",
        present_when="Guru and Kethu share a rasi.",
        strength_rule="STRONG when formed, WEAK otherwise. Ungated.",
        cancellation="—",
        source="Not classical Guru Chandala (Guru+Rahu). Some schools extend the yoga to either node; no printed source claimed for the extension.",
        key_planets=(),
        per_chart_activation="Guru and Ketu (DD-15).",
        secondary_activation="Ketu's dispositor (BPHS node principle; verse to verify).",
        secondary_basis=ActivationBasis.SOURCE_INFERRED,
        note=(
            "Split off `YOG-CH-01` by the 2026-08-28 ruling: **'Guru + Rahu "
            "ONLY. Guru + Ketu = separate [VARIANT] card.'** Same whole-sign, "
            "no-orb test as the Rahu form, applied to Kethu instead. Emitted "
            "unconditionally alongside `CHANDALA_YOGA` on its own card. Activation "
            "(DD-15): Guru and Ketu primary, Ketu's dispositor secondary."
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
            "At least one of Guru, Sukran or Budhan occupies the 10th rasi from "
            "the Lagna **or** the 10th from Chandran. Budhan counts only when no "
            "afflicting malefic (below) shares its sign — **not Suriya**, whose "
            "nearness to Budhan is constant and whose combustion is judged "
            "separately; Chandran never counts (ruling 2026-09-23, amended)."
        ),
        strength_rule=(
            "STRONG when two or more such benefics are found, PARTIAL for one; "
            "then one rung lower when an afflicting malefic casts poorna drishti "
            "on an occupied 10th (recorded as `malefic_aspect_on_10th_<graha>`). "
            "**Afflicting malefics** are one set, `AMALA_AFFLICTING_MALEFICS`, read "
            "by both this test and Budhan's: Sani, Sevvai, Rahu, Ketu and Mandhi. "
            "Nodes per `CORE-10`; Mandhi's 7th aspect per `EC-A21`. Suriya is "
            "excluded: karaka of the 10th with dig bala there."
        ),
        cancellation="None. Malefic aspect weakens, never cancels (ruling 2026-09-23).",
        source="Amala yoga, Phaladeepika — a benefic in the 10th from Lagna or Chandran.",
        key_planets=(),
        per_chart_activation="The benefics occupying the 10th — never the 10th lord.",
        note=(
            "Classical Amala is satisfied by a **single** benefic in that position; "
            "the two-or-more → STRONG rung is Vinaadi's grading, not a source "
            "distinction. Activation (ruling 2026-09-23): the benefics occupying "
            "the 10th, carried per chart in `YogaResult.key_grahas` — never the "
            "10th lord. The old functional-nature `dasha_activated` test is retired."
        ),
    ),
    # ── Adhi ─────────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-AD-01",
        yoga_name="ADHI_BASE",
        name_en="Adhi pattern (base)",
        name_ta="அதி யோக அமைப்பு",
        markers=("VARIANT", "PRODUCT"),
        detector="_yoga_detect.detect_adhi_base",
        present_when=(
            "At least one chart-dynamic benefic among Budhan, Guru and Sukran "
            "occupies the 6th, 7th or 8th rasi from Chandran, and the raja-grade "
            "candidate does not form (when it does, it carries the one Adhi label)."
        ),
        strength_rule=(
            "Base rung by qualifying planets: 3 is STRONG, 2 PARTIAL and 1 WEAK; "
            "then lower for weak/combust formers, malefic contamination, weak "
            "Chandran and impure distribution."
        ),
        cancellation="No base cancellation; adverse factors lower its grade.",
        source="Adhi yoga, BPHS and Phaladeepika — the three benefics in the 6th/7th/8th from Chandran.",
        key_planets=(),
        per_chart_activation="The benefics in the 6th/7th/8th from Chandran.",
        secondary_activation=(
            "Chandran (DD-15, Vinaadi convention). This sits against the 2026-09-23 "
            "ruling that Chandran is the reference, not a trigger — open item O-16."
        ),
        secondary_basis=ActivationBasis.VINAADI_CONVENTION,
        note=(
            "DD-08 separates broad geometry from any raja-grade claim. Geometry "
            "is Tier A; distribution is commentary; Raman's one-strong-planet "
            "sufficiency is recorded separately. Formers activate it; Chandran "
            "is secondary only under O-16."
        ),
    ),
    YogaRule(
        rule_id="YOG-AD-02",
        yoga_name="ADHI_RAJA_GRADE",
        # Owner-ruled wording 2026-10-03 (v1.8): no "candidate"/"grade" engine
        # term in either language.
        name_en="Adhi Yoga (full strength not confirmed)",
        name_ta="அதி யோகம் — முழுப் பலம் உறுதியாகவில்லை",
        markers=("LIMIT", "PRODUCT"),
        detector="_yoga_detect.detect_adhi_raja_grade",
        present_when=(
            "ADHI_BASE forms, no forming benefic is combust, and no serious "
            "malefic affliction is found. O-20 controls whether aspects count."
        ),
        strength_rule="STRONG on clean formation, then gated over forming benefics and Chandran.",
        cancellation="Combustion of a forming benefic or serious malefic affliction makes this candidate absent.",
        source="Candidate synthesis pending Tier-A textual confirmation; not marked TRADITION.",
        key_planets=(),
        per_chart_activation="The forming benefics in the 6th/7th/8th from Chandran.",
        secondary_activation="Chandran under O-16.",
        secondary_basis=ActivationBasis.VINAADI_CONVENTION,
        note="Candidate only; the registry deliberately withholds the TRADITION marker.",
    ),
    # ── Daridra ──────────────────────────────────────────────────────────────
    YogaRule(
        rule_id="YOG-DR-01",
        yoga_name="DARIDRA_YOGA",
        name_en="Daridra Yoga",
        name_ta="தரித்ர யோகம்",
        markers=("TRADITION",),
        detector="_yoga_detect.detect_daridra_yoga",
        present_when=(
            "A **parivartana** between a dusthana lord (6/8/12) and a "
            "house-of-wealth lord (2/11): the dusthana lord occupies the dhana "
            "house **and** that dhana lord occupies that same dusthana. The two "
            "must be different grahas. The weak-plus-malefic condition lives on "
            "`YOG-DR-02`."
        ),
        strength_rule="STRONG when formed, WEAK otherwise.",
        cancellation="—",
        source=(
            "Daridra yogas are a family — variously on the 2nd/11th lords in "
            "dusthanas, the lagna lord in the 6/8/12, and dusthana lords linking "
            "to the dhana houses. **Astrologer ruling, 2026-09-11 chose the "
            "dusthana↔dhana link**, the stronger and rarer member, over the "
            "'11th lord in a dusthana' test this used to implement."
        ),
        key_planets=(),
        per_chart_activation="The 11th lord of this lagna.",
        note=(
            "**Redefined by the 2026-09-11 ruling**, and the *reading* of the "
            "chosen words was settled by measurement rather than taste "
            "(`scripts/daridra_definition_sweep.py`, 200k random charts). The "
            "ruling's stated goal was far fewer false positives; every looser "
            "reading of 'connecting' turned out to fire **more** often than the "
            "rule it replaced — occupation alone 42.1%, conjunction 35.9%, either "
            "63.2%, against the old test's 25.1%. Only the **mutual exchange** "
            "delivers the intent, at **3.9%**. Requiring two distinct grahas is "
            "load-bearing, not tidiness: for lagnas 2, 3, 8, 9 and 12 one graha "
            "owns both a dusthana and a dhana house, so counting shared lordship "
            "as a 'connection' would fire on 100% of those charts from the lagna "
            "alone. Marker moved `[VARIANT]` → `[TRADITION]` — the parivartana "
            "formulation is classical, where the old single-condition test was "
            "one narrow pick from the family. **When a lord's rasi is absent "
            "from the chart map the function silently defaults it to the Lagna "
            "rasi**, which reads as house 1 and so cannot complete an exchange; "
            "every production call site supplies all nine grahas. Adverse yoga. "
            "No *static* key grahas — the detector emits the 11th and 2nd lords "
            "per chart in `YogaResult.key_grahas`, which beats this table."
        ),
    ),
    YogaRule(
        rule_id="YOG-DR-02",
        yoga_name="DARIDRA_PROXY_YOGA",
        name_en="Daridra Yoga (Vinaadi proxy)",
        name_ta="தரித்ர யோகம் (வினாடி அளவுகோல்)",
        markers=("PRODUCT",),
        detector="_yoga_detect.detect_daridra_yoga_proxy",
        present_when="The 11th lord's composite natal score is below 40 **and** a natural malefic other than itself shares its rasi.",
        strength_rule="PARTIAL when formed, WEAK otherwise.",
        cancellation="—",
        source="No source claimed. A Vinaadi proxy, not a classical daridra yoga.",
        key_planets=(),
        per_chart_activation="The 11th lord of this lagna.",
        note=(
            "**Split off `YOG-DR-01` by ruling** ('the weak-and-afflicted proxy is "
            "labelled as ours'), kept rather than dropped. The `< 40` cut-off "
            "reads the composite natal graha score (§3.3.4), a `[PRODUCT]` number, "
            "not a classical strength. Shares the same silent-default behaviour on "
            "a missing 11th-lord rasi as `YOG-DR-01`. Adverse yoga; no key grahas "
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
            "Parāśari form (DD-02, primary): the 9th lord in a **kendra** "
            "(1/4/7/10 — not a trikona) **and** in its own, moolatrikona or "
            "exaltation sign, **and** the lagna lord balāḍhya — "
            "`lagna_lord_strength` at or above the O-8 threshold (60)."
        ),
        strength_rule=(
            "STRONG when formed, then gated over the two lords (2026-08-28 "
            "ruling: 'Presence gated on strength'). WEAK when not formed."
        ),
        cancellation="—",
        source="BPHS 36.27–28 (Santhanam ed.; verse number and 'kendra' wording to verify).",
        key_planets=(),
        per_chart_activation="The 9th lord and the lagna lord (DD-15).",
        note=(
            "**Rewritten by DD-02 (v1.3).** Dignity is mandatory; the old rule — "
            "9th lord in a kendra *or trikona* with both composite scores >= 60 — "
            "was broader than every source. BPHS asks only that the lagna lord be "
            "balāḍhya; Vinaadi's translation of that word is a Tier C strength "
            "model (composite score, a 6/8/12 penalty waived in own/exaltation "
            "sign, a malefic-company penalty, and a cap for debility without "
            "bhanga), threshold O-8. The wire key `LAKSHMI_YOGA` is kept as a "
            "stable identifier for this form. A 9th lord well placed without the "
            f"dignity is `YOG-LK-03`, never this name. {_GATE_NOTE}"
        ),
    ),
    YogaRule(
        rule_id="YOG-LK-02",
        yoga_name="LAKSHMI_YOGA_PHALADEEPIKA",
        name_en="Lakshmi Yoga (Phaladeepika form)",
        name_ta="லக்ஷ்மி யோகம் (பலதீபிகை வடிவம்)",
        markers=("VARIANT",),
        detector="_yoga_detect.detect_lakshmi_yoga_phaladeepika",
        present_when=(
            "The 9th lord **and** Sukran both in their own or exaltation sign, "
            "both in a kendra or trikona from Lagna."
        ),
        strength_rule=f"STRONG when formed, gated over the two. {_GATE_NOTE}",
        cancellation="—",
        source="Phaladeepika 6.21 (verse number to verify).",
        key_planets=(),
        per_chart_activation="The 9th lord and Sukran (DD-15).",
        note=(
            "A lineage variant kept beside the Parāśari form, never blended into "
            "it. **Off in the consumer UI by default** (DD-02): emitted only "
            "when `show_lakshmi_phaladeepika` is on, and only when present."
        ),
    ),
    YogaRule(
        rule_id="YOG-LK-03",
        yoga_name="BHAGYA_SUPPORT",
        name_en="Fortune support",
        name_ta="பாக்கிய ஆதரவு",
        markers=("PRODUCT",),
        detector="_yoga_detect.detect_bhagya_support",
        present_when=(
            "The 9th lord in a kendra or trikona from Lagna **without** its own, "
            "moolatrikona or exaltation sign."
        ),
        strength_rule=f"PARTIAL when formed, gated over the 9th lord. {_GATE_NOTE}",
        cancellation="—",
        source="No source claimed. DD-02's honest fallback label, Tier C.",
        key_planets=(),
        per_chart_activation="The 9th lord.",
        note=(
            "Principle 5 of the decision file — strict name, honest fallback: "
            "partial Lakshmi geometry gets its own label instead of the yoga's "
            "name. Emitted only when present. Two cases stay unlabelled under the "
            "literal DD-02 text — a dignified 9th lord in a trikona only, and a "
            "dignified 9th lord in a kendra with a lagna lord below threshold "
            "(open item O-17)."
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
        per_chart_activation="The planets in the 2nd from Chandran (DD-15).",
        activation_basis=ActivationBasis.SOURCE_EXPLICIT,
        secondary_activation="Chandran (DD-15, Vinaadi convention; open item O-16).",
        secondary_basis=ActivationBasis.VINAADI_CONVENTION,
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
        per_chart_activation="The planets in the 12th from Chandran (DD-15).",
        secondary_activation="Chandran (DD-15, Vinaadi convention; open item O-16).",
        secondary_basis=ActivationBasis.VINAADI_CONVENTION,
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
        per_chart_activation="The planets on both sides of Chandran (DD-15).",
        secondary_activation="Chandran (DD-15, Vinaadi convention; open item O-16).",
        secondary_basis=ActivationBasis.VINAADI_CONVENTION,
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
            "rasi (3/6/10/11) counted from **either the Lagna or Chandran** "
            "(2026-08-28 ruling: 'Lagna-or-Moon')."
        ),
        strength_rule="STRONG at three or more, PARTIAL at two.",
        cancellation="—",
        source="Vasumati yoga — benefics in the upachayas.",
        key_planets=(),
        per_chart_activation="Each qualifying benefic in the upachayas (DD-15).",
        note=(
            "**Widened by ruling from Chandran-only.** Each graha counts once if "
            "*either* reference places it in an upachaya — the union, not the "
            "intersection. Chandran was previously inert in the candidate set (it "
            "is always the 1st from itself, so it could never satisfy a "
            "Chandran-only test); it is no longer inert now that the Lagna "
            "reference is live, since Chandran can stand in an upachaya from the "
            "Lagna. The 2-and-3 rungs are Vinaadi's."
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
