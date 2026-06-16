# 08 — API Contract (Mobile)

**Author hat:** Mobile/Backend Architect
**Purpose:** The exact endpoints mobile depends on, what exists, and what must be built.
**Verified against code** in `app/api/*` and `app/schemas/*` on 2026-06-14.

Base URL per env (dev/staging/prod). Mobile calls FastAPI **directly** — never the Next proxy.
Auth: `Authorization: Bearer <accessToken>` for protected endpoints. Bilingual fields are
`{ ta, en }` objects.

---

## 1. What already EXISTS and is guest-ready (`/public/*`, no auth) ✅

| Endpoint | Method | Use | Returns |
|----------|--------|-----|---------|
| `/public/panchangam?date&lat&lng&timezone` | GET | Panchangam Day (S2), Today timings (S1), widget | `PanchangamDailyResponse` (very rich — see §4) |
| `/public/panchangam-share-card?date&lat&lng&timezone&city&lang` | GET | Share card (S8) | card payload dict |
| `/public/porutham` | POST | Porutham (S5/S5b) | `PublicPoruthamResponse{ data: DirectPoruthamData }` |
| `/public/friendship-compatibility` | POST | Friendship (S6) | friendship report dict |
| `/public/muhurta` | POST | Muhurta (S7) | `PublicMuhurtaResponse{ slots[] }` (top-3) |
| `/public/chart` | POST | (future guest chart preview) | `PublicChartResponse` |

Request bodies use camelCase aliases (e.g. `birthDateLocal`, `birthLatitude`, `personA`).

## 2. What must be BUILT for mobile 🔨 (backend tickets)

### T1 — Mobile auth (tokens in body)
Currently `/auth/login` & `/auth/register` set an httpOnly cookie only and return
`AuthUserResponse` **without a token** (`app/api/auth.py:103,123`). Mobile cannot get a token.
Add:
```
POST /auth/mobile/register   body {email,password,deviceId?}  → {accessToken,refreshToken,expiresIn,user}
POST /auth/mobile/login      body {email,password,deviceId?}  → {accessToken,refreshToken,expiresIn,user}
POST /auth/mobile/refresh    body {refreshToken}              → {accessToken,refreshToken,expiresIn}   (rotates)
POST /auth/mobile/logout     body {refreshToken}              → 204   (revokes)
```
- Access token 15–30 min; refresh 30–60 d, **rotated each use**, reuse → revoke all.
- New model `app/models/refresh_token.py` (store hash only). Reuse `_hash_password`,
  `create_access_token`.

### T2 — Make identity endpoints Bearer-capable
`/auth/me` (GET/PATCH/DELETE) read the cookie inline (`app/api/auth.py:138,171,208`) and
**bypass `get_current_user`**. Refactor to depend on `get_current_user` (already supports
both header + cookie) so web keeps working and mobile gains access.

### T3 — Multi-device push tokens
Today: single `fcm_device_token` (one device/user). Add:
```
POST   /devices/push-token   body {deviceId, fcmToken, platform, appVersion}  (upsert by user+device)
DELETE /devices/push-token   body {deviceId}                                   (logout / revoke)
```
- New model `app/models/device_token.py`. Update
  `app/services/notification_dispatch_service.py` to fan out to all active tokens.
- **Anonymous push (guest):** allow registering a device token without a user (nullable
  user_id) keyed by `deviceId`, with rasi+location, so guests get daily rasi-palan push.
  Scheduler sends to anonymous tokens too. *(Confirm privacy/abuse handling.)*

### T4 — Public daily Rasi Palan (NEW — real gap)
Rasi palan exists only as a **web client** tool (`web/app/tools/indraiya-rasipalan/*`); there
is **no API**. Build:
```
GET /public/rasi-palan?rasi={1..12 or sign}&date=&lang=ta|en   → { rasi, date, headline:{ta,en}, body:{ta,en}, luckyColor?, luckyNumber?, ... }
```
- Derive from Moon transit vs rasi (the engine already computes Moon position; reuse).
- Optional `?nakshatra=` variant. This powers Today (S1) + widget + daily push.

### T5 — Public monthly panchangam
`/panchangam/monthly` requires auth (`app/api/panchangam.py:37`). For guest calendar (S3):
either add `/public/panchangam/monthly` or relax auth on a public variant.

## 3. Endpoints used in Phase B (exist; confirm Bearer works after T2)
| Endpoint | Use |
|----------|-----|
| `POST /birth-profiles` | onboarding birth profile |
| `GET /charts/...` | chart calc/summary for personal Today |
| `GET /daily-guidance` | personal guidance + score |
| `GET /panchangam/daily` (auth) | personalized panchangam |
| `GET/PATCH /settings/notifications` | notification prefs (`NotificationPreferenceResponse`) |
| `GET /notifications` | inbox |
| `GET/PATCH/DELETE /auth/me` | profile/account |

## 4. Key response shape — Panchangam (verified, `app/schemas/panchangam.py`)
`PanchangamDailyResponseData` (camelCase via aliases) includes:
`dateLocal, tamilDate{ta,en}, location{lat,lng,timezone}, sunrise, sunset, solarNoon,
vara{weekday,lord}, tithi{number,name,paksha,endsAt,next...}, nakshatra{name,pada,endsAt,
nextName}, yoga, karana, kalam{rahuKalam,yamagandam,kuligai,gowriPanchangam[],nallaNeram[],
gowriNallaNeram[]}, abhijit{start,end,isRestrictedByWeekday}, subhaMuhurtham, festivals[],
hora[], moonPhaseLabel, soolam{direction,parigaram}, lagnam, nethiram, jeevan,
amirdhadhiYogam, chandrashtamamToday{moonRasiName,affectedJanmaRasiName,...},
specialTithiDay{name:POURNAMI|AMAVASAI,moonPhase}`. Slots are `{start,end,...,isGood}`.
→ **The Today + Panchangam screens need no new panchangam fields.**

## 5. Conventions & errors
- Error body: FastAPI `{detail}` (string or validation array). Client parses like
  `web/lib/api.ts` does (reuse the parsing logic, not the cookie transport).
- Versioning: send `X-Client: mobile` + app version header for analytics/gating.
- All list/tool POSTs accept camelCase aliases (`populate_by_name=True`).

## 6. Backend ticket checklist
- [ ] T1 mobile auth endpoints + refresh-token model + tests
- [ ] T2 `/auth/me` family → `get_current_user` (+ web regression test)
- [ ] T3 device-token model + endpoints + dispatcher fan-out (+ anonymous guest tokens)
- [ ] T4 `GET /public/rasi-palan` (+ optional nakshatra)
- [ ] T5 public monthly panchangam
- [ ] OpenAPI docs updated; migrations tested on `vinaadi_test` (up+down) per CLAUDE.md
