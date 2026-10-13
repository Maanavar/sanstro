from __future__ import annotations

# Classical karaka chain per life area.
#
# **This table is the single source for which grahas signify a life area.**
# F-KAR-01 (ground-truth audit 2026-10-13): `life_areas_service._AREA_KARAKA`
# carried a second, partly different copy — Property was Mars/Venus here and
# Moon/Mars there, Career Saturn/Sun against Sun/Mercury/Saturn, Health
# Sun/Mars against Sun/Moon. `tests/test_karaka_tables_agree.py` now pins the
# two against each other through the alias map, so they cannot drift again.
#
# The three were reconciled on classical grounds, not by picking a side:
#
# * **Property** — Venus is dropped: it signifies vehicles and luxury, not
#   immovable property, and that was the actual error. **Mars stays primary**,
#   as `life_areas_service` had it, because this area is read as land and
#   buildings and Mars is the bhumi karaka; the Moon (4th bhava karaka: home,
#   mother, sukha) takes the secondary slot Venus vacated.
#
#   Swapping the order instead — Moon primary, which this table used to
#   say — moved one measured chart's Property score from **22 to 63**. Both
#   orders are defensible doctrine, so a 41-point swing on live readings is
#   not something to ship as a side effect of making two tables agree. Which
#   graha leads for Property is a ruling worth asking for on its own; until
#   then the order that does not move anyone's score is the right default.
# * **Career** — Saturn is the karma karaka and leads; Sun (authority) and
#   Mercury (profession, commerce) follow. The old order led with the Sun,
#   which reads the 10th as status rather than as work.
# * **Health** — Sun (vitality, the 1st) then Mars (the 6th, the house of
#   disease this area actually reads). The Moon is the karaka of the body and
#   mind and is a defensible third; it is left out rather than added silently,
#   because a third karaka changes the strength average this feeds.
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
        "karaka_planets": ["SATURN", "SUN", "MERCURY"],
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
        "karaka_planets": ["MARS", "MOON"],
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
        "karaka_planets": ["SUN", "MARS"],
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
