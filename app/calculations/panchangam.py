from __future__ import annotations

import logging
from collections.abc import Iterator, Sequence
from dataclasses import dataclass, replace
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.calculations.astro import (
    RASI_NAMES,
    julian_day_to_utc_datetime,
    nakshatra_from_degree,
    normalize_longitude,
    rasi_from_degree,
    resolve_timezone,
    utc_datetime_to_julian_day,
    utc_datetime_to_local_datetime,
)
from app.calculations.ephemeris import (
    RiseTransitUndefinedError,
    calculate_lagna_degree,
    calculate_rise_transit_jd,
    calculate_sidereal_planets,
    calculate_sun_moon_longitudes,
)
from app.constants.astrology import NAKSHATRA_NAMES
from app.data.durmuhurtham_rules import DURMUHURTHAM_DAYLIGHT_INDICES
from app.models.panchangam_cache import PanchangamCache

logger = logging.getLogger(__name__)

# Tamil tithi names (Thirukanitham tradition — numbered 1 to 15, same for both pakshas)
TITHI_NAMES = [
    "PRATHAMA",     # 1 — பிரதமை
    "DVITHIYAI",    # 2 — துவிதியை
    "THRITHIYAI",   # 3 — திரிதியை
    "CHATHURTHI",   # 4 — சதுர்த்தி
    "PANCHAMI",     # 5 — பஞ்சமி
    "SHASHTI",      # 6 — சஷ்டி
    "SAPTAMI",      # 7 — சப்தமி
    "ASHTAMI",      # 8 — அஷ்டமி
    "NAVAMI",       # 9 — நவமி
    "DASAMI",       # 10 — தசமி
    "EKADASI",      # 11 — ஏகாதசி
    "DVADASI",      # 12 — துவாதசி
    "THRAYODASI",   # 13 — திரயோதசி
    "CHATHURDASI",  # 14 — சதுர்தசி
    "POURNAMI",     # 15 (Shukla) / AMAVASAI (Krishna) — handled by paksha logic
]


YOGA_NAMES = [
    "VISHKAMBHA",
    "PRITI",
    "AYUSHMAN",
    "SAUBHAGYA",
    "SHOBHANA",
    "ATIGANDA",
    "SUKARMA",
    "DHRITI",
    "SHOOLA",
    "GANDA",
    "VRIDDHI",
    "DHRUVA",
    "VYAGHATA",
    "HARSHANA",
    "VAJRA",
    "SIDDHI",
    "VYATIPATA",
    "VARIYANA",
    "PARIGHA",
    "SHIVA",
    "SIDDHA",
    "SADHYA",
    "SHUBHA",
    "SHUKLA",
    "BRAHMA",
    "INDRA",
    "VAIDHRITI",
]

MOVABLE_KARANAS = [
    "BAVA",
    "BALAVA",
    "KAULAVA",
    "TAITILA",
    "GARAJA",
    "VANIJA",
    "VISHTI",
]

WEEKDAY_NAMES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
WEEKDAY_LORDS = {
    0: "MOON",
    1: "MARS",
    2: "MERCURY",
    3: "GURU",
    4: "VENUS",
    5: "SATURN",
    6: "SUN",
}

# Weekday slot tables (8-slot daytime grid, Mon=0..Sun=6).
# Canonical sequence used by QA golden cases. These are weekday rule tables, not
# ephemeris output — they are identical under Thirukanitham and Vakya, which
# differ only in sunrise/sunset and therefore in where the slot boundaries fall.
# Sun Mon Tue Wed Thu Fri Sat
RAHU_SLOT = {6: 8, 0: 2, 1: 7, 2: 5, 3: 6, 4: 4, 5: 3}
YAMA_SLOT = {6: 5, 0: 4, 1: 3, 2: 2, 3: 1, 4: 7, 5: 6}
KULIGAI_SLOT = {6: 7, 0: 6, 1: 5, 2: 4, 3: 3, 4: 2, 5: 1}
# Gowri Panchangam full engine tables. Day slots run sunrise->sunset; night slots
# run sunset->next sunrise. Names are kept normalized for API consumers.
# Traditional Gowri Panchangam kala names, per the project's frozen spec
# (docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md §4.8a),
# cross-checked against drikpanchang.com's Tamil Gowri Panchangam for Chennai.
# The eight kalas are AMIRTHAM, VISHAM, ROGAM, LABHAM, DHANAM, SUGAM, SORAM, UTHI,
# but they are NOT a single rotating 8-cycle — see GOWRI_DAY_TABLE below for the
# actual rotation rule (seven kalas rotate; VISHAM is placed at the Rahu slot).
# Good kalas (5 of 8): AMIRTHAM (best), UTHI, LABHAM, DHANAM, SUGAM.
# Bad kalas (3 of 8): ROGAM, SORAM, VISHAM.
GOWRI_GOOD_NAMES = frozenset({"AMIRTHAM", "UTHI", "LABHAM", "DHANAM", "SUGAM"})
GOWRI_GOOD_RANK = {
    "AMIRTHAM": 1,
    "UTHI": 2,
    "LABHAM": 3,
    "DHANAM": 4,
    "SUGAM": 5,
}
# NOTE: web/lib/gowri.ts (GOWRI_CATEGORY_DETAILS) duplicates these label/purpose strings
# verbatim for the dashboard, since the API does not expose per-slot localized fields.
# Keep both in sync when editing.
GOWRI_GOOD_LABELS_EN = {
    "AMIRTHAM": "Amirtham",
    "UTHI": "Uthi",
    "LABHAM": "Labham",
    "DHANAM": "Dhanam",
    "SUGAM": "Sugam",
}
GOWRI_GOOD_LABELS_TA = {
    "AMIRTHAM": "அமிர்தம்",
    "UTHI": "உத்தி",
    "LABHAM": "லாபம்",
    "DHANAM": "தனம்",
    "SUGAM": "சுகம்",
}
GOWRI_GOOD_PURPOSE_EN = {
    "AMIRTHAM": "best overall — any important activity",
    "UTHI": "new starts, jobs, official work, and applications",
    "LABHAM": "profit, business, deals, buying, and selling",
    "DHANAM": "money, finance, investments, and wealth matters",
    "SUGAM": "comfort, health, family peace, travel, and routine good work",
}
GOWRI_GOOD_PURPOSE_TA = {
    "AMIRTHAM": "மிகச் சிறந்த பொது நல்ல நேரம் — அனைத்து முக்கிய செயல்களுக்கும்",
    "UTHI": "புதிய தொடக்கம், வேலை, அலுவல், விண்ணப்பங்களுக்கு நல்லது",
    "LABHAM": "லாபம், வணிகம், ஒப்பந்தம், வாங்கல்/விற்பனைக்கு நல்லது",
    "DHANAM": "பணம், நிதி, முதலீடு போன்ற செல்வம் சார்ந்த விஷயங்களுக்கு நல்லது",
    "SUGAM": "ஆறுதல், ஆரோக்கியம், குடும்ப அமைதி, பயணம், வழக்கமான நல்ல வேலைகளுக்கு நல்லது",
}
# The three inauspicious kalas. Named here (not just good ones) because the daily
# guidance now has to say *which* bad kala spoiled an otherwise-good window —
# "avoid 1:58 pm" is unactionable, "Rogam starts 1:58 pm" is checkable against the
# panchangam page. Mirrors GOWRI_BAD_CATEGORY_DETAILS in web/lib/gowri.ts.
GOWRI_BAD_LABELS_EN = {
    "ROGAM": "Rogam",
    "SORAM": "Soram",
    "VISHAM": "Visham",
}
GOWRI_BAD_LABELS_TA = {
    "ROGAM": "ரோகம்",
    "SORAM": "சோரம்",
    "VISHAM": "விஷம்",
}
# Day-slot starting kala per weekday (0=Mon … 6=Sun), 8 kalas sunrise→sunset.
# Starting kalas: Sun=Uthi, Mon=Amirtham, Tue=Rogam, Wed=Labham,
#                 Thu=Dhanam, Fri=Sugam, Sat=Soram (Tamil Nadu tradition).
#
# Only SEVEN kalas rotate — one per weekday lord, advancing one step each
# weekday. VISHAM does NOT rotate with them: it is inserted at a weekday-
# specific slot, displacing the rest. For the daytime that slot is exactly
# RAHU_SLOT — Visham is Rahu.
#
# Modelling Gowri as a rotation of a single EIGHT-kala cycle (as this file did
# until v36) cannot express that, because it drags VISHAM around in lockstep
# with the rotation while Rahu Kalam's slot moves on its own non-uniform table.
# The two only coincide on Sun/Wed, so 5 of 7 weekdays were wrong — placing a
# good kala on Rahu Kalam (Thursday printed AMIRTHAM, "best overall", across it).
GOWRI_ROTATING_KALAS = ("UTHI", "AMIRTHAM", "ROGAM", "LABHAM", "DHANAM", "SUGAM", "SORAM")


def _gowri_day_row(weekday_index: int) -> tuple[str, ...]:
    """The eight daytime Gowri kalas for a weekday (Mon=0 … Sun=6).

    Sunday's rotation starts at UTHI and each following weekday starts one kala
    later, which under Python's Mon=0 keying is (weekday_index + 1) % 7. VISHAM
    then takes the Rahu Kalam slot.

    Derived from RAHU_SLOT rather than transcribed so the Visham/Rahu identity
    cannot silently drift apart again. Two earlier hand-transcribed corrections
    (v25, v27) both preserved the bug precisely because every row still looked
    like a valid rotation when checked in isolation.
    """
    start = (weekday_index + 1) % 7
    row = [GOWRI_ROTATING_KALAS[(start + i) % 7] for i in range(7)]
    row.insert(RAHU_SLOT[weekday_index] - 1, "VISHAM")
    return tuple(row)


GOWRI_DAY_TABLE = {weekday: _gowri_day_row(weekday) for weekday in range(7)}

# Night VISHAM slot per weekday (0=Mon … 6=Sun), 8 kalas sunset→next sunrise.
#
# Source: astrologer-supplied Gowri night table (2026-07-17), independently
# corroborated by drikpanchang (Drik Ganita = Thirukanitham) and Prokerala.
# Unlike the daytime, night VISHAM does NOT sit on a Rahu Kalam slot, so it
# cannot be derived from RAHU_SLOT the way _gowri_day_row does — these values
# are the reference data itself, not a computation.
#
# They are not arbitrary, though: the Rahu Kalam weekday mnemonic assigns day
# slots 2..8 in the order Mon, Sat, Fri, Wed, Thu, Tue, Sun, and stepping +3
# along that same order lands exactly on each weekday's night VISHAM slot
# (i.e. NIGHT_VISHAM_SLOT[w] == ((RAHU_SLOT[w] - 2 + 3) % 7) + 2 on all seven
# rows). That identity is asserted in tests as a cross-check, but the table
# below stays the source of truth: a rule inferred from seven fitted points is
# weaker evidence than the reference it was fitted to, and an earlier attempt to
# infer this table by analogy with the day rule is exactly what produced the bug
# these values fix.
NIGHT_VISHAM_SLOT = {6: 4, 0: 5, 1: 3, 2: 8, 3: 2, 4: 7, 5: 6}


def _gowri_night_row(weekday_index: int) -> tuple[str, ...]:
    """The eight night Gowri kalas for a weekday (Mon=0 … Sun=6).

    Same shape as _gowri_day_row: seven rotating kalas with VISHAM inserted at a
    weekday-specific slot, displacing the rest. The night rotation starts four
    kalas after the day rotation, and VISHAM takes NIGHT_VISHAM_SLOT rather than
    the Rahu slot.

    Until 2026-07-17 this was a hand-written rotation of a single eight-kala
    cycle, which dragged VISHAM around in lockstep with the rotation — the same
    modelling error v36 fixed for the day table, and wrong on the same 5 of 7
    weekdays (Mon/Tue/Thu/Fri/Sat).
    """
    start = ((weekday_index + 1) % 7 + 4) % 7
    row = [GOWRI_ROTATING_KALAS[(start + i) % 7] for i in range(7)]
    row.insert(NIGHT_VISHAM_SLOT[weekday_index] - 1, "VISHAM")
    return tuple(row)


GOWRI_NIGHT_TABLE = {weekday: _gowri_night_row(weekday) for weekday in range(7)}

# Subha/ashubha nitya yoga names per Thirukanitha tradition.
SUBHA_YOGAS = {"SIDDHA", "SHUBHA", "VARIYANA", "HARSHANA", "BRAHMA", "INDRA"}
ASHUBHA_YOGAS = {
    "VISHKAMBHA",
    "VYAGHATA",
    "GANDA",
    "SHOOLA",
    "ATIGANDA",
    "VAJRA",
    "VYATIPATA",
    "PARIGHA",
    "VAIDHRITI",
}

# Auspicious tithis for muhurtham (Shukla paksha 2,3,5,6,7,10,11,12,13; Krishna 2,3,6,7,10,11)
SUBHA_TITHIS_SHUKLA = {2, 3, 5, 6, 7, 10, 11, 12, 13}
SUBHA_TITHIS_KRISHNA = {2, 3, 6, 7, 10, 11}

# Auspicious nakshatras for muhurtham (Thirukanitha list — Tamil names matching NAKSHATRA_NAMES)
SUBHA_NAKSHATRAS = {
    "ASWINI",         # 1  — Ashwini
    "ROHINI",         # 4  — Rohini
    "MIRUGASEERIDAM", # 5  — Mrigashira
    "PUNARPOOSAM",    # 7  — Punarvasu
    "POOSAM",         # 8  — Pushya
    "HASTHAM",        # 13 — Hasta
    "CHITHIRAI",      # 14 — Chitra
    "SWATHI",         # 15 — Swati
    "ANUSHAM",        # 17 — Anuradha
    "MOOLAM",         # 19 — Mula
    "UTHIRADAM",      # 21 — Uttarashada
    "UTHIRATTATHI",   # 26 — Uttarabhadrapada
    "REVATHI",        # 27 — Revati
    "MAGAM",          # 10 — Magha
    "UTHIRAM",        # 12 — Uttaraphalguni
    "THIRUVONAM",     # 22 — Shravana
    "AVITTAM",        # 23 — Dhanishtha
}
# The same list keyed by canonical 1..27 number, for callers that hold a
# nakshatra number rather than a display name. Derived rather than hand-listed
# so the two can never disagree. Every name above resolves against
# NAKSHATRA_NAMES — the `.upper().replace("H", "")` fuzz that two former
# muhurta scorers used to compare these was guarding a mismatch that does not
# exist, and is gone.
SUBHA_NAKSHATRA_NUMBERS: frozenset[int] = frozenset(
    NAKSHATRA_NAMES.index(name) + 1 for name in SUBHA_NAKSHATRAS
)
# Soolam (சூலம்): the inauspicious travel direction for the day, by weekday
# (0=Mon..6=Sun, matching RAHU_SLOT). Parigaram is the remedy food traditionally
# eaten before travelling in the Soolam direction to nullify its effect.
# SOOLAM_DIRECTION verified 2026-07 audit. SOOLAM_PARIGARAM_BY_DIRECTION corrected
# 2026-07-14 (astrologer-supplied): East/West were swapped (East->Curd not Jaggery,
# West->Jaggery not Curd), and North/South refined to more specific Tamil words
# (பசும்பால்=fresh/raw milk, நல்லெண்ணெய்=sesame oil) rather than generic பால்/எண்ணெய்.
SOOLAM_DIRECTION = {
    0: "கிழக்கு",   # Monday — East
    1: "வடக்கு",    # Tuesday — North
    2: "வடக்கு",    # Wednesday — North
    3: "தெற்கு",    # Thursday — South
    4: "மேற்கு",    # Friday — West
    5: "கிழக்கு",   # Saturday — East
    6: "மேற்கு",    # Sunday — West
}
SOOLAM_PARIGARAM_BY_DIRECTION = {
    "கிழக்கு": "தயிர்",
    "மேற்கு": "வெல்லம்",
    "வடக்கு": "பசும்பால்",
    "தெற்கு": "நல்லெண்ணெய்",
}

# Nethiram (நேத்திரம்) and Jeevan (ஜீவன்): daily vitality/clarity indicators
# derived from the current Sun nakshatra and the day's Moon nakshatra.
#
# Method note: this uses a *symmetric* ring distance (shorter of the two
# directions around the 27-nakshatra circle) from the Sun's nakshatra, unlike the
# *directional* tara-style counts elsewhere in this codebase (see Dinam porutham,
# `_dinam_score`). The 2026-07 audit flagged that asymmetry as suspect by analogy
# and the display was gated pending review.
#
# CONFIRMED (2026-07-16): the project's astrologer verified the values and the
# display was restored to all three surfaces on that confirmation. The formula
# and the distance<=1/9/8 and distance<=2/8 cutoffs below are unchanged, so the
# confirmation necessarily covers them as written — the directional analogy above
# does not apply to Jeevan/Nethiram.
#
# CAVEAT for a future reviewer: the specific printed sources were not recorded
# in-repo, so the provenance Doctrine §7 originally asked for (two independent
# printed panchangams) is not reproducible from this repository alone. Treat the
# tables as confirmed-by-review, not as independently re-derivable, and re-obtain
# the sources if this is ever re-litigated.
JEEVAN_LABELS = {0: "இல்லை", 0.5: "அரை வாழ்க்கை", 1: "முழு வாழ்க்கை"}
NETHIRAM_LABELS = {0: "குருடு", 1: "ஒரு கண்", 2: "இரு கண்"}


def _nakshatra_ring_distance(a: int, b: int) -> int:
    diff = abs(a - b) % 27
    return min(diff, 27 - diff)


def _jeevan_value(sun_nakshatra: int, reference_nakshatra: int) -> float:
    """Jeevan on the 0 / 0.5 / 1 scale, sharing Nethiram's 8|9 boundary.

    ── 2026-08-27, astrologer ruling (§7 Q7 of the function & calculation
    review). The `distance == 9 -> 0` line that used to sit here is deleted. ──

    It could not be right, and that is provable from this file alone without a
    printed panchangam. Nethiram and Jeevan are one paired rubric — an almanac
    prints them together and they are read together. Their cutoffs agree
    everywhere except at ring distance exactly 9, where the old table produced
    **இரு கண் (both eyes, the best Nethiram) beside ஜீவன் இல்லை (no life, the
    worst Jeevan)** — the only cell in the whole 0-13 domain that pairs the best
    of one with the worst of the other, and a pairing no almanac prints. It also
    made Jeevan non-monotonic in the ring distance: 0.5 at 8, 0 at 9, 1 at 10.
    No graded ring rule dips for one value and recovers.

    Ring distance 9 lands on roughly 7% of days (2 of 27 stars), which is
    frequent enough to be the 2026-08-10 live case the review recorded as
    contradicting our table.

    With the line gone the two move together in three coherent grades:
    குருடு+இல்லை, ஒரு கண்+அரை, இரு கண்+முழு.

    This is a correction for internal consistency, NOT a sourced re-derivation.
    The cutoffs themselves (<=1, <=8) are still the confirmed-by-review values
    with no printed source captured in-repo, and Jeevan/Nethiram both keep their
    standing status: **display-only, zero scoring reach.** Neither may be given
    weight in the daily score, muhurta ranking or porutham until a named almanac
    — publisher, edition, page, and whether Vakya or Thirukanitham — supplies
    the table.
    """
    distance = _nakshatra_ring_distance(sun_nakshatra, reference_nakshatra)
    if distance <= 1:
        return 0
    if distance <= 8:
        return 0.5
    return 1


def _nethiram_value(sun_nakshatra: int, reference_nakshatra: int) -> int:
    distance = _nakshatra_ring_distance(sun_nakshatra, reference_nakshatra)
    if distance <= 2:
        return 0
    if distance <= 8:
        return 1
    return 2

# Amirdhadhi Yogam (அமிர்தாதி யோகம்): fixed weekday + nakshatra table used by
# Tamil almanacs to grade each day's yoga. Four classes: Amirtha (A, auspicious),
# Siddha (C, neutral-good), Marana (M, inauspicious), and Prabalarishta (P, a
# 4th class ~3x worse than Marana). Full 7x27 grid re-sourced 2026-07-14 from the
# Ungal Vazhkkai Vazhikatti panchangam (astrologer-supplied), internally
# consistent (every row covers 27 nakshatras once). NOTE: this REVERSES the
# 2026-07 audit's premise that the seven Amrita Siddhi *Yoga* muhurta pairs must
# read "A" here — that conflated the muhurta yoga (7 special day/star combos) with
# this daily-classification table. The Amrita-Siddhi pairs actually land on the
# Siddha (C) class (the "Siddhi" tell), so v29's Tue+Ashwini / Wed+Anuradha "A"
# corrections were wrong and are reverted.
#
# CROSS-CHECK DONE (2026-07-15, full-ownership web research): the two flagged
# Prabalarishta cells — Thu(Kettai/18) and Fri(Pooradam/20) — are CONFIRMED
# correct against the source publisher's own public article ("Amirtha/Chitha/
# Marana yoga", ungalvazhkkai.seithisaral.in): Thursday+Kettai and Friday+Pooradam
# are each explicitly stated to be Prabalarishta. Their apparent "divergence" from
# the classical Dagdha-yoga list (Thu→U.Phalguni, Fri→Jyeshtha) is a TAXONOMY
# difference, not an error — Prabalarishta and Dagdha are distinct yogas. Further
# corroboration: the whole Thursday Marana row here (Krittika, Rohini, Mrigasira,
# Ardra, U.Phalguni, Shatabhisha) matches Ernst Wilhelm's "fatal Dagdha Yoga on
# Jupiter's Vara" set exactly, and the whole Friday Marana row (Rohini, Pushya,
# Ashlesha, Magha, Kettai, Shravana) matches the same source cell-for-cell. Cells
# locked by tests/test_panchangam.py (Amirdhadhi cross-check section).
AMIRDHADHI_YOGAM_LABELS = {
    "A": "அமிர்தயோகம்",
    "C": "சித்தயோகம்",
    "M": "மரணயோகம்",
    "P": "பிரபலாரிஷ்ட யோகம்",
}
AMIRDHADHI_YOGAM_TABLE = {
    6: ("C", "P", "C", "C", "C", "C", "C", "C", "C", "M", "C", "A", "C", "C", "C", "M", "M", "M", "A", "C", "A", "A", "M", "C", "C", "A", "A"),  # Sun
    0: ("C", "C", "M", "A", "C", "C", "A", "C", "C", "M", "C", "C", "C", "P", "A", "M", "C", "C", "C", "M", "M", "A", "C", "C", "M", "C", "C"),  # Mon
    1: ("C", "C", "C", "A", "C", "M", "C", "C", "C", "C", "C", "A", "C", "C", "C", "M", "C", "M", "A", "C", "P", "C", "C", "M", "M", "A", "C"),  # Tue
    2: ("M", "C", "A", "C", "C", "C", "C", "C", "C", "C", "A", "A", "M", "C", "C", "C", "C", "C", "M", "A", "A", "C", "P", "C", "A", "C", "M"),  # Wed
    3: ("A", "C", "M", "M", "M", "M", "A", "C", "C", "A", "C", "M", "C", "C", "A", "C", "C", "P", "C", "C", "C", "C", "C", "M", "C", "C", "C"),  # Thu
    4: ("A", "C", "C", "M", "C", "C", "C", "M", "M", "M", "C", "C", "A", "C", "C", "C", "C", "M", "A", "P", "C", "M", "C", "C", "C", "C", "C"),  # Fri
    5: ("C", "C", "C", "A", "C", "C", "C", "C", "M", "A", "C", "M", "M", "M", "C", "C", "C", "C", "C", "C", "C", "C", "C", "A", "M", "C", "P"),  # Sat
}

PANCHANGAM_CACHE_TTL_HOURS = 24
DEFAULT_AYANAMSA_TYPE = "LAHIRI"
# v22: persist the civil-day dominant tithi/nakshatra/yoga numbers in the cached
# record so the monthly calendar reads them instead of re-walking the ephemeris.
# v23: (historical, no-op) touched only GOWRI_NALLA_NERAM_SUMMARY_TABLE, a table
# that was never read by any API path — the engine has always derived displayed
# Gowri Nalla Neram times from ephemeris slots. That dead table was removed in v27.
# v24: persist rasi-specific Chandrashtamam janma-nakshatra windows with local
# start/end timestamps so clients can show the exact affected star timing.
# v25: corrected Gowri Panchangam category names — VILAMBHI/ANANDHA/SHODAM/KALAM
# were not valid Gowri kala names (cross-checked against the frozen spec in
# docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md §4.8a
# and drikpanchang.com's Tamil Gowri Panchangam); renamed in place to
# AMIRTHAM/UTHI/DHANAM/SUGAM/SORAM (rotation positions unchanged).
# v26: chandrashtamam_today_nakshatras was computed from a DRAFT generic-offset
# table that contradicted the correctly-computed janma_nakshatra_windows in the
# same payload; now derived from those windows so both fields agree.
# v27: GOWRI_DAY_TABLE/GOWRI_NIGHT_TABLE had a transcription bug — 5 of 7 rows in
# each table were not true rotations of the master 8-kala cycle (VISHAM displaced
# from its correct slot); corrected to genuine rotations per spec §4.8a. Removed
# the dead GOWRI_NALLA_NERAM_SUMMARY_TABLE.
# v28: Subha Muhurtham "Rahu tithi" exclusion sets ({8,9} broad vs {8,14} strict)
# were mutually inconsistent and didn't match the classical Rikta group; both now
# use RIKTA_TITHIS_IN_PAKSHA = {4, 9, 14}.
# v29: AMIRDHADHI_YOGAM_TABLE corrected at Tue+Ashwini and Wed+Anuradha (were
# சித்தயோகம், should be அமிர்தயோகம் per the classical Amrita Siddhi Yoga pairs).
# v30: persist pradhosham_tithi_number (tithi at pradhosha-kalam / sunset) so
# Pradhosam is dated from the sunset tithi, not the sunrise tithi (issue #10).
# v31: AMIRDHADHI_YOGAM_TABLE fully re-sourced from the Ungal Vazhkkai Vazhikatti
# panchangam (17 cells changed vs v30); added a 4th class Prabalarishta (P). This
# reverts v29's Tue+Ashwini / Wed+Anuradha "A" corrections (the Amrita-Siddhi-Yoga
# muhurta pairs land on Siddha/C, not Amirtha/A). Persisted amirdhadhi_yogam_name
# strings change, so cached snapshots must recompute.
# v32: SOOLAM_PARIGARAM_BY_DIRECTION corrected (A-8, 2026-07-14) — East/West foods
# were swapped, North/South refined to பசும்பால்/நல்லெண்ணெய். Persisted
# soolam_parigaram values change, so cached snapshots must recompute.
# v33: sunrise/sunset switched to Hindu sunrise (disc center, no refraction,
# geocentric — SE_BIT_HINDU_RISING) per Doctrine §1 (WI-07, 2026-07-16),
# replacing Swiss Ephemeris's default upper-limb+refracted rise/set. Every
# sunrise-anchored field changes by roughly 2-4 minutes later: sunrise,
# sunset, Rahu kalam, Yamagandam, Kuligai, all eight kalam divisions, horai,
# udaya tithi/nakshatra, sunrise lagna, Gowri Panchangam, and the Tamil solar
# calendar's sunset cutoff. Cached snapshots must recompute. Code-complete;
# validation against printed panchangam references is pending (see WI-07 in
# docs/CALC_AUDIT_REMEDIATION_PLAN_2026-07.md) — do not mark the doctrine
# launch-gate closed until that cross-check lands.
# v34: persist nishita_tithi_number (tithi at nishita-kalam / local midnight
# following sunrise) so Sivarathiri is dated from the nishita tithi, not the
# sunrise tithi (M-2, docs/ASTROLOGY_FULL_CODE_AUDIT_2026-07-16.md) — same
# error class as v30's Pradhosam fix.
# v35: daily Nalla Neram + Gowri Nalla Neram summaries are now derived from the
# Gowri good kalas on the real sunrise grid and selected clear of Rahu Kalam /
# Yamagandam / Kuligai. Previously Gowri Nalla Neram blindly took the first good
# kala (which IS Yamagandam every Thursday and Rahu Kalam every Saturday, since
# the kalas share the same 8-part grid), and Nalla Neram used a fixed clock table
# that drifted into the computed bad kalams on many days. Persisted nalla_neram /
# gowri_nalla_neram windows change, so cached snapshots must recompute.
# v36: GOWRI_DAY_TABLE was built as a rotation of a single 8-kala cycle, which
# dragged VISHAM around with the rotation. VISHAM does not rotate — it sits on
# the Rahu Kalam slot, whose weekday table is not a uniform rotation. The two
# models agree only on Sun/Wed, so 5 of 7 weekdays were wrong: 15 of 56 day slots
# misnamed, 10 of them good<->bad inverted, and on Tue/Thu/Fri/Sat a GOOD kala was
# printed across Rahu Kalam (Thursday showed AMIRTHAM, "best overall"). The day
# table is now DERIVED from RAHU_SLOT. Verified slot-for-slot against
# drikpanchang (Drik Ganita = Thirukanitham) for all 7 weekdays, 17-24 Jul 2026.
# Displayed Gowri kala names and Saturday's morning Nalla Neram change, so cached
# snapshots must recompute. NIGHT table left unchanged at the time — fixed in v37.
# v37: GOWRI_NIGHT_TABLE had the same modelling error v36 fixed for the day table
# (single rotating 8-kala cycle, dragging VISHAM around with the rotation) and was
# wrong on the same 5 of 7 weekdays: Mon/Tue/Thu/Fri/Sat. v36 left it alone because
# night VISHAM does not sit on the night Rahu slot and no rule could be derived for
# it; the table is now built from NIGHT_VISHAM_SLOT, astrologer-supplied reference
# data corroborated by drikpanchang and Prokerala. Measured impact: 15 of 56 night
# slots renamed, 10 of them good<->bad inverted; the night Gowri Nalla Neram window
# moves on TUESDAY only (21:25->20:00 start, as UTHI moves from night slot 3 to 2),
# and the daytime Nalla Neram is untouched. Persisted gowri_panchangam and Tuesday's
# gowri_nalla_neram change, so cached snapshots must recompute.
# v38: the nalla_neram / gowri_nalla_neram summary windows now carry the NAME of
# the Gowri kala they were cut from (it was dropped as None, which silently
# disabled best_gowri_slot's ranking — every window tied at rank 999 and it
# degraded to "earliest" — and blanked the morning push's category/purpose lines,
# built from gowri_good_label(None)). Gowri Nalla Neram also now takes the
# best-RANKED clear good kala of each half rather than the first, and skips a
# window Nalla Neram already prints: taking the first made its DAY window
# identical to the AM Nalla Neram window by construction, so two cards showed one
# window twice. Persisted nalla_neram / gowri_nalla_neram change, so cached
# snapshots must recompute.
# v39: the NIGHT half of Gowri Nalla Neram is now the EARLIEST clear good kala,
# not the best-ranked one. v38 ranked both halves for symmetry, but Amirtham
# advances one slot per weekday, so ranking the night walked the announced window
# around the clock: on the Aug 2026 Chennai grid it fell at 04:33 (Fri), 03:06
# (Sat), 01:40 (Sun) and after 22:47 (Mon/Tue) — 5 of 7 weekdays outside any hour
# a reader would act on. Earliest-clear-good holds all seven inside 18:26-21:21.
# The DAY half is unchanged (still ranked, still skipping Nalla Neram's windows).
# Persisted gowri_nalla_neram changes on 6 of 7 weekdays, so cached snapshots must
# recompute.
# v42 (2026-08-17, EC-RULING-03): Hora changed from unequal day/night twelfths
# to twenty-four EQUAL one-hour periods from local sunrise. Every cached
# snapshot carries a serialised `hora` array, so without this bump the cache
# would keep serving the old unequal boundaries — and the muhurta picker reads
# those boundaries to choose the clock time it recommends. The correction would
# have been invisible on any date already warmed into the cache.
# v43 (2026-08-19, doctrine ruling R-1): snapshots now carry `*_spans` — every
# value each limb takes across the solar day — and the `dominant_*` scalars are
# derived from those spans (sunrise-to-sunrise) instead of an independent
# midnight-to-midnight walk. Duration-weighted scoring reads the spans, so a
# cached record written without them would score every limb as zero-weight; the
# bump is what stops a warmed cache from serving the old flat answer.
PANCHANGAM_CACHE_DATA_VERSION = 43
DOMINANT_SPECIAL_TITHIS = {15, 30}

# Fixed weekday clock-table Nalla Neram windows. NOTE (2026-07-17): the daily
# panchangam no longer uses this table — its Nalla Neram is now derived from the
# Gowri good kalas on the real sunrise->sunset grid and kept clear of Rahu Kalam
# / Yamagandam / Kuligai (see _compute_nalla_neram). This table is retained only
# for the location-agnostic muhurtham-naal listing (muhurtham_naal_service),
# which has no coordinates to compute a sunrise-based Gowri grid and shows no
# inauspicious kalams beside these windows, so there is nothing to collide with.
NALLA_NERAM_SUMMARY_TABLE = {
    # Mon
    0: ((6 * 60 + 30, 7 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Tue
    1: ((7 * 60 + 30, 8 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Wed
    2: ((9 * 60 + 30, 10 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Thu
    3: ((10 * 60 + 30, 11 * 60 + 30, "AM"), (12 * 60 + 30, 13 * 60 + 30, "PM")),
    # Fri
    4: ((9 * 60 + 30, 10 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Sat
    5: ((7 * 60 + 30, 8 * 60 + 30, "AM"), (16 * 60 + 30, 17 * 60 + 30, "PM")),
    # Sun
    6: ((7 * 60 + 30, 8 * 60 + 30, "AM"), (15 * 60 + 30, 16 * 60 + 30, "PM")),
}

@dataclass(frozen=True, slots=True)
class PanchangamSlot:
    start: datetime
    end: datetime
    slot: int
    name: str | None = None
    period: str | None = None
    is_good: bool | None = None


def _gowri_key(name: str | None) -> str:
    return str(name or "").upper()


def gowri_category_rank(name: str | None) -> int:
    return GOWRI_GOOD_RANK.get(_gowri_key(name), 999)


def gowri_good_label(name: str | None, lang: str = "en") -> str | None:
    key = _gowri_key(name)
    labels = GOWRI_GOOD_LABELS_TA if lang == "ta" else GOWRI_GOOD_LABELS_EN
    return labels.get(key)


def gowri_good_purpose(name: str | None, lang: str = "en") -> str | None:
    key = _gowri_key(name)
    purposes = GOWRI_GOOD_PURPOSE_TA if lang == "ta" else GOWRI_GOOD_PURPOSE_EN
    return purposes.get(key)


def gowri_kala_label(name: str | None, lang: str = "en") -> str | None:
    """Display name for any Gowri kala, good or bad. `gowri_good_label` returns
    None for Rogam/Soram/Visham by design (it backs the "what is this good for"
    copy); callers that must *name a cause* need all eight."""
    good = gowri_good_label(name, lang)
    if good:
        return good
    labels = GOWRI_BAD_LABELS_TA if lang == "ta" else GOWRI_BAD_LABELS_EN
    return labels.get(_gowri_key(name))


def best_gowri_slot(
    slots: Sequence[PanchangamSlot] | PanchangamSlot | None,
) -> PanchangamSlot | None:
    if not slots:
        return None
    if hasattr(slots, "start") and hasattr(slots, "end"):
        candidates = [slots]
    else:
        candidates = list(slots)
    if not candidates:
        return None
    return min(
        candidates,
        key=lambda slot: (
            gowri_category_rank(getattr(slot, "name", None)),
            getattr(slot, "start", datetime.max),
        ),
    )


@dataclass(frozen=True, slots=True)
class PanchangamHoraEntry:
    index: int
    lord: str
    start: datetime
    end: datetime


@dataclass(frozen=True, slots=True)
class PanchangamChandrashtamamNakshatraWindow:
    name: str
    start: datetime
    end: datetime


@dataclass(frozen=True, slots=True)
class PanchangamLagnaWindow:
    """One contiguous daylight interval with the same sidereal rising sign."""

    rasi_number: int
    rasi_name: str
    start: datetime
    end: datetime


@dataclass(frozen=True, slots=True)
class PanchangamLimbSpan:
    """One contiguous stretch of a single tithi / nakshatra / yoga / karana value,
    clipped to the solar day it is reported for.

    The scalar `<limb>_number` fields on the snapshot are the value at **sunrise**
    — the classical உதய rule, which is what *names* the day. That name is not the
    whole truth about the day: measured against real ephemeris boundaries at
    Chennai over 2026-08, the sunrise nakshatra holds less than half the day on
    46.6% of days, the sunrise karana on 97.5%. A span list is what lets a caller
    that needs the *duration* answer (scoring) get it without contradicting the
    caller that needs the *name* answer (the calendar).

    `fraction` is this span's share of the solar day, so a weighted score never
    has to re-derive it from the timestamps.
    """

    number: int
    name: str
    start: datetime
    end: datetime
    fraction: float


@dataclass(frozen=True, slots=True)
class PanchangamSnapshot:
    date_local: date
    timezone_name: str
    latitude: float
    longitude: float
    sunrise: datetime
    sunset: datetime
    solar_noon: datetime
    weekday: str
    weekday_lord: str
    tithi_number: int
    tithi_name: str
    tithi_paksha: str
    tithi_ends_at: datetime
    nakshatra_number: int
    nakshatra_name: str
    nakshatra_pada: int
    nakshatra_ends_at: datetime
    yoga_number: int
    yoga_name: str
    yoga_ends_at: datetime
    yoga_next_name: str
    karana_name: str
    karana_ends_at: datetime
    karana_next_name: str
    rahu_kalam: PanchangamSlot
    yamagandam: PanchangamSlot
    kuligai: PanchangamSlot
    gowri_panchangam: list[PanchangamSlot]
    nalla_neram: list[PanchangamSlot]
    gowri_nalla_neram: list[PanchangamSlot]
    durmuhurtham: list[PanchangamSlot]
    abhijit_start: datetime
    abhijit_end: datetime
    abhijit_restricted: bool
    is_subha_muhurtham: bool
    subha_muhurtham_reason: str
    is_subha_muhurtham_strict: bool
    subha_muhurtham_strict_reason: str
    hora: list[PanchangamHoraEntry]
    moon_phase_label: str
    tithi_next_number: int
    tithi_next_name: str
    tithi_next_paksha: str
    special_tithi_day_number: int | None
    nakshatra_next_name: str
    soolam_direction: str
    soolam_parigaram: str
    nethiram: str
    jeevan: str
    # Values after the Moon's star changes at `nakshatra_ends_at` — see where
    # these are computed. No default: this block sits before the dataclass's
    # remaining required fields, and a defaulted field here would make every
    # one of them positional-after-default. Deserialisation supplies "" for a
    # record written before these existed.
    nethiram_next: str
    jeevan_next: str
    lagna_rasi_number: int
    lagna_rasi_name: str
    lagna_ends_at: datetime
    lagna_nazhigai: int
    lagna_vinadi: int
    amirdhadhi_yogam_name: str
    amirdhadhi_yogam_ends_at: datetime
    amirdhadhi_yogam_next_name: str
    chandrashtamam_moon_rasi_number: int
    chandrashtamam_moon_rasi_name: str
    chandrashtamam_affected_janma_rasi_number: int
    chandrashtamam_affected_janma_rasi_name: str
    chandrashtamam_today_nakshatras: tuple[str, ...]
    chandrashtamam_janma_nakshatra_windows: tuple[PanchangamChandrashtamamNakshatraWindow, ...] = ()
    warnings: tuple[str, ...] = ()
    # Every value each limb takes across the SOLAR day (this sunrise to the next),
    # in order. The scalars above are the value at sunrise — the உதய rule, which
    # names the day; these are what it actually *did*. Doctrine ruling R-1
    # (2026-08-19) splits the two: naming stays sunrise-keyed, scoring is
    # duration-weighted over these spans. Empty means "not computed" (an old cache
    # record) — callers must fall back to the scalar rather than scoring a
    # zero-length day. See `limb_weighted` / `limb_fraction` / `dominant_from_spans`.
    tithi_spans: tuple[PanchangamLimbSpan, ...] = ()
    nakshatra_spans: tuple[PanchangamLimbSpan, ...] = ()
    yoga_spans: tuple[PanchangamLimbSpan, ...] = ()
    karana_spans: tuple[PanchangamLimbSpan, ...] = ()
    # The Moon's rasi across the same solar day. Not a panchangam limb, but
    # chandrashtama is scored from it and it moves mid-day often enough to
    # matter — see the `moon_rasi` entry in `_LIMB_WALKERS`.
    moon_rasi_spans: tuple[PanchangamLimbSpan, ...] = ()
    # Dominant (longest-span) value across the solar day, derived from the spans
    # above — not an independent walk, so the two can never disagree. Kept as
    # scalars because the monthly grid and the cache read them directly.
    # 0 means "not computed" — callers fall back to the sunrise scalar.
    dominant_tithi_number: int = 0
    dominant_nakshatra_number: int = 0
    dominant_yoga_number: int = 0
    # Tithi prevailing at pradhosha-kalam (sunset). Pradhosam is a sunset-anchored
    # observance, so it must be dated from this, not the sunrise tithi (issue #10).
    # 0 means "not computed" — callers fall back to the sunrise tithi.
    pradhosham_tithi_number: int = 0
    # Tithi prevailing at nishita-kalam (local midnight following this day's
    # sunrise). Nishita-anchored observances (Sivarathiri) must be dated from
    # this, not the sunrise tithi (M-2). 0 means "not computed" — callers fall
    # back to the sunrise tithi.
    nishita_tithi_number: int = 0
    # Calculated only for the picker’s shortlisted dates: a full schedule costs
    # an ephemeris boundary search for each rising-sign change.
    lagna_schedule: tuple[PanchangamLagnaWindow, ...] = ()


def _format_hhmm(moment: datetime) -> str:
    return moment.strftime("%H:%M")


def _angle_continuous(angle_fn, jd_start: float, jd: float, base_angle: float) -> float:
    angle = normalize_longitude(angle_fn(jd))
    if angle < base_angle - 180.0:
        angle += 360.0
    return angle


def _find_next_boundary_jd(start_jd: float, angle_fn, step_degrees: float) -> float:
    base_angle = normalize_longitude(angle_fn(start_jd))
    current_index = int((base_angle + 1e-9) // step_degrees) + 1
    target_angle = current_index * step_degrees
    if target_angle > 360.0:
        target_angle = 360.0

    lo = start_jd
    hi = start_jd + 1 / 24
    while hi - lo <= 4.0:
        hi_angle = _angle_continuous(angle_fn, start_jd, hi, base_angle)
        if hi_angle >= target_angle:
            break
        hi += 1 / 24
    else:
        return hi

    for _ in range(64):
        mid = (lo + hi) / 2
        mid_angle = _angle_continuous(angle_fn, start_jd, mid, base_angle)
        if mid_angle >= target_angle:
            hi = mid
        else:
            lo = mid
    return hi


def _sun_moon_at_jd(jd: float) -> tuple[float, float]:
    """The two longitudes every panchangam angle is a function of.

    Split from `_calculate_positions_at_sunrise` purely for cost: the boundary
    searches below bisect 64 times per boundary and never look at the warnings,
    so they have no reason to compute — and build dataclasses for — the six
    bodies a tithi, nakshatra or yoga angle does not involve.
    """
    return calculate_sun_moon_longitudes(jd)


def _tithi_angle_at_jd(jd: float) -> float:
    sun, moon = _sun_moon_at_jd(jd)
    return normalize_longitude(moon - sun)


def _tithi_number_at_jd(jd: float) -> int:
    return int((_tithi_angle_at_jd(jd) + 1e-9) // 12) + 1


def _nakshatra_angle_at_jd(jd: float) -> float:
    _, moon = _sun_moon_at_jd(jd)
    return normalize_longitude(moon)


def _nakshatra_number_at_jd(jd: float) -> int:
    return int((_nakshatra_angle_at_jd(jd) + 1e-9) // (40 / 3)) + 1


def _yoga_angle_at_jd(jd: float) -> float:
    sun, moon = _sun_moon_at_jd(jd)
    return normalize_longitude(sun + moon)


def _yoga_number_at_jd(jd: float) -> int:
    return int((_yoga_angle_at_jd(jd) + 1e-9) // (40 / 3)) + 1


def _civil_day_bounds_jd(date_local: date, timezone_name: str) -> tuple[float, float]:
    timezone_obj = resolve_timezone(timezone_name)
    start_local = datetime.combine(date_local, datetime.min.time(), tzinfo=timezone_obj)
    end_local = start_local + timedelta(days=1)
    start_jd = utc_datetime_to_julian_day(start_local.astimezone(UTC))
    end_jd = utc_datetime_to_julian_day(end_local.astimezone(UTC))
    return start_jd, end_jd


def _state_durations_for_civil_day(
    date_local: date,
    timezone_name: str,
    *,
    value_at_jd,
    boundary_at_jd,
    max_transitions: int,
) -> tuple[dict[int, float], int]:
    start_jd, end_jd = _civil_day_bounds_jd(date_local, timezone_name)
    noon_value = int(value_at_jd((start_jd + end_jd) / 2))

    durations: dict[int, float] = {}
    cursor = start_jd
    for _ in range(max_transitions):
        if cursor >= end_jd - 1e-10:
            break
        current_value = int(value_at_jd(cursor))
        next_boundary = boundary_at_jd(cursor)
        interval_end = min(next_boundary, end_jd)
        durations[current_value] = durations.get(current_value, 0.0) + max(0.0, interval_end - cursor) * 86400.0
        if next_boundary >= end_jd:
            break
        cursor = min(next_boundary + 1e-8, end_jd)

    return durations, noon_value


def _special_tithi_durations_for_civil_day(
    date_local: date,
    timezone_name: str,
) -> dict[int, float]:
    durations, _ = _state_durations_for_civil_day(
        date_local,
        timezone_name,
        value_at_jd=_tithi_number_at_jd,
        boundary_at_jd=lambda jd: _find_next_boundary_jd(jd, _tithi_angle_at_jd, 12.0),
        max_transitions=8,
    )
    durations = {number: durations.get(number, 0.0) for number in DOMINANT_SPECIAL_TITHIS}
    return durations


def _karana_index_at_jd(jd: float) -> int:
    return int((_tithi_angle_at_jd(jd) + 1e-9) // 6)


# One entry per limb: how to read its value, how to find its next boundary, how
# to name it, and how many transitions a solar day can hold. The counts are the
# observed maxima plus headroom — measured over 2026-08..2027-07 at Chennai a
# solar day holds at most 2 nakshatra / 2 tithi / 3 yoga / 4 karana values, and
# the walk stops at the day's end regardless, so these are a runaway guard
# rather than a modelling claim.
_LIMB_WALKERS: dict[str, tuple] = {
    "tithi": (_tithi_number_at_jd, _tithi_angle_at_jd, 12.0, lambda n: _tithi_name(n), 8),
    "nakshatra": (_nakshatra_number_at_jd, _nakshatra_angle_at_jd, 40 / 3, lambda n: NAKSHATRA_NAMES[(n - 1) % 27], 6),
    "yoga": (_yoga_number_at_jd, _yoga_angle_at_jd, 40 / 3, lambda n: _yoga_name(n), 6),
    "karana": (_karana_index_at_jd, _tithi_angle_at_jd, 6.0, lambda n: _karana_name(n), 10),
    # Not one of the five limbs, but the same shape and the same need: the Moon
    # crosses a rasi boundary on roughly two days in five, and chandrashtama —
    # worth -25 to the Moon score — is a rasi test, so scoring it off a single
    # instant has the same defect the limbs had.
    "moon_rasi": (lambda jd: rasi_from_degree(_nakshatra_angle_at_jd(jd)), _nakshatra_angle_at_jd, 30.0, lambda n: RASI_NAMES[n], 3),
}


def limb_spans_between(
    limb: str,
    start_jd: float,
    end_jd: float,
    timezone_name: str,
) -> tuple[PanchangamLimbSpan, ...]:
    """Every distinct value one limb takes between two instants, in order.

    Uses the same boundary search the scalar `<limb>_ends_at` fields use, so a
    span list can never disagree with the scalar beside it about where the
    boundary falls.
    """
    value_at_jd, angle_at_jd, step_degrees, name_of, max_transitions = _LIMB_WALKERS[limb]
    total = end_jd - start_jd
    if total <= 0:
        return ()

    spans: list[PanchangamLimbSpan] = []
    # Two cursors on purpose. `probe` is nudged past each boundary so the next
    # `value_at_jd` reads the new value rather than re-reading the old one at
    # the boundary instant; `span_start` is the boundary itself. Reporting the
    # nudged instant instead left an 845 microsecond gap between consecutive
    # spans — small enough to look like nothing, big enough that "these spans
    # tile the day" stopped being true and any interval intersection built on
    # them silently lost time at every boundary.
    span_start = start_jd
    probe = start_jd
    for _ in range(max_transitions):
        if span_start >= end_jd - 1e-10:
            break
        number = int(value_at_jd(probe))
        boundary = _find_next_boundary_jd(probe, angle_at_jd, step_degrees)
        span_end = min(boundary, end_jd)
        spans.append(PanchangamLimbSpan(
            number=number,
            name=name_of(number),
            start=utc_datetime_to_local_datetime(julian_day_to_utc_datetime(span_start), timezone_name),
            end=utc_datetime_to_local_datetime(julian_day_to_utc_datetime(span_end), timezone_name),
            fraction=max(0.0, (span_end - span_start) / total),
        ))
        if boundary >= end_jd:
            break
        span_start = boundary
        probe = min(boundary + 1e-8, end_jd)
    return tuple(spans)


def dominant_from_spans(spans: Sequence[PanchangamLimbSpan]) -> int | None:
    """The limb value holding the largest share of the day, or None if unknown.

    Ties break towards the *earlier* value, which is the one the உதய rule already
    named — so on a genuine 50/50 day the dominant reading and the sunrise
    reading agree rather than diverging on a rounding artefact.
    """
    if not spans:
        return None
    totals: dict[int, float] = {}
    first_seen: dict[int, int] = {}
    for index, span in enumerate(spans):
        totals[span.number] = totals.get(span.number, 0.0) + span.fraction
        first_seen.setdefault(span.number, index)
    return max(totals.items(), key=lambda item: (item[1], -first_seen[item[0]]))[0]


def dominant_span_name(spans: Sequence[PanchangamLimbSpan]) -> str | None:
    """Name of the value holding the largest share of the day.

    Separate from `dominant_from_spans` because a karana span's `number` is its
    0..59 index within the lunar month, which no caller can turn back into a
    name without re-deriving the karana table.
    """
    dominant = dominant_from_spans(spans)
    if dominant is None:
        return None
    return next((span.name for span in spans if span.number == dominant), None)


def limb_fraction(spans: Sequence[PanchangamLimbSpan], predicate) -> float:
    """Share of the day (0..1) whose span satisfies `predicate`.

    `predicate` receives the whole `PanchangamLimbSpan`, not just its number, so
    a karana rule can test `span.name == "VISHTI"` without the caller having to
    re-derive a name from a 0..59 index.
    """
    if not spans:
        return 0.0
    return sum(span.fraction for span in spans if predicate(span))


def limb_weighted(spans: Sequence[PanchangamLimbSpan], value_fn) -> float:
    """Duration-weighted mean of `value_fn(span)` across the day.

    This is the primitive behind doctrine ruling R-1 (2026-08-19): the sunrise
    value *names* the day, but a value holding fifteen minutes of it must not
    carry a full day's score. With a single span this returns exactly what the
    old scalar-keyed code returned, so a day with no transition is unchanged —
    which is what keeps the change invisible on the ~53% of days that do not
    split, and confines the movement to the days that genuinely do.
    """
    if not spans:
        return 0.0
    total = sum(span.fraction for span in spans)
    if total <= 0:
        return 0.0
    return sum(value_fn(span) * span.fraction for span in spans) / total


def dominant_special_tithi_for_civil_day(
    date_local: date,
    timezone_name: str,
) -> int | None:
    """Return Amavasai/Pournami only for the civil date with the longest span."""
    current = _special_tithi_durations_for_civil_day(date_local, timezone_name)
    active_specials = {
        tithi_number
        for tithi_number, duration in current.items()
        if duration > 0
    }
    if not active_specials:
        return None

    previous = _special_tithi_durations_for_civil_day(date_local - timedelta(days=1), timezone_name)
    following = _special_tithi_durations_for_civil_day(date_local + timedelta(days=1), timezone_name)

    candidates: list[tuple[float, int]] = []
    for tithi_number in active_specials:
        duration = current[tithi_number]
        if duration >= previous[tithi_number] and duration >= following[tithi_number]:
            candidates.append((duration, tithi_number))

    if not candidates:
        return None
    return max(candidates)[1]


def _tithi_name(number: int) -> str:
    if number == 30:
        return "AMAVASAI"
    return TITHI_NAMES[(number - 1) % 15]


def _yoga_name(number: int) -> str:
    return YOGA_NAMES[(number - 1) % 27]


def _karana_name(index: int) -> str:
    if index == 0:
        return "KIMSTUGHNA"
    if 1 <= index <= 56:
        return MOVABLE_KARANAS[(index - 1) % 7]
    return {57: "SHAKUNI", 58: "CHATUSHPADA", 59: "NAGA"}[index]


def _weekday_lord_and_name(day: date) -> tuple[str, str]:
    weekday_index = day.weekday()
    return WEEKDAY_NAMES[weekday_index], WEEKDAY_LORDS[weekday_index]


def _slot_datetime(start: datetime, duration: timedelta, slot_number: int) -> PanchangamSlot:
    slot_start = start + duration * (slot_number - 1)
    slot_end = slot_start + duration
    return PanchangamSlot(start=slot_start, end=slot_end, slot=slot_number)


def _durmuhurtham_windows(
    sunrise: datetime,
    sunset: datetime,
    weekday: str,
) -> list[PanchangamSlot]:
    """Build the verified Durmuhurtham daylight slots for one local date.

    A weekday rule supplies only 1-based indices on the fifteen-part daylight
    grid.  The duration is never a fixed number of minutes: it is derived from
    this date and location's actual sunrise-to-sunset interval.
    """
    indices = DURMUHURTHAM_DAYLIGHT_INDICES.get(weekday, ())
    invalid = [index for index in indices if not 1 <= index <= 15]
    if invalid:
        raise ValueError(f"Durmuhurtham indices must be in 1..15, got {invalid!r}")
    duration = (sunset - sunrise) / 15
    return [
        PanchangamSlot(
            start=sunrise + duration * (index - 1),
            end=sunrise + duration * index,
            slot=index,
            name="DURMUHURTHAM",
            period="DAY",
            is_good=False,
        )
        for index in indices
    ]


def _gowri_slot_datetime(
    start: datetime,
    duration: timedelta,
    slot_number: int,
    name: str,
    period: str,
) -> PanchangamSlot:
    slot_start = start + duration * (slot_number - 1)
    slot_end = slot_start + duration
    return PanchangamSlot(
        start=slot_start,
        end=slot_end,
        slot=slot_number,
        name=name,
        period=period,
        is_good=name in GOWRI_GOOD_NAMES,
    )


# The Hora lord sequence, in the order the classical texts give it — the
# descending-geocentric-distance order, not the weekday order. Successive horas
# step one place along it; successive weekdays step by five (7 horas × 24 ÷ 7).
_HORA_SEQUENCE: tuple[str, ...] = ("SUN", "VENUS", "MERCURY", "MOON", "SATURN", "GURU", "MARS")

#: Twenty-four horas of exactly one clock hour each, from local sunrise.
_HORA_DURATION = timedelta(hours=1)
_HORAS_PER_DAY = 24


def _make_hora_entries(
    sunrise: datetime,
    sunset: datetime,
    next_sunrise: datetime,
    weekday_lord: str,
) -> list[PanchangamHoraEntry]:
    """Twenty-four EQUAL one-hour horas, anchored at true local sunrise.

    EC-RULING-03 (2026-08-17). This used to divide daylight into twelve and night
    into twelve — the unequal seasonal method. That is the Hellenistic planetary
    hour, and it had been conflated with the Tamil Horai system, which is equal
    clock hours from sunrise.

    The decisive evidence is internal to the tradition: the printed table runs
    ``6-7, 7-8, 8-9 …`` in whole hours, and the **6-1-8-3 mnemonic** — the hora
    ruling at 6 a.m. recurs at 1 p.m., 8 p.m. and 3 a.m. — only resolves if a
    hora is exactly sixty minutes, because the cycle has to land seven clock
    hours later every time. Under the unequal method a Chennai hora runs 63.9 min
    in June and 56.2 min in December, and the sunrise lord's first recurrence
    drifts ~27 minutes off the mnemonic in both directions. On a ~60-minute
    window that is nearly half a hora, and the muhurta picker returns a clock
    time whose stated reason is the hora it sits inside.

    `sunset` and `next_sunrise` are no longer used to size the horas, but stay in
    the signature: they are what makes this function's contract "a day, bounded
    by real astronomical events" rather than "a timestamp", and the caller
    already holds them. The 6 a.m. anchor of the printed table is illustrative
    only — the true local sunrise from the Thirukkanitham layer is what is used,
    exactly as the ruling requires.
    """
    first_index = _HORA_SEQUENCE.index(weekday_lord)
    return [
        PanchangamHoraEntry(
            index=i + 1,
            lord=_HORA_SEQUENCE[(first_index + i) % 7],
            start=sunrise + _HORA_DURATION * i,
            end=sunrise + _HORA_DURATION * (i + 1),
        )
        for i in range(_HORAS_PER_DAY)
    ]


def _truncate_to_minute(moment: datetime) -> datetime:
    return moment.replace(second=0, microsecond=0)


def _windows_overlap(
    a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime
) -> bool:
    """Overlap test at whole-minute (display) granularity.

    Times are shown to the user rounded to the minute, so two windows only
    "collide" if they still overlap once rounded. Comparing on the raw datetimes
    would flag a shared kala boundary (e.g. a night Gowri kala that starts
    exactly at sunset, where the day's last inauspicious kalam ends) or a
    sub-minute floating-point sliver as a spurious overlap.
    """
    a_s, a_e = _truncate_to_minute(a_start), _truncate_to_minute(a_end)
    b_s, b_e = _truncate_to_minute(b_start), _truncate_to_minute(b_end)
    return a_s < b_e and b_s < a_e


def _clear_of_bad_kalams(
    start: datetime, end: datetime, bad_slots: Sequence[PanchangamSlot]
) -> bool:
    """True when [start, end) does not overlap Rahu Kalam / Yamagandam / Kuligai."""
    return not any(_windows_overlap(start, end, b.start, b.end) for b in bad_slots)


def _compute_gowri_panchangam(
    sunrise: datetime,
    sunset: datetime,
    next_sunrise: datetime,
    weekday_index: int,
) -> list[PanchangamSlot]:
    """All 16 named Gowri slots across the panchangam day and night."""
    day_duration = (sunset - sunrise) / 8
    night_duration = (next_sunrise - sunset) / 8
    day_slots = [
        _gowri_slot_datetime(sunrise, day_duration, i + 1, name, "DAY")
        for i, name in enumerate(GOWRI_DAY_TABLE[weekday_index])
    ]
    night_slots = [
        _gowri_slot_datetime(sunset, night_duration, i + 1, name, "NIGHT")
        for i, name in enumerate(GOWRI_NIGHT_TABLE[weekday_index])
    ]
    return day_slots + night_slots


def _compute_gowri_nalla_neram(
    gowri_panchangam: Sequence[PanchangamSlot],
    bad_slots: Sequence[PanchangamSlot],
    nalla_neram: Sequence[PanchangamSlot] = (),
) -> list[PanchangamSlot]:
    """Compact day/night Gowri Nalla Neram summary derived from the Gowri slots.

    Returns one auspicious Gowri kala for the DAY and one for the NIGHT, each
    clear of Rahu Kalam / Yamagandam / Kuligai. Gowri kalas and the inauspicious
    kalams are cut from the same 8-part sunrise->sunset grid, so an auspicious
    kala can fall on the exact same slot as a bad kalam — e.g. Thursday's first
    good kala (DHANAM) IS Yamagandam. A reliable panchangam never announces such
    a slot as "nalla neram"; the clearance filter reproduces that.

    The two halves are picked by DIFFERENT rules, deliberately.

    DAY is best-RANKED — Amirtham where the day has one, else
    Uthi > Labham > Dhanam > Sugam (gowri_category_rank), the earlier window
    breaking a tie — and skips any window Nalla Neram already prints. Taking the
    FIRST clear good day kala made the DAY window identical to the morning Nalla
    Neram window *by construction* (that window is defined as the first clear
    good day kala, see _compute_nalla_neram), so the two cards printed the same
    window twice and the second told the reader nothing. It falls back to the
    ranked best only when the day has no other clear good kala.

    NIGHT is EARLIEST, not ranked. Ranking it looked symmetric with the day but
    announced an unusable hour: Amirtham advances one slot per weekday, so
    "always Amirtham" walked the night window right around the clock — on the
    Aug 2026 Chennai grid it landed at 04:33 (Fri), 03:06 (Sat) and 01:40 (Sun),
    and after 22:47 on Mon/Tue. A reader takes a night window to mean "this
    evening"; earliest-clear-good holds all seven weekdays inside the
    18:26-21:21 band while still only ever naming a genuinely auspicious kala.
    NIGHT needs no Nalla-Neram skip either — Nalla Neram is daytime-only, so the
    two can never collide.

    Rahu Kalam is a special case: since v36 the day table places VISHAM on the
    Rahu slot by construction, so a good DAY kala can never overlap Rahu Kalam
    and that half of the check is a no-op kept for defence. It still bites on the
    NIGHT side, whose table remains uncorrected. (Before v36 the day table put a
    good kala on Rahu Kalam on 4 of 7 weekdays, and this filter was silently
    papering over that bug.)
    """
    def _clear_good(period: str) -> list[PanchangamSlot]:
        return [
            s for s in gowri_panchangam
            if s.period == period and s.is_good and _clear_of_bad_kalams(s.start, s.end, bad_slots)
        ]

    day_ranked = sorted(_clear_good("DAY"), key=lambda s: (gowri_category_rank(s.name), s.start))
    night_chronological = sorted(_clear_good("NIGHT"), key=lambda s: s.start)
    already_printed = {(s.start, s.end) for s in nalla_neram}

    summary_slots: list[PanchangamSlot] = []
    if day_ranked:
        day_pick = next(
            (s for s in day_ranked if (s.start, s.end) not in already_printed),
            day_ranked[0],
        )
        summary_slots.append(PanchangamSlot(
            start=day_pick.start,
            end=day_pick.end,
            slot=1,
            name=day_pick.name,
            period="DAY",
            is_good=True,
        ))

    if night_chronological:
        night_pick = night_chronological[0]
        summary_slots.append(PanchangamSlot(
            start=night_pick.start,
            end=night_pick.end,
            slot=2,
            name=night_pick.name,
            period="NIGHT",
            is_good=True,
        ))

    return summary_slots


def _compute_nalla_neram(
    gowri_panchangam: Sequence[PanchangamSlot],
    bad_slots: Sequence[PanchangamSlot],
    solar_noon: datetime,
) -> list[PanchangamSlot]:
    """Everyday morning + evening Nalla Neram windows.

    Reliable Tamil panchangams print the daily "நல்ல நேரம்" as a காலை (morning)
    and a மாலை (evening) window — the earliest and the latest auspicious Gowri
    kala of the daytime — always chosen clear of Rahu Kalam / Yamagandam /
    Kuligai. We reproduce that: take the FIRST and the LAST good Gowri kala of the
    day that are clear of the inauspicious kalams, and label each AM/PM by whether
    it falls before or after solar noon.

    This replaces the earlier fixed clock-time table, which was divorced from the
    day's actual sunrise and therefore drifted into the astronomically-computed
    Rahu Kalam / Yamagandam on many days (e.g. Sunday's PM window sat entirely
    inside Kuligai). The location-agnostic muhurtham-naal listing still uses the
    fixed weekday table (it has no coordinates and shows no kalams beside it).
    """
    day_good_clear = sorted(
        (
            s for s in gowri_panchangam
            if s.period == "DAY" and s.is_good and _clear_of_bad_kalams(s.start, s.end, bad_slots)
        ),
        key=lambda s: s.start,
    )
    if not day_good_clear:
        return []

    # Morning = earliest clear good kala; evening = latest clear good kala. When
    # only one exists (e.g. a very short winter day heavily hemmed by kalams),
    # show that single window rather than duplicating it.
    picks = [day_good_clear[0]]
    if day_good_clear[-1] is not day_good_clear[0]:
        picks.append(day_good_clear[-1])

    # Carry the source kala's name. It used to be dropped here, which quietly
    # disabled every consumer that ranks or names a nalla-neram window:
    # best_gowri_slot() tied all windows at rank 999 and degraded to "earliest",
    # and the morning push built its category/purpose lines from
    # gowri_good_label(None) -> None, so they never rendered.
    return [
        PanchangamSlot(
            start=pick.start,
            end=pick.end,
            slot=slot_number,
            name=pick.name,
            period="AM" if pick.start < solar_noon else "PM",
            is_good=True,
        )
        for slot_number, pick in enumerate(picks, start=1)
    ]


# Classical Rikta tithi group (4th/9th/14th of each paksha, per the
# Nanda/Bhadra/Jaya/Rikta/Purna panchaka classification) — excluded from
# muhurtham regardless of paksha. Amavasai is handled separately via
# tithi_number == 30. 2026-07 audit: the broad and strict muhurtham checks
# previously used different, non-classical sets ({8,9} and {8,14} respectively,
# both mislabeled "Rahu tithi" — Rahu Kalam is a time-of-day concept unrelated
# to tithi); standardized on the classical Rikta set here. Ashtami (8) is
# deliberately excluded from this set — it's Jaya group, not Rikta.
RIKTA_TITHIS_IN_PAKSHA = {4, 9, 14}
MUHURTHAM_BLOCKED_WEEKDAYS = {1, 5}  # Tuesday, Saturday


def _muhurtham_weekday_block_reason(weekday_index: int) -> str:
    weekday_name = WEEKDAY_NAMES[weekday_index].title()
    return f"Inauspicious: {weekday_name} excluded for Subha Muhurtham in Tamil tradition"


def _compute_subha_muhurtham_broad(
    tithi_number: int,
    nakshatra_name: str,
    weekday_index: int,
) -> tuple[bool, str]:
    """Nakshatra-led Subha Muhurtham check matching how published Tamil almanacs list
    wedding-muhurtham dates — the day's nakshatra is the deciding factor, while
    Tuesday, Saturday, Amavasai, and the Rikta tithis (4th/9th/14th) are excluded."""
    tithi_in_paksha = tithi_number if tithi_number <= 15 else tithi_number - 15

    if weekday_index in MUHURTHAM_BLOCKED_WEEKDAYS:
        return False, _muhurtham_weekday_block_reason(weekday_index)
    if tithi_number == 30:
        return False, "Inauspicious: Amavasai tithi"
    if tithi_in_paksha in RIKTA_TITHIS_IN_PAKSHA:
        return False, f"Inauspicious: {_tithi_name(tithi_number)} (Rikta tithi)"

    if nakshatra_name in SUBHA_NAKSHATRAS:
        return True, f"Auspicious: {nakshatra_name} nakshatra"

    return False, f"Neutral: {nakshatra_name} not a muhurtham nakshatra"


def _compute_subha_muhurtham_strict(
    tithi_number: int,
    tithi_paksha: str,
    nakshatra_name: str,
    yoga_name: str,
    weekday_index: int,
) -> tuple[bool, str]:
    """Stricter Subha Muhurtham check requiring auspicious tithi + nakshatra + nitya yoga
    together — closer to the combination rules many traditional almanacs apply."""
    reasons: list[str] = []
    inauspicious: list[str] = []

    # tithi_number is 1-30 across both pakshas; convert to within-paksha (1-15) for table lookups
    tithi_in_paksha = tithi_number if tithi_number <= 15 else tithi_number - 15

    if weekday_index in MUHURTHAM_BLOCKED_WEEKDAYS:
        return False, _muhurtham_weekday_block_reason(weekday_index)

    if yoga_name in ASHUBHA_YOGAS:
        inauspicious.append(f"{yoga_name} yoga")
    elif yoga_name in SUBHA_YOGAS:
        reasons.append(f"{yoga_name} yoga")

    if tithi_paksha == "SHUKLA" and tithi_in_paksha in SUBHA_TITHIS_SHUKLA:
        reasons.append("auspicious tithi")
    elif tithi_paksha == "KRISHNA" and tithi_in_paksha in SUBHA_TITHIS_KRISHNA:
        reasons.append("auspicious tithi")
    else:
        inauspicious.append("inauspicious tithi")

    if nakshatra_name in SUBHA_NAKSHATRAS:
        reasons.append("auspicious nakshatra")
    else:
        inauspicious.append("inauspicious nakshatra")

    # Amavasai (30) and the classical Rikta tithis (4th/9th/14th) are always inauspicious
    if tithi_in_paksha in RIKTA_TITHIS_IN_PAKSHA or tithi_number == 30:
        inauspicious.append("Rikta tithi / Amavasai")

    is_subha = len(inauspicious) == 0 and len(reasons) >= 2
    if is_subha:
        reason = "Auspicious: " + ", ".join(reasons)
    elif inauspicious:
        reason = "Inauspicious: " + ", ".join(inauspicious)
    else:
        reason = "Neutral day"
    return is_subha, reason


def _moon_phase_label(paksha: str) -> str:
    return "வளர்பிறை (Waxing)" if paksha == "SHUKLA" else "தேய்பிறை (Waning)"


def _next_tithi(tithi_number: int) -> tuple[int, str, str]:
    next_number = (tithi_number % 30) + 1
    next_paksha = "SHUKLA" if next_number <= 15 else "KRISHNA"
    return next_number, _tithi_name(next_number), next_paksha


def _next_nakshatra_name(nakshatra_number: int) -> str:
    next_number = (nakshatra_number % 27) + 1
    return NAKSHATRA_NAMES[next_number - 1]


def _next_yoga_name(yoga_number: int) -> str:
    return _yoga_name((yoga_number % 27) + 1)


def _next_karana_name(karana_index: int) -> str:
    return _karana_name((karana_index + 1) % 60)


def amirdhadhi_yogam_class(weekday: int | str, nakshatra_number: int) -> str:
    """The day's Amirdhadhi class key — "A"/"C"/"M"/"P" — not its Tamil label.

    The label is a display string; the *class* is what a scorer needs, and until
    2026-08-17 nothing could get at it: `_amirdhadhi_yogam_name` returned the
    label only, so the muhurta engine had no way to know a candidate day was
    Marana Yogam and scored it as though it were ordinary. Accepts either the
    Python weekday index (0=Mon … 6=Sun) or the uppercase weekday name that
    `PanchangamSnapshot.weekday` carries, because the engine holds the second.
    """
    if isinstance(weekday, str):
        weekday_index = WEEKDAY_NAMES.index(weekday.upper())
    else:
        weekday_index = weekday
    table = AMIRDHADHI_YOGAM_TABLE[weekday_index]
    return table[(nakshatra_number - 1) % 27]


def _amirdhadhi_yogam_name(weekday_index: int, nakshatra_number: int) -> str:
    return AMIRDHADHI_YOGAM_LABELS[amirdhadhi_yogam_class(weekday_index, nakshatra_number)]


def _chandrashtamam_affected_janma_rasi(moon_rasi_number: int) -> int:
    return ((moon_rasi_number - 8) % 12) + 1


def _moon_rasi_number_at_jd(jd: float) -> int:
    return rasi_from_degree(_nakshatra_angle_at_jd(jd))


def _chandrashtamam_janma_nakshatra_name_at_jd(jd: float) -> str:
    janma_longitude = normalize_longitude(_nakshatra_angle_at_jd(jd) - 210.0)
    return NAKSHATRA_NAMES[nakshatra_from_degree(janma_longitude) - 1]


def _chandrashtamam_janma_nakshatra_windows(
    date_local: date,
    timezone_name: str,
    moon_rasi_number: int,
) -> tuple[PanchangamChandrashtamamNakshatraWindow, ...]:
    start_jd, end_jd = _civil_day_bounds_jd(date_local, timezone_name)
    cursor = start_jd
    found_target_rasi = False
    windows: list[PanchangamChandrashtamamNakshatraWindow] = []

    for _ in range(12):
        if cursor >= end_jd - 1e-10:
            break

        current_moon_rasi = _moon_rasi_number_at_jd(cursor)
        next_nakshatra_boundary = _find_next_boundary_jd(cursor, _nakshatra_angle_at_jd, 40 / 3)
        next_rasi_boundary = _find_next_boundary_jd(cursor, _nakshatra_angle_at_jd, 30.0)
        interval_end = min(next_nakshatra_boundary, next_rasi_boundary, end_jd)

        if current_moon_rasi == moon_rasi_number:
            found_target_rasi = True
            window = PanchangamChandrashtamamNakshatraWindow(
                name=_chandrashtamam_janma_nakshatra_name_at_jd(cursor),
                start=utc_datetime_to_local_datetime(julian_day_to_utc_datetime(cursor), timezone_name),
                end=utc_datetime_to_local_datetime(julian_day_to_utc_datetime(interval_end), timezone_name),
            )
            if windows and windows[-1].name == window.name and abs((window.start - windows[-1].end).total_seconds()) < 1:
                windows[-1] = PanchangamChandrashtamamNakshatraWindow(
                    name=window.name,
                    start=windows[-1].start,
                    end=window.end,
                )
            else:
                windows.append(window)
        elif found_target_rasi:
            break

        cursor = min(interval_end + 1e-8, end_jd)

    return tuple(windows)


def _find_lagna_rasi_boundary_jd(start_jd: float, latitude: float, longitude: float) -> float:
    """Find the JD at which the sidereal ascendant crosses into the next rasi (30°)."""
    base_degree = normalize_longitude(calculate_lagna_degree(start_jd, latitude, longitude))
    base_index = int(base_degree // 30.0)
    target_degree = (base_index + 1) * 30.0
    if target_degree >= 360.0:
        target_degree = 0.0

    def _continuous_degree(jd: float) -> float:
        degree = normalize_longitude(calculate_lagna_degree(jd, latitude, longitude))
        if degree < base_degree - 180.0:
            degree += 360.0
        return degree

    target_continuous = target_degree if target_degree > base_degree else target_degree + 360.0

    lo = start_jd
    hi = start_jd + 1 / 24
    while hi - lo <= 1.0:
        if _continuous_degree(hi) >= target_continuous:
            break
        hi += 1 / 24
    else:
        return hi

    for _ in range(48):
        mid = (lo + hi) / 2
        if _continuous_degree(mid) >= target_continuous:
            hi = mid
        else:
            lo = mid
    return hi


def build_daylight_lagna_schedule(snapshot: PanchangamSnapshot) -> tuple[PanchangamLagnaWindow, ...]:
    """Calculate the sidereal lagna intervals between this snapshot's sunrise/sunset.

    This intentionally does no cache lookup.  Callers use it only after the
    inexpensive almanac ranking has shortlisted a maximum of five dates.
    """
    if snapshot.lagna_schedule:
        return snapshot.lagna_schedule

    cursor = utc_datetime_to_julian_day(snapshot.sunrise.astimezone(UTC))
    end_jd = utc_datetime_to_julian_day(snapshot.sunset.astimezone(UTC))
    windows: list[PanchangamLagnaWindow] = []
    while cursor < end_jd - 1e-9:
        rasi_number = rasi_from_degree(normalize_longitude(calculate_lagna_degree(cursor, snapshot.latitude, snapshot.longitude)))
        boundary = _find_lagna_rasi_boundary_jd(cursor, snapshot.latitude, snapshot.longitude)
        interval_end = min(boundary, end_jd)
        start = utc_datetime_to_local_datetime(julian_day_to_utc_datetime(cursor), snapshot.timezone_name)
        end = utc_datetime_to_local_datetime(julian_day_to_utc_datetime(interval_end), snapshot.timezone_name)
        windows.append(PanchangamLagnaWindow(rasi_number, RASI_NAMES[rasi_number], start, end))
        if interval_end >= end_jd - 1e-9:
            break
        cursor = min(interval_end + 1e-8, end_jd)
    return tuple(windows)


def with_daylight_lagna_schedule(
    snapshot: PanchangamSnapshot,
    *,
    session: Session | None = None,
) -> PanchangamSnapshot:
    """Attach and persist the lazily calculated daylight lagna schedule."""
    if snapshot.lagna_schedule:
        return snapshot
    enriched = replace(snapshot, lagna_schedule=build_daylight_lagna_schedule(snapshot))
    if session is not None:
        try:
            _store_cached_snapshot(session, enriched, DEFAULT_AYANAMSA_TYPE)
        except Exception as exc:
            logger.warning("Failed to cache lagna schedule for %s: %s", snapshot.date_local, exc)
    return enriched


def _calculate_positions_at_sunrise(jd_ut: float) -> tuple[float, float, tuple[str, ...]]:
    """Sun/Moon plus the snapshot's warnings.

    Kept on the full snapshot deliberately: this is the form whose
    ``source_warnings`` reach the response, and narrowing it would silently drop
    warnings raised by the six bodies the panchangam does not read. Callers that
    discard the warnings — every boundary search — should use `_sun_moon_at_jd`
    instead, which is the same numbers for a quarter of the ephemeris work.
    """
    snapshot = calculate_sidereal_planets(jd_ut)
    return (
        snapshot.bodies["SUN"].absolute_longitude,
        snapshot.bodies["MOON"].absolute_longitude,
        snapshot.source_warnings,
    )


def _serialize_slot(slot: PanchangamSlot) -> dict:
    return {
        "start": slot.start.isoformat(),
        "end": slot.end.isoformat(),
        "slot": slot.slot,
        "name": slot.name,
        "period": slot.period,
        "is_good": slot.is_good,
    }


def _deserialize_slot(data: dict) -> PanchangamSlot:
    return PanchangamSlot(
        start=datetime.fromisoformat(data["start"]),
        end=datetime.fromisoformat(data["end"]),
        slot=int(data["slot"]),
        name=data.get("name"),
        period=data.get("period"),
        is_good=data.get("is_good"),
    )


def _serialize_limb_spans(spans: Sequence[PanchangamLimbSpan]) -> list[dict]:
    return [
        {
            "number": span.number,
            "name": span.name,
            "start": span.start.isoformat(),
            "end": span.end.isoformat(),
            "fraction": span.fraction,
        }
        for span in spans
    ]


def _deserialize_limb_spans(raw: object) -> tuple[PanchangamLimbSpan, ...]:
    """Rebuild a span list from a cache record.

    Returns `()` for a record written before spans existed. That empty tuple is
    load-bearing: `limb_weighted` on no spans returns 0.0, which would silently
    score every pre-upgrade cached day as a flat zero. Every caller must treat
    empty as "fall back to the sunrise scalar", which is why the scoring helpers
    take the scalar as an explicit fallback argument rather than defaulting.
    """
    if not isinstance(raw, list):
        return ()
    return tuple(
        PanchangamLimbSpan(
            number=int(span["number"]),
            name=str(span.get("name", "")),
            start=datetime.fromisoformat(span["start"]),
            end=datetime.fromisoformat(span["end"]),
            fraction=float(span.get("fraction", 0.0)),
        )
        for span in raw
    )


def _serialize_snapshot(snapshot: PanchangamSnapshot) -> dict:
    return {
        "schema_version": PANCHANGAM_CACHE_DATA_VERSION,
        "date_local": snapshot.date_local.isoformat(),
        "timezone_name": snapshot.timezone_name,
        "latitude": snapshot.latitude,
        "longitude": snapshot.longitude,
        "sunrise": snapshot.sunrise.isoformat(),
        "sunset": snapshot.sunset.isoformat(),
        "solar_noon": snapshot.solar_noon.isoformat(),
        "weekday": snapshot.weekday,
        "weekday_lord": snapshot.weekday_lord,
        "tithi_number": snapshot.tithi_number,
        "tithi_name": snapshot.tithi_name,
        "tithi_paksha": snapshot.tithi_paksha,
        "tithi_ends_at": snapshot.tithi_ends_at.isoformat(),
        "nakshatra_number": snapshot.nakshatra_number,
        "nakshatra_name": snapshot.nakshatra_name,
        "nakshatra_pada": snapshot.nakshatra_pada,
        "nakshatra_ends_at": snapshot.nakshatra_ends_at.isoformat(),
        "yoga_number": snapshot.yoga_number,
        "yoga_name": snapshot.yoga_name,
        "yoga_ends_at": snapshot.yoga_ends_at.isoformat(),
        "yoga_next_name": snapshot.yoga_next_name,
        "karana_name": snapshot.karana_name,
        "karana_ends_at": snapshot.karana_ends_at.isoformat(),
        "karana_next_name": snapshot.karana_next_name,
        "rahu_kalam": {
            "start": snapshot.rahu_kalam.start.isoformat(),
            "end": snapshot.rahu_kalam.end.isoformat(),
            "slot": snapshot.rahu_kalam.slot,
        },
        "yamagandam": {
            "start": snapshot.yamagandam.start.isoformat(),
            "end": snapshot.yamagandam.end.isoformat(),
            "slot": snapshot.yamagandam.slot,
        },
        "kuligai": {
            "start": snapshot.kuligai.start.isoformat(),
            "end": snapshot.kuligai.end.isoformat(),
            "slot": snapshot.kuligai.slot,
        },
        "gowri_panchangam": [_serialize_slot(w) for w in snapshot.gowri_panchangam],
        "nalla_neram": [_serialize_slot(w) for w in snapshot.nalla_neram],
        "gowri_nalla_neram": [_serialize_slot(w) for w in snapshot.gowri_nalla_neram],
        "durmuhurtham": [_serialize_slot(w) for w in snapshot.durmuhurtham],
        "is_subha_muhurtham": snapshot.is_subha_muhurtham,
        "subha_muhurtham_reason": snapshot.subha_muhurtham_reason,
        "is_subha_muhurtham_strict": snapshot.is_subha_muhurtham_strict,
        "subha_muhurtham_strict_reason": snapshot.subha_muhurtham_strict_reason,
        "abhijit_start": snapshot.abhijit_start.isoformat(),
        "abhijit_end": snapshot.abhijit_end.isoformat(),
        "abhijit_restricted": snapshot.abhijit_restricted,
        "hora": [
            {
                "index": entry.index,
                "lord": entry.lord,
                "start": entry.start.isoformat(),
                "end": entry.end.isoformat(),
            }
            for entry in snapshot.hora
        ],
        "moon_phase_label": snapshot.moon_phase_label,
        "tithi_next_number": snapshot.tithi_next_number,
        "tithi_next_name": snapshot.tithi_next_name,
        "tithi_next_paksha": snapshot.tithi_next_paksha,
        "special_tithi_day_number": snapshot.special_tithi_day_number,
        "nakshatra_next_name": snapshot.nakshatra_next_name,
        "soolam_direction": snapshot.soolam_direction,
        "soolam_parigaram": snapshot.soolam_parigaram,
        "nethiram": snapshot.nethiram,
        "nethiram_next": snapshot.nethiram_next,
        "jeevan_next": snapshot.jeevan_next,
        "jeevan": snapshot.jeevan,
        "lagna_rasi_number": snapshot.lagna_rasi_number,
        "lagna_rasi_name": snapshot.lagna_rasi_name,
        "lagna_ends_at": snapshot.lagna_ends_at.isoformat(),
        "lagna_nazhigai": snapshot.lagna_nazhigai,
        "lagna_vinadi": snapshot.lagna_vinadi,
        "amirdhadhi_yogam_name": snapshot.amirdhadhi_yogam_name,
        "amirdhadhi_yogam_ends_at": snapshot.amirdhadhi_yogam_ends_at.isoformat(),
        "amirdhadhi_yogam_next_name": snapshot.amirdhadhi_yogam_next_name,
        "chandrashtamam_moon_rasi_number": snapshot.chandrashtamam_moon_rasi_number,
        "chandrashtamam_moon_rasi_name": snapshot.chandrashtamam_moon_rasi_name,
        "chandrashtamam_affected_janma_rasi_number": snapshot.chandrashtamam_affected_janma_rasi_number,
        "chandrashtamam_affected_janma_rasi_name": snapshot.chandrashtamam_affected_janma_rasi_name,
        "chandrashtamam_today_nakshatras": list(snapshot.chandrashtamam_today_nakshatras),
        "chandrashtamam_janma_nakshatra_windows": [
            {
                "name": window.name,
                "start": window.start.isoformat(),
                "end": window.end.isoformat(),
            }
            for window in snapshot.chandrashtamam_janma_nakshatra_windows
        ],
        "warnings": list(snapshot.warnings),
        "tithi_spans": _serialize_limb_spans(snapshot.tithi_spans),
        "nakshatra_spans": _serialize_limb_spans(snapshot.nakshatra_spans),
        "yoga_spans": _serialize_limb_spans(snapshot.yoga_spans),
        "karana_spans": _serialize_limb_spans(snapshot.karana_spans),
        "moon_rasi_spans": _serialize_limb_spans(snapshot.moon_rasi_spans),
        "dominant_tithi_number": snapshot.dominant_tithi_number,
        "dominant_nakshatra_number": snapshot.dominant_nakshatra_number,
        "dominant_yoga_number": snapshot.dominant_yoga_number,
        "pradhosham_tithi_number": snapshot.pradhosham_tithi_number,
        "nishita_tithi_number": snapshot.nishita_tithi_number,
        "lagna_schedule": [
            {
                "rasi_number": window.rasi_number,
                "rasi_name": window.rasi_name,
                "start": window.start.isoformat(),
                "end": window.end.isoformat(),
            }
            for window in snapshot.lagna_schedule
        ],
    }


def _deserialize_snapshot(data: dict) -> PanchangamSnapshot:
    return PanchangamSnapshot(
        date_local=date.fromisoformat(data["date_local"]),
        timezone_name=str(data["timezone_name"]),
        latitude=float(data["latitude"]),
        longitude=float(data["longitude"]),
        sunrise=datetime.fromisoformat(data["sunrise"]),
        sunset=datetime.fromisoformat(data["sunset"]),
        solar_noon=datetime.fromisoformat(data["solar_noon"]),
        weekday=str(data["weekday"]),
        weekday_lord=str(data["weekday_lord"]),
        tithi_number=int(data["tithi_number"]),
        tithi_name=str(data["tithi_name"]),
        tithi_paksha=str(data["tithi_paksha"]),
        tithi_ends_at=datetime.fromisoformat(data["tithi_ends_at"]),
        nakshatra_number=int(data["nakshatra_number"]),
        nakshatra_name=str(data["nakshatra_name"]),
        nakshatra_pada=int(data["nakshatra_pada"]),
        nakshatra_ends_at=datetime.fromisoformat(data["nakshatra_ends_at"]),
        yoga_number=int(data["yoga_number"]),
        yoga_name=str(data["yoga_name"]),
        yoga_ends_at=datetime.fromisoformat(data["yoga_ends_at"]) if data.get("yoga_ends_at") else datetime.fromisoformat(data["nakshatra_ends_at"]),
        yoga_next_name=str(data.get("yoga_next_name", "")),
        karana_name=str(data["karana_name"]),
        karana_ends_at=datetime.fromisoformat(data["karana_ends_at"]) if data.get("karana_ends_at") else datetime.fromisoformat(data["tithi_ends_at"]),
        karana_next_name=str(data.get("karana_next_name", "")),
        rahu_kalam=PanchangamSlot(
            start=datetime.fromisoformat(data["rahu_kalam"]["start"]),
            end=datetime.fromisoformat(data["rahu_kalam"]["end"]),
            slot=int(data["rahu_kalam"]["slot"]),
        ),
        yamagandam=PanchangamSlot(
            start=datetime.fromisoformat(data["yamagandam"]["start"]),
            end=datetime.fromisoformat(data["yamagandam"]["end"]),
            slot=int(data["yamagandam"]["slot"]),
        ),
        kuligai=PanchangamSlot(
            start=datetime.fromisoformat(data["kuligai"]["start"]),
            end=datetime.fromisoformat(data["kuligai"]["end"]),
            slot=int(data["kuligai"]["slot"]),
        ),
        gowri_panchangam=[
            _deserialize_slot(w)
            for w in (data["gowri_panchangam"] if isinstance(data.get("gowri_panchangam"), list) else [])
        ],
        nalla_neram=[
            _deserialize_slot(w)
            for w in (data["nalla_neram"] if isinstance(data.get("nalla_neram"), list) else [])
        ],
        gowri_nalla_neram=[
            _deserialize_slot(w)
            for w in (data["gowri_nalla_neram"] if isinstance(data.get("gowri_nalla_neram"), list) else [])
        ],
        durmuhurtham=[
            _deserialize_slot(w)
            for w in (data["durmuhurtham"] if isinstance(data.get("durmuhurtham"), list) else [])
        ],
        is_subha_muhurtham=bool(data.get("is_subha_muhurtham", False)),
        subha_muhurtham_reason=str(data.get("subha_muhurtham_reason", "")),
        is_subha_muhurtham_strict=bool(data.get("is_subha_muhurtham_strict", False)),
        subha_muhurtham_strict_reason=str(data.get("subha_muhurtham_strict_reason", "")),
        abhijit_start=datetime.fromisoformat(data["abhijit_start"]),
        abhijit_end=datetime.fromisoformat(data["abhijit_end"]),
        abhijit_restricted=bool(data["abhijit_restricted"]),
        hora=[
            PanchangamHoraEntry(
                index=int(entry["index"]),
                lord=str(entry["lord"]),
                start=datetime.fromisoformat(entry["start"]),
                end=datetime.fromisoformat(entry["end"]),
            )
            for entry in data["hora"]
        ],
        moon_phase_label=str(data.get("moon_phase_label", "")),
        tithi_next_number=int(data.get("tithi_next_number", 0)),
        tithi_next_name=str(data.get("tithi_next_name", "")),
        tithi_next_paksha=str(data.get("tithi_next_paksha", "")),
        special_tithi_day_number=(
            int(data["special_tithi_day_number"])
            if data.get("special_tithi_day_number") is not None
            else None
        ),
        nakshatra_next_name=str(data.get("nakshatra_next_name", "")),
        soolam_direction=str(data.get("soolam_direction", "")),
        soolam_parigaram=str(data.get("soolam_parigaram", "")),
        nethiram=str(data.get("nethiram", "")),
        jeevan=str(data.get("jeevan", "")),
        nethiram_next=str(data.get("nethiram_next", "")),
        jeevan_next=str(data.get("jeevan_next", "")),
        lagna_rasi_number=int(data.get("lagna_rasi_number", 0)),
        lagna_rasi_name=str(data.get("lagna_rasi_name", "")),
        lagna_ends_at=datetime.fromisoformat(data["lagna_ends_at"]) if data.get("lagna_ends_at") else datetime.fromisoformat(data["sunrise"]),
        lagna_nazhigai=int(data.get("lagna_nazhigai", 0)),
        lagna_vinadi=int(data.get("lagna_vinadi", 0)),
        amirdhadhi_yogam_name=str(data.get("amirdhadhi_yogam_name", "")),
        amirdhadhi_yogam_ends_at=datetime.fromisoformat(data["amirdhadhi_yogam_ends_at"]) if data.get("amirdhadhi_yogam_ends_at") else datetime.fromisoformat(data["nakshatra_ends_at"]),
        amirdhadhi_yogam_next_name=str(data.get("amirdhadhi_yogam_next_name", "")),
        chandrashtamam_moon_rasi_number=int(data.get("chandrashtamam_moon_rasi_number", 0)),
        chandrashtamam_moon_rasi_name=str(data.get("chandrashtamam_moon_rasi_name", "")),
        chandrashtamam_affected_janma_rasi_number=int(data.get("chandrashtamam_affected_janma_rasi_number", 0)),
        chandrashtamam_affected_janma_rasi_name=str(data.get("chandrashtamam_affected_janma_rasi_name", "")),
        chandrashtamam_today_nakshatras=tuple(data.get("chandrashtamam_today_nakshatras", [])),
        chandrashtamam_janma_nakshatra_windows=tuple(
            PanchangamChandrashtamamNakshatraWindow(
                name=str(window.get("name", "")),
                start=datetime.fromisoformat(window["start"]),
                end=datetime.fromisoformat(window["end"]),
            )
            for window in (data.get("chandrashtamam_janma_nakshatra_windows") or [])
        ),
        warnings=tuple(data.get("warnings", [])),
        tithi_spans=_deserialize_limb_spans(data.get("tithi_spans")),
        nakshatra_spans=_deserialize_limb_spans(data.get("nakshatra_spans")),
        yoga_spans=_deserialize_limb_spans(data.get("yoga_spans")),
        karana_spans=_deserialize_limb_spans(data.get("karana_spans")),
        moon_rasi_spans=_deserialize_limb_spans(data.get("moon_rasi_spans")),
        dominant_tithi_number=int(data.get("dominant_tithi_number", 0)),
        pradhosham_tithi_number=int(data.get("pradhosham_tithi_number", 0)),
        nishita_tithi_number=int(data.get("nishita_tithi_number", 0)),
        lagna_schedule=tuple(
            PanchangamLagnaWindow(
                rasi_number=int(window["rasi_number"]),
                rasi_name=str(window["rasi_name"]),
                start=datetime.fromisoformat(window["start"]),
                end=datetime.fromisoformat(window["end"]),
            )
            for window in (data.get("lagna_schedule") or [])
        ),
        dominant_nakshatra_number=int(data.get("dominant_nakshatra_number", 0)),
        dominant_yoga_number=int(data.get("dominant_yoga_number", 0)),
    )


def _load_cached_snapshot(
    session: Session,
    date_local: date,
    latitude: float,
    longitude: float,
    ayanamsa_type: str,
) -> PanchangamSnapshot | None:
    row = session.execute(
        select(PanchangamCache).where(
            PanchangamCache.cache_date == date_local,
            PanchangamCache.latitude == round(latitude, 6),
            PanchangamCache.longitude == round(longitude, 6),
            PanchangamCache.ayanamsa_type == ayanamsa_type,
        )
    ).scalar_one_or_none()
    if row is None:
        return None
    if row.created_at < datetime.now(tz=UTC) - timedelta(hours=PANCHANGAM_CACHE_TTL_HOURS):
        return None
    if int(row.data.get("schema_version", 1)) != PANCHANGAM_CACHE_DATA_VERSION:
        return None
    return _deserialize_snapshot(row.data)


def _load_cached_snapshots_in_range(
    session: Session,
    start_date: date,
    end_date: date,
    latitude: float,
    longitude: float,
    ayanamsa_type: str,
) -> dict[date, PanchangamSnapshot]:
    rows = session.execute(
        select(PanchangamCache).where(
            PanchangamCache.cache_date >= start_date,
            PanchangamCache.cache_date <= end_date,
            PanchangamCache.latitude == round(latitude, 6),
            PanchangamCache.longitude == round(longitude, 6),
            PanchangamCache.ayanamsa_type == ayanamsa_type,
        )
    ).scalars()

    snapshots: dict[date, PanchangamSnapshot] = {}
    cutoff = datetime.now(tz=UTC) - timedelta(hours=PANCHANGAM_CACHE_TTL_HOURS)
    for row in rows:
        if row.created_at < cutoff:
            continue
        if int(row.data.get("schema_version", 1)) != PANCHANGAM_CACHE_DATA_VERSION:
            continue
        snapshots[row.cache_date] = _deserialize_snapshot(row.data)
    return snapshots


def purge_expired_panchangam_cache(session: Session) -> int:
    result = session.execute(
        delete(PanchangamCache).where(PanchangamCache.expires_at < datetime.now(tz=UTC))
    )
    # Avoid committing here: this helper is called from read paths and should not
    # flush or commit unrelated pending ORM changes in the caller's session.
    return int(result.rowcount or 0)


def _store_cached_snapshot(
    session: Session,
    snapshot: PanchangamSnapshot,
    ayanamsa_type: str,
) -> None:
    latitude = round(snapshot.latitude, 6)
    longitude = round(snapshot.longitude, 6)
    payload = _serialize_snapshot(snapshot)
    session.execute(
        pg_insert(PanchangamCache)
        .values(
            cache_date=snapshot.date_local,
            latitude=latitude,
            longitude=longitude,
            ayanamsa_type=ayanamsa_type,
            data=payload,
        )
        .on_conflict_do_update(
            constraint="uq_panchangam_cache_key",
            set_={
                "data": payload,
                "created_at": datetime.now(tz=UTC),
                "expires_at": datetime.now(tz=UTC) + timedelta(days=90),
            },
        )
    )


def calculate_daily_panchangam(
    date_local: date,
    latitude: float,
    longitude: float,
    timezone_name: str,
    *,
    session: Session | None = None,
    use_cache: bool = True,
) -> PanchangamSnapshot:
    if use_cache and session is not None:
        try:
            purge_expired_panchangam_cache(session)
            cached = _load_cached_snapshot(session, date_local, latitude, longitude, DEFAULT_AYANAMSA_TYPE)
            if cached is not None:
                return cached
        except Exception as exc:
            logger.warning(f"Panchangam cache read/purge failed; falling back to computation: {exc}")
            use_cache = False

    timezone_obj = resolve_timezone(timezone_name)
    local_midnight = datetime.combine(date_local, datetime.min.time(), tzinfo=timezone_obj)
    jd_start = utc_datetime_to_julian_day(local_midnight.astimezone(UTC))

    sunrise_jd = calculate_rise_transit_jd(jd_start, latitude, longitude, rise=True)
    sunset_jd = calculate_rise_transit_jd(jd_start, latitude, longitude, rise=False)
    next_sunrise_jd = calculate_rise_transit_jd(
        utc_datetime_to_julian_day((local_midnight + timedelta(days=1)).astimezone(UTC)),
        latitude,
        longitude,
        rise=True,
    )

    sunrise = utc_datetime_to_local_datetime(julian_day_to_utc_datetime(sunrise_jd), timezone_name)
    sunset = utc_datetime_to_local_datetime(julian_day_to_utc_datetime(sunset_jd), timezone_name)
    next_sunrise = utc_datetime_to_local_datetime(julian_day_to_utc_datetime(next_sunrise_jd), timezone_name)
    solar_noon = sunrise + (sunset - sunrise) / 2

    sun_longitude, moon_longitude, warnings = _calculate_positions_at_sunrise(sunrise_jd)
    diff = normalize_longitude(moon_longitude - sun_longitude)

    def _tithi_angle(jd: float) -> float:
        sun, moon = _sun_moon_at_jd(jd)
        return normalize_longitude(moon - sun)

    def _nakshatra_angle(jd: float) -> float:
        _, moon = _sun_moon_at_jd(jd)
        return moon

    def _yoga_angle(jd: float) -> float:
        sun, moon = _sun_moon_at_jd(jd)
        return normalize_longitude(sun + moon)

    tithi_number = int((diff + 1e-9) // 12) + 1
    tithi_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, _tithi_angle, 12.0)),
        timezone_name,
    )

    nakshatra_number = int((moon_longitude + 1e-9) // (40 / 3)) + 1
    nakshatra_pada = int(((moon_longitude % (40 / 3)) + 1e-9) // (10 / 3)) + 1
    nakshatra_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, _nakshatra_angle, 40 / 3)),
        timezone_name,
    )

    yoga_number = int((normalize_longitude(sun_longitude + moon_longitude) + 1e-9) // (40 / 3)) + 1
    yoga_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, _yoga_angle, 40 / 3)),
        timezone_name,
    )

    karana_index = int((diff + 1e-9) // 6)
    karana_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(_find_next_boundary_jd(sunrise_jd, _tithi_angle, 6.0)),
        timezone_name,
    )

    weekday_name, weekday_lord = _weekday_lord_and_name(date_local)
    rahu_slot = RAHU_SLOT[date_local.weekday()]
    yama_slot = YAMA_SLOT[date_local.weekday()]
    kuligai_slot = KULIGAI_SLOT[date_local.weekday()]

    kalam_anchor = sunrise
    kalam_slot_duration = (sunset - sunrise) / 8
    rahu = _slot_datetime(kalam_anchor, kalam_slot_duration, rahu_slot)
    yama = _slot_datetime(kalam_anchor, kalam_slot_duration, yama_slot)
    kuligai = _slot_datetime(kalam_anchor, kalam_slot_duration, kuligai_slot)

    # Abhijit is the 8th of the 15 equal muhurtas that divide the daylight span
    # (doctrine A-9, ruled 2026-08-19). It therefore breathes with the season and
    # the latitude: wider in summer, narrower in winter, and materially different
    # from the Chennai case for a user in London. This replaces a fixed
    # ±24-minute window around solar noon, which was the clock-table
    # simplification and only ever coincided with the real width near the
    # equinox at low latitude.
    #
    # Being the 8th of 15 equal parts, the window is centred on the midpoint of
    # daylight by construction — no separate solar-noon anchor is needed.
    daylight = sunset - sunrise
    abhijit_start = sunrise + daylight * 7 / 15
    abhijit_end = sunrise + daylight * 8 / 15
    # Wednesday carries no Abhijit. This is the only weekday exclusion.
    abhijit_restricted = date_local.weekday() == 2

    tithi_paksha: str = "SHUKLA" if tithi_number <= 15 else "KRISHNA"
    yoga_name_str = _yoga_name(yoga_number)

    hora_entries = _make_hora_entries(sunrise, sunset, next_sunrise, weekday_lord)
    weekday_index = date_local.weekday()
    gowri_panchangam = _compute_gowri_panchangam(sunrise, sunset, next_sunrise, weekday_index)
    durmuhurtham = _durmuhurtham_windows(sunrise, sunset, weekday_name)
    # Rahu Kalam / Yamagandam / Kuligai are the inauspicious kalams the daily
    # nalla-neram windows must avoid; pass them so both summaries are computed
    # clear of them (they share the Gowri 8-part grid, so a good kala can land
    # on the exact same slot as a bad kalam).
    bad_kalam_slots = (rahu, yama, kuligai)
    # Nalla Neram first: the Gowri summary skips the windows it already prints.
    nalla_neram = _compute_nalla_neram(gowri_panchangam, bad_kalam_slots, solar_noon)
    gowri_nalla_neram = _compute_gowri_nalla_neram(gowri_panchangam, bad_kalam_slots, nalla_neram)

    is_subha, subha_reason = _compute_subha_muhurtham_broad(
        tithi_number, NAKSHATRA_NAMES[nakshatra_number - 1], weekday_index,
    )
    is_subha_strict, subha_strict_reason = _compute_subha_muhurtham_strict(
        tithi_number, tithi_paksha, NAKSHATRA_NAMES[nakshatra_number - 1],
        yoga_name_str, weekday_index,
    )

    moon_phase_label = _moon_phase_label(tithi_paksha)
    tithi_next_number, tithi_next_name, tithi_next_paksha = _next_tithi(tithi_number)
    nakshatra_next_name = _next_nakshatra_name(nakshatra_number)
    special_tithi_day_number = dominant_special_tithi_for_civil_day(date_local, timezone_name)

    soolam_direction = SOOLAM_DIRECTION[weekday_index]
    soolam_parigaram = SOOLAM_PARIGARAM_BY_DIRECTION[soolam_direction]
    sun_nakshatra_number = nakshatra_from_degree(sun_longitude)
    nethiram = NETHIRAM_LABELS[_nethiram_value(sun_nakshatra_number, nakshatra_number)]
    jeevan = JEEVAN_LABELS[_jeevan_value(sun_nakshatra_number, nakshatra_number)]
    # Both are a function of (Sun's star, Moon's star), and within one day only
    # the Moon's star moves — the Sun holds a star for ~13.6 days. So they flip
    # at exactly `nakshatra_ends_at`, and the next values are this same pair
    # read against the following star. Without these the two shipped as bare
    # strings with no boundary, which is how they came to sit on the calendar
    # card beside Nokku — derived from the same star, and rolling over live —
    # showing a stale value all day.
    _next_star = ((nakshatra_number - 1 + 1) % 27) + 1
    nethiram_next = NETHIRAM_LABELS[_nethiram_value(sun_nakshatra_number, _next_star)]
    jeevan_next = JEEVAN_LABELS[_jeevan_value(sun_nakshatra_number, _next_star)]

    lagna_degree = normalize_longitude(calculate_lagna_degree(sunrise_jd, latitude, longitude))
    lagna_rasi_number = rasi_from_degree(lagna_degree)
    lagna_boundary_jd = _find_lagna_rasi_boundary_jd(sunrise_jd, latitude, longitude)
    lagna_ends_at = utc_datetime_to_local_datetime(
        julian_day_to_utc_datetime(lagna_boundary_jd), timezone_name,
    )
    lagna_remaining_seconds = max(0.0, (lagna_boundary_jd - sunrise_jd) * 86400.0)
    lagna_nazhigai = int(lagna_remaining_seconds // 1440)
    lagna_vinadi = int((lagna_remaining_seconds % 1440) // 24)

    amirdhadhi_yogam_name = _amirdhadhi_yogam_name(weekday_index, nakshatra_number)
    # L-1: the next nakshatra's Amirdhadhi row is looked up by weekday, and
    # the current nakshatra can end after local midnight — the "next" preview
    # must then use the following day's vara row, not today's.
    next_weekday_index = (
        nakshatra_ends_at.weekday() if nakshatra_ends_at.date() != date_local else weekday_index
    )
    amirdhadhi_yogam_next_name = _amirdhadhi_yogam_name(next_weekday_index, nakshatra_number + 1)
    moon_rasi_number = rasi_from_degree(moon_longitude)
    affected_janma_rasi_number = _chandrashtamam_affected_janma_rasi(moon_rasi_number)
    chandrashtamam_janma_nakshatra_windows = _chandrashtamam_janma_nakshatra_windows(
        date_local,
        timezone_name,
        moon_rasi_number,
    )
    # Derived from the correctly-computed rasi-based windows above (dedup, order
    # preserved) so this list can never contradict janma_nakshatra_windows.
    chandrashtamam_today_nakshatras = tuple(dict.fromkeys(
        window.name for window in chandrashtamam_janma_nakshatra_windows
    ))

    # What each limb actually does across the solar day, sunrise to next sunrise.
    # Sunrise-to-sunrise rather than midnight-to-midnight because that is the day
    # every other anchor here already uses (rahu kalam, the gowri slots and the
    # hora chain are all measured from sunrise), so a score weighted over these
    # spans is weighted over the same day the windows beside it divide up.
    # Computed once and cached, so the callers that need the duration answer never
    # re-walk the ephemeris — and the dominant scalars fall out of the same walk
    # instead of costing three more.
    tithi_spans = limb_spans_between("tithi", sunrise_jd, next_sunrise_jd, timezone_name)
    nakshatra_spans = limb_spans_between("nakshatra", sunrise_jd, next_sunrise_jd, timezone_name)
    yoga_spans = limb_spans_between("yoga", sunrise_jd, next_sunrise_jd, timezone_name)
    karana_spans = limb_spans_between("karana", sunrise_jd, next_sunrise_jd, timezone_name)
    moon_rasi_spans = limb_spans_between("moon_rasi", sunrise_jd, next_sunrise_jd, timezone_name)

    dominant_tithi_number = dominant_from_spans(tithi_spans) or tithi_number
    dominant_nakshatra_number = dominant_from_spans(nakshatra_spans) or nakshatra_number
    dominant_yoga_number = dominant_from_spans(yoga_spans) or yoga_number

    # Pradhosam is observed in the twilight around sunset, so its governing tithi is
    # read at pradhosha-kalam (sunset), not at sunrise (issue #10).
    pradhosham_tithi_number = _tithi_number_at_jd(sunset_jd)

    # Nishita-anchored observances (e.g. Sivarathiri, M-2) are governed by the tithi
    # prevailing at nishita-kalam (local midnight following this civil day's sunrise),
    # which is very commonly still one tithi behind the sunrise tithi — same error
    # class as pradhosham_tithi_number above, generalized to the midnight instant.
    next_midnight_jd = utc_datetime_to_julian_day((local_midnight + timedelta(days=1)).astimezone(UTC))
    nishita_tithi_number = _tithi_number_at_jd(next_midnight_jd)

    snapshot = PanchangamSnapshot(
        date_local=date_local,
        timezone_name=timezone_name,
        latitude=latitude,
        longitude=longitude,
        sunrise=sunrise,
        sunset=sunset,
        solar_noon=solar_noon,
        weekday=weekday_name,
        weekday_lord=weekday_lord,
        tithi_number=tithi_number,
        tithi_name=_tithi_name(tithi_number),
        tithi_paksha=tithi_paksha,
        tithi_ends_at=tithi_ends_at,
        nakshatra_number=nakshatra_number,
        nakshatra_name=NAKSHATRA_NAMES[nakshatra_number - 1],
        nakshatra_pada=nakshatra_pada,
        nakshatra_ends_at=nakshatra_ends_at,
        yoga_number=yoga_number,
        yoga_name=yoga_name_str,
        yoga_ends_at=yoga_ends_at,
        yoga_next_name=_next_yoga_name(yoga_number),
        karana_name=_karana_name(karana_index),
        karana_ends_at=karana_ends_at,
        karana_next_name=_next_karana_name(karana_index),
        rahu_kalam=rahu,
        yamagandam=yama,
        kuligai=kuligai,
        gowri_panchangam=gowri_panchangam,
        nalla_neram=nalla_neram,
        gowri_nalla_neram=gowri_nalla_neram,
        durmuhurtham=durmuhurtham,
        abhijit_start=abhijit_start,
        abhijit_end=abhijit_end,
        abhijit_restricted=abhijit_restricted,
        is_subha_muhurtham=is_subha,
        subha_muhurtham_reason=subha_reason,
        is_subha_muhurtham_strict=is_subha_strict,
        subha_muhurtham_strict_reason=subha_strict_reason,
        hora=hora_entries,
        moon_phase_label=moon_phase_label,
        tithi_next_number=tithi_next_number,
        tithi_next_name=tithi_next_name,
        tithi_next_paksha=tithi_next_paksha,
        special_tithi_day_number=special_tithi_day_number,
        nakshatra_next_name=nakshatra_next_name,
        soolam_direction=soolam_direction,
        soolam_parigaram=soolam_parigaram,
        nethiram=nethiram,
        jeevan=jeevan,
        nethiram_next=nethiram_next,
        jeevan_next=jeevan_next,
        lagna_rasi_number=lagna_rasi_number,
        lagna_rasi_name=RASI_NAMES[lagna_rasi_number],
        lagna_ends_at=lagna_ends_at,
        lagna_nazhigai=lagna_nazhigai,
        lagna_vinadi=lagna_vinadi,
        amirdhadhi_yogam_name=amirdhadhi_yogam_name,
        amirdhadhi_yogam_ends_at=nakshatra_ends_at,
        amirdhadhi_yogam_next_name=amirdhadhi_yogam_next_name,
        chandrashtamam_moon_rasi_number=moon_rasi_number,
        chandrashtamam_moon_rasi_name=RASI_NAMES[moon_rasi_number],
        chandrashtamam_affected_janma_rasi_number=affected_janma_rasi_number,
        chandrashtamam_affected_janma_rasi_name=RASI_NAMES[affected_janma_rasi_number],
        chandrashtamam_today_nakshatras=chandrashtamam_today_nakshatras,
        chandrashtamam_janma_nakshatra_windows=chandrashtamam_janma_nakshatra_windows,
        warnings=warnings,
        tithi_spans=tithi_spans,
        nakshatra_spans=nakshatra_spans,
        yoga_spans=yoga_spans,
        karana_spans=karana_spans,
        moon_rasi_spans=moon_rasi_spans,
        dominant_tithi_number=dominant_tithi_number,
        dominant_nakshatra_number=dominant_nakshatra_number,
        dominant_yoga_number=dominant_yoga_number,
        pradhosham_tithi_number=pradhosham_tithi_number,
        nishita_tithi_number=nishita_tithi_number,
    )

    if use_cache and session is not None:
        try:
            _store_cached_snapshot(session, snapshot, DEFAULT_AYANAMSA_TYPE)
        except Exception as exc:
            logger.warning(f"Failed to store panchangam cache for {date_local}: {exc}")
    return snapshot


def calculate_daily_panchangam_range(
    start_date: date,
    end_date: date,
    latitude: float,
    longitude: float,
    timezone_name: str,
    *,
    session: Session | None = None,
) -> dict[date, PanchangamSnapshot]:
    """Compute panchangam snapshots for a date range with batched cache I/O.

    Replaces the per-day SELECT + DELETE that ``calculate_daily_panchangam``
    performs when called in a loop (e.g. for a monthly calendar) with a single
    bulk SELECT covering the whole range and a single purge call. Cache misses
    fall back to the regular per-day computation, which also stores its result.
    """
    # A polar-latitude range can contain some days with no sunrise/sunset. Those
    # days are simply omitted from the result (the monthly grid skips them) rather
    # than failing the whole range — the caller iterates whatever days came back.
    if session is None:
        snapshots: dict[date, PanchangamSnapshot] = {}
        for current in _date_range(start_date, end_date):
            try:
                snapshots[current] = calculate_daily_panchangam(
                    current, latitude, longitude, timezone_name, session=None,
                )
            except RiseTransitUndefinedError:
                logger.info("Skipping %s: no sunrise/sunset at this location (polar day/night)", current)
        return snapshots

    try:
        purge_expired_panchangam_cache(session)
        cached = _load_cached_snapshots_in_range(
            session, start_date, end_date, latitude, longitude, DEFAULT_AYANAMSA_TYPE,
        )
    except Exception as exc:
        logger.warning(f"Panchangam cache read/purge failed for range; computing all: {exc}")
        cached = {}

    snapshots = {}
    for current in _date_range(start_date, end_date):
        existing = cached.get(current)
        if existing is not None:
            snapshots[current] = existing
            continue
        try:
            computed = calculate_daily_panchangam(
                current, latitude, longitude, timezone_name, session=session, use_cache=False,
            )
        except RiseTransitUndefinedError:
            logger.info("Skipping %s: no sunrise/sunset at this location (polar day/night)", current)
            continue
        try:
            _store_cached_snapshot(session, computed, DEFAULT_AYANAMSA_TYPE)
        except Exception as exc:
            logger.warning(f"Failed to store panchangam cache for {current}: {exc}")
        snapshots[current] = computed
    return snapshots


def _date_range(start_date: date, end_date: date) -> Iterator[date]:
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)
