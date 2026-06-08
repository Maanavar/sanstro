from __future__ import annotations

from datetime import date
from typing import Literal

FestivalCategory = Literal[
    "hindu",
    "muslim",
    "christian",
    "indian_govt",
    "tamilnadu_govt",
    "govt",
    "observance",
]
FestivalEntry = tuple[str, str, FestivalCategory]


# ---------------------------------------------------------------------------
# World / international observance days (MM-DD) — apply every year.
# Tamil names are draft translations pending review.
# ---------------------------------------------------------------------------
_WORLD_OBSERVANCES: list[tuple[str, str]] = [
    ("01-04", "உலக பிரெய்லி தினம்"),
    ("02-04", "உலக புற்றுநோய் தினம்"),
    ("03-08", "சர்வதேச மகளிர் தினம்"),
    ("03-20", "உலக மகிழ்ச்சி தினம்"),
    ("03-21", "உலக காடுகள் தினம்"),
    ("03-22", "உலக நீர் தினம்"),
    ("04-07", "உலக சுகாதார தினம்"),
    ("04-22", "உலக புவி தினம்"),
    ("05-01", "உலக தொழிலாளர் தினம்"),
    ("05-31", "உலக புகையிலை எதிர்ப்பு தினம்"),
    ("06-05", "உலக சுற்றுச்சூழல் தினம்"),
    ("06-08", "உலக பெருங்கடல் தினம்"),
    ("06-08", "உலக மூளைக்கட்டி தினம்"),
    ("06-21", "சர்வதேச யோகா தினம்"),
    ("07-11", "உலக மக்கள்தொகை தினம்"),
    ("08-12", "சர்வதேச இளைஞர் தினம்"),
    ("09-08", "சர்வதேச எழுத்தறிவு தினம்"),
    ("09-21", "சர்வதேச அமைதி தினம்"),
    ("10-01", "சர்வதேச முதியோர் தினம்"),
    ("10-16", "உலக உணவு தினம்"),
    ("11-14", "உலக நீரிழிவு தினம்"),
    ("11-20", "உலக குழந்தைகள் தினம்"),
    ("12-01", "உலக எய்ட்ஸ் தினம்"),
    ("12-10", "உலக மனித உரிமைகள் தினம்"),
]


# ---------------------------------------------------------------------------
# Fixed Gregorian festivals (MM-DD) — apply every year
# ---------------------------------------------------------------------------
_FIXED_FESTIVALS: list[FestivalEntry] = [
    # Indian / Tamil Nadu government holidays with fixed Gregorian dates.
    ("01-01", "New Year's Day", "tamilnadu_govt"),
    ("01-26", "Republic Day", "indian_govt"),
    ("01-26", "Republic Day", "tamilnadu_govt"),
    ("05-01", "May Day (Labour Day)", "tamilnadu_govt"),
    ("08-15", "Independence Day", "indian_govt"),
    ("08-15", "Independence Day", "tamilnadu_govt"),
    ("10-02", "Gandhi Jayanthi", "indian_govt"),
    ("10-02", "Gandhi Jayanthi", "tamilnadu_govt"),
    # Christian — fixed
    ("12-25", "Christmas", "christian"),
    ("12-25", "Christmas", "indian_govt"),
    ("12-25", "Christmas", "tamilnadu_govt"),
    ("12-24", "Christmas Eve", "christian"),
]


# ---------------------------------------------------------------------------
# Year-specific festival dates (exact Gregorian dates for each year)
# ---------------------------------------------------------------------------
_YEARLY_FESTIVALS: dict[int, list[FestivalEntry]] = {
    2026: [
        # Hindu — solar / fixed Tamil calendar
        ("01-14", "Bhogi", "hindu"),
        ("01-15", "Thai Pongal / Makar Sankranti", "hindu"),
        ("01-15", "Pongal", "tamilnadu_govt"),
        ("01-16", "Mattu Pongal", "hindu"),
        ("01-16", "Thiruvalluvar Day", "tamilnadu_govt"),
        ("01-17", "Kaanum Pongal / Uzhavar Thirunal", "hindu"),
        ("01-17", "Uzhavar Thirunal", "tamilnadu_govt"),
        ("02-01", "Thai Poosam", "hindu"),
        ("02-01", "Thai Poosam", "tamilnadu_govt"),
        ("04-14", "Tamil New Year (Puthandu) / Ambedkar Jayanti", "hindu"),
        ("04-14", "Tamil New Year (Puthandu) / Ambedkar Jayanti", "tamilnadu_govt"),
        ("08-03", "Aadi Perukku", "hindu"),
        ("09-04", "Krishna Jayanthi", "hindu"),
        ("09-04", "Krishna Jayanthi", "indian_govt"),
        ("09-04", "Krishna Jayanthi", "tamilnadu_govt"),
        ("09-14", "Vinayagar Chaturthi", "hindu"),
        ("09-14", "Vinayagar Chaturthi", "tamilnadu_govt"),
        ("10-19", "Ayudha Pooja", "hindu"),
        ("10-19", "Ayudha Pooja", "tamilnadu_govt"),
        ("10-20", "Vijayadasami", "hindu"),
        ("10-20", "Vijayadasami", "indian_govt"),
        ("10-20", "Vijayadasami", "tamilnadu_govt"),
        ("11-08", "Deepavali", "hindu"),
        ("11-08", "Deepavali", "indian_govt"),
        ("11-08", "Deepavali", "tamilnadu_govt"),
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
        # Other Hindu / Indian gazetted / Tamil Nadu public holidays
        ("03-04", "Holi", "hindu"),
        ("03-04", "Holi", "indian_govt"),
        ("03-19", "Ugadi (Telugu New Year)", "hindu"),
        ("03-19", "Ugadi (Telugu New Year)", "tamilnadu_govt"),
        ("03-26", "Ram Navami", "hindu"),
        ("03-26", "Ram Navami", "indian_govt"),
        ("03-31", "Mahavir Jayanti", "hindu"),
        ("03-31", "Mahavir Jayanti", "indian_govt"),
        ("03-31", "Mahavir Jayanti", "tamilnadu_govt"),
        ("04-01", "Annual Closing of Bank Accounts", "tamilnadu_govt"),
        ("05-01", "Buddha Purnima", "indian_govt"),
        ("11-24", "Guru Nanak's Birthday", "indian_govt"),
        # Muslim 2026
        ("02-18", "Ramzan begins", "muslim"),
        ("03-21", "Eid ul-Fitr (Ramazan)", "muslim"),
        ("03-21", "Eid ul-Fitr (Ramazan)", "indian_govt"),
        ("03-21", "Eid ul-Fitr (Ramazan)", "tamilnadu_govt"),
        ("05-27", "Bakrid (Eid al-Adha)", "indian_govt"),
        ("05-28", "Bakrid (Eid al-Adha)", "muslim"),
        ("05-28", "Bakrid (Eid al-Adha)", "tamilnadu_govt"),
        ("06-26", "Muharram", "muslim"),
        ("06-26", "Muharram", "indian_govt"),
        ("06-26", "Muharram", "tamilnadu_govt"),
        ("08-26", "Milad-un-Nabi", "muslim"),
        ("08-26", "Milad-un-Nabi", "indian_govt"),
        ("08-26", "Milad-un-Nabi", "tamilnadu_govt"),
        # Christian 2026
        ("04-03", "Good Friday", "christian"),
        ("04-03", "Good Friday", "indian_govt"),
        ("04-03", "Good Friday", "tamilnadu_govt"),
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
    "THIRUVONAM": "Thiruvonam Vratam",
    "ROHINI":     "Rohini Vratam",
    "KRITHIGAI":  "Krithigai Vratam",
}

# ---------------------------------------------------------------------------
# Tamil solar month indices (matching tamil_calendar.TAMIL_MONTHS ordering:
# 0=Chithirai .. 11=Panguni). Named here so the recurring-festival rules below
# read naturally without importing the full Tamil calendar module.
# ---------------------------------------------------------------------------
_MONTH_VAIKASI = 1
_MONTH_PURATTASI = 5
_MONTH_MAASI = 10
_MONTH_PANGUNI = 11

_WEEKDAY_TUESDAY = "TUESDAY"
_WEEKDAY_SATURDAY = "SATURDAY"


def _recurring_tithi_festivals(
    tithi_number: int,
    tithi_paksha: str,
    nakshatra_name: str,
    weekday: str | None,
    tamil_month_index: int | None,
    special_tithi_day_number: int | None,
) -> list[dict]:
    """Recurring festivals defined by tithi/paksha/weekday/Tamil-month/nakshatra
    combinations rather than fixed Gregorian dates — these recur every lunar
    month (or every year on the matching Tamil-month occurrence) and so must
    be derived from the day's panchangam state, not looked up by date.
    """
    results: list[dict] = []
    tithi_in_paksha = tithi_number if tithi_number <= 15 else tithi_number - 15
    nk_upper = nakshatra_name.upper()

    # Pradhosam — trayodashi (13th tithi) of either paksha. On Saturdays the
    # specific observance name replaces the generic one to avoid duplicate UI
    # rows for the same vrata.
    if tithi_in_paksha == 13:
        if weekday == _WEEKDAY_SATURDAY:
            results.append({"name": "Sani Pradhosam", "category": "hindu"})
        else:
            results.append({"name": "Pradhosam", "category": "hindu"})

    # Chathurthi (4th tithi) — Sangadahara Chathurthi when it falls on a
    # Tuesday in Krishna paksha, otherwise the generic Chathurthi observance.
    if tithi_in_paksha == 4:
        if tithi_paksha == "KRISHNA" and weekday == _WEEKDAY_TUESDAY:
            results.append({"name": "Sangadahara Chathurthi", "category": "hindu"})
        else:
            results.append({"name": "Chathurthi", "category": "hindu"})

    # Sashti — 6th tithi, Shukla paksha (Skanda Sashti tradition).
    if tithi_in_paksha == 6 and tithi_paksha == "SHUKLA":
        results.append({"name": "Sashti", "category": "hindu"})

    # Theipirai Ashtami — 8th tithi, Krishna paksha (waning-fortnight Ashtami).
    if tithi_in_paksha == 8 and tithi_paksha == "KRISHNA":
        results.append({"name": "Theipirai Ashtami", "category": "hindu"})

    # Sivarathiri — 14th tithi, Krishna paksha, in the Tamil month of Maasi.
    if (
        tithi_in_paksha == 14
        and tithi_paksha == "KRISHNA"
        and tamil_month_index == _MONTH_MAASI
    ):
        results.append({"name": "Sivarathiri", "category": "hindu"})

    # Festivals anchored to the dominant Pournami (15) / Amavasai (30) day —
    # gated on special_tithi_day_number so they fire only on the civil day
    # where that tithi actually dominates, not on adjacent spillover days.
    if special_tithi_day_number == 15:
        if nk_upper == "CHITHIRAI":
            results.append({"name": "Chitra Pournami", "category": "hindu"})
        if tamil_month_index == _MONTH_MAASI and nk_upper == "MAGAM":
            results.append({"name": "Maasi Magam", "category": "hindu"})
        if tamil_month_index == _MONTH_PANGUNI and nk_upper == "UTHIRAM":
            results.append({"name": "Panguni Uthiram", "category": "hindu"})

    if special_tithi_day_number == 30 and tamil_month_index == _MONTH_PURATTASI:
        results.append({"name": "Mahalaya Amavasai", "category": "hindu"})

    # Vaigasi Visakam — Moon in Visakam nakshatra during the Tamil month of Vaikasi.
    if tamil_month_index == _MONTH_VAIKASI and nk_upper == "VISAKAM":
        results.append({"name": "Vaigasi Visakam", "category": "hindu"})

    return results


def get_festivals_for_date(
    d: date,
    tithi_number: int,
    tithi_paksha: str,
    nakshatra_name: str,
    weekday: str | None = None,
    tamil_month_index: int | None = None,
    special_tithi_day_number: int | None = None,
) -> list[dict]:
    """Return list of {name, category} dicts for the given date + panchangam state."""
    results: list[dict] = []
    mmdd = d.strftime("%m-%d")
    weekday = weekday or d.strftime("%A").upper()

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

    # Recurring tithi/paksha/weekday/Tamil-month combinations
    results.extend(
        _recurring_tithi_festivals(
            tithi_number,
            tithi_paksha,
            nakshatra_name,
            weekday,
            tamil_month_index,
            special_tithi_day_number,
        )
    )

    # World / international observance days
    for obs_mmdd, name in _WORLD_OBSERVANCES:
        if obs_mmdd == mmdd:
            results.append({"name": name, "category": "observance"})

    # Deduplicate by name while preserving all category tags. A festival can
    # also be a government holiday, so callers need more than one label.
    deduped_by_name: dict[str, dict] = {}
    for item in results:
        name = item["name"]
        category = "indian_govt" if item["category"] == "govt" else item["category"]
        tags = [
            "indian_govt" if tag == "govt" else tag
            for tag in item.get("tags", [category])
        ]
        existing = deduped_by_name.get(name)
        if existing is None:
            existing = {"name": name, "category": category, "tags": []}
            deduped_by_name[name] = existing
        for tag in tags:
            if tag not in existing["tags"]:
                existing["tags"].append(tag)

    return list(deduped_by_name.values())
