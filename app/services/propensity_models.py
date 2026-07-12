"""Life-propensity models — the "Chances & Cautions" feature.

A propensity is a *tendency* the birth chart leans toward, expressed as an
ordinal LEVEL (never a percentage — doctrine D2) with the astrological
factors behind it, what helps, and — for sensitive areas — an explicit
caution and support framing.

Two tiers, following the reasoning-kernel doctrine (app/reasoning/verdict.py):

  CHANCE  — a positive/actionable leaning (love, higher education, a career
            mode, a government-service path). Levels read as opportunity.
  CAUTION — a "be-mindful season" (relationship strain, job disruption,
            accident-care, emotional load, …). Reframed as *watchfulness
            with what-to-do*, never as fate. No mortality/diagnosis claims,
            ever (see WELLBEING disclaimers below).

The two tiers use different LEVEL vocabularies so a "high" caution never
reads as doom:

  CHANCE  levels:  STRONG · PROMISING · MIXED · LIMITED · QUIET
  CAUTION levels:  STEADY · WATCHFUL · EXTRA_CARE · QUIET

QUIET == the chart is silent (D3: silence is not denial).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from enum import StrEnum

# BiText / AstroFactor are shared with the existing prediction models so the
# web layer can reuse its bilingual rendering unchanged.
from app.services.life_area_prediction_models import AstroFactor, BiText


class PropensityCategory(StrEnum):
    RELATIONSHIPS = "RELATIONSHIPS"
    EDUCATION = "EDUCATION"
    CAREER = "CAREER"
    WELLBEING = "WELLBEING"
    # Phase 3 — Bhava 7 (Kalatra) governs both marriage AND business
    # partnership classically, so both live under one grouping.
    MARRIAGE = "MARRIAGE"
    WEALTH = "WEALTH"
    # Foreign/settlement (Bhava 12) + the Bhava-6 suite (litigation,
    # debt, competitive edge) — distinct "life circumstance" topics that
    # don't fit the four original categories.
    LIFE_PATH = "LIFE_PATH"


class PropensityTier(StrEnum):
    CHANCE = "CHANCE"
    CAUTION = "CAUTION"
    # Phase 3 §4.3 — a single descriptive synthesis card (Swabhava). No
    # pro/con grading: always-present traits framed as tendencies with a
    # growth edge, never a verdict.
    PROFILE = "PROFILE"


class ChanceLevel(StrEnum):
    STRONG = "STRONG"
    PROMISING = "PROMISING"
    MIXED = "MIXED"
    LIMITED = "LIMITED"
    QUIET = "QUIET"


class CautionLevel(StrEnum):
    STEADY = "STEADY"          # well-supported — little to watch
    WATCHFUL = "WATCHFUL"      # a factor or two — stay mindful
    EXTRA_CARE = "EXTRA_CARE"  # several factors — deserves attention + support
    QUIET = "QUIET"            # insufficient signal (D3)


@dataclass(frozen=True, slots=True)
class PropensityResult:
    """One propensity card.

    `level` is a `ChanceLevel` or `CautionLevel` *value* (string) chosen by
    tier. `band` carries the internal reasoning-kernel Band for logging /
    calibration only — it must not surface in user copy (D2).
    """

    key: str
    category: PropensityCategory
    tier: PropensityTier
    title: BiText
    level: str
    summary: BiText
    # The astrological "why", reusing the existing factor shape. status is
    # one of SUPPORT / CAUTION / NEUTRAL so the UI can tint each row.
    factors: list[AstroFactor]
    # Concrete, non-fatalistic guidance — remedial or behavioural.
    what_helps: list[BiText]
    # Optional "when to be mindful" timing window (dasha/transit driven).
    window_note: BiText | None = None
    timing_window_start: date | None = None
    timing_window_end: date | None = None
    # Sensitive-tier framing.
    disclaimer: BiText | None = None
    # True → render the mental-health / support-resources block.
    show_support_resources: bool = False
    # Age-gating: when the propensity is not relevant to this life stage we
    # still return the card but mark it deferred with a gentle reason.
    deferred: bool = False
    deferred_reason: BiText | None = None
    # Internal only (D2) — never rendered.
    band: str | None = None


@dataclass(frozen=True, slots=True)
class PropensityBundle:
    """The full grouped payload for a chart."""

    generated_for: str  # relationship_to_owner ("self", "spouse", …)
    life_stage: str
    results: list[PropensityResult] = field(default_factory=list)


# ── Reusable disclaimers (bilingual, doctrine-compliant) ─────────────────────
# Written once so every sensitive card speaks with the same careful voice.

DISCLAIMER_WELLBEING = BiText(
    ta=(
        "இது மருத்துவ அல்லது உளவியல் கண்டறிதல் அல்ல. ஜோதிடம் ஒரு போக்கை மட்டுமே "
        "சுட்டிக்காட்டுகிறது — அது விதி அல்ல. கவலை தொடர்ந்தால் நம்பகமான நபரிடம் "
        "அல்லது மருத்துவ நிபுணரிடம் பேசுங்கள்."
    ),
    en=(
        "This is not a medical or psychological diagnosis. Astrology points to a "
        "tendency only — it is not destiny. If the feeling persists, please talk "
        "to someone you trust or a health professional."
    ),
)

DISCLAIMER_SAFETY = BiText(
    ta=(
        "இது எச்சரிக்கை கவனத்திற்கான காலம் மட்டுமே — நிச்சயமான நிகழ்வு அல்ல. "
        "வழக்கமான பாதுகாப்பு நடவடிக்கைகளுடன் அமைதியாக இருங்கள்."
    ),
    en=(
        "This is a season for extra care, not a certain event. Stay calm and keep "
        "your usual safety habits."
    ),
)

DISCLAIMER_FERTILITY = BiText(
    ta=(
        "இது மருத்துவ ஆலோசனையை மாற்றாது. குழந்தை பேறு தொடர்பான கேள்விகளுக்கு "
        "மருத்துவ நிபுணரை அணுகுவதே சிறந்தது."
    ),
    en=(
        "This does not replace medical advice. For anything about conception, a "
        "doctor is the right guide."
    ),
)

DISCLAIMER_LOSS = BiText(
    ta=(
        "இது ஒரு நிதி/வாழ்க்கை எச்சரிக்கை காலம் மட்டுமே — இது எந்த குறிப்பிட்ட "
        "துயரத்தையும் கணிக்கவில்லை. முன்னெச்சரிக்கை (சேமிப்பு, காப்பீடு) "
        "மட்டுமே இதன் நோக்கம்."
    ),
    en=(
        "This flags a season for prudence only — it does not predict any specific "
        "misfortune. Its whole purpose is foresight: reserves, insurance, and not "
        "over-extending."
    ),
)

DISCLAIMER_LEGAL = BiText(
    ta=(
        "இது ஒரு பொது எச்சரிக்கை காலம் மட்டுமே — இது எந்த குறிப்பிட்ட வழக்கு "
        "அல்லது முடிவையும் கணிக்கவில்லை. சட்ட விவகாரங்களுக்கு ஒரு தகுதிவாய்ந்த "
        "வழக்கறிஞரையே அணுகவும்."
    ),
    en=(
        "This flags a general season for care only — it does not predict any "
        "specific case or outcome. For real legal matters, a qualified lawyer is "
        "the right guide, not this chart."
    ),
)
