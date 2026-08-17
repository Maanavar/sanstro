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

from dataclasses import dataclass, replace
from typing import Literal

from app.calculations.display_names import nakshatra_en, nakshatra_ta, tithi_display
from app.calculations.panchangam import SUBHA_NAKSHATRA_NUMBERS
from app.calculations.tara_bala import TARA_NAMES, TARA_SCORE, tara_number
from app.constants.astrology import NAKSHATRA_NAMES
from app.core.age_gate import (
    EDUCATION_LOWER_AGE,
    MINOR_AGE,
    is_married_settled,
    is_past_prime_marriage_age,
    is_seeking_marriage,
)
from app.data.marriage_muhurta_rules import MARRIAGE_NAKSHATRA_ALLOWED

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
    # 2-4 word noun-phrase naming the cause ("Navami — rikta tithi"), for
    # compact UI chips. Always derived from the same panchangam inputs as
    # reason_*, never freeform.
    short_ta: str = ""
    short_en: str = ""


# Every activity the rules cover, in the order a daily board reads best:
# livelihood first, then commitments, then wellbeing and inner life. "other" is
# excluded — it is a fallback for an unclassified user goal, not a real activity
# anyone would be told today is good for.
ACTIVITY_TYPES: tuple[ActivityType, ...] = (
    "job_change", "business_start", "money", "property",
    "marriage", "family_harmony", "child_birth", "education",
    "travel_abroad", "health", "spiritual",
)

# Labels read as things one *begins or undertakes* today, because that is the
# question this board answers — the auspicious muhurtam to START an activity,
# not a verdict on the activity itself. "Study and learning" (which read as a
# judgement on the act of studying) is now "Starting studies"; "Health" (which
# collided with the Life-Areas health *outlook* score) is "Medical procedures",
# its true muhurtam meaning — surgery/treatment timing. New/changed Tamil
# strings are pending native review, per this repo's convention.
ACTIVITY_LABEL_TA: dict[str, str] = {
    "job_change": "வேலை மாற்றம்",
    "business_start": "தொழில் தொடக்கம்",
    "money": "பண முடிவுகள்",
    "property": "சொத்து / ஒப்பந்தம்",
    "marriage": "திருமணம்",
    "family_harmony": "குடும்ப நலம்",
    "child_birth": "குழந்தை பாக்கியம்",
    "education": "படிப்புத் தொடக்கம்",
    "travel_abroad": "வெளிநாட்டுப் பயணம்",
    "health": "மருத்துவச் சிகிச்சை",
    "spiritual": "ஆன்மீகம்",
    "other": "உங்கள் இலக்கு",
}

ACTIVITY_LABEL_EN: dict[str, str] = {
    "job_change": "Job moves",
    "business_start": "Starting a business",
    "money": "Money decisions",
    "property": "Property & signing",
    "marriage": "Marriage",
    "family_harmony": "Family matters",
    "child_birth": "Trying for a child",
    "education": "Starting studies",
    "travel_abroad": "Setting out abroad",
    "health": "Medical procedures",
    "spiritual": "Spiritual practice",
    "other": "Your goal",
}


@dataclass(frozen=True)
class ActivityVerdict:
    """One row of the daily board: an activity and today's verdict on it."""

    activity: str
    label_ta: str
    label_en: str
    alignment: Alignment
    reason_ta: str
    reason_en: str


@dataclass(frozen=True)
class DailyActivityBoard:
    """Today's green / red light across all activities."""

    favourable: list[ActivityVerdict]
    caution: list[ActivityVerdict]
    neutral: list[ActivityVerdict]
    is_chandrashtama: bool = False


@dataclass(frozen=True)
class ActivityTimingResult:
    paksha_signal: TimingSignal
    tithi_signal: TimingSignal
    weekday_signal: TimingSignal
    # None when the caller had no nakshatra to pass. Distinct from a NEUTRAL
    # signal: "not consulted" and "consulted, nothing to say" are different
    # claims, and the month ranker used to make the first while reading as the
    # second.
    nakshatra_signal: TimingSignal | None
    # Present only for a personal (birth-star supplied) assessment.  It is kept
    # separate from ``combined_alignment``: Tara Bala is a calibrated ranking
    # contribution, not a claim that Panchangam itself has vetoed the day.
    tara_signal: TimingSignal | None
    tara_score: int
    combined_alignment: Alignment
    combined_ta: str
    combined_en: str
    # Short cause of the dominant signal (tithi > weekday > paksha within the
    # combined alignment), so UIs can show a crisp "why" without parsing the
    # combined sentences.
    short_ta: str = ""
    short_en: str = ""


# Tithi display names moved to `app.calculations.display_names.tithi_display`
# so the muhurta engine and this module compose prose from one table rather
# than two that can drift. `_tithi_display` stays as the local alias the rules
# below already read.
_tithi_display = tithi_display


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
                short_ta="வளர்பிறை",
                short_en="waxing moon",
            )
        return TimingSignal(
            alignment="CAUTION",
            reason_ta="தேய்பிறை காலம் — புதிய தொடக்கங்கள் வலுவிழக்கும்; இந்த செயலுக்கு வளர்பிறை நாட்களை தேர்வு செய்யுங்கள்.",
            reason_en="Theipirai (waning moon) — new beginnings lose strength now; pick a Valarpirai (waxing) day for this.",
            short_ta="தேய்பிறை",
            short_en="waning moon",
        )

    if activity in _BENEFITS_KRISHNA:
        if not is_shukla:
            return TimingSignal(
                alignment="SUPPORTS",
                reason_ta="தேய்பிறை காலம் — ஆன்மீக மற்றும் உள்நோக்கிய சேவைகளுக்கு சாதகம்.",
                reason_en="Theipirai — favourable for spiritual and inward-focused activities.",
                short_ta="தேய்பிறை சாதகம்",
                short_en="waning moon suits this",
            )
        return TimingSignal(
            alignment="NEUTRAL",
            reason_ta="வளர்பிறை காலம் — இந்த செயலுக்கு இரு பக்கமும் பயனளிக்கும்.",
            reason_en="Valarpirai — either paksha is workable for this activity.",
            short_ta="இரு பக்கமும் சரி",
            short_en="any moon phase works",
        )

    return TimingSignal(
        alignment="NEUTRAL",
        reason_ta="பக்ஷம் இந்த செயலுக்கு நடுநிலையாக உள்ளது.",
        reason_en="Paksha is neutral for this activity.",
        short_ta="பக்ஷம் நடுநிலை",
        short_en="moon phase neutral",
    )


# ── Tithi rules ────────────────────────────────────────────────────────────────

_RIKTA_TITHIS = {4, 9, 14, 19, 24, 29}
_HEAVY_TITHIS = {8, 23, 30}
_EKADASI_TITHIS = {11, 26}
_POURNAMI = {15}
# Tithis classically favourable for new beginnings/auspicious activity, once
# Rikta/Heavy/Ekadasi/Pournami are excluded (M-5). Explicit rather than a
# catch-all fallthrough: Prathama (1, opens the paksha) and 18/25/27/28 are
# NOT in this set and read NEUTRAL below, not SUPPORTS — Shukla Pratipada in
# particular is excluded from most muhurtha lists.
_AUSPICIOUS_TITHIS = {2, 3, 5, 6, 7, 10, 12, 13, 16, 17, 20, 21, 22}
# Activities where even Rikta tithis are acceptable (completion/reduction tasks).
_RIKTA_OK: set[ActivityType] = {"health", "spiritual", "family_harmony", "money", "other"}
# Activities harmed by heavy tithis (Ashtami, Amavasai).
_HEAVY_SENSITIVE: set[ActivityType] = {
    "marriage", "business_start", "property", "travel_abroad", "child_birth", "job_change",
}


def _assess_tithi(activity: ActivityType, tithi_number: int) -> TimingSignal:
    tithi_ta, tithi_en = _tithi_display(tithi_number)

    if tithi_number in _POURNAMI:
        return TimingSignal(
            alignment="SUPPORTS",
            reason_ta="பௌர்ணமி திதி — அனைத்து நல்ல செயல்களுக்கும் சிறந்த நேரம்.",
            reason_en="Pournami (full moon) tithi — excellent for all auspicious activities.",
            short_ta="பௌர்ணமி திதி",
            short_en="Pournami tithi",
        )

    if tithi_number in _EKADASI_TITHIS:
        if activity == "spiritual":
            return TimingSignal(
                alignment="SUPPORTS",
                reason_ta="ஏகாதசி திதி — ஆன்மீக செயல்களுக்கு மிகவும் சாதகம்.",
                reason_en="Ekadasi tithi — highly favourable for spiritual activities.",
                short_ta="ஏகாதசி திதி",
                short_en="Ekadasi tithi",
            )
        return TimingSignal(
            alignment="NEUTRAL",
            reason_ta="ஏகாதசி திதி — நடுநிலை; ஆன்மீக செயல்களில் கவனம் செலுத்துங்கள்.",
            reason_en="Ekadasi tithi — neutral; focus on spiritual observance today.",
            short_ta="ஏகாதசி — ஆன்மீக நாள்",
            short_en="Ekadasi — spiritual day",
        )

    if tithi_number in _RIKTA_TITHIS:
        if activity in _RIKTA_OK:
            return TimingSignal(
                alignment="NEUTRAL",
                reason_ta=f"இன்று {tithi_ta} — ரிக்த (வெற்று) திதி. புதிய தொடக்கங்களை தவிர்க்கவும்; தொடர்ந்து வரும் பணிகள் சரி.",
                reason_en=f"Today is {tithi_en}, a Rikta ('empty') tithi — avoid new starts; continuing and routine tasks are fine.",
                short_ta=f"{tithi_ta} — புதியது வேண்டாம்",
                short_en=f"{tithi_en} — no new starts",
            )
        return TimingSignal(
            alignment="CAUTION",
            reason_ta=f"இன்று {tithi_ta} — ரிக்த (வெற்று) திதி. இன்று தொடங்கும் முயற்சிகள் நிலைக்காது; இந்த செயலுக்கு வலுவான நாளை தேர்வு செய்யுங்கள்.",
            reason_en=f"Today is {tithi_en}, a Rikta ('empty') tithi — efforts begun now tend to fade. Pick a stronger day to start this.",
            short_ta=f"{tithi_ta} — ரிக்த திதி",
            short_en=f"{tithi_en} — rikta tithi",
        )

    if tithi_number in _HEAVY_TITHIS:
        if activity in _HEAVY_SENSITIVE:
            return TimingSignal(
                alignment="CAUTION",
                reason_ta=f"{tithi_ta} திதி — கனமான நாள்; முக்கிய சமூக மற்றும் நிதி முடிவுகளை இன்று தவிர்க்கவும்.",
                reason_en=f"{tithi_en} tithi — a heavy day; avoid major social and financial decisions today.",
                short_ta=f"{tithi_ta} திதி",
                short_en=f"{tithi_en} tithi",
            )
        return TimingSignal(
            alignment="NEUTRAL",
            reason_ta=f"{tithi_ta} திதி — சாதாரண பணிகள் தொடரலாம்; பெரிய புதிய தொடக்கங்கள் வேண்டாம்.",
            reason_en=f"{tithi_en} tithi — routine tasks are fine; avoid major new beginnings.",
            short_ta=f"{tithi_ta} — வழக்கம் மட்டும்",
            short_en=f"{tithi_en} — routine only",
        )

    if tithi_number in _AUSPICIOUS_TITHIS:
        return TimingSignal(
            alignment="SUPPORTS",
            reason_ta=f"{tithi_ta} திதி — இந்த செயலுக்கு சாதகமான திதி.",
            reason_en=f"{tithi_en} tithi — favourable for this activity.",
            short_ta=f"{tithi_ta} திதி சாதகம்",
            short_en=f"{tithi_en} tithi favourable",
        )

    # Neither classically auspicious nor in the caution/neutral sets above
    # (e.g. Prathama, which opens the paksha) — honest NEUTRAL, not a
    # favourable default (M-5).
    return TimingSignal(
        alignment="NEUTRAL",
        reason_ta=f"{tithi_ta} திதி — இந்த செயலுக்கு குறிப்பாக சாதகமும் இல்லை, பாதகமும் இல்லை.",
        reason_en=f"{tithi_en} tithi — neither particularly favourable nor unfavourable for this activity.",
        short_ta=f"{tithi_ta} — நடுநிலை",
        short_en=f"{tithi_en} — neutral",
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
            reason_ta=f"{day_ta}க்கிழமை இந்த செயலுக்கு திருக்கணிதம் படி சாதகமில்லை.",
            reason_en=f"{day_en} is traditionally less favourable for this activity per Thirukanitham.",
            short_ta=f"{day_ta}க்கிழமை சாதகமில்லை",
            short_en=f"{day_en} unfavourable",
        )

    if activity in _WEEKDAY_SUPPORTS.get(lord, set()):
        return TimingSignal(
            alignment="SUPPORTS",
            reason_ta=f"{day_ta}க்கிழமை இந்த செயலுக்கு சாதகமான நாள்.",
            reason_en=f"{day_en} is traditionally supportive for this activity.",
            short_ta=f"{day_ta}க்கிழமை சாதகம்",
            short_en=f"{day_en} supports this",
        )

    return TimingSignal(
        alignment="NEUTRAL",
        reason_ta=f"{day_ta}க்கிழமை இந்த செயலுக்கு நடுநிலையான நாள்.",
        reason_en=f"{day_en} is neutral for this activity.",
        short_ta=f"{day_ta}க்கிழமை நடுநிலை",
        short_en=f"{day_en} neutral",
    )


# ── Nakshatra rules ────────────────────────────────────────────────────────────

# Activities whose muhurta activity type maps onto a primary-text nakshatra
# table. Keyed by this module's lowercase `ActivityType`, valued by the
# uppercase activity name the doctrine tables use.
#
# STILL ONLY MARRIAGE, and that is a finding rather than an oversight.
# Kalaprakasika Ch. XXI ("To Lay Up Treasure") has now been extracted
# (`app/data/kalaprakasika_treasure_rules.py`), and it does **not** supply a
# star list for the two board activities that looked like its natural clients:
#
# * `property` on this board means *buying and registering* property. Ch. XXI's
#   14-star list (p.112) sits under "To take possession of land"; the chapter's
#   only rule for *buying* land is a weekday one (p.112), with no stars at all.
#   Mapping `property` -> LAND_POSSESSION would promote a possession rule into a
#   purchase scope — exactly the move `RuleSource.source_scope` exists to stop.
# * `money` means financial decisions at large, not acquiring gold. Ch. XXI's
#   gold list is about treasuring metal, which is a different act.
#
# The three samskara activities (naming, annaprasana, ear-boring) have sourced
# tables too, but no row here because this board has no samskara activity type —
# it answers "what is today good for *me*", and a naming muhurtam presupposes an
# infant the audience filter has no way to know about. Those three are reachable
# through the muhurta picker instead (`app.services.muhurta_service`).
_SOURCED_NAKSHATRA_ACTIVITIES: dict[str, str] = {"marriage": "MARRIAGE"}


def _assess_nakshatra(activity: ActivityType, nakshatra_number: int) -> TimingSignal:
    """The Moon's mansion for this activity.

    For most Tamil muhurta work this is the single strongest day-selection
    factor — stronger than the weekday, which this module has always consulted.
    Two tiers, and the copy keeps them apart because they are very different
    claims:

    * **Sourced** — the activity has a page-cited table (marriage, from
      Kalaprakasika Ch. XIV via `app.data.marriage_muhurta_rules`). The star is
      judged against that activity's own list.
    * **Generic** — everything else falls back to the broad Thirukanitham
      auspicious-star list, and says so. That list knows nothing about the
      activity: it cannot tell you Poosam is the classical star for buying
      gold, only that Poosam is a generally good star. Presenting it as an
      activity ruling would overstate it. Ch. XXI has since been extracted and
      still does not close this gap for *these* activities — see the comment on
      `_SOURCED_NAKSHATRA_ACTIVITIES` for why buying property and making money
      decisions are not the acts Ch. XXI rules on.

    A star absent from either list is NEUTRAL, never CAUTION. Kalaprakasika
    names eleven stars *best* for marriage without forbidding the other sixteen,
    so flipping the day to CAUTION would assert something the cited page does
    not say.
    """
    # Bilingual copy needs a bilingual star name — a Latin "Aswini" dropped into
    # an otherwise-Tamil sentence is the same seam this repo has fixed before.
    fallback = NAKSHATRA_NAMES[nakshatra_number - 1].title()
    name_en = nakshatra_en(nakshatra_number) or fallback
    name_ta = nakshatra_ta(nakshatra_number) or fallback

    sourced = _SOURCED_NAKSHATRA_ACTIVITIES.get(activity)
    if sourced == "MARRIAGE":
        if nakshatra_number in MARRIAGE_NAKSHATRA_ALLOWED:
            return TimingSignal(
                alignment="SUPPORTS",
                reason_ta=f"கலப்பிரகாசிகை திருமணத்திற்குச் சிறந்ததெனக் கூறும் பதினொரு நட்சத்திரங்களுள் {name_ta} ஒன்று.",
                reason_en=f"{name_en} is among the eleven asterisms Kalaprakasika names best for marriage.",
                short_ta=f"{name_ta} — சிறந்த நட்சத்திரம்",
                short_en=f"{name_en} — a best marriage star",
            )
        return TimingSignal(
            alignment="NEUTRAL",
            reason_ta=f"திருமணத்திற்குச் சிறந்ததெனக் கூறப்பட்ட பதினொரு நட்சத்திரங்களுள் {name_ta} இல்லை.",
            reason_en=f"{name_en} is not among the eleven asterisms named best for marriage.",
            short_ta=f"{name_ta} — சிறந்த பட்டியலில் இல்லை",
            short_en=f"{name_en} — not a best marriage star",
        )

    if nakshatra_number in SUBHA_NAKSHATRA_NUMBERS:
        return TimingSignal(
            alignment="SUPPORTS",
            reason_ta=f"{name_ta} பொதுவான சுப நட்சத்திரப் பட்டியலில் உள்ளது (இச்செயலுக்கே உரிய பட்டியல் அல்ல).",
            reason_en=(
                f"{name_en} is on the general auspicious-star list — no star list specific to this "
                "activity has been sourced yet."
            ),
            short_ta=f"{name_ta} — பொது சுப நட்சத்திரம்",
            short_en=f"{name_en} — generally auspicious star",
        )
    return TimingSignal(
        alignment="NEUTRAL",
        reason_ta=f"{name_ta} பொதுவான சுப நட்சத்திரப் பட்டியலில் இல்லை (இச்செயலுக்கே உரிய பட்டியல் அல்ல).",
        reason_en=(
            f"{name_en} is not on the general auspicious-star list — no star list specific to this "
            "activity has been sourced yet."
        ),
        short_ta=f"{name_ta} — பொது பட்டியலில் இல்லை",
        short_en=f"{name_en} — not a generally auspicious star",
    )


# ── Combined result ────────────────────────────────────────────────────────────

_ALIGNMENT_RANK: dict[Alignment, int] = {"CAUTION": 0, "NEUTRAL": 1, "SUPPORTS": 2}


def _combine_alignments(*alignments: Alignment) -> Alignment:
    # Lowest rank wins (any CAUTION → overall CAUTION; all SUPPORTS → SUPPORTS; else NEUTRAL)
    worst = min(_ALIGNMENT_RANK[x] for x in alignments)
    if worst == 0:
        return "CAUTION"
    if worst == 2:
        return "SUPPORTS"
    return "NEUTRAL"


def _primary_signal(
    combined: Alignment,
    tithi_sig: TimingSignal,
    weekday_sig: TimingSignal,
    paksha_sig: TimingSignal,
    nakshatra_sig: TimingSignal | None = None,
) -> TimingSignal:
    """The one signal a compact UI should name as the cause of the combined
    verdict. Among signals matching the verdict, nakshatra outranks tithi
    outranks weekday outranks paksha — the star is the strongest day-selection
    factor, and a named tithi (Rikta/Ashtami…) is the next most specific,
    calendar-verifiable cause."""
    ordered = tuple(s for s in (nakshatra_sig, tithi_sig, weekday_sig, paksha_sig) if s is not None)
    for sig in ordered:
        if sig.alignment == combined:
            return sig
    return tithi_sig


def _assess_tara(janma_nakshatra: int, day_nakshatra: int) -> tuple[TimingSignal, int]:
    """Return the named personal Tara factor and its approved contribution.

    The 9-fold class is deliberately not folded into ``combined_alignment``.
    Specific source-derived count prohibitions live in the muhurta engine as
    vetoes; the general Tara class is the signed product scoring factor.
    """
    tara = tara_number(janma_nakshatra, day_nakshatra)
    name_ta, name_en = TARA_NAMES[tara]
    score = TARA_SCORE[tara]
    alignment: Alignment = "CAUTION" if score < 0 else "SUPPORTS" if score > 0 else "NEUTRAL"
    direction = "penalty" if score < 0 else "support"
    return (
        TimingSignal(
            alignment=alignment,
            # Reuse the established Tamil Tara label rather than introducing
            # fresh explanatory Tamil pending a separate language review.
            reason_ta=name_ta,
            reason_en=f"{name_en} tara — personal day-selection {direction}.",
            short_ta=name_ta,
            short_en=f"{name_en} tara",
        ),
        score,
    )


@dataclass(frozen=True)
class ActivityAudience:
    """Who today's board is for.

    All fields are optional; an audience left at its defaults means "show
    everything, unchanged" — which is what callers with no profile context
    (and the board's own rule-partition tests) rely on. When a field is set,
    the board only lists activities that make sense for that person and reframes
    a few whose meaning shifts (a divorced native's "Marriage" is a *remarriage*;
    a native already living overseas is not "setting out abroad" but relocating).

    This is life-stage relevance, not a second astrological opinion: it decides
    *which questions to ask*, never changes the verdict of a question asked.
    Thirukanitham has always read a chart against the native's āyul (life stage)
    — a marriage muhurtam is meaningless to one already married, a child-birth
    muhurtam to one past that stage, a job-change muhurtam to a retiree.
    """

    age: int | None = None
    marital_status: str | None = None
    employment_type: str | None = None
    # gender_for_traditional_rules ("male"/"female") — only narrows the
    # child-bearing age window; absent → the wider default is used.
    gender: str | None = None
    # Native currently resident outside their birth region (best-effort from
    # timezone continents) — reframes "abroad travel" as relocation/long journey.
    is_abroad: bool = False


# Activities a native is never shown before legal adulthood — the adult
# commitments. What remains for a minor: studies, family, health, spiritual,
# and (family) travel.
_MINOR_HIDDEN: frozenset[str] = frozenset({
    "marriage", "child_birth", "job_change", "business_start", "money", "property",
})
# Employment states for which a fresh job move / new business is not the
# native's live question.
_RETIRED_HIDDEN: frozenset[str] = frozenset({"job_change", "business_start"})


def _is_relevant(activity: str, aud: ActivityAudience) -> bool:
    age = aud.age
    emp = (aud.employment_type or "").strip().lower()

    # 0–5: only wellbeing and family are meaningful.
    if age is not None and age < EDUCATION_LOWER_AGE:
        return activity in {"health", "family_harmony"}
    # 6–17: no adult commitments.
    if age is not None and age < MINOR_AGE and activity in _MINOR_HIDDEN:
        return False

    if activity == "marriage":
        if is_married_settled(aud.marital_status):
            return False
        if age is not None and is_past_prime_marriage_age(age):
            return False
        return True

    if activity == "child_birth":
        # A begetting muhurtam presupposes a marriage and a child-bearing stage.
        if not (is_married_settled(aud.marital_status) or is_seeking_marriage(aud.marital_status)):
            return False
        cap = 45 if (aud.gender or "").strip().lower().startswith("f") else 55
        if age is not None and age >= cap:
            return False
        return True

    if activity in _RETIRED_HIDDEN and emp == "retired":
        return False

    return True


def _audience_label(activity: str, aud: ActivityAudience) -> tuple[str, str] | None:
    """(ta, en) override when the native's context renames an activity, else None."""
    if activity == "marriage" and is_seeking_marriage(aud.marital_status):
        return ("மறுமணம் / புதிய உறவு", "Remarriage / new bond")
    if activity == "travel_abroad" and aud.is_abroad:
        return ("நீண்ட பயணம் / இடமாற்றம்", "Long journey / relocation")
    return None


def personalize_board(board: DailyActivityBoard, audience: ActivityAudience) -> DailyActivityBoard:
    """Drop activities that do not apply to this native and reframe the few whose
    meaning their life stage changes. Verdicts are untouched — only the roster."""

    def _filtered(verdicts: list[ActivityVerdict]) -> list[ActivityVerdict]:
        out: list[ActivityVerdict] = []
        for v in verdicts:
            if not _is_relevant(v.activity, audience):
                continue
            override = _audience_label(v.activity, audience)
            if override is not None:
                v = replace(v, label_ta=override[0], label_en=override[1])
            out.append(v)
        return out

    return DailyActivityBoard(
        favourable=_filtered(board.favourable),
        caution=_filtered(board.caution),
        neutral=_filtered(board.neutral),
        is_chandrashtama=board.is_chandrashtama,
    )


def daily_activity_board(
    tithi_number: int,
    paksha: str,
    weekday_lord: str,
    *,
    nakshatra_number: int | None = None,
    is_chandrashtama: bool = False,
    audience: ActivityAudience | None = None,
) -> DailyActivityBoard:
    """Today's "what is this day good for" board across every activity type.

    The per-activity rules below were only ever consulted one activity at a
    time, for a goal the user had already chosen. But the question people open
    the app with is the other way round — "what should I do today?" — and that
    needs the whole set swept and sorted. No new doctrine: this reads the same
    rules and partitions the answers.

    Chandrashtama (Moon transiting the 8th from natal Moon) is a whole-day
    condition rather than an activity rule, so it is applied on top: on such a
    day nothing is presented as green, because recommending someone sign a
    contract on their Chandrashtama day would contradict the alert the rest of
    the app raises.
    """
    favourable: list[ActivityVerdict] = []
    caution: list[ActivityVerdict] = []
    neutral: list[ActivityVerdict] = []

    for activity in ACTIVITY_TYPES:
        result = assess_activity_timing(
            activity, tithi_number, paksha, weekday_lord, nakshatra_number
        )
        verdict = ActivityVerdict(
            activity=activity,
            label_ta=ACTIVITY_LABEL_TA[activity],
            label_en=ACTIVITY_LABEL_EN[activity],
            alignment=result.combined_alignment,
            reason_ta=result.short_ta or result.combined_ta,
            reason_en=result.short_en or result.combined_en,
        )
        if result.combined_alignment == "SUPPORTS":
            (neutral if is_chandrashtama else favourable).append(verdict)
        elif result.combined_alignment == "CAUTION":
            caution.append(verdict)
        else:
            neutral.append(verdict)

    board = DailyActivityBoard(
        favourable=favourable,
        caution=caution,
        neutral=neutral,
        is_chandrashtama=is_chandrashtama,
    )
    if audience is not None:
        board = personalize_board(board, audience)
    return board


def assess_activity_timing(
    activity: ActivityType,
    tithi_number: int,
    paksha: str,
    weekday_lord: str,
    nakshatra_number: int | None = None,
    *,
    janma_nakshatra: int | None = None,
) -> ActivityTimingResult:
    """Judge a day for one activity on paksha, tithi, weekday — and, when the
    caller can supply it, the Moon's nakshatra.  Supplying both a day star and
    a birth star also adds the signed personal Tara Bala contribution.

    `nakshatra_number` is optional only because not every caller holds a
    panchangam snapshot. Pass it wherever one is available: without it this
    ranks days on the two weakest signals, which is how the month picker could
    rank a Bharani day above a Poosam day. A caller that omits it gets the old
    three-signal behaviour, unchanged, and `nakshatra_signal` is None so the
    omission is visible downstream rather than looking like a neutral reading.
    """
    paksha_sig = _assess_paksha(activity, paksha)
    tithi_sig = _assess_tithi(activity, tithi_number)
    weekday_sig = _assess_weekday(activity, weekday_lord)
    nakshatra_sig = (
        _assess_nakshatra(activity, nakshatra_number) if nakshatra_number is not None else None
    )
    tara_sig: TimingSignal | None = None
    tara_score = 0
    if janma_nakshatra is not None and nakshatra_number is not None:
        tara_sig, tara_score = _assess_tara(janma_nakshatra, nakshatra_number)

    scored = [s for s in (paksha_sig, tithi_sig, weekday_sig, nakshatra_sig) if s is not None]
    combined = _combine_alignments(*(s.alignment for s in scored))

    # Reason copy is ordered strongest-signal-first where the star is known.
    ordered = [s for s in (nakshatra_sig, paksha_sig, tithi_sig, weekday_sig) if s is not None]

    if combined == "SUPPORTS":
        combined_ta = (
            " ".join(s.reason_ta for s in ordered) + " இன்று இந்த செயலுக்கு பஞ்சாங்கம் ஆதரவளிக்கிறது."
        )
        combined_en = (
            " ".join(s.reason_en for s in ordered) + " Panchangam supports this activity today."
        )
    elif combined == "CAUTION":
        signals = [s for s in ordered if s.alignment == "CAUTION"]
        combined_ta = " ".join(s.reason_ta for s in signals) + " இந்த செயல் சம்பந்தமான முக்கிய முடிவுகளை இன்று ஒத்திவையுங்கள்."
        combined_en = " ".join(s.reason_en for s in signals) + " Defer major steps for this activity today."
    else:
        neutral_parts = [s for s in ordered if s is not paksha_sig]
        combined_ta = " ".join(s.reason_ta for s in neutral_parts) + " வழக்கமான முன்னேற்றம் தொடரலாம்."
        combined_en = " ".join(s.reason_en for s in neutral_parts) + " Routine progress is fine."

    if tara_sig is not None:
        # Personal Tara is named in the returned explanation but does not
        # overwrite the general Panchangam verdict.
        combined_ta = f"{tara_sig.reason_ta}. {combined_ta}"
        combined_en = f"{tara_sig.reason_en} {combined_en}"

    primary = _primary_signal(combined, tithi_sig, weekday_sig, paksha_sig, nakshatra_sig)

    return ActivityTimingResult(
        paksha_signal=paksha_sig,
        tithi_signal=tithi_sig,
        weekday_signal=weekday_sig,
        nakshatra_signal=nakshatra_sig,
        tara_signal=tara_sig,
        tara_score=tara_score,
        combined_alignment=combined,
        combined_ta=combined_ta,
        combined_en=combined_en,
        short_ta=primary.short_ta,
        short_en=primary.short_en,
    )
