from __future__ import annotations

# Classical karaka chain per life area.
LIFE_AREA_KARAKA: dict[str, dict] = {
    "MARRIAGE": {
        "primary_house": 7,
        "karaka_planets": ["VENUS", "JUPITER"],
        "secondary_houses": [2, 11],
        "age_min": 18,
        "age_max": 60,
    },
    "CHILDREN": {
        "primary_house": 5,
        "karaka_planets": ["JUPITER", "MOON"],
        "secondary_houses": [9, 11],
        "age_min": 18,
        "age_max": 52,
    },
    "CAREER": {
        "primary_house": 10,
        "karaka_planets": ["SUN", "MERCURY", "SATURN"],
        "secondary_houses": [6, 11],
        "age_min": 16,
        "age_max": 70,
    },
    "FINANCE": {
        "primary_house": 2,
        "karaka_planets": ["JUPITER", "VENUS"],
        "secondary_houses": [11, 5],
        "age_min": None,
        "age_max": None,
    },
    "PROPERTY": {
        "primary_house": 4,
        "karaka_planets": ["MOON", "MARS"],
        "secondary_houses": [12, 2],
        "age_min": 25,
        "age_max": None,
    },
    "FOREIGN_TRAVEL": {
        "primary_house": 12,
        "karaka_planets": ["RAHU", "SATURN"],
        "secondary_houses": [9, 3],
        "age_min": None,
        "age_max": None,
    },
    "HEALTH": {
        "primary_house": 1,
        "karaka_planets": ["SUN", "MOON"],
        "secondary_houses": [6, 8],
        "age_min": None,
        "age_max": None,
    },
    "SPIRITUAL": {
        "primary_house": 9,
        "karaka_planets": ["JUPITER", "KETU"],
        "secondary_houses": [12, 5],
        "age_min": None,
        "age_max": None,
    },
}
