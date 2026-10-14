# Theme visibility audit — light and dark — 2026-09-28

Written for: the owner, and whoever next touches the Nova palette.

Scope: every colour the signed-in dashboard renders, in both themes, checked
against WCAG 2.2 AA. Also covers the uncommitted theme work already on
`harden/production-readiness`, because part of it was reasoned against a ground
that was not rendering.

---

## The short version

Five defects, all real, all shipping today or sitting uncommitted on this
branch. Four are fixed here; one is a design decision I have made a call on and
flagged for you to overrule.

| # | Defect | Themes | Severity | Status |
|---|---|---|---|---|
| 1 | Form controls have a 1.43:1 / 1.60:1 boundary — WCAG 1.4.11 wants 3:1 | both | **High** | Fixed |
| 2 | The Today hero never used the hero gradient it is styled by | both | **High** | Fixed |
| 3 | Twelve inks fail AA on light's `--color-surface-3`; 3 live call sites | light | Medium | Fixed |
| 4 | Verdict marks were emoji — ignored the palette, wrong colour in both themes | both | Medium | Fixed |
| 5 | Dosha badges carried `⚠` inside translated strings | both | Low | Fixed |

The decision I made for you to check is in **#1**, under "The call I made".

---

## 1 · Form controls are invisible boxes — WCAG 1.4.11

**What renders.** `.ui-input`, `.ui-select`, `.ui-textarea` and the resting
`.ui-toggle` track all paint `background: var(--color-surface)` and sit inside
Cards that paint the *same* `--color-surface`. The only thing separating the
control from its container was a 1px `--color-border-strong`:

| Theme | Border composites to | On the card fill | Ratio |
|---|---|---|---|
| Light | `#E9D49F` | `#FFFCF6` | **1.43** |
| Dark | `#343B56` | `#151827` | **1.60** |

WCAG 2.2 SC 1.4.11 requires 3:1 for "visual information required to identify
user interface components and states". A text field is the criterion's
canonical case — nothing *inside* it announces that it is editable, so its
boundary is its identification. A Nova text field was a surface-coloured box on
a surface-coloured card with an outline nobody could see.

The `.input`/`.select` legacy classes that the porutham and chart-generate
routes reuse were worse still, on `--color-border` at 1.41 / 1.37.

**Why nothing caught it.** `e2e/theme-contrast.spec.ts` is a good gate and it
was green on this — because axe implements **no check for 1.4.11 at all**. Its
`color-contrast` rule is 1.4.3, text only. This is not a gate that missed a
value; it is a criterion outside every gate the repo owned. It would have
stayed green forever.

**Fix.** A new `--color-border-control`, declared in both theme blocks:

| Theme | Value | surface | surface-soft | surface-2 | bg |
|---|---|---|---|---|---|
| Light | `#8C7C67` | 3.95 | 3.50 | 3.17 | 3.56 |
| Dark | `#636E8C` | 3.47 | 3.25 | 3.25 | 4.01 |

Each is the *quietest* step on the theme's existing hue that still clears 3:1
on every ground a control renders against — darkest-that-clears on dark,
lightest-that-clears on light — so the outline is as soft as the criterion
permits. Light is warm-neutral rather than gold on purpose: gold is the accent
and the focus ring, and a resting outline in that hue would make every idle
field look focused.

Applied to `.ui-input` / `.ui-select` / `.ui-textarea`, the `.ui-toggle` track,
`.ui-btn--secondary`, and the legacy `.input` / `.select` redirect.

### The call I made — please check it

`dashboard-nova.css` records a design rule two declarations above the new
token: *"designer intentionally avoids hard outlines; gold is reserved for
accent, not chrome."* A 3:1 control border is a deliberate departure from that.

I scoped it as narrowly as the criterion allows — **form controls only**. Cards,
panels, chips, dividers and every other decorative edge keep the hairline,
because a card is identified by its fill and its shadow and 1.4.11 does not
reach it.

There is a second valid way to satisfy the criterion: give inputs a **distinct
fill** instead of a visible edge, so the fill boundary does the identifying.
That preserves the soft-chrome language better and is what iOS does. It is a
larger change (every input on every surface needs a fill that clears 3:1
against all four grounds) and it changes the look of the forms more than the
border does. If you prefer it, `--color-border-control` is the thing to delete.

**What the toggle case actually looked like:** ON is a gold fill and reads at a
glance. OFF was a surface-coloured track on a surface-coloured card, so what
you saw was the dark knob floating free of any switch. The knob was never the
problem — the track's extent was.

---

## 2 · The Today hero was never styled by the hero gradient

**This one is the reason to read the rest carefully.**

`--nova-hero-gradient` is declared twice, once per theme, each with a long
rationale describing "the hero band". It was consumed by exactly one element —
a Plan-tab panel in `dashboard-plan-tab-nova.tsx` — and never by the hero it is
named for.

`.nova-hero`, the actual Today hero, carried its own local
`linear-gradient(135deg, var(--color-surface-soft), var(--color-surface-3))`,
which shadowed the token completely.

Three separate pieces of work were reasoned against a ground that was not
rendering. Two of them are uncommitted on this branch:

- The 2026-09-28 light retune — `#FDF8ED → #E8DCC6`, 2.6× the old travel, gold
  radial moved to 78% — measured ink by ink against stops the hero never showed.
- `RasiChakraBackdrop`'s opacity `0.1 → 0.18` in `celestial-ambient-nova.tsx`,
  justified in comment by *"the hero rework gives this corner real tonal
  depth"*. That element sits inside `.nova-hero` and was receiving none of it.
- The Chandrashtama pill's `-bg-solid` ground, whose comment names
  `--nova-hero-gradient` as what it floats over. The fix was right for its own
  reason — the pill floats over a gradient plus `HeroSkyBackdrop`'s radial
  either way — but its stated ground was wrong.

**Dark lost more than light.** Dark's token carries the signature plum aurora
(`rgba(101, 82, 216, 0.24)` at `14% 0%`). The hero was rendering a flat
`surface-soft → surface-3` ramp with none of it.

**Fix.** `.nova-hero` now uses `var(--nova-hero-gradient)`.

Contrast-checked before switching, both themes, against the real stops
including dark's aurora composited at peak alpha — because the aurora
*lightens* the ground and dark's inks are light, so the radial is where dark's
contrast is worst, not best. Every ink that lands directly on the band clears
AA: worst pair `--color-muted` at 4.77 on light's deep corner, and
`--color-accent-secondary` at 5.21 on dark's aurora.

**The lesson worth keeping:** a token's comment is not evidence that anything
consumes it. Three careful, well-measured changes were spent on a selector no
element matched, and every gate stayed green throughout because the hero's
*actual* colours were fine — just not the designed ones.

---

## 3 · `--color-surface-3` inverts meaning between themes

The token means opposite things in the two themes, and the ink contract never
named it as a ground.

- **Dark** `#0A0E20` — deeper than `--color-surface`, and dark's inks are
  light. It is dark's most *generous* ground. Every ink clears it easily.
- **Light** `#DDD6C8` — the deepest cream, and light's inks are dark. It is
  light's contrast **floor**. Twelve inks land between 4.20 and 4.49 on it, all
  just under AA.

Three components were rendering small text on it in light:

| Call site | Ink | Ratio |
|---|---|---|
| Porutham score disc — `/ 10 PORUTHAMS` | `--color-faint` at `--text-xs` | 4.47 |
| Porutham score disc — verdict tone | `--color-score-low` | 4.37 |
| Setup-tab premium nudge | `--color-muted` | 4.47 |
| `.nova-hero` (before #2) | `--color-muted` | 4.47 |

All are outside the browser gate by construction: the porutham panel is a
sub-tool (the gate sweeps top-level tab panes plus the day drawer), and the
premium nudge is behind `!OPEN_BETA`.

**Fix.** The ground moved, not the token — lifting `--color-surface-3` far
enough to clear AA collapses it into `--color-surface-2` (1.05 apart), and the
two are used as the ends of the same gradients.

- Porutham disc → `--color-surface`. This is also the better donut: a gauge
  reads as a *ring* when its centre matches the card, and as a disc-on-a-disc
  when it does not.
- Setup nudge gradient → starts at `--color-surface-soft`.
- `.nova-hero` → fixed by #2.

**Left standing, deliberately:** light's `--color-surface-3` is a decorative
deep ground, not a text ground. The new gate reports those twelve pairs as
*advisory* rather than failing, because nothing renders them any more and a
gate that stays red on arithmetic is a gate people stop reading. If you are
about to put small text on it, those rows are the reason not to — they are not
a licence to add one.

---

## 4 · The verdict marks were emoji

Ask Vinaadi's four verdict states used text glyphs: `✓` `⏳` `≈` `⚠`, rendered
in an 18px span.

Two bugs, both visible in both themes:

1. **The span set no `color`.** The mark inherited the card's body ink instead
   of the verdict tone sitting next to it. Green "Go" arrived with a brown tick.
2. **`⏳` is `Extended_Pictographic`.** Windows and Apple both paint it as a
   full-**colour** emoji. It ignored `color` by design, dropped a saturated
   blue-and-white hourglass into a palette with no blue in it, and did that
   identically in both themes — the one mark on the page no theme could touch.

**Fix.** Lucide icons (`Check`, `Hourglass`, `Scale`, `AlertTriangle`) in the
`.nova-icon-disc` the branch already introduced. Lucide strokes inherit
`currentColor`, so the mark now carries the verdict's tone, and the disc fixes
the optical footprint across four glyphs of very different drawn area.

`Scale` replaces `≈` for MIXED: a two-pan balance says "weighed, came out
even", where the approximately-equal sign says "roughly", which is not the
verdict.

---

## 5 · `⚠` inside translated strings

Five dosha badges in `compatibility-intelligence-panel.tsx` carried `"⚠ "` as a
prefix *inside* the translated literal — duplicated across six strings, able to
drift out of one silently, and announced by screen readers as "warning sign
Rajju Dosha" on a badge whose colour and wording already carry the warning.

Replaced with a `warn` prop on `Badge` that draws an `aria-hidden`
`AlertTriangle`.

---

## What I tested, and what the tests cannot see

### Ran

- **`e2e/theme-contrast.spec.ts`** — the live browser gate, both themes, real
  composited pixels via axe. **All 4 tests pass against these changes**
  (`PLAYWRIGHT_EXIT=0`, 15.6m): light sweep, dark sweep, and the day drawer in
  both themes.

  The day-drawer light case failed its first attempt and passed on retry, so it
  is recorded as flaky rather than green — and the cause is worth writing down
  because it looks alarming and is not. It hung on
  `page.locator('button[aria-current="date"]').first().click()`, burned the
  full 540s `test.slow()` timeout, and then reported
  `Target page, context or browser has been closed` — an error naming the
  teardown, not the missing element. The retry ran the identical test in
  **21.0s**. A 25× gap is a cold `next dev` route compile on the isolated e2e
  stack; nothing on that path changed here, and the edits that touch it are
  CSS token values, which cannot hang a click.

  Fixed rather than left as folklore: the spec now waits for the month grid
  explicitly with a 60s bound before clicking it, so a cold compile costs a
  bounded wait and a self-naming error instead of nine minutes of silence.
  (CLAUDE.md, P0-5: bound every unbounded wait; make the failure legible before
  theorising.)
- **`web/app/dashboard/theme-control-contrast.test.ts`** — new, 17 assertions,
  runs in `npm test` (i.e. in CI, which `node scripts/…` is not).
- **`scripts/theme-contrast-matrix.mjs`** — new, 240 pairs per theme.
  `npm run test:contrast`. 0 required failures in both themes.
- **Full web unit suite** — 1219 tests, 119 files, all passing.
- `tsc --noEmit` and `eslint` clean on every file touched.

### Both new gates were run with the fix removed, and both went red

Per the repo's own rule that a gate must be shown able to fail. With
`--color-border-control` reverted to its old value the script reported 8 failing
pairs and the unit test failed 5 assertions. Neither is a check that passes
regardless of input.

### What these gates still cannot see

Recorded so the green ticks are not inherited as "the themes are clean":

- **The static matrix resolves the stylesheet, not the app.** It does not know
  whether a pair renders. A flagged pair with no call site is arithmetic.
- **No font size or weight.** AA's 3:1 large-text allowance is never granted
  anywhere in it; everything is measured against 4.5.
- **Component-applied opacity** (`style={{opacity:.6}}`), in-flight animation
  alphas, images, SVG fills, canvas. The browser gate owns those.
- **The browser gate's route set** is top-level tab panes plus the day drawer,
  in English, at 1280×900. Sub-tools, overlays, error states, empty states and
  every other viewport are outside it. That is how #3 survived.
- **Disabled controls** are exempt from 1.4.3 and axe skips them. Nova disables
  at `opacity: 0.55`, which is permitted but not measured by anything.

### One blind spot I was able to close rather than just declare

CLAUDE.md warns that Tamil checks are not optional for this class of defect,
and the browser gate pins its account to `lang: "en"`.

For **contrast specifically**, that blind spot does not exist: the only
`[data-ui="nova"] .cd-shell[data-lang="ta"]` block in the stylesheet sets
`--tracking-caps` and `--tracking-tag` — letter-spacing, no colour. The palette
is language-invariant, so an English pass *is* a Tamil pass here.

This does **not** extend to layout, overflow or line-breaking, where Tamil sets
the same content on more lines at every width and remains genuinely unchecked.

---

## Not fixed — reported only

- **Dead `emoji:` field.** `NOVA_LEGEND` in `dashboard-calendar-monthly-nova.tsx`
  declares an `emoji` per row (`🌟 🌕 🌑 🐘 🦚 🪷 🪔 🎉 🚫`). Nothing renders it —
  the legend draws a 9px colour swatch and a label. Nine dead strings. Left in
  place because deletion is a separate call.
- **Decorative edges below 3:1.** Card hairlines (1.37–1.43) and status-chip
  edges (1.44–1.98) in both themes. Not a violation — a card is identified by
  its fill and shadow, a chip by its label, and both of those clear AA. Listed
  as advisory in the new gate so the judgement is auditable rather than implied
  by silence.
- **Astrology glyphs** (`♈ ☉ ☽ ♄`) are domain typography, not emoji-as-icons.
  Correctly left alone.

---

## Files changed

| File | Change |
|---|---|
| `web/app/dashboard/dashboard-nova.css` | `--color-border-control` ×2 themes; applied to 5 control rules; `.nova-hero` → `var(--nova-hero-gradient)` |
| `web/components/dashboard-ask-vinaadi.tsx` | Verdict + caveat marks → lucide |
| `web/components/compatibility-intelligence-panel.tsx` | `Badge warn` prop; 5 `⚠` glyphs removed |
| `web/components/dashboard-tools-porutham-nova.tsx` | Score disc ground → `--color-surface` |
| `web/components/dashboard-setup-tab.tsx` | Premium nudge gradient start → `--color-surface-soft` |
| `web/scripts/lib/theme-tokens.mjs` *(new)* | Cascade resolver — tokens.css → globals → nova → theme block |
| `web/scripts/lib/theme-tokens.d.mts` *(new)* | Hand-written types, unverified against the impl |
| `web/scripts/theme-contrast-matrix.mjs` *(new)* | 240-pair static matrix, both themes |
| `web/app/dashboard/theme-control-contrast.test.ts` *(new)* | CI ratchet, 17 assertions |
| `web/package.json` | `test:contrast` script |
