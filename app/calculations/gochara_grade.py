"""Guru / Sani gochara from the Janma Rasi — astrologer rulings D2/D3, 2026-10-04.

Two layers, kept apart on purpose:

CLASSICAL — Phaladeepika ch. 26 (Brihat Samhita agrees on Guru). Guru favours
2/5/7/9/11 and is non-supportive everywhere else. Sani favours only 3/6/11 and
every other house needs some degree of care: the detailed verses name
difficulties in the 5th, 7th, 9th and 10th as well, not only in the Sade Sati /
Ashtama houses.

VINAADI GRADING — a presentation layer over the classical one, *not* a
classical verse. Guru in 1/3/4/10 reads "Mixed" rather than adverse, so the
surface avoids catastrophic wording; 6/8/12 need care. Sani has no mixed band.

The named Saturn periods (Ezharai 12/1/2, Ardhashtama 4, Ashtama 8) are a
separate axis — named alerts, not this grade. The 7th and 10th need care
because of the gochara table, not because they belong to a named cycle.

Mirrored for web and mobile in packages/shared/src/api/transits.ts
(`gocharaGrade`); tests/test_gochara_grade.py pins the two to the same table.
"""
from __future__ import annotations

from typing import Literal

GURU_SUPPORTIVE_FROM_MOON: frozenset[int] = frozenset({2, 5, 7, 9, 11})
GURU_NON_SUPPORTIVE_FROM_MOON: frozenset[int] = frozenset({1, 3, 4, 6, 8, 10, 12})
SANI_SUPPORTIVE_FROM_MOON: frozenset[int] = frozenset({3, 6, 11})
SANI_NEEDS_CARE_FROM_MOON: frozenset[int] = frozenset({1, 2, 4, 5, 7, 8, 9, 10, 12})

# Named Saturn periods — alerts in their own right, not the gochara grade.
SADE_SATI_FROM_MOON: frozenset[int] = frozenset({12, 1, 2})
ARDHASHTAMA_SANI_FROM_MOON: frozenset[int] = frozenset({4})
ASHTAMA_SANI_FROM_MOON: frozenset[int] = frozenset({8})
NAMED_SANI_PERIOD_HOUSES: frozenset[int] = SADE_SATI_FROM_MOON | ARDHASHTAMA_SANI_FROM_MOON | ASHTAMA_SANI_FROM_MOON

# Vinaadi's presentation band for Guru (D3): non-supportive, but not adverse.
GURU_MIXED_FROM_MOON: frozenset[int] = frozenset({1, 3, 4, 10})

GocharaGrade = Literal["SUPPORTIVE", "MIXED", "NEEDS_CARE"]


def gochara_grade(planet: str, house_from_moon: int) -> GocharaGrade | None:
    """Vinaadi's grade for Guru/Sani by house from the Janma Rasi.

    None for any other planet: Rahu/Ketu have no astrologer-approved gochara
    table yet, and the faster grahas are not graded on this surface.
    """
    key = {"GURU": "JUPITER", "SANI": "SATURN"}.get(planet, planet)
    if key == "JUPITER":
        if house_from_moon in GURU_SUPPORTIVE_FROM_MOON:
            return "SUPPORTIVE"
        if house_from_moon in GURU_MIXED_FROM_MOON:
            return "MIXED"
        return "NEEDS_CARE"
    if key == "SATURN":
        return "SUPPORTIVE" if house_from_moon in SANI_SUPPORTIVE_FROM_MOON else "NEEDS_CARE"
    return None
