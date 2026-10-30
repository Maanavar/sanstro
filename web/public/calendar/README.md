# Calendar artwork

## Temple-tank sky (time of day)

The monthly calendar's header and closing scene follow the reader's clock, not
the theme. Slots and their ground are declared in `web/lib/sky-phase.ts`
(`CALENDAR_SKY_ART`); an empty slot borrows its neighbour, so nothing breaks
while art is missing.

| File | Phase | Ground | Status |
|---|---|---|---|
| `moonlit-temple.png` | night (19:00–05:15) | dark | live |
| `temple-tank-day.*` | day (06:45–17:30) | light | awaiting art |
| `temple-tank-dawn.*` | dawn (05:15–06:45) | light | optional |
| `temple-tank-dusk.*` | dusk (17:30–19:00) | dark | optional |

Generation prompts: `docs/IMAGERY_CHATGPT_PROMPTS_2026-10-14.md`.

**Light theme:** a dark-ground photo is never shown on cream. The same scene is
drawn instead as a bronze line engraving of the reader's hour
(`web/components/temple-tank-engraving.tsx`, no file here). A delivered
light-ground photo (`temple-tank-day.*`) would still be shown feathered on the
light theme in its hours, so keep the engraving's composition in mind: sun or
moon over the main peak, gopuram on the right, empty left third.

## Observance icons

Observances are drawn with the SVG emblem set in
`web/components/observance-glyph.tsx` (kalasam, vel, modakam, tulasi, …), not
with images. The 40 px PNG/JPG files that used to live here
(`chathurthi`, `shasti`, `ekadashi`, `muhurtha`) are no longer referenced;
deleting them is pending per-file approval.
