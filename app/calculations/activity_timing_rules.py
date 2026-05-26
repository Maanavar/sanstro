"""
Thirukanitham-sourced activity timing rules.

Maps goal/activity types against Panchangam elements to determine whether
today's timing supports, opposes, or is neutral for a given activity.

Rules are sourced from Tamil Jyothidam tradition (Thirukanitham) and the
formula engine specification. This module is purely deterministic — no LLM,
no randomness. It returns a structured assessment that callers use to enrich
narrative text without altering the core score computation.

Paksha semantics (Thirukanitham):
  SHUKLA (Valarpirai, tithis 1-15) — waxing moon, favoured for all new beginnings,
    growth, marriage, business launch, property purchase, education start.
  KRISHNA (Theipirai, tithis 16-30) — waning moon, favoured for completion,
    debt clearance, surgery, destructive/reduction tasks, spiritual inward work.

Tithi groups:
  RIKTA (4, 9, 14, 19, 24, 29)         — inauspicious for beginnings; ok for
                                           routine/completion tasks.
  HEAVY (8, 23, 30)                     — Ashtami/Amavasai; mild caution for all;
                                           avoid major financial and social events.
  EKADASI (11, 26)                      — sacred fasting tithi; excellent for
                                           spiritual, mildly restrictive for business.
  POURNAMI (15)                         — peak of Shukla; excellent for all good work.
  AUSPICIOUS (2, 3, 5, 6, 7, 10, 12,   — generally favourable for most activity types.
              13, 16, 17, 20, 21, 22)

Weekday guidance (Thirukanitham tradition):
  SUNDAY   — good for authority/career; avoid marriage start.
  MONDAY   — excellent for family, marriage, travel; neutral for business.
  TUESDAY  — good for courage/surgery/legal; avoid new financial ventures.
  WEDNESDAY — excellent for education, negotiation, business communication.
  THURSDAY — excellent for all beginnings; best for spiritual, education, marriage.
  FRIDAY   — excellent for marriage, relationships, creative; good for money.
  SATURDAY — good for discipline/property/debt; unfavourable for new ventures,
              travel, marriage start.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ActivityType = Literal[
    "job_change", "business_start", "marriage", "education",
    "property", "health", "travel_abroad", "spiritual",
    "family_harmony", "money", "child_birth", "other",
]

Alignment = Literal["SUPPORTS", "NEUTRAL", "CAUTION"]


@dataclass(frozen=True)
class TimingSignal:
    alignment: Alignment
    reason_ta: str
    reason_en: str


@dataclass(frozen=True)
class ActivityTimingResult:
    paksha_signal: TimingSignal
    tithi_signal: TimingSignal
    weekday_signal: TimingSignal
    combined_alignment: Alignment
    combined_ta: str
    combined_en: str


# ── Paksha rules ───────────────────────────────────────────────────────────────

# Activities that strongly need Valarpirai (Shukla paksha) for new starts.
_NEEDS_SHUKLA: set[ActivityType] = {
    "business_start", "marriage", "child_birth", "property", "travel_abroad", "job_change",
}
# Activities that are meaningful or better in Krishna paksha.
_BENEFITS_KRISHNA: set[ActivityType] = {"spiritual", "health"}
# Neutral paksha (works in either).
_PAKSHA_NEUTRAL: set[ActivityType] = {"education", "money", "family_harmony", "other"}


def _assess_paksha(activity: ActivityType, paksha: str) -> TimingSignal:
    is_shukla = paksha == "SHUKLA"

    if activity in _NEEDS_SHUKLA:
        if is_shukla:
            return TimingSignal(
                alignment="SUPPORTS",
                reason_ta="வளர்பிறை காலம் — புதிய தொடக்கங்களுக்கு சிறந்தது.",
                reason_en="Valarpirai (waxing moon) — ideal for new beginnings.",
            )
        return TimingSignal(
            alignment="CAUTION",
            reason_ta="தேய்பிறை காலம் — இந்த செயலுக்கு வளர்பிறை நாட்களை தேர்வு செய்யுங்கள்.",
            reason_en="Theipirai (waning moon) — prefer Valarpirai days for this activity.",
        )

    if activity in _BENEFITS_KRISHNA:
        if not is_shukla:
            return TimingSignal(
                alignment="SUPPORTS",
                reason_ta="தேய்பிறை காலம் — ஆன்மீக மற்றும் உள்நோக்கிய சேவைகளுக்கு சாதகம்.",
                reason_en="Theipirai — favourable for spiritual and inward-focused activities.",
            )
        return TimingSignal(
            alignment="NEUTRAL",
            reason_ta="வளர்பிறை காலம் — இந்த செயலுக்கு இரு பக்கமும் பயனளிக்கும்.",
            reason_en="Valarpirai — either paksha is workable for this activity.",
        )

    return TimingSignal(
        alignment="NEUTRAL",
        reason_ta="பக்ஷம் இந்த செயலுக்கு நடுநிலையாக உள்ளது.",
        reason_en="Paksha is neutral for this activity.",
    )


# ── Tithi rules ────────────────────────────────────────────────────────────────

_RIKTA_TITHIS = {4, 9, 14, 19, 24, 29}
_HEAVY_TITHIS = {8, 23, 30}
_EKADASI_TITHIS = {11, 26}
_POURNAMI = {15}
# Activities where even Rikta tithis are acceptable (completion/reduction tasks).
_RIKTA_OK: set[ActivityType] = {"health", "spiritual", "family_harmony", "money", "other"}
# Activities harmed by heavy tithis (Ashtami, Amavasai).
_HEAVY_SENSITIVE: set[ActivityType] = {
    "marriage", "business_start", "property", "travel_abroad", "child_birth", "job_change",
}


def _assess_tithi(activity: ActivityType, tithi_number: int) -> TimingSignal:
    if tithi_number in _POURNAMI:
        return TimingSignal(
            alignment="SUPPORTS",
            reason_ta="பௌர்ணமி திதி — அனைத்து நல்ல செயல்களுக்கும் சிறந்த நேரம்.",
            reason_en="Pournami tithi — excellent for all auspicious activities.",
        )

    if tithi_number in _EKADASI_TITHIS:
        if activity == "spiritual":
            return TimingSignal(
                alignment="SUPPORTS",
                reason_ta="ஏகாதசி திதி — ஆன்மீக செயல்களுக்கு மிகவும் சாதகம்.",
                reason_en="Ekadasi tithi — highly favourable for spiritual activities.",
            )
        return TimingSignal(
            alignment="NEUTRAL",
            reason_ta="ஏகாதசி திதி — நடுநிலை; ஆன்மீக செயல்களில் கவனம் செலுத்துங்கள்.",
            reason_en="Ekadasi tithi — neutral; focus on spiritual observance today.",
        )

    if tithi_number in _RIKTA_TITHIS:
        if activity in _RIKTA_OK:
            return TimingSignal(
                alignment="NEUTRAL",
                reason_ta=f"ரிக்த திதி {tithi_number} — புதிய தொடக்கங்களை தவிர்க்கவும்; தொடர்ந்து வரும் பணிகள் சரி.",
                reason_en=f"Rikta tithi {tithi_number} — avoid new starts; continuing tasks are fine.",
            )
        return TimingSignal(
            alignment="CAUTION",
            reason_ta=f"ரிக்த திதி {tithi_number} — இந்த செயலுக்கு புதிய தொடக்கம் சாதகமில்லை.",
            reason_en=f"Rikta tithi {tithi_number} — not favourable for new starts of this activity.",
        )

    if tithi_number in _HEAVY_TITHIS:
        tithi_name = "அஷ்டமி" if tithi_number in {8, 23} else "அமாவாசை"
        tithi_name_en = "Ashtami" if tithi_number in {8, 23} else "Amavasai"
        if activity in _HEAVY_SENSITIVE:
            return TimingSignal(
                alignment="CAUTION",
                reason_ta=f"{tithi_name} திதி — முக்கிய சமூக மற்றும் நிதி முடிவுகளை இன்று தவிர்க்கவும்.",
                reason_en=f"{tithi_name_en} tithi — avoid major social and financial decisions today.",
            )
        return TimingSignal(
            alignment="NEUTRAL",
            reason_ta=f"{tithi_name} திதி — சாதாரண பணிகள் தொடரலாம்; பெரிய புதிய தொடக்கங்கள் வேண்டாம்.",
            reason_en=f"{tithi_name_en} tithi — routine tasks are fine; avoid major new beginnings.",
        )

    # Auspicious tithi.
    return TimingSignal(
        alignment="SUPPORTS",
        reason_ta=f"திதி {tithi_number} — சாதகமான திதி.",
        reason_en=f"Tithi {tithi_number} — favourable tithi.",
    )


# ── Weekday rules ──────────────────────────────────────────────────────────────

# weekday lord -> set of activities that get SUPPORTS on this day
_WEEKDAY_SUPPORTS: dict[str, set[ActivityType]] = {
    "SUN":     {"job_change", "health", "spiritual", "other"},
    "MOON":    {"marriage", "family_harmony", "travel_abroad", "child_birth"},
    "MARS":    {"health", "property", "job_change"},
    "MERCURY": {"education", "business_start", "money", "other"},
    "JUPITER": {"marriage", "education", "spiritual", "child_birth", "family_harmony",
                "business_start", "travel_abroad", "money", "job_change"},
    "VENUS":   {"marriage", "money", "family_harmony", "child_birth"},
    "SATURN":  {"property", "health"},
}

# weekday lord -> set of activities that get CAUTION on this day
_WEEKDAY_CAUTION: dict[str, set[ActivityType]] = {
    "SUN":     {"marriage"},
    "MARS":    {"marriage", "money", "business_start"},
    "SATURN":  {"marriage", "business_start", "travel_abroad", "child_birth"},
}

_WEEKDAY_LORD_DISPLAY: dict[str, tuple[str, str]] = {
    "SUN":     ("ஞாயிறு", "Sunday"),
    "MOON":    ("திங்கள்", "Monday"),
    "MARS":    ("செவ்வாய்", "Tuesday"),
    "MERCURY": ("புதன்", "Wednesday"),
    "JUPITER": ("வியாழன்", "Thursday"),
    "VENUS":   ("வெள்ளி", "Friday"),
    "SATURN":  ("சனி", "Saturday"),
}


def _assess_weekday(activity: ActivityType, weekday_lord: str) -> TimingSignal:
    lord = weekday_lord.upper()
    day_ta, day_en = _WEEKDAY_LORD_DISPLAY.get(lord, (lord, lord))

    if activity in _WEEKDAY_CAUTION.get(lord, set()):
        return TimingSignal(
            alignment="CAUTION",
            reason_ta=f"{day_ta}க்கிழமை இந்த செயலுக்கு திருகாணிதம் படி சாதகமில்லை.",
            reason_en=f"{day_en} is traditionally less favourable for this activity per Thirukanitham.",
        )

    if activity in _WEEKDAY_SUPPORTS.get(lord, set()):
        return TimingSignal(
            alignment="SUPPORTS",
            reason_ta=f"{day_ta}க்கிழமை இந்த செயலுக்கு சாதகமான நாள்.",
            reason_en=f"{day_en} is traditionally supportive for this activity.",
        )

    return TimingSignal(
        alignment="NEUTRAL",
        reason_ta=f"{day_ta}க்கிழமை இந்த செயலுக்கு நடுநிலையான நாள்.",
        reason_en=f"{day_en} is neutral for this activity.",
    )


# ── Combined result ────────────────────────────────────────────────────────────

_ALIGNMENT_RANK: dict[Alignment, int] = {"CAUTION": 0, "NEUTRAL": 1, "SUPPORTS": 2}


def _combine_alignments(a: Alignment, b: Alignment, c: Alignment) -> Alignment:
    # Lowest rank wins (any CAUTION → overall CAUTION; all SUPPORTS → SUPPORTS; else NEUTRAL)
    worst = min(_ALIGNMENT_RANK[x] for x in (a, b, c))
    if worst == 0:
        return "CAUTION"
    if worst == 2:
        return "SUPPORTS"
    return "NEUTRAL"


def assess_activity_timing(
    activity: ActivityType,
    tithi_number: int,
    paksha: str,
    weekday_lord: str,
) -> ActivityTimingResult:
    paksha_sig = _assess_paksha(activity, paksha)
    tithi_sig = _assess_tithi(activity, tithi_number)
    weekday_sig = _assess_weekday(activity, weekday_lord)

    combined = _combine_alignments(paksha_sig.alignment, tithi_sig.alignment, weekday_sig.alignment)

    if combined == "SUPPORTS":
        combined_ta = (
            f"{paksha_sig.reason_ta} {tithi_sig.reason_ta} {weekday_sig.reason_ta} "
            f"இன்று இந்த செயலுக்கு பஞ்சாங்கம் ஆதரவளிக்கிறது."
        )
        combined_en = (
            f"{paksha_sig.reason_en} {tithi_sig.reason_en} {weekday_sig.reason_en} "
            f"Panchangam supports this activity today."
        )
    elif combined == "CAUTION":
        signals = [s for s in (paksha_sig, tithi_sig, weekday_sig) if s.alignment == "CAUTION"]
        combined_ta = " ".join(s.reason_ta for s in signals) + " இந்த செயல் சம்பந்தமான முக்கிய முடிவுகளை இன்று ஒத்திவையுங்கள்."
        combined_en = " ".join(s.reason_en for s in signals) + " Defer major steps for this activity today."
    else:
        combined_ta = f"{tithi_sig.reason_ta} {weekday_sig.reason_ta} வழக்கமான முன்னேற்றம் தொடரலாம்."
        combined_en = f"{tithi_sig.reason_en} {weekday_sig.reason_en} Routine progress is fine."

    return ActivityTimingResult(
        paksha_signal=paksha_sig,
        tithi_signal=tithi_sig,
        weekday_signal=weekday_sig,
        combined_alignment=combined,
        combined_ta=combined_ta,
        combined_en=combined_en,
    )
