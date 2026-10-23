# Vinaadi AI — Agent Instructions
**Last updated:** 2026-10-08 (A16: contradictions with current source resolved)  
**Test suite:** see CI  
**Stack:** FastAPI + PostgreSQL + SQLAlchemy (backend) · Next.js 15 + TypeScript (web) · Expo (mobile) · `@vinaadi/shared` (`packages/shared`)

**Which document wins.** This file is a summary and loses every conflict:

1. **Workspace, shell, database safety, API-contract coordination:** [CLAUDE.md](../CLAUDE.md).
2. **Astrology doctrine:** the ratified decisions in
   [DOCTRINE_DECISIONS_V1.md](DOCTRINE_DECISIONS_V1.md) and
   [DOCTRINE_DECISIONS_V1.2.md](DOCTRINE_DECISIONS_V1.2.md), then the dated owner
   rulings recorded after them (rulebook appendix, `MASTER_FIX_LIST.md`). A later
   dated ruling supersedes an earlier one; a refactor never creates doctrine.
3. **Current status of work:** [MASTER_FIX_LIST.md](MASTER_FIX_LIST.md) and
   [ROADMAP_TASKS.md](ROADMAP_TASKS.md). Status sections below marked *historical*
   are dated snapshots, not the current state.

`tests/test_authoritative_docs.py` fails if a path or link named here stops
existing. It cannot tell whether the sentence around a path is still true.

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
- Shadbala (6-fold planetary strength) **is** computed (`app/calculations/shadbala.py`, served by `app/services/shadbala_service.py`), but the daily score does not read it — the weights above stay custom
- Ashtakavarga is computed (`app/calculations/ashtakavarga.py`); the daily score reads Bhinnashtakavarga bindus to grade each transit (`_transit_with_av_score`)
- No Ashtamangala or Mrityu Bhaga check
- Jupiter/Saturn Lagna-based bonus/penalty is a supplemental adjustment on top of Moon-based score, not classical

**If asked to "fully follow Thirukanitham methodology"** — be honest: core framework follows it (ayanamsa, dasha, kalam, nakshatra, house system), but the daily score weights are the author's custom formula, not from any printed Thirukanitham text.

**Repo root:** `D:\sanstro`  
**Shell:** PowerShell. Use `.\.venv\Scripts\python.exe` for Python.  
**Run tests:** set the test-DB variables from CLAUDE.md rule 4 first (`vinaadi_test` on port 5433 — never `vinaadi_dev`), then `.\.venv\Scripts\python.exe -m pytest tests/ -x -q`. Add `--no-cov` for a subset; the suite is coverage-gated.

---

## 2. MANDATORY RULES — READ BEFORE ANY CODE CHANGE

### Astrological rules (never violate)
- Ayanamsa: **Lahiri sidereal** only (`SE_SIDM_LAHIRI` in `app/calculations/ephemeris.py`). Never tropical.
- House system: **Whole Sign** (`"W"`) only. Never Placidus or Equal.
- Rahu/Ketu: **Mean node** only (`SE_MEAN_NODE`). Never true node.
- Dasha: **Vimshottari** only. Period lengths in `app/calculations/dasha.py` — do not change.
- Chandrashtama: **8th Rasi from natal Moon Rasi** — NOT 8th nakshatra. Code in `app/services/daily_guidance_service.py`. (BUG-01 fixed, don't revert.)
- Amavasai (Tithi 30): **No score penalty**. It is a sacred ancestor day — trigger content card only. (BUG-02 fixed, don't revert.)
- Kandaka Sani: Saturn in the **4th, 7th or 10th from the Janma Rasi** (natal Moon), labelled "Kantaka Sani (from Janma Rasi)" / "கண்டக சனி (ஜென்ம ராசி)" on every surface. Ruled 2026-08-19 (doctrine A-1, `docs/VINAADI_RULEBOOK_TABLE_APPENDIX.md` `GO-10`), superseding BUG-03's Lagna reckoning. It overlaps the Moon cycles by design — 4th from the Moon is Ardhashtama *and* Kandaka — and the score still applies one penalty. Code: `classify_kandaka_cycle` in `app/calculations/transits.py`.
- Kalam timings (Rahu Kalam, Yamagandam, Kuligai): divide the actual local sunrise-to-sunset daylight interval into 8 equal parts, then apply the weekday slot order. Code anchors at `sunrise` and uses `(sunset - sunrise) / 8` in `app/calculations/panchangam.py`.
- Transit scoring: primary reference is **Janma Rasi (natal Moon)**. Jupiter/Saturn from Lagna are secondary adjustments only.
- Score formula weights (`TRANSIT_BASE_SCORE`, `PLANET_DAILY_WEIGHT`, `PLANET_PERIOD_SCORE`) are in `app/services/daily_guidance_service.py`. Do not change these without explicit instruction — they are the author's calibrated values.
- Original score calculation intent is documented in `docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md`. When formula spec conflicts with product spec, **formula spec wins for calculations within the Thirukanitham standard**, product spec wins for UX. Both lose to the ratified doctrine decisions and later dated owner rulings (see "Which document wins" above).

### Coding rules
- Every user-facing string must have both `ta` and `en` fields. Never hardcode Tamil or English only.
- Never add `ensure_ascii=True` to JSON serialisation — Tamil bytes must pass through as UTF-8.
- All JSON responses must include `Content-Type: application/json; charset=utf-8` (handled by `SecurityHeadersMiddleware` in `app/middleware.py`).
- Version strings live in `app/constants/versions.py`: `CHART_CALCULATION_VERSION` (the natal-chart engine) and `API_RESPONSE_VERSION` (non-chart responses). Bumping either **recomputes nothing** — it records provenance. Recomputing stored charts is a deliberate migration.
- Panchangam results are cached in the `panchangam_cache` table by `app/services/panchangam_cache.py` (the read-through cache and the session-taking `calculate_daily_panchangam`; the calculation itself, `compute_daily_panchangam`, takes no session). After a kalam/tithi calculation fix, bump `PANCHANGAM_CACHE_DATA_VERSION` in `app/calculations/panchangam.py` so stale rows stop matching. Never run `DELETE` against `vinaadi_dev` by hand.
- Run the full test suite before marking any task done; it must be green.

---

## 3. PROJECT STRUCTURE

```
sanstro/
├── app/
│   ├── api/              # FastAPI routers (one file per domain)
│   ├── calculations/     # Astrological math — intended DB-free (A13: panchangam.py still does cache SQL)
│   ├── constants/        # Version strings and shared constants
│   ├── core/             # Config, auth (JWT), security
│   ├── db/               # SQLAlchemy session
│   ├── middleware.py     # Rate limiting, security headers, request logging
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   └── services/         # Business logic (calls calculations + DB)
├── docs/                 # Specs and instructions
├── migrations/           # Alembic migrations
├── tests/                # pytest test suite
├── mobile/               # Expo app
├── packages/shared/src/
│   ├── api/              # Typed endpoint wrappers — new endpoints go here (CLAUDE.md)
│   └── types/index.ts    # Response types shared by web and mobile
└── web/                  # Next.js frontend
    ├── app/
    │   ├── api/backend/[...path]/route.ts   # Proxy: all /api/backend/* → FastAPI
    │   └── dashboard/    # Dashboard routes
    ├── components/       # React components
    ├── hooks/            # Feature data hooks (TanStack Query)
    └── lib/
        ├── api.ts        # apiFetchJson + binds the shared ApiClient to it
        ├── backend-url.ts # The one resolver for the server-side backend URL
        ├── format.ts     # formatClockLabel, formatDateLabel, getScoreBand
        ├── i18n.ts       # Core UI strings + panchangam lookup maps (more catalogs beside it)
        └── types.ts      # Web-only types; shared response types live in packages/shared
```

---

## 4. BACKEND — KEY FILES

### Router registration (`app/main.py`)
All routers mount under `/api/v1` prefix (set in `app/core/config.py`).

The route inventory is the application's own OpenAPI document, not a table
here — a copied table listed 22 routers and went stale as the app grew past
it. Read the decorators under `app/api/`, or generate the schema from the app
(`app.openapi()`) in a test environment. The contract guards
`tests/test_api_wrapper_route_contract.py` and
`tests/test_api_wrapper_field_contract.py` check the shared wrappers against it.

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
- `RateLimitMiddleware` — 120 req/min per IP sliding window (fails open on a limiter outage by design; the auth endpoints instead return a bounded 503 — A06)

### Config (`app/core/config.py`)
Every setting is read with the `JOTHIDAM_` prefix (`JOTHIDAM_DATABASE_URL`, `JOTHIDAM_FCM_PROJECT_ID`, …), and any setting may instead be read from the file named by `JOTHIDAM_<NAME>_FILE` — the custody path for secrets (`docs/SEC1_SECRET_CUSTODY_RULING.md`). The `Settings` class is the list.

---

## 5. FRONTEND — KEY FILES

### State management
Server data lives in feature hooks under `web/hooks/` on TanStack Query
(`web/lib/queryClient.ts` sets the shared stale times). A panel that loads from
the API uses `useApiQuery` (`web/hooks/useApiQuery.ts`) or a feature hook such
as `usePersonalData`/`useFamilyData` — not a hand-rolled `useState` +
`useEffect` block, which refetched on every tab switch.

`web/components/dashboard-workspace.tsx` is still the dashboard shell and still
holds a large share of cross-feature UI state (route, selected chart, overlays).
That coupling is architecture finding A13 — do not add new server data to it.

The old prop-by-prop inventory of this file is gone on purpose: it described a
component that had already moved on. Read the component's own props type.

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
All frontend API calls go to `/api/backend/api/v1/...` → proxied to FastAPI. The server-side backend URL is resolved in one place, `web/lib/backend-url.ts` (A01): `BACKEND_URL`, with the legacy `API_BASE_URL` accepted as an alias. The `http://127.0.0.1:8000` default applies to `next dev` only — the request-time proxy refuses to fall back to it in production. Never add another inline `?? "http://127.0.0.1:8000"`. The proxy also sets `charset=utf-8` on JSON responses.

### UI primitives (`web/components/ui/`)
The Nova component kit — `Card`, `Button`, `Segmented`, `Chip`, `BilingualText`, … — imported from `@/components/ui`. `AsyncSection` (loading / error / unavailable states) is imported from `@/components/ui/async-section`. `Score`, `Table` and `ProgressBar` are imported from their own files, never the barrel (they pull in framer-motion; see the note in `web/components/ui/index.ts`). Styling lives in the component-kit section of `web/app/dashboard/dashboard-nova.css`.
The older `web/components/dashboard-ui.tsx` primitives (`Surface`, `Metric`, `Modal`, …) remain in use but are not where new primitives go.

---

## 6. TYPESCRIPT TYPES

Response types shared by web and mobile live in
`packages/shared/src/types/index.ts`; `web/lib/types.ts` holds web-only types.
Read the type there rather than a copy here — this section used to reproduce
four response shapes and they drifted.

Two rules the types alone will not tell you:

- **Render the key, not the name.** Most astrology terms arrive twice — a
  language-free key and a pre-rendered English name (`rasi` vs `rasiName`). See
  CLAUDE.md "Display boundary".
- **A wrapper's declared type is an assertion, not a check.** The shared client
  transports `unknown` and casts. Until generated contracts land (A14), a
  backend field rename compiles cleanly on both sides.

---

## 7. WHAT IS NOT IN THE FRONTEND YET — *historical (2026-05-27), superseded*

Kept as a dated record and no longer maintained. Current status lives in
`docs/MASTER_FIX_LIST.md` and `docs/ROADMAP_TASKS.md`.

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

*Rewritten 2026-10-08 (A16). The previous recipe added state to
`dashboard-workspace.tsx` and ended its fetch in `.catch(() => {})` — a failure
nobody could see, in the component architecture finding A13 is trying to shrink.
Do not follow copies of it.*

### Step 1 — A typed wrapper in `packages/shared/src/api/`
New endpoints get a wrapper there (CLAUDE.md forward policy), with its response
type in `packages/shared/src/types/index.ts`. Re-read the FastAPI decorator and
confirm path-vs-query and the HTTP verb before wiring it — two wrappers have
drifted from their routes before. In web the shared client already runs over
`apiFetchJson` (bound in `web/lib/api.ts`), so the proxy is used either way.

### Step 2 — Read it through a hook, not component state
```typescript
// e.g. in web/hooks/ or beside the panel
const { data, state, refetch } = useApiQuery({
  key: ["my-feature", chartId],
  queryFn: () => getMyFeature(chartId).then((r) => r.data),
  enabled: Boolean(chartId),
  // Only if a 404 means "not available for this chart", not "broken":
  // (dashboard-propensities-panel-nova.tsx is the one current example)
  unavailableWhen: (e) => /404/.test(String((e as { message?: string })?.message ?? e)),
});
```

### Step 3 — Render every state, including failure
```tsx
<AsyncSection
  state={state}
  error={{ ta: "…ஏற்ற முடியவில்லை.", en: "Could not load my feature." }}
  onRetry={refetch}
/>
{data && <Card>{/* render keys through their localisers */}</Card>}
```
A failure is shown, or deliberately classified as "unavailable" — never
swallowed. If something genuinely must not block the page, say so in a comment
that names what the user sees instead.

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

### Step 5 — Tests (`tests/test_<feature>.py`)
Test at least: happy path, missing data returns null not crash, auth required.

### Step 6 — Keep `response_model` concrete
A route without a concrete `response_model` is invisible to the contract
guards — nine operations were skipped for exactly this (A14). Then add the
shared wrapper (frontend Step 1).

---

## 10. DATABASE MODELS (summary)

The models are the list: `app/models/`, one file per table. A copied field table
here had already gone wrong (dasha periods are stored as Julian days, not dates).

Two things the model files will not warn you about:

- **Encrypted columns cannot be filtered in SQL.** Birth instant, place and
  timezone, current location, `charts.julian_day`/`lagna_longitude`, planet
  longitudes/degree/speed/`raw_payload`, and `family_members.date_of_birth_local`
  are Fernet ciphertext (A12b, migration `uu4e5f6a7b8c`). Compare them in
  Python after decryption. A new encrypted column must also be added to
  `scripts/rotate_encryption_key.py` and `scripts/verify_restore.py`. See
  `docs/DATA_PROTECTION.md`.
- Rasi/nakshatra/pada keys stay plaintext by ruling — which is why the public
  copy does not claim birth details are encrypted at rest.

---

## 11. TEST FILES

Set the test-DB variables first (CLAUDE.md rule 4). A second pytest run on this
machine drops the first one's schema — check for one before believing a local
failure (CLAUDE.md "Local test runs are not authoritative").

Run all: `.\.venv\Scripts\python.exe -m pytest tests/ -x -q`  
Run one: `.\.venv\Scripts\python.exe -m pytest tests/test_panchangam_api.py -x -v --no-cov`

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
| `docs/archive/FRONTEND.md` | *Archived.* Early UI status and backlog; historical only |
| `docs/VINAADI_ENHANCEMENT_ROADMAP_v1.md` | Forward roadmap, decisions log — what to build next and why |
| `docs/DOCTRINE_DECISIONS_V1.md`, `docs/DOCTRINE_DECISIONS_V1.2.md` | Ratified doctrine — wins over every spec above |
| `docs/MASTER_FIX_LIST.md` | What is actually done, with each item's gate and blind spots |
| `docs/INDEX.md` | Map of every doc |

The OpenAPI YAML and the PostgreSQL DDL above are 2026 v1 design documents, not
generated from the running app — the app's own `app.openapi()` and `app/models/`
plus `migrations/` are the current contract and schema.

**Conflict resolution rule:** see "Which document wins" at the top of this file.
Among the original specs, formula spec > product spec for calculations.

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
| Hardcoding Tamil string directly in JSX | Put the string pair in the catalog that owns the surface — `web/lib/i18n.ts`, `web/lib/dashboard-i18n.ts`, `web/lib/marketing-i18n.ts` or `web/lib/login-i18n.ts` — and render the active language only |
| Using `ensure_ascii=True` in any JSON serialisation | Tamil bytes must flow as raw UTF-8 |
| Amending existing git commit after hook failure | Always create a NEW commit — never `git commit --amend` after a failed hook |

---

## 14. STATUS SNAPSHOT (2026-05-24) — *historical, superseded*

Kept as a dated record and no longer maintained; it is not the current state.
Current status: `docs/MASTER_FIX_LIST.md`. One line below is now **wrong**
rather than merely old — kalam is *not* on fixed 90-minute slots; see §2
(sunrise-to-sunset ÷ 8).

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
- ~~Kalam times fixed to Thirukanitham 90-min fixed slots — backend~~ *(superseded: daylight ÷ 8, §2)*

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
- Ardhashtama Sani (4th-from-Moon) is **kept** as an active affliction. Since doctrine A-1 (2026-08-19) Kandaka Sani is also counted from the Moon (4/7/10), so Saturn 4th from the Moon is *both* Ardhashtama and Kandaka — the reader is told both names and the daily score applies one penalty (`daily_guidance_service.py`). This supersedes the 2026-06-05 T3 wording, which paired Ardhashtama with a Lagna-reckoned Kantaka.

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
All frontend API traffic **must** go through the proxy transport in `web/lib/api.ts` (it prepends `/api/backend`, routed by the Next.js proxy to FastAPI). Never call `fetch('/api/v1/...')` directly — there is no Next.js route at that path and it 404s. For a **new** endpoint that transport is reached through its shared wrapper (§8 Step 1), which `web/lib/api.ts` binds to `apiFetchJson`; existing direct `apiFetchJson` call sites are grandfathered.
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

For the `packages/shared/src/api/` typed client (used genuinely by mobile, mostly bypassed by web today) see CLAUDE.md's "`packages/shared/src/api/` forward policy" — new endpoints get a wrapper there, and the wrapper's path/verb must be checked against the actual FastAPI route, not assumed.

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
Jungian-adapted introspective journaling using the Rahu/Ketu axis, 8th house, and 12th house. Must be chart-specific: Rahu sign/house → "what you chase but fear," Ketu → "what you abandon but need," 8th-house lord placement drives the shadow theme. All API calls go through the proxy transport (§17.1).

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
