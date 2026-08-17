"""Kuligai (Gulika Kalam) polarity — EC-RULING-07.

Kuligai is treated across this engine as one of the three inauspicious kalams,
alongside Rahu Kalam and Yamagandam, and excluded wholesale. The source does not
say that. It describes Gulika Kalam as a period that **multiplies** whatever is
undertaken in it — excellent for what you want repeated or increased, ruinous for
what you do not. That is the same activity-polarity primitive the muhurta engine
already honours for Marana Yogam (EC-A08): a factor's sign depends on the intent
of the act, not on the factor alone. It is also why the tradition forbids
carrying a body to the cremation ground during Gulika Kalam while permitting —
indeed favouring — acts of accumulation.

**What ships here is the mechanism, deliberately with empty tables.**

EC-RULING-07 is explicit that the candidate favourable-activity list (harvest,
trade, debt liquidation, medical treatment, installation, land gifts) came from
synthesis rather than a quoted passage, and must be verified against a direct
reading of p.152 before it earns a `RULE_SOURCE`. So the seam is built and
nothing is classified: every activity resolves to UNSPECIFIED today, and
UNSPECIFIED means *do not reject* — which is the one part of the ruling that is
already actionable, because it names the current blanket exclusion as the defect.

Populating `FAVOURABLE` / `ADVERSE` later is a data change with no code change.

RULE_SOURCE: p.152 (mechanism); activity table pending verbatim confirmation.
"""
from __future__ import annotations

from enum import Enum


class KuligaiPolarity(str, Enum):  # noqa: UP042 — str-mixin enum, repo convention
    """How Kuligai's multiplying quality bears on a given activity."""

    #: The act is one of accumulation/increase — multiplication helps.
    FAVOURABLE = "FAVOURABLE"
    #: The act is one nobody wants repeated — multiplication harms.
    ADVERSE = "ADVERSE"
    #: Some contextual factor cancels the effect either way.
    NEUTRALISED = "NEUTRALISED"
    #: No sourced classification. Distinct from NEUTRALISED on purpose: "the text
    #: settles this as neutral" and "we have no reading" must never render alike.
    UNSPECIFIED = "UNSPECIFIED"


#: Activities the source marks as favoured during Kuligai. EMPTY pending p.152.
FAVOURABLE: frozenset[str] = frozenset()

#: Activities the source marks as harmed during Kuligai. EMPTY pending p.152.
ADVERSE: frozenset[str] = frozenset()

#: Contexts that cancel the polarity. EMPTY pending p.152.
NEUTRALISED: frozenset[str] = frozenset()

#: True while the activity table is unpopulated, so a surface can say the
#: mechanism exists but is not yet classifying rather than implying a verdict.
KULIGAI_ACTIVITY_TABLE_UNVERIFIED = True

KULIGAI_GAP = (
    "Kuligai polarity mechanism is live but classifies nothing: the favourable/"
    "adverse activity lists are unverified against p.152 and ship empty."
)


def polarity_for(activity: str) -> KuligaiPolarity:
    """Kuligai's polarity for one activity.

    Returns UNSPECIFIED for everything until the p.152 table is confirmed, and
    UNSPECIFIED must never be read as rejection — that default is exactly the
    behaviour EC-RULING-07 identifies as wrong.
    """
    key = (activity or "").strip().upper()
    if key in NEUTRALISED:
        return KuligaiPolarity.NEUTRALISED
    if key in FAVOURABLE:
        return KuligaiPolarity.FAVOURABLE
    if key in ADVERSE:
        return KuligaiPolarity.ADVERSE
    return KuligaiPolarity.UNSPECIFIED


def rejects(activity: str) -> bool:
    """Whether a Kuligai overlap should count against this activity at all.

    The single most important line in this module. Today it is False for every
    activity, because nothing is classified and UNSPECIFIED does not reject.
    """
    return polarity_for(activity) is KuligaiPolarity.ADVERSE
