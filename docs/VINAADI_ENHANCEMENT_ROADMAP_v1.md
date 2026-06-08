# Vinaadi AI — Enhancement Roadmap v1.1 (Repo-Synced)
**Prepared:** 2026-05-27  
**Status:** Ready for execution after repo-sync corrections in Section 0A  
**Audience:** Any agent working on this codebase. Read this file + AGENT_INSTRUCTIONS.md before touching any code.

---

## 0. How to Use This Document

This document is the single source of truth for the next phase of Vinaadi AI development. It covers:
- What to build (feature list with priority)
- How to build it (wiring instructions per feature)
- Where each piece connects (backend → service → API → frontend)
- Thirukanitham compliance requirements per feature
- KPIs to instrument
- 90-day delivery sequence

**Conflict resolution rule (unchanged from AGENT_INSTRUCTIONS.md):**  
Formula spec (`docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md`) > Product spec > This doc for calculations.  
This doc > Product spec for feature prioritisation and UX decisions.

**Non-negotiable rules that apply to every feature in this document:**
- Lahiri sidereal ayanamsa (`SE_SIDM_LAHIRI`) — never tropical
- Whole Sign houses (`"W"`) — never Placidus or Equal
- Mean node Rahu/Ketu (`SE_MEAN_NODE`) — never true node
- Vimshottari dasha — period lengths in `app/calculations/dasha.py` — do not change
- Transit scoring primary reference: Janma Rasi (natal Moon)
- Kalam slots: actual sunrise-to-sunset daylight divided into 8 parts — NOT fixed 6:00 AM anchoring
- Chandrashtama: 8th Rasi from natal Moon Rasi — NOT 8th nakshatra
- Amavasai (Tithi 30): no penalty — content card only
- Every user-facing string: both `ta` and `en` fields — never monolingual
- Tone: supportive + practical — never fatalistic, never doom language
- All scores: evidence-aware framing ("traditionally associated with", not "will happen")
- Triple-confirmation for predictions: Natal promise + Dasha timing + Gochar support

---

## 0A. Repo Reality Check — Updated 2026-05-27 (post-sprint)

This section is the authoritative implementation status. Last verified by full codebase audit + test run (404 tests passing).

### Legacy items from v1.0

| Area | Status |
|---|---|
| Synastry UI | Done |
| Decision brief UI | Done |
| FEATURE-05 (Tithi card) | Done |
| FEATURE-07 (Week-ahead) | Done |
| FEATURE-08 (Activity timing) | Partial — Plan tab only; Personal tab placement deferred |
| FEATURE-09 (Dasha story expand) | Done |
| FEATURE-10 (Nakshatra card) | Done |
| FEATURE-11 (Peyarchi report) | Done |
| FEATURE-12 (Journal correlations) | Done |
| ARCH-02 (Notification settings) | Done |
| Birth time source field | Done |
| Daily push cron | Done |
| Tone test file | Done (`tests/test_tone_compliance.py`) |

### New features — implementation status (2026-05-27, updated post-gap-close session)

| Feature | ID | Status | Notes |
|---|---|---|---|
| 30-Second Home Card | P0-A | ✅ Done | `dashboard-home-card.tsx` wired in Personal tab |
| Mode Selector | P0-B | ✅ Done | Mode gating on D1/D9/planet table; onboarding mode picker in setup tab; mode prop on all tabs |
| Plain Language Mode | P0-C | ✅ Done | `plainLang()`/`plainLangDashaLord()` on transit chips, dasha story lord, all 3 `DashaTimeline` lord sites |
| Goal Tracks | P0-D | ✅ Done | `goal_track` wired into daily guidance action suggestion + journal prompt bias; EXAM/FINANCIAL templates added |
| Life Event Windows | P1-A | ✅ Done | `dashboard-life-events.tsx` in Personal tab |
| Confidence Layer | P1-B | ✅ Done | `ConfidenceBadge` on member cards, synastry panel, daily guidance, life areas |
| Ask Vinaadi | P1-C | ✅ Done | Claude API integration; rate limit; `dashboard-ask-vinaadi.tsx` |
| Tone Compliance | P1-D | ✅ Done | `tone_validator()` in `narrative_engine.py`; `test_tone_compliance.py` |
| Muhurta Picker | P1-E | ✅ Done | `app/services/muhurta_service.py`; `dashboard-muhurta-picker.tsx` in Personal tab |
| Rectification Assistant | P1-F | ✅ Done | `dashboard-rectification-wizard.tsx` wired in Setup tab |
| Dasha Timeline Scrubber | P2-A | ✅ Done | `dashboard-dasha-scrubber.tsx` in Personal tab; mode-aware |
| Shareable Cards | P2-B | ✅ Done | `app/services/share_card_service.py`; `GET /charts/{id}/share-card`; `dashboard-share-card.tsx`; buttons on DAILY_VIBE, DASHA_ERA, NAKSHATRA surfaces |
| Annual Wrapped | P2-C | ✅ Done | `app/services/annual_wrapped_service.py`; `GET /charts/{id}/annual-wrapped?year=`; `dashboard-annual-wrapped.tsx` fullscreen slide reveal with stat summary + year picker; wired in Personal tab after MuhurtaPicker |
| Life Event Log | P2-D | ✅ Done | `user_life_events` table (migration `h2b3c4d5e6f7`); `dashboard-life-event-log.tsx` in Journal tab |
| Friend/Non-Marriage Compatibility | P2-E | ✅ Done | `compatibility_context` on porutham endpoint + service; porutham sub-tab with context selector in synastry panel |
| Transit Push Notifications | P2-F | ✅ Done | `daily_push_cron.py` scheduled at 06:00 UTC |
| Shadow Work Prompts | P3-A | ✅ Done | `generate_shadow_prompts()` in `narrative_engine.py`; `dashboard-shadow-prompts.tsx` in Journal tab |
| Community Insights | P3-B | ❌ Not started | Requires 100+ user cohort minimum; deferred |

### What remains to implement

| Feature | ID | Priority | Scope |
|---|---|---|---|
| Community Insights | P3-B | P3 | Deferred — needs ≥100 users per dasha cohort before launching |

Execution rule for this roadmap version:
- Features marked ✅ Done: do not re-implement. Polish/QA only.
- Features marked ⚠️ Partial: extend the existing implementation only.
- Features marked ❌ Not started: implement from scratch per spec in Section 2.

---
## 1. Context — What Is Already Built

### Backend (fully implemented and tested)
- Chart engine: D1, D9, planet table, lagna, nakshatra, dasha (maha/antar/pratyantar)
- Daily guidance: score (0–100), breakdown, reasons, remedy, emotional weather, nakshatra perspective, context insight, journal insight, best/caution windows, action suggestion
- Transit (gochar): current positions, retrograde/combustion flags, Saturn cycle, peyarchi upcoming
- Panchangam: tithi, nakshatra, yoga, karana, kalam (sunrise-to-sunset daylight division), hora, abhijit
- Family vaults: aggregate score, member weights, calendar, member CRUD
- Journal: entries, prompts, export, correlations (needs 30+ entries), archive
- Goals: CRUD, deactivate
- What-If simulator: alternate scenario scoring
- Synastry: `/relationships/{id}/synastry` - backend + frontend panel done
- Decision brief: `/decisions/brief` - backend + frontend panel done
- Porutham (10-factor compatibility): backend endpoint done, frontend panel pending
- Peyarchi (transit change) report: `/transits/peyarchi-report/{id}` - backend + click-through UI done
- Ambient alerts: peyarchi + relationship aggregation
- Notification dispatch: FCM push + SMTP email

### Frontend status snapshot (FEATURE-05 to FEATURE-12 + ARCH-02)
| ID | Endpoint | Current status |
|---|---|---|
| FEATURE-05 | Inside `daily-guidance` | Done (rendered in Personal tab) |
| FEATURE-07 | `GET /daily-guidance/week-ahead` | Done (Calendar tab week surface) |
| FEATURE-08 | `GET /activity-timing` | Partial (implemented in Plan tab; optional Personal-tab placement pending) |
| FEATURE-09 | `GET /charts/{id}/dasha/timeline` | Done (expand/collapse narrative) |
| FEATURE-10 | `GET /content/nakshatra/{1-27}` | Done (Nakshatra personality surface) |
| FEATURE-11 | `GET /transits/peyarchi-report/{id}` | Done (Peyarchi report wiring present) |
| FEATURE-12 | `GET /journal/{id}/correlations` | Done (rendered with 30+ entries guard) |
| ARCH-02 | `GET/PATCH /settings/notifications` | Done (Settings session tab) |

---

## 2. New Features — Complete Specification

Features are ordered by priority: P0 (do first), P1, P2, P3.

---

### P0-A: 30-Second Home Screen

**What:** The first thing a returning user sees must communicate useful information within 30 seconds. No scrolling, no navigation, no jargon.

**Design contract:**
```
┌──────────────────────────────────────┐
│  Today   Wed, Vaikasi 14  ⚡ 72/100  │  ← score band + colour
│                                      │
│  ✅ Best window  10:30 AM – 12:00 PM │  ← bestWindows[0] from daily-guidance
│  ⚠️  Avoid       6:00 PM – 7:30 PM   │  ← cautionWindows[0]
│                                      │
│  📍 One action: [actionSuggestion]   │  ← actionSuggestion from daily-guidance
│                                      │
│  [See Full Guidance]  [Journal]      │
└──────────────────────────────────────┘
```

**Data already available:** `personalDailyGuidance` in `dashboard-workspace.tsx` already has `score`, `bestWindows`, `cautionWindows`, `actionSuggestion`.

**Backend wiring:** No new backend work. All data already in `GET /api/v1/charts/{id}/daily-guidance`.

**Frontend wiring:**
1. Extract the hero card from `dashboard-hero.tsx` into a new `DashboardHomeCard` component
2. Render it as the first surface in `DashboardPersonalTab` — above all other content
3. Score colour bands: ≥75 = green, 50–74 = amber, <50 = red/muted — use `getScoreBand()` from `web/lib/format.ts`
4. Language-toggle aware: all strings through `tLang()` or `t()`
5. `formatClockLabel()` on all window times

**i18n keys to add to `web/lib/i18n.ts`:**
```typescript
home_best_window: { ta: "சிறந்த நேரம்", en: "Best window" },
home_avoid_window: { ta: "தவிர்க்கவும்", en: "Avoid" },
home_one_action: { ta: "இன்றைய செயல்", en: "Today's action" },
home_see_full: { ta: "முழு வழிகாட்டல்", en: "See full guidance" },
```

**Thirukanitham note:** Window times are derived from panchangam kalam slots (actual sunrise-to-sunset daylight division) + dasha/transit scoring. Do not recompute — use `bestWindows` from daily-guidance response as-is.

---

### P0-B: Mode Selector (Beginner / Balanced / Traditional)

**What:** At onboarding and in Settings, user picks a depth mode. This controls how much jargon appears throughout the app.

**Three modes:**
| Mode | What changes |
|---|---|
| `BEGINNER` | Rasi/nakshatra/dasha terms hidden behind plain-language translations. Score shown without breakdown. No planet table. |
| `BALANCED` | Current default — some terms with tooltips, score with breakdown |
| `TRADITIONAL` | Full Tamil terms, D1+D9 chart visible, planet table, raw dasha lords shown |

**Backend wiring:**
1. Add `user_mode` column to `users` table: `VARCHAR(20) DEFAULT 'BALANCED'` — migration required
2. Add to `GET /auth/me` response and `PATCH /auth/me` (or new `PATCH /settings/mode`)
3. Schema: `app/schemas/auth.py` — add `mode: Literal["BEGINNER", "BALANCED", "TRADITIONAL"] = "BALANCED"`

**Frontend wiring:**
1. Store `mode` in `dashboard-workspace.tsx` state, initialised from `GET /auth/me`
2. Pass `mode` as prop to all tab components
3. In `DashboardPersonalTab`: conditionally show/hide planet table, chart, dasha breakdown based on `mode`
4. In Settings tab: add mode picker using `Select` UI primitive
5. In onboarding (login/setup flow): show mode picker after birth data entry

**Migration:** `alembic revision --autogenerate -m "add_user_mode"` — test on `vinaadi_test` first.

---

### P0-C: Plain Language Mode (Jargon Translation Layer)

**What:** A translation function that converts astrological keys into plain supportive language, respecting the current `mode`.

**Implementation:**
1. Add `web/lib/plainlang.ts` — mapping of every astrological key to plain-language BiText
2. Example mappings:
```typescript
const PLAIN_LANG: Record<string, BiText> = {
  "SATURN":       { ta: "சனி (கட்டுப்பாடு கிரகம்)", en: "Saturn (discipline planet)" },
  "RAHU":         { ta: "ராகு (மாற்றம்)", en: "Rahu (change force)" },
  "CHANDRASHTAMA":{ ta: "சந்திர அஷ்டமம் — ஓய்வு எடு", en: "Rest day — go easy" },
  "MAHADASHA":    { ta: "முக்கிய கால கட்டம்", en: "Major life phase" },
  "ANTARDASHA":   { ta: "உள் கால கட்டம்", en: "Sub-phase" },
  // ... all 9 planets, 12 rasis, 27 nakshatras, 10 dasha lords
}
```
3. Helper: `plainLang(key: string, mode: Mode, lang: Lang): string` — returns plain text if `BEGINNER`, translated key if `BALANCED`/`TRADITIONAL`
4. Apply in: dasha lord display, transit descriptions, ambient alert titles, emotional weather tone

**Thirukanitham note:** Plain language is a display layer only. All underlying keys and calculations stay as-is. Never simplify the calculation — only the rendering.

---

### P0-D: Goal Tracks

**What:** At onboarding (and changeable in Settings), user picks their primary focus track. Daily guidance, journal prompts, and activity timing are then weighted toward that track.

**Four tracks:**
| Track ID | Display |
|---|---|
| `CAREER` | Career growth / Job change |
| `EXAM` | Exam / Study focus |
| `RELATIONSHIP` | Relationship clarity |
| `FINANCIAL` | Financial discipline |

**Backend wiring:**
1. Add `goal_track` column to `users` table: `VARCHAR(20) DEFAULT NULL` — same migration as mode selector
2. Add to `GET /auth/me` response
3. In `app/services/daily_guidance_service.py`: add `goal_track` parameter to `compute_daily_guidance()`. Weight `actionSuggestion` and `bestWindows` description toward the track:
   - `CAREER`: emphasise Mercury/10th house windows, reference career timing
   - `EXAM`: emphasise Mercury/Jupiter windows, 4th/9th house support
   - `RELATIONSHIP`: emphasise Venus/7th house windows, synastry alerts
   - `FINANCIAL`: emphasise Jupiter/2nd/11th house windows, wealth timing
4. In `app/services/narrative_engine.py`: route journal prompts by track
5. Schema: `app/schemas/auth.py` — add `goal_track: Optional[Literal["CAREER","EXAM","RELATIONSHIP","FINANCIAL"]] = None`

**Frontend wiring:**
1. Goal track picker in onboarding flow (Setup tab) — after mode selector
2. Display track badge in home card ("Focus: Career growth")
3. Add explicit `goal_track` support in API/service contract (currently not exposed as first-class user profile field)
4. Track-specific journal prompt heading: "Career focus prompt today:" etc.

---

### P1-A: Life Event Windows (3–5 Year Forward View)

**What:** A timeline showing the user's most significant upcoming planetary windows for career, marriage/relationship, higher studies, relocation, and health over the next 3–5 years. Each window includes a confidence tier and plain-language framing.

**Thirukanitham methodology:**
- Use triple-confirmation rule: Natal promise (chart yoga or lord placement) + Dasha timing + Gochar support
- Career window: 10th lord dasha + Jupiter/Saturn gochar support on 10th house or 10th lord
- Marriage window: 7th lord dasha + Venus/Jupiter support + Navamsa (D9) activation
- Higher studies: 9th/4th lord dasha + Jupiter transit on 9th/4th from Moon
- Relocation: 12th/3rd lord dasha + Rahu activation + Saturn gochar trigger
- Health caution: 6th/8th lord dasha + Saturn/Mars transit on lagna or Moon
- Confidence tier: `HIGH` (all 3 confirmed) / `MEDIUM` (2 confirmed) / `LOW` (1 confirmed — flagged as potential only)

**Backend wiring:**
1. New file: `app/calculations/life_event_windows.py`
   - `compute_life_event_windows(chart, dasha_periods, as_of_date, years_ahead=5) -> List[LifeEventWindow]`
   - For each event type: scan dasha timeline + project gochar over the period, apply triple-confirm
   - Return start/end date range, event type, confidence tier, reasons (list of `BiText`)
2. New schema: `app/schemas/life_events.py`
```python
class LifeEventWindow(BaseModel):
    event_type: str  # "CAREER" | "MARRIAGE" | "STUDIES" | "RELOCATION" | "HEALTH_CAUTION"
    start_date: date
    end_date: date
    confidence: str  # "HIGH" | "MEDIUM" | "LOW"
    headline: BiText
    reasons: List[BiText]
    dasha_support: BiText  # which dasha lord activates this
    gochar_support: BiText  # which transit confirms
```
3. New service: `app/services/life_event_service.py`
4. New router endpoint: `GET /api/v1/charts/{id}/life-events?yearsAhead=5`
5. Register in `app/main.py`
6. Tests: `tests/test_life_events.py` — test HIGH/MEDIUM/LOW classification, date range sanity

**Frontend wiring:**
1. New component: `web/components/dashboard-life-events.tsx`
   - Timeline view: vertical scroll, grouped by year
   - Each card: event type icon + headline + confidence badge + expandable reasons
   - Confidence badges: HIGH=green, MEDIUM=amber, LOW=grey with "potential" label
   - Non-fatalistic framing: LOW confidence shown as "Worth being aware of" not a warning
2. Add to `DashboardPersonalTab` as a new `Surface` titled "Your Life Windows"
3. Add fetch in `dashboard-workspace.tsx`:
```typescript
const [lifeEvents, setLifeEvents] = useState<LifeEventWindow[] | null>(null);
apiFetchJson(`/api/v1/charts/${chartId}/life-events?yearsAhead=5`)
  .then(r => setLifeEvents(r.data))
  .catch(() => {});
```

---

### P1-B: Confidence Layer on All Predictions

**What:** Every prediction surface shows a confidence tier (HIGH / MEDIUM / LOW) with a one-line reason.

**Backend wiring:**
1. `app/services/daily_guidance_service.py`: add `confidence: str` and `confidence_reason: BiText` to `DailyGuidanceResponseData`
   - HIGH: score ≥75 + dasha support + gochar support all aligned
   - MEDIUM: 2 of 3 aligned
   - LOW: only 1 aligned or conflicting signals
2. `app/services/life_areas_service.py`: add confidence to each life area response
3. Any prediction endpoint (`/life-areas`, `/charts/{id}/summary`) — add confidence

**Frontend wiring:**
1. Add `ConfidenceBadge` to `web/components/dashboard-ui.tsx`:
```typescript
// <ConfidenceBadge level="HIGH" reason={bitext} lang={lang} />
// Renders as: ●●● High confidence | ●●○ Moderate | ●○○ Indicative only
```
2. Apply to: DailyGuidanceCard, LifeAreasTab cards, Life Events cards

**i18n keys:**
```typescript
confidence_high: { ta: "உயர் நம்பகத்தன்மை", en: "High confidence" },
confidence_medium: { ta: "மிதமான நம்பகத்தன்மை", en: "Moderate confidence" },
confidence_low: { ta: "சாத்தியமான குறிப்பு", en: "Indicative only" },
```

---

### P1-C: Ask Vinaadi (AI Chat Over Full Chart Context)

**What:** A conversational Q&A interface where the user asks natural language questions and the system answers using their full chart + current dasha + active transits + dosham flags. Not generic — every answer is personalised.

**Context package for each query (server-side assembled):**
```python
context = {
    "lagna_rasi": chart.lagna_rasi,
    "moon_rasi": chart.moon_rasi,
    "janma_nakshatra": chart.janma_nakshatra,
    "current_maha_lord": dasha.maha_lord,
    "current_antar_lord": dasha.antar_lord,
    "active_transits": [planet, house, retrograde for current gochar],
    "today_score": daily_guidance.score,
    "today_emotional_weather": daily_guidance.emotional_weather.tone,
    "goal_track": user.goal_track,
    "active_alerts": ambient_alerts (significance ≥ 60),
    "active_yogas": chart.yogas (if any),
    "dosham_flags": [chandrashtama, kandaka_sani, ashtama_sani if active]
}
```

**Backend wiring:**
1. New file: `app/services/ask_vinaadi_service.py`
   - `answer_question(question: str, chart_id: UUID, user_id: UUID, db: Session) -> AskVinaadiResponse`
   - Assemble context package from existing services (no new calculations)
   - Route to Claude API (model: `claude-sonnet-4-6`) with system prompt enforcing:
     - Thirukanitham methodology acknowledgement
     - Non-fatalistic tone (tendency + action + positive frame)
     - Triple-confirmation evidence rule — mention which signals support the answer
     - Tamil/English bilingual response
     - No medical/legal/financial advice — astrology guidance only
     - If birth time confidence is low (Tier 3), caveat the answer
2. New schema: `app/schemas/ask_vinaadi.py`
```python
class AskVinaadiQuery(BaseModel):
    chart_id: UUID
    question: str = Field(max_length=500)
    lang: str = "en"

class AskVinaadiResponse(BaseModel):
    success: bool = True
    data: AskVinaadiResponseData
    meta: ApiMeta

class AskVinaadiResponseData(BaseModel):
    answer: BiText
    signals_used: List[str]  # ["MOON_TRANSIT", "SATURN_DASHA", "JUPITER_GOCHAR"]
    confidence: str
    caveat: BiText | None  # populated if birth time is Tier 3 or signals conflict
```
3. New router: `app/api/ask_vinaadi.py` — `POST /api/v1/charts/{id}/ask`
4. Rate limit: 10 questions per user per day (add to `RateLimitMiddleware` or via DB counter)
5. Register in `app/main.py`
6. Tests: `tests/test_ask_vinaadi.py` — mock Claude response, verify context assembly, verify rate limit

**Frontend wiring:**
1. New component: `web/components/dashboard-ask-vinaadi.tsx`
   - Chat-style UI: user question input + response card
   - Show `signals_used` as chips below answer: "Based on: Moon transit · Saturn dasha · Jupiter transit"
   - Show `caveat` in muted text if present
   - Daily quota indicator: "3 of 10 questions used today"
   - Suggested questions (vary by goal_track):
     - CAREER: "Is this month good for a job change?" / "When should I ask for a promotion?"
     - EXAM: "Which weeks are best for intense study?" / "Is my mind sharp this month?"
     - RELATIONSHIP: "Is this a good time for a serious conversation?" / "What does my chart say about relationships?"
     - FINANCIAL: "When is a good time to invest?" / "Is this month stable for big purchases?"
2. Add tab or panel in Personal tab — below What-If simulator
3. Add fetch in `dashboard-workspace.tsx`

**Claude API system prompt template (store in `app/services/ask_vinaadi_service.py`):**
```
You are Vinaadi, a Tamil astrology guide rooted in Thirukanitham tradition.
You use Drik Ganita only as the astronomical calculation method within that Thirukanitham system.
You use Lahiri sidereal ayanamsa, whole-sign South Indian houses, and Vimshottari dasha.
You follow the triple-confirmation rule: natal promise + dasha timing + gochar (transit) support.
Tone: supportive, practical, never fatalistic. Frame tendencies as "traditionally associated with" not certainties.
Every answer must reference which specific astrological signals you are using.
Respond in both Tamil and English (JSON: {"ta": "...", "en": "..."}).
Never provide medical, legal, or financial advice. Astrology guidance only.
If birth time confidence is low, acknowledge that precise house-based readings may vary.
```

---

### P1-D: Confidence-Aware Predictions with Non-Fatalistic Language

**What:** Enforce the non-fatalistic tone across all narrative text generation. Audit and update the `narrative_engine.py` and `daily_guidance_service.py` text templates.

**Rules (to be enforced as a linter/review check):**
- Banned phrases: "bad day", "danger", "will fail", "avoid", "doomed", "trouble ahead", "crisis"
- Required pattern: `[tendency] + [traditional association] + [what helps]`
- Sani periods: always "refinement cycle" or "discipline phase" — never "hardship" alone
- Rahu/Ketu: always "transformation" or "karmic shift" — never "inauspicious" alone
- Chandrashtama: "rest and recover" not "avoid all activities"

**Backend wiring:**
1. Audit all string templates in `app/services/narrative_engine.py` — replace banned phrases
2. Audit all `BiText` values in `app/services/daily_guidance_service.py` reason/remedy blocks
3. Add a `tone_validator()` utility in `app/services/narrative_engine.py` that checks output strings for banned phrases (used in tests)
4. Add test: `tests/test_tone_compliance.py` — runs tone_validator over all generated outputs for a set of known charts

---

### P1-E: Muhurta Picker ("When Is a Good Time To…")

**What:** User enters an activity type and a date range. System returns top 5 candidate dates/times within that range, ranked by auspiciousness. Uses panchangam + dasha + gochar.

**Thirukanitham methodology for Muhurta:**
- Primary filters: avoid Rahu Kalam, Yamagandam, Kuligai for the activity
- Positive signals: Abhijit muhurta (except Wednesdays), Amrit siddhi yoga, Dwipushkar / Tripushkar yoga for good events
- Dasha support: check if dasha lord is friendly to the activity (career = 10th lord, marriage = 7th lord, etc.)
- Gochar support: Moon nakshatra compatibility with activity (use Tarabalam — count from Janma nakshatra)
- Avoid: Chandrashtama day, Ashtami/Navami for auspicious events, Amavasai for new starts

**Backend wiring:**
1. Extend `app/calculations/panchangam.py` with `score_muhurta_slot(date, time_slot, activity, chart) -> float`
2. New service: `app/services/muhurta_service.py`
   - `find_best_muhurta_slots(chart_id, activity, date_from, date_to, db) -> List[MuhurtaSlot]`
   - Returns top 5, sorted by composite score
3. New schema: `app/schemas/muhurta.py`
```python
class MuhurtaQuery(BaseModel):
    chart_id: UUID
    activity: str  # "JOB_START" | "MARRIAGE" | "EXAM" | "TRAVEL" | "INVESTMENT" | "MEDICAL" | "PURCHASE"
    date_from: date
    date_to: date  # max 60 days ahead

class MuhurtaSlot(BaseModel):
    date: date
    time_start: str  # "HH:MM"
    time_end: str
    score: float
    panchangam_support: BiText
    dasha_support: BiText
    cautions: List[BiText]
```
4. New router: `GET /api/v1/charts/{id}/muhurta`
5. Register in `app/main.py`
6. Tests: verify slots avoid Rahu Kalam, verify Chandrashtama days excluded

**Frontend wiring:**
1. New component: `web/components/dashboard-muhurta-picker.tsx`
   - Activity dropdown + date range picker
   - Results: date cards with time, composite score bar, support/caution chips
2. Add to Personal tab (below Activity Timing surface, FEATURE-08)

---

### P1-F: Rectification Assistant (Unknown Birth Time Flow)

**What:** If a user doesn't know their birth time, guide them through a 5-question life event survey to narrow the birth time to a 30–60 minute window.

**Thirukanitham methodology:**
- Only Lagna changes (approx. every 2 hours) need rectification — Moon/planet positions are stable
- Survey events: marriage year, career break year, relocation year, major health event year, parents' birth years
- Each event constrains which Lagna rasi was active — intersect constraints to narrow window
- Result is a `birth_time_confidence: "TIER2_ESTIMATED"` flag on the birth profile
- All chart-based readings then carry a caveat that Lagna-dependent interpretations may vary by ±1 rasi

**Backend wiring:**
1. `birth_time_source` already exists on `birth_profiles`; only add a migration if normalizing vocabulary/constraints for rectification states.
2. New service: `app/services/rectification_service.py`
   - `estimate_birth_time(events: List[RectificationEvent], birth_date, birth_place) -> RectificationResult`
   - For each event: compute which Lagna rasi was active on that date for the candidate time windows
   - Intersect constraints, return top 3 candidate time windows with probability weights
3. New router: `POST /api/v1/birth-profiles/{id}/rectify`
4. Store the estimated time + confidence on the birth profile
5. Propagate `birth_time_confidence` to chart responses so `Ask Vinaadi` can caveat

**Frontend wiring:**
1. Add "I don't know my birth time" option in Setup tab birth time field
2. Triggers a 5-step modal: `RectificationWizard`
3. After completion: shows top 3 candidate times with recommendation, user selects one
4. Profile saved with `birth_time_source: "ESTIMATED_RECTIFIED"`
5. All chart views show a subtle banner: "Birth time estimated — Lagna-dependent readings may vary"

---

### P2-A: Dasha Timeline Scrubber

**What:** A horizontal timeline UI where the user can scrub through their life's dasha periods — past and future. Each era shows the maha lord, antar lord, and a one-line description of the period's theme.

**Data already available:** `personalDashaMaha` in `dashboard-workspace.tsx` — full maha timeline from birth.

**Backend:** No new work. `GET /api/v1/charts/{id}/dasha/timeline` (FEATURE-09) already returns the full narrative.

**Frontend wiring:**
1. New component: `web/components/dashboard-dasha-scrubber.tsx`
   - Horizontal scroll track with era blocks proportional to dasha duration
   - Current era highlighted with a "you are here" marker
   - Tap an era: expand card with maha lord, antar periods, narrative text (FEATURE-09 data)
   - Past eras: muted style. Future eras: normal style.
   - Plain language mode: show "Saturn Era (2024–2043)" not "Sani Mahadasha"
2. Replace or extend the existing Dasha surface in Personal tab

**i18n keys:**
```typescript
dasha_you_are_here: { ta: "நீங்கள் இங்கே இருக்கிறீர்கள்", en: "You are here" },
dasha_past_era: { ta: "கடந்த காலம்", en: "Past" },
dasha_future_era: { ta: "வரும் காலம்", en: "Coming" },
```

---

### P2-B: Shareable Cards

**What:** User can generate a privacy-safe image card from key data points and share to WhatsApp/Instagram. No birth data or location shown — only the insight.

**Card types:**
1. **Daily vibe card:** "Today's energy: 72 · Best time: 10:30–12:00 · [one-line action]"
2. **Dasha era card:** "I'm in my Saturn era · Refinement cycle 2024–2043"
3. **Nakshatra card:** "I'm a Rohini nakshatra · [one-line trait from nakshatra content]"
4. **Annual wrapped card:** (see P2-C below)

**Backend wiring:**
1. New service: `app/services/share_card_service.py`
   - `generate_card_data(card_type, chart_id, user_id, date, db) -> ShareCardData`
   - Returns structured data only (no image generation server-side)
   - Privacy rule: strip all PII (no name, no birth date, no location) from share data
2. New router: `GET /api/v1/charts/{id}/share-card?type=DAILY_VIBE&date=`

**Frontend wiring:**
1. Canvas-based card renderer using HTML Canvas or `html-to-image` library
2. Card templates: minimal design, dark/light variant, Vinaadi branding at bottom
3. Share button on: DailyGuidanceCard, DashaCard, NakshatraCard
4. On tap: render card, prompt native share (Web Share API) or download as PNG

---

### P2-C: Annual Wrapped Report

**What:** A year-end (or on-demand) summary: "Your 2026 in planetary terms." Shareable, emotional, personal.

**Content:**
- Dominant dasha lord of the year
- Most significant transit that activated (highest significance peyarchi alert)
- Monthly score trend: which month scored highest/lowest
- Top journal mood pattern (from correlations, if 30+ entries)
- Most active life area (from life-areas scores)
- One-line "Year theme" generated by narrative engine
- One forward-looking "Next year preview" sentence

**Backend wiring:**
1. New service: `app/services/annual_wrapped_service.py`
   - `compute_annual_wrapped(chart_id, year, db) -> AnnualWrappedData`
   - Queries `daily_scores` table for the year (already stored)
   - Queries `peyarchi_alerts` for the year
   - Queries `dasha_periods` for dominant lord
   - Queries `journal` correlations if available
2. New router: `GET /api/v1/charts/{id}/annual-wrapped?year=2026`

**Frontend wiring:**
1. New component: `web/components/dashboard-annual-wrapped.tsx`
   - Full-screen reveal animation (CSS only, no external lib)
   - Slide sequence: Year theme → Score arc → Dominant era → Top transit → Forward look
   - Each slide: shareable as card (uses P2-B share card renderer)
2. Accessible from Settings tab: "Generate my 2026 Wrapped"
3. Deep link: `/dashboard?wrapped=2026` — auto-opens on first login of new year

---

### P2-D: Life Event Logging (Retroactive Correlation)

**What:** User logs real life events with date and type. System retrospectively overlays them on the dasha/transit timeline to show which planetary pattern was active.

**Event types:** Job change, promotion, relationship start/end, relocation, health event, exam result, financial milestone, loss of family member

**Backend wiring:**
1. New table: `user_life_events` — `id, chart_id, event_type, event_date, description, created_at`
2. New service: `app/services/life_event_log_service.py`
   - `log_event(chart_id, event_type, event_date, description, db)`
   - `correlate_event(chart_id, event_id, db) -> EventCorrelation` — looks up what dasha/transit was active on that date, returns correlation report
3. New router: `POST/GET /api/v1/charts/{id}/life-event-log`
4. New schema: `app/schemas/life_event_log.py`
5. Migration: add `user_life_events` table

**Frontend wiring:**
1. New panel in Journal tab: "Log a life event"
2. After logging: show correlation card — "On that day: [Dasha lord] mahadasha + [Transit planet] was in your [house]. Traditionally this activates [theme]."
3. Timeline view: life events overlaid on dasha scrubber (P2-A)

---

### P2-E: Friend / Non-Marriage Compatibility

**What:** Reframe compatibility (Porutham) for any two people — friends, business partners, family members. Remove the marriage-only framing.

**Backend wiring (porutham calculation already exists in `app/calculations/porutham.py`):**
1. Add `compatibility_context: str` field to porutham API — `"MARRIAGE" | "FRIENDSHIP" | "BUSINESS" | "FAMILY"`
2. Update `app/services/synastry_service.py` to accept context and adjust narrative framing accordingly:
   - MARRIAGE: use all 10 porutham factors
   - FRIENDSHIP: use 6 relevant factors (dina, gana, rasi, rajju, yoni, vedha)
   - BUSINESS: use 5 factors (dina, gana, rasi, mahendra, stree-dirgha)
   - FAMILY: informational only, no match/no-match verdict
3. Update schemas to include `context` in request

**Frontend wiring:**
1. In Family tab: add "Add friend / Compare with anyone" flow — not just family vault members
2. Context selector: "For… Marriage / Friendship / Business / Family insight"
3. Results: reframed narrative (no "match/no match" doom language — instead "strong alignment areas" and "areas needing understanding")

---

### P2-F: Transit Push Notifications with Context

**What:** Opt-in push notifications when significant transits approach. Short, actionable, non-alarming.

**Backend wiring (notification dispatch already exists in `app/services/notification_dispatch_service.py`):**
1. Extend existing scheduled notification flow (`run_daily_push_cron`) or add a dedicated transit cron only if separation is required.
   - Daily job at 7:00 AM user local time
   - For each user with `morning_alert_enabled=True`: compute today's daily guidance, check ambient alerts
   - If significant alert (peyarchi, chandrashtama, kandaka sani) within next 3 days: queue notification
2. Notification templates (stored as BiText in cron file):
```python
TEMPLATES = {
    "VENUS_PEYARCHI": {"ta": "வீனஸ் பெயர்ச்சி 3 நாளில் — ...", "en": "Venus changes sign in 3 days — ..."},
    "CHANDRASHTAMA": {"ta": "நாளை சந்திர அஷ்டமம் — ஓய்வெடு", "en": "Tomorrow is your rest day — take it easy"},
    # ...
}
```
3. ARCH-02 notification settings are already wired; reuse existing preference fields and avoid duplicate toggles.

---

### P3-A: Shadow Work Journal Prompts

**What:** Deepen the journal with prompts derived from the user's 8th and 12th house placements — the "shadow" and "subconscious" domains in Tamil Jyothidam.

**Thirukanitham methodology:**
- 8th house: transformation, hidden matters, obstacles, longevity themes — lord and occupant determine prompt tone
- 12th house: solitude, release, spiritual inclination, losses — lord and occupant determine prompt tone
- Moon nakshatra's shadow quality (Tamasic nakshatras: Bharani, Aslesha, Magha, Jyeshta, Mula, Shatabhisha) gets deeper reflective prompts

**Backend wiring:**
1. Extend `app/services/narrative_engine.py` with `generate_shadow_prompts(chart) -> List[BiText]`
   - Returns 3 prompts based on 8th lord, 12th lord, and Moon nakshatra
2. Expose via existing `/journal/prompts` endpoint — add `prompt_type: "SHADOW"` variant

**Frontend wiring:**
1. In Journal tab: add "Shadow work" toggle in prompt section
2. Triggered by: therapy-adjacent CTA ("Explore your inner landscape today")
3. Shown only in `BALANCED` or `TRADITIONAL` mode — not shown to `BEGINNER` users

---

### P3-B: Community-Lite (Anonymous Trend Insights)

**What:** Aggregate, privacy-safe insights from users in similar dasha periods. No personal data. No comparison. No fear content.

**Rules:**
- Strictly anonymous: no user ID, no location, no name
- Minimum cohort: 100 users before any aggregate is shown (to prevent re-identification)
- No negative statistics: "70% of people in Saturn mahadasha report career reflection" not "30% had job losses"
- Zero fear content policy enforced in all aggregate text

**Backend wiring:**
1. New service: `app/services/community_insights_service.py`
   - Weekly batch job: aggregate `daily_scores` + journal mood tags by dasha lord (not by user)
   - Store aggregate in `community_insights` table: `dasha_lord, stat_type, stat_value, period_month`
2. New router: `GET /api/v1/insights/community?dashLord=SATURN`
3. Migration: add `community_insights` table

**Frontend wiring:**
1. Small insight chip in DashboardHero or Personal tab:
   "Others in [dasha lord] phase are focusing on: [top theme]"
2. Opt-out: global opt-out in Settings for contributing to community data

---

## 3. FEATURE-05 to FEATURE-12 Frontend Validation & Polish

Section 0A confirms most of FEATURE-05 to FEATURE-12 + ARCH-02 are already wired.
Do not reopen these as net-new implementation work. Use this section as QA/polish backlog.

### FEATURE-05 / 07 / 09 / 10 / 11 / 12 / ARCH-02
- Validate happy-path and empty-state UX in all tabs after latest backend changes.
- Ensure copy, labels, and helper text are consistently bilingual (`ta` + `en`).
- Confirm all data fetches are non-blocking and fail-soft in `dashboard-workspace.tsx`.
- Add/refresh screenshot QA notes for each surface to prevent visual regressions.

### FEATURE-08 (Activity Timing)
- Current state: implemented in Plan tab.
- Product decision needed: keep in Plan tab only, or also surface in Personal tab.
- If dual placement is chosen, reuse existing fetch/state and avoid duplicate logic.

### Cross-cutting polish
- Confirm all existing wired features have tab discoverability (entry point clarity).
- Stale "UI missing" references to fix: `docs/AGENT_INSTRUCTIONS.md` Section 7 table (FEATURE-05 to FEATURE-12 rows) — update status column to "Done" if any are stale. Do not change anything else in that file.
- Add regression tests for key wiring paths where coverage is currently thin: at minimum, one integration test per wired feature that verifies the API response shape matches what the frontend type expects.

---

## 4. Wiring Checklist (Per Feature)

Every new feature must complete all steps before marking done:

**Backend:**
- [ ] Schema in `app/schemas/` (Pydantic, camelCase aliases, BiText for all user-facing strings)
- [ ] Service in `app/services/` (business logic, calls calculations or DB, no HTTP)
- [ ] Router in `app/api/` (`@router.get/post`, auth required, `response_model` set)
- [ ] Registered in `app/main.py`
- [ ] Alembic migration (if new table/column) — full round-trip on `vinaadi_test` first (see Section 11.5)
- [ ] Tests in `tests/` — happy path + null safety + auth required + BiText fields present
- [ ] All existing tests still pass (run with `$env:PYTHONUTF8="1"` prefix)
- [ ] No `ensure_ascii=True` in any `json.dumps()` call — Tamil must flow as raw UTF-8
- [ ] New `.py` files with Tamil characters: saved as UTF-8 without BOM (BOM check in Section 11.4)
- [ ] No hardcoded Tamil or English strings in router/service — all user-facing text as `BiText`

**Frontend:**
- [ ] Type added to `web/lib/types.ts`
- [ ] Fetch added to `dashboard-workspace.tsx` (fire-and-forget, `.catch(() => {})`, never block main bundle)
- [ ] Prop passed to tab component with correct TypeScript type
- [ ] Component renders with null guard: `{data && <Surface>...</Surface>}` — never crash on null
- [ ] All times through `formatClockLabel()` — never render raw `"HH:MM"` strings
- [ ] All panchangam keys through `tTithi()`, `tNakshatra()`, `tPlanetLord()`, `tYoga()`, `tKarana()` etc.
- [ ] All new strings in `web/lib/i18n.ts` with both `ta` and `en`
- [ ] Mode-aware rendering: hide planet table, D1/D9 chart, raw dasha lords in `BEGINNER` mode
- [ ] Non-fatalistic language verified — no banned phrases
- [ ] `test_arch03_bilingual_audit.py` still passes after adding new strings

---

## 5. Database Migrations Required

**Protocol:** For every migration row below — run the full round-trip from Section 11.5 on `vinaadi_test` before touching `vinaadi_dev`. Never skip `downgrade()`. Never batch multiple migrations in one Alembic revision unless they are logically inseparable.

**Generate command:**
```powershell
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "describe_the_change"
# Review the generated file in migrations/versions/ before applying
```

| # | Table | Change | Reversible? | Feature |
|---|---|---|---|---|
| 1 | `users` | Add `user_mode VARCHAR(20) DEFAULT 'BALANCED'` | Yes — `op.drop_column` | P0-B |
| 2 | `users` | Add `goal_track VARCHAR(20) DEFAULT NULL` | Yes — `op.drop_column` | P0-D |
| 3 | `birth_profiles` | No base migration required (column already exists). Only migrate if normalizing enum/vocabulary. | Yes - reversible if introduced | P1-F |
| 4 | `user_life_events` | New table: `id UUID PK, chart_id UUID FK(charts), event_type VARCHAR(30), event_date DATE, description TEXT, created_at TIMESTAMP` | Yes — `op.drop_table` | P2-D |
| 5 | `community_insights` | New table: `id UUID PK, dasha_lord VARCHAR(20), stat_type VARCHAR(30), stat_value JSONB, period_month DATE, cohort_size INT, created_at TIMESTAMP` | Yes — `op.drop_table` | P3-B |

**Foreign key constraint note:** Migration 4 (`user_life_events.chart_id`) must reference `charts.id` with `ON DELETE CASCADE` so orphan rows are cleaned when a chart is deleted. Verify this is in the generated migration file before applying.

---

## 6. API Endpoints to Add

| Endpoint | Method | Auth | Feature |
|---|---|---|---|
| `/api/v1/charts/{id}/life-events` | GET | Required | P1-A |
| `/api/v1/charts/{id}/ask` | POST | Required | P1-C |
| `/api/v1/charts/{id}/muhurta` | GET | Required | P1-E |
| `/api/v1/birth-profiles/{id}/rectify` | POST | Required | P1-F |
| `/api/v1/charts/{id}/share-card` | GET | Required | P2-B |
| `/api/v1/charts/{id}/annual-wrapped` | GET | Required | P2-C |
| `/api/v1/charts/{id}/life-event-log` | GET/POST | Required | P2-D |
| `/api/v1/insights/community` | GET | Required | P3-B |
| `/api/v1/settings/mode` | PATCH | Required | P0-B |

---

## 7. New Frontend Components

| Component file | Feature | Tab |
|---|---|---|
| `dashboard-home-card.tsx` | P0-A 30-second home | Personal tab |
| `dashboard-life-events.tsx` | P1-A Life windows | Personal tab |
| `dashboard-ask-vinaadi.tsx` | P1-C Ask Vinaadi | Personal tab |
| `dashboard-muhurta-picker.tsx` | P1-E Muhurta picker | Personal tab |
| `dashboard-rectification-wizard.tsx` | P1-F Rectification | Setup tab (modal) |
| `dashboard-dasha-scrubber.tsx` | P2-A Dasha scrubber | Personal tab |
| `dashboard-annual-wrapped.tsx` | P2-C Annual wrapped | Settings / full-screen |
| `dashboard-life-event-log.tsx` | P2-D Event logging | Journal tab |
| `dashboard-shadow-prompts.tsx` | P3-A Shadow prompts | Journal tab |

---

## 8. i18n Keys to Add

All keys to be added to `web/lib/i18n.ts`. Both `ta` and `en` required. Tamil text must be UTF-8 without BOM.

```typescript
// ── Home card
home_best_window: { ta: "சிறந்த நேரம்", en: "Best window" },
home_avoid_window: { ta: "தவிர்க்கவும்", en: "Avoid" },
home_one_action: { ta: "இன்றைய செயல்", en: "Today's action" },
home_see_full: { ta: "முழு வழிகாட்டல்", en: "See full guidance" },

// ── Mode selector
mode_beginner: { ta: "ஆரம்பநிலை", en: "Beginner" },
mode_balanced: { ta: "சமநிலை", en: "Balanced" },
mode_traditional: { ta: "பாரம்பரிய", en: "Traditional" },
mode_label: { ta: "ஆழம் தேர்வு", en: "Detail level" },

// ── Goal tracks
track_career: { ta: "தொழில் வளர்ச்சி", en: "Career growth" },
track_exam: { ta: "படிப்பு கவனம்", en: "Exam focus" },
track_relationship: { ta: "உறவு தெளிவு", en: "Relationship clarity" },
track_financial: { ta: "நிதி கட்டுப்பாடு", en: "Financial discipline" },
track_label: { ta: "உங்கள் கவனம்", en: "Your focus" },

// ── Confidence layer
confidence_high: { ta: "உயர் நம்பகத்தன்மை", en: "High confidence" },
confidence_medium: { ta: "மிதமான நம்பகத்தன்மை", en: "Moderate" },
confidence_low: { ta: "சாத்தியமான குறிப்பு", en: "Indicative only" },

// ── Ask Vinaadi
ask_placeholder: { ta: "ஒரு கேள்வி கேளுங்கள்...", en: "Ask a question..." },
ask_based_on: { ta: "இதை அடிப்படையாகக் கொண்டு", en: "Based on" },
ask_quota: { ta: "இன்று %d / 10 கேள்விகள்", en: "%d of 10 questions today" },
ask_low_confidence: { ta: "பிறந்த நேரம் திட்டமற்றது — லக்கன வாசிப்புகள் மாறலாம்", en: "Birth time estimated — Lagna readings may vary" },

// ── Life events
life_events_title: { ta: "வாழ்க்கை சாளரங்கள்", en: "Life Windows" },
life_events_career: { ta: "தொழில் சாளரம்", en: "Career window" },
life_events_marriage: { ta: "திருமண சாளரம்", en: "Relationship window" },
life_events_studies: { ta: "படிப்பு சாளரம்", en: "Studies window" },
life_events_relocation: { ta: "இடமாற்ற சாளரம்", en: "Relocation window" },
life_events_health: { ta: "ஆரோக்கிய கவனம்", en: "Health caution" },

// ── Muhurta
muhurta_title: { ta: "சுப நேரம் தேடு", en: "Find auspicious time" },
muhurta_activity: { ta: "செயல் வகை", en: "Activity" },
muhurta_results: { ta: "சிறந்த நேரங்கள்", en: "Best times" },

// ── Dasha scrubber
dasha_you_are_here: { ta: "நீங்கள் இங்கே", en: "You are here" },
dasha_past_era: { ta: "கடந்த காலம்", en: "Past" },
dasha_future_era: { ta: "வரும் காலம்", en: "Coming" },

// ── Shareable cards
share_card: { ta: "பகிர்", en: "Share" },
share_daily_vibe: { ta: "இன்றைய ஆற்றல்", en: "Today's energy" },
share_dasha_era: { ta: "என் தசை காலம்", en: "My dasha era" },

// ── Annual wrapped
wrapped_title: { ta: "என் வருட விமர்சனம்", en: "My Year Wrapped" },
wrapped_generate: { ta: "உருவாக்கு", en: "Generate" },
wrapped_year_theme: { ta: "வருட தீம்", en: "Year theme" },
wrapped_next_preview: { ta: "வரும் ஆண்டு", en: "Next year preview" },

// ── Rectification
rectify_title: { ta: "பிறந்த நேரம் தெரியவில்லையா?", en: "Don't know your birth time?" },
rectify_start: { ta: "நேரம் கண்டுபிடி", en: "Find your birth time" },
rectify_estimated: { ta: "மதிப்பீட்டு நேரம்", en: "Estimated time" },

// ── Compatibility context
compat_friendship: { ta: "நட்பு இணக்கம்", en: "Friendship" },
compat_business: { ta: "வணிக இணக்கம்", en: "Business" },
compat_family: { ta: "குடும்ப பார்வை", en: "Family insight" },
```

---

## 9. 90-Day Delivery Sequence

### Days 1–30 — Make the First Session Count
**Goal:** Any new user who opens Vinaadi gets value in 60 seconds and sets up a goal track.

| Day | Task | Feature ID |
|---|---|---|
| 1-3 | Repo-sync sweep: verify all already-wired FEATURE-05..12 + ARCH-02 paths and close stale docs | Backlog QA |
| 4–6 | 30-second home card (P0-A) | P0-A |
| 7–9 | Mode selector + DB migration (P0-B) | P0-B |
| 10–12 | Goal tracks + DB migration (P0-D) | P0-D |
| 13–15 | Plain language mode — `plainlang.ts` + apply in Personal tab (P0-C) | P0-C |
| 16–18 | Tone compliance audit + `tone_validator` tests (P1-D) | P1-D |
| 19–22 | Rectification assistant wizard (P1-F) | P1-F |
| 23-25 | Activity timing placement decision (Plan-only vs Plan+Personal) + polish pass | FEATURE-08 |
| 26–30 | Integration test pass + all 233+ tests green | All |

### Days 31–60 — Deepen Trust and Utility
**Goal:** Users can explore their future, ask questions, and find auspicious timing.

| Day | Task | Feature ID |
|---|---|---|
| 31–36 | Life event windows — backend (`life_event_windows.py` + service + router) | P1-A |
| 37–39 | Life event windows — frontend component | P1-A |
| 40–44 | Confidence layer — backend + ConfidenceBadge component | P1-B |
| 45–50 | Ask Vinaadi — backend service + Claude API integration + rate limiting | P1-C |
| 51–53 | Ask Vinaadi — frontend chat component | P1-C |
| 54–57 | Muhurta picker — backend calculation + service + router | P1-E |
| 58–60 | Muhurta picker — frontend component | P1-E |

### Days 61–90 — Drive Sharing and Retention
**Goal:** Users generate and share content, return daily, build habits.

| Day | Task | Feature ID |
|---|---|---|
| 61–64 | Dasha timeline scrubber (frontend only — data already available) | P2-A |
| 65–68 | Shareable cards — backend data endpoint + canvas renderer | P2-B |
| 69–73 | Annual Wrapped — backend service + frontend reveal component | P2-C |
| 74–77 | Life event logging — backend table + service + router + frontend panel | P2-D |
| 78–80 | Friend/non-marriage compatibility reframe | P2-E |
| 81-83 | Transit push notification tuning (template quality, schedule verification, and analytics) | P2-F |
| 84–86 | Shadow work journal prompts | P3-A |
| 87–90 | Final test pass, performance audit, KPI instrumentation | All |

---

## 10. KPIs to Track

Instrument these from Day 1. Add structured logging in `app/middleware.py` or a dedicated analytics service.

### Acquisition & Onboarding
| KPI | Target | How to measure |
|---|---|---|
| Onboarding completion rate | >70% | `birth_profiles` created / `users` registered |
| Birth time confidence at signup | >50% TIER1 | `birth_time_source` field distribution |
| Mode selection at onboarding | Track distribution | `user_mode` field |
| Goal track selection rate | >60% | `goal_track` non-null rate |

### Retention
| KPI | Target | How to measure |
|---|---|---|
| Day-7 retention | >40% | DAU/signup cohort at D+7 |
| Day-30 retention | >20% | DAU/signup cohort at D+30 |
| Day-7 retention (18–35 segment) | >45% | Segment by birth year in `birth_profiles` |
| Daily check-in rate | >30% of active users | `daily_scores` computation trigger / day |

### Feature Adoption
| KPI | Tracking event |
|---|---|
| Ask Vinaadi query volume | `POST /charts/{id}/ask` hit count |
| Ask Vinaadi daily quota hit rate | Users hitting 10/10 questions |
| Life event windows opened | `GET /charts/{id}/life-events` hit count |
| Muhurta picker used | `GET /charts/{id}/muhurta` hit count |
| Share card generated | `GET /charts/{id}/share-card` hit count |
| Annual Wrapped generated | `GET /charts/{id}/annual-wrapped` hit count |
| Goal track adoption | `goal_track` non-null / total users |
| Mode distribution | `user_mode` value distribution |
| Rectification completed | `birth_time_source = ESTIMATED_RECTIFIED` count |

### Engagement Quality
| KPI | Tracking event |
|---|---|
| Journal entries per active user / week | `journal` table entries per user-week |
| Journal entries before/after shadow prompts launch | Before/after segmentation |
| Notification opt-in rate | `morning_alert_enabled = True` rate |
| Notification click-through rate | FCM click events (from FCM analytics) |
| Feedback sentiment score | `feedback` table — positive / total |

### Trust Signals
| KPI | Tracking event |
|---|---|
| Data control usage | `DELETE /journal/{id}` + profile update rate |
| Confidence layer visibility | LOW confidence predictions viewed without bounce |
| Tone complaint rate | Feedback with negative sentiment tags |

---

## 11. Quality Gates (Per Sprint)

Before marking any sprint complete, run these checks in order:

### 11.1 Test Suite
```powershell
# Always set encoding vars before pytest — Tamil output will corrupt without these
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
$env:JOTHIDAM_DATABASE_URL = "sqlite:///./pytest_local_test.db"
.\.venv\Scripts\python.exe -m pytest tests/ -x -q
```
- All green. Count must be ≥ 233 (grows as new tests are added — never shrinks).
- If any test fails: fix root cause. Never skip with `--ignore` or `pytest.mark.skip` without explicit product-owner approval.

### 11.2 New Tests Required
Every new endpoint must have tests covering:
- Happy path (200 response, correct schema shape)
- Null safety (missing optional fields return null, not crash)
- Auth required (401 when no JWT)
- BiText fields present on every narrative string (`assert "ta" in response` + `assert "en" in response`)

### 11.3 Bilingual Audit
```powershell
$env:PYTHONUTF8 = "1"
.\.venv\Scripts\python.exe -m pytest tests/test_arch03_bilingual_audit.py -v
```
- No new English-only strings in any API response.
- No hardcoded Tamil strings in `.tsx` files — all must go through `t()` or `tLang()`.

### 11.4 Encoding Check (for any new `.py` file containing Tamil characters)
```powershell
# Check for BOM — first 3 bytes must NOT be EF BB BF (UTF-8 BOM) or FF FE (UTF-16)
$bytes = [System.IO.File]::ReadAllBytes("app\services\my_new_service.py")[0..2]
$bytes  # Must NOT show: 239 187 191  (EF BB BF = UTF-8 BOM)
        # Must NOT show: 255 254      (FF FE = UTF-16 LE BOM)
```
- Never use `Out-File` to write Python files — it defaults to UTF-16. Use the Write tool or `Set-Content -Encoding utf8`.
- Never add `ensure_ascii=True` to any `json.dumps()` call — Tamil bytes must flow as raw UTF-8.
- Verify: `Content-Type: application/json; charset=utf-8` on all JSON responses (handled by `SecurityHeadersMiddleware` — do not bypass).

### 11.5 DB Migration Round-Trip (before applying to vinaadi_dev)
```powershell
# Step 1 — point at test DB
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"

# Step 2 — apply migration
.\.venv\Scripts\python.exe -m alembic upgrade head

# Step 3 — verify: check the new table/column exists, run affected tests

# Step 4 — downgrade and verify it reverses cleanly
.\.venv\Scripts\python.exe -m alembic downgrade -1

# Step 5 — re-apply (confirms idempotency)
.\.venv\Scripts\python.exe -m alembic upgrade head

# Step 6 — only after all 5 steps pass: apply to vinaadi_dev
# NEVER run against vinaadi_dev without completing the round-trip above
```
- Every migration must have a working `downgrade()` function — never leave it empty.
- Never run `DROP TABLE` or `DROP SCHEMA` against `vinaadi_dev` — ever.
- Back up dev data before any risky migration:
```powershell
docker exec slw-postgres pg_dump -U slw_admin vinaadi_dev > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql
```

### 11.6 Thirukanitham Rules Verification
Grep for violations before merging:
```powershell
# Must return zero results — any hit is a blocking violation
Select-String -Path "app\**\*.py" -Pattern "SE_SIDM_TROPICAL|PLACIDUS|true_node|SE_TRUE_NODE" -Recurse
Select-String -Path "app\**\*.py" -Pattern "ensure_ascii\s*=\s*True" -Recurse
```
- No new code uses tropical ayanamsa, true node, Placidus houses, or non-Vimshottari dasha periods.
- Chandrashtama must use Rasi count (8th from Moon Rasi) — grep `chandrashtama` in any new code and verify.
- Kalam must anchor at actual local sunrise and use `(sunset - sunrise) / 8` — grep `kalam_anchor` in any new panchangam code and verify it is not fixed to `time(6, 0)`.

### 11.7 Tone Compliance
```powershell
$env:PYTHONUTF8 = "1"
.\.venv\Scripts\python.exe -m pytest tests/test_tone_compliance.py -v
```
- No banned phrases ("bad day", "danger", "will fail", "doomed", "trouble ahead", "crisis") in any narrative output.
- If `test_tone_compliance.py` doesn't exist yet: create it as part of P1-D task before Day 18.

---

## 12. Thirukanitham Compliance Checklist (New Features)

Apply to every new calculation added in this roadmap:

| Rule | Applies to |
|---|---|
| Lahiri sidereal (`SE_SIDM_LAHIRI`) | Life event windows, Muhurta picker, Rectification |
| Whole Sign houses (`"W"`) | Life event windows, Muhurta scoring |
| Mean node (`SE_MEAN_NODE`) | Any Rahu/Ketu reference in new features |
| Vimshottari dasha periods (unchanged) | Life event windows, Annual Wrapped |
| Chandrashtama = 8th Rasi from Moon | Muhurta picker (exclude Chandrashtama days) |
| Amavasai = no penalty | Life event windows (don't penalise Amavasai windows), Annual Wrapped |
| Kalam = sunrise-to-sunset daylight division | Muhurta picker (exclude Rahu Kalam, Yamagandam, Kuligai) |
| Triple-confirmation rule | Life event windows (HIGH/MEDIUM/LOW confidence), Ask Vinaadi answers |
| Non-fatalistic tone | All narrative text in all features |
| Evidence-aware framing | Ask Vinaadi system prompt, life event window descriptions |

---

## 13. Decisions Log

Decisions confirmed by product owner. Agents must treat these as final — do not re-open.

| # | Question | Decision | Implication for code |
|---|---|---|---|
| 1 | Ask Vinaadi rate limit | 10 questions/day, single tier for now. No paid tier at launch. | Hard-limit in `RateLimitMiddleware` or daily counter table. Reset at midnight user local time. |
| 2 | Annual Wrapped trigger | User-triggered any time from Settings tab. Also auto-prompt on first login in January. | Deep link `/dashboard?wrapped={year}` + Settings CTA. Auto-prompt via login check in `dashboard-workspace.tsx`. |
| 3 | Community-lite cohort minimum | Hold until user count threshold (100 per dasha lord cohort) is met. Show placeholder "Coming soon" until threshold. | `community_insights_service.py` must gate on `cohort_size >= 100` before returning data. Frontend shows placeholder if null. |
| 4 | Rectification accuracy | Label clearly as "Approximate — heuristic estimate, not classical rectification." | Banner text in `RectificationWizard` result screen. `birth_time_source = "ESTIMATED_RECTIFIED"` label visible in profile. |
| 5 | Shadow work prompts gating | BALANCED and TRADITIONAL mode only. BEGINNER users do not see this entry point at all. | Gate in `dashboard-shadow-prompts.tsx`: `{mode !== "BEGINNER" && <ShadowPromptsToggle />}` |
| 6 | Shareable card design | Minimal design: dark background, white text, Vinaadi wordmark bottom-right, score or insight text centered. No custom designer needed — implement directly. | Canvas renderer uses: `#1a1a2e` background, `#e0e0e0` text, `Inter` or system font, Vinaadi logo from `web/public/brand/vinaadi-symbol-icon.png`. |
| 7 | Claude API key for Ask Vinaadi | Confirmed available. Add `ANTHROPIC_API_KEY` to `app/core/config.py` as `Optional[str]` and to `.env.example`. | If key is unset at runtime, Ask Vinaadi endpoint returns `503` with message `{"error": "Ask Vinaadi is not configured on this instance"}`. Never crash — degrade gracefully. |

---

*End of document. For any calculation question, AGENT_INSTRUCTIONS.md section 2 and `docs/Jothidam_AI_Formula_Engine_Specification_v1_Thirukanitham_2026.md` are authoritative.*
