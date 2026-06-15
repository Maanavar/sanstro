# 07 — Design System (Mobile)

**Author hat:** UX/UI Architect
**Purpose:** Visual + interaction system. Tokens are the contract; build components from these.
**Bar:** Apple HIG + Material 3 quality; Tamil-first typography correctness.

---

## 1. Design principles
1. **Glanceable.** Daily info readable in 5–10s. Cards, not articles.
2. **Calm & reverent.** Warm, trustworthy, never fear-based or cluttered.
3. **Tamil-first.** Tamil is the primary script; layout must not break with longer Tamil strings.
4. **One primary action per screen.** Clear hierarchy.
5. **Ads are guests, content is host.** Ads never compete with core utility.

## 2. Color tokens (semantic — define light & dark)
Use a warm, auspicious palette (saffron/marigold + deep indigo night-sky), not garish.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `bg` | #FFFDF8 | #121016 | app background |
| `surface` | #FFFFFF | #1E1B24 | cards |
| `surface-alt` | #F6F1E7 | #272230 | sections |
| `primary` | #C8472B (kumkum/saffron-red) | #FF7A5C | primary actions |
| `accent` | #2E2A6B (indigo) | #8E8AE0 | links, highlights |
| `gold` | #C9A227 | #E6C760 | auspicious markers |
| `success/good` | #2E7D52 | #5FD39B | nalla neram, good slots |
| `warning/caution` | #B26A00 | #E2A33A | caution windows |
| `danger/inauspicious` | #B3261E | #F2655B | rahu kalam, doshams |
| `text` | #1B1620 | #F2ECF7 | primary text |
| `text-muted` | #6B6470 | #B0A8BC | secondary |
| `border` | #E7DECF | #34303D | dividers |

> Final hex values are a starting palette — tune in design QA. Keep the **semantic names**
> stable; screens reference tokens, never raw hex.

Contrast: all text ≥ WCAG AA (4.5:1 body, 3:1 large).

## 3. Typography (critical — bilingual)
- **Tamil font:** bundle **Noto Sans Tamil** (don't rely on system Android fonts). Load via
  `expo-font`. Verify clusters `ைி`, `ோ`, `ஸ்ரீ`, grantha on Android API 29/31/33.
- **Latin font:** system (SF / Roboto) or Inter for consistency.
- Tamil needs **larger line-height** than Latin (script height). Define separate line-height
  tokens per script.

| Style | Size / line-height | Weight | Use |
|-------|--------------------|--------|-----|
| display | 28 / 38 | 700 | screen titles |
| h1 | 22 / 32 | 700 | card titles |
| h2 | 18 / 28 | 600 | section heads |
| body | 16 / 26 (Tamil 16/28) | 400 | content |
| body-strong | 16 / 26 | 600 | emphasis |
| caption | 13 / 18 | 400 | meta, timings labels |
| numeric | tabular figures | 600 | times, scores |

Support OS **Dynamic Type** scaling; test layouts at largest accessibility size.

## 4. Spacing & layout
- 4-pt base scale: 4, 8, 12, 16, 20, 24, 32, 40.
- Screen padding: 16. Card padding: 16. Card radius: 16. Section gap: 16–20.
- Touch targets ≥ 44×44 (iOS) / 48dp (Android).

## 5. Core components (inventory)
- `Card`, `SectionCard` (collapsible), `Tag/Chip` (festival, paksha), `ScoreGauge`
  (porutham %), `TimingRow` (label + window + good/bad color), `KalamBar` (rahu/yama/kuligai),
  `RasiPicker` (grid), `PlaceCombobox`, `DayPagerHeader` (◀ date ▶), `Skeleton`,
  `EmptyState`, `ErrorState` (retry), `AdSlot` (native/banner wrapper), `RewardUnlockButton`,
  `UpgradeCard`, `ShareCard`, `PrimaryButton/SecondaryButton`, `BottomTabBar`.
- All components: light/dark, Tamil/English, loading/disabled states.

## 6. Iconography & imagery
- Line icons, 24dp grid; cultural icons (rasi symbols, planets) from existing
  `astro-symbols`/`icons` concepts re-drawn for RN.
- Devotional imagery: tasteful, optional, never heavy. Festival illustrations for strips.

## 7. Motion
- Subtle: 150–250ms ease. Pull-to-refresh native. Card expand/collapse animated.
- Haptics: light tap on day-swipe, success on unlock, selection on rasi pick.
- No gratuitous animation that delays content.

## 8. Ad styling rules (enforced by `AdSlot`)
- Native ads styled to match cards but **clearly labelled "Sponsored / விளம்பரம்"**.
- Never above the fold on Today timings/rasi palan; never in onboarding/auth/payment.
- One native per scroll view (≈ every 3–4 cards); one bottom banner max on tool results.
- Interstitial: only at natural breaks, ≤1/session, frequency-capped, real close button.

## 9. Accessibility checklist
- AA contrast · Dynamic Type · screen-reader labels (Tamil + English) · focus order ·
  no color-only meaning (pair icon/label with good/caution colors) · reduce-motion respected.

## 10. Dark mode
First-class (people check before dawn). All tokens have dark values; test night-sky readability.
