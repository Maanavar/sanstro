# Personal Year Implementation — Action Plan

## ✅ What's Done

- [x] **Content File Created** — `app/services/numerology_personal_year_content.py`
  - All 9 meanings (theme, action, watch, hints)
  - Bilingual (EN + TA)
  - Gated by `CONTENT_REVIEWED` flag

- [x] **Documentation** 
  - `docs/PERSONAL_YEAR_IMPLEMENTATION.md` — Full technical guide with code
  - `PERSONAL_YEAR_SUMMARY.md` — Overview & decision rationale
  - Visual reference guide (interactive 1-9 card display)

---

## 📋 Implementation Checklist

### Phase 1: Backend Schema
- [ ] Open `app/schemas/numerology.py`
- [ ] Add `PersonalYearMeaning` dataclass
- [ ] Add `meaning` field to year/month/day in `PersonalCycleResponse`
- [ ] Add `readingsAvailable: bool` field (was missing)
- [ ] Run tests: `pytest tests/test_numerology_core.py -xvs`

### Phase 2: Backend Routes — Authenticated
- [ ] Open `app/api/numerology.py`
- [ ] Find `get_personal_cycle` route (for `/charts/{id}/numerology/personal-cycle`)
- [ ] Add meaning lookup before returning response
- [ ] Import: `from app.services.numerology_personal_year_content import personal_year_meaning`

### Phase 3: Backend Routes — Public
- [ ] Open `app/api/public_tools.py`
- [ ] Find `public_personal_year` route
- [ ] Add same meaning lookup logic
- [ ] Run tests: `pytest tests/test_numerology_chart_api.py -k personal -xvs`

### Phase 4: Frontend Components
- [ ] Create `web/components/PersonalYearMeaningCard.tsx`
- [ ] Copy component from `docs/PERSONAL_YEAR_IMPLEMENTATION.md` (Phase 4)
- [ ] Add to shared numerology components

### Phase 5: Marketing Calculator
- [ ] Open `web/app/tools/numerology-calculator/NumerologyCalculatorContent.tsx`
- [ ] In `PersonalYearTool` (line ~815), add meaning cards
- [ ] Wire up: `{result.year.meaning && <PersonalYearMeaningCard ... />}`
- [ ] Test in browser: `npm run dev`, visit `/tools/numerology-calculator`
- [ ] Check: Year/month/day numbers show + meanings appear (if reviewed)

### Phase 6: Dashboard
- [ ] Open `web/components/dashboard-numerology-cycle-nova.tsx`
- [ ] Around line 189, add meaning card display
- [ ] Show theme + action in the cycle card
- [ ] Test in signed-in dashboard
- [ ] Verify month/day hints explain the calculation chain

### Phase 7: Testing
- [ ] **Locally**: Set `CONTENT_REVIEWED = False` → meanings should be null
- [ ] **Locally**: Set `CONTENT_REVIEWED = True` → meanings should appear
- [ ] **Browser**: Calculator shows all three levels (year/month/day)
- [ ] **Browser**: Dashboard shows current cycle with guidance
- [ ] **TypeScript**: No errors in build
- [ ] **Mobile**: Meanings stack correctly on small screens

### Phase 8: Review & Launch
- [ ] Send meanings to Tamil native speaker for review
- [ ] Send meanings to astrologer for sign-off on framing
- [ ] Get approval on both EN + TA versions
- [ ] Set `CONTENT_REVIEWED = True` in `numerology_personal_year_content.py`
- [ ] Deploy to production
- [ ] Verify on live site that meanings appear

---

## 🔍 Testing Commands

```bash
# Backend tests
pytest tests/test_numerology_core.py -xvs
pytest tests/test_numerology_chart_api.py -k personal -xvs

# Frontend build
npm run build --filter=web

# Dev server
npm run dev

# Type check
npm run tsc --filter=web
```

---

## 🎯 Key Implementation Points

### 1. Schema Update
```python
@dataclass
class PersonalYearMeaning(BaseModel):
    number: int
    theme_en: str
    theme_ta: str
    action_en: str
    action_ta: str
    watch_en: str
    watch_ta: str
    month_hint_en: str
    month_hint_ta: str

# Add to PersonalCycleResponse:
year: PersonalYearData
month: NumberReadingWithMeaning  # NEW
day: NumberReadingWithMeaning    # NEW
readingsAvailable: bool          # NEW
```

### 2. Route Update
```python
# Before returning, add meanings:
result = PersonalCycleResponse(
    year=year_data,
    month=NumberReadingWithMeaning(
        reading=month_reading,
        meaning=personal_year_meaning(month_reading.root) 
                if CONTENT_REVIEWED else None
    ),
    day=NumberReadingWithMeaning(
        reading=day_reading,
        meaning=personal_year_meaning(day_reading.root) 
                if CONTENT_REVIEWED else None
    ),
    readingsAvailable=readings_available(chart_id),
)
```

### 3. Frontend Display
```tsx
{/* Show meaning if available */}
{result.year.meaning && (
  <PersonalYearMeaningCard
    meaning={result.year.meaning}
    label="What this year is about"
    ta={ta}
  />
)}

{/* Show calculation hint */}
<p className="hint">
  {`birth day + birth month + ${data.year.governingYear}`}
</p>
```

---

## ⚠️ Common Pitfalls

1. **Forgetting `readingsAvailable` field**
   - Users won't know why meanings are missing
   - Add the field to schema + set it from `readings_available(chart_id)`

2. **Showing meanings before review**
   - Check `CONTENT_REVIEWED` flag in both routes
   - Return `null` if `False`

3. **Not explaining the calculation**
   - Show hints: `birth day + birth month + year`
   - Users need to understand *where* the number comes from

4. **Month/day hints not dynamic**
   - Month hint should show: `year number + calendar month`
   - Day hint should show: `month number + day of month`

5. **Forgetting dashboard vs calculator differ**
   - Calculator: shows all working, more detail
   - Dashboard: shows current period, more actionable
   - Both need meanings, but presentation differs

---

## 📞 Support

**Stuck on schema?** → See Phase 1 in `docs/PERSONAL_YEAR_IMPLEMENTATION.md`

**Stuck on routes?** → See Phase 2/3 in implementation guide

**Stuck on UI?** → See Phase 4/5/6 with full React code

**Testing?** → Check `tests/test_numerology_chart_api.py` for patterns

---

## 🚀 Quick Start

1. Read this file ← **you are here**
2. Open `docs/PERSONAL_YEAR_IMPLEMENTATION.md`
3. Start with **Phase 1** (schema)
4. Follow each phase in order
5. Test locally before moving to next phase
6. Send for review once all phases done

---

## Timeline Estimate

- **Phase 1-2 (Backend)**: 2-3 hours
- **Phase 3 (Public API)**: 30 mins
- **Phase 4 (Component)**: 1 hour
- **Phase 5 (Calculator)**: 1.5 hours
- **Phase 6 (Dashboard)**: 1.5 hours
- **Phase 7 (Testing)**: 1 hour
- **Phase 8 (Review)**: ~1 week (pending reviewer)

**Total dev time**: ~8-9 hours

---

## Files You'll Touch

```
✏️ app/schemas/numerology.py
✏️ app/api/numerology.py
✏️ app/api/public_tools.py
✨ web/components/PersonalYearMeaningCard.tsx (NEW)
✏️ web/app/tools/numerology-calculator/NumerologyCalculatorContent.tsx
✏️ web/components/dashboard-numerology-cycle-nova.tsx
✨ web/styles/numerology.css (maybe)
```

---

## After Launch

- Monitor for user feedback on meaning clarity
- If meanings are confusing, iterate before next review cycle
- Collect feedback for future phases (personalized remedies, etc.)

---

**Ready to start Phase 1?** Open `docs/PERSONAL_YEAR_IMPLEMENTATION.md` and begin with the schema update.
