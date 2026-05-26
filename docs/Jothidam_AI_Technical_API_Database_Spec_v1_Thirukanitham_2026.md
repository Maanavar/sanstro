
# Vinaadi AI Technical API & Database Specification

**Version:** v1.0  
**Date:** May 21, 2026  
**Scope:** MVP 1 technical build blueprint for a Tamil astrology companion using Thirukanitham / Drik Ganita astronomical calculation and Tamil Jyothidam interpretation.  
**Primary change from earlier MVP plan:** **Family Aggregate Fortune is moved into MVP 1.**

---

## 0. Engineering Principle

This document converts the v7 master product specification into build-ready API and database instructions. It does not replace the product spec or formula engine; it tells developers how to implement them.

### 0.1 System Boundary

- **Astronomical calculation layer:** deterministic, testable, ephemeris-based.
- **Astrological rule layer:** deterministic Tamil Jyothidam rules built from formulas and lookup tables.
- **Interpretation layer:** controlled template engine; supportive, non-fearful, never absolute.
- **AI layer:** optional language-generation assistant that may rephrase approved structured outputs, but must not invent calculations.

### 0.2 Non-Negotiable Calculation Rules

| Area | Rule |
|---|---|
| Ayanamsa | Lahiri / Chitrapaksha only for MVP |
| Ephemeris | Swiss Ephemeris or equivalent high-accuracy sidereal engine |
| Rahu | Mean Node for Thirukanitham consistency |
| Ketu | Exactly 180° opposite Rahu |
| Chart display | South Indian fixed Rasi grid |
| House system | Whole-sign houses primary; Bhava/KP only optional advanced layer |
| D1 | Required for every profile |
| D9 | Required for every profile from MVP 1 |
| Gochar | Count from Chandra Rasi primary, Lagna secondary |
| Sani cycles | Use explicit position-from-Moon formula before naming cycle |
| Vargottama | D1 sign must equal D9 sign; never infer when supplied D9 exists |
| Health | Preventive guidance only, no diagnosis |
| Science claim | Use “astronomically precise” and “tradition-grounded,” not “scientifically proven astrology” |

---

## 1. MVP 1 Scope

MVP 1 must launch with the minimum features required to make the product useful daily for an individual **and** a family.

### 1.1 Included in MVP 1

1. User account and profile.
2. Birth profile creation for self and family members.
3. D1 Rasi chart generation.
4. D9 Navamsa chart generation.
5. Core planet positions: Rasi, degree, Nakshatra, Pada, house, retrograde, combust.
6. Daily city-specific Panchangam.
7. Rahu Kalam, Yamagandam, Kuligai, Abhijit, Hora.
8. Vimshottari Mahadasha, Antardasha, Pratyantardasha.
9. Current Gochar from Moon and Lagna.
10. Sani cycle API: Ezharai, Janma, Ardhashtama, Ashtama, Kantaka, Kandaka checks.
11. Guru / Sani / Rahu-Ketu major transit alerts.
12. Individual daily 0-100 guidance score.
13. **Family Aggregate Fortune dashboard.**
14. Tamil + English interpretation output.
15. Notification trigger engine for daily Panchangam, Sani/Guru transit, and family support periods.
16. QA admin endpoint to verify chart and Panchangam outputs against golden cases.

### 1.2 Excluded from MVP 1

| Feature | Move to |
|---|---|
| Full Marriage Porutham | MVP 2 |
| Full Muhurtham Finder | MVP 2 |
| Expert astrologer marketplace | MVP 3 |
| Full classical Shadbala | MVP 2 or 3, unless team has expertise now |
| Full Ashtakavarga with Kakshya | MVP 2 |
| Health tendency monitor | MVP 2, after medical-safety review |
| Festival personalization engine | MVP 2 |
| KP / Tajaka / Varsha Phala | Advanced phase |

---

## 2. Recommended MVP Architecture

### 2.1 Service Layout

For MVP, use a single backend repository with clear internal modules. Splitting into microservices can happen later.

```text
jothidam-api/
  app/
    main.py
    config.py
    db/
      session.py
      models.py
      migrations/
    modules/
      auth/
      profiles/
      chart_engine/
      varga_engine/
      panchangam_engine/
      dasha_engine/
      gochar_engine/
      sani_engine/
      daily_score_engine/
      family_aggregate_engine/
      notification_engine/
      interpretation_engine/
      qa_engine/
    tests/
      golden_cases/
```

### 2.2 Recommended Stack

| Layer | MVP Recommendation | Reason |
|---|---|---|
| API | Python FastAPI | Direct compatibility with pyswisseph and scientific libraries |
| DB | PostgreSQL 16+ | Relational structure, JSONB support, strong indexing |
| Cache | Redis | Daily Panchangam, transit feed, notification queue |
| Jobs | Celery / RQ / APScheduler | Daily precomputation and alerts |
| Ephemeris | pyswisseph | Most practical path for Swiss Ephemeris in Python |
| Geocoding | Google Maps / OSM Nominatim | Place to lat/lng/timezone resolution |
| Timezone | IANA timezone database | Historical timezone correctness |
| Mobile/Web | Next.js + React Native later | Can consume same API |
| Auth | Supabase/Auth0/custom JWT | MVP speed; keep profile data encrypted |

### 2.3 Data Flow

```text
User enters birth data
  -> geocode place + timezone
  -> convert local time to UTC
  -> compute Julian Day
  -> compute D1 + D9 + core derived values
  -> compute Dasha timeline
  -> store chart snapshot with calculationVersion
  -> daily job computes Panchangam + Gochar
  -> daily score engine computes individual score
  -> family engine aggregates member scores
  -> interpretation engine formats output in Tamil/English
  -> notifications sent based on priority and user settings
```

---

## 3. Core Data Model

### 3.1 Entity Overview

| Entity | Purpose |
|---|---|
| users | Account and auth identity |
| family_vaults | Group container for family members |
| family_members | Member profiles managed by user/family owner |
| birth_profiles | Birth date, time, place, timezone, confidence |
| charts | One computed chart snapshot per birth profile/calculation version |
| chart_planets | Planet positions in D1 and derived values |
| varga_positions | D9 and other divisional positions |
| dasha_timelines | Maha/Antar/Pratyantar periods |
| panchangam_cache | City/date Panchangam values |
| transit_snapshots | Current planetary positions cached by timestamp |
| daily_scores | Individual daily 0-100 scores |
| family_daily_scores | Aggregated family fortune by date |
| notifications | Queued/sent notification events |
| interpretation_outputs | Stored generated text for auditability |
| qa_golden_cases | Expected values for testing |
| subscriptions | Plan and billing state |

### 3.2 Calculation Versioning

Every calculated object must include:

```json
{
  "calculationVersion": "thirukanitham-2026-v1",
  "ephemerisProvider": "SWISS_EPHEMERIS",
  "ephemerisVersion": "recorded-at-runtime",
  "ayanamsaType": "LAHIRI",
  "nodeType": "MEAN_NODE",
  "houseSystemPrimary": "WHOLE_SIGN",
  "createdAt": "2026-05-21T00:00:00Z"
}
```

If any formula changes later, never overwrite old chart results silently. Recalculate under a new version and mark old results as archived.

---

## 4. PostgreSQL Schema Summary

The full SQL file is included separately as `Jothidam_AI_PostgreSQL_Schema_v1_Thirukanitham_2026.sql`.

### 4.1 Required Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 4.2 Key Design Rules

1. Birth details are sensitive and should be encrypted at application layer or using pgcrypto.
2. Do not store only display values. Store absolute longitudes, degrees, speed, and source calculation version.
3. Family members are separate from auth users. Children and dependents can be managed by a family owner.
4. Every interpretation output should store the structured inputs used to generate it.
5. Daily scores are cached by profile/date/city because recalculating for every dashboard load is wasteful.

---

## 5. API Standards

### 5.1 General API Rules

| Rule | Standard |
|---|---|
| Base path | `/api/v1` |
| Auth | JWT Bearer token |
| Dates | ISO 8601 |
| Timezones | IANA names, e.g. `Asia/Kolkata` |
| Coordinates | decimal latitude/longitude |
| Language | `ta`, `en`, or `ta-en` |
| Errors | Standard error envelope |
| Idempotency | Required for profile creation and report generation |

### 5.2 Standard Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "BIRTH_TIME_REQUIRED",
    "message": "Birth time is required for Lagna and D9 calculation.",
    "details": {
      "field": "birthTimeLocal"
    }
  }
}
```

### 5.3 Standard Success Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {
    "calculationVersion": "thirukanitham-2026-v1",
    "generatedAt": "2026-05-21T05:00:00Z"
  }
}
```

---

## 6. API Contracts


### 6.1 Create Birth Profile

`POST /api/v1/birth-profiles`

Creates a self or family-member birth profile. This endpoint does not need to calculate chart immediately if `calculateNow=false`, but MVP should default to immediate calculation.

#### Request

```json
{
  "ownerUserId": "uuid",
  "familyVaultId": "uuid-or-null",
  "relationshipToOwner": "self",
  "displayName": "Arjun Kumar",
  "genderForTraditionalRules": "male",
  "birthDateLocal": "1991-07-22",
  "birthTimeLocal": "06:30:00",
  "birthPlace": "Chennai, Tamil Nadu, India",
  "birthLatitude": 13.0827,
  "birthLongitude": 80.2707,
  "birthTimezone": "Asia/Kolkata",
  "birthTimeSource": "family_memory",
  "birthTimeConfidenceMinutes": 15,
  "calendarInputType": "gregorian",
  "languagePreference": "ta-en",
  "calculateNow": true
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "birthProfileId": "uuid",
    "chartId": "uuid",
    "calculationStatus": "completed",
    "warnings": [
      "Birth time confidence is +/- 15 minutes; Lagna near boundary should be verified."
    ]
  }
}
```

### 6.2 Calculate Chart

`POST /api/v1/charts/calculate`

Runs the deterministic chart engine. Used by profile creation and QA tools.

#### Request

```json
{
  "birthProfileId": "uuid",
  "forceRecalculate": false,
  "calculationVersion": "thirukanitham-2026-v1"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "chartId": "uuid",
    "birthDateTimeUTC": "1991-07-22T02:45:00Z",
    "julianDay": 2449061.6145833335,
    "ayanamsa": {
      "type": "LAHIRI",
      "valueDegrees": 23.7561
    },
    "lagna": {
      "rasi": "MESHA",
      "absoluteLongitude": 12.34,
      "degreeInRasi": 12.34,
      "nakshatra": "ASHWINI",
      "pada": 4
    },
    "planets": [
      {
        "graha": "CHANDRA",
        "absoluteLongitude": 253.21,
        "rasi": "DHANUSU",
        "degreeInRasi": 13.21,
        "nakshatra": "MOOLAM",
        "pada": 4,
        "houseFromLagna": 9,
        "speedDegPerDay": 13.42,
        "isRetrograde": false,
        "isCombust": false,
        "d9Rasi": "KADAGAM",
        "isVargottama": false
      }
    ],
    "warnings": []
  }
}
```

### 6.3 Get Chart Summary

`GET /api/v1/charts/{chartId}/summary?language=ta-en`

Returns a dashboard-friendly chart summary.

#### Response

```json
{
  "success": true,
  "data": {
    "chartId": "uuid",
    "displayName": "Arjun Kumar",
    "lagnaRasi": "MESHA",
    "moonRasi": "DHANUSU",
    "janmaNakshatra": "MOOLAM",
    "janmaPada": 1,
    "currentMahadasha": "RAHU",
    "currentAntardasha": "SANI",
    "primaryLanguageText": {
      "ta": "இது உங்கள் அடிப்படை ஜாதகச் சுருக்கம்.",
      "en": "This is your base chart summary."
    }
  }
}
```

### 6.4 Daily Panchangam

`GET /api/v1/panchangam/daily?date=2026-05-21&lat=9.9252&lng=78.1198&timezone=Asia/Kolkata`

#### Response

```json
{
  "success": true,
  "data": {
    "dateLocal": "2026-05-21",
    "location": {
      "lat": 9.9252,
      "lng": 78.1198,
      "timezone": "Asia/Kolkata"
    },
    "sunrise": "2026-05-21T05:53:00+05:30",
    "sunset": "2026-05-21T18:33:00+05:30",
    "solarNoon": "2026-05-21T12:13:00+05:30",
    "vara": {
      "weekday": "THURSDAY",
      "lord": "GURU"
    },
    "tithi": {
      "number": 5,
      "name": "PANCHAMI",
      "paksha": "SHUKLA",
      "endsAt": "2026-05-21T14:42:00+05:30"
    },
    "nakshatra": {
      "name": "PUNARPOOSAM",
      "pada": 2,
      "endsAt": "2026-05-22T03:16:00+05:30"
    },
    "yoga": { "number": 7, "name": "SUKARMA" },
    "karana": { "name": "BALAVA" },
    "kalam": {
      "rahuKalam": { "start": "13:40", "end": "15:15", "slot": 6 },
      "yamagandam": { "start": "05:53", "end": "07:28", "slot": 1 },
      "kuligai": { "start": "15:15", "end": "16:50", "slot": 7 }
    },
    "abhijit": {
      "start": "11:49",
      "end": "12:37",
      "isRestrictedByWeekday": false
    },
    "hora": [
      { "index": 1, "lord": "GURU", "start": "05:53", "end": "06:56" }
    ]
  }
}
```

### 6.5 Dasha Timeline

`GET /api/v1/charts/{chartId}/dasha?level=pratyantar&asOf=2026-05-21`

#### Response

```json
{
  "success": true,
  "data": {
    "chartId": "uuid",
    "openingDasha": {
      "lord": "KETU",
      "balanceYearsAtBirth": 6.25
    },
    "current": {
      "mahadasha": {
        "lord": "RAHU",
        "startDate": "2014-06-01",
        "endDate": "2032-06-01"
      },
      "antardasha": {
        "lord": "SANI",
        "startDate": "2024-02-10",
        "endDate": "2026-12-15"
      },
      "pratyantardasha": {
        "lord": "BUDHA",
        "startDate": "2026-04-01",
        "endDate": "2026-08-20"
      }
    },
    "timeline": []
  }
}
```

### 6.6 Current Gochar

`GET /api/v1/charts/{chartId}/gochar/current?datetime=2026-05-21T05:00:00Z`

#### Response

```json
{
  "success": true,
  "data": {
    "asOfUTC": "2026-05-21T05:00:00Z",
    "janmaRasi": "DHANUSU",
    "lagnaRasi": "MESHA",
    "transits": [
      {
        "graha": "SANI",
        "currentRasi": "MEENAM",
        "houseFromMoon": 4,
        "houseFromLagna": 12,
        "isRetrograde": false,
        "interpretationKey": "SANI_FROM_MOON_4"
      }
    ]
  }
}
```

### 6.7 Sani Cycle Status

`GET /api/v1/charts/{chartId}/sani-cycle?date=2026-05-21`

#### Response

```json
{
  "success": true,
  "data": {
    "saturnRasi": "MEENAM",
    "janmaRasi": "DHANUSU",
    "lagnaRasi": "MESHA",
    "positionFromMoon": 4,
    "positionFromLagna": 12,
    "moonBasedCycle": {
      "type": "ARDHASHTAMA_SANI",
      "isActive": true,
      "supportiveLabel": "Home and inner stability refinement cycle"
    },
    "lagnaBasedCycle": {
      "type": null,
      "isActive": false
    },
    "confirmationSentence": "Saturn is in Meenam, which is 4th from Dhanusu Moon. This is Ardhashtama Sani, not Ezharai Sani."
  }
}
```

### 6.8 Individual Daily Guidance

`GET /api/v1/charts/{chartId}/daily-guidance?date=2026-05-21&language=ta-en`

#### Response

```json
{
  "success": true,
  "data": {
    "chartId": "uuid",
    "dateLocal": "2026-05-21",
    "score": 72,
    "label": "GOOD",
    "scoreBreakdown": {
      "moonTransit": 20,
      "dashaSupport": 16,
      "panchangam": 14,
      "gocharSupport": 12,
      "personalCautions": -4,
      "remedialActionSupport": 6
    },
    "bestWindows": [
      { "type": "ABHIJIT", "start": "11:49", "end": "12:37" },
      { "type": "GURU_HORA", "start": "05:53", "end": "06:56" }
    ],
    "cautionWindows": [
      { "type": "RAHU_KALAM", "start": "13:40", "end": "15:15" }
    ],
    "text": {
      "ta": "இன்று திட்டமிட்ட செயல்களுக்கு நல்ல ஆதரவு உள்ளது. முக்கிய முடிவுகளை ராகு காலத்தைத் தவிர்த்து அமைதியாக செய்யவும்.",
      "en": "Today has useful support for planned actions. Avoid Rahu Kalam for new starts and keep important decisions calm and structured."
    }
  }
}
```

### 6.9 Create Family Vault

`POST /api/v1/family-vaults`

#### Request

```json
{
  "ownerUserId": "uuid",
  "name": "Arjun Family",
  "defaultLanguage": "ta-en"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "familyVaultId": "uuid",
    "name": "Arjun Family",
    "ownerUserId": "uuid"
  }
}
```

### 6.10 Family Aggregate Fortune

`GET /api/v1/family-vaults/{familyVaultId}/daily-aggregate?date=2026-05-21&language=ta-en`

This is included in MVP 1.

#### Response

```json
{
  "success": true,
  "data": {
    "familyVaultId": "uuid",
    "dateLocal": "2026-05-21",
    "familyScore": 68,
    "familyLabel": "SUPPORTIVE_MIXED",
    "members": [
      {
        "familyMemberId": "uuid",
        "displayName": "Arjun Kumar",
        "individualScore": 72,
        "label": "GOOD",
        "activeCycleTags": ["ARDHASHTAMA_SANI"]
      },
      {
        "familyMemberId": "uuid",
        "displayName": "Aadhinii",
        "individualScore": 61,
        "label": "AVERAGE",
        "activeCycleTags": ["CHANDRASHTAMA"]
      }
    ],
    "aggregateBreakdown": {
      "meanScore": 66.5,
      "lowestScore": 61,
      "highestScore": 72,
      "supportNeedIndex": 18,
      "decisionReadinessIndex": 64
    },
    "bestFamilyWindows": [
      { "type": "COMMON_GOOD_WINDOW", "start": "11:49", "end": "12:37" }
    ],
    "avoidForFamilyDecisions": [
      { "type": "RAHU_KALAM", "start": "13:40", "end": "15:15" }
    ],
    "summary": {
      "ta": "குடும்ப அளவில் நாள் சுமாராக நல்ல ஆதரவு தருகிறது. ஒருவருக்கு சற்று கவனிப்பு தேவைப்படுவதால் பெரிய முடிவுகளை மதியம் நல்ல நேரத்தில் மட்டும் வைக்கவும்.",
      "en": "At family level, the day is supportive but mixed. Since one member needs slightly more care, keep major decisions within the better midday window."
    }
  }
}
```

### 6.11 Notification Trigger Preview

`POST /api/v1/notifications/preview`

#### Request

```json
{
  "userId": "uuid",
  "dateLocal": "2026-05-21",
  "includeFamily": true
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "type": "MORNING_PANCHANGAM",
        "priority": 50,
        "sendAtLocal": "2026-05-21T06:00:00+05:30",
        "title": "Today’s Vinaadi Guide",
        "body": "Your family day is supportive but mixed. Best window: 11:49–12:37."
      }
    ],
    "suppressed": []
  }
}
```

### 6.12 QA Golden Case Validation

`POST /api/v1/qa/validate-golden-case`

#### Request

```json
{
  "goldenCaseId": "uuid",
  "runCalculationVersion": "thirukanitham-2026-v1"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "caseName": "Saturn in Meenam, Moon in Dhanusu",
    "status": "passed",
    "assertions": [
      {
        "field": "saniCycle.positionFromMoon",
        "expected": 4,
        "actual": 4,
        "passed": true
      },
      {
        "field": "saniCycle.moonBasedCycle.type",
        "expected": "ARDHASHTAMA_SANI",
        "actual": "ARDHASHTAMA_SANI",
        "passed": true
      }
    ]
  }
}
```

---

## 7. Family Aggregate Fortune Engine

Family Aggregate Fortune is part of MVP 1. It should be practical, not fear-based. The goal is to help a family plan shared activities, understand who needs support today, and avoid overloading the person in the weakest daily window.

### 7.1 Required Inputs

For each active family member:

```json
{
  "memberId": "uuid",
  "individualDailyScore": 0,
  "activeDashaQuality": 0,
  "activeSaniCycleSeverity": 0,
  "chandrashtamaActive": false,
  "gocharSupportScore": 0,
  "panchangamSupportScore": 0,
  "birthTimeConfidenceMinutes": 15,
  "memberWeight": 1.0
}
```

### 7.2 Member Weight

Default all members equally. User may mark dependents or key decision-makers.

| Member type | Default weight |
|---|---:|
| Adult self | 1.00 |
| Spouse/partner | 1.00 |
| Child under 18 | 0.85 |
| Elder parent | 0.90 |
| Key decision-maker for event | 1.25 |

### 7.3 Family Score Formula

```text
weighted_mean = sum(member_score * member_weight) / sum(member_weight)
lowest_score_penalty = max(0, 55 - min_member_score) * 0.35
high_stress_count_penalty = count(member_score < 45) * 4
chandrashtama_penalty = count(chandrashtama_active) * 3
major_sani_penalty = count(ashtama_or_janma_sani_active) * 4

family_score_raw = weighted_mean
                 - lowest_score_penalty
                 - high_stress_count_penalty
                 - chandrashtama_penalty
                 - major_sani_penalty

family_score = clamp(round(family_score_raw), 0, 100)
```

### 7.4 Family Label

| Score | Label | Meaning |
|---:|---|---|
| 80-100 | STRONG_FAMILY_DAY | Good for shared decisions and family events |
| 65-79 | SUPPORTIVE | Good, with normal caution windows |
| 50-64 | SUPPORTIVE_MIXED | Usable day, but check member-specific cautions |
| 35-49 | CARE_REQUIRED | Avoid overloading the family; support weaker member |
| 0-34 | REST_AND_REFLECT | Avoid major family decisions unless urgent |

### 7.5 Decision Readiness Index

For family decisions such as investment, travel, ceremonies, property, or education:

```text
decision_readiness = family_score
                   + common_good_window_bonus
                   - rahu_yama_overlap_penalty
                   - key_member_low_score_penalty
```

| Condition | Adjustment |
|---|---:|
| Common Abhijit/Hora available | +5 |
| Guru/Venus/Mercury Hora available for purpose | +3 |
| Rahu Kalam overlaps requested time | -15 |
| Yamagandam overlaps requested time | -12 |
| Key decision-maker score below 50 | -10 |
| Any member in Chandrashtama | -5 |

### 7.6 Support Need Index

```text
support_need = count(member_score < 50) * 10
             + count(active_major_sani) * 8
             + count(chandrashtama_active) * 5
             + count(health_preventive_nudge_active) * 4
```

Use this only for compassionate planning:

- “Who needs a lighter day?”
- “Who should not be pushed into decisions today?”
- “Which family member is better positioned to lead today’s task?”

Never output: “This person is unlucky today.”

### 7.7 Family Interpretation Template

```text
Astronomical basis:
  Today’s Moon, Panchangam, Dasha and transit layers were checked for each family member.

Family tendency:
  The overall family field is [label].

Practical action:
  Best shared window: [time]. Avoid beginning important new activities during [caution window].

Support note:
  [Member] may benefit from a calmer schedule today. This is a support cue, not a negative prediction.
```

---

## 8. Daily Score Engine Summary

The Formula Engine Spec remains the authority. MVP implementation may use this simplified exact model.

```text
individual_score = 50
                 + moon_transit_score
                 + dasha_score
                 + panchangam_score
                 + gochar_score
                 + hora_window_bonus
                 - caution_penalties
```

### 8.1 Score Components

| Component | Range |
|---|---:|
| Moon transit from Janma Rasi | -15 to +15 |
| Dasha support | -15 to +15 |
| Panchangam day quality | -10 to +10 |
| Gochar support | -15 to +15 |
| Hora / Abhijit available | 0 to +8 |
| Chandrashtama | -12 |
| Ashtama/Janma Sani active | -8 supportive framing, not fear |
| Rahu Kalam current hour | -8 for new starts only |

Clamp final score to 0-100.

---

## 9. Notification Priority Model

### 9.1 Priority Bands

| Priority | Band | Examples |
|---:|---|---|
| 90-100 | Critical calendar event | Major Dasha transition, Sani entry |
| 70-89 | Important personalized event | Chandrashtama, Ashtama Guru, family care day |
| 50-69 | Daily useful | Morning Panchangam, family dashboard |
| 30-49 | Optional | Worship reminder, festival context |
| 0-29 | Suppressed unless user opted in | Generic insight |

### 9.2 Smart Silence Rules

1. Max 1 push per day during heavy Sani cycles unless user opts in.
2. Family aggregate notification counts as the main morning notification.
3. Do not send individual warnings for every family member separately; summarize gently.
4. No alarming words: disaster, doomed, cursed, suffering, death, punishment.
5. Health nudges max weekly and must include preventive wording.

---

## 10. Security and Privacy

### 10.1 Sensitive Fields

Treat birth date, birth time, place, family relationships, and interpretation reports as sensitive.

Minimum requirements:

- TLS everywhere.
- Encryption at rest for birth fields.
- Role-based family access.
- Audit log for profile views and exports.
- User can delete individual family member profile.
- Child profile must transfer or be deletable when child becomes adult, depending on legal/compliance design.

### 10.2 Privacy Modes

| Mode | Description |
|---|---|
| Cloud | Normal account, encrypted storage |
| Local-only future mode | On-device calculation, no server-stored chart |

MVP may start with Cloud only, but schema should not block local-only later.

---

## 11. Developer Build Workstreams

### 11.1 Workstream A — Foundation

- Auth setup.
- User table.
- Family vault table.
- Birth profile CRUD.
- Geocoding/timezone resolution.
- Calculation version constants.

### 11.2 Workstream B — Chart Engine

- UTC conversion.
- Julian Day.
- Lahiri sidereal positions.
- Mean Rahu and Ketu.
- D1 Rasi, Nakshatra, Pada.
- Whole-sign house assignment.
- D9 Navamsa formula.
- Combust/retrograde/sandhi flags.

### 11.3 Workstream C — Panchangam Engine

- Sunrise/sunset.
- Tithi/Yoga/Karana/Nakshatra.
- Rahu Kalam/Yamagandam/Kuligai.
- Abhijit.
- Hora.
- Cache by date/location.

### 11.4 Workstream D — Dasha Engine

- Dasha balance.
- 120-year sequence.
- Maha/Antar/Pratyantar.
- Current period lookup by date.

### 11.5 Workstream E — Gochar + Sani

- Current planetary transit snapshot.
- House from Moon and Lagna.
- Sani-cycle formula.
- Guru/Sani/Rahu-Ketu transit tags.

### 11.6 Workstream F — Daily Score + Family Aggregate

- Individual daily score.
- Family daily score.
- Support Need Index.
- Decision Readiness Index.
- Common good windows.

### 11.7 Workstream G — Interpretation Engine

- Structured interpretation keys.
- Tamil/English templates.
- Safety wording rules.
- No free-form AI until deterministic output exists.

### 11.8 Workstream H — QA

- Golden chart test cases.
- Golden Panchangam test cases.
- D9/Vargottama tests.
- Sani cycle tests.
- API regression suite.

---

## 12. MVP Acceptance Criteria

MVP is not accepted until all are true:

1. Same birth input always gives same chart for same calculation version.
2. D1 and D9 are generated and stored.
3. Sani in Meenam for Dhanusu Moon returns Ardhashtama Sani, not Janma Sani.
4. Uthiradam 3rd Pada returns Kumbam Navamsa.
5. May 20, 2025 weekday test returns Tuesday.
6. Rahu Kalam slots match weekday table.
7. Family aggregate returns a score, label, support note, and best shared window.
8. Every user-facing caution has a practical action.
9. No output claims astrology is scientifically proven.
10. QA golden cases pass in CI.

---

## 13. Implementation Sequence

1. **Sprint 1 — Foundation schema + auth + birth profile**: user can create self/family birth profiles.
2. **Sprint 2 — D1/D9 chart engine**: chart summary API passes golden cases.
3. **Sprint 3 — Panchangam engine**: city/date Panchangam API works.
4. **Sprint 4 — Dasha + Gochar + Sani**: Dasha and Sani status APIs work.
5. **Sprint 5 — Daily individual score**: daily guidance API works.
6. **Sprint 6 — Family aggregate MVP**: family dashboard API works.
7. **Sprint 7 — Interpretation templates**: Tamil/English safe output.
8. **Sprint 8 — Notifications + QA dashboard**: morning and family alerts ready.

---

## 14. Final Notes

This document is intentionally API/database focused. The Formula Engine Spec remains the calculation law. The Product Spec remains the product/UX law. This file is the bridge developers use to build MVP 1.
