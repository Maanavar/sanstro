"""Tamil year name, Ayanam and Ruthu for a Tamil day (AAU-16, ruled 2026-10-29).

One module that every surface reads: the printed Jadhagam, the PDF and the
calendar. All three come from the Tamil solar month (`tamil_calendar`), which is
itself the Sun's nirayana sign under the sunset rule, so nothing here is keyed
on the Gregorian year by a modulus.

* **Year (வருடம்).** The 60-name cycle, turning at Chithirai 1. 1987-88 is
  Prabhava (#1), so 2026-27 is Parabhava (#40), which is the ruling's fixture.
* **Ayanam (அயனம்).** Uttarayanam from Thai (the Sun's nirayana ingress into
  Makaram) through Aani; Dakshinayanam from Aadi (ingress into Kadagam) through
  Margazhi. This runs ~23-24 days after the astronomical solstices; that is the
  ayanamsa, not an error, and the surface says so.
* **Ruthu (ருது).** Tholkappiyam's six seasons, two Tamil months each. The
  cycle begins with கார், not with Chithirai.

Callers pass the **Tamil day** — the previous civil date for a birth before
sunrise (AAU-02) — so the 1 a.m. before Chithirai 1 still names the old year.

The 60 names are the forms Tamil almanacs print; native review pending.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from app.calculations.tamil_calendar import tamil_solar_date

#: (Tamil, English), #1 Prabhava .. #60 Akshaya.
SAMVATSARA_NAMES: tuple[tuple[str, str], ...] = (
    ("பிரபவ", "Prabhava"), ("விபவ", "Vibhava"), ("சுக்ல", "Sukla"), ("பிரமோதூத", "Pramodhootha"),
    ("பிரசோற்பத்தி", "Prajothpathi"), ("ஆங்கீரச", "Aangirasa"), ("ஸ்ரீமுக", "Srimukha"), ("பவ", "Bhava"),
    ("யுவ", "Yuva"), ("தாது", "Dhathu"), ("ஈஸ்வர", "Eeswara"), ("வெகுதானிய", "Vehudhanya"),
    ("பிரமாதி", "Pramathi"), ("விக்கிரம", "Vikrama"), ("விஷு", "Vishu"), ("சித்திரபானு", "Chithirabhanu"),
    ("சுபானு", "Subhanu"), ("தாரண", "Dharana"), ("பார்த்திப", "Parthiba"), ("விய", "Viya"),
    ("சர்வசித்து", "Sarvajith"), ("சர்வதாரி", "Sarvadhari"), ("விரோதி", "Virodhi"), ("விக்ருதி", "Vikruthi"),
    ("கர", "Kara"), ("நந்தன", "Nandhana"), ("விஜய", "Vijaya"), ("ஜய", "Jaya"),
    ("மன்மத", "Manmatha"), ("துன்முகி", "Dhunmuki"), ("ஹேவிளம்பி", "Hevilambi"), ("விளம்பி", "Vilambi"),
    ("விகாரி", "Vikari"), ("சார்வரி", "Sarvari"), ("பிலவ", "Plava"), ("சுபகிருது", "Subakiruthu"),
    ("சோபகிருது", "Sobakiruthu"), ("குரோதி", "Krodhi"), ("விசுவாவசு", "Visuvasu"), ("பராபவ", "Parabhava"),
    ("பிலவங்க", "Plavanga"), ("கீலக", "Keelaka"), ("சௌமிய", "Saumya"), ("சாதாரண", "Sadharana"),
    ("விரோதகிருது", "Virodhakiruthu"), ("பரிதாபி", "Paridhabi"), ("பிரமாதீச", "Pramadheesa"), ("ஆனந்த", "Anandha"),
    ("ராட்சச", "Rakshasa"), ("நள", "Nala"), ("பிங்கள", "Pingala"), ("காளயுக்தி", "Kalayukthi"),
    ("சித்தார்த்தி", "Siddharthi"), ("ரௌத்திரி", "Raudhri"), ("துன்மதி", "Dhunmathi"), ("துந்துபி", "Dhundhubhi"),
    ("ருத்ரோத்காரி", "Rudhrodhgari"), ("ரக்தாட்சி", "Rakthakshi"), ("குரோதன", "Krodhana"), ("அட்சய", "Akshaya"),
)
_CYCLE_EPOCH = 1987  # the Gregorian year in which Prabhava (#1) began

AYANAM_NAMES: dict[str, tuple[str, str]] = {
    "UTTARAYANAM": ("உத்தராயணம்", "Uttarayanam"),
    "DAKSHINAYANAM": ("தட்சிணாயனம்", "Dakshinayanam"),
}
#: Tamil month index (0 = Chithirai) -> ayanam. Thai (9) through Aani (2).
_UTTARAYANAM_MONTHS = frozenset({9, 10, 11, 0, 1, 2})

#: In cycle order, கார் first; each with its two Tamil month indices.
RUTHU_CYCLE: tuple[tuple[str, str, str, tuple[int, int]], ...] = (
    ("KAAR", "கார்", "Kaar", (4, 5)),            # Avani, Purattasi
    ("KOODHIR", "கூதிர்", "Koodhir", (6, 7)),      # Aippasi, Karthigai
    ("MUNPANI", "முன்பனி", "Munpani", (8, 9)),     # Margazhi, Thai
    ("PINPANI", "பின்பனி", "Pinpani", (10, 11)),   # Maasi, Panguni
    ("ILAVENIL", "இளவேனில்", "Ilavenil", (0, 1)),  # Chithirai, Vaikasi
    ("MUTHUVENIL", "முதுவேனில்", "Muthuvenil", (2, 3)),  # Aani, Aadi
)


@dataclass(frozen=True, slots=True)
class TamilYearInfo:
    year_number: int          # 1..60 in the cycle
    year_ta: str
    year_en: str
    year_start: int           # Gregorian year of its Chithirai 1
    month_index: int          # 0 = Chithirai
    ayanam: str               # UTTARAYANAM | DAKSHINAYANAM
    ayanam_ta: str
    ayanam_en: str
    ruthu: str
    ruthu_ta: str
    ruthu_en: str


def samvatsara_number(year_start: int) -> int:
    """1..60 for the Tamil year that began at Chithirai 1 of `year_start`."""
    return (year_start - _CYCLE_EPOCH) % 60 + 1


def tamil_year_info(tamil_day: date, timezone_name: str, latitude: float, longitude: float) -> TamilYearInfo:
    month_index, _ = tamil_solar_date(tamil_day, timezone_name, latitude, longitude)
    # Chithirai..Margazhi from April on belong to the year that began this
    # April; Thai..Panguni, and the January days of Margazhi, to last year's.
    year_start = tamil_day.year if month_index <= 8 and tamil_day.month >= 4 else tamil_day.year - 1
    number = samvatsara_number(year_start)
    year_ta, year_en = SAMVATSARA_NAMES[number - 1]
    ayanam = "UTTARAYANAM" if month_index in _UTTARAYANAM_MONTHS else "DAKSHINAYANAM"
    ruthu, ruthu_ta, ruthu_en, _ = next(r for r in RUTHU_CYCLE if month_index in r[3])
    return TamilYearInfo(
        year_number=number,
        year_ta=year_ta,
        year_en=year_en,
        year_start=year_start,
        month_index=month_index,
        ayanam=ayanam,
        ayanam_ta=AYANAM_NAMES[ayanam][0],
        ayanam_en=AYANAM_NAMES[ayanam][1],
        ruthu=ruthu,
        ruthu_ta=ruthu_ta,
        ruthu_en=ruthu_en,
    )
