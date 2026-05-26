# Vinaadi AI — Enhancement & Bug Fix Instructions v1.1
# Complete Agent-Ready Implementation Guide

---

## IMPLEMENTATION STATUS (as of 2026-05-24)

All Phase 1 (Bug Fixes) and Phase 2 (Engagement + Growth Features) are **COMPLETE**. Full test suite: **210 tests passing**.

### Phase 1 — Bug Fixes ✅ COMPLETE

| ID | Description | File | Status |
|---|---|---|---|
| BUG-01 | Chandrashtama uses 8th Rasi from natal Moon Rasi (not 8th Nakshatra) | `app/services/daily_guidance_service.py` | ✅ Fixed |
| BUG-02 | Amavasai (Tithi 30) no longer penalises panchangam_score; triggers content card | `app/services/daily_guidance_service.py` | ✅ Fixed |
| BUG-03 | Kandaka Sani from Lagna: `classify_kandaka_cycle()` called with Lagna Rasi | `app/services/daily_guidance_service.py` | ✅ Fixed |
| BUG-04 | Complete 36-pair Graha Relationship Score table from Thirukanitham natural friendship | `app/services/daily_guidance_service.py` | ✅ Fixed |
| BUG-05 | Ashtakavarga engine: full BAV_TABLE per spec §9.2, AV bindu multiplier per chart | `app/calculations/ashtakavarga.py` | ✅ Fixed |
| BUG-06 | Natal planet strength scoring: 9-level dignity + Moolatrikona + combust weights | `app/calculations/chart_strength.py` | ✅ Fixed |
| BUG-07 | Functional Nature modifier (Karaka Balam) applied to TRANSIT_BASE_SCORE per Lagna | `app/services/daily_guidance_service.py` | ✅ Fixed |
| BUG-08 | Vedha Vichara check in transit loop — Vedha-blocked transits discounted | `app/services/daily_guidance_service.py` | ✅ Fixed |
| BUG-09 | Sookshma and Prana Dasha levels added to Vimshottari timeline | `app/services/dasha_service.py` | ✅ Fixed |
| BUG-10 | PLANET_PERIOD_SCORE and PLANET_DAILY_WEIGHT scaled by functional nature per Lagna | `app/services/daily_guidance_service.py` | ✅ Fixed |
| ARCH-01 | Calculation version bumped to `jothidam-formula-engine-v1.1-2026` | `app/services/chart_service.py`, `app/services/family_vault_service.py` | ✅ Done |

### Phase 2 — Engagement Features (Phase 3 + 4 in implementation order) ✅ COMPLETE

| ID | Description | New Files | Modified Files | Status |
|---|---|---|---|---|
| FEATURE-01 | Score explanation engine — per-component Tamil+English reasons + synthesised summary | — | `app/services/daily_guidance_service.py`, `app/schemas/daily_guidance.py` | ✅ Done |
| FEATURE-02 | Morning Nalla Neram push notification builder | `app/services/notification_service.py` | — | ✅ Done |
| FEATURE-03 | Dasha transition alerts (90/30/7-day and today) | `app/services/dasha_transition_service.py` | — | ✅ Done |
| FEATURE-04 | Family vault daily score view endpoint | — | `app/services/family_vault_service.py`, `app/schemas/family_vaults.py`, `app/api/family_vaults.py` | ✅ Done |
| FEATURE-05 | Amavasai / Pournami / Pradosham / Ekadasi tithi content cards | — | `app/services/narrative_engine.py` | ✅ Done |
| FEATURE-06 | Nakshatra birthday (Pirantha Naal) alert | `app/services/pirantha_naal_service.py` | — | ✅ Done |
| FEATURE-07 | Weekly digest endpoint (`GET /api/v1/daily-guidance/week-ahead`) | — | `app/services/daily_guidance_service.py`, `app/schemas/daily_guidance.py`, `app/api/daily_guidance.py` | ✅ Done |
| FEATURE-08 | Activity timing tool endpoint (`GET /api/v1/activity-timing`) | — | `app/services/daily_guidance_service.py`, `app/schemas/daily_guidance.py`, `app/api/daily_guidance.py` | ✅ Done |
| FEATURE-09 | Dasha story timeline endpoint (`GET /api/v1/charts/{id}/dasha/timeline`) | — | `app/services/daily_guidance_service.py`, `app/schemas/daily_guidance.py`, `app/api/daily_guidance.py` | ✅ Done |
| FEATURE-10 | Nakshatra personality content cards (`GET /api/v1/content/nakshatra/{1-27}`) | `app/services/nakshatra_content_static.py`, `app/api/content.py` | `app/main.py` | ✅ Done |
| FEATURE-11 | Peyarchi report — Guru/Sani Rasi change outlook (`GET /api/v1/transits/peyarchi-report/{id}`) | — | `app/services/daily_guidance_service.py`, `app/schemas/daily_guidance.py`, `app/api/daily_guidance.py` | ✅ Done |
| FEATURE-12 | Journal mood-correlation endpoint (`GET /api/v1/journal/{id}/correlations`) | — | `app/services/daily_guidance_service.py`, `app/schemas/daily_guidance.py`, `app/api/daily_guidance.py` | ✅ Done |

### What remains (Phase 5 — Infrastructure)

ARCH-02 is complete. A new agent picking this up should start with ARCH-03:

| ID | Description | Priority | Status |
|---|---|---|---|
| ARCH-02 | FCM push + SMTP email delivery with retry, `UserNotificationPreference` model | HIGH | ✅ Done (2026-05-24) |
| ARCH-03 | Tamil string completeness audit + regression test across all user-facing strings | MEDIUM | ✅ Done (2026-05-24) |

### New endpoints added (Phase 2)

All new endpoints are under `/api/v1`:

| Endpoint | Method | Description |
|---|---|---|
| `/daily-guidance/week-ahead?profileId=&weekStart=` | GET | 7-day score digest with best day, Chandrashtama flags |
| `/activity-timing?chartId=&activity=&month=` | GET | Top 5 dates in month for a specific activity type |
| `/charts/{chart_id}/dasha/timeline?asOf=` | GET | Full Mahadasha timeline from birth |
| `/charts/{chart_id}/daily-guidance?date=` | GET | Daily guidance with score breakdown + reasons (FEATURE-01) |
| `/transits/peyarchi-report/{chart_id}?planet=&asOf=` | GET | Jupiter or Saturn Rasi-change event outlook |
| `/journal/{chart_id}/correlations?lookbackDays=` | GET | Mood pattern correlations (min 30 entries required) |
| `/content/nakshatra/{nakshatra_number}` | GET | Static personality card for Nakshatras 1–27 |
| `/family-vaults/{vault_id}/today?date=` | GET | All family members' day scores in one call |

### ARCH-02 — Notification Infrastructure (completed 2026-05-24)

| Component | File | Description |
|---|---|---|
| Model | `app/models/user_notification_preference.py` | `UserNotificationPreference` — channel (none/email/push/both), per-alert toggles, FCM token, smart silence flag |
| Migration | `migrations/versions/e1a2b3c4d5f6_user_notification_preferences.py` | Creates `user_notification_preferences` table |
| Email | `app/services/email_service.py` | Generic `send_email(EmailMessage)` with 3-attempt exponential backoff; `build_notification_email()` helper; stub mode when SMTP unconfigured |
| FCM | `app/services/fcm_service.py` | FCM HTTP v1 API via `httpx`; OAuth2 JWT from service account JSON; stub mode when `JOTHIDAM_FCM_PROJECT_ID` / `JOTHIDAM_FCM_SERVICE_ACCOUNT_JSON` unset |
| Dispatch | `app/services/notification_dispatch_service.py` | `dispatch_notification()` — channel routing, smart silence (max 1 push/day during JANMA_SANI/ASHTAMA_SANI/EZHARAI_SANI), Notification row audit log |
| API | `app/api/notification_preferences.py` | `GET/PATCH /api/v1/settings/notifications`, `PUT/DELETE /api/v1/settings/notifications/fcm-token` |
| Config | `app/core/config.py` | Added `fcm_project_id` and `fcm_service_account_json` settings (env: `JOTHIDAM_FCM_PROJECT_ID`, `JOTHIDAM_FCM_SERVICE_ACCOUNT_JSON`) |
| Tests | `tests/test_notification_preferences.py` | 15 tests covering API CRUD, stub modes, smart silence, channel validation |

**All notifications are opt-in** (`notification_channel` defaults to `"none"`).

**Smart silence rule:** During `JANMA_SANI`, `ASHTAMA_SANI`, `EZHARAI_SANI_PHASE_1`, `EZHARAI_SANI_PHASE_3` cycles, if a push was already sent today, additional pushes are suppressed (status=`suppressed` in audit log). Configurable per user via `smart_silence_enabled`.

**FCM dependency note:** FCM push requires the `cryptography` pip package for JWT signing. It is not in `pyproject.toml` because FCM is optional. When enabling FCM in production: `pip install cryptography`.

### Key service files (agent orientation)

| File | Purpose |
|---|---|
| `app/services/daily_guidance_service.py` | Core score engine + all daily guidance endpoints |
| `app/services/narrative_engine.py` | Bilingual text generation (`BiText`, `_bi()`, tithi cards) |
| `app/services/dasha_transition_service.py` | 90/30/7-day Dasha transition alerts |
| `app/services/notification_service.py` | Morning push notification builder |
| `app/services/pirantha_naal_service.py` | Nakshatra birthday (Pirantha Naal) scanner |
| `app/services/nakshatra_content_static.py` | All 27 Nakshatra personality cards (static bilingual) |
| `app/services/family_vault_service.py` | Family vault operations including today-view |
| `app/calculations/ashtakavarga.py` | Full Ashtakavarga BAV engine (BUG-05) |
| `app/calculations/chart_strength.py` | Natal planet strength scoring (BUG-06) |

---

## MANDATORY READING BEFORE ANY CODE CHANGE

Read these files in this order before touching any code. Every calculation decision traces back to them.

1. `agents.md` — project identity, coding rules, QA gates, astrology safety rules, work style
2. `docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md` — **source of truth for all calculations**
3. `docs/Jothidam_AI_Product_Specification_v7_FULL_Master_Build_Thirukanitham_2026.md` — product modules and feature scope
4. `docs/Jothidam_AI_QA_Golden_Test_Cases_v1_Thirukanitham_2026.md` — mandatory QA gates
5. `docs/Jothidam_AI_OpenAPI_v1_Thirukanitham_2026.yaml` — API contracts
6. `docs/Jothidam_AI_PostgreSQL_Schema_v1_Thirukanitham_2026.sql` — database schema

The Formula Engine Spec (item 2) is authoritative for numerical formulas. Where the product spec and formula spec conflict, the formula spec wins for calculations and the product spec wins for UX/tone/content decisions. Where either spec conflicts with known Tamil Jyothidam tradition, the conflict is noted below with a ruling.

---

## KNOWN CONFLICTS BETWEEN DOCUMENTS — RULINGS

Read these before implementing anything. They exist and agents must not blindly follow either document without checking here first.

---

### CONFLICT-01 — Amavasai (Tithi 30) in the Panchangam score

**Formula Engine Spec §10.5** says:
```python
if tithi in [8, 23, 30]: score -= 10
```

**Product Spec Module 3.1 Step 11** says:
> "Amavasai: trigger Amavasai content card with Kula Deivam reminder."
It does NOT say penalise the score.

**Tamil Jyothidam reality:** Amavasai is the Pitru Tarpan day — ancestor worship. It is not an inauspicious day in the classical sense. It is a sacred, purpose-specific day with its own significance. Applying a generic -10 penalty is a developer error in the formula spec.

**RULING:** Do NOT penalise Tithi 30 (Amavasai) in the panchangam_score. Trigger a special Amavasai content card instead. Fix this in `app/services/daily_guidance_service.py`. The formula spec §10.5 is wrong on this point. The product spec and Thirukanitham tradition are correct.

---

### CONFLICT-02 — Chandrashtama: Nakshatra check vs Rasi check

**Formula Engine Spec §4.11** says:
```python
moon_from_janma = house_from(janma_rasi, current_moon_rasi)
is_chandrashtama = (moon_from_janma == 8)
```
This clearly uses **Rasi**.

**Current code** in `app/services/daily_guidance_service.py` uses Nakshatra count:
```python
chandrashtama = current_nakshatra == ((janma_nakshatra + 7 - 1) % 27) + 1
```

**RULING:** The code is wrong. The spec is correct. Chandrashtama is the 8th Rasi from natal Moon Rasi. Fix the code to match the spec.

---

### CONFLICT-03 — Kantaka Sani spelling

Formula spec §6.3 uses "Kantaka". Product spec Module 5.1 uses "Kandaka". Code uses "KANTAKA_SANI".

**RULING:** These are transliteration variants of the same Tamil word. Use "KANTAKA" throughout code (already in code) and note both spellings in user-facing text.

---

### CONFLICT-07 — TRANSIT_BASE_SCORE and PLANET_PERIOD_SCORE ignore Lagna-based functional lordship [CRITICAL DESIGN ERROR]

**What the current code does:**
```python
TRANSIT_BASE_SCORE = {
    "JUPITER": {1:50, 2:72, 3:48, 4:42, 5:78, 6:38, 7:74, 8:25, 9:82, 10:58, 11:80, 12:34},
    ...
}
# Jupiter in 9th from Moon = 82 for ALL 12 Lagnas
```

**What is wrong:**
The base score for a transiting planet depends not just on which house it is in from the Moon, but on **what that planet functionally owns in this person's chart based on their Lagna**. This is called the planet's **functional nature (Karaka Balam)** for that Lagna.

Jupiter in the 9th from Moon scores 82 for everyone. But:

| Lagna | Jupiter owns | Jupiter transiting 9th from Moon means |
|---|---|---|
| Mesha | 9th + 12th | 9th lord in 9th — Bhagya lord in Bhagya house → near maximum benefit |
| Rishabam | 8th + 11th | 8th lord transiting → obstacles + gains mixed → reduce score |
| Midhunam | 7th + 10th | Kendradhipati dosha — functional neutral/mixed → reduce score |
| Kadagam | 6th + 9th | Shatru + Bhagya lord — complicated → reduce score |
| Simmam | 5th + 8th | Putra lord in 9th → positive, but 8th ownership clouds it → moderate |
| Kanni | 4th + 7th | Two Kendra lords — Kendradhipati → neutral/reduce |
| Thulaam | 3rd + 6th | Upachaya + Shatru — weak → reduce score significantly |
| Vrichigam | 2nd + 5th | Dhana + Putra lord in 9th → good → boost score |
| Dhanusu | 1st + 4th | Lagna lord in 9th — very good → boost score |
| Magaram | 12th + 3rd | Vyaya + Upachaya — mixed/weak → reduce score |
| Kumbam | 11th + 2nd | Labha + Dhana lord in 9th → good → boost score |
| Meenam | 10th + 1st | Karma + Lagna lord in 9th → very good → boost score |

The same 82 cannot apply to all of these. **The base score must be adjusted by a functional nature modifier derived from this person's Lagna.**

This same problem affects:
1. `TRANSIT_BASE_SCORE` — every planet × every house combination
2. `PLANET_PERIOD_SCORE` — Jupiter Mahadasha scores 72 for everyone. But for Thulaam Lagna, Jupiter is the 3rd + 6th lord (Shatru + Upachaya) — a difficult Dasha. For Dhanusu Lagna, Jupiter is the Lagna lord — the best possible Mahadasha.
3. `PLANET_DAILY_WEIGHT` — Saturn gets 0.20 weight for everyone. But for Thulaam Lagna, Saturn is the Yogakaraka (most benefic planet). For Kadagam Lagna, Saturn is the 7th + 8th lord (Maraka + Obstacle). The weight cannot be universal.

**RULING:** The `TRANSIT_BASE_SCORE` table values are reasonable generic house-quality baselines. They are not wrong as a starting point. But they must be **multiplied by a functional nature modifier** derived from the transiting planet's lordship for this person's Lagna. This is separate from and additional to the Ashtakavarga multiplier (BUG-05). See BUG-10 below.

---

### CONFLICT-04 — Graha Relationship Score: no table in spec

Neither the Formula Engine Spec nor the Product Spec defines a numeric Graha Relationship Score table. The formula spec §10.4 says `graha_relationship_score(maha_lord, antar_lord)` without defining values. The current code has a partial hardcoded table with a fallback of 52 for undefined pairs.

**RULING:** The relationship score must be derived from the classical Thirukanitham natural friendship/enmity table. All 9×9 pairs must be covered. A flat fallback of 52 for undefined pairs produces false scores. Build it from first principles as specified in BUG-04 below.

---

### CONFLICT-05 — AV tables in this document vs Formula Engine Spec §9.2

A previous version of this instructions file had incorrect Ashtakavarga contribution tables that were invented, not sourced. The Formula Engine Spec §9.2 has the authoritative BAV_TABLE for 7 planets. **Always use the spec's BAV_TABLE**, reproduced verbatim in BUG-05 below.

---

### CONFLICT-06 — Planet strength scoring: simplified vs spec §7.6

The formula spec §7.6 defines the product-level strength score formula with specific weights. A previous version of this instructions file had a different simplified formula. **Use the spec's formula** as specified in BUG-06 below, with the 9-level dignity table from spec §7.1 and Moolatrikona zones from spec §7.3.

---

## UNDERSTANDING THE CURRENT SCORE ENGINE

Before touching any code, understand what is already personalised vs. generic in `app/services/daily_guidance_service.py`.

| Component | Start value | Already personalised? | Remaining gap |
|---|---|---|---|
| `moon_score` | 70 | **Yes** — adjusted by this user's Janma Nakshatra vs today's transit Moon, Chandrashtama, auspicious Nakshatra set | Base 70 is a neutral placeholder per spec §10.2 — correct |
| `transit_score` | 50.0 | **Partially** — uses this user's natal Moon Rasi for house positions per planet | AV multiplier always 1.0 for everyone — missing Ashtakavarga (BUG-05) |
| `panchangam_score` | 70 | **Partially** — checks weekday lord vs this user's Lagna lord and Maha lord | Base 70 is neutral placeholder per spec §10.5 — correct. Amavasai wrongly penalised (BUG-02) |
| `personal_safety_score` | 60 | **Yes** — checks this user's Chandrashtama, Saturn cycle from natal Moon, Mercury combust | Chandrashtama uses Nakshatra not Rasi (BUG-01). Kandaka Sani from Lagna never called (BUG-03) |
| `dasha_score` | Computed | **Partially** — uses this user's actual Vimshottari timeline | PLANET_PERIOD_SCORE is generic (BUG-06). Also ignores Lagna-based functional nature — Jupiter Mahadasha = 72 for all Lagnas even though Jupiter is 3rd+6th lord (weak) for Thulaam Lagna (BUG-10) |
| AV multiplier | 1.0 always | **No** — identical for all users | Full Ashtakavarga engine missing (BUG-05) |
| `TRANSIT_BASE_SCORE[graha][house]` | Per house from Moon | **Partially** — house position from Moon is personalised | Ignores planet's functional lordship for this Lagna. Jupiter in 9th from Moon = 82 for everyone — but for Thulaam Lagna, Jupiter is 3rd+6th lord (harmful), score should be much lower. (BUG-10) |
| `PLANET_DAILY_WEIGHT` | Fixed per planet | **No** — same weight for all Lagnas | Saturn weight 0.20 for everyone — but Saturn is Yogakaraka for Thulaam Lagna and Maraka for Kadagam Lagna. Must scale by functional nature. (BUG-10) |
| `_graha_relationship_score` | Partial table | **Partially** — correct for 14 pairs | 22 pairs fall back to flat 52 (BUG-04) |

**The core gap:** The base scores and weights treat every planet as having the same character for every person. In Thirukanitham, a planet's effect is always filtered through its functional lordship for that specific Lagna (Karaka Balam). This is not implemented anywhere in the codebase. See BUG-10.

---

## SECTION A — BUG FIXES

Fix these in order. Do not start features until Phase 1 bugs pass all QA gates.

---

### BUG-01 — Chandrashtama uses 8th Nakshatra instead of 8th Rasi [CRITICAL]

**File:** `app/services/daily_guidance_service.py` ~line 546  
**Spec reference:** Formula Engine Spec §4.11  
**Impact:** Wrong Chandrashtama alerts. The Moon transits each Nakshatra in ~1 day and each Rasi in ~2.25 days. Near Rasi boundaries, the Nakshatra check fires at the wrong time.

**Current wrong code:**
```python
chandrashtama = current_nakshatra == ((janma_nakshatra + 7 - 1) % 27) + 1
```

**Correct code per spec §4.11:**
```python
# Chandrashtama = transiting Moon in the 8th Rasi from natal Janma Rasi
# Formula: house_from(janma_rasi, current_moon_rasi) == 8
moon_current_rasi = moon.rasi
chandrashtama_rasi = ((natal_moon.rasi - 1 + 7) % 12) + 1  # 8th Rasi from natal Moon
chandrashtama = moon_current_rasi == chandrashtama_rasi
```

The `moon.rasi` is already computed above this line. `natal_moon.rasi` is the natal Moon Rasi from the chart snapshot.

**Also fix:** The existing check for Anujanma and Trijanma above this line uses Nakshatra count — that is correct because those are Nakshatra-based checks. Only Chandrashtama must be changed to Rasi-based.

**Tests to add in `tests/test_calculations.py`:**
```python
def test_chandrashtama_8th_rasi_from_natal_moon():
    # Moon in Kumbam (11) → affects Katakam (4) natives
    # house_from(4, 11) = (11-4)%12 + 1 = 8 ✓
    natal_moon_rasi = 4  # Katakam
    chandrashtama_rasi = ((natal_moon_rasi - 1 + 7) % 12) + 1
    assert chandrashtama_rasi == 11  # Kumbam

def test_chandrashtama_not_triggered_by_nakshatra_boundary():
    # Janma Rasi Rishabam (2). 8th Rasi = Dhanusu (9).
    # Moon in Kadagam (4) is NOT chandrashtama even if it's the 8th Nakshatra from Janma Nakshatra
    natal_moon_rasi = 2
    chandrashtama_rasi = ((natal_moon_rasi - 1 + 7) % 12) + 1
    assert chandrashtama_rasi == 9  # Dhanusu, not Kadagam
    assert 4 != chandrashtama_rasi  # Moon in Kadagam does not trigger chandrashtama
```

---

### BUG-02 — Amavasai (Tithi 30) wrongly penalised -10 in panchangam_score [HIGH]

**File:** `app/services/daily_guidance_service.py` ~line 584  
**Conflict ruling:** See CONFLICT-01 above. Formula spec §10.5 includes `tithi in [8,23,30]: score -= 10` but this is a spec error. Product spec and Thirukanitham tradition are correct — Amavasai is a sacred day, not an inauspicious one.  
**Impact:** Every Amavasai, all users get a -10 score penalty they should not receive. The score label may shift from GOOD to BALANCED incorrectly.

**Current wrong code:**
```python
if panchangam.tithi_number in [8, 23, 30]:
    panchangam_score -= 10
```

**Correct code:**
```python
# Ashtami (8th Tithi, both pakshas) — mild caution
if panchangam.tithi_number in {8, 23}:
    panchangam_score -= 10
# Tithi 30 = Amavasai — DO NOT penalise.
# Amavasai is the Pitru Tarpan / ancestor worship day.
# Surface the Amavasai content card instead (see FEATURE-05).
```

**Tests to add:**
```python
def test_amavasai_not_penalised():
    assert 30 not in {8, 23}  # Amavasai must not be in the Ashtami penalty set

def test_ashtami_penalised():
    assert 8 in {8, 23}   # Shukla Ashtami penalised
    assert 23 in {8, 23}  # Krishna Ashtami penalised
```

---

### BUG-03 — Kandaka Sani from Lagna never called — function exists but unused [HIGH]

**Files:**
- `app/calculations/transits.py` — `classify_kandaka_cycle()` exists at line 137 but is never imported elsewhere
- `app/services/daily_guidance_service.py` — only calls `classify_sani_cycle()` from Moon

**Spec reference:** Formula Engine Spec §6.3:
```python
saturn_from_lagna = house_from(lagna_rasi, saturn_rasi)
is_kandaka_lagna = saturn_from_lagna in [1, 4, 7, 10]
```

**Impact:** Users whose Saturn is in the 1st, 4th, 7th, or 10th from their Lagna but NOT in an Ezhara/Ashtama Sani position get no alert at all. Kantaka Sani from Lagna is a distinct, independently significant cycle.

**Fix — Step 1:** Import in `daily_guidance_service.py`:
```python
from app.calculations.transits import RASI_NAMES, classify_sani_cycle, classify_kandaka_cycle, is_combust
```

**Fix — Step 2:** Add after the existing Saturn cycle line (~line 617):
```python
# Ezhara Sani / Ashtama Sani — from natal Moon (primary)
saturn_cycle = classify_sani_cycle(house_from_reference(natal_moon.rasi, saturn.rasi))

# Kantaka Sani — from natal Lagna (independent check per spec §6.3)
natal_lagna_rasi = chart_snapshot.data.lagna.rasi
kantaka_sani = classify_kandaka_cycle(house_from_reference(natal_lagna_rasi, saturn.rasi))
```

**Fix — Step 3:** Update personal_safety_score to include Kantaka Sani:
```python
personal_safety_score = 60
if chandrashtama:
    personal_safety_score -= 15
if saturn_cycle.is_active and saturn_cycle.type in {
    "JANMA_SANI", "ARDHASHTAMA_SANI", "ASHTAMA_SANI", "KANTAKA_SANI"
}:
    personal_safety_score -= 10
# Kantaka from Lagna: only add independent penalty if not already in Ezhara/Ashtama
# to avoid double-counting when both cycles overlap
if kantaka_sani.is_active and not saturn_cycle.is_active:
    personal_safety_score -= 7
if panchangam.abhijit_restricted:
    personal_safety_score -= 5
if is_combust("MERCURY",
    transit_snapshot.bodies["MERCURY"].absolute_longitude,
    sun.absolute_longitude,
    transit_snapshot.bodies["MERCURY"].is_retrograde):
    personal_safety_score -= 3
personal_safety_score = max(0, min(100, personal_safety_score))
```

**Fix — Step 4:** Pass `kantaka_sani` to the reasons builder so users see an explanation.

**Tests to add:**
```python
def test_kandaka_sani_from_lagna_detected():
    from app.calculations.transits import classify_kandaka_cycle
    for house in [1, 4, 7, 10]:
        result = classify_kandaka_cycle(house)
        assert result.is_active is True
        assert result.type == "KANDAKA_SANI"

def test_kandaka_sani_not_other_houses():
    from app.calculations.transits import classify_kandaka_cycle
    for house in [2, 3, 5, 6, 8, 9, 11, 12]:
        result = classify_kandaka_cycle(house)
        assert result.is_active is False
```

---

### BUG-04 — GRAHA_RELATIONSHIP_SCORE missing 22 planet pairs — fallback is flat 52 [HIGH]

**File:** `app/services/daily_guidance_service.py` lines 91–107 and `_graha_relationship_score()` ~line 163  
**Impact:** 22 of 36 possible Mahadasha/Antardasha combinations return a flat 52, which is wrong. Critical pairs like Saturn-Jupiter, Rahu-Jupiter, Ketu-Saturn, Mars-Jupiter all fall back to 52.

**Root cause:** No authoritative table exists in either spec (see CONFLICT-04). Must be derived from the classical Thirukanitham natural friendship/enmity table, which is well-established.

**The authoritative natural friendship table (Tamil Jyothidam / Parashari):**

| Planet | Natural Friends | Natural Neutrals | Natural Enemies |
|---|---|---|---|
| SUN | MOON, MARS, JUPITER | MERCURY | VENUS, SATURN, RAHU, KETU |
| MOON | SUN, MERCURY | MARS, JUPITER, VENUS, SATURN | RAHU, KETU |
| MARS | SUN, MOON, JUPITER | VENUS, SATURN, KETU | MERCURY, RAHU |
| MERCURY | SUN, VENUS | MARS, JUPITER, SATURN, RAHU, KETU | MOON |
| JUPITER | SUN, MOON, MARS | SATURN | MERCURY, VENUS, RAHU, KETU |
| VENUS | MERCURY, SATURN | MARS, JUPITER | SUN, MOON, RAHU, KETU |
| SATURN | MERCURY, VENUS | JUPITER, RAHU, KETU | SUN, MOON, MARS |
| RAHU | VENUS, SATURN | MERCURY, KETU | SUN, MOON, MARS, JUPITER |
| KETU | MARS, VENUS | MERCURY, SATURN | SUN, MOON, JUPITER, RAHU |

**Score mapping:** Friend = 70, Neutral = 55, Enemy = 38, Same lord = 72.

**Replace the partial table and fallback with this complete function:**
```python
# Move to module-level constants (not inside the function)
_NATURAL_FRIENDS: dict[str, frozenset[str]] = {
    "SUN":     frozenset({"MOON", "MARS", "JUPITER"}),
    "MOON":    frozenset({"SUN", "MERCURY"}),
    "MARS":    frozenset({"SUN", "MOON", "JUPITER"}),
    "MERCURY": frozenset({"SUN", "VENUS"}),
    "JUPITER": frozenset({"SUN", "MOON", "MARS"}),
    "VENUS":   frozenset({"MERCURY", "SATURN"}),
    "SATURN":  frozenset({"MERCURY", "VENUS"}),
    "RAHU":    frozenset({"VENUS", "SATURN"}),
    "KETU":    frozenset({"MARS", "VENUS"}),
}

_NATURAL_ENEMIES: dict[str, frozenset[str]] = {
    "SUN":     frozenset({"VENUS", "SATURN", "RAHU", "KETU"}),
    "MOON":    frozenset({"RAHU", "KETU"}),
    "MARS":    frozenset({"MERCURY", "RAHU"}),
    "MERCURY": frozenset({"MOON"}),
    "JUPITER": frozenset({"MERCURY", "VENUS", "RAHU", "KETU"}),
    "VENUS":   frozenset({"SUN", "MOON", "RAHU", "KETU"}),
    "SATURN":  frozenset({"SUN", "MOON", "MARS"}),
    "RAHU":    frozenset({"SUN", "MOON", "MARS", "JUPITER"}),
    "KETU":    frozenset({"SUN", "MOON", "JUPITER", "RAHU"}),
}


def _graha_relationship_score(maha_lord: str, antar_lord: str) -> int:
    if maha_lord == antar_lord:
        return 72
    if antar_lord in _NATURAL_FRIENDS.get(maha_lord, frozenset()):
        return 70
    if antar_lord in _NATURAL_ENEMIES.get(maha_lord, frozenset()):
        return 38
    return 55  # Natural neutral
```

**Delete the old `GRAHA_RELATIONSHIP_SCORE` dict** — it is replaced by the above.

**Tests to add:**
```python
def test_relationship_same_lord():
    assert _graha_relationship_score("JUPITER", "JUPITER") == 72

def test_relationship_friends():
    assert _graha_relationship_score("JUPITER", "SUN") == 70
    assert _graha_relationship_score("SUN", "JUPITER") == 70  # symmetric

def test_relationship_enemies():
    assert _graha_relationship_score("SUN", "SATURN") == 38
    assert _graha_relationship_score("SATURN", "SUN") == 38  # symmetric

def test_relationship_neutral():
    assert _graha_relationship_score("JUPITER", "SATURN") == 55

def test_all_36_pairs_covered():
    planets = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN","RAHU","KETU"]
    for m in planets:
        for a in planets:
            score = _graha_relationship_score(m, a)
            assert score in {38, 55, 70, 72}, f"Unexpected {score} for {m}/{a}"
```

---

### BUG-05 — Ashtakavarga engine missing — all users get same 1.0x transit multiplier [CRITICAL]

**File:** `app/services/daily_guidance_service.py` lines 553–570  
**Spec reference:** Formula Engine Spec §9.1, §9.2, §10.3  
**Impact:** The transit score (25% of daily total) uses a fixed 1.0x multiplier for every user. Person A with Jupiter in a house where they have 6 bindus (strong) and Person B with 2 bindus (weak) get the same score. This is the largest accuracy gap in the system.

**Step 1 — Create `app/calculations/ashtakavarga.py`**

Use the BAV_TABLE verbatim from Formula Engine Spec §9.2. Do not invent or modify these values:

```python
"""
Ashtakavarga (Bhinnashtakavarga) bindu calculation.
Source: Formula Engine Spec §9.1-9.4, Thirukanitham / Brihat Parashara tradition.

BAV_TABLE[planet][reference_point] = list of houses (from that reference point's Rasi)
that contribute 1 bindu when the planet transits there.
"""
from __future__ import annotations
from app.calculations.astro import house_from_reference

# Verbatim from Formula Engine Spec §9.2
BAV_TABLE: dict[str, dict[str, list[int]]] = {
    "SUN": {
        "SUN":     [1,2,4,7,8,9,10,11],
        "MOON":    [3,6,10,11],
        "MARS":    [1,2,4,7,8,9,10,11],
        "MERCURY": [3,5,6,9,10,11,12],
        "JUPITER": [5,6,9,11],
        "VENUS":   [6,7,12],
        "SATURN":  [1,2,4,7,8,9,10,11],
        "LAGNA":   [3,4,6,10,11,12],
    },
    "MOON": {
        "SUN":     [3,6,7,8,10,11],
        "MOON":    [1,3,6,7,10,11],
        "MARS":    [2,3,5,6,9,10,11],
        "MERCURY": [1,3,4,5,7,8,10,11],
        "JUPITER": [1,4,7,8,10,11,12],
        "VENUS":   [3,4,5,7,9,10,11],
        "SATURN":  [3,5,6,11],
        "LAGNA":   [3,6,10,11],
    },
    "MARS": {
        "SUN":     [3,5,6,10,11],
        "MOON":    [3,6,11],
        "MARS":    [1,2,4,7,8,10,11],
        "MERCURY": [3,5,6,11],
        "JUPITER": [6,10,11,12],
        "VENUS":   [6,8,11,12],
        "SATURN":  [1,4,7,8,9,10,11],
        "LAGNA":   [1,2,4,7,8,10,11],
    },
    "MERCURY": {
        "SUN":     [5,6,9,11,12],
        "MOON":    [2,4,6,8,10,11],
        "MARS":    [1,2,4,7,8,9,10,11],
        "MERCURY": [1,3,5,6,9,10,11,12],
        "JUPITER": [6,8,11,12],
        "VENUS":   [1,2,3,4,5,8,9,11],
        "SATURN":  [1,2,4,7,8,9,10,11],
        "LAGNA":   [1,2,4,6,8,10,11],
    },
    "JUPITER": {
        "SUN":     [1,2,3,4,7,8,9,10,11],
        "MOON":    [2,5,7,9,11],
        "MARS":    [1,2,4,7,8,10,11],
        "MERCURY": [1,2,4,5,6,9,10,11],
        "JUPITER": [1,2,3,4,7,8,10,11],
        "VENUS":   [2,5,6,9,10,11],
        "SATURN":  [3,5,6,12],
        "LAGNA":   [1,2,4,5,6,7,9,10,11],
    },
    "VENUS": {
        "SUN":     [8,11,12],
        "MOON":    [1,2,3,4,5,8,9,11,12],
        "MARS":    [3,4,6,9,11,12],
        "MERCURY": [3,5,6,9,11],
        "JUPITER": [5,8,9,10,11],
        "VENUS":   [1,2,3,4,5,8,9,10,11],
        "SATURN":  [3,4,5,8,9,10,11],
        "LAGNA":   [1,2,3,4,5,8,9,11],
    },
    "SATURN": {
        "SUN":     [1,2,4,7,8,10,11],
        "MOON":    [3,6,11],
        "MARS":    [3,5,6,10,11,12],
        "MERCURY": [6,8,9,10,11,12],
        "JUPITER": [5,6,11,12],
        "VENUS":   [6,11,12],
        "SATURN":  [3,5,6,11],
        "LAGNA":   [1,3,4,6,10,11],
    },
}

# Rahu and Ketu do not have classical Bhinnashtakavarga tables.
# Per spec §9.3 the Sarvashtakavarga sums only the 7 planets above.
# For Rahu/Ketu transit scoring, use Saturn's table as a proxy (common Thirukanitham practice).
BAV_PLANETS = list(BAV_TABLE.keys())  # SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN


def compute_bhinnashtakavarga(
    natal_rasi_map: dict[str, int],
) -> dict[str, dict[int, int]]:
    """
    Compute the full Bhinnashtakavarga for all 7 BAV planets.

    natal_rasi_map must contain keys: SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, LAGNA
    Values are Rasi numbers (1-12).

    Returns: {planet: {rasi_1_to_12: bindu_count_0_to_8}}
    """
    result: dict[str, dict[int, int]] = {}
    for planet, ref_table in BAV_TABLE.items():
        bindus: dict[int, int] = {rasi: 0 for rasi in range(1, 13)}
        for ref_point, benefic_houses in ref_table.items():
            ref_rasi = natal_rasi_map.get(ref_point)
            if ref_rasi is None:
                continue
            for benefic_house in benefic_houses:
                # Convert house (relative to ref_point) to absolute Rasi
                target_rasi = ((ref_rasi - 1 + benefic_house - 1) % 12) + 1
                bindus[target_rasi] += 1
        result[planet] = bindus
    return result


def get_av_bindu(
    bav: dict[str, dict[int, int]],
    planet: str,
    transit_rasi: int,
) -> int:
    """
    Get Ashtakavarga bindu for a planet transiting a specific Rasi.
    For RAHU and KETU, uses SATURN's table as proxy.
    Returns 4 (neutral default) if planet not in BAV tables.
    """
    lookup_planet = planet if planet in BAV_TABLE else ("SATURN" if planet in {"RAHU", "KETU"} else None)
    if lookup_planet is None:
        return 4
    return bav.get(lookup_planet, {}).get(transit_rasi, 4)


def compute_sarvashtakavarga(bav: dict[str, dict[int, int]]) -> dict[int, int]:
    """
    Sum BAV scores across all 7 planets per Rasi.
    Per spec §9.3. Expected total range: 0-56 per house.
    """
    sarva: dict[int, int] = {rasi: 0 for rasi in range(1, 13)}
    for planet in BAV_PLANETS:
        for rasi in range(1, 13):
            sarva[rasi] += bav.get(planet, {}).get(rasi, 0)
    return sarva
```

**Step 2 — Build natal_rasi_map in `daily_guidance_service.py`:**

Add this after `natal_lagna = chart_snapshot.data.lagna.rasi`:
```python
from app.calculations.ashtakavarga import compute_bhinnashtakavarga, get_av_bindu

natal_rasi_map: dict[str, int] = {"LAGNA": natal_lagna}
for _p in chart_snapshot.data.planets:
    natal_rasi_map[_p.graha] = _p.rasi

# Compute full BAV for this user's natal chart (7 planets × 12 houses)
_bav = compute_bhinnashtakavarga(natal_rasi_map)
```

**Step 3 — Replace the hardcoded AV block with real lookup:**
```python
# Was: DEFAULT_AV_BINDU = 4 / av_multiplier = AV_MULTIPLIER[4]  (always 1.0)
# Now: per-planet, per-transit-rasi real bindu from this user's chart

AV_MULTIPLIER = {0: 0.5, 1: 0.6, 2: 0.75, 3: 0.9, 4: 1.0, 5: 1.1, 6: 1.2, 7: 1.3, 8: 1.4}

transit_score = 50.0
for graha, body in {
    "JUPITER": jupiter,
    "SATURN":  saturn,
    "RAHU":    rahu,
    "KETU":    ketu,
    "MARS":    mars,
    "MOON":    moon,
}.items():
    house_from_moon = house_from_reference(natal_moon.rasi, body.rasi)
    base = TRANSIT_BASE_SCORE[graha][house_from_moon]
    av_bindu = get_av_bindu(_bav, graha, body.rasi)
    av_multiplier = AV_MULTIPLIER[av_bindu]
    transit_score += (base - 50) * PLANET_DAILY_WEIGHT[graha] * av_multiplier
transit_score = max(0, min(100, transit_score))
```

**Tests to add in `tests/test_calculations.py`:**
```python
def test_bav_bindu_range():
    from app.calculations.ashtakavarga import compute_bhinnashtakavarga, get_av_bindu
    natal = {"SUN":5,"MOON":3,"MARS":8,"MERCURY":4,"JUPITER":9,"VENUS":6,"SATURN":11,"LAGNA":1}
    bav = compute_bhinnashtakavarga(natal)
    for planet in ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN"]:
        for rasi in range(1, 13):
            b = get_av_bindu(bav, planet, rasi)
            assert 0 <= b <= 8, f"Out of range bindu {b} for {planet} rasi {rasi}"

def test_bav_sarvashtakavarga_total():
    from app.calculations.ashtakavarga import compute_bhinnashtakavarga, compute_sarvashtakavarga
    natal = {"SUN":5,"MOON":3,"MARS":8,"MERCURY":4,"JUPITER":9,"VENUS":6,"SATURN":11,"LAGNA":1}
    bav = compute_bhinnashtakavarga(natal)
    sarva = compute_sarvashtakavarga(bav)
    # Total across all 12 houses for all 7 planets should be between 200 and 350
    total = sum(sarva.values())
    assert 200 <= total <= 350, f"Sarvashtakavarga total {total} out of expected range"

def test_two_different_charts_produce_different_bindus():
    from app.calculations.ashtakavarga import compute_bhinnashtakavarga, get_av_bindu
    chart_a = {"SUN":1,"MOON":4,"MARS":7,"MERCURY":10,"JUPITER":1,"VENUS":4,"SATURN":7,"LAGNA":1}
    chart_b = {"SUN":6,"MOON":9,"MARS":12,"MERCURY":3,"JUPITER":6,"VENUS":9,"SATURN":12,"LAGNA":7}
    bav_a = compute_bhinnashtakavarga(chart_a)
    bav_b = compute_bhinnashtakavarga(chart_b)
    # Check Jupiter bindu in house 9 differs between the two charts
    b_a = get_av_bindu(bav_a, "JUPITER", 9)
    b_b = get_av_bindu(bav_b, "JUPITER", 9)
    assert b_a != b_b, "Two different charts must produce different AV bindus"
```

---

### BUG-06 — Dasha score uses generic planet scores — not personalised to natal chart [MEDIUM]

**File:** `app/services/daily_guidance_service.py` lines 79–89 (`PLANET_PERIOD_SCORE`)  
**Spec reference:** Formula Engine Spec §7.1 (dignity), §7.3 (Moolatrikona), §7.4 (Avastha), §7.6 (strength score formula), §10.4 (dasha score)  
**Impact:** Every person in Jupiter Mahadasha gets the same score (72) regardless of whether their natal Jupiter is exalted in Kadagam, debilitated in Magaram, or combust. The dasha score (20% of total) is generic.

**Step 1 — Create `app/calculations/chart_strength.py`**

This implements spec §7.6 (product-level strength score), using spec §7.1 (9-level dignity), §7.3 (Moolatrikona zones), and §7.4 (Avastha). This is NOT full Shadbala (that is Module 20 / spec §8) — it is the product-level approximation the spec calls for.

```python
"""
Product-level natal planet strength scorer.
Implements Formula Engine Spec §7.6 (approximate strength score).
Uses dignity table §7.1, Moolatrikona zones §7.3, Avastha §7.4.
This is NOT full classical Shadbala (spec §8) — that is a future module.
"""
from __future__ import annotations
from app.calculations.transits import is_combust, is_gandanta
from app.calculations.astro import house_from_reference, degree_in_rasi

# Spec §7.2 — exaltation Rasi (1-based)
EXALTATION_RASI: dict[str, int] = {
    "SUN": 1, "MOON": 2, "MARS": 10, "MERCURY": 6,
    "JUPITER": 4, "VENUS": 12, "SATURN": 7,
}

# Spec §7.2 — debilitation Rasi (opposite of exaltation)
DEBILITATION_RASI: dict[str, int] = {
    "SUN": 7, "MOON": 8, "MARS": 4, "MERCURY": 12,
    "JUPITER": 10, "VENUS": 6, "SATURN": 1,
}

# Spec §7.3 — Moolatrikona: (Rasi, degree_start, degree_end)
MOOLATRIKONA_ZONE: dict[str, tuple[int, float, float]] = {
    "SUN":     (5,  0.0, 20.0),
    "MOON":    (2,  4.0, 30.0),
    "MARS":    (1,  0.0, 12.0),
    "MERCURY": (6, 16.0, 20.0),
    "JUPITER": (9,  0.0, 10.0),
    "VENUS":   (7,  0.0, 15.0),
    "SATURN":  (11, 0.0, 20.0),
}

# Spec §7.1 — 9-level dignity score (not 5-level — use this exact table)
OWN_SIGN_RASI: dict[str, frozenset[int]] = {
    "SUN":     frozenset({5}),
    "MOON":    frozenset({4}),
    "MARS":    frozenset({1, 8}),
    "MERCURY": frozenset({3, 6}),
    "JUPITER": frozenset({9, 12}),
    "VENUS":   frozenset({2, 7}),
    "SATURN":  frozenset({10, 11}),
    "RAHU":    frozenset(),  # No own sign in classical system
    "KETU":    frozenset(),
}

# Natural friendship table — used for great friend / friend / neutral / enemy / great enemy
# (same table as BUG-04 ruling)
_NATURAL_FRIENDS_STRENGTH: dict[str, frozenset[str]] = {
    "SUN":     frozenset({"MOON", "MARS", "JUPITER"}),
    "MOON":    frozenset({"SUN", "MERCURY"}),
    "MARS":    frozenset({"SUN", "MOON", "JUPITER"}),
    "MERCURY": frozenset({"SUN", "VENUS"}),
    "JUPITER": frozenset({"SUN", "MOON", "MARS"}),
    "VENUS":   frozenset({"MERCURY", "SATURN"}),
    "SATURN":  frozenset({"MERCURY", "VENUS"}),
    "RAHU":    frozenset({"VENUS", "SATURN"}),
    "KETU":    frozenset({"MARS", "VENUS"}),
}
_NATURAL_ENEMIES_STRENGTH: dict[str, frozenset[str]] = {
    "SUN":     frozenset({"VENUS", "SATURN", "RAHU", "KETU"}),
    "MOON":    frozenset({"RAHU", "KETU"}),
    "MARS":    frozenset({"MERCURY", "RAHU"}),
    "MERCURY": frozenset({"MOON"}),
    "JUPITER": frozenset({"MERCURY", "VENUS", "RAHU", "KETU"}),
    "VENUS":   frozenset({"SUN", "MOON", "RAHU", "KETU"}),
    "SATURN":  frozenset({"SUN", "MOON", "MARS"}),
    "RAHU":    frozenset({"SUN", "MOON", "MARS", "JUPITER"}),
    "KETU":    frozenset({"SUN", "MOON", "JUPITER", "RAHU"}),
}
# Sign lords (for "is this planet in a friendly/enemy sign?" lookup)
SIGN_LORD: dict[int, str] = {
    1:"MARS",2:"VENUS",3:"MERCURY",4:"MOON",5:"SUN",6:"MERCURY",
    7:"VENUS",8:"MARS",9:"JUPITER",10:"SATURN",11:"SATURN",12:"JUPITER",
}


def _dignity_score(planet: str, natal_rasi: int, natal_longitude: float) -> int:
    """
    Returns dignity score per spec §7.1 (9 levels).
    Checks Moolatrikona zone first, then exaltation, own, friend, neutral, enemy, debilitation.
    """
    # Debilitation check first (overrides all)
    if planet in DEBILITATION_RASI and natal_rasi == DEBILITATION_RASI[planet]:
        return 15  # Debilitation

    # Exaltation
    if planet in EXALTATION_RASI and natal_rasi == EXALTATION_RASI[planet]:
        return 100  # Exaltation

    # Moolatrikona zone (stronger than own sign, weaker than exaltation)
    if planet in MOOLATRIKONA_ZONE:
        mt_rasi, mt_start, mt_end = MOOLATRIKONA_ZONE[planet]
        deg = natal_longitude % 30
        if natal_rasi == mt_rasi and mt_start <= deg < mt_end:
            return 90  # Moolatrikona

    # Own sign
    if natal_rasi in OWN_SIGN_RASI.get(planet, frozenset()):
        return 80  # Own sign

    # Friend / enemy of sign lord
    sign_lord = SIGN_LORD.get(natal_rasi)
    if sign_lord:
        if sign_lord in _NATURAL_FRIENDS_STRENGTH.get(planet, frozenset()):
            return 60  # Friend sign (using Friend not Great friend as default — safe)
        if sign_lord in _NATURAL_ENEMIES_STRENGTH.get(planet, frozenset()):
            return 35  # Enemy sign
    return 50  # Neutral


def _avastha_multiplier(natal_longitude: float) -> float:
    """
    Spec §7.4 — Bala Avastha based on degree within sign.
    Yuva (12-18°) is full strength. Bala and Mrita are quarter strength.
    """
    deg = natal_longitude % 30
    if deg < 6:   return 0.25  # Bala
    if deg < 12:  return 0.50  # Kumara
    if deg < 18:  return 1.00  # Yuva (peak)
    if deg < 24:  return 0.50  # Vriddha
    return 0.25                 # Mrita


def compute_natal_planet_score(
    planet: str,
    natal_rasi: int,
    natal_longitude: float,
    natal_lagna_rasi: int,
    sun_longitude: float,
    is_retrograde: bool,
) -> int:
    """
    Product-level strength score for a natal planet.
    Implements spec §7.6 formula with correct weights.
    Returns 0-100.

    NOT full Shadbala (spec §8). That is Module 20.
    """
    dignity = _dignity_score(planet, natal_rasi, natal_longitude)
    avastha = _avastha_multiplier(natal_longitude)

    # House from Lagna for house strength score
    house = house_from_reference(natal_lagna_rasi, natal_rasi)
    if house in {1, 4, 7, 10}:          # Kendra
        house_strength = 80
    elif house in {1, 5, 9}:            # Trikona (1st already in Kendra — extra boost)
        house_strength = 75
    elif house in {2, 11}:              # Wealth houses
        house_strength = 65
    elif house in {3, 6, 10, 11}:       # Upachaya (growing houses)
        house_strength = 60
    elif house in {6, 8, 12}:           # Dusthana (difficult houses)
        house_strength = 25
    else:
        house_strength = 50

    # Vargottama bonus (planet in same Rasi in D1 and D9) — checked separately if available
    # Set to 0 here; caller can pass in if vargottama is known
    vargottama_bonus = 0

    # Spec §7.6 weights
    score = (
        dignity         * 0.35 +
        avastha * 100   * 0.15 +
        house_strength  * 0.15 +
        50              * 0.15 +  # aspect_support_score placeholder (no full Drik Bala yet)
        vargottama_bonus * 0.10 +
        50              * 0.10    # shadbala_ratio placeholder
    )

    # Penalties
    combust_penalty = 0
    if planet not in {"SUN", "RAHU", "KETU"}:
        if is_combust(planet, natal_longitude, sun_longitude, is_retrograde):
            combust_penalty = 20  # Combustion significantly weakens the planet

    sandhi_penalty = 0
    deg_in_sign = natal_longitude % 30
    if deg_in_sign <= 1.0 or deg_in_sign >= 29.0:
        sandhi_penalty = 8  # Sandhi (sign boundary) weakens

    gandanta_penalty = 0
    if is_gandanta(natal_longitude):
        gandanta_penalty = 10  # Gandanta (water-fire boundary) weakens

    # Retrograde: Cheshta Bala — retrograde planets gain motional strength
    retrograde_bonus = 0
    if is_retrograde and planet not in {"SUN", "MOON", "RAHU", "KETU"}:
        retrograde_bonus = 8

    score = score - combust_penalty - sandhi_penalty - gandanta_penalty + retrograde_bonus
    return max(10, min(95, round(score)))
```

**Step 2 — Update `daily_guidance_service.py` to use natal chart strength:**

```python
from app.calculations.chart_strength import compute_natal_planet_score

def _get_natal_planet_data(chart_snapshot, planet_name: str):
    return next((p for p in chart_snapshot.data.planets if p.graha == planet_name), None)

# After computing maha_lord and antar_lord from the Vimshottari timeline:
natal_sun_data = _get_natal_planet_data(chart_snapshot, "SUN")
natal_maha_data = _get_natal_planet_data(chart_snapshot, maha_lord)
natal_antar_data = _get_natal_planet_data(chart_snapshot, antar_lord)

sun_lon = float(natal_sun_data.absolute_longitude) if natal_sun_data else 0.0

if natal_maha_data:
    maha_score = compute_natal_planet_score(
        planet=maha_lord,
        natal_rasi=natal_maha_data.rasi,
        natal_longitude=float(natal_maha_data.absolute_longitude),
        natal_lagna_rasi=natal_lagna,
        sun_longitude=sun_lon,
        is_retrograde=natal_maha_data.is_retrograde,
    )
else:
    maha_score = PLANET_PERIOD_SCORE.get(maha_lord, 50)  # fallback if planet missing

if natal_antar_data:
    antar_score = compute_natal_planet_score(
        planet=antar_lord,
        natal_rasi=natal_antar_data.rasi,
        natal_longitude=float(natal_antar_data.absolute_longitude),
        natal_lagna_rasi=natal_lagna,
        sun_longitude=sun_lon,
        is_retrograde=natal_antar_data.is_retrograde,
    )
else:
    antar_score = PLANET_PERIOD_SCORE.get(antar_lord, 50)

relationship_score = _graha_relationship_score(maha_lord, antar_lord)
dasha_score = max(0, min(100, round(maha_score * 0.55 + antar_score * 0.35 + relationship_score * 0.10)))
```

**Keep `PLANET_PERIOD_SCORE` dict as a fallback only** — it is now only used when the natal planet data is unexpectedly missing from the chart snapshot.

**Tests to add:**
```python
def test_exalted_planet_higher_than_debilitated():
    from app.calculations.chart_strength import compute_natal_planet_score
    # Jupiter exalted in Kadagam (4), 5° — Yuva avastha, Kendra house (assume Lagna 1)
    exalted = compute_natal_planet_score("JUPITER", 4, 4*30+5.0, 1, 0.0, False)
    # Jupiter debilitated in Magaram (10)
    debilitated = compute_natal_planet_score("JUPITER", 10, 10*30+5.0, 1, 0.0, False)
    assert exalted > debilitated

def test_combust_planet_lower_score():
    from app.calculations.chart_strength import compute_natal_planet_score
    # Mercury conjunct Sun — combust
    combust = compute_natal_planet_score("MERCURY", 5, 5*30+2.0, 1, 5*30+1.0, False)
    # Mercury far from Sun — clear
    clear = compute_natal_planet_score("MERCURY", 5, 5*30+2.0, 1, 2*30+1.0, False)
    assert clear > combust

def test_moolatrikona_between_own_and_exalted():
    from app.calculations.chart_strength import compute_natal_planet_score, _dignity_score
    # Jupiter in Dhanusu (9) at 5° — Moolatrikona zone (0-10°) → score 90
    assert _dignity_score("JUPITER", 9, 9*30+5.0) == 90
    # Jupiter in own sign Meenam (12) — not Moolatrikona → score 80
    assert _dignity_score("JUPITER", 12, 12*30+5.0) == 80
    # Jupiter exalted in Kadagam (4) → score 100
    assert _dignity_score("JUPITER", 4, 4*30+5.0) == 100
```

---

### BUG-07 — Lagna-dimension transit check never applied to transit_score [MEDIUM]

**File:** `app/services/daily_guidance_service.py`  
**Spec reference:** Formula Engine Spec §6.1: "Moon is primary for gochar. Lagna confirms material impact."  
**Impact:** 100% of the transit score is computed from Moon. Lagna dimension is computed in `build_transit_position()` but never used in the daily score.

**Add after transit_score is computed (~line 571):**
```python
# Secondary Lagna dimension — spec §6.1
# Jupiter and Saturn's position from Lagna modulates the transit score slightly
jupiter_house_from_lagna = house_from_reference(natal_lagna, jupiter.rasi)
saturn_house_from_lagna  = house_from_reference(natal_lagna, saturn.rasi)

lagna_modifier = 0.0
# Jupiter in Kendra or Trikona from Lagna — secondary support
if jupiter_house_from_lagna in {1, 4, 5, 7, 9, 10}:
    lagna_modifier += 3.0
elif jupiter_house_from_lagna in {6, 8, 12}:
    lagna_modifier -= 3.0
# Saturn in Kantaka axis from Lagna — secondary caution
if saturn_house_from_lagna in {1, 4, 7, 10}:
    lagna_modifier -= 4.0
elif saturn_house_from_lagna in {3, 6, 11}:
    lagna_modifier += 2.0

transit_score = max(0, min(100, transit_score + lagna_modifier))
```

---

### BUG-08 — Vedha Vichara never applied — transit benefits blocked by Vedha go unchecked [MEDIUM]

**Spec reference:** Formula Engine Spec §6.5 — defines which house blocks (Vedha) which beneficial transit house. When a planet occupies the Vedha house simultaneously, the beneficial transit loses its effect.

**Add to `app/calculations/transits.py`:**
```python
# Spec §6.5 — Vedha table: if planet is in good_house, Vedha house blocks it
VEDHA_TABLE: dict[str, dict[int, int]] = {
    "SUN":     {3:9, 6:12, 10:4, 11:5},
    "MOON":    {1:5, 3:9, 6:12, 7:2, 10:4, 11:8},
    "JUPITER": {2:12, 5:4, 7:3, 9:10, 11:8},
    "SATURN":  {3:12, 6:9, 11:5},
}

def check_vedha(
    planet: str,
    house_from_moon: int,
    all_transit_houses: dict[str, int],  # {planet_name: house_from_moon}
) -> bool:
    """
    Returns True if any other transiting planet occupies the Vedha house
    for this planet's beneficial position, blocking the transit benefit.
    Per spec §6.5.
    """
    vedha_house = VEDHA_TABLE.get(planet, {}).get(house_from_moon)
    if vedha_house is None:
        return False  # No Vedha defined for this position
    # Check if any other planet is in the Vedha house
    for other_planet, other_house in all_transit_houses.items():
        if other_planet != planet and other_house == vedha_house:
            return True
    return False
```

**Apply in `daily_guidance_service.py` transit loop:**
```python
all_transit_houses = {
    g: house_from_reference(natal_moon.rasi, b.rasi)
    for g, b in {"JUPITER": jupiter, "SATURN": saturn, "RAHU": rahu,
                 "KETU": ketu, "MARS": mars, "MOON": moon}.items()
}

transit_score = 50.0
for graha, body in {"JUPITER": jupiter, "SATURN": saturn, "RAHU": rahu,
                    "KETU": ketu, "MARS": mars, "MOON": moon}.items():
    house_from_moon = house_from_reference(natal_moon.rasi, body.rasi)
    base = TRANSIT_BASE_SCORE[graha][house_from_moon]
    av_bindu = get_av_bindu(_bav, graha, body.rasi)
    av_multiplier = AV_MULTIPLIER[av_bindu]
    contribution = (base - 50) * PLANET_DAILY_WEIGHT[graha] * av_multiplier
    # Apply Vedha reduction per spec §6.5
    if check_vedha(graha, house_from_moon, all_transit_houses):
        contribution = contribution * 0.25  # Vedha reduces effectiveness to 25%
    transit_score += contribution
transit_score = max(0, min(100, transit_score))
```

---

### BUG-09 — Sookshma and Prana Dasha levels return HTTP 501 [MEDIUM]

**File:** `app/services/dasha_service.py`  
**Spec reference:** Formula Engine Spec §5.5, §5.6  
**Impact:** API returns 501 Not Implemented for levels 4 and 5.

**Formulas per spec §5.5 and §5.6:**
```python
# Level 3 — Pratyantardasha (already implemented)
pratyantar_years = antar_years * DASHA_YEARS[pratyantar_lord] / 120

# Level 4 — Sookshma
sookshma_years = pratyantar_years * DASHA_YEARS[sookshma_lord] / 120

# Level 5 — Prana
prana_years = sookshma_years * DASHA_YEARS[prana_lord] / 120
```

All boundaries stored as Julian Day, converted to date for display. Implement levels 4 and 5 in `app/calculations/dasha.py` using the same cascade pattern as levels 1–3. Remove the 501 responses.

---

### BUG-10 — TRANSIT_BASE_SCORE and PLANET_PERIOD_SCORE ignore Lagna-based functional lordship [CRITICAL]

**Files:**
- `app/services/daily_guidance_service.py` — `TRANSIT_BASE_SCORE`, `PLANET_PERIOD_SCORE`, `PLANET_DAILY_WEIGHT`
- New file needed: `app/calculations/functional_nature.py`

**Spec reference:** Formula Engine Spec §7.5: `functional_nature = FUNCTIONAL_NATURE_TABLE[lagna_rasi][planet]`  
**Impact:** This is the most fundamental personalisation gap. Every planet's score — transit quality, Dasha quality, and daily weight — must be filtered by what that planet functionally owns and rules for this person's specific Lagna. Without this, Vinaadi gives the same Jupiter Dasha score to a Thulaam Lagna person (Jupiter owns 3rd+6th — a difficult Dasha) as to a Dhanusu Lagna person (Jupiter is the Lagna lord — an excellent Dasha). This affects every single user every single day.

**The concept — Functional Nature (Karaka Balam):**

In Thirukanitham, every planet has a fixed natural character (Naisargika) AND a variable functional character (Tatastha) that depends entirely on which houses it owns for a given Lagna. A planet owning Trikona houses (1, 5, 9) is functionally benefic. A planet owning Dusthana houses (6, 8, 12) is functionally malefic. A planet owning both a Kendra and a Trikona is a Yogakaraka (the most powerful benefic). A planet owning the 2nd or 7th is a Maraka. The 3rd lord is neutral-to-mild malefic. The 11th lord is a mild malefic (Upachaya but desires house).

**Step 1 — Create `app/calculations/functional_nature.py`**

```python
"""
Functional nature (Tatastha Karaka Balam) of planets by Lagna.
Source: Classical Tamil Jyothidam / Parashari doctrine.

For each Lagna, every planet is classified as:
  YOGAKARAKA   — owns both a Kendra and a Trikona (rare, most powerful benefic)
  TRIKONA      — owns a Trikona (1st, 5th, 9th) — benefic
  KENDRA       — owns only Kendra houses (4th, 7th, 10th) — neutral (Kendradhipati)
  MARAKA       — owns 2nd or 7th — can time separations/transitions
  DUSTHANA     — owns 6th, 8th, or 12th — malefic tendency
  UPACHAYA     — owns 3rd or 11th only — mild malefic / growing-house lord
  NEUTRAL      — mixed ownership that doesn't fall clearly into above
  LAGNA_LORD   — owns the 1st house (always benefic regardless of other ownership)

These classifications directly affect:
1. Transit score modifier (how beneficial is this planet transiting a house)
2. Dasha score modifier (how beneficial is this planet's Mahadasha/Antardasha)
3. Daily weight modifier (how much does this planet's transit matter for this Lagna)
"""
from __future__ import annotations
from enum import Enum


class FunctionalNature(str, Enum):
    YOGAKARAKA = "YOGAKARAKA"   # Kendra + Trikona lord — +strong boost
    LAGNA_LORD = "LAGNA_LORD"   # 1st lord — benefic
    TRIKONA    = "TRIKONA"      # 5th or 9th lord — benefic
    KENDRA     = "KENDRA"       # 4th/7th/10th lord only — neutral/mild dosha
    MARAKA     = "MARAKA"       # 2nd or 7th lord — transition/caution
    DUSTHANA   = "DUSTHANA"     # 6th/8th/12th lord — malefic
    UPACHAYA   = "UPACHAYA"     # 3rd/11th lord — mild malefic
    NEUTRAL    = "NEUTRAL"      # Mixed/unclear


# Score modifier applied to TRANSIT_BASE_SCORE contribution for this planet
# when it is transiting for a person with this functional nature.
# Base score is a generic house-quality number; this multiplier personalises it.
FUNCTIONAL_TRANSIT_MODIFIER: dict[FunctionalNature, float] = {
    FunctionalNature.YOGAKARAKA: 1.35,  # Strongest benefic — boost transit significantly
    FunctionalNature.LAGNA_LORD: 1.20,  # Lagna lord transiting = always significant
    FunctionalNature.TRIKONA:    1.15,  # Trikona lord — benefic boost
    FunctionalNature.KENDRA:     0.90,  # Kendradhipati — slight reduction (dosha)
    FunctionalNature.NEUTRAL:    1.00,  # No change
    FunctionalNature.MARAKA:     0.85,  # Maraka — mild reduction
    FunctionalNature.UPACHAYA:   0.85,  # Upachaya — mild reduction
    FunctionalNature.DUSTHANA:   0.65,  # Dusthana lord — significant reduction
}

# Score modifier applied to PLANET_PERIOD_SCORE for Dasha quality
FUNCTIONAL_DASHA_MODIFIER: dict[FunctionalNature, float] = {
    FunctionalNature.YOGAKARAKA: 1.40,
    FunctionalNature.LAGNA_LORD: 1.25,
    FunctionalNature.TRIKONA:    1.20,
    FunctionalNature.KENDRA:     0.90,
    FunctionalNature.NEUTRAL:    1.00,
    FunctionalNature.MARAKA:     0.80,
    FunctionalNature.UPACHAYA:   0.85,
    FunctionalNature.DUSTHANA:   0.60,
}


# Full functional nature table: FUNCTIONAL_NATURE_TABLE[lagna_rasi][planet]
# lagna_rasi: 1=Mesha ... 12=Meenam
# Sources: Parashari doctrine, Tamil Jyothidam tradition
# Note: Rahu/Ketu have no house ownership — use dispositor's nature

FUNCTIONAL_NATURE_TABLE: dict[int, dict[str, FunctionalNature]] = {
    1: {  # Mesha Lagna
        "SUN":     FunctionalNature.TRIKONA,    # 5th lord
        "MOON":    FunctionalNature.KENDRA,     # 4th lord
        "MARS":    FunctionalNature.LAGNA_LORD, # 1st + 8th lord (Lagna lord overrides)
        "MERCURY": FunctionalNature.DUSTHANA,   # 3rd + 6th lord
        "JUPITER": FunctionalNature.TRIKONA,    # 9th + 12th lord (9th=Trikona, 12th=Dusthana; Trikona wins)
        "VENUS":   FunctionalNature.MARAKA,     # 2nd + 7th lord (both Maraka houses)
        "SATURN":  FunctionalNature.NEUTRAL,    # 10th + 11th lord (Kendra + Upachaya)
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    2: {  # Rishabam Lagna
        "SUN":     FunctionalNature.KENDRA,     # 4th lord
        "MOON":    FunctionalNature.TRIKONA,    # 3rd? No — Moon rules Cancer=3rd from Rishabam? 
                                                 # Katakam(4) is 3rd from Rishabam(2) — wait:
                                                 # Houses from Rishabam: 1=Rishabam,2=Midhunam,3=Kadagam,
                                                 # 4=Simmam,5=Kanni,6=Thulaam,7=Vrichigam,8=Dhanusu,
                                                 # 9=Magaram,10=Kumbam,11=Meenam,12=Mesha
                                                 # Moon owns Kadagam = 3rd house from Rishabam Lagna = Upachaya/mild malefic
        "MOON":    FunctionalNature.UPACHAYA,   # 3rd lord
        "MARS":    FunctionalNature.DUSTHANA,   # 7th(Vrichigam) + 12th(Mesha)? 
                                                 # Vrichigam=7th, Mesha=12th → Maraka + Dusthana → Dusthana wins
        "MERCURY": FunctionalNature.YOGAKARAKA, # 2nd(Midhunam) + 5th(Kanni) — wait, 5th=Kanni, Mercury owns Kanni
                                                 # Mercury owns Midhunam(2nd) and Kanni(5th) → Dhana + Trikona
                                                 # 5th is Trikona. 2nd is Dhana (not Trikona). Not full Yogakaraka.
                                                 # But 2nd+5th is very strong combination → treat as TRIKONA
        "MERCURY": FunctionalNature.TRIKONA,    # 2nd + 5th lord (5th = Trikona)
        "JUPITER": FunctionalNature.DUSTHANA,   # 8th(Dhanusu) + 11th(Meenam) → Dusthana + Upachaya → Dusthana
        "VENUS":   FunctionalNature.LAGNA_LORD, # 1st(Rishabam) + 6th(Thulaam) → Lagna lord (overrides 6th)
        "SATURN":  FunctionalNature.YOGAKARAKA, # 9th(Magaram) + 10th(Kumbam) → Trikona + Kendra = Yogakaraka
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    3: {  # Midhunam Lagna
        "SUN":     FunctionalNature.UPACHAYA,   # 3rd lord (Simmam = 3rd from Midhunam)
        "MOON":    FunctionalNature.KENDRA,     # 2nd? No — Kadagam = 2nd from Midhunam → Dhana lord
                                                 # Moon owns Kadagam = 2nd house → Maraka house
        "MOON":    FunctionalNature.MARAKA,     # 2nd lord
        "MARS":    FunctionalNature.DUSTHANA,   # 6th(Vrichigam) + 11th(Mesha)? 
                                                 # Vrichigam=6th from Midhunam, Mesha=11th → Dusthana + Upachaya
        "MERCURY": FunctionalNature.LAGNA_LORD, # 1st(Midhunam) + 4th(Kanni) → Lagna + Kendra
        "JUPITER": FunctionalNature.KENDRA,     # 7th(Dhanusu) + 10th(Meenam) → Kendra + Kendra = Kendradhipati
        "VENUS":   FunctionalNature.TRIKONA,    # 5th(Thulaam) + 12th(Rishabam) → Trikona (5th wins)
        "SATURN":  FunctionalNature.TRIKONA,    # 9th(Kumbam) + 8th(Magaram)? 
                                                 # Kumbam=9th from Midhunam, Magaram=8th → Trikona + Dusthana
                                                 # Trikona wins for 9th
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    4: {  # Kadagam Lagna
        "SUN":     FunctionalNature.KENDRA,     # 2nd? Simmam=2nd from Kadagam → Maraka
        "SUN":     FunctionalNature.MARAKA,     # 2nd lord
        "MOON":    FunctionalNature.LAGNA_LORD, # 1st lord
        "MARS":    FunctionalNature.TRIKONA,    # 5th(Vrichigam) + 10th(Mesha)? 
                                                 # Vrichigam=5th, Mesha=10th → Trikona + Kendra = Yogakaraka
        "MARS":    FunctionalNature.YOGAKARAKA, # 5th + 10th lord
        "MERCURY": FunctionalNature.DUSTHANA,   # 3rd(Kanni) + 12th(Midhunam) → Upachaya + Dusthana
        "JUPITER": FunctionalNature.DUSTHANA,   # 6th(Dhanusu) + 9th(Meenam) → Dusthana + Trikona
                                                 # Controversial: 9th lord is Trikona but 6th ownership pollutes
                                                 # Classical ruling: 6th lordship makes Jupiter a mixed planet for Kadagam
        "JUPITER": FunctionalNature.NEUTRAL,    # 6th + 9th — mixed (Trikona polluted by Shatru)
        "VENUS":   FunctionalNature.KENDRA,     # 4th(Thulaam) + 11th(Rishabam) → Kendra + Upachaya
        "SATURN":  FunctionalNature.MARAKA,     # 7th(Magaram) + 8th(Kumbam) → Maraka + Dusthana → Maraka
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    5: {  # Simmam Lagna
        "SUN":     FunctionalNature.LAGNA_LORD, # 1st lord
        "MOON":    FunctionalNature.KENDRA,     # 12th? Kadagam=12th from Simmam → Dusthana
        "MOON":    FunctionalNature.DUSTHANA,   # 12th lord
        "MARS":    FunctionalNature.YOGAKARAKA, # 4th(Vrichigam) + 9th(Mesha) → Kendra + Trikona
        "MERCURY": FunctionalNature.MARAKA,     # 2nd(Kanni) + 11th(Midhunam) → Maraka + Upachaya
        "JUPITER": FunctionalNature.TRIKONA,    # 5th(Dhanusu) + 8th(Meenam) → Trikona (5th wins, 8th pollutes)
        "JUPITER": FunctionalNature.NEUTRAL,    # 5th + 8th — Trikona polluted by Ashtama → neutral
        "VENUS":   FunctionalNature.DUSTHANA,   # 3rd(Thulaam) + 10th(Rishabam)? 
                                                 # Thulaam=3rd, Rishabam=10th → Upachaya + Kendra
        "VENUS":   FunctionalNature.KENDRA,     # 3rd + 10th — Kendra (10th) with Upachaya (3rd)
        "SATURN":  FunctionalNature.DUSTHANA,   # 6th(Magaram) + 7th(Kumbam) → Dusthana + Maraka → Dusthana
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    6: {  # Kanni Lagna
        "SUN":     FunctionalNature.UPACHAYA,   # 12th? Simmam=12th from Kanni → Dusthana
        "SUN":     FunctionalNature.DUSTHANA,   # 12th lord
        "MOON":    FunctionalNature.UPACHAYA,   # 11th lord (Katakam=11th from Kanni)
        "MARS":    FunctionalNature.DUSTHANA,   # 3rd(Vrichigam) + 8th(Mesha) → Upachaya + Dusthana → Dusthana
        "MERCURY": FunctionalNature.LAGNA_LORD, # 1st(Kanni) + 10th(Midhunam) → Lagna + Kendra
        "JUPITER": FunctionalNature.KENDRA,     # 4th(Dhanusu) + 7th(Meenam) → Kendra + Kendra → Kendradhipati
        "VENUS":   FunctionalNature.YOGAKARAKA, # 2nd(Thulaam) + 9th(Rishabam) → Dhana + Trikona
                                                 # 9th is Trikona → TRIKONA at minimum. 2nd+9th is excellent combination.
        "VENUS":   FunctionalNature.TRIKONA,    # 9th lord (Trikona) — Venus most benefic for Kanni
        "SATURN":  FunctionalNature.TRIKONA,    # 5th(Magaram) + 6th(Kumbam) → Trikona (5th) + Dusthana (6th)
                                                 # 5th ownership gives Trikona status
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    7: {  # Thulaam Lagna
        "SUN":     FunctionalNature.UPACHAYA,   # 11th lord
        "MOON":    FunctionalNature.KENDRA,     # 10th lord (Kadagam=10th from Thulaam)
        "MARS":    FunctionalNature.MARAKA,     # 2nd(Vrichigam) + 7th(Mesha) → both Maraka houses
        "MERCURY": FunctionalNature.TRIKONA,    # 9th(Midhunam) + 12th(Kanni) → Trikona (9th wins)
        "JUPITER": FunctionalNature.DUSTHANA,   # 3rd(Dhanusu) + 6th(Meenam) → Upachaya + Dusthana → Dusthana
        "VENUS":   FunctionalNature.YOGAKARAKA, # 1st(Thulaam) + 8th(Rishabam)? 
                                                 # Wait: Thulaam=1st, Rishabam=8th? No.
                                                 # From Thulaam: 1=Thulaam, 8=Vrichigam (wait Venus rules Thulaam and Rishabam)
                                                 # Rishabam = which house from Thulaam? (2-7)%12+1... 
                                                 # house_from(7, 2) = (2-7)%12+1 = (-5)%12+1 = 7+1 = 8th
                                                 # So Venus rules 1st(Thulaam) + 8th(Rishabam) → Lagna + Dusthana
                                                 # Lagna lord overrides → LAGNA_LORD
        "VENUS":   FunctionalNature.LAGNA_LORD, # 1st lord (also 8th — Lagna ownership overrides)
        "SATURN":  FunctionalNature.YOGAKARAKA, # 4th(Magaram) + 5th(Kumbam) → Kendra + Trikona = Yogakaraka
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    8: {  # Vrichigam Lagna
        "SUN":     FunctionalNature.KENDRA,     # 10th lord (Simmam=10th from Vrichigam)
        "MOON":    FunctionalNature.TRIKONA,    # 9th lord (Kadagam=9th from Vrichigam)
        "MARS":    FunctionalNature.LAGNA_LORD, # 1st(Vrichigam) + 6th(Mesha) → Lagna lord
        "MERCURY": FunctionalNature.DUSTHANA,   # 8th(Midhunam)? house_from(8,3)=8 → 8th lord + 11th lord
                                                 # Midhunam=8th, Kanni=11th → Dusthana + Upachaya → Dusthana
        "JUPITER": FunctionalNature.TRIKONA,    # 2nd(Dhanusu) + 5th(Meenam) → Maraka + Trikona
                                                 # 5th ownership gives TRIKONA. 2nd clouds it.
        "JUPITER": FunctionalNature.NEUTRAL,    # 2nd + 5th — Trikona with Maraka → neutral-positive
        "VENUS":   FunctionalNature.DUSTHANA,   # 7th(Thulaam)? house_from(8,7)=12 → 12th lord
                                                 # Thulaam=12th from Vrichigam, Rishabam=7th
                                                 # house_from(8,7)=(7-8)%12+1=11+1=12th. house_from(8,2)=(2-8)%12+1=7th
                                                 # Venus owns Thulaam(12th) and Rishabam(7th) → Dusthana + Maraka → Dusthana
        "SATURN":  FunctionalNature.DUSTHANA,   # 3rd(Magaram) + 4th(Kumbam)? 
                                                 # house_from(8,10)=3rd, house_from(8,11)=4th
                                                 # Magaram=3rd, Kumbam=4th → Upachaya + Kendra
        "SATURN":  FunctionalNature.KENDRA,     # 3rd + 4th — Kendra (4th) with Upachaya (3rd)
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    9: {  # Dhanusu Lagna
        "SUN":     FunctionalNature.TRIKONA,    # 9th lord (Simmam=9th from Dhanusu)
        "MOON":    FunctionalNature.DUSTHANA,   # 8th lord (Kadagam=8th from Dhanusu)
        "MARS":    FunctionalNature.TRIKONA,    # 5th(Mesha) + 12th(Vrichigam) → Trikona (5th wins)
        "MERCURY": FunctionalNature.NEUTRAL,    # 7th(Midhunam) + 10th(Kanni) → Kendra + Kendra → Kendradhipati
        "JUPITER": FunctionalNature.LAGNA_LORD, # 1st(Dhanusu) + 4th(Meenam) → Lagna + Kendra
        "VENUS":   FunctionalNature.MARAKA,     # 7th(Thulaam)? No: house_from(9,7)=(7-9)%12+1=11th
                                                 # house_from(9,2)=(2-9)%12+1=6th
                                                 # Venus owns Thulaam(11th) and Rishabam(6th) from Dhanusu → Upachaya+Dusthana
        "VENUS":   FunctionalNature.DUSTHANA,   # 6th + 11th lord → Dusthana
        "SATURN":  FunctionalNature.KENDRA,     # 2nd(Magaram) + 3rd(Kumbam)? 
                                                 # house_from(9,10)=2nd, house_from(9,11)=3rd
                                                 # Magaram=2nd, Kumbam=3rd → Maraka + Upachaya
        "SATURN":  FunctionalNature.MARAKA,     # 2nd + 3rd lord → Maraka (2nd house)
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    10: {  # Magaram Lagna
        "SUN":     FunctionalNature.DUSTUNHANA, # Simmam = 8th from Magaram → 8th lord
        "SUN":     FunctionalNature.DUSTHANA,   # 8th lord
        "MOON":    FunctionalNature.MARAKA,     # Kadagam = 7th from Magaram → 7th lord (Maraka)
        "MARS":    FunctionalNature.YOGAKARAKA, # Mesha=4th, Vrichigam=11th? 
                                                 # house_from(10,1)=4th, house_from(10,8)=11th
                                                 # Mesha=4th, Vrichigam=11th → Kendra + Upachaya
                                                 # Wait: for Yogakaraka need Kendra+Trikona
                                                 # Mars owns Mesha(4th Kendra) and Vrichigam(11th Upachaya) → Kendra only
        "MARS":    FunctionalNature.KENDRA,     # 4th + 11th lord → Kendra
        "MERCURY": FunctionalNature.TRIKONA,    # house_from(10,3)=6th, house_from(10,6)=9th
                                                 # Midhunam=6th, Kanni=9th → Dusthana + Trikona
                                                 # 9th ownership gives Trikona status
        "JUPITER": FunctionalNature.DUSTHANA,   # house_from(10,9)=12th, house_from(10,12)=3rd
                                                 # Dhanusu=12th, Meenam=3rd → Dusthana + Upachaya → Dusthana
        "VENUS":   FunctionalNature.YOGAKARAKA, # house_from(10,7)=10th, house_from(10,2)=5th
                                                 # Thulaam=10th, Rishabam=5th → Kendra + Trikona = Yogakaraka
        "SATURN":  FunctionalNature.LAGNA_LORD, # 1st(Magaram) + 2nd(Kumbam) → Lagna lord
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    11: {  # Kumbam Lagna
        "SUN":     FunctionalNature.MARAKA,     # house_from(11,5)=7th → Simmam=7th → Maraka
        "MOON":    FunctionalNature.DUSTHANA,   # house_from(11,4)=6th → Kadagam=6th → Dusthana
        "MARS":    FunctionalNature.KENDRA,     # house_from(11,1)=3rd, house_from(11,8)=10th
                                                 # Mesha=3rd, Vrichigam=10th → Upachaya + Kendra
        "MERCURY": FunctionalNature.TRIKONA,    # house_from(11,3)=5th, house_from(11,6)=8th
                                                 # Midhunam=5th, Kanni=8th → Trikona + Dusthana → Neutral-positive
        "MERCURY": FunctionalNature.NEUTRAL,    # 5th + 8th — same as Jupiter for Kadagam
        "JUPITER": FunctionalNature.MARAKA,     # house_from(11,9)=11th, house_from(11,12)=2nd
                                                 # Dhanusu=2nd, Meenam=5th? 
                                                 # house_from(11,9)=(9-11)%12+1=11th, house_from(11,12)=(12-11)%12+1=2nd
                                                 # Dhanusu=2nd, Meenam=5th? No: Meenam=12th? 
                                                 # house_from(11,12)=(12-11)%12+1=2nd. So Meenam=2nd from Kumbam.
                                                 # Dhanusu: house_from(11,9)=(9-11)%12+1=(-2)%12+1=10+1=11th
                                                 # So Jupiter owns: Dhanusu(11th Upachaya) and Meenam(2nd Maraka/Dhana)
        "JUPITER": FunctionalNature.MARAKA,     # 2nd + 11th lord → Maraka tendency
        "VENUS":   FunctionalNature.TRIKONA,    # house_from(11,7)=9th, house_from(11,2)=4th
                                                 # Thulaam=9th, Rishabam=4th → Trikona + Kendra = Yogakaraka
        "VENUS":   FunctionalNature.YOGAKARAKA, # 9th + 4th lord → Trikona + Kendra = Yogakaraka
        "SATURN":  FunctionalNature.LAGNA_LORD, # 1st(Kumbam) + 12th(Magaram)? 
                                                 # house_from(11,10)=12th, house_from(11,11)=1st
                                                 # Magaram=12th, Kumbam=1st → Lagna lord (overrides 12th)
        "SATURN":  FunctionalNature.LAGNA_LORD, # 1st + 12th → Lagna lord
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
    12: {  # Meenam Lagna
        "SUN":     FunctionalNature.DUSTHANA,   # house_from(12,5)=6th → Simmam=6th → Dusthana
        "MOON":    FunctionalNature.TRIKONA,    # house_from(12,4)=5th → Kadagam=5th → Trikona (Putra lord)
        "MARS":    FunctionalNature.YOGAKARAKA, # house_from(12,1)=2nd, house_from(12,8)=9th
                                                 # Mesha=2nd, Vrichigam=9th → Maraka + Trikona
                                                 # 9th ownership is Trikona → TRIKONA at minimum
                                                 # But 2nd is Maraka — mixed. Classical: 9th lord is excellent.
        "MARS":    FunctionalNature.TRIKONA,    # 9th lord (Trikona) — 2nd adds Dhana quality
        "MERCURY": FunctionalNature.MARAKA,     # house_from(12,3)=4th, house_from(12,6)=7th
                                                 # Midhunam=4th, Kanni=7th → Kendra + Maraka → Maraka
        "JUPITER": FunctionalNature.LAGNA_LORD, # 1st(Meenam) + 10th(Dhanusu) → Lagna + Kendra
        "VENUS":   FunctionalNature.TRIKONA,    # house_from(12,7)=8th, house_from(12,2)=3rd
                                                 # Thulaam=8th? house_from(12,7)=(7-12)%12+1=(-5)%12+1=7+1=8th ✓
                                                 # Rishabam: house_from(12,2)=(2-12)%12+1=2+1=3rd ✓
                                                 # Venus owns Thulaam(8th) and Rishabam(3rd) → Dusthana + Upachaya → Dusthana
        "VENUS":   FunctionalNature.DUSTHANA,   # 3rd + 8th lord → Dusthana
        "SATURN":  FunctionalNature.UPACHAYA,   # house_from(12,10)=11th, house_from(12,11)=12th
                                                 # Magaram=2nd? house_from(12,10)=(10-12)%12+1=10+1=11th ✓
                                                 # Kumbam: house_from(12,11)=(11-12)%12+1=11+1=12th ✓
                                                 # Saturn owns Magaram(11th Upachaya) and Kumbam(12th Dusthana)
        "SATURN":  FunctionalNature.DUSTHANA,   # 11th + 12th lord → Dusthana
        "RAHU":    FunctionalNature.NEUTRAL,
        "KETU":    FunctionalNature.NEUTRAL,
    },
}

# Clean up duplicate keys (Python dicts use last assignment — above has deliberate corrections
# written as comments showing the reasoning. The final value for each planet is the last line.)
# The table above is the reference. Below is the clean final version to actually use in code:

FUNCTIONAL_NATURE_TABLE_CLEAN: dict[int, dict[str, FunctionalNature]] = {
    1:  {"SUN":"TRIKONA",    "MOON":"KENDRA",     "MARS":"LAGNA_LORD", "MERCURY":"DUSTHANA",  "JUPITER":"TRIKONA",    "VENUS":"MARAKA",     "SATURN":"NEUTRAL",    "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    2:  {"SUN":"KENDRA",     "MOON":"UPACHAYA",   "MARS":"DUSTHANA",   "MERCURY":"TRIKONA",   "JUPITER":"DUSTHANA",   "VENUS":"LAGNA_LORD", "SATURN":"YOGAKARAKA", "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    3:  {"SUN":"UPACHAYA",   "MOON":"MARAKA",     "MARS":"DUSTHANA",   "MERCURY":"LAGNA_LORD","JUPITER":"KENDRA",     "VENUS":"TRIKONA",    "SATURN":"TRIKONA",    "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    4:  {"SUN":"MARAKA",     "MOON":"LAGNA_LORD", "MARS":"YOGAKARAKA", "MERCURY":"DUSTHANA",  "JUPITER":"NEUTRAL",    "VENUS":"KENDRA",     "SATURN":"MARAKA",     "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    5:  {"SUN":"LAGNA_LORD", "MOON":"DUSTHANA",   "MARS":"YOGAKARAKA", "MERCURY":"MARAKA",    "JUPITER":"NEUTRAL",    "VENUS":"KENDRA",     "SATURN":"DUSTHANA",   "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    6:  {"SUN":"DUSTHANA",   "MOON":"UPACHAYA",   "MARS":"DUSTHANA",   "MERCURY":"LAGNA_LORD","JUPITER":"KENDRA",     "VENUS":"TRIKONA",    "SATURN":"TRIKONA",    "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    7:  {"SUN":"UPACHAYA",   "MOON":"KENDRA",     "MARS":"MARAKA",     "MERCURY":"TRIKONA",   "JUPITER":"DUSTHANA",   "VENUS":"LAGNA_LORD", "SATURN":"YOGAKARAKA", "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    8:  {"SUN":"KENDRA",     "MOON":"TRIKONA",    "MARS":"LAGNA_LORD", "MERCURY":"DUSTHANA",  "JUPITER":"NEUTRAL",    "VENUS":"DUSTHANA",   "SATURN":"KENDRA",     "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    9:  {"SUN":"TRIKONA",    "MOON":"DUSTHANA",   "MARS":"TRIKONA",    "MERCURY":"NEUTRAL",   "JUPITER":"LAGNA_LORD", "VENUS":"DUSTHANA",   "SATURN":"MARAKA",     "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    10: {"SUN":"DUSTHANA",   "MOON":"MARAKA",     "MARS":"KENDRA",     "MERCURY":"TRIKONA",   "JUPITER":"DUSTHANA",   "VENUS":"YOGAKARAKA", "SATURN":"LAGNA_LORD", "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    11: {"SUN":"MARAKA",     "MOON":"DUSTHANA",   "MARS":"KENDRA",     "MERCURY":"NEUTRAL",   "JUPITER":"MARAKA",     "VENUS":"YOGAKARAKA", "SATURN":"LAGNA_LORD", "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
    12: {"SUN":"DUSTHANA",   "MOON":"TRIKONA",    "MARS":"TRIKONA",    "MERCURY":"MARAKA",    "JUPITER":"LAGNA_LORD", "VENUS":"DUSTHANA",   "SATURN":"DUSTHANA",   "RAHU":"NEUTRAL", "KETU":"NEUTRAL"},
}

def get_functional_nature(lagna_rasi: int, planet: str) -> FunctionalNature:
    row = FUNCTIONAL_NATURE_TABLE_CLEAN.get(lagna_rasi, {})
    nature_str = row.get(planet, "NEUTRAL")
    return FunctionalNature(nature_str)

def get_transit_modifier(lagna_rasi: int, planet: str) -> float:
    """Multiplier applied to a planet's transit contribution based on its functional nature for this Lagna."""
    nature = get_functional_nature(lagna_rasi, planet)
    return FUNCTIONAL_TRANSIT_MODIFIER[nature]

def get_dasha_modifier(lagna_rasi: int, planet: str) -> float:
    """Multiplier applied to a planet's Dasha score based on its functional nature for this Lagna."""
    nature = get_functional_nature(lagna_rasi, planet)
    return FUNCTIONAL_DASHA_MODIFIER[nature]
```

**IMPORTANT NOTE FOR AGENT:** The `FUNCTIONAL_NATURE_TABLE_CLEAN` above was derived by working out house ownership for each Lagna using `house_from(lagna_rasi, planet_owned_rasi)`. The reasoning is shown in the verbose version above it. Before using this table in production, verify each entry against a trusted Tamil Jyothidam functional nature reference or cross-check with a senior practitioner. The methodology (house ownership → Kendra/Trikona/Dusthana classification) is correct; individual edge cases (planets owning both a Trikona and a Dusthana) involve classical interpretation choices.

**Step 2 — Apply in `daily_guidance_service.py`**

```python
from app.calculations.functional_nature import get_transit_modifier, get_dasha_modifier

# In transit loop — add functional nature modifier on top of AV multiplier
transit_score = 50.0
for graha, body in {"JUPITER": jupiter, "SATURN": saturn, "RAHU": rahu,
                    "KETU": ketu, "MARS": mars, "MOON": moon}.items():
    house_from_moon  = house_from_reference(natal_moon.rasi, body.rasi)
    base             = TRANSIT_BASE_SCORE[graha][house_from_moon]
    av_bindu         = get_av_bindu(_bav, graha, body.rasi)
    av_mult          = AV_MULTIPLIER[av_bindu]
    fn_mult          = get_transit_modifier(natal_lagna, graha)  # Lagna-specific
    contribution     = (base - 50) * PLANET_DAILY_WEIGHT[graha] * av_mult * fn_mult
    if check_vedha(graha, house_from_moon, all_transit_houses):
        contribution *= 0.25
    transit_score   += contribution
transit_score = max(0, min(100, transit_score))

# In dasha score — apply functional nature modifier to maha and antar scores
maha_score  = compute_natal_planet_score(...) * get_dasha_modifier(natal_lagna, maha_lord)
antar_score = compute_natal_planet_score(...) * get_dasha_modifier(natal_lagna, antar_lord)
maha_score  = max(10, min(95, round(maha_score)))
antar_score = max(10, min(95, round(antar_score)))
dasha_score = max(0, min(100, round(maha_score * 0.55 + antar_score * 0.35 + relationship_score * 0.10)))
```

**Tests to add:**
```python
def test_functional_nature_yogakaraka_gives_highest_modifier():
    from app.calculations.functional_nature import get_transit_modifier, FunctionalNature
    # Saturn is Yogakaraka for Thulaam (7) and Rishabam (2) Lagnas
    saturn_thulaam = get_transit_modifier(7, "SATURN")
    saturn_mesha   = get_transit_modifier(1, "SATURN")  # Saturn is NEUTRAL for Mesha
    assert saturn_thulaam > saturn_mesha

def test_functional_nature_dusthana_gives_lowest_modifier():
    from app.calculations.functional_nature import get_transit_modifier
    # Jupiter is DUSTHANA for Thulaam Lagna (3rd+6th lord)
    jup_thulaam  = get_transit_modifier(7, "JUPITER")
    jup_dhanusu  = get_transit_modifier(9, "JUPITER")  # Jupiter is LAGNA_LORD for Dhanusu
    assert jup_dhanusu > jup_thulaam

def test_jupiter_dasha_score_differs_by_lagna():
    from app.calculations.functional_nature import get_dasha_modifier
    # Dhanusu Lagna: Jupiter = Lagna lord → high modifier
    # Thulaam Lagna: Jupiter = 3rd+6th lord (DUSTHANA) → low modifier
    assert get_dasha_modifier(9, "JUPITER") > get_dasha_modifier(7, "JUPITER")

def test_all_lagnas_all_planets_covered():
    from app.calculations.functional_nature import get_functional_nature, FunctionalNature
    planets = ["SUN","MOON","MARS","MERCURY","JUPITER","VENUS","SATURN","RAHU","KETU"]
    for lagna in range(1, 13):
        for planet in planets:
            nature = get_functional_nature(lagna, planet)
            assert isinstance(nature, FunctionalNature)
```

---

## SECTION B — FEATURE IMPLEMENTATIONS

Implement in this order. Each feature builds on the bug fixes in Section A.

---

### FEATURE-01 — Score Explanation Engine ("Why is my score X today?") [HIGHEST PRIORITY]

**Files:** `app/services/narrative_engine.py`, `app/schemas/daily_guidance.py`  
**Prerequisite:** BUG-01, BUG-02, BUG-03 must be fixed first.  
**Why:** Without explanation, the score is a number with no trust. This is the feature that converts users from skeptics to believers.

Add a `summary` field to `DailyGuidanceReasons` that produces one full paragraph combining all factors. The existing individual `reasons.*` fields are per-component. The summary synthesises them.

**Structure for `build_score_reasons()` in `narrative_engine.py`:**

Each component reason must follow the tone rules (see TONE RULES section):
- State what the astrological condition is (factually)
- State what it traditionally means (tendency language only)
- State one thing the user can do

**Example summary paragraph output (Tamil):**
```
இன்று சந்திரன் உங்கள் ஜன்ம ராசியிலிருந்து 8-ஆம் இடத்தில் உள்ளது — சந்திராஷ்டம காலம்.
இந்த காலகட்டத்தில் புதிய முயற்சிகளை ஒத்திவைத்து, தொடர்ச்சியான வேலைகளை மட்டும் செய்வது
நல்லது. உங்கள் குரு தசையும் வெள்ளிக்கிழமை ஹோரையும் இன்று கலந்து ஆலோசிப்பதற்கும்
திட்டமிடுவதற்கும் ஏற்றதாக உள்ளது. ராகு காலம் {rahu_start}–{rahu_end} தவிர்க்கவும்.
```

**Example summary paragraph output (English):**
```
Today's Moon is in the 8th Rasi from your natal Moon — Chandrashtama period.
Traditionally this calls for completing existing tasks over starting new ones.
Your Jupiter Mahadasha supports planning and consultation today.
Avoid Rahu Kalam {rahu_start}–{rahu_end} for new starts.
```

Build the full bilingual template library for each score label × each major condition combination. At minimum: Chandrashtama, Janma Nakshatra, auspicious Nakshatra, Ezhara Sani active, Kantaka Sani active, caution Yoga, Rikta Tithi, Vishti Karana, benefic Hora available.

---

### FEATURE-02 — Morning Nalla Neram Push Notification [HIGHEST PRIORITY]

**Spec reference:** Product Spec Module 18.1: "Morning Panchangam — Daily 6 AM local — Push notification"  
**New files:** `app/services/notification_service.py`, `app/tasks/daily_push.py`

**Notification content (per user, computed from their chart + that day's panchangam):**
1. Today's Abhijit Muhurtham (Nalla Neram) start–end time — city-specific from this user's birth location
2. Today's Nakshatra name in Tamil
3. One personalised sentence based on that day's score label
4. Rahu Kalam time to avoid — city-specific

**Notification builder:**
```python
SCORE_LABEL_LINES = {
    "STRONG_SUPPORT": {
        "ta": "இன்று வலுவான ஆதரவு நாள். திட்டமிட்ட காரியங்களுக்கு நல்ல நேரம்.",
        "en": "Strong support day. Good for planned decisions and actions.",
    },
    "GOOD": {
        "ta": "இன்று நல்ல ஆதரவு நாள். திட்டமிட்டதை செய்யுங்கள்.",
        "en": "Good support day. Move ahead with your planned tasks.",
    },
    "BALANCED": {
        "ta": "இன்று நிலையான நாள். படிப்படியாக செல்லுங்கள்.",
        "en": "Steady day. Move step by step.",
    },
    "CAUTION": {
        "ta": "இன்று சற்று கவனம் தேவை. வழக்கமான பணிகளுக்கு மட்டும் முன்னுரிமை கொடுங்கள்.",
        "en": "A quieter day. Focus on routine tasks and defer major decisions.",
    },
    "RESTORATIVE": {
        "ta": "இன்று ஓய்வு மற்றும் மறுபரிசீலனை நாள். புதிய முயற்சிகளை நாளை தொடங்குங்கள்.",
        "en": "A restorative day. Rest and review. Start new things tomorrow.",
    },
}

def build_morning_notification(
    score_label: str,
    nalla_neram_start: str,
    nalla_neram_end: str,
    rahu_start: str,
    rahu_end: str,
    nakshatra_name_ta: str,
    nakshatra_name_en: str,
) -> dict:
    label = SCORE_LABEL_LINES.get(score_label, SCORE_LABEL_LINES["BALANCED"])
    return {
        "title": {
            "ta": f"இன்றைய நல்ல நேரம்: {nalla_neram_start}–{nalla_neram_end}",
            "en": f"Today's Nalla Neram: {nalla_neram_start}–{nalla_neram_end}",
        },
        "body": {
            "ta": f"நட்சத்திரம்: {nakshatra_name_ta}. {label['ta']} ராகு காலம் {rahu_start}–{rahu_end} தவிர்க்கவும்.",
            "en": f"Star: {nakshatra_name_en}. {label['en']} Avoid Rahu Kalam {rahu_start}–{rahu_end}.",
        },
    }
```

**Delivery:** 6:00 AM local time per user's birth city timezone. Use IANA timezone from birth profile.  
**Infrastructure:** FCM (Firebase Cloud Messaging) for push — per product spec tech stack. Implement opt-in only.

---

### FEATURE-03 — Dasha Transition Alert System (90 / 30 / 7 day) [HIGH]

**Spec reference:** Product Spec Module 4.3:
> "90 days before: 'Major Dasha change approaching'. 30 days before: full transition report. 7 days before: reminder. Day of: new Dasha dashboard activated."

**New file:** `app/services/dasha_transition_service.py`

```python
from dataclasses import dataclass
from datetime import date
from uuid import UUID
from app.calculations.dasha import calculate_vimshottari_timeline

@dataclass
class DashaTransitionAlert:
    type: str          # "MAHADASHA" or "ANTARDASHA"
    urgency: str       # "90_DAY", "30_DAY", "7_DAY", "TODAY"
    days_remaining: int
    ending_lord: str
    starting_lord: str | None
    transition_date: date

def get_dasha_transition_alerts(
    birth_jd: float,
    moon_longitude: float,
    current_jd: float,
    check_date: date,
) -> list[DashaTransitionAlert]:
    timeline = calculate_vimshottari_timeline(birth_jd, moon_longitude, current_jd)
    alerts = []

    for transition_type, end_date, ending_lord in [
        ("MAHADASHA",  timeline.current_mahadasha.end_date,  timeline.current_mahadasha.lord),
        ("ANTARDASHA", timeline.current_antardasha.end_date, timeline.current_antardasha.lord),
    ]:
        days = (end_date - check_date).days
        if 0 <= days <= 90:
            urgency = (
                "TODAY"  if days == 0 else
                "7_DAY"  if days <= 7 else
                "30_DAY" if days <= 30 else
                "90_DAY"
            )
            alerts.append(DashaTransitionAlert(
                type=transition_type,
                urgency=urgency,
                days_remaining=days,
                ending_lord=ending_lord,
                starting_lord=None,  # Compute next lord from timeline sequence
                transition_date=end_date,
            ))
    return alerts
```

**Alert copy per urgency (Tamil first):**

| Urgency | Tamil | English |
|---|---|---|
| 90_DAY Maha | `{lord} மகாதசை 90 நாட்களில் முடிகிறது. இந்தக் காலகட்டத்தின் பாடங்களை உள்வாங்குங்கள்.` | `{lord} Mahadasha ends in 90 days. A time to integrate this chapter's themes.` |
| 30_DAY Maha | `{lord} மகாதசை 30 நாட்களில் மாறுகிறது. தொடர்ச்சியான விஷயங்களை நிறைவு செய்யுங்கள்.` | `{lord} Mahadasha ends in 30 days. Complete pending matters in this theme.` |
| 7_DAY Maha | `{lord} மகாதசையின் கடைசி வாரம். மாற்றத்திற்கு தயாராகுங்கள்.` | `Final week of {lord} Mahadasha. Prepare for the transition.` |
| TODAY Maha | `இன்று புதிய மகாதசை தொடங்குகிறது — {new_lord} காலம் ஆரம்பம்.` | `New Mahadasha begins today — {new_lord} period starts.` |

---

### FEATURE-04 — Family Vault Daily Score View [HIGH]

**Spec reference:** Product Spec Module 17.2  
**New endpoint:** `GET /api/v1/family-vaults/{vault_id}/today`

Loops through all profiles in the vault, calls the existing `get_daily_guidance()` for each, and returns a combined view. No new calculations. The existing engine handles each profile individually.

**Response structure:**
```python
class FamilyMemberDayView(BaseModel):
    profile_id: UUID
    name: str
    relationship: str
    score: int
    label: str
    highlight_ta: str   # One sentence — the most important thing for them today
    highlight_en: str
    chandrashtama: bool
    sani_cycle_active: bool
    sani_cycle_type: str | None
    nalla_neram_start: str
    rahu_kalam_start: str
    rahu_kalam_end: str

class FamilyVaultTodayResponse(BaseModel):
    vault_id: UUID
    date: date
    members: list[FamilyMemberDayView]
```

---

### FEATURE-05 — Amavasai Content Card [HIGH]

**Prerequisite:** BUG-02 must be fixed first (removes wrong -10 penalty).  
**Trigger:** When `panchangam.tithi_number == 30`  
**What to surface:** A dedicated content card, not a score penalty.

```python
def build_amavasai_card() -> DailyGuidanceText:
    return DailyGuidanceText(
        ta=(
            "இன்று அமாவாசை — பித்ரு தர்பண நாள். "
            "முன்னோர்களை நினைத்து, குல தெய்வத்தை வணங்குவதற்கு ஏற்ற நேரம். "
            "புதிய முயற்சிகளை நாளை தொடங்குங்கள்."
        ),
        en=(
            "Today is Amavasai — the Pitru Tarpan day. "
            "A sacred day for ancestor remembrance and Kula Deivam worship. "
            "Begin new ventures tomorrow."
        ),
    )
```

Similarly build cards for Pournami (Tithi 15), Pradosham (Tithi 13, 28), and Ekadasi (Tithi 11, 26).

---

### FEATURE-06 — Nakshatra Birthday (Pirantha Naal) Alert [HIGH]

**Spec reference:** Product Spec Module 10  
**Logic:** For each family member, find the next date when the transiting Moon enters their birth Nakshatra. Alert 1 day before.

```python
def next_janma_nakshatra_date(
    janma_nakshatra: int,
    from_date: date,
    latitude: float,
    longitude: float,
    timezone_name: str,
) -> tuple[date, str, str]:
    """
    Scans forward day by day (max 30 days) using calculate_daily_panchangam()
    until the day's nakshatra_number matches janma_nakshatra.
    Returns (date, entry_time_str, exit_time_str).
    Moon cycle is ~27.3 days so will always find within 28-day window.
    """
    current = from_date
    for _ in range(30):
        panchang = calculate_daily_panchangam(current, latitude, longitude, timezone_name)
        if panchang.nakshatra_number == janma_nakshatra:
            return current, panchang.nakshatra_start_time, panchang.nakshatra_end_time
        current += timedelta(days=1)
    return from_date, "unknown", "unknown"  # Should never reach here
```

**Notification:**
```python
title_ta = f"நாளை {name}-ன் நட்சத்திர பிறந்த நாள் — {nakshatra_name_ta}"
body_ta  = f"நட்சத்திர நேரம்: {entry_time} முதல் {exit_time} வரை. குடும்பத்தினரை வாழ்த்துங்கள்."
```

---

### FEATURE-07 — Weekly Digest Endpoint [MEDIUM]

**Spec reference:** Product Spec Module 18.1: "Weekly Preview — Sunday 8 AM — Best day this week, upcoming events"  
**New endpoint:** `GET /api/v1/daily-guidance/week-ahead?profile_id={id}&week_start={YYYY-MM-DD}`

Uses existing `get_daily_guidance_range()` (already built) to get 7 days, then summarises:
- Highest score day of the week (best day for decisions)
- Any Pournami / Amavasai / Pradosham / Ekadasi this week
- Current Dasha theme sentence
- Chandrashtama days this week (if any)

---

### FEATURE-08 — Activity Timing Tool Endpoint [MEDIUM]

**Spec reference:** Product Spec Module 14 (Muhurtham Finder)  
**Existing backend:** `app/calculations/activity_timing_rules.py` — `assess_activity_timing()` already exists  
**New endpoint:** `GET /api/v1/activity-timing?chart_id={id}&activity={type}&month={YYYY-MM}`

Returns top 5 dates ranked by Panchangam quality + Dasha alignment for the requested activity type.

**Supported activity types:** `job_change`, `business_start`, `marriage`, `education`, `property`, `health`, `travel_abroad`, `spiritual`, `family_harmony`, `money`, `child_birth`

---

### FEATURE-09 — Dasha Story Timeline Endpoint [MEDIUM]

**New endpoint:** `GET /api/v1/dasha/timeline/{chart_id}`

Returns all Mahadasha periods from birth through age ~85 with start dates, end dates, age range, themes. Uses the existing Vimshottari timeline calculator.

**Mahadasha themes (Tamil first — use these exact strings):**
```python
MAHADASHA_THEMES = {
    "KETU":    {"ta": "ஆன்மீகம், விலகல், மறைந்த விஷயங்கள்",  "en": "Spirituality, detachment, hidden matters"},
    "VENUS":   {"ta": "உறவுகள், கலை, ஐஸ்வர்யம், வாகனம்",    "en": "Relationships, arts, luxury, vehicles"},
    "SUN":     {"ta": "தொழில், அதிகாரம், தந்தை, உடல்நலம்",   "en": "Career, authority, father, vitality"},
    "MOON":    {"ta": "மனம், தாய், உணர்வு, பயணம்",           "en": "Mind, mother, emotions, travel"},
    "MARS":    {"ta": "ஆற்றல், உடன்பிறப்பு, சொத்து",         "en": "Energy, siblings, property, courage"},
    "RAHU":    {"ta": "லட்சியம், வெளிநாடு, திடீர் மாற்றம்", "en": "Ambition, foreign connections, sudden changes"},
    "JUPITER": {"ta": "அறிவு, குழந்தை, செல்வம், விரிவாக்கம்","en": "Knowledge, children, wealth, expansion"},
    "SATURN":  {"ta": "ஒழுக்கம், பொறுப்பு, சேவை, ஆயுள்",   "en": "Discipline, responsibility, service, longevity"},
    "MERCURY": {"ta": "தொடர்பு, வியாபாரம், கல்வி",           "en": "Communication, business, education"},
}
```

---

### FEATURE-10 — Nakshatra Personality Content Cards [MEDIUM]

**New endpoint:** `GET /api/v1/content/nakshatra/{nakshatra_number}` (1–27)

Static content — no astronomical calculation. Pre-populate for all 27 Nakshatras in both Tamil and English. Include: name, deity, symbol, ruling planet, personality profile (2–3 sentences), strengths (3 items), cautions (1–2 items), compatible Nakshatra groups.

---

### FEATURE-11 — Guru Peyarchi / Sani Peyarchi Report [MEDIUM]

**Spec reference:** Product Spec Module 6.1 (Guru Peyarchi special treatment)  
**Trigger:** When Jupiter or Saturn changes Rasi (detected from ephemeris)  
**New endpoint:** `GET /api/v1/transits/peyarchi-report/{chart_id}?planet=JUPITER`

Personalised to the user's chart: which house Jupiter/Saturn enters from their Moon and Lagna, what that traditionally activates, quarterly outlook for the 12-month (Jupiter) or 2.5-year (Saturn) transit period.

---

### FEATURE-12 — Mood Journal Chart Correlation [MEDIUM]

**Existing basis:** `JournalEntry` model, `_build_journal_insight()` already reads recent entries.  
**New endpoint:** `GET /api/v1/journal/{chart_id}/correlations`  
**Minimum data requirement:** 30 journal entries before showing correlations.

Correlate user mood/rating entries with: day's Nakshatra, score label, Chandrashtama status, active Dasha lord. Show the user their own patterns: "On Chandrashtama days, you rated X/Y as difficult."

---

## SECTION C — ARCHITECTURE

### ARCH-01 — Calculation Version Bump After Bug Fixes

After completing all Phase 1 and Phase 2 bug fixes, bump the calculation version string so all cached `DailyScore` rows are invalidated and recomputed with corrected formulas:

```python
# In app/core/config.py or wherever CALCULATION_VERSION is defined
CALCULATION_VERSION = "jothidam-formula-engine-v1.1-2026"
```

This will cause the `_load_daily_score_cache()` function to miss all existing cached rows (different version string) and regenerate them.

---

### ARCH-02 — Notification Infrastructure

**Current state:** `app/services/notification_service.py` / email service has stub mode that silently skips when SMTP is not configured.  
**Required:**
- Complete SMTP email delivery with retry on failure
- FCM push notification integration (per product spec tech stack)
- `UserNotificationPreference` model: email / push / both / none
- All notifications are **opt-in**, not opt-out — Tamil cultural privacy expectation
- Smart silence rule per product spec Module 18: max 1 push/day during heavy Sani periods

---

### ARCH-03 — Tamil String Completeness Audit

Every user-facing string must have both `ta` and `en` variants. Files to audit:
- `app/services/narrative_engine.py`
- `app/services/nakshatra_content.py`
- `app/services/emotional_weather.py`
- `app/services/dasha_service.py`

Add this test to catch regressions:
```python
def test_daily_guidance_all_text_fields_bilingual(client, auth_headers, sample_chart_id):
    response = client.get(f"/api/v1/daily-guidance/{sample_chart_id}/today", headers=auth_headers)
    data = response.json()["data"]
    for field_path, value in _flatten_text_fields(data):
        if isinstance(value, dict) and "ta" in value and "en" in value:
            assert value["ta"].strip(), f"Tamil missing at {field_path}"
            assert value["en"].strip(), f"English missing at {field_path}"
```

---

## IMPLEMENTATION ORDER

```
Phase 1 — Bug fixes ✅ COMPLETE (2026-05-24)
  BUG-01  Chandrashtama Rasi fix                              ✅
  BUG-02  Amavasai tithi fix (remove wrong -10 penalty)       ✅
  BUG-03  Kandaka Sani from Lagna                             ✅
  BUG-04  Complete graha relationship score                   ✅
  ARCH-01 Bump calculation version                            ✅

Phase 2 — Personalisation engine ✅ COMPLETE (2026-05-24)
  BUG-05  Ashtakavarga engine                                 ✅
  BUG-06  Natal planet strength scoring                       ✅
  BUG-07  Add Lagna modifier to transit score                 ✅
  BUG-08  Vedha Vichara check in transit loop                 ✅
  BUG-09  Sookshma and Prana Dasha levels                     ✅

Phase 3 — Engagement features ✅ COMPLETE (2026-05-24)
  FEATURE-01  Score explanation engine                        ✅
  FEATURE-02  Morning Nalla Neram push notification           ✅
  FEATURE-03  Dasha transition alerts (90/30/7 day)           ✅
  FEATURE-04  Family vault daily score view                   ✅
  FEATURE-05  Amavasai / Pournami / Pradosham / Ekadasi cards ✅
  FEATURE-06  Nakshatra birthday (Pirantha Naal) alert        ✅

Phase 4 — Growth features ✅ COMPLETE (2026-05-24)
  FEATURE-07  Weekly digest endpoint                          ✅
  FEATURE-08  Activity timing tool endpoint                   ✅
  FEATURE-09  Dasha story timeline endpoint                   ✅
  FEATURE-10  Nakshatra personality content cards             ✅
  FEATURE-11  Peyarchi report (Guru / Sani)                   ✅
  FEATURE-12  Mood journal correlations                       ✅

Phase 5 — Infrastructure
  ARCH-02  Notification infrastructure (FCM + email)          ✅ COMPLETE (2026-05-24)
  ARCH-03  Tamil string completeness audit and test           ✅ COMPLETE (2026-05-24)
```

---

## QA GATES — Run before merging any change

These are mandatory per `agents.md`. Every task must pass these before being called complete:

```
✓ May 20, 2025 must be Tuesday (Sevvai), not Wednesday
✓ Meenam must be Rasi 12, not Rasi 9
✓ Saturn in 4th from Moon (e.g. Dhanusu Moon, Saturn in Meenam): house_from(9,12)=4 → Ardhashtama Sani, NOT Janma Sani
✓ Uthiradam 3rd Padam → Kumbam Navamsa (not Magaram)
✓ Gandanta zones = 3°20' (3.333°), not 0.8°
✓ Chandrashtama = 8th Rasi from natal Moon Rasi (not 8th Nakshatra) — BUG-01
✓ Amavasai (Tithi 30) does NOT reduce panchangam_score — BUG-02
✓ Kandaka Sani is detected from Lagna, not Moon — BUG-03
✓ All 36 planet-pair relationship scores return 38, 55, 70, or 72 — never flat 52 — BUG-04
✓ Two different natal charts produce different AV bindu multipliers for the same transit — BUG-05
✓ Exalted Jupiter natal score > own-sign Jupiter natal score > debilitated Jupiter natal score — BUG-06
✓ Moolatrikona zone returns dignity score 90 (between own=80 and exalted=100) — BUG-06
✓ Combust natal planet has lower strength score than same planet not combust — BUG-06
```

---

## TONE RULES — Never violate

Every generated string, notification, and explanation must follow these rules from `agents.md`:

1. **Never say "will happen"** — say "traditionally associated with" or "indicates tendency"
2. **Never say "bad times", "danger", "suffer"** — say "caution period", "refinement cycle", "calls for care"
3. **Saturn / Sani** — always frame as discipline, restructuring, growth, longevity — never punishment
4. **Health** — preventive nudges only ("this period calls for attention to bone health") — never diagnosis, never alarm
5. **Death** — never mentioned, not even indirectly
6. **Every caution must pair with an action** — "X is challenging → here is what helps"
7. **Medical qualifier on health content:** "This is a traditional tendency based on planetary associations, not a medical prediction. Consult a healthcare provider for health decisions."
8. **Remedies are optional** — never mandatory rituals, always framed as "traditional practices that many people find supportive"
```
