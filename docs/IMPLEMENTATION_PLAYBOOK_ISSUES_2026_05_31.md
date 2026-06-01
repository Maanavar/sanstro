# Vinaadi AI — Implementation Playbook
**Date:** 2026-05-31  
**Scope:** 12 issues identified from UX review + bug reports  
**Repo root:** `C:\Users\senth\OneDrive\문서\GitHub\sanstro`  
**Shell:** PowerShell 5.1 — use `;` not `&&`, no `head`, no `2>&1` on native exes

---

## How to use this document

Work through issues in priority order (listed below). Each issue section contains:
- **What is broken** — exact observed behaviour
- **Root cause** — traced to specific file + line
- **Exact fix** — every file to change, every line to add/edit, with code
- **Test checklist** — how to verify the fix is complete

**Priority order to work in:**

| Order | Issue | Status | Notes |
|-------|-------|--------|-------|
| 1 | #5 Life Event Log 500 error | ✅ DONE | Migration applied to vinaadi_dev (2026-05-31); `deleted_at` filter added to service |
| 2 | #6 SPIRITUAL activity 422 | ✅ DONE | SPIRITUAL added to `_ACTIVITY_LORDS` and `_ACTIVITY_HOUSES`; schema description updated |
| 3 | #2 DOB year validation | ✅ DONE | Backend validator in `birth_profiles.py`; frontend `min`/`max` guard in `porutham-panel.tsx` via `web/lib/birth-date.ts` |
| 4 | #8 Transit page duplicate date | ✅ DONE | `formatHeaderDate` and date pill removed from `dashboard-transits-tab.tsx` |
| 5 | #4 CTA visibility | ✅ DONE | `Button` component has inline `fallbackStyle` with explicit hex colors; overrides landing-page CSS |
| 6 | #3 Porutham context logic | ✅ DONE | `_contextualize_porutham_result()` filters kutas by context mask in `synastry_service.py`; context-aware summary text |
| 7 | #9 Life-area age/stage filtering | ❌ TODO | `_compute_age` exists but `_age_phase`, `_PHASE_RELEVANT_AREAS`, `_PHASE_SKIP_REASON` not implemented |
| 8 | #10 Goals wired to output | ✅ DONE | `isGoalFocus` flag set in service; "Your focus" badge in `life-area-card.tsx`; green banner in Goals sub-tab |
| 9 | #7 Save reminder — no backend | ❌ TODO | Button exists in `dashboard-personal-tab.tsx` but `app/api/reminders.py` does not exist — silent failure in prod |
| 10 | #11 Muhurta as own sub-tab | ✅ DONE | "Muhurta" sub-tab added; "Timing" renamed "Best Dates"; `DashboardMuhurtaPicker` moved with description header |
| 11 | #12 Richer reasoning text | ❌ TODO | Generic reasoning strings still used; `_build_area_reason` with planet/house/dasha detail not implemented |
| 12 | #1 PDF for Porutham | ✅ DONE | `generate_porutham_pdf()` in `pdf_export_service.py`; `POST /relationships/compare/pdf` route; Download PDF button in `porutham-panel.tsx` |

---

## Environment setup before any coding session

```powershell
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro'
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
# Test DB — use for all migration testing
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"
```

Never run `alembic upgrade head` against `vinaadi_dev` without user confirmation. Always test on `vinaadi_test` (port 5433) first.

---

---

# ISSUE 1 — PDF Export for Marriage Compatibility
**Priority:** 12 (do last — new feature)

## What is broken
The Porutham (compatibility) panel shows results on screen but has no way to download or share them. The existing PDF export only covers the Jadhagam (birth chart).

## Files involved
- `app/services/pdf_export_service.py` — existing PDF generator to extend or model from
- `app/api/relationships.py` — add new route here
- `app/schemas/relationships.py` — no change needed (reuse existing DirectPoruthamData)
- `web/components/porutham-panel.tsx` — add Download button after results appear

## Backend changes

### Step 1 — Create PDF generation function

In `app/services/pdf_export_service.py`, add a new function at the bottom:

```python
def generate_porutham_pdf(porutham: "DirectPoruthamData", name_a: str, name_b: str) -> bytes:
    """
    Generate a single-page A4 PDF for a Porutham compatibility result.
    Returns raw PDF bytes.
    """
    from io import BytesIO
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=18*mm, bottomMargin=18*mm)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle("title", parent=styles["Heading1"],
                                 fontSize=18, textColor=colors.HexColor("#B85A2C"),
                                 spaceAfter=4)
    story.append(Paragraph("Porutham — Compatibility Report", title_style))
    story.append(Paragraph(f"{name_a}  ×  {name_b}", styles["Normal"]))
    story.append(Spacer(1, 8*mm))

    # Score header
    pct = round(porutham.totalScore / max(1, porutham.maxScore) * 100)
    score_color = "#5C7654" if pct >= 70 else "#B85A2C" if pct >= 40 else "#A8482F"
    score_style = ParagraphStyle("score", parent=styles["Normal"],
                                 fontSize=28, textColor=colors.HexColor(score_color),
                                 spaceAfter=2)
    story.append(Paragraph(f"{porutham.totalScore} / {porutham.maxScore}", score_style))
    story.append(Paragraph(f"{porutham.label}  ·  {pct}%", styles["Normal"]))
    story.append(Spacer(1, 4*mm))

    # Dosha warnings
    if porutham.rajjuDosha:
        story.append(Paragraph("⚠ Rajju Dosha present", styles["Normal"]))
    if porutham.vedhaDosha:
        story.append(Paragraph("⚠ Vedha Dosha present", styles["Normal"]))
    story.append(Spacer(1, 4*mm))

    # Summary
    story.append(Paragraph(porutham.summary.en, styles["Normal"]))
    if porutham.contextNote:
        story.append(Spacer(1, 2*mm))
        story.append(Paragraph(porutham.contextNote.en, styles["Italic"]))
    story.append(Spacer(1, 6*mm))

    # Kuta breakdown table
    story.append(Paragraph("Kuta Breakdown", styles["Heading2"]))
    table_data = [["Kuta", "Score", "Max", "Result"]]
    for k in porutham.kutas:
        kpct = round(k.score / max(1, k.maxScore) * 100)
        result = "Good" if kpct >= 70 else "Moderate" if kpct >= 40 else "Weak"
        table_data.append([k.name, str(k.score), str(k.maxScore), result])

    tbl = Table(table_data, colWidths=[90*mm, 25*mm, 25*mm, 30*mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F4EEE2")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#3D352B")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAF5EA")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D4C8AE")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 6*mm))

    # Footer
    from datetime import date
    footer_style = ParagraphStyle("footer", parent=styles["Normal"],
                                  fontSize=7, textColor=colors.HexColor("#7A6F5E"))
    story.append(Paragraph(
        f"Generated by Vinaadi · Thirukanitham Jyotish · {date.today().isoformat()}",
        footer_style
    ))

    doc.build(story)
    return buf.getvalue()
```

### Step 2 — Add PDF route to relationships API

In `app/api/relationships.py`, add this import at the top:

```python
from fastapi.responses import Response
```

Add this route after the existing `compare_charts` route:

```python
@router.post("/relationships/compare/pdf", tags=["relationships"])
def compare_charts_pdf(
    payload: DirectCompareRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Return a PDF of the porutham result for two charts."""
    from app.schemas.relationships import VALID_COMPATIBILITY_CONTEXTS
    from app.services.pdf_export_service import generate_porutham_pdf
    from app.services.chart_service import load_persisted_chart_response

    if payload.compatibility_context not in VALID_COMPATIBILITY_CONTEXTS:
        raise HTTPException(status_code=422, detail=f"compatibilityContext must be one of: {sorted(VALID_COMPATIBILITY_CONTEXTS)}")

    result = compare_charts_direct(
        session,
        current_user.user_id,
        payload.chart_id_a,
        payload.chart_id_b,
        compatibility_context=payload.compatibility_context,
    )

    # Fetch display names
    try:
        snap_a = load_persisted_chart_response(session, payload.chart_id_a)
        name_a = snap_a.data.birthProfile.displayName
    except Exception:
        name_a = "Person A"
    try:
        snap_b = load_persisted_chart_response(session, payload.chart_id_b)
        name_b = snap_b.data.birthProfile.displayName
    except Exception:
        name_b = "Person B"

    pdf_bytes = generate_porutham_pdf(result.data, name_a, name_b)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="porutham_{name_a}_{name_b}.pdf"'},
    )
```

## Frontend changes

In `web/components/porutham-panel.tsx`, find the results section (around line 267 where `{porutham && chartA && chartB && (`). Inside that block, after the "Kuta breakdown" card and before the "Side-by-side charts" block, add:

```tsx
{/* Download PDF */}
<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
  <button
    type="button"
    onClick={() => {
      if (!chartA || !chartB || !porutham) return;
      fetch("/api/v1/relationships/compare/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartIdA: chartA.chartId,
          chartIdB: chartB.chartId,
          compatibilityContext: compatCtx,
        }),
      })
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `porutham_${chartA.birthProfile.displayName}_${chartB.birthProfile.displayName}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        })
        .catch(() => {});
    }}
    style={{
      padding: "8px 20px",
      borderRadius: "10px",
      border: `1px solid ${W.borderLt}`,
      background: W.surface,
      color: W.inkMid,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "0.875rem",
      fontFamily: "inherit",
    }}
  >
    {lang === "ta" ? "PDF பதிவிறக்கம்" : "Download PDF"}
  </button>
</div>
```

## Test checklist
- [ ] Enter details for two persons, click Check Compatibility
- [ ] Click Download PDF — browser should download a `.pdf` file
- [ ] Open PDF — verify names, score, kuta table, dosha warnings are correct
- [ ] Test with MARRIAGE context and BUSINESS context — both should produce PDFs

---

---

# ISSUE 2 — DOB Year Field Allows Invalid Years
**Priority:** 3

## What is broken
In the Porutham panel birth-date inputs and anywhere else a date of birth is entered, the user can manually type `0001`, `9999`, or future years. The value is sent to the API as-is, causing calculation errors or silent nonsense results.

## Files involved
- `web/components/porutham-panel.tsx` — `PersonForm` component, line ~83
- Search for any other `type="date"` input used for birth date across all `web/components/` files

## Fix

### In `porutham-panel.tsx` — PersonForm component

Find the birth date input (around line 83):
```tsx
<input className="input" style={fieldStyle} type="date" value={form.birthDateLocal}
  onChange={(e) => onChange({ ...form, birthDateLocal: e.target.value })} />
```

Replace with:
```tsx
<input
  className="input"
  style={fieldStyle}
  type="date"
  value={form.birthDateLocal}
  min="1900-01-01"
  max={new Date().toISOString().split("T")[0]}
  onChange={(e) => {
    const val = e.target.value;
    const year = parseInt(val.split("-")[0], 10);
    if (val && (year < 1900 || year > new Date().getFullYear())) return;
    onChange({ ...form, birthDateLocal: val });
  }}
/>
```

### Search for other date inputs

Run this to find all date inputs in the frontend:
```powershell
Select-String -Path 'web\**\*.tsx' -Pattern 'type="date"' -Recurse |
  Where-Object { $_.Line -notmatch 'min=' } |
  Select-Object Filename, LineNumber, Line
```

For every result that is a birth-date input (not event date, not reminder date), apply the same `min="1900-01-01"` and `max` + year guard pattern above.

### Backend guard (defence in depth)

In `app/schemas/birth_profile.py` (or wherever `BirthProfileCreate` is defined), ensure the `birth_date_local` field has a validator:

```python
from datetime import date
from pydantic import field_validator

@field_validator("birth_date_local")
@classmethod
def validate_birth_date(cls, v: date) -> date:
    if v.year < 1900:
        raise ValueError("Birth year must be 1900 or later.")
    if v > date.today():
        raise ValueError("Birth date cannot be in the future.")
    return v
```

## Test checklist
- [ ] Try typing `0001` in year field — input should reject or not update state
- [ ] Try typing `2099` — should be rejected
- [ ] Valid date like `1985-03-15` — should work normally
- [ ] Submit with a valid date — API call succeeds

---

---

# ISSUE 3 — Porutham Context Doesn't Change the Matching Logic
**Priority:** 6

## What is broken
Selecting FRIENDSHIP, BUSINESS, or FAMILY in the Porutham context selector still computes and displays all 8 marriage kutas (Dhina, Gana, Mahendra, Yoni, Rasi, Rajju, Vedha, Vasya) with the same weights. Yoni kuta (sexual compatibility) shown for a business relationship is wrong and confusing.

## Files involved
- `app/calculations/porutham.py` — core kuta computation
- `app/services/synastry_service.py` — `compare_charts_direct` function, calls `compute_porutham`
- `app/schemas/relationships.py` — `DirectPoruthamData` schema (contextNote field)

## Root cause
`compute_porutham` computes all 8 kutas unconditionally. The `compatibility_context` value is received by the service but not used to filter or weight the kutas before they are returned.

## Fix

### Step 1 — Define kuta masks per context

In `app/calculations/porutham.py`, add this dict near the top of the file (after imports):

```python
# Kutas relevant to each compatibility context.
# Key = context string, Value = set of kuta names that should be scored and shown.
# Kutas not in the set are excluded from scoring and display.
CONTEXT_KUTA_MASK: dict[str, set[str]] = {
    "MARRIAGE":   {"Dhina", "Gana", "Mahendra", "Yoni", "Rasi", "Rajju", "Vedha", "Vasya"},
    "FRIENDSHIP": {"Dhina", "Gana", "Rasi", "Vedha"},
    "BUSINESS":   {"Gana", "Mahendra", "Dhina", "Rasi"},
    "FAMILY":     {"Rasi", "Gana", "Vedha", "Vasya"},
    "GENERAL":    {"Gana", "Rasi", "Dhina"},
}

CONTEXT_LABEL: dict[str, dict[str, str]] = {
    "MARRIAGE":   {"en": "Marriage Compatibility", "ta": "திருமண பொருத்தம்"},
    "FRIENDSHIP": {"en": "Friendship Compatibility", "ta": "நட்பு பொருத்தம்"},
    "BUSINESS":   {"en": "Business Compatibility",  "ta": "தொழில் பொருத்தம்"},
    "FAMILY":     {"en": "Family Harmony",          "ta": "குடும்ப பொருத்தம்"},
    "GENERAL":    {"en": "General Compatibility",   "ta": "பொது பொருத்தம்"},
}

CONTEXT_NOTE: dict[str, dict[str, str]] = {
    "MARRIAGE":   {
        "en": "All 8 traditional kutas assessed for marriage suitability.",
        "ta": "திருமண பொருத்தத்திற்கான அனைத்து 8 குட பொருத்தங்களும் கணக்கிடப்பட்டுள்ளன.",
    },
    "FRIENDSHIP": {
        "en": "For friendship, temperament (Gana), harmony (Rasi), rhythm (Dhina), and affliction check (Vedha) are assessed. Marriage-specific kutas like Yoni are not applicable.",
        "ta": "நட்பு பொருத்தத்திற்கு குணம், ராசி இணக்கம், தினம், வேத தோஷம் ஆகியவை மட்டும் கணக்கிடப்படுகின்றன.",
    },
    "BUSINESS":   {
        "en": "For business, temperament alignment (Gana), longevity of partnership (Mahendra), mutual rhythm (Dhina), and rasi harmony (Rasi) are assessed.",
        "ta": "தொழில் பொருத்தத்திற்கு குண இணக்கம், மகேந்திரம், தினம், ராசி பொருத்தம் ஆகியவை பார்க்கப்படுகின்றன.",
    },
    "FAMILY":     {
        "en": "For family relationships, rasi harmony, temperament, affliction-freedom (Vedha), and mutual support (Vasya) are assessed.",
        "ta": "குடும்ப பொருத்தத்திற்கு ராசி, குணம், வேத தோஷம், வஸ்யம் ஆகியவை பார்க்கப்படுகின்றன.",
    },
    "GENERAL":    {
        "en": "General assessment uses core temperament (Gana), rasi harmony, and daily rhythm (Dhina) only.",
        "ta": "பொது பொருத்தத்திற்கு குணம், ராசி, தினம் மட்டும் கணக்கிடப்படுகின்றன.",
    },
}
```

### Step 2 — Update `compute_porutham` signature and logic

Find the `compute_porutham` function in `app/calculations/porutham.py`. It currently returns all kutas. Update its signature to accept `compatibility_context`:

```python
def compute_porutham(
    nakshatra_a: int,
    nakshatra_b: int,
    rasi_a: int,
    rasi_b: int,
    compatibility_context: str = "MARRIAGE",
) -> dict:  # return type matches whatever it currently returns
```

Inside the function, after computing all kutas, apply the mask before returning:

```python
    # Apply context mask — only return kutas relevant to this context
    allowed = CONTEXT_KUTA_MASK.get(compatibility_context, CONTEXT_KUTA_MASK["GENERAL"])
    filtered_kutas = [k for k in all_kutas if k["name"] in allowed]

    total_score = sum(k["score"] for k in filtered_kutas)
    max_score   = sum(k["maxScore"] for k in filtered_kutas)
```

Make sure `filtered_kutas`, `total_score`, `max_score` are what gets returned/used downstream.

### Step 3 — Pass context through the call chain

In `app/services/synastry_service.py`, find `compare_charts_direct`. Locate where it calls `compute_porutham` and pass the `compatibility_context` argument:

```python
porutham_result = compute_porutham(
    nakshatra_a=nakshatra_a,
    nakshatra_b=nakshatra_b,
    rasi_a=rasi_a,
    rasi_b=rasi_b,
    compatibility_context=compatibility_context,  # <-- add this
)
```

### Step 4 — Set contextNote in the response

After computing `porutham_result`, build the `contextNote` field using `CONTEXT_NOTE`:

```python
from app.calculations.porutham import CONTEXT_NOTE
note = CONTEXT_NOTE.get(compatibility_context, CONTEXT_NOTE["GENERAL"])
context_note = RelationshipBiText(en=note["en"], ta=note["ta"])
```

Then include `contextNote=context_note` in the `DirectPoruthamData` constructor.

Also set the `label` to reflect the context:
```python
from app.calculations.porutham import CONTEXT_LABEL
ctx_label = CONTEXT_LABEL.get(compatibility_context, {}).get("en", "Compatibility")
```

## Test checklist
- [ ] MARRIAGE context → all 8 kutas visible, Yoni kuta present
- [ ] FRIENDSHIP context → only Dhina, Gana, Rasi, Vedha shown; score out of those 4 maxes only
- [ ] BUSINESS context → Gana, Mahendra, Dhina, Rasi shown
- [ ] contextNote text is accurate and context-appropriate
- [ ] Total score / maxScore reflects only the applicable kutas

---

---

# ISSUE 4 — CTA Text and Color Not Visible (QA page, Plan → Goals)
**Priority:** 5

## What is broken
Buttons on the QA page and Plan → Goals sub-tab are either invisible (text same colour as background) or have no visible background. The "Add Goal" button and QA action buttons are affected.

## Files involved
- The global CSS file — find it with:
  ```powershell
  Get-ChildItem -Recurse -Filter "*.css" -Path 'web' |
    Where-Object { $_.FullName -notmatch 'node_modules' } |
    Select-Object FullName
  ```
- `web/components/dashboard-ui.tsx` — `Button` component (line ~37)

## Root cause
The `Button` component renders `className="button button--primary"` etc. These CSS classes must define explicit `color` and `background-color`. If the CSS uses `var(--color-faint)` for text or relies on inherited colour that resolves to near-white in certain page contexts, buttons become invisible.

## Fix

### Step 1 — Find and audit button CSS

Open the global stylesheet (likely `web/styles/globals.css` or `web/app/globals.css`). Search for `.button--primary`, `.button--secondary`, `.button--ghost`. They should look like:

```css
.button--primary {
  background: #B85A2C;      /* terracotta */
  color: #FAF5EA;           /* cream — always visible on terracotta */
  border: 1.5px solid #B85A2C;
  padding: 8px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  font-family: inherit;
}

.button--primary:disabled {
  background: #E4DBC8;
  color: #7A6F5E;           /* muted — explicit, not inherited */
  border-color: #E4DBC8;
  cursor: not-allowed;
}

.button--secondary {
  background: transparent;
  color: #3D352B;           /* inkMid — dark, always readable */
  border: 1.5px solid #D4C8AE;
  padding: 8px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  font-family: inherit;
}

.button--secondary:disabled {
  color: #7A6F5E;
  cursor: not-allowed;
}

.button--ghost {
  background: transparent;
  color: #B85A2C;           /* terracotta text */
  border: 1.5px solid rgba(184,90,44,0.4);
  padding: 8px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  font-family: inherit;
}

.button--ghost:disabled {
  color: #7A6F5E;
  cursor: not-allowed;
}
```

**Critical:** ensure `color` is always an explicit hex value, never `var(--color-faint)` or `inherit`.

### Step 2 — Verify global CSS is imported everywhere

Check `web/app/layout.tsx` — it should import the global CSS unconditionally:
```tsx
import "@/styles/globals.css";  // or whatever the path is
```

If it's only imported in some page layouts but not others, the classes won't be available on the QA page or Plan sub-tab. Move the import to the root layout so it applies everywhere.

### Step 3 — Add inline fallback to Button component (belt-and-suspenders)

In `web/components/dashboard-ui.tsx`, update the `Button` component to include explicit inline style fallbacks:

```tsx
const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary:   { background: "#B85A2C", color: "#FAF5EA", border: "1.5px solid #B85A2C" },
  secondary: { background: "transparent", color: "#3D352B", border: "1.5px solid #D4C8AE" },
  ghost:     { background: "transparent", color: "#B85A2C", border: "1.5px solid rgba(184,90,44,0.4)" },
};

export function Button({
  children, onClick, type = "button", variant = "secondary", disabled, title,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost"; disabled?: boolean; title?: string;
}) {
  const base: React.CSSProperties = {
    padding: "8px 20px",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "0.875rem",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    opacity: disabled ? 0.55 : 1,
    ...VARIANT_STYLES[variant],
  };
  return (
    <button
      className={`button button--${variant}`}
      style={base}
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
```

This ensures buttons are always visible even if the CSS class fails to load.

## Test checklist
- [ ] Go to Plan → Goals sub-tab → "Add Goal" button is clearly readable with terracotta background
- [ ] Go to QA page → all action buttons have visible text and background
- [ ] Disabled state buttons are visually muted but not invisible
- [ ] Check in both light mode and any dark/alternate theme

---

---

# ISSUE 5 — Life Event Log: "Could not load events. Internal Server Error"
**Priority:** 1 (do first)

## What is broken
The Life Event Log panel (shown in Plan → Goals sub-tab) shows "Could not load events. Internal Server Error" on load.

## Files involved
- `migrations/versions/m8a9b0c1d2e3_add_deleted_at_to_user_life_events.py` — pending migration (visible in git status as untracked)
- `app/models/user_life_events.py` — the model that references `deleted_at`
- `app/services/life_event_log_service.py` — the service that queries `UserLifeEvent`

## Root cause
The migration `m8a9b0c1d2e3_add_deleted_at_to_user_life_events.py` adds a `deleted_at` column to the `user_life_events` table. This migration has not been applied to the dev DB. When the service queries `UserLifeEvent` with a filter on `deleted_at`, PostgreSQL returns a column-not-found error → SQLAlchemy raises an exception → FastAPI returns 500.

## Fix

### Step 1 — Review the migration file

Read the migration before applying:
```powershell
Get-Content 'migrations\versions\m8a9b0c1d2e3_add_deleted_at_to_user_life_events.py'
```

Confirm it only adds a nullable `deleted_at` column and has a proper `downgrade()` that drops it.

### Step 2 — Apply migration to test DB first

```powershell
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
alembic upgrade head
```

Verify success — should print the migration ID with no errors.

### Step 3 — Verify the service works on test DB

Run a quick test:
```powershell
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
python -c "
from app.db.session import SessionLocal
from app.models.user_life_events import UserLifeEvent
from sqlalchemy import select
s = SessionLocal()
rows = s.execute(select(UserLifeEvent).limit(5)).scalars().all()
print('OK — rows:', len(rows))
s.close()
"
```

### Step 4 — Apply to dev DB (with user confirmation)

**Stop and confirm with the user before this step.** The dev DB contains real data. Only proceed after explicit approval:

```powershell
# Backup first
docker exec slw-postgres pg_dump -U slw_admin vinaadi_dev > "backup_before_deleted_at_$(Get-Date -Format 'yyyyMMdd_HHmm').sql"

# Then apply
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5432/vinaadi_dev"
alembic upgrade head
```

### Step 5 — Check service query for deleted_at filter

In `app/services/life_event_log_service.py`, line ~175:
```python
rows = session.execute(
    select(UserLifeEvent)
    .where(UserLifeEvent.chart_id == chart_id)
    .order_by(UserLifeEvent.event_date.desc())
).scalars().all()
```

If the model has `deleted_at` but the query doesn't filter on it, soft-deleted items will appear. Add the filter:
```python
rows = session.execute(
    select(UserLifeEvent)
    .where(
        UserLifeEvent.chart_id == chart_id,
        UserLifeEvent.deleted_at.is_(None),
    )
    .order_by(UserLifeEvent.event_date.desc())
).scalars().all()
```

## Test checklist
- [ ] Navigate to Plan → Goals → Life Event Log section
- [ ] Panel loads without error
- [ ] "No events logged yet" message appears if no events exist
- [ ] Click "+ Log event" → fill form → Save → event appears in list
- [ ] Reload page → logged event persists

---

---

# ISSUE 6 — Find Auspicious Time: "422: Unknown activity 'SPIRITUAL'"
**Priority:** 2

## What is broken
Selecting "Grihapravesh / Religious event" in the Muhurta picker and clicking Find returns:
`422: Unknown activity 'SPIRITUAL'. Valid values: ['EXAM', 'INVESTMENT', 'JOB_START', 'MARRIAGE', 'MEDICAL', 'PURCHASE', 'TRAVEL']`

## Files involved
- `app/services/muhurta_service.py` — `_ACTIVITY_LORDS` and `_ACTIVITY_HOUSES` dicts
- `app/api/muhurta.py` — query param description string

## Root cause
`dashboard-muhurta-picker.tsx` sends `activity=SPIRITUAL` but the backend dict `_ACTIVITY_LORDS` has no `"SPIRITUAL"` key. The service raises 422 for unknown activities.

Also note: the frontend `dashboard-plan-tab.tsx` ACTIVITY_OPTIONS uses lowercase `"spiritual"` as the value. Check whether the frontend uppercases it before the API call — if not, the backend won't match `"SPIRITUAL"` either. Fix both.

## Fix

### Step 1 — Add SPIRITUAL to backend muhurta service

In `app/services/muhurta_service.py`, find `_ACTIVITY_LORDS` (around line 43) and add:

```python
_ACTIVITY_LORDS: dict[str, set[str]] = {
    "JOB_START":   {"SUN", "MERCURY", "JUPITER"},
    "MARRIAGE":    {"VENUS", "JUPITER", "MOON"},
    "EXAM":        {"MERCURY", "JUPITER", "MOON"},
    "TRAVEL":      {"MERCURY", "MOON", "VENUS"},
    "INVESTMENT":  {"JUPITER", "VENUS", "MERCURY"},
    "MEDICAL":     {"SUN", "MOON"},
    "PURCHASE":    {"VENUS", "JUPITER", "MERCURY"},
    "SPIRITUAL":   {"JUPITER", "SUN", "MOON"},   # <-- ADD THIS
}
```

Find `_ACTIVITY_HOUSES` (around line 54) and add:

```python
_ACTIVITY_HOUSES: dict[str, list[int]] = {
    "JOB_START":  [10, 2],
    "MARRIAGE":   [7, 2],
    "EXAM":       [4, 9],
    "TRAVEL":     [3, 12],
    "INVESTMENT": [2, 11],
    "MEDICAL":    [1, 6],
    "PURCHASE":   [2, 4],
    "SPIRITUAL":  [9, 5],   # <-- ADD THIS: 9th house (dharma/pilgrimage), 5th (mantra/siddhi)
}
```

### Step 2 — Update router description

In `app/api/muhurta.py`, update the query param description:

```python
activity: str = Query(description="JOB_START | MARRIAGE | EXAM | TRAVEL | INVESTMENT | MEDICAL | PURCHASE | SPIRITUAL"),
```

### Step 3 — Fix frontend value casing

In `web/components/dashboard-plan-tab.tsx`, `ACTIVITY_OPTIONS` array uses `value: "spiritual"` (lowercase). The fetch call in the timing tab sends this value directly in the query string. The backend expects uppercase.

Find the fetch call in the timing sub-tab (around line 383):
```tsx
apiFetchJson<...>(
  `/api/v1/activity-timing${toQuery({ chartId, activity: activityType, month: activityMonth })}`,
)
```

Change `activity: activityType` to `activity: activityType.toUpperCase()`.

In `web/components/dashboard-muhurta-picker.tsx`, the `ACTIVITIES` array already uses uppercase IDs (`"SPIRITUAL"`) — confirm the fetch call uses the `id` field directly. If it uses a different field, fix it to use `id`.

## Test checklist
- [ ] Open Plan → Timing → Muhurta picker
- [ ] Select "Grihapravesh / Religious event" (SPIRITUAL)
- [ ] Pick a date range and click Find → results appear, no 422
- [ ] Returned slots mention Jupiter/Sun/Moon dasha support
- [ ] Also test JOB_START, MARRIAGE — confirm they still work

---

---

# ISSUE 7 — Save Reminder Has No Action / No Backend
**Priority:** 9

## What is broken
A "Save reminder" button exists somewhere in the UI but clicking it does nothing — either it fires an API call to a non-existent endpoint (silent 404) or it's a dead button with no handler.

## Files involved
- Search for the button:
  ```powershell
  Select-String -Path 'web\**\*.tsx' -Pattern 'reminder' -Recurse -CaseInsensitive |
    Select-Object Filename, LineNumber, Line
  ```
- `app/api/` directory — confirm no `reminders.py` exists

## Two options — choose one and implement

### Option A — Hide with "Coming soon" (quick, safe)

If reminders are not yet a priority feature, replace the button with a disabled state + tooltip:

Find the Save reminder button in whichever component it lives in. Replace the `onClick` with nothing and add `disabled` + `title`:

```tsx
<button
  type="button"
  disabled
  title={lang === "ta" ? "விரைவில் வருகிறது" : "Coming soon"}
  style={{
    padding: "8px 20px",
    borderRadius: "10px",
    border: "1.5px solid #E4DBC8",
    background: "#F4EEE2",
    color: "#7A6F5E",
    cursor: "not-allowed",
    fontWeight: 600,
    fontSize: "0.875rem",
    fontFamily: "inherit",
    opacity: 0.6,
  }}
>
  {lang === "ta" ? "ஞாபகூட்டல் சேமி (விரைவில்)" : "Save reminder (coming soon)"}
</button>
```

### Option B — Implement muhurta slot reminders (full feature)

**Backend:**

Create `app/models/user_reminder.py`:
```python
from __future__ import annotations
from datetime import datetime, date
from uuid import UUID, uuid4
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.db.base_class import Base

class UserReminder(Base):
    __tablename__ = "user_reminders"
    id            = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    chart_id      = Column(PGUUID(as_uuid=True), ForeignKey("charts.chart_id"), nullable=False)
    owner_user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    title         = Column(String(255), nullable=False)
    reminder_date = Column(Date, nullable=False)
    notes         = Column(Text, nullable=True)
    created_at    = Column(DateTime(timezone=True), default=lambda: datetime.utcnow())
    deleted_at    = Column(DateTime(timezone=True), nullable=True)
```

Create `app/api/reminders.py`:
```python
from __future__ import annotations
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.user_reminder import UserReminder

router = APIRouter()

class ReminderCreate(BaseModel):
    chartId: UUID
    title: str
    reminderDate: date
    notes: str | None = None

@router.post("/reminders", tags=["reminders"])
def create_reminder(
    payload: ReminderCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = UserReminder(
        chart_id=payload.chartId,
        owner_user_id=current_user.user_id,
        title=payload.title,
        reminder_date=payload.reminderDate,
        notes=payload.notes,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return {"success": True, "data": {"id": str(row.id), "title": row.title, "reminderDate": str(row.reminder_date)}}
```

Register the router in `app/main.py`:
```python
from app.api import reminders
app.include_router(reminders.router, prefix="/api/v1")
```

Create a migration:
```powershell
alembic revision --autogenerate -m "add_user_reminders"
# Review the generated file, then:
alembic upgrade head  # on test DB first
```

**Frontend:** In the muhurta picker component, wire the "Save reminder" button to call `POST /api/v1/reminders` with `{ chartId, title: slot.label, reminderDate: slot.dateLocal }`. Show a success toast: "Reminder saved for [date]."

## Test checklist
- [ ] Save reminder button is either visually marked "coming soon" (Option A) or fully functional (Option B)
- [ ] No silent failures — user always sees feedback
- [ ] If Option B: saved reminder persists after page reload

---

---

# ISSUE 8 — Transit Page Shows Date Redundantly
**Priority:** 4

## What is broken
Inside the Transit tab content, a date display appears even though the dashboard-level date picker already shows the selected date prominently. This creates visual repetition and wastes space.

## Files involved
- `web/components/dashboard-transits-tab.tsx` — find the date rendering

## Fix

### Step 1 — Locate the redundant date display

In `dashboard-transits-tab.tsx`, search for uses of `formatHeaderDate` or `selectedDate` in JSX. It will be something like:

```tsx
<p style={{ ... }}>{formatHeaderDate(selectedDate, lang)}</p>
```

or a `StatPill` component showing the date:
```tsx
<StatPill label="Date" value={formatHeaderDate(selectedDate, lang)} />
```

### Step 2 — Remove it

Delete just the date display element. Keep `selectedDate` in the component — it is still used for API calls. Only remove the visual rendering of the date.

**Important:** If the date appears inside a section header like "Transit snapshot for [date]", keep the word "snapshot" or section title but remove the date portion. If the date is the only content in a header, remove the whole header element.

### Step 3 — Verify the date still drives API calls

Confirm `selectedDate` is still passed to `apiFetchJson` calls inside `useEffect` hooks — only the UI render of the date changes, not the data-fetching logic.

## Test checklist
- [ ] Open Transit tab — no standalone date text visible inside the tab body
- [ ] Change date using the dashboard date picker — transit data updates correctly
- [ ] The date picker at the dashboard level still shows the date clearly

---

---

# ISSUE 9 — Life Area Predictions Don't Match User's Life Stage
**Priority:** 7

## What is broken
A married adult sees "Marriage timing looks favourable" in RELATIONSHIPS area. A newborn sees career and marriage predictions. Predictions are generated without considering the person's age or relationship status.

## Files involved
- `app/services/life_areas_service.py` — all reasoning text generation
- `app/schemas/life_areas.py` — `LifeAreaData` schema
- `app/models/birth_profile.py` — has `birth_date_local` field

## Fix

### Step 1 — Compute age in the service

In `app/services/life_areas_service.py`, find where `BirthProfile` is loaded (likely near the top of the main service function). After loading `bp` (the BirthProfile):

```python
from datetime import date as _date

def _compute_age(birth_date: _date, as_of: _date) -> int:
    age = as_of.year - birth_date.year
    if (as_of.month, as_of.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age

def _age_phase(age: int) -> str:
    if age < 6:   return "INFANT"
    if age < 15:  return "CHILD"
    if age < 22:  return "TEEN"
    if age < 36:  return "YOUNG_ADULT"
    if age < 56:  return "MID"
    return "ELDER"
```

Call this when processing:
```python
age_years = _compute_age(bp.birth_date_local, on_date)
phase = _age_phase(age_years)
```

### Step 2 — Define area relevance per phase

Add this dict to `life_areas_service.py`:

```python
# Areas shown with full scoring per life phase.
# Areas not in the set still compute a score but the reasoning text
# is replaced with a phase-appropriate message.
_PHASE_RELEVANT_AREAS: dict[str, set[str]] = {
    "INFANT":       {"HEALTH", "FAMILY_HARMONY"},
    "CHILD":        {"HEALTH", "EDUCATION", "FAMILY_HARMONY"},
    "TEEN":         {"EDUCATION", "HEALTH", "SPIRITUAL", "FAMILY_HARMONY"},
    "YOUNG_ADULT":  {"CAREER", "MONEY", "HEALTH", "RELATIONSHIPS", "EDUCATION", "SPIRITUAL", "FAMILY_HARMONY"},
    "MID":          {"CAREER", "MONEY", "HEALTH", "RELATIONSHIPS", "SPIRITUAL", "FAMILY_HARMONY"},
    "ELDER":        {"HEALTH", "SPIRITUAL", "FAMILY_HARMONY", "MONEY"},
}

_PHASE_SKIP_REASON: dict[str, dict[str, str]] = {
    "INFANT": {
        "en": "This life area becomes relevant as the child grows older.",
        "ta": "இந்த வாழ்க்கை பகுதி குழந்தை வளர்ந்த பின் பொருத்தமாகும்.",
    },
    "CHILD": {
        "en": "This area becomes more relevant in the teenage and adult years.",
        "ta": "இந்த பகுதி இளவயதிலும் பெரியவயதிலும் முக்கியமாகும்.",
    },
    "TEEN": {
        "en": "This area becomes a key focus in adult years.",
        "ta": "இந்த பகுதி வயது வந்த பிறகு முக்கியமானது.",
    },
    "ELDER": {
        "en": "This area was most active in earlier years; focus now shifts to health and spiritual growth.",
        "ta": "இந்த பகுதி முன்பு முக்கியமாக இருந்தது; இப்போது உடல்நலம் மற்றும் ஆன்மீகம் முக்கியம்.",
    },
}
```

### Step 3 — Override reasoning text for irrelevant areas

In the main area-scoring loop, after computing each area's score and reasoning, add:

```python
relevant_areas = _PHASE_RELEVANT_AREAS.get(phase, _PHASE_RELEVANT_AREAS["YOUNG_ADULT"])

for area_key, area_data in computed_areas.items():
    if area_key not in relevant_areas:
        skip = _PHASE_SKIP_REASON.get(phase, _PHASE_SKIP_REASON["ELDER"])
        # Replace the reasoning text with the phase-appropriate message
        area_data.reasoning = LifeAreaText(ta=skip["ta"], en=skip["en"])
        # Optionally lower the display score to 0 for infant/child
        if phase in ("INFANT", "CHILD"):
            area_data.score = 0
```

### Step 4 — Handle RELATIONSHIPS framing for married users

If the birth profile stores `relationship_status` (check `app/models/birth_profile.py`):

```python
if area_key == "RELATIONSHIPS" and getattr(bp, "relationship_status", None) == "MARRIED":
    # Reframe: don't say "marriage timing" — say "partnership deepening"
    # Append to the reasoning text:
    area_data.reasoning.en = area_data.reasoning.en.replace(
        "marriage timing", "partnership and family harmony"
    ).replace(
        "marriage", "partnership"
    )
    area_data.reasoning.ta = area_data.reasoning.ta.replace(
        "திருமண நேரம்", "தாம்பத்திய இணக்கம்"
    )
```

If `relationship_status` is not stored on the profile, skip this step and note it as a future enhancement (requires a new profile field and migration).

## Test checklist
- [ ] Add a birth profile with birth date making age < 6 → only HEALTH and FAMILY_HARMONY show meaningful scores; other areas show phase-appropriate message
- [ ] Age 10 → EDUCATION prominent, CAREER/RELATIONSHIPS show "becomes relevant later"
- [ ] Age 28 → all areas shown with full scoring
- [ ] Age 65 → HEALTH/SPIRITUAL/FAMILY prominent; CAREER shows elder message
- [ ] No "marriage timing" language for infants or children

---

---

# ISSUE 10 — Goals Have No Effect on Predictions Output
**Priority:** 8

## What is broken
Setting a goal in Plan → Goals saves correctly to DB but has no visible effect on any other part of the app. The daily guidance, life areas, and snapshot don't change based on the goal.

## Files involved
- `app/services/goals_service.py` — `get_active_goals_for_chart` (line 122) exists but is not called
- `app/services/life_areas_service.py` — does not use goals
- `app/services/daily_guidance_service.py` (or equivalent) — find it:
  ```powershell
  Select-String -Path 'app\services\*.py' -Pattern 'daily' -CaseInsensitive | Select-Object Filename
  ```
- `web/components/dashboard-plan-tab.tsx` — Goals sub-tab UI

## Fix

### Step 1 — Wire goals into life areas service

In `app/services/life_areas_service.py`, at the top of the main scoring function:

```python
from app.services.goals_service import get_active_goals_for_chart

# After loading the chart:
active_goals = get_active_goals_for_chart(session, chart_id)
goal_types = {g.goal_type for g in active_goals}
```

Then in the area-scoring loop, boost the score slightly for areas aligned with active goals:

```python
GOAL_TO_AREA: dict[str, str] = {
    "job_change":     "CAREER",
    "business_start": "CAREER",
    "marriage":       "RELATIONSHIPS",
    "education":      "EDUCATION",
    "property":       "MONEY",
    "financial":      "MONEY",
    "travel_abroad":  "CAREER",
    "health":         "HEALTH",
    "spiritual":      "SPIRITUAL",
    "family_harmony": "FAMILY_HARMONY",
    "child_birth":    "FAMILY_HARMONY",
    "other":          None,
}

for goal_type in goal_types:
    target_area = GOAL_TO_AREA.get(goal_type)
    if target_area and target_area in computed_areas:
        # Add goal context to reasoning text (don't change score — just highlight)
        area = computed_areas[target_area]
        goal_note_en = f" [Focus area based on your '{goal_type.replace('_', ' ')}' goal.]"
        goal_note_ta = f" [உங்கள் '{goal_type}' இலக்கின் படி முக்கியமான பகுதி.]"
        area.reasoning = LifeAreaText(
            en=area.reasoning.en + goal_note_en,
            ta=area.reasoning.ta + goal_note_ta,
        )
        # Mark this area as goal-highlighted in the response
        area.isGoalFocus = True  # add this field to LifeAreaData schema if not present
```

### Step 2 — Add `isGoalFocus` field to schema

In `app/schemas/life_areas.py`, find `LifeAreaData` and add:

```python
class LifeAreaData(BaseModel):
    # ... existing fields ...
    isGoalFocus: bool = False   # True if user has an active goal mapped to this area
```

### Step 3 — Highlight goal-focus areas in the frontend

In `web/components/dashboard-life-areas-tab.tsx` (or `web/components/life-area-card.tsx`), check `area.isGoalFocus`:

```tsx
{area.isGoalFocus && (
  <span style={{
    fontSize: "0.625rem",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "4px",
    background: "#F0D9C4",
    color: "#8C3E18",
    border: "1px solid rgba(184,90,44,0.3)",
    marginLeft: "6px",
  }}>
    {lang === "ta" ? "உங்கள் இலக்கு" : "Your focus"}
  </span>
)}
```

### Step 4 — Add explanatory text to Goals sub-tab

In `web/components/dashboard-plan-tab.tsx`, in the `planSubTab === "goals"` section, after the goals list and before the Add Goal form, add:

```tsx
{goals.length > 0 && (
  <div style={{
    padding: "var(--space-2_5) var(--space-3)",
    borderRadius: "var(--radius-sm)",
    background: "#EEF6EA",
    border: "1px solid rgba(92,118,84,0.2)",
    marginBottom: "var(--space-3)",
  }}>
    <p style={{ margin: 0, fontSize: "0.75rem", color: "#5C7654", lineHeight: 1.5 }}>
      {lang === "ta"
        ? "உங்கள் இலக்குகள் வாழ்க்கை பகுதிகள் மற்றும் தினசரி வழிகாட்டுதலில் முன்னிலைப்படுத்தப்படும்."
        : "Your goals are highlighted in Life Areas and Daily Snapshot tabs, so the most relevant areas stand out."}
    </p>
  </div>
)}
```

### Step 5 — Wire goals into daily guidance (if applicable)

Find the daily guidance service. Inside it, load active goals and pass them to the narrative generator:

```python
active_goals = get_active_goals_for_chart(session, chart_id)
goal_types = [g.goal_type for g in active_goals]

# When building the daily summary text, if goal_types is not empty:
if goal_types:
    goal_context = f" Today's reading is personalised for your {goal_types[0].replace('_', ' ')} focus."
    daily_summary += goal_context
```

## Test checklist
- [ ] Add "Job change" goal → Life Areas tab → CAREER area shows "Your focus" badge
- [ ] Add "Marriage" goal → RELATIONSHIPS area highlighted
- [ ] Remove goal → badge disappears after refresh
- [ ] Goals sub-tab shows the green explanatory note when goals are set
- [ ] Maximum 3 goals can be set (existing limit in service)

---

---

# ISSUE 11 — Muhurta Finder Should Be a Separate Sub-Tab in Plan
**Priority:** 10

## What is broken
The Muhurta picker (hour-precise auspicious time finder) and the Activity Timing tool (best-day-of-month finder) are both rendered inside the single "Timing" sub-tab, making it cluttered and the Muhurta tool hard to find.

## Files involved
- `web/components/dashboard-plan-tab.tsx` — `PLAN_SUB_TABS` array and sub-tab render blocks

## Fix

### Step 1 — Update sub-tab list

In `dashboard-plan-tab.tsx`, find `PLAN_SUB_TABS` (around line 129):

```tsx
type PlanSubTab = "goals" | "whatif" | "timing" | "decisions";
const PLAN_SUB_TABS: { key: PlanSubTab; label: string }[] = [
  { key: "goals",     label: lang === "ta" ? "இலக்குகள்" : "Goals" },
  { key: "whatif",    label: lang === "ta" ? "என்ன ஆகும்?" : "What-If" },
  { key: "timing",    label: lang === "ta" ? "சிறந்த நேரம்" : "Timing" },
  { key: "decisions", label: lang === "ta" ? "முடிவுகள்" : "Decisions" },
];
```

Replace with:

```tsx
type PlanSubTab = "goals" | "whatif" | "timing" | "muhurta" | "decisions";
const PLAN_SUB_TABS: { key: PlanSubTab; label: string }[] = [
  { key: "goals",     label: lang === "ta" ? "இலக்குகள்" : "Goals" },
  { key: "whatif",    label: lang === "ta" ? "என்ன ஆகும்?" : "What-If" },
  { key: "timing",    label: lang === "ta" ? "சிறந்த நாட்கள்" : "Best Dates" },
  { key: "muhurta",   label: lang === "ta" ? "முஹூர்த்தம்" : "Muhurta" },
  { key: "decisions", label: lang === "ta" ? "முடிவுகள்" : "Decisions" },
];
```

### Step 2 — Move MuhurtaPicker to its own block

Currently (line 443):
```tsx
{planSubTab === "timing" && <DashboardMuhurtaPicker lang={lang} chartId={chartId || null} />}
```

Change to:
```tsx
{planSubTab === "muhurta" && <DashboardMuhurtaPicker lang={lang} chartId={chartId || null} />}
```

This removes it from the "timing" block. The "timing" block (line 357–424) already has its own activity timing UI — leave that intact, just rename its label to "Best Dates" (done in Step 1).

### Step 3 — Add a brief description to the Muhurta sub-tab

At the top of the `planSubTab === "muhurta"` block, before `<DashboardMuhurtaPicker>`:

```tsx
{planSubTab === "muhurta" && (
  <>
    <div style={{
      padding: "var(--space-2_5) var(--space-3_5)",
      borderRadius: "var(--radius-sm)",
      background: W.surface,
      border: `1px solid ${W.borderLt}`,
      marginBottom: "var(--space-3)",
    }}>
      <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted, lineHeight: 1.55 }}>
        {lang === "ta"
          ? "குறிப்பிட்ட நிகழ்வுகளுக்கான சிறந்த நேரம் மற்றும் திதி-நட்சத்திர பொருத்தம் இங்கே காணலாம்."
          : "Find the best hour-precise time slot for a specific ceremony or event, checked against panchangam, dasha, and kalam."}
      </p>
    </div>
    <DashboardMuhurtaPicker lang={lang} chartId={chartId || null} />
  </>
)}
```

## Test checklist
- [ ] Plan tab shows 5 sub-tabs: Goals | What-If | Best Dates | Muhurta | Decisions
- [ ] "Best Dates" tab shows the activity + month picker (existing timing tool)
- [ ] "Muhurta" tab shows the muhurta picker with date range and hour-precise slots
- [ ] Both tools function independently
- [ ] Tamil labels display correctly

---

---

# ISSUE 12 — Computation Reasoning Is Not Detailed or Accurate Enough
**Priority:** 11

## What is broken
Across life areas, what-if, muhurta, and transit sections, reasoning text is generic ("Career looks moderate") without citing the specific planets, houses, and dasha lords that justify the score.

## Files involved
- `app/services/life_areas_service.py` — area reasoning text generators
- `app/services/muhurta_service.py` — muhurta caution text
- `app/services/what_if_service.py` (find with grep) — triple confirmation text
- `app/services/life_event_service.py` — life event window reasoning

## Fix — General principle

Every reasoning string must answer: **which planet, in which house/transit, in which dasha, producing which effect**. Template format:

```
[Planet name] ([role]) is [transit position] in [house] from [reference]. 
[Dasha lord] mahadasha [supports/weakens] [area]. 
Net effect: [score rationale].
```

### Life Areas — example upgrade

Find the area reasoning generator in `life_areas_service.py`. Current pattern (generic):
```python
reason_en = f"{area_label} looks {'strong' if score >= 70 else 'moderate' if score >= 45 else 'weak'} this period."
```

Replace with a structured builder:

```python
def _build_area_reason(
    area_key: str,
    score: int,
    karaka_planet: str,
    karaka_house_from_moon: int,
    maha_lord: str,
    antar_lord: str,
    maha_relevant: bool,
    antar_relevant: bool,
    sani_phase: str | None,
) -> tuple[str, str]:
    """Return (english_reason, tamil_reason)."""
    planet_label = _PLANET_LABEL[karaka_planet].en
    area_label   = _AREA_LABELS[area_key].en

    transit_quality = "well-placed" if karaka_house_from_moon in {1,2,3,4,5,7,9,10,11} else "in a challenging position"
    dasha_note = ""
    if maha_relevant and antar_relevant:
        dasha_note = f"{maha_lord} mahadasha and {antar_lord} antardasha both support {area_label.lower()}."
    elif maha_relevant:
        dasha_note = f"{maha_lord} mahadasha supports {area_label.lower()}; {antar_lord} antardasha is neutral."
    elif antar_relevant:
        dasha_note = f"{maha_lord} mahadasha is neutral for {area_label.lower()}; {antar_lord} antardasha adds some support."
    else:
        dasha_note = f"Neither {maha_lord} mahadasha nor {antar_lord} antardasha is strongly aligned with {area_label.lower()}."

    sani_note = ""
    if sani_phase == "SADE_SATI":
        sani_note = " Saturn's Sade Sati is active — this adds a layer of pressure and delayed results."
    elif sani_phase == "ASHTAMA":
        sani_note = " Saturn transiting the 8th from Moon brings obstacles and introspection."

    quality = "strong" if score >= 70 else "moderate" if score >= 45 else "needs attention"
    en = (
        f"{planet_label} — the karaka (significator) for {area_label.lower()} — is currently {transit_quality} "
        f"(house {karaka_house_from_moon} from Moon). {dasha_note}{sani_note} "
        f"Overall {area_label.lower()} is {quality} this period (score {score}/100)."
    )

    # Tamil: build a parallel string using Tamil planet/area names
    planet_label_ta = _PLANET_LABEL[karaka_planet].ta
    area_label_ta   = _AREA_LABELS[area_key].ta
    transit_quality_ta = "நல்ல இடத்தில்" if transit_quality == "well-placed" else "சவாலான இடத்தில்"
    quality_ta = "வலிமையாக" if score >= 70 else "மிதமாக" if score >= 45 else "கவனம் தேவை"
    ta = (
        f"{planet_label_ta} ({area_label_ta} காரகன்) தற்போது சந்திரனிலிருந்து {karaka_house_from_moon}-ம் இடத்தில் "
        f"{transit_quality_ta} உள்ளது. {maha_lord} மகாதசை நடப்பில் உள்ளது. "
        f"{area_label_ta} இப்போது {quality_ta} உள்ளது ({score}/100)."
    )
    return en, ta
```

Call this function instead of the current generic string for each area.

### Muhurta slots — upgrade cautions text

In `muhurta_service.py`, when building `MuhurtaSlot.cautions`, include the specific items:

```python
caution_items = []
if is_rahu_kalam:
    caution_items.append("Rahu Kalam active during this slot")
if is_yamagandam:
    caution_items.append("Yamagandam period overlaps")
if tithi in AVOIDED_TITHIS:
    caution_items.append(f"Tithi {tithi} is generally avoided for auspicious starts")
if is_chandrashtama:
    caution_items.append("Chandrashtama day for Moon sign — avoid decisions")

slot.cautions = "; ".join(caution_items) if caution_items else "No major cautions."
```

And for `panchangamSupport`, name the specific nakshatra/tithi/yoga:

```python
support_items = []
if nakshatra in SUBHA_NAKSHATRAS:
    support_items.append(f"Auspicious nakshatra: {nakshatra}")
if tithi in SUBHA_TITHIS_SHUKLA or tithi in SUBHA_TITHIS_KRISHNA:
    support_items.append(f"Favourable tithi: {tithi}")
if is_abhijit:
    support_items.append("Abhijit muhurta window")

slot.panchangamSupport = "; ".join(support_items) if support_items else "Neutral panchangam."
```

### What-If triple confirmation — upgrade

Find the what-if service. In the `tripleConfirmation` object, name the planets:

```python
natal_promise_text = (
    f"Your {area} house lord is {house_lord} placed in house {house_lord_position}. "
    f"{'Strong natal support.' if natal_score >= 70 else 'Moderate natal support.' if natal_score >= 40 else 'Weak natal base for this activity.'}"
)
dasha_text = (
    f"{maha_lord} mahadasha {'supports' if maha_relevant else 'is neutral for'} this activity. "
    f"{antar_lord} antardasha {'adds reinforcement.' if antar_relevant else 'does not add specific support.'}"
)
gochar_text = (
    f"{transit_planet} currently transits house {transit_house} from your lagna, "
    f"{'activating' if transit_house in auspicious_houses else 'putting pressure on'} this area."
)
```

## Test checklist
- [ ] Open Life Areas tab → each area reasoning names the specific planet, house, dasha lord
- [ ] Open Muhurta results → each slot's cautions and panchangam support name specific items (not generic)
- [ ] Open What-If → triple confirmation names the planets and houses involved
- [ ] No reasoning text is just "looks moderate" without planetary context

---

---

## Cross-cutting notes for all issues

1. **Encoding:** All `.py` files must be saved as UTF-8 without BOM. Use the Write tool, not PowerShell `Out-File`.

2. **Tamil text:** Any new Tamil strings follow the pattern of existing ones in `_t(ta=..., en=...)` helpers. Do not add Tamil text as Python string literals containing escaped characters — use the actual Unicode characters directly.

3. **Schema changes:** Any new field added to a Pydantic schema must also be added to the corresponding TypeScript type in `web/lib/types.ts`. Search for the type name in the TS file and add the field with the correct type.

4. **API route registration:** Any new `router` must be included in `app/main.py` (or wherever routers are mounted). Search for `include_router` to find the pattern.

5. **Migration discipline:**
   - Always write a matching `downgrade()` function
   - Always test on `vinaadi_test` (port 5433) before applying to `vinaadi_dev` (port 5432)
   - Never use `op.drop_column` on a live column without user confirmation

6. **Frontend fetch pattern:** All API calls use `apiFetchJson` from `@/lib/api`. Do not use raw `fetch` except for the PDF download (which needs a `Blob` response, not JSON).

7. **Testing after each issue:** Restart the dev server after any backend change. Run `alembic upgrade head` on test DB after any migration. Check the browser console for 404/422/500 errors after frontend changes.
