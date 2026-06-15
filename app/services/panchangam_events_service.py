"""Tamil-calendar special-event listings (Pournami, Amavasai, Pradosham, …).

Powers the public SEO pages under /tamil-calendar and the Karinaal flag on the
daily panchangam. Dates are the curated 2026 almanac set
(``app.data.panchangam_events_2026``); this module adds bilingual names + SEO
content and computes the "next upcoming date" relative to a reference day.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from fastapi import HTTPException, status

from app.calculations.tamil_calendar import TAMIL_MONTHS
from app.data.panchangam_events_2026 import PANCHANGAM_EVENTS_2026

EVENTS_BY_YEAR: dict[int, dict[str, list[dict]]] = {
    2026: PANCHANGAM_EVENTS_2026,
}
SOURCE = "Vinaadi 2026 Tamil almanac"

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
        ("pournami 2026", "full moon dates 2026", "pournami date", "பௌர்ணமி 2026", "pournami vratham 2026"),
    ),
    EventMeta(
        "amavasai", "Amavasai", "அமாவாசை", "TITHI",
        "New Moon day", "புதுப் பிறை / அமாவாசை நாள்",
        "Amavasai is the new-moon day (30th tithi), traditionally dedicated to remembering ancestors (tarpanam / pitru tarpanam) and offering prayers for departed elders.",
        "அமாவாசை என்பது புதுப் பிறை நாள் (30-ஆம் திதி). முன்னோர்களை நினைவுகூர்ந்து தர்ப்பணம் செய்வதற்கு உகந்த நாள்.",
        "Thai Amavasai (Thai Amavasya) and Aadi Amavasai are major days for ancestral rites in Tamil tradition.",
        "தை அமாவாசை, ஆடி அமாவாசை ஆகியவை முன்னோர் வழிபாட்டுக்கு முக்கியமான நாட்கள்.",
        ("amavasai 2026", "new moon dates 2026", "amavasya date", "அமாவாசை 2026", "thai amavasai 2026"),
    ),
    EventMeta(
        "pradosham", "Pradosham", "பிரதோஷம்", "TITHI",
        "Shiva twilight worship (Trayodasi)", "சிவ வழிபாட்டு அந்தி நேரம்",
        "Pradosham falls on the 13th tithi (Trayodasi) of both fortnights and is dedicated to Lord Shiva; worship is done in the pradosha kaalam, the twilight before sunset.",
        "பிரதோஷம் இரு பட்சங்களிலும் 13-ஆம் திதியில் (திரயோதசி) வரும். சிவ வழிபாட்டுக்கு உகந்தது; சூரிய அஸ்தமனத்துக்கு முந்திய பிரதோஷ காலத்தில் வழிபடுகிறார்கள்.",
        "Soma Pradosham (Monday) and Shani Pradosham (Saturday) are considered especially powerful.",
        "சோம பிரதோஷம் (திங்கள்), சனி பிரதோஷம் (சனி) ஆகியவை மிகவும் சக்தி வாய்ந்தவையாகக் கருதப்படுகின்றன.",
        ("pradosham 2026", "pradosham dates 2026", "soma pradosham", "sani pradosham", "பிரதோஷம் 2026"),
    ),
    EventMeta(
        "ekadhasi", "Ekadhasi", "ஏகாதசி", "TITHI",
        "11th tithi — Vishnu fasting day", "11-ஆம் திதி — விஷ்ணு விரத நாள்",
        "Ekadhasi is the 11th tithi of each fortnight, observed as a fasting day for Lord Vishnu. Vaikunta Ekadhasi is the most important of the year.",
        "ஏகாதசி ஒவ்வொரு பட்சத்திலும் 11-ஆம் திதியில் வரும். விஷ்ணு வழிபாட்டுக்கான விரத நாள். வைகுண்ட ஏகாதசி ஆண்டின் முக்கிய ஏகாதசி.",
        "Devotees fast from grains on Ekadhasi and break the fast (paranai) the next morning on Dwadasi.",
        "ஏகாதசியில் தானியம் தவிர்த்து விரதம் இருந்து, மறுநாள் துவாதசியில் பாரணை செய்கிறார்கள்.",
        ("ekadhasi 2026", "ekadasi dates 2026", "vaikunta ekadasi 2026", "ஏகாதசி 2026"),
    ),
    EventMeta(
        "sankatahara-chathurthi", "Sankatahara Chathurthi", "சங்கடஹர சதுர்த்தி", "TITHI",
        "Ganesha day (Krishna Chaturthi)", "விநாயகர் வழிபாட்டு நாள்",
        "Sankatahara Chathurthi is the Krishna-paksha 4th tithi, dedicated to Lord Ganesha to remove obstacles; worship is done after moonrise.",
        "சங்கடஹர சதுர்த்தி கிருஷ்ண பட்ச 4-ஆம் திதியில் வரும். தடைகளை நீக்கும் விநாயகர் வழிபாட்டுக்கு உகந்தது; சந்திரோதயத்துக்குப் பின் வழிபடுகிறார்கள்.",
        "Devotees fast and worship Ganesha, breaking the fast after sighting the moon.",
        "பக்தர்கள் விரதம் இருந்து விநாயகரை வழிபட்டு, சந்திரனைக் கண்ட பின் விரதம் முடிக்கிறார்கள்.",
        ("sankatahara chathurthi 2026", "sankashti chaturthi 2026", "சங்கடஹர சதுர்த்தி 2026"),
    ),
    EventMeta(
        "chathurthi", "Chathurthi", "சதுர்த்தி", "TITHI",
        "Vinayaka Chaturthi (Shukla 4th)", "விநாயகர் சதுர்த்தி",
        "Shukla-paksha Chaturthi (4th tithi) is a day for worshipping Lord Ganesha; the Bhadrapada one is celebrated as Vinayaka Chaturthi.",
        "சுக்ல பட்ச சதுர்த்தி (4-ஆம் திதி) விநாயகர் வழிபாட்டு நாள்; ஆவணி மாத சதுர்த்தி விநாயகர் சதுர்த்தியாகக் கொண்டாடப்படுகிறது.",
        "Ganesha is worshipped for wisdom and a smooth start to new ventures.",
        "புதிய முயற்சிகள் வெற்றிபெற விநாயகரை வழிபடுகிறார்கள்.",
        ("chathurthi 2026", "vinayaka chaturthi 2026", "சதுர்த்தி 2026"),
    ),
    EventMeta(
        "sashti", "Sashti", "சஷ்டி", "TITHI",
        "Murugan day (6th tithi)", "முருகன் வழிபாட்டு நாள்",
        "Sashti, the 6th tithi, is dedicated to Lord Murugan; the Aippasi Soorasamharam Sashti is the most celebrated.",
        "சஷ்டி (6-ஆம் திதி) முருகன் வழிபாட்டு நாள்; ஐப்பசி சூரசம்ஹார சஷ்டி மிகவும் சிறப்பு பெற்றது.",
        "Devotees observe the Sashti vratham for Murugan's blessings of courage and protection.",
        "தைரியமும் காப்பும் வேண்டி முருகனை நோக்கி சஷ்டி விரதம் இருக்கிறார்கள்.",
        ("sashti 2026", "sashti viratham 2026", "சஷ்டி 2026"),
    ),
    EventMeta(
        "ashtami", "Ashtami", "அஷ்டமி", "TITHI",
        "8th tithi", "8-ஆம் திதி",
        "Ashtami is the 8th tithi of each fortnight. Krishna Janmashtami and certain Devi ashtamis are observed with special worship.",
        "அஷ்டமி ஒவ்வொரு பட்சத்திலும் 8-ஆம் திதி. கிருஷ்ண ஜென்மாஷ்டமி, தேவி அஷ்டமிகள் சிறப்பு வழிபாட்டுடன் கடைப்பிடிக்கப்படுகின்றன.",
        "Ashtami is generally avoided for starting major auspicious events.",
        "பெரிய சுப காரியங்களைத் தொடங்க அஷ்டமி பொதுவாகத் தவிர்க்கப்படுகிறது.",
        ("ashtami 2026", "ashtami dates 2026", "அஷ்டமி 2026"),
    ),
    EventMeta(
        "navami", "Navami", "நவமி", "TITHI",
        "9th tithi", "9-ஆம் திதி",
        "Navami is the 9th tithi; Rama Navami (Panguni) and the Navami of Navaratri are the most significant.",
        "நவமி 9-ஆம் திதி; ராம நவமி (பங்குனி), நவராத்திரி நவமி ஆகியவை முக்கியமானவை.",
        "Like Ashtami, plain Navami is generally avoided for new auspicious starts.",
        "அஷ்டமியைப் போலவே நவமியும் புதிய சுப தொடக்கங்களுக்குப் பொதுவாகத் தவிர்க்கப்படுகிறது.",
        ("navami 2026", "rama navami 2026", "நவமி 2026"),
    ),
    EventMeta(
        "karthigai", "Karthigai", "கார்த்திகை", "NAKSHATRA",
        "Karthigai nakshatra — Murugan day", "கார்த்திகை நட்சத்திர நாள்",
        "The monthly Karthigai is the day the Moon transits the Karthigai (Krittika) nakshatra, dedicated to Lord Murugan; Karthigai Deepam (Karthigai month) is the great festival.",
        "மாதந்தோறும் சந்திரன் கார்த்திகை நட்சத்திரத்தில் சஞ்சரிக்கும் நாள் கார்த்திகை; முருகன் வழிபாட்டு நாள். கார்த்திகை தீபம் பெருவிழா.",
        "Lighting lamps on Karthigai is a cherished Tamil tradition for prosperity and dispelling darkness.",
        "கார்த்திகையில் விளக்கேற்றுவது வளமும் ஒளியும் வேண்டிய தமிழ் மரபு.",
        ("karthigai 2026", "karthigai dates 2026", "karthigai deepam 2026", "கார்த்திகை 2026"),
    ),
    EventMeta(
        "thiruvonam", "Thiruvonam", "திருவோணம்", "NAKSHATRA",
        "Thiruvonam (Shravana) nakshatra — Vishnu day", "திருவோண நட்சத்திர நாள்",
        "Thiruvonam is the day the Moon transits the Thiruvonam (Shravana) nakshatra, considered auspicious and dedicated to Lord Vishnu.",
        "சந்திரன் திருவோண (சிரவணம்) நட்சத்திரத்தில் சஞ்சரிக்கும் நாள் திருவோணம்; விஷ்ணு வழிபாட்டுக்கு உகந்த சுப நாள்.",
        "Monthly Thiruvonam is favoured for Vishnu worship and auspicious activities.",
        "மாதந்தோறும் வரும் திருவோணம் விஷ்ணு வழிபாட்டுக்கும் சுப காரியங்களுக்கும் ஏற்றது.",
        ("thiruvonam 2026", "thiruvonam dates 2026", "திருவோணம் 2026"),
    ),
    EventMeta(
        "maadha-sivarathiri", "Maadha Sivarathiri", "மாத சிவராத்திரி", "TITHI",
        "Monthly Shiva night (Krishna Chaturdashi)", "மாதந்தோறும் சிவராத்திரி",
        "Maadha Sivarathiri is the monthly Krishna-paksha Chaturdashi night dedicated to Lord Shiva; the Masi one is Maha Sivarathiri.",
        "மாத சிவராத்திரி ஒவ்வொரு மாதமும் கிருஷ்ண பட்ச சதுர்தசி இரவில் வரும் சிவ வழிபாட்டு நாள்; மாசி மாதத்தது மகா சிவராத்திரி.",
        "Devotees keep a night vigil (jagaran) and fast in devotion to Shiva.",
        "பக்தர்கள் இரவு முழுவதும் விழித்திருந்து (ஜாகரணம்) சிவனை வழிபட்டு விரதம் இருக்கிறார்கள்.",
        ("maadha sivarathiri 2026", "masa shivaratri 2026", "மாத சிவராத்திரி 2026"),
    ),
    EventMeta(
        "chandra-darisanam", "Chandra Darisanam", "சந்திர தரிசனம்", "TITHI",
        "First crescent moon sighting", "பிறை சந்திர தரிசனம்",
        "Chandra Darisanam is the sighting of the first crescent moon after Amavasai (early Shukla paksha), considered auspicious to view.",
        "அமாவாசைக்குப் பின் முதல் பிறை சந்திரனைக் காணும் நாள் சந்திர தரிசனம்; காண்பது சுபமாகக் கருதப்படுகிறது.",
        "Viewing the new crescent is traditionally regarded as bringing good fortune for the month.",
        "புதுப் பிறையைக் காண்பது அம்மாதத்துக்கு நற்பேறு தரும் என நம்பப்படுகிறது.",
        ("chandra darisanam 2026", "crescent moon 2026", "சந்திர தரிசனம் 2026"),
    ),
    EventMeta(
        "karinaal", "Karinaal", "கரிநாள்", "INAUSPICIOUS",
        "Inauspicious days to avoid", "தவிர்க்க வேண்டிய நாட்கள்",
        "Karinaal (கரிநாள்) are days marked inauspicious in the Tamil calendar — traditionally avoided for starting weddings, housewarmings, travel and other important new ventures.",
        "கரிநாள் என்பவை தமிழ் நாட்காட்டியில் தீய நாட்களாகக் குறிக்கப்படுபவை — திருமணம், கிரஹப்பிரவேசம், பயணம், புதிய முயற்சிகள் தொடங்க பொதுவாகத் தவிர்க்கப்படுகின்றன.",
        "Karinaal are not for worship-avoidance — temple visits and prayer are fine; only new auspicious undertakings are deferred.",
        "கரிநாள் வழிபாட்டைத் தடுக்காது — கோயில் தரிசனம், பிரார்த்தனை சரியே; புதிய சுப காரியங்களை மட்டுமே ஒத்திவைக்கிறார்கள்.",
        ("karinaal 2026", "kari naal dates 2026", "inauspicious days tamil 2026", "கரிநாள் 2026"),
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


def _next_date(dates: list[dict], reference: date) -> str | None:
    for row in dates:
        if date.fromisoformat(row["date"]) >= reference:
            return row["date"]
    return None


def available_years() -> list[int]:
    return sorted(EVENTS_BY_YEAR)


def list_events(year: int, *, reference: date | None = None) -> dict:
    rows = EVENTS_BY_YEAR.get(year)
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No calendar published for {year}. Available years: {available_years()}",
        )
    ref = reference or date.today()
    events = []
    for key in EVENT_ORDER:
        meta = EVENT_META_BY_KEY[key]
        dates = rows.get(key, [])
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
    rows = EVENTS_BY_YEAR.get(year)
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No calendar published for {year}. Available years: {available_years()}",
        )
    key = _resolve_key(event, year)
    meta = EVENT_META_BY_KEY[key]
    dates = [_enrich_date(r) for r in rows.get(key, [])]
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
        "keywords": list(meta.keywords),
        "count": len(dates),
        "nextDate": _next_date(rows.get(key, []), ref),
        "dates": dates,
    }


def karinaal_dates(year: int) -> set[str]:
    rows = EVENTS_BY_YEAR.get(year, {})
    return {r["date"] for r in rows.get("karinaal", [])}


def is_karinaal(d: date) -> bool:
    return d.isoformat() in karinaal_dates(d.year)
