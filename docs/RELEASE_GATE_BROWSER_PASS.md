# Release Gate — Live Browser Pass (SHD-05)

A static code read and green `tsc` / `vitest` do **not** prove a UX change works.
Several shipped features have sat "browser pass pending" indefinitely. This
checklist is a **release gate**, not an optional follow-up: a change touching
`web/` UI is not "done" until the relevant boxes below are ticked in a real
browser, at real breakpoints, in both themes and both languages.

## When it applies

Run the gate before merging any change that touches:

- `web/app/**` routes or layouts
- `web/components/dashboard-*` or the Nova shell CSS (`dashboard-nova.css`)
- `web/components/*` shared UI, `globals.css`, or the marketing `clarity-shell`
- font / icon / token / theme wiring

Pure test/doc/type-only changes are exempt.

## Environments (minimum matrix)

| Axis | Values to check |
|------|-----------------|
| Viewport | 360px (small phone), 768px (tablet), 1280px (desktop) |
| Theme | Nova dark, Nova light, marketing (cream) |
| Language | English, Tamil |
| Input | mouse **and** keyboard-only (Tab through) |
| Motion | default **and** OS "reduce motion" on |

Real-device spot check (not just devtools emulation) for anything touching
native inputs (date pickers, `showPicker`) — **iOS Safari + Android Chrome**.

## Per-change checklist

- [ ] The changed screen renders with no console errors and no layout shift on load.
- [ ] Every interactive element shows a **visible focus ring** under keyboard nav (UXD-07).
- [ ] Nothing is clipped or horizontally scrolls the page body at 360px.
- [ ] Tamil strings render with a real bold cut (no faux-bold) and no clipping (SHD-04).
- [ ] Color is never the only signal — score/verdict/state also carries a word or icon (UXD-14).
- [ ] Dialogs trap focus, close on Escape, and restore focus to the trigger (UXD-08).
- [ ] Error states show a mapped, human message — never a raw API `detail` string (UXD-17).
- [ ] Light theme has no dark-on-dark / invisible text regressions (UXD-03).
- [ ] Reduced-motion users get the final state with no animation (MKT-18, UXD-21).

## Sign-off

Record the pass in the PR description:

```
Browser pass: 360/768/1280 · dark+light+cream · en+ta · kbd ✓  (iOS/Android: date pill ✓)
Reviewer: <name>  Date: <YYYY-MM-DD>
```

A PR that changes `web/` UI without this block is not ready to merge.
