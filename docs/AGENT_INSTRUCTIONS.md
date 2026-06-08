# Vinaadi AI — Agent Instructions
**Last updated:** 2026-06-07  
**Test suite:** 233 passing  
**Stack:** FastAPI + PostgreSQL + SQLAlchemy (backend) · Next.js 15 + TypeScript (frontend)

---

## 1. WHAT THIS APP IS

Tamil-first bilingual astrology daily companion. Users enter their birth details, get a daily score (0–100) with reasons, dasha timeline, transit analysis, panchangam, and family vault support. All user-facing text is bilingual `{ta, en}`.

**What we follow from Thirukanitham tradition (strictly enforced):**
- Lahiri sidereal ayanamsa
- Mean node Rahu/Ketu (not true node)
- Whole Sign houses (`"W"` in Swiss Ephemeris)
- Vimshottari dasha (standard 120-year periods: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17)
- Transit scoring from **Janma Rasi (Moon)** as primary reference
- Panchangam kalam slots: actual sunrise-to-sunset daylight divided into 8 parts; Rahu Kalam, Yamagandam, and Kuligai use weekday slot order.
- Natural friendship table: Parashari doctrine (Sun friends Moon/Mars/Jupiter; Venus friends Mercury/Saturn, etc.)
- Chandrashtama = 8th Rasi from natal Moon Rasi (not 8th nakshatra)
- Thirukanitham is the main source tradition. If a doc mentions Drik or Drik Ganita, treat it as the astronomical calculation method used inside the Thirukanitham system, not as a separate source of truth.
- Amavasai = sacred ancestor day, no penalty

**What we do NOT claim to follow from classical texts (custom/approximate):**
- `TRANSIT_BASE_SCORE` in `daily_guidance_service.py` — custom numeric weights per planet per house, not from any classical Shadbala text
- `PLANET_DAILY_WEIGHT` — custom weighting per planet (Jupiter 0.18, Saturn 0.20, etc.)
- `PLANET_PERIOD_SCORE` — custom base score per dasha lord
- No Shadbala (6-fold planetary strength) computation
- No Ashtamangala, Mrityu Bhaga, or Sarvashtakavarga checks
- Jupiter/Saturn Lagna-based bonus/penalty is a supplemental adjustment on top of Moon-based score, not classical

**If asked to "fully follow Thirukanitham methodology"** — be honest: core framework follows it (ayanamsa, dasha, kalam, nakshatra, house system), but the daily score weights are the author's custom formula, not from any printed Thirukanitham text.

**Repo root:** `C:\Users\senth\OneDrive\문서\GitHub\sanstro`  
**Shell:** PowerShell. Use `.\.venv\Scripts\python.exe` for Python.  
**Run tests:** `.\.venv\Scripts\python.exe -m pytest tests/ -x -q`

---

## 2. MANDATORY RULES — READ BEFORE ANY CODE CHANGE

### Astrological rules (never violate)
- Ayanamsa: **Lahiri sidereal** only (`SE_SIDM_LAHIRI` in `app/calculations/ephemeris.py`). Never tropical.
- House system: **Whole Sign** (`"W"`) only. Never Placidus or Equal.
- Rahu/Ketu: **Mean node** only (`SE_MEAN_NODE`). Never true node.
- Dasha: **Vimshottari** only. Period lengths in `app/calculations/dasha.py` — do not change.
- Chandrashtama: **8th Rasi from natal Moon Rasi** — NOT 8th nakshatra. Code in `app/services/daily_guidance_service.py`. (BUG-01 fixed, don't revert.)
- Amavasai (Tithi 30): **No score penalty**. It is a sacred ancestor day — trigger content card only. (BUG-02 fixed, don't revert.)
- Kandaka Sani: computed from **Lagna Rasi**, not Moon Rasi. (BUG-03 fixed.)
- Kalam timings (Rahu Kalam, Yamagandam, Kuligai): divide the actual local sunrise-to-sunset daylight interval into 8 equal parts, then apply the weekday slot order. Code anchors at `sunrise` and uses `(sunset - sunrise) / 8` in `app/calculations/panchangam.py`.
- Transit scoring: primary reference is **Janma Rasi (natal Moon)**. Jupiter/Saturn from Lagna are secondary adjustments only.
- Score formula weights (`TRANSIT_BASE_SCORE`, `PLANET_DAILY_WEIGHT`, `PLANET_PERIOD_SCORE`) are in `app/services/daily_guidance_service.py`. Do not change these without explicit instruction — they are the author's calibrated values.
- All score calculation intent is documented in `docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md`. When formula spec conflicts with product spec, **formula spec wins for calculations within the Thirukanitham standard**, product spec wins for UX.

### Coding rules
- Every user-facing string must have both `ta` and `en` fields. Never hardcode Tamil or English only.
- Never add `ensure_ascii=True` to JSON serialisation — Tamil bytes must pass through as UTF-8.
- All JSON responses must include `Content-Type: application/json; charset=utf-8` (handled by `SecurityHeadersMiddleware` in `app/middleware.py`).
- Calculation version: `"jothidam-formula-engine-v1.1-2026"` — bump only when score formula changes (invalidates `DailyScore` cache rows).
- Panchangam results are cached in `panchangam_cache` table. Clear it (`DELETE FROM panchangam_cache`) after any kalam/tithi calculation fix.
- Run the full test suite before marking any task done. All 233 tests must pass.

---

## 3. PROJECT STRUCTURE

```
sanstro/
├── app/
│   ├── api/              # FastAPI routers (one file per domain)
│   ├── calculations/     # Pure astrological math (no DB)
│   ├── core/             # Config, auth (JWT), security
│   ├── db/               # SQLAlchemy session
│   ├── middleware.py     # Rate limiting, security headers, request logging
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   └── services/         # Business logic (calls calculations + DB)
├── docs/                 # Specs and instructions
├── migrations/           # Alembic migrations
├── tests/                # pytest test suite
└── web/                  # Next.js frontend
    ├── app/
    │   ├── api/backend/[...path]/route.ts   # Proxy: all /api/backend/* → FastAPI
    │   ├── dashboard/page.tsx
    │   ├── layout.tsx
    │   └── login/page.tsx
    ├── components/       # All React components
    └── lib/
        ├── api.ts        # apiFetchJson helper
        ├── format.ts     # formatClockLabel, formatDateLabel, getScoreBand
        ├── i18n.ts       # All UI strings + panchangam lookup maps
        └── types.ts      # All TypeScript types
```

---

## 4. BACKEND — KEY FILES

### Router registration (`app/main.py`)
All routers mount under `/api/v1` prefix (set in `app/core/config.py`).

| Router file | Endpoints |
|---|---|
| `app/api/auth.py` | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me` |
| `app/api/birth_profiles.py` | `/birth-profiles`, `/birth-profiles/me/latest` |
| `app/api/charts.py` | `/charts/calculate`, `/charts/{id}/summary`, `/charts/{id}/dasha`, `/charts/{id}/daily-guidance`, `/charts/{id}/gochar/current`, `/charts/{id}/sani-cycle`, `/charts/{id}/peyarchi/upcoming`, `/charts/{id}/life-areas` |
| `app/api/daily_guidance.py` | `/daily-guidance/range`, `/daily-guidance/week-ahead`*, `/activity-timing`*, `/charts/{id}/dasha/timeline`*, `/transits/peyarchi-report/{id}`*, `/journal/{id}/correlations`* |
| `app/api/panchangam.py` | `/panchangam/daily`, `/panchangam/timings` |
| `app/api/family_vaults.py` | `/family-vaults`, `/family-vaults/{id}`, `/family-vaults/{id}/daily-aggregate`, `/family-vaults/{id}/calendar`, `/family-vaults/{id}/members` |
| `app/api/goals.py` | `/goals` |
| `app/api/alerts.py` | `/alerts/ambient` |
| `app/api/content.py` | `/content/nakshatra/{1-27}`* |
| `app/api/transits.py` | `/charts/{id}/transits/major`, `/charts/{id}/gochar/current`, `/charts/{id}/sani-cycle` |
| `app/api/journal.py` | `/journal`, `/journal/prompts`*, `/journal/export`* |
| `app/api/life_areas.py` | `/charts/{id}/life-areas` |
| `app/api/context.py` | `/context`* |
| `app/api/retrospective.py` | `/retrospective`* |
| `app/api/relationships.py` | `/relationships/alerts`*, `/relationships/{id}/synastry`* |
| `app/api/decisions.py` | `/decisions/brief`* |
| `app/api/whatif.py` | `/whatif` |
| `app/api/settings.py` | `/settings/journal` |
| `app/api/notification_preferences.py` | `/settings/notifications`* |
| `app/api/feedback.py` | `/feedback` |
| `app/api/qa.py` | `/qa/validate`, `/qa/regression-report` |
| `app/api/admin.py` | `/admin/user/{id}`, `/admin/stats` |

`*` = Backend implemented, no frontend consumer yet.

### Core service files
| File | Purpose |
|---|---|
| `app/services/daily_guidance_service.py` | Score engine, emotional weather, narrative, journal/context insight, week-ahead, activity timing, dasha story, peyarchi report, journal correlations |
| `app/services/panchangam_service.py` | Wraps `app/calculations/panchangam.py`, formats response |
| `app/calculations/panchangam.py` | Tithi, nakshatra, yoga, karana, kalam computation. **Kalam uses sunrise-to-sunset daylight division.** |
| `app/calculations/ephemeris.py` | Swiss Ephemeris wrapper (Lahiri sidereal, mean Rahu/Ketu) |
| `app/calculations/astro.py` | Rasi, nakshatra, pada, lagna, house computations |
| `app/services/dasha_service.py` | Vimshottari dasha computation |
| `app/services/transit_service.py` | Gochar (transit) positions, retrograde/combustion flags |
| `app/services/emotional_weather.py` | Tone classification from Moon/Venus/4th-house activations |
| `app/services/nakshatra_content.py` | Nakshatra perspective lens (birth-star framing) |
| `app/services/nakshatra_content_static.py` | Static personality cards for nakshatras 1–27 (FEATURE-10) |
| `app/services/narrative_engine.py` | Tithi special content (Amavasai, Pournami, Pradosham, Ekadasi) |
| `app/services/family_vault_service.py` | Family aggregate score, member weights |
| `app/services/ambient_alerts_service.py` | Peyarchi + relationship alert aggregation |
| `app/services/notification_dispatch_service.py` | FCM push + SMTP email dispatch with retry |
| `app/services/fcm_service.py` | Firebase Cloud Messaging (stub when env vars unset) |

### Middleware (`app/middleware.py`)
- `SecurityHeadersMiddleware` — security headers + **`Content-Type: application/json; charset=utf-8`** on every JSON response
- `RequestLoggingMiddleware` — structured JSON access log
- `RateLimitMiddleware` — 120 req/min per IP sliding window

### Config (`app/core/config.py`)
Key env vars: `DATABASE_URL`, `SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `JOTHIDAM_FCM_PROJECT_ID`, `JOTHIDAM_FCM_SERVICE_ACCOUNT_JSON`

---

## 5. FRONTEND — KEY FILES

### State management
All global state lives in `web/components/dashboard-workspace.tsx`. It:
- Owns all API fetch calls (43 distinct calls)
- Passes data down as props to tab components
- No Redux/Zustand — plain `useState` + `useRef`

### Data flow
```
dashboard-workspace.tsx
  ├── [state] personalChart, personalDailyGuidance, ambientAlerts, panchangam, etc.
  ├── → DashboardHero (tabs, date picker, language toggle)
  ├── → DashboardPersonalTab (personal view — score, dasha, transits, emotional weather)
  ├── → DashboardFamilyTab (family vaults, member cards)
  ├── → DashboardCalendarTab (7-day calendar, panchangam detail)
  ├── → DashboardLifeAreasTab (12 life areas)
  └── → DashboardSetupTab / DashboardSettingsTab / DashboardQaTab
```

### Props passed to DashboardPersonalTab
```typescript
lang, selectedDate, birthProfileId,
personalChart,           // D1 + D9 charts, planet table
personalChartSummary,    // lagna, moon sign, nakshatra, dasha label
personalDailyGuidance,   // score, breakdown, reasons, remedy, emotionalWeather,
                         // nakshatraPerspective, contextInsight, journalInsight,
                         // bestWindows, cautionWindows, actionSuggestion
dailyGuidanceRange,      // 3-day preview
ambientAlerts,           // peyarchi + relationship alerts (AmbientAlertItem[])
personalDasha,           // current dasha periods (maha/antar/pratyantar)
personalDashaMaha,       // maha timeline
personalDashaAntar,      // antar timeline
personalTransit,         // gochar snapshot
personalSani,            // Saturn cycle
peyarchiUpcoming,        // upcoming Jupiter/Saturn sign changes
panchangam,              // tithi, nakshatra, yoga, karana, kalam, hora
panchangamTimings,       // kalam timings only
goals, goalsBusy, ...    // goals + handlers
whatIf...                // what-if state + handlers
```

### i18n system (`web/lib/i18n.ts`)
```typescript
t(key: StringKey, lang)           // UI labels: t("btn_save", lang)
tLang(obj: {ta, en}, lang)        // API response strings: tLang(guidance.text, lang)
tTithi(key, lang)                 // "PRATHAMA" → "பிரதமை" / "Prathama"
tNakshatra(key, lang)             // "ROHINI" → "ரோகிணி" / "Rohini"
tWeekday(key, lang)               // "SUNDAY" → "ஞாயிறு" / "Sunday"
tPlanetLord(key, lang)            // "SATURN" → "சனி" / "Saturn"
tYoga(key, lang)                  // "VISHKAMBHA" → "விஷ்கம்பம்" / "Vishkambha"
tKarana(key, lang)                // "BAVA" → "பவ" / "Bava"
```
All 27 nakshatras, 15 tithis, 7 weekdays, 10 planet lords, 27 yogas, 11 karanas are in lookup maps at the bottom of `i18n.ts`.

### Time formatting (`web/lib/format.ts`)
```typescript
formatClockLabel(value: string): string
// Input: "13:40", "13:40:00", or ISO datetime
// Output: "1:40 PM"
// USE THIS everywhere a time is displayed. Never render raw HH:MM strings.
```

### Proxy (`web/app/api/backend/[...path]/route.ts`)
All frontend API calls go to `/api/backend/api/v1/...` → proxied to FastAPI at `BACKEND_URL` (default `http://127.0.0.1:8000`). The proxy also sets `charset=utf-8` on JSON responses.

### UI primitives (`web/components/dashboard-ui.tsx`)
`Button`, `Surface`, `Metric`, `Chip`, `Modal`, `TextInput`, `DateInput`, `Select`  
Always use these — don't create one-off styled divs for common patterns.

---

## 6. TYPESCRIPT TYPES (`web/lib/types.ts`)

Key types an agent needs:

```typescript
DailyGuidanceData {
  score: number
  scoreBreakdown: { moonTransit, dashaSupport, panchangam, gocharSupport, personalCautions, remedialActionSupport }
  bestWindows: DailyGuidanceWindow[]     // {type, start "HH:MM", end "HH:MM"}
  cautionWindows: DailyGuidanceWindow[]
  text: BiText                           // {ta, en}
  reasons: DailyGuidanceReasons          // {moonTransit, dashaSupport, panchangam, gochar, personalCaution}
  remedy: BiText
  actionSuggestion: BiText
  cautionSuggestion: BiText
  emotionalWeather: DailyGuidanceEmotionalWeather | null
  nakshatraPerspective: BiText | null
  contextInsight: BiText | null          // non-null only when user has event + caution day
  journalInsight: DailyGuidanceJournalInsight | null  // non-null only when 30+ journal entries
}

DailyGuidanceEmotionalWeather {
  tone: string                           // "heavy" | "expansive" | "restless" | "calm" | "scattered" | "confident"
  physicalTendency: string
  bestUseOfDay: string
  avoidBefore: BiText | null
  toneText: BiText
  physicalTendencyText: BiText
  bestUseOfDayText: BiText
}

AmbientAlertItem {
  alertId, source: "PEYARCHI" | "RELATIONSHIP"
  significanceScore: number              // 0–100
  triggerPlanet, triggerType
  eventDate, daysFromToday: number
  title: BiText, message: BiText
}

PanchangamDailyResponseData {
  vara: { weekday: string, lord: string }     // keys like "SUNDAY", "SUN"
  tithi: { number, name: string, paksha: "SHUKLA"|"KRISHNA", endsAt: "HH:MM" }
  nakshatra: { name: string, pada: number, endsAt: "HH:MM" }
  yoga: { number, name: string }
  karana: { name: string }
  kalam: { rahuKalam: {start, end, slot}, yamagandam: {start, end, slot}, kuligai: {start, end, slot} }
  abhijit: { start, end, isRestrictedByWeekday }
  hora: { index, lord: string, start: "HH:MM", end: "HH:MM" }[]
  sunrise, sunset: "HH:MM"
}
```

---

## 7. WHAT IS NOT IN THE FRONTEND YET

Status updated 2026-05-27 per VINAADI_ENHANCEMENT_ROADMAP_v1.md Section 0A.

| ID | Backend endpoint | What it returns | Frontend status |
|---|---|---|---|
| FEATURE-05 | Inside `daily-guidance` response | Tithi special content (Amavasai/Pournami/Ekadasi card) | **Done** — rendered in Personal tab |
| FEATURE-07 | `GET /api/v1/daily-guidance/week-ahead` | 7-day score digest, best day, Chandrashtama flags | **Done** — Calendar tab week surface |
| FEATURE-08 | `GET /api/v1/activity-timing?chartId=&activity=&month=` | Top 5 dates for activity type in a month | **Partial** — Plan tab only; Personal tab placement TBD |
| FEATURE-09 | `GET /api/v1/charts/{id}/dasha/timeline?asOf=` | Dasha story narrative from birth | **Done** — expand/collapse wired |
| FEATURE-10 | `GET /api/v1/content/nakshatra/{1-27}` | Static nakshatra personality card | **Done** — Nakshatra card + endpoint live |
| FEATURE-11 | `GET /api/v1/transits/peyarchi-report/{id}?planet=&asOf=` | Guru/Saturn peyarchi outlook | **Done** — Peyarchi report fetch + banner click-through wired |
| FEATURE-12 | `GET /api/v1/journal/{id}/correlations?lookbackDays=` | Journal mood pattern correlations | **Done** — rendered with 30+ entries guard |
| ARCH-02 | `GET/PATCH /api/v1/settings/notifications` | Notification channel, morning alert time, smart silence | **Done** — Settings session tab |

---

## 8. HOW TO ADD A NEW FRONTEND FEATURE (pattern)

### Step 1 — Add type to `web/lib/types.ts` if needed
Check if the response type already exists. If not, add it following the `ApiEnvelope<T>` pattern:
```typescript
export type MyNewData = { field: string; biField: BiText; };
```

### Step 2 — Add fetch in `web/components/dashboard-workspace.tsx`
```typescript
const [myNewData, setMyNewData] = useState<MyNewData | null>(null);

// Inside refreshPersonalBundle(), after parallel bundle:
apiFetchJson<ApiEnvelope<MyNewData>>(`/api/v1/my-endpoint${toQuery({chartId})}`)
  .then(r => setMyNewData(r.data))
  .catch(() => {});  // fire-and-forget, never block the main bundle

// Pass as prop to the tab component:
// <DashboardPersonalTab myNewData={myNewData} ... />
```

### Step 3 — Add to tab component props type and render
```typescript
// In the tab component props type:
myNewData: MyNewData | null;

// In JSX — always conditional, never crash on null:
{myNewData && (
  <Surface title={t("my_new_label", lang)}>
    <p>{tLang(myNewData.biField, lang)}</p>
  </Surface>
)}
```

### Step 4 — Add i18n keys to `web/lib/i18n.ts`
```typescript
my_new_label: { ta: "தமிழ் தலைப்பு", en: "English Title" },
```

### Step 5 — Format all times
Any time string from the API must go through `formatClockLabel()`:
```typescript
import { formatClockLabel } from "@/lib/format";
<span>{formatClockLabel(item.start)}</span>  // "1:40 PM" not "13:40"
```

### Step 6 — Translate panchangam names
Any key from panchangam (tithi name, nakshatra name, weekday, planet lord) must go through helpers:
```typescript
import { tTithi, tNakshatra, tWeekday, tPlanetLord } from "@/lib/i18n";
<span>{tTithi(panchangam.tithi.name, lang)}</span>
```

---

## 9. HOW TO ADD A NEW BACKEND FEATURE (pattern)

### Step 1 — Schema (`app/schemas/`)
```python
class MyNewQuery(BaseModel):
    chart_id: UUID
    as_of: date

class MyNewResponseData(BaseModel):
    chart_id: str = Field(alias="chartId")
    some_field: BiText
    model_config = ConfigDict(populate_by_name=True)

class MyNewResponse(BaseModel):
    success: bool = True
    data: MyNewResponseData
    meta: ApiMeta
```

### Step 2 — Service (`app/services/`)
```python
def compute_my_new_feature(chart_id: UUID, as_of: date, db: Session) -> MyNewResponseData:
    # fetch chart, compute, return schema
```

### Step 3 — Router (`app/api/`)
```python
@router.get("/my-endpoint", response_model=MyNewResponse, tags=["my-feature"])
def get_my_feature(query: MyNewQuery = Depends(), db = Depends(get_db), _: User = Depends(get_current_user)):
    data = compute_my_new_feature(query.chart_id, query.as_of, db)
    return MyNewResponse(data=data, meta=build_meta())
```

### Step 4 — Register in `app/main.py`
```python
from app.api.my_feature import router as my_feature_router
app.include_router(my_feature_router, prefix=settings.api_v1_prefix)
```

### Step 5 — Tests (`tests/test_my_feature.py`)
Test at least: happy path, missing data returns null not crash, auth required.

---

## 10. DATABASE MODELS (summary)

Key tables and their primary purpose:

| Model file | Table | Key fields |
|---|---|---|
| `user.py` | `users` | email, password_hash |
| `birth_profile.py` | `birth_profiles` | owner_user_id, birth_datetime_utc, lat, lng, timezone_name |
| `chart.py` | `charts` | birth_profile_id, calculation_version, lagna_rasi, moon_rasi, janma_nakshatra |
| `chart_planet.py` | `chart_planets` | chart_id, graha, rasi, nakshatra, pada, degree, house, retrograde, combust |
| `dasha_period.py` | `dasha_periods` | chart_id, level (maha/antar/pratyantar), lord, start_date, end_date |
| `panchangam_cache.py` | `panchangam_cache` | cache_date, latitude, longitude, ayanamsa_type, data (JSON) — 24h TTL |
| `daily_score.py` | `daily_scores` | chart_id, date_local, score, calculation_version |
| `family_vault.py` | `family_vaults` | owner_user_id, name |
| `family_member.py` | `family_members` | vault_id, birth_profile_id, relationship_to_owner, member_weight |
| `user_notification_preference.py` | `user_notification_preferences` | notification_channel (none/email/push/both), morning_alert_enabled, smart_silence_enabled, fcm_device_token |
| `peyarchi_alert.py` | `peyarchi_alerts` | chart_id, planet, from_rasi, to_rasi, event_date, significance_score |

All models use `TimestampMixin` (created_at, updated_at). UUIDs for all primary keys.

---

## 11. TEST FILES

Run all: `.\.venv\Scripts\python.exe -m pytest tests/ -x -q`  
Run one: `.\.venv\Scripts\python.exe -m pytest tests/test_panchangam_api.py -x -v`

| Test file | Covers |
|---|---|
| `test_calculations.py` | Rasi, nakshatra, lagna computation accuracy |
| `test_panchangam_api.py` + `test_panchangam.py` | Tithi/nakshatra/kalam endpoints and computation |
| `test_daily_guidance_api.py` | Score endpoint, breakdown, range endpoint |
| `test_dasha_api.py` + `test_dasha.py` | Dasha timeline accuracy |
| `test_transits_api.py` + `test_transits_calculations.py` | Gochar, sani-cycle, retrograde |
| `test_family_vaults_api.py` | Family vault CRUD, aggregate, calendar |
| `test_emotional_weather.py` | Tone classification |
| `test_nakshatra_content.py` | Nakshatra perspective lens |
| `test_notification_preferences.py` | Notification CRUD, smart silence |
| `test_arch03_bilingual_audit.py` | Tamil/English coverage regression |
| `test_golden_validation.py` | Golden test framework (calculation correctness) |

---

## 12. DOCS REFERENCE

| Doc | Use it when |
|---|---|
| `docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md` | Any score calculation, formula weight, dasha period, transit base score, kalam slot table |
| `docs/Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md` | UX decisions, feature scope, bilingual tone |
| `docs/Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md` | Verifying calculation output against known-correct values |
| `docs/Jothidam_AI_OpenAPI_v1_Thirukanitham_2026.yaml` | Full API contract reference |
| `docs/Jothidam_AI_PostgreSQL_Schema_v1_Thirukanitham_2026.sql` | Database schema DDL |
| `docs/FRONTEND.md` | Current UI status, frontend feature backlog, surfaces for emotionalWeather/nakshatraPerspective/journalInsight/contextInsight/ambientAlerts |
| `docs/VINAADI_ENHANCEMENT_ROADMAP_v1.md` | Forward roadmap, decisions log — what to build next and why |

**Conflict resolution rule:** Formula spec > Product spec for calculations. Both > any other doc.

---

## 13. COMMON MISTAKES TO AVOID

| Mistake | Correct approach |
|---|---|
| Rendering raw panchangam key like `{tithi.name}` | Use `{tTithi(tithi.name, lang)}` |
| Rendering raw time `{window.start}` | Use `{formatClockLabel(window.start)}` |
| Rendering raw planet lord `{period.lord}` | Use `{tPlanetLord(period.lord, lang)}` |
| Tamil text shows as `தமிழ்` | Missing `charset=utf-8` - already fixed in middleware, check proxy route.ts |
| Kalam times differ from fixed-clock tables | The engine uses sunrise-to-sunset daylight division in `panchangam.py`; compare against Thirukanitham/Drik references that use the same convention |
| Chandrashtama using nakshatra count | Must use Rasi count (8th rasi from natal Moon Rasi) |
| Adding a new screen without conditional null check | Always guard: `{data && <Surface>...</Surface>}`, never crash on null |
| Calling `formatClockLabel` on a date (not time) field | Only pass time strings `"HH:MM"` or ISO datetimes, not plain dates |
| Hardcoding Tamil string directly in JSX | All strings must be in STRINGS dict in `i18n.ts` and use `t()` or `tLang()` |
| Using `ensure_ascii=True` in any JSON serialisation | Tamil bytes must flow as raw UTF-8 |
| Amending existing git commit after hook failure | Always create a NEW commit — never `git commit --amend` after a failed hook |

---

## 14. CURRENT STATUS (2026-05-24)

### Done — backend + frontend wired
- Daily guidance score, reasons, remedy — Personal tab
- Dasha timeline (maha/antar/pratyantar) — Personal tab
- Transit positions, Saturn cycle — Personal tab / Gochar surface
- Panchangam (tithi, nakshatra, yoga, karana, kalam, hora) — Calendar tab (names now translated)
- Family vault aggregate + calendar — Family tab
- Goals panel — Personal tab
- What-If simulator — Personal tab
- Peyarchi banner — Personal tab
- Chandrashtama alert — Personal tab
- Emotional weather — Personal tab (shows when non-null)
- Nakshatra perspective — Personal tab (shows when non-null)
- Context insight — Personal tab (shows when user has event + caution day)
- Journal insight — Personal tab (shows when 30+ journal entries)
- Ambient alerts — Personal tab (shows when significance ≥ 70 alerts exist)
- 3-day range preview — Calendar tab
- D1 + D9 charts + planet table — Personal tab (Chart context surface)
- Life areas (12 areas) — Life Areas tab
- Kalam times fixed to Thirukanitham 90-min fixed slots — backend

### Done — backend only, no frontend yet
- Synastry charts, relationship alerts
- Decision brief
- Journal export (CSV/JSON download)

### Next priorities (suggested order)
1. **Decision brief** — `/decisions/brief` endpoint, wired into Personal tab below What-If
2. **Synastry panel** — Family tab, member compatibility view (backend already at `/relationships/{id}/synastry`)
3. **Journal export download** — Settings tab, trigger `/journal/export` and download JSON/CSV

### Journal tab (NEW — 2026-05-26)
A dedicated Journal tab (✏) was added to the nav. It contains:
- **Context events panel** — users register upcoming events (job change, marriage, etc.) so `contextInsight` fires in daily guidance (`POST /context`)
- **Write panel** — AI-prompted journal entry form with life area picker and date (`POST /journal`)
- **Entries list** — last 50 entries with archive action (`GET /journal`, `DELETE /journal/{id}`)

The journal tab loads entries and context data lazily when the user clicks the tab, and reloads after each save/archive. i18n keys are in `web/lib/i18n.ts` under `// ── Journal tab`. Types are in `web/lib/types.ts` under `JournalEntryData`, `JournalListData`, `JournalPromptsData`, `ContextData`.

---

## 15. TAMIL ASTROLOGY STANDARDS & CULTURAL RULES (Thirukanitha)

These rules apply to ALL astrological calculations, interpretations, recommendations, and content generation. They exist because of real mistakes found in production.

### 15.1 Calculation system
- This app follows **Thirukanitha Panchangam** (scientific ephemeris-based), not Vakiya Panchangam.
- Thirukanitham is the governing source tradition. "Drik"/"ephemeris" elsewhere refers only to the calculation method used to implement Thirukanitham accurately.
- Dasha system: Vimshottari only (not Yogini or other systems unless user requests).

### 15.2 Transit scoring — Jupiter (Guru Peyarchi), houses from Moon
| House from Moon | Classification | Score range | Display colour |
|-----------------|---------------|-------------|----------------|
| 1 | Neutral | 50 | Yellow |
| 2 | Good | 70 | Green |
| 3 | Unfavourable | 35 | Red |
| 4 | Unfavourable | 30 | Red |
| 5 | Very Good | 80 | Green |
| 6 | Unfavourable | 40 | Red |
| 7 | Good (mixed) | 65–70 | Green |
| 8 | Bad | 20 | Red |
| 9 | Very Good | 82 | Green |
| 10 | Neutral | 55 | Yellow |
| 11 | Very Good | 80 | Green |
| 12 | Unfavourable | 35 | Red |

**Jupiter in house 7 from Moon is GOOD — never show red or warning** (BUG-05, fixed — don't revert).

### 15.3 Transit scoring — Saturn (Sani Peyarchi), houses from Moon
| House from Moon | Classification | Notes |
|-----------------|---------------|-------|
| 1 | Sade Sati (peak) | Caution — major life changes, not necessarily bad |
| 2 | Sade Sati (ending) | Financial caution |
| 3 | Good | Effort rewarded |
| 4 | Unfavourable | Domestic stress |
| 5 | Neutral | |
| 6 | Good | Enemies defeated, hard work pays |
| 7 | Neutral to mixed | |
| 8 | Ashtama Sani — Bad | Health and obstacles — show warning |
| 9 | Unfavourable | Father-related issues, spiritual challenges |
| 10 | Good | Career growth through hard work |
| 11 | Very Good | Financial gains |
| 12 | Sade Sati (beginning) | Expenditure, travel, spiritual |

Sade Sati (houses 12, 1, 2 from Moon) = 7.5-year Saturn cycle. Never present it as purely negative — explain both the challenge and the spiritual-growth angle. Never show a flat "BAD" label.

### 15.4 Parihara (remedy) recommendations
Pariharas must be **chart-specific** (afflicted planet, dasha lord, dosha — never identical across users), follow **Tamil temple tradition**, and be **dasha-lord aware**.

Standard parihara table:

| Planet | Day | Temple deity | Primary remedy |
|--------|-----|-------------|---------------|
| Sun (Suryan) | Sunday | Surya / Shiva temples | Morning Surya Namaskar, Aditya Hridayam, offer red flowers |
| Moon (Chandran) | Monday | Shiva / Durga | Wear white, offer milk to Shiva, Chandra mantra |
| Mars (Chevvai) | Tuesday | Murugan / Kartikeya | Visit Murugan temple, offer red items, Chevvai parihara at Thiruneermalai |
| Mercury (Budhan) | Wednesday | Vishnu | Green offerings, Vishnu worship, Budha mantra |
| Jupiter (Guru) | Thursday | Brihaspati / Dakshinamurthy | Yellow offerings, Dakshinamurthy worship, Guru mantra |
| Venus (Sukran) | Friday | Lakshmi / Devi | White/pink flowers to Lakshmi, Shukra mantra |
| Saturn (Shani) | Saturday | Shani / Yama | Sesame oil lamp on Saturday, Shani stotram, visit Thirunallar |
| Rahu | — | Durga / Kali | Rahu kalam prayer, Durga worship, nagaprathishta |
| Ketu | — | Ganesha / Murugan | Ketu worship, Ashta Bhuja Durga, spiritual practice |

**Parihara engine logic (must run per-chart, never hardcoded):**
1. Find the current dasha lord → primary parihara (most urgent).
2. Find afflicted planets: debilitated, combust (within 6° of Sun), conjunct/aspected by Rahu/Ketu/Saturn with no benefic relief, or in 6th/8th/12th with no strength.
3. Check specific doshas: Chevvai dosham (Mars in 1/2/4/7/8/12) → Murugan remedy; Shani dosha (Saturn afflicting Lagna/Moon/Sun) → Saturday sesame lamp, Thirunallar; Rahu/Ketu dosha → Sarpa dosha parihara; Naga dosha → nagaprathishta; Pitru dosha → Pitru tharpanam, Aditya Hridayam.
4. Sun specifically (weak/debilitated/combust/afflicted): Surya Namaskar (12 rounds, facing east at sunrise), Aditya Hridayam, Arghyam, visit Suryanar Koil (Kumbakonam).
5. Return top 2–3 pariharas ordered by urgency (dasha lord → doshas → afflicted planets).

**Validation rule:** If two different charts get identical parihara recommendations, the logic is broken.

### 15.5 Retrograde planet rules
- A retrograde planet's effects are **internalized** — significations turn inward, delays/re-dos common.
- Never interpret retrograde identically to direct. In transit: slow timelines, add "review and reconsider" language. In natal chart: unique non-standard relationship with that planet's themes.
- Never skip noting retrograde status when displaying planetary positions.

### 15.6 Chandrashtama
When transiting Moon is in the 8th Rasi from natal Moon Rasi, show a caution notice — a "proceed carefully" notice, never a red error. (Frozen as 8th **rasi**, not 8th nakshatra — see §15.10.)

### 15.7 Positive window after caution
**Always state when a caution period improves.** Calculate the next transit/dasha shift that brings improvement and add it to the `outlook` text — never leave the user without a forward-looking positive statement.
> "This period shows caution for career moves (44/100). The planetary climate improves after 15 Aug 2026 when Jupiter enters your 9th house. Consider revisiting major decisions then."

### 15.8 Tamil marriage compatibility — Porutham (10 Poruthams)
Primary compatibility framework — NOT the same as synastry score.

| # | Porutham | What it checks | Weight |
|---|----------|----------------|--------|
| 1 | Dinam | Day star compatibility | Medium |
| 2 | Ganam | Nature (Deva/Manushya/Rakshasa) | High |
| 3 | Mahendram | Longevity and prosperity of the couple | High |
| 4 | Sthree Dheergam | Long life of the wife | High |
| 5 | Yoni | Sexual/physical compatibility | Medium |
| 6 | Rasi | Sign compatibility | High |
| 7 | Rasiyathipam | Lords of the Rasi | Medium |
| 8 | Vedha | Obstacles — some pairs forbidden | Critical — must not be violated |
| 9 | Vasya | Influence and attraction | Low |
| 10 | Rajju | Longevity of the husband | Critical — must not be violated |

**Rajju** and **Vedha** are non-negotiable — if either fails, the match is traditionally rejected regardless of other scores; always flag prominently. Minimum acceptable: 6/10 — display total count, not just percentage.

### 15.9 Cultural & ethical content rules — enforce in BOTH backend and frontend
- **Never compute marriage compatibility between family members.** Block at the service layer (`synastry_service.py`) before scoring: `parent↔child`, `grandparent↔grandchild`, `sibling↔sibling`, `uncle/aunt↔nephew/niece`. Cross-cousin marriages are traditional in some Tamil families — do not block `cousin`, but note it's a traditional practice. Return a clear error, not a score: *"Marriage compatibility analysis is not applicable for this relationship type."*
- **Marital status filtering:** a married person must NOT see marriage prospect windows, "find a life partner" goals, or nakshatra-based marriage timing — show married-life harmony content instead (7th house strength, Venus position, spousal compatibility). Divorced/widowed may see remarriage content only on explicit request.
- **Age-gating (mandatory in backend, not just frontend):** Under 16 → no marriage/relationship-compatibility content; Under 18 → no job-change/career windows; Under 14 → no relationship content; any age → no career content if student life-stage and age < 18. Return: *"This content is not applicable for the current life stage."*
- **Life-stage calibration:** Student (<22) → education/exams/parental relationships; Young adult (22–35) → career start/marriage/first home; Mid-life (35–55) → career advancement/children/health; Senior (55+) → retirement/health/spiritual/legacy. Never show identical predictions to a 16-year-old and a 50-year-old.

### 15.10 Frozen calculation standards — regression-locked, do not change silently
(Re-verified against live code 2026-06-05/07; covered by `tests/test_phase_d_regressions.py`, `tests/test_astrology_shared_rules.py`, `tests/test_porutham.py`)

- Panchangam nitya yoga: `VAIDHRITI`, `VISHKAMBHA`, `VAJRA` are ashubha for subha-muhurtham checks; `VARIYANA` is the matching auspicious nitya-yoga spelling; `AMRITA` is NOT one of the 27 nitya-yogas.
- Muhurta Krishna-paksha tithi scoring uses within-paksha tithi numbers (`tithi_number - 15` for tithi 16–30) — Krishna Dwitiya/Tritiya/Shashti/Saptami/Dashami/Ekadashi must be recognized correctly.
- Nakshatra→rasi mapping is pada-aware via the canonical 9-pada-per-rasi helper in `app/calculations/astro.py` — never reintroduce the old coarse 3-nakshatra-per-rasi formula.
- Chandrashtama = **8th rasi from natal Moon rasi**, not 8th nakshatra from Janma Nakshatra (Janma/Anujanma/Trijanma nakshatra checks are a separate concept).
- Pariharam Badhaka-dosham targeting uses the lagna-specific badhaka lord via `get_badhaka_lord(lagna_rasi, SIGN_LORD)` — never hardcoded Saturn.
- Ardhashtama Sani (4th-from-Moon) is **kept** as an active affliction alongside Kantaka Sani (4th-from-Lagna) — both are genuine, distinct cautions; the daily-score double-count is already guarded in `daily_guidance_service.py` (decision 2026-06-05, issue T3).

---

## 16. CONTENT TONE RULES — never violate in generated text

Every generated string, notification, narrative, and explanation must follow these rules:

1. **Never say "will happen"** — say "traditionally associated with" or "indicates a tendency."
2. **Never say "bad times", "danger", "suffer"** — say "caution period", "refinement cycle", "calls for care."
3. **Saturn / Sani** — always frame as discipline, restructuring, growth, longevity — never punishment.
4. **Health** — preventive nudges only ("this period calls for attention to bone health") — never diagnosis, never alarm. Always pair with the medical qualifier: *"This is a traditional tendency based on planetary associations, not a medical prediction. Consult a healthcare provider for health decisions."*
5. **Death** — never mentioned, not even indirectly.
6. **Every caution must pair with an action** — "X is challenging → here is what helps" (see §15.7 for the positive-window rule).
7. **Remedies are optional** — never mandatory rituals; always framed as "traditional practices that many people find supportive."

---

## 17. UI/UX & FEATURE-SPECIFIC RULES

### 17.1 Frontend API calls — always through the proxy helper
All frontend API calls **must** go through `apiFetchJson()` from `web/lib/api.ts` (it prepends `/api/backend`, routed by the Next.js proxy to FastAPI). Never call `fetch('/api/v1/...')` directly — there is no Next.js route at that path and it 404s.
```ts
// WRONG — 404s
fetch(`/api/v1/charts/${chartId}/life-events`, { credentials: "include" })
// CORRECT — through the proxy
apiFetchJson(`/api/v1/charts/${chartId}/life-events`)
```
When the backend returns HTTP 204 (e.g., logout), the proxy must return a `null` body, not an empty `ArrayBuffer`:
```ts
if (response.status === 204) {
  return new NextResponse(null, { status: 204, headers: responseHeaders });
}
```

### 17.2 South Indian chart grid — Jathagam Kattam (ஜாதகம் கட்டம்)
The traditional South Indian **square** birth chart grid is the standard for Tamil astrology — never the North Indian circular/diamond format. Every chart in Vinaadi must use it.

```
┌──────────┬──────────┬──────────┬──────────┐
│  12      │   1      │   2      │   3      │
│ (Pisces) │ (Aries)  │(Taurus)  │(Gemini)  │
├──────────┼──────────┼──────────┼──────────┤
│  11      │          │          │   4      │
│(Aquarius)│          │          │ (Cancer) │
├──────────┼──────────┼──────────┼──────────┤
│  10      │          │          │   5      │
│(Capricorn│          │          │  (Leo)   │
├──────────┼──────────┼──────────┼──────────┤
│   9      │   8      │   7      │   6      │
│(Sagittar)│(Scorpio) │ (Libra)  │ (Virgo)  │
└──────────┴──────────┴──────────┴──────────┘
```
The fixed signs in the grid never change — the Lagna house shifts based on birth Rasi, and planets are placed in whichever house corresponds to their sign.

Required on every chart: all 12 houses, planet abbreviations in Tamil + English, Lagna marked clearly, rasi name/number per house, all 9 grahas, dasha balance at birth, download/share as image. If birth time is unknown/approximate, show: *"Birth time not confirmed — Lagna may be inaccurate."* Never replace the grid with a list/table — the visual kattam is required, on mobile and desktop.

Two-chart marriage comparison view: side-by-side Jathagam Kattams (name + DOB above each), Porutham table below (all 10, pass/fail — §15.8), prominent total ("7/10"), Rajju/Vedha status with a clear warning block if either fails (never hidden), and a dasha-compatibility note.

### 17.3 Decision Support vs. What-If Simulator — do not conflate
- **Decision Support** = compare two specific options the user is already considering ("Job Offer A vs B") → which does the current planetary period favour? It is NOT a fortune-teller; it never predicts outcomes.
- **What-If Simulator** = simulate ONE hypothetical action ("what if I start a business in Sept 2026?") → timing analysis for that single scenario.
Both need clear onboarding copy explaining the distinction — users have been confused between them.

`/api/v1/decisions/brief` request body (exact shape — the `scenario` field does NOT exist, never send it):
```json
{
  "chartId": "uuid",
  "optionA": { "label": "string (required)", "description": "string (required)" },
  "optionB": { "label": "string (required)", "description": "string (required)" },
  "priority": "career | family | health | relationship | education | money | spiritual",
  "targetDate": "YYYY-MM-DD"
}
```

### 17.4 Shadow work journal
Jungian-adapted introspective journaling using the Rahu/Ketu axis, 8th house, and 12th house. Must be chart-specific: Rahu sign/house → "what you chase but fear," Ketu → "what you abandon but need," 8th-house lord placement drives the shadow theme. All API calls go through `apiFetchJson()` (§17.1).

### 17.5 Life event log — valid event types
`app/schemas/life_event_log.py` (`VALID_EVENT_TYPES`) and the frontend dropdown in `dashboard-life-event-log.tsx` must always stay in sync:
```
JOB_CHANGE, PROMOTION, DEMOTION, JOB_LOSS,
RELATIONSHIP_START, RELATIONSHIP_END, MARRIAGE, DIVORCE, REMARRIAGE,
RELOCATION, TRAVEL_ABROAD,
HEALTH_EVENT, SURGERY, RECOVERY,
EXAM_RESULT, EDUCATION_START, EDUCATION_END,
FINANCIAL_MILESTONE, INVESTMENT, PROPERTY_PURCHASE, DEBT,
FAMILY_LOSS, BIRTH_OF_CHILD,
BUSINESS_START, BUSINESS_END,
SPIRITUAL_EVENT, PILGRIMAGE, INITIATION,
LEGAL_MATTER,
OTHER
```

### 17.6 General UI guardrails
- Never use `var(--color-surface, #fff)` as a fallback — undefined CSS var → white-on-white text. Define `--color-surface` for both light and dark modes; test all form inputs in both.
- Ask Vinaadi must always be a **floating button** (fixed, bottom-right) opening an overlay/drawer — never buried in a tab.
- Every CTA ("See Full Guidance", "Explore", "View More") must have a working `onClick`/`href` — never merge one with `onClick={() => {}}` or no handler. "See Full Guidance" specifically must scroll to `id="personal-daily-guidance"`.
- Dasha timeline planet colors must contrast against both themes and against each other. Score indicators: green ≥ 65, yellow 45–64, red < 45.
- No single dashboard tab should require more than 3 full scrolls to reach the bottom.

---

## 18. ANTI-PATTERNS — what not to do

| Don't | Why | Do instead |
|-------|-----|-----------|
| Use `fetch('/api/v1/...')` in frontend | No Next.js handler at that path → 404 | `apiFetchJson('/api/v1/...')` |
| Fix encoding with an iterative Python script | Creates double-encoding, corrupts Tamil text | Set `PYTHONIOENCODING=utf-8` / `PYTHONUTF8=1` env vars, run once |
| Drop or truncate any table in `vinaadi_dev` | Real user data — irreversible | Back up first; do schema work against the test DB |
| Show marriage content to family-member pairs | Culturally inappropriate | Block at service layer, return a clear error |
| Show a caution period without a positive window | Leaves the user without hope or guidance | Always add "improves on [date]" (§15.7) |
| Merge a button with no `onClick`/`href` | Dead UX, breaks trust | Wire the action before merging |
| Apply identical predictions to all users | Not personalized, not meaningful | Filter by age, marital status, life stage |
| Give generic pariharas that don't match the chart | Wrong astrological advice | Chart-specific dosha + dasha-lord pariharas (§15.4) |
| Score Jupiter 7th-from-Moon as bad | Incorrect per Thirukanitha | Score as 65–70 (good/mixed) |
| Use `Out-File` to write Tamil-text files | Writes UTF-16 with BOM, breaks Python | Use the Write tool or `Set-Content -Encoding utf8` |
| Run `alembic upgrade head` on `vinaadi_dev` without review | May run a destructive migration | Read the migration file first; test on `vinaadi_test` |
| Send `scenario` or `optionALabel` to `/decisions/brief` | Schema mismatch → 422 | Send `optionA`/`optionB` as `{label, description}` objects (§17.3) |
| Pass an empty `ArrayBuffer` as a 204 response body | `NextResponse` constructor error | `new NextResponse(null, { status: 204 })` (§17.1) |
| Amend an existing git commit after a hook failure | The commit didn't happen — amend would clobber the previous one | Always create a NEW commit |
