# Dashboard Color Audit — Vinaadi Nova (Light + Dark)

**Second pass, 2026-08-21.** Supersedes the first pass earlier today, which was
a literal-hex sweep. This one traces the token cascade end to end and measures
every foreground/background pair with real WCAG math instead of trusting the
comments in the stylesheet. Three of the findings below could not have been
found by grepping, and one of them reverses a core assumption the stylesheet is
built on.

**Method.** Resolved the full token chain — `packages/design-tokens/dist/web/
tokens.css` → `globals.css` `:root` aliases → `dashboard.css` `.cd-shell` →
`dashboard-nova.css`'s two theme blocks → component call sites — then computed
contrast for every ink×surface pair each theme actually produces, including
`color-mix()` and alpha compositing. Script in scratchpad; numbers below are
its output, not estimates.

## Verdict

The architecture is good. The **dark** theme is genuinely excellent: every
small-text pair I measured clears AA, most clear AAA, and the one documented
exception (`--color-alert-critical` as a fill vs. as text) was already
correctly split into two tokens. That is better than most shipped products.

The **light** theme is not at that standard, and — this is the finding that
matters — **light is not the opt-in minority path the stylesheet believes it
is. It is the default for every user whose OS is set to light.** Which means
the light-mode defects below are default-path defects, not edge cases.

So: not a "cheap outdated local app." But not yet world-class either, and the
gap is concentrated in one theme that more users see than the code assumes.

---

## F1 — Light mode is the default for OS-light users, while the code and the UI both claim otherwise · **High**

Three places describe the System theme. They do not agree.

**What actually runs** — [layout.tsx:192](web/app/layout.tsx#L192), the
pre-paint script:

```js
var t = localStorage.getItem("vinaadi-theme");
var r = (t==="light"||t==="dark") ? t
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
document.documentElement.setAttribute("data-theme", r);
```

[useTheme.ts:19-21](web/hooks/useTheme.ts#L19-L21) matches it and is explicit
that this was a deliberate change: *"UXD-03 — `system` now follows the OS
preference instead of always being dark."* Default state is `"system"`
([useTheme.ts:33](web/hooks/useTheme.ts#L33)), and it live-tracks OS changes.

**What the stylesheet believes** —
[dashboard-nova.css:126-131](web/app/dashboard/dashboard-nova.css#L126-L131):

> *"Nova's System mode intentionally stays dark rather than following the OS
> preference … and avoids depending on every Nova-exclusive token below having
> a correct light-on-system-preference variant that nothing has verified yet.
> A user who wants light explicitly picks Light."*

**What we tell the user** —
[dashboard-settings-session-tab.tsx:693](web/components/dashboard-settings-session-tab.tsx#L693),
shipped in English *and* Tamil:

> *"'System' keeps the Nova Galaxy (dark) look; pick Warm for the parchment theme."*

That sentence is false. A user on an OS-light machine who selects System — or
who never opens Settings at all, since System is the default — gets the
parchment theme, which is precisely what the copy promises will not happen.

Two consequences:

1. **A user-facing incorrect statement in two languages.** Whichever behavior
   you want, the copy and the CSS comment both need to change, or UXD-03 needs
   reverting.
2. **It voids the safety argument the light palette was built on.** The CSS
   comment justifies leaving light less-verified on the grounds that only a
   deliberate opt-in reaches it. It isn't — so F2–F4 below land on the default
   experience for a large share of users.

I'd treat this as the root finding. It reclassifies everything under it.

*(Checked and cleared: because that script always stamps an explicit
`data-theme`, the base tokens and the Nova block can never disagree. I
suspected a bleed where `@media (prefers-color-scheme: light)` in `tokens.css`
would flip `--surface-*` light while the Nova shell stayed dark — which would
have put cream skeleton cards on the navy dashboard, since
[skeleton.css](web/components/skeleton/skeleton.css) reads `var(--surface-1)`
/`--surface-5` directly. It cannot happen. Not a bug.)*

## F2 — `--color-mid` fails AA as small text on every light surface · **High**

Measured, light theme:

| `--color-mid` `#B86A00` on | ratio | |
| --- | ---: | --- |
| `--color-bg` `#FAF7F2` | **3.85** | FAIL |
| `--color-surface` `#ffffff` | **4.12** | FAIL |
| `--color-surface-soft` `#EAE3D6` | **3.23** | FAIL |

Small text needs 4.5:1. It fails on all three, worst on the surface it is most
often paired with.

**Blast radius: 48 sites** use `--color-mid` as a text color; **18** are
explicitly at `--text-xs` (11px) or `--text-sm` (12px). Bold does not help —
WCAG's large-text exemption starts at 18.66px bold. Affected surfaces include
the Muhurta caution notices, Chandrashtama warnings on Today, What-If caution
and remedy labels, Yogas/Doshams strength chips, Life Areas remedies, the
Synastry weight badges, and the Vargas panel.

**Root cause.** [dashboard-nova.css:592-596](web/app/dashboard/dashboard-nova.css#L592-L596)
says the light score palette was sourced from the design system's own
`--warning` *"rather than invented hex, so these track the same green/amber/red
already proven to read correctly on Classic's light surfaces."* The sourcing
was correct; the "already proven" was not — `--warning: #B86A00`
([tokens.css:79](packages/design-tokens/dist/web/tokens.css#L79)) is 3.85:1 on
cream and was evidently never measured. The defect is inherited faithfully from
the base token.

**Fix — the pattern already exists in this file.** `--color-mid` plays both a
fill role (score bands, chips, borders, the mid ring segment, all of which only
need 3:1) and a text role. That is the identical situation that produced
`--color-text-accent` and `--color-alert-critical-text`. Add a third sibling and
repoint the 48 text sites:

```css
/* light */ --color-mid-text: #8A5000;  /* bg 6.09 · #fff 6.51 · surface-soft 5.10 */
/* dark  */ --color-mid-text: var(--color-mid);  /* #e39a3e already 7.03–8.67 AAA */
```

`#8A5000` clears AA on every light surface including the worst one, and stays in
the same amber family. Leave `--color-mid` itself alone so fills don't shift.

## F3 — Every semantic ink fails AA on `--color-surface-soft` in light · **High**

Not just mid. On light's `--color-surface-soft` `#EAE3D6`:

| ink | ratio | |
| --- | ---: | --- |
| `--color-muted` / `--color-faint` `#7A6448` | 4.40 | FAIL |
| `--color-text-accent` `#8A6410` | 4.21 | FAIL |
| `--color-high` `#2D7A4F` | 4.11 | FAIL |
| `--color-low` `#C0392B` | 4.26 | FAIL |
| `--color-neutral` `#3C6E8F` | 4.31 | FAIL |
| `--deepdive-info` `#3A6EA5` | 4.16 | FAIL |
| `--color-score-weak` `#B3402C` | 4.46 | FAIL |
| `--color-mid` `#B86A00` | 3.23 | FAIL |

Every one of these clears AA on `--color-bg` and on `--color-surface`. The
palette was tuned against those two and the third surface was never checked —
so eight tokens sit in a 4.1–4.5 band that looks fine in isolation and fails
everywhere it's actually used. `--color-surface-soft` is the background of the
Muhurta notice boxes, the ribbon track, and most raised panels.

**Root cause — an inverted elevation step.**
[dashboard-nova.css:535](web/app/dashboard/dashboard-nova.css#L535) maps light's
`--color-surface-soft` to `--surface-2` `#EAE3D6`, with the comment *"dark's
surface-soft mirrors surface-2 too."* But the two themes move in opposite
directions:

- **dark:** bg `#04050E` → surface `#151827` → surface-soft `#1A1E31` — each step *lighter*, i.e. further from the page. Elevation raises contrast against the ground.
- **light:** bg `#FAF7F2` → surface `#ffffff` (lighter ✓) → surface-soft `#EAE3D6` — *darker than the page background itself*, and two full steps down the ramp, skipping `--surface-1` `#F3EEE5` entirely.

Mirroring the *index* (`surface-2`) instead of the *relationship* (one step of
elevation) is what collapses the headroom.

**Fix:** map light `--color-surface-soft` to `--surface-1` `#F3EEE5`. That single
change fixes **7 of the 8** rows above:

| ink | on `#EAE3D6` | on `#F3EEE5` |
| --- | ---: | ---: |
| muted/faint | 4.40 FAIL | **4.85 AA** |
| text-accent | 4.21 FAIL | **4.65 AA** |
| high | 4.11 FAIL | **4.53 AA** |
| low | 4.26 FAIL | **4.71 AA** |
| neutral | 4.31 FAIL | **4.76 AA** |
| info | 4.16 FAIL | **4.60 AA** |
| score-weak | 4.46 FAIL | **4.93 AA** |
| mid | 3.23 FAIL | 3.56 FAIL |

`--color-mid` is the one that still fails, which is exactly why F2 needs its own
text token. The two fixes are complementary and together close all eight.

## F4 — Two tokens silently fall through to the Classic palette in light, contradicting the comment that says they don't · **Medium**

[dashboard-nova.css:539-545](web/app/dashboard/dashboard-nova.css#L539-L545)
states that five tokens are deliberately left undeclared in light because they
*"fall through via the cascade to globals.css's Classic aliases
(`--color-surface: var(--surface-1)`, etc.), which already resolve correctly
under `[data-theme="light"]` at the base token layer."*

I diffed the two theme blocks. Exactly five tokens are declared in dark but not
in light — the comment's list is accurate. But the claim about where they land
is right for three and **wrong for the two that define every card**:

| token | comment claims | actually resolves to | why |
| --- | --- | --- | --- |
| `--color-surface-2` | `var(--surface-2)` | `#EAE3D6` ✓ | not set on `.cd-shell` |
| `--color-surface-3` | `var(--surface-3)` | `#DDD6C8` ✓ | not set on `.cd-shell` |
| `--color-accent-muted` | `var(--accent-subtle)` | `#FDF3DC` ✓ | not set on `.cd-shell` |
| **`--color-surface`** | `var(--surface-1)` `#F3EEE5` | **`#ffffff`** ✗ | [dashboard.css:5](web/app/dashboard/dashboard.css#L5) |
| **`--color-border`** | `var(--surface-5)` `#B8AFA0` | **`#e4dbc8`** ✗ | [dashboard.css:7](web/app/dashboard/dashboard.css#L7) |

The mechanism: `.cd-shell` sets both as literal Classic hex, and `.cd-shell` is
a **nearer ancestor** than `:root`. Custom properties inherit from the nearest
declaring ancestor, so the `.cd-shell` literal is handed to every descendant
before the `:root` alias is ever consulted. Specificity never enters into it —
which is why this reads as correct and isn't. Nova-dark overrides both
explicitly, so dark is unaffected; only light falls through.

Two visible consequences:

1. **Cold pure-white cards on a warm cream page.** Every other value in the
   light palette is warm — bg `#FAF7F2`, text `#1C1008`, bronze `#8A6410`,
   shadow ink `28,16,8`. `#ffffff` is the single hueless element, and the hero
   gradient sitting right beside those cards uses the *warm* `var(--surface-1)`/
   `var(--surface-2)` ([:721-723](web/app/dashboard/dashboard-nova.css#L721-L723)) —
   so warm and cold surfaces appear side by side within one view. The file
   already argues this exact principle for shadows: *"a pure-black drop on a
   warm cream palette reads as dirt, not depth."* The same logic rejects the
   cold white card. (Luminance is a non-issue either way — `#ffffff` and
   `#F3EEE5` separate from the bg at 1.07 and 1.08 respectively. This is a hue
   problem, not a contrast one.)
2. **Border and border-strong come from different hue families.**
   `--color-border` is Classic tan `#e4dbc8` while light explicitly declares
   `--color-border-strong: rgba(201,151,28,0.4)` (gold). One was retuned, its
   sibling was assumed handled.

**Fix:** declare both explicitly in the light block, the way dark does. Either
adopt the intended `var(--surface-1)`/`var(--surface-5)`, or pick warm values
deliberately — but stop relying on a fall-through that doesn't happen, and
correct the comment.

## F5 — Dark's Rahu ribbon label fails AA; the identical light case was fixed · **Medium**

[dashboard-nova.css:490](web/app/dashboard/dashboard-nova.css#L490) — dark sets
`--ribbon-rahu-fg: var(--color-text-strong)` `#ECEEF7` over
`--ribbon-rahu-bg: var(--color-alert-critical)` `#b3573d` = **4.17:1**. The label
renders at `--text-xs` (11px)
([dashboard-today-ribbon-nova.tsx:345](web/components/dashboard-today-ribbon-nova.tsx#L345)),
so 4.5 is required. Fail.

Light hit the same problem and fixed it —
[:745](web/app/dashboard/dashboard-nova.css#L745) sets `--ribbon-rahu-fg: #FFFFFF`
(5.44:1) with the note *"Rahu carries white on its saturated red — near-black
type was a muddy ~3:1."* The reasoning was applied to one theme and not its twin.
This is the same shape as the shadow-token miss in the July light-theme audit.

**Fix:** `--ribbon-rahu-fg: #FFFFFF` in the dark block too → 4.83:1. Its Yama and
Kuligai siblings are fine (8.94 and 11.73) because they blend toward the surface.

## F6 — Two planet glyph colors sit outside the token system; one is under the 3:1 floor · **Low**

[dashboard-dasha.tsx:17,20](web/components/dashboard-dasha.tsx#L17) — `VENUS:
"#7a4880"` and `KETU: "#8c7a6e"` are the only 2 of 7 planets not reading a themed
token; the other five use `var(--chart-*)`/`var(--planet-*)`.

Correcting my first pass, which called Venus "right at the 3:1 floor, not
currently a failure": measured, `#7a4880` on `#04050E` is **2.97:1** — marginally
*under* the floor WCAG 1.4.11 sets for a graphical object that carries meaning.
Ketu is fine at 4.96. `#8B5493` would give 3.67 and stay in the same violet
family; better still, route both through `--planet-*` tokens like their siblings
so they track future base-palette changes.

## F7 — The banned left-border accent stripe is live in 7 places · **Low (craft)**

Carried unchanged from the first pass and still accurate. This project has a
standing rule against colored status stripes on the left edge of a card — the
convention is a full border plus a colored chip/dot/text.

- [dashboard-plan-muhurta-picker-nova.tsx](web/components/dashboard-plan-muhurta-picker-nova.tsx) lines [145](web/components/dashboard-plan-muhurta-picker-nova.tsx#L145), [240](web/components/dashboard-plan-muhurta-picker-nova.tsx#L240), [276](web/components/dashboard-plan-muhurta-picker-nova.tsx#L276), [715](web/components/dashboard-plan-muhurta-picker-nova.tsx#L715), [748](web/components/dashboard-plan-muhurta-picker-nova.tsx#L748) — 5 sites, in a file on this branch's changed list, so this is in-flight work rather than legacy.
- [dashboard-explore-guide-nova.tsx:215](web/components/dashboard-explore-guide-nova.tsx#L215) — on the shared `<Card>` primitive.
- [dashboard-ask-vinaadi.tsx:99](web/components/dashboard-ask-vinaadi.tsx#L99) — the answer caveat callout.

Theme-safe (all read tokens), so this is craft, not correctness.

---

## Checked and cleared

Worth recording so these aren't re-flagged later:

- **Dark theme small text: no failures.** Every ink×surface pair measured
  4.75–17.56. `--color-faint` at α0.60 lands 5.96–6.47 — the July retune from
  0.45 holds up. The one sub-4.5 value, `--color-alert-critical` `#b3573d`
  (3.41–4.21), is a *fill* token, and the codebase already provides
  `--color-alert-critical-text` `#cf6f52` for text use.
- **Phantom tokens are gone.** `--color-warning`, `--color-surface-raised` and
  `--color-fair` — the `var(--x, literal)`-where-`--x`-is-undefined class from
  the July audit — now have **zero** remaining uses.
- **`tokens.css` block ordering is correct.** `[data-theme]` blocks come after
  the `@media (prefers-color-scheme)` block, so an explicit choice always beats
  the OS preference. No override bug.
- **Card/background separation** (light 1.07, dark 1.15) and border-vs-surface
  (light 1.38, dark 1.37) are *not* WCAG violations — decorative card
  boundaries aren't covered by 1.4.11, and both themes carry a real card shadow.
  Deliberate flat aesthetic, correctly executed. Not a defect.
- **`dashboard-share-card.tsx`'s ~19 literals** are correct by design: a
  `<canvas>` context can't read CSS custom properties, and a shareable image
  should not follow the viewer's theme.
- **`dashboard-prasna-widget.tsx`** still reads un-redirected `--panel-*`
  Classic tokens, but Nova imports only its `QUESTION_AREAS` constant, not its
  JSX. The rendered widget is `NovaPrasnaWidget` in
  `dashboard-today-deepdive-extras-nova.tsx` and is correctly token-driven.
  False lead.

## Suggested order

1. **F1** — decide whether System follows the OS or stays dark, then make the
   CSS comment and the EN+TA settings copy tell the truth. Everything else is
   scoped by this answer.
2. **F3 + F2** — one token remap and one new text token; together they close all
   8 light-mode AA failures. Highest correctness-per-line in the list.
3. **F4** — declare `--color-surface`/`--color-border` in the light block and fix
   the comment.
4. **F5**, then **F6**, then **F7**.

Items 2–5 are small, isolated edits to `dashboard-nova.css`. F7 is the only one
touching component files.

---

*One caveat on scope: this is a static analysis of computed token values. It
finds contrast and cascade defects with certainty, but says nothing about
rendered layout, spacing rhythm, or how the palette actually feels in motion. A
browser pass at both themes is still worth doing before you call the light
theme finished.*

---

# Resolution — implemented 2026-08-21

All seven findings are closed. The browser pass the caveat above asked for was
run, it found a further class the static pass could not see, and that class is
closed too. Both themes now measure clean in a real browser across five tabs.

## The F1 decision

**System keeps following the OS. The copy was wrong, not the behaviour.**

UXD-03 was a deliberate, recorded improvement and reverting it would take a
modern default away from every user whose OS says light. The stylesheet comment
that claimed otherwise was the artefact, and it had been load-bearing: it was
the stated justification for leaving the light palette less-verified. Both it
and the EN + TA settings copy now describe what actually runs, and the comment
carries the reclassification explicitly so the next person cannot re-derive the
old assumption:

> *"System" follows your device — Nova Galaxy on a dark device, Warm on a light
> one. Pick a theme by name to hold it.*

Light is treated as a first-class theme from here: `dashboard-nova.css`'s dark
block now states that any Nova-exclusive token added there needs a verified
light twin.

## What was changed

| Finding | Fix |
| --- | --- |
| **F1** | CSS comment rewritten; EN + TA settings copy corrected; `docs/dashboard-i18n-catalog.json` updated to match |
| **F2** | `--color-mid-text` added to both blocks — **and** the underlying light amber moved (see "Beyond the audit" below); 48 amber-as-text call sites repointed |
| **F3** | light `--color-surface-soft` → `var(--surface-1)`; `--ribbon-track-bg` pinned to `var(--surface-2)` so the empty rail keeps the channel it was tuned for |
| **F4** | `--color-surface` and `--color-border` declared explicitly in the light block; card is a **warm** near-white `#FFFCF6`, border is `var(--surface-3)` |
| **F5** | dark `--ribbon-rahu-fg: #FFFFFF` (4.17 → 4.83) |
| **F6** | `--planet-venus` / `--planet-ketu` added to both blocks; `DASHA_COLORS` fully tokenised |
| **F7** | all 7 accent stripes replaced with a full border plus a coloured chip/dot/text |

Two places where the fix deviates from the audit's recommendation, both for the
same reason — **mirror the relationship, not the index**, which is the audit's
own F3 insight applied twice more:

- **F4's border.** The audit named `var(--surface-5)` `#B8AFA0`, which the old
  fall-through comment had claimed. That is 2.12 against the card, where dark's
  border sits at 1.37. `var(--surface-3)` gives 1.41 — the same hairline
  relationship, in the warm family its `--color-border-strong` sibling already
  uses. `#B8AFA0` would have drawn a heavy box light-only.
- **F4's card.** `var(--surface-1)` would have collided with F3's new
  `--color-surface-soft`. `#FFFCF6` keeps the card lighter than the page — the
  actual elevation relationship — while fixing the hue complaint the audit
  raised. Separation is 1.04 vs `#ffffff`'s 1.07, which no eye resolves; the
  card is defined by its shadow and border, as the audit itself established.

## Beyond the audit — what the browser pass found

A permanent gate was added: **`web/e2e/theme-contrast.spec.ts`** bootstraps a
signed-in synthetic account and runs axe's `color-contrast` rule over five
dashboard tabs **in both themes**. Its first run, against a tree where F1–F7
were already fixed, returned **42 failing nodes across 11 ink/ground pairs**.

Two findings, neither reachable by static token math:

### F8 — every semantic ink failed on a 12% tint of itself · **High**

`#2D7A4F` on `#E6ECE2` = 4.35. `#C0392B` on `#F7E5DE` = 4.45. And so on down
the palette. The chip/callout/score-pill idiom — ink on `--color-*-bg` — is
what this design system is *built out of*, and it was the one ground nobody had
measured. A 12% tint costs roughly 0.5 of ratio, and inks tuned to land at
4.6–5.1 on a plain surface have nothing left to pay it with. This is F3's
shape exactly: a surface the palette produces everywhere and was never checked
against.

`--color-accent-strong` was the worst single token at 3.24–3.65, and its cause
was an **inverted ramp**: light's `--color-accent-strong` `#A87D18` was
*lighter* than `--color-accent` `#8A6410`, so "strong" read weaker. It looks
like a hover token and had quietly become an ink in 20+ components.

The fix is a stated **light ink contract** at the head of the light block — the
exact ground set every ink must clear, written precisely rather than
generously, since an overstated guarantee in a comment is how three of this
file's defects survived review in the first place. Every semantic ink was
retuned to meet it; hue families and band ordering are unchanged.

This also supersedes F2's remedy. A `-text` twin only reaches call sites that
*name* the token, and much of this app's amber text is produced at runtime by
`lib/format.ts`'s `scoreBandColor()` as `--color-score-fair` — invisible to any
call-site repointing. Moving the underlying value closes both paths. The
`--color-mid-text` name is kept so the repointed sites still say what they mean.

### F9 — the chart grid was a fourth, unmeasured surface · **Medium**

Light's `--chart-bg` was `var(--color-surface-3)` `#DDD6C8` — the *third*
inverted-index instance. Dark's `--chart-bg` sits one step **up** from its
page; light's sat three steps **down** from its own. The lagna and D9-active
cells then tint that darker still, putting the 10px rasi label at 3.84.
Remapped to `--color-surface-soft`, which is what a recessed grid well is for;
those same cells now measure 4.73 and 4.74.

## Verification

- **`e2e/theme-contrast.spec.ts` — 2 passed**, light and dark, 0 violations.
- Static re-measurement of the resolved token cascade: **0 failing pairs** in
  either theme, including the dark alpha ink ladder (worst 5.96).
- `tsc --noEmit` clean · **443/443 unit tests pass** · lint unchanged (the 4
  pre-existing `no-html-link-for-pages` errors are in untouched marketing
  files).

Three left-border stripes remain in the repo and are deliberately **not**
touched: a `<blockquote>` rule in `natchathiram-visual.tsx` (a typographic
pull-quote, not a status stripe) and two in the marketing
`PoruthamTool.tsx` that use a neutral `--cl-border-2`, outside this audit's
dashboard scope.
