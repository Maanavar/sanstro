# Error Handling System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                          │
│  ┌───────────────────────┬─────────────────────────────────────────┐ │
│  │   Web App (React)     │   Mobile App (React Native/Expo)       │ │
│  │                       │                                         │ │
│  │  error-messages.ts    │      error-messages.ts                 │ │
│  │  (Web formatter)      │      (Mobile formatter)                │ │
│  └───────────────────────┴─────────────────────────────────────────┘ │
│                                    ▲                                   │
│                                    │                                   │
│                     formatErrorMessage() function                     │
│                                    │                                   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API COMMUNICATION LAYER                         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  web/lib/api.ts              mobile/src/api/client.ts          │ │
│  │  - apiFetchJson()            - apiGet/Post/Patch()             │ │
│  │  - readUserFriendlyError()   - ApiError class                  │ │
│  │  - Extracts error details    - Handles auth/retries            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                    ▲                                   │
│                                    │                                   │
│                        HTTP Requests/Responses                       │
│                                    │                                   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER (FastAPI)                    │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  API Endpoints (birth_profiles.py, charts.py, etc.)            │ │
│  │                                                                 │ │
│  │  if condition_error:                                           │ │
│  │      error_info = get_error_message(ErrorCode.XXX)             │ │
│  │      raise HTTPException(                                      │ │
│  │          status_code=error_info["status"],                     │ │
│  │          detail=error_info["user_message"]                     │ │
│  │      )                                                         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                    ▲                                   │
│                                    │                                   │
│                      get_error_message() function                    │
│                                    │                                   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR CODE DEFINITION LAYER                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │        app/core/error_codes.py                                 │ │
│  │                                                                 │ │
│  │  ErrorCode (Enum):                                            │ │
│  │    - RESOURCE_NOT_FOUND                                       │ │
│  │    - BIRTH_PROFILE_NOT_FOUND                                  │ │
│  │    - CHART_NOT_FOUND                                          │ │
│  │    - ACCESS_DENIED                                            │ │
│  │    - RESOURCE_LIMIT_EXCEEDED                                  │ │
│  │    - ... (31 total)                                           │ │
│  │                                                                 │ │
│  │  ERROR_MESSAGES (Dict):                                       │ │
│  │    ErrorCode -> {                                             │ │
│  │      "status": HTTP status code                               │ │
│  │      "user_message": Friendly message                         │ │
│  │      "technical": Technical detail                            │ │
│  │    }                                                           │ │
│  │                                                                 │ │
│  │  get_error_message(ErrorCode) -> Dict                         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Example

### User Creates Birth Profile Over Limit

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                     │
│ Try to create birth profile with POST /birth-profiles            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ POST /api/backend/birth-profiles
                     │ (with profile data)
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               FASTAPI BACKEND (Python)                           │
│ POST /birth-profiles                                             │
│  ├─ Check profile count                                          │
│  ├─ Count >= max_profiles (10)  ✓ TRUE                           │
│  └─ error_info = get_error_message(                              │
│       ErrorCode.RESOURCE_LIMIT_EXCEEDED                          │
│     )                                                             │
│                                                                   │
│ Returns HTTP 409 with JSON:                                      │
│ {                                                                 │
│   "detail": "You have reached the limit for this resource.       │
│             Please upgrade your plan or remove some items."      │
│ }                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Response: 409, JSON
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│            MOBILE API CLIENT (mobile/src/api)                    │
│ catch (error) {                                                  │
│   throw new ApiError(409, "You have reached the limit...")      │
│ }                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ throw ApiError
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MOBILE COMPONENT (React Native)                    │
│ try {                                                            │
│   await apiPost("/birth-profiles", data)                        │
│ } catch (error) {                                               │
│   const info = formatErrorMessage(error)                        │
│                                                                  │
│   info.title = "Profile Limit Reached"                          │
│   info.message = "You have reached..."                          │
│   info.suggestion = "Delete an existing profile or upgrade..."  │
│                                                                  │
│   Alert.alert(info.title, info.message)                         │
│ }                                                                 │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  USER SEES FRIENDLY MESSAGE:                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Profile Limit Reached                              ✕    │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  You have reached the maximum number of birth           │   │
│  │  profiles.                                              │   │
│  │                                                          │   │
│  │  Delete an existing profile or upgrade your plan to     │   │
│  │  add more.                                              │   │
│  │                                                          │   │
│  │                                              [ OK ]      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Error Pattern Recognition Flow (Frontend)

```
Raw Error Message
    │
    ├─ "409: /api/v1/birth-profiles: You have reached the limit..."
    │
    ▼
Extract HTTP Status Code
    │
    ├─ statusCode = 409
    │
    ▼
Normalize Message Text
    │
    ├─ "you have reached the limit for this resource"
    │
    ▼
Pattern Matching (in order of priority)
    │
    ├─ Check multi-word patterns (length > 5)
    │   ├─ "birth profile limit reached" ? → Found! ✓
    │   └─ Map to ERROR_PATTERNS["birth profile limit reached"]
    │
    ├─ Check shorter patterns (if not found)
    │   └─ (skipped, already matched)
    │
    ▼
Return Error Info
    │
    └─ {
         title: "Profile Limit Reached",
         message: "You have reached the maximum number...",
         suggestion: "Delete an existing profile or upgrade...",
         statusCode: 409
       }
```

## 📁 File Structure

```
D:\sanstro\
│
├─ app/
│  ├─ core/
│  │  └─ error_codes.py ..................... Error definitions & messages
│  │
│  ├─ api/
│  │  ├─ birth_profiles.py ................. UPDATED with error codes
│  │  ├─ charts.py ......................... (pending)
│  │  └─ ... (other endpoints)
│  │
│  └─ services/
│     ├─ birth_profile_service.py ......... UPDATED with error codes
│     └─ ... (other services)
│
├─ web/
│  └─ lib/
│     ├─ api.ts ........................... UPDATED with new function
│     └─ error-messages.ts ................ NEW - Web error formatter
│
├─ mobile/
│  └─ src/
│     ├─ api/
│     │  └─ client.ts ..................... UPDATED with error methods
│     │
│     └─ lib/
│        └─ error-messages.ts ............ NEW - Mobile error formatter
│
├─ scripts/
│  └─ migrate-error-messages.py ........... NEW - Migration helper tool
│
└─ Documentation/
   ├─ ERROR_HANDLING_README.md ........... Quick start & overview
   ├─ ERROR_HANDLING_GUIDE.md ........... Complete usage guide
   ├─ ERROR_CODES_QUICK_REFERENCE.md ... Quick lookup table
   ├─ ERROR_HANDLING_IMPLEMENTATION.md . Technical details
   ├─ ERROR_HANDLING_MIGRATION_CHECKLIST.md . Step-by-step plan
   ├─ ERROR_HANDLING_ARCHITECTURE.md ... This file
   └─ ERROR_CODES_QUICK_REFERENCE.md ... Error code reference
```

## 🔌 Integration Points

### 1. Backend Error Raising
```python
from app.core.error_codes import ErrorCode, get_error_message

error_info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
raise HTTPException(
    status_code=error_info["status"],
    detail=error_info["user_message"],
)
```

### 2. Frontend Error Handling (Web)
```typescript
import { formatErrorMessage } from "@/lib/error-messages";

try {
  const result = await apiFetchJson("/api/v1/birth-profiles");
} catch (error) {
  const { title, message, suggestion } = formatErrorMessage(error);
  // Display to user...
}
```

### 3. Frontend Error Handling (Mobile)
```typescript
import { formatErrorMessage } from "@/lib/error-messages";
import { ApiError } from "./client";

try {
  const profile = await apiPost("/birth-profiles", data);
} catch (error) {
  if (error instanceof ApiError) {
    const info = formatErrorMessage(error);
    Alert.alert(info.title, info.message);
  }
}
```

## 🎯 Benefits Summary

### For Users
- Clear, understandable error messages
- Helpful suggestions for resolution
- Consistent experience across platforms
- No technical jargon

### For Developers
- Reusable error system (DRY)
- Easy to maintain and update
- Type-safe (TypeScript/Python enums)
- Comprehensive documentation
- Migration tools provided

### For Product
- Better user experience
- Reduced support tickets
- Trackable error codes for analytics
- Ready for localization

## 🚀 Performance Impact

- **Zero runtime overhead** for error codes (Python enum)
- **Minimal pattern matching overhead** (regex, done on error)
- **No network overhead** (messages generated on client)
- **Small bundle size increase** (<5KB for pattern maps)

## 🔐 Security Considerations

- ✅ User messages are non-technical (no sensitive info)
- ✅ Technical details kept in logs (not exposed to users)
- ✅ No stack traces in error messages
- ✅ Safe for public-facing errors
- ✅ Database errors wrapped with safe messages

## 📈 Metrics & Monitoring

Error codes can be tracked for:
- **Frequency** - Which errors are most common?
- **Impact** - Which cause most user friction?
- **Trends** - Are certain errors increasing?
- **Patterns** - Are some users hitting same error repeatedly?

```javascript
// Example analytics tracking
analytics.track('error_occurred', {
  code: 'RESOURCE_LIMIT_EXCEEDED',
  statusCode: 409,
  endpoint: '/api/v1/birth-profiles',
  userId: currentUser.id,
  timestamp: Date.now(),
});
```

## 🧪 Testing Strategy

### Unit Tests
```python
def test_error_codes():
    info = get_error_message(ErrorCode.BIRTH_PROFILE_NOT_FOUND)
    assert info["status"] == 404
```

### Integration Tests
```python
def test_api_error_response():
    response = client.post("/birth-profiles", data=payload)
    assert response.status_code == 409
    assert "reached the limit" in response.json()["detail"]
```

### UI Tests
```typescript
test("displays error message when profile limit reached", async () => {
  // Mock API to return 409
  // Attempt to create profile
  // Verify alert shows title and message
  // Verify suggestion is helpful
});
```

## 🔄 Migration Path

```
Phase 1 (DONE)
│
├─ Core system created
├─ Error codes defined
├─ Frontend formatters ready
└─ Initial 2 files updated

Phase 2 (THIS WEEK)
│
├─ Migrate high-priority files
│  ├─ Charts API (11 errors)
│  ├─ Daily guidance (multiple)
│  └─ Transits (4 errors)
│
└─ Test in staging

Phase 3 (NEXT WEEK)
│
├─ Migrate remaining files
├─ Update frontend display
└─ Deploy to production

Phase 4 (OPTIONAL)
│
├─ Add analytics tracking
├─ Add i18n support
└─ Monitor & iterate
```

---

**Next Step:** Run `python scripts/migrate-error-messages.py --report` to see what needs to be updated.
