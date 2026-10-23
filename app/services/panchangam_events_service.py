"""Tamil-calendar special-event listings (Pournami, Amavasai, Pradosham, …).

Powers the public SEO pages under /tamil-calendar and the Karinaal flag on the
daily panchangam. This module adds bilingual names + SEO content and computes
the "next upcoming date" relative to a reference day.

**Every date is the engine's (FCA-06, owner decision 4E, 2026-10-22).** The
pages used to read a curated 2026 almanac table
(``app.data.panchangam_events_2026``), which disagreed with the daily
panchangam on ~18 observance dates and 71 Tamil dates, and served nothing for
2027. Each event is now read off the same per-day engine the signed-in
calendar uses (``_engine_rows``), so the two cannot disagree. Karinaal keeps
its own rule, ``app.calculations.karinaal`` (F-MUH-02). The curated table
stays only as the reference ``scripts/audit/seo_events_vs_engine.py`` scores
the engine against.
"""
from __future__ import annotations

import threading
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import date
from functools import lru_cache

from fastapi import HTTPException, status

from app.calculations.karinaal import (
    KARINAAL_REFERENCE_LAT,
    KARINAAL_REFERENCE_LON,
    KARINAAL_REFERENCE_TZ,
    karinaal_days_for_year,
    karinaal_rows_for_year,
)
from app.calculations.tamil_calendar import TAMIL_MONTHS, tamil_solar_date

#: The years served: the span the festival engine has been swept against
#: (2020-2045, FCA-01/FCA-07). A cold year is ~400 days of ephemeris, so a year
#: outside it is a 404 rather than open-ended work for a public endpoint.
PUBLISHED_YEARS = range(2020, 2046)
SOURCE = "Vinaadi panchangam (Chennai sunrise)"

WEEKDAY_TA = {
    "MONDAY": "திங்கள்", "TUESDAY": "செவ்வாய்", "WEDNESDAY": "புதன்",
    "THURSDAY": "வியாழன்", "FRIDAY": "வெள்ளி", "SATURDAY": "சனி", "SUNDAY": "ஞாயிறு",
}


@dataclass(frozen=True, slots=True)
class EventMeta:
    key: str
    name_en: str
    name_ta: str
    category: str           # TITHI | NAKSHATRA | INAUSPICIOUS
    tagline_en: str
    tagline_ta: str
    summary_en: str
    summary_ta: str
    significance_en: str
    significance_ta: str
    keywords: tuple[str, ...]


# Ordered most-searched first — drives the hub page order.
_EVENT_META: tuple[EventMeta, ...] = (
    EventMeta(
        "pournami", "Pournami", "பௌர்ணமி", "TITHI",
        "Full Moon day", "முழு நிலா நாள்",
        "Pournami is the full-moon day (Shukla Paksha 15th tithi), considered highly auspicious for prayer, fasting and charity — especially the Pournami vratham and Satyanarayana puja.",
        "பௌர்ணமி என்பது முழு நிலா நாள் (சுக்ல பட்ச 15-ஆம் திதி). வழிபாடு, விரதம், தானம் ஆகியவற்றுக்கு மிகவும் சிறந்த நாளாகக் கருதப்படுகிறது.",
        "Many observe a Pournami fast and visit temples; Karthigai Pournami and Thai Pournami are especially significant in Tamil Nadu.",
        "பலர் பௌர்ணமி விரதம் இருந்து கோயில் செல்கின்றனர்; கார்த்திகை பௌர்ணமி, தை பௌர்ணமி தமிழ்நாட்டில் சிறப்பு பெற்றவை.",
        ("pournami {year}", "full moon dates {year}", "pournami date", "பௌர்ணமி {year}", "pournami vratham {year}"),
    ),
    EventMeta(
        "amavasai", "Amavasai", "அமாவாசை", "TITHI",
        "New Moon day", "புதுப் பிறை / அமாவாசை நாள்",
        "Amavasai is the new-moon day (30th tithi), traditionally dedicated to remembering ancestors (tarpanam / pitru tarpanam) and offering prayers for departed elders.",
        "அமாவாசை என்பது புதுப் பிறை நாள் (30-ஆம் திதி). முன்னோர்களை நினைவுகூர்ந்து தர்ப்பணம் செய்வதற்கு உகந்த நாள்.",
        "Thai Amavasai (Thai Amavasya) and Aadi Amavasai are major days for ancestral rites in Tamil tradition.",
        "தை அமாவாசை, ஆடி அமாவாசை ஆகியவை முன்னோர் வழிபாட்டுக்கு முக்கியமான நாட்கள்.",
        ("amavasai {year}", "new moon dates {year}", "amavasya date", "அமாவாசை {year}", "thai amavasai {year}"),
    ),
    EventMeta(
        "pradosham", "Pradosham", "பிரதோஷம்", "TITHI",
        "Shiva twilight worship (Trayodasi)", "சிவ வழிபாட்டு அந்தி நேரம்",
        "Pradosham falls on the 13th tithi (Trayodasi) of both fortnights and is dedicated to Lord Shiva; worship is done in the pradosha kaalam, the twilight before sunset.",
        "பிரதோஷம் இரு பட்சங்களிலும் 13-ஆம் திதியில் (திரயோதசி) வரும். சிவ வழிபாட்டுக்கு உகந்தது; சூரிய அஸ்தமனத்துக்கு முந்திய பிரதோஷ காலத்தில் வழிபடுகிறார்கள்.",
        "Soma Pradosham (Monday) and Shani Pradosham (Saturday) are considered especially powerful.",
        "சோம பிரதோஷம் (திங்கள்), சனி பிரதோஷம் (சனி) ஆகியவை மிகவும் சக்தி வாய்ந்தவையாகக் கருதப்படுகின்றன.",
        ("pradosham {year}", "pradosham dates {year}", "soma pradosham", "sani pradosham", "பிரதோஷம் {year}"),
    ),
    EventMeta(
        "ekadhasi", "Ekadhasi", "ஏகாதசி", "TITHI",
        "11th tithi — Vishnu fasting day", "11-ஆம் திதி — விஷ்ணு விரத நாள்",
        "Ekadhasi is the 11th tithi of each fortnight, observed as a fasting day for Lord Vishnu. Vaikunta Ekadhasi is the most important of the year.",
        "ஏகாதசி ஒவ்வொரு பட்சத்திலும் 11-ஆம் திதியில் வரும். விஷ்ணு வழிபாட்டுக்கான விரத நாள். வைகுண்ட ஏகாதசி ஆண்டின் முக்கிய ஏகாதசி.",
        "Devotees fast from grains on Ekadhasi and break the fast (paranai) the next morning on Dwadasi.",
        "ஏகாதசியில் தானியம் தவிர்த்து விரதம் இருந்து, மறுநாள் துவாதசியில் பாரணை செய்கிறார்கள்.",
        ("ekadhasi {year}", "ekadasi dates {year}", "vaikunta ekadasi {year}", "ஏகாதசி {year}"),
    ),
    EventMeta(
        "sankatahara-chathurthi", "Sankatahara Chathurthi", "சங்கடஹர சதுர்த்தி", "TITHI",
        "Ganesha day (Krishna Chaturthi)", "விநாயகர் வழிபாட்டு நாள்",
        "Sankatahara Chathurthi is the Krishna-paksha 4th tithi, dedicated to Lord Ganesha to remove obstacles; worship is done after moonrise.",
        "சங்கடஹர சதுர்த்தி கிருஷ்ண பட்ச 4-ஆம் திதியில் வரும். தடைகளை நீக்கும் விநாயகர் வழிபாட்டுக்கு உகந்தது; சந்திரோதயத்துக்குப் பின் வழிபடுகிறார்கள்.",
        "Devotees fast and worship Ganesha, breaking the fast after sighting the moon.",
        "பக்தர்கள் விரதம் இருந்து விநாயகரை வழிபட்டு, சந்திரனைக் கண்ட பின் விரதம் முடிக்கிறார்கள்.",
        ("sankatahara chathurthi {year}", "sankashti chaturthi {year}", "சங்கடஹர சதுர்த்தி {year}"),
    ),
    EventMeta(
        "chathurthi", "Chathurthi", "சதுர்த்தி", "TITHI",
        "Vinayaka Chaturthi (Shukla 4th)", "விநாயகர் சதுர்த்தி",
        "Shukla-paksha Chaturthi (4th tithi) is a day for worshipping Lord Ganesha; the Bhadrapada one is celebrated as Vinayaka Chaturthi.",
        "சுக்ல பட்ச சதுர்த்தி (4-ஆம் திதி) விநாயகர் வழிபாட்டு நாள்; ஆவணி மாத சதுர்த்தி விநாயகர் சதுர்த்தியாகக் கொண்டாடப்படுகிறது.",
        "Ganesha is worshipped for wisdom and a smooth start to new ventures.",
        "புதிய முயற்சிகள் வெற்றிபெற விநாயகரை வழிபடுகிறார்கள்.",
        ("chathurthi {year}", "vinayaka chaturthi {year}", "சதுர்த்தி {year}"),
    ),
    EventMeta(
        "sashti", "Sashti", "சஷ்டி", "TITHI",
        "Murugan day (6th tithi)", "முருகன் வழிபாட்டு நாள்",
        "Sashti, the 6th tithi, is dedicated to Lord Murugan; the Aippasi Soorasamharam Sashti is the most celebrated.",
        "சஷ்டி (6-ஆம் திதி) முருகன் வழிபாட்டு நாள்; ஐப்பசி சூரசம்ஹார சஷ்டி மிகவும் சிறப்பு பெற்றது.",
        "Devotees observe the Sashti vratham for Murugan's blessings of courage and protection.",
        "தைரியமும் காப்பும் வேண்டி முருகனை நோக்கி சஷ்டி விரதம் இருக்கிறார்கள்.",
        ("sashti {year}", "sashti viratham {year}", "சஷ்டி {year}"),
    ),
    EventMeta(
        "ashtami", "Ashtami", "அஷ்டமி", "TITHI",
        "8th tithi", "8-ஆம் திதி",
        "Ashtami is the 8th tithi of each fortnight. Krishna Janmashtami and certain Devi ashtamis are observed with special worship.",
        "அஷ்டமி ஒவ்வொரு பட்சத்திலும் 8-ஆம் திதி. கிருஷ்ண ஜென்மாஷ்டமி, தேவி அஷ்டமிகள் சிறப்பு வழிபாட்டுடன் கடைப்பிடிக்கப்படுகின்றன.",
        "Ashtami is generally avoided for starting major auspicious events.",
        "பெரிய சுப காரியங்களைத் தொடங்க அஷ்டமி பொதுவாகத் தவிர்க்கப்படுகிறது.",
        ("ashtami {year}", "ashtami dates {year}", "அஷ்டமி {year}"),
    ),
    EventMeta(
        "navami", "Navami", "நவமி", "TITHI",
        "9th tithi", "9-ஆம் திதி",
        "Navami is the 9th tithi; Rama Navami (Panguni) and the Navami of Navaratri are the most significant.",
        "நவமி 9-ஆம் திதி; ராம நவமி (பங்குனி), நவராத்திரி நவமி ஆகியவை முக்கியமானவை.",
        "Like Ashtami, plain Navami is generally avoided for new auspicious starts.",
        "அஷ்டமியைப் போலவே நவமியும் புதிய சுப தொடக்கங்களுக்குப் பொதுவாகத் தவிர்க்கப்படுகிறது.",
        ("navami {year}", "rama navami {year}", "நவமி {year}"),
    ),
    EventMeta(
        "karthigai", "Karthigai", "கார்த்திகை", "NAKSHATRA",
        "Karthigai nakshatra — Murugan day", "கார்த்திகை நட்சத்திர நாள்",
        "The monthly Karthigai is the day the Moon transits the Karthigai (Krittika) nakshatra, dedicated to Lord Murugan; Karthigai Deepam (Karthigai month) is the great festival.",
        "மாதந்தோறும் சந்திரன் கார்த்திகை நட்சத்திரத்தில் சஞ்சரிக்கும் நாள் கார்த்திகை; முருகன் வழிபாட்டு நாள். கார்த்திகை தீபம் பெருவிழா.",
        "Lighting lamps on Karthigai is a cherished Tamil tradition for prosperity and dispelling darkness.",
        "கார்த்திகையில் விளக்கேற்றுவது வளமும் ஒளியும் வேண்டிய தமிழ் மரபு.",
        ("karthigai {year}", "karthigai dates {year}", "karthigai deepam {year}", "கார்த்திகை {year}"),
    ),
    EventMeta(
        "thiruvonam", "Thiruvonam", "திருவோணம்", "NAKSHATRA",
        "Thiruvonam (Shravana) nakshatra — Vishnu day", "திருவோண நட்சத்திர நாள்",
        "Thiruvonam is the day the Moon transits the Thiruvonam (Shravana) nakshatra, considered auspicious and dedicated to Lord Vishnu.",
        "சந்திரன் திருவோண (சிரவணம்) நட்சத்திரத்தில் சஞ்சரிக்கும் நாள் திருவோணம்; விஷ்ணு வழிபாட்டுக்கு உகந்த சுப நாள்.",
        "Monthly Thiruvonam is favoured for Vishnu worship and auspicious activities.",
        "மாதந்தோறும் வரும் திருவோணம் விஷ்ணு வழிபாட்டுக்கும் சுப காரியங்களுக்கும் ஏற்றது.",
        ("thiruvonam {year}", "thiruvonam dates {year}", "திருவோணம் {year}"),
    ),
    EventMeta(
        "maadha-sivarathiri", "Maadha Sivarathiri", "மாத சிவராத்திரி", "TITHI",
        "Monthly Shiva night (Krishna Chaturdashi)", "மாதந்தோறும் சிவராத்திரி",
        "Maadha Sivarathiri is the monthly Krishna-paksha Chaturdashi night dedicated to Lord Shiva; the Masi one is Maha Sivarathiri.",
        "மாத சிவராத்திரி ஒவ்வொரு மாதமும் கிருஷ்ண பட்ச சதுர்தசி இரவில் வரும் சிவ வழிபாட்டு நாள்; மாசி மாதத்தது மகா சிவராத்திரி.",
        "Devotees keep a night vigil (jagaran) and fast in devotion to Shiva.",
        "பக்தர்கள் இரவு முழுவதும் விழித்திருந்து (ஜாகரணம்) சிவனை வழிபட்டு விரதம் இருக்கிறார்கள்.",
        ("maadha sivarathiri {year}", "masa shivaratri {year}", "மாத சிவராத்திரி {year}"),
    ),
    EventMeta(
        "chandra-darisanam", "Chandra Darisanam", "சந்திர தரிசனம்", "TITHI",
        "First crescent moon sighting", "பிறை சந்திர தரிசனம்",
        "Chandra Darisanam is the sighting of the first crescent moon after Amavasai (early Shukla paksha), considered auspicious to view.",
        "அமாவாசைக்குப் பின் முதல் பிறை சந்திரனைக் காணும் நாள் சந்திர தரிசனம்; காண்பது சுபமாகக் கருதப்படுகிறது.",
        "Viewing the new crescent is traditionally regarded as bringing good fortune for the month.",
        "புதுப் பிறையைக் காண்பது அம்மாதத்துக்கு நற்பேறு தரும் என நம்பப்படுகிறது.",
        ("chandra darisanam {year}", "crescent moon {year}", "சந்திர தரிசனம் {year}"),
    ),
    EventMeta(
        "karinaal", "Karinaal", "கரிநாள்", "INAUSPICIOUS",
        "Inauspicious days to avoid", "தவிர்க்க வேண்டிய நாட்கள்",
        "Karinaal (கரிநாள்) are days marked inauspicious in the Tamil calendar — traditionally avoided for starting weddings, housewarmings, travel and other important new ventures.",
        "கரிநாள் என்பவை தமிழ் நாட்காட்டியில் தீய நாட்களாகக் குறிக்கப்படுபவை — திருமணம், கிரஹப்பிரவேசம், பயணம், புதிய முயற்சிகள் தொடங்க பொதுவாகத் தவிர்க்கப்படுகின்றன.",
        "Karinaal are not for worship-avoidance — temple visits and prayer are fine; only new auspicious undertakings are deferred.",
        "கரிநாள் வழிபாட்டைத் தடுக்காது — கோயில் தரிசனம், பிரார்த்தனை சரியே; புதிய சுப காரியங்களை மட்டுமே ஒத்திவைக்கிறார்கள்.",
        ("karinaal {year}", "kari naal dates {year}", "inauspicious days tamil {year}", "கரிநாள் {year}"),
    ),
)

EVENT_META_BY_KEY: dict[str, EventMeta] = {m.key: m for m in _EVENT_META}
EVENT_ORDER: tuple[str, ...] = tuple(m.key for m in _EVENT_META)


def _bi(ta: str, en: str) -> dict[str, str]:
    return {"ta": ta, "en": en}


def _slug(event_key: str, year: int) -> str:
    return f"{event_key}-{year}"


def _resolve_key(event: str, year: int) -> str:
    """Accept either an event key ('pournami') or a slug ('pournami-2026')."""
    candidate = event.strip().lower()
    if candidate in EVENT_META_BY_KEY:
        return candidate
    suffix = f"-{year}"
    if candidate.endswith(suffix) and candidate[: -len(suffix)] in EVENT_META_BY_KEY:
        return candidate[: -len(suffix)]
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown event: {event}")


def _enrich_date(row: dict) -> dict:
    month_ta, month_en = TAMIL_MONTHS[row["tamilMonthIndex"]]
    wd = row["weekday"]
    return {
        "date": row["date"],
        "weekday": _bi(WEEKDAY_TA[wd], wd.title()),
        "tamilDate": _bi(f"{month_ta} {row['tamilDay']}", f"{month_en} {row['tamilDay']}"),
        "tamilMonth": _bi(month_ta, month_en),
        "tamilDay": row["tamilDay"],
    }


def _next_date(dates: Sequence[dict], reference: date) -> str | None:
    for row in dates:
        if date.fromisoformat(row["date"]) >= reference:
            return row["date"]
    return None


@dataclass(frozen=True, slots=True)
class _EngineDay:
    tithi: int                   # sunrise tithi, 1-30
    special: int | None          # the dominant Pournami (15) / Amavasai (30) day
    names: frozenset[str]        # what the daily panchangam names this day
    previous_tithi: int | None
    next_tithi: int | None


def _tithi_day(day: _EngineDay, tithi: int) -> bool:
    """The day named for `tithi`: the rule ruling Q6 gives Pournami and Amavasai
    (`special_tithi_day_from_sunrises`), applied to any tithi. It holds sunrise,
    the first of two sunrises; a kshaya tithi is the day it falls in.

    An extension, not ruled: Q6 names only 15 and 30. Without it a tithi
    holding two sunrises was listed twice (Navami 2026: 27 days)."""
    if day.tithi == tithi:
        return day.previous_tithi != tithi
    return day.tithi == tithi - 1 and day.next_tithi == tithi + 1


# Each page lists the days the daily panchangam itself names, matched on the
# engine's exact festival names (a curated row such as "Maha Sankatahara
# Chathurthi" must not add a second date). Ashtami, Navami and Chandra
# Darisanam carry no festival name, so they use the sunrise tithi.
_ENGINE_RULES: dict[str, Callable[[_EngineDay], bool]] = {
    "pournami": lambda d: d.special == 15,
    "amavasai": lambda d: d.special == 30,
    "pradosham": lambda d: bool(d.names & {"Pradhosam", "Sani Pradhosam"}),
    "ekadhasi": lambda d: bool(d.names & {"Ekadashi (Shukla)", "Ekadashi (Krishna)", "Vaikunta Ekadashi"}),
    "sankatahara-chathurthi": lambda d: bool(d.names & {"Sankatahara Chaturthi", "Angarki Sankatahara Chaturthi"}),
    "chathurthi": lambda d: "Chathurthi" in d.names,
    "sashti": lambda d: "Sashti" in d.names,
    "ashtami": lambda d: _tithi_day(d, 8) or _tithi_day(d, 23),
    "navami": lambda d: _tithi_day(d, 9) or _tithi_day(d, 24),
    "karthigai": lambda d: "Karthigai Vratam" in d.names,
    "thiruvonam": lambda d: "Thiruvonam Vratam" in d.names,
    "maadha-sivarathiri": lambda d: bool(d.names & {"Masa Sivarathiri", "Sivarathiri"}),
    # The first sunrise of the bright fortnight after Prathamai: Dvitiya, or
    # Tritiya when Dvitiya held no sunrise.
    "chandra-darisanam": lambda d: d.tithi in (2, 3) and d.previous_tithi in (30, 1),
}


@lru_cache(maxsize=8)
def _engine_rows(year: int) -> dict[str, tuple[dict, ...]]:
    """Every event's days in `year`, read off the daily panchangam at Chennai.

    Cached per process: a cold year is ~400 snapshots (about 15 s).
    """
    # panchangam_service imports this module (is_karinaal), so these load late.
    from app.services.panchangam_cache import calculate_daily_panchangam_range
    from app.services.panchangam_service import _build_festivals

    tz, lat, lon = KARINAAL_REFERENCE_TZ, KARINAAL_REFERENCE_LAT, KARINAAL_REFERENCE_LON
    # One day either side: the rules read the previous and the next sunrise.
    snapshots = calculate_daily_panchangam_range(date(year - 1, 12, 31), date(year + 1, 1, 1), lat, lon, tz)
    rows: dict[str, list[dict]] = {key: [] for key in _ENGINE_RULES}
    ordered = [snapshots[day] for day in sorted(snapshots)]
    for i, snapshot in enumerate(ordered):
        day = snapshot.date_local
        previous = ordered[i - 1] if i > 0 else None
        following = ordered[i + 1] if i + 1 < len(ordered) else None
        if day.year == year:
            engine_day = _EngineDay(
                tithi=snapshot.tithi_number,
                special=snapshot.special_tithi_day_number,
                names=frozenset(f.name for f in _build_festivals(snapshot, previous_day_snapshot=previous)),
                previous_tithi=previous.tithi_number if previous else None,
                next_tithi=following.tithi_number if following else None,
            )
            matched = [key for key, rule in _ENGINE_RULES.items() if rule(engine_day)]
            if matched:
                month_index, tamil_day = tamil_solar_date(day, tz, lat, lon)
                row = {
                    "date": day.isoformat(),
                    "weekday": day.strftime("%A").upper(),
                    "tamilMonthIndex": month_index,
                    "tamilDay": tamil_day,
                }
                for key in matched:
                    rows[key].append(row)
    return {key: tuple(found) for key, found in rows.items()}


#: lru_cache does not merge concurrent misses: a static build asks for all 15
#: pages of a cold year at once, and each would compute the year itself.
_ENGINE_ROWS_LOCK = threading.Lock()


def _rows_for(key: str, year: int) -> Sequence[dict]:
    """The event's date rows — Karinaal by its own rule, the rest off the daily panchangam."""
    if key == "karinaal":
        return karinaal_rows_for_year(year)
    with _ENGINE_ROWS_LOCK:
        return _engine_rows(year)[key]


def available_years() -> list[int]:
    return list(PUBLISHED_YEARS)


def _require_published(year: int) -> None:
    if year not in PUBLISHED_YEARS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No calendar published for {year}. "
                f"Available years: {PUBLISHED_YEARS.start}-{PUBLISHED_YEARS.stop - 1}"
            ),
        )


def list_events(year: int, *, reference: date | None = None) -> dict:
    _require_published(year)
    ref = reference or date.today()
    events = []
    for key in EVENT_ORDER:
        meta = EVENT_META_BY_KEY[key]
        dates = _rows_for(key, year)
        events.append({
            "key": key,
            "slug": _slug(key, year),
            "name": _bi(meta.name_ta, meta.name_en),
            "tagline": _bi(meta.tagline_ta, meta.tagline_en),
            "category": meta.category,
            "count": len(dates),
            "nextDate": _next_date(dates, ref),
        })
    return {"year": year, "source": SOURCE, "events": events}


def get_event(event: str, year: int, *, reference: date | None = None) -> dict:
    _require_published(year)
    key = _resolve_key(event, year)
    meta = EVENT_META_BY_KEY[key]
    event_rows = _rows_for(key, year)
    dates = [_enrich_date(r) for r in event_rows]
    ref = reference or date.today()
    return {
        "year": year,
        "source": SOURCE,
        "key": key,
        "slug": _slug(key, year),
        "name": _bi(meta.name_ta, meta.name_en),
        "tagline": _bi(meta.tagline_ta, meta.tagline_en),
        "category": meta.category,
        "summary": _bi(meta.summary_ta, meta.summary_en),
        "significance": _bi(meta.significance_ta, meta.significance_en),
        "keywords": [k.format(year=year) for k in meta.keywords],
        "count": len(dates),
        "nextDate": _next_date(event_rows, ref),
        "dates": dates,
    }


def karinaal_dates(year: int) -> set[str]:
    return {d.isoformat() for d in karinaal_days_for_year(year)}


def is_karinaal(d: date) -> bool:
    """True when `d` is a Karinaal — for any year, not only a published one.

    Derived (F-MUH-02); see `app.calculations.karinaal` for the rule and for
    the three 2026 rows that derivation does not reproduce.
    """
    return d in karinaal_days_for_year(d.year)
