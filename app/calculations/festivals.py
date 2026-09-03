from __future__ import annotations

from datetime import date
from typing import Literal

from app.data.calendar_categories_2026 import events_for_date as category_events_for_date

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
        # Hindu — solar / fixed Tamil calendar. Bhogi/Mattu Pongal/Kaanum
        # Pongal are simple day-offsets from Pongal itself (day-1/+1/+2) —
        # WI-12 (2026-07-16): corrected to stay consistent with the verified
        # Pongal date below (was one day late here, an error independent of
        # WI-12/WI-07 — the Makar Sankranti crossing for 2026 is 2026-01-14
        # 15:07 IST, hours before sunset under either sunrise definition).
        # These three remain hardcoded (not in Doctrine §8's starter rule
        # set) — only their dates were corrected, not their reckoning.
        ("01-13", "Bhogi", "hindu"),
        ("01-15", "Pongal", "tamilnadu_govt"),
        ("01-15", "Mattu Pongal", "hindu"),
        ("01-16", "Thiruvalluvar Day", "tamilnadu_govt"),
        ("01-16", "Kaanum Pongal / Uzhavar Thirunal", "hindu"),
        ("01-17", "Uzhavar Thirunal", "tamilnadu_govt"),
        ("02-01", "Thai Poosam", "tamilnadu_govt"),
        ("04-14", "Tamil New Year (Puthandu) / Ambedkar Jayanti", "tamilnadu_govt"),
        ("09-04", "Krishna Jayanthi", "indian_govt"),
        ("09-04", "Krishna Jayanthi", "tamilnadu_govt"),
        # Vinayagar Chaturthi (WI-12): this gazetted govt-holiday date
        # (09-14) is kept as-is — it's an administrative record, not
        # something to override from a tithi calculation. The "hindu" tag
        # for the same name now comes from the algorithmic engine at 09-15
        # (sunrise-tithi rule; classical practice actually uses the
        # MADHYAHNA/midday-prevailing tithi for this specific festival, a
        # documented simplification — see tests/test_festivals.py). The two
        # tags may render as adjacent-day entries instead of one merged row;
        # that's a real government-date-vs-computed-date difference, not a
        # bug.
        ("09-14", "Vinayagar Chaturthi", "tamilnadu_govt"),
        ("10-19", "Ayudha Pooja", "hindu"),
        ("10-19", "Ayudha Pooja", "tamilnadu_govt"),
        ("10-20", "Vijayadasami", "hindu"),
        ("10-20", "Vijayadasami", "indian_govt"),
        ("10-20", "Vijayadasami", "tamilnadu_govt"),
        ("11-08", "Deepavali", "indian_govt"),
        ("11-08", "Deepavali", "tamilnadu_govt"),
        # Hindu — Ekadashis, Puthandu, Aadi Perukku, Krishna Jayanthi (hindu
        # tag), Vinayagar Chaturthi (hindu tag), Deepavali (hindu tag),
        # Karthigai Deepam now all computed algorithmically (WI-12,
        # Doctrine §8) — see _recurring_tithi_festivals. Parity against this
        # 2026 list verified in tests/test_festivals.py, including 4
        # explained exceptions (2 pre-existing hardcode date errors here
        # corrected by the engine, 1 Smarta-vs-Vaishnava divergence, 1
        # documented tithi-kshaya gap).
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
        ("02-19", "Ramzan Begins", "muslim"),
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

#: Years for which the gazetted/administrative rows above exist (`PAN-17`).
#:
#: Two engines produce festival rows and they do NOT have the same reach. The
#: tithi/nakshatra/solar-month rules below are algorithmic and answer for any
#: year. `_YEARLY_FESTIVALS` is a transcription of government holiday gazettes
#: plus a few dates that are administrative records rather than calculations,
#: and it only covers the years named here. Outside that range the calendar
#: returns the algorithmic set and no gazetted rows — thinner, never wrong.
#:
#: Naming the boundary as a constant is what lets a caller disclose it and lets
#: `tests/test_rulebook_invariants.py` assert the published rulebook still
#: states the truth. Extend this the same commit you extend `_YEARLY_FESTIVALS`.
GAZETTED_FESTIVAL_YEARS: frozenset[int] = frozenset(_YEARLY_FESTIVALS)


def gazetted_coverage_bounds() -> tuple[int, int]:
    """First and last year for which gazetted festival rows exist."""
    return min(GAZETTED_FESTIVAL_YEARS), max(GAZETTED_FESTIVAL_YEARS)


def has_gazetted_coverage(year: int) -> bool:
    """Whether `year` has government/administrative festival rows on file.

    A caller rendering a calendar for a year outside coverage should say so
    rather than let the reader infer that a month genuinely has no festivals.
    """
    return year in GAZETTED_FESTIVAL_YEARS

# ---------------------------------------------------------------------------
# Nakshatra-based festivals (nakshatra name → festival) — every year
# ---------------------------------------------------------------------------
_NAKSHATRA_FESTIVALS: dict[str, str] = {
    "THIRUVONAM": "Thiruvonam Vratam",
    "ROHINI":     "Rohini Vratam",
    # WI-12 (2026-07-16): was "KRITHIGAI", which never matched the canonical
    # nakshatra spelling used everywhere else in this codebase (constants/
    # astrology.py, nakshatra_content.py) — this row silently never fired.
    "KARTHIGAI":  "Karthigai Vratam",
}

# ---------------------------------------------------------------------------
# Tamil solar month indices (matching tamil_calendar.TAMIL_MONTHS ordering:
# 0=Chithirai .. 11=Panguni). Named here so the recurring-festival rules below
# read naturally without importing the full Tamil calendar module.
# ---------------------------------------------------------------------------
_MONTH_CHITHIRAI = 0
_MONTH_VAIKASI = 1
_MONTH_AADI = 3
_MONTH_AAVANI = 4
_MONTH_PURATTASI = 5
_MONTH_AIPPASI = 6
_MONTH_KARTHIGAI = 7
_MONTH_MARGAZHI = 8
_MONTH_THAI = 9
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
    pradhosham_tithi_number: int | None = None,
    nishita_tithi_number: int | None = None,
    tamil_day_of_month: int | None = None,
    previous_day_tithi_number: int | None = None,
    previous_day_tithi_paksha: str | None = None,
) -> list[dict]:
    """Recurring festivals defined by tithi/paksha/weekday/Tamil-month/nakshatra
    combinations rather than fixed Gregorian dates — these recur every lunar
    month (or every year on the matching Tamil-month occurrence) and so must
    be derived from the day's panchangam state, not looked up by date.

    Most observances follow the udaya (sunrise) tithi passed in ``tithi_number``.
    Pradhosam is the exception: it is a twilight/sunset vrata, so it is dated from
    ``pradhosham_tithi_number`` (the tithi at pradhosha-kalam), falling back to the
    sunrise tithi only when that is unavailable (issue #10).

    Sivarathiri is likewise a nishita (midnight) vrata, dated from
    ``nishita_tithi_number`` (the tithi at nishita-kalam), falling back to the
    sunrise tithi only when that is unavailable (M-2).

    ``previous_day_tithi_number``/``previous_day_tithi_paksha`` (WI-12) are the
    prior civil day's own sunrise tithi/paksha — needed only for the Ekadashi
    two-consecutive-sunrise dedup below. Omit them (default None) to skip that
    dedup, which just means an unusually long Ekadashi tithi could be labeled
    on both sunrises it governs, instead of only the first (Smarta rule).
    """
    results: list[dict] = []
    tithi_in_paksha = tithi_number if tithi_number <= 15 else tithi_number - 15
    nk_upper = nakshatra_name.upper()

    # Pradhosam — trayodashi (13th tithi) of either paksha, judged at pradhosha-kalam
    # (sunset). On Saturdays the specific observance name replaces the generic one to
    # avoid duplicate UI rows for the same vrata.
    pradhosham_tithi = pradhosham_tithi_number or tithi_number
    pradhosham_in_paksha = pradhosham_tithi if pradhosham_tithi <= 15 else pradhosham_tithi - 15
    if pradhosham_in_paksha == 13:
        if weekday == _WEEKDAY_SATURDAY:
            results.append({"name": "Sani Pradhosam", "category": "hindu"})
        else:
            results.append({"name": "Pradhosam", "category": "hindu"})

    # Ekadashi (Doctrine §8, WI-12): 11th tithi of either paksha at today's Hindu
    # sunrise (Smarta reckoning). Dashami-viddha rejection needs no extra code
    # under the pure udaya rule: a day whose sunrise tithi is still Dashami (10)
    # is simply not Ekadashi here, regardless of what tithi runs later that day —
    # whatever the NEXT day's own sunrise tithi turns out to be governs that next
    # day, via this same rule applied to it. The one case that DOES need extra
    # state: when Ekadashi is unusually long and governs two sunrises in a row,
    # Smarta takes only the FIRST — so suppress today's label if yesterday's
    # sunrise tithi (same paksha) was already 11.
    if tithi_in_paksha == 11:
        previous_in_paksha = None
        if previous_day_tithi_number is not None:
            previous_in_paksha = (
                previous_day_tithi_number if previous_day_tithi_number <= 15 else previous_day_tithi_number - 15
            )
        already_observed_yesterday = (
            previous_in_paksha == 11 and previous_day_tithi_paksha == tithi_paksha
        )
        if not already_observed_yesterday:
            if tithi_paksha == "SHUKLA" and tamil_month_index == _MONTH_MARGAZHI:
                # The one Puranic name doctrine calls out explicitly; the other
                # 23 Ekadashis/year keep a generic paksha-qualified name below —
                # a full lunar-month-keyed name table is a documented follow-up,
                # not required to close the "silent 2027" regression this WI
                # exists to fix.
                results.append({"name": "Vaikunta Ekadashi", "category": "hindu"})
            else:
                ekadashi_name = "Ekadashi (Shukla)" if tithi_paksha == "SHUKLA" else "Ekadashi (Krishna)"
                results.append({"name": ekadashi_name, "category": "hindu"})

    # Chathurthi (4th tithi). Every Krishna-paksha Chaturthi is Sankatahara
    # Chaturthi (monthly Ganesha vrata) — WI-12 fix: previously only the Tuesday
    # occurrence was labeled at all (ordinary Krishna Chaturthi fell through to
    # the bare "Chathurthi" name); the Tuesday occurrence is additionally the
    # highest-merit "Angarki" variant, not the only occasion that counts.
    if tithi_in_paksha == 4:
        if tithi_paksha == "KRISHNA":
            if weekday == _WEEKDAY_TUESDAY:
                results.append({"name": "Angarki Sankatahara Chaturthi", "category": "hindu"})
            else:
                results.append({"name": "Sankatahara Chaturthi", "category": "hindu"})
        else:
            results.append({"name": "Chathurthi", "category": "hindu"})
            if tamil_month_index == _MONTH_AAVANI:
                results.append({"name": "Vinayagar Chaturthi", "category": "hindu"})

    # Sashti — 6th tithi, Shukla paksha (Skanda Sashti tradition). The Aippasi
    # occurrence is the flagship Skanda Sashti (L-13) — Tamil users search for
    # it by that name, not the generic "Sashti".
    if tithi_in_paksha == 6 and tithi_paksha == "SHUKLA":
        results.append({"name": "Sashti", "category": "hindu"})
        if tamil_month_index == _MONTH_AIPPASI:
            results.append({"name": "Skanda Sashti", "category": "hindu"})

    # Theipirai Ashtami — 8th tithi, Krishna paksha (waning-fortnight Ashtami).
    # Aavani + Krishna Ashtami is additionally Krishna Jayanthi. Simplification
    # (documented, not guessed): doctrine notes a "Rohini preference" tie-break
    # for the rare case where Ashtami spans two Aavani sunrises with only one
    # coinciding with Rohini nakshatra — not implemented; every Aavani Krishna
    # Ashtami is labeled, matching this function's existing udaya-only pattern
    # for every other tithi-anchored observance.
    if tithi_in_paksha == 8 and tithi_paksha == "KRISHNA":
        results.append({"name": "Theipirai Ashtami", "category": "hindu"})
        if tamil_month_index == _MONTH_AAVANI:
            results.append({"name": "Krishna Jayanthi", "category": "hindu"})

    # Sivarathiri — 14th tithi, Krishna paksha, in the Tamil month of Maasi,
    # judged at nishita-kalam (local midnight), not the sunrise tithi (M-2):
    # Krishna Chaturdashi is defined by the tithi prevailing at midnight, and
    # on the true vrata day the sunrise tithi is usually still Trayodashi.
    nishita_tithi = nishita_tithi_number or tithi_number
    nishita_in_paksha = nishita_tithi if nishita_tithi <= 15 else nishita_tithi - 15
    nishita_paksha = "SHUKLA" if nishita_tithi <= 15 else "KRISHNA"
    if (
        nishita_in_paksha == 14
        and nishita_paksha == "KRISHNA"
        and tamil_month_index == _MONTH_MAASI
    ):
        results.append({"name": "Sivarathiri", "category": "hindu"})

    # Deepavali (TN) — Aippasi, Krishna Chaturdashi (Naraka Chaturdashi).
    # Simplification (documented, not guessed): observed classically at the
    # tithi prevailing shortly before dawn specifically (abhyanga snanam),
    # not necessarily the udaya tithi; this function uses the same
    # udaya-only convention as every other tithi rule here rather than
    # modeling a separate pre-dawn instant. Named plain "Deepavali" (not
    # "...Naraka Chaturdashi") so it dedupes by name with the govt-holiday
    # hardcode rows for the same date instead of rendering as two rows.
    if (
        tithi_in_paksha == 14
        and tithi_paksha == "KRISHNA"
        and tamil_month_index == _MONTH_AIPPASI
    ):
        results.append({"name": "Deepavali", "category": "hindu"})

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

    # Karthigai Deepam — nakshatra-anchored (L-14): the classical rule is the
    # Krittika day of the Karthigai month, with full-moon proximity merely
    # descriptive, not a hard requirement. The previous pournami-dominant-day
    # AND-gate silently dropped the festival in kshaya years where Krittika's
    # governing sunrise didn't land on the same civil day as the dominant
    # Pournami tithi. Known, accepted edge case: on the rare month where
    # Krittika's ~day-long span covers two consecutive sunrises, both days
    # label Karthigai Deepam rather than picking one via cross-day state this
    # per-day function doesn't have (same class of simplification as the
    # Ashtami/Rohini tie-break noted above).
    if tamil_month_index == _MONTH_KARTHIGAI and nk_upper == "KARTHIGAI":
        results.append({"name": "Karthigai Deepam", "category": "hindu"})

    if special_tithi_day_number == 30 and tamil_month_index == _MONTH_PURATTASI:
        results.append({"name": "Mahalaya Amavasai", "category": "hindu"})

    # Vaigasi Visakam — Moon in Visakam nakshatra during the Tamil month of Vaikasi.
    if tamil_month_index == _MONTH_VAIKASI and nk_upper == "VISAKAM":
        results.append({"name": "Vaigasi Visakam", "category": "hindu"})

    # Thai Poosam — Thai month, Poosam nakshatra day.
    if tamil_month_index == _MONTH_THAI and nk_upper == "POOSAM":
        results.append({"name": "Thai Poosam", "category": "hindu"})

    # Solar-day yearly festivals (fixed Tamil-month + day-of-month, not
    # tithi-anchored) — need the Tamil calendar day-of-month, not just month.
    if tamil_day_of_month is not None:
        if tamil_month_index == _MONTH_CHITHIRAI and tamil_day_of_month == 1:
            results.append({"name": "Puthandu (Tamil New Year)", "category": "hindu"})
        if tamil_month_index == _MONTH_THAI and tamil_day_of_month == 1:
            results.append({"name": "Thai Pongal", "category": "hindu"})
        if tamil_month_index == _MONTH_AADI and tamil_day_of_month == 18:
            results.append({"name": "Aadi Perukku", "category": "hindu"})

    return results


def get_festivals_for_date(
    d: date,
    tithi_number: int,
    tithi_paksha: str,
    nakshatra_name: str,
    weekday: str | None = None,
    tamil_month_index: int | None = None,
    special_tithi_day_number: int | None = None,
    pradhosham_tithi_number: int | None = None,
    nishita_tithi_number: int | None = None,
    tamil_day_of_month: int | None = None,
    previous_day_tithi_number: int | None = None,
    previous_day_tithi_paksha: str | None = None,
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

    # Curated category-page events. These also feed the signed-in dashboard so
    # public SEO lists and the product calendar show the same named days.
    for event in category_events_for_date(d):
        category = event.tags[0] if event.tags else "observance"
        results.append({"name": event.name_en, "category": category, "tags": list(event.tags)})

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
            pradhosham_tithi_number,
            nishita_tithi_number,
            tamil_day_of_month,
            previous_day_tithi_number,
            previous_day_tithi_paksha,
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
        elif category == "hindu":
            # WI-12 (2026-07-16): a religious-calendar tag is more specific
            # than a govt-holiday tag for the same festival name — prefer it
            # as the primary category regardless of arrival order. Matters
            # now that the algorithmic engine's "hindu" rows are appended
            # after the fixed/yearly govt rows for several dates (Thai
            # Poosam, Krishna Jayanthi, Deepavali) where "hindu" used to be
            # listed first in the removed hardcode.
            existing["category"] = "hindu"
        for tag in tags:
            if tag not in existing["tags"]:
                existing["tags"].append(tag)

    return list(deduped_by_name.values())
