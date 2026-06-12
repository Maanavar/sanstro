# Vinaadi AI — Growth Features Implementation Brief

> **Purpose:** This document is the single source of truth for the Growth Feature sprint.
> Load this file at the start of any new chat session or when switching coding agents.
> It contains full context, decisions already made, and exact file paths — no re-derivation needed.

---

## Project Identity

- **Product:** Vinaadi AI — Tamil-first Jothidam (astrology) daily-use app
- **Repo root (Windows):** `C:\Users\senth\OneDrive\문서\GitHub\sanstro`
- **Frontend:** Next.js (`web/`) — TypeScript, React
- **Backend:** FastAPI + SQLAlchemy (`app/`) — Python, PostgreSQL
- **Shell:** PowerShell (use `;` not `&&`; no `head`, no `2>&1` on native commands)
- **Auth:** Stateless HS256 JWT — Bearer header or `vinaadi_token` httpOnly cookie
- **API proxy:** `web/app/api/backend/[...path]/route.ts` forwards all requests to FastAPI at `http://127.0.0.1:8000`

---

## Sprint Goal

Convert Vinaadi from a prediction utility into a **daily-use cultural wellness app** that grows through two loops:

1. **Daily Habit Loop** — users open every morning to see score, guidance, timing
2. **Share Loop** — users share Panchangam/Rasipalan cards to WhatsApp, creating organic discovery

---

## Five Prioritised Features

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| 1 | WhatsApp Panchangam Share Card | **Done** (Panchangam + Festival cards) | High — viral acquisition |
| 2 | Life Mode Intent Picker | **Done** | High — retention |
| 3 | Ask Vinaadi Lite (3 chips/day) | **Done** | Medium — free→paid conversion |
| 4 | Friends & Compatibility (public tool) | **Done** | Medium — viral acquisition |
| 5 | Under-18 Content Gating | **Done** | Do first — safety/compliance |

**Recommended build order:** 5 → 2 → 3 → 1 → 4 — all implemented 2026-06-11.

---

## Implementation Notes & Deliberate Deviations (2026-06-11)

These deviations were made for correctness/safety against the real codebase, which
differs from a few of this brief's assumptions:

1. **Life Mode is NOT stored on `users.user_mode`.** That column is already in use as
   the *dashboard complexity mode* (`BEGINNER`/`BALANCED`/`TRADITIONAL`). Overloading
   it would break the existing UI-mode feature. Life Mode is a new column
   `user_preferences.life_mode` (+ `life_mode_set_at`, `show_life_mode_picker`).
   Constants in `app/core/life_mode.py`.
2. **`daily_guidance_service` weighting by life mode was deferred.** Changing the
   scoring engine requires a `DAILY_SCORE_ENGINE_VERSION` bump + tests, which can't run
   in this sandbox (swisseph DLL is WDAC-blocked). Life Mode currently drives the picker,
   badge, focus declaration, and Ask-Vinaadi chip sets at the presentation layer.
3. **Under-18 gating is enforced server-side** (marriage prediction → 403, wealth →
   `ageGated`+`alternativeFraming`, life-events filters `MARRIAGE`, Ask Vinaadi love/
   marriage → safe redirect). The dashboard's existing `currentAge` logic already hides
   marriage/relationship life-area cards for minors, and `usePersonalData` already
   `.catch(()=>null)`s the marriage 403 — so no fragile frontend gating was added.
4. **Share card "both types" = Panchangam festive card + dedicated Festival cards**
   (Pournami / Amavasai / Shivarathiri / Ekadasi / Pradosham, auto-detected from the
   day's tithi, reusing `narrative_engine` content). The reference image's editorial
   *rasi/nakshatra-palan* layout needs a daily-editorial content engine that doesn't
   exist yet — noted as a follow-up; see `web/app/tools/indraiya-rasipalan` for the
   closest existing rasi-palan surface.
5. **Deity images are optional.** The canvas renders a styled gold medallion fallback
   when `/deities/<key>.png` is absent, so cards ship today; drop in PNGs later with no
   code change. See `web/public/deities/README.md`.
6. **The Ask Vinaadi widget was mounted** in `dashboard-workspace.tsx` (it existed but
   was not rendered anywhere), so Feature 3's chip UI is actually visible.
7. **Premium keeps the existing in-process daily backstop** in `ask_vinaadi_service`
   (cost control); "unlimited" means "not limited to the 3 free chips."

Verified: all changed backend files `py_compile` clean; `tsc --noEmit` passes (web).
Migrations created but NOT applied (apply with `alembic upgrade head` against the
target DB after review): `t5a6b7c8d9e0` (life mode), `u6b7c8d9e0f1` (ask_vinaadi_usage).

---

## Feature 5 — Under-18 Content Gating

**Why first:** smallest scope, de-risks all other features, must be in place before Life Mode ships.

### Rule
Age is computed from `birth_profile.birth_date_local` at request time — **never stored as a flag**.  
Auto-upgrades the moment user turns 18 without any manual intervention.

### What is gated for users under 18

| Content | Action |
|---------|--------|
| Marriage predictions | Hidden from API response |
| Romantic relationship guidance | Hidden |
| Sexual compatibility in Porutham | Hidden |
| Financial investment predictions | Replaced with education/savings framing |
| `LOVE` Life Mode option | Removed from picker |
| `MARRIAGE` Life Mode option | Removed from picker |
| Marriage timing in Life Events | Filtered out |
| Ask Vinaadi chips referencing love/marriage | Swapped to study/family chips |

### Files to create / modify

#### New file — `app/core/age_gate.py`
```python
from datetime import date

def is_minor(birth_date: date) -> bool:
    today = date.today()
    age = today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )
    return age < 18

MINOR_BLOCKED_MODES = {"LOVE", "MARRIAGE"}
MINOR_BLOCKED_LIFE_EVENTS = {"marriage_window", "romantic_timing"}
```

#### Extend — `app/api/life_events.py`
- After fetching events, filter out entries in `MINOR_BLOCKED_LIFE_EVENTS` if `is_minor(profile.birth_date_local)`

#### Extend — `app/api/predictions.py`
- Exclude marriage predictions if minor
- Wealth predictions: add `"age_gated": true, "alternative_framing": "education"` flag to response

#### Extend — `app/api/ask_vinaadi.py`
- If minor + question contains "marriage" or "love": return safe redirect message instead of processing

#### Extend — `app/api/settings.py` (Life Mode endpoint — see Feature 2)
- Reject `LOVE` or `MARRIAGE` mode if user is minor

#### Extend — `web/components/dashboard-workspace.tsx`
- Compute `isMinor: boolean` from `profile.birth_date_local` on data load
- Pass as prop to all child components that need gating

#### Extend — `web/components/life-mode-picker.tsx` (see Feature 2)
- Accept `isMinor` prop; filter out `LOVE` and `MARRIAGE` from mode grid

#### Extend — `web/components/dashboard-life-areas-tab.tsx`
- If `isMinor`: hide Marriage scorecard or relabel as "Relationships & Friendship"

#### Extend — `web/components/dashboard-plan-tab.tsx`
- Filter marriage timing windows from display if `isMinor`

#### Extend — `web/lib/types.ts`
- Add `isMinor: boolean` to user/profile context type

---

## Feature 2 — Life Mode Intent Picker

**Goal:** Replace passive dashboard with an active intent declaration. User picks their current focus. This gates which cards show prominently. Never label it as "age segment" — always framed as "What are you focused on?"

### Life Modes
`STUDY` · `CAREER` · `LOVE` · `MARRIAGE` · `FAMILY` · `WEALTH` · `HEALTH` · `SPIRITUALITY` · `REMEDIES` · `BALANCED`

Under-18 users see: `STUDY` · `FAMILY` · `HEALTH` · `SPIRITUALITY` · `REMEDIES` · `BALANCED`

### Existing model state
`app/models/user.py` already has `user_mode: str = "BALANCED"` — just extend allowed values.

### DB migration needed
```python
# New migration file in migrations/
op.add_column('user_preferences',
    sa.Column('life_mode_set_at', sa.DateTime(timezone=True), nullable=True))
op.add_column('user_preferences',
    sa.Column('show_life_mode_picker', sa.Boolean(), server_default='true', nullable=False))
```

### Files to create / modify

#### Extend — `app/models/user_preference.py`
- Add `life_mode_set_at: datetime | None`
- Add `show_life_mode_picker: bool = True`

#### Extend — `app/api/settings.py`
- `PATCH /api/settings/life-mode` — updates `user.user_mode` + `preference.life_mode_set_at`; rejects blocked modes for minors
- `GET /api/settings/life-mode` — returns `{ mode, life_mode_set_at, show_life_mode_picker }`

#### Extend — `app/services/daily_guidance_service.py`
- Accept optional `life_mode` param
- Weight `action_suggestion` and `guidance_headline` toward the mode:
  - `STUDY` → surface study/focus windows
  - `CAREER` → surface career timing
  - `LOVE` → surface communication/emotional windows
  - etc.

#### New file — `web/components/life-mode-picker.tsx`
- Full-screen or large bottom-sheet modal
- 9 (or 6 for minors) mode cards in a 3×3 grid
- Each card: icon + label + one-line description
- Heading: "What are you focused on right now?"
- Submit → `PATCH /api/settings/life-mode` immediately
- "Skip for now" → defaults to BALANCED, closes modal
- Re-show trigger: `show_life_mode_picker = true` OR `life_mode_set_at` is null OR >30 days old

#### Extend — `web/components/dashboard-workspace.tsx`
- On load: check `life_mode_set_at` → show `LifeModePicker` overlay if needed
- Store `activeLifeMode` in state
- Pass `activeLifeMode` to `DashboardDailySnapshot`, `DashboardLifeAreasTab`, `DashboardPersonalTab`

#### Extend — `web/components/dashboard-daily-snapshot.tsx`
- Show active mode badge (use existing `mode-badge.tsx`)
- Tapping badge → re-opens `LifeModePicker`
- Filter/re-order action suggestions based on mode

#### Extend — `web/components/dashboard-life-areas-tab.tsx`
- Pin relevant life area card to top based on mode
  - e.g. `WEALTH` → Wealth scorecard is #1

#### Extend — `web/components/dashboard-personal-tab.tsx`
- Show mode-specific framing in guidance section
  - e.g. "Your Career focus is active — here's what the chart says about work timing this week"

---

## Feature 3 — Ask Vinaadi Lite (3 chips/day)

**Goal:** Free users get 3 pre-written prompt chips per day. On 4th attempt: soft upgrade prompt. Paid users: unrestricted.

### Chip sets by Life Mode

| Mode | Chip 1 | Chip 2 | Chip 3 |
|------|--------|--------|--------|
| STUDY | "How is my focus today?" | "Best time to study this evening?" | "What should I avoid today?" |
| CAREER | "How is my work energy today?" | "Is today good for important decisions?" | "What should I be careful about?" |
| LOVE | "How is my communication today?" | "Is today good for a difficult conversation?" | "What does my chart say about relationships?" |
| MARRIAGE | "How is my relationship energy today?" | "What timing is good this week?" | "What should I focus on in my marriage?" |
| FAMILY | "How is family harmony today?" | "Best time for an important family talk?" | "What should I watch out for today?" |
| WEALTH | "How is my financial energy today?" | "Is today good for new financial decisions?" | "What does my chart say about wealth timing?" |
| HEALTH | "How is my physical energy today?" | "What should I be careful about health-wise?" | "Best time for rest or exercise?" |
| SPIRITUALITY | "What's spiritually significant today?" | "Best time for prayer or meditation?" | "What does today's nakshatra say?" |
| BALANCED | "How is my overall energy today?" | "What should I focus on?" | "What should I avoid today?" |

### DB migration needed
```python
op.create_table('ask_vinaadi_usage',
    sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid4),
    sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.user_id'), nullable=False),
    sa.Column('usage_date', sa.Date, nullable=False),
    sa.Column('chip_count', sa.Integer, nullable=False, server_default='0'),
    sa.UniqueConstraint('user_id', 'usage_date', name='uq_ask_vinaadi_usage_user_date')
)
```

### Files to create / modify

#### New file — `app/models/ask_vinaadi_usage.py`
- Model: `AskVinaadiUsage` with `user_id`, `usage_date`, `chip_count`
- Unique constraint on `(user_id, usage_date)`

#### Extend — `app/api/ask_vinaadi.py`
- Before processing any request: check `AskVinaadiUsage` for today
- If `chip_count >= 3` AND user is free plan → return `{ "error": "DAILY_LIMIT_REACHED", "chips_used": 3 }`
- Increment `chip_count` on each successful chip submit
- New endpoint: `GET /api/ask-vinaadi/daily-status` → `{ chips_used, chips_remaining, is_premium }`

#### Extend — `app/schemas/ask_vinaadi.py`
- Request: add `is_chip_question: bool = False`
- Response: add `chips_remaining: int | None`

#### Extend — `web/components/dashboard-ask-vinaadi.tsx`
- On mount: `GET /api/ask-vinaadi/daily-status`
- If `chips_remaining > 0`: render 3 chip buttons (text from mode chip set above)
- Chip tap → sends pre-written question text as the ask → decrements local count
- When `chips_remaining === 0` on next attempt: show upgrade interstitial
- Upgrade interstitial text: "You've used your 3 free questions today. Upgrade for unlimited daily guidance."  
  Buttons: "Upgrade" (→ pricing page) | "Try again tomorrow" (dismiss)

#### Extend — `web/components/dashboard-ask-vinaadi-widget.tsx`
- Show `"N questions left today"` counter badge when `chips_remaining < 3`

#### New util — `web/lib/ask-vinaadi-chips.ts`
- Export `getChipsForMode(mode: LifeMode): [string, string, string]`
- Simple lookup object returning chip text per mode

### Subscription check
- Use `app/models/subscription.py` as source of truth
- Premium users: no chip limit, show chips as optional shortcuts only

---

## Feature 1 — WhatsApp Panchangam Share Card

**Goal:** One-tap shareable image card with today's Panchangam data + deity theme + CTA. Public (no login needed). Two formats: 1080×1920 (WhatsApp Status) and 1080×1080 (WhatsApp Group).

### Card anatomy
```
┌─────────────────────────────────┐
│  VINAADI AI        [Date]       │  ← header
│  Chennai, Tamil Nadu            │
├─────────────────────────────────┤
│  [Deity image]                  │  ← day-based deity
│  Thursday · Dakshinamurthy      │
├─────────────────────────────────┤
│  Tithi      Panchami            │
│  Nakshatra  Rohini              │
│  Yoga       Shobhana            │
│  Karana     Bava                │
├─────────────────────────────────┤
│  Rahukalam   15:00 – 16:30      │
│  Abhijit     12:00 – 12:48      │
├─────────────────────────────────┤
│  Today's Guidance               │
│  "Good time for learning."      │
├─────────────────────────────────┤
│  [QR]  Get your free Jadhagam  │
│  vinaadi.ai                     │  ← subtle CTA
└─────────────────────────────────┘
```

### Deity key map (day of week → deity)
```python
DEITY_MAP = {
    "MON": "shiva",
    "TUE": "murugan",
    "WED": "vishnu",
    "THU": "dakshinamurthy",
    "FRI": "lakshmi",
    "SAT": "shani",
    "SUN": "surya",
}
```

### Assets needed
7 deity images in `web/public/deities/`:  
`surya.png`, `shiva.png`, `murugan.png`, `vishnu.png`, `dakshinamurthy.png`, `lakshmi.png`, `shani.png`  
Start with colored placeholder rectangles; swap in illustrations later.

### Files to create / modify

#### New file — `app/services/panchangam_card_service.py`
- `get_card_data(date, city, lang)` → assembles Panchangam fields + picks `deity_key` from `DEITY_MAP`
- Calls existing `panchangam_service.py` internally — no new calculations
- Returns: `{ tithi, nakshatra, yoga, karana, rahukalam, abhijit, deity_key, guidance_line, card_date }`

#### Extend — `app/api/share_card.py`
- New public endpoint: `GET /api/panchangam-share-card?date=YYYY-MM-DD&city=Chennai&lang=ta`
- No auth required
- Calls `panchangam_card_service.get_card_data()`

#### New file — `web/components/panchangam-share-card.tsx`
- Canvas-based card renderer (extend pattern from existing `dashboard-share-card.tsx`)
- New card type: `PANCHANGAM_WHATSAPP`
- Supports two sizes: `1080x1920` and `1080x1080` (user selects)
- Download: `canvas.toBlob()` → save PNG
- Share: `navigator.share({ files: [imageFile] })` (Web Share API — works on mobile)
- Deity image: `<img src={/deities/${deityKey}.png} />` drawn onto canvas

#### New page — `web/app/share/panchangam/page.tsx`
- Public URL: `vinaadi.ai/share/panchangam?date=2026-06-11&city=Chennai`
- Static preview of the card (for WhatsApp link preview thumbnail)
- "Download Card" button + "Get your free Jadhagam" CTA

#### Extend — `web/app/panchangam/today/page.tsx`
- Add "Share Today's Card" button below existing Panchangam display
- Opens `PanchangamShareCard` as modal/bottom-sheet with city picker + format selector

#### Extend — `web/app/tools/daily-panchangam-planner/page.tsx`
- Same "Share Today's Card" button addition

#### Extend — `web/app/sitemap.ts`
- Add `/share/panchangam` route

---

## Feature 4 — Friends & Compatibility (Public Tool)

**Goal:** Public tool (no login) where two people enter birth details and get a nakshatra/rasi-based **friendship** compatibility report. Always positively framed. Viral via shareable result card.

### Score bands (never show raw kutta score)
| Score | Label |
|-------|-------|
| 80–100% | Natural Companions |
| 60–79% | Complementary Pair |
| 40–59% | Growth Friends |
| 0–39% | Cosmic Teachers |

### Framing rules (enforced in service — never violate)
- Band "Cosmic Teachers" → always open with: "Every great friendship teaches us something. Here's what you bring out in each other."
- Never output: "incompatible," "avoid," "bad match," "not suitable," "failed"
- Every section must contain at least one positive statement
- Final section is always "Growth Together" — must be uplifting

### Report sections
1. Friendship Score (band label + % range)
2. Communication Style
3. Trust & Loyalty
4. Energy Balance
5. Best Times to Connect (nakshatra timing)
6. Growth Together (always last, always uplifting)
7. Shareable Result Card

### Scoring logic
Reuse `app/services/synastry_service.py` internally.  
Remove marriage-specific kuttas (Rajju, Vedha).  
Weights: Nadi 25%, Rasi 20%, Gana 20%, Nakshatra lord 15%, Bhuta 20%.

### Files to create / modify

#### New file — `app/services/friendship_compatibility_service.py`
- `get_friendship_report(person1_data, person2_data)` → calls `synastry_service.py`
- Translates kutta scores → friendship section text (Tamil + English)
- Maps score to band label
- Returns structured report dict

#### Extend — `app/api/public_tools.py`
- New endpoint: `POST /api/public/friendship-compatibility`
- Request body:
  ```json
  {
    "person1": { "name": "Priya", "birth_date": "2002-05-14", "birth_time": "08:30", "birth_place": "Chennai" },
    "person2": { "name": "Keerthi", "birth_date": "2001-11-22", "birth_time": "14:15", "birth_place": "Coimbatore" }
  }
  ```
- No auth required
- Rate limit: 10 requests / IP / hour

#### New page — `web/app/tools/friendship-compatibility/page.tsx`
- Two-person birth input form (name, date, time, place per person)
- Use existing `PlaceCombobox` component for location autocomplete
- CTA button: "Find Our Friendship Style"
- Results: animated score reveal → 6 expandable sections → share card at bottom

#### New component — `web/components/friendship-result-card.tsx`
- 1080×1080 canvas card
- Shows: both names, both nakshatra/rasi, score band label, one-line description
- Color theme varies by band:
  - Natural Companions: deep green
  - Complementary Pair: deep blue
  - Growth Friends: warm amber
  - Cosmic Teachers: deep purple
- Watermark: "Generated by Vinaadi AI · vinaadi.ai"
- Download + Web Share API button

#### Extend — `web/components/tools-grid.tsx`
- Add "Friends & Compatibility" tool card (icon: two connected stars)
- Links to `/tools/friendship-compatibility`

#### Extend — `web/app/sitemap.ts`
- Add `/tools/friendship-compatibility`

---

## Shared Infrastructure

### Subscription helper (used by Features 2, 3, 4)

#### New or extend — `app/core/subscription.py`
```python
from app.models.subscription import Subscription

def is_premium(user_id: UUID, db: Session) -> bool:
    sub = db.query(Subscription).filter_by(user_id=user_id, status="active").first()
    return sub is not None
```

Used in:
- Ask Vinaadi Lite limit check (Feature 3)
- Life Mode — premium users unlock all modes regardless of other rules (Feature 2)
- Share card — premium users can get watermark-free option (Feature 1)

---

## All Files Touched — Master Checklist

> **Status:** All five features are implemented (2026-06-11). The boxes below reflect the
> original plan; see **Implementation Notes & Deliberate Deviations** above for the few
> items intentionally done differently (Life Mode column, daily-guidance weighting,
> deity placeholders, festival vs rasi-palan card).

### New files to create
- [ ] `app/core/age_gate.py`
- [ ] `app/core/subscription.py` (or extend if it exists)
- [ ] `app/models/ask_vinaadi_usage.py`
- [ ] `app/services/panchangam_card_service.py`
- [ ] `app/services/friendship_compatibility_service.py`
- [ ] `web/components/life-mode-picker.tsx`
- [ ] `web/components/panchangam-share-card.tsx`
- [ ] `web/components/friendship-result-card.tsx`
- [ ] `web/lib/ask-vinaadi-chips.ts`
- [ ] `web/app/tools/friendship-compatibility/page.tsx`
- [ ] `web/app/share/panchangam/page.tsx`
- [ ] `migrations/<timestamp>_add_life_mode_fields.py`
- [ ] `migrations/<timestamp>_add_ask_vinaadi_usage.py`
- [ ] `web/public/deities/surya.png` (and 6 other deity images)

### Existing files to modify
- [ ] `app/models/user.py` — extend `user_mode` allowed values
- [ ] `app/models/user_preference.py` — add `life_mode_set_at`, `show_life_mode_picker`
- [ ] `app/api/share_card.py` — add public panchangam card endpoint
- [ ] `app/api/ask_vinaadi.py` — add limit check + daily-status endpoint
- [ ] `app/api/public_tools.py` — add friendship compatibility endpoint
- [ ] `app/api/settings.py` — add life-mode PATCH/GET endpoints
- [ ] `app/api/life_events.py` — filter minor-blocked events
- [ ] `app/api/predictions.py` — gate marriage predictions for minors
- [ ] `app/schemas/ask_vinaadi.py` — add `is_chip_question`, `chips_remaining`
- [ ] `app/services/daily_guidance_service.py` — accept `life_mode` param
- [ ] `web/components/dashboard-workspace.tsx` — add `isMinor`, `activeLifeMode` state
- [ ] `web/components/dashboard-ask-vinaadi.tsx` — chips UI + limit gate + upgrade interstitial
- [ ] `web/components/dashboard-ask-vinaadi-widget.tsx` — counter badge
- [ ] `web/components/dashboard-daily-snapshot.tsx` — mode badge + tap to change
- [ ] `web/components/dashboard-life-areas-tab.tsx` — mode pin + minor gate
- [ ] `web/components/dashboard-plan-tab.tsx` — minor filter on life events
- [ ] `web/components/dashboard-personal-tab.tsx` — mode-specific guidance framing
- [ ] `web/components/tools-grid.tsx` — add friendship tool card
- [ ] `web/app/panchangam/today/page.tsx` — share card button
- [ ] `web/app/tools/daily-panchangam-planner/page.tsx` — share card button
- [ ] `web/app/sitemap.ts` — add new routes
- [ ] `web/lib/types.ts` — add `isMinor` to profile context type

---

## Recommended Build Order

```
Week 1   Feature 5 (Under-18 gating)
         → age_gate.py + API guards + isMinor prop in workspace

Week 1-2 Feature 2 (Life Mode Picker)
         → DB migration + settings endpoints + life-mode-picker.tsx + dashboard wire-in

Week 2-3 Feature 3 (Ask Vinaadi Lite)
         → AskVinaadiUsage model + limit logic + chip UI + counter badge

Week 3-4 Feature 1 (WhatsApp Panchangam Card)
         → panchangam_card_service.py + canvas card + /share/panchangam page + deity assets

Week 4-5 Feature 4 (Friends & Compatibility)
         → friendship_compatibility_service.py + public page + result card + tools-grid entry
```

---

## Key Design Decisions (already made — do not re-debate)

1. **Age is computed at request time from `birth_date_local`, never stored as a flag.** Auto-upgrades on 18th birthday.
2. **Life Mode is not labelled as an age segment in the UI.** Always framed as "What are you focused on?"
3. **Friendship compatibility uses existing `synastry_service.py` internally.** No new astrological calculations.
4. **Share cards are rendered client-side on canvas** (same pattern as existing `dashboard-share-card.tsx`). Backend only returns data JSON, not images.
5. **Ask Vinaadi chips are pre-written text** sent as normal questions — the backend does not know or care they came from a chip. The `is_chip_question` flag is only for rate-limit accounting.
6. **Friendship score is never shown as a raw percentage.** Always shown as a band label (Natural Companions, Complementary Pair, Growth Friends, Cosmic Teachers).
7. **"Cosmic Teachers" band is never framed negatively.** Framing: "friction creates growth."
8. **Subscription source of truth is `app/models/subscription.py`.** Do not add a separate premium flag to the user model.

---

## How to Brief a New Agent

Paste this at the start of a new session:

> "We are building growth features for Vinaadi AI (Tamil Jothidam app). Load the implementation plan at `docs/GROWTH_FEATURES.md` in the repo root. The repo is at `C:\Users\senth\OneDrive\문서\GitHub\sanstro`. Use PowerShell. We are currently working on Feature [N]. The checklist items marked `[ ]` are not yet done. Pick up from where we left off."

Then update the checklist items in this file to `[x]` as each one is completed.

---

*Last updated: 2026-06-11*
