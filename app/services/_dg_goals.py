"""Goals enrichment, journal insight, and journal correlation for daily guidance."""
from __future__ import annotations

from collections import Counter
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.calculations.activity_timing_rules import ActivityType, assess_activity_timing
from app.models import JournalEntry
from app.schemas.daily_guidance import (
    DailyGuidanceJournalInsight,
    DailyGuidanceJournalSignal,
    DailyGuidanceSuggestion,
    DailyGuidanceText,
)

_GOAL_DASHA_AFFINITY: dict[str, set[str]] = {
    "job_change":     {"SUN", "SATURN", "MARS", "JUPITER"},
    "business_start": {"MERCURY", "JUPITER", "SATURN"},
    "marriage":       {"VENUS", "JUPITER", "MOON"},
    "education":      {"MERCURY", "JUPITER"},
    "property":       {"SATURN", "MARS", "MOON"},
    "health":         {"SUN", "MARS", "JUPITER"},
    "travel_abroad":  {"RAHU", "JUPITER"},
    "spiritual":      {"JUPITER", "KETU"},
    "family_harmony": {"MOON", "JUPITER"},
    "money":          {"JUPITER", "VENUS", "MERCURY"},
    "child_birth":    {"JUPITER", "MOON"},
    "other":          {"JUPITER", "SUN"},
}

_GOAL_LABEL_TA = {
    "job_change":     "வேலை மாற்றம்",
    "business_start": "தொழில் தொடக்கம்",
    "marriage":       "திருமணம்",
    "education":      "கல்வி",
    "property":       "சொத்து",
    "health":         "உடல்நலம்",
    "travel_abroad":  "வெளிநாடு பயணம்",
    "spiritual":      "ஆன்மீகம்",
    "family_harmony": "குடும்ப நலம்",
    "money":          "பண வரவு",
    "child_birth":    "குழந்தை பாக்கியம்",
    "other":          "உங்கள் இலக்கு",
}
_GOAL_LABEL_EN = {
    "job_change":     "job change",
    "business_start": "starting a business",
    "marriage":       "marriage",
    "education":      "education",
    "property":       "property",
    "health":         "health",
    "travel_abroad":  "travel abroad",
    "spiritual":      "spiritual growth",
    "family_harmony": "family harmony",
    "money":          "financial growth",
    "child_birth":    "child birth",
    "other":          "your goal",
}

_PLANET_TA = {
    "SUN": "சூரியன்", "MOON": "சந்திரன்", "MARS": "செவ்வாய்",
    "MERCURY": "புதன்", "JUPITER": "குரு", "VENUS": "சுக்கிரன்",
    "SATURN": "சனி", "RAHU": "ராகு", "KETU": "கேது",
}
_PLANET_EN = {
    "SUN": "Suryan", "MOON": "Chandran", "MARS": "Chevvai",
    "MERCURY": "Budhan", "JUPITER": "Guru", "VENUS": "Sukran",
    "SATURN": "Sani", "RAHU": "Rahu", "KETU": "Ketu",
}

_GOAL_TRACK_TA: dict[str, str] = {
    "CAREER":       "தொழில் வளர்ச்சி",
    "EXAM":         "தேர்வு வெற்றி",
    "RELATIONSHIP": "உறவு மேம்பாடு",
    "FINANCIAL":    "பண வரவு",
}
_GOAL_TRACK_EN: dict[str, str] = {
    "CAREER":       "career growth",
    "EXAM":         "exam success",
    "RELATIONSHIP": "relationship goals",
    "FINANCIAL":    "financial growth",
}
_GOAL_TRACK_DASHA_AFFINITY: dict[str, set[str]] = {
    "CAREER":       {"SUN", "SATURN", "MARS", "JUPITER"},
    "EXAM":         {"MERCURY", "JUPITER"},
    "RELATIONSHIP": {"VENUS", "JUPITER", "MOON"},
    "FINANCIAL":    {"JUPITER", "VENUS", "MERCURY"},
}

_JOURNAL_INSIGHT_LOOKBACK_DAYS = 30


def _enrich_action_with_goals(
    action: DailyGuidanceSuggestion,
    active_goals: list,
    maha_lord: str,
    label: str,
    *,
    tithi_number: int,
    paksha: str,
    weekday_lord: str,
) -> DailyGuidanceSuggestion:
    """Append a goal-relevant context sentence to the action suggestion.

    Checks Thirukanitham timing rules (tithi/paksha/weekday) for the active goal
    type first. If timing is CAUTION for the goal, that overrides a positive dasha
    match — a Rikta tithi during Theipirai on a Saturday cannot be softened just
    because the dasha lord is supportive.
    """
    if not active_goals:
        return action

    goal_type = active_goals[0].goal_type
    affinity_lords = _GOAL_DASHA_AFFINITY.get(goal_type, set())
    goal_ta = _GOAL_LABEL_TA.get(goal_type, "உங்கள் இலக்கு")
    goal_en = _GOAL_LABEL_EN.get(goal_type, "your goal")
    planet_ta = _PLANET_TA.get(maha_lord, maha_lord)
    planet_en = _PLANET_EN.get(maha_lord, maha_lord)

    # Assess Thirukanitham timing for this specific goal.
    timing = assess_activity_timing(
        activity=goal_type if goal_type in (
            "job_change", "business_start", "marriage", "education",
            "property", "health", "travel_abroad", "spiritual",
            "family_harmony", "money", "child_birth",
        ) else "other",
        tithi_number=tithi_number,
        paksha=paksha,
        weekday_lord=weekday_lord,
    )

    if timing.combined_alignment == "CAUTION":
        # Timing caution overrides positive dasha — do not encourage action today.
        suffix_ta = f" {goal_ta} சம்பந்தமான முக்கிய முடிவுகளை இன்று ஒத்திவையுங்கள். {timing.combined_ta}"
        suffix_en = f" Defer major {goal_en} decisions today. {timing.combined_en}"
        return DailyGuidanceSuggestion(ta=action.ta + suffix_ta, en=action.en + suffix_en)

    if timing.combined_alignment == "SUPPORTS" and maha_lord in affinity_lords and label in ("STRONG_SUPPORT", "GOOD"):
        suffix_ta = (
            f" {goal_ta} குறித்த முயற்சிகளுக்கு இன்று {planet_ta} தசையும் பஞ்சாங்கமும் ஆதரவளிக்கின்றன. {timing.combined_ta}"
        )
        suffix_en = (
            f" {planet_en} dasa and today's Panchangam both support {goal_en} efforts. {timing.combined_en}"
        )
        return DailyGuidanceSuggestion(ta=action.ta + suffix_ta, en=action.en + suffix_en)

    if maha_lord in affinity_lords and label in ("STRONG_SUPPORT", "GOOD"):
        suffix_ta = f" {goal_ta} குறித்த முயற்சிகளுக்கு இன்று {planet_ta} தசை ஆதரவளிக்கிறது."
        suffix_en = f" {planet_en} dasa is supportive for {goal_en} efforts today."
        return DailyGuidanceSuggestion(ta=action.ta + suffix_ta, en=action.en + suffix_en)

    if label in ("CAUTION", "RESTORATIVE"):
        suffix_ta = f" {goal_ta} சம்பந்தமான முக்கிய முடிவுகளை இன்று ஒத்திவையுங்கள்."
        suffix_en = f" Postpone major decisions related to {goal_en} today."
        return DailyGuidanceSuggestion(ta=action.ta + suffix_ta, en=action.en + suffix_en)

    return action


def _enrich_action_with_goal_track(
    action: DailyGuidanceSuggestion,
    goal_track: str,
    maha_lord: str,
    label: str,
) -> DailyGuidanceSuggestion:
    """Append a lightweight goal-track hint when user has set a focus track but no active goal."""
    affinity = _GOAL_TRACK_DASHA_AFFINITY.get(goal_track, set())
    track_ta = _GOAL_TRACK_TA.get(goal_track, "உங்கள் இலக்கு")
    track_en = _GOAL_TRACK_EN.get(goal_track, "your goal")
    planet_ta = _PLANET_TA.get(maha_lord, maha_lord)
    planet_en = _PLANET_EN.get(maha_lord, maha_lord)
    if maha_lord in affinity and label in ("STRONG_SUPPORT", "GOOD"):
        return DailyGuidanceSuggestion(
            ta=action.ta + f" {track_ta} குறித்த முயற்சிகளுக்கு {planet_ta} தசை இன்று ஆதரவளிக்கிறது.",
            en=action.en + f" {planet_en} dasa supports {track_en} efforts today.",
        )
    if label in ("CAUTION", "RESTORATIVE"):
        return DailyGuidanceSuggestion(
            ta=action.ta + f" {track_ta} சம்பந்தமான முக்கிய முடிவுகளை இன்று ஒத்திவையுங்கள்.",
            en=action.en + f" Defer major {track_en} decisions today.",
        )
    return action


def _build_journal_insight(
    session: Session,
    *,
    owner_user_id: UUID,
    chart_id: UUID,
    on_date: date,
) -> DailyGuidanceJournalInsight | None:
    from_date = on_date - timedelta(days=_JOURNAL_INSIGHT_LOOKBACK_DAYS)
    rows = session.execute(
        select(JournalEntry).where(
            JournalEntry.owner_user_id == owner_user_id,
            JournalEntry.chart_id == chart_id,
            JournalEntry.deleted_at.is_(None),
            JournalEntry.entry_date >= from_date,
            JournalEntry.entry_date <= on_date,
        )
    ).scalars().all()
    if not rows:
        return None

    life_area_counts = Counter(row.life_area for row in rows)
    tag_counts = Counter(tag for row in rows for tag in (row.tags or []))
    dominant_life_area, _ = life_area_counts.most_common(1)[0]
    top_tags = [tag for tag, _ in tag_counts.most_common(3)]
    signals = [
        DailyGuidanceJournalSignal(lifeArea=area, count=count)
        for area, count in life_area_counts.most_common(3)
    ]

    return DailyGuidanceJournalInsight(
        lookbackDays=_JOURNAL_INSIGHT_LOOKBACK_DAYS,
        entryCount=len(rows),
        dominantLifeArea=dominant_life_area,
        topTags=top_tags,
        text=DailyGuidanceText(
            ta=(
                f"கடந்த {_JOURNAL_INSIGHT_LOOKBACK_DAYS} நாட்களில் உங்கள் குறிப்புகளில் "
                f"'{dominant_life_area}' தலைவிரிப்பு அதிகம். இன்று சிறு, அமைதியான முன்னேற்ற அடிகள் பயனுள்ளது."
            ),
            en=(
                f"Your recent journal pattern over the last {_JOURNAL_INSIGHT_LOOKBACK_DAYS} days is centered on "
                f"'{dominant_life_area}'. Today favors small, calm progress steps in that area."
            ),
        ),
        signals=signals,
    )
