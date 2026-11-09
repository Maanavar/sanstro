from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from app.calculations.astro import house_from_reference, normalize_longitude


@dataclass(frozen=True)
class BiLabel:
    ta: str
    en: str


@dataclass(frozen=True)
class TransitPoint:
    absolute_longitude: float
    rasi: int


@dataclass(frozen=True)
class EmotionalWeatherResult:
    tone: str
    physical_tendency: str
    best_use_of_day: str
    avoid_before: BiLabel | None
    tone_text: BiLabel
    physical_tendency_text: BiLabel
    best_use_of_day_text: BiLabel


# RP-02 class fix (2026-07-16): the `ta` column was rewritten from romanized
# Thanglish into Tamil script, contemporary register; PENDING NATIVE-TAMIL REVIEW.
_TONE_MAP: dict[str, EmotionalWeatherResult] = {
    "SUN": EmotionalWeatherResult(
        tone="confident",
        physical_tendency="energised",
        best_use_of_day="leadership",
        avoid_before=None,
        tone_text=BiLabel(ta="இன்று தன்னம்பிக்கை அதிகமாக இருக்கலாம்; தெளிவாக முடிவெடுக்க நல்ல நாள்.", en="Confidence and clarity may be higher today — good for clear, decisive action."),
        physical_tendency_text=BiLabel(ta="உடலில் உற்சாகமும், முயற்சி செய்யும் ஆர்வமும் அதிகமாக இருக்கலாம்.", en="Physical drive and initiative may feel elevated."),
        best_use_of_day_text=BiLabel(
            ta="தலைமை ஏற்கவும், கருத்து சொல்லவும், மேடையில் பேசவும் இன்று நல்ல நாள்.",
            en="Supportive for leadership, public presence, and speaking your mind.",
        ),
    ),
    "SATURN": EmotionalWeatherResult(
        tone="heavy",
        physical_tendency="low_energy",
        best_use_of_day="deep_work",
        avoid_before=BiLabel(
            ta="மனதைக் கனக்கச் செய்யும் பேச்சுகளை முடிந்தால் மாலை வரை தள்ளி வைக்கலாம்.",
            en="Delay emotionally heavy conversations until the evening if possible.",
        ),
        tone_text=BiLabel(ta="இன்று மனம் கொஞ்சம் கனமாக இருக்கலாம்.", en="Emotional tone may feel heavier today."),
        physical_tendency_text=BiLabel(ta="உடல் சக்தி கொஞ்சம் குறைவாக இருக்கலாம்.", en="Energy may feel slower or lower."),
        best_use_of_day_text=BiLabel(
            ta="ஆழ்ந்து, அமைதியாக, கவனத்தோடு செய்ய வேண்டிய வேலைகளுக்கு இன்று நல்ல நாள்.",
            en="Best used for focused, deep, low-noise work.",
        ),
    ),
    "JUPITER": EmotionalWeatherResult(
        tone="expansive",
        physical_tendency="focused",
        best_use_of_day="people_facing",
        avoid_before=None,
        tone_text=BiLabel(ta="இன்று மனம் திறந்தும் நம்பிக்கையோடும் இருக்கலாம்.", en="Tone is likely more open and expansive today."),
        physical_tendency_text=BiLabel(ta="உடலும் மனமும் ஒரே நோக்கத்தோடு செயல்படும்.", en="Body and mind can stay purposeful and focused."),
        best_use_of_day_text=BiLabel(
            ta="கூட்டு வேலைக்கும், கலந்து பேசவும், வழிகாட்டிகளிடம் ஆலோசனை பெறவும் இன்று நல்ல நாள்.",
            en="Good day for collaboration, guidance, and people-facing work.",
        ),
    ),
    "MARS": EmotionalWeatherResult(
        tone="restless",
        physical_tendency="hyperactive",
        best_use_of_day="execution_sprints",
        avoid_before=BiLabel(
            ta="அவசரப் பேச்சுகளையும் வேகமான முடிவுகளையும் குறைப்பது நல்லது.",
            en="Reduce rushed discussions and impulsive calls.",
        ),
        tone_text=BiLabel(ta="இன்று உள்ளுக்குள் வேகம் அதிகமாக இருக்கும்; மனம் கொஞ்சம் அமைதியில்லாமல் இருக்கலாம்.", en="Emotional tone may feel restless with high internal drive."),
        physical_tendency_text=BiLabel(ta="உடலில் அதிக வேகமோ இறுக்கமோ இருக்கலாம்.", en="Physical tendency may be overactive or tense."),
        best_use_of_day_text=BiLabel(
            ta="சின்னச் சின்ன வேலைகளை வேகமாக முடிக்கவும், நிலுவையில் உள்ளவற்றை முடித்து வைக்கவும் இன்று சரியான நாள்.",
            en="Use for short execution sprints and pending task closure.",
        ),
    ),
    "VENUS": EmotionalWeatherResult(
        tone="calm",
        physical_tendency="balanced",
        best_use_of_day="creative",
        avoid_before=None,
        tone_text=BiLabel(ta="இன்று மனம் அமைதியாக, சமமாக இருக்கலாம்.", en="Tone is likely calm and balanced today."),
        physical_tendency_text=BiLabel(ta="உடலும் மனமும் ஒத்துப்போகும்.", en="Body-mind rhythm can feel more balanced."),
        best_use_of_day_text=BiLabel(
            ta="படைப்பு வேலைகளுக்கும், உறவுகளில் இணக்கத்துக்கும், எதையும் நன்றாக எடுத்துச் சொல்லவும் இன்று நல்ல நாள்.",
            en="Supportive for creative tasks, harmonising relationships, and presentation work.",
        ),
    ),
    "RAHU": EmotionalWeatherResult(
        tone="scattered",
        physical_tendency="anxious",
        best_use_of_day="single_task_routine",
        avoid_before=BiLabel(
            ta="பெரிய புதிய பொறுப்புகளை ஏற்கும் முன், இன்று கொஞ்சம் நிதானித்து யோசிப்பது நல்லது.",
            en="Pause before making major new commitments today.",
        ),
        tone_text=BiLabel(ta="இன்று மனம் கொஞ்சம் சிதறலாம்.", en="Tone may become scattered or mentally noisy today."),
        physical_tendency_text=BiLabel(ta="பெரிய காரணம் இல்லாமலே கொஞ்சம் பதற்றம் வரலாம்.", en="Mild anxiety or over-alertness can appear."),
        best_use_of_day_text=BiLabel(
            ta="ஒரு நேரத்தில் ஒரு வேலை செய்யுங்கள்; பட்டியல் போட்டு ஒவ்வொன்றாக முடிப்பது இன்று நல்லது.",
            en="Best with one-task-at-a-time routine and checklist discipline.",
        ),
    ),
}

_DEFAULT_RESULT = EmotionalWeatherResult(
    tone="calm",
    physical_tendency="steady",
    best_use_of_day="balanced_routine",
    avoid_before=None,
    tone_text=BiLabel(ta="இன்று மனம் பொதுவாக அமைதியாக இருக்கலாம்.", en="Emotional tone is likely steady and calm."),
    physical_tendency_text=BiLabel(ta="உடல்நிலை வழக்கம் போல இருக்கும்.", en="Physical tendency should remain fairly steady."),
    best_use_of_day_text=BiLabel(
        ta="வழக்கமான வேலைகளுக்கும், சின்ன முடிவுகளுக்கும், படிப்படியான முன்னேற்றத்துக்கும் இன்று நல்ல நாள்.",
        en="Well suited for routine progress and practical step-by-step decisions.",
    ),
)

_PLANETS = ("SATURN", "JUPITER", "MARS", "VENUS", "RAHU", "SUN")
_TIE_PRIORITY = ("SATURN", "RAHU", "MARS", "JUPITER", "VENUS", "SUN")


def _angular_distance(a: float, b: float) -> float:
    x = normalize_longitude(a)
    y = normalize_longitude(b)
    d = abs((x - y) % 360.0)
    return 360.0 - d if d > 180.0 else d


def _in_orb(angle: float, target: float, orb: float) -> bool:
    return abs(angle - target) <= orb


def _aspect_score(transit_degree: float, natal_degree: float) -> float:
    d = _angular_distance(transit_degree, natal_degree)
    score = 0.0
    if _in_orb(d, 0.0, 8.0):
        score += 4.0
    if _in_orb(d, 180.0, 6.0):
        score += 3.0
    if _in_orb(d, 120.0, 5.0):
        score += 2.5
    if _in_orb(d, 90.0, 5.0):
        score += 2.0
    return score


def compute_emotional_weather(
    *,
    natal_moon_longitude: float,
    natal_venus_longitude: float,
    lagna_rasi: int,
    transits: Mapping[str, TransitPoint],
) -> EmotionalWeatherResult:
    planet_scores: dict[str, float] = {}

    for planet in _PLANETS:
        point = transits.get(planet)
        if point is None:
            planet_scores[planet] = 0.0
            continue

        moon_activation = _aspect_score(point.absolute_longitude, natal_moon_longitude)
        venus_activation = _aspect_score(point.absolute_longitude, natal_venus_longitude)
        fourth_house_activation = 2.0 if house_from_reference(lagna_rasi, point.rasi) == 4 else 0.0

        # Emotional weather favors Moon activations first, then Venus, then 4th house occupancy.
        planet_scores[planet] = moon_activation * 1.0 + venus_activation * 0.7 + fourth_house_activation

    best_score = max(planet_scores.values(), default=0.0)
    if best_score < 3.0:
        return _DEFAULT_RESULT

    best_planets = [planet for planet, score in planet_scores.items() if score == best_score]
    for planet in _TIE_PRIORITY:
        if planet in best_planets:
            return _TONE_MAP[planet]

    return _DEFAULT_RESULT

