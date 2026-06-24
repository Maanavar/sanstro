# Error Handling Guide

This guide explains how to use the new centralized error handling system in Vinaadi AI.

## Overview

The error handling system provides **user-friendly error messages** instead of technical jargon. The system maps specific error conditions to helpful messages that guide users on what went wrong and how to fix it.

### Benefits
- **Consistent messaging** across all endpoints
- **User-friendly descriptions** instead of technical details
- **Helpful suggestions** for resolving errors
- **Localization-ready** structure for future i18n support

## Backend (Python/FastAPI)

### Using Error Codes

Instead of writing raw error messages:

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
    detail=error_info["user_message"]
)
```

### Available Error Codes

See `app/core/error_codes.py` for the complete list. Common codes:

| Code | HTTP Status | User Message |
|------|-------------|--------------|
| `BIRTH_PROFILE_NOT_FOUND` | 404 | "Birth profile not found. Please create one to get started." |
| `CHART_NOT_FOUND` | 404 | "Chart not found. Your birth profile may need a birth time..." |
| `ACCESS_DENIED` | 403 | "You don't have permission to access this resource." |
| `RESOURCE_LIMIT_EXCEEDED` | 409 | "You have reached the limit for this resource..." |
| `NOT_AUTHENTICATED` | 401 | "Please log in to continue." |
| `TOKEN_EXPIRED` | 401 | "Your session has expired. Please log in again." |
| `EMAIL_ALREADY_EXISTS` | 409 | "An account with this email already exists." |
| `INVALID_DATE_RANGE` | 422 | "The date range is invalid. Please check..." |
| `MISSING_DATA` | 422 | "Required data is missing. Please provide..." |

### Migration Checklist

1. **Identify the error category** (not found, access denied, validation, etc.)
2. **Find the matching ErrorCode** in `app/core/error_codes.py`
3. **Replace the error raising code**:
   ```python
   from app.core.error_codes import ErrorCode, get_error_message
   
   error_info = get_error_message(ErrorCode.YOUR_CODE)
   raise HTTPException(
       status_code=error_info["status"],
       detail=error_info["user_message"]
   )
   ```
4. **Add a new ErrorCode if needed** — extend `ErrorCode` enum and `ERROR_MESSAGES` dict

### For Validation Errors

Validation errors (422) should provide context:

```python
from app.core.error_codes import ErrorCode, get_error_message

if fromYear > toYear:
    error_info = get_error_message(
        ErrorCode.INVALID_DATE_RANGE,
        context="fromYear must be less than or equal to toYear"
    )
    raise HTTPException(
        status_code=error_info["status"],
        detail=error_info["user_message"]
    )
```

## Frontend (Web)

### Using the Error Formatter

The web app has a built-in error message formatter that converts API errors to user-friendly messages.

```typescript
// web/lib/error-messages.ts
import { formatErrorMessage, getErrorTitle, getErrorDescription } from "@/lib/error-messages";

try {
  const response = await apiFetchJson("/api/v1/birth-profiles", {
    method: "POST",
    body: payload,
  });
} catch (error) {
  const errorInfo = formatErrorMessage(error);
  console.log(errorInfo.title);        // "Profile Limit Reached"
  console.log(errorInfo.message);      // "You have reached the maximum..."
  console.log(errorInfo.suggestion);   // "Delete an existing profile..."
  
  // Or use helper functions
  const title = getErrorTitle(error);           // "Profile Limit Reached"
  const description = getErrorDescription(error); // Full message + suggestion
}
```

### Common Error Patterns Recognized

The formatter automatically recognizes these patterns in error messages:

- `"birth profile not found"` → "Birth Profile Not Found"
- `"chart not found"` → "Chart Not Found"
- `"access denied"` → "Access Denied"
- `"birth profile limit reached"` → "Profile Limit Reached"
- `"email already exists"` → "Email Already Registered"
- `"token"` (expired/invalid) → "Session Invalid"
- And more...

### Displaying Errors in UI

Example with a toast notification:

```typescript
import { toast } from "sonner"; // or your toast library
import { formatErrorMessage } from "@/lib/error-messages";

try {
  await createBirthProfile(data);
} catch (error) {
  const { title, message, suggestion } = formatErrorMessage(error);
  toast.error(title, {
    description: suggestion ? `${message}\n\n${suggestion}` : message,
  });
}
```

## Mobile (React Native/Expo)

### Using the Error Formatter

The mobile app has a similar error formatter optimized for mobile UI:

```typescript
// mobile/src/lib/error-messages.ts
import { formatErrorMessage, getErrorTitle, getErrorDescription } from "@/lib/error-messages";

try {
  const profile = await apiPost("/birth-profiles", payload);
} catch (error) {
  const { title, message } = formatErrorMessage(error);
  Alert.alert(title, message);
}
```

## Examples of Updated Code

### Example 1: Birth Profile Service

**Before:**
```python
if int(active_profile_count) >= max_profiles:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Birth profile limit reached ({max_profiles}).",
    )
```

**After:**
```python
if int(active_profile_count) >= max_profiles:
    error_info = get_error_message(ErrorCode.RESOURCE_LIMIT_EXCEEDED)
    raise HTTPException(
        status_code=error_info["status"],
        detail=error_info["user_message"],
    )
```

### Example 2: API Endpoint

**Before:**
```python
profile = session.get(BirthProfile, birth_profile_id)
if profile is None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Birth profile not found.")
if profile.owner_user_id != current_user.user_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
```

**After:**
```python
from app.core.error_codes import ErrorCode, get_error_message

profile = session.get(BirthProfile, birth_profile_id)
if profile is None:
    error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
    raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
if profile.owner_user_id != current_user.user_id:
    error_info = get_error_message(ErrorCode.ACCESS_DENIED)
    raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
```

## Adding New Error Codes

If you encounter an error type not covered by existing codes:

1. **Add the ErrorCode** in `app/core/error_codes.py`:
   ```python
   class ErrorCode(str, Enum):
       YOUR_NEW_ERROR = "YOUR_NEW_ERROR"
   ```

2. **Add the error message mapping**:
   ```python
   ErrorCode.YOUR_NEW_ERROR: {
       "status": status.HTTP_XXX,
       "user_message": "User-friendly message here...",
       "technical": "Technical detail...",
   },
   ```

3. **Update frontend pattern matchers** in:
   - `web/lib/error-messages.ts`
   - `mobile/src/lib/error-messages.ts`

## Error Code Status Distribution

| HTTP Status | Count | Common Reasons |
|------------|-------|----------------|
| 404 Not Found | 56 | Resource doesn't exist |
| 422 Validation | 37 | Invalid input data |
| 403 Forbidden | 35 | Access control violation |
| 401 Unauthorized | 13 | Authentication required |
| 409 Conflict | 4 | Duplicate/limit exceeded |
| 503 Unavailable | 3 | Service issues |

## Testing Error Messages

### Backend Testing

```python
from app.core.error_codes import ErrorCode, get_error_message

def test_error_code():
    info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
    assert info["status"] == 404
    assert "birth profile" in info["user_message"].lower()
```

### Frontend Testing

```typescript
import { formatErrorMessage } from "@/lib/error-messages";

test("formats birth profile not found error", () => {
  const error = new Error("404: /api/birth-profiles: Birth profile not found.");
  const info = formatErrorMessage(error);
  
  expect(info.title).toBe("Birth Profile Not Found");
  expect(info.statusCode).toBe(404);
  expect(info.message).toContain("birth profile");
});
```

## Best Practices

### Do ✅
- Use `get_error_message()` for all HTTP errors
- Provide helpful suggestions in error messages
- Keep error messages user-friendly and non-technical
- Add context to validation errors when possible
- Test error messages in UI before deploying

### Don't ❌
- Expose internal details (database errors, stack traces)
- Use overly technical language
- Include HTTP status codes in user messages
- Forget to update related frontend pattern matchers
- Create duplicate error codes instead of reusing existing ones

## Migration Status

Files updated to use the new error system:
- ✅ `app/services/birth_profile_service.py`
- ✅ `app/api/birth_profiles.py`
- 🔄 Other API endpoints (in progress)
- ✅ `web/lib/error-messages.ts`
- ✅ `mobile/src/lib/error-messages.ts`

## Questions?

For issues or to add new error codes, see:
- Backend errors: `app/core/error_codes.py`
- Web errors: `web/lib/error-messages.ts`
- Mobile errors: `mobile/src/lib/error-messages.ts`
