# Vinaadi AI — Implementation Spec
**Date:** 28 June 2026  
**Branch target:** `harden/production-readiness`  
**Scope:** All open gaps found in the 28 June multi-role audit  
**Audience:** Any coding agent or developer picking this up cold

---

## How To Use This Document

- Items are ordered **smallest effort first**. Do them in order unless a dependency is noted.
- Every item has: the **exact file path**, the **exact line(s)** to change, a **before/after code block**, and **acceptance criteria** so you know when it is done.
- If an item says "add to `strings.ts`", always mean `packages/shared/src/i18n/strings.ts` unless stated otherwise.
- Run `pnpm --filter mobile dev` and `pnpm --filter web dev` to verify visually after each group.

---

## Group 1 — Quick Fixes (under 2 hours total, do all at once)

These are single-line or few-line fixes that fix visible Tamil-language UX breaks. They require no new components and no new API calls.

---

### QF-1 — "Today" kicker in score hero shows English in Tamil mode

**File:** `mobile/app/(tabs)/today.tsx` — line 450  
**Effort:** 5 minutes

#### Problem
The date kicker inside the score hero card uses a no-op ternary — both branches return `"Today"`. Tamil-mode users see the English word.

```ts
// BEFORE (line 450)
{isTamil ? "Today" : "Today"} · {cityName}
```

The correct Tamil translation already exists in `packages/shared/src/i18n/strings.ts` at `strings.tabs.today` = `{ ta: "இன்று", en: "Today" }`. The `t()` function and `strings` are already imported via `useI18n()` on line 41 of today.tsx.

```ts
// AFTER (line 450)
{t(strings.tabs.today)} · {cityName}
```

#### Acceptance criteria
- Open mobile in Tamil mode. The score hero kicker reads "இன்று · Chennai" (or user's city), not "Today · Chennai".
- Open in English mode. The kicker reads "Today · Chennai".

---

### QF-2 — "Best window" timing header shows English in Tamil mode

**File:** `mobile/app/(tabs)/today.tsx` — line 468  
**Effort:** 5 minutes

#### Problem
Same pattern as QF-1. The `bestWindowLabel` renders identically in both languages.

```ts
// BEFORE (line 468)
<Text style={styles.bestWindowLabel}>{isTamil ? "Best window" : "Best window"}</Text>
```

The correct Tamil translation already exists in `packages/shared/src/i18n/strings.ts` at `strings.today.best_window` = `{ ta: "சிறந்த நேரம்", en: "Best window" }`.

```ts
// AFTER (line 468)
<Text style={styles.bestWindowLabel}>{t(strings.today.best_window)}</Text>
```

#### Acceptance criteria
- Tamil mode: label reads "சிறந்த நேரம்".
- English mode: label reads "Best window".

---

### QF-3 — Score state labels ("Good window" / "Move steadily" / "Go gently") have no Tamil translation

**Files:**
1. `packages/shared/src/i18n/strings.ts` — add three new keys to the `today` section
2. `mobile/app/(tabs)/today.tsx` — line 463 — use the new keys

**Effort:** 30 minutes

#### Problem
The primary score state label rendered directly below the score number (the most prominent text after the number itself) is hardcoded English with no i18n.

```ts
// BEFORE (line 463 in today.tsx)
<Text style={styles.scoreHeroState}>
  {g.score >= SCORE_THRESHOLDS.HIGH ? "Good window"
    : g.score >= SCORE_THRESHOLDS.MID ? "Move steadily"
    : "Go gently"}
</Text>
```

These phrases carry specific meaning in Tamil astrological tradition:
- "Good window" → **நல்ல நேரம்** *(nalla neram)* — the exact term used in Tamil panchangam for an auspicious period
- "Move steadily" → **நிதானமாக செல்** *(nidhanamaga sel)* — measured forward movement, not halting
- "Go gently" → **கவனமாக நடக்கவும்** *(kavanama nadakkavum)* — proceed with care

#### Step 1 — Add to `packages/shared/src/i18n/strings.ts`

Locate the `today:` section (currently ends at `chandrashtamam` around line 60). Add three entries **inside** the `today` block before its closing `},`:

```ts
// ADD inside the today: { ... } block, after the existing entries
score_state_high: { ta: "நல்ல நேரம்",          en: "Good window"    },
score_state_mid:  { ta: "நிதானமாக செல்",        en: "Move steadily"  },
score_state_low:  { ta: "கவனமாக நடக்கவும்",     en: "Go gently"      },
```

#### Step 2 — Update `mobile/app/(tabs)/today.tsx` line 463

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

#### Acceptance criteria
- Tamil mode, score ≥ 65: displays "நல்ல நேரம்"
- Tamil mode, score 45–64: displays "நிதானமாக செல்"
- Tamil mode, score < 45: displays "கவனமாக நடக்கவும்"
- English mode: displays "Good window" / "Move steadily" / "Go gently" respectively
- TypeScript compiles without error (the new keys are in `as const` so the type is inferred automatically)

---

### QF-4 — Activity chip labels are hardcoded English regardless of language

**Files:**
1. `packages/shared/src/i18n/strings.ts` — add chip label keys
2. `mobile/app/(tabs)/today.tsx` — lines 302–312 — use keys

**Effort:** 45 minutes

#### Problem
The `activityChips` array (lines 297–314 in today.tsx) builds chip label strings directly in English. When `isTamil === true`, the chips still show: "Start work", "Shukra hora" (or whichever lord), "Travel", "Contracts", "Avoid rush".

These chips are the **most-interacted elements** on the Today screen after the score hero. They are small, take seconds to translate, and their absence in Tamil is a brand break.

Note about "hora": in Tamil astrological practice, the planetary hour is called **ஓரை** *(orai)*. Showing the Sanskrit/English word "hora" in Tamil mode misrepresents the tradition.

#### Step 1 — Add to `packages/shared/src/i18n/strings.ts`

Add a new `chips:` block **inside** the root `strings` object (after the `today:` block):

```ts
chips: {
  start_work:   { ta: "பணி தொடங்கு",       en: "Start work"    },
  hora_suffix:  { ta: "ஓரை",               en: "hora"          },
  travel:       { ta: "பயணம்",             en: "Travel"        },
  contracts:    { ta: "ஒப்பந்தம்",          en: "Contracts"     },
  avoid_rush:   { ta: "அவசரம் வேண்டாம்",   en: "Avoid rush"    },
},
```

#### Step 2 — Update `mobile/app/(tabs)/today.tsx` lines 300–312

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

#### Acceptance criteria
- Tamil mode: chips show "பணி தொடங்கு", "சுக்கிர ஓரை" (etc.), "பயணம்", "ஒப்பந்தம்", "அவசரம் வேண்டாம்"
- English mode: chips show "Start work", "Venus hora", "Travel", "Contracts", "Avoid rush"
- The `hora_suffix` approach preserves the lord name from the API (which is already transliterated and language-appropriate) and only translates the suffix word

---

### QF-5 — Web score hero uses raw magic numbers instead of SCORE_THRESHOLDS

**File:** `web/components/dashboard-personal-hero.tsx` — line 168  
**Effort:** 10 minutes

#### Problem
The web score pill background color is determined by raw literals `>= 65` and `>= 45`, bypassing the shared constant. This is the same class of bug that A1 fixed on mobile.

```ts
// BEFORE (line 168)
background: score !== null && score >= 65 ? "var(--chart-d9-active-bg)"
  : score !== null && score >= 45 ? "var(--chart-d1-lagna-bg)"
  : "var(--panel-warm-tint)",
```

#### Fix

Add the import at the top of `dashboard-personal-hero.tsx` (after existing imports):

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

#### Acceptance criteria
- TypeScript compiles
- Web score pill colour changes correctly at the same thresholds as mobile (65 = high, 45 = mid)
- If the thresholds change in the shared package, the web pill auto-updates

---

### QF-6 — Journal moment and area labels are hardcoded English

**File:** `mobile/app/(tabs)/today.tsx` — lines 78–93  
**Effort:** 30 minutes

#### Problem
Two constant arrays at the top of today.tsx define the journal quick-log chip labels. Both are hardcoded English and do not respect the language setting.

```ts
// BEFORE (lines 78–84)
const JOURNAL_MOMENTS = [
  { key: "win",       label: "Big win"      },
  { key: "hard_day",  label: "Hard day"     },
  { key: "decision",  label: "Decision"     },
  { key: "milestone", label: "Milestone"    },
  { key: "quiet",     label: "Nothing yet"  },
];
```

```ts
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

These are rendered as quick-log chips in the journal section of the Today tab.

#### Step 1 — Add to `packages/shared/src/i18n/strings.ts`

Add a `journal:` block inside the root `strings` object:

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

#### Step 2 — Change the constant arrays in `today.tsx` to be computed from i18n

Because `JOURNAL_MOMENTS` and `JOURNAL_AREAS` are module-level constants, they cannot use the `t()` hook directly. Move them inside the component or convert them to objects keyed by the `strings` keys. The simplest change: keep the arrays as-is for the `key` field but derive `label` using `t()` when building the render output.

The exact place where these arrays are consumed (search for `JOURNAL_MOMENTS.map` or `JOURNAL_AREAS.map` in today.tsx) should be updated so that the rendered label comes from `t(strings.journal[...])` rather than the static array's `label` field.

For example, if the render site looks like:
```ts
{JOURNAL_MOMENTS.map(m => (
  <TouchableOpacity key={m.key} ...>
    <Text>{m.label}</Text>
  </TouchableOpacity>
))}
```

Change it to:
```ts
{JOURNAL_MOMENTS.map(m => (
  <TouchableOpacity key={m.key} ...>
    <Text>{t(strings.journal[`moment_${m.key}` as keyof typeof strings.journal])}</Text>
  </TouchableOpacity>
))}
```

Apply the same pattern to `JOURNAL_AREAS` using `area_${m.key}`.

#### Acceptance criteria
- Tamil mode: journal moment chips show "வெற்றி", "கஷ்டமான நாள்", etc.
- Tamil mode: area chips show "தொழில்", "அன்பு", "உடல்நலம்", etc.
- English mode: all labels unchanged from current values

---

## Group 2 — Medium Items (half day to 1 day each)

---

### MED-1 — Create ThirukanithamBadge component for web and add to dashboard + panchangam

**Files to create:**
- `web/components/thirukanitham-badge.tsx` (new file)

**Files to modify:**
- `web/components/dashboard-personal-hero.tsx` — add badge near the score display
- `web/app/panchangam/[date]/page.tsx` — add badge in the hero section

**Effort:** 2–3 hours

#### Problem
The ThirukanithamBadge exists only on mobile (`mobile/src/components/ThirukanithamBadge.tsx`). On web, the Thirukanitham trust signal — the single most important brand differentiator — is only mentioned in paragraph text. No visual badge appears on the web dashboard or panchangam pages.

#### Step 1 — Create `web/components/thirukanitham-badge.tsx`

This is a direct translation of the mobile badge into React/HTML:

```tsx
// web/components/thirukanitham-badge.tsx
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

**Why `asLink` defaults to `true`:** The audit found that the badge should link to `/learn/what-is-thirukanitham`. On web this is straightforward with `next/link`. On mobile the link was noted as desirable but was deferred. The web version ships it by default.

#### Step 2 — Add badge to `web/components/dashboard-personal-hero.tsx`

Inside the `PersonalHero` component, locate the score card section (around line 157). Find the kicker line:

```tsx
// BEFORE (approximately line 157)
<p className="cd-kicker">{t("personal_today", lang)}</p>
```

Change to display the badge inline after the kicker text:

```tsx
// AFTER
<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-2)" }}>
  <p className="cd-kicker" style={{ margin: 0 }}>{t("personal_today", lang)}</p>
  <ThirukanithamBadge size="sm" />
</div>
```

Add the import at the top of `dashboard-personal-hero.tsx`:

```ts
import { ThirukanithamBadge } from "@/components/thirukanitham-badge";
```

#### Step 3 — Add badge to `web/app/panchangam/[date]/page.tsx`

Inside the page hero section (around line 147), after the lead text `"Thirukanitham-based · Sunrise-adjusted timings"`, add the badge:

```tsx
// BEFORE (approximately line 146–148)
<p className="cl-pub-lead" style={{ marginBottom: "20px" }}>
  Thirukanitham-based · Sunrise-adjusted timings
</p>
```

```tsx
// AFTER
<div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
  <p className="cl-pub-lead" style={{ margin: 0 }}>
    Thirukanitham-based · Sunrise-adjusted timings
  </p>
  <ThirukanithamBadge size="sm" />
</div>
```

Add the import at the top of `page.tsx`:

```ts
import { ThirukanithamBadge } from "@/components/thirukanitham-badge";
```

Note: `page.tsx` is a server component; `ThirukanithamBadge` must not use client-only APIs (`useState`, `useEffect`, etc.) — the implementation above does not, so it is safe to import in a server component.

#### Acceptance criteria
- Web dashboard score card: ThirukanithamBadge pill is visible above the score ring on first load without scrolling
- Web panchangam page: badge appears in the hero section, visible without scrolling
- Clicking / tapping the badge navigates to `/learn/what-is-thirukanitham`
- Badge renders Tamil script correctly with the Noto Sans Tamil font already loaded in `web/app/layout.tsx`
- Badge is present in both dark and light theme (uses CSS variables that respect the theme)

---

### MED-2 — Fix web panchangam page: Chennai banner should be conditional + stop hardcoding in SEO metadata

**File:** `web/app/panchangam/[date]/page.tsx`  
**Effort:** 3–4 hours

#### Problem — Part A: Chennai banner always visible (even when not needed)

Lines 150–162 in the page already show a "Showing panchangam for Chennai" banner. This is good, but it shows unconditionally — even if we later wire up location-based data. The banner should:
1. Always show currently (acceptable short-term).
2. Link to the city-aware tool, not just a generic settings link.

The current banner links to `/tools/daily-panchangam-planner`. Verify this route exists and is the correct destination. If it does, the existing link is acceptable.

**No code change needed for Part A right now** — the banner already exists and is acceptable as-is. Mark Part A done.

#### Problem — Part B: SEO metadata hardcodes Chennai for every page

Lines 41, 51, 57, 124–125 use `DEFAULT_CITY` in the page title, meta description, keywords, and JSON-LD. This means every panchangam URL's SEO entry says "Chennai panchangam", even if the URL is being accessed by a user in Singapore.

```ts
// BEFORE (line 41)
let description = `Tamil panchangam for ${dateLabel}, ${DEFAULT_CITY}. ...`;

// BEFORE (line 51)
description = `${vara} ${dateLabel}, ${DEFAULT_CITY}: Tithi ${tithi}, ...`;

// BEFORE (line 57)
keywords: ["Tamil panchangam", ..., DEFAULT_CITY.toLowerCase() + " panchangam"]

// BEFORE (line 124–125)
name: `Tamil Panchangam ${dateLabel} — ${DEFAULT_CITY}`,
description: `Daily Tamil panchangam for ${dateLabel}. ... for ${DEFAULT_CITY}.`,
```

#### Fix for Part B

Replace `DEFAULT_CITY` with a broader location term that is accurate for SEO without lying to search engines about the city:

```ts
// AFTER (line 41)
let description = `Tamil Panchangam for ${dateLabel}. Thirukanitham-based calculation. Set your city for local sunrise, Rahu Kalam, and Nalla Neram timings.`;

// AFTER (line 51)
description = `${vara} ${dateLabel}: Tithi ${tithi}, Nakshatra ${nakshatra}. Rahu Kalam ${rahuStart}–${rahuEnd}. Nalla Neram ${nallaNeram}. Thirukanitham-based panchangam (default city: Chennai). Set your city for local timings.`;

// AFTER (line 57)
keywords: ["Tamil panchangam", `panchangam ${date}`, "Rahu kalam today", "Nalla neram", "Tithi Nakshatra today", "Thirukanitham panchangam"]

// AFTER (line 123–125)
name: `Tamil Panchangam ${dateLabel} — Thirukanitham Calculation`,
description: `Daily Tamil panchangam for ${dateLabel}. Tithi, Nakshatra, Yoga, Karana, Rahu Kalam, Nalla Neram, and auspicious timings. Thirukanitham-based sidereal calculation.`,
```

#### Acceptance criteria
- SEO metadata for any panchangam date page does not mention Chennai in the title, primary description, or JSON-LD name
- Keywords no longer include "chennai panchangam"
- The existing city banner (lines 150–162) still shows and links to the city planner

---

## Group 3 — Larger Items (multi-day, plan before starting)

---

### LRG-1 — Mobile Nakshatra Detail Pages (B5)

**New files to create:**
- `mobile/app/(tabs)/tools/natchathiram/[slug].tsx`

**Existing files to modify:**
- `mobile/app/(tabs)/tools/natchathiram.tsx` — make each list item navigate to the detail screen

**Effort:** 3–4 days  
**Dependency:** The backend `/api/v1/content/nakshatra/{slug}` endpoint must exist and return the nakshatra data. Verify this first.

#### Problem
Web has 27 full nakshatra pages at `web/app/natchathiram/[slug]/`. Mobile has only a list screen (`natchathiram.tsx`). Tapping any nakshatra in the list currently navigates nowhere because the detail route `tools/natchathiram/[slug]` does not exist. This is a broken tap target.

Additionally, the educational nakshatra content — mythology, deity, ruling planet, personality traits, compatible nakshatras, daily guidance — is inaccessible to mobile users. These users would need to open a browser to get this content.

#### Step 1 — Verify the backend API

Check that `GET /api/v1/content/nakshatra/{slug}` exists in `app/api/content.py`. If it does not, check `app/services/nakshatra_content.py` and `app/services/nakshatra_content_static.py` to understand what data is available and create a thin API route.

#### Step 2 — Create `mobile/src/api/nakshatra.ts`

Create a typed API call:

```ts
// mobile/src/api/nakshatra.ts
import { apiClient } from "@vinaadi/shared/api/client";

export interface NakshatraDetail {
  slug: string;
  name: { ta: string; en: string };
  deity: { ta: string; en: string };
  planet: { ta: string; en: string };
  symbol: string;                          // e.g. "♊" or an image key
  traits: Array<{ ta: string; en: string }>;
  compatible: string[];                    // slugs of compatible nakshatras
  description: { ta: string; en: string };
  todayGuidance?: { ta: string; en: string } | null;
}

export async function getNakshatraDetail(slug: string): Promise<NakshatraDetail> {
  const res = await apiClient.get(`/api/v1/content/nakshatra/${slug}`);
  return res.data.data as NakshatraDetail;
}
```

#### Step 3 — Create `mobile/app/(tabs)/tools/natchathiram/[slug].tsx`

Create a detail screen with these sections in order:
1. **Header** — Nakshatra name in Tamil + English, ruling planet, deity
2. **Description** — Full paragraph in the active language (Tamil or English)
3. **Personality traits** — Horizontal chip list
4. **Compatible nakshatras** — Tappable chips that navigate to those detail screens
5. **"My Nakshatra" callout** — If the user's birth nakshatra matches this one, show a highlighted card: "இது உங்கள் நட்சத்திரம்" (This is your nakshatra)
6. **Today's guidance** — If `todayGuidance` is returned, show it in a card

Use the existing pattern from any other detail screen (e.g. `mobile/app/jadhagam/[id].tsx`) for layout, loading state (`SkeletonCard`), and error state (`ErrorCard`).

```tsx
// mobile/app/(tabs)/tools/natchathiram/[slug].tsx — skeleton structure
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getNakshatraDetail } from "@/api/nakshatra";
import { useI18n } from "@/hooks/useI18n";
import { useSession } from "@/hooks/useSession";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorCard } from "@/components/ErrorCard";
// ... rest of imports

export default function NakshatraDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, strings, lang } = useI18n();
  const { user } = useSession();
  const isTamil = lang === "ta";
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["nakshatra-detail", slug],
    queryFn: () => getNakshatraDetail(slug),
  });

  if (isLoading) return <SkeletonCard />;
  if (isError || !data) return <ErrorCard onRetry={() => {}} />;

  const isMyNakshatra = /* check user's birth nakshatra slug against data.slug */ false;
  const name = isTamil ? data.name.ta : data.name.en;
  const description = isTamil ? data.description.ta : data.description.en;

  return (
    // ... ScrollView with SafeAreaView
    // Section: name, deity, planet
    // Section: description
    // Section: traits as chips
    // Section: compatible nakshatras as chips (each navigates to their [slug])
    // Conditional: "My Nakshatra" callout
    // Conditional: today's guidance card
  );
}
```

#### Step 4 — Update `mobile/app/(tabs)/tools/natchathiram.tsx`

Make each nakshatra list item navigate to the detail screen. Find the map over nakshatras and add:

```tsx
// Change from (example):
<TouchableOpacity key={n.slug} onPress={() => { /* nothing */ }}>

// To:
<TouchableOpacity key={n.slug} onPress={() => router.push({ pathname: "/tools/natchathiram/[slug]", params: { slug: n.slug } })}>
```

#### Acceptance criteria
- Tapping any nakshatra in the list opens the detail screen without crashing
- Detail screen shows nakshatra name in Tamil when Tamil mode is active
- Detail screen shows name in English when English mode is active
- If user's birth nakshatra matches, the "இது உங்கள் நட்சத்திரம்" callout appears
- Tapping a compatible nakshatra chip navigates to that nakshatra's detail screen (recursive navigation)
- Back button returns to the list screen
- Loading and error states use the standard SkeletonCard / ErrorCard pattern

---

### LRG-2 — Web Today Consolidated View (B3)

**New component to create:**
- `web/components/dashboard-today-tab.tsx`

**Existing files to modify:**
- `web/components/dashboard-workspace.tsx` — make the Today tab the default active tab

**Effort:** 1 week  
**Context:** The mobile Today tab is the gold standard. This item recreates the same single-scroll experience on web.

#### Problem
On mobile, one scroll from top-to-bottom delivers: score ring → life area pulse → cosmic alert → best time window → activity chips → journal quick-log → rasi palan → upcoming events.

On web, these elements are fragmented across multiple dashboard tabs. A user checking web on a weekday morning must navigate 3–4 tabs to get the same picture mobile delivers in one scroll.

#### Sections to include (in scroll order)

| # | Section | Data source (web hook) |
|---|---------|----------------------|
| 1 | Score hero — ring + state label + ThirukanithamBadge | `usePersonalData()` → `todayGuidance.score` |
| 2 | Life area pulse — horizontal chip row | `usePersonalData()` → `lifeAreas` |
| 3 | Cosmic alert — Chandrashtama / Rahu kalam banner | `usePersonalData()` → `todayTransit` / panchangam |
| 4 | Best time window card | `usePersonalData()` → `todayGuidance.bestWindows[0]` |
| 5 | Journal quick-log | `usePersonalData()` → inline journal entry |
| 6 | Rasi palan card | `usePersonalData()` → `rasiPalan` |
| 7 | Upcoming events | `usePersonalData()` → `lifeEvents` |

#### Implementation approach

Create `web/components/dashboard-today-tab.tsx` as a new client component. It should:
1. Accept the same props that `dashboard-personal-tab.tsx` already receives (they share the same data shape).
2. Be the default tab rendered when `activeTab === "personal"` in `dashboard-workspace.tsx`.
3. Reuse existing sub-components where possible: `PersonalHero`, `DashboardDailySnapshot`, `DashboardLifeAreasTab` (import and render specific sections, not the full tab).

The web `PersonalHero` (`dashboard-personal-hero.tsx`) already has the score ring. Add the `ThirukanithamBadge` near the score pill (see MED-1 above — this fix is a prerequisite for this item).

#### Acceptance criteria
- Opening the web dashboard at any screen size shows the Today view by default without clicking any tab
- All 7 sections are present and visible in a single scroll on a 1440px desktop viewport
- On mobile-width web (< 768px), sections stack vertically and remain readable
- The ThirukanithamBadge is visible in the score hero without scrolling
- The page does not fetch data that wasn't already being fetched (no new API calls required)

---

## Group 4 — Validation / Testing Items

---

### VAL-1 — Thirukanitham Compliance Regression Checklist

After completing all items above, verify the following against the live app (both mobile and web):

| Check | Verify in |
|-------|-----------|
| Score hero shows "நல்ல நேரம்" in Tamil mode when score ≥ 65 | Mobile Today tab |
| Score hero shows "நிதானமாக செல்" in Tamil mode when score 45–64 | Mobile Today tab |
| Score hero shows "கவனமாக நடக்கவும்" in Tamil mode when score < 45 | Mobile Today tab |
| Activity chips show Tamil labels in Tamil mode | Mobile Today tab |
| "hora" shows as "ஓரை" in Tamil mode | Mobile Today tab |
| "இன்று" appears as the date kicker in Tamil mode | Mobile Today tab |
| "சிறந்த நேரம்" appears as the timing header in Tamil mode | Mobile Today tab |
| ThirukanithamBadge is visible on web dashboard without scrolling | Web dashboard |
| ThirukanithamBadge is visible on web panchangam page without scrolling | Web panchangam |
| ThirukanithamBadge links to `/learn/what-is-thirukanitham` | Both |
| Web panchangam SEO title does not say "Chennai" | View page source |
| Mobile nakshatra list items navigate to detail screens | Mobile Tools tab → Natchathiram |
| All 27 nakshatras have reachable detail screens | Mobile Tools tab → Natchathiram |
| Web score pill background changes colour at HIGH=65 and MID=45 | Web dashboard |

---

## Dependency Map

```
QF-3 (score state strings)
  └── requires: new keys in packages/shared/src/i18n/strings.ts
  └── before modifying: today.tsx line 463

QF-4 (chip labels)
  └── requires: new keys in packages/shared/src/i18n/strings.ts
  └── before modifying: today.tsx lines 300–312

QF-6 (journal labels)
  └── requires: new keys in packages/shared/src/i18n/strings.ts
  └── before modifying: today.tsx render site for JOURNAL_MOMENTS / JOURNAL_AREAS

MED-1 (web ThirukanithamBadge)
  └── creates: web/components/thirukanitham-badge.tsx
  └── then modifies: dashboard-personal-hero.tsx + panchangam page.tsx
  └── is a PREREQUISITE for: LRG-2 (web Today tab)

LRG-1 (mobile nakshatra detail)
  └── verify FIRST: backend /api/v1/content/nakshatra/{slug} exists
  └── then creates: mobile/src/api/nakshatra.ts
  └── then creates: mobile/app/(tabs)/tools/natchathiram/[slug].tsx
  └── then modifies: natchathiram.tsx list screen

QF-5 (web score thresholds)
  └── no prerequisites — standalone import change
```

---

## Files Modified Summary

| File | Items |
|------|-------|
| `packages/shared/src/i18n/strings.ts` | QF-3, QF-4, QF-6 |
| `mobile/app/(tabs)/today.tsx` | QF-1, QF-2, QF-3, QF-4, QF-6 |
| `web/components/dashboard-personal-hero.tsx` | QF-5, MED-1 |
| `web/components/thirukanitham-badge.tsx` *(new)* | MED-1 |
| `web/app/panchangam/[date]/page.tsx` | MED-1, MED-2 |
| `mobile/src/api/nakshatra.ts` *(new)* | LRG-1 |
| `mobile/app/(tabs)/tools/natchathiram/[slug].tsx` *(new)* | LRG-1 |
| `mobile/app/(tabs)/tools/natchathiram.tsx` | LRG-1 |
| `web/components/dashboard-today-tab.tsx` *(new)* | LRG-2 |
| `web/components/dashboard-workspace.tsx` | LRG-2 |

---

## Already Closed — Do Not Re-Implement

These were open in the previous audit. Code inspection on 28 June 2026 confirmed they are done. Do not touch them.

| Item | What was done | Verified at |
|------|--------------|-------------|
| A1 — Score thresholds in mobile today.tsx | `SCORE_THRESHOLDS` from shared package used at all 4 locations | today.tsx lines 56, 307, 463, 880 |
| A3 — ThirukanithamBadge above fold (mobile) | Badge now inside `scoreHeroTopRow` in score hero | today.tsx line 452 |
| B1 — Web Guest Mode | Homepage has `PublicNav + HomeContent + PublicFooter`, no login wall | web/app/page.tsx |
| B2 — Pricing Page | `web/app/pricing/page.tsx` exists with tier comparison | confirmed |
| B4 — Web Notification Inbox | `web/app/notifications/page.tsx` exists | confirmed |
| B7 — Tamil Font Abstraction | `TamilType, EnType, TamilFont, EnFont` imported from `@/theme/typography` in both today.tsx and me.tsx | today.tsx line 26, me.tsx line 13 |
