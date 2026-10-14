# ChatGPT Image Prompts: Calendar Skies & Deity Medallions (2026-10-14)

Companion to `IMAGERY_AUDIT_AND_ART_DIRECTION_2026-10-14.md`. Paste a prompt
into ChatGPT, save the result, and drop the file at the path given. Then tell
Claude: it crops, converts to AVIF/WebP and wires each file in. Every slot
already has code waiting for it, and nothing breaks while a slot is empty.

| # | File to drop | Needed? | Becomes visible |
|---|---|---|---|
| 1 | `web/public/calendar/temple-tank-day.png` | **Yes** | Calendar, 06:45–17:30 |
| 2 | `web/public/calendar/temple-tank-dawn.png` | Optional | Calendar, 05:15–06:45 (else uses day) |
| 3 | `web/public/calendar/temple-tank-dusk.png` | Optional | Calendar, 17:30–19:00 (else uses night) |
| 4 | `web/public/brand/vinaadi-symbol-icon-light.png` | **Done** (exact recolour shipped) | Only if you prefer an alternative |
| 5–11 | `web/public/deities/<key>.png` (7 files) | Yes, for share cards | Panchangam share cards |

---

## Part 1: Calendar sky set (prompts 1–3)

**Before each prompt, attach `web/public/calendar/moonlit-temple.png`** (the
current night scene). Every version must be the *same place from the same
camera*, because the page crops, masks and positions all of them identically.

**Size:** ask for the widest landscape ChatGPT offers. If it returns 3:2
(1536×1024), that is fine: Claude crops the middle band to 3:1. So keep
everything important between 25% and 75% of the image height.

### Prompt 1: Day (required)

```
Use the attached image as an exact composition reference. Recreate the SAME
scene, from the SAME camera position, focal length and horizon height, at
mid-morning in clear, soft daylight.

Keep every element where it is: the tall South Indian temple gopuram on the far
right; the mountain range centred on the horizon; the row of coconut palms and
small stone mandapams along the far bank; the still temple tank filling the
bottom quarter of the frame, with stone steps on the near edges. Remove the
moon. Put a soft, hazy glow of sunlight just above the central mountain peak,
where the moon was.

Light and colour: warm, gentle, slightly hazy morning light. The sky is a very
pale ivory-cream, almost white, palest on the LEFT and only faintly warm near
the horizon. The temple stone is warm sandstone and terracotta, the palms are a
muted sage green, and the water calmly reflects the pale sky and the gopuram.
Overall the image is HIGH-KEY and LOW-CONTRAST: it will sit behind dark text on
a cream web page, so the left third of the sky must be very pale, smooth and
free of detail (no clouds, birds or objects there).

Style: photorealistic, natural, serene, matching the reference's realism.
Avoid: saturated blue sky, harsh shadows, lens flare, HDR look, people, birds,
boats, text, watermark, border, frame, vignette.
Output: the widest landscape format available.
```

**Accept it if:** the gopuram is still far right; the left third is pale and
empty; it would not look out of place printed faintly on cream paper.

### Prompt 2: Dawn (optional)

```
Use the attached image as an exact composition reference. Recreate the SAME
scene from the SAME camera position at first light, a few minutes after
sunrise.

Keep every element where it is (gopuram far right, central mountain range,
palms and mandapams on the far bank, temple tank across the bottom quarter).
Replace the moon with the sun just clearing the central mountain peak: a soft
peach-gold disc with a gentle glow.

Light and colour: sky graded from soft peach and rose at the horizon to pale
cream at the top and on the LEFT. A thin morning mist lies on the water. A few
small oil lamps along the bank are still faintly lit. The gopuram catches warm
first light on its sunward face. Keep the whole image light-valued and soft,
with the left third of the sky pale, smooth and empty, because dark text sits
there.

Style: photorealistic, tranquil, devotional morning mood.
Avoid: people, birds, text, watermark, border, vignette, lens flare, HDR.
Output: the widest landscape format available.
```

### Prompt 3: Dusk (optional)

```
Use the attached image as an exact composition reference. Recreate the SAME
scene from the SAME camera position during the blue hour, about twenty
minutes after sunset.

Keep every element where it is (gopuram far right, central mountain range,
palms and mandapams on the far bank, temple tank across the bottom quarter).
Remove the moon; leave a fading band of warm amber light along the horizon
behind the central mountains.

Light and colour: deep indigo sky at the top shading to dusky violet, then warm
amber at the horizon. Oil lamps are lit along the bank and in the gopuram's
niches, with long golden reflections on the still water. Overall DARK and rich,
close in value to the attached night image: this version sits on a near-black
navy page, and its left third should be the darkest, calmest area of sky.

Style: photorealistic, quiet, devotional evening mood.
Avoid: people, birds, text, watermark, border, lens flare, HDR.
Output: the widest landscape format available.
```

---

## Part 2: Brand mark, light ground (prompt 4, optional)

**Already done without ChatGPT.** `vinaadi-symbol-icon-light.png` is an exact
recolour of the current mark: identical geometry, a gold-to-copper ramp
(≥ 3:1 on cream), and the thin orbit ring thickened slightly. It is now live
in the marketing nav, footer and login page. A generator *redraws* a logo, and
drifting proportions are a brand defect, so use this prompt only if you want a
richer alternative to compare against:

```
Attach: web/public/brand/vinaadi-symbol-icon.png

Recolour this logo for use on a light cream background (#F5F0E5). Do NOT
change, redraw, move or simplify any shape: same outline, same proportions,
same sparkles, same orbit ellipse, same chevrons. Only change the colour
and finish:
- Fill: a rich metallic gradient from antique gold (#A97814) at the top to deep
  copper (#8A4A0C) at the bottom, with a subtle brushed-brass sheen.
- Make the thin orbit ellipse about 1.5× thicker so it stays visible on cream.
- Transparent background, square, 1024×1024, logo centred with the same margins.
No text, no shadow, no background, no border.
```

**Reject it if** any shape differs from the original when the two are overlaid.

---

## Part 3: Weekday deity medallions (prompts 5–11)

Drawn by the share-card canvas inside a circular gold medallion
(`web/components/panchangam-share-card.tsx`). The canvas clips to a circle, so
keep the subject inside the central 80% of the square.

> **Recommendation stands:** have each result checked by someone who knows the
> iconography (the astrologer, or a regular temple-goer) before it ships.
> Generators often get hand counts, held objects and mudras wrong, and this
> audience will notice. Each prompt below ends with the checks to make.

### Shared style block: paste it at the top of every deity prompt

```
Traditional Tanjore (Thanjavur) painting style: rich gold-leaf ornament with
raised gesso relief, inlaid ruby-red and emerald-green glass-stone jewels, fine
black outlines, flat devotional colour, serene forward-facing symmetrical pose.
Background: a plain, deep maroon-brown lacquer, with no scenery unless named
below. Square 1024×1024. The figure is centred and fully inside a central
circle of 80% of the width, because the image will be clipped to a circle.
Reverent and dignified. No text, letters, signature, watermark, frame or
border; nothing important in the corners.
```

### 5 · `surya.png` (Sunday)
```
[style block]
Surya Bhagavan, the Sun deity, shown from the waist up. Exactly TWO arms, each
raised to shoulder height and holding a full-bloom pink lotus. A large radiant
golden sun-disc halo behind the head, tall jewelled crown, red and gold
garments, calm benevolent face.
```
Check: two arms only · a lotus in each hand · sun-disc halo.

### 6 · `shiva.png` (Monday)
```
[style block]
Lord Shiva, seated, shown from the waist up. Four arms: upper right holds a
small damaru (hourglass drum); upper left holds a trishul (trident); lower right
in abhaya mudra (palm facing forward, blessing); lower left in varada mudra.
Matted locks (jata) holding a crescent moon and a tiny stream of the Ganga; a third eye on the forehead with three horizontal ash lines
(vibhuti); a cobra around the neck; rudraksha beads; serene half-closed eyes.
```
Check: crescent moon in hair · third eye · tripundra ash lines · cobra ·
damaru and trident in the upper hands.

### 7 · `murugan.png` (Tuesday)
```
[style block]
Lord Murugan as a radiant youth, single face, two arms, standing. The right hand
holds the Vel upright: a tall spear with a broad, leaf-shaped golden blade (NOT
a trident). The left hand rests in varada mudra. A peacock stands behind him
with its tail fanned in a full circle like a halo. Jewelled crown, three
horizontal ash lines (vibhuti) on the forehead, gentle smile. A small rooster
banner (seval kodi) at one side is optional.
```
Check: one face · the vel is a leaf-bladed spear, not a trident · peacock present.

### 8 · `vishnu.png` (Wednesday)
```
[style block]
Lord Perumal (Vishnu), standing, shown from the knees up, dark blue complexion.
Four arms: upper RIGHT hand holds the Sudarshana chakra (discus); upper LEFT hand
holds the Panchajanya shankha (white conch); lower right in abhaya mudra; lower
left resting on the hip (kati hasta). Tall conical jewelled crown (kireedam);
the Vaishnava namam on the forehead (a white U-shape with a red vertical line
in the centre); yellow silk dhoti (pitambara); garlands of tulasi.
```
Check: chakra in the RIGHT upper hand, conch in the LEFT · namam is a white U
with a red centre line (not horizontal ash lines).

### 9 · `dakshinamurthy.png` (Thursday)
```
[style block, but replace the background line with: background of a large
banyan tree's canopy in deep green and gold behind the figure]
Lord Dakshinamurthy, the silent teacher, seated beneath a banyan tree, facing
forward. Four arms: lower right hand in chin mudra (tip of thumb and index
finger touching, other fingers extended); lower left hand holding a palm-leaf
manuscript; upper right hand holding a rudraksha mala; upper left hand holding
a small flame. Left leg folded on the seat; the right foot rests on a tiny
crouching dwarf figure (Apasmara, symbolising ignorance). Matted hair with a
crescent moon, ash lines on the forehead, deeply serene expression.
```
Check: chin mudra in the lower right hand · palm-leaf book · foot on Apasmara ·
banyan tree.

### 10 · `lakshmi.png` (Friday)
```
[style block]
Goddess Mahalakshmi, seated on a large open pink lotus. Four arms: the two upper
hands each hold a pink lotus; lower right in abhaya mudra; lower left in varada
mudra with a gentle stream of gold coins falling from the palm. Red silk saree
with a gold border, heavy gold jewellery, jewelled crown, kumkum on the
forehead, compassionate smile. Two small white elephants raising water pots at
the upper corners are optional; keep them inside the central circle if included.
```
Check: four arms · lotuses in the upper hands · coins from the lower left ·
seated on a lotus.

### 11 · `shani.png` (Saturday)
```
[style block]
Shani Bhagavan (Sanishwaran), seated on a large black crow, his vahana, which
must be clearly visible. Dark complexion, dark blue and black garments, a
jewelled crown, calm stern expression. Two arms: right hand holding a staff
(danda), left hand in varada mudra. A subtle dark-blue halo.
```
Check: the crow is present and clearly a crow · dark complexion and garments.
Temple depictions vary (some show four arms with a bow); confirm the form your
astrologer prefers before shipping.

---

## After you drop files in

Tell Claude which files are in place. For each one it will:
1. Crop the calendar art to 3:1, master AVIF + WebP at 2400w/1200w (≤ 250 KB),
   and add it to `CALENDAR_SKY_ART` in `web/lib/sky-phase.ts` with its ground
   (`day`/`dawn` = `light`, `dusk` = `dark`).
2. Render each new scene behind real headline text in both themes, at desktop
   and phone, and look at the result before calling it done.
3. Size-check the deity PNGs (≥ 512 px, subject centred in the circle) and
   render a share card with each one.
