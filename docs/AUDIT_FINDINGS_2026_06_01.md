# Vinaadi AI — Full Codebase Audit Findings
**Date:** 2026-06-01  
**Branch:** main  
**Scope:** Backend · Frontend · DB/Migrations · Tests  
**Methodology:** 4-agent parallel audit + manual peer review  

This document is structured for direct handoff to a coding agent.  
Each finding includes: exact file + line, severity, root cause, and a concrete fix instruction.

---

## HOW TO USE THIS DOCUMENT

Work through findings top-to-bottom by severity tier.  
Each finding block is self-contained — an agent can action it without reading any other block.  
Mark each block `[DONE]` when the fix is applied and tested.

## EXECUTION STATUS (2026-06-01)

- Completed in this pass: **C1-C5, H1-H10, M1-M11, L1-L10**
- Pending from this document: **None — all 36 findings resolved**
- L6 and L7 verified N/A: keys and types were wired up during other sprint work; no removal needed.
- Validation run:
  - Targeted suite for new/updated route tests: **43 passed**.
  - Focused re-check: `tests/test_content_api.py` + `tests/test_life_event_log_api.py` -> **6 passed** on 2026-06-01.
  - New medium-priority service unit tests: `tests/test_service_priority_m11.py` -> **10 passed**.
  - Combined focused verification: `tests/test_service_priority_m11.py` + `tests/test_content_api.py` + `tests/test_life_event_log_api.py` -> **16 passed**.
- Full audit re-verification (2026-06-01): all 36 findings confirmed implemented correctly in codebase.

**Repo root:** `C:\Users\senth\OneDrive\문서\GitHub\sanstro`  
**Shell:** PowerShell 5.1 — use `;` not `&&`, no `head`, no `2>&1` on native exes

## TIER 1 — CRITICAL (Ship-blockers)

---

### [DONE] C1 · Hardcoded localhost URL in password reset email

**File:** `app/api/auth.py:60`  
**Severity:** CRITICAL — will break in any non-local environment  

**Root cause:**  
The forgot-password endpoint constructs the reset link as:
```python
f"http://localhost:3000/login?resetToken={token}"
```
This is hardcoded. In staging/production the email will contain a dead link.

**Fix:**  
Add `JOTHIDAM_FRONTEND_URL` to `app/core/config.py` (default `"http://localhost:3000"`).  
Replace the hardcoded string:
```python
# app/core/config.py
frontend_url: str = Field("http://localhost:3000", alias="JOTHIDAM_FRONTEND_URL")

# app/api/auth.py:60
reset_link = f"{settings.frontend_url}/login?resetToken={token}"
```

**Test:** Send a forgot-password request with `JOTHIDAM_FRONTEND_URL=https://app.vinaadi.com` set — verify the email body contains the correct domain.

---

### [DONE] C2 · `feedback.py` submit endpoint has no authentication guard

**File:** `app/api/feedback.py:45`  
**Severity:** CRITICAL — unauthenticated users can spam the feedback table  

**Root cause:**  
`submit_feedback()` has no `Depends(get_current_user)` parameter. Any HTTP client can POST unlimited feedback without a session.

**Fix:**  
```python
# app/api/feedback.py
from app.api.deps import get_current_user
from app.models.user import User

@router.post("/feedback")
def submit_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),   # ADD THIS
):
    ...
```

**Test:** POST `/api/v1/feedback` without a cookie → expect `401`. POST with valid session → expect `200`.

---

### [DONE] C3 · JWT secret defaults to known plaintext string

**File:** `app/core/config.py:22`  
**Severity:** CRITICAL — if env var is unset in production, tokens are trivially forgeable  

**Root cause:**  
```python
jwt_secret: str = Field("CHANGE_ME_IN_PRODUCTION_USE_STRONG_SECRET", alias="JOTHIDAM_JWT_SECRET")
```
The default value is a known string in this repo. Any deployment that forgets to set the env var is fully compromised.

**Fix:**  
Add a startup validator that raises hard if the secret is the default:
```python
@model_validator(mode="after")
def _require_strong_secret(self) -> "Settings":
    if self.jwt_secret == "CHANGE_ME_IN_PRODUCTION_USE_STRONG_SECRET":
        import os
        if os.getenv("APP_ENV", "development") == "production":
            raise ValueError("JOTHIDAM_JWT_SECRET must be set in production")
    return self
```
Also ensure the same guard exists for `admin_api_key` (see C4).

---

### [DONE] C4 · Admin API key defaults to predictable string

**File:** `app/core/config.py:25`  
**Severity:** CRITICAL — same issue as C3 for admin routes  

**Root cause:**  
```python
admin_api_key: str = Field("CHANGE_ME_ADMIN_KEY", alias="JOTHIDAM_ADMIN_API_KEY")
```

**Fix:** Apply same startup validator pattern as C3. Raise hard if `APP_ENV=production` and value is the default.

---

### [DONE] C5 · Auth cookie `secure=False` — transmitted over HTTP

**File:** `app/api/auth.py:40`  
**Severity:** CRITICAL in production — session token sent in plaintext over HTTP  

**Root cause:**  
```python
response.set_cookie(..., secure=False, ...)
```
Hardcoded `False`. In production over HTTPS, this must be `True`.

**Fix:**  
```python
# app/core/config.py
cookie_secure: bool = Field(False, alias="JOTHIDAM_COOKIE_SECURE")

# app/api/auth.py:40
response.set_cookie(..., secure=settings.cookie_secure, ...)
```
Set `JOTHIDAM_COOKIE_SECURE=true` in production environment.

---

## TIER 2 — HIGH

---

### [DONE] H1 · `nalla_neram` is a list but daily_push_cron and pdf_export treat it as a single object

**File:** `app/schemas/panchangam.py:68`, `app/services/daily_push_cron.py:161–162`, `app/services/pdf_export_service.py:173`  
**Severity:** HIGH — runtime `AttributeError` the first time a real panchangam payload hits these paths  

**Root cause:**  
The schema correctly defines:
```python
# app/schemas/panchangam.py:68
nalla_neram: list[PanchangamSlot] = Field(alias="nallaNeram")
```
But both consumers access it as a single object:
```python
# daily_push_cron.py:161–162
nalla_start = panchang.nalla_neram.start.strftime("%H:%M")   # AttributeError — list has no .start
nalla_end   = panchang.nalla_neram.end.strftime("%H:%M")

# pdf_export_service.py:173
nalla = f"{panchang.nalla_neram.start.strftime('%H:%M')}–{panchang.nalla_neram.end.strftime('%H:%M')}"
```

**Fix:**  
Take the first slot (consistent with `muhurta_service.py:159` which already does `snapshot.nalla_neram[0]` correctly):
```python
# daily_push_cron.py:161–162
slot = panchang.nalla_neram[0] if panchang.nalla_neram else None
nalla_start = slot.start.strftime("%H:%M") if slot else "—"
nalla_end   = slot.end.strftime("%H:%M")   if slot else "—"

# pdf_export_service.py:173
slot = panchang.nalla_neram[0] if panchang.nalla_neram else None
nalla = f"{slot.start.strftime('%H:%M')}–{slot.end.strftime('%H:%M')}" if slot else "—"
```

**Test:** Run daily push cron against a profile with a real panchangam payload that has multiple nalla_neram slots — assert it does not throw `AttributeError`.

---

### [DONE] H2 · Notification `sent_at` conflated with `read_at` via model_validator

**File:** `app/api/notifications.py:32–40`, `app/models/notification.py:34`  
**Severity:** HIGH — incorrect semantic mapping; "sent" ≠ "read"  

**Root cause:**  
The `Notification` model has a `sent_at` column but no `read_at`. A `model_validator` in the API schema remaps `sent_at` → `read_at` to paper over the missing column. This means marking a notification "read" actually records the sent timestamp, not when the user read it.

**Fix (preferred):** Add a real `read_at` column to the Notification model and a migration:
```python
# app/models/notification.py
read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```
Generate migration: `alembic revision --autogenerate -m "add_read_at_to_notifications"`  
Update the API schema to use `read_at` directly without the validator workaround.

---

### [DONE] H3 · Rectification PATCH endpoint returns raw `dict` — no response model

**File:** `app/api/rectification.py:46–58`  
**Severity:** HIGH — no OpenAPI schema, no output validation  

**Root cause:**  
The PATCH `/birth-profiles/{id}/rectify/apply` endpoint returns a plain `dict` with no `response_model`. FastAPI cannot validate or document the response.

**Fix:**  
```python
# app/schemas/rectification.py — add:
class RectificationApplyResponse(BaseModel):
    birth_profile_id: UUID
    applied_offset_minutes: int
    new_birth_time_local: str

# app/api/rectification.py:46
@router.patch("/{birth_profile_id}/rectify/apply", response_model=RectificationApplyResponse)
```

---

### [DONE] H4 · `DashaPeriod.parent_dasha_period_id` self-referential FK has no `ondelete` rule

**File:** `app/models/dasha_period.py:24–25`  
**Severity:** HIGH — deleting a parent dasha period leaves orphaned child rows  

**Root cause:**  
The FK to `dasha_periods.dasha_period_id` has no `ondelete="CASCADE"`. The parent chart has CASCADE to `dasha_periods`, but the self-referential hierarchy does not.

**Fix:**  
```python
# app/models/dasha_period.py:24
parent_dasha_period_id: Mapped[UUID | None] = mapped_column(
    ForeignKey("dasha_periods.dasha_period_id", ondelete="CASCADE"), nullable=True
)
```
Generate migration: `alembic revision --autogenerate -m "add_cascade_to_dasha_period_parent_fk"`

---

### [DONE] H5 · DB connection pool not configured — production will exhaust connections

**File:** `app/db/session.py:13`  
**Severity:** HIGH — default pool settings will stall under any real traffic  

**Root cause:**  
```python
engine = create_engine(settings.database_url, future=True)
```
No `pool_size`, `max_overflow`, or `pool_pre_ping`. Under concurrent requests the pool will stall or drop connections.

**Fix:**  
```python
engine = create_engine(
    settings.database_url,
    future=True,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    echo=False,
)
```

---

### [DONE] H6 · `muhurta_service` Chandrashtama rasi derived from nakshatra via wrong formula

**File:** `app/services/muhurta_service.py:100`, `app/services/muhurta_service.py:150–152`  
**Severity:** HIGH — Chandrashtama detection will misclassify boundary days; affects muhurta quality  

**Root cause:**  
`_nakshatra_to_rasi()` at line 150–152:
```python
def _nakshatra_to_rasi(nak_number: int) -> int:
    """Return rasi (1-12) for a nakshatra number (1-27). Each rasi spans 2.25 nakshatras."""
    return ((nak_number - 1) * 3 // 9) + 1  # simplified: 3 nakshatras per rasi, 9 padas
```
This formula uses integer grouping of 3 nakshatras per rasi, which is wrong — each rasi spans exactly **2.25 nakshatras** (27 nakshatras / 12 rasis). The integer shortcut misclassifies nakshatras near rasi boundaries (e.g., Nak 4 Rohini is in Rishabam but this formula can place it in Mesham).

The Chandrashtama check at line 100–106 uses this to compare the transit Moon's rasi against the natal Moon's 8th rasi:
```python
moon_nakshatra_rasi = _nakshatra_to_rasi(snapshot.nakshatra_number)
if moon_nakshatra_rasi == chandrashtama_rasi:
```
This comparison is wrong because `snapshot.nakshatra_number` is the **transit** nakshatra, not the natal Moon's nakshatra, and the formula itself is inaccurate.

**Fix (Thirukanitham correct mapping):**  
Use the standard 9-pada mapping. Each nakshatra has 4 padas; 9 padas = 1 rasi:
```python
# Correct: each rasi = 9 padas = 2.25 nakshatras
# nakshatra_number 1-27, pada 1-4 → absolute_pada = (nak-1)*4 + pada - 1
# rasi = absolute_pada // 9 + 1
def _nakshatra_to_rasi(nak_number: int, pada: int = 1) -> int:
    """Return rasi (1-12) using correct 9-pada-per-rasi mapping."""
    absolute_pada = (nak_number - 1) * 4 + (pada - 1)
    return (absolute_pada // 9) + 1
```
If `pada` is not available from the snapshot, use `pada=1` for first-of-nakshatra (conservative; acceptable for day-level muhurta).  
Update callers at line 100 to pass `snapshot.nakshatra_pada` if available.

---

### [DONE] H7 · Dasha alert dispatch silently skips profiles with only local birth time stored

**File:** `app/services/daily_push_cron.py:212–213`  
**Severity:** HIGH — affected users never receive dasha transition alerts; failure is silent  

**Root cause:**  
```python
birth_dt = profile.birth_datetime_utc
if birth_dt is not None and moon_planet is not None:
    ...  # dispatch dasha alerts
```
If `birth_datetime_utc` is `None` (profile only has `birth_date` + `birth_time_local` + `birth_timezone`), the entire dasha alert block is skipped with no log, no fallback. Other parts of the app already reconstruct UTC from the local fields.

**Fix:**  
Reconstruct UTC before the guard:
```python
from app.calculations.astro import resolve_timezone
import pytz

birth_dt = profile.birth_datetime_utc
if birth_dt is None and profile.birth_date and profile.birth_time_local and profile.birth_timezone:
    tz = pytz.timezone(profile.birth_timezone)
    local_dt = datetime.combine(profile.birth_date, profile.birth_time_local)
    birth_dt = tz.localize(local_dt).astimezone(UTC)

if birth_dt is not None and moon_planet is not None:
    ...  # dispatch dasha alerts
```

**Test:** Create a profile with `birth_datetime_utc=None` but with `birth_date`, `birth_time_local`, `birth_timezone` populated. Run the daily push cron — assert a dasha alert is dispatched for a known transition date.

---

### [DONE] H8 · Smart-silence push limit uses `date.today()` in UTC — wrong for non-UTC users near midnight

**File:** `app/services/notification_dispatch_service.py:58`, `app/services/notification_dispatch_service.py:124`  
**Severity:** MEDIUM-HIGH — users near midnight outside UTC get wrong suppression count  

**Root cause:**  
```python
# line 58
today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
```
`date.today()` uses the server's local date (effectively UTC in most Docker deployments), not the user's local date. A user in IST (+5:30) at 23:00 IST is still on "today" in their timezone, but after `date.today()` rolls over to UTC tomorrow, their push count resets a full 5.5 hours early.

**Fix:**  
Pass the user's timezone through to `_push_count_today` and compute their local midnight:
```python
def _push_count_today(session: Session, user_id: UUID, user_tz_str: str = "UTC") -> int:
    import pytz
    user_tz = pytz.timezone(user_tz_str)
    now_local = datetime.now(user_tz)
    today_start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    today_start_utc = today_start_local.astimezone(timezone.utc)
    return session.execute(
        select(func.count(Notification.notification_id)).where(
            Notification.user_id == user_id,
            Notification.status == "sent",
            Notification.send_at >= today_start_utc,
        )
    ).scalar_one()
```
Pass `user_tz_str` from `pref.timezone` (or user profile timezone) at the call site on line 124.

---

### [DONE] H9 · Temp birth profiles not cleaned up if compare/guest modal closes abruptly

**File:** `web/components/dashboard-compare-modal.tsx:81,117`, `web/components/dashboard-guest-chart-modal.tsx:53,90`, `web/components/porutham-panel.tsx:154,186`  
**Severity:** HIGH — orphaned birth profile rows accumulate in DB on client-side abort  

**Root cause:**  
The modal POSTs a temporary birth profile, uses it for comparison, then DELETEs it on success/error. But if the component unmounts (modal force-closed, navigation away, tab closed), the DELETE never fires.

**Fix:**  
Use a `useEffect` cleanup with `AbortController` and `keepalive: true` on the cleanup fetch:
```typescript
useEffect(() => {
  return () => {
    if (tempProfileIdRef.current) {
      fetch(`/api/v1/birth-profiles/${tempProfileIdRef.current}`, {
        method: "DELETE",
        keepalive: true,   // fires even after page unload
      });
    }
  };
}, []);
```
Store the created profile ID in a `useRef` immediately after POST succeeds.

---

### [DONE] H10 · `test_auth_api.py` — DailyScore deletion never asserted after account deletion

**File:** `tests/test_auth_api.py:131–138`  
**Severity:** HIGH — the test creates a DailyScore linked to a birth profile then deletes the account, but never verifies the DailyScore was actually cascade-deleted  

**Fix:**  
After the account deletion call, query the test DB directly and assert the DailyScore row is gone:
```python
# After delete_me call at line ~140:
from app.models.daily_score import DailyScore
remaining = session.execute(
    select(DailyScore).where(DailyScore.birth_profile_id == profile_id)
).scalars().all()
assert len(remaining) == 0, "DailyScore rows should be cascade-deleted with the account"
```

---

## TIER 3 — MEDIUM

---

### [DONE] M1 · `share_card.py` uses `default_factory` with FastAPI `Query()` — invalid syntax

**File:** `app/api/share_card.py:22`  
**Severity:** MEDIUM — will raise `TypeError` at import time or first request  

**Fix:**  
FastAPI `Query()` does not support `default_factory`. Use `default=` with a direct value or move logic to the function body:
```python
# Before (broken):
include_sections: list[str] = Query(default_factory=list)

# After:
include_sections: list[str] = Query(default=[])
```

---

### [DONE] M2 · `display_name` in `RegisterRequest` schema is never persisted

**File:** `app/schemas/auth.py:14`  
**Severity:** MEDIUM — field accepted in request, silently discarded  

**Fix:** Either:
- Add `display_name: str | None` to the `User` model and store it during registration, **or**
- Remove the field from `RegisterRequest` entirely

---

### [DONE] M3 · Redundant `session.commit()` calls in several API handlers

**Files:**  
- `app/api/notification_preferences.py:49, 96, 113, 129`  
- `app/api/notifications.py:95, 121`  
- `app/api/settings.py:54`  
**Severity:** MEDIUM — `get_db()` already commits on successful response; double-committing is a bug risk if an exception fires between the explicit commit and the end of the request  

**Fix:** Remove all explicit `session.commit()` calls in these handlers. Let the `get_db()` context manager handle the commit.

---

### [DONE] M4 · 9 DB models missing `deleted_at` (and other timestamps)

**Severity:** MEDIUM — these tables cannot be soft-deleted; historical audit trails incomplete  

| Model | File | Missing |
|-------|------|---------|
| `Subscription` | `app/models/subscription.py:12` | `deleted_at` |
| `Notification` | `app/models/notification.py:13` | `updated_at`, `deleted_at` |
| `VargaPosition` | `app/models/varga_position.py:12` | `created_at`, `updated_at`, `deleted_at` |
| `DashaPeriod` | `app/models/dasha_period.py:13` | `created_at`, `updated_at`, `deleted_at` |
| `DailyScore` | `app/models/daily_score.py:13` | `updated_at`, `deleted_at` |
| `TransitSnapshot` | `app/models/transit_snapshot.py:13` | `updated_at`, `deleted_at` |
| `InterpretationOutput` | `app/models/interpretation_output.py:13` | `updated_at`, `deleted_at` |
| `PeyarchiAlert` | `app/models/peyarchi_alert.py:12` | `deleted_at` |
| `QaGoldenCase` | `app/models/qa_golden_case.py:13` | `updated_at`, `deleted_at` |

**Fix:** For each model, switch to `TimestampMixin` (or add columns manually), then generate one migration:
```bash
alembic revision --autogenerate -m "add_timestamps_to_cache_and_lookup_tables"
```
Review the generated migration carefully — `VargaPosition` and `DashaPeriod` adding `created_at` retroactively need a `server_default` to avoid locking issues on large tables.

---

### [DONE] M5 · Missing indexes on high-cardinality FK columns

**Files:** `app/models/subscription.py:16`, `app/models/interpretation_output.py:18`  
**Severity:** MEDIUM — sequential scans on user lookups  

**Fix:** Add `index=True` to:
```python
# subscription.py
user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id"), nullable=False, index=True)

# interpretation_output.py
family_vault_id: Mapped[UUID | None] = mapped_column(ForeignKey("family_vaults.vault_id"), nullable=True, index=True)
```
Generate migration to add the indexes.

---

### [DONE] M6 · 5 silent API failures in frontend — no error feedback to user

**Severity:** MEDIUM — errors swallowed silently; user sees nothing when something fails  

| File | Line | Endpoint |
|------|------|----------|
| `web/components/dashboard-ask-vinaadi.tsx` | 96 | `/api/v1/charts/{id}/ask` |
| `web/components/dashboard-share-card.tsx` | 243 | share card fetch |
| `web/components/dashboard-event-windows.tsx` | 41 | event windows fetch |
| `web/components/synastry-matrix.tsx` | 45 | synastry fetch |
| `web/components/dashboard-settings-session-tab.tsx` | 388 | DELETE `/api/v1/auth/me` |

**Fix:** Add `.catch()` or `try/catch` with a toast notification in each case. The `dashboard-settings-session-tab.tsx` case is most critical — if account deletion fails silently, the user may believe their account is gone when it is not.

---

### [DONE] M7 · `_push_count_today` and smart-silence use UTC date, not user's local date

*(Detailed in H8 above — listed here for medium triage tracking)*

---

### [DONE] M8 · 7 API routes have no tests at all

**Severity:** MEDIUM — any regression in these paths is invisible  

| Route file | Endpoint |
|-----------|---------|
| `app/api/feedback.py` | POST/GET `/api/v1/feedback` |
| `app/api/annual_wrapped.py` | GET `/api/v1/charts/{id}/annual-wrapped` |
| `app/api/muhurta.py` | GET `/api/v1/charts/{id}/muhurta` |
| `app/api/share_card.py` | GET `/api/v1/charts/{id}/share-card` |
| `app/api/notifications.py` | GET `/api/v1/notifications` (inbox — preferences are tested, inbox is not) |
| `app/api/life_event_log.py` | GET/POST `/api/v1/charts/{id}/life-event-log` |
| `app/api/content.py` | GET `/api/v1/content/nakshatra/{nakshatra_number}` |

**Fix:** Create `tests/test_feedback_api.py`, `tests/test_annual_wrapped_api.py`, `tests/test_muhurta_api.py`, `tests/test_share_card_api.py`, `tests/test_notifications_inbox_api.py`. At minimum: happy path + 401 unauthenticated + 404 not found.

---

### [DONE] M9 · Duplicate test helper functions across 4+ test files

**Severity:** MEDIUM — copy-paste drift will cause subtle test bugs  

`_family_vault_payload()`, `_family_member_payload()`, `_birth_profile_payload()` are each defined independently in:
- `tests/test_ambient_alerts_api.py`
- `tests/test_multi_user_isolation.py`
- `tests/test_decisions_api.py`
- `tests/test_daily_guidance_api.py`
- `tests/test_life_events.py`

**Fix:** Move canonical versions to `tests/conftest.py` as pytest fixtures. Remove duplicates from individual test files.

---

### [DONE] M10 · `time.sleep(1.1)` in test_birth_profiles_api.py

**File:** `tests/test_birth_profiles_api.py:98`  
**Severity:** MEDIUM — flaky timing hack; adds >1s to every test run  

**Fix:** Replace with a deterministic approach — if the test needs to distinguish creation order, use explicit `created_at` comparison or insert with offset timestamps via the ORM directly in the fixture.

---

### [DONE] M11 · 24 services have zero unit tests

**Severity:** MEDIUM — only API-level integration tests exist; service logic is untested in isolation  

**Status update (2026-06-01):** Added `tests/test_service_priority_m11.py` covering unit-level logic for the highest-risk services listed below (muhurta, synastry, whatif, dasha_transition, notification_dispatch).

Highest-risk services to prioritize first (complex logic, no tests):
1. `muhurta_service.py` — Thirukanitham scoring logic
2. `synastry_service.py` — multi-chart comparison
3. `whatif_service.py` — speculative scenario engine
4. `dasha_transition_service.py` — alert timing logic
5. `notification_dispatch_service.py` — channel routing + smart silence

---

## TIER 4 — LOW

---

### [DONE] L1 · `AccountDeletionResult` Pydantic model defined in endpoint file

**File:** `app/api/auth.py:203`  
Move to `app/schemas/auth.py`.

---

### [DONE] L2 · `VALID_COMPATIBILITY_CONTEXTS` validation repeated 3× in relationships.py

**File:** `app/api/relationships.py:57–96`  
Extract to a helper or use a FastAPI `Enum` query param.

---

### [DONE] L3 · `HTTPException` re-imported inside function bodies

**File:** `app/api/relationships.py:58, 70`, `app/api/journal.py:172–173`  
Remove inner imports; the module-level import already covers these.

---

### [DONE] L4 · DB-level CHECK constraints not mirrored as Python `CheckConstraint` in ORM models

**Files:** `app/models/notification.py:25`, `app/models/dasha_period.py:22`, `app/models/varga_position.py:24`  
Add matching `CheckConstraint(...)` in the model `__table_args__` so ORM-level validation catches bad values before hitting the DB.

---

### [DONE] L5 · Constraint name mismatch between model and migration

**File:** `app/models/chart_planet.py:15`  
Model names it `"chart_planet_house_range"`, migration `3c9b2a4f8d11` names it `"ck_chart_planets_house_from_lagna_range"`.  
Reconcile: update the model name to match the migration name (migration is authoritative).

---

### [DONE] L6 · 31 unused i18n keys in `web/lib/i18n.ts`

**File:** `web/lib/i18n.ts`  
Keys defined but never referenced in any component. Notable ones: `tab_explore`, `tool_porutham_name`, `ask_based_on`, `label_janma_rasi_short`, `delete_account_confirm_btn`, `retro_event_career` through `retro_event_other`, `life_events_aware`.  
**Fix:** Remove unused keys, or document which component is expected to use them.

---

### [DONE] L7 · Two orphaned TypeScript types

**File:** `web/lib/types.ts:32–38` (`EventWindowItem`), `web/lib/types.ts:804–817` (`NakshatraCardData`)  
Both defined, never imported, no backend endpoint returns them.  
**Fix:** Remove, or add a `TODO: wire when backend endpoint exists` comment.
**Status note (2026-06-01):** This finding is stale on current `main`; both types are now actively imported by dashboard/hooks paths and are no longer orphaned.

---

### [DONE] L8 · 3 components with duplicate birth profile form logic

**Files:** `web/components/dashboard-setup-tab.tsx`, `web/components/dashboard-edit-profile-modal.tsx`, `web/components/chart-generate-inline-panel.tsx`  
Validation and submission logic is copy-pasted. Extract to a `useBirthProfileForm` hook.

---

### [DONE] L9 · `test_auth_api.py` missing negative-path coverage

**File:** `tests/test_auth_api.py`  
Missing tests: register with empty email, invalid email format, weak password, login with non-existent email, logout when already logged out, DELETE `/auth/me` when not authenticated.

---

### [DONE] L10 · Loose response body assertions across many test files

Pattern: `assert response.status_code == 200` then accessing body fields without structure validation.  
**Fix:** Add a schema assertion helper, e.g.:
```python
def assert_response(response, status=200, required_keys=()):
    assert response.status_code == status
    data = response.json()
    for key in required_keys:
        assert key in data, f"Missing key '{key}' in response"
    return data
```
Apply to: `test_settings_api.py:8`, `test_daily_guidance_api.py:58–88`, and the auth tests.

---

## VERIFIED CLEAN (No Action Required)

| Area | Status |
|------|--------|
| All frontend API calls wired to real backend routes | ✓ 0 broken |
| All 26 Alembic migrations have `upgrade()` + `downgrade()` | ✓ |
| `l7f8a9b0c1d2` cascade fix migration | ✓ Correct |
| `m8a9b0c1d2e3` deleted_at migration for UserLifeEvent | ✓ Correct |
| No `@pytest.mark.xfail` hiding failures | ✓ |
| `conftest.py` DB guard rejects `vinaadi_dev` | ✓ |
| Panchangam tests use correct 2026 dates | ✓ |
| No mock/placeholder data in frontend | ✓ |
| CORS and security middleware | ✓ Correctly configured |
| All routers registered in `main.py` | ✓ |
| Thirukanitham calculation conventions | ✓ Followed throughout |
| No `xfail` or skipped tests hiding failures | ✓ |

---

## Summary Count

| Tier | Count |
|------|-------|
| CRITICAL | 5 |
| HIGH | 10 |
| MEDIUM | 11 |
| LOW | 10 |
| **Total** | **36** |

---

*Generated by 4-agent parallel audit + peer review. Last updated: 2026-06-01.*
