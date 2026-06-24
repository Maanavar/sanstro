# Error Handling Implementation Summary

## What Has Been Done

This document summarizes the implementation of the centralized error handling system for Vinaadi AI.

### Date Completed
June 23, 2026

### Files Created

#### 1. Backend Error Codes Module
- **`app/core/error_codes.py`** — Centralized error code definitions and user-friendly messages
  - 25+ `ErrorCode` enum values covering common error scenarios
  - User-friendly message mappings for each error code
  - `get_error_message()` helper function for easy access

#### 2. Frontend Error Message Handlers
- **`web/lib/error-messages.ts`** — Web app error message formatter
  - Pattern matching for ~25+ common error messages
  - User-friendly title, message, and suggestion for each error
  - `formatErrorMessage()`, `getErrorTitle()`, `getErrorDescription()` functions

- **`mobile/src/lib/error-messages.ts`** — Mobile app error message formatter
  - Similar functionality to web version
  - Optimized for mobile UI
  - All functions properly exported for use in React Native/Expo

#### 3. Documentation & Tools
- **`ERROR_HANDLING_GUIDE.md`** — Complete usage guide
  - How to use the error system in backend, web, and mobile
  - Examples of before/after code
  - Best practices and patterns
  - Error code status distribution

- **`scripts/migrate-error-messages.py`** — Migration helper script
  - Scans all Python API/service files for HTTPException raises
  - Maps error messages to appropriate ErrorCode values
  - Provides a report of what needs to be updated
  - Usage: `python scripts/migrate-error-messages.py --report`

### Files Updated

#### Backend Changes
1. **`app/services/birth_profile_service.py`**
   - Added import of `ErrorCode` and `get_error_message`
   - Updated error for "Birth profile limit reached" → `RESOURCE_LIMIT_EXCEEDED`
   - Updated "Birth profile not found" errors → `BIRTH_PROFILE_NOT_FOUND`

2. **`app/api/birth_profiles.py`**
   - Added import of `ErrorCode` and `get_error_message`
   - Updated all 6 HTTPException raises in 4 endpoints
   - Now returns user-friendly messages instead of raw error text

#### Frontend Changes
1. **`web/lib/api.ts`**
   - Added `readUserFriendlyError()` function for enhanced error handling
   - Maintains backward compatibility with `readErrorMessage()`

2. **`mobile/src/api/client.ts`**
   - Enhanced `ApiError` class with `getUserMessage()` and `isConflict()` methods
   - Better support for extracting JSON detail messages

### Error Code Coverage

| Status Code | Error Count | Error Codes | Example |
|------------|-------------|-------------|---------|
| 404 | ~56 | RESOURCE_NOT_FOUND, BIRTH_PROFILE_NOT_FOUND, CHART_NOT_FOUND, etc. | "Birth profile not found. Please create one..." |
| 422 | ~37 | INVALID_INPUT, INVALID_DATE_RANGE, MISSING_DATA, etc. | "The date range is invalid. Please check..." |
| 403 | ~35 | ACCESS_DENIED, PERMISSION_DENIED | "You don't have permission to access..." |
| 401 | ~13 | NOT_AUTHENTICATED, TOKEN_EXPIRED, TOKEN_INVALID | "Please log in to continue." |
| 409 | ~4 | RESOURCE_LIMIT_EXCEEDED, DUPLICATE_RESOURCE, EMAIL_ALREADY_EXISTS | "You have reached the limit for..." |
| 503 | ~3 | SERVICE_UNAVAILABLE, CONFIGURATION_ERROR | "Service is temporarily unavailable..." |

## Error Message Examples

### Before → After

**Before:**
```
409: /api/v1/birth-profiles: Birth profile limit reached (10).
```

**After (User sees):**
```
Title: Profile Limit Reached
Message: You have reached the maximum number of birth profiles.
Suggestion: Delete an existing profile or upgrade your plan to add more.
```

**Before:**
```
404: /api/v1/birth-profiles/{id}: Birth profile not found.
```

**After (User sees):**
```
Title: Birth Profile Not Found
Message: Birth profile not found. Please create one to get started.
```

**Before:**
```
403: /api/v1/birth-profiles/{id}: Access denied.
```

**After (User sees):**
```
Title: Access Denied
Message: You don't have permission to access this resource.
Suggestion: Contact the resource owner if you believe this is an error.
```

## How to Use

### For Backend Developers

When raising an HTTPException:

```python
from app.core.error_codes import ErrorCode, get_error_message

# Instead of hardcoded messages
error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
raise HTTPException(
    status_code=error_info["status"],
    detail=error_info["user_message"],
)
```

### For Web Developers

When catching API errors:

```typescript
import { formatErrorMessage } from "@/lib/error-messages";

try {
  await apiFetchJson("/api/v1/birth-profiles");
} catch (error) {
  const { title, message, suggestion } = formatErrorMessage(error);
  toast.error(title, { description: message });
}
```

### For Mobile Developers

When catching API errors:

```typescript
import { formatErrorMessage, getErrorDescription } from "@/lib/error-messages";

try {
  await apiPost("/birth-profiles", payload);
} catch (error) {
  const description = getErrorDescription(error);
  Alert.alert("Error", description);
}
```

## What Still Needs to Be Done

### Phase 1: Migrating Existing Errors (Recommended Next Steps)

The migration script has identified ~165 HTTPException raises across the codebase. About 60% can be automatically mapped to existing ErrorCodes. The remaining 40% need:

1. **Manual review** of unmapped errors (see `--report` output)
2. **Additional ErrorCode definitions** for domain-specific errors
3. **Updates to API endpoints** to use the new error system

#### Run the migration report:
```powershell
python scripts/migrate-error-messages.py --report
```

#### Files that need updates (by priority):

**High Priority** (core features):
- `app/api/charts.py` (11 exceptions)
- `app/api/daily_guidance.py` (5 exceptions)
- `app/services/daily_guidance_service.py` (many exceptions)
- `app/services/chart_service.py` (many exceptions)

**Medium Priority** (important features):
- `app/services/birth_profile_service.py` ✅ DONE
- `app/services/family_vault_service.py`
- `app/api/family_vaults.py`
- `app/api/auth.py`

**Lower Priority** (admin/utility):
- `app/api/admin.py`
- `app/api/webhooks.py`
- `app/api/content.py`

### Phase 2: Frontend Integration

- [ ] Update all components to use `formatErrorMessage()` when displaying API errors
- [ ] Create reusable error display components
- [ ] Add error toast/notification components with suggestions
- [ ] Test error messages in all user journeys

### Phase 3: Localization

- [ ] Add support for i18n in error messages
- [ ] Create language-specific message dictionaries
- [ ] Test with Tamil and English messages

### Phase 4: Monitoring & Analytics

- [ ] Log error codes to analytics
- [ ] Track which errors are most common
- [ ] Monitor error message effectiveness

## Testing

### Manual Testing

1. **Test each error type** in the browser/app
2. **Verify messages are clear** and actionable
3. **Check suggestions are helpful** for users

### Automated Testing

```python
# Backend test example
from app.core.error_codes import ErrorCode, get_error_message

def test_error_messages():
    info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
    assert info["status"] == 404
    assert "birth profile" in info["user_message"].lower()
```

```typescript
// Frontend test example
import { formatErrorMessage } from "@/lib/error-messages";

test("formats 404 errors properly", () => {
  const error = new Error("404: /api/birth-profiles: Birth profile not found.");
  const { title, statusCode } = formatErrorMessage(error);
  
  expect(title).toBe("Birth Profile Not Found");
  expect(statusCode).toBe(404);
});
```

## Rollout Plan

1. **Week 1:** Migrate high-priority files (charts, guidance)
2. **Week 2:** Migrate medium-priority files (vault, auth)
3. **Week 3:** Test end-to-end in staging
4. **Week 4:** Deploy to production with monitoring

## Error Handling Best Practices

✅ **Do:**
- Use ErrorCode for all user-facing errors
- Provide helpful suggestions
- Keep messages non-technical
- Add context to validation errors

❌ **Don't:**
- Expose internal details or stack traces
- Use overly technical language
- Hardcode error messages
- Duplicate error codes

## Questions or Issues?

Refer to:
1. `ERROR_HANDLING_GUIDE.md` — Usage guide with examples
2. `app/core/error_codes.py` — All available error codes
3. `scripts/migrate-error-messages.py` — Identify unmapped errors
4. `web/lib/error-messages.ts` — Web-specific patterns
5. `mobile/src/lib/error-messages.ts` — Mobile-specific patterns

---

**Implementation Status:** ✅ Core system complete, 🔄 Migration in progress
