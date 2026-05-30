from __future__ import annotations

from datetime import date
from typing import Literal

FestivalCategory = Literal["hindu", "muslim", "christian", "govt"]


# ---------------------------------------------------------------------------
# Fixed Gregorian festivals (MM-DD) — apply every year
# ---------------------------------------------------------------------------
_FIXED_FESTIVALS: list[tuple[str, str, FestivalCategory]] = [
    # Government / National holidays
    ("01-01", "New Year's Day", "govt"),
    ("01-26", "Republic Day", "govt"),
    ("05-01", "May Day (Labour Day)", "govt"),
    ("08-15", "Independence Day", "govt"),
    ("10-02", "Gandhi Jayanthi", "govt"),
    # Christian — fixed
    ("12-25", "Christmas", "christian"),
    ("12-24", "Christmas Eve", "christian"),
]


# ---------------------------------------------------------------------------
# Year-specific festival dates (exact Gregorian dates for each year)
# ---------------------------------------------------------------------------
_YEARLY_FESTIVALS: dict[int, list[tuple[str, str, FestivalCategory]]] = {
    2026: [
        # Hindu — solar / fixed Tamil calendar
        ("01-11", "Bhogi", "hindu"),
        ("01-14", "Thai Pongal / Makar Sankranti", "hindu"),
        ("01-15", "Mattu Pongal", "hindu"),
        ("01-16", "Kaanum Pongal / Thiruvalluvar Day", "hindu"),
        ("01-17", "Uzhavar Thirunal", "hindu"),
        ("02-01", "Thai Poosam", "hindu"),
        ("04-14", "Tamil New Year (Puthandu) / Ambedkar Jayanti", "hindu"),
        ("08-03", "Aadi Perukku", "hindu"),
        ("09-04", "Krishna Jayanthi", "hindu"),
        ("09-14", "Vinayagar Chaturthi", "hindu"),
        ("10-19", "Ayudha Pooja", "hindu"),
        ("10-20", "Vijayadasami", "hindu"),
        ("11-08", "Deepavali", "hindu"),
        ("11-25", "Karthigai Deepam", "hindu"),
        # Hindu — Ekadashis 2026 (exact dates)
        ("01-14", "Shattila Ekadashi", "hindu"),
        ("01-29", "Jaya Ekadashi", "hindu"),
        ("02-13", "Vijaya Ekadashi", "hindu"),
        ("02-27", "Amalaki Ekadashi", "hindu"),
        ("03-15", "Papmochani Ekadashi", "hindu"),
        ("03-29", "Kamada Ekadashi", "hindu"),
        ("04-13", "Varuthini Ekadashi", "hindu"),
        ("04-27", "Mohini Ekadashi", "hindu"),
        ("05-13", "Apara Ekadashi", "hindu"),
        ("05-27", "Padmini Ekadashi", "hindu"),
        ("06-11", "Parama Ekadashi", "hindu"),
        ("06-25", "Nirjala Ekadashi", "hindu"),
        ("07-10", "Yogini Ekadashi", "hindu"),
        ("07-25", "Devshayani Ekadashi", "hindu"),
        ("08-09", "Kamika Ekadashi", "hindu"),
        ("08-23", "Putrada Ekadashi", "hindu"),
        ("09-07", "Aja Ekadashi", "hindu"),
        ("09-22", "Parivartini Ekadashi", "hindu"),
        ("10-06", "Indira Ekadashi", "hindu"),
        ("10-22", "Papankusha Ekadashi", "hindu"),
        ("11-05", "Rama Ekadashi", "hindu"),
        ("11-20", "Devutthana Ekadashi", "hindu"),
        ("12-05", "Utpanna Ekadashi", "hindu"),
        ("12-20", "Vaikuntha Ekadashi / Mokshada", "hindu"),
        # Other Hindu
        ("03-19", "Ugadi (Telugu New Year)", "hindu"),
        ("03-31", "Mahavir Jayanti", "hindu"),
        # Muslim 2026
        ("02-18", "Ramzan begins", "muslim"),
        ("03-21", "Eid ul-Fitr (Ramazan)", "muslim"),
        ("05-28", "Bakrid (Eid al-Adha)", "muslim"),
        ("06-26", "Muharram", "muslim"),
        ("08-26", "Milad-un-Nabi", "muslim"),
        # Christian 2026
        ("04-03", "Good Friday", "christian"),
        ("04-05", "Easter Sunday", "christian"),
    ],
    2025: [
        # Hindu
        ("01-13", "Bhogi", "hindu"),
        ("01-14", "Thai Pongal / Makar Sankranti", "hindu"),
        ("01-15", "Mattu Pongal", "hindu"),
        ("01-16", "Kaanum Pongal", "hindu"),
        ("04-14", "Tamil New Year (Puthandu)", "hindu"),
        ("08-03", "Aadi Perukku", "hindu"),
        ("08-16", "Krishna Jayanthi", "hindu"),
        ("08-27", "Vinayagar Chaturthi", "hindu"),
        ("10-02", "Vijaya Dasami", "hindu"),
        ("10-20", "Deepavali", "hindu"),
        ("12-04", "Karthigai Deepam", "hindu"),
        # Muslim 2025
        ("03-01", "Ramzan begins", "muslim"),
        ("03-30", "Eid ul-Fitr (Ramazan)", "muslim"),
        ("06-06", "Eid ul-Adha (Bakrid)", "muslim"),
        ("06-27", "Muharram", "muslim"),
        ("09-04", "Milad-un-Nabi", "muslim"),
        # Christian 2025
        ("04-18", "Good Friday", "christian"),
        ("04-20", "Easter Sunday", "christian"),
        # Other
        ("03-19", "Ugadi (Telugu New Year)", "hindu"),
        ("03-14", "Mahavir Jayanti", "hindu"),
    ],
}

# ---------------------------------------------------------------------------
# Nakshatra-based festivals (nakshatra name → festival) — every year
# ---------------------------------------------------------------------------
_NAKSHATRA_FESTIVALS: dict[str, str] = {
    "THIRUVONAM": "Onam / Thiruvonam",
    "ROHINI":     "Rohini Vratam",
}


def get_festivals_for_date(
    d: date,
    tithi_number: int,
    tithi_paksha: str,
    nakshatra_name: str,
) -> list[dict]:
    """Return list of {name, category} dicts for the given date + panchangam state."""
    results: list[dict] = []
    mmdd = d.strftime("%m-%d")

    # Fixed every year
    for fixed_mmdd, name, cat in _FIXED_FESTIVALS:
        if fixed_mmdd == mmdd:
            results.append({"name": name, "category": cat})

    # Year-specific
    for md, name, cat in _YEARLY_FESTIVALS.get(d.year, []):
        if md == mmdd:
            results.append({"name": name, "category": cat})

    # Nakshatra-based
    nk_upper = nakshatra_name.upper()
    for nk_key, name in _NAKSHATRA_FESTIVALS.items():
        if nk_key == nk_upper:
            results.append({"name": name, "category": "hindu"})

    # Deduplicate by name
    seen: set[str] = set()
    deduped: list[dict] = []
    for item in results:
        if item["name"] not in seen:
            seen.add(item["name"])
            deduped.append(item)

    return deduped
