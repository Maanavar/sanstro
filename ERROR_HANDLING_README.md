# Error Handling System - Complete Implementation

## 🎯 What Was Done

I've implemented a **comprehensive, centralized error handling system** that provides **user-friendly error messages** throughout your application instead of technical error codes.

### The Problem You Had
```
409: /api/v1/birth-profiles: Birth profile limit reached (10).
```

### What Users See Now
```
Title: Profile Limit Reached
Message: You have reached the maximum number of birth profiles.
Suggestion: Delete an existing profile or upgrade your plan to add more.
```

## 📦 What's Included

### Backend (Python)

**File:** `app/core/error_codes.py`
- 31 pre-defined error codes for common scenarios
- Automatic HTTP status code mapping
- User-friendly message translations
- Support for contextual messages

### Frontend (Web & Mobile)

**Files:**
- `web/lib/error-messages.ts` — Web error formatter
- `mobile/src/lib/error-messages.ts` — Mobile error formatter

Features:
- Automatic error pattern recognition
- Fallback handling for unmapped errors
- Title, message, and suggestion for each error
- Ready-to-use utility functions

### Documentation

**Files:**
- `ERROR_HANDLING_GUIDE.md` — Complete usage guide
- `ERROR_CODES_QUICK_REFERENCE.md` — Quick lookup table
- `ERROR_HANDLING_IMPLEMENTATION.md` — Implementation details
- `ERROR_HANDLING_MIGRATION_CHECKLIST.md` — Step-by-step migration plan

### Tools

**File:** `scripts/migrate-error-messages.py`
- Scans the codebase for unmapped errors
- Suggests which ErrorCode to use for each error
- Provides a migration report

## 🚀 Quick Start

### For Backend Developers

Instead of hardcoded error messages:

```python
# ❌ Before
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Birth profile not found."
)

# ✅ After
from app.core.error_codes import ErrorCode, get_error_message

error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
raise HTTPException(
    status_code=error_info["status"],
    detail=error_info["user_message"],
)
```

### For Frontend Developers

Display user-friendly error messages:

```typescript
// Web
import { formatErrorMessage } from "@/lib/error-messages";

try {
  await apiFetchJson("/api/v1/birth-profiles");
} catch (error) {
  const { title, message, suggestion } = formatErrorMessage(error);
  toast.error(title, { description: message });
}

// Mobile
import { formatErrorMessage } from "@/lib/error-messages";

try {
  const profile = await apiPost("/birth-profiles", data);
} catch (error) {
  const info = formatErrorMessage(error);
  Alert.alert(info.title, info.message);
}
```

## 📊 Error Coverage

Currently implemented error codes cover ~165 existing errors in the codebase:

| Status | Count | Examples |
|--------|-------|----------|
| 404 Not Found | 56 | Profile, chart, vault not found |
| 422 Validation | 37 | Invalid input, date range, format |
| 403 Forbidden | 35 | Access denied, permission issues |
| 401 Unauthorized | 13 | Token expired, not authenticated |
| 409 Conflict | 4 | Limit exceeded, duplicate email |
| 503 Unavailable | 3 | Service down, misconfigured |

## ✅ Files Already Updated

### Phase 1 Complete ✅
- ✅ `app/services/birth_profile_service.py` — Birth profile limit & not found errors
- ✅ `app/api/birth_profiles.py` — All 6 HTTP exceptions
- ✅ Core infrastructure (error codes, formatters, helpers)

## 🔄 Next Steps (Migration)

### Step 1: Review the System
1. Read `ERROR_CODES_QUICK_REFERENCE.md` for available error codes
2. See `ERROR_HANDLING_GUIDE.md` for detailed usage patterns

### Step 2: Run the Migration Report
```powershell
cd D:\sanstro
python scripts/migrate-error-messages.py --report
```

This will show:
- Which files have errors to update
- Which errors can be auto-mapped
- Which errors need manual review

### Step 3: Migrate High-Priority Files
Start with the highest-impact files (in order):

1. **`app/api/charts.py`** (11 errors) — Most user-facing
2. **`app/api/daily_guidance.py`** (5 errors)
3. **`app/services/daily_guidance_service.py`** (many errors)
4. **`app/api/transits.py`** (4 errors)
5. **`app/services/family_vault_service.py`** (multiple)

Each migration follows this template:

```python
# 1. Add import
from app.core.error_codes import ErrorCode, get_error_message

# 2. Find HTTPException and replace it
# Before
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chart not found.")

# After
error_info = get_error_message(ErrorCode.CHART_NOT_FOUND)
raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
```

### Step 4: Update Frontend Error Handlers
Once backend errors are updated, ensure frontend displays them:

```typescript
// In any component that shows errors
const { title, message, suggestion } = formatErrorMessage(error);
// Display in UI...
```

### Step 5: Test & Deploy
- Test each error scenario in browser/app
- Verify messages are clear and helpful
- Deploy in phases

## 📈 Benefits

✅ **User Experience**
- Clear, actionable error messages
- Helpful suggestions for resolution
- Reduced support tickets

✅ **Developer Experience**
- Reusable error system (DRY principle)
- No more copy-paste errors
- Easy to maintain and update

✅ **Consistency**
- Same message across all platforms
- Standardized error codes
- Easier to track issues

✅ **Scalability**
- Ready for localization/i18n
- Pattern-based matching handles unmapped errors
- Easy to add new error types

## 🎓 Error Code Reference

### 404 - Not Found
- `BIRTH_PROFILE_NOT_FOUND` → "Birth profile not found. Please create one..."
- `CHART_NOT_FOUND` → "Chart not found. Your birth profile may need..."
- `FAMILY_VAULT_NOT_FOUND` → "Family vault not found. It may have been deleted."
- `USER_NOT_FOUND`, `GOAL_NOT_FOUND`, `JOURNAL_ENTRY_NOT_FOUND`, etc.

### 403 - Forbidden
- `ACCESS_DENIED` → "You don't have permission to access this resource."
- `ACCOUNT_SUSPENDED` → "Your account has been suspended. Please contact support."

### 401 - Unauthorized
- `NOT_AUTHENTICATED` → "Please log in to continue."
- `TOKEN_EXPIRED` → "Your session has expired. Please log in again."
- `TOKEN_INVALID` / `TOKEN_REVOKED` → "Your session is invalid/revoked..."

### 409 - Conflict
- `RESOURCE_LIMIT_EXCEEDED` → "You have reached the limit for this resource..."
- `EMAIL_ALREADY_EXISTS` → "An account with this email already exists."

### 422 - Validation
- `INVALID_DATE_RANGE` → "The date range is invalid. Please check..."
- `MISSING_MOON_DATA` → "Moon position data is not available..."
- `INVALID_FORMAT` → "The format of your input is invalid..."
- `VALUE_OUT_OF_RANGE` → "One of the values is outside the acceptable range..."

See `ERROR_CODES_QUICK_REFERENCE.md` for the complete list.

## 📚 Documentation Index

1. **`ERROR_HANDLING_GUIDE.md`** — Complete guide with examples
2. **`ERROR_CODES_QUICK_REFERENCE.md`** — Quick lookup table
3. **`ERROR_HANDLING_IMPLEMENTATION.md`** — Technical details
4. **`ERROR_HANDLING_MIGRATION_CHECKLIST.md`** — Step-by-step migration
5. **`app/core/error_codes.py`** — Source of truth for all error codes
6. **`web/lib/error-messages.ts`** — Web error formatting
7. **`mobile/src/lib/error-messages.ts`** — Mobile error formatting

## ⚙️ Customization

### Adding a New Error Code

1. Add to `ErrorCode` enum in `app/core/error_codes.py`:
   ```python
   MY_NEW_ERROR = "MY_NEW_ERROR"
   ```

2. Add message mapping:
   ```python
   ErrorCode.MY_NEW_ERROR: {
       "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
       "user_message": "User-friendly message here...",
       "technical": "Technical detail...",
   },
   ```

3. Update pattern matchers (optional):
   - `web/lib/error-messages.ts`
   - `mobile/src/lib/error-messages.ts`

## 🧪 Testing

### Backend
```python
from app.core.error_codes import ErrorCode, get_error_message

info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
assert info["status"] == 404
assert "birth profile" in info["user_message"].lower()
```

### Frontend
```typescript
import { formatErrorMessage } from "@/lib/error-messages";

const error = new Error("404: /api/birth-profiles: Birth profile not found.");
const info = formatErrorMessage(error);
expect(info.title).toBe("Birth Profile Not Found");
```

## 🤝 Questions?

Refer to the relevant documentation file:
- **"How do I use this?"** → `ERROR_HANDLING_GUIDE.md`
- **"What error codes exist?"** → `ERROR_CODES_QUICK_REFERENCE.md`
- **"How do I migrate a file?"** → `ERROR_HANDLING_MIGRATION_CHECKLIST.md`
- **"What's implemented?"** → `ERROR_HANDLING_IMPLEMENTATION.md`

## 📋 Summary

**You now have:**
- ✅ A centralized error code system
- ✅ User-friendly error messages for 31+ error codes
- ✅ Automatic error pattern matching (frontend)
- ✅ Migration tools and documentation
- ✅ Example implementations (birth profiles)

**Next:**
1. Run the migration report: `python scripts/migrate-error-messages.py --report`
2. Migrate high-priority files (charts, guidance)
3. Update frontend to use new error formatters
4. Test and deploy

The system is production-ready and can be adopted incrementally. Start with one high-traffic endpoint and expand from there.

---

**Estimated time to complete all migrations:** 3-4 weeks (depending on team size)

**User impact:** Significant improvement in error messaging and user experience
