# VINAADI RULES — Master Reference

This document is the single source of truth for all development rules, cultural constraints, astrological standards, and safety guardrails for Vinaadi AI. Read this before making any change. Every rule here exists because of a real mistake or a deliberate design decision.

---

## 1. ENVIRONMENT & PATH SAFETY

### Repo root — never guess, never substitute
```
C:\Users\senth\OneDrive\문서\GitHub\sanstro
```
The folder name `문서` is Korean and mandatory. Do NOT write `Documents`, `문서`, a Bash path, or any variation. Every command must start from this exact path.

### Shell — PowerShell only
- Use PowerShell for all commands unless user explicitly asks for Bash.
- Chain commands with `;` not `&&` (PowerShell 5.1 does not support `&&`).
- Never use `head` — use `Select-Object -First N`.
- Never use `2>&1` on native executables — stderr is already captured.
- When listing files always exclude `.venv`, `.pytest_cache`, `__pycache__`, `node_modules`.

---

## 2. ENCODING — PREVENT DOUBLE-ENCODING

- Always set `$env:PYTHONIOENCODING = "utf-8"` before running any Python command.
- Always set `$env:PYTHONUTF8 = "1"` before running pytest or any script that outputs Tamil text.
- Files containing Tamil characters must be saved as **UTF-8 without BOM**.
- Never use `Out-File` to write `.py` files — it defaults to UTF-16. Use the Write tool or `Set-Content -Encoding utf8`.
- Never re-encode a file that is already UTF-8. Check the BOM first:
  ```powershell
  [System.IO.File]::ReadAllBytes("path\to\file.py")[0..2]
  # UTF-8 with BOM = 239, 187, 191 — do not re-encode
  # UTF-8 without BOM = first 3 bytes will be actual content
  ```
- The `.env` file uses `env_file_encoding="utf-8"` (set in `app/core/config.py`) — never change this.
- Never run iterative Python scripts to fix encoding. Set the env vars and run once.

---

## 3. DATABASE SAFETY — NEVER LOSE DEV DATA

### DB topology
| DB | Container | Port | Database name | Purpose |
|----|-----------|------|---------------|---------|
| Dev | `slw-postgres` | 5432 | `vinaadi_dev` | Real data — treat as production |
| Test | `slw-postgres-test` | 5433 | `vinaadi_test` | Wipe freely |
| SQLite | n/a | n/a | `pytest_local_test.db` | Offline/CI only |

### Rules — follow without exception
1. **Never run `alembic upgrade head` against `vinaadi_dev`** without first confirming the migration is backwards-safe. Read the migration file before applying.
2. **Never run `DROP TABLE`, `DROP SCHEMA`, or `Base.metadata.drop_all()` against `vinaadi_dev`** — ever.
3. **Never point `JOTHIDAM_DATABASE_URL` at `vinaadi_dev` when running pytest** — `conftest.py` will refuse, but never override or bypass that guard.
4. **Before running tests**, always set the env var to the test DB:
   ```powershell
   $env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
   $env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
   ```
   Or for offline tests:
   ```powershell
   $env:JOTHIDAM_DATABASE_URL = "sqlite:///./pytest_local_test.db"
   ```
5. **Backup dev data before risky work:**
   ```powershell
   docker exec slw-postgres pg_dump -U slw_admin vinaadi_dev > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql
   ```
6. **To restore from backup** use `restore-dev-db.ps1`:
   ```powershell
   .\restore-dev-db.ps1 -BackupFile backup_20260526_1400.sql
   ```
7. `dev.ps1` runs `alembic upgrade head` on startup — this is safe for forward-only migrations. It will NOT drop data. If a migration fails, fix the migration file, do NOT manually drop tables.

### Migration authoring rules
- Every migration must be **reversible** — always fill in the `downgrade()` function.
- Use `render_as_batch=True` in `env.py` for SQLite compatibility (already set).
- Test the migration on the test DB first: apply → verify → downgrade → verify.
- Never use `op.drop_column` or `op.drop_table` on a column/table that still has live data without confirming with the user first.

---

## 4. API PROXY RULES — FRONTEND FETCH CALLS

All frontend API calls **must** go through `apiFetchJson()` from `web/lib/api.ts`. That helper prepends `/api/backend` which routes through the Next.js proxy to the FastAPI backend.

**NEVER** call `fetch('/api/v1/...')` directly — Next.js has no route at that path and it will 404.

```ts
// WRONG — will 404
fetch(`/api/v1/charts/${chartId}/life-events`, { credentials: "include" })

// CORRECT — goes through proxy
apiFetchJson(`/api/v1/charts/${chartId}/life-events`)
```

Components that have violated this rule (fixed or to fix):
- `dashboard-life-events.tsx`
- `dashboard-life-event-log.tsx`
- `dashboard-muhurta-picker.tsx`
- `dashboard-ask-vinaadi.tsx`

### 204 No Content proxy handling
When the backend returns HTTP 204 (e.g., logout), the Next.js proxy must return `null` body — not an empty `ArrayBuffer`. Pattern:
```ts
if (response.status === 204) {
  return new NextResponse(null, { status: 204, headers: responseHeaders });
}
```

---

## 5. TAMIL ASTROLOGY STANDARDS — THIRUKANITHA RULES

These rules apply to ALL astrological calculations, interpretations, and recommendations.

### 5.1 Calculation system
- This app follows **Thirukanitha Panchangam** (scientific ephemeris-based), not Vakiya Panchangam.
- Planetary positions must use the Lahiri ayanamsa (Indian standard sidereal).
- Thirukanitham is the governing source tradition. If "Drik" or "ephemeris" appears elsewhere, it refers only to the calculation method used to implement Thirukanitham accurately.
- All house calculations use the whole-sign house system unless explicitly stated otherwise.
- Dasha system: Vimshottari only (not Yogini or other systems unless user requests).

### 5.2 Transit scoring — Jupiter (Guru Peyarchi)
Jupiter transit houses from Moon (Tamil Thirukanitha standard):

| House from Moon | Classification | Score range | Display colour |
|-----------------|---------------|-------------|----------------|
| 1 | Neutral | 50 | Yellow |
| 2 | Good | 70 | Green |
| 3 | Unfavourable | 35 | Red |
| 4 | Unfavourable | 30 | Red |
| 5 | Very Good | 80 | Green |
| 6 | Unfavourable | 40 | Red |
| 7 | Good (mixed) | 65–70 | Green |
| 8 | Bad | 20 | Red |
| 9 | Very Good | 82 | Green |
| 10 | Neutral | 55 | Yellow |
| 11 | Very Good | 80 | Green |
| 12 | Unfavourable | 35 | Red |

**Jupiter in house 7 from Moon is GOOD — never show red or warning.** Real example that was wrong: Aadhini's Jupiter moving to Kadagam (7th from her Moon) was shown in red — this is incorrect per Thirukanitha.

### 5.3 Transit scoring — Saturn (Sani Peyarchi)
Saturn transit houses from Moon (Tamil Thirukanitha standard — Sade Sati and Ashtama Sani rules apply):

| House from Moon | Classification | Notes |
|-----------------|---------------|-------|
| 1 | Sade Sati (peak) | Caution — major life changes, not necessarily bad |
| 2 | Sade Sati (ending) | Financial caution |
| 3 | Good | Effort rewarded |
| 4 | Unfavourable | Domestic stress |
| 5 | Neutral | |
| 6 | Good | Enemies defeated, hard work pays |
| 7 | Neutral to mixed | |
| 8 | Ashtama Sani — Bad | Health and obstacles — show warning |
| 9 | Unfavourable | Father-related issues, spiritual challenges |
| 10 | Good | Career growth through hard work |
| 11 | Very Good | Financial gains |
| 12 | Sade Sati (beginning) | Expenditure, travel, spiritual |

Sade Sati (houses 12, 1, 2 from Moon) = 7.5-year Saturn cycle. Do NOT present Sade Sati as purely negative — explain both the challenges and the spiritual growth opportunity. Never show a flat "BAD" label for Sade Sati.

### 5.4 Parihara (remedy) recommendations — Tamil Thirukanitha standards
Pariharas must be:
1. **Chart-specific** — based on the afflicted planet, dasha lord, and specific dosha in the chart. Never give identical pariharas to all users.
2. **Tamil temple tradition** — reference specific deities, days, and actions per Tamil practice.
3. **Dasha-lord aware** — the current dasha planet drives the primary parihara.
4. **Dosha-specific** — Shani dosha, Rahu/Ketu dosha, Chevvai dosham, Naga dosha each have distinct pariharas.

Standard parihara table (Tamil tradition):

| Planet | Day | Temple deity | Primary remedy |
|--------|-----|-------------|---------------|
| Sun (Suryan) | Sunday | Surya / Shiva temples | Morning Surya Namaskar, Aditya Hridayam, offer red flowers |
| Moon (Chandran) | Monday | Shiva / Durga | Wear white, offer milk to Shiva, Chandra mantra |
| Mars (Chevvai) | Tuesday | Murugan / Kartikeya | Visit Murugan temple, offer red items, Chevvai parihara at Thiruneermalai |
| Mercury (Budhan) | Wednesday | Vishnu | Green offerings, Vishnu worship, Budha mantra |
| Jupiter (Guru) | Thursday | Brihaspati / Dakshinamurthy | Yellow offerings, Dakshinamurthy worship, Guru mantra |
| Venus (Sukran) | Friday | Lakshmi / Devi | White/pink flowers to Lakshmi, Shukra mantra |
| Saturn (Shani) | Saturday | Shani / Yama | Sesame oil lamp on Saturday, Shani stotram, visit Thirunallar |
| Rahu | — | Durga / Kali | Rahu kalam prayer, Durga worship, nagaprathishta |
| Ketu | — | Ganesha / Murugan | Ketu worship, Ashta Bhuja Durga, spiritual practice |

**Sun parihara specifically** (for weak/afflicted Sun in chart):
- Morning Surya Namaskar (12 rounds) facing east at sunrise
- Recite Aditya Hridayam or Gayatri mantra 108 times
- Offer water (Arghyam) to the sun at sunrise
- Visit Surya temples (Suryanar Koil near Kumbakonam is primary in Tamil Nadu)
- Avoid Sunday fasting unless prescribed by a jyotishi

### 5.5 Retrograde planet rules
- A retrograde planet's effects are **internalized** — the planet's significations turn inward, delays and re-dos are common.
- Never interpret a retrograde planet identically to a direct planet.
- Retrograde in transit: slow the prediction timelines, add "review and reconsider" language.
- Retrograde in natal chart: the person has a unique, non-standard relationship with that planet's themes (e.g., retrograde Saturn = discipline comes from internal drive, not external pressure).
- Never skip noting retrograde status when displaying planetary positions.

### 5.6 Chandrashtama rule
When the Moon transits the natal Moon's nakshatra (and 8th from it), show a caution notice. This is NOT a red error — it is a "proceed carefully" notice.

### 5.7 Positive window after caution
**When showing a CAUTION or unfavourable period, always state when it improves.** Calculate the next transit change or dasha shift that brings improvement and add it to the `outlook` text. Never leave a user without a forward-looking positive statement.

Example:
> "This period shows caution for career moves (44/100). The planetary climate improves after 15 Aug 2026 when Jupiter enters your 9th house. Consider revisiting major decisions then."

### 5.8 How parihara logic must work for ANY user's chart
The parihara engine must analyse each user's chart individually and derive remedies from first principles. It must never give the same remedies to all users.

**Step-by-step logic the engine must follow for every chart:**

1. **Find the current dasha lord** — this planet gets the primary parihara (the most urgent remedy).
2. **Find afflicted planets** — a planet is afflicted if it is:
   - Debilitated (neecha) in the natal chart
   - Combust (within 6° of the Sun)
   - Conjunct or aspected by Rahu, Ketu, or Saturn with no benefic relief
   - Placed in the 6th, 8th, or 12th house with no strength
3. **Check for specific doshas** — flag these if present and recommend the appropriate parihara:
   - Chevvai dosham (Mars in 1st, 2nd, 4th, 7th, 8th, or 12th) → Murugan temple, Mars-specific remedy
   - Shani dosha (Saturn afflicting Lagna, Moon, or Sun) → Saturday sesame oil lamp, Thirunallar
   - Rahu/Ketu dosha (Rahu/Ketu conjunct Moon or Lagna lord) → Sarpa dosha parihara, Rahu kalam prayer
   - Naga dosha → nagaprathishta at specific temples
   - Pitru dosha (Sun afflicted, 9th lord weak) → ancestral rites (Pitru tharpanam), Aditya Hridayam
4. **Sun specifically** — if Sun is weak, debilitated (in Libra/Thula), combust, or afflicted:
   - Prescribe: morning Surya Namaskar (12 rounds facing east at sunrise), Aditya Hridayam recitation, Arghyam (water offering to Sun), visit Suryanar Koil (Kumbakonam)
   - This must be triggered by chart analysis, not hardcoded for any individual
5. **Return the top 2–3 pariharas** ordered by urgency (dasha lord first, then doshas, then afflicted planets).

**Validation rule:** If two different users with completely different charts receive identical parihara recommendations, the logic is broken. Fix it.

---

## 6. CULTURAL & ETHICAL RULES — TAMIL NADU NORMS

These rules must be enforced in both the backend (API level) and frontend (UI level).

### 6.0 Tamil marriage compatibility — Porutham system (10 Poruthams)
Marriage compatibility in Tamil tradition uses the **10 Porutham** system based on the nakshatra (birth star) of both individuals. This is the primary compatibility framework — it is NOT the same as synastry score.

| # | Porutham | What it checks | Weight |
|---|----------|----------------|--------|
| 1 | Dinam | Day star compatibility — daily harmony | Medium |
| 2 | Ganam | Nature (Deva/Manushya/Rakshasa) — temperament match | High |
| 3 | Mahendram | Longevity and prosperity of the couple | High |
| 4 | Sthree Dheergam | Long life of the wife | High |
| 5 | Yoni | Sexual/physical compatibility | Medium |
| 6 | Rasi | Rasi (sign) of both — general compatibility | High |
| 7 | Rasiyathipam | Lords of the Rasi — power compatibility | Medium |
| 8 | Vedha | Obstacles — some nakshatra pairs are forbidden | Critical — must not be violated |
| 9 | Vasya | Influence and attraction | Low |
| 10 | Rajju | Longevity of the husband | Critical — must not be violated |

**Rajju** and **Vedha** are non-negotiable in Tamil tradition — if either fails, the match is traditionally rejected regardless of other scores. Always flag these prominently.

Minimum acceptable poruthams: 6 out of 10. Display total count clearly, not just a percentage.

### 6.1 Relationship type blocks for compatibility matching
**Never compute marriage compatibility between family members.** Block at the service layer in `synastry_service.py` before computing any score.

Blocked relationship pairs for marriage matching:
- `parent` ↔ `child`
- `grandparent` ↔ `grandchild`
- `sibling` ↔ `sibling`
- `uncle`/`aunt` ↔ `nephew`/`niece`

Exception: Cross-cousin marriages are traditional in some Tamil families — do not block `cousin` relationships, but add a note that this is a traditional practice.

**Return a clear error message**, not a score:
> "Marriage compatibility analysis is not applicable for this relationship type."

### 6.2 Marital status — content filtering
- A **married** person must NOT be shown:
  - Marriage prospect windows
  - "Find a life partner" goals
  - Nakshatra-based marriage timing predictions
- Instead show: married life harmony content — 7th house strength, Venus position, relationship compatibility with spouse.
- A **divorced** or **widowed** person may be shown remarriage content but only if they explicitly request it.

### 6.3 Age-gating — mandatory backend enforcement
These checks must exist in the backend service layer, not just the frontend:

| Age | Blocked content |
|-----|----------------|
| Under 16 | Marriage-related content, relationship compatibility |
| Under 18 | Job change windows, career advice |
| Under 14 | Relationship-related content |
| Any age | Career content if student life stage is set and age < 18 |

Return a clear message when blocked:
> "This content is not applicable for the current life stage."

### 6.4 Life-stage appropriate predictions
Predictions and life area guidance must be calibrated to the person's age and life stage:

| Life stage | Age range | Focus areas |
|------------|-----------|-------------|
| Student | < 22 | Education, exams, parental relationships |
| Young adult | 22–35 | Career start, marriage, first home |
| Mid-life | 35–55 | Career advancement, children, health |
| Senior | 55+ | Retirement, health, spiritual, legacy |

Never show the same generic prediction to a 16-year-old student and a 50-year-old professional.

---

## 7. UI/UX RULES

### 7.1 No invisible text on white backgrounds
- Never use `var(--color-surface, #fff)` as a fallback — if the CSS variable is undefined, text becomes white-on-white.
- Always define `--color-surface` in `globals.css` for both light and dark modes.
- Test all form inputs in both light and dark mode before shipping.

### 7.2 Ask Vinaadi — always a floating widget
- Ask Vinaadi must be rendered as a **floating button** (fixed position, bottom-right) that opens an overlay/drawer.
- It must never be buried inside a tab or section that a user might miss.
- The floating button must be visible on every page/tab of the dashboard.

### 7.3 CTA buttons must always have an action
- Every button with text like "See Full Guidance", "Explore", "View More" must have a working `onClick` or `href`.
- If the target section has a scroll ID, verify the ID exists in the DOM before shipping.
- Never merge a button that has `onClick={() => {}}` or no handler.

**"See Full Guidance" specifically:** This CTA on the home/hero card must scroll to the daily guidance section (the detailed panchangam + transit summary below the card). The target element must have `id="personal-daily-guidance"`. The full guidance section should show: today's tithi, nakshatra, yoga, karanam, Rahu kalam, transit summary, and dasha period note — not just the hero summary card.

### 7.4 Dasha timeline colors
- Planet colors must have sufficient contrast against both light and dark backgrounds.
- Never use colors that are visually similar to each other in the same timeline view.
- Score indicators: green = ≥ 65, yellow = 45–64, red = < 45.

### 7.5 Page layout — content distribution
- The Personal/Home tab should show only: hero card + daily guidance + panchangam.
- Dasha timeline, life events, and transits belong on a dedicated "Transits & Events" tab.
- Journal and shadow work belong on the Journal tab.
- Decision support, muhurta, and life event log belong on a dedicated "Planning" tab.
- No single tab should require more than 3 full scrolls to reach the bottom.

---

## 8. DECISION SUPPORT — WHAT IT IS AND HOW IT WORKS

### 8.1 What is Decision Support?
Decision Support helps a user choose between **two specific options** they are already considering. Example: "Should I accept Job Offer A or Job Offer B?" The user must describe both options. The system analyses which option is better aligned with their current planetary period.

**It is NOT a fortune-teller.** It does not predict outcomes. It tells the user which option the planetary climate favours.

### 8.2 What is the What-If Simulator?
The What-If Simulator answers "what would happen if I did X?" for a **single hypothetical action** without a comparison. Example: "What if I start a business in September 2026?" The user describes one scenario and gets a timeline analysis.

**Key difference:**
- Decision Support = compare Option A vs Option B → which is better now?
- What-If = simulate one action → what does the planetary calendar say about this timing?

Both must have clear onboarding text explaining this distinction in the UI. Users are currently confused between the two.

### 8.3 Request schema for `/api/v1/decisions/brief`
The endpoint expects this exact request body:

```json
{
  "chartId": "uuid",
  "optionA": { "label": "string (required)", "description": "string (required)" },
  "optionB": { "label": "string (required)", "description": "string (required)" },
  "priority": "career | family | health | relationship | education | money | spiritual",
  "targetDate": "YYYY-MM-DD"
}
```

The `scenario` field does NOT exist in the backend schema — do not send it.
Both `optionA` and `optionB` require both `label` AND `description`. The UI must collect both.

---

## 9. JOURNAL — SHADOW WORK

Shadow work is a journaling practice based on Jungian psychology adapted for Vedic astrology. It uses the Rahu/Ketu axis, 8th house, and 12th house placements to generate introspective questions about hidden fears, unconscious patterns, and karmic themes.

- Shadow work prompts must be chart-specific (not generic).
- Use Rahu sign/house for "what you chase but fear", Ketu for "what you abandon but need".
- 8th house lord placement drives the shadow theme.
- All shadow journal API calls must use `apiFetchJson()` — never raw `fetch('/api/v1/...')`.

---

## 10. EVENT TYPES — LIFE EVENT LOG

The full set of valid event types for the life event log:

```
JOB_CHANGE, PROMOTION, DEMOTION, JOB_LOSS,
RELATIONSHIP_START, RELATIONSHIP_END, MARRIAGE, DIVORCE, REMARRIAGE,
RELOCATION, TRAVEL_ABROAD,
HEALTH_EVENT, SURGERY, RECOVERY,
EXAM_RESULT, EDUCATION_START, EDUCATION_END,
FINANCIAL_MILESTONE, INVESTMENT, PROPERTY_PURCHASE, DEBT,
FAMILY_LOSS, BIRTH_OF_CHILD,
BUSINESS_START, BUSINESS_END,
SPIRITUAL_EVENT, PILGRIMAGE, INITIATION,
LEGAL_MATTER,
OTHER
```

Both `app/schemas/life_event_log.py` (`VALID_EVENT_TYPES`) and the frontend dropdown in `dashboard-life-event-log.tsx` must always be in sync.

---

## 11. KNOWN BUG REGISTRY

These bugs have been identified and must be fixed. Do not close this list entry until the fix is verified in the running app.

| ID | Bug | Root cause | File(s) | Status |
|----|-----|-----------|---------|--------|
| B-01 | All 404s: life-events, life-event-log, muhurta, ask | Raw `fetch('/api/v1/...')` bypasses proxy | dashboard-life-events.tsx, dashboard-life-event-log.tsx, dashboard-muhurta-picker.tsx, dashboard-ask-vinaadi.tsx | Open |
| B-02 | Decision Support 422 | Request body sends wrong fields (scenario, optionALabel) instead of optionA/optionB objects | dashboard-decision-panel.tsx | Open |
| B-03 | Logout 500 | Proxy passes empty ArrayBuffer for 204 responses to NextResponse | web/app/api/backend/[...path]/route.ts | Open |
| B-04 | See Full Guidance CTA does nothing | Scroll target ID `personal-daily-guidance` missing from DOM | dashboard-personal-tab.tsx | Open |
| B-05 | Jupiter 7th from Moon shows red warning | House scoring classifies 7th too low | daily_guidance_service.py | Open |
| B-06 | Family member marriage matching not blocked | synastry_service.py has no relationship-type check | synastry_service.py | Open |
| B-07 | Married person sees marriage goals | No marital_status check in life areas service | life_areas_service.py | Open |
| B-08 | Underage users see age-inappropriate content | Age-gating only in frontend, not enforced in backend | life_areas_service.py | Open |
| B-09 | Caution analysis has no forward-looking window | outlook text ends at caution, no "improves on X date". Real example: "Analysis for Job Change around 31 July 2026: Caution (44/100). Consider postponing." — never says WHEN it will be good. | life_areas_service.py | Open |
| B-10 | Shadow work journal 404 | Raw fetch without /api/backend prefix | dashboard-journal components | Open |
| B-11 | White bg inputs invisible in light theme | CSS var fallback `#fff` shows white text on white bg | globals.css, affected components | Open |
| B-12 | Ask Vinaadi not accessible — buried in layout | Component not rendered in dashboard-workspace.tsx | dashboard-workspace.tsx | Open |
| B-13 | Predictions not age/life-stage personalized | No age parameter passed to prediction services | predictions service | Open |
| B-14 | Event type dropdown missing many values | Only 10 types defined; need 30+ | life_event_log.py schema + frontend | Open |
| B-15 | Pariharas generic, not chart-specific | Hardcoded generic remedies in narrative_engine.py | narrative_engine.py | Open |

---

## 12. WHAT NOT TO DO — ANTI-PATTERNS

| Don't | Why | Do instead |
|-------|-----|-----------|
| Use `fetch('/api/v1/...')` in frontend | Next.js has no handler at that path → 404 | Use `apiFetchJson('/api/v1/...')` |
| Fix encoding with a Python script | Creates double-encoding, corrupts Tamil text | Set `PYTHONIOENCODING=utf-8` env var |
| Drop or truncate any table in vinaadi_dev | Real user data — irreversible | Back up first, use test DB for schema work |
| Show marriage content to family member pairs | Culturally inappropriate | Block at service layer, return clear error |
| Show a caution period without a positive window | Leaves user without hope or guidance | Always add "improves on [date]" |
| Merge a button with no onClick/href | Dead UX, breaks trust | Wire the action before merging |
| Apply identical predictions to all users | Not personalized, not meaningful | Filter by age, marital status, life stage |
| Give generic pariharas not matching the chart | Wrong astrological advice | Use chart-specific dosha + dasha-lord pariharas |
| Score Jupiter 7th from Moon as bad | Incorrect per Thirukanitha | Score as 65–70 (good/mixed) |
| Use `Out-File` to write Tamil text files | Writes UTF-16 BOM, breaks Python | Use Write tool or `Set-Content -Encoding utf8` |
| Run `alembic upgrade head` on vinaadi_dev without review | May run destructive migrations | Read migration file first, test on vinaadi_test |
| Send `scenario` or `optionALabel` to `/decisions/brief` | Schema mismatch → 422 | Send `optionA: { label, description }` objects |
| Pass empty ArrayBuffer as 204 response body | NextResponse constructor error | Return `new NextResponse(null, { status: 204 })` |

---

## 13. JATHAGAM KATTAM — CHART DISPLAY REQUIREMENTS

### 13.1 What is Jathagam Kattam?
Jathagam Kattam (ஜாதகம் கட்டம்) is the traditional South Indian square birth chart grid. It is the standard chart format used in Tamil astrology — NOT the North Indian circular/diamond format. Every chart displayed in Vinaadi must use this format.

### 13.2 Single chart view
Any user must be able to generate and view the Jathagam Kattam for:
- Their own chart
- Any chart in their family vault
- Any chart they have access to

**The chart must show:**
- All 12 houses in the South Indian square grid layout
- Planet abbreviations in Tamil and English (e.g., சூ/Su for Sun, சந்/Mo for Moon, செ/Ma for Mars, etc.)
- Lagna (Ascendant) marked clearly — typically with a diagonal line or "லக்னம்" label in the Lagna house
- Rasi (sign) number or name in each house
- All 9 grahas placed in their correct houses (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu)
- Dasha balance at birth shown below the chart
- Option to download or share the chart as an image

**South Indian grid layout (fixed house positions):**

```
┌──────────┬──────────┬──────────┬──────────┐
│  12      │   1      │   2      │   3      │
│ (Pisces) │ (Aries)  │(Taurus)  │(Gemini)  │
├──────────┼──────────┼──────────┼──────────┤
│  11      │          │          │   4      │
│(Aquarius)│          │          │ (Cancer) │
├──────────┼──────────┼──────────┼──────────┤
│  10      │          │          │   5      │
│(Capricorn│          │          │  (Leo)   │
├──────────┼──────────┼──────────┼──────────┤
│   9      │   8      │   7      │   6      │
│(Sagittar)│(Scorpio) │ (Libra)  │ (Virgo)  │
└──────────┴──────────┴──────────┴──────────┘
```
Note: The fixed signs in the grid never change. The Lagna house shifts based on the birth Rasi — the planets are placed into whichever house corresponds to their sign.

### 13.3 Two-chart side-by-side marriage comparison view
When comparing two charts for marriage compatibility, both Jathagam Kattams must be shown side by side with the compatibility analysis.

**Layout:**
- Left chart: Person 1 (name + DOB shown above)
- Right chart: Person 2 (name + DOB shown above)
- Below both charts: Porutham table (all 10 poruthams with pass/fail for each — see Section 6.0)
- Prominent display of: total poruthams passed (e.g., "7 / 10"), Rajju status, Vedha status
- If Rajju or Vedha fails: show a clear warning block — do not hide it
- Dasha compatibility note: whether both are in compatible dasha periods

**This view must be accessible from:**
- The family vault when selecting two members
- The compatibility/synastry section
- A dedicated "Compare Charts" button that accepts any two chart IDs

### 13.4 Chart generation rules
- Chart must be generated from the stored birth data (date, time, place) using the same ephemeris as the rest of the app (Lahiri ayanamsa, Thirukanitha standard).
- If birth time is unknown or approximate, show a note: "Birth time not confirmed — Lagna may be inaccurate."
- Charts must render correctly on both mobile and desktop.
- The chart grid must never be replaced with a list or table format — the visual kattam is required.

---

*Last updated: 2026-05-27*
*This document must be updated whenever a new rule, bug, or constraint is identified.*
