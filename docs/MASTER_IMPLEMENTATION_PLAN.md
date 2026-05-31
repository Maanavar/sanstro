# Vinaadi AI — Master Implementation Plan

**Version:** 2.0  
**Date:** 2026-05-31  
**Status:** Active — implementation ready  
**Tests at time of writing:** 431 passing

---

## Repo root — mandatory, never substitute

```
C:\Users\senth\OneDrive\문서\GitHub\sanstro
```

The Korean folder name `문서` is mandatory in every path and every command.
Never write `Documents`, `문서`, or any variation. If a command fails with a
path error, stop and re-read this line before retrying.

---

## Shell and environment

```powershell
# All commands use PowerShell. Chain with ; not &&.

# Backend — set before every Python command
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"

# Tests — always use test DB, never vinaadi_dev
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
$env:JOTHIDAM_TEST_DB_RESET_ACK = "I_UNDERSTAND_THIS_WIPES_TEST_DB"

# Frontend dev server
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro\web'
npm run dev

# TypeScript check — run after every frontend phase
npx tsc --noEmit 2>&1 | Select-Object -First 40
```

---

## Terms and definitions

| Term | Meaning |
|------|---------|
| **BiText** | `{ ta: string; en: string }` — a bilingual text pair used throughout the API |
| **Lang** | `"ta" \| "en"` — active UI language toggle |
| **CSS token** | CSS custom property defined in `dashboard.css`, e.g. `var(--space-3)` |
| **Tone** | Score band label: `"high"` (≥65), `"mid"` (45–64), `"low"` (<45) |
| **Shadbala** | Classical 6-component planet strength: Sthana, Dik, Kala, Chesta, Naisargika, Drik |
| **strengthBreakdown** | `{ sthana, dik, kala, chesta, naisargika, drik }` each `"STRONG" \| "NEUTRAL" \| "WEAK"` |
| **activationScore** | 0–100 integer: how intensely a yoga fires in the current dasha |
| **karaka** | Classical significator planet for a life area |
| **Pratyantar** | Third-level dasha sub-period (within Antardasha, within Mahadasha) |
| **Chara Dasha** | Jaimini's sign-based dasha system (rasi-period, not planet-period) |
| **Tajaka** | Annual solar return chart system |
| **Muntha** | Annual chart indicator: moves 1 rasi per year from natal Lagna |
| **Varshesh** | Year lord in Tajaka — hora lord at the exact moment of solar return |
| **Peyarchi** | Transit — planet moving from one rasi to another |
| **Gochar** | Current planetary position relative to natal chart |
| **Lagna** | Ascendant — rising sign at moment of birth |
| **Rasi** | Zodiac sign (Tamil: ராசி). 12 rasis, numbered 1–12 (Mesham to Meenam) |
| **Nakshatra** | Lunar mansion. 27 nakshatras, each 13°20'. Birth nakshatra = Janma nakshatra |
| **Synastry** | Chart-to-chart compatibility analysis — aspects between two people's planets |
| **Porutham** | Tamil 10-point marriage matching system |
| **Event window** | A date range scored as favorable or unfavorable for a life event |
| **Muhurta** | Auspicious timing selection for a specific activity |
| **Hora** | Planetary hour — 12 per day, each ruled by one of the 7 classical planets |
| **Family vault** | A multi-person container owned by one user, holding family member profiles |
| **Soft-delete** | Archiving a record (setting `is_archived=true`) rather than deleting from DB |
| **vinaadi_dev** | Production dev DB — port 5432. Never drop, never reset |
| **vinaadi_test** | Test DB — port 5433. Safe to wipe. Always use for pytest |

---

## Design system — CSS tokens

All new code must use these tokens. Never hardcode hex colors, pixel spacing,
or font family names. Never use emoji as UI icons — use SVG.

```
Colors
──────
--color-bg              #f4eee2   page background (parchment)
--color-surface         #ffffff   card background
--color-surface-soft    #faf5ea   muted card / inset background
--color-border          #e4dbc8   standard border
--color-border-strong   #d4c8ae   strong border
--color-text            #3d352b   body text
--color-text-strong     #1a1612   headings
--color-muted           #675b4b   secondary text (WCAG AA)
--color-faint           #7a6f5e   tertiary text (WCAG AA)
--color-accent          #b85a2c   rust/terracotta — primary accent
--color-accent-strong   #a8482f   dark rust
--color-accent-alt      #5c7654   sage green
--color-score-high      #5c7654   score ≥65
--color-score-mid       #b85a2c   score 45–64
--color-score-low       #a8482f   score <45

Fonts
──────
--font-body             "Noto Sans Tamil", Inter, system-ui, sans-serif
--font-display          Fraunces, Georgia, serif
--font-mono             "JetBrains Mono", ui-monospace, monospace

Radius
──────
--radius-xs   6px    --radius-sm   8px    --radius-md   12px
--radius-lg   20px   --radius-xl   24px   --radius-pill 9999px

Spacing (multiples of 2px)
──────────────────────────
--space-0_5  2px   --space-1    4px   --space-1_5   6px
--space-2    8px   --space-2_5  10px  --space-3     12px
--space-3_5  14px  --space-4    16px  --space-4_5   18px
--space-5    20px  --space-6    24px  --space-8     32px
--space-10   40px  --space-12   48px  --space-16    64px
```

### Reusable React components (from `web/components/dashboard-ui.tsx`)

```tsx
<Surface title="string">              // titled card wrapper
<Metric label hint value tone />      // data cell
<Chip tone="neutral|success|warning|accent">text</Chip>
<Button variant="primary|secondary|ghost">text</Button>
<CollapsibleSection title defaultOpen={false}>content</CollapsibleSection>
<DrawerPanel>content</DrawerPanel>    // slide-in drawer
<AlertBanner variant="critical|caution">text</AlertBanner>
```

### Planet color map

```tsx
import { DASHA_COLORS } from "./dashboard-dasha";
// SUN:#B85A2C  MOON:#1e5a8c  MARS:#A8482F  MERCURY:#5C7654
// JUPITER:#3a6b40  VENUS:#7a4880  SATURN:#7A6F5E
// RAHU:#5a4880  KETU:#8c7a6e
```

Never redefine `DASHA_COLORS`. Always import it.

### i18n helpers

```tsx
import { t, tLang, tPlanetLord, tNakshatra } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

tLang({ ta: "...", en: "..." }, lang)   // pick from BiText
tPlanetLord("JUPITER", lang)             // localised planet name
```

### Score color helper

```tsx
const SCORE_HIGH = "var(--color-score-high)";
const SCORE_MID  = "var(--color-score-mid)";
const SCORE_LOW  = "var(--color-score-low)";

function scoreColor(score: number): string {
  return score >= 65 ? SCORE_HIGH : score >= 45 ? SCORE_MID : SCORE_LOW;
}
```

---

## Non-negotiable coding rules

### Frontend

1. Never hardcode hex colors — use CSS tokens.
2. Never hardcode font families — use `var(--font-body)` etc.
3. Never hardcode pixel spacing — use `var(--space-N)`.
4. Never use emoji as UI icons — use inline SVG.
5. Always import `DASHA_COLORS` from `./dashboard-dasha` — never redefine.
6. All Tamil strings must be direct Unicode characters, never escape sequences.
   - Correct: `"இன்று அமைதியாக முன்னேறுங்கள்."`
   - Wrong: `"இன்று"`
7. Run `npx tsc --noEmit` after every phase before committing.

### Backend

8. Every new Python file starts with `from __future__ import annotations`.
9. Every new migration implements `downgrade()` — never leave it as `pass`.
10. Never run `alembic upgrade head` against `vinaadi_dev` without:
    - Reviewing the generated migration file
    - Running on `vinaadi_test` (port 5433) first
    - Confirming no data loss
11. Never use `DROP TABLE`, `DROP COLUMN`, or `Base.metadata.drop_all()` on dev data.
12. All `.py` files containing Tamil text must be saved UTF-8 without BOM.

### Track isolation

13. **Track B (frontend)** — zero edits to any `.py` file. Only `web/` files
    and `web/lib/types.ts` change.
14. **Track C (backend)** — no frontend UI changes until the backend module
    and endpoint are passing their tests.
15. **Track D (unmapped endpoints)** — each phase is independent; read the
    existing component before editing.

### Quality gate

16. 431 tests must still pass after each phase. If a test breaks, fix it
    before proceeding.
17. Run the acceptance test at the end of every phase. Do not start the next
    phase until the current one passes.
18. Read the target file fully before editing. Never edit by guessing structure.

---

# Current state — what is implemented vs what is missing

## What exists and works (implemented end-to-end)

| Feature | Backend | Frontend |
|---------|---------|---------|
| Birth chart calculation (D1/D9/D10) | ✓ | ✓ |
| Daily guidance score | ✓ | ✓ |
| Vimshottari dasha timeline | ✓ | ✓ |
| Life areas (6 domains, score 0-100) | Yes | Yes |
| Peyarchi (transit) alerts | ✓ | ✓ |
| Ask Vinaadi (Claude Q&A) | ✓ | ✓ |
| Synastry (chart-to-chart) | Yes | Yes |
| Porutham (marriage matching) | ✓ | ✓ |
| Family vault management | ✓ | ✓ |
| Journal (create, read, archive + edit + export + retention) | Yes | Yes |
| Muhurta (auspicious timing) | ✓ | ✓ |
| Annual wrapped | ✓ | ✓ |
| Panchangam | ✓ | ✓ |
| Life event log | ✓ | ✓ |
| Retrospective analysis | ✓ | ✓ |
| Rectification wizard | ✓ | ✓ |
| Predictions (life areas) | ✓ | ✓ |
| Shadow prompts journal | ✓ | ✓ |
| QA validation (139 cases) | ✓ | Admin only |

## Track B fields now surfaced in frontend

| Field | Source endpoint | Currently shown |
|-------|----------------|----------------|
| `strengthScore` per planet | `GET /charts/{id}/calculate` | Yes |
| `strengthBreakdown` per planet | Same | Yes |
| `activationScore` per yoga | Same | Yes |
| `isCurrentlyActive` per yoga | Same | Yes |
| `cancellationFactors[]` per yoga | Same | Yes |
| `explanationWhat/Why/How` per dosham | Same | Yes |
| `missingData[]` per dosham | Same | Yes |
| `isCancelled` per dosham | Same | Yes |
| `dashaActivation` per life area | `GET /life-areas` | Yes |
| `karakaStatus` per life area | Same | Yes |
| `primaryHouseStrength` per life area | Same | Yes |
| `supportingFactors[]` per life area | Same | Yes |
| `blockingFactors[]` per life area | Same | Yes |
| `driver.planet` + `driver.reason` | Same | Yes |
| `next30DayOutlook` per life area | Same | Yes |
| `transitSupport` per life area | Same | Yes |
| `pratyantarNarrative` | `GET /charts/{id}/daily-guidance` | Yes |
| `emotionalWeather` | Same | Yes |
| `nakshatraPerspective` | Same | Yes |
| `interpretationKey` per transit | `GET /transits/{id}/major` | Yes |

## Backend endpoints with no frontend (Track D)

| Endpoint | File | What it does | Status |
|----------|------|-------------|--------|
| `GET /charts/{id}/event-windows` | `charts.py:108` | 20-year marriage/career/finance windows | Done |
| `GET /charts/{id}/export/pdf` | `charts.py:168` | Download full chart as PDF | Done |
| `GET /charts/{id}/chara-dasha` | `charts.py:190` | Jaimini Chara Dasha timeline | Done |
| `GET /charts/{id}/solar-return` | `charts.py:219` | Annual Tajaka chart | Done |
| `GET /charts/{id}/transits/major` | `transits.py:58` | Major planet transits only | Done (used by Transits tab) |
| `PATCH /journal/{id}` | `journal.py:96` | Edit existing journal entry | Done |
| `GET /journal/export` | `journal.py:209` | Download journal as CSV/PDF | Done |
| `POST /journal/retention/apply` | `journal.py:122` | Apply retention window | Done |
| `GET /family-vaults/{id}/journal` | `journal.py:230` | Family-level journal view | Done |
| `GET /family-vaults/{id}/journal/summary` | `journal.py:249` | Family journal summary | Done |
| `GET /family-vaults/{id}/summary` | `family_vaults.py:183` | Family aggregate summary card | Done |
| `GET /family-vaults/{id}/today` | `family_vaults.py:198` | All members' today scores | Done |
| `GET /family-vaults/{id}/composite` | `family_vaults.py:226` | Composite score timeline | Done |
| `PUT /settings/notifications/fcm-token` | `notification_preferences.py:100` | Register push token | Done |
| `DELETE /settings/notifications/fcm-token` | `notification_preferences.py:117` | Remove push token | Done |

## Known bugs

| Bug | File | Line | Description |
|-----|------|------|-------------|
| (Resolved 2026-05-31) Export route prefix inconsistency | `dashboard-personal-tab.tsx`, `dashboard-journal-tab.tsx` | n/a | Standardized binary downloads to `/api/v1/...` |

---

# Track B — Surface the backend data in the frontend

**Scope:** No `.py` files change. Only `web/` files and `web/lib/types.ts`.  
**Goal:** Make data the API already returns visible to users across four tabs.

---

## B-Phase 1 — Yoga & Dosham panel depth

**File:** `web/components/dashboard-yoga-dosham-panel.tsx`  
**Also:** `web/lib/types.ts`

Read both files fully before editing.

### B1.1 — Update TypeScript types

In `web/lib/types.ts`, confirm or add these fields to `ChartYogaInsight`:

```typescript
export interface ChartYogaInsight {
  name: string;
  isPresent: boolean;
  strength: "STRONG" | "PARTIAL" | "WEAK";
  conditionsMet: string[];
  cancellationFactors: string[];    // add if missing
  dashaActivated: boolean;
  activationScore: number;           // add if missing
  isCurrentlyActive: boolean;        // add if missing
  descriptionTa: string;
  descriptionEn: string;
}
```

Confirm or add these fields to `ChartDoshamInsight`:

```typescript
export interface ChartDoshamInsight {
  name: string;
  isPresent: boolean;
  isCancelled: boolean;             // add if missing
  strength: string;
  label: string;
  category: string;
  conditionsMet: string[];
  cancellationFactors: string[];    // add if missing
  missingData: string[];            // add if missing
  dashaActivated: boolean;
  descriptionTa: string;
  descriptionEn: string;
  explanationWhatTa: string;        // add if missing
  explanationWhatEn: string;        // add if missing
  explanationWhyTa: string;         // add if missing
  explanationWhyEn: string;         // add if missing
  explanationHowTa: string;         // add if missing
  explanationHowEn: string;         // add if missing
}
```

### B1.2 — Activation badge on yoga card

Inside the yoga card `<button>`, after the existing strength badge, add:

```tsx
{yoga.isPresent && typeof yoga.activationScore === "number" && (
  <span style={{
    fontSize: "0.625rem",
    fontWeight: 700,
    padding: "var(--space-0_5) var(--space-2)",
    borderRadius: "var(--radius-pill)",
    background: yoga.isCurrentlyActive ? "#DCE4D2" : "var(--color-surface-soft)",
    color: yoga.isCurrentlyActive ? "var(--color-score-high)" : "var(--color-faint)",
    border: `1px solid ${yoga.isCurrentlyActive ? "rgba(92,118,84,0.4)" : "var(--color-border)"}`,
    marginLeft: "var(--space-1_5)",
    flexShrink: 0,
  }}>
    {yoga.isCurrentlyActive
      ? (lang === "ta" ? "தசையில் உள்ளது" : "Active in dasha")
      : `${yoga.activationScore}/100`}
  </span>
)}
```

### B1.3 — Cancellation factors in expanded yoga body

After the `conditionsMet` list in the expanded accordion:

```tsx
{Array.isArray(yoga.cancellationFactors) && yoga.cancellationFactors.length > 0 && (
  <div style={{ marginTop: "var(--space-3)" }}>
    <p style={{
      margin: "0 0 var(--space-1)",
      fontSize: "0.625rem",
      fontWeight: 700,
      color: "var(--color-faint)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    }}>
      {lang === "ta" ? "நிவர்த்தி காரணங்கள்" : "Cancellation factors"}
    </p>
    {yoga.cancellationFactors.map((factor) => (
      <p key={factor} style={{ margin: "var(--space-0_75) 0", fontSize: "0.875rem", color: "var(--color-muted)" }}>
        {"· "}{markerLabel(factor, lang)}
      </p>
    ))}
  </div>
)}
```

`markerLabel()` already exists in the component — use it directly.

### B1.4 — Dosham three-layer explanation (What / Why / How)

After the existing `descriptionEn`/`descriptionTa` text in the dosham
expanded body:

```tsx
{[
  { sectionKey: "What", labelTa: "என்ன", labelEn: "What this is",
    ta: dosham.explanationWhatTa, en: dosham.explanationWhatEn },
  { sectionKey: "Why",  labelTa: "ஏன்",  labelEn: "Why your chart has this",
    ta: dosham.explanationWhyTa,  en: dosham.explanationWhyEn  },
  { sectionKey: "How",  labelTa: "எப்படி", labelEn: "How it affects you",
    ta: dosham.explanationHowTa,  en: dosham.explanationHowEn  },
].filter((s) => (lang === "ta" ? s.ta : s.en)).map((section) => (
  <div key={section.sectionKey} style={{ marginTop: "var(--space-3)" }}>
    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
      color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {lang === "ta" ? section.labelTa : section.labelEn}
    </p>
    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.6 }}>
      {lang === "ta" ? section.ta : section.en}
    </p>
  </div>
))}
```

### B1.5 — Missing data warning

After the three-layer section:

```tsx
{Array.isArray(dosham.missingData) && dosham.missingData.length > 0 && (
  <p style={{ marginTop: "var(--space-3)", fontSize: "0.75rem",
    color: "var(--color-score-mid)", fontStyle: "italic", lineHeight: 1.5 }}>
    {lang === "ta"
      ? "குறிப்பு: பிறந்த நேரம் இல்லாததால் இந்த மதிப்பீடு தோராயமானது."
      : "Note: this assessment is estimated because exact birth time is unavailable."}
  </p>
)}
```

**Acceptance test:**
```powershell
npx tsc --noEmit
```
Dashboard → Personal → Yogas: a yoga active in current dasha shows green
"Active in dasha" badge. Expand a dosham: What / Why / How blocks appear.
Tamil and English both render without mojibake.

---

## B-Phase 2 — Life Areas tab depth

**Files:** `web/components/dashboard-life-areas-tab.tsx`,
`web/components/life-area-card.tsx`, `web/lib/types.ts`

Read all three files fully before editing.

### B2.1 — Update TypeScript types

In `web/lib/types.ts`, confirm or add to `LifeAreaData`:

```typescript
export interface LifeAreaDriver {
  planet: string;
  reason: { ta: string; en: string };
}

export interface LifeAreaData {
  area: string;
  label: { ta: string; en: string };
  score: number;
  trend: "UP" | "DOWN" | "STABLE";
  confidence: string;
  confidenceReason: { ta: string; en: string };
  primaryHouseStrength: "STRONG" | "NEUTRAL" | "WEAK";
  karakaStatus: "STRONG" | "MODERATE" | "WEAK";
  dashaActivation: boolean;
  transitSupport: number;
  supportingFactors: string[];
  blockingFactors: string[];
  driver: LifeAreaDriver;
  narrative: { ta: string; en: string };
  remedy: { ta: string; en: string };
  next30DayOutlook: { ta: string; en: string };
  caution: { ta: string; en: string } | null;
}
```

### B2.2 — Add `humaniseFactorKey()` helper

Add near the top of `dashboard-life-areas-tab.tsx` (after imports, before
component function):

```tsx
const FACTOR_LABELS: Record<string, { ta: string; en: string }> = {
  dasha_activates_area:  { en: "Current dasha activates this area",     ta: "தற்போதைய தசை இந்த பகுதியை செயல்படுத்துகிறது" },
  house_av_strong:       { en: "Ashtakavarga bindus strong (≥28)",      ta: "அஷ்டகவர்க்க பிந்துக்கள் வலிமையானவை (≥28)" },
  house_av_weak:         { en: "Ashtakavarga bindus weak (≤22)",        ta: "அஷ்டகவர்க்க பிந்துக்கள் பலவீனமானவை (≤22)" },
  too_young:             { en: "Not yet the typical age for this area", ta: "இந்த பகுதிக்கான பொதுவான வயது இன்னும் வரவில்லை" },
  age_limit:             { en: "Past the typical active age",           ta: "இந்த பகுதியின் செயலூக்கமான வயது கடந்துவிட்டது" },
};

function humaniseFactorKey(key: string, lang: Lang): string {
  const exact = FACTOR_LABELS[key];
  if (exact) return lang === "ta" ? exact.ta : exact.en;

  const karakaMatch = key.match(/^([A-Z]+)_karaka_(strong|weak)$/);
  if (karakaMatch) {
    const [, planet, quality] = karakaMatch;
    return lang === "ta"
      ? `${tPlanetLord(planet, lang)} காரகன் ${quality === "strong" ? "வலிமையானவர்" : "பலவீனமானவர்"}`
      : `${planet.charAt(0) + planet.slice(1).toLowerCase()} karaka is ${quality}`;
  }

  const transitMatch = key.match(/^([A-Z]+)_transit_(supportive|difficult)$/);
  if (transitMatch) {
    const [, planet, quality] = transitMatch;
    return lang === "ta"
      ? `${tPlanetLord(planet, lang)} கோசாரம் ${quality === "supportive" ? "சாதகமானது" : "பாதகமானது"}`
      : `${planet.charAt(0) + planet.slice(1).toLowerCase()} transit is ${quality}`;
  }

  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
```

### B2.3 — Add content to `LifeAreaCard`

**Driver planet line** (above narrative, below score):

```tsx
{area.driver && (
  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
    marginBottom: "var(--space-2_5)", padding: "var(--space-2) var(--space-3)",
    borderRadius: "var(--radius-md)", background: "var(--color-surface-soft)",
    border: "1px solid var(--color-border)" }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%",
      background: DASHA_COLORS[area.driver.planet] ?? "var(--color-accent)",
      flexShrink: 0, display: "inline-block" }} />
    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)" }}>
      <strong style={{ color: "var(--color-text-strong)", fontWeight: 700 }}>
        {tPlanetLord(area.driver.planet, lang)}
      </strong>
      {" — "}{tLang(area.driver.reason, lang)}
    </p>
  </div>
)}
```

**Dasha activation badge** (on card header next to score):

```tsx
{area.dashaActivation && (
  <span style={{ fontSize: "0.625rem", fontWeight: 700,
    padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)",
    background: "#DCE4D2", color: "var(--color-score-high)",
    border: "1px solid rgba(92,118,84,0.35)", marginLeft: "var(--space-1_5)" }}>
    {lang === "ta" ? "தசையில் செயல்" : "Dasha active"}
  </span>
)}
```

**Karaka + house strength chips** (below score number):

```tsx
<div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", marginTop: "var(--space-1_5)" }}>
  {area.karakaStatus && (
    <span style={{ fontSize: "0.625rem", fontWeight: 600,
      padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)",
      background: area.karakaStatus === "STRONG" ? "#DCE4D2"
                : area.karakaStatus === "WEAK"   ? "#F2D8CC"
                : "var(--color-surface-soft)",
      color: area.karakaStatus === "STRONG" ? "var(--color-score-high)"
           : area.karakaStatus === "WEAK"   ? "var(--color-score-low)"
           : "var(--color-faint)",
      border: "1px solid var(--color-border)" }}>
      {lang === "ta" ? "காரகன்" : "Karaka"}{" "}
      {area.karakaStatus === "STRONG" ? (lang === "ta" ? "வலிமை" : "strong")
      : area.karakaStatus === "WEAK"  ? (lang === "ta" ? "பலவீனம்" : "weak")
      : (lang === "ta" ? "மிதமான" : "moderate")}
    </span>
  )}
  {area.primaryHouseStrength && (
    <span style={{ fontSize: "0.625rem", fontWeight: 600,
      padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)",
      background: "var(--color-surface-soft)", color: "var(--color-faint)",
      border: "1px solid var(--color-border)" }}>
      {lang === "ta" ? "வீடு" : "House"}{" "}
      {area.primaryHouseStrength === "STRONG" ? (lang === "ta" ? "வலிமை" : "strong")
      : area.primaryHouseStrength === "WEAK"  ? (lang === "ta" ? "பலவீனம்" : "weak")
      : (lang === "ta" ? "சராசரி" : "neutral")}
    </span>
  )}
</div>
```

**Supporting / blocking factors** (in expandable detail or drawer):

```tsx
{((area.supportingFactors?.length ?? 0) > 0 || (area.blockingFactors?.length ?? 0) > 0) && (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
    {(area.supportingFactors?.length ?? 0) > 0 && (
      <div>
        <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
          color: "var(--color-score-high)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {lang === "ta" ? "உதவும் காரணங்கள்" : "Supporting"}
        </p>
        {area.supportingFactors.map((f) => (
          <p key={f} style={{ margin: "var(--space-0_75) 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
            {"· "}{humaniseFactorKey(f, lang)}
          </p>
        ))}
      </div>
    )}
    {(area.blockingFactors?.length ?? 0) > 0 && (
      <div>
        <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
          color: "var(--color-score-low)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {lang === "ta" ? "தடை காரணங்கள்" : "Blocking"}
        </p>
        {area.blockingFactors.map((f) => (
          <p key={f} style={{ margin: "var(--space-0_75) 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
            {"· "}{humaniseFactorKey(f, lang)}
          </p>
        ))}
      </div>
    )}
  </div>
)}
```

**30-day outlook** (below narrative):

```tsx
{area.next30DayOutlook && tLang(area.next30DayOutlook, lang) && (
  <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3) var(--space-4)",
    borderRadius: "var(--radius-md)", background: "var(--color-surface-soft)",
    border: "1px solid var(--color-border)" }}>
    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
      color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {lang === "ta" ? "அடுத்த 30 நாட்கள்" : "Next 30 days"}
    </p>
    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.6 }}>
      {tLang(area.next30DayOutlook, lang)}
    </p>
  </div>
)}
```

**Acceptance test:**
```powershell
npx tsc --noEmit
```
Life Areas tab: each card shows driver planet coloured dot + name + reason,
dasha active badge when applicable, karaka/house chips, supporting/blocking
factor lists, 30-day outlook. Tamil and English both work.

---

## B-Phase 3 — Personal tab: Pratyantar + Emotional weather + Nakshatra

**File:** `web/components/dashboard-personal-tab.tsx`

Read fully before editing.

### B3.1 — Update TypeScript types

In `web/lib/types.ts`, confirm or add to `DailyGuidanceData`:

```typescript
export interface DailyGuidanceEmotionalWeather {
  tone: string;
  physicalTendency: string;
  bestUseOfDay: string;
  toneText: { ta: string; en: string };
  physicalTendencyText: { ta: string; en: string };
  bestUseOfDayText: { ta: string; en: string };
  avoidBefore: { ta: string; en: string } | null;
}

export interface DailyGuidanceData {
  // ... existing fields ...
  pratyantarNarrative: { ta: string; en: string } | null;
  emotionalWeather: DailyGuidanceEmotionalWeather | null;
  nakshatraPerspective: { ta: string; en: string } | null;
}
```

### B3.2 — Nakshatra perspective (below score label)

```tsx
{todayGuidance?.nakshatraPerspective && tLang(todayGuidance.nakshatraPerspective, lang) && (
  <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.875rem",
    color: "var(--color-muted)", lineHeight: 1.6, fontStyle: "italic",
    fontFamily: "var(--font-body)" }}>
    {tLang(todayGuidance.nakshatraPerspective, lang)}
  </p>
)}
```

### B3.3 — Emotional weather 3-card grid

Below the score section (after best/caution windows):

```tsx
{todayGuidance?.emotionalWeather && (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
    {[
      { labelTa: "உணர்வு நிலை",   labelEn: "Emotional tone",
        value: lang === "ta" ? todayGuidance.emotionalWeather.toneText?.ta : todayGuidance.emotionalWeather.toneText?.en },
      { labelTa: "உடல் போக்கு",   labelEn: "Physical tendency",
        value: lang === "ta" ? todayGuidance.emotionalWeather.physicalTendencyText?.ta : todayGuidance.emotionalWeather.physicalTendencyText?.en },
      { labelTa: "சிறந்த பயன்பாடு", labelEn: "Best use of day",
        value: lang === "ta" ? todayGuidance.emotionalWeather.bestUseOfDayText?.ta : todayGuidance.emotionalWeather.bestUseOfDayText?.en },
    ].filter((row) => row.value).map((row) => (
      <div key={row.labelEn} style={{ padding: "var(--space-2_5) var(--space-3)",
        borderRadius: "var(--radius-md)", background: "var(--color-surface-soft)",
        border: "1px solid var(--color-border)" }}>
        <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700,
          color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em",
          fontFamily: "var(--font-body)" }}>
          {lang === "ta" ? row.labelTa : row.labelEn}
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-strong)",
          fontWeight: 600, fontFamily: "var(--font-body)" }}>
          {row.value}
        </p>
      </div>
    ))}
  </div>
)}
```

### B3.4 — Pratyantar narrative block (below dasha section)

```tsx
{todayGuidance?.pratyantarNarrative && tLang(todayGuidance.pratyantarNarrative, lang) && (
  <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3) var(--space-4)",
    borderRadius: "var(--radius-md)", background: "#F0D9C4",
    border: "1px solid rgba(184,90,44,0.25)" }}>
    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
      color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.08em",
      fontFamily: "var(--font-body)" }}>
      {lang === "ta" ? "பிரத்யந்தர தசை" : "Pratyantar period"}
    </p>
    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.6,
      fontFamily: "var(--font-body)" }}>
      {tLang(todayGuidance.pratyantarNarrative, lang)}
    </p>
  </div>
)}
```

**Acceptance test:**
```powershell
npx tsc --noEmit
```
Personal tab: nakshatra perspective shows in italic below score. Emotional
weather 3-card grid visible. When Pratyantar expires within 90 days, orange
narrative block appears below dasha section.

---

## B-Phase 4 — Transits tab: planet strength + Shadbala breakdown

**File:** `web/components/dashboard-transits-tab.tsx`

Read fully before editing.

### B4.1 — Update TypeScript types

In `web/lib/types.ts`, confirm or add to `ChartPlanet`:

```typescript
export interface ChartPlanet {
  graha: string;
  rasiName: string;
  absoluteLongitude: number;
  rasi: number;
  degreeInRasi: number;
  nakshatra: number;
  nakshatraName: string;
  pada: number;
  houseFromLagna: number;
  speedDegPerDay: number;
  isRetrograde: boolean;
  isCombust: boolean;
  d9Rasi: number;
  isVargottama: boolean;
  showRetrogradeBadge: boolean;
  strengthScore: number;           // add if missing — 0-95
  strengthBreakdown: {             // add if missing
    sthana: "STRONG" | "NEUTRAL" | "WEAK";
    dik:    "STRONG" | "NEUTRAL" | "WEAK";
    kala:   "STRONG" | "NEUTRAL" | "WEAK";
    chesta: "STRONG" | "NEUTRAL" | "WEAK";
    naisargika: "STRONG" | "NEUTRAL" | "WEAK";
    drik:   "STRONG" | "NEUTRAL" | "WEAK";
  };
}
```

Also add to `TransitPosition`:

```typescript
export interface TransitPosition {
  // ... existing fields ...
  interpretationKey: string;  // add if missing
}
```

### B4.2 — Strength score + Shadbala chips on each transit planet card

After the existing flag badges (retrograde, combust, gandanta, sandhi):

```tsx
{(() => {
  const natal = personalChart?.planets?.find((p) => p.graha === pos.graha);
  if (!natal?.strengthScore) return null;
  const bd = natal.strengthBreakdown ?? {};
  const abbr: Record<string, string> = {
    sthana: "STA", dik: "DIK", kala: "KAL",
    chesta: "CHS", naisargika: "NAI", drik: "DRK",
  };
  return (
    <div style={{ marginTop: "var(--space-2)" }}>
      <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
        color: natal.strengthScore >= 65 ? "var(--color-score-high)"
             : natal.strengthScore <= 35 ? "var(--color-score-low)"
             : "var(--color-score-mid)" }}>
        {lang === "ta" ? "நட்டாள் வலிமை" : "Natal strength"}{" "}{natal.strengthScore}/95
      </p>
      <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
        {(Object.entries(bd) as [string, string][]).map(([key, val]) => (
          <span key={key} style={{ fontSize: "0.5rem", fontWeight: 700,
            padding: "1px 5px", borderRadius: "var(--radius-pill)",
            background: val === "STRONG" ? "#DCE4D2" : val === "WEAK" ? "#F2D8CC" : "var(--color-surface-soft)",
            color: val === "STRONG" ? "var(--color-score-high)" : val === "WEAK" ? "var(--color-score-low)" : "var(--color-faint)",
            border: "1px solid var(--color-border)", textTransform: "uppercase" }}>
            {abbr[key] ?? key.slice(0, 3).toUpperCase()}:{val.slice(0, 1)}
          </span>
        ))}
      </div>
    </div>
  );
})()}
```

### B4.3 — Interpretation key label

```tsx
{pos.interpretationKey && (
  <p style={{ margin: "var(--space-1) 0 0", fontSize: "0.625rem",
    color: "var(--color-faint)", fontStyle: "italic", fontFamily: "var(--font-body)" }}>
    {pos.interpretationKey.replace(/_/g, " ")}
  </p>
)}
```

**Acceptance test:**
```powershell
npx tsc --noEmit
```
Transits tab: each planet card shows natal strength score (colour-coded) and
6 Shadbala abbreviation chips (STA:S, DIK:N, etc.). Interpretation key shows
in faint italic below chips.

---

## B-Phase 5 — Final TypeScript check and commit

```powershell
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro\web'
npx tsc --noEmit 2>&1 | Select-Object -First 40
```

Fix every error. Then commit:

```powershell
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro'
git add web/components/dashboard-yoga-dosham-panel.tsx
git add web/components/dashboard-life-areas-tab.tsx
git add web/components/life-area-card.tsx
git add web/components/dashboard-personal-tab.tsx
git add web/components/dashboard-transits-tab.tsx
git add web/lib/types.ts
git commit -m @'
feat(frontend): surface Shadbala, yoga activation, karaka chains in dashboard

- Yoga cards: activation score badge, cancellation factors list
- Dosham cards: What/Why/How three-layer explanation, missing-data warning
- Life area cards: driver planet, dasha active badge, karaka/house chips,
  supporting/blocking factors, 30-day outlook
- Personal tab: nakshatra perspective, emotional weather grid (3 cards),
  pratyantar narrative block
- Transits tab: natal strength score + 6 Shadbala breakdown chips per planet

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

---

# Track C — New classical astrology modules

**Scope:** Backend calculation files, API endpoints, tests. No frontend UI
changes until C1's small indicator and C2/C3's widgets.  
**Goal:** Three independent classical modules — Hora lord, Chara Dasha, Tajaka.

Execute C1 → C2 → C3 in order.

---

## C-Phase 1 — Hora lord real-time signal

**What it does:** The panchangam already computes 12 planetary hours (hora)
per day. Each hora is ruled by one of the 7 classical planets in a fixed
sequence (Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars — repeating). The
hora lord at the current time of day is a classical signal used in Tamil
Jyotish for auspicious action timing. This phase adds the current hora lord
to the daily guidance response and shows it as a small indicator in the
Personal tab.

**Files changed:**
- `app/schemas/daily_guidance.py` — add field
- `app/services/daily_guidance_service.py` — add helper + call
- `web/components/dashboard-personal-tab.tsx` — add indicator
- `web/lib/types.ts` — add field

### C1.1 — Add schema field

In `app/schemas/daily_guidance.py`, add to `DailyGuidanceData`:

```python
current_hora_lord: str | None = Field(default=None, alias="currentHoraLord")
```

### C1.2 — Add helper to `daily_guidance_service.py`

```python
from datetime import time as _time_type

def _current_hora_lord(hora_list: list[dict], current_time: _time_type) -> str | None:
    """
    Return the hora lord at the given local time.
    hora_list: list of { "lord": str, "start": "HH:MM", "end": "HH:MM" }
    Returns the planet name string or None if hora list is empty.
    """
    current_minutes = current_time.hour * 60 + current_time.minute
    for hora in hora_list:
        try:
            sh, sm = map(int, hora["start"].split(":"))
            eh, em = map(int, hora["end"].split(":"))
            start_m = sh * 60 + sm
            end_m   = eh * 60 + em
            if start_m <= current_minutes < end_m:
                return hora["lord"].upper()
        except (KeyError, ValueError):
            continue
    return None
```

In `build_daily_guidance_response()`, call it:

```python
from datetime import datetime, timezone
now_time = datetime.now(timezone.utc).astimezone().time()
hora_lord = _current_hora_lord(panchangam_snapshot.hora or [], now_time)
# Add to DailyGuidanceData: currentHoraLord=hora_lord
```

### C1.3 — Frontend indicator

In `web/lib/types.ts`, add to `DailyGuidanceData`:
```typescript
currentHoraLord: string | null;
```

In `dashboard-personal-tab.tsx`, below the best-windows section:

```tsx
{todayGuidance?.currentHoraLord && (
  <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)",
    padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)",
    background: "var(--color-surface-soft)", border: "1px solid var(--color-border)",
    marginTop: "var(--space-2)" }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%",
      background: DASHA_COLORS[todayGuidance.currentHoraLord] ?? "var(--color-accent)",
      display: "inline-block", flexShrink: 0 }} />
    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
      {lang === "ta" ? "இப்போது" : "Now"}{" — "}
      <strong style={{ color: DASHA_COLORS[todayGuidance.currentHoraLord] ?? "var(--color-accent)" }}>
        {tPlanetLord(todayGuidance.currentHoraLord, lang)}{" "}
        {lang === "ta" ? "ஹோரா" : "hora"}
      </strong>
    </span>
  </div>
)}
```

**Acceptance test:**
```powershell
$env:PYTHONIOENCODING = "utf-8" ; $env:PYTHONUTF8 = "1"
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
python -m pytest tests/test_panchangam.py tests/test_daily_guidance_api.py -v
npx tsc --noEmit
```
`/charts/{id}/daily-guidance` response includes `currentHoraLord`. Personal
tab shows coloured hora indicator next to "Now".

---

## C-Phase 2 — Jaimini Chara Dasha

**What it does:** Jaimini's Chara Dasha is a sign-based dasha system. Unlike
Vimshottari (planet-based, 120-year cycle), Chara Dasha assigns each rasi a
period of 1–12 years based on where the rasi's sign lord is placed. It is
used for timing life events: marriage, career change, relocation.

**Classical rules:**

| Rasi type | Rasis | Period formula |
|-----------|-------|----------------|
| Movable (Chara) | 1,4,7,10 | `years = 12 - distance(rasi→lord) + 1` |
| Fixed (Sthira) | 2,5,8,11 | `years = distance(rasi→lord)` |
| Dual (Dvisvabhava) | 3,6,9,12 | lord in same sign or 7th: 9 years; else: movable formula |

- Sequence starts from Lagna rasi
- Odd Lagna (1,3,5,7,9,11): forward (Mesham→Meenam)
- Even Lagna (2,4,6,8,10,12): reverse (Meenam→Mesham)
- All values clamped: `max(1, min(12, years))`
- distance() = 1 means same sign, 7 means opposite

**Files changed:**
- `app/calculations/jaimini_dasha.py` (new file)
- `app/api/charts.py` — add endpoint (already exists stub at line 190)
- `tests/test_jaimini_dasha.py` (new file)
- `web/components/dashboard-personal-tab.tsx` — Chara Dasha section

### C2.1 — New calculation file

`app/calculations/jaimini_dasha.py` — the endpoint stub at `charts.py:190`
already calls `calculate_chara_dasha` and `current_chara_dasha` from this
module. Create the file with this implementation:

```python
"""
Jaimini Chara Dasha — sign-based dasha system.
Classical Parashari-Jaimini formula as used in Thirukanitham tradition.
"""
from __future__ import annotations

from datetime import date
from typing import Mapping

from app.calculations.astro import house_from_reference, RASI_NAMES
from app.calculations.chart_strength import SIGN_LORD

MOVABLE_RASIS = frozenset({1, 4, 7, 10})
FIXED_RASIS   = frozenset({2, 5, 8, 11})
DUAL_RASIS    = frozenset({3, 6, 9, 12})
ODD_RASIS     = frozenset({1, 3, 5, 7, 9, 11})


def _chara_period_years(rasi: int, planet_rasi_map: Mapping[str, int]) -> int:
    """Return the Chara Dasha period in years for a given rasi."""
    sign_lord = SIGN_LORD[rasi]
    lord_rasi = planet_rasi_map.get(sign_lord, rasi)
    dist = house_from_reference(rasi, lord_rasi)  # 1=same, 7=opposite

    if rasi in MOVABLE_RASIS:
        years = 12 - dist + 1
    elif rasi in FIXED_RASIS:
        years = dist
    else:  # DUAL_RASIS
        years = 9 if dist in {1, 7} else 12 - dist + 1

    return max(1, min(12, years))


def _dasha_sequence_order(lagna_rasi: int) -> list[int]:
    """Return rasi order for Chara Dasha starting from Lagna."""
    forward = lagna_rasi in ODD_RASIS
    full_order = list(range(1, 13)) if forward else list(range(12, 0, -1))
    start_idx = full_order.index(lagna_rasi)
    return full_order[start_idx:] + full_order[:start_idx]


def calculate_chara_dasha(
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    birth_date: date,
) -> list[dict]:
    """
    Full Jaimini Chara Dasha sequence from birth date.
    Returns list of { rasi, rasi_name, years, start_date, end_date }.
    """
    from dateutil.relativedelta import relativedelta

    rasi_order = _dasha_sequence_order(lagna_rasi)
    periods: list[dict] = []
    current = birth_date

    for rasi in rasi_order:
        years = _chara_period_years(rasi, planet_rasi_map)
        end = current + relativedelta(years=years)
        periods.append({
            "rasi":       rasi,
            "rasi_name":  RASI_NAMES.get(rasi, str(rasi)),
            "years":      years,
            "start_date": current,
            "end_date":   end,
        })
        current = end

    return periods


def current_chara_dasha(
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    birth_date: date,
    as_of: date | None = None,
) -> dict | None:
    """Return the currently running Chara Dasha period, or None."""
    today = as_of or date.today()
    for period in calculate_chara_dasha(lagna_rasi, planet_rasi_map, birth_date):
        if period["start_date"] <= today < period["end_date"]:
            return period
    return None
```

### C2.2 — Tests

Create `tests/test_jaimini_dasha.py`:

```python
"""Tests for Jaimini Chara Dasha calculation."""
from datetime import date
from app.calculations.jaimini_dasha import (
    _chara_period_years, _dasha_sequence_order,
    calculate_chara_dasha, current_chara_dasha,
)

def test_movable_rasi_period():
    # Mars in 7th from Mesham (1) → dist=7 → years = 12-7+1 = 6
    assert _chara_period_years(1, {"MARS": 7}) == 6

def test_fixed_rasi_period():
    # Venus in 3rd from Rishabam (2) → dist=3 → years = 3
    assert _chara_period_years(2, {"VENUS": 4}) == 3

def test_dual_rasi_lord_in_7th():
    # Mithunam (3) Dual, Mercury in Dhanusu (9) = 7th from Mithunam → 9 years
    assert _chara_period_years(3, {"MERCURY": 9}) == 9

def test_mesham_lagna_forward():
    order = _dasha_sequence_order(1)
    assert order[0] == 1 and order[1] == 2

def test_rishabam_lagna_reverse():
    order = _dasha_sequence_order(2)
    assert order[0] == 2 and order[1] == 1

def test_full_sequence_has_12_periods():
    pm = {"MARS": 5, "VENUS": 3, "MERCURY": 8, "MOON": 2,
          "SUN": 10, "JUPITER": 1, "SATURN": 6}
    periods = calculate_chara_dasha(1, pm, date(1990, 1, 1))
    assert len(periods) == 12

def test_current_period_within_range():
    pm = {"MARS": 5, "VENUS": 3, "MERCURY": 8, "MOON": 2,
          "SUN": 10, "JUPITER": 1, "SATURN": 6}
    birth = date(1990, 1, 1)
    today = date(2026, 1, 1)
    current = current_chara_dasha(1, pm, birth, as_of=today)
    assert current is not None
    assert current["start_date"] <= today < current["end_date"]
```

### C2.3 — Frontend: Chara Dasha section

In `dashboard-personal-tab.tsx`, add a collapsible section in the Dasha tab
area (after Vimshottari, or as a sub-tab):

```tsx
// Fetch chara dasha
const [charaDasha, setCharaDasha] = useState<CharaDashaData | null>(null);

// In useEffect or on-demand fetch:
// apiFetchJson<{ success: boolean; data: CharaDashaData }>(`/charts/${chartId}/chara-dasha`)

{charaDasha && (
  <CollapsibleSection
    title={lang === "ta" ? "ஜைமினி சார தசை" : "Jaimini Chara Dasha"}
    defaultOpen={false}
  >
    <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.75rem",
      color: "var(--color-muted)", fontFamily: "var(--font-body)" }}>
      {lang === "ta"
        ? "இது ராசி அடிப்படையிலான தசை — திருமணம், வாழ்க்கை மாற்றம் போன்ற நிகழ்வு-நேரம் காட்டுகிறது."
        : "Sign-based dasha — used for timing life events like marriage and career change."}
    </p>
    {charaDasha.currentPeriod && (
      <div style={{ marginBottom: "var(--space-3)", padding: "var(--space-3)",
        borderRadius: "var(--radius-md)", background: "#DCE4D2",
        border: "1px solid rgba(92,118,84,0.35)" }}>
        <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700,
          color: "var(--color-score-high)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {lang === "ta" ? "தற்போதைய சார தசை" : "Current Chara Dasha"}
        </p>
        <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
          {charaDasha.currentPeriod.rasi_name}
        </p>
        <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
          {charaDasha.currentPeriod.start_date} — {charaDasha.currentPeriod.end_date}
        </p>
      </div>
    )}
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      {charaDasha.periods.map((p) => (
        <div key={p.rasi} style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "var(--space-1_5) var(--space-3)",
          borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
          background: charaDasha.currentPeriod?.rasi === p.rasi
            ? "var(--color-surface-soft)" : "transparent" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-strong)", fontWeight: 600 }}>
            {p.rasi_name}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
            {p.years} {lang === "ta" ? "ஆண்டுகள்" : "yrs"}{" "}
            · {p.start_date}
          </span>
        </div>
      ))}
    </div>
  </CollapsibleSection>
)}
```

Add types to `web/lib/types.ts`:

```typescript
export interface CharaDashaPeriod {
  rasi: number;
  rasi_name: string;
  years: number;
  start_date: string;
  end_date: string;
}

export interface CharaDashaData {
  chartId: string;
  lagnaRasi: number;
  currentPeriod: CharaDashaPeriod | null;
  periods: CharaDashaPeriod[];
}
```

**Acceptance test:**
```powershell
$env:PYTHONIOENCODING = "utf-8" ; $env:PYTHONUTF8 = "1"
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
python -m pytest tests/test_jaimini_dasha.py -v
python -m pytest tests/ -q 2>&1 | Select-Object -Last 5
npx tsc --noEmit
```
All 7 Chara Dasha tests pass. Full suite (431+) still passes.

---

## C-Phase 3 — Tajaka Solar Return Chart

**What it does:** A solar return (Tajaka) chart is cast for the exact moment
the Sun returns to its natal sidereal ecliptic longitude each year (precision:
better than 1 second). It gives a 12-month ahead picture.

**Key indicators:**
- **SR Lagna:** Ascendant at the moment of return. If same as natal Lagna → strong year.
- **Muntha:** Moves 1 rasi per year from natal Lagna. Classical timing indicator.
  Formula: `muntha = ((natal_lagna - 1 + years_elapsed) % 12) + 1`
- **Varshesh (Year Lord):** Hora lord at the exact moment of return.
- **Tajaka yogas (5):** Ithasala (applying), Ishrafa (separating), Nakta (transfer),
  Yamaya (identical), Musaripha (cancelled).

**Files changed:**
- `app/calculations/tajaka.py` (new file)
- `app/api/charts.py` — endpoint stub at line 219 calls `calculate_tajaka_chart`
- `tests/test_tajaka.py` (new file)
- `web/components/dashboard-personal-tab.tsx` — Annual chart widget

### C3.1 — New calculation file

`app/calculations/tajaka.py`:

```python
"""
Tajaka solar return chart calculator.
Finds the Julian Day when the Sun returns to its natal sidereal longitude
and computes the solar return chart for that moment.
"""
from __future__ import annotations

from datetime import UTC, datetime

from app.calculations.astro import (
    normalize_longitude,
    rasi_from_degree,
    utc_datetime_to_julian_day,
    RASI_NAMES,
)
from app.calculations.ephemeris import calculate_sidereal_planets, compute_lagna


def _sun_lon_at_jd(jd: float, lat: float, lon: float, ayanamsa: str) -> float:
    snap = calculate_sidereal_planets(jd, lat, lon, ayanamsa)
    return normalize_longitude(snap.sun_longitude)


def find_solar_return_jd(
    natal_sun_longitude: float,
    return_year: int,
    latitude: float,
    longitude: float,
    ayanamsa_type: str = "LAHIRI",
) -> float:
    """
    Find the Julian Day of the solar return in return_year.
    Bisection search — precision better than 1 second.
    """
    target = normalize_longitude(natal_sun_longitude)
    start_dt = datetime(return_year, 1, 1, 0, 0, 0, tzinfo=UTC)
    jd_lo = utc_datetime_to_julian_day(start_dt)
    jd_hi = jd_lo + 370.0

    for _ in range(60):
        mid = (jd_lo + jd_hi) / 2.0
        lon_at_mid = _sun_lon_at_jd(mid, latitude, longitude, ayanamsa_type)
        diff = (lon_at_mid - target + 180.0) % 360.0 - 180.0
        if abs(diff) < 1e-8:
            break
        if diff < 0:
            jd_lo = mid
        else:
            jd_hi = mid

    return (jd_lo + jd_hi) / 2.0


def calculate_muntha(natal_lagna_rasi: int, birth_year: int, return_year: int) -> int:
    """
    Compute Muntha rasi for the solar return year.
    Moves 1 rasi per year from natal Lagna. Returns 1–12.
    """
    years_elapsed = return_year - birth_year
    return ((natal_lagna_rasi - 1 + years_elapsed) % 12) + 1


def calculate_tajaka_chart(
    natal_sun_longitude: float,
    natal_lagna_rasi: int,
    birth_year: int,
    return_year: int,
    birth_latitude: float,
    birth_longitude: float,
    ayanamsa_type: str = "LAHIRI",
) -> dict:
    """
    Compute the solar return (Tajaka) chart for return_year.

    Returns:
        julian_day: float
        return_year: int
        sr_lagna_rasi: int
        sr_lagna_rasi_name: str
        muntha_rasi: int
        muntha_rasi_name: str
        sun_longitude_at_return: float
        lagna_matches_natal: bool
        planets: EphemerisSnapshot
    """
    sr_jd = find_solar_return_jd(
        natal_sun_longitude, return_year,
        birth_latitude, birth_longitude, ayanamsa_type,
    )
    snap = calculate_sidereal_planets(sr_jd, birth_latitude, birth_longitude, ayanamsa_type)
    lagna_lon = compute_lagna(sr_jd, birth_latitude, birth_longitude, ayanamsa_type)
    sr_lagna_rasi = rasi_from_degree(lagna_lon)
    muntha = calculate_muntha(natal_lagna_rasi, birth_year, return_year)

    return {
        "julian_day":              sr_jd,
        "return_year":             return_year,
        "sr_lagna_rasi":           sr_lagna_rasi,
        "sr_lagna_rasi_name":      RASI_NAMES.get(sr_lagna_rasi, ""),
        "muntha_rasi":             muntha,
        "muntha_rasi_name":        RASI_NAMES.get(muntha, ""),
        "sun_longitude_at_return": normalize_longitude(snap.sun_longitude),
        "lagna_matches_natal":     sr_lagna_rasi == natal_lagna_rasi,
        "planets":                 snap,
    }
```

### C3.2 — Tests

Create `tests/test_tajaka.py`:

```python
"""Tests for Tajaka solar return chart calculation."""
from app.calculations.tajaka import find_solar_return_jd, calculate_muntha
from app.calculations.astro import normalize_longitude
from app.calculations.ephemeris import calculate_sidereal_planets

CHENNAI_LAT = 13.0827
CHENNAI_LON = 80.2707

def test_solar_return_sun_matches_natal():
    """Sun longitude at SR JD must match natal within 0.01 degrees."""
    natal_sun = 285.5
    sr_jd = find_solar_return_jd(natal_sun, 2026, CHENNAI_LAT, CHENNAI_LON)
    snap = calculate_sidereal_planets(sr_jd, CHENNAI_LAT, CHENNAI_LON, "LAHIRI")
    diff = abs(normalize_longitude(snap.sun_longitude) - natal_sun)
    diff = min(diff, 360.0 - diff)
    assert diff < 0.01, f"Sun diff too large: {diff}"

def test_solar_return_jd_in_correct_year():
    """SR JD must correspond to return_year."""
    from datetime import UTC
    from app.calculations.astro import julian_day_to_utc_datetime
    sr_jd = find_solar_return_jd(120.0, 2026, CHENNAI_LAT, CHENNAI_LON)
    sr_dt = julian_day_to_utc_datetime(sr_jd)
    assert sr_dt.year == 2026

def test_muntha_moves_one_rasi_per_year():
    assert calculate_muntha(3, 2000, 2001) == 4  # Mithunam → Kadagam

def test_muntha_wraps_after_meenam():
    assert calculate_muntha(12, 2000, 2001) == 1  # Meenam → Mesham

def test_muntha_at_birth_year_equals_lagna():
    assert calculate_muntha(7, 2000, 2000) == 7
```

### C3.3 — Frontend: Annual Chart widget

In `dashboard-personal-tab.tsx`, add a collapsible "Annual Chart" section:

```tsx
{solarReturn && (
  <CollapsibleSection
    title={lang === "ta" ? `${solarReturn.returnYear} ஆண்டு தாஜகா` : `${solarReturn.returnYear} Annual Chart`}
    defaultOpen={false}
  >
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
      <div>
        <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700,
          color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {lang === "ta" ? "வருட லக்னம்" : "SR Lagna"}
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
          {solarReturn.srLagnaRasiName}
          {solarReturn.lagnaMatchesNatal && (
            <span style={{ marginLeft: "var(--space-1_5)", fontSize: "0.625rem",
              padding: "2px 6px", borderRadius: "var(--radius-pill)",
              background: "#DCE4D2", color: "var(--color-score-high)",
              border: "1px solid rgba(92,118,84,0.35)" }}>
              {lang === "ta" ? "நட்டாள் போல்" : "Same as natal"}
            </span>
          )}
        </p>
      </div>
      <div>
        <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700,
          color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {lang === "ta" ? "முந்தா" : "Muntha"}
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
          {solarReturn.munthaRasiName}
        </p>
      </div>
    </div>
  </CollapsibleSection>
)}
```

Add types to `web/lib/types.ts`:

```typescript
export interface SolarReturnData {
  chartId: string;
  returnYear: number;
  srLagnaRasi: number;
  srLagnaRasiName: string;
  munthaRasi: number;
  munthaRasiName: string;
  lagnaMatchesNatal: boolean;
  sunLongAtReturn: number;
}
```

**Acceptance test:**
```powershell
$env:PYTHONIOENCODING = "utf-8" ; $env:PYTHONUTF8 = "1"
$env:JOTHIDAM_DATABASE_URL = "postgresql://slw_admin:slw_dev_password@localhost:5433/vinaadi_test"
python -m pytest tests/test_tajaka.py -v
python -m pytest tests/ -q 2>&1 | Select-Object -Last 5
npx tsc --noEmit
```

---

## Track C commit

After all three C phases pass:

```powershell
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro'
git add app/calculations/jaimini_dasha.py
git add app/calculations/tajaka.py
git add app/api/charts.py
git add app/schemas/daily_guidance.py
git add app/services/daily_guidance_service.py
git add tests/test_jaimini_dasha.py
git add tests/test_tajaka.py
git add web/components/dashboard-personal-tab.tsx
git add web/lib/types.ts
git commit -m @'
feat(astrology-c): hora lord, Jaimini Chara Dasha, Tajaka solar return

C1: currentHoraLord added to daily guidance — real-time planetary hour indicator
C2: Jaimini Chara Dasha — sign-based dasha, full sequence + current period API
    GET /charts/{id}/chara-dasha — 7 tests covering all rasi type rules
C3: Tajaka solar return — bisection search for exact Sun return JD
    Muntha, SR Lagna, lagna-matches-natal flag
    GET /charts/{id}/solar-return?year=2026 — 5 tests

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
'@
```

---

# Track D — Wire the unmapped backend endpoints

**Goal:** Build frontend surfaces for the 15 backend endpoints that exist but
have no frontend. Each sub-phase is independent unless noted.

**Rules for Track D:**
- Read the target component fully before editing.
- Every new fetch must use `apiFetchJson` from `@/lib/api`.
- No new API routes — endpoints already exist.
- Every UI addition follows the design system tokens above.
- Run `npx tsc --noEmit` before committing each phase.

---

## D-Phase 1 — Fix synastry URL mismatch (Bug fix — do first)

**File:** `web/components/synastry-matrix.tsx`

**Current broken call (line 44):**
```tsx
apiFetchJson(`/charts/synastry?${toQuery({ chart_id: ownerChartId, member_chart_id: m.chartId })}`)
```

**Correct backend route:** `GET /relationships/{member_id}/synastry?familyVaultId=...`

The `SynastryMatrix` component receives `members: MatrixMember[]`. Each member
has `memberId` and `chartId`. The backend also needs `familyVaultId`.

Add `familyVaultId` to the component props and fix the call:

```typescript
interface SynastryMatrixProps {
  lang: Lang;
  ownerChartId: string;
  familyVaultId: string;  // add this
  members: MatrixMember[];
}
```

Replace the broken fetch (lines 42–47) with:

```tsx
const res = await apiFetchJson<ApiEnvelope<SynastryData>>(
  `/relationships/${m.memberId}/synastry?${toQuery({ familyVaultId })}`,
);
setScores((prev) => ({ ...prev, [m.memberId]: res.data?.compatibilityScore ?? null }));
```

Also update every caller of `SynastryMatrix` to pass `familyVaultId`.

**Acceptance test:**
Family tab → Synastry Matrix → Load: compatibility scores now appear instead
of null.

---

## D-Phase 2 — Event windows panel

**What it does:** Shows 20-year favorable/unfavorable windows for marriage,
career, or finance as a scored timeline.

**Backend:** `GET /charts/{id}/event-windows?event=MARRIAGE&fromYear=2024&toYear=2044`

**Target:** New panel in the Life or Predictions tab area. Call it
"Event Windows" / "நிகழ்வு நேரங்கள்".

**New component:** `web/components/dashboard-event-windows.tsx`

```tsx
"use client";

import { useState } from "react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import { tLang } from "@/lib/i18n";

type EventType = "MARRIAGE" | "CAREER" | "FINANCE";

interface EventWindow {
  event: EventType;
  start_date: string;
  end_date: string;
  score: number;
  reasons: string[];
}

interface EventWindowsProps {
  lang: Lang;
  chartId: string;
}

const EVENT_LABELS: Record<EventType, { ta: string; en: string }> = {
  MARRIAGE: { ta: "திருமணம்",  en: "Marriage"  },
  CAREER:   { ta: "தொழில்",    en: "Career"    },
  FINANCE:  { ta: "நிதி",      en: "Finance"   },
};

export function EventWindowsPanel({ lang, chartId }: EventWindowsProps) {
  const [event, setEvent]     = useState<EventType>("MARRIAGE");
  const [windows, setWindows] = useState<EventWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const currentYear           = new Date().getFullYear();

  async function load(evt: EventType) {
    setLoading(true);
    setEvent(evt);
    try {
      const res = await apiFetchJson<{ data: { windows: EventWindow[] } }>(
        `/charts/${chartId}/event-windows?event=${evt}&fromYear=${currentYear}&toYear=${currentYear + 20}`,
      );
      setWindows(res.data?.windows ?? []);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      {/* Event selector */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        {(["MARRIAGE", "CAREER", "FINANCE"] as EventType[]).map((evt) => (
          <button
            key={evt}
            onClick={() => load(evt)}
            style={{
              padding: "var(--space-1_5) var(--space-3)",
              borderRadius: "var(--radius-pill)",
              border: `1px solid ${event === evt ? "var(--color-accent)" : "var(--color-border)"}`,
              background: event === evt ? "var(--color-accent)" : "var(--color-surface)",
              color: event === evt ? "#fff" : "var(--color-text)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {tLang(EVENT_LABELS[evt], lang)}
          </button>
        ))}
      </div>

      {!loaded && (
        <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
          {lang === "ta" ? "ஒரு வகையை தேர்ந்தெடுக்கவும்." : "Select an event type above."}
        </p>
      )}

      {loading && (
        <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
          {lang === "ta" ? "கணக்கிடுகிறோம்..." : "Calculating…"}
        </p>
      )}

      {!loading && loaded && windows.length === 0 && (
        <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
          {lang === "ta" ? "குறிப்பிடத்தக்க நேரங்கள் இல்லை." : "No notable windows in this range."}
        </p>
      )}

      {!loading && windows.map((w, i) => {
        const scoreColor = w.score >= 65 ? "var(--color-score-high)"
                         : w.score >= 45 ? "var(--color-score-mid)"
                         : "var(--color-score-low)";
        const scoreBg = w.score >= 65 ? "#DCE4D2"
                      : w.score >= 45 ? "#F0D9C4"
                      : "#F2D8CC";
        return (
          <div key={i} style={{ marginBottom: "var(--space-2)", padding: "var(--space-3)",
            borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
            background: "var(--color-surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {w.start_date} — {w.end_date}
              </p>
              <span style={{ fontSize: "0.75rem", fontWeight: 700,
                padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)",
                background: scoreBg, color: scoreColor, border: "1px solid var(--color-border)" }}>
                {w.score}/100
              </span>
            </div>
            {w.reasons.length > 0 && (
              <div style={{ marginTop: "var(--space-2)" }}>
                {w.reasons.map((r, j) => (
                  <p key={j} style={{ margin: "var(--space-0_5) 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                    · {r}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

Add to `web/lib/types.ts`:
```typescript
export interface EventWindowItem {
  event: "MARRIAGE" | "CAREER" | "FINANCE";
  start_date: string;
  end_date: string;
  score: number;
  reasons: string[];
}
```

Import and render `<EventWindowsPanel>` in the Life or Predictions tab.

**Acceptance test:** Open the panel, select Marriage, verify windows render
with score colours. Select Career — new set loads.

---

## D-Phase 3 — PDF export button

**Backend:** `GET /charts/{id}/export/pdf?asOf=YYYY-MM-DD`  
Returns binary PDF with `Content-Disposition: attachment`.

**Target:** Add a download button to the chart header or Personal tab settings
area.

```tsx
async function downloadPdf() {
  const today = new Date().toISOString().slice(0, 10);
  const response = await fetch(`/api/v1/charts/${chartId}/export/pdf?asOf=${today}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jadhagam-${chartId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

<button
  onClick={downloadPdf}
  style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)",
    padding: "var(--space-1_5) var(--space-3)", borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)", background: "var(--color-surface)",
    color: "var(--color-text)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
  {lang === "ta" ? "PDF பதிவிறக்கம்" : "Download PDF"}
</button>
```

Note: use `fetch` directly (not `apiFetchJson`) because the response is binary,
not JSON.

**Acceptance test:** Click Download PDF — browser downloads `jadhagam-{id}.pdf`.
File opens as a valid PDF.

---

## D-Phase 4 — Journal edit button

**Backend:** `PATCH /journal/{id}` accepts `{ entryDate, lifeArea, noteText }`.

**Target:** `web/components/dashboard-journal-tab.tsx` (or wherever journal
entries are listed). Each entry card should have an Edit button that opens an
inline edit form.

```tsx
const [editId, setEditId]   = useState<string | null>(null);
const [editNote, setEditNote] = useState("");
const [editArea, setEditArea] = useState("");

async function saveEdit(journalId: string, entryDate: string) {
  await apiFetchJson(`/journal/${journalId}`, {
    method: "PATCH",
    body: JSON.stringify({ noteText: editNote, lifeArea: editArea, entryDate }),
  });
  setEditId(null);
  // refetch entries
}
```

Render an edit button on each journal entry card. When clicked, expand an
inline form with a `<textarea>` for the note and a `<select>` for life area.
Save calls `PATCH`. Cancel closes the form.

Design the inline form using `var(--color-surface-soft)` background,
`var(--radius-md)` corners, `var(--font-body)` font.

**Acceptance test:** Open a journal entry → click Edit → change text → Save.
Entry text updates without page reload.

---

## D-Phase 5 — Journal export button

**Backend:** `GET /journal/export?chartId=...` — returns CSV or PDF binary.

Add an Export button above the journal entry list:

```tsx
async function exportJournal() {
  const url = `/api/v1/journal/export?chartId=${chartId}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return;
  const blob = await response.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `journal-${chartId}.csv`;
  a.click();
}
```

Place this button next to any existing filter/sort controls in the journal tab.
Use the same SVG download icon as the PDF export button.

---

## D-Phase 6 — Family vault "Today" panel

**Backend:** `GET /family-vaults/{id}/today?date=YYYY-MM-DD`  
Returns all members with their today score, dasha lord, key transit.

**Target:** Family tab — replace (or supplement) the member card grid with a
"Today" snapshot using this endpoint.

```tsx
// Fetch once on mount
const [familyToday, setFamilyToday] = useState<FamilyVaultTodayData | null>(null);

useEffect(() => {
  const today = new Date().toISOString().slice(0, 10);
  apiFetchJson<{ data: FamilyVaultTodayData }>(
    `/family-vaults/${vaultId}/today?date=${today}`
  ).then((r) => setFamilyToday(r.data ?? null));
}, [vaultId]);
```

Render each member as a compact score card:
- Member name + age
- Today score ring (same colour bands as personal tab)
- Current dasha lord (coloured dot + name)
- One key transit line if present

Add types to `web/lib/types.ts`:
```typescript
export interface FamilyMemberTodayScore {
  memberId: string;
  displayName: string;
  score: number;
  dashaLord: string;
  keyTransit: string | null;
}

export interface FamilyVaultTodayData {
  vaultId: string;
  date: string;
  members: FamilyMemberTodayScore[];
}
```

**Acceptance test:** Family tab loads — "Today" scores visible for all members
without opening each individual member card.

---

## D-Phase 7 — Family vault summary card

**Backend:** `GET /family-vaults/{id}/summary?date=YYYY-MM-DD`

Add an aggregate summary card at the top of the Family tab:

```tsx
// Shows: average family score, number of members in high/mid/low bands,
// vault name, date
```

Render as a `<Surface>` card with:
- Vault name (display)
- Date
- Average family score (large number, coloured)
- Three-band breakdown: N high / N mid / N low as small chips

Add the fetch alongside D-Phase 6.

---

## D-Phase 8 — FCM push token registration

**Backend:**
- `PUT /settings/notifications/fcm-token` — register token
- `DELETE /settings/notifications/fcm-token` — remove token

**Target:** Settings tab, Notifications section.

This requires a browser service worker. If a service worker is not yet set up,
add a `web/public/firebase-messaging-sw.js` stub and register it before calling
the token endpoint. Document the FCM setup requirement in a code comment.

```tsx
async function registerPushToken() {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;
  // Get FCM token via Firebase SDK, then:
  await apiFetchJson("/settings/notifications/fcm-token", {
    method: "PUT",
    body: JSON.stringify({ token: fcmToken, platform: "web" }),
  });
}

async function unregisterPushToken() {
  await apiFetchJson("/settings/notifications/fcm-token", { method: "DELETE" });
}
```

Add register/unregister buttons to the notification preferences section in
the Settings tab with appropriate permission state guards.

**Note:** This phase requires FCM credentials in `.env`
(`JOTHIDAM_FCM_PROJECT_ID`, `JOTHIDAM_FCM_SERVICE_ACCOUNT_JSON`). If not set,
the button should be hidden or show a "Push notifications unavailable" message.

---

# Execution order

```
Priority 1 — Fix first (blockers)
  D1  Fix synastry URL mismatch (bug, ~30 min)

Priority 2 — High value, ready to ship
  B1  Yoga/Dosham depth (frontend only)
  B2  Life Areas depth (frontend only)
  B3  Personal tab: pratyantar + emotional weather (frontend only)
  B4  Transits tab: strength + breakdown (frontend only)
  B5  tsc --noEmit + commit Track B
  D3  PDF export button (1 new button, trivial)
  D4  Journal edit (moderate — inline form)

Priority 3 — New classical modules
  C1  Hora lord real-time signal (backend + tiny frontend)
  C2  Jaimini Chara Dasha (backend + frontend section)
  C3  Tajaka solar return (backend + frontend widget)
  Commit Track C

Priority 4 — Family and planning features
  D2  Event windows panel (new component)
  D5  Journal export
  D6  Family vault Today panel
  D7  Family vault summary card

Priority 5 — Infrastructure
  D8  FCM push token registration (requires FCM setup)
```

Track B and Track C are independent — they can run in parallel.
Track D phases are independent of each other (except D6+D7 share a fetch).

---

# Files changed per phase

| Phase | Files |
|-------|-------|
| B1 | `web/components/dashboard-yoga-dosham-panel.tsx`, `web/lib/types.ts` |
| B2 | `web/components/dashboard-life-areas-tab.tsx`, `web/components/life-area-card.tsx`, `web/lib/types.ts` |
| B3 | `web/components/dashboard-personal-tab.tsx`, `web/lib/types.ts` |
| B4 | `web/components/dashboard-transits-tab.tsx`, `web/lib/types.ts` |
| B5 | `web/lib/types.ts` (final pass) |
| C1 | `app/schemas/daily_guidance.py`, `app/services/daily_guidance_service.py`, `web/components/dashboard-personal-tab.tsx`, `web/lib/types.ts` |
| C2 | `app/calculations/jaimini_dasha.py` (new), `app/api/charts.py` (stub already exists), `tests/test_jaimini_dasha.py` (new), `web/components/dashboard-personal-tab.tsx`, `web/lib/types.ts` |
| C3 | `app/calculations/tajaka.py` (new), `app/api/charts.py` (stub already exists), `tests/test_tajaka.py` (new), `web/components/dashboard-personal-tab.tsx`, `web/lib/types.ts` |
| D1 | `web/components/synastry-matrix.tsx`, callers of `SynastryMatrix` |
| D2 | `web/components/dashboard-event-windows.tsx` (new), `web/lib/types.ts` |
| D3 | `web/components/dashboard-personal-tab.tsx` (add download button) |
| D4 | `web/components/dashboard-journal-tab.tsx` (or journal list component) |
| D5 | Same as D4 (add export button) |
| D6 | `web/components/dashboard-family-tab.tsx`, `web/lib/types.ts` |
| D7 | Same as D6 (add summary card) |
| D8 | `web/components/dashboard-settings-tab.tsx`, `web/public/firebase-messaging-sw.js` |

---

# Admin access

There is no hardcoded admin username or password. Admin access requires two
things simultaneously:

1. A valid user JWT (any registered account)
2. The `X-Admin-Key` HTTP header matching `JOTHIDAM_ADMIN_API_KEY` from `.env`

Call pattern:
```
Authorization: Bearer <jwt>
X-Admin-Key: <value from .env JOTHIDAM_ADMIN_API_KEY>
```

The data deletion endpoint (`DELETE /admin/users/{id}/data`) is additionally
gated by `JOTHIDAM_ENABLE_ADMIN_DATA_DELETE=1` — disabled by default even with
a valid admin key.

Admin endpoints available:
- `GET /api/v1/admin/stats` — aggregate record counts
- `DELETE /api/v1/admin/users/{id}/data` — GDPR erasure (requires extra flag)
- `POST /api/v1/admin/run-peyarchi-refresh` — trigger peyarchi alert refresh now
- `GET /api/v1/feedback` — list all user feedback submissions

---

# Database safety quick reference

| Action | Allowed? |
|--------|---------|
| `alembic upgrade head` on `vinaadi_test` (port 5433) | Yes — always |
| `alembic upgrade head` on `vinaadi_dev` (port 5432) | Only after test review |
| `DROP TABLE` on `vinaadi_dev` | Never |
| `Base.metadata.drop_all()` on `vinaadi_dev` | Never |
| Point `JOTHIDAM_DATABASE_URL` at `vinaadi_dev` during pytest | Never |
| `downgrade()` left as `pass` in a migration | Never |

Backup before risky work:
```powershell
docker exec slw-postgres pg_dump -U slw_admin vinaadi_dev > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql
```
