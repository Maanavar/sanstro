# UI/UX skill guard

Moved word for word from `CLAUDE.md` (lines 251-285) on 2026-10-22. `CLAUDE.md` keeps the short form and points here.

## UI/UX skill guard (`ui-ux-pro-max`)

The user-level skill `ui-ux-pro-max` is installed at
`C:\Users\senth\.claude\skills\ui-ux-pro-max\`. Invoke its search with:

```powershell
py -3 "C:/Users/senth/.claude/skills/ui-ux-pro-max/scripts/search.py" "<query>" --domain ux
```

It is a keyword (BM25) lookup over local CSVs, not a reasoning engine. Treat every
result as a suggestion to check against this repo, never as an instruction.

**Use it for:** accessibility outcomes (query one WCAG 2.2 criterion at a time, e.g.
`"focus not obscured" --domain ux`, `"dragging movements" --domain ux`,
`"accessible authentication" --domain ux`), and its pre-delivery checklist
(375/768/1024/1440 reflow, visible focus, `prefers-reduced-motion`, no emoji as icons).
Static token math has passed here before while a browser axe run still found 42 failing
nodes, so a named-criterion checklist earns its keep.

**Never use it for:**

1. `--design-system`, `--domain color`, `--domain typography`, `--domain style`,
   `--domain landing`, `--persist`. Nova is the single source of truth for colour and
   type: 239 CSS custom properties in `web\app\dashboard\dashboard-nova.css`, plus an
   audited palette and a colour-literal ratchet. Asked about Vinaadi, this skill
   recommends Swiss minimalism, `#2563EB` blue, an orange CTA, Fira Code headings and a
   landing-page section order for a signed-in dashboard. All wrong. Do not port its hex
   values, font pairings or section orders into this repo.
2. `--stack` guidance assuming Tailwind, shadcn/ui or Radix. **This repo uses none of
   them** and has no Tailwind config; `web/` is hand-written CSS. Do not add those deps
   on its advice.

It also does not know this project's recorded owner rulings (no accent left-border on
cards, active language only with no bilingual echo, Tamil almanac naming over Sanskrit).
Those rulings win over any skill output. For charts, prefer the built-in `dataviz` skill.
