"""Shared Tamil verdict lexicon (C-5).

One canonical quality ladder used across the customer-facing verdict surfaces so
a user moving between Today, Life-Areas / prediction, Family compatibility
(synastry), and Porutham meets the SAME Tamil verdict vocabulary for the same
quality tier — even though each domain keeps its own internal enum and its own
tier *count* (C-5 explicitly accepts differing tier counts; only the shared
verdict *word family* unifies).

Rungs (best → needs-caution) and their shared adjective root:

    EXCELLENT   மிகச் சிறந்த   (Excellent)
    GOOD        நல்ல          (Good)
    BALANCED    சமநிலையான     (Balanced / steady)
    CAUTION     கவனம் தேவை     (Needs care)

Each surface composes the shared root with its own noun (நாள் / பொருத்தம் /
இணக்கம்) so the phrase reads naturally in context rather than as a bare
adjective. Two deliberate per-domain exceptions, native-approved 2026-07-14:
  • daily RESTORATIVE → ஓய்வு நாள் (a rest day is gentle, not a caution).
  • synastry/prediction "mixed" middle tier → கலப்பான (mixed) rather than
    சமநிலையான (steady) — a mixed relationship/period is a different meaning
    from a calm, even day.

Native-Tamil approved in the live astrologer session 2026-07-14 (C-5).
The web mirror of this table is `web/lib/verdict-lexicon.ts` — keep the two in
sync when either changes (they are a hand-maintained pair, not generated).
"""
from __future__ import annotations

from enum import Enum


class VerdictRung(str, Enum):
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    BALANCED = "BALANCED"
    CAUTION = "CAUTION"


# Shared adjective root per rung — the through-line every surface shares.
VERDICT_ROOT_TA: dict[VerdictRung, str] = {
    VerdictRung.EXCELLENT: "மிகச் சிறந்த",
    VerdictRung.GOOD: "நல்ல",
    VerdictRung.BALANCED: "சமநிலையான",
    VerdictRung.CAUTION: "கவனம் தேவை",
}
VERDICT_ROOT_EN: dict[VerdictRung, str] = {
    VerdictRung.EXCELLENT: "Excellent",
    VerdictRung.GOOD: "Good",
    VerdictRung.BALANCED: "Balanced",
    VerdictRung.CAUTION: "Needs care",
}

# Each domain's internal tier enum → shared rung. Tier COUNTS stay per-domain;
# only the shared verdict word family unifies. Used for severity/colour parity.
DOMAIN_RUNGS: dict[str, dict[str, VerdictRung]] = {
    "daily": {
        "STRONG_SUPPORT": VerdictRung.EXCELLENT,
        "GOOD": VerdictRung.GOOD,
        "BALANCED": VerdictRung.BALANCED,
        "CAUTION": VerdictRung.CAUTION,
        "RESTORATIVE": VerdictRung.CAUTION,  # severity rung; display word is special (ஓய்வு நாள்)
    },
    "prediction": {
        "EXCEPTIONAL": VerdictRung.EXCELLENT,
        "STRONG": VerdictRung.GOOD,
        "GOOD": VerdictRung.GOOD,
        "MIXED": VerdictRung.BALANCED,
        "DIFFICULT": VerdictRung.CAUTION,
        "VERY_WEAK": VerdictRung.CAUTION,
    },
    "synastry": {
        "SUPPORTIVE": VerdictRung.GOOD,
        "MIXED": VerdictRung.BALANCED,
        "CAREFUL": VerdictRung.CAUTION,
    },
    "porutham": {
        "EXCELLENT": VerdictRung.EXCELLENT,
        "GOOD": VerdictRung.GOOD,
        "AVERAGE": VerdictRung.BALANCED,
        "CAUTION": VerdictRung.CAUTION,
    },
}

# Composed verdict phrase shown to the user, per domain label — (ta, en).
# Encoded directly (not composed programmatically) because of the two approved
# irregularities above; a direct table is clearer and less error-prone.
VERDICT_PHRASE: dict[str, dict[str, tuple[str, str]]] = {
    "daily": {
        "STRONG_SUPPORT": ("மிகச் சிறந்த நாள்", "Excellent day"),
        "GOOD": ("நல்ல நாள்", "Good day"),
        "BALANCED": ("சமநிலையான நாள்", "Balanced day"),
        "CAUTION": ("கவனம் தேவை", "Needs care"),
        "RESTORATIVE": ("ஓய்வு நாள்", "Rest day"),
    },
    "porutham": {
        "EXCELLENT": ("மிகச் சிறந்த பொருத்தம்", "Excellent match"),
        "GOOD": ("நல்ல பொருத்தம்", "Good match"),
        "AVERAGE": ("சமநிலையான பொருத்தம்", "Balanced match"),
        "CAUTION": ("கவனம் தேவை", "Needs care"),
    },
    "synastry": {
        "SUPPORTIVE": ("நல்ல இணக்கம்", "Good harmony"),
        "MIXED": ("கலப்பான இணக்கம்", "Mixed harmony"),
        "CAREFUL": ("கவனம் தேவை", "Needs care"),
    },
}


def verdict_rung(domain: str, label: str) -> VerdictRung | None:
    """Shared quality rung for a domain's internal tier label, or None."""
    return DOMAIN_RUNGS.get(domain, {}).get(label)


def verdict_phrase(domain: str, label: str, lang: str = "ta") -> str | None:
    """Composed, context-appropriate verdict phrase for a domain label.

    Returns None for domains that carry the verdict inside full sentences
    (e.g. ``prediction``) rather than a single phrase slot.
    """
    entry = VERDICT_PHRASE.get(domain, {}).get(label)
    if entry is None:
        return None
    return entry[0] if lang == "ta" else entry[1]
