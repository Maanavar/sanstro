# Error Handling Migration Checklist

This checklist tracks the migration of all error messages to use the centralized error handling system.

## Phase 1: Core System Setup ✅ COMPLETE

- ✅ Create `app/core/error_codes.py` with ErrorCode enum
- ✅ Create error message mappings for all error codes
- ✅ Create `web/lib/error-messages.ts` for web frontend
- ✅ Create `mobile/src/lib/error-messages.ts` for mobile frontend
- ✅ Update `web/lib/api.ts` with error handling helpers
- ✅ Update `mobile/src/api/client.ts` with error utilities
- ✅ Create migration script `scripts/migrate-error-messages.py`
- ✅ Create documentation (`ERROR_HANDLING_GUIDE.md`)
- ✅ Create quick reference (`ERROR_CODES_QUICK_REFERENCE.md`)

## Phase 2: Birth Profiles ✅ COMPLETE

- ✅ `app/services/birth_profile_service.py`
  - ✅ Update RESOURCE_LIMIT_EXCEEDED error
  - ✅ Update BIRTH_PROFILE_NOT_FOUND errors
- ✅ `app/api/birth_profiles.py`
  - ✅ Update get endpoint errors (2)
  - ✅ Update patch endpoint errors (2)
  - ✅ Update delete endpoint errors (2)

## Phase 3: Chart APIs (HIGH PRIORITY)

### `app/api/charts.py` (11 errors)

- [ ] Line 50: `CHART_NOT_FOUND`
- [ ] Line 53: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 55: `ACCESS_DENIED`
- [ ] Line 78: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 80: `ACCESS_DENIED`
- [ ] Line 156: `INVALID_DATE_RANGE` (fromYear <= toYear)
- [ ] Line 158: `INVALID_DATE_RANGE` (range <= 20 years)
- [ ] Line 167: `MISSING_MOON_DATA` (missing Moon position)
- [ ] Line 234: `CHART_NOT_FOUND`
- [ ] Line 264: `CHART_NOT_FOUND`
- [ ] Line 276: `MISSING_SUN_DATA` (missing Sun position)

### `app/api/daily_guidance.py` (5 errors)

- [ ] Line 39: `CHART_NOT_FOUND`
- [ ] Line 42: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 44: `ACCESS_DENIED`
- [ ] Line 50: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 52: `ACCESS_DENIED`

### `app/api/transits.py` (4 errors)

- [ ] Line 24: `CHART_NOT_FOUND`
- [ ] Line 27: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 29: `ACCESS_DENIED`
- [ ] Line 42: `MISSING_REQUIRED_FIELD` (datetime or date required)

### `app/services/daily_guidance_service.py` (Multiple errors)

- [ ] Line 184: `MISSING_REQUIRED_FIELD` (Birth time required)
- [ ] Line 1428: `INVALID_DATE_RANGE` (End date >= start date)
- [ ] Line 1437: `CHART_NOT_FOUND`
- [ ] Line 1633: `CHART_NOT_FOUND`
- [ ] Line 1650: `CHART_NOT_FOUND`
- [ ] Line 1656: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 1786: `CHART_NOT_FOUND`
- [ ] Line 1792: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 1797: `MISSING_MOON_DATA`
- [ ] Line 1800: `MISSING_REQUIRED_FIELD`
- [ ] Line 1920: `VALIDATION_ERROR` (unsupported activity)
- [ ] Line 2005: `VALIDATION_ERROR` (only Jupiter, Saturn, Rahu, Ketu)
- [ ] Line 2009: `CHART_NOT_FOUND`
- [ ] Line 2015: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 2100: `CHART_NOT_FOUND`
- [ ] Line 2106: `BIRTH_PROFILE_NOT_FOUND`

### `app/services/chart_service.py` (Multiple errors)

- [ ] Update all `CHART_NOT_FOUND` errors
- [ ] Update all `BIRTH_PROFILE_NOT_FOUND` errors
- [ ] Update validation errors

## Phase 4: Authorization & Access (MEDIUM PRIORITY)

### `app/api/family_vaults.py` (2 errors)

- [ ] Line 51: `FAMILY_VAULT_NOT_FOUND`
- [ ] Line 53: `ACCESS_DENIED`

### `app/api/auth.py` (3 errors)

- [ ] Line 36: `ACCOUNT_SUSPENDED`
- [ ] Line 44: `NOT_AUTHENTICATED`
- [ ] Line 105: `EMAIL_ALREADY_EXISTS`

### `app/api/mobile_auth.py` (5 errors)

- [ ] Line 148: `ACCOUNT_SUSPENDED`
- [ ] Line 158: `EMAIL_ALREADY_EXISTS`
- [ ] Line 180: `TOKEN_REVOKED`
- [ ] Line 183: `TOKEN_INVALID`
- [ ] Line 187: Need new error code for "Could not resolve user"

### `app/api/ask_vinaadi.py` (1 error)

- [ ] Line 208: `ACCESS_DENIED`

## Phase 5: Family & Relationships (MEDIUM PRIORITY)

### `app/services/family_vault_service.py` (Multiple errors)

- [ ] Line 88: `FAMILY_VAULT_NOT_FOUND`
- [ ] Line 137: Need new error code for "Unable to load chart"
- [ ] Line 689: `VALIDATION_ERROR` (Family vault mismatch)
- [ ] Line 693: `VALIDATION_ERROR` (Owner mismatch)
- [ ] Line 771: `VALIDATION_ERROR` (no members)
- [ ] Line 865: `INVALID_DATE_RANGE`
- [ ] Line 925: `INVALID_DATE_RANGE`
- [ ] Line 927: `INVALID_DATE_RANGE`
- [ ] Line 987: `FAMILY_MEMBER_NOT_FOUND`

### `app/services/synastry_service.py` (Multiple errors)

- [ ] Line 75: `FAMILY_VAULT_NOT_FOUND`
- [ ] Line 77: `ACCESS_DENIED`
- [ ] Line 90: `FAMILY_MEMBER_NOT_FOUND`
- [ ] Line 104: `VALIDATION_ERROR` (no birth profile)
- [ ] Line 120: `VALIDATION_ERROR` (no completed chart)
- [ ] Line 138: `CHART_NOT_FOUND`
- [ ] Line 141: `ACCESS_DENIED`
- [ ] Line 169: `VALIDATION_ERROR` (no owner birth profile)
- [ ] Line 631: `CHART_NOT_FOUND`
- [ ] Line 634: `ACCESS_DENIED`

## Phase 6: Content & Utilities (LOWER PRIORITY)

### `app/api/remedies.py` (4 errors)

- [ ] Line 27: `CHART_NOT_FOUND`
- [ ] Line 30: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 32: `ACCESS_DENIED`
- [ ] Line 85: `MISSING_MOON_DATA`

### `app/api/predictions.py` (3 errors)

- [ ] Line 110: `CHART_NOT_FOUND`
- [ ] Line 113: `BIRTH_PROFILE_NOT_FOUND`
- [ ] Line 115: `ACCESS_DENIED`

### `app/api/journal.py` (2+ errors)

- [ ] Line 49: `CHART_NOT_FOUND`
- [ ] Line 52: `ACCESS_DENIED`
- [ ] Update validation errors for life areas and scores

### `app/api/content.py` (1 error)

- [ ] Line 22: `VALUE_OUT_OF_RANGE` (nakshatra 1-27)

### `app/api/feedback.py` (1 error)

- [ ] Line 150: `FEEDBACK_NOT_FOUND`

### `app/api/public_tools.py` (Multiple errors)

- [ ] Line 151: `MISSING_MOON_DATA`
- [ ] Line 232: `MISSING_MOON_DATA`
- [ ] Line 514: `INVALID_DATE_RANGE`
- [ ] Line 516: `INVALID_DATE_RANGE`

## Phase 7: Admin & Specialized Features (LOWER PRIORITY)

### `app/api/admin.py` (Multiple errors)

- [ ] Line 160: Define new error code
- [ ] Line 357: `USER_NOT_FOUND`
- [ ] Line 415: `USER_NOT_FOUND`
- [ ] Line 506: `INVALID_FORMAT` (UUID)
- [ ] Line 572: Error handling review
- [ ] Line 580: `VALIDATION_ERROR` (Unknown flag)

### `app/api/webhooks.py` (3 errors)

- [ ] Line 41: `SERVICE_UNAVAILABLE` (webhook not configured)
- [ ] Line 44: `VALIDATION_ERROR` (invalid secret)
- [ ] Line 56: `INVALID_INPUT` (invalid JSON)

### `app/services/notification_preferences.py` (1 error)

- [ ] Line 80: `INVALID_FORMAT` (HH:MM format)

## Phase 8: Service Layer Errors

### `app/services/chart_explanation_service.py`
- [ ] Update all chart/profile not found errors

### `app/services/life_areas_service.py`
- [ ] Update all errors with centralized codes

### `app/services/journal_service.py`
- [ ] Update all errors with centralized codes

### `app/services/goals_service.py`
- [ ] Update all errors with centralized codes

### Other service files
- [ ] `life_event_service.py`
- [ ] `life_event_log_service.py`
- [ ] `rectification_service.py`
- [ ] `decisions_service.py`
- [ ] `ask_vinaadi_service.py`
- [ ] `annual_wrapped_service.py`
- [ ] And others...

## Phase 9: Frontend Integration

### Web App (`web/`)

- [ ] Update all components to use `formatErrorMessage()`
- [ ] Add error boundary component
- [ ] Create reusable error display component
- [ ] Test all error scenarios in UI
- [ ] Verify suggestions are displayed

### Mobile App (`mobile/`)

- [ ] Update all screens to use `formatErrorMessage()`
- [ ] Add error alert/toast component
- [ ] Test all error scenarios
- [ ] Verify user experience

## Phase 10: Testing & QA

- [ ] Unit tests for all ErrorCode mappings
- [ ] Integration tests for error flows
- [ ] Manual testing of each error type
- [ ] Cross-browser testing (web)
- [ ] Multi-device testing (mobile)
- [ ] Accessibility testing (a11y)

## Phase 11: Monitoring & Metrics

- [ ] Log error codes to analytics
- [ ] Monitor error frequency
- [ ] Track user impact
- [ ] Gather feedback on error messages

## Estimated Timeline

- **Phase 1-2:** Weeks 1 (DONE)
- **Phase 3:** Week 2 (Chart APIs - high traffic)
- **Phase 4-5:** Week 3 (Authorization & relationships)
- **Phase 6-7:** Week 4 (Content & utilities)
- **Phase 8:** Week 5 (Service layer)
- **Phase 9:** Week 5-6 (Frontend integration)
- **Phase 10-11:** Week 6-7 (Testing & deployment)

## Migration Notes

### For Each File Update:

1. **Add imports:**
   ```python
   from app.core.error_codes import ErrorCode, get_error_message
   ```

2. **Replace error raising:**
   ```python
   # Before
   raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
   
   # After
   error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
   raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
   ```

3. **Test locally:**
   ```bash
   python -m pytest tests/  # Run relevant tests
   ```

4. **Verify in browser/app** before committing

## Progress Tracking

| Phase | File Count | Status | Date Started | Date Completed |
|-------|-----------|--------|--------------|-----------------|
| 1 | Core | ✅ Done | 2026-06-23 | 2026-06-23 |
| 2 | 2 files | ✅ Done | 2026-06-23 | 2026-06-23 |
| 3 | 4 files | 🔄 In Progress | 2026-06-23 | - |
| 4 | 4 files | ⏳ Pending | - | - |
| 5 | 3 files | ⏳ Pending | - | - |
| 6 | 7 files | ⏳ Pending | - | - |
| 7 | 2 files | ⏳ Pending | - | - |
| 8 | 10+ files | ⏳ Pending | - | - |
| 9 | 2 apps | ⏳ Pending | - | - |
| 10-11 | All | ⏳ Pending | - | - |

---

**Start with Phase 3 (Chart APIs)** as they have the highest user impact and most traffic.

**Use the migration script** to generate the exact changes needed:
```powershell
python scripts/migrate-error-messages.py --report > migration_report.txt
```
