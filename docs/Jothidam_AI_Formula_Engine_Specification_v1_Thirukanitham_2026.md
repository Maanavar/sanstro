# Vinaadi AI Formula Engine Specification v1

**Project:** Vinaadi AI - Tamil Astrology Personal Life Companion  
**Version:** v1.0 - Thirukanitham / Drik Ganita Calculation Manual  
**Prepared for:** 2026 product build  
**Purpose:** Developer-ready formulas, algorithms, scoring rules, data contracts, and QA requirements for the Vinaadi AI engine.

---

## 0. Scope and Non-Negotiable Rules

This document is the engineering companion to the full product specification. The product specification explains what the app does. This file explains how every calculation must be performed.

### 0.1 Calculation philosophy

1. Use **Thirukanitham / Drik Ganita astronomical calculation** for planetary positions, Panchangam, sunrise, and transit timing.
2. Use **Lahiri / Chitra Paksha sidereal ayanamsa** as the single production ayanamsa.
3. Use **whole-sign South Indian Rasi houses** for D1 display and house ownership.
4. Use Bhava/cusp calculations only as a secondary precision layer, never to silently override Rasi ownership.
5. Use **Vimshottari Dasha** as the primary life-timing system.
6. Use Gochar primarily from **Chandra Rasi**, with Lagna as secondary confirmation.
7. Use the triple-confirmation rule for prediction: **Natal promise + Dasha timing + Gochar support**.
8. Use non-fearful delivery. Calculations can detect pressure; wording must still be supportive.
9. Do not claim astrology is scientifically proven. The astronomy is precise; interpretation is Tamil Jyothidam tradition.

### 0.2 System boundaries

| Layer | Production rule |
|---|---|
| Astronomical positions | Swiss Ephemeris or equivalent high-precision ephemeris, Lahiri sidereal mode |
| Rasi houses | Whole-sign houses from Lagna Rasi |
| Bhava chart | Equal-house or Sripathi secondary layer, explicitly labelled |
| KP | Not part of core Thirukanitham engine; optional precision add-on only |
| Vakyam | Not used for core calculations |
| True node | Not default; mean Rahu node is default |
| Remedies | Optional cultural guidance, never mandatory |
| Health | Preventive nudges only; never diagnosis |

### 0.3 Required versioning metadata

Every computed chart must store:

```json
{
  "calculationVersion": "jothidam-formula-engine-v1.0-2026",
  "ephemerisProvider": "SWISS_EPHEMERIS_OR_EQUIVALENT",
  "ephemerisVersion": "<library-version>",
  "ephemerisDataVersion": "<file-date-or-build-hash>",
  "ayanamsa": "LAHIRI_CHITRA_PAKSHA",
  "ayanamsaValueDeg": 0.0,
  "nodeType": "MEAN_NODE",
  "houseSystemPrimary": "WHOLE_SIGN_SOUTH_INDIAN",
  "bhavaSystemSecondary": "EQUAL_HOUSE_OR_SRIPATHI_IF_USED",
  "timezoneIANA": "Asia/Kolkata",
  "birthTimezoneOffsetAtBirth": "+05:30",
  "birthTimeConfidenceMinutes": 0,
  "sourceTier": "Tier1|Tier2|Tier3"
}
```

---

## 1. Global Constants

### 1.1 Rasi numbering

| # | Tamil | English | Lord | Type | Element | Odd/Even |
|---:|---|---|---|---|---|---|
| 1 | Mesham | Aries | Mars | Movable | Fire | Odd |
| 2 | Rishabam | Taurus | Venus | Fixed | Earth | Even |
| 3 | Midhunam | Gemini | Mercury | Dual | Air | Odd |
| 4 | Kadagam | Cancer | Moon | Movable | Water | Even |
| 5 | Simmam | Leo | Sun | Fixed | Fire | Odd |
| 6 | Kanni | Virgo | Mercury | Dual | Earth | Even |
| 7 | Thulaam | Libra | Venus | Movable | Air | Odd |
| 8 | Vrichigam | Scorpio | Mars | Fixed | Water | Even |
| 9 | Dhanusu | Sagittarius | Jupiter | Dual | Fire | Odd |
| 10 | Magaram | Capricorn | Saturn | Movable | Earth | Even |
| 11 | Kumbam | Aquarius | Saturn | Fixed | Air | Odd |
| 12 | Meenam | Pisces | Jupiter | Dual | Water | Even |

### 1.2 Graha list

| Key | Tamil | English | Swiss body |
|---|---|---|---|
| SUN | Surya | Sun | SE_SUN |
| MOON | Chandra | Moon | SE_MOON |
| MARS | Sevvai | Mars | SE_MARS |
| MERCURY | Budha | Mercury | SE_MERCURY |
| JUPITER | Guru | Jupiter | SE_JUPITER |
| VENUS | Sukra | Venus | SE_VENUS |
| SATURN | Sani | Saturn | SE_SATURN |
| RAHU | Rahu | Mean North Node | SE_MEAN_NODE |
| KETU | Ketu | Opposite node | RAHU + 180 degrees |

Sun and Moon are never retrograde. Rahu and Ketu are mean nodes and normally move retrograde, but do not show the regular retrograde badge because their retrograde nature is standard.

### 1.3 Core helper functions

```python
def normalize360(deg):
    return deg % 360

def rasi_from_degree(deg):
    return int((deg % 360) // 30) + 1

def degree_in_rasi(deg):
    return deg % 30

def house_from(reference_rasi, target_rasi):
    # inclusive zodiac count from reference to target
    return ((target_rasi - reference_rasi) % 12) + 1

def rasi_at_house(lagna_rasi, house_number):
    return ((lagna_rasi + house_number - 2) % 12) + 1

def angular_distance(a, b):
    d = abs((a - b) % 360)
    return 360 - d if d > 180 else d
```

### 1.4 Degree constants

```python
NAKSHATRA_SIZE = 360 / 27        # 13.3333333333 degrees = 13 deg 20 min
PADA_SIZE = 360 / 108            # 3.3333333333 degrees = 3 deg 20 min
TITHI_SIZE = 12                  # Moon-Sun elongation per tithi
KARANA_SIZE = 6                  # Half-tithi
YOGA_SIZE = 360 / 27             # Sun+Moon sum divided into 27
```

Use rational arithmetic where possible:

```python
NAKSHATRA_SIZE = 40/3
PADA_SIZE = 10/3
```

---

## 2. Birth Chart Engine - D1 Rasi

### 2.1 Required input

| Field | Requirement |
|---|---|
| birthDateLocal | Gregorian date, YYYY-MM-DD |
| birthTimeLocal | HH:MM:SS, nullable only for non-Lagna features |
| birthPlace | City/district/country text |
| latitude | Decimal degrees north positive |
| longitude | Decimal degrees east positive |
| timezoneIANA | IANA timezone, e.g. Asia/Kolkata |
| timezoneOffsetAtBirth | Offset at birth time, not current offset |
| birthTimeConfidenceMinutes | 0 if exact, 15/30/60 if approximate |

### 2.2 Local time to UTC

```python
birth_dt_local = timezone.localize(date + time)
birth_dt_utc = birth_dt_local.astimezone(UTC)
decimal_hour_utc = hour + minute/60 + second/3600
```

For India after standard IST adoption:

```text
UTC = IST - 05:30
08:15 IST = 02:45 UTC
15:32 IST = 10:02 UTC
```

### 2.3 Julian Day

Use the ephemeris library function:

```python
jd_ut = swe.julday(year_utc, month_utc, day_utc, decimal_hour_utc)
```

Never pass local IST time directly to the ephemeris. That creates a 5.5 hour error.

### 2.4 Sidereal mode

```python
swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
FLAGS = swe.FLG_SIDEREAL | swe.FLG_SPEED
```

### 2.5 Planet calculation

```python
PLANET_IDS = {
  'SUN': swe.SUN,
  'MOON': swe.MOON,
  'MARS': swe.MARS,
  'MERCURY': swe.MERCURY,
  'JUPITER': swe.JUPITER,
  'VENUS': swe.VENUS,
  'SATURN': swe.SATURN,
  'RAHU': swe.MEAN_NODE
}

for graha, planet_id in PLANET_IDS.items():
    result, retflag = swe.calc_ut(jd_ut, planet_id, FLAGS)
    longitude = result[0] % 360
    speed = result[3]

ketu_longitude = (rahu_longitude + 180) % 360
ketu_speed = rahu_speed
```

### 2.6 Lagna calculation

The ascendant degree is location-sensitive and must use the exact latitude/longitude.

```python
cusps, ascmc = swe.houses_ex(jd_ut, latitude, longitude, b'W', swe.FLG_SIDEREAL)
lagna_degree = ascmc[0] % 360
lagna_rasi = rasi_from_degree(lagna_degree)
```

Important: even if the library uses a house system to return cusps, Vinaadi AI uses the ascendant degree only. Production D1 houses are whole-sign:

```python
planet_house = house_from(lagna_rasi, planet_rasi)
```

### 2.7 Nakshatra and Pada

```python
nakshatra_number = int((degree % 360) // (40/3)) + 1
nakshatra_start = (nakshatra_number - 1) * (40/3)
pada = int(((degree % (40/3)) // (10/3))) + 1
```

Boundary rule:

- 0 <= longitude < 360.
- If longitude is exactly on a boundary within floating tolerance, use `floor(epsilon-adjusted)`.
- Recommended epsilon: `1e-9` degrees.

### 2.8 Nakshatra lord sequence

| Nakshatra numbers | Lord | Dasha years |
|---|---|---:|
| 1, 10, 19 | Ketu | 7 |
| 2, 11, 20 | Venus | 20 |
| 3, 12, 21 | Sun | 6 |
| 4, 13, 22 | Moon | 10 |
| 5, 14, 23 | Mars | 7 |
| 6, 15, 24 | Rahu | 18 |
| 7, 16, 25 | Jupiter | 16 |
| 8, 17, 26 | Saturn | 19 |
| 9, 18, 27 | Mercury | 17 |

```python
VIM_SEQUENCE = ['KETU','VENUS','SUN','MOON','MARS','RAHU','JUPITER','SATURN','MERCURY']
NAK_LORD = {n: VIM_SEQUENCE[(n-1) % 9] for n in range(1, 28)}
```

### 2.9 South Indian fixed chart layout

```text
Row 1: Meenam(12) | Mesham(1) | Rishabam(2) | Midhunam(3)
Row 2: Kumbam(11) |            |             | Kadagam(4)
Row 3: Magaram(10)|            |             | Simmam(5)
Row 4: Dhanusu(9) | Vrichigam(8)| Thulaam(7) | Kanni(6)
```

---

## 3. Amsa / Varga Engine

### 3.1 Universal Varga formula

For any equal-division Varga:

```python
degree_in_sign = degree % 30
division_size = 30 / N
division_index = int(degree_in_sign // division_size)  # zero-based
varga_rasi = ((start_rasi + division_index - 1) % 12) + 1
```

Where `start_rasi` is a 1-based rasi number determined by the specific Varga rule.

### 3.2 D9 Navamsa - corrected rule

Each division = 3°20'.

| Natal sign type | Start sign |
|---|---|
| Movable | Same natal sign |
| Fixed | 9th from natal sign |
| Dual | 5th from natal sign |

```python
def d9_start(natal_rasi):
    if natal_rasi in [1,4,7,10]:       # movable
        return natal_rasi
    if natal_rasi in [2,5,8,11]:       # fixed
        return ((natal_rasi + 8 - 1) % 12) + 1
    if natal_rasi in [3,6,9,12]:       # dual
        return ((natal_rasi + 4 - 1) % 12) + 1

def navamsa_rasi(degree):
    natal_rasi = rasi_from_degree(degree)
    index = int((degree % 30) // (10/3))
    return ((d9_start(natal_rasi) + index - 1) % 12) + 1
```

Control checks:

| Position | Rasi | D9 | Result |
|---|---|---|---|
| Uthiradam 3rd Pada | Magaram | Kumbam | Not Vargottama |
| Moolam 1st Pada | Dhanusu | Mesham | Not Vargottama |
| Rishabam 13°30' | Rishabam | Rishabam | Vargottama |

### 3.3 D10 Dashamsa

Each division = 3°.

| Natal sign | Start sign |
|---|---|
| Odd signs | Same natal sign |
| Even signs | 9th from natal sign |

```python
def d10_rasi(degree):
    natal = rasi_from_degree(degree)
    index = int((degree % 30) // 3)
    start = natal if natal in [1,3,5,7,9,11] else ((natal + 8 - 1) % 12) + 1
    return ((start + index - 1) % 12) + 1
```

### 3.4 D7 Saptamsa

Each division = 30/7 = 4°17'08.571".

| Natal sign | Start sign |
|---|---|
| Odd signs | Same natal sign |
| Even signs | 7th from natal sign |

```python
def d7_rasi(degree):
    natal = rasi_from_degree(degree)
    index = int((degree % 30) // (30/7))
    start = natal if natal in [1,3,5,7,9,11] else ((natal + 6 - 1) % 12) + 1
    return ((start + index - 1) % 12) + 1
```

### 3.5 D3 Drekkana

Each division = 10°.

```python
def d3_rasi(degree):
    natal = rasi_from_degree(degree)
    index = int((degree % 30) // 10)
    starts = [natal, ((natal + 4 - 1) % 12) + 1, ((natal + 8 - 1) % 12) + 1]
    return starts[index]
```

### 3.6 D2 Hora

Production mode: Parashari Sun/Moon Hora.

```python
def d2_hora(degree):
    natal = rasi_from_degree(degree)
    first_half = (degree % 30) < 15
    if natal in [1,3,5,7,9,11]:  # odd sign
        return 5 if first_half else 4   # Sun=Leo, Moon=Cancer
    else:
        return 4 if first_half else 5
```

### 3.7 D4 Chaturthamsa

Each division = 7°30'. Start same sign, then 4th, 7th, 10th.

```python
def d4_rasi(degree):
    natal = rasi_from_degree(degree)
    index = int((degree % 30) // 7.5)
    start = ((natal + (index * 3) - 1) % 12) + 1
    return start
```

### 3.8 D12 Dwadasamsa

Each division = 2°30'. Start from same natal sign.

```python
def d12_rasi(degree):
    natal = rasi_from_degree(degree)
    index = int((degree % 30) // 2.5)
    return ((natal + index - 1) % 12) + 1
```

### 3.9 D16 Shodashamsa

Each division = 1°52'30".

| Natal sign type | Start sign |
|---|---|
| Movable | Mesham |
| Fixed | Simmam |
| Dual | Dhanusu |

```python
def d16_rasi(degree):
    natal = rasi_from_degree(degree)
    index = int((degree % 30) // (30/16))
    if natal in [1,4,7,10]: start = 1
    elif natal in [2,5,8,11]: start = 5
    else: start = 9
    return ((start + index - 1) % 12) + 1
```

### 3.10 D20 Vimsamsa

Each division = 1°30'. Use the same modality start pattern used in the product engine unless a senior astrologer changes the tradition table.

| Natal sign type | Start sign |
|---|---|
| Movable | Mesham |
| Fixed | Dhanusu |
| Dual | Simmam |

```python
def d20_rasi(degree):
    natal = rasi_from_degree(degree)
    index = int((degree % 30) // 1.5)
    if natal in [1,4,7,10]: start = 1
    elif natal in [2,5,8,11]: start = 9
    else: start = 5
    return ((start + index - 1) % 12) + 1
```

### 3.11 D24 Chaturvimsamsa

Each division = 1°15'.

| Natal sign type | Start sign |
|---|---|
| Movable | Simmam |
| Fixed | Kadagam |
| Dual | Midhunam |

```python
def d24_rasi(degree):
    natal = rasi_from_degree(degree)
    index = int((degree % 30) // (30/24))
    if natal in [1,4,7,10]: start = 5
    elif natal in [2,5,8,11]: start = 4
    else: start = 3
    return ((start + index - 1) % 12) + 1
```

### 3.12 D30 Trimsamsa

D30 uses unequal divisions.

Odd signs:

| Degree range | Rasi |
|---|---|
| 0-5 | Mesham |
| 5-10 | Kumbam |
| 10-18 | Dhanusu |
| 18-25 | Midhunam |
| 25-30 | Thulaam |

Even signs:

| Degree range | Rasi |
|---|---|
| 0-5 | Rishabam |
| 5-12 | Kanni |
| 12-20 | Meenam |
| 20-25 | Magaram |
| 25-30 | Vrichigam |

```python
def d30_rasi(degree):
    natal = rasi_from_degree(degree)
    x = degree % 30
    if natal in [1,3,5,7,9,11]:
        if x < 5: return 1
        if x < 10: return 11
        if x < 18: return 9
        if x < 25: return 3
        return 7
    else:
        if x < 5: return 2
        if x < 12: return 6
        if x < 20: return 12
        if x < 25: return 10
        return 8
```

### 3.13 D60 Shashtiamsa

Each division = 0°30'. Birth time must be exact; if uncertainty exceeds 2 minutes, mark D60 as unreliable.

```python
def d60_rasi(degree):
    natal = rasi_from_degree(degree)
    index = int((degree % 30) // 0.5)
    if natal in [1,3,5,7,9,11]:
        return ((natal + index - 1) % 12) + 1
    else:
        return ((natal - index - 1) % 12) + 1
```

### 3.14 Vargottama

```python
is_vargottama = (rasi_from_degree(planet_degree) == navamsa_rasi(planet_degree))
```

Never infer Vargottama from Nakshatra lord or sign lord. Always compare D1 sign to D9 sign.

---

## 4. Panchangam Engine

### 4.1 Calculation anchor

For daily Panchangam, compute Sun and Moon positions at **local sunrise** for the user city.

Required daily values:

- Sunrise
- Sunset
- Moonrise / Moonset if shown
- Tithi and end time
- Nakshatra and end time
- Yoga and end time
- Karana and end time
- Vara
- Rahu Kalam
- Yamagandam
- Kuligai / Gulika Kalam
- Abhijit Muhurtham
- Hora day and night
- Chandrashtama
- Tamil month and Tamil date

### 4.2 Sunrise and sunset

```python
jd_utc_0h = swe.julday(year, month, day, 0.0)
# geopos = (longitude, latitude, altitude_meters)
rise_jd = swe.rise_trans(jd_utc_0h, swe.SUN, swe.CALC_RISE, geopos)[1][0]
set_jd  = swe.rise_trans(jd_utc_0h, swe.SUN, swe.CALC_SET, geopos)[1][0]
```

Convert JD to local timezone using robust JD conversion, not `jd % 1` directly.

### 4.3 Tithi

```python
diff = (moon_longitude - sun_longitude) % 360
tithi_number = int(diff // 12) + 1
paksha = 'Shukla' if tithi_number <= 15 else 'Krishna'
```

| Tithi | Meaning |
|---|---|
| 15 | Pournami |
| 30 | Amavasai |
| 4, 9, 14, 19, 24, 29 | Rikta caution tithis |
| 11, 26 | Ekadasi |
| 13, 28 | Pradosham |

Approximate end time:

```python
remaining_deg = 12 - (diff % 12)
relative_speed = moon_speed_deg_day - sun_speed_deg_day
hours_to_end = (remaining_deg / relative_speed) * 24
```

Production rule: approximate end time is allowed for display preview, but final Panchangam must solve exact crossing by bisection or Newton method.

### 4.4 Nakshatra

```python
nakshatra_number = int(moon_longitude // (40/3)) + 1
nakshatra_fraction = (moon_longitude % (40/3)) / (40/3)
remaining_deg = (40/3) - (moon_longitude % (40/3))
hours_to_end = (remaining_deg / moon_speed_deg_day) * 24
```

Final transition time must be root-solved for Moon longitude crossing next multiple of 13°20'.

### 4.5 Yoga

```python
yoga_longitude = (sun_longitude + moon_longitude) % 360
yoga_number = int(yoga_longitude // (40/3)) + 1
```

Caution Yogas:

```python
CAUTION_YOGAS = {1:'Vishkambha', 6:'Atiganda', 9:'Shoola', 10:'Ganda', 17:'Vyatipata', 27:'Vaidhriti'}
```

### 4.6 Karana

```python
karana_index = int(diff // 6)   # 0-59
```

Rules:

- Index 0 = Kimstughna.
- Indexes 1-56 repeat movable sequence: Bava, Balava, Kaulava, Taitila, Garaja, Vanija, Vishti.
- Last three: Shakuni, Chatushpada, Naga.

```python
MOVABLE_KARANAS = ['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti']

def karana_name(i):
    if i == 0: return 'Kimstughna'
    if 1 <= i <= 56: return MOVABLE_KARANAS[(i-1) % 7]
    return {57:'Shakuni',58:'Chatushpada',59:'Naga'}[i]
```

### 4.7 Vara

Use the local civil date's weekday. Do not derive weekday from UTC without timezone adjustment.

| Day | Lord |
|---|---|
| Sunday | Sun |
| Monday | Moon |
| Tuesday | Mars |
| Wednesday | Mercury |
| Thursday | Jupiter |
| Friday | Venus |
| Saturday | Saturn |

### 4.8 Rahu Kalam, Yamagandam, Kuligai

Divide daylight into 8 equal slots:

```python
day_duration = sunset_local - sunrise_local
slot_size = day_duration / 8
slot_start = sunrise + (slot_number - 1) * slot_size
slot_end = slot_start + slot_size
```

| Day | Rahu | Yama | Kuligai |
|---|---:|---:|---:|
| Sunday | 8 | 5 | 7 |
| Monday | 2 | 4 | 6 |
| Tuesday | 7 | 3 | 5 |
| Wednesday | 5 | 2 | 4 |
| Thursday | 6 | 1 | 3 |
| Friday | 4 | 7 | 2 |
| Saturday | 3 | 6 | 1 |

### 4.9 Abhijit Muhurtham

```python
solar_noon = sunrise + (sunset - sunrise) / 2
abhijit_start = solar_noon - 24 minutes
abhijit_end = solar_noon + 24 minutes
```

Rule: flag as restricted on Wednesdays.

### 4.10 Hora

Daytime Hora:

```python
HORA_SEQUENCE = ['SUN','VENUS','MERCURY','MOON','SATURN','JUPITER','MARS']
first_hora = weekday_lord
first_index = HORA_SEQUENCE.index(first_hora)
day_hora_duration = (sunset - sunrise) / 12
hora_lord[n] = HORA_SEQUENCE[(first_index + n) % 7]
```

Night Hora runs from sunset to next sunrise and continues the same sequence.

### 4.11 Chandrashtama

Chandrashtama occurs when the transiting Moon is 8th from natal Moon Rasi.

```python
moon_from_janma = house_from(janma_rasi, current_moon_rasi)
is_chandrashtama = (moon_from_janma == 8)
affected_janma_rasi = ((current_moon_rasi - 8) % 12) + 1
```

Example: Current Moon in Kumbam (11). Affected Janma Rasi = Katakam (4).

### 4.12 Tamil month

Tamil solar month is based on sidereal Sun ingress.

| Sun Rasi | Tamil month |
|---|---|
| Mesham | Chithirai |
| Rishabam | Vaikasi |
| Midhunam | Aani |
| Kadagam | Aadi |
| Simmam | Aavani |
| Kanni | Purattasi |
| Thulaam | Aippasi |
| Vrichigam | Karthigai |
| Dhanusu | Margazhi |
| Magaram | Thai |
| Kumbam | Maasi |
| Meenam | Panguni |

---

## 5. Vimshottari Dasha Engine

### 5.1 Dasha years

```python
DASHA_YEARS = {
 'KETU':7, 'VENUS':20, 'SUN':6, 'MOON':10, 'MARS':7,
 'RAHU':18, 'JUPITER':16, 'SATURN':19, 'MERCURY':17
}
SEQUENCE = ['KETU','VENUS','SUN','MOON','MARS','RAHU','JUPITER','SATURN','MERCURY']
```

### 5.2 Opening Mahadasha

```python
moon_nak = nakshatra_number(moon_degree)
opening_lord = NAK_LORD[moon_nak]
nak_start = (moon_nak - 1) * (40/3)
fraction_elapsed = (moon_degree - nak_start) / (40/3)
balance_years = (1 - fraction_elapsed) * DASHA_YEARS[opening_lord]
```

Use Julian-day arithmetic:

```python
balance_days = balance_years * 365.25
opening_end_jd = birth_jd + balance_days
```

### 5.3 Mahadasha sequence

First period begins at birth and ends after balance. Subsequent Mahadashas use full periods in canonical sequence.

### 5.4 Antardasha

Within each Mahadasha, Antardasha starts with the Mahadasha lord.

```python
antar_years = maha_years * DASHA_YEARS[antar_lord] / 120
```

### 5.5 Pratyantardasha

```python
pratyantar_years = antar_years * DASHA_YEARS[pratyantar_lord] / 120
```

### 5.6 Sookshma and Prana levels

```python
sookshma_years = pratyantar_years * DASHA_YEARS[sookshma_lord] / 120
prana_years = sookshma_years * DASHA_YEARS[prana_lord] / 120
```

Store all boundaries as JD and display date. JD is authoritative.

---

## 6. Gochar / Transit Engine

### 6.1 Transit house from Moon and Lagna

```python
house_from_moon = house_from(janma_rasi, transit_rasi)
house_from_lagna = house_from(lagna_rasi, transit_rasi)
```

Moon is primary for gochar. Lagna confirms material impact.

### 6.2 Jupiter transit result table from Moon

| House from Moon | Result category |
|---:|---|
| 1 | Mixed new phase |
| 2 | Auspicious wealth/family/speech |
| 3 | Mixed effort-based |
| 4 | Mixed home/property pressure |
| 5 | Very auspicious education/children/merit |
| 6 | Mixed problem-solving, health caution |
| 7 | Auspicious marriage/partnership/travel |
| 8 | Ashtama Guru caution |
| 9 | Very auspicious bhagya/guru/dharma |
| 10 | Career responsibility and visibility |
| 11 | Very auspicious gains/network |
| 12 | Expenditure/spiritual/foreign mixed |

### 6.3 Saturn cycles

```python
saturn_from_moon = house_from(janma_rasi, saturn_rasi)
```

| Position from Moon | Cycle |
|---:|---|
| 12 | Ezharai Sani Phase 1 / Viraya Sani |
| 1 | Janma Sani / Ezharai Phase 2 |
| 2 | Ezharai Sani Phase 3 |
| 4 | Ardhashtama Sani |
| 7 | Kantaka Sani from Moon |
| 8 | Ashtama Sani |
| Other | No named Saturn-pressure cycle |

Kandaka from Lagna:

```python
saturn_from_lagna = house_from(lagna_rasi, saturn_rasi)
is_kandaka_lagna = saturn_from_lagna in [1,4,7,10]
```

Correct example:

```text
Saturn in Meenam = 12
Janma Rasi Dhanusu = 9
house_from(9,12) = 4
Result = Ardhashtama Sani, not Janma Sani.
```

### 6.4 Rahu/Ketu transit

```python
rahu_rasi = rasi_from_degree(rahu_degree)
ketu_rasi = rasi_from_degree((rahu_degree + 180) % 360)
rahu_from_moon = house_from(janma_rasi, rahu_rasi)
ketu_from_moon = house_from(janma_rasi, ketu_rasi)
```

Report as an axis, not two isolated planets.

### 6.5 Vedha Vichara

| Planet good house | Vedha house |
|---|---|
| Sun 3 | 9 |
| Sun 6 | 12 |
| Sun 10 | 4 |
| Sun 11 | 5 |
| Moon 1 | 5 |
| Moon 3 | 9 |
| Moon 6 | 12 |
| Moon 7 | 2 |
| Moon 10 | 4 |
| Moon 11 | 8 |
| Jupiter 2 | 12 |
| Jupiter 5 | 4 |
| Jupiter 7 | 3 |
| Jupiter 9 | 10 |
| Jupiter 11 | 8 |
| Saturn 3 | 12 |
| Saturn 6 | 9 |
| Saturn 11 | 5 |

```python
if transiting_planet in good_house and another_planet_occupies_vedha_house:
    reduce_transit_score_by = 30
```

### 6.6 Retrograde

```python
is_retrograde = speed_deg_day < 0
```

Do not set retrograde for Sun/Moon. Do not display normal retrograde badge for Rahu/Ketu.

### 6.7 Combustion

| Planet | Direct orb | Retrograde orb |
|---|---:|---:|
| Mercury | 12° | 14° |
| Venus | 10° | 8° |
| Mars | 17° | 17° |
| Jupiter | 11° | 11° |
| Saturn | 15° | 15° |
| Moon | Partial 12°, full 6° | N/A |

```python
sep = angular_distance(planet_degree, sun_degree)
is_combust = sep <= combust_orb[planet][motion_state]
```

### 6.8 Sandhi

```python
is_rasi_sandhi = degree_in_rasi <= 1 or degree_in_rasi >= 29
```

Reduce delivery score, but do not change rasi.

### 6.9 Gandanta

Gandanta is the last 3°20' of water signs and first 3°20' of fire signs.

| Zone | Degrees |
|---|---|
| Meenam-Mesham | 356°40'-360° and 0°-3°20' |
| Kadagam-Simmam | 116°40'-120° and 120°-123°20' |
| Vrichigam-Dhanusu | 236°40'-240° and 240°-243°20' |

```python
GANDANTA_RANGES = [(356+40/60,360),(0,3+20/60),(116+40/60,123+20/60),(236+40/60,243+20/60)]
```

---

## 7. Graha Balam and Strength Engine

### 7.1 Dignity score

| State | Score |
|---|---:|
| Exaltation | 100 |
| Moolatrikona | 90 |
| Own sign | 80 |
| Great friend | 70 |
| Friend | 60 |
| Neutral | 50 |
| Enemy | 35 |
| Great enemy | 25 |
| Debilitation | 15 |

### 7.2 Exaltation and debilitation

| Planet | Exalted | Deep exalt | Debilitated | Deep debil |
|---|---|---:|---|---:|
| Sun | Mesham | 10° | Thulaam | 10° |
| Moon | Rishabam | 3° | Vrichigam | 3° |
| Mars | Magaram | 28° | Kadagam | 28° |
| Mercury | Kanni | 15° | Meenam | 15° |
| Jupiter | Kadagam | 5° | Magaram | 5° |
| Venus | Meenam | 27° | Kanni | 27° |
| Saturn | Thulaam | 20° | Mesham | 20° |

Rahu/Ketu exaltation is tradition-dependent. Production v1 should not use Rahu/Ketu exaltation as a hard rule; use dispositor strength and conjunction/aspect.

### 7.3 Moolatrikona zones

| Planet | Sign | Zone |
|---|---|---|
| Sun | Simmam | 0°-20° |
| Moon | Rishabam | 4°-30° |
| Mars | Mesham | 0°-12° |
| Mercury | Kanni | 16°-20° |
| Jupiter | Dhanusu | 0°-10° |
| Venus | Thulaam | 0°-15° |
| Saturn | Kumbam | 0°-20° |

### 7.4 Bala Avastha

| Degree in sign | State | Multiplier |
|---|---|---:|
| 0°-6° | Bala | 0.25 |
| 6°-12° | Kumara | 0.50 |
| 12°-18° | Yuva | 1.00 |
| 18°-24° | Vriddha | 0.50 |
| 24°-30° | Mrita | 0.25 |

### 7.5 Functional nature by Lagna

Use the full functional-nature table from the reference as a static lookup. Engine implementation:

```python
functional_nature = FUNCTIONAL_NATURE_TABLE[lagna_rasi][planet]
# returns BENEFIC, MALEFIC, MIXED, MARAKA, YOGAKARAKA, NEUTRAL
```

Critical correction: Saturn for Mesha Lagna is not classic Kendradhipati Dosha. It is 10th + 11th lord, giving career/gain pressure, delayed rewards, responsibility, and ambition.

### 7.6 Approximate strength score for product interpretation

This is not full classical Shadbala. It is the product-level strength score used for ranking.

```python
score = 0
score += dignity_score * 0.35
score += avastha_multiplier * 100 * 0.15
score += house_strength_score * 0.15
score += aspect_support_score * 0.15
score += vargottama_bonus * 0.10
score += shadbala_ratio_score * 0.10  # if full Shadbala available
score -= combustion_penalty
score -= sandhi_penalty
score -= graha_yuddha_penalty
score = clamp(score, 0, 100)
```

---

## 8. Full Shadbala Engine Contract

Full classical Shadbala has six components and should be built as a separate numeric module. The system can launch with product strength score, but if M20 says Shadbala, then this contract must be implemented.

| Bala | Output unit | Required? |
|---|---|---|
| Sthana Bala | Shashtiamsa | Yes |
| Dig Bala | Shashtiamsa | Yes |
| Kala Bala | Shashtiamsa | Yes |
| Chesta Bala | Shashtiamsa | Yes |
| Naisargika Bala | Shashtiamsa | Yes |
| Drik Bala | Shashtiamsa | Yes |

Minimum required Rupas:

| Planet | Required Rupas |
|---|---:|
| Sun | 6.5 |
| Moon | 6.0 |
| Mars | 5.0 |
| Mercury | 7.0 |
| Jupiter | 6.5 |
| Venus | 5.5 |
| Saturn | 5.0 |

```python
rupas = total_shashtiamsa / 60
strength_ratio = rupas / required_rupas[planet]
```

### 8.1 Dig Bala approximation

Peak directions:

| Planet | Peak house |
|---|---:|
| Jupiter, Mercury | 1 |
| Moon, Venus | 4 |
| Saturn | 7 |
| Sun, Mars | 10 |

```python
peak_longitude = cusp_or_house_midpoint[peak_house]
sep = angular_distance(planet_longitude, peak_longitude)
dig_bala_shashtiamsa = max(0, (180 - sep) / 3)  # 0 to 60
```

Use exact cusp longitudes if full Shadbala is implemented.

---

## 9. Ashtakavarga Engine

### 9.1 Bhinnashtakavarga tables

Each planet has one table. For every target house H, count from each reference point R. If H is in that planet's contribution list from R, add 1 bindu.

```python
for planet in BAV_PLANETS:
    for target_rasi in 1..12:
        score = 0
        for ref in ['SUN','MOON','MARS','MERCURY','JUPITER','VENUS','SATURN','LAGNA']:
            house_from_ref = house_from(rasi[ref], target_rasi)
            if house_from_ref in BAV_TABLE[planet][ref]:
                score += 1
        bhinnashtakavarga[planet][target_rasi] = score
```

### 9.2 BAV contribution tables

```python
BAV_TABLE = {
 'SUN': {
   'SUN':[1,2,4,7,8,9,10,11], 'MOON':[3,6,10,11], 'MARS':[1,2,4,7,8,9,10,11],
   'MERCURY':[3,5,6,9,10,11,12], 'JUPITER':[5,6,9,11], 'VENUS':[6,7,12],
   'SATURN':[1,2,4,7,8,9,10,11], 'LAGNA':[3,4,6,10,11,12]},
 'MOON': {
   'SUN':[3,6,7,8,10,11], 'MOON':[1,3,6,7,10,11], 'MARS':[2,3,5,6,9,10,11],
   'MERCURY':[1,3,4,5,7,8,10,11], 'JUPITER':[1,4,7,8,10,11,12],
   'VENUS':[3,4,5,7,9,10,11], 'SATURN':[3,5,6,11], 'LAGNA':[3,6,10,11]},
 'MARS': {
   'SUN':[3,5,6,10,11], 'MOON':[3,6,11], 'MARS':[1,2,4,7,8,10,11],
   'MERCURY':[3,5,6,11], 'JUPITER':[6,10,11,12], 'VENUS':[6,8,11,12],
   'SATURN':[1,4,7,8,9,10,11], 'LAGNA':[1,2,4,7,8,10,11]},
 'MERCURY': {
   'SUN':[5,6,9,11,12], 'MOON':[2,4,6,8,10,11], 'MARS':[1,2,4,7,8,9,10,11],
   'MERCURY':[1,3,5,6,9,10,11,12], 'JUPITER':[6,8,11,12],
   'VENUS':[1,2,3,4,5,8,9,11], 'SATURN':[1,2,4,7,8,9,10,11],
   'LAGNA':[1,2,4,6,8,10,11]},
 'JUPITER': {
   'SUN':[1,2,3,4,7,8,9,10,11], 'MOON':[2,5,7,9,11], 'MARS':[1,2,4,7,8,10,11],
   'MERCURY':[1,2,4,5,6,9,10,11], 'JUPITER':[1,2,3,4,7,8,10,11],
   'VENUS':[2,5,6,9,10,11], 'SATURN':[3,5,6,12], 'LAGNA':[1,2,4,5,6,7,9,10,11]},
 'VENUS': {
   'SUN':[8,11,12], 'MOON':[1,2,3,4,5,8,9,11,12], 'MARS':[3,4,6,9,11,12],
   'MERCURY':[3,5,6,9,11], 'JUPITER':[5,8,9,10,11], 'VENUS':[1,2,3,4,5,8,9,10,11],
   'SATURN':[3,4,5,8,9,10,11], 'LAGNA':[1,2,3,4,5,8,9,11]},
 'SATURN': {
   'SUN':[1,2,4,7,8,10,11], 'MOON':[3,6,11], 'MARS':[3,5,6,10,11,12],
   'MERCURY':[6,8,9,10,11,12], 'JUPITER':[5,6,11,12], 'VENUS':[6,11,12],
   'SATURN':[3,5,6,11], 'LAGNA':[1,3,4,6,10,11]}
}
```

### 9.3 Sarvashtakavarga

```python
for rasi in 1..12:
    sarva[rasi] = sum(bhinnashtakavarga[p][rasi] for p in ['SUN','MOON','MARS','MERCURY','JUPITER','VENUS','SATURN'])
```

Expected total across 12 signs should be treated as a checksum. If using the above 7-planet BAV tables, validate against the configured checksum from test fixtures. Do not silently accept impossible totals.

### 9.4 Transit interpretation

| BAV score | Meaning |
|---:|---|
| 5-8 | Strong/effective transit |
| 4 | workable/normal |
| 3 | mixed |
| 2 | weak |
| 0-1 | caution |

Sarva:

| Score | Meaning |
|---:|---|
| 35+ | exceptional house |
| 30-34 | strong |
| 25-29 | moderate |
| 20-24 | weak |
| <20 | fragile |

### 9.5 Kakshya

Each sign = 30°. Divide into 8 Kakshyas of 3.75°.

```python
KAKSHYA_ORDER = ['SATURN','JUPITER','MARS','SUN','VENUS','MERCURY','MOON','LAGNA']
index = int((degree % 30) // 3.75)
kakshya_lord = KAKSHYA_ORDER[index]
```

If Kakshya lord contributed bindu for the planet's BAV in that sign, mark transit as micro-supported.

---

## 10. Daily 0-100 Rating Engine

### 10.1 Composite score

```python
day_score = (
  moon_nakshatra_score * 0.30 +
  transit_score * 0.25 +
  dasha_score * 0.20 +
  panchangam_score * 0.15 +
  personal_safety_score * 0.10
)
```

### 10.2 Moon Nakshatra score

```python
score = 70
if current_nakshatra == janma_nakshatra: score -= 20
if current_nakshatra == ((janma_nakshatra + 8 - 1) % 27) + 1: score -= 15   # Anujanma
if current_nakshatra == ((janma_nakshatra + 17 - 1) % 27) + 1: score -= 15  # Trijanma
if is_chandrashtama: score -= 25
if current_nakshatra in auspicious_daily_nakshatras: score += 10
score = clamp(score, 0, 100)
```

### 10.3 Transit score

```python
transit_score = 50
for p in ['JUPITER','SATURN','RAHU','KETU','MARS','MOON']:
    h_moon = house_from(janma_rasi, transit_rasi[p])
    base = TRANSIT_BASE_SCORE[p][h_moon]       # 0-100 lookup
    av = bhinnashtakavarga[p][transit_rasi[p]] if p in BAV else 4
    av_multiplier = {0:0.5,1:0.6,2:0.75,3:0.9,4:1.0,5:1.1,6:1.2,7:1.3,8:1.4}[av]
    transit_score += (base - 50) * PLANET_DAILY_WEIGHT[p] * av_multiplier
transit_score = clamp(transit_score,0,100)
```

### 10.4 Dasha score

```python
maha_score = planet_period_score(maha_lord, natal_chart)
antar_score = planet_period_score(antar_lord, natal_chart)
relationship_score = graha_relationship_score(maha_lord, antar_lord)
dasha_score = maha_score * 0.55 + antar_score * 0.35 + relationship_score * 0.10
```

### 10.5 Panchangam score

```python
score = 70
if tithi in [4,9,14,19,24,29]: score -= 15
if tithi in [8,23,30]: score -= 10
if yoga in CAUTION_YOGAS: score -= 10
if karana == 'Vishti': score -= 10
if weekday_lord == lagna_lord: score += 8
if weekday_lord == current_maha_lord: score += 5
score = clamp(score,0,100)
```

### 10.6 Rating label

| Score | Label |
|---:|---|
| 80-100 | Strong support day |
| 65-79 | Good day |
| 50-64 | Balanced day |
| 35-49 | Caution / low-pressure day |
| 0-34 | Restorative day |

Do not use red doom language. Use calm recommendations.

---

## 11. Marriage Timing and Tamil Porutham Engine

### 11.1 Marriage timing score

```python
score = 0
if maha_lord == seventh_lord: score += 35
if antar_lord == seventh_lord: score += 25
if maha_lord == 'VENUS' or antar_lord == 'VENUS': score += 15
if maha_lord == d9_lagna_lord or antar_lord == d9_lagna_lord: score += 15
if jupiter_from_lagna in [1,5,7,9,11]: score += 10
if jupiter_from_moon in [2,5,7,9,11]: score += 10
if saturn_aspects_7th_or_7th_lord: score += 5  # commitment, not denial
if venus_combust_or_7th_lord_weak: score -= 20
score = clamp(score,0,100)
```

### 11.2 Sevvai Dosham / Mangal Dosha

Check Mars from all three references: Lagna, Moon, Venus.

South Indian dosha houses:

```python
DOSHA_HOUSES_SOUTH = [1,2,4,7,8,12]
```

```python
def mangal_from(ref_rasi, mars_rasi):
    return house_from(ref_rasi, mars_rasi) in DOSHA_HOUSES_SOUTH
```

Severity:

| House | Severity |
|---:|---|
| 7, 8 | High |
| 1, 4 | Medium |
| 2, 12 | Mild |

Cancellation / reduction:

- Mars in own sign Mesham/Vrichigam.
- Mars exalted in Magaram.
- Mars aspected by strong Jupiter.
- Both partners have comparable dosha.
- Age above 28 reduces practical severity in many Tamil traditions.
- Strong 7th lord, Venus, and D9 7th can soften outcome.

### 11.3 Tamil 10 Porutham gates

Production should compute all 10, but Rajju and Vedhai are hard gates.

| Porutham | Calculation type | Gate? |
|---|---|---|
| Dinam | Nakshatra count | Soft score |
| Gana | Gana group | Soft score |
| Mahendra | Nakshatra count | Soft score |
| Sthree Deergham | Nakshatra count | Soft score |
| Yoni | Nakshatra yoni table | Soft/important |
| Rasi | Moon Rasi relation | Soft/important |
| Rasi Adhipathi | Lord friendship | Soft score |
| Vasiyam | Vasiya table | Soft score |
| Rajju | Rajju group | Hard gate |
| Vedhai | Vedha pair | Hard gate |

### 11.4 Dinam

```python
count = ((boy_nakshatra - girl_nakshatra) % 27) + 1
DINAM_GOOD = [2,4,6,8,9,11,13,15,18,20,24,26]
dinam_pass = count in DINAM_GOOD
```

### 11.5 Mahendra

```python
MAHENDRA_GOOD = [4,7,10,13,16,19,22,25]
mahendra_pass = count in MAHENDRA_GOOD
```

### 11.6 Sthree Deergham

```python
sthree_deergham_pass = count >= 14
```

### 11.7 Gana

Use lookup groups: Deva, Manushya, Rakshasa.

```python
if girl_gana == boy_gana: score = 1
elif {girl_gana,boy_gana} == {'DEVA','MANUSHYA'}: score = 0.75
elif {girl_gana,boy_gana} == {'DEVA','RAKSHASA'}: score = 0.25
else: score = 0
```

### 11.8 Rajju

Rajju groups:

```python
RAJJU = {
 'PADA':[1,9,10,18,19,27],
 'KATI':[2,8,11,17,20,26],
 'NABHI':[3,7,12,16,21,25],
 'KANTA':[4,6,13,15,22,24],
 'SIRO':[5,14,23]
}
rajju_fail = rajju_group(girl_nak) == rajju_group(boy_nak)
```

### 11.9 Vedhai

```python
VEDHA_PAIRS = [(1,18),(2,16),(3,15),(4,14),(5,13),(6,12),(7,11),(8,10),(9,27),(19,25),(20,24),(21,23),(22,26)]
VEDHA_EXCEPTIONS = [(5,14),(5,23)]
vedha_fail = unordered_pair in VEDHA_PAIRS and unordered_pair not in VEDHA_EXCEPTIONS
```

### 11.10 Nadi add-on

Nadi is not always counted as one of the Tamil 10 Poruthams, but product should calculate it as a critical add-on.

```python
same_nadi = nadi(girl_nak) == nadi(boy_nak)
```

Same Nadi triggers consultation recommendation, not automatic rejection if full charts are strong.

### 11.11 Final compatibility decision

```python
if rajju_fail or vedha_fail:
    verdict = 'Not recommended without senior astrologer review'
elif same_nadi:
    verdict = 'Needs detailed chart review'
elif porutham_pass_count >= 8:
    verdict = 'Strong match'
elif porutham_pass_count >= 6:
    verdict = 'Acceptable with qualifications'
else:
    verdict = 'Weak porutham; full chart review advised'
```

---

## 12. Muhurtham Engine

### 12.1 Candidate generation

```python
for date in requested_range:
    panchangam = compute_panchangam(date, location)
    lagna_windows = generate_lagna_windows(date, location, step_minutes=5)
    for window in lagna_windows:
        evaluate_candidate(date, window)
```

### 12.2 Hard filters

Reject if:

- Event time overlaps Rahu Kalam, Yamagandam, or Kuligai.
- Tithi is Rikta: 4, 9, 14, 19, 24, 29.
- Tithi is Amavasai for non-Pitru events.
- Marriage: reject Ashtami, Navami, Amavasai.
- Karana is Vishti.
- Yoga is Vishkambha, Atiganda, Shoola, Ganda, Vyatipata, Vaidhriti.
- Moon is 8th from event owner’s natal Moon for major events.
- Muhurtha Lagna lord is combust, debilitated, or in 6/8/12 without support.

### 12.3 Lagna by purpose

| Purpose | Preferred Lagna type |
|---|---|
| Marriage | Fixed or stable dual, 7th protected |
| Housewarming | Fixed signs, 4th protected |
| Business launch | Dual or movable, Mercury/Jupiter support |
| Travel | Movable signs |
| Vehicle purchase | Fixed/benefic, Venus/4th strong |
| Surgery | Avoid Moon in 8th/12th, avoid Mars pressure |
| Education start | Mercury/Jupiter strong, auspicious Nakshatra |

### 12.4 Scoring

```python
score = 0
score += tithi_quality * 20
score += nakshatra_quality * 25
score += lagna_quality * 20
score += moon_strength * 10
score += jupiter_venus_support * 10
score += tara_bala * 10
score += dasha_support * 5
score = clamp(score,0,100)
```

Return top 5 candidates with reasons.

### 12.5 Tara Bala

Count from natal Nakshatra to event Nakshatra:

```python
count = ((event_nak - birth_nak) % 27) + 1
tara_index = ((count - 1) % 9) + 1
```

| Tara | Index | Quality |
|---|---:|---|
| Janma | 1 | Sensitive |
| Sampat | 2 | Good |
| Vipat | 3 | Avoid |
| Kshema | 4 | Good |
| Pratyak | 5 | Avoid |
| Sadhana | 6 | Good |
| Naidhana | 7 | Avoid |
| Mitra | 8 | Good |
| Parama Mitra | 9 | Good |

---

## 13. Career and Education Engine

### 13.1 Career indicators

```python
career_planets = [lord_10_from_lagna, lord_10_from_moon, lord_10_from_sun, SUN, SATURN, MERCURY, JUPITER]
```

### 13.2 Career field scoring

```python
field_score[field] = 0
for planet in planets:
    contribution = planet_career_map[planet]
    strength = planet_strength_score[planet] / 100
    if planet_house in [1,5,9,10,11]: multiplier = 1.2
    elif planet_house in [6,8,12]: multiplier = 0.7
    else: multiplier = 1.0
    field_score[field] += contribution * strength * multiplier
```

Planet fields:

| Planet | Strong fields |
|---|---|
| Sun | Government, leadership, medicine, administration |
| Moon | Hospitality, food, nursing, travel, public service |
| Mars | Engineering, surgery, real estate, defense, sports |
| Mercury | IT, business, accounting, writing, analytics |
| Jupiter | Teaching, law, finance, consulting, advisory |
| Venus | Design, arts, luxury, entertainment, hospitality |
| Saturn | Operations, construction, judiciary, long-term service |
| Rahu | Technology, foreign, media, unconventional fields |
| Ketu | Research, spiritual, healing, backend/deep work |

### 13.3 Promotion window

```python
promotion_window = (
    (maha_lord in career_planets or antar_lord in career_planets) and
    (jupiter_from_lagna in [1,5,9,10,11] or jupiter_from_moon in [2,5,7,9,11]) and
    not severe_affliction_to_10th_lord
)
```

---

## 14. Health Tendency Engine

This module must never diagnose. It only issues preventive nudges.

### 14.1 Health tendency score

```python
health_attention_score = 0
health_attention_score += weak_lagna_lord * 20
health_attention_score += active_6th_lord_dasha * 15
health_attention_score += active_8th_lord_dasha * 15
health_attention_score += saturn_rahu_ketu_transit_lagna_or_6_8_12 * 15
health_attention_score += weak_moon_or_sun * 10
health_attention_score += d30_affliction_score * 15
health_attention_score += current_chandrashtama * 10
```

| Score | Output |
|---:|---|
| 0-30 | Normal wellness reminder |
| 31-60 | Preventive attention suggested |
| 61-80 | Strong preventive care nudge |
| 81-100 | Recommend qualified medical checkup if symptoms exist |

### 14.2 Planet-body mapping

| Planet | Traditional body systems |
|---|---|
| Sun | Heart, eyes, spine, vitality |
| Moon | Mind, fluids, chest, sleep |
| Mars | Blood, muscles, inflammation, injury |
| Mercury | Nerves, skin, speech, digestion |
| Jupiter | Liver, fat, growth, sugar tendency |
| Venus | Kidneys, reproductive, face, comforts |
| Saturn | Bones, teeth, joints, chronic weakness |
| Rahu | Unusual/hidden patterns, anxiety, skin |
| Ketu | Sudden, subtle, undiagnosed patterns |

---

## 15. Yoga Detection Engine

Every Yoga output must include:

1. Formation rule.
2. Forming planets.
3. Strength score.
4. Bala Avastha.
5. D9 confirmation.
6. Dasha activation window.
7. Cancellation or weakening factors.

### 15.1 Raja Yoga

```python
for kendra_lord in lords([1,4,7,10]):
  for trikona_lord in lords([1,5,9]):
    if connected(kendra_lord, trikona_lord):
        add_yoga('Raja Yoga', planets=[kendra_lord,trikona_lord])
```

Connection = conjunction, mutual 7th aspect, special aspect, or Parivartana.

### 15.2 Dhana Yoga

```python
if connected(lord_2, lord_11) or connected(lord_5, lord_9) or connected(lord_9, lord_11):
    add_yoga('Dhana Yoga')
```

### 15.3 Pancha Mahapurusha Yogas

Requires planet in own/exalted/Moolatrikona and in Kendra from Lagna.

| Yoga | Planet |
|---|---|
| Ruchaka | Mars |
| Bhadra | Mercury |
| Hamsa | Jupiter |
| Malavya | Venus |
| Sasa | Saturn |

```python
if planet in kendra and dignity in ['OWN','EXALTED','MOOLATRIKONA']:
    add_yoga(...)
```

### 15.4 Gaja Kesari and Kesari

```python
gaja_kesari = house_from(moon_rasi, jupiter_rasi) in [1,4,7,10]
kesari = house_from(lagna_rasi, jupiter_rasi) in [1,4,7,10]
```

Do not promise fame unless Jupiter/Moon strength, D9, Dasha, and affliction checks support it.

### 15.5 Budha Aditya

```python
budha_aditya = mercury_rasi == sun_rasi and not is_combust('MERCURY')
```

If Mercury is combust, label as partial or internalized intellect.

### 15.6 Vipareetha Raja Yoga

```python
dusthana_lords = {lord_6, lord_8, lord_12}
for lord in dusthana_lords:
    if house[lord] in [6,8,12] and house[lord] != own_house_of_lord:
        add_yoga('Vipareetha Raja Yoga')
```

A malefic merely sitting in 6/8/12 is not automatically Vipareetha Raja Yoga.

---

## 16. Family Aggregation Engine

### 16.1 Member daily score

Each member uses the Daily Rating Engine.

### 16.2 Family score

```python
family_score = weighted_average(member_scores, weights)
```

Default weights:

| Member type | Weight |
|---|---:|
| Child under 12 | 1.25 |
| Elder over 65 | 1.25 |
| Event owner | 1.50 |
| Other adult | 1.00 |

### 16.3 Shared Muhurtham

Reject candidate if event owner score < 50. For family events, prefer dates where all core members score >= 50 and average >= 65.

---

## 17. Notification Trigger Engine

### 17.1 Priority levels

| Priority | Examples | Max frequency |
|---|---|---|
| P1 | Dasha change, Sani entry, requested Muhurtham | Immediate or scheduled |
| P2 | Guru/Rahu-Ketu Peyarchi, monthly report | Weekly/monthly |
| P3 | Daily Panchangam, worship reminder | Daily max |
| P4 | Educational content | User preference |

### 17.2 Smart silence

```python
if user_in_heavy_sani_cycle or day_score < 35:
    max_push_per_day = 1
    suppress_low_priority = True
```

### 17.3 Trigger windows

| Event | Trigger |
|---|---|
| Mahadasha change | 90d, 30d, 7d, day-of |
| Antardasha change | 30d, 7d, day-of |
| Sani cycle entry | 90d, 30d, 7d, day-of |
| Guru Peyarchi | 30d, 7d, day-of |
| Rahu/Ketu Peyarchi | 30d, 7d, day-of |
| Chandrashtama | morning of start, optional |
| Monthly report | 1st local day of month |

---

## 18. Interpretation Engine Contract

Every interpretation must follow this structure:

```text
1. Astronomical fact.
2. Traditional Tamil Jyothidam meaning.
3. Personal chart relevance.
4. Practical action.
5. Positive or constructive framing.
```

Forbidden language:

```python
FORBIDDEN = ['doomed','cursed','disaster','bad period','will die','no marriage','no children','guaranteed loss']
```

Replace with:

- sensitive period
- restructuring cycle
- extra care needed
- supportive action
- probability window
- traditional indication

---

## 19. QA Golden Rules

### 19.1 Chart QA

1. Missing UTC conversion must fail tests.
2. Missing sidereal flag must fail tests.
3. True node used instead of mean node must fail tests.
4. D9 Uthiradam 3rd Pada must return Kumbam Navamsa.
5. Meenam must always be Rasi 12, not 9.
6. May 20, 2025 must be Tuesday, not Wednesday.
7. Tuesday Rahu Kalam uses slot 7.
8. D1 houses must be whole-sign from Lagna.

### 19.2 Prediction QA

1. No prediction from Gochar alone.
2. No Yoga without maturity qualifier.
3. No Mangal Dosha without Lagna/Moon/Venus worksheet.
4. No Sani cycle without counting from Moon.
5. No Vargottama without D1-D9 comparison.
6. No health diagnosis.
7. No deterministic marriage/children denial.

---

## 20. Developer Implementation Checklist

- [ ] Ephemeris functions wrapped and versioned.
- [ ] All date-time operations timezone-aware.
- [ ] All degrees normalized to 0-360.
- [ ] D1, D9, D7, D10 test fixtures pass.
- [ ] Panchangam transition times root-solved.
- [ ] Dasha boundaries stored as JD and display date.
- [ ] Ashtakavarga checksum tested.
- [ ] Sani-cycle examples tested.
- [ ] Marriage Porutham hard gates tested.
- [ ] Daily score never outputs fear language.
- [ ] All outputs include calculation version.

---

## 21. Known Tradition-Variant Tables To Freeze Before Coding

The following tables have regional variations. Product must choose one master table, version it, and never silently change it after launch:

1. Yoni animal and yoni-friendship matrix.
2. Vasiya Porutham table.
3. Nakshatra suitability table by Muhurtham purpose.
4. Disha Shoola rules by weekday/direction.
5. Full classical Shadbala sub-component constants if exact Shadbala is launched.
6. D20/D24 advanced Varga start-sign variants if your astrologer council chooses a different school.

Until those tables are frozen, the engine may compute a value only if it labels the table version used.

---

## 22. Final Engineering Principle

The platform must never hide uncertainty. If a value depends on approximate birth time, tradition-variant tables, missing D9, or conflicting supplied data, the engine should display a confidence flag instead of forcing certainty.

**Correct output style:**

> This result is calculated using Lahiri sidereal positions and the Vinaadi AI Formula Engine v1.0. Birth time confidence is +/- 15 minutes, so Lagna-sensitive results should be treated as moderate confidence.

---
