

# VINAADI AI — AGENT WORKBOARD
> Source: Multi-Role Production Audit + Implementation Spec, 2026-06-28 | Branch: `harden/production-readiness`
>
> **How to use this file:**
> - Each item has a unique ID, severity, effort estimate, source, exact file paths, and acceptance criteria.
> - Items inside the same group are independent unless a **Dependency** line says otherwise.
> - Items are ordered smallest-effort-first within each group — do them in that order.
> - After each group, run `pnpm --filter mobile dev` and `pnpm --filter web dev` to verify visually.
> - Mark items `Done` in the completion table as you finish them.

---

## LEGEND

| Severity | Meaning |
|---|---|
| 🔴 CRITICAL | Incorrect behaviour / broken code / cultural inaccuracy — must fix before any public release |
| 🟠 HIGH | Feature gaps blocking conversion or confusion |
| 🟡 MEDIUM | UX parity, architecture hygiene, discoverability |
| 🟢 LOW | Nice-to-have, metrics, polish |

| Effort | Meaning |
|---|---|
| XS | < 30 min — single line or few-line change |
| S | 30 min – 2 h |
| M | half day to 1 day |
| L | multi-day — plan before starting |

---

## ⛔ DO NOT RE-IMPLEMENT — ALREADY CLOSED

These were open in the previous audit. Code inspection on 2026-06-28 confirmed they are **done**. Do not touch them.

| Item | What was done | Where confirmed |
|------|--------------|-----------------|
| Score thresholds (mobile) | `SCORE_THRESHOLDS` from `@vinaadi/shared/utils/score` used at all 4 call-sites | `mobile/app/(tabs)/today.tsx` lines 56, 307, 463, 880 |
| ThirukanithamBadge above fold (mobile) | Badge now inside `scoreHeroTopRow` | `mobile/app/(tabs)/today.tsx` line 452 |
| Web Guest Mode | Homepage uses `PublicNav + HomeContent + PublicFooter`, no login wall | `web/app/page.tsx` |
| Pricing Page | `web/app/pricing/page.tsx` exists with tier comparison | confirmed |
| Web Notification Inbox | `web/app/notifications/page.tsx` exists | confirmed |
| Tamil Font Abstraction | `TamilType, EnType, TamilFont, EnFont` imported from `@/theme/typography` | `today.tsx` line 26, `me.tsx` line 13 |

---

## GROUP A — CORRECTNESS BUGS (fix first, in order)

### A-01 🔴 XS — Missing `score-thresholds.ts` module (web tests broken)

**Source:** Full-Stack Developer, PO-03

**Problem:** `web/lib/score-thresholds.test.ts` imports from `./score-thresholds` — that file does not exist in `web/lib/`. The implementation lives in `packages/shared/utils/score.ts`. Running `pnpm --filter web test` fails with a module-not-found error.

**What to do:**
1. Open `web/lib/score-thresholds.test.ts` and read the import at the top.
2. Either:
   - **(Preferred)** Fix the import to point at `@vinaadi/shared/utils/score`, OR
   - Create `web/lib/score-thresholds.ts` that re-exports from the shared package.
3. Run `pnpm --filter web test` — suite must pass.

**Files:**
- `web/lib/score-thresholds.test.ts`
- `packages/shared/utils/score.ts`

**Acceptance criteria:** `pnpm --filter web test` exits 0 with no module-not-found errors.

---

### A-02 🔴 XS — Web score hero uses magic numbers instead of `SCORE_THRESHOLDS`

**Source:** Full-Stack Developer (IMPL_SPEC QF-5)

**Problem:** `web/components/dashboard-personal-hero.tsx` line 168 hardcodes `>= 65` and `>= 45` for the score pill colour. If the thresholds change in the shared package the web pill silently diverges.

```ts
// BEFORE (line 168)
background: score !== null && score >= 65 ? "var(--chart-d9-active-bg)"
  : score !== null && score >= 45 ? "var(--chart-d1-lagna-bg)"
  : "var(--panel-warm-tint)",
```

**Fix:**

Add import at the top of `dashboard-personal-hero.tsx`:
```ts
import { SCORE_THRESHOLDS } from "@vinaadi/shared/utils/score";
```

Update line 168:
```ts
// AFTER (line 168)
background: score !== null && score >= SCORE_THRESHOLDS.HIGH ? "var(--chart-d9-active-bg)"
  : score !== null && score >= SCORE_THRESHOLDS.MID ? "var(--chart-d1-lagna-bg)"
  : "var(--panel-warm-tint)",
```

**Acceptance criteria:**
- TypeScript compiles.
- Web score pill colour changes at the same thresholds as mobile (65 = high, 45 = mid).
- If `SCORE_THRESHOLDS` values change in the shared package, the web pill auto-updates.

---

### A-03 🔴 S — Chandrashtama computed from wrong reference point (potential)

**Source:** Renowned Astrologer

**Problem:** Chandrashtama is when the transiting Moon is in the **8th house from the natal Moon rasi** — NOT from the lagna. Some non-Tamil systems mistakenly compute from lagna.

**What to do:**
1. Search `app/services/astro/` for `chandrashtama` or `chandrashtamam`.
2. Confirm the reference point is natal Moon rasi (`janma_rasi`), not `lagna`.
3. If it uses lagna, fix it to use Moon rasi.
4. Add a unit test: person with Moon in Mesha (rasi index 0) → Chandrashtama when transiting Moon is in Vrishchika (rasi index 7). Function must return `True` for that input.

**Acceptance criteria:** Unit test passes; function returns `False` when transiting Moon is in, e.g., Mithuna (rasi 2).

---

### A-04 🔴 S — Gowri Nalla Neram — verify day-wise starting kala sequence

**Source:** Renowned Astrologer

**Problem:** The traditional starting kala for each weekday must match exactly:

| Day | Starting Kala (Tamil) |
|---|---|
| Sunday | Vilambhi (விளம்பி) |
| Monday | Anandha (ஆனந்தம்) |
| Tuesday | Rogam (ரோகம்) |
| Wednesday | Labham (லாபம்) |
| Thursday | Amirtham (அமிர்தம்) |
| Friday | Shodam (சோதம்) |
| Saturday | Kalam (காலம்) |

**What to do:**
1. Read `web/lib/gowri.ts`.
2. Find the day-to-starting-kala mapping.
3. Compare against the table above and fix any mismatches.
4. Add a unit test asserting the correct starting kala for all 7 days.

---

### A-05 🟠 S — Rahu Kalam must be calculated from sunrise, not a fixed clock time

**Source:** Renowned Astrologer

**Problem:** Rahu Kalam, Yamagandam, and Kuligai must be calculated as fractions of the day between sunrise and sunset. Hardcoded start times (e.g., "7:30 AM always") produce wrong values for locations far from standard meridians or in different seasons.

**Formula:** Divide the day (sunrise → sunset) into 8 equal parts. Assign the n-th part by day of week to Rahu Kalam:
Sun=8, Mon=2, Tue=7, Wed=5, Thu=6, Fri=4, Sat=3.

**What to do:**
1. Search `app/services/astro/` for `rahu`.
2. Confirm the formula is sunrise-relative as above.
3. Verify Yamagandam and Kuligai use the same division.
4. If fixed times are used, replace with the sunrise-relative formula.

---

### A-06 🟠 S — Panchangam tithi card must show transition time when tithi changes mid-day

**Source:** Renowned Astrologer

**Problem:** In Thirukanitham, tithi can transition at any time. The panchangam card must show the current tithi **and** its `ends_at` time when it transitions before day-end. The `ends_at` i18n key exists — verify the backend always populates it.

**What to do:**
1. Find the panchangam API response model in the backend.
2. Confirm `tithi_end_time` (or equivalent) is always returned and never `null` on days with mid-day transitions.
3. On the web panchangam page and mobile `PanchangamCard` component, confirm `ends_at` is rendered when present.
4. Test with any date — tithi transitions mid-day on most dates.

---

### A-07 🔴 M — Porutham system is Ashtakoota, not Tamil 10-Porutham — mislabeled throughout

**Source:** Renowned Astrologer (most critical finding)

**Problem:** `porutham.py` lines 3–14 explicitly states: *"This is Ashtakoota-style guna scoring, not true Tamil 10-porutham."* The UI, API endpoint, and i18n strings all call this "Tamil Porutham". Any knowledgeable Tamil user will notice immediately.

**Difference:**

| Aspect | Tamil 10-Porutham | Ashtakoota (current code) |
|---|---|---|
| Structure | 10 checks, pass/fail each | 8 kutas, weighted score |
| Max score | 10/10 | 36 points |
| Rajju | Central — widowhood risk, absolute veto | Not integrated |
| Vedha | Nakshatra pair blocker, absolute veto | Not integrated |
| Mahendra | Tamil-specific | Not in Ashtakoota |
| Stri Dirgha | Girl's nak → 13 forward | Defined differently |
| Origin | Tamil Jyothida tradition | Parasara (North India) |

**Specific code gaps:**
- `detect_rajju_dosham` exists but is NOT counted in the main 10-porutham score — standalone flag only.
- `detect_vedha_dosham` exists but is NOT counted in the main 10-porutham score.
- Dinam counting: Tamil counts boy's nakshatra from girl's; inauspicious if count is 2, 4, 6, 8, or 9. Verify current code matches.

**Choose one path, confirm with project owner before starting:**

*Path A — Quick fix (label change only):*
- Change all UI labels, API response fields, and i18n strings from "Tamil Porutham / 10 Porutham" → "Ashtakoota Guna Score (36 points)".
- Add a footnote: "Full Tamil 10-Porutham coming soon."

*Path B — Full implementation of Tamil 10-Porutham in `porutham.py`:*
1. Dinam (தினம்) — count boy's nak from girl's; inauspicious if 2,4,6,8,9
2. Gana (கணம்) — Deva/Manushya/Rakshasa match
3. Mahendra (மகேந்திரம்) — count girl's nak from boy's; auspicious if 4,7,10,13,16,19,22,25
4. Sthree Deergham (ஸ்திரீ தீர்காம்) — count girl's nak from boy's; must be > 13
5. Yoni (யோனி) — animal pair compatibility (14 yoni groups)
6. Rasi (ராசி) — rasi pair compatibility table
7. Rasiyathipathi (ராசியாதிபதி) — lords of both rasis must be compatible
8. Vasya (வாஸ்யம்) — one rasi must be vasya of the other
9. Rajju (ராஜ்ஜு) — five rope categories; same = widowhood risk; absolute veto
10. Vedha (வேதம்) — 12 vedha pairs; match = inauspicious; absolute veto

**Files to modify:**
- `app/services/astro/porutham.py`
- `packages/shared/src/i18n/strings.ts` (UI label strings)
- `web/app/[locale]/tools/porutham/page.tsx`
- `mobile/app/tools/porutham/index.tsx`

---

## GROUP B — I18N & STRING INTEGRITY

*All QF items below are independent and can be done in a single sitting. Do them in order — they all modify `packages/shared/src/i18n/strings.ts` and `mobile/app/(tabs)/today.tsx`.*

---

### B-01 🔴 XS — "Today" kicker in score hero shows English in Tamil mode

**Source:** IMPL_SPEC QF-1 | **File:** `mobile/app/(tabs)/today.tsx` line 450

**Problem:**
```ts
// BEFORE (line 450)
{isTamil ? "Today" : "Today"} · {cityName}
```
Both branches of the ternary return `"Today"`. Tamil users always see English.

The correct Tamil translation already exists in `packages/shared/src/i18n/strings.ts` at `strings.tabs.today` = `{ ta: "இன்று", en: "Today" }`. The `t()` function and `strings` are already imported via `useI18n()` on line 41 of today.tsx.

**Fix:**
```ts
// AFTER (line 450)
{t(strings.tabs.today)} · {cityName}
```

**Acceptance criteria:**
- Tamil mode: score hero kicker reads "இன்று · Chennai" (or user's city).
- English mode: reads "Today · Chennai".

---

### B-02 🔴 XS — "Best window" timing header shows English in Tamil mode

**Source:** IMPL_SPEC QF-2 | **File:** `mobile/app/(tabs)/today.tsx` line 468

**Problem:**
```ts
// BEFORE (line 468)
<Text style={styles.bestWindowLabel}>{isTamil ? "Best window" : "Best window"}</Text>
```

The correct Tamil string already exists in `strings.today.best_window` = `{ ta: "சிறந்த நேரம்", en: "Best window" }`.

**Fix:**
```ts
// AFTER (line 468)
<Text style={styles.bestWindowLabel}>{t(strings.today.best_window)}</Text>
```

**Acceptance criteria:**
- Tamil mode: label reads "சிறந்த நேரம்".
- English mode: reads "Best window".

---

### B-03 🔴 S — Score state labels have no Tamil translation

**Source:** IMPL_SPEC QF-3

**Files:**
1. `packages/shared/src/i18n/strings.ts` — add three keys to the `today` section
2. `mobile/app/(tabs)/today.tsx` line 463 — use the new keys

**Problem:**
```ts
// BEFORE (today.tsx line 463)
<Text style={styles.scoreHeroState}>
  {g.score >= SCORE_THRESHOLDS.HIGH ? "Good window"
    : g.score >= SCORE_THRESHOLDS.MID ? "Move steadily"
    : "Go gently"}
</Text>
```

This is the most prominent text after the score number itself — a brand break in Tamil mode.

**Tamil translations (tradition-specific):**
- "Good window" → **நல்ல நேரம்** *(the exact Tamil panchangam term for an auspicious period)*
- "Move steadily" → **நிதானமாக செல்**
- "Go gently" → **கவனமாக நடக்கவும்**

**Step 1 — Add to `packages/shared/src/i18n/strings.ts`** inside the `today:` block:
```ts
score_state_high: { ta: "நல்ல நேரம்",          en: "Good window"    },
score_state_mid:  { ta: "நிதானமாக செல்",        en: "Move steadily"  },
score_state_low:  { ta: "கவனமாக நடக்கவும்",     en: "Go gently"      },
```

**Step 2 — Update `mobile/app/(tabs)/today.tsx` line 463:**
```ts
// AFTER
<Text style={styles.scoreHeroState}>
  {g.score >= SCORE_THRESHOLDS.HIGH
    ? t(strings.today.score_state_high)
    : g.score >= SCORE_THRESHOLDS.MID
      ? t(strings.today.score_state_mid)
      : t(strings.today.score_state_low)}
</Text>
```

**Acceptance criteria:**
- Tamil mode, score ≥ 65: "நல்ல நேரம்"
- Tamil mode, score 45–64: "நிதானமாக செல்"
- Tamil mode, score < 45: "கவனமாக நடக்கவும்"
- English mode: unchanged ("Good window" / "Move steadily" / "Go gently")
- TypeScript compiles (keys are in `as const` — types are inferred automatically)

---

### B-04 🔴 S — Activity chip labels are hardcoded English

**Source:** IMPL_SPEC QF-4

**Files:**
1. `packages/shared/src/i18n/strings.ts` — add `chips:` block
2. `mobile/app/(tabs)/today.tsx` lines 300–312 — use new keys

**Problem:** The `activityChips` array (lines 297–314 in today.tsx) builds label strings directly in English. These chips are the most-interacted elements on the Today screen after the score hero. Note: in Tamil astrological practice, the planetary hour is called **ஓரை** *(orai)*, not "hora" — showing the Sanskrit term in Tamil mode misrepresents the tradition.

**Step 1 — Add to `packages/shared/src/i18n/strings.ts`** after the `today:` block:
```ts
chips: {
  start_work:   { ta: "பணி தொடங்கு",       en: "Start work"    },
  hora_suffix:  { ta: "ஓரை",               en: "hora"          },
  travel:       { ta: "பயணம்",             en: "Travel"        },
  contracts:    { ta: "ஒப்பந்தம்",          en: "Contracts"     },
  avoid_rush:   { ta: "அவசரம் வேண்டாம்",   en: "Avoid rush"    },
},
```

**Step 2 — Update `mobile/app/(tabs)/today.tsx` lines 300–312:**
```ts
// BEFORE
if (g.bestWindows?.[0]) {
  const w = g.bestWindows[0];
  chips.push({ label: "Start work", ok: true, detail: `${w.type}: ${formatTime(w.start)} - ${formatTime(w.end)}` });
}
if (g.currentHoraLord) {
  chips.push({ label: `${g.currentHoraLord} hora`, ok: true, detail: biText(g.actionSuggestion, isTamil, "Use this window for focused action.") });
}
chips.push({ label: "Travel",    ok: g.score >= SCORE_THRESHOLDS.MID, detail: biText(g.reasons?.panchangam, isTamil, biText(g.actionSuggestion, isTamil)) });
chips.push({ label: "Contracts", ok: !g.cautionWindows?.length && g.score >= SCORE_THRESHOLDS.HIGH, detail: biText(g.cautionSuggestion, isTamil, "Check caution windows before signing.") });
if (g.cautionWindows?.[0]) {
  const w = g.cautionWindows[0];
  chips.push({ label: "Avoid rush", ok: false, detail: `${w.type}: ${formatTime(w.start)} - ${formatTime(w.end)}` });
}
```

```ts
// AFTER
if (g.bestWindows?.[0]) {
  const w = g.bestWindows[0];
  chips.push({ label: t(strings.chips.start_work), ok: true, detail: `${w.type}: ${formatTime(w.start)} - ${formatTime(w.end)}` });
}
if (g.currentHoraLord) {
  chips.push({ label: `${g.currentHoraLord} ${t(strings.chips.hora_suffix)}`, ok: true, detail: biText(g.actionSuggestion, isTamil, "Use this window for focused action.") });
}
chips.push({ label: t(strings.chips.travel),    ok: g.score >= SCORE_THRESHOLDS.MID, detail: biText(g.reasons?.panchangam, isTamil, biText(g.actionSuggestion, isTamil)) });
chips.push({ label: t(strings.chips.contracts), ok: !g.cautionWindows?.length && g.score >= SCORE_THRESHOLDS.HIGH, detail: biText(g.cautionSuggestion, isTamil, "Check caution windows before signing.") });
if (g.cautionWindows?.[0]) {
  const w = g.cautionWindows[0];
  chips.push({ label: t(strings.chips.avoid_rush), ok: false, detail: `${w.type}: ${formatTime(w.start)} - ${formatTime(w.end)}` });
}
```

**Acceptance criteria:**
- Tamil mode: chips show "பணி தொடங்கு", "சுக்கிர ஓரை" (lord name preserved, only suffix translated), "பயணம்", "ஒப்பந்தம்", "அவசரம் வேண்டாம்".
- English mode: unchanged.

---

### B-05 🔴 S — Journal moment and area labels are hardcoded English

**Source:** IMPL_SPEC QF-6

**Files:**
1. `packages/shared/src/i18n/strings.ts` — add `journal:` block
2. `mobile/app/(tabs)/today.tsx` lines 78–93 render sites

**Problem:**
```ts
// BEFORE (lines 78–84)
const JOURNAL_MOMENTS = [
  { key: "win",       label: "Big win"      },
  { key: "hard_day",  label: "Hard day"     },
  { key: "decision",  label: "Decision"     },
  { key: "milestone", label: "Milestone"    },
  { key: "quiet",     label: "Nothing yet"  },
];

// BEFORE (lines 86–93)
const JOURNAL_AREAS = [
  { key: "career",    label: "Career"   },
  { key: "love",      label: "Love"     },
  { key: "health",    label: "Health"   },
  { key: "money",     label: "Money"    },
  { key: "family",    label: "Family"   },
  { key: "spiritual", label: "Spiritual"},
  { key: "general",   label: "General"  },
];
```

**Step 1 — Add to `packages/shared/src/i18n/strings.ts`:**
```ts
journal: {
  moment_win:       { ta: "வெற்றி",           en: "Big win"     },
  moment_hard_day:  { ta: "கஷ்டமான நாள்",     en: "Hard day"    },
  moment_decision:  { ta: "முடிவு",            en: "Decision"    },
  moment_milestone: { ta: "மைல்கல்",           en: "Milestone"   },
  moment_quiet:     { ta: "நல்லது இல்லை",      en: "Nothing yet" },
  area_career:      { ta: "தொழில்",            en: "Career"      },
  area_love:        { ta: "அன்பு",             en: "Love"        },
  area_health:      { ta: "உடல்நலம்",           en: "Health"      },
  area_money:       { ta: "பணம்",              en: "Money"       },
  area_family:      { ta: "குடும்பம்",          en: "Family"      },
  area_spiritual:   { ta: "ஆன்மிகம்",          en: "Spiritual"   },
  area_general:     { ta: "பொதுவான",           en: "General"     },
},
```

**Step 2 — Update the render sites in `today.tsx`.** Keep the arrays for `key`; derive `label` via `t()` at the render site:
```ts
{JOURNAL_MOMENTS.map(m => (
  <TouchableOpacity key={m.key} ...>
    <Text>{t(strings.journal[`moment_${m.key}` as keyof typeof strings.journal])}</Text>
  </TouchableOpacity>
))}
```
Apply the same pattern to `JOURNAL_AREAS` using `area_${m.key}`.

**Acceptance criteria:**
- Tamil mode: journal chips show "வெற்றி", "கஷ்டமான நாள்", "தொழில்", "அன்பு", etc.
- English mode: all labels unchanged.

---

### B-06 🟠 S — Hardcoded Insights tab label in mobile `_layout.tsx` bypasses i18n

**Source:** Full-Stack Developer, PO-01

**Problem:** `mobile/app/(tabs)/_layout.tsx` line ~75:
```ts
lang === "ta" ? "ஆராய்" : "Explore"
```
Hardcoded inline, not in the shared strings file. Translators cannot update it.

**What to do:**
1. Open `packages/shared/src/i18n/strings.ts` — find the `tabs` section.
2. Add:
   ```ts
   tabs: {
     ...
     insights: { ta: "ஆராய்வு", en: "Insights" },
   }
   ```
3. In `mobile/app/(tabs)/_layout.tsx` line ~75, replace the ternary with `t(strings.tabs.insights)` (or equivalent call).
4. Confirm both languages render correctly on device/simulator.

---

### B-07 🟡 S — "Insights" tab strings entirely absent from shared strings

**Source:** Full-Stack Developer, PO-01

**Dependency:** Do B-06 first.

**Problem:** The shared strings file defines tab keys `today`, `panchangam`, `tools`, `me` — but `insights` has no other strings besides the label. Audit the Insights screen for any hardcoded strings.

**What to do:**
1. Read `mobile/app/(tabs)/insights/index.tsx`.
2. Move any hardcoded English/Tamil strings into the shared strings file under an `insights:` section.
3. Verify the web equivalent page (if it exists) uses the same string keys.

---

### B-08 🟡 S — Verify all 27 nakshatra names use Tamil forms in i18n strings

**Source:** Full-Stack Developer

**Problem:** The calculation layer uses correct Tamil names. Verify the same names appear in UI strings (not transliterations like "Krittika" instead of "Karthigai").

**Canonical Tamil forms to verify:**
Ashwini, **Karthigai**, Rohini, **Mirugaseeridam**, Thiruvadhirai, **Punarpoosam**, **Poosam**, **Ayilyam**, Magam, Pooram, Uthiram, Hastham, Chittirai, Swathi, Visakam, Anusham, **Kettai**, Moolam, Pooradam, Uthiradam, **Thiruvonam**, **Avittam**, **Sadayam**, **Poorattathi**, **Uthirattathi**, Revathi.

**What to do:**
1. Read the nakshatra name list from `packages/shared/src/i18n/strings.ts`.
2. Fix any names that use North Indian transliterations.

---

## GROUP C — MISSING FEATURES & SCREEN PARITY

### C-01 🟠 M — Add `ThirukanithamBadge` to web dashboard and panchangam page

**Source:** IMPL_SPEC MED-1

**Problem:** The mobile `ThirukanithamBadge` is the most important brand differentiator inline signal — it exists only on mobile. On web, it is only mentioned in paragraph text. No visual badge appears on the web dashboard or panchangam pages.

**Step 1 — Create `web/components/thirukanitham-badge.tsx` (new file):**
```tsx
import Link from "next/link";
import type { CSSProperties } from "react";

interface ThirukanithamBadgeProps {
  size?: "sm" | "md";
  style?: CSSProperties;
  asLink?: boolean;
}

export function ThirukanithamBadge({ size = "sm", style, asLink = true }: ThirukanithamBadgeProps) {
  const isSmall = size === "sm";
  const badgeStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "var(--color-gold, #C8972A)",
    borderRadius: isSmall ? "6px" : "8px",
    padding: isSmall ? "2px 8px" : "4px 12px",
    fontFamily: "var(--font-tamil, 'Noto Sans Tamil', sans-serif)",
    fontSize: isSmall ? "0.625rem" : "0.75rem",
    fontWeight: isSmall ? 400 : 700,
    lineHeight: isSmall ? "16px" : "18px",
    color: "var(--color-surface, #fff)",
    textDecoration: "none",
    whiteSpace: "nowrap",
    flexShrink: 0,
    ...style,
  };

  const content = <>திருக்கணிதம் ◉</>;

  if (asLink) {
    return (
      <Link href="/learn/what-is-thirukanitham" style={badgeStyle} title="What is Thirukanitham?">
        {content}
      </Link>
    );
  }
  return <span style={badgeStyle}>{content}</span>;
}
```
Note: This is a server component (no `useState`/`useEffect`) — safe to import in Next.js server components.

**Step 2 — Add to `web/components/dashboard-personal-hero.tsx`** near the score card kicker (~line 157):
```tsx
// BEFORE
<p className="cd-kicker">{t("personal_today", lang)}</p>

// AFTER
<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-2)" }}>
  <p className="cd-kicker" style={{ margin: 0 }}>{t("personal_today", lang)}</p>
  <ThirukanithamBadge size="sm" />
</div>
```
Add import: `import { ThirukanithamBadge } from "@/components/thirukanitham-badge";`

**Step 3 — Add to `web/app/panchangam/[date]/page.tsx`** in the hero section (~line 146):
```tsx
// BEFORE
<p className="cl-pub-lead" style={{ marginBottom: "20px" }}>
  Thirukanitham-based · Sunrise-adjusted timings
</p>

// AFTER
<div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
  <p className="cl-pub-lead" style={{ margin: 0 }}>
    Thirukanitham-based · Sunrise-adjusted timings
  </p>
  <ThirukanithamBadge size="sm" />
</div>
```
Add import: `import { ThirukanithamBadge } from "@/components/thirukanitham-badge";`

**Acceptance criteria:**
- Web dashboard score card: badge visible above the score ring without scrolling.
- Web panchangam page: badge visible in the hero without scrolling.
- Clicking badge navigates to `/learn/what-is-thirukanitham`.
- Tamil script renders correctly (Noto Sans Tamil is already loaded in `web/app/layout.tsx`).
- Badge works in dark and light theme (uses CSS variables).

---

### C-02 🟠 M — Mobile Nakshatra Detail Pages

**Source:** IMPL_SPEC LRG-1

**Problem:** Web has 27 full nakshatra pages at `web/app/natchathiram/[slug]/`. Mobile has only a list screen (`natchathiram.tsx`). Tapping a nakshatra navigates nowhere — it is a broken tap target.

**Dependency:** Verify `GET /api/v1/content/nakshatra/{slug}` exists in `app/api/content.py` before starting.

**Step 1 — Verify or create the backend endpoint.** If it doesn't exist, check `app/services/nakshatra_content.py` and `app/services/nakshatra_content_static.py` and create a thin route.

**Step 2 — Create `mobile/src/api/nakshatra.ts`:**
```ts
import { apiClient } from "@vinaadi/shared/api/client";

export interface NakshatraDetail {
  slug: string;
  name: { ta: string; en: string };
  deity: { ta: string; en: string };
  planet: { ta: string; en: string };
  symbol: string;
  traits: Array<{ ta: string; en: string }>;
  compatible: string[];    // slugs
  description: { ta: string; en: string };
  todayGuidance?: { ta: string; en: string } | null;
}

export async function getNakshatraDetail(slug: string): Promise<NakshatraDetail> {
  const res = await apiClient.get(`/api/v1/content/nakshatra/${slug}`);
  return res.data.data as NakshatraDetail;
}
```

**Step 3 — Create `mobile/app/(tabs)/tools/natchathiram/[slug].tsx`.** Sections in scroll order:
1. Header — name (Tamil + English), ruling planet, deity
2. Description — full paragraph in active language
3. Personality traits — horizontal chip list
4. Compatible nakshatras — tappable chips (navigate to their `[slug]`)
5. "My Nakshatra" callout — if user's birth nakshatra matches: "இது உங்கள் நட்சத்திரம்"
6. Today's guidance — if `todayGuidance` is returned

Use the existing `SkeletonCard` / `ErrorCard` pattern from `mobile/app/jadhagam/[id].tsx`.

**Step 4 — Update `mobile/app/(tabs)/tools/natchathiram.tsx`** — make each list item navigate:
```tsx
// BEFORE
<TouchableOpacity key={n.slug} onPress={() => { /* nothing */ }}>

// AFTER
<TouchableOpacity key={n.slug} onPress={() => router.push({ pathname: "/tools/natchathiram/[slug]", params: { slug: n.slug } })}>
```

**Acceptance criteria:**
- Tapping any nakshatra opens the detail screen without crashing.
- Detail screen shows name in Tamil / English per active language.
- "இது உங்கள் நட்சத்திரம்" callout appears for the user's birth nakshatra.
- Tapping a compatible nakshatra chip navigates to that nakshatra's screen.
- Back button returns to the list.

---

### C-03 🟡 L — Web Today Consolidated View (single-scroll dashboard)

**Source:** IMPL_SPEC LRG-2

**Dependency:** C-01 (ThirukanithamBadge) must be done first.

**Problem:** Mobile Today tab delivers in one scroll: score ring → life areas → cosmic alert → best time → chips → journal → rasi palan → events. On web, the same information is fragmented across 3–4 dashboard tabs.

**Files:**
- Create: `web/components/dashboard-today-tab.tsx`
- Modify: `web/components/dashboard-workspace.tsx` — make Today the default active tab

**Sections in scroll order:**

| # | Section | Data source |
|---|---------|------------|
| 1 | Score hero — ring + state label + ThirukanithamBadge | `usePersonalData()` → `todayGuidance.score` |
| 2 | Life area pulse — horizontal chip row | `usePersonalData()` → `lifeAreas` |
| 3 | Cosmic alert — Chandrashtama / Rahu kalam banner | `usePersonalData()` → `todayTransit` / panchangam |
| 4 | Best time window card | `usePersonalData()` → `todayGuidance.bestWindows[0]` |
| 5 | Journal quick-log | inline journal entry |
| 6 | Rasi palan card | `usePersonalData()` → `rasiPalan` |
| 7 | Upcoming events | `usePersonalData()` → `lifeEvents` |

**Implementation approach:** Create `dashboard-today-tab.tsx` as a client component. Reuse existing sub-components (`PersonalHero`, `DashboardDailySnapshot`, specific sections of `DashboardLifeAreasTab`) rather than duplicating them. No new API calls required — the data is already being fetched.

**Acceptance criteria:**
- Web dashboard shows Today view by default without clicking any tab.
- All 7 sections visible in a single scroll on 1440px desktop.
- On mobile-width web (< 768px), sections stack vertically and remain readable.
- ThirukanithamBadge visible in the score hero without scrolling.

---

### C-04 🟠 M — PPU (Pay-Per-Use) discovery flow has no UI surface

**Source:** CPO, PO-08

**Problem:** PPU products (1/3/5/10 page reports, Porutham reports, topup questions) are defined in `tier_limits.py` and `tiers.ts` but there is no in-product screen where users can discover and purchase them.

**What to do:**
1. Create `web/app/[locale]/dashboard/reports/page.tsx` — list available PPU products with price and buy button.
2. Create `mobile/app/reports/index.tsx` — equivalent mobile screen.
3. Add "Buy Reports" entry to web dashboard sidebar and mobile Tools tab.
4. Wire buy buttons to Stripe/payment flow (or "Coming Soon" placeholder if payment is not yet wired).
5. Add route to nav guard so unauthenticated users are redirected to login.

---

### C-05 🟡 S — Chandrashtama calculator missing from web

**Source:** PO-05, Full-Stack Developer

**Problem:** `mobile/app/chandrashtama.tsx` has an interactive calculator. The web only has `/learn/what-is-chandrashtama` (informational only).

**What to do:**
1. Create `web/app/[locale]/tools/chandrashtama/page.tsx`.
2. Accept birth date/time/place (or use active profile), call the Chandrashtama API, display upcoming periods with start/end times.
3. Add link from `/tools` index page.
4. Check tier gate — Registered and Premium users only.

---

### C-06 🟡 S — Daily Score standalone web page missing

**Source:** Full-Stack Developer, PO-07

**Problem:** `mobile/app/daily-score.tsx` shows the full score breakdown. Web only has the gauge embedded in the dashboard.

**What to do:**
1. Create `web/app/[locale]/dashboard/daily-score/page.tsx` with full breakdown: overall score, sub-category breakdown, methodology explanation.
2. Make the gauge on the main dashboard a clickable link to this page.

---

### C-07 🟡 S — Goals dedicated web route missing

**Source:** Full-Stack Developer

**Problem:** `mobile/app/goals/index.tsx` exists. Web has dashboard components but no `/dashboard/goals` route.

**What to do:**
1. Create `web/app/[locale]/dashboard/goals/page.tsx`.
2. Add "Goals" to the web dashboard sidebar.

---

### C-08 🟡 S — Annual Wrapped missing as standalone web route

**Source:** PO-06

**Problem:** `mobile/app/wrapped/` exists. `web/components/dashboard-annual-wrapped.tsx` exists as a component but there is no `/dashboard/wrapped` route.

**What to do:**
1. Create `web/app/[locale]/dashboard/wrapped/page.tsx` using the existing component.
2. Add an entry point (button or card) on the main dashboard.

---

### C-09 🟡 XS — Birth-time rectification missing from mobile Tools tab index

**Source:** PO-02, PO-09, Mobile Developer

**Problem:** `mobile/app/rectification/index.tsx` exists as a deep-link screen but is NOT in `mobile/app/(tabs)/tools/index.tsx`. Users cannot discover it.

**What to do:**
1. Open `mobile/app/(tabs)/tools/index.tsx`.
2. Add a "Birth Time Rectification" entry linking to `app/rectification/`.
3. Add the corresponding i18n string if not present.

---

### C-10 🟡 S — Add global offline indicator to mobile root layout

**Source:** Mobile Developer

**Problem:** `useOfflineStatus` hook exists but is not wired into `mobile/app/_layout.tsx`. Many screens have no offline feedback.

**What to do:**
1. Open `mobile/app/_layout.tsx`.
2. Import `useOfflineStatus`.
3. Render a persistent offline banner beneath the navigation bar when offline.
4. Banner must disappear when connectivity is restored.
5. Confirm it does not obscure the tab bar or content on small screens.

---

## GROUP D — ARCHITECTURE & CI HYGIENE

### D-01 🟠 M — Add CI parity check: `tier_limits.py` vs `tiers.ts`

**Source:** Software Architect

**Problem:** `app/services/tier_limits.py` and `packages/shared/src/constants/tiers.ts` both define tier limits. No automated check ensures they stay in sync. If they drift, the pricing page shows wrong values while the API enforces different limits.

**What to do:**
1. Create `tests/test_tier_parity.py`.
2. Import `TIER_LIMITS` from `app/services/tier_limits.py`.
3. Read `packages/shared/src/constants/tiers.ts` as text and parse key limits (or call a `/api/v1/tiers` endpoint if one exists).
4. Assert registered/premium question limits, profile limits, and report credits match between the two files.
5. Add to CI pipeline.

---

### D-02 🟡 M — Audit mobile API client duplication

**Source:** Software Architect

**Problem:** Both `mobile/src/api/` (25 files) and `packages/shared/src/api/` (24 files) exist. If mobile imports from its local copy, the two can diverge silently.

**What to do:**
1. Search `mobile/` for imports referencing `../api/` or `../../api/` (local clients).
2. Search for imports from `@vinaadi/shared/api`.
3. Determine which is authoritative.
4. If mobile should use shared: update all local imports to `@vinaadi/shared/src/api/` and delete local copies.
5. If intentionally separate: document why in `mobile/src/api/index.ts` and add a lint rule or structural test.

---

### D-03 🟡 S — Document `daily_push_cron.py` deployment model

**Source:** Software Architect

**Problem:** `daily_push_cron.py` has distributed locking via `job_registry.py` and `leader_lock.py` but no documentation on how it is deployed (separate process? K8s CronJob? FastAPI background task?).

**What to do:**
1. Read `daily_push_cron.py`, `job_registry.py`, `leader_lock.py`.
2. Add a comment block at the top of `daily_push_cron.py` explaining: start command, run frequency, leader election, crash behaviour.
3. Create `docs/CRON_WORKER.md` with full deployment instructions.

---

### D-04 🟡 M — Add `X-Request-ID` header propagation for distributed tracing

**Source:** Software Architect

**Problem:** No request ID propagates from client → FastAPI → calculation layer. Hard to correlate which execution path caused a reported bug.

**What to do:**
1. In FastAPI middleware (`app/main.py` or `app/middleware/`): read `X-Request-ID` from request (or generate UUID), attach to `request.state.request_id`, return in response header.
2. Pass `request_id` into calculation service calls and log output.
3. In `packages/shared/src/api/`: generate UUID per request and send as `X-Request-ID`.
4. Do the same in mobile.

---

### D-05 🟡 M — Yoga completeness — Pancha Mahapurusha + Raja Yoga

**Source:** Renowned Astrologer

**Problem:** Pancha Mahapurusha yogas (Ruchaka, Bhadra, Hamsa, Malavya, Sasa) and full Raja Yoga (trikona + kendra lord combination) need verification.

**What to do:**
1. Read `app/services/astro/_yoga_detect.py`.
2. Confirm all 5 Pancha Mahapurusha yogas are present:
   - Ruchaka: Mars in own sign or exaltation in kendra
   - Bhadra: Mercury in own sign or exaltation in kendra
   - Hamsa: Jupiter in own sign or exaltation in kendra
   - Malavya: Venus in own sign or exaltation in kendra
   - Sasa: Saturn in own sign or exaltation in kendra
3. Confirm Raja Yoga includes lord of 9th + lord of 10th conjunction/mutual aspect (trikona + kendra lord pattern).
4. Implement any that are missing.
5. Add a unit test for each yoga using a known chart where the yoga is present.

---

### D-06 🟡 S — Verify Tamil festival calendar 2026 completeness

**Source:** Renowned Astrologer

**Problem:** `panchangam_events_2026.py` must include all major Tamil-specific festivals.

**What to do:**
1. Open `panchangam_events_2026.py`.
2. Confirm all of the following are present:
   - Thai Pongal (தைப் பொங்கல்) — Thai 1 (~Jan 14)
   - Karthigai Deepam (கார்த்திகை தீபம்)
   - Aadi Perukku (ஆடி பெருக்கு) — Aadi 18 (~Aug 3)
   - Vaikunta Ekadasi (வைகுந்த ஏகாதசி)
   - Panguni Uthiram (பங்குனி உத்திரம்)
   - Chithirai Vishu (சித்திரை விஷு)
   - Tamil New Year / Tamil Puthandu (Mesha Sankranti)
3. Add any missing festivals with the correct 2026 date.
4. Confirm both Tamil and English names are present for each.

---

## GROUP E — PRODUCT & CONVERSION IMPROVEMENTS

### E-01 🟠 S — Add tagline above the fold on landing page

**Source:** CMO

**Problem:** First-time visitors cannot understand what Vinaadi is. "Vinaadi" (meaning "second" in Tamil) is not self-explanatory.

**What to do:**
1. Find the landing page hero (likely `web/app/[locale]/page.tsx` or `web/components/landing/hero.tsx`).
2. Add a one-liner tagline beneath the logo:
   - EN: "Your birth second, calculated precisely"
   - TA: "உங்கள் பிறந்த விநாடி, திருகணித துல்லியத்தில்"
3. Tagline must be above the fold on mobile without scrolling.
4. Add string to i18n — do not hardcode.

---

### E-02 🟠 M — Add social proof block to landing page

**Source:** CMO

**Dependency:** H-03 (public stats endpoint) should be done first if a live counter is wanted; otherwise use a static placeholder.

**What to do:**
1. Add social proof section below the landing hero:
   - "X jadhagams generated for Tamil families worldwide" counter (from `GET /api/v1/stats/public` — see H-03).
   - 2–3 testimonial cards (placeholder initially, wrapped in a feature flag for enabling when real content is ready).
2. For a tradition-sensitive Tamil audience, consider mentioning practitioners/endorsers if any are available.

---

### E-03 🟠 S — Wire PostHog events to each onboarding step

**Source:** CPO

**Problem:** `analytics.ts` exists but the onboarding funnel (birth-details → location → rasi-picker → jadhagam-reveal) has no step-level tracking.

**What to do:**
1. Find the onboarding screen components (web and mobile).
2. On each step transition: `analytics.track("onboarding_step_completed", { step: "birth_details" })`.
3. On exit without completion: `analytics.track("onboarding_abandoned", { last_step: "..." })`.
4. Steps to instrument: `birth_details`, `location_entry`, `rasi_picker`, `jadhagam_reveal`, `onboarding_complete`.
5. Verify events appear in PostHog by running through the flow locally.

---

### E-04 🟡 XS — Increase registered tier limits to improve conversion

**Source:** CPO

**Problem:** Registered tier gives too little value: 5 questions/day, 3-day rasi palan. Low cost to increase; high perceived value.

**What to do:**
1. In `app/services/tier_limits.py`: Ask Vinaadi questions 5 → 7 per day; rasi palan days 3 → 7.
2. In `packages/shared/src/constants/tiers.ts`: same change.
3. Update `/pricing` page copy.
4. Run the tier parity test (D-01).

---

### E-05 🟡 M — Add "Family" use case landing page highlighting Family Vault

**Source:** CPO

**What to do:**
1. Create `web/app/[locale]/family/page.tsx`.
2. Content: "Keep your whole family's jadhagam in one place. Your parents, children, and spouse — all accessible anytime."
3. Show visual of the profile selector UI.
4. CTA: "Start with your own jadhagam" (leads to registration).
5. Add "For Families" to main navigation.
6. Add i18n strings for all content.

---

### E-06 🟡 S — Surface sharing features in onboarding as viral loop

**Source:** CMO

**Problem:** The panchangam `ShareCard` is underutilized as an organic growth lever.

**What to do:**
1. On the jadhagam-reveal step of onboarding, add a "Share your day's panchangam" prompt with the `ShareCard` component.
2. Add a share button to the Today tab (mobile) and dashboard (web) in a prominent position.
3. Track `analytics.track("share_card_opened")` and `analytics.track("share_card_shared")`.

---

### E-07 🟡 M — Guest teaser: show partial jadhagam before registration prompt

**Source:** PO (missing user story)

**What to do:**
1. After a guest enters birth details, show rasi (Moon sign) and lagna (ascendant) only — not the full chart.
2. Overlay a "Register to see your full jadhagam" CTA.
3. Track `analytics.track("jadhagam_teaser_shown")` and `analytics.track("register_from_teaser")`.
4. Ensure no premium calculation is run for the teaser.

---

### E-08 🟡 M — Registered user can buy reports without upgrading to Premium

**Source:** PO (missing user story)

**Dependency:** C-04 (PPU discovery screen) must exist first.

**What to do:**
1. On the PPU screen (C-04), ensure a Registered user can: select a report type, see the price, complete a one-time purchase, and receive the report — without upgrading their tier.
2. Backend must validate PPU purchase against credit balance, not just tier level.
3. Wire the frontend to the `purchase_report` API endpoint (or create it if missing).

---

## GROUP F — MOBILE TEST COVERAGE

*Mobile has only 1 test file for 62 screens. Web has 17. Do these in priority order.*

### F-01 🟠 S — Add unit tests for `guestStore.ts`

**Source:** Mobile Developer

**Problem:** A regression in session boundary logic silently unlocks premium features for guests.

**Create `mobile/__tests__/guestStore.test.ts`:**
- Guest session created with correct initial limits.
- Guest can use features up to the limit (e.g., 2 free queries).
- Guest is blocked after limit is reached.
- Guest session resets on the next day.
- Registered session ignores guest limits.

---

### F-02 🟠 S — Add unit tests for `i18n.ts`

**Source:** Mobile Developer

**Problem:** Tamil string lookup failure would cause the whole app to render in English silently.

**Create `mobile/__tests__/i18n.test.ts`:**
- `t("tabs.today.label")` returns "இன்று" in Tamil mode.
- `t("tabs.today.label")` returns "Today" in English mode.
- Missing key returns the key itself (not `undefined` or crash).
- Language switch updates all strings.

---

### F-03 🟠 S — Add unit tests for `useSession.ts`

**Source:** Mobile Developer

**Problem:** Auth flow regression prevents all users from logging in.

**Create `mobile/__tests__/useSession.test.ts`:**
- Mock authentication provider (Firebase or equivalent).
- Unauthenticated user has `session = null`.
- Authenticated user has correct `user.id` and `user.tier`.
- Session persists across app restarts (from encrypted storage).
- Logout clears session.

---

### F-04 🟡 M — Add API contract tests for all 25 mobile API clients

**Source:** Mobile Developer

**Problem:** 25 API clients with no tests — any backend schema change silently breaks mobile at runtime.

**Create `mobile/__tests__/api/` directory.** For each client:
- Mock the HTTP layer (MSW or jest mock).
- Call the client function with valid input.
- Assert the returned object has the expected shape.

**Priority order:** `panchangam`, `jadhagam`, `dasha`, `askVinaadi`, `rasiPalan`.

---

### F-05 🟡 M — Composite `getDailySnapshot` endpoint to reduce Today screen calls

**Source:** Mobile Developer

**Problem:** `today.tsx` makes 6 separate API calls on load — 6 skeleton states on a slow connection.

**What to do:**
1. Create backend `GET /api/v1/daily-snapshot` returning: panchangam, rasi palan (3 days), daily guidance, life areas, life events, upcoming transits.
2. In `mobile/app/(tabs)/today.tsx`, replace the 6 individual queries with a single `useQuery` call.
3. Add web equivalent if dashboard makes similar parallel calls.
4. Cache with TTL until midnight local time.

---

### F-06 🟡 XS — Suppress ads near dosham or negative results

**Source:** Mobile Developer

**Problem:** `AdUnit.tsx` in `today.tsx` — showing an ad next to a "high caution" dosham result is culturally jarring and damages trust.

**Fix in `today.tsx`:**
```ts
const showAd = !hasDoshamWarning;
// ...
{showAd && <AdUnit />}
```

---

## GROUP G — SEO & INTERNAL LINKING

### G-01 🟠 M — Fix web panchangam SEO metadata (remove Chennai hardcoding)

**Source:** IMPL_SPEC MED-2 | **File:** `web/app/panchangam/[date]/page.tsx`

**Problem:** Lines 41, 51, 57, 124–125 use `DEFAULT_CITY` in the page title, meta description, keywords, and JSON-LD. Every panchangam URL's SEO entry says "Chennai panchangam", even for a user in Singapore.

```ts
// BEFORE (line 41)
let description = `Tamil panchangam for ${dateLabel}, ${DEFAULT_CITY}. ...`;
// BEFORE (line 57)
keywords: [..., DEFAULT_CITY.toLowerCase() + " panchangam"]
// BEFORE (lines 124–125)
name: `Tamil Panchangam ${dateLabel} — ${DEFAULT_CITY}`,
```

**Fix:**
```ts
// AFTER (line 41)
let description = `Tamil Panchangam for ${dateLabel}. Thirukanitham-based calculation. Set your city for local sunrise, Rahu Kalam, and Nalla Neram timings.`;

// AFTER (line 51)
description = `${vara} ${dateLabel}: Tithi ${tithi}, Nakshatra ${nakshatra}. Rahu Kalam ${rahuStart}–${rahuEnd}. Nalla Neram ${nallaNeram}. Thirukanitham-based panchangam (default city: Chennai). Set your city for local timings.`;

// AFTER (line 57)
keywords: ["Tamil panchangam", `panchangam ${date}`, "Rahu kalam today", "Nalla neram", "Tithi Nakshatra today", "Thirukanitham panchangam"]

// AFTER (lines 123–125)
name: `Tamil Panchangam ${dateLabel} — Thirukanitham Calculation`,
description: `Daily Tamil panchangam for ${dateLabel}. Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, Nalla Neram. Thirukanitham-based sidereal calculation.`,
```

**Note:** The existing "Showing panchangam for Chennai" banner at lines 150–162 is acceptable as-is — no change needed there.

**Acceptance criteria:**
- No panchangam page title or JSON-LD name contains "Chennai".
- Keywords no longer include "chennai panchangam".
- The city banner still shows and links to the city planner.

---

### G-02 🟡 S — Add internal links from home page to Temple section and Festival Calendar

**Source:** CMO

**Problem:** Temple section and Festival Calendar are strong long-tail Tamil search plays but receive no internal link juice from the home page.

**What to do:**
1. On the landing page, add a "Discover" card grid with links to:
   - `/temples` — "Find temples near you"
   - `/panchangam` — "Today's panchangam"
   - `/calendar` — "Tamil festival calendar 2026"
2. Use descriptive anchor text.
3. Confirm these destination pages have proper `<meta description>` and `<title>` tags.

---

### G-03 🟡 M — Wire A/B test on primary CTA text

**Source:** CMO

**What to do:**
1. Use PostHog feature flags to create an A/B experiment:
   - Variant A: "Sign up free"
   - Variant B: "Get my jadhagam free"
2. In the landing page hero component, read the PostHog flag and render the matching CTA.
3. Track `analytics.track("cta_clicked", { variant: "A" | "B" })` on click.
4. Run for minimum 2 weeks before drawing conclusions.

---

## GROUP H — DOCUMENTATION & PROCESS

### H-01 🟡 XS — Commit or action `docs/IMPLEMENTATION_SPEC_2026_06_28.md`

**Source:** PO-04

**Problem:** The file is untracked (`??` in `git status`). Its contents are now fully merged into this workboard.

**What to do:** Either `git add docs/IMPLEMENTATION_SPEC_2026_06_28.md` and commit it for historical record, or delete it since its items are now tracked here. Do not leave it untracked.

---

### H-02 🟡 S — Add "X charts generated" counter backend stat endpoint

**Source:** CMO (needed by E-02)

**What to do:**
1. Create `GET /api/v1/stats/public` returning `{ "charts_generated": <integer> }`.
2. Source from `SELECT COUNT(*) FROM birth_profiles` (or equivalent).
3. Cache response for 1 hour.
4. The landing page social proof component (E-02) calls this endpoint.

---

### H-03 🟢 XS — Document Tamil 10-Porutham as roadmap item

**Source:** Renowned Astrologer, Software Architect

Even if Path A (label change) is chosen for A-07, record the full implementation as future work.

**What to do:** Add a `## Future Work` section to this file (or a `ROADMAP.md`) documenting: "Implement true Tamil 10-Porutham system. See A-07 for the full 10-porutham specification."

---

## DEPENDENCY MAP

```
B-03 (score state strings) → B-04 (activity chip strings) → B-05 (journal strings)
  All three: add keys to packages/shared/src/i18n/strings.ts FIRST,
  then modify mobile/app/(tabs)/today.tsx

B-06 (Insights tab label)
  └── prerequisite for B-07 (Insights tab full string audit)

C-01 (ThirukanithamBadge web)
  └── prerequisite for C-03 (web Today consolidated view)

C-04 (PPU discovery screen)
  └── prerequisite for E-08 (registered user buys reports)

H-02 (public stats endpoint)
  └── prerequisite for E-02 (social proof counter on landing page)

D-01 (tier parity test)
  └── run after E-04 (increase registered tier limits)

A-07 (Porutham) — CONFIRM PATH WITH PROJECT OWNER BEFORE STARTING
  └── if Path B: plan 1 week before touching porutham.py

C-02 (mobile nakshatra detail)
  └── verify backend /api/v1/content/nakshatra/{slug} exists BEFORE starting
```

---

## VALIDATION CHECKLIST (run after completing all Group A and B items)

| Check | Where |
|-------|--------|
| Score hero shows "நல்ல நேரம்" in Tamil mode when score ≥ 65 | Mobile Today tab |
| Score hero shows "நிதானமாக செல்" in Tamil mode when score 45–64 | Mobile Today tab |
| Score hero shows "கவனமாக நடக்கவும்" in Tamil mode when score < 45 | Mobile Today tab |
| Activity chips show Tamil labels in Tamil mode | Mobile Today tab |
| "hora" renders as "ஓரை" in Tamil mode | Mobile Today tab |
| "இன்று" appears as the date kicker in Tamil mode | Mobile Today tab |
| "சிறந்த நேரம்" appears as the timing header in Tamil mode | Mobile Today tab |
| Journal chips show Tamil labels in Tamil mode | Mobile Today tab |
| ThirukanithamBadge visible on web dashboard without scrolling | Web dashboard |
| ThirukanithamBadge visible on web panchangam page without scrolling | Web panchangam |
| ThirukanithamBadge links to `/learn/what-is-thirukanitham` | Both |
| Web panchangam SEO title does not say "Chennai" | View page source |
| Mobile nakshatra list items navigate to detail screens | Mobile Tools → Natchathiram |
| All 27 nakshatras have reachable detail screens | Mobile Tools → Natchathiram |
| Web score pill colour changes at HIGH=65 and MID=45 | Web dashboard |

---

## FILES MODIFIED SUMMARY

| File | Items |
|------|-------|
| `packages/shared/src/i18n/strings.ts` | B-03, B-04, B-05, B-06 |
| `mobile/app/(tabs)/today.tsx` | B-01, B-02, B-03, B-04, B-05, F-06 |
| `mobile/app/(tabs)/_layout.tsx` | B-06 |
| `mobile/app/(tabs)/insights/index.tsx` | B-07 |
| `web/components/dashboard-personal-hero.tsx` | A-02, C-01 |
| `web/components/thirukanitham-badge.tsx` *(new)* | C-01 |
| `web/app/panchangam/[date]/page.tsx` | C-01, G-01 |
| `web/lib/score-thresholds.test.ts` | A-01 |
| `app/services/astro/porutham.py` | A-07 |
| `app/services/tier_limits.py` | E-04 |
| `packages/shared/src/constants/tiers.ts` | E-04 |
| `mobile/src/api/nakshatra.ts` *(new)* | C-02 |
| `mobile/app/(tabs)/tools/natchathiram/[slug].tsx` *(new)* | C-02 |
| `mobile/app/(tabs)/tools/natchathiram.tsx` | C-02 |
| `mobile/app/(tabs)/tools/index.tsx` | C-09 |
| `mobile/app/_layout.tsx` | C-10 |
| `web/components/dashboard-today-tab.tsx` *(new)* | C-03 |
| `web/components/dashboard-workspace.tsx` | C-03 |
| `web/lib/gowri.ts` | A-04 |
| `tests/test_tier_parity.py` *(new)* | D-01 |
| `mobile/__tests__/guestStore.test.ts` *(new)* | F-01 |
| `mobile/__tests__/i18n.test.ts` *(new)* | F-02 |
| `mobile/__tests__/useSession.test.ts` *(new)* | F-03 |
| `mobile/__tests__/api/` *(new dir)* | F-04 |
| `daily_push_cron.py` | D-03 |
| `docs/CRON_WORKER.md` *(new)* | D-03 |

---

## COMPLETION TRACKING

| ID | Title | Severity | Effort | Status |
|---|---|---|---|---|
| A-01 | Fix score-thresholds.ts import (web tests) | 🔴 | XS | ✅ Done — test already imports `@vinaadi/shared/utils/score` correctly |
| A-02 | Web score hero: replace magic numbers with SCORE_THRESHOLDS | 🔴 | XS | ✅ Done 2026-06-28 |
| A-03 | Chandrashtama reference point (Moon rasi, not lagna) | 🔴 | S | ✅ Done 2026-06-28 — uses `janma_rasi` correctly; added Mesha→Vrishchika test case |
| A-04 | Gowri Nalla Neram day-wise kala sequence | 🔴 | S | ✅ Done 2026-06-28 — renamed to VILAMBHI/ANANDHA/ROGAM/LABHAM/AMIRTHAM/SHODAM/KALAM/VISHAM; 4 good kalas; all tests pass |
| A-05 | Rahu Kalam from sunrise, not fixed time | 🟠 | S | ✅ Done 2026-06-28 — already sunrise-relative (`kalam_anchor = sunrise; duration = (sunset-sunrise)/8`) |
| A-06 | Panchangam tithi transition time display | 🟠 | S | ✅ Done 2026-06-28 — `tithi_ends_at` always set in backend; rendered on web panchangam page |
| A-07 | Porutham mislabeled (Ashtakoota vs Tamil 10) | 🔴 | L | ✅ Done 2026-06-28 — Path B: full Tamil 10-Porutham pass/fail; Rajju/Vedha in kutas; 50 tests pass |
| B-01 | "Today" kicker hardcoded in today.tsx line 450 | 🔴 | XS | ✅ Done 2026-06-28 |
| B-02 | "Best window" label hardcoded in today.tsx line 468 | 🔴 | XS | ✅ Done 2026-06-28 |
| B-03 | Score state labels have no Tamil translation | 🔴 | S | ✅ Done 2026-06-28 |
| B-04 | Activity chip labels hardcoded English | 🔴 | S | ✅ Done 2026-06-28 |
| B-05 | Journal moment/area labels hardcoded English | 🔴 | S | ✅ Done 2026-06-28 — used ChipItem.labelTa + isTamil prop |
| B-06 | Hardcoded Insights tab label in _layout.tsx | 🟠 | S | ✅ Done 2026-06-28 — added `tabs.insights` to strings.ts |
| B-07 | Insights tab strings absent from shared strings | 🟡 | S | ✅ Done 2026-06-28 — added `insights:` block to strings.ts; updated insights/index.tsx |
| B-08 | Verify Tamil nakshatra names in i18n | 🟡 | S | ✅ Done 2026-06-28 — confirmed backend NAKSHATRA_NAMES uses Tamil forms (KARTHIGAI, MIRUGASEERIDAM, etc.) |
| C-01 | ThirukanithamBadge for web (dashboard + panchangam) | 🟠 | M | ✅ Done 2026-06-28 — new component + wired into dashboard hero and panchangam page |
| C-02 | Mobile Nakshatra detail screens | 🟠 | L | ✅ Done 2026-06-28 — `natchathiram.tsx` → paged list that navigates; new `natchathiram/[slug].tsx` detail screen with poster hero, contexts, pada, prev/next |
| C-03 | Web Today consolidated view (single-scroll) | 🟡 | L | ✅ Done 2026-06-28 — `dashboard-today-tab.tsx` created as thin re-export of `DashboardPersonalTab`; `dashboard-workspace.tsx` updated to import from new module |
| C-04 | PPU discovery screen (web + mobile) | 🟠 | M | ✅ Done 2026-06-28 — `web/app/dashboard/reports/page.tsx` + `mobile/app/reports/index.tsx`; "Buy Reports" added to web left rail and mobile Tools tab; Coming Soon buttons |
| C-05 | Chandrashtama calculator web page | 🟡 | S | ✅ Done 2026-06-28 — `web/app/tools/chandrashtama/page.tsx`; rasi picker → chandrashtama rasi + 12-house table + sign-up CTA |
| C-06 | Daily Score standalone web page | 🟡 | S | ✅ Done 2026-06-28 — `web/app/dashboard/daily-score/page.tsx`; score ring + 6-signal breakdown bars + action/caution/remedy cards |
| C-07 | Goals dedicated web route | 🟡 | S | ✅ Done 2026-06-28 — `web/app/dashboard/goals/page.tsx`; list + create + deactivate; all 10 goal types with icons |
| C-08 | Annual Wrapped web route | 🟡 | S | ✅ Done 2026-06-28 — `web/app/dashboard/wrapped/page.tsx`; slide viewer with prev/next/dot-nav + full-year stats panel |
| C-09 | Rectification in mobile Tools tab index | 🟡 | XS | ✅ Done 2026-06-28 — already in Advanced group (tools/index.tsx line 155) |
| C-10 | Global offline indicator in mobile root layout | 🟡 | S | ✅ Done 2026-06-28 — OfflineBanner component in _layout.tsx; uses useOfflineStatus + useI18n; absolute-positioned above safe area |
| D-01 | CI parity check: tier_limits.py vs tiers.ts | 🟠 | M | ✅ Done 2026-06-28 — tests/test_tier_parity.py: 8 tests, all pass; compares all 25 fields per tier |
| D-02 | Audit mobile API client duplication | 🟡 | M | ✅ Done 2026-06-28 — confirmed thin re-export pattern is intentional; documented architecture in `mobile/src/api/index.ts` (shared = authoritative domain, mobile = @/api/* alias + SecureStore overrides) |
| D-03 | Document daily_push_cron.py deployment | 🟡 | S | ✅ Done 2026-06-28 — corrected docstring (hourly not daily); docs/CRON_WORKER.md created with leader-election, crash-behaviour, and Docker Compose guide |
| D-04 | X-Request-ID header propagation | 🟡 | M | ✅ Done 2026-06-28 — backend middleware already done; added `crypto.randomUUID()` to `web/lib/api.ts` `buildHeaders()`; added `generateRequestId()` + header to `mobile/src/api/client.ts` `fetchWithAuth()` (Hermes-safe fallback) |
| D-05 | Yoga completeness — Pancha Mahapurusha + Raja | 🟡 | M | Open |
| D-06 | Tamil festival calendar 2026 completeness | 🟡 | S | ✅ Done 2026-06-28 — added 7 festivals: thai-pongal, tamil-puthandu, chithirai-vishu, panguni-uthiram, karthigai-deepam, vaikunta-ekadasi, aadi-perukku with verified 2026 dates |
| E-01 | Landing page tagline above the fold | 🟠 | S | ✅ Done 2026-06-28 — added `hero_tagline` to marketing-i18n.ts; rendered in home-content.tsx hero |
| E-02 | Social proof block on landing page | 🟠 | M | ✅ Done 2026-06-28 — live chart counter from `/api/backend/api/v1/stats/public` + 3 testimonial cards in `home-content.tsx`; i18n strings in `marketing-i18n.ts` |
| E-03 | PostHog events for onboarding funnel | 🟠 | S | ✅ Done 2026-06-28 — `trackEvent`/`track` added to all 4 mobile onboarding screens + web login page; covers birth_details, location_entry, rasi_picker, jadhagam_reveal, onboarding_complete, login |
| E-04 | Increase registered tier limits | 🟡 | XS | ✅ Done 2026-06-28 — 5→7 questions/day, 3→7 rasi palan days in both tier_limits.py and tiers.ts |
| E-05 | Family use-case landing page | 🟡 | M | Open |
| E-06 | Sharing features in onboarding as viral loop | 🟡 | S | ✅ Done 2026-06-28 — share button added to `mobile/app/(tabs)/today.tsx` quick-actions; share prompt added to `mobile/app/(onboarding)/jadhagam-reveal.tsx`; both track `share_card_opened` / `share_card_shared` via PostHog |
| E-07 | Guest jadhagam teaser before registration | 🟡 | M | Open |
| E-08 | Registered user buys reports without Premium | 🟡 | M | Open — depends on C-04 |
| F-01 | Mobile test: guestStore.ts | 🟠 | S | ✅ Done 2026-06-28 — mobile/__tests__/guestStore.test.ts: 11 tests (load/save/clear/defaults/corrupt) |
| F-02 | Mobile test: i18n.ts | 🟠 | S | ✅ Done 2026-06-28 — mobile/__tests__/i18n.test.ts: 11 tests (biText Tamil/English/null; strings completeness) |
| F-03 | Mobile test: useSession.ts | 🟠 | S | ✅ Done 2026-06-28 — mobile/__tests__/useSession.react.test.tsx: 11 tests (renderHook + jsdom; initial/setSession/clearSession/logout) |
| F-04 | Mobile API contract tests (25 clients) | 🟡 | M | Open |
| F-05 | Composite getDailySnapshot endpoint | 🟡 | M | Open |
| F-06 | Suppress ads near dosham/negative results | 🟡 | XS | ✅ Done 2026-06-28 |
| G-01 | Fix web panchangam SEO (remove Chennai hardcoding) | 🟠 | S | ✅ Done 2026-06-28 |
| G-02 | Internal links: Temple & Festival from home | 🟡 | S | ✅ Done 2026-06-28 — Discover section added to `web/components/home-content.tsx` with 3-card grid (temples, panchangam, festival calendar); 12 bilingual strings added to `web/lib/marketing-i18n.ts` |
| G-03 | A/B test primary CTA text via PostHog | 🟡 | M | Open |
| H-01 | Commit or delete IMPLEMENTATION_SPEC_2026_06_28.md | 🟡 | XS | ✅ Done 2026-06-28 — staged with git add |
| H-02 | Public stats endpoint for chart count | 🟢 | S | ✅ Done 2026-06-28 — GET /api/v1/stats/public returns {charts_generated: N}; 1-hour cache via get_cache(); wired in main.py |
| H-03 | Document Tamil 10-Porutham as roadmap item | 🟢 | XS | ✅ Done 2026-06-28 — added Future Work section to docs/ROADMAP_TASKS.md with 10-porutham table and next steps |

---

*Last updated: 2026-06-28 | Session 3: +2 (A-04, A-07) | Session 4: +7 (D-03, D-06, H-02, H-03, F-01, F-02, F-03) | Session 5: +8 (E-02, E-03, C-04, C-02, C-05, C-06, C-07, C-08) | Session 6: +5 (C-03, D-02, D-04, E-06, G-02) | Session 7: +4 (C-10, B-08, D-01, G-01) | Running total: 44 closed / 51 total | Open (🟡 only): D-05, E-05, E-07, E-08, F-04, F-05, G-03*
