# Vinaadi AI — Peyarchi & Notification Enhancement Spec
**Version:** 1.0  
**Date:** 22 May 2026  
**Status:** Ready to implement  

---

## Context — what is already working

Before starting, read and understand the existing codebase:

- `app/calculations/ephemeris.py` — `calculate_sidereal_planets(jd_ut)` calls Swiss Ephemeris (Lahiri ayanamsa, sidereal) for any Julian Day. Already calculates all 9 grahas including Rahu (mean node) and Ketu (180° opposite).
- `app/calculations/astro.py` — `utc_datetime_to_julian_day()`, `julian_day_to_utc_datetime()`, `rasi_from_degree()`, `house_from_reference()`, `nakshatra_from_degree()`.
- `app/calculations/panchangam.py` — `_find_next_boundary_jd()` already does bisection search to find when Moon crosses a nakshatra boundary. The peyarchi finder uses the same pattern at the rasi (30°) level.
- `app/calculations/transits.py` — `classify_sani_cycle()`, `classify_kandaka_cycle()` — Sani cycle classification from Moon and Lagna.
- `app/services/life_areas_service.py` — already wires antardasha, Kandaka Sani, Chandrashtamam into 7-area scoring.
- `app/services/transit_service.py` — `build_sani_cycle_response()` returns current Saturn cycle status.

**Verified peyarchi dates from ephemeris (as of 22 May 2026):**
- Saturn (Meenam, 347.14°) → enters Mesham: **23 Feb 2028**
- Jupiter (Midhunam, 88.06°) → enters Kadagam: **01 Jun 2026** ← in 10 days
- Rahu (Kumbam, 310.46° R) → enters Magaram: **05 Dec 2026**
- Ketu is always 180° from Rahu (auto-derived)

---

## Enhancement 1 — Peyarchi Finder Service

### What to build

`app/services/peyarchi_service.py` — finds the next rasi-change date for any slow planet using bisection against the live ephemeris.

### Algorithm

The same bisection pattern as `_find_next_boundary_jd` in `panchangam.py`, but operating on rasi (30° steps) instead of nakshatra (13°20' steps):

```python
def find_next_rasi_change(planet_key: str, from_jd: float, search_days: int = 700) -> tuple[datetime, int]:
    """
    Returns (UTC datetime of rasi change, new rasi number).
    Uses bisection — same pattern as _find_next_boundary_jd in panchangam.py.
    search_days=700 covers ~2 years, enough for Jupiter (stays ~1 year per rasi).
    Saturn needs up to 1100 days (stays ~2.5 years per rasi) — use search_days=1200 for Saturn.
    Rahu/Ketu: 18-month cycle per rasi — 700 days is sufficient.
    """
    snap = calculate_sidereal_planets(from_jd)
    start_rasi = snap.bodies[planet_key].rasi
    lo = from_jd
    hi = from_jd + search_days
    while hi - lo > 1.0 / 1440:  # 1-minute precision
        mid = (lo + hi) / 2
        mid_snap = calculate_sidereal_planets(mid)
        if mid_snap.bodies[planet_key].rasi != start_rasi:
            hi = mid
        else:
            lo = mid
    result_dt = julian_day_to_utc_datetime(hi)
    result_snap = calculate_sidereal_planets(hi)
    return result_dt, result_snap.bodies[planet_key].rasi
```

### Important: handle retrograde re-entry

Rahu is always retrograde. Saturn and Jupiter go retrograde and can briefly re-enter the previous rasi before finally moving forward. The bisection above finds the **first** rasi boundary crossing — which may be a retrograde re-entry. After finding the first crossing, check if the planet re-enters the original rasi within the next 90 days. If it does, that is a temporary retrograde dip — continue searching for the final permanent crossing.

Implement `find_next_permanent_rasi_change()` that:
1. Calls `find_next_rasi_change()` once
2. Calls it again from the result date + 1 day, with a 90-day window
3. If result 2 returns the original rasi, calls again from result 2 + 1 day
4. Returns the last stable rasi

### Peyarchi response schema

```python
# app/schemas/peyarchi.py

class PeyarchiEvent(BaseModel):
    planet: str                    # "SATURN", "JUPITER", "RAHU", "KETU"
    from_rasi: str                 # current rasi name e.g. "MEENAM"
    to_rasi: str                   # entering rasi name e.g. "MESHAM"
    peyarchi_date_utc: datetime    # exact UTC datetime
    peyarchi_date_local: date      # in user's birth timezone
    days_from_today: int           # computed at response time
    impact_from_moon: int          # house Saturn/Jupiter/Rahu will occupy from natal Moon after change
    impact_from_lagna: int         # house from natal Lagna after change
    sani_cycle_after: str | None   # e.g. "ASHTAMA_SANI", None if not applicable
    label_ta: str                  # Tamil label
    label_en: str                  # English label

class PeyarchiSummaryResponse(BaseModel):
    data: list[PeyarchiEvent]
    meta: ResponseMeta
```

### API endpoint

```
GET /charts/{chart_id}/peyarchi?as_of=2026-05-22
```

Returns upcoming peyarchi events for SATURN, JUPITER, RAHU, KETU — sorted by date ascending. Include the house each planet will occupy from natal Moon and natal Lagna after the change, and the resulting Sani cycle name if Saturn.

### Tests to write

```
tests/test_peyarchi_service.py

- test_saturn_next_rasi_is_mesham_from_may_2026
  Saturn is in Meenam on 22 May 2026. Next rasi = Mesham. Date ~23 Feb 2028.

- test_jupiter_next_rasi_is_kadagam_from_may_2026
  Jupiter is in Midhunam on 22 May 2026. Next rasi = Kadagam. Date ~01 Jun 2026.

- test_rahu_next_rasi_is_magaram_from_may_2026
  Rahu is in Kumbam on 22 May 2026. Next rasi = Magaram. Date ~05 Dec 2026.

- test_ketu_is_always_180_degrees_from_rahu
  Ketu rasi = (Rahu rasi + 6 - 1) % 12 + 1. Verify with actual ephemeris snapshot.

- test_peyarchi_days_from_today_is_positive
  All returned events must have days_from_today > 0.

- test_retrograde_handling_does_not_return_past_date
  No peyarchi event date can be before the as_of date.
```

---

## Enhancement 2 — Peyarchi Alert Table and Scheduler

### Database table

```sql
-- migrations: add table peyarchi_alerts

CREATE TABLE peyarchi_alerts (
    alert_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id        UUID NOT NULL REFERENCES charts(chart_id) ON DELETE CASCADE,
    planet          TEXT NOT NULL,          -- SATURN, JUPITER, RAHU, KETU
    from_rasi       TEXT NOT NULL,
    to_rasi         TEXT NOT NULL,
    peyarchi_date   DATE NOT NULL,          -- local date in user timezone
    peyarchi_utc    TIMESTAMPTZ NOT NULL,   -- exact UTC crossover
    notified_30d    BOOLEAN DEFAULT FALSE,
    notified_7d     BOOLEAN DEFAULT FALSE,
    notified_1d     BOOLEAN DEFAULT FALSE,
    notified_day_of BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (chart_id, planet, peyarchi_date)
);

CREATE INDEX idx_peyarchi_alerts_chart ON peyarchi_alerts(chart_id);
CREATE INDEX idx_peyarchi_alerts_date ON peyarchi_alerts(peyarchi_date);
```

### SQLAlchemy model

`app/models/peyarchi_alert.py` — mirrors the table above. Add to `app/models/__init__.py`.

### Alembic migration

Create migration in `migrations/versions/` that adds this table. Run `alembic revision --autogenerate` or write manually.

### Alert refresh service

`app/services/peyarchi_alert_service.py`

```python
def refresh_peyarchi_alerts(session: Session, chart_id: UUID, as_of: date) -> None:
    """
    Called on a schedule (daily) or on first chart load.
    Finds the next peyarchi for each of SATURN, JUPITER, RAHU, KETU
    and upserts into peyarchi_alerts.
    Only writes events that do not already exist for that chart+planet+date.
    """

def get_pending_notifications(session: Session, as_of: date) -> list[PeyarchiAlert]:
    """
    Returns all alerts where:
    - peyarchi_date is within 30 days AND notified_30d = False, OR
    - peyarchi_date is within 7 days AND notified_7d = False, OR
    - peyarchi_date is within 1 day AND notified_1d = False, OR
    - peyarchi_date == today AND notified_day_of = False
    """

def mark_notified(session: Session, alert_id: UUID, tier: str) -> None:
    """tier: '30d' | '7d' | '1d' | 'day_of'"""
```

### Scheduler

Use APScheduler (already a common FastAPI pattern) or a simple `/admin/run-peyarchi-refresh` endpoint that a cron job (Windows Task Scheduler or GitHub Actions schedule) calls daily.

Add to `app/main.py` startup:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def start_scheduler():
    scheduler.add_job(daily_peyarchi_refresh, "cron", hour=2, minute=0)  # 2 AM UTC daily
    scheduler.start()
```

`daily_peyarchi_refresh()` opens a DB session, queries all active chart_ids, calls `refresh_peyarchi_alerts()` for each, then calls `get_pending_notifications()` and dispatches notifications.

---

## Enhancement 3 — Notification Delivery

### Phase 1 — In-app banner (build this first, zero infrastructure needed)

Add a `GET /charts/{chart_id}/peyarchi/upcoming` endpoint that returns events within the next 30 days. The frontend dashboard checks this on load and shows a banner:

```
"Jupiter (Guru) moves to Kadagam on 01 Jun 2026 — 10 days away.
 This changes your Guru transit to the 4th house from Moon."
```

In Tamil:
```
"குரு கடகம் ராசிக்கு 01 ஜூன் 2026 அன்று நுழைகிறார் — 10 நாட்கள் மட்டுமே.
 உங்கள் சந்திரனிலிருந்து குரு 4ஆம் இடத்திற்கு மாறுவார்."
```

Frontend component: `web/components/peyarchi-banner.tsx`
- Show if any peyarchi is within 30 days
- Dismiss button (stores dismissed state in localStorage keyed by alert_id)
- Color-coded: red border if ≤ 7 days, amber if ≤ 30 days

### Phase 2 — Email notification

Use SendGrid or SMTP (configure via env vars `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFICATION_FROM_EMAIL`).

Email template triggers:
- 30 days before: "Sani Peyarchi is approaching — prepare"
- 7 days before: "Sani Peyarchi in 7 days — here is what changes for you"
- Day of: "Today is Sani Peyarchi day for your chart"

Each email must include:
- Planet Tamil name + English name
- From rasi → To rasi (Tamil + English)
- Exact date in user's local timezone
- House change from natal Moon
- Resulting Sani cycle (if Saturn) in supportive, non-fearful language
- Remedy suggestion appropriate to the new cycle

### Phase 3 — Web push (optional, later)

Store FCM tokens in `user_devices` table. Use `firebase-admin` SDK. Not required for MVP.

---

## Enhancement 4 — Life Areas antardasha + Kandaka Sani (already done)

**Status: COMPLETED on 22 May 2026.** Do not re-implement.

Changes already in `app/services/life_areas_service.py`:
- `antar_lord = timeline.current_antardasha.lord` — extracted and passed to `_score_area`
- Dasha score = maha 70% + antardasha 30% — matches daily guidance service
- `classify_kandaka_cycle(saturn_house_from_lagna)` — now called and wired into scoring
- `KANDAKA_SANI` penalty applied separately from Moon-based Sani cycle
- `natal_lagna_rasi = chart_snapshot.data.lagna.rasi` — properly read from chart

Tests: all 5 in `tests/test_life_areas_service.py` pass. All 62 in calculations + transit tests pass.

---

## Coding rules (carry forward from AGENTS.md)

- Follow Thirukanitham / Drik Ganita. Lahiri ayanamsa. Sidereal zodiac. Mean node for Rahu.
- Whole-sign house system. House counting: `((target - reference) % 12) + 1`
- All planetary longitudes modulo 360.
- Never say "will happen." Use "traditionally associated with," "indicates tendency," "supportive/caution period."
- Sani periods framed as discipline, restructuring, care — not doom.
- Every new calculation function needs unit tests.
- All time handling: store UTC, display in user's IANA timezone.
- Run full test suite before reporting done. Confirm these regressions never return:
  - May 20, 2025 must not be Wednesday
  - Meenam = Rasi 12, not 9
  - Saturn in Meenam from Dhanusu Moon = Ardhashtama Sani, not Janma Sani
  - Uthiradam 3rd Paadham → Kumbam Navamsa, not Magaram
  - Gandanta = 3°20' zones, not 0.8°

---

## Implementation order

1. **Peyarchi finder** — `app/services/peyarchi_service.py` + schema + API endpoint + tests
2. **DB table + model + migration** — `peyarchi_alerts` table
3. **Alert refresh service** — `app/services/peyarchi_alert_service.py`
4. **In-app banner** — `web/components/peyarchi-banner.tsx` + `/charts/{chart_id}/peyarchi/upcoming` API
5. **Scheduler** — APScheduler daily job wired into FastAPI startup
6. **Email delivery** — SMTP-based, triggered from scheduler

Build and test each step before moving to the next.
