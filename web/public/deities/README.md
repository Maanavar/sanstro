# Deity images for Panchangam share cards (Feature 1)

Drop square PNG illustrations here, named by deity key. The share-card canvas
(`web/components/panchangam-share-card.tsx`) loads `/deities/<key>.png` and draws
it inside a circular gold medallion. If a file is missing, the card falls back to
a styled gradient medallion with an ॐ glyph — so the cards work without these
assets, and you can drop in illustrations later with no code change.

Expected files (day-of-week → deity map):

| Key               | Day        | File                     |
|-------------------|------------|--------------------------|
| `surya`           | Sunday     | `surya.png`              |
| `shiva`           | Monday     | `shiva.png`              |
| `murugan`         | Tuesday    | `murugan.png`            |
| `vishnu`          | Wednesday  | `vishnu.png`             |
| `dakshinamurthy`  | Thursday   | `dakshinamurthy.png`     |
| `lakshmi`         | Friday     | `lakshmi.png`            |
| `shani`           | Saturday   | `shani.png`              |

Recommended: 512×512 or larger, transparent or circular-safe background,
subject centered (the medallion clips to a circle).
