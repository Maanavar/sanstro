# Vinaadi AI Product Specification v7.0 — Full Master Build 2026

| VINAADI AI Tamil Astrology Personal Life Companion Powered by Thirukanitham / Drik Ganita \| Astronomically precise. Tamil-first. Lifelong. |
| --- |

| 20 Modules | Live Data | 0-100 Life Guide | Tamil Astrology |
| --- | --- | --- | --- |

COMPLETE PRODUCT SPECIFICATION  |  Version 7.0  |  FULL MASTER BUILD 2026

Correction Log — v7.0 Full Master Build 2026

This is a full master build based on the original 92-page product specification. Content was preserved; corrections were applied in place instead of compressing the document. Version 7.0 additionally integrates the Formula Engine Specification, QA Golden Test Cases, Coverage Audit, and Developer Implementation Workstreams as formal build appendices.

Major corrections retained from v6: Thirukanitham/Drik Ganita positioning clarified; scientific-proof claims replaced with astronomically precise/tradition-grounded language; whole-sign South Indian chart declared primary; Placidus removed as primary house system; May 20 2025 Panchangam QA corrected to Tuesday; D9/Navamsa formula corrected; Saturn-cycle QA corrected; Gandanta zone corrected to 3°20'; Tamil 10-Porutham clarified; schema metadata expanded; Swiss Ephemeris commercial licensing/versioning noted.

Version 7 additions: complete calculation manual attached; QA cases attached; coverage status attached; developer implementation workstreams added; formula-completion gaps explicitly tracked so developers do not assume unspecified rules.

| PART 1 — VISION & PHILOSOPHY |
| --- |

## 1. Product Vision

| Core Mission Vinaadi AI is a lifelong Tamil astrology companion — not a prediction engine, not a fear tool. It is a calm, knowledgeable personal guide rooted exclusively in Thirukanitham (Thirukanitham / Drik Ganita Tamil Jyothidam) that accompanies every person from birth to old age, giving them timely, relevant, and rational guidance based on the movement of planets and the individual's unique chart. |
| --- |

### 1.1 The Problem We Solve

Tamil astrology is deeply embedded in Tamil culture and daily life — yet today's apps are either fear-mongering, generic, or built on the wrong system (Vedic rather than Thirukanitham). The result: people visit astrologers reactively, when problems arise, rather than having a continuous companion who knows their chart and grows with them through every life stage.

### 1.2 The Thirukanitham Difference

| Why Thirukanitham Only All astronomical calculations in this system follow Thirukanitham / Drik Ganita methodology: modern ephemeris, Lahiri Chitrapaksha ayanamsa, sidereal zodiac, city-specific sunrise, and Tamil Panchangam rules. Interpretations follow Tamil Jyothidam practice, with Parashari, Jaimini, Ashtakavarga, Muhurtha, and Porutham layers clearly labelled. No fear-based, fatalistic, or superstitious overlays. |
| --- |

| Element | Specification | Rationale |
| --- | --- | --- |
| Ayanamsa | Lahiri/Thirukanitham sidereal | Corrects for Earth's precession accurately |
| House System | Whole-sign South Indian chart primary; Bhava Madhya secondary | Traditional Tamil house division |
| Dasha System | Vimshottari with Tamil period lengths | Exact period proportions per Thirukanitham |
| Panchangam | Drik Ganita / Thirukanitham ephemeris-based Panchangam | True Tamil daily almanac |
| Nakshatra System | 27 Nakshatras for Dasha/Panchangam; Abhijit as Muhurtham marker only | Full Tamil Nakshatra catalog |
| Language | Tamil-first, English bilingual | Native expression preserved |

### 1.3 Core Tone Principles (Non-Negotiable)

| The Rule: Tendency + Action + Positive Frame — Always NEVER: 'Saturn is in your 8th house. Bad times ahead.'
ALWAYS: 'Saturn is transiting your 8th house. This is a refinement cycle — traditionally associated with introspection and restructuring. Here is what people navigate well in this window, and what to be mindful of.' |
| --- |

Every negative tendency is paired with a 'what helps' action

Sani periods are framed as refinement cycles, not punishment

Health guidance is preventive, never alarming

No doom language in notifications — ever

Evidence-aware framing: 'traditionally associated with' or 'this period is interpreted as' — not 'will happen'

All remedies are optional practices, not mandatory rituals

| PART 2 — COMPLETE MODULE ARCHITECTURE (20 MODULES) |
| --- |

## Module 1 — Chart Engine (Foundation)

| M1 | Thirukanitham Chart Engine The core calculation engine that powers every other module. All planetary positions, house cusps, and derived data originate here. |
| --- | --- |

### 1.1 Birth Data Input

| Data Field | Input Format | Notes |
| --- | --- | --- |
| Date of Birth | Day / Month / Year | Standard Gregorian input |
| Time of Birth | Hours : Minutes (12/24hr) | Minimum: nearest 15 minutes for basic chart |
| Place of Birth | City / District / Country | Auto-resolved to lat/long/timezone |
| Time Zone | Auto-detected from place | Manual override available |
| Rectification Flag | Was birth time confirmed? | Flags uncertain birth time for user awareness |
| Calendar Type | Gregorian / Tamil calendar | Auto-converts Tamil dates to Gregorian |

### 1.2 Charts Generated

| Chart | Name | Used For | Activation |
| --- | --- | --- | --- |
| Rasi Chart (D1) | Primary birth chart | All life matters | Generated at birth |
| Navamsa (D9) | Soul & marriage chart | Marriage, deep character | Activated at marriage window |
| Dashamsa (D10) | Career chart | Professional life | Activated at career age |
| Saptamsa (D7) | Children chart | Childbirth timing | Activated at parenthood window |
| Drekana (D3) | Sibling & courage | Siblings, bravery | Background reference |
| Shodashamsa (D16) | Vehicle & property | Asset timing | Activated at property age |
| Trimsamsa (D30) | Misfortune & health | Chronic risk periods | Health monitoring |
| Ashtamsa (D8) | Longevity | Elder life guidance | Activated after 60 |

### 1.3 Key Calculated Elements

Lagna (Ascendant) — exact degree and Nakshatra Pada

All 9 Graha positions — Rasi, degree, Nakshatra, Pada, retrograde/combust/debilitated status

Rahu & Ketu — mean node vs true node (Thirukanitham uses mean)

Shadbala (6-factor planetary strength score) for all Grahas

Ashtakavarga — individual planet scores + Sarvashtakavarga total per house

Atmakaraka, Amatyakaraka, and other Karakas per Jaimini extensions

Yogas — all applicable combinations identified and catalogued

Lagna lord, 7th lord, 10th lord, 5th lord — tracked as primary life indicators

Vargottama planets — noted as specially strong

Exaltation / debilitation status for all Grahas

| Ephemeris Engine Swiss Ephemeris with Lahiri/Thirukanitham sidereal mode applied. Use proper Swiss Ephemeris licensing for commercial deployment. Ephemeris files and calculation-version metadata must be versioned. Do not depend on a generic nightly API for core birth-chart calculations. |
| --- |

### 1.4 Birth Chart Calculation Methodology

This section defines the exact, step-by-step calculation pipeline used by the Chart Engine for every birth chart generated. All steps are mandatory. Deviating from any step — particularly the IST→UTC conversion or the Sidereal flag — produces an incorrect chart. This specification is the authoritative reference for all developer implementations and QA validation.

Step 1 — Convert Birth Time to UTC

All planetary calculations must be anchored to UTC. Indian Standard Time (IST) is UTC + 5 hours 30 minutes. Formula: UTC = Birth Time (IST) − 05:30.

Example: 8:15 AM IST = 02:45 UTC

Example: 3:32 PM IST = 10:02 UTC

Critical failure mode: Passing IST directly to the ephemeris library without converting to UTC shifts all planetary degrees by the equivalent of 5.5 hours of planetary motion, producing incorrect Rasi and Nakshatra values.

Step 2 — Compute Julian Day Number (JD)

The Julian Day Number is the universal continuous time reference used by Swiss Ephemeris. It is computed from the UTC date and decimal hour. Swiss Ephemeris function: swe.julday(year, month, day, decimal_hour_UTC). Example: March 15 1993 at 02:45 UTC → JD 2449061.6146.

Step 3 — Apply Lahiri (Thirukanitham) Ayanamsa

Thirukanitham uses Lahiri Chitrapaksha Ayanamsa — the official Indian government standard since 1955 (Calendar Reform Committee, Dr. Meghnad Saha). This offset converts tropical (Western) planetary longitudes to sidereal (Nirayana) longitudes aligned with fixed Nakshatra stars. Swiss Ephemeris constant: swe.SIDM_LAHIRI. Reference values: 1993 → 23.76°, 2025 → 24.22°. This must be set once globally before any planetary calculation in the session.

Step 4 — Calculate Lagna (Ascendant)

The Ascendant (Lagna) is the ecliptic degree rising on the eastern horizon at the exact moment and location of birth. It is the most time-sensitive value in the chart — changing approximately every 2 hours. Swiss Ephemeris function: swe.houses_ex(jd, lat, lon, b‘P’, swe.FLG_SIDEREAL). The ascmc[0] return value is the sidereal Ascendant degree. Precise birth city latitude and longitude are mandatory inputs. Reference coordinates: Chennai 13.0827°N, 80.2707°E — Coimbatore 11.0168°N, 76.9558°E.

Step 5 — Calculate All Nine Graha Positions

Each of the nine Grahas is computed using: swe.calc_ut(jd, planet_id, FLG_SIDEREAL | FLG_SPEED). The FLG_SPEED flag is required to detect retrograde motion: a negative speed value indicates the planet is Vakra (retrograde). Rahu uses swe.MEAN_NODE (not True Node) — Thirukanitham uses the mean lunar node. Ketu is always exactly 180° opposite to Rahu. All output degrees must be taken modulo 360.

Step 6 — Convert Degrees to Rasi

Each 360° circle is divided into 12 equal Rasis of 30° each. Formula: Rasi number = floor(degree ÷ 30) + 1. Degree within Rasi = degree mod 30. The fixed Rasi sequence is:

| No. | Tamil Name | English | No. | Tamil Name | English |
| --- | --- | --- | --- | --- | --- |
| 1 | மேஷம் | Mesha / Aries | 7 | துலாம் | Thulam / Libra |
| 2 | ரிஷபம் | Rishabam / Taurus | 8 | விருச்சிகம் | Viruchigam / Scorpio |
| 3 | மிதுனம் | Midhunam / Gemini | 9 | தனுசு | Dhanus / Sagittarius |
| 4 | கடகம் | Katakam / Cancer | 10 | மகரம் | Makaram / Capricorn |
| 5 | சிம்மம் | Simmam / Leo | 11 | கும்பம் | Kumbam / Aquarius |
| 6 | கன்னி | Kanni / Virgo | 12 | மீனம் | Meenam / Pisces |

Step 7 — Calculate Nakshatra and Padam

The 360° ecliptic is divided into 27 equal Nakshatras of 13.333° (360÷27) each. Each Nakshatra is further divided into 4 equal Padams of 3.333° (360÷108) each. Formulas:

Nakshatra number = floor(degree ÷ 13°20') + 1  (result: 1 to 27)

Padam = floor((degree mod 13°20') ÷ 3°20') + 1  (result: 1 to 4)

The Chandra Rasi is determined directly from the Moon's sidereal longitude; the Moon's Nakshatra is derived from the same longitude. Do not infer Rasi from name alone when degrees are available.

Total unique planetary positions: 27 Nakshatras × 4 Padams = 108 Padams across the zodiac.

Step 8 — Determine Nakshatra Lord for Vimshottari Dasa

The 27 Nakshatras map to 9 Graha lords in a fixed repeating sequence (3 repetitions of 9). The Moon’s Nakshatra lord determines the opening Mahadasha at birth. The repeating sequence is: Ketu → Venus → Sun → Moon → Mars → Rahu → Jupiter → Saturn → Mercury, then repeats. Nakshatra numbers 1, 10, 19 = Ketu; 2, 11, 20 = Venus; 3, 12, 21 = Sun; 4, 13, 22 = Moon; 5, 14, 23 = Mars; 6, 15, 24 = Rahu; 7, 16, 25 = Jupiter; 8, 17, 26 = Saturn; 9, 18, 27 = Mercury.

Step 9 — Calculate Dasa Balance at Birth

The proportion of the Nakshatra already traversed by the Moon determines the remaining balance of the opening Dasa. Formulas:

fraction_elapsed = (moon_deg − nakshatra_start_deg) ÷ 13.333

balance_years = (1 − fraction_elapsed) × dasa_duration_years

Total Vimshottari cycle = 120 years (Ketu 7 + Venus 20 + Sun 6 + Moon 10 + Mars 7 + Rahu 18 + Jupiter 16 + Saturn 19 + Mercury 17).

Step 10 — Assign House Numbers (South Indian Chart)

In the South Indian fixed-grid chart, Rasis are always shown in the same cell positions — planets are placed into their Rasi’s cell. House number is always relative to the Lagna Rasi. Formula: House = ((planet_rasi − lagna_rasi) mod 12) + 1. The South Indian 4×4 grid layout (Rasi fixed positions):

Row 1 (top): Meenam (12) — Mesha (1) — Rishabam (2) — Midhunam (3)

Row 2 (left/right only): Kumbam (11) — [empty] — [empty] — Katakam (4)

Row 3 (left/right only): Makaram (10) — [empty] — [empty] — Simmam (5)

Row 4 (bottom): Dhanus (9) — Viruchigam (8) — Thulam (7) — Kanni (6)

| Critical Failure Modes — QA Checklist for Chart Engine The following errors produce incorrect charts silently — no exceptions are thrown, but planetary degrees and Rasi/Nakshatra values will be wrong: Missing IST→UTC conversion: Passing raw IST to julday() shifts all planetary positions by 5.5 hours of motion. Moon may land in a wrong Rasi or Nakshatra entirely. Missing FLG_SIDEREAL flag: Without this flag, Swiss Ephemeris returns tropical (Western) degrees. All planets appear shifted by ~24° forward — placing most planets in the wrong Rasi. Using True Node instead of Mean Node for Rahu: Thirukanitham uses swe.MEAN_NODE. The true node oscillates and may place Rahu in a different Rasi near Rasi boundaries. Wrong birth city coordinates: Lagna changes every ~2 hours. An imprecise city match can shift the Lagna to a different Rasi. Always resolve to precise lat/long, not district-level approximations. Not applying modulo 360: Swiss Ephemeris can return degrees >360 in some edge cases. Always apply deg = deg % 360 before Rasi and Nakshatra lookups. |
| --- |

| Implementation Reference Library: pyswisseph (Python) or swisseph (Node.js/C). Ephemeris data: Swiss Ephemeris files / JPL ephemeris where licensed. Ayanamsa constant: swe.SIDM_LAHIRI. House system: Whole-sign South Indian chart as primary; use swe.houses_ex only to obtain Ascendant degree and optional Bhava Madhya checks. Rahu node type: swe.MEAN_NODE. All degrees mod 360. Reference city coordinates for Tamil Nadu: Chennai 13.0827°N, 80.2707°E; Coimbatore 11.0168°N, 76.9558°E; Chennai 13.0827°N, 80.2707°E; Madurai 9.9252°N, 78.1198°E. |
| --- |

## Module 2 — Daily Dashboard

| M2 | Today's Personal Lens Every morning, the user opens the app to find everything they need to know about today — personalized to their exact chart. |
| --- | --- |

### 2.1 Daily Dashboard Components

| Element | Content | Source |
| --- | --- | --- |
| Day Rating | Good / Average / Caution — color coded green/yellow/red | Computed from Nakshatra, transit, Dasha interaction |
| Daily Insight | 1 sentence personal insight for the day | E.g. 'Mercury trines your Lagna — communication is sharp today' |
| Rahu Kalam | Exact time window with city-specific sunrise calculation | Updated daily; Tamil tradition — 8 segments of day |
| Guli Kalam | Exact time window | Auspicious-caution window |
| Yamagandam | Exact time window | Caution window for travel/decisions |
| Abhijit Muhurtham | Best 48-minute window of day | Universal auspicious window |
| Best Hour (Hora) | Which planetary hora is active now | Updates hourly; practical use for timing |
| Moon Position | Current Nakshatra + Pada + house from Lagna | Emotional tone indicator |
| Today's Panchangam | Tithi, Vara, Nakshatra, Yoga, Karana — Tamil names | Full Tamil almanac |
| Worship Reminder | Today's relevant Graha worship if applicable | Personalized to chart weaknesses |
| Caution Nudge | 1 specific thing to be mindful of today | Based on current transit + Dasha |
| Active Affliction Banner | If in Sani cycle / Dasha affliction — shown persistently | Supportive framing always |

### 2.2 Day Rating Algorithm

| Factor | Weight | Logic |
| --- | --- | --- |
| Moon Nakshatra quality | 35% | Janma, Anujanma, Trijanma — special weight |
| Transit day quality | 25% | Current Graha over natal sensitive points |
| Active Dasha quality | 20% | Mahadasha + Antardasha combined score |
| Vara (weekday) lord affinity | 10% | Alignment with chart's Lagna lord |
| Tithi quality | 10% | Rikta Tithis (4th, 9th, 14th) flagged |

## Module 3 — Tamil Panchangam Live Engine

| M3 | Live Tamil Panchangam Real-time, location-accurate Tamil Panchangam computed fresh daily for the user's city. The foundation of all daily guidance. |
| --- | --- |

### 3.1 Five Limbs of Panchangam (Ainthangu)

| Limb | Specification |
| --- | --- |
| Tithi | Lunar day (1-30). Rikta Tithis (4,9,14) and Pournami/Amavasai specially flagged. |
| Vara | Weekday with ruling Graha. Each day's worship aligned here. |
| Nakshatra | Moon's Nakshatra changes every ~24 hours. Critical for all daily decisions. |
| Yoga | 27 Yogas computed from Sun + Moon longitude sum. Vishkambha, Atiganda, Vyatipata, Vaidhriti marked as caution. |
| Karana | Half of a Tithi — changes twice daily. Fixed and movable Karanas tracked. |

### 3.2 Extended Panchangam Data

| Data Point | Specification |
| --- | --- |
| Sunrise / Sunset | Exact times computed for user's GPS city, updated daily |
| Moonrise / Moonset | With Nakshatra transition time |
| Rahu Kalam | 1/8th of daytime, weekday-formula, city-specific |
| Guli Kalam | City-specific window |
| Yamagandam | City-specific window |
| Abhijit Muhurtham | 48 mins before/after solar noon — shown with exact times |
| Amrit Kalam | Auspicious sub-windows within Nakshatra |
| Hora (Planetary Hour) | Hourly sequence starting from sunrise — rotates through 7 Grahas |
| Tamil Calendar Date | Tamil month, Paksha, Tamil year (e.g. Vikrama) |
| Uttarayanam / Dakshinayanam | Solar half-year indicator — important for auspicious timing |
| Tamil Masam | Chithirai through Panguni — month-specific cultural alerts |
| Festival / Vrata Days | Pradosham, Ekadasi, Karthigai Deepam, Thai Pongal etc. — personalized relevance shown |

### 3.3 Daily Panchangam Calculation Methodology

This section defines the exact, step-by-step computation pipeline for all daily Panchangam values. Every element — from Tithi to Horai — is derived from precise astronomical data using Swiss Ephemeris with Lahiri Ayanamsa, anchored to the user’s city-specific sunrise. All timings are city-local IST. The method described here is the authoritative reference for engine implementation and QA validation.

Step 1 — City-Specific Sunrise and Sunset (Foundation of All Timings)

Every timed Panchangam element — Rahu Kalam, Yemagandam, Kuligai, Abhijit, Horai — is computed from that city’s actual sunrise. Generic “Tamil Nadu average” timings are incorrect; sunrise varies by up to 20 minutes across the state. Swiss Ephemeris function: swe.rise_trans(jd_search_start_utc, swe.SUN, swe.CALC_RISE, geopos) where geopos = (longitude, latitude, altitude_metres). Use the UTC instant corresponding to local midnight of the user's calendar date as the search start, not a generic UTC midnight for all locations.

JD input: compute the user's local date at 00:00, convert that instant to UTC, then pass that JD as the search start. This prevents sunrise being assigned to the wrong civil date for locations far from UTC.

JD to IST conversion: jd_midnight = floor(jd + 0.5) − 0.5, then hours_utc = (jd − jd_midnight) × 24, then IST = hours_utc + 5.5. Note: do NOT use jd % 1 — this gives hours since noon, not midnight.

Day duration: sunset_ist − sunrise_ist (hours). Example: Coimbatore, May 20 2025 → Sunrise 05:58, Sunset 18:38, Day = 12.67 hrs.

Step 2 — Tithi (Lunar Day)

Tithi is the angular difference between Moon and Sun, divided into 12° units. There are 30 Tithis in a lunar month (15 Shukla + 15 Krishna). Tithi 15 = Pournami (Full Moon); Tithi 30 = Amavasai (New Moon). Rikta Tithis (4th, 9th, 14th) are inauspicious for new ventures.

diff = (moon_deg − sun_deg) mod 360

tithi_number = floor(diff ÷ 12) + 1   (result: 1–30)

Paksha: Tithi 1–15 = Shukla Paksha (Valar Pirai); Tithi 16–30 = Krishna Paksha (Thei Pirai).

Tithi end time: hours_to_end = (12 − (diff mod 12)) ÷ (moon_speed − sun_speed) × 24 where speeds are in degrees/day (Moon ~13.2, Sun ~1.0).

Step 3 — Nakshatra and Padam (Today’s Star)

The daily Nakshatra is determined by the Moon’s sidereal longitude. The Moon transits one Nakshatra approximately every 24 hours. The Nakshatra shown in Panchangam is the one active at the start of the civil day (sunrise), and transition times are shown when the Nakshatra changes mid-day.

nakshatra_number = floor(moon_deg ÷ 13.333) + 1  (1–27)

padam = floor((moon_deg mod 13.333) ÷ 3.333) + 1  (1–4)

Nakshatra end time: hrs = (1 − fraction_elapsed) × 13.333 ÷ moon_speed × 24 from the calculation time.

Special Nakshatras flagged daily: Janma (native’s own birth star), Anujanma (Janma + 9), Trijanma (Janma + 18) — these three are flagged as extra-sensitive days for each user.

Step 4 — Vaaram (Weekday) and Vara Lord

Weekday is derived from the Julian Day Number. Formula: dow = floor(jd + 1.5) mod 7 gives 0=Sunday through 6=Saturday. Vara lords in order: Moon (Mon), Mars (Tue), Mercury (Wed), Jupiter (Thu), Venus (Fri), Saturn (Sat), Sun (Sun). The Vara lord determines both the first Horai of the day and the worship recommendation.

Step 5 — Yoga (Astronomical Combination)

Yoga is computed from the sum of Sun and Moon longitudes. There are 27 Yogas of 13.333° each. Formula: yoga = floor(((sun_deg + moon_deg) mod 360) ÷ 13.333) + 1. Caution Yogas that must be flagged: Vishkambha (#1), Atiganda (#6), Shoola (#9), Ganda (#10), Vyatipata (#17), Vaidhriti (#27). These six are avoided for auspicious activities.

Step 6 — Karana (Half Tithi)

A Karana is half a Tithi (6° of moon–sun separation), so two Karanas occur per Tithi. There are 60 Karanas in a month: 1 fixed at start (Kimstughna), 56 movable (7 names × 8 repetitions), and 3 fixed at end (Shakuni, Chatushpada, Naga). Formula: karana_index = floor(diff ÷ 6) (0–59). Vishti (Bhadra) Karana is inauspicious for travel and new starts. The 7 movable names in order: Bava, Balava, Kaulava, Taitila, Garaja, Vanija, Vishti.

Step 7 — Rahu Kalam, Yemagandam, and Kuligai (Inauspicious Windows)

The daytime is divided into 8 equal slots. Each slot = day_duration ÷ 8 hours. One slot each day is assigned to Rahu Kalam, Yemagandam, and Kuligai — these are inauspicious windows where new activities, travel, and financial decisions are avoided. The slot number (1 = first slot from sunrise) is fixed by weekday:

| Kalam / Day | Sun | Mon | Tue | Wed | Thu | Fri | Sat |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rahu Kalam | Slot 8 | Slot 2 | Slot 7 | Slot 5 | Slot 6 | Slot 4 | 3 |
| Yemagandam | Slot 5 | Slot 4 | Slot 3 | Slot 2 | Slot 1 | Slot 7 | 6 |
| Kuligai | Slot 3 | Slot 1 | Slot 6 | Slot 4 | Slot 7 | Slot 5 | 2 |

Slot timing formula: start = sunrise_ist + (slot_number − 1) × slot_size. Example (Tuesday, Coimbatore): Sunrise 05:58, slot = 95 min → Rahu Kalam slot 7 = 15:28–17:03 IST.

Step 8 — Abhijit Muhurtham (Nalla Neram)

Abhijit is the universal auspicious window that occurs every day regardless of other Panchangam factors — it overrides most inauspicious combinations. It is centred on solar noon (midpoint of sunrise and sunset) and spans 48 minutes total (24 minutes before and after noon).

solar_noon = (sunrise_ist + sunset_ist) ÷ 2

abhijit_start = solar_noon − 0.4 hrs (24 min)   |   abhijit_end = solar_noon + 0.4 hrs

Exception: Abhijit is not recommended on Wednesdays (Budhan’s day) per Tamil tradition. The engine must flag this.

Step 9 — Horai (Planetary Hours)

The daytime is divided into 12 equal Horais. Each Horai is ruled by a planet and is considered favourable for activities aligned with that planet’s domain. The first Horai of each day starts at sunrise and is ruled by the Vara lord (day lord).

Horai duration: day_duration ÷ 12. Example: 12.67 hrs ÷ 12 = 63.4 minutes per Horai.

Fixed Horai sequence (repeating cycle of 7): Sun → Venus → Mercury → Moon → Saturn → Jupiter → Mars, then repeats. Starting position is determined by the Vara lord.

First Horai index: Sun=0 (Sunday), Venus=1 (Friday), Mercury=2 (Wednesday), Moon=3 (Monday), Saturn=4 (Saturday), Jupiter=5 (Thursday), Mars=6 (Tuesday). Horai n lord = sequence[(first_index + n−1) mod 7].

Auspicious Horais: Sun (authority, government), Moon (emotions, travel), Jupiter (knowledge, expansion), Venus (arts, relationships), Mercury (communication, business). Saturn and Mars Horais are noted as active/caution.

Step 10 — Chandrashtama (Moon in 8th House Alert)

Chandrashtama occurs when the transiting Moon is in the 8th Rasi from a person’s natal Moon Rasi (their Janma Rasi). During these approximately 2–3 days per month, people with that Janma Rasi are advised to avoid new ventures, important decisions, and travel. This is one of the most personally relevant daily alerts in the system.

Today’s affected Rasi: chandrashtama_rasi = ((current_moon_rasi − 1 − 7) mod 12) + 1. Example: Moon in Kumbam (11) → affects Katakam (4).

Personalisation: Each user’s Janma Rasi is stored from their birth chart. The daily engine computes current_moon_rasi, checks which stored Janma Rasi is in Chandrashtama, and sends a personalised alert only to those users — not a generic broadcast.

Duration: Moon stays in each Rasi approximately 2.25 days. Track the Moon’s Rasi entry time from rise_trans to show the exact start and end window.

Step 11 — Pournami, Amavasai, and Special Tithi Flags

Certain Tithis carry special significance and must be flagged prominently in the daily dashboard:

Pournami (Full Moon): Tithi #15 (Shukla Paksha 15th). Moon-Sun diff = 168°–180°. Most auspicious day of the lunar month. Trigger full-moon content card and Pradosham variant.

Amavasai (New Moon): Tithi #30 (Krishna Paksha 15th / Amavasya). Moon-Sun diff = 348°–360°. Ancestor worship day (Pitru Tarpan). Trigger Amavasai content card with Kula Deivam reminder.

Ekadasi: Tithi #11 and #26 (11th of each Paksha). Vrata day for Vishnu worship — fasting recommendation triggered for Jupiter/Mercury chart users.

Pradosham: Tithi #13 and #28 (13th of each Paksha). Shiva worship window — flagged especially when Pradosham falls on Monday (Soma Pradosham) or Saturday (Shani Pradosham).

Rikta Tithis (inauspicious): Tithis #4, #9, #14 (and their Krishna counterparts #19, #24, #29). Flag as caution for new ventures.

| Verified Reference Output — May 20 2025, Coimbatore
This output is the corrected QA reference for engine validation. May 20 2025 was Tuesday (Sevvai), not Wednesday. Values are based on city-specific sunrise/sunset and Lahiri sidereal calculations.
1. Sunrise 05:58 IST — Sunset 18:38 IST — Slot size 95 min — Horai about 63 min
2. Vaaram: Tuesday (செவ்வாய்) — Vara Lord: Mars / Sevvai
3. Tithi at sunrise: Ashtami #23 (Krishna Paksha 8th)
4. Nakshatra at sunrise: Dhanishtha / Avittam (#23), Pada 2; Moon enters Kumbam and Avittam Pada 3 at about 07:36 IST
5. Yoga: Indra (#26) — Karana: Balava / Kaulava depending on exact sunrise/end-time convention; engine must compute and display transition times
6. Rahu Kalam: 15:28–17:03 — Yamagandam: 09:08–10:43 — Kuligai: 13:53–15:28
7. Abhijit (Nalla Neram): 11:54–12:42; no Wednesday restriction applies because the date is Tuesday
8. First Horai: Mars 05:58–07:01 — Sun 07:01–08:05 — Venus 08:05–09:08 — Mercury 09:08–10:11 … (12 Horais total)
9. Moon Rasi: Magaram at sunrise; Kumbam after about 07:36 IST. Chandrashtama affects Midhunam until Moon enters Kumbam, then Katakam natives.
QA rule: every hardcoded reference date must be regenerated by automated tests from the same ephemeris engine before release. |
| --- |

## Module 4 — Dasha & Antardasha Engine

| M4 | Vimshottari Dasha Timeline The primary predictive engine. All life events are interpreted through the lens of active Mahadasha and Antardasha periods per Thirukanitham. |
| --- | --- |

### 4.1 Dasha Structure

| Dasha Lord | Duration | Primary Themes |
| --- | --- | --- |
| Ketu Mahadasha | 7 years | Spiritual, detachment, hidden matters |
| Sukra Mahadasha | 20 years | Relationships, arts, luxury, vehicles |
| Surya Mahadasha | 6 years | Career, authority, father, health |
| Chandra Mahadasha | 10 years | Mind, mother, emotions, travel |
| Sevvai Mahadasha | 7 years | Energy, siblings, property, surgery |
| Rahu Mahadasha | 18 years | Ambition, foreign, sudden changes |
| Guru Mahadasha | 16 years | Knowledge, children, wealth, expansion |
| Sani Mahadasha | 19 years | Discipline, delays, service, longevity |
| Budha Mahadasha | 17 years | Communication, business, education |

### 4.2 Dashboard Elements for Active Dasha

Current Mahadasha: Lord, start date, end date, years remaining

Current Antardasha: Lord, start date, end date, months remaining

Current Pratyantardasha: Lord, active window

Dasha lord's strength in natal chart — strong/weak/afflicted

Dasha lord's current transit position — enhancing or weakening

Theme sentence: 'This is a [Guru] Mahadasha in [Ketu] sub-period — expansion meets letting go'

Key positives this period — specific to user's chart

Key cautions this period — framed constructively

Best months within this Antardasha — computed from transits

Historical note: 'Last time this Dasha was active for you...' (if within lifetime)

### 4.3 Dasha Transition Alerts

| Alert Timeline 90 days before: 'Major Dasha change approaching' email + in-app banner
30 days before: Full transition report generated
7 days before: Reminder with preparation guidance
Day of: New Dasha dashboard activated with full new-period report |
| --- |

## Module 5 — Sani Cycle Monitor

| M5 | Saturn Cycle Tracker (7.5 Sani, Ashtama Sani, Kandaka Sani) The most critical life-affliction tracking module. Saturn cycles are the most impactful recurring events in Tamil astrology — monitored with precision and communicated with care. |
| --- | --- |

### 5.1 All Saturn Cycles Tracked

| Cycle Name | Trigger Condition | Primary Effects |
| --- | --- | --- |
| Ezhara Sati (7.5 Sani) — Rising Phase | Saturn in 12th from Moon | ~2.5 years — Letting go, loss of old structures, sleep/foreign |
| Ezhara Sati (7.5 Sani) — Janma Sani (Peak) | Saturn in 1st from Moon | ~2.5 years — Maximum pressure on identity, health, self |
| Ezhara Sati (7.5 Sani) — Setting Phase | Saturn in 2nd from Moon | ~2.5 years — Financial strain, family friction, speech |
| Ashtama Sani | Saturn in 8th from Moon | ~2.5 years — Hidden stress, chronic health, obstacles |
| Ardhashtama Sani | Saturn in 4th from Moon | ~2.5 years — Home, mother, property stress |
| Kandaka Sani | Saturn in 1st, 4th, 7th, 10th from Lagna | Status, career disruption phases |
| Sani Mahadasha | Full 19-year period | Lifetime Saturn themes — separate Dasha module |

### 5.2 Per-Cycle Tracking Features

Entry date — computed precisely from ephemeris

Current day within cycle (e.g. 'Day 412 of ~900')

Phase within the cycle — rising / peak / waning

Monthly tone report during active cycle

Specific body systems to monitor during this cycle (different for each)

Relationship with Dasha lord — is current Dasha compounding or relieving the Sani effect?

3-month advance notice before entry

Exit date with 'emerging from' notification and new-chapter framing

| Sani Framing Rule — Strictly Enforced Saturn is the planet of refinement, discipline, and longevity. Every Sani cycle notification is framed as a period of consolidation and inner growth — never as punishment or misfortune. The app tone shifts to more supportive, reflective language during active Sani cycles. |
| --- |

### 5.3 Sani Peyarchi (Saturn Transit) Events

Occurs every ~2.5 years when Saturn changes Rasi

Full analysis generated for every user's chart on Peyarchi day

Effects on all 12 houses computed and presented in order of significance

Historical comparison: 'Previous Saturn transit through this Rasi was 29 years ago'

Sani Peyarchi report emailed and available as downloadable PDF

## Module 6 — Graha Peyarchi (Transit) Tracker

| M6 | Planetary Transit Engine All major planetary transits tracked and interpreted against the user's natal chart. Jupiter, Saturn, and Rahu/Ketu are the primary transit engines in Tamil astrology. |
| --- | --- |

| Event | Graha | Frequency | Action |
| --- | --- | --- | --- |
| Guru Peyarchi | Jupiter | ~12 months per Rasi | Most auspicious Tamil astrology event — full report on each |
| Sani Peyarchi | Saturn | ~2.5 years per Rasi | Second most important — tracked in Module 5 with extra depth |
| Rahu/Ketu Peyarchi | Nodes | ~18 months per axis | Full axis shift interpretation, karmic themes |
| Sevvai (Mars) Transit | Mars | ~45 days per Rasi | Energy, property, surgical timing |
| Guru (Jupiter) Daily | Jupiter | Daily position | Aspecting natal points — weekly summary |
| Sani (Saturn) Daily | Saturn | Daily position | Aspecting natal points — weekly summary |
| Budha (Mercury) Vakra | Mercury | ~3 weeks retrograde 3x/year | Communication, contracts, tech — caution period |
| Sukra (Venus) Vakra | Venus | ~40 days retrograde every 18 months | Relationships, finance — caution window |
| Graha Yuddha | Any two | Rare — within 1 degree | Planetary war — special alert |
| Graha Asta (Combustion) | Inner planets near Sun | Ongoing | Mercury, Venus within combust degrees — muted effects |
| Graha Moudyami | Mars, Jupiter, Saturn | Seasonal | Slowed effects — noted in forecasts |

### 6.1 Guru Peyarchi — Special Treatment

Guru Peyarchi is the biggest positive event in Tamil astrology calendar

Full personalized report for every user: which house Jupiter enters, what it activates

Effects on marriage, children, finance, career — specific to chart

12-month outlook broken into quarterly windows

Ashtama Guru (Jupiter in 8th from Moon) separately flagged as caution period

Sent as special report via email + in-app feature card

## Module 7 — Live Planetary Position Feed

| M7 | Real-Time Graha Dashboard Live feed of all 9 Graha positions, statuses, and their relationship to the user's natal chart. Updates every hour. |
| --- | --- |

### 7.1 Per-Graha Live Data

| Data Point | What It Shows | Update Rate | Usage |
| --- | --- | --- | --- |
| Current Rasi | Real-time position | Hourly | Shown against natal house |
| Degree & Pada | Exact position | Hourly | Nakshatra Pada tracked |
| Speed & Direction | Direct / Retrograde / Stationary | Daily | Vakra flag shown prominently |
| Combust Status | Within combust degrees of Sun? | Daily | Affects that planet's significations |
| Moudyami Status | Heliacal rise/set status | Weekly | Notes functional weakness |
| House from Lagna | Which house in user's chart | Continuous | Core personalisation |
| House from Moon | Which house from natal Moon | Continuous | Emotional/mind impact |
| Aspect Hits | Is it aspecting natal planet? | Daily | Shows triggered natal points |
| Transit Score | Ashtakavarga score for this position | Daily | Thirukanitham precision metric |

### 7.2 Visual Representation

Simple circular chart showing all planets' current positions

Natal chart overlaid — user can see what's moving where

Highlighted aspects: which natal planets are currently being transited or aspected

Retrograde planets shown with 'R' badge

Combust planets shown with flame icon

Toggle: 'Current Sky' vs 'Your Chart Overlay'

## Module 8 — Worship & Remedial Guidance

| M8 | Personalized Worship & Remedy Calendar Based on chart analysis — weakened planets, current Dasha lord, and active afflictions — the system prescribes personal worship practices, fasting days, and Navagraha temple guidance. Always optional, always rational. |
| --- | --- |

### 8.1 Graha Worship Calendar

| Graha | Day | Deity / Practice | Trigger Condition |
| --- | --- | --- | --- |
| Surya (Sun) | Sunday | Surya Namaskar, Aditya Hridayam, Shiva temple | Weak Sun in chart, Leo Lagna, Surya Dasha |
| Chandra (Moon) | Monday | Shiva, Parvati, Abhishekam with milk | Weak Moon, Cancer Lagna, Chandra Dasha |
| Sevvai (Mars) | Tuesday | Murugan, Hanuman, red flowers | Weak Mars, Aries/Scorpio Lagna, Sevvai Dasha |
| Budha (Mercury) | Wednesday | Vishnu, Ganesh, green offerings | Weak Mercury, Gemini/Virgo Lagna, Budha Dasha |
| Guru (Jupiter) | Thursday | Dakshinamurthy, yellow flowers, turmeric | Weak Jupiter, Sagittarius/Pisces Lagna, Guru Dasha |
| Sukra (Venus) | Friday | Mahalakshmi, Devi, white/pink flowers | Weak Venus, Taurus/Libra Lagna, Sukra Dasha |
| Sani (Saturn) | Saturday | Saniswara, Ayyappan, sesame oil lamp | Weak Saturn, Capricorn/Aquarius Lagna, active Sani cycles |
| Rahu | Sat/Wed | Durga, Kali, dark blue offerings | Rahu Dasha, Rahu afflictions |
| Ketu | Tue/Sat | Ganesha, Bhairava, multi-colored | Ketu Dasha, Ketu in 1st/8th/12th |

### 8.2 Navagraha Temple Guidance

Nine Navagraha temples of Tamil Nadu mapped to the system

User's weakest planet identified → corresponding temple recommended

Temple visit timing: best during that planet's Dasha or adverse transit

If in Sani cycle: Thirunallar Saniswara temple specifically recommended

Direction to face during prayer — based on Lagna (East for Aries/Leo/Sagittarius etc.)

### 8.3 Fasting & Vrata Schedule

| Vrata / Day | Timing | Chart-Based Relevance |
| --- | --- | --- |
| Pradosham | 13th Tithi, twice monthly | Saturn and Moon afflictions — Shiva worship |
| Ekadasi | 11th Tithi, twice monthly | Jupiter Dasha, Vishnu worship |
| Karthigai Deepam | Karthigai Nakshatra, Pournami | Mars/Sun — lamp lighting, Murugan |
| Amavasai | New Moon | Ancestor worship — especially Rahu/Ketu afflictions |
| Pournami | Full Moon | Moon-afflicted charts — positive monthly window |
| Skanda Sasti | 6-day fast, Aippasi month | Murugan — Mars-related afflictions |
| Navarathri | 9-day Devi worship | Venus/Moon afflicted charts |
| Aadi Pooram | Aadi month, Pooram Nakshatra | Devi — female chart-holders especially |

### 8.4 Daily Mantra Suggestions

| How Mantras Are Assigned Mantras are recommended based on Lagna lord and weakest planet in chart. The system explains the logical connection: 'Aditya Hridayam strengthens your Sun, which rules your 5th house of children and creativity.' No blind prescriptions — every recommendation comes with a rational explanation. |
| --- |

Aditya Hridayam — for Sun-related strengthening

Chandra Kavacham — for Moon-related emotional stability

Subramanya Kavasam — for Mars strength and Ketu-related matters

Vishnu Sahasranamam — for Mercury and Jupiter strengthening

Guru Stotram / Dakshinamurthy Ashtakam — Jupiter enhancement

Mahalakshmi Ashtakam — Venus and wealth activation

Sani Stotram / Hanuman Chalisa — Saturn and Rahu pacification

## Module 9 — Life Stage Advisor (Age 0–100)

| M9 | Age-Aware Lifelong Guidance Engine The system knows the user's current age, active Dasha, and upcoming planetary windows. At each life stage, it surfaces the guidance most relevant right now — proactively, without the user asking. |
| --- | --- |

### 9.1 Complete Life Stage Map

| Age Band | Guidance Offered | Astrological Basis | Delivery |
| --- | --- | --- | --- |
| 0–5 | Health tendencies, constitutional type (Prakriti), parental guidance | Strong/weak planets, Moon sign | Alerts to parents |
| 6–11 | Learning style analysis, subject strengths, school selection guidance | Mercury, Jupiter, 4th house | School readiness report |
| 12–16 | Academic stream inclination, talents, peer relationships | 5th house, Moon, Mercury | Stream recommendation |
| 17–22 | Course selection, higher education timing, foreign study indicators | 9th house, Jupiter transit | Course guide report |
| 22–28 | Career entry, job type, first major professional window | 10th house, Sun, Saturn | Career launch report |
| 24–32 | Marriage timing, partner profile, compatibility analysis | 7th house, Venus Dasha | Marriage window alert |
| 28–40 | Career growth, business vs service, property timing | 10th lord Dasha, 4th house | Growth phase guide |
| 30–45 | Childbirth windows, parenting guidance per child's chart | 5th house, Jupiter transit | Parenting alerts |
| 40–55 | Wealth consolidation, health monitoring, leadership phase | Dasha analysis, 8th house | Mid-life report |
| 50–65 | Children's marriage timing, retirement planning, legacy | Transits, 12th house | Transition report |
| 60–75 | Spiritual inclination, pilgrimage timing, elder health | 12th house, Saturn, Ketu | Elder guide report |
| 75–100 | Longevity indicators, calm health management | Ashtamsa D8, Sani | Dignity & wellness guide |

### 9.2 Cross-Referencing Rule

| Age + Dasha = Precision Life stage guidance is never generic. A 28-year-old in Rahu Dasha gets different marriage guidance than a 28-year-old in Jupiter Dasha. The system always intersects the life stage with the active Dasha and current transits to give timed, specific advice — not calendar-age templates. |
| --- |

## Module 10 — Childhood Ritual & Milestone Tracker

| M10 | Life Sacrament Timing Guide Tamil tradition has specific astrological conditions for each childhood sacrament (Samskara). The system alerts parents at the right time with auspicious windows. |
| --- | --- |

| Milestone | Traditional Timing | System Action |
| --- | --- | --- |
| Namakaranam (Naming) | 11th day from birth | Favorable Nakshatra, Lagna — naming window with initial recommendation |
| Annaprashana (First food) | 6th month, favorable Nakshatra | Best date within the month for the ritual |
| Karnavedha (Ear piercing) | Before age 3, auspicious Vara/Nakshatra | Muhurtham window provided to parents |
| Choulam (First haircut) | Before age 3 or 5, Tamil custom timing | Nakshatra + Tithi guidance |
| Vidyarambham (Education start) | Vijayadasami or auspicious day | Best date for the child's chart specifically |
| Upanayanam (Thread ceremony) | Age-specific, Nakshatra-favorable day | Full Muhurtham calculation provided |
| School Enrollment | First day of school — auspicious timing | Favorable Hora + Nakshatra for child's chart |
| Board Exam Periods | Age 15-17 — exam season guidance | Favorable study months per Mercury/Jupiter |
| Driving License / Vehicle | First vehicle — Muhurtham | Shodashamsa D16 activation noted |
| First Job / Career Start | Career entry — auspicious day | Muhurtham + Dasha confirmation |
| Marriage | Age-window + Muhurtham | Full Module 12 activated |
| Griha Pravesh (New home) | Property acquisition — Muhurtham | Nakshatra + Tithi + Vara alignment |
| Childbirth (Seemantham) | Pregnancy ritual timing | 5th house activation noted |

## Module 11 — Marriage Timing & Compatibility Engine

| M11 | Marriage Window & Nakshatra Matching When the user enters the marriage window (identified from chart), the compatibility engine activates. Partner chart analysis, Kuta matching, and Muhurtham calculation — all per Thirukanitham. |
| --- | --- |

### 11.1 Marriage Timing Identification

7th house lord Dasha/Antardasha — primary indicator

Venus Dasha or Antardasha — secondary indicator

Jupiter transiting 7th house or aspecting 7th lord

Navamsa Lagna lord activation

System generates: 'Marriage windows are most favorable in [year ranges]'

### 11.2 Nakshatra Porutham Matching (Tamil 10-Porutham Gates + Optional Numeric Support)

| Kuta | Points | What It Measures |
| --- | --- | --- |
| Dina Kuta | 2 points | Health and longevity compatibility |
| Gana Kuta | 6 points | Temperament match (Deva/Manushya/Rakshasa) |
| Mahendra Kuta | — | Prosperity of couple |
| Stri Dirgha Kuta | — | Wife's longevity and happiness |
| Yoni Kuta | 4 points | Physical and intimate compatibility |
| Rasi Kuta | 7 points | Overall life compatibility |
| Rajju Kuta | Vital — no override | Longevity of marriage — Thirukanitham treats as essential |
| Vedha Kuta | Vital — no override | Affliction check — mutual harm potential |
| Varna Kuta | 1 point | Character and life approach alignment |
| Vasya Kuta | 2 points | Attraction and mutual influence |

| Thirukanitham Matching Philosophy Thirukanitham does not amplify Dosha fears. Manglik (Sevvai Dosham) is assessed rationally — if both partners have it, it neutralizes. The system explains compatibility as 'statistical alignment of life themes' rather than fate or incompatibility. |
| --- |

### 11.3 Recommended Partner Nakshatra Groups

System generates 'Compatible Nakshatra profiles' based on user's birth Nakshatra

Shown as: 'Partners born in Rohini, Mrigashira, or Chitra Nakshatra tend to complement your life themes well — here is why'

When partner's chart is entered: full 10-Kuta analysis with plain English explanation

Composite chart (Navamsa comparison) generated for deeper analysis

### 11.4 Wedding Muhurtham Calculator

User inputs: preferred month/year range

System outputs: top 5 auspicious wedding dates with reasoning

Each date shows: Tithi, Nakshatra, Lagna, Hora — all checked

Avoids: Rikta Tithis, Ashtami, Navami, Rahu Kalam windows, Amavasai

Confirms compatibility of both charts with the proposed date

## Module 12 — Career & Education Advisor

| M12 | Chart-Based Career & Course Guidance The 10th house, its lord, planets therein, and their Dasha periods define career potential. The system activates relevant guidance at the right age and Dasha window. |
| --- | --- |

### 12.1 Career Field Analysis by Chart

| Planetary Indicator | Career Fields Suggested |
| --- | --- |
| Strong Sun (10th/1st) | Government, administration, politics, medicine, leadership roles |
| Strong Moon (10th) | Hospitality, nursing, public dealing, water-related, travel, food |
| Strong Mars (10th) | Engineering, surgery, military, police, sports, real estate |
| Strong Mercury (10th) | IT, accounting, communication, writing, trade, finance, law |
| Strong Jupiter (10th) | Teaching, law, philosophy, banking, advisory, consulting |
| Strong Venus (10th) | Arts, design, fashion, luxury goods, entertainment, hospitality |
| Strong Saturn (10th) | Service sector, blue-collar leadership, mining, construction, judiciary |
| Rahu in 10th | Foreign connections, technology, unconventional careers, media |
| Ketu in 10th | Research, spirituality, alternative medicine, behind-the-scenes roles |

### 12.2 Education Stream Recommendation (Age 15-17)

Science stream: Strong Mars + Mercury, 5th house activated by Jupiter

Commerce/Business: Strong Mercury + Jupiter/Venus, 2nd and 11th house strength

Arts/Humanities: Strong Moon + Venus, 3rd and 5th house prominence

Engineering: Mars dominant, Sun in technical houses

Medicine: Sun dominant, Mars + Jupiter combination

Law: Jupiter + Saturn combination, Mercury strong

Foreign education: 9th and 12th house activation + Rahu placement

### 12.3 Career Timing Windows

Best years to start a business: 10th lord Dasha + Jupiter transit over 10th

Promotion windows: Sun transit + favorable Antardasha

Job change windows: Saturn transit + Rahu activation

Wealth accumulation peak: Dhana Yoga activation Dasha

## Module 13 — Health Tendency Monitor

| M13 | Preventive Health Intelligence Each planet rules specific body systems. The system monitors which planets are under stress (via Dasha, transit, or natal weakness) and surfaces preventive care nudges — never diagnoses, always preventive. |
| --- | --- |

### 13.1 Planetary Health Rulerships

| Planet | Body Systems Ruled |
| --- | --- |
| Surya (Sun) | Heart, eyes, spine, right side of body, vitality, bone density |
| Chandra (Moon) | Mind, blood, lungs, chest, lymphatic system, female hormones |
| Sevvai (Mars) | Blood, muscles, bile, surgery risk, accidents, inflammation |
| Budha (Mercury) | Nervous system, skin, lungs, intestines, thyroid, speech |
| Guru (Jupiter) | Liver, fat, arteries, hip, thighs, diabetes tendency |
| Sukra (Venus) | Kidneys, reproductive system, eyes, face, diabetes (with Jupiter) |
| Sani (Saturn) | Bones, teeth, joints, chronic conditions, nerves, old injuries |
| Rahu | Unusual diseases, hidden conditions, skin, gas, phobias, neurological |
| Ketu | Mysterious/undiagnosed symptoms, viral, spiritual health, wounds |

| Health Nudge Example During your Saturn Antardasha in a Rahu Mahadasha, bone health and dental health deserve attention. This is a statistical tendency based on Saturn's rulerships — not a prediction. Scheduling a dental checkup and calcium screening is practical preventive care for this period. |
| --- |

### 13.2 Health Alert Triggers

Mahadasha lord's body system: monitored throughout the period

8th house lord activation: general vitality caution period

Natal weaknesses: flagged at appropriate life ages

6th house transit stress: acute illness caution windows

Planetary war (Graha Yuddha): short-term caution nudge

Retrograde of health-relevant planet: reassessment period

## Module 14 — Muhurtham Finder

| M14 | Auspicious Timing Calculator For every major life decision, the system finds the best timing window. User specifies the purpose and preferred date range; system returns ranked auspicious windows. |
| --- | --- |

### 14.1 Supported Muhurtham Types

| Purpose | Astrological Criteria Applied |
| --- | --- |
| Marriage (Vivaha) | 7th house strength, Navamsa Lagna, Tara Bala of both charts |
| Griha Pravesh (Housewarming) | 4th house, Uttarayana preferred, Moon in fixed signs |
| Business Launch | 10th house, Mercury/Jupiter strong, Pushya Nakshatra favorable |
| New Job / Career Start | Sun strong, favorable Lagna, avoiding Rahu Kalam |
| Vehicle Purchase | Shodashamsa consideration, avoiding Nakshatra of 8th lord |
| Property Registration | 4th house lord active, stable Tithi and Nakshatra |
| Surgery Scheduling | Avoid Nakshatra of 8th lord, Moon not in 8th/12th |
| Travel (Direction-Based) | Nakshatra favorable for specific direction |
| Child Naming | 11th day, Nakshatra + Lagna for positive chart |
| Education Start / Vidyarambham | Saraswathi Puja day, Mercury strong, Vijayadasami preferred |
| Loan / Borrowing | Avoid 8th house activation, favorable Tithi |
| Legal Filings | Jupiter strong, Mercury unafflicted, Tuesday/Saturday avoid |

### 14.2 Muhurtham Algorithm — Checklist

Tithi: avoid Rikta (4th, 9th, 14th), Amavasai, Ashtami for most purposes

Vara: match purpose to day lord (Thursday for education/finance, Friday for marriage)

Nakshatra: match from Thirukanitham's Nakshatra suitability tables per activity

Lagna: fixed Lagna for marriage, movable for travel, dual for business

Rahu Kalam, Yamagandam, Guli Kalam: avoided in the window

Both charts (if 2-person event): Tara Bala and Chandra Bala verified

Personal Dasha check: is this a favorable period in user's Dasha?

## Module 15 — Ashtakavarga Engine

| M15 | Transit Precision via Ashtakavarga Thirukanitham uses Ashtakavarga scores to determine how effective a planetary transit actually is for a specific individual. A planet transiting a house with score 4+ is beneficial; below 4 is weak. This makes transit predictions personal, not generic. |
| --- | --- |

### 15.1 Ashtakavarga Data Generated

Individual Bhinnashtakavarga for all 8 planets (Sun through Saturn)

Sarvashtakavarga — total score per house (0-56 range)

Transit effectiveness scored: every current transit scored against its Ashtakavarga value

High-score transits highlighted as strong opportunities

Low-score transits flagged as requiring care

Kakshya (sub-divisional) analysis for day-level precision

### 15.2 Integration with Other Modules

Daily Dashboard: transit score shown alongside planet's current position

Muhurtham Finder: Ashtakavarga score verified for proposed Lagna

Dasha Engine: Dasha lord's transit score weights the period quality

## Module 16 — Yoga Identification & Activation Tracker

| M16 | Chart Yoga Catalog & Activation Timeline The natal chart contains combinations (Yogas) that represent latent potential. The system identifies all applicable Yogas, explains them rationally, and tracks when they activate via Dasha. |
| --- | --- |

### 16.1 Categories of Yogas Tracked

| Yoga Type | Condition | Activation Theme |
| --- | --- | --- |
| Raja Yogas | Kendra-Trikona lord conjunction/mutual aspect | Authority, leadership, recognition |
| Dhana Yogas | 2nd/11th lord combinations with Lagna lord | Financial accumulation periods |
| Parivartana Yoga | Two lords in each other's houses | Powerful exchange — mutual activation |
| Neecha Bhanga Yoga | Debilitated planet cancelled by specific conditions | Struggle turned strength |
| Kesari Yoga | Jupiter in Kendra from Moon | Wisdom, fame, public recognition |
| Gaja Kesari Yoga | Jupiter + Moon Kendra relationship | Most celebrated Tamil Yoga |
| Budha Aditya Yoga | Mercury + Sun conjunction | Intellect, communication career |
| Chandra Mangala Yoga | Moon + Mars combination | Business acumen, commercial instinct |
| Hamsa Yoga | Jupiter in Kendra in own/exaltation sign | Spiritual wisdom, teaching |
| Malavya Yoga | Venus in Kendra in own/exaltation | Arts, beauty, luxury |
| Ruchaka Yoga | Mars in Kendra in own/exaltation | Physical strength, leadership |
| Viparita Raja Yoga | 6th/8th/12th lords in mutual houses | Rise through adversity |

| Yoga Activation Rule Yogas are only effective when the Dasha of the Yoga-forming planet is active. The system tracks this precisely: 'Your Gaja Kesari Yoga activates during your Jupiter Mahadasha (2031-2047). Begin preparing for the expansion it brings.' Yogas without Dasha activation are noted as latent potential. |
| --- |

## Module 17 — Family Vault & Aggregated Fortune

| M17 | Family Astrology Dashboard Multiple family members' charts stored in one vault. The family view aggregates favorable and caution windows across all members, helping the family plan together. |
| --- | --- |

### 17.1 Family Vault Features

Add unlimited family members: spouse, children, parents, grandparents

Each member has their own full chart + all modules

Head of family controls sharing permissions

Children's charts managed by parents until age 18

### 17.2 Family Fortune Aggregated View

| Feature | What It Shows | Practical Use |
| --- | --- | --- |
| Family Calendar | Unified view of all members' favorable/caution days | Monthly view with color coding per member |
| Strong Periods | 'Who is in a strong Dasha right now?' — family dashboard | Helps delegate decisions to strongest-period member |
| Caution Periods | 'Who needs family support this month?' — care allocation | Compassionate family planning |
| Shared Muhurtham | Best days for family decisions (travel, investment, rituals) | All members' charts verified simultaneously |
| Cross-Chart Synastry | Relationship dynamics between family members | Parent-child, sibling, spousal themes |
| Generational Patterns | Recurring planetary patterns across generations | Educational — not deterministic |
| Family Festival Calendar | Unified auspicious days for all members combined | Best days when everyone's chart is favorable |

### 17.3 Marriage Matching Within Family Context

When a family member's marriage window opens: family chart compatibility check

Prospective partner chart can be added temporarily for analysis

Family elder's chart consulted for timing alignment

Shared auspicious dates for wedding found across all family members

## Module 18 — Notification & Alert System

| M18 | Intelligent Notification Engine The right information at the right time. Notifications are tiered by urgency, personalized to the chart, and never alarming in tone. |
| --- | --- |

### 18.1 Notification Categories & Timing

| Notification Type | Trigger | Content | Channel |
| --- | --- | --- | --- |
| Morning Panchangam | Daily 6 AM local | Today's almanac + day rating + Rahu Kalam | Push notification |
| Weekly Preview | Sunday 8 AM | Best day this week, upcoming events | Push + email |
| Monthly Report | 1st of month | Full month overview, transits, best dates | Email + in-app |
| Dasha Alert (90 days) | Auto-triggered | Major Dasha transition approaching | Email + push |
| Dasha Alert (7 days) | Auto-triggered | Final preparation reminder | Push |
| Sani Cycle Entry | 3 months before | Full Sani cycle briefing | Email + push |
| Guru Peyarchi | Event-triggered | Jupiter transit report — full personalized | Email + push |
| Rahu/Ketu Peyarchi | Event-triggered | Node axis shift report | Email + push |
| Graha Vakra | Entry into retrograde | Which planet, how it affects chart | Push |
| Combustion Alert | Entry into combust zone | Planet muted — what this means for user | Push |
| Graha Yuddha | Rare event | Planetary war — brief caution note | Push |
| Life Stage Alert | Age milestone | New guidance module activated | Email + in-app |
| Marriage Window Open | Chart-based timing | Compatibility module activated | Email + in-app |
| Health Nudge | Dasha/transit triggered | Preventive care reminder — specific | Push (weekly max) |
| Worship Reminder | Relevant day of week | Today's practice for your chart | Push (if opted in) |
| Muhurtham Alert | User requested | Auspicious window found for purpose | Push + email |
| Festival Significance | Tamil calendar events | Personal relevance of festival for chart | Push |
| Family Member Alert | Any family member event | Important chart event for family member | Push |

| Smart Silence Rule During Ashtama Sani or severe Dasha afflictions, the system automatically reduces notification frequency and adjusts tone to be more supportive and reflective. The user is never bombarded during already-difficult periods. Maximum 1 push notification per day during heavy Sani periods. |
| --- |

## Module 19 — Special Events & Tamil Calendar

| M19 | Tamil Auspicious Days & Personal Significance Engine Tamil calendar events are not generic — the system maps each event to the user's chart and explains personal relevance. |
| --- | --- |

| Event | Timing | Personal Significance Logic |
| --- | --- | --- |
| Thai Pongal | Thai Masam 1 — Sun enters Capricorn (Makara) | Surya transition — personal significance based on Makara house in chart |
| Chithirai Vishu | Sun enters Aries — Tamil New Year | Planetary positions set for the year — annual forecast generated |
| Karthigai Deepam | Karthigai Nakshatra + Pournami | Mars/Murugan strengthening — specific for Mars charts |
| Aadi Pooram | Aadi month + Pooram Nakshatra | Devi — significant for female charts, Venus/Moon emphasis |
| Navarathri | Asvayuja month, 9 nights | Devi worship — Venus + Moon + Mercury charts |
| Vijayadasami | 10th day after Navarathri | Best day for Vidyarambham, career starts |
| Skanda Sasti | 6-day fast, Aippasi month | Murugan — Mars, Ketu in chart |
| Shivarathri | Masi masam, 13th Tithi night | Shiva — Saturn, Moon charts |
| Ekadasi (monthly) | 11th Tithi twice monthly | Vishnu — Jupiter, Mercury charts |
| Pradosham (monthly) | 13th Tithi twice monthly | Shiva — Saturn, Moon — most widely observed |
| Amavasai (monthly) | New Moon | Ancestor worship — Rahu/Ketu, 8th/12th house emphasis |
| Pournami (monthly) | Full Moon | Positive window — Moon charts specifically |
| Tamil Masam Start | Each new Tamil month | Graha position changes in Tamil month — monthly briefing |

## Module 20 — Shadbala Planetary Strength Engine

| M20 | Six-Factor Planetary Strength Analysis Shadbala provides a precise numerical strength for each planet in the chart. It drives worship recommendations, Yoga activation likelihood, and Dasha effectiveness scores. |
| --- | --- |

### 20.1 Six Strength Factors

| Factor | What It Measures | Key Logic |
| --- | --- | --- |
| Sthana Bala | Positional strength | Own sign, exaltation, friendly sign |
| Dig Bala | Directional strength | Jupiter/Mercury strong in East/Lagna; Saturn in West/7th |
| Kala Bala | Temporal strength | Day/night planets, seasonal strengths |
| Cheshta Bala | Motional strength | Direct, slow, retrograde — retrograde increases Cheshta Bala |
| Naisargika Bala | Natural strength | Intrinsic hierarchy: Saturn weakest, Sun strongest naturally |
| Drik Bala | Aspectual strength | Benefic/malefic aspects received by the planet |

### 20.2 Shadbala Usage in the System

Strong planets (above Rupas threshold) drive positive Dasha interpretations

Weak planets below threshold: worship recommendation triggered for that planet

Yoga effectiveness weighted by Shadbala of Yoga-forming planets

Transit effectiveness: Shadbala + Ashtakavarga combined for precision

Health monitoring: weak planet's body systems get preventive care nudges

| PART 3 — TECHNICAL ARCHITECTURE |
| --- |

## Technical Architecture Overview

### Backend Stack

| Component | Technology | Specification |
| --- | --- | --- |
| Ephemeris Engine | Swiss Ephemeris (libswe) | Highest accuracy sidereal planetary positions; Thirukanitham Ayanamsa applied |
| Ayanamsa | Lahiri / Thirukanitham | Coded as constant offset; user cannot override |
| Dasha Calculator | Custom Vimshottari engine | Tamil period lengths; Nakshatra-based start calculation |
| Panchangam Engine | Drik Ganita / Thirukanitham ephemeris base | With Thirukanitham corrections; city-specific sunrise |
| Location Service | Google Maps API / OpenStreetMap | lat/long/timezone resolution for all cities worldwide |
| Push Notifications | Firebase Cloud Messaging | Scheduled + event-triggered notification delivery |
| Email Engine | SendGrid / Mailgun | Transactional + scheduled report delivery |
| Database | PostgreSQL (charts, users, family) | Encrypted at rest; AES-256 for birth data |
| Cache Layer | Redis | Daily Panchangam and planetary positions cached |
| API Framework | Node.js / Python FastAPI | REST API for all chart calculations |
| Chart Rendering | SVG-based custom renderer | Thirukanitham South Indian square chart style |

### Frontend Stack

| Layer | Technology | Specification |
| --- | --- | --- |
| Framework | React + Next.js | SSR for SEO + fast initial load |
| Mobile | React Native | iOS + Android from shared codebase |
| PWA | Progressive Web App | Offline access for cached daily data |
| Chart Visualization | Custom SVG / D3.js | South Indian square chart + planetary orbit view |
| Design System | Tamil-first typography | Tamil Murasu / Latha fonts; English bilingual |
| Theme | Warm amber + deep navy | Personal blog aesthetic — not a dashboard |
| Language Toggle | Tamil / English | Full bilingual — all content in both languages |
| Offline Mode | Service Worker cache | Today's Panchangam and active Dasha available offline |

### Data Architecture & Privacy

| Privacy-First Design Birth data is the most sensitive data we hold. All birth details encrypted at rest using AES-256. Family vault is role-access controlled. No data sold or shared. Optional local-only mode for privacy-maximum users where chart calculations happen on device. |
| --- |

| Data Type | Protection Method | Specification |
| --- | --- | --- |
| Birth Data | AES-256 encrypted at rest | Only decrypted for calculation; not stored in plain |
| Family Vault | Role-based access control | Head of family sets permissions per member |
| Notification Preferences | User-controlled, granular | Every notification type independently toggleable |
| Data Portability | Full chart export as PDF/JSON | User can export all their data at any time |
| Right to Delete | Complete account + data deletion | All family charts deleted on request |
| No Profiling | No behavioral data sold | Anthropic-level data ethics standard |
| Local Mode | On-device calculation option | No server-side storage for privacy users |

| PART 4 — DATA SCHEMA |
| --- |

## Core Data Schema

### User Profile Schema

| UserProfile {
  userId: UUID
  name: String
  email: String (encrypted)
  language: 'tamil' \| 'english'
  timezone: String
  city: String
  lat: Float, lng: Float
  createdAt: Timestamp
  subscriptionTier: 'free' \| 'personal' \| 'family'
  notificationPreferences: NotificationConfig
  privacyMode: 'cloud' \| 'local'
} |
| --- |

### Chart Schema

2026 Calculation Metadata Required: Store birthDateTimeLocal, birthDateTimeUTC, birthTimezoneIANA, birthTimezoneOffsetAtBirth, birthTimeSource, birthTimeConfidenceMinutes, ayanamsaType, ayanamsaValue, ephemerisProvider, ephemerisVersion, calculationVersion, chartSourceTier, and all planetary absoluteLongitude + degreeInRasi + speedDegPerDay. This prevents silent recalculation drift across app versions.

| AstrologyChart {
  chartId: UUID
  userId: UUID
  familyMemberId: UUID \| null
  
  // Birth Data
  birthDate: Date
  birthTime: Time (nullable — flag if unknown)
  birthPlace: String
  birthLat: Float, birthLng: Float
  birthTimezone: String
  birthTimeConfirmed: Boolean
  
  // Computed — stored for performance
  lagna: { rasi: RasiEnum, degree: Float, nakshatra: NakshatraEnum, pada: Int }
  planets: Planet[9] {
    graha: GrahaEnum
    rasi: RasiEnum, degree: Float
    nakshatra: NakshatraEnum, pada: Int
    house: Int (1-12)
    isRetrograde: Boolean, isCombust: Boolean, isDebilitated: Boolean
    shabdala: Float (Rupas)
  }
  ashtakavarga: { [graha]: Int[12], sarvashtakavarga: Int[12] }
  dashaStart: { graha: GrahaEnum, date: Date }
  yogas: Yoga[] { name, planets, activationDasha, strength }
  
  lastCalculated: Timestamp
  ayanamsa: Float (stored at time of calculation)
} |
| --- |

### Dasha Schema

| DashaTimeline {
  chartId: UUID
  mahadashas: MahaDasha[] {
    graha: GrahaEnum
    startDate: Date, endDate: Date
    antardashas: AntarDasha[] {
      graha: GrahaEnum
      startDate: Date, endDate: Date
      pratyantardashas: Pratyantardasha[]
    }
  }
  currentMaha: GrahaEnum
  currentAntar: GrahaEnum
  currentPratyanta: GrahaEnum
  nextMahaTransition: Date
  nextAntarTransition: Date
} |
| --- |

### Sani Cycle Schema

| SaniCycle {
  chartId: UUID
  cycles: SaniCycleEntry[] {
    type: 'EZHARA_SATI_RISING' \| 'JANMA_SANI' \| 'EZHARA_SATI_SETTING' 
          \| 'ASHTAMA_SANI' \| 'ARDHASHTAMA_SANI' \| 'KANDAKA_SANI'
    startDate: Date
    endDate: Date
    peakDate: Date
    isActive: Boolean
    dayCount: Int (current day within cycle)
    totalDays: Int
    notificationsSent: NotificationLog[]
  }
  nextCycleEntry: { type, startDate, daysUntil }
} |
| --- |

| PART 5 — PRODUCT ROADMAP & MONETIZATION |
| --- |

## Development Roadmap

### Phase 1 — Foundation (Months 1–4)

| MVP Target: Chart Engine + Daily Dashboard + Dasha Tracker |
| --- |

Chart Engine: Swiss Ephemeris integration with Thirukanitham Ayanamsa

Birth data input + Rasi chart generation (South Indian format)

Daily Panchangam live engine (city-specific)

Daily Dashboard: Day rating, Rahu Kalam, Nakshatra, basic personal insight

Dasha/Antardasha timeline with basic interpretation

User registration + basic profile

Push notifications: morning Panchangam

Tamil + English language support

### Phase 2 — Intelligence (Months 5–8)

| Target: Sani Cycles + Worship + Health + Marriage Engine |
| --- |

All Saturn cycle detection: 7.5 Sani, Ashtama Sani, Kandaka Sani

Guru Peyarchi and all major transit tracking

Worship & remedial guidance module (personalized per chart)

Life stage advisor — age-aware guidance activation

Marriage timing and Nakshatra compatibility engine

Muhurtham finder (all major purposes)

Ashtakavarga engine integration

Health tendency monitor with preventive nudges

### Phase 3 — Family (Months 9–12)

| Target: Family Vault + Full Notification System + Mobile App |
| --- |

Family vault with multi-member chart storage

Family aggregated fortune dashboard

Cross-chart synastry analysis

Complete notification system (all 18 notification types)

React Native mobile app (iOS + Android)

Yoga catalog + activation tracking

Shadbala engine

Festival & Tamil calendar integration

### Phase 4 — Refinement (Months 13–18)

| Target: Precision + Varga Charts + AI-Enhanced Interpretations |
| --- |

Varga charts: Navamsa, Dashamsa, Saptamsa with life-stage activation

Childhood milestone ritual tracker with parent alerts

Pratyantardasha level tracking

Ashtamsa (D8) — elder life module

Interpretation layer refinement with Tamil astrologer collaboration

PDF report generation for all major events

Offline-first PWA with full service worker implementation

Local-only privacy mode

## Monetization Model

| Tier | Includes | Strategy |
| --- | --- | --- |
| Free Tier | Rasi chart + Today's Panchangam + Basic day rating + Single user | Acquisition — permanent free tier |
| Personal (₹499/month) | All 20 modules + Full Dasha + All Sani cycles + Worship guide + Muhurtham | Core revenue tier |
| Family (₹899/month) | All Personal features + Up to 6 family members + Family fortune dashboard | Retention-focused tier |
| Annual Discount | 2 months free on annual subscription | Reduces churn |
| One-time Reports | Marriage compatibility report ₹299 + Wedding Muhurtham report ₹499 | Event-triggered upsell |
| Expert Consultation | Refer to partner Tamil astrologers for live sessions | Commission-based revenue |

| PART 6 — COMPETITIVE DIFFERENTIATION |
| --- |

## What Makes This Different

| Feature | Typical Apps | Vinaadi AI |
| --- | --- | --- |
| Astrology System | Mixed / Generic Vedic | Thirukanitham-only — no mixing |
| Tone & Philosophy | Fear-based, fatalistic | Astronomically precise, supportive, preventive |
| Language | Hindi-first or English-only | Tamil-first, full bilingual |
| Life Coverage | One-time chart reading | 0-100 continuous companion |
| Family View | Individual only | Aggregated family fortune |
| Saturn Cycles | Basic mention | All 6 types tracked with daily support |
| Worship Guidance | Generic suggestions | Chart-personalized, day-specific |
| Muhurtham | Generic good days | Purpose-specific, chart-verified |
| Ashtakavarga | Rarely used | Core precision engine |
| Panchangam | Generic Tamil Nadu average | City-specific sunrise calculations |
| Notifications | Generic daily horoscope | Intelligent, event-triggered, chart-specific |
| Health | Not addressed | Preventive, planet-system mapped |

| The Core Unfair Advantage No other product combines: (1) strict Thirukanitham-only calculations, (2) Tamil-first language, (3) 0-100 age-aware guidance, (4) family aggregated view, (5) all 6 Saturn cycle variants tracked, (6) personalized worship calendar, and (7) a supportive, non-fearful tone. Each of these exists in fragments elsewhere. Combined, they create something that has never existed before: a lifelong Tamil astrology companion that respects both tradition and science. |
| --- |

| PART 7 — INTERPRETATION ENGINE PRINCIPLES |
| --- |

## The Interpretation Layer

The interpretation layer is the intellectual core of the product — and its most valuable competitive asset. It converts raw astronomical data into personalized, readable, actionable guidance. This layer requires careful construction with Tamil astrologer collaboration.

### Interpretation Template Structure

| Every Interpretation Follows This Pattern
1. What is happening astronomically (factual)
2. What Tamil Jyothidam tradition associates with this pattern (tendency — not certainty)
3. Specifically for this person's chart (personalization layer)
4. What helps or what to do (action)
5. Positive framing (what is available in this period) |
| --- |

### Interpretation Database Scope

9 Grahas × 12 houses = 108 base placement interpretations

9 Grahas × 12 transit positions × chart context = 1,296 transit interpretations

Dasha × Antardasha combinations = 81 primary combinations

All Saturn cycle phases × chart context = ~50 Sani period interpretations

All Yogas × activation Dasha = ~200 Yoga activation interpretations

Life stage × Dasha × transit = ~500 life stage guidance combinations

Worship recommendations = 9 Grahas × 12 chart conditions = ~108 entries

Total: approximately 2,500+ base interpretation entries — all Tamil-first

### Tone Governance Rules

| Rule | Specification | Example Reframe |
| --- | --- | --- |
| Never use these words | 'Disaster', 'doomed', 'bad period', 'suffering', 'cursed', 'malefic' | Replace with: challenge, caution, refinement, restructuring |
| Always pair negatives | Every caution with a corresponding action or positive outcome | User leaves every reading with something to do |
| Health language | Preventive only — never diagnostic or alarming | 'Consider a checkup' not 'health problems likely' |
| Saturn language | 'Refinement', 'consolidation', 'inner work', 'longevity' | Never 'Saturn is destroying your [X]' |
| Rahu language | 'Rapid change', 'ambition', 'unconventional path' | Never 'Rahu will cause illusion/deception' |
| Death / longevity | Never mentioned directly — framed as 'elder life vitality' | 8th house = transformation, not death |
| Marriage / children | Windows of probability, not guarantees or denials | Always hopeful, never closing doors |

| SUMMARY — COMPLETE SPECIFICATION INDEX |
| --- |

## Final Summary

### 20 Core Modules

| M1 | Chart Engine | Thirukanitham chart generation with all Varga charts, Shadbala, Ashtakavarga |
| --- | --- | --- |
| M2 | Daily Dashboard | Day rating, Rahu Kalam, Hora, personal insight, active affliction banner |
| M3 | Tamil Panchangam Live | 5 Panchangam limbs + extended data, city-specific, hourly Hora |
| M4 | Dasha Engine | Mahadasha, Antardasha, Pratyantardasha — full lifetime timeline |
| M5 | Sani Cycle Monitor | All 6 Saturn cycle variants with daily support during active cycles |
| M6 | Graha Peyarchi Tracker | All major transit events with personalized impact analysis |
| M7 | Live Planetary Feed | Real-time Graha positions, retrograde, combust, aspect alerts |
| M8 | Worship & Remedial | Personalized worship calendar, Navagraha temples, fasting days, mantras |
| M9 | Life Stage Advisor | Age 0-100 guidance intersected with Dasha and transits |
| M10 | Milestone Tracker | Childhood rituals through elder life — Muhurtham for each |
| M11 | Marriage Engine | Timing, 10-Kuta Nakshatra matching, wedding Muhurtham |
| M12 | Career & Education | Chart-based stream and career guidance at right life stage |
| M13 | Health Monitor | Planetary health rulerships, preventive nudges by period |
| M14 | Muhurtham Finder | 12 purpose types, full checklist, personalized date ranking |
| M15 | Ashtakavarga Engine | Transit precision scoring, Sarvashtakavarga, Kakshya level |
| M16 | Yoga Tracker | All Yoga types identified, Dasha activation timing tracked |
| M17 | Family Vault | Multi-member charts, aggregated fortune, cross-chart synastry |
| M18 | Notification System | 18 notification types, intelligent scheduling, smart silence |
| M19 | Tamil Calendar | All major festivals with personal chart significance mapped |
| M20 | Shadbala Engine | 6-factor planetary strength — drives worship + Dasha quality |

| The Promise of Vinaadi AI A person born today will open this app as a child (guided by parents), use it as a student (course guidance), navigate career and marriage with it, raise their family through it, and find reflective wisdom in elder years — all guided by the same system, the same chart, in their own language. Thirukanitham. Tamil. Lifelong. Astronomically precise. |
| --- |

— END OF SPECIFICATION —

Vinaadi AI  |  Final Product Specification v3.0

| PART 8 — CALCULATION METHODOLOGY ADDENDUM |
| --- |

This addendum defines the exact, step-by-step calculation pipelines for all modules that were specified functionally in Parts 1–7 but did not yet have a developer-implementable formula layer. All formulas follow Tamil Jyothidam + Thirukanitham methodology and are fully consistent with the Birth Chart Engine defined in Module 1. The source authority for all rules is the Tamil Jyothidam Complete Practitioner’s Reference (v2.2.1). All QA reference values assume Swiss Ephemeris with Lahiri Ayanamsa (swe.SIDM_LAHIRI).

## Module 4 — Dasha & Antardasha Engine: Calculation Methodology

### 4.4 Vimshottari Dasha Calculation Pipeline

This section defines the exact computation pipeline for all Dasha, Antardasha, and Pratyantardasha periods. All steps are mandatory. The Moon’s Nakshatra and Padam — already computed in Module 1 Steps 7–9 — are the sole inputs. All other values are derived deterministically.

Step 1 — Confirm Moon’s Nakshatra from Chart Engine Output

Use the nakshatra_number (1–27) and moon_degree values computed in Module 1 Step 7. Do NOT re-derive independently. If a pre-computed chart is supplied, treat its Nakshatra as Tier-1 data (Data Reconciliation Protocol, Module 1).

Step 2 — Map Nakshatra to Opening Mahadasha Lord

The 27 Nakshatras map to 9 Graha lords in a fixed repeating sequence (3 repetitions). The Moon’s Nakshatra lord is the opening Mahadasha lord at birth.

Fixed sequence: Ketu(7y) → Sukra(20y) → Surya(6y) → Chandra(10y) → Sevvai(7y) → Rahu(18y) → Guru(16y) → Sani(19y) → Budha(17y) → then repeats.

Nakshatra-to-lord mapping: 1,10,19=Ketu | 2,11,20=Sukra | 3,12,21=Surya | 4,13,22=Chandra | 5,14,23=Sevvai | 6,15,24=Rahu | 7,16,25=Guru | 8,17,26=Sani | 9,18,27=Budha

Step 3 — Compute Dasha Balance at Birth (Opening Period Remaining)

The Moon’s position within its Nakshatra determines how much of the opening Mahadasha remains.

nakshatra_start_deg = (nakshatra_number - 1) * 13.333

fraction_elapsed = (moon_degree - nakshatra_start_deg) / 13.333

balance_years = (1 - fraction_elapsed) * mahadasha_lord_total_years

Opening Mahadasha: display_start_date = birth_date; opening_dasha_original_start = birth_date - elapsed_years. display_end_date = birth_date + balance_years. Use Julian Day arithmetic with the selected traditional year convention consistently (civil 365.25 days for app display, or savana-year if chosen for strict panchanga lineage). Store the convention in calculationVersion.

Step 4 — Generate Full 120-Year Mahadasha Sequence

After the balance period, each subsequent Mahadasha runs its full fixed duration in the canonical sequence. Total Vimshottari cycle = 120 years.

sequence = [Ketu(7), Sukra(20), Surya(6), Chandra(10), Sevvai(7), Rahu(18), Guru(16), Sani(19), Budha(17)]

start_index = index_of(opening_maha_lord) in sequence

for each subsequent lord: start_date = previous_end_date; end_date = start + full_duration

Step 5 — Compute Antardasha (Bhukti) Within Each Mahadasha

Within each Mahadasha, 9 Antardashas run in the canonical sequence starting from the Mahadasha lord itself.

antardasha_duration_years = (mahadasha_total_years * antardasha_lord_years) / 120

Example: In Rahu Mahadasha (18 years), Rahu Antardasha = (18 x 18) / 120 = 2.7 years. Venus Antardasha within Rahu = (18 x 20) / 120 = 3.0 years.

Antardasha sequence starts at the Mahadasha lord, then continues through the full cycle: within Rahu Mahadasha order is Rahu, Guru, Sani, Budha, Ketu, Sukra, Surya, Chandra, Sevvai.

Step 6 — Compute Pratyantardasha (Sookshma Dasha) Level

pratyantardasha_years = (antardasha_years * pratyantardasha_lord_years) / 120

Sequence and starting lord follows the same rule: starts at the Antardasha lord, cycles through all 9.

Step 7 — Convert Decimal Years to Exact Calendar Dates

jd_start = swe.julday(birth_year, birth_month, birth_day, birth_hour_utc)

jd_end = jd_start + (balance_years * 365.25)

calendar_date = swe.revjul(jd_end)

All Dasha boundaries are stored as both Julian Day numbers (for precision computation) and Gregorian calendar dates (for display). Never store only the calendar date — Julian Day is the authoritative value.

| QA Reference Values: For a native born with Moon in Rohini Nakshatra (4th, lord = Chandra) with Moon at degree 40.5 (sidereal): fraction_elapsed = (40.5 - 40.0) / 13.333 = 0.0375. Balance of Chandra Mahadasha = (1 - 0.0375) x 10 = 9.625 years. Next Mahadasha: Sevvai starting 9.625 years after birth for 7 full years. All 81 Antardasha combinations must produce matching totals within each Mahadasha. |
| --- |

## Module 5 — Sani Cycle Monitor: Calculation Methodology

### 5.4 Saturn Cycle Detection Pipeline

This section defines the mandatory formula for detecting which Saturn cycle is active for any native at any given date. The identification formula must be executed before any Sani cycle is named or displayed — skipping it leads to mis-identification between Ezhara Sani, Ashtama Sani, and Kandaka Sani, which are distinct cycles with different effects.

Step 1 — Get Saturn’s Current Gochar Rasi

From the live ephemeris feed (Module 7), obtain Saturn’s current sidereal longitude.

saturn_rasi = floor(saturn_sidereal_degree / 30) + 1   # result: 1-12

Step 2 — Get Native’s Janma Rasi (Chandra Rasi)

Stored from birth chart computation (Module 1 Step 6, Moon’s Rasi). This is the reference point for all Sani cycle calculations — NOT the Lagna.

Step 3 — Calculate Saturn’s Position from Moon (Inclusive Count)

position_from_moon = ((saturn_rasi - janma_rasi) mod 12) + 1

Example: Saturn in Meenam (12), native’s Janma Rasi = Dhanusu (9) → position = ((12-9) mod 12)+1 = 4 = Ardhashtama Sani. This is not Janma Sani and not Ezhara/Sade Sati.

Step 4 — Map Position to Cycle Name

Apply the following fixed mapping:

Position 12 from Moon → Ezhara Sani Phase 1 (Rising / Viraya Sani) — ~2.5 years. Financial drain, sleep disruption, foreign matters.

Position 1 from Moon → Ezhara Sani Phase 2 (Janma Sani / Peak) — ~2.5 years. Maximum identity pressure. Most intense phase.

Position 2 from Moon → Ezhara Sani Phase 3 (Setting) — ~2.5 years. Family friction, financial test, speech caution.

Position 4 from Moon → Ardhashtama Sani — ~2.5 years. Domestic disruption, mother’s health, property stress.

Position 7 from Moon → Kantaka Sani (also check Lagna below) — Partnership stress, social disruption.

Position 8 from Moon → Ashtama Sani — ~2.5 years. Health test, chronic obstacles, hidden stress. Requires extra support framing.

All other positions → No active personal Sani cycle for this native.

Step 5 — Kandaka Sani Check (Lagna-Based, Separate from Moon-Based Cycles)

Kandaka Sani uses the Lagna as reference, not the Moon. It triggers when Saturn transits the 1st, 4th, 7th, or 10th house from Lagna.

kandaka_position = ((saturn_rasi - lagna_rasi) mod 12) + 1

if kandaka_position in [1, 4, 7, 10]: Kandaka Sani is active

Kandaka Sani can co-occur with a Moon-based Sani cycle. If both are active simultaneously, the period is doubly significant and the supportive framing must be intensified.

Step 6 — Compute Cycle Entry and Exit Dates

Saturn’s Rasi ingress and egress dates are computed from the ephemeris. Track Saturn’s daily longitude; the cycle entry date is the day when Saturn’s Rasi number changes to the trigger Rasi.

# For each date in range:

saturn_rasi_today = floor(swe.calc_ut(jd, swe.SATURN, FLG_SIDEREAL)[0] / 30) + 1

if saturn_rasi_today != saturn_rasi_yesterday: record ingress_date

Retrograde motion: Saturn may re-enter a Rasi during retrograde. Track all ingress and egress events; the cycle end date is the final egress from the trigger Rasi (after any retrograde re-entry).

Step 7 — Day Count and Phase Within Cycle

day_count = (today - cycle_entry_date).days

total_days = (cycle_exit_date - cycle_entry_date).days

phase_percent = day_count / total_days * 100

Phase display: 0–33% = Rising phase; 34–66% = Peak phase; 67–100% = Waning / exit phase. Tone of guidance adjusts accordingly — waning phase receives ‘emerging’ framing.

| QA Reference: Correct Saturn-cycle example. For a native with Janma Rasi = Dhanusu (9) and Saturn currently in Meenam (12): position_from_moon = ((12-9) mod 12)+1 = 4 = Ardhashtama Sani, not Janma Sani and not Ezhara/Sade Sati. If Lagna = Kanni (6), Kandaka check = ((12-6) mod 12)+1 = 7, so Saturn is also active on the 7th from Lagna; label this as a Lagna-based Kandaka/relationship-care transit separately. Combined alert required, but the Moon-based cycle name must remain Ardhashtama Sani. |
| --- |

## Module 6 — Graha Peyarchi (Transit) Tracker: Calculation Methodology

### 6.2 Transit Computation Pipeline

This section defines the step-by-step formula for all Graha Peyarchi calculations. Transit results in Tamil Jyothidam are always counted from the Chandra Rasi (Moon sign) as the primary reference, with the Lagna as secondary confirmation. Both are required.

Step 1 — Determine Current Transit Rasi for Each Graha

From live ephemeris (Module 7 feed), for each of the 9 Grahas:

transit_rasi[graha] = floor(sidereal_degree[graha] / 30) + 1

Step 2 — Calculate House from Moon (Primary Reference)

house_from_moon = ((transit_rasi - janma_rasi) mod 12) + 1

All transit results and interpretations use this value as the primary indicator. This is the Thirukanitham standard — Gochar is counted from Chandra Rasi, not Janma Lagna.

Step 3 — Calculate House from Lagna (Secondary Confirmation)

house_from_lagna = ((transit_rasi - lagna_rasi) mod 12) + 1

Used for secondary verification. If house_from_moon and house_from_lagna both indicate a positive or negative transit, the signal strength is high. If they disagree, qualify the interpretation as mixed.

Step 4 — Guru (Jupiter) Transit Results by House from Moon

Apply the corrected results table. Jupiter’s transit effects per house from Chandra Rasi:

1st: Mixed — new phase beginning, some identity pressure. Not fully auspicious.

2nd: Wealth improvement, family growth, speech strengthened. Auspicious.

3rd: Effort required; courage activated but mixed results overall.

4th: Property potential but domestic disruption. Mixed.

5th: VERY AUSPICIOUS — children, intelligence, past-life merit activated, luck peaks.

6th: Mixed — debt reduction possible but health caution. Enemies subdued.

7th: Marriage, partnerships, travel — auspicious.

8th: Ashtama Guru — CAUTION period. Hidden obstacles, health dip. Flag separately.

9th: VERY AUSPICIOUS — Bhagya peak, guru blessings, father’s health good.

10th: Career expansion, recognition, promotion windows.

11th: VERY AUSPICIOUS — gains, wish fulfilment, income growth.

12th: Expenditure, spiritual activity, foreign connection — mixed.

Step 5 — Ashtakavarga Transit Score (Personalisation Layer)

For each Graha transit, retrieve that planet’s Bhinnashtakavarga score for the house it is transiting. This score (0–8 per house) determines the actual effectiveness of the transit for this specific native.

bindu_score = bhinnashtakavarga[graha][transit_house]

if bindu_score >= 4: transit is effective (show as positive/normal)

if bindu_score <= 3: transit is weak (qualify interpretation)

if bindu_score <= 1: transit is very difficult (add caution note)

This score is computed by Module 15 (Ashtakavarga Engine) and stored in the chart schema. Module 6 retrieves it as a lookup.

Step 6 — Retrograde and Combustion Detection

Retrograde: Speed value from Swiss Ephemeris FLG_SPEED. If speed < 0, planet is Vakra (retrograde). Transit effects become internalised or delayed — apply Vakra qualifier to interpretation.

Combustion orbs (corrected values per Thirukanitham reference):

Budha (Mercury): 12° direct / 14° retrograde

Sukra (Venus): 10° direct / 8° retrograde

Sevvai (Mars): 17° both

Guru (Jupiter): 11° both

Sani (Saturn): 15° both

angular_diff = abs(planet_degree - sun_degree)

if angular_diff > 180: angular_diff = 360 - angular_diff

if angular_diff <= combust_orb[planet]: mark as combust

Step 7 — Rahu/Ketu Peyarchi Axis Calculation

Rahu and Ketu always oppose by exactly 180°. Both change Rasi simultaneously every ~18 months (mean node movement). Module 1 uses swe.MEAN_NODE for Rahu; Ketu = Rahu + 180° mod 360.

rahu_house_from_moon = ((rahu_rasi - janma_rasi) mod 12) + 1

ketu_house_from_moon = ((rahu_house_from_moon + 6 - 1) mod 12) + 1

The Rahu/Ketu axis shift (Peyarchi) triggers a full report. Effects are assessed for both Rahu’s house and Ketu’s house from both Moon and Lagna.

Step 8 — Vedha Vichara (Transit Obstruction Check)

Certain house pairs mutually obstruct each other’s transit benefits. If a planet is transiting a beneficial house, check whether another planet simultaneously occupies the Vedha house — if so, the benefit is nullified. Vedha pairs (from Thirukanitham): 1↔8, 2↔12, 3↔6, 4↔3, 5↔9, 6↔12, 7↔2, 9↔5, 10↔4, 11↔8. Note: 1st house has no Vedha obstruction. Evaluate all active beneficial transits for Vedha before displaying.

## Module 7 — Live Planetary Position Feed: Calculation Methodology

### 7.3 Live Feed Computation Pipeline

Module 7 refreshes all Graha data every hour. The following pipeline is executed on each refresh cycle.

Step 1 — Compute Current Julian Day for This Moment

now_utc = current_datetime_utc

jd_now = swe.julday(now_utc.year, now_utc.month, now_utc.day, now_utc.hour + now_utc.minute/60.0)

Step 2 — Calculate All 9 Graha Positions with Speed

for each graha in [SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, MEAN_NODE]:

result = swe.calc_ut(jd_now, graha_id, FLG_SIDEREAL | FLG_SPEED)

degree[graha] = result[0] % 360

speed[graha] = result[3]   # deg/day; negative = retrograde

degree[KETU] = (degree[MEAN_NODE] + 180) % 360

Step 3 — Derive Rasi, Nakshatra, Pada for Each Graha

rasi[graha] = floor(degree[graha] / 30) + 1

degree_in_rasi[graha] = degree[graha] % 30

nakshatra[graha] = floor(degree[graha] / 13.333) + 1

pada[graha] = floor((degree[graha] % 13.333) / 3.333) + 1

Step 4 — Retrograde Flag

is_retrograde[graha] = (speed[graha] < 0)

Display retrograde planets with ‘R’ badge. Sun, Moon, Rahu, and Ketu are never retrograde (Rahu/Ketu are always mean retrograde by definition — do not flag them with the R badge).

Step 5 — Combustion Status

Apply combustion orbs from Module 6 Step 6 formula. Flag combust planets with flame indicator.

Step 6 — Moudyami (Heliacal) Status

A planet is Moudyami (under solar rays, partially functional) when it is beyond the combustion orb but still within an extended heliacal threshold. Use 15° for slow planets (Jupiter, Saturn, Mars) and 10° for fast planets as the outer Moudyami boundary. Planet is Moudyami if: combust_orb < angular_diff_from_sun <= moudyami_orb.

Step 7 — Natal Aspect Computation

For each transiting Graha, check if it is aspecting any natal planet using Parashari aspect rules:

All planets: 7th house aspect (180° ± 2° orb) — full aspect

Sani (Saturn): additionally aspects 3rd (90°) and 10th (270°) — 75% strength

Guru (Jupiter): additionally aspects 5th (120°) and 9th (240°) — full strength

Sevvai (Mars): additionally aspects 4th (105°) and 8th (225°) — full strength

for each natal_planet:

angular_sep = abs(transit_degree - natal_degree)

if angular_sep > 180: angular_sep = 360 - angular_sep

if abs(angular_sep - aspect_angle) <= 2: flag as active aspect

Step 8 — Retrieve Ashtakavarga Transit Score

For each Graha, look up its Bhinnashtakavarga score for the house it is currently transiting from the stored chart data (Module 15). Display this score alongside the planet’s position. Score 4+ = strong transit; below 4 = weak.

## Module 11 — Marriage Timing & Compatibility Engine: Calculation Methodology

### 11.5 Marriage Window Timing — Calculation Pipeline

Step 1 — Identify the 7th House and Its Lord

seventh_house_rasi = ((lagna_rasi + 6) mod 12)

if seventh_house_rasi == 0: seventh_house_rasi = 12

seventh_lord = rasi_lord_lookup[seventh_house_rasi]

Rasi lord lookup: Mesha=Mars, Rishabam=Venus, Midhunam=Mercury, Kadagam=Moon, Simmam=Sun, Kanni=Mercury, Thulaam=Venus, Vrichigam=Mars, Dhanusu=Jupiter, Magaram=Saturn, Kumbam=Saturn, Meenam=Jupiter.

Step 2 — Check Active Dasha for Marriage Indicators

Cross-reference Module 4 output. Marriage window is flagged as HIGH when any of the following are true in the current Mahadasha or Antardasha:

Current Mahadasha or Antardasha lord = 7th house lord — PRIMARY indicator

Current Mahadasha or Antardasha lord = Venus (Sukra) — SECONDARY indicator (for all Lagnas)

Current Mahadasha or Antardasha lord = Navamsa Lagna lord (from D9 chart) — SECONDARY indicator

Step 3 — Jupiter Transit Over 7th House from Lagna

jupiter_house_from_lagna = ((jupiter_current_rasi - lagna_rasi) mod 12) + 1

if jupiter_house_from_lagna == 7: marriage_transit_active = True

Also check Jupiter transiting 1st, 5th, or 9th from Lagna as additional supportive indicators.

### 11.6 Nakshatra Kuta Matching — Full Calculation Formulas

Tamil Vivaha Porutham uses 10 Porutham gates as the primary cultural standard. Numeric Kuta-style scoring may be shown only as a secondary aid and must be clearly labelled. Rajju and Vedha are non-negotiable gates — failure in either overrides all other scores. All calculations use the Nakshatra number (1–27) of each partner.

Dinam Kuta (2 points) — Health and Longevity

count = ((girl_nakshatra - boy_nakshatra) mod 27) + 1

Auspicious counts: 2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26. Score = 2 if count is in this list, else 0.

Gana Kuta (6 points) — Temperament Match

Deva Gana Nakshatras: Ashwini(1), Mrigashira(5), Punarvasu(7), Pushyami(8), Hasta(13), Swati(15), Anuradha(17), Shravana(22), Revati(27).

Manushya Gana Nakshatras: Bharani(2), Rohini(4), Arudra(6), PoorvaPhalguni(11), UttaraPhalguni(12), PoorvAshadha(20), UttarAshadha(21), PoorvaBhadra(25).

Rakshasa Gana Nakshatras: Krittika(3), Aslesha(9), Magha(10), Chitta(14), Vishakha(16), Jyeshtha(18), Moola(19), Dhanishtha(23), Shatabhisha(24), UttaraBhadra(26).

Scoring: Same Gana = 6. Deva+Manushya = 5 (boy Deva, girl Manushya) or 3 (boy Manushya, girl Deva). Deva+Rakshasa = 1 (boy Deva) or 0 (boy Rakshasa). Manushya+Rakshasa = 0.

Rajju Kuta (NON-NEGOTIABLE — Pass/Fail) — Marriage Longevity

Classify each partner’s Nakshatra into the 5 Rajju groups:

Pada Rajju (feet): Ashwini(1), Aslesha(9), Magha(10), Jyeshtha(18), Moola(19), Revati(27)

Kati Rajju (waist): Bharani(2), Pushyami(8), PoorvaPhalguni(11), Anuradha(17), PoorvAshadha(20), UttaraBhadra(26)

Nabhi Rajju (navel): Krittika(3), Punarvasu(7), UttaraPhalguni(12), Vishakha(16), UttarAshadha(21), PoorvaBhadra(25)

Kanta Rajju (throat): Rohini(4), Arudra(6), Hasta(13), Swati(15), Shravana(22), Shatabhisha(24)

Siro Rajju (head): Mrigashira(5), Chitta(14), Dhanishtha(23)

Rule: If both partners share the same Rajju group — match FAILS regardless of total score. Marriage is strongly discouraged. This is absolute and cannot be overridden by other high scores.

Vedha Kuta (NON-NEGOTIABLE — Pass/Fail) — Mutual Harm Check

The following Nakshatra pairs are Vedha (pierce each other). If one partner’s Nakshatra and the other’s form a Vedha pair — match FAILS:

Vedha pairs: (1,18) (2,16) (3,15) (4,14) (5,13) (6,12) (7,11) (8,10) (9,27) (19,25) (20,24) (21,23) (22,26). Exception: Mrigashira-Chitta (5-14) and Mrigashira-Dhanishtha (5-23) are exempt.

Nadi Kuta — Critical Dosha Check (Thirukanitham Priority)

Nadi Dosha occurs when both partners belong to the same Nadi. This is one of the most severe compatibility afflictions affecting health and progeny.

Vata Nadi: Ashwini(1), Arudra(6), Punarvasu(7), UttaraPhalguni(12), Hasta(13), Jyeshtha(18), Moola(19), Shatabhisha(24), PoorvaBhadra(25).

Pitta Nadi: Bharani(2), Mrigashira(5), Pushyami(8), PoorvaPhalguni(11), Chitta(14), Anuradha(17), PoorvAshadha(20), Dhanishtha(23), UttaraBhadra(26).

Kapha Nadi: Krittika(3), Rohini(4), Aslesha(9), Magha(10), Swati(15), Vishakha(16), UttarAshadha(21), Shravana(22), Revati(27).

If both partners are in the same Nadi: Nadi Dosha — flag prominently. Score = 0 for this Kuta; strongly recommend detailed chart consultation before proceeding.

Total Score Interpretation

First check: Rajju Kuta PASS and Vedha Kuta PASS are mandatory. Fail in either = incompatible regardless of score.

Second check: Nadi Dosha present = flag as serious concern even if total score is high.

18+ points: Very good compatibility. Proceed with confidence.

14–17 points: Good, acceptable. Minor qualifications noted.

10–13 points: Average. Recommend additional chart analysis.

Below 10 points: Challenging compatibility. Full chart consultation recommended.

## Module 14 — Muhurtham Finder: Calculation Methodology

### 14.3 Muhurtham Candidate Generation and Ranking Pipeline

The Muhurtham checklist in Section 14.2 defines the criteria. This section defines the computational pipeline for generating, filtering, and ranking candidate dates.

Step 1 — Generate Candidate Date Pool

Iterate through every date in the user’s requested range. For multi-hour events (weddings), also generate 2-hour Lagna windows within each candidate date.

for date in date_range(user_start, user_end):

run Module 3 engine for this date and user city

obtain: tithi, vara, nakshatra, yoga, karana, rahu_kalam, guli, yamagandam

Step 2 — Apply Mandatory Elimination Filters (Hard Filters)

Eliminate the date/window if ANY of the following are true:

Tithi is Rikta: 4th, 9th, 14th, 19th, 24th, or 29th Tithi

Tithi is Amavasai (30th) for all purposes except Pitru-related rituals

Tithi is Ashtami (8th or 23rd) — for marriage and major events only

Tithi is Navami (9th or 24th) — for marriage only

Yoga is Vishkambha(1), Atiganda(6), Shoola(9), Ganda(10), Vyatipata(17), or Vaidhriti(27)

Karana is Vishti (Bhadra) — for all auspicious activities

Proposed event time falls within Rahu Kalam, Guli Kalam, or Yamagandam window

Step 3 — Nakshatra Suitability by Purpose

Apply purpose-specific Nakshatra suitability. Auspicious Nakshatras by event type:

Marriage: Rohini(4), Mrigashira(5), Magha(10), Hasta(13), Swati(15), Anuradha(17), Moola(19), UttarAshadha(21), UttaraBhadra(26), Revati(27)

Business Launch: Ashwini(1), Rohini(4), Mrigashira(5), Pushyami(8), Hasta(13), Chitta(14), Anuradha(17), UttarAshadha(21), UttaraBhadra(26), Revati(27)

Griha Pravesh: Rohini(4), Mrigashira(5), Punarvasu(7), Pushyami(8), Hasta(13), Swati(15), Anuradha(17), UttarAshadha(21), Shravana(22)

New Job / Career Start: Ashwini(1), Rohini(4), Pushyami(8), Hasta(13), Anuradha(17), UttarAshadha(21), Shravana(22), Revati(27)

Vidyarambham / Education Start: Ashwini(1), Rohini(4), Punarvasu(7), Pushyami(8), Hasta(13), Chitta(14), Swati(15), Shravana(22), Revati(27)

Surgery Scheduling: Avoid Nakshatra of natal 8th lord; Moon must NOT be in 8th or 12th house from Lagna

Step 4 — Vara (Weekday) Matching by Purpose

Thursday (Guru Vara): Education, finance, legal matters, knowledge activities

Friday (Sukra Vara): Marriage, arts, beauty, relationship matters

Wednesday (Budha Vara): Business, communication, trade. Avoid for Abhijit on Wednesdays.

Monday (Chandra Vara): Travel, public dealing, agriculture

Avoid Tuesday and Saturday for marriage and major new ventures when possible

Step 5 — Lagna Quality for Proposed Time Window

For each surviving candidate date, compute the Lagna (Ascendant) for each 2-hour block using the Module 1 Step 4 formula. Apply Lagna preferences by event type:

Marriage: Prefer fixed signs (Rishabam, Simmam, Vrichigam, Kumbam) as rising Lagna

Business: Prefer movable signs (Mesha, Kadagam, Thulaam, Magaram)

For all events: Avoid Lagna that is the native’s 6th, 8th, or 12th house

Ensure proposed Lagna is not afflicted by transit malefics (Saturn, Mars) within 5°

Step 6 — Tara Bala Check (For 2-Person Events: Marriage, Partnership)

count = ((event_nakshatra - native_nakshatra) mod 27) + 1

Adverse Tara positions (counts): 3 (Vipat), 5 (Pratyari), 7 (Naidhana) — avoid. Check for BOTH partners independently. Reject date if Tara is adverse for either person.

Step 7 — Personal Dasha Quality Check

Is the proposed date within a favorable Mahadasha and Antardasha for the native? If the native is in an adverse Dasha period (Ketu, or any weak/afflicted lord), note this alongside the Muhurtham result. Do not reject on Dasha alone, but qualify the recommendation.

Step 8 — Score, Rank, and Return Top 5

Assign a composite score to each surviving candidate based on weighted criteria:

score = (nakshatra_match * 30) + (vara_match * 20) + (tithi_quality * 20)

+ (lagna_quality * 15) + (yoga_quality * 10) + (dasha_quality * 5)

Return the top 5 scored dates. For each date, display: Tithi, Vara, Nakshatra, Yoga, Karana, Lagna, Rahu Kalam window to avoid, and the specific reasons for the recommendation.

## Module 15 — Ashtakavarga Engine: Calculation Methodology

### 15.3 Ashtakavarga Computation Pipeline

Ashtakavarga is the Thirukanitham precision layer for all transit scoring. It assigns each house a numerical score (bindu) reflecting how many planetary reference points contribute positive energy to that house. This score determines whether a planet’s transit is actually effective for a specific native — making transit predictions personal rather than generic.

Step 1 — Build Each Planet’s Bhinnashtakavarga Table

For each of the 8 reference points (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna), each planet contributes bindu to specific houses counted from that reference point’s natal position. The contribution rules are fixed classical tables — shown below for each planet.

#### Sun’s Bhinnashtakavarga — Bindu Contributing Houses

From Sun: houses 1,2,4,7,8,9,10,11. From Moon: 3,6,10,11. From Mars: 1,2,4,7,8,9,10,11. From Mercury: 3,5,6,9,10,11,12. From Jupiter: 5,6,9,11. From Venus: 6,7,12. From Saturn: 1,2,4,7,8,9,10,11. From Lagna: 3,4,6,10,11,12.

#### Moon’s Bhinnashtakavarga — Bindu Contributing Houses

From Sun: 3,6,7,8,10,11. From Moon: 1,3,6,7,10,11. From Mars: 2,3,5,6,9,10,11. From Mercury: 1,3,4,5,7,8,10,11. From Jupiter: 1,4,7,8,10,11,12. From Venus: 3,4,5,7,9,10,11. From Saturn: 3,5,6,11. From Lagna: 3,6,10,11.

#### Mars’s Bhinnashtakavarga — Bindu Contributing Houses

From Sun: 3,5,6,10,11. From Moon: 3,6,11. From Mars: 1,2,4,7,8,10,11. From Mercury: 3,5,6,11. From Jupiter: 6,10,11,12. From Venus: 6,8,11,12. From Saturn: 1,4,7,8,9,10,11. From Lagna: 1,2,4,7,8,10,11.

#### Mercury’s Bhinnashtakavarga — Bindu Contributing Houses

From Sun: 5,6,9,11,12. From Moon: 2,4,6,8,10,11. From Mars: 1,2,4,7,8,9,10,11. From Mercury: 1,3,5,6,9,10,11,12. From Jupiter: 6,8,11,12. From Venus: 1,2,3,4,5,8,9,11. From Saturn: 1,2,4,7,8,9,10,11. From Lagna: 1,2,4,6,8,10,11.

#### Jupiter’s Bhinnashtakavarga — Bindu Contributing Houses

From Sun: 1,2,3,4,7,8,9,10,11. From Moon: 2,5,7,9,11. From Mars: 1,2,4,7,8,10,11. From Mercury: 1,2,4,5,6,9,10,11. From Jupiter: 1,2,3,4,7,8,10,11. From Venus: 2,5,6,9,10,11. From Saturn: 3,5,6,12. From Lagna: 1,2,4,5,6,7,9,10,11.

#### Venus’s Bhinnashtakavarga — Bindu Contributing Houses

From Sun: 8,11,12. From Moon: 1,2,3,4,5,8,9,11,12. From Mars: 3,4,6,9,11,12. From Mercury: 3,5,6,9,11. From Jupiter: 5,8,9,10,11. From Venus: 1,2,3,4,5,8,9,10,11. From Saturn: 3,4,5,8,9,10,11. From Lagna: 1,2,3,4,5,8,9,11.

#### Saturn’s Bhinnashtakavarga — Bindu Contributing Houses

From Sun: 1,2,4,7,8,10,11. From Moon: 3,6,11. From Mars: 3,5,6,10,11,12. From Mercury: 6,8,9,10,11,12. From Jupiter: 5,6,11,12. From Venus: 6,11,12. From Saturn: 3,5,6,11. From Lagna: 1,3,4,6,10,11.

Step 2 — Compute Each Planet’s Bhinnashtakavarga Score Per House

for each planet P:

for house H in 1..12:

score = 0

for each reference_point R in [Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna]:

contribution_houses = bindu_table[P][R]   # list of houses from R

actual_house = ((H - natal_rasi[R]) mod 12) + 1

if actual_house in contribution_houses: score += 1

bhinnashtakavarga[P][H] = score   # value: 0-8

Step 3 — Build Sarvashtakavarga (Total Score Per House)

for house H in 1..12:

sarvashtakavarga[H] = sum(bhinnashtakavarga[P][H] for P in all_planets)

Sarvashtakavarga total per house ranges 0–56. Interpretation: 30+ = strong house; 25–29 = moderate; 20–24 = weak; below 20 = very difficult; above 35 = dominant life theme.

Step 4 — Transit Scoring Application

when planet P transits house H:

transit_score = bhinnashtakavarga[P][H]

if transit_score >= 4: effective transit (positive)

if transit_score == 3: neutral / mixed

if transit_score <= 2: weak transit (cautionary)

if transit_score == 0: very difficult transit

Step 5 — Kakshya (Sub-Divisional) Analysis for Day-Level Precision

Each 30° house is divided into 8 Kakshyas of 3.75° each. Each Kakshya is ruled by a planet in order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Lagna.

degree_in_house = transit_degree mod 30

kakshya_number = floor(degree_in_house / 3.75)   # 0-7

kakshya_ruler = [Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Lagna][kakshya_number]

If the Kakshya ruler contributed a bindu to this house in the Bhinnashtakavarga table, the transit is doubly effective during this specific degree window. This enables day-level precision for the most important transits.

## Module 16 — Yoga Identification & Activation Tracker: Calculation Methodology

### 16.2 Yoga Detection Pipeline

This section defines the computational logic for identifying all Yogas from the natal chart. All Yoga detections use Module 1 output (planet positions, Rasi, house assignments) as input. The Yoga Maturity Qualifier must be applied to every detected Yoga before it is displayed.

Step 1 — Retrieve Natal Planet Data from Module 1

Inputs: rasi[graha], house[graha] (1–12 from Lagna), degree[graha], dignity[graha], is_retrograde[graha], shadbala[graha] (from Module 20). Do NOT re-compute; use stored chart values.

Step 2 — Detect Raja Yogas (Kendra-Trikona Lord Connections)

kendra_lords = [lord(1), lord(4), lord(7), lord(10)]

trikona_lords = [lord(1), lord(5), lord(9)]

for each pair (K, T) where K in kendra_lords and T in trikona_lords and K != T:

# Check conjunction: both in same Rasi

if rasi[K] == rasi[T]: Raja Yoga (conjunction)

# Check mutual aspect: 7th from each other

if ((house[K] + 6) mod 12) + 1 == house[T]: Raja Yoga (aspect)

# Check Parivartana: each in the other's own sign

if rasi[K] == own_sign(T) and rasi[T] == own_sign(K): Raja Yoga (exchange)

Strongest Raja Yoga pairs: 9th lord + 10th lord, 5th lord + 10th lord, 1st lord + 9th lord. Apply functional benefic/malefic overlay (Section 4.1 of reference) — Raja Yoga between functionally malefic lords is weak.

Step 3 — Detect Gaja Kesari Yoga

houses_of_jupiter_from_moon = ((rasi[JUPITER] - rasi[MOON]) mod 12) + 1

if houses_of_jupiter_from_moon in [1, 4, 7, 10]: Gaja Kesari Yoga present

Qualifier: Both Jupiter and Moon must be free from debilitation and not severely combust. Check Shadbala of both. A debilitated Jupiter forms only a weak Gaja Kesari.

Step 4 — Detect Pancha Mahapurusha Yogas

Corrected rule: Planet must be in own sign OR Moolatrikonam OR exaltation sign AND in Kendra from LAGNA (houses 1, 4, 7, 10). Kendra from Moon is secondary confirmation only — not sufficient alone.

Hamsa Yoga: Jupiter in Dhanur, Meenam (own), or Kadagam (exalt) AND in house 1, 4, 7, or 10 from Lagna

Malavya Yoga: Venus in Rishabam, Thulaam (own), or Meenam (exalt) AND in house 1, 4, 7, or 10 from Lagna

Ruchaka Yoga: Mars in Mesham, Vrichigam (own) or Magaram (exalt) AND in house 1, 4, 7, or 10 from Lagna

Bhadra Yoga: Mercury in Midhunam, Kanni (own/exalt) AND in house 1, 4, 7, or 10 from Lagna

Shasha Yoga: Saturn in Magaram, Kumbam (own) or Thulaam (exalt) AND in house 1, 4, 7, or 10 from Lagna

Step 5 — Detect Budha Aditya Yoga

if rasi[MERCURY] == rasi[SUN]: Budha Aditya Yoga present

If Mercury is also combust (within 12° of Sun), the Yoga is present but weakened. Note: Mercury is the only planet that cannot escape conjunction with the Sun due to its orbital proximity; even combust Mercury-Sun conjunctions form this Yoga in diminished form.

Step 6 — Detect Neecha Bhanga Yoga

For each debilitated planet (in its Neecham sign), check the Neecha Bhanga conditions:

for each planet P with dignity == NEECHAM:

cancellation_lord = lord(neecham_sign[P])

exaltation_planet = planet_exalted_in(neecham_sign[P])

# Condition 1: Lord of debilitation sign is in Kendra from Lagna or Moon

if house[cancellation_lord] in [1,4,7,10] (from Lagna or Moon): Neecha Bhanga

# Condition 2: Planet exalted in that sign is in Kendra from Lagna or Moon

if house[exaltation_planet] in [1,4,7,10] (from Lagna or Moon): Neecha Bhanga

Result: Neecha Bhanga Raja Yoga — the planet delivers exceptionally strong results in its Dasha, typically after an initial period of struggle in early life. Always note this qualifier in the interpretation.

Step 7 — Detect Viparita Raja Yoga (Corrected Rule)

The corrected rule: A 6th, 8th, or 12th house lord (Dushthana lord) placed in ANOTHER Dushthana house. A malefic merely sitting in a Dushthana does NOT constitute Viparita Raja Yoga.

dushthana_lords = [lord(6), lord(8), lord(12)]

for each dushthana_lord in dushthana_lords:

if house[dushthana_lord] in [6, 8, 12]: Viparita Raja Yoga

Step 8 — Yoga Maturity Qualifier (Mandatory for Every Detected Yoga)

Before displaying any Yoga, apply the mandatory maturity check:

Bala Avastha: If the Yoga-forming planet is between 0°–6° in its sign (Bala state), the Yoga is immature and delivers weak results. Note this.

Navamsa confirmation: Does the planet maintain dignity in D9 chart? Vargottama strengthens; debilitation in D9 weakens.

Shadbala check: Is the planet’s Shadbala above the minimum Rupas threshold (from Module 20)? Below threshold = Yoga delivers at reduced strength.

Dasha activation window: State the specific Mahadasha and Antardasha when this Yoga activates. A Yoga without Dasha activation is latent potential only — never present it as active.

Step 9 — Dasha Activation Timeline

yoga_activation_dasha = mahadasha_period_of(primary_yoga_planet)

activation_start = mahadasha_start_date[primary_yoga_planet]

activation_end = mahadasha_end_date[primary_yoga_planet]

Display: ‘Your [Yoga name] activates during [Planet] Mahadasha ([start year]–[end year]). Begin preparing for the opportunities it brings.’

## Module 20 — Shadbala Engine: Calculation Methodology

### 20.3 Six-Bala Computation Pipeline

Shadbala provides a precise quantitative strength for each planet. The total Rupas value determines whether a planet delivers its full potential in its Dasha period. All six components are required. The final total is compared against the minimum Rupas threshold per planet to classify it as strong or weak.

Step 1 — Sthana Bala (Positional Strength)

Based on the planet’s dignity state in its natal Rasi. Uses dignity computed in Module 1 Steps 5–6.

Ucham (Exaltation): 60 Shashtiamsas

Moolatrikonam: 45 Shashtiamsas

Own sign (Swasthaanam): 30 Shashtiamsas

Friend’s sign (Mithra Sthaanam): 22.5 Shashtiamsas

Neutral sign (Sama Sthaanam): 15 Shashtiamsas

Enemy’s sign (Shatru Sthaanam): 7.5 Shashtiamsas

Neecham (Debilitation): 0 Shashtiamsas

Neecha Bhanga: If debilitation is cancelled (Module 16 Step 6), restore Sthana Bala to 15 Shashtiamsas minimum.

Step 2 — Dig Bala (Directional Strength)

Each planet has a point of maximum directional strength (Dig Bala point). Strength is maximum at that exact house and zero at the opposite house.

Jupiter and Mercury: Maximum at 1st house (Lagna / East)

Moon and Venus: Maximum at 4th house (North)

Sun and Mars: Maximum at 10th house (South / Midheaven)

Saturn: Maximum at 7th house (West)

digbala_degree = digbala_house_cusp[planet]  # degree of that house cusp

angular_diff = abs(planet_degree - digbala_degree)

if angular_diff > 180: angular_diff = 360 - angular_diff

dig_bala = (180 - angular_diff) / 3   # result: 0-60 Shashtiamsas

Step 3 — Kaala Bala (Temporal Strength)

Composed of multiple sub-components based on birth timing:

Nathonnatha Bala: Diurnal planets (Sun, Jupiter, Venus, waxing Moon) stronger by day. Nocturnal planets (Moon, Mars, Saturn) stronger by night. Mercury is both.

Paksha Bala: Benefics gain strength as Moon waxes (0 at Amavasai, 60 at Pournami). Malefics gain strength as Moon wanes. Formula: paksha_bala = (tithi_number / 15) x 60 for benefics.

Tribhaga Bala: Day divided into 3 thirds. Jupiter rules first third of daytime; Sun rules middle; Saturn rules last. Mercury rules nights. Ruling planet for that third gains 60 Shashtiamsas.

Vara Bala: Weekday lord gains 45 Shashtiamsas on its day (Sun on Sunday, Moon on Monday, etc.).

Hora Bala: Ruling Hora planet (from Module 3 Step 9) gains 60 Shashtiamsas during its Hora.

Ayana Bala: Diurnal planets stronger in Uttarayana (Sun in Capricorn-to-Gemini); nocturnal in Dakshinayana. Formula: ayana_bala = (sun_declination / 24) x 60.

kaala_bala[planet] = nathonnatha + paksha + tribhaga + vara + hora + ayana

Step 4 — Cheshta Bala (Motional Strength)

Based on the planet’s current speed relative to its mean motion:

Retrograde (Vakra): 60 Shashtiamsas — highest Cheshta Bala

Stationary (about to turn retrograde or direct): 45 Shashtiamsas

Direct, slow speed (below mean motion): 30 Shashtiamsas

Direct, mean speed: 22.5 Shashtiamsas

Direct, fast speed (above mean motion): 15 Shashtiamsas

Combust (Astha): 0 Shashtiamsas — lost independence

Sun and Moon are never retrograde. Sun’s Cheshta Bala = Ayana Bala (already counted in Kaala Bala). Moon’s Cheshta Bala = Paksha Bala.

Step 5 — Naisargika Bala (Natural Inherent Strength)

Fixed hierarchy — does not change with any chart factor:

Sun = 60 | Moon = 51.43 | Venus = 42.86 | Jupiter = 34.29

Mercury = 25.71 | Mars = 17.14 | Saturn = 8.57  (Shashtiamsas)

Step 6 — Drik Bala (Aspectual Strength)

Sum of aspects received. Natural benefics aspecting = positive Drik Bala; natural malefics aspecting = negative Drik Bala.

drik_bala = 0

for each planet A aspecting planet P:

if A is natural benefic: drik_bala += aspect_strength_percentage * 60

if A is natural malefic: drik_bala -= aspect_strength_percentage * 60

Aspect strength: Full (7th) aspect = 100%. Special aspects: Saturn 3rd/10th and Jupiter 5th/9th and Mars 4th/8th = 75%.

Step 7 — Total Shadbala and Rupas Classification

total_shashtiamsas[planet] = sthana + dig + kaala + cheshta + naisargika + drik

rupas[planet] = total_shashtiamsas[planet] / 60

Minimum required Rupas thresholds for a planet to be considered strong:

Surya (Sun): 6.5 Rupas minimum

Chandra (Moon): 6.0 Rupas minimum

Sevvai (Mars): 5.0 Rupas minimum

Budha (Mercury): 7.0 Rupas minimum

Guru (Jupiter): 6.5 Rupas minimum

Sukra (Venus): 5.5 Rupas minimum

Sani (Saturn): 5.0 Rupas minimum

If rupas[planet] < threshold[planet]: planet is classified as weak — worship recommendation triggered (Module 8), and Dasha interpretations are qualified as ‘delivering below full potential.’

| Shadbala Usage in System: The Rupas score is stored in the AstrologyChart schema as planets[].shadbala (Float). Module 8 reads this to identify the weakest planet for worship recommendations. Module 16 reads this for Yoga Maturity qualification. Module 6 reads this as a multiplier on transit effectiveness. All modules must read from stored Shadbala values and never recompute independently — Shadbala is calculated once at chart generation time. |
| --- |

## Module 2 — Daily Dashboard: Day Rating Sub-Score Formulas

### 2.3 Day Rating Sub-Score Computation

The Day Rating Algorithm (Section 2.2) defines the weight of each factor. This section defines how each factor’s raw score (0–100) is computed.

Nakshatra Quality Sub-Score (35% weight)

Compute based on today’s Moon Nakshatra from Module 3 Step 3, cross-referenced against native’s Janma Nakshatra:

Today = Janma Nakshatra (Janma Tara): score 20 — sensitive day, extra care needed

Today = Janma + 9 (Anujanma Tara): score 25 — sensitive day

Today = Janma + 18 (Trijanma Tara): score 20 — sensitive day

Today = Sampat Tara (Janma+1): score 95 — wealth and prosperity

Today = Vipat Tara (Janma+2): score 30 — obstacles

Today = Kshema Tara (Janma+3): score 90 — comfort and wellbeing

Today = Pratyari Tara (Janma+4): score 25 — adversity

Today = Sadhana Tara (Janma+5): score 85 — achievement

Today = Naidhana Tara (Janma+6): score 20 — danger, extreme caution

Today = Mitra Tara (Janma+7): score 90 — friendship, support

Today = Parama Mitra Tara (Janma+8): score 95 — best possible star day

tara_position = ((today_nakshatra - janma_nakshatra) mod 27) + 1

nakshatra_score = tara_score_table[tara_position]

Transit Day Quality Sub-Score (25% weight)

Check if any major transiting Graha is within 2° of aspecting native’s Lagna, natal Moon, or Lagna lord. Use Module 7 aspect data.

score = 50   # baseline neutral

for each active_transit_aspect:

if aspecting_planet is functional_benefic: score += 15

if aspecting_planet is functional_malefic: score -= 15

multiply by (ashtakavarga_score / 4) as effectiveness multiplier

Active Dasha Quality Sub-Score (20% weight)

maha_lord_strength = rupas[mahadasha_lord] / threshold[mahadasha_lord]  # ratio

maha_lord_functional = functional_nature_lookup[lagna][mahadasha_lord]

# benefic lord in strong position: score 80-100

# malefic lord or weak planet: score 20-40

# neutral: score 50-65

dasha_score = maha_lord_strength_ratio * functional_weight * 100

## Module 8 — Worship & Remedial Guidance: Triggering Methodology

### 8.5 Worship Recommendation Trigger Pipeline

Step 1 — Identify Weakest Planet via Shadbala

From Module 20 output: find the planet whose Rupas score falls furthest below its minimum threshold. This is the primary candidate for worship recommendation.

weakness_score[planet] = threshold[planet] - rupas[planet]

weakest_planet = planet with maximum positive weakness_score

Step 2 — Identify Active Dasha Lord (Always Gets Worship)

The current Mahadasha lord always receives a worship recommendation as primary guidance, regardless of Shadbala strength. This is foundational Thirukanitham practice.

Step 3 — Check for Active Afflictions

From Module 5 (active Sani cycle lord) and Module 6 (adverse transit — any planet in house 6, 8, or 12 from Moon with Ashtakavarga score ≤ 2): those afflicting planets also receive worship recommendation.

Step 4 — Priority Ranking and Weekday Matching

Priority 1: Current Mahadasha lord. Priority 2: Active Sani cycle affliction planet. Priority 3: Natal weakest planet (Shadbala). Maximum 2 worship recommendations displayed simultaneously. Cross-reference M8.1 table to surface the correct weekday, deity, and practice.

### 8.6 Complete Navagraha Temple Map (Tamil Nadu)

The nine Navagraha temples of Tamil Nadu, matched to their Graha:

Surya (Sun): Suryanar Kovil, Kumbakonam

Chandra (Moon): Thingalur, near Kumbakonam

Sevvai (Mars): Vaitheeswaran Kovil, Sirkazhi

Budha (Mercury): Thiruvendipuram, Cuddalore district

Guru (Jupiter): Alangudi, near Kumbakonam

Sukra (Venus): Kanjanur, near Kumbakonam

Sani (Saturn): Thirunallar, near Karaikal — recommended especially during any active Sani cycle

Rahu: Thiruvenkadu, near Sirkazhi

Ketu: Keezhperumpallam, near Sirkazhi

## Module 19 — Special Events & Tamil Calendar: Personal Significance Methodology

### 19.2 Personal Significance Computation Pipeline

Step 1 — Identify Each Festival’s Astrological Graha and House

Each festival in Module 19’s table has an astronomically significant Graha or Rasi. Example: Thai Pongal = Sun entering Magaram (Rasi 10); Karthigai Deepam = Moon in Karthigai Nakshatra during Pournami.

Step 2 — Compute That Festival’s Graha/House Relationship to Native’s Chart

festival_house_from_lagna = ((festival_rasi - lagna_rasi) mod 12) + 1

festival_house_from_moon = ((festival_rasi - janma_rasi) mod 12) + 1

Step 3 — Score Personal Significance

Festival Graha = current Mahadasha lord → HIGH significance. Personalised message.

Festival Graha = native’s Lagna lord → HIGH significance.

Festival Graha = native’s natal weakest planet → MEDIUM significance. Remedial opportunity.

Festival house = 1st, 5th, or 9th from Lagna → MEDIUM-HIGH. Auspicious period.

Festival house = 6th, 8th, or 12th from Lagna → LOW. Generic message only.

All other cases → LOW / generic significance.

Step 4 — Chithirai Vishu Annual Forecast (Tamil New Year)

On the day Sun enters Mesham (Aries) — Tamil New Year (Chithirai Vishu) — generate an annual solar return analysis. Compute all 9 Graha positions for the exact moment of Sun’s Mesham ingress (using Swiss Ephemeris to find ingress time precisely). Interpret this annual sky snapshot against the native’s natal chart: which houses are activated by the annual transits, which Dasha is running, and what the 12-month outlook suggests. Deliver as the Annual Forecast report for that Tamil year.

## Cross-Module Implementation Rules

### Rules Applicable Across All Modules

The following rules are non-negotiable implementation requirements across every module in the system. They derive from the Tamil Jyothidam Complete Practitioner’s Reference (v2.2.1) and must be enforced at the engine level.

Rule 1 — Three-Lagna Confirmation (Reference §1.4)

All predictions — especially for career, marriage, and health — must be verified from three Lagnas simultaneously: Janma Lagna (Ascendant), Chandra Lagna (Moon as 1st house), and Surya Lagna (Sun as 1st house). If all three agree, the prediction is high-confidence. If two agree, it is moderate. If only one signals an event, qualify the prediction as a tendency rather than a strong indication. Implement a confidence_level field (HIGH / MODERATE / TENDENCY) in all prediction outputs.

Rule 2 — Data Reconciliation Protocol (Reference §1.6)

No module may silently re-derive a value that was already computed by Module 1 and stored in the chart schema. All modules read Tier-1 values from the AstrologyChart data object. If a module’s computation produces a result that conflicts with a stored Tier-1 value, the conflict must be logged and the Tier-1 value must be used — never the re-derived value.

Rule 3 — Functional Benefic/Malefic Override (Reference §4.1)

Every module that interprets a planet’s effects MUST use that planet’s FUNCTIONAL nature for the native’s specific Lagna — not its natural (Naisargika) nature. The functional nature lookup table is defined in reference Section 4.1 and must be implemented as a global lookup accessible by Modules 4, 5, 6, 8, 16, and the interpretation layer. Example: Jupiter is a natural benefic, but for Midhunam Lagna it owns the 7th and 10th (Kendra-only) and carries Kendradhipati Dosha — its functional impact is qualified accordingly.

Rule 4 — Yoga Maturity Qualifier (Reference §15.2.1)

Any module or interpretation function that declares a Yoga must also output: (a) the Yoga-forming planet’s Bala Avastha (degree-based maturity state), (b) whether the Yoga holds in D9 (Navamsa) as well, (c) the specific Dasha window when the Yoga activates. A Yoga without Dasha activation must always be labelled ‘latent potential’ — never as an active influence.

Rule 5 — Tone Governance (Specification Part 7)

No calculation result in any module may be delivered to the user using the prohibited language set defined in Part 7 (‘disaster’, ‘doomed’, ‘bad period’, ‘suffering’, ‘cursed’, ‘malefic’). Every module that generates a caution output must pair it with a corresponding action step and positive framing. This applies without exception — including Sani cycle alerts, Ashtama Guru periods, Ashtakavarga low-score transits, and weak Shadbala results.

| Implementation Note for Developers: Modules M1 (Birth Chart, Steps 1-10) and M3 (Panchangam, Steps 1-11) are the reference implementations for coding standards, QA reference format, and error handling patterns. All new modules in this addendum must match that level of rigor: include worked examples, QA reference values, and explicit failure-mode documentation. The QA checklist from Module 1 (Critical Failure Modes) serves as the template for each module’s own QA validation section, which must be added during implementation. |
| --- |

| PART 9 — ADVANCED CALCULATION ADDENDUM |
| --- |

This part completes remaining calculation gaps identified after Part 8. All rules follow Thirukanitham / Drik Ganita calculation and Tamil Jyothidam interpretation discipline. Consistent with the Birth Chart Engine (M1). Reference authority: Tamil Jyothidam Complete Practitioner’s Reference v2.3 Full Corrected Reprint 2026.

## Module 1 Addendum — Varga (Divisional) Chart Calculation Pipeline

All Varga charts are derived from each planet’s sidereal degree within its Rasi. The formula maps that degree to a new Rasi in the divisional chart. All 9 Grahas + Lagna are computed for each Varga. Varga charts are calculated once at birth chart generation and stored in the chart schema.

### 1.5 Universal Varga Formula

Base Formula for Any D-N Chart

degree_in_rasi = planet_sidereal_degree mod 30   # 0-30 within sign

division_size = 30 / N                            # degrees per division

division_index = floor(degree_in_rasi / division_size)   # 0 to N-1

varga_rasi = ((start_rasi_for_this_sign + division_index - 1) mod 12) + 1

The start_rasi_for_this_sign depends on the Varga type and the planet’s natal Rasi. Each Varga has its own starting-sign rule defined below.

### 1.6 Navamsa (D9) — Soul, Marriage, Vargottama

Division: 30° / 9 = 3.333° per Navamsa (same as Nakshatra Padam). Starting Rasi rule by natal sign group:

Movable signs (Mesha, Kadagam, Thulaam, Magaram): D9 starts from the same sign

Fixed signs (Rishabam, Simmam, Vrichigam, Kumbam): D9 starts from the 9th sign from the natal sign

Dual signs (Midhunam, Kanni, Dhanusu, Meenam): D9 starts from the 5th sign from the natal sign

if movable: start = natal_rasi
if fixed: start = ((natal_rasi + 8 - 1) mod 12) + 1
if dual: start = ((natal_rasi + 4 - 1) mod 12) + 1
navamsa_rasi = ((start + division_index) mod 12); if result is 0 use 12

division_index = 0–8 within the 30° sign. Do not confuse this with Nakshatra Pada 1–4, although each Navamsa is also 3°20'. Vargottama check: if navamsa_rasi == natal_rasi → planet is Vargottama. Store D9 positions in chart schema. D9 Lagna and D9 7th house are mandatory for marriage analysis (M11).

| QA: D9/Navamsa corrected rule. Planet at 43.5° sidereal = Rishabam (2nd sign), degree_in_rasi=13.5°. D9 division=3°20', index=floor(13.5/3.333)=4 using zero-based index. Rishabam is fixed, so D9 starts from the 9th sign from Rishabam = Magaram(10). navamsa_rasi = 10 + 4 = 14 → 2 after modulo 12 = Rishabam. Same as natal sign → Vargottama. Control test: Uthiradam 3rd Padam is Magaram Rasi but Kumbam Navamsa, so it is NOT Vargottama. |
| --- |

### 1.7 Dashamsa (D10) — Career, Professional Life

Division: 30° / 10 = 3° per division. Starting rule:

Odd signs (Mesha, Midhunam, Simmam, Thulaam, Dhanusu, Kumbam): D10 starts at same natal sign

Even signs (Rishabam, Kadagam, Kanni, Vrichigam, Magaram, Meenam): D10 starts at 9th from natal sign (natal_rasi + 8)

start = natal_rasi if odd_sign else ((natal_rasi + 8 - 1) mod 12) + 1

d10_rasi = ((start + division_index - 1) mod 12) + 1

D10 is activated at career age (22–28 band). 10th house lord in D10 and Lagna of D10 are primary indicators for career field and peak professional period.

### 1.8 Saptamsa (D7) — Children, Progeny

Division: 30° / 7 = 4.286° per division.

Odd natal signs: D7 starts at same natal sign

Even natal signs: D7 starts at 7th from natal sign (natal_rasi + 6)

start = natal_rasi if odd_sign else ((natal_rasi + 6 - 1) mod 12) + 1

d7_rasi = ((start + division_index - 1) mod 12) + 1

5th house in D7, Jupiter in D7, and 5th lord in D7 are primary childbirth indicators. Activated at parenthood window (30–45 age band).

### 1.9 Drekana (D3) — Siblings, Courage

Division: 30° / 3 = 10° per division. Three Drekanas per sign:

1st Drekana (0–10°): same natal sign

2nd Drekana (10–20°): 5th from natal sign

3rd Drekana (20–30°): 9th from natal sign

d3_rasi = [natal_rasi, ((natal_rasi+4-1) mod 12)+1, ((natal_rasi+8-1) mod 12)+1][division_index]

### 1.10 Shodashamsa (D16) — Vehicles, Property, Comforts

Division: 30° / 16 = 1.875° per division.

Movable natal signs: D16 starts at Mesha (1)

Fixed natal signs: D16 starts at Simmam (5)

Dual natal signs: D16 starts at Dhanusu (9)

starts = {movable: 1, fixed: 5, dual: 9}

d16_rasi = ((starts[sign_type] + division_index - 1) mod 12) + 1

Activated at vehicle/property acquisition age (28–40). 4th house in D16 rules property; 4th lord strength indicates asset accumulation period.

### 1.11 Trimsamsa (D30) — Misfortune, Chronic Health

D30 uses unequal divisions unique to each sign. The 30° is split into 5 unequal parts assigned to 5 planets (not Sun or Moon):

Odd signs: Mars 0–5° (Mesha/1), Saturn 5–10° (Kumbam/11), Jupiter 10–18° (Dhanusu/9), Mercury 18–25° (Midhunam/3), Venus 25–30° (Thulaam/7)

Even signs: Venus 0–5° (Thulaam/7), Mercury 5–12° (Kanni/6), Jupiter 12–20° (Meenam/12), Saturn 20–25° (Magaram/10), Mars 25–30° (Vrichigam/8)

# For odd natal signs:

boundaries = [(5,1),(10,11),(18,9),(25,3),(30,7)]

d30_rasi = next(rasi for (limit,rasi) in boundaries if degree_in_rasi < limit)

Lagna of D30 and 6th/8th lords in D30 indicate chronic health vulnerabilities. Used by M13 (Health Monitor) for long-term preventive nudges.

### 1.12 Ashtamsa (D8) — Longevity, Elder Life

Division: 30° / 8 = 3.75° per division.

Movable natal signs: D8 starts at same natal sign

Fixed natal signs: D8 starts at 9th from natal sign

Dual natal signs: D8 starts at 5th from natal sign

starts = {movable: natal_rasi, fixed: ((natal_rasi+8-1) mod 12)+1, dual: ((natal_rasi+4-1) mod 12)+1}

d8_rasi = ((starts[sign_type] + division_index - 1) mod 12) + 1

Activated after age 60. 8th house in D8 and Saturn placement indicate longevity quality. Lagna lord of D8 shows the nature of elder years.

## Module 1 Addendum — Graha Avastha (Planetary State Modifiers)

Avasthas define how a planet DELIVERS its results — not whether it is strong, but in what mode it acts. Every Yoga quality assessment and Dasha interpretation must apply the relevant Avastha before finalising output. Two Avastha systems are used in Thirukanitham: Bala Avasthas (age-based) and Jagradi Avasthas (consciousness-based).

### Bala Avasthas — Degree-Based Age States

Each planet occupies one of five age states based on its degree within the Rasi. Applied to all Yoga declarations (Yoga Maturity Qualifier in M16 Step 8) and Dasha interpretation.

Bala (Infant, 0–6°): Planet immature — delivers results weakly, inconsistently, or not until later life. Flag as delayed Yoga.

Kumara (Youth, 6–12°): Partial delivery — results come but unevenly. Growing phase.

Yuva (Adult, 12–18°): FULL STRENGTH — planet at peak. Best Yoga and Dasha delivery. Highlighted in chart readout.

Vriddha (Old, 18–24°): Declining — results come but with diminishing returns. Experienced but slower.

Mrita (Dead, 24–30°): Exhausted — planet gives minimal results. Treat as weakened in Dasha quality.

degree_in_rasi = planet_sidereal_degree mod 30

avastha = ['Bala','Kumara','Yuva','Vriddha','Mrita'][floor(degree_in_rasi / 6)]

Exception: Retrograde planets are treated as Yuva regardless of degree — retrograde motion restores full Cheshta Bala.

### Jagradi Avasthas — Consciousness States by House Group

Jagrat (Awake, full output): Planet in Kendra (1,4,7,10) — maximum delivery

Swapna (Dreaming, partial output): Planet in Trikona (5,9) or Upachaya (3,6,11) — moderate delivery

Sushupti (Sleeping, minimal output): Planet in Dushthana (6,8,12) or Apoklima (3,6,12) — suppressed delivery

jagrat_houses = [1,4,7,10]

swapna_houses = [2,5,9,11]

sushupti_houses = [3,6,8,12]

Combined Avastha output rule: Yuva + Jagrat = maximum result. Mrita + Sushupti = planet effectively non-functional in that Dasha. Store both avastha values per planet in the chart schema for use by M4 (Dasha quality), M16 (Yoga Maturity), and the Interpretation layer.

## Module 1 Addendum — Functional Benefic/Malefic Lookup Table

This table is the authoritative data source for Cross-Module Rule 3. All modules that interpret a planet’s effect must look up the planet’s FUNCTIONAL nature for the native’s Lagna before assigning positive or negative tone. Natural (Naisargika) nature is overridden by this functional classification. YK = Yogakaraka (peak functional benefic). FB = Functional Benefic. FM = Functional Malefic. MX = Mixed/Neutral. MK = Maraka (death-inflicting in old age/ill health).

### Functional Nature by Lagna — All 12 Lagnas

Mesha (Aries)

Functional Benefics: Sun(FB-5L), Jupiter(FB-9L), Mars(FB-1L+8L), Moon(MX-4L)

Functional Malefics: Mercury(FM-3L+6L), Saturn(MX-10L+11L)

Special: Venus(MK-2L+7L)

Rishabam (Taurus)

Functional Benefics: Saturn(YK-9L+10L), Mercury(FB-2L+5L), Sun(FB-4L)

Functional Malefics: Jupiter(FM-8L+11L), Mars(FM-7L+12L)

Special: Moon(MX-3L)

Midhunam (Gemini)

Functional Benefics: Venus(FB-5L+12L), Saturn(MX-8L+9L), Mercury(FB-1L+4L)

Functional Malefics: Mars(FM-6L+11L), Jupiter(MX-7L+10L)

Special: None single YK

Kadagam (Cancer)

Functional Benefics: Mars(YK-5L+10L), Moon(FB-1L), Jupiter(MX-6L+9L)

Functional Malefics: Mercury(FM-3L+12L), Saturn(FM-7L+8L)

Special: Venus(MK-4L+11L)

Simmam (Leo)

Functional Benefics: Mars(YK-4L+9L), Sun(FB-1L), Jupiter(FB-5L+8L)

Functional Malefics: Mercury(FM-2L+11L), Venus(MX-3L+10L)

Special: Saturn(FM-6L+7L)

Kanni (Virgo)

Functional Benefics: Mercury(FB-1L+10L), Venus(FB-2L+9L)

Functional Malefics: Mars(FM-3L+8L), Jupiter(MX-4L+7L)

Special: Moon(FM-11L)

Thulaam (Libra)

Functional Benefics: Saturn(YK-4L+5L), Mercury(FB-9L+12L), Venus(FB-1L+8L)

Functional Malefics: Jupiter(FM-3L+6L), Mars(FM-2L+7L)

Special: Sun(FM-11L)

Vrichigam (Scorpio)

Functional Benefics: Moon(FB-9L), Jupiter(FB-2L+5L), Sun(FB-10L), Mars(FB-1L+6L)

Functional Malefics: Venus(FM-7L+12L), Mercury(FM-8L+11L)

Special: Saturn(MX-3L+4L)

Dhanusu (Sagittarius)

Functional Benefics: Mars(FB-5L+12L), Sun(FB-9L), Jupiter(FB-1L+4L)

Functional Malefics: Venus(FM-6L+11L), Saturn(MX-2L+3L)

Special: Mercury(MK-7L+10L)

Magaram (Capricorn)

Functional Benefics: Venus(YK-5L+10L), Mercury(MX-6L+9L), Saturn(FB-1L+2L)

Functional Malefics: Mars(MX-4L+11L), Jupiter(FM-3L+12L)

Special: Moon(MK-7L)

Kumbam (Aquarius)

Functional Benefics: Venus(YK-4L+9L), Mars(FB-3L+10L), Saturn(FB-1L+12L)

Functional Malefics: Jupiter(FM-2L+11L), Moon(FM-6L)

Special: Mercury(MX-5L+8L)

Meenam (Pisces)

Functional Benefics: Moon(FB-5L), Mars(FB-2L+9L), Jupiter(FB-1L+10L)

Functional Malefics: Saturn(FM-11L+12L), Venus(FM-3L+8L)

Special: Mercury(MK-4L+7L)

Implementation note: Store this as a constant lookup dict keyed by lagna_rasi (1–12) → planet → nature string. All modules read from this dict. Rahu/Ketu inherit the functional nature of their dispositor (sign lord) and any conjunct planet.

## Module 16 Addendum — Additional Yoga Detection Formulas

### 16.3 Dhana Yoga Detection (Wealth Accumulation Combinations)

Dhana Yogas form when lords of wealth houses (2nd, 11th) connect with the Lagna lord or each other. They indicate financial accumulation during their Dasha activation periods.

Primary Dhana Yoga Conditions (any one sufficient):

lord_2 = rasi_lord(house 2 from lagna)

lord_11 = rasi_lord(house 11 from lagna)

lord_1 = rasi_lord(lagna_rasi)

# Condition A: 2nd and 11th lords conjunct or mutually aspect

if rasi[lord_2] == rasi[lord_11]: Dhana Yoga (conjunction)

if house_distance(lord_2, lord_11) == 7: Dhana Yoga (mutual aspect)

# Condition B: Lagna lord joins 2nd or 11th lord

if rasi[lord_1] == rasi[lord_2] or rasi[lord_1] == rasi[lord_11]: Dhana Yoga

# Condition C: 2nd or 11th lord in Kendra/Trikona, well-dignified

if house[lord_2] in [1,4,7,10,5,9] and dignity[lord_2] >= OWN_SIGN: Dhana Yoga

Strongest Dhana Yoga: Lagna lord + 2nd lord + 11th lord all connected (triple Dhana Yoga). Activation Dasha: any of the three involved lords. Functional benefic status (from lookup table) required for full wealth delivery.

### 16.4 Parivartana Yoga Detection (Sign Exchange)

Parivartana (exchange) occurs when planet A is in planet B’s own sign AND planet B is in planet A’s own sign. The two planets mutually activate each other’s houses with full power — among the strongest Yoga types.

for planet_A, planet_B in all_planet_pairs:

if rasi[planet_A] in own_signs[planet_B] and rasi[planet_B] in own_signs[planet_A]:

Parivartana Yoga between A and B

Maha Parivartana: Both planets in Kendra or Trikona houses — very powerful Raja Yoga equivalent

Kahala Parivartana: One planet in Dushthana — creates obstacles but eventual breakthrough

Dainya Parivartana: Both planets in Dushthana — problematic, requires careful interpretation

Activation: Both planets’ Dashas activate the Yoga. The house each planet occupies gets the results of the house it rules, creating double house activation.

### 16.5 Chandra Mangala Yoga (Business Acumen)

# Conjunction: Moon and Mars in same Rasi

if rasi[MOON] == rasi[MARS]: Chandra Mangala Yoga

# Mutual aspect (7th from each other)

if ((house[MOON] + 6) mod 12) + 1 == house[MARS]: Chandra Mangala Yoga (aspect)

Indicates commercial instinct, ability to handle money and people simultaneously, drive combined with emotional intelligence. Most effective when Moon is waxing (Shukla Paksha) and Mars is in own sign or exaltation. Dasha activation: Moon Mahadasha or Mars Antardasha (and vice versa) activates financial drive.

### 16.6 Kesari Yoga vs Gaja Kesari Yoga — Distinction

These are distinct Yogas and must NOT be conflated:

Kesari Yoga: Jupiter in Kendra (1,4,7,10) from LAGNA. Gives wisdom, fame, strong character. Independent of Moon position.

Gaja Kesari Yoga: Jupiter in Kendra (1,4,7,10) from MOON. The more celebrated Tamil Yoga — gives public recognition, prosperity, and compassion. Already computed in M16 Step 3.

# Kesari Yoga

kesari = house[JUPITER] in [1,4,7,10]   # from Lagna

# Gaja Kesari Yoga

gk_pos = ((rasi[JUPITER] - rasi[MOON]) mod 12) + 1

gaja_kesari = gk_pos in [1,4,7,10]       # from Moon

Both can co-exist. When Jupiter is in Kendra from both Lagna and Moon simultaneously — flag as Gaja Kesari + Kesari double Yoga. Strongest expression of Jupiter’s benefic power.

### 16.7 Additional Wealth and Dharma Yogas

Lakshmi Yoga

9th lord in own sign or exaltation AND in Kendra from Lagna. Powerful fortune and divine grace indicator.

lord_9 = rasi_lord(house 9 from lagna)

if dignity[lord_9] in [EXALTED, OWN, MOOLATRIKONA] and house[lord_9] in [1,4,7,10]: Lakshmi Yoga

Saraswati Yoga

Jupiter, Venus, and Mercury all in Kendra, Trikona, or 2nd house from Lagna. Exceptional intelligence, learning, and creative expression.

if all(house[p] in [1,2,4,5,7,9,10] for p in [JUPITER,VENUS,MERCURY]): Saraswati Yoga

Amala Yoga

A natural benefic (Jupiter, Venus, unafflicted Mercury, waxing Moon) in the 10th house from Lagna OR Moon (whichever applies). Spotless reputation, ethical career, lasting fame.

benefics = [JUPITER, VENUS, MERCURY, MOON]

if any(house[p] == 10 and is_natural_benefic(p) and not is_combust(p) for p in benefics): Amala Yoga

## QA Validation Reference Values — Modules 6, 7, 11, 14, 15, 16, 20

Each module requires a developer-executable QA reference. Use the same base chart: Native born 15 March 1993, 08:15 IST, Coimbatore. From M1: Lagna = Midhunam (3), Moon = Kanni (6), Janma Nakshatra = Chitta (14), Sun = Meenam (12), Mars = Midhunam (3), Jupiter = Thulaam (7), Saturn = Makaram (10), Rahu = Vrichigam (8).

### M6 Transit QA — Jupiter currently in Rishabam (2)

| jupiter_transit_rasi=2 (Rishabam). janma_rasi (Moon)=6 (Kanni). house_from_moon = ((2-6) mod 12)+1 = ((-4) mod 12)+1 = 8+1 = 9. Jupiter in 9th from Moon = VERY AUSPICIOUS. Bhagya peak, fortune, guru blessings. house_from_lagna = ((2-3) mod 12)+1 = 11+1 = 12. Jupiter in 12th from Lagna = expenditure, spiritual. Mixed secondary signal. Overall: primary signal (from Moon) = auspicious. Qualify: some expenditure tendency. Ashtakavarga score for Jupiter transiting house 9 from Lagna must be fetched from stored chart. |
| --- |

### M7 Live Feed QA — Aspect Detection

| Natal Mars at Midhunam (3), 15° within sign = degree 75° sidereal. Transit Saturn at Makaram (10) = approx 285° sidereal. angular_sep = \|75 - 285\| = 210°. Saturn special aspect at 210° (8th = Mars aspect). 210° is Saturn’s 8th house special aspect? No — Saturn special aspects: 3rd(90°) and 10th(270°). Correct: 210° does NOT match Saturn’s special aspects. No aspect flagged. Check 7th (180°): \|210-180\|=30 > 2° orb. No aspect. Correct output: no active aspect. |
| --- |

### M11 Marriage QA — Kuta Matching

| Girl: Rohini (4). Boy: Mrigashira (5). Dinam: count=((4-5) mod 27)+1=27. Is 27 in auspicious list? No (list: 2,4,6,8,9,11,13,15,18,20,24,26). Score=0. Gana: Rohini=Manushya. Mrigashira=Deva. Boy=Deva, Girl=Manushya → Score=3. Rajju: Rohini=Kanta. Mrigashira=Siro. Different Rajju groups → PASS. Vedha: Pair (4,14)? Rohini=4, Mrigashira=5. Not a Vedha pair → PASS. Nadi: Rohini=Pitta. Mrigashira=Vata. Different Nadi → No Nadi Dosha. Rajju PASS + Vedha PASS + no Nadi Dosha. Compute remaining Kutas for total score. |
| --- |

### M14 Muhurtham QA — Candidate Elimination

| Candidate date: Wednesday, Tithi=Ashtami(8), Nakshatra=Chitta(14), Yoga=Siddhi(21). Purpose: Marriage. Filter 1: Tithi=8 (Ashtami) for marriage → ELIMINATED. Hard filter triggered. Even if all other factors perfect, this date is rejected for marriage. Correct output: date removed from candidate pool. Reason: Ashtami Tithi (inauspicious for marriage). |
| --- |

### M15 Ashtakavarga QA — Sarvashtakavarga

| For the reference chart, Sun at Meenam (12), house 10 from Lagna. Sun’s Bhinnashtakavarga contribution to house 10: add up contributions from all 8 reference points using the Sun Bhinnashtakavarga table. Validate: total Sarvashtakavarga for house 10 should be in range 25-35 for a typical chart. If any house scores below 15 or above 45, re-check the bindu tables. Sum of all Sarvashtakavarga across 12 houses must equal 337 (fixed total for 7-planet system). |
| --- |

### M16 Yoga QA — Reference Chart

| Reference chart Lagna=Midhunam(3). Jupiter in Thulaam(7) = house 5 from Lagna. Gaja Kesari: Jupiter_rasi=7, Moon_rasi=6. gk_pos=((7-6) mod 12)+1=2. Not Kendra → No Gaja Kesari. Kesari Yoga: Jupiter in house 5 from Lagna → Not Kendra → No Kesari Yoga. Pancha Mahapurusha Hamsa: Jupiter in Thulaam = enemy sign, not own/exalt → No Hamsa Yoga. Mars in Midhunam (Lagna) = house 1 = Kendra, but Midhunam not Mars own/exalt sign → No Ruchaka. Correct output: No Pancha Mahapurusha Yogas in this reference chart. |
| --- |

### M20 Shadbala QA — Dig Bala Check

| Jupiter at Thulaam (7) = house 5 from Lagna (Midhunam). Jupiter’s Dig Bala peak is at 1st house (Lagna cusp). House 5 is 4 houses away from house 1. Approximate Dig Bala: angular_diff from Lagna cusp ≈ 4 x 30° = 120°. dig_bala = (180-120)/3 = 60/3 = 20 Shashtiamsas. Moderate directional strength. Jupiter at Lagna (house 1) would give 60 Shashtiamsas (maximum). At 7th house (opposite) = 0 Shashtiamsas (minimum). |
| --- |

## Module 12 Addendum — Career Timing Window Computation Pipeline

M12.1–12.3 define what career indicators mean. This addendum defines HOW to compute and rank favorable career windows across a date range — using the same pattern as M14 Muhurtham.

### 12.4 Career Timing Computation Pipeline

Step 1 — Identify Primary Career Indicators from Natal Chart

lord_10 = rasi_lord(house 10 from lagna)

lord_1 = rasi_lord(lagna_rasi)

lord_9 = rasi_lord(house 9 from lagna)   # fortune lord

career_planets = [lord_10, lord_1, SUN]  # primary career lords

Step 2 — Score Active Career Period

score = 0

# Mahadasha of 10th lord: +40 points

if current_maha_lord == lord_10: score += 40

# Antardasha of 10th lord within any Mahadasha: +25 points

if current_antar_lord == lord_10: score += 25

# Jupiter transiting 10th from Lagna or Moon: +20 points

if jupiter_house_from_lagna == 10 or jupiter_house_from_moon == 10: score += 20

# Saturn transiting 10th from Lagna (Upachaya - career pressure/growth): +10

if saturn_house_from_lagna == 10: score += 10

# Sun transiting 10th house (monthly peak window): +5

if sun_house_from_lagna == 10: score += 5

Step 3 — Business vs Service Indicator

Check natal 10th house and Dashamsa (D10) for orientation:

Mars, Sun, or Rahu in 10th: leadership, independent practice, entrepreneurship

Mercury, Jupiter in 10th: service, advisory, teaching, institutional role

Saturn in 10th: service sector, long tenured roles, government

D10 Lagna lord in own sign or exaltation: career field peaks in that planet’s domain

Step 4 — Promotion Window Detection

A promotion window is flagged when ALL THREE of the following are true simultaneously:

promotion_window = (

(current_maha_lord in career_planets or current_antar_lord in career_planets)

AND (jupiter_house_from_lagna in [1,5,9,10,11])

AND (saturn_not_afflicting_10th_lord)

)

Step 5 — Business Launch Best Period

Optimal business launch: 10th lord Dasha + Jupiter transiting 10th or 11th from Lagna + Ashtakavarga score of 10th house ≥ 30 in Sarvashtakavarga. Avoid: Ketu Mahadasha (detachment), Saturn in 8th from Lagna (obstacle), or 10th lord combust.

## Module 17 Addendum — Cross-Chart Synastry Calculation

Synastry between two family members’ charts uses house overlay analysis. This is distinct from Kuta matching (which uses Nakshatras) — synastry uses planetary placements.

### 17.4 Inter-Chart Synastry Pipeline

Step 1 — House Overlay (Person A’s Lagna as Reference)

for each planet P in Person_B_chart:

overlay_house = ((P_rasi - A_lagna_rasi) mod 12) + 1

# This shows which house of A is activated by B's planet

Benefic planets of B falling in 1,4,5,7,9,10,11 of A = supportive relationship. Malefic planets of B falling in 6,8,12 of A = friction/challenge in that life area.

Step 2 — Reverse Overlay (Person B’s Lagna as Reference)

for each planet P in Person_A_chart:

overlay_house = ((P_rasi - B_lagna_rasi) mod 12) + 1

Both overlays must be computed and compared. Mutual 7th-house activations = strong partnership axis. Mutual 5th-house activations = creative/child connection.

Step 3 — Key Synastry Signatures for Family Relationships

Parent-Child: Parent’s Jupiter falling in Child’s 5th or 9th = strong dharmic bond. Child’s Moon in Parent’s 4th = emotional security.

Siblings: Mutual 3rd house activations. Mars of one in 3rd of other = competitive but loyal energy.

Spouses: Each partner’s Venus falling in the other’s 1st, 5th, or 7th = romantic harmony.

Conflict indicator: One person’s Saturn falling in another’s 1st or 7th = authority tension; reframe as structure rather than burden.

Step 4 — Shared Favorable Windows (Family Calendar)

family_favorable_day = True

for each member in family_vault:

member_day_score = compute_day_rating(member, today)

if member_day_score < 50: family_favorable_day = False

A day is flagged as ‘family auspicious’ only when ALL members score above 50 in their daily rating. Used for shared decisions: travel, investments, rituals, celebrations.

## Module 1 Addendum — Jaimini Chara Karaka Calculation

Jaimini Karakas are listed in M1.3 (Key Calculated Elements) but have no formula. These are 8 chart-specific significators derived from planetary degrees within their signs. They add a second layer of life-theme analysis on top of the Parashari system.

### Chara Karaka Assignment Pipeline

Step 1 — Get Degree Within Sign for All 7 Planets (Excluding Rahu/Ketu)

for planet in [SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN]:

degree_in_sign[planet] = planet_sidereal_degree mod 30

Step 2 — Rank Planets by Degree (Highest to Lowest)

ranked = sorted(planets, key=lambda p: degree_in_sign[p], reverse=True)

The planet with the HIGHEST degree within its sign = Atmakaraka (soul significator — most important). The planet with the LOWEST degree = Darakaraka (spouse significator). Rahu is included in an 8-planet version (subtract Rahu’s degree from 30 for ranking).

Step 3 — Assign Karaka Roles in Rank Order

1st (highest degree): Atmakaraka (AK) — Soul, dharma, the self’s deepest purpose

2nd: Amatyakaraka (AmK) — Career, minister to the soul, profession

3rd: Bhratrukaraka (BK) — Siblings, courage

4th: Matrukaraka (MK) — Mother, home, property

5th: Pitrukaraka (PK) — Father, children, past merit

6th: Gnatikaraka (GK) — Competition, disease, extended family

7th (lowest degree): Darakaraka (DK) — Spouse, partnerships

karakas = dict(zip(['AK','AmK','BK','MK','PK','GK','DK'], ranked))

Step 4 — Karakamsa Lagna (Soul Indicator for Life Path)

The Navamsa sign occupied by the Atmakaraka = Karakamsa Lagna. This is the most important Jaimini indicator for life purpose and spiritual path.

karakamsa_lagna = navamsa_rasi[atmakaraka]   # from D9 chart

The 12th from Karakamsa Lagna = Ishtadevata (personal deity). The 5th from Karakamsa = children and intelligence themes. The 10th from Karakamsa = career dharma. These are stored in chart schema and used by M9 (Life Stage) and M12 (Career) for additional depth.

## Module 19 Addendum — Tajaka Varsha Phala (Annual Chart System)

The Tajaka (annual chart) is generated every year on the native’s solar return — the exact moment the Sun returns to its natal degree. This annual chart overlays the natal chart to give a 12-month predictive window. Generated automatically as the ‘Tamil New Year Annual Forecast’ (Chithirai Vishu) and on the native’s birthday.

### Annual Chart Calculation Pipeline

Step 1 — Find Solar Return Moment (Varsha Pravesh)

natal_sun_degree = stored from M1 chart calculation

# Find the moment in the current year when Sun returns to exact natal degree

jd_solar_return = swe.rise_trans equivalent for Sun reaching natal_sun_degree

# Use: swe.solcross(natal_sun_degree, jd_estimate, FLG_SIDEREAL)

The solar return moment is precise to the minute. All annual chart planets are calculated for this exact JD using the native’s birth location.

Step 2 — Compute All 9 Graha Positions for Solar Return Moment

Run the same pipeline as M1 Steps 1–6 with jd=jd_solar_return instead of birth JD. This produces the Tajaka (annual) chart with all planet positions and Lagna for that moment.

Step 3 — Muntha (Annual Progressed Lagna)

Muntha is a special sensitive point that moves one sign per year from the natal Lagna.

muntha_rasi = ((lagna_rasi + current_age_years - 1) mod 12) + 1

The house Muntha occupies in the natal chart and its lord indicate the dominant annual theme. Muntha in 1,4,5,7,9,10,11 = favorable year theme. Muntha in 6,8,12 = challenging annual theme requiring extra care.

Step 4 — Varsha Lord (Year Ruler)

The Tajaka year lord is determined by which planet owns the solar return Lagna. That planet rules the year’s overall tone.

varsha_lord = rasi_lord(tajaka_lagna_rasi)

Cross-reference varsha_lord with natal chart strength. A naturally strong varsha_lord (well-placed in natal chart) = good year even if transit positions are mixed.

Step 5 — 12-Month Quarterly Breakdown

Divide the annual chart into 4 quarters of 3 months each. For each quarter, compute which natal houses are activated by the progressing Moon in the Tajaka chart. Month 1–3: Tajaka Moon transiting first quadrant from Tajaka Lagna. Month 4–6: Second quadrant. Month 7–9: Third. Month 10–12: Fourth. Combine with native’s Vimshottari Antardasha running in that quarter for compound timing.

## Module 1 Addendum — Bhava Chart (Bhava Madhya) Calculation

The standard Thirukanitham South Indian chart uses Whole Sign houses (one Rasi = one house). The Bhava Chart uses the exact degree of each house cusp (Bhava Madhya = house midpoint) for more precise house boundary readings. Required for Shadbala Dig Bala calculation (M20 Step 2) and for KP-adjacent precision analysis.

### Bhava Madhya Calculation Pipeline

Step 1 — Compute Ascendant Degree and Optional Bhava Cusps; Whole Sign Remains Primary

Swiss Ephemeris function already used in M1 Step 4 returns house cusps:

cusps, ascmc = swe.houses_ex(jd, lat, lon, b'P', swe.FLG_SIDEREAL)

# cusps[1..12] = exact sidereal degrees of all 12 house cusps

# ascmc[0] = Ascendant (Lagna degree)

Step 2 — Compute Bhava Madhya (Midpoint of Each House)

for house in 1..12:

bhava_madhya[house] = (cusps[house] + cusps[house+1]) / 2   # mod 360

Bhava Madhya is the exact degree at the centre of each house. Planets within 5° of a Bhava Madhya are considered most powerfully placed in that house — they deliver that house’s results at maximum intensity.

Step 3 — Bhava Sandhi (House Junction) Detection

A planet within 2° of a house cusp boundary is in Bhava Sandhi — weakened, standing between two houses.

for planet in all_planets:

for cusp_degree in cusps[1..12]:

if abs(planet_degree - cusp_degree) <= 2: mark as Bhava_Sandhi

Bhava Sandhi planets deliver results of neither house cleanly. Flag in chart readout with qualifier: ‘This planet is at the junction of houses X and Y — its house results are mixed.’

Step 4 — Whole Sign vs Bhava Chart Conflict Resolution

Thirukanitham uses Whole Sign as the primary house system. Bhava Chart is used as a secondary precision layer, not as a replacement. Rule: If a planet is in house N by Whole Sign but closer to Bhava Madhya of house N+1 or N-1, note the ambiguity. Primary interpretation uses Whole Sign. Bhava Chart adds nuance where results seem inconsistent.

## Module 13 Addendum — Age-Escalation Rules for Health Nudges

Health nudges from M13 must be age-weighted. The same planetary affliction carries different urgency at age 30 vs age 60. This table defines the age multiplier applied to each planet’s health domain trigger intensity.

### 13.3 Age-Weight Multiplier by Planet and Life Stage

Surya (Sun) — Heart, Spine, Eyes, Vitality

Age 0–25: Low escalation (constitutional tendency, lifestyle note only)

Age 26–45: Medium escalation (annual eye and cardiac screening recommended)

Age 46+: HIGH escalation (proactive cardiac, bone density, vision alerts)

Chandra (Moon) — Mind, Blood, Lymphatic, Female Hormones

Age 0–18: Medium (emotional wellbeing, sleep nudge)

Age 19–45: Medium-High (hormonal health, mental wellness especially during Chandra Dasha)

Age 46+: High for females (hormonal transition awareness), medium for males

Sevvai (Mars) — Blood, Muscles, Accidents, Surgery Risk

Age 15–35: HIGH (peak physical risk period — sports injuries, impulsive decisions)

Age 36–55: Medium (inflammation, blood pressure)

Age 56+: Low-medium (watch for old injury resurgence during Mars periods)

Guru (Jupiter) — Liver, Fat, Diabetes, Arteries

Age 0–35: Low (metabolic tendency, dietary note)

Age 36–55: Medium-High (diabetes screening, liver function during Guru periods)

Age 56+: HIGH (arterial health, cholesterol, weight management)

Sani (Saturn) — Bones, Joints, Teeth, Nerves, Chronic Conditions

Age 0–30: Low (posture and foundation)

Age 31–50: Medium (dental, joint health, vitamin D)

Age 51+: HIGH (bone density, arthritis prevention, nerve health — especially during Sani Dasha or Ezhara Sani)

Budha (Mercury) — Nervous System, Skin, Thyroid, Speech

Any age: Medium when Mercury is retrograde natally or in adverse transit

Age 40+: Escalate thyroid screening nudge during Budha Mahadasha

Sukra (Venus) — Kidneys, Reproductive System, Diabetes

Age 18–45: Medium-High (reproductive health, kidney function)

Age 45+: Medium (kidney health, diabetes tendency especially if Jupiter also afflicted)

Rahu — Unusual/Hidden Conditions, Skin, Neurological

Any age: Trigger screening nudge during Rahu Mahadasha for hidden or misdiagnosed conditions

Note to user: ‘Rahu periods can sometimes bring atypical symptoms. If something feels unusual, get it checked.’

Ketu — Mysterious/Undiagnosed, Viral, Wounds

Any age: Trigger during Ketu Mahadasha — ‘Ketu periods sometimes surface conditions that were undetected. A comprehensive health check is practical preventive care.’

age_multiplier = age_weight_table[planet][current_age_band]   # LOW=0.5, MED=1.0, HIGH=1.5

nudge_score = base_affliction_score * age_multiplier

if nudge_score > threshold: send health nudge (max 1 per week per planet)

## Cross-Module Addendum — Surya Lagna Interpretation Rules

Cross-Module Rule 1 requires predictions to be verified from three Lagnas: Janma Lagna, Chandra Lagna, and Surya Lagna. Janma Lagna and Chandra Lagna rules are defined throughout the spec. This section defines how Surya Lagna is applied.

### Surya Lagna as Third Reference Frame

Surya Lagna = treat the Sun’s natal Rasi as the 1st house. Count all 12 houses from the Sun’s sign. This frame reveals soul dharma, authority, father’s influence, and how the native is perceived in their career/public life.

surya_lagna_rasi = rasi[SUN]   # from M1 output

house_from_surya[planet] = ((rasi[planet] - surya_lagna_rasi) mod 12) + 1

Surya Lagna Usage Rules by Module

M12 Career: 10th from Surya Lagna shows how the native is seen in their profession. If 10th from all three Lagnas is strong — career peak is confirmed with HIGH confidence.

M11 Marriage: 7th from Surya Lagna shows partner relationship from soul-level dharma perspective. Confirms or qualifies 7th from Janma and Chandra Lagnas.

M9 Life Stage: Surya Lagna 9th house lord Dasha = peak dharma/fortune period. Aligns with father’s legacy and spiritual development timing.

M6 Transit: Jupiter transiting 9th or 10th from Surya Lagna = added career/fortune boost (secondary confirmation alongside primary Moon-based transit reading).

Confidence scoring: if career signal strong from Janma Lagna only → TENDENCY. From Janma + Chandra → MODERATE. From all three → HIGH.

## Module 1 Addendum — Gandanta and Special Nakshatra Flags

Certain Nakshatra positions carry special significance in Thirukanitham and must be flagged in the chart readout.

### Gandanta — Dangerous Junction Degrees

Gandanta occurs at the junction of water signs and the following fire signs: Meenam→Mesham, Kadagam→Simmam, and Vrichigam→Dhanusu. The last 3°20' of the water sign and first 3°20' of the following fire sign form the Gandanta zone. Planets or the Lagna in Gandanta require careful, constructive handling.

gandanta_zones = [

(356.6667, 360.0000), (0.0000, 3.3333),        # Meenam -> Mesham

(116.6667, 120.0000), (120.0000, 123.3333),    # Kadagam -> Simmam

(236.6667, 240.0000), (240.0000, 243.3333),    # Vrichigam -> Dhanusu

]

if any(low <= planet_degree <= high for (low,high) in gandanta_zones): flag GANDANTA

Moon in Gandanta at birth: flag for parents with supportive note. Lagna in Gandanta: personality integration challenge — self-discovery is a lifelong theme. Frame always constructively: ‘Gandanta Moon indicates a soul undergoing deep transformation — this brings exceptional depth and resilience when channelled consciously.’

### Pushkara Navamsa and Pushkara Bhaga

Pushkara Navamsa: Certain Navamsa positions are considered especially auspicious — they ‘nourish’ the planet. A planet in Pushkara Navamsa delivers its best results regardless of other afflictions.

Pushkara Navamsa signs (D9 signs considered Pushkara): Rishabam (2), Midhunam (3), Simmam (5), Kanni (6), Thulaam (7), Dhanusu (9), Magaram (10), Kumbam (11).

pushkara_navamsa_signs = [2,3,5,6,7,9,10,11]

if navamsa_rasi[planet] in pushkara_navamsa_signs: flag PUSHKARA_NAVAMSA

Pushkara Bhaga: Specific degrees within each Rasi that are exceptionally auspicious. Mesha=21°, Rishabam=14°, Midhunam=7°, Kadagam=12°, Simmam=6°, Kanni=22°, Thulaam=7°, Vrichigam=20°, Dhanusu=14°, Magaram=5°, Kumbam=17°, Meenam=19°.

if abs(degree_in_rasi[planet] - pushkara_bhaga[natal_rasi]) <= 1: flag PUSHKARA_BHAGA

## Module 1 Addendum — Graha Sambandham (Planetary Relationship Computation)

Graha Sambandham (planetary connections) determines how planets influence each other in the chart. Used by M16 (Yoga detection), M20 (Drik Bala), and the Interpretation layer.

### Relationship Types and Detection

Yuti (Conjunction)

yuti = (rasi[A] == rasi[B])   # same sign = conjunction

Planets in Yuti share results and modify each other. Natural benefic + natural malefic conjunct — results are mixed. Both same nature — results amplified.

Drishti (Mutual Aspect)

distance_A_to_B = ((house[B] - house[A]) mod 12) + 1

distance_B_to_A = ((house[A] - house[B]) mod 12) + 1

A_aspects_B = distance_A_to_B in aspect_houses[A]

B_aspects_A = distance_B_to_A in aspect_houses[B]

mutual_aspect = A_aspects_B and B_aspects_A

Mutual aspect creates a connection similar in strength to conjunction. Jupiter and Saturn mutual aspect is especially significant — creates tension between expansion and contraction that produces disciplined achievement.

Parivartana (Sign Exchange) — already in M16.4

Strongest connection type. Treated as if both planets are in their own sign in each other’s house.

Naisargika Maitri (Natural Friendship Lookup Table)

Determines whether two planets are naturally friendly, neutral, or inimical. Used in Sthana Bala computation and Graha Sambandham interpretation.

Sun: Friends=Moon,Mars,Jupiter. Neutral=Mercury. Enemies=Venus,Saturn.

Moon: Friends=Sun,Mercury. Neutral=Mars,Jupiter,Venus,Saturn. Enemies=None.

Mars: Friends=Sun,Moon,Jupiter. Neutral=Venus,Saturn. Enemies=Mercury.

Mercury: Friends=Sun,Venus. Neutral=Mars,Jupiter,Saturn. Enemies=Moon.

Jupiter: Friends=Sun,Moon,Mars. Neutral=Saturn. Enemies=Mercury,Venus.

Venus: Friends=Mercury,Saturn. Neutral=Mars,Jupiter. Enemies=Sun,Moon.

Saturn: Friends=Mercury,Venus. Neutral=Jupiter. Enemies=Sun,Moon,Mars.

Tatkalika Maitri (Temporary Friendship — Chart-Based)

In addition to natural friendship, planets in the 2nd, 3rd, 4th, 10th, 11th, or 12th from each other are TEMPORARILY friendly in this chart. Planets in 1st, 5th, 6th, 7th, 8th, 9th = temporarily inimical.

temp_friend_houses = [2,3,4,10,11,12]

distance = ((rasi[B] - rasi[A]) mod 12) + 1

tatkalika = 'friend' if distance in temp_friend_houses else 'enemy'

Pancha Maitri (combined friendship) = natural + temporary. Both friendly = great friend. Both enemy = bitter enemy. Mixed = neutral. Used in Sthana Bala computation.

## Part 7 Addendum — Interpretation Seed Entry Format and Samples

The 2,500+ interpretation entries referenced in Part 7 follow a strict 5-part template. These 20 seed entries validate the format and establish the tone standard. All AI/LLM-generated interpretations must match this structure and tone.

### Entry Format (5-Part Template)

1. Astronomical Fact: What is happening in the sky or chart (objective, factual)

2. Traditional Association: What Tamil Jyothidam tradition associates with this pattern (phrased as tendency, not certainty)

3. Personalisation: How this applies specifically to this person’s chart

4. Action: What the person can practically do

5. Positive Frame: What opportunity or strength is available in this period

### Sample Interpretation Entries

Entry: Saturn transiting 12th from Moon (Ezhara Sani Phase 1 — Rising)

Fact: Saturn is currently moving through the 12th house counted from your birth Moon sign, marking the beginning of the 7.5-year Ezhara Sani cycle.

Tendency: This phase is traditionally associated with a period of releasing old structures — things that no longer serve the next phase of your life gradually loosen their hold. Sleep patterns, spending habits, or foreign connections may shift.

Personalisation: For your [Lagna] chart, the 12th house from Moon rules [X]. Saturn’s refinement energy here focuses on [specific house theme].

Action: This is a good phase for completing things, settling debts, and simplifying your environment. Avoid major new financial commitments for the next 12 months.

Positive Frame: Saturn in the 12th is the universe’s way of clearing the deck before a new chapter. People who use this phase consciously emerge lighter and more focused.

Entry: Jupiter Mahadasha Active — Jupiter Functionally Benefic for this Lagna

Fact: Your Vimshottari Dasha has entered the Jupiter Mahadasha period, which runs for 16 years.

Tendency: Jupiter Mahadasha is traditionally associated with expansion, knowledge acquisition, and meaningful long-term growth — particularly in the life areas ruled by Jupiter in your chart.

Personalisation: In your chart, Jupiter owns the [X]th and [Y]th houses. This Mahadasha tends to bring growth in [house X theme] and [house Y theme] specifically.

Action: This is your window to invest in education, expand your vision, and take considered risks you have been preparing for. Jupiter rewards the prepared, not the reckless.

Positive Frame: Of all Mahadashas, Jupiter’s 16-year period is most associated with wisdom, mentorship, and the kind of slow, deep prosperity that compounds over time.

Entry: Gaja Kesari Yoga Activating in Jupiter Mahadasha

Fact: Your natal chart has Jupiter in the [X]th house from your Moon — a Kendra position that forms the Gaja Kesari Yoga. This Yoga is activating now during your Jupiter Mahadasha.

Tendency: Gaja Kesari is Tamil astrology’s most celebrated Yoga — traditionally linked with public recognition, compassionate wisdom, and the ability to positively influence others.

Personalisation: Your Gaja Kesari manifests through [Jupiter’s house placement and sign] — the domain of [X] is where you are most likely to receive recognition.

Action: Engage more publicly in your area of expertise. Teach, mentor, or write. This Yoga activates through service to others, not solitary achievement.

Positive Frame: This is one of your chart’s peak potential periods. The Yoga has been present since birth — it is now, during Jupiter’s own Mahadasha, that it comes fully alive.

Entry: Sun in 10th House from Lagna

Fact: Your natal Sun occupies the 10th house from your Lagna, forming a strong Dig Bala position (maximum directional strength for the Sun).

Tendency: Sun in the 10th correlates with a natural orientation toward leadership, visibility, and public life. Authority and responsibility tend to come naturally, and the career often becomes a central life expression.

Personalisation: Your Sun’s sign [X] shapes how this plays out — [brief sign-specific note]. The Sun’s Dasha period ([start]–[end]) is a peak career visibility window.

Action: Own your visibility. The 10th-house Sun asks you to lead — mentor others, take on public responsibility, and build reputation deliberately.

Positive Frame: This is a chart built for impact in the world. Authority is not just granted to you — it is earned through your sincerity and consistency.

Entry: Moon Nakshatra = Janma Tara (Today)

Fact: Today’s Moon is transiting your birth Nakshatra — this is called your Janma Tara day.

Tendency: Janma Tara days are traditionally associated with heightened sensitivity — emotions run closer to the surface, and the body and mind are more reactive than usual.

Personalisation: Your birth star is [Nakshatra]. Its qualities — [Nakshatra theme] — are amplified today.

Action: Keep today’s agenda light where possible. Avoid confrontations, high-stakes negotiations, or irreversible decisions. Rest is genuinely productive on Janma Tara days.

Positive Frame: This is an introspective day — excellent for reflection, prayer, journaling, or spending time with close family.

| Interpretation Database Scale Reference: 108 base placements (9 planets x 12 houses) x 2 (positive/caution variants) = 216 core entries. 81 Dasha-Antardasha combinations x 3 (strong/weak/mixed lord) = 243 Dasha entries. 27 Yoga types x avg 3 chart contexts = ~81 Yoga entries. 6 Sani cycle types x 3 phases x 3 Lagna groups = 54 Sani entries. 12 transit positions x 9 planets x 2 (Moon/Lagna reference) = 216 transit entries. Life stage x Dasha intersections = ~500 entries. Total target: 1,500-2,000 unique entries. All entries must pass Tone Governance review before production deployment. |
| --- |


---

# PART 8 — V7 MASTER BUILD INTEGRATION SUMMARY

Version 7.0 converts the corrected product specification into a build-ready master document. It preserves the product vision and module architecture, then attaches the exact formula manual, golden QA cases, coverage audit, and developer workstreams. The practitioner reference remains a companion methodology document and should be used for interpretive depth, while this v7 file is the product-and-engineering master.

## 8.1 Document hierarchy

| Document | Purpose | Status |
|---|---|---|
| Product Specification v7 | Product, architecture, monetization, roadmap, modules | Master |
| Formula Engine Specification v1 | Exact calculations and scoring methods | Engineering companion embedded below |
| QA Golden Test Cases v1 | Expected outputs for validation | QA companion embedded below |
| Coverage Audit v1 | Remaining freeze decisions | Governance companion embedded below |
| Tamil Jyothidam Reference v2.3 | Practitioner interpretation framework | Separate companion reference |

## 8.2 Build rule

If a product feature mentions an astrological output, developers must trace it to one of these:

1. A formula in the Formula Engine Specification.
2. A QA case in the Golden Test file.
3. A clearly marked TODO in the Coverage Audit before implementation.

No user-facing prediction should be implemented from prose alone.


---

# PART 9 — FORMULA ENGINE SPECIFICATION v1

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


---

# PART 10 — QA GOLDEN TEST CASES v1

**Purpose:** Developer test cases for the Formula Engine Specification v1.  
Every engine implementation must pass these tests before prediction features are enabled.

---

## 1. Universal Constants Tests

### T001 - Rasi numbering

| Rasi | Expected number |
|---|---:|
| Mesham | 1 |
| Rishabam | 2 |
| Midhunam | 3 |
| Kadagam | 4 |
| Simmam | 5 |
| Kanni | 6 |
| Thulaam | 7 |
| Vrichigam | 8 |
| Dhanusu | 9 |
| Magaram | 10 |
| Kumbam | 11 |
| Meenam | 12 |

Fail if Meenam is ever treated as 9.

### T002 - House count

```text
house_from(Dhanusu 9, Meenam 12) = 4
house_from(Magaram 10, Meenam 12) = 3
house_from(Kadagam 4, Kumbam 11) = 8
```

---

## 2. Time Conversion Tests

### T010 - IST to UTC

| Local IST | Expected UTC |
|---|---|
| 1991-07-22 08:15 IST | 1991-07-22 02:45 UTC |
| 2025-05-20 15:32 IST | 2025-05-20 10:02 UTC |

Fail if local time is passed directly to ephemeris.

---

## 3. D9 Navamsa Tests

### T020 - Uthiradam 3rd Pada

```text
Input: Uthiradam 3rd Pada
Rasi: Magaram
Expected D9: Kumbam
Expected Vargottama: false
```

### T021 - Moolam 1st Pada

```text
Input: Moolam 1st Pada
Rasi: Dhanusu
Expected D9: Mesham
Expected Vargottama: false
```

### T022 - Rishabam 13°30'

```text
Input: absolute longitude 43.5°
Rasi: Rishabam
degree_in_rasi: 13.5°
D9 division index: 4 zero-based
Fixed sign start: 9th from Rishabam = Magaram
Expected D9: Rishabam
Expected Vargottama: true
```

---

## 4. Panchangam Tests

### T030 - Weekday

```text
Date: 2025-05-20
Expected weekday: Tuesday
Expected Vara lord: Mars
```

### T031 - Tuesday Kalam slots

```text
Rahu Kalam slot: 7
Yamagandam slot: 3
Kuligai slot: 6
```

### T032 - Wednesday Kalam slots

```text
Rahu Kalam slot: 5
Yamagandam slot: 2
Kuligai slot: 4
```

---

## 5. Saturn Cycle Tests

### T040 - Dhanusu Moon, Saturn in Meenam

```text
Janma Rasi: Dhanusu = 9
Saturn Rasi: Meenam = 12
house_from_moon = 4
Expected cycle: Ardhashtama Sani
Must NOT output: Janma Sani or Sade Sati
```

### T041 - Magaram Moon, Saturn in Meenam

```text
Janma Rasi: Magaram = 10
Saturn Rasi: Meenam = 12
house_from_moon = 3
Expected cycle: no named Saturn-pressure cycle
```

### T042 - Meenam Moon, Saturn in Meenam

```text
Janma Rasi: Meenam = 12
Saturn Rasi: Meenam = 12
house_from_moon = 1
Expected cycle: Janma Sani / Ezharai Phase 2
```

---

## 6. Chandrashtama Tests

### T050 - Current Moon in Kumbam

```text
Current Moon Rasi: Kumbam = 11
Affected Janma Rasi: Katakam = 4
house_from(Katakam, Kumbam) = 8
```

---

## 7. Gandanta Tests

### T060 - Water-fire junctions

```text
359°00' = Gandanta true
001°00' = Gandanta true
119°00' = Gandanta true
121°00' = Gandanta true
239°00' = Gandanta true
241°00' = Gandanta true
150°00' = Gandanta false
```

---

## 8. Mangal Dosha Worksheet Test

### T070 - Mars in Vrichigam, Lagna Mesham, Moon Magaram, Venus Thulaam

```text
From Lagna Mesham to Mars Vrichigam = 8 -> Dosha yes
From Moon Magaram to Mars Vrichigam = 11 -> Dosha no
From Venus Thulaam to Mars Vrichigam = 2 -> South Indian Dosha yes
Cancellation: Mars own sign Vrichigam -> reduces
Expected severity: moderate reduced to mild/controlled if Jupiter support exists
```

---

## 9. Prediction Safety Tests

The text generator must fail QA if it produces any of these:

- "You will die"
- "No marriage"
- "No children"
- "Disaster period"
- "Cursed"
- "Guaranteed loss"

Required replacements:

- sensitive period
- lower-support window
- requires care
- traditional caution
- consult expert for high-stakes decisions

---

## 10. Required Automated Test Suite

- Unit tests for every helper function.
- Regression tests for every golden case above.
- Snapshot tests for interpretation wording.
- Cross-engine tests against at least two trusted chart calculators for D1/D9/Panchangam.
- Manual astrologer audit before production release.

---


---

# PART 11 — CALCULATION COVERAGE AUDIT v1

This audit tracks whether the formula layer is complete enough for engineering.

| Engine | Status after Formula Spec v1 | Notes |
|---|---|---|
| D1 Birth Chart | Complete | Requires ephemeris implementation |
| Lagna | Complete | Whole-sign house assignment fixed |
| Rasi/Nakshatra/Pada | Complete | Boundary epsilon required |
| D9/Navamsa | Complete | Corrected movable/fixed/dual rule |
| D2/D3/D4/D7/D10/D12/D16/D20/D24/D30/D60 | Complete as v1 standard | D20/D24 must be frozen by astrologer council if different school preferred |
| Panchangam | Complete | Transition times must be root-solved |
| Rahu/Yama/Kuligai | Complete | Weekday slot table fixed |
| Hora | Complete | Day and night Hora included |
| Vimshottari | Complete | Maha/Antar/Pratyantar/Sookshma/Prana included |
| Gochar | Complete | Moon primary, Lagna secondary |
| Sani cycles | Complete | Dhanusu+Meenam correction included |
| Chandrashtama | Complete | Current Moon -> affected Janma Rasi included |
| Combustion/Retrograde/Sandhi/Gandanta | Complete | Gandanta corrected to 3°20' |
| Ashtakavarga | Complete at BAV/SAV/Kakshya level | Sodhya Pinda left as advanced optional |
| Shadbala | Contract complete, full detailed classical math still requires separate numeric implementation | Product strength score can be used until full Shadbala is implemented |
| Daily rating | Complete v1 scoring | Can tune weights after data/testing |
| Marriage timing | Complete v1 | Full chart still required |
| Tamil 10 Porutham | Mostly complete | Yoni/Vasiya table version must be frozen |
| Sevvai Dosham | Complete | Lagna/Moon/Venus worksheet included |
| Muhurtham | Complete v1 | Purpose-specific tables can expand |
| Career/Education | Complete v1 scoring | Interpretation layer can expand fields |
| Health tendency | Complete v1, non-medical | Must never diagnose |
| Yoga detection | Major Yogas complete | Add more Yogas as product catalogue grows |
| Family aggregate | Complete v1 | Weights can tune with UX |
| Notification triggers | Complete v1 | Needs implementation with user preferences |
| Interpretation contract | Complete | Wording safety rules included |

## Important remaining validation tasks

1. Freeze Yoni and Vasiya tables with a senior Tamil astrologer.
2. Decide whether to implement full classical Shadbala now or launch with Product Strength Score + later Shadbala upgrade.
3. Run D1/D9/Panchangam cross-checks against at least two trusted calculators.
4. Build automated tests for every golden QA case.
5. Keep formula tables versioned so future corrections do not silently alter old reports.

---


# PART 12 — DEVELOPER IMPLEMENTATION WORKSTREAMS

This section converts the product specification and formula engine into build-ready workstreams. Each workstream must reference the Formula Engine Specification for calculations and the QA Golden Test Cases for expected output.

## 12.1 Workstream A — Core Chart Engine API

### Purpose
Generate and store the user's foundational horoscope data using Thirukanitham / Drik Ganita calculations.

### Required Inputs

| Field | Type | Required | Notes |
|---|---|---:|---|
| dateOfBirth | ISO date | Yes | Gregorian date; Tamil date conversion is preprocessing |
| timeOfBirth | HH:mm:ss | Yes/Nullable | Nullable only for approximate/noon chart mode |
| birthPlace | String | Yes | City, district, country |
| birthLat | Float | Yes | Decimal latitude |
| birthLng | Float | Yes | Decimal longitude |
| timezoneIANA | String | Yes | Example: Asia/Kolkata |
| birthTimeConfidenceMinutes | Integer | Yes | 0 for exact; 15/30/60/etc. for uncertainty |
| ayanamsa | Enum | Yes | Production fixed to LAHIRI_CHITRA_PAKSHA |

### Required Outputs

| Output | Must include |
|---|---|
| lagna | absolute degree, rasi, degree in rasi, nakshatra, pada |
| planets | 9 graha positions, speed, retrograde, combust, rasi, nakshatra, pada, house |
| d1Chart | South Indian fixed-rasi whole-sign chart |
| d9Chart | Navamsa rasi for every graha and Navamsa Lagna |
| metadata | calculation version, ephemeris version, ayanamsa value, node type, source tier |

### Acceptance Criteria

1. IST/local birth time is converted to UTC before ephemeris calls.
2. Sidereal Lahiri flag is applied before longitude-to-rasi conversion.
3. Rahu uses mean node; Ketu is exactly opposite Rahu.
4. Whole-sign house number uses `((planet_rasi - lagna_rasi) mod 12) + 1`.
5. D9 uses the corrected movable/fixed/dual Navamsa start rule, not the incorrect global start rule.
6. All outputs must be deterministic for the same input and calculation version.

## 12.2 Workstream B — Panchangam API

### Purpose
Compute daily city-specific Tamil Panchangam and daily timing windows.

### Required Inputs

| Field | Type | Required | Notes |
|---|---|---:|---|
| date | ISO date | Yes | Local civil date |
| location | lat/lng | Yes | City-specific sunrise and sunset |
| timezoneIANA | String | Yes | Local display timezone |

### Required Outputs

Tithi, Paksha, Vara, Nakshatra, Pada, Yoga, Karana, sunrise, sunset, moonrise, moonset, Rahu Kalam, Yamagandam, Kuligai, Abhijit, day Horas, night Horas, Chandrashtama affected rasi, festival flags, and transition times.

### Acceptance Criteria

1. Sunrise/sunset must be location-specific, not Tamil Nadu average.
2. Rahu/Yamagandam/Kuligai use weekday-specific slot tables.
3. Weekday mapping must be tested against known calendar dates before QA output is accepted.
4. Panchangam values are computed at sunrise for traditional daily display, with transition times shown when values change.

## 12.3 Workstream C — Dasha Engine API

### Purpose
Generate full Vimshottari timeline from the Moon's birth Nakshatra.

### Required Outputs

Full Mahadasha, Antardasha, Pratyantardasha, Sookshma, and Prana periods, with Julian Day boundaries and Gregorian display dates.

### Acceptance Criteria

1. Opening Mahadasha lord is derived only from Moon Nakshatra lord.
2. Balance at birth is proportional to the Moon's remaining distance in the birth Nakshatra.
3. Sub-period durations use `(parent_duration * sub_lord_years) / 120`.
4. Boundaries are stored in Julian Day and displayed as calendar dates.

## 12.4 Workstream D — Gochar and Peyarchi API

### Purpose
Track current planetary movement against natal Moon and Lagna.

### Required Outputs

Current rasi, degree, nakshatra, pada, retrograde, combust, house from Moon, house from Lagna, Vedha check, transit score, and event flags for Guru Peyarchi, Sani Peyarchi, Rahu/Ketu Peyarchi, Chandrashtama, and major retrograde/combustion events.

### Acceptance Criteria

1. Gochar primary reference is Chandra Rasi.
2. Lagna reference is secondary confirmation.
3. Sani cycles must be named only after explicit position-from-Moon calculation.
4. Guru transit positive houses must include 2, 5, 7, 9, and 11 from Moon with Vedha qualification.

## 12.5 Workstream E — Daily Guide Scoring API

### Purpose
Convert Panchangam, Dasha, Gochar, and natal sensitivity into a daily 0-100 guidance score.

### Required Outputs

Overall score, category label, score breakdown, top opportunity, top caution, recommended action, and notification-safe summary.

### Acceptance Criteria

1. No single factor may dominate the score unless marked as a hard caution gate.
2. Chandrashtama, active severe Sani cycle, or adverse Dasha must reduce score but never produce doom language.
3. Score explanation must show components so the result is auditable.

## 12.6 Workstream F — Muhurtham Finder API

### Purpose
Rank candidate windows for a selected event type.

### Required Inputs

Event type, date range, location, primary user's chart, optional second chart, strictness level, and excluded dates/times.

### Required Outputs

Top windows with Tithi, Vara, Nakshatra, Lagna, Hora, Tara Bala, Chandra Bala, Rahu/Yamagandam/Kuligai avoidance, Dasha suitability, and score.

### Acceptance Criteria

1. Event-specific hard exclusions must be applied before scoring.
2. Marriage Muhurtham must evaluate both charts.
3. Output must include why a date was selected and which compromises remain.

## 12.7 Workstream G — Marriage and Porutham API

### Purpose
Evaluate compatibility using Tamil Porutham and full-chart confirmation.

### Required Outputs

Tamil 10 Porutham result, Rajju gate, Vedhai gate, Nadi status, Sevvai Dosham worksheet from Lagna/Moon/Venus, D9 confirmation, Dasha timing, and final compatibility band.

### Acceptance Criteria

1. Rajju and Vedhai must be evaluated before total score interpretation.
2. Sevvai Dosham must not be declared from one reference point only.
3. Final result must be supportive and must not use fatalistic rejection language.

## 12.8 Workstream H — Family Vault and Aggregation API

### Purpose
Manage multiple family charts and compute shared planning windows.

### Required Outputs

Member charts, permissions, daily family score, member needing support, strongest member period, shared Muhurtham calendar, and family notification priority.

### Acceptance Criteria

1. Child profiles must be permission-controlled.
2. Aggregated score must not hide one member's severe caution period.
3. Family guidance must be planning-oriented, not deterministic.

## 12.9 Workstream I — Interpretation Template Engine

### Purpose
Convert raw calculations into readable Tamil-first guidance.

### Required Inputs

Calculation facts, score components, chart context, user language, tone profile, and notification channel.

### Required Outputs

Short notification, dashboard explanation, detailed report paragraph, and optional remedy/action section.

### Acceptance Criteria

1. Every caution must include a helpful action.
2. Use “traditionally associated with” / “interpreted as” instead of “will happen”.
3. Health text must include non-medical disclaimer where relevant.
4. No fear words from the banned-word list may appear in user-facing copy.

## 12.10 Workstream J — QA Console

### Purpose
Give internal astrologer/QA team a way to verify every calculation before user rollout.

### Required Features

1. Enter date/time/place and compare output against golden expected values.
2. Display D1, D9, Panchangam, Dasha, Gochar, Sani cycle, and daily score.
3. Show calculation metadata and version hash.
4. Flag mismatches above tolerance.
5. Export QA run as JSON and PDF/DOCX if needed.

### Release Gate

No prediction module should be enabled for production until its corresponding QA tests pass across golden charts, boundary charts, and real Tamil Nadu city Panchangam cases.


---

# PART 13 — PRACTITIONER REFERENCE COMPANION POINTER

The full Tamil Jyothidam practitioner reference is maintained as a separate companion document: `tamil_jyothidam_complete_reference_v2_3_FULL_Thirukanitham_2026_Corrected.md`.

It contains the interpretive doctrine, discipline gates, yoga/dosha reading rules, functional benefic/malefic principles, D9 verification method, Saturn cycle formula, Mangal Dosha worksheet, Porutham principles, ethics, and final reading self-audit.

For product engineering, this v7 specification is authoritative for architecture and calculations. For astrologer review and interpretation writing, the v2.3 practitioner reference is authoritative. When they disagree, freeze the rule through a calculation governance review before implementation.


---

# END OF V7 MASTER BUILD

Vinaadi AI | Product Specification v7.0 | Full Master Build 2026 | Thirukanitham / Drik Ganita | Tamil Jyothidam
