# Paste-in prompt for Codex — Wave 2 close-out

The block below is the prompt. Paste it as-is. It is written for an agent that
has not seen this work before and will not read the four background documents
unless told to.

---

You are working in `D:\sanstro` (Vinaadi AI), branch `harden/production-readiness`.

Your task is to execute `docs/WAVE2_CLOSEOUT_WORK_ORDER_2026-09-21.md` end to end.
**Read that file completely before your first command.** It is the authority for
what to do; this prompt is only the operating contract for how.

Also read `CLAUDE.md` (repo root) and sections 10, 11, 12 and 15 of
`docs/DASHBOARD_EXPERIENCE_AUDIT_2026-09-17.md`. You do not need to read the two
Wave 2 review documents — the work order already carries their conclusions with
the measurements behind them — but they are there if a finding surprises you.

## Environment, non-negotiable

- **PowerShell only.** Chain with `;`, never `&&`. No `head` (use
  `Select-Object -First N`). No `2>&1` on native executables. Every command
  starts from `D:\sanstro`; use repo-relative paths after that.
- **Never run `next dev` inside `web/`.** It deletes the owner's running `:3000`
  build. Rendered checks go through `scripts\ux-audit-stack.ps1` only.
- **Never write a source file with `Out-File`** or any PowerShell redirection —
  it adds a BOM and mojibakes Tamil. Use your editing tools. Files with Tamil
  characters are UTF-8 **without** BOM.
- This is frontend-only work. If a task seems to need the dev database, stop and
  re-read the task — you have misread it.

## Order

The work order's §2 gives the order and the reasoning. **W-1 (commit Wave 2) and
W-2 (one full nine-phase harness run) are hard prerequisites.** Do not start
W-3 or anything after it until both are done:

- W-1, because four untracked source files are one `git clean` from gone.
- W-2, because 17 of 38 ratcheted gates currently describe a build from
  2026-09-18 09:24Z and the CSS rewrite landed at ~18:00Z. Until that run
  exists, you cannot truthfully claim "no other gate regressed" about anything.

After W-2, W-3 … W-10 are independently landable. Keep them in the given order.

## Four laws

**1. Negative control before every PASS.** Run each gate once with your fix
removed, confirm it **fails**, then restore. Keep both metrics folders and name
them in the `Done:` line. Three items in this audit were recorded green by gates
that could not fail — DXA-05's pending hero stands at the loaded height so
DXA-07's height gate passed with and without the fix; DXA-08's gate grepped for
`UPPER_CASE` so nine correctly-cased English leaks shipped behind a green tick;
DXA-10's stars only paint after dusk and the gate ran at 11:37. The two previous
passes on this wave were both asked for negative controls and both skipped them.
Do not skip them. If a control is impossible, say so explicitly and do not
ratchet the gate.

**2. Write the blind spot next to the PASS.** State what each gate cannot see.
The harness walks top-level English panes only, so overlays, sub-tools, reports
and every Tamil surface are outside it by construction. A tick whose scope is
not recorded is inherited by the next reader as "this item is clean".

**3. Follow the status protocol (audit §15) exactly.** Edit the item heading in
place `[ ]` → `[x] YYYY-MM-DD`, add
`Done: <gate> <before> → <after>; metrics <folder>; commit <sha>`, and add the
passing gates to `MUST_PASS` in `web/e2e/dashboard-experience.spec.ts` in the
same change, keyed `"${id} ${check}"` exactly as the harness prints them.
Partial progress is `[~]` with the blocking reason and a count. **Never delete a
finding** — strike through what stopped being true and say why.

**4. Report honestly.** Gate values before and after, failures as failures, and
every check you skipped named. A partially closed item is `[~]` with a count,
never `[x]` with a caveat.

## When you are blocked

The work order marks three owner decisions.

- **OD-1 (the astrology glyph set) is blocking. Do not invent icons.** You may
  do the agent part — Lucide where a true equivalent exists, plus the shared
  36 px icon well — and you should produce the commission brief. Deity and
  festival marks wait.
- **OD-2 (§6's exit tokens vs one curve) and OD-3 (the stale-day dim) are
  proceed-under-assumption.** Implement the work order's recommendation, record
  the assumption in the audit, and flag it in your handoff. Do not stall.

For anything else: do every part that does not depend on the answer, then state
the assumption you proceeded under or ask the one question that matters. Do not
stop with nothing delivered.

## The loop, per task

1. Re-verify the work order's §1 ground-truth rows that the task depends on.
   Each row carries its re-verify command. A recorded conclusion outlives its
   check — that habit has cost this repo months twice.
2. Make the change. One task per commit; no drive-by cleanups.
3. Ladder, from `D:\sanstro\web`:
   `.\node_modules\.bin\tsc.CMD --noEmit`;
   `.\node_modules\.bin\vitest.CMD run`;
   `.\node_modules\.bin\eslint.CMD <changed files> --max-warnings=0`.
   Last known green: tsc clean, 920/920 vitest, 0 eslint errors.
4. Rendered check if the task is visual or motion:
   `ux-audit-stack.ps1 -Action up` → `node web\scripts\ux-audit.mjs --phases <relevant>`
   → compare against W-2's baseline → `-Action down`.
   **The stack builds from a copy at `artifacts\ux-stack\web`; code changes are
   picked up only by `down` then `up` again.** A run against a stale copy
   measures the build you already measured.
5. Negative control. Then ratchet. Then the `Done:` line.
6. Say what the gate cannot see.

## Forbidden

- `git add -A`, `git clean`, `git commit --amend`, `git push`. Stage only your
  own paths — this branch carries unrelated uncommitted work.
- Overwriting an existing test file with a whole-file write. Check `git status`,
  then edit or append.
- Any new `!important` in the dashboard CSS. The blanket `*{…!important}` rule
  that once made DXA-12 read 8/8 was deleted on purpose and must not return.
- `page.goto` per tab in the harness. A fresh document re-issues the dev CSP
  nonce, the lazy chunk is refused, and the blank pane reads as a clean zero.
  Switch tabs by clicking.
- Bare `pointer: coarse` in a media query — it matches the owner's touchscreen
  laptop. The touch axis is `(pointer: coarse) and (hover: none)`; the hover
  axis is `(hover: hover)`.
- Adding Tailwind, shadcn or Radix. This repo has none and uses hand-written
  CSS. Nova (`web/app/dashboard/dashboard-nova.css`) is the only colour and type
  source. Do not take palettes, fonts or section orders from the
  `ui-ux-pro-max` skill.
- Importing a Framer-based primitive through `web/components/ui/index.ts`.
  Import it directly — the barrel must stay lean.
- Rendering a server-chosen display name. Read the language-free key and render
  it through the localiser; `title=` and `aria-label=` count as rendering.
- Deleting anything. Deletion is the last task and needs per-file owner
  approval, one question per file.
- Starting Wave 3 or 4, DXA-18, or the `useMonthlyPanchangam` Calendar twin.
  See the work order's §8.

## Before believing a local failure

Two runs on this machine both call a schema reset, so a second one destroys the
first mid-test and produces a burst of errors that look like a code bug:

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -match 'vitest|playwright|next' } |
  Select-Object ProcessId, CommandLine
```

Trace the parent chain before killing anything. `Code.exe → claude.exe → …`
means another session owns that run — ask first.

## Deliverables

For **each** task, in your running report:

```
W-n  <title>
  changed:   <paths>
  gate:      <key>  <before> → <after>
  negative:  <metrics folder>   (or: not possible, because …)
  passing:   <metrics folder>
  blind spot: <what this gate still cannot see>
  ladder:    tsc <r> · vitest <r> · eslint <r>
  status:    [x] / [~] <reason and count>
```

At the end, one handoff section containing: every gate that moved with its
before/after; **every check you skipped and why**; every assumption you
proceeded under; every new or changed Tamil string, listed for the owner's
sign-off; and the OD-1 commission brief.

Deliverables are Markdown files under `docs/`. Do not create artifacts or
hosted pages.

## Start here

1. `git status --porcelain` and `git log --oneline -5`.
2. Read `docs/WAVE2_CLOSEOUT_WORK_ORDER_2026-09-21.md` in full.
3. Re-verify §1 rows G1-G4.
4. State your plan for W-1 — the exact paths you will stage — and begin.

Do not commit until you have separated Wave 2's paths from the unrelated
uncommitted work on this branch, and say which files you are leaving unstaged
and why.
