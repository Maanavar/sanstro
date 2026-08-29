"""Kuligai (Gulika Kalam) polarity — EC-RULING-07, owner-ruled 2026-08-17.

Kuligai was treated across this engine as one of the three inauspicious kalams
alongside Rahu Kalam and Yamagandam, and excluded wholesale. Tamil practice does
not say that. Kuligai **repeats** whatever is begun in it: an act started in
Kuligai comes round again and again.

That single property decides the sign, and it cuts both ways:

* buying gold in Kuligai is **good** — you buy gold again, and again;
* marrying in Kuligai is **bad** — you marry again, and again.

Both examples are the owner's, and they give the discriminator this table is
built on. The question is never "is the act auspicious?" but:

    **Does repeating this act ADD to a stock, or does it mean the first one came
    UNDONE?**

Buy gold twice and you hold twice the gold — it adds. Marry twice and the first
marriage ended — it came undone. Harvest again: adds. Move into a house again:
you left the first one. Start a job again: the first job did not hold. Take
medicine again: the illness came back. Carry a body to the cremation ground
again: a second death, which is exactly why the tradition forbids that one
(Jothidam p.152, the passage that also states Kuligai is "generally described in
texts as a good or auspicious period").

So the samskaras are all ADVERSE, not because they are inauspicious — they are
the most auspicious acts there are — but because each is meant to happen once
per person. A second naming, a second ear-boring, a second upanayanam means the
first did not stand.

**Where this departs from Kalaprakasika, deliberately. MEDICAL is `[LINEAGE]`,
and the page that contradicts us is cited here on purpose.**

Kalaprakasika **printed p. 192** puts medical treatment on Gulika's favourable
list in so many words — eighteen acts for which *"Gulika has no evil force. It
is a benefic"*, **medical treatment among them**. We rule the opposite: under
the Tamil repetition rule, treatment recurring means illness recurring.

**ASTROLOGER RULING 2026-08-28 (`MUH-06`): keep MEDICAL adverse, relabel
`[LINEAGE]`, and cite p. 192 as a counter-citation.** The divergence stands with
the page in hand — it is not an extraction gap that better reading would close.
What changes is the honesty of the record: this rule now carries the printed
sentence that argues against it, next to itself. **A rule that names its own
counter-evidence is the pattern to copy** — the failure this file exists to
prevent is a Tamil override quietly wearing a Sanskrit source's authority, and
the inverse failure is an override that hides the page it overrode.

SPIRITUAL is FAVOURABLE, and **since the full book arrived it is quoted, not
merely reasoned.** p. 192's same favourable list names *worship of fire,
initiation, installation, the study of the Vedas* and *making eyes on the image
of a Deity* — five spiritual acts, in print, on Gulika's benefic side. The
earlier reasoning still holds and now has corroboration rather than standing
alone: worship repeated is the point of worship, the same source has devotees
performing special abhisheka *during* Rahu Kalam and Yamagandam (Jothidam p.81),
and it recommends Rahu Kalam for Amman worship (p.257). The inauspicious kalams
are used for propitiation, not avoided for it.

**So p. 192 settles the two divergences in opposite directions**, which is worth
noticing: it closes SPIRITUAL by agreeing with us, and it confirms MEDICAL as a
knowing departure by disagreeing. Neither outcome was available before the page
was read, and neither is a reason to import the chapter wholesale — p. 198 has
the book itself saying its chapters are regionally variable.

RULE_SOURCE: Jothidam p.152 (the multiplying mechanism, and the cremation case);
owner ruling 2026-08-17 (gold favourable, marriage adverse, and the instruction
to extend the same reasoning to every activity). Kalaprakasika p. 192 for the
eighteen-item favourable list — SPIRITUAL's supporting citation and MEDICAL's
counter-citation, both from that one page; astrologer ruling 2026-08-28 keeping
MEDICAL adverse as `[LINEAGE]` with the counter-citation recorded.
"""
from __future__ import annotations

from enum import Enum


class KuligaiPolarity(str, Enum):  # noqa: UP042 — str-mixin enum, repo convention
    """How Kuligai's repeating quality bears on a given activity."""

    #: Repetition adds to a stock — Kuligai helps, and is worth preferring.
    FAVOURABLE = "FAVOURABLE"
    #: Repetition means the first one came undone — Kuligai harms.
    ADVERSE = "ADVERSE"
    #: Some contextual factor cancels the effect either way.
    NEUTRALISED = "NEUTRALISED"
    #: No sourced classification. Distinct from NEUTRALISED on purpose: "the text
    #: settles this as neutral" and "we have no reading" must never render alike.
    UNSPECIFIED = "UNSPECIFIED"


#: Repeating the act ADDS to a stock. Kuligai is actively good for these.
FAVOURABLE: frozenset[str] = frozenset({
    # Acquisition and wealth — the owner's gold case and its whole class.
    "GOLD",
    "GEMS",
    "NEW_ORNAMENT",
    "NEW_CLOTHES",
    "TREASURE_STORE",
    "GRAIN",
    "PURCHASE",
    "INVESTMENT",
    # Land and livestock — buying again means owning more.
    "LAND_PURCHASE",
    "LAND_POSSESSION",
    "CATTLE_PURCHASE",
    # Agriculture — the cycle is *meant* to come round again.
    "SOWING",
    "TILLAGE",
    "AGRICULTURE_START",
    "HARVEST",
    "HARVEST_INGATHERING",
    "NEW_GRAIN_MEAL",
    # Worship repeated is the point of worship — and p. 192 puts five spiritual
    # acts on Gulika's favourable list in print, so this is quoted, not inferred.
    "SPIRITUAL",
})

#: Repeating the act means the first one came UNDONE. Kuligai is bad for these.
ADVERSE: frozenset[str] = frozenset({
    # The owner's marriage case, and the bath rite that belongs to it.
    "MARRIAGE",
    "SNAANA",
    # One-per-person samskaras. Auspicious acts, but a second one means the
    # first did not stand.
    "NAMING_CEREMONY",
    "MILK_FEEDING",
    "ANNAPRASANA",
    "EAR_BORING",
    "TONSURE",
    "UPANAYANAM",
    "SEEMANTHAM",
    "LYING_IN_CHAMBER",
    "MANTRA_INITIATION",
    # Beginning study again means the study was broken off.
    "VIDYARAMBHAM",
    "EDUCATION_START",
    "VEDA_STUDY",
    # Starting work again means the work did not hold.
    "JOB_START",
    # Sitting the exam again means it was not passed.
    "EXAM",
    # Treatment recurring is illness recurring. [LINEAGE] — this is a KNOWING
    # divergence from Kalaprakasika p. 192, which puts medical treatment on
    # Gulika's favourable list in print. Ruled 2026-08-28: divergence stands,
    # counter-citation recorded. See the module docstring; do not "correct" this
    # entry to FAVOURABLE by finding p. 192.
    "MEDICAL",
    # Setting out again means the journey had to be made over.
    "TRAVEL",
    # Outflow repeated empties the store; the inverse of accumulation.
    "GRAIN_EXPENDITURE",
})

#: Contexts that cancel the polarity either way. None sourced yet.
NEUTRALISED: frozenset[str] = frozenset()

#: The owner has ruled the table, so it no longer ships as an open gap.
KULIGAI_ACTIVITY_TABLE_UNVERIFIED = False


def polarity_for(activity: str) -> KuligaiPolarity:
    """Kuligai's polarity for one activity.

    UNSPECIFIED is returned only for an activity nobody has classified, and it
    must never be read as rejection — defaulting to reject is exactly the
    blanket exclusion EC-RULING-07 identifies as the defect.
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
    """Whether a Kuligai overlap should count against this activity."""
    return polarity_for(activity) is KuligaiPolarity.ADVERSE


def favours(activity: str) -> bool:
    """Whether a Kuligai overlap is a positive for this activity.

    The half of the ruling a rejection-only model cannot express: Kuligai is not
    merely tolerable for buying gold, it is the preferred time for it.
    """
    return polarity_for(activity) is KuligaiPolarity.FAVOURABLE
