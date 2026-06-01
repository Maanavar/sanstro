# Current Location vs Birth Location Implementation Handoff


## HOW TO USE THIS DOCUMENT

Work through findings top-to-bottom by severity tier.  
Each finding block is self-contained — an agent can action it without reading any other block.  
Mark each block `[DONE]` when the fix is applied and tested.


**Repo root:** `C:\Users\senth\OneDrive\문서\GitHub\sanstro`  
**Shell:** PowerShell 5.1 — use `;` not `&&`, no `head`, no `2>&1` on native exes



## Goal

Implement a correct separation between:

- `birth location`: immutable, used for natal chart calculations
- `current location`: mutable, used for daily/time-of-day/location-sensitive calculations

This handoff is intended for the coding agent that will do the actual implementation.

---

## Problem Summary

Today the codebase largely assumes:

- the user’s `birth_latitude`
- `birth_longitude`
- `birth_timezone`

are also the correct inputs for:

- sunrise/sunset
- panchangam timings
- Rahu Kalam / Yamagandam / Kuligai
- day hora
- daily guidance
- today-style transit anchoring using local noon or local midnight

That is wrong for users who were born in one place and now live somewhere else.

Example:

- born in `Erode`
- currently living in `Tiruppur`

Expected behavior:

- natal chart still uses `Erode`
- today’s sunrise/sunset and daily timings use `Tiruppur`

---

## Key Decision

## Recommended storage model

Store `current location` on `BirthProfile`, not on `UserPreference` and not only on `User`.

### Why this is the best fit in this repo

1. `BirthProfile` is already acting as a person-level profile, not a pure immutable birth-only record.
   It already stores mutable fields like `marital_status` and `employment_type`.

2. Family members can each live in different places.
   A single account-wide current location is not enough.

3. Most daily features are already chart/profile driven.
   Keeping the daily-location fallback on the same person record keeps resolution simple.

4. `BirthProfileResponse` already flows through:
   - `/birth-profiles/*`
   - `/charts/calculate`
   - frontend chart/profile state

So extending that model minimizes wiring friction.

---

## Domain Rule Matrix

### Must remain birth-location based

- Natal chart generation
- Lagna calculation
- Planetary longitudes at birth
- Dasha seed / birth Julian Day
- Navamsa / divisional calculations
- Rectification inputs
- Jadhagam core report identity

### Must become current-location based

- Sunrise / sunset
- Solar noon
- Rahu Kalam / Yamagandam / Kuligai
- Nalla Neram / Gowri Nalla Neram
- Hora windows
- Daily panchangam
- Daily guidance time windows
- Muhurta for future actions
- Morning push timing and local date selection
- Pirantha Naal detection for “today in current city”

### Mixed calculations: natal + current

These features should continue using natal promise from birth chart, but date-local anchoring from current location:

- Daily guidance
- Life areas
- What-if
- Decision brief
- Predictions
- Gochar current for a local date
- Sani cycle for a local date
- Peyarchi summary for a local date
- PDF daily snapshot

---

## Current State Audit

## Core daily astronomy engine

No formula rewrite is required.

- [app/calculations/panchangam.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/calculations/panchangam.py)
- [app/calculations/ephemeris.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/calculations/ephemeris.py)

`calculate_daily_panchangam(date_local, latitude, longitude, timezone_name, ...)` is already correct if it receives the correct location.

The problem is upstream wiring, not the astronomical algorithm.

---

## Data models and schema surfaces currently tied to birth location

- [app/models/birth_profile.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/models/birth_profile.py)
- [app/schemas/birth_profiles.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/schemas/birth_profiles.py)
- [app/services/birth_profile_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/birth_profile_service.py)
- [app/api/birth_profiles.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/birth_profiles.py)
- [app/schemas/charts.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/schemas/charts.py)
- [app/services/chart_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/chart_service.py)
- [web/lib/types.ts](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/web/lib/types.ts)

`BirthProfileResponse` is the main serialization hub. New current-location fields should be added there.

---

## Services explicitly using birth lat/lng/timezone for daily features

### High-priority direct location bugs

- [app/services/daily_guidance_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/daily_guidance_service.py)
  - calls `calculate_daily_panchangam(...)` with birth location
  - uses `birth_profile.birth_timezone` for local noon/date anchoring

- [app/services/daily_push_cron.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/daily_push_cron.py)
  - uses birth timezone and birth coordinates for morning alert and Pirantha Naal

- [app/services/muhurta_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/muhurta_service.py)
  - scans future dates with birth lat/lng/tz

- [app/services/pdf_export_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/pdf_export_service.py)
  - “Today’s Guidance” section uses birth lat/lng/tz

- [app/services/whatif_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/whatif_service.py)
  - target-date local noon uses birth timezone
  - panchangam quality uses birth location

- [app/api/predictions.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/predictions.py)
  - `_load_chart_context(...)` uses `profile.birth_timezone` for local noon transit anchoring

- [app/services/life_areas_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/life_areas_service.py)
  - current transit day anchoring uses `birth_profile.birth_timezone`

- [app/services/transit_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/transit_service.py)
  - date-based gochar and sani-cycle use `birth_profile.birth_timezone`

- [app/services/peyarchi_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/peyarchi_service.py)
  - `as_of` local noon and local event date use `birth_timezone`

- [app/services/panchangam_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/panchangam_service.py)
  - service itself is fine because it already accepts explicit `lat/lng/timezone`
  - the frontend currently passes birth location

- [web/hooks/usePersonalData.ts](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/web/hooks/usePersonalData.ts)
  - fetches `/panchangam/daily` and `/panchangam/timings` using `chartResponse.data.birthProfile.birthLatitude/birthLongitude/birthTimezone`

### Medium-priority timezone-only surfaces

- [app/services/dasha_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/dasha_service.py)
  - uses birth timezone to map `as_of` local date to Julian Day

- [app/services/decisions_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/decisions_service.py)
  - defaults target date using birth timezone

- [app/services/notification_dispatch_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/notification_dispatch_service.py)
  - resolves user timezone from latest birth profile

- [app/services/synastry_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/synastry_service.py) *(missing from original audit)*
  - line 378: `local_noon` uses `owner_profile.birth_timezone`
  - treatment: apply resolver to owner profile for date anchoring
  - the comparison profile is a separate `BirthProfile` — apply same resolver independently to each person

### Family feature special case

- [app/services/family_vault_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/family_vault_service.py)

This area needs an explicit design choice because “family best window” becomes ambiguous if members live in different timezones/cities.

---

## Services that should stay birth-based

Do not convert these to current location:

- [app/services/chart_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/chart_service.py)
- [app/services/rectification_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/rectification_service.py)
- chart creation endpoints in [app/api/charts.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/charts.py)
- birth profile creation and recalculation flows in [app/services/birth_profile_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/birth_profile_service.py)

These are natal engines and must remain anchored to birth location.

---

## Recommended Data Model Changes

Add nullable current-location fields to `birth_profiles`.

### New columns

- `current_place` `String(255)` nullable
- `current_latitude` `Numeric(9, 6)` nullable
- `current_longitude` `Numeric(9, 6)` nullable
- `current_timezone` `String(64)` nullable
- `current_location_updated_at` `DateTime(timezone=True)` nullable

### Why nullable

Existing users should continue to work with zero backfill.

Fallback rule:

- if `current_latitude`, `current_longitude`, and `current_timezone` are all present, use current location
- otherwise use birth location

### Do not use a separate boolean in v1

No `use_current_location` flag is required initially.
Presence of a complete current-location tuple is enough.

---

## New Shared Resolver Layer

Add a dedicated helper module, for example:

- `app/services/location_service.py`

### Suggested shape

```python
from dataclasses import dataclass
from typing import Literal

@dataclass(frozen=True, slots=True)
class EffectiveDailyLocation:
    place: str
    latitude: float
    longitude: float
    timezone: str
    source: Literal["current", "birth"]

def resolve_effective_daily_location(profile) -> EffectiveDailyLocation: ...
def resolve_effective_daily_timezone(profile) -> str: ...
def local_noon_as_utc_for_profile(on_date: date, profile) -> datetime: ...
def local_midnight_as_jd_for_profile(on_date: date, profile) -> float: ...
```

### Rules inside the resolver

1. If `current_latitude`, `current_longitude`, and `current_timezone` are all present:
   - return current location
2. Else:
   - return birth location
3. Never mutate the profile
4. Never trigger chart recalculation

This resolver should be the only place where fallback logic lives.

---

## Birth Profile API and Schema Changes

## Files to change

- [app/models/birth_profile.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/models/birth_profile.py)
- [app/schemas/birth_profiles.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/schemas/birth_profiles.py)
- [app/services/birth_profile_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/birth_profile_service.py)
- [app/api/birth_profiles.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/birth_profiles.py)
- [app/services/chart_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/chart_service.py)
- [app/schemas/charts.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/schemas/charts.py)

## Required schema additions

Add to `BirthProfileCreate`, `BirthProfileUpdate`, and `BirthProfileResponse`:

- `currentPlace`
- `currentLatitude`
- `currentLongitude`
- `currentTimezone`
- `currentLocationUpdatedAt`

### Important behavioral change in update logic

`update_birth_profile(...)` currently supports `recalculate=True`.

This must be tightened so that chart recalculation happens only when birth-defining fields change:

- `birth_date_local`
- `birth_time_local`
- `birth_place`
- `birth_latitude`
- `birth_longitude`
- `birth_timezone`

Updating only:

- `current_place`
- `current_latitude`
- `current_longitude`
- `current_timezone`

must **not** recalculate or regenerate the natal chart.

This is one of the most important implementation guards.

---

## Family Member / Family Vault API Changes

## Files to change

- [app/schemas/family_vaults.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/schemas/family_vaults.py)
- [app/services/family_vault_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/family_vault_service.py)
- [app/api/family_vaults.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/family_vaults.py)

Because `FamilyMemberCreate` extends `BirthProfileCreate`, current-location fields will flow automatically if they are added to the birth-profile schemas.

Also add current-location fields to `FamilyMemberUpdate` if the family-member edit UX should support them.

## Special design warning: family aggregates

`get_family_daily_aggregate(...)` currently exposes one `timezone` field and intersects shared best windows.

That is only clean if the family members are assumed to share a household location.

### Recommended v1 rule

For family-vault aggregate features, choose one explicit strategy and document it:

1. `Recommended`
   Add a `FamilyVault`-level household location later and use that for shared family day windows.

2. `Acceptable v1 shortcut`
   Continue using each member’s effective location for their own score, but document that family aggregate assumes a shared local context and is best suited for co-located families.

Do not silently pretend mixed-timezone family windows are exact if they are not.

---

## Feature-by-Feature Wiring Plan

## 1. Panchangam endpoints

### Files

- [app/services/panchangam_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/panchangam_service.py)
- [app/api/panchangam.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/panchangam.py)
- [web/hooks/usePersonalData.ts](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/web/hooks/usePersonalData.ts)

### Change

No formula change in backend service.

Frontend must stop passing birth location by default.

Instead:

- use `birthProfile.currentLatitude/currentLongitude/currentTimezone` if complete
- otherwise fall back to `birthLatitude/birthLongitude/birthTimezone`

### Notes

This is the fastest visible correctness win.

---

## 2. Daily guidance

### Files

- [app/services/daily_guidance_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/daily_guidance_service.py)
- [app/api/daily_guidance.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/daily_guidance.py)

### Change

Every place that currently does one of these:

- `calculate_daily_panchangam(... birth_latitude/birth_longitude/birth_timezone ...)`
- local noon conversion using `birth_profile.birth_timezone`
- hora lookups using `birth_profile.birth_timezone`

should use the new shared resolver.

### What stays birth-based

- chart snapshot
- natal moon
- lagna
- dasha seed

### What becomes current-location based

- daily panchangam
- current hora
- local-day transit anchoring for `on_date`
- week-ahead and range local-day boundaries

---

## 3. Muhurta

### Files

- [app/services/muhurta_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/muhurta_service.py)
- [app/api/muhurta.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/muhurta.py)

### Change

Muhurta is about doing an event in a place.

Therefore:

- natal promise and dasha support remain birth-based
- scanned date windows and panchangam inputs should use effective current location

If future product scope requires “event city different from where I live”, add request-level override later.

---

## 4. What-if and decision brief

### Files

- [app/services/whatif_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/whatif_service.py)
- [app/api/whatif.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/whatif.py)
- [app/services/decisions_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/decisions_service.py)

### Change

For target-date analysis:

- local noon / date anchoring should use effective current timezone
- panchangam score should use effective current location

Natal promise, dasha promise, and chart factors stay birth-based.

---

## 5. Predictions and life areas

### Files

- [app/api/predictions.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/predictions.py)
- [app/services/life_areas_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/life_areas_service.py)

### Change

These services mostly need timezone correction, not lat/lng correction.

Switch local noon / local date anchoring from birth timezone to effective daily timezone.

This can affect:

- current transit snapshot used in scoring
- current dasha bucket when the selected date is near a period boundary

---

## 6. Transit and Peyarchi endpoints

### Files

- [app/services/transit_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/transit_service.py)
- [app/services/peyarchi_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/peyarchi_service.py)
- [app/api/transits.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/api/transits.py)

### Change

For endpoints receiving only a `date`:

- resolve that date using effective current timezone

For endpoints receiving an explicit `datetime`:

- no change

### Rationale

Transit positions are global at a given instant, but “today’s noon” or “today’s local midnight” depends on where the user is.

---

## 7. Dasha timeline endpoint

### Files

- [app/services/dasha_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/dasha_service.py)

### Change

Switch `_local_midnight_as_jd(as_of, ...)` from birth timezone to effective daily timezone.

### Why

Dasha periods are absolute, but the mapping from a user-selected local date to the JD used for evaluation depends on timezone.

This is mainly a boundary-day correctness issue.

---

## 8. Daily push and notifications

### Files

- [app/services/daily_push_cron.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/daily_push_cron.py)
- [app/services/notification_dispatch_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/notification_dispatch_service.py)
- [app/services/pirantha_naal_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/pirantha_naal_service.py)

### Change

Use effective current location/timezone for:

- morning alert due-window
- user local date
- morning panchangam
- Pirantha Naal “today” detection

### Pre-existing bug to fix in the same file (but as a separate commit)

`_already_sent_today(...)` in `daily_push_cron.py` currently constructs:

```python
datetime.combine(local_date, time(0, 0), tzinfo=UTC)
```

That treats a local calendar date as if it were already UTC midnight — incorrect for non-UTC users.

Fix: construct midnight in the user’s effective timezone, then convert to UTC before querying.

**Do not couple this fix to the location-wiring change.** Fix it in a separate commit with its own test so the bug and the feature are independently reviewable.

---

## 9. PDF export

### Files

- [app/services/pdf_export_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/pdf_export_service.py)

### Change

Keep the birth header exactly as it is.

Change only the “Today’s Guidance” / panchangam snapshot section to use effective current location.

This is a mixed-mode document:

- birth identity = birth place
- daily snapshot = current place

The PDF should probably label the daily section with the location used.

---

## 10. Frontend profile and settings wiring

## Files

- [web/lib/types.ts](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/web/lib/types.ts)
- [web/hooks/usePersonalData.ts](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/web/hooks/usePersonalData.ts)
- [web/components/dashboard-settings-session-tab.tsx](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/web/components/dashboard-settings-session-tab.tsx)
- [web/components/dashboard-edit-profile-modal.tsx](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/web/components/dashboard-edit-profile-modal.tsx)
- [web/components/dashboard-edit-member-modal.tsx](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/web/components/dashboard-edit-member-modal.tsx)
- [web/components/dashboard-workspace.tsx](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/web/components/dashboard-workspace.tsx)

## Recommended UX

Show two separate concepts:

- `Birth location`
- `Current city for daily timings`

### Minimum viable UI

For the primary user:

- add current-city fields in Settings

For family members:

- add current-city fields in member edit flow

### Minimum viable frontend logic

1. Extend `BirthProfileSnapshot` types with current-location fields
2. When fetching panchangam directly, use effective location
3. When updating current city, do not trigger chart recalculation

### Important UX note

Do not automatically infer city from login/IP without permission.

Best first version:

- manual city selection
- optional later browser geolocation

---

## Suggested API Strategy

## V1 recommendation

Do not add request-level location overrides to every endpoint yet.

Instead:

1. persist current location on `BirthProfile`
2. make backend chart/daily services resolve effective location from the profile
3. keep `/panchangam/*` as explicit `lat/lng/timezone` APIs

This gives a manageable first implementation.

## V2 optional enhancement

Add request-level override support for “temporary travel without saving profile changes”.

Example future shape:

- `locationMode = birth | current | custom`
- `lat/lng/timezone` if `custom`

Not required for v1.

---

## Calculation Changes Summary

## Calculations that do not change

- Swiss Ephemeris rise/set algorithm
- sidereal planet calculations
- natal chart generation math
- lagna math
- dasha seed math
- ayanamsa selection

## Calculations that do change

Only the inputs to day-local calculations change:

- `latitude`
- `longitude`
- `timezone`
- local noon / local midnight anchor derived from those

### Concretely

#### Before

```python
calculate_daily_panchangam(on_date, birth_latitude, birth_longitude, birth_timezone)
```

#### After

```python
loc = resolve_effective_daily_location(profile)
calculate_daily_panchangam(on_date, loc.latitude, loc.longitude, loc.timezone)
```

And:

#### Before

```python
local_noon = datetime.combine(on_date, time(12, 0), tzinfo=resolve_timezone(profile.birth_timezone))
```

#### After

```python
tz = resolve_effective_daily_timezone(profile)
local_noon = datetime.combine(on_date, time(12, 0), tzinfo=resolve_timezone(tz))
```

---

## Migration Plan

1. Alembic migration for new `birth_profiles` columns
2. ORM model update
3. schema update
4. serialization update in birth-profile and chart responses
5. shared resolver helper
6. update backend daily services one by one
7. update frontend types and panchangam fetch
8. add UI for current city
9. add tests

No data backfill is required if fallback logic is implemented correctly.

---

## Test Plan

## Unit tests

- resolver returns `current` when all current fields exist
- resolver falls back to `birth` when current fields are incomplete
- updating only current-location fields does not trigger chart recalculation

## Service tests

- daily panchangam differs when current city differs from birth city
- daily guidance uses current timezone for local date anchoring
- what-if uses current location for target-date panchangam quality
- transit/gochar date endpoint changes with timezone as expected
- daily push uses current timezone for “today”

## Regression tests

- natal chart output is unchanged after setting current location
- dasha seed and lagna are unchanged after setting current location
- panchangam cache key must include `(date, lat, lng, timezone)` — verify before wiring; if cache key is date-only, adding current location will silently serve stale birth-location data

## Recommended concrete scenario tests

1. birth: `Erode`, current: `Tiruppur`
   - natal chart unchanged
   - sunrise/sunset changes if location changes enough

2. birth: `India`, current: `Netherlands`
   - local date, sunrise/sunset, hora, and noon-based transit anchoring change correctly

3. family member in different current city
   - individual daily guidance should use that member’s effective location

---

## Risks and Edge Cases

## 1. Partial current-location data

If only timezone is present but lat/lng are missing:

- do not use current timezone alone for sunrise/sunset features
- fallback to birth location
- optionally emit a warning in logs

## 2. Family-vault mixed timezone semantics

Shared family best windows are not mathematically clean if members are in different timezones.

This needs either:

- a documented household-location assumption
- or a later FamilyVault-level location model

## 3. Historical retrospective features

- [app/services/retrospective_service.py](/abs/path/c:/Users/senth/OneDrive/문서/GitHub/sanstro/app/services/retrospective_service.py)

This feature analyzes a past event date.
Current location today is not necessarily the event location at that time.

**v1 explicit decision: leave this service unchanged.**

- Do NOT apply the resolver to `retrospective_service.py` in this implementation.
- The agent must not touch this file as part of this feature.
- Add a comment at the `birth_timezone` call site: `# TODO: historical event location — not current location, separate future enhancement`
- Treat historical event location as a separate future feature.

## 4. Journal / event-history style features

Any feature analyzing past dates may eventually need event-specific location, not just current location.

That is a separate concern from the current sunrise/sunset fix.

---

## Panchangam cache key verification — do this before wiring

Before switching any service to use current location, verify that the panchangam cache key already includes coordinates.

If the cache key is only `date` or `(date, profile_id)`:

- switching from birth to current location will silently return cached birth-location results
- the fix is to include `(date, lat, lng, timezone_name)` in the cache key

Check: [app/calculations/panchangam.py](app/calculations/panchangam.py) — look for `@lru_cache`, `cache_key`, or similar.

This check belongs at step 0, before any service is patched.

---

## City geocoding — reuse the existing place search component

The frontend already has a place → lat/lng geocode flow used in birth profile creation.

- Identify the place-search input in [web/components/dashboard-edit-profile-modal.tsx](web/components/dashboard-edit-profile-modal.tsx)
- Reuse that exact component (or hook) for the current-city input fields in Settings and family member edit
- Do not build a separate geocoding flow

The existing flow should already return `lat`, `lng`, and `timezone`. If it does not return `timezone`, add that to the geocode response before wiring the current-city save.

---

## Alembic migration constraints — mandatory

All new columns added to `birth_profiles` must be:

- `nullable=True`
- no `server_default` required (NULL is fine for missing current location)
- never `NOT NULL` without a default — `birth_profiles` has live rows in `vinaadi_dev`

Correct SQLAlchemy column shape:

```python
current_place: Mapped[str | None] = mapped_column(String(255), nullable=True)
current_latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
current_longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
current_timezone: Mapped[str | None] = mapped_column(String(64), nullable=True)
current_location_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

Test migration on `vinaadi_test` first (port 5433). Run upgrade → verify → downgrade → verify before applying to dev.

---

## Recommended Implementation Order

1. Verify panchangam cache key includes coordinates (see section above)
2. Add `current_*` fields to `BirthProfile` and schemas (with correct nullable migration)
3. Add `location_service.py` resolver helpers
4. Patch `usePersonalData.ts` panchangam fetch
5. Patch `daily_guidance_service.py`
6. Patch `muhurta_service.py`
7. Patch `whatif_service.py`, `decisions_service.py`, `life_areas_service.py`, `api/predictions.py`
8. Patch `transit_service.py`, `peyarchi_service.py`, `dasha_service.py`
9. Patch `synastry_service.py` (timezone-only, owner and comparison profiles independently)
10. Patch `daily_push_cron.py` and `notification_dispatch_service.py`
11. Patch `pdf_export_service.py`
12. Add current-city UI (reuse existing geocode component)
13. Handle family-vault decision explicitly
14. Leave `retrospective_service.py` unchanged; add TODO comment only

---

## Final Recommendation

Implement this as:

- per-profile current location stored on `BirthProfile`
- a shared backend resolver for effective daily location
- no changes to natal formulas
- targeted rewiring of daily services

This gives the correct astrology model:

- birth chart from birthplace
- daily timings from current place

and it fits the existing architecture better than an account-wide setting.

