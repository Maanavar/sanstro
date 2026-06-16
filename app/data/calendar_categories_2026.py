"""Curated 2026 festival and Tamil Nadu holiday category pages.

The rows here power both public SEO category pages and the dashboard's
festival/holiday labels. Dates are Gregorian civil dates for Tamil Nadu/India
audiences. Islamic dates are planning dates and can vary by moon sighting.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True, slots=True)
class CalendarCategoryMeta:
    slug: str
    year: int
    title_en: str
    title_ta: str
    description_en: str
    description_ta: str
    category_label_en: str
    category_label_ta: str
    source_en: str
    source_ta: str


@dataclass(frozen=True, slots=True)
class CalendarCategoryEvent:
    category_slug: str
    date: date
    name_en: str
    name_ta: str
    tags: tuple[str, ...]
    note_en: str = ""
    note_ta: str = ""


YEAR = 2026

CALENDAR_CATEGORY_META: dict[str, CalendarCategoryMeta] = {
    "hindu-festivals-2026": CalendarCategoryMeta(
        slug="hindu-festivals-2026",
        year=YEAR,
        title_en="Hindu Festivals 2026",
        title_ta="இந்துப் பண்டிகைகள் 2026",
        description_en="Major Hindu and Tamil devotional festival dates for 2026, arranged by Gregorian date with weekday and panchangam links.",
        description_ta="2026-க்கான முக்கிய இந்து மற்றும் தமிழ் ஆன்மிகப் பண்டிகைகள் தேதி, கிழமை, பஞ்சாங்கம் இணைப்புகளுடன்.",
        category_label_en="Hindu festivals",
        category_label_ta="இந்துப் பண்டிகைகள்",
        source_en="Curated from the supplied 2026 Tamil calendar list and cross-checked against Vinaadi panchangam data.",
        source_ta="வழங்கப்பட்ட 2026 தமிழ் நாட்காட்டி பட்டியல் மற்றும் Vinaadi பஞ்சாங்கத் தரவு மூலம் சரிபார்க்கப்பட்டது.",
    ),
    "muslim-festivals-2026": CalendarCategoryMeta(
        slug="muslim-festivals-2026",
        year=YEAR,
        title_en="Muslim Festivals 2026",
        title_ta="முஸ்லிம் பண்டிகைகள் 2026",
        description_en="Ramzan, Bakrid, Muharram, Milad-un-Nabi and other key Muslim festival dates for 2026.",
        description_ta="2026-க்கான ரம்ஜான், பக்ரீத், மொஹர்ரம், மீலாது நபி உள்ளிட்ட முக்கிய முஸ்லிம் பண்டிகைகள்.",
        category_label_en="Muslim festivals",
        category_label_ta="முஸ்லிம் பண்டிகைகள்",
        source_en="Planning dates from the supplied 2026 list; moon-sighting festivals may vary by local announcement.",
        source_ta="வழங்கப்பட்ட 2026 பட்டியலின் திட்டமிடல் தேதிகள்; பிறைத் தரிசனத்தைப் பொறுத்த பண்டிகைகள் மாறலாம்.",
    ),
    "christian-festivals-2026": CalendarCategoryMeta(
        slug="christian-festivals-2026",
        year=YEAR,
        title_en="Christian Festivals 2026",
        title_ta="கிறிஸ்தவ பண்டிகைகள் 2026",
        description_en="Christian observances and festival dates for 2026 including Lent, Holy Week, Easter and Christmas.",
        description_ta="2026-க்கான லெண்ட், புனித வாரம், ஈஸ்டர், கிறிஸ்துமஸ் உள்ளிட்ட கிறிஸ்தவ பண்டிகைகள்.",
        category_label_en="Christian festivals",
        category_label_ta="கிறிஸ்தவ பண்டிகைகள்",
        source_en="Curated from the supplied 2026 list; Palm Sunday corrected to the Sunday before Easter.",
        source_ta="வழங்கப்பட்ட 2026 பட்டியலிலிருந்து தொகுக்கப்பட்டது; ஈஸ்டருக்கு முந்தைய ஞாயிறாக பாம் சண்டே திருத்தப்பட்டது.",
    ),
    "tamil-nadu-government-holidays-2026": CalendarCategoryMeta(
        slug="tamil-nadu-government-holidays-2026",
        year=YEAR,
        title_en="Tamil Nadu Government Holidays 2026",
        title_ta="தமிழ்நாடு அரசு விடுமுறைகள் 2026",
        description_en="Official Tamil Nadu public holidays for 2026, including state, national, religious and bank-only holidays.",
        description_ta="2026-க்கான தமிழ்நாடு அரசு பொது விடுமுறைகள், தேசிய/மாநில/மத மற்றும் வங்கி விடுமுறைகள் உட்பட.",
        category_label_en="Tamil Nadu government holidays",
        category_label_ta="தமிழ்நாடு அரசு விடுமுறைகள்",
        source_en="Tamil Nadu government 2026 public holiday notification, with weekday validation.",
        source_ta="தமிழ்நாடு அரசு 2026 பொது விடுமுறை அறிவிப்பு, கிழமை சரிபார்ப்புடன்.",
    ),
}


CALENDAR_CATEGORY_EVENTS_2026: tuple[CalendarCategoryEvent, ...] = (
    # Hindu festivals and Tamil devotional observances.
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 3), "Arudra Darisanam", "ஆருத்ரா தரிசனம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 11), "Kerpotta Nivarthi", "கெர்போட்ட நிவர்த்தி", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 14), "Bhogi", "போகிப் பண்டிகை", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 15), "Thai Pongal / Makar Sankranti", "தைப் பொங்கல்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 16), "Mattu Pongal", "மாட்டுப் பொங்கல்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 16), "Thiruvalluvar Day", "திருவள்ளுவர் தினம்", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 17), "Kaanum Pongal", "காணும் பொங்கல்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 17), "Uzhavar Thirunal", "உழவர் திருநாள்", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 18), "Thai Amavasai", "தை அமாவாசை", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 1, 25), "Ratha Saptami", "ரத ஸப்தமி", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 2, 1), "Thai Poosam", "தைப்பூசம்", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 2, 15), "Maha Sivarathiri", "மஹாசிவராத்திரி", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 3, 2), "Maasi Magam", "மாசி மகம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 3, 4), "Holi", "ஹோலி பண்டிகை", ("hindu",), "Holi observance can span the evening of Mar 3 through Mar 5.", "ஹோலி அனுசரிப்பு மார்ச் 3 மாலை முதல் மார்ச் 5 வரை மாறலாம்."),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 3, 14), "Karadayan Nombu", "காரடையான் நோன்பு", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 3, 19), "Ugadi / Telugu New Year", "தெலுங்கு வருடப் பிறப்பு", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 3, 26), "Ram Navami", "ராமநவமி", ("hindu",), "Some regional panchangams observe Ram Navami on Mar 27.", "சில பிராந்திய பஞ்சாங்கங்களில் ராமநவமி மார்ச் 27 எனக் கடைப்பிடிக்கப்படுகிறது."),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 4, 1), "Panguni Uthiram", "பங்குனி உத்திரம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 4, 14), "Tamil New Year (Puthandu) / Ambedkar Jayanti", "தமிழ் வருடப்பிறப்பு", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 4, 20), "Akshaya Tritiya", "அட்சய திரிதியை", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 4, 21), "Sankara Jayanthi", "சங்கர ஜெயந்தி", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 4, 28), "Meenakshi Thirukalyanam", "மீனாட்சி திருக்கல்யாணம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 4, 30), "Kallazhagar Ethir Sevai", "கள்ளழகர் எதிர்சேவை", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 5, 1), "Kallazhagar Vaigai Ezhuntharulal", "ஸ்ரீகள்ளழகர் வைகை எழுந்தருளல்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 5, 4), "Agni Nakshatram Begins", "அக்னி நட்சத்திரம் துவக்கம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 5, 28), "Agni Nakshatram Ends", "அக்னி நட்சத்திரம் முடிவு", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 5, 30), "Vaigasi Visakam", "வைகாசி விசாகம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 6, 22), "Aani Uthira Darisanam", "ஆனி உத்திர தரிசனம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 7, 29), "Sankaran Kovil Thapasu", "சங்கரன்கோவில் தபசு", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 8, 3), "Aadi Perukku", "ஆடிப்பெருக்கு விழா", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 8, 14), "Thiru Aadi Pooram", "திருஆடிப்பூரம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 8, 17), "Garuda Panchami", "கெருட பஞ்சமி", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 8, 21), "Varalakshmi Vratham", "ஸ்ரீவரலட்சுமி விரதம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 8, 26), "Onam", "ஓணம் பண்டிகை", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 8, 27), "Avani Avittam", "ஆவணி அவிட்டம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 8, 28), "Gayathri Japam", "ஸ்ரீகாயத்ரி ஜெபம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 8, 31), "Maha Sankatahara Chathurthi", "ஸ்ரீமஹா சங்கடஹர சதுர்த்தி", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 9, 4), "Krishna Jayanthi", "கோகுலாஷ்டமி", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 9, 14), "Vinayagar Chaturthi", "ஸ்ரீவிநாயகர் சதுர்த்தி", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 9, 27), "Mahalaya Paksha Begins", "மஹாளய பட்சாரம்பம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 10, 10), "Mahalaya Amavasai", "மஹாளய அமாவாஸ்யை", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 10, 11), "Navarathiri Begins", "நவராத்திரி துவக்கம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 10, 19), "Saraswathi Poojai", "சரஸ்வதி பூஜை", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 10, 19), "Ayudha Pooja", "ஆயுத பூஜை", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 10, 20), "Vijayadasami", "விஜயா தசமி", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 11, 8), "Deepavali", "தீபாவளி பண்டிகை", ("hindu", "tamilnadu_govt")),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 11, 10), "Kanda Sashti Begins", "கந்த ஷஷ்டி துவக்கம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 11, 15), "Soorasamharam", "சூரசம்ஹாரம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 11, 24), "Karthigai Deepam", "திருக்கார்த்திகை", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 11, 24), "Pancharatra Deepam", "பாஞ்சராத்திரதீபம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 12, 20), "Vaikuntha Ekadashi / Mokshada", "வைகுண்ட ஏகாதசி", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 12, 24), "Arudra Darisanam", "ஆருத்ரா தரிசனம்", ("hindu",)),
    CalendarCategoryEvent("hindu-festivals-2026", date(2026, 12, 29), "Kerpotta Begins", "கெர்போட்ட ஆரம்பம்", ("hindu",)),

    # Christian festivals.
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 1, 1), "New Year's Day", "ஆங்கிலப் புத்தாண்டு", ("christian", "tamilnadu_govt")),
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 2, 2), "Presentation of Our Lady", "தேவமாதா பரிசுத்தரான திருநாள்", ("christian",)),
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 2, 18), "Ash Wednesday", "ஆஷ் வெனஸ்டே", ("christian",)),
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 3, 29), "Palm Sunday", "பாம் சண்டே", ("christian",), "Corrected to the Sunday before Easter 2026.", "2026 ஈஸ்டருக்கு முந்தைய ஞாயிறாக திருத்தப்பட்டது."),
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 4, 2), "Maundy Thursday", "பெரிய வியாழன்", ("christian",)),
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 4, 3), "Good Friday", "புனித வெள்ளி", ("christian", "tamilnadu_govt")),
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 4, 5), "Easter Sunday", "ஈஸ்டர் சண்டே", ("christian",)),
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 7, 2), "Visitation of Our Lady", "தேவமாதா காட்சியருளிய நாள்", ("christian",)),
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 9, 8), "Nativity of Our Lady", "தேவமாதா பிறந்த நாள்", ("christian",)),
    CalendarCategoryEvent("christian-festivals-2026", date(2026, 12, 25), "Christmas", "கிறிஸ்துமஸ் பண்டிகை", ("christian", "tamilnadu_govt")),

    # Muslim festivals.
    CalendarCategoryEvent("muslim-festivals-2026", date(2026, 2, 19), "Ramzan Begins", "ரம்ஜான் முதல் தேதி", ("muslim",), "Subject to local moon sighting.", "உள்ளூர் பிறைத் தரிசனத்தைப் பொறுத்து மாறலாம்."),
    CalendarCategoryEvent("muslim-festivals-2026", date(2026, 3, 21), "Eid ul-Fitr (Ramzan)", "ரம்ஜான் பண்டிகை", ("muslim", "tamilnadu_govt"), "Subject to local moon sighting.", "உள்ளூர் பிறைத் தரிசனத்தைப் பொறுத்து மாறலாம்."),
    CalendarCategoryEvent("muslim-festivals-2026", date(2026, 5, 28), "Bakrid (Eid al-Adha)", "பக்ரீத் பண்டிகை", ("muslim", "tamilnadu_govt"), "Subject to local moon sighting.", "உள்ளூர் பிறைத் தரிசனத்தைப் பொறுத்து மாறலாம்."),
    CalendarCategoryEvent("muslim-festivals-2026", date(2026, 6, 17), "Hijri New Year", "ஹிஜிரி வருடப் பிறப்பு", ("muslim",), "Subject to local moon sighting.", "உள்ளூர் பிறைத் தரிசனத்தைப் பொறுத்து மாறலாம்."),
    CalendarCategoryEvent("muslim-festivals-2026", date(2026, 6, 26), "Muharram", "மொஹரம் பண்டிகை", ("muslim", "tamilnadu_govt"), "Subject to local moon sighting.", "உள்ளூர் பிறைத் தரிசனத்தைப் பொறுத்து மாறலாம்."),
    CalendarCategoryEvent("muslim-festivals-2026", date(2026, 8, 26), "Milad-un-Nabi", "மீலாது நபி", ("muslim", "tamilnadu_govt"), "Subject to local moon sighting.", "உள்ளூர் பிறைத் தரிசனத்தைப் பொறுத்து மாறலாம்."),

    # Tamil Nadu government holidays.
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 1, 1), "New Year's Day", "ஆங்கிலப் புத்தாண்டு", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 1, 15), "Pongal", "பொங்கல்", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 1, 16), "Mattu Pongal", "மாட்டுப் பொங்கல்", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 1, 16), "Thiruvalluvar Day", "திருவள்ளுவர் தினம்", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 1, 17), "Uzhavar Thirunal", "உழவர் திருநாள்", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 1, 26), "Republic Day", "குடியரசு தினம்", ("tamilnadu_govt", "indian_govt")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 2, 1), "Thai Poosam", "தைப்பூசம்", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 3, 19), "Telugu New Year Day", "தெலுங்கு வருடப் பிறப்பு", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 3, 21), "Ramzan Festival", "ரமலான் பண்டிகை", ("tamilnadu_govt", "muslim")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 3, 31), "Mahaveer Jayanthi", "மஹாவீர் ஜெயந்தி", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 4, 1), "Annual Closing of Accounts", "வங்கி கணக்கு முடிக்கும் நாள்", ("tamilnadu_govt",), "Bank-only holiday.", "வங்கிகளுக்கு மட்டும் விடுமுறை."),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 4, 3), "Good Friday", "புனித வெள்ளி", ("tamilnadu_govt", "christian")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 4, 14), "Tamil New Year's Day", "தமிழ் வருடப் பிறப்பு", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 4, 14), "Dr. B. R. Ambedkar's Birthday", "டாக்டர் அம்பேத்கர் பிறந்த நாள்", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 5, 1), "May Day", "மே தினம்", ("tamilnadu_govt",)),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 5, 28), "Bakrid Festival", "பக்ரீத் பண்டிகை", ("tamilnadu_govt", "muslim")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 6, 26), "Muharram Festival", "முஹர்ரம் பண்டிகை", ("tamilnadu_govt", "muslim")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 8, 15), "Independence Day", "சுதந்திர தினம்", ("tamilnadu_govt", "indian_govt")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 8, 26), "Milad-un-Nabi", "மீலாது நபி", ("tamilnadu_govt", "muslim")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 9, 4), "Krishna Jayanthi", "கிருஷ்ண ஜெயந்தி", ("tamilnadu_govt", "hindu")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 9, 14), "Vinayakar Chaturthi", "விநாயகர் சதுர்த்தி", ("tamilnadu_govt", "hindu")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 10, 2), "Gandhi Jayanthi", "காந்தி ஜெயந்தி", ("tamilnadu_govt", "indian_govt")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 10, 19), "Ayudha Pooja", "ஆயுத பூஜை", ("tamilnadu_govt", "hindu")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 10, 20), "Vijaya Dasami", "சரஸ்வதி பூஜை / விஜயதசமி", ("tamilnadu_govt", "hindu")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 11, 8), "Deepavali", "தீபாவளி", ("tamilnadu_govt", "hindu")),
    CalendarCategoryEvent("tamil-nadu-government-holidays-2026", date(2026, 12, 25), "Christmas Day", "கிறிஸ்துமஸ் பண்டிகை", ("tamilnadu_govt", "christian")),
)


def category_slugs(year: int = YEAR) -> tuple[str, ...]:
    if year != YEAR:
        return ()
    return tuple(CALENDAR_CATEGORY_META)


def events_for_category(slug: str, year: int = YEAR) -> list[CalendarCategoryEvent]:
    if year != YEAR:
        return []
    return sorted(
        (event for event in CALENDAR_CATEGORY_EVENTS_2026 if event.category_slug == slug),
        key=lambda event: (event.date, event.name_en),
    )


def events_for_date(d: date) -> list[CalendarCategoryEvent]:
    if d.year != YEAR:
        return []
    return [event for event in CALENDAR_CATEGORY_EVENTS_2026 if event.date == d]
