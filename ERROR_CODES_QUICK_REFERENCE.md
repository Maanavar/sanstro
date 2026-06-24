# Error Codes Quick Reference

Quick lookup for common error codes and their user messages.

## 404 - Not Found

| ErrorCode | User Message | When to Use |
|-----------|--------------|-----------|
| `BIRTH_PROFILE_NOT_FOUND` | Birth profile not found. Please create one to get started. | Profile doesn't exist |
| `CHART_NOT_FOUND` | Chart not found. Your birth profile may need a birth time to calculate it. | Chart doesn't exist |
| `FAMILY_VAULT_NOT_FOUND` | Family vault not found. It may have been deleted. | Vault doesn't exist |
| `FAMILY_MEMBER_NOT_FOUND` | Family member not found in the vault. | Member doesn't exist |
| `USER_NOT_FOUND` | User not found. Please check the user ID and try again. | User doesn't exist |
| `JOURNAL_ENTRY_NOT_FOUND` | Journal entry not found. It may have been deleted. | Entry doesn't exist |
| `GOAL_NOT_FOUND` | Goal not found. It may have been deleted. | Goal doesn't exist |
| `FEEDBACK_NOT_FOUND` | Feedback not found. | Feedback doesn't exist |
| `RESOURCE_NOT_FOUND` | The requested resource was not found. Please check and try again. | Generic 404 |

## 403 - Forbidden

| ErrorCode | User Message | When to Use |
|-----------|--------------|-----------|
| `ACCESS_DENIED` | You don't have permission to access this resource. | User isn't the owner |
| `PERMISSION_DENIED` | You don't have permission to perform this action. | Action not allowed |
| `ACCOUNT_SUSPENDED` | Your account has been suspended. Please contact support. | Account blocked |

## 401 - Unauthorized

| ErrorCode | User Message | When to Use |
|-----------|--------------|-----------|
| `NOT_AUTHENTICATED` | Please log in to continue. | No auth token |
| `TOKEN_EXPIRED` | Your session has expired. Please log in again. | Token expired |
| `TOKEN_INVALID` | Your session is invalid. Please log in again. | Token invalid |
| `TOKEN_REVOKED` | Your session has been revoked. Please log in again. | Token revoked |

## 409 - Conflict

| ErrorCode | User Message | When to Use |
|-----------|--------------|-----------|
| `RESOURCE_LIMIT_EXCEEDED` | You have reached the limit for this resource. Please upgrade your plan or remove some items. | Hit max count (e.g., 10 profiles) |
| `DUPLICATE_RESOURCE` | This resource already exists. | Creating duplicate |
| `EMAIL_ALREADY_EXISTS` | An account with this email already exists. | Duplicate email signup |

## 422 - Validation

| ErrorCode | User Message | When to Use |
|-----------|--------------|-----------|
| `INVALID_INPUT` | The provided input is invalid. Please check and try again. | Generic validation error |
| `VALIDATION_ERROR` | Please check your input and try again. | Validation failed |
| `MISSING_REQUIRED_FIELD` | Some required information is missing. Please fill in all fields. | Missing required field |
| `INVALID_DATE_RANGE` | The date range is invalid. Please check the start and end dates. | Invalid date range |
| `MISSING_DATA` | Required data is missing. Please provide all necessary information. | Missing crucial data |
| `INVALID_FORMAT` | The format of your input is invalid. Please check and try again. | Wrong format (e.g., HH:MM) |
| `VALUE_OUT_OF_RANGE` | One of the values you entered is outside the acceptable range. | Value bounds violated |
| `MISSING_MOON_DATA` | Moon position data is not available. Your profile may need a more accurate birth time. | No moon data |
| `MISSING_SUN_DATA` | Sun position data is not available. Your profile may need a more accurate birth time. | No sun data |

## 503 - Service Unavailable

| ErrorCode | User Message | When to Use |
|-----------|--------------|-----------|
| `SERVICE_UNAVAILABLE` | The service is temporarily unavailable. Please try again in a few moments. | Service down |
| `CONFIGURATION_ERROR` | A system configuration error has occurred. Please contact support. | System misconfigured |

## Backend Usage

```python
from app.core.error_codes import ErrorCode, get_error_message

# Basic usage
error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
raise HTTPException(
    status_code=error_info["status"],
    detail=error_info["user_message"],
)

# With context
error_info = get_error_message(
    ErrorCode.INVALID_DATE_RANGE,
    context="Start date must be before end date"
)
raise HTTPException(
    status_code=error_info["status"],
    detail=error_info["user_message"],
)
```

## Frontend Usage (Web)

```typescript
import { formatErrorMessage, getErrorTitle, getErrorDescription } from "@/lib/error-messages";

try {
  await apiFetchJson("/api/v1/birth-profiles");
} catch (error) {
  const { title, message, suggestion } = formatErrorMessage(error);
  // Display to user
  toast.error(title, { description: message });
}
```

## Frontend Usage (Mobile)

```typescript
import { formatErrorMessage } from "@/lib/error-messages";

try {
  const profile = await apiPost("/birth-profiles", data);
} catch (error) {
  const info = formatErrorMessage(error);
  Alert.alert(info.title, info.message);
}
```

## Common Error Patterns

The frontend automatically recognizes these patterns:

- `"birth profile not found"` → "Birth Profile Not Found"
- `"chart not found"` → "Chart Not Found"
- `"family vault not found"` → "Family Vault Not Found"
- `"access denied"` → "Access Denied"
- `"not authenticated"` → "Please Log In"
- `"token"` (any token-related error) → "Session Invalid"
- `"birth profile limit reached"` → "Profile Limit Reached"
- `"email already exists"` → "Email Already Registered"
- `"date"` / `"range"` → "Invalid Date Range"
- `"moon"` → "Moon Data Missing"
- `"sun"` → "Sun Data Missing"
- `"required"` → "Missing Information"

## Status Code Summary

- **404** (56 errors): Resource doesn't exist
- **422** (37 errors): Validation/input error
- **403** (35 errors): Permission denied
- **401** (13 errors): Authentication required
- **409** (4 errors): Duplicate/limit exceeded
- **503** (3 errors): Service unavailable

## Adding New Error Codes

1. Add to `ErrorCode` enum in `app/core/error_codes.py`
2. Add mapping to `ERROR_MESSAGES` dict
3. Update pattern matchers in:
   - `web/lib/error-messages.ts`
   - `mobile/src/lib/error-messages.ts`

```python
class ErrorCode(str, Enum):
    MY_NEW_ERROR = "MY_NEW_ERROR"

ERROR_MESSAGES = {
    ErrorCode.MY_NEW_ERROR: {
        "status": status.HTTP_XXX,
        "user_message": "User-friendly message...",
        "technical": "Technical detail...",
    },
}
```

## Testing

```python
def test_error():
    from app.core.error_codes import ErrorCode, get_error_message
    info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
    assert info["status"] == 404
    assert "birth profile" in info["user_message"].lower()
```

---

See `ERROR_HANDLING_GUIDE.md` for detailed documentation.
