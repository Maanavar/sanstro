# Vinaadi AI - Issue Sweep Execution Playbook

**Version:** 1.0  
**Date:** 2026-05-31  
**Status:** Approved and ready for implementation  
**Owner:** Codex + Senthil collaborative execution

---

## Repo Root (Mandatory)

```text
C:\Users\senth\OneDrive\문서\GitHub\sanstro
```

The Korean folder name `문서` is mandatory. Never substitute `Documents` or any variation.

---

## Confirmed Product Decisions (Locked)

1. **Reminder behavior on click**
- Decision: `Save reminder` will **auto-enable morning alerts immediately**.
- UX expectation: one click -> saved state + success feedback.

2. **Non-marriage compatibility output style**
- Decision: **keep the current UI structure**.
- Change: factor names + reasoning logic become context-aware (Friendship/Business/Family/General) instead of marriage logic reuse.

---

## Delivery Mode for Next Turns

1. Implement with minimal interruptions.
2. Ask user only if there is a real blocker or a high-risk irreversible change.
3. Preserve existing uncommitted user changes.
4. No destructive commands.
5. After each phase, run targeted verification before moving forward.

---

## Scope

This playbook covers the full issue batch:

1. Marriage compatibility PDF export
2. DOB year validation (manual invalid year typing)
3. Context-correct compatibility logic (non-marriage contexts)
4. CTA visibility fixes (QA + Plan/Goals subpages)
5. Life Event Log internal server error
6. Muhurta `SPIRITUAL` 422 error
7. `Save reminder` button no action
8. Transit page duplicate date
9. Life-area/prediction relevance by age + marital/life stage
10. Plan goals appear to have no effect
11. Move auspicious time into separate Plan subtab
12. Improve reasoning quality consistency across computation outputs

---

## Execution Order

### Phase 0 - Preflight and safety
- Confirm clean understanding of changed files and avoid touching unrelated modified files.
- Verify migration path and API enum consistency before functional edits.

### Phase 1 - P0/P1 blockers first
- Issue 5 (life-event-log error)
- Issue 6 (`SPIRITUAL` enum mismatch)
- Issue 7 (reminder no action)
- Issue 4 (CTA visibility)
- Issue 8 (duplicate date)
- Issue 2 (DOB validation)

### Phase 2 - Core correctness
- Issue 3 (context-specific compatibility engine)
- Issue 10 (goal type mismatch + visible goal impact)

### Phase 3 - Structure and UX improvements
- Issue 11 (separate auspicious subtab)
- Issue 1 (compatibility PDF export)

### Phase 4 - Reasoning quality hardening
- Issue 9 + Issue 12 (life-stage relevance and stronger explanations)

### Phase 5 - Regression test pass
- Backend + frontend targeted validations for all changed areas.

---

## Detailed Implementation Instructions

## Issue 1 - Marriage compatibility PDF export
**Goal:** Downloadable compatibility report PDF from compatibility flows.

**Backend**
- Add compatibility export route in:
  - `app/api/relationships.py`
- Add PDF builder function in:
  - `app/services/pdf_export_service.py`
- Reuse report structure style from chart PDF where useful, but compatibility-specific content:
  - context
  - total score and label
  - factor breakdown
  - dosha flags
  - summary and context note

**Frontend**
- Add `Download PDF` action in:
  - `web/components/porutham-panel.tsx`
  - `web/components/dashboard-synastry-panel.tsx`

**Acceptance**
- User can download compatibility PDF from both direct compare and relationship porutham panel.
- File includes selected context and computed reasoning data.

---

## Issue 2 - DOB year manual invalid input
**Goal:** Prevent invalid years at UI and API levels.

**Backend**
- Add strict `birth_date_local` validation in:
  - `app/schemas/birth_profiles.py`
- Rules:
  - no future date
  - enforce sensible lower year bound

**Frontend**
- Apply min/max date constraints and shared validator to all date-entry forms:
  - `web/components/dashboard-setup-tab.tsx`
  - `web/components/dashboard-edit-profile-modal.tsx`
  - `web/components/dashboard-edit-member-modal.tsx`
  - `web/components/dashboard-guest-chart-modal.tsx`
  - `web/components/dashboard-compare-modal.tsx`
  - `web/components/porutham-panel.tsx`
  - `web/components/chart-generate-inline-panel.tsx`
- Strengthen form error messaging in:
  - `web/components/dashboard-workspace.tsx`

**Acceptance**
- Invalid year cannot be submitted even if typed manually.
- API rejects invalid values with clear 422 message.

---

## Issue 3 - Non-marriage compatibility currently uses marriage logic
**Goal:** Context-correct scoring and explanation.

**Backend**
- Keep marriage contexts using:
  - `app/calculations/porutham.py`
- For `FRIENDSHIP`, `BUSINESS`, `FAMILY`, `GENERAL`:
  - add separate factor model and scoring path in `app/services/synastry_service.py`
  - preserve response shape so UI does not break
  - replace marriage wording with context-appropriate factor names/reasoning

**Frontend**
- Keep existing compatibility UI layout.
- Ensure labels and explanatory text reflect context type.

**Acceptance**
- Business/friendship/family results no longer present marriage-centric factor reasoning.
- Marriage context remains unchanged in behavior.

---

## Issue 4 - CTA text/color not visible
**Goal:** Ensure CTA visibility on all affected pages.

**Fixes**
- Resolve class/token mismatch in:
  - `web/app/globals.css`
  - `web/components/dashboard-ui.tsx`
- Replace hardcoded white-rgba text styles with theme tokens in:
  - `web/components/dashboard-qa-tab.tsx`

**Acceptance**
- Primary CTA buttons readable in QA and Plan/Goals pages.
- Contrast remains readable in light-shell dashboard styling.

---

## Issue 5 - Life Event Log internal server error
**Goal:** Remove 500 errors and restore event loading.

**Likely root cause**
- ORM includes `deleted_at` from `TimestampMixin`, but DB schema may be missing column in some environments.

**Fixes**
- Ensure migration path includes:
  - `migrations/versions/m8a9b0c1d2e3_add_deleted_at_to_user_life_events.py`
- Harden query in:
  - `app/services/life_event_log_service.py`
  - filter `deleted_at IS NULL`

**Acceptance**
- `GET /api/v1/charts/{chart_id}/life-event-log` returns success consistently.
- UI no longer shows internal server error for valid charts.

---

## Issue 6 - Muhurta `SPIRITUAL` returns 422
**Goal:** Align allowed values end-to-end.

**Backend**
- Add `SPIRITUAL` support in:
  - `app/services/muhurta_service.py`
- Update schema/API descriptions in:
  - `app/schemas/muhurta.py`
  - `app/api/muhurta.py`

**Frontend**
- Keep existing `SPIRITUAL` option in:
  - `web/components/dashboard-muhurta-picker.tsx`

**Acceptance**
- `SPIRITUAL` activity executes successfully and returns slots.

---

## Issue 7 - Save reminder has no action
**Goal:** Make button perform a real save action.

**Frontend**
- Wire button click handler in:
  - `web/components/dashboard-personal-tab.tsx`

**API integration**
- Call:
  - `PATCH /api/v1/settings/notifications`
- Behavior on click:
  - enable morning alerts
  - set valid default time if needed
  - show success/failure toast

**Acceptance**
- One click updates persisted reminder preferences.
- User sees immediate confirmation and state remains after refresh.

---

## Issue 8 - Transit page duplicate date display
**Goal:** Remove redundant date in transits tab header.

**Frontend**
- Remove local header date badge in:
  - `web/components/dashboard-transits-tab.tsx`

**Acceptance**
- Only top/global date remains visible.

---

## Issue 9 - Life-area and prediction relevance by age/life stage
**Goal:** Ensure predictions and narratives are relevant for children, students, married profiles, seniors, etc.

**Backend**
- Consolidate life-stage relevance policy and apply to:
  - `app/services/life_areas_service.py`
  - `app/services/life_event_service.py`
  - prediction endpoints/services used by:
    - `app/api/predictions.py`
    - `app/services/marriage_service.py`
    - `app/services/career_service.py`
    - `app/services/wealth_service.py`
    - `app/services/health_service.py`

**Frontend**
- Avoid presenting irrelevant panels/cards as first-class guidance when gated.
- Apply UI handling in:
  - `web/hooks/usePersonalData.ts`
  - `web/components/dashboard-prediction-panel.tsx`
  - `web/components/dashboard-life-areas-tab.tsx`

**Acceptance**
- Underage/newborn profiles do not get actionable marriage/career narratives as primary guidance.
- Married profiles receive relationship harmony framing instead of unmarried timing framing.

---

## Issue 10 - Plan goals feel ineffective
**Goal:** Make goals reliable and visibly impactful.

**Fix A: vocabulary mismatch**
- Replace frontend `financial` with backend-valid `money` where needed:
  - `web/components/dashboard-plan-tab.tsx`
- Confirm backend compatibility remains:
  - `app/models/user_goal.py`
  - `app/schemas/goals.py`
  - `app/schemas/whatif.py`

**Fix B: visible impact**
- After goal add/remove, refresh dependent plan/personal output and show clear impact cues.
- Surface where goal context is applied (guidance/action suggestions).

**Acceptance**
- Goal creation works without enum mismatch errors.
- Users can observe meaningful reaction in plan/guidance flow.

---

## Issue 11 - Auspicious time as separate Plan subtab
**Goal:** Improve navigation clarity.

**Frontend**
- Split current Plan subtab arrangement in:
  - `web/components/dashboard-plan-tab.tsx`
- Keep:
  - `Timing` for monthly activity timing
  - `Auspicious Time` for muhurta slot search (`DashboardMuhurtaPicker`)

**Acceptance**
- Muhurta is in its own subtab and easy to discover.

---

## Issue 12 - Computation/reasoning quality standardization
**Goal:** Improve consistency, clarity, and correctness in generated reasoning.

**Quality rule**
- Every major reasoning output should explicitly include:
  1. core signal basis
  2. confidence basis
  3. scope/applicability caveat where relevant

**Apply to**
- compatibility context notes
- life-area narratives
- prediction summaries
- event window headlines/reasons

**Acceptance**
- Reasoning is less generic, more grounded, and context-appropriate across modules.

---

## Regression and Verification Checklist

## Backend tests to run/update
- `tests/test_relationships_api.py`
- `tests/test_birth_profiles_api.py`
- `tests/test_life_events.py`
- `tests/test_life_areas_service.py`
- `tests/test_predictions_api.py`
- `tests/test_notification_preferences.py`
- `tests/test_pdf_export.py`
- `tests/test_panchangam_api.py`

## Frontend verification targets
- `dashboard-plan-tab` (goals, what-if, timing, auspicious tab split)
- `dashboard-muhurta-picker` (`SPIRITUAL`)
- `dashboard-personal-tab` (`Save reminder`)
- `dashboard-qa-tab` CTA visibility
- `dashboard-transits-tab` duplicate date removed
- `dashboard-synastry-panel` + `porutham-panel` context reasoning and PDF button

## Migration verification
- Ensure life-event-log table has `deleted_at` in all active environments before sign-off.

---

## Done Criteria (Global)

1. All 12 issues are functionally resolved.
2. No regression in existing happy-path flows.
3. Relevant tests pass.
4. UI text/visibility checked in both Tamil and English modes.
5. Compatibility contexts produce context-appropriate reasoning.
6. Plan + reminder actions show user-visible outcomes.

---

## Implementation Log Template (Use During Execution)

Use this section for incremental updates while coding:

- `[ ] Issue #`
- `Files changed:`
- `Backend/API impact:`
- `Frontend impact:`
- `Validation run:`
- `Result:`
- `Notes/risks:`

