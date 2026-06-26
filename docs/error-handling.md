# Error Handling System

Centralized user-friendly error messages replacing raw HTTP exceptions across the Vinaadi AI backend and frontends.

## Architecture

```
User Error → API Endpoint → get_error_message(ErrorCode) → HTTPException
                                                                 ↓
Frontend receives HTTP status + detail string
                        ↓
formatErrorMessage() pattern-matches the string
                        ↓
Returns { title, message, suggestion }
                        ↓
Component displays to user
```

**Source files:**
- `app/core/error_codes.py` — error definitions & messages (source of truth)
- `web/lib/error-messages.ts` — web formatter
- `mobile/src/lib/error-messages.ts` — mobile formatter
- `scripts/migrate-error-messages.py` — migration scan helper

## Error Code Reference

### 404 Not Found

| ErrorCode | User Message | When to Use |
|-----------|--------------|-------------|
| `BIRTH_PROFILE_NOT_FOUND` | Birth profile not found. Please create one to get started. | Profile doesn't exist |
| `CHART_NOT_FOUND` | Chart not found. Your birth profile may need a birth time to calculate it. | Chart doesn't exist |
| `FAMILY_VAULT_NOT_FOUND` | Family vault not found. It may have been deleted. | Vault doesn't exist |
| `FAMILY_MEMBER_NOT_FOUND` | Family member not found in the vault. | Member doesn't exist |
| `USER_NOT_FOUND` | User not found. Please check the user ID and try again. | User doesn't exist |
| `JOURNAL_ENTRY_NOT_FOUND` | Journal entry not found. It may have been deleted. | Entry doesn't exist |
| `GOAL_NOT_FOUND` | Goal not found. It may have been deleted. | Goal doesn't exist |
| `FEEDBACK_NOT_FOUND` | Feedback not found. | Feedback doesn't exist |
| `RESOURCE_NOT_FOUND` | The requested resource was not found. Please check and try again. | Generic 404 |

### 403 Forbidden

| ErrorCode | User Message | When to Use |
|-----------|--------------|-------------|
| `ACCESS_DENIED` | You don't have permission to access this resource. | User isn't the owner |
| `PERMISSION_DENIED` | You don't have permission to perform this action. | Action not allowed |
| `ACCOUNT_SUSPENDED` | Your account has been suspended. Please contact support. | Account blocked |

### 401 Unauthorized

| ErrorCode | User Message | When to Use |
|-----------|--------------|-------------|
| `NOT_AUTHENTICATED` | Please log in to continue. | No auth token |
| `TOKEN_EXPIRED` | Your session has expired. Please log in again. | Token expired |
| `TOKEN_INVALID` | Your session is invalid. Please log in again. | Token invalid |
| `TOKEN_REVOKED` | Your session has been revoked. Please log in again. | Token revoked |

### 409 Conflict

| ErrorCode | User Message | When to Use |
|-----------|--------------|-------------|
| `RESOURCE_LIMIT_EXCEEDED` | You have reached the limit for this resource. Please upgrade your plan or remove some items. | Hit max count |
| `DUPLICATE_RESOURCE` | This resource already exists. | Creating duplicate |
| `EMAIL_ALREADY_EXISTS` | An account with this email already exists. | Duplicate email signup |

### 422 Validation

| ErrorCode | User Message | When to Use |
|-----------|--------------|-------------|
| `INVALID_INPUT` | The provided input is invalid. Please check and try again. | Generic validation |
| `VALIDATION_ERROR` | Please check your input and try again. | Validation failed |
| `MISSING_REQUIRED_FIELD` | Some required information is missing. Please fill in all fields. | Missing required field |
| `INVALID_DATE_RANGE` | The date range is invalid. Please check the start and end dates. | Invalid date range |
| `MISSING_DATA` | Required data is missing. Please provide all necessary information. | Missing crucial data |
| `INVALID_FORMAT` | The format of your input is invalid. Please check and try again. | Wrong format (e.g., HH:MM) |
| `VALUE_OUT_OF_RANGE` | One of the values you entered is outside the acceptable range. | Value bounds violated |
| `MISSING_MOON_DATA` | Moon position data is not available. Your profile may need a more accurate birth time. | No moon data |
| `MISSING_SUN_DATA` | Sun position data is not available. Your profile may need a more accurate birth time. | No sun data |

### 503 Service Unavailable

| ErrorCode | User Message | When to Use |
|-----------|--------------|-------------|
| `SERVICE_UNAVAILABLE` | The service is temporarily unavailable. Please try again in a few moments. | Service down |
| `CONFIGURATION_ERROR` | A system configuration error has occurred. Please contact support. | System misconfigured |

## Usage

### Backend

```python
from app.core.error_codes import ErrorCode, get_error_message

# Basic
error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])

# With context (validation errors)
error_info = get_error_message(
    ErrorCode.INVALID_DATE_RANGE,
    context="Start date must be before end date"
)
raise HTTPException(status_code=error_info["status"], detail=error_info["user_message"])
```

### Frontend — Web

```typescript
import { formatErrorMessage } from "@/lib/error-messages";

try {
  await apiFetchJson("/api/v1/birth-profiles");
} catch (error) {
  const { title, message, suggestion } = formatErrorMessage(error);
  toast.error(title, { description: suggestion ? `${message}\n\n${suggestion}` : message });
}
```

### Frontend — Mobile

```typescript
import { formatErrorMessage } from "@/lib/error-messages";

try {
  const profile = await apiPost("/birth-profiles", data);
} catch (error) {
  const { title, message } = formatErrorMessage(error);
  Alert.alert(title, message);
}
```

## Adding New Error Codes

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

3. Update frontend pattern matchers in `web/lib/error-messages.ts` and `mobile/src/lib/error-messages.ts`.

## Migration Status (as of 2026-06-23)

| Phase | Scope | Status |
|-------|-------|--------|
| Core infrastructure | `app/core/error_codes.py`, formatters | ✅ Done |
| Birth profiles | `birth_profile_service.py`, `birth_profiles.py` | ✅ Done |
| Chart APIs | `charts.py` (11 errors), `daily_guidance.py` (5), `transits.py` (4) | 🔄 Pending |
| Auth | `auth.py`, `mobile_auth.py` | 🔄 Pending |
| Family & relationships | `family_vault_service.py`, `synastry_service.py` | 🔄 Pending |
| Service layer | `daily_guidance_service.py`, `chart_service.py`, others | 🔄 Pending |
| Frontend integration | Web + mobile components | 🔄 Pending |

### Next High-Priority Items

**`app/api/charts.py`** (11 errors — most traffic):
- Lines 50, 53, 55, 78, 80: `CHART_NOT_FOUND`, `BIRTH_PROFILE_NOT_FOUND`, `ACCESS_DENIED`
- Lines 156, 158: `INVALID_DATE_RANGE`
- Lines 167, 276: `MISSING_MOON_DATA`, `MISSING_SUN_DATA`

**`app/api/daily_guidance.py`** (5 errors):
- Lines 39–52: `CHART_NOT_FOUND`, `BIRTH_PROFILE_NOT_FOUND`, `ACCESS_DENIED`

Run the migration report to get exact changes needed:
```powershell
python scripts/migrate-error-messages.py --report
```

## Security Notes

- User messages never expose internal details, database errors, or stack traces.
- Technical details stay in server logs only.
- All error codes use enums — zero string-lookup overhead at runtime.
