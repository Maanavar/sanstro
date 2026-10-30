# Imagery Audit & Art Direction Plan (2026-10-14)

Scope: every raster/vector image, icon and decorative graphic on `web/`, judged in
**both** themes — Nova dark (`#04050E` ground) and light (`#F5F0E5` cream ground,
`web/app/dashboard/dashboard-nova.css:695`). Part A is the defect backlog. Part B
is the creative direction for new imagery, glyphs and motion. Part C is the
pipeline and the gate that keeps it honest.

**How to use this file:** read `CLAUDE.md` first. Nova tokens are the only source
of colour — art prompts below describe palette *in words* and every SVG must take
its ink from tokens (`currentColor` / `var(--…)`), never a new hex. Owner rulings
win over anything here: no accent left-border on cards, active language only (no
bilingual echo), Tamil almanac naming over Sanskrit. Deleting any asset requires
**per-file** approval.

Status legend: `[ ]` open · `[x]` done · `[~]` partial / needs owner decision.

---

## The one principle behind every finding

Every image has a **ground**, and the bug class is always the same: art authored
for one ground, shown on the other.

| Ground class | Meaning | Light-theme behaviour |
|---|---|---|
| **Self-grounded** | Carries its own opaque background (rasi AVIF gems, nakshatra SVG gems, login nebula) | Safe in both themes — reads as an inset jewel |
| **Night-grounded** | Transparent/blended, authored to sit on navy (calendar landscape, gold brand mark, hero sky) | Breaks on cream unless it has a light twin |
| **White-boxed** | Opaque white rectangle baked in (3 of 4 calendar deity PNGs) | Visible box on *both* themes |
| **Ink (`currentColor`)** | SVG/icon font coloured by the surrounding text token (lucide icons) | Correct in both by construction |
| **OS-rendered** | Colour emoji and emoji-presentation Unicode | Off-palette everywhere; differs per OS |

The plan's direction in one line: **move everything into "self-grounded" or
"ink", and give every night-grounded scene a dawn twin.**

---

## Part A — Audit findings (defects)

### IMG-01 `[~]` P0 — Calendar landscape is grey fog in light theme

- **Where:** `MonthlyCalendarLandscape` — `web/components/dashboard-calendar-monthly-panels.tsx:21`;
  CSS `web/app/dashboard/dashboard-nova.css:2062-2085`.
- **Problem:** the art (`/calendar/moonlit-temple.png`) is a night photograph —
  ~85% of its pixels are near-black sky and water. Light theme sets
  `opacity: .1` on it. A night sky at 10% over cream is not a lighter night sky; it
  is a uniform grey smudge with a faint yellow dot. Simulated composite (before the
  edge mask, which fades it further): gopuram, hills, palms and tank reflections are
  all gone; only the moon survives.
- **Why no CSS filter rescues it:** the image's subject *is* darkness — sky and
  silhouettes are both dark, so invert / multiply / sepia either erase the
  silhouettes together with the sky or turn the moon into a black hole.
- **Fix (real):** commission a **dawn twin** of the same composition (see B1) and
  switch per theme through a CSS custom property, e.g.
  `--nova-cal-art: image-set(url(…night.avif) type("image/avif"), url(…night.webp) type("image/webp"))`
  redefined under `[data-theme="light"]`. CSS backgrounds only fetch the URL that
  actually applies, and theming in CSS avoids the SSR/CSR split recorded in the
  2026-07-20 light-theme audit (never read `data-theme` in JS for decoration).
- **Fix (interim, same day, no new art):** stop pretending the night photo is
  atmosphere on cream. Either (a) `opacity: 0` in light, or (b) present it as a
  **self-grounded "night window"**: full opacity, rounded, contained to the right
  ~40% of the header, text kept outside it. (b) follows the same rule that makes
  the rasi gems work on light. Recommend (b).
- **Also:** the source PNG is **1.5 MB** (2172×724) and marked `priority`. Re-master
  as AVIF + WebP at 2400w / 1200w.
- **Acceptance:** light-theme screenshot at 1440 and 375 shows a legible scene (or
  a contained night window); dark theme pixel-identical to today; LCP payload for
  the art ≤ 250 KB.

### IMG-02 `[x]` P1 — Calendar deity icons: 40 px rasters with white boxes

- **Where:** `web/public/calendar/{chathurthi,shasti,ekadashi,muhurtha}.png`,
  rendered by `NovaFestivalIcon` (`dashboard-calendar-monthly-nova.tsx:241`) at
  **14×14** inside month cells.
- **Measured:** chathurthi 40×40 (transparent), shasti 36×40, ekadashi 41×40,
  muhurtha 40×40 — the last three are **24-bit with an opaque white/off-white
  background** (corner pixels `255,255,255` / `246,246,246` / `255,250,254`).
- **Problems:**
  1. White box shows as a pale chip on cream cells and a bright square on navy.
  2. 40 px source is too small for a retina display at 2× DPR (28 px needed even
     at 14 css-px), and too small for any larger use. The calendar README promises
     "displayed at 16–56 px".
  3. Full-colour devotional miniatures (Ganesha, Murugan, Perumal) at 14 px are
     unreadable blobs. Shrinking a deity's form to a dot inside a day cell that
     may also carry "Karinaal (avoid)" is also poor form for a Tamil audience.
  4. Only 3 observances get pictures; the other ~10 get colour emoji (IMG-06), so
     one grid mixes two visual languages.
- **Fix:** replace with the **observance emblem set** (B2): monoline SVG
  emblems (the vel for Sashti, a modakam for Chathurthi, a tulasi sprig for
  Ekadashi, and so on), ink-coloured, theme-safe at 12–56 px. Keep full devotional
  illustration for large, respectful contexts only (share cards, B6).
- **Acceptance:** every observance in a cell uses the same glyph family; zoom to
  400% shows crisp vector edges; both themes show no box.

### IMG-03 `[x]` P1 — Muhurtham Naal hero icon 404s silently

- **Where:** `web/app/(marketing)/muhurtham-naal/MuhurthamNaalContent.tsx:99`
  requests `/calendar/muhurtham.png`. The file on disk is **`muhurtha.png`**.
  `onError` hides the `<img>`, so the page ships with a missing hero mark and no
  console signal anyone looks at.
- **Same drift in docs:** `web/public/calendar/README.md` lists `muhurtham.png`
  and `sashti.png`; disk has `muhurtha.png` and `shasti.png`.
- **Unreferenced copies:** `ekadashi.jpg`, `muhurtha.jpg`, `shasti.jpg` are not
  referenced anywhere. Deleting them needs per-file approval.
- **Fix:** superseded by IMG-02's SVG set. If shipped before that, correct the path.
  Either way, add the asset-existence gate (C3) so this class cannot recur.

### IMG-04 `[x]` P2 — Calendar legend does not match the cells

- **Where:** `NOVA_LEGEND` (`dashboard-calendar-monthly-nova.tsx:60-70`) declares
  `icon` and `emoji` per entry. The legend renderer (`:730`) draws **only** a 9 px
  colour swatch, so both fields are dead.
- **Problem:** a reader sees an elephant/photo in a cell and a coloured square in
  the legend, and cannot connect them. Colour-only legend keys also fail people
  with colour-vision deficiency.
- **Fix:** the legend renders the same emblem the cell renders (B2), with the
  swatch beside it.

### IMG-05 `[~]` P1 — Zodiac Unicode glyphs may render as emoji tiles (verify)

- **Where:** `web/lib/astro-symbols.ts` (`RASI_GLYPHS`) and 4 consumers; 55
  occurrences of U+2648–U+2653 (♈–♓) in `web/`, **zero** U+FE0E
  text-presentation selectors.
- **Why it matters:** these code points default to emoji presentation in Unicode.
  On Windows (Segoe UI Emoji) and Android (Noto Color Emoji) they commonly render
  as **purple rounded tiles**, which are off-palette in both themes and especially
  loud on cream.
- **Fix:** append `︎` in `RASI_GLYPHS` (one-line change at the source of
  truth), or route all remaining glyph uses through `<ZodiacBadge>` / the B3
  rasi glyph set.
- **Acceptance:** browser check on Windows Chrome and an Android device in both
  themes. **Gate blind spot:** a source grep proves the selector is present; it
  cannot prove the font stack honours it. Look at the pixels.

### IMG-06 `[~]` P2 — 91 colour emoji used as UI icons

- **Measured:** 91 occurrences, 51 distinct, across 17 files. Top ones are
  🪔×7 🌑×7 🌕×5 🌘×5 🐘×4 🪷×4 🦚×3 🗓×3 📄×3 🗡×2 🔱×2 💳×2 🛏×2. Also UI-chrome
  emoji such as 📄 💳 📍 📅 👋 🔴 💙.
- **Problem:** emoji are drawn by the OS, not by Nova. They cannot take a token
  colour, look different on Apple/Windows/Android, and their saturated
  red/green/blue fights the gold-on-ink palette (on cream most of all). The
  `ui-ux-pro-max` pre-delivery checklist also says "no emoji as icons".
- **Fix:** UI chrome (📄 💳 📍 📅 👋) → `lucide-react` (already a dependency).
  Religious/astral symbols (🪔 🐘 🦚 🪷 🔱 🌕 🌑) → B2/B3 emblems. Moon phases →
  the existing `MiniMoonGlyph`.
- **Ratchet:** add a vitest that counts pictographic emoji in `web/components` +
  `web/app` and fails if the count rises; lower the ceiling as files migrate.
  Same pattern as the colour-literal ratchet.

### IMG-07 `[x]` P2 — Brand mark is weak on cream (owner decision)

- **Where:** `/brand/vinaadi-symbol-icon.png` — public nav (28 px), footer, login,
  dashboard hero.
- **Measured (approx.):** top yellow ≈ **1.4:1** against `#F5F0E5`, bottom orange
  ≈ **2.3:1**. The thin orbit ellipse disappears on cream. WCAG exempts logos, so
  this is not a compliance failure. It is a brand-presence failure: on light the
  mark reads as a faint sticker.
- **Fix:** a **light-ground variant** of the mark (same geometry, gradient deepened
  to amber→bronze, orbit ring at a heavier weight), switched per theme. Ideally the
  mark is redrawn as an SVG so it can take `--color-accent-strong`.
- **Owner decision:** approve a light-ground variant of the brand mark.

### IMG-08 `[x]` P3 — Rasi/nakshatra gems are heavy on light (owner decision)

- **Where:** `ZodiacBadge` / `NakshatraBadge` — about a dozen surfaces.
- **State:** **legible and correct** in both themes, because they are self-grounded.
  On cream, though, they are the darkest pixels on the page; a family card with
  three gems reads as three black holes. They also hardcode `background: #0e0b1c`
  and a literal `rgba` shadow.
- **Option A (recommended):** keep the dark gem as a deliberate brand "jewel"
  everywhere, and on light only swap the grey border for a gold hairline ring
  (`var(--color-accent)`) so it sits like a set stone, not a hole.
- **Option B:** an "ivory enamel" light twin. This is cheap for the 27 nakshatra
  SVGs (hand-authored: swap the bg gradient and stroke ink). The 12 rasi AVIFs are
  raster, so they need regeneration.

### IMG-09 `[~]` P3 — Share-card deity medallions never load

- **Where:** `panchangam-share-card.tsx:99` loads `/deities/<key>.png`;
  `web/public/deities/` holds only `README.md`. Every share card falls back to the
  gradient + ॐ medallion and fires 7 404s per session. It works, but it is unfinished.
- **Fix:** B6. Until then, skip the fetch for keys listed as absent.

### Verified OK — no action

- **Hero sky / ambient** (`celestial-ambient-nova.tsx`): made theme-aware in the
  2026-07-20 light-theme pass; 12 `useIsLightTheme` branches.
- **Login nebula** (`/assets/opt/nebula-indigo.jpg`): own opaque `#0d0a1c` ground.
- **OG images**: off-site use, theme-independent.

---

## Part B — Art direction: new imagery, glyphs, motion

### Concept: "இரு வானம்" — Two Skies

Vinaadi is a time-keeping instrument: tithi, nakshatra, nalla neram. The two
themes should therefore be **two times of the same day**, not two colour schemes:

- **Nova = இரவு (night).** The temple tank under the moon, gold leaf on lacquer,
  lamp-light. This is already the house style and it is good.
- **Light = விடியல் (dawn).** The same places at sunrise: rice-flour kolam on a
  washed threshold, palm-leaf manuscript (ஓலைச் சுவடி), brass, turmeric and
  kumkum as *accents only*, Thanjavur-fresco softness. **Not** generic "white UI".

Rule: **every scene is drawn twice from one composition.** Same horizon, same
gopuram position, same empty left third for headline text. Only the hour changes.
That keeps layout masks, `object-position` and text placement identical across
themes, which is why IMG-01's twin can reuse today's CSS.

### B1 `[ ]` Scene headers (Two Skies set)

Ultra-wide 3:1 scenes, each with a night and dawn rendition, AVIF + WebP at
2400w and 1200w, ≤ 250 KB each:

| Surface | Night (Nova) | Dawn (light) |
|---|---|---|
| Calendar → Monthly | *exists* — moonlit temple tank | Same tank at sunrise, sun where the moon is, mist on water |
| Today | Gopuram with first star | Kolam being drawn at a doorstep, sun disc rising |
| Family & Charts | Thinnai courtyard, single lamp | Same courtyard, morning light through the pillars |
| Porutham / Compatibility | Two lamps facing, mango-leaf thoranam | Same, daylight, jasmine strings |
| Muhurtham Naal (public) | Wedding pandal under stars | Pandal with vazhai maram at dawn |
| Numerology | Palm-leaf manuscript by lamplight | Same manuscript, sunlit |

Production: generate the **dawn twin by image-to-image from the night master**
(not a fresh prompt) so the silhouette registers. The night prompt is recorded in
`docs/CALENDAR_MONTHLY_REDESIGN_2026-09-15.md` §Artwork; extend it with
"identical composition, time of day: sunrise, soft warm haze, pale sky in left
third". Record each final prompt beside its asset.

### B2 `[~]` Observance emblem set (replaces IMG-02 / most of IMG-06)

Monoline SVG, 24×24 grid, 1.5 px stroke to sit beside lucide, `stroke="currentColor"`,
legible at 12 px, tested at 14/16/24/56. Emblems, **not** deity faces:

| Observance | Emblem |
|---|---|
| Muhurtham | Kalasam (pot with mango leaves + coconut) |
| Pournami / Amavasai | Full / new moon (reuse `MiniMoonGlyph` geometry) |
| Chathurthi | Modakam, or a single tusk |
| Sashti | Vel |
| Ekadashi | Tulasi sprig |
| Pradosham | Nandi in profile |
| Shivarathri | Trident |
| Kiruthigai | Agal vilakku (clay lamp) |
| Ashtami | Eight-petal lotus |
| Festival | Thoranam arc |
| Karinaal | Hollow day-disc with a bar (never red-on-red; uses `--color-alert-critical`) |
| Thai Poosam / Panguni Uthiram etc. | Kavadi / star-cluster variants (phase 2) |

Ship as one React component (`<ObservanceGlyph kind>`) with a typed `kind` union.
Then the legend (IMG-04), cells, the agenda rail and the Muhurtham page all render
the same mark.

### B3 `[ ]` Astral glyph set: navagraha + rasi line glyphs

- **Navagraha (9):** planets currently appear as Unicode ☉☽♂… with the same
  font/emoji risk as IMG-05. Draw 9 SVG glyphs in the B2 style. Suggested forms:
  Surya rayed disc, Chandra crescent, Sevvai spear-tipped circle, Budhan,
  Guru, Sukran, Sani with staff, Rahu serpent head, Ketu serpent tail.
- **Rasi line glyphs (12):** monoline ink versions of the gem artwork for dense
  contexts (tables, chips) where a 40 px gem is too heavy.
- Use: dasha timeline, hora wheel, planet tables, chart cells.

### B4 `[ ]` Kolam system: Vinaadi's signature graphic

The single most ownable motif available. A pulli kolam is **one continuous line
around a dot grid**, which suits SVG exactly:

- **Generator:** a small pure function `kolamPath(grid, seed)` that returns an SVG
  path for an n×n pulli grid. It is deterministic, so a user's kolam can be seeded
  from their birth nakshatra: same person, same kolam, everywhere.
- **Uses:** section dividers, empty states, loading skeleton ornament, share-card
  border, the profile avatar fallback (a personal kolam instead of initials).
- **Theme:** chalk-white ink on Nova, rice-flour/bronze ink on dawn — through
  `currentColor`, so there is no twin to maintain.

### B5 `[ ]` Empty-state & state spot illustrations

Small (160–240 px) self-grounded vignettes, one family style, both themes:
no family members yet (empty thinnai) · no events this month (still tank) ·
offline / error (lamp guttering, not a broken robot) · first chart being
calculated (kolam drawing itself, B7) · quota reached (lamp dimmed, back
tomorrow). Copy stays in the active language only.

### B6 `[ ]` Deity medallions: owner decision required

The 7 weekday deity PNGs for share cards (`web/public/deities/README.md`).
**Recommendation:** commission a human artist in a single consistent
Tanjore-inspired style, or use **emblems** (B2 style at large size, gold on
lacquer) instead of figures. Do **not** ship AI-generated deity figures: errors
in iconography (mudra, vahana, number of arms) are visible to exactly the
audience this product serves, and the cultural cost of a wrong form is high.

### B7 `[ ]` Motion vocabulary

All CSS/SVG (no new animation dependency), all inside
`@media (prefers-reduced-motion: no-preference)`, with a static end-state for
reduced motion. Each motion **means** something; none is decoration-only.

| Motion | Meaning | Where |
|---|---|---|
| **Kolam draw-on** (`stroke-dashoffset`, ~1.2 s, once per session) | "Your chart is being laid out" | First chart load, onboarding complete |
| **Vilakku flame** (2-frame flicker, low amplitude) | "Nalla neram is active now" | Today hero, time strip |
| **Shadow sweep** across the day arc | Rahu kalam / yamagandam passing | Today day-timeline |
| **Sun/moon on the day arc** moving in real time | Where in the day you are | Today hero |
| **Moon-phase morph** when changing month | Lunar continuity | Calendar month nav |
| **Constellation twinkle** on hover/focus | Nakshatra identity | Natchathiram pages, badges |
| **Gem glint** (one diagonal sheen, on reveal only) | New insight unlocked | Report sections |

Guardrails: ≤ 1 ambient loop visible per viewport; nothing loops under text being
read; no motion > 5 s without pause control (WCAG 2.2.2).

---

## Part C — Pipeline and guardrails

### C1 Asset rules

- **Glyphs/emblems/ornament:** SVG, `currentColor`, no embedded hex, optimised
  with SVGO, ≤ 2 KB each.
- **Scenes:** AVIF + WebP, two widths, ≤ 250 KB, decorative `alt=""`, never
  `priority` unless above the fold on the default route.
- **Gems:** keep self-grounded; document the ground in a comment, as
  `ZodiacBadge` already does.
- **Naming:** one canonical spelling per file, matching the code's map
  (the `muhurtha`/`muhurtham` and `shasti`/`sashti` drift is IMG-03).

### C2 Art manifest

`web/lib/art-manifest.ts`: every asset path with `ground: "self" | "night" | "dawn" | "ink"`
and, for `night`, its `twin` path. Components import paths from the manifest,
not string literals.

### C3 Gate (and what it cannot see)

A vitest that: (1) every manifest path exists on disk; (2) every `night` asset has
an existing `dawn` twin; (3) no `/calendar/`, `/brand/`, `/deities/` string
literal appears outside the manifest; (4) the emoji ratchet from IMG-06.

**Run it once with IMG-03's bad path restored and confirm it fails.**

**Blind spot, written down beside the PASS:** this gate proves files exist and
pair up. It **cannot** see whether a twin *looks right*, whether a glyph is
legible at 14 px, or contrast of art against ground. Each new asset still needs a
**contact sheet**: the asset at every rendered size, on `#04050E` and `#F5F0E5`,
in Tamil and English layouts, reviewed by eye. That is the loop that produced the
nakshatra set.

---

## Suggested order

1. **This week (no new art):** IMG-01 interim (night window), IMG-03 path fix,
   IMG-05 `︎`, C3 gate skeleton.
2. **Glyph sprint:** B2 observance emblems → closes IMG-02, IMG-04, most of IMG-06.
   Then B3.
3. **Two Skies art:** calendar dawn twin first (closes IMG-01 properly), then the
   other B1 scenes. Re-master all as AVIF/WebP.
4. **Signature layer:** B4 kolam generator + B7 kolam draw-on, vilakku, day-arc.
5. **Owner-gated:** IMG-07 brand light variant, IMG-08 gem treatment, B6 deities.

## Owner rulings (2026-10-14)

1. **Scene art follows the clock, not the theme** (owner: "why not a day photo
   and a separate night photo based on time"). Adopted, and it supersedes the
   theme-keyed "Two Skies" mapping in Part B: the hour picks the scene
   (dawn/day/dusk/night), and the theme only picks the *presentation*:
   matching ground → feathered atmosphere; opposite ground → framed window.
   That keeps every combination legible, including night art on light and day
   art on Nova.
2. **Brand mark light variant:** approved. Shipped as an exact recolour (no
   regeneration); a ChatGPT prompt is on file for an alternative.
3. **Gems:** delegated to Claude → option A (gold setting on light grounds).
4. **Deity medallions:** the owner will generate them in ChatGPT. Prompts with
   per-deity iconography checks are in `docs/IMAGERY_CHATGPT_PROMPTS_2026-10-14.md`;
   the advice to have a knowledgeable person verify each one stands.
5. **Concept:** delegated to Claude → as ruling 1. The light theme's *ornament
   language* (kolam, brass, palm-leaf) remains the direction for glyphs, empty
   states and dividers (B2–B5).

## Shipped 2026-10-14 (uncommitted)

- **IMG-01:** `web/lib/sky-phase.ts`: phase from the local clock (fixed
  Tamil Nadu civil bands) → art slot with a declared ground; empty slots fall
  back (dawn→day→night, dusk→night). Header and closing scene both key their
  CSS off `data-sky-ground`. The `opacity: .1` rule is gone. On the opposite
  ground the scene is a framed 3:1 window placed **beside** text, never under
  text or a control: in the header it sits in flow under the view switch, at
  the switch's width (desktop; hidden ≤ 720 px so the calendar isn't pushed
  down); the closing becomes a postcard (line beside the window, stacked on
  phones). **Remaining:** day/dawn/dusk art (owner, via the prompts doc).
  - *Correction, same day:* the first version absolutely positioned the header
    window at the header's right edge, under the Panchangam/Monthly/Best Dates
    switch. The owner's screenshot caught it. The static harness had omitted
    the switch, so it could not see the collision: **a harness that leaves out
    a sibling cannot test that sibling's overlap.** The harness now mirrors the
    real header DOM, and `sky-phase.test.ts` pins the in-flow placement and
    source order (both checks confirmed to fail on the old code).
- **IMG-02/03/04:** `<ObservanceGlyph>` (9 emblems, 1.75 stroke, `currentColor`)
  in month cells, legend, agenda rail, the "Next muhurtham" button and the
  public Muhurtham Naal hero (which was 404ing). Hindu festivals without their
  own emblem take the thoranam. Civic, world and other-faith days take
  **none**: a Tamil festoon on Eid, Christmas or World Health Day would be
  false. This answers glyph brief §5b for the month grid. `festivalImagePath` deleted.
- **IMG-05:** U+FE0E on `RASI_GLYPHS`; the login curtain now uses the shared
  table. `RasippalanTool` / `astro-symbols.tsx` copies are fallback-only
  (rendered only if a badge's artwork is missing) and were left alone.
  **Still owed:** a look at real Windows/Android pixels.
- **IMG-07:** `public/brand/vinaadi-symbol-icon-light.png` (gold→copper,
  ≥ 3:1 on cream, orbit thickened) in the marketing nav, footer and login. The
  Nova dashboard hides the mark, so no theme switch was needed.
- **IMG-08:** `vn-gem` class + `--gem-ring` token (Nova light, `.clarity-shell`),
  drawn as an outline so the badges' inline border literal stays byte-identical
  (the colour ratchet keys on source text).

**Gates and their blind spots:** `web/lib/sky-phase.test.ts` (phase bands,
fallback, delivered files exist, no blanket light opacity; the CSS check was
confirmed to fail on the old rule) and `web/lib/observance-kind.test.ts`
(name→emblem, no `/calendar/*.png` in the grid, legend draws its emblem).
Neither can see pixels. The rendering was checked by loading the real
stylesheets in headless Chromium against the same markup (both themes,
1280 and 375 px), **not** in the authenticated app: the local dev server
proxies to the real dev DB, and logging in would have meant creating an
account there. **The Tamil-mode layout of the header window is unchecked.**

## Rework 2026-10-28 — IMG-01: the light theme gets an engraving, not the photo

**Owner:** the monthly calendar's top and bottom scenes "are apt for Nova but
look awkward in the light theme." By then the light header had no art at all,
and the closing was the night photo as a framed dark panorama with a black
scrim and white type: the only dark object on a cream page.

**Diagnosis:** the night photo's subject is darkness. On cream it can only be
fog (10%), a window, or a slab. The day twin that would have fixed it was
never delivered. Waiting for art left light-theme users with a broken page.

**Change:** on the light theme a dark-ground photo is never shown. In its
place is `<TempleTankEngraving>` (`web/components/temple-tank-engraving.tsx`):
the same temple tank as a bronze line engraving, like an almanac frontispiece.
It is pure SVG in `currentColor` (ink `--color-accent`), uses no colour
literals, and needs no asset. It registers with the photo (sun or moon over
the main peak, gopuram on the right, mandapams on the ghats, empty left sky).
- **Ruling 1 holds:** the engraving draws the reader's hour. Day has the sun
  with rays and birds. Dawn has the sun rising behind the hills east of the
  peak, with mist. Dusk has it setting west of the peak, with homing birds.
  Night has the moon, halo, stars and lit mandapam lamps reflected in the
  tank. Before mount the sky is empty (the server cannot know the clock).
- **Header** shows `scene="sky"`: hills, palms and mandapams, no gopuram. A
  full plate there stood the view switch on the gopuram's crown. It is
  full-bleed atmosphere like the photo on Nova, faded out under the copy,
  and hidden at 720 px and below.
- **Closing** shows the full plate, water dissolving into the page, with its
  line set in the plate's empty sky (a caption beneath on phones). There is
  no frame, no scrim and no white type.
- **Nova** is unchanged (the photo, feathered). The Nova + light-art branch
  (day slot, still undelivered) keeps the framed panorama. Its rules were
  collapsed from three layered generations into one block.
- Theme is still never read in JS: both media render and CSS picks one.

**Gates:** `temple-tank-engraving.test.tsx` checks the hour drawn, lamps at
night only, the sky empty before mount, `aria-hidden`, no colour literals,
unique mask ids per instance, the gopuram absent from the sky scene, and that
every hour's body plus glow and rays fits inside the band crop and clear of the
closing's copy column. `sky-phase.test.ts` checks that the light theme hides
the dark-ground photo and shows the engraving, that the light closing has no
scrim and no white copy, and that the header passes `scene="sky"`. Each was
run once with its fix removed (band crop back to y=110, `scene="sky"` dropped,
the CSS assertions against `HEAD`'s stylesheet) and failed.
**Blind spot:** none of these sees pixels. The look was reviewed in headless
Chromium through a temporary unauthenticated route rendering the real
components and stylesheets: day/night 1440, dawn 1280, Tamil dusk 1100,
night 390, Nova night 1440. The authenticated page (real month grid, sidebar,
real header data) was not shot.

**Known, unchanged:** the header photo is still `priority` and so is still
fetched on the light theme, where it is hidden (1.5 MB; it already was before
this change). Re-mastering it as AVIF/WebP (IMG-01 "Also") remains open.

**Not done:** IMG-06 beyond the calendar (~80 emoji remain across 16 files);
deleting the seven now-unreferenced calendar icons (`chathurthi.png`,
`ekadashi.png/.jpg`, `muhurtha.png/.jpg`, `shasti.png/.jpg`; per-file approval);
deity medallions (owner art).
