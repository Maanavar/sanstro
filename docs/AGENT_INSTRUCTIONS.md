# Vinaadi AI — Agent Instructions
**Last updated:** 2026-05-24  
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
- Panchangam kalam slots: fixed 90-minute windows from 6:00 AM (not astronomical sunrise)
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
- Kalam timings (Rahu Kalam, Yamagandam, Kuligai): **fixed 90-minute slots from 6:00 AM local time** — NOT derived from actual sunrise. Code: `kalam_anchor = datetime.combine(date_local, time(6, 0), tzinfo=timezone_obj)` in `app/calculations/panchangam.py`.
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
| `app/calculations/panchangam.py` | Tithi, nakshatra, yoga, karana, kalam computation. **Kalam uses fixed 6 AM anchor.** |
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
| `docs/Vinaadi_AI_Enhancement_and_Bug_Fix_Instructions_v1.md` | All implemented features (FEATURE-01 to FEATURE-12, ARCH-01 to ARCH-03) with detailed specs |
| `docs/FRONTEND_SURFACE_GAP_PLAN.md` | Detailed plan for rendering emotionalWeather, nakshatraPerspective, journalInsight, contextInsight, ambientAlerts |

**Conflict resolution rule:** Formula spec > Product spec for calculations. Both > any other doc.

---

## 13. COMMON MISTAKES TO AVOID

| Mistake | Correct approach |
|---|---|
| Rendering raw panchangam key like `{tithi.name}` | Use `{tTithi(tithi.name, lang)}` |
| Rendering raw time `{window.start}` | Use `{formatClockLabel(window.start)}` |
| Rendering raw planet lord `{period.lord}` | Use `{tPlanetLord(period.lord, lang)}` |
| Tamil text shows as `தமிழ்` | Missing `charset=utf-8` - already fixed in middleware, check proxy route.ts |
| Kalam times don't match printed panchangam | Must use fixed 6 AM anchor, not sunrise — already fixed in panchangam.py |
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
