from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

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


_TONE_MAP: dict[str, EmotionalWeatherResult] = {
    "SUN": EmotionalWeatherResult(
        tone="confident",
        physical_tendency="energised",
        best_use_of_day="leadership",
        avoid_before=None,
        tone_text=BiLabel(ta="Inru aatma nambikkai adhigamaaga irukkalaam; thelivaana mudivugalukku nalla naal.", en="Confidence and clarity may be higher today — good for clear, decisive action."),
        physical_tendency_text=BiLabel(ta="Udalil vetri aaval adhigamaaga irukkalaam.", en="Physical drive and initiative may feel elevated."),
        best_use_of_day_text=BiLabel(
            ta="Thalamai, karuthu solludhal, public presence-kku inru nalla support.",
            en="Supportive for leadership, public presence, and speaking your mind.",
        ),
    ),
    "SATURN": EmotionalWeatherResult(
        tone="heavy",
        physical_tendency="low_energy",
        best_use_of_day="deep_work",
        avoid_before=BiLabel(
            ta="Mukkiya pechugalai saayangaalam varai thalli vaikkalaam.",
            en="Delay emotionally heavy conversations until the evening if possible.",
        ),
        tone_text=BiLabel(ta="Inru mananilai konjam heavy-a irukka vaippu.", en="Emotional tone may feel heavier today."),
        physical_tendency_text=BiLabel(ta="Udal nilaiyil sila mandam anubavikkalaam.", en="Energy may feel slower or lower."),
        best_use_of_day_text=BiLabel(
            ta="Azhamaana, amaidhiyana seyalgalukku inru nalla naal.",
            en="Best used for focused, deep, low-noise work.",
        ),
    ),
    "JUPITER": EmotionalWeatherResult(
        tone="expansive",
        physical_tendency="focused",
        best_use_of_day="people_facing",
        avoid_before=None,
        tone_text=BiLabel(ta="Inru visthaaramum nambikkaiyum adhigamaaga irukkalaam.", en="Tone is likely more open and expansive today."),
        physical_tendency_text=BiLabel(ta="Udal-manasu oru nilaiyil focused-a irukkum.", en="Body and mind can stay purposeful and focused."),
        best_use_of_day_text=BiLabel(
            ta="Kootani, kalandha pesudhal, mentor-udan uraiyadal polavatrai munnerunga.",
            en="Good day for collaboration, guidance, and people-facing work.",
        ),
    ),
    "MARS": EmotionalWeatherResult(
        tone="restless",
        physical_tendency="hyperactive",
        best_use_of_day="execution_sprints",
        avoid_before=BiLabel(
            ta="Avasara uraiyaadalgalai matrum veegamaana mudivugalai kuraiyungal.",
            en="Reduce rushed discussions and impulsive calls.",
        ),
        tone_text=BiLabel(ta="Inru ulloor urjham adhigamaaga, konjam restless-a irukkalaam.", en="Emotional tone may feel restless with high internal drive."),
        physical_tendency_text=BiLabel(ta="Udalil adhiga veegam allathu tension anubavikkalaam.", en="Physical tendency may be overactive or tense."),
        best_use_of_day_text=BiLabel(
            ta="Siru execution sprint-gal, pending task closure-kku inru sariyana naal.",
            en="Use for short execution sprints and pending task closure.",
        ),
    ),
    "VENUS": EmotionalWeatherResult(
        tone="calm",
        physical_tendency="balanced",
        best_use_of_day="creative",
        avoid_before=None,
        tone_text=BiLabel(ta="Inru mananilai samamaaga, amaidhiyudan irukkalaam.", en="Tone is likely calm and balanced today."),
        physical_tendency_text=BiLabel(ta="Udal-manasu inakkamaaga nadakkum saathiyam.", en="Body-mind rhythm can feel more balanced."),
        best_use_of_day_text=BiLabel(
            ta="Creative seyalgal, uravugalil inakkam, nalla presentation velaihalukku inru nalla support.",
            en="Supportive for creative tasks, harmonising relationships, and presentation work.",
        ),
    ),
    "RAHU": EmotionalWeatherResult(
        tone="scattered",
        physical_tendency="anxious",
        best_use_of_day="single_task_routine",
        avoid_before=BiLabel(
            ta="Periya puthiya commitment-galai inru sila neram thalli yosithu sei.",
            en="Pause before making major new commitments today.",
        ),
        tone_text=BiLabel(ta="Inru mananilai konjam scattered-a maaralaam.", en="Tone may become scattered or mentally noisy today."),
        physical_tendency_text=BiLabel(ta="Neradiyaana kaaranam illamal siru anxiety varalaam.", en="Mild anxiety or over-alertness can appear."),
        best_use_of_day_text=BiLabel(
            ta="Oru nerathil oru pani; routine checklist approach moolam nalam peralaam.",
            en="Best with one-task-at-a-time routine and checklist discipline.",
        ),
    ),
}

_DEFAULT_RESULT = EmotionalWeatherResult(
    tone="calm",
    physical_tendency="steady",
    best_use_of_day="balanced_routine",
    avoid_before=None,
    tone_text=BiLabel(ta="Inru mananilai sadharana amaidhiyaaga irukkalaam.", en="Emotional tone is likely steady and calm."),
    physical_tendency_text=BiLabel(ta="Udal nilai sadharana nadaiyil irukkum.", en="Physical tendency should remain fairly steady."),
    best_use_of_day_text=BiLabel(
        ta="Nithana routine, siru-mudivugal, pathivu seyalgalukku inru nalla naal.",
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

