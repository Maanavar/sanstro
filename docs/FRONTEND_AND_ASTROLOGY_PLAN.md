# Vinaadi AI — Frontend Surface Plan (B) + Next Astrology Sprint (C)

## How to use this document

Hand this to any coding agent to complete Track B (frontend) or Track C
(deeper astrology). Each track is self-contained. Execute phases within a
track in strict order.

---

## Repo root

```
C:\Users\senth\OneDrive\문서\GitHub\sanstro
```

The Korean folder name `문서` is mandatory.

## Shell

PowerShell. Chain with `;` not `&&`.

## Python encoding

```powershell
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
```

## Frontend dev server

```powershell
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro\web'
npm run dev
```

---

## Current state — what the backend now returns that the frontend ignores

| Backend field | Type | Where returned | Frontend status |
|---|---|---|---|
| `strengthBreakdown` per planet | `{sthana,dik,kala,chesta,naisargika,drik}` | `GET /charts/{id}/calculate` | Not rendered |
| `strengthScore` per planet | `int` | Same | Not rendered |
| `activationScore` per yoga | `int 0-100` | Same | Not rendered |
| `isCurrentlyActive` per yoga | `bool` | Same | Not rendered |
| `cancellationFactors[]` per yoga/dosham | `string[]` | Same | Not rendered |
| `explanationWhat/Why/How` per dosham | `BiText` | Same | Not rendered |
| `dashaActivated` per yoga | `bool` | Same | Not rendered |
| `primaryHouseStrength` per life area | `string` | `GET /life-areas` | Not rendered |
| `karakaStatus` per life area | `string` | Same | Not rendered |
| `dashaActivation` per life area | `bool` | Same | Not rendered |
| `supportingFactors[]` per life area | `string[]` | Same | Not rendered |
| `blockingFactors[]` per life area | `string[]` | Same | Not rendered |
| `transitSupport` per life area | `int` | Same | Not rendered |
| `driver.planet` + `driver.reason` | `{planet, reason: BiText}` | Same | Not rendered |
| `next30DayOutlook` per life area | `BiText` | Same | Not rendered |
| `caution` per life area | `BiText \| null` | Same | Not rendered |
| `pratyantarNarrative` | `BiText \| null` | `GET /guidance/{id}` | Not rendered |
| `emotionalWeather` | `{tone, physicalTendency, bestUseOfDay, avoidBefore}` | Same | Not rendered |
| `nakshatraPerspective` | `BiText` | Same | Not rendered |
| `interpretationKey` per transit planet | `string` | `GET /transits/{id}` | Not rendered |

---

# Track B — Frontend: Surface the New Data

**Goal:** Make the new backend data visible to users across four tabs.

**Key existing components and CSS to reuse:**

- `Surface` — titled card wrapper (`surface__body`, `surface__metrics`)
- `Metric` — label + value + hint + tone
- `Chip` — small pill badge (tone: accent / success / warning / neutral)
- `CollapsibleSection` — expandable panel
- `DrawerPanel` — slide-in detail drawer
- `AlertBanner` — variant: critical / caution
- CSS tokens: `--color-score-high/mid/low`, `--radius-sm/md/lg/pill`
- `DASHA_COLORS` from `dashboard-dasha.tsx`
- `SCORE_HIGH/MID/LOW` constants (CSS var references)

---

## B-Phase 1 — Yoga & Dosham Panel depth

**Target files:**
- `web/components/dashboard-yoga-dosham-panel.tsx`
- `web/lib/types.ts` (verify fields are typed — add if missing)

### What to add

**1.1 — Yoga activation badge**

In the yoga card header (where strength badge currently sits), add an
activation indicator next to it:

```tsx
{/* Existing strength badge */}
<span style={{ fontSize: "0.625rem", fontWeight: 700, color, ... }}>
  {strengthBand(yoga.strength, yoga.isPresent, lang)}
</span>

{/* NEW: activation score badge */}
{yoga.isPresent && yoga.activationScore !== undefined && (
  <span style={{
    fontSize: "0.625rem", fontWeight: 700,
    padding: "var(--space-0_5) var(--space-2)",
    borderRadius: "var(--radius-pill)",
    background: yoga.isCurrentlyActive ? "#DCE4D2" : "var(--color-surface-soft)",
    color: yoga.isCurrentlyActive ? "var(--color-score-high)" : "var(--color-faint)",
    border: `1px solid ${yoga.isCurrentlyActive ? "rgba(92,118,84,0.4)" : "var(--color-border)"}`,
  }}>
    {yoga.isCurrentlyActive
      ? (lang === "ta" ? "தசையில் செயல்படுகிறது" : "Active in dasha")
      : `${yoga.activationScore}/100`}
  </span>
)}
```

**1.2 — Cancellation factors in yoga expanded section**

Inside the existing expanded panel body, after conditionsMet list, add:

```tsx
{yoga.cancellationFactors && yoga.cancellationFactors.length > 0 && (
  <div style={{ marginTop: "var(--space-3)" }}>
    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
      color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {lang === "ta" ? "நிவர்த்தி காரணங்கள்" : "Cancellation factors"}
    </p>
    {yoga.cancellationFactors.map((f) => (
      <p key={f} style={{ margin: "var(--space-0_5) 0", fontSize: "0.875rem",
        color: "var(--color-muted)" }}>
        · {markerLabel(f, lang)}
      </p>
    ))}
  </div>
)}
```

**1.3 — Dosham three-layer explanation**

Doshams already have `explanationWhatTa/En`, `explanationWhyTa/En`,
`explanationHowTa/En`. These are not rendered. In the expanded dosham body,
add three sections:

```tsx
{[
  { key: "What", ta: dosham.explanationWhatTa, en: dosham.explanationWhatEn },
  { key: "Why",  ta: dosham.explanationWhyTa,  en: dosham.explanationWhyEn  },
  { key: "How",  ta: dosham.explanationHowTa,  en: dosham.explanationHowEn  },
].filter(s => s.en || s.ta).map(section => (
  <div key={section.key} style={{ marginTop: "var(--space-3)" }}>
    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
      color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {lang === "ta"
        ? section.key === "What" ? "என்ன" : section.key === "Why" ? "ஏன்" : "எப்படி"
        : section.key}
    </p>
    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.55 }}>
      {lang === "ta" ? section.ta : section.en}
    </p>
  </div>
))}
```

**1.4 — `missingData` warning for doshams**

When `dosham.missingData` is non-empty, show a caution note:

```tsx
{dosham.missingData && dosham.missingData.length > 0 && (
  <p style={{ margin: "var(--space-3) 0 0", fontSize: "0.75rem",
    color: "var(--color-score-mid)", fontStyle: "italic" }}>
    {lang === "ta"
      ? "குறிப்பு: பிறந்த நேரம் இல்லாததால் இந்த மதிப்பீடு அனுமானிக்கப்படுகிறது."
      : "Note: assessment is estimated due to missing birth time."}
  </p>
)}
```

### Types to verify in `web/lib/types.ts`

Confirm `ChartYogaInsight` has:
```ts
activationScore: number
isCurrentlyActive: boolean
cancellationFactors: string[]
dashaActivated: boolean
```

Confirm `ChartDoshamInsight` has:
```ts
explanationWhatTa: string | null
explanationWhatEn: string | null
explanationWhyTa: string | null
explanationWhyEn: string | null
explanationHowTa: string | null
explanationHowEn: string | null
missingData: string[]
isCancelled: boolean
```

If any field is missing from the TypeScript type, add it. The backend returns
them — the frontend just hasn't declared them yet.

### Acceptance test

Open the dashboard → Personal tab → scroll to yogas section. A yoga present
in the current dasha (e.g. Gaja Kesari during Jupiter period) should show a
green "Active in dasha" badge. Clicking it should reveal the expanded section
with cancellation factors if any. A dosham should show What/Why/How sections.

---

## B-Phase 2 — Life Areas tab depth

**Target file:** `web/components/dashboard-life-areas-tab.tsx`

### What to add

**2.1 — Driver planet callout**

Each `LifeAreaCard` receives a `LifeAreaData` object. Add a prominent driver
line at the top of the card body, before the score bar:

```tsx
{area.driver && (
  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)",
    marginBottom: "var(--space-2_5)" }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%",
      background: DASHA_COLORS[area.driver.planet] ?? "var(--color-accent)",
      flexShrink: 0, display: "inline-block" }} />
    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)", fontWeight: 500 }}>
      <strong style={{ color: "var(--color-text-strong)" }}>
        {tPlanetLord(area.driver.planet, lang)}
      </strong>
      {" — "}
      {lang === "ta" ? area.driver.reason?.ta : area.driver.reason?.en}
    </p>
  </div>
)}
```

**2.2 — Supporting / blocking factors**

In the expanded detail drawer (or below the score bar), add two lists:

```tsx
{(area.supportingFactors?.length > 0 || area.blockingFactors?.length > 0) && (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
    {area.supportingFactors?.length > 0 && (
      <div>
        <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
          color: "var(--color-score-high)", textTransform: "uppercase",
          letterSpacing: "0.08em" }}>
          {lang === "ta" ? "உதவும் காரணங்கள்" : "Supporting"}
        </p>
        {area.supportingFactors.map(f => (
          <p key={f} style={{ margin: "var(--space-0_5) 0", fontSize: "0.75rem",
            color: "var(--color-muted)" }}>
            · {humaniseFactorKey(f, lang)}
          </p>
        ))}
      </div>
    )}
    {area.blockingFactors?.length > 0 && (
      <div>
        <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
          color: "var(--color-score-low)", textTransform: "uppercase",
          letterSpacing: "0.08em" }}>
          {lang === "ta" ? "தடை காரணங்கள்" : "Blocking"}
        </p>
        {area.blockingFactors.map(f => (
          <p key={f} style={{ margin: "var(--space-0_5) 0", fontSize: "0.75rem",
            color: "var(--color-muted)" }}>
            · {humaniseFactorKey(f, lang)}
          </p>
        ))}
      </div>
    )}
  </div>
)}
```

Add a `humaniseFactorKey(key: string, lang: Lang): string` helper that
converts snake_case keys like `VENUS_karaka_strong` or `dasha_activates_area`
into readable text:

```ts
function humaniseFactorKey(key: string, lang: Lang): string {
  const map: Record<string, { en: string; ta: string }> = {
    dasha_activates_area:    { en: "Current dasha activates this area", ta: "தற்போதைய தசை இந்த பகுதியை செயல்படுத்துகிறது" },
    house_av_strong:         { en: "Ashtakavarga bindus strong (≥28)", ta: "அஷ்டகவர்க்க பிந்துக்கள் வலிமையானவை" },
    house_av_weak:           { en: "Ashtakavarga bindus weak (≤22)", ta: "அஷ்டகவர்க்க பிந்துக்கள் பலவீனமானவை" },
    too_young:               { en: "Not yet the typical age for this area", ta: "இந்த பகுதிக்கான வயது இன்னும் வரவில்லை" },
    age_limit:               { en: "Past the typical active age for this area", ta: "இந்த பகுதியின் செயலூக்கமான வயது கடந்துவிட்டது" },
  };
  // For dynamic keys like VENUS_karaka_strong, JUPITER_transit_supportive
  const planetMatch = key.match(/^([A-Z]+)_karaka_(strong|weak)$/);
  if (planetMatch) {
    const planet = planetMatch[1];
    const quality = planetMatch[2];
    return lang === "ta"
      ? `${planet} கிரகம் காரகன் — ${quality === "strong" ? "வலிமையானது" : "பலவீனமானது"}`
      : `${planet} karaka is ${quality}`;
  }
  const transitMatch = key.match(/^([A-Z]+)_(transit)_(supportive|difficult)$/);
  if (transitMatch) {
    const planet = transitMatch[1];
    const quality = transitMatch[3];
    return lang === "ta"
      ? `${planet} கோசாரம் ${quality === "supportive" ? "சாதகமானது" : "பாதகமானது"}`
      : `${planet} transit is ${quality}`;
  }
  return map[key]?.[lang === "ta" ? "ta" : "en"] ?? key.replace(/_/g, " ");
}
```

**2.3 — Dasha activation indicator on card header**

On the life area card score ring or header, add a small indicator:

```tsx
{area.dashaActivation && (
  <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "2px 8px",
    borderRadius: "var(--radius-pill)", background: "#DCE4D2",
    color: "var(--color-score-high)", border: "1px solid rgba(92,118,84,0.35)" }}>
    {lang === "ta" ? "தசையில் செயல்" : "Dasha active"}
  </span>
)}
```

**2.4 — 30-day outlook section**

In the card expanded view or below the narrative text:

```tsx
{area.next30DayOutlook && (
  <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3) var(--space-4)",
    borderRadius: "var(--radius-md)", background: "var(--color-surface-soft)",
    border: "1px solid var(--color-border)" }}>
    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
      color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {lang === "ta" ? "அடுத்த 30 நாட்கள்" : "Next 30 days"}
    </p>
    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.55 }}>
      {lang === "ta" ? area.next30DayOutlook.ta : area.next30DayOutlook.en}
    </p>
  </div>
)}
```

**2.5 — Karaka status and house strength in card**

Below the score number on the life area card, add two small metadata chips:

```tsx
<div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap",
  marginTop: "var(--space-1_5)" }}>
  {area.karakaStatus && (
    <span style={{ fontSize: "0.625rem", fontWeight: 600, padding: "2px 8px",
      borderRadius: "var(--radius-pill)",
      background: area.karakaStatus === "STRONG" ? "#DCE4D2"
        : area.karakaStatus === "WEAK" ? "#F2D8CC" : "var(--color-surface-soft)",
      color: area.karakaStatus === "STRONG" ? "var(--color-score-high)"
        : area.karakaStatus === "WEAK" ? "var(--color-score-low)" : "var(--color-faint)",
      border: "1px solid var(--color-border)" }}>
      {lang === "ta" ? "காரகன்" : "Karaka"} {area.karakaStatus?.toLowerCase()}
    </span>
  )}
  {area.primaryHouseStrength && (
    <span style={{ fontSize: "0.625rem", fontWeight: 600, padding: "2px 8px",
      borderRadius: "var(--radius-pill)", background: "var(--color-surface-soft)",
      color: "var(--color-faint)", border: "1px solid var(--color-border)" }}>
      {lang === "ta" ? "வீடு" : "House"} {area.primaryHouseStrength?.toLowerCase()}
    </span>
  )}
</div>
```

### Types to verify in `web/lib/types.ts`

Confirm `LifeAreaData` has all these fields:
```ts
driver: { planet: string; reason: { ta: string; en: string } } | null
next30DayOutlook: { ta: string; en: string } | null
caution: { ta: string; en: string } | null
primaryHouseStrength: string | null
karakaStatus: string | null
dashaActivation: boolean
transitSupport: number
supportingFactors: string[]
blockingFactors: string[]
```

### Acceptance test

Life Areas tab → any area card should show: driver planet dot + name,
dasha active badge if applicable, karaka/house chips, supporting/blocking
factor lists, 30-day outlook. Verify Tamil strings render without mojibake.

---

## B-Phase 3 — Personal tab: Pratyantar + Emotional Weather

**Target file:** `web/components/dashboard-personal-tab.tsx`

### What to add

**3.1 — Pratyantar narrative**

The daily guidance response now includes `pratyantarNarrative: BiText | null`.
This appears when the Pratyantar dasha expires within 90 days. Add it below
the dasha section in the Personal tab:

```tsx
{todayGuidance?.pratyantarNarrative && (
  <div style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)",
    background: "#F0D9C4", border: "1px solid rgba(184,90,44,0.25)",
    marginTop: "var(--space-3)" }}>
    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700,
      color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {lang === "ta" ? "பிரத்யந்தர தசை" : "Pratyantar Period"}
    </p>
    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.55 }}>
      {lang === "ta"
        ? todayGuidance.pratyantarNarrative.ta
        : todayGuidance.pratyantarNarrative.en}
    </p>
  </div>
)}
```

**3.2 — Emotional weather card**

`emotionalWeather` has `tone`, `physicalTendency`, `bestUseOfDay`,
`avoidBefore`. Add a compact card in the Personal tab below the score ring
section:

```tsx
{todayGuidance?.emotionalWeather && (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
    {[
      {
        label: lang === "ta" ? "உணர்வு நிலை" : "Emotional tone",
        value: todayGuidance.emotionalWeather.tone,
      },
      {
        label: lang === "ta" ? "உடல் போக்கு" : "Physical tendency",
        value: lang === "ta"
          ? todayGuidance.emotionalWeather.physicalTendency?.ta
          : todayGuidance.emotionalWeather.physicalTendency?.en,
      },
      {
        label: lang === "ta" ? "சிறந்த பயன்பாடு" : "Best use of day",
        value: lang === "ta"
          ? todayGuidance.emotionalWeather.bestUseOfDay?.ta
          : todayGuidance.emotionalWeather.bestUseOfDay?.en,
      },
    ].filter(r => r.value).map(row => (
      <div key={row.label} style={{ padding: "var(--space-2_5) var(--space-3)",
        borderRadius: "var(--radius-md)", background: "var(--color-surface-soft)",
        border: "1px solid var(--color-border)" }}>
        <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700,
          color: "var(--color-faint)", textTransform: "uppercase",
          letterSpacing: "0.08em" }}>{row.label}</p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-strong)",
          fontWeight: 600 }}>{row.value}</p>
      </div>
    ))}
  </div>
)}
```

**3.3 — Nakshatra perspective**

`nakshatraPerspective` is a `BiText` already fetched in the daily guidance
response. Add it below the score label:

```tsx
{todayGuidance?.nakshatraPerspective && (
  <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.875rem",
    color: "var(--color-muted)", lineHeight: 1.55, fontStyle: "italic" }}>
    {lang === "ta"
      ? todayGuidance.nakshatraPerspective.ta
      : todayGuidance.nakshatraPerspective.en}
  </p>
)}
```

### Types to verify in `web/lib/types.ts`

Confirm `DailyGuidanceData` has:
```ts
pratyantarNarrative: { ta: string; en: string } | null
emotionalWeather: {
  tone: string
  physicalTendency: { ta: string; en: string } | null
  bestUseOfDay: { ta: string; en: string } | null
  avoidBefore: { ta: string; en: string } | null
} | null
nakshatraPerspective: { ta: string; en: string } | null
```

### Acceptance test

Personal tab → score section should show emotional weather cards and nakshatra
perspective text below the score ring. When in a short Pratyantar dasha
(within 90 days of ending), the pratyantar narrative block should appear.

---

## B-Phase 4 — Transits tab: Planet strength + interpretation

**Target file:** `web/components/dashboard-transits-tab.tsx`

### What to add

**4.1 — Strength score on each transit planet card**

Transit planets already show house, retrograde, combust flags. Add the natal
strength score as a small badge. The `personalChart.planets` array (from
`ChartCalculateResponseData`) contains `strengthScore` per planet.

Pass `personalChart` into the Transits tab (it may already be available as a
prop — check the prop signature). Then for each transit position:

```tsx
const natalPlanet = personalChart?.planets?.find(p => p.graha === pos.graha)
const strengthScore = natalPlanet?.strengthScore ?? null
const breakdown = natalPlanet?.strengthBreakdown ?? null

{strengthScore !== null && (
  <div style={{ marginTop: "var(--space-2)", display: "flex", gap: "var(--space-1_5)",
    flexWrap: "wrap" }}>
    <span style={{ fontSize: "0.625rem", fontWeight: 700,
      color: strengthScore >= 65 ? "var(--color-score-high)"
           : strengthScore <= 35 ? "var(--color-score-low)" : "var(--color-score-mid)" }}>
      {lang === "ta" ? "நட்சத்திர வலிமை" : "Natal strength"} {strengthScore}/95
    </span>
    {breakdown && Object.entries(breakdown).map(([key, val]) => (
      <span key={key} style={{ fontSize: "0.5rem", fontWeight: 600,
        padding: "1px 5px", borderRadius: "var(--radius-pill)",
        background: val === "STRONG" ? "#DCE4D2"
                  : val === "WEAK" ? "#F2D8CC" : "var(--color-surface-soft)",
        color: val === "STRONG" ? "var(--color-score-high)"
             : val === "WEAK" ? "var(--color-score-low)" : "var(--color-faint)",
        border: "1px solid var(--color-border)",
        textTransform: "uppercase" }}>
        {key.slice(0, 3).toUpperCase()}:{val.slice(0, 1)}
      </span>
    ))}
  </div>
)}
```

The `breakdown` chips show abbreviated Shadbala labels (STA:S, DIK:N, KAL:W
etc.) without cluttering the card.

**4.2 — Interpretation key tooltip**

Each `TransitPosition` has `interpretationKey` (e.g. `"jupiter_9th_from_moon"`).
Add a small info line below the planet card:

```tsx
{pos.interpretationKey && (
  <p style={{ margin: "var(--space-1) 0 0", fontSize: "0.625rem",
    color: "var(--color-faint)", fontStyle: "italic" }}>
    {interpretationKeyLabel(pos.interpretationKey, lang)}
  </p>
)}
```

Add a helper `interpretationKeyLabel()` that converts the key to human text.
Keep it simple — just make the key readable:

```ts
function interpretationKeyLabel(key: string, lang: Lang): string {
  // "jupiter_9th_from_moon" → "Jupiter in 9th from Moon"
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
```

### Acceptance test

Transits tab → each planet card shows natal strength score and abbreviated
Shadbala breakdown chips. Strength score color matches the score band.

---

## B-Phase 5 — Update TypeScript types

**Target file:** `web/lib/types.ts`

After all the above phases, do a final pass to ensure all new backend fields
are typed. Run the TypeScript compiler:

```powershell
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro\web'
npx tsc --noEmit 2>&1 | Select-Object -First 40
```

Fix any type errors before committing.

### Commit Track B

```powershell
Set-Location 'C:\Users\senth\OneDrive\문서\GitHub\sanstro'
git add web/components/dashboard-yoga-dosham-panel.tsx
git add web/components/dashboard-life-areas-tab.tsx
git add web/components/dashboard-personal-tab.tsx
git add web/components/dashboard-transits-tab.tsx
git add web/lib/types.ts
git commit -m "feat(frontend): surface Shadbala, yoga activation, karaka chain data in dashboard"
```

---

# Track C — Next Astrology Sprint

**Goal:** Three independent classical modules that each stand alone.

Execute in order C1 → C2 → C3. Each has its own test.

---

## C-Phase 1 — Hora lord real-time best window

**What:** The panchangam already computes hora (12 planetary hours per day).
The hora lord at the current time is a classical signal for auspiciousness.
Surface it as a real-time best window signal in the daily guidance.

**Target files:**
- `app/calculations/panchangam.py` — `hora` array already computed
- `app/services/daily_guidance_service.py` — `bestWindows` construction
- `app/schemas/daily_guidance.py` — `DailyGuidanceWindow` schema

**What to implement:**

In `daily_guidance_service.py`, when building `bestWindows`, add hora-based
windows alongside the existing Nalla Neram windows:

```python
# Classify hora lords by their auspiciousness for the native's chart.
# Benefic hora lords for a given lagna depend on functional nature.
BENEFIC_HORA_LORDS: dict[str, frozenset[str]] = {
    # For each lagna, which planets are hora-benefic.
    # Use the universal benefics + lagna lord as a first approximation.
    "MESHAM":    frozenset({"SUN", "JUPITER", "MARS"}),
    "RISHABAM":  frozenset({"VENUS", "MERCURY", "SATURN"}),
    "MITHUNAM":  frozenset({"MERCURY", "VENUS", "SATURN"}),
    "KADAGAM":   frozenset({"MOON", "JUPITER", "MARS"}),
    "SIMMAM":    frozenset({"SUN", "MARS", "JUPITER"}),
    "KANNI":     frozenset({"MERCURY", "VENUS", "SATURN"}),
    "THULAM":    frozenset({"VENUS", "SATURN", "MERCURY"}),
    "VIRUCHIGAM":frozenset({"MARS", "MOON", "JUPITER"}),
    "DHANUSU":   frozenset({"JUPITER", "SUN", "MARS"}),
    "MAGARAM":   frozenset({"SATURN", "MERCURY", "VENUS"}),
    "KUMBAM":    frozenset({"SATURN", "MERCURY", "VENUS"}),
    "MEENAM":    frozenset({"JUPITER", "MOON", "MARS"}),
}

def _hora_best_windows(
    hora_list: list[dict],
    lagna_rasi_name: str,
    max_windows: int = 2,
) -> list[dict[str, str]]:
    """
    Return hora slots where the hora lord is a benefic for the lagna.
    hora_list: list of {"lord": str, "start": "HH:MM", "end": "HH:MM"}
    """
    benefics = BENEFIC_HORA_LORDS.get(lagna_rasi_name, frozenset())
    windows = []
    for hora in hora_list:
        if hora["lord"].upper() in benefics:
            windows.append({"start": hora["start"], "end": hora["end"],
                           "label": f"{hora['lord']} hora"})
        if len(windows) >= max_windows:
            break
    return windows
```

Add to the `bestWindows` list in `build_daily_guidance_response()`.

Add a `horaLord` field to `DailyGuidanceData` schema showing the current hora
lord:

```python
class DailyGuidanceData(BaseModel):
    # ... existing fields ...
    currentHoraLord: str | None = Field(default=None, alias="currentHoraLord")
```

**Frontend:** In `dashboard-personal-tab.tsx`, below the best windows section,
add:

```tsx
{todayGuidance?.currentHoraLord && (
  <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
    {lang === "ta" ? "இப்போது" : "Now"}{" "}
    <strong style={{ color: DASHA_COLORS[todayGuidance.currentHoraLord] ?? "var(--color-accent)" }}>
      {tPlanetLord(todayGuidance.currentHoraLord, lang)} {lang === "ta" ? "ஹோரா" : "hora"}
    </strong>
  </p>
)}
```

**Test:**
```powershell
python -m pytest tests/test_panchangam.py tests/test_daily_guidance_api.py -v
```

---

## C-Phase 2 — Jaimini Chara Dasha

**What:** Jaimini's Chara Dasha is a sign-based dasha system that gives
excellent timing for life events (marriage, career change, relocation). It
complements Vimshottari's planet-based timing.

**New file:** `app/calculations/jaimini_dasha.py`

**Core algorithm:**

```python
"""
Jaimini Chara Dasha — sign-based dasha system.
Each rasi gets a dasha period determined by its lord's position.

Period calculation (standard Parashari-Jaimini formula):
- Movable signs (Mesham, Kadagam, Thulam, Magaram): 
    period = 12 - house_of_sign_lord_from_sign
- Fixed signs (Rishabam, Simmam, Viruchigam, Kumbam):
    period = house_of_sign_lord_from_sign
- Dual signs (Mithunam, Kanni, Dhanusu, Meenam):
    if sign_lord in same sign or 7th: period = 9
    else: as movable formula

Starting rasi: Lagna rasi, then proceed in sign order (Mesham → Meenam).
If Lagna is in odd sign (1,3,5,7,9,11): forward order.
If Lagna is in even sign (2,4,6,8,10,12): reverse order (Meenam → Mesham).
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
    # Ketu owns Scorpio jointly with Mars in Jaimini — use Mars position
    if rasi == 8 and "KETU" in planet_rasi_map:
        lord_rasi = planet_rasi_map.get("MARS", planet_rasi_map.get("KETU", rasi))
    else:
        lord_rasi = planet_rasi_map.get(sign_lord, rasi)

    house_of_lord = house_from_reference(rasi, lord_rasi)

    if rasi in MOVABLE_RASIS:
        years = 12 - house_of_lord + 1
    elif rasi in FIXED_RASIS:
        years = house_of_lord
    else:  # Dual
        if lord_rasi == rasi or house_of_lord == 7:
            years = 9
        else:
            years = 12 - house_of_lord + 1

    # Minimum 1 year, maximum 12 years
    return max(1, min(12, years))


def calculate_chara_dasha(
    lagna_rasi: int,
    planet_rasi_map: Mapping[str, int],
    birth_date: date,
) -> list[dict]:
    """
    Returns the full Chara Dasha sequence as a list of dicts:
    [{ "rasi": int, "rasi_name": str, "years": int,
       "start_date": date, "end_date": date }]
    """
    from datetime import timedelta

    forward = lagna_rasi in ODD_RASIS
    rasi_order = list(range(1, 13)) if forward else list(range(12, 0, -1))
    # Start from Lagna rasi
    start_idx = rasi_order.index(lagna_rasi)
    ordered = rasi_order[start_idx:] + rasi_order[:start_idx]

    periods = []
    current_date = birth_date
    for rasi in ordered:
        years = _chara_period_years(rasi, planet_rasi_map)
        end_date = date(current_date.year + years, current_date.month, current_date.day)
        periods.append({
            "rasi": rasi,
            "rasi_name": RASI_NAMES.get(rasi, str(rasi)),
            "years": years,
            "start_date": current_date,
            "end_date": end_date,
        })
        current_date = end_date

    return periods
```

**New API endpoint:** `GET /charts/{chart_id}/chara-dasha`

Add to `app/api/charts.py`:
```python
@router.get("/{chart_id}/chara-dasha", tags=["charts"])
def get_chara_dasha(chart_id: UUID, session: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    return get_chara_dasha_for_chart(session, current_user.user_id, chart_id)
```

Add to `app/services/chart_service.py`:
```python
def get_chara_dasha_for_chart(session, user_id, chart_id):
    from app.calculations.jaimini_dasha import calculate_chara_dasha
    # load chart, build planet_rasi_map, call calculate_chara_dasha()
    # return as JSON-serialisable list
```

**Frontend:** New sub-tab or collapsible in the Personal tab dasha section,
labelled "Chara Dasha" / "சார தசை". Show the same timeline style as
Vimshottari but with rasi names instead of planet names.

**Test:**
```powershell
python -m pytest tests/test_dasha.py -v -k "chara"
```

Write at least 3 tests:
1. Mesham lagna (odd, forward) — verify period order starts from Mesham
2. Rishabam lagna (even, reverse) — verify period order starts from Rishabam,
   goes Meenam → Kumbam → ...
3. Known reference case: Mesham lagna, Mars in 7th → Mesham period = 12 - 7 + 1 = 6 years

---

## C-Phase 3 — Tajaka Solar Return Chart

**What:** A solar return chart (cast for the moment the Sun returns to its
natal longitude each year) gives a 12-month ahead picture. Used extensively
in Tajaka Jyotish for annual predictions.

**New file:** `app/calculations/tajaka.py`

```python
"""
Tajaka annual chart — solar return calculation.
Cast for the moment the Sun's ecliptic longitude matches its natal longitude,
occurring once per year near the birth date.
"""
from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from app.calculations.ephemeris import calculate_sidereal_planets
from app.calculations.astro import (
    utc_datetime_to_julian_day,
    local_datetime_to_utc,
    rasi_from_degree,
    normalize_longitude,
)


def find_solar_return_jd(
    natal_sun_longitude: float,
    birth_year: int,
    latitude: float,
    longitude: float,
    ayanamsa_type: str = "LAHIRI",
) -> float:
    """
    Find the Julian Day of the solar return in birth_year (the year for which
    the return is cast). Uses bisection search over ±5 days around the
    approximate return date.
    Returns Julian Day (float).
    """
    # Approximate start: noon on birth date in the target year
    approx_start = datetime(birth_year, 3, 20, 12, 0, 0, tzinfo=UTC)  # near vernal equinox
    jd_start = utc_datetime_to_julian_day(approx_start)

    def sun_longitude_at(jd: float) -> float:
        snap = calculate_sidereal_planets(jd, latitude, longitude, ayanamsa_type)
        return normalize_longitude(snap.sun_longitude)

    # Bisection over 365-day window around approximate date
    # Find where sun_longitude crosses natal_sun_longitude
    target = normalize_longitude(natal_sun_longitude)
    lo, hi = jd_start - 20.0, jd_start + 385.0

    for _ in range(50):  # 50 iterations → precision < 1 second
        mid = (lo + hi) / 2.0
        mid_lon = sun_longitude_at(mid)
        diff = (mid_lon - target + 180.0) % 360.0 - 180.0
        if abs(diff) < 1e-6:
            break
        if diff < 0:
            lo = mid
        else:
            hi = mid

    return (lo + hi) / 2.0


def calculate_tajaka_chart(
    natal_sun_longitude: float,
    return_year: int,
    birth_latitude: float,
    birth_longitude: float,
    birth_timezone: str,
    ayanamsa_type: str = "LAHIRI",
) -> dict:
    """
    Returns the solar return chart for return_year.
    Dict keys: jd, lagna_rasi, planets (same structure as natal chart).
    """
    from app.calculations.ephemeris import compute_lagna
    sr_jd = find_solar_return_jd(
        natal_sun_longitude, return_year,
        birth_latitude, birth_longitude, ayanamsa_type,
    )
    snap = calculate_sidereal_planets(sr_jd, birth_latitude, birth_longitude, ayanamsa_type)
    lagna_lon = compute_lagna(sr_jd, birth_latitude, birth_longitude, ayanamsa_type)
    lagna_rasi = rasi_from_degree(lagna_lon)

    return {
        "julian_day": sr_jd,
        "return_year": return_year,
        "lagna_rasi": lagna_rasi,
        "sun_longitude": snap.sun_longitude,
        "planets": snap,  # full EphemerisSnapshot
    }
```

**New API endpoint:** `GET /charts/{chart_id}/solar-return?year=2026`

```python
@router.get("/{chart_id}/solar-return", tags=["charts"])
def get_solar_return(chart_id: UUID, year: int = Query(default=None),
                     session: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    # default year = current year if not specified
```

**Key Tajaka interpretations to add:**

After computing the solar return chart, check these classical Tajaka factors:

1. **Year Lord (Varshesh):** The planet that rules the solar return year.
   Use the hora lord at the moment of the solar return.
2. **Muntha:** Moves 1 sign per year from the natal Lagna rasi.
   `muntha_rasi = ((lagna_rasi - 1 + (return_year - birth_year)) % 12) + 1`
3. **SR Lagna vs Natal Lagna:** If same sign → strong year.
4. **5 Tajaka yogas:** Ithasala (applying aspect), Ishrafa (separating),
   Nakta (transfer), Yamaya (identical), Musaripha (cancelled).

**Frontend:** New "Annual Chart" section in the Personal tab or Calendar tab,
showing the solar return Lagna, Muntha position, and year interpretation for
the current year.

**Test:**
```powershell
python -m pytest tests/ -k "tajaka or solar_return" -v
```

Write tests for:
1. `find_solar_return_jd` returns a JD within 365 days of the previous solar
   return (Sun longitude at returned JD ≈ natal Sun longitude ± 0.001°)
2. Muntha calculation: natal Lagna Mesham, year 2 → Muntha = Rishabam
3. SR chart has 9 planets (not null)

---

## Execution order summary

```
Track B (frontend, no backend changes):
  B1 Yoga/Dosham panel depth
  B2 Life Areas tab depth
  B3 Personal tab: pratyantar + emotional weather
  B4 Transits tab: strength + interpretation
  B5 TypeScript types cleanup + tsc --noEmit

Track C (new astrology modules):
  C1 Hora lord real-time signal (1 day)
  C2 Jaimini Chara Dasha (2 days)
  C3 Tajaka solar return (2-3 days)
```

Track B and Track C are independent — they can be started in parallel by
different agents if needed. Track B requires no backend changes; Track C
requires no frontend changes until the endpoint exists.

---

## Files changed per phase

| Phase | Files |
|-------|-------|
| B1 | `web/components/dashboard-yoga-dosham-panel.tsx` |
| B2 | `web/components/dashboard-life-areas-tab.tsx` |
| B3 | `web/components/dashboard-personal-tab.tsx` |
| B4 | `web/components/dashboard-transits-tab.tsx` |
| B5 | `web/lib/types.ts` |
| C1 | `app/calculations/panchangam.py`, `app/services/daily_guidance_service.py`, `app/schemas/daily_guidance.py` |
| C2 | `app/calculations/jaimini_dasha.py` (new), `app/api/charts.py`, `app/services/chart_service.py`, `web/components/dashboard-personal-tab.tsx` |
| C3 | `app/calculations/tajaka.py` (new), `app/api/charts.py`, `web/components/dashboard-personal-tab.tsx` or `dashboard-calendar-tab.tsx` |

---

## Rules for the coding agent

1. **Track B has zero backend changes.** If you find yourself editing a `.py`
   file during Track B, stop and reconsider.

2. **All Tamil strings must be written as direct Unicode characters.** Never
   use `க` or similar escapes. Save all files as UTF-8 without BOM.
   Example correct: `"இந்த பகுதியை செயல்படுத்துகிறது"`

3. **Use existing CSS tokens** (`var(--color-score-high)`, `var(--space-3)`,
   `var(--radius-md)` etc.) — never hardcode hex colors in new frontend code.

4. **Use `var(--font-body)`, `var(--font-display)`, `var(--font-mono)`** for
   font families — never hardcode font stacks.

5. **For Track C**, every new calculation file must start with
   `from __future__ import annotations` and every new migration must
   implement `downgrade()`.

6. **Never run `alembic upgrade head` against `vinaadi_dev`** without first
   confirming the migration on `vinaadi_test` (port 5433).

7. **Run `npx tsc --noEmit` after every B-phase** before committing to catch
   type errors early.

8. **`DASHA_COLORS` is imported from `dashboard-dasha.tsx`** — do not
   redefine it in new components. Import it:
   `import { DASHA_COLORS } from "./dashboard-dasha";`
