# Monthly calendar reference redesign

## Scope

Owner-approved on 15 September 2026: adapt the supplied moonlit calendar
reference to the existing Nova colors and fonts. Existing work was checkpointed
and pushed as `6b76c0f` before implementation.

- Calendar → Monthly only; shared navigation and other calendar views retain
  their existing styling.
- Framed seven-column month grid with adjacent-month dates, real lunar phases,
  category highlights, and a distinct selected-day ring.
- Compact right rail: festival preview, expandable complete agenda, grouped
  observance dates, almanac muhurtham days, other events, filters and quick jumps.
- Day details below the grid follow grid selections and the existing drawer's
  quick jumps/day stepping. No copied or invented personal advice: the monthly
  API supplies observances, tithi, nakshatra and almanac flags.
- Existing Tamil/English catalog, shared Card/Button primitives, Nova semantic
  colors and display/body font tokens. No new font or palette.
- Responsive single-column grid layout below 960px; sidebar sections reflow to
  two columns on tablets and one on phones. Keyboard focus, touch targets,
  complete accessible day names, and reduced-motion behavior are preserved.

## Artwork

Built-in image-generation tool; decorative landscape, optimized at delivery by
Next Image. Source: `web/public/calendar/moonlit-temple.png`. The background moon
is decorative; the actual phase appears in each dated cell and day summary.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: panoramic decorative background
> for Vinaadi Tamil calendar web app. Create one cinematic wide landscape,
> approximately 3:1. Tamil Nadu South Indian temple gopuram silhouette on the
> right third, distant mountain ridge, palms and a quiet temple tank reflecting
> a faint amber horizon. A softly glowing golden full moon above the mountain
> near center. Deep ink navy night sky, muted indigo shadows and restrained
> antique gold moonlight. Left third mostly dark open sky for legible overlay
> text. Natural atmospheric photographic realism, refined peaceful mood.
> Landscape only, no people, no text, no lettering, no logos, no UI, no panels,
> no collage. Keep temple and horizon low in frame. This is a subtle background
> behind a functional calendar, not an illustration of a calendar.

## Density pass (owner review, 15 September 2026)

The owner compared the first build against the reference and flagged too much
white space between rail lines and rounded boxes too large for their content.

Root cause of most of it: the rail's touch floor was written as
`@media (pointer: coarse)`. That also matches a touchscreen laptop driven by a
mouse. The owner's browser matched it, so every filter row, observance date,
"also this month" row and month arrow grew to 44px (the filter rows' 14px
coarse-only indent in the screenshot proves the match). The calendar's own
floor is now `(pointer: coarse) and (hover: none)`, so phones and tablets keep
44px and everything else stays at or above WCAG 2.5.8's 24px. The shared `.ui-btn`
kit rule is unchanged; only the rail heading actions are held at 28px on hybrid
devices.

- Grid cells 124px → 104px min height; adjacent-month days lose the dashed box.
- Observances: wrapped pills → one row per observance, dates as 24px chips.
  Muhurtham days use the same chip in the high tone instead of full buttons.
- Rail cards: one heading size (`--text-md` display), one 16px icon, ghost
  heading actions, 12px between cards.
- Filter switch redrawn in the shared `.ui-toggle` palette.
- Header and closing artwork feathered on every edge. Closing band 170px → 132px.
- Month arrows moved from inline styles into `.nova-cal-nav-btn`.
- Header scrim removed. It was painted in `--color-bg`, which is not the shell's
  gradient ground, so it drew a visible box. The artwork's own mask does the fading.
- Quick Jump folded into the Filter card. Rail headings set at `--text-base`, so
  "Monthly Observances" fits on one line.
- The closing band first grew to the rail's height (132–320px). After the filters
  moved into the grid card, the rail became the shorter column, and a band
  inside the main column only lengthened that side. The band now spans the full
  width under both columns at a fixed 150px minimum.
- Filters moved from the bottom of the rail to a chip bar inside the grid card,
  directly under the month toolbar (owner request, 15 September 2026). A
  filter now sits beside the grid it changes, so its effect is visible where it
  was clicked. Moving the Filter card to the *top of the rail* was considered
  and rejected: it improves reach but leaves the rail's height unchanged, so the
  gap under the closing band stays. Today / This Month / Next muhurtham moved to
  the toolbar's right edge, and the rail is now two cards. A single reset
  control reads Clear while every category is on and Show all once any is off.
- Adjacent-month day numbers first used `--color-faint` at 70% opacity, which
  measured 3.67:1 and failed the e2e axe contrast gate. They are now
  `--color-muted` at regular weight.

The reference's "Good for / Use caution / Avoid" insight columns are still
excluded: the monthly API carries no such advice, and inventing it is out of scope.

## Verification

The monthly sidebar tests cover disclosure, complete agenda ordering, filter
clear/restore, selected-day summary updates, and existing date callbacks.
`web/e2e/calendar-rail-visual.spec.ts` uses the isolated e2e database and opens
the calendar route directly. Final test results are recorded at delivery.

Existing limitation: some festival names supplied by the API are Tamil-only
even in English mode (documented in the earlier calendar rail review). This
change does not invent translations for those source records.
