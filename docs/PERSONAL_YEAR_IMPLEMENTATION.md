# Personal Year Implementation Guide

## Overview

Personal Year is a **9-year numerology cycle** showing what theme/energy a person is in. It has three nested levels:
- **Personal Year** (annual theme)
- **Personal Month** (monthly sub-theme)  
- **Personal Day** (daily nuance)

This document explains how to add meanings to all three levels across both **marketing calculator** and **dashboard**.

---

## What Changed

### 1. New Backend File
- **`app/services/numerology_personal_year_content.py`** — Contains meanings for years 1-9
- Each has: `theme`, `action`, `watch` (what to be careful of), `month_hint`
- Both English and Tamil versions
- Gated behind `CONTENT_REVIEWED` flag (just like root readings)

---

## Implementation Steps

### Phase 1: Schema Updates (Backend)

**File:** `app/schemas/numerology.py`

Add to `PersonalCycleResponse`:

```python
@dataclass
class PersonalYearMeaning(BaseModel):
    """Meaning for a personal year/month/day number."""
    number: int
    theme_en: str
    theme_ta: str
    action_en: str
    action_ta: str
    watch_en: str
    watch_ta: str
    month_hint_en: str
    month_hint_ta: str


@dataclass
class PersonalCycleResponse(BaseModel):
    # ... existing fields ...
    year: PersonalYearData
    month: NumberReadingWithMeaning  # NEW
    day: NumberReadingWithMeaning    # NEW
    readingsAvailable: bool  # ADD THIS — was missing before
```

Where `NumberReadingWithMeaning` is:

```python
@dataclass
class NumberReadingWithMeaning(BaseModel):
    reading: NumberReading
    meaning: PersonalYearMeaning | None  # None if CONTENT_REVIEWED=False
```

### Phase 2: API Route Updates

**File:** `app/api/numerology.py` (authenticated route)

```python
from app.services.numerology_personal_year_content import personal_year_meaning

@router.get("/charts/{chart_id}/numerology/personal-cycle")
async def get_personal_cycle(chart_id: str, on_date: str = None):
    # ... existing code ...
    
    # Add meanings if reviewed
    result = PersonalCycleResponse(
        year=year_data,
        month=NumberReadingWithMeaning(
            reading=month_reading,
            meaning=personal_year_meaning(month_reading.root) if CONTENT_REVIEWED else None
        ),
        day=NumberReadingWithMeaning(
            reading=day_reading,
            meaning=personal_year_meaning(day_reading.root) if CONTENT_REVIEWED else None
        ),
        readingsAvailable=readings_available(chart_id),
    )
    return result
```

Do the same for:
- `app/api/public_tools.py` → `public_personal_year` route

### Phase 3: Frontend — Calculator (Marketing Site)

**Files:** `web/app/tools/numerology-calculator/NumerologyCalculatorContent.tsx`

In `PersonalYearTool` component (around line 815):

```tsx
// After getting the result, show meanings
{result ? (
  <>
    <p className="cl-num-window">
      {ta ? "இந்த ஆண்டு நடப்பது" : "This year runs"} · {result.year.cycleStart} → {result.year.cycleEnd}
    </p>
    
    <div className="cl-num-results">
      {/* Year meaning */}
      <ReadingBlock ... />
      
      {/* ADD: Year meaning card */}
      {result.year.meaning && (
        <PersonalYearMeaningCard
          meaning={result.year.meaning}
          label={ta ? "இதுவரை தெரிந்தவை" : "What this year is about"}
          ta={ta}
        />
      )}
      
      {/* Month & Day readings + meanings */}
      <ReadingBlock
        reading={result.month}
        label={ta ? "தனிப்பட்ட மாதம்" : "Personal month"}
        ta={ta}
      />
      {result.month.meaning && <PersonalYearMeaningCard meaning={result.month.meaning} ta={ta} />}
    </div>
  </>
) : null}
```

**Add new component:** `web/components/PersonalYearMeaningCard.tsx`

```tsx
export function PersonalYearMeaningCard({
  meaning,
  label,
  ta,
}: {
  meaning: PersonalYearMeaning;
  label?: string;
  ta: boolean;
}) {
  return (
    <div className="cl-num-meaning">
      {label && <span className="cl-num-meaning__label">{label}</span>}
      
      <div className="cl-num-meaning__theme">
        <strong>{ta ? "கருப்பொருள்" : "Theme"}</strong>
        <p>{ta ? meaning.theme_ta : meaning.theme_en}</p>
      </div>
      
      <div className="cl-num-meaning__action">
        <strong>{ta ? "செய்ய வேண்டியவை" : "Action"}</strong>
        <p>{ta ? meaning.action_ta : meaning.action_en}</p>
      </div>
      
      <div className="cl-num-meaning__watch">
        <strong>{ta ? "கவனிக்க வேண்டியவை" : "Watch for"}</strong>
        <p>{ta ? meaning.watch_ta : meaning.watch_en}</p>
      </div>
    </div>
  );
}
```

### Phase 4: Frontend — Dashboard

**File:** `web/components/dashboard-numerology-cycle-nova.tsx` (around line 189)

```tsx
{/* Year meaning card */}
{data.year.meaning && (
  <Card variant="soft" style={{ gap: "var(--space-2)" }}>
    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", textTransform: "uppercase" }}>
      {isTamil ? "இந்தக் கட்டத்தின் கருப்பொருள்" : "The theme of this period"}
    </div>
    <p style={{ fontSize: "var(--text-sm)" }}>
      {isTamil ? data.year.meaning.theme_ta : data.year.meaning.theme_en}
    </p>
    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
      <strong>{isTamil ? "செய்ய வேண்டியவை: " : "Focus on: "}</strong>
      {isTamil ? data.year.meaning.action_ta : data.year.meaning.action_en}
    </p>
  </Card>
)}
```

---

## Visual Structure

### Marketing Calculator
```
┌─────────────────────────────┐
│ Personal Year: 5 (Mercury)  │
│ 2026-07-29 → 2027-07-28    │
├─────────────────────────────┤
│ Theme: Change, travel...    │
│ Action: Embrace movement... │
│ Watch for: Don't scatter... │
├─────────────────────────────┤
│ Monthly calculation...      │
├─────────────────────────────┤
│ Daily calculation...        │
└─────────────────────────────┘
```

### Dashboard
```
┌──────────────────────────────┐
│ Personal Cycle               │
├──────────────────────────────┤
│ ┌────────────────────────────┐│
│ │ Current Personal Year: 5   ││
│ │ Mercury · 2026-07-29 →...  ││
│ └────────────────────────────┘│
│                              │
│ Theme: Change, travel...     │
│ Focus on: Embrace movement...│
├──────────────────────────────┤
│ [Year Card] [Month] [Day]   │
│ 5 · Mercury | 3 · Jupiter...│
└──────────────────────────────┘
```

---

## CSS Needed

**File:** `web/styles/numerology.css` (or relevant theme file)

```css
.cl-num-meaning {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-background-soft);
  border-radius: var(--radius-md);
}

.cl-num-meaning__theme,
.cl-num-meaning__action,
.cl-num-meaning__watch {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.cl-num-meaning__theme strong,
.cl-num-meaning__action strong,
.cl-num-meaning__watch strong {
  font-size: var(--text-xs);
  color: var(--color-faint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cl-num-meaning__theme p,
.cl-num-meaning__action p,
.cl-num-meaning__watch p {
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text);
}
```

---

## Testing Checklist

- [ ] Backend: Meaning data loads without `CONTENT_REVIEWED=True` (should show null)
- [ ] Calculator: Year/month/day numbers display correctly
- [ ] Calculator: Meanings appear once `CONTENT_REVIEWED=True` in content file
- [ ] Dashboard: Personal cycle section shows meanings
- [ ] Dashboard: Month/day hints explain the calculation chain
- [ ] Both: Tamil text displays correctly (no encoding issues)
- [ ] Both: Readings withheld note appears when meanings unavailable
- [ ] E2E: Submit date, verify year/month/day calculate and meanings render

---

## Deployment Sequence

1. **Deploy backend schema + routes** (meanings initially null)
2. **Deploy frontend components** (gracefully handle null meanings)
3. **Set `CONTENT_REVIEWED = True`** in `numerology_personal_year_content.py` once reviewed
4. **Verify meanings render** on both sites

---

## Why This Structure

| Aspect | Reason |
|--------|--------|
| Nested response (`meaning` on each level) | Users need to know *what* each number means, not just calculate it |
| Action + Watch for + Theme | "Actionable" meanings — what to do, not just character |
| Month hints | Explains why month/day change when you check different dates |
| Bilingual | Core to this product |
| Gated by review flag | Tamil + astrologer review needed before shipping |

---

## Next: Phase 5 (Future)

Once meanings are live and reviewed:
- Add "Personal Year Almanac" (comprehensive reference for all 9 years)
- Add "Next 9 years" view showing full cycle ahead
- Premium: Add remedies tied to current year's theme
