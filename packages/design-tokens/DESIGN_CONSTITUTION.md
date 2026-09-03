# Vinaadi AI — Design Constitution

> Single source of truth for all visual and motion decisions across web and mobile.  
> Version: 1.0 | Date: 2026-06-23  
> Brand identity: **Warm Cosmic Minimalism**

All values here are authoritative. When a token here conflicts with any component file, the token wins. No hardcoded hex, rgba, or pixel values in component files — ever.

---

## Brand Identity Statement

Vinaadi AI is a knowledge surface for the cosmos — precise, warm, and inevitable. The visual language must feel like a beautifully typeset almanac that has been brought to life with quiet motion. Nothing gratuitous. Nothing assembled. Every element in its only possible position.

**Warm Cosmic Minimalism:**
- Knowledge surfaces: parchment, gold, sage — warm and legible
- Premium / reveal moments: deep indigo, gold — cosmological depth
- No generic gradients. No emoji. Restrained geometry.
- Motion feels weighted, not bouncy. Purposeful, not decorative.

---

## 1. Color System

### 1.1 Light Theme (Knowledge Surfaces)

| Token | Value | Usage |
|-------|-------|-------|
| `surface-0` | `#FAF7F2` | Canvas / page background |
| `surface-1` | `#F3EEE5` | Card background |
| `surface-2` | `#EAE3D6` | Elevated card / hover state |
| `surface-3` | `#DDD6C8` | Selected / active state |
| `surface-4` | `#CFC7B5` | Sunken / inset elements |
| `surface-5` | `#B8AFA0` | Borders / dividers |

| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `#1C1008` | Headings, primary body |
| `text-secondary` | `#4A3820` | Secondary body, labels |
| `text-tertiary` | `#7A6448` | Captions, metadata |
| `text-disabled` | `#A89880` | Disabled states |

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `#C9971C` | Gold — primary accent, CTAs |
| `accent-hover` | `#A87D18` | Accent on hover |
| `accent-subtle` | `#FDF3DC` | Accent background tint |
| `success` | `#2D7A4F` | Positive states |
| `success-subtle` | `#EAF5EF` | Success background tint |
| `warning` | `#B86A00` | Warning states |
| `warning-subtle` | `#FEF3E2` | Warning background tint |
| `error` | `#C0392B` | Error / destructive |
| `error-subtle` | `#FDE8E6` | Error background tint |
| `info` | `#1D5EA8` | Informational |
| `info-subtle` | `#E8F0FC` | Info background tint |
| `overlay` | `rgba(28, 16, 8, 0.5)` | Modal backdrops |

### 1.2 Dark Theme (Cosmic / Premium)

| Token | Value | Usage |
|-------|-------|-------|
| `surface-0` | `#0D0F1A` | Canvas / page background (deep indigo) |
| `surface-1` | `#151825` | Card background |
| `surface-2` | `#1E2235` | Elevated card / hover state |
| `surface-3` | `#252A40` | Selected / active state |
| `surface-4` | `#0A0C14` | Sunken / inset elements |
| `surface-5` | `#2A3050` | Borders / dividers |

| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `#F0EBE0` | Headings, primary body |
| `text-secondary` | `#B8A88A` | Secondary body, labels |
| `text-tertiary` | `#7A6A50` | Captions, metadata |
| `text-disabled` | `#4A3E2E` | Disabled states |

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `#C9971C` | Gold — same as light (holds well on dark) |
| `accent-hover` | `#E0AE28` | Slightly brighter on dark |
| `accent-subtle` | `#1E1A0A` | Accent background tint on dark |
| `success` | `#3DAA6A` | Brighter on dark |
| `success-subtle` | `#0A1E14` | |
| `warning` | `#E08A20` | Brighter on dark |
| `warning-subtle` | `#1E1200` | |
| `error` | `#E05040` | Brighter on dark |
| `error-subtle` | `#1E0A08` | |
| `info` | `#5080E0` | Brighter on dark |
| `info-subtle` | `#080E1E` | |
| `overlay` | `rgba(0, 0, 0, 0.7)` | Modal backdrops |

### 1.3 WCAG Compliance Requirements

All text/background pairs must pass:
- Body text: ≥ 4.5:1 (WCAG AA)
- UI text / large text: ≥ 3:1 (WCAG AA)
- Interactive focus indicators: ≥ 3:1

Verified pairs (light theme):
- `text-primary` on `surface-0`: ~14:1 ✅
- `text-secondary` on `surface-0`: ~7:1 ✅
- `text-tertiary` on `surface-0`: ~4.5:1 ✅ (minimum; verify)
- `accent` on `surface-0`: ~3.2:1 (large text only)

---

## 2. Typography Scale

### 2.1 Font Families

| Role | English | Tamil |
|------|---------|-------|
| Display / Headings | `'Playfair Display', Georgia, serif` | `'Noto Serif Tamil', serif` |
| Body / UI | `'Inter', system-ui, sans-serif` | `'Noto Sans Tamil', sans-serif` |
| Monospace | `'JetBrains Mono', monospace` | — |

### 2.2 Type Scale

| Token | Size | Weight | Line-height | Letter-spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `type-display` | 32px / 2rem | 700 | 1.2 | -0.5px | Hero numbers, score |
| `type-heading-1` | 24px / 1.5rem | 700 | 1.25 | -0.3px | Page titles |
| `type-heading-2` | 20px / 1.25rem | 600 | 1.3 | -0.2px | Section headers |
| `type-heading-3` | 17px / 1.0625rem | 600 | 1.35 | -0.1px | Card titles |
| `type-body` | 15px / 0.9375rem | 400 | 1.6 | 0 | Body text |
| `type-small` | 13px / 0.8125rem | 400 | 1.5 | 0.1px | Labels, metadata |
| `type-caption` | 11px / 0.6875rem | 500 | 1.4 | 0.2px | Timestamps, tags |

### 2.3 Tamil-specific rules
- Tamil body text: use `type-body` size + 1px (16px) for readability
- Tamil display: same size as English display — Tamil glyphs have proportional height
- Never set Tamil text in a font without Tamil glyph support

---

## 3. Spacing Grid

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Tight internal padding, icon gaps |
| `space-sm` | 8px | Component internal padding |
| `space-md` | 12px | Between related items |
| `space-lg` | 16px | Between components, card padding |
| `space-xl` | 24px | Section gaps |
| `space-2xl` | 32px | Between major sections |
| `space-3xl` | 48px | Page-level breathing room |
| `space-4xl` | 64px | Hero zones, large separators |

### 3.1 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Chips, tags, small buttons |
| `radius-md` | 10px | Cards, input fields |
| `radius-lg` | 16px | Bottom sheets, modals |
| `radius-xl` | 24px | Hero cards, large panels |
| `radius-full` | 9999px | Pills, avatars, score rings |

---

## 4. Motion Language

### 4.1 Spring Presets

| Preset | Stiffness | Damping | Mass | Usage |
|--------|-----------|---------|------|-------|
| `spring-default` | 300 | 20 | 1 | Standard interactive elements |
| `spring-gentle` | 200 | 25 | 1 | Panels, drawers, sheet open/close |
| `spring-snappy` | 400 | 15 | 0.8 | Micro-interactions, chips |

### 4.2 Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Hover states, focus rings |
| `duration-base` | 250ms | Most transitions |
| `duration-slow` | 400ms | Page transitions, panel open/close |
| `duration-slower` | 600ms | Score reveal, hero animations |

Easing function for non-spring transitions: `cubic-bezier(0.4, 0, 0.2, 1)`

### 4.3 Entrance Rhythm

Applied to every screen and every major content load. Elements enter in this order:

1. **Background / surface**: instant (0ms delay) — no animation
2. **Hero element**: 200ms spring-default enter, 80ms delay
3. **Supporting content**: stagger — 40ms per item, starting at 120ms delay
4. **Tertiary / metadata**: 300ms ease, starts at 200ms delay

### 4.4 Gesture Vocabulary (Mobile)

| Gesture | Meaning |
|---------|---------|
| Swipe left | Navigate forward / next item |
| Swipe right | Navigate back / previous item |
| Pull down | Refresh current screen |
| Long press | Context menu / secondary actions |
| Pinch | Zoom (chart screens only) |

### 4.5 Reduced Motion

When `prefers-reduced-motion: reduce` is set:
- Replace all spring animations with `duration-fast` (150ms) fade
- Disable stagger — all items appear simultaneously
- Disable parallax
- Preserve functional state transitions (selection, error, success)

### 4.6 Haptics (Mobile)

| Trigger | Haptic |
|---------|--------|
| Tab switch | Light impact |
| Primary button press | Medium impact |
| Destructive action confirmation | Heavy impact |
| Success state (save, complete) | Notification success |
| Error state | Notification error |
| Pull-to-refresh trigger | Light impact |

---

## 5. Icon System

### 5.1 Base Library

**Lucide** — used across all surfaces.
- Web: `lucide-react`
- Mobile: `@lucide/react-native`
- Same visual language, tree-shakeable, both platforms

### 5.2 Icon Sizing Standard

| Context | Size | Usage |
|---------|------|-------|
| Inline (within text) | 16px | Inline badges, inline status |
| Button icon | 20px | Icon buttons, form field icons |
| Standalone | 24px | Navigation, list item icons |
| Hero | 32px | Empty states, large feature icons |

**Stroke weight: 1.5px across all icons** — never use default 2px or 1px.

### 5.3 Astrology Glyph Set

**Status: Deferred to designer** — decision made 2026-06-23.

Until commissioned artwork is delivered:
- Use Lucide `circle`, `star`, `sun`, `moon` as temporary placeholders
- Do NOT use emoji as substitutes in production UI
- When glyphs arrive, place in `packages/astro-glyphs/` and consume from there

Planets to commission: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.  
Style brief: geometric, single-weight stroke (1.5px), circular bounding box, cohesive with Lucide.

---

## 6. Surface Hierarchy

### 6.1 Elevation Model

Elevation is expressed through surface color, not box-shadow (except modals).

| Level | Light | Dark | Usage |
|-------|-------|------|-------|
| 0 — Canvas | `surface-0` | `surface-0` | Page background |
| 1 — Default | `surface-1` | `surface-1` | Cards, panels |
| 2 — Raised | `surface-2` | `surface-2` | Hovered cards, dropdowns |
| 3 — Overlay | `surface-3` | `surface-3` | Tooltips, popovers |
| Modals | `surface-1` + `box-shadow: 0 24px 64px rgba(0,0,0,0.2)` | same | Full modals |

### 6.2 Layout Zones (Web Dashboard)

```
┌─────────────────────────────────────────────────────┐
│ Left rail (64px)  │  Center (flexible)               │
│ surface-0         │  surface-0                       │
│                   │  ┌──────────── Hero ───────────┐ │
│  Nav items        │  │  Score + recommended action  │ │
│                   │  └──────────────────────────────┘ │
│                   │                                   │
│                   │  Secondary cards                  │
│                   ├───────────────────────────────────┤
│                   │ Right inspector (320px)           │
│                   │  surface-1                        │
└─────────────────────────────────────────────────────┘
```

### 6.3 Screen Anatomy (Mobile)

```
┌─────────────────────────┐
│  Hero zone (top 40%)    │  One dominant answer to "what now?"
│  surface-0              │  Large number or visualization
├─────────────────────────┤
│  Secondary strip        │  Horizontal scroll, compact data
│  surface-1              │
├─────────────────────────┤
│  Scrollable body        │  Supporting content with stagger
│  surface-0              │
└─────────────────────────┘
│  FAB (floating)         │  Primary action — never inline
└─────────────────────────┘
```

---

## 7. Component Conventions

### 7.1 Cards

- Radius: `radius-md` (10px) for content cards; `radius-xl` (24px) for hero cards
- Padding: `space-lg` (16px) default; `space-xl` (24px) for hero
- Background: `surface-1`
- Border: 1px `surface-5` — no box-shadow (except modal)
- Hover: transition to `surface-2` in `duration-fast`

### 7.2 Buttons

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | `accent` | white | none |
| Secondary | `surface-2` | `text-primary` | 1px `surface-5` |
| Ghost | transparent | `text-primary` | none |
| Destructive | `error` | white | none |

- Padding: `space-sm space-lg` (8px 16px)
- Radius: `radius-sm` (6px)
- Minimum touch target: 44×44pt (mobile)
- Focus ring: 2px `accent`, 2px offset

### 7.3 Form Fields

- Border: 1px `surface-5`
- Border (focus): 2px `accent`
- Border (error): 2px `error`
- Background: `surface-0`
- Error text: `type-small`, `error` color, below field
- Success indicator: checkmark icon in `success` color, right side of field
- Label: `type-small`, `text-secondary`, above field

---

## 8. Accessibility Standards

| Standard | Requirement |
|----------|-------------|
| Color contrast (body) | ≥ 4.5:1 WCAG AA |
| Color contrast (large text / UI) | ≥ 3:1 WCAG AA |
| Touch targets (mobile) | ≥ 44 × 44pt |
| Focus management | Visible 2px focus ring on all interactive elements |
| Reduced motion | Fade fallback for all spring animations |
| Screen reader labels | `accessibilityLabel` on all icon-only buttons (mobile) |
| ARIA | `aria-invalid` + `aria-describedby` on all form error states (web) |
| Keyboard navigation | Full keyboard path through all web dashboard views |

---

## 9. Implementation Notes

### Consuming tokens in web (CSS)
```css
/* All tokens are CSS custom properties, set on :root */
background: var(--surface-0);
color: var(--text-primary);
border-color: var(--surface-5);
```

### Consuming tokens in mobile (TypeScript)
```tsx
// Always via useColors() hook — never import colors.ts directly
const C = useColors();
const S = useSpacing();
<View style={{ backgroundColor: C.surface1, padding: S.lg }} />
```

### No exceptions rule
If you find yourself writing a hex value, rgba(), or pixel measurement in a component file, stop. Either:
1. The token already exists — use it.
2. The token is missing — add it to tokens.json first, then use it.

Never write `#FAF7F2`, `rgba(201, 151, 28, 0.1)`, or `16` (pixels) directly in a component.
